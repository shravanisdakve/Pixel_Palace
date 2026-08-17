/**
 * PixelPalaceAchievements
 * Data-driven achievement engine for Pixel Palace.
 *
 * Consumes PixelPalaceAchievementDefinitions for all achievement data.
 * Uses generic condition evaluation — no per-achievement logic.
 * Persists via PixelPalaceStorage. Integrates with platform events.
 *
 * Dependencies (load order):
 *   1. pixel_palace_storage.js
 *   2. pixel_palace_player.js
 *   3. pixel_palace_registry.js
 *   4. pixel_palace_progression_config.js
 *   5. pixel_palace_progression.js
 *   6. pixel_palace_achievements.js  (definitions)
 *   7. pixel_palace_achievements.js  (this file, engine)
 *   8. pixel_palace_core.js  (integrates via endSession)
 *
 * @namespace PixelPalaceAchievements
 */
var PixelPalaceAchievements = (function () {
    'use strict';

    var Storage = PixelPalaceStorage;
    var Registry = PixelPalaceRegistry;
    var Definitions = PixelPalaceAchievementDefinitions;
    var Progression = PixelPalaceProgression;

    // ========================================================
    // STORAGE
    // ========================================================
    var STORAGE_KEY = 'achievements';

    // ========================================================
    // INTERNAL HELPERS
    // ========================================================

    /**
     * Load persisted unlock state from storage.
     * Returns a map of { achievementId: { unlockedAt, progressAtUnlock } }.
     * @returns {Object}
     */
    function loadState() {
        var raw = Storage.get(STORAGE_KEY);
        if (!raw || typeof raw !== 'object') return {};
        return raw;
    }

    /**
     * Save unlock state to storage.
     * @param {Object} state
     */
    function saveState(state) {
        Storage.set(STORAGE_KEY, state);
    }

    /**
     * Get the definition for an achievement by ID.
     * @param {string} id
     * @returns {Object|null}
     */
    function getDefinition(id) {
        var defs = Definitions.ACHIEVEMENTS;
        for (var i = 0; i < defs.length; i++) {
            if (defs[i].id === id) return defs[i];
        }
        return null;
    }

    /**
     * Get the current count of all categories in GameRegistry.
     * Used by the polyplayer achievement to resolve "all categories".
     * @returns {number}
     */
    function getTotalCategories() {
        var cats = {};
        var games = Registry.getAll();
        for (var i = 0; i < games.length; i++) {
            cats[games[i].category] = true;
        }
        return Object.keys(cats).length;
    }

    // ========================================================
    // METRIC COLLECTION
    // ========================================================
    // Reads current player state from existing platform modules.
    // No hardcoded game data — everything comes from sessions, scores, progression.

    /**
     * Collect all metrics needed for condition evaluation.
     * Returns a map of metric names to current values.
     * @returns {Object}
     */
    function collectMetrics() {
        // Games completed: count of ended sessions
        var sessions = PixelPalaceStorage.get('sessions', []);
        var gamesCompleted = 0;
        for (var i = 0; i < sessions.length; i++) {
            if (sessions[i].endedAt !== null) gamesCompleted++;
        }

        // Unique games played: count of distinct gameIds in ended sessions
        var gamesPlayed = {};
        for (var i = 0; i < sessions.length; i++) {
            if (sessions[i].endedAt !== null) {
                gamesPlayed[sessions[i].gameId] = true;
            }
        }
        var uniqueGamesPlayed = Object.keys(gamesPlayed).length;

        // Categories played: distinct categories from played games
        var categoriesPlayed = {};
        var playedGameIds = Object.keys(gamesPlayed);
        for (var i = 0; i < playedGameIds.length; i++) {
            var game = Registry.getById(playedGameIds[i]);
            if (game && game.category) {
                categoriesPlayed[game.category] = true;
            }
        }
        var uniqueCategoriesPlayed = Object.keys(categoriesPlayed).length;
        var totalCategories = getTotalCategories();

        // Personal bests: count all PB entries
        var pbs = PixelPalaceStorage.get('personal_bests', {});
        var personalBestCount = 0;
        var gameIdsWithPB = [];
        var pbGameIds = Object.keys(pbs);
        for (var i = 0; i < pbGameIds.length; i++) {
            personalBestCount++;
            gameIdsWithPB.push(pbGameIds[i]);
        }

        // Level from progression
        var level = Progression.getLevel();
        var totalXp = Progression.getTotalXp();

        return {
            gamesCompleted: gamesCompleted,
            uniqueGamesPlayed: uniqueGamesPlayed,
            categoriesPlayed: uniqueCategoriesPlayed,
            totalCategories: totalCategories,
            personalBestCount: personalBestCount,
            gameIdsWithPB: gameIdsWithPB,
            level: level,
            totalXp: totalXp
        };
    }

    // ========================================================
    // GENERIC CONDITION EVALUATOR
    // ========================================================

    /**
     * Evaluate a single condition against current metrics.
     * This is the generic evaluator — no achievement-specific logic.
     *
     * @param {Object} condition — from achievement definition
     * @param {Object} metrics — from collectMetrics()
     * @returns {boolean}
     */
    function evaluateCondition(condition, metrics) {
        var ct = Definitions.CONDITION_TYPES;

        switch (condition.type) {
            case ct.COUNT:
                return evaluateComparison(metrics[condition.metric], condition.operator, condition.value);

            case ct.UNIQUE_COUNT:
                if (condition.metric === 'categoriesPlayed') {
                    var target = condition.value === -1 ? metrics.totalCategories : condition.value;
                    return evaluateComparison(metrics.categoriesPlayed, condition.operator, target);
                }
                return false;

            case ct.THRESHOLD:
                return evaluateComparison(metrics[condition.metric], condition.operator, condition.value);

            case ct.PERSONAL_BEST:
                // For a specific game: check if that game has a PB
                if (condition.gameId) {
                    return metrics.gameIdsWithPB.indexOf(condition.gameId) !== -1;
                }
                // For any game: check if any PB exists
                return metrics.personalBestCount > 0;

            case ct.PERSONAL_BEST_COUNT:
                return evaluateComparison(metrics.personalBestCount, condition.operator, condition.value);

            default:
                return false;
        }
    }

    /**
     * Evaluate a numeric comparison.
     * @param {number} current
     * @param {string} operator — >=, <=, >, <, ===, ==
     * @param {number} target
     * @returns {boolean}
     */
    function evaluateComparison(current, operator, target) {
        switch (operator) {
            case '>=': return current >= target;
            case '<=': return current <= target;
            case '>':  return current > target;
            case '<':  return current < target;
            case '===': return current === target;
            case '==':  return current == target;
            default: return false;
        }
    }

    /**
     * Evaluate all conditions for an achievement.
     * All conditions must be met (AND logic).
     *
     * @param {Object} definition — achievement definition
     * @param {Object} metrics — from collectMetrics()
     * @returns {boolean}
     */
    function evaluateAchievement(definition, metrics) {
        if (!definition || !definition.conditions) return false;
        for (var i = 0; i < definition.conditions.length; i++) {
            if (!evaluateCondition(definition.conditions[i], metrics)) {
                return false;
            }
        }
        return true;
    }

    // ========================================================
    // PROGRESS CALCULATION
    // ========================================================

    /**
     * Calculate progress toward an achievement.
     * Returns current/target/percentage for threshold achievements,
     * or a boolean for binary achievements.
     *
     * @param {Object} definition — achievement definition
     * @param {Object} metrics — from collectMetrics()
     * @returns {Object} { current, target, percentage, complete }
     */
    function calculateProgress(definition, metrics) {
        if (!definition || !definition.conditions || definition.conditions.length === 0) {
            return { current: 0, target: 1, percentage: 0, complete: false };
        }

        // For single-condition achievements, report progress on the primary condition
        var cond = definition.conditions[0];
        var ct = Definitions.CONDITION_TYPES;

        switch (cond.type) {
            case ct.COUNT: {
                var current = metrics[cond.metric] || 0;
                return {
                    current: current,
                    target: cond.value,
                    percentage: Math.min(Math.round(current / cond.value * 100), 100),
                    complete: current >= cond.value
                };
            }
            case ct.UNIQUE_COUNT: {
                var current2 = metrics.categoriesPlayed || 0;
                var target2 = cond.value === -1 ? metrics.totalCategories : cond.value;
                return {
                    current: current2,
                    target: target2,
                    percentage: Math.min(Math.round(current2 / target2 * 100), 100),
                    complete: current2 >= target2
                };
            }
            case ct.THRESHOLD: {
                var current3 = metrics[cond.metric] || 0;
                return {
                    current: current3,
                    target: cond.value,
                    percentage: Math.min(Math.round(current3 / cond.value * 100), 100),
                    complete: current3 >= cond.value
                };
            }
            case ct.PERSONAL_BEST: {
                var has = cond.gameId
                    ? metrics.gameIdsWithPB.indexOf(cond.gameId) !== -1
                    : metrics.personalBestCount > 0;
                return {
                    current: has ? 1 : 0,
                    target: 1,
                    percentage: has ? 100 : 0,
                    complete: has
                };
            }
            case ct.PERSONAL_BEST_COUNT: {
                var current4 = metrics.personalBestCount || 0;
                return {
                    current: current4,
                    target: cond.value,
                    percentage: Math.min(Math.round(current4 / cond.value * 100), 100),
                    complete: current4 >= cond.value
                };
            }
            default:
                return { current: 0, target: 1, percentage: 0, complete: false };
        }
    }

    // ========================================================
    // UNLOCKING
    // ========================================================

    /**
     * Unlock an achievement. Idempotent — second call is a no-op.
     * Awards XP reward if defined.
     *
     * @param {string} achievementId
     * @param {Object} metrics — current metrics at unlock time
     * @returns {Object} { unlocked: boolean, isNew: boolean, reward?: Object }
     */
    function unlock(achievementId, metrics) {
        var state = loadState();

        // Already unlocked
        if (state[achievementId] && state[achievementId].unlockedAt) {
            return { unlocked: true, isNew: false };
        }

        var definition = getDefinition(achievementId);
        if (!definition) {
            return { unlocked: false, isNew: false };
        }

        // Record unlock
        state[achievementId] = {
            unlockedAt: new Date().toISOString(),
            progressAtUnlock: calculateProgress(definition, metrics)
        };
        saveState(state);

        // Award XP reward if defined
        var rewardResult = null;
        if (definition.reward && definition.reward.type === 'xp' && definition.reward.amount > 0) {
            rewardResult = Progression.awardXp(
                definition.reward.amount,
                'achievement_' + achievementId,
                {
                    transactionId: 'achievement_' + achievementId,
                    achievementId: achievementId
                }
            );
        }

        return {
            unlocked: true,
            isNew: true,
            reward: rewardResult
        };
    }

    // ========================================================
    // EVENT EVALUATION
    // ========================================================

    /**
     * Evaluate all achievements and unlock any that are now met.
     * Called after platform events (session end, level up, etc.).
     *
     * @param {string} [eventType] — optional event type for logging
     * @returns {Array} Array of newly unlocked achievements
     */
    function evaluate(eventType) {
        var metrics = collectMetrics();
        var state = loadState();
        var newlyUnlocked = [];
        var defs = Definitions.ACHIEVEMENTS;

        for (var i = 0; i < defs.length; i++) {
            var def = defs[i];

            // Skip already unlocked
            if (state[def.id] && state[def.id].unlockedAt) continue;

            // Evaluate conditions
            if (evaluateAchievement(def, metrics)) {
                var result = unlock(def.id, metrics);
                if (result.isNew) {
                    newlyUnlocked.push({
                        id: def.id,
                        name: def.name,
                        description: def.description,
                        icon: def.icon,
                        reward: result.reward
                    });
                }
            }
        }

        return newlyUnlocked;
    }

    // ========================================================
    // PUBLIC READ API
    // ========================================================

    /**
     * Get all achievement definitions.
     * @returns {Array}
     */
    function getAll() {
        return Definitions.ACHIEVEMENTS;
    }

    /**
     * Get a single achievement definition by ID.
     * @param {string} id
     * @returns {Object|null}
     */
    function getAchievement(id) {
        return getDefinition(id);
    }

    /**
     * Get all unlocked achievements with unlock metadata.
     * @returns {Array}
     */
    function getUnlocked() {
        var state = loadState();
        var defs = Definitions.ACHIEVEMENTS;
        var result = [];
        for (var i = 0; i < defs.length; i++) {
            if (state[defs[i].id] && state[defs[i].id].unlockedAt) {
                result.push({
                    definition: defs[i],
                    unlockedAt: state[defs[i].id].unlockedAt,
                    progressAtUnlock: state[defs[i].id].progressAtUnlock
                });
            }
        }
        return result;
    }

    /**
     * Get all locked achievements with current progress.
     * @returns {Array}
     */
    function getLocked() {
        var state = loadState();
        var metrics = collectMetrics();
        var defs = Definitions.ACHIEVEMENTS;
        var result = [];
        for (var i = 0; i < defs.length; i++) {
            if (!state[defs[i].id] || !state[defs[i].id].unlockedAt) {
                var progress = calculateProgress(defs[i], metrics);
                result.push({
                    definition: defs[i],
                    progress: progress
                });
            }
        }
        return result;
    }

    /**
     * Get progress for all achievements (locked and unlocked).
     * @returns {Array}
     */
    function getProgress() {
        var state = loadState();
        var metrics = collectMetrics();
        var defs = Definitions.ACHIEVEMENTS;
        var result = [];
        for (var i = 0; i < defs.length; i++) {
            var isUnlocked = !!(state[defs[i].id] && state[defs[i].id].unlockedAt);
            var progress = calculateProgress(defs[i], metrics);
            result.push({
                id: defs[i].id,
                name: defs[i].name,
                description: defs[i].description,
                icon: defs[i].icon,
                category: defs[i].category,
                hidden: defs[i].hidden,
                unlocked: isUnlocked,
                unlockedAt: isUnlocked ? state[defs[i].id].unlockedAt : null,
                progress: progress
            });
        }
        return result;
    }

    /**
     * Check if a specific achievement is unlocked.
     * @param {string} id
     * @returns {boolean}
     */
    function isUnlocked(id) {
        var state = loadState();
        return !!(state[id] && state[id].unlockedAt);
    }

    /**
     * Get achievement statistics.
     * @returns {Object}
     */
    function getStats() {
        var state = loadState();
        var defs = Definitions.ACHIEVEMENTS;
        var unlockedCount = 0;
        for (var i = 0; i < defs.length; i++) {
            if (state[defs[i].id] && state[defs[i].id].unlockedAt) unlockedCount++;
        }
        var total = defs.length;
        return {
            total: total,
            unlocked: unlockedCount,
            locked: total - unlockedCount,
            percentage: total > 0 ? Math.round(unlockedCount / total * 100) : 0
        };
    }

    // ========================================================
    // PUBLIC API
    // ========================================================
    return {
        // Read API
        getAll: getAll,
        getAchievement: getAchievement,
        getUnlocked: getUnlocked,
        getLocked: getLocked,
        getProgress: getProgress,
        isUnlocked: isUnlocked,
        getStats: getStats,

        // Evaluation
        evaluate: evaluate,

        // Internal (for testing)
        _collectMetrics: collectMetrics,
        _evaluateCondition: evaluateCondition,
        _evaluateAchievement: evaluateAchievement,
        _calculateProgress: calculateProgress,

        // Storage (advanced use only)
        _storage: Storage
    };
})();

if (typeof window !== 'undefined') {
    window.PixelPalaceAchievements = PixelPalaceAchievements;
}
