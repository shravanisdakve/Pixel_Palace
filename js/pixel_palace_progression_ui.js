/**
 * PixelPalaceProgressionUI
 * Player-facing progression dashboard for Pixel Palace.
 *
 * Renders level, XP, achievements, and XP history in a modal overlay.
 * All data comes from existing platform APIs — zero hardcoded product values.
 *
 * Dependencies (load order):
 *   1-7. All platform modules (storage, player, registry, progression, achievements, core)
 *   8. pixel_palace_progression_ui.js  (this file)
 *
 * @namespace PixelPalaceProgressionUI
 */
var PixelPalaceProgressionUI = (function () {
    'use strict';

    var Core = window.PixelPalace;
    var Registry = window.PixelPalaceRegistry;
    var AchievementDefs = window.PixelPalaceAchievementDefinitions;
    var Achievements = window.PixelPalaceAchievements;

    var MODAL_ID = 'pp-progression-modal';
    var modalEl = null;
    var currentFilter = 'all';
    var isOpen = false;

    // ========================================================
    // UI-ONLY PRESENTATION CONSTANTS
    // ========================================================
    // These are display labels for XP source IDs.
    // They map engine source constants to human-readable text.
    // This is purely presentational — no product logic.
    var SOURCE_LABELS = {
        game_completion: 'Game Complete',
        first_play: 'First Play',
        personal_best: 'Personal Best'
    };

    var MAX_HISTORY_DISPLAY = 15;

    // ========================================================
    // INITIALIZATION
    // ========================================================

    function init() {
        if (modalEl) return;
        createModal();
        injectStyles();
        addNavEntry();
    }

    // ========================================================
    // NAVIGATION ENTRY POINT
    // ========================================================

    function addNavEntry() {
        var navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;

        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#';
        a.textContent = 'My Progress';
        a.className = 'pp-nav-progress';
        a.setAttribute('role', 'button');
        a.setAttribute('aria-label', 'View player progression');
        a.addEventListener('click', function (e) {
            e.preventDefault();
            open();
        });
        li.appendChild(a);
        navLinks.appendChild(li);
    }

    // ========================================================
    // MODAL CREATION
    // ========================================================

    function createModal() {
        modalEl = document.createElement('div');
        modalEl.id = MODAL_ID;
        modalEl.className = 'pp-modal';
        modalEl.setAttribute('role', 'dialog');
        modalEl.setAttribute('aria-modal', 'true');
        modalEl.setAttribute('aria-label', 'Player Progression');
        modalEl.innerHTML =
            '<div class="pp-modal-content">' +
                '<div class="pp-modal-header">' +
                    '<h2 class="pp-modal-title">My Progress</h2>' +
                    '<button class="pp-modal-close" aria-label="Close progression panel">&times;</button>' +
                '</div>' +
                '<div class="pp-modal-body" id="pp-modal-body"></div>' +
            '</div>';

        document.body.appendChild(modalEl);

        modalEl.querySelector('.pp-modal-close').addEventListener('click', close);

        modalEl.addEventListener('click', function (e) {
            if (e.target === modalEl) close();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isOpen) close();
        });
    }

    // ========================================================
    // OPEN / CLOSE
    // ========================================================

    function open() {
        if (!modalEl) init();
        render();
        modalEl.classList.add('active');
        modalEl.style.display = 'flex';
        isOpen = true;
        document.body.style.overflow = 'hidden';
        modalEl.querySelector('.pp-modal-close').focus();
    }

    function close() {
        if (!modalEl) return;
        modalEl.classList.remove('active');
        modalEl.style.display = 'none';
        isOpen = false;
        document.body.style.overflow = '';
    }

    // ========================================================
    // DATA COLLECTION (all from public APIs)
    // ========================================================

    function collectData() {
        var player = Core.getPlayer ? Core.getPlayer() : null;
        var progress = Core.getProgress ? Core.getProgress() : null;
        var xpHistory = Core.getXpHistory ? Core.getXpHistory() : [];
        var achProgress = Core.getAchievements ? Core.getAchievements() : [];
        var achStats = Core.getAchievementStats ? Core.getAchievementStats() : { total: 0, unlocked: 0, locked: 0, percentage: 0 };

        var categories = {};
        for (var i = 0; i < achProgress.length; i++) {
            var cat = achProgress[i].category;
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(achProgress[i]);
        }

        return {
            player: player,
            displayName: player ? (player.nickname || 'Player') : 'Player',
            level: progress ? progress.level : 1,
            totalXp: progress ? progress.totalXp : 0,
            levelInfo: progress ? progress.levelInfo : null,
            xpHistory: xpHistory.slice().reverse(),
            achievements: achProgress,
            achievementStats: achStats,
            categories: categories
        };
    }

    // ========================================================
    // RENDERING
    // ========================================================

    function render() {
        var data = collectData();
        var body = document.getElementById('pp-modal-body');
        if (!body) return;

        var html = '';
        html += renderPlayerHeader(data);
        html += renderLevelCard(data);
        html += renderAchievementOverview(data);
        html += renderAchievementFilters(data);
        html += renderAchievementCards(data);
        html += renderXpHistory(data);
        body.innerHTML = html;

        bindAchievementFilters(body);
    }

    // ========================================================
    // PLAYER HEADER
    // ========================================================

    function renderPlayerHeader(data) {
        return '<div class="pp-player-header">' +
            '<div class="pp-player-name">' + escapeHtml(data.displayName) + '</div>' +
            '<div class="pp-player-level-badge">LVL ' + data.level + '</div>' +
        '</div>';
    }

    // ========================================================
    // LEVEL CARD
    // ========================================================

    function renderLevelCard(data) {
        var li = data.levelInfo;
        if (!li) return '';

        var xpCurrent = li.xpIntoLevel || 0;
        var xpNeeded = li.xpForNextLevel - li.xpForCurrentLevel;
        var xpRemaining = li.xpRemaining || 0;
        var pct = Math.round((li.progress || 0) * 100);
        var isMax = li.xpRemaining === 0 && li.progress >= 1;

        return '<div class="pp-level-card">' +
            '<div class="pp-level-number">Level ' + li.level + '</div>' +
            '<div class="pp-level-xp-row">' +
                '<span class="pp-xp-current">' + data.totalXp + ' XP</span>' +
                '<span class="pp-xp-separator">/</span>' +
                '<span class="pp-xp-required">' + li.xpForNextLevel + ' XP</span>' +
            '</div>' +
            '<div class="pp-progress-bar-container" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Level progress">' +
                '<div class="pp-progress-bar" style="width:' + pct + '%"></div>' +
            '</div>' +
            '<div class="pp-level-remaining">' +
                (isMax ? 'MAX LEVEL' : xpRemaining + ' XP to Level ' + (li.level + 1)) +
            '</div>' +
        '</div>';
    }

    // ========================================================
    // ACHIEVEMENT OVERVIEW
    // ========================================================

    function renderAchievementOverview(data) {
        var s = data.achievementStats;
        return '<div class="pp-ach-overview">' +
            '<h3 class="pp-section-title">Achievements</h3>' +
            '<div class="pp-ach-stats">' +
                '<div class="pp-ach-stat">' +
                    '<span class="pp-ach-stat-number">' + s.unlocked + '</span>' +
                    '<span class="pp-ach-stat-label">Unlocked</span>' +
                '</div>' +
                '<div class="pp-ach-stat">' +
                    '<span class="pp-ach-stat-number">' + s.total + '</span>' +
                    '<span class="pp-ach-stat-label">Total</span>' +
                '</div>' +
                '<div class="pp-ach-stat">' +
                    '<span class="pp-ach-stat-number">' + s.percentage + '%</span>' +
                    '<span class="pp-ach-stat-label">Complete</span>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    // ========================================================
    // ACHIEVEMENT FILTERS
    // ========================================================

    function renderAchievementFilters() {
        return '<div class="pp-ach-filters" role="tablist" aria-label="Filter achievements">' +
            '<button class="pp-filter-btn active" data-pp-filter="all" role="tab" aria-selected="true">All</button>' +
            '<button class="pp-filter-btn" data-pp-filter="unlocked" role="tab" aria-selected="false">Unlocked</button>' +
            '<button class="pp-filter-btn" data-pp-filter="locked" role="tab" aria-selected="false">Locked</button>' +
        '</div>';
    }

    function bindAchievementFilters(body) {
        var buttons = body.querySelectorAll('.pp-filter-btn');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function () {
                currentFilter = this.getAttribute('data-pp-filter');
                var allBtns = body.querySelectorAll('.pp-filter-btn');
                for (var j = 0; j < allBtns.length; j++) {
                    allBtns[j].classList.remove('active');
                    allBtns[j].setAttribute('aria-selected', 'false');
                }
                this.classList.add('active');
                this.setAttribute('aria-selected', 'true');
                var cards = body.querySelectorAll('.pp-ach-card');
                for (var k = 0; k < cards.length; k++) {
                    var unlocked = cards[k].getAttribute('data-pp-unlocked') === 'true';
                    var show = currentFilter === 'all' ||
                        (currentFilter === 'unlocked' && unlocked) ||
                        (currentFilter === 'locked' && !unlocked);
                    cards[k].style.display = show ? '' : 'none';
                }
            });
        }
    }

    // ========================================================
    // ACHIEVEMENT CARDS
    // ========================================================

    function renderAchievementCards(data) {
        var achs = data.achievements;
        if (!achs || achs.length === 0) {
            return '<div class="pp-ach-empty">No achievements available.</div>';
        }

        var html = '<div class="pp-ach-grid">';
        for (var i = 0; i < achs.length; i++) {
            html += renderSingleAchCard(achs[i]);
        }
        html += '</div>';
        return html;
    }

    function renderSingleAchCard(ach) {
        var isUnlocked = ach.unlocked;
        var cls = 'pp-ach-card' + (isUnlocked ? ' pp-ach-unlocked' : ' pp-ach-locked');

        var rewardText = '';
        var def = AchievementDefs.getAchievement(ach.id);
        if (def && def.reward && def.reward.amount) {
            rewardText = '+' + def.reward.amount + ' XP';
        }

        var progressHtml = '';
        if (!isUnlocked && ach.progress) {
            var p = ach.progress;
            var pct = p.percentage || 0;
            progressHtml =
                '<div class="pp-ach-progress">' +
                    '<div class="pp-ach-progress-bar-container" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Achievement progress">' +
                        '<div class="pp-ach-progress-bar" style="width:' + pct + '%"></div>' +
                    '</div>' +
                    '<div class="pp-ach-progress-text">' + p.current + ' / ' + p.target + '</div>' +
                '</div>';
        }

        var unlockedTime = '';
        if (isUnlocked && ach.unlockedAt) {
            unlockedTime = '<div class="pp-ach-unlock-time">' + formatRelativeTime(ach.unlockedAt) + '</div>';
        }

        return '<div class="' + cls + '" data-pp-unlocked="' + isUnlocked + '" tabindex="0" aria-label="' + escapeHtml(ach.name) + (isUnlocked ? ' (unlocked)' : ' (locked)') + '">' +
            '<div class="pp-ach-icon">' + (ach.icon || '') + '</div>' +
            '<div class="pp-ach-info">' +
                '<div class="pp-ach-name">' + escapeHtml(ach.name) + '</div>' +
                '<div class="pp-ach-desc">' + escapeHtml(ach.description) + '</div>' +
                (rewardText ? '<div class="pp-ach-reward">' + rewardText + '</div>' : '') +
                (unlockedTime) +
            '</div>' +
            progressHtml +
        '</div>';
    }

    // ========================================================
    // XP HISTORY
    // ========================================================

    function renderXpHistory(data) {
        var history = data.xpHistory;
        if (!history || history.length === 0) {
            return '<div class="pp-xp-history">' +
                '<h3 class="pp-section-title">XP Activity</h3>' +
                '<div class="pp-xp-empty">No XP earned yet. Play a game to start your progression.</div>' +
            '</div>';
        }

        var show = history.slice(0, MAX_HISTORY_DISPLAY);
        var html = '<div class="pp-xp-history">' +
            '<h3 class="pp-section-title">XP Activity</h3>' +
            '<div class="pp-xp-list">';

        for (var i = 0; i < show.length; i++) {
            var t = show[i];
            var gameName = '';
            if (t.metadata && t.metadata.gameId) {
                var g = Registry.getById(t.metadata.gameId);
                if (g) gameName = g.name;
            }
            var sourceLabel = SOURCE_LABELS[t.source] || t.source || 'Unknown';

            html += '<div class="pp-xp-entry">' +
                '<div class="pp-xp-amount">+' + t.amount + ' XP</div>' +
                '<div class="pp-xp-source">' + escapeHtml(sourceLabel) + '</div>' +
                (gameName ? '<div class="pp-xp-game">' + escapeHtml(gameName) + '</div>' : '') +
                '<div class="pp-xp-time">' + formatRelativeTime(t.createdAt) + '</div>' +
            '</div>';
        }

        html += '</div></div>';
        return html;
    }

    // ========================================================
    // STYLES
    // ========================================================

    function injectStyles() {
        if (document.getElementById('pp-progression-styles')) return;
        var style = document.createElement('style');
        style.id = 'pp-progression-styles';
        style.textContent = getCss();
        document.head.appendChild(style);
    }

    function getCss() {
        return '' +
        /* Modal */
        '.pp-modal {' +
            'display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;' +
            'background:rgba(0,0,0,0.88);z-index:3000;align-items:center;justify-content:center;padding:16px;' +
        '}' +
        '.pp-modal.active,.pp-modal[style*="display: flex"] { display:flex !important; }' +
        '.pp-modal-content {' +
            'background:var(--card-bg,#1a1a2e);border:2px solid var(--secondary-color,#00ffff);' +
            'border-radius:10px;max-width:640px;width:100%;max-height:90vh;overflow:hidden;' +
            'display:flex;flex-direction:column;' +
            'box-shadow:0 0 40px rgba(0,255,255,0.35);' +
        '}' +
        '.pp-modal-header {' +
            'display:flex;align-items:center;justify-content:space-between;' +
            'padding:16px 20px;border-bottom:2px solid rgba(0,255,255,0.2);flex-shrink:0;' +
        '}' +
        '.pp-modal-title {' +
            'color:var(--accent-color,#ffff00);font-size:16px;margin:0;text-shadow:0 0 12px rgba(255,255,0,0.4);' +
        '}' +
        '.pp-modal-close {' +
            'background:none;border:2px solid var(--secondary-color,#00ffff);border-radius:4px;' +
            'color:var(--secondary-color,#00ffff);font-size:20px;width:36px;height:36px;cursor:pointer;' +
            'display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;' +
            'font-family:inherit;line-height:1;' +
        '}' +
        '.pp-modal-close:hover {' +
            'background:var(--secondary-color,#00ffff);color:#000;' +
            'box-shadow:0 0 12px rgba(0,255,255,0.5);' +
        '}' +
        '.pp-modal-body {' +
            'padding:20px;overflow-y:auto;overflow-x:hidden;flex:1;' +
        '}' +

        /* Player Header */
        '.pp-player-header {' +
            'display:flex;align-items:center;justify-content:space-between;' +
            'margin-bottom:20px;' +
        '}' +
        '.pp-player-name {' +
            'color:#e0e0e0;font-size:14px;' +
        '}' +
        '.pp-player-level-badge {' +
            'background:var(--primary-color,#ff00ff);color:#fff;padding:6px 14px;' +
            'border-radius:20px;font-size:12px;letter-spacing:1px;' +
            'box-shadow:0 0 12px rgba(255,0,255,0.4);' +
        '}' +

        /* Level Card */
        '.pp-level-card {' +
            'background:rgba(0,255,255,0.05);border:1px solid rgba(0,255,255,0.2);' +
            'border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;' +
        '}' +
        '.pp-level-number {' +
            'color:var(--accent-color,#ffff00);font-size:22px;margin-bottom:12px;' +
            'text-shadow:0 0 16px rgba(255,255,0,0.5);' +
        '}' +
        '.pp-level-xp-row {' +
            'color:#e0e0e0;font-size:13px;margin-bottom:14px;' +
        '}' +
        '.pp-xp-separator { color:#666; margin:0 4px; }' +
        '.pp-xp-required { color:#888; }' +

        /* Progress Bar */
        '.pp-progress-bar-container {' +
            'width:100%;height:14px;background:rgba(255,255,255,0.1);' +
            'border-radius:7px;overflow:hidden;margin-bottom:10px;' +
            'border:1px solid rgba(0,255,255,0.2);' +
        '}' +
        '.pp-progress-bar {' +
            'height:100%;border-radius:7px;transition:width 0.5s ease;' +
            'background:linear-gradient(90deg,var(--primary-color,#ff00ff),var(--secondary-color,#00ffff));' +
            'box-shadow:0 0 10px rgba(0,255,255,0.4);' +
            'min-width:0;' +
        '}' +
        '.pp-level-remaining {' +
            'color:#888;font-size:10px;' +
        '}' +

        /* Achievement Overview */
        '.pp-ach-overview { margin-bottom:20px; }' +
        '.pp-section-title {' +
            'color:var(--secondary-color,#00ffff);font-size:14px;' +
            'margin-bottom:14px;padding-bottom:8px;' +
            'border-bottom:1px solid rgba(0,255,255,0.2);' +
        '}' +
        '.pp-ach-stats {' +
            'display:flex;gap:16px;' +
        '}' +
        '.pp-ach-stat {' +
            'flex:1;text-align:center;background:rgba(0,255,255,0.05);' +
            'border:1px solid rgba(0,255,255,0.15);border-radius:8px;padding:12px 8px;' +
        '}' +
        '.pp-ach-stat-number {' +
            'display:block;color:var(--accent-color,#ffff00);font-size:18px;margin-bottom:4px;' +
        '}' +
        '.pp-ach-stat-label {' +
            'display:block;color:#888;font-size:8px;text-transform:uppercase;letter-spacing:1px;' +
        '}' +

        /* Filters */
        '.pp-ach-filters {' +
            'display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;' +
        '}' +
        '.pp-filter-btn {' +
            'padding:6px 14px;border:2px solid var(--secondary-color,#00ffff);' +
            'background:transparent;color:var(--secondary-color,#00ffff);' +
            'border-radius:16px;font-size:9px;cursor:pointer;font-family:inherit;' +
            'transition:all 0.2s ease;text-transform:uppercase;' +
        '}' +
        '.pp-filter-btn:hover,.pp-filter-btn.active {' +
            'background:var(--secondary-color,#00ffff);color:#000;' +
            'box-shadow:0 0 10px rgba(0,255,255,0.4);' +
        '}' +

        /* Achievement Grid */
        '.pp-ach-grid {' +
            'display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:24px;' +
        '}' +

        /* Achievement Card */
        '.pp-ach-card {' +
            'display:flex;align-items:flex-start;gap:12px;' +
            'background:rgba(0,255,255,0.04);border:1px solid rgba(0,255,255,0.12);' +
            'border-radius:8px;padding:12px;transition:all 0.2s ease;' +
        '}' +
        '.pp-ach-card:focus-visible {' +
            'outline:2px solid var(--secondary-color,#00ffff);outline-offset:2px;' +
        '}' +
        '.pp-ach-unlocked {' +
            'border-color:rgba(255,0,255,0.3);background:rgba(255,0,255,0.06);' +
        '}' +
        '.pp-ach-locked { opacity:0.75; }' +
        '.pp-ach-icon { font-size:24px;flex-shrink:0;width:36px;text-align:center;line-height:36px; }' +
        '.pp-ach-info { flex:1;min-width:0; }' +
        '.pp-ach-name { color:#e0e0e0;font-size:11px;margin-bottom:3px; }' +
        '.pp-ach-desc { color:#888;font-size:9px;line-height:1.5;margin-bottom:4px; }' +
        '.pp-ach-reward { color:var(--primary-color,#ff00ff);font-size:9px; }' +
        '.pp-ach-unlock-time { color:#666;font-size:8px;margin-top:2px; }' +

        /* Achievement Progress */
        '.pp-ach-progress { margin-top:6px; }' +
        '.pp-ach-progress-bar-container {' +
            'width:100%;height:6px;background:rgba(255,255,255,0.1);' +
            'border-radius:3px;overflow:hidden;margin-bottom:3px;' +
        '}' +
        '.pp-ach-progress-bar {' +
            'height:100%;border-radius:3px;transition:width 0.5s ease;' +
            'background:linear-gradient(90deg,var(--primary-color,#ff00ff),var(--secondary-color,#00ffff));' +
        '}' +
        '.pp-ach-progress-text { color:#666;font-size:8px; }' +

        /* Achievement Empty */
        '.pp-ach-empty { color:#666;font-size:10px;text-align:center;padding:20px 0; }' +

        /* XP History */
        '.pp-xp-history { margin-bottom:12px; }' +
        '.pp-xp-empty { color:#666;font-size:10px;padding:12px 0; }' +
        '.pp-xp-list { display:flex;flex-direction:column;gap:8px; }' +
        '.pp-xp-entry {' +
            'display:grid;grid-template-columns:auto 1fr auto;' +
            'grid-template-rows:auto auto;' +
            'gap:2px 10px;padding:8px 10px;' +
            'background:rgba(0,255,255,0.03);border:1px solid rgba(0,255,255,0.08);' +
            'border-radius:6px;font-size:9px;align-items:center;' +
        '}' +
        '.pp-xp-amount { color:var(--primary-color,#ff00ff);font-size:11px;grid-row:1/3; }' +
        '.pp-xp-source { color:#ccc; }' +
        '.pp-xp-game { color:#888;font-size:8px; }' +
        '.pp-xp-time { color:#555;font-size:8px;text-align:right;grid-row:1/3;grid-column:3; }' +

        /* Nav entry */
        '.pp-nav-progress { position:relative; }' +

        /* Responsive */
        '@media (max-width:768px) {' +
            '.pp-modal-content { max-height:95vh;border-radius:8px; }' +
            '.pp-modal-body { padding:14px; }' +
            '.pp-level-number { font-size:18px; }' +
            '.pp-ach-stats { flex-direction:column;gap:8px; }' +
            '.pp-ach-stat { padding:10px; }' +
            '.pp-ach-stat-number { font-size:16px; }' +
            '.pp-xp-entry { grid-template-columns:auto 1fr;grid-template-rows:auto auto auto; }' +
            '.pp-xp-time { grid-column:2;text-align:left;grid-row:3; }' +
        '}' +

        /* Reduced motion */
        '@media (prefers-reduced-motion: reduce) {' +
            '.pp-progress-bar,.pp-ach-progress-bar { transition:none; }' +
        '}';
    }

    // ========================================================
    // UTILITIES
    // ========================================================

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatRelativeTime(isoString) {
        if (!isoString) return '';
        var then = new Date(isoString).getTime();
        var now = Date.now();
        var diff = now - then;
        if (diff < 0) diff = 0;

        var seconds = Math.floor(diff / 1000);
        if (seconds < 60) return 'just now';

        var minutes = Math.floor(seconds / 60);
        if (minutes < 60) return minutes + 'm ago';

        var hours = Math.floor(minutes / 60);
        if (hours < 24) return hours + 'h ago';

        var days = Math.floor(hours / 24);
        if (days < 7) return days + 'd ago';

        var date = new Date(isoString);
        return date.toLocaleDateString();
    }

    // ========================================================
    // PUBLIC API
    // ========================================================
    return {
        init: init,
        open: open,
        close: close,
        isOpen: function () { return isOpen; }
    };
})();

if (typeof window !== 'undefined') {
    window.PixelPalaceProgressionUI = PixelPalaceProgressionUI;
}
