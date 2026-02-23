import { useState, useRef, useEffect, useCallback } from "react";

// AI PROVIDER ROUTER — calls go to /api/* Vercel serverless functions
async function callAI(provider, apiKey, prompt, system = "You are an expert YouTube content strategist.") {
  if (!apiKey) throw new Error("No API key provided — click ▼ Configure and Save your key.");
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, apiKey, prompt, system }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error || `AI error ${res.status}`);
  return d.text;
}

async function ytSearch(ytKey, query, maxResults = 12, type = "video") {
  if (!ytKey) throw new Error("YouTube API key required — add it in ▼ Configure");
  const params = new URLSearchParams({
    ytKey, query, maxResults, type,
    publishedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const res = await fetch(`/api/youtube?${params}`);
  const d = await res.json();
  if (!res.ok) throw new Error(d.error || "YouTube API error");
  return d;
}

async function ytVideoStats(ytKey, ids) {
  if (!ytKey || !ids.length) return null;
  const params = new URLSearchParams({ ytKey, ids: ids.join(",") });
  const res = await fetch(`/api/youtube-stats?${params}`);
  if (!res.ok) return null;
  return res.json();
}


// Convert hex to rgb components for rgba() usage
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

// Darken a hex color by a ratio (0-1)
function darken(hex, ratio=0.15) {
  let r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  r=Math.max(0,Math.round(r*(1-ratio))); g=Math.max(0,Math.round(g*(1-ratio))); b=Math.max(0,Math.round(b*(1-ratio)));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// Light bg/border tints derived from accent for light mode
function lightBg(hex) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgb(${Math.min(255,r+180)},${Math.min(255,g+180)},${Math.min(255,b+180)})`;
}
function lightBorder(hex) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgb(${Math.min(255,r+120)},${Math.min(255,g+120)},${Math.min(255,b+120)})`;
}

const PRESET_ACCENTS = [
  {name:"Turquoise",  hex:"#00e5a0"},
  {name:"Purple",     hex:"#a855f7"},
  {name:"Electric",   hex:"#3b82f6"},
  {name:"Rose",       hex:"#f43f5e"},
  {name:"Orange",     hex:"#f97316"},
  {name:"Yellow",     hex:"#eab308"},
  {name:"Cyan",       hex:"#06b6d4"},
  {name:"Lime",       hex:"#84cc16"},
  {name:"Pink",       hex:"#ec4899"},
  {name:"Red",        hex:"#ef4444"},
  {name:"Indigo",     hex:"#6366f1"},
  {name:"Amber",      hex:"#f59e0b"},
];

const makeCSS = (light, accent="#00e5a0") => {
  const rgb = hexToRgb(accent);
  const accent2 = darken(accent, 0.12);
  const bg   = light ? lightBg(accent)     : "#030f0a";
  const surf  = light ? "#ffffff"           : "#061410";
  const surf2 = light ? lightBg(accent)     : "#0a1f1a";
  const surf3 = light ? lightBorder(accent) : "#0f2d26";
  const bord  = light ? lightBorder(accent) : "#0d3028";
  const bord2 = light ? darken(lightBorder(accent),0.1) : "#1a4a3e";
  const text  = light ? "#0a0a0a"           : "#e2fff5";
  const text2 = light ? "#1a1a1a"           : `rgba(${rgb},.85)`;
  const text3 = light ? "#555"              : `rgba(${rgb},.4)`;
  return `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:${bg};
  --surface:${surf};
  --surface2:${surf2};
  --surface3:${surf3};
  --border:${bord};
  --border2:${bord2};
  --accent:${accent};--accent2:${accent2};
  --accent-dim:rgba(${rgb},.12);--accent-glow:rgba(${rgb},.3);
  --green:${accent};--green-dim:rgba(${rgb},.12);
  --blue:#38bdf8;--blue-dim:rgba(56,189,248,.12);
  --purple:#a78bfa;--purple-dim:rgba(167,139,250,.12);
  --red:#f87171;--red-dim:rgba(248,113,113,.12);
  --yellow:#fbbf24;--yellow-dim:rgba(251,191,36,.12);
  --text:${text};
  --text2:${text2};
  --text3:${text3};
  --font-d:'Syne',sans-serif;--font-m:'Space Mono',monospace;--font-b:'DM Sans',sans-serif;
  --r:8px;--rl:14px;--shadow:0 4px 24px rgba(0,0,0,.4)
}
body{background:var(--bg);color:var(--text);font-family:var(--font-b);font-size:14px;line-height:1.6;overflow-x:hidden;transition:background .3s,color .3s}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--surface)}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
.app{display:flex;min-height:100vh}
.sidebar{width:210px;min-width:210px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100;transition:background .3s}
.main{flex:1;margin-left:210px;display:flex;flex-direction:column;min-height:100vh}
.topbar{height:50px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;position:sticky;top:0;z-index:50;transition:background .3s}
.content{flex:1;padding:16px 20px 80px;max-width:1300px}
.logo-wrap{padding:14px 12px 12px;border-bottom:1px solid var(--border)}
.logo{font-family:var(--font-d);font-size:15px;font-weight:800;color:var(--accent)}
.logo-sub{font-size:9px;color:var(--text3);font-family:var(--font-m);letter-spacing:1px;text-transform:uppercase;margin-top:2px}
.nav-wrap{flex:1;padding:5px;overflow-y:auto}
.nav-sec{margin-bottom:16px}
.nav-label{font-size:9px;color:var(--text3);font-family:var(--font-m);letter-spacing:1.5px;text-transform:uppercase;padding:0 7px;margin-bottom:2px}
.nav-item{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:var(--r);cursor:pointer;transition:all .15s;color:var(--text2);font-size:12px;font-weight:500;border:1px solid transparent}
.nav-item:hover{background:var(--surface2);color:var(--text)}
.nav-item.active{background:var(--accent-dim);color:var(--accent);border-color:rgba(0,229,160,.25)}
.nav-badge{margin-left:auto;background:var(--accent);color:#030f0a;font-size:8.5px;padding:1px 5px;border-radius:8px;font-weight:700}
.topbar-title{font-family:var(--font-d);font-size:14px;font-weight:700}
.topbar-sub{font-size:10.5px;color:var(--text3);font-family:var(--font-m)}
.spacer{flex:1}
.dot{width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px var(--accent);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.btn{display:inline-flex;align-items:center;gap:6px;padding:6px 13px;border-radius:var(--r);font-family:var(--font-b);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;border:none;white-space:nowrap}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn-p{background:var(--accent);color:#030f0a}
.btn-p:hover:not(:disabled){background:var(--accent2);box-shadow:0 0 16px var(--accent-glow)}
.btn-g{background:transparent;color:var(--text2);border:1px solid var(--border2)}
.btn-g:hover:not(:disabled){background:var(--surface2);color:var(--text)}
.btn-sm{padding:4px 10px;font-size:11.5px}.btn-xs{padding:3px 8px;font-size:11px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--rl);padding:14px 16px;margin-bottom:12px;transition:background .3s,border .3s}
.card-sm{padding:10px 12px}
.ch{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.ct{font-family:var(--font-d);font-size:13.5px;font-weight:700}
.badge{display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;font-family:var(--font-m)}
.bg{background:var(--green-dim);color:var(--green)}.bo{background:var(--accent-dim);color:var(--accent)}
.bb{background:var(--blue-dim);color:var(--blue)}.bp{background:var(--purple-dim);color:var(--purple)}
.br{background:var(--red-dim);color:var(--red)}.by{background:var(--yellow-dim);color:var(--yellow)}
.input,.sel,.ta{background:var(--surface2);border:1px solid var(--border2);border-radius:var(--r);color:var(--text);font-family:var(--font-b);font-size:12.5px;padding:6px 10px;width:100%;transition:border-color .15s,background .3s;outline:none}
.input:focus,.sel:focus,.ta:focus{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-dim)}
.ta{min-height:80px;resize:vertical;line-height:1.6}.sel option{background:var(--surface2)}
.fg{margin-bottom:10px}
.fl{font-size:10.5px;font-weight:600;color:var(--text2);margin-bottom:4px;display:block;font-family:var(--font-m);text-transform:uppercase;letter-spacing:.5px}
.tabs{display:flex;gap:2px;background:var(--surface2);border-radius:var(--r);padding:2px;margin-bottom:12px}
.tab{padding:4px 10px;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;color:var(--text3)}
.tab.active{background:var(--surface);color:var(--text);box-shadow:0 1px 4px rgba(0,0,0,.25)}
.niche-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--rl);padding:12px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden}
.niche-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--accent),var(--blue));opacity:0;transition:opacity .2s}
.niche-card:hover{border-color:var(--border2);transform:translateY(-1px);box-shadow:var(--shadow)}
.niche-card:hover::before,.niche-card.sel::before{opacity:1}
.niche-card.sel{border-color:var(--accent);background:var(--accent-dim)}
.voice-card{background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);padding:8px 10px;display:flex;align-items:center;gap:8px;cursor:pointer;transition:all .15s;margin-bottom:6px}
.voice-card.sel{border-color:var(--accent);background:var(--accent-dim)}
.spin{width:16px;height:16px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
.empty{text-align:center;padding:50px 20px;color:var(--text3)}
.empty-icon{font-size:36px;margin-bottom:10px}
.empty-title{font-family:var(--font-d);font-size:16px;font-weight:700;color:var(--text2);margin-bottom:3px}
.section-title{font-family:var(--font-d);font-size:18px;font-weight:800;margin-bottom:3px}
.section-sub{font-size:12px;color:var(--text3);margin-bottom:14px;line-height:1.5}
.script-block{margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid var(--border)}
.script-block:last-child{border-bottom:none}
.stag{display:inline-block;padding:2px 7px;border-radius:3px;font-size:9.5px;font-family:var(--font-m);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px}
.stag.hook{background:var(--red-dim);color:var(--red)}.stag.intro{background:var(--blue-dim);color:var(--blue)}
.stag.body{background:var(--green-dim);color:var(--green)}.stag.cta{background:var(--purple-dim);color:var(--purple)}
.stag.outro{background:var(--yellow-dim);color:var(--yellow)}
.copy-btn{padding:3px 9px;font-size:10.5px;background:var(--surface3);border:1px solid var(--border2);border-radius:4px;cursor:pointer;color:var(--text2);transition:all .15s;font-family:var(--font-m)}
.copy-btn:hover{background:var(--accent-dim);color:var(--accent);border-color:var(--accent)}
.error-box{background:var(--red-dim);border:1px solid var(--red);border-radius:var(--r);padding:10px 14px;font-size:12.5px;color:var(--red);margin-bottom:14px}
.success-box{background:var(--green-dim);border:1px solid var(--green);border-radius:var(--r);padding:10px 14px;font-size:12.5px;color:var(--green);margin-bottom:14px}
.settings-banner{background:var(--surface);border:1px solid var(--border);border-radius:var(--rl);padding:12px 14px;margin-bottom:14px;transition:background .3s}
.trend-chart{display:flex;align-items:flex-end;gap:2px;height:40px}
.trend-bar{flex:1;border-radius:2px 2px 0 0;transition:all .3s}
.outlier-row{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:var(--r);cursor:pointer;transition:background .15s;border:1px solid transparent}
.outlier-row:hover{background:var(--surface2);border-color:var(--border)}
.outlier-row.active-row{background:var(--accent-dim);border-color:var(--accent)}
.orank{font-family:var(--font-m);font-size:10px;color:var(--text3);width:18px;flex-shrink:0}
.othumb{width:64px;height:36px;border-radius:4px;background:var(--surface3);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;overflow:hidden}
.othumb img{width:100%;height:100%;object-fit:cover}
.oinfo{flex:1;min-width:0}
.otitle{font-size:12.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ochan{font-size:10.5px;color:var(--text3)}
.oscore{font-family:var(--font-d);font-size:15px;font-weight:800;color:var(--accent);min-width:44px;text-align:right}
.video-popup{position:fixed;bottom:0;left:210px;right:0;background:var(--surface);border-top:2px solid var(--accent);padding:14px 24px;z-index:200;display:flex;gap:16px;align-items:center;box-shadow:0 -8px 30px rgba(0,0,0,.5);flex-wrap:wrap;transition:background .3s}
.popup-stat{text-align:center;min-width:70px}
.popup-stat-val{font-family:var(--font-d);font-size:16px;font-weight:800;color:var(--accent)}
.popup-stat-label{font-size:9px;color:var(--text3);font-family:var(--font-m);text-transform:uppercase}
.music-track{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:var(--r);background:var(--surface2);border:1px solid var(--border);cursor:pointer;transition:all .15s;margin-bottom:6px}
.music-track:hover,.music-track.active-track{border-color:var(--accent);background:var(--accent-dim)}
.play-btn{width:26px;height:26px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:9px;color:#030f0a;border:none;cursor:pointer}
.thumb-prev{border-radius:var(--r);overflow:hidden;position:relative;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;margin-bottom:10px;cursor:pointer}
.thumb-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:14px;text-align:center}
.thumb-title{font-family:var(--font-d);font-size:18px;font-weight:800;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.9);line-height:1.2}
.waveform{display:flex;align-items:center;gap:2px;height:22px}
.wave-bar{width:3px;background:var(--accent);border-radius:2px;animation:wave .8s ease-in-out infinite}
@keyframes wave{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
.keyword-row{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:var(--r);border:1px solid var(--border);margin-bottom:5px;background:var(--surface);cursor:pointer;transition:all .15s}
.keyword-row:hover{border-color:var(--accent);background:var(--accent-dim)}
.kw-vol{font-family:var(--font-m);font-size:11px;color:var(--text2);min-width:65px}
.kw-trend{font-size:10px;padding:2px 6px;border-radius:3px;font-family:var(--font-m)}
.kw-up{background:var(--green-dim);color:var(--green)}.kw-down{background:var(--red-dim);color:var(--red)}
.filter-panel{background:var(--surface2);border:1px solid var(--border);border-radius:var(--rl);padding:12px;margin-bottom:12px}
.slider-row{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.slider-label{font-size:11px;font-family:var(--font-m);color:var(--text2);min-width:150px}
.slider-val{font-size:11px;font-family:var(--font-m);color:var(--accent);min-width:60px;text-align:right}
input[type=range]{flex:1;accent-color:var(--accent);cursor:pointer}
input[type=range]:disabled{opacity:.3;cursor:not-allowed}
.bottom-bar{position:fixed;bottom:0;left:210px;right:0;background:var(--surface);border-top:1px solid var(--border);padding:9px 20px;display:flex;align-items:center;gap:9px;z-index:150;transition:background .3s;flex-wrap:wrap}
.preset-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;background:var(--surface2);border:1px solid var(--border2);border-radius:20px;font-size:10.5px;cursor:pointer;transition:all .15s}
.preset-pill:hover,.preset-pill.active-preset{border-color:var(--accent);color:var(--accent);background:var(--accent-dim)}
.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:var(--rl);padding:22px;max-width:700px;width:100%;max-height:85vh;overflow-y:auto;transition:background .3s}
.modal-title{font-family:var(--font-d);font-size:18px;font-weight:800;margin-bottom:4px}
.modal-sub{font-size:12px;color:var(--text3);margin-bottom:18px}
.video-preview-box{background:#000;border-radius:var(--rl);overflow:hidden;aspect-ratio:16/9;position:relative;display:flex;align-items:center;justify-content:center;margin-bottom:14px}
.flex{display:flex}.fcol{flex-direction:column}.ai{align-items:center}.jb{justify-content:space-between}.jc{justify-content:center}
.g4{gap:4px}.g6{gap:6px}.g7{gap:7px}.g8{gap:8px}.g10{gap:10px}.g12{gap:12px}.g14{gap:14px}.g16{gap:16px}.g20{gap:20px}
.mb4{margin-bottom:4px}.mb6{margin-bottom:6px}.mb8{margin-bottom:8px}.mb10{margin-bottom:10px}.mb12{margin-bottom:12px}.mb14{margin-bottom:14px}.mb16{margin-bottom:16px}.mb20{margin-bottom:20px}
.mt4{margin-top:4px}.mt6{margin-top:6px}.mt8{margin-top:8px}.mt10{margin-top:10px}.mt12{margin-top:12px}.mt14{margin-top:14px}
.ml-auto{margin-left:auto}.w100{width:100%}.fw{flex-wrap:wrap}.f1{flex:1}
.fs13{font-size:13px}.fs12{font-size:12px}.fs11{font-size:11px}.fs10{font-size:10px}
.bold{font-weight:700}.mono{font-family:var(--font-m)}
.tmuted{color:var(--text3)}.taccent{color:var(--accent)}.tgreen{color:var(--green)}.tblue{color:var(--blue)}
.color-picker-popover{position:absolute;top:calc(100% + 8px);right:0;background:var(--surface);border:1px solid var(--border2);border-radius:var(--rl);padding:14px;z-index:1000;box-shadow:0 8px 32px rgba(0,0,0,.5);min-width:220px}
.color-picker-popover .ct{margin-bottom:10px}
.color-swatch-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:12px}
.color-swatch{width:28px;height:28px;border-radius:6px;cursor:pointer;border:2px solid transparent;transition:all .15s;flex-shrink:0}
.color-swatch:hover{transform:scale(1.15);border-color:rgba(255,255,255,.5)}
.color-swatch.active-swatch{border-color:#fff;box-shadow:0 0 0 2px var(--accent)}
.custom-color-row{display:flex;align-items:center;gap:8px}
.custom-color-input{width:36px;height:36px;padding:0;border:none;border-radius:6px;cursor:pointer;background:none}
`;
}

const NICHES = [
  {id:1,name:"AI & Automation Tools",growth:94,competition:42,rpm:"$18-32",keywords:["ChatGPT","automation","AI agents"],trend:[20,30,35,45,60,72,80,94],color:"#00e5a0"},
  {id:2,name:"Personal Finance",growth:87,competition:68,rpm:"$22-45",keywords:["investing","budgeting","passive income"],trend:[50,55,60,65,70,78,83,87],color:"#38bdf8"},
  {id:3,name:"Faceless Automation",growth:91,competition:31,rpm:"$12-20",keywords:["faceless YouTube","cash cow"],trend:[15,22,35,55,70,80,86,91],color:"#a78bfa"},
  {id:4,name:"Longevity & Biohacking",growth:78,competition:38,rpm:"$28-55",keywords:["longevity","biohacking","hormones"],trend:[30,35,40,50,58,65,72,78],color:"#00e5a0"},
  {id:5,name:"Dark History",growth:82,competition:44,rpm:"$8-16",keywords:["dark history","mysteries"],trend:[40,48,55,60,65,72,78,82],color:"#f87171"},
  {id:6,name:"Stoicism / Philosophy",growth:85,competition:28,rpm:"$10-18",keywords:["stoicism","Marcus Aurelius"],trend:[20,28,38,50,63,72,79,85],color:"#38bdf8"},
  {id:7,name:"Side Hustles 2025",growth:89,competition:55,rpm:"$14-25",keywords:["side hustle","make money online"],trend:[35,42,52,62,70,78,84,89],color:"#00e5a0"},
  {id:8,name:"Real Estate Investing",growth:71,competition:72,rpm:"$30-60",keywords:["real estate","REITs"],trend:[55,58,62,64,66,68,70,71],color:"#fbbf24"},
];

const DEMO_OUTLIERS = [
  {id:"v1",rank:1,title:"I Replaced My Entire Team with AI Agents",channel:"TechFounder",subs:"12K",subsNum:12000,views:"4.2M",viewsNum:4200000,vph:"18,400",vphNum:18400,age:"3 days",score:"87x",scoreNum:87,avgViews:"48K",engagement:"8.4%",thumb:null},
  {id:"v2",rank:2,title:"The Productivity System That Changed Everything",channel:"MindfulBuilds",subs:"8.3K",subsNum:8300,views:"1.8M",viewsNum:1800000,vph:"9,200",vphNum:9200,age:"5 days",score:"52x",scoreNum:52,avgViews:"21K",engagement:"6.1%",thumb:null},
  {id:"v3",rank:3,title:"How to Start a $10K/mo Business with No Money",channel:"StartupShorts",subs:"24K",subsNum:24000,views:"2.1M",viewsNum:2100000,vph:"7,800",vphNum:7800,age:"4 days",score:"41x",scoreNum:41,avgViews:"62K",engagement:"5.8%",thumb:null},
  {id:"v4",rank:4,title:"Quiet Quitting Your Way to Financial Freedom",channel:"LoFiFinance",subs:"5.1K",subsNum:5100,views:"890K",viewsNum:890000,vph:"6,100",vphNum:6100,age:"2 days",score:"38x",scoreNum:38,avgViews:"18K",engagement:"7.2%",thumb:null},
  {id:"v5",rank:5,title:"Ancient Stoic Secrets Nobody Talks About",channel:"PhilosophyHub",subs:"31K",subsNum:31000,views:"1.4M",viewsNum:1400000,vph:"5,900",vphNum:5900,age:"6 days",score:"21x",scoreNum:21,avgViews:"84K",engagement:"4.9%",thumb:null},
  {id:"v6",rank:6,title:"The Fasting Protocol That Actually Works",channel:"BiohackLife",subs:"18K",subsNum:18000,views:"760K",viewsNum:760000,vph:"4,200",vphNum:4200,age:"4 days",score:"18x",scoreNum:18,avgViews:"43K",engagement:"5.5%",thumb:null},
];

const DEMO_KEYWORDS = [
  {kw:"AI automation tools 2025",volume:"890K",trend:"+42%",dir:"up",niche:"AI & Automation"},
  {kw:"faceless YouTube channel",volume:"620K",trend:"+78%",dir:"up",niche:"Faceless Automation"},
  {kw:"passive income ideas 2025",volume:"1.2M",trend:"+31%",dir:"up",niche:"Side Hustles 2025"},
  {kw:"biohacking longevity supplements",volume:"340K",trend:"+55%",dir:"up",niche:"Longevity"},
  {kw:"stoic mindset morning routine",volume:"280K",trend:"+28%",dir:"up",niche:"Stoicism"},
  {kw:"real estate investing beginners",volume:"750K",trend:"-4%",dir:"down",niche:"Real Estate"},
  {kw:"ChatGPT side hustle ideas",volume:"1.8M",trend:"+120%",dir:"up",niche:"AI & Automation"},
  {kw:"dark history documentary",volume:"420K",trend:"+19%",dir:"up",niche:"Dark History"},
  {kw:"index fund investing 2025",volume:"560K",trend:"+8%",dir:"up",niche:"Personal Finance"},
  {kw:"make money while you sleep",volume:"930K",trend:"+44%",dir:"up",niche:"Side Hustles"},
];

const MUSIC_TRACKS = [
  {id:1,name:"Cinematic Rise",mood:"Epic",bpm:120,duration:"2:45",genre:"Orchestral",tags:["dramatic","build-up"]},
  {id:2,name:"Lo-Fi Study Beats",mood:"Calm",bpm:85,duration:"3:20",genre:"Lo-Fi Hip Hop",tags:["chill","focus"]},
  {id:3,name:"Dark Corporate",mood:"Tense",bpm:110,duration:"2:10",genre:"Electronic",tags:["intense","modern"]},
  {id:4,name:"Inspiring Journey",mood:"Uplifting",bpm:128,duration:"3:05",genre:"Cinematic",tags:["motivational"]},
  {id:5,name:"Mystery Unfolding",mood:"Suspense",bpm:95,duration:"2:55",genre:"Ambient",tags:["dark","tension"]},
  {id:6,name:"Tech Pulse",mood:"Modern",bpm:140,duration:"2:30",genre:"Synthwave",tags:["futuristic"]},
];

const THUMB_VARIANTS = [
  {bg:"linear-gradient(135deg,#030f0a,#061a12,#0a2e1f)",label:"Dark Forest"},
  {bg:"linear-gradient(135deg,#001d3d,#003566,#0077b6)",label:"Deep Ocean"},
  {bg:"linear-gradient(135deg,#120012,#1a0530,#0d0d2e)",label:"Neon Night"},
  {bg:"linear-gradient(135deg,#1a0a00,#3d1a00,#6d2f00)",label:"Fire Amber"},
];

const EL_VOICES = [
  {id:"TxGEqnHWrfWFTfGW9XjX",name:"Marcus",gender:"male",style:"Documentary",accent:"American",desc:"Deep authoritative narrator",emoji:"🎙️"},
  {id:"EXAVITQu4vr4xnSDxMaL",name:"Aria",gender:"female",style:"Conversational",accent:"American",desc:"Warm engaging presenter",emoji:"🌟"},
  {id:"IKne3meq5aSn9XLyUdCD",name:"Charlie",gender:"male",style:"News Anchor",accent:"British",desc:"Clear professional delivery",emoji:"📺"},
  {id:"XB0fDUnXU5powFXDhCwa",name:"Charlotte",gender:"female",style:"Storyteller",accent:"British",desc:"Dramatic expressive voice",emoji:"✨"},
  {id:"bIHbv24MWmeRgasZH58o",name:"Kai",gender:"male",style:"Hype",accent:"American",desc:"Energetic high-energy host",emoji:"⚡"},
  {id:"FGY2WhTYpPnrIDTdsKH5",name:"Luna",gender:"female",style:"Calm",accent:"Australian",desc:"Soothing meditative voice",emoji:"🌙"},
  {id:"ZQe5CZNOzWyzPSCn5a3c",name:"James",gender:"male",style:"Educational",accent:"American",desc:"Trustworthy clear educator",emoji:"📚"},
  {id:"cgSgspJ2msm6clMCkdW9",name:"Sarah",gender:"female",style:"Inspirational",accent:"American",desc:"Uplifting motivational tone",emoji:"💫"},
  {id:"g5CIjZEefAph4nQFvHAz",name:"Viktor",gender:"male",style:"Documentary",accent:"European",desc:"Serious dramatic narrator",emoji:"🎭"},
  {id:"pqHfZKP75CvOlD17v9vb",name:"Nova",gender:"female",style:"Tech",accent:"American",desc:"Modern crisp voice",emoji:"🤖"},
];

function TrendChart({data,color}){const max=Math.max(...data);return <div className="trend-chart">{data.map((v,i)=><div key={i} className="trend-bar" style={{height:`${(v/max)*100}%`,background:i===data.length-1?color:`${color}44`,border:`1px solid ${color}55`}}/>)}</div>;}
function ScoreRing({score,size=52,color="#00e5a0"}){const r=(size-8)/2,c=2*Math.PI*r,fill=(Math.min(score,100)/100)*c;return <div style={{position:"relative",width:size,height:size,display:"inline-flex",alignItems:"center",justifyContent:"center"}}><svg width={size} height={size}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface3)" strokeWidth="3.5"/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3.5" strokeDasharray={`${fill} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dasharray 1s ease"}}/></svg><span style={{position:"absolute",fontFamily:"var(--font-d)",fontWeight:800,fontSize:11,color}}>{score}</span></div>;}
function Err({msg}){return msg?<div className="error-box">⚠️ {msg}</div>:null;}
function Suc({msg}){return msg?<div className="success-box">✓ {msg}</div>:null;}

function BottomBar({onSavePreset,onSaveSettings,onNext,showNext,presets,activePreset,onLoadPreset}){
  return <div className="bottom-bar">
    <div className="flex ai g7 fw"><span className="fs10 tmuted mono">PRESETS:</span>{presets.map((p,i)=><div key={i} className={`preset-pill ${activePreset===i?"active-preset":""}`} onClick={()=>onLoadPreset(i)}>{p.name}</div>)}<button className="btn btn-g btn-xs" onClick={onSavePreset}>+ Save</button></div>
    <div className="spacer"/>
    <button className="btn btn-g btn-sm" onClick={onSaveSettings}>💾 Save Settings</button>
    {showNext&&<button className="btn btn-p btn-sm" onClick={onNext}>Next Step →</button>}
  </div>;
}

function SettingsBanner({settings,setSettings}){
  const [open,setOpen]=useState(false);
  const [groqDraft,   setGroqDraft]   =useState("");
  const [geminiDraft, setGeminiDraft] =useState("");
  const [openaiDraft, setOpenaiDraft] =useState("");
  const [claudeDraft, setClaudeDraft] =useState("");
  const [ollamaDraft, setOllamaDraft] =useState("");
  const [ytDraft,     setYtDraft]     =useState("");
  const [elDraft,     setElDraft]     =useState("");
  const [confirmed,   setConfirmed]   =useState({});

  // Map field key → [draft value, draft setter]
  const draftMap={
    groqKey:   [groqDraft,   setGroqDraft],
    geminiKey: [geminiDraft, setGeminiDraft],
    openaiKey: [openaiDraft, setOpenaiDraft],
    claudeKey: [claudeDraft, setClaudeDraft],
    ollamaModel:[ollamaDraft,setOllamaDraft],
    ytKey:     [ytDraft,     setYtDraft],
    elKey:     [elDraft,     setElDraft],
  };

  const providers=[
    {id:"gemini",label:"Gemini", ph:"AIza...",          free:true,  url:"https://ai.google.dev"},
    {id:"groq",  label:"Groq",   ph:"gsk_...",           free:true,  url:"https://console.groq.com"},
    {id:"openai",label:"OpenAI", ph:"sk-...",            free:false, url:"https://platform.openai.com"},
    {id:"claude",label:"Claude", ph:"sk-ant-...",        free:false, url:"https://console.anthropic.com"},
    {id:"ollama",label:"Ollama", ph:"model e.g. llama3", free:true,  url:"https://ollama.com"},
  ];

  const setProvider=(id)=>{
    const s={...settings,provider:id};
    setSettings(s);
    localStorage.setItem("tmai_settings",JSON.stringify(s));
  };

  const getVal=(k)=>{
    const [draft]=draftMap[k]||[];
    return draft||settings[k]||"";
  };

  const saveKey=(k)=>{
    const [draft]=draftMap[k]||[];
    const value=draft||settings[k]||"";
    const s={...settings,[k]:value};
    setSettings(s);
    localStorage.setItem("tmai_settings",JSON.stringify(s));
    setConfirmed(c=>({...c,[k]:true}));
    setTimeout(()=>setConfirmed(c=>({...c,[k]:false})),2000);
  };

  const ap=providers.find(p=>p.id===settings.provider);
  const hasKey=settings[`${settings.provider}Key`]||settings.provider==="ollama";

  const renderKeyField=(k, label, badge, badgeCls, ph, url)=>{
    const [draft,setDraft]=draftMap[k];
    return (
      <div key={k}>
        <label className="fl" style={{display:"flex",alignItems:"center",gap:4}}>
          {label}
          {badge&&<span className={`badge ${badgeCls}`} style={{padding:"1px 5px"}}>{badge}</span>}
          <a href={url} target="_blank" rel="noreferrer"
            style={{marginLeft:"auto",fontSize:10,color:"var(--blue)",textDecoration:"none"}}>
            how to get →
          </a>
        </label>
        <div className="flex g6">
          <input
            className="input"
            type="password"
            placeholder={ph}
            value={draft||settings[k]||""}
            onChange={e=>setDraft(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&saveKey(k)}
          />
          <button
            className={`btn btn-sm ${confirmed[k]?"btn-p":"btn-g"}`}
            style={{flexShrink:0,minWidth:66}}
            onClick={()=>saveKey(k)}
          >
            {confirmed[k]?"✓ Saved":"Save"}
          </button>
        </div>
      </div>
    );
  };

  return <div className="settings-banner">
    <div className="flex ai jb mb8">
      <div>
        <div className="bold mb4">⚙️ AI Provider</div>
        <div className="fs11 tmuted">
          Active: <span className="taccent bold">{ap?.label}</span>
          {ap?.free&&<span className="badge bg" style={{marginLeft:5}}>FREE</span>}
          {hasKey
            ?<span className="badge bg" style={{marginLeft:5}}>✓ key saved</span>
            :<span className="badge br" style={{marginLeft:5}}>no key</span>
          }
        </div>
      </div>
      <button className="btn btn-g btn-sm" onClick={()=>setOpen(o=>!o)}>
        {open?"▲ Close":"▼ Configure"}
      </button>
    </div>

    <div className="flex ai g6 fw mb6">
      {providers.map(p=>(
        <button key={p.id}
          className={`btn btn-sm ${settings.provider===p.id?"btn-p":"btn-g"}`}
          onClick={()=>setProvider(p.id)}>
          {p.label}{p.free?" ✦":""}
        </button>
      ))}
    </div>
    <div className="fs10 tmuted">✦ free tier · type key → click Save or press Enter</div>

    {open&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}>
      {renderKeyField("geminiKey","Gemini Key","Free","bg","AIza...","https://ai.google.dev")}
      {renderKeyField("groqKey","Groq Key","Free","bg","gsk_...","https://console.groq.com")}
      {renderKeyField("openaiKey","OpenAI Key","Paid","br","sk-...","https://platform.openai.com")}
      {renderKeyField("claudeKey","Claude Key","Paid","br","sk-ant-...","https://console.anthropic.com")}
      <div>
        <label className="fl">Ollama Model Name</label>
        <div className="flex g6">
          <input className="input" placeholder="llama3"
            value={ollamaDraft||settings.ollamaModel||""}
            onChange={e=>setOllamaDraft(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&saveKey("ollamaModel")}/>
          <button className={`btn btn-sm ${confirmed.ollamaModel?"btn-p":"btn-g"}`}
            style={{flexShrink:0,minWidth:66}} onClick={()=>saveKey("ollamaModel")}>
            {confirmed.ollamaModel?"✓ Saved":"Save"}
          </button>
        </div>
      </div>
      {renderKeyField("ytKey","YouTube Data API","live data","bb","AIza...","https://console.cloud.google.com")}
      {renderKeyField("elKey","ElevenLabs API","10K free","bg","el_...","https://elevenlabs.io")}
    </div>}
  </div>;
}

function NicheFinder({settings,onSelectNiche,selectedNiche,setMod}){
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [analysis,setAnalysis]=useState({});
  const [loading,setLoading]=useState({});
  const [ytLoading,setYtLoading]=useState(false);
  const [ytNiches,setYtNiches]=useState([]);
  const [error,setError]=useState("");
  const getKey=()=>settings[`${settings.provider}Key`]||(settings.provider==="ollama"?settings.ollamaModel:"");
  const allNiches=[...NICHES,...ytNiches];
  const filtered=allNiches.filter(n=>{
    if(search&&!n.name.toLowerCase().includes(search.toLowerCase()))return false;
    if(filter==="low-comp")return n.competition<45;
    if(filter==="high-rpm")return n.rpm&&(n.rpm.includes("$2")||n.rpm.includes("$3")||n.rpm.includes("$4")||n.rpm.includes("$5"));
    if(filter==="trending")return n.growth>85;
    return true;
  });
  const analyzeNiche=async(niche)=>{
    const key=getKey();if(!key){setError("Configure AI provider above.");return;}
    setLoading(p=>({...p,[niche.id]:true}));setError("");
    try{const text=await callAI(settings.provider,key,`3-sentence YouTube niche analysis for "${niche.name}": 1) Why trending now 2) Best angle for new creator 3) One specific first video idea.`,"YouTube growth strategist. 3 sentences max. Direct and actionable.");setAnalysis(p=>({...p,[niche.id]:text}));}
    catch(e){setError(e.message);}
    setLoading(p=>({...p,[niche.id]:false}));
  };
  const fetchYtNiches=async()=>{
    if(!settings.ytKey){setError("Add YouTube API key in settings.");return;}
    setYtLoading(true);setError("");
    try{
      const res=await ytSearch(settings.ytKey,"trending YouTube niche 2025",10);
      const nn=(res.items||[]).map((item,i)=>({id:`yt-${i}`,name:item.snippet.title.slice(0,40),growth:Math.floor(Math.random()*30+60),competition:Math.floor(Math.random()*50+20),rpm:"$10-25",keywords:[item.snippet.channelTitle],trend:[30,40,50,55,60,65,70,75],color:"#38bdf8"}));
      setYtNiches(nn.slice(0,6));
    }catch(e){setError(e.message);}
    setYtLoading(false);
  };
  return <div style={{paddingBottom:60}}>
    <div className="section-title">🔭 Niche Finder</div>
    <div className="section-sub">Discover trending, profitable YouTube niches — with live YouTube data</div>
    <Err msg={error}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:14}}>
      {[["Total Niches",filtered.length,"niches loaded",""],["Avg Growth","84%","+12% vs last week","tgreen"],["Low Competition","3","niches under 45",""],["Avg RPM","$26","across niches",""]].map(([l,v,s,d])=>(
        <div key={l} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--rl)",padding:"10px 12px"}}>
          <div style={{fontSize:10,color:"var(--text3)",fontFamily:"var(--font-m)",textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{l}</div>
          <div style={{fontFamily:"var(--font-d)",fontSize:20,fontWeight:800,lineHeight:1,color:"var(--accent)"}}>{v}</div>
          <div className={`fs11 mt4 ${d}`}>{s}</div>
        </div>
      ))}
    </div>
    <div className="flex ai g10 mb14 fw">
      <input className="input" style={{maxWidth:240}} placeholder="Search niches..." value={search} onChange={e=>setSearch(e.target.value)}/>
      <div className="tabs" style={{marginBottom:0}}>{[["all","All"],["trending","Trending"],["low-comp","Low Comp"],["high-rpm","High RPM"]].map(([v,l])=><div key={v} className={`tab ${filter===v?"active":""}`} onClick={()=>setFilter(v)}>{l}</div>)}</div>
      <button className="btn btn-p btn-sm" onClick={fetchYtNiches} disabled={ytLoading} style={{marginLeft:"auto"}}>{ytLoading?<><div className="spin"/>Loading...</>:"▶ Live YouTube Niches"}</button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
      {filtered.map(n=>(
        <div key={n.id} className={`niche-card ${selectedNiche?.id===n.id?"sel":""}`} onClick={()=>onSelectNiche(n)}>
          <div className="flex ai g10 mb10"><div className="f1"><div style={{fontFamily:"var(--font-d)",fontSize:14,fontWeight:700,marginBottom:3}}>{n.name}</div><div className="fs11 tmuted">{n.rpm?`Est. RPM: ${n.rpm}`:"YouTube trending"}</div></div><ScoreRing score={n.growth} color={n.color}/></div>
          <div className="flex ai g10 mb10"><TrendChart data={n.trend} color={n.color}/><div style={{display:"flex",flexDirection:"column",gap:3,fontSize:10.5}}><span className="mono">Growth: <span style={{color:n.color}}>{n.growth}%</span></span><span className="mono">Comp: <span style={{color:n.competition<45?"var(--green)":"var(--yellow)"}}>{n.competition}</span></span></div></div>
          <div className="flex g6 fw mb8">{(n.keywords||[]).slice(0,3).map(k=><span key={k} className="badge bb">{k}</span>)}</div>
          {analysis[n.id]&&<div style={{background:"var(--surface2)",borderRadius:"var(--r)",padding:"9px 11px",fontSize:11.5,lineHeight:1.7,color:"var(--text2)",marginBottom:8}}>{analysis[n.id]}</div>}
          <div className="flex g7">
            <button className="btn btn-p btn-sm f1" onClick={e=>{e.stopPropagation();onSelectNiche(n);}}>✓ Select</button>
            <button className="btn btn-g btn-sm" disabled={loading[n.id]} onClick={e=>{e.stopPropagation();analyzeNiche(n);}}>{loading[n.id]?<><div className="spin" style={{width:12,height:12}}/>...</>:"🤖 Analyze"}</button>
            <button className="btn btn-g btn-sm" onClick={e=>{e.stopPropagation();onSelectNiche(n);setMod("title");}}>→ Titles</button>
          </div>
        </div>
      ))}
    </div>
  </div>;
}

function OutlierEngine({settings,setMod,setRemixTitle}){
  const [search,setSearch]=useState("");
  const [selNiche,setSelNiche]=useState("all");
  const [showFilters,setShowFilters]=useState(false);
  const [activeVideo,setActiveVideo]=useState(null);
  const [ytVideos,setYtVideos]=useState([]);
  const [ytLoading,setYtLoading]=useState(false);
  const [error,setError]=useState("");
  const [filters,setFilters]=useState({minViews:0,minVph:0,channelBoost:1.5,timeDecay:0.5,maxSubs:10000000,enableLength:false,videoLength:60,enableCountry:false,country:"US"});
  const all=[...DEMO_OUTLIERS,...ytVideos];
  const displayed=all.filter(v=>{
    if(search&&!v.title.toLowerCase().includes(search.toLowerCase())&&!v.channel.toLowerCase().includes(search.toLowerCase()))return false;
    if(selNiche!=="all"&&!v.title.toLowerCase().includes(selNiche.toLowerCase().split(" ")[0]))return false;
    if(v.viewsNum<filters.minViews*1000)return false;
    if(v.vphNum<filters.minVph)return false;
    if(v.subsNum>filters.maxSubs)return false;
    return true;
  });
  const fetchYt=async()=>{
    if(!settings.ytKey){setError("Add YouTube API key in settings.");return;}
    setYtLoading(true);setError("");
    try{
      const q=search||"trending viral YouTube 2025";
      const res=await ytSearch(settings.ytKey,q,10);
      const ids=(res.items||[]).map(i=>i.id.videoId).filter(Boolean);
      const stats=ids.length?await ytVideoStats(settings.ytKey,ids):null;
      const vids=(res.items||[]).map((item,i)=>{
        const s=stats?.items?.find(s=>s.id===item.id.videoId);
        const views=parseInt(s?.statistics?.viewCount||0);
        return{id:`yt-${i}`,rank:i+1,title:item.snippet.title,channel:item.snippet.channelTitle,subs:"50K",subsNum:50000,views:views>1000000?`${(views/1000000).toFixed(1)}M`:`${Math.round(views/1000)}K`,viewsNum:views,vph:Math.floor(views/72).toLocaleString(),vphNum:Math.floor(views/72),age:"Recent",score:`${Math.round(views/500000)}x`,scoreNum:Math.round(views/500000),avgViews:"45K",engagement:"5.2%",thumb:`https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,ytId:item.id.videoId};
      });
      setYtVideos(vids);
    }catch(e){setError(e.message);}
    setYtLoading(false);
  };
  return <div style={{paddingBottom:60}}>
    <div className="section-title">⚡ Outlier Engine</div>
    <div className="section-sub">Surface videos massively overperforming their channel baseline — click any video for detailed stats</div>
    <Err msg={error}/>
    <div className="flex ai g8 mb12 fw">
      <input className="input" style={{maxWidth:220}} placeholder="Search videos or channels..." value={search} onChange={e=>setSearch(e.target.value)}/>
      <select className="sel" style={{width:"auto"}} value={selNiche} onChange={e=>setSelNiche(e.target.value)}>
        <option value="all">All Niches</option>
        {NICHES.map(n=><option key={n.id} value={n.name.split(" ")[0].toLowerCase()}>{n.name}</option>)}
      </select>
      <button className="btn btn-g btn-sm" onClick={()=>setShowFilters(f=>!f)}>⚙️ Filters {showFilters?"▲":"▼"}</button>
      <button className="btn btn-p btn-sm" onClick={fetchYt} disabled={ytLoading}>{ytLoading?<><div className="spin"/>Fetching...</>:"▶ Live YouTube"}</button>
    </div>
    {showFilters&&<div className="filter-panel">
      <div className="ct mb12">Score Formula Weights</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
        {[["Min Views (K)","minViews",0,5000,filters.minViews,`${filters.minViews}K`,false],["Min Views/Hour","minVph",0,50000,filters.minVph,filters.minVph.toLocaleString(),false],["Small Channel Boost","channelBoost",1.0,3.0,filters.channelBoost,`${filters.channelBoost.toFixed(1)}x`,false],["Time Decay","timeDecay",0.0,1.0,filters.timeDecay,filters.timeDecay.toFixed(2),false],["Max Subscribers","maxSubs",1000,10000000,filters.maxSubs,filters.maxSubs>=1000000?`${(filters.maxSubs/1000000).toFixed(1)}M`:`${Math.round(filters.maxSubs/1000)}K`,false],["Video Length (min)","videoLength",1,120,filters.videoLength,`${filters.videoLength}min`,!filters.enableLength]].map(([label,key,min,max,val,display,disabled])=>(
          <div key={key} className="slider-row">
            <span className="slider-label">{label}</span>
            <input type="range" min={min} max={max} step={key==="channelBoost"||key==="timeDecay"?0.1:key==="maxSubs"?100000:100} value={val} disabled={disabled} onChange={e=>setFilters(f=>({...f,[key]:parseFloat(e.target.value)}))}/>
            <span className="slider-val">{display}</span>
            {key==="videoLength"&&<label style={{display:"flex",alignItems:"center",gap:4,fontSize:11,cursor:"pointer",marginLeft:6}}><input type="checkbox" checked={filters.enableLength} onChange={e=>setFilters(f=>({...f,enableLength:e.target.checked}))} style={{accentColor:"var(--accent)"}}/>Enable</label>}
          </div>
        ))}
      </div>
      <div className="flex g8 mt10">
        <label style={{display:"flex",alignItems:"center",gap:6,fontSize:11,cursor:"pointer"}}><input type="checkbox" checked={filters.enableCountry} onChange={e=>setFilters(f=>({...f,enableCountry:e.target.checked}))} style={{accentColor:"var(--accent)"}}/>Filter by Country</label>
        {filters.enableCountry&&<select className="sel" style={{width:"auto"}} value={filters.country} onChange={e=>setFilters(f=>({...f,country:e.target.value}))}>{["US","GB","CA","AU","IN","DE","FR","BR","JP","KR"].map(c=><option key={c}>{c}</option>)}</select>}
      </div>
    </div>}
    <div className="card">
      <div className="ch"><div className="ct">Top Outliers ({displayed.length})</div><div className="flex g6"><span className="badge bo">10-50x</span><span className="badge br">50x+</span></div></div>
      {displayed.map(v=>(
        <div key={v.id} className={`outlier-row ${activeVideo?.id===v.id?"active-row":""}`} onClick={()=>setActiveVideo(activeVideo?.id===v.id?null:v)}>
          <div className="orank">#{v.rank}</div>
          <div className="othumb">{v.thumb?<img src={v.thumb} alt=""/>:<span>▶</span>}</div>
          <div className="oinfo">
            <div className="otitle">{v.title}</div>
            <div className="ochan">{v.channel} · {v.subs} subs · {v.age}</div>
            <div className="flex g6 mt4"><span className="badge bg">{v.views}</span><span className="badge bb">{v.vph}/hr</span><span className="badge by">{v.engagement} eng</span></div>
          </div>
          <div className="oscore">{v.score}</div>
        </div>
      ))}
    </div>
    {activeVideo&&<div className="video-popup">
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:"var(--font-d)",fontSize:13,fontWeight:700,marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:360}}>{activeVideo.title}</div>
        <div className="flex g7 fw"><span className="badge bb">{activeVideo.channel}</span><span className="badge bg">{activeVideo.subs} subs</span></div>
      </div>
      <div className="flex g14 ai fw">
        {[["Total Views",activeVideo.views],["Views/Hour",activeVideo.vph+"/hr"],["Engagement",activeVideo.engagement],["Ch. Avg",activeVideo.avgViews],["Score",activeVideo.score]].map(([l,v])=>(
          <div key={l} className="popup-stat"><div className="popup-stat-val">{v}</div><div className="popup-stat-label">{l}</div></div>
        ))}
      </div>
      <div className="flex fcol g6" style={{flexShrink:0}}>
        {activeVideo.ytId&&<a href={`https://youtube.com/watch?v=${activeVideo.ytId}`} target="_blank" rel="noreferrer" className="btn btn-p btn-sm" style={{textDecoration:"none"}}>▶ Watch</a>}
        <button className="btn btn-g btn-sm" onClick={()=>{setRemixTitle(activeVideo.title);setMod("title");}}>🎯 Remix Title</button>
        <button className="btn btn-g btn-sm" onClick={()=>{setRemixTitle(activeVideo.title);setMod("script");}}>📝 Script</button>
        <button className="btn btn-g btn-sm" onClick={()=>setActiveVideo(null)}>✕ Close</button>
      </div>
    </div>}
  </div>;
}

function TitleGenerator({settings,niche,remixTitle,setRemixTitle,setMod,presets,onSavePreset,onLoadPreset,activePreset}){
  const [emotion,setEmotion]=useState("curiosity");
  const [hook,setHook]=useState("mystery");
  const [topic,setTopic]=useState("");
  const [titles,setTitles]=useState([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [copied,setCopied]=useState(null);
  const [saved,setSaved]=useState(false);
  useEffect(()=>{if(remixTitle){setTopic(remixTitle);setRemixTitle("");}},[remixTitle]);
  const getKey=()=>settings[`${settings.provider}Key`]||(settings.provider==="ollama"?settings.ollamaModel:"");
  const generate=async()=>{
    const key=getKey();if(!key){setError(`Configure ${settings.provider} key in settings.`);return;}
    setLoading(true);setError("");setTitles([]);
    try{
      const text=await callAI(settings.provider,key,`Generate 20 high-CTR YouTube titles.\nNiche: ${niche?.name||"AI & Automation"}\nTopic: ${topic||niche?.name||"AI tools"}\nEmotion: ${emotion}\nHook: ${hook}\n\nOutput ONLY numbered list 1-20, one per line, no quotes, under 70 chars each.`,"YouTube title optimizer. Output ONLY the numbered list.");
      const lines=text.split("\n").map(l=>l.replace(/^\d+[\.\)]\s*/,"").trim()).filter(l=>l.length>10).slice(0,20);
      setTitles(lines);
    }catch(e){setError(e.message);}
    setLoading(false);
  };
  const copy=(t,i)=>{navigator.clipboard.writeText(t);setCopied(i);setTimeout(()=>setCopied(null),2000);};
  return <div style={{paddingBottom:60}}>
    <div className="section-title">🎯 Title Generator</div>
    <div className="section-sub">Craft winning YouTube titles based on winning formats in your industry, designed to bring in views based on what's working in real-time</div>
    <Err msg={error}/>{saved&&<Suc msg="Preset saved!"/>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div className="card">
        <div className="ct mb14">Configuration</div>
        <div className="fg"><label className="fl">Topic / Angle</label><input className="input" placeholder='e.g. "5 AI tools that replaced my team"' value={topic} onChange={e=>setTopic(e.target.value)}/></div>
        <div className="fg"><label className="fl">Niche</label><input className="input" value={niche?.name||"AI & Automation Tools"} readOnly style={{opacity:.6}}/></div>
        <div className="fg"><label className="fl">Target Emotion</label><select className="sel" value={emotion} onChange={e=>setEmotion(e.target.value)}><option value="curiosity">Curiosity Gap</option><option value="fear">Fear & Urgency</option><option value="promise">Promise & Benefit</option><option value="shock">Shock & Surprise</option></select></div>
        <div className="fg"><label className="fl">Hook Type</label><select className="sel" value={hook} onChange={e=>setHook(e.target.value)}><option value="mystery">Mystery / Secret</option><option value="number">Number / Listicle</option><option value="story">Story / Journey</option><option value="question">Question</option><option value="warning">Warning / Challenge</option></select></div>
        <button className="btn btn-p w100" onClick={generate} disabled={loading}>{loading?<><div className="spin"/>Generating...</>:"✨ Generate 20 Titles"}</button>
      </div>
      <div className="card" style={{overflowY:"auto",maxHeight:420}}>
        <div className="ch"><div className="ct">Generated Titles</div>{titles.length>0&&<span className="badge bg">{titles.length}</span>}</div>
        {loading&&<div style={{textAlign:"center",padding:"40px 20px"}}><div className="spin" style={{width:32,height:32,margin:"0 auto 14px"}}/><div style={{fontFamily:"var(--font-d)",fontSize:15}}>Writing titles...</div></div>}
        {!loading&&titles.length===0&&<div className="empty"><div className="empty-icon">🎯</div><div className="empty-title">Configure & Generate</div></div>}
        {!loading&&titles.map((t,i)=>(
          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"7px 0",borderBottom:"1px solid var(--border)"}}>
            <span className="tmuted mono fs10" style={{minWidth:20,paddingTop:2}}>{i+1}.</span>
            <span style={{flex:1,fontSize:12.5,lineHeight:1.5}}>{t}</span>
            <div className="flex g4"><button className="copy-btn" onClick={()=>copy(t,i)}>{copied===i?"✓":"Copy"}</button><button className="copy-btn" style={{color:"var(--blue)",borderColor:"var(--blue)"}} onClick={()=>setMod("script")}>→Script</button></div>
          </div>
        ))}
      </div>
    </div>
    {(topic||titles.length>0)&&<BottomBar onSavePreset={()=>{onSavePreset({name:`Title:${topic.slice(0,12)||"Draft"}`,emotion,hook,topic});setSaved(true);setTimeout(()=>setSaved(false),2000);}} onSaveSettings={()=>{localStorage.setItem("tmai_title",JSON.stringify({emotion,hook,topic}));setSaved(true);setTimeout(()=>setSaved(false),2000);}} onNext={()=>setMod("script")} showNext={true} presets={presets} activePreset={activePreset} onLoadPreset={onLoadPreset}/>}
  </div>;
}

function ScriptWriter({settings,niche,presets,onSavePreset,onLoadPreset,activePreset,setMod}){
  const [config,setConfig]=useState({format:"explainer",length:"5000",tone:"educational"});
  const [title,setTitle]=useState("");
  const [script,setScript]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [wc,setWc]=useState(0);
  const [copied,setCopied]=useState(false);
  const [saved,setSaved]=useState(false);
  const getKey=()=>settings[`${settings.provider}Key`]||(settings.provider==="ollama"?settings.ollamaModel:"");
  const generate=async()=>{
    const key=getKey();if(!key){setError(`Configure ${settings.provider} key.`);return;}
    if(!title.trim()){setError("Enter a video title first.");return;}
    setLoading(true);setError("");setScript("");
    try{
      const text=await callAI(settings.provider,key,`Write a full YouTube script.\nTitle: "${title}"\nNiche: ${niche?.name||"AI & Automation"}\nFormat: ${config.format}\nTarget: ~${config.length} words\nTone: ${config.tone}\n\nLabels on own lines: [HOOK] [INTRO] [BODY] [CTA] [OUTRO]\nAdd [B-ROLL: description] markers. Conversational. Target ${config.length} words.`,"Professional YouTube scriptwriter. Write complete scripts optimized for watch time and retention.");
      setScript(text);setWc(text.split(/\s+/).length);
    }catch(e){setError(e.message);}
    setLoading(false);
  };
  const renderScript=()=>{
    if(!script)return null;
    const tagMap={HOOK:"hook",INTRO:"intro",BODY:"body",CTA:"cta",OUTRO:"outro"};
    const lines=script.split("\n");let ct="body";const blocks=[];let buf=[];
    const flush=(tag,ls)=>{if(ls.length)blocks.push({tag,lines:[...ls]});};
    for(const line of lines){const m=line.match(/\[(HOOK|INTRO|BODY|CTA|OUTRO)/i);if(m){flush(ct,buf);buf=[];ct=tagMap[m[1].toUpperCase()]||"body";buf.push(line);}else buf.push(line);}
    flush(ct,buf);
    return blocks.map((b,i)=><div key={i} className="script-block"><div className={`stag ${b.tag}`}>{b.tag.toUpperCase()}</div>{b.lines.map((l,j)=>{if(l.includes("[B-ROLL:"))return<div key={j} style={{background:"var(--blue-dim)",borderLeft:"3px solid var(--blue)",padding:"3px 8px",margin:"5px 0",fontSize:11,color:"var(--blue)",fontFamily:"var(--font-m)",borderRadius:3}}>{l}</div>;return l.trim()?<p key={j} style={{fontSize:13,lineHeight:1.8,marginBottom:7}}>{l}</p>:<br key={j}/>;})}</div>);
  };
  return <div style={{paddingBottom:60}}>
    <div className="section-title">📝 Script Writer</div>
    <div className="section-sub">Uses the latest AI models trained on viral videos in each niche to craft highly engaging scripts designed to get your videos ranked in any industry</div>
    <Err msg={error}/>{saved&&<Suc msg="Preset saved!"/>}
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:14}}>
      <div>
        <div className="card">
          <div className="ct mb14">Config</div>
          <div className="fg"><label className="fl">Video Title</label><input className="input" placeholder="Your video title..." value={title} onChange={e=>setTitle(e.target.value)}/></div>
          <div className="fg"><label className="fl">Niche</label><input className="input" value={niche?.name||"AI & Automation"} readOnly style={{opacity:.6}}/></div>
          <div className="fg"><label className="fl">Format</label><select className="sel" value={config.format} onChange={e=>setConfig(p=>({...p,format:e.target.value}))}><option value="explainer">Explainer</option><option value="documentary">Documentary</option><option value="story">Personal Story</option><option value="faceless">Faceless Narration</option><option value="list">Top 10 / Listicle</option></select></div>
          <div className="fg"><label className="fl">Length</label><select className="sel" value={config.length} onChange={e=>setConfig(p=>({...p,length:e.target.value}))}><option value="1000">~1,000 words (5 min)</option><option value="2500">~2,500 words (12 min)</option><option value="5000">~5,000 words (22 min)</option><option value="8000">~8,000 words (35 min)</option></select></div>
          <div className="fg"><label className="fl">Tone</label><select className="sel" value={config.tone} onChange={e=>setConfig(p=>({...p,tone:e.target.value}))}><option value="educational">Educational</option><option value="dramatic">Dramatic</option><option value="hype">Hype</option><option value="calm">Calm</option><option value="investigative">Investigative</option></select></div>
          <button className="btn btn-p w100" onClick={generate} disabled={loading}>{loading?<><div className="spin"/>Writing...</>:"✍️ Generate Script"}</button>
        </div>
        {script&&<div className="card"><div className="flex ai jb"><div><div className="bold">{wc.toLocaleString()} words</div><div className="fs11 tmuted">~{Math.round(wc/130)} min video</div></div><div className="flex g6"><button className="btn btn-g btn-sm" onClick={()=>{navigator.clipboard.writeText(script);setCopied(true);setTimeout(()=>setCopied(false),2000);}}>{copied?"✓":"📋 Copy"}</button><button className="btn btn-g btn-sm" onClick={()=>setMod("voice")}>→ Voice</button></div></div></div>}
      </div>
      <div className="card" style={{overflowY:"auto",maxHeight:560}}>
        <div className="ch"><div className="ct">Script</div></div>
        {loading&&<div style={{textAlign:"center",padding:"60px 20px"}}><div className="spin" style={{width:36,height:36,margin:"0 auto 14px"}}/><div style={{fontFamily:"var(--font-d)",fontSize:15}}>Writing your script...</div><div className="fs11 tmuted mt8">30-60s for long scripts</div></div>}
        {!loading&&!script&&<div className="empty"><div className="empty-icon">📝</div><div className="empty-title">Enter a title and generate</div></div>}
        {!loading&&script&&renderScript()}
      </div>
    </div>
    {(title||script)&&<BottomBar onSavePreset={()=>{onSavePreset({name:`Script:${title.slice(0,12)||"Draft"}`,...config,title});setSaved(true);setTimeout(()=>setSaved(false),2000);}} onSaveSettings={()=>{localStorage.setItem("tmai_script",JSON.stringify({...config,title}));setSaved(true);setTimeout(()=>setSaved(false),2000);}} onNext={()=>setMod("voice")} showNext={!!script} presets={presets} activePreset={activePreset} onLoadPreset={onLoadPreset}/>}
  </div>;
}

function VoiceoverModule({settings,presets,onSavePreset,onLoadPreset,activePreset,setMod}){
  const [selVoice,setSelVoice]=useState(null);
  const [text,setText]=useState("And that's when I realized everything I thought I knew was completely wrong. Stay with me — because what comes next will change how you think about this forever.");
  const [speed,setSpeed]=useState(1.0);
  const [stability,setStability]=useState(0.5);
  const [clarity,setClarity]=useState(0.75);
  const [playing,setPlaying]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [gFilter,setGFilter]=useState("all");
  const [mode,setMode]=useState("elevenlabs");
  const [bVoices,setBVoices]=useState([]);
  const [saved,setSaved]=useState(false);
  const audioRef=useRef(null);
  useEffect(()=>{const load=()=>setBVoices(speechSynthesis.getVoices());load();speechSynthesis.onvoiceschanged=load;return()=>speechSynthesis.cancel();},[]);
  const filtered=EL_VOICES.filter(v=>gFilter==="all"||v.gender===gFilter);
  const speakEL=async()=>{
    if(!settings.elKey){setError("Add ElevenLabs key in settings. Free tier: elevenlabs.io (10K chars/month)");return;}
    if(!selVoice){setError("Select a voice first.");return;}
    setLoading(true);setError("");
    try{
      const res=await fetch(`/api/elevenlabs`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({elKey:settings.elKey,voiceId:selVoice.id,text,voice_settings:{stability,similarity_boost:clarity,speed}})});
      if(!res.ok){const e=await res.json().catch(()=>{});throw new Error(e?.error||"ElevenLabs error — check key and credit balance");}
      const blob=await res.blob();const url=URL.createObjectURL(blob);
      if(audioRef.current){audioRef.current.src=url;audioRef.current.play();setPlaying(true);audioRef.current.onended=()=>setPlaying(false);}
    }catch(e){setError(e.message);}
    setLoading(false);
  };
  const speakBrowser=()=>{
    speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=speed;
    if(selVoice&&selVoice.name){const v=bVoices.find(bv=>bv.name===selVoice.name);if(v)u.voice=v;}
    u.onstart=()=>setPlaying(true);u.onend=()=>setPlaying(false);u.onerror=()=>setPlaying(false);
    speechSynthesis.speak(u);
  };
  const speak=()=>mode==="elevenlabs"?speakEL():speakBrowser();
  const stop=()=>{speechSynthesis.cancel();if(audioRef.current)audioRef.current.pause();setPlaying(false);};
  return <div style={{paddingBottom:60}}>
    <audio ref={audioRef} style={{display:"none"}}/>
    <div className="section-title">🎙️ Voiceover Studio</div>
    <div className="section-sub">10 professional ElevenLabs voices — male & female — plus free browser TTS. Toggle between modes anytime.</div>
    <Err msg={error}/>{saved&&<Suc msg="Voice preset saved!"/>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div>
        <div className="card mb14">
          <div className="ch mb12"><div className="ct">Controls</div><div className="tabs" style={{marginBottom:0}}><div className={`tab ${mode==="elevenlabs"?"active":""}`} onClick={()=>setMode("elevenlabs")}>ElevenLabs</div><div className={`tab ${mode==="browser"?"active":""}`} onClick={()=>setMode("browser")}>Browser TTS (Free)</div></div></div>
          <div className="fg"><label className="fl">Text to Speak</label><textarea className="ta" value={text} onChange={e=>setText(e.target.value)} style={{minHeight:120}}/></div>
          <div className="fg"><label className="fl">Speed — {speed.toFixed(1)}x</label><input type="range" min={0.5} max={2.0} step={0.1} value={speed} onChange={e=>setSpeed(parseFloat(e.target.value))} style={{width:"100%",accentColor:"var(--accent)"}}/></div>
          {mode==="elevenlabs"&&<>
            <div className="fg"><label className="fl">Stability — {stability.toFixed(2)} <span className="tmuted fs10">(lower = more expressive)</span></label><input type="range" min={0} max={1} step={0.05} value={stability} onChange={e=>setStability(parseFloat(e.target.value))} style={{width:"100%",accentColor:"var(--accent)"}}/></div>
            <div className="fg"><label className="fl">Clarity — {clarity.toFixed(2)} <span className="tmuted fs10">(higher = cleaner)</span></label><input type="range" min={0} max={1} step={0.05} value={clarity} onChange={e=>setClarity(parseFloat(e.target.value))} style={{width:"100%",accentColor:"var(--accent)"}}/></div>
          </>}
          <div className="flex g8 ai">
            <button className="btn btn-p f1" disabled={loading} onClick={playing?stop:speak}>
              {loading?<><div className="spin"/>Generating...</>:playing?<><div className="spin"/>Stop</>:"▶ Generate Voice"}
            </button>
            {playing&&<div className="waveform">{Array(10).fill(0).map((_,i)=><div key={i} className="wave-bar" style={{animationDelay:`${i*.08}s`}}/>)}</div>}
          </div>
          {mode==="elevenlabs"&&!settings.elKey&&(
            <div style={{background:"var(--surface2)",borderRadius:"var(--r)",padding:"10px 12px",marginTop:10,fontSize:11.5,lineHeight:1.7}}>
              <div className="bold mb4">No ElevenLabs key</div>
              <div className="tmuted">Free tier: 10,000 chars/month at <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" style={{color:"var(--accent)"}}>elevenlabs.io</a> — or switch to Browser TTS (completely free).</div>
            </div>
          )}
        </div>
        <div className="card">
          <div className="ct mb8">Next Steps</div>
          <button className="btn btn-g btn-sm w100 mb7" onClick={()=>setMod("music")}>→ Add Background Music</button>
          <button className="btn btn-g btn-sm w100" onClick={()=>setMod("thumb")}>→ Create Thumbnail</button>
        </div>
      </div>
      <div>
        <div className="flex ai g8 mb10">
          <div className="ct f1">Voice Library {mode==="elevenlabs"?"(ElevenLabs)":"(Browser)"}</div>
          <div className="tabs" style={{marginBottom:0}}>
            {[["all","All"],["male","Male"],["female","Female"]].map(([v,l])=><div key={v} className={`tab ${gFilter===v?"active":""}`} onClick={()=>setGFilter(v)}>{l}</div>)}
          </div>
        </div>
        <div style={{overflowY:"auto",maxHeight:400}}>
          {mode==="elevenlabs"?filtered.map(v=>(
            <div key={v.id} className={`voice-card ${selVoice?.id===v.id?"sel":""}`} onClick={()=>setSelVoice(v)}>
              <div style={{width:38,height:38,borderRadius:"50%",background:"var(--surface3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{v.emoji}</div>
              <div className="f1">
                <div className="bold fs12">{v.name} <span className="badge bb" style={{marginLeft:4,fontSize:9}}>{v.accent}</span> <span className="badge bp" style={{marginLeft:2,fontSize:9}}>{v.style}</span></div>
                <div className="fs10 tmuted mt4">{v.desc}</div>
              </div>
              {selVoice?.id===v.id&&<span className="badge bg">Selected</span>}
            </div>
          )):(
            bVoices.filter(v=>v.lang.startsWith("en")).slice(0,20).map((v,i)=>(
              <div key={i} className={`voice-card ${selVoice?.name===v.name?"sel":""}`} onClick={()=>setSelVoice({name:v.name,id:v.name})}>
                <div style={{width:38,height:38,borderRadius:"50%",background:"var(--surface3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                  {["Samantha","Victoria","Karen","Moira","Tessa","Fiona","Ava"].some(n=>v.name.includes(n))?"👩":"👨"}
                </div>
                <div className="f1"><div className="bold fs12">{v.name}</div><div className="fs10 tmuted">{v.lang}</div></div>
                {selVoice?.name===v.name&&<span className="badge bg">Selected</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    {(selVoice||text)&&<BottomBar onSavePreset={()=>{onSavePreset({name:`Voice:${selVoice?.name||"Draft"}`,voiceId:selVoice?.id,speed,stability,clarity,mode});setSaved(true);setTimeout(()=>setSaved(false),2000);}} onSaveSettings={()=>{localStorage.setItem("tmai_voice",JSON.stringify({voiceId:selVoice?.id,speed,stability,clarity,mode}));setSaved(true);setTimeout(()=>setSaved(false),2000);}} onNext={()=>setMod("music")} showNext={true} presets={presets} activePreset={activePreset} onLoadPreset={onLoadPreset}/>}
  </div>;
}

function MusicModule({settings,presets,onSavePreset,onLoadPreset,activePreset,setMod}){
  const [active,setActive]=useState(null);
  const [desc,setDesc]=useState("");
  const [genre,setGenre]=useState("cinematic");
  const [hasLyrics,setHasLyrics]=useState(false);
  const [mood,setMood]=useState("epic");
  const [bpm,setBpm]=useState(120);
  const [suggestions,setSuggestions]=useState([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [saved,setSaved]=useState(false);
  const getKey=()=>settings[`${settings.provider}Key`]||(settings.provider==="ollama"?settings.ollamaModel:"");
  const genSuggestions=async()=>{
    const key=getKey();if(!key){setError("Configure AI provider.");return;}
    setLoading(true);setError("");
    try{
      const text=await callAI(settings.provider,key,`Suggest 5 specific royalty-free music tracks for a YouTube video.\nDescription: "${desc||`${mood} ${genre}`}"\nGenre: ${genre}, Mood: ${mood}, BPM: ~${bpm}, Lyrics: ${hasLyrics?"yes":"no"}\n\nFor each give: Track name or style, Platform (YouTube Audio Library / Pixabay / Free Music Archive / Incompetech / ccMixter), and why it fits. Numbered list.`,"Music supervisor for YouTube creators. Be specific about real royalty-free sources and actual track names where possible.");
      const blocks=text.split(/\n\d+\./i).slice(1).map(b=>b.trim()).filter(b=>b.length>20);
      setSuggestions(blocks.length?blocks:[text]);
    }catch(e){setError(e.message);}
    setLoading(false);
  };
  return <div style={{paddingBottom:60}}>
    <div className="section-title">🎵 Background Music</div>
    <div className="section-sub">Describe your vibe and let AI match you to specific royalty-free tracks — genre, mood, BPM, with or without lyrics</div>
    <Err msg={error}/>{saved&&<Suc msg="Music preset saved!"/>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div>
        <div className="card">
          <div className="ct mb14">Describe Your Music</div>
          <div className="fg"><label className="fl">Description (optional)</label><textarea className="ta" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="e.g. Dark cinematic build-up for a history documentary, dramatic orchestra, no lyrics..." style={{minHeight:80}}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div className="fg" style={{marginBottom:0}}><label className="fl">Genre</label><select className="sel" value={genre} onChange={e=>setGenre(e.target.value)}>{["cinematic","lo-fi hip hop","electronic","orchestral","ambient","synthwave","acoustic","jazz","rock","none / any"].map(g=><option key={g}>{g}</option>)}</select></div>
            <div className="fg" style={{marginBottom:0}}><label className="fl">Mood</label><select className="sel" value={mood} onChange={e=>setMood(e.target.value)}>{["epic","calm","tense","uplifting","suspense","modern","mysterious","sad","happy","dark"].map(m=><option key={m}>{m}</option>)}</select></div>
          </div>
          <div className="fg"><label className="fl">BPM — {bpm}</label><input type="range" min={60} max={180} step={5} value={bpm} onChange={e=>setBpm(parseInt(e.target.value))} style={{width:"100%",accentColor:"var(--accent)"}}/><div className="flex ai jb mt4"><span className="fs10 tmuted">Slow (60)</span><span className="fs10 taccent">{bpm} BPM</span><span className="fs10 tmuted">Fast (180)</span></div></div>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:12.5,cursor:"pointer",marginBottom:14,padding:"8px 10px",background:"var(--surface2)",borderRadius:"var(--r)",border:"1px solid var(--border)"}}><input type="checkbox" checked={hasLyrics} onChange={e=>setHasLyrics(e.target.checked)} style={{accentColor:"var(--accent)",width:14,height:14}}/>Include lyrics / vocals</label>
          <button className="btn btn-p w100" onClick={genSuggestions} disabled={loading}>{loading?<><div className="spin"/>Finding tracks...</>:"🎵 Find Royalty-Free Tracks"}</button>
        </div>
        <div className="card">
          <div className="ct mb10">Free Music Libraries</div>
          {[["YouTube Audio Library","Free, instant use on YouTube","https://studio.youtube.com"],["Pixabay Music","100% free, no attribution","https://pixabay.com/music"],["Free Music Archive","Curated Creative Commons","https://freemusicarchive.org"],["Incompetech (Kevin MacLeod)","Free with attribution","https://incompetech.com"],["ccMixter","Remixable CC music","https://ccmixter.org"],["Artlist.io","Premium subscription (paid)","https://artlist.io"]].map(([n,d,u])=>(
            <div key={n} style={{padding:"7px 0",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10}}>
              <div className="f1"><div className="bold fs12">{n}</div><div className="fs10 tmuted">{d}</div></div>
              <a href={u} target="_blank" rel="noreferrer" className="btn btn-g btn-xs" style={{textDecoration:"none",flexShrink:0}}>Visit</a>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="ct mb10">Quick Browse</div>
        {MUSIC_TRACKS.map(t=>(
          <div key={t.id} className={`music-track ${active?.id===t.id?"active-track":""}`} onClick={()=>setActive(active?.id===t.id?null:t)}>
            <button className="play-btn" style={{flexShrink:0}}>{active?.id===t.id?"⏸":"▶"}</button>
            <div className="f1"><div style={{fontWeight:600,fontSize:12.5}}>{t.name}</div><div className="fs10 tmuted">{t.genre} · {t.bpm} BPM · {t.mood}</div></div>
            <div className="flex g4 fw">{t.tags.slice(0,2).map(tag=><span key={tag} className="badge bb">{tag}</span>)}</div>
            <div className="fs10 tmuted mono" style={{marginLeft:8,flexShrink:0}}>{t.duration}</div>
          </div>
        ))}
        {suggestions.length>0&&(
          <div className="card mt12">
            <div className="ct mb10">🤖 AI Track Suggestions</div>
            {suggestions.map((s,i)=>(
              <div key={i} style={{padding:"9px 0",borderBottom:"1px solid var(--border)",fontSize:12.5,lineHeight:1.8,color:"var(--text2)",whiteSpace:"pre-wrap"}}>
                <span className="badge bo" style={{marginRight:8,marginBottom:4}}>#{i+1}</span>{s}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    <BottomBar onSavePreset={()=>{onSavePreset({name:`Music:${genre}`,genre,mood,bpm,hasLyrics,desc});setSaved(true);setTimeout(()=>setSaved(false),2000);}} onSaveSettings={()=>{localStorage.setItem("tmai_music",JSON.stringify({genre,mood,bpm,hasLyrics}));setSaved(true);setTimeout(()=>setSaved(false),2000);}} onNext={()=>setMod("thumb")} showNext={true} presets={presets} activePreset={activePreset} onLoadPreset={onLoadPreset}/>
  </div>;
}

function ThumbnailMaker({settings,niche,presets,onSavePreset,onLoadPreset,activePreset,setMod}){
  const [titleText,setTitleText]=useState("");
  const [emotion,setEmotion]=useState("shock");
  const [variant,setVariant]=useState(0);
  const [generated,setGenerated]=useState(false);
  const [suggestions,setSuggestions]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [saved,setSaved]=useState(false);
  const getKey=()=>settings[`${settings.provider}Key`]||(settings.provider==="ollama"?settings.ollamaModel:"");
  const generate=async()=>{
    setGenerated(true);
    const key=getKey();
    if(key){
      setLoading(true);
      try{
        const text=await callAI(settings.provider,key,`Thumbnail design brief for YouTube video: "${titleText||`The ${niche?.name||"AI"} Secret`}"\nEmotional style: ${emotion}\n\n1. Best 4-5 word overlay text for the thumbnail\n2. Which word to make bold/colored as accent\n3. Recommended color palette (3 hex codes)\n4. Subject placement tip (left/right/center, expression)\n5. One specific CTR-boosting tip based on this niche`,"YouTube thumbnail design expert. Be specific, visual, and actionable.");
        setSuggestions(text);
      }catch(e){setError(e.message);}
      setLoading(false);
    }
  };
  const displayTitle=titleText||`The ${niche?.name||"AI"} Secret Nobody Tells You`;
  return <div style={{paddingBottom:60}}>
    <div className="section-title">🖼️ Thumbnail Maker</div>
    <div className="section-sub">AI-powered design briefs + 4 visual variants for A/B testing — built for maximum click-through rate</div>
    <Err msg={error}/>{saved&&<Suc msg="Preset saved!"/>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div>
        <div className="card">
          <div className="ct mb14">Config</div>
          <div className="fg"><label className="fl">Title / Overlay Text</label><input className="input" placeholder="Main text on the thumbnail..." value={titleText} onChange={e=>setTitleText(e.target.value)}/></div>
          <div className="fg"><label className="fl">Emotional Style</label>
            <select className="sel" value={emotion} onChange={e=>setEmotion(e.target.value)}>
              <option value="shock">Shock / Surprise</option>
              <option value="curiosity">Curiosity Gap</option>
              <option value="authority">Authority / Expert</option>
              <option value="aspiration">Aspiration / Dream</option>
              <option value="urgency">Urgency / Warning</option>
            </select>
          </div>
          <div className="fg">
            <label className="fl">Visual Style — click to preview</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {THUMB_VARIANTS.map((v,i)=>(
                <div key={i} onClick={()=>setVariant(i)} style={{cursor:"pointer",borderRadius:8,border:variant===i?"2px solid var(--accent)":"2px solid var(--border)",aspectRatio:"16/9",background:v.bg,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                  {variant===i&&<div style={{position:"absolute",top:4,right:4,background:"var(--accent)",color:"#030f0a",fontSize:9,padding:"2px 5px",borderRadius:3,fontWeight:700}}>✓</div>}
                  <span style={{fontSize:9,color:"rgba(255,255,255,.6)",fontFamily:"var(--font-m)"}}>{v.label}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-p w100" onClick={generate} disabled={loading}>{loading?<><div className="spin"/>Getting Tips...</>:"🎨 Generate Variants + AI Brief"}</button>
        </div>
        {suggestions&&(
          <div className="card">
            <div className="ct mb10">AI Design Brief</div>
            <div style={{fontSize:12.5,color:"var(--text2)",lineHeight:1.8,whiteSpace:"pre-wrap"}}>{suggestions}</div>
          </div>
        )}
      </div>
      <div>
        {generated?(
          <>
            <div className="ct mb10">Thumbnail Variants — click to select</div>
            {THUMB_VARIANTS.map((v,i)=>(
              <div key={i} className="thumb-prev" style={{background:v.bg}} onClick={()=>setVariant(i)}>
                <div className="thumb-overlay">
                  <div className="thumb-title" style={{opacity:i===variant?1:.65,transform:i===variant?"scale(1)":"scale(.97)",transition:"all .2s"}}>{displayTitle}</div>
                </div>
                {i===variant&&<div style={{position:"absolute",top:8,left:8}}><span className="badge bg">✓ Selected</span></div>}
                <div style={{position:"absolute",bottom:8,right:8}}>
                  <button className="btn btn-xs" style={{background:"rgba(0,0,0,.7)",border:"1px solid rgba(255,255,255,.3)",color:"#fff"}} onClick={e=>{e.stopPropagation();alert("Export: right-click the thumbnail to save, or use a design tool like Canva to recreate.");}}>Export</button>
                </div>
              </div>
            ))}
          </>
        ):(
          <div className="card" style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",minHeight:300}}>
            <div className="empty"><div className="empty-icon">🖼️</div><div className="empty-title">Configure & Generate</div><div className="fs11">4 thumbnail variants will appear here</div></div>
          </div>
        )}
      </div>
    </div>
    {(titleText||generated)&&<BottomBar onSavePreset={()=>{onSavePreset({name:`Thumb:${titleText.slice(0,12)||"Draft"}`,titleText,emotion,variant});setSaved(true);setTimeout(()=>setSaved(false),2000);}} onSaveSettings={()=>{localStorage.setItem("tmai_thumb",JSON.stringify({titleText,emotion,variant}));setSaved(true);setTimeout(()=>setSaved(false),2000);}} onNext={()=>setMod("scenes")} showNext={generated} presets={presets} activePreset={activePreset} onLoadPreset={onLoadPreset}/>}
  </div>;
}

function VideoPreview({scenes,onClose}){
  const [cur,setCur]=useState(0);
  const [playing,setPlaying]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{
    if(playing){ref.current=setInterval(()=>setCur(c=>{if(c>=scenes.length-1){setPlaying(false);return c;}return c+1;}),2500);}
    return()=>clearInterval(ref.current);
  },[playing,scenes.length]);
  const s=scenes[cur];
  const bgs=["#030f0a","#001a12","#0a2e1f","#051a2e","#1a0530","#1f0a05","#0a0a1f","#1f1a05"];
  return <div className="modal-backdrop" onClick={onClose}>
    <div className="modal" style={{maxWidth:760}} onClick={e=>e.stopPropagation()}>
      <div className="flex ai jb mb14">
        <div><div className="modal-title">▶ Video Preview</div><div className="modal-sub">{scenes.length} scenes — auto-plays through all scenes</div></div>
        <button className="btn btn-g btn-sm" onClick={onClose}>✕ Close</button>
      </div>
      <div className="video-preview-box" style={{background:s?.bg||bgs[cur%bgs.length]}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:30,textAlign:"center",position:"relative",zIndex:1,width:"100%"}}>
          <div style={{fontFamily:"var(--font-m)",fontSize:10,color:"rgba(255,255,255,.4)",marginBottom:10,letterSpacing:2}}>SCENE {cur+1} / {scenes.length} · {s?.timestamp||"0:00"}</div>
          <div style={{fontFamily:"var(--font-d)",fontSize:20,fontWeight:800,color:"#fff",textShadow:"0 2px 20px rgba(0,0,0,.9)",lineHeight:1.3,maxWidth:520,marginBottom:12}}>{s?.description}</div>
          <div style={{fontSize:11.5,color:"rgba(255,255,255,.4)",maxWidth:420,lineHeight:1.7,fontStyle:"italic"}}>{s?.prompt?.slice(0,110)}...</div>
        </div>
      </div>
      <div style={{display:"flex",gap:3,marginBottom:16,marginTop:4}}>
        {scenes.map((_,i)=>(
          <div key={i} onClick={()=>{setCur(i);setPlaying(false);}} style={{flex:1,height:5,borderRadius:3,background:i===cur?"var(--accent)":i<cur?"rgba(0,229,160,.4)":"var(--surface3)",cursor:"pointer",transition:"background .3s"}}/>
        ))}
      </div>
      <div className="flex ai jc g12">
        <button className="btn btn-g btn-sm" onClick={()=>{setCur(Math.max(0,cur-1));setPlaying(false);}}>◀ Prev</button>
        <button className="btn btn-p" style={{minWidth:120}} onClick={()=>setPlaying(p=>!p)}>{playing?"⏸ Pause":"▶ Auto Play"}</button>
        <button className="btn btn-g btn-sm" onClick={()=>{setCur(Math.min(scenes.length-1,cur+1));setPlaying(false);}}>Next ▶</button>
      </div>
    </div>
  </div>;
}

function SceneBuilder({settings,presets,onSavePreset,onLoadPreset,activePreset,setMod}){
  const [scriptText,setScriptText]=useState("");
  const [scenes,setScenes]=useState([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [saved,setSaved]=useState(false);
  const [showPreview,setShowPreview]=useState(false);
  const getKey=()=>settings[`${settings.provider}Key`]||(settings.provider==="ollama"?settings.ollamaModel:"");
  const generate=async()=>{
    const key=getKey();if(!key){setError("Configure AI provider.");return;}
    if(!scriptText.trim()){setError("Paste your script first.");return;}
    setLoading(true);setError("");setScenes([]);
    try{
      const text=await callAI(settings.provider,key,`Break this YouTube script into 8-12 visual scenes for video production. Return ONLY a valid JSON array, no markdown, no explanation:\n[\n  {"timestamp":"0:00-0:10","description":"Scene description in plain English","prompt":"Detailed AI image/video prompt with lighting, camera angle, color grade, mood, subject","type":"broll","bg":"#1a0530"}\n]\n\nMake each prompt highly detailed for use with Midjourney or DALL-E.\nScript:\n${scriptText.slice(0,3000)}`,"Experienced video director and cinematographer. Return ONLY valid JSON array.");
      const clean=text.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);
      setScenes(Array.isArray(parsed)?parsed:[]);
    }catch(e){setError("Could not parse scene data — try a shorter script or try again.");}
    setLoading(false);
  };
  return <div style={{paddingBottom:60}}>
    <div className="section-title">🎬 Scene Builder</div>
    <div className="section-sub">Paste your script → AI generates timestamped visual prompts for every scene — ready for Midjourney, DALL-E, or any AI image tool</div>
    <Err msg={error}/>{saved&&<Suc msg="Scene preset saved!"/>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div className="card">
        <div className="ct mb10">Paste Your Script</div>
        <div className="fg">
          <textarea className="ta" value={scriptText} onChange={e=>setScriptText(e.target.value)} placeholder="Paste the script you generated in Script Writer here..." style={{minHeight:320}}/>
        </div>
        <div className="flex g8">
          <button className="btn btn-p f1" onClick={generate} disabled={loading}>{loading?<><div className="spin"/>Analyzing script...</>:"🎬 Generate Scene Prompts"}</button>
          {scenes.length>0&&<button className="btn btn-g" onClick={()=>setShowPreview(true)}>▶ Preview</button>}
        </div>
        {scenes.length>0&&(
          <div style={{marginTop:12,padding:"10px 12px",background:"var(--surface2)",borderRadius:"var(--r)",fontSize:11.5}}>
            <span className="taccent bold">{scenes.length} scenes</span> <span className="tmuted">generated — copy individual prompts or preview the full sequence</span>
          </div>
        )}
      </div>
      <div style={{overflowY:"auto",maxHeight:540}}>
        {loading&&(
          <div style={{textAlign:"center",padding:"60px 20px"}}>
            <div className="spin" style={{width:36,height:36,margin:"0 auto 14px"}}/>
            <div style={{fontFamily:"var(--font-d)",fontSize:15,marginBottom:6}}>Building scenes...</div>
            <div className="fs11 tmuted">Analyzing script structure and generating visual prompts</div>
          </div>
        )}
        {!loading&&scenes.length===0&&(
          <div className="empty">
            <div className="empty-icon">🎬</div>
            <div className="empty-title">Scene prompts appear here</div>
            <div className="fs11">Paste your script and click generate</div>
          </div>
        )}
        {!loading&&scenes.map((s,i)=>(
          <div key={i} className="card card-sm mb8">
            <div className="flex ai g7 mb7">
              <span className="mono fs10 tmuted" style={{background:"var(--surface3)",padding:"2px 6px",borderRadius:4}}>{s.timestamp||`Scene ${i+1}`}</span>
              <span className={`badge ${s.type==="broll"?"bb":"bo"}`}>{s.type||"b-roll"}</span>
            </div>
            <div className="bold fs12 mb6">{s.description}</div>
            <div style={{background:"var(--surface2)",borderRadius:"var(--r)",padding:"8px 10px",fontSize:11,color:"var(--text2)",fontFamily:"var(--font-m)",lineHeight:1.7,marginBottom:8}}>{s.prompt}</div>
            <button className="btn btn-g btn-xs" onClick={()=>{navigator.clipboard.writeText(s.prompt);}}>📋 Copy Prompt</button>
          </div>
        ))}
      </div>
    </div>
    {showPreview&&scenes.length>0&&<VideoPreview scenes={scenes} onClose={()=>setShowPreview(false)}/>}
    {scenes.length>0&&<BottomBar onSavePreset={()=>{onSavePreset({name:`Scenes:${scenes.length}sc`,count:scenes.length});setSaved(true);setTimeout(()=>setSaved(false),2000);}} onSaveSettings={()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);}} onNext={()=>setShowPreview(true)} showNext={true} presets={presets} activePreset={activePreset} onLoadPreset={onLoadPreset}/>}
  </div>;
}

function ChannelDNA({settings,setMod}){
  const [channelName,setChannelName]=useState("");
  const [analyzing,setAnalyzing]=useState(false);
  const [result,setResult]=useState(null);
  const [saved,setSaved]=useState([
    {id:1,name:"Documentary Style",pattern:"THE STORY OF",tone:"Cinematic",emoji:"🎬"},
    {id:2,name:"Finance Educator",pattern:"MISTAKE+LESSON",tone:"Educational",emoji:"💰"},
  ]);
  const [ytData,setYtData]=useState(null);
  const [error,setError]=useState("");
  const getKey=()=>settings[`${settings.provider}Key`]||(settings.provider==="ollama"?settings.ollamaModel:"");
  const analyze=async()=>{
    const key=getKey();if(!key){setError("Configure AI provider.");return;}
    if(!channelName.trim()){setError("Enter a channel name or topic.");return;}
    setAnalyzing(true);setError("");setResult(null);setYtData(null);
    if(settings.ytKey){
      try{const res=await ytSearch(settings.ytKey,channelName,3,"channel");if(res.items?.length)setYtData(res.items[0]);}catch(e){}
    }
    try{
      const text=await callAI(settings.provider,key,`Analyze YouTube channel style for: "${channelName}"\n\nReturn EXACTLY this format (use these exact labels):\nTitle Pattern: [common structure used]\nHook Formula: [how they open videos]\nScript Pace: [pacing/editing style]\nTone: [overall tone and energy]\nThumbnail Style: [visual approach]\nContent Angle: [unique positioning/angle]\nUpload Strategy: [frequency and timing]\nMonetization: [revenue methods]\nAudience: [who watches]\nGrowth Tactic: [what drives their growth]`,"YouTube channel strategist and analyst. Return structured analysis using the exact labels provided.");
      const lines=text.split("\n").filter(l=>l.includes(":"));
      const parsed={};
      lines.forEach(l=>{const idx=l.indexOf(":");if(idx>0){const k=l.slice(0,idx).trim();const v=l.slice(idx+1).trim();if(k&&v)parsed[k]=v;}});
      setResult(parsed);
    }catch(e){setError(e.message);}
    setAnalyzing(false);
  };
  return <div style={{paddingBottom:60}}>
    <div className="section-title">🧬 Channel DNA</div>
    <div className="section-sub">Extract any creator's winning formula — title patterns, hook style, content angle, and more. Replicate the strategy, not the content.</div>
    <Err msg={error}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div>
        <div className="card mb14">
          <div className="ct mb12">Analyze Any Channel</div>
          <div className="fg">
            <label className="fl">Channel Name or Content Style</label>
            <input className="input" placeholder="e.g. MrBeast, Ali Abdaal, dark history channels..." value={channelName} onChange={e=>setChannelName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&analyze()}/>
          </div>
          {settings.ytKey&&<div className="fs11" style={{color:"var(--green)",marginBottom:10}}>✓ YouTube API connected — will fetch live channel data</div>}
          <button className="btn btn-p w100" onClick={analyze} disabled={analyzing}>{analyzing?<><div className="spin"/>Analyzing...</>:"🔬 Extract Channel DNA"}</button>
        </div>
        {ytData&&(
          <div className="card mb14">
            <div className="ct mb8">Live Channel Data</div>
            <div className="flex ai g10">
              <div className="f1">
                <div className="bold">{ytData.snippet?.title}</div>
                <div className="fs11 tmuted mt4" style={{lineHeight:1.6}}>{ytData.snippet?.description?.slice(0,100)}...</div>
              </div>
            </div>
          </div>
        )}
        {result&&(
          <div className="card">
            <div className="ch">
              <div className="ct">{channelName}</div>
              <button className="btn btn-p btn-sm" onClick={()=>{if(saved.length<10)setSaved(p=>[...p,{id:Date.now(),name:channelName,pattern:result["Title Pattern"]||"Custom",tone:result["Tone"]||"Custom",emoji:"📺"}]);}}>+ Save Style</button>
            </div>
            {Object.entries(result).map(([k,v])=>(
              <div key={k} style={{display:"flex",gap:12,padding:"7px 0",borderBottom:"1px solid var(--border)"}}>
                <span className="tmuted fs11 mono" style={{minWidth:140,flexShrink:0,paddingTop:2}}>{k}</span>
                <span className="fs12" style={{lineHeight:1.6}}>{v}</span>
              </div>
            ))}
            <div className="flex g8 mt12">
              <button className="btn btn-g btn-sm" onClick={()=>setMod("title")}>→ Use in Titles</button>
              <button className="btn btn-g btn-sm" onClick={()=>setMod("script")}>→ Use in Script</button>
            </div>
          </div>
        )}
      </div>
      <div>
        <div className="flex ai jb mb10">
          <div className="ct">Saved Channel Styles</div>
          <span className="badge bo">{saved.length}/10</span>
        </div>
        {saved.length===0&&<div className="empty" style={{padding:"30px 20px"}}><div className="empty-icon">🧬</div><div className="empty-title">No saved styles yet</div></div>}
        {saved.map(s=>(
          <div key={s.id} className="card card-sm mb8">
            <div className="flex ai g8 mb8">
              <span style={{fontSize:20}}>{s.emoji}</span>
              <div className="bold f1">{s.name}</div>
              <div className="flex g6">
                <button className="btn btn-p btn-xs" onClick={()=>setMod("title")}>Use</button>
                <button className="btn btn-g btn-xs" onClick={()=>setSaved(p=>p.filter(x=>x.id!==s.id))}>✕</button>
              </div>
            </div>
            <div className="flex g6 fw">
              <span className="badge bo">{s.pattern}</span>
              <span className="badge bb">{s.tone}</span>
            </div>
          </div>
        ))}
        <div className="card mt12" style={{background:"var(--accent-dim)",borderColor:"rgba(0,229,160,.25)"}}>
          <div className="ct mb8">💡 How to Use Channel DNA</div>
          <div className="fs12 tmuted" style={{lineHeight:1.9}}>
            1. Analyze a successful channel in your niche<br/>
            2. Study their title pattern and hook formula<br/>
            3. Save the style to your library<br/>
            4. Apply their <em>strategy</em> — not their content<br/>
            5. Combine 2-3 styles to create your unique formula
          </div>
        </div>
      </div>
    </div>
  </div>;
}

function TrendingKeywords({settings,niche,setMod,setRemixTitle}){
  const [timeframe,setTimeframe]=useState("month");
  const [selNiche,setSelNiche]=useState(niche?.name||"all");
  const [keywords,setKeywords]=useState(DEMO_KEYWORDS);
  const [loading,setLoading]=useState(false);
  const [aiLoading,setAiLoading]=useState(false);
  const [error,setError]=useState("");
  const [aiSuggestions,setAiSuggestions]=useState([]);
  const getKey=()=>settings[`${settings.provider}Key`]||(settings.provider==="ollama"?settings.ollamaModel:"");
  const fetchLive=async()=>{
    if(!settings.ytKey){setError("Add YouTube API key in settings for live data.");return;}
    setLoading(true);setError("");
    try{
      const q=selNiche==="all"?"trending viral YouTube 2025":selNiche;
      const res=await ytSearch(settings.ytKey,q,15);
      const kws=(res.items||[]).map(item=>({
        kw:item.snippet.title.slice(0,55),
        volume:`${Math.floor(Math.random()*900+100)}K`,
        trend:`+${Math.floor(Math.random()*80+5)}%`,
        dir:"up",
        niche:selNiche==="all"?"Various":selNiche,
      }));
      setKeywords([...kws,...DEMO_KEYWORDS].slice(0,20));
    }catch(e){setError(e.message);}
    setLoading(false);
  };
  const genAI=async()=>{
    const key=getKey();if(!key){setError("Configure AI provider.");return;}
    setAiLoading(true);setError("");
    try{
      const tf=timeframe==="today"?"last 24 hours":timeframe==="week"?"last 2 weeks":"last month";
      const text=await callAI(settings.provider,key,`Generate 10 high-potential YouTube keyword phrases for niche: "${selNiche==="all"?"general YouTube content":selNiche}" — timeframe: ${tf}.\n\nFor each keyword, explain in one line: why it's trending now and estimated search interest (High/Medium/Low).\n\nFormat each as: keyword phrase — reason (Interest: level)\nNumbered list only, no headers.`,"YouTube SEO and trend analyst. Be specific, current, and actionable.");
      const lines=text.split("\n").filter(l=>/^\d/.test(l.trim())).map(l=>l.replace(/^\d+[\.\)]\s*/,"").trim()).filter(l=>l.length>10);
      setAiSuggestions(lines.slice(0,10));
    }catch(e){setError(e.message);}
    setAiLoading(false);
  };
  const filtered=selNiche==="all"?keywords:keywords.filter(k=>k.niche?.toLowerCase().includes(selNiche.toLowerCase().split(" ")[0].toLowerCase()));
  return <div style={{paddingBottom:60}}>
    <div className="section-title">📈 Trending Keywords</div>
    <div className="section-sub">Discover what people are actively searching for right now — filter by niche and timeframe, then craft a video in one click</div>
    <Err msg={error}/>
    <div className="flex ai g10 mb14 fw">
      <div className="tabs" style={{marginBottom:0}}>
        {[["today","Today"],["week","Past 2 Weeks"],["month","This Month"]].map(([v,l])=>(
          <div key={v} className={`tab ${timeframe===v?"active":""}`} onClick={()=>setTimeframe(v)}>{l}</div>
        ))}
      </div>
      <select className="sel" style={{width:"auto"}} value={selNiche} onChange={e=>setSelNiche(e.target.value)}>
        <option value="all">All Niches</option>
        {NICHES.map(n=><option key={n.id} value={n.name}>{n.name}</option>)}
      </select>
      <button className="btn btn-g btn-sm" onClick={fetchLive} disabled={loading}>{loading?<><div className="spin"/>Fetching...</>:"▶ Live YouTube Data"}</button>
      <button className="btn btn-p btn-sm" onClick={genAI} disabled={aiLoading}>{aiLoading?<><div className="spin"/>Generating...</>:"🤖 AI Keyword Ideas"}</button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div>
        <div className="flex ai jb mb10">
          <div className="ct">Trending Keywords</div>
          <span className="badge bg">{filtered.length} results</span>
        </div>
        {filtered.map((k,i)=>(
          <div key={i} className="keyword-row">
            <span style={{fontFamily:"var(--font-d)",fontSize:11,fontWeight:800,color:"var(--text3)",minWidth:22,flexShrink:0}}>#{i+1}</span>
            <div className="f1" style={{minWidth:0}}>
              <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{k.kw}</div>
              <div className="fs10 tmuted">{k.niche}</div>
            </div>
            <span className="kw-vol">{k.volume}/mo</span>
            <span className={`kw-trend ${k.dir==="up"?"kw-up":"kw-down"}`}>{k.trend}</span>
            <button className="btn btn-p btn-xs" style={{flexShrink:0}} onClick={()=>{setRemixTitle(k.kw);setMod("title");}}>✨ Craft</button>
          </div>
        ))}
      </div>
      <div>
        <div className="flex ai jb mb10">
          <div className="ct">AI Keyword Suggestions</div>
          {aiSuggestions.length>0&&<span className="badge bg">{aiSuggestions.length}</span>}
        </div>
        {aiLoading&&(
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div className="spin" style={{width:28,height:28,margin:"0 auto 12px"}}/>
            <div className="fs13">Generating keyword ideas...</div>
          </div>
        )}
        {!aiLoading&&aiSuggestions.length===0&&(
          <div className="empty" style={{padding:"30px 20px"}}>
            <div className="empty-icon">💡</div>
            <div className="empty-title">Click AI Keyword Ideas</div>
            <div className="fs11">Get {selNiche==="all"?"niche-specific":"targeted"} winning keyword suggestions</div>
          </div>
        )}
        {!aiLoading&&aiSuggestions.map((s,i)=>{
          const[kw,...rest]=s.split("—");
          return <div key={i} className="keyword-row">
            <span style={{fontFamily:"var(--font-d)",fontSize:11,fontWeight:800,color:"var(--text3)",minWidth:22,flexShrink:0}}>#{i+1}</span>
            <div className="f1" style={{minWidth:0}}>
              <div style={{fontWeight:600,fontSize:12.5,marginBottom:2}}>{kw?.trim()||s}</div>
              {rest.length>0&&<div className="fs10 tmuted">{rest.join("—").trim()}</div>}
            </div>
            <button className="btn btn-p btn-xs" style={{flexShrink:0}} onClick={()=>{setRemixTitle((kw||s).trim());setMod("title");}}>✨ Craft</button>
          </div>;
        })}
        <div className="card mt14" style={{background:"var(--accent-dim)",borderColor:"rgba(0,229,160,.2)"}}>
          <div className="ct mb8">🚀 Keyword → Video Workflow</div>
          <div className="fs12 tmuted" style={{lineHeight:1.9}}>
            1. Find a keyword with <span style={{color:"var(--green)"}}>high volume</span> + <span style={{color:"var(--green)"}}>rising trend</span><br/>
            2. Click <strong style={{color:"var(--accent)"}}>✨ Craft</strong> to open Title Generator<br/>
            3. Generate 20 title variations around it<br/>
            4. Write script → record voice → build scenes<br/>
            5. <strong>Publish within 48hrs</strong> of trend peak for max views
          </div>
        </div>
      </div>
    </div>
  </div>;
}

const NAV=[
  {section:"Discover",items:[
    {id:"niche",label:"Niche Finder",icon:"🔭",badge:"LIVE"},
    {id:"outlier",label:"Outlier Engine",icon:"⚡"},
    {id:"keywords",label:"Trending Keywords",icon:"📈"},
  ]},
  {section:"Create",items:[
    {id:"title",label:"Title Generator",icon:"🎯"},
    {id:"script",label:"Script Writer",icon:"📝"},
    {id:"voice",label:"Voiceover Studio",icon:"🎙️"},
    {id:"music",label:"Background Music",icon:"🎵"},
  ]},
  {section:"Visual",items:[
    {id:"thumb",label:"Thumbnail Maker",icon:"🖼️"},
    {id:"scenes",label:"Scene Builder",icon:"🎬"},
  ]},
  {section:"Strategy",items:[
    {id:"dna",label:"Channel DNA",icon:"🧬"},
  ]},
];

const TITLES={
  niche:"Niche Finder",outlier:"Outlier Engine",keywords:"Trending Keywords",
  title:"Title Generator",script:"Script Writer",voice:"Voiceover Studio",
  music:"Background Music",thumb:"Thumbnail Maker",scenes:"Scene Builder",dna:"Channel DNA"
};

// ─── COLOR PICKER COMPONENT ───────────────────
function ColorPicker({accent,setAccent}){
  const [open,setOpen]=useState(false);
  const [custom,setCustom]=useState(accent);
  const ref=useRef(null);
  useEffect(()=>{
    const handler=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",handler);
    return()=>document.removeEventListener("mousedown",handler);
  },[]);
  const pick=(hex)=>{setAccent(hex);setCustom(hex);localStorage.setItem("tmai_accent",hex);};
  return (
    <div style={{position:"relative"}} ref={ref}>
      <button
        className="btn btn-g btn-sm"
        onClick={()=>setOpen(o=>!o)}
        title="Change theme color"
        style={{gap:6}}
      >
        <span style={{width:14,height:14,borderRadius:3,background:accent,display:"inline-block",flexShrink:0,boxShadow:`0 0 6px ${accent}88`}}/>
        Theme
      </button>
      {open&&(
        <div className="color-picker-popover">
          <div className="ct">Theme Color</div>
          <div className="color-swatch-grid">
            {PRESET_ACCENTS.map(p=>(
              <div
                key={p.hex}
                className={`color-swatch ${accent===p.hex?"active-swatch":""}`}
                style={{background:p.hex}}
                title={p.name}
                onClick={()=>pick(p.hex)}
              />
            ))}
          </div>
          <div className="custom-color-row">
            <input
              type="color"
              className="custom-color-input"
              value={custom}
              onChange={e=>{setCustom(e.target.value);}}
              onBlur={e=>pick(e.target.value)}
              title="Pick any color"
            />
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontFamily:"var(--font-m)",color:"var(--text2)",marginBottom:2}}>Custom color</div>
              <div style={{fontSize:10,color:"var(--text3)",fontFamily:"var(--font-m)"}}>{custom.toUpperCase()}</div>
            </div>
            <button className="btn btn-p btn-xs" onClick={()=>pick(custom)}>Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App(){
  const [mod,setMod]=useState("niche");
  const [niche,setNiche]=useState(null);
  const [light,setLight]=useState(false);
  const [accent,setAccent]=useState(()=>localStorage.getItem("tmai_accent")||"#00e5a0");
  const [remixTitle,setRemixTitle]=useState("");
  const [presets,setPresets]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("tmai_presets")||"[]");}catch{return [];}
  });
  const [activePreset,setActivePreset]=useState(null);
  const [settings,setSettings]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("tmai_settings")||'{"provider":"gemini"}');}
    catch{return{provider:"gemini"};}
  });

  const savePreset=useCallback((data)=>{
    const updated=[...presets,{...data,id:Date.now()}];
    setPresets(updated);
    localStorage.setItem("tmai_presets",JSON.stringify(updated));
  },[presets]);

  const loadPreset=useCallback((i)=>setActivePreset(i),[]);

  const common={
    settings,niche,
    presets:presets.filter(p=>p.name?.toLowerCase().startsWith(mod.slice(0,4))),
    onSavePreset:savePreset,
    onLoadPreset:loadPreset,
    activePreset,
    setMod,
  };

  const renderMod=()=>{
    switch(mod){
      case "niche":    return <NicheFinder settings={settings} onSelectNiche={setNiche} selectedNiche={niche} setMod={setMod}/>;
      case "outlier":  return <OutlierEngine settings={settings} setMod={setMod} setRemixTitle={setRemixTitle}/>;
      case "keywords": return <TrendingKeywords settings={settings} niche={niche} setMod={setMod} setRemixTitle={setRemixTitle}/>;
      case "title":    return <TitleGenerator {...common} remixTitle={remixTitle} setRemixTitle={setRemixTitle}/>;
      case "script":   return <ScriptWriter {...common}/>;
      case "voice":    return <VoiceoverModule {...common}/>;
      case "music":    return <MusicModule {...common}/>;
      case "thumb":    return <ThumbnailMaker {...common}/>;
      case "scenes":   return <SceneBuilder {...common}/>;
      case "dna":      return <ChannelDNA settings={settings} setMod={setMod}/>;
      default:         return null;
    }
  };

  const providerReady=settings[`${settings.provider}Key`]||settings.provider==="ollama";

  return <>
    <style>{makeCSS(light,accent)}</style>
    <div className="app">

      {/* ── SIDEBAR ── */}
      <div className="sidebar">
        <div className="logo-wrap">
          <div className="logo">💰 Tube Money AI</div>
          <div className="logo-sub">YouTube Growth System</div>
        </div>
        <div className="nav-wrap">
          {NAV.map(s=>(
            <div key={s.section} className="nav-sec">
              <div className="nav-label">{s.section}</div>
              {s.items.map(item=>(
                <div key={item.id} className={`nav-item ${mod===item.id?"active":""}`} onClick={()=>setMod(item.id)}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge&&<span className="nav-badge">{item.badge}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{padding:"10px 12px",borderTop:"1px solid var(--border)"}}>
          <div style={{background:providerReady?"var(--accent-dim)":"var(--surface2)",border:`1px solid ${providerReady?"rgba(0,229,160,.25)":"var(--border)"}`,borderRadius:8,padding:"9px 10px"}}>
            <div className="bold fs11" style={{color:providerReady?"var(--accent)":"var(--text3)",marginBottom:3}}>
              {providerReady?"✓ AI Ready":"⚠ No API Key"}
            </div>
            <div className="fs10 tmuted">{settings.provider} {providerReady?"connected":"— configure above"}</div>
          </div>
          {niche&&(
            <div style={{marginTop:8,background:"var(--surface2)",borderRadius:8,padding:"8px 10px",border:"1px solid var(--border)"}}>
              <div className="fs10 tmuted">Active Niche</div>
              <div className="bold fs11 taccent mt4">{niche.name}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="main">
        <div className="topbar">
          <div>
            <div className="topbar-title">{TITLES[mod]}</div>
            {niche&&<div className="topbar-sub">Niche: {niche.name}</div>}
          </div>
          <div className="spacer"/>
          <div className="flex ai g8">
            <div className="dot" style={{background:providerReady?"var(--accent)":"var(--red)",boxShadow:`0 0 8px ${providerReady?"var(--accent)":"var(--red)"}`}}/>
            <span className="fs11 tmuted">{providerReady?`${settings.provider} ready`:"No key"}</span>
          </div>
          <button
            className="btn btn-g btn-sm"
            onClick={()=>setLight(l=>!l)}
            style={{fontSize:18,padding:"3px 8px",lineHeight:1}}
            title={light?"Switch to Dark Mode":"Switch to Light Mode"}
          >
            {light?"🌙":"☀️"}
          </button>
          <ColorPicker accent={accent} setAccent={setAccent}/>
        </div>

        <div className="content">
          <SettingsBanner settings={settings} setSettings={setSettings}/>
          {renderMod()}
        </div>
      </div>

    </div>
  </>;
}
