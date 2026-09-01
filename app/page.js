"use client";

import { useState, useEffect, useRef } from "react";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── ECONOMY ───────────────────────────────────────────────────────────────────
const GAIN_MULT  = 0.012;
const DECAY_MULT = 0.015;
const BONUS_PER_EXTRA = 0.25;
const MAX_BONUS_MULT  = 2.0;
const calcPoints = (imp) => +(imp * GAIN_MULT).toFixed(4);
const calcDecay  = (imp) => +(imp * DECAY_MULT).toFixed(4);
function calcEarnedPoints(basePoints, targetReps, reps) {
  if (reps <= 0) return 0;
  if (reps < targetReps) return basePoints * (reps / targetReps);
  const extra = reps - targetReps;
  const bonusMult = Math.min(MAX_BONUS_MULT, extra * BONUS_PER_EXTRA);
  return basePoints * (1 + bonusMult);
}
function diffLabel(imp) {
  if (imp <= 2) return "TRIVIAL";
  if (imp <= 4) return "EASY";
  if (imp <= 6) return "MODERATE";
  if (imp <= 8) return "HARD";
  return "EPIC";
}


// ── SKY THEMES (Not Boring style scenes; keys unchanged so saves migrate) ─────
const THEMES = {
  ember: {
    name:"Dawn", swatch:"#f2723f",
    sky:["#2a1654","#8a2f63","#f2723f"], sun:"#ffc46b", stars:false,
    m1:"#6b2a5e", m2:"#471d49", m3:"#2b1238",
    accent:"#ffb13d", glass:"18,10,30",
  },
  midnight: {
    name:"Night", swatch:"#34418c",
    sky:["#070822","#1c1f52","#34418c"], sun:"#e8ecff", stars:true,
    m1:"#232a66", m2:"#161b4a", m3:"#0c0f33",
    accent:"#9db4ff", glass:"12,14,40",
  },
  ocean: {
    name:"Ocean", swatch:"#18a0a8",
    sky:["#04263f","#0a5070","#18a0a8"], sun:"#aef0e4", stars:false,
    m1:"#0d5c7c", m2:"#07415c", m3:"#032b40",
    accent:"#5eead4", glass:"6,26,38",
  },
  forest: {
    name:"Forest", swatch:"#3f8f5f",
    sky:["#0c2b22","#1d5c40","#a4c25f"], sun:"#ffe9a3", stars:false,
    m1:"#2e6b4f", m2:"#1c4a37", m3:"#0e2e21",
    accent:"#a3e635", glass:"8,28,22",
  },
  rose: {
    name:"Rose", swatch:"#ff8e6e",
    sky:["#3b1042","#91356f","#ff8e6e"], sun:"#ffd9c2", stars:false,
    m1:"#7c2f63", m2:"#54204c", m3:"#321336",
    accent:"#ffa9c9", glass:"30,12,32",
  },
  crimson: {
    name:"Blood Moon", swatch:"#c43e2a",
    sky:["#1c0610","#5c0f1e","#c43e2a"], sun:"#ff6b4a", stars:true,
    m1:"#571423", m2:"#380c18", m3:"#20060e",
    accent:"#ff8f5e", glass:"28,8,12",
  },
  forge: {
    name:"Forge", swatch:"#ec5e23",
    sky:["#070609","#161219","#2a1c10"], sun:"#ff7a2e", stars:false, ember:true,
    m1:"#3a2415", m2:"#241711", m3:"#120b09",
    accent:"#ff7a2e", glass:"26,16,10",
  },
};
const THEME_KEYS = Object.keys(THEMES);
// Shared glass / text tokens (constant across skies for guaranteed contrast)
const GLASS = "rgba(12,10,34,0.42)";
const GLASS_SOFT = "rgba(12,10,34,0.30)";
const GLASS_HEAVY = "rgba(12,10,34,0.72)";
const LINE = "rgba(255,255,255,0.16)";
const TXT = "#ffffff";
const DIM = "rgba(255,255,255,0.75)";
const FAINT = "rgba(255,255,255,0.45)";
const GOOD = "#4ade80";
const BAD = "#ff7b7b";

const DEFAULT_SETTINGS = {
  kanbanEnabled: true,
  pomodoroEnabled: true,
  showXP: true,
  statStyle: "radar", // "radar" | "bars" | "none"
  theme: "ember",
  cardStyle: "vivid", // "vivid" | "tinted"
  casinoEnabled: true,
  shopEnabled: true,
  questsEnabled: true,
  statsEnabled: true,
  weeklyOnHome: true,
  planEnabled: true,
  bossEnabled: true,
  devMode: false,
};
const DEFAULT_EQUIPPED = {
  boots:true, sword:true, armor:true, shield:true, helm:true,
  trim:true, aura:true, crown:true, wings:true,
};
const DEFAULT_CHARACTER = {
  skin:"#9c6b3c", hair:"#1a0e08", shirt:"#a16207", pants:"#1f2937",
  body:"m", hairstyle:"classic",
  equipped: { ...DEFAULT_EQUIPPED },
};
const DEFAULT_POMO = { workMin:25, breakMin:5, sessionsByDay:{} };

const SKINS  = ["#f6d7b0","#eac086","#c98c53","#9c6b3c","#7b4a24","#5a3318"];
const HAIRS  = ["#1a0e08","#3b2219","#6b3e1e","#a8763e","#d9a05b","#4a4a4a","#b5b5b5","#e8c14d","#8a2f1d","#46355c"];
const SHIRTS = ["#a16207","#7c2d12","#1d4ed8","#15803d","#7e22ce","#be185d","#0e7490","#3f3f46","#b91c1c","#ca8a04"];
const PANTS  = ["#1f2937","#3f2d1d","#1e3a8a","#14532d","#4c1d95","#52525b","#7f1d1d","#374151"];
const HAIRSTYLES = [["classic","Classic"],["long","Long"],["fro","Fro"],["braids","Braids"],["buzz","Buzz"],["bald","Bald"]];
const BODIES = [["m","Champion"],["f","Champion (F)"]];
const LIST_COLORS = ["#3b82f6","#f59e0b","#22c55e","#a855f7","#ef4444","#ec4899","#14b8a6","#f97316"];

// ── REWARD ECONOMY ────────────────────────────────────────────────────────────
// Coins are earned by completing quests (scaled to difficulty). They are BET in
// the spin games, which pay out Gems. Gems are spent in the Shop. The ledger is
// lifetime-earned minus lifetime-spent, clamped at zero, so unchecking can never
// create a negative balance or an infinite farm (spent coins are gone for good).
const COIN_PER_IMPORTANCE = 2;          // a 10-difficulty quest mints 20 coins
const coinsForTask = (task) => Math.max(1, Math.round((task.importance ?? 5) * COIN_PER_IMPORTANCE));
// Daily spins unlock as the day's earned XP crosses these fractions of the day's max.
const SPIN_THRESHOLDS = [0.15, 0.40, 0.70, 1.0]; // up to 4 spins/day on a full day
const SPIN_COST = 25;                    // coins per pull
const PERFECT_DAY_BONUS_GEMS = 30;

const DEFAULT_WALLET = {
  coinsEarned: 0, coinsSpent: 0,
  gemsEarned: 0, gemsSpent: 0, shields: 0,
  coinsByTaskDay: {},                 // "taskId|YYYY-MM-DD" -> coins banked (prevents double-earn)
  lastCoinDecay: null,                // date we last applied coin decay
  spinsUsedByDay: {}, perfectClaimedByDay: {},
  owned: [], equippedCosmetics: {}, pet: null,
};

// Rarity → gem payout weighting for the spin games
const RARITY = {
  common:   { label:"COMMON",    color:"#9ca3af", gems:[3,6] },
  uncommon: { label:"UNCOMMON",  color:"#4ade80", gems:[7,14] },
  rare:     { label:"RARE",      color:"#38bdf8", gems:[16,30] },
  epic:     { label:"EPIC",      color:"#a855f7", gems:[34,60] },
  legendary:{ label:"LEGENDARY", color:"#f59e0b", gems:[80,150] },
};

// ── AURA SHAPES (each recolorable; colors bought separately) ──────────────────
const AURA_SHAPES = [
  { id:"saiyan",  name:"Saiyan Flame" },
  { id:"cloud",   name:"Dark Omen" },
  { id:"electric",name:"Static Storm" },
  { id:"halo",    name:"Holy Ring" },
  { id:"orbit",   name:"Orbiting Sparks" },
];

// ── METAL/GEM COLOR TIERS (shared by auras + capes), ordered by real-world value
// gate.streak = consecutive 100% days required; basic three have no gate.
const METALS = [
  { id:"bronze",   name:"Bronze",   color:"#b87333", rarity:"common",    gems:40  },
  { id:"silver",   name:"Silver",   color:"#cbd5e1", rarity:"common",    gems:70  },
  { id:"gold",     name:"Gold",     color:"#f5b827", rarity:"uncommon",  gems:120 },
  { id:"ruby",     name:"Ruby",     color:"#e0115f", rarity:"rare",      gems:150, gate:{streak:7}  },
  { id:"emerald",  name:"Emerald",  color:"#10b981", rarity:"rare",      gems:200, gate:{streak:14} },
  { id:"sapphire", name:"Sapphire", color:"#1d6ef2", rarity:"epic",      gems:280, gate:{streak:30} },
  { id:"amethyst", name:"Amethyst", color:"#9b4dff", rarity:"epic",      gems:360, gate:{streak:60} },
  { id:"diamond",  name:"Diamond",  color:"#9af4ff", rarity:"legendary",gems:500, gate:{streak:90} },
];
const AURA_COLORS = METALS.map(m=>m.color); // legacy ref (free recolor disabled)

// ── PET DEFINITIONS (hand-drawn SVG creatures; streak tiers 3/7/14/30/60/90) ──
const PETS = [
  { id:"pet_cat",     name:"Shadow Cat",    rarity:"common",    gems:55,  art:"cat",    color:"#3f3f46" },
  { id:"pet_owl",     name:"Wise Owl",      rarity:"common",    gems:75,  art:"owl",    color:"#92580f" },
  { id:"pet_dog",     name:"Loyal Pup",     rarity:"uncommon",  gems:95,  art:"dog",    color:"#b45309" },
  { id:"pet_fox",     name:"Ember Fox",     rarity:"rare",      gems:130, art:"fox",    color:"#ea580c", gate:{streak:3}  },
  { id:"pet_wolf",    name:"Dire Wolf",     rarity:"rare",      gems:170, art:"wolf",   color:"#64748b", gate:{streak:7}  },
  { id:"pet_stag",    name:"Spirit Stag",   rarity:"epic",      gems:230, art:"stag",   color:"#0ea5a0", gate:{streak:14} },
  { id:"pet_dragon",  name:"Baby Dragon",   rarity:"epic",      gems:300, art:"dragon", color:"#16a34a", gate:{streak:30} },
  { id:"pet_griffin", name:"Griffin",       rarity:"legendary", gems:420, art:"griffin",color:"#d4a017", gate:{streak:60} },
  { id:"pet_phoenix", name:"Phoenix Chick", rarity:"legendary", gems:500, art:"phoenix",color:"#f97316", gate:{streak:90} },
];

// ── SHOP CATALOG (auras [shape×metal], pets, capes [metal]) ───────────────────
// Auras: one entry per shape×metal so each colored aura is a separate purchase.
const AURA_ITEMS = [];
AURA_SHAPES.forEach(shape=>{
  METALS.forEach(m=>{
    AURA_ITEMS.push({
      id:`aura_${shape.id}_${m.id}`, type:"aura", auraShape:shape.id, metal:m.id,
      name:`${m.name} ${shape.name}`, rarity:m.rarity, gems:m.gems, gate:m.gate, color:m.color,
    });
  });
});
const CAPE_ITEMS = METALS.map(m=>({
  id:`cape_${m.id}`, type:"cape", metal:m.id, name:`${m.name} Cape`,
  rarity:m.rarity, gems:m.gems, gate:m.gate, color:m.color,
}));
const SHOP = [
  ...AURA_ITEMS,
  ...PETS.map(p=>({ id:p.id, type:"pet", name:p.name, rarity:p.rarity, gems:p.gems, gate:p.gate, art:p.art, color:p.color })),
  ...CAPE_ITEMS,
];
const SHOP_TYPES = [["all","ALL"],["aura","AURAS"],["pet","PETS"],["cape","CAPES"]];
const SPIN_GAMES = ["slot","wheel","blackjack"];
const CAT_COLORS = ["#f59e0b","#ef4444","#38bdf8","#34d399","#a78bfa","#f472b6","#fb923c","#22c55e","#e879f9","#fbbf24"];

const GEAR = [
  { slot:"boots",  lvl:2,  name:"Leather Boots" },
  { slot:"sword",  lvl:3,  name:"Sword (upgrades at LV4 & LV10)" },
  { slot:"armor",  lvl:5,  name:"Armor (upgrades at LV7)" },
  { slot:"shield", lvl:6,  name:"Iron Shield" },
  { slot:"helm",   lvl:8,  name:"Crested Helm" },
  { slot:"trim",   lvl:9,  name:"Golden Trim" },
  { slot:"aura",   lvl:11, name:"Holy Aura" },
  { slot:"crown",  lvl:12, name:"Crown of Valor" },
  { slot:"wings",  lvl:13, name:"Wings of Legend" },
];

const LEVELS = [
  { lvl:0,  name:"Peasant",    unlock:"Starting out" },
  { lvl:1,  name:"Vagabond",   unlock:"Cloth tunic" },
  { lvl:2,  name:"Squire",     unlock:"Leather boots" },
  { lvl:3,  name:"Apprentice", unlock:"Wooden sword" },
  { lvl:4,  name:"Footman",    unlock:"Iron sword" },
  { lvl:5,  name:"Warrior",    unlock:"Leather armor" },
  { lvl:6,  name:"Knight",     unlock:"Iron shield" },
  { lvl:7,  name:"Templar",    unlock:"Steel armor" },
  { lvl:8,  name:"Champion",   unlock:"Crested helm" },
  { lvl:9,  name:"Crusader",   unlock:"Golden trim" },
  { lvl:10, name:"Hero",       unlock:"Enchanted blade" },
  { lvl:11, name:"Paladin",    unlock:"Holy aura" },
  { lvl:12, name:"Warlord",    unlock:"Crown of valor" },
  { lvl:13, name:"Mythic",     unlock:"Wings of legend" },
  { lvl:14, name:"Ascended",   unlock:"Divine ascension" },
];

const QUOTES = [
  ["I can do all things through Christ who strengthens me.","Philippians 4:13"],
  ["Discipline is the bridge between goals and accomplishment.","Jim Rohn"],
  ["The supreme art of war is to subdue the enemy without fighting.","Sun Tzu"],
  ["Whatever you do, work at it with all your heart.","Colossians 3:23"],
  ["We are what we repeatedly do. Excellence is a habit.","Aristotle"],
  ["Hard choices, easy life. Easy choices, hard life.","Jerzy Gregorek"],
  ["Do not despise these small beginnings.","Zechariah 4:10"],
  ["A small daily task, if it be really daily, beats a spasmodic effort.","A. Trollope"],
  ["Iron sharpens iron, and one man sharpens another.","Proverbs 27:17"],
  ["You do not rise to your goals. You fall to your systems.","James Clear"],
  ["The man who moves a mountain begins by carrying small stones.","Confucius"],
  ["Let us not grow weary of doing good; in due season we will reap.","Galatians 6:9"],
  ["Victory is reserved for those willing to pay its price.","Sun Tzu"],
  ["Each day is a new battle. Win the morning, win the day.","Unknown"],
];
function quoteOfDay() {
  const now = new Date();
  const start = new Date(now.getFullYear(),0,0);
  const doy = Math.floor((now - start) / 86400000);
  return QUOTES[doy % QUOTES.length];
}

const INIT_CATEGORIES = [
  { id:"career",   name:"Career",   icon:"💼", color:"#f59e0b", value:3.0, maxValue:10 },
  { id:"mind",     name:"Mind",     icon:"🧠", color:"#38bdf8", value:3.0, maxValue:10 },
  { id:"body",     name:"Body",     icon:"💪", color:"#ef4444", value:3.0, maxValue:10 },
  { id:"faith",    name:"Faith",    icon:"✝️",  color:"#a78bfa", value:3.0, maxValue:10 },
  { id:"grooming", name:"Grooming", icon:"✨", color:"#34d399", value:3.0, maxValue:10 },
  { id:"home",     name:"Home",     icon:"🏠", color:"#fb923c", value:3.0, maxValue:10 },
  { id:"love",     name:"Love",     icon:"❤️",  color:"#f472b6", value:3.0, maxValue:10 },
];
const mkTask = (id, name, catId, importance, days, targetReps=1) => ({
  id, name, catId, importance, targetReps,
  points: calcPoints(importance), decayRate: calcDecay(importance),
  days, freq:"daily", weeklyTarget:1, completions:{},
});
const INIT_TASKS = [
  mkTask("t1","Apply to jobs","career",9,[1,2,3,4,5]),
  mkTask("t16","To-do list task","career",5,[1,2,3,4,5]),
  mkTask("t2","Study cloud engineering","mind",7,[1,2,3,4,5,6]),
  mkTask("t3","Gym","body",10,[1,2,3,4,5,6,0]),
  mkTask("t4","Run","body",3,[1,3,5]),
  mkTask("t5","Ab workout","body",3,[1,2,3,4,5,6,0]),
  mkTask("t6","Cardio","body",2,[2,4,6]),
  mkTask("t7","Take vitamins","body",5,[1,2,3,4,5,6,0]),
  mkTask("t8","Read Bible","faith",10,[1,2,3,4,5,6,0]),
  mkTask("t9","Pray","faith",5,[1,2,3,4,5,6,0]),
  mkTask("t10","Brush teeth","grooming",4,[1,2,3,4,5,6,0]),
  mkTask("t11","Apply acne med (face)","grooming",7,[1,2,3,4,5,6,0]),
  mkTask("t12","Apply acne med (body)","grooming",6,[1,2,3,4,5,6,0]),
  mkTask("t13","Moisturize","grooming",3,[1,2,3,4,5,6,0]),
  mkTask("t14","Clean","home",6,[1,2,3,4,5,6,0]),
  mkTask("t15","Iron clothes","home",2,[1,3,5]),
  mkTask("t17","Do something for GF","love",6,[1,2,3,4,5,6,0]),
  mkTask("t18","Write a note","love",2,[1,2,3,4,5,6,0]),
];
const INIT = {
  categories: INIT_CATEGORIES, tasks: INIT_TASKS,
  settings: { ...DEFAULT_SETTINGS },
  character: { ...DEFAULT_CHARACTER, equipped:{ ...DEFAULT_EQUIPPED } },
  customTitles: {},
  kanban: { todo:[], doing:[], done:[] },
  lists: [],
  schedule: {},
  combo: { count:0, lastAt:0 },
  challengeClaims: {},
  bossClaims: {},
  priorityBar: [0,0,0,0,0,0,0],
  trophies: {},
  flags: {},
  pomodoro: { ...DEFAULT_POMO },
  wallet: { ...DEFAULT_WALLET },
  lastDecayDate: null,
};

// ── DATE / COMPLETION HELPERS ─────────────────────────────────────────────────
// minutes-from-midnight → "9:05 AM"
function fmtTime(mins) {
  let h = Math.floor(mins/60), m = mins%60;
  const ap = h>=12 ? "PM" : "AM";
  let hh = h%12; if (hh===0) hh=12;
  return `${hh}:${String(m).padStart(2,"0")} ${ap}`;
}
// "9:05 AM"-style end label given start+dur
const fmtRange = (start, dur) => `${fmtTime(start)} – ${fmtTime(Math.min(1439, start+dur))}`;
const durLabel = (d) => d>=60 ? `${Math.floor(d/60)}h${d%60?` ${d%60}m`:""}` : `${d}m`;

function dateKey(date) {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function getReps(task, dateStr) {
  const v = task.completions && task.completions[dateStr];
  if (v === true) return 1;
  return Number(v) || 0;
}
function isCompletedOn(task, dateStr) {
  return getReps(task, dateStr) >= (task.targetReps || 1);
}
function getDayOfWeek(dateStr) {
  const [y,m,d] = dateStr.split("-").map(Number);
  return new Date(y, m-1, d).getDay();
}
function isScheduledOn(task, dateStr) {
  return (task.days||[]).includes(getDayOfWeek(dateStr));
}
function getStreak(task) {
  let s = 0;
  const cur = new Date();
  const todayK = dateKey(cur);
  if (isScheduledOn(task, todayK) && !isCompletedOn(task, todayK)) cur.setDate(cur.getDate()-1);
  for (let i = 0; i < 730; i++) {
    const dk = dateKey(cur);
    if (isScheduledOn(task, dk)) {
      if (isCompletedOn(task, dk)) s++;
      else if ((task.frozen||{})[dk]) { /* shielded day — streak survives */ }
      else break;
    }
    cur.setDate(cur.getDate()-1);
  }
  return s;
}
function totalCompletions(task) {
  return Object.keys(task.completions||{}).length;
}
// Per-quest level (levels up every 7 lifetime completions) — HabitForge-style badge
function questLevel(task) { return Math.floor(totalCompletions(task) / 7) + 1; }
function questLevelPct(task) { return ((totalCompletions(task) % 7) / 7) * 100; }
// Current week (Mon → Sun) date keys
function weekDateKeys() {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // Mon=0
  const mon = new Date(now); mon.setDate(now.getDate() - dow);
  return Array.from({length:7}, (_,i)=>{ const d=new Date(mon); d.setDate(mon.getDate()+i); return dateKey(d); });
}
// Mon→Sun date keys for the week containing a given date
function weekKeysFor(dateStr) {
  const d = dateStr ? new Date(dateStr+"T00:00:00") : new Date();
  const dow = (d.getDay() + 6) % 7;
  const mon = new Date(d); mon.setDate(d.getDate() - dow);
  return Array.from({length:7}, (_,i)=>{ const x=new Date(mon); x.setDate(mon.getDate()+i); return dateKey(x); });
}
const isWeekly = (task) => task && task.freq === "weekly";
// Total times a weekly habit has been logged across the week containing dateStr
// (sums reps per day, so you can log several in a single day toward a big target)
function weeklyDone(task, dateStr) {
  const keys = weekKeysFor(dateStr);
  return keys.reduce((s,dk)=> s + (getReps(task, dk) || 0), 0);
}
const weeklyTargetOf = (task) => Math.max(1, task.weeklyTarget || 1);
// Weekly completion fraction (capped at 1) for the week containing dateStr
function weeklyFrac(task, dateStr) {
  return Math.min(1, weeklyDone(task, dateStr) / weeklyTargetOf(task));
}
const weeklyMet = (task, dateStr) => weeklyDone(task, dateStr) >= weeklyTargetOf(task);
// Unified "is this task active/relevant on this date?" — daily uses schedule, weekly is always active that week
function taskActiveOn(task, dateStr) {
  return isWeekly(task) ? true : isScheduledOn(task, dateStr);
}
// Weekly streak: consecutive prior weeks (excluding current in-progress) the target was met
function weeklyStreak(task) {
  let s = 0;
  const cur = new Date();
  // step back to previous full week
  cur.setDate(cur.getDate() - 7);
  for (let i=0;i<104;i++){
    const k = dateKey(cur);
    if (weeklyMet(task, k)) s++; else break;
    cur.setDate(cur.getDate()-7);
  }
  return s;
}

// ── RATING / LEVEL ────────────────────────────────────────────────────────────
function getRating(cats) {
  if (!cats || !cats.length) return 0;
  return Math.max(0, Math.min(100, Math.round(cats.reduce((s,c)=>s+(c.value/c.maxValue)*100,0)/cats.length)));
}
function getTier(r) {
  if (r >= 90) return { label:"LEGENDARY", color:"#f59e0b" };
  if (r >= 75) return { label:"ELITE",     color:"#a78bfa" };
  if (r >= 60) return { label:"SKILLED",   color:"#38bdf8" };
  if (r >= 40) return { label:"AVERAGE",   color:"#34d399" };
  return               { label:"NOVICE",   color:"#9ca3af" };
}
function getLevel(rating) {
  const lvl = Math.min(14, Math.floor(rating / 7));
  return { ...LEVELS[lvl], lvl, ratingForNext:(lvl+1)*7, ratingFloor:lvl*7 };
}
function getTitle(data, lvl) {
  return (data.customTitles && data.customTitles[lvl]) || LEVELS[lvl].name;
}
function projectRating(categories, tasks, dateStr, scenario) {
  const cats = categories.map(c=>({...c}));
  tasks.forEach(task=>{
    if (!task.catId) return;
    if (!isScheduledOn(task,dateStr)) return;
    const target = task.targetReps || 1;
    const reps = getReps(task, dateStr);
    const done = reps >= target;
    const ci = cats.findIndex(c=>c.id===task.catId);
    if (ci===-1) return;
    if (scenario==="full" && !done) {
      const sofar = calcEarnedPoints(task.points, target, reps);
      const atTarget = calcEarnedPoints(task.points, target, target);
      cats[ci].value = Math.min(cats[ci].maxValue, cats[ci].value + (atTarget - sofar));
    }
    if (scenario==="decay" && !done) {
      cats[ci].value = Math.max(0, cats[ci].value - task.decayRate);
    }
  });
  return Math.max(0, Math.min(100, Math.round(cats.reduce((s,c)=>s+(c.value/c.maxValue)*100,0)/cats.length)));
}

// ── DECAY ENGINE (anchor-based; each missed day decays exactly once) ──────────
function applyDecay(data) {
  const today = dateKey();
  const anchor = data.lastDecayDate;
  if (!anchor) return { data: { ...data, lastDecayDate: today }, lost: 0 };
  if (anchor >= today) return { data, lost: 0 };
  let cats = data.categories.map(c=>({...c}));
  let lost = 0;
  try {
    // Process every elapsed day from the anchor up to and INCLUDING yesterday.
    // (The old version started at anchor+1 and ran while < today, which skipped
    //  the anchor day's own missed quests entirely — so rank never dropped.)
    const cursor = new Date(anchor + "T00:00:00");
    const todayD = new Date(today + "T00:00:00");
    let safety = 0;
    while (cursor < todayD && safety < 400) {
      const dk = dateKey(cursor);
      data.tasks.forEach(task=>{
        try {
          if (!task.catId) return;
          if (!isScheduledOn(task, dk)) return;
          if (isCompletedOn(task, dk)) return;
          if ((task.frozen||{})[dk]) return;      // streak shield — no decay
          const ci = cats.findIndex(c=>c.id===task.catId);
          if (ci !== -1) {
            const before = cats[ci].value;
            cats[ci].value = Math.max(0, cats[ci].value - (task.decayRate||0));
            lost += before - cats[ci].value;
          }
        } catch {}
      });
      cursor.setDate(cursor.getDate()+1);
      safety++;
    }
  } catch {}
  return { data: { ...data, categories: cats, lastDecayDate: today }, lost };
}

// ── MIGRATION (protects existing cloud saves; adds new fields) ────────────────
function migrate(d) {
  if (!d || !d.categories || !d.tasks) return { ...INIT, lastDecayDate: dateKey() };
  const settings = { ...DEFAULT_SETTINGS, ...(d.settings||{}) };
  if (!THEMES[settings.theme]) settings.theme = "ember";
  if (!["radar","bars","none"].includes(settings.statStyle)) settings.statStyle = "radar";
  if (!["vivid","tinted"].includes(settings.cardStyle)) settings.cardStyle = "vivid";
  const chr = { ...DEFAULT_CHARACTER, ...(d.character||{}),
    equipped: { ...DEFAULT_EQUIPPED, ...((d.character||{}).equipped||{}) } };
  if (!["m","f"].includes(chr.body)) chr.body = "m";
  if (!HAIRSTYLES.some(h=>h[0]===chr.hairstyle)) chr.hairstyle = "classic";
  return {
    ...d,
    settings,
    character: chr,
    tasks: (d.tasks||[]).map((t,i)=>({
      ...t,
      order: typeof t.order === "number" ? t.order : i,
      freq: t.freq === "weekly" ? "weekly" : "daily",
      weeklyTarget: Math.max(1, t.weeklyTarget || 1),
      createdAt: t.createdAt || Object.keys(t.completions||{}).sort()[0] || dateKey(),
      frozen: (t.frozen && typeof t.frozen === "object") ? t.frozen : {},
    })),
    customTitles: d.customTitles || {},
    kanban: (d.kanban && Array.isArray(d.kanban.todo)) ? d.kanban : { todo:[], doing:[], done:[] },
    lists: Array.isArray(d.lists) ? d.lists : [],
    schedule: (d.schedule && typeof d.schedule === "object") ? d.schedule : {},
    combo: (d.combo && typeof d.combo === "object") ? { count:d.combo.count||0, lastAt:d.combo.lastAt||0 } : { count:0, lastAt:0 },
    challengeClaims: (d.challengeClaims && typeof d.challengeClaims === "object") ? d.challengeClaims : {},
    trophies: (d.trophies && typeof d.trophies === "object") ? d.trophies : {},
    bossClaims: (()=>{ const src=(d.bossClaims && typeof d.bossClaims==="object")?d.bossClaims:{}; const out={};
      const ids=["sloth","procrast","wraith","golem","hydra","fiend","fog","snooze"];
      Object.entries(src).forEach(([wk,v])=>{ if (typeof v==="string") out[wk]=v;
        else { const seed=String(wk).split("").reduce((x,c)=>x+c.charCodeAt(0),0); out[wk]=ids[seed%ids.length]; } });
      return out; })(),
    priorityBar: (()=>{ const src=Array.isArray(d.priorityBar)?d.priorityBar:[];
      return [0,1,2,3,4,5,6].map(i=>Math.max(0, parseInt(src[i])||0)); })(),
    flags: (d.flags && typeof d.flags === "object") ? d.flags : {},
    pomodoro: { ...DEFAULT_POMO, ...(d.pomodoro||{}), sessionsByDay: { ...((d.pomodoro||{}).sessionsByDay||{}) } },
    wallet: { ...DEFAULT_WALLET, ...(d.wallet||{}),
      coinsByTaskDay: { ...((d.wallet||{}).coinsByTaskDay||{}) },
      shields: (d.wallet||{}).shields || 0,
      spinsUsedByDay: { ...((d.wallet||{}).spinsUsedByDay||{}) },
      perfectClaimedByDay: { ...((d.wallet||{}).perfectClaimedByDay||{}) },
      owned: Array.isArray((d.wallet||{}).owned) ? d.wallet.owned : [],
      equippedCosmetics: { ...((d.wallet||{}).equippedCosmetics||{}) },
    },
    lastDecayDate: d.lastDecayDate || dateKey(),
  };
}

// Spendable balances (never negative; spent currency is gone for good)
const coinBalance = (w) => Math.max(0, (w.coinsEarned||0) - (w.coinsSpent||0));
const gemBalance  = (w) => Math.max(0, (w.gemsEarned||0) - (w.gemsSpent||0));

// XP earned today (sum of points actually banked from today's completions)
function earnedXpToday(data, dk) {
  let xp = 0;
  data.tasks.forEach(t=>{
    if (!t.catId) return;
    if (!isScheduledOn(t, dk)) return;
    const target = t.targetReps||1;
    const reps = getReps(t, dk);
    xp += calcEarnedPoints(t.points, target, reps);
  });
  return xp;
}
// Max XP attainable today (everything to target)
function maxXpToday(data, dk) {
  let xp = 0;
  data.tasks.forEach(t=>{
    if (!t.catId) return;
    if (!isScheduledOn(t, dk)) return;
    const target = t.targetReps||1;
    xp += calcEarnedPoints(t.points, target, target);
  });
  return xp;
}
// How many spins the day's progress has UNLOCKED (vs used)
function spinsUnlocked(data, dk) {
  const max = maxXpToday(data, dk);
  if (max <= 0) return 0;
  const frac = earnedXpToday(data, dk) / max;
  return SPIN_THRESHOLDS.filter(t => frac >= t - 0.0001).length;
}
// Best run of consecutive 100%-complete days ending today (drives shop gates)
function bestPerfectStreak(data) {
  const cur = new Date();
  let streak = 0;
  for (let i=0;i<400;i++){
    const dk = dateKey(cur);
    const sched = data.tasks.filter(t=>t.catId && isScheduledOn(t,dk));
    if (i===0 && sched.length===0) { cur.setDate(cur.getDate()-1); continue; }
    if (sched.length===0) { cur.setDate(cur.getDate()-1); continue; }
    const allDone = sched.every(t=>isCompletedOn(t,dk));
    if (allDone) streak++;
    else {
      if (i===0) { cur.setDate(cur.getDate()-1); continue; } // today not finished yet — don't break
      break;
    }
    cur.setDate(cur.getDate()-1);
  }
  return streak;
}
function rollRarity() {
  const r = Math.random();
  if (r < 0.50) return "common";
  if (r < 0.78) return "uncommon";
  if (r < 0.93) return "rare";
  if (r < 0.985) return "epic";
  return "legendary";
}

// Coin decay: for every elapsed day, lose coins proportional to the XP-weight of
// the scheduled quests you DIDN'T complete. Skip a hard quest, lose more coins.
function applyCoinDecay(data) {
  const w = data.wallet || DEFAULT_WALLET;
  const today = dateKey();
  const anchor = w.lastCoinDecay;
  if (!anchor) return { wallet: { ...w, lastCoinDecay: today }, lostCoins: 0 };
  if (anchor >= today) return { wallet: w, lostCoins: 0 };
  let bal = Math.max(0, (w.coinsEarned||0) - (w.coinsSpent||0));
  let lost = 0;
  try {
    const cursor = new Date(anchor + "T00:00:00");
    const todayD = new Date(today + "T00:00:00");
    let safety = 0;
    while (cursor < todayD && safety < 400) {
      const dk = dateKey(cursor);
      let dayMax = 0, dayMissed = 0;
      data.tasks.forEach(t=>{
        if (!t.catId || !isScheduledOn(t, dk)) return;
        const val = coinsForTask(t);
        dayMax += val;
        if (!isCompletedOn(t, dk)) dayMissed += val;
      });
      if (dayMax > 0 && dayMissed > 0) {
        const frac = dayMissed / dayMax;
        const drop = Math.round(bal * frac * 0.5); // soften so one bad day isn't a wipeout
        lost += drop;
        bal = Math.max(0, bal - drop);
      }
      cursor.setDate(cursor.getDate()+1);
      safety++;
    }
  } catch {}
  return { wallet: { ...w, coinsSpent: (w.coinsSpent||0) + lost, lastCoinDecay: today }, lostCoins: lost };
}

function gemsForRarity(rarity) {
  const [lo,hi] = RARITY[rarity].gems;
  return Math.floor(lo + Math.random()*(hi-lo+1));
}

// Per-quest stats: completion rate since the quest became active
function questStats(task) {
  const keys = Object.keys(task.completions||{}).sort();
  const start = task.createdAt || keys[0] || dateKey();
  // Weekly habits: measure in weeks — how many weeks hit the target since start
  if (isWeekly(task)) {
    let expected = 0, done = 0;
    try {
      let cur = new Date(weekKeysFor(start)[0] + "T00:00:00");
      const endMon = new Date(weekKeysFor(dateKey())[0] + "T00:00:00");
      let safety = 0;
      while (cur <= endMon && safety < 520) {
        expected++;
        if (weeklyMet(task, dateKey(cur))) done++;
        cur.setDate(cur.getDate()+7);
        safety++;
      }
    } catch {}
    const rate = expected > 0 ? Math.min(100, Math.round((done/expected)*100)) : 0;
    return { start, expected, done, rate, weekly:true };
  }
  let expected = 0;
  try {
    const cur = new Date(start + "T00:00:00");
    const end = new Date(dateKey() + "T00:00:00");
    let safety = 0;
    while (cur <= end && safety < 1500) {
      if (isScheduledOn(task, dateKey(cur))) expected++;
      cur.setDate(cur.getDate()+1);
      safety++;
    }
  } catch {}
  const done = totalCompletions(task);
  const rate = expected > 0 ? Math.min(100, Math.round((done/expected)*100)) : 0;
  return { start, expected, done, rate };
}

// ── DAILY CHALLENGE (deterministic per date) ─────────────────────────────────
function dailyChallengeFor(d, todayK) {
  const dailies = (d.tasks||[]).filter(t=>t.catId && !isWeekly(t) && isScheduledOn(t, todayK));
  const weeklies = (d.tasks||[]).filter(t=>t.catId && isWeekly(t));
  const seed = todayK.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const catsToday = [...new Set(dailies.map(t=>t.catId))];
  const opts = [];
  if (dailies.length>=2) opts.push("count");
  if (catsToday.length>=2) opts.push("cat");
  if (weeklies.length>=1) opts.push("weekly");
  if (!opts.length) return null;
  const pick = opts[seed % opts.length];
  if (pick==="cat") {
    const catId = catsToday[seed % catsToday.length];
    const goal = dailies.filter(t=>t.catId===catId).length;
    return { type:"cat", catId, goal, gems:15 };
  }
  if (pick==="weekly") {
    const n = 2 + (seed % 3);
    return { type:"weekly", n, goal:n, gems:12 };
  }
  const n = Math.max(2, Math.min(dailies.length, 2 + (seed % 3)));
  return { type:"count", n, goal:n, gems:10 };
}


// Original boss illustrations for Life RPG — drawn as SVG strings so the exact
// art previews here and ships in the app via dangerouslySetInnerHTML.
function bossArtSVG(id) {
  const W=380, H=300;
  const open = (defs)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%"><defs>${defs}</defs>`;
  const close = `</svg>`;

  if (id==="sloth") {
    return open(`
      <linearGradient id="sl_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5c4c36"/><stop offset="100%" stop-color="#241c11"/></linearGradient>
      <linearGradient id="sl_f" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6d5b41"/><stop offset="100%" stop-color="#33291a"/></linearGradient>
      <radialGradient id="sl_e" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffd27a"/><stop offset="55%" stop-color="#ff8c1e"/><stop offset="100%" stop-color="#8a2c00"/></radialGradient>`)+
      `<ellipse cx="190" cy="276" rx="158" ry="16" fill="#000" opacity="0.45"/>`+
      `<path d="M46 268 C 40 200 58 140 96 104 L 88 84 L 112 92 L 112 70 L 134 84 L 142 58 L 162 78 L 182 50 L 200 76 L 224 56 L 232 82 L 258 68 L 260 92 L 286 86 L 276 108 C 314 146 328 204 334 268 Z" fill="url(#sl_b)"/>`+
      `<path d="M84 236 Q 104 196 96 156" stroke="#1d160d" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.7"/>`+
      `<path d="M296 232 Q 276 196 284 158" stroke="#1d160d" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.7"/>`+
      `<path d="M150 262 Q 158 228 150 196 M 230 262 Q 222 228 230 196" stroke="#1d160d" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.55"/>`+
      `<ellipse cx="122" cy="118" rx="24" ry="9" fill="#44601f" opacity="0.85" transform="rotate(-20 122 118)"/>`+
      `<ellipse cx="262" cy="106" rx="18" ry="7" fill="#52702a" opacity="0.8" transform="rotate(16 262 106)"/>`+
      `<path d="M124 210 C 118 156 146 126 190 126 C 234 126 262 156 256 210 C 240 232 140 232 124 210 Z" fill="url(#sl_f)"/>`+
      `<path d="M128 158 C 156 138 224 138 252 158 L 246 176 C 220 160 160 160 134 176 Z" fill="#171008"/>`+
      `<path d="M146 176 L 182 168 L 182 182 L 148 186 Z" fill="#0a0603"/>`+
      `<path d="M234 176 L 198 168 L 198 182 L 232 186 Z" fill="#0a0603"/>`+
      `<ellipse cx="166" cy="177" rx="14" ry="6" fill="url(#sl_e)" transform="rotate(-8 166 177)"/>`+
      `<ellipse cx="214" cy="177" rx="14" ry="6" fill="url(#sl_e)" transform="rotate(8 214 177)"/>`+
      `<path d="M158 200 l 26 10 M 172 198 l -4 14" stroke="#8a7458" stroke-width="4" stroke-linecap="round" opacity="0.8"/>`+
      `<path d="M146 214 C 160 232 220 232 234 214 L 232 228 C 216 242 164 242 148 228 Z" fill="#2a2013"/>`+
      `<path d="M156 222 L 150 200 L 166 216 Z" fill="#e8dcc2"/>`+
      `<path d="M224 222 L 230 200 L 214 216 Z" fill="#e8dcc2"/>`+
      `<path d="M176 226 l 3 -8 l 4 8 M 196 226 l 3 -8 l 4 8" stroke="#e8dcc2" stroke-width="3.5" fill="none" stroke-linecap="round"/>`+
      `<path d="M96 196 C 66 214 56 244 62 266 L 118 266 C 122 240 118 216 108 200 Z" fill="url(#sl_b)"/>`+
      `<path d="M284 196 C 314 214 324 244 318 266 L 262 266 C 258 240 262 216 272 200 Z" fill="url(#sl_b)"/>`+
      `<path d="M62 266 C 52 274 46 284 46 292 M 78 268 C 74 280 74 290 76 296 M 96 268 C 96 280 98 290 102 296 M 114 266 C 118 278 122 286 128 292" stroke="#e8dcc2" stroke-width="7" fill="none" stroke-linecap="round"/>`+
      `<path d="M318 266 C 328 274 334 284 334 292 M 302 268 C 306 280 306 290 304 296 M 284 268 C 284 280 282 290 278 296 M 266 266 C 262 278 258 286 252 292" stroke="#e8dcc2" stroke-width="7" fill="none" stroke-linecap="round"/>`+close;
  }

  if (id==="procrast") {
    return open(`
      <radialGradient id="pr_c" cx="50%" cy="45%" r="60%"><stop offset="0%" stop-color="#d24a3a"/><stop offset="100%" stop-color="#7a1f1c"/></radialGradient>
      <linearGradient id="pr_g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffd98a"/><stop offset="100%" stop-color="#c9902e"/></linearGradient>`)+
      `<circle cx="190" cy="140" r="112" fill="none" stroke="#c9902e" stroke-width="5" opacity="0.35"/>`+
      Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;const x=190+Math.sin(a)*112,y=140-Math.cos(a)*112;return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="4" fill="#c9902e" opacity="0.5"/>`;}).join("")+
      `<ellipse cx="190" cy="272" rx="120" ry="16" fill="#000" opacity="0.35"/>`+
      `<path d="M130 250 Q 190 218 250 250 Q 226 268 190 266 Q 154 268 130 250 Z" fill="#8f2a22"/>`+
      `<path d="M150 250 C 140 190 158 150 190 148 C 222 150 240 190 230 250 Z" fill="url(#pr_c)"/>`+
      `<ellipse cx="190" cy="212" rx="26" ry="30" fill="#e8b06a" opacity="0.9"/>`+
      `<circle cx="190" cy="120" r="42" fill="url(#pr_c)"/>`+
      `<path d="M156 92 C 138 76 136 54 152 44 C 146 62 154 74 166 82 Z" fill="#5a1512"/>`+
      `<path d="M224 92 C 242 76 244 54 228 44 C 234 62 226 74 214 82 Z" fill="#5a1512"/>`+
      `<path d="M164 112 q 12 -8 24 0" stroke="#2a0c0a" stroke-width="5" fill="none" stroke-linecap="round"/>`+
      `<circle cx="172" cy="118" r="6" fill="#ffd98a"/><circle cx="208" cy="118" r="6" fill="#ffd98a"/>`+
      `<circle cx="172" cy="118" r="3" fill="#2a0c0a"/><circle cx="208" cy="118" r="3" fill="#2a0c0a"/>`+
      `<path d="M198 106 q 12 -8 22 -2" stroke="#2a0c0a" stroke-width="5" fill="none" stroke-linecap="round"/>`+
      `<path d="M168 138 Q 190 152 214 134" stroke="#2a0c0a" stroke-width="5" fill="none" stroke-linecap="round"/>`+
      `<path d="M206 139 l 2 8" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`+
      `<path d="M228 180 C 258 172 274 190 272 208" stroke="#8f2a22" stroke-width="18" fill="none" stroke-linecap="round"/>`+
      `<g transform="translate(272,208)">
        <rect x="-26" y="-4" width="52" height="8" rx="4" fill="#6b4a1c"/>
        <rect x="-26" y="56" width="52" height="8" rx="4" fill="#6b4a1c"/>
        <path d="M-20 4 L 20 4 L 4 30 L 20 56 L -20 56 L -4 30 Z" fill="#f7e9c8" opacity="0.35" stroke="#c9902e" stroke-width="3"/>
        <path d="M-14 8 L 14 8 L 1 28 L -1 28 Z" fill="url(#pr_g)"/>
        <path d="M-12 52 L 12 52 L 6 44 L -6 44 Z" fill="url(#pr_g)"/>
        <rect x="-1.5" y="28" width="3" height="16" fill="url(#pr_g)"/>
      </g>`+
      `<path d="M150 250 C 110 246 92 220 100 198" stroke="#8f2a22" stroke-width="12" fill="none" stroke-linecap="round"/>`+
      `<path d="M100 198 l -12 -4 l 10 -10 z" fill="#8f2a22"/>`+close;
  }

  if (id==="wraith") {
    return open(`
      <linearGradient id="wr_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#aeb8cf"/><stop offset="55%" stop-color="#5b6478"/><stop offset="100%" stop-color="#5b647800"/></linearGradient>
      <radialGradient id="wr_e" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#e8fbff"/><stop offset="45%" stop-color="#6fd0ff"/><stop offset="100%" stop-color="#1c4f8a"/></radialGradient>`)+
      `<ellipse cx="190" cy="280" rx="120" ry="10" fill="#000" opacity="0.3"/>`+
      `<path d="M92 96 l 10 5 l -7 9 z M 296 120 l -11 4 l 6 10 z M 300 60 l -9 7 l 10 5 z M 76 180 l 9 -6 l 3 11 z" fill="#7d9cc9" opacity="0.75"/>`+
      `<path d="M190 26 L 206 44 L 226 40 L 232 62 C 258 86 266 128 262 168 C 258 204 266 234 276 258 L 254 246 L 246 274 L 228 248 L 216 282 L 202 250 L 190 284 L 178 250 L 164 282 L 152 248 L 134 274 L 126 246 L 104 258 C 114 234 122 204 118 168 C 114 128 122 86 148 62 L 154 40 L 174 44 Z" fill="url(#wr_b)"/>`+
      `<path d="M154 44 C 132 66 122 100 122 134" stroke="#dfe9fb" stroke-width="3" fill="none" opacity="0.5"/>`+
      `<path d="M190 58 C 154 58 140 92 144 126 C 148 156 166 172 190 172 C 214 172 232 156 236 126 C 240 92 226 58 190 58 Z" fill="#0b0e16"/>`+
      `<path d="M152 118 L 184 106 L 184 122 L 154 128 Z" fill="url(#wr_e)"/>`+
      `<path d="M228 118 L 196 106 L 196 122 L 226 128 Z" fill="url(#wr_e)"/>`+
      `<path d="M160 118 L 178 111 M 220 118 L 202 111" stroke="#eafaff" stroke-width="3" stroke-linecap="round" opacity="0.9"/>`+
      `<path d="M172 148 l 8 6 l 8 -6 l 8 6 l 8 -6" stroke="#3c6ea8" stroke-width="3.5" fill="none" opacity="0.6" stroke-linecap="round"/>`+
      `<path d="M124 148 C 96 150 78 168 74 192 M 74 192 C 66 186 60 178 58 170 M 74 192 C 68 194 60 194 54 190 M 74 192 C 74 200 78 208 84 212" stroke="#8b98b4" stroke-width="9" fill="none" stroke-linecap="round"/>`+
      `<path d="M256 148 C 284 150 302 168 306 192 M 306 192 C 314 186 320 178 322 170 M 306 192 C 312 194 320 194 326 190 M 306 192 C 306 200 302 208 296 212" stroke="#8b98b4" stroke-width="9" fill="none" stroke-linecap="round"/>`+
      `<path d="M150 270 q -14 16 -34 18 M 230 270 q 14 16 34 18" stroke="#7d8aa8" stroke-width="5" fill="none" opacity="0.5" stroke-linecap="round"/>`+close;
  }

  if (id==="golem") {
    return open(`
      <linearGradient id="go_s" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#767b84"/><stop offset="100%" stop-color="#33363c"/></linearGradient>
      <linearGradient id="go_d" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#565b63"/><stop offset="100%" stop-color="#24262b"/></linearGradient>
      <linearGradient id="go_m" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffb64a"/><stop offset="100%" stop-color="#d43a12"/></linearGradient>
      <radialGradient id="go_e" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffd27a"/><stop offset="100%" stop-color="#c93a08"/></radialGradient>`)+
      `<ellipse cx="190" cy="276" rx="160" ry="16" fill="#000" opacity="0.45"/>`+
      `<path d="M58 268 C 50 232 62 204 88 198 C 112 194 126 212 126 238 L 122 268 Z" fill="url(#go_d)"/>`+
      `<path d="M322 268 C 330 232 318 204 292 198 C 268 194 254 212 254 238 L 258 268 Z" fill="url(#go_d)"/>`+
      `<path d="M70 238 l 40 -4 M 74 254 l 40 -2 M 310 238 l -40 -4 M 306 254 l -40 -2" stroke="#1b1d21" stroke-width="5" stroke-linecap="round"/>`+
      `<path d="M112 250 L 104 128 Q 104 98 138 92 L 242 92 Q 276 98 276 128 L 268 250 Z" fill="url(#go_s)"/>`+
      `<path d="M192 96 l -12 30 l 18 14 l -14 28 l 20 16 l -12 30" stroke="url(#go_m)" stroke-width="9" fill="none" stroke-linecap="round"/>`+
      `<path d="M192 96 l -12 30 l 18 14 l -14 28 l 20 16 l -12 30" stroke="#ffe9b0" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.85"/>`+
      `<path d="M180 126 l -26 -6 M 198 140 l 26 -10 M 184 168 l -30 4 M 204 184 l 28 8" stroke="url(#go_m)" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.9"/>`+
      `<path d="M136 122 l 12 8 M 250 148 l -14 6 M 130 200 l 16 2" stroke="#1b1d21" stroke-width="5" stroke-linecap="round"/>`+
      `<circle cx="96" cy="130" r="38" fill="url(#go_d)"/>`+
      `<circle cx="284" cy="130" r="38" fill="url(#go_d)"/>`+
      `<path d="M78 116 l 24 10 M 268 112 l 20 16" stroke="#1b1d21" stroke-width="5" stroke-linecap="round"/>`+
      `<path d="M150 96 L 152 46 Q 154 30 174 28 L 206 28 Q 226 30 228 46 L 230 96 Z" fill="url(#go_s)"/>`+
      `<path d="M146 52 L 234 52 L 230 70 L 150 70 Z" fill="#17181c"/>`+
      `<path d="M158 66 L 186 62 L 186 74 L 160 76 Z" fill="url(#go_e)"/>`+
      `<path d="M222 66 L 194 62 L 194 74 L 220 76 Z" fill="url(#go_e)"/>`+
      `<path d="M166 84 L 214 84 M 178 84 l -3 7 M 200 84 l 3 7" stroke="#17181c" stroke-width="5" stroke-linecap="round"/>`+
      `<ellipse cx="140" cy="98" rx="16" ry="6" fill="#4a5a2c" opacity="0.7"/>`+
      `<ellipse cx="252" cy="118" rx="11" ry="5" fill="#4a5a2c" opacity="0.6"/>`+close;
  }

  if (id==="hydra") {
    return open(`
      <linearGradient id="hy_g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2f8a5c"/><stop offset="100%" stop-color="#0f3d28"/></linearGradient>
      <linearGradient id="hy_p" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5f48b8"/><stop offset="100%" stop-color="#2a1c60"/></linearGradient>
      <linearGradient id="hy_o" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c86a1e"/><stop offset="100%" stop-color="#6e340c"/></linearGradient>
      <radialGradient id="hy_e" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffe98a"/><stop offset="100%" stop-color="#b8860a"/></radialGradient>`)+
      `<ellipse cx="190" cy="274" rx="145" ry="15" fill="#000" opacity="0.4"/>`+
      `<path d="M104 270 C 96 210 134 182 190 182 C 246 182 284 210 276 270 Z" fill="url(#hy_g)"/>`+
      `<path d="M128 200 l 8 -14 l 8 14 M 158 190 l 8 -15 l 8 15 M 206 190 l 8 -15 l 8 15 M 236 200 l 8 -14 l 8 14" fill="#0c2e1e"/>`+
      `<path d="M136 252 q 54 -18 108 0 M 146 234 q 44 -14 88 0" stroke="#8fd8b4" stroke-width="6" fill="none" opacity="0.35"/>`+
      `<path d="M152 194 C 116 168 98 128 110 92" stroke="url(#hy_g)" stroke-width="26" fill="none" stroke-linecap="round"/>`+
      `<g transform="translate(106,84) rotate(-24)">
        <path d="M-6 -14 l -7 -14 l 12 6 l 6 -12 l 6 11 z" fill="#0c2e1e"/>
        <path d="M-30 -6 C -34 -18 -18 -26 2 -24 C 22 -22 34 -12 32 -2 L -8 2 Z" fill="url(#hy_g)"/>
        <path d="M-30 8 C -34 20 -16 28 4 26 C 22 24 32 14 30 6 L -8 4 Z" fill="#1c5438"/>
        <path d="M-26 -2 l 7 8 M -14 -4 l 6 9 M -2 -5 l 5 10 M -24 6 l 6 -7 M -12 8 l 5 -8" stroke="#f2ead0" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M-30 2 L -52 -2 L -52 6 Z" fill="#c92f2f"/>
        <ellipse cx="14" cy="-12" rx="8" ry="6" fill="url(#hy_e)"/><path d="M14 -17 L 14 -7" stroke="#141005" stroke-width="3"/>
      </g>`+
      `<path d="M190 186 C 190 148 184 112 192 76" stroke="url(#hy_p)" stroke-width="28" fill="none" stroke-linecap="round"/>`+
      `<g transform="translate(194,64)">
        <path d="M-8 -22 l -6 -16 l 12 7 l 6 -14 l 6 13 l 12 -6 l -6 15 z" fill="#1c1244"/>
        <path d="M-32 -4 C -30 -20 -12 -28 6 -26 C 26 -24 38 -12 34 2 C 22 12 -20 12 -32 -4 Z" fill="url(#hy_p)"/>
        <path d="M-24 10 C -14 24 16 24 28 8 L 20 30 L 8 22 L -2 32 L -12 22 L -20 28 Z" fill="#3a2a80"/>
        <path d="M-16 12 l 5 10 M 0 14 l 3 11 M 14 12 l -3 10" stroke="#f2ead0" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="-12" cy="-10" rx="9" ry="7" fill="url(#hy_e)"/><path d="M-12 -16 L -12 -4" stroke="#141005" stroke-width="3.5"/>
        <ellipse cx="16" cy="-10" rx="9" ry="7" fill="url(#hy_e)"/><path d="M16 -16 L 16 -4" stroke="#141005" stroke-width="3.5"/>
        <path d="M-24 -16 l 14 4 M 28 -16 l -14 4" stroke="#150e38" stroke-width="4" stroke-linecap="round"/>
      </g>`+
      `<path d="M230 196 C 266 172 286 134 272 96" stroke="url(#hy_o)" stroke-width="26" fill="none" stroke-linecap="round"/>`+
      `<g transform="translate(276,88) rotate(22)">
        <path d="M6 -14 l 7 -14 l -12 6 l -6 -12 l -6 11 z" fill="#4a2408"/>
        <path d="M30 -6 C 34 -18 18 -26 -2 -24 C -22 -22 -34 -12 -32 -2 L 8 2 Z" fill="url(#hy_o)"/>
        <path d="M30 8 C 34 20 16 28 -4 26 C -22 24 -32 14 -30 6 L 8 4 Z" fill="#7a3c10"/>
        <path d="M26 -2 l -7 8 M 14 -4 l -6 9 M 2 -5 l -5 10 M 24 6 l -6 -7 M 12 8 l -5 -8" stroke="#f2ead0" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M30 2 L 52 -2 L 52 6 Z" fill="#c92f2f"/>
        <ellipse cx="-14" cy="-12" rx="8" ry="6" fill="url(#hy_e)"/><path d="M-14 -17 L -14 -7" stroke="#141005" stroke-width="3"/>
      </g>`+close;
  }

  if (id==="fiend") {
    return open(`
      <linearGradient id="fi_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5a2f8a"/><stop offset="100%" stop-color="#241040"/></linearGradient>`)+
      `<ellipse cx="190" cy="272" rx="130" ry="16" fill="#000" opacity="0.35"/>`+
      `<path d="M190 60 L 226 84 L 262 76 L 252 116 L 286 142 L 250 158 L 268 206 L 226 198 L 224 252 L 190 226 L 156 252 L 154 198 L 112 206 L 130 158 L 94 142 L 128 116 L 118 76 L 154 84 Z" fill="url(#fi_b)"/>`+
      `<path d="M162 70 C 148 44 152 24 170 14 C 164 36 170 52 180 62 Z" fill="#180a2e"/>`+
      `<path d="M216 68 C 236 52 240 30 228 18 C 232 40 224 54 212 62 Z" fill="#180a2e"/>`+
      `<path d="M234 60 C 250 52 256 40 252 30 C 252 44 244 52 236 56 Z" fill="#180a2e"/>`+
      `<circle cx="168" cy="118" r="15" fill="#ff5a3c"/><circle cx="168" cy="118" r="7" fill="#ffe08a"/>`+
      `<circle cx="216" cy="112" r="9" fill="#ff5a3c"/><circle cx="216" cy="112" r="4" fill="#ffe08a"/>`+
      `<path d="M156 152 L 172 162 L 184 150 L 198 164 L 212 148 L 226 158" stroke="#ffe08a" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`+
      `<path d="M150 190 l 12 -10 l -4 14 l 14 -6" stroke="#c084fc" stroke-width="4" fill="none" stroke-linecap="round"/>`+
      `<path d="M228 184 l -10 -12 l 14 2 l -6 -14" stroke="#c084fc" stroke-width="4" fill="none" stroke-linecap="round"/>`+
      `<path d="M186 78 l 6 12 l -10 2 l 8 12" stroke="#c084fc" stroke-width="4" fill="none" stroke-linecap="round"/>`+
      `<path d="M96 96 l 10 6 l -8 8 z" fill="#7a5fd0" opacity="0.8"/>`+
      `<path d="M292 108 l -10 4 l 6 10 z" fill="#7a5fd0" opacity="0.8"/>`+
      `<path d="M280 220 l 10 4 l -6 10 z" fill="#7a5fd0" opacity="0.7"/>`+
      `<path d="M92 214 l -8 8 l 12 4 z" fill="#7a5fd0" opacity="0.7"/>`+close;
  }

  if (id==="fog") {
    return open(`
      <linearGradient id="fo_a" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6e7d68"/><stop offset="100%" stop-color="#39443a"/></linearGradient>
      <linearGradient id="fo_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8a9a80"/><stop offset="100%" stop-color="#525f4e"/></linearGradient>
      <radialGradient id="fo_e" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#f4ffdf"/><stop offset="100%" stop-color="#9fc060"/></radialGradient>`)+
      `<ellipse cx="190" cy="272" rx="150" ry="12" fill="#000" opacity="0.3"/>`+
      `<path d="M96 224 C 62 232 44 224 34 206 M 34 206 C 30 214 32 224 38 230 M 34 206 C 26 206 20 202 16 196" stroke="#5d6c58" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.85"/>`+
      `<path d="M286 216 C 320 224 340 214 348 196 M 348 196 C 354 202 356 212 352 220 M 348 196 C 356 194 362 188 364 182" stroke="#5d6c58" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.85"/>`+
      `<path d="M150 254 C 142 268 128 276 112 276 M 236 252 C 246 266 260 274 276 272" stroke="#5d6c58" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.7"/>`+
      `<path d="M64 226 C 44 192 74 160 108 168 C 100 132 148 106 182 126 C 196 92 260 96 268 136 C 310 128 336 172 310 200 C 330 224 302 254 272 244 C 262 266 216 270 200 252 C 180 270 138 266 128 246 C 96 258 68 250 64 226 Z" fill="url(#fo_a)"/>`+
      `<path d="M104 234 C 88 208 110 186 136 194 C 132 164 172 148 196 166 C 208 142 254 148 256 178 C 288 174 304 208 280 226 C 292 244 268 260 246 252 C 236 266 202 268 192 254 C 176 268 142 264 136 248 C 118 256 104 250 104 234 Z" fill="url(#fo_b)"/>`+
      `<g>
        <path d="M138 208 a 15 15 0 0 1 30 0 z" fill="#141a12"/>
        <ellipse cx="153" cy="206" rx="9" ry="5" fill="url(#fo_e)"/><circle cx="153" cy="206" r="2.5" fill="#101408"/>
        <path d="M134 200 L 170 194" stroke="#141a12" stroke-width="6" stroke-linecap="round"/>
      </g>`+
      `<g>
        <path d="M196 196 a 19 19 0 0 1 38 0 z" fill="#141a12"/>
        <ellipse cx="215" cy="193" rx="12" ry="7" fill="url(#fo_e)"/><circle cx="215" cy="193" r="3.5" fill="#101408"/>
        <path d="M192 186 L 240 182" stroke="#141a12" stroke-width="7" stroke-linecap="round"/>
      </g>`+
      `<g>
        <path d="M252 220 a 11 11 0 0 1 22 0 z" fill="#141a12"/>
        <ellipse cx="263" cy="219" rx="7" ry="4" fill="url(#fo_e)"/><circle cx="263" cy="219" r="2" fill="#101408"/>
        <path d="M249 214 L 276 210" stroke="#141a12" stroke-width="5" stroke-linecap="round"/>
      </g>`+
      `<circle cx="176" cy="232" r="5" fill="url(#fo_e)" opacity="0.9"/><circle cx="176" cy="232" r="1.8" fill="#101408"/>`+
      `<circle cx="238" cy="240" r="4" fill="url(#fo_e)" opacity="0.8"/><circle cx="238" cy="240" r="1.5" fill="#101408"/>`+
      `<path d="M158 248 L 172 242 L 184 250 L 198 242 L 210 250 L 224 244 L 218 256 L 202 252 L 190 258 L 176 252 L 164 256 Z" fill="#10150f"/>`+close;
  }

  if (id==="snooze") {
    return open(`
      <linearGradient id="sn_r" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5c3f9e"/><stop offset="100%" stop-color="#2a1a54"/></linearGradient>
      <linearGradient id="sn_p" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4a3d6e"/><stop offset="100%" stop-color="#241c3c"/></linearGradient>
      <linearGradient id="sn_g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffd76b"/><stop offset="100%" stop-color="#a8741c"/></linearGradient>`)+
      `<ellipse cx="190" cy="276" rx="148" ry="14" fill="#000" opacity="0.4"/>`+
      `<path d="M66 268 Q 56 222 100 216 L 280 216 Q 324 222 314 268 Q 252 256 190 260 Q 128 256 66 268 Z" fill="url(#sn_p)"/>`+
      `<path d="M72 260 l -16 10 M 308 260 l 16 10 M 84 224 l -14 -12 M 296 224 l 14 -12" stroke="#171129" stroke-width="6" stroke-linecap="round"/>`+
      `<path d="M118 232 C 106 158 140 118 190 118 C 240 118 274 158 262 232 C 240 248 140 248 118 232 Z" fill="url(#sn_r)"/>`+
      `<path d="M126 218 Q 190 198 254 218" stroke="#1c1238" stroke-width="9" fill="none" opacity="0.7"/>`+
      `<path d="M132 226 Q 190 208 248 226" stroke="#cbb2e8" stroke-width="5" fill="none" opacity="0.4"/>`+
      `<path d="M128 216 C 108 224 100 238 102 250 M 102 250 l -8 8 M 110 252 l -4 10 M 118 252 l 0 11" stroke="url(#sn_r)" stroke-width="12" fill="none" stroke-linecap="round"/>`+
      `<path d="M94 258 l -6 7 M 106 262 l -3 8 M 118 263 l 1 8" stroke="#d8cbb2" stroke-width="4.5" stroke-linecap="round"/>`+
      `<path d="M252 216 C 272 222 282 234 282 246" stroke="url(#sn_r)" stroke-width="12" fill="none" stroke-linecap="round"/>`+
      `<rect x="278" y="140" width="8" height="112" rx="4" fill="#6b4a1c"/>`+
      `<path d="M282 138 C 306 130 318 108 310 88 C 312 108 300 122 282 126 Z" fill="url(#sn_g)"/>`+
      `<circle cx="282" cy="134" r="7" fill="url(#sn_g)"/>`+
      `<path d="M148 128 C 144 88 162 66 190 66 C 218 66 236 88 232 128 C 222 144 158 144 148 128 Z" fill="#d8b287"/>`+
      `<path d="M150 130 Q 162 142 178 142 M 230 130 Q 218 142 202 142" stroke="#b28a5c" stroke-width="4" fill="none" opacity="0.8"/>`+
      `<path d="M156 96 L 184 106 M 224 96 L 196 106" stroke="#3a2410" stroke-width="7" stroke-linecap="round"/>`+
      `<path d="M162 112 Q 172 118 182 112 M 198 112 Q 208 118 218 112" stroke="#3a2410" stroke-width="4.5" fill="none" stroke-linecap="round"/>`+
      `<path d="M170 128 Q 190 118 210 128" stroke="#3a2410" stroke-width="5" fill="none" stroke-linecap="round"/>`+
      `<path d="M150 70 L 156 34 L 170 56 L 184 26 L 198 56 L 212 30 L 224 56 L 230 70 Z" fill="url(#sn_g)"/>`+
      `<rect x="148" y="66" width="84" height="11" rx="4" fill="url(#sn_g)"/>`+
      `<circle cx="190" cy="72" r="4.5" fill="#c01f1f"/>`+
      `<path d="M258 88 l 22 0 l -22 18 l 22 0" stroke="#8f7ac9" stroke-width="6" fill="none" stroke-linejoin="miter"/>`+
      `<path d="M292 62 l 15 0 l -15 13 l 15 0" stroke="#8f7ac9" stroke-width="4.5" fill="none" opacity="0.75"/>`+
      `<path d="M314 42 l 10 0 l -10 9 l 10 0" stroke="#8f7ac9" stroke-width="3.5" fill="none" opacity="0.55"/>`+close;
  }
  return open("")+`<circle cx="190" cy="150" r="60" fill="#666"/>`+close;
}

function BossArt({ id, style }) {
  return <div style={{lineHeight:0, ...style}} dangerouslySetInnerHTML={{__html: bossArtSVG(id)}}/>;
}

// ── WEEKLY BOSS (deterministic per week; every completion deals damage) ──────
const BOSSES = [
  { id:"sloth",    name:"Sloth Behemoth",     icon:"🦥", desc:"A mountain of fur that grows heavier every hour you wait. It feeds on \u201Clater.\u201D" },
  { id:"procrast", name:"The Procrastinator", icon:"👹", desc:"He flips his hourglass and whispers \u201Ctomorrow.\u201D Every finished quest cracks the glass a little more." },
  { id:"wraith",   name:"Doubt Wraith",       icon:"👻", desc:"It repeats your worst questions back in your own voice. Action is the one light it cannot survive." },
  { id:"golem",    name:"Inertia Golem",      icon:"🗿", desc:"Stone carved from abandoned plans. It only moves when you don\u2019t." },
  { id:"hydra",    name:"Distraction Hydra",  icon:"🐉", desc:"Cut off one head and three notifications grow back. Only focused strikes land." },
  { id:"fiend",    name:"Chaos Fiend",        icon:"😈", desc:"It thrives in the mess. Unplanned days are its playground \u2014 order is poison to it." },
  { id:"fog",      name:"Fog of Excuses",     icon:"🌫️", desc:"A haze of perfectly reasonable excuses. Every completion burns a hole in it." },
  { id:"snooze",   name:"The Snooze King",    icon:"👑", desc:"He rules from a pillow throne and calls it rest. Every rep you log is treason." },
];
function roman(n){const R=[[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];let o="";for(const[v,c]of R){while(n>=v){o+=c;n-=v;}}return o||"I";}
// Strict rotation: every boss appears once before any repeats (index = week number mod roster)
function bossWeekIndex(wkStart){ return Math.floor(Math.round(Date.parse(wkStart+"T00:00:00")/86400000)/7); }
const bossAt = (wkStart) => BOSSES[((bossWeekIndex(wkStart) % BOSSES.length) + BOSSES.length) % BOSSES.length];
// How many times this boss was slain BEFORE the given week → its generation number
function bossGen(d, id, beforeWk){ return Object.entries(d.bossClaims||{}).filter(([wk,v])=>v===id && wk<beforeWk).length + 1; }
function nextBosses(d, fromDay, n){
  const out=[]; const cur=new Date(weekKeysFor(fromDay)[0]+"T00:00:00");
  for(let k=1;k<=n;k++){ const m=new Date(cur); m.setDate(m.getDate()+7*k); const wk=dateKey(m);
    const b=bossAt(wk); const g=bossGen(d,b.id,wk);
    out.push({...b, wkStart:wk, title: g>1?`${b.name} ${roman(g)}`:b.name, when:`WEEK OF ${MONTHS[m.getMonth()].slice(0,3).toUpperCase()} ${m.getDate()}`});
  } return out;
}
function nextAppearance(d, fromDay, id){
  const cur=new Date(weekKeysFor(fromDay)[0]+"T00:00:00");
  for(let k=1;k<=BOSSES.length;k++){ const m=new Date(cur); m.setDate(m.getDate()+7*k);
    if (bossAt(dateKey(m)).id===id) return `${MONTHS[m.getMonth()].slice(0,3).toUpperCase()} ${m.getDate()}`; }
  return "";
}
function bossForWeek(d, anyDay) {
  const wk = weekKeysFor(anyDay);
  const wkStart = wk[0];
  const b = bossAt(wkStart);
  let E = 0;
  (d.tasks||[]).forEach(t=>{
    if (!t.catId) return;
    if (isWeekly(t)) E += weeklyTargetOf(t);
    else wk.forEach(dk=>{ if (isScheduledOn(t,dk)) E++; });
  });
  if (E === 0) return null;
  const hp = Math.max(5, Math.round(E * 0.6));
  let dmg = 0;
  const todayK = dateKey();
  (d.tasks||[]).forEach(t=>{
    if (!t.catId) return;
    if (isWeekly(t)) dmg += weeklyDone(t, wkStart);
    else wk.forEach(dk=>{ if (dk<=todayK && isScheduledOn(t,dk) && isCompletedOn(t,dk)) dmg++; });
  });
  const gen = bossGen(d, b.id, wkStart);
  const xp = Math.min(0.5, 0.12 + hp*0.008);   // "significant" — boosts EVERY stat on a kill
  return { ...b, wkStart, gen, title: gen>1 ? `${b.name} ${roman(gen)}` : b.name,
    hp, dmg: Math.min(dmg, hp), gems: Math.max(15, Math.round(hp*1.2)), xp };
}

// ── TROPHIES (permanent achievements; claim once for gems) ───────────────────
const TROPHIES = [
  { id:"first_blood", icon:"⚔", name:"First Blood", desc:"Complete your first quest", gems:5,
    check:(d)=>(d.tasks||[]).some(t=>totalCompletions(t)>0) },
  { id:"streak_7", icon:"🔥", name:"On Fire", desc:"Hold a 7-day streak on any quest", gems:15,
    check:(d)=>(d.tasks||[]).some(t=>!isWeekly(t)&&getStreak(t)>=7) },
  { id:"streak_30", icon:"☄️", name:"Unbreakable", desc:"Hold a 30-day streak on any quest", gems:40,
    check:(d)=>(d.tasks||[]).some(t=>!isWeekly(t)&&getStreak(t)>=30) },
  { id:"century", icon:"💯", name:"Century", desc:"100 total completions", gems:20,
    check:(d)=>(d.tasks||[]).reduce((a,t)=>a+totalCompletions(t),0)>=100 },
  { id:"relentless", icon:"🏛", name:"Relentless", desc:"500 total completions", gems:50,
    check:(d)=>(d.tasks||[]).reduce((a,t)=>a+totalCompletions(t),0)>=500 },
  { id:"clean_sweep", icon:"📅", name:"Clean Sweep", desc:"Meet every weekly target in one week", gems:15,
    check:(d)=>{ const w=(d.tasks||[]).filter(t=>t.catId&&isWeekly(t)); return w.length>0 && w.every(t=>weeklyMet(t, dateKey())); } },
  { id:"knighted", icon:"🛡", name:"Knighted", desc:"Reach level 7", gems:25,
    check:(d)=>getLevel(getRating(d.categories||[]))>=7 },
  { id:"war_chest", icon:"🪙", name:"War Chest", desc:"Earn 1,000 lifetime coins", gems:20,
    check:(d)=>(d.wallet?.coinsEarned||0)>=1000 },
  { id:"gem_hoard", icon:"💎", name:"Gem Hoard", desc:"Earn 100 lifetime gems", gems:25,
    check:(d)=>(d.wallet?.gemsEarned||0)>=100 },
  { id:"tactician", icon:"🗓", name:"Tactician", desc:"Schedule 10 time blocks on the Plan page", gems:10,
    check:(d)=>Object.values(d.schedule||{}).reduce((a,l)=>a+(l?.length||0),0)>=10 },
  { id:"chain_lightning", icon:"⚡", name:"Chain Lightning", desc:"Hit a x2 coin combo", gems:15,
    check:(d)=>(d.flags?.maxCombo||1)>=3 },
];

// Last 7 day keys ending today (HabitKit grid)
function last7Keys() {
  const out = [];
  const cur = new Date();
  for (let i=6;i>=0;i--) { const d=new Date(cur); d.setDate(cur.getDate()-i); out.push(dateKey(d)); }
  return out;
}

// ── COLOR HELPERS ─────────────────────────────────────────────────────────────
function shade(hex, p) {
  try {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + p, g = ((n >> 8) & 255) + p, b = (n & 255) + p;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `rgb(${r},${g},${b})`;
  } catch { return hex; }
}

// ── PET ART (little rounded creatures, drawn in the champion's pixel style) ───
// Renders at roughly 7x7 units centered on (cx,cy) in the 24-unit grid.
function drawPet(els, art, color, cx, cy, s, nk) {
  const R = (x,y,w,h,fill,rx) => els.push(<rect key={nk()} x={x*s} y={y*s} width={w*s} height={h*s} fill={fill} rx={(rx!==undefined?rx:0.3)*s}/>);
  const C = (x,y,r,fill) => els.push(<circle key={nk()} cx={x*s} cy={y*s} r={r*s} fill={fill}/>);
  const dark = shade(color,-40), light = shade(color,40);
  const eyeW = "#ffffff", eyeB = "#16131f";
  // shadow
  els.push(<ellipse key={nk()} cx={cx*s} cy={(cy+2.6)*s} rx={2.4*s} ry={0.6*s} fill="#000" opacity="0.25"/>);
  if (art==="slime") {
    R(cx-2.2,cy-1.4,4.4,3.8,color,1.8);
    R(cx-2.2,cy+0.6,4.4,1.8,dark,1.2);
    C(cx-0.9,cy-0.1,0.45,eyeB); C(cx+0.9,cy-0.1,0.45,eyeB);
    C(cx-0.7,cy-0.2,0.16,eyeW); C(cx+1.1,cy-0.2,0.16,eyeW);
    R(cx-2,cy-1.5,4,1,light,1);
  } else if (art==="cat") {
    R(cx-2,cy-1.2,4,3.4,color,1.4);            // body
    els.push(<polygon key={nk()} points={`${(cx-2)*s},${(cy-1.4)*s} ${(cx-1.1)*s},${(cy-2.6)*s} ${(cx-0.4)*s},${(cy-1.2)*s}`} fill={color}/>);
    els.push(<polygon key={nk()} points={`${(cx+2)*s},${(cy-1.4)*s} ${(cx+1.1)*s},${(cy-2.6)*s} ${(cx+0.4)*s},${(cy-1.2)*s}`} fill={color}/>);
    C(cx-0.8,cy-0.1,0.4,eyeW); C(cx+0.8,cy-0.1,0.4,eyeW);
    C(cx-0.8,cy-0.1,0.2,eyeB); C(cx+0.8,cy-0.1,0.2,eyeB);
    R(cx+2,cy-0.4,1.6,0.5,color,0.3);          // tail
  } else if (art==="dog") {
    R(cx-2,cy-1.2,4,3.4,color,1.3);
    R(cx-2.4,cy-1.4,1.2,2.4,dark,0.7);         // floppy ear
    R(cx+1.2,cy-1.4,1.2,2.4,dark,0.7);
    C(cx-0.8,cy-0.2,0.35,eyeB); C(cx+0.8,cy-0.2,0.35,eyeB);
    C(cx,cy+0.7,0.45,dark);                    // nose
  } else if (art==="owl") {
    R(cx-2,cy-1.6,4,4,color,1.6);
    C(cx-0.9,cy-0.6,0.85,eyeW); C(cx+0.9,cy-0.6,0.85,eyeW);
    C(cx-0.9,cy-0.6,0.4,eyeB); C(cx+0.9,cy-0.6,0.4,eyeB);
    els.push(<polygon key={nk()} points={`${(cx-0.35)*s},${(cy)*s} ${(cx+0.35)*s},${(cy)*s} ${cx*s},${(cy+0.8)*s}`} fill="#f59e0b"/>);
    els.push(<polygon key={nk()} points={`${(cx-2)*s},${(cy-1.7)*s} ${(cx-1.2)*s},${(cy-2.6)*s} ${(cx-0.9)*s},${(cy-1.5)*s}`} fill={dark}/>);
    els.push(<polygon key={nk()} points={`${(cx+2)*s},${(cy-1.7)*s} ${(cx+1.2)*s},${(cy-2.6)*s} ${(cx+0.9)*s},${(cy-1.5)*s}`} fill={dark}/>);
  } else if (art==="fox") {
    R(cx-2,cy-1,4,3.2,color,1.3);
    els.push(<polygon key={nk()} points={`${(cx-2)*s},${(cy-1.2)*s} ${(cx-1.2)*s},${(cy-2.8)*s} ${(cx-0.3)*s},${(cy-1)*s}`} fill={color}/>);
    els.push(<polygon key={nk()} points={`${(cx+2)*s},${(cy-1.2)*s} ${(cx+1.2)*s},${(cy-2.8)*s} ${(cx+0.3)*s},${(cy-1)*s}`} fill={color}/>);
    els.push(<polygon key={nk()} points={`${(cx-2)*s},${(cy-1.2)*s} ${(cx-1.5)*s},${(cy-2.2)*s} ${(cx-0.9)*s},${(cy-1.1)*s}`} fill={dark}/>);
    els.push(<polygon key={nk()} points={`${(cx+2)*s},${(cy-1.2)*s} ${(cx+1.5)*s},${(cy-2.2)*s} ${(cx+0.9)*s},${(cy-1.1)*s}`} fill={dark}/>);
    R(cx-1.6,cy+0.4,3.2,1.8,light,1);          // white snout/belly
    C(cx-0.8,cy-0.1,0.3,eyeB); C(cx+0.8,cy-0.1,0.3,eyeB);
    els.push(<polygon key={nk()} points={`${(cx+2)*s},${cy*s} ${(cx+3.4)*s},${(cy-0.6)*s} ${(cx+3.4)*s},${(cy+0.8)*s}`} fill={color}/>);
    C(cx+3.3,cy+0.2,0.4,light);                // tail tip
  } else if (art==="wolf") {
    R(cx-2.2,cy-1.1,4.4,3.4,color,1.2);
    els.push(<polygon key={nk()} points={`${(cx-2.2)*s},${(cy-1.3)*s} ${(cx-1.4)*s},${(cy-2.8)*s} ${(cx-0.5)*s},${(cy-1.1)*s}`} fill={color}/>);
    els.push(<polygon key={nk()} points={`${(cx+2.2)*s},${(cy-1.3)*s} ${(cx+1.4)*s},${(cy-2.8)*s} ${(cx+0.5)*s},${(cy-1.1)*s}`} fill={color}/>);
    R(cx-1.6,cy+0.3,3.2,1.9,light,1);
    C(cx-0.85,cy-0.1,0.32,"#fbbf24"); C(cx+0.85,cy-0.1,0.32,"#fbbf24");
    C(cx-0.85,cy-0.1,0.15,eyeB); C(cx+0.85,cy-0.1,0.15,eyeB);
    C(cx,cy+0.9,0.35,eyeB);
  } else if (art==="dragon") {
    R(cx-2,cy-1.2,4,3.4,color,1.3);
    els.push(<polygon key={nk()} points={`${(cx-1.2)*s},${(cy-1.2)*s} ${(cx-0.6)*s},${(cy-2.6)*s} ${cx*s},${(cy-1.2)*s}`} fill={dark}/>);
    els.push(<polygon key={nk()} points={`${cx*s},${(cy-1.2)*s} ${(cx+0.6)*s},${(cy-2.6)*s} ${(cx+1.2)*s},${(cy-1.2)*s}`} fill={dark}/>);
    R(cx-1.6,cy+0.4,3.2,1.8,light,1);
    C(cx-0.8,cy-0.2,0.34,eyeB); C(cx+0.8,cy-0.2,0.34,eyeB);
    els.push(<polygon key={nk()} points={`${(cx-2)*s},${cy*s} ${(cx-3.6)*s},${(cy-1.4)*s} ${(cx-2.2)*s},${(cy+1)*s}`} fill={shade(color,20)}/>); // wing
  } else if (art==="stag") {
    // body
    R(cx-1.8,cy-0.8,3.6,3,color,1.2);
    R(cx-1.4,cy+0.6,2.8,1.7,light,1);
    // antlers
    els.push(<polygon key={nk()} points={`${(cx-1.1)*s},${(cy-0.8)*s} ${(cx-1.9)*s},${(cy-2.9)*s} ${(cx-1.3)*s},${(cy-0.9)*s}`} fill={dark}/>);
    els.push(<polygon key={nk()} points={`${(cx-1.7)*s},${(cy-2)*s} ${(cx-2.7)*s},${(cy-2.4)*s} ${(cx-1.6)*s},${(cy-1.6)*s}`} fill={dark}/>);
    els.push(<polygon key={nk()} points={`${(cx+1.1)*s},${(cy-0.8)*s} ${(cx+1.9)*s},${(cy-2.9)*s} ${(cx+1.3)*s},${(cy-0.9)*s}`} fill={dark}/>);
    els.push(<polygon key={nk()} points={`${(cx+1.7)*s},${(cy-2)*s} ${(cx+2.7)*s},${(cy-2.4)*s} ${(cx+1.6)*s},${(cy-1.6)*s}`} fill={dark}/>);
    // ears
    els.push(<polygon key={nk()} points={`${(cx-1.8)*s},${(cy-0.9)*s} ${(cx-2.4)*s},${(cy-1.4)*s} ${(cx-1.3)*s},${(cy-0.4)*s}`} fill={color}/>);
    els.push(<polygon key={nk()} points={`${(cx+1.8)*s},${(cy-0.9)*s} ${(cx+2.4)*s},${(cy-1.4)*s} ${(cx+1.3)*s},${(cy-0.4)*s}`} fill={color}/>);
    C(cx-0.75,cy-0.1,0.3,eyeB); C(cx+0.75,cy-0.1,0.3,eyeB);
    C(cx,cy+0.95,0.32,eyeB);
    els.push(<circle key={nk()} cx={cx*s} cy={(cy-0.2)*s} r={3.4*s} fill={color} opacity="0.12"/>);
  } else if (art==="griffin") {
    els.push(<circle key={nk()} cx={cx*s} cy={cy*s} r={3*s} fill={color} opacity="0.16"/>);
    // body
    R(cx-1.7,cy-0.9,3.4,3,color,1.2);
    R(cx-1.4,cy+0.5,2.8,1.8,shade(color,30),1);   // golden chest
    // wings
    els.push(<polygon key={nk()} points={`${(cx-1.7)*s},${(cy-0.4)*s} ${(cx-3.6)*s},${(cy-1.8)*s} ${(cx-3.4)*s},${(cy+1)*s}`} fill={shade(color,-15)}/>);
    els.push(<polygon key={nk()} points={`${(cx+1.7)*s},${(cy-0.4)*s} ${(cx+3.6)*s},${(cy-1.8)*s} ${(cx+3.4)*s},${(cy+1)*s}`} fill={shade(color,-15)}/>);
    // ears/tufts
    els.push(<polygon key={nk()} points={`${(cx-1.4)*s},${(cy-0.9)*s} ${(cx-1.7)*s},${(cy-2.2)*s} ${(cx-0.8)*s},${(cy-1)*s}`} fill={dark}/>);
    els.push(<polygon key={nk()} points={`${(cx+1.4)*s},${(cy-0.9)*s} ${(cx+1.7)*s},${(cy-2.2)*s} ${(cx+0.8)*s},${(cy-1)*s}`} fill={dark}/>);
    // beak
    els.push(<polygon key={nk()} points={`${(cx-0.4)*s},${cy*s} ${(cx+0.4)*s},${cy*s} ${cx*s},${(cy+0.9)*s}`} fill="#f59e0b"/>);
    C(cx-0.7,cy-0.3,0.3,eyeB); C(cx+0.7,cy-0.3,0.3,eyeB);
  } else if (art==="phoenix") {
    els.push(<circle key={nk()} cx={cx*s} cy={cy*s} r={2.8*s} fill="#f97316" opacity="0.25"/>);
    R(cx-1.6,cy-1,3.2,3,color,1.3);
    els.push(<polygon key={nk()} points={`${(cx-1.6)*s},${cy*s} ${(cx-3.4)*s},${(cy-1.6)*s} ${(cx-1.4)*s},${(cy-1.4)*s}`} fill="#fbbf24"/>);
    els.push(<polygon key={nk()} points={`${(cx+1.6)*s},${cy*s} ${(cx+3.4)*s},${(cy-1.6)*s} ${(cx+1.4)*s},${(cy-1.4)*s}`} fill="#fbbf24"/>);
    els.push(<polygon key={nk()} points={`${(cx-0.6)*s},${(cy-1)*s} ${cx*s},${(cy-2.8)*s} ${(cx+0.6)*s},${(cy-1)*s}`} fill="#fde047"/>);
    C(cx-0.7,cy-0.1,0.3,eyeB); C(cx+0.7,cy-0.1,0.3,eyeB);
    els.push(<polygon key={nk()} points={`${(cx-0.3)*s},${(cy+0.4)*s} ${(cx+0.3)*s},${(cy+0.4)*s} ${cx*s},${(cy+1)*s}`} fill="#f59e0b"/>);
  }
}


function PixelCharacter({ level, character, scale=7, previewAllGear=false, idle=false, cosmetics=null, pet=null }) {
  const cz = character || DEFAULT_CHARACTER;
  const eq = previewAllGear ? DEFAULT_EQUIPPED : (cz.equipped || DEFAULT_EQUIPPED);
  const s = scale;
  const W = 24, H = 24;
  const has = (slot, lvlNeeded) => level >= lvlNeeded && eq[slot] !== false;
  const els = [];
  let k = 0;
  const R = (x,y,w,h,fill,rx) => els.push(
    <rect key={k++} x={x*s} y={y*s} width={w*s} height={h*s} fill={fill} rx={(rx!==undefined?rx:0.35)*s} />
  );

  const skin = cz.skin, hair = cz.hair;
  const shirt = cz.shirt, pants = cz.pants;

  // ── Purchased cosmetics (from the shop) ──
  const cos = cosmetics || {};
  const cosItem = (type) => SHOP.find(it=>it.id===cos[type]);
  const auraC = cosItem("aura"), capeC = cosItem("cape"), weaponC = cosItem("weapon");
  const auraColor = (auraC && auraC.color) || "#f5b827";

  // Cosmetic aura (drawn behind everything) — shape determined by purchase
  if (auraC) {
    const shape = auraC.auraShape;
    if (shape === "saiyan") {
      // upward flame licks + glow
      els.push(<circle key={k++} cx={12*s} cy={12*s} r={11*s} fill={auraColor} opacity="0.18" />);
      els.push(<path key={k++} d={`M ${5*s} ${20*s} Q ${3*s} ${10*s} ${7*s} ${4*s} Q ${7*s} ${11*s} ${9*s} ${9*s} Q ${8*s} ${3*s} ${12*s} ${0.5*s} Q ${16*s} ${3*s} ${15*s} ${9*s} Q ${17*s} ${11*s} ${17*s} ${4*s} Q ${21*s} ${10*s} ${19*s} ${20*s} Z`} fill={auraColor} opacity="0.55" style={{animation: idle?"breathe 1.4s ease-in-out infinite":"none"}}/>);
      els.push(<path key={k++} d={`M ${7*s} ${20*s} Q ${6*s} ${12*s} ${9*s} ${7*s} Q ${10*s} ${12*s} ${12*s} ${9*s} Q ${14*s} ${12*s} ${15*s} ${7*s} Q ${18*s} ${12*s} ${17*s} ${20*s} Z`} fill={shade(auraColor,60)} opacity="0.6"/>);
    } else if (shape === "cloud") {
      // Dark Omen — a brooding storm mass with a jagged underside + inner shadow + lightning glow
      const dk = shade(auraColor,-45), mid = shade(auraColor,-10), lt = shade(auraColor,35);
      els.push(<circle key={k++} cx={12*s} cy={9*s} r={12*s} fill={auraColor} opacity="0.13"/>);
      // billowing top lobes
      [[6.5,6,3.4],[10,4.3,4.2],[14.5,4.6,4],[17.6,7,3.2],[8.8,7.2,3.6],[13.2,7.4,3.8]].forEach(([x,y,r])=>
        els.push(<circle key={k++} cx={x*s} cy={y*s} r={r*s} fill={mid} opacity="0.6"/>));
      // dark underbelly
      els.push(<path key={k++} d={`M ${4*s} ${9*s} Q ${6*s} ${12.5*s} ${8*s} ${9.5*s} Q ${10*s} ${13*s} ${12*s} ${9.5*s} Q ${14*s} ${13*s} ${16*s} ${9.5*s} Q ${18*s} ${12.5*s} ${20*s} ${9*s} L ${20*s} ${6*s} L ${4*s} ${6*s} Z`} fill={dk} opacity="0.7"/>);
      // top highlight
      els.push(<circle key={k++} cx={10*s} cy={4.3*s} r={2.2*s} fill={lt} opacity="0.5"/>);
      // lightning flicker beneath
      els.push(<polyline key={k++} points={`${12*s},${9*s} ${10.6*s},${13*s} ${12.4*s},${13*s} ${10.8*s},${17*s}`} fill="none" stroke={shade(auraColor,80)} strokeWidth={0.5*s} opacity="0.8" style={{animation: idle?"sparkle 1.1s ease-in-out infinite":"none"}}/>);
    } else if (shape === "electric") {
      // Static Storm — radiating lightning bolts around an energized core
      els.push(<circle key={k++} cx={12*s} cy={12*s} r={12*s} fill={auraColor} opacity="0.12"/>);
      els.push(<circle key={k++} cx={12*s} cy={11*s} r={4*s} fill={auraColor} opacity="0.22" style={{animation: idle?"sparkle 0.9s ease-in-out infinite":"none"}}/>);
      const bolt = (deg) => {
        const a = deg*Math.PI/180, c=Math.cos(a), sn=Math.sin(a);
        const px=(r)=>(12+r*c)*s, py=(r)=>(11+r*sn)*s;
        // zig-zag bolt from r=4 out to r=12, kinked at the midpoint perpendicular
        const perpc = Math.cos(a+Math.PI/2), perps = Math.sin(a+Math.PI/2);
        const mx = (12 + 8*c + 1.6*perpc)*s, my = (11 + 8*sn + 1.6*perps)*s;
        return `${px(4)},${py(4)} ${mx},${my} ${px(12)},${py(12)}`;
      };
      [25,90,160,210,300,340].forEach(deg=>
        els.push(<polyline key={k++} points={bolt(deg)} fill="none" stroke={shade(auraColor,85)} strokeWidth={0.55*s} strokeLinejoin="round" opacity="0.9"/>));
    } else if (shape === "halo") {
      els.push(<circle key={k++} cx={12*s} cy={12*s} r={11*s} fill={auraColor} opacity="0.16"/>);
      els.push(<ellipse key={k++} cx={12*s} cy={1.2*s} rx={4*s} ry={1.3*s} fill="none" stroke={auraColor} strokeWidth={0.8*s} style={{filter:`drop-shadow(0 0 ${0.6*s}px ${auraColor})`}}/>);
    } else if (shape === "orbit") {
      // Orbiting Sparks — comet-like orbs with trailing tails on an elliptical ring
      els.push(<circle key={k++} cx={12*s} cy={11*s} r={4.5*s} fill={auraColor} opacity="0.2"/>);
      els.push(<ellipse key={k++} cx={12*s} cy={11*s} rx={10*s} ry={6*s} fill="none" stroke={auraColor} strokeWidth={0.3*s} opacity="0.4"/>);
      [10,130,250].forEach((deg)=>{
        const a=deg*Math.PI/180, ox=(12+10*Math.cos(a)), oy=(11+6*Math.sin(a));
        // tail (a few fading dots back along the ellipse)
        for (let t=1;t<=3;t++){
          const at=(deg-t*14)*Math.PI/180;
          els.push(<circle key={k++} cx={(12+10*Math.cos(at))*s} cy={(11+6*Math.sin(at))*s} r={(0.5-t*0.1)*s} fill={shade(auraColor,55)} opacity={0.5-t*0.12}/>);
        }
        els.push(<circle key={k++} cx={ox*s} cy={oy*s} r={1.2*s} fill={shade(auraColor,70)} opacity="0.95" style={{filter:`drop-shadow(0 0 ${0.5*s}px ${auraColor})`}}/>);
      });
    }
  }
  // Cape (behind the torso)
  if (capeC) {
    R(8.2,10.4,7.6,9.2,capeC.color,1.4);
    R(8.2,10.4,7.6,1.2,shade(capeC.color,28),0.8);
  }

  if (has("aura",11)) {
    els.push(<circle key={k++} cx={12*s} cy={11*s} r={10.5*s} fill="url(#auraGrad)" />);
  }
  if (has("wings",13)) {
    R(2.2,9,3.6,1.6,"#fdf3d8",0.8); R(1.2,10.4,4.6,1.8,"#fbe9b8",0.9);
    R(0.6,12.2,5.0,1.8,"#fdf3d8",0.9); R(1.6,14,3.6,1.5,"#f3da9b",0.8);
    R(18.2,9,3.6,1.6,"#fdf3d8",0.8); R(18.2,10.4,4.6,1.8,"#fbe9b8",0.9);
    R(18.4,12.2,5.0,1.8,"#fdf3d8",0.9); R(18.8,14,3.6,1.5,"#f3da9b",0.8);
  }

  R(9,16,2.2,4.4,pants,0.5);
  R(12.8,16,2.2,4.4,pants,0.5);
  R(9,16,5.9,1.2,pants,0.4);
  if (has("boots",2)) {
    R(8.4,19.8,3.4,1.9,"#42291a",0.6); R(8.4,20.6,3.4,1.1,shade("#42291a",-18),0.5);
    R(12.3,19.8,3.4,1.9,"#42291a",0.6); R(12.3,20.6,3.4,1.1,shade("#42291a",-18),0.5);
  } else {
    R(9,19.8,2.2,1.4,skin,0.6); R(12.8,19.8,2.2,1.4,skin,0.6);
  }

  const fem = cz.body === "f";
  const steel = has("armor",7), leather = !steel && has("armor",5);
  let torsoColor = steel ? "#9fb0c1" : leather ? "#6b3a1f" : (level>=1 ? shirt : "#8a7a64");
  if (fem) {
    R(9.1,10.8,5.8,5.4,torsoColor,1.1);
    R(8.8,14.6,6.4,1.6,torsoColor,0.8);
    R(9.1,15.2,5.8,1.0,shade(torsoColor,-26),0.5);
  } else {
    R(8.7,10.8,6.6,5.4,torsoColor,0.9);
    R(8.7,15.2,6.6,1.0,shade(torsoColor,-26),0.5);
  }
  if (steel) {
    R(8.7,10.8,2.4,1.0,shade(torsoColor,38),0.5);
    R(10.9,13.0,2.2,1.1,"#22304a",0.4);
    R(8.0,10.8,1.3,2.2,"#b8c4d2",0.6);
    R(14.7,10.8,1.3,2.2,"#b8c4d2",0.6);
  }
  if (leather) {
    R(8.7,12.6,6.6,0.9,"#3f2415",0.3);
    R(10.0,11.4,0.7,0.7,"#caa05a",0.35);
    R(13.3,11.4,0.7,0.7,"#caa05a",0.35);
  }
  if (has("trim",9)) {
    R(8.7,10.8,6.6,0.7,"#f1b32b",0.35);
    R(8.7,15.4,6.6,0.8,"#f1b32b",0.35);
  }

  const armColor = steel ? "#9fb0c1" : leather ? "#6b3a1f" : (level>=1 ? shirt : skin);
  R(7.6,11.2,1.3,4.0,armColor,0.6);
  R(15.1,11.2,1.3,4.0,armColor,0.6);
  R(7.6,14.9,1.3,1.2,skin,0.6);
  R(15.1,14.9,1.3,1.2,skin,0.6);

  R(8.2,3.8,7.6,7.2,skin,1.6);
  R(8.2,10.0,7.6,1.0,shade(skin,-18),0.8);
  const helm = has("helm",8) && !has("crown",12);
  const hs = cz.hairstyle || "classic";
  if (!helm && hs !== "bald") {
    if (hs === "classic") {
      R(8.0,2.9,8.0,2.2,hair,1.0);
      R(8.0,4.6,1.3,1.9,hair,0.5);
      R(14.7,4.6,1.3,1.9,hair,0.5);
      R(11.2,4.8,1.6,0.9,hair,0.4);
    } else if (hs === "long") {
      R(8.0,2.9,8.0,2.2,hair,1.0);
      R(7.7,4.4,1.6,6.8,hair,0.8);
      R(14.7,4.4,1.6,6.8,hair,0.8);
      R(11.2,4.8,1.6,0.9,hair,0.4);
    } else if (hs === "fro") {
      R(7.2,1.2,9.6,5.2,hair,2.6);
      R(7.0,3.4,1.6,2.6,hair,1.0);
      R(15.4,3.4,1.6,2.6,hair,1.0);
    } else if (hs === "braids") {
      R(8.0,2.9,8.0,2.2,hair,1.0);
      R(7.8,4.4,1.2,6.4,hair,0.6);
      R(15.0,4.4,1.2,6.4,hair,0.6);
      R(7.8,7.2,1.2,0.7,"#caa05a",0.3);
      R(15.0,7.2,1.2,0.7,"#caa05a",0.3);
      R(7.8,9.4,1.2,0.7,"#caa05a",0.3);
      R(15.0,9.4,1.2,0.7,"#caa05a",0.3);
    } else if (hs === "buzz") {
      R(8.2,3.2,7.6,1.3,hair,0.9);
    }
  }
  R(9.9,6.8,1.4,1.8,"#ffffff",0.7);
  R(12.8,6.8,1.4,1.8,"#ffffff",0.7);
  R(10.3,7.4,0.8,1.0,"#1c1410",0.4);
  R(13.2,7.4,0.8,1.0,"#1c1410",0.4);
  R(11.2,9.4,1.7,0.55,shade(skin,-55),0.3);

  if (helm) {
    R(8.0,2.6,8.0,3.0,"#aab6c2",1.0);
    R(8.0,5.0,8.0,0.8,shade("#aab6c2",-24),0.4);
    R(11.0,0.9,2.0,2.2,"#d6452e",0.6);
  }
  if (has("crown",12)) {
    R(8.8,1.7,6.4,1.7,"#f1b32b",0.4);
    R(8.8,0.8,1.1,1.2,"#fcd34d",0.3);
    R(11.45,0.6,1.1,1.4,"#fcd34d",0.3);
    R(14.1,0.8,1.1,1.2,"#fcd34d",0.3);
    R(10.2,2.1,0.8,0.8,"#dc2626",0.4);
    R(13.0,2.1,0.8,0.8,"#2563eb",0.4);
  }

  if (has("shield",6)) {
    R(4.6,11.6,3.2,4.6,"#6e655a",1.1);
    R(4.6,11.6,3.2,1.0,shade("#6e655a",24),0.6);
    R(5.7,13.0,1.0,1.8,"#f1b32b",0.5);
  }
  if (has("sword",3)) {
    const ench = level >= 10, iron = level >= 4;
    const wc = weaponC ? weaponC.color : null;
    if (ench) {
      R(16.4,6.2,0.6,8.0, wc||"#cfe7ff",0.3);
      R(17.0,6.2,0.7,8.0, wc?shade(wc,30):"#9fd0ff",0.3);
      R(16.0,13.9,2.8,0.9,"#7c5cd6",0.4);
      R(16.9,14.7,0.9,1.9,"#2a1f4a",0.4);
      els.push(<circle key={k++} cx={17.3*s} cy={9.6*s} r={2.6*s} fill={wc||"#9fd0ff"} opacity="0.16"/>);
    } else if (iron) {
      R(16.5,7.6,0.6,6.4, wc||"#eef2f6",0.3);
      R(17.1,7.6,0.7,6.4, wc?shade(wc,28):"#c4cfdb",0.3);
      R(16.0,13.9,2.8,0.9,"#5b6573",0.4);
      R(16.9,14.7,0.9,1.7,"#3f2d1d",0.4);
      R(16.8,16.3,1.1,0.9,"#caa05a",0.5);
    } else {
      R(16.7,8.8,1.0,5.2, wc||"#b07d2e",0.4);
      R(16.0,13.9,2.6,0.9,"#5a3a1a",0.4);
      R(16.9,14.7,0.9,1.7,"#2e2017",0.4);
    }
  }

  // Pet companion (hand-drawn, idle beside the champion)
  if (pet) {
    const petItem = SHOP.find(it=>it.id===pet);
    if (petItem && petItem.art) {
      drawPet(els, petItem.art, petItem.color, 19.5, 17.5, s, () => k++);
    }
  }

  return (
    <svg width={W*s} height={H*s} viewBox={`0 0 ${W*s} ${H*s}`}
      style={{display:"block", animation: idle ? "breathe 3.2s ease-in-out infinite" : "none"}}>
      <defs>
        <radialGradient id="auraGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.55"/>
          <stop offset="70%" stopColor="#fbbf24" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {els}
    </svg>
  );
}

// ── HOLD-TO-COMPLETE BUTTON (chunky Not Boring style) ─────────────────────────
function HoldRing({ color="#ffffff", checkColor="#222", trackColor="rgba(255,255,255,0.35)", reps, target, onComplete, onShortTap, size=54, holdMs=650 }) {
  const [prog, setProg] = useState(0);
  const raf = useRef(null);
  const startT = useRef(0);
  const fired = useRef(false);
  const boxRef = useRef(null);
  const done = reps >= target;
  const isBonus = reps > target;
  const stroke = 5;
  const r = (size - stroke*2) / 2;
  const circ = 2 * Math.PI * r;

  const begin = (e) => {
    e.stopPropagation(); e.preventDefault();
    fired.current = false;
    startT.current = performance.now();
    try { navigator.vibrate && navigator.vibrate(8); } catch {}
    const tick = (t) => {
      const p = Math.min(1, (t - startT.current) / holdMs);
      setProg(p);
      if (p >= 1) {
        if (!fired.current) {
          fired.current = true;
          try { navigator.vibrate && navigator.vibrate([20,40,30]); } catch {}
          let cx2=null, cy2=null;
          try { const r2 = boxRef.current.getBoundingClientRect(); cx2 = r2.left + r2.width/2; cy2 = r2.top + r2.height/2; } catch {}
          onComplete(cx2, cy2);
        }
        setTimeout(()=>setProg(0), 200);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  const end = (e) => {
    if (e) e.stopPropagation();
    cancelAnimationFrame(raf.current);
    if (!fired.current) {
      if (prog > 0 && prog < 0.25 && onShortTap) onShortTap();
      setProg(0);
    }
  };

  const ringPct = prog > 0 ? prog : (done ? 1 : Math.min(1, reps/target));
  return (
    <div ref={boxRef}
      onPointerDown={begin} onPointerUp={end} onPointerLeave={end} onPointerCancel={end}
      onContextMenu={e=>e.preventDefault()} onClick={e=>{e.stopPropagation();e.preventDefault();}}
      style={{ width:size, height:size, position:"relative", flexShrink:0, cursor:"pointer",
        touchAction:"none", WebkitUserSelect:"none", userSelect:"none", WebkitTouchCallout:"none",
        transform: prog>0 ? "scale(1.08)" : "scale(1)", transition:"transform .15s" }}
    >
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill={done ? color : "rgba(0,0,0,0.18)"}
          stroke={trackColor} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - ringPct)}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: prog>0 ? "none" : "stroke-dashoffset .3s ease",
            filter: prog>0||done ? `drop-shadow(0 0 7px ${color})` : "none" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
        justifyContent:"center", pointerEvents:"none" }}>
        {done
          ? <span style={{ color:checkColor, fontSize:size*0.44, fontWeight:900 }}>✓</span>
          : target > 1
            ? <span style={{ color:"rgba(255,255,255,0.9)", fontSize:size*0.26, fontWeight:800 }}>{reps}/{target}</span>
            : prog > 0
              ? <span style={{ color, fontSize:size*0.3 }}>●</span>
              : null
        }
      </div>
      {isBonus && (
        <div style={{ position:"absolute", top:-5, right:-5, background:"#ffb13d", color:"#3a2200",
          fontSize:9.5, fontWeight:900, padding:"1.5px 6px", borderRadius:9 }}>
          +{reps-target}
        </div>
      )}
    </div>
  );
}

// ── RADAR CHART (white-on-glass) ──────────────────────────────────────────────
function RadarChart({ categories, ghostCategories, accent }) {
  const sz=230, cx=115, cy=115, Rr=82;
  if (!categories || categories.length<3) return <div style={{color:FAINT,textAlign:"center",padding:"40px 0",fontSize:13}}>Add 3+ categories</div>;
  const n=categories.length;
  const ang=i=>(Math.PI*2*i/n)-Math.PI/2;
  const pt=(a,r)=>({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});
  const polyPath=(cats)=>{
    const pts=cats.map((c,i)=>{const ratio=Math.max(0,Math.min(1,c.value/c.maxValue));return pt(ang(i),Rr*ratio);});
    return pts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ")+"Z";
  };
  return (
    <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{overflow:"visible"}}>
      <defs>
        <radialGradient id="polyFill"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.22"/><stop offset="100%" stopColor="#ffffff" stopOpacity="0.04"/></radialGradient>
      </defs>
      {[.25,.5,.75,1].map((lv,li)=>{
        const pts=Array.from({length:n},(_,i)=>pt(ang(i),Rr*lv));
        const d=pts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ")+"Z";
        return <path key={li} d={d} fill="none" stroke={li===3?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.12)"} strokeWidth={li===3?1.4:0.8}/>;
      })}
      {Array.from({length:n},(_,i)=>{const o=pt(ang(i),Rr);return <line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>;})}
      {ghostCategories && ghostCategories.length>=3 && <path d={polyPath(ghostCategories)} fill="none" stroke={GOOD} strokeWidth="1.6" strokeDasharray="4,3" opacity="0.8"/>}
      <path d={polyPath(categories)} fill="url(#polyFill)" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" style={{filter:"drop-shadow(0 0 6px rgba(255,255,255,0.5))"}}/>
      {categories.map((c,i)=>{
        const ratio=Math.max(0,Math.min(1,c.value/c.maxValue));
        const dot=pt(ang(i),Rr*ratio);
        const lab=pt(ang(i),Rr+22);
        return (<g key={c.id}>
          <circle cx={dot.x} cy={dot.y} r="5" fill={c.color} stroke="#fff" strokeWidth="1.5"/>
          <text x={lab.x} y={lab.y-6} textAnchor="middle" fontSize="13" fill="#fff">{c.icon}</text>
          <text x={lab.x} y={lab.y+7} textAnchor="middle" fontSize="8" fill={DIM} fontWeight="800">{(c.name||"").slice(0,7).toUpperCase()}</text>
        </g>);
      })}
    </svg>
  );
}

// ── MONTH CALENDAR (glass) ────────────────────────────────────────────────────
// ── SCROLL-WHEEL TIME PICKER (hour · minute · AM/PM) ──────────────────────────
function TimeWheel({ value, onChange }) {
  // value = minutes from midnight
  const ROW = 38;                       // px per row
  const h24 = Math.floor(value/60), min = value%60;
  const ap = h24>=12 ? 1 : 0;           // 0=AM 1=PM
  let h12 = h24%12; if (h12===0) h12=12;
  const hours = Array.from({length:12},(_,i)=>i+1);     // 1..12
  const mins = Array.from({length:60},(_,i)=>i);        // 0..59
  const aps = ["AM","PM"];
  const hourRef = useRef(null), minRef = useRef(null), apRef = useRef(null);
  const settle = useRef({});

  const toMinutes = (hh, mm, a) => {
    let H = hh%12; if (a===1) H += 12;
    return H*60 + mm;
  };
  // initialize scroll positions once
  useEffect(()=>{
    if (hourRef.current) hourRef.current.scrollTop = (h12-1)*ROW;
    if (minRef.current) minRef.current.scrollTop = min*ROW;
    if (apRef.current) apRef.current.scrollTop = ap*ROW;
  }, []);
  const onScroll = (which, ref, list) => {
    clearTimeout(settle.current[which]);
    settle.current[which] = setTimeout(()=>{
      const idx = Math.max(0, Math.min(list.length-1, Math.round(ref.current.scrollTop / ROW)));
      ref.current.scrollTo({ top: idx*ROW, behavior:"smooth" });
      const curH = Math.round((hourRef.current?.scrollTop||0)/ROW)+1;
      const curM = Math.round((minRef.current?.scrollTop||0)/ROW);
      const curA = Math.round((apRef.current?.scrollTop||0)/ROW);
      onChange(toMinutes(
        which==="h"?idx+1:curH,
        which==="m"?idx:curM,
        which==="a"?idx:curA
      ));
    }, 120);
  };
  const col = (list, ref, which, fmt) => (
    <div ref={ref} onScroll={()=>onScroll(which,ref,list)}
      style={{height:ROW*3,overflowY:"scroll",scrollSnapType:"y mandatory",flex:1,
        WebkitOverflowScrolling:"touch",maskImage:"linear-gradient(180deg,transparent,#000 35%,#000 65%,transparent)",
        WebkitMaskImage:"linear-gradient(180deg,transparent,#000 35%,#000 65%,transparent)"}}>
      <div style={{height:ROW}}/>
      {list.map((v,i)=>(
        <div key={i} style={{height:ROW,scrollSnapAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:18,fontWeight:900,color:"#fff"}}>{fmt(v)}</div>
      ))}
      <div style={{height:ROW}}/>
    </div>
  );
  return (
    <div style={{position:"relative",display:"flex",gap:6,background:"rgba(0,0,0,0.28)",borderRadius:16,padding:"6px 10px"}}>
      {/* center selection band */}
      <div style={{position:"absolute",left:8,right:8,top:ROW+6,height:ROW,borderRadius:10,
        background:"rgba(255,255,255,0.10)",pointerEvents:"none"}}/>
      {col(hours, hourRef, "h", v=>v)}
      <div style={{display:"flex",alignItems:"center",fontSize:18,fontWeight:900,color:DIM}}>:</div>
      {col(mins, minRef, "m", v=>String(v).padStart(2,"0"))}
      {col(aps, apRef, "a", v=>v)}
    </div>
  );
}

function MonthCalendar({ task, color, viewYear, viewMonth, onPrev, onNext, onToggleDay }) {
  const first = new Date(viewYear, viewMonth, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const todayK = dateKey();
  const cells = [];
  for (let i=0;i<startDow;i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) {
    cells.push(`${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
  }
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <button onClick={onPrev} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:12,color:"#fff",padding:"6px 16px",cursor:"pointer",fontSize:16,fontWeight:800}}>‹</button>
        <div style={{fontSize:13,fontWeight:800,color:TXT}}>{MONTHS[viewMonth]} {viewYear}</div>
        <button onClick={onNext} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:12,color:"#fff",padding:"6px 16px",cursor:"pointer",fontSize:16,fontWeight:800}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
        {DAYS.map(d=>(<div key={d} style={{textAlign:"center",fontSize:8.5,color:FAINT,fontWeight:800}}>{d.toUpperCase().slice(0,2)}</div>))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {cells.map((dk,i)=>{
          if (!dk) return <div key={`e${i}`}/>;
          const isFuture = dk > todayK;
          const isToday = dk === todayK;
          const sched = isScheduledOn(task, dk);
          const done = isCompletedOn(task, dk);
          const partial = !done && getReps(task, dk) > 0;
          const dayNum = parseInt(dk.split("-")[2],10);
          return (
            <button key={dk}
              onClick={()=>{ if (!isFuture) onToggleDay(dk); }}
              style={{
                aspectRatio:"1", borderRadius:"50%", border: isToday ? `2px solid #fff` : "none",
                background: done ? color : partial ? `${color}55` : (task.frozen||{})[dk] ? "rgba(157,180,255,0.4)" : "rgba(255,255,255,0.07)",
                color: done ? "#fff" : sched ? DIM : FAINT,
                fontSize:10.5, fontWeight: done?900:600, cursor: isFuture?"default":"pointer",
                opacity: isFuture ? 0.3 : sched ? 1 : 0.5,
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow: done ? `0 0 8px ${color}88` : "none", padding:0,
              }}>
              {dayNum}
            </button>
          );
        })}
      </div>
      <div style={{display:"flex",gap:14,marginTop:10,justifyContent:"center",fontSize:8.5,color:FAINT,fontWeight:700}}>
        <span><span style={{color}}>●</span> DONE</span>
        <span><span style={{color:`${color}88`}}>◐</span> PARTIAL</span>
        <span>○ MISSED</span>
      </div>
    </div>
  );
}

// ── SWITCH ────────────────────────────────────────────────────────────────────
function Switch({ on, onToggle, color=GOOD }) {
  return (
    <button onClick={onToggle} style={{
      width:50, height:30, borderRadius:15, border:"none", cursor:"pointer",
      background: on ? color : "rgba(255,255,255,0.18)", position:"relative", transition:"background .2s", flexShrink:0, padding:0,
    }}>
      <div style={{
        width:24, height:24, borderRadius:"50%", background:"#fff", position:"absolute", top:3,
        left: on ? 23 : 3, transition:"left .2s", boxShadow:"0 1px 4px #0006",
      }}/>
    </button>
  );
}

// ── WEEK PILLS (white-on-color, for colored quest cards) ──────────────────────
function WeekPills({ task, cardColor, tinted }) {
  const wk = weekDateKeys();
  const labels = ["M","T","W","T","F","S","S"];
  const todayK = dateKey();
  return (
    <div style={{display:"flex",gap:4}}>
      {wk.map((dk,i)=>{
        const sched = isScheduledOn(task, dk);
        const done = isCompletedOn(task, dk);
        const isToday = dk === todayK;
        return (
          <div key={dk} style={{
            width:18, height:18, borderRadius:9, fontSize:9, fontWeight:900,
            display:"flex", alignItems:"center", justifyContent:"center",
            background: done ? (tinted ? cardColor : "#ffffff") : sched ? (tinted ? `${cardColor}33` : "rgba(255,255,255,0.22)") : "rgba(255,255,255,0.07)",
            color: done ? (tinted ? "#ffffff" : cardColor) : sched ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
            boxShadow: isToday ? "0 0 0 1.5px rgba(255,255,255,0.9)" : "none",
          }}>
            {done ? "✓" : labels[i]}
          </div>
        );
      })}
    </div>
  );
}

// ── MOUNTAIN SCENE (layered ridges + sun/stars; the Not Boring hero) ──────────
function Scene({ T, height=150 }) {
  // deterministic star field
  const stars = T.stars ? Array.from({length:26},(_,i)=>{
    const x = ((i*73) % 430); const y = ((i*37) % Math.max(40, height-70));
    const r = 0.6 + ((i*13)%10)/10;
    return <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.3 + ((i*7)%6)/10}/>;
  }) : null;
  return (
    <svg width="100%" height={height} viewBox={`0 0 430 ${height}`} preserveAspectRatio="xMidYMax slice"
      style={{display:"block",position:"absolute",bottom:0,left:0,right:0,pointerEvents:"none"}}>
      {stars}
      {T.ember ? (
        <>
          <circle cx="330" cy={height*0.28} r="70" fill={T.sun} opacity="0.10"/>
          <circle cx="330" cy={height*0.28} r="48" fill={T.sun} opacity="0.22"/>
          <circle cx="330" cy={height*0.28} r="28" fill={T.sun} opacity="0.95"/>
          <circle cx="330" cy={height*0.28} r="16" fill="#ffe2a8" opacity="0.9"/>
        </>
      ) : (
        <>
          <circle cx="330" cy={height*0.28} r="30" fill={T.sun} opacity="0.95"/>
          <circle cx="330" cy={height*0.28} r="48" fill={T.sun} opacity="0.18"/>
        </>
      )}
      {/* far ridge */}
      <polygon fill={T.m1} opacity="0.85" points={`0,${height} 0,${height*0.62} 55,${height*0.38} 110,${height*0.58} 170,${height*0.30} 235,${height*0.56} 300,${height*0.36} 365,${height*0.60} 430,${height*0.42} 430,${height}`}/>
      {/* mid ridge */}
      <polygon fill={T.m2} opacity="0.95" points={`0,${height} 0,${height*0.78} 70,${height*0.52} 140,${height*0.74} 215,${height*0.46} 290,${height*0.72} 360,${height*0.54} 430,${height*0.74} 430,${height}`}/>
      {/* near ridge */}
      <polygon fill={T.m3} points={`0,${height} 0,${height*0.88} 90,${height*0.70} 180,${height*0.90} 280,${height*0.66} 370,${height*0.88} 430,${height*0.80} 430,${height}`}/>
    </svg>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// SPIN GAME COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════
const SLOT_SYMBOLS = ["🍒","🔔","💎","⭐","7️⃣","🪙","👑","🍀"];
// Shared payout ladder (gems). All three games draw from this so they're fair.
// Wheel: 8 segments, max 25, three zeros (real chance to lose). Order matters for layout.
const WHEEL_SEGMENTS = [25, 0, 15, 5, 20, 0, 10, 0];
const gemsToRarity = (g) => g>=25?"legendary":g>=20?"epic":g>=15?"rare":g>=5?"uncommon":"common";
// Slot: weighted so big wins are rare; max 25, average ~10, plenty of 0s.
const SLOT_PAYOUTS = [0,0,0,0,5,5,5,10,10,10,10,15,15,20,25]; // weighted pool

function SlotMachine({ state, onSettle }) {
  const reels = [0,1,2];
  const [finals, setFinals] = useState([0,0,0]);
  useEffect(()=>{
    if (state==="spinning") {
      const t = setTimeout(()=>{
        const gem = SLOT_PAYOUTS[Math.floor(Math.random()*SLOT_PAYOUTS.length)];
        if (gem > 0) {
          // win: three matching symbols (symbol picked by payout size)
          const sym = gem>=25?6 : gem>=20?2 : gem>=15?3 : gem>=10?0 : 5;
          setFinals([sym,sym,sym]);
        } else {
          // loss: deliberately mismatched
          setFinals([0,3,6]);
        }
        onSettle(gem, gemsToRarity(gem));
      }, 2200);
      return ()=>clearTimeout(t);
    }
  }, [state]);
  return (
    <div style={{display:"flex",gap:10,justifyContent:"center"}}>
      {reels.map(ri=>{
        const spinning = state==="spinning";
        return (
          <div key={ri} style={{width:72,height:88,borderRadius:16,overflow:"hidden",position:"relative",
            background:"rgba(0,0,0,0.45)",border:"2px solid rgba(255,255,255,0.18)"}}>
            {spinning ? (
              <div style={{position:"absolute",left:0,right:0,top:0,display:"flex",flexDirection:"column",alignItems:"center",
                animation:`reelSpin ${0.45+ri*0.18}s linear infinite`}}>
                {Array.from({length:24}).map((_,i)=>(
                  <div key={i} style={{fontSize:38,height:50,display:"flex",alignItems:"center"}}>{SLOT_SYMBOLS[i%SLOT_SYMBOLS.length]}</div>
                ))}
              </div>
            ) : (
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:42,animation: state==="done"?"popIn .4s ease":"none"}}>
                {state==="done" ? SLOT_SYMBOLS[finals[ri]] : "❔"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PrizeWheel({ state, onSettle }) {
  const n = WHEEL_SEGMENTS.length;
  const segAng = 360/n;
  const segColor = (g) => g>=25?"#f5b827" : g>=20?"#9b4dff" : g>=15?"#1d6ef2" : g>=10?"#10b981" : g>=5?"#e0115f" : "#2f2f47";
  const [rot, setRot] = useState(0);
  useEffect(()=>{
    if (state==="spinning") {
      const idx = Math.floor(Math.random()*n);
      const gem = WHEEL_SEGMENTS[idx];
      const target = 360*6 + (360 - (idx*segAng + segAng/2));
      requestAnimationFrame(()=>setRot(target));
      const t = setTimeout(()=>onSettle(gem, gemsToRarity(gem)), 2500);
      return ()=>clearTimeout(t);
    } else if (state==="ready") { setRot(0); }
  }, [state]);

  const R = 100, cx = 105, cy = 105;
  // Build each slice as an SVG path wedge. Slice i spans [i*segAng, (i+1)*segAng), measured from top (−90°).
  const polar = (deg, r) => {
    const a = (deg - 90) * Math.PI/180;
    return [cx + r*Math.cos(a), cy + r*Math.sin(a)];
  };
  const slices = WHEEL_SEGMENTS.map((g,i)=>{
    const a0 = i*segAng, a1 = (i+1)*segAng;
    const [x0,y0] = polar(a0, R), [x1,y1] = polar(a1, R);
    const large = segAng > 180 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
    const [lx,ly] = polar(a0 + segAng/2, R*0.66); // label position
    return { d, color:segColor(g), g, lx, ly };
  });

  return (
    <div style={{position:"relative",width:210,height:210,margin:"0 auto"}}>
      <div style={{position:"absolute",top:-6,left:"50%",transform:"translateX(-50%)",zIndex:3,fontSize:28,color:"#fff",filter:"drop-shadow(0 2px 3px #000)"}}>▼</div>
      <svg width="210" height="210" viewBox="0 0 210 210"
        style={{display:"block",borderRadius:"50%",boxShadow:"0 8px 30px rgba(0,0,0,0.45)",
          transition: state==="spinning" ? "transform 2.4s cubic-bezier(.12,.85,.2,1)" : "none",
          transform:`rotate(${rot}deg)`}}>
        {slices.map((s,i)=>(
          <g key={i}>
            <path d={s.d} fill={s.color} stroke="rgba(0,0,0,0.28)" strokeWidth="1.5"/>
            <text x={s.lx} y={s.ly} fill={s.g===0?"#8a8aa8":"#0d0a1a"} fontSize="19" fontWeight="900"
              textAnchor="middle" dominantBaseline="central"
              transform={`rotate(${(i+0.5)*segAng}, ${s.lx}, ${s.ly})`}>
              {s.g===0 ? "✕" : s.g}
            </text>
          </g>
        ))}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="5"/>
      </svg>
      <div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",width:42,height:42,borderRadius:"50%",
        background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 2px 8px #0007",zIndex:2}}>💎</div>
    </div>
  );
}

// Real, playable blackjack — hit / stand, beat the dealer for more gems
function deal() { return 1 + Math.floor(Math.random()*13); }
function cardLabel(v){ return v===1?"A":v===11?"J":v===12?"Q":v===13?"K":String(v); }
function cardVal(v){ return v===1?11:v>=11?10:v; }
function handTotal(cards){
  let t = cards.reduce((s,c)=>s+cardVal(c),0);
  let aces = cards.filter(c=>c===1).length;
  while (t>21 && aces>0){ t-=10; aces--; }
  return t;
}
function Blackjack({ state, onSettle }) {
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [phase, setPhase] = useState("idle"); // idle | player | reveal | over
  const settledRef = useRef(false);

  useEffect(()=>{
    if (state==="playing" && phase==="idle") {
      const p = [deal(), deal()], d = [deal(), deal()];
      setPlayer(p); setDealer(d); setPhase("player"); settledRef.current=false;
    }
    if (state==="ready") { setPlayer([]); setDealer([]); setPhase("idle"); settledRef.current=false; }
  }, [state]);

  const finish = (pl, dl) => {
    if (settledRef.current) return; settledRef.current = true;
    const pt = handTotal(pl), dt = handTotal(dl);
    let gem;
    if (pt>21) gem = 0;                 // bust
    else if (dt>21 || pt>dt) gem = 10;  // win
    else if (pt===dt) gem = 5;          // push
    else gem = 0;                       // loss
    setPhase("over");
    onSettle(gem, gemsToRarity(gem));
  };

  const hit = () => {
    const np = [...player, deal()];
    setPlayer(np);
    if (handTotal(np) >= 21) stand(np);
  };
  const stand = (pl) => {
    const usePl = Array.isArray(pl) ? pl : player;
    setPhase("reveal");
    let dl = [...dealer];
    const step = () => {
      if (handTotal(dl) < 17) { dl = [...dl, deal()]; setDealer([...dl]); setTimeout(step, 550); }
      else finish(usePl, dl);
    };
    setTimeout(step, 550);
  };

  const Card = ({c,i,hidden,red}) => (
    <div style={{width:44,height:62,borderRadius:9,background:hidden?"#4338ca":"#fff",color:red?"#dc2626":"#1c1430",
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:900,
      boxShadow:"0 3px 8px rgba(0,0,0,0.4)",animation:`cardDeal .35s ${i*0.1}s ease both`}}>
      {hidden ? "🂠" : cardLabel(c)}
    </div>
  );
  const showDealerHole = phase==="reveal" || phase==="over";

  if (state==="ready" || phase==="idle") {
    return <div style={{fontSize:13,color:FAINT,fontWeight:700,padding:"30px 0"}}>Press DEAL to play a hand.</div>;
  }
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14,alignItems:"center"}}>
      <div>
        <div style={{fontSize:9,fontWeight:800,color:FAINT,marginBottom:5,letterSpacing:1}}>
          DEALER {showDealerHole ? `· ${handTotal(dealer)}` : ""}
        </div>
        <div style={{display:"flex",gap:7}}>
          {dealer.map((c,i)=><Card key={i} c={c} i={i} hidden={i===1 && !showDealerHole} red={[1].includes(c)||false}/>)}
        </div>
      </div>
      <div>
        <div style={{fontSize:9,fontWeight:800,color:"#4ade80",marginBottom:5,letterSpacing:1}}>
          YOU · {handTotal(player)} {phase==="over" && handTotal(player)>21 ? "· BUST" : ""}
          {phase==="over" && handTotal(player)===21 && player.length===2 ? "· BLACKJACK!" : ""}
        </div>
        <div style={{display:"flex",gap:7}}>
          {player.map((c,i)=><Card key={i} c={c} i={i} red={[1].includes(c)||false}/>)}
        </div>
      </div>
      {phase==="player" && (
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <button onClick={hit} style={{background:"#fff",color:"#1c1430",border:"none",borderRadius:14,padding:"11px 26px",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"ui-rounded,sans-serif"}}>HIT</button>
          <button onClick={()=>stand()} style={{background:"rgba(255,255,255,0.16)",color:"#fff",border:"none",borderRadius:14,padding:"11px 26px",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"ui-rounded,sans-serif"}}>STAND</button>
        </div>
      )}
    </div>
  );
}

// Small preview thumbnail for a shop item
function ShopPreview({ item }) {
  if (item.type === "pet") {
    const els = []; let kk = 0;
    drawPet(els, item.art, item.color, 12, 12, 1.7, ()=>kk++);
    return <svg width="44" height="44" viewBox="0 0 41 41" style={{overflow:"visible"}}>{els}</svg>;
  }
  if (item.type === "aura") {
    const c = item.color || "#f5b827";
    if (item.auraShape==="saiyan") return <div style={{width:30,height:30,borderRadius:"50%",background:`radial-gradient(circle,${c} 20%,transparent 72%)`,boxShadow:`0 0 12px ${c}`}}/>;
    if (item.auraShape==="cloud") return <div style={{width:36,height:26,borderRadius:"48% 48% 42% 42%",background:`radial-gradient(ellipse at 50% 30%, ${c}, ${c}99 55%, transparent)`,boxShadow:`inset 0 -4px 6px rgba(0,0,0,0.4), 0 0 8px ${c}66`}}/>;
    if (item.auraShape==="electric") return <div style={{position:"relative",width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{position:"absolute",width:12,height:12,borderRadius:"50%",background:c,boxShadow:`0 0 8px ${c}`}}/>{[0,60,120,180,240,300].map(d=><div key={d} style={{position:"absolute",width:2,height:14,background:c,transformOrigin:"center",transform:`rotate(${d}deg) translateY(-9px)`,boxShadow:`0 0 4px ${c}`}}/>)}</div>;
    if (item.auraShape==="halo") return <div style={{width:30,height:30,borderRadius:"50%",border:`3px solid ${c}`,boxShadow:`0 0 10px ${c}`}}/>;
    if (item.auraShape==="orbit") return <div style={{position:"relative",width:34,height:24}}>{[20,140,260].map((d,i)=><div key={d} style={{position:"absolute",left:"50%",top:"50%",width:6,height:6,borderRadius:"50%",background:c,boxShadow:`0 0 6px ${c}`,transform:`translate(-50%,-50%) rotate(${d}deg) translateX(13px)`}}/>)}<div style={{position:"absolute",left:"50%",top:"50%",width:8,height:8,borderRadius:"50%",background:c,opacity:0.4,transform:"translate(-50%,-50%)"}}/></div>;
  }
  // cape — color swatch
  return <div style={{width:30,height:30,borderRadius:"50%",background:item.color||"#888",border:"2px solid rgba(255,255,255,0.3)"}}/>;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [data, setData] = useState(null);
  const [view, setView] = useState("dashboard");
  const [forecastDate, setForecastDate] = useState(null);
  const [planDate, setPlanDate] = useState(dateKey());
  const [planMode, setPlanMode] = useState("month"); // "month" | "day"
  const [planMonth, setPlanMonth] = useState({ y:new Date().getFullYear(), m:new Date().getMonth() });
  const [scheduleSheet, setScheduleSheet] = useState(null); // {title,color,source,refId, editId?, start, dur}
  const [editTask, setEditTask] = useState(null);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [calCursor, setCalCursor] = useState({ y: new Date().getFullYear(), m: new Date().getMonth() });
  const [wkEditCursor, setWkEditCursor] = useState(dateKey()); // anchor date for weekly per-day editor
  const [barDrag, setBarDrag] = useState(false);   // priority divider being dragged
  const barDragRef = useRef(false);
  const [barPreview, setBarPreview] = useState(null); // live position while dragging
  const barPreviewRef = useRef(null);
  const [listEdit, setListEdit] = useState(null);  // {kind:"list"|"item", listId, itemId, parentId, text}
  useEffect(()=>{ if (detailTaskId) setWkEditCursor(dateKey()); }, [detailTaskId]);
  const [cardMenu, setCardMenu] = useState(null); // {col, cardId} for the send-to-list popover
  const [toast, setToast] = useState(null);
  const [confirmBox, setConfirmBox] = useState(null);
  const [showLevelUp, setShowLevelUp] = useState(null);
  const [editingCat, setEditingCat] = useState(null);
  const [editingTitleLvl, setEditingTitleLvl] = useState(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [currentDay, setCurrentDay] = useState(dateKey());
  const [newTask, setNewTask] = useState({name:"",catId:"career",importance:5,targetReps:1,days:[1,2,3,4,5],freq:"daily",weeklyTarget:3});
  const [newCat, setNewCat] = useState({name:"",icon:"⭐",color:"#f59e0b",maxValue:10});
  const [boardInput, setBoardInput] = useState("");
  const [drag, setDrag] = useState(null); // {col,id,text,x,y}
  const [dragOverCol, setDragOverCol] = useState(null);
  const [bursts, setBursts] = useState([]);
  const [openListId, setOpenListId] = useState(null);
  const [listInput, setListInput] = useState("");
  const [itemInput, setItemInput] = useState("");
  const [subFor, setSubFor] = useState(null);
  const [subInput, setSubInput] = useState("");
  const [spinGame, setSpinGame] = useState("slot");
  const [spinState, setSpinState] = useState("ready"); // ready | spinning | done
  const [spinResult, setSpinResult] = useState(null);
  const [confetti, setConfetti] = useState([]);
  const [perfectShow, setPerfectShow] = useState(false);
  const [shopFilter, setShopFilter] = useState("all");
  // Pomodoro client state
  const [pomoPhase, setPomoPhase] = useState("work");
  const [pomoLeft, setPomoLeft] = useState(25*60);
  const [pomoRunning, setPomoRunning] = useState(false);
  const prevLevelRef = useRef(null);
  const midnightRef = useRef(null);
  const boardRef = useRef(null);
  const dragMeta = useRef(null);

  // ── LOAD + MIGRATE + DECAY ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      let loaded = INIT;
      try {
        const res = await fetch("/api/storage");
        const json = await res.json();
        if (json.data && json.data.categories && json.data.tasks) loaded = json.data;
      } catch {}
      const merged = migrate(loaded);
      const { data: decayed, lost } = applyDecay(merged);
      const { wallet: decayedWallet, lostCoins } = applyCoinDecay(decayed);
      decayed.wallet = decayedWallet;
      setData(decayed);
      setPomoLeft((decayed.pomodoro.workMin||25)*60);
      persistRaw(decayed);
      if (lostCoins > 0) setTimeout(()=>toast$(`COINS FADED  −${lostCoins} 🪙`, "#fb923c"), 1100);
      if (lost > 0.005) {
        setTimeout(()=>toast$(`THE NIGHT TOOK ITS TOLL  −${lost.toFixed(2)}`, "#ef4444"), 600);
      }
    })();
  }, []);

  // ── MIDNIGHT + APP RESUME ───────────────────────────────────────────────────
  useEffect(() => {
    const schedule = () => {
      const now = new Date(); const mid = new Date(now); mid.setHours(24,0,0,0);
      midnightRef.current = setTimeout(()=>{ setCurrentDay(dateKey()); schedule(); }, mid - now + 1500);
    };
    schedule();
    const onVis = () => { if (document.visibilityState === "visible") setCurrentDay(dateKey()); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearTimeout(midnightRef.current); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  // Decay when the day changes while app is open / resumed
  useEffect(() => {
    if (!data) return;
    if (data.lastDecayDate === dateKey()) return;
    const { data: decayed, lost } = applyDecay(data);
    setData(decayed);
    persistRaw(decayed);
    if (lost > 0.005) toast$(`THE NIGHT TOOK ITS TOLL  −${lost.toFixed(2)}`, "#ef4444");
  }, [currentDay, data]);

  // ── LEVEL-UP WATCHER ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!data) return;
    const lvl = getLevel(getRating(data.categories)).lvl;
    if (prevLevelRef.current === null) { prevLevelRef.current = lvl; return; }
    if (lvl > prevLevelRef.current) {
      const best = data.flags?.maxLevel || 0;
      const isNewBest = lvl > best;
      const gems = isNewBest ? 10 + lvl * 2 : 0;   // scale a little with level
      setShowLevelUp({ lvl, name: getTitle(data, lvl), unlock: LEVELS[lvl].unlock, gems });
      if (isNewBest) {
        setData(cur=>{ const n={...cur, flags:{...(cur.flags||{}), maxLevel:lvl},
          wallet:{...cur.wallet, gemsEarned:(cur.wallet.gemsEarned||0)+gems}}; persistRaw(n); return n; });
      }
      try { navigator.vibrate && navigator.vibrate([30,60,30,60,80]); } catch {}
      setTimeout(()=>setShowLevelUp(null), 6000);
    }
    prevLevelRef.current = lvl;
  }, [data?.categories]);

  // ── BOSS SETTLEMENT: when the week turns, judge last week's boss ───────────
  useEffect(() => {
    if (!data) return;
    const wk0 = new Date(weekKeysFor(dateKey())[0]+"T00:00:00"); wk0.setDate(wk0.getDate()-7);
    const prevMon = dateKey(wk0);
    if ((data.flags||{}).bossSettledWeek === prevMon) return;
    // First run of this feature: initialize silently — judgments start NEXT week.
    if ((data.flags||{}).bossSettledWeek === undefined) {
      setData(cur=>{ const n={...cur, flags:{...(cur.flags||{}), bossSettledWeek:prevMon}}; persistRaw(n); return n; });
      return;
    }
    const mark = (extra)=> setData(cur=>{ const n={...cur, ...(extra?extra(cur):{}), flags:{...(cur.flags||{}), bossSettledWeek:prevMon}}; persistRaw(n); return n; });
    const prevBoss = bossForWeek(data, prevMon);
    if (!prevBoss || (data.bossClaims||{})[prevMon]) { mark(); return; }
    if (prevBoss.dmg >= prevBoss.hp) {
      // slain but never claimed — grant the bounty automatically
      mark(cur=>({ categories: cur.categories.map(c=>({...c, value:Math.min(c.maxValue, c.value+prevBoss.xp)})),
        bossClaims: {...(cur.bossClaims||{}), [prevMon]: prevBoss.id},
        wallet: {...cur.wallet, gemsEarned:(cur.wallet.gemsEarned||0)+prevBoss.gems} }));
      toast$(`⚔ ${prevBoss.title.toUpperCase()} FELL LAST WEEK +${prevBoss.gems} 💎`, "#ff8f5e");
    } else {
      // it escaped — the XP is taken from you
      mark(cur=>({ categories: cur.categories.map(c=>({...c, value:Math.max(0, c.value-prevBoss.xp)})) }));
      toast$(`💀 ${prevBoss.title.toUpperCase()} ESCAPED — −${prevBoss.xp.toFixed(2)} XP ALL STATS`, "#ef4444");
    }
  }, [currentDay, data]);

  // ── POMODORO TICK ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pomoRunning) return;
    const it = setInterval(() => {
      setPomoLeft(prev => {
        if (prev <= 1) {
          try { navigator.vibrate && navigator.vibrate([80,80,80,80,160]); } catch {}
          if (pomoPhase === "work") {
            setData(d => {
              if (!d) return d;
              const dk = dateKey();
              const sessions = { ...(d.pomodoro.sessionsByDay||{}) };
              sessions[dk] = (sessions[dk]||0) + 1;
              const next = { ...d, pomodoro: { ...d.pomodoro, sessionsByDay: sessions } };
              persistRaw(next);
              return next;
            });
            setPomoPhase("break");
            toast$("FOCUS COMPLETE — BREAK TIME", "#34d399");
            return (dataRef.current?.pomodoro?.breakMin||5)*60;
          } else {
            setPomoPhase("work");
            toast$("BREAK OVER — BACK TO WORK", "#f59e0b");
            return (dataRef.current?.pomodoro?.workMin||25)*60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(it);
  }, [pomoRunning, pomoPhase]);

  const dataRef = useRef(null);
  useEffect(() => { dataRef.current = data; }, [data]);
  const spinsAvailRef = useRef(0);
  const coinBalRef = useRef(0);

  // ── PERSIST ─────────────────────────────────────────────────────────────────
  const persistRaw = async (d) => {
    if (!d || !d.categories || !d.tasks) return;
    try {
      await fetch("/api/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
    } catch {}
  };
  const update = (d) => { setData(d); persistRaw(d); };

  const toast$ = (msg, color) => {
    setToast({msg, color: color || (THEMES[(dataRef.current?.settings?.theme)||"ember"]||THEMES.ember).accent});
    setTimeout(()=>setToast(null),2400);
  };

  // ── TASK ACTIONS ────────────────────────────────────────────────────────────
  const addRep = (tid, dk) => {
    const d = dk || currentDay;
    const task = data.tasks.find(t=>t.id===tid); if (!task) return;

    // ── WEEKLY HABIT: each tap adds ONE completion to today (you can log many
    //    per day toward a big weekly target). Value & coins are sliced so hitting
    //    the weekly target equals a full quest's worth. ──
    if (isWeekly(task)) {
      const wt = weeklyTargetOf(task);
      const doneBefore = weeklyDone(task, d);         // total reps this week before
      const slice = task.points / wt;                 // points per weekly rep
      const willCount = doneBefore < wt;              // only first wt reps add value
      const cats = data.categories.map(c => c.id !== task.catId ? c
        : {...c, value: Math.min(c.maxValue, c.value + (willCount ? slice : 0))});
      const prevDayReps = getReps(task, d);
      const tasks = data.tasks.map(t => {
        if (t.id !== tid) return t;
        const comps = {...(t.completions||{})}; comps[d] = prevDayReps + 1;
        return {...t, completions: comps};
      });
      update({...data, categories:cats, tasks});
      // coins: pay per rep up to the weekly target. Ledger key includes the rep
      // index so each of the first wt reps banks once and can't be re-farmed.
      const repIndex = doneBefore + 1;                // 1-based rep number this week
      if (repIndex <= wt) payCoins(task, `${tid}|wk|${weekKeysFor(d)[0]}|${repIndex}`, d);
      const cat = data.categories.find(c=>c.id===task.catId);
      const nowDone = doneBefore + 1;
      if (nowDone === wt) toast$(`✓ ${task.name} — WEEK COMPLETE!`, cat?.color || "#34d399");
      else if (nowDone > wt) toast$(`${nowDone}/${wt} · over target! 💪`, "#f59e0b");
      else toast$(`${nowDone}/${wt} this week · ${task.name}`, cat?.color || "#34d399");
      return;
    }

    const target = task.targetReps || 1;
    const prevReps = getReps(task, d);
    const newReps = prevReps + 1;
    const delta = calcEarnedPoints(task.points, target, newReps) - calcEarnedPoints(task.points, target, prevReps);
    const processed = d < data.lastDecayDate;
    const refund = (processed && prevReps === 0 && isScheduledOn(task, d)) ? (task.decayRate||0) : 0;
    const cats = data.categories.map(c => c.id !== task.catId ? c
      : {...c, value: Math.min(c.maxValue, c.value + delta + refund)});
    const tasks = data.tasks.map(t => {
      if (t.id !== tid) return t;
      const comps = {...(t.completions||{})}; comps[d] = newReps;
      return {...t, completions: comps};
    });
    update({...data, categories:cats, tasks});
    const cat = data.categories.find(c=>c.id===task.catId);
    const justDone = prevReps < target && newReps >= target;
    // Mint coins when the quest crosses into completion — but only ONCE per task
    // per day. The ledger key blocks re-earning by unchecking and rechecking.
    if (justDone) payCoins(task, `${tid}|${d}`, d);
    const showXP = data.settings.showXP;
    if (justDone) toast$(showXP ? `✓ ${task.name}  +${(delta+refund).toFixed(3)}` : `✓ ${task.name}`, cat?.color || "#34d399");
    else if (newReps > target) toast$(showXP ? `BONUS +${delta.toFixed(3)}` : "BONUS!", "#f59e0b");
    else toast$(`${newReps}/${target} ${task.name}`, cat?.color);
  };

  // ── UNIFIED COIN PAYMENT: combo momentum + first-win bonus ──────────────────
  // Completing tasks back-to-back (within 45 min) builds a coin multiplier:
  // x1 → x1.5 → x2 (cap). Your FIRST completion each day pays a flat bonus.
  // Both apply only when logging TODAY — back-filling past days is bookkeeping,
  // not momentum. Every payment is ledger-keyed so nothing can be double-earned.
  const COMBO_WINDOW_MS = 45*60*1000;
  const COMBO_MULT = [1, 1.5, 2];
  const FIRST_WIN_COINS = 15;
  const payCoins = (task, key, dayKey) => {
    const isToday = dayKey === dateKey();
    // precompute for toasts (cosmetic; ledger inside setData is authoritative)
    const now = Date.now();
    const pc = data.combo || {count:0,lastAt:0};
    const chained = isToday && (now - (pc.lastAt||0)) <= COMBO_WINDOW_MS;
    const preCount = isToday ? (chained ? Math.min(3,(pc.count||0)+1) : 1) : 0;
    const hadFirstWin = !!((data.wallet.coinsByTaskDay||{})[`fw|${dayKey}`]);
    setData(cur=>{
      const ledger = cur.wallet.coinsByTaskDay||{};
      if (ledger[key]) return cur;
      const base = coinsForTask(task);
      let count = cur.combo?.count||0, lastAt = cur.combo?.lastAt||0, mult = 1;
      if (isToday) {
        count = (now - lastAt) <= COMBO_WINDOW_MS ? Math.min(3, count+1) : 1;
        lastAt = now;
        mult = COMBO_MULT[count-1];
      }
      const coins = Math.round(base * mult);
      const nl = {...ledger}; nl[key] = coins;
      let earned = (cur.wallet.coinsEarned||0) + coins;
      if (isToday && !nl[`fw|${dayKey}`]) { nl[`fw|${dayKey}`] = FIRST_WIN_COINS; earned += FIRST_WIN_COINS; }
      const n = {...cur,
        combo: isToday ? {count, lastAt} : (cur.combo||{count:0,lastAt:0}),
        flags: {...(cur.flags||{}), maxCombo: Math.max(cur.flags?.maxCombo||1, count)},
        wallet: {...cur.wallet, coinsEarned: earned, coinsByTaskDay: nl}};
      persistRaw(n); return n;
    });
    if (isToday && !hadFirstWin) toast$(`⚡ FIRST WIN OF THE DAY +${FIRST_WIN_COINS} 🪙`, "#ffc46b");
    else if (preCount >= 2) toast$(`🔥 COMBO x${COMBO_MULT[preCount-1]} — coins boosted!`, "#ff7a2e");
    try { navigator.vibrate && navigator.vibrate(preCount>=2 ? 14 : 8); } catch {}
  };

  // Reverse a coin payment when a completion is undone. Symmetric with earning:
  // uncheck removes the coins and frees the ledger key (so re-checking pays again).
  // Safety: if the coins were already spent (balance too low), leave both the
  // coins and the ledger key alone — the wallet never goes negative and the
  // completed→unchecked→re-checked loop can't mint extra coins.
  const clawbackCoins = (key) => {
    setData(cur=>{
      const ledger = cur.wallet.coinsByTaskDay||{};
      const amt = ledger[key];
      if (!amt) return cur;
      const bal = Math.max(0, (cur.wallet.coinsEarned||0) - (cur.wallet.coinsSpent||0));
      if (bal < amt) return cur;
      const nl = {...ledger}; delete nl[key];
      const n = {...cur, wallet:{...cur.wallet, coinsEarned:(cur.wallet.coinsEarned||0)-amt, coinsByTaskDay:nl}};
      persistRaw(n); return n;
    });
  };

  const clearDay = (tid, dk) => {
    const d = dk || currentDay;
    const task = data.tasks.find(t=>t.id===tid); if (!task) return;
    const reps = getReps(task, d);
    if (reps === 0) return;

    if (isWeekly(task)) {
      const wt = weeklyTargetOf(task);
      const doneBefore = weeklyDone(task, d);          // total reps this week incl. today
      const slice = task.points / wt;
      // the rep we're removing was "counted" toward value only if its index ≤ wt
      const wasCounted = doneBefore <= wt;
      const cats = data.categories.map(c => c.id !== task.catId ? c
        : {...c, value: Math.max(0, c.value - (wasCounted ? slice : 0))});
      const dayReps = getReps(task, d);
      const tasks = data.tasks.map(t => {
        if (t.id !== tid) return t;
        const comps = {...(t.completions||{})};
        if (dayReps <= 1) delete comps[d]; else comps[d] = dayReps - 1;  // decrement
        return {...t, completions: comps};
      });
      update({...data, categories:cats, tasks});
      clawbackCoins(`${tid}|wk|${weekKeysFor(d)[0]}|${doneBefore}`);
      toast$("−1", "#ef4444");
      return;
    }

    const target = task.targetReps || 1;
    const earned = calcEarnedPoints(task.points, target, reps);
    const processed = d < data.lastDecayDate;
    const penalty = (processed && isScheduledOn(task, d)) ? (task.decayRate||0) : 0;
    const cats = data.categories.map(c => c.id !== task.catId ? c
      : {...c, value: Math.max(0, c.value - earned - penalty)});
    const tasks = data.tasks.map(t => {
      if (t.id !== tid) return t;
      const comps = {...(t.completions||{})}; delete comps[d];
      return {...t, completions: comps};
    });
    update({...data, categories:cats, tasks});
    clawbackCoins(`${tid}|${d}`);
    toast$("CLEARED", "#ef4444");
  };

  // Weekly per-day editor: nudge a specific day's rep count up or down by ±1,
  // adjusting the category value only for reps that fall within the weekly target.
  const weeklyAdjustDay = (tid, dk, dir) => {
    const task = data.tasks.find(t=>t.id===tid); if (!task || !isWeekly(task)) return;
    const dayReps = getReps(task, dk);
    if (dir<0 && dayReps===0) return;
    const wt = weeklyTargetOf(task);
    const weekTotal = weeklyDone(task, dk);
    const slice = task.points / wt;
    // adding: counts toward value only if we're still under target this week
    // removing: reclaims value only if we were at/under target
    let valDelta = 0;
    if (dir>0 && weekTotal < wt) valDelta = slice;
    if (dir<0 && weekTotal <= wt) valDelta = -slice;
    const cats = data.categories.map(c => c.id !== task.catId ? c
      : {...c, value: Math.max(0, Math.min(c.maxValue, c.value + valDelta))});
    const tasks = data.tasks.map(t => {
      if (t.id !== tid) return t;
      const comps = {...(t.completions||{})};
      const nv = dayReps + dir;
      if (nv <= 0) delete comps[dk]; else comps[dk] = nv;
      return {...t, completions: comps};
    });
    update({...data, categories:cats, tasks});
    // coins mirror the ring: + pays (up to the weekly target, ledger-keyed), − claws back
    const wkStart = weekKeysFor(dk)[0];
    if (dir>0) {
      const repIndex = weekTotal + 1;
      if (repIndex <= wt) payCoins(task, `${tid}|wk|${wkStart}|${repIndex}`, dk);
    } else {
      clawbackCoins(`${tid}|wk|${wkStart}|${weekTotal}`);
    }
    try { navigator.vibrate && navigator.vibrate(6); } catch {}
  };

  const toggleDay = (tid, dk) => {
    const task = data.tasks.find(t=>t.id===tid); if (!task) return;
    if (isWeekly(task)) { addRep(tid, dk); return; }  // weekly: each tap adds one rep
    if (getReps(task, dk) > 0) clearDay(tid, dk);
    else {
      const target = task.targetReps || 1;
      const earned = calcEarnedPoints(task.points, target, target);
      const processed = dk < data.lastDecayDate;
      const refund = (processed && isScheduledOn(task, dk)) ? (task.decayRate||0) : 0;
      const cats = data.categories.map(c => c.id !== task.catId ? c
        : {...c, value: Math.min(c.maxValue, c.value + earned + refund)});
      const tasks = data.tasks.map(t => {
        if (t.id !== tid) return t;
        const comps = {...(t.completions||{})}; comps[dk] = target;
        return {...t, completions: comps};
      });
      update({...data, categories:cats, tasks});
      payCoins(task, `${tid}|${dk}`, dk);
      toast$(`LOGGED ${dk}`, "#34d399");
    }
  };

  const saveEditTask = () => {
    if (!editTask) return;
    const isWk = editTask.freq === "weekly";
    const updated = { ...editTask,
      freq: isWk ? "weekly" : "daily",
      days: isWk ? [] : (editTask.days || []),
      weeklyTarget: isWk ? Math.max(1, editTask.weeklyTarget || 3) : 1,
      targetReps: isWk ? 1 : (editTask.targetReps || 1),
      points: calcPoints(editTask.importance ?? 5),
      decayRate: calcDecay(editTask.importance ?? 5) };
    update({...data, tasks: data.tasks.map(t=>t.id===editTask.id?updated:t)});
    setEditTask(null); setView("tasks");
    toast$("QUEST UPDATED ✓");
  };
  const deleteTask = (id) => update({...data, tasks:data.tasks.filter(t=>t.id!==id)});
  const addTask = () => {
    if (!newTask.name.trim()) return;
    const isWk = newTask.freq === "weekly";
    const task = { ...newTask, id:`t${Date.now()}`,
      order: data.tasks.length, createdAt: dateKey(),
      freq: isWk ? "weekly" : "daily",
      days: isWk ? [] : (newTask.days || []),
      weeklyTarget: isWk ? Math.max(1, newTask.weeklyTarget || 3) : 1,
      targetReps: isWk ? 1 : (newTask.targetReps || 1),
      points: calcPoints(newTask.importance), decayRate: calcDecay(newTask.importance), completions:{} };
    update({...data, tasks:[...data.tasks, task]});
    setNewTask({name:"",catId:data.categories[0]?.id||"career",importance:5,targetReps:1,days:[1,2,3,4,5],freq:"daily",weeklyTarget:3});
    setView("tasks"); toast$(isWk ? "WEEKLY HABIT CREATED!" : "QUEST CREATED!");
  };

  // ── CATEGORY ACTIONS ────────────────────────────────────────────────────────
  const saveEditCat = (id, updates) =>
    update({...data, categories: data.categories.map(c=>c.id===id?{...c,...updates}:c)});
  const addCat = () => {
    if (!newCat.name.trim()) return;
    update({...data, categories:[...data.categories, {...newCat, id:`c${Date.now()}`, value:3.0, maxValue:parseInt(newCat.maxValue)}]});
    setNewCat({name:"",icon:"⭐",color:"#f59e0b",maxValue:10});
    toast$("CATEGORY ADDED!");
  };
  const deleteCat = (id) => {
    update({...data,
      categories: data.categories.filter(c=>c.id!==id),
      tasks: data.tasks.map(t=>t.catId===id?{...t,catId:null}:t)});
    toast$("CATEGORY DELETED — QUESTS NEED REASSIGNMENT", "#fb923c");
  };

  // ── SETTINGS / CHARACTER / TITLES ───────────────────────────────────────────
  const setSetting = (key, val) => {
    const next = {...data, settings:{...data.settings, [key]:val}};
    if (key==="kanbanEnabled" && !val && view==="board") setView("dashboard");
    if (key==="planEnabled" && !val && view==="plan") setView("dashboard");
    if (key==="bossEnabled" && !val && view==="boss") setView("dashboard");
    if (key==="pomodoroEnabled" && !val && view==="focus") setView("dashboard");
    if (key==="casinoEnabled" && !val && view==="casino") setView("dashboard");
    if (key==="shopEnabled" && !val && view==="shop") setView("dashboard");
    if (key==="questsEnabled" && !val && (view==="tasks"||view==="addTask"||view==="editTask"||view==="forecast")) setView("dashboard");
    if (key==="statsEnabled" && !val && view==="stats") setView("dashboard");
    update(next);
  };
  const setChar = (key, val) =>
    update({...data, character:{...data.character, [key]:val}});
  const toggleGear = (slot) =>
    update({...data, character:{...data.character,
      equipped:{...data.character.equipped, [slot]: data.character.equipped[slot]===false ? true : false}}});
  const saveTitle = (lvl) => {
    const name = titleDraft.trim();
    const ct = {...(data.customTitles||{})};
    if (name && name !== LEVELS[lvl].name) ct[lvl] = name; else delete ct[lvl];
    update({...data, customTitles: ct});
    setEditingTitleLvl(null);
    toast$("TITLE SAVED ✓");
  };

  // ── RESET (stats only — keeps quests, names, history, customization) ────────
  const resetStats = () => {
    update({...data,
      categories: data.categories.map(c=>({...c, value:0})),
      lastDecayDate: dateKey()});
    toast$("STATS RESET — BACK TO LEVEL 0", "#fb923c");
  };

  // ── BOARD (kanban) ──────────────────────────────────────────────────────────
  const boardAdd = () => {
    const text = boardInput.trim();
    if (!text) return;
    update({...data, kanban:{...data.kanban, todo:[...data.kanban.todo, {id:`k${Date.now()}`, text}]}});
    setBoardInput("");
    try { navigator.vibrate && navigator.vibrate(10); } catch {}
  };
  const boardMoveTo = (fromCol, id, toCol) => {
    if (fromCol === toCol) return;
    const card = data.kanban[fromCol].find(c=>c.id===id);
    if (!card) return;
    update({...data, kanban:{...data.kanban,
      [fromCol]: data.kanban[fromCol].filter(c=>c.id!==id),
      [toCol]: [...data.kanban[toCol], card]}});
    if (toCol==="done") { toast$("TASK COMPLETE ✓","#34d399"); try{navigator.vibrate&&navigator.vibrate([15,30,25]);}catch{} }
    else { try{navigator.vibrate&&navigator.vibrate(12);}catch{} }
  };
  const boardDelete = (col, id) =>
    update({...data, kanban:{...data.kanban, [col]: data.kanban[col].filter(c=>c.id!==id)}});
  const boardClearDone = () =>
    update({...data, kanban:{...data.kanban, done:[]}});
  const boardAdvance = (col, id) => {
    const next = col==="todo" ? "doing" : col==="doing" ? "done" : null;
    if (next) boardMoveTo(col, id, next);
  };

  // ── COMPLETION BURST (the juice) ────────────────────────────────────────────
  const fireBurst = (x, y, color, label) => {
    if (x === null || x === undefined) return;
    const id = Date.now() + Math.random();
    setBursts(b=>[...b, {id, x, y, color, label}]);
    setTimeout(()=>setBursts(b=>b.filter(z=>z.id!==id)), 1100);
  };

  // ── QUEST ORDER / RESET ─────────────────────────────────────────────────────
  const moveTask = (id, dir) => {
    const sorted = [...data.tasks].sort((a,b)=>(a.order??0)-(b.order??0));
    const i = sorted.findIndex(t=>t.id===id);
    const j = i + dir;
    if (i<0 || j<0 || j>=sorted.length) return;
    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
    const orderMap = {}; sorted.forEach((t,k)=>orderMap[t.id]=k);
    update({...data, tasks: data.tasks.map(t=>({...t, order:orderMap[t.id]}))});
    try { navigator.vibrate && navigator.vibrate(8); } catch {}
  };
  // Reorder a task relative to a visible subset (e.g. today's list, where the
  // displayed order differs from global order). Swaps global order values with
  // the neighbor in that subset so the move matches what the user sees.
  const moveTaskWithin = (id, dir, visibleIds) => {
    const idx = visibleIds.indexOf(id);
    const nIdx = idx + dir;
    if (idx<0 || nIdx<0 || nIdx>=visibleIds.length) return;
    const otherId = visibleIds[nIdx];
    const a = data.tasks.find(t=>t.id===id), b = data.tasks.find(t=>t.id===otherId);
    if (!a || !b) return;
    const ao = a.order??0, bo = b.order??0;
    update({...data, tasks: data.tasks.map(t=>{
      if (t.id===id) return {...t, order:bo};
      if (t.id===otherId) return {...t, order:ao};
      return t;
    })});
    try { navigator.vibrate && navigator.vibrate(8); } catch {}
  };
  // ── PLAN / SCHEDULE (time blocks on the calendar) ───────────────────────────
  const blocksForDay = (dk) => ((data.schedule||{})[dk] || []).slice().sort((a,b)=>a.start-b.start);
  const saveScheduleBlock = (dk, block) => {
    setData(cur=>{
      const sched = {...(cur.schedule||{})};
      const list = (sched[dk]||[]).slice();
      if (block.id) {
        const i = list.findIndex(b=>b.id===block.id);
        if (i>=0) list[i] = block; else list.push(block);
      } else {
        list.push({...block, id:`s${Date.now()}`});
      }
      sched[dk] = list;
      const n = {...cur, schedule:sched};
      persistRaw(n); return n;
    });
    try { navigator.vibrate && navigator.vibrate(10); } catch {}
  };
  const removeScheduleBlock = (dk, id) => {
    setData(cur=>{
      const sched = {...(cur.schedule||{})};
      sched[dk] = (sched[dk]||[]).filter(b=>b.id!==id);
      const n = {...cur, schedule:sched};
      persistRaw(n); return n;
    });
  };

  const resetAllQuests = () => {
    update({...data, tasks: data.tasks.map(t=>({...t, completions:{}, frozen:{}, createdAt: dateKey()}))});
    toast$("ALL QUEST HISTORY RESET");
  };
  const resetQuest = (id) => {
    update({...data, tasks:data.tasks.map(t=>t.id===id?{...t, completions:{}, createdAt: dateKey()}:t)});
    toast$("QUEST HISTORY RESET");
  };

  // ── SPIN GAMES (slot / wheel / blackjack, chosen at random) ─────────────────
  const spendCoins = (n) => setData(d=>{ const nd={...d, wallet:{...d.wallet, coinsSpent:(d.wallet.coinsSpent||0)+n}}; persistRaw(nd); return nd; });
  const awardGems  = (n) => setData(d=>{ const nd={...d, wallet:{...d.wallet, gemsEarned:(d.wallet.gemsEarned||0)+n}}; persistRaw(nd); return nd; });
  const claimChallenge = (gems) => {
    setData(cur=>{ const n={...cur, challengeClaims:{...(cur.challengeClaims||{}), [dateKey()]:true},
      wallet:{...cur.wallet, gemsEarned:(cur.wallet.gemsEarned||0)+gems}}; persistRaw(n); return n; });
    toast$(`CHALLENGE COMPLETE +${gems} 💎`, "#a78bfa");
    try { navigator.vibrate && navigator.vibrate([10,40,20]); } catch {}
  };
  const claimBoss = (boss) => {
    setData(cur=>{ if ((cur.bossClaims||{})[boss.wkStart]) return cur;
      const cats = cur.categories.map(c=>({...c, value: Math.min(c.maxValue, c.value + boss.xp)}));
      const n={...cur, categories:cats, bossClaims:{...(cur.bossClaims||{}), [boss.wkStart]:boss.id},
      wallet:{...cur.wallet, gemsEarned:(cur.wallet.gemsEarned||0)+boss.gems}}; persistRaw(n); return n; });
    toast$(`⚔ BOSS SLAIN +${boss.gems} 💎 · +${boss.xp.toFixed(2)} XP ALL STATS`, "#ff8f5e");
    try { navigator.vibrate && navigator.vibrate([20,50,20,50,40]); } catch {}
  };
  const claimTrophy = (t) => {
    if (data.trophies && data.trophies[t.id]) return;
    setData(cur=>{ if (cur.trophies && cur.trophies[t.id]) return cur;
      const n={...cur, trophies:{...(cur.trophies||{}), [t.id]:dateKey()},
      wallet:{...cur.wallet, gemsEarned:(cur.wallet.gemsEarned||0)+t.gems}}; persistRaw(n); return n; });
    toast$(`🏆 ${t.name.toUpperCase()} +${t.gems} 💎`, "#ffc46b");
    try { navigator.vibrate && navigator.vibrate([10,40,20]); } catch {}
  };
  const markSpinUsed = (dk) => setData(d=>{
    const used = {...(d.wallet.spinsUsedByDay||{})}; used[dk]=(used[dk]||0)+1;
    const nd={...d, wallet:{...d.wallet, spinsUsedByDay:used}}; persistRaw(nd); return nd;
  });

  const openSpin = () => {
    const dk = dateKey();
    const unlocked = spinsUnlocked(data, dk);
    const used = (data.wallet.spinsUsedByDay||{})[dk]||0;
    if (used >= unlocked) { toast$("COMPLETE MORE QUESTS TO UNLOCK A SPIN","#ffc46b"); return; }
    if (coinBalance(data.wallet) < SPIN_COST) { toast$(`NEED ${SPIN_COST} COINS TO PLAY`,"#ffc46b"); return; }
    const game = SPIN_GAMES[Math.floor(Math.random()*SPIN_GAMES.length)];
    setSpinGame(game); setSpinState("ready"); setSpinResult(null); setView("casino");
  };

  // Start a play: deduct the bet, consume a spin, hand control to the game UI
  const beginPlay = () => {
    if (spinState === "spinning" || spinState === "playing") return;
    const dk = dateKey();
    const unlocked = spinsUnlocked(data, dk);
    const used = (data.wallet.spinsUsedByDay||{})[dk]||0;
    if (used >= unlocked) { toast$("COMPLETE MORE QUESTS TO UNLOCK A SPIN","#ffc46b"); return; }
    if (coinBalance(data.wallet) < SPIN_COST) { toast$(`NEED ${SPIN_COST} COINS`,"#ffc46b"); return; }
    spendCoins(SPIN_COST);
    markSpinUsed(dk);
    setSpinResult(null);
    setSpinState(spinGame==="blackjack" ? "playing" : "spinning");
  };
  // Called by each game when its animation/round resolves
  const settleSpin = (gems, rarity) => {
    awardGems(gems);
    setSpinResult({ rarity: rarity || (gems>=80?"legendary":gems>=34?"epic":gems>=16?"rare":gems>=7?"uncommon":"common"), gems });
    setSpinState("done");
    if (gems > 0) {
      fireConfettiBig(RARITY[rarity||"rare"].color);
      try { navigator.vibrate && navigator.vibrate(gems>=80?[40,60,40,60,120]:[30,50,40]); } catch {}
    } else {
      try { navigator.vibrate && navigator.vibrate(40); } catch {}
    }
  };
  const newRound = () => {
    if (spinsAvailRef.current > 0 && coinBalRef.current >= SPIN_COST) {
      const g = SPIN_GAMES[Math.floor(Math.random()*SPIN_GAMES.length)];
      setSpinGame(g); setSpinState("ready"); setSpinResult(null);
    } else {
      setSpinState("ready"); setSpinResult(null);
    }
  };

  // ── STREAK SHIELD (consumable item) ─────────────────────────────────────────
  const SHIELD_COST = 30;
  const buyShield = () => {
    setData(cur=>{
      const w = cur.wallet;
      const bal = Math.max(0,(w.gemsEarned||0)-(w.gemsSpent||0));
      if (bal < SHIELD_COST) { toast$("NOT ENOUGH GEMS","#ffc46b"); return cur; }
      const n = {...cur, wallet:{...w, gemsSpent:(w.gemsSpent||0)+SHIELD_COST, shields:(w.shields||0)+1}};
      persistRaw(n); return n;
    });
    toast$("🛡 STREAK SHIELD ACQUIRED", "#9db4ff");
    try { navigator.vibrate && navigator.vibrate(12); } catch {}
  };
  // Protect a missed scheduled day: streak survives, decay refunded.
  const useShield = (tid, dk) => {
    const task = data.tasks.find(t=>t.id===tid); if (!task) return;
    if ((data.wallet.shields||0) < 1) { toast$("NO SHIELDS — BUY ONE IN THE SHOP","#ffc46b"); return; }
    if (!isScheduledOn(task, dk) || isCompletedOn(task, dk) || (task.frozen||{})[dk]) return;
    const processed = dk < data.lastDecayDate;         // decay already charged? refund it
    const refund = processed ? (task.decayRate||0) : 0;
    setData(cur=>{
      const t2 = cur.tasks.map(t=> t.id!==tid ? t : {...t, frozen:{...(t.frozen||{}), [dk]:true}});
      const cats = cur.categories.map(c=> c.id!==task.catId ? c
        : {...c, value: Math.min(c.maxValue, c.value + refund)});
      const n = {...cur, tasks:t2, categories:cats,
        wallet:{...cur.wallet, shields:(cur.wallet.shields||0)-1}};
      persistRaw(n); return n;
    });
    toast$("🛡 DAY SHIELDED — STREAK PROTECTED", "#9db4ff");
    try { navigator.vibrate && navigator.vibrate([12,30,12]); } catch {}
  };

  // ── SHOP ────────────────────────────────────────────────────────────────────
  const buyItem = (item) => {
    setData(cur=>{
      const w = cur.wallet;
      const alreadyOwned = (w.owned||[]).includes(item.id);
      if (alreadyOwned) return cur; // equip handled separately by tap
      const streak = bestPerfectStreak(cur);
      if (item.gate?.streak && streak < item.gate.streak) {
        toast$(`NEEDS A ${item.gate.streak}-DAY PERFECT STREAK`,"#ffc46b"); return cur;
      }
      const bal = Math.max(0,(w.gemsEarned||0)-(w.gemsSpent||0));
      if (bal < item.gems) { toast$("NOT ENOUGH GEMS","#ffc46b"); return cur; }
      const n = {...cur, wallet:{...w, gemsSpent:(w.gemsSpent||0)+item.gems, owned:[...(w.owned||[]), item.id]}};
      persistRaw(n);
      fireConfettiBig(RARITY[item.rarity].color);
      toast$(`UNLOCKED ${item.name.toUpperCase()}!`, RARITY[item.rarity].color);
      try { navigator.vibrate && navigator.vibrate([20,40,30]); } catch {}
      return n;
    });
  };
  const equipCosmetic = (item) => {
    setData(cur=>{
      if (!(cur.wallet.owned||[]).includes(item.id)) return cur;
      let nw;
      if (item.type === "pet") {
        nw = {...cur.wallet, pet: cur.wallet.pet===item.id ? null : item.id};
      } else {
        const eq = {...(cur.wallet.equippedCosmetics||{})};
        eq[item.type] = eq[item.type]===item.id ? null : item.id;
        nw = {...cur.wallet, equippedCosmetics:eq};
      }
      const n = {...cur, wallet:nw};
      persistRaw(n); return n;
    });
    try { navigator.vibrate && navigator.vibrate(10); } catch {}
  };

  // ── RESET / DEVELOPER TOOLS ─────────────────────────────────────────────────
  const resetGems = () => { setData(cur=>{ const n={...cur, wallet:{...cur.wallet, gemsEarned:0, gemsSpent:0}}; persistRaw(n); return n; }); toast$("GEMS RESET","#fb923c"); };
  const resetCoins = () => { setData(cur=>{ const n={...cur, wallet:{...cur.wallet, coinsEarned:0, coinsSpent:0, coinsByTaskDay:{}}}; persistRaw(n); return n; }); toast$("COINS RESET","#fb923c"); };
  const resetCosmetics = () => { setData(cur=>{ const n={...cur, wallet:{...cur.wallet, owned:[], equippedCosmetics:{}, pet:null}}; persistRaw(n); return n; }); toast$("COSMETICS RESET","#fb923c"); };
  const devSetCurrency = (coinsVal, gemsVal) => {
    setData(cur=>{
      const w = {...cur.wallet};
      if (coinsVal!=null && !isNaN(coinsVal)) { w.coinsEarned = Math.max(0,Math.round(coinsVal)) + (w.coinsSpent||0); }
      if (gemsVal!=null && !isNaN(gemsVal)) { w.gemsEarned = Math.max(0,Math.round(gemsVal)) + (w.gemsSpent||0); }
      const n={...cur, wallet:w}; persistRaw(n); return n;
    });
    toast$("DEV: CURRENCY SET","#a855f7");
  };
  // Dev: force how many spins are AVAILABLE today, regardless of XP earned.
  // available = unlocked - used, so used = unlocked - want (may go negative = bonus spins).
  const devSetAvailableSpins = (avail) => {
    setData(cur=>{
      const dk = dateKey();
      const unlocked = spinsUnlocked(cur, dk);
      const want = Math.max(0, Math.min(4, Math.round(avail)));
      const used = unlocked - want;
      const map = {...(cur.wallet.spinsUsedByDay||{})}; map[dk] = used;
      const n = {...cur, wallet:{...cur.wallet, spinsUsedByDay:map}};
      persistRaw(n); return n;
    });
    toast$("DEV: SPINS SET","#a855f7");
  };

  // ── PERFECT-DAY JACKPOT ─────────────────────────────────────────────────────
  const claimPerfectDay = () => {
    const dk = dateKey();
    if ((data.wallet.perfectClaimedByDay||{})[dk]) return;
    const claimed = {...(data.wallet.perfectClaimedByDay||{})}; claimed[dk]=true;
    update({...data, wallet:{...data.wallet, gemsEarned:(data.wallet.gemsEarned||0)+PERFECT_DAY_BONUS_GEMS, perfectClaimedByDay:claimed}});
    setPerfectShow(true);
    fireConfettiBig("#f59e0b");
    try { navigator.vibrate && navigator.vibrate([40,60,40,60,40,60,150]); } catch {}
    setTimeout(()=>setPerfectShow(false), 3800);
  };

  const fireConfettiBig = (color) => {
    const pieces = Array.from({length:80},(_,i)=>({
      id: Date.now()+i+Math.random(),
      x: Math.random()*100,
      delay: Math.random()*0.5,
      dur: 1.6 + Math.random()*1.4,
      color: i%3===0 ? color : i%3===1 ? "#ffd76b" : "#fff",
      size: 6 + Math.random()*8,
      rot: Math.random()*360,
    }));
    setConfetti(pieces);
    setTimeout(()=>setConfetti([]), 3400);
  };

  // ── REMINDERS-STYLE LISTS ───────────────────────────────────────────────────
  const mutateList = (id, fn) => update({...data, lists: data.lists.map(l=>l.id===id?fn(l):l)});
  const addList = () => {
    const name = listInput.trim(); if (!name) return;
    const color = LIST_COLORS[data.lists.length % LIST_COLORS.length];
    update({...data, lists:[...data.lists, {id:`l${Date.now()}`, name, color, items:[]}]});
    setListInput("");
  };
  const commitListEdit = () => {
    const le = listEdit; if (!le) { return; }
    const text = (le.text||"").trim();
    setListEdit(null);
    if (!text) return;
    if (le.kind === "list") { mutateList(le.listId, l=>({...l, name:text})); return; }
    mutateList(le.listId, l=>({...l, items: le.parentId
      ? l.items.map(it=>it.id!==le.parentId?it:{...it, children:(it.children||[]).map(c=>c.id===le.itemId?{...c,text}:c)})
      : l.items.map(it=>it.id===le.itemId?{...it,text}:it)}));
  };
  const editingList = (lid)          => listEdit && listEdit.kind==="list" && listEdit.listId===lid;
  const editingItem = (lid,iid,pid)  => listEdit && listEdit.kind==="item" && listEdit.listId===lid
                                        && listEdit.itemId===iid && (listEdit.parentId||null)===(pid||null);
  const deleteList = (id) => {
    update({...data, lists:data.lists.filter(l=>l.id!==id)});
    if (openListId===id) setOpenListId(null);
  };
  const addListItem = (listId, parentId) => {
    const text = (parentId ? subInput : itemInput).trim(); if (!text) return;
    mutateList(listId, l=>{
      if (!parentId) return {...l, items:[...l.items, {id:`i${Date.now()}`, text, done:false, children:[]}]};
      return {...l, items:l.items.map(it=>it.id===parentId?{...it, children:[...(it.children||[]), {id:`i${Date.now()}`, text, done:false}]}:it)};
    });
    if (parentId) { setSubInput(""); setSubFor(null); } else setItemInput("");
  };
  const toggleListItem = (listId, itemId, parentId) => mutateList(listId, l=>({...l, items:l.items.map(it=>{
    if (parentId) { if (it.id!==parentId) return it; return {...it, children:(it.children||[]).map(c=>c.id===itemId?{...c,done:!c.done}:c)}; }
    return it.id===itemId?{...it,done:!it.done}:it;
  })}));
  const deleteListItem = (listId, itemId, parentId) => mutateList(listId, l=>({...l, items: parentId
    ? l.items.map(it=>it.id!==parentId?it:{...it, children:(it.children||[]).filter(c=>c.id!==itemId)})
    : l.items.filter(it=>it.id!==itemId)}));
  const sendToBoard = (listId, itemId, parentId) => {
    const list = data.lists.find(l=>l.id===listId); if (!list) return;
    let texts = [];
    if (parentId) {
      const p = list.items.find(i=>i.id===parentId);
      const c = (p?.children||[]).find(c=>c.id===itemId);
      if (c) texts = [c.text];
    } else {
      const it = list.items.find(i=>i.id===itemId);
      if (it) texts = [it.text, ...(it.children||[]).map(c=>c.text)];
    }
    if (!texts.length) return;
    const cards = texts.map((t,i)=>({id:`k${Date.now()+i}`, text:t}));
    const newLists = data.lists.map(l=>l.id!==listId?l:{...l, items: parentId
      ? l.items.map(it=>it.id!==parentId?it:{...it, children:(it.children||[]).filter(c=>c.id!==itemId)})
      : l.items.filter(it=>it.id!==itemId)});
    update({...data, lists:newLists, kanban:{...data.kanban, todo:[...data.kanban.todo, ...cards]}});
    toast$(`SENT TO BOARD (${cards.length})`);
    try { navigator.vibrate && navigator.vibrate(12); } catch {}
  };

  // Move a board card into a list (removes it from the board).
  const sendCardToList = (col, cardId, listId, parentId=null) => {
    const card = (data.kanban[col]||[]).find(c=>c.id===cardId);
    const list = data.lists.find(l=>l.id===listId);
    if (!card || !list) return;
    const parent = parentId ? list.items.find(i=>i.id===parentId) : null;
    if (parentId && !parent) return;
    const newItem = parentId
      ? { id:`li${Date.now()}`, text:card.text, done:false }
      : { id:`li${Date.now()}`, text:card.text, done:false, children:[] };
    update({
      ...data,
      kanban: {...data.kanban, [col]: data.kanban[col].filter(c=>c.id!==cardId)},
      lists: data.lists.map(l=> l.id!==listId ? l : (parentId
        ? {...l, items: l.items.map(it=>it.id!==parentId?it:{...it, children:[...(it.children||[]), newItem]})}
        : {...l, items:[...l.items, newItem]})),
    });
    setCardMenu(null);
    toast$(`MOVED UNDER ${(parent ? parent.text : list.name).toUpperCase()}`);
    try { navigator.vibrate && navigator.vibrate(12); } catch {}
  };

  // Drag-and-drop (pointer-based so it works on iPhone)
  const COLS = ["todo","doing","done"];
  const dragStart = (e, col, card) => {
    if (e.button !== undefined && e.button !== 0) return;
    dragMeta.current = { col, card, startX:e.clientX, startY:e.clientY, active:false, consumed:false };
    // long-press (~480ms) = quick-advance to next column, with haptic
    const lp = setTimeout(()=>{
      const m = dragMeta.current;
      if (m && !m.active && !m.consumed) {
        m.consumed = true;
        try { navigator.vibrate && navigator.vibrate(18); } catch {}
        boardAdvance(m.col, m.card.id);
      }
    }, 480);
    const move = (ev) => {
      const m = dragMeta.current; if (!m) return;
      const dx = ev.clientX - m.startX, dy = ev.clientY - m.startY;
      if (Math.hypot(dx,dy) > 10) clearTimeout(lp);         // moving cancels long-press
      if (!m.active && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
        m.active = true;
        try { navigator.vibrate && navigator.vibrate(10); } catch {}
      }
      if (m.active) {
        ev.preventDefault();
        setDrag({ col:m.col, id:m.card.id, text:m.card.text, x:ev.clientX, y:ev.clientY });
        if (boardRef.current) {
          const r = boardRef.current.getBoundingClientRect();
          const rel = (ev.clientX - r.left) / r.width;
          setDragOverCol(rel < 1/3 ? "todo" : rel < 2/3 ? "doing" : "done");
        }
      }
    };
    const up = (ev) => {
      clearTimeout(lp);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      const m = dragMeta.current; dragMeta.current = null;
      setDrag(null); setDragOverCol(null);
      if (m && m.active && boardRef.current) {
        const r = boardRef.current.getBoundingClientRect();
        const rel = (ev.clientX - r.left) / r.width;
        const target = rel < 1/3 ? "todo" : rel < 2/3 ? "doing" : "done";
        boardMoveTo(m.col, m.card.id, target);
      } else if (m && !m.active && !m.consumed) {
        const dist = Math.hypot(ev.clientX - m.startX, ev.clientY - m.startY);
        if (dist < 8) setCardMenu({ col:m.col, cardId:m.card.id, mode:"actions" }); // tap = open card sheet
      }
    };
    window.addEventListener("pointermove", move, { passive:false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  // ── POMODORO CONTROLS ───────────────────────────────────────────────────────
  const pomoReset = () => {
    setPomoRunning(false);
    setPomoLeft((pomoPhase==="work" ? (data.pomodoro.workMin||25) : (data.pomodoro.breakMin||5))*60);
  };
  const setPomoDur = (key, val) => {
    const next = {...data, pomodoro:{...data.pomodoro, [key]:val}};
    update(next);
    if (!pomoRunning) {
      if (key==="workMin" && pomoPhase==="work") setPomoLeft(val*60);
      if (key==="breakMin" && pomoPhase==="break") setPomoLeft(val*60);
    }
  };

  if (!data) return (
    <div style={{
      background:"radial-gradient(ellipse at 50% 34%, #2d2634 0%, #161219 46%, #070609 100%)",
      minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      fontFamily:"ui-rounded,'SF Pro Rounded',Nunito,-apple-system,sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{`
        @keyframes emberPulse { 0%,100%{opacity:.55;filter:drop-shadow(0 0 6px #ff6a1e)} 50%{opacity:1;filter:drop-shadow(0 0 16px #ff7a2e)} }
        @keyframes forgeGlow { 0%,100%{opacity:.30;transform:scale(1)} 50%{opacity:.5;transform:scale(1.06)} }
        @keyframes sparkRise { 0%{transform:translateY(0);opacity:0} 20%{opacity:1} 100%{transform:translateY(-120px);opacity:0} }
        @keyframes loadFill { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes helmRise { 0%{opacity:0;transform:translateY(14px)} 100%{opacity:1;transform:translateY(0)} }
      `}</style>
      {/* forge glow */}
      <div style={{position:"absolute",width:520,height:460,borderRadius:"50%",
        background:"radial-gradient(circle, #ec5e23 0%, rgba(236,94,35,0) 62%)",
        top:"26%",animation:"forgeGlow 3.4s ease-in-out infinite",pointerEvents:"none"}}/>
      {/* rising sparks */}
      {[0,1,2,3,4,5].map(i=>(
        <div key={i} style={{position:"absolute",bottom:"38%",left:`${40+i*4}%`,
          width:3+ (i%3),height:3+(i%3),borderRadius:"50%",background:"#ffb45a",
          animation:`sparkRise ${2.2+i*0.4}s ease-in ${i*0.5}s infinite`,opacity:0}}/>
      ))}
      {/* helm */}
      <div style={{animation:"helmRise .8s ease both",position:"relative",zIndex:2}}>
        <svg width="172" height="172" viewBox="0 0 1024 1024">
          <defs>
            <linearGradient id="ls_steel" x1="0.2" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#9eaab9"/><stop offset="40%" stopColor="#5c6672"/><stop offset="100%" stopColor="#262a31"/>
            </linearGradient>
            <linearGradient id="ls_dark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a525e"/><stop offset="100%" stopColor="#1b1e24"/>
            </linearGradient>
            <radialGradient id="ls_eye" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffe7a0"/><stop offset="55%" stopColor="#ff7a1e"/><stop offset="100%" stopColor="#b51d00"/>
            </radialGradient>
          </defs>
          <path d="M512 235 C 392 235 330 300 322 408 C 318 470 326 560 352 636 C 372 694 430 740 512 740 C 594 740 652 694 672 636 C 698 560 706 470 702 408 C 694 300 632 235 512 235 Z" fill="url(#ls_dark)"/>
          <path d="M512 262 C 408 262 356 318 349 412 C 345 470 353 552 376 622 C 393 672 444 712 512 712 C 580 712 631 672 648 622 C 671 552 679 470 675 412 C 668 318 616 262 512 262 Z" fill="url(#ls_steel)"/>
          <path d="M360 432 C 430 392 594 392 664 432 L 648 470 C 586 440 438 440 376 470 Z" fill="#20242b" opacity="0.9"/>
          <rect x="503" y="300" width="18" height="412" fill="#23272e" opacity="0.85"/>
          <rect x="508" y="300" width="5" height="412" fill="#a9b4c2" opacity="0.4"/>
          <path d="M398 470 L 486 506 L 486 542 L 396 512 Z" fill="#0c0e12"/>
          <path d="M626 470 L 538 506 L 538 542 L 628 512 Z" fill="#0c0e12"/>
          <g style={{animation:"emberPulse 1.8s ease-in-out infinite",transformOrigin:"center"}}>
            <ellipse cx="446" cy="510" rx="40" ry="15" fill="url(#ls_eye)"/>
            <ellipse cx="578" cy="510" rx="40" ry="15" fill="url(#ls_eye)"/>
          </g>
          {[0,1,2,3,4].map(i=>(<rect key={i} x={452+i*24} y="588" width="9" height={70-Math.abs(2-i)*10} rx="4" fill="#15181d"/>))}
          {[[372,430],[652,430],[386,600],[638,600]].map(([x,y],i)=>(<circle key={i} cx={x} cy={y} r="9" fill="#2a2f37"/>))}
          <path d="M392 560 l 60 26" stroke="#cdd6e0" strokeWidth="3" opacity="0.35" fill="none"/>
          <path d="M636 552 l -54 22" stroke="#cdd6e0" strokeWidth="3" opacity="0.30" fill="none"/>
        </svg>
      </div>
      {/* title */}
      <div style={{marginTop:20,fontSize:22,fontWeight:900,letterSpacing:6,color:"#e8e2ea",
        textShadow:"0 2px 20px rgba(0,0,0,0.7)",zIndex:2}}>LIFE&nbsp;RPG</div>
      <div style={{marginTop:7,fontSize:10.5,fontWeight:800,letterSpacing:3,color:"#c9743a",zIndex:2}}>FORGED IN DISCIPLINE</div>
      {/* loading bar */}
      <div style={{marginTop:26,width:190,height:4,borderRadius:3,background:"rgba(255,255,255,0.08)",overflow:"hidden",position:"relative",zIndex:2}}>
        <div style={{position:"absolute",inset:0,width:"60%",borderRadius:3,
          background:"linear-gradient(90deg,transparent,#ff7a2e,#ffb45a,#ff7a2e,transparent)",
          animation:"loadFill 1.3s ease-in-out infinite"}}/>
      </div>
    </div>
  );

  // ── COMPUTED ────────────────────────────────────────────────────────────────
  const S = data.settings;
  const T = THEMES[S.theme] || THEMES.ember;
  const cz = data.character;
  const today = currentDay;
  const todayTasks = data.tasks.filter(t=>t.catId && data.categories.find(c=>c.id===t.catId) && !isWeekly(t) && isScheduledOn(t,today));
  const weeklyHabits = data.tasks.filter(t=>t.catId && data.categories.find(c=>c.id===t.catId) && isWeekly(t));
  const todayDone = todayTasks.filter(t=>isCompletedOn(t,today)).length;
  const allDone = todayTasks.length>0 && todayDone===todayTasks.length;
  // ── PRIORITY DIVIDER — one draggable bar, remembered per weekday ────────────
  const PRI = "#ffb020";
  const priDow = new Date(today+"T00:00:00").getDay();
  const priBarPos = (()=>{ const arr = Array.isArray(data.priorityBar)?data.priorityBar:[0,0,0,0,0,0,0];
    return Math.max(0, Math.min(todayTasks.length, parseInt(arr[priDow])||0)); })();
  const setPriBar = (idx, persist) => {
    const arr = Array.isArray(data.priorityBar) ? [...data.priorityBar] : [0,0,0,0,0,0,0];
    while (arr.length < 7) arr.push(0);
    if (arr[priDow] === idx && !persist) return;
    arr[priDow] = idx;
    const n = {...data, priorityBar: arr};
    if (persist) update(n); else setData(n);
  };
  const rating = getRating(data.categories);
  const tier = getTier(rating);
  const level = getLevel(rating);
  const lvlProgress = ((rating - level.ratingFloor) / 7) * 100;
  const ghostCategories = data.categories.map(c=>{
    let val = c.value;
    data.tasks.forEach(t=>{
      if (t.catId!==c.id || !isScheduledOn(t,today)) return;
      const target = t.targetReps||1; const reps = getReps(t,today);
      if (reps>=target) return;
      val = Math.min(c.maxValue, val + (calcEarnedPoints(t.points,target,target)-calcEarnedPoints(t.points,target,reps)));
    });
    return {...c, value:val};
  });
  const ratingIfAllDone = projectRating(data.categories, data.tasks, today, "full");
  const ratingIfNoneDone = projectRating(data.categories, data.tasks, today, "decay");
  const detailTask = detailTaskId ? data.tasks.find(t=>t.id===detailTaskId) : null;
  const detailCat = detailTask ? data.categories.find(c=>c.id===detailTask.catId) : null;
  const detailColor = detailTask ? (detailTask.color || detailCat?.color || "#ffffff") : "#ffffff";
  const dStats = detailTask ? questStats(detailTask) : null;
  const orphanTasks = data.tasks.filter(t=>!t.catId || !data.categories.find(c=>c.id===t.catId));
  const pomoTotal = (pomoPhase==="work" ? (data.pomodoro.workMin||25) : (data.pomodoro.breakMin||5))*60;
  const pomoToday = (data.pomodoro.sessionsByDay||{})[today]||0;
  const [qText, qAuthor] = quoteOfDay();
  const cosmetics = data.wallet.equippedCosmetics || {};
  const pet = data.wallet.pet;
  const coins = coinBalance(data.wallet);
  const gems = gemBalance(data.wallet);
  const spinsAvail = Math.max(0, spinsUnlocked(data, today) - ((data.wallet.spinsUsedByDay||{})[today]||0));
  spinsAvailRef.current = spinsAvail;
  coinBalRef.current = coinBalance(data.wallet);
  const perfectStreak = bestPerfectStreak(data);
  const canClaimPerfect = allDone && !((data.wallet.perfectClaimedByDay||{})[today]);
  const titleItem = SHOP.find(it=>it.id===cosmetics.title);
  const nowD = new Date();
  const dateLabel = `${DAYS[nowD.getDay()]}, ${MONTHS[nowD.getMonth()].slice(0,3)} ${nowD.getDate()}`;

  // ── STYLES (glass-on-sky system) ────────────────────────────────────────────
  const FONT = `ui-rounded,'SF Pro Rounded',Nunito,-apple-system,system-ui,sans-serif`;
  // Theme-aware glass tints: surfaces (cards, nav, sheets, modals) pick up the
  // active theme's hue so everything shifts together — warm-dark under Forge,
  // cool under Night, etc.
  const _gb = T.glass || "12,10,34";
  const GLASS = `rgba(${_gb},0.42)`;
  const GLASS_SOFT = `rgba(${_gb},0.30)`;
  const GLASS_HEAVY = `rgba(${_gb},0.72)`;
  const skyGradient = `linear-gradient(180deg,${T.sky[0]} 0%,${T.sky[1]} 52%,${T.sky[2]} 100%)`;
  const C = {
    app:{minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:FONT,color:TXT,paddingBottom:"calc(env(safe-area-inset-bottom, 0px) + 110px)",position:"relative"},
    header:{padding:"calc(env(safe-area-inset-top, 0px) + 14px) 18px 10px",position:"sticky",top:0,zIndex:5,background:`linear-gradient(180deg,${T.sky[0]}f0,${T.sky[0]}00)`,backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)"},
    glass:{background:GLASS,backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",border:`1px solid ${LINE}`,borderRadius:26,padding:"16px 17px",marginBottom:12,boxShadow:"0 8px 28px rgba(0,0,0,0.35)"},
    label:{fontSize:11,letterSpacing:1,color:DIM,marginBottom:10,fontWeight:800},
    input:{background:"rgba(0,0,0,0.28)",border:`1px solid ${LINE}`,borderRadius:16,padding:"13px 15px",color:TXT,fontSize:15,width:"100%",boxSizing:"border-box",fontFamily:FONT,fontWeight:600,outline:"none"},
    select:{background:"rgba(0,0,0,0.28)",border:`1px solid ${LINE}`,borderRadius:16,padding:"13px 15px",color:TXT,fontSize:15,width:"100%",boxSizing:"border-box",fontFamily:FONT,fontWeight:600,outline:"none",WebkitAppearance:"none"},
    btn:{background:"#ffffff",color:"#1c1430",border:"none",borderRadius:16,padding:"13px 20px",fontSize:13,cursor:"pointer",fontFamily:FONT,fontWeight:900,boxShadow:"0 6px 20px rgba(0,0,0,0.3)"},
    btnSm:{background:"rgba(255,255,255,0.14)",color:TXT,border:"none",borderRadius:14,padding:"10px 15px",fontSize:11.5,cursor:"pointer",fontFamily:FONT,fontWeight:800},
    nav:{position:"fixed",bottom:"calc(env(safe-area-inset-bottom, 0px) + 10px)",left:"50%",transform:"translateX(-50%)",width:"calc(100% - 24px)",maxWidth:406,background:GLASS_HEAVY,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:`1px solid ${LINE}`,borderRadius:26,display:"flex",justifyContent:"space-around",padding:"10px 4px",zIndex:10,boxShadow:"0 10px 36px rgba(0,0,0,0.45)"},
    navBtn:a=>({background:a?"rgba(255,255,255,0.14)":"none",border:"none",color:a?"#fff":FAINT,fontSize:7,fontWeight:800,cursor:"pointer",fontFamily:FONT,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px 5px",borderRadius:12,transition:"all .2s"}),
    dayBtn:on=>({width:38,height:38,borderRadius:"50%",border:"none",background:on?"#ffffff":"rgba(255,255,255,0.12)",color:on?"#1c1430":DIM,fontSize:10.5,cursor:"pointer",fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}),
    modal:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:900,display:"flex",alignItems:"flex-end",justifyContent:"center"},
    sheet:{background:GLASS_HEAVY,backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderRadius:"26px 26px 0 0",border:`1px solid ${LINE}`,borderBottom:"none",width:"100%",maxWidth:430,maxHeight:"88vh",overflowY:"auto",padding:"18px 20px calc(env(safe-area-inset-bottom, 0px) + 30px)"},
    chip:(on)=>({flex:1,padding:"12px 0",borderRadius:16,border:"none",background:on?"#ffffff":"rgba(255,255,255,0.12)",color:on?"#1c1430":DIM,fontSize:11.5,fontWeight:900,cursor:"pointer",textAlign:"center",fontFamily:FONT}),
    sectionTitle:{fontSize:15,fontWeight:900,color:TXT,textShadow:"0 1px 8px rgba(0,0,0,0.4)"},
  };
  const navItems = [
    { v:"dashboard", icon:"⛰", label:"HOME" },
    ...(S.questsEnabled !== false ? [{ v:"tasks", icon:"⚔", label:"QUESTS" }] : []),
    ...(S.bossEnabled !== false ? [{ v:"boss", icon:"👹", label:"BOSS" }] : []),
    ...(S.planEnabled !== false ? [{ v:"plan", icon:"🗓", label:"PLAN" }] : []),
    ...(S.kanbanEnabled   ? [{ v:"board", icon:"📋", label:"BOARD" }] : []),
    ...(S.pomodoroEnabled ? [{ v:"focus", icon:"⏱️", label:"FOCUS" }] : []),
    ...(S.casinoEnabled ? [{ v:"casino", icon:"🎰", label:"CASINO" }] : []),
    ...(S.shopEnabled ? [{ v:"shop", icon:"🛍", label:"SHOP" }] : []),
    ...(S.statsEnabled !== false ? [{ v:"stats", icon:"📊", label:"STATS" }] : []),
    { v:"settings", icon:"⚙", label:"MORE" },
  ];
  const isActive=(v)=>view===v||(view==="addTask"&&v==="tasks")||(view==="editTask"&&v==="tasks")||(view==="forecast"&&v==="tasks");

  // ── QUEST CARD (ring on the LEFT; vivid or tinted; per-quest color) ─────────
  // Weekly-habit card (used on Home and on the Quests page). Tap ring to log one.
  const WeeklyCard = ({task, showReorder=false, siblingIds=null}) => {
    const cat = data.categories.find(c=>c.id===task.catId);
    const color = task.color || cat?.color || T.accent;
    const wt = weeklyTargetOf(task);
    const done = weeklyDone(task, today);
    const met = done >= wt;
    const pct = Math.min(100, (done/wt)*100);
    const wkeys = weekKeysFor(today);
    const tinted = S.cardStyle==="tinted";
    return (
      <div onClick={()=>{ setDetailTaskId(task.id); setCalCursor({y:new Date().getFullYear(), m:new Date().getMonth()}); }}
        style={{
          background: tinted
            ? `linear-gradient(155deg,${color}24 0%,${color}0e 50%,${GLASS} 100%)`
            : `linear-gradient(155deg,${color} 0%,${shade(color,-58)} 100%)`,
          borderRadius:22, padding:"13px 14px", marginBottom:11, cursor:"pointer",
          opacity: met ? 0.72 : 1, transition:"all .25s",
          boxShadow: tinted ? "0 4px 18px rgba(0,0,0,0.3)" : `0 8px 24px ${color}40, 0 2px 8px rgba(0,0,0,0.3)`,
          border: tinted ? `1px solid ${met?`${color}66`:`${color}33`}` : "none",
        }}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={(e)=>{ e.stopPropagation(); addRep(task.id, today); }}
            style={{width:54,height:54,borderRadius:"50%",flexShrink:0,border:"none",cursor:"pointer",position:"relative",
              background:"rgba(0,0,0,0.18)",padding:0}}>
            <svg width="54" height="54" style={{position:"absolute",inset:0}}>
              <circle cx="27" cy="27" r="22" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="5"/>
              <circle cx="27" cy="27" r="22" fill="none" stroke={tinted?color:"#fff"} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={2*Math.PI*22} strokeDashoffset={2*Math.PI*22*(1-pct/100)}
                transform="rotate(-90 27 27)" style={{transition:"stroke-dashoffset .4s ease"}}/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:met?20:(done>=10?12:14),fontWeight:900,color:"#fff"}}>
              {met ? "✓" : `${done}/${wt}`}
            </div>
          </button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15.5,fontWeight:800,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
              textShadow:tinted?"none":"0 1px 4px rgba(0,0,0,0.25)"}}>{task.name}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.85)",fontWeight:800,marginTop:3}}>
              {met ? "WEEK COMPLETE ✓" : `${wt-done} more this week`}
              {weeklyStreak(task)>=1 && <span style={{color:"#ffd76b"}}> · 🔥{weeklyStreak(task)}w</span>}
            </div>
            <div style={{display:"flex",gap:5,marginTop:8}}>
              {wkeys.map((dk)=>{
                const dayReps = getReps(task,dk)||0;
                const isT = dk===today;
                return <div key={dk} style={{flex:1,height:7,borderRadius:4,position:"relative",
                  background: dayReps>0 ? (tinted?color:"#fff") : "rgba(0,0,0,0.28)",
                  boxShadow: isT ? "0 0 0 1.5px rgba(255,255,255,0.9)" : "none"}}>
                  {dayReps>1 && <span style={{position:"absolute",top:-13,left:"50%",transform:"translateX(-50%)",
                    fontSize:8,fontWeight:900,color:tinted?color:"#fff"}}>{dayReps}</span>}
                </div>;
              })}
            </div>
          </div>
          <div style={{fontSize:9.5,color:"rgba(255,255,255,0.8)",fontWeight:800,whiteSpace:"nowrap",flexShrink:0}}>{cat?.icon}</div>
          {showReorder && (
            <div style={{display:"flex",flexDirection:"column",gap:3,flexShrink:0}}>
              <button onClick={e=>{e.stopPropagation(); (siblingIds?moveTaskWithin(task.id,-1,siblingIds):moveTask(task.id,-1));}}
                style={{background:"rgba(0,0,0,0.25)",border:"none",borderRadius:7,color:(siblingIds&&siblingIds.indexOf(task.id)===0)?"rgba(255,255,255,0.3)":"#fff",fontSize:11,cursor:"pointer",padding:"3px 7px",fontWeight:900,lineHeight:1}}>▲</button>
              <button onClick={e=>{e.stopPropagation(); (siblingIds?moveTaskWithin(task.id,1,siblingIds):moveTask(task.id,1));}}
                style={{background:"rgba(0,0,0,0.25)",border:"none",borderRadius:7,color:(siblingIds&&siblingIds.indexOf(task.id)===siblingIds.length-1)?"rgba(255,255,255,0.3)":"#fff",fontSize:11,cursor:"pointer",padding:"3px 7px",fontWeight:900,lineHeight:1}}>▼</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const QuestCard = ({task, showReorder=false, siblingIds=null, priority=false}) => {
    const cat = data.categories.find(c=>c.id===task.catId);
    const color = task.color || cat?.color || T.accent;
    const tinted = S.cardStyle === "tinted";
    const target = task.targetReps||1;
    const reps = getReps(task, today);
    const done = reps >= target;
    const streak = getStreak(task);
    const qlvl = questLevel(task);
    const qpct = questLevelPct(task);
    const schedToday = isScheduledOn(task, today);
    const burstLabel = S.showXP ? `+${(task.points/target).toFixed(3)}` : "✦ NICE";
    const sibs = siblingIds || [];
    const sIdx = sibs.indexOf(task.id);
    const isFirst = sIdx === 0, isLast = sIdx === sibs.length-1;
    const doMove = (dir)=> siblingIds ? moveTaskWithin(task.id, dir, siblingIds) : moveTask(task.id, dir);
    return (
      <div
        onClick={()=>{ setDetailTaskId(task.id); setCalCursor({y:new Date().getFullYear(), m:new Date().getMonth()}); }}
        style={ tinted ? {
          background:`linear-gradient(155deg,${color}24 0%,${color}0e 50%,${GLASS} 100%)`,
          backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
          border:`1px solid ${done?`${color}66`:`${color}33`}`,
          borderRadius:22, padding:"13px 14px", marginBottom:11, cursor:"pointer",
          opacity: done ? 0.65 : 1, transition:"all .25s",
          boxShadow:"0 4px 18px rgba(0,0,0,0.3)",
        } : {
          background:`linear-gradient(155deg,${color} 0%,${shade(color,-58)} 100%)`,
          borderRadius:22, padding:"13px 14px", marginBottom:11, cursor:"pointer",
          opacity: done ? 0.6 : 1, transition:"all .25s",
          boxShadow:`0 8px 24px ${color}40, 0 2px 8px rgba(0,0,0,0.3)`,
        }}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {/* COMPLETE BUTTON — left side so it never fights your scroll thumb */}
          {schedToday || done ? (
            <HoldRing
              color={tinted ? color : "#ffffff"}
              checkColor={tinted ? "#ffffff" : color}
              trackColor={tinted ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.35)"}
              reps={reps} target={target}
              onComplete={(x,y)=>{ addRep(task.id, today); fireBurst(x, y, tinted ? color : "#ffffff", burstLabel); }}
              onShortTap={()=>toast$("HOLD TO COMPLETE")} />
          ) : (
            <div style={{width:54,textAlign:"center",fontSize:8.5,color:"rgba(255,255,255,0.6)",fontWeight:900,lineHeight:1.5,flexShrink:0}}>REST<br/>DAY</div>
          )}
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{fontSize:15.5,fontWeight:800,color:"#fff",textDecoration:done?"line-through":"none",
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",textShadow:tinted?"none":"0 1px 4px rgba(0,0,0,0.25)"}}>{task.name}</div>
              {priority && (
                <div style={{flexShrink:0,fontSize:9,fontWeight:900,color:"#2a1a00",background:PRI,
                  padding:"2px 7px",borderRadius:10,letterSpacing:0.5,whiteSpace:"nowrap",
                  boxShadow:`0 0 10px ${PRI}88`}}>⚑ MUST</div>
              )}
              {streak >= 2 && (
                <div style={{flexShrink:0,fontSize:10,fontWeight:900,color:"#fff",background:"rgba(0,0,0,0.25)",
                  padding:"2px 7px",borderRadius:10}}>🔥{streak}</div>
              )}
            </div>
            <div style={{height:6,background:"rgba(0,0,0,0.3)",borderRadius:3,overflow:"hidden",marginTop:7,marginBottom:7}}>
              <div style={{height:"100%",width:`${qpct}%`,background:tinted?color:"rgba(255,255,255,0.92)",borderRadius:3,transition:"width .5s ease"}}/>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
              <WeekPills task={task} cardColor={color} tinted={tinted}/>
              <div style={{fontSize:9.5,color:"rgba(255,255,255,0.8)",fontWeight:800,whiteSpace:"nowrap"}}>
                {cat?.icon} {S.showXP ? `+${task.points.toFixed(3)}` : diffLabel(task.importance??5)}
              </div>
            </div>
          </div>
          {/* Level badge — right side */}
          <div style={{
            width:40,height:40,borderRadius:13,flexShrink:0,
            background: tinted ? `${color}33` : "rgba(255,255,255,0.22)",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          }}>
            <div style={{fontSize:7,fontWeight:900,color:"rgba(255,255,255,0.85)",lineHeight:1}}>LV</div>
            <div style={{fontSize:16,fontWeight:900,color:"#fff",lineHeight:1.1}}>{qlvl}</div>
          </div>
          {showReorder && (
            <div style={{display:"flex",flexDirection:"column",gap:3,flexShrink:0}}>
              <button onClick={e=>{e.stopPropagation(); doMove(-1);}}
                style={{background:"rgba(0,0,0,0.25)",border:"none",borderRadius:7,color:isFirst?"rgba(255,255,255,0.3)":"#fff",fontSize:11,cursor:"pointer",padding:"3px 7px",fontWeight:900,lineHeight:1}}>▲</button>
              <button onClick={e=>{e.stopPropagation(); doMove(1);}}
                style={{background:"rgba(0,0,0,0.25)",border:"none",borderRadius:7,color:isLast?"rgba(255,255,255,0.3)":"#fff",fontSize:11,cursor:"pointer",padding:"3px 7px",fontWeight:900,lineHeight:1}}>▼</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── IMPORTANCE SLIDER BLOCK ─────────────────────────────────────────────────
  const ImportanceBlock = ({ value, onChange }) => (
    <div>
      <div style={{...C.label,marginBottom:5}}>
        DIFFICULTY: <span style={{color:"#fff"}}>{S.showXP ? `${value}/10` : diffLabel(value)}</span>
      </div>
      <input type="range" min="1" max="10" step="1" value={value}
        onChange={e=>onChange(parseInt(e.target.value))}
        style={{width:"100%",accentColor:"#ffffff"}}/>
      {S.showXP && (
        <div style={{marginTop:8,padding:"10px 12px",background:"rgba(0,0,0,0.25)",borderRadius:14,
          display:"flex",justifyContent:"space-between",fontSize:11.5,fontWeight:800}}>
          <span style={{color:GOOD}}>+{calcPoints(value).toFixed(3)} done</span>
          <span style={{color:BAD}}>−{calcDecay(value).toFixed(3)} missed</span>
        </div>
      )}
      <div style={{fontSize:9.5,color:FAINT,marginTop:6,textAlign:"center",fontWeight:700}}>
        HARDER QUESTS = BIGGER REWARD AND RISK
      </div>
    </div>
  );

  return (
    <div style={C.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes popIn { 0%{transform:scale(.6);opacity:0} 70%{transform:scale(1.08)}
        @keyframes confettiFall { 0%{transform:translateY(-4vh) rotate(0deg)} 100%{transform:translateY(108vh) rotate(540deg)} } 100%{transform:scale(1);opacity:1} }
        @keyframes sparkle { 0%,100%{opacity:.4;transform:scale(.9)} 50%{opacity:1;transform:scale(1.15)} }
        @keyframes slideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes breathe { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes burstFly { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(var(--dx),var(--dy)) scale(.3);opacity:0} }
        @keyframes floatUp { 0%{transform:translate(-50%,0) scale(.8);opacity:0} 15%{opacity:1;transform:translate(-50%,-12px) scale(1.15)} 100%{transform:translate(-50%,-52px) scale(1);opacity:0} }
        @keyframes ringPop { 0%{transform:scale(.4);opacity:.9} 100%{transform:scale(2.4);opacity:0} }
        @keyframes glowPulse { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.18)} }
        @keyframes confettiFall { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:.9} }
        @keyframes reelSpin { 0%{transform:translateY(0)} 100%{transform:translateY(-1200px)} }
        @keyframes wheelSpin { 0%{transform:rotate(0)} 100%{transform:rotate(var(--spin))} }
        @keyframes flashBg { 0%{opacity:0} 30%{opacity:.85} 100%{opacity:0} }
        @keyframes cardDeal { 0%{transform:translateY(-40px) scale(.7);opacity:0} 100%{transform:translateY(0) scale(1);opacity:1} }
        * { -webkit-tap-highlight-color: transparent; }
        input[type=range]{ height: 30px; }
        body { background: ${T.sky[0]}; }
      `}</style>
      {/* FULL-BLEED SKY */}
      <div style={{position:"fixed",inset:0,background:skyGradient,zIndex:0}}/>

      {/* CONFETTI SHOWER (full screen) */}
      {confetti.length>0 && (
        <div style={{position:"fixed",inset:0,zIndex:1250,pointerEvents:"none",overflow:"hidden"}}>
          {confetti.map(p=>(
            <div key={p.id} style={{position:"absolute",top:0,left:`${p.x}%`,width:p.size,height:p.size*1.4,
              background:p.color,borderRadius:2,opacity:0,
              animation:`confettiFall ${p.dur}s ${p.delay}s cubic-bezier(.3,.6,.5,1) forwards`,
              transform:`rotate(${p.rot}deg)`}}/>
          ))}
        </div>
      )}

      {/* PERFECT DAY OVERLAY */}
      {perfectShow && (
        <div style={{position:"fixed",inset:0,zIndex:1260,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(circle,#f59e0b 0%,transparent 70%)",animation:"flashBg 1.2s ease-out"}}/>
          <div style={{textAlign:"center",animation:"popIn .5s ease"}}>
            <div style={{fontSize:64}}>🏆</div>
            <div style={{fontSize:30,fontWeight:900,color:"#fff",textShadow:"0 0 24px #f59e0b",letterSpacing:1}}>PERFECT DAY</div>
            <div style={{fontSize:16,fontWeight:800,color:"#fcd34d",marginTop:4}}>+{PERFECT_DAY_BONUS_GEMS} 💎</div>
          </div>
        </div>
      )}

      {/* COMPLETION BURSTS */}
      {bursts.map(b=>(
        <div key={b.id} style={{position:"fixed",left:b.x,top:b.y,zIndex:1300,pointerEvents:"none"}}>
          <div style={{position:"absolute",left:-27,top:-27,width:54,height:54,borderRadius:"50%",
            border:`3px solid ${b.color}`,animation:"ringPop .55s ease-out forwards"}}/>
          {Array.from({length:12}).map((_,i)=>{
            const a = (Math.PI*2*i)/12 + (b.id%1);
            const dist = 34 + (i%3)*14;
            return <span key={i} style={{
              position:"absolute",left:-3,top:-3,width:i%2?7:5,height:i%2?7:5,borderRadius:i%3?2:"50%",
              background: i%4===0 ? "#ffd76b" : b.color,
              "--dx":`${Math.cos(a)*dist}px`, "--dy":`${Math.sin(a)*dist}px`,
              animation:"burstFly .75s cubic-bezier(.1,.6,.3,1) forwards",
            }}/>;
          })}
          {b.label && <div style={{position:"absolute",left:0,top:-34,transform:"translateX(-50%)",
            fontSize:17,fontWeight:900,color:"#fff",textShadow:`0 0 12px ${b.color}, 0 2px 6px rgba(0,0,0,0.6)`,
            whiteSpace:"nowrap",animation:"floatUp 1s ease-out forwards"}}>{b.label}</div>}
        </div>
      ))}

      {/* TOAST */}
      {toast && (
        <div style={{position:"fixed",top:"calc(env(safe-area-inset-top, 0px) + 14px)",left:"50%",transform:"translateX(-50%)",
          background:GLASS_HEAVY,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",
          border:`1px solid ${LINE}`,color:"#fff",padding:"11px 22px",borderRadius:30,fontSize:13,
          fontWeight:800,zIndex:999,boxShadow:"0 8px 28px rgba(0,0,0,0.5)",
          whiteSpace:"nowrap",maxWidth:"88vw",overflow:"hidden",textOverflow:"ellipsis",animation:"popIn .25s ease"}}>
          {toast.msg}
        </div>
      )}

      {/* LEVEL-UP MODAL */}
      {showLevelUp && (
        <div onClick={()=>setShowLevelUp(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
          {Array.from({length:18}).map((_,i)=>(
            <div key={i} style={{position:"absolute",top:"-4%",left:`${(i*53)%100}%`,width:i%3?7:10,height:i%3?7:10,
              borderRadius:i%2?"50%":2,background:[T.accent,"#ffd76b","#fff",GOOD][i%4],opacity:0.9,
              animation:`confettiFall ${2.4+(i%5)*0.5}s linear ${(i%6)*0.25}s infinite`}}/>
          ))}
          <div style={{background:GLASS_HEAVY,backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",border:`2px solid ${T.accent}`,borderRadius:30,
            padding:"32px 42px",textAlign:"center",boxShadow:`0 0 70px ${T.accent}88`,maxWidth:320,animation:"popIn .4s ease"}}>
            <div style={{fontSize:13,letterSpacing:3,color:T.accent,fontWeight:900,animation:"sparkle 1.2s infinite"}}>★ LEVEL UP ★</div>
            <div style={{margin:"18px 0",display:"flex",justifyContent:"center"}}>
              <PixelCharacter level={showLevelUp.lvl} character={cz} scale={8} idle cosmetics={cosmetics} pet={pet}/>
            </div>
            <div style={{fontSize:34,fontWeight:900,color:"#fff",textShadow:`0 0 24px ${T.accent}`}}>LV {showLevelUp.lvl}</div>
            <div style={{fontSize:19,color:T.accent,fontWeight:900,marginTop:2}}>{showLevelUp.name}</div>
            <div style={{fontSize:11,color:GOOD,marginTop:12,fontWeight:900,letterSpacing:1}}>UNLOCKED</div>
            <div style={{fontSize:14,color:DIM,marginTop:3,fontWeight:700}}>{showLevelUp.unlock}</div>
            {showLevelUp.gems > 0 && (
              <div style={{marginTop:14,fontSize:15,fontWeight:900,color:"#c084fc"}}>+{showLevelUp.gems} 💎</div>
            )}
            <div style={{fontSize:9,color:FAINT,fontWeight:800,marginTop:14}}>TAP ANYWHERE TO CONTINUE</div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmBox && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setConfirmBox(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:GLASS_HEAVY,backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",border:`2px solid ${BAD}`,borderRadius:26,padding:"24px 26px",maxWidth:340,width:"100%",boxShadow:`0 0 40px ${BAD}55`,animation:"popIn .25s ease"}}>
            <div style={{fontSize:12,letterSpacing:2,color:BAD,fontWeight:900,textAlign:"center",marginBottom:14}}>
              {confirmBox.type==="reset" ? "⚠ RESET STATS" : confirmBox.type==="questReset" ? "⚠ RESET QUEST"
                : confirmBox.type==="resetCoins" ? "⚠ RESET COINS" : confirmBox.type==="resetGems" ? "⚠ RESET GEMS"
                : confirmBox.type==="resetCosmetics" ? "⚠ RESET COSMETICS"
                : confirmBox.type==="resetAllQuests" ? "⚠ RESET ALL QUESTS" : "⚠ CONFIRM DELETE"}
            </div>
            <div style={{fontSize:14.5,color:"#fff",textAlign:"center",marginBottom:10,lineHeight:1.5,fontWeight:600}}>
              {confirmBox.type==="reset"
                ? <>Reset your champion's stats back to the start? Your quests, names, history, and customization are <span style={{color:GOOD,fontWeight:900}}>kept</span>.</>
                : confirmBox.type==="questReset"
                ? <>Wipe the history and streak of <span style={{color:T.accent,fontWeight:900}}>{confirmBox.name}</span> and start counting fresh from today? Your character's stats are <span style={{color:GOOD,fontWeight:900}}>unchanged</span>.</>
                : confirmBox.type==="resetCoins"
                ? <>Set your coin (gold) balance back to <span style={{color:"#fcd34d",fontWeight:900}}>zero</span>?</>
                : confirmBox.type==="resetGems"
                ? <>Set your gem balance back to <span style={{color:"#67e8f9",fontWeight:900}}>zero</span>?</>
                : confirmBox.type==="resetAllQuests"
                ? <>Wipe the history, streaks, and shields of <span style={{color:BAD,fontWeight:900}}>every quest</span> and start them all fresh from today? Your character's stats, coins, and gems are <span style={{color:GOOD,fontWeight:900}}>kept</span>.</>
                : confirmBox.type==="resetCosmetics"
                ? <>Unequip and <span style={{color:BAD,fontWeight:900}}>permanently clear</span> every cosmetic you own? You'll have to re-earn them.</>
                : <>Are you sure you want to delete <span style={{color:T.accent,fontWeight:900}}>{confirmBox.name}</span>?</>}
            </div>
            {confirmBox.type==="cat" && confirmBox.taskCount > 0 && (
              <div style={{fontSize:11.5,color:"#ffc46b",textAlign:"center",marginBottom:10,fontWeight:800,background:"rgba(0,0,0,0.25)",padding:"9px 11px",borderRadius:14}}>
                {confirmBox.taskCount} quest(s) will need reassignment
              </div>
            )}
            <div style={{display:"flex",gap:10,marginTop:14}}>
              <button style={{...C.btnSm,flex:1,padding:"13px"}} onClick={()=>setConfirmBox(null)}>CANCEL</button>
              <button style={{background:BAD,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:12,cursor:"pointer",fontWeight:900,flex:1,fontFamily:FONT}}
                onClick={()=>{
                  if (confirmBox.type==="cat") { deleteCat(confirmBox.id); setEditingCat(null); }
                  else if (confirmBox.type==="task") { deleteTask(confirmBox.id); toast$("QUEST DELETED"); }
                  else if (confirmBox.type==="questReset") resetQuest(confirmBox.id);
                  else if (confirmBox.type==="list") deleteList(confirmBox.id);
                  else if (confirmBox.type==="reset") resetStats();
                  else if (confirmBox.type==="resetCoins") resetCoins();
                  else if (confirmBox.type==="resetGems") resetGems();
                  else if (confirmBox.type==="resetCosmetics") resetCosmetics();
                  else if (confirmBox.type==="resetAllQuests") resetAllQuests();
                  setConfirmBox(null);
                }}>
                {["reset","questReset","resetCoins","resetGems","resetCosmetics","resetAllQuests"].includes(confirmBox.type) ? "RESET" : "DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAG GHOST */}
      {drag && (
        <div style={{position:"fixed",left:drag.x,top:drag.y,transform:"translate(-50%,-120%)",zIndex:1200,
          background:GLASS_HEAVY,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
          border:"1.5px solid rgba(255,255,255,0.7)",borderRadius:14,padding:"11px 15px",
          fontSize:13.5,fontWeight:700,color:"#fff",boxShadow:"0 12px 36px rgba(0,0,0,0.5)",pointerEvents:"none",
          maxWidth:200,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
          {drag.text}
        </div>
      )}

      {/* SCHEDULE (TIME BLOCK) SHEET */}
      {/* BOARD CARD ACTION SHEET */}
      {cardMenu && (()=>{
        const card = (data.kanban[cardMenu.col]||[]).find(c=>c.id===cardMenu.cardId);
        if (!card) return null;
        const colNames = { todo:"TO DO", doing:"IN PROGRESS", done:"DONE" };
        const colColors = { todo:"#38bdf8", doing:"#f59e0b", done:"#34d399" };
        const inLists = cardMenu.mode==="lists" || cardMenu.mode==="sublist";
        return (
        <div style={C.modal} onClick={()=>setCardMenu(null)}>
          <div style={{...C.sheet, animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:42,height:5,background:"rgba(255,255,255,0.3)",borderRadius:3,margin:"0 auto 16px"}}/>
            <div style={{fontSize:16,fontWeight:900,color:"#fff",marginBottom:2,lineHeight:1.35}}>{card.text}</div>
            <div style={{fontSize:10,color:DIM,fontWeight:800,marginBottom:16}}>
              Currently in <span style={{color:colColors[cardMenu.col]}}>{colNames[cardMenu.col]}</span>
            </div>

            {!inLists ? (
              <>
                {/* MOVE BETWEEN COLUMNS */}
                <div style={{...C.label,marginBottom:8}}>MOVE TO</div>
                <div style={{display:"flex",gap:8,marginBottom:14}}>
                  {["todo","doing","done"].filter(c=>c!==cardMenu.col).map(c=>(
                    <button key={c} onClick={()=>{ boardMoveTo(cardMenu.col, cardMenu.cardId, c); setCardMenu(null); }}
                      style={{flex:1,padding:"13px 0",borderRadius:14,border:`1.5px solid ${colColors[c]}66`,cursor:"pointer",fontFamily:FONT,
                        background:`linear-gradient(150deg,${colColors[c]}33,rgba(0,0,0,0.25))`,color:"#fff",fontWeight:900,fontSize:11.5}}>
                      {colNames[c]}
                    </button>
                  ))}
                </div>

                {/* ACTIONS */}
                {cardMenu.col!=="done" && (
                  <button onClick={()=>{ const color=colColors[cardMenu.col]; setCardMenu(null);
                      setScheduleSheet({title:card.text,color,source:"board",refId:card.id,start:9*60,dur:30,dk:planDate}); }}
                    style={{width:"100%",display:"flex",alignItems:"center",gap:12,background:GLASS,border:`1px solid ${LINE}`,
                      borderRadius:15,padding:"14px 15px",cursor:"pointer",fontFamily:FONT,marginBottom:8,textAlign:"left"}}>
                    <span style={{fontSize:17}}>🗓</span>
                    <span style={{flex:1}}>
                      <span style={{display:"block",fontSize:13.5,fontWeight:800,color:"#fff"}}>Schedule on calendar</span>
                      <span style={{display:"block",fontSize:10,color:DIM,fontWeight:700,marginTop:1}}>Pick a date & time block on the Plan page</span>
                    </span>
                    <span style={{color:FAINT,fontSize:15}}>›</span>
                  </button>
                )}
                {data.lists.length>0 && (
                  <button onClick={()=>setCardMenu({...cardMenu, mode:"lists"})}
                    style={{width:"100%",display:"flex",alignItems:"center",gap:12,background:GLASS,border:`1px solid ${LINE}`,
                      borderRadius:15,padding:"14px 15px",cursor:"pointer",fontFamily:FONT,marginBottom:8,textAlign:"left"}}>
                    <span style={{fontSize:17}}>📋</span>
                    <span style={{flex:1}}>
                      <span style={{display:"block",fontSize:13.5,fontWeight:800,color:"#fff"}}>Move to a list</span>
                      <span style={{display:"block",fontSize:10,color:DIM,fontWeight:700,marginTop:1}}>Removes it from the board</span>
                    </span>
                    <span style={{color:FAINT,fontSize:15}}>›</span>
                  </button>
                )}
                <button onClick={()=>{ boardDelete(cardMenu.col, cardMenu.cardId); setCardMenu(null); }}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:12,background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.4)",
                    borderRadius:15,padding:"14px 15px",cursor:"pointer",fontFamily:FONT,marginBottom:8,textAlign:"left"}}>
                  <span style={{fontSize:17}}>🗑</span>
                  <span style={{fontSize:13.5,fontWeight:800,color:BAD}}>Delete card</span>
                </button>
                <button style={{...C.btnSm,width:"100%",padding:"14px",marginTop:8}} onClick={()=>setCardMenu(null)}>CANCEL</button>
              </>
            ) : (
              <>
                {cardMenu.mode==="lists" ? (
                  <>
                    <div style={{...C.label,marginBottom:8}}>PICK A LIST</div>
                    <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:"42vh",overflowY:"auto"}}>
                      {data.lists.map(l=>(
                        <button key={l.id} onClick={()=>{
                            if ((l.items||[]).length===0) sendCardToList(cardMenu.col, cardMenu.cardId, l.id);
                            else setCardMenu({...cardMenu, mode:"sublist", listId:l.id});
                          }}
                          style={{display:"flex",alignItems:"center",gap:11,background:`linear-gradient(135deg,${l.color}cc,${shade(l.color,-45)})`,
                            border:"none",borderRadius:15,padding:"14px 15px",cursor:"pointer",fontFamily:FONT,textAlign:"left",
                            boxShadow:`0 4px 14px ${l.color}44`}}>
                          <span style={{width:12,height:12,borderRadius:"50%",background:"#fff",opacity:0.9,flexShrink:0}}/>
                          <span style={{fontSize:14,fontWeight:800,color:"#fff",flex:1}}>{l.name}</span>
                          <span style={{fontSize:10,fontWeight:800,color:"rgba(255,255,255,0.8)"}}>{l.items.length} items</span>
                        </button>
                      ))}
                    </div>
                    <button style={{...C.btnSm,width:"100%",padding:"14px",marginTop:12}} onClick={()=>setCardMenu({...cardMenu, mode:"actions"})}>‹ BACK</button>
                  </>
                ) : (()=>{
                  const tl = data.lists.find(x=>x.id===cardMenu.listId);
                  if (!tl) return <button style={{...C.btnSm,width:"100%",padding:"14px"}} onClick={()=>setCardMenu({...cardMenu, mode:"lists"})}>‹ BACK</button>;
                  return (
                    <>
                      <div style={{...C.label,marginBottom:8}}>WHERE IN {tl.name.toUpperCase()}?</div>
                      <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:"42vh",overflowY:"auto"}}>
                        <button onClick={()=>sendCardToList(cardMenu.col, cardMenu.cardId, tl.id, null)}
                          style={{display:"flex",alignItems:"center",gap:11,background:`linear-gradient(135deg,${tl.color}cc,${shade(tl.color,-45)})`,
                            border:"none",borderRadius:15,padding:"14px 15px",cursor:"pointer",fontFamily:FONT,textAlign:"left",
                            boxShadow:`0 4px 14px ${tl.color}44`}}>
                          <span style={{fontSize:15}}>📋</span>
                          <span style={{fontSize:14,fontWeight:800,color:"#fff",flex:1}}>Top of the list</span>
                        </button>
                        <div style={{...C.label,marginTop:6,marginBottom:2}}>OR TUCK IT UNDER</div>
                        {tl.items.map(it=>(
                          <button key={it.id} onClick={()=>sendCardToList(cardMenu.col, cardMenu.cardId, tl.id, it.id)}
                            style={{display:"flex",alignItems:"center",gap:11,background:GLASS,
                              border:`1px solid ${tl.color}55`,borderRadius:15,padding:"13px 15px",cursor:"pointer",fontFamily:FONT,textAlign:"left"}}>
                            <span style={{color:tl.color,fontSize:15,fontWeight:900,flexShrink:0}}>↳</span>
                            <span style={{fontSize:13.5,fontWeight:800,color:"#fff",flex:1,wordBreak:"break-word"}}>{it.text}</span>
                            <span style={{fontSize:10,fontWeight:800,color:FAINT,flexShrink:0}}>{(it.children||[]).length}</span>
                          </button>
                        ))}
                      </div>
                      <button style={{...C.btnSm,width:"100%",padding:"14px",marginTop:12}} onClick={()=>setCardMenu({...cardMenu, mode:"lists"})}>‹ BACK</button>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>
        );
      })()}

      {scheduleSheet && (
        <div style={C.modal} onClick={()=>setScheduleSheet(null)}>
          <div style={{...C.sheet, animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:42,height:5,background:"rgba(255,255,255,0.3)",borderRadius:3,margin:"0 auto 16px"}}/>
            <div style={{fontSize:17,fontWeight:900,color:"#fff",marginBottom:14}}>
              {scheduleSheet.id ? "Edit time block" : "Schedule a time block"}
            </div>
            {scheduleSheet.source!=="task" && (
              <>
                <div style={C.label}>TITLE</div>
                <input style={C.input} value={scheduleSheet.title} placeholder="e.g. Deep work"
                  onChange={e=>setScheduleSheet({...scheduleSheet, title:e.target.value})}/>
                <div style={{...C.label,marginTop:14}}>COLOR</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:4}}>
                  {CAT_COLORS.map(col=>(
                    <button key={col} onClick={()=>setScheduleSheet({...scheduleSheet,color:col})}
                      style={{width:30,height:30,borderRadius:"50%",background:col,cursor:"pointer",
                        border:scheduleSheet.color===col?"3px solid #fff":"2px solid rgba(255,255,255,0.2)",padding:0}}/>
                  ))}
                </div>
              </>
            )}
            {scheduleSheet.source==="task" && (
              <div style={{display:"flex",alignItems:"center",gap:10,background:`linear-gradient(135deg,${scheduleSheet.color}cc,${shade(scheduleSheet.color,-45)})`,
                borderRadius:14,padding:"11px 14px",marginBottom:6}}>
                <span style={{fontSize:14,fontWeight:900,color:"#fff"}}>{scheduleSheet.title}</span>
              </div>
            )}

            {/* DATE */}
            <div style={{...C.label,marginTop:16}}>DATE</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button style={{...C.btnSm,padding:"11px 16px"}}
                onClick={()=>setScheduleSheet(s=>{ const d=new Date(s.dk+"T00:00:00"); d.setDate(d.getDate()-1); return {...s,dk:dateKey(d)}; })}>‹</button>
              <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:900,color:"#fff"}}>
                {(()=>{ const d=new Date(scheduleSheet.dk+"T00:00:00"); return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}`; })()}
                {scheduleSheet.dk===dateKey() && <span style={{color:T.accent}}> · Today</span>}
              </div>
              <button style={{...C.btnSm,padding:"11px 16px"}}
                onClick={()=>setScheduleSheet(s=>{ const d=new Date(s.dk+"T00:00:00"); d.setDate(d.getDate()+1); return {...s,dk:dateKey(d)}; })}>›</button>
            </div>

            {/* START TIME */}
            <div style={{...C.label,marginTop:16}}>START TIME: <span style={{color:"#fff"}}>{fmtTime(scheduleSheet.start)}</span></div>
            <TimeWheel value={scheduleSheet.start} onChange={(mins)=>setScheduleSheet(s=>({...s,start:mins}))}/>

            {/* DURATION */}
            <div style={{...C.label,marginTop:16}}>DURATION: <span style={{color:"#fff"}}>{durLabel(scheduleSheet.dur)}</span></div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              {[15,30,45,60,90,120].map(m=>(
                <button key={m} onClick={()=>setScheduleSheet(s=>({...s,dur:m}))}
                  style={{flex:"1 0 28%",padding:"10px 0",borderRadius:12,cursor:"pointer",fontFamily:FONT,fontWeight:900,fontSize:12,
                    border:scheduleSheet.dur===m?"2.5px solid #fff":"2px solid rgba(255,255,255,0.2)",
                    background:scheduleSheet.dur===m?"rgba(255,255,255,0.16)":"rgba(0,0,0,0.25)",color:"#fff"}}>{durLabel(m)}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button style={{...C.btnSm,flex:1,padding:"10px 0"}} onClick={()=>setScheduleSheet(s=>({...s,dur:Math.max(5,s.dur-5)}))}>−5m</button>
              <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:900,color:"#fff"}}>{fmtTime(scheduleSheet.start)} – {fmtTime(Math.min(1439,scheduleSheet.start+scheduleSheet.dur))}</div>
              <button style={{...C.btnSm,flex:1,padding:"10px 0"}} onClick={()=>setScheduleSheet(s=>({...s,dur:Math.min(720,s.dur+5)}))}>+5m</button>
            </div>

            <div style={{display:"flex",gap:8,marginTop:20}}>
              {scheduleSheet.id && (
                <button style={{...C.btnSm,flex:1,padding:"14px",color:BAD}}
                  onClick={()=>{ removeScheduleBlock(scheduleSheet.dk, scheduleSheet.id); setScheduleSheet(null); toast$("BLOCK REMOVED","#ef4444"); }}>DELETE</button>
              )}
              <button style={{...C.btnSm,flex:1,padding:"14px"}} onClick={()=>setScheduleSheet(null)}>CANCEL</button>
              <button style={{...C.btn,flex:1,padding:"14px"}}
                onClick={()=>{
                  const s=scheduleSheet;
                  if (s.source!=="task" && !s.title.trim()) { toast$("ADD A TITLE","#ffc46b"); return; }
                  saveScheduleBlock(s.dk, {
                    id:s.id, title:s.source==="task"?s.title:s.title.trim(), color:s.color,
                    start:s.start, dur:s.dur, source:s.source, refId:s.refId||null,
                  });
                  setPlanDate(s.dk);
                  setScheduleSheet(null);
                  toast$(s.id?"BLOCK UPDATED ✓":"ADDED TO CALENDAR ✓");
                }}>{scheduleSheet.id?"SAVE":"ADD"}</button>
            </div>
          </div>
        </div>
      )}

      {/* TASK DETAIL SHEET */}
      {detailTask && (
        <div style={C.modal} onClick={()=>setDetailTaskId(null)}>
          <div style={{...C.sheet, animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:42,height:5,background:"rgba(255,255,255,0.3)",borderRadius:3,margin:"0 auto 16px"}}/>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
              <HoldRing color={detailColor} checkColor="#fff" trackColor="rgba(255,255,255,0.25)" size={76}
                reps={getReps(detailTask,today)} target={detailTask.targetReps||1}
                onComplete={(x,y)=>{ addRep(detailTask.id, today); fireBurst(x, y, detailColor, S.showXP?`+${(detailTask.points/(detailTask.targetReps||1)).toFixed(3)}`:"✦ NICE"); }}
                onShortTap={()=>toast$("HOLD TO COMPLETE")}/>
              <div style={{flex:1}}>
                <div style={{fontSize:19,color:"#fff",fontWeight:900}}>{detailTask.name}</div>
                <div style={{fontSize:11.5,color:DIM,marginTop:4,fontWeight:700}}>
                  {detailCat?.icon} {detailCat?.name} · {diffLabel(detailTask.importance??5)}
                  {S.showXP && ` · +${detailTask.points.toFixed(3)} / −${detailTask.decayRate.toFixed(3)}`}
                </div>
                <div style={{display:"flex",gap:18,marginTop:10}}>
                  {isWeekly(detailTask) ? (
                    <>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:17,color:"#ffc46b",fontWeight:900}}>🔥{weeklyStreak(detailTask)}w</div>
                        <div style={{fontSize:8,color:FAINT,fontWeight:800}}>WK STREAK</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:17,color:detailColor,fontWeight:900}}>{weeklyDone(detailTask,today)}/{weeklyTargetOf(detailTask)}</div>
                        <div style={{fontSize:8,color:FAINT,fontWeight:800}}>THIS WEEK</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:17,color:"#fff",fontWeight:900}}>{Math.round(weeklyFrac(detailTask,today)*100)}%</div>
                        <div style={{fontSize:8,color:FAINT,fontWeight:800}}>COMPLETE</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:17,color:"#ffc46b",fontWeight:900}}>🔥{getStreak(detailTask)}</div>
                        <div style={{fontSize:8,color:FAINT,fontWeight:800}}>STREAK</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:17,color:detailColor,fontWeight:900}}>{totalCompletions(detailTask)}</div>
                        <div style={{fontSize:8,color:FAINT,fontWeight:800}}>TOTAL</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:17,color:"#fff",fontWeight:900}}>LV {questLevel(detailTask)}</div>
                        <div style={{fontSize:8,color:FAINT,fontWeight:800}}>QUEST</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div style={{fontSize:9,color:FAINT,fontWeight:800,textAlign:"center",marginBottom:14}}>
              {isWeekly(detailTask)
                ? "HOLD THE RING TO LOG ONE FOR TODAY · EDIT ANY DAY BELOW"
                : "HOLD THE RING TO COMPLETE · TAP A PAST DAY BELOW TO LOG IT"}
            </div>
            {dStats && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                <div style={{background:"rgba(0,0,0,0.25)",borderRadius:16,padding:"11px 8px",textAlign:"center"}}>
                  <div style={{fontSize:21,fontWeight:900,color:dStats.rate>=80?GOOD:dStats.rate>=50?"#ffc46b":BAD}}>{dStats.rate}%</div>
                  <div style={{fontSize:8,color:FAINT,fontWeight:800,marginTop:2}}>COMPLETION RATE</div>
                </div>
                <div style={{background:"rgba(0,0,0,0.25)",borderRadius:16,padding:"11px 8px",textAlign:"center"}}>
                  <div style={{fontSize:21,fontWeight:900,color:"#fff"}}>{dStats.done}<span style={{fontSize:12,color:FAINT}}>/{dStats.expected}</span></div>
                  <div style={{fontSize:8,color:FAINT,fontWeight:800,marginTop:2}}>{dStats.weekly?"WEEKS MET":"DONE / EXPECTED"}</div>
                </div>
                <div style={{background:"rgba(0,0,0,0.25)",borderRadius:16,padding:"11px 8px",textAlign:"center"}}>
                  <div style={{fontSize:13,fontWeight:900,color:"#fff",marginTop:4}}>{dStats.start.slice(5).replace("-","/")}</div>
                  <div style={{fontSize:8,color:FAINT,fontWeight:800,marginTop:5}}>ACTIVE SINCE</div>
                </div>
              </div>
            )}
            {isWeekly(detailTask) ? (
              <>
                {/* WEEKLY PER-DAY EDITOR */}
                <div style={{background:"rgba(0,0,0,0.22)",borderRadius:20,padding:"14px 15px",marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <button onClick={()=>setWkEditCursor(c=>{ const d=new Date(c+"T00:00:00"); d.setDate(d.getDate()-7); return dateKey(d); })}
                      style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:10,color:"#fff",padding:"6px 13px",cursor:"pointer",fontSize:14,fontWeight:800}}>‹</button>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:12.5,fontWeight:900,color:"#fff"}}>
                        {(()=>{ const wk=weekKeysFor(wkEditCursor); const a=new Date(wk[0]+"T00:00:00"), b=new Date(wk[6]+"T00:00:00");
                          return `${MONTHS[a.getMonth()].slice(0,3)} ${a.getDate()} – ${MONTHS[b.getMonth()].slice(0,3)} ${b.getDate()}`; })()}
                      </div>
                      <div style={{fontSize:9,color:FAINT,fontWeight:800,marginTop:2}}>
                        {weeklyDone(detailTask, wkEditCursor)}/{weeklyTargetOf(detailTask)} this week
                      </div>
                    </div>
                    <button onClick={()=>setWkEditCursor(c=>{ const d=new Date(c+"T00:00:00"); d.setDate(d.getDate()+7); return dateKey(d); })}
                      style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:10,color:"#fff",padding:"6px 13px",cursor:"pointer",fontSize:14,fontWeight:800}}>›</button>
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    {weekKeysFor(wkEditCursor).map(dk=>{
                      const d=new Date(dk+"T00:00:00");
                      const reps=getReps(detailTask,dk);
                      const isT=dk===today;
                      const future=dk>today;
                      return (
                        <div key={dk} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                          <div style={{fontSize:8.5,fontWeight:800,color:isT?"#fff":FAINT}}>{DAYS[d.getDay()].slice(0,2).toUpperCase()}</div>
                          <div style={{fontSize:8.5,fontWeight:700,color:FAINT}}>{d.getDate()}</div>
                          <div style={{width:"100%",borderRadius:10,padding:"6px 0",textAlign:"center",
                            background: reps>0 ? detailColor : "rgba(255,255,255,0.06)",
                            border: isT?"1.5px solid #fff":`1px solid ${LINE}`,
                            fontSize:14,fontWeight:900,color:"#fff",opacity:future?0.5:1}}>{reps}</div>
                          <div style={{display:"flex",flexDirection:"column",gap:3,width:"100%"}}>
                            <button onClick={()=>weeklyAdjustDay(detailTask.id, dk, +1)} disabled={future}
                              style={{background:future?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.14)",border:"none",borderRadius:7,color:"#fff",cursor:future?"default":"pointer",fontSize:11,fontWeight:900,padding:"2px 0"}}>＋</button>
                            <button onClick={()=>weeklyAdjustDay(detailTask.id, dk, -1)} disabled={reps===0}
                              style={{background:reps===0?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.14)",border:"none",borderRadius:7,color:reps===0?"rgba(255,255,255,0.3)":"#fff",cursor:reps===0?"default":"pointer",fontSize:11,fontWeight:900,padding:"2px 0"}}>－</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{fontSize:9,color:FAINT,fontWeight:700,textAlign:"center",marginTop:10}}>
                    TAP ＋ / － ON ANY DAY · USE ‹ › TO FIX PAST WEEKS
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  {getReps(detailTask,today)>0 && (
                    <button style={{...C.btnSm,flex:1,padding:"13px",color:BAD}}
                      onClick={()=>clearDay(detailTask.id, today)}>↺ CLEAR</button>
                  )}
                  <button style={{...C.btnSm,flex:1,padding:"13px"}}
                    onClick={()=>{ setEditTask({...detailTask}); setDetailTaskId(null); setView("editTask"); }}>✎ EDIT</button>
                  <button style={{...C.btnSm,flex:1,padding:"13px",color:"#ffc46b"}}
                    onClick={()=>setConfirmBox({type:"questReset",id:detailTask.id,name:detailTask.name})}>↺ RESET</button>
                  <button style={{...C.btn,flex:1,padding:"13px"}} onClick={()=>setDetailTaskId(null)}>DONE</button>
                </div>
              </>
            ) : (
              <>
            <div style={{background:"rgba(0,0,0,0.22)",borderRadius:20,padding:"14px 15px",marginBottom:12}}>
              <MonthCalendar task={detailTask} color={detailColor}
                viewYear={calCursor.y} viewMonth={calCursor.m}
                onPrev={()=>setCalCursor(c=>c.m===0?{y:c.y-1,m:11}:{y:c.y,m:c.m-1})}
                onNext={()=>setCalCursor(c=>c.m===11?{y:c.y+1,m:0}:{y:c.y,m:c.m+1})}
                onToggleDay={(dk)=>toggleDay(detailTask.id, dk)}/>
            </div>
            {(()=>{
              const y = new Date(); y.setDate(y.getDate()-1);
              const yk = dateKey(y);
              const missedYest = isScheduledOn(detailTask,yk) && !isCompletedOn(detailTask,yk) && !((detailTask.frozen||{})[yk]);
              if (!missedYest) return null;
              const owned = data.wallet.shields||0;
              return (
                <button onClick={()=> owned>0 ? useShield(detailTask.id, yk) : setView("shop") || setDetailTaskId(null)}
                  style={{width:"100%",marginBottom:10,display:"flex",alignItems:"center",gap:11,background:"rgba(157,180,255,0.12)",
                    border:"1.5px solid rgba(157,180,255,0.45)",borderRadius:15,padding:"12px 14px",cursor:"pointer",fontFamily:FONT,textAlign:"left"}}>
                  <span style={{fontSize:18}}>🛡</span>
                  <span style={{flex:1}}>
                    <span style={{display:"block",fontSize:12.5,fontWeight:800,color:"#fff"}}>Yesterday was missed — shield it</span>
                    <span style={{display:"block",fontSize:9.5,color:DIM,fontWeight:700,marginTop:1}}>
                      {owned>0 ? `Streak survives, decay refunded · ${owned} shield${owned>1?"s":""} owned` : "No shields owned — tap to visit the shop"}
                    </span>
                  </span>
                </button>
              );
            })()}
            <div style={{display:"flex",gap:8}}>
              {getReps(detailTask,today)>0 && (
                <button style={{...C.btnSm,flex:1,padding:"13px",color:BAD}}
                  onClick={()=>clearDay(detailTask.id, today)}>↺ CLEAR</button>
              )}
              <button style={{...C.btnSm,flex:1,padding:"13px"}}
                onClick={()=>{ setEditTask({...detailTask}); setDetailTaskId(null); setView("editTask"); }}>✎ EDIT</button>
              <button style={{...C.btnSm,flex:1,padding:"13px",color:"#ffc46b"}}
                onClick={()=>setConfirmBox({type:"questReset",id:detailTask.id,name:detailTask.name})}>↺ RESET</button>
              <button style={{...C.btn,flex:1,padding:"13px"}} onClick={()=>setDetailTaskId(null)}>DONE</button>
            </div>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{position:"relative",zIndex:1}}>
        {/* ══ HEADER ══ */}
        <div style={C.header}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:18,fontWeight:900,color:"#fff",textShadow:"0 2px 10px rgba(0,0,0,0.4)"}}>Life RPG</div>
              <div style={{fontSize:10,color:DIM,fontWeight:800}}>{dateLabel}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,background:GLASS,backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",borderRadius:20,padding:"6px 12px",border:`1px solid ${LINE}`}}>
              <div style={{fontSize:13,fontWeight:900,color:allDone?GOOD:"#fff"}}>{todayDone}<span style={{color:FAINT}}>/{todayTasks.length}</span></div>
              <div style={{position:"relative",width:26,height:26}}>
                <svg width="26" height="26">
                  <circle cx="13" cy="13" r="10" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3.5"/>
                  <circle cx="13" cy="13" r="10" fill="none" stroke={allDone?GOOD:"#fff"} strokeWidth="3.5" strokeLinecap="round"
                    strokeDasharray={2*Math.PI*10}
                    strokeDashoffset={2*Math.PI*10*(1-(todayTasks.length?todayDone/todayTasks.length:0))}
                    transform="rotate(-90 13 13)" style={{transition:"stroke-dashoffset .4s ease"}}/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ══ DASHBOARD ══ */}
        {view==="dashboard" && (
          <div>
            {/* HERO SCENE — character in the landscape */}
            <div style={{position:"relative",height:252,overflow:"hidden",marginBottom:4}}>
              <Scene T={T} height={252}/>
              <div style={{position:"absolute",top:6,left:0,right:0,textAlign:"center"}}>
                <div style={{display:"inline-flex",alignItems:"center",gap:7,background:GLASS,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:`1px solid ${LINE}`,borderRadius:20,padding:"5px 14px"}}>
                  <span style={{fontSize:11,fontWeight:900,color:T.accent}}>LV {level.lvl}</span>
                  <span style={{fontSize:11,fontWeight:800,color:"#fff"}}>{getTitle(data, level.lvl)}</span>
                </div>
                <div key={rating} style={{fontSize:78,fontWeight:900,color:"#fff",lineHeight:1,marginTop:4,textShadow:"0 4px 24px rgba(0,0,0,0.45)",animation:"popIn .45s ease"}}>{rating}</div>
                <div style={{fontSize:11,letterSpacing:3,color:"rgba(255,255,255,0.85)",fontWeight:900,marginTop:2,textShadow:"0 1px 8px rgba(0,0,0,0.4)"}}>{tier.label}{titleItem ? ` · ${titleItem.name}` : ""}</div>
              </div>
              {/* Coin / Gem HUD */}
              <div style={{position:"absolute",top:8,right:12,display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                <div style={{display:"flex",alignItems:"center",gap:5,background:GLASS,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:`1px solid ${LINE}`,borderRadius:14,padding:"4px 10px"}}>
                  <span style={{fontSize:12}}>🪙</span><span style={{fontSize:12,fontWeight:900,color:"#fcd34d"}}>{coins}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5,background:GLASS,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:`1px solid ${LINE}`,borderRadius:14,padding:"4px 10px"}}>
                  <span style={{fontSize:12}}>💎</span><span style={{fontSize:12,fontWeight:900,color:"#67e8f9"}}>{gems}</span>
                </div>
              </div>
              <div style={{position:"absolute",bottom:6,left:"50%",transform:"translateX(-50%)"}}>
                <PixelCharacter level={level.lvl} character={cz} scale={4.6} idle cosmetics={cosmetics} pet={pet}/>
              </div>
            </div>

            <div style={{padding:"0 16px"}}>
              {/* LEVEL PROGRESS */}
              <div style={{...C.glass,padding:"13px 16px"}}>
                <div style={{height:11,background:"rgba(0,0,0,0.3)",borderRadius:6,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${level.lvl===14?100:lvlProgress}%`,background:"linear-gradient(90deg,rgba(255,255,255,0.75),#ffffff)",borderRadius:6,boxShadow:"0 0 12px rgba(255,255,255,0.6)",transition:"width .6s ease"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:DIM,marginTop:6,fontWeight:800}}>
                  <span>LV {level.lvl}</span>
                  {level.lvl<14
                    ? <span style={{color:"#fff"}}>{level.ratingForNext - rating} pts to {getTitle(data, level.lvl+1)}</span>
                    : <span style={{color:T.accent}}>MAX LEVEL</span>}
                  <span>LV {level.lvl===14?"MAX":level.lvl+1}</span>
                </div>
                <div style={{display:"flex",gap:8,marginTop:10}}>
                  <div style={{flex:1,background:"rgba(0,0,0,0.22)",borderRadius:14,padding:"8px 11px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:9,color:GOOD,fontWeight:900}}>ALL DONE</span>
                    <span style={{fontSize:16,fontWeight:900,color:GOOD}}>{ratingIfAllDone}</span>
                  </div>
                  <div style={{flex:1,background:"rgba(0,0,0,0.22)",borderRadius:14,padding:"8px 11px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:9,color:BAD,fontWeight:900}}>NONE DONE</span>
                    <span style={{fontSize:16,fontWeight:900,color:BAD}}>{ratingIfNoneDone}</span>
                  </div>
                </div>
                <div style={{marginTop:11,paddingTop:10,borderTop:`1px solid ${LINE}`,textAlign:"center"}}>
                  <div style={{fontSize:12,color:DIM,fontStyle:"italic",lineHeight:1.5,fontWeight:600}}>"{qText}"</div>
                  <div style={{fontSize:9,color:FAINT,marginTop:3,fontWeight:800,letterSpacing:1}}>— {qAuthor.toUpperCase()}</div>
                </div>
              </div>

              {/* STAT DISPLAY */}
              {S.statStyle === "radar" && (
                <div style={C.glass}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{...C.label,marginBottom:0}}>STAT CHART</div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:16,height:2,background:"#fff",borderRadius:1}}/><div style={{fontSize:8.5,color:DIM,fontWeight:800}}>NOW</div></div>
                      <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:16,height:0,borderTop:`2px dashed ${GOOD}`}}/><div style={{fontSize:8.5,color:GOOD,fontWeight:800}}>POTENTIAL</div></div>
                    </div>
                  </div>
                  <div style={{display:"flex",justifyContent:"center"}}>
                    <RadarChart categories={data.categories} ghostCategories={ghostCategories} accent={T.accent}/>
                  </div>
                </div>
              )}
              {S.statStyle === "bars" && (
                <div style={C.glass}>
                  <div style={C.label}>ATTRIBUTES</div>
                  {data.categories.map(c=>{
                    const pct = (c.value/c.maxValue)*100;
                    const ghost = ghostCategories.find(g=>g.id===c.id);
                    const gpct = ghost ? (ghost.value/c.maxValue)*100 : pct;
                    return (
                      <div key={c.id} style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                          <span style={{fontSize:13,fontWeight:800,color:"#fff"}}>{c.icon} {c.name}</span>
                          <span style={{fontSize:12,fontWeight:900,color:"#fff"}}>{S.showXP ? c.value.toFixed(2) : `${Math.round(pct)}%`}</span>
                        </div>
                        <div style={{height:11,background:"rgba(0,0,0,0.3)",borderRadius:6,overflow:"hidden",position:"relative"}}>
                          {gpct > pct && <div style={{position:"absolute",inset:0,width:`${gpct}%`,background:`${c.color}44`,borderRadius:6}}/>}
                          <div style={{position:"absolute",inset:0,width:`${pct}%`,background:c.color,borderRadius:6,boxShadow:`0 0 10px ${c.color}88`,transition:"width .6s ease"}}/>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{fontSize:8.5,color:FAINT,textAlign:"center",fontWeight:800,marginTop:4}}>LIGHTER ZONE = TODAY'S POTENTIAL</div>
                </div>
              )}

              {/* TODAY'S QUESTS */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",margin:"6px 2px 11px"}}>
                <div style={C.sectionTitle}>Today's Quests</div>
                <div style={{fontSize:11,color:DIM,fontWeight:800}}>{todayDone} of {todayTasks.length}</div>
              </div>
              {(()=>{
                const ch = dailyChallengeFor(data, today);
                if (!ch) return null;
                const claimed = !!(data.challengeClaims||{})[today];
                let progress=0, label="";
                if (ch.type==="count"){ progress=todayDone; label=`Complete ${ch.n} quests today`; }
                else if (ch.type==="cat"){ const cat=data.categories.find(c=>c.id===ch.catId);
                  progress=data.tasks.filter(t=>t.catId===ch.catId&&!isWeekly(t)&&isScheduledOn(t,today)&&isCompletedOn(t,today)).length;
                  label=`Finish every ${cat?cat.name:""} quest today`; }
                else { progress=weeklyHabits.reduce((a,t)=>a+(getReps(t,today)||0),0); label=`Log ${ch.n} weekly-habit reps today`; }
                const met = progress>=ch.goal;
                const pct = Math.min(100,(progress/ch.goal)*100);
                const comboHot = data.combo && (Date.now()-(data.combo.lastAt||0))<=COMBO_WINDOW_MS && (data.combo.count||0)>=1;
                return (
                  <div style={{...C.glass, border:`1.5px solid ${claimed?LINE:`${T.accent}66`}`, marginBottom:11, padding:"13px 15px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{fontSize:24}}>{claimed?"🏅":"🎯"}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:9,fontWeight:900,letterSpacing:1.5,color:T.accent}}>DAILY CHALLENGE</div>
                        <div style={{fontSize:13.5,fontWeight:800,color:"#fff",marginTop:2}}>{label}</div>
                        <div style={{height:6,borderRadius:4,background:"rgba(0,0,0,0.3)",marginTop:8,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,borderRadius:4,background:T.accent,transition:"width .4s"}}/>
                        </div>
                      </div>
                      {claimed ? (
                        <div style={{fontSize:10,fontWeight:900,color:GOOD,whiteSpace:"nowrap"}}>DONE ✓</div>
                      ) : met ? (
                        <button onClick={()=>claimChallenge(ch.gems)} style={{...C.btn,padding:"11px 14px",fontSize:11,whiteSpace:"nowrap",animation:"glowPulse 1.6s ease-in-out infinite"}}>CLAIM +{ch.gems} 💎</button>
                      ) : (
                        <div style={{textAlign:"center",whiteSpace:"nowrap"}}>
                          <div style={{fontSize:14,fontWeight:900,color:"#fff"}}>{Math.min(progress,ch.goal)}/{ch.goal}</div>
                          <div style={{fontSize:8.5,fontWeight:800,color:DIM}}>+{ch.gems} 💎</div>
                        </div>
                      )}
                    </div>
                    {comboHot && (
                      <div style={{fontSize:9.5,fontWeight:800,color:"#ff9a4e",marginTop:9}}>
                        🔥 MOMENTUM — next quest pays x{COMBO_MULT[Math.min(2,(data.combo.count||0))]} coins
                      </div>
                    )}
                  </div>
                );
              })()}
              {(()=>{
                if (S.bossEnabled === false) return null;
                const boss = bossForWeek(data, today);
                if (!boss) return null;
                const claimed = !!(data.bossClaims||{})[boss.wkStart];
                const dead = boss.dmg >= boss.hp;
                const pct = Math.max(0,((boss.hp-boss.dmg)/boss.hp)*100);
                return (
                  <div onClick={()=>setView("boss")} style={{...C.glass, marginBottom:11, padding:"10px 14px", cursor:"pointer",
                    display:"flex",alignItems:"center",gap:11, border:`1px solid ${claimed?LINE:dead?"#34d39966":"#ef444455"}`}}>
                    <span style={{fontSize:19,filter:(dead||claimed)?"grayscale(1)":"none"}}>{boss.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11.5,fontWeight:900,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {boss.title} {claimed && <span style={{color:GOOD}}>· slain ✓</span>}{!claimed && dead && <span style={{color:GOOD}}>· defeated — claim!</span>}
                      </div>
                      {!claimed && (
                        <div style={{height:5,borderRadius:3,background:"rgba(0,0,0,0.35)",marginTop:5,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#ef4444,#f87171)",borderRadius:3}}/>
                        </div>
                      )}
                    </div>
                    <span style={{color:FAINT,fontSize:15}}>›</span>
                  </div>
                );
              })()}
              {spinsAvail > 0 && (
                <div onClick={openSpin} style={{
                  background:`linear-gradient(135deg,${shade(T.accent,-40)},${T.accent},${T.sun})`,borderRadius:20,padding:"14px 16px",marginBottom:11,
                  cursor:"pointer",display:"flex",alignItems:"center",gap:12,boxShadow:`0 8px 26px ${T.accent}55`,
                  animation:"glowPulse 1.8s ease-in-out infinite"}}>
                  <div style={{fontSize:30}}>🎰</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:900,color:"#fff"}}>{spinsAvail} SPIN{spinsAvail>1?"S":""} READY!</div>
                    <div style={{fontSize:10.5,fontWeight:700,color:"rgba(255,255,255,0.9)"}}>Tap to play · {SPIN_COST} 🪙 per pull · win 💎</div>
                  </div>
                  <div style={{fontSize:20,color:"#fff"}}>›</div>
                </div>
              )}
              {canClaimPerfect && (
                <div onClick={claimPerfectDay} style={{
                  background:"linear-gradient(135deg,#f59e0b,#fcd34d)",borderRadius:20,padding:"14px 16px",marginBottom:11,
                  cursor:"pointer",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 26px rgba(245,158,11,0.5)",
                  animation:"glowPulse 1.4s ease-in-out infinite"}}>
                  <div style={{fontSize:30}}>🏆</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:900,color:"#3a2200"}}>PERFECT DAY!</div>
                    <div style={{fontSize:10.5,fontWeight:800,color:"#5a3600"}}>Claim your +{PERFECT_DAY_BONUS_GEMS} 💎 jackpot</div>
                  </div>
                  <div style={{fontSize:20,color:"#3a2200"}}>›</div>
                </div>
              )}
              {allDone && (
                <div style={{...C.glass,textAlign:"center",border:`1.5px solid ${GOOD}66`}}>
                  <div style={{fontSize:15,fontWeight:900,color:GOOD}}>✦ SUMMIT REACHED ✦</div>
                  <div style={{fontSize:11.5,color:DIM,marginTop:4,fontWeight:600}}>Every quest complete. The realm rests easy tonight.</div>
                </div>
              )}
              {todayTasks.length===0 && (
                <div style={{...C.glass,textAlign:"center",color:DIM,fontSize:13,fontWeight:600}}>No quests scheduled today.</div>
              )}
              {(()=>{
                // True running order — independent of what's checked off, so the bar can't drift.
                const byOrder = [...todayTasks].sort((x,y)=>(x.order??0)-(y.order??0));
                const ids = byOrder.map(t=>t.id);
                const n = Math.max(0, Math.min(byOrder.length, barPreview!=null ? barPreview : priBarPos));
                const prio = new Set(byOrder.slice(0,n).map(t=>t.id));
                const settle = (arr)=>[...arr].sort((x,y)=>{
                  const xd=isCompletedOn(x,today)?1:0, yd=isCompletedOn(y,today)?1:0;
                  if (xd!==yd) return xd-yd;
                  return (x.order??0)-(y.order??0);
                });
                // While dragging, hold pure order so nothing shuffles under your thumb.
                const above = barDrag ? byOrder.slice(0,n) : settle(byOrder.slice(0,n));
                const below = barDrag ? byOrder.slice(n)   : settle(byOrder.slice(n));
                const row = (t)=>(
                  <div key={t.id} data-qrow="1">
                    <QuestCard task={t} showReorder siblingIds={ids} priority={prio.has(t.id)}/>
                  </div>
                );
                return (<>
                  {above.map(row)}
                  {byOrder.length>0 && (
                    <div key="pribar" style={{position:"relative",height:38,marginBottom:11,marginTop:1}}>
                      <div style={{position:"absolute",left:0,right:0,top:18,height:3,borderRadius:2,
                        background:`linear-gradient(90deg,${PRI}00 0%,${PRI} 9%,${PRI} 91%,${PRI}00 100%)`,
                        boxShadow:`0 0 14px ${PRI}88`}}/>
                      <div style={{position:"absolute",left:8,top:6,background:"#180f04",
                        border:`1.5px solid ${PRI}66`,borderRadius:11,padding:"4px 10px",
                        fontSize:8.5,fontWeight:900,color:PRI,letterSpacing:1,whiteSpace:"nowrap",pointerEvents:"none"}}>
                        {n>0 ? `⚑ ${n} MUST-DO BY TONIGHT` : "⚑ DRAG THE KNOB DOWN"}
                      </div>
                      <div
                        onPointerDown={e=>{
                          e.stopPropagation(); e.preventDefault();
                          try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                          barDragRef.current = true; setBarDrag(true);
                          barPreviewRef.current = priBarPos; setBarPreview(priBarPos);
                          try { navigator.vibrate && navigator.vibrate(14); } catch {}
                        }}
                        onPointerMove={e=>{
                          if (!barDragRef.current) return;
                          e.preventDefault(); e.stopPropagation();
                          const rows = Array.from(document.querySelectorAll('[data-qrow="1"]'));
                          let idx = 0;
                          for (const r of rows) { const b2 = r.getBoundingClientRect(); if (b2.top + b2.height/2 < e.clientY) idx++; }
                          idx = Math.max(0, Math.min(rows.length, idx));
                          if (idx !== barPreviewRef.current) {
                            barPreviewRef.current = idx; setBarPreview(idx);
                            try { navigator.vibrate && navigator.vibrate(7); } catch {}
                          }
                        }}
                        onPointerUp={e=>{
                          if (!barDragRef.current) return;
                          e.preventDefault(); e.stopPropagation();
                          try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                          const finalIdx = barPreviewRef.current ?? priBarPos;
                          barDragRef.current = false; setBarDrag(false);
                          barPreviewRef.current = null; setBarPreview(null);
                          setPriBar(finalIdx, true);
                          try { navigator.vibrate && navigator.vibrate([10,25,10]); } catch {}
                        }}
                        onPointerCancel={()=>{
                          const finalIdx = barPreviewRef.current ?? priBarPos;
                          barDragRef.current = false; setBarDrag(false);
                          barPreviewRef.current = null; setBarPreview(null);
                          setPriBar(finalIdx, true);
                        }}
                        style={{position:"absolute",right:-17,top:-4,width:46,height:46,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          cursor:"grab",touchAction:"none",userSelect:"none",WebkitUserSelect:"none",
                          WebkitTapHighlightColor:"transparent",zIndex:6}}>
                        <div style={{width:32,height:32,borderRadius:16,
                          background:`linear-gradient(160deg,#ffd27a 0%,${PRI} 45%,#c96a06 100%)`,
                          border:"2px solid #1a1004",pointerEvents:"none",
                          boxShadow:barDrag?`0 0 24px ${PRI}, 0 4px 12px rgba(0,0,0,0.6)`:`0 0 12px ${PRI}66, 0 3px 9px rgba(0,0,0,0.5)`,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          transform:barDrag?"scale(1.2)":"scale(1)",transition:"transform .12s, box-shadow .12s"}}>
                          <div style={{fontSize:14,fontWeight:900,color:"#1a1004",lineHeight:1}}>⇕</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {below.map(row)}
                </>);
              })()}

              {/* THIS WEEK — frequency-based habits (do X times, any days) */}
              {weeklyHabits.length>0 && S.weeklyOnHome!==false && (
                <>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",margin:"18px 2px 11px"}}>
                    <div style={C.sectionTitle}>This Week</div>
                    <div style={{fontSize:11,color:DIM,fontWeight:800}}>
                      {weeklyHabits.filter(t=>weeklyMet(t,today)).length} of {weeklyHabits.length} done
                    </div>
                  </div>
                  {(()=>{ const ws=weeklyHabits.sort((a,b)=>(a.order??0)-(b.order??0)); const ids=ws.map(t=>t.id); return ws.map(task=><WeeklyCard key={task.id} task={task} showReorder siblingIds={ids}/>); })()}
                  <div style={{fontSize:9,color:FAINT,textAlign:"center",fontWeight:700,marginTop:-2,marginBottom:4}}>
                    TAP THE RING TO LOG ONE · DO THESE ANY DAYS YOU LIKE
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ QUESTS (HabitKit-style grid) ══ */}
        {view==="tasks" && (()=>{
          const wk7 = last7Keys();
          const todayK = dateKey();
          const sortedTasks = [...data.tasks]
            .filter(t=>t.catId && data.categories.find(c=>c.id===t.catId) && !isWeekly(t))
            .sort((a,b)=>(a.order??0)-(b.order??0));
          const weeklyList = data.tasks
            .filter(t=>t.catId && data.categories.find(c=>c.id===t.catId) && isWeekly(t))
            .sort((a,b)=>(a.order??0)-(b.order??0));
          return (
          <div style={{padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={C.sectionTitle}>All Quests</div>
              <div style={{display:"flex",gap:8}}>
                <button style={{...C.btnSm,padding:"10px 14px",fontSize:11.5}} onClick={()=>{ setForecastDate(dateKey()); setView("forecast"); }}>📅 FORECAST</button>
                <button style={{...C.btn,padding:"10px 16px",fontSize:11.5}} onClick={()=>setView("addTask")}>+ NEW</button>
              </div>
            </div>
            {/* Day header (HabitKit style) */}
            <div style={{display:"flex",alignItems:"flex-end",gap:10,marginBottom:8,padding:"0 13px"}}>
              <div style={{background:"rgba(0,0,0,0.3)",borderRadius:12,padding:"6px 12px",fontSize:10.5,fontWeight:800,color:"#fff"}}>Last 7 days</div>
              <div style={{flex:1}}/>
              <div style={{display:"flex",gap:4}}>
                {wk7.map(dk=>{
                  const d = new Date(dk+"T00:00:00");
                  const isT = dk===todayK;
                  return (
                    <div key={dk} style={{width:22,textAlign:"center"}}>
                      <div style={{fontSize:8.5,fontWeight:isT?900:700,color:isT?"#fff":FAINT}}>{DAYS[d.getDay()].slice(0,2)}</div>
                      <div style={{fontSize:8.5,fontWeight:isT?900:700,color:isT?"#fff":FAINT}}>{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{width:20}}/>
            </div>
            {sortedTasks.map((task,idx)=>{
              const cat = data.categories.find(c=>c.id===task.catId);
              const color = task.color || cat?.color || T.accent;
              const streak = getStreak(task);
              return (
                <div key={task.id}
                  onClick={()=>{ setDetailTaskId(task.id); setCalCursor({y:new Date().getFullYear(), m:new Date().getMonth()}); }}
                  style={{...C.glass,padding:"11px 13px",marginBottom:9,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:38,height:38,borderRadius:12,flexShrink:0,background:`${color}33`,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>
                    {cat?.icon}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13.5,fontWeight:800,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{task.name}</div>
                    <div style={{fontSize:9,color:DIM,fontWeight:700,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {isWeekly(task)
                        ? <span><span style={{color,fontWeight:900}}>{weeklyDone(task,today)}/{weeklyTargetOf(task)} this week</span> · weekly</span>
                        : ((task.days||[]).length===7 ? "Every day" : (task.days||[]).map(d=>DAYS[d].slice(0,2)).join(" "))}
                      {!isWeekly(task) && streak>=2 && <span style={{color:"#ffc46b"}}> · 🔥{streak}</span>}
                      {isWeekly(task) && weeklyStreak(task)>=1 && <span style={{color:"#ffc46b"}}> · 🔥{weeklyStreak(task)}w</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                    {wk7.map(dk=>{
                      const wk = isWeekly(task);
                      const sched = wk ? true : isScheduledOn(task, dk);
                      const done = wk ? (getReps(task,dk)>0) : isCompletedOn(task, dk);
                      const partial = !wk && !done && getReps(task, dk) > 0;
                      const isT = dk===todayK;
                      const future = dk > todayK;
                      // Strong, legible states:
                      //  done = solid color · scheduled (not done) = bright tinted w/ outline · rest day = dim flat
                      let bg, brd;
                      if (done) { bg = color; brd = "none"; }
                      else if (partial) { bg = `${color}77`; brd = `1.5px solid ${color}`; }
                      else if (sched) { bg = `${color}3a`; brd = `1.5px solid ${color}aa`; }
                      else { bg = "rgba(255,255,255,0.05)"; brd = "1.5px solid rgba(255,255,255,0.08)"; }
                      return (
                        <button key={dk}
                          onClick={e=>{ e.stopPropagation(); if (dk<=todayK) toggleDay(task.id, dk); }}
                          style={{
                            width:22,height:22,borderRadius:7,padding:0,cursor:dk<=todayK?"pointer":"default",
                            background: bg, border: brd, boxSizing:"border-box",
                            opacity: future && !sched ? 0.5 : future ? 0.8 : 1,
                            boxShadow: done ? `0 0 8px ${color}88` : "none",
                            outline: isT ? "2px solid #ffffff" : "none", outlineOffset: isT ? "1px" : 0,
                          }}/>
                      );
                    })}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0}}>
                    <button onClick={e=>{e.stopPropagation(); moveTask(task.id,-1);}}
                      style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:6,color:idx===0?FAINT:"#fff",fontSize:9,cursor:"pointer",padding:"2px 5px",fontWeight:900}}>▲</button>
                    <button onClick={e=>{e.stopPropagation(); setEditTask({...task}); setView("editTask");}}
                      style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:6,color:DIM,fontSize:9,cursor:"pointer",padding:"2px 5px"}}>✎</button>
                    <button onClick={e=>{e.stopPropagation(); moveTask(task.id,1);}}
                      style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:6,color:idx===sortedTasks.length-1?FAINT:"#fff",fontSize:9,cursor:"pointer",padding:"2px 5px",fontWeight:900}}>▼</button>
                  </div>
                </div>
              );
            })}
            {weeklyList.length>0 && (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",margin:"20px 2px 11px"}}>
                  <div style={C.sectionTitle}>This Week</div>
                  <div style={{fontSize:11,color:DIM,fontWeight:800}}>
                    {weeklyList.filter(t=>weeklyMet(t,today)).length} of {weeklyList.length} done
                  </div>
                </div>
                {(()=>{ const ids=weeklyList.map(t=>t.id); return weeklyList.map(task=><WeeklyCard key={task.id} task={task} showReorder siblingIds={ids}/>); })()}
                <div style={{fontSize:9,color:FAINT,textAlign:"center",fontWeight:700,marginTop:-2,marginBottom:4}}>
                  TAP THE RING TO LOG ONE · DO THESE ANY DAYS YOU LIKE
                </div>
              </>
            )}
            {orphanTasks.length>0 && (
              <div style={{...C.glass,marginTop:12,border:"1.5px solid #ffc46b66"}}>
                <div style={{...C.label,color:"#ffc46b"}}>NEEDS A CATEGORY</div>
                {orphanTasks.map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
                    <div style={{flex:1,fontSize:13.5,color:"#fff",fontWeight:600}}>{t.name}</div>
                    <select style={{...C.select,width:140,padding:"9px 11px",fontSize:12.5}} value=""
                      onChange={e=>{ if(e.target.value) update({...data, tasks:data.tasks.map(x=>x.id===t.id?{...x,catId:e.target.value}:x)}); }}>
                      <option value="">Assign...</option>
                      {data.categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                    <button onClick={()=>setConfirmBox({type:"task",id:t.id,name:t.name})}
                      style={{background:"none",border:"none",color:FAINT,fontSize:16,cursor:"pointer"}}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          );
        })()}

        {/* ══ ADD / EDIT QUEST ══ */}
        {(view==="addTask"||view==="editTask") && (()=> {
          const isEdit = view==="editTask";
          const t = isEdit ? editTask : newTask;
          const set = isEdit ? (u)=>setEditTask({...editTask,...u}) : (u)=>setNewTask({...newTask,...u});
          if (!t) return null;
          return (
            <div style={{padding:"14px 16px"}}>
              <div style={{...C.sectionTitle,marginBottom:12}}>{isEdit?"Edit Quest":"New Quest"}</div>
              <div style={C.glass}>
                <div style={C.label}>QUEST NAME</div>
                <input style={C.input} value={t.name} placeholder="e.g. Morning run"
                  onChange={e=>set({name:e.target.value})}/>
                <div style={{...C.label,marginTop:16}}>CATEGORY</div>
                <select style={C.select} value={t.catId||""} onChange={e=>set({catId:e.target.value})}>
                  {data.categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
                <div style={{...C.label,marginTop:16}}>QUEST COLOR</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
                  <button onClick={()=>set({color:null})}
                    style={{height:30,padding:"0 12px",borderRadius:15,border:!t.color?"2.5px solid #fff":"2px solid rgba(255,255,255,0.2)",
                      background:"rgba(0,0,0,0.25)",color:"#fff",fontSize:10,fontWeight:900,cursor:"pointer",fontFamily:FONT}}>AUTO</button>
                  {CAT_COLORS.map(col=>(
                    <button key={col} onClick={()=>set({color:col})}
                      style={{width:30,height:30,borderRadius:"50%",background:col,cursor:"pointer",
                        border:t.color===col?"3px solid #fff":"2px solid rgba(255,255,255,0.2)",padding:0}}/>
                  ))}
                </div>
                <div style={{fontSize:9.5,color:FAINT,marginTop:6,fontWeight:700}}>AUTO uses the category's color</div>
                <div style={{marginTop:16}}>
                  <ImportanceBlock value={t.importance??5} onChange={v=>set({importance:v})}/>
                </div>
                <div style={{...C.label,marginTop:16}}>FREQUENCY</div>
                <div style={{display:"flex",gap:8,marginBottom:4}}>
                  <button style={C.chip((t.freq||"daily")==="daily")} onClick={()=>set({freq:"daily"})}>SCHEDULED DAYS</button>
                  <button style={C.chip(t.freq==="weekly")} onClick={()=>set({freq:"weekly"})}>X PER WEEK</button>
                </div>
                <div style={{fontSize:9.5,color:FAINT,marginBottom:8,fontWeight:700,lineHeight:1.4}}>
                  {t.freq==="weekly"
                    ? "Do it any days you like — hit your weekly target to reach 100%."
                    : "Pick the exact days this quest is due each week."}
                </div>
                {t.freq==="weekly" ? (
                  <>
                    <div style={{...C.label,marginTop:8}}>TIMES PER WEEK: <span style={{color:"#fff"}}>{t.weeklyTarget||3}</span></div>
                    <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center",marginBottom:8}}>
                      {[1,2,3,5,7,10,15,20].map(n=>(
                        <button key={n} onClick={()=>set({weeklyTarget:n})}
                          style={{height:34,minWidth:38,padding:"0 10px",borderRadius:13,cursor:"pointer",fontFamily:FONT,fontWeight:900,fontSize:12.5,
                            border:(t.weeklyTarget||3)===n?"2.5px solid #fff":"2px solid rgba(255,255,255,0.2)",
                            background:(t.weeklyTarget||3)===n?"rgba(255,255,255,0.16)":"rgba(0,0,0,0.25)",color:"#fff"}}>{n}</button>
                      ))}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:11,color:DIM,fontWeight:700}}>Custom:</span>
                      <input type="number" min="1" max="999" value={t.weeklyTarget||3}
                        onChange={e=>{ const v=parseInt(e.target.value); set({weeklyTarget: isNaN(v)?1:Math.max(1,Math.min(999,v))}); }}
                        style={{...C.input,width:90,padding:"10px 12px",textAlign:"center"}}/>
                      <span style={{fontSize:11,color:FAINT,fontWeight:700}}>per week</span>
                    </div>
                    <div style={{fontSize:9.5,color:FAINT,marginTop:8,fontWeight:700,lineHeight:1.4}}>
                      Tap to log each one as you do it — great for goals like "20 job applications a week."
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{...C.label,marginTop:8}}>TIMES PER DAY: <span style={{color:"#fff"}}>{t.targetReps||1}</span></div>
                    <input type="range" min="1" max="20" step="1" value={t.targetReps||1}
                      onChange={e=>set({targetReps:parseInt(e.target.value)})}
                      style={{width:"100%",accentColor:"#ffffff"}}/>
                    <div style={{...C.label,marginTop:16}}>SCHEDULED DAYS</div>
                    <div style={{display:"flex",gap:6,justifyContent:"space-between"}}>
                      {DAYS.map((d,i)=>(
                        <button key={d} style={C.dayBtn((t.days||[]).includes(i))}
                          onClick={()=>{
                            const days = (t.days||[]).includes(i) ? t.days.filter(x=>x!==i) : [...(t.days||[]),i];
                            set({days});
                          }}>{d.slice(0,2).toUpperCase()}</button>
                      ))}
                    </div>
                  </>
                )}
                <div style={{display:"flex",gap:8,marginTop:20}}>
                  <button style={{...C.btnSm,flex:1,padding:"14px"}} onClick={()=>{isEdit?setEditTask(null):null; setView("tasks");}}>CANCEL</button>
                  {isEdit && (
                    <button style={{...C.btnSm,flex:1,padding:"14px",color:BAD}}
                      onClick={()=>setConfirmBox({type:"task",id:t.id,name:t.name})}>DELETE</button>
                  )}
                  <button style={{...C.btn,flex:1,padding:"14px"}} onClick={isEdit?saveEditTask:addTask}>
                    {isEdit?"SAVE":"CREATE"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══ BOARD (Reminders hub + draggable kanban) ══ */}
        {view==="board" && S.kanbanEnabled && (
          <div style={{padding:"14px 16px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[
                { label:"To Do", count:data.kanban.todo.length, color:"#3b82f6", icon:"☰" },
                { label:"In Progress", count:data.kanban.doing.length, color:"#f59e0b", icon:"◑" },
                { label:"Done", count:data.kanban.done.length, color:"#22c55e", icon:"✓" },
                { label:"Quests Left", count:todayTasks.length-todayDone, color:T.accent, icon:"⚔" },
              ].map(tile=>(
                <div key={tile.label} style={{
                  background:`linear-gradient(150deg,${tile.color},${shade(tile.color,-55)})`,
                  borderRadius:20,padding:"13px 15px",boxShadow:`0 8px 22px ${tile.color}44`,
                }}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff"}}>{tile.icon}</div>
                    <div style={{fontSize:27,fontWeight:900,color:"#fff",lineHeight:1}}>{tile.count}</div>
                  </div>
                  <div style={{fontSize:13,fontWeight:800,color:"#fff",marginTop:9}}>{tile.label}</div>
                </div>
              ))}
            </div>

            <div style={{display:"flex",gap:8,marginBottom:14}}>
              <input style={{...C.input,flex:1}} value={boardInput} placeholder="Add a task or reminder..."
                onChange={e=>setBoardInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")boardAdd();}}/>
              <button style={{...C.btn,padding:"0 19px",fontSize:20}} onClick={boardAdd}>+</button>
            </div>

            <div ref={boardRef} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,alignItems:"start"}}>
              {[
                { col:"todo",  label:"TO DO",       color:"#3b82f6" },
                { col:"doing", label:"IN PROGRESS", color:"#f59e0b" },
                { col:"done",  label:"DONE",        color:"#22c55e" },
              ].map(({col,label,color})=>(
                <div key={col} style={{
                  background: dragOverCol===col&&drag ? "rgba(255,255,255,0.16)" : GLASS,
                  backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",
                  border: dragOverCol===col&&drag ? `1.5px solid ${color}` : `1px solid ${LINE}`,
                  borderRadius:18,padding:"9px 6px",minHeight:190,transition:"all .15s",
                }}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5,marginBottom:8}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:color}}/>
                    <div style={{fontSize:8.5,fontWeight:900,color:"#fff"}}>{label}</div>
                    <div style={{fontSize:8.5,fontWeight:900,color:FAINT}}>{data.kanban[col].length}</div>
                  </div>
                  {data.kanban[col].map(card=>(
                    <div key={card.id}
                      onPointerDown={e=>dragStart(e, col, card)}
                      style={{
                        background:`linear-gradient(150deg,${color}55,rgba(0,0,0,0.3))`,
                        borderRadius:13,padding:"10px 9px",marginBottom:6,
                        fontSize:12,lineHeight:1.35,fontWeight:600,color:col==="done"?DIM:"#fff",
                        textDecoration:col==="done"?"line-through":"none",
                        touchAction:"pan-y",cursor:"grab",position:"relative",
                        opacity:drag?.id===card.id?0.35:1,
                        WebkitUserSelect:"none",userSelect:"none",
                        boxShadow:"0 3px 10px rgba(0,0,0,0.3)",
                      }}>
                      {card.text}
                    </div>
                  ))}
                  {data.kanban[col].length===0 && (
                    <div style={{fontSize:9.5,color:FAINT,textAlign:"center",padding:"24px 4px",fontWeight:800}}>
                      {drag ? "DROP HERE" : "EMPTY"}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{fontSize:9,color:DIM,textAlign:"center",marginTop:10,fontWeight:800}}>
              TAP A CARD FOR OPTIONS · HOLD TO MOVE IT FORWARD · DRAG SIDEWAYS FOR ANY COLUMN
            </div>
            {data.kanban.done.length>0 && (
              <button style={{...C.btnSm,width:"100%",marginTop:12,padding:"12px"}} onClick={boardClearDone}>
                CLEAR COMPLETED ({data.kanban.done.length})
              </button>
            )}

            {/* ── MY LISTS (Reminders-style; send any bullet to the board) ── */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"24px 2px 10px"}}>
              <div style={C.sectionTitle}>My Lists</div>
              {openListId && <button onClick={()=>setOpenListId(null)} style={{...C.btnSm,padding:"8px 14px"}}>‹ ALL LISTS</button>}
            </div>
            {!openListId ? (
              <div style={C.glass}>
                {data.lists.length===0 && (
                  <div style={{fontSize:12,color:DIM,fontWeight:600,textAlign:"center",padding:"4px 0 14px",lineHeight:1.5}}>
                    Make lists like the iPhone Reminders app.<br/>Open one to add bullets and sub-bullets, then send any of them straight to the board.
                  </div>
                )}
                {data.lists.map(l=>{
                  const count = l.items.reduce((s,it)=>s+1+(it.children||[]).length,0);
                  return (
                    <div key={l.id} onClick={()=>setOpenListId(l.id)}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"11px 2px",borderBottom:`1px solid ${LINE}`,cursor:"pointer"}}>
                      <div style={{width:30,height:30,borderRadius:"50%",background:l.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff",flexShrink:0}}>{l.name.slice(0,1).toUpperCase()}</div>
                      <div style={{flex:1,fontSize:14.5,fontWeight:800,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.name}</div>
                      <div style={{fontSize:13,color:FAINT,fontWeight:800}}>{count}</div>
                      <div style={{fontSize:15,color:FAINT}}>›</div>
                    </div>
                  );
                })}
                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <input style={{...C.input,flex:1}} value={listInput} placeholder="New list..."
                    onChange={e=>setListInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter")addList();}}/>
                  <button style={{...C.btn,padding:"0 18px",fontSize:18}} onClick={addList}>+</button>
                </div>
              </div>
            ) : (()=>{
              const l = data.lists.find(x=>x.id===openListId);
              if (!l) return null;
              return (
                <div style={C.glass}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                    <div style={{width:30,height:30,borderRadius:"50%",background:l.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff"}}>{l.name.slice(0,1).toUpperCase()}</div>
                    {editingList(l.id) ? (
                      <input autoFocus style={{...C.input,flex:1,padding:"9px 12px",fontSize:16,fontWeight:900}}
                        value={listEdit.text}
                        onChange={e=>setListEdit({...listEdit, text:e.target.value})}
                        onBlur={commitListEdit}
                        onKeyDown={e=>{ if(e.key==="Enter") commitListEdit(); if(e.key==="Escape") setListEdit(null); }}/>
                    ) : (
                      <div onClick={()=>setListEdit({kind:"list", listId:l.id, text:l.name})}
                        style={{flex:1,fontSize:17,fontWeight:900,color:"#fff",cursor:"text"}}>{l.name} <span style={{fontSize:11,color:FAINT}}>✎</span></div>
                    )}
                    <button onClick={()=>setConfirmBox({type:"list",id:l.id,name:l.name})}
                      style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,color:BAD,fontSize:12,cursor:"pointer",padding:"7px 10px",fontWeight:800}}>DELETE</button>
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:8}}>
                    <input style={{...C.input,flex:1}} value={itemInput} placeholder="Add a bullet..."
                      onChange={e=>setItemInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter")addListItem(l.id,null);}}/>
                    <button style={{...C.btn,padding:"0 16px",fontSize:17}} onClick={()=>addListItem(l.id,null)}>+</button>
                  </div>
                  <div style={{fontSize:8.5,color:FAINT,fontWeight:800,marginBottom:6,textAlign:"center"}}>TAP ANY TEXT TO FIX A TYPO · ➜ SENDS IT TO THE BOARD · ⊕ ADDS A SUB-BULLET</div>
                  {l.items.map(it=>(
                    <div key={it.id}>
                      <div style={{display:"flex",alignItems:"center",gap:9,padding:"7px 0"}}>
                        <button onClick={()=>toggleListItem(l.id,it.id,null)}
                          style={{width:21,height:21,borderRadius:"50%",border:`2px solid ${l.color}`,flexShrink:0,
                            background:it.done?l.color:"transparent",cursor:"pointer",padding:0}}/>
                        {editingItem(l.id,it.id,null) ? (
                          <input autoFocus style={{...C.input,flex:1,padding:"8px 11px",fontSize:13.5}}
                            value={listEdit.text}
                            onChange={e=>setListEdit({...listEdit, text:e.target.value})}
                            onBlur={commitListEdit}
                            onKeyDown={e=>{ if(e.key==="Enter") commitListEdit(); if(e.key==="Escape") setListEdit(null); }}/>
                        ) : (
                          <div onClick={()=>setListEdit({kind:"item", listId:l.id, itemId:it.id, parentId:null, text:it.text})}
                            style={{flex:1,fontSize:13.5,fontWeight:600,color:it.done?FAINT:"#fff",cursor:"text",
                              textDecoration:it.done?"line-through":"none",wordBreak:"break-word"}}>{it.text}</div>
                        )}
                        <button onClick={()=>sendToBoard(l.id,it.id,null)} title="Send to board"
                          style={{background:`${l.color}33`,border:"none",borderRadius:8,color:"#fff",fontSize:12,cursor:"pointer",padding:"5px 9px",fontWeight:900,flexShrink:0}}>➜</button>
                        <button onClick={()=>{setSubFor(subFor===it.id?null:it.id); setSubInput("");}}
                          style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,color:DIM,fontSize:12,cursor:"pointer",padding:"5px 8px",flexShrink:0}}>⊕</button>
                        <button onClick={()=>deleteListItem(l.id,it.id,null)}
                          style={{background:"none",border:"none",color:FAINT,fontSize:13,cursor:"pointer",padding:"4px 2px",flexShrink:0}}>✕</button>
                      </div>
                      {(it.children||[]).map(c=>(
                        <div key={c.id} style={{display:"flex",alignItems:"center",gap:9,padding:"5px 0 5px 30px"}}>
                          <button onClick={()=>toggleListItem(l.id,c.id,it.id)}
                            style={{width:17,height:17,borderRadius:"50%",border:`2px solid ${l.color}aa`,flexShrink:0,
                              background:c.done?`${l.color}aa`:"transparent",cursor:"pointer",padding:0}}/>
                          {editingItem(l.id,c.id,it.id) ? (
                            <input autoFocus style={{...C.input,flex:1,padding:"7px 10px",fontSize:12.5}}
                              value={listEdit.text}
                              onChange={e=>setListEdit({...listEdit, text:e.target.value})}
                              onBlur={commitListEdit}
                              onKeyDown={e=>{ if(e.key==="Enter") commitListEdit(); if(e.key==="Escape") setListEdit(null); }}/>
                          ) : (
                            <div onClick={()=>setListEdit({kind:"item", listId:l.id, itemId:c.id, parentId:it.id, text:c.text})}
                              style={{flex:1,fontSize:12.5,fontWeight:600,color:c.done?FAINT:DIM,cursor:"text",
                                textDecoration:c.done?"line-through":"none",wordBreak:"break-word"}}>{c.text}</div>
                          )}
                          <button onClick={()=>sendToBoard(l.id,c.id,it.id)}
                            style={{background:`${l.color}26`,border:"none",borderRadius:8,color:"#fff",fontSize:11,cursor:"pointer",padding:"4px 8px",fontWeight:900,flexShrink:0}}>➜</button>
                          <button onClick={()=>deleteListItem(l.id,c.id,it.id)}
                            style={{background:"none",border:"none",color:FAINT,fontSize:12,cursor:"pointer",padding:"3px 2px",flexShrink:0}}>✕</button>
                        </div>
                      ))}
                      {subFor===it.id && (
                        <div style={{display:"flex",gap:8,padding:"4px 0 8px 30px"}}>
                          <input autoFocus style={{...C.input,flex:1,padding:"9px 12px",fontSize:13}} value={subInput} placeholder="Sub-bullet..."
                            onChange={e=>setSubInput(e.target.value)}
                            onKeyDown={e=>{if(e.key==="Enter")addListItem(l.id,it.id);}}/>
                          <button style={{...C.btnSm,padding:"0 14px"}} onClick={()=>addListItem(l.id,it.id)}>✓</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {l.items.length===0 && <div style={{fontSize:12,color:FAINT,textAlign:"center",padding:"10px 0",fontWeight:600}}>No bullets yet.</div>}
                </div>
              );
            })()}
          </div>
        )}

        {/* ══ FOCUS (Pomodoro) ══ */}
        {view==="focus" && S.pomodoroEnabled && (
          <div style={{padding:"14px 16px"}}>
            <div style={{...C.glass,textAlign:"center",padding:"26px 18px"}}>
              <div style={{fontSize:13,fontWeight:900,color:pomoPhase==="work"?"#fff":GOOD}}>
                {pomoPhase==="work"?"⚔ FOCUS BATTLE":"🛡 RESTING AT CAMP"}
              </div>
              <div style={{position:"relative",width:218,height:218,margin:"20px auto"}}>
                <svg width="218" height="218">
                  <circle cx="109" cy="109" r="97" fill="rgba(0,0,0,0.2)" stroke="rgba(255,255,255,0.18)" strokeWidth="10"/>
                  <circle cx="109" cy="109" r="97" fill="none"
                    stroke={pomoPhase==="work"?"#ffffff":GOOD} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={2*Math.PI*97}
                    strokeDashoffset={2*Math.PI*97*(1-(pomoTotal?pomoLeft/pomoTotal:0))}
                    transform="rotate(-90 109 109)"
                    style={{transition:"stroke-dashoffset 1s linear",filter:"drop-shadow(0 0 8px rgba(255,255,255,0.5))"}}/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <div style={{fontSize:52,fontWeight:900,color:"#fff",letterSpacing:1}}>
                    {String(Math.floor(pomoLeft/60)).padStart(2,"0")}:{String(pomoLeft%60).padStart(2,"0")}
                  </div>
                  <div style={{fontSize:10,color:DIM,fontWeight:800,marginTop:2}}>
                    {pomoPhase==="work"?`${data.pomodoro.workMin} MIN FOCUS`:`${data.pomodoro.breakMin} MIN BREAK`}
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <button style={{...C.btn,padding:"14px 36px",fontSize:14}}
                  onClick={()=>setPomoRunning(!pomoRunning)}>
                  {pomoRunning?"PAUSE":"START"}
                </button>
                <button style={{...C.btnSm,padding:"14px 24px"}} onClick={pomoReset}>RESET</button>
              </div>
              <div style={{marginTop:18,display:"inline-flex",alignItems:"center",gap:8,background:"rgba(0,0,0,0.25)",borderRadius:20,padding:"8px 17px"}}>
                <span style={{fontSize:14}}>🏆</span>
                <span style={{fontSize:12,fontWeight:900,color:"#fff"}}>{pomoToday} BATTLE{pomoToday===1?"":"S"} WON TODAY</span>
              </div>
            </div>
            <div style={C.glass}>
              <div style={C.label}>FOCUS LENGTH: <span style={{color:"#fff"}}>{data.pomodoro.workMin} MIN</span></div>
              <input type="range" min="5" max="60" step="5" value={data.pomodoro.workMin}
                onChange={e=>setPomoDur("workMin",parseInt(e.target.value))}
                style={{width:"100%",accentColor:"#ffffff"}}/>
              <div style={{...C.label,marginTop:14}}>BREAK LENGTH: <span style={{color:GOOD}}>{data.pomodoro.breakMin} MIN</span></div>
              <input type="range" min="1" max="30" step="1" value={data.pomodoro.breakMin}
                onChange={e=>setPomoDur("breakMin",parseInt(e.target.value))}
                style={{width:"100%",accentColor:GOOD}}/>
            </div>
          </div>
        )}

        {/* ══ STATS ══ */}
        {view==="stats" && (
          <div style={{padding:"14px 16px"}}>
            <div style={{...C.sectionTitle,marginBottom:12}}>Attributes</div>
            <div style={C.glass}>
              {data.categories.map(c=>{
                const pct=(c.value/c.maxValue)*100;
                const editing = editingCat===c.id;
                return (
                  <div key={c.id} style={{padding:"10px 0",borderBottom:`1px solid ${LINE}`}}>
                    {!editing ? (
                      <div onClick={()=>setEditingCat(c.id)} style={{cursor:"pointer"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                          <span style={{fontSize:14,fontWeight:800,color:"#fff"}}>{c.icon} {c.name}</span>
                          <span style={{fontSize:12.5,fontWeight:900,color:"#fff"}}>{S.showXP?`${c.value.toFixed(2)} / ${c.maxValue}`:`${Math.round(pct)}%`}</span>
                        </div>
                        <div style={{height:11,background:"rgba(0,0,0,0.3)",borderRadius:6,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:c.color,borderRadius:6,boxShadow:`0 0 10px ${c.color}88`}}/>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{display:"flex",gap:8,marginBottom:8}}>
                          <input style={{...C.input,width:56,textAlign:"center",padding:"11px 4px"}} value={c.icon} maxLength={2}
                            onChange={e=>saveEditCat(c.id,{icon:e.target.value})}/>
                          <input style={{...C.input,flex:1}} value={c.name}
                            onChange={e=>saveEditCat(c.id,{name:e.target.value})}/>
                        </div>
                        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}>
                          {CAT_COLORS.map(col=>(
                            <button key={col} onClick={()=>saveEditCat(c.id,{color:col})}
                              style={{width:28,height:28,borderRadius:"50%",background:col,cursor:"pointer",
                                border:c.color===col?"3px solid #fff":"2px solid rgba(255,255,255,0.2)",padding:0}}/>
                          ))}
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <button style={{...C.btnSm,flex:1}} onClick={()=>setEditingCat(null)}>DONE</button>
                          <button style={{...C.btnSm,flex:1,color:BAD}}
                            onClick={()=>setConfirmBox({type:"cat",id:c.id,name:c.name,taskCount:data.tasks.filter(t=>t.catId===c.id).length})}>
                            DELETE
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{marginTop:12}}>
                <div style={C.label}>NEW ATTRIBUTE</div>
                <div style={{display:"flex",gap:8}}>
                  <input style={{...C.input,width:56,textAlign:"center",padding:"11px 4px"}} value={newCat.icon} maxLength={2}
                    onChange={e=>setNewCat({...newCat,icon:e.target.value})}/>
                  <input style={{...C.input,flex:1}} value={newCat.name} placeholder="Name..."
                    onChange={e=>setNewCat({...newCat,name:e.target.value})}/>
                  <button style={{...C.btn,padding:"0 17px"}} onClick={addCat}>+</button>
                </div>
              </div>
            </div>

            {orphanTasks.length>0 && (
              <div style={{...C.glass,border:"1.5px solid #ffc46b66"}}>
                <div style={{...C.label,color:"#ffc46b"}}>QUESTS NEEDING REASSIGNMENT</div>
                {orphanTasks.map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0"}}>
                    <div style={{flex:1,fontSize:13.5,color:"#fff",fontWeight:600}}>{t.name}</div>
                    <select style={{...C.select,width:140,padding:"9px 11px",fontSize:12.5}} value=""
                      onChange={e=>{ if(e.target.value) update({...data, tasks:data.tasks.map(x=>x.id===t.id?{...x,catId:e.target.value}:x)}); }}>
                      <option value="">Assign...</option>
                      {data.categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div style={{...C.sectionTitle,margin:"18px 2px 4px"}}>The Path of Ascension</div>
            <div style={{fontSize:11,color:DIM,margin:"0 2px 12px",fontWeight:700}}>Every level forges new gear. Tap ✎ to rename a title.</div>
            {LEVELS.map(L=>{
              const achieved = level.lvl >= L.lvl;
              const isNext = level.lvl + 1 === L.lvl;
              const isCurrent = level.lvl === L.lvl;
              return (
                <div key={L.lvl} style={{
                  display:"flex",alignItems:"center",gap:12,
                  background: isNext ? "rgba(255,255,255,0.14)" : GLASS,
                  backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",
                  border: isNext ? `2px solid ${T.accent}` : isCurrent ? `1.5px solid rgba(255,255,255,0.5)` : `1px solid ${LINE}`,
                  borderRadius:20,padding:"11px 13px",marginBottom:9,
                  boxShadow: isNext ? `0 0 24px ${T.accent}55` : "0 4px 16px rgba(0,0,0,0.25)",
                }}>
                  <div style={{flexShrink:0,width:68,display:"flex",justifyContent:"center"}}>
                    <PixelCharacter level={L.lvl} character={cz} scale={2.7} previewAllGear/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:9.5,fontWeight:900,color:"#fff",background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"2.5px 8px"}}>LV {L.lvl}</span>
                      {editingTitleLvl===L.lvl ? (
                        <input autoFocus style={{...C.input,padding:"6px 10px",fontSize:13.5,width:130}}
                          value={titleDraft} onChange={e=>setTitleDraft(e.target.value)}
                          onKeyDown={e=>{if(e.key==="Enter")saveTitle(L.lvl);}}/>
                      ) : (
                        <span style={{fontSize:15,fontWeight:900,color:"#fff"}}>
                          {getTitle(data, L.lvl)}
                        </span>
                      )}
                      {isNext && <span style={{fontSize:9,fontWeight:900,color:"#2a1600",background:T.accent,borderRadius:8,padding:"2.5px 8px"}}>NEXT</span>}
                      {isCurrent && <span style={{fontSize:9,fontWeight:900,color:T.accent}}>◄ YOU</span>}
                      {achieved && !isCurrent && <span style={{fontSize:12,color:GOOD}}>✓</span>}
                      {!achieved && !isNext && <span style={{fontSize:11,color:FAINT}}>🔒</span>}
                    </div>
                    <div style={{fontSize:11.5,color:isNext?"#fff":DIM,marginTop:4,fontWeight:isNext?800:600}}>
                      {L.unlock}{!achieved && ` · reach rating ${L.lvl*7}`}
                    </div>
                  </div>
                  {editingTitleLvl===L.lvl ? (
                    <button onClick={()=>saveTitle(L.lvl)} style={{background:"none",border:"none",color:GOOD,fontSize:17,cursor:"pointer",padding:4}}>✓</button>
                  ) : (
                    <button onClick={()=>{setEditingTitleLvl(L.lvl); setTitleDraft(getTitle(data,L.lvl));}}
                      style={{background:"rgba(0,0,0,0.25)",border:"none",borderRadius:10,color:DIM,fontSize:13,cursor:"pointer",padding:"6px 8px"}}>✎</button>
                  )}
                </div>
              );
            })}

            <div style={{...C.sectionTitle, margin:"18px 2px 12px"}}>Trophies</div>
            <div style={C.glass}>
              {TROPHIES.map((t,i)=>{
                const claimedOn = (data.trophies||{})[t.id];
                const unlocked = claimedOn || t.check(data);
                return (
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 2px",
                    borderBottom: i<TROPHIES.length-1 ? `1px solid ${LINE}` : "none", opacity: unlocked?1:0.45}}>
                    <div style={{fontSize:22,width:32,textAlign:"center",filter:unlocked?"none":"grayscale(1)"}}>{t.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:800,color:"#fff"}}>{t.name}</div>
                      <div style={{fontSize:10,color:DIM,fontWeight:700,marginTop:1}}>{t.desc}</div>
                    </div>
                    {claimedOn ? (
                      <div style={{fontSize:12,fontWeight:900,color:GOOD}}>✓</div>
                    ) : unlocked ? (
                      <button onClick={()=>claimTrophy(t)} style={{...C.btn,padding:"9px 12px",fontSize:10.5,animation:"glowPulse 1.6s ease-in-out infinite"}}>+{t.gems} 💎</button>
                    ) : (
                      <div style={{fontSize:10,fontWeight:800,color:FAINT}}>+{t.gems} 💎</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {view==="boss" && (()=>{
          const boss = bossForWeek(data, today);
          const victories = Object.keys(data.bossClaims||{}).length;
          if (!boss) return (
            <div style={{padding:"14px 16px"}}>
              <div style={C.sectionTitle}>Boss Arena</div>
              <div style={{...C.glass,textAlign:"center",color:DIM,fontSize:13,fontWeight:600,marginTop:12}}>
                Add some quests first — a boss rises to match your week.
              </div>
            </div>
          );
          const claimed = !!(data.bossClaims||{})[boss.wkStart];
          const dead = boss.dmg >= boss.hp;
          const hpLeft = boss.hp - boss.dmg;
          const pct = (hpLeft/boss.hp)*100;
          const wkEnd = new Date(weekKeysFor(today)[6]+"T00:00:00");
          return (
            <div style={{padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={C.sectionTitle}>Boss Arena</div>
                <div style={{display:"flex",alignItems:"center",gap:5,background:GLASS,border:`1px solid ${LINE}`,borderRadius:12,padding:"5px 12px"}}>
                  <span style={{fontSize:12}}>🏆</span><span style={{fontSize:12.5,fontWeight:900,color:"#ffc46b"}}>{victories}</span>
                  <span style={{fontSize:9,fontWeight:800,color:DIM}}>SLAIN</span>
                </div>
              </div>

              <div style={{...C.glass, padding:0, overflow:"hidden", border:`1.5px solid ${claimed?LINE:dead?"#34d39966":"#ef444466"}`}}>
                {/* portrait */}
                <div style={{background:"radial-gradient(ellipse at 50% 70%, rgba(239,68,68,0.16), rgba(0,0,0,0.25) 70%)",
                  padding:"18px 10px 4px", filter: (dead||claimed) ? "grayscale(0.9)" : "none", transition:"filter .5s"}}>
                  <BossArt id={boss.id} style={{maxWidth:330, margin:"0 auto"}}/>
                </div>
                <div style={{padding:"14px 17px 17px"}}>
                  <div style={{fontSize:9,fontWeight:900,letterSpacing:2,color:"#ff8f5e"}}>WEEKLY BOSS</div>
                  <div style={{fontSize:21,fontWeight:900,color:"#fff",marginTop:3}}>{boss.title}</div>
                  {boss.gen>1 && <div style={{fontSize:9,fontWeight:800,color:"#ff8f5e",marginTop:2}}>💀 You've slain this line {boss.gen-1} time{boss.gen>2?"s":""} — it returns stronger in name only.</div>}
                  <div style={{fontSize:12,color:DIM,fontWeight:600,lineHeight:1.55,marginTop:7}}>{boss.desc}</div>

                  {claimed ? (
                    <div style={{marginTop:16,background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.4)",borderRadius:14,
                      padding:"13px 15px",textAlign:"center"}}>
                      <div style={{fontSize:13,fontWeight:900,color:GOOD}}>SLAIN ✓</div>
                      <div style={{fontSize:10,color:DIM,fontWeight:700,marginTop:3}}>A new foe rises Monday.</div>
                    </div>
                  ) : (
                    <>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginTop:16}}>
                        <div style={{fontSize:10,fontWeight:900,color:dead?GOOD:"#ff8f5e",letterSpacing:1}}>{dead?"DEFEATED":"HP"}</div>
                        <div style={{fontSize:12,fontWeight:900,color:"#fff"}}>{hpLeft}<span style={{color:DIM}}>/{boss.hp}</span></div>
                      </div>
                      <div style={{height:12,borderRadius:7,background:"rgba(0,0,0,0.4)",marginTop:6,overflow:"hidden",border:`1px solid ${LINE}`}}>
                        <div style={{height:"100%",width:`${pct}%`,borderRadius:7,background:"linear-gradient(90deg,#ef4444,#f87171)",transition:"width .5s"}}/>
                      </div>
                      <div style={{display:"flex",gap:8,marginTop:14}}>
                        <div style={{flex:1,background:"rgba(0,0,0,0.22)",borderRadius:13,padding:"10px 0",textAlign:"center"}}>
                          <div style={{fontSize:16,fontWeight:900,color:"#ff8f5e"}}>{boss.dmg}</div>
                          <div style={{fontSize:8,fontWeight:800,color:FAINT}}>DAMAGE DEALT</div>
                        </div>
                        <div style={{flex:1,background:"rgba(0,0,0,0.22)",borderRadius:13,padding:"10px 0",textAlign:"center"}}>
                          <div style={{fontSize:14,fontWeight:900,color:"#c084fc"}}>+{boss.gems} 💎</div>
                          <div style={{fontSize:9.5,fontWeight:900,color:GOOD,marginTop:1}}>+{boss.xp.toFixed(2)} XP</div>
                          <div style={{fontSize:8,fontWeight:800,color:FAINT}}>BOUNTY</div>
                        </div>
                        <div style={{flex:1,background:"rgba(0,0,0,0.22)",borderRadius:13,padding:"10px 0",textAlign:"center"}}>
                          <div style={{fontSize:16,fontWeight:900,color:"#fff"}}>{DAYS[wkEnd.getDay()].slice(0,3)}</div>
                          <div style={{fontSize:8,fontWeight:800,color:FAINT}}>DEADLINE</div>
                        </div>
                      </div>
                      {dead ? (
                        <button onClick={()=>claimBoss(boss)}
                          style={{...C.btn,width:"100%",padding:"15px",marginTop:14,fontSize:13,animation:"glowPulse 1.6s ease-in-out infinite"}}>
                          ⚔ CLAIM BOUNTY +{boss.gems} 💎
                        </button>
                      ) : (
                        <div style={{fontSize:9.5,color:FAINT,fontWeight:700,textAlign:"center",marginTop:13,lineHeight:1.5}}>
                          EVERY QUEST COMPLETION & WEEKLY REP THIS WEEK DEALS 1 DAMAGE.<br/>SLAY IT BY SUNDAY MIDNIGHT — <span style={{color:"#ef8f8f"}}>IF IT ESCAPES, IT TAKES {boss.xp.toFixed(2)} XP FROM EVERY STAT.</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* UP NEXT — the rotation guarantees every boss appears before any repeats */}
              <div style={{...C.sectionTitle, fontSize:14, margin:"18px 2px 10px"}}>Up Next</div>
              <div style={{display:"flex",gap:8,overflowX:"auto",WebkitOverflowScrolling:"touch",paddingBottom:4}}>
                {nextBosses(data, today, 4).map(nb=>(
                  <div key={nb.wkStart} style={{...C.glass,flexShrink:0,padding:"10px 13px",marginBottom:0,display:"flex",alignItems:"center",gap:9}}>
                    <div>
                      <div style={{fontSize:11,fontWeight:900,color:"#fff",whiteSpace:"nowrap"}}>{nb.title}</div>
                      <div style={{fontSize:8,fontWeight:800,color:FAINT,whiteSpace:"nowrap",marginTop:1}}>{nb.when}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* BESTIARY — every boss, its lore, and your kill tally */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",margin:"16px 2px 10px"}}>
                <div style={{...C.sectionTitle, fontSize:14}}>Bestiary</div>
                <div style={{fontSize:9.5,fontWeight:800,color:FAINT}}>💀 = ONE KILL</div>
              </div>
              {BOSSES.map(b=>{
                const kills = Object.values(data.bossClaims||{}).filter(v=>v===b.id).length;
                const isCurrent = b.id===boss.id;
                return (
                  <div key={b.id} style={{...C.glass, padding:0, overflow:"hidden", marginBottom:10,
                    border: isCurrent ? "1.5px solid #ff8f5e66" : `1px solid ${LINE}`}}>
                    <div style={{display:"flex",alignItems:"center"}}>
                      <div style={{width:120,flexShrink:0, filter: kills>0||isCurrent ? "none" : "saturate(0.45) brightness(0.85)"}}>
                        <BossArt id={b.id}/>
                      </div>
                      <div style={{flex:1,minWidth:0,padding:"12px 14px 12px 4px"}}>
                        <div style={{fontSize:13.5,fontWeight:900,color:"#fff"}}>
                          {kills>0 ? `${b.name} ${roman(kills+1)}` : b.name}
                          {isCurrent && <span style={{fontSize:8.5,fontWeight:900,color:"#ff8f5e",marginLeft:6,letterSpacing:1}}>· NOW</span>}
                        </div>
                        <div style={{fontSize:10.5,color:DIM,fontWeight:600,lineHeight:1.5,marginTop:4}}>{b.desc}</div>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
                          <div style={{fontSize:11,fontWeight:900,color: kills>0 ? "#ff8f5e" : FAINT,letterSpacing:1}}>
                            {kills>0 ? ("💀".repeat(Math.min(kills,5)) + (kills>5 ? ` ×${kills}` : "")) : "NOT YET SLAIN"}
                          </div>
                          {!isCurrent && <div style={{fontSize:8,fontWeight:800,color:FAINT,marginLeft:"auto",whiteSpace:"nowrap"}}>RETURNS {nextAppearance(data, today, b.id)}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {view==="plan" && (()=>{
          const todayK = dateKey();
          // ---------- MONTH MODE ----------
          if (planMode === "month") {
            const { y, m } = planMonth;
            const first = new Date(y, m, 1);
            const startDow = first.getDay();
            const daysInMonth = new Date(y, m+1, 0).getDate();
            const cells = [];
            for (let i=0;i<startDow;i++) cells.push(null);
            for (let d=1; d<=daysInMonth; d++) cells.push(`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
            const shiftMonth = (n)=> setPlanMonth(c=>{ let mm=c.m+n, yy=c.y; if(mm<0){mm=11;yy--;} if(mm>11){mm=0;yy++;} return {y:yy,m:mm}; });
            return (
              <div style={{padding:"14px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={C.sectionTitle}>Plan</div>
                  <button style={{...C.btn,padding:"9px 14px",fontSize:11.5}}
                    onClick={()=>{ setScheduleSheet({title:"",color:T.accent,source:"custom",refId:null,start:9*60,dur:30,dk:todayK}); }}>+ TIME BLOCK</button>
                </div>
                <div style={C.glass}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <button onClick={()=>shiftMonth(-1)} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:12,color:"#fff",padding:"7px 16px",cursor:"pointer",fontSize:16,fontWeight:800}}>‹</button>
                    <div style={{fontSize:15,fontWeight:900,color:"#fff"}}>{MONTHS[m]} {y}</div>
                    <button onClick={()=>shiftMonth(1)} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:12,color:"#fff",padding:"7px 16px",cursor:"pointer",fontSize:16,fontWeight:800}}>›</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>
                    {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:9,color:FAINT,fontWeight:800}}>{d.slice(0,1)}</div>)}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                    {cells.map((dk,i)=>{
                      if (!dk) return <div key={`e${i}`}/>;
                      const n = blocksForDay(dk).length;
                      const isT = dk===todayK;
                      const dayNum = parseInt(dk.split("-")[2],10);
                      return (
                        <button key={dk} onClick={()=>{ setPlanDate(dk); setPlanMode("day"); }}
                          style={{aspectRatio:"1",borderRadius:13,border:isT?"2px solid #fff":`1px solid ${LINE}`,
                            background: n>0 ? `linear-gradient(150deg,${T.accent}44,rgba(0,0,0,0.2))` : "rgba(255,255,255,0.05)",
                            color:"#fff",cursor:"pointer",position:"relative",display:"flex",flexDirection:"column",
                            alignItems:"center",justifyContent:"center",gap:2,padding:0}}>
                          <span style={{fontSize:13,fontWeight: isT?900:700}}>{dayNum}</span>
                          {n>0 && <div style={{display:"flex",gap:2}}>
                            {Array.from({length:Math.min(3,n)}).map((_,j)=>(
                              <div key={j} style={{width:4,height:4,borderRadius:"50%",background:T.accent}}/>
                            ))}
                          </div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{fontSize:10.5,color:DIM,textAlign:"center",fontWeight:700,marginTop:4}}>
                  Tap a day to open its hour-by-hour schedule · dots mark days with time blocks
                </div>
              </div>
            );
          }
          // ---------- DAY MODE (full 24h scroll) ----------
          const dk = planDate;
          const selD = new Date(dk+"T00:00:00");
          const HOUR_PX = 58, START_H = 0, END_H = 24;          // FULL 24 hours
          const totalH = (END_H-START_H)*HOUR_PX;
          const yFor = (min)=> Math.max(0,(min-START_H*60)/60*HOUR_PX);
          const blocks = blocksForDay(dk);
          const nowMins = (()=>{ const n=new Date(); return n.getHours()*60+n.getMinutes(); })();
          const isToday = dk===todayK;
          const placedRefIds = new Set(blocks.filter(b=>b.refId).map(b=>b.refId));
          const dayTasks = data.tasks.filter(t=>t.catId && data.categories.find(c=>c.id===t.catId)
            && (isWeekly(t) || isScheduledOn(t,dk)) && !placedRefIds.has(t.id));
          const shiftDay = (n)=>{ const d=new Date(dk+"T00:00:00"); d.setDate(d.getDate()+n); setPlanDate(dateKey(d)); };
          const headLabel = `${DAYS[selD.getDay()]}, ${MONTHS[selD.getMonth()]} ${selD.getDate()}`;
          const openNew = (task)=> setScheduleSheet({
            title: task?task.name:"", color: task?(task.color||data.categories.find(c=>c.id===task.catId)?.color||T.accent):T.accent,
            source: task?"task":"custom", refId: task?task.id:null, start: 9*60, dur: 30, dk,
          });
          return (
            <div style={{paddingBottom:20}}>
              <div style={{padding:"14px 16px 6px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <button style={{...C.btnSm,padding:"9px 13px"}} onClick={()=>setPlanMode("month")}>‹ MONTH</button>
                  <div style={{fontSize:14,fontWeight:900,color:"#fff"}}>{headLabel}{isToday?" · Today":""}</div>
                  <button style={{...C.btnSm,padding:"9px 13px"}} onClick={()=>openNew(null)}>＋</button>
                </div>
                <div style={{display:"flex",gap:8,marginBottom:4}}>
                  <button style={{...C.btnSm,flex:1,padding:"9px 0"}} onClick={()=>shiftDay(-1)}>‹ PREV</button>
                  <button style={{...C.btnSm,flex:1,padding:"9px 0"}} onClick={()=>{ setPlanDate(todayK); }}>TODAY</button>
                  <button style={{...C.btnSm,flex:1,padding:"9px 0"}} onClick={()=>shiftDay(1)}>NEXT ›</button>
                </div>
              </div>

              <div style={{padding:"0 16px"}}>
                {/* SCROLLABLE 24H TIMELINE */}
                <div ref={(el)=>{ if(el && el.dataset.scrolled!=="1"){ el.dataset.scrolled="1";
                    const earliest = blocks.length ? Math.min(...blocks.map(b=>b.start)) : (isToday? nowMins : 7*60);
                    el.scrollTop = Math.max(0, (Math.max(0,earliest-30)/60)*HOUR_PX); } }}
                  style={{height:"58vh",overflowY:"auto",WebkitOverflowScrolling:"touch",
                  background:GLASS,backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",
                  border:`1px solid ${LINE}`,borderRadius:22}}>
                  <div style={{position:"relative",height:totalH}}>
                    {Array.from({length:END_H-START_H+1},(_,i)=>{
                      const h=START_H+i; const yy=yFor(h*60);
                      const lab=h===24?"12 AM":h===0?"12 AM":h===12?"12 PM":h>12?`${h-12} PM`:`${h} AM`;
                      return (
                        <div key={h}>
                          <div style={{position:"absolute",left:0,right:0,top:yy,height:1,background:"rgba(255,255,255,0.10)"}}/>
                          <div style={{position:"absolute",left:8,top:yy+3,fontSize:9.5,fontWeight:700,color:FAINT}}>{lab}</div>
                          {h<END_H && <div style={{position:"absolute",left:52,right:0,top:yy+HOUR_PX/2,height:1,background:"rgba(255,255,255,0.045)"}}/>}
                        </div>
                      );
                    })}
                    <div onClick={(e)=>{
                      const rect=e.currentTarget.getBoundingClientRect();
                      const rel=e.clientY-rect.top;
                      let mins=Math.round((START_H*60 + rel/HOUR_PX*60)/15)*15;
                      mins=Math.max(0,Math.min(END_H*60-15,mins));
                      setScheduleSheet({title:"",color:T.accent,source:"custom",refId:null,start:mins,dur:30,dk});
                    }} style={{position:"absolute",left:52,right:0,top:0,bottom:0,cursor:"copy"}}/>
                    {blocks.map(b=>{
                      const yy=yFor(b.start), h=Math.max(20, b.dur/60*HOUR_PX-3);
                      return (
                        <div key={b.id} onClick={(e)=>{ e.stopPropagation(); setScheduleSheet({...b, dk}); }}
                          style={{position:"absolute",left:56,right:8,top:yy+1,height:h,
                            background:`linear-gradient(135deg,${b.color},${shade(b.color,-40)})`,
                            borderRadius:12,padding:"5px 10px",cursor:"pointer",overflow:"hidden",
                            boxShadow:`0 3px 12px ${b.color}55`,borderLeft:`4px solid ${shade(b.color,45)}`}}>
                          <div style={{fontSize:12,fontWeight:800,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",lineHeight:1.2}}>{b.title}</div>
                          {h>32 && <div style={{fontSize:9.5,fontWeight:700,color:"rgba(255,255,255,0.9)",marginTop:1}}>{fmtTime(b.start)} – {fmtTime(Math.min(1439,b.start+b.dur))}</div>}
                        </div>
                      );
                    })}
                    {isToday && (
                      <div style={{position:"absolute",left:52,right:0,top:yFor(nowMins),height:2,background:"#ff5a5a",zIndex:5}}>
                        <div style={{position:"absolute",left:-4,top:-3,width:8,height:8,borderRadius:"50%",background:"#ff5a5a"}}/>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{margin:"14px 2px 10px"}}>
                  <div style={{...C.sectionTitle,fontSize:14}}>Tasks for this day</div>
                  <div style={{fontSize:10,color:DIM,fontWeight:700,marginTop:3}}>Tap one to drop it on the calendar with a time.</div>
                </div>
                {dayTasks.length===0 && (
                  <div style={{...C.glass,textAlign:"center",color:DIM,fontSize:12.5,fontWeight:600}}>
                    All scheduled tasks are on the calendar. Use the ＋ button for anything else.
                  </div>
                )}
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {dayTasks.map(task=>{
                    const cat=data.categories.find(c=>c.id===task.catId);
                    const color=task.color||cat?.color||T.accent;
                    return (
                      <button key={task.id} onClick={()=>openNew(task)} style={{
                        display:"flex",alignItems:"center",gap:8,background:`linear-gradient(135deg,${color}cc,${shade(color,-45)})`,
                        border:"none",borderRadius:14,padding:"10px 13px",cursor:"pointer",fontFamily:FONT,
                        boxShadow:`0 4px 14px ${color}44`}}>
                        <span style={{fontSize:14}}>{cat?.icon}</span>
                        <span style={{fontSize:12.5,fontWeight:800,color:"#fff"}}>{task.name}</span>
                        <span style={{fontSize:14,color:"rgba(255,255,255,0.85)",fontWeight:900}}>＋</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {view==="forecast" && (()=>{
          const sel = forecastDate || dateKey();
          const todayK = dateKey();
          // week strip around selected date (Mon→Sun)
          const strip = weekKeysFor(sel);
          const selD = new Date(sel+"T00:00:00");
          const isPast = sel < todayK, isToday = sel===todayK;
          // daily tasks scheduled on the selected day
          const dueDaily = data.tasks
            .filter(t=>t.catId && data.categories.find(c=>c.id===t.catId) && !isWeekly(t) && isScheduledOn(t,sel))
            .sort((a,b)=>(a.order??0)-(b.order??0));
          const weeklies = data.tasks.filter(t=>t.catId && data.categories.find(c=>c.id===t.catId) && isWeekly(t));
          const shiftWeek = (n)=>{ const d=new Date(sel+"T00:00:00"); d.setDate(d.getDate()+n*7); setForecastDate(dateKey(d)); };
          const monthLabel = `${MONTHS[selD.getMonth()]} ${selD.getDate()}, ${selD.getFullYear()}`;
          return (
            <div style={{padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={C.sectionTitle}>Forecast</div>
                <button style={{...C.btnSm,padding:"10px 14px"}} onClick={()=>setView("tasks")}>‹ QUESTS</button>
              </div>

              {/* Week strip */}
              <div style={{...C.glass,padding:"14px 12px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <button onClick={()=>shiftWeek(-1)} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:12,color:"#fff",padding:"6px 14px",cursor:"pointer",fontSize:15,fontWeight:800}}>‹</button>
                  <div style={{fontSize:12.5,fontWeight:800,color:"#fff"}}>{monthLabel}</div>
                  <button onClick={()=>shiftWeek(1)} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:12,color:"#fff",padding:"6px 14px",cursor:"pointer",fontSize:15,fontWeight:800}}>›</button>
                </div>
                <div style={{display:"flex",gap:5}}>
                  {strip.map(dk=>{
                    const d=new Date(dk+"T00:00:00");
                    const on = dk===sel, isT = dk===todayK;
                    const count = data.tasks.filter(t=>t.catId && !isWeekly(t) && isScheduledOn(t,dk)).length;
                    return (
                      <button key={dk} onClick={()=>setForecastDate(dk)} style={{
                        flex:1,borderRadius:14,border:on?"2px solid #fff":isT?"1.5px solid rgba(255,255,255,0.5)":`1px solid ${LINE}`,
                        background:on?"rgba(255,255,255,0.18)":"rgba(0,0,0,0.2)",cursor:"pointer",padding:"8px 0",
                        display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                        <div style={{fontSize:8.5,fontWeight:800,color:on?"#fff":DIM}}>{DAYS[d.getDay()].slice(0,2).toUpperCase()}</div>
                        <div style={{fontSize:15,fontWeight:900,color:on?"#fff":"#fff"}}>{d.getDate()}</div>
                        <div style={{height:5,width:5,borderRadius:"50%",background:count>0?(on?"#fff":T.accent):"transparent"}}/>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",margin:"6px 2px 11px"}}>
                <div style={C.sectionTitle}>
                  {isToday?"Today":isPast?"That day":"Coming up"} · {DAYS[selD.getDay()]}
                </div>
                <div style={{fontSize:11,color:DIM,fontWeight:800}}>{dueDaily.length} scheduled</div>
              </div>

              {dueDaily.length===0 && (
                <div style={{...C.glass,textAlign:"center",color:DIM,fontSize:13,fontWeight:600}}>Nothing scheduled this day.</div>
              )}
              {dueDaily.map(task=>{
                const cat = data.categories.find(c=>c.id===task.catId);
                const color = task.color || cat?.color || T.accent;
                const done = isCompletedOn(task, sel);
                const reps = getReps(task, sel);
                const target = task.targetReps||1;
                const canLog = sel<=todayK;
                return (
                  <div key={task.id} style={{
                    background: S.cardStyle==="tinted"
                      ? `linear-gradient(155deg,${color}24 0%,${color}0e 50%,${GLASS} 100%)`
                      : `linear-gradient(155deg,${color} 0%,${shade(color,-58)} 100%)`,
                    borderRadius:20, padding:"12px 14px", marginBottom:10,
                    opacity: done?0.7:1,
                    boxShadow: S.cardStyle==="tinted" ? "0 4px 16px rgba(0,0,0,0.3)" : `0 6px 20px ${color}40`,
                    border: S.cardStyle==="tinted" ? `1px solid ${color}33` : "none",
                    display:"flex",alignItems:"center",gap:12}}>
                    {canLog ? (
                      <HoldRing color={S.cardStyle==="tinted"?color:"#ffffff"} checkColor={S.cardStyle==="tinted"?"#fff":color}
                        trackColor="rgba(255,255,255,0.3)" reps={reps} target={target}
                        onComplete={()=>addRep(task.id, sel)} onShortTap={()=>toast$("HOLD TO COMPLETE")} size={46}/>
                    ) : (
                      <div style={{width:46,height:46,borderRadius:"50%",flexShrink:0,border:"2px dashed rgba(255,255,255,0.4)",
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"rgba(255,255,255,0.6)"}}>🔮</div>
                    )}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14.5,fontWeight:800,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
                        textDecoration:done?"line-through":"none"}}>{task.name}</div>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.85)",fontWeight:800,marginTop:3}}>
                        {cat?.icon} {cat?.name} {target>1?`· ${reps}/${target}`:""} {!canLog?"· upcoming":""}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Weekly habits reminder for the selected week */}
              {weeklies.length>0 && (
                <>
                  <div style={{...C.sectionTitle,margin:"16px 2px 10px",fontSize:13}}>That week's habits</div>
                  {weeklies.map(task=>{
                    const cat = data.categories.find(c=>c.id===task.catId);
                    const color = task.color || cat?.color || T.accent;
                    const wt = weeklyTargetOf(task);
                    const done = weeklyDone(task, sel);
                    return (
                      <div key={task.id} style={{...C.glass,padding:"10px 13px",marginBottom:8,display:"flex",alignItems:"center",gap:11}}>
                        <div style={{width:34,height:34,borderRadius:11,flexShrink:0,background:`${color}33`,
                          display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{cat?.icon}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13.5,fontWeight:800,color:"#fff"}}>{task.name}</div>
                          <div style={{fontSize:9.5,color:DIM,fontWeight:700,marginTop:1}}>{done}/{wt} that week · weekly</div>
                        </div>
                        <div style={{fontSize:11,fontWeight:900,color: done>=wt?GOOD:color}}>{Math.round(Math.min(100,(done/wt)*100))}%</div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        })()}

        {view==="settings" && (
          <div style={{padding:"14px 16px"}}>
            <div style={{...C.sectionTitle,marginBottom:12}}>Settings</div>

            {/* SKY THEME */}
            <div style={C.glass}>
              <div style={C.label}>SKY</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9}}>
                {THEME_KEYS.map(key=>{
                  const th = THEMES[key];
                  const on = S.theme===key;
                  return (
                    <button key={key} onClick={()=>setSetting("theme",key)}
                      style={{
                        background:`linear-gradient(180deg,${th.sky[0]},${th.sky[1]} 55%,${th.sky[2]})`,
                        border:on?"2.5px solid #ffffff":"1.5px solid rgba(255,255,255,0.18)",
                        borderRadius:16,padding:0,cursor:"pointer",height:74,position:"relative",overflow:"hidden",
                        boxShadow:on?"0 0 18px rgba(255,255,255,0.45)":"0 4px 12px rgba(0,0,0,0.3)",
                      }}>
                      <svg width="100%" height="100%" viewBox="0 0 100 74" preserveAspectRatio="none" style={{position:"absolute",inset:0}}>
                        <circle cx="74" cy="18" r="9" fill={th.sun} opacity="0.95"/>
                        <polygon fill={th.m2} points="0,74 0,52 26,34 50,52 74,32 100,50 100,74"/>
                        <polygon fill={th.m3} points="0,74 0,64 34,46 66,64 100,52 100,74"/>
                      </svg>
                      <div style={{position:"absolute",bottom:5,left:0,right:0,fontSize:9,fontWeight:900,color:"#fff",textShadow:"0 1px 4px rgba(0,0,0,0.6)"}}>{th.name.toUpperCase()}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DISPLAY */}
            <div style={C.glass}>
              <div style={C.label}>STAT DISPLAY</div>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                {[["radar","RADAR"],["bars","BARS"],["none","HIDDEN"]].map(([v,l])=>(
                  <button key={v} style={C.chip(S.statStyle===v)} onClick={()=>setSetting("statStyle",v)}>{l}</button>
                ))}
              </div>
              <div style={C.label}>QUEST CARD STYLE</div>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                {[["vivid","VIVID"],["tinted","TINTED"]].map(([v,l])=>(
                  <button key={v} style={C.chip(S.cardStyle===v)} onClick={()=>setSetting("cardStyle",v)}>{l}</button>
                ))}
              </div>
              <div style={{fontSize:10,color:FAINT,fontWeight:700,marginTop:-8,marginBottom:16}}>Vivid = full color cards · Tinted = subtle glass with a touch of color</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>Show XP numbers</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Off = difficulty words instead of decimals</div>
                </div>
                <Switch on={S.showXP} onToggle={()=>setSetting("showXP",!S.showXP)}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:16}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>"This Week" on home</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Off = weekly habits show on the Quests page instead</div>
                </div>
                <Switch on={S.weeklyOnHome!==false} onToggle={()=>setSetting("weeklyOnHome",!(S.weeklyOnHome!==false))}/>
              </div>
            </div>

            {/* PAGES */}
            <div style={C.glass}>
              <div style={C.label}>PAGES</div>
              <div style={{fontSize:10.5,color:FAINT,fontWeight:700,marginTop:-6,marginBottom:12,lineHeight:1.4}}>Home and More are always on. Toggle the rest to keep your bottom bar tidy.</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>⚔ Quests</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Your habit list & 7-day grid</div>
                </div>
                <Switch on={S.questsEnabled!==false} onToggle={()=>setSetting("questsEnabled",!(S.questsEnabled!==false))}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>📊 Stats</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Radar, bars & ascension path</div>
                </div>
                <Switch on={S.statsEnabled!==false} onToggle={()=>setSetting("statsEnabled",!(S.statsEnabled!==false))}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>👹 Boss Arena</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Weekly boss battles</div>
                </div>
                <Switch on={S.bossEnabled!==false} onToggle={()=>setSetting("bossEnabled",!(S.bossEnabled!==false))}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>🗓 Plan</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Time-block calendar for your day</div>
                </div>
                <Switch on={S.planEnabled!==false} onToggle={()=>setSetting("planEnabled",!(S.planEnabled!==false))}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>📋 Board</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Reminders hub & kanban</div>
                </div>
                <Switch on={S.kanbanEnabled} onToggle={()=>setSetting("kanbanEnabled",!S.kanbanEnabled)}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>⏱️ Focus</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Pomodoro timer</div>
                </div>
                <Switch on={S.pomodoroEnabled} onToggle={()=>setSetting("pomodoroEnabled",!S.pomodoroEnabled)}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>🎰 Casino</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Spin games (coins still earn when off)</div>
                </div>
                <Switch on={S.casinoEnabled} onToggle={()=>setSetting("casinoEnabled",!S.casinoEnabled)}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>🛍 Shop</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Owned cosmetics stay wearable when off</div>
                </div>
                <Switch on={S.shopEnabled} onToggle={()=>setSetting("shopEnabled",!S.shopEnabled)}/>
              </div>
            </div>

            {/* CHARACTER */}
            <div style={C.glass}>
              <div style={C.label}>YOUR CHAMPION</div>
              <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
                <PixelCharacter level={level.lvl} character={cz} scale={6.5} idle cosmetics={cosmetics} pet={pet}/>
              </div>
              <div style={{...C.label,marginBottom:6}}>BODY</div>
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                {BODIES.map(([v,l])=>(
                  <button key={v} style={C.chip(cz.body===v)} onClick={()=>setChar("body",v)}>{l.toUpperCase()}</button>
                ))}
              </div>
              <div style={{...C.label,marginBottom:6}}>HAIRSTYLE</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:14}}>
                {HAIRSTYLES.map(([v,l])=>(
                  <button key={v} style={{...C.chip(cz.hairstyle===v),flex:"0 0 auto",padding:"10px 15px"}} onClick={()=>setChar("hairstyle",v)}>{l.toUpperCase()}</button>
                ))}
              </div>
              {[["skin","SKIN",SKINS],["hair","HAIR",HAIRS],["shirt","SHIRT",SHIRTS],["pants","PANTS",PANTS]].map(([key,lab,opts])=>(
                <div key={key} style={{marginBottom:12}}>
                  <div style={{...C.label,marginBottom:6}}>{lab}</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {opts.map(col=>(
                      <button key={col} onClick={()=>setChar(key,col)}
                        style={{width:32,height:32,borderRadius:"50%",background:col,cursor:"pointer",
                          border:cz[key]===col?"3px solid #ffffff":"2px solid rgba(255,255,255,0.2)",padding:0,
                          boxShadow:cz[key]===col?"0 0 12px rgba(255,255,255,0.5)":"none"}}/>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* WARDROBE */}
            <div style={C.glass}>
              <div style={C.label}>WARDROBE</div>
              <div style={{fontSize:11,color:DIM,marginBottom:12,fontWeight:600}}>Unlocked gear can be worn or stored.</div>
              {GEAR.map(g=>{
                const unlocked = level.lvl >= g.lvl;
                const worn = cz.equipped[g.slot] !== false;
                return (
                  <div key={g.slot} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${LINE}`,opacity:unlocked?1:0.5}}>
                    <div>
                      <div style={{fontSize:13.5,fontWeight:800,color:"#fff"}}>{g.name}</div>
                      <div style={{fontSize:10,color:unlocked?GOOD:FAINT,fontWeight:800,marginTop:1}}>
                        {unlocked?"UNLOCKED":`UNLOCKS AT LV ${g.lvl}`}
                      </div>
                    </div>
                    {unlocked
                      ? <Switch on={worn} onToggle={()=>toggleGear(g.slot)}/>
                      : <span style={{fontSize:14,color:FAINT}}>🔒</span>}
                  </div>
                );
              })}
            </div>

            {/* MY COSMETICS (shop items, managed here on the character page) */}
            <div style={C.glass}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{...C.label,marginBottom:0}}>MY COSMETICS</div>
                <button style={{...C.btnSm,padding:"7px 12px"}} onClick={()=>setView("shop")}>SHOP →</button>
              </div>
              {(() => {
                const owned = SHOP.filter(it=>(data.wallet.owned||[]).includes(it.id));
                if (owned.length===0 && !data.wallet.pet) {
                  return <div style={{fontSize:11.5,color:DIM,fontWeight:600,marginTop:10,lineHeight:1.5}}>
                    Nothing yet. Win 💎 in the Casino, then unlock auras, pets, capes, and blades in the Shop — they&rsquo;ll appear here to equip.
                  </div>;
                }
                const groups = [["aura","AURAS"],["pet","PETS"],["cape","CAPES"]];
                return groups.map(([type,label])=>{
                  const items = owned.filter(it=>it.type===type);
                  if (!items.length) return null;
                  return (
                    <div key={type} style={{marginTop:12}}>
                      <div style={{fontSize:9,fontWeight:800,color:FAINT,letterSpacing:1,marginBottom:7}}>{label}</div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        {items.map(it=>{
                          const equipped = type==="pet" ? data.wallet.pet===it.id : cosmetics[type]===it.id;
                          return (
                            <button key={it.id} onClick={()=>equipCosmetic(it)} style={{
                              display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                              background:equipped?"rgba(255,255,255,0.16)":"rgba(255,255,255,0.06)",
                              border:equipped?`2px solid ${RARITY[it.rarity].color}`:`1px solid ${LINE}`,
                              borderRadius:14,padding:"9px 8px",cursor:"pointer",minWidth:62}}>
                              <div style={{height:30,display:"flex",alignItems:"center"}}>
                                <ShopPreview item={it}/>
                              </div>
                              <div style={{fontSize:8.5,fontWeight:800,color:equipped?"#fff":DIM,textAlign:"center",lineHeight:1.1}}>{it.name}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* DANGER ZONE */}
            <div style={{...C.glass,border:`1.5px solid ${BAD}55`}}>
              <div style={{...C.label,color:BAD}}>DANGER ZONE</div>
              <button style={{...C.btnSm,width:"100%",padding:"14px",color:BAD,marginBottom:8}}
                onClick={()=>setConfirmBox({type:"reset"})}>
                ↺ RESET STATS (KEEPS QUESTS & HISTORY)
              </button>
              <button style={{...C.btnSm,width:"100%",padding:"12px",color:BAD,marginBottom:8}}
                onClick={()=>setConfirmBox({type:"resetAllQuests"})}>
                ↺ RESET ALL QUESTS (WIPES EVERY STREAK & HISTORY)
              </button>
              <button style={{...C.btnSm,width:"100%",padding:"12px",color:"#fcd34d",marginBottom:8}}
                onClick={()=>setConfirmBox({type:"resetCoins"})}>
                ↺ RESET COINS (GOLD)
              </button>
              <button style={{...C.btnSm,width:"100%",padding:"12px",color:"#67e8f9",marginBottom:8}}
                onClick={()=>setConfirmBox({type:"resetGems"})}>
                ↺ RESET GEMS
              </button>
              <button style={{...C.btnSm,width:"100%",padding:"12px",color:"#f472b6"}}
                onClick={()=>setConfirmBox({type:"resetCosmetics"})}>
                ↺ RESET COSMETICS (UNEQUIPS & CLEARS OWNED)
              </button>
            </div>

            {/* DEVELOPER MODE */}
            <div style={{...C.glass,border:`1.5px solid ${T.accent}55`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:T.accent}}>🛠 Developer Mode</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Set coins & gems directly (for testing)</div>
                </div>
                <Switch on={S.devMode} onToggle={()=>setSetting("devMode",!S.devMode)} color={T.accent}/>
              </div>
              {S.devMode && (
                <div style={{marginTop:14}}>
                  <div style={{display:"flex",gap:8,marginBottom:8}}>
                    <input id="devCoins" type="number" placeholder={`Coins (now ${coins})`} style={{...C.input,flex:1}}/>
                    <button style={{...C.btnSm,padding:"0 16px"}} onClick={()=>{
                      const el=document.getElementById("devCoins"); const v=parseInt(el.value);
                      if(!isNaN(v)) devSetCurrency(v, null); el.value="";
                    }}>SET 🪙</button>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <input id="devGems" type="number" placeholder={`Gems (now ${gems})`} style={{...C.input,flex:1}}/>
                    <button style={{...C.btnSm,padding:"0 16px"}} onClick={()=>{
                      const el=document.getElementById("devGems"); const v=parseInt(el.value);
                      if(!isNaN(v)) devSetCurrency(null, v); el.value="";
                    }}>SET 💎</button>
                  </div>
                  <div style={{height:1,background:LINE,margin:"12px 0"}}/>
                  <div style={{fontSize:11,fontWeight:800,color:T.accent,marginBottom:7}}>AVAILABLE GAMES (max 4)</div>
                  <div style={{display:"flex",gap:8}}>
                    <input id="devSpins" type="number" min="0" max="4" placeholder={`Now ${spinsAvail} available`} style={{...C.input,flex:1}}/>
                    <button style={{...C.btnSm,padding:"0 16px"}} onClick={()=>{
                      const el=document.getElementById("devSpins"); const v=parseInt(el.value);
                      if(!isNaN(v)) devSetAvailableSpins(v); el.value="";
                    }}>SET 🎰</button>
                  </div>
                  <button style={{...C.btnSm,width:"100%",padding:"11px",marginTop:8}} onClick={()=>devSetAvailableSpins(4)}>
                    ↺ RESET TO 4 SPINS
                  </button>
                  <div style={{fontSize:9.5,color:FAINT,fontWeight:700,marginTop:8}}>Tip: give yourself gems, then buy items to verify they wear correctly. Reset spins to keep testing the casino.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ CASINO ══ */}
        {view==="casino" && (
          <div style={{padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={C.sectionTitle}>The Reward Hall</div>
              <div style={{display:"flex",gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:4,background:GLASS,border:`1px solid ${LINE}`,borderRadius:12,padding:"5px 10px"}}>
                  <span style={{fontSize:12}}>🪙</span><span style={{fontSize:12,fontWeight:900,color:"#fcd34d"}}>{coins}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4,background:GLASS,border:`1px solid ${LINE}`,borderRadius:12,padding:"5px 10px"}}>
                  <span style={{fontSize:12}}>💎</span><span style={{fontSize:12,fontWeight:900,color:"#67e8f9"}}>{gems}</span>
                </div>
              </div>
            </div>

            {/* Spins available */}
            <div style={{...C.glass,textAlign:"center"}}>
              <div style={{fontSize:11,fontWeight:800,color:DIM}}>SPINS AVAILABLE TODAY</div>
              <div style={{display:"flex",justifyContent:"center",gap:8,margin:"12px 0"}}>
                {SPIN_THRESHOLDS.map((th,i)=>{
                  const unlocked = i < spinsUnlocked(data, today);
                  const used = i < ((data.wallet.spinsUsedByDay||{})[today]||0);
                  return (
                    <div key={i} style={{width:42,height:42,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
                      background: used ? "rgba(255,255,255,0.08)" : unlocked ? "linear-gradient(135deg,#7c3aed,#db2777)" : "rgba(255,255,255,0.08)",
                      border: unlocked && !used ? "2px solid #fff" : `1px solid ${LINE}`,
                      opacity: used ? 0.4 : 1}}>
                      {used ? "✓" : unlocked ? "🎰" : "🔒"}
                    </div>
                  );
                })}
              </div>
              <div style={{fontSize:10.5,color:FAINT,fontWeight:700,marginBottom:14}}>
                Earn spins by completing your day's quests. {SPIN_COST} 🪙 per pull.
              </div>
              {spinsAvail > 0 && coins >= SPIN_COST ? (
                <button style={{...C.btn,width:"100%",padding:"15px",fontSize:15,background:"linear-gradient(135deg,#7c3aed,#db2777,#f59e0b)",color:"#fff"}}
                  onClick={newRound}>
                  🎲 NEW GAME ({spinsAvail} LEFT)
                </button>
              ) : (
                <div style={{fontSize:12,color:FAINT,fontWeight:700,padding:"4px 0"}}>
                  {spinsAvail===0 ? "Complete more quests to unlock a spin" : `Need ${SPIN_COST} coins to play`}
                </div>
              )}
            </div>

            {/* The active game — stays mounted through the whole round (fixes blank-game bug) */}
            {((spinsAvail > 0 && coins >= SPIN_COST) || spinState!=="ready") && (
              <div style={{...C.glass,textAlign:"center",padding:"20px 16px"}}>
                <div style={{fontSize:11,fontWeight:900,letterSpacing:2,color:T.accent,marginBottom:4}}>
                  {spinGame==="slot"?"🎰 SLOT MACHINE":spinGame==="wheel"?"🎡 PRIZE WHEEL":"🃏 BLACKJACK"}
                </div>
                <div style={{fontSize:9.5,color:FAINT,fontWeight:700,marginBottom:16}}>A random game is chosen each round</div>

                {spinGame==="slot" && <SlotMachine state={spinState} onSettle={settleSpin}/>}
                {spinGame==="wheel" && <PrizeWheel state={spinState} onSettle={settleSpin}/>}
                {spinGame==="blackjack" && <Blackjack state={spinState} onSettle={settleSpin}/>}

                {spinState==="ready" && (
                  (spinsAvail > 0 && coins >= SPIN_COST) ? (
                    <button style={{...C.btn,width:"100%",padding:"15px",fontSize:15,marginTop:18,
                      background:"linear-gradient(135deg,#7c3aed,#db2777)",color:"#fff"}}
                      onClick={beginPlay}>
                      {spinGame==="blackjack" ? `DEAL · ${SPIN_COST} 🪙` : `PULL · ${SPIN_COST} 🪙`}
                    </button>
                  ) : (
                    <div style={{fontSize:12,color:FAINT,fontWeight:700,marginTop:18}}>
                      {spinsAvail===0 ? "Complete more quests to unlock a spin" : `Need ${SPIN_COST} coins`}
                    </div>
                  )
                )}
                {(spinState==="spinning" || spinState==="playing") && (
                  <div style={{fontSize:12,color:DIM,fontWeight:800,marginTop:18,letterSpacing:1}}>
                    {spinGame==="blackjack" ? "YOUR MOVE..." : "GOOD LUCK..."}
                  </div>
                )}
                {spinState==="done" && (
                  <div style={{marginTop:18}}>
                    <div style={{fontSize:15,fontWeight:900,color:RARITY[spinResult.rarity].color,letterSpacing:1,animation:"popIn .4s ease"}}>
                      {spinResult.gems>0 ? `${RARITY[spinResult.rarity].label} · +${spinResult.gems} 💎` : "NO WIN — TRY AGAIN!"}
                    </div>
                    {spinsAvail > 0 && coins >= SPIN_COST ? (
                      <button style={{...C.btn,width:"100%",padding:"14px",fontSize:14,marginTop:10}}
                        onClick={newRound}>
                        PLAY AGAIN ({spinsAvail} LEFT)
                      </button>
                    ) : (
                      <button style={{...C.btnSm,width:"100%",padding:"14px",marginTop:10}} onClick={()=>{ setSpinState("ready"); setView("shop"); }}>
                        {gems>0 ? "SPEND YOUR 💎 IN THE SHOP →" : "DONE"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{...C.glass}}>
              <div style={C.label}>HOW IT WORKS</div>
              <div style={{fontSize:12,color:DIM,fontWeight:600,lineHeight:1.6}}>
                Completing quests earns <b style={{color:"#fcd34d"}}>coins</b> (harder quests = more). Finishing enough of your day unlocks <b style={{color:"#fff"}}>spins</b>. Spend coins to play a random game and win <b style={{color:"#67e8f9"}}>gems</b> — the currency for the Shop. Keep a perfect-day streak going to unlock the rarest gear.
              </div>
            </div>
          </div>
        )}

        {/* ══ SHOP ══ */}
        {view==="shop" && (
          <div style={{padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={C.sectionTitle}>The Shop</div>
              <div style={{display:"flex",alignItems:"center",gap:5,background:GLASS,border:`1px solid ${LINE}`,borderRadius:12,padding:"5px 12px"}}>
                <span style={{fontSize:13}}>💎</span><span style={{fontSize:13,fontWeight:900,color:"#67e8f9"}}>{gems}</span>
              </div>
            </div>
            <div style={{fontSize:10.5,color:DIM,fontWeight:700,marginBottom:10}}>
              🔥 Best perfect-day streak: <b style={{color:"#ffc46b"}}>{perfectStreak}</b> — some gear unlocks at higher streaks.
            </div>
            {/* STREAK SHIELD (consumable) */}
            <div style={{...C.glass, border:"1.5px solid rgba(157,180,255,0.45)", marginBottom:12, padding:"13px 15px",
              display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:26}}>🛡</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13.5,fontWeight:900,color:"#fff"}}>Streak Shield <span style={{fontSize:10,color:"#9db4ff",fontWeight:800}}>· owned: {data.wallet.shields||0}</span></div>
                <div style={{fontSize:10,color:DIM,fontWeight:700,marginTop:2}}>Protect a missed day — streak survives, no decay. Use it from that quest's calendar.</div>
              </div>
              <button onClick={buyShield} style={{...C.btn,padding:"11px 13px",fontSize:11,whiteSpace:"nowrap"}}>{SHIELD_COST} 💎</button>
            </div>
            {/* Filter chips */}
            <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:10,WebkitOverflowScrolling:"touch"}}>
              {SHOP_TYPES.map(([v,l])=>(
                <button key={v} onClick={()=>setShopFilter(v)} style={{
                  flexShrink:0,padding:"8px 14px",borderRadius:14,border:"none",cursor:"pointer",fontFamily:FONT,
                  fontSize:10.5,fontWeight:800,background:shopFilter===v?"#fff":"rgba(255,255,255,0.12)",
                  color:shopFilter===v?"#1c1430":DIM}}>{l}</button>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {SHOP.filter(it=>shopFilter==="all"||it.type===shopFilter).map(item=>{
                const owned = (data.wallet.owned||[]).includes(item.id);
                const equipped = item.type==="pet" ? data.wallet.pet===item.id : cosmetics[item.type]===item.id;
                const gated = item.gate?.streak && perfectStreak < item.gate.streak;
                const r = RARITY[item.rarity];
                return (
                  <div key={item.id} onClick={()=> owned ? equipCosmetic(item) : buyItem(item)} style={{
                    background:`linear-gradient(160deg,${r.color}22,${GLASS})`,
                    backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
                    border:equipped?`2px solid ${r.color}`:`1px solid ${r.color}44`,
                    borderRadius:18,padding:"13px 12px",cursor:"pointer",position:"relative",
                    opacity:gated&&!owned?0.6:1,boxShadow:owned?`0 0 16px ${r.color}33`:"none"}}>
                    <div style={{position:"absolute",top:8,right:9,fontSize:7.5,fontWeight:900,color:r.color,letterSpacing:.5}}>{r.label}</div>
                    <div style={{height:46,display:"flex",alignItems:"center",justifyContent:"center",marginTop:4,marginBottom:6}}>
                      <ShopPreview item={item}/>
                    </div>
                    <div style={{fontSize:12,fontWeight:800,color:"#fff",textAlign:"center",lineHeight:1.2,minHeight:29}}>{item.name}</div>
                    <div style={{marginTop:8,textAlign:"center"}}>
                      {owned ? (
                        <div style={{fontSize:11,fontWeight:900,color:equipped?r.color:GOOD}}>
                          {equipped ? "✓ EQUIPPED" : "TAP TO EQUIP"}
                        </div>
                      ) : gated ? (
                        <div style={{fontSize:10,fontWeight:800,color:"#ffc46b"}}>🔒 {item.gate.streak}-DAY STREAK</div>
                      ) : (
                        <div style={{fontSize:12,fontWeight:900,color: gems>=item.gems ? "#67e8f9" : FAINT}}>💎 {item.gems}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{height:10}}/>
          </div>
        )}
      </div>

      {/* ══ FLOATING DOCK ══ */}
      <div style={C.nav}>
        {navItems.map(n=>(
          <button key={n.v} style={C.navBtn(isActive(n.v))} onClick={()=>setView(n.v)}>
            <span style={{fontSize:15,lineHeight:1}}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}
