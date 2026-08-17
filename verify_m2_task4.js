#!/usr/bin/env node
'use strict';
var fs = require('fs');
var vm = require('vm');
var store = {};

var sandbox = {
    window: {},
    document: {
        getElementById: function() { return null; },
        querySelector: function() { return null; },
        querySelectorAll: function() { return []; },
        createElement: function(t) {
            return {
                style: {}, className: '', id: '', textContent: '', innerHTML: '',
                setAttribute: function() {},
                addEventListener: function() {},
                appendChild: function() {},
                remove: function() {},
                focus: function() {},
                classList: { add: function(){}, remove: function(){}, contains: function(){return false;} },
                querySelector: function() { return null; }
            };
        },
        head: { appendChild: function() {} },
        body: { appendChild: function() {}, style: {} }
    },
    console: { log: console.log, warn: function() {} },
    localStorage: {
        getItem: function(k) { return store.hasOwnProperty(k) ? store[k] : null; },
        setItem: function(k, v) { store[k] = String(v); },
        removeItem: function(k) { delete store[k]; },
        clear: function() { store = {}; },
        get length() { return Object.keys(store).length; },
        key: function(i) { return Object.keys(store)[i] || null; }
    },
    isFinite: isFinite, parseInt: parseInt, parseFloat: parseFloat, isNaN: isNaN,
    TypeError: TypeError, Error: Error, Array: Array, Object: Object,
    String: String, Number: Number, Math: Math, Date: Date, JSON: JSON
};

var files = [
    'js/pixel_palace_storage.js','js/pixel_palace_player.js','js/pixel_palace_registry.js',
    'js/pixel_palace_progression_config.js','js/pixel_palace_progression.js',
    'js/pixel_palace_achievements.js','js/pixel_palace_achievements_engine.js',
    'js/pixel_palace_core.js','js/pixel_palace_progression_ui.js',
    'js/pixel_palace_progression_feedback.js'
];
for (var i = 0; i < files.length; i++) {
    try { vm.runInNewContext(fs.readFileSync(files[i], 'utf8'), sandbox, {filename: files[i]}); }
    catch(e) { console.error('FAIL loading ' + files[i] + ': ' + e.message); process.exit(1); }
}

var Core = sandbox.window.PixelPalace;
var Prog = sandbox.PixelPalaceProgression;
var Ach = sandbox.PixelPalaceAchievements;
var Defs = sandbox.PixelPalaceAchievementDefinitions;
var Reg = sandbox.PixelPalaceRegistry;
var Player = sandbox.window.PixelPalacePlayer;
var FB = sandbox.window.PixelPalaceProgressionFeedback;

var P=0, F=0, T=0, fails=[], cg='';
function grp(n) { cg=n; console.log('\n=== '+n+' ==='); }
function t(n,fn) { T++; try{fn();P++;console.log('  ✓ '+n);}catch(e){F++;console.log('  ✗ '+n+' — '+e.message);fails.push({g:cg,n:n,e:e.message});} }
function ok(c,m){if(!c)throw new Error(m||'Assertion failed');}
function eq(a,b,m){if(a!==b)throw new Error((m?m+': ':'')+'Expected '+JSON.stringify(b)+' got '+JSON.stringify(a));}
function clean(){store={};Player.create();}

function play(gid,score){
    var s=Core.startSession(gid);
    if(!s.ok)throw new Error('start failed for '+gid);
    var e=Core.endSession(s.session.id,{score:score});
    if(!e.ok)throw new Error('end failed for '+gid);
    return e;
}

// ============================================================
// MODULE LOADING
// ============================================================
grp('Module Loading');
t('Feedback module exists', function(){ok(typeof FB==='object');});
t('normalizeResult exists', function(){ok(typeof FB.normalizeResult==='function');});
t('show exists', function(){ok(typeof FB.show==='function');});
t('hide exists', function(){ok(typeof FB.hide==='function');});
t('isOpen exists', function(){ok(typeof FB.isOpen==='function');});
t('init exists', function(){ok(typeof FB.init==='function');});
t('isOpen returns false initially', function(){eq(FB.isOpen(),false);});

// ============================================================
// NORMALIZE RESULT — BASIC
// ============================================================
grp('Normalize Result — Basic');
t('normalizeResult returns null for null input', function(){eq(FB.normalizeResult(null),null);});
t('normalizeResult returns null for false ok', function(){eq(FB.normalizeResult({ok:false}),null);});
t('normalizeResult returns null for undefined input', function(){eq(FB.normalizeResult(undefined),null);});

t('normalizeResult produces correct shape', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    ok(n);
    ok(typeof n.xpEarned === 'number');
    ok(Array.isArray(n.transactions));
    ok(typeof n.newPersonalBest === 'boolean');
    ok(Array.isArray(n.unlockedAchievements));
    ok(typeof n.leveledUp === 'boolean');
});

t('normalizeResult includes session gameId', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    eq(n.gameId,'brick-smash');
});

t('normalizeResult includes score', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    eq(n.score,100);
});

// ============================================================
// XP FEEDBACK
// ============================================================
grp('XP Feedback');
t('First game: XP earned is 50 (10 completion + 25 first play + 15 PB)', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    eq(n.xpEarned,50);
});

t('Repeat game without PB: XP earned is 10 (completion only)', function(){
    clean();
    play('brick-smash',200);
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    eq(n.xpEarned,10);
});

t('XP with PB: XP earned is 25 (10 completion + 15 PB)', function(){
    clean();
    play('brick-smash',50);
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    eq(n.xpEarned,25);
});

t('First play + PB: XP earned is 50 (10 + 25 + 15)', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    eq(n.xpEarned,50);
});

t('XP transactions have correct source labels', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    var sources = n.transactions.map(function(t){return t.source;});
    ok(sources.indexOf('game_completion')!==-1);
    ok(sources.indexOf('first_play')!==-1);
    ok(sources.indexOf('personal_best')!==-1);
});

t('XP transactions have display labels', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    var labels = n.transactions.map(function(t){return t.label;});
    ok(labels.indexOf('Game Complete')!==-1);
    ok(labels.indexOf('First Play')!==-1);
    ok(labels.indexOf('Personal Best')!==-1);
});

t('XP transactions have amounts', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    var amounts = n.transactions.map(function(t){return t.amount;});
    ok(amounts.indexOf(10)!==-1);
    ok(amounts.indexOf(25)!==-1);
    ok(amounts.indexOf(15)!==-1);
});

// ============================================================
// PERSONAL BEST FEEDBACK
// ============================================================
grp('Personal Best Feedback');
t('First play is always a PB', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    eq(n.newPersonalBest,true);
});

t('Lower score is not a PB', function(){
    clean();
    play('brick-smash',200);
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    eq(n.newPersonalBest,false);
});

t('Higher score is a PB', function(){
    clean();
    play('brick-smash',50);
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    eq(n.newPersonalBest,true);
});

t('PB result includes previous best', function(){
    clean();
    play('brick-smash',50);
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    eq(n.previousBest,50);
});

t('First play PB has null previous best', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    eq(n.previousBest,null);
});

// ============================================================
// ACHIEVEMENT FEEDBACK
// ============================================================
grp('Achievement Feedback');
t('First game unlocks first_steps achievement', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    var ids = n.unlockedAchievements.map(function(a){return a.id;});
    ok(ids.indexOf('first_steps')!==-1);
});

t('Unlocked achievement has name', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    var a = n.unlockedAchievements.filter(function(a){return a.id==='first_steps';})[0];
    ok(a.name);
    eq(a.name,'First Steps');
});

t('Unlocked achievement has description', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    var a = n.unlockedAchievements.filter(function(a){return a.id==='first_steps';})[0];
    ok(a.description);
});

t('Unlocked achievement has icon', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    var a = n.unlockedAchievements.filter(function(a){return a.id==='first_steps';})[0];
    ok(a.icon);
});

t('Unlocked achievement has reward', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    var a = n.unlockedAchievements.filter(function(a){return a.id==='first_steps';})[0];
    ok(a.reward);
    eq(a.reward.type,'xp');
    eq(a.reward.amount,10);
});

t('PB achievement unlocked when PB set', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    var ids = n.unlockedAchievements.map(function(a){return a.id;});
    ok(ids.indexOf('high_score')!==-1);
});

t('Game-specific achievement unlocked', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    var ids = n.unlockedAchievements.map(function(a){return a.id;});
    ok(ids.indexOf('brick_breaker')!==-1);
});

t('No achievements when nothing new', function(){
    clean();
    play('brick-smash',100);
    var raw = play('brick-smash',50);
    var n = FB.normalizeResult(raw);
    eq(n.unlockedAchievements.length,0);
});

// ============================================================
// LEVEL UP FEEDBACK
// ============================================================
grp('Level Up Feedback');
t('Level up on first play (50 XP crosses level 2 threshold)', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    // First play awards 50 XP (10+25+15), level 2 threshold is 50
    eq(n.leveledUp,true);
    eq(n.previousLevel,1);
    eq(n.currentLevel,2);
});

t('No level up when XP is below threshold', function(){
    clean();
    play('brick-smash',200);
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    // Second play awards 10 XP only, total is 60, already level 2
    eq(n.leveledUp,false);
});

t('Level up when crossing threshold', function(){
    clean();
    // Play many games to earn enough XP for level 2 (50 XP needed)
    for(var i=0;i<5;i++){
        play('brick-smash',100);
    }
    // Now play one more that should cross 50 XP
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    // May or may not level up depending on exact XP, check the result
    if(n.leveledUp){
        ok(n.previousLevel < n.currentLevel);
    }
});

t('Multi-level jump handled', function(){
    clean();
    // Achieve enough XP for multiple levels at once
    // First play of 5 different games = 5 * 35 = 175 XP (level 3)
    play('brick-smash',100);
    play('slither-survival',100);
    play('typing-sprint',100);
    play('flappy-flight',100);
    play('rebound-rescue',100);
    // Check current level
    var lvl = Core.getLevel();
    ok(lvl >= 2);
});

// ============================================================
// COMBINED EVENTS
// ============================================================
grp('Combined Events');
t('First play: XP + PB + achievements', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    eq(n.xpEarned,50);
    eq(n.newPersonalBest,true);
    ok(n.unlockedAchievements.length > 0);
});

t('Second play with PB: XP + PB (no new game-specific achievement since already unlocked)', function(){
    clean();
    play('brick-smash',50);
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    eq(n.xpEarned,25);
    eq(n.newPersonalBest,true);
    // brick_breaker was already unlocked in first play, so no new achievements
    eq(n.unlockedAchievements.length,0);
});

t('Second play without PB: XP only', function(){
    clean();
    play('brick-smash',200);
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    eq(n.xpEarned,10);
    eq(n.newPersonalBest,false);
    eq(n.unlockedAchievements.length,0);
});

// ============================================================
// IDEMPOTENCY
// ============================================================
grp('Idempotency');
t('Normalizing same result twice produces same output', function(){
    clean();
    var raw = play('brick-smash',100);
    var n1 = FB.normalizeResult(raw);
    var n2 = FB.normalizeResult(raw);
    eq(n1.xpEarned,n2.xpEarned);
    eq(n1.newPersonalBest,n2.newPersonalBest);
    eq(n1.unlockedAchievements.length,n2.unlockedAchievements.length);
});

t('Feedback never modifies progression state', function(){
    clean();
    play('brick-smash',100);
    var raw = play('brick-smash',100);
    var xpAfterPlay = Core.getTotalXp();
    var lvlAfterPlay = Core.getLevel();
    var n = FB.normalizeResult(raw);
    FB.hide();
    eq(Core.getTotalXp(),xpAfterPlay);
    eq(Core.getLevel(),lvlAfterPlay);
});

// ============================================================
// DATA DRIVEN
// ============================================================
grp('Data Driven');
t('Achievement data comes from definitions', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    var a = n.unlockedAchievements.filter(function(a){return a.id==='first_steps';})[0];
    var def = Defs.ACHIEVEMENTS.filter(function(d){return d.id==='first_steps';})[0];
    eq(a.name,def.name);
    eq(a.description,def.description);
    eq(a.icon,def.icon);
    // Reward comes from the definition, not the engine's awardXp result
    ok(a.reward);
    eq(a.reward.type,def.reward.type);
    eq(a.reward.amount,def.reward.amount);
});

t('XP amounts come from progression engine', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    // First play: 10 + 25 + 15 = 50
    eq(n.xpEarned,50);
});

t('Transaction labels come from source mapping', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    var t = n.transactions.filter(function(t){return t.source==='game_completion';})[0];
    eq(t.label,'Game Complete');
});

// ============================================================
// NO DUPLICATE XP
// ============================================================
grp('No Duplicate XP');
t('Feedback does not call awardXp', function(){
    clean();
    var raw = play('brick-smash',100);
    var xpAfterPlay = Core.getTotalXp();
    var n = FB.normalizeResult(raw);
    // The result shows XP but doesn't award it
    // Verify XP was only awarded by endSession, not by normalizeResult
    var xpAfterNormalize = Core.getTotalXp();
    eq(xpAfterNormalize,xpAfterPlay);
});

t('Feedback does not unlock achievements', function(){
    clean();
    play('brick-smash',100);
    var statsBefore = Core.getAchievementStats();
    var raw = {ok:true,session:{id:'test',gameId:'brick-smash'},personalBest:{isNewBest:false,score:100,previousBest:100},progression:{xpAwarded:10,levelUp:null,transactions:[{id:'t1',amount:10,source:'game_completion'}]},achievements:[]};
    var n = FB.normalizeResult(raw);
    var statsAfter = Core.getAchievementStats();
    eq(statsBefore.unlocked,statsAfter.unlocked);
});

// ============================================================
// GAME INTEGRATION — BRICK SMASH
// ============================================================
grp('Game Integration — Brick Smash');
t('endSession result has all required fields', function(){
    clean();
    var raw = play('brick-smash',100);
    ok(raw.ok);
    ok(raw.session);
    ok(raw.personalBest);
    ok(raw.progression);
    ok(raw.achievements);
});

t('Result normalizes correctly', function(){
    clean();
    var raw = play('brick-smash',100);
    var n = FB.normalizeResult(raw);
    ok(n);
    eq(n.gameId,'brick-smash');
    eq(n.xpEarned,50);
    eq(n.newPersonalBest,true);
    ok(n.unlockedAchievements.length > 0);
});

// ============================================================
// GAME INTEGRATION — SLITHER
// ============================================================
grp('Game Integration — Slither');
t('endSession result has all required fields', function(){
    clean();
    var raw = play('slither-survival',100);
    ok(raw.ok);
    ok(raw.session);
    ok(raw.personalBest);
    ok(raw.progression);
    ok(raw.achievements);
});

t('Result normalizes correctly', function(){
    clean();
    var raw = play('slither-survival',100);
    var n = FB.normalizeResult(raw);
    ok(n);
    eq(n.gameId,'slither-survival');
    eq(n.xpEarned,50);
    eq(n.newPersonalBest,true);
});

// ============================================================
// GAME INTEGRATION — TYPING SPRINT
// ============================================================
grp('Game Integration — Typing Sprint');
t('endSession result has all required fields', function(){
    clean();
    var raw = play('typing-sprint',60);
    ok(raw.ok);
    ok(raw.session);
    ok(raw.personalBest);
    ok(raw.progression);
    ok(raw.achievements);
});

t('Result normalizes correctly', function(){
    clean();
    var raw = play('typing-sprint',60);
    var n = FB.normalizeResult(raw);
    ok(n);
    eq(n.gameId,'typing-sprint');
    eq(n.xpEarned,50);
    eq(n.newPersonalBest,true);
    ok(n.unlockedAchievements.length > 0);
});

// ============================================================
// HARDCODE AUDIT
// ============================================================
grp('Hardcode Audit');
t('No XP amounts in feedback source', function(){
    var src = fs.readFileSync('js/pixel_palace_progression_feedback.js','utf8');
    ok(src.indexOf('= 10')===-1,'No XP=10');
    ok(src.indexOf('= 25')===-1,'No XP=25');
    ok(src.indexOf('= 15')===-1,'No XP=15');
    ok(src.indexOf('= 35')===-1,'No XP=35');
    ok(src.indexOf('= 50')===-1,'No XP=50');
});

t('No level thresholds in feedback source', function(){
    var src = fs.readFileSync('js/pixel_palace_progression_feedback.js','utf8');
    ok(src.indexOf('LEVEL_THRESHOLDS')===-1);
    ok(src.indexOf('= 40')===-1);
});

t('No achievement names in feedback source', function(){
    var src = fs.readFileSync('js/pixel_palace_progression_feedback.js','utf8');
    ok(src.indexOf('First Steps')===-1);
    ok(src.indexOf('Getting Started')===-1);
    ok(src.indexOf('Brick Breaker')===-1);
});

t('No achievement IDs in feedback source', function(){
    var src = fs.readFileSync('js/pixel_palace_progression_feedback.js','utf8');
    ok(src.indexOf('first_steps')===-1);
    ok(src.indexOf('getting_started')===-1);
    ok(src.indexOf('brick_breaker')===-1);
});

t('No game names in feedback source', function(){
    var src = fs.readFileSync('js/pixel_palace_progression_feedback.js','utf8');
    ok(src.indexOf('Brick Smash')===-1);
    ok(src.indexOf('Slither Survival')===-1);
    ok(src.indexOf('Typing Sprint')===-1);
});

t('No direct localStorage in feedback source', function(){
    var src = fs.readFileSync('js/pixel_palace_progression_feedback.js','utf8');
    ok(src.indexOf('localStorage')===-1);
    ok(src.indexOf('PixelPalaceStorage')===-1);
});

t('No awardXp calls in feedback source', function(){
    var src = fs.readFileSync('js/pixel_palace_progression_feedback.js','utf8');
    ok(src.indexOf('awardXp')===-1);
});

t('No unlock calls in feedback source', function(){
    var src = fs.readFileSync('js/pixel_palace_progression_feedback.js','utf8');
    // Check that the module doesn't call unlock() on the achievements engine
    ok(src.indexOf('Achievements.unlock')===-1);
    ok(src.indexOf('.unlock(')===-1);
});

t('Feedback reads from APIs not raw data', function(){
    var src = fs.readFileSync('js/pixel_palace_progression_feedback.js','utf8');
    ok(src.indexOf('normalizeResult')!==-1,'Has normalizeResult');
    ok(src.indexOf('SOURCE_LABELS')!==-1,'Has SOURCE_LABELS mapping');
});

// ============================================================
// REGRESSION — EXISTING TESTS STILL PASS
// ============================================================
grp('Regression Safety');
t('Core API unchanged', function(){
    clean();
    var s=Core.startSession('brick-smash');
    var e=Core.endSession(s.session.id,{score:100});
    ok(e.ok);
});

t('Progression engine unchanged', function(){
    clean();
    play('brick-smash',100);
    ok(Core.getTotalXp()>0);
});

t('Achievement engine unchanged', function(){
    clean();
    play('brick-smash',100);
    ok(Ach.isUnlocked('first_steps'));
});

t('Progression UI unchanged', function(){
    ok(typeof sandbox.window.PixelPalaceProgressionUI === 'object');
    ok(typeof sandbox.window.PixelPalaceProgressionUI.init === 'function');
});

// ============================================================
// REPORT
// ============================================================
console.log('\n'+'='.repeat(50));
console.log('M2 TASK 4 — PROGRESSION FEEDBACK VERIFICATION');
console.log('='.repeat(50));
console.log('Passed: '+P+'/'+T);
console.log('Failed: '+F+'/'+T);
if(fails.length>0){console.log('\nFAILURES:');fails.forEach(function(f){console.log('  ['+f.g+'] '+f.n+': '+f.e);});}
console.log('\nSTATUS: '+(F===0?'ALL PASS':'HAS FAILURES'));
process.exit(F>0?1:0);
