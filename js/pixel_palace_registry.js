/**
 * PixelPalaceRegistry
 * Centralized game metadata registry for Pixel Palace.
 *
 * Every playable game in the arcade should be registered here.
 * The registry is the single source of truth for game metadata.
 *
 * @namespace PixelPalaceRegistry
 */
var PixelPalaceRegistry = (function () {
    'use strict';

    var games = [
        // ===== ARCADE =====
        {
            id: 'brick-smash',
            name: 'Brick Smash Chronicles',
            category: 'arcade',
            type: 'action',
            route: 'Arcade/Brick Smash Chronicles/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Break bricks and clear levels in this classic arcade challenge!'
        },
        {
            id: 'flappy-flight',
            name: 'Flappy Flight Frenzy',
            category: 'arcade',
            type: 'action',
            route: 'Arcade/Flappy Flight Frenzy/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Navigate a flapping bird through challenging pipes!'
        },
        {
            id: 'rebound-rescue',
            name: 'Rebound Rescue',
            category: 'arcade',
            type: 'action',
            route: 'Arcade/Rebound Rescue/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Bounce the ball to break bricks and save the day!'
        },
        {
            id: 'bug-collector',
            name: 'Bug Collector Quest',
            category: 'arcade',
            type: 'action',
            route: 'Arcade/Bug Collector Quest/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Test your reflexes by catching as many pesky bugs as you can!'
        },
        {
            id: 'scripted-adventures',
            name: 'Scripted Adventures',
            category: 'arcade',
            type: 'action',
            route: 'Arcade/Scripted Adventures/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Jump over obstacles in this endless runner adventure!'
        },
        {
            id: 'pixel-blaster',
            name: 'Pixel Blaster Showdown',
            category: 'arcade',
            type: 'action',
            route: 'Arcade/Pixel Blaster Showdown/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Aim and shoot to burst balloons in this fast-paced shooting gallery!'
        },
        {
            id: 'rabbit-race',
            name: "Hare's High-Speed Chase",
            category: 'arcade',
            type: 'action',
            route: 'Arcade/Rabbit Race/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Roll the dice, strategize, and race to be the first rabbit to reach 100 points!'
        },
        {
            id: 'slither-survival',
            name: 'Slither Survival',
            category: 'arcade',
            type: 'action',
            route: 'Arcade/Slither Survival/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Guide your snake to eat food and grow longer without hitting walls or yourself!'
        },

        // ===== PUZZLES =====
        {
            id: 'puzzle-2048',
            name: '2048 Merge Odyssey',
            category: 'puzzles',
            type: 'puzzle',
            route: 'Puzzles/2048 Merge Odyssey/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Slide and combine numbered tiles to reach the ultimate 2048 tile!'
        },
        {
            id: 'mind-vault',
            name: 'Mind Vault Memory',
            category: 'puzzles',
            type: 'puzzle',
            route: 'Puzzles/Mind Vault Memory/mainGame.html',
            playable: true,
            scoreDirection: 'lower',
            description: 'Test your memory and concentration by matching pairs of hidden cards.'
        },
        {
            id: 'chromatic-reflex',
            name: 'Chromatic Reflex',
            category: 'puzzles',
            type: 'puzzle',
            route: 'Puzzles/Chromatic Reflex/color-guessor/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Test your color perception and speed by guessing the correct color!'
        },
        {
            id: 'character-match',
            name: 'Character Match Mania',
            category: 'puzzles',
            type: 'puzzle',
            route: 'Puzzles/Character Match Mania/index.html',
            playable: true,
            scoreDirection: 'lower',
            description: 'Match pairs of popular characters in this fun memory game!'
        },
        {
            id: 'mystery-number',
            name: 'Mystery Number Quest',
            category: 'puzzles',
            type: 'puzzle',
            route: 'Puzzles/Mystery Number Quest/index.html',
            playable: true,
            scoreDirection: 'lower',
            description: 'Guess the secret number within a limited number of attempts.'
        },
        {
            id: 'puzzle-realm',
            name: 'Puzzle Realm',
            category: 'puzzles',
            type: 'puzzle',
            route: 'Puzzles/Puzzle Realm/index.html',
            playable: true,
            scoreDirection: 'lower',
            description: 'Solve various sliding tile puzzles by arranging pieces correctly.'
        },
        {
            id: 'simon-sequence',
            name: 'Simon Sequence Challenge',
            category: 'puzzles',
            type: 'puzzle',
            route: 'Puzzles/Simon Sequence Challenge/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Test your memory by repeating increasingly complex sequences of lights and sounds!'
        },
        {
            id: 'sudoku-master',
            name: 'Sudoku Master Solver',
            category: 'puzzles',
            type: 'puzzle',
            route: 'Puzzles/Sudoku Master Solver/sudoku/index.html',
            playable: true,
            scoreDirection: 'lower',
            description: 'Solve challenging Sudoku puzzles and test your logical deduction skills.'
        },

        // ===== TABLETOP =====
        {
            id: 'blackjack-royale',
            name: 'Blackjack Royale',
            category: 'tabletop',
            type: 'classic',
            route: 'Tabletop/Blackjack Royale/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Play against the dealer in this classic card game where the goal is to get 21!'
        },
        {
            id: 'chess-arena',
            name: 'Grandmaster Chess Arena',
            category: 'tabletop',
            type: 'classic',
            route: 'Tabletop/Grandmaster Chess Arena/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Challenge your mind with this classic strategy game.'
        },
        {
            id: 'ai-tictac',
            name: 'AI Tic-Tac Duel',
            category: 'tabletop',
            type: 'classic',
            route: 'Tabletop/AI Tic-Tac Duel/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Play Tic-Tac-Toe against a smart AI opponent or a friend!'
        },
        {
            id: 'dice-simulator',
            name: 'Dice Roll Simulator',
            category: 'tabletop',
            type: 'classic',
            route: 'Tabletop/Dice Roll Simulator/index.html',
            playable: true,
            scoreDirection: null,
            description: 'Simulate dice rolls for any game or just for fun.'
        },
        {
            id: 'picture-bingo',
            name: 'Picture Bingo Blast',
            category: 'tabletop',
            type: 'classic',
            route: 'Tabletop/Picture Bingo Blast/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'A fun twist on classic Bingo, matching pictures instead of numbers!'
        },
        {
            id: 'rps-battle',
            name: 'RPS Battle Arena',
            category: 'tabletop',
            type: 'classic',
            route: 'Tabletop/RPS Battle Arena/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Test your luck and strategy in the ultimate Rock-Paper-Scissors battle!'
        },
        {
            id: 'tictactoe-classic',
            name: 'Tic-Tac-Toe Classic',
            category: 'tabletop',
            type: 'classic',
            route: 'Tabletop/Tic-Tac-Toe Classic/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'The timeless game of Tic-Tac-Toe.'
        },
        {
            id: 'roll-dice-3d',
            name: 'Roll the Dice 3D',
            category: 'tabletop',
            type: 'classic',
            route: 'RollDice/index.html',
            playable: true,
            scoreDirection: null,
            description: 'A 3D dice rolling simulation.'
        },

        // ===== CHALLENGES =====
        {
            id: 'typing-sprint',
            name: 'Typing Sprint Arena',
            category: 'challenges',
            type: 'action',
            route: 'Challenges/Typing Sprint Arena/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Improve your typing speed and accuracy with various challenging text passages.'
        },
        {
            id: 'wordmaster',
            name: 'Wordmaster Challenge',
            category: 'challenges',
            type: 'puzzle',
            route: 'Challenges/Wordmaster Challenge/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Unscramble letters to form words and expand your vocabulary!'
        },
        {
            id: 'number-cruncher',
            name: 'Number Cruncher Quest',
            category: 'challenges',
            type: 'puzzle',
            route: 'Challenges/Number Cruncher Quest/quiz.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Solve math problems quickly and accurately!'
        },
        {
            id: 'brain-teaser',
            name: 'Brain Teaser Hub',
            category: 'challenges',
            type: 'puzzle',
            route: 'Challenges/Brain Teaser Hub/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'A collection of various brain-teasing puzzles and riddles.'
        },

        // ===== CREATIVE =====
        {
            id: 'sketchcraft',
            name: 'SketchCraft Studio',
            category: 'creative',
            type: 'tool',
            route: 'Creative/SketchCraft Studio/index.html',
            playable: true,
            scoreDirection: null,
            description: 'Unleash your creativity with this digital drawing application.'
        },
        {
            id: 'digital-whiteboard',
            name: 'Digital Whiteboard Canvas',
            category: 'creative',
            type: 'tool',
            route: 'Creative/Digital Whiteboard Canvas/index.html',
            playable: true,
            scoreDirection: null,
            description: 'A versatile digital whiteboard for brainstorming and drawing.'
        },
        {
            id: 'virtual-piano',
            name: 'Virtual Piano Symphony',
            category: 'creative',
            type: 'tool',
            route: 'Creative/Virtual Piano Symphony/index.html',
            playable: true,
            scoreDirection: null,
            description: 'Play a virtual piano right in your browser.'
        },
        {
            id: 'gitlab-css-art',
            name: 'GitLab CSS Art',
            category: 'creative',
            type: 'tool',
            route: 'Gitlab Logo Using HTML & CSS3/Gitlab Logo.html',
            playable: true,
            scoreDirection: null,
            description: 'A pure HTML & CSS recreation of the GitLab logo.'
        },
        {
            id: 'bouncing-balls',
            name: 'Bouncing Balls',
            category: 'creative',
            type: 'tool',
            route: 'bouncing-balls/index.html',
            playable: true,
            scoreDirection: null,
            description: 'A mesmerizing simulation of bouncing balls.'
        },

        // ===== EDUCATION =====
        {
            id: 'hangman',
            name: 'Hangman',
            category: 'education',
            type: 'puzzle',
            route: 'Education/Hangman/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Guess the hidden word letter by letter before running out of attempts!'
        },
        {
            id: 'math-master',
            name: 'Math Master Quest',
            category: 'education',
            type: 'puzzle',
            route: 'Education/Math Master Quest/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Solve arithmetic problems and climb the difficulty levels!'
        },
        {
            id: 'memory-tiles',
            name: 'Memory Tiles',
            category: 'education',
            type: 'puzzle',
            route: 'Education/Memory Tiles/index.html',
            playable: true,
            scoreDirection: 'lower',
            description: 'Test your memory by matching pairs of educational cards!'
        },
        {
            id: 'pattern-match',
            name: 'Pattern Match',
            category: 'education',
            type: 'puzzle',
            route: 'Education/Pattern Match/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Find the pattern and complete sequences correctly!'
        },
        {
            id: 'quiz-master',
            name: 'Quiz Master',
            category: 'education',
            type: 'puzzle',
            route: 'Education/Quiz Master/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Test your trivia knowledge across science, history, and pop culture!'
        },
        {
            id: 'spelling-bee',
            name: 'Spelling Bee',
            category: 'education',
            type: 'puzzle',
            route: 'Education/Spelling Bee/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Listen to words and spell them correctly with audio guidance!'
        },
        {
            id: 'typing-master',
            name: 'Typing Master',
            category: 'education',
            type: 'puzzle',
            route: 'Education/Typing Master/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Improve your typing speed and accuracy with engaging challenges!'
        },
        {
            id: 'word-builder',
            name: 'Word Builder',
            category: 'education',
            type: 'puzzle',
            route: 'Education/Word Builder/index.html',
            playable: true,
            scoreDirection: 'higher',
            description: 'Create words from given letters and expand your vocabulary!'
        },

        // ===== TOOLS =====
        {
            id: 'scorekeeper',
            name: 'Scorekeeper',
            category: 'tools',
            type: 'tool',
            route: 'Tools/Scorekeeper/Score_keeper.html',
            playable: true,
            scoreDirection: null,
            description: 'Keep track of scores for your favorite games.'
        },
        {
            id: '5-digit-counter',
            name: '5-Digit Counter',
            category: 'tools',
            type: 'tool',
            route: '5-digit-counter/index.html',
            playable: true,
            scoreDirection: null,
            description: 'A simple counter tool.'
        },
        {
            id: 'pokedex',
            name: 'Pokedex',
            category: 'tools',
            type: 'tool',
            route: 'pokedex/index.html',
            playable: true,
            scoreDirection: null,
            description: 'Browse and search for Pokemon information.'
        }
    ];

    /**
     * Get all registered games.
     *
     * @returns {Array} Copy of all game metadata objects
     */
    function getAll() {
        return games.slice();
    }

    /**
     * Get a game by its unique ID.
     *
     * @param {string} gameId
     * @returns {Object|null} Game metadata or null if not found
     */
    function getById(gameId) {
        if (!gameId || typeof gameId !== 'string') return null;
        for (var i = 0; i < games.length; i++) {
            if (games[i].id === gameId) return games[i];
        }
        return null;
    }

    /**
     * Get all games in a specific category.
     *
     * @param {string} category
     * @returns {Array}
     */
    function getByCategory(category) {
        if (!category) return [];
        return games.filter(function (g) {
            return g.category === category;
        });
    }

    /**
     * Check if a game ID is valid/registered.
     *
     * @param {string} gameId
     * @returns {boolean}
     */
    function isValid(gameId) {
        return getById(gameId) !== null;
    }

    /**
     * Get the route for a game by ID.
     *
     * @param {string} gameId
     * @returns {string|null} Route path or null if game not found
     */
    function getRoute(gameId) {
        var game = getById(gameId);
        return game ? game.route : null;
    }

    /**
     * Get the count of registered games.
     *
     * @returns {number}
     */
    function count() {
        return games.length;
    }

    return {
        getAll: getAll,
        getById: getById,
        getByCategory: getByCategory,
        isValid: isValid,
        getRoute: getRoute,
        count: count
    };
})();

if (typeof window !== 'undefined') {
    window.PixelPalaceRegistry = PixelPalaceRegistry;
}
