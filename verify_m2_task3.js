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
        createElement: function() { return { style:{}, className:'', setAttribute:function(){}, addEventListener:function(){}, appendChild:function(){}, innerHTML:'' }; },
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
    Math: Math, Date: Date, JSON: JSON, isFinite: isFinite,
    Array: Array, Object: Object, String: String, Number: Number,
    TypeError: TypeError, Error: Error, parseInt: parseInt, parseFloat: parseFloat, isNaN: isNaN
};
var files = [
    'js/pixel_palace_storage.js','js/pixel_palace_player.js','js/pixel_palace_registry.js',
    'js/pixel_palace_progression_config.js','js/pixel_palace_progression.js',
    'js/pixel_palace_achievements.js','js/pixel_palace_achievements_engine.js',
    'js/pixel_palace_core.js','js/pixel_palace_progression_ui.js'
];
for (var i = 0; i < files.length; i++) {
    try { vm.runInNewContext(fs.readFileSync(files[i], 'utf8'), sandbox, {filename: files[i]}); }
    catch(e) { console.error('FAIL loading ' + files[i] + ': ' + e.message); process.exit(1); }
}
var Core = sandbox.PixelPalace;
var Prog = sandbox.PixelPalaceProgression;
var Ach = sandbox.PixelPalaceAchievements;
var Defs = sandbox.PixelPalaceAchievementDefinitions;
var Reg = sandbox.PixelPalaceRegistry;
var Player = sandbox.PixelPalacePlayer;
var UI = sandbox.PixelPalaceProgressionUI;

var P=0, F=0, T=0, fails=[], cg='';
function grp(n) { cg=n; console.log('\n=== '+n+' ==='); }
function t(n,fn) { T++; try{fn();P++;console.log('  ✓ '+n);}catch(e){F++;console.log('  ✗ '+n+' — '+e.message);fails.push({g:cg,n:n,e:e.message});} }
function ok(c,m){if(!c)throw new Error(m||'Assertion failed');}
function eq(a,b,m){if(a!==b)throw new Error((m?m+': ':'')+'Expected '+JSON.stringify(b)+' got '+JSON.stringify(a));}
function clean(){store={};Player.create();}
function play(gid,score){var s=Core.startSession(gid);if(!s.ok)throw new Error('start failed');var e=Core.endSession(s.session.id,{score:score});if(!e.ok)throw new Error('end failed');return e;}

// MODULE LOADS
grp('Module Loading');
t('PixelPalaceProgressionUI exists', function(){ok(typeof UI==='object');});
t('UI has init method',function(){ok(typeof UI.init==='function');});
t('UI has open method',function(){ok(typeof UI.open==='function');});
t('UI has close method',function(){ok(typeof UI.close==='function');});
t('UI has isOpen method',function(){ok(typeof UI.isOpen==='function');});
t('isOpen returns false initially',function(){eq(UI.isOpen(),false);});

// DATA FLOW — UI DOES NOT TOUCH localStorage DIRECTLY
grp('Data Flow Compliance');
t('UI module source has no direct localStorage access',function(){
    var src=fs.readFileSync('js/pixel_palace_progression_ui.js','utf8');
    ok(src.indexOf('localStorage')===-1,'UI should not reference localStorage');
});
t('UI module source has no Storage.get/set calls',function(){
    var src=fs.readFileSync('js/pixel_palace_progression_ui.js','utf8');
    ok(src.indexOf('Storage.get')===-1,'UI should not call Storage.get');
    ok(src.indexOf('Storage.set')===-1,'UI should not call Storage.set');
});
t('UI module source has no PixelPalaceStorage references',function(){
    var src=fs.readFileSync('js/pixel_palace_progression_ui.js','utf8');
    ok(src.indexOf('PixelPalaceStorage')===-1,'UI should not reference PixelPalaceStorage directly');
});

// HARDCODE AUDIT — NO PRODUCT DATA IN UI
grp('Hardcode Audit');
t('No XP values hardcoded',function(){
    var src=fs.readFileSync('js/pixel_palace_progression_ui.js','utf8');
    ok(src.indexOf('XP_PER_COMPLETION')===-1);
    ok(src.indexOf('XP_FIRST_PLAY')===-1);
    ok(src.indexOf('XP_PERSONAL_BEST')===-1);
});
t('No level thresholds hardcoded',function(){
    var src=fs.readFileSync('js/pixel_palace_progression_ui.js','utf8');
    ok(src.indexOf('LEVEL_THRESHOLDS')===-1);
    ok(src.indexOf('= 40')===-1);
    ok(src.indexOf('== 40')===-1);
});
t('No achievement names hardcoded',function(){
    var src=fs.readFileSync('js/pixel_palace_progression_ui.js','utf8');
    ok(src.indexOf('First Steps')===-1);
    ok(src.indexOf('Getting Started')===-1);
    ok(src.indexOf('High Score')===-1);
    ok(src.indexOf('Brick Breaker')===-1);
});
t('No achievement IDs hardcoded',function(){
    var src=fs.readFileSync('js/pixel_palace_progression_ui.js','utf8');
    ok(src.indexOf('first_steps')===-1);
    ok(src.indexOf('getting_started')===-1);
    ok(src.indexOf('brick_breaker')===-1);
});
t('No game names hardcoded',function(){
    var src=fs.readFileSync('js/pixel_palace_progression_ui.js','utf8');
    ok(src.indexOf('Brick Smash')===-1);
    ok(src.indexOf('Slither Survival')===-1);
    ok(src.indexOf('Typing Sprint')===-1);
});
t('No category lists hardcoded',function(){
    var src=fs.readFileSync('js/pixel_palace_progression_ui.js','utf8');
    ok(src.indexOf("'milestone'")===-1);
    ok(src.indexOf("'score'")===-1);
    ok(src.indexOf("'exploration'")===-1);
});
t('No total game count hardcoded',function(){
    var src=fs.readFileSync('js/pixel_palace_progression_ui.js','utf8');
    ok(src.indexOf('= 44')===-1);
    ok(src.indexOf('== 44')===-1);
});
t('No achievement count hardcoded',function(){
    var src=fs.readFileSync('js/pixel_palace_progression_ui.js','utf8');
    ok(src.indexOf('= 11')===-1);
    ok(src.indexOf('== 11')===-1);
});
t('No progress formulas hardcoded',function(){
    var src=fs.readFileSync('js/pixel_palace_progression_ui.js','utf8');
    ok(src.indexOf('totalXp *')===-1);
    ok(src.indexOf('xp /')===-1);
});
t('UI reads from APIs not raw data',function(){
    var src=fs.readFileSync('js/pixel_palace_progression_ui.js','utf8');
    ok(src.indexOf('Core.getProgress')!==-1,'Uses Core.getProgress');
    ok(src.indexOf('Core.getAchievements')!==-1,'Uses Core.getAchievements');
    ok(src.indexOf('Core.getXpHistory')!==-1,'Uses Core.getXpHistory');
    ok(src.indexOf('Core.getPlayer')!==-1,'Uses Core.getPlayer');
});

// PLAYER IDENTITY
grp('Player Identity');
t('Player identity accessible',function(){
    clean();
    var p=Core.getPlayer();
    ok(p);ok(p.id);
    eq(Core.getPlayerName(),'Player');
});
t('Nickname set and retrieved',function(){
    clean();
    Player.setNickname('TestUser');
    eq(Core.getPlayerName(),'TestUser');
});
t('UUID not prominently exposed',function(){
    clean();
    var src=fs.readFileSync('js/pixel_palace_progression_ui.js','utf8');
    ok(src.indexOf('player.id')===-1,'Should not display player.id');
    ok(src.indexOf('.id+')===-1,'Should not concatenate player.id');
});

// XP HISTORY
grp('XP History');
t('XpHistory returns array',function(){
    clean();
    var h=Core.getXpHistory();
    ok(Array.isArray(h));
});
t('XpHistory after game has entries',function(){
    clean();
    play('brick-smash',100);
    var h=Core.getXpHistory();
    ok(h.length>0);
    ok(h[0].amount>0);
    ok(h[0].source);
});
t('Game names resolve through Registry',function(){
    clean();
    play('brick-smash',100);
    var g=Reg.getById('brick-smash');
    ok(g);eq(g.name,'Brick Smash Chronicles');
});

// ACHIEVEMENTS DATA
grp('Achievement Data');
t('Achievement stats dynamic',function(){
    clean();
    var s=Core.getAchievementStats();
    ok(s.total>0);eq(s.unlocked,0);
});
t('Achievement progress array dynamic',function(){
    clean();
    var p=Core.getAchievements();
    ok(Array.isArray(p));ok(p.length>0);
    ok(p[0].id);ok(p[0].name);ok(p[0].progress);
});
t('Achievement categories from definitions',function(){
    var cats=Defs.CATEGORIES;
    ok(cats.MILESTONE);ok(cats.SCORE);ok(cats.EXPLORATION);
    ok(cats.PROGRESSION);ok(cats.GAME_SPECIFIC);
});

// PROGRESSION DATA
grp('Progression Data');
t('Level from API',function(){
    clean();
    eq(Core.getLevel(),1);
});
t('TotalXp from API',function(){
    clean();
    eq(Core.getTotalXp(),0);
});
t('LevelProgress from API',function(){
    clean();
    var p=Core.getLevelProgress();
    ok(typeof p==='number');ok(p>=0);ok(p<=1);
});
t('XpToNextLevel from API',function(){
    clean();
    var x=Core.getXpToNextLevel();
    ok(typeof x==='number');ok(x>0);
});

// REGRESSION SAFETY
grp('Regression Safety');
t('Core API unchanged',function(){
    clean();
    var s=Core.startSession('brick-smash');
    var e=Core.endSession(s.session.id,{score:100});
    ok(e.ok);
});
t('Progression engine unchanged',function(){
    clean();
    play('brick-smash',100);
    ok(Core.getTotalXp()>0);
});
t('Achievement engine unchanged',function(){
    clean();
    play('brick-smash',100);
    ok(Ach.isUnlocked('first_steps'));
});

// REPORT
console.log('\n'+'='.repeat(50));
console.log('M2 TASK 3 — PROGRESSION UI VERIFICATION');
console.log('='.repeat(50));
console.log('Passed: '+P+'/'+T);
console.log('Failed: '+F+'/'+T);
if(fails.length>0){console.log('\nFAILURES:');fails.forEach(function(f){console.log('  ['+f.g+'] '+f.n+': '+f.e);});}
console.log('\nSTATUS: '+(F===0?'ALL PASS':'HAS FAILURES'));
process.exit(F>0?1:0);
