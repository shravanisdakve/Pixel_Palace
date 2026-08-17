/**
 * PixelPalaceProgression
 * Data-driven XP and level progression engine for Pixel Palace.
 *
 * Consumes PixelPalaceProgressionConfig for all thresholds and awards.
 * Persists via PixelPalaceStorage. Integrates with PixelPalace session lifecycle.
 *
 * Dependencies (load order):
 *   1. pixel_palace_storage.js
 *   2. pixel_palace_player.js
 *   3. pixel_palace_registry.js
 *   4. pixel_palace_progression_config.js
 *   5. pixel_palace_progression.js  (this file)
 *   6. pixel_palace_core.js  (integrates via endSession)
 *
 * @namespace PixelPalaceProgression
 */
var PixelPalaceProgression = (function () {
    'use strict';

    var Config = PixelPalaceProgressionConfig;
    var Storage = PixelPalaceStorage;
    var Registry = PixelPalaceRegistry;

    // ========================================================
    // INTERNAL HELPERS
    // ========================================================

    /**
     * Generate a unique transaction ID.
     * @returns {string}
     */
    function generateTransactionId() {
        return 'txn_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 8);
    }

    /**
     * Get the current player's progress object from storage.
     * Returns a safe default if missing or malformed.
     *
     * @returns {Object} { totalXp, level, createdAt, updatedAt }
     */
    function loadProgress() {
        var raw = Storage.get(Config.STORAGE_KEYS.PROGRESS);
        if (!raw || typeof raw !== 'object' || typeof raw.totalXp !== 'number') {
            return createDefaultProgress();
        }
        // Clamp negative XP to zero
        if (raw.totalXp < 0) raw.totalXp = 0;
        return raw;
    }

    /**
     * Save progress object to storage.
     * @param {Object} progress
     */
    function saveProgress(progress) {
        progress.updatedAt = new Date().toISOString();
        Storage.set(Config.STORAGE_KEYS.PROGRESS, progress);
    }

    /**
     * Create a fresh default progress object for a new player.
     * @returns {Object}
     */
    function createDefaultProgress() {
        var now = new Date().toISOString();
        return {
            totalXp: 0,
            level: 1,
            createdAt: now,
            updatedAt: now
        };
    }

    /**
     * Load the player's XP history from storage.
     * @returns {Array}
     */
    function loadHistory() {
        var raw = Storage.get(Config.STORAGE_KEYS.XP_HISTORY);
        if (!Array.isArray(raw)) return [];
        return raw;
    }

    /**
     * Save XP history to storage.
     * @param {Array} history
     */
    function saveHistory(history) {
        Storage.set(Config.STORAGE_KEYS.XP_HISTORY, history);
    }

    /**
     * Load the set of first-play game IDs from storage.
     * @returns {Object} Map of gameId -> true
     */
    function loadFirstPlays() {
        var raw = Storage.get(Config.STORAGE_KEYS.FIRST_PLAYS);
        if (!raw || typeof raw !== 'object') return {};
        return raw;
    }

    /**
     * Save first-play map to storage.
     * @param {Object} map
     */
    function saveFirstPlays(map) {
        Storage.set(Config.STORAGE_KEYS.FIRST_PLAYS, map);
    }

    // ========================================================
    // LEVEL CALCULATION
    // ========================================================

    /**
     * Calculate level info from total XP.
     * Deterministic: same XP always produces the same result.
     *
     * @param {number} totalXp
     * @returns {Object} { level, xpForCurrentLevel, xpForNextLevel, xpRemaining, progress }
     */
    function calculateLevel(totalXp) {
        if (typeof totalXp !== 'number' || !isFinite(totalXp) || totalXp < 0) {
            totalXp = 0;
        }

        var thresholds = Config.LEVEL_THRESHOLDS;
        var level = 1;
        var xpForCurrentLevel = 0;
        var xpForNextLevel = thresholds.length > 1 ? thresholds[1] : 0;

        // Find the current level
        for (var i = thresholds.length - 1; i >= 0; i--) {
            if (totalXp >= thresholds[i]) {
                level = i + 1;
                xpForCurrentLevel = thresholds[i];
                xpForNextLevel = (i + 1 < thresholds.length) ? thresholds[i + 1] : thresholds[i];
                break;
            }
        }

        // Clamp level to max
        if (level > Config.MAX_LEVEL) {
            level = Config.MAX_LEVEL;
            xpForCurrentLevel = thresholds[thresholds.length - 1];
            xpForNextLevel = thresholds[thresholds.length - 1];
        }

        var xpIntoLevel = totalXp - xpForCurrentLevel;
        var xpRange = xpForNextLevel - xpForCurrentLevel;
        var xpRemaining = xpForNextLevel - totalXp;
        var progress = xpRange > 0 ? Math.min(xpIntoLevel / xpRange, 1) : 1;

        // If at max level, progress is always 1
        if (level >= Config.MAX_LEVEL) {
            xpRemaining = 0;
            progress = 1;
        }

        return {
            level: level,
            xpForCurrentLevel: xpForCurrentLevel,
            xpForNextLevel: xpForNextLevel,
            xpIntoLevel: xpIntoLevel,
            xpRemaining: xpRemaining > 0 ? xpRemaining : 0,
            progress: Math.round(progress * 1000) / 1000 // 3 decimal places
        };
    }

    // ========================================================
    // XP TRANSACTIONS
    // ========================================================

    /**
     * Record an XP transaction and update the player's total XP.
     *
     * @param {number} amount - XP to award (must be positive integer)
     * @param {string} source - One of Config.SOURCES values
     * @param {Object} [metadata={}] - Additional context (gameId, sessionId, etc.)
     * @returns {Object} { ok, transaction?, error? }
     */
    function awardXp(amount, source, metadata) {
        if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) {
            return { ok: false, error: 'Invalid XP amount. Must be a positive number.' };
        }

        amount = Math.round(amount);

        if (amount <= 0) {
            return { ok: false, error: 'XP amount must be at least 1.' };
        }

        if (!source || typeof source !== 'string') {
            return { ok: false, error: 'Invalid XP source.' };
        }

        metadata = metadata || {};

        // Check for duplicate transaction ID (idempotency)
        if (metadata.transactionId) {
            var history = loadHistory();
            for (var i = 0; i < history.length; i++) {
                if (history[i].transactionId === metadata.transactionId) {
                    return { ok: false, error: 'Duplicate transaction ID.' };
                }
            }
        }

        var transaction = {
            id: generateTransactionId(),
            amount: amount,
            source: source,
            gameId: metadata.gameId || null,
            sessionId: metadata.sessionId || null,
            transactionId: metadata.transactionId || null,
            metadata: metadata,
            createdAt: new Date().toISOString()
        };

        // Update progress
        var progress = loadProgress();
        var oldLevel = calculateLevel(progress.totalXp).level;

        progress.totalXp += amount;

        var newLevelInfo = calculateLevel(progress.totalXp);
        progress.level = newLevelInfo.level;
        saveProgress(progress);

        // Record in history
        var historyList = loadHistory();
        historyList.push(transaction);

        // Trim old transactions
        if (historyList.length > Config.MAX_XP_HISTORY) {
            historyList = historyList.slice(historyList.length - Config.MAX_XP_HISTORY);
        }
        saveHistory(historyList);

        var didLevelUp = newLevelInfo.level > oldLevel;

        return {
            ok: true,
            transaction: transaction,
            progress: {
                totalXp: progress.totalXp,
                level: newLevelInfo.level,
                xpToNextLevel: newLevelInfo.xpRemaining,
                levelProgress: newLevelInfo.progress
            },
            levelUp: didLevelUp ? {
                oldLevel: oldLevel,
                newLevel: newLevelInfo.level
            } : null
        };
    }

    // ========================================================
    // FIRST PLAY TRACKING
    // ========================================================

    /**
     * Check if a game has been played before.
     * @param {string} gameId
     * @returns {boolean}
     */
    function isFirstPlay(gameId) {
        if (!gameId) return false;
        var firstPlays = loadFirstPlays();
        return !firstPlays[gameId];
    }

    /**
     * Mark a game as played.
     * Idempotent — calling multiple times has no additional effect.
     * @param {string} gameId
     */
    function markAsPlayed(gameId) {
        if (!gameId) return;
        var firstPlays = loadFirstPlays();
        if (!firstPlays[gameId]) {
            firstPlays[gameId] = true;
            saveFirstPlays(firstPlays);
        }
    }

    // ========================================================
    // SESSION INTEGRATION
    // ========================================================

    /**
     * Process a completed game session for progression.
     * Called by PixelPalace.endSession() after score recording and PB evaluation.
     *
     * Awards:
     *   - Completion XP (always)
     *   - First-play XP (if first time playing this game)
     *   - Personal-best XP (if new PB was set)
     *
     * Uses the session ID as a transaction key to prevent duplicate awards.
     *
     * @param {Object} params
     * @param {string} params.gameId
     * @param {string} params.sessionId
     * @param {boolean} params.isNewPersonalBest
     * @returns {Object} { xpAwarded, levelUp, transactions }
     */
    function processSessionEnd(params) {
        if (!params || !params.gameId || !params.sessionId) {
            return { xpAwarded: 0, levelUp: null, transactions: [] };
        }

        var transactions = [];
        var totalXpAwarded = 0;
        var levelUpResult = null;

        // 1. Completion XP
        var completionResult = awardXp(Config.XP_PER_COMPLETION, Config.SOURCES.GAME_COMPLETION, {
            gameId: params.gameId,
            sessionId: params.sessionId,
            transactionId: params.sessionId + ':completion'
        });
        if (completionResult.ok) {
            transactions.push(completionResult.transaction);
            totalXpAwarded += completionResult.transaction.amount;
            if (completionResult.levelUp) levelUpResult = completionResult.levelUp;
        }

        // 2. First-play XP
        if (isFirstPlay(params.gameId)) {
            var firstPlayResult = awardXp(Config.XP_FIRST_PLAY_BONUS, Config.SOURCES.FIRST_PLAY, {
                gameId: params.gameId,
                sessionId: params.sessionId,
                transactionId: params.sessionId + ':first_play'
            });
            if (firstPlayResult.ok) {
                transactions.push(firstPlayResult.transaction);
                totalXpAwarded += firstPlayResult.transaction.amount;
                if (firstPlayResult.levelUp) levelUpResult = firstPlayResult.levelUp;
            }
            markAsPlayed(params.gameId);
        }

        // 3. Personal-best XP
        if (params.isNewPersonalBest) {
            var pbResult = awardXp(Config.XP_PERSONAL_BEST_BONUS, Config.SOURCES.PERSONAL_BEST, {
                gameId: params.gameId,
                sessionId: params.sessionId,
                transactionId: params.sessionId + ':personal_best'
            });
            if (pbResult.ok) {
                transactions.push(pbResult.transaction);
                totalXpAwarded += pbResult.transaction.amount;
                if (pbResult.levelUp) levelUpResult = pbResult.levelUp;
            }
        }

        return {
            xpAwarded: totalXpAwarded,
            levelUp: levelUpResult,
            transactions: transactions
        };
    }

    // ========================================================
    // PUBLIC READ API
    // ========================================================

    /**
     * Get the player's full progress state.
     * @returns {Object} { totalXp, level, levelInfo, createdAt, updatedAt }
     */
    function getProgress() {
        var progress = loadProgress();
        var levelInfo = calculateLevel(progress.totalXp);
        return {
            totalXp: progress.totalXp,
            level: levelInfo.level,
            levelInfo: levelInfo,
            createdAt: progress.createdAt,
            updatedAt: progress.updatedAt
        };
    }

    /**
     * Get the player's total XP.
     * @returns {number}
     */
    function getTotalXp() {
        return loadProgress().totalXp;
    }

    /**
     * Get the player's current level.
     * @returns {number}
     */
    function getLevel() {
        return calculateLevel(loadProgress().totalXp).level;
    }

    /**
     * Get XP remaining until next level.
     * @returns {number}
     */
    function getXpToNextLevel() {
        return calculateLevel(loadProgress().totalXp).xpRemaining;
    }

    /**
     * Get level progress as a decimal (0-1).
     * @returns {number}
     */
    function getLevelProgress() {
        return calculateLevel(loadProgress().totalXp).progress;
    }

    /**
     * Get the XP transaction history.
     * @returns {Array}
     */
    function getXpHistory() {
        return loadHistory();
    }

    /**
     * Get the count of games played (first plays).
     * @returns {number}
     */
    function getGamesPlayed() {
        return Object.keys(loadFirstPlays()).length;
    }

    // ========================================================
    // PUBLIC API
    // ========================================================
    return {
        // Read API
        getProgress: getProgress,
        getTotalXp: getTotalXp,
        getLevel: getLevel,
        getXpToNextLevel: getXpToNextLevel,
        getLevelProgress: getLevelProgress,
        getXpHistory: getXpHistory,
        getGamesPlayed: getGamesPlayed,

        // Write API
        awardXp: awardXp,

        // Session integration
        processSessionEnd: processSessionEnd,

        // First-play
        isFirstPlay: isFirstPlay,
        markAsPlayed: markAsPlayed,

        // Utilities (for testing)
        calculateLevel: calculateLevel,

        // Storage (advanced use only)
        _storage: Storage
    };
})();

if (typeof window !== 'undefined') {
    window.PixelPalaceProgression = PixelPalaceProgression;
}
