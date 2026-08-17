/**
 * PixelPalaceProgressionFeedback
 * In-game progression feedback overlay for Pixel Palace.
 *
 * Displays XP earned, personal best, achievement unlocks, and level-ups
 * after a game session ends. All data comes from the endSession result —
 * this module NEVER calculates, awards, or unlocks anything.
 *
 * Dependencies (load order):
 *   1-8. All platform modules (storage, player, registry, progression,
 *         achievements, core)
 *   9. pixel_palace_progression_feedback.js (this file)
 *
 * @namespace PixelPalaceProgressionFeedback
 */
var PixelPalaceProgressionFeedback = (function () {
    'use strict';

    var Core = window.PixelPalace;
    var Registry = window.PixelPalaceRegistry;
    var AchievementDefs = window.PixelPalaceAchievementDefinitions;

    var OVERLAY_ID = 'pp-feedback-overlay';
    var overlayEl = null;
    var isOpen = false;
    var onCloseCallback = null;

    // ========================================================
    // UI-ONLY PRESENTATION CONSTANTS
    // ========================================================
    // Maps engine source IDs to display text. Purely presentational.
    var SOURCE_LABELS = {
        game_completion: 'Game Complete',
        first_play: 'First Play',
        personal_best: 'Personal Best'
    };

    // Achievement source prefix used by the engine
    var ACHIEVEMENT_SOURCE_PREFIX = 'achievement_';

    // ========================================================
    // RESULT NORMALIZATION
    // ========================================================

    /**
     * Normalize a raw endSession result into a flat, display-friendly shape.
     * This is the single normalization layer — all games produce the same shape.
     *
     * The feedback UI consumes ONLY this normalized result.
     *
     * @param {Object} raw - The result from PixelPalace.endSession()
     * @returns {Object|null} Normalized result or null if invalid
     */
    function normalizeResult(raw) {
        if (!raw || !raw.ok) return null;

        var progression = raw.progression || {};
        var personalBest = raw.personalBest || {};
        var achievements = raw.achievements || [];
        var transactions = progression.transactions || [];

        // Sum XP from achievement rewards (these are separate transactions
        // awarded by the achievement engine, not the progression engine)
        var achievementXp = 0;
        for (var i = 0; i < transactions.length; i++) {
            if (transactions[i].source &&
                transactions[i].source.indexOf(ACHIEVEMENT_SOURCE_PREFIX) === 0) {
                achievementXp += transactions[i].amount;
            }
        }

        // Build transaction display list (only progression transactions,
        // not achievement reward transactions which are already counted)
        var displayTransactions = [];
        for (var j = 0; j < transactions.length; j++) {
            var t = transactions[j];
            if (t.source && t.source.indexOf(ACHIEVEMENT_SOURCE_PREFIX) !== 0) {
                displayTransactions.push({
                    amount: t.amount,
                    source: t.source,
                    label: SOURCE_LABELS[t.source] || t.source
                });
            }
        }

        var levelUp = progression.levelUp || null;

        return {
            // XP
            xpEarned: progression.xpAwarded || 0,
            transactions: displayTransactions,
            achievementXp: achievementXp,

            // Personal best
            newPersonalBest: !!personalBest.isNewBest,
            score: personalBest.score,
            previousBest: personalBest.previousBest,

            // Achievements
            unlockedAchievements: achievements.map(function (a) {
                // Look up the definition for display data (icon, reward spec)
                var def = AchievementDefs ? AchievementDefs.ACHIEVEMENTS.filter(function (d) { return d.id === a.id; })[0] : null;
                return {
                    id: a.id,
                    name: a.name,
                    description: a.description,
                    icon: a.icon,
                    reward: (def && def.reward) ? def.reward : null
                };
            }),

            // Level
            leveledUp: !!levelUp,
            previousLevel: levelUp ? levelUp.oldLevel : null,
            currentLevel: levelUp ? levelUp.newLevel : null,

            // Session context
            gameId: raw.session ? raw.session.gameId : null
        };
    }

    // ========================================================
    // INITIALIZATION
    // ========================================================

    function init() {
        if (overlayEl) return;
        createOverlay();
        injectStyles();
    }

    // ========================================================
    // OVERLAY CREATION
    // ========================================================

    function createOverlay() {
        overlayEl = document.createElement('div');
        overlayEl.id = OVERLAY_ID;
        overlayEl.className = 'pp-feedback-overlay';
        overlayEl.setAttribute('role', 'dialog');
        overlayEl.setAttribute('aria-modal', 'true');
        overlayEl.setAttribute('aria-labelledby', 'pp-feedback-title');
        overlayEl.setAttribute('aria-describedby', 'pp-feedback-body');
        overlayEl.style.display = 'none';

        overlayEl.innerHTML =
            '<div class="pp-feedback-backdrop"></div>' +
            '<div class="pp-feedback-panel" tabindex="-1">' +
                '<div class="pp-feedback-header">' +
                    '<h2 id="pp-feedback-title" class="pp-feedback-title">GAME COMPLETE</h2>' +
                '</div>' +
                '<div id="pp-feedback-body" class="pp-feedback-body"></div>' +
                '<div class="pp-feedback-footer">' +
                    '<button class="pp-feedback-continue" id="pp-feedback-continue">CONTINUE</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlayEl);

        // Close handlers
        var backdrop = overlayEl.querySelector('.pp-feedback-backdrop');
        backdrop.addEventListener('click', function () { hide(); });

        var continueBtn = overlayEl.querySelector('#pp-feedback-continue');
        continueBtn.addEventListener('click', function () { hide(); });

        // Keyboard: Escape to close
        overlayEl.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' || e.keyCode === 27) {
                e.preventDefault();
                hide();
            }
        });
    }

    // ========================================================
    // SHOW / HIDE
    // ========================================================

    /**
     * Show the feedback overlay with a normalized result.
     *
     * @param {Object} result - From normalizeResult()
     * @param {Function} [onClose] - Called when overlay is dismissed
     */
    function show(result, onClose) {
        if (!overlayEl || !result) return;

        init();

        onCloseCallback = onClose || null;
        isOpen = true;

        var body = overlayEl.querySelector('#pp-feedback-body');
        body.innerHTML = '';

        // Render in priority order, combined into one panel
        renderXp(result, body);
        renderPersonalBest(result, body);
        renderAchievements(result, body);
        renderLevelUp(result, body);

        // Show overlay
        overlayEl.style.display = 'flex';

        // Focus management
        var panel = overlayEl.querySelector('.pp-feedback-panel');
        panel.focus();

        // Announce to screen readers
        overlayEl.setAttribute('aria-label', buildAriaLabel(result));
    }

    /**
     * Hide the feedback overlay.
     */
    function hide() {
        if (!overlayEl) return;
        isOpen = false;
        overlayEl.style.display = 'none';

        // Clear body
        var body = overlayEl.querySelector('#pp-feedback-body');
        if (body) body.innerHTML = '';

        // Focus restoration
        if (onCloseCallback) {
            var cb = onCloseCallback;
            onCloseCallback = null;
            cb();
        }
    }

    /**
     * Check if the feedback overlay is currently visible.
     * @returns {boolean}
     */
    function isFeedbackOpen() {
        return isOpen;
    }

    // ========================================================
    // RENDER COMPONENTS
    // ========================================================

    function renderXp(result, container) {
        if (result.xpEarned <= 0) return;

        var xpSection = document.createElement('div');
        xpSection.className = 'pp-feedback-xp';

        var xpTotal = document.createElement('div');
        xpTotal.className = 'pp-feedback-xp-total';
        xpTotal.textContent = '+' + result.xpEarned + ' XP';
        xpSection.appendChild(xpTotal);

        // Show breakdown if multiple transactions
        if (result.transactions.length > 1) {
            var breakdown = document.createElement('div');
            breakdown.className = 'pp-feedback-xp-breakdown';
            for (var i = 0; i < result.transactions.length; i++) {
                var line = document.createElement('div');
                line.className = 'pp-feedback-xp-line';
                line.textContent = '+' + result.transactions[i].amount + ' ' + result.transactions[i].label;
                breakdown.appendChild(line);
            }
            xpSection.appendChild(breakdown);
        }

        container.appendChild(xpSection);
    }

    function renderPersonalBest(result, container) {
        if (!result.newPersonalBest) return;

        var pb = document.createElement('div');
        pb.className = 'pp-feedback-pb';
        pb.textContent = 'NEW PERSONAL BEST';
        container.appendChild(pb);
    }

    function renderAchievements(result, container) {
        var achievements = result.unlockedAchievements;
        if (!achievements || achievements.length === 0) return;

        for (var i = 0; i < achievements.length; i++) {
            var a = achievements[i];
            var card = document.createElement('div');
            card.className = 'pp-feedback-achievement';

            var icon = document.createElement('span');
            icon.className = 'pp-feedback-achievement-icon';
            icon.textContent = a.icon;
            card.appendChild(icon);

            var info = document.createElement('div');
            info.className = 'pp-feedback-achievement-info';

            var name = document.createElement('div');
            name.className = 'pp-feedback-achievement-name';
            name.textContent = a.name;
            info.appendChild(name);

            var desc = document.createElement('div');
            desc.className = 'pp-feedback-achievement-desc';
            desc.textContent = a.description;
            info.appendChild(desc);

            if (a.reward && a.reward.type === 'xp' && a.reward.amount > 0) {
                var reward = document.createElement('div');
                reward.className = 'pp-feedback-achievement-reward';
                reward.textContent = '+' + a.reward.amount + ' XP';
                info.appendChild(reward);
            }

            card.appendChild(info);
            container.appendChild(card);
        }
    }

    function renderLevelUp(result, container) {
        if (!result.leveledUp) return;

        var levelUp = document.createElement('div');
        levelUp.className = 'pp-feedback-levelup';

        var label = document.createElement('div');
        label.className = 'pp-feedback-levelup-label';
        label.textContent = 'LEVEL UP';
        levelUp.appendChild(label);

        var level = document.createElement('div');
        level.className = 'pp-feedback-levelup-level';
        if (result.previousLevel !== null && result.currentLevel !== null &&
            result.previousLevel + 1 < result.currentLevel) {
            // Multi-level jump
            level.textContent = 'Level ' + result.previousLevel + ' \u2192 Level ' + result.currentLevel;
        } else {
            level.textContent = 'Level ' + result.currentLevel;
        }
        levelUp.appendChild(level);

        container.appendChild(levelUp);
    }

    // ========================================================
    // ACCESSIBILITY
    // ========================================================

    function buildAriaLabel(result) {
        var parts = ['Game complete'];
        if (result.xpEarned > 0) parts.push('+' + result.xpEarned + ' XP');
        if (result.newPersonalBest) parts.push('New personal best');
        if (result.unlockedAchievements.length > 0) {
            for (var i = 0; i < result.unlockedAchievements.length; i++) {
                parts.push('Achievement unlocked: ' + result.unlockedAchievements[i].name);
            }
        }
        if (result.leveledUp) parts.push('Level up, level ' + result.currentLevel);
        return parts.join('. ');
    }

    // ========================================================
    // STYLES
    // ========================================================

    function injectStyles() {
        if (document.getElementById('pp-feedback-styles')) return;

        var style = document.createElement('style');
        style.id = 'pp-feedback-styles';
        style.textContent =
            /* Overlay */
            '.pp-feedback-overlay {' +
                'position: fixed;' +
                'top: 0; left: 0; right: 0; bottom: 0;' +
                'z-index: 10000;' +
                'display: flex;' +
                'align-items: center;' +
                'justify-content: center;' +
                'font-family: "Press Start 2P", monospace;' +
            '}' +
            '.pp-feedback-backdrop {' +
                'position: absolute;' +
                'top: 0; left: 0; right: 0; bottom: 0;' +
                'background: rgba(0, 0, 0, 0.85);' +
            '}' +

            /* Panel */
            '.pp-feedback-panel {' +
                'position: relative;' +
                'z-index: 1;' +
                'background: #0f0f1e;' +
                'border: 2px solid #00ffff;' +
                'border-radius: 8px;' +
                'padding: 24px;' +
                'max-width: 420px;' +
                'width: 90%;' +
                'max-height: 80vh;' +
                'overflow-y: auto;' +
                'text-align: center;' +
                'color: #ffffff;' +
                'box-shadow: 0 0 30px rgba(0, 255, 255, 0.3), 0 0 60px rgba(0, 255, 255, 0.1);' +
                'outline: none;' +
            '}' +

            /* Title */
            '.pp-feedback-title {' +
                'font-size: 14px;' +
                'color: #00ffff;' +
                'margin: 0 0 20px 0;' +
                'text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);' +
                'letter-spacing: 2px;' +
            '}' +

            /* XP section */
            '.pp-feedback-xp {' +
                'margin-bottom: 16px;' +
            '}' +
            '.pp-feedback-xp-total {' +
                'font-size: 20px;' +
                'color: #ffff00;' +
                'text-shadow: 0 0 15px rgba(255, 255, 0, 0.5);' +
                'margin-bottom: 8px;' +
            '}' +
            '.pp-feedback-xp-breakdown {' +
                'font-size: 8px;' +
                'color: #aaaaaa;' +
                'line-height: 2;' +
            '}' +
            '.pp-feedback-xp-line {' +
                'color: #cccccc;' +
            '}' +

            /* Personal best */
            '.pp-feedback-pb {' +
                'font-size: 12px;' +
                'color: #ff00ff;' +
                'text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);' +
                'margin-bottom: 16px;' +
                'padding: 8px;' +
                'border: 1px solid #ff00ff;' +
                'border-radius: 4px;' +
                'animation: pp-pb-glow 1.5s ease-in-out infinite alternate;' +
            '}' +

            /* Achievement card */
            '.pp-feedback-achievement {' +
                'display: flex;' +
                'align-items: center;' +
                'gap: 12px;' +
                'background: rgba(0, 255, 255, 0.05);' +
                'border: 1px solid #00ffff;' +
                'border-radius: 6px;' +
                'padding: 10px 12px;' +
                'margin-bottom: 10px;' +
                'text-align: left;' +
            '}' +
            '.pp-feedback-achievement-icon {' +
                'font-size: 24px;' +
                'flex-shrink: 0;' +
            '}' +
            '.pp-feedback-achievement-info {' +
                'flex: 1;' +
                'min-width: 0;' +
            '}' +
            '.pp-feedback-achievement-name {' +
                'font-size: 9px;' +
                'color: #00ffff;' +
                'margin-bottom: 4px;' +
            '}' +
            '.pp-feedback-achievement-desc {' +
                'font-size: 7px;' +
                'color: #aaaaaa;' +
                'line-height: 1.6;' +
                'margin-bottom: 2px;' +
            '}' +
            '.pp-feedback-achievement-reward {' +
                'font-size: 7px;' +
                'color: #ffff00;' +
            '}' +

            /* Level up */
            '.pp-feedback-levelup {' +
                'margin-top: 16px;' +
                'padding: 12px;' +
                'border: 2px solid #ffff00;' +
                'border-radius: 6px;' +
                'background: rgba(255, 255, 0, 0.05);' +
                'animation: pp-level-glow 1s ease-in-out infinite alternate;' +
            '}' +
            '.pp-feedback-levelup-label {' +
                'font-size: 14px;' +
                'color: #ffff00;' +
                'text-shadow: 0 0 15px rgba(255, 255, 0, 0.5);' +
                'margin-bottom: 6px;' +
            '}' +
            '.pp-feedback-levelup-level {' +
                'font-size: 10px;' +
                'color: #ffffff;' +
            '}' +

            /* Continue button */
            '.pp-feedback-continue {' +
                'font-family: "Press Start 2P", monospace;' +
                'font-size: 10px;' +
                'color: #0f0f1e;' +
                'background: #00ffff;' +
                'border: none;' +
                'border-radius: 4px;' +
                'padding: 12px 24px;' +
                'cursor: pointer;' +
                'margin-top: 20px;' +
                'text-transform: uppercase;' +
                'transition: background 0.2s, box-shadow 0.2s;' +
            '}' +
            '.pp-feedback-continue:hover,' +
            '.pp-feedback-continue:focus {' +
                'background: #00cccc;' +
                'box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);' +
                'outline: 2px solid #ffffff;' +
                'outline-offset: 2px;' +
            '}' +

            /* Animations */
            '@keyframes pp-pb-glow {' +
                'from { box-shadow: 0 0 5px rgba(255, 0, 255, 0.3); }' +
                'to { box-shadow: 0 0 20px rgba(255, 0, 255, 0.6); }' +
            '}' +
            '@keyframes pp-level-glow {' +
                'from { box-shadow: 0 0 5px rgba(255, 255, 0, 0.3); }' +
                'to { box-shadow: 0 0 25px rgba(255, 255, 0, 0.6); }' +
            '}' +

            /* Reduced motion */
            '@media (prefers-reduced-motion: reduce) {' +
                '.pp-feedback-pb,' +
                '.pp-feedback-levelup {' +
                    'animation: none;' +
                '}' +
                '.pp-feedback-continue {' +
                    'transition: none;' +
                '}' +
            '}' +

            /* Responsive */
            '@media (max-width: 480px) {' +
                '.pp-feedback-panel {' +
                    'padding: 16px;' +
                    'width: 95%;' +
                '}' +
                '.pp-feedback-title {' +
                    'font-size: 11px;' +
                '}' +
                '.pp-feedback-xp-total {' +
                    'font-size: 16px;' +
                '}' +
                '.pp-feedback-pb {' +
                    'font-size: 10px;' +
                '}' +
                '.pp-feedback-levelup-label {' +
                    'font-size: 12px;' +
                '}' +
                '.pp-feedback-continue {' +
                    'font-size: 9px;' +
                    'padding: 10px 20px;' +
                '}' +
            '}';

        document.head.appendChild(style);
    }

    // ========================================================
    // PUBLIC API
    // ========================================================

    return {
        init: init,
        show: show,
        hide: hide,
        isOpen: isFeedbackOpen,
        normalizeResult: normalizeResult
    };
})();

if (typeof window !== 'undefined') {
    window.PixelPalaceProgressionFeedback = PixelPalaceProgressionFeedback;
}
