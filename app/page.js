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

// ── THEMES ────────────────────────────────────────────────────────────────────
const THEMES = {
  ember: {
    name:"Ember", swatch:"#f59e0b",
    bg:"#07060f", card:"#100f20", card2:"#0b0a18", line:"#201e3c", line2:"#16152c",
    accent:"#f59e0b", text:"#eef0f6", dim:"#9a9ab8", faint:"#52527a",
    good:"#34d399", bad:"#f87171",
    glow:"radial-gradient(ellipse at 20% 30%,#1a0f0033 0%,transparent 55%),radial-gradient(ellipse at 80% 10%,#14082633 0%,transparent 50%)",
  },
  midnight: {
    name:"Midnight", swatch:"#8b5cf6",
    bg:"#0a0918", card:"#14122a", card2:"#0e0d20", line:"#272348", line2:"#1c1936",
    accent:"#8b5cf6", text:"#eef0f6", dim:"#a09ec4", faint:"#565288",
    good:"#34d399", bad:"#f87171",
    glow:"radial-gradient(ellipse at 20% 25%,#1b103a44 0%,transparent 55%),radial-gradient(ellipse at 85% 12%,#0d1f3a33 0%,transparent 50%)",
  },
  ocean: {
    name:"Ocean", swatch:"#38bdf8",
    bg:"#04101c", card:"#0a1a2c", card2:"#071424", line:"#1a3450", line2:"#11253c",
    accent:"#38bdf8", text:"#ecf4fa", dim:"#92aec6", faint:"#4a6884",
    good:"#34d399", bad:"#f87171",
    glow:"radial-gradient(ellipse at 20% 25%,#04284244 0%,transparent 55%),radial-gradient(ellipse at 85% 12%,#0a324c33 0%,transparent 50%)",
  },
  forest: {
    name:"Forest", swatch:"#34d399",
    bg:"#05110b", card:"#0b1c13", card2:"#08160e", line:"#1c3a2a", line2:"#132a1e",
    accent:"#34d399", text:"#eef6f0", dim:"#94b8a4", faint:"#4a7860",
    good:"#4ade80", bad:"#f87171",
    glow:"radial-gradient(ellipse at 20% 25%,#06301c44 0%,transparent 55%),radial-gradient(ellipse at 85% 12%,#0a3a2433 0%,transparent 50%)",
  },
  rose: {
    name:"Rose", swatch:"#f472b6",
    bg:"#140711", card:"#221021", card2:"#190b18", line:"#42203c", line2:"#2e162a",
    accent:"#f472b6", text:"#f8eef4", dim:"#c498b4", faint:"#7c5070",
    good:"#34d399", bad:"#f87171",
    glow:"radial-gradient(ellipse at 20% 25%,#3a0e2c44 0%,transparent 55%),radial-gradient(ellipse at 85% 12%,#2a0a3a33 0%,transparent 50%)",
  },
  crimson: {
    name:"Crimson", swatch:"#ef4444",
    bg:"#10070a", card:"#1e0e12", card2:"#160a0d", line:"#3c1e26", line2:"#2a141a",
    accent:"#ef4444", text:"#f8eeee", dim:"#c49aa0", faint:"#7c5058",
    good:"#34d399", bad:"#f87171",
    glow:"radial-gradient(ellipse at 20% 25%,#36080e44 0%,transparent 55%),radial-gradient(ellipse at 85% 12%,#2a0a0a33 0%,transparent 50%)",
  },
};
const THEME_KEYS = Object.keys(THEMES);

// ── DEFAULTS ──────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  kanbanEnabled: true,
  pomodoroEnabled: true,
  showXP: true,
  statStyle: "radar", // "radar" | "bars" | "none"
  theme: "ember",
};
const DEFAULT_EQUIPPED = {
  boots:true, sword:true, armor:true, shield:true, helm:true,
  trim:true, aura:true, crown:true, wings:true,
};
const DEFAULT_CHARACTER = {
  skin:"#9c6b3c", hair:"#1a0e08", shirt:"#a16207", pants:"#1f2937",
  equipped: { ...DEFAULT_EQUIPPED },
};
const DEFAULT_POMO = { workMin:25, breakMin:5, sessionsByDay:{} };

const SKINS  = ["#f6d7b0","#eac086","#c98c53","#9c6b3c","#7b4a24","#5a3318"];
const HAIRS  = ["#1a0e08","#3b2219","#6b3e1e","#a8763e","#d9a05b","#4a4a4a","#b5b5b5","#e8c14d","#8a2f1d","#46355c"];
const SHIRTS = ["#a16207","#7c2d12","#1d4ed8","#15803d","#7e22ce","#be185d","#0e7490","#3f3f46","#b91c1c","#ca8a04"];
const PANTS  = ["#1f2937","#3f2d1d","#1e3a8a","#14532d","#4c1d95","#52525b","#7f1d1d","#374151"];
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
  return {
    ...d,
    settings,
    character: {
      ...DEFAULT_CHARACTER, ...(d.character||{}),
      equipped: { ...DEFAULT_EQUIPPED, ...((d.character||{}).equipped||{}) },
    },
    customTitles: d.customTitles || {},
    kanban: (d.kanban && Array.isArray(d.kanban.todo)) ? d.kanban : { todo:[], doing:[], done:[] },
    pomodoro: { ...DEFAULT_POMO, ...(d.pomodoro||{}), sessionsByDay: { ...((d.pomodoro||{}).sessionsByDay||{}) } },
    lastDecayDate: d.lastDecayDate || dateKey(),
  };
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

  const steel = has("armor",7), leather = !steel && has("armor",5);
  const torsoColor = steel ? "#9fb0c1" : leather ? "#6b3a1f" : (level>=1 ? shirt : "#8a7a64");
  R(8.7,10.8,6.6,5.4,torsoColor,0.9);
  R(8.7,15.2,6.6,1.0,shade(torsoColor,-26),0.5);
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
  if (!helm) {
    R(8.0,2.9,8.0,2.2,hair,1.0);
    R(8.0,4.6,1.3,1.9,hair,0.5);
    R(14.7,4.6,1.3,1.9,hair,0.5);
    R(11.2,4.8,1.6,0.9,hair,0.4);
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

// ── HOLD-TO-COMPLETE RING (Streaks style) ─────────────────────────────────────
function HoldRing({ color, trackColor, reps, target, onComplete, onShortTap, size=48, holdMs=650 }) {
  const [prog, setProg] = useState(0);
  const raf = useRef(null);
  const startT = useRef(0);
  const fired = useRef(false);
  const done = reps >= target;
  const isBonus = reps > target;
  const stroke = 3.5;
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
          onComplete();
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
    <div
      onPointerDown={begin} onPointerUp={end} onPointerLeave={end} onPointerCancel={end}
      onContextMenu={e=>e.preventDefault()} onClick={e=>{e.stopPropagation();e.preventDefault();}}
      style={{ width:size, height:size, position:"relative", flexShrink:0, cursor:"pointer",
        touchAction:"none", WebkitUserSelect:"none", userSelect:"none", WebkitTouchCallout:"none" }}
    >
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill={done ? color : "transparent"}
          stroke={trackColor||"#26263f"} strokeWidth={stroke} opacity={done?0.95:1}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - ringPct)}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: prog>0 ? "none" : "stroke-dashoffset .3s ease",
            filter: prog>0||done ? `drop-shadow(0 0 6px ${color})` : "none" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
        justifyContent:"center", pointerEvents:"none" }}>
        {done
          ? <span style={{ color:"#0a0a14", fontSize:size*0.42, fontWeight:900 }}>✓</span>
          : target > 1
            ? <span style={{ color:"#9a9ab8", fontSize:size*0.26, fontWeight:700 }}>{reps}/{target}</span>
            : prog > 0
              ? <span style={{ color, fontSize:size*0.3 }}>●</span>
              : null
        }
      </div>
      {isBonus && (
        <div style={{ position:"absolute", top:-4, right:-4, background:"#f59e0b", color:"#000",
          fontSize:9, fontWeight:900, padding:"1px 5px", borderRadius:8 }}>
          +{reps-target}
        </div>
      )}
    </div>
  );
}

// ── RADAR CHART ───────────────────────────────────────────────────────────────
function RadarChart({ categories, ghostCategories, T }) {
  const sz=230, cx=115, cy=115, Rr=82;
  if (!categories || categories.length<3) return <div style={{color:T.faint,textAlign:"center",padding:"40px 0",fontSize:13}}>Add 3+ categories</div>;
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
        <filter id="rglow"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="polyFill"><stop offset="0%" stopColor={T.accent} stopOpacity="0.18"/><stop offset="100%" stopColor={T.accent} stopOpacity="0.03"/></radialGradient>
        <radialGradient id="ghostFill"><stop offset="0%" stopColor="#34d399" stopOpacity="0.07"/><stop offset="100%" stopColor="#34d399" stopOpacity="0.01"/></radialGradient>
      </defs>
      {[.2,.4,.6,.8,1].map((lv,li)=>{
        const pts=Array.from({length:n},(_,i)=>pt(ang(i),Rr*lv));
        const d=pts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ")+"Z";
        return <path key={li} d={d} fill="none" stroke={li===4?T.line:T.line2} strokeWidth={li===4?1.2:0.6}/>;
      })}
      {Array.from({length:n},(_,i)=>{const o=pt(ang(i),Rr);return <line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke={T.line2} strokeWidth="1"/>;})}
      {ghostCategories && ghostCategories.length>=3 && <path d={polyPath(ghostCategories)} fill="url(#ghostFill)" stroke="#34d399" strokeWidth="1.4" strokeDasharray="4,3" opacity="0.65"/>}
      <path d={polyPath(categories)} fill="url(#polyFill)" stroke={T.accent} strokeWidth="2" filter="url(#rglow)" strokeLinejoin="round"/>
      {categories.map((c,i)=>{
        const ratio=Math.max(0,Math.min(1,c.value/c.maxValue));
        const dot=pt(ang(i),Rr*ratio);
        const lab=pt(ang(i),Rr+22);
        return (<g key={c.id}>
          <circle cx={dot.x} cy={dot.y} r="4.5" fill={c.color}/>
          <text x={lab.x} y={lab.y-7} textAnchor="middle" fontSize="12" fill={c.color}>{c.icon}</text>
          <text x={lab.x} y={lab.y+6} textAnchor="middle" fontSize="7.5" fill={T.dim} fontFamily="'Cinzel',serif" letterSpacing="0.5">{(c.name||"").slice(0,7).toUpperCase()}</text>
        </g>);
      })}
    </svg>
  );
}

// ── MONTH CALENDAR (per-task history; tap past days to toggle) ────────────────
function MonthCalendar({ task, color, viewYear, viewMonth, onPrev, onNext, onToggleDay, T }) {
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
        <button onClick={onPrev} style={{background:T.card2,border:`1px solid ${T.line}`,borderRadius:10,color:T.dim,padding:"5px 14px",cursor:"pointer",fontSize:15}}>‹</button>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:12,letterSpacing:2,color:T.text,fontWeight:700}}>{MONTHS[viewMonth].toUpperCase()} {viewYear}</div>
        <button onClick={onNext} style={{background:T.card2,border:`1px solid ${T.line}`,borderRadius:10,color:T.dim,padding:"5px 14px",cursor:"pointer",fontSize:15}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
        {DAYS.map(d=>(<div key={d} style={{textAlign:"center",fontSize:8,color:T.faint,letterSpacing:1,fontWeight:700}}>{d.toUpperCase().slice(0,2)}</div>))}
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
                aspectRatio:"1", borderRadius:"50%", border: isToday ? `2px solid ${color}` : `1px solid ${T.line2}`,
                background: done ? color : partial ? `${color}44` : T.card2,
                color: done ? "#0a0a14" : sched ? T.dim : T.faint,
                fontSize:10, fontWeight: done?800:500, cursor: isFuture?"default":"pointer",
                opacity: isFuture ? 0.3 : sched ? 1 : 0.45,
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow: done ? `0 0 7px ${color}66` : "none", padding:0,
              }}>
              {dayNum}
            </button>
          );
        })}
      </div>
      <div style={{display:"flex",gap:14,marginTop:10,justifyContent:"center",fontSize:8,letterSpacing:1,color:T.faint,fontWeight:600}}>
        <span><span style={{color}}>●</span> DONE</span>
        <span><span style={{color:`${color}88`}}>◐</span> PARTIAL</span>
        <span>○ MISSED</span>
      </div>
    </div>
  );
}

// ── SWITCH ────────────────────────────────────────────────────────────────────
function Switch({ on, onToggle, color="#f59e0b", track="#26263f" }) {
  return (
    <button onClick={onToggle} style={{
      width:48, height:28, borderRadius:14, border:"none", cursor:"pointer",
      background: on ? color : track, position:"relative", transition:"background .2s", flexShrink:0, padding:0,
    }}>
      <div style={{
        width:22, height:22, borderRadius:"50%", background:"#fff", position:"absolute", top:3,
        left: on ? 23 : 3, transition:"left .2s", boxShadow:"0 1px 3px #0008",
      }}/>
    </button>
  );
}

// ── WEEK PILLS (HabitForge-style M T W T F S S) ───────────────────────────────
function WeekPills({ task, color, T }) {
  const wk = weekDateKeys();
  const labels = ["M","T","W","T","F","S","S"];
  const todayK = dateKey();
  return (
    <div style={{display:"flex",gap:3.5}}>
      {wk.map((dk,i)=>{
        const sched = isScheduledOn(task, dk);
        const done = isCompletedOn(task, dk);
        const isToday = dk === todayK;
        const future = dk > todayK;
        return (
          <div key={dk} style={{
            width:17, height:17, borderRadius:5, fontSize:8.5, fontWeight:800,
            display:"flex", alignItems:"center", justifyContent:"center",
            background: done ? color : sched ? `${color}1c` : "transparent",
            color: done ? "#0a0a14" : sched ? (future ? `${color}88` : color) : T.faint,
            border: isToday ? `1.5px solid ${color}` : sched ? `1px solid ${color}33` : `1px solid ${T.line2}`,
            opacity: sched || done ? 1 : 0.4,
          }}>
            {labels[i]}
          </div>
        );
      })}
    </div>
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
    <div style={{background:"#07060f",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#f59e0b",fontFamily:"'Cinzel',serif",fontSize:18,letterSpacing:4}}>
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
  const orphanTasks = data.tasks.filter(t=>!t.catId || !data.categories.find(c=>c.id===t.catId));
  const pomoTotal = (pomoPhase==="work" ? (data.pomodoro.workMin||25) : (data.pomodoro.breakMin||5))*60;
  const pomoToday = (data.pomodoro.sessionsByDay||{})[today]||0;
  const [qText, qAuthor] = quoteOfDay();
  const nowD = new Date();
  const dateLabel = `${DAYS[nowD.getDay()].toUpperCase()}, ${MONTHS[nowD.getMonth()].slice(0,3).toUpperCase()} ${nowD.getDate()}`;

  // ── THEMED STYLES ───────────────────────────────────────────────────────────
  const FONT_BODY = `-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,sans-serif`;
  const FONT_DISPLAY = `'Cinzel',Georgia,serif`;
  const C = {
    app:{background:T.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:FONT_BODY,color:T.text,paddingBottom:"calc(env(safe-area-inset-bottom, 0px) + 96px)",position:"relative"},
    header:{padding:"calc(env(safe-area-inset-top, 0px) + 16px) 18px 12px",borderBottom:`1px solid ${T.line2}`,background:`linear-gradient(180deg,${T.card2} 0%,transparent 100%)`,position:"sticky",top:0,zIndex:5,backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)"},
    card:{background:`linear-gradient(160deg,${T.card} 0%,${T.card2} 100%)`,border:`1px solid ${T.line}`,borderRadius:18,padding:"16px 17px",marginBottom:12,boxShadow:"0 4px 24px #00000040"},
    label:{fontSize:9.5,letterSpacing:3,color:T.faint,marginBottom:10,fontFamily:FONT_DISPLAY,fontWeight:700},
    input:{background:T.card2,border:`1px solid ${T.line}`,borderRadius:12,padding:"12px 14px",color:T.text,fontSize:14,width:"100%",boxSizing:"border-box",fontFamily:FONT_BODY,outline:"none"},
    select:{background:T.card2,border:`1px solid ${T.line}`,borderRadius:12,padding:"12px 14px",color:T.text,fontSize:14,width:"100%",boxSizing:"border-box",fontFamily:FONT_BODY,outline:"none",WebkitAppearance:"none"},
    btn:{background:`linear-gradient(135deg,${shade(T.accent,-30)},${T.accent})`,color:"#0a0a14",border:"none",borderRadius:12,padding:"12px 18px",fontSize:12,cursor:"pointer",fontFamily:FONT_DISPLAY,letterSpacing:2,fontWeight:800,boxShadow:`0 4px 18px ${T.accent}44`},
    btnSm:{background:T.card2,color:T.dim,border:`1px solid ${T.line}`,borderRadius:10,padding:"8px 14px",fontSize:10.5,cursor:"pointer",fontFamily:FONT_DISPLAY,letterSpacing:1,fontWeight:700},
    nav:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:`${T.bg}ee`,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderTop:`1px solid ${T.line2}`,display:"flex",justifyContent:"space-around",padding:"10px 0 calc(env(safe-area-inset-bottom, 0px) + 12px)",zIndex:10},
    navBtn:a=>({background:"none",border:"none",color:a?T.accent:T.faint,fontSize:7.5,letterSpacing:1.5,cursor:"pointer",fontFamily:FONT_DISPLAY,fontWeight:700,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"2px 6px",transition:"color .2s"}),
    dayBtn:on=>({width:36,height:36,borderRadius:"50%",border:`2px solid ${on?T.accent:T.line}`,background:on?`${T.accent}1a`:"transparent",color:on?T.accent:T.faint,fontSize:9.5,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}),
    modal:{position:"fixed",inset:0,background:"#000c",zIndex:900,display:"flex",alignItems:"flex-end",justifyContent:"center"},
    sheet:{background:`linear-gradient(180deg,${T.card},${T.card2})`,borderRadius:"24px 24px 0 0",border:`1px solid ${T.line}`,borderBottom:"none",width:"100%",maxWidth:430,maxHeight:"88vh",overflowY:"auto",padding:"18px 20px calc(env(safe-area-inset-bottom, 0px) + 30px)"},
    chip:(on)=>({flex:1,padding:"10px 0",borderRadius:12,border:`1.5px solid ${on?T.accent:T.line}`,background:on?`${T.accent}1a`:T.card2,color:on?T.accent:T.dim,fontSize:10,fontFamily:FONT_DISPLAY,fontWeight:800,letterSpacing:1.5,cursor:"pointer",textAlign:"center"}),
  };
  const navItems = [
    { v:"dashboard", icon:"⌂", label:"HOME" },
    { v:"tasks",     icon:"⚔", label:"QUESTS" },
    ...(S.kanbanEnabled   ? [{ v:"board", icon:"▦", label:"BOARD" }] : []),
    ...(S.pomodoroEnabled ? [{ v:"focus", icon:"◔", label:"FOCUS" }] : []),
    { v:"stats", icon:"◆", label:"STATS" },
    { v:"settings", icon:"⚙", label:"MORE" },
  ];
  const isActive=(v)=>view===v||(view==="addTask"&&v==="tasks")||(view==="editTask"&&v==="tasks");

  // ── QUEST CARD (HabitForge-style) ───────────────────────────────────────────
  const QuestCard = ({task, showEdit}) => {
    const cat = data.categories.find(c=>c.id===task.catId);
    const color = cat?.color || T.accent;
    const target = task.targetReps||1;
    const reps = getReps(task, today);
    const done = reps >= target;
    const streak = getStreak(task);
    const qlvl = questLevel(task);
    const qpct = questLevelPct(task);
    const schedToday = isScheduledOn(task, today);
    return (
      <div
        onClick={()=>{ setDetailTaskId(task.id); setCalCursor({y:new Date().getFullYear(), m:new Date().getMonth()}); }}
        style={{
          background:`linear-gradient(160deg,${color}14 0%,${color}08 55%,${T.card2} 100%)`,
          border:`1px solid ${done?`${color}55`:`${color}26`}`,
          borderRadius:16, padding:"12px 13px", marginBottom:9, cursor:"pointer",
          opacity: done ? 0.72 : 1, transition:"all .25s",
          boxShadow: done ? "none" : `0 3px 16px #00000038`,
        }}>
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          {/* Level badge */}
          <div style={{
            width:38,height:38,borderRadius:10,flexShrink:0,
            background:`linear-gradient(160deg,${color},${shade(color,-45)})`,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            boxShadow:`0 2px 10px ${color}44`,
          }}>
            <div style={{fontSize:6.5,fontWeight:900,color:"#0a0a14",opacity:.7,letterSpacing:.5,lineHeight:1}}>LV</div>
            <div style={{fontSize:15,fontWeight:900,color:"#0a0a14",lineHeight:1}}>{qlvl}</div>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{fontSize:14.5,fontWeight:600,color:done?T.dim:T.text,textDecoration:done?"line-through":"none",
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{task.name}</div>
              {streak >= 2 && (
                <div style={{flexShrink:0,fontSize:9.5,fontWeight:800,color:"#fb923c",background:"#fb923c1a",
                  border:"1px solid #fb923c33",padding:"1.5px 6px",borderRadius:8}}>🔥{streak}</div>
              )}
            </div>
            {/* Quest XP progress bar */}
            <div style={{height:4.5,background:"#00000055",borderRadius:3,overflow:"hidden",marginTop:6,marginBottom:6}}>
              <div style={{height:"100%",width:`${qpct}%`,background:`linear-gradient(90deg,${color}88,${color})`,borderRadius:3,transition:"width .5s ease"}}/>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
              <WeekPills task={task} color={color} T={T}/>
              <div style={{fontSize:8.5,color:T.faint,fontWeight:700,letterSpacing:.5,whiteSpace:"nowrap"}}>
                {cat?.icon} {S.showXP ? `+${task.points.toFixed(3)}` : diffLabel(task.importance??5)}
              </div>
            </div>
          </div>
          {schedToday || done ? (
            <HoldRing color={color} trackColor={T.line} reps={reps} target={target}
              onComplete={()=>addRep(task.id, today)}
              onShortTap={()=>toast$("HOLD TO COMPLETE", color)} />
          ) : (
            <div style={{width:48,textAlign:"center",fontSize:8,color:T.faint,fontWeight:700,letterSpacing:1}}>REST<br/>DAY</div>
          )}
          {showEdit && (
            <button onClick={e=>{e.stopPropagation(); setEditTask({...task}); setView("editTask");}}
              style={{background:"none",border:"none",color:T.faint,fontSize:14,cursor:"pointer",padding:"4px 2px"}}>✎</button>
          )}
        </div>
      </div>
    );
  };

  // ── IMPORTANCE SLIDER BLOCK ─────────────────────────────────────────────────
  const ImportanceBlock = ({ value, onChange }) => (
    <div>
      <div style={{...C.label,marginBottom:5}}>
        DIFFICULTY: <span style={{color:T.accent}}>{S.showXP ? `${value}/10` : diffLabel(value)}</span>
      </div>
      <input type="range" min="1" max="10" step="1" value={value}
        onChange={e=>onChange(parseInt(e.target.value))}
        style={{width:"100%",accentColor:T.accent}}/>
      {S.showXP && (
        <div style={{marginTop:8,padding:"9px 11px",background:T.card2,borderRadius:10,border:`1px solid ${T.line}`,
          display:"flex",justifyContent:"space-between",fontSize:10.5,fontWeight:700,letterSpacing:.5}}>
          <span style={{color:T.good}}>+{calcPoints(value).toFixed(3)} done</span>
          <span style={{color:T.bad}}>−{calcDecay(value).toFixed(3)} missed</span>
        </div>
      )}
      <div style={{fontSize:9,color:T.faint,marginTop:6,letterSpacing:1,textAlign:"center",fontWeight:600}}>
        HARDER QUESTS = BIGGER REWARD AND RISK
      </div>
    </div>
  );

  return (
    <div style={C.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&display=swap');
        @keyframes popIn { 0%{transform:scale(.6);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes sparkle { 0%,100%{opacity:.4;transform:scale(.9)} 50%{opacity:1;transform:scale(1.15)} }
        @keyframes slideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes breathe { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        * { -webkit-tap-highlight-color: transparent; }
        input[type=range]{ height: 28px; }
      `}</style>
      <div style={{position:"fixed",inset:0,background:T.glow,pointerEvents:"none",zIndex:0}}/>

      {/* TOAST */}
      {toast && (
        <div style={{position:"fixed",top:"calc(env(safe-area-inset-top, 0px) + 14px)",left:"50%",transform:"translateX(-50%)",background:`${T.bg}f2`,
          border:`1px solid ${toast.color}77`,color:toast.color,padding:"10px 22px",borderRadius:30,fontSize:12,
          fontFamily:FONT_DISPLAY,fontWeight:700,zIndex:999,letterSpacing:1.5,boxShadow:`0 4px 24px ${toast.color}33`,
          whiteSpace:"nowrap",maxWidth:"88vw",overflow:"hidden",textOverflow:"ellipsis",animation:"popIn .25s ease"}}>
          {toast.msg}
        </div>
      )}

      {/* LEVEL-UP MODAL */}
      {showLevelUp && (
        <div style={{position:"fixed",inset:0,background:"#000d",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:`linear-gradient(150deg,${T.accent}1f,${T.card2})`,border:`2px solid ${T.accent}`,borderRadius:24,
            padding:"30px 40px",textAlign:"center",boxShadow:`0 0 60px ${T.accent}88`,maxWidth:320,animation:"popIn .4s ease"}}>
            <div style={{fontSize:11,letterSpacing:6,color:T.accent,fontFamily:FONT_DISPLAY,fontWeight:800,animation:"sparkle 1.2s infinite"}}>★ LEVEL UP ★</div>
            <div style={{margin:"18px 0",display:"flex",justifyContent:"center"}}>
              <PixelCharacter level={showLevelUp.lvl} character={cz} scale={8} idle/>
            </div>
            <div style={{fontSize:24,fontFamily:FONT_DISPLAY,fontWeight:900,color:T.accent,letterSpacing:3,textShadow:`0 0 20px ${T.accent}88`}}>LV {showLevelUp.lvl}</div>
            <div style={{fontSize:18,color:T.text,fontFamily:FONT_DISPLAY,fontWeight:700,letterSpacing:2,marginTop:4}}>{showLevelUp.name.toUpperCase()}</div>
            <div style={{fontSize:11,color:T.good,marginTop:12,fontWeight:800,letterSpacing:1.5}}>UNLOCKED</div>
            <div style={{fontSize:13,color:T.dim,marginTop:3}}>{showLevelUp.unlock}</div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmBox && (
        <div style={{position:"fixed",inset:0,background:"#000c",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setConfirmBox(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:`linear-gradient(150deg,#2a101055,${T.card2})`,border:"2px solid #ef4444",borderRadius:20,padding:"24px 26px",maxWidth:340,width:"100%",boxShadow:"0 0 40px #ef444455",animation:"popIn .25s ease"}}>
            <div style={{fontSize:10,letterSpacing:4,color:"#ef4444",fontFamily:FONT_DISPLAY,fontWeight:800,textAlign:"center",marginBottom:14}}>
              {confirmBox.type==="reset" ? "⚠ RESET STATS" : "⚠ CONFIRM DELETE"}
            </div>
            <div style={{fontSize:14,color:T.text,textAlign:"center",marginBottom:10,lineHeight:1.5}}>
              {confirmBox.type==="reset"
                ? <>Reset your character's stats back to the start? Your quests, names, history, and customization are <span style={{color:T.good}}>kept</span>.</>
                : <>Are you sure you want to delete <span style={{color:T.accent,fontWeight:"bold"}}>{confirmBox.name}</span>?</>}
            </div>
            {confirmBox.type==="cat" && confirmBox.taskCount > 0 && (
              <div style={{fontSize:11,color:"#fb923c",textAlign:"center",marginBottom:10,fontWeight:700,letterSpacing:.5,background:"#fb923c14",padding:"8px 10px",borderRadius:10,border:"1px solid #fb923c33"}}>
                {confirmBox.taskCount} quest(s) will need reassignment
              </div>
            )}
            <div style={{display:"flex",gap:10,marginTop:14}}>
              <button style={{...C.btnSm,flex:1,padding:"12px"}} onClick={()=>setConfirmBox(null)}>CANCEL</button>
              <button style={{background:"linear-gradient(135deg,#b91c1c,#ef4444)",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:11,cursor:"pointer",fontFamily:FONT_DISPLAY,letterSpacing:2,fontWeight:800,flex:1}}
                onClick={()=>{
                  if (confirmBox.type==="cat") { deleteCat(confirmBox.id); setEditingCat(null); }
                  else if (confirmBox.type==="task") { deleteTask(confirmBox.id); toast$("QUEST DELETED","#ef4444"); }
                  else if (confirmBox.type==="reset") resetStats();
                  setConfirmBox(null);
                }}>
                {confirmBox.type==="reset" ? "RESET" : "DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAG GHOST */}
      {drag && (
        <div style={{position:"fixed",left:drag.x,top:drag.y,transform:"translate(-50%,-120%)",zIndex:1200,
          background:T.card,border:`1.5px solid ${T.accent}`,borderRadius:12,padding:"10px 14px",
          fontSize:13,color:T.text,boxShadow:`0 8px 30px #000a, 0 0 16px ${T.accent}44`,pointerEvents:"none",
          maxWidth:200,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
          {drag.text}
        </div>
      )}

      {/* TASK DETAIL SHEET */}
      {detailTask && (
        <div style={C.modal} onClick={()=>setDetailTaskId(null)}>
          <div style={{...C.sheet, animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:42,height:4,background:T.line,borderRadius:2,margin:"0 auto 16px"}}/>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
              <HoldRing color={detailCat?.color||T.accent} trackColor={T.line} size={74}
                reps={getReps(detailTask,today)} target={detailTask.targetReps||1}
                onComplete={()=>addRep(detailTask.id, today)}
                onShortTap={()=>toast$("HOLD TO COMPLETE", detailCat?.color)}/>
              <div style={{flex:1}}>
                <div style={{fontSize:17,color:T.text,fontWeight:700}}>{detailTask.name}</div>
                <div style={{fontSize:10.5,color:T.dim,marginTop:4,fontWeight:600,letterSpacing:.5}}>
                  {detailCat?.icon} {detailCat?.name} · {diffLabel(detailTask.importance??5)}
                  {S.showXP && ` · +${detailTask.points.toFixed(3)} / −${detailTask.decayRate.toFixed(3)}`}
                </div>
                <div style={{display:"flex",gap:16,marginTop:10}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:16,color:"#fb923c",fontWeight:800}}>🔥{getStreak(detailTask)}</div>
                    <div style={{fontSize:7.5,color:T.faint,fontWeight:700,letterSpacing:1}}>STREAK</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:16,color:detailCat?.color||T.accent,fontWeight:800}}>{totalCompletions(detailTask)}</div>
                    <div style={{fontSize:7.5,color:T.faint,fontWeight:700,letterSpacing:1}}>TOTAL</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:16,color:T.text,fontWeight:800}}>LV {questLevel(detailTask)}</div>
                    <div style={{fontSize:7.5,color:T.faint,fontWeight:700,letterSpacing:1}}>QUEST</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{fontSize:8.5,color:T.faint,fontWeight:700,letterSpacing:1.5,textAlign:"center",marginBottom:14}}>
              HOLD THE RING TO COMPLETE · TAP A PAST DAY BELOW TO LOG IT
            </div>
            <div style={{...C.card, marginBottom:12}}>
              <MonthCalendar task={detailTask} color={detailCat?.color||T.accent} T={T}
                viewYear={calCursor.y} viewMonth={calCursor.m}
                onPrev={()=>setCalCursor(c=>c.m===0?{y:c.y-1,m:11}:{y:c.y,m:c.m-1})}
                onNext={()=>setCalCursor(c=>c.m===11?{y:c.y+1,m:0}:{y:c.y,m:c.m+1})}
                onToggleDay={(dk)=>toggleDay(detailTask.id, dk)}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              {getReps(detailTask,today)>0 && (
                <button style={{...C.btnSm,flex:1,padding:"12px",color:"#ef4444",borderColor:"#ef444433"}}
                  onClick={()=>clearDay(detailTask.id, today)}>↺ CLEAR TODAY</button>
              )}
              <button style={{...C.btnSm,flex:1,padding:"12px"}}
                onClick={()=>{ setEditTask({...detailTask}); setDetailTaskId(null); setView("editTask"); }}>✎ EDIT</button>
              <button style={{...C.btn,flex:1,padding:"12px"}} onClick={()=>setDetailTaskId(null)}>DONE</button>
            </div>
          </div>
        </div>
      )}

      <div style={{position:"relative",zIndex:1}}>
        {/* ══ HEADER ══ */}
        <div style={C.header}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:17,fontFamily:FONT_DISPLAY,fontWeight:900,letterSpacing:3,color:T.accent,textShadow:`0 0 20px ${T.accent}55`}}>LIFE RPG</div>
              <div style={{fontSize:8.5,letterSpacing:2.5,color:T.faint,marginTop:2,fontWeight:700}}>{dateLabel}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:13,fontWeight:800,color:allDone?T.good:T.text}}>{todayDone}<span style={{color:T.faint,fontWeight:600}}>/{todayTasks.length}</span></div>
                <div style={{fontSize:7,letterSpacing:1.5,color:T.faint,fontWeight:700}}>TODAY</div>
              </div>
              <div style={{position:"relative",width:36,height:36}}>
                <svg width="36" height="36">
                  <circle cx="18" cy="18" r="14.5" fill="none" stroke={T.line} strokeWidth="3.5"/>
                  <circle cx="18" cy="18" r="14.5" fill="none" stroke={allDone?T.good:T.accent} strokeWidth="3.5" strokeLinecap="round"
                    strokeDasharray={2*Math.PI*14.5}
                    strokeDashoffset={2*Math.PI*14.5*(1-(todayTasks.length?todayDone/todayTasks.length:0))}
                    transform="rotate(-90 18 18)" style={{transition:"stroke-dashoffset .4s ease",filter:allDone?`drop-shadow(0 0 5px ${T.good})`:"none"}}/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>
                  {allDone?"✓":"⚔"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ DASHBOARD ══ */}
        {view==="dashboard" && (
          <div style={{padding:"14px 16px"}}>
            {/* HERO CARD */}
            <div style={{...C.card, padding:"18px", background:`linear-gradient(160deg,${T.accent}10 0%,${T.card} 35%,${T.card2} 100%)`, border:`1px solid ${T.accent}26`}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{flexShrink:0}}>
                  <PixelCharacter level={level.lvl} character={cz} scale={7.2} idle/>
                </div>
                <div style={{flex:1,textAlign:"left",minWidth:0}}>
                  <div style={{display:"inline-flex",alignItems:"center",gap:6,background:`${T.accent}18`,border:`1px solid ${T.accent}40`,borderRadius:8,padding:"3px 9px"}}>
                    <span style={{fontSize:9,fontWeight:900,color:T.accent,letterSpacing:1}}>LV {level.lvl}</span>
                    <span style={{fontSize:9,fontWeight:700,color:T.dim,letterSpacing:1}}>{getTitle(data, level.lvl).toUpperCase()}</span>
                  </div>
                  <div style={{fontSize:48,fontWeight:900,fontFamily:FONT_DISPLAY,color:tier.color,lineHeight:1.05,textShadow:`0 0 28px ${tier.color}66`,marginTop:8}}>{rating}</div>
                  <div style={{fontSize:9,letterSpacing:4,color:tier.color,fontFamily:FONT_DISPLAY,fontWeight:800,marginTop:2}}>{tier.label}</div>
                </div>
              </div>
              <div style={{marginTop:14}}>
                <div style={{height:8,background:"#00000055",borderRadius:4,overflow:"hidden",border:`1px solid ${T.line2}`}}>
                  <div style={{height:"100%",width:`${level.lvl===14?100:lvlProgress}%`,background:`linear-gradient(90deg,${shade(T.accent,-30)},${T.accent})`,borderRadius:4,boxShadow:`0 0 12px ${T.accent}88`,transition:"width .6s ease"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:8.5,letterSpacing:1,color:T.faint,marginTop:5,fontWeight:700}}>
                  <span>LV {level.lvl}</span>
                  {level.lvl<14
                    ? <span style={{color:T.dim}}>{level.ratingForNext - rating} PTS TO {getTitle(data, level.lvl+1).toUpperCase()}</span>
                    : <span style={{color:T.accent}}>MAX LEVEL</span>}
                  <span>LV {level.lvl===14?"MAX":level.lvl+1}</span>
                </div>
              </div>
              {/* Projection pills */}
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <div style={{flex:1,background:"#34d39910",border:"1px solid #34d39930",borderRadius:12,padding:"8px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:8,letterSpacing:1,color:T.good,fontWeight:800}}>ALL DONE</span>
                  <span style={{fontSize:16,fontWeight:900,color:T.good}}>{ratingIfAllDone}<span style={{fontSize:9,opacity:.7}}> +{ratingIfAllDone-rating}</span></span>
                </div>
                <div style={{flex:1,background:"#f8717110",border:"1px solid #f8717130",borderRadius:12,padding:"8px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:8,letterSpacing:1,color:T.bad,fontWeight:800}}>NONE DONE</span>
                  <span style={{fontSize:16,fontWeight:900,color:T.bad}}>{ratingIfNoneDone}<span style={{fontSize:9,opacity:.7}}> {ratingIfNoneDone<rating?`−${rating-ratingIfNoneDone}`:"—"}</span></span>
                </div>
              </div>
              {/* Quote of the day */}
              <div style={{marginTop:13,paddingTop:12,borderTop:`1px solid ${T.line2}`,textAlign:"center"}}>
                <div style={{fontSize:11.5,color:T.dim,fontStyle:"italic",lineHeight:1.5}}>"{qText}"</div>
                <div style={{fontSize:8.5,color:T.faint,marginTop:4,letterSpacing:1.5,fontWeight:700}}>— {qAuthor.toUpperCase()}</div>
              </div>
            </div>

            {/* STAT DISPLAY (radar / bars / none) */}
            {S.statStyle === "radar" && (
              <div style={C.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{...C.label,marginBottom:0}}>STAT CHART</div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:16,height:1.5,background:T.accent}}/><div style={{fontSize:8,color:T.faint,fontWeight:700}}>NOW</div></div>
                    <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:16,height:0,borderTop:"1.5px dashed #34d399"}}/><div style={{fontSize:8,color:"#34d399",fontWeight:700}}>POTENTIAL</div></div>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"center"}}>
                  <RadarChart categories={data.categories} ghostCategories={ghostCategories} T={T}/>
                </div>
              </div>
            )}
            {S.statStyle === "bars" && (
              <div style={C.card}>
                <div style={C.label}>ATTRIBUTES</div>
                {data.categories.map(c=>{
                  const pct = (c.value/c.maxValue)*100;
                  const ghost = ghostCategories.find(g=>g.id===c.id);
                  const gpct = ghost ? (ghost.value/c.maxValue)*100 : pct;
                  return (
                    <div key={c.id} style={{marginBottom:11}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <span style={{fontSize:12,fontWeight:700,color:T.text}}>{c.icon} {c.name}</span>
                        <span style={{fontSize:11,fontWeight:800,color:c.color}}>{S.showXP ? c.value.toFixed(2) : `${Math.round(pct)}%`}</span>
                      </div>
                      <div style={{height:9,background:"#00000055",borderRadius:5,overflow:"hidden",border:`1px solid ${T.line2}`,position:"relative"}}>
                        {gpct > pct && <div style={{position:"absolute",inset:0,width:`${gpct}%`,background:`${c.color}28`,borderRadius:5}}/>}
                        <div style={{position:"absolute",inset:0,width:`${pct}%`,background:`linear-gradient(90deg,${c.color}99,${c.color})`,borderRadius:5,boxShadow:`0 0 8px ${c.color}55`,transition:"width .6s ease"}}/>
                      </div>
                    </div>
                  );
                })}
                <div style={{fontSize:8,color:T.faint,textAlign:"center",fontWeight:700,letterSpacing:1,marginTop:4}}>LIGHTER ZONE = TODAY'S POTENTIAL</div>
              </div>
            )}

            {/* TODAY'S QUESTS */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",margin:"4px 2px 10px"}}>
              <div style={{fontSize:13,fontFamily:FONT_DISPLAY,fontWeight:800,letterSpacing:2,color:T.text}}>TODAY'S QUESTS</div>
              <div style={{fontSize:10,color:T.faint,fontWeight:700}}>{todayDone} OF {todayTasks.length}</div>
            </div>
            {allDone && (
              <div style={{background:`linear-gradient(135deg,#34d39918,${T.card2})`,border:"1px solid #34d39955",borderRadius:16,padding:"16px",textAlign:"center",marginBottom:10,boxShadow:"0 0 24px #34d39922"}}>
                <div style={{fontSize:13,fontFamily:FONT_DISPLAY,fontWeight:800,color:"#34d399",letterSpacing:2}}>✦ ALL QUESTS COMPLETE ✦</div>
                <div style={{fontSize:10.5,color:T.dim,marginTop:4}}>The realm rests easy tonight. Well fought.</div>
              </div>
            )}
            {todayTasks.length===0 && (
              <div style={{...C.card,textAlign:"center",color:T.faint,fontSize:13}}>No quests scheduled today.</div>
            )}
            {[...todayTasks].sort((a,b)=>{
              const ad=isCompletedOn(a,today)?1:0, bd=isCompletedOn(b,today)?1:0;
              if (ad!==bd) return ad-bd;
              return (b.importance??5)-(a.importance??5);
            }).map(t=><QuestCard key={t.id} task={t}/>)}
          </div>
        )}

        {/* ══ QUESTS (all) ══ */}
        {view==="tasks" && (
          <div style={{padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:13,fontFamily:FONT_DISPLAY,fontWeight:800,letterSpacing:2,color:T.text}}>ALL QUESTS</div>
              <button style={{...C.btn,padding:"9px 16px",fontSize:10}} onClick={()=>setView("addTask")}>+ NEW QUEST</button>
            </div>
            {[...data.tasks].filter(t=>t.catId && data.categories.find(c=>c.id===t.catId))
              .sort((a,b)=>(b.importance??5)-(a.importance??5))
              .map(t=><QuestCard key={t.id} task={t} showEdit/>)}
            {orphanTasks.length>0 && (
              <div style={{...C.card,border:"1px solid #fb923c44",marginTop:12}}>
                <div style={{...C.label,color:"#fb923c"}}>NEEDS A CATEGORY</div>
                {orphanTasks.map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${T.line2}`}}>
                    <div style={{flex:1,fontSize:13,color:T.text}}>{t.name}</div>
                    <select style={{...C.select,width:140,padding:"8px 10px",fontSize:12}} value=""
                      onChange={e=>{ if(e.target.value) update({...data, tasks:data.tasks.map(x=>x.id===t.id?{...x,catId:e.target.value}:x)}); }}>
                      <option value="">Assign...</option>
                      {data.categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                    <button onClick={()=>setConfirmBox({type:"task",id:t.id,name:t.name})}
                      style={{background:"none",border:"none",color:T.faint,fontSize:15,cursor:"pointer"}}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ ADD / EDIT QUEST ══ */}
        {(view==="addTask"||view==="editTask") && (()=> {
          const isEdit = view==="editTask";
          const t = isEdit ? editTask : newTask;
          const set = isEdit ? (u)=>setEditTask({...editTask,...u}) : (u)=>setNewTask({...newTask,...u});
          if (!t) return null;
          return (
            <div style={{padding:"14px 16px"}}>
              <div style={{fontSize:13,fontFamily:FONT_DISPLAY,fontWeight:800,letterSpacing:2,color:T.text,marginBottom:12}}>
                {isEdit?"EDIT QUEST":"NEW QUEST"}
              </div>
              <div style={C.card}>
                <div style={C.label}>QUEST NAME</div>
                <input style={C.input} value={t.name} placeholder="e.g. Morning run"
                  onChange={e=>set({name:e.target.value})}/>
                <div style={{...C.label,marginTop:16}}>CATEGORY</div>
                <select style={C.select} value={t.catId||""} onChange={e=>set({catId:e.target.value})}>
                  {data.categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
                <div style={{marginTop:16}}>
                  <ImportanceBlock value={t.importance??5} onChange={v=>set({importance:v})}/>
                </div>
                <div style={{...C.label,marginTop:16}}>TIMES PER DAY: <span style={{color:T.accent}}>{t.targetReps||1}</span></div>
                <input type="range" min="1" max="10" step="1" value={t.targetReps||1}
                  onChange={e=>set({targetReps:parseInt(e.target.value)})}
                  style={{width:"100%",accentColor:T.accent}}/>
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
                  <button style={{...C.btnSm,flex:1,padding:"13px"}} onClick={()=>{isEdit?setEditTask(null):null; setView("tasks");}}>CANCEL</button>
                  {isEdit && (
                    <button style={{...C.btnSm,flex:1,padding:"13px",color:"#ef4444",borderColor:"#ef444433"}}
                      onClick={()=>setConfirmBox({type:"task",id:t.id,name:t.name})}>DELETE</button>
                  )}
                  <button style={{...C.btn,flex:1,padding:"13px"}} onClick={isEdit?saveEditTask:addTask}>
                    {isEdit?"SAVE":"CREATE"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══ BOARD (Reminders-style hub + draggable kanban) ══ */}
        {view==="board" && S.kanbanEnabled && (
          <div style={{padding:"14px 16px"}}>
            {/* Reminders-style summary tiles */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[
                { label:"To Do", count:data.kanban.todo.length, color:"#3b82f6", icon:"☰" },
                { label:"In Progress", count:data.kanban.doing.length, color:"#f59e0b", icon:"◑" },
                { label:"Done", count:data.kanban.done.length, color:"#34d399", icon:"✓" },
                { label:"Quests Left", count:todayTasks.length-todayDone, color:"#a78bfa", icon:"⚔" },
              ].map(tile=>(
                <div key={tile.label} style={{
                  background:`linear-gradient(150deg,${tile.color}cc,${tile.color}88)`,
                  borderRadius:16,padding:"12px 14px",boxShadow:`0 4px 16px ${tile.color}33`,
                }}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:"#ffffff2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff"}}>{tile.icon}</div>
                    <div style={{fontSize:24,fontWeight:900,color:"#fff",lineHeight:1}}>{tile.count}</div>
                  </div>
                  <div style={{fontSize:12,fontWeight:700,color:"#fff",marginTop:8,opacity:.95}}>{tile.label}</div>
                </div>
              ))}
            </div>

            {/* Quick add (goes to To Do) */}
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              <input style={{...C.input,flex:1}} value={boardInput} placeholder="Add a task or reminder..."
                onChange={e=>setBoardInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")boardAdd();}}/>
              <button style={{...C.btn,padding:"0 18px",fontSize:18,fontWeight:900}} onClick={boardAdd}>+</button>
            </div>

            {/* 3 vertical columns, drag between them */}
            <div ref={boardRef} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,alignItems:"start"}}>
              {[
                { col:"todo",  label:"TO DO",       color:"#3b82f6" },
                { col:"doing", label:"IN PROGRESS", color:"#f59e0b" },
                { col:"done",  label:"DONE",        color:"#34d399" },
              ].map(({col,label,color})=>(
                <div key={col} style={{
                  background:T.card2,border:`1.5px solid ${dragOverCol===col&&drag?color:T.line2}`,
                  borderRadius:14,padding:"8px 6px",minHeight:180,transition:"border .15s",
                  boxShadow: dragOverCol===col&&drag ? `0 0 16px ${color}33` : "none",
                }}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5,marginBottom:8}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:color}}/>
                    <div style={{fontSize:8,fontWeight:800,letterSpacing:1,color:T.dim}}>{label}</div>
                    <div style={{fontSize:8,fontWeight:800,color:T.faint}}>{data.kanban[col].length}</div>
                  </div>
                  {data.kanban[col].map(card=>(
                    <div key={card.id}
                      onPointerDown={e=>dragStart(e, col, card)}
                      style={{
                        background:T.card,border:`1px solid ${drag?.id===card.id?color:T.line}`,
                        borderRadius:10,padding:"9px 8px",marginBottom:6,
                        fontSize:11.5,lineHeight:1.35,color:col==="done"?T.faint:T.text,
                        textDecoration:col==="done"?"line-through":"none",
                        touchAction:"pan-y",cursor:"grab",position:"relative",
                        opacity:drag?.id===card.id?0.35:1,
                        WebkitUserSelect:"none",userSelect:"none",
                        boxShadow:"0 2px 8px #00000030",
                      }}>
                      {card.text}
                      <button
                        onPointerDown={e=>e.stopPropagation()}
                        onClick={e=>{e.stopPropagation(); boardDelete(col, card.id);}}
                        style={{position:"absolute",top:1,right:2,background:"none",border:"none",color:T.faint,fontSize:11,cursor:"pointer",padding:"3px 4px"}}>✕</button>
                    </div>
                  ))}
                  {data.kanban[col].length===0 && (
                    <div style={{fontSize:9,color:T.faint,textAlign:"center",padding:"22px 4px",fontWeight:600}}>
                      {drag ? "DROP HERE" : "EMPTY"}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{fontSize:8.5,color:T.faint,textAlign:"center",marginTop:10,fontWeight:700,letterSpacing:1}}>
              DRAG A CARD SIDEWAYS TO MOVE IT BETWEEN COLUMNS
            </div>
            {data.kanban.done.length>0 && (
              <button style={{...C.btnSm,width:"100%",marginTop:12,padding:"11px"}} onClick={boardClearDone}>
                CLEAR COMPLETED ({data.kanban.done.length})
              </button>
            )}
          </div>
        )}

        {/* ══ FOCUS (Pomodoro) ══ */}
        {view==="focus" && S.pomodoroEnabled && (
          <div style={{padding:"14px 16px"}}>
            <div style={{...C.card,textAlign:"center",padding:"24px 18px",background:`linear-gradient(160deg,${pomoPhase==="work"?T.accent:"#34d399"}0e 0%,${T.card} 40%,${T.card2} 100%)`}}>
              <div style={{fontSize:11,fontFamily:FONT_DISPLAY,fontWeight:800,letterSpacing:3,color:pomoPhase==="work"?T.accent:"#34d399"}}>
                {pomoPhase==="work"?"⚔ FOCUS BATTLE":"🛡 RESTING AT CAMP"}
              </div>
              <div style={{position:"relative",width:215,height:215,margin:"20px auto"}}>
                <svg width="215" height="215">
                  <circle cx="107.5" cy="107.5" r="96" fill="none" stroke={T.line} strokeWidth="9"/>
                  <circle cx="107.5" cy="107.5" r="96" fill="none"
                    stroke={pomoPhase==="work"?T.accent:"#34d399"} strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={2*Math.PI*96}
                    strokeDashoffset={2*Math.PI*96*(1-(pomoTotal?pomoLeft/pomoTotal:0))}
                    transform="rotate(-90 107.5 107.5)"
                    style={{transition:"stroke-dashoffset 1s linear",filter:`drop-shadow(0 0 8px ${pomoPhase==="work"?T.accent:"#34d399"}66)`}}/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <div style={{fontSize:46,fontWeight:900,fontFamily:FONT_DISPLAY,color:T.text,letterSpacing:2}}>
                    {String(Math.floor(pomoLeft/60)).padStart(2,"0")}:{String(pomoLeft%60).padStart(2,"0")}
                  </div>
                  <div style={{fontSize:9,color:T.faint,letterSpacing:2,fontWeight:700,marginTop:2}}>
                    {pomoPhase==="work"?`${data.pomodoro.workMin} MIN FOCUS`:`${data.pomodoro.breakMin} MIN BREAK`}
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <button style={{...C.btn,padding:"13px 34px",fontSize:13}}
                  onClick={()=>setPomoRunning(!pomoRunning)}>
                  {pomoRunning?"PAUSE":"START"}
                </button>
                <button style={{...C.btnSm,padding:"13px 22px"}} onClick={pomoReset}>RESET</button>
              </div>
              <div style={{marginTop:18,display:"inline-flex",alignItems:"center",gap:8,background:`${T.accent}12`,border:`1px solid ${T.accent}33`,borderRadius:20,padding:"7px 16px"}}>
                <span style={{fontSize:13}}>🏆</span>
                <span style={{fontSize:11,fontWeight:800,color:T.text}}>{pomoToday} BATTLE{pomoToday===1?"":"S"} WON TODAY</span>
              </div>
            </div>
            <div style={C.card}>
              <div style={C.label}>FOCUS LENGTH: <span style={{color:T.accent}}>{data.pomodoro.workMin} MIN</span></div>
              <input type="range" min="5" max="60" step="5" value={data.pomodoro.workMin}
                onChange={e=>setPomoDur("workMin",parseInt(e.target.value))}
                style={{width:"100%",accentColor:T.accent}}/>
              <div style={{...C.label,marginTop:14}}>BREAK LENGTH: <span style={{color:"#34d399"}}>{data.pomodoro.breakMin} MIN</span></div>
              <input type="range" min="1" max="30" step="1" value={data.pomodoro.breakMin}
                onChange={e=>setPomoDur("breakMin",parseInt(e.target.value))}
                style={{width:"100%",accentColor:"#34d399"}}/>
            </div>
          </div>
        )}

        {/* ══ STATS (categories + ascension path) ══ */}
        {view==="stats" && (
          <div style={{padding:"14px 16px"}}>
            <div style={{fontSize:13,fontFamily:FONT_DISPLAY,fontWeight:800,letterSpacing:2,color:T.text,marginBottom:12}}>ATTRIBUTES</div>
            <div style={C.card}>
              {data.categories.map(c=>{
                const pct=(c.value/c.maxValue)*100;
                const editing = editingCat===c.id;
                return (
                  <div key={c.id} style={{padding:"10px 0",borderBottom:`1px solid ${T.line2}`}}>
                    {!editing ? (
                      <div onClick={()=>setEditingCat(c.id)} style={{cursor:"pointer"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                          <span style={{fontSize:13.5,fontWeight:700,color:T.text}}>{c.icon} {c.name}</span>
                          <span style={{fontSize:12,fontWeight:800,color:c.color}}>{S.showXP?`${c.value.toFixed(2)} / ${c.maxValue}`:`${Math.round(pct)}%`}</span>
                        </div>
                        <div style={{height:8,background:"#00000055",borderRadius:4,overflow:"hidden",border:`1px solid ${T.line2}`}}>
                          <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${c.color}99,${c.color})`,borderRadius:4,boxShadow:`0 0 8px ${c.color}55`}}/>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{display:"flex",gap:8,marginBottom:8}}>
                          <input style={{...C.input,width:54,textAlign:"center",padding:"10px 4px"}} value={c.icon} maxLength={2}
                            onChange={e=>saveEditCat(c.id,{icon:e.target.value})}/>
                          <input style={{...C.input,flex:1}} value={c.name}
                            onChange={e=>saveEditCat(c.id,{name:e.target.value})}/>
                        </div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                          {CAT_COLORS.map(col=>(
                            <button key={col} onClick={()=>saveEditCat(c.id,{color:col})}
                              style={{width:26,height:26,borderRadius:"50%",background:col,cursor:"pointer",
                                border:c.color===col?"2.5px solid #fff":"2px solid transparent",padding:0}}/>
                          ))}
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <button style={{...C.btnSm,flex:1}} onClick={()=>setEditingCat(null)}>DONE</button>
                          <button style={{...C.btnSm,flex:1,color:"#ef4444",borderColor:"#ef444433"}}
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
                  <input style={{...C.input,width:54,textAlign:"center",padding:"10px 4px"}} value={newCat.icon} maxLength={2}
                    onChange={e=>setNewCat({...newCat,icon:e.target.value})}/>
                  <input style={{...C.input,flex:1}} value={newCat.name} placeholder="Name..."
                    onChange={e=>setNewCat({...newCat,name:e.target.value})}/>
                  <button style={{...C.btn,padding:"0 16px"}} onClick={addCat}>+</button>
                </div>
              </div>
            </div>

            {orphanTasks.length>0 && (
              <div style={{...C.card,border:"1px solid #fb923c44"}}>
                <div style={{...C.label,color:"#fb923c"}}>QUESTS NEEDING REASSIGNMENT</div>
                {orphanTasks.map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0"}}>
                    <div style={{flex:1,fontSize:13,color:T.text}}>{t.name}</div>
                    <select style={{...C.select,width:140,padding:"8px 10px",fontSize:12}} value=""
                      onChange={e=>{ if(e.target.value) update({...data, tasks:data.tasks.map(x=>x.id===t.id?{...x,catId:e.target.value}:x)}); }}>
                      <option value="">Assign...</option>
                      {data.categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* PATH OF ASCENSION — full-color gear previews */}
            <div style={{fontSize:13,fontFamily:FONT_DISPLAY,fontWeight:800,letterSpacing:2,color:T.text,margin:"18px 2px 4px"}}>THE PATH OF ASCENSION</div>
            <div style={{fontSize:10,color:T.faint,margin:"0 2px 12px",fontWeight:600}}>Every level forges new gear. Tap ✎ to rename a title.</div>
            {LEVELS.map(L=>{
              const achieved = level.lvl >= L.lvl;
              const isNext = level.lvl + 1 === L.lvl;
              const isCurrent = level.lvl === L.lvl;
              return (
                <div key={L.lvl} style={{
                  display:"flex",alignItems:"center",gap:12,
                  background: isNext ? `linear-gradient(135deg,${T.accent}16,${T.card2})` : isCurrent ? `linear-gradient(135deg,${T.accent}0c,${T.card2})` : T.card2,
                  border: isNext ? `1.5px solid ${T.accent}` : isCurrent ? `1px solid ${T.accent}66` : `1px solid ${T.line2}`,
                  borderRadius:16,padding:"10px 13px",marginBottom:8,
                  boxShadow: isNext ? `0 0 20px ${T.accent}26` : "none",
                }}>
                  <div style={{flexShrink:0,width:68,display:"flex",justifyContent:"center"}}>
                    <PixelCharacter level={L.lvl} character={cz} scale={2.7} previewAllGear/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:9,fontWeight:900,color:achieved?T.accent:T.dim,background:achieved?`${T.accent}1a`:"#00000040",border:`1px solid ${achieved?T.accent+"44":T.line}`,borderRadius:6,padding:"2px 7px",letterSpacing:1}}>LV {L.lvl}</span>
                      {editingTitleLvl===L.lvl ? (
                        <input autoFocus style={{...C.input,padding:"5px 9px",fontSize:13,width:130}}
                          value={titleDraft} onChange={e=>setTitleDraft(e.target.value)}
                          onKeyDown={e=>{if(e.key==="Enter")saveTitle(L.lvl);}}/>
                      ) : (
                        <span style={{fontSize:14,fontFamily:FONT_DISPLAY,fontWeight:800,letterSpacing:1,color:achieved?T.text:T.dim}}>
                          {getTitle(data, L.lvl).toUpperCase()}
                        </span>
                      )}
                      {isNext && <span style={{fontSize:8,fontWeight:900,color:"#0a0a14",background:T.accent,borderRadius:6,padding:"2px 7px",letterSpacing:1}}>NEXT</span>}
                      {isCurrent && <span style={{fontSize:8,fontWeight:900,color:T.accent,letterSpacing:1}}>◄ YOU</span>}
                      {achieved && !isCurrent && <span style={{fontSize:11,color:T.good}}>✓</span>}
                      {!achieved && !isNext && <span style={{fontSize:10,color:T.faint}}>🔒</span>}
                    </div>
                    <div style={{fontSize:11,color:isNext?T.accent:T.dim,marginTop:4,fontWeight:isNext?700:500}}>
                      {L.unlock}{!achieved && ` · reach rating ${L.lvl*7}`}
                    </div>
                  </div>
                  {editingTitleLvl===L.lvl ? (
                    <button onClick={()=>saveTitle(L.lvl)} style={{background:"none",border:"none",color:T.good,fontSize:16,cursor:"pointer",padding:4}}>✓</button>
                  ) : (
                    <button onClick={()=>{setEditingTitleLvl(L.lvl); setTitleDraft(getTitle(data,L.lvl));}}
                      style={{background:"none",border:"none",color:T.faint,fontSize:13,cursor:"pointer",padding:4}}>✎</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {view==="settings" && (
          <div style={{padding:"14px 16px"}}>
            <div style={{fontSize:13,fontFamily:FONT_DISPLAY,fontWeight:800,letterSpacing:2,color:T.text,marginBottom:12}}>SETTINGS</div>

            {/* THEME */}
            <div style={C.card}>
              <div style={C.label}>THEME</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {THEME_KEYS.map(key=>{
                  const th = THEMES[key];
                  const on = S.theme===key;
                  return (
                    <button key={key} onClick={()=>setSetting("theme",key)}
                      style={{
                        background:th.bg,border:on?`2px solid ${th.swatch}`:`1.5px solid ${T.line}`,
                        borderRadius:14,padding:"12px 6px",cursor:"pointer",
                        display:"flex",flexDirection:"column",alignItems:"center",gap:7,
                        boxShadow:on?`0 0 16px ${th.swatch}44`:"none",
                      }}>
                      <div style={{width:26,height:26,borderRadius:"50%",background:th.swatch,boxShadow:`0 0 10px ${th.swatch}66`}}/>
                      <div style={{fontSize:9,fontWeight:800,letterSpacing:1,color:on?th.swatch:T.dim}}>{th.name.toUpperCase()}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DISPLAY */}
            <div style={C.card}>
              <div style={C.label}>STAT DISPLAY</div>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                {[["radar","RADAR"],["bars","BARS"],["none","HIDDEN"]].map(([v,l])=>(
                  <button key={v} style={C.chip(S.statStyle===v)} onClick={()=>setSetting("statStyle",v)}>{l}</button>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13.5,fontWeight:700,color:T.text}}>Show XP numbers</div>
                  <div style={{fontSize:10.5,color:T.faint,marginTop:2}}>Off = difficulty words instead of decimals</div>
                </div>
                <Switch on={S.showXP} onToggle={()=>setSetting("showXP",!S.showXP)} color={T.accent} track={T.line}/>
              </div>
            </div>

            {/* FEATURES */}
            <div style={C.card}>
              <div style={C.label}>PAGES</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:13.5,fontWeight:700,color:T.text}}>▦ Board</div>
                  <div style={{fontSize:10.5,color:T.faint,marginTop:2}}>Reminders hub & kanban</div>
                </div>
                <Switch on={S.kanbanEnabled} onToggle={()=>setSetting("kanbanEnabled",!S.kanbanEnabled)} color={T.accent} track={T.line}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13.5,fontWeight:700,color:T.text}}>◔ Focus</div>
                  <div style={{fontSize:10.5,color:T.faint,marginTop:2}}>Pomodoro timer</div>
                </div>
                <Switch on={S.pomodoroEnabled} onToggle={()=>setSetting("pomodoroEnabled",!S.pomodoroEnabled)} color={T.accent} track={T.line}/>
              </div>
            </div>

            {/* CHARACTER */}
            <div style={C.card}>
              <div style={C.label}>YOUR CHAMPION</div>
              <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
                <PixelCharacter level={level.lvl} character={cz} scale={6.5} idle/>
              </div>
              {[["skin","SKIN",SKINS],["hair","HAIR",HAIRS],["shirt","SHIRT",SHIRTS],["pants","PANTS",PANTS]].map(([key,lab,opts])=>(
                <div key={key} style={{marginBottom:12}}>
                  <div style={{...C.label,marginBottom:6}}>{lab}</div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                    {opts.map(col=>(
                      <button key={col} onClick={()=>setChar(key,col)}
                        style={{width:30,height:30,borderRadius:"50%",background:col,cursor:"pointer",
                          border:cz[key]===col?`2.5px solid ${T.accent}`:`2px solid ${T.line}`,padding:0,
                          boxShadow:cz[key]===col?`0 0 10px ${T.accent}55`:"none"}}/>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* WARDROBE */}
            <div style={C.card}>
              <div style={C.label}>WARDROBE</div>
              <div style={{fontSize:10.5,color:T.faint,marginBottom:12,fontWeight:600}}>Unlocked gear can be worn or stored.</div>
              {GEAR.map(g=>{
                const unlocked = level.lvl >= g.lvl;
                const worn = cz.equipped[g.slot] !== false;
                return (
                  <div key={g.slot} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${T.line2}`,opacity:unlocked?1:0.45}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:unlocked?T.text:T.dim}}>{g.name}</div>
                      <div style={{fontSize:9.5,color:unlocked?T.good:T.faint,fontWeight:700,letterSpacing:.5,marginTop:1}}>
                        {unlocked?"UNLOCKED":`UNLOCKS AT LV ${g.lvl}`}
                      </div>
                    </div>
                    {unlocked
                      ? <Switch on={worn} onToggle={()=>toggleGear(g.slot)} color={T.accent} track={T.line}/>
                      : <span style={{fontSize:13,color:T.faint}}>🔒</span>}
                  </div>
                );
              })}
            </div>

            {/* DANGER ZONE */}
            <div style={{...C.card,border:"1px solid #ef444433"}}>
              <div style={{...C.label,color:"#ef4444"}}>DANGER ZONE</div>
              <button style={{...C.btnSm,width:"100%",padding:"13px",color:"#ef4444",borderColor:"#ef444444"}}
                onClick={()=>setConfirmBox({type:"reset"})}>
                ↺ RESET STATS (KEEPS QUESTS & HISTORY)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ BOTTOM NAV ══ */}
      <div style={C.nav}>
        {navItems.map(n=>(
          <button key={n.v} style={C.navBtn(isActive(n.v))} onClick={()=>setView(n.v)}>
            <span style={{fontSize:17,lineHeight:1}}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}
