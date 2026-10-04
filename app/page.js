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
// Difficulty 1-10 maps onto the mission ranks, one per step.
const MISSION_RANKS = ["D","D+","C","C+","B","B+","A","A+","S","S+"];
const MISSION_COLORS = ["#8d9299","#8d9299","#4ade80","#4ade80","#38bdf8","#38bdf8",
                        "#a855f7","#a855f7","#f59e0b","#ffd34a"];
function diffLabel(imp) {
  const i = Math.max(1, Math.min(10, Math.round(imp ?? 5)));
  return MISSION_RANKS[i-1] + " RANK";
}
function diffShort(imp) {
  const i = Math.max(1, Math.min(10, Math.round(imp ?? 5)));
  return MISSION_RANKS[i-1];
}
function diffColor(imp) {
  const i = Math.max(1, Math.min(10, Math.round(imp ?? 5)));
  return MISSION_COLORS[i-1];
}


// ── SKY THEMES (Not Boring style scenes; keys unchanged so saves migrate) ─────
// Inlined artwork for the Dawn theme's hero banner.
const AKATSUKI_BANNER = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAADACAMAAABCiUr0AAAAh1BMVEVMaXHIwM1+f37wKCAwKiwYGhgEAgRANEgECQTsj4+MgJyICBj44LBBi15JqkS+c3lAN0xzcnPyrYlGRmEwKDW3Kybw0GaoUFBMTFDBdkYgbBDdl1XUhoZ3ktl9QV5aKzJ3w9N3nKPDWUP/4bfzKCdYeJn4+vTTgmnO4OyOCRn7+YX506VIZ4q4a6geAAAAAXRSTlMAQObYZgAAAAlwSFlzAAALEwAACxMBAJqcGAAADP1JREFUeNrtnH9D6joPxx10WdnQcTYQ+eFA9CJ6fP+v70nabmxdR72u/nOffNU5aYHsQ9K0Xc65u2OxWCwWi8VisVgsFovFYrFYLBaLxWKxWCwWi8VisVgsFovFYrFYLBaLxWKxWCwWi8VisVgsFovFYrFYLBaLxWKxWCwWi8X6sf60xDR+AG/WEkP8l/T2Blw+mbQhMptv4ds3zPJJPus6IvPx4msDm0xaHsgIv8Pv6n37Sa0837cRMqUb/Bp6CG2vPRBdcI9/EkQAmKkjk7rtfpPG5VohvIftw8MDzACPW0Z4w/0m+5lLBO5eeeA9gWReA/wG8Gl+91s8294zwWF++WyYn3LBXDkgExwY/9qTFsocWti2fTDYJgblw5ah9R1wMrPSsD7f5zU1HARrD2QXvMFvf6XXjWA9BjJAD7987x4C700WvmeAN/lNhnPINm95IK9JOgAn9fZLPpyEMXXkdTphgJYD5moJ0t8+6AK8ZmFclDBB2wEnExug2RC8euBsywCHR8DcBlhvCNZzFzUGNjMaJngFiGCk1ARzOmltCObXzIvQJu2MzAA7ABM5m0j9+4pPuyQCxIXwFpSnwnZLfzLAFj+aN8skkZK+DUBai6iYppVIDVB9NQCZYA1QkkSSiIQO8rqtkDchrARbEM05A2wBTJIkFkAyALuzQdjWAMXWANwywCvAPXkfVBtSBULIVh7R2mpmGL10UH/wDZJ2CpExrDebdVWtN2t0wsQGCHoM3AqBLqjGQMiZYBsg8kN4G4K4Jh+cNfPCvAZ4T+gEYbxngBZAmYDhp4I4ltY0ps4iNAbWwyEDbOcQdMCaHzohyOu6RPtgDZAckAHaAKUQsK5U+NIgSKOgbDkguaDoARQMsOWBsQKoghhPECANgh2AFLg0hxH4pc8ZYHsMhPVhXdVjIGYR2wNpHkMzmBJKobLwdsYAWx6IIXw4NENgpcfADkChsvDlXJbaAwUD7HpgdTis1wc9BFb9JKKziAAECEIv5BhgB+DhAIAI1xVxhN40Rs+kQVxqD2SANkBaB69JSNAAbE2kCSAOgRAJWjFvGWA/iUA2VS64pqWItG5s5gRtC3N4QoBzdc7zwPZmwl4e1uSAlXLBg7SKe3Ocu0gVwgSQHFDiI8yv64IUu8oFaQicdG5vTnB/QdLAF0WiVBuCuP/FADsApYpfBRCktG4uTdQGTYlZ+KKycEn7hwywfVMO9/LrCAY819lXF8jssVqaACLBUgEsFT8GaG0nCKmyMABurkq9kz/R1W0TGgORmKDwxcGvFOovvqlk7+mL+s5IbzsVZzHqYaEACmn4McDrfozilsTTONEkewDVLSepAOpTBtgmKONYNABFHDsAxribTwTxBxVLjuBWeS/yQyGWjA4km6DUHdDxND/VgwHWBKXBhgANyh7AugdcezC/WjioGT6ZoZNYBK894NqDATYAVeJoQriViOvpdNNDZrLpweC6ACm3ToU5w6ngfr830+l97uzB4K4RjDiiJ4MniTWu6470zOrxFOke/5e0YMgBs6gGKJoYrit+rR5R5nZBKe2T/yJAcAKUMkoNnpdIOZhslahaPdJISifAHT4kze//qPtBDLYT6oXFUxOg0TSTdZGb3tSye+CZfqgHcCclff8cIHj+NTI4Yyige8EtC+imrsCJiA2wzqu1f03VskO2J4GdHiYjdwCqdXS+2+U7OvwUIOCtwQMMf/ywAsjAR+Cn7UAXBXSxA12EWkRgnx5AFZKNf2GE9gC2e6iAtgHukFuV3wbo+YAJIGqgHeFlq1WW3Xg+pBEphR+1K34KoI3oCjBWHbouqKZ3ahMhxbVwqjYV1GSvtY4b6NF+lZwI5uonzyvpyCNQps+ktBxCtHkkbQaub4X8SIMuCFEt+EG75ifMEZwRIHAIVB4I3eSp4zNdIZ7IRCjG41WdHqu07tH9HGqC+tAfBqF81gCfn90E4bGWy3pYNRpwQvQv42FuHzP+N+SDECcNwESAmzDgegxdsDcMKjzRyfgXvkFvLXztcYr0jpedQfL87y7/+3f3d4ffuR3FuI+dHmuAaXmTn4MgZKuWMqcTloYeqfzXABGPAig0wNjZg/A6AeJLPzUjXEp52AbY6fFEiK2XQHJ/cwUQj31+6BXl8bkG6CK4aQHc9K3Ppg2/6crjYG5CKXVIhTr222uA8TBAlALYH8dllkVpgyeaOgB2eqRRlkl7BtMELyWSygYYlRECTGuADvMeP1sAoe+BbYAuDySA128nQPwURRnjcQBgon1Q7Yn2O1BRhpYorUFIZtNp1ODBmfQ/0vrPx7o9FGIrfnf5rp7EOMZA44Fpqvk93wb42QeI2GqCdJK5ARl6qfMTEvgwXrqI6bcboNrzjOMhgKV4IeGL2AD/wQClqXGm3FjPkTv//V27RyKeCLE9Aua7ZghRbtjtgO+JyQPzyBEDGUfD0jEEbkDn4c/PT+gPgfihTZHdlA4rpweW8zmxS+fz0gUQb4bFBIGitARniqCdulilCQdAuqmm9gbotppjNdKa5Tn2CXw9KAmXehgvy92u6g2CAM/HtHjGVIJKXQA3mGdg80l6dHgg5Y7VNNPZxAUQ+TUqXR5YlrEyMKZglD2AyK5UA2RJFB0A8RoUQApiuHPkYbUf6Mqw/h4yr3Y5AiCVZb6rZH8SqDykKGk26BqDHilRpyYX29eHLphl7xkdVzQfzKyJGBYGWABBdueieNUIUBmIAPvTefK+5gJiF0B4eTFjIJ30HExe5dyo8vSQVV41IVy5AJYYWnP8QYRl3wNB14eZIH60DATkVmQFEnwvVlmxslYrEsMa5mXR8CvKOeBjHYARiCYJCIhcAJsLcAM8CnjB8HkBcewDnM/NwkLG87kT4O0e8rWqiletoqheewDRKZ6Pz0gQj9Afo2B+KADw2g8ugGh9VhQaEJ4c5vYQhACLFKsCChJWCKQFdPkhQHGi9hO1n4QTIDbg07HbAMBzJBCgiM4OgLK1mTcQwjd7SLRMSvX+UhbvRQ9gUaLhoC4Pz/sAseGSJAhn4wRYQIFR+v7+jrGJvtiznwAWlzTGN0jjS0EA7XmAKLYPcDqd4GFbiL4BSO1ynuLzz9MLsewPol/R+eXl+PJyjr7CbwkRtEu0OBWnKL24AJZpcbys0b7L+liUpRPgWQF2A8wOeFkIEC/z0Ad4h9WNUJzpEyiS5Iyf0jTrEcLQPgn6lOdzFx98fkZ+nmX0fNdq8vhivn7jfwCUiCZ9Igd4uhSFYyWcFmeMcgzv6lykfQuQ3Vl5qHJBx1quhccxC8SZPtRBTp+CPdPHHvCnkDQPxAj5A455BuCzT3P1UzjaEeDX8fj1RYdfAaiGwBN+4SBY9QEq++oxHv9y2q8bNw6A1tPv3ASbDn1+OPAA8St1eYADoIS5+QDmA+0qh1AWgV+4aYHj4skkkZN0v//1+qQDoATTTHlSep7uBJg1r5C5AOImplQAJVXw3bnaDUA51C7R/Y5f7uePBriQsnpHfO+4Gbhwv39FBhbVoP1S2e+0j5oP6umHAfNlYnyQ/M/5BteJmPhpOwy3jwe4bN5/uQhuv+/p6t4YOSGQ+yXON+hU8AVvHw9wYRAu8Sy4fV7zqWGaJVgjmmRT11rJruAL3D5+CCRui/gtXmiSYe3zm68q9KaqcmeqKvRc7e0KvsDtowHG8bIBuAxun9d8XaGH7FJD0eriqOAL2h6AH2q5jD/oENw+v/mm/i6rS8yEtVx3VPAFbR8N0GBDgAZlUPu85jf1d+/Fe1N/56vgC9g+nt/CEPww/BbLgPb5zW/q76bvU1f9nbOCL2B7mBTchHAvEY+0z29+U3+Hm4au+jtffd7Y9jAAEdvybWnOFgHt85rfqr9bu+rvBir4grUHiGAEFj0ZgItYAw1ln9/8Vv1d5qq/G6jgC9YexgE/ohqg7YIj7fOb76u/G6jgC9YeAiC9vgFI5Uk9gCPs85rvq78brOAL1B4igpf0+gZg9PahHwpjn998X/3dYAVfoPYAk0CTeTXANHqjjLwMZJ/ffF/93WAFX6D2EAAlBW0rhKUFcIR9fvN99Xe/3T5+HYew1CZCimvhVG0q0NIkkH3fMN9XfzdQwResffxWjI5gfP23ONLbMQHt+475vvo7RwVf0PYwu1n4+toDQ9vnN99Xf+eo4AvaPhogvX49BlIW+Qhqn998b/1dv4IvaPtogB8fNA00AKO3HsBx9vnN99TfuSr4graPB/j2FjUAn0Lb5zffW3/nquAL2D4aIL0+TZ4/aGNruVgsg9r3DfO99Xe/3B5kP6H2wB6/0fZ9w3xfhd5vtwfJw2o/0HVPabR93yhg9FTo/Xb7eBdsvf4yuH3fKGD0VOj9dvtogK+v5rqkeH0Nbt83Chg9FXq/3R6gNuY37ftt81ksFovFYrFYLBaLxWKxWCwWi8VisVgsFovFYrFYwfU/EWuGIMZK0yEAAAAASUVORK5CYII=";

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
  akatsuki: {
    name:"Akatsuki", swatch:"#8c1020", banner:AKATSUKI_BANNER,
    sky:["#050206","#140509","#24060f"], sun:"#c21828", stars:true, ember:true,
    m1:"#3a0c16", m2:"#1e060c", m3:"#0c0206",
    accent:"#c93040", glass:"20,6,10",
  },
  voxel: {
    name:"Blockland", swatch:"#5d9e3c", blocky:true,
    sky:["#16233d","#2f629a","#63a8d8"], sun:"#ffe98a", stars:false,
    m1:"#4a7699", m2:"#2e4c6b", m3:"#5d9e3c",
    accent:"#7ed957", glass:"26,34,24",
  },
  forge: {
    name:"Forge", swatch:"#ec5e23",
    sky:["#070609","#161219","#2a1c10"], sun:"#ff7a2e", stars:false, ember:true,
    m1:"#3a2415", m2:"#241711", m3:"#120b09",
    accent:"#ff7a2e", glass:"26,16,10",
  },
};
const QUEST_ICONS = ["🏋️","🏃","🚴","🚶","🤸","🧘","💧","💊","🥗","🍳","😴","🛏️","📖","📚","✍️","📝","🙏","⛪","✝️","💼","💻","📞","📊","💰","🧹","🧺","🧼","🍽️","🚿","🪥","💈","🧴","🐕","🌱","🎸","🎨","🎯","🎮","☀️","🌙","⏰","🧠","❤️","👨‍👩‍👧","🎓","🔧","📵","🚭"];
const iconFor = (task, cat) => (task && task.icon) || (cat && cat.icon) || "⭐";

const NAV_ORDERABLE = ["tasks","boss","plan","board","shop","stats"];
const THEME_KEYS = Object.keys(THEMES);

// ══════════════════════════════════════════════════════════════════════════════
// BLOCKLAND — an original voxel skin. Hard edges, bevelled panels, dithered
// stone, and a chunky hotbar instead of a floating glass nav.
// ══════════════════════════════════════════════════════════════════════════════
const BLK = {
  panel:"#33402f", panelL:"#61784f", panelD:"#182116",
  btn:"#6f8a5f",   btnL:"#a3bd8c",   btnD:"#3e5334",
  slot:"#1e2a1c",  slotL:"#4a5b44",  slotD:"#0d120c",
  ink:"#121a11",   accent:"#7ed957", gold:"#ffcf4a",
  // solid, quiet plate used behind small artwork so texture can't compete
  plate:"#18211a",  plateLit:"#232f20",
};
// Deterministic 16x16 dither, emitted as a CSS data-URI so any surface can wear it.
function blockTexCSS(base, dark, light, seed) {
  let st = seed;
  const rnd = () => { st = (st*1103515245 + 12345) & 0x7fffffff; return st/0x7fffffff; };
  let r = `<rect width='16' height='16' fill='${base}'/>`;
  for (let i=0;i<40;i++) {
    const x = Math.floor(rnd()*16), y = Math.floor(rnd()*16), w = rnd()<0.3 ? 2 : 1;
    r += `<rect x='${x}' y='${y}' width='${w}' height='${w}' fill='${rnd()<0.55?dark:light}'/>`;
  }
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' shape-rendering='crispEdges'>${r}</svg>`)}")`;
}
const TEX_STONE = blockTexCSS("#33402f","#2e3a2a","#3a4935",7);
const TEX_DEEP  = blockTexCSS("#151d14","#111811","#1b241a",19);
const TEX_BTN   = blockTexCSS("#6f8a5f","#657f56","#7a9668",23);
const TEX_SLOT  = blockTexCSS("#1e2a1c","#1a2519","#242f21",29);
// Raised bevel (light top-left, dark bottom-right). Pass w for thickness.
const bevelUp   = (l,d,w=3)=>({borderRadius:0,borderTop:`${w}px solid ${l}`,borderLeft:`${w}px solid ${l}`,borderRight:`${w}px solid ${d}`,borderBottom:`${w}px solid ${d}`});
// Sunken bevel — used for inputs and empty hotbar slots.
const bevelIn   = (l,d,w=3)=>({borderRadius:0,borderTop:`${w}px solid ${d}`,borderLeft:`${w}px solid ${d}`,borderRight:`${w}px solid ${l}`,borderBottom:`${w}px solid ${l}`});
const PX = { backgroundSize:"48px 48px", imageRendering:"pixelated" };

// Same dither, as an SVG <pattern> for the scene's terrain.
function pxPattern(id, base, dark, light, seed) {
  let st = seed;
  const rnd = () => { st = (st*1103515245 + 12345) & 0x7fffffff; return st/0x7fffffff; };
  const cells = [];
  for (let i=0;i<40;i++) {
    const x = Math.floor(rnd()*16), y = Math.floor(rnd()*16), w = rnd()<0.3 ? 2 : 1;
    cells.push(<rect key={i} x={x} y={y} width={w} height={w} fill={rnd()<0.55?dark:light}/>);
  }
  return (
    <pattern id={id} key={id} width="16" height="16" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill={base}/>
      {cells}
    </pattern>
  );
}
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
  pomodoroEnabled: false,
  showXP: false,   // always words now; the toggle is gone
  statStyle: "radar", // "radar" | "bars" | "none"
  theme: "ember",
  cardStyle: "vivid", // "vivid" | "tinted"
  questLayout: "list", // "list" | "circles"
  questWeekView: "last7", // "last7" | "week" (Mon→Sun)
  navOrder: [],   // bottom-bar arrangement; empty means the default order
  casinoEnabled: false,
  shopEnabled: true,
  questsEnabled: true,
  statsEnabled: true,
  weeklyOnHome: true,
  planEnabled: true,
  bossEnabled: true,
  devMode: false,
};
const DEFAULT_EQUIPPED = {
  headband:true, vest:true, gloves:true, anbu:true,
  cloak:true, hat:true, sage:true,
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
const PERFECT_DAY_XP = 0.50;

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
  common:   { label:"D-RANK", color:"#9ca3af", gems:[3,6] },
  uncommon: { label:"C-RANK", color:"#4ade80", gems:[7,14] },
  rare:     { label:"B-RANK", color:"#38bdf8", gems:[16,30] },
  epic:     { label:"A-RANK", color:"#a855f7", gems:[34,60] },
  legendary:{ label:"S-RANK", color:"#f59e0b", gems:[80,150] },
};

// ── AURA SHAPES (each recolorable; colors bought separately) ──────────────────
const AURA_SHAPES = [
  { id:"saiyan",  name:"Chakra Flare" },
  { id:"cloud",   name:"Cursed Haze" },
  { id:"electric",name:"Lightning Release" },
  { id:"halo",    name:"Sage Ring" },
  { id:"orbit",   name:"Orbiting Shuriken" },
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
  { id:"pet_cat",     name:"Shukaku · One-Tail",  rarity:"common",    gems:0,  art:"tb1", color:"#d8bd84", gate:{streak:1} },
  { id:"pet_owl",     name:"Matatabi · Two-Tails",   rarity:"common",    gems:0,  art:"tb2", color:"#3fa9e0", gate:{streak:2} },
  { id:"pet_dog",     name:"Isobu · Three-Tails", rarity:"uncommon", gems:0, art:"tb3", color:"#7f9aa8", gate:{streak:3} },
  { id:"pet_fox",     name:"Son Goku · Four-Tails",   rarity:"rare",      gems:0, art:"tb4", color:"#c23a22", gate:{streak:4}  },
  { id:"pet_wolf",    name:"Kokuo · Five-Tails",rarity:"rare",      gems:0, art:"tb5", color:"#e3e0d6", gate:{streak:5}  },
  { id:"pet_stag",    name:"Saiken · Six-Tails",   rarity:"epic",      gems:0, art:"tb6", color:"#cfe3c0", gate:{streak:6} },
  { id:"pet_dragon",  name:"Chomei · Seven-Tails", rarity:"epic",  gems:0, art:"tb7", color:"#e08b2a", gate:{streak:7} },
  { id:"pet_griffin", name:"Gyuki · Eight-Tails",  rarity:"legendary", gems:0, art:"tb8", color:"#8e86c4", gate:{streak:8} },
  { id:"pet_phoenix", name:"Kurama · Nine-Tails",        rarity:"legendary", gems:0, art:"tb9", color:"#f2622a", gate:{streak:9} },
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
  id:`cape_${m.id}`, type:"cape", metal:m.id, name:`${m.name} Cloak`,
  rarity:m.rarity, gems:m.gems, gate:m.gate, color:m.color,
}));
const SHOP = [
  ...PETS.map(p=>({ id:p.id, type:"pet", name:p.name, rarity:p.rarity, gems:p.gems, gate:p.gate, art:p.art, color:p.color })),
];
const SHOP_TYPES = [["all","ALL"],["pet","SUMMONS"]];
const SPIN_GAMES = ["slot","wheel","blackjack"];
const CAT_COLORS = ["#f59e0b","#ef4444","#38bdf8","#34d399","#a78bfa","#f472b6","#fb923c","#22c55e","#e879f9","#fbbf24"];

const GEAR = [
  { slot:"headband", lvl:1, name:"Village Headband & Sandals" },
  { slot:"vest",     lvl:2, name:"Green Flak Vest" },
  { slot:"gloves",   lvl:3, name:"Gloves, Sash & Tanto" },
  { slot:"anbu",     lvl:4, name:"ANBU Mask & Black Ops Gear" },
  { slot:"cloak",    lvl:5, name:"Akatsuki Cloak" },
  { slot:"hat",      lvl:6, name:"Kage Haori & Hat" },
  { slot:"sage",     lvl:7, name:"Sage Robe & Halo" },
];

const LEVELS = [
  { lvl:0, name:"Academy Student",     unlock:"No rank yet" },
  { lvl:1, name:"Genin",               unlock:"Village headband & sandals" },
  { lvl:2, name:"Chunin",              unlock:"Green flak vest" },
  { lvl:3, name:"Jonin",               unlock:"Gloves, sash & tanto" },
  { lvl:4, name:"ANBU Black Ops",      unlock:"Porcelain mask & sleeveless armour" },
  { lvl:5, name:"Akatsuki",            unlock:"Long red-cloud cloak" },
  { lvl:6, name:"Kage",                unlock:"Kage haori & hat" },
  { lvl:7, name:"Sage of Six Paths",   unlock:"Golden robe & halo" },
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

// A single XP pool replaces the old seven attributes. Keeping it in the same
// shape means every existing reward, decay and rating path keeps working.
const XP_MAX = 36;
const INIT_CATEGORIES = [
  { id:"xp", name:"XP", icon:"🌀", color:"#e2622a", value:0, maxValue:XP_MAX },
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
  rev: 0,           // bumped on every successful save — guards against cross-device clobbering
  rival: { power:0, rate:0, tick:"", arc:1, wins:0, born:"" },
  story: { unlocked:0, last:"" },
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
  const lvl = Math.min(LEVELS.length-1, Math.floor(rating / 4.2));
  return { ...LEVELS[lvl], lvl, ratingForNext:(lvl+1)*4.2, ratingFloor:lvl*4.2 };
}
function getTitle(data, lvl) {
  return (data.customTitles && data.customTitles[lvl]) || (LEVELS[lvl] ? LEVELS[lvl].name : "");
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
  if (!["list","circles"].includes(settings.questLayout)) settings.questLayout = "list";
  if (!["last7","week"].includes(settings.questWeekView)) settings.questWeekView = "last7";
  settings.navOrder = Array.isArray(settings.navOrder)
    ? settings.navOrder.filter((v,i,a)=>NAV_ORDERABLE.includes(v) && a.indexOf(v)===i) : [];
  // Collapse any legacy multi-attribute save into the single XP pool, keeping
  // the rating the user already earned.
  {
    const cats = Array.isArray(d.categories) ? d.categories : [];
    const isPool = cats.length === 1 && cats[0] && cats[0].id === "xp";
    if (!isPool) {
      const ratio = cats.length
        ? cats.reduce((sum,c)=>sum + (Number(c.value)||0)/(Number(c.maxValue)||10), 0) / cats.length
        : 0;
      d = { ...d,
        categories: [{ id:"xp", name:"XP", icon:"🌀", color:"#e2622a",
          value: Math.max(0, Math.min(XP_MAX, ratio * XP_MAX)), maxValue: XP_MAX }],
        tasks: (d.tasks||[]).map(t=>({...t, catId:"xp"})) };
    } else {
      d = { ...d, categories:[{...cats[0], maxValue: XP_MAX}],
            tasks: (d.tasks||[]).map(t=>({...t, catId:"xp"})) };
    }
  }
  // One goal became many; fold any legacy single goal into the list.
  d = { ...d, tasks: (d.tasks||[]).map(t=>{
    let goals = Array.isArray(t.goals) ? t.goals : [];
    if (!goals.length && t.goal && t.goal.eye) goals = [t.goal];
    goals = goals.filter(g=>g && g.eye)
      .map(g=>({ eye:g.eye, days: Math.max(1, Math.min(30, parseInt(g.days)||7)) }))
      .slice(0,3);
    const { goal, ...rest } = t;
    return { ...rest, goals };
  }) };
  const chr = { ...DEFAULT_CHARACTER, ...(d.character||{}),
    equipped: { ...DEFAULT_EQUIPPED, ...((d.character||{}).equipped||{}) } };
  if (!["m","f"].includes(chr.body)) chr.body = "m";
  if (!HAIRSTYLES.some(h=>h[0]===chr.hairstyle)) chr.hairstyle = "classic";
  chr.appearLevel = (typeof chr.appearLevel === "number" && chr.appearLevel >= 0
                     && chr.appearLevel < LEVELS.length) ? chr.appearLevel : null;
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
    rev: Math.max(0, Number(d.rev)||0),
    rival: (()=>{ const r=(d.rival && typeof d.rival==="object")?d.rival:{};
      return { power:Math.max(0,Number(r.power)||0), rate:Math.max(0,Number(r.rate)||0),
               tick:typeof r.tick==="string"?r.tick:"", arc:Math.max(1,parseInt(r.arc)||1),
               wins:Math.max(0,parseInt(r.wins)||0), born:typeof r.born==="string"?r.born:"" }; })(),
    story: (()=>{ const st=(d.story && typeof d.story==="object")?d.story:{};
      return { unlocked:Math.max(0,parseInt(st.unlocked)||0), last:typeof st.last==="string"?st.last:"" }; })(),
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
  { id:"knighted", icon:"🏯", name:"Kage", desc:"Reach the highest rank", gems:25,
    check:(d)=>getLevel(getRating(d.categories||[]))>=7 },
  { id:"war_chest", icon:"📜", name:"Devoted", desc:"Log 250 quest completions", gems:20,
    check:(d)=>(d.wallet?.coinsEarned||0)>=1000 },
  { id:"gem_hoard", icon:"🌀", name:"Ascendant", desc:"Reach rating 50", gems:25,
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
  // ── THE TAILED BEASTS — each built to its own silhouette ──────────────────
  if (art && art[0]==="t" && art[1]==="b") {
    const n = parseInt(art.slice(2)) || 1;
    const P = (d,f,o) => els.push(<path key={nk()} d={d} fill={f} opacity={o===undefined?1:o}/>);
    const L = (d,st,w,o) => els.push(<path key={nk()} d={d} stroke={st} strokeWidth={w*s} fill="none"
                 strokeLinecap="round" opacity={o===undefined?1:o}/>);
    const E = (x,y,r,ic,pc) => { C(x,y,r,ic); C(x,y,r*0.4,pc||"#140e06"); };
    const Q = (x0,y0,xm,ym,x1,y1) => `M ${x0*s} ${y0*s} Q ${xm*s} ${ym*s} ${x1*s} ${y1*s}`;
    const TRI = (ax,ay,bx,by,cx2,cy2) => `M ${ax*s} ${ay*s} L ${bx*s} ${by*s} L ${cx2*s} ${cy2*s} Z`;
    // a tapering tail laid along an arc
    const arc = (i,count,len,wid,col,a0,a1) => {
      const ang = count===1 ? Math.PI*1.3 : a0 + (a1-a0)*(i/(count-1));
      const x0 = cx + Math.cos(ang)*1.3, y0 = cy-0.4 + Math.sin(ang)*1.3;
      const x1 = cx + Math.cos(ang)*len, y1 = cy-0.4 + Math.sin(ang)*len;
      const xm = cx + Math.cos(ang+0.26)*(len*0.7), ym = cy-0.4 + Math.sin(ang+0.26)*(len*0.7);
      L(Q(x0,y0,xm,ym,x1,y1), col, wid);
      return [x1,y1,ang];
    };
    const A0 = Math.PI*1.04, A1 = Math.PI*1.96;
    // the pattern: inward-curling spirals, the markings he actually wears
    const swirl = (sx,sy,rad,wid,turns) => {
      let d = "", first = true;
      for (let t=0; t<=1.001; t+=0.05) {
        const ang = t*Math.PI*2*(turns||1.5);
        const rr  = rad*(1 - t*0.80);
        const px  = (sx + Math.cos(ang)*rr)*s, py = (sy + Math.sin(ang)*rr)*s;
        d += (first ? `M ${px} ${py}` : ` L ${px} ${py}`); first = false;
      }
      els.push(<path key={nk()} d={d} stroke="#10203c" strokeWidth={wid*s} fill="none"
        strokeLinecap="round" strokeLinejoin="round"/>);
    };


    if (n===1) {            // SHUKAKU — heavy sitting tanuki, one thick segmented tail
      // the tail is a broad plume curling up behind him
      for (let i=0;i<5;i++) {
        const t=i/4, ang=Math.PI*(1.22+0.30*t), rr=2.0+2.4*t;
        const px=cx+Math.cos(ang)*rr, py=cy-0.2+Math.sin(ang)*rr;
        C(px,py,0.95-0.1*i,"#d9c89a");
        L(Q(px-0.35,py+0.1,px,py-0.3,px+0.35,py+0.1),"#3a4766",0.15,0.75);
      }
      R(cx-2.3,cy-0.6,4.6,3.2,"#d9c89a",1.7);                        // broad heavy haunches
      R(cx-1.8,cy-2.6,3.6,2.6,"#d9c89a",1.3);                        // squat shoulders/head
      P(TRI(cx-1.7,cy-2.5,cx-1.9,cy-4.0,cx-0.7,cy-2.9),"#2e3650");   // small dark ears
      P(TRI(cx+1.7,cy-2.5,cx+1.9,cy-4.0,cx+0.7,cy-2.9),"#2e3650");
      R(cx-1.3,cy+0.1,2.6,2.3,"#e4d6ab",1.1);                        // pale belly
      [[-1.9,0.4],[1.3,0.2],[-1.6,1.6],[1.1,1.5],[-0.4,-2.1],[0.9,-2.0]].forEach(([dx,dy])=>
        L(Q(cx+dx,cy+dy,cx+dx+0.45,cy+dy-0.55,cx+dx+0.8,cy+dy+0.15),"#3a4766",0.17,0.85));
      R(cx-2.6,cy+2.0,1.3,0.8,"#d9c89a",0.4); R(cx+1.3,cy+2.0,1.3,0.8,"#d9c89a",0.4);
      E(cx-0.78,cy-1.95,0.5,"#1d1710","#f0d98a");                     // black sclera, pale iris
      E(cx+0.78,cy-1.95,0.5,"#1d1710","#f0d98a");
      R(cx-1.0,cy-1.25,2.0,0.8,"#1d1710",0.3);                        // wide jagged maw
      [-0.7,-0.1,0.5].forEach(dx=> P(TRI(cx+dx,cy-1.25,cx+dx+0.2,cy-0.75,cx+dx+0.4,cy-1.25),"#efe6cf"));
    } else if (n===2) {     // MATATABI — lithe blue cat wreathed in flame, two tails
      // Both tails leave the haunches low and sweep up and outward, so they read
      // as tails rather than arms. The swirl pattern runs along them.
      [-1,1].forEach(side=>{
        const bx = cx + side*1.5, by = cy + 2.0;              // rooted at the rump
        const mx = cx + side*4.3, my = cy + 0.6;
        const tx = cx + side*4.9, ty = cy - 2.6;
        L(`M ${bx*s} ${by*s} Q ${mx*s} ${my*s} ${tx*s} ${ty*s}`,"#2f7fd8",0.72);
        P(TRI(tx-0.52, ty+0.42, tx, ty-1.32, tx+0.52, ty+0.42),"#10203c");   // centred on the tip
        swirl(cx + side*3.1, cy + 1.25, 0.46, 0.17);
        swirl(cx + side*4.45, cy - 0.85, 0.42, 0.16);
      });
      // long low cat body with four legs
      P(`M ${(cx-2.4)*s} ${(cy+2.4)*s} L ${(cx-2.1)*s} ${(cy-0.1)*s} Q ${cx*s} ${(cy-1.5)*s} ${(cx+2.1)*s} ${(cy-0.2)*s} L ${(cx+2.4)*s} ${(cy+2.4)*s} Z`,"#2f7fd8");
      [-2.0,-0.8,0.45,1.6].forEach(dx=>{
        R(cx+dx,cy+1.3,0.78,1.9,"#2f7fd8",0.3);          // legs, same blue as the body
        R(cx+dx-0.06,cy+3.0,0.9,0.5,"#10203c",0.22);     // dark paw
      });
      R(cx-1.7,cy-2.9,3.0,2.5,"#2f7fd8",1.0);                        // head
      P(TRI(cx-1.7,cy-2.7,cx-2.2,cy-4.7,cx-0.6,cy-3.1),"#2f7fd8");   // tall ears
      P(TRI(cx+1.3,cy-2.7,cx+1.8,cy-4.7,cx+0.2,cy-3.1),"#2f7fd8");
      P(TRI(cx-1.55,cy-3.0,cx-1.9,cy-4.2,cx-0.9,cy-3.2),"#10203c");
      P(TRI(cx+1.15,cy-3.0,cx+1.5,cy-4.2,cx+0.5,cy-3.2),"#10203c");
      // flank, haunch and shoulder
      swirl(cx-1.35, cy+0.85, 0.95, 0.34, 1.6);
      swirl(cx+1.30, cy+0.80, 0.95, 0.34, 1.6);
      swirl(cx-0.05, cy+1.55, 0.72, 0.30, 1.5);
      swirl(cx+0.55, cy-0.05, 0.62, 0.28, 1.4);
      swirl(cx-1.75, cy-0.05, 0.55, 0.26, 1.3);
      // down the legs
      swirl(cx-1.62, cy+2.15, 0.42, 0.22, 1.2);
      swirl(cx+1.98, cy+2.15, 0.42, 0.22, 1.2);
      // and on each cheek, so the pattern carries onto the head
      swirl(cx-1.15, cy-1.55, 0.58, 0.26, 1.4);
      swirl(cx+0.85, cy-1.55, 0.58, 0.26, 1.4);
      // narrow slanted eyes under heavy brows
      P(`M ${(cx-1.35)*s} ${(cy-2.35)*s} L ${(cx-0.25)*s} ${(cy-2.05)*s} L ${(cx-0.35)*s} ${(cy-1.7)*s} L ${(cx-1.4)*s} ${(cy-1.95)*s} Z`,"#f6e05a");
      P(`M ${(cx+1.0)*s} ${(cy-2.35)*s} L ${(cx-0.1)*s} ${(cy-2.05)*s} L ${cx*s} ${(cy-1.7)*s} L ${(cx+1.05)*s} ${(cy-1.95)*s} Z`,"#4fd06a");
      R(cx-1.0,cy-2.15,0.32,0.42,"#141019",0.05);
      R(cx+0.5,cy-2.15,0.32,0.42,"#141019",0.05);
      P(`M ${(cx-1.5)*s} ${(cy-2.7)*s} L ${(cx-0.2)*s} ${(cy-2.25)*s} L ${(cx-0.25)*s} ${(cy-2.5)*s} L ${(cx-1.5)*s} ${(cy-2.95)*s} Z`,"#10203c");
      P(`M ${(cx+1.15)*s} ${(cy-2.7)*s} L ${(cx-0.15)*s} ${(cy-2.25)*s} L ${(cx-0.1)*s} ${(cy-2.5)*s} L ${(cx+1.15)*s} ${(cy-2.95)*s} Z`,"#10203c");
      C(cx-0.2,cy-1.5,0.2,"#6b5a4a");                                // nose
      // a snarl, wider at the fangs
      P(`M ${(cx-0.95)*s} ${(cy-1.25)*s} L ${(cx+0.6)*s} ${(cy-1.25)*s} L ${(cx+0.25)*s} ${(cy-0.55)*s} L ${(cx-0.6)*s} ${(cy-0.55)*s} Z`,"#8a1f28");
      P(TRI(cx-0.95,cy-1.25,cx-0.72,cy-0.62,cx-0.5,cy-1.25),"#ffffff");
      P(TRI(cx+0.15,cy-1.25,cx+0.38,cy-0.62,cx+0.6,cy-1.25),"#ffffff");
    } else if (n===3) {     // ISOBU — grey turtle, maroon shell, one red eye
      for (let i=0;i<3;i++) { const [x1,y1]=arc(i,3,4.2,0.78,"#8d9aa4",A0,A1); C(x1,y1,0.4,"#6f7d88"); }
      R(cx-2.4,cy-1.6,4.8,3.8,"#7d2b38",2.0);                        // maroon shell
      P(`M ${(cx-2.6)*s} ${(cy-0.5)*s} Q ${cx*s} ${(cy-2.9)*s} ${(cx+2.6)*s} ${(cy-0.5)*s} L ${(cx+2.2)*s} ${(cy+0.1)*s} Q ${cx*s} ${(cy-2.1)*s} ${(cx-2.2)*s} ${(cy+0.1)*s} Z`,"#aab6bf");
      [-1.8,-0.6,0.6,1.8].forEach(dx=> P(TRI(cx+dx-0.4,cy-1.2,cx+dx,cy-2.3,cx+dx+0.4,cy-1.2),"#cfd9e0"));
      R(cx-2.9,cy+1.2,1.3,0.9,"#9aa6b0",0.4); R(cx+1.6,cy+1.2,1.3,0.9,"#9aa6b0",0.4);
      R(cx-1.4,cy+0.4,2.8,2.0,"#aab6bf",0.9);                        // head
      [-0.9,0,0.9].forEach(dx=> P(TRI(cx+dx-0.3,cy+0.5,cx+dx,cy-0.4,cx+dx+0.3,cy+0.5),"#cfd9e0"));
      E(cx,cy+1.3,0.62,"#e04a3a","#2a0d0a");
    } else if (n===4) {     // SON GOKU — red ape, pale green face and belly, horns
      // two tails to each side, kept wide of the horns so all four stay readable
      [Math.PI*1.00, Math.PI*1.24, Math.PI*1.76, Math.PI*2.00].forEach(ang=>{
        const x0=cx+Math.cos(ang)*1.9, y0=cy+0.6+Math.sin(ang)*1.9;
        const x1=cx+Math.cos(ang)*5.6, y1=cy+0.6+Math.sin(ang)*5.6;
        const xm=cx+Math.cos(ang+0.20)*3.9, ym=cy+0.6+Math.sin(ang+0.20)*3.9;
        L(Q(x0,y0,xm,ym,x1,y1),"#b8311f",0.95);
        const bx=cx+Math.cos(ang)*4.7, by=cy+0.6+Math.sin(ang)*4.7;
        C(bx,by,0.44,"#d8c08a"); C(x1,y1,0.3,"#8e2416");
      });
      R(cx-2.1,cy-1.1,4.2,3.4,"#b8311f",1.3);
      R(cx-1.2,cy-0.7,2.4,2.9,"#bcd9ac",1.0);                        // pale green belly
      R(cx-2.7,cy-0.6,0.9,2.4,"#b8311f",0.5); R(cx+1.8,cy-0.6,0.9,2.4,"#b8311f",0.5);
      R(cx-2.75,cy+1.5,1.0,0.8,"#bcd9ac",0.35); R(cx+1.75,cy+1.5,1.0,0.8,"#bcd9ac",0.35);
      R(cx-1.6,cy-3.3,3.2,2.5,"#b8311f",1.0);
      R(cx-1.1,cy-2.6,2.2,1.7,"#bcd9ac",0.8);                        // pale green face
      P(`M ${(cx-1.6)*s} ${(cy-3.0)*s} Q ${(cx-2.6)*s} ${(cy-4.1)*s} ${(cx-1.1)*s} ${(cy-4.4)*s}`,"none");
      L(Q(cx-1.5,cy-3.2,cx-2.6,cy-4.1,cx-1.0,cy-4.3),"#e8d9a8",0.34);   // curved horns
      L(Q(cx+1.5,cy-3.2,cx+2.6,cy-4.1,cx+1.0,cy-4.3),"#e8d9a8",0.34);
      E(cx-0.6,cy-2.5,0.32,"#ffffff","#1b1508"); E(cx+0.6,cy-2.5,0.32,"#ffffff","#1b1508");
      R(cx-0.8,cy-1.95,1.6,0.75,"#6b1410",0.3);
      R(cx-0.65,cy-1.88,1.3,0.2,"#e8dca8",0.05);
    } else if (n===5) {     // KOKUO — white horse, head carried low
      // Tails leave the rump itself, not a point floating above the body.
      for (let i=0;i<5;i++) {
        const ang = Math.PI*(1.34 + 0.16*i);
        const bx = cx + 1.9, by = cy + 0.4;                 // anchored inside the barrel
        const x1 = bx + Math.cos(ang)*4.3, y1 = by + Math.sin(ang)*4.3;
        const xm = bx + Math.cos(ang+0.30)*2.7, ym = by + Math.sin(ang+0.30)*2.7;
        L(Q(bx,by,xm,ym,x1,y1),"#e6e8ee",0.62);
        C(x1,y1,0.3,"#c9a469");
      }
      // barrel
      R(cx-2.05,cy-1.15,4.7,2.75,"#e6e8ee",1.0);        // a level barrel, square to the legs
      [-1.6,-0.6,1.0,1.95].forEach(dx=>{
        R(cx+dx,cy+0.9,0.66,2.2,"#e6e8ee",0.22);
        R(cx+dx-0.03,cy+2.9,0.72,0.55,"#c9a469",0.18);
      });
      // neck leaving the shoulder and descending to the left
      P(`M ${(cx-1.5)*s} ${(cy-1.0)*s} L ${(cx-3.4)*s} ${(cy-1.5)*s} L ${(cx-3.7)*s} ${(cy-0.1)*s} L ${(cx-1.2)*s} ${(cy+0.3)*s} Z`,"#e6e8ee");
      // head, carried low
      P(`M ${(cx-3.25)*s} ${(cy-1.65)*s} L ${(cx-4.5)*s} ${(cy-1.4)*s} L ${(cx-4.75)*s} ${(cy+0.05)*s} L ${(cx-3.5)*s} ${(cy-0.05)*s} Z`,"#eef0f4");
      // a shorter muzzle, still angled down
      P(`M ${(cx-4.7)*s} ${(cy-0.3)*s} L ${(cx-3.7)*s} ${(cy-0.2)*s} L ${(cx-3.95)*s} ${(cy+0.95)*s} L ${(cx-4.9)*s} ${(cy+0.8)*s} Z`,"#eef0f4");
      P(`M ${(cx-4.88)*s} ${(cy+0.7)*s} L ${(cx-3.98)*s} ${(cy+0.85)*s} L ${(cx-4.12)*s} ${(cy+1.35)*s} L ${(cx-4.98)*s} ${(cy+1.2)*s} Z`,"#e2e5ec");
      C(cx-4.62,cy+1.08,0.18,"#9aa3b0");                              // nostril
      L(Q(cx-3.3,cy-1.6,cx-2.2,cy-1.45,cx-1.3,cy-1.05),"#cfd3dd",0.5,0.95);  // mane along the crest
      L(Q(cx-4.1,cy-1.5,cx-4.0,cy-3.0,cx-3.1,cy-3.6),"#c9a469",0.3);  // horns sweeping up and back
      L(Q(cx-3.4,cy-1.6,cx-2.8,cy-2.9,cx-1.9,cy-3.2),"#c9a469",0.3);
      P(TRI(cx-3.5,cy-1.6,cx-3.1,cy-2.5,cx-2.7,cy-1.4),"#eef0f4");    // ear
      E(cx-4.25,cy-0.75,0.3,"#6fb9d8","#8a2b22");
    } else if (n===6) {     // SAIKEN — pale slug, eyes on stalks, dripping
      for (let i=0;i<6;i++) { const [x1,y1]=arc(i,6,4.1,0.72,"#b9b6c9",A0,A1); C(x1,y1,0.32,"#cfccdd"); }
      R(cx-2.2,cy-0.9,4.4,3.3,"#cfccdd",1.8);                        // fat lower body
      R(cx-1.6,cy-2.9,3.2,2.4,"#cfccdd",1.4);                        // soft head blob
      L(Q(cx-0.9,cy-2.2,cx-1.5,cy-3.8,cx-1.6,cy-4.8),"#cfccdd",0.3);  // stalks rooted in the head
      L(Q(cx+0.9,cy-2.2,cx+1.5,cy-3.8,cx+1.6,cy-4.8),"#cfccdd",0.3);
      C(cx-1.62,cy-4.9,0.42,"#cfccdd"); C(cx-1.62,cy-4.9,0.33,"#17141f");
      C(cx+1.62,cy-4.9,0.42,"#cfccdd"); C(cx+1.62,cy-4.9,0.33,"#17141f");
      [[-0.9,-1.9],[-0.3,-1.85],[0.3,-1.85],[0.9,-1.9]].forEach(([dx,dy])=> C(cx+dx,cy+dy,0.17,"#8e8aa4"));
      [[-1.4,1.0],[0.2,1.4],[1.3,0.8],[-0.4,0.3]].forEach(([dx,dy])=>
        L(Q(cx+dx,cy+dy,cx+dx,cy+dy+0.5,cx+dx+0.1,cy+dy+0.9),"#b2aec4",0.16,0.9));
    } else if (n===7) {     // CHOMEI — grey beetle, six orange leaf wings + tail
      for (let i=0;i<7;i++) {
        const ang = A0 + (A1-A0)*(i/6);
        const bx = cx + Math.cos(ang)*1.2, by = cy-0.4 + Math.sin(ang)*1.2;
        const tx = cx + Math.cos(ang)*4.6, ty = cy-0.4 + Math.sin(ang)*4.6;
        const px = cx + Math.cos(ang+0.26)*3.0, py = cy-0.4 + Math.sin(ang+0.26)*3.0;
        const qx = cx + Math.cos(ang-0.26)*3.0, qy = cy-0.4 + Math.sin(ang-0.26)*3.0;
        P(`M ${bx*s} ${by*s} Q ${px*s} ${py*s} ${tx*s} ${ty*s} Q ${qx*s} ${qy*s} ${bx*s} ${by*s} Z`,"#e2762a");
        L(`M ${bx*s} ${by*s} L ${tx*s} ${ty*s}`,"#e8dc8a",0.14,0.9);
      }
      L(Q(cx,cy+2.0,cx+0.9,cy+3.4,cx-0.3,cy+4.1),"#8fbf5a",0.26,0.8);   // trailing abdomen tip
      R(cx-0.95,cy-0.6,1.9,3.0,"#6f7a8c",0.8);                       // segmented abdomen
      [0.2,0.9,1.6].forEach(dy=> R(cx-0.95,cy+dy,1.9,0.2,"#4c5566",0.05));
      R(cx-1.2,cy-2.6,2.4,2.1,"#7d8898",0.7);                        // thorax/head
      [[-1.2,-1.4],[1.2,-1.4],[-1.3,-0.5],[1.3,-0.5]].forEach(([dx,dy])=>
        L(Q(cx+dx,cy+dy,cx+dx*1.7,cy+dy+0.2,cx+dx*2.1,cy+dy+1.0),"#5b6475",0.16));
      P(TRI(cx-0.35,cy-2.6,cx-0.1,cy-4.6,cx+0.35,cy-2.6),"#8d98a8"); // horn
      R(cx-1.05,cy-2.05,0.85,0.22,"#2a313e",0.06);     // a plated faceplate, not eyes
      R(cx+0.2, cy-2.05,0.85,0.22,"#2a313e",0.06);
      R(cx-1.0, cy-1.58,0.7,0.18,"#2a313e",0.05);
      R(cx+0.3, cy-1.58,0.7,0.18,"#2a313e",0.05);
      R(cx-0.12,cy-2.35,0.24,1.1,"#2a313e",0.05);
    } else if (n===8) {     // GYUKI — ox head, suckered tentacles
      for (let i=0;i<8;i++) {
        const ang=A0+(A1-A0)*(i/7);
        const x0=cx+Math.cos(ang)*1.4, y0=cy-0.3+Math.sin(ang)*1.4;
        const x1=cx+Math.cos(ang)*4.1, y1=cy-0.3+Math.sin(ang)*4.1;
        const xm=cx+Math.cos(ang+0.24)*2.9, ym=cy-0.3+Math.sin(ang+0.24)*2.9;
        L(Q(x0,y0,xm,ym,x1,y1),"#c87a74",0.46);
        C(x1,y1,0.28,"#ede4de"); C(xm,ym,0.18,"#ede4de");
      }
      R(cx-2.0,cy-1.0,4.0,3.2,"#c87a74",1.3);
      R(cx-1.5,cy-3.2,3.0,2.5,"#c87a74",1.0);
      P(TRI(cx-1.4,cy-3.1,cx-2.4,cy-4.8,cx-0.5,cy-3.7),"#eee6e0");
      P(TRI(cx+1.4,cy-3.1,cx+2.4,cy-4.8,cx+0.5,cy-3.7),"#eee6e0");
      C(cx-0.72,cy-2.2,0.5,"#ede4de"); C(cx+0.72,cy-2.2,0.5,"#ede4de");
      els.push(<circle key={nk()} cx={(cx-0.72)*s} cy={(cy-2.2)*s} r={0.34*s} fill="none" stroke="#1a0f0c" strokeWidth={0.17*s}/>);
      els.push(<circle key={nk()} cx={(cx+0.72)*s} cy={(cy-2.2)*s} r={0.34*s} fill="none" stroke="#1a0f0c" strokeWidth={0.17*s}/>);
      R(cx-0.45,cy-1.35,0.9,0.42,"#d8cdc6",0.2);
      R(cx-0.9,cy-0.7,1.8,0.34,"#7d3f3a",0.15);
    } else {                // KURAMA — nine-tailed fox
      for (let i=0;i<9;i++) {
        const ang=A0+(A1-A0)*(i/8);
        const x0=cx+Math.cos(ang)*1.3, y0=cy-0.2+Math.sin(ang)*1.3;
        const x1=cx+Math.cos(ang)*5.0, y1=cy-0.2+Math.sin(ang)*5.0;
        const xm=cx+Math.cos(ang+0.34)*3.3, ym=cy-0.2+Math.sin(ang+0.34)*3.3;
        const px=cx+Math.cos(ang+0.80)*4.2, py=cy-0.2+Math.sin(ang+0.80)*4.2;
        P(`M ${x0*s} ${y0*s} Q ${xm*s} ${ym*s} ${x1*s} ${y1*s} Q ${px*s} ${py*s} ${x0*s} ${y0*s} Z`,"#ef6a22");
      }
      // low prowling body
      P(`M ${(cx-2.3)*s} ${(cy+2.3)*s} L ${(cx-2.0)*s} ${(cy-0.3)*s} Q ${cx*s} ${(cy-1.4)*s} ${(cx+2.1)*s} ${(cy-0.2)*s} L ${(cx+2.4)*s} ${(cy+2.3)*s} Z`,"#ef6a22");
      [-1.95,-0.8,0.6,1.6].forEach(dx=> R(cx+dx,cy+1.5,0.72,1.7,"#ef6a22",0.22));
      // a long lean head: a single tapering wedge, no blocky muzzle
      P(`M ${(cx+0.9)*s} ${(cy-2.7)*s} L ${(cx+1.25)*s} ${(cy-1.0)*s} L ${(cx-0.9)*s} ${(cy-0.45)*s} L ${(cx-4.4)*s} ${(cy-1.15)*s} L ${(cx-4.25)*s} ${(cy-1.85)*s} L ${(cx-1.1)*s} ${(cy-2.45)*s} Z`,"#ef6a22");
      // a single dark line for the closed mouth — no teeth
      L(Q(cx-4.1,cy-1.08,cx-2.6,cy-0.72,cx-1.15,cy-0.48),"#b84a16",0.17,0.85);
      C(cx-4.4,cy-1.5,0.24,"#2b1008");                                   // nose
      // ears, tall and swept back
      P(TRI(cx-0.6,cy-2.5,cx-1.1,cy-4.9,cx+0.4,cy-2.8),"#ef6a22");
      P(TRI(cx+0.6,cy-2.6,cx+0.7,cy-4.9,cx+1.5,cy-2.85),"#ef6a22");
      P(TRI(cx-0.68,cy-2.85,cx-0.98,cy-4.3,cx-0.08,cy-3.0),"#2b1008");
      P(TRI(cx+0.68,cy-2.95,cx+0.72,cy-4.35,cx+1.18,cy-3.05),"#2b1008");
      // a narrow slit of an eye, with the dark brow mark running back from it
      P(`M ${(cx-2.45)*s} ${(cy-1.72)*s} L ${(cx-1.35)*s} ${(cy-1.95)*s} L ${(cx-1.3)*s} ${(cy-1.6)*s} L ${(cx-2.4)*s} ${(cy-1.42)*s} Z`,"#e8333a");
      R(cx-1.95,cy-1.78,0.3,0.3,"#1b0608",0.03);
      P(`M ${(cx-2.7)*s} ${(cy-2.05)*s} L ${(cx+0.2)*s} ${(cy-2.6)*s} L ${(cx+0.15)*s} ${(cy-2.25)*s} L ${(cx-2.6)*s} ${(cy-1.8)*s} Z`,"#2b1008");
    }
  } else if (art==="slime") {
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

  // The Sage radiates
  if (has("sage",7)) {
    els.push(<circle key={k++} cx={12*s} cy={11*s} r={10.5*s} fill="url(#auraGrad)" />);
  }

  R(9,16,2.2,4.4,pants,0.5);
  R(12.8,16,2.2,4.4,pants,0.5);
  R(9,16,5.9,1.2,pants,0.4);
  if (has("headband",1)) {
    // open-toe shinobi sandals with wrapped shins
    R(8.9,18.4,2.4,1.5,"#2b3340",0.4); R(12.7,18.4,2.4,1.5,"#2b3340",0.4);
    R(8.4,19.9,3.4,1.5,"#1a2029",0.5); R(8.4,20.7,3.4,0.9,"#0f141b",0.4);
    R(12.3,19.9,3.4,1.5,"#1a2029",0.5); R(12.3,20.7,3.4,0.9,"#0f141b",0.4);
  } else {
    R(9,19.8,2.2,1.4,skin,0.6); R(12.8,19.8,2.2,1.4,skin,0.6);
  }

  const fem = cz.body === "f";
  const sage   = has("sage",7);
  const robe   = !sage && has("hat",6);
  const cloak  = !sage && !robe && has("cloak",5);
  const anbu   = !sage && !robe && !cloak && has("anbu",4);
  const vest   = !sage && !robe && !cloak && has("vest",2);
  const steel = false, leather = false;   // retired: knight plate
  let torsoColor = steel ? "#9fb0c1" : leather ? "#6b3a1f" : (level>=1 ? shirt : "#8a7a64");
  if (fem) {
    R(9.1,10.8,5.8,5.4,torsoColor,1.1);
    R(8.8,14.6,6.4,1.6,torsoColor,0.8);
    R(9.1,15.2,5.8,1.0,shade(torsoColor,-26),0.5);
  } else {
    R(8.7,10.8,6.6,5.4,torsoColor,0.9);
    R(8.7,15.2,6.6,1.0,shade(torsoColor,-26),0.5);
  }
  // ── GREEN FLAK VEST (Chunin → Jonin) ──────────────────────────────────────
  if (vest) {
    R(8.4,10.6,7.2,4.6,"#1f3b2e",0.6);
    R(8.4,10.6,7.2,0.9,"#2d5443",0.4);
    R(7.9,10.9,1.4,2.4,"#162c22",0.5);
    R(14.7,10.9,1.4,2.4,"#162c22",0.5);
    R(9.4,12.4,1.5,1.5,"#132620",0.3);
    R(13.1,12.4,1.5,1.5,"#132620",0.3);
    R(11.4,11.0,1.2,4.0,"#132620",0.3);
  }
  // ── ANBU BLACK OPS — grey plate vest, bandaged arms, shoulder guard ───────
  if (anbu) {
    R(9.0,10.4,6.0,5.0,"#9aa0a8",0.5);          // grey chest plate, narrow: arms stay bare
    R(9.0,10.4,6.0,0.8,"#b4bac2",0.3);
    R(9.3,9.6,1.3,1.4,"#9aa0a8",0.4);           // shoulder straps over bare shoulders
    R(13.4,9.6,1.3,1.4,"#9aa0a8",0.4);
    R(11.6,11.0,0.8,4.2,"#7d838b",0.25);        // centre seam
    R(9.5,13.0,1.6,1.1,"#868d95",0.3);          // chest pouches
    R(12.9,13.0,1.6,1.1,"#868d95",0.3);
    R(8.9,15.0,6.2,0.8,"#2b3038",0.3);          // dark underlayer at the waist
    R(7.7,11.6,1.1,2.6,"#6f757d",0.4);          // arm guards on bare arms
    R(15.2,11.6,1.1,2.6,"#6f757d",0.4);
  }
  // ── AKATSUKI CLOAK — full length, past the knees ──────────────────────────
  if (cloak) {
    R(7.3,10.0,9.4,9.6,"#15131b",0.9);          // the long body of it
    R(7.3,10.0,9.4,1.0,"#33303d",0.4);          // high collar
    R(11.4,10.9,1.2,8.7,"#0b090f",0.2);         // the opening
    R(7.3,19.0,9.4,0.7,"#0b090f",0.3);          // hem
    [[8.5,12.2],[13.3,13.6],[8.9,16.0],[13.0,17.4]].forEach(([x,y])=>{
      // a flat-bottomed cluster reads as a cloud; stacked circles read as a heart
      els.push(<circle key={k++} cx={(x+0.35)*s} cy={y*s} r={0.46*s} fill="#c7342a"/>);
      els.push(<circle key={k++} cx={(x+1.05)*s} cy={(y-0.18)*s} r={0.56*s} fill="#c7342a"/>);
      els.push(<circle key={k++} cx={(x+1.75)*s} cy={y*s} r={0.44*s} fill="#c7342a"/>);
      R(x+0.3,y,1.8,0.52,"#c7342a",0.22);
      els.push(<circle key={k++} cx={(x+1.0)*s} cy={(y-0.3)*s} r={0.3*s} fill="#e8604a"/>);
    });
  }
  // ── KAGE — long white haori with red trim over dark robes ─────────────────
  if (robe) {
    R(8.6,10.6,6.8,6.0,"#39405e",0.6);          // dark under-robe
    R(7.3,10.2,9.4,9.5,"#f6f3ea",0.9);          // long white haori
    R(7.3,10.2,9.4,0.85,"#c9c3b4",0.4);         // shoulder line
    R(10.7,10.5,2.6,9.2,"#39405e",0.3);         // the open front, robe showing through
    R(10.7,10.5,2.6,0.9,"#b3281f",0.3);         // collar
    // flame tongues licking up the hem
    R(7.3,18.3,9.4,1.4,"#b3281f",0.3);
    [7.8,9.4,11.0,12.6,14.2,15.6].forEach(x=> R(x,17.5,1.0,1.0,"#b3281f",0.3));
    [8.6,10.2,11.8,13.4,15.0].forEach(x=> R(x,17.9,0.8,0.7,"#d8452f",0.3));
  }
  // ── SAGE OF SIX PATHS — gold robe, magatama, halo ─────────────────────────
  if (sage) {
    els.push(<circle key={k++} cx={12*s} cy={11*s} r={11*s} fill="#ffd24a" opacity="0.16"/>);
    R(7.2,10.0,9.6,9.8,"#f7e7b8",0.9);
    R(7.2,10.0,9.6,1.1,"#e0b23a",0.4);
    R(11.4,10.9,1.2,8.9,"#d9c27f",0.2);
    R(7.2,19.2,9.6,0.6,"#e0b23a",0.3);
    [[9.5,12.2],[11.5,12.2],[13.5,12.2]].forEach(([x,y])=>
      els.push(<circle key={k++} cx={x*s} cy={y*s} r={0.5*s} fill="#8a6a16"/>));
    R(17.2,5.0,0.7,14.0,"#c9a227",0.3);          // staff
    els.push(<circle key={k++} cx={17.55*s} cy={4.4*s} r={1.2*s} fill="none" stroke="#e8c04a" strokeWidth={0.45*s}/>);
  }
  const armColor = sage ? "#f7e7b8" : robe ? "#f4f1e8" : cloak ? "#15131b"
                 : anbu ? skin : vest ? "#24402f" : (level>=1 ? shirt : skin);
  R(7.6,11.2,1.3,4.0,armColor,0.6);
  R(15.1,11.2,1.3,4.0,armColor,0.6);
  if (sage) {
    R(7.0,11.0,2.1,5.2,"#f7e7b8",0.7);                    // wide sage sleeves
    R(14.9,11.0,2.1,5.2,"#f7e7b8",0.7);
    R(7.0,15.4,2.1,0.8,"#e0b23a",0.3);
    R(14.9,15.4,2.1,0.8,"#e0b23a",0.3);
  } else if (has("gloves",3)) {
    R(7.5,14.4,1.5,1.5,"#20252e",0.5);
    R(15.0,14.4,1.5,1.5,"#20252e",0.5);
    R(7.6,14.6,1.3,0.4,"#39404e",0.2);
    R(15.1,14.6,1.3,0.4,"#39404e",0.2);
    if (level === 3) R(8.4,15.6,7.2,0.8,"#2b4a7a",0.3);   // the sash belongs to Jonin alone
  } else {
    R(7.6,14.9,1.3,1.2,skin,0.6);
    R(15.1,14.9,1.3,1.2,skin,0.6);
  }

  R(8.2,3.8,7.6,7.2,skin,1.6);
  R(8.2,10.0,7.6,1.0,shade(skin,-18),0.8);
  const helm = false;   // retired: the great helm
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
  const wornEye = (cosmetics && cosmetics.eye && eyeById(cosmetics.eye)) ? cosmetics.eye : null;
  // sclera
  R(9.9,6.8,1.4,1.8,"#ffffff",0.7);
  R(12.8,6.8,1.4,1.8,"#ffffff",0.7);
  if (wornEye && !anbu) {
    // the dojutsu is the iris, sitting inside the eye rather than replacing it
    drawEye(els, wornEye, 10.62*s, 7.78*s, 0.62*s, () => k++, true);
    drawEye(els, wornEye, 13.52*s, 7.78*s, 0.62*s, () => k++, true);
  } else {
    R(10.3,7.4,0.8,1.0,"#1c1410",0.4);
    R(13.2,7.4,0.8,1.0,"#1c1410",0.4);
  }
  // eyelids: a hood of skin across the top of each eye, with a lash line under it
  R(9.82,6.72,1.56,0.62,shade(skin,-6),0.34);
  R(12.72,6.72,1.56,0.62,shade(skin,-6),0.34);
  R(9.86,7.26,1.48,0.17,shade(skin,-62),0.06);
  R(12.76,7.26,1.48,0.17,shade(skin,-62),0.06);
  R(11.2,9.4,1.7,0.55,shade(skin,-55),0.3);

  // ── ANBU PORCELAIN MASK — animal face, hair left showing above it ─────────
  if (anbu) {
    R(8.4,4.3,7.2,5.9,"#f3ede1",1.9);                 // face plate
    R(8.4,4.3,7.2,0.7,"#fffdf6",1.1);                 // sheen
    R(8.4,9.3,7.2,0.9,"#ded5c4",1.0);                 // jaw shadow
    R(11.1,7.3,1.8,1.5,"#e7dfd0",0.7);                // muzzle
    R(11.5,7.6,1.0,0.5,"#2b2520",0.25);               // nose
    R(10.9,9.0,2.2,0.3,"#bdb3a1",0.15);               // mouth line
    els.push(<circle key={k++} cx={10.35*s} cy={6.5*s} r={0.66*s} fill="#1a1620"/>);
    els.push(<circle key={k++} cx={13.65*s} cy={6.5*s} r={0.66*s} fill="#1a1620"/>);
    els.push(<circle key={k++} cx={10.2*s}  cy={6.3*s} r={0.2*s}  fill="#ffffff"/>);
    els.push(<circle key={k++} cx={13.5*s}  cy={6.3*s} r={0.2*s}  fill="#ffffff"/>);
    R(9.0,5.2,2.6,0.5,"#c0392b",0.22);                // red sweeps over the brows
    R(8.7,5.6,0.9,0.5,"#c0392b",0.22);
    R(12.4,5.2,2.6,0.5,"#c0392b",0.22);
    R(14.4,5.6,0.9,0.5,"#c0392b",0.22);
    R(9.1,8.0,1.5,0.45,"#c0392b",0.2);                // cheek marks
    R(13.4,8.0,1.5,0.45,"#c0392b",0.2);
  }
  // ── VILLAGE HEADBAND ───────────────────────────────────────────────────────
  if (has("headband",1) && !robe && !sage) {
    R(7.9,4.6,8.2,1.7,"#15181f",0.4);
    R(10.2,4.7,3.6,1.5,"#9aa6b4",0.35);
    R(10.2,4.7,3.6,0.4,"#c3ccd8",0.2);
    R(11.3,5.1,0.6,0.7,"#4a5362",0.2);
    R(11.0,5.4,1.2,0.25,"#4a5362",0.1);
    R(15.6,5.0,0.9,3.2,"#15181f",0.3);
    R(16.2,5.6,0.7,2.6,"#1d2129",0.3);
  }
  // ── KAGE HAT ───────────────────────────────────────────────────────────────
  if (robe) {
    // wide triangular brim, peaked crown, rank plate on the front
    els.push(<path key={k++} d={`M ${12*s} ${0.6*s} L ${18.1*s} ${4.0*s} L ${5.9*s} ${4.0*s} Z`} fill="#f4f1e8"/>);
    els.push(<path key={k++} d={`M ${12*s} ${0.6*s} L ${18.1*s} ${4.0*s} L ${12*s} ${4.0*s} Z`} fill="#ddd8cb"/>);
    R(5.9,3.9,12.2,0.75,"#c9c3b4",0.3);
    els.push(<path key={k++} d={`M ${12*s} ${1.5*s} L ${15.1*s} ${3.3*s} L ${8.9*s} ${3.3*s} Z`} fill="#b3281f"/>);
    R(11.5,2.3,1.1,1.0,"#f4f1e8",0.2);
    R(7.6,4.5,8.8,0.9,"#2b2520",0.3);
  }
  // ── SAGE HALO + HORNS ──────────────────────────────────────────────────────
  if (sage) {
    els.push(<circle key={k++} cx={12*s} cy={6.5*s} r={6.6*s} fill="none" stroke="#ffd96b" strokeWidth={0.5*s} opacity="0.85"/>);
    R(7.9,4.6,8.2,1.3,"#e0b23a",0.4);
  }
  // ── TOOL POUCH + TANTO (Jonin onward) ─────────────────────────────────────
  if (level === 3) {                             // the tanto is the Jonin's alone
    const wc = weaponC ? weaponC.color : null;
    R(16.2,6.6,0.9,7.6, wc||"#dfe6ef",0.3);
    R(17.1,6.6,0.5,7.6, wc?shade(wc,30):"#aab6c4",0.3);
    R(15.8,14.1,2.6,0.8,"#1f2630",0.35);
    R(16.6,14.8,1.0,2.4,"#5a2f22",0.3);
    R(16.5,17.0,1.2,0.7,"#2b2f3a",0.3);
  }
  // Pet companion (hand-drawn, idle beside the champion)
  if (pet) {
    const petItem = SHOP.find(it=>it.id===pet);
    if (petItem && petItem.art) {
      drawPet(els, petItem.art, petItem.color, 19.2, 18.6, s*0.86, () => k++);
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
function HoldRing({ color="#ffffff", checkColor="#222", trackColor="rgba(255,255,255,0.35)", reps, target, onComplete, onShortTap, size=54, holdMs=650, icon=null }) {
  const [prog, setProg] = useState(0);
  const raf = useRef(null);
  const startT = useRef(0);
  const fired = useRef(false);
  const moved = useRef(false);      // finger travelled → this was a scroll, not a press
  const buzzed = useRef(false);     // haptic waits out the grace window
  const startXY = useRef(null);
  const boxRef = useRef(null);
  const done = reps >= target;
  const isBonus = reps > target;
  const stroke = 5;
  const r = (size - stroke*2) / 2;
  const circ = 2 * Math.PI * r;
  const GRACE_MS = 110;   // nothing lights up or buzzes before this
  const SLOP_PX  = 11;    // travel past this and we hand the gesture to the scroller
  const TAP_MS   = 400;   // a release later than this is an abandoned hold, not a tap

  const stop = () => { cancelAnimationFrame(raf.current); setProg(0); };

  const begin = (e) => {
    // No preventDefault here — that's what used to kill the page scroll.
    e.stopPropagation();
    fired.current = false; moved.current = false; buzzed.current = false;
    startXY.current = { x:e.clientX, y:e.clientY };
    startT.current = performance.now();
    const tick = (t) => {
      if (moved.current) return;
      const el = t - startT.current;
      const p = Math.min(1, el / holdMs);
      if (el > GRACE_MS) {
        if (!buzzed.current) { buzzed.current = true; try { navigator.vibrate && navigator.vibrate(8); } catch {} }
        setProg(p);
      }
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

  // Any real travel means the user is scrolling past this ring — bail out silently.
  const move = (e) => {
    if (moved.current || fired.current || !startXY.current) return;
    const dx = e.clientX - startXY.current.x, dy = e.clientY - startXY.current.y;
    if (dx*dx + dy*dy > SLOP_PX*SLOP_PX) { moved.current = true; stop(); }
  };

  const end = (e) => {
    if (e) e.stopPropagation();
    cancelAnimationFrame(raf.current);
    const el = performance.now() - startT.current;
    const scrolled = moved.current;
    moved.current = false; startXY.current = null;
    if (!fired.current && !scrolled && el < TAP_MS && onShortTap) onShortTap();
    setProg(0);
  };

  // Finger left the ring, or the browser claimed the gesture for scrolling.
  const cancel = () => { moved.current = true; startXY.current = null; stop(); };

  const ringPct = prog > 0 ? prog : (done ? 1 : Math.min(1, reps/target));
  return (
    <div ref={boxRef}
      onPointerDown={begin} onPointerMove={move} onPointerUp={end}
      onPointerLeave={cancel} onPointerCancel={cancel}
      onContextMenu={e=>e.preventDefault()} onClick={e=>{e.stopPropagation();e.preventDefault();}}
      style={{ width:size, height:size, position:"relative", flexShrink:0, cursor:"pointer",
        touchAction:"pan-y", WebkitUserSelect:"none", userSelect:"none", WebkitTouchCallout:"none",
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
          : icon
            ? <span style={{ display:"flex", flexDirection:"column", alignItems:"center", lineHeight:1 }}>
                <span style={{ fontSize:size*0.36, filter:prog>0?`drop-shadow(0 0 6px ${color})`:"none" }}>{icon}</span>
                {target > 1 && <span style={{ color:"rgba(255,255,255,0.9)", fontSize:size*0.17, fontWeight:800, marginTop:size*0.04 }}>{reps}/{target}</span>}
              </span>
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
// ── BLOCKLAND SCENE — a voxel world rendered from a deterministic heightmap ───
function BlockScene({ H }) {
  const B = 16, W = 430, cols = Math.ceil(W/B) + 1;
  const hAt   = (i)=> ((Math.sin(i*0.42) + Math.sin(i*0.19+1.7)) > 0.75 ? 1 : 0);
  const topAt = (i)=> H - (3 + hAt(i))*B;
  const idx   = Array.from({length:cols},(_,i)=>i);
  const sx = 344, sy = Math.round(H*0.17);

  const cloud = (kx,x,y,sc)=> [[0,1,3,1],[1,0,2,1],[3,1,2,1],[0,2,4,1]].map(([a,b,w,h],j)=>(
    <rect key={`${kx}${j}`} x={x+a*11*sc} y={y+b*11*sc} width={w*11*sc} height={h*11*sc} fill="#ffffff" opacity="0.82"/>
  ));
  const tree = (kx,i,th)=>(
    <g key={kx}>
      <rect x={i*B}     y={topAt(i)-B*th}      width={B}   height={B*th} fill="url(#pWood)"/>
      <rect x={(i-2)*B} y={topAt(i)-B*(th+2)}  width={B*5} height={B*2}  fill="url(#pLeaf)"/>
      <rect x={(i-1)*B} y={topAt(i)-B*(th+3)}  width={B*3} height={B}    fill="url(#pLeaf)"/>
    </g>
  );

  const grid = [];
  idx.forEach(i=>{
    const top = topAt(i);
    grid.push(<rect key={`gv${i}`} x={i*B} y={top} width="1" height={H-top} fill="#000" opacity="0.13"/>);
    for (let y=top; y<H; y+=B) grid.push(<rect key={`gh${i}-${y}`} x={i*B} y={y} width={B} height="1" fill="#000" opacity="0.13"/>);
  });

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      style={{display:"block",position:"absolute",bottom:0,left:0,right:0,pointerEvents:"none"}}>
      <defs>
        <linearGradient id="bsSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#16233d"/><stop offset="0.55" stopColor="#2f629a"/><stop offset="1" stopColor="#63a8d8"/>
        </linearGradient>
        {pxPattern("pGrass","#5d9e3c","#40782a","#7bbd52",7)}
        {pxPattern("pDirt", "#8a6141","#6b4830","#a37a55",13)}
        {pxPattern("pStone","#7b7b84","#5c5c66","#9a9aa3",21)}
        {pxPattern("pLeaf", "#3f7f2c","#2c5f1e","#55a03b",31)}
        {pxPattern("pWood", "#6d4a2c","#513620","#8a6240",41)}
      </defs>

      <rect width={W} height={H} fill="url(#bsSky)"/>

      {/* a square sun with stubby rays */}
      <g>
        {[[-1,0],[1,0],[0,-1],[0,1]].map(([dx,dy],j)=>(
          <rect key={j} x={sx+dx*29-4} y={sy+dy*29-4} width="8" height="8" fill="#fff6c0" opacity="0.45"/>
        ))}
        <rect x={sx-18} y={sy-18} width="36" height="36" fill="#ffe98a"/>
        <rect x={sx-11} y={sy-11} width="22" height="22" fill="#fffdf0"/>
      </g>

      {cloud("c1",24,Math.round(H*0.30),0.9)}
      {cloud("c2",150,Math.round(H*0.10),0.75)}
      {cloud("c3",268,Math.round(H*0.36),0.6)}

      {/* far stepped range */}
      {idx.map(i=>{ const rh=2+Math.round(2.2+2.2*Math.sin(i*0.29+0.6)); const top=H-(4+rh)*B;
        return <rect key={`r1${i}`} x={i*B} y={top} width={B} height={(4+rh)*B-3*B} fill="#4a7699" opacity="0.62"/>; })}
      {/* nearer range */}
      {idx.map(i=>{ const rh=1+Math.round(1.5+1.5*Math.sin(i*0.4+2.4)); const top=H-(3+rh)*B;
        return <rect key={`r2${i}`} x={i*B} y={top} width={B} height={(3+rh)*B-3*B} fill="#2e4c6b" opacity="0.8"/>; })}

      {tree("t1",5,3)}
      {tree("t2",22,2)}

      {/* grass / dirt / stone columns */}
      {idx.map(i=>{ const top=topAt(i); return (
        <g key={`c${i}`}>
          <rect x={i*B} y={top}     width={B} height={B}            fill="url(#pGrass)"/>
          <rect x={i*B} y={top+B}   width={B} height={B}            fill="url(#pDirt)"/>
          <rect x={i*B} y={top+B*2} width={B} height={H-(top+B*2)}  fill="url(#pStone)"/>
        </g>); })}

      {/* a little buried ore, because why not */}
      {[2,11,17,25].map(i=>{ const y=topAt(i)+B*2+4; if (y>=H-10) return null; return (
        <g key={`o${i}`}>
          <rect x={i*B+4} y={y}   width="8" height="8" fill="#63cde4"/>
          <rect x={i*B+6} y={y+2} width="4" height="4" fill="#e0fbff"/>
        </g>); })}

      {grid}
    </svg>
  );
}

function Scene({ T, height=150 }) {
  if (T.blocky) return <BlockScene H={height}/>;
  if (T.banner) {
    // A theme can supply its own artwork for the hero instead of a ridgeline.
    const stars2 = T.stars ? Array.from({length:30},(_,i)=>{
      const x = ((i*83) % 430); const y = ((i*41) % Math.max(40, height-60));
      const r = 0.5 + ((i*11)%10)/12;
      return <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.25 + ((i*7)%6)/12}/>;
    }) : null;
    return (
      <svg width="100%" height={height} viewBox={`0 0 430 ${height}`} preserveAspectRatio="xMidYMax slice"
        style={{display:"block",position:"absolute",bottom:0,left:0,right:0,pointerEvents:"none"}}>
        {stars2}
        {/* Sits high enough that your character stands in front of the line, not inside it */}
        <image href={T.banner} x="0" y={height*0.02} width="430" height={height*0.66}
          preserveAspectRatio="xMidYMid meet" style={{imageRendering:"pixelated"}}/>
      </svg>
    );
  }
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
    drawPet(els, item.art, item.color, 7.5, 8.0, 3.4, ()=>kk++);
    return <svg width="58" height="58" viewBox="0 0 51 51" style={{overflow:"visible"}}>{els}</svg>;
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
// DAILY BADGES — four ranks earned by how much of the day's quest load you clear
// ══════════════════════════════════════════════════════════════════════════════
const BADGE_TIERS = [
  { t:1, need:25,  name:"SPARK",    lore:"A quarter cleared",     base:"#b0672c", light:"#e69a52", dark:"#5f330f" },
  { t:2, need:50,  name:"TEMPERED", lore:"Half the day forged",   base:"#8fa3b8", light:"#dde7f1", dark:"#42505f" },
  { t:3, need:75,  name:"VALIANT",  lore:"Three quarters down",   base:"#e0a52a", light:"#ffd873", dark:"#7d5206" },
  { t:4, need:100, name:"FORGED",   lore:"Nothing left standing", base:"#ff8c1a", light:"#ffeab0", dark:"#9c4007" },
];
function badgeTierFor(pct) {
  if (pct == null) return 0;
  if (pct >= 100) return 4;
  if (pct >= 75)  return 3;
  if (pct >= 50)  return 2;
  if (pct >= 25)  return 1;
  return 0;
}
const BADGE_SHIELD = "M20 3.5 L34.5 8.4 V19.6 C34.5 28.4 27.8 34.6 20 36.8 C12.2 34.6 5.5 28.4 5.5 19.6 V8.4 Z";

function DayBadge({ tier, size=32, earned=true, pulse=false }) {
  const b = BADGE_TIERS[tier-1];
  if (!b) return null;
  const id = `bdg${tier}`;
  const rivet = (x,y)=><circle key={`${x}-${y}`} cx={x} cy={y} r="1.05" fill={b.light} opacity="0.85"/>;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{
      display:"block", overflow:"visible",
      opacity: earned ? 1 : 0.22,
      filter: earned
        ? `drop-shadow(0 0 ${tier>=4?8:tier>=3?5:3}px ${b.base}bb)`
        : "grayscale(1) brightness(0.6)",
      animation: (earned && pulse && tier===4) ? "glowPulse 1.8s ease-in-out infinite" : "none",
    }}>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={b.light}/>
          <stop offset="0.48" stopColor={b.base}/>
          <stop offset="1" stopColor={b.dark}/>
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5"/>
          <stop offset="0.42" stopColor="#ffffff" stopOpacity="0.05"/>
          <stop offset="1" stopColor="#000000" stopOpacity="0.26"/>
        </linearGradient>
        <radialGradient id={`${id}c`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff"/>
          <stop offset="0.55" stopColor={b.light}/>
          <stop offset="1" stopColor={b.base} stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* RANK 4 — radiant crown of rays */}
      {tier===4 && (
        <g opacity="0.9">
          {[0,30,60,90,120,150,180,210,240,270,300,330].map(ang=>(
            <rect key={ang} x="19.35" y="-2.4" width="1.3" height="5.4" rx="0.65"
              fill={b.light} transform={`rotate(${ang} 20 20)`}/>
          ))}
        </g>
      )}

      {/* RANK 3+ — laurel sprigs flanking the shield */}
      {tier>=3 && (
        <g fill="none" stroke={b.light} strokeWidth="1.3" strokeLinecap="round" opacity="0.75">
          <path d="M3.6 16.5 C1.4 21.5 2.4 27.5 5.8 31.2"/>
          <path d="M36.4 16.5 C38.6 21.5 37.6 27.5 34.2 31.2"/>
        </g>
      )}

      {/* the shield plate */}
      <path d={BADGE_SHIELD} fill={`url(#${id}f)`} stroke={b.dark} strokeWidth="1.7"/>
      <path d={BADGE_SHIELD} fill={`url(#${id}g)`}/>

      {/* RANK 2+ — riveted rim */}
      {tier>=2 && <g>{rivet(20,6.6)}{rivet(9.4,10.6)}{rivet(30.6,10.6)}</g>}
      {tier>=3 && <g>{rivet(7.6,21)}{rivet(32.4,21)}</g>}

      {/* ── RANK 1 · a single lightning bolt ── */}
      {tier===1 && (
        <path d="M23.6 10.5 L13.2 23.2 H18.6 L16.4 30.6 L26.6 17.6 H21.2 Z"
          fill="#fff6e8" stroke={b.dark} strokeWidth="0.9" strokeLinejoin="round"/>
      )}

      {/* ── RANK 2 · an upright blade ── */}
      {tier===2 && (
        <g stroke={b.dark} strokeWidth="0.9" strokeLinejoin="round">
          <path d="M20 9.2 L22.4 14.2 V24.4 H17.6 V14.2 Z" fill="#f4f9ff"/>
          <rect x="14.4" y="24.4" width="11.2" height="2.5" rx="1.1" fill={b.light}/>
          <rect x="18.9" y="26.9" width="2.2" height="3.6" fill={b.light}/>
          <circle cx="20" cy="31.4" r="1.6" fill={b.light}/>
        </g>
      )}

      {/* ── RANK 3 · crossed blades ── */}
      {tier===3 && (
        <g>
          {[-34,34].map(ang=>(
            <g key={ang} transform={`rotate(${ang} 20 22)`} stroke={b.dark} strokeWidth="0.85" strokeLinejoin="round">
              <path d="M20 8.6 L22.1 13.2 V27 H17.9 V13.2 Z" fill="#f4f9ff"/>
              <rect x="14.6" y="27" width="10.8" height="2.3" rx="1" fill={b.light}/>
              <rect x="19" y="29.3" width="2" height="3" fill={b.light}/>
            </g>
          ))}
        </g>
      )}

      {/* ── RANK 4 · a white-hot flame under a crown ── */}
      {tier===4 && (
        <g>
          <path d="M12.6 12.4 L15.4 15.6 L17.6 10.6 L20 14.4 L22.4 10.6 L24.6 15.6 L27.4 12.4 L26.2 18.2 H13.8 Z"
            fill="#fff3cf" stroke={b.dark} strokeWidth="0.8" strokeLinejoin="round"/>
          <ellipse cx="20" cy="26.6" rx="7.4" ry="7.9" fill={`url(#${id}c)`} opacity="0.9"/>
          <path d="M20 17.8 C24.1 22.4 26.4 25.1 26.4 28.4 C26.4 32 23.5 34.4 20 34.4 C16.5 34.4 13.6 32 13.6 28.4 C13.6 25.1 15.9 22.4 20 17.8 Z"
            fill="#ffd257" stroke={b.dark} strokeWidth="0.85"/>
          <path d="M20 22.6 C22.5 25.6 23.6 27.2 23.6 29.2 C23.6 31.4 22 32.9 20 32.9 C18 32.9 16.4 31.4 16.4 29.2 C16.4 27.2 17.5 25.6 20 22.6 Z"
            fill="#fffbe8"/>
        </g>
      )}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// THE RIVAL — he trains every day whether you do or not.
// ══════════════════════════════════════════════════════════════════════════════
const RIVAL_NAME = "KAEDO";
const ARC_TITLES = ["the Unproven","the Relentless","the Ashen","the Undimmed","the Inevitable"];
const arcTitle = (arc) => ARC_TITLES[Math.min(ARC_TITLES.length-1, Math.max(0,(arc||1)-1))];
const arcStage = (arc) => Math.min(4, Math.max(0, (arc||1)-1));

function kaedoArtSVG(stage) {
  const A  = ["#7a3fd6","#9a3fd6","#c23fa8","#e0432f","#ffb020"][stage] || "#7a3fd6";
  const A2 = ["#2a1050","#331055","#560f42","#5c1208","#6b3d04"][stage] || "#2a1050";
  return `
<defs>
 <radialGradient id="au" cx="0.5" cy="0.55" r="0.52"><stop offset="0" stop-color="${A}" stop-opacity="0.5"/><stop offset="0.45" stop-color="${A}" stop-opacity="0.2"/><stop offset="1" stop-color="${A2}" stop-opacity="0"/></radialGradient>
 <linearGradient id="hg" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#eef0f7"/><stop offset="0.45" stop-color="#b3b9cc"/><stop offset="1" stop-color="#5e6479"/></linearGradient>
 <linearGradient id="cg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#2b2f45"/><stop offset="0.55" stop-color="#181b2a"/><stop offset="1" stop-color="#0b0d15"/></linearGradient>
 <linearGradient id="pg" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#5a6180"/><stop offset="0.5" stop-color="#343a52"/><stop offset="1" stop-color="#191d2c"/></linearGradient>
 <linearGradient id="sg" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#e8c4a2"/><stop offset="1" stop-color="#b98a66"/></linearGradient>
 <linearGradient id="kg" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="#78202e"/><stop offset="1" stop-color="#280910"/></linearGradient>
</defs>
<ellipse cx="190" cy="160" rx="165" ry="145" fill="url(#au)"/>
${[[86,246,4],[108,270,3],[272,250,4],[294,272,3],[70,206,3],[308,212,4],[128,288,3],[252,292,3]].map(([x,y,s],i)=>`<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${A}" opacity="${0.45+0.06*i}"/>`).join("")}
<path d="M190 118 L302 170 L320 294 L256 278 L190 252 L124 278 L60 294 L78 170 Z" fill="url(#kg)"/>
<path d="M190 128 L288 174 L302 288 L252 272 L190 248 Z" fill="#000" opacity="0.25"/>
<path d="M190 124 L268 160 L284 294 L96 294 L112 160 Z" fill="url(#cg)"/>
<path d="M146 152 L190 132 L234 152 L228 190 L190 170 L152 190 Z" fill="url(#pg)" stroke="#080a10" stroke-width="2"/>
<path d="M94 162 C102 142 134 138 146 152 L140 200 C118 204 98 192 94 174 Z" fill="url(#pg)" stroke="#080a10" stroke-width="2"/>
<path d="M286 162 C278 142 246 138 234 152 L240 200 C262 204 282 192 286 174 Z" fill="url(#pg)" stroke="#080a10" stroke-width="2"/>
<path d="M102 168 L138 160 M278 168 L242 160" stroke="${A}" stroke-width="3.5" opacity="0.9"/>
<path d="M190 198 L205 215 L190 246 L175 215 Z" fill="${A}"/>
<path d="M190 206 L198 216 L190 234 L182 216 Z" fill="#fff" opacity="0.5"/>
<path d="M172 116 h36 v28 h-36 z" fill="#a87a58"/>
<!-- head: longer jaw, pointed chin -->
<path d="M190 36 C219 36 237 58 237 86 C237 104 232 120 222 130 L190 142 L158 130 C148 120 143 104 143 86 C143 58 161 36 190 36 Z" fill="url(#sg)"/>
<!-- hair cap, swept back -->
<path d="M141 104 C134 56 157 26 190 26 C223 26 246 56 239 104 L233 80 C219 68 161 68 147 80 Z" fill="url(#hg)"/>
<!-- upward-swept spikes -->
<path d="M152 40 L128 8 L174 30 Z" fill="url(#hg)"/>
<path d="M176 30 L166 2 L200 24 Z" fill="url(#hg)"/>
<path d="M204 28 L218 2 L224 34 Z" fill="url(#hg)"/>
<path d="M226 38 L252 10 L238 48 Z" fill="url(#hg)"/>
<!-- long side strands -->
<path d="M144 88 L128 156 L148 146 L153 98 Z" fill="url(#hg)"/>
<path d="M236 88 L252 156 L232 146 L227 98 Z" fill="url(#hg)"/>
<!-- heavy brow shadow -->
<path d="M147 80 C165 70 215 70 233 80 L231 96 C214 84 166 84 149 96 Z" fill="#000" opacity="0.42"/>
<!-- narrow angled eyes -->
<path d="M152 88 L183 94 L181 103 L154 99 Z" fill="#100c18"/>
<path d="M228 88 L197 94 L199 103 L226 99 Z" fill="#100c18"/>
<rect x="163" y="93" width="12" height="6.5" fill="${A}"/>
<rect x="205" y="93" width="12" height="6.5" fill="${A}"/>
<rect x="167" y="93" width="3" height="6.5" fill="#07050c"/>
<rect x="210" y="93" width="3" height="6.5" fill="#07050c"/>
<!-- hard angled brows -->
<path d="M148 76 L186 88 L184 94 L147 83 Z" fill="#5e6479"/>
<path d="M232 76 L194 88 L196 94 L233 83 Z" fill="#5e6479"/>
<!-- scar across the right eye -->
<path d="M222 62 L214 116" stroke="#9c5d44" stroke-width="3.5" opacity="0.9"/>
<path d="M222 62 L214 116" stroke="#c98a6d" stroke-width="1.2" opacity="0.7"/>
<path d="M190 100 L185 114 h10 z" fill="#a8734f" opacity="0.65"/>
<!-- flat hard mouth, faint downturn -->
<path d="M173 126 L207 122" stroke="#6b3f2c" stroke-width="3.5" stroke-linecap="round"/>
<path d="M173 126 L170 122 M207 122 L210 127" stroke="#6b3f2c" stroke-width="3" stroke-linecap="round"/>
<g transform="rotate(-24 300 200)">
 <rect x="294" y="86" width="15" height="134" fill="#c6cde0"/>
 <rect x="294" y="86" width="5" height="134" fill="#ffffff" opacity="0.65"/>
 <path d="M294 86 L301.5 62 L309 86 Z" fill="#eaf0fa"/>
 <rect x="281" y="220" width="41" height="10" rx="3" fill="${A}"/>
 <rect x="297" y="230" width="9" height="26" fill="#252a3c"/>
</g>`;
}
function KaedoArt({ stage, style }) {
  return (
    <svg viewBox="0 0 380 300" style={style} preserveAspectRatio="xMidYMid meet"
      dangerouslySetInnerHTML={{ __html: kaedoArtSVG(stage) }}/>
  );
}

// Your strength is every rep you have ever actually done. Nothing else moves it.
function playerPowerOf(d) {
  let reps = 0;
  (d.tasks||[]).forEach(t=>{
    Object.values(t.completions||{}).forEach(v=>{ reps += (v===true ? 1 : (Number(v)||0)); });
  });
  return Math.round(reps * 14);
}
// What you've earned per day lately — used to keep him just barely ahead.
function recentDailyGain(d) {
  const today = new Date();
  let reps = 0;
  for (let i=0;i<14;i++) {
    const k = dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate()-i));
    (d.tasks||[]).forEach(t=>{ const v=(t.completions||{})[k]; reps += (v===true?1:(Number(v)||0)); });
  }
  return (reps * 14) / 14;
}

// ── TRANSFORMATIONS ───────────────────────────────────────────────────────────
const FORMS = [
  { n:0, at:0,     name:"SQUIRE",      aura:null,      line:"Untested." },
  { n:1, at:1200,  name:"KINDLED",     aura:"#ff8a3c", line:"Something caught." },
  { n:2, at:3600,  name:"TEMPERED",    aura:"#4fc3f7", line:"The shaking stopped." },
  { n:3, at:8000,  name:"ASCENDANT",   aura:"#b06bff", line:"The air moves around you now." },
  { n:4, at:16000, name:"RADIANT",     aura:"#ffd24a", line:"They can see you from the wall." },
  { n:5, at:32000, name:"TRANSCENDENT",aura:"#ffffff", line:"There is no one left above you." },
];
const formFor = (pw) => { let f = FORMS[0]; FORMS.forEach(x=>{ if (pw >= x.at) f = x; }); return f; };
const nextForm = (pw) => FORMS.find(x=>x.at > pw) || null;

// ── THE ARC — one chapter for each day you clear everything ────────────────────
const STORY = [
  { t:"The Notice Board", b:"You were not the only one reading it.\n\nHe stood at the far end of the board with his arms folded, silver hair catching the torchlight, and he did not look at you once. He read the same posting you did. He tore it down before you could reach for it.\n\n\"You were slow,\" he said, not unkindly. \"That's all it was.\"\n\nBy the time you found your voice he was already through the gate." },
  { t:"What He Left Behind", b:"The training yard was empty at dawn, but the dummies were splintered and the sand was churned in a wide arc, over and over, the same six steps.\n\nThe quartermaster shrugged. \"He's been here since the fourth bell.\"\n\n\"Every day?\"\n\n\"Every day you haven't.\"" },
  { t:"The First Word", b:"He caught you on the stair and looked you over like a blade he was deciding whether to buy.\n\n\"Kaedo,\" he said. \"You'll want the name. You'll be saying it a lot.\"\n\n\"Why would I say it?\"\n\n\"Because you'll be explaining to people why you're behind me.\" He shrugged. \"Or you won't. Either way, I'll be up before you tomorrow.\"" },
  { t:"The Gap", b:"There is a board in the hall where they chalk the numbers.\n\nYou stopped looking at yours weeks ago. You looked tonight. His was higher, and it had been higher long enough that someone had stopped bothering to erase the space between.\n\nSomeone had drawn a small line through the gap, the way you mark a distance on a map. A day's walk. That is all it was. A day's walk." },
  { t:"He Trains in the Rain", b:"You went to the yard expecting it empty.\n\nHe was there in it, soaked through, running the same six steps. He did not stop when he saw you. He did not speed up either. He just kept going, like the weather was a rumour he had not heard.\n\n\"You came out in this,\" he said eventually. It was not a compliment. It was a data point, and he filed it." },
  { t:"The Honest Question", b:"\"Do you ever not want to?\" you asked him.\n\nHe stopped. Actually stopped, for the first time.\n\n\"Every morning,\" he said. \"Every single one. I used to wait until I wanted to.\" He picked his sword back up. \"I was very weak for a very long time.\"" },
  { t:"Closing", b:"The chalk line got shorter.\n\nNobody announced it. The hall did not go quiet. But the quartermaster looked at the board twice, and when he caught you watching he pretended he had not.\n\nKaedo said nothing at all that week, which was its own kind of announcement." },
  { t:"The Bad Week", b:"You lost four days. It happens.\n\nHe did not gloat. That was somehow worse. He simply trained, and the gap reopened, and when you finally came back to the yard he handed you a practice blade without comment.\n\n\"You think I am angry,\" he said.\n\n\"Aren't you?\"\n\n\"I am relieved. I thought you had stopped.\"" },
  { t:"Within Reach", b:"The numbers are close enough now that people have started watching the board in the evenings.\n\nHe has noticed. He has begun rising earlier. You have begun rising earlier than that.\n\nNeither of you has said a word about it. There is nothing to say about it. There is only the yard, and the six steps, and the chalk." },
  { t:"The Duel", b:"He was waiting at the gate with two blades and no expression.\n\n\"Today,\" he said.\n\n\"Today.\"\n\nHe threw you one. \"I want you to know something before we start. I did not train to beat you.\" He set his feet. \"I trained so that beating me would be worth something.\"" },
  { t:"After", b:"You won.\n\nYou sat in the churned sand a long while afterward and it did not feel the way you thought it would. It felt quiet. It felt like a Tuesday.\n\nHe sat down next to you, breathing hard, and laughed once, a short surprised sound, like he had found money in an old coat.\n\n\"Right,\" he said. \"Again, then. From higher up.\"" },
  { t:"From Higher Up", b:"He is training again. Of course he is.\n\nThe difference is that now you know exactly what it cost him to get where he was, because you paid the same price to get there.\n\nHe is further ahead than he was when you started. He is also, for the first time, looking over his shoulder." },
];

// ══════════════════════════════════════════════════════════════════════════════
// DOJUTSU — eyes earned by holding a streak on one specific quest
// ══════════════════════════════════════════════════════════════════════════════
const EYES = [
  { id:"sharingan", name:"Sharingan" },
  { id:"mangekyo",  name:"Mangekyo" },
  { id:"byakugan",  name:"Byakugan" },
  { id:"rinnegan",  name:"Rinnegan" },
  { id:"tenseigan", name:"Tenseigan" },
  { id:"rinne",     name:"Rinne Sharingan" },
  { id:"sage",      name:"Sage Mode" },
];
const eyeById = (id) => EYES.find(e=>e.id===id) || null;

function drawEye(els, id, ex, ey, r, nk, irisOnly) {
  const C=(x,y,rr,f,o)=>els.push(<circle key={nk()} cx={x} cy={y} r={rr} fill={f} opacity={o===undefined?1:o}/>);
  const RING=(x,y,rr,st,w)=>els.push(<circle key={nk()} cx={x} cy={y} r={rr} fill="none" stroke={st} strokeWidth={w}/>);
  const P=(d,f)=>els.push(<path key={nk()} d={d} fill={f}/>);
  // a tomoe: a comma — round head with a tail curling around the pupil
  // a tomoe: a round head with a short tapering tail — kept apart so three of
  // them read as three, not one blob
  const tomoe=(ang,rr,size,col)=>{
    const a=ang*Math.PI/180;
    const hx=ex+Math.cos(a)*rr, hy=ey+Math.sin(a)*rr;
    const px=Math.cos(a+Math.PI/2), py=Math.sin(a+Math.PI/2);
    const t=a+1.05;
    P(`M ${hx+px*size*0.95} ${hy+py*size*0.95}
       L ${ex+Math.cos(t)*rr*1.02} ${ey+Math.sin(t)*rr*1.02}
       L ${hx-px*size*0.95} ${hy-py*size*0.95} Z`, col);
    C(hx,hy,size,col);
  };
  if (!irisOnly) els.push(<ellipse key={nk()} cx={ex} cy={ey} rx={r*1.12} ry={r} fill="#f6f2ea"/>);
  if (id==="sharingan") {
    C(ex,ey,r*0.92,"#c2201f"); RING(ex,ey,r*0.92,"#6b0f0e",r*0.12);
    C(ex,ey,r*0.26,"#140606");
    [90,210,330].forEach(a=>tomoe(a,r*0.58,r*0.17,"#140606"));
  } else if (id==="mangekyo") {
    C(ex,ey,r*0.92,"#c2201f"); RING(ex,ey,r*0.92,"#6b0f0e",r*0.12);
    [0,120,240].forEach(a=>{
      const t=a*Math.PI/180;
      P(`M ${ex} ${ey} L ${ex+Math.cos(t)*r*0.88} ${ey+Math.sin(t)*r*0.88}
         Q ${ex+Math.cos(t+0.9)*r*0.95} ${ey+Math.sin(t+0.9)*r*0.95}
           ${ex+Math.cos(t+1.6)*r*0.5} ${ey+Math.sin(t+1.6)*r*0.5} Z`,"#140606");
    });
    C(ex,ey,r*0.2,"#140606");
  } else if (id==="rinnegan") {
    C(ex,ey,r*0.95,"#b9a7e6");
    [0.78,0.6,0.42,0.26].forEach(f=>RING(ex,ey,r*f,"#4b3a7a",r*0.085));
    C(ex,ey,r*0.13,"#2a1f47");
  } else if (id==="byakugan") {
    C(ex,ey,r*0.95,"#ece7f2"); RING(ex,ey,r*0.95,"#c8c0d8",r*0.09);
    C(ex,ey,r*0.4,"#dcd5e8",0.85);
    [[-1,-0.55],[-1,0.45],[1,-0.55],[1,0.45]].forEach(([dx,dy])=>
      els.push(<path key={nk()} d={`M ${ex+dx*r*0.52} ${ey+dy*r*0.55} q ${dx*r*0.26} ${dy*r*0.22} ${dx*r*0.42} ${dy*r*0.05}`}
        stroke="#a99bc4" strokeWidth={r*0.085} fill="none" strokeLinecap="round"/>));
  } else if (id==="tenseigan") {
    C(ex,ey,r*0.95,"#7fd4f0");
    [0,60,120,180,240,300].forEach(a=>{
      const t=a*Math.PI/180;
      P(`M ${ex} ${ey} Q ${ex+Math.cos(t-0.3)*r*0.8} ${ey+Math.sin(t-0.3)*r*0.8}
         ${ex+Math.cos(t)*r*0.92} ${ey+Math.sin(t)*r*0.92}
         Q ${ex+Math.cos(t+0.3)*r*0.8} ${ey+Math.sin(t+0.3)*r*0.8} ${ex} ${ey} Z`,"#1b5f86");
    });
    C(ex,ey,r*0.22,"#0d3350");
  } else if (id==="sage") {      // Sage Mode — an amber toad eye with a bar pupil
    C(ex,ey,r*0.95,"#e8b531");
    RING(ex,ey,r*0.95,"#8a5f08",r*0.1);
    C(ex,ey,r*0.62,"#f5d978");
    els.push(<rect key={nk()} x={ex-r*0.62} y={ey-r*0.2} width={r*1.24} height={r*0.4} rx={r*0.08} fill="#1d1403"/>);
    els.push(<rect key={nk()} x={ex-r*0.66} y={ey-r*0.46} width={r*1.32} height={r*0.14} rx={r*0.06} fill="#f7e6a8" opacity="0.5"/>);
  } else {                       // rinne-sharingan
    C(ex,ey,r*0.95,"#c2201f");
    [0.78,0.58,0.38].forEach(f=>RING(ex,ey,r*f,"#2a0708",r*0.085));
    C(ex,ey,r*0.14,"#140606");
    [90,210,330].forEach(a=>tomoe(a,r*0.70,r*0.13,"#140606"));
    [30,150,270].forEach(a=>tomoe(a,r*0.50,r*0.11,"#140606"));
  }
  if (!irisOnly) RING(ex,ey,r*1.0,"#2b231c",r*0.09);
  return els;
}

// Keeps <meta name="theme-color"> in step with the theme. iOS paints the area
// beyond the page in a standalone PWA from this, which is why a stale manifest
// colour kept showing when you overscrolled.
function ThemeColorMeta({ color }) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    let m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute("name","theme-color"); document.head.appendChild(m); }
    m.setAttribute("content", color);
    document.documentElement.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
  }, [color]);
  return null;
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
  const [duel, setDuel] = useState(null);        // {stage:"fight"|"won", pw, rp}
  const [formUp, setFormUp] = useState(null);    // transformation overlay
  const [storyOpen, setStoryOpen] = useState(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [trialsOpen, setTrialsOpen] = useState(false);


  const [barDrag, setBarDrag] = useState(false);   // priority divider being dragged
  const barDragRef = useRef(false);
  const [barPreview, setBarPreview] = useState(null); // live position while dragging
  const barPreviewRef = useRef(null);
  const [listEdit, setListEdit] = useState(null);  // {kind:"list"|"item", listId, itemId, parentId, text}
  const [recCursor, setRecCursor] = useState({y:new Date().getFullYear(), m:new Date().getMonth()});
  const [vw, setVw] = useState(390);
  useEffect(()=>{
    const measure = () => setVw(Math.min(window.innerWidth || 390, 430));
    measure();
    window.addEventListener("resize", measure);
    return ()=>window.removeEventListener("resize", measure);
  },[]);
  useEffect(()=>{ if (detailTaskId) setWkEditCursor(dateKey()); }, [detailTaskId]);
  const [cardMenu, setCardMenu] = useState(null); // {col, cardId} for the send-to-list popover
  const [toast, setToast] = useState(null);
  const [confirmBox, setConfirmBox] = useState(null);
  const [showLevelUp, setShowLevelUp] = useState(null);
  const [editingCat, setEditingCat] = useState(null);
  const [editingTitleLvl, setEditingTitleLvl] = useState(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [currentDay, setCurrentDay] = useState(dateKey());

  // He trains every day. This catches him up for every day since you last looked.
  useEffect(()=>{
    if (!data) return;
    const todayK = currentDay;
    const R = data.rival || { power:0, rate:0, tick:"", arc:1, wins:0, born:"" };
    if (R.tick === todayK) return;
    const basePow = playerPowerOf(data);
    // First meeting: he starts a day's walk ahead.
    if (!R.born) {
      const rate = Math.max(28, Math.round(Math.max(recentDailyGain(data), 28) * 1.06));
      setData(cur=>{ const n = {...cur, rival:{ power: basePow + Math.round(rate*2.5), rate,
        tick: todayK, arc:1, wins:0, born: todayK }}; persistRaw(n); return n; });
      return;
    }
    const days = Math.max(0, Math.min(400, Math.round(
      (Date.parse(todayK+"T00:00:00") - Date.parse((R.tick||todayK)+"T00:00:00")) / 86400000)));
    if (days <= 0) { setData(cur=>{ const n={...cur, rival:{...cur.rival, tick:todayK}}; persistRaw(n); return n; }); return; }
    const rate = Math.max(28, Math.round(Math.max(recentDailyGain(data), 28) * 1.06));
    setData(cur=>{
      const cr = cur.rival || R;
      const n = {...cur, rival:{ ...cr, power: Math.round((cr.power||0) + rate*days), rate, tick: todayK }};
      persistRaw(n); return n;
    });
  }, [currentDay, data]);

  // Clear everything scheduled and the next chapter opens.
  useEffect(()=>{
    if (!data) return;
    const st = data.story || {unlocked:0,last:""};
    if (st.last === currentDay) return;
    if (st.unlocked >= STORY.length) return;
    const due = (data.tasks||[]).filter(t=>t.catId && (data.categories||[]).find(c=>c.id===t.catId)
      && !isWeekly(t) && isScheduledOn(t, currentDay));
    if (!due.length) return;
    if (due.filter(t=>isCompletedOn(t, currentDay)).length < due.length) return;
    setData(cur=>{
      const cs = cur.story || {unlocked:0,last:""};
      if (cs.last === currentDay || cs.unlocked >= STORY.length) return cur;
      const n = {...cur, story:{ unlocked: cs.unlocked+1, last: currentDay }};
      persistRaw(n); return n;
    });
  }, [currentDay, data]);

  // A quest goal pays out the moment its streak reaches the target, and the eye
  // stays yours afterwards no matter what the streak does.
  useEffect(()=>{
    if (!data) return;
    const owned = (data.wallet?.owned)||[];
    const won = [];
    const lock = (data.flags||{}).eyeLock || {};
    const unlockKeys = [];
    (data.tasks||[]).forEach(t=>{
      const st = getStreak(t);
      (t.goals||[]).forEach(g=>{
        if (!g || !g.eye || !g.days) return;
        const key = `${t.id}|${g.eye}`;
        if (lock[key]) { if (st < g.days) unlockKeys.push(key); return; }  // streak broke — goal lives again
        if (owned.includes(`eye_${g.eye}`)) return;
        if (st >= g.days) won.push(g.eye);
      });
    });
    if (unlockKeys.length) {
      setData(cur=>{
        const L = {...((cur.flags||{}).eyeLock||{})};
        unlockKeys.forEach(k=>{ delete L[k]; });
        const n = {...cur, flags:{...(cur.flags||{}), eyeLock:L}};
        persistRaw(n); return n;
      });
    }
    if (!won.length) return;
    setData(cur=>{
      const have = (cur.wallet?.owned)||[];
      const add = won.filter(e=>!have.includes(`eye_${e}`)).map(e=>`eye_${e}`);
      if (!add.length) return cur;
      const n = {...cur, wallet:{...cur.wallet, owned:[...have, ...add],
        equippedCosmetics:{...(cur.wallet.equippedCosmetics||{}), eye:(cur.wallet.equippedCosmetics||{}).eye || won[0]}}};
      persistRaw(n); return n;
    });
    const e = eyeById(won[0]);
    if (e) { toast$(`👁 ${e.name.toUpperCase()} AWAKENED`, "#e8333a");
      try { navigator.vibrate && navigator.vibrate([30,60,30,60,120]); } catch {} }
  }, [data]);

  // Crossing into a new form is an event, not a stat change. Once per form, ever.
  useEffect(()=>{
    if (!data) return;
    const f = formFor(playerPowerOf(data));
    if (f.n <= ((data.flags||{}).maxForm || 0)) return;
    setFormUp(f);
    setData(cur=>{
      if (f.n <= ((cur.flags||{}).maxForm || 0)) return cur;
      const n = {...cur, flags:{...(cur.flags||{}), maxForm:f.n},
        wallet:{...cur.wallet, gems:(cur.wallet?.gems||0) + 25 + f.n*15}};
      persistRaw(n); return n;
    });
    try { navigator.vibrate && navigator.vibrate([40,50,40,50,120]); } catch {}
  }, [data]);

  const [newTask, setNewTask] = useState({name:"",catId:"xp",goals:[],importance:5,targetReps:1,days:[1,2,3,4,5],freq:"daily",weeklyTarget:3,icon:""});
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
      revRef.current = Math.max(0, Number(loaded && loaded.rev) || 0);
      const merged = migrate(loaded);
      const { data: decayed, lost } = applyDecay(merged);
      const { wallet: decayedWallet, lostCoins } = applyCoinDecay(decayed);
      decayed.wallet = decayedWallet;
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
    // A tab left open goes stale. Re-read before it's allowed to matter.
    const onVis = () => {
      if (document.visibilityState === "visible") { setCurrentDay(dateKey()); pullIfNewer(); }
    };
    const onFocus = () => pullIfNewer();
    const poll = setInterval(()=>{ if (document.visibilityState === "visible") pullIfNewer(); }, 45000);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    return () => { clearTimeout(midnightRef.current); clearInterval(poll);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus); };
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
      setShowLevelUp({ lvl, name: getTitle(data, lvl), unlock: (LEVELS[lvl]||{}).unlock || "", gems:0 });
      if (isNewBest) {
        setData(cur=>{ const n={...cur, flags:{...(cur.flags||{}), maxLevel:lvl}}; persistRaw(n); return n; });
      }
      try { navigator.vibrate && navigator.vibrate([30,60,30,60,80]); } catch {}
      setTimeout(()=>setShowLevelUp(null), 6000);
    }
    prevLevelRef.current = lvl;
  }, [data?.categories]);

  // ── RETIRED: weekly bosses were replaced by the rival. The hook stays (hook
  //    order must never change) but it no longer judges anything.
  useEffect(() => {
    return;
    // eslint-disable-next-line no-unreachable
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
  // ── SYNC SAFETY ─────────────────────────────────────────────────────────────
  // Every save carries a revision number. Before writing we check what's on the
  // server: if another device has saved since we loaded, we ADOPT their data
  // instead of overwriting it. Losing one tap beats losing a week.
  const revRef   = useRef(0);
  const saveChain = useRef(Promise.resolve());
  const lastSyncToast = useRef(0);

  const fetchRemote = async () => {
    const res = await fetch("/api/storage", { cache:"no-store" });
    const json = await res.json();
    return (json && json.data && json.data.categories && json.data.tasks) ? json.data : null;
  };

  // Rolling on-device backups, one per day, last 5 days. Never leaves the phone.
  const SNAP_KEY = "life-rpg-snapshots";
  const saveSnapshot = (d) => {
    try {
      const day = dateKey();
      const arr = JSON.parse(localStorage.getItem(SNAP_KEY) || "[]").filter(x=>x && x.day !== day);
      arr.push({ day, at:new Date().toISOString(), data:d });
      let keep = arr.slice(-5);
      while (keep.length) {
        try { localStorage.setItem(SNAP_KEY, JSON.stringify(keep)); break; }
        catch { keep = keep.slice(1); }   // quota — drop the oldest and retry
      }
    } catch {}
  };

  const adoptRemote = (remote, rr) => {
    revRef.current = rr;
    setData(migrate(remote));
    const now = Date.now();
    if (now - lastSyncToast.current > 6000) {
      lastSyncToast.current = now;
      toast$("SYNCED FROM YOUR OTHER DEVICE", "#fb923c");
    }
  };

  const persistRaw = (d) => {
    if (!d || !d.categories || !d.tasks) return Promise.resolve();
    saveChain.current = saveChain.current.then(async () => {
      try {
        const remote = await fetchRemote();
        const rr = Number(remote && remote.rev) || 0;
        if (remote && rr > revRef.current) { adoptRemote(remote, rr); return; }
        const next = revRef.current + 1;
        const body = {...d, rev: next, savedAt: new Date().toISOString()};
        await fetch("/api/storage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        revRef.current = next;
        saveSnapshot(body);
      } catch {}
    });
    return saveChain.current;
  };

  // Pull anything newer from the server — used on resume and on a slow poll.
  const pullIfNewer = async () => {
    try {
      const remote = await fetchRemote();
      const rr = Number(remote && remote.rev) || 0;
      if (remote && rr > revRef.current) adoptRemote(remote, rr);
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
    return;   // currencies retired — quests pay XP through their own points now
    // eslint-disable-next-line no-unreachable
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
    if (preCount >= 2) toast$(`🔥 COMBO x${COMBO_MULT[preCount-1]}`, "#ff7a2e");
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
    setNewTask({name:"",catId:"xp",goals:[],importance:5,targetReps:1,days:[1,2,3,4,5],freq:"daily",weeklyTarget:3,icon:""});
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
    if (key==="shopEnabled" && !val && view==="shop") setView("dashboard");
    if (view==="casino" || view==="focus") setView("dashboard");
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
  // Rewards are XP now — they raise every attribute, so they speed up your rank.
  const grantXP = (cur, xp) => ({
    ...cur,
    categories: cur.categories.map(c=>({...c, value: Math.min(c.maxValue, c.value + xp)})),
  });
  const claimChallenge = (gems) => {
    const xp = 0.30;
    setData(cur=>{ const n={...grantXP(cur, xp), challengeClaims:{...(cur.challengeClaims||{}), [dateKey()]:true}};
      persistRaw(n); return n; });
    toast$(`CHALLENGE COMPLETE  +${xp.toFixed(2)} XP`, "#a78bfa");
    try { navigator.vibrate && navigator.vibrate([10,40,20]); } catch {}
  };
  const claimBoss = (boss) => {
    setData(cur=>{ if ((cur.bossClaims||{})[boss.wkStart]) return cur;
      const n={...grantXP(cur, boss.xp), bossClaims:{...(cur.bossClaims||{}), [boss.wkStart]:boss.id}};
      persistRaw(n); return n; });
    toast$(`⚔ BOSS SLAIN  +${boss.xp.toFixed(2)} XP`, "#ff8f5e");
    try { navigator.vibrate && navigator.vibrate([20,50,20,50,40]); } catch {}
  };
  const claimTrophy = (t) => {
    if (data.trophies && data.trophies[t.id]) return;
    setData(cur=>{ if (cur.trophies && cur.trophies[t.id]) return cur;
      const xp = Math.max(0.12, Math.min(0.70, (t.gems||10)/70));
      const n={...grantXP(cur, xp), trophies:{...(cur.trophies||{}), [t.id]:dateKey()}};
      persistRaw(n); return n; });
    toast$(`🏆 ${t.name.toUpperCase()}  +XP`, "#ffc46b");
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
  // Dojutsu aren't shop items — they're earned, so they equip on their own path.
  const setCos = (slot, val) => {
    setData(cur=>{
      const n = {...cur, wallet:{...cur.wallet,
        equippedCosmetics:{...(cur.wallet.equippedCosmetics||{}), [slot]: val}}};
      persistRaw(n); return n;
    });
    try { navigator.vibrate && navigator.vibrate(10); } catch {}
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
  // Wardrobe = your rank and the quest history that earned it.
  const resetWardrobe = () => {
    update({...data,
      categories: data.categories.map(c=>({...c, value:0})),
      tasks: data.tasks.map(t=>({...t, completions:{}, frozen:{}, createdAt: dateKey()})),
      flags: {...(data.flags||{}), maxLevel:0, maxForm:0},
      character: {...data.character, appearLevel:null},
      lastDecayDate: dateKey()});
    toast$("WARDROBE RESET — BACK TO ACADEMY STUDENT", "#fb923c");
  };
  const resetDojutsu = () => {
    setData(cur=>{
      // Any goal already satisfied is locked, so it has to be re-earned from a
      // fresh streak instead of paying out again the instant we clear it.
      const lock = {...((cur.flags||{}).eyeLock||{})};
      (cur.tasks||[]).forEach(t=>{
        const st = getStreak(t);
        (t.goals||[]).forEach(g=>{ if (g && g.eye && g.days && st >= g.days) lock[`${t.id}|${g.eye}`] = true; });
      });
      const n = {...cur,
        flags:{...(cur.flags||{}), eyeLock: lock},
        wallet:{...cur.wallet,
          owned:((cur.wallet.owned)||[]).filter(id=>!String(id).startsWith("eye_")),
          equippedCosmetics:{...(cur.wallet.equippedCosmetics||{}), eye:null}}};
      persistRaw(n); return n;
    });
    toast$("DOJUTSU RESET — RE-EARN THEM WITH A FRESH STREAK", "#fb923c");
  };
  const resetSummons = () => {
    setData(cur=>{
      const n = {...cur, wallet:{...cur.wallet,
        owned:((cur.wallet.owned)||[]).filter(id=>!String(id).startsWith("pet_")),
        pet:null}};
      persistRaw(n); return n;
    });
    toast$("SUMMONS RESET", "#fb923c");
  };
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
    update({...grantXP(data, PERFECT_DAY_XP), wallet:{...data.wallet, perfectClaimedByDay:claimed}});
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
  const toggleCollapse = (listId, itemId) => {
    mutateList(listId, l=>({...l, items:l.items.map(it=>it.id===itemId?{...it, collapsed:!it.collapsed}:it)}));
    try { navigator.vibrate && navigator.vibrate(8); } catch {}
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
      return {...l, items:l.items.map(it=>it.id===parentId?{...it, collapsed:false, children:[...(it.children||[]), {id:`i${Date.now()}`, text, done:false}]}:it)};
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
  const T = THEMES[S.theme] || THEMES.ember;   // removed themes fall back
  const cz = data.character;
  const today = currentDay;
  const todayTasks = data.tasks.filter(t=>t.catId && data.categories.find(c=>c.id===t.catId) && !isWeekly(t) && isScheduledOn(t,today));
  const weeklyHabits = data.tasks.filter(t=>t.catId && data.categories.find(c=>c.id===t.catId) && isWeekly(t));
  const todayDone = todayTasks.filter(t=>isCompletedOn(t,today)).length;
  const allDone = todayTasks.length>0 && todayDone===todayTasks.length;
  // ── THE RIVAL ───────────────────────────────────────────────────────────────
  const R          = data.rival || { power:0, rate:0, tick:"", arc:1, wins:0, born:"" };
  const playerPow  = playerPowerOf(data);
  const rivalPow   = Math.round(R.power || 0);
  const gap        = rivalPow - playerPow;
  const myForm     = formFor(playerPow);
  const upNextForm = nextForm(playerPow);
  const stage      = arcStage(R.arc);

  // Beat him and he comes back from higher up.
  const winDuel = () => {
    const pw = playerPowerOf(data);
    setData(cur=>{
      const cr = cur.rival || {};
      const arc = Math.min(99, (cr.arc||1) + 1);
      const rate = Math.round(Math.max(28, (cr.rate||28)) * 1.09);
      const cats = cur.categories.map(c=>({...c, value: Math.min(10, c.value + 0.45)}));
      const n = {...cur, categories:cats,
        wallet:{...cur.wallet, gems:(cur.wallet?.gems||0) + 40 + arc*10},
        rival:{ ...cr, power: pw + Math.round(rate*3.2), rate, arc, wins:(cr.wins||0)+1, tick: currentDay }};
      persistRaw(n); return n;
    });
    setDuel({stage:"won"});
    try { navigator.vibrate && navigator.vibrate([30,60,30,60,90]); } catch {}
  };

  // ── DAILY BADGE MATH — what share of that day's quest load got cleared ──────
  // Returns pct:null when nothing was even scheduled (a genuine rest day).
  const dayPct = (dk) => {
    let total = 0, done = 0;
    data.tasks.forEach(t=>{
      if (!t.catId || !data.categories.find(c=>c.id===t.catId)) return;
      if (isWeekly(t)) return;
      if ((t.createdAt || "0000-00-00") > dk) return;   // quest didn't exist yet
      if (!isScheduledOn(t, dk)) return;                // rest day for this quest
      total++;
      if (isCompletedOn(t, dk)) done++;
    });
    return { total, done, pct: total ? Math.round((done/total)*100) : null };
  };
  const todayPct  = todayTasks.length ? Math.round((todayDone/todayTasks.length)*100) : null;
  const todayTier = badgeTierFor(todayPct);

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
  // Exact XP drives the rank. The rounded number is only ever for display, so a
  // rank can never lag behind what you actually have.
  const xpNow  = Math.max(0, Math.min(100,
    ((data.categories[0]?.value || 0) / (data.categories[0]?.maxValue || 36)) * 100));
  const rating = getRating(data.categories);
  const tier = getTier(rating);
  const level = getLevel(xpNow);
  // You keep your rank; you can choose to wear the look of any rank you've passed.
  const wornLvl = (cz && cz.appearLevel != null && cz.appearLevel <= level.lvl)
    ? cz.appearLevel : level.lvl;
  const lvlProgress = Math.max(0, Math.min(100, ((xpNow - level.ratingFloor) / 4.2) * 100));
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
  const spinsAvail = 0;   // the casino is retired
  spinsAvailRef.current = spinsAvail;
  coinBalRef.current = coinBalance(data.wallet);
  const perfectStreak = bestPerfectStreak(data);
  const canClaimPerfect = allDone && !((data.wallet.perfectClaimedByDay||{})[today]);
  const titleItem = SHOP.find(it=>it.id===cosmetics.title);
  const nowD = new Date();
  const dateLabel = `${DAYS[nowD.getDay()]}, ${MONTHS[nowD.getMonth()].slice(0,3)} ${nowD.getDate()}`;

  // ── STYLES (glass-on-sky system) ────────────────────────────────────────────
  const BLOCK = !!T.blocky;
  const FONT = BLOCK
    ? `ui-monospace,'SF Mono',Menlo,Consolas,'Courier New',monospace`
    : `ui-rounded,'SF Pro Rounded',Nunito,-apple-system,system-ui,sans-serif`;
  const PXSHADOW = "2px 2px 0 rgba(0,0,0,0.6)";
  // Theme-aware glass tints: surfaces (cards, nav, sheets, modals) pick up the
  // active theme's hue so everything shifts together — warm-dark under Forge,
  // cool under Night, etc.
  const _gb = T.glass || "12,10,34";
  const GLASS = `rgba(${_gb},0.42)`;
  const GLASS_SOFT = `rgba(${_gb},0.30)`;
  const GLASS_HEAVY = `rgba(${_gb},0.72)`;
  const skyGradient = `linear-gradient(180deg,${T.sky[0]} 0%,${T.sky[1]} 52%,${T.sky[2]} 100%)`;
  // The app background is near-black in every theme. Subtracting a flat amount
  // left bright skies (Ember's purple) still bright, so scale the channels down
  // instead — that lands every theme on black with only a whisper of its tint.
  const dim = (hex, cap) => { try {
      const n = parseInt(String(hex).slice(1), 16);
      let r = (n>>16)&255, g = (n>>8)&255, b = n&255;
      const lum = 0.299*r + 0.587*g + 0.114*b;
      if (lum > cap) { const k = cap/lum; r=Math.round(r*k); g=Math.round(g*k); b=Math.round(b*k); }
      return `rgb(${r},${g},${b})`;
    } catch { return "#07070b"; } };
  const pageTop  = dim(T.sky[0], 10);
  const pageBase = dim(T.sky[2], 15);
  const pageBg   = `linear-gradient(180deg,${pageTop} 0%,${pageBase} 100%)`;
  const C = BLOCK ? {
    // ── BLOCKLAND SKIN ────────────────────────────────────────────────────────
    app:{minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:FONT,color:TXT,letterSpacing:0.3,
      textShadow:PXSHADOW,paddingBottom:"calc(env(safe-area-inset-bottom, 0px) + 116px)",position:"relative"},
    header:{padding:"calc(env(safe-area-inset-top, 0px) + 14px) 16px 10px",position:"sticky",top:0,zIndex:5,
      background:`linear-gradient(180deg,${BLK.ink}f2,${BLK.ink}00)`},
    glass:{backgroundColor:BLK.panel,backgroundImage:TEX_STONE,...PX,...bevelUp(BLK.panelL,BLK.panelD,3),
      padding:"14px 15px",marginBottom:11,boxShadow:"0 4px 0 rgba(0,0,0,0.45)"},
    label:{fontSize:10.5,letterSpacing:1.4,color:"#b9b9c4",marginBottom:9,fontWeight:700,textTransform:"uppercase",textShadow:PXSHADOW},
    input:{backgroundColor:BLK.ink,backgroundImage:TEX_DEEP,...PX,...bevelIn(BLK.slotL,BLK.slotD,3),
      padding:"12px 13px",color:TXT,fontSize:14,width:"100%",boxSizing:"border-box",fontFamily:FONT,fontWeight:700,outline:"none",textShadow:PXSHADOW},
    select:{backgroundColor:BLK.ink,backgroundImage:TEX_DEEP,...PX,...bevelIn(BLK.slotL,BLK.slotD,3),
      padding:"12px 13px",color:TXT,fontSize:14,width:"100%",boxSizing:"border-box",fontFamily:FONT,fontWeight:700,outline:"none",WebkitAppearance:"none",textShadow:PXSHADOW},
    btn:{backgroundColor:BLK.btn,backgroundImage:TEX_BTN,...PX,...bevelUp(BLK.btnL,BLK.btnD,3),
      color:"#ffffff",padding:"12px 18px",fontSize:12.5,cursor:"pointer",fontFamily:FONT,fontWeight:700,
      letterSpacing:1,textShadow:PXSHADOW,boxShadow:"0 4px 0 rgba(0,0,0,0.4)"},
    btnSm:{backgroundColor:BLK.slot,backgroundImage:TEX_SLOT,...PX,...bevelUp(BLK.slotL,BLK.slotD,2),
      color:TXT,padding:"9px 13px",fontSize:11,cursor:"pointer",fontFamily:FONT,fontWeight:700,letterSpacing:0.8,textShadow:PXSHADOW},
    // the hotbar
    nav:{position:"fixed",bottom:"calc(env(safe-area-inset-bottom, 0px) + 8px)",left:"50%",transform:"translateX(-50%)",
      width:"calc(100% - 16px)",maxWidth:414,backgroundColor:BLK.panel,backgroundImage:TEX_STONE,...PX,
      ...bevelUp(BLK.panelL,BLK.panelD,3),display:"flex",justifyContent:"space-around",padding:"5px 4px",zIndex:10,
      boxShadow:"0 5px 0 rgba(0,0,0,0.5)"},
    navBtn:a=>({backgroundColor:a?"#5a5a66":BLK.slot,backgroundImage:a?"none":TEX_SLOT,...PX,
      ...(a?bevelUp("#9d9daa","#33333c",2):bevelIn(BLK.slotL,BLK.slotD,2)),
      color:a?"#ffffff":"rgba(255,255,255,0.5)",fontSize:6.5,fontWeight:700,cursor:"pointer",fontFamily:FONT,
      display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"5px 3px",letterSpacing:0.3,textShadow:PXSHADOW}),
    dayBtn:on=>({width:38,height:38,...(on?bevelUp(BLK.btnL,BLK.btnD,2):bevelIn(BLK.slotL,BLK.slotD,2)),
      backgroundColor:on?BLK.btn:BLK.slot,backgroundImage:on?TEX_BTN:TEX_SLOT,...PX,
      color:on?"#fff":DIM,fontSize:10,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",textShadow:PXSHADOW}),
    modal:{position:"fixed",inset:0,background:"rgba(0,0,0,0.62)",zIndex:900,display:"flex",alignItems:"flex-end",justifyContent:"center"},
    sheet:{backgroundColor:BLK.panel,backgroundImage:TEX_STONE,...PX,...bevelUp(BLK.panelL,BLK.panelD,4),
      borderBottom:"none",width:"100%",maxWidth:430,maxHeight:"88vh",overflowY:"auto",
      padding:"16px 18px calc(env(safe-area-inset-bottom, 0px) + 30px)"},
    chip:(on)=>({flex:1,padding:"11px 0",...(on?bevelUp(BLK.btnL,BLK.btnD,2):bevelIn(BLK.slotL,BLK.slotD,2)),
      backgroundColor:on?BLK.btn:BLK.slot,backgroundImage:on?TEX_BTN:TEX_SLOT,...PX,
      color:on?"#fff":DIM,fontSize:11,fontWeight:700,cursor:"pointer",textAlign:"center",fontFamily:FONT,letterSpacing:0.6,textShadow:PXSHADOW}),
    sectionTitle:{fontSize:14,fontWeight:700,color:TXT,letterSpacing:1.2,textTransform:"uppercase",textShadow:"2px 2px 0 #000"},
  } : {
    app:{minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:FONT,color:TXT,paddingBottom:"calc(env(safe-area-inset-bottom, 0px) + 110px)",position:"relative",background:pageBg},
    header:{padding:"calc(env(safe-area-inset-top, 0px) + 14px) 18px 10px",position:"sticky",top:0,zIndex:5,background:`linear-gradient(180deg,${pageTop} 55%,transparent 100%)`},
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
  // Solid quiet plate behind small artwork in Blockland — keeps the dithered
  // stone from competing with the badge detail. Null on every other theme.
  const plate = (lit, col, w=2) => BLOCK ? ({
    backgroundColor: lit ? BLK.plateLit : BLK.plate,
    backgroundImage: "none",
    ...bevelIn(lit ? (col || BLK.btnL) : BLK.slotL, BLK.slotD, w),
  }) : null;

  // Home and More are pinned; everything between them is yours to arrange.
  const NAV_DEFS = {
    tasks: { icon:"⚔",  label:"QUESTS",  on: S.questsEnabled !== false },
    boss:  { icon:"🔥", label:"RIVAL",   on: S.bossEnabled   !== false },
    plan:  { icon:"🗓", label:"PLAN",    on: S.planEnabled   !== false },
    board: { icon:"🧮", label:"BOARD",   on: !!S.kanbanEnabled },
    shop:  { icon:"🦊", label:"SUMMONS", on: !!S.shopEnabled },
    stats: { icon:"🪵", label:"ASCENT",  on: S.statsEnabled  !== false },
  };
  const navOrder = (()=>{
    const saved = Array.isArray(S.navOrder) ? S.navOrder.filter(v=>NAV_ORDERABLE.includes(v)) : [];
    return [...saved, ...NAV_ORDERABLE.filter(v=>!saved.includes(v))];
  })();
  const moveNav = (v, dir) => {
    const arr = [...navOrder];
    const i = arr.indexOf(v), j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setSetting("navOrder", arr);
    try { navigator.vibrate && navigator.vibrate(8); } catch {}
  };
  const navItems = [
    { v:"dashboard", icon:"⛰", label:"HOME" },
    ...navOrder.filter(v=>NAV_DEFS[v] && NAV_DEFS[v].on).map(v=>({ v, ...NAV_DEFS[v] })),
    { v:"settings", icon:"⚙", label:"MORE" },
  ];
  const isActive=(v)=>view===v||(view==="addTask"&&v==="tasks")||(view==="editTask"&&v==="tasks")||(view==="forecast"&&v==="tasks")||(view==="record"&&v==="stats")||(view==="design"&&v==="settings");

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
                <span style={{color:diffColor(task.importance)}}>{diffShort(task.importance)}</span>
                {(task.goals||[]).length > 0 && <span style={{marginLeft:5}}>👁{(task.goals||[]).length>1?(task.goals||[]).length:""}</span>}
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
    <div style={C.app} className={BLOCK ? "blockmode" : ""}>
      {/* One rule squares off every corner in the app when Blockland is active,
          so cards, rings, chips and sheets all become blocks without touching
          six thousand lines of inline styles. */}
      {BLOCK && <style>{`
        .blockmode *, .blockmode *::before, .blockmode *::after { border-radius: 0 !important; }
        .blockmode * { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
        .blockmode img { image-rendering: pixelated; }
        .blockmode input, .blockmode button, .blockmode select { letter-spacing: 0.5px; }
      `}</style>}
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
      {/* iOS can hold a stale composited layer for a fixed background when the
          theme changes. Painting the body as well, and remounting on theme
          change, forces it to repaint. */}
      <style>{`html,body{background:${BLOCK ? "#14141a" : pageBase};}`}</style>
      {/* In a standalone PWA iOS paints the overscroll area from theme-color, which
          still held the colour baked into the manifest. Keep it with the theme. */}
      <ThemeColorMeta color={BLOCK ? "#14141a" : pageBase}/>
      {/* Blockland still wants its dithered stone; every other theme is a flat
          near-black painted on the container above, so nothing can go stale. */}
      {BLOCK && <div key="bg-block" style={{position:"fixed",inset:0,zIndex:0,
        background:"#14141a",backgroundImage:TEX_DEEP,backgroundSize:"64px 64px",
        imageRendering:"pixelated"}}/>}

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
            <div style={{fontSize:16,fontWeight:800,color:"#fcd34d",marginTop:4}}>+{PERFECT_DAY_XP.toFixed(2)} XP</div>
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
                : confirmBox.type==="resetAllQuests" ? "⚠ RESET ALL QUESTS"
                : confirmBox.type==="resetWardrobe" ? "⚠ RESET WARDROBE"
                : confirmBox.type==="resetDojutsu" ? "⚠ RESET DOJUTSU"
                : confirmBox.type==="resetSummons" ? "⚠ RESET SUMMONS" : "⚠ CONFIRM DELETE"}
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
                : confirmBox.type==="resetWardrobe"
                ? <>Drop back to <span style={{color:BAD,fontWeight:900}}>Academy Student</span>. This wipes your XP and the completion history of every quest, so the whole rank ladder starts over. Your quests, summons and dojutsu are <span style={{color:GOOD,fontWeight:900}}>kept</span>.</>
                : confirmBox.type==="resetDojutsu"
                ? <>Lose <span style={{color:BAD,fontWeight:900}}>every awakened eye</span> and start their goals again? Nothing else is touched.</>
                : confirmBox.type==="resetSummons"
                ? <>Release <span style={{color:BAD,fontWeight:900}}>every tailed beast</span> you've earned? You'll need the streaks again. Nothing else is touched.</>
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
                  else if (confirmBox.type==="resetWardrobe") resetWardrobe();
                  else if (confirmBox.type==="resetDojutsu") resetDojutsu();
                  else if (confirmBox.type==="resetSummons") resetSummons();
                  setConfirmBox(null);
                }}>
                {confirmBox.type==="resetWardrobe" ? "ERASE MY PROGRESS"
                  : confirmBox.type==="resetDojutsu" ? "RESET EYES ONLY"
                  : confirmBox.type==="resetSummons" ? "RESET BEASTS ONLY"
                  : confirmBox.type && confirmBox.type.startsWith("reset") ? "RESET" : "DELETE"}
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
              </div>
              {/* DAILY BADGE RACK — floats beside the character, tap for the full record */}
              <div onClick={()=>setView("record")}
                style={{position:"absolute",left:10,bottom:14,display:"flex",flexDirection:"column-reverse",
                  gap:5,alignItems:"center",cursor:"pointer"}}>
                <div style={{fontSize:8.5,fontWeight:900,letterSpacing:0.8,marginTop:1,
                  color: todayPct==null ? FAINT : todayTier>0 ? BADGE_TIERS[todayTier-1].light : "rgba(255,255,255,0.6)",
                  textShadow:"0 1px 6px rgba(0,0,0,0.7)",
                  ...(BLOCK ? {background:"rgba(10,16,10,0.85)",padding:"2px 6px",width:36,
                    boxSizing:"border-box",textAlign:"center"} : {})}}>
                  {todayPct==null ? "REST" : `${todayPct}%`}
                </div>
                {BADGE_TIERS.map(bt=>{
                  const got = todayPct!=null && todayPct>=bt.need;
                  const art = <DayBadge tier={bt.t} size={BLOCK?26:30} earned={got} pulse/>;
                  if (!BLOCK) return <div key={bt.t}>{art}</div>;
                  return (
                    <div key={bt.t} style={{width:36,height:36,display:"flex",alignItems:"center",
                      justifyContent:"center",...plate(got, bt.light)}}>{art}</div>
                  );
                })}
              </div>
              <div style={{position:"absolute",bottom:6,left:"50%",transform:"translateX(-50%)"}}>
                {myForm.aura && (
                  <div style={{position:"absolute",left:"50%",top:"52%",transform:"translate(-50%,-50%)",
                    width:160,height:160,borderRadius:"50%",pointerEvents:"none",
                    background:`radial-gradient(circle, ${myForm.aura}5e 0%, ${myForm.aura}22 42%, transparent 70%)`,
                    animation:"forgeGlow 2.4s ease-in-out infinite"}}/>
                )}
                <PixelCharacter level={wornLvl} character={cz} scale={4.6} idle cosmetics={cosmetics} pet={pet}/>
              </div>
              <div onClick={()=>setView("boss")}
                style={{position:"absolute",right:10,bottom:14,textAlign:"right",cursor:"pointer"}}>
                <div style={{fontSize:8,fontWeight:900,letterSpacing:1.2,color:FAINT,
                  textShadow:"0 1px 6px rgba(0,0,0,0.8)"}}>VS KAEDO</div>
                <div style={{fontSize:19,fontWeight:900,lineHeight:1.05,
                  color: myForm.aura || "#fff", textShadow:`0 0 14px ${myForm.aura||"#000"}aa, 0 1px 6px rgba(0,0,0,0.9)`}}>
                  {playerPow.toLocaleString()}
                </div>
                <div style={{fontSize:8,fontWeight:900,letterSpacing:1,color:gap>0?"#ff8a7a":GOOD,
                  textShadow:"0 1px 6px rgba(0,0,0,0.8)"}}>{gap>0 ? `${gap.toLocaleString()} BEHIND` : "AHEAD"}</div>
              </div>
            </div>

            <div style={{padding:"0 16px"}}>
              {/* LEVEL PROGRESS */}
              <div style={{...C.glass,padding:"13px 16px"}}>
                <div style={{height:11,background:"rgba(0,0,0,0.3)",borderRadius:6,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${level.lvl>=LEVELS.length-1?100:lvlProgress}%`,background:"linear-gradient(90deg,rgba(255,255,255,0.75),#ffffff)",borderRadius:6,boxShadow:"0 0 12px rgba(255,255,255,0.6)",transition:"width .6s ease"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:DIM,marginTop:6,fontWeight:800}}>
                  <span>{xpNow.toFixed(1)} XP</span>
                  {level.lvl < LEVELS.length-1
                    ? <span style={{color:"#fff"}}>
                        {(level.ratingForNext - xpNow).toFixed(1)} XP to {getTitle(data, level.lvl+1)}
                      </span>
                    : <span style={{color:T.accent}}>HIGHEST RANK</span>}
                  <span>{level.lvl>=LEVELS.length-1?"MAX":level.ratingForNext.toFixed(1)}</span>
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
                  <div onClick={()=>setTrialsOpen(true)}
                    style={{...C.glass, border:`1.5px solid ${claimed?LINE:`${T.accent}66`}`, marginBottom:11, padding:"13px 15px", cursor:"pointer"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{fontSize:24}}>{claimed?"🏅":"🎯"}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:9,fontWeight:900,letterSpacing:1.5,color:T.accent}}>DAILY CHALLENGE · TAP FOR ALL TRIALS</div>
                        <div style={{fontSize:13.5,fontWeight:800,color:"#fff",marginTop:2}}>{label}</div>
                        <div style={{height:6,borderRadius:4,background:"rgba(0,0,0,0.3)",marginTop:8,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,borderRadius:4,background:T.accent,transition:"width .4s"}}/>
                        </div>
                      </div>
                      {claimed ? (
                        <div style={{fontSize:10,fontWeight:900,color:GOOD,whiteSpace:"nowrap"}}>DONE ✓</div>
                      ) : met ? (
                        <button onClick={e=>{e.stopPropagation(); claimChallenge(ch.gems);}} style={{...C.btn,padding:"11px 14px",fontSize:11,whiteSpace:"nowrap",animation:"glowPulse 1.6s ease-in-out infinite"}}>CLAIM +XP</button>
                      ) : (
                        <div style={{textAlign:"center",whiteSpace:"nowrap"}}>
                          <div style={{fontSize:14,fontWeight:900,color:"#fff"}}>{Math.min(progress,ch.goal)}/{ch.goal}</div>
                          <div style={{fontSize:8.5,fontWeight:800,color:DIM}}>+0.30 XP</div>
                        </div>
                      )}
                    </div>
                    {comboHot && (
                      <div style={{fontSize:9.5,fontWeight:800,color:"#ff9a4e",marginTop:9}}>
                        🔥 MOMENTUM — you're on a roll
                      </div>
                    )}
                  </div>
                );
              })()}
              {S.bossEnabled === false ? null : (()=>{
                const caught = playerPow >= rivalPow;
                const aur = ["#7a3fd6","#9a3fd6","#c23fa8","#e0432f","#ffb020"][stage];
                return (
                  <div onClick={()=>setView("boss")} style={{...C.glass, marginBottom:11, padding:"11px 14px", cursor:"pointer",
                    display:"flex",alignItems:"center",gap:12,
                    border:`1.5px solid ${caught?T.accent:aur}66`,
                    ...(caught?{animation:"glowPulse 1.6s ease-in-out infinite"}:{})}}>
                    <div style={{width:40,height:40,borderRadius:"50%",flexShrink:0,overflow:"hidden",
                      background:`radial-gradient(circle,${aur}55,transparent 70%)`,
                      display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <KaedoArt stage={stage} style={{width:74,height:74,marginTop:14}}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:900,color:"#fff"}}>
                        {caught ? <span style={{color:T.accent}}>YOU'VE CAUGHT {RIVAL_NAME} — FIGHT HIM</span>
                                : <>{RIVAL_NAME} is <span style={{color:aur}}>{gap.toLocaleString()}</span> ahead</>}
                      </div>
                      <div style={{fontSize:9.5,color:DIM,fontWeight:700,marginTop:2}}>
                        {caught ? "he's waiting at the gate" : `he trains ${Math.round(R.rate||28)} a day · you're at ${playerPow.toLocaleString()}`}
                      </div>
                    </div>
                    <div style={{fontSize:18,color:FAINT}}>›</div>
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
                    <div style={{fontSize:10.5,fontWeight:700,color:"rgba(255,255,255,0.9)"}}>&nbsp;</div>
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
                    <div style={{fontSize:10.5,fontWeight:800,color:"#5a3600"}}>Claim your +{PERFECT_DAY_XP.toFixed(2)} XP bonus</div>
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
              {S.questLayout==="circles" ? (()=>{
                const byOrder = [...todayTasks].sort((x,y)=>(x.order??0)-(y.order??0));
                const n = byOrder.length;
                if (!n) return null;
                const prioN = Math.max(0, Math.min(n, priBarPos));
                const prio  = new Set(byOrder.slice(0,prioN).map(t=>t.id));
                // Must-dos lead, then whatever's still open, then the finished ones.
                const shown = [...byOrder].sort((x,y)=>{
                  const px = prio.has(x.id)?0:1, py = prio.has(y.id)?0:1;
                  if (px!==py) return px-py;
                  const xd = isCompletedOn(x,today)?1:0, yd = isCompletedOn(y,today)?1:0;
                  if (xd!==yd) return xd-yd;
                  return (x.order??0)-(y.order??0);
                });
                // Circles stay as large as the count allows — no paging, nothing hidden.
                const cols = n<=6 ? 2 : n<=12 ? 3 : n<=20 ? 4 : 5;
                const gap  = cols<=2 ? 20 : cols===3 ? 15 : 11;
                const cell = Math.floor((Math.min(vw,430) - 32 - gap*(cols-1)) / cols);
                const ring = Math.max(46, Math.min(118, cell - (cols<=2 ? 20 : 8)));
                const fs   = cols<=2 ? 12.5 : cols===3 ? 10.5 : 9.2;
                return (
                  <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,
                    gap:`${gap+16}px ${gap}px`,justifyItems:"center",padding:"4px 0 14px"}}>
                    {shown.map(t=>{
                      const cat    = data.categories.find(c=>c.id===t.catId);
                      const color  = t.color || cat?.color || "#8b8b96";
                      const reps   = getReps(t,today);
                      const target = t.targetReps||1;
                      const must   = prio.has(t.id);
                      const done   = reps >= target;
                      return (
                        <div key={t.id} style={{display:"flex",flexDirection:"column",alignItems:"center",
                          gap:8,width:"100%"}}>
                          <div style={{position:"relative"}}>
                            <HoldRing color={color} checkColor="#fff" trackColor="rgba(255,255,255,0.22)"
                              reps={reps} target={target} size={ring} icon={iconFor(t,cat)}
                              onComplete={(bx,by)=>{ addRep(t.id, today);
                                fireBurst(bx, by, color, S.showXP?`+${(t.points/target).toFixed(3)}`:"✦ NICE"); }}
                              onShortTap={()=>{ setDetailTaskId(t.id);
                                setCalCursor({y:new Date().getFullYear(), m:new Date().getMonth()}); }}/>
                            {must && (
                              <div style={{position:"absolute",top:-3,left:-3,background:PRI,color:"#2a1a00",
                                fontSize:10,fontWeight:900,padding:"1px 5px",borderRadius:8,
                                boxShadow:`0 0 8px ${PRI}99`,pointerEvents:"none"}}>⚑</div>
                            )}
                            <div style={{position:"absolute",bottom:-2,right:-2,
                              background:"rgba(0,0,0,0.75)",color:diffColor(t.importance),
                              fontSize:8.5,fontWeight:900,letterSpacing:0.3,padding:"1px 5px",
                              borderRadius:7,pointerEvents:"none",
                              border:`1px solid ${diffColor(t.importance)}66`}}>{diffShort(t.importance)}</div>
                            {(t.goals||[]).length > 0 && (
                              <div style={{position:"absolute",top:-3,right:-3,pointerEvents:"none",
                                background:"rgba(0,0,0,0.75)",borderRadius:9,padding:"1px 4px",
                                border:`1px solid ${T.accent}88`,display:"flex",alignItems:"center",gap:2}}>
                                <span style={{fontSize:9}}>👁</span>
                                {(t.goals||[]).length > 1 &&
                                  <span style={{fontSize:8,fontWeight:900,color:"#fff"}}>{(t.goals||[]).length}</span>}
                              </div>
                            )}
                          </div>
                          <div style={{fontSize:fs,fontWeight:800,color:"#fff",textAlign:"center",
                            lineHeight:1.2,width:"100%",wordBreak:"break-word",opacity:done?0.5:1,
                            textDecoration:done?"line-through":"none"}}>{t.name}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })() : (()=>{
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
          const wkMode = S.questWeekView==="week" ? "week" : "last7";
          const wk7 = wkMode==="week" ? weekDateKeys() : last7Keys();
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
              <div style={{display:"flex",background:"rgba(0,0,0,0.35)",borderRadius:12,padding:3,gap:2}}>
                {[["last7","Last 7"],["week","Mon–Sun"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setSetting("questWeekView",v)}
                    style={{border:"none",cursor:"pointer",fontFamily:FONT,borderRadius:9,padding:"5px 10px",
                      fontSize:10,fontWeight:900,letterSpacing:0.3,
                      background: wkMode===v ? "rgba(255,255,255,0.9)" : "transparent",
                      color: wkMode===v ? "#111" : "rgba(255,255,255,0.6)",
                      textShadow: wkMode===v ? "none" : undefined}}>{l}</button>
                ))}
              </div>
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
                      <option value="xp">🌀 XP</option>
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
                <div style={{...C.label,marginTop:16}}>ICON <span style={{color:FAINT}}>· shown on the circle view</span></div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,maxHeight:132,overflowY:"auto",
                  background:"rgba(0,0,0,0.2)",padding:8,borderRadius:BLOCK?0:14}}>
                  <input value={t.icon||""} onChange={e=>set({icon:e.target.value.slice(0,4)})}
                    placeholder="type any emoji"
                    style={{...C.input,width:140,padding:"7px 10px",fontSize:15,marginRight:4}}/>
                  <button onClick={()=>set({icon:""})}
                    style={{height:34,padding:"0 10px",borderRadius:BLOCK?0:10,cursor:"pointer",fontFamily:FONT,
                      fontSize:9.5,fontWeight:900,color:"#fff",background:"rgba(255,255,255,0.08)",
                      border:!t.icon?"2px solid #fff":"1px solid rgba(255,255,255,0.2)"}}>AUTO</button>
                  {QUEST_ICONS.map(ic=>(
                    <button key={ic} onClick={()=>set({icon:ic})}
                      style={{width:34,height:34,borderRadius:BLOCK?0:10,cursor:"pointer",fontSize:17,padding:0,
                        background:"rgba(255,255,255,0.08)",lineHeight:1,
                        border:t.icon===ic?"2px solid #fff":"1px solid rgba(255,255,255,0.2)"}}>{ic}</button>
                  ))}
                </div>
                <div style={{fontSize:9.5,color:FAINT,marginTop:6,fontWeight:700}}>Tap the box and use your keyboard's emoji key for anything not listed</div>
                {/* ── GOALS: hold a streak, awaken an eye. Up to three per quest. ── */}
                <div style={{...C.label,marginTop:16}}>GOALS <span style={{color:FAINT}}>· optional</span></div>
                {(t.goals||[]).map((g,gi)=>{
                  const e = eyeById(g.eye);
                  const have = ((data.wallet||{}).owned||[]).includes("eye_"+g.eye);
                  const cur = t.id ? getStreak(t) : 0;
                  const setGoal = (patch) => set({goals:(t.goals||[]).map((x,i)=>i===gi?{...x,...patch}:x)});
                  let q2 = 0;
                  return (
                    <div key={gi} style={{background:"rgba(0,0,0,0.2)",padding:11,borderRadius:BLOCK?0:14,marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                        <div style={{fontSize:9,fontWeight:900,letterSpacing:1,color:FAINT}}>GOAL {gi+1}</div>
                        <div style={{flex:1}}/>
                        <button onClick={()=>set({goals:(t.goals||[]).filter((_,i)=>i!==gi)})}
                          style={{...C.btnSm,padding:"5px 10px",fontSize:10,color:BAD}}>REMOVE</button>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {EYES.map(ey=>{
                          const on = g.eye===ey.id;
                          const ownedEye = ((data.wallet||{}).owned||[]).includes("eye_"+ey.id);
                          let q1 = 0;
                          return (
                            <button key={ey.id} onClick={()=>setGoal({eye:ey.id})}
                              style={{width:38,height:38,padding:0,borderRadius:BLOCK?0:10,cursor:"pointer",
                                background:"rgba(255,255,255,0.08)",position:"relative",
                                border:on?"2px solid #fff":"1px solid rgba(255,255,255,0.2)"}}>
                              <svg width="28" height="28" viewBox="0 0 28 28" style={{display:"block",margin:"0 auto"}}>
                                {drawEye([], ey.id, 14, 14, 12, ()=>q1++)}
                              </svg>
                              {ownedEye && <span style={{position:"absolute",top:-6,right:-4,fontSize:10}}>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginTop:12}}>
                        <svg width="42" height="42" viewBox="0 0 42 42" style={{flexShrink:0}}>
                          {drawEye([], g.eye, 21, 21, 18, ()=>q2++)}
                        </svg>
                        <div style={{width:92,height:72,overflow:"hidden",position:"relative",flexShrink:0,
                          borderRadius:BLOCK?0:12,background:"rgba(0,0,0,0.3)",border:`1px solid ${LINE}`}}>
                          <div style={{position:"absolute",left:-64,top:-18}}>
                            <PixelCharacter level={wornLvl===4 ? 3 : wornLvl} character={cz} scale={9}
                              cosmetics={{...cosmetics, eye:g.eye}}/>
                          </div>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:900,color:"#fff"}}>{e ? e.name : ""}</div>
                          <div style={{fontSize:9.5,color:have?GOOD:FAINT,fontWeight:800,marginTop:3}}>
                            {have ? "✓ awakened"
                                  : t.id ? `${cur} / ${g.days} days` : "starts once saved"}
                          </div>
                        </div>
                      </div>
                      <div style={{...C.label,marginTop:11,marginBottom:6}}>
                        HOLD A STREAK OF <span style={{color:"#fff"}}>{g.days}</span> {g.days===1?"DAY":"DAYS"}
                      </div>
                      <input type="range" min="1" max="30" step="1" value={g.days}
                        onChange={ev=>setGoal({days:parseInt(ev.target.value)})}
                        style={{width:"100%",accentColor:T.accent}}/>
                    </div>
                  );
                })}
                {(t.goals||[]).length < 3 && (
                  <button onClick={()=>set({goals:[...(t.goals||[]),
                      {eye:EYES[Math.min(EYES.length-1,(t.goals||[]).length)].id, days:(t.goals||[]).length?15:3}]})}
                    style={{...C.btnSm,width:"100%",padding:"12px"}}>
                    ＋ {(t.goals||[]).length ? "ADD ANOTHER GOAL" : "ADD A GOAL"}
                  </button>
                )}

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
                  <div style={{fontSize:8.5,color:FAINT,fontWeight:800,marginBottom:6,textAlign:"center"}}>TAP TEXT TO FIX A TYPO · ▼ FOLDS SUB-BULLETS AWAY · ➜ SENDS TO BOARD · ⊕ ADDS A SUB-BULLET</div>
                  {l.items.map(it=>(
                    <div key={it.id}>
                      <div style={{display:"flex",alignItems:"center",gap:9,padding:"7px 0"}}>
                        {(it.children||[]).length>0 ? (
                          <button onClick={()=>toggleCollapse(l.id,it.id)}
                            style={{width:20,height:24,background:"none",border:"none",flexShrink:0,padding:0,
                              cursor:"pointer",color:l.color,fontSize:11,fontWeight:900,lineHeight:1,
                              display:"flex",alignItems:"center",justifyContent:"center"}}>
                            {it.collapsed ? "▶" : "▼"}
                          </button>
                        ) : <div style={{width:20,flexShrink:0}}/>}
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
                        {it.collapsed && (it.children||[]).length>0 && (
                          <span onClick={()=>toggleCollapse(l.id,it.id)}
                            style={{flexShrink:0,fontSize:9,fontWeight:900,color:"#fff",cursor:"pointer",
                              background:`${l.color}55`,borderRadius:9,padding:"2px 7px"}}>
                            +{(it.children||[]).length}
                          </span>
                        )}
                        <button onClick={()=>sendToBoard(l.id,it.id,null)} title="Send to board"
                          style={{background:`${l.color}33`,border:"none",borderRadius:8,color:"#fff",fontSize:12,cursor:"pointer",padding:"5px 9px",fontWeight:900,flexShrink:0}}>➜</button>
                        <button onClick={()=>{setSubFor(subFor===it.id?null:it.id); setSubInput("");}}
                          style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,color:DIM,fontSize:12,cursor:"pointer",padding:"5px 8px",flexShrink:0}}>⊕</button>
                        <button onClick={()=>deleteListItem(l.id,it.id,null)}
                          style={{background:"none",border:"none",color:FAINT,fontSize:13,cursor:"pointer",padding:"4px 2px",flexShrink:0}}>✕</button>
                      </div>
                      {!it.collapsed && (it.children||[]).map(c=>(
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
        {/* ══ DAILY RECORD — a grid of every day's badge ══ */}
        {view==="record" && (()=>{
          const { y, m } = recCursor;
          const todayK  = dateKey();
          const first   = new Date(y, m, 1);
          const lead    = first.getDay();
          const nDays   = new Date(y, m+1, 0).getDate();
          const cells   = [];
          for (let i=0;i<lead;i++) cells.push(null);
          for (let d=1;d<=nDays;d++) cells.push(d);
          while (cells.length % 7 !== 0) cells.push(null);
          const k = (d)=>`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          // Month tally
          const tally = [0,0,0,0,0]; let rated=0, pctSum=0;
          for (let d=1;d<=nDays;d++) {
            const dk = k(d); if (dk > todayK) continue;
            const r = dayPct(dk); if (r.pct==null) continue;
            tally[badgeTierFor(r.pct)]++; rated++; pctSum += r.pct;
          }
          const avg = rated ? Math.round(pctSum/rated) : 0;
          const shift = (delta)=>{ const d=new Date(y, m+delta, 1); setRecCursor({y:d.getFullYear(), m:d.getMonth()}); };
          const atNow = (y===new Date().getFullYear() && m===new Date().getMonth());
          return (
          <div style={{padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={C.sectionTitle}>Daily Record</div>
              <button style={{...C.btnSm,padding:"9px 14px",fontSize:11.5}} onClick={()=>setView("dashboard")}>‹ HOME</button>
            </div>

            {/* MONTH NAV */}
            <div style={{...C.glass,padding:"11px 13px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <button onClick={()=>shift(-1)}
                style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:11,color:"#fff",
                  fontSize:16,cursor:"pointer",padding:"5px 13px",fontWeight:900}}>‹</button>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:14.5,fontWeight:900,color:"#fff"}}>{MONTHS[m]} {y}</div>
                <div style={{fontSize:9,color:DIM,fontWeight:800,letterSpacing:0.6,marginTop:1}}>
                  {rated>0 ? `${avg}% AVERAGE · ${rated} ACTIVE DAYS` : "NO ACTIVE DAYS"}
                </div>
              </div>
              <button onClick={()=>shift(1)} disabled={atNow}
                style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:11,
                  color:atNow?FAINT:"#fff",fontSize:16,cursor:atNow?"default":"pointer",padding:"5px 13px",fontWeight:900}}>›</button>
            </div>

            {/* THE GRID */}
            <div style={{...C.glass,padding:"12px 10px"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
                {DAYS.map(d=>(
                  <div key={d} style={{textAlign:"center",fontSize:8.5,fontWeight:900,color:FAINT,letterSpacing:0.5}}>
                    {d.slice(0,1).toUpperCase()}
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
                {cells.map((d,i)=>{
                  if (d==null) return <div key={`b${i}`} style={{height:50}}/>;
                  const dk = k(d);
                  const future = dk > todayK;
                  const isT = dk === todayK;
                  const r = future ? {pct:null} : dayPct(dk);
                  const tier = badgeTierFor(r.pct);
                  const bt = tier>0 ? BADGE_TIERS[tier-1] : null;
                  return (
                    <div key={dk} style={{height:50,borderRadius:11,display:"flex",flexDirection:"column",
                      alignItems:"center",justifyContent:"center",gap:1,
                      ...(BLOCK ? {
                        ...(future
                          ? {background:"transparent",border:`2px solid ${BLK.slotD}`}
                          : plate(!!bt, bt?bt.light:null)),
                        ...(isT ? {outline:`2px solid ${bt?bt.light:"#ffffff"}`,outlineOffset:"-2px"} : {}),
                      } : {
                        background: bt ? `${bt.base}1f` : future ? "transparent" : "rgba(255,255,255,0.035)",
                        border: isT ? `1.5px solid ${bt?bt.light:"rgba(255,255,255,0.55)"}`
                              : bt ? `1px solid ${bt.base}55`
                              : future ? "1px dashed rgba(255,255,255,0.09)" : "1px solid rgba(255,255,255,0.05)",
                      })}}>
                      <div style={{fontSize:8,fontWeight:900,lineHeight:1,
                        color: isT ? "#fff" : bt ? bt.light : FAINT}}>{d}</div>
                      {bt ? <DayBadge tier={tier} size={26}/>
                        : future ? <div style={{width:5,height:5,borderRadius:3,background:"rgba(255,255,255,0.13)"}}/>
                        : r.pct==null
                          ? <div style={{fontSize:7.5,fontWeight:800,color:"rgba(255,255,255,0.22)"}}>rest</div>
                          : <div style={{fontSize:8.5,fontWeight:900,color:"rgba(255,255,255,0.35)"}}>{r.pct}%</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MONTH HAUL */}
            <div style={{...C.glass,padding:"13px 14px"}}>
              <div style={{...C.label,marginBottom:10}}>THIS MONTH'S HAUL</div>
              <div style={{display:"flex",gap:7}}>
                {BADGE_TIERS.map(bt=>(
                  <div key={bt.t} style={{flex:1,borderRadius:14,padding:"10px 4px",
                    display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                    ...(BLOCK ? plate(tally[bt.t]>0, bt.light)
                              : {background:`${bt.base}14`,border:`1px solid ${bt.base}44`})}}>
                    <DayBadge tier={bt.t} size={30} earned={tally[bt.t]>0}/>
                    <div style={{fontSize:16,fontWeight:900,color:tally[bt.t]>0?bt.light:FAINT,lineHeight:1}}>{tally[bt.t]}</div>
                    <div style={{fontSize:7.5,fontWeight:900,color:FAINT,letterSpacing:0.4}}>{bt.need}%</div>
                  </div>
                ))}
              </div>
              {tally[0]>0 && (
                <div style={{fontSize:9.5,color:FAINT,fontWeight:700,textAlign:"center",marginTop:9}}>
                  {tally[0]} day{tally[0]===1?"":"s"} under 25% — no badge earned
                </div>
              )}
            </div>

            {/* LEGEND */}
            <div style={{...C.glass,padding:"13px 14px"}}>
              <div style={{...C.label,marginBottom:9}}>THE RANKS</div>
              {BADGE_TIERS.map(bt=>(
                <div key={bt.t} style={{display:"flex",alignItems:"center",gap:11,
                  padding:"7px 0",borderBottom:bt.t<4?`1px solid ${LINE}`:"none"}}>
                  {BLOCK
                    ? <div style={{width:44,height:44,flexShrink:0,display:"flex",alignItems:"center",
                        justifyContent:"center",...plate(true, bt.light)}}><DayBadge tier={bt.t} size={34}/></div>
                    : <DayBadge tier={bt.t} size={34}/>}
                  <div style={{flex:1}}>
                    <div style={{fontSize:12.5,fontWeight:900,color:bt.light,letterSpacing:0.6}}>{bt.name}</div>
                    <div style={{fontSize:9.5,color:DIM,fontWeight:700,marginTop:1}}>{bt.lore}</div>
                  </div>
                  <div style={{fontSize:13,fontWeight:900,color:bt.base}}>{bt.need}%</div>
                </div>
              ))}
              <div style={{fontSize:9,color:FAINT,fontWeight:700,textAlign:"center",marginTop:10,lineHeight:1.5}}>
                Based on the daily quests scheduled for that day. Days with nothing scheduled read as REST and don't count against you.
              </div>
            </div>
          </div>
          );
        })()}

        {view==="stats" && (
          <div style={{padding:"14px 16px"}}>
            <div onClick={()=>setView("record")}
              style={{...C.glass,marginBottom:14,padding:"12px 14px",cursor:"pointer",
                display:"flex",alignItems:"center",gap:11}}>
              <div style={{display:"flex",gap:BLOCK?3:2,flexShrink:0}}>
                {BADGE_TIERS.map(bt=>{
                  const got = todayPct!=null && todayPct>=bt.need;
                  const art = <DayBadge tier={bt.t} size={25} earned={got}/>;
                  if (!BLOCK) return <div key={bt.t}>{art}</div>;
                  return <div key={bt.t} style={{width:33,height:33,display:"flex",alignItems:"center",
                    justifyContent:"center",...plate(got, bt.light)}}>{art}</div>;
                })}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:900,color:"#fff"}}>Daily Record</div>
                <div style={{fontSize:9.5,color:DIM,fontWeight:700,marginTop:1}}>
                  Every day's badge, month by month
                </div>
              </div>
              <div style={{fontSize:18,color:FAINT}}>›</div>
            </div>
            <div style={{...C.sectionTitle,margin:"18px 2px 4px"}}>The Path of Ascension</div>
            <div style={{fontSize:11,color:DIM,margin:"0 2px 12px",fontWeight:700}}>Tap ✎ to rename a rank.</div>
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
                      {achieved ? "Earned" : `Reach rating ${Math.round(L.lvl*4.2)}`}
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

        {/* ══ DESIGN ══ */}
        {view==="design" && (
          <div style={{padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={C.sectionTitle}>Design</div>
              <button style={{...C.btnSm,padding:"9px 14px",fontSize:11.5}} onClick={()=>setView("settings")}>‹ SETTINGS</button>
            </div>
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
              <div style={C.label}>HOME QUEST LAYOUT</div>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                {[["list","LIST"],["circles","CIRCLES"]].map(([v,l])=>(
                  <button key={v} style={C.chip(S.questLayout===v)} onClick={()=>setSetting("questLayout",v)}>{l}</button>
                ))}
              </div>
              <div style={{fontSize:10,color:FAINT,fontWeight:700,marginBottom:16}}>Circles = big tappable rings with icons, spaced out. They shrink as you add quests so everything stays on one page.</div>
              <div style={C.label}>QUEST CARD STYLE</div>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                {[["vivid","VIVID"],["tinted","TINTED"]].map(([v,l])=>(
                  <button key={v} style={C.chip(S.cardStyle===v)} onClick={()=>setSetting("cardStyle",v)}>{l}</button>
                ))}
              </div>
              <div style={{fontSize:10,color:FAINT,fontWeight:700,marginTop:-8,marginBottom:16}}>Vivid = full color cards · Tinted = subtle glass with a touch of color</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:16}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>"This Week" on home</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Off = weekly habits show on the Quests page instead</div>
                </div>
                <Switch on={S.weeklyOnHome!==false} onToggle={()=>setSetting("weeklyOnHome",!(S.weeklyOnHome!==false))}/>
              </div>
            </div>

            {/* CHARACTER */}
            <div style={C.glass}>
              <div style={C.label}>YOUR CHAMPION</div>
              <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
                <PixelCharacter level={wornLvl} character={cz} scale={6.5} idle cosmetics={cosmetics} pet={pet}/>
              </div>
              <div style={{...C.label,marginBottom:6}}>OUTFIT</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:6}}>
                {LEVELS.filter(L=>L.lvl<=level.lvl).map(L=>{
                  const on = wornLvl === L.lvl;
                  return (
                    <button key={L.lvl} onClick={()=>setChar("appearLevel", L.lvl===level.lvl ? null : L.lvl)}
                      style={{padding:"8px 11px",borderRadius:12,cursor:"pointer",fontFamily:FONT,
                        fontSize:10.5,fontWeight:900,letterSpacing:0.3,
                        border: on ? `2px solid ${T.accent}` : `1px solid ${LINE}`,
                        background: on ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)",
                        color: on ? "#fff" : DIM}}>
                      {getTitle(data, L.lvl)}
                    </button>
                  );
                })}
              </div>
              <div style={{fontSize:10,color:FAINT,fontWeight:700,marginBottom:14,lineHeight:1.5}}>
                Wear any rank you have already earned. Your actual rank never changes.
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

            {/* DOJUTSU */}
            <div style={C.glass}>
              <div style={C.label}>DOJUTSU</div>
              <div style={{fontSize:10.5,color:FAINT,fontWeight:700,marginTop:-6,marginBottom:11,lineHeight:1.45}}>
                Awakened by holding a streak on a quest. Set the goal in the quest itself.
                Hidden under the ANBU mask.
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:9}}>
                <button onClick={()=>setCos("eye", null)}
                  style={{height:54,padding:"0 14px",borderRadius:14,cursor:"pointer",fontFamily:FONT,
                    fontSize:10,fontWeight:900,color:"#fff",background:"rgba(255,255,255,0.06)",
                    border:!cosmetics.eye?`2px solid ${T.accent}`:`1px solid ${LINE}`}}>NONE</button>
                {EYES.map(e=>{
                  const have = ((data.wallet||{}).owned||[]).includes("eye_"+e.id);
                  const on = cosmetics.eye===e.id;
                  let q = 0;
                  return (
                    <button key={e.id} onClick={()=>have && setCos("eye", on?null:e.id)}
                      title={e.name}
                      style={{width:54,height:54,padding:0,borderRadius:14,position:"relative",
                        cursor:have?"pointer":"default",background:"rgba(255,255,255,0.06)",
                        border:on?`2px solid ${T.accent}`:`1px solid ${LINE}`,
                        filter:have?"none":"grayscale(1) brightness(0.45)"}}>
                      <svg width="40" height="40" viewBox="0 0 40 40" style={{display:"block",margin:"0 auto"}}>
                        {drawEye([], e.id, 20, 20, 17, ()=>q++)}
                      </svg>
                      {!have && <span style={{position:"absolute",top:3,right:4,fontSize:11}}>🔒</span>}
                    </button>
                  );
                })}
              </div>
              <div style={{fontSize:10,color:DIM,fontWeight:800,marginTop:10}}>
                {cosmetics.eye ? (eyeById(cosmetics.eye)||{}).name : "No dojutsu equipped"}
              </div>
            </div>

            {/* RESETS — each one stands alone */}
            <div style={{...C.glass,border:`1.5px solid ${BAD}44`}}>
              <div style={{...C.label,color:BAD}}>RESET</div>
              <div style={{fontSize:10.5,color:FAINT,fontWeight:700,marginTop:-6,marginBottom:12,lineHeight:1.45}}>
                Each of these is independent.
              </div>
              <button style={{...C.btnSm,width:"100%",padding:"13px",marginBottom:8}}
                onClick={()=>setConfirmBox({type:"resetDojutsu"})}>
                👁 RESET DOJUTSU <span style={{color:FAINT,fontWeight:700}}>· eyes only</span>
              </button>
              <button style={{...C.btnSm,width:"100%",padding:"13px"}}
                onClick={()=>setConfirmBox({type:"resetSummons"})}>
                🦊 RESET SUMMONS <span style={{color:FAINT,fontWeight:700}}>· beasts only</span>
              </button>
              <div style={{height:1,background:LINE,margin:"16px 0 14px"}}/>
              <div style={{fontSize:10,color:BAD,fontWeight:900,letterSpacing:1,marginBottom:7}}>
                ⚠ THIS ONE ERASES PROGRESS
              </div>
              <button style={{...C.btnSm,width:"100%",padding:"15px",color:"#fff",
                  background:`${BAD}33`,border:`1.5px solid ${BAD}`}}
                onClick={()=>setConfirmBox({type:"resetWardrobe"})}>
                ↺ RESET WARDROBE
                <div style={{fontSize:9.5,color:"#ffb3b3",fontWeight:700,marginTop:3}}>
                  wipes every quest&rsquo;s history and your rank
                </div>
              </button>
            </div>

            {/* MY COSMETICS (shop items, managed here on the character page) */}
            <div style={C.glass}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{...C.label,marginBottom:0}}>MY SUMMONS</div>
                <button style={{...C.btnSm,padding:"7px 12px"}} onClick={()=>setView("shop")}>SUMMONS →</button>
              </div>
              {(() => {
                const owned = SHOP.filter(it=>(data.wallet.owned||[]).includes(it.id));
                if (owned.length===0 && !data.wallet.pet) {
                  return <div style={{fontSize:11.5,color:DIM,fontWeight:600,marginTop:10,lineHeight:1.5}}>
                    Nothing yet. Hold a perfect-day streak and the tailed beasts answer one by one — they&rsquo;ll appear here to equip.
                  </div>;
                }
                const groups = [["pet","TAILED BEASTS"]];
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
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {/* ══ THE RIVAL ══ */}
        {view==="boss" && (()=>{
          const canFight = playerPow >= rivalPow;
          const pct = rivalPow > 0 ? Math.max(0, Math.min(100, (playerPow/rivalPow)*100)) : 100;
          const aura = ["#7a3fd6","#9a3fd6","#c23fa8","#e0432f","#ffb020"][stage];
          // He only speaks when the standings change enough to be worth a word.
          const line = canFight
            ? "You caught me. Pick up a blade."
            : gap > (R.rate||28) * 6
              ? "You stopped. I didn't."
              : gap > (R.rate||28) * 2
                ? "Still ahead. Comfortably."
                : "Don't. You're close.";
          const daysBehind = Math.max(1, Math.ceil(gap / Math.max(1, R.rate||28)));
          return (
          <div style={{padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={C.sectionTitle}>The Rival</div>
              <div style={{fontSize:10,fontWeight:900,color:FAINT,letterSpacing:1}}>ARC {R.arc||1}</div>
            </div>

            {/* THE GAP — the only number that matters */}
            <div style={{...C.glass,padding:"16px 16px 14px",textAlign:"center",
              border:canFight?`2px solid ${T.accent}`:undefined}}>
              <div style={{fontSize:9.5,fontWeight:900,letterSpacing:1.6,color:FAINT}}>
                {canFight ? "YOU HAVE CAUGHT HIM" : "HE IS AHEAD BY"}
              </div>
              <div style={{fontSize:52,fontWeight:900,lineHeight:1.05,marginTop:2,
                color: canFight ? T.accent : aura,
                textShadow:`0 0 26px ${canFight?T.accent:aura}77`}}>
                {canFight ? "—" : gap.toLocaleString()}
              </div>
              {!canFight && (
                <div style={{fontSize:10.5,color:DIM,fontWeight:700,marginTop:2}}>
                  about {daysBehind} {daysBehind===1?"day":"days"} of training
                </div>
              )}
              <div style={{height:12,background:"rgba(0,0,0,0.35)",borderRadius:7,overflow:"hidden",marginTop:13,
                border:`1px solid ${LINE}`}}>
                <div style={{width:`${pct}%`,height:"100%",
                  background:`linear-gradient(90deg,${T.accent},${aura})`,
                  boxShadow:`0 0 14px ${aura}`,transition:"width .5s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:7}}>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:8.5,fontWeight:900,color:FAINT,letterSpacing:1}}>YOU</div>
                  <div style={{fontSize:17,fontWeight:900,color:"#fff"}}>{playerPow.toLocaleString()}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:8.5,fontWeight:900,color:FAINT,letterSpacing:1}}>{RIVAL_NAME}</div>
                  <div style={{fontSize:17,fontWeight:900,color:aura}}>{rivalPow.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* HIM */}
            <div style={{...C.glass,padding:0,overflow:"hidden"}}>
              <div style={{position:"relative",background:`radial-gradient(circle at 50% 55%, ${aura}22, rgba(0,0,0,0.45) 70%)`}}>
                <KaedoArt stage={stage} style={{width:"100%",height:250,display:"block"}}/>
                <div style={{position:"absolute",left:0,right:0,bottom:0,padding:"22px 14px 11px",
                  background:"linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,0.82) 62%)"}}>
                  <div style={{fontSize:19,fontWeight:900,color:"#fff",letterSpacing:1}}>
                    {RIVAL_NAME} <span style={{fontSize:12,fontWeight:800,color:aura}}>{arcTitle(R.arc)}</span>
                  </div>
                  <div style={{fontSize:9.5,color:DIM,fontWeight:700,marginTop:1}}>
                    trains {Math.round(R.rate||28)} power a day · beaten {R.wins||0}×
                  </div>
                </div>
              </div>
              <div style={{padding:"13px 15px",borderTop:`1px solid ${LINE}`}}>
                <div style={{fontSize:13.5,fontWeight:700,color:"#fff",fontStyle:"italic",lineHeight:1.45}}>
                  “{line}”
                </div>
              </div>
            </div>

            {canFight ? (
              <button onClick={()=>setDuel({stage:"fight"})}
                style={{...C.btn,width:"100%",padding:"17px",fontSize:14.5,letterSpacing:1.4,
                  background:`linear-gradient(135deg,${T.accent},${aura})`,
                  boxShadow:`0 0 26px ${aura}88`,animation:"glowPulse 1.5s ease-in-out infinite"}}>
                ⚔ CHALLENGE HIM
              </button>
            ) : (
              <div style={{...C.glass,textAlign:"center",padding:"14px"}}>
                <div style={{fontSize:11.5,color:DIM,fontWeight:700,lineHeight:1.5}}>
                  You can't challenge him from behind.<br/>Close the gap by finishing quests.
                </div>
              </div>
            )}

            {/* YOUR FORM */}
            <div style={{...C.glass,padding:"14px 15px"}}>
              <div style={{...C.label,marginBottom:10}}>YOUR FORM</div>
              <div style={{display:"flex",alignItems:"center",gap:13}}>
                <div style={{width:58,height:58,borderRadius:"50%",flexShrink:0,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  background: myForm.aura ? `radial-gradient(circle, ${myForm.aura}66, transparent 72%)` : "rgba(255,255,255,0.05)",
                  boxShadow: myForm.aura ? `0 0 22px ${myForm.aura}88` : "none"}}>
                  <div style={{fontSize:25}}>{myForm.n>=5?"✷":myForm.n>=3?"✦":myForm.n>=1?"✧":"·"}</div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:16,fontWeight:900,letterSpacing:1.2,
                    color: myForm.aura || "#fff"}}>{myForm.name}</div>
                  <div style={{fontSize:10,color:DIM,fontWeight:700,fontStyle:"italic",marginTop:1}}>{myForm.line}</div>
                  {upNextForm && (
                    <div style={{fontSize:9.5,color:FAINT,fontWeight:800,marginTop:4}}>
                      {(upNextForm.at - playerPow).toLocaleString()} to {upNextForm.name}
                    </div>
                  )}
                </div>
              </div>
              <div style={{display:"flex",gap:4,marginTop:12}}>
                {FORMS.slice(1).map(f=>(
                  <div key={f.n} style={{flex:1,height:5,borderRadius:3,
                    background: playerPow>=f.at ? (f.aura||"#fff") : "rgba(255,255,255,0.1)",
                    boxShadow: playerPow>=f.at ? `0 0 8px ${f.aura}` : "none"}}/>
                ))}
              </div>
            </div>

            {/* THE ARC */}
            <div style={{...C.glass,padding:"14px 15px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
                <div style={C.label}>THE ARC</div>
                <div style={{fontSize:9.5,fontWeight:900,color:FAINT}}>
                  {Math.min(STORY.length,(data.story||{}).unlocked||0)}/{STORY.length}
                </div>
              </div>
              <div style={{fontSize:9.5,color:FAINT,fontWeight:700,marginBottom:11,lineHeight:1.5}}>
                One chapter opens each day you finish everything you scheduled.
              </div>
              {STORY.map((ch,i)=>{
                const open = i < ((data.story||{}).unlocked||0);
                return (
                  <div key={i} onClick={()=>open && setStoryOpen(i)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",
                      borderBottom: i<STORY.length-1?`1px solid ${LINE}`:"none",
                      cursor: open?"pointer":"default", opacity: open?1:0.35}}>
                    <div style={{width:24,height:24,flexShrink:0,borderRadius:"50%",
                      background: open?`${aura}33`:"rgba(255,255,255,0.05)",
                      border:`1px solid ${open?aura:"rgba(255,255,255,0.1)"}`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:9.5,fontWeight:900,color:open?"#fff":FAINT}}>{open?i+1:"🔒"}</div>
                    <div style={{flex:1,fontSize:12.5,fontWeight:800,color:open?"#fff":FAINT}}>
                      {open ? ch.t : "————"}
                    </div>
                    {open && <div style={{fontSize:13,color:FAINT}}>›</div>}
                  </div>
                );
              })}
              {((data.story||{}).unlocked||0) >= STORY.length && (
                <div style={{fontSize:10,color:DIM,fontWeight:700,textAlign:"center",marginTop:10}}>
                  The arc is finished. He isn't.
                </div>
              )}
            </div>
          </div>
          );
        })()}

        {/* CHAPTER READER */}
        {storyOpen !== null && STORY[storyOpen] && (
          <div style={C.modal} onClick={()=>setStoryOpen(null)}>
            <div style={C.sheet} onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:9.5,fontWeight:900,letterSpacing:1.6,color:FAINT}}>CHAPTER {storyOpen+1}</div>
              <div style={{fontSize:21,fontWeight:900,color:"#fff",marginTop:3,marginBottom:14}}>{STORY[storyOpen].t}</div>
              <div style={{fontSize:14,lineHeight:1.72,color:"rgba(255,255,255,0.9)",fontWeight:500,whiteSpace:"pre-wrap"}}>
                {STORY[storyOpen].b}
              </div>
              <button style={{...C.btn,width:"100%",marginTop:20,padding:"14px"}} onClick={()=>setStoryOpen(null)}>CLOSE</button>
            </div>
          </div>
        )}

        {/* TRIALS — every standing way to earn XP */}
        {trialsOpen && (
          <div style={C.modal} onClick={()=>setTrialsOpen(false)}>
            <div style={C.sheet} onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:20,fontWeight:900,color:"#fff"}}>Trials</div>
              <div style={{fontSize:11,color:DIM,fontWeight:700,marginTop:3,marginBottom:14,lineHeight:1.5}}>
                Every one of these pays XP, and XP is the only thing that raises your rank.
              </div>
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
                      <button onClick={()=>claimTrophy(t)} style={{...C.btn,padding:"9px 12px",fontSize:10.5,animation:"glowPulse 1.6s ease-in-out infinite"}}>CLAIM XP</button>
                    ) : (
                      <div style={{fontSize:10,fontWeight:800,color:FAINT}}>+XP</div>
                    )}
                  </div>
                );
              })}
            </div>
              <button style={{...C.btn,width:"100%",marginTop:14,padding:"14px"}} onClick={()=>setTrialsOpen(false)}>CLOSE</button>
            </div>
          </div>
        )}

        {/* RESTORE A BACKUP */}
        {restoreOpen && (()=>{
          let snaps = [];
          try { snaps = JSON.parse(localStorage.getItem(SNAP_KEY) || "[]").filter(x=>x && x.data); } catch {}
          snaps = snaps.slice().reverse();
          const countDone = (d) => {
            let n = 0;
            (d.tasks||[]).forEach(t=>{ n += Object.keys(t.completions||{}).length; });
            return n;
          };
          return (
            <div style={C.modal} onClick={()=>setRestoreOpen(false)}>
              <div style={C.sheet} onClick={e=>e.stopPropagation()}>
                <div style={{fontSize:19,fontWeight:900,color:"#fff",marginBottom:4}}>Restore a backup</div>
                <div style={{fontSize:11,color:DIM,fontWeight:700,lineHeight:1.5,marginBottom:14}}>
                  Snapshots saved on this device. Restoring replaces everything currently
                  on the server with that snapshot.
                </div>
                {snaps.length===0 && (
                  <div style={{...C.glass,textAlign:"center",color:DIM,fontSize:12.5,fontWeight:600}}>
                    No backups on this device yet. One is written each day you use the app.
                  </div>
                )}
                {snaps.map(sn=>(
                  <div key={sn.day} style={{...C.glass,display:"flex",alignItems:"center",gap:11,padding:"12px 14px"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13.5,fontWeight:900,color:"#fff"}}>{sn.day}</div>
                      <div style={{fontSize:9.5,color:FAINT,fontWeight:700,marginTop:1}}>
                        {countDone(sn.data)} completions · {(sn.data.tasks||[]).length} quests
                      </div>
                    </div>
                    <button style={{...C.btnSm,padding:"9px 13px"}}
                      onClick={()=>{
                        const restored = migrate(sn.data);
                        restored.rev = (revRef.current || 0) + 1;
                        revRef.current = restored.rev;
                        setData(restored);
                        fetch("/api/storage",{method:"POST",headers:{"Content-Type":"application/json"},
                          body:JSON.stringify(restored)}).catch(()=>{});
                        setRestoreOpen(false);
                        toast$(`RESTORED ${sn.day}`, "#fb923c");
                      }}>RESTORE</button>
                  </div>
                ))}
                <button style={{...C.btn,width:"100%",marginTop:8,padding:"14px"}}
                  onClick={()=>setRestoreOpen(false)}>CLOSE</button>
              </div>
            </div>
          );
        })()}

        {/* TRANSFORMATION */}
        {formUp && (
          <div onClick={()=>setFormUp(null)}
            style={{position:"fixed",inset:0,zIndex:950,display:"flex",alignItems:"center",justifyContent:"center",
              background:`radial-gradient(circle at 50% 50%, ${formUp.aura}44 0%, rgba(0,0,0,0.94) 62%)`,
              cursor:"pointer",animation:"popIn .45s ease-out"}}>
            <div style={{textAlign:"center",padding:"0 24px"}}>
              <div style={{width:150,height:150,margin:"0 auto 18px",borderRadius:"50%",
                background:`radial-gradient(circle, #ffffff 0%, ${formUp.aura} 34%, transparent 72%)`,
                boxShadow:`0 0 90px ${formUp.aura}`,
                animation:"glowPulse 1.1s ease-in-out infinite",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:60}}>
                {formUp.n>=5?"✷":formUp.n>=3?"✦":"✧"}
              </div>
              <div style={{fontSize:10,fontWeight:900,letterSpacing:3,color:FAINT}}>A NEW FORM</div>
              <div style={{fontSize:36,fontWeight:900,letterSpacing:3,color:formUp.aura,marginTop:4,
                textShadow:`0 0 40px ${formUp.aura}`}}>{formUp.name}</div>
              <div style={{fontSize:14,fontWeight:700,fontStyle:"italic",color:"#fff",marginTop:12,lineHeight:1.5}}>
                {formUp.line}
              </div>
              <div style={{fontSize:11.5,color:DIM,fontWeight:800,marginTop:16}}>
                +{25 + formUp.n*15} 💎
              </div>
              <div style={{fontSize:10,color:FAINT,fontWeight:700,marginTop:22}}>tap anywhere</div>
            </div>
          </div>
        )}

        {/* THE DUEL */}
        {duel && (
          <div style={{...C.modal,alignItems:"center",background:"rgba(0,0,0,0.9)"}}
            onClick={()=>{ if (duel.stage==="won") setDuel(null); }}>
            <div style={{width:"100%",maxWidth:430,padding:"0 18px",textAlign:"center"}}>
              {duel.stage==="fight" ? (
                <>
                  <KaedoArt stage={stage} style={{width:"100%",height:250,display:"block"}}/>
                  <div style={{fontSize:14,fontWeight:700,color:"#fff",fontStyle:"italic",lineHeight:1.5,margin:"12px 0 20px"}}>
                    “I did not train to beat you.<br/>I trained so that beating me would be worth something.”
                  </div>
                  <button onClick={winDuel}
                    style={{...C.btn,width:"100%",padding:"18px",fontSize:16,letterSpacing:2,
                      background:`linear-gradient(135deg,${T.accent},${["#7a3fd6","#9a3fd6","#c23fa8","#e0432f","#ffb020"][stage]})`,
                      boxShadow:"0 0 34px rgba(255,255,255,0.35)"}}>⚔ STRIKE</button>
                  <button onClick={()=>setDuel(null)}
                    style={{...C.btnSm,width:"100%",padding:"13px",marginTop:10}}>NOT YET</button>
                </>
              ) : (
                <>
                  <div style={{fontSize:64,marginBottom:6}}>⚔</div>
                  <div style={{fontSize:32,fontWeight:900,color:T.accent,letterSpacing:3,
                    textShadow:`0 0 30px ${T.accent}`}}>VICTORY</div>
                  <div style={{fontSize:14,fontWeight:700,color:"#fff",fontStyle:"italic",lineHeight:1.6,margin:"16px 0"}}>
                    “Right,” he said. “Again, then.<br/>From higher up.”
                  </div>
                  <div style={{fontSize:12,color:DIM,fontWeight:800,marginBottom:20}}>
                    +{40 + ((data.rival||{}).arc||2)*10} gems · every attribute raised
                  </div>
                  <button onClick={()=>setDuel(null)} style={{...C.btn,width:"100%",padding:"16px"}}>CONTINUE</button>
                </>
              )}
            </div>
          </div>
        )}

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

            <div onClick={()=>setView("design")}
              style={{...C.glass,padding:"13px 15px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:22}}>🎨</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:900,color:"#fff"}}>Design</div>
                <div style={{fontSize:11,color:DIM,fontWeight:700,marginTop:1}}>
                  Sky, your champion, wardrobe, cosmetics and stat display
                </div>
              </div>
              <div style={{fontSize:18,color:FAINT}}>›</div>
            </div>

            {/* PAGES */}
            <div style={C.glass}>
              <div style={C.label}>PAGES</div>
              <div style={{fontSize:10.5,color:FAINT,fontWeight:700,marginTop:-6,marginBottom:12,lineHeight:1.4}}>Home and More are always on. Toggle the rest to keep your bottom bar tidy.</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>⚔ Quests</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Your missions and the weekly grid</div>
                </div>
                <Switch on={S.questsEnabled!==false} onToggle={()=>setSetting("questsEnabled",!(S.questsEnabled!==false))}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>🪵 Ascension Path</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Your attributes and the climb to Sage</div>
                </div>
                <Switch on={S.statsEnabled!==false} onToggle={()=>setSetting("statsEnabled",!(S.statsEnabled!==false))}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>🔥 Rival</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Kaedo trains every day you do not</div>
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
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>🧮 Board</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>Mission board and scroll lists</div>
                </div>
                <Switch on={S.kanbanEnabled} onToggle={()=>setSetting("kanbanEnabled",!S.kanbanEnabled)}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>🦊 Summons</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2,fontWeight:600}}>The nine tailed beasts, earned by streak</div>
                </div>
                <Switch on={S.shopEnabled} onToggle={()=>setSetting("shopEnabled",!S.shopEnabled)}/>
              </div>
            </div>

            {/* BOTTOM BAR ORDER */}
            <div style={C.glass}>
              <div style={C.label}>BOTTOM BAR ORDER</div>
              <div style={{fontSize:10.5,color:FAINT,fontWeight:700,marginTop:-6,marginBottom:12,lineHeight:1.4}}>
                Home stays first and More stays last. Arrange everything in between.
              </div>
              {navOrder.map((v,i)=>{
                const d = NAV_DEFS[v];
                if (!d) return null;
                return (
                  <div key={v} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",
                    borderBottom: i<navOrder.length-1?`1px solid ${LINE}`:"none", opacity:d.on?1:0.45}}>
                    <div style={{width:22,textAlign:"center",fontSize:9.5,fontWeight:900,color:FAINT}}>{i+1}</div>
                    <div style={{fontSize:17,width:24,textAlign:"center"}}>{d.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:800,color:"#fff"}}>{d.label}</div>
                      {!d.on && <div style={{fontSize:9.5,color:FAINT,fontWeight:700}}>hidden — turn it on above</div>}
                    </div>
                    <button disabled={i===0} onClick={()=>moveNav(v,-1)}
                      style={{...C.btnSm,padding:"7px 11px",fontSize:12,opacity:i===0?0.3:1,
                        cursor:i===0?"default":"pointer"}}>▲</button>
                    <button disabled={i===navOrder.length-1} onClick={()=>moveNav(v,1)}
                      style={{...C.btnSm,padding:"7px 11px",fontSize:12,opacity:i===navOrder.length-1?0.3:1,
                        cursor:i===navOrder.length-1?"default":"pointer"}}>▼</button>
                  </div>
                );
              })}
              <button style={{...C.btnSm,width:"100%",padding:"11px",marginTop:10}}
                onClick={()=>setSetting("navOrder",[])}>↺ DEFAULT ORDER</button>
            </div>

            {/* BACKUPS */}
            <div style={C.glass}>
              <div style={C.label}>BACKUPS</div>
              <div style={{fontSize:10.5,color:DIM,fontWeight:700,lineHeight:1.5,marginBottom:11}}>
                This device keeps a snapshot of the last 5 days it saved. If a sync ever
                goes wrong, you can roll back to one of them.
              </div>
              <button style={{...C.btnSm,width:"100%",padding:"13px"}}
                onClick={()=>setRestoreOpen(true)}>💾 RESTORE A BACKUP</button>
            </div>


          </div>
        )}

        {/* ══ CASINO ══ */}
        {view==="shop" && (
          <div style={{padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={C.sectionTitle}>Summons</div>
              <div style={{display:"flex",alignItems:"center",gap:5,background:GLASS,border:`1px solid ${LINE}`,borderRadius:12,padding:"5px 12px"}}>
                <span style={{fontSize:13}}>🔥</span><span style={{fontSize:13,fontWeight:900,color:"#ffc46b"}}>{perfectStreak}</span>
              </div>
            </div>
            <div style={{fontSize:10.5,color:DIM,fontWeight:700,marginBottom:10}}>
              Each beast answers to a longer perfect-day streak. One tail for one day, all the way to Kurama at nine.
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
                    opacity:1,boxShadow:owned?`0 0 16px ${r.color}33`:"none"}}>
                    <div style={{position:"absolute",top:8,left:10,fontSize:7.5,fontWeight:900,color:r.color,letterSpacing:.5}}>{r.label}</div>
                    {gated && !owned && (
                      <div style={{position:"absolute",top:6,right:7,width:20,height:20,borderRadius:"50%",
                        background:"rgba(0,0,0,0.55)",border:`1px solid ${LINE}`,display:"flex",
                        alignItems:"center",justifyContent:"center",fontSize:10}}>🔒</div>
                    )}
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
                        <div style={{fontSize:10,fontWeight:800,color:"#ffc46b"}}>{item.gate.streak}-DAY STREAK</div>
                      ) : (
                        <div style={{fontSize:11,fontWeight:900,color:GOOD}}>TAP TO SUMMON</div>
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
            {/* A fixed-height box for the glyph: emoji and text symbols have very
                different intrinsic heights, which is what pushed the labels out of line. */}
            <span style={{height:19,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:n.fs||16,lineHeight:1}}>{n.icon}</span>
            <span style={{lineHeight:1,display:"block"}}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
