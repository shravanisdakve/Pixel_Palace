/**
 * Pixel Palace Score Manager
 *
 * Handles saving and retrieving high scores from localStorage.
 *
 * In M1 Task 1 this was updated to delegate to the PixelPalace core API
 * as the single source of truth for scoring, while preserving full
 * backwards compatibility with existing game code.
 *
 * Legacy usage (still works):
 *   ScoreManager.saveScore('game-id', 42, 'Player 1')
 *   ScoreManager.getScores('game-id')
 *   ScoreManager.isHighScore('game-id', 42)
 *
 * New usage (preferred):
 *   PixelPalace.startSession('game-id')
 *   PixelPalace.endSession(sessionId, { score: 42 })
 *   PixelPalace.getPersonalBest('game-id')
 */
class ScoreManager {
    /**
     * Storage key for legacy top-10 leaderboard data.
     * Kept for backwards compatibility.
     * @returns {string}
     */
    static get storageKey() {
        return 'pixelPalace_leaderboards';
    }

    /**
     * Get the top 10 leaderboard scores for a game.
     *
     * Reads from the legacy pixelPalace_leaderboards key for backwards
     * compatibility with existing game code.
     *
     * @param {string} gameId - Unique identifier for the game
     * @returns {Array} List of score objects { name, score, date }
     */
    static getScores(gameId) {
        try {
            var allScores = JSON.parse(localStorage.getItem(this.storageKey)) || {};
            return allScores[gameId] || [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Save a new score to the legacy top-10 leaderboard.
     *
     * Also delegates to the PixelPalace core API if available,
     * ensuring the new system stays in sync.
     *
     * @param {string} gameId
     * @param {number} score
     * @param {string} playerName
     * @returns {Array} Updated top-10 list
     */
    static saveScore(gameId, score, playerName = 'Player 1') {
        var numScore = Number(score);
        if (!isFinite(numScore)) return this.getScores(gameId);

        // Legacy: maintain the old pixelPalace_leaderboards key
        try {
            var allScores = JSON.parse(localStorage.getItem(this.storageKey)) || {};
            var gameScores = allScores[gameId] || [];

            gameScores.push({
                name: playerName,
                score: numScore,
                date: new Date().toISOString()
            });

            gameScores.sort(function (a, b) { return b.score - a.score; });
            var topScores = gameScores.slice(0, 10);

            allScores[gameId] = topScores;
            localStorage.setItem(this.storageKey, JSON.stringify(allScores));
        } catch (e) {
            // Gracefully handle localStorage errors
        }

        // New system: delegate to PixelPalace core if available
        if (typeof window !== 'undefined' && window.PixelPalace) {
            try {
                var pbResult = window.PixelPalace.evaluatePersonalBest(gameId, numScore);
                // Also record in the new scores store
                window.PixelPalace._storage.set(
                    'scores',
                    (function () {
                        try {
                            var existing = JSON.parse(localStorage.getItem('pp_scores')) || {};
                            if (!existing[gameId]) existing[gameId] = [];
                            existing[gameId].push({
                                score: numScore,
                                achievedAt: new Date().toISOString(),
                                sessionId: null
                            });
                            if (existing[gameId].length > 50) {
                                existing[gameId] = existing[gameId].slice(existing[gameId].length - 50);
                            }
                            return existing;
                        } catch (err) {
                            var obj = {};
                            obj[gameId] = [{ score: numScore, achievedAt: new Date().toISOString(), sessionId: null }];
                            return obj;
                        }
                    })()
                );
            } catch (ignored) {
                // Core API not fully loaded — legacy path still works
            }
        }

        return this.getScores(gameId);
    }

    /**
     * Check if a score qualifies for the top 10 leaderboard.
     *
     * @param {string} gameId
     * @param {number} score
     * @returns {boolean}
     */
    static isHighScore(gameId, score) {
        var scores = this.getScores(gameId);
        if (scores.length < 10) return true;
        return Number(score) > scores[scores.length - 1].score;
    }
}

// Expose to window for global access (backwards compatibility)
if (typeof window !== 'undefined') {
    window.ScoreManager = ScoreManager;
}
