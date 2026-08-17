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
var Core = sandbox.PixelPalace;
var Prog = sandbox.PixelPalaceProgression;
var Cfg = sandbox.PixelPalaceProgressionConfig;
var Ach = sandbox.PixelPalaceAchievements;
var Defs = sandbox.PixelPalaceAchievementDefinitions;
var Reg = sandbox.PixelPalaceRegistry;
var Stor = sandbox.PixelPalaceStorage;
var Player = sandbox.PixelPalacePlayer;

var P=0, F=0, T=0, fails=[], cg='';
function grp(n) { cg=n; console.log('\n=== '+n+' ==='); }
function t(n,fn) { T++; try{fn();P++;console.log('  ✓ '+n);}catch(e){F++;console.log('  ✗ '+n+' — '+e.message);fails.push({g:cg,n:n,e:e.message});} }
function ok(c,m){if(!c)throw new Error(m||'Assertion failed');}
function eq(a,b,m){if(a!==b)throw new Error((m?m+': ':'')+'Expected '+JSON.stringify(b)+' got '+JSON.stringify(a));}
function clean(){store={};Player.create();}
function start(gid){var s=Core.startSession(gid);if(!s.ok)throw new Error('startSession failed');return s;}
function end(sid,score){var e=Core.endSession(sid,{score:score});if(!e.ok)throw new Error('endSession failed');return e;}
function play(gid,score){var s=start(gid);return end(s.session.id,score);}

// ========== M1 CORE ==========
grp('M1: Storage');
t('set/get',function(){clean();Stor.set('t','v');eq(Stor.get('t'),'v');});
t('get missing',function(){clean();eq(Stor.get('x'),null);});
t('get default',function(){clean();eq(Stor.get('x','d'),'d');});
t('clearAll',function(){clean();Stor.set('a',1);Stor.clearAll();eq(Stor.get('a'),null);});

grp('M1: Player');
t('create',function(){clean();var p=Player.create();ok(p.id);ok(p.createdAt);});
t('get',function(){clean();Player.create();var p=Player.get();ok(p.id);});
t('getId',function(){clean();Player.create();ok(Player.getId());});
t('setNickname',function(){clean();Player.create();Player.setNickname('test');eq(Player.getNickname(),'test');});

grp('M1: Registry');
t('44 games',function(){eq(Reg.getAll().length,44);});
t('getById valid',function(){var g=Reg.getById('brick-smash');ok(g);eq(g.id,'brick-smash');});
t('getById invalid',function(){eq(Reg.getById('nonexistent'),null);});
t('isValid',function(){ok(Reg.isValid('brick-smash'));ok(!Reg.isValid('x'));});
t('getByCategory',function(){var a=Reg.getByCategory('arcade');ok(a.length>0);});
t('count',function(){ok(Reg.count()>=44);});

grp('M1: Sessions');
t('start/end',function(){clean();var s=start('brick-smash');var e=end(s.session.id,50);ok(e.ok);eq(e.session.score,50);});
t('double end fails',function(){clean();var s=start('brick-smash');end(s.session.id,50);ok(!Core.endSession(s.session.id,60).ok);});
t('sessions persisted',function(){clean();play('brick-smash',10);ok(Stor.get('sessions').length===1);});

grp('M1: Personal Bests');
t('first PB',function(){clean();var e=play('brick-smash',100);ok(e.personalBest.isNewBest);});
t('higher is PB',function(){clean();play('brick-smash',50);ok(play('brick-smash',100).personalBest.isNewBest);});
t('lower is not PB',function(){clean();play('brick-smash',100);ok(!play('brick-smash',50).personalBest.isNewBest);});
t('PB stored',function(){clean();play('brick-smash',100);var pb=Stor.get('personal_bests',{});ok(pb['brick-smash']);ok(pb['brick-smash'].score===100);});

grp('M1: Global API');
t('startSession',function(){clean();ok(Core.startSession('brick-smash').ok);});
t('endSession',function(){clean();var s=start('brick-smash');ok(Core.endSession(s.session.id,{score:100}).ok);});
t('getPlayer',function(){clean();ok(Core.getPlayer());});
t('getScores',function(){clean();ok(Array.isArray(Core.getScores('brick-smash')));});
t('getAllScores',function(){clean();ok(typeof Core.getAllScores()==='object');});
t('getPersonalBest',function(){clean();play('brick-smash',50);var pb=Core.getPersonalBest('brick-smash');ok(pb);ok(pb.score===50);});
t('getAllPersonalBests',function(){clean();ok(typeof Core.getAllPersonalBests()==='object');});
t('getPlayerId',function(){clean();ok(Core.getPlayerId());});
t('getPlayerName',function(){clean();ok(Core.getPlayerName());});
t('getGame',function(){var g=Core.getGame('brick-smash');ok(g);eq(g.id,'brick-smash');});
t('isGameValid',function(){ok(Core.isGameValid('brick-smash'));ok(!Core.isGameValid('x'));});
t('getAllGames',function(){eq(Core.getAllGames().length,44);});
t('getGamesByCategory',function(){ok(Core.getGamesByCategory('arcade').length>0);});
t('getGameCount',function(){ok(Core.getGameCount()>=44);});

// ========== M2 TASK 1 PROGRESSION ==========
grp('M2-T1: Config');
t('LEVEL_THRESHOLDS',function(){ok(Cfg.LEVEL_THRESHOLDS);eq(Cfg.LEVEL_THRESHOLDS[0],0);ok(Cfg.LEVEL_THRESHOLDS.length>=40);});
t('MAX_LEVEL',function(){eq(Cfg.MAX_LEVEL,40);});
t('XP_PER_COMPLETION',function(){eq(Cfg.XP_PER_COMPLETION,10);});
t('XP_FIRST_PLAY_BONUS',function(){ok(Cfg.XP_FIRST_PLAY_BONUS>0);});
t('XP_PERSONAL_BEST_BONUS',function(){ok(Cfg.XP_PERSONAL_BEST_BONUS>0);});

grp('M2-T1: Engine');
t('getLevel',function(){clean();eq(Prog.getLevel(),1);});
t('getTotalXp',function(){clean();eq(Prog.getTotalXp(),0);});
t('getXpToNextLevel',function(){clean();eq(Prog.getXpToNextLevel(),50);});
t('getLevelProgress',function(){clean();var p=Prog.getLevelProgress();ok(typeof p==='number');ok(p>=0);ok(p<=1);});
t('first game XP',function(){clean();play('brick-smash',100);ok(Prog.getTotalXp()>0);});
t('duplicate session protection',function(){clean();var s=play('brick-smash',100);var xp1=Prog.getTotalXp();var e2=Core.endSession(s.session.id,{score:200});ok(!e2.ok);eq(Prog.getTotalXp(),xp1);});
t('getXpHistory',function(){clean();play('brick-smash',100);var h=Prog.getXpHistory();ok(h.length>0);});

// ========== M2 TASK 2 ACHIEVEMENTS ==========
grp('M2-T2: Definitions');
t('11 achievements',function(){eq(Defs.ACHIEVEMENTS.length,11);});
t('all IDs unique',function(){var ids={};Defs.ACHIEVEMENTS.forEach(function(d){ok(!ids[d.id]);ids[d.id]=1;});});
t('5 condition types',function(){eq(Object.keys(Defs.CONDITION_TYPES).length,5);});
t('5 categories',function(){eq(Object.keys(Defs.CATEGORIES).length,5);});
t('all game IDs valid',function(){Defs.ACHIEVEMENTS.forEach(function(d){d.conditions.forEach(function(c){if(c.gameId)ok(Reg.isValid(c.gameId));});});});

grp('M2-T2: Evaluation');
t('first_steps',function(){clean();play('brick-smash',10);ok(Ach.isUnlocked('first_steps'));});
t('getting_started',function(){clean();['brick-smash','flappy-flight','rebound-rescue','bug-collector','slither-survival','scripted-adventures','pixel-blaster','rabbit-race','puzzle-2048','mind-vault'].forEach(function(g){play(g,10);});ok(Ach.isUnlocked('getting_started'));});
t('high_score',function(){clean();play('brick-smash',50);ok(Ach.isUnlocked('high_score'));});
t('unstoppable',function(){clean();['brick-smash','flappy-flight','rebound-rescue','bug-collector','slither-survival'].forEach(function(g){play(g,100);});ok(Ach.isUnlocked('unstoppable'));});
t('arcade_explorer',function(){clean();play('brick-smash',10);play('puzzle-2048',10);play('blackjack-royale',10);ok(Ach.isUnlocked('arcade_explorer'));});
t('polyplayer',function(){clean();play('brick-smash',10);play('puzzle-2048',10);play('blackjack-royale',10);play('typing-sprint',10);play('sketchcraft',10);play('hangman',10);play('scorekeeper',10);ok(Ach.isUnlocked('polyplayer'));});
t('level_5',function(){clean();['brick-smash','flappy-flight','rebound-rescue','bug-collector','slither-survival','scripted-adventures','pixel-blaster'].forEach(function(g){play(g,10);});ok(Ach.isUnlocked('level_5'));});
t('brick_breaker',function(){clean();play('brick-smash',100);ok(Ach.isUnlocked('brick_breaker'));});
t('slither_master',function(){clean();play('slither-survival',100);ok(Ach.isUnlocked('slither_master'));});
t('speed_demon',function(){clean();play('typing-sprint',100);ok(Ach.isUnlocked('speed_demon'));});

grp('M2-T2: API');
t('getAll',function(){eq(Ach.getAll().length,Defs.ACHIEVEMENTS.length);});
t('getAchievement',function(){var a=Ach.getAchievement('first_steps');ok(a);eq(a.id,'first_steps');});
t('isUnlocked',function(){clean();ok(typeof Ach.isUnlocked('first_steps')==='boolean');});
t('getStats',function(){clean();var s=Ach.getStats();eq(s.total,Defs.ACHIEVEMENTS.length);eq(s.unlocked,0);});
t('getProgress',function(){clean();eq(Ach.getProgress().length,Defs.ACHIEVEMENTS.length);});
t('getUnlocked',function(){clean();ok(Array.isArray(Ach.getUnlocked()));});
t('getLocked',function(){clean();eq(Ach.getLocked().length,Defs.ACHIEVEMENTS.length);});

grp('M2-T2: Integration');
t('endSession returns achievements',function(){clean();var s=start('brick-smash');var e=Core.endSession(s.session.id,{score:100});ok(e.ok);ok(Array.isArray(e.achievements));});
t('endSession returns progression',function(){clean();var s=start('brick-smash');var e=Core.endSession(s.session.id,{score:100});ok(e.progression);ok(typeof e.progression.xpAwarded==='number');});
t('Global has achievement methods',function(){ok(typeof Core.getAchievements==='function');ok(typeof Core.getAchievementStats==='function');ok(typeof Core.isAchievementUnlocked==='function');});

grp('Cross-module Safety');
t('Core still works',function(){clean();var s=Core.startSession('flappy-flight');ok(Core.endSession(s.session.id,{score:75}).ok);});
t('Progression still works',function(){clean();play('brick-smash',100);ok(Prog.getTotalXp()>0);ok(Prog.getLevel()>=1);});
t('Achievements still works',function(){clean();play('brick-smash',100);ok(Ach.isUnlocked('first_steps'));});

console.log('\n'+'='.repeat(50));
console.log('COMBINED REGRESSION');
console.log('='.repeat(50));
console.log('Passed: '+P+'/'+T);
console.log('Failed: '+F+'/'+T);
if(fails.length>0){console.log('\nFAILURES:');fails.forEach(function(f){console.log('  ['+f.g+'] '+f.n+': '+f.e);});}
console.log('\nSTATUS: '+(F===0?'ALL PASS':'HAS FAILURES'));
process.exit(F>0?1:0);
