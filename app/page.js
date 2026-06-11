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

// ── DEFAULTS ──────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  kanbanEnabled: true,
  pomodoroEnabled: true,
  showXP: true,
  statStyle: "radar", // "radar" | "bars"
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
  return {
    ...d,
    settings: { ...DEFAULT_SETTINGS, ...(d.settings||{}) },
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
function PixelCharacter({ level, character, scale=7, previewAllGear=false }) {
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

  // Aura (lvl 11)
  if (has("aura",11)) {
    els.push(<circle key={k++} cx={12*s} cy={11*s} r={10.5*s} fill="url(#auraGrad)" />);
  }
  // Wings (lvl 13) — behind body
  if (has("wings",13)) {
    R(2.2,9,3.6,1.6,"#fdf3d8",0.8); R(1.2,10.4,4.6,1.8,"#fbe9b8",0.9);
    R(0.6,12.2,5.0,1.8,"#fdf3d8",0.9); R(1.6,14,3.6,1.5,"#f3da9b",0.8);
    R(18.2,9,3.6,1.6,"#fdf3d8",0.8); R(18.2,10.4,4.6,1.8,"#fbe9b8",0.9);
    R(18.4,12.2,5.0,1.8,"#fdf3d8",0.9); R(18.8,14,3.6,1.5,"#f3da9b",0.8);
  }

  // Legs
  R(9,16,2.2,4.4,pants,0.5);
  R(12.8,16,2.2,4.4,pants,0.5);
  R(9,16,5.9,1.2,pants,0.4);
  // Feet / boots (lvl 2)
  if (has("boots",2)) {
    R(8.4,19.8,3.4,1.9,"#42291a",0.6); R(8.4,20.6,3.4,1.1,shade("#42291a",-18),0.5);
    R(12.3,19.8,3.4,1.9,"#42291a",0.6); R(12.3,20.6,3.4,1.1,shade("#42291a",-18),0.5);
  } else {
    R(9,19.8,2.2,1.4,skin,0.6); R(12.8,19.8,2.2,1.4,skin,0.6);
  }

  // Torso
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

  // Arms
  const armColor = steel ? "#9fb0c1" : leather ? "#6b3a1f" : (level>=1 ? shirt : skin);
  R(7.6,11.2,1.3,4.0,armColor,0.6);
  R(15.1,11.2,1.3,4.0,armColor,0.6);
  R(7.6,14.9,1.3,1.2,skin,0.6);
  R(15.1,14.9,1.3,1.2,skin,0.6);

  // Head
  R(8.2,3.8,7.6,7.2,skin,1.6);
  R(8.2,10.0,7.6,1.0,shade(skin,-18),0.8);
  // Hair (under helm/crown)
  const helm = has("helm",8) && !has("crown",12);
  if (!helm) {
    R(8.0,2.9,8.0,2.2,hair,1.0);
    R(8.0,4.6,1.3,1.9,hair,0.5);
    R(14.7,4.6,1.3,1.9,hair,0.5);
    R(11.2,4.8,1.6,0.9,hair,0.4);
  }
  // Eyes
  R(9.9,6.8,1.4,1.8,"#ffffff",0.7);
  R(12.8,6.8,1.4,1.8,"#ffffff",0.7);
  R(10.3,7.4,0.8,1.0,"#1c1410",0.4);
  R(13.2,7.4,0.8,1.0,"#1c1410",0.4);
  // Mouth
  R(11.2,9.4,1.7,0.55,shade(skin,-55),0.3);

  // Helm (lvl 8, hidden if crown)
  if (helm) {
    R(8.0,2.6,8.0,3.0,"#aab6c2",1.0);
    R(8.0,5.0,8.0,0.8,shade("#aab6c2",-24),0.4);
    R(11.0,0.9,2.0,2.2,"#d6452e",0.6);
  }
  // Crown (lvl 12)
  if (has("crown",12)) {
    R(8.8,1.7,6.4,1.7,"#f1b32b",0.4);
    R(8.8,0.8,1.1,1.2,"#fcd34d",0.3);
    R(11.45,0.6,1.1,1.4,"#fcd34d",0.3);
    R(14.1,0.8,1.1,1.2,"#fcd34d",0.3);
    R(10.2,2.1,0.8,0.8,"#dc2626",0.4);
    R(13.0,2.1,0.8,0.8,"#2563eb",0.4);
  }

  // Shield (lvl 6) — left hand
  if (has("shield",6)) {
    R(4.6,11.6,3.2,4.6,"#6e655a",1.1);
    R(4.6,11.6,3.2,1.0,shade("#6e655a",24),0.6);
    R(5.7,13.0,1.0,1.8,"#f1b32b",0.5);
  }
  // Sword (lvl 3 wood / 4 iron / 10 enchanted) — right hand
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
    <svg width={W*s} height={H*s} viewBox={`0 0 ${W*s} ${H*s}`} style={{display:"block"}}>
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
function HoldRing({ color, reps, target, onComplete, onShortTap, size=46, holdMs=650 }) {
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
          stroke="#23233f" strokeWidth={stroke} opacity={done?0.92:1}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - ringPct)}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: prog>0 ? "none" : "stroke-dashoffset .3s ease",
            filter: prog>0||done ? `drop-shadow(0 0 5px ${color})` : "none" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
        justifyContent:"center", pointerEvents:"none" }}>
        {done
          ? <span style={{ color:"#0a0a14", fontSize:size*0.4, fontWeight:900 }}>✓</span>
          : target > 1
            ? <span style={{ color:"#8a8aa8", fontSize:size*0.26, fontWeight:700, fontFamily:"Cinzel,serif" }}>{reps}/{target}</span>
            : prog > 0
              ? <span style={{ color, fontSize:size*0.3 }}>●</span>
              : null
        }
      </div>
      {isBonus && (
        <div style={{ position:"absolute", top:-4, right:-4, background:"#f59e0b", color:"#000",
          fontSize:9, fontWeight:900, padding:"1px 5px", borderRadius:8, fontFamily:"Cinzel,serif" }}>
          +{reps-target}
        </div>
      )}
    </div>
  );
}

// ── RADAR CHART ───────────────────────────────────────────────────────────────
function RadarChart({ categories, ghostCategories }) {
  const sz=230, cx=115, cy=115, Rr=82;
  if (!categories || categories.length<3) return <div style={{color:"#4b5563",textAlign:"center",padding:"40px 0",fontSize:13}}>Add 3+ categories</div>;
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
        <radialGradient id="polyFill"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15"/><stop offset="100%" stopColor="#ef4444" stopOpacity="0.03"/></radialGradient>
        <radialGradient id="ghostFill"><stop offset="0%" stopColor="#34d399" stopOpacity="0.07"/><stop offset="100%" stopColor="#34d399" stopOpacity="0.01"/></radialGradient>
      </defs>
      {[.2,.4,.6,.8,1].map((lv,li)=>{
        const pts=Array.from({length:n},(_,i)=>pt(ang(i),Rr*lv));
        const d=pts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ")+"Z";
        return <path key={li} d={d} fill="none" stroke={li===4?"#2a2a4a":"#151525"} strokeWidth={li===4?1.2:0.6}/>;
      })}
      {Array.from({length:n},(_,i)=>{const o=pt(ang(i),Rr);return <line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke="#151525" strokeWidth="1"/>;})}
      {ghostCategories && ghostCategories.length>=3 && <path d={polyPath(ghostCategories)} fill="url(#ghostFill)" stroke="#34d399" strokeWidth="1.4" strokeDasharray="4,3" opacity="0.65"/>}
      <path d={polyPath(categories)} fill="url(#polyFill)" stroke="#f59e0b" strokeWidth="2" filter="url(#rglow)" strokeLinejoin="round"/>
      {categories.map((c,i)=>{
        const ratio=Math.max(0,Math.min(1,c.value/c.maxValue));
        const dot=pt(ang(i),Rr*ratio);
        const lab=pt(ang(i),Rr+22);
        return (<g key={c.id}>
          <circle cx={dot.x} cy={dot.y} r="4.5" fill={c.color}/>
          <text x={lab.x} y={lab.y-7} textAnchor="middle" fontSize="12" fill={c.color}>{c.icon}</text>
          <text x={lab.x} y={lab.y+6} textAnchor="middle" fontSize="7.5" fill="#6b7280" fontFamily="'Cinzel',serif" letterSpacing="0.5">{(c.name||"").slice(0,7).toUpperCase()}</text>
        </g>);
      })}
    </svg>
  );
}

// ── MONTH CALENDAR (per-task history; tap past days to toggle) ────────────────
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
        <button onClick={onPrev} style={{background:"#14142a",border:"1px solid #23233f",borderRadius:8,color:"#8a8aa8",padding:"4px 12px",cursor:"pointer",fontSize:14}}>‹</button>
        <div style={{fontFamily:"Cinzel,serif",fontSize:12,letterSpacing:2,color:"#d1d5db"}}>{MONTHS[viewMonth].toUpperCase()} {viewYear}</div>
        <button onClick={onNext} style={{background:"#14142a",border:"1px solid #23233f",borderRadius:8,color:"#8a8aa8",padding:"4px 12px",cursor:"pointer",fontSize:14}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
        {DAYS.map(d=>(<div key={d} style={{textAlign:"center",fontSize:8,color:"#3a3a5a",fontFamily:"Cinzel,serif",letterSpacing:1}}>{d.toUpperCase()}</div>))}
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
                aspectRatio:"1", borderRadius:"50%", border: isToday ? `2px solid ${color}` : "1px solid #1c1c34",
                background: done ? color : partial ? `${color}44` : "#0e0e1e",
                color: done ? "#0a0a14" : sched ? "#9a9ab8" : "#3a3a5a",
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
      <div style={{display:"flex",gap:14,marginTop:10,justifyContent:"center",fontSize:8,fontFamily:"Cinzel,serif",letterSpacing:1,color:"#5a5a7a"}}>
        <span><span style={{color}}>●</span> DONE</span>
        <span><span style={{color:`${color}88`}}>◐</span> PARTIAL</span>
        <span>○ MISSED</span>
      </div>
    </div>
  );
}

// ── SWITCH ────────────────────────────────────────────────────────────────────
function Switch({ on, onToggle, color="#f59e0b" }) {
  return (
    <button onClick={onToggle} style={{
      width:46, height:26, borderRadius:13, border:"none", cursor:"pointer",
      background: on ? color : "#23233f", position:"relative", transition:"background .2s", flexShrink:0, padding:0,
    }}>
      <div style={{
        width:20, height:20, borderRadius:"50%", background:"#fff", position:"absolute", top:3,
        left: on ? 23 : 3, transition:"left .2s", boxShadow:"0 1px 3px #0008",
      }}/>
    </button>
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
  const [confirmBox, setConfirmBox] = useState(null); // {type, id, name, taskCount}
  const [showLevelUp, setShowLevelUp] = useState(null);
  const [editingCat, setEditingCat] = useState(null);
  const [editingTitleLvl, setEditingTitleLvl] = useState(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [currentDay, setCurrentDay] = useState(dateKey());
  const [newTask, setNewTask] = useState({name:"",catId:"career",importance:5,targetReps:1,days:[1,2,3,4,5]});
  const [newCat, setNewCat] = useState({name:"",icon:"⭐",color:"#f59e0b",maxValue:10});
  const [kanbanInput, setKanbanInput] = useState({ todo:"", doing:"", done:"" });
  // Pomodoro client state
  const [pomoPhase, setPomoPhase] = useState("work");
  const [pomoLeft, setPomoLeft] = useState(25*60);
  const [pomoRunning, setPomoRunning] = useState(false);
  const prevLevelRef = useRef(null);
  const midnightRef = useRef(null);

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
            // record session
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

  const toast$ = (msg, color="#f59e0b") => {
    setToast({msg,color});
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
    // retro refund: completing a day that was already decayed
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
    else toast$(`${newReps}/${target} ${task.name}`, cat?.color || "#f59e0b");
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
      // complete to full target in one tap (calendar logging)
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
    toast$("TASK UPDATED ✓");
  };
  const deleteTask = (id) => update({...data, tasks:data.tasks.filter(t=>t.id!==id)});
  const addTask = () => {
    if (!newTask.name.trim()) return;
    const task = { ...newTask, id:`t${Date.now()}`,
      points: calcPoints(newTask.importance), decayRate: calcDecay(newTask.importance), completions:{} };
    update({...data, tasks:[...data.tasks, task]});
    setNewTask({name:"",catId:data.categories[0]?.id||"career",importance:5,targetReps:1,days:[1,2,3,4,5]});
    setView("tasks"); toast$("TASK CREATED!");
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
    toast$("CATEGORY DELETED — TASKS NEED REASSIGNMENT", "#fb923c");
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

  // ── RESET (stats only — keeps tasks, names, history, customization) ─────────
  const resetStats = () => {
    update({...data,
      categories: data.categories.map(c=>({...c, value:3.0})),
      lastDecayDate: dateKey()});
    toast$("STATS RESET — YOUR QUESTS REMAIN", "#fb923c");
  };

  // ── KANBAN ──────────────────────────────────────────────────────────────────
  const kanbanAdd = (col) => {
    const text = (kanbanInput[col]||"").trim();
    if (!text) return;
    update({...data, kanban:{...data.kanban, [col]:[...data.kanban[col], {id:`k${Date.now()}`, text}]}});
    setKanbanInput({...kanbanInput, [col]:""});
  };
  const kanbanMove = (col, id, dir) => {
    const order = ["todo","doing","done"];
    const idx = order.indexOf(col);
    const target = order[idx+dir];
    if (!target) return;
    const card = data.kanban[col].find(c=>c.id===id);
    update({...data, kanban:{...data.kanban,
      [col]: data.kanban[col].filter(c=>c.id!==id),
      [target]: [...data.kanban[target], card]}});
    if (target==="done") { toast$("QUEST COMPLETE ✓","#34d399"); try{navigator.vibrate&&navigator.vibrate(25);}catch{} }
  };
  const kanbanDelete = (col, id) =>
    update({...data, kanban:{...data.kanban, [col]: data.kanban[col].filter(c=>c.id!==id)}});

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
    <div style={{background:"#060610",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#f59e0b",fontFamily:"'Cinzel',serif",fontSize:18,letterSpacing:4}}>
      LOADING...
    </div>
  );

  // ── COMPUTED ────────────────────────────────────────────────────────────────
  const S = data.settings;
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
  const pomoTotal = (pomoPhase==="work" ? (data.pomodoro.workMin||25) : (data.pomodoro.breakMin||5))*60;
  const pomoToday = (data.pomodoro.sessionsByDay||{})[today]||0;

  // ── STYLES ──────────────────────────────────────────────────────────────────
  const C = {
    app:{background:"#060610",minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:"'Georgia',serif",color:"#e5e7eb",paddingBottom:92,position:"relative"},
    header:{padding:"14px 18px 11px",borderBottom:"1px solid #12122a",background:"linear-gradient(180deg,#0d0d1f 0%,transparent 100%)",position:"sticky",top:0,zIndex:5,backdropFilter:"blur(10px)"},
    card:{background:"linear-gradient(135deg,#0f1020 0%,#0a0a18 100%)",border:"1px solid #1e2040",borderRadius:16,padding:"15px 17px",marginBottom:10},
    glowCard:{background:"linear-gradient(135deg,#0f1020 0%,#0a0a18 100%)",border:"1px solid #2a1a00",borderRadius:18,padding:"18px",marginBottom:12,boxShadow:"0 0 40px #f59e0b08"},
    label:{fontSize:9,letterSpacing:4,color:"#3a3a5a",marginBottom:8,fontFamily:"'Cinzel',serif"},
    input:{background:"#0d0d1f",border:"1px solid #1e2040",borderRadius:10,padding:"11px 14px",color:"#e5e7eb",fontSize:13,width:"100%",boxSizing:"border-box",fontFamily:"Georgia,serif",outline:"none"},
    select:{background:"#0d0d1f",border:"1px solid #1e2040",borderRadius:10,padding:"11px 14px",color:"#e5e7eb",fontSize:13,width:"100%",boxSizing:"border-box",fontFamily:"Georgia,serif",outline:"none"},
    btn:{background:"linear-gradient(135deg,#d97706,#f59e0b)",color:"#000",border:"none",borderRadius:10,padding:"10px 18px",fontSize:12,cursor:"pointer",fontFamily:"'Cinzel',serif",letterSpacing:2,fontWeight:"bold",boxShadow:"0 0 18px #f59e0b33"},
    btnSm:{background:"#0d0d1f",color:"#6b7280",border:"1px solid #1e2040",borderRadius:8,padding:"6px 13px",fontSize:10,cursor:"pointer",fontFamily:"Cinzel,serif",letterSpacing:1},
    btnDanger:{background:"transparent",color:"#4b5563",border:"none",fontSize:14,cursor:"pointer",padding:"4px 8px"},
    nav:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"#060610",borderTop:"1px solid #12122a",display:"flex",justifyContent:"space-around",padding:"9px 0 17px",zIndex:10},
    navBtn:a=>({background:"none",border:"none",color:a?"#f59e0b":"#2a2a4a",fontSize:8,letterSpacing:2,cursor:"pointer",fontFamily:"Cinzel,serif",display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"2px 10px"}),
    dayBtn:on=>({width:35,height:35,borderRadius:"50%",border:`2px solid ${on?"#f59e0b":"#1e2040"}`,background:on?"#1a1200":"transparent",color:on?"#f59e0b":"#3a3a5a",fontSize:9,cursor:"pointer",fontFamily:"Cinzel,serif",display:"flex",alignItems:"center",justifyContent:"center"}),
    statBar:{height:5,borderRadius:3,background:"#0d0d1f",overflow:"hidden",marginTop:6,border:"1px solid #12122a"},
    statFill:(color,pct)=>({height:"100%",width:`${Math.max(0,Math.min(100,pct))}%`,background:`linear-gradient(90deg,${color}77,${color})`,borderRadius:3,boxShadow:`0 0 6px ${color}55`,transition:"width .6s ease"}),
    modal:{position:"fixed",inset:0,background:"#000c",zIndex:900,display:"flex",alignItems:"flex-end",justifyContent:"center"},
    sheet:{background:"linear-gradient(180deg,#10102a,#0a0a18)",borderRadius:"22px 22px 0 0",border:"1px solid #23233f",borderBottom:"none",width:"100%",maxWidth:430,maxHeight:"88vh",overflowY:"auto",padding:"18px 20px 30px"},
  };
  const navItems = [
    { v:"dashboard", icon:"◈", label:"HOME" },
    { v:"tasks",     icon:"◻", label:"QUESTS" },
    ...(S.kanbanEnabled   ? [{ v:"board", icon:"▤", label:"BOARD" }] : []),
    ...(S.pomodoroEnabled ? [{ v:"focus", icon:"◔", label:"FOCUS" }] : []),
    { v:"stats", icon:"◆", label:"STATS" },
  ];
  const isActive=(v)=>view===v||(view==="addTask"&&v==="tasks")||(view==="editTask"&&v==="tasks");

  // ── TASK ROW (Streaks-style) ────────────────────────────────────────────────
  const TaskRow = ({task}) => {
    const cat = data.categories.find(c=>c.id===task.catId);
    const target = task.targetReps||1;
    const reps = getReps(task, today);
    const done = reps >= target;
    const streak = getStreak(task);
    return (
      <div
        onClick={()=>{ setDetailTaskId(task.id); setCalCursor({y:new Date().getFullYear(), m:new Date().getMonth()}); }}
        style={{display:"flex",alignItems:"center",gap:12,background:done?"#0a0a14":"#0d0d1e",
          border:`1px solid ${done?(cat?.color||"#888")+"44":"#181830"}`,borderRadius:14,
          padding:"11px 13px",marginBottom:8,cursor:"pointer",transition:"all .25s",
          opacity:done?0.62:1}}>
        <HoldRing color={cat?.color||"#f59e0b"} reps={reps} target={target}
          onComplete={()=>addRep(task.id, today)}
          onShortTap={()=>toast$("HOLD TO COMPLETE", cat?.color||"#f59e0b")} />
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13.5,color:done?"#5a5a78":"#e2e2ee",textDecoration:done?"line-through":"none",
            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{task.name}</div>
          <div style={{fontSize:9,color:"#3a3a5a",marginTop:3,fontFamily:"Cinzel,serif",letterSpacing:1,display:"flex",gap:8,alignItems:"center"}}>
            <span>{cat?.icon} {cat?.name}</span>
            {streak >= 2 && <span style={{color:"#f59e0b"}}>🔥{streak}</span>}
            {S.showXP && <span>+{task.points.toFixed(3)}</span>}
            {!S.showXP && <span>{diffLabel(task.importance??5)}</span>}
          </div>
        </div>
        <div style={{color:"#2a2a4a",fontSize:16}}>›</div>
      </div>
    );
  };

  // ── IMPORTANCE SLIDER BLOCK (shared by add/edit forms) ──────────────────────
  const ImportanceBlock = ({ value, onChange }) => (
    <div>
      <div style={{...C.label,marginBottom:5}}>
        DIFFICULTY: <span style={{color:"#f59e0b"}}>{S.showXP ? `${value}/10` : diffLabel(value)}</span>
      </div>
      <input type="range" min="1" max="10" step="1" value={value}
        onChange={e=>onChange(parseInt(e.target.value))}
        style={{width:"100%",accentColor:"#f59e0b"}}/>
      {S.showXP && (
        <div style={{marginTop:8,padding:"8px 10px",background:"#0d0d1f",borderRadius:8,border:"1px solid #1e2040",
          display:"flex",justifyContent:"space-between",fontSize:10,fontFamily:"Cinzel,serif",letterSpacing:1}}>
          <span style={{color:"#34d399"}}>+{calcPoints(value).toFixed(3)} done</span>
          <span style={{color:"#ef4444"}}>−{calcDecay(value).toFixed(3)} missed</span>
        </div>
      )}
      <div style={{fontSize:9,color:"#3a3a5a",marginTop:5,fontFamily:"Cinzel,serif",letterSpacing:1,textAlign:"center"}}>
        HARDER QUESTS = BIGGER REWARD AND RISK
      </div>
    </div>
  );

  return (
    <div style={C.app}>
      <style>{`
        @keyframes popIn { 0%{transform:scale(.6);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes sparkle { 0%,100%{opacity:.4;transform:scale(.9)} 50%{opacity:1;transform:scale(1.15)} }
        @keyframes slideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 15% 40%,#0f0a2244 0%,transparent 55%),radial-gradient(ellipse at 85% 15%,#1a050544 0%,transparent 50%)",pointerEvents:"none",zIndex:0}}/>

      {/* TOAST */}
      {toast && (
        <div style={{position:"fixed",top:22,left:"50%",transform:"translateX(-50%)",background:`${toast.color}22`,
          border:`1px solid ${toast.color}88`,color:toast.color,padding:"9px 22px",borderRadius:30,fontSize:12,
          fontFamily:"Cinzel,serif",zIndex:999,letterSpacing:2,boxShadow:`0 0 20px ${toast.color}33`,
          whiteSpace:"nowrap",animation:"popIn .25s ease"}}>
          {toast.msg}
        </div>
      )}

      {/* LEVEL-UP MODAL */}
      {showLevelUp && (
        <div style={{position:"fixed",inset:0,background:"#000d",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"linear-gradient(135deg,#1a1200,#0a0a18)",border:"2px solid #f59e0b",borderRadius:22,
            padding:"30px 40px",textAlign:"center",boxShadow:"0 0 60px #f59e0b88",maxWidth:320,animation:"popIn .4s ease"}}>
            <div style={{fontSize:11,letterSpacing:6,color:"#f59e0b",fontFamily:"Cinzel,serif",animation:"sparkle 1.2s infinite"}}>★ LEVEL UP ★</div>
            <div style={{margin:"18px 0",display:"flex",justifyContent:"center"}}>
              <PixelCharacter level={showLevelUp.lvl} character={cz} scale={8}/>
            </div>
            <div style={{fontSize:24,fontFamily:"Cinzel,serif",fontWeight:900,color:"#f59e0b",letterSpacing:3,textShadow:"0 0 20px #f59e0b88"}}>LV {showLevelUp.lvl}</div>
            <div style={{fontSize:18,color:"#e5e7eb",fontFamily:"Cinzel,serif",letterSpacing:2,marginTop:4}}>{showLevelUp.name.toUpperCase()}</div>
            <div style={{fontSize:11,color:"#34d399",marginTop:12,fontFamily:"Cinzel,serif",letterSpacing:1}}>UNLOCKED:</div>
            <div style={{fontSize:13,color:"#d1d5db",marginTop:3}}>{showLevelUp.unlock}</div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmBox && (
        <div style={{position:"fixed",inset:0,background:"#000c",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setConfirmBox(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(135deg,#1a0d0d,#0a0a18)",border:"2px solid #ef4444",borderRadius:18,padding:"24px 26px",maxWidth:340,width:"100%",boxShadow:"0 0 40px #ef444466",animation:"popIn .25s ease"}}>
            <div style={{fontSize:10,letterSpacing:5,color:"#ef4444",fontFamily:"Cinzel,serif",textAlign:"center",marginBottom:14}}>
              {confirmBox.type==="reset" ? "⚠ RESET STATS" : "⚠ CONFIRM DELETE"}
            </div>
            <div style={{fontSize:14,color:"#d1d5db",textAlign:"center",marginBottom:10,lineHeight:1.5}}>
              {confirmBox.type==="reset"
                ? <>Reset your character's stats back to the start? Your quests, names, history, and customization are <span style={{color:"#34d399"}}>kept</span>.</>
                : <>Are you sure you want to delete <span style={{color:"#f59e0b",fontWeight:"bold"}}>{confirmBox.name}</span>?</>}
            </div>
            {confirmBox.type==="cat" && confirmBox.taskCount > 0 && (
              <div style={{fontSize:11,color:"#fb923c",textAlign:"center",marginBottom:10,fontFamily:"Cinzel,serif",letterSpacing:1,background:"#1a0d0066",padding:"8px 10px",borderRadius:8,border:"1px solid #fb923c33"}}>
                {confirmBox.taskCount} quest(s) will need reassignment
              </div>
            )}
            <div style={{display:"flex",gap:10,marginTop:14}}>
              <button style={{...C.btnSm,flex:1,padding:"12px"}} onClick={()=>setConfirmBox(null)}>CANCEL</button>
              <button style={{background:"linear-gradient(135deg,#b91c1c,#ef4444)",color:"#fff",border:"none",borderRadius:8,padding:"12px",fontSize:11,cursor:"pointer",fontFamily:"Cinzel,serif",letterSpacing:2,fontWeight:"bold",flex:1}}
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

      {/* ══ TASK DETAIL SHEET (calendar, streak, hold ring) ══ */}
      {detailTask && (
        <div style={C.modal} onClick={()=>setDetailTaskId(null)}>
          <div style={{...C.sheet, animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:42,height:4,background:"#23233f",borderRadius:2,margin:"0 auto 16px"}}/>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
              <HoldRing color={detailCat?.color||"#f59e0b"} size={74}
                reps={getReps(detailTask,today)} target={detailTask.targetReps||1}
                onComplete={()=>addRep(detailTask.id, today)}
                onShortTap={()=>toast$("HOLD TO COMPLETE", detailCat?.color||"#f59e0b")}/>
              <div style={{flex:1}}>
                <div style={{fontSize:17,color:"#f0f0f8",fontWeight:600}}>{detailTask.name}</div>
                <div style={{fontSize:10,color:"#5a5a7a",marginTop:4,fontFamily:"Cinzel,serif",letterSpacing:1}}>
                  {detailCat?.icon} {detailCat?.name} · {diffLabel(detailTask.importance??5)}
                  {S.showXP && ` · +${detailTask.points.toFixed(3)} / −${detailTask.decayRate.toFixed(3)}`}
                </div>
                <div style={{display:"flex",gap:14,marginTop:8}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:16,color:"#f59e0b",fontWeight:800,fontFamily:"Cinzel,serif"}}>🔥{getStreak(detailTask)}</div>
                    <div style={{fontSize:7,color:"#3a3a5a",fontFamily:"Cinzel,serif",letterSpacing:1}}>STREAK</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:16,color:"#38bdf8",fontWeight:800,fontFamily:"Cinzel,serif"}}>{totalCompletions(detailTask)}</div>
                    <div style={{fontSize:7,color:"#3a3a5a",fontFamily:"Cinzel,serif",letterSpacing:1}}>TOTAL DAYS</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:16,color:"#34d399",fontWeight:800,fontFamily:"Cinzel,serif"}}>{getReps(detailTask,today)}/{detailTask.targetReps||1}</div>
                    <div style={{fontSize:7,color:"#3a3a5a",fontFamily:"Cinzel,serif",letterSpacing:1}}>TODAY</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{fontSize:8,color:"#3a3a5a",fontFamily:"Cinzel,serif",letterSpacing:2,textAlign:"center",marginBottom:14}}>
              HOLD THE RING TO COMPLETE · TAP A PAST DAY BELOW TO LOG IT
            </div>
            <div style={{...C.card, marginBottom:12}}>
              <MonthCalendar task={detailTask} color={detailCat?.color||"#f59e0b"}
                viewYear={calCursor.y} viewMonth={calCursor.m}
                onPrev={()=>setCalCursor(c=>c.m===0?{y:c.y-1,m:11}:{y:c.y,m:c.m-1})}
                onNext={()=>setCalCursor(c=>c.m===11?{y:c.y+1,m:0}:{y:c.y,m:c.m+1})}
                onToggleDay={(dk)=>toggleDay(detailTask.id, dk)}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              {getReps(detailTask,today)>0 && (
                <button style={{...C.btnSm,flex:1,padding:"11px",color:"#ef4444",borderColor:"#ef444433"}}
                  onClick={()=>clearDay(detailTask.id, today)}>↺ CLEAR TODAY</button>
              )}
              <button style={{...C.btnSm,flex:1,padding:"11px"}}
                onClick={()=>{ setEditTask({...detailTask}); setDetailTaskId(null); setView("editTask"); }}>✎ EDIT QUEST</button>
              <button style={{...C.btn,flex:1,padding:"11px"}} onClick={()=>setDetailTaskId(null)}>DONE</button>
            </div>
          </div>
        </div>
      )}

      <div style={{position:"relative",zIndex:1}}>
        {/* ══ HEADER ══ */}
        <div style={C.header}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:19,fontFamily:"'Cinzel',serif",fontWeight:900,letterSpacing:4,color:"#f59e0b",textShadow:"0 0 20px #f59e0b66"}}>⚔ LIFE RPG</div>
              <div style={{fontSize:8,letterSpacing:5,color:"#2a2a4a",marginTop:1,fontFamily:"Cinzel,serif"}}>MASTER YOUR ATTRIBUTES</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {/* daily progress mini-ring */}
              <div style={{position:"relative",width:34,height:34}}>
                <svg width="34" height="34">
                  <circle cx="17" cy="17" r="13.5" fill="none" stroke="#1a1a30" strokeWidth="3"/>
                  <circle cx="17" cy="17" r="13.5" fill="none" stroke={allDone?"#34d399":"#f59e0b"} strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={2*Math.PI*13.5}
                    strokeDashoffset={2*Math.PI*13.5*(1-(todayTasks.length?todayDone/todayTasks.length:0))}
                    transform="rotate(-90 17 17)" style={{transition:"stroke-dashoffset .4s ease"}}/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:allDone?"#34d399":"#8a8aa8",fontFamily:"Cinzel,serif",fontWeight:700}}>
                  {todayDone}/{todayTasks.length}
                </div>
              </div>
              <button onClick={()=>setView("settings")} style={{background:view==="settings"?"#1a1200":"#0d0d1f",border:`1px solid ${view==="settings"?"#f59e0b66":"#1e2040"}`,borderRadius:10,width:34,height:34,cursor:"pointer",color:view==="settings"?"#f59e0b":"#6b7280",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>⚙</button>
            </div>
          </div>
        </div>

        {/* ══ DASHBOARD ══ */}
        {view==="dashboard" && (
          <div style={{padding:"14px 18px"}}>
            {/* Character + rating */}
            <div style={C.glowCard}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{flexShrink:0}}>
                  <PixelCharacter level={level.lvl} character={cz} scale={7.4}/>
                </div>
                <div style={{flex:1,textAlign:"left"}}>
                  <div style={{fontSize:8,letterSpacing:4,color:"#3a3a5a",fontFamily:"Cinzel,serif"}}>LV {level.lvl}</div>
                  <div style={{fontSize:15,fontFamily:"Cinzel,serif",fontWeight:700,color:"#f59e0b",letterSpacing:2,marginTop:2,textShadow:"0 0 15px #f59e0b66"}}>{getTitle(data, level.lvl).toUpperCase()}</div>
                  <div style={{fontSize:46,fontWeight:900,fontFamily:"Cinzel,serif",color:tier.color,lineHeight:1,textShadow:`0 0 25px ${tier.color}88`,marginTop:6}}>{rating}</div>
                  <div style={{fontSize:9,letterSpacing:5,color:tier.color,fontFamily:"Cinzel,serif",marginTop:1}}>{tier.label}</div>
                </div>
              </div>
              <div style={{marginTop:12}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:8,fontFamily:"Cinzel,serif",letterSpacing:2,color:"#4b5563",marginBottom:4}}>
                  <span>LV {level.lvl}</span>
                  <span>{rating}/{level.lvl===14?100:level.ratingForNext}</span>
                  <span>LV {level.lvl===14?"MAX":level.lvl+1}</span>
                </div>
                <div style={{height:6,background:"#0d0d1f",borderRadius:3,border:"1px solid #1e2040",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${level.lvl===14?100:lvlProgress}%`,background:`linear-gradient(90deg,${tier.color}77,${tier.color})`,borderRadius:3,boxShadow:`0 0 10px ${tier.color}66`,transition:"width .6s ease"}}/>
                </div>
                {level.lvl<14 && (
                  <div style={{fontSize:9,color:"#3a3a5a",marginTop:5,fontFamily:"Cinzel,serif",letterSpacing:1,textAlign:"center"}}>
                    NEXT: {getTitle(data, level.lvl+1).toUpperCase()} — {LEVELS[level.lvl+1].unlock}
                  </div>
                )}
              </div>
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <div style={{flex:1,background:"#0d1a10",border:"1px solid #34d39933",borderRadius:10,padding:"7px 9px",textAlign:"center"}}>
                  <div style={{fontSize:7,letterSpacing:3,color:"#34d399",fontFamily:"Cinzel,serif"}}>IF ALL DONE</div>
                  <div style={{fontSize:19,fontWeight:"bold",color:"#34d399",fontFamily:"Cinzel,serif",marginTop:2}}>{ratingIfAllDone}</div>
                  <div style={{fontSize:8,color:"#34d39966"}}>+{ratingIfAllDone-rating}</div>
                </div>
                <div style={{flex:1,background:"#1a0d0d",border:"1px solid #ef444433",borderRadius:10,padding:"7px 9px",textAlign:"center"}}>
                  <div style={{fontSize:7,letterSpacing:3,color:"#ef4444",fontFamily:"Cinzel,serif"}}>IF NONE DONE</div>
                  <div style={{fontSize:19,fontWeight:"bold",color:"#ef4444",fontFamily:"Cinzel,serif",marginTop:2}}>{ratingIfNoneDone}</div>
                  <div style={{fontSize:8,color:"#ef444466"}}>{ratingIfNoneDone<rating?`−${rating-ratingIfNoneDone}`:"holds"}</div>
                </div>
              </div>
            </div>

            {/* Radar chart (only in radar mode) */}
            {S.statStyle === "radar" && (
              <div style={C.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={C.label}>STAT CHART</div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:16,height:1.5,background:"#f59e0b"}}/><div style={{fontSize:8,color:"#4b5563",fontFamily:"Cinzel,serif"}}>NOW</div></div>
                    <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:16,height:0,borderTop:"1.5px dashed #34d399"}}/><div style={{fontSize:8,color:"#34d399",fontFamily:"Cinzel,serif"}}>POTENTIAL</div></div>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"center"}}>
                  <RadarChart categories={data.categories} ghostCategories={ghostCategories}/>
                </div>
              </div>
            )}

            {/* TODAY'S QUESTS */}
            <div style={{marginBottom:14}}>
              <div style={C.label}>TODAY'S QUESTS — {new Date().toLocaleDateString("en-US",{weekday:"long"}).toUpperCase()}</div>
              {todayTasks.length===0
                ? <div style={{color:"#2a2a4a",fontSize:13,textAlign:"center",padding:"20px 0",fontFamily:"Cinzel,serif",letterSpacing:2}}>REST DAY</div>
                : (()=>{
                    const sorted = [...todayTasks].sort((a,b)=>(b.importance??5)-(a.importance??5));
                    const pending = sorted.filter(t=>!isCompletedOn(t,today));
                    const completed = sorted.filter(t=>isCompletedOn(t,today));
                    return (<>
                      {pending.map(t=><TaskRow key={t.id} task={t}/>)}
                      {allDone && (
                        <div style={{textAlign:"center",padding:"16px 0",animation:"popIn .4s ease"}}>
                          <div style={{fontSize:13,color:"#34d399",fontFamily:"Cinzel,serif",letterSpacing:4,animation:"sparkle 1.4s infinite"}}>✦ ALL QUESTS COMPLETE ✦</div>
                          <div style={{fontSize:9,color:"#3a3a5a",marginTop:4,fontFamily:"Cinzel,serif",letterSpacing:2}}>THE REALM GROWS STRONGER</div>
                        </div>
                      )}
                      {completed.length>0 && (<>
                        <div style={{display:"flex",alignItems:"center",gap:8,margin:"14px 0 8px"}}>
                          <div style={{flex:1,height:1,background:"#1e2040"}}/>
                          <div style={{fontSize:8,letterSpacing:4,color:"#34d399",fontFamily:"Cinzel,serif"}}>COMPLETED ({completed.length})</div>
                          <div style={{flex:1,height:1,background:"#1e2040"}}/>
                        </div>
                        {completed.map(t=><TaskRow key={t.id} task={t}/>)}
                      </>)}
                    </>);
                  })()
              }
            </div>

            {/* ATTRIBUTES (serves as the stat-bars view) */}
            <div style={C.label}>{S.statStyle==="bars" ? "STAT BARS" : "ATTRIBUTES"}</div>
            {data.categories.map(cat=>(
              <div key={cat.id} style={C.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <span style={{fontSize:18}}>{cat.icon}</span>
                    <div>
                      <div style={{fontSize:12,color:"#c0c0d0",fontFamily:"Cinzel,serif",letterSpacing:1}}>{cat.name.toUpperCase()}</div>
                      <div style={{fontSize:9,color:"#2a2a4a",marginTop:1}}>{data.tasks.filter(t=>t.catId===cat.id).length} quests</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span style={{fontSize:20,fontWeight:"bold",color:cat.color,fontFamily:"Cinzel,serif",textShadow:`0 0 10px ${cat.color}55`}}>
                      {S.showXP ? cat.value.toFixed(1) : Math.round((cat.value/cat.maxValue)*100)}
                    </span>
                    <span style={{fontSize:10,color:"#2a2a4a"}}>{S.showXP ? `/${cat.maxValue}` : "%"}</span>
                  </div>
                </div>
                <div style={C.statBar}><div style={C.statFill(cat.color,(cat.value/cat.maxValue)*100)}/></div>
              </div>
            ))}
          </div>
        )}

        {/* ══ QUESTS (ALL TASKS) ══ */}
        {view==="tasks" && (
          <div style={{padding:"14px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={C.label}>ALL QUESTS ({data.tasks.length})</div>
              <button style={C.btn} onClick={()=>setView("addTask")}>+ NEW</button>
            </div>
            {data.tasks.map(task=>{
              const cat = data.categories.find(c=>c.id===task.catId);
              const done = isCompletedOn(task, today);
              const streak = getStreak(task);
              return (
                <div key={task.id} style={{...C.card, cursor:"pointer"}}
                  onClick={()=>{ setDetailTaskId(task.id); setCalCursor({y:new Date().getFullYear(),m:new Date().getMonth()}); }}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                    <span style={{fontSize:17,marginTop:1}}>{cat?.icon||"📌"}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,color:"#d1d5db",marginBottom:3}}>{task.name}</div>
                      <div style={{fontSize:9,color:"#3a3a5a",marginBottom:6,fontFamily:"Cinzel,serif",letterSpacing:1}}>
                        {cat?.name||"UNASSIGNED"} · {diffLabel(task.importance??5)}
                        {(task.targetReps||1)>1 && ` · ${task.targetReps}×/day`}
                        {streak>=2 && <span style={{color:"#f59e0b"}}> · 🔥{streak}</span>}
                        {S.showXP && ` · +${task.points.toFixed(3)}/−${task.decayRate.toFixed(3)}`}
                      </div>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                        {DAYS.map((d,i)=>(
                          <div key={i} style={{fontSize:8,padding:"2px 6px",borderRadius:8,fontFamily:"Cinzel,serif",
                            background:(task.days||[]).includes(i)?"#1a1200":"transparent",
                            color:(task.days||[]).includes(i)?"#f59e0b":"#2a2a4a",
                            border:`1px solid ${(task.days||[]).includes(i)?"#f59e0b33":"#12122a"}`}}>{d}</div>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end",flexShrink:0}}>
                      {done && <div style={{fontSize:8,color:"#34d399",fontFamily:"Cinzel,serif",letterSpacing:1}}>✓ TODAY</div>}
                      <button style={C.btnSm} onClick={(e)=>{e.stopPropagation(); setEditTask({...task}); setView("editTask");}}>EDIT</button>
                      <button style={C.btnDanger} onClick={(e)=>{e.stopPropagation(); setConfirmBox({type:"task",id:task.id,name:task.name});}}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ ADD QUEST ══ */}
        {view==="addTask" && (
          <div style={{padding:"14px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <button style={C.btnSm} onClick={()=>setView("tasks")}>← BACK</button>
              <div style={{fontSize:13,fontFamily:"Cinzel,serif",letterSpacing:3,color:"#f59e0b"}}>NEW QUEST</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div><div style={{...C.label,marginBottom:5}}>QUEST NAME</div>
                <input style={C.input} placeholder="e.g. Read 20 mins" value={newTask.name} onChange={e=>setNewTask({...newTask,name:e.target.value})}/></div>
              <div><div style={{...C.label,marginBottom:5}}>CATEGORY</div>
                <select style={C.select} value={newTask.catId} onChange={e=>setNewTask({...newTask,catId:e.target.value})}>
                  {data.categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
              <div><div style={{...C.label,marginBottom:7}}>SCHEDULED DAYS</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {DAYS.map((d,i)=>(<button key={i} style={C.dayBtn(newTask.days.includes(i))}
                    onClick={()=>setNewTask(p=>({...p,days:p.days.includes(i)?p.days.filter(x=>x!==i):[...p.days,i].sort((a,b)=>a-b)}))}>{d}</button>))}
                </div></div>
              <ImportanceBlock value={newTask.importance} onChange={v=>setNewTask({...newTask,importance:v})}/>
              <div>
                <div style={{...C.label,marginBottom:5}}>REPS PER DAY: <span style={{color:"#38bdf8"}}>{newTask.targetReps}×</span></div>
                <input type="range" min="1" max="10" step="1" value={newTask.targetReps} onChange={e=>setNewTask({...newTask,targetReps:parseInt(e.target.value)})} style={{width:"100%",accentColor:"#38bdf8"}}/>
                <div style={{fontSize:9,color:"#3a3a5a",marginTop:5,fontFamily:"Cinzel,serif",letterSpacing:1,textAlign:"center"}}>EXTRAS BEYOND TARGET GIVE BONUS XP</div>
              </div>
              <button style={{...C.btn,width:"100%",padding:"13px"}} onClick={addTask}>CREATE QUEST</button>
            </div>
          </div>
        )}

        {/* ══ EDIT QUEST ══ */}
        {view==="editTask" && editTask && (
          <div style={{padding:"14px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <button style={C.btnSm} onClick={()=>{setEditTask(null);setView("tasks");}}>← BACK</button>
              <div style={{fontSize:13,fontFamily:"Cinzel,serif",letterSpacing:3,color:"#f59e0b"}}>EDIT QUEST</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div><div style={{...C.label,marginBottom:5}}>QUEST NAME</div>
                <input style={C.input} value={editTask.name} onChange={e=>setEditTask({...editTask,name:e.target.value})}/></div>
              <div><div style={{...C.label,marginBottom:5}}>CATEGORY</div>
                <select style={C.select} value={editTask.catId||""} onChange={e=>setEditTask({...editTask,catId:e.target.value})}>
                  {!editTask.catId && <option value="">— unassigned —</option>}
                  {data.categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
              <div><div style={{...C.label,marginBottom:7}}>SCHEDULED DAYS</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {DAYS.map((d,i)=>(<button key={i} style={C.dayBtn((editTask.days||[]).includes(i))}
                    onClick={()=>setEditTask(p=>({...p,days:(p.days||[]).includes(i)?p.days.filter(x=>x!==i):[...(p.days||[]),i].sort((a,b)=>a-b)}))}>{d}</button>))}
                </div></div>
              <ImportanceBlock value={editTask.importance??5} onChange={v=>setEditTask({...editTask,importance:v})}/>
              <div>
                <div style={{...C.label,marginBottom:5}}>REPS PER DAY: <span style={{color:"#38bdf8"}}>{editTask.targetReps??1}×</span></div>
                <input type="range" min="1" max="10" step="1" value={editTask.targetReps??1} onChange={e=>setEditTask({...editTask,targetReps:parseInt(e.target.value)})} style={{width:"100%",accentColor:"#38bdf8"}}/>
              </div>
              <button style={{...C.btn,width:"100%",padding:"13px"}} onClick={saveEditTask}>SAVE CHANGES</button>
            </div>
          </div>
        )}

        {/* ══ KANBAN BOARD ══ */}
        {view==="board" && S.kanbanEnabled && (
          <div style={{padding:"14px 18px"}}>
            <div style={{...C.label, marginBottom:4}}>QUEST BOARD</div>
            <div style={{fontSize:9,color:"#3a3a5a",fontFamily:"Cinzel,serif",letterSpacing:1,marginBottom:14}}>YOUR REMINDERS & ONE-OFF MISSIONS</div>
            {[
              {col:"todo",  title:"TO DO",       color:"#38bdf8"},
              {col:"doing", title:"IN PROGRESS", color:"#f59e0b"},
              {col:"done",  title:"DONE",        color:"#34d399"},
            ].map(({col,title,color})=>(
              <div key={col} style={{...C.card, borderColor:`${color}33`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:10,fontFamily:"Cinzel,serif",letterSpacing:3,color}}>{title}</div>
                  <div style={{fontSize:10,color:"#3a3a5a",fontFamily:"Cinzel,serif"}}>{data.kanban[col].length}</div>
                </div>
                <div style={{display:"flex",gap:6,marginBottom:10}}>
                  <input style={{...C.input,padding:"8px 12px",fontSize:12}} placeholder={`Add to ${title.toLowerCase()}...`}
                    value={kanbanInput[col]} onChange={e=>setKanbanInput({...kanbanInput,[col]:e.target.value})}
                    onKeyDown={e=>{if(e.key==="Enter")kanbanAdd(col);}}/>
                  <button style={{...C.btnSm,padding:"8px 14px",color,borderColor:`${color}44`}} onClick={()=>kanbanAdd(col)}>+</button>
                </div>
                {data.kanban[col].length===0 && <div style={{fontSize:11,color:"#2a2a4a",textAlign:"center",padding:"8px 0"}}>Empty</div>}
                {data.kanban[col].map(card=>(
                  <div key={card.id} style={{display:"flex",alignItems:"center",gap:8,background:"#0d0d1e",border:"1px solid #181830",borderRadius:10,padding:"9px 12px",marginBottom:6}}>
                    {col!=="todo" && <button style={{...C.btnDanger,fontSize:13,padding:"2px 4px"}} onClick={()=>kanbanMove(col,card.id,-1)}>◀</button>}
                    <div style={{flex:1,fontSize:12.5,color:col==="done"?"#5a5a78":"#d1d5db",textDecoration:col==="done"?"line-through":"none"}}>{card.text}</div>
                    {col!=="done" && <button style={{...C.btnDanger,fontSize:13,padding:"2px 4px",color}} onClick={()=>kanbanMove(col,card.id,1)}>▶</button>}
                    <button style={{...C.btnDanger,fontSize:12,padding:"2px 4px"}} onClick={()=>kanbanDelete(col,card.id)}>✕</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ══ POMODORO FOCUS ══ */}
        {view==="focus" && S.pomodoroEnabled && (
          <div style={{padding:"14px 18px"}}>
            <div style={{...C.glowCard, textAlign:"center", padding:"26px 18px"}}>
              <div style={{fontSize:9,letterSpacing:5,color:pomoPhase==="work"?"#f59e0b":"#34d399",fontFamily:"Cinzel,serif",marginBottom:18}}>
                {pomoPhase==="work" ? "⚔ FOCUS BATTLE" : "🛡 RESTING AT CAMP"}
              </div>
              <div style={{position:"relative",width:210,height:210,margin:"0 auto"}}>
                <svg width="210" height="210">
                  <circle cx="105" cy="105" r="92" fill="none" stroke="#14142a" strokeWidth="9"/>
                  <circle cx="105" cy="105" r="92" fill="none"
                    stroke={pomoPhase==="work"?"#f59e0b":"#34d399"} strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={2*Math.PI*92}
                    strokeDashoffset={2*Math.PI*92*(1 - pomoLeft/pomoTotal)}
                    transform="rotate(-90 105 105)"
                    style={{transition:"stroke-dashoffset 1s linear", filter:`drop-shadow(0 0 8px ${pomoPhase==="work"?"#f59e0b":"#34d399"}66)`}}/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <div style={{fontSize:44,fontWeight:900,fontFamily:"Cinzel,serif",color:"#f0f0f8",letterSpacing:2}}>
                    {String(Math.floor(pomoLeft/60)).padStart(2,"0")}:{String(pomoLeft%60).padStart(2,"0")}
                  </div>
                  <div style={{fontSize:9,color:"#3a3a5a",fontFamily:"Cinzel,serif",letterSpacing:3,marginTop:2}}>
                    {pomoPhase==="work"?"FOCUS":"BREAK"}
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:22}}>
                <button style={{...C.btn,padding:"12px 34px",fontSize:13}} onClick={()=>setPomoRunning(!pomoRunning)}>
                  {pomoRunning ? "⏸ PAUSE" : "▶ START"}
                </button>
                <button style={{...C.btnSm,padding:"12px 22px"}} onClick={pomoReset}>↺ RESET</button>
              </div>
              <div style={{marginTop:18,fontSize:10,color:"#5a5a7a",fontFamily:"Cinzel,serif",letterSpacing:2}}>
                ⚔ {pomoToday} BATTLE{pomoToday===1?"":"S"} WON TODAY
              </div>
            </div>
            <div style={C.card}>
              <div style={{...C.label,marginBottom:10}}>TIMER SETTINGS</div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:"#8a8aa8",fontFamily:"Cinzel,serif",letterSpacing:1,marginBottom:5}}>FOCUS LENGTH: <span style={{color:"#f59e0b"}}>{data.pomodoro.workMin} MIN</span></div>
                <input type="range" min="5" max="60" step="5" value={data.pomodoro.workMin}
                  onChange={e=>setPomoDur("workMin",parseInt(e.target.value))} style={{width:"100%",accentColor:"#f59e0b"}}/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#8a8aa8",fontFamily:"Cinzel,serif",letterSpacing:1,marginBottom:5}}>BREAK LENGTH: <span style={{color:"#34d399"}}>{data.pomodoro.breakMin} MIN</span></div>
                <input type="range" min="1" max="30" step="1" value={data.pomodoro.breakMin}
                  onChange={e=>setPomoDur("breakMin",parseInt(e.target.value))} style={{width:"100%",accentColor:"#34d399"}}/>
              </div>
            </div>
          </div>
        )}

        {/* ══ STATS (categories + milestones w/ gear previews + editable titles) ══ */}
        {view==="stats" && (
          <div style={{padding:"14px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={C.label}>CATEGORIES</div>
              <button style={C.btn} onClick={()=>{setEditingCat("NEW");}}>+ ADD</button>
            </div>

            {/* New category form */}
            {editingCat==="NEW" && (
              <div style={{...C.card,border:"1px solid #f59e0b66"}}>
                <div style={{fontSize:9,letterSpacing:3,color:"#f59e0b",fontFamily:"Cinzel,serif",marginBottom:10}}>NEW CATEGORY</div>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  <input style={{...C.input,width:60,textAlign:"center",fontSize:20}} value={newCat.icon} maxLength={2} onChange={e=>setNewCat({...newCat,icon:e.target.value})}/>
                  <input style={{...C.input,flex:1}} placeholder="Name..." value={newCat.name} onChange={e=>setNewCat({...newCat,name:e.target.value})}/>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                  {CAT_COLORS.map(col=>(<button key={col} onClick={()=>setNewCat({...newCat,color:col})} style={{width:26,height:26,borderRadius:"50%",background:col,border:`3px solid ${newCat.color===col?"#fff":"transparent"}`,cursor:"pointer"}}/>))}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button style={{...C.btn,flex:1,padding:"10px"}} onClick={()=>{addCat();setEditingCat(null);}}>CREATE</button>
                  <button style={{...C.btnSm,padding:"10px 16px"}} onClick={()=>setEditingCat(null)}>CANCEL</button>
                </div>
              </div>
            )}

            {/* Orphan tasks */}
            {data.tasks.filter(t=>!t.catId || !data.categories.find(c=>c.id===t.catId)).length>0 && (
              <div style={{background:"#1a1200",border:"1px solid #fb923c66",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
                <div style={{fontSize:10,letterSpacing:3,color:"#fb923c",fontFamily:"Cinzel,serif",marginBottom:6}}>⚠ NEEDS REASSIGNMENT</div>
                {data.tasks.filter(t=>!t.catId || !data.categories.find(c=>c.id===t.catId)).map(task=>(
                  <div key={task.id} style={{display:"flex",alignItems:"center",gap:8,marginTop:7,background:"#0d0d1f",borderRadius:8,padding:"7px 10px"}}>
                    <div style={{flex:1,fontSize:12,color:"#d1d5db"}}>{task.name}</div>
                    <select style={{...C.select,padding:"5px 8px",fontSize:11,width:"auto"}} value="" onChange={e=>{
                      if (e.target.value) { update({...data, tasks:data.tasks.map(t=>t.id===task.id?{...t,catId:e.target.value}:t)}); toast$("REASSIGNED"); }
                    }}>
                      <option value="">Assign to...</option>
                      {data.categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {data.categories.map(cat=>{
              const isEditing = editingCat===cat.id;
              const taskCount = data.tasks.filter(t=>t.catId===cat.id).length;
              if (isEditing) return (
                <div key={cat.id} style={{...C.card, border:`1px solid ${cat.color}66`, boxShadow:`0 0 20px ${cat.color}22`}}>
                  <div style={{fontSize:9,letterSpacing:3,color:cat.color,fontFamily:"Cinzel,serif",marginBottom:10}}>EDITING</div>
                  <div style={{display:"flex",gap:8,marginBottom:10}}>
                    <input style={{...C.input,width:60,textAlign:"center",fontSize:20}} value={cat.icon} maxLength={2} onChange={e=>saveEditCat(cat.id,{icon:e.target.value})}/>
                    <input style={{...C.input,flex:1}} value={cat.name} onChange={e=>saveEditCat(cat.id,{name:e.target.value})}/>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                    {CAT_COLORS.map(col=>(<button key={col} onClick={()=>saveEditCat(cat.id,{color:col})} style={{width:26,height:26,borderRadius:"50%",background:col,border:`3px solid ${cat.color===col?"#fff":"transparent"}`,cursor:"pointer"}}/>))}
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button style={{...C.btn,flex:1,padding:"10px"}} onClick={()=>{setEditingCat(null);toast$("SAVED ✓");}}>DONE</button>
                    <button style={{...C.btnSm,padding:"10px 14px",color:"#ef4444",borderColor:"#ef444433"}} onClick={()=>setConfirmBox({type:"cat",id:cat.id,name:cat.name,taskCount})}>DELETE</button>
                  </div>
                </div>
              );
              return (
                <div key={cat.id} style={{...C.card,cursor:"pointer"}} onClick={()=>setEditingCat(cat.id)}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:22}}>{cat.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{fontSize:13,fontFamily:"Cinzel,serif",letterSpacing:1,color:"#d1d5db"}}>{cat.name}</div>
                        <span style={{fontSize:17,fontWeight:"bold",color:cat.color,fontFamily:"Cinzel,serif"}}>
                          {S.showXP ? cat.value.toFixed(1) : Math.round((cat.value/cat.maxValue)*100)}
                          <span style={{fontSize:10,color:"#2a2a4a"}}>{S.showXP?`/${cat.maxValue}`:"%"}</span>
                        </span>
                      </div>
                      <div style={{fontSize:9,color:"#2a2a4a",marginTop:2,fontFamily:"Cinzel,serif",letterSpacing:1}}>{taskCount} QUESTS · TAP TO EDIT</div>
                      <div style={C.statBar}><div style={C.statFill(cat.color,(cat.value/cat.maxValue)*100)}/></div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* MILESTONES with gear previews + editable titles */}
            <div style={{...C.label, marginTop:24}}>THE PATH OF ASCENSION</div>
            <div style={{fontSize:9,color:"#3a3a5a",fontFamily:"Cinzel,serif",letterSpacing:1,marginBottom:12}}>TAP ✎ TO RENAME A TITLE</div>
            {LEVELS.map(l=>{
              const reached = level.lvl >= l.lvl;
              const isNext = level.lvl + 1 === l.lvl;
              const editing = editingTitleLvl === l.lvl;
              return (
                <div key={l.lvl} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",
                  background: isNext ? "#13130a" : reached ? "#0f1020" : "#08080f",
                  border:`1px solid ${isNext ? "#f59e0b55" : reached ? "#1e2040" : "#0d0d18"}`,
                  borderRadius:12,marginBottom:6,opacity:reached?1:isNext?0.95:0.55,
                  boxShadow: isNext ? "0 0 16px #f59e0b11" : "none"}}>
                  <div style={{flexShrink:0, filter: reached||isNext ? "none" : "grayscale(.8) brightness(.6)"}}>
                    <PixelCharacter level={l.lvl} character={cz} scale={2.6} previewAllGear={true}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:9,fontFamily:"Cinzel,serif",letterSpacing:1,color:reached?"#f59e0b":"#3a3a5a"}}>LV {l.lvl} · {l.lvl*7}+ RATING</div>
                    {editing ? (
                      <div style={{display:"flex",gap:6,marginTop:4}}>
                        <input style={{...C.input,padding:"6px 10px",fontSize:12}} value={titleDraft} autoFocus
                          onChange={e=>setTitleDraft(e.target.value)}
                          onKeyDown={e=>{if(e.key==="Enter")saveTitle(l.lvl);}}/>
                        <button style={{...C.btnSm,padding:"6px 12px",color:"#34d399",borderColor:"#34d39944"}} onClick={()=>saveTitle(l.lvl)}>✓</button>
                      </div>
                    ) : (
                      <div style={{fontSize:13,color:reached?"#e2e2ee":"#4a4a68",fontFamily:"Cinzel,serif",letterSpacing:1,marginTop:1}}>
                        {getTitle(data,l.lvl).toUpperCase()}
                        {isNext && <span style={{color:"#f59e0b",fontSize:9,marginLeft:6}}>← NEXT</span>}
                      </div>
                    )}
                    <div style={{fontSize:9,color:reached?"#34d399":"#2a2a4a",marginTop:2}}>{l.unlock}</div>
                  </div>
                  {!editing && (
                    <button style={{...C.btnDanger,fontSize:13}} onClick={()=>{setEditingTitleLvl(l.lvl);setTitleDraft(getTitle(data,l.lvl));}}>✎</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {view==="settings" && (
          <div style={{padding:"14px 18px"}}>
            <div style={C.label}>FEATURES</div>
            <div style={C.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:13,color:"#d1d5db"}}>▤ Quest Board</div>
                  <div style={{fontSize:10,color:"#3a3a5a",marginTop:2}}>Kanban board for reminders & one-off missions</div>
                </div>
                <Switch on={S.kanbanEnabled} onToggle={()=>setSetting("kanbanEnabled",!S.kanbanEnabled)}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,color:"#d1d5db"}}>◔ Focus Timer</div>
                  <div style={{fontSize:10,color:"#3a3a5a",marginTop:2}}>Pomodoro timer for deep work sessions</div>
                </div>
                <Switch on={S.pomodoroEnabled} onToggle={()=>setSetting("pomodoroEnabled",!S.pomodoroEnabled)}/>
              </div>
            </div>

            <div style={{...C.label,marginTop:18}}>DISPLAY</div>
            <div style={C.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:13,color:"#d1d5db"}}>Show XP numbers</div>
                  <div style={{fontSize:10,color:"#3a3a5a",marginTop:2}}>Off = clean difficulty labels instead of decimals</div>
                </div>
                <Switch on={S.showXP} onToggle={()=>setSetting("showXP",!S.showXP)}/>
              </div>
              <div>
                <div style={{fontSize:13,color:"#d1d5db",marginBottom:8}}>Stat display style</div>
                <div style={{display:"flex",gap:8}}>
                  {[{v:"radar",label:"◆ RADAR CHART"},{v:"bars",label:"▬ STAT BARS"}].map(opt=>(
                    <button key={opt.v} onClick={()=>setSetting("statStyle",opt.v)}
                      style={{flex:1,padding:"11px",borderRadius:10,cursor:"pointer",fontSize:10,fontFamily:"Cinzel,serif",letterSpacing:1,
                        background:S.statStyle===opt.v?"#1a1200":"#0d0d1f",
                        color:S.statStyle===opt.v?"#f59e0b":"#5a5a7a",
                        border:`1px solid ${S.statStyle===opt.v?"#f59e0b66":"#1e2040"}`}}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{...C.label,marginTop:18}}>YOUR CHARACTER</div>
            <div style={C.card}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
                <PixelCharacter level={level.lvl} character={cz} scale={8}/>
              </div>
              {[
                {key:"skin",  label:"SKIN TONE",  colors:SKINS},
                {key:"hair",  label:"HAIR COLOR", colors:HAIRS},
                {key:"shirt", label:"SHIRT COLOR",colors:SHIRTS},
                {key:"pants", label:"PANTS COLOR",colors:PANTS},
              ].map(row=>(
                <div key={row.key} style={{marginBottom:12}}>
                  <div style={{fontSize:9,letterSpacing:3,color:"#5a5a7a",fontFamily:"Cinzel,serif",marginBottom:6}}>{row.label}</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {row.colors.map(col=>(
                      <button key={col} onClick={()=>setChar(row.key,col)}
                        style={{width:30,height:30,borderRadius:"50%",background:col,cursor:"pointer",
                          border:`3px solid ${cz[row.key]===col?"#f59e0b":"#1e2040"}`,
                          boxShadow:cz[row.key]===col?"0 0 10px #f59e0b66":"none"}}/>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{...C.label,marginTop:18}}>WARDROBE</div>
            <div style={{fontSize:9,color:"#3a3a5a",fontFamily:"Cinzel,serif",letterSpacing:1,marginBottom:10}}>CHOOSE WHICH UNLOCKED GEAR TO WEAR</div>
            <div style={C.card}>
              {GEAR.map((g,gi)=>{
                const unlocked = level.lvl >= g.lvl;
                const worn = (cz.equipped||{})[g.slot] !== false;
                return (
                  <div key={g.slot} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                    paddingBottom:gi<GEAR.length-1?12:0,marginBottom:gi<GEAR.length-1?12:0,
                    borderBottom:gi<GEAR.length-1?"1px solid #12122a":"none",opacity:unlocked?1:0.45}}>
                    <div>
                      <div style={{fontSize:12.5,color:unlocked?"#d1d5db":"#4a4a68"}}>{g.name}</div>
                      <div style={{fontSize:9,color:unlocked?"#34d399":"#3a3a5a",marginTop:2,fontFamily:"Cinzel,serif",letterSpacing:1}}>
                        {unlocked ? "UNLOCKED" : `UNLOCKS AT LV ${g.lvl}`}
                      </div>
                    </div>
                    {unlocked
                      ? <Switch on={worn} onToggle={()=>toggleGear(g.slot)}/>
                      : <span style={{fontSize:14,color:"#2a2a4a"}}>🔒</span>}
                  </div>
                );
              })}
            </div>

            <div style={{...C.label,marginTop:18}}>DANGER ZONE</div>
            <div style={{...C.card,border:"1px solid #ef444433"}}>
              <div style={{fontSize:11,color:"#8a8aa8",marginBottom:10,lineHeight:1.5}}>
                Resets your character's stats back to the start. Your quests, categories, history, titles, and customization are all kept.
              </div>
              <button style={{background:"transparent",color:"#ef4444",border:"1px solid #ef444455",borderRadius:10,padding:"11px",fontSize:11,cursor:"pointer",fontFamily:"Cinzel,serif",letterSpacing:2,width:"100%"}}
                onClick={()=>setConfirmBox({type:"reset"})}>
                ⚠ RESET STATS
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ BOTTOM NAV ══ */}
      <div style={C.nav}>
        {navItems.map(item=>(
          <button key={item.v} style={C.navBtn(isActive(item.v))} onClick={()=>setView(item.v)}>
            <span style={{fontSize:17}}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
