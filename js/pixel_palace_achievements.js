/**
 * PixelPalaceAchievementDefinitions
 * Centralized, authoritative achievement definitions for Pixel Palace.
 *
 * ALL achievement metadata, IDs, conditions, and rewards live here.
 * The achievement engine interprets these definitions generically.
 *
 * To add a new achievement, add a definition object to the ACHIEVEMENTS array.
 * Do NOT add evaluator code anywhere — the engine handles all evaluation.
 *
 * @namespace PixelPalaceAchievementDefinitions
 */
var PixelPalaceAchievementDefinitions = (function () {
    'use strict';

    // ========================================================
    // ACHIEVEMENT CATEGORIES
    // ========================================================
    var CATEGORIES = {
        MILESTONE: 'milestone',
        SCORE: 'score',
        EXPLORATION: 'exploration',
        PROGRESSION: 'progression',
        GAME_SPECIFIC: 'game_specific'
    };

    // ========================================================
    // CONDITION TYPES
    // ========================================================
    // Generic condition types that the evaluator understands.
    // Each achievement definition uses these to express its unlock logic.
    //
    // "count"          — A counter metric meets a threshold.
    //                    metric: "gamesCompleted", operator, value
    // "unique_count"   — Distinct items in a collection meet a threshold.
    //                    metric: "categoriesPlayed", operator, value
    // "threshold"      — A scalar value meets a threshold.
    //                    metric: "level", operator, value
    // "personal_best"  — A personal best event for a specific game.
    //                    gameId: string (or null for any game)
    // "personal_best_count" — Total PB count meets a threshold.
    //                    operator, value

    var CONDITION_TYPES = {
        COUNT: 'count',
        UNIQUE_COUNT: 'unique_count',
        THRESHOLD: 'threshold',
        PERSONAL_BEST: 'personal_best',
        PERSONAL_BEST_COUNT: 'personal_best_count'
    };

    // ========================================================
    // ACHIEVEMENT DEFINITIONS
    // ========================================================
    var ACHIEVEMENTS = [
        // --- MILESTONE ---
        {
            id: 'first_steps',
            name: 'First Steps',
            description: 'Complete your first game.',
            category: CATEGORIES.MILESTONE,
            icon: '🎮',
            hidden: false,
            conditions: [
                { type: CONDITION_TYPES.COUNT, metric: 'gamesCompleted', operator: '>=', value: 1 }
            ],
            reward: { type: 'xp', amount: 10 }
        },
        {
            id: 'getting_started',
            name: 'Getting Started',
            description: 'Complete 10 games.',
            category: CATEGORIES.MILESTONE,
            icon: '🎯',
            hidden: false,
            conditions: [
                { type: CONDITION_TYPES.COUNT, metric: 'gamesCompleted', operator: '>=', value: 10 }
            ],
            reward: { type: 'xp', amount: 25 }
        },

        // --- SCORE ---
        {
            id: 'high_score',
            name: 'High Score',
            description: 'Set your first personal best.',
            category: CATEGORIES.SCORE,
            icon: '⭐',
            hidden: false,
            conditions: [
                { type: CONDITION_TYPES.PERSONAL_BEST_COUNT, operator: '>=', value: 1 }
            ],
            reward: { type: 'xp', amount: 15 }
        },
        {
            id: 'unstoppable',
            name: 'Unstoppable',
            description: 'Set 5 personal bests.',
            category: CATEGORIES.SCORE,
            icon: '🔥',
            hidden: false,
            conditions: [
                { type: CONDITION_TYPES.PERSONAL_BEST_COUNT, operator: '>=', value: 5 }
            ],
            reward: { type: 'xp', amount: 30 }
        },

        // --- EXPLORATION ---
        {
            id: 'arcade_explorer',
            name: 'Arcade Explorer',
            description: 'Play games from 3 different categories.',
            category: CATEGORIES.EXPLORATION,
            icon: '🗺️',
            hidden: false,
            conditions: [
                { type: CONDITION_TYPES.UNIQUE_COUNT, metric: 'categoriesPlayed', operator: '>=', value: 3 }
            ],
            reward: { type: 'xp', amount: 20 }
        },
        {
            id: 'polyplayer',
            name: 'Polyplayer',
            description: 'Play games from every available category.',
            category: CATEGORIES.EXPLORATION,
            icon: '🌐',
            hidden: false,
            conditions: [
                { type: CONDITION_TYPES.UNIQUE_COUNT, metric: 'categoriesPlayed', operator: '>=', value: -1 }
                // value -1 means "all categories in GameRegistry"
            ],
            reward: { type: 'xp', amount: 50 }
        },

        // --- PROGRESSION ---
        {
            id: 'level_5',
            name: 'Rising Star',
            description: 'Reach level 5.',
            category: CATEGORIES.PROGRESSION,
            icon: '🌟',
            hidden: false,
            conditions: [
                { type: CONDITION_TYPES.THRESHOLD, metric: 'level', operator: '>=', value: 5 }
            ],
            reward: { type: 'xp', amount: 20 }
        },
        {
            id: 'level_10',
            name: 'Veteran',
            description: 'Reach level 10.',
            category: CATEGORIES.PROGRESSION,
            icon: '💎',
            hidden: false,
            conditions: [
                { type: CONDITION_TYPES.THRESHOLD, metric: 'level', operator: '>=', value: 10 }
            ],
            reward: { type: 'xp', amount: 40 }
        },

        // --- GAME-SPECIFIC ---
        {
            id: 'brick_breaker',
            name: 'Brick Breaker',
            description: 'Set a personal best in Brick Smash Chronicles.',
            category: CATEGORIES.GAME_SPECIFIC,
            icon: '🧱',
            hidden: false,
            conditions: [
                { type: CONDITION_TYPES.PERSONAL_BEST, gameId: 'brick-smash' }
            ],
            reward: { type: 'xp', amount: 15 }
        },
        {
            id: 'slither_master',
            name: 'Slither Master',
            description: 'Set a personal best in Slither Survival.',
            category: CATEGORIES.GAME_SPECIFIC,
            icon: '🐍',
            hidden: false,
            conditions: [
                { type: CONDITION_TYPES.PERSONAL_BEST, gameId: 'slither-survival' }
            ],
            reward: { type: 'xp', amount: 15 }
        },
        {
            id: 'speed_demon',
            name: 'Speed Demon',
            description: 'Set a personal best in Typing Sprint Arena.',
            category: CATEGORIES.GAME_SPECIFIC,
            icon: '⚡',
            hidden: false,
            conditions: [
                { type: CONDITION_TYPES.PERSONAL_BEST, gameId: 'typing-sprint' }
            ],
            reward: { type: 'xp', amount: 15 }
        }
    ];

    // ========================================================
    // PUBLIC API
    // ========================================================
    return {
        ACHIEVEMENTS: ACHIEVEMENTS,
        CATEGORIES: CATEGORIES,
        CONDITION_TYPES: CONDITION_TYPES
    };
})();

if (typeof window !== 'undefined') {
    window.PixelPalaceAchievementDefinitions = PixelPalaceAchievementDefinitions;
}
