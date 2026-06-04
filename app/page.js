"use client";

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "life-rpg-v7-justin";
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── ECONOMY ───────────────────────────────────────────────────────────────────
// Importance (1-10) drives both reward and risk:
//   Points per completion = importance × 0.012
//   Decay per missed day  = importance × 0.015  (25% steeper than gain)
// Each task has targetReps (default 1). Completing target = full points.
// Reps beyond target give a bonus: each extra rep = 25% of base points, capped at 2× base total bonus.
// So if target=3 and you do 5, you get base + (2 × 0.25 × base) = 1.5× base.

const GAIN_MULT  = 0.012;
const DECAY_MULT = 0.015;
const BONUS_PER_EXTRA = 0.25;
const MAX_BONUS_MULT  = 2.0;
const calcPoints = (imp) => +(imp * GAIN_MULT).toFixed(4);
const calcDecay  = (imp) => +(imp * DECAY_MULT).toFixed(4);

// Compute actual points earned given reps done vs target.
// reps < target: prorated (reps/target × base, but doesn't fully complete)
// reps >= target: base + bonus for each extra
function calcEarnedPoints(basePoints, targetReps, reps) {
  if (reps <= 0) return 0;
  if (reps < targetReps) return basePoints * (reps / targetReps);
  const extra = reps - targetReps;
  const bonusMult = Math.min(MAX_BONUS_MULT, extra * BONUS_PER_EXTRA);
  return basePoints * (1 + bonusMult);
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

// All tasks defined by importance only. Points & decay computed automatically.
const mkTask = (id, name, catId, importance, days, targetReps=1) => ({
  id, name, catId, importance, targetReps,
  points: calcPoints(importance),
  decayRate: calcDecay(importance),
  days, completions:{}  // { "YYYY-MM-DD": repCount }
});

const INIT_TASKS = [
  mkTask("t1",  "Apply to jobs",           "career",   9,  [1,2,3,4,5]),
  mkTask("t16", "To-do list task",         "career",   5,  [1,2,3,4,5]),
  mkTask("t2",  "Study cloud engineering", "mind",     7,  [1,2,3,4,5,6]),
  mkTask("t3",  "Gym",                     "body",     10, [1,2,3,4,5,6,0]),
  mkTask("t4",  "Run",                     "body",     3,  [1,3,5]),
  mkTask("t5",  "Ab workout",              "body",     3,  [1,2,3,4,5,6,0]),
  mkTask("t6",  "Cardio",                  "body",     2,  [2,4,6]),
  mkTask("t7",  "Take vitamins",           "body",     5,  [1,2,3,4,5,6,0]),
  mkTask("t8",  "Read Bible",              "faith",    10, [1,2,3,4,5,6,0]),
  mkTask("t9",  "Pray",                    "faith",    5,  [1,2,3,4,5,6,0]),
  mkTask("t10", "Brush teeth",             "grooming", 4,  [1,2,3,4,5,6,0]),
  mkTask("t11", "Apply acne med (face)",   "grooming", 7,  [1,2,3,4,5,6,0]),
  mkTask("t12", "Apply acne med (body)",   "grooming", 6,  [1,2,3,4,5,6,0]),
  mkTask("t13", "Moisturize",              "grooming", 3,  [1,2,3,4,5,6,0]),
  mkTask("t14", "Clean",                   "home",     6,  [1,2,3,4,5,6,0]),
  mkTask("t15", "Iron clothes",            "home",     2,  [1,3,5]),
  mkTask("t17", "Do something for GF",     "love",     6,  [1,2,3,4,5,6,0]),
  mkTask("t18", "Write a note",            "love",     2,  [1,2,3,4,5,6,0]),
];

const INIT = { categories: INIT_CATEGORIES, tasks: INIT_TASKS, lastDecayCheck: null };

// ── DATE HELPERS ──────────────────────────────────────────────────────────────
function dateKey(date) {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function getReps(task, dateStr) {
  const v = task.completions && task.completions[dateStr];
  // Backward compat: if value was `true`, treat as 1 rep
  if (v === true) return 1;
  return Number(v) || 0;
}
function isCompletedOn(task, dateStr) {
  const reps = getReps(task, dateStr);
  return reps >= (task.targetReps || 1);
}
function getDayOfWeek(dateStr) { const [y,m,d]=dateStr.split("-").map(Number); return new Date(y,m-1,d).getDay(); }
function isScheduledOn(task, dateStr) { return task.days.includes(getDayOfWeek(dateStr)); }
function getPastDays(n) {
  const days = [];
  for (let i = 0; i < n; i++) { const d=new Date(); d.setDate(d.getDate()-i); days.push(dateKey(d)); }
  return days;
}

// ── RATING ────────────────────────────────────────────────────────────────────
function getRating(cats) {
  if (!cats.length) return 0;
  return Math.max(0, Math.min(100, Math.round(cats.reduce((s,c)=>s+(c.value/c.maxValue)*100,0)/cats.length)));
}
function getTier(r) {
  if (r >= 90) return { label:"LEGENDARY", color:"#f59e0b" };
  if (r >= 75) return { label:"ELITE",     color:"#a78bfa" };
  if (r >= 60) return { label:"SKILLED",   color:"#38bdf8" };
  if (r >= 40) return { label:"AVERAGE",   color:"#34d399" };
  return               { label:"NOVICE",   color:"#9ca3af" };
}
function projectRating(categories, tasks, dateStr, scenario) {
  const cats = categories.map(c=>({...c}));
  tasks.forEach(task=>{
    if (!isScheduledOn(task,dateStr)) return;
    const target = task.targetReps || 1;
    const reps = getReps(task, dateStr);
    const done = reps >= target;
    const ci = cats.findIndex(c=>c.id===task.catId);
    if (ci===-1) return;
    if (scenario==="full" && !done) {
      // What remaining points could be earned if completed to target (no bonus assumed)
      const earnedSoFar = calcEarnedPoints(task.points, target, reps);
      const earnedAtTarget = calcEarnedPoints(task.points, target, target);
      const remaining = earnedAtTarget - earnedSoFar;
      cats[ci].value = Math.min(cats[ci].maxValue, cats[ci].value + remaining);
    }
    if (scenario==="decay" && !done) {
      cats[ci].value = Math.max(0, cats[ci].value - task.decayRate);
    }
  });
  return Math.max(0, Math.min(100, Math.round(cats.reduce((s,c)=>s+(c.value/c.maxValue)*100,0)/cats.length)));
}

// ── CHARACTER / LEVEL ────────────────────────────────────────────────────────
// Level = floor(rating / 7), so every 7 points = 1 level up
// 14 levels total (0-13). Each unlocks new gear.
const LEVELS = [
  { lvl:0,  name:"Peasant",       unlock:"Starting out" },
  { lvl:1,  name:"Vagabond",      unlock:"Cloth tunic" },
  { lvl:2,  name:"Squire",        unlock:"Leather boots" },
  { lvl:3,  name:"Apprentice",    unlock:"Wooden sword" },
  { lvl:4,  name:"Footman",       unlock:"Iron sword" },
  { lvl:5,  name:"Warrior",       unlock:"Leather armor" },
  { lvl:6,  name:"Knight",        unlock:"Iron shield" },
  { lvl:7,  name:"Templar",       unlock:"Steel armor" },
  { lvl:8,  name:"Champion",      unlock:"Crested helm" },
  { lvl:9,  name:"Crusader",      unlock:"Golden trim" },
  { lvl:10, name:"Hero",          unlock:"Enchanted blade" },
  { lvl:11, name:"Paladin",       unlock:"Holy aura" },
  { lvl:12, name:"Warlord",       unlock:"Crown of valor" },
  { lvl:13, name:"Mythic",        unlock:"Wings of legend" },
  { lvl:14, name:"Ascended",      unlock:"Divine ascension" },
];

function getLevel(rating) {
  const lvl = Math.min(14, Math.floor(rating / 7));
  return { ...LEVELS[lvl], lvl, ratingForNext: (lvl+1)*7, ratingFloor: lvl*7 };
}

// ── PIXEL CHARACTER ──────────────────────────────────────────────────────────
// Pure SVG pixel art. Components layer on by level.
function PixelCharacter({ level }) {
  // We'll use a 24x32 grid scaled up. Each "pixel" = 6px.
  const PX = 7;
  const W = 24, H = 32;
  const sw = W*PX, sh = H*PX;

  // Helper to draw a rect at grid (x,y)
  const px = (x,y,fill) => <rect key={`${x}-${y}-${fill}`} x={x*PX} y={y*PX} width={PX} height={PX} fill={fill}/>;
  // Multi-pixel row
  const row = (y, xs, fill) => xs.map(x=>px(x,y,fill));

  const has = (n) => level >= n;
  const elements = [];

  // Aura (lvl 11+) - holy glow behind character
  if (has(11)) {
    elements.push(
      <circle key="aura" cx={sw/2} cy={sh/2-10} r={sw/2-10} fill="url(#auraGrad)" opacity="0.5"/>
    );
  }

  // Wings (lvl 13+) — behind body
  if (has(13)) {
    // Left wing
    [[2,9],[3,9],[1,10],[2,10],[3,10],[0,11],[1,11],[2,11],[3,11],[1,12],[2,12],[3,12],[2,13],[3,13]].forEach(([x,y])=>elements.push(px(x,y,"#fef3c7")));
    [[2,9],[3,9],[3,10],[3,11],[3,12],[3,13]].forEach(([x,y])=>elements.push(px(x,y,"#fde68a")));
    // Right wing
    [[20,9],[21,9],[20,10],[21,10],[22,10],[20,11],[21,11],[22,11],[23,11],[20,12],[21,12],[22,12],[20,13],[21,13]].forEach(([x,y])=>elements.push(px(x,y,"#fef3c7")));
    [[20,9],[21,9],[20,10],[20,11],[20,12],[20,13]].forEach(([x,y])=>elements.push(px(x,y,"#fde68a")));
  }

  // ─ HEAD (always) ─
  // Skin (brown)
  [[10,6],[11,6],[12,6],[13,6],
   [9,7],[10,7],[11,7],[12,7],[13,7],[14,7],
   [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
   [9,9],[10,9],[11,9],[12,9],[13,9],[14,9]].forEach(([x,y])=>elements.push(px(x,y,"#7c4a1e")));
  // Hair (black, textured)
  [[10,5],[11,5],[12,5],[13,5],
   [9,6],[14,6]].forEach(([x,y])=>elements.push(px(x,y,"#1a0e08")));
  // Eyes
  elements.push(px(10,8,"#1a0e08"));
  elements.push(px(13,8,"#1a0e08"));

  // Crown (lvl 12+)
  if (has(12)) {
    [[9,4],[11,4],[13,4],[14,4],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5]].forEach(([x,y])=>elements.push(px(x,y,"#fbbf24")));
    elements.push(px(10,3,"#fde047"));
    elements.push(px(12,3,"#fde047"));
    elements.push(px(14,3,"#fde047"));
    // gems
    elements.push(px(11,5,"#ef4444"));
    elements.push(px(13,5,"#3b82f6"));
  }

  // Crested helm (lvl 8+, replaces hair partly)
  if (has(8) && !has(12)) {
    // helm body
    [[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],
     [9,6],[14,6],
     [9,7],[14,7]].forEach(([x,y])=>elements.push(px(x,y,"#9ca3af")));
    // crest
    [[11,3],[12,3],[11,4],[12,4]].forEach(([x,y])=>elements.push(px(x,y,"#ef4444")));
    elements.push(px(11,2,"#dc2626"));
    elements.push(px(12,2,"#dc2626"));
  }

  // ─ BODY (always) ─
  if (!has(1)) {
    // bare skin / rags
    [[10,10],[11,10],[12,10],[13,10],
     [10,11],[11,11],[12,11],[13,11],
     [10,12],[11,12],[12,12],[13,12],
     [10,13],[11,13],[12,13],[13,13]].forEach(([x,y])=>elements.push(px(x,y,"#a78670")));
  } else if (has(1) && !has(5)) {
    // Cloth tunic (brown/tan)
    [[10,10],[11,10],[12,10],[13,10],
     [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],
     [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],
     [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],
     [10,14],[11,14],[12,14],[13,14]].forEach(([x,y])=>elements.push(px(x,y,"#a16207")));
    // belt
    [[10,14],[11,14],[12,14],[13,14]].forEach(([x,y])=>elements.push(px(x,y,"#451a03")));
  }

  // Leather armor (lvl 5+, replaces tunic)
  if (has(5) && !has(7)) {
    [[10,10],[11,10],[12,10],[13,10],
     [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],
     [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],
     [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],
     [10,14],[11,14],[12,14],[13,14]].forEach(([x,y])=>elements.push(px(x,y,"#7c2d12")));
    // straps
    [[10,12],[13,12]].forEach(([x,y])=>elements.push(px(x,y,"#451a03")));
    [[11,11],[12,11]].forEach(([x,y])=>elements.push(px(x,y,"#92400e")));
  }

  // Steel armor (lvl 7+)
  if (has(7)) {
    [[10,10],[11,10],[12,10],[13,10],
     [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],
     [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],
     [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],
     [10,14],[11,14],[12,14],[13,14]].forEach(([x,y])=>elements.push(px(x,y,"#94a3b8")));
    // highlights
    [[10,10],[11,10]].forEach(([x,y])=>elements.push(px(x,y,"#cbd5e1")));
    [[10,11],[10,12]].forEach(([x,y])=>elements.push(px(x,y,"#cbd5e1")));
    // chest emblem
    elements.push(px(11,12,"#1e293b"));
    elements.push(px(12,12,"#1e293b"));
  }

  // Golden trim (lvl 9+)
  if (has(9)) {
    [[9,11],[14,11],[9,13],[14,13]].forEach(([x,y])=>elements.push(px(x,y,"#fbbf24")));
    elements.push(px(11,10,"#fbbf24"));
    elements.push(px(12,10,"#fbbf24"));
  }

  // Arms
  if (has(7)) {
    // armored arms
    [[8,11],[8,12],[8,13],[15,11],[15,12],[15,13]].forEach(([x,y])=>elements.push(px(x,y,"#94a3b8")));
  } else if (has(5)) {
    [[8,11],[8,12],[8,13],[15,11],[15,12],[15,13]].forEach(([x,y])=>elements.push(px(x,y,"#7c2d12")));
  } else if (has(1)) {
    [[8,11],[8,12],[8,13],[15,11],[15,12],[15,13]].forEach(([x,y])=>elements.push(px(x,y,"#a16207")));
  } else {
    [[8,11],[8,12],[8,13],[15,11],[15,12],[15,13]].forEach(([x,y])=>elements.push(px(x,y,"#7c4a1e")));
  }
  // Hands
  [[8,14],[15,14]].forEach(([x,y])=>elements.push(px(x,y,"#7c4a1e")));

  // ─ LEGS (pants) ─
  [[10,15],[11,15],[12,15],[13,15],
   [10,16],[11,16],[12,16],[13,16],
   [10,17],[11,17],[12,17],[13,17],
   [10,18],[11,18],[12,18],[13,18]].forEach(([x,y])=>elements.push(px(x,y,"#1f2937")));

  // ─ FEET / BOOTS ─
  if (has(2)) {
    // Leather boots
    [[9,19],[10,19],[11,19],[12,19],[13,19],[14,19],
     [9,20],[10,20],[13,20],[14,20]].forEach(([x,y])=>elements.push(px(x,y,"#451a03")));
  } else {
    // Bare feet
    [[10,19],[11,19],[12,19],[13,19]].forEach(([x,y])=>elements.push(px(x,y,"#7c4a1e")));
  }

  // ─ SWORD (right hand) ─
  if (has(10)) {
    // Enchanted blade (blue glow)
    [[16,8],[16,9],[16,10],[16,11],[16,12],[16,13]].forEach(([x,y])=>elements.push(px(x,y,"#bfdbfe")));
    [[16,8]].forEach(([x,y])=>elements.push(px(x,y,"#dbeafe")));
    [[15,13],[16,13],[17,13]].forEach(([x,y])=>elements.push(px(x,y,"#a78bfa")));
    elements.push(px(16,14,"#5b21b6"));
    // glow
    [[15,9],[17,9],[15,10],[17,10],[15,11],[17,11]].forEach(([x,y])=>elements.push(px(x,y,"#60a5fa")));
  } else if (has(4)) {
    // Iron sword
    [[16,9],[16,10],[16,11],[16,12]].forEach(([x,y])=>elements.push(px(x,y,"#cbd5e1")));
    elements.push(px(16,8,"#e2e8f0"));
    [[15,13],[16,13],[17,13]].forEach(([x,y])=>elements.push(px(x,y,"#64748b")));
    elements.push(px(16,14,"#451a03"));
  } else if (has(3)) {
    // Wooden sword
    [[16,9],[16,10],[16,11],[16,12]].forEach(([x,y])=>elements.push(px(x,y,"#a16207")));
    elements.push(px(16,8,"#d97706"));
    [[15,13],[16,13],[17,13]].forEach(([x,y])=>elements.push(px(x,y,"#451a03")));
    elements.push(px(16,14,"#1f2937"));
  }

  // ─ SHIELD (left hand) ─
  if (has(6)) {
    [[6,10],[7,10],[5,11],[6,11],[7,11],[5,12],[6,12],[7,12],[5,13],[6,13],[7,13],[6,14],[7,14]].forEach(([x,y])=>elements.push(px(x,y,"#78716c")));
    // emblem
    elements.push(px(6,11,"#fbbf24"));
    elements.push(px(6,12,"#fbbf24"));
  }

  return (
    <svg width={sw} height={sh} viewBox={`0 0 ${sw} ${sh}`} style={{imageRendering:"pixelated",shapeRendering:"crispEdges"}}>
      <defs>
        <radialGradient id="auraGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {elements}
    </svg>
  );
}

// ── RADAR ──────────────────────────────────────────────────────────────────────
function RadarChart({ categories, ghostCategories }) {
  const sz=230, cx=115, cy=115, R=82;
  if (categories.length<3) return <div style={{color:"#4b5563",textAlign:"center",padding:"40px 0",fontSize:13}}>Add 3+ categories</div>;
  const n=categories.length;
  const ang=i=>(Math.PI*2*i/n)-Math.PI/2;
  const pt=(a,r)=>({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});
  const levels=[.2,.4,.6,.8,1];
  const polyPath=(cats)=>{
    const pts=cats.map((c,i)=>{const ratio=Math.max(0,Math.min(1,c.value/c.maxValue));return pt(ang(i),R*ratio);});
    return pts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ")+"Z";
  };
  return (
    <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{overflow:"visible"}}>
      <defs>
        <filter id="rglow"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="polyFill"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15"/><stop offset="100%" stopColor="#ef4444" stopOpacity="0.03"/></radialGradient>
        <radialGradient id="ghostFill"><stop offset="0%" stopColor="#34d399" stopOpacity="0.07"/><stop offset="100%" stopColor="#34d399" stopOpacity="0.01"/></radialGradient>
      </defs>
      {levels.map((lv,li)=>{
        const pts=Array.from({length:n},(_,i)=>pt(ang(i),R*lv));
        const d=pts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ")+"Z";
        return <path key={li} d={d} fill="none" stroke={li===4?"#2a2a4a":"#151525"} strokeWidth={li===4?1.2:0.6}/>;
      })}
      {Array.from({length:n},(_,i)=>{const o=pt(ang(i),R);return <line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke="#151525" strokeWidth="1"/>;})}
      {ghostCategories && ghostCategories.length>=3 && <path d={polyPath(ghostCategories)} fill="url(#ghostFill)" stroke="#34d399" strokeWidth="1.4" strokeDasharray="4,3" opacity="0.65"/>}
      <path d={polyPath(categories)} fill="url(#polyFill)" stroke="#f59e0b" strokeWidth="2" filter="url(#rglow)" strokeLinejoin="round"/>
      {categories.map((c,i)=>{
        const ratio=Math.max(0,Math.min(1,c.value/c.maxValue));
        const dot=pt(ang(i),R*ratio);
        const lab=pt(ang(i),R+22);
        return (<g key={c.id}>
          <circle cx={dot.x} cy={dot.y} r="4.5" fill={c.color}/>
          <text x={lab.x} y={lab.y-7} textAnchor="middle" fontSize="12" fill={c.color}>{c.icon}</text>
          <text x={lab.x} y={lab.y+6} textAnchor="middle" fontSize="7.5" fill="#6b7280" fontFamily="'Cinzel',serif" letterSpacing="0.5">{c.name.slice(0,7).toUpperCase()}</text>
        </g>);
      })}
    </svg>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(null);
  const [view, setView] = useState("dashboard");
  const [editTask, setEditTask] = useState(null);
  const [toast, setToast] = useState(null);
  const [retroMode, setRetroMode] = useState(false);
  const [retroDate, setRetroDate] = useState(null);
  const [currentDay, setCurrentDay] = useState(dateKey());
  const [showLevelUp, setShowLevelUp] = useState(null);
  const [editingCat, setEditingCat] = useState(null); // id of category being edited
  const [confirmDelete, setConfirmDelete] = useState(null); // { type:"cat"|"task", id, name }
  const [newTask, setNewTask] = useState({name:"",catId:"career",importance:5,targetReps:1,days:[1,2,3,4,5]});
  const [newCat, setNewCat] = useState({name:"",icon:"⭐",color:"#f59e0b",maxValue:10});
  const midnightRef = useRef(null);
  const prevLevelRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/storage");
const json = await res.json();
if (json.data && json.data.categories && json.data.tasks) {
  setData(json.data);
} else {
  setData(INIT);
}
      }
      catch { setData(INIT); }
    })();
  }, []);

  // Watch for level ups
  useEffect(() => {
    if (!data) return;
    const r = getRating(data.categories);
    const lvl = getLevel(r).lvl;
    if (prevLevelRef.current === null) { prevLevelRef.current = lvl; return; }
    if (lvl > prevLevelRef.current) {
      setShowLevelUp(LEVELS[lvl]);
      setTimeout(() => setShowLevelUp(null), 4500);
    }
    prevLevelRef.current = lvl;
  }, [data?.categories]);

  // Midnight reset
  useEffect(() => {
    const schedule = () => {
      const now=new Date(); const mid=new Date(now); mid.setHours(24,0,0,0);
      midnightRef.current=setTimeout(()=>{setCurrentDay(dateKey());schedule();}, mid-now);
    };
    schedule();
    return () => clearTimeout(midnightRef.current);
  }, []);

  // Decay
  useEffect(() => {
  if (!data) return;
  if (!data.categories || !data.tasks) return;
  const run = () => {
    try {
      const now = Date.now();
      const last = data.lastDecayCheck
        ? new Date(data.lastDecayCheck).getTime()
        : now - 3700000;
      if (now - last < 3600000) return;
      const today = dateKey();
      let cats = data.categories.map(c => ({ ...c }));
      let changed = false;
      data.tasks.forEach(task => {
        try {
          const keys = Object.keys(task.completions || {}).sort().reverse();
          if (!keys.length) return;
          const lastD = new Date(keys[0] + "T00:00:00");
          const nowD = new Date(today + "T00:00:00");
          let missed = 0;
          let cursor = new Date(lastD);
          cursor.setDate(cursor.getDate() + 1);
          while (cursor < nowD) {
            const dk = dateKey(cursor);
            if (isScheduledOn(task, dk) && !isCompletedOn(task, dk)) missed++;
            cursor.setDate(cursor.getDate() + 1);
          }
          if (missed > 0) {
            const ci = cats.findIndex(c => c.id === task.catId);
            if (ci !== -1) {
              cats[ci].value = Math.max(0, cats[ci].value - task.decayRate * missed);
              changed = true;
            }
          }
        } catch (taskErr) {
          console.error("Decay error on task", task.id, taskErr);
        }
      });
      const next = { ...data, categories: cats, lastDecayCheck: new Date().toISOString() };
      if (changed) { setData(next); persist(next); }
      else persist({ ...data, lastDecayCheck: new Date().toISOString() });
    } catch (err) {
      console.error("Decay engine error:", err);
    }
  };
  run();
  const it = setInterval(run, 3600000);
  return () => clearInterval(it);
}, [data?.lastDecayCheck]);

  const persist = async (d) => {
    try {
      await fetch("/api/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
    } catch {}
  };
  const update=(d)=>{setData(d);persist(d);};
  const toast$=(msg,color="#f59e0b")=>{setToast({msg,color});setTimeout(()=>setToast(null),2200);};

  const today = retroMode && retroDate ? retroDate : currentDay;

  // Add a rep to a task. Adds the incremental points (delta) to the category.
  const completeTask=(tid,forDate)=>{
    const d=forDate||today;
    const task=data.tasks.find(t=>t.id===tid); if (!task) return;
    const target = task.targetReps || 1;
    const prevReps = getReps(task, d);
    const newReps = prevReps + 1;
    const prevEarned = calcEarnedPoints(task.points, target, prevReps);
    const newEarned  = calcEarnedPoints(task.points, target, newReps);
    const delta = newEarned - prevEarned;

    const cats = data.categories.map(c => c.id !== task.catId
      ? c
      : {...c, value: Math.min(c.maxValue, c.value + delta)});
    const tasks = data.tasks.map(t => {
      if (t.id !== tid) return t;
      const comps = {...(t.completions || {})};
      comps[d] = newReps;
      return {...t, completions: comps};
    });
    update({...data, categories:cats, tasks});

    const cat = data.categories.find(c=>c.id===task.catId);
    const justCompleted = prevReps < target && newReps >= target;
    const isBonus = newReps > target;
    if (justCompleted) toast$(`✓ ${task.name} done! +${delta.toFixed(3)}`, cat?.color || "#34d399");
    else if (isBonus) toast$(`BONUS +${delta.toFixed(3)} ${cat?.icon}`, "#f59e0b");
    else toast$(`${newReps}/${target} · +${delta.toFixed(3)} ${cat?.icon}`, cat?.color || "#f59e0b");
  };

  // Undo: clear all reps for a task on a day
  const undoTask=(tid,forDate)=>{
    const d=forDate||today;
    const task=data.tasks.find(t=>t.id===tid); if (!task) return;
    const target = task.targetReps || 1;
    const prevReps = getReps(task, d);
    if (prevReps === 0) return;
    const prevEarned = calcEarnedPoints(task.points, target, prevReps);

    const cats = data.categories.map(c => c.id !== task.catId
      ? c
      : {...c, value: Math.max(0, c.value - prevEarned)});
    const tasks = data.tasks.map(t => {
      if (t.id !== tid) return t;
      const comps = {...(t.completions || {})};
      delete comps[d];
      return {...t, completions: comps};
    });
    update({...data, categories:cats, tasks});
    toast$(`undone`, "#ef4444");
  };

  const saveEditTask=()=>{
    if (!editTask) return;
    const updated = {
      ...editTask,
      points: calcPoints(editTask.importance ?? 5),
      decayRate: calcDecay(editTask.importance ?? 5),
    };
    const tasks=data.tasks.map(t=>t.id===editTask.id?updated:t);
    update({...data,tasks}); setEditTask(null); setView("tasks");
    toast$("Task updated ✓");
  };
  const deleteTask=(id)=>update({...data,tasks:data.tasks.filter(t=>t.id!==id)});
  const addTask=()=>{
    if (!newTask.name.trim()) return;
    const task = {
      ...newTask,
      id:`t${Date.now()}`,
      points: calcPoints(newTask.importance),
      decayRate: calcDecay(newTask.importance),
      completions:{}
    };
    update({...data,tasks:[...data.tasks, task]});
    setNewTask({name:"",catId:"career",importance:5,targetReps:1,days:[1,2,3,4,5]});
    setView("tasks"); toast$("Task created!");
  };
  const addCat=()=>{
    if (!newCat.name.trim()) return;
    update({...data,categories:[...data.categories,{...newCat,id:`c${Date.now()}`,value:3.0,maxValue:parseInt(newCat.maxValue)}]});
    setNewCat({name:"",icon:"⭐",color:"#f59e0b",maxValue:10});
    setView("stats"); toast$("Category added!");
  };
  // Delete a category but orphan its tasks (set catId to null so they can be reassigned)
  const deleteCat=(id)=>{
    update({
      ...data,
      categories: data.categories.filter(c=>c.id!==id),
      tasks: data.tasks.map(t => t.catId===id ? {...t, catId:null} : t),
    });
    toast$("Category deleted — tasks need reassignment", "#fb923c");
  };

  // Save edits to a category (name, icon, color)
  const saveEditCat = (id, updates) => {
    update({
      ...data,
      categories: data.categories.map(c => c.id===id ? {...c, ...updates} : c),
    });
  };
  const resetAll=()=>{ if (confirm("Reset to starting state? All progress will be lost.")) { update(INIT); toast$("Reset complete"); } };

  if (!data) return (
    <div style={{background:"#060610",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#f59e0b",fontFamily:"'Cinzel',serif",fontSize:18,letterSpacing:4}}>LOADING...</div>
  );

  const todayTasks=data.tasks.filter(t=>isScheduledOn(t,today) && t.catId && data.categories.find(c=>c.id===t.catId));
  const todayDone=todayTasks.filter(t=>isCompletedOn(t,today)).length;
  const rating=getRating(data.categories);
  const tier=getTier(rating);
  const level=getLevel(rating);
  const lvlProgress=((rating-level.ratingFloor)/7)*100;

  const ghostCategories=data.categories.map(c=>{
    let val=c.value;
    data.tasks.forEach(t=>{
      if (!isScheduledOn(t,today)) return;
      if (t.catId !== c.id) return;
      const target = t.targetReps || 1;
      const reps = getReps(t, today);
      if (reps >= target) return;
      const earnedSoFar = calcEarnedPoints(t.points, target, reps);
      const earnedAtTarget = calcEarnedPoints(t.points, target, target);
      val = Math.min(c.maxValue, val + (earnedAtTarget - earnedSoFar));
    });
    return {...c,value:val};
  });
  const ratingIfAllDone=projectRating(data.categories,data.tasks,today,"full");
  const ratingIfNoneDone=projectRating(data.categories,data.tasks,today,"decay");

  const pastDays=getPastDays(8).slice(1);

  const C = {
    app:{background:"#060610",minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:"'Georgia',serif",color:"#e5e7eb",paddingBottom:90,position:"relative"},
    header:{padding:"14px 20px 10px",borderBottom:"1px solid #12122a",background:"linear-gradient(180deg,#0d0d1f 0%,transparent 100%)",position:"sticky",top:0,zIndex:5,backdropFilter:"blur(10px)"},
    card:{background:"linear-gradient(135deg,#0f1020 0%,#0a0a18 100%)",border:"1px solid #1e2040",borderRadius:16,padding:"15px 17px",marginBottom:10},
    glowCard:{background:"linear-gradient(135deg,#0f1020 0%,#0a0a18 100%)",border:"1px solid #2a1a00",borderRadius:16,padding:"18px 18px",marginBottom:12,boxShadow:"0 0 40px #f59e0b08"},
    label:{fontSize:9,letterSpacing:4,color:"#3a3a5a",marginBottom:8,fontFamily:"'Cinzel',serif"},
    input:{background:"#0d0d1f",border:"1px solid #1e2040",borderRadius:10,padding:"11px 14px",color:"#e5e7eb",fontSize:13,width:"100%",boxSizing:"border-box",fontFamily:"Georgia,serif",outline:"none"},
    select:{background:"#0d0d1f",border:"1px solid #1e2040",borderRadius:10,padding:"11px 14px",color:"#e5e7eb",fontSize:13,width:"100%",boxSizing:"border-box",fontFamily:"Georgia,serif",outline:"none"},
    btn:{background:"linear-gradient(135deg,#d97706,#f59e0b)",color:"#000",border:"none",borderRadius:10,padding:"10px 18px",fontSize:12,cursor:"pointer",fontFamily:"'Cinzel',serif",letterSpacing:2,fontWeight:"bold",boxShadow:"0 0 18px #f59e0b33"},
    btnSm:{background:"#0d0d1f",color:"#6b7280",border:"1px solid #1e2040",borderRadius:8,padding:"6px 13px",fontSize:10,cursor:"pointer",fontFamily:"Cinzel,serif",letterSpacing:1},
    btnDanger:{background:"transparent",color:"#4b5563",border:"none",fontSize:14,cursor:"pointer",padding:"4px 8px"},
    nav:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"#060610",borderTop:"1px solid #12122a",display:"flex",justifyContent:"space-around",padding:"10px 0 18px",zIndex:10},
    navBtn:a=>({background:"none",border:"none",color:a?"#f59e0b":"#2a2a4a",fontSize:8,letterSpacing:3,cursor:"pointer",fontFamily:"Cinzel,serif",display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"2px 14px"}),
    dayBtn:on=>({width:35,height:35,borderRadius:"50%",border:`2px solid ${on?"#f59e0b":"#1e2040"}`,background:on?"#1a1200":"transparent",color:on?"#f59e0b":"#3a3a5a",fontSize:9,cursor:"pointer",fontFamily:"Cinzel,serif",display:"flex",alignItems:"center",justifyContent:"center"}),
    statBar:{height:4,borderRadius:2,background:"#0d0d1f",overflow:"hidden",marginTop:6,border:"1px solid #12122a"},
    statFill:(color,pct)=>({height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${color}77,${color})`,borderRadius:2,boxShadow:`0 0 6px ${color}55`,transition:"width .6s ease"}),
  };
  const isActive=(v)=>view===v||(view==="addTask"&&v==="tasks")||(view==="addCat"&&v==="stats")||(view==="editTask"&&v==="tasks");

  const TaskRow=({task,forDate})=>{
    const d = forDate || today;
    const cat = data.categories.find(c=>c.id===task.catId);
    const target = task.targetReps || 1;
    const reps = getReps(task, d);
    const done = reps >= target;
    const isBonus = reps > target;
    const pct = Math.min(100, (reps/target)*100);
    return (
      <div style={{display:"flex",alignItems:"center",gap:11,background:done?"#0a0a14":"#0d0d1e",border:`1px solid ${done?cat?.color+"55":"#181830"}`,borderRadius:12,padding:"11px 13px",marginBottom:7,opacity:done && !isBonus ? 0.55 : 1, transition:"all .25s"}}>
        {/* Tap to increment - main action */}
        <div onClick={()=>completeTask(task.id, d)} style={{flex:1, display:"flex", alignItems:"center", gap:11, cursor:"pointer"}}>
          <div style={{width:34,height:34,borderRadius:"50%",border:`2px solid ${done?cat?.color:"#2a2a4a"}`,background:done?cat?.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:done?`0 0 10px ${cat?.color}77`:"none",position:"relative"}}>
            {target === 1
              ? (done ? <span style={{color:"#000",fontSize:14,fontWeight:"bold"}}>✓</span> : null)
              : <span style={{color:done?"#000":"#6b7280",fontSize:11,fontWeight:"bold",fontFamily:"Cinzel,serif"}}>{reps}/{target}</span>
            }
            {isBonus && <div style={{position:"absolute",top:-4,right:-4,background:"#f59e0b",color:"#000",fontSize:8,fontWeight:"bold",padding:"1px 4px",borderRadius:6,fontFamily:"Cinzel,serif"}}>+{reps-target}</div>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,color:done && !isBonus ?"#6b7280":"#d1d5db",textDecoration:done && !isBonus ?"line-through":"none"}}>{task.name}</div>
            <div style={{fontSize:9,color:"#3a3a5a",marginTop:2,fontFamily:"Cinzel,serif",letterSpacing:1}}>
              {cat?.icon} {cat?.name} · IMP {task.importance ?? 5}/10
              {target > 1 && ` · ${target}×/day`}
              {isBonus && <span style={{color:"#f59e0b",marginLeft:4}}>· BONUS</span>}
            </div>
            {/* Progress bar for multi-rep tasks */}
            {target > 1 && (
              <div style={{height:3,background:"#0d0d1f",borderRadius:2,marginTop:5,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${cat?.color}77,${cat?.color})`,borderRadius:2,boxShadow:`0 0 5px ${cat?.color}66`,transition:"width .3s"}}/>
              </div>
            )}
          </div>
        </div>
        {/* Undo button (only if reps > 0) */}
        {reps > 0 && (
          <button onClick={(e)=>{e.stopPropagation(); undoTask(task.id, d);}} style={{background:"transparent",border:"none",color:"#3a3a5a",fontSize:14,cursor:"pointer",padding:"4px 6px"}}>↺</button>
        )}
      </div>
    );
  };

  return (
    <div style={C.app}>
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 15% 40%,#0f0a2244 0%,transparent 55%),radial-gradient(ellipse at 85% 15%,#1a050544 0%,transparent 50%)",pointerEvents:"none",zIndex:0}}/>

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",top:22,left:"50%",transform:"translateX(-50%)",background:`${toast.color}22`,border:`1px solid ${toast.color}88`,color:toast.color,padding:"9px 22px",borderRadius:30,fontSize:12,fontFamily:"Cinzel,serif",zIndex:999,letterSpacing:2,boxShadow:`0 0 20px ${toast.color}33`,whiteSpace:"nowrap"}}>{toast.msg}</div>
      )}

      {/* Level Up modal */}
      {showLevelUp && (
        <div style={{position:"fixed",inset:0,background:"#000d",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .3s"}}>
          <div style={{background:"linear-gradient(135deg,#1a1200,#0a0a18)",border:"2px solid #f59e0b",borderRadius:20,padding:"30px 40px",textAlign:"center",boxShadow:"0 0 60px #f59e0b88",maxWidth:320}}>
            <div style={{fontSize:11,letterSpacing:6,color:"#f59e0b",fontFamily:"Cinzel,serif"}}>★ LEVEL UP ★</div>
            <div style={{margin:"20px 0",display:"flex",justifyContent:"center"}}>
              <PixelCharacter level={showLevelUp.lvl}/>
            </div>
            <div style={{fontSize:24,fontFamily:"Cinzel,serif",fontWeight:900,color:"#f59e0b",letterSpacing:3,textShadow:"0 0 20px #f59e0b88"}}>LV {showLevelUp.lvl}</div>
            <div style={{fontSize:18,color:"#e5e7eb",fontFamily:"Cinzel,serif",letterSpacing:2,marginTop:4}}>{showLevelUp.name.toUpperCase()}</div>
            <div style={{fontSize:11,color:"#34d399",marginTop:14,fontFamily:"Cinzel,serif",letterSpacing:1}}>UNLOCKED:</div>
            <div style={{fontSize:13,color:"#d1d5db",marginTop:3}}>{showLevelUp.unlock}</div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div style={{position:"fixed",inset:0,background:"#000c",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setConfirmDelete(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(135deg,#1a0d0d,#0a0a18)",border:"2px solid #ef4444",borderRadius:18,padding:"24px 26px",maxWidth:340,width:"100%",boxShadow:"0 0 40px #ef444466"}}>
            <div style={{fontSize:10,letterSpacing:5,color:"#ef4444",fontFamily:"Cinzel,serif",textAlign:"center",marginBottom:14}}>⚠ CONFIRM DELETE</div>
            <div style={{fontSize:14,color:"#d1d5db",textAlign:"center",marginBottom:8,lineHeight:1.4}}>
              Are you sure you want to delete <span style={{color:"#f59e0b",fontWeight:"bold"}}>{confirmDelete.name}</span>?
            </div>
            {confirmDelete.type==="cat" && confirmDelete.taskCount > 0 && (
              <div style={{fontSize:11,color:"#fb923c",textAlign:"center",marginBottom:14,fontFamily:"Cinzel,serif",letterSpacing:1,background:"#1a0d0066",padding:"8px 10px",borderRadius:8,border:"1px solid #fb923c33"}}>
                {confirmDelete.taskCount} task(s) will need to be reassigned
              </div>
            )}
            {confirmDelete.type==="task" && (
              <div style={{fontSize:11,color:"#6b7280",textAlign:"center",marginBottom:14,fontFamily:"Cinzel,serif",letterSpacing:1}}>
                This task and all its history will be permanently removed
              </div>
            )}
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button style={{...C.btnSm,flex:1,padding:"12px"}} onClick={()=>setConfirmDelete(null)}>CANCEL</button>
              <button style={{background:"linear-gradient(135deg,#b91c1c,#ef4444)",color:"#fff",border:"none",borderRadius:8,padding:"12px",fontSize:11,cursor:"pointer",fontFamily:"Cinzel,serif",letterSpacing:2,fontWeight:"bold",flex:1,boxShadow:"0 0 14px #ef444444"}} onClick={()=>{
                if (confirmDelete.type==="cat") {
                  deleteCat(confirmDelete.id);
                  setEditingCat(null);
                } else {
                  deleteTask(confirmDelete.id);
                  toast$("Task deleted", "#ef4444");
                }
                setConfirmDelete(null);
              }}>DELETE</button>
            </div>
          </div>
        </div>
      )}

      <div style={{position:"relative",zIndex:1}}>
        <div style={C.header}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:19,fontFamily:"'Cinzel',serif",fontWeight:900,letterSpacing:4,color:"#f59e0b",textShadow:"0 0 20px #f59e0b66"}}>⚔ LIFE RPG</div>
              <div style={{fontSize:8,letterSpacing:5,color:"#2a2a4a",marginTop:1,fontFamily:"Cinzel,serif"}}>MASTER YOUR ATTRIBUTES</div>
            </div>
            <div style={{textAlign:"right"}}>
              {retroMode ? <div style={{fontSize:10,color:"#f472b6",fontFamily:"Cinzel,serif"}}>📅 RETRO</div>
                : <div style={{fontSize:10,color:"#4b5563",fontFamily:"Cinzel,serif"}}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>}
              <div style={{fontSize:10,color:"#2a2a4a",marginTop:2}}>{todayDone}/{todayTasks.length} done</div>
            </div>
          </div>
        </div>

        {/* ══ DASHBOARD ══ */}
        {view==="dashboard" && (
          <div style={{padding:"14px 18px"}}>

            {/* Character + Rating combined card */}
            <div style={C.glowCard}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{flex:"0 0 auto",position:"relative"}}>
                  <PixelCharacter level={level.lvl}/>
                </div>
                <div style={{flex:1,textAlign:"left"}}>
                  <div style={{fontSize:8,letterSpacing:4,color:"#3a3a5a",fontFamily:"Cinzel,serif"}}>LV {level.lvl}</div>
                  <div style={{fontSize:15,fontFamily:"Cinzel,serif",fontWeight:700,color:"#f59e0b",letterSpacing:2,marginTop:2,textShadow:"0 0 15px #f59e0b66"}}>{level.name.toUpperCase()}</div>
                  <div style={{fontSize:46,fontWeight:900,fontFamily:"Cinzel,serif",color:tier.color,lineHeight:1,textShadow:`0 0 25px ${tier.color}88`,marginTop:6}}>{rating}</div>
                  <div style={{fontSize:9,letterSpacing:5,color:tier.color,fontFamily:"Cinzel,serif",marginTop:1}}>{tier.label}</div>
                </div>
              </div>

              {/* Level progress bar */}
              <div style={{marginTop:14}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:8,fontFamily:"Cinzel,serif",letterSpacing:2,color:"#4b5563",marginBottom:4}}>
                  <span>LV {level.lvl}</span>
                  <span>{rating}/{level.lvl===14?100:level.ratingForNext}</span>
                  <span>LV {level.lvl===14?"MAX":level.lvl+1}</span>
                </div>
                <div style={{height:6,background:"#0d0d1f",borderRadius:3,border:"1px solid #1e2040",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${level.lvl===14?100:lvlProgress}%`,background:`linear-gradient(90deg,${tier.color}77,${tier.color})`,borderRadius:3,boxShadow:`0 0 10px ${tier.color}66`,transition:"width .6s ease"}}/>
                </div>
                {level.lvl<14 && <div style={{fontSize:9,color:"#3a3a5a",marginTop:5,fontFamily:"Cinzel,serif",letterSpacing:1,textAlign:"center"}}>NEXT: {LEVELS[level.lvl+1].name.toUpperCase()} — {LEVELS[level.lvl+1].unlock}</div>}
              </div>

              {/* Potential ratings */}
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <div style={{flex:1,background:"#0d1a10",border:"1px solid #34d39933",borderRadius:10,padding:"7px 9px",textAlign:"center"}}>
                  <div style={{fontSize:7,letterSpacing:3,color:"#34d399",fontFamily:"Cinzel,serif"}}>IF ALL DONE</div>
                  <div style={{fontSize:19,fontWeight:"bold",color:"#34d399",fontFamily:"Cinzel,serif",marginTop:2}}>{ratingIfAllDone}</div>
                  <div style={{fontSize:8,color:"#34d39966"}}>+{(ratingIfAllDone-rating).toFixed(0)}</div>
                </div>
                <div style={{flex:1,background:"#1a0d0d",border:"1px solid #ef444433",borderRadius:10,padding:"7px 9px",textAlign:"center"}}>
                  <div style={{fontSize:7,letterSpacing:3,color:"#ef4444",fontFamily:"Cinzel,serif"}}>IF NONE DONE</div>
                  <div style={{fontSize:19,fontWeight:"bold",color:"#ef4444",fontFamily:"Cinzel,serif",marginTop:2}}>{ratingIfNoneDone}</div>
                  <div style={{fontSize:8,color:"#ef444466"}}>{ratingIfNoneDone < rating ? `−${rating - ratingIfNoneDone}` : "no loss"}</div>
                </div>
              </div>
            </div>

            {/* Radar */}
            <div style={C.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={C.label}>STAT CHART</div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:16,height:1.5,background:"#f59e0b"}}/><div style={{fontSize:8,color:"#4b5563",fontFamily:"Cinzel,serif"}}>NOW</div></div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:16,height:0,borderTop:"1.5px dashed #34d399"}}/><div style={{fontSize:8,color:"#34d399",fontFamily:"Cinzel,serif"}}>POTENTIAL</div></div>
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"center"}}><RadarChart categories={data.categories} ghostCategories={ghostCategories}/></div>
            </div>

            {/* TODAY'S TASKS */}
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={C.label}>TODAY — {retroMode && retroDate ? retroDate : new Date().toLocaleDateString("en-US",{weekday:"long"}).toUpperCase()}</div>
                <button style={{...C.btnSm,color:retroMode?"#f472b6":"#4b5563",borderColor:retroMode?"#f472b6":"#1e2040"}}
                  onClick={()=>{setRetroMode(!retroMode);setRetroDate(null);}}>
                  {retroMode ? "✕ EXIT" : "📅 LOG PAST"}
                </button>
              </div>
              {retroMode && (
                <div style={{background:"#0d0a1a",border:"1px solid #f472b633",borderRadius:12,padding:"10px 12px",marginBottom:10}}>
                  <div style={{fontSize:9,letterSpacing:3,color:"#f472b6",fontFamily:"Cinzel,serif",marginBottom:7}}>SELECT DAY</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {pastDays.map(dk=>{
                      const dow=getDayOfWeek(dk); const label=DAYS[dow];
                      const [,m,d]=dk.split("-");
                      const ton=data.tasks.filter(t=>isScheduledOn(t,dk));
                      const don=ton.filter(t=>isCompletedOn(t,dk)).length;
                      const sel=retroDate===dk;
                      return (
                        <button key={dk} onClick={()=>setRetroDate(dk)} style={{background:sel?"#1a0d2a":"#0d0d1f",border:`1px solid ${sel?"#f472b6":"#1e2040"}`,borderRadius:10,padding:"7px 10px",cursor:"pointer",color:sel?"#f472b6":"#6b7280",fontFamily:"Cinzel,serif",fontSize:9,letterSpacing:1,textAlign:"center",minWidth:48}}>
                          <div style={{fontWeight:"bold"}}>{label}</div>
                          <div style={{fontSize:8,marginTop:1,color:sel?"#f472b666":"#2a2a4a"}}>{m}/{d}</div>
                          <div style={{fontSize:8,marginTop:1,color:"#34d399"}}>{don}/{ton.length}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {todayTasks.length===0
                ? <div style={{color:"#2a2a4a",fontSize:13,textAlign:"center",padding:"20px 0",fontFamily:"Cinzel,serif",letterSpacing:2}}>REST DAY</div>
                : (() => {
                    const sortedTasks = [...todayTasks].sort((a,b) => (b.importance ?? 5) - (a.importance ?? 5));
                    const pending = sortedTasks.filter(t => !isCompletedOn(t, today));
                    const completed = sortedTasks.filter(t => isCompletedOn(t, today));
                    return (
                      <>
                        {pending.map(t => <TaskRow key={t.id} task={t} forDate={today}/>)}
                        {pending.length === 0 && completed.length > 0 && (
                          <div style={{textAlign:"center",padding:"14px 0",color:"#34d399",fontSize:11,fontFamily:"Cinzel,serif",letterSpacing:3}}>★ ALL DONE ★</div>
                        )}
                        {completed.length > 0 && (
                          <>
                            <div style={{display:"flex",alignItems:"center",gap:8,margin:"14px 0 8px"}}>
                              <div style={{flex:1,height:1,background:"#1e2040"}}/>
                              <div style={{fontSize:8,letterSpacing:4,color:"#34d399",fontFamily:"Cinzel,serif"}}>COMPLETED ({completed.length})</div>
                              <div style={{flex:1,height:1,background:"#1e2040"}}/>
                            </div>
                            {completed.map(t => <TaskRow key={t.id} task={t} forDate={today}/>)}
                          </>
                        )}
                      </>
                    );
                  })()
              }
            </div>

            {/* ATTRIBUTES */}
            <div style={C.label}>ATTRIBUTES</div>
            {data.categories.map(cat=>(
              <div key={cat.id} style={C.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <span style={{fontSize:18}}>{cat.icon}</span>
                    <div>
                      <div style={{fontSize:12,color:"#c0c0d0",fontFamily:"Cinzel,serif",letterSpacing:1}}>{cat.name.toUpperCase()}</div>
                      <div style={{fontSize:9,color:"#2a2a4a",marginTop:1}}>{data.tasks.filter(t=>t.catId===cat.id).length} tasks</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span style={{fontSize:20,fontWeight:"bold",color:cat.color,fontFamily:"Cinzel,serif",textShadow:`0 0 10px ${cat.color}55`}}>{cat.value.toFixed(1)}</span>
                    <span style={{fontSize:10,color:"#2a2a4a"}}>/{cat.maxValue}</span>
                  </div>
                </div>
                <div style={C.statBar}><div style={C.statFill(cat.color,(cat.value/cat.maxValue)*100)}/></div>
              </div>
            ))}

            <button style={{...C.btnSm,marginTop:14,width:"100%",padding:"10px"}} onClick={resetAll}>↺ RESET PROGRESS</button>
          </div>
        )}

        {/* ══ TASKS ══ */}
        {view==="tasks" && (
          <div style={{padding:"14px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={C.label}>ALL TASKS ({data.tasks.length})</div>
              <button style={C.btn} onClick={()=>setView("addTask")}>+ NEW</button>
            </div>
            {data.tasks.map(task=>{
              const cat=data.categories.find(c=>c.id===task.catId);
              const done=isCompletedOn(task,currentDay);
              return (
                <div key={task.id} style={C.card}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                    <span style={{fontSize:17,marginTop:1}}>{cat?.icon||"📌"}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,color:"#d1d5db",marginBottom:3}}>{task.name}</div>
                      <div style={{fontSize:9,color:"#3a3a5a",marginBottom:6,fontFamily:"Cinzel,serif",letterSpacing:1}}>{cat?.name} · IMP {task.importance ?? 5}/10 · {task.targetReps ?? 1}×/day · +{task.points.toFixed(3)}/−{task.decayRate.toFixed(3)}</div>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                        {DAYS.map((d,i)=>(
                          <div key={i} style={{fontSize:8,padding:"2px 6px",borderRadius:8,fontFamily:"Cinzel,serif",background:task.days.includes(i)?"#1a1200":"transparent",color:task.days.includes(i)?"#f59e0b":"#2a2a4a",border:`1px solid ${task.days.includes(i)?"#f59e0b33":"#12122a"}`}}>{d}</div>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end",flexShrink:0}}>
                      {done && <div style={{fontSize:8,color:"#34d399",fontFamily:"Cinzel,serif",letterSpacing:1}}>✓ TODAY</div>}
                      <button style={C.btnSm} onClick={()=>{setEditTask({...task});setView("editTask");}}>EDIT</button>
                      <button style={C.btnDanger} onClick={()=>setConfirmDelete({type:"task",id:task.id,name:task.name})}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* EDIT TASK */}
        {view==="editTask" && editTask && (
          <div style={{padding:"14px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <button style={C.btnSm} onClick={()=>{setEditTask(null);setView("tasks");}}>← BACK</button>
              <div style={{fontSize:13,fontFamily:"Cinzel,serif",letterSpacing:3,color:"#f59e0b"}}>EDIT TASK</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div><div style={{...C.label,marginBottom:5}}>NAME</div><input style={C.input} value={editTask.name} onChange={e=>setEditTask({...editTask,name:e.target.value})}/></div>
              <div><div style={{...C.label,marginBottom:5}}>CATEGORY</div>
                <select style={C.select} value={editTask.catId} onChange={e=>setEditTask({...editTask,catId:e.target.value})}>{data.categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
              <div><div style={{...C.label,marginBottom:7}}>SCHEDULED DAYS</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{DAYS.map((d,i)=>(<button key={i} style={C.dayBtn(editTask.days.includes(i))} onClick={()=>setEditTask(p=>({...p,days:p.days.includes(i)?p.days.filter(x=>x!==i):[...p.days,i].sort((a,b)=>a-b)}))}>{d}</button>))}</div></div>
              <div>
                <div style={{...C.label,marginBottom:5}}>IMPORTANCE: <span style={{color:"#f59e0b"}}>{editTask.importance ?? 5}/10</span></div>
                <input type="range" min="1" max="10" step="1" value={editTask.importance ?? 5} onChange={e=>setEditTask({...editTask,importance:parseInt(e.target.value)})} style={{width:"100%",accentColor:"#f59e0b"}}/>
                <div style={{marginTop:8,padding:"8px 10px",background:"#0d0d1f",borderRadius:8,border:"1px solid #1e2040",display:"flex",justifyContent:"space-between",fontSize:10,fontFamily:"Cinzel,serif",letterSpacing:1}}>
                  <span style={{color:"#34d399"}}>+{calcPoints(editTask.importance ?? 5).toFixed(3)} done</span>
                  <span style={{color:"#ef4444"}}>−{calcDecay(editTask.importance ?? 5).toFixed(3)} missed</span>
                </div>
                <div style={{fontSize:9,color:"#3a3a5a",marginTop:5,fontFamily:"Cinzel,serif",letterSpacing:1,textAlign:"center"}}>HIGHER IMPORTANCE = BIGGER REWARD AND RISK</div>
              </div>
              <div>
                <div style={{...C.label,marginBottom:5}}>REPS PER DAY: <span style={{color:"#38bdf8"}}>{editTask.targetReps ?? 1}×</span></div>
                <input type="range" min="1" max="10" step="1" value={editTask.targetReps ?? 1} onChange={e=>setEditTask({...editTask,targetReps:parseInt(e.target.value)})} style={{width:"100%",accentColor:"#38bdf8"}}/>
                <div style={{fontSize:9,color:"#3a3a5a",marginTop:5,fontFamily:"Cinzel,serif",letterSpacing:1,textAlign:"center"}}>
                  COMPLETE {editTask.targetReps ?? 1}× FOR FULL CREDIT · EXTRAS GIVE BONUS POINTS
                </div>
              </div>
              <button style={{...C.btn,width:"100%",padding:"13px"}} onClick={saveEditTask}>SAVE</button>
            </div>
          </div>
        )}

        {/* ADD TASK */}
        {view==="addTask" && (
          <div style={{padding:"14px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <button style={C.btnSm} onClick={()=>setView("tasks")}>← BACK</button>
              <div style={{fontSize:13,fontFamily:"Cinzel,serif",letterSpacing:3,color:"#f59e0b"}}>NEW TASK</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div><div style={{...C.label,marginBottom:5}}>NAME</div><input style={C.input} placeholder="e.g. Read 20 mins" value={newTask.name} onChange={e=>setNewTask({...newTask,name:e.target.value})}/></div>
              <div><div style={{...C.label,marginBottom:5}}>CATEGORY</div>
                <select style={C.select} value={newTask.catId} onChange={e=>setNewTask({...newTask,catId:e.target.value})}>{data.categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
              <div><div style={{...C.label,marginBottom:7}}>SCHEDULED DAYS</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{DAYS.map((d,i)=>(<button key={i} style={C.dayBtn(newTask.days.includes(i))} onClick={()=>setNewTask(p=>({...p,days:p.days.includes(i)?p.days.filter(x=>x!==i):[...p.days,i].sort((a,b)=>a-b)}))}>{d}</button>))}</div></div>
              <div>
                <div style={{...C.label,marginBottom:5}}>IMPORTANCE: <span style={{color:"#f59e0b"}}>{newTask.importance}/10</span></div>
                <input type="range" min="1" max="10" step="1" value={newTask.importance} onChange={e=>setNewTask({...newTask,importance:parseInt(e.target.value)})} style={{width:"100%",accentColor:"#f59e0b"}}/>
                <div style={{marginTop:8,padding:"8px 10px",background:"#0d0d1f",borderRadius:8,border:"1px solid #1e2040",display:"flex",justifyContent:"space-between",fontSize:10,fontFamily:"Cinzel,serif",letterSpacing:1}}>
                  <span style={{color:"#34d399"}}>+{calcPoints(newTask.importance).toFixed(3)} done</span>
                  <span style={{color:"#ef4444"}}>−{calcDecay(newTask.importance).toFixed(3)} missed</span>
                </div>
                <div style={{fontSize:9,color:"#3a3a5a",marginTop:5,fontFamily:"Cinzel,serif",letterSpacing:1,textAlign:"center"}}>HIGHER IMPORTANCE = BIGGER REWARD AND RISK</div>
              </div>
              <div>
                <div style={{...C.label,marginBottom:5}}>REPS PER DAY: <span style={{color:"#38bdf8"}}>{newTask.targetReps}×</span></div>
                <input type="range" min="1" max="10" step="1" value={newTask.targetReps} onChange={e=>setNewTask({...newTask,targetReps:parseInt(e.target.value)})} style={{width:"100%",accentColor:"#38bdf8"}}/>
                <div style={{fontSize:9,color:"#3a3a5a",marginTop:5,fontFamily:"Cinzel,serif",letterSpacing:1,textAlign:"center"}}>
                  COMPLETE {newTask.targetReps}× FOR FULL CREDIT · EXTRAS GIVE BONUS
                </div>
              </div>
              <button style={{...C.btn,width:"100%",padding:"13px"}} onClick={addTask}>CREATE</button>
            </div>
          </div>
        )}

        {/* STATS */}
        {view==="stats" && (
          <div style={{padding:"14px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={C.label}>CATEGORIES</div>
              <button style={C.btn} onClick={()=>setView("addCat")}>+ ADD</button>
            </div>

            {/* Orphan tasks warning */}
            {data.tasks.filter(t=>!t.catId || !data.categories.find(c=>c.id===t.catId)).length > 0 && (
              <div style={{background:"#1a1200",border:"1px solid #fb923c66",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
                <div style={{fontSize:10,letterSpacing:3,color:"#fb923c",fontFamily:"Cinzel,serif",marginBottom:6}}>⚠ NEEDS REASSIGNMENT</div>
                <div style={{fontSize:11,color:"#d1d5db",marginBottom:8}}>{data.tasks.filter(t=>!t.catId || !data.categories.find(c=>c.id===t.catId)).length} task(s) lost their category</div>
                {data.tasks.filter(t=>!t.catId || !data.categories.find(c=>c.id===t.catId)).map(task=>(
                  <div key={task.id} style={{display:"flex",alignItems:"center",gap:8,marginTop:7,background:"#0d0d1f",borderRadius:8,padding:"7px 10px"}}>
                    <div style={{flex:1,fontSize:12,color:"#d1d5db"}}>{task.name}</div>
                    <select style={{...C.select,padding:"5px 8px",fontSize:11,width:"auto"}} value="" onChange={e=>{
                      if (e.target.value) {
                        update({...data, tasks: data.tasks.map(t=>t.id===task.id ? {...t, catId:e.target.value} : t)});
                        toast$("Reassigned");
                      }
                    }}>
                      <option value="">Assign to...</option>
                      {data.categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {data.categories.map(cat=>{
              const isEditing = editingCat === cat.id;
              const taskCount = data.tasks.filter(t=>t.catId===cat.id).length;
              if (isEditing) {
                return (
                  <div key={cat.id} style={{...C.card, border:`1px solid ${cat.color}66`, boxShadow:`0 0 20px ${cat.color}22`}}>
                    <div style={{fontSize:9,letterSpacing:3,color:cat.color,fontFamily:"Cinzel,serif",marginBottom:10}}>EDITING</div>
                    <div style={{display:"flex",gap:8,marginBottom:10}}>
                      <input style={{...C.input,width:60,textAlign:"center",fontSize:20}} value={cat.icon} maxLength={2} onChange={e=>saveEditCat(cat.id,{icon:e.target.value})}/>
                      <input style={{...C.input,flex:1}} value={cat.name} onChange={e=>saveEditCat(cat.id,{name:e.target.value})}/>
                    </div>
                    <div style={{...C.label,marginBottom:6}}>COLOR</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                      {["#f59e0b","#ef4444","#38bdf8","#34d399","#a78bfa","#f472b6","#fb923c","#22c55e","#e879f9","#fbbf24"].map(col=>(
                        <button key={col} onClick={()=>saveEditCat(cat.id,{color:col})} style={{width:26,height:26,borderRadius:"50%",background:col,border:`3px solid ${cat.color===col?"#fff":"transparent"}`,cursor:"pointer",boxShadow:cat.color===col?`0 0 8px ${col}88`:"none"}}/>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button style={{...C.btn,flex:1,padding:"10px"}} onClick={()=>{setEditingCat(null);toast$("Saved ✓");}}>DONE</button>
                      <button style={{...C.btnSm,padding:"10px 14px",color:"#ef4444",borderColor:"#ef444433"}} onClick={()=>setConfirmDelete({type:"cat",id:cat.id,name:cat.name,taskCount})}>DELETE</button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={cat.id} style={{...C.card,cursor:"pointer"}} onClick={()=>setEditingCat(cat.id)}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:22}}>{cat.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{fontSize:13,fontFamily:"Cinzel,serif",letterSpacing:1,color:"#d1d5db"}}>{cat.name}</div>
                        <span style={{fontSize:17,fontWeight:"bold",color:cat.color,fontFamily:"Cinzel,serif"}}>{cat.value.toFixed(1)}<span style={{fontSize:10,color:"#2a2a4a"}}>/{cat.maxValue}</span></span>
                      </div>
                      <div style={{fontSize:9,color:"#2a2a4a",marginTop:2,fontFamily:"Cinzel,serif",letterSpacing:1}}>{taskCount} TASKS · {Math.round((cat.value/cat.maxValue)*100)}% · TAP TO EDIT</div>
                      <div style={C.statBar}><div style={C.statFill(cat.color,(cat.value/cat.maxValue)*100)}/></div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Level milestones */}
            <div style={{...C.label, marginTop:24}}>LEVEL MILESTONES</div>
            {LEVELS.map(l=>{
              const reached=level.lvl>=l.lvl;
              return (
                <div key={l.lvl} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:reached?"#0f1020":"#08080f",border:`1px solid ${reached?"#1e2040":"#0d0d18"}`,borderRadius:10,marginBottom:5,opacity:reached?1:0.5}}>
                  <div style={{fontSize:11,fontFamily:"Cinzel,serif",letterSpacing:1,color:reached?"#f59e0b":"#2a2a4a",minWidth:32}}>LV{l.lvl}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:reached?"#d1d5db":"#3a3a5a",fontFamily:"Cinzel,serif",letterSpacing:1}}>{l.name.toUpperCase()}</div>
                    <div style={{fontSize:9,color:reached?"#34d399":"#2a2a4a",marginTop:1}}>{l.unlock}</div>
                  </div>
                  <div style={{fontSize:9,color:"#3a3a5a",fontFamily:"Cinzel,serif"}}>{l.lvl*7}+</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ADD CAT */}
        {view==="addCat" && (
          <div style={{padding:"14px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <button style={C.btnSm} onClick={()=>setView("stats")}>← BACK</button>
              <div style={{fontSize:13,fontFamily:"Cinzel,serif",letterSpacing:3,color:"#f59e0b"}}>NEW CATEGORY</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div><div style={{...C.label,marginBottom:5}}>NAME</div><input style={C.input} placeholder="e.g. Faith" value={newCat.name} onChange={e=>setNewCat({...newCat,name:e.target.value})}/></div>
              <div><div style={{...C.label,marginBottom:5}}>ICON</div><input style={C.input} placeholder="emoji" value={newCat.icon} onChange={e=>setNewCat({...newCat,icon:e.target.value})} maxLength={2}/></div>
              <div><div style={{...C.label,marginBottom:7}}>COLOR</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{["#f59e0b","#ef4444","#38bdf8","#34d399","#a78bfa","#f472b6","#fb923c","#22c55e","#e879f9","#fbbf24"].map(col=>(<button key={col} onClick={()=>setNewCat({...newCat,color:col})} style={{width:28,height:28,borderRadius:"50%",background:col,border:`3px solid ${newCat.color===col?"#fff":"transparent"}`,cursor:"pointer"}}/>))}</div></div>
              <div><div style={{...C.label,marginBottom:5}}>MAX: <span style={{color:"#f59e0b"}}>{newCat.maxValue}</span></div><input type="range" min="5" max="100" step="5" value={newCat.maxValue} onChange={e=>setNewCat({...newCat,maxValue:parseInt(e.target.value)})} style={{width:"100%",accentColor:"#f59e0b"}}/></div>
              <button style={{...C.btn,width:"100%",padding:"13px"}} onClick={addCat}>CREATE</button>
            </div>
          </div>
        )}
      </div>

      <div style={C.nav}>
        {[{v:"dashboard",icon:"◈",label:"PROFILE"},{v:"tasks",icon:"◻",label:"TASKS"},{v:"stats",icon:"◆",label:"STATS"}].map(n=>(
          <button key={n.v} style={C.navBtn(isActive(n.v))} onClick={()=>setView(n.v)}>
            <span style={{fontSize:19}}>{n.icon}</span>{n.label}
          </button>
        ))}
      </div>
    </div>
  );
}
