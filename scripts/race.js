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
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Task Race</title>
<style>
:root{--bg:#eef1f6;--fg:#1d2330;--muted:#667085;--card:#fff;--border:#dde3ec;--asphalt:#2b303b;--asphalt2:#323844;--stripe:#f5f5f5;--kerb1:#e53935;--kerb2:#fafafa;
--write:#3b82f6;--review:#a855f7;--wait:#f59e0b;--done:#16a34a;--bad:#ef4444;--pit:#94a3b8}
@media (prefers-color-scheme:dark){:root{--bg:#0d1117;--fg:#e6edf3;--muted:#8b949e;--card:#161b22;--border:#30363d;--asphalt:#1c2129;--asphalt2:#222832;--stripe:#c9d1d9}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;padding:20px 16px 40px}
.wrap{max-width:1200px;margin:0 auto}
header{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}
h1{margin:0;font-size:26px;letter-spacing:-.02em}h1 span{display:inline-block;animation:wave 2s ease-in-out infinite}
@keyframes wave{50%{transform:rotate(-12deg)}}
.sub{color:var(--muted);font-size:13px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px}
.stat{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:12px 14px;position:relative;overflow:hidden}
.stat b{display:block;font-size:24px;line-height:1.1}.stat small{color:var(--muted)}
.stat::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--c)}
.overall{height:10px;border-radius:99px;background:var(--border);overflow:hidden;margin:0 0 18px}
.overall i{display:block;height:100%;background:linear-gradient(90deg,var(--write),var(--review),var(--done));transition:width 1.5s ease}
.track{background:var(--asphalt);border-radius:18px;padding:14px 0;position:relative;box-shadow:0 10px 30px #0003;
  border-top:8px solid transparent;border-bottom:8px solid transparent;
  border-image:repeating-linear-gradient(90deg,var(--kerb1) 0 24px,var(--kerb2) 24px 48px) 8}
.marks{position:absolute;top:0;bottom:0;left:var(--l);right:var(--r);pointer-events:none}
.mark{position:absolute;top:0;bottom:0;border-left:2px dashed #ffffff22}
.mark span{position:absolute;top:-2px;left:4px;font-size:10px;color:#ffffff88;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}
.finish{position:absolute;top:0;bottom:0;right:var(--r);width:16px;background:repeating-conic-gradient(#111 0 25%,#fff 0 50%) 0 0/16px 16px;opacity:.9}
.lane{position:relative;height:64px;display:flex;align-items:center}
.lane:nth-child(odd){background:var(--asphalt2)}
.lane+.lane{border-top:2px dashed #ffffff18}
.label{position:absolute;left:12px;width:64px;font:700 13px ui-monospace,Consolas,monospace;color:#fff;opacity:.85}
.road{position:absolute;left:var(--l);right:var(--r);top:0;bottom:0}
.car{position:absolute;top:50%;left:0;transform:translate(-50%,-50%);transition:left 1.6s cubic-bezier(.3,.8,.3,1);display:flex;flex-direction:column;align-items:center}
.car .emoji{font-size:32px;line-height:1;transform:scaleX(-1);filter:drop-shadow(0 3px 2px #0006)}
.car.run .emoji{animation:bump .35s infinite alternate}
@keyframes bump{to{transform:scaleX(-1) translateY(-3px) rotate(-2deg)}}
.car.run::after{content:"";position:absolute;right:70%;top:46%;width:46px;height:3px;border-radius:3px;background:linear-gradient(90deg,transparent,#ffffff70);animation:speed .5s linear infinite}
@keyframes speed{from{opacity:.2;transform:translateX(8px)}to{opacity:.8;transform:translateX(0)}}
.tag{position:absolute;bottom:calc(100% - 2px);background:var(--card);color:var(--fg);border-radius:10px;padding:3px 9px;font-size:12px;white-space:nowrap;
  box-shadow:0 2px 8px #0005;border-left:4px solid var(--c);max-width:min(340px,60vw);overflow:hidden;text-overflow:ellipsis}
.tag small{color:var(--muted)}
.car.right .tag{right:0}.car.left .tag{left:0}
.legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:14px;color:var(--muted);font-size:12px}
.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--c);margin-right:5px;vertical-align:-1px}
.podium{margin-top:20px;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:12px 14px}
.podium h2{margin:0 0 8px;font-size:15px}.podium .chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{border:1px solid var(--border);border-radius:99px;padding:3px 10px;font-size:12px}.chip b{font-family:ui-monospace,Consolas,monospace}
.empty{color:#fff9;padding:28px;text-align:center}
@media (max-width:640px){.label{width:44px;font-size:11px}.tag{font-size:11px}.car .emoji{font-size:26px}}
</style></head><body><div class="wrap">
<header><div><h1><span>🏁</span> Task Race</h1><div class="sub" id="sub">đang tải…</div></div></header>
<div class="stats" id="stats"></div>
<div class="overall"><i id="overall" style="width:0"></i></div>
<div class="track" id="track" style="--l:84px;--r:28px"></div>
<div class="legend">
  <span style="--c:var(--pit)"><i></i>Chờ / pit</span><span style="--c:var(--write)"><i></i>Đang viết</span>
  <span style="--c:var(--wait)"><i></i>Chờ review / commit</span><span style="--c:var(--review)"><i></i>Đang review</span>
  <span style="--c:var(--done)"><i></i>Về đích</span><span style="--c:var(--bad)"><i></i>Verify hỏng</span></div>
<div class="podium" id="podium" hidden><h2>🏆 Đã về đích</h2><div class="chips" id="chips"></div></div>
</div>
<script>
const RIDES=['🏎️','🚗','🚙','🚕','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚌','🚎','🏍️','🛵','🚜','🚘','🛺'];
const ride=id=>RIDES[[...id].reduce((h,ch)=>(h*31+ch.charCodeAt(0))>>>0,7)%RIDES.length];
const STAGE={'Về đích':['🏆','--done'],'Tai nạn (verify hỏng)':['💥','--bad'],'Chờ verify + commit':['','--wait'],'Đang review':['','--review'],
  'Viết xong, chờ review':['','--wait'],'Đang viết':['','--write'],'Vào pit (chờ thử lại)':['🔧','--pit'],'Chờ xuất phát':['','--pit']};
const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const MARKS=[[8,'Viết'],[62,'Review'],[90,'Commit']];
async function tick(){
  let d;try{d=await (await fetch('/api/race',{cache:'no-store'})).json()}catch(e){document.getElementById('sub').textContent='⚠️ Mất kết nối tới race.js';return}
  const cars=d.cars, done=cars.filter(c=>c.pct===100), racing=cars.filter(c=>c.pct<100);
  const count=f=>cars.filter(f).length;
  document.getElementById('sub').textContent='Cập nhật '+d.at+' · tự làm mới mỗi 5 giây';
  document.getElementById('stats').innerHTML=[
    ['Về đích',done.length+'/'+cars.length,'--done'],['Đang viết',count(c=>c.stage==='Đang viết'),'--write'],
    ['Đang review',count(c=>c.stage==='Đang review'),'--review'],['Chờ',count(c=>/chờ|Chờ/.test(c.stage)&&c.pct<100),'--wait'],
    ['Hỏng / pit',count(c=>/Tai nạn|pit/.test(c.stage)),'--bad']]
    .map(([k,v,c])=>'<div class="stat" style="--c:var('+c+')"><b>'+v+'</b><small>'+k+'</small></div>').join('');
  const avg=cars.length?cars.reduce((s,c)=>s+c.pct,0)/cars.length:0;
  document.getElementById('overall').style.width=avg.toFixed(1)+'%';
  const track=document.getElementById('track');
  if(!track.querySelector('.marks')){track.innerHTML='<div class="marks">'+MARKS.map(([p,t])=>'<div class="mark" style="left:'+p+'%"><span>'+t+'</span></div>').join('')+'</div><div class="finish"></div>'}
  const seen=new Set();
  racing.forEach(c=>{
    seen.add(c.id);
    let lane=document.getElementById('l-'+c.id);
    if(!lane){lane=document.createElement('div');lane.className='lane';lane.id='l-'+c.id;
      lane.innerHTML='<div class="label"></div><div class="road"><div class="car"><span class="emoji"></span><span class="tag"></span></div></div>'}
    track.appendChild(lane);
    const [emoji,color]=STAGE[c.stage]||['','--write'];
    const car=lane.querySelector('.car');
    lane.querySelector('.label').textContent=c.id;
    car.className='car'+(/Đang/.test(c.stage)?' run':'')+(c.pct>55?' right':' left');
    car.style.setProperty('--c','var('+color+')');
    car.querySelector('.emoji').textContent=emoji||ride(c.id);   // each task keeps its own vehicle; trophy/crash/pit override
    car.querySelector('.tag').innerHTML=esc(c.title)+' <small>· '+esc(c.stage)+' · '+c.pct+'%'+(c.runner?' · '+esc(c.runner):'')+(c.since?' · từ '+esc(c.since):'')+'</small>';
    car.style.left=c.pct+'%';
  });
  [...track.querySelectorAll('.lane')].forEach(l=>{if(!seen.has(l.id.slice(2)))l.remove()});
  if(!racing.length&&!track.querySelector('.empty'))track.insertAdjacentHTML('beforeend','<div class="empty">🎉 Tất cả đã về đích!</div>');
  if(racing.length)track.querySelector('.empty')?.remove();
  document.getElementById('podium').hidden=!done.length;
  document.getElementById('chips').innerHTML=done.map(c=>'<span class="chip">🏆 <b>'+esc(c.id)+'</b> '+esc(c.title)+'</span>').join('');
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
