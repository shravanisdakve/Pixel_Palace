/**
 * PixelPalace
 * Central platform API for Pixel Palace Arcade.
 *
 * This is the single entry point for all game-to-platform communication.
 * Individual games call these APIs rather than managing their own storage.
 *
 * Dependencies (load order):
 *   1. pixel_palace_storage.js
 *   2. pixel_palace_player.js
 *   3. pixel_palace_registry.js
 *   4. pixel_palace_core.js  (this file)
 *
 * @namespace PixelPalace
 */
var PixelPalace = (function () {
    'use strict';

    var SCORES_KEY = 'scores';
    var SESSIONS_KEY = 'sessions';
    var MAX_SESSIONS = 100;

    // ========================================================
    // SESSION MANAGEMENT
    // ========================================================

    /**
     * Generate a short unique session ID.
     * @returns {string}
     */
    function generateSessionId() {
        return 'ses_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
    }

    /**
     * Get all stored sessions for the current player.
     * @returns {Array}
     */
    function getSessions() {
        return PixelPalaceStorage.get(SESSIONS_KEY, []);
    }

    /**
     * Save sessions array to storage.
     * @param {Array} sessions
     */
    function saveSessions(sessions) {
        PixelPalaceStorage.set(SESSIONS_KEY, sessions);
    }

    /**
     * Start a new game session.
     *
     * @param {string} gameId - Must be a registered game ID
     * @returns {Object} { ok: true, session } or { ok: false, error: string }
     */
    function startSession(gameId) {
        if (!gameId || typeof gameId !== 'string') {
            return { ok: false, error: 'Invalid game ID.' };
        }

        if (!PixelPalaceRegistry.isValid(gameId)) {
            return { ok: false, error: 'Unknown game: "' + gameId + '".' };
        }

        var playerId = PixelPalacePlayer.getId();
        var now = new Date().toISOString();

        var session = {
            id: generateSessionId(),
            gameId: gameId,
            playerId: playerId,
            startedAt: now,
            endedAt: null,
            score: null
        };

        var sessions = getSessions();
        sessions.push(session);

        // Trim old sessions to prevent unbounded growth
        if (sessions.length > MAX_SESSIONS) {
            sessions = sessions.slice(sessions.length - MAX_SESSIONS);
        }

        saveSessions(sessions);

        return { ok: true, session: session };
    }

    /**
     * End a game session and record the score.
     *
     * @param {string} sessionId - The session ID returned by startSession
     * @param {Object} result - { score: number }
     * @returns {Object} { ok: true, session, personalBest } or { ok: false, error: string }
     */
    function endSession(sessionId, result) {
        if (!sessionId || typeof sessionId !== 'string') {
            return { ok: false, error: 'Invalid session ID.' };
        }

        if (!result || typeof result !== 'object' || typeof result.score !== 'number') {
            return { ok: false, error: 'Invalid score. Must be a number.' };
        }

        var score = result.score;

        if (!isFinite(score)) {
            return { ok: false, error: 'Score must be a finite number.' };
        }

        var sessions = getSessions();
        var session = null;

        for (var i = sessions.length - 1; i >= 0; i--) {
            if (sessions[i].id === sessionId) {
                session = sessions[i];
                break;
            }
        }

        if (!session) {
            return { ok: false, error: 'Session not found: "' + sessionId + '".' };
        }

        var playerId = PixelPalacePlayer.getId();
        if (session.playerId !== playerId) {
            return { ok: false, error: 'Session does not belong to current player.' };
        }

        if (session.endedAt !== null) {
            return { ok: false, error: 'Session has already ended.' };
        }

        // Close the session
        session.endedAt = new Date().toISOString();
        session.score = score;
        saveSessions(sessions);

        // Record the score
        recordScore(session.gameId, score, session.id);

        // Evaluate personal best
        var pbResult = evaluatePersonalBest(session.gameId, score);

        return {
            ok: true,
            session: session,
            personalBest: pbResult
        };
    }

    // ========================================================
    // SCORE MANAGEMENT
    // ========================================================

    /**
     * Get all stored scores for the current player.
     * @returns {Object} Map of gameId -> Array of score records
     */
    function getAllScores() {
        return PixelPalaceStorage.get(SCORES_KEY, {});
    }

    /**
     * Get scores for a specific game.
     *
     * @param {string} gameId
     * @returns {Array}
     */
    function getScores(gameId) {
        var all = getAllScores();
        return all[gameId] || [];
    }

    /**
     * Record a score for a game session.
     *
     * @param {string} gameId
     * @param {number} score
     * @param {string} sessionId
     */
    function recordScore(gameId, score, sessionId) {
        var allScores = getAllScores();
        if (!allScores[gameId]) {
            allScores[gameId] = [];
        }

        allScores[gameId].push({
            score: Number(score),
            achievedAt: new Date().toISOString(),
            sessionId: sessionId || null
        });

        // Keep last 50 scores per game to prevent unbounded growth
        if (allScores[gameId].length > 50) {
            allScores[gameId] = allScores[gameId].slice(allScores[gameId].length - 50);
        }

        PixelPalaceStorage.set(SCORES_KEY, allScores);
    }

    // ========================================================
    // PERSONAL BEST
    // ========================================================

    var PB_KEY = 'personal_bests';

    /**
     * Get all personal bests for the current player.
     * @returns {Object} Map of gameId -> { score, achievedAt }
     */
    function getAllPersonalBests() {
        return PixelPalaceStorage.get(PB_KEY, {});
    }

    /**
     * Get the personal best for a specific game.
     *
     * @param {string} gameId
     * @returns {Object|null} { score, achievedAt } or null if no score yet
     */
    function getPersonalBest(gameId) {
        if (!gameId) return null;
        var pbs = getAllPersonalBests();
        return pbs[gameId] || null;
    }

    /**
     * Evaluate whether a new score is a personal best.
     *
     * For games where higher is better (scoreDirection === 'higher' or null):
     *   New score wins if it is greater than existing best.
     *
     * For games where lower is better (scoreDirection === 'lower'):
     *   New score wins if it is less than existing best.
     *
     * @param {string} gameId
     * @param {number} score
     * @returns {Object} { isNewBest: boolean, score, previousBest }
     */
    function evaluatePersonalBest(gameId, score) {
        var game = PixelPalaceRegistry.getById(gameId);
        var direction = (game && game.scoreDirection === 'lower') ? 'lower' : 'higher';

        var current = getPersonalBest(gameId);
        var isNewBest = false;

        if (current === null) {
            isNewBest = true;
        } else if (direction === 'higher') {
            isNewBest = score > current.score;
        } else {
            isNewBest = score < current.score;
        }

        if (isNewBest) {
            var pbs = getAllPersonalBests();
            pbs[gameId] = {
                score: Number(score),
                achievedAt: new Date().toISOString()
            };
            PixelPalaceStorage.set(PB_KEY, pbs);
        }

        return {
            isNewBest: isNewBest,
            score: Number(score),
            previousBest: current ? current.score : null
        };
    }

    // ========================================================
    // PUBLIC API
    // ========================================================

    return {
        // Session management
        startSession: startSession,
        endSession: endSession,

        // Score access
        getScores: getScores,
        getAllScores: getAllScores,

        // Personal best
        getPersonalBest: getPersonalBest,
        getAllPersonalBests: getAllPersonalBests,
        evaluatePersonalBest: evaluatePersonalBest,

        // Convenience: delegate to sub-modules
        getPlayer: PixelPalacePlayer.get,
        getPlayerId: PixelPalacePlayer.getId,
        getPlayerName: PixelPalacePlayer.getDisplayName,
        setNickname: PixelPalacePlayer.setNickname,

        getGame: PixelPalaceRegistry.getById,
        getGameRoute: PixelPalaceRegistry.getRoute,
        isGameValid: PixelPalaceRegistry.isValid,
        getAllGames: PixelPalaceRegistry.getAll,
        getGamesByCategory: PixelPalaceRegistry.getByCategory,
        getGameCount: PixelPalaceRegistry.count,

        // Storage (advanced use only)
        _storage: PixelPalaceStorage
    };
})();

if (typeof window !== 'undefined') {
    window.PixelPalace = PixelPalace;
}
