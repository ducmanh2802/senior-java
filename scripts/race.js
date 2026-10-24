#!/usr/bin/env node
/*
 * Task race: tasks T<FROM>+ are cars; each moves forward as the task goes
 * TODO → running → DONE → review → reviewed → committed. No dependencies.
 *   node scripts/race.js            -> http://localhost:4322
 * Data: tasks/*.md (Status, Agent, Reviewed-by, Verify-failed), logs-runner.txt (start/end lines),
 * logs/<id>.log size (wiggle while an agent writes), git log (committed).
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PORT = +process.env.PORT || 4322;
const FROM = +process.env.FROM || 124;          // race only tasks T<FROM> and later

function runnerLog() {
  let txt = '';
  try { txt = fs.readFileSync(path.join(ROOT, 'logs-runner.txt'), 'utf8'); } catch {}
  const last = {};                                 // id -> {start, end, runner}
  for (const line of txt.split('\n')) {
    const m = line.match(/^\[(\d\d:\d\d:\d\d)\] (start|end)\s+(T\d+R?) .*?\((\w+)\)/);
    if (!m) continue;
    const e = last[m[3]] || (last[m[3]] = {});
    if (m[2] === 'start') { e.start = m[1]; e.end = null; e.runner = m[4]; } else e.end = m[1];
  }
  return last;
}

function committed() {
  try {
    return execFileSync('git', ['log', '-300', '--format=%s'], { cwd: ROOT, encoding: 'utf8' });
  } catch { return ''; }
}

function logSize(id) {
  try { return fs.statSync(path.join(ROOT, 'logs', id + '.log')).size; } catch { return 0; }
}

function status() {
  const dir = path.join(ROOT, 'tasks');
  const runs = runnerLog();
  const commits = committed();
  const cars = [];
  for (const f of fs.readdirSync(dir)) {
    const m = f.match(/^(T\d+)-(.+)\.md$/);
    if (!m) continue;
    const md = fs.readFileSync(path.join(dir, f), 'utf8');
    const st = (md.match(/^Status:\s*(\S+)/m) || [])[1] || '?';
    if (+m[1].slice(1) < FROM) continue;
    const id = m[1];
    const title = (md.match(/^# \S+ — (.+)$/m) || [])[1] || m[2];
    const run = runs[id] || {}, rev = runs[id + 'R'] || {};
    const isCommitted = new RegExp('\\b' + id + '\\b').test(commits);
    let stage, pct;
    if (isCommitted && st === 'DONE') { stage = 'Về đích'; pct = 100; }
    else if (/^Verify-failed:/m.test(md)) { stage = 'Tai nạn (verify hỏng)'; pct = 88; }
    else if (/^Reviewed-by:/m.test(md)) { stage = 'Chờ verify + commit'; pct = 90; }
    else if (rev.start && !rev.end) { stage = 'Đang review'; pct = 70 + Math.min(15, logSize(id + 'R') / 4000); }
    else if (st === 'DONE') { stage = 'Viết xong, chờ review'; pct = 62; }
    else if (run.start && !run.end) { stage = 'Đang viết'; pct = 8 + Math.min(48, logSize(id) / 3000); }
    else if (run.end) { stage = 'Vào pit (chờ thử lại)'; pct = 4; }
    else { stage = 'Chờ xuất phát'; pct = 0; }
    cars.push({ id, title, stage, pct: Math.round(pct), runner: rev.start && !rev.end ? rev.runner : run.runner || '',
                since: rev.start && !rev.end ? rev.start : run.start && !run.end ? run.start : '', group: m[2].startsWith('en-') ? 'en' : '' });
  }
  // translation chunks (tasks *-en-*) would flood the track: fold them into one car, keep only the active ones as lanes
  const en = cars.filter(c => c.group === 'en');
  if (en.length > 5) {
    const active = c => /Đang|Tai nạn/.test(c.stage);
    const done = en.filter(c => c.pct === 100).length, running = en.filter(active).length;
    for (const c of en) if (!active(c)) cars.splice(cars.indexOf(c), 1);
    cars.push({ id: 'EN', title: `Dịch tiếng Anh — ${done}/${en.length} phần xong` + (running ? `, ${running} đang chạy` : ''),
                stage: done === en.length ? 'Về đích' : running ? 'Đang viết' : 'Chờ xuất phát',
                pct: done === en.length ? 100 : Math.min(99, Math.round(en.reduce((s, c) => s + c.pct, 0) / en.length)), runner: '', since: '' });
  }
  cars.sort((a, b) => b.pct - a.pct || a.id.localeCompare(b.id, 'en', { numeric: true }));
  return { at: new Date().toLocaleTimeString('vi-VN'), cars };
}

const PAGE = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Task Grand Prix</title>
<style>
:root{--bg:#0b0e14;--panel:#121722;--panel2:#171d2b;--line:#232b3d;--fg:#e8ecf4;--muted:#8a94a8;--asphalt:#1a1f2b;--asphalt2:#1e2431;
--write:#3b82f6;--review:#a855f7;--wait:#f59e0b;--done:#22c55e;--bad:#ef4444;--pit:#64748b;--gold:#fbbf24;--silver:#cbd5e1;--bronze:#d97706}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(1200px 600px at 80% -10%,#1b2540 0,transparent 60%),var(--bg);color:var(--fg);font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;padding:18px 16px 40px;min-height:100vh}
.wrap{max-width:1320px;margin:0 auto}
.mono{font-family:ui-monospace,"Cascadia Mono",Consolas,monospace}
/* header */
header{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:16px}
.brand{display:flex;align-items:center;gap:12px;flex:1;min-width:240px}
.flag{width:44px;height:44px;border-radius:10px;background:repeating-conic-gradient(#fff 0 25%,#111 0 50%) 0 0/14px 14px;box-shadow:0 0 0 2px #fff2;transform:skew(-8deg)}
h1{margin:0;font-size:22px;letter-spacing:.06em;text-transform:uppercase;font-weight:800;font-style:italic}
h1 b{color:var(--bad)}
.sub{color:var(--muted);font-size:12px;display:flex;align-items:center;gap:8px}
.live{display:inline-flex;align-items:center;gap:6px;background:#ef444422;color:#fca5a5;border:1px solid #ef444455;border-radius:99px;padding:1px 9px;font-weight:700;font-size:11px;letter-spacing:.1em}
.live i{width:7px;height:7px;border-radius:50%;background:var(--bad);animation:blink 1.2s infinite}
@keyframes blink{50%{opacity:.25}}
.ring{--p:0;width:74px;height:74px;border-radius:50%;background:conic-gradient(var(--done) calc(var(--p)*1%),#ffffff14 0);display:grid;place-items:center;transition:--p 1s}
.ring div{width:58px;height:58px;border-radius:50%;background:var(--bg);display:grid;place-items:center;text-align:center;line-height:1.05}
.ring b{font-size:17px}.ring small{font-size:9px;color:var(--muted);letter-spacing:.08em}
/* stats */
.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px}
.stat{background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:12px;padding:10px 14px;position:relative;overflow:hidden}
.stat::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:var(--c)}
.stat b{display:block;font-size:24px;font-weight:800}.stat small{color:var(--muted);font-size:12px}
/* grid */
.grid{display:grid;grid-template-columns:minmax(300px,380px) 1fr;gap:16px;align-items:start}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.panel h2{margin:0;padding:10px 14px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--line);display:flex;justify-content:space-between}
/* timing tower */
.tower{max-height:calc(100vh - 260px);overflow:auto}
.row{display:grid;grid-template-columns:30px 6px 54px 1fr 44px;align-items:center;gap:8px;padding:7px 12px;border-bottom:1px solid #ffffff08;transition:background .3s}
.row:hover{background:#ffffff06}
.pos{font-weight:800;text-align:center;font-size:13px;color:var(--muted)}
.row:nth-child(1) .pos{color:var(--gold)}.row:nth-child(2) .pos{color:var(--silver)}.row:nth-child(3) .pos{color:var(--bronze)}
.bar{width:6px;height:26px;border-radius:3px;background:var(--c)}
.tid{font-weight:700;font-size:13px}
.tname{min-width:0}.tname div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px}
.tname small{color:var(--c);font-size:11px;font-weight:600}
.pct{text-align:right;font-weight:700;font-size:13px}
/* track */
.track{position:relative;padding:10px 0;background:var(--asphalt)}
.track::before,.track::after{content:"";position:absolute;left:0;right:0;height:6px;background:repeating-linear-gradient(90deg,#e11d48 0 22px,#f8fafc 22px 44px);opacity:.85}
.track::before{top:0}.track::after{bottom:0}
.marks{position:absolute;top:6px;bottom:6px;left:var(--l);right:var(--r);pointer-events:none}
.mark{position:absolute;top:0;bottom:0;border-left:2px dashed #ffffff1c}
.mark span{position:absolute;top:4px;left:5px;font-size:10px;color:#ffffff70;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}
.finish{position:absolute;top:6px;bottom:6px;right:var(--r);width:14px;background:repeating-conic-gradient(#111 0 25%,#f8fafc 0 50%) 0 0/14px 14px}
.lane{position:relative;height:56px}
.lane:nth-child(even){background:var(--asphalt2)}
.lane+.lane{border-top:1px dashed #ffffff12}
.label{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-weight:700;font-size:12px;color:#ffffffb0}
.road{position:absolute;left:var(--l);right:var(--r);top:0;bottom:0}
.car{position:absolute;top:50%;left:0;transform:translate(-50%,-50%);transition:left 1.6s cubic-bezier(.3,.8,.3,1)}
.car .emoji{font-size:30px;line-height:1;display:inline-block;transform:scaleX(-1);filter:drop-shadow(0 4px 3px #000a)}
.car.run .emoji{animation:bump .35s infinite alternate}
@keyframes bump{to{transform:scaleX(-1) translateY(-3px) rotate(-2deg)}}
.car.run::before{content:"";position:absolute;right:75%;top:48%;width:52px;height:3px;border-radius:3px;background:linear-gradient(90deg,transparent,var(--c));opacity:.8;animation:speed .45s linear infinite}
@keyframes speed{from{opacity:.15;transform:translateX(10px)}to{opacity:.85;transform:none}}
.car::after{content:"";position:absolute;left:50%;bottom:-5px;width:30px;height:6px;margin-left:-15px;border-radius:50%;background:var(--c);filter:blur(5px);opacity:.7}
.tip{position:absolute;bottom:calc(100% + 2px);left:50%;transform:translateX(-50%);background:#0b0e14ee;border:1px solid var(--c);color:var(--fg);border-radius:8px;padding:2px 8px;font-size:11px;white-space:nowrap;pointer-events:none}
.empty{color:var(--muted);padding:30px;text-align:center}
/* podium + legend */
.foot{display:grid;grid-template-columns:1fr auto;gap:16px;margin-top:16px;align-items:start}
.podium{padding:12px 14px}.podium .chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{background:#22c55e14;border:1px solid #22c55e44;border-radius:99px;padding:3px 10px;font-size:12px}
.chip b{color:var(--done)}
.legend{display:flex;flex-wrap:wrap;gap:12px;color:var(--muted);font-size:12px;padding:12px 14px}
.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--c);margin-right:5px;vertical-align:-1px}
@media (max-width:900px){.grid,.foot{grid-template-columns:1fr}.stats{grid-template-columns:repeat(3,1fr)}.tower{max-height:none}}
@media (max-width:520px){.stats{grid-template-columns:repeat(2,1fr)}h1{font-size:18px}.car .emoji{font-size:24px}.label{font-size:10px}}
</style></head><body><div class="wrap">
<header>
  <div class="brand"><div class="flag"></div><div><h1>Task <b>Grand Prix</b></h1>
    <div class="sub"><span class="live"><i></i>LIVE</span><span id="sub">đang tải…</span></div></div></div>
  <div class="ring" id="ring"><div><span><b id="ringv">0%</b><br><small>TỔNG</small></span></div></div>
</header>
<div class="stats" id="stats"></div>
<div class="grid">
  <div class="panel"><h2><span>Bảng xếp hạng</span><span id="cnt"></span></h2><div class="tower" id="tower"></div></div>
  <div class="panel"><h2><span>Đường đua</span><span>Viết → Review → Commit</span></h2><div class="track" id="track" style="--l:70px;--r:26px"></div></div>
</div>
<div class="foot">
  <div class="panel podium" id="podium" hidden><h2 style="margin:-12px -14px 10px"><span>🏆 Đã về đích</span><span id="donecnt"></span></h2><div class="chips" id="chips"></div></div>
  <div class="panel legend">
    <span style="--c:var(--pit)"><i></i>Chờ / pit</span><span style="--c:var(--write)"><i></i>Đang viết</span>
    <span style="--c:var(--wait)"><i></i>Chờ review / commit</span><span style="--c:var(--review)"><i></i>Đang review</span>
    <span style="--c:var(--done)"><i></i>Về đích</span><span style="--c:var(--bad)"><i></i>Verify hỏng</span></div>
</div>
</div>
<script>
const RIDES=['🏎️','🚗','🚙','🚕','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚌','🚎','🏍️','🛵','🚜','🚘','🛺'];
const ride=id=>RIDES[[...id].reduce((h,ch)=>(h*31+ch.charCodeAt(0))>>>0,7)%RIDES.length];
const STAGE={'Về đích':['🏆','--done','Về đích'],'Tai nạn (verify hỏng)':['💥','--bad','Verify hỏng'],'Chờ verify + commit':['','--wait','Chờ commit'],
  'Đang review':['','--review','Đang review'],'Viết xong, chờ review':['','--wait','Chờ review'],'Đang viết':['','--write','Đang viết'],
  'Vào pit (chờ thử lại)':['🔧','--pit','Pit, thử lại'],'Chờ xuất phát':['','--pit','Chờ xuất phát']};
const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const MARKS=[[8,'Viết'],[62,'Review'],[90,'Commit']];
async function tick(){
  let d;try{d=await (await fetch('/api/race',{cache:'no-store'})).json()}catch(e){document.getElementById('sub').textContent='⚠️ Mất kết nối tới race.js';return}
  const cars=d.cars,done=cars.filter(c=>c.pct===100),racing=cars.filter(c=>c.pct<100);
  const count=f=>cars.filter(f).length;
  document.getElementById('sub').textContent='cập nhật '+d.at+' · làm mới mỗi 5 giây';
  const avg=cars.length?cars.reduce((s,c)=>s+c.pct,0)/cars.length:0;
  document.getElementById('ring').style.setProperty('--p',avg.toFixed(1));
  document.getElementById('ringv').textContent=Math.round(avg)+'%';
  document.getElementById('stats').innerHTML=[
    ['Về đích',done.length+'/'+cars.length,'--done'],['Đang viết',count(c=>c.stage==='Đang viết'),'--write'],
    ['Đang review',count(c=>c.stage==='Đang review'),'--review'],['Chờ',count(c=>/chờ|Chờ/.test(c.stage)&&c.pct<100),'--wait'],
    ['Hỏng / pit',count(c=>/Tai nạn|pit/.test(c.stage)),'--bad']]
    .map(([k,v,c])=>'<div class="stat" style="--c:var('+c+')"><b>'+v+'</b><small>'+k+'</small></div>').join('');
  // timing tower: everyone, leader first
  document.getElementById('cnt').textContent=cars.length+' xe';
  document.getElementById('tower').innerHTML=cars.map((c,i)=>{const [em,col,lab]=STAGE[c.stage]||['','--write',c.stage];
    return '<div class="row" style="--c:var('+col+')" title="'+esc(c.title)+'"><span class="pos mono">'+(i+1)+'</span><span class="bar"></span>'+
      '<span class="tid mono">'+(em||ride(c.id))+' '+esc(c.id)+'</span><span class="tname"><div>'+esc(c.title)+'</div><small>'+esc(lab)+(c.runner?' · '+esc(c.runner):'')+(c.since?' · '+esc(c.since):'')+'</small></span>'+
      '<span class="pct mono">'+c.pct+'%</span></div>'}).join('');
  // track: only cars still racing
  const track=document.getElementById('track');
  if(!track.querySelector('.marks'))track.innerHTML='<div class="marks">'+MARKS.map(([p,t])=>'<div class="mark" style="left:'+p+'%"><span>'+t+'</span></div>').join('')+'</div><div class="finish"></div>';
  const seen=new Set();
  racing.forEach(c=>{
    seen.add(c.id);
    let lane=document.getElementById('l-'+c.id);
    if(!lane){lane=document.createElement('div');lane.className='lane';lane.id='l-'+c.id;
      lane.innerHTML='<div class="label mono"></div><div class="road"><div class="car"><span class="tip mono"></span><span class="emoji"></span></div></div>'}
    track.appendChild(lane);
    const [em,col]=STAGE[c.stage]||['','--write'];
    const car=lane.querySelector('.car');
    lane.querySelector('.label').textContent=c.id;
    car.className='car'+(/Đang/.test(c.stage)?' run':'');
    car.style.setProperty('--c','var('+col+')');
    car.querySelector('.emoji').textContent=em||ride(c.id);
    car.querySelector('.tip').textContent=c.pct+'%';
    car.title=c.title+' — '+c.stage;
    car.style.left=c.pct+'%';
  });
  [...track.querySelectorAll('.lane')].forEach(l=>{if(!seen.has(l.id.slice(2)))l.remove()});
  const empty=track.querySelector('.empty');
  if(!racing.length&&!empty)track.insertAdjacentHTML('beforeend','<div class="empty">🎉 Tất cả đã về đích!</div>');
  if(racing.length&&empty)empty.remove();
  document.getElementById('podium').hidden=!done.length;
  document.getElementById('donecnt').textContent=done.length;
  document.getElementById('chips').innerHTML=done.map(c=>'<span class="chip">🏆 <b class="mono">'+esc(c.id)+'</b> '+esc(c.title)+'</span>').join('');
}
tick();setInterval(tick,5000);
</script></body></html>`;

http.createServer((req, res) => {
  if (req.url.startsWith('/api/race')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(status()));
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(PAGE);
}).listen(PORT, () => console.log('Task race: http://localhost:' + PORT));
