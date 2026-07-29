/**
 * Pixel Palace Score Manager
 * Handles saving and retrieving high scores from localStorage.
 */
class ScoreManager {
    static get storageKey() {
        return 'pixelPalace_leaderboards';
    }

    /**
     * Get all scores for a specific game
     * @param {string} gameId - Unique identifier for the game
     * @returns {Array} List of score objects { name, score, date }
     */
    static getScores(gameId) {
        const allScores = JSON.parse(localStorage.getItem(this.storageKey)) || {};
        return allScores[gameId] || [];
    }

    /**
     * Save a new score
     * @param {string} gameId 
     * @param {number} score 
     * @param {string} playerName 
     */
    static saveScore(gameId, score, playerName = 'Player 1') {
        const allScores = JSON.parse(localStorage.getItem(this.storageKey)) || {};
        const gameScores = allScores[gameId] || [];

        // Add new score
        gameScores.push({
            name: playerName,
            score: Number(score),
            date: new Date().toISOString()
        });

        // Sort descending (highest first)
        gameScores.sort((a, b) => b.score - a.score);

        // Keep top 10
        const topScores = gameScores.slice(0, 10);

        // Save back
        allScores[gameId] = topScores;
        localStorage.setItem(this.storageKey, JSON.stringify(allScores));

        return topScores;
    }

    /**
     * Check if a score qualifies for the top 10
     * @param {string} gameId 
     * @param {number} score 
     */
    static isHighScore(gameId, score) {
        const scores = this.getScores(gameId);
        if (scores.length < 10) return true;
        return score > scores[scores.length - 1].score;
    }
}

// Expose to window for global access
window.ScoreManager = ScoreManager;
