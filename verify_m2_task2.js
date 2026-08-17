#!/usr/bin/env node
'use strict';
var fs = require('fs');
var vm = require('vm');
var store = {};
var sandbox = {
    window: {},
    console: { log: console.log, warn: function() {} },
    localStorage: {
        getItem: function(k) { return store.hasOwnProperty(k) ? store[k] : null; },
        setItem: function(k, v) { store[k] = String(v); },
        removeItem: function(k) { delete store[k]; },
        clear: function() { store = {}; },
        get length() { return Object.keys(store).length; },
        key: function(i) { return Object.keys(store)[i] || null; }
    },
    Math: Math, Date: Date, JSON: JSON, isFinite: isFinite,
    Array: Array, Object: Object, String: String, Number: Number,
    TypeError: TypeError, Error: Error, parseInt: parseInt, parseFloat: parseFloat, isNaN: isNaN
};
var files = [
    'js/pixel_palace_storage.js','js/pixel_palace_player.js','js/pixel_palace_registry.js',
    'js/pixel_palace_progression_config.js','js/pixel_palace_progression.js',
    'js/pixel_palace_achievements.js','js/pixel_palace_achievements_engine.js',
    'js/pixel_palace_core.js'
];
for (var i = 0; i < files.length; i++) {
    try { vm.runInNewContext(fs.readFileSync(files[i], 'utf8'), sandbox, {filename: files[i]}); }
    catch(e) { console.error('FAIL loading ' + files[i] + ': ' + e.message); process.exit(1); }
}
var Defs = sandbox.PixelPalaceAchievementDefinitions;
var Ach = sandbox.PixelPalaceAchievements;
var Core = sandbox.PixelPalace;
var Prog = sandbox.PixelPalaceProgression;
var Reg = sandbox.PixelPalaceRegistry;
var Storage = sandbox.PixelPalaceStorage;
var Player = sandbox.PixelPalacePlayer;

var P = 0, F = 0, T = 0, fails = [], cg = '';
function grp(n) { cg = n; console.log('\n=== ' + n + ' ==='); }
function t(n, fn) { T++; try { fn(); P++; console.log('  ✓ ' + n); } catch(e) { F++; console.log('  ✗ ' + n + ' — ' + e.message); fails.push({g:cg,n:n,e:e.message}); } }
function ok(c, m) { if (!c) throw new Error(m || 'Assertion failed'); }
function eq(a, b, m) { if (a !== b) throw new Error((m?m+': ':'') + 'Expected ' + JSON.stringify(b) + ' got ' + JSON.stringify(a)); }
function clean() { store = {}; Player.create(); }
function complete(gameId, score) {
    var s = Core.startSession(gameId); if (!s.ok) throw new Error('startSession failed');
    var e = Core.endSession(s.session.id, { score: score }); if (!e.ok) throw new Error('endSession failed');
    return e;
}

// REGISTRY
grp('Registry');
t('All achievement IDs unique', function() {
    var ids = {};
    var defs = Defs.ACHIEVEMENTS;
    for (var i = 0; i < defs.length; i++) { ok(!ids[defs[i].id], 'Dup: '+defs[i].id); ids[defs[i].id]=true; }
});
t('All required fields present', function() {
    var defs = Defs.ACHIEVEMENTS;
    for (var i = 0; i < defs.length; i++) {
        var d = defs[i];
        ok(typeof d.id==='string'&&d.id.length>0, d.id+': missing id');
        ok(typeof d.name==='string'&&d.name.length>0, d.id+': missing name');
        ok(typeof d.description==='string', d.id+': missing desc');
        ok(typeof d.category==='string', d.id+': missing category');
        ok(Array.isArray(d.conditions)&&d.conditions.length>0, d.id+': missing conditions');
    }
});
t('Referenced game IDs exist in registry', function() {
    var defs = Defs.ACHIEVEMENTS;
    for (var i = 0; i < defs.length; i++) {
        var conds = defs[i].conditions;
        for (var j = 0; j < conds.length; j++) {
            if (conds[j].gameId) ok(Reg.isValid(conds[j].gameId), defs[i].id+': bad gameId '+conds[j].gameId);
        }
    }
});
t('Condition schemas valid', function() {
    var defs = Defs.ACHIEVEMENTS;
    var types = Object.keys(Defs.CONDITION_TYPES).map(function(k) { return Defs.CONDITION_TYPES[k]; });
    for (var i = 0; i < defs.length; i++) {
        var conds = defs[i].conditions;
        for (var j = 0; j < conds.length; j++) {
            ok(types.indexOf(conds[j].type)!==-1, defs[i].id+': invalid type '+conds[j].type);
        }
    }
});
t('CATEGORIES has required keys', function() {
    var c = Defs.CATEGORIES;
    ok(c.MILESTONE); ok(c.SCORE); ok(c.EXPLORATION); ok(c.PROGRESSION); ok(c.GAME_SPECIFIC);
});

// EVALUATION
grp('Evaluation');
t('First game unlocks First Steps', function() {
    clean(); complete('brick-smash', 100); ok(Ach.isUnlocked('first_steps'));
});
t('10 games unlock Getting Started', function() {
    clean();
    var gs = ['brick-smash','flappy-flight','rebound-rescue','bug-collector',
        'slither-survival','scripted-adventures','pixel-blaster','rabbit-race',
        'puzzle-2048','mind-vault'];
    for (var i = 0; i < gs.length; i++) complete(gs[i], 10);
    ok(Ach.isUnlocked('getting_started'));
});
t('First PB unlocks High Score', function() {
    clean(); complete('brick-smash', 50); ok(Ach.isUnlocked('high_score'));
});
t('5 PBs unlock Unstoppable', function() {
    clean();
    var gs = ['brick-smash','flappy-flight','rebound-rescue','bug-collector','slither-survival'];
    for (var i = 0; i < gs.length; i++) complete(gs[i], 100);
    ok(Ach.isUnlocked('unstoppable'));
});
t('3 categories unlock Explorer', function() {
    clean();
    complete('brick-smash', 10); complete('puzzle-2048', 10); complete('blackjack-royale', 10);
    ok(Ach.isUnlocked('arcade_explorer'));
});
t('All categories unlock Polyplayer', function() {
    clean();
    complete('brick-smash', 10); complete('puzzle-2048', 10); complete('blackjack-royale', 10);
    complete('typing-sprint', 10); complete('sketchcraft', 10); complete('hangman', 10);
    complete('scorekeeper', 10);
    ok(Ach.isUnlocked('polyplayer'));
});
t('Level 5 unlocks Rising Star', function() {
    clean();
    var gs = ['brick-smash','flappy-flight','rebound-rescue','bug-collector',
        'slither-survival','scripted-adventures','pixel-blaster'];
    for (var i = 0; i < gs.length; i++) complete(gs[i], 10);
    ok(Ach.isUnlocked('level_5'));
});
t('Brick Smash PB unlocks Brick Breaker', function() {
    clean(); complete('brick-smash', 100); ok(Ach.isUnlocked('brick_breaker'));
});
t('Slither PB unlocks Slither Master', function() {
    clean(); complete('slither-survival', 100); ok(Ach.isUnlocked('slither_master'));
});
t('Typing Sprint PB unlocks Speed Demon', function() {
    clean(); complete('typing-sprint', 100); ok(Ach.isUnlocked('speed_demon'));
});

// PROGRESS
grp('Progress');
t('Locked achievement progress', function() {
    clean(); complete('brick-smash', 10);
    var pg = Ach.getProgress();
    var gs = null;
    for (var i = 0; i < pg.length; i++) { if (pg[i].id==='getting_started') gs=pg[i]; }
    ok(gs); ok(!gs.unlocked);
    eq(gs.progress.current, 1); eq(gs.progress.target, 10); eq(gs.progress.percentage, 10);
});
t('Unlocked achievement progress', function() {
    clean(); complete('brick-smash', 100);
    var pg = Ach.getProgress();
    var fs = null;
    for (var i = 0; i < pg.length; i++) { if (pg[i].id==='first_steps') fs=pg[i]; }
    ok(fs); ok(fs.unlocked); eq(fs.progress.percentage, 100);
});
t('getStats', function() {
    clean();
    var totalAch = Defs.ACHIEVEMENTS.length;
    var s = Ach.getStats(); eq(s.total, totalAch); eq(s.unlocked, 0); eq(s.locked, totalAch); eq(s.percentage, 0);
    complete('brick-smash', 100);
    s = Ach.getStats(); ok(s.unlocked >= 3); ok(s.percentage > 0);
});

// IDEMPOTENCY
grp('Idempotency');
t('Same event unlocks once', function() {
    clean();
    complete('brick-smash', 10);
    // endSession already called evaluate — first_steps should be unlocked
    ok(Ach.isUnlocked('first_steps'), 'first_steps unlocked by endSession');
    // Manual evaluate again should return nothing new
    var r = Ach.evaluate('game_completed');
    for (var i = 0; i < r.length; i++) { ok(r[i].id!=='first_steps', 'No dup'); }
});

// PERSISTENCE
grp('Persistence');
t('Unlock survives reload', function() {
    clean(); complete('brick-smash', 100);
    ok(Ach.isUnlocked('first_steps'));
    var state = Storage.get('achievements');
    ok(state); ok(state.first_steps); ok(state.first_steps.unlockedAt);
});
t('Malformed state recovers', function() {
    clean(); Storage.set('achievements', '{bad');
    ok(!Ach.isUnlocked('first_steps'));
    complete('brick-smash', 100);
    ok(Ach.isUnlocked('first_steps'));
});
t('Unknown IDs do not crash', function() {
    ok(!Ach.isUnlocked('nonexistent'));
    eq(Ach.getAchievement('nonexistent'), null);
});

// REWARDS
grp('Rewards');
t('Achievement awards XP through Progression', function() {
    clean(); complete('brick-smash', 100);
    var xp = Prog.getTotalXp();
    // Session: 50, achievement first_steps: 10, high_score: 15, brick_breaker: 15
    eq(xp, 90, 'Session + achievement XP');
});

// METRICS
grp('Metrics');
t('Metrics from existing modules', function() {
    clean(); complete('brick-smash', 100);
    var m = Ach._collectMetrics();
    eq(m.gamesCompleted, 1); eq(m.uniqueGamesPlayed, 1);
    eq(m.categoriesPlayed, 1); ok(m.totalCategories >= 7);
    eq(m.personalBestCount, 1); ok(m.level >= 1);
});

// CONDITION EVALUATOR
grp('Condition Evaluator');
t('COUNT', function() {
    ok(Ach._evaluateCondition({type:'count',metric:'gamesCompleted',operator:'>=',value:5},{gamesCompleted:5}));
    ok(!Ach._evaluateCondition({type:'count',metric:'gamesCompleted',operator:'>=',value:6},{gamesCompleted:5}));
});
t('UNIQUE_COUNT', function() {
    ok(Ach._evaluateCondition({type:'unique_count',metric:'categoriesPlayed',operator:'>=',value:3},{categoriesPlayed:3,totalCategories:7}));
});
t('UNIQUE_COUNT -1', function() {
    ok(Ach._evaluateCondition({type:'unique_count',metric:'categoriesPlayed',operator:'>=',value:-1},{categoriesPlayed:7,totalCategories:7}));
});
t('THRESHOLD', function() {
    ok(Ach._evaluateCondition({type:'threshold',metric:'level',operator:'>=',value:5},{level:5}));
    ok(!Ach._evaluateCondition({type:'threshold',metric:'level',operator:'>=',value:6},{level:5}));
});
t('PERSONAL_BEST specific', function() {
    ok(Ach._evaluateCondition({type:'personal_best',gameId:'brick-smash'},{gameIdsWithPB:['brick-smash']}));
    ok(!Ach._evaluateCondition({type:'personal_best',gameId:'slither-survival'},{gameIdsWithPB:['brick-smash']}));
});
t('PERSONAL_BEST any', function() {
    ok(Ach._evaluateCondition({type:'personal_best',gameId:null},{gameIdsWithPB:['brick-smash'],personalBestCount:1}));
    ok(!Ach._evaluateCondition({type:'personal_best',gameId:null},{gameIdsWithPB:[],personalBestCount:0}));
});
t('PERSONAL_BEST_COUNT', function() {
    ok(Ach._evaluateCondition({type:'personal_best_count',operator:'>=',value:3},{personalBestCount:3}));
});
t('Unknown type returns false', function() {
    ok(!Ach._evaluateCondition({type:'unknown'},{}));
});

// EVENT INTEGRATION
grp('Event Integration');
t('endSession returns achievements array', function() {
    clean();
    var s = Core.startSession('brick-smash');
    var e = Core.endSession(s.session.id, {score: 100});
    ok(e.ok); ok(Array.isArray(e.achievements));
});

// CORRUPTION
grp('Corruption');
t('All corruption scenarios recover', function() {
    clean(); Storage.set('achievements', 'corrupted');
    ok(!Ach.isUnlocked('first_steps'));
    ok(Array.isArray(Ach.getLocked()));
    ok(Array.isArray(Ach.getUnlocked()));
    complete('brick-smash', 100);
    ok(Ach.isUnlocked('first_steps'));
});

// PUBLIC API
grp('Public API');
t('PixelPalace exposes achievement methods', function() {
    ok(typeof Core.getAchievements==='function');
    ok(typeof Core.getAchievementStats==='function');
    ok(typeof Core.isAchievementUnlocked==='function');
});
t('getAll returns all definitions', function() { eq(Ach.getAll().length, Defs.ACHIEVEMENTS.length); });
t('getAchievement returns single definition', function() {
    var a = Ach.getAchievement('first_steps'); ok(a); eq(a.id, 'first_steps');
});
t('getUnlocked returns array', function() { clean(); ok(Array.isArray(Ach.getUnlocked())); });
t('getLocked returns array', function() { clean(); eq(Ach.getLocked().length, Defs.ACHIEVEMENTS.length); });

// REPORT
console.log('\n' + '='.repeat(50));
console.log('M2 TASK 2 VERIFICATION');
console.log('='.repeat(50));
console.log('Passed: ' + P + '/' + T);
console.log('Failed: ' + F + '/' + T);
if (fails.length > 0) {
    console.log('\nFAILURES:');
    for (var i = 0; i < fails.length; i++) console.log('  ['+fails[i].g+'] '+fails[i].n+': '+fails[i].e);
}
console.log('\nSTATUS: ' + (F === 0 ? 'ALL PASS' : 'HAS FAILURES'));
process.exit(F > 0 ? 1 : 0);
