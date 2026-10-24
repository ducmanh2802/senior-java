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
                since: rev.start && !rev.end ? rev.start : run.start && !run.end ? run.start : '' });
  }
  cars.sort((a, b) => b.pct - a.pct || a.id.localeCompare(b.id, 'en', { numeric: true }));
  return { at: new Date().toLocaleTimeString('vi-VN'), cars };
}

const PAGE = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Task Race</title>
<style>
:root{--bg:#f4f5f7;--fg:#1d2330;--muted:#6b7280;--track:#3b4252;--lane:#4c566a;--line:#e5e9f0;--ok:#16a34a;--bad:#dc2626;--card:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#11141b;--fg:#e6e9ef;--muted:#9aa3b2;--track:#2a2f3a;--lane:#363c4a;--line:#5b6578;--card:#1a1e27}}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.4 system-ui,sans-serif;padding:16px}
h1{margin:0 0 4px;font-size:20px}.sub{color:var(--muted);margin-bottom:16px}
.track{background:var(--track);border-radius:12px;padding:8px 0;overflow:hidden}
.lane{position:relative;height:58px;border-bottom:2px dashed var(--line)}.lane:last-child{border-bottom:0}
.finish{position:absolute;right:0;top:0;bottom:0;width:14px;background:repeating-conic-gradient(#000 0 25%,#fff 0 50%) 0 0/14px 14px}
.car{position:absolute;top:6px;left:0;transition:left 1.5s ease;display:flex;align-items:center;gap:6px;white-space:nowrap}
.car .emoji{font-size:30px;transform:scaleX(-1);display:inline-block}
.car.run .emoji{animation:bump .4s infinite alternate}@keyframes bump{to{transform:scaleX(-1) translateY(-3px)}}
.tag{background:var(--card);color:var(--fg);border-radius:8px;padding:2px 8px;font-size:12px;box-shadow:0 1px 3px #0004}
.tag b{margin-right:4px}.tag small{color:var(--muted)}
.empty{color:var(--muted);padding:24px}
</style></head><body>
<h1>🏁 Task Race</h1><div class="sub" id="sub">đang tải…</div>
<div class="track" id="track"></div>
<script>
const EMOJI={'Về đích':'🏆','Tai nạn (verify hỏng)':'💥','Vào pit (chờ thử lại)':'🔧','Chờ xuất phát':'🚗'};
async function tick(){
  try{
    const d=await (await fetch('/api/race',{cache:'no-store'})).json();
    const track=document.getElementById('track');
    document.getElementById('sub').textContent='Cập nhật '+d.at+' · '+d.cars.filter(c=>c.pct===100).length+'/'+d.cars.length+' về đích';
    if(!d.cars.length){track.innerHTML='<div class="empty">Không có task nào đang chạy.</div>';return}
    const seen=new Set();
    d.cars.forEach((c,i)=>{
      seen.add(c.id);
      let lane=document.getElementById('l-'+c.id);
      if(!lane){lane=document.createElement('div');lane.className='lane';lane.id='l-'+c.id;
        lane.innerHTML='<div class="finish"></div><div class="car"><span class="emoji"></span><span class="tag"></span></div>';track.appendChild(lane)}
      track.appendChild(lane);
      const car=lane.querySelector('.car');
      car.className='car'+(/Đang/.test(c.stage)?' run':'');
      car.querySelector('.emoji').textContent=EMOJI[c.stage]||'🏎️';
      const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
      car.querySelector('.tag').innerHTML='<b>'+esc(c.id)+'</b>'+esc(c.title)+'<br><small>'+esc(c.stage)+' · '+c.pct+'%'+(c.runner?' · '+esc(c.runner):'')+(c.since?' · từ '+esc(c.since):'')+'</small>';
      const w=lane.clientWidth-car.offsetWidth-20;
      car.style.left=Math.max(0,w*c.pct/100)+'px';
    });
    [...track.children].forEach(l=>{if(l.id&&!seen.has(l.id.slice(2)))l.remove()});
  }catch(e){document.getElementById('sub').textContent='Mất kết nối tới race.js'}
}
tick();setInterval(tick,5000);addEventListener('resize',tick);
</script></body></html>`;

http.createServer((req, res) => {
  if (req.url.startsWith('/api/race')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(status()));
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(PAGE);
}).listen(PORT, () => console.log('Task race: http://localhost:' + PORT));
