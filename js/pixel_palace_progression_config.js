/**
 * PixelPalaceProgressionConfig
 * Centralized, authoritative progression configuration for Pixel Palace.
 *
 * ALL progression values, thresholds, and rules live here.
 * No other file should contain XP values, level thresholds, or progression logic.
 *
 * To adjust the XP economy, modify this file only.
 *
 * @namespace PixelPalaceProgressionConfig
 */
var PixelPalaceProgressionConfig = (function () {
    'use strict';

    // ========================================================
    // XP AWARDS
    // ========================================================
    // Base XP awarded when a game session ends with a valid score.
    var XP_PER_COMPLETION = 10;

    // Bonus XP for the first time a player completes a specific game.
    var XP_FIRST_PLAY_BONUS = 25;

    // Bonus XP when a new personal best is set.
    var XP_PERSONAL_BEST_BONUS = 15;

    // ========================================================
    // XP SOURCES
    // ========================================================
    // Centralized source identifiers used in XP transactions.
    // Games and the platform reference these — never hardcode strings.
    var SOURCES = {
        GAME_COMPLETION: 'game_completion',
        FIRST_PLAY: 'first_play',
        PERSONAL_BEST: 'personal_best'
    };

    // ========================================================
    // LEVEL THRESHOLDS
    // ========================================================
    // Cumulative XP required to reach each level.
    // Level 1 is the starting level (0 XP required).
    // Each entry defines the XP needed to reach that level.
    //
    // Design rationale:
    // - Levels 1-10: Quick early progression (10-50 XP per level)
    //   Encourages engagement. ~2-3 games per level.
    // - Levels 11-20: Moderate (60-120 XP per level)
    //   Requires variety. ~5-10 games per level.
    // - Levels 21-30: Slower (150-300 XP per level)
    //   Rewards dedication. ~15-25 games per level.
    // - Levels 31+: Long-term (400+ XP per level)
    //   Prestige range. Requires sustained play across many games.
    //
    // With base completion XP of 10, first-play bonus of 25,
    // and PB bonus of 15:
    //   - First session of a new game: 10 + 25 = 35 XP
    //   - Repeat session: 10 XP
    //   - Repeat with PB: 10 + 15 = 25 XP
    //   - Repeat with first PB: 10 + 25 + 15 = 50 XP
    var LEVEL_THRESHOLDS = [
        0,      // Level 1 (starting)
        50,     // Level 2
        120,    // Level 3
        210,    // Level 4
        320,    // Level 5
        460,    // Level 6
        630,    // Level 7
        830,    // Level 8
        1070,   // Level 9
        1360,   // Level 10
        1700,   // Level 11
        2100,   // Level 12
        2560,   // Level 13
        3090,   // Level 14
        3700,   // Level 15
        4400,   // Level 16
        5200,   // Level 17
        6100,   // Level 18
        7100,   // Level 19
        8200,   // Level 20
        9500,   // Level 21
        11000,  // Level 22
        12700,  // Level 23
        14600,  // Level 24
        16800,  // Level 25
        19300,  // Level 26
        22100,  // Level 27
        25300,  // Level 28
        28900,  // Level 29
        33000,  // Level 30
        37500,  // Level 31
        42500,  // Level 32
        48000,  // Level 33
        54000,  // Level 34
        60500,  // Level 35
        67500,  // Level 36
        75000,  // Level 37
        83000,  // Level 38
        91500,  // Level 39
        100500  // Level 40 (max)
    ];

    // Maximum level a player can reach.
    var MAX_LEVEL = LEVEL_THRESHOLDS.length;

    // ========================================================
    // STORAGE
    // ========================================================
    // Keys used by the progression engine (all go through PixelPalaceStorage).
    var STORAGE_KEYS = {
        PROGRESS: 'progress',
        XP_HISTORY: 'xp_history',
        FIRST_PLAYS: 'first_plays'
    };

    // Maximum number of XP transactions to retain.
    var MAX_XP_HISTORY = 500;

    // ========================================================
    // PUBLIC API
    // ========================================================
    return {
        XP_PER_COMPLETION: XP_PER_COMPLETION,
        XP_FIRST_PLAY_BONUS: XP_FIRST_PLAY_BONUS,
        XP_PERSONAL_BEST_BONUS: XP_PERSONAL_BEST_BONUS,

        SOURCES: SOURCES,

        LEVEL_THRESHOLDS: LEVEL_THRESHOLDS,
        MAX_LEVEL: MAX_LEVEL,

        STORAGE_KEYS: STORAGE_KEYS,
        MAX_XP_HISTORY: MAX_XP_HISTORY
    };
})();

if (typeof window !== 'undefined') {
    window.PixelPalaceProgressionConfig = PixelPalaceProgressionConfig;
}
