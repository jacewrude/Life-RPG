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
    accent:"#ffb13d",
  },
  midnight: {
    name:"Night", swatch:"#34418c",
    sky:["#070822","#1c1f52","#34418c"], sun:"#e8ecff", stars:true,
    m1:"#232a66", m2:"#161b4a", m3:"#0c0f33",
    accent:"#9db4ff",
  },
  ocean: {
    name:"Ocean", swatch:"#18a0a8",
    sky:["#04263f","#0a5070","#18a0a8"], sun:"#aef0e4", stars:false,
    m1:"#0d5c7c", m2:"#07415c", m3:"#032b40",
    accent:"#5eead4",
  },
  forest: {
    name:"Forest", swatch:"#3f8f5f",
    sky:["#0c2b22","#1d5c40","#a4c25f"], sun:"#ffe9a3", stars:false,
    m1:"#2e6b4f", m2:"#1c4a37", m3:"#0e2e21",
    accent:"#a3e635",
  },
  rose: {
    name:"Rose", swatch:"#ff8e6e",
    sky:["#3b1042","#91356f","#ff8e6e"], sun:"#ffd9c2", stars:false,
    m1:"#7c2f63", m2:"#54204c", m3:"#321336",
    accent:"#ffa9c9",
  },
  crimson: {
    name:"Blood Moon", swatch:"#c43e2a",
    sky:["#1c0610","#5c0f1e","#c43e2a"], sun:"#ff6b4a", stars:true,
    m1:"#571423", m2:"#380c18", m3:"#20060e",
    accent:"#ff8f5e",
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
  days, completions:{},
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
  pomodoro: { ...DEFAULT_POMO },
  lastDecayDate: null,
};

// ── DATE / COMPLETION HELPERS ─────────────────────────────────────────────────
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
    const cursor = new Date(anchor + "T00:00:00");
    cursor.setDate(cursor.getDate()+1);
    const todayD = new Date(today + "T00:00:00");
    let safety = 0;
    while (cursor < todayD && safety < 400) {
      const dk = dateKey(cursor);
      data.tasks.forEach(task=>{
        try {
          if (!task.catId) return;
          if (!isScheduledOn(task, dk)) return;
          if (isCompletedOn(task, dk)) return;
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
      createdAt: t.createdAt || Object.keys(t.completions||{}).sort()[0] || dateKey(),
    })),
    customTitles: d.customTitles || {},
    kanban: (d.kanban && Array.isArray(d.kanban.todo)) ? d.kanban : { todo:[], doing:[], done:[] },
    lists: Array.isArray(d.lists) ? d.lists : [],
    pomodoro: { ...DEFAULT_POMO, ...(d.pomodoro||{}), sessionsByDay: { ...((d.pomodoro||{}).sessionsByDay||{}) } },
    lastDecayDate: d.lastDecayDate || dateKey(),
  };
}

// Per-quest stats: completion rate since the quest became active
function questStats(task) {
  const keys = Object.keys(task.completions||{}).sort();
  const start = task.createdAt || keys[0] || dateKey();
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

// ── PIXEL CHARACTER (soft rounded style, customizable, gear by level) ─────────
function PixelCharacter({ level, character, scale=7, previewAllGear=false, idle=false }) {
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
  const torsoColor = steel ? "#9fb0c1" : leather ? "#6b3a1f" : (level>=1 ? shirt : "#8a7a64");
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
    if (ench) {
      R(16.4,6.2,0.6,8.0,"#cfe7ff",0.3);
      R(17.0,6.2,0.7,8.0,"#9fd0ff",0.3);
      R(16.0,13.9,2.8,0.9,"#7c5cd6",0.4);
      R(16.9,14.7,0.9,1.9,"#2a1f4a",0.4);
      els.push(<circle key={k++} cx={17.3*s} cy={9.6*s} r={2.6*s} fill="#9fd0ff" opacity="0.16"/>);
    } else if (iron) {
      R(16.5,7.6,0.6,6.4,"#eef2f6",0.3);
      R(17.1,7.6,0.7,6.4,"#c4cfdb",0.3);
      R(16.0,13.9,2.8,0.9,"#5b6573",0.4);
      R(16.9,14.7,0.9,1.7,"#3f2d1d",0.4);
      R(16.8,16.3,1.1,0.9,"#caa05a",0.5);
    } else {
      R(16.7,8.8,1.0,5.2,"#b07d2e",0.4);
      R(16.0,13.9,2.6,0.9,"#5a3a1a",0.4);
      R(16.9,14.7,0.9,1.7,"#2e2017",0.4);
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
                background: done ? color : partial ? `${color}55` : "rgba(255,255,255,0.07)",
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
      <circle cx="330" cy={height*0.28} r="30" fill={T.sun} opacity="0.95"/>
      <circle cx="330" cy={height*0.28} r="48" fill={T.sun} opacity="0.18"/>
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
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [data, setData] = useState(null);
  const [view, setView] = useState("dashboard");
  const [editTask, setEditTask] = useState(null);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [calCursor, setCalCursor] = useState({ y: new Date().getFullYear(), m: new Date().getMonth() });
  const [toast, setToast] = useState(null);
  const [confirmBox, setConfirmBox] = useState(null);
  const [showLevelUp, setShowLevelUp] = useState(null);
  const [editingCat, setEditingCat] = useState(null);
  const [editingTitleLvl, setEditingTitleLvl] = useState(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [currentDay, setCurrentDay] = useState(dateKey());
  const [newTask, setNewTask] = useState({name:"",catId:"career",importance:5,targetReps:1,days:[1,2,3,4,5]});
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
      setData(decayed);
      setPomoLeft((decayed.pomodoro.workMin||25)*60);
      persistRaw(decayed);
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
      setShowLevelUp({ lvl, name: getTitle(data, lvl), unlock: LEVELS[lvl].unlock });
      try { navigator.vibrate && navigator.vibrate([30,60,30,60,80]); } catch {}
      setTimeout(()=>setShowLevelUp(null), 4500);
    }
    prevLevelRef.current = lvl;
  }, [data?.categories]);

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
    const showXP = data.settings.showXP;
    if (justDone) toast$(showXP ? `✓ ${task.name}  +${(delta+refund).toFixed(3)}` : `✓ ${task.name}`, cat?.color || "#34d399");
    else if (newReps > target) toast$(showXP ? `BONUS +${delta.toFixed(3)}` : "BONUS!", "#f59e0b");
    else toast$(`${newReps}/${target} ${task.name}`, cat?.color);
  };

  const clearDay = (tid, dk) => {
    const d = dk || currentDay;
    const task = data.tasks.find(t=>t.id===tid); if (!task) return;
    const reps = getReps(task, d);
    if (reps === 0) return;
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
    toast$("CLEARED", "#ef4444");
  };

  const toggleDay = (tid, dk) => {
    const task = data.tasks.find(t=>t.id===tid); if (!task) return;
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
      toast$(`LOGGED ${dk}`, "#34d399");
    }
  };

  const saveEditTask = () => {
    if (!editTask) return;
    const updated = { ...editTask,
      points: calcPoints(editTask.importance ?? 5),
      decayRate: calcDecay(editTask.importance ?? 5) };
    update({...data, tasks: data.tasks.map(t=>t.id===editTask.id?updated:t)});
    setEditTask(null); setView("tasks");
    toast$("QUEST UPDATED ✓");
  };
  const deleteTask = (id) => update({...data, tasks:data.tasks.filter(t=>t.id!==id)});
  const addTask = () => {
    if (!newTask.name.trim()) return;
    const task = { ...newTask, id:`t${Date.now()}`,
      order: data.tasks.length, createdAt: dateKey(),
      points: calcPoints(newTask.importance), decayRate: calcDecay(newTask.importance), completions:{} };
    update({...data, tasks:[...data.tasks, task]});
    setNewTask({name:"",catId:data.categories[0]?.id||"career",importance:5,targetReps:1,days:[1,2,3,4,5]});
    setView("tasks"); toast$("QUEST CREATED!");
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
    if (key==="pomodoroEnabled" && !val && view==="focus") setView("dashboard");
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
      categories: data.categories.map(c=>({...c, value:3.0})),
      lastDecayDate: dateKey()});
    toast$("STATS RESET — YOUR QUESTS REMAIN", "#fb923c");
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
  const resetQuest = (id) => {
    update({...data, tasks:data.tasks.map(t=>t.id===id?{...t, completions:{}, createdAt: dateKey()}:t)});
    toast$("QUEST HISTORY RESET");
  };

  // ── REMINDERS-STYLE LISTS ───────────────────────────────────────────────────
  const mutateList = (id, fn) => update({...data, lists: data.lists.map(l=>l.id===id?fn(l):l)});
  const addList = () => {
    const name = listInput.trim(); if (!name) return;
    const color = LIST_COLORS[data.lists.length % LIST_COLORS.length];
    update({...data, lists:[...data.lists, {id:`l${Date.now()}`, name, color, items:[]}]});
    setListInput("");
  };
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

  // Drag-and-drop (pointer-based so it works on iPhone)
  const COLS = ["todo","doing","done"];
  const dragStart = (e, col, card) => {
    if (e.button !== undefined && e.button !== 0) return;
    dragMeta.current = { col, card, startX:e.clientX, startY:e.clientY, active:false };
    const move = (ev) => {
      const m = dragMeta.current; if (!m) return;
      const dx = ev.clientX - m.startX, dy = ev.clientY - m.startY;
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
      } else if (m && !m.active) {
        const dist = Math.hypot(ev.clientX - m.startX, ev.clientY - m.startY);
        if (dist < 8) boardAdvance(m.col, m.card.id);
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
    <div style={{background:"linear-gradient(180deg,#2a1654,#8a2f63,#f2723f)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:20,letterSpacing:3,fontFamily:"ui-rounded,'SF Pro Rounded',Nunito,-apple-system,sans-serif"}}>
      LOADING...
    </div>
  );

  // ── COMPUTED ────────────────────────────────────────────────────────────────
  const S = data.settings;
  const T = THEMES[S.theme] || THEMES.ember;
  const cz = data.character;
  const today = currentDay;
  const todayTasks = data.tasks.filter(t=>t.catId && data.categories.find(c=>c.id===t.catId) && isScheduledOn(t,today));
  const todayDone = todayTasks.filter(t=>isCompletedOn(t,today)).length;
  const allDone = todayTasks.length>0 && todayDone===todayTasks.length;
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
  const nowD = new Date();
  const dateLabel = `${DAYS[nowD.getDay()]}, ${MONTHS[nowD.getMonth()].slice(0,3)} ${nowD.getDate()}`;

  // ── STYLES (glass-on-sky system) ────────────────────────────────────────────
  const FONT = `ui-rounded,'SF Pro Rounded',Nunito,-apple-system,system-ui,sans-serif`;
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
    navBtn:a=>({background:a?"rgba(255,255,255,0.14)":"none",border:"none",color:a?"#fff":FAINT,fontSize:8,fontWeight:800,cursor:"pointer",fontFamily:FONT,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 9px",borderRadius:14,transition:"all .2s"}),
    dayBtn:on=>({width:38,height:38,borderRadius:"50%",border:"none",background:on?"#ffffff":"rgba(255,255,255,0.12)",color:on?"#1c1430":DIM,fontSize:10.5,cursor:"pointer",fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}),
    modal:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:900,display:"flex",alignItems:"flex-end",justifyContent:"center"},
    sheet:{background:GLASS_HEAVY,backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderRadius:"26px 26px 0 0",border:`1px solid ${LINE}`,borderBottom:"none",width:"100%",maxWidth:430,maxHeight:"88vh",overflowY:"auto",padding:"18px 20px calc(env(safe-area-inset-bottom, 0px) + 30px)"},
    chip:(on)=>({flex:1,padding:"12px 0",borderRadius:16,border:"none",background:on?"#ffffff":"rgba(255,255,255,0.12)",color:on?"#1c1430":DIM,fontSize:11.5,fontWeight:900,cursor:"pointer",textAlign:"center",fontFamily:FONT}),
    sectionTitle:{fontSize:15,fontWeight:900,color:TXT,textShadow:"0 1px 8px rgba(0,0,0,0.4)"},
  };
  const navItems = [
    { v:"dashboard", icon:"⛰", label:"HOME" },
    { v:"tasks",     icon:"⚔", label:"QUESTS" },
    ...(S.kanbanEnabled   ? [{ v:"board", icon:"▦", label:"BOARD" }] : []),
    ...(S.pomodoroEnabled ? [{ v:"focus", icon:"◔", label:"FOCUS" }] : []),
    { v:"stats", icon:"◆", label:"STATS" },
    { v:"settings", icon:"⚙", label:"MORE" },
  ];
  const isActive=(v)=>view===v||(view==="addTask"&&v==="tasks")||(view==="editTask"&&v==="tasks");

  // ── QUEST CARD (ring on the LEFT; vivid or tinted; per-quest color) ─────────
  const QuestCard = ({task}) => {
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
        @keyframes popIn { 0%{transform:scale(.6);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes sparkle { 0%,100%{opacity:.4;transform:scale(.9)} 50%{opacity:1;transform:scale(1.15)} }
        @keyframes slideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes breathe { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes burstFly { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(var(--dx),var(--dy)) scale(.3);opacity:0} }
        @keyframes floatUp { 0%{transform:translate(-50%,0) scale(.8);opacity:0} 15%{opacity:1;transform:translate(-50%,-12px) scale(1.15)} 100%{transform:translate(-50%,-52px) scale(1);opacity:0} }
        @keyframes ringPop { 0%{transform:scale(.4);opacity:.9} 100%{transform:scale(2.4);opacity:0} }
        * { -webkit-tap-highlight-color: transparent; }
        input[type=range]{ height: 30px; }
        body { background: ${T.sky[0]}; }
      `}</style>
      {/* FULL-BLEED SKY */}
      <div style={{position:"fixed",inset:0,background:skyGradient,zIndex:0}}/>

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
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:GLASS_HEAVY,backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",border:`2px solid ${T.accent}`,borderRadius:30,
            padding:"32px 42px",textAlign:"center",boxShadow:`0 0 70px ${T.accent}88`,maxWidth:320,animation:"popIn .4s ease"}}>
            <div style={{fontSize:13,letterSpacing:3,color:T.accent,fontWeight:900,animation:"sparkle 1.2s infinite"}}>★ LEVEL UP ★</div>
            <div style={{margin:"18px 0",display:"flex",justifyContent:"center"}}>
              <PixelCharacter level={showLevelUp.lvl} character={cz} scale={8} idle/>
            </div>
            <div style={{fontSize:34,fontWeight:900,color:"#fff",textShadow:`0 0 24px ${T.accent}`}}>LV {showLevelUp.lvl}</div>
            <div style={{fontSize:19,color:T.accent,fontWeight:900,marginTop:2}}>{showLevelUp.name}</div>
            <div style={{fontSize:11,color:GOOD,marginTop:12,fontWeight:900,letterSpacing:1}}>UNLOCKED</div>
            <div style={{fontSize:14,color:DIM,marginTop:3,fontWeight:700}}>{showLevelUp.unlock}</div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmBox && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setConfirmBox(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:GLASS_HEAVY,backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",border:`2px solid ${BAD}`,borderRadius:26,padding:"24px 26px",maxWidth:340,width:"100%",boxShadow:`0 0 40px ${BAD}55`,animation:"popIn .25s ease"}}>
            <div style={{fontSize:12,letterSpacing:2,color:BAD,fontWeight:900,textAlign:"center",marginBottom:14}}>
              {confirmBox.type==="reset" ? "⚠ RESET STATS" : confirmBox.type==="questReset" ? "⚠ RESET QUEST" : "⚠ CONFIRM DELETE"}
            </div>
            <div style={{fontSize:14.5,color:"#fff",textAlign:"center",marginBottom:10,lineHeight:1.5,fontWeight:600}}>
              {confirmBox.type==="reset"
                ? <>Reset your champion's stats back to the start? Your quests, names, history, and customization are <span style={{color:GOOD,fontWeight:900}}>kept</span>.</>
                : confirmBox.type==="questReset"
                ? <>Wipe the history and streak of <span style={{color:T.accent,fontWeight:900}}>{confirmBox.name}</span> and start counting fresh from today? Your character's stats are <span style={{color:GOOD,fontWeight:900}}>unchanged</span>.</>
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
                  setConfirmBox(null);
                }}>
                {confirmBox.type==="reset"||confirmBox.type==="questReset" ? "RESET" : "DELETE"}
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
                </div>
              </div>
            </div>
            <div style={{fontSize:9,color:FAINT,fontWeight:800,textAlign:"center",marginBottom:14}}>
              HOLD THE RING TO COMPLETE · TAP A PAST DAY BELOW TO LOG IT
            </div>
            {dStats && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                <div style={{background:"rgba(0,0,0,0.25)",borderRadius:16,padding:"11px 8px",textAlign:"center"}}>
                  <div style={{fontSize:21,fontWeight:900,color:dStats.rate>=80?GOOD:dStats.rate>=50?"#ffc46b":BAD}}>{dStats.rate}%</div>
                  <div style={{fontSize:8,color:FAINT,fontWeight:800,marginTop:2}}>COMPLETION RATE</div>
                </div>
                <div style={{background:"rgba(0,0,0,0.25)",borderRadius:16,padding:"11px 8px",textAlign:"center"}}>
                  <div style={{fontSize:21,fontWeight:900,color:"#fff"}}>{dStats.done}<span style={{fontSize:12,color:FAINT}}>/{dStats.expected}</span></div>
                  <div style={{fontSize:8,color:FAINT,fontWeight:800,marginTop:2}}>DONE / EXPECTED</div>
                </div>
                <div style={{background:"rgba(0,0,0,0.25)",borderRadius:16,padding:"11px 8px",textAlign:"center"}}>
                  <div style={{fontSize:13,fontWeight:900,color:"#fff",marginTop:4}}>{dStats.start.slice(5).replace("-","/")}</div>
                  <div style={{fontSize:8,color:FAINT,fontWeight:800,marginTop:5}}>ACTIVE SINCE</div>
                </div>
              </div>
            )}
            <div style={{background:"rgba(0,0,0,0.22)",borderRadius:20,padding:"14px 15px",marginBottom:12}}>
              <MonthCalendar task={detailTask} color={detailColor}
                viewYear={calCursor.y} viewMonth={calCursor.m}
                onPrev={()=>setCalCursor(c=>c.m===0?{y:c.y-1,m:11}:{y:c.y,m:c.m-1})}
                onNext={()=>setCalCursor(c=>c.m===11?{y:c.y+1,m:0}:{y:c.y,m:c.m+1})}
                onToggleDay={(dk)=>toggleDay(detailTask.id, dk)}/>
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
                <div style={{fontSize:11,letterSpacing:3,color:"rgba(255,255,255,0.85)",fontWeight:900,marginTop:2,textShadow:"0 1px 8px rgba(0,0,0,0.4)"}}>{tier.label}</div>
              </div>
              <div style={{position:"absolute",bottom:6,left:"50%",transform:"translateX(-50%)"}}>
                <PixelCharacter level={level.lvl} character={cz} scale={4.6} idle/>
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
              {allDone && (
                <div style={{...C.glass,textAlign:"center",border:`1.5px solid ${GOOD}66`}}>
                  <div style={{fontSize:15,fontWeight:900,color:GOOD}}>✦ SUMMIT REACHED ✦</div>
                  <div style={{fontSize:11.5,color:DIM,marginTop:4,fontWeight:600}}>Every quest complete. The realm rests easy tonight.</div>
                </div>
              )}
              {todayTasks.length===0 && (
                <div style={{...C.glass,textAlign:"center",color:DIM,fontSize:13,fontWeight:600}}>No quests scheduled today.</div>
              )}
              {[...todayTasks].sort((a,b)=>{
                const ad=isCompletedOn(a,today)?1:0, bd=isCompletedOn(b,today)?1:0;
                if (ad!==bd) return ad-bd;
                return (a.order??0)-(b.order??0);
              }).map(t=><QuestCard key={t.id} task={t}/>)}
            </div>
          </div>
        )}

        {/* ══ QUESTS (HabitKit-style grid) ══ */}
        {view==="tasks" && (()=>{
          const wk7 = last7Keys();
          const todayK = dateKey();
          const sortedTasks = [...data.tasks]
            .filter(t=>t.catId && data.categories.find(c=>c.id===t.catId))
            .sort((a,b)=>(a.order??0)-(b.order??0));
          return (
          <div style={{padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={C.sectionTitle}>All Quests</div>
              <button style={{...C.btn,padding:"10px 16px",fontSize:11.5}} onClick={()=>setView("addTask")}>+ NEW QUEST</button>
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
                      {(task.days||[]).length===7 ? "Every day" : (task.days||[]).map(d=>DAYS[d].slice(0,2)).join(" ")}
                      {streak>=2 && <span style={{color:"#ffc46b"}}> · 🔥{streak}</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                    {wk7.map(dk=>{
                      const sched = isScheduledOn(task, dk);
                      const done = isCompletedOn(task, dk);
                      const partial = !done && getReps(task, dk) > 0;
                      const isT = dk===todayK;
                      return (
                        <button key={dk}
                          onClick={e=>{ e.stopPropagation(); if (dk<=todayK) toggleDay(task.id, dk); }}
                          style={{
                            width:22,height:22,borderRadius:7,padding:0,cursor:dk<=todayK?"pointer":"default",
                            background: done ? color : partial ? `${color}55` : sched ? `${color}1e` : "rgba(255,255,255,0.06)",
                            border: isT ? "1.5px solid rgba(255,255,255,0.9)" : "none",
                            boxShadow: done ? `0 0 7px ${color}66` : "none",
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
                <div style={{...C.label,marginTop:16}}>TIMES PER DAY: <span style={{color:"#fff"}}>{t.targetReps||1}</span></div>
                <input type="range" min="1" max="10" step="1" value={t.targetReps||1}
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
                { label:"Quests Left", count:todayTasks.length-todayDone, color:"#a855f7", icon:"⚔" },
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
                        paddingRight:20,
                      }}>
                      {card.text}
                      <button
                        onPointerDown={e=>e.stopPropagation()}
                        onClick={e=>{e.stopPropagation(); boardDelete(col, card.id);}}
                        style={{position:"absolute",top:2,right:3,background:"none",border:"none",color:"rgba(255,255,255,0.6)",fontSize:11,cursor:"pointer",padding:"3px 4px"}}>✕</button>
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
              TAP A CARD TO MOVE IT FORWARD · DRAG SIDEWAYS FOR ANY COLUMN
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
                    <div style={{flex:1,fontSize:17,fontWeight:900,color:"#fff"}}>{l.name}</div>
                    <button onClick={()=>setConfirmBox({type:"list",id:l.id,name:l.name})}
                      style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,color:BAD,fontSize:12,cursor:"pointer",padding:"7px 10px",fontWeight:800}}>DELETE</button>
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:8}}>
                    <input style={{...C.input,flex:1}} value={itemInput} placeholder="Add a bullet..."
                      onChange={e=>setItemInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter")addListItem(l.id,null);}}/>
                    <button style={{...C.btn,padding:"0 16px",fontSize:17}} onClick={()=>addListItem(l.id,null)}>+</button>
                  </div>
                  <div style={{fontSize:8.5,color:FAINT,fontWeight:800,marginBottom:6,textAlign:"center"}}>➜ SENDS IT TO THE BOARD'S TO-DO · ⊕ ADDS A SUB-BULLET</div>
                  {l.items.map(it=>(
                    <div key={it.id}>
                      <div style={{display:"flex",alignItems:"center",gap:9,padding:"7px 0"}}>
                        <button onClick={()=>toggleListItem(l.id,it.id,null)}
                          style={{width:21,height:21,borderRadius:"50%",border:`2px solid ${l.color}`,flexShrink:0,
                            background:it.done?l.color:"transparent",cursor:"pointer",padding:0}}/>
                        <div style={{flex:1,fontSize:13.5,fontWeight:600,color:it.done?FAINT:"#fff",
                          textDecoration:it.done?"line-through":"none",wordBreak:"break-word"}}>{it.text}</div>
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
                          <div style={{flex:1,fontSize:12.5,fontWeight:600,color:c.done?FAINT:DIM,
                            textDecoration:c.done?"line-through":"none",wordBreak:"break-word"}}>{c.text}</div>
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
          </div>
        )}

        {/* ══ SETTINGS ══ */}
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
            </div>

            {/* PAGES */}
            <div style={C.glass}>
              <div style={C.label}>PAGES</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>▦ Board</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Reminders hub & kanban</div>
                </div>
                <Switch on={S.kanbanEnabled} onToggle={()=>setSetting("kanbanEnabled",!S.kanbanEnabled)}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>◔ Focus</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Pomodoro timer</div>
                </div>
                <Switch on={S.pomodoroEnabled} onToggle={()=>setSetting("pomodoroEnabled",!S.pomodoroEnabled)}/>
              </div>
            </div>

            {/* CHARACTER */}
            <div style={C.glass}>
              <div style={C.label}>YOUR CHAMPION</div>
              <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
                <PixelCharacter level={level.lvl} character={cz} scale={6.5} idle/>
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

            {/* DANGER ZONE */}
            <div style={{...C.glass,border:`1.5px solid ${BAD}55`}}>
              <div style={{...C.label,color:BAD}}>DANGER ZONE</div>
              <button style={{...C.btnSm,width:"100%",padding:"14px",color:BAD}}
                onClick={()=>setConfirmBox({type:"reset"})}>
                ↺ RESET STATS (KEEPS QUESTS & HISTORY)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ FLOATING DOCK ══ */}
      <div style={C.nav}>
        {navItems.map(n=>(
          <button key={n.v} style={C.navBtn(isActive(n.v))} onClick={()=>setView(n.v)}>
            <span style={{fontSize:18,lineHeight:1}}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}
