(function () {
  'use strict';

  const esc = App.esc;
  const CV_KEY = 'sjp.career.cv';
  const CV_RESULT_KEY = 'sjp.career.cvResult';
  const THEMES = ['Sự cố production', 'Xung đột', 'Dẫn dắt', 'Thất bại', 'Deadline gấp', 'Thuyết phục', 'Mentoring'];
  const ROUNDS = ['HR', 'Technical', 'System design', 'Manager', 'Final'];
  const RESULTS = { pending: 'Chờ', passed: 'Đậu', failed: 'Trượt' };
  const readLocal = key => { try { return localStorage.getItem(key) || ''; } catch (e) { return ''; } };
  const writeLocal = (key, value) => { try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ } };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const list = (items, empty) => items && items.length ? '<ul>' + items.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<p class="muted">' + empty + '</p>';
  const visible = key => (App.store.data[key] || []).filter(x => !x.deleted);
  const saveStore = () => App.store.save();

  App.registerView('career', {
    title: 'Sự nghiệp',
    render(root, params) {
      const tab = ['cv', 'log'].includes(params && params[0]) ? params[0] : 'star';
      let draftStar = null, speech = null, busy = false;

      const tabs = `<nav class="cr-tabs" aria-label="Công cụ sự nghiệp">
        <a class="btn${tab === 'star' ? ' primary' : ''}" href="#/career/star">Câu chuyện STAR</a>
        <a class="btn${tab === 'cv' ? ' primary' : ''}" href="#/career/cv">Góp ý CV</a>
        <a class="btn${tab === 'log' ? ' primary' : ''}" href="#/career/log">Nhật ký phỏng vấn</a>
      </nav>`;

      function renderStar() {
        const stories = visible('stories').slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        const represented = new Set(stories.flatMap(s => s.themes || []));
        root.innerHTML = `<div class="page-head"><h1>Sự nghiệp · Câu chuyện STAR</h1><p class="muted">Biến trải nghiệm công việc thành câu trả lời behavioral ngắn gọn, có kết quả cụ thể.</p></div>${tabs}
          <div class="cr-layout"><section class="card"><h2>${draftStar ? 'Chỉnh sửa câu chuyện STAR' : 'Thêm câu chuyện'}</h2>
            <label class="cr-label" for="cr-notes">Ghi chú thô: bối cảnh, việc bạn làm, kết quả</label>
            <textarea class="textarea" id="cr-notes" rows="5" placeholder="Kể tự nhiên, chưa cần viết theo STAR…">${esc(draftStar ? draftStar.notes || '' : '')}</textarea>
            <label class="cr-label" for="cr-theme">Chủ đề (tuỳ chọn)</label><input class="input" id="cr-theme" list="cr-themes" value="${esc(draftStar ? (draftStar.themes || []).join(', ') : '')}" placeholder="Ví dụ: Dẫn dắt, sự cố production">
            <datalist id="cr-themes">${THEMES.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
            <div class="cr-field"><label for="cr-lang">Ngôn ngữ</label><select id="cr-lang" class="select"><option value="vi"${!draftStar || draftStar.lang !== 'en' ? ' selected' : ''}>Tiếng Việt</option><option value="en"${draftStar && draftStar.lang === 'en' ? ' selected' : ''}>English</option></select></div>
            <div class="row"><button type="button" class="btn primary" data-act="generate-star">🤖 Viết thành STAR</button><span class="cr-ai-status" aria-live="polite"></span></div>
            ${draftStar ? `<div class="cr-star-editor"><label class="cr-label" for="cr-s">Situation</label><textarea id="cr-s" class="textarea" rows="3">${esc(draftStar.situation || '')}</textarea>
              <label class="cr-label" for="cr-t">Task</label><textarea id="cr-t" class="textarea" rows="3">${esc(draftStar.task || '')}</textarea>
              <label class="cr-label" for="cr-a">Action</label><textarea id="cr-a" class="textarea" rows="4">${esc(draftStar.action || '')}</textarea>
              <label class="cr-label" for="cr-r">Result</label><textarea id="cr-r" class="textarea" rows="3">${esc(draftStar.result || '')}</textarea>
              <label class="cr-label" for="cr-spoken">Bản kể hoàn chỉnh</label><textarea id="cr-spoken" class="textarea" rows="6">${esc(draftStar.spoken || '')}</textarea>
              ${(draftStar.gaps || []).length ? `<div class="cr-warnings"><b>Cần bổ sung</b>${list(draftStar.gaps)}</div>` : ''}
              ${(draftStar.follow_ups || []).length ? `<h3>Câu hỏi đào sâu</h3>${list(draftStar.follow_ups)}</div>` : '</div>'}
              <div class="row"><button type="button" class="btn primary" data-act="save-star">Lưu câu chuyện</button><button type="button" class="btn" data-act="cancel-star">Huỷ</button></div>
              <section class="cr-practice"><h3>Luyện kể trong khoảng 2 phút</h3><div class="cr-spoken-preview" lang="${draftStar.lang === 'en' ? 'en' : 'vi'}">${esc(draftStar.spoken || 'Bản kể sẽ xuất hiện sau khi bạn tạo STAR.')}</div>
                ${App.speech.supported ? '<button type="button" class="btn mic-btn" data-act="practice">🎤 Luyện kể</button>' : '<p class="muted small">Nhận dạng giọng nói không được hỗ trợ; bạn vẫn có thể luyện bằng cách đọc bản kể thành tiếng.</p>'}<div class="cr-speech-result" aria-live="polite"></div></section>` : ''}
          </section><aside class="card"><h2>Chủ đề behavioral hay gặp</h2><p class="muted small">Chủ đề có ít nhất một câu chuyện đã lưu sẽ được đánh dấu.</p><div class="cr-theme-list">${THEMES.map(t => `<span class="badge${represented.has(t) ? ' ok' : ''}">${represented.has(t) ? '✓ ' : '○ '}${esc(t)}</span>`).join('')}</div>
            <h2>Câu chuyện đã lưu (${stories.length})</h2>${stories.length ? stories.map(s => `<article class="cr-story"><h3>${esc(s.title || s.themes && s.themes[0] || 'Câu chuyện STAR')}</h3><div class="chips">${(s.themes || []).map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div><p class="muted">${esc((s.spoken || s.notes || '').slice(0, 240))}${(s.spoken || s.notes || '').length > 240 ? '…' : ''}</p><div class="row"><button class="btn sm" data-act="edit-story" data-id="${esc(s.id)}">Sửa</button><button class="btn sm bad" data-act="delete-story" data-id="${esc(s.id)}">Xoá</button></div></article>`).join('') : '<p class="muted">Chưa lưu câu chuyện nào.</p>'}</aside></div>`;
      }

      function renderCv() {
        let result = null;
        try { result = JSON.parse(readLocal(CV_RESULT_KEY) || 'null'); } catch (e) { result = null; }
        root.innerHTML = `<div class="page-head"><h1>Sự nghiệp · Góp ý CV</h1><p class="muted">Nhận phản hồi về độ rõ ràng, tác động và mức phù hợp với vị trí mục tiêu.</p></div>${tabs}
          <section class="card"><label class="cr-label" for="cr-cv">Nội dung CV</label><textarea class="textarea cr-cv-input" id="cr-cv" rows="16" placeholder="Dán CV dạng text vào đây…">${esc(readLocal(CV_KEY))}</textarea>
          <label class="cr-label" for="cr-target">Vị trí/JD mục tiêu (tuỳ chọn)</label><textarea class="textarea" id="cr-target" rows="4" placeholder="Senior Java Backend Engineer…"></textarea>
          <div class="row"><button class="btn primary" data-act="review-cv">🤖 Review CV</button><span class="cr-ai-status" aria-live="polite"></span></div></section>${result ? renderCvResult(result) : ''}`;
      }

      function renderCvResult(r) {
        return `<section class="card cr-cv-result"><div class="row">${App.ui.scoreBadge(r.score)}<b>${esc(r.verdict || '')}</b></div>
          <div class="grid"><section><h3>Điểm mạnh</h3>${list(r.strengths, 'Chưa có nhận xét.')}</section><section><h3>Từ khoá còn thiếu</h3>${list(r.missing_keywords, 'Không có từ khoá được đề xuất.')}
          ${(r.missing_keywords || []).length ? '<p class="muted small">Chỉ thêm từ khoá nếu bạn thực sự đã làm việc đó.</p>' : ''}</section></div>
          <h3>Gợi ý chỉnh sửa</h3>${r.issues && r.issues.length ? `<div class="cr-table-wrap"><table><thead><tr><th>Vị trí</th><th>Vấn đề</th><th>Gợi ý sửa</th><th></th></tr></thead><tbody>${r.issues.map((x, i) => `<tr><td>${esc(x.where)}</td><td>${esc(x.problem)}</td><td>${esc(x.fix)}</td><td><button class="btn sm" data-act="copy-fix" data-index="${i}">Copy</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Không có mục cần sửa cụ thể.</p>'}
          <h3>Câu hỏi có thể được hỏi</h3>${list(r.likely_questions, 'Chưa có câu hỏi gợi ý.')}</section>`;
      }

      function matchQuestion(text) {
        const words = s => new Set((s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z0-9+#.]{3,}/g) || []);
        const needle = words(text); let best = null, score = 0;
        App.questions().forEach(q => {
          const tokens = words(q.q); let n = 0; needle.forEach(w => { if (tokens.has(w)) n++; });
          const ratio = n / Math.max(needle.size, 1);
          if (n >= 2 && ratio > score) { best = q; score = ratio; }
        });
        return best;
      }

      function renderLog() {
        const logs = visible('interviewLog').slice().sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.updatedAt || 0) - (a.updatedAt || 0));
        const passed = logs.filter(x => x.result === 'passed').length;
        const companies = new Set(logs.map(x => x.company).filter(Boolean));
        const companiesList = window.COMPANIES || [];
        root.innerHTML = `<div class="page-head"><h1>Sự nghiệp · Nhật ký phỏng vấn</h1><p class="muted">Ghi lại từng vòng để rút kinh nghiệm và tìm câu hỏi cần ôn tiếp.</p></div>${tabs}
          <div class="cr-stats"><div class="stat"><b>${logs.length}</b><span>buổi</span></div><div class="stat"><b>${logs.length ? Math.round(passed * 100 / logs.length) : 0}%</b><span>tỷ lệ đậu</span></div><div class="stat"><b>${companies.size}</b><span>công ty</span></div></div>
          <form class="card cr-log-form"><h2>Thêm buổi phỏng vấn</h2><div class="cr-form-grid"><div><label class="cr-label" for="cr-company">Công ty</label><input class="input" id="cr-company" name="company" list="cr-company-list" placeholder="Tên công ty"><datalist id="cr-company-list">${companiesList.map(c => `<option value="${esc(c.name)}">`).join('')}</datalist></div>
          <div><label class="cr-label" for="cr-position">Vị trí</label><input class="input" id="cr-position" name="position" placeholder="Senior Java Engineer"></div><div><label class="cr-label" for="cr-date">Ngày</label><input class="input" id="cr-date" name="date" type="date" value="${App.dayKey(Date.now())}" required></div>
          <div><label class="cr-label" for="cr-round">Vòng</label><select class="select" id="cr-round" name="round">${ROUNDS.map(x => `<option>${esc(x)}</option>`).join('')}</select></div><div><label class="cr-label" for="cr-result">Kết quả</label><select class="select" id="cr-result" name="result"><option value="pending">Chờ</option><option value="passed">Đậu</option><option value="failed">Trượt</option></select></div></div>
          <label class="cr-label" for="cr-questions">Câu hỏi đã được hỏi (mỗi dòng một câu)</label><textarea class="textarea" id="cr-questions" name="questions" rows="5"></textarea>
          <label class="cr-label" for="cr-notes">Ghi chú / bài học</label><textarea class="textarea" id="cr-log-notes" name="notes" rows="4"></textarea><button class="btn primary" type="submit">Lưu buổi phỏng vấn</button></form>
          <div class="cr-log-list"><h2>Lịch sử (${logs.length})</h2>${logs.length ? logs.map(x => `<article class="card cr-log-card"><div class="cr-log-head"><div><h3>${esc(x.company || 'Chưa ghi công ty')} · ${esc(x.round || '')}</h3><p class="muted">${esc(x.date || '')}${x.position ? ' · ' + esc(x.position) : ''}</p></div><span class="badge ${x.result === 'passed' ? 'ok' : x.result === 'failed' ? 'bad' : 'warn'}">${esc(RESULTS[x.result] || 'Chờ')}</span></div>
          ${x.notes ? `<p>${esc(x.notes)}</p>` : ''}${(x.questions || []).length ? `<h4>Câu hỏi đã gặp</h4><ul>${x.questions.map(q => { const match = matchQuestion(q); return `<li>${esc(q)} ${match ? `<a href="#/bank/${esc(match.topic)}" class="cr-match">Ôn câu tương tự: ${esc(match.q.slice(0, 100))}</a>` : '<span class="badge warn">Chưa có trong ngân hàng</span>'}</li>`; }).join('')}</ul>` : ''}
          <button class="btn sm bad" data-act="delete-log" data-id="${esc(x.id)}">Xoá nhật ký</button></article>`).join('') : '<p class="empty">Chưa có nhật ký phỏng vấn.</p>'}</div>
          <div class="row"><button class="btn" data-act="export-missing">Xuất câu chưa có</button><span class="muted small">Tải các câu chưa tìm thấy trong ngân hàng thành file .txt.</span></div>`;
      }

      function render() { if (tab === 'cv') renderCv(); else if (tab === 'log') renderLog(); else renderStar(); }
      render();

      async function generateStar(button) {
        const notes = root.querySelector('#cr-notes').value.trim();
        if (notes.length < 80) { root.querySelector('.cr-ai-status').textContent = 'Hãy thêm ít nhất 80 ký tự để có đủ bối cảnh.'; return; }
        if (busy) return;
        busy = true; button.disabled = true;
        root.querySelector('.cr-ai-status').innerHTML = '<span class="ai-loading">AI đang viết câu chuyện…</span>';
        try {
          const themes = root.querySelector('#cr-theme').value.split(',').map(x => x.trim()).filter(Boolean);
          const r = await App.ai.coach.star({ situation: notes, theme: themes[0], lang: root.querySelector('#cr-lang').value });
          draftStar = { ...r, notes, themes: themes.length ? themes : (r.themes || []), lang: root.querySelector('#cr-lang').value };
          renderStar();
        } catch (e) { root.querySelector('.cr-ai-status').innerHTML = App.ui.error(e); }
        finally { busy = false; }
      }

      async function reviewCv(button) {
        const cv = root.querySelector('#cr-cv').value.trim();
        writeLocal(CV_KEY, cv);
        if (cv.length < 300) { root.querySelector('.cr-ai-status').textContent = 'CV cần ít nhất 300 ký tự để review.'; return; }
        if (busy) return;
        busy = true; button.disabled = true;
        root.querySelector('.cr-ai-status').innerHTML = '<span class="ai-loading">AI đang review CV…</span>';
        try {
          const r = await App.ai.coach.cv({ cv, target: root.querySelector('#cr-target').value.trim() || undefined });
          writeLocal(CV_RESULT_KEY, JSON.stringify(r));
          const old = root.querySelector('.cr-cv-result'); if (old) old.remove();
          root.querySelector('.cr-ai-status').textContent = '';
          root.insertAdjacentHTML('beforeend', renderCvResult(r));
        } catch (e) { root.querySelector('.cr-ai-status').innerHTML = App.ui.error(e); }
        finally { busy = false; button.disabled = false; }
      }

      function onClick(e) {
        const act = e.target.closest('[data-act]'); if (!act) return;
        switch (act.dataset.act) {
          case 'generate-star': generateStar(act); break;
          case 'save-star': {
            if (!draftStar) return;
            const s = { ...draftStar, situation: root.querySelector('#cr-s').value, task: root.querySelector('#cr-t').value, action: root.querySelector('#cr-a').value, result: root.querySelector('#cr-r').value, spoken: root.querySelector('#cr-spoken').value, updatedAt: Date.now() };
            if (!s.id) { s.id = uid(); (App.store.data.stories = App.store.data.stories || []).push(s); }
            else { const i = (App.store.data.stories || []).findIndex(x => x.id === s.id); if (i >= 0) App.store.data.stories[i] = s; else App.store.data.stories.push(s); }
            saveStore(); draftStar = null; renderStar(); break;
          }
          case 'cancel-star': draftStar = null; renderStar(); break;
          case 'edit-story': { const s = visible('stories').find(x => x.id === act.dataset.id); if (s) { draftStar = { ...s }; renderStar(); } break; }
          case 'delete-story': { const s = (App.store.data.stories || []).find(x => x.id === act.dataset.id); if (s) { s.deleted = true; s.updatedAt = Date.now(); saveStore(); renderStar(); } break; }
          case 'review-cv': reviewCv(act); break;
          case 'copy-fix': {
            let r; try { r = JSON.parse(readLocal(CV_RESULT_KEY)); } catch (err) { r = null; }
            const fix = r && r.issues && r.issues[Number(act.dataset.index)] && r.issues[Number(act.dataset.index)].fix;
            if (fix && navigator.clipboard) navigator.clipboard.writeText(fix).then(() => { act.textContent = 'Đã copy'; }).catch(() => { act.textContent = 'Không copy được'; });
            break;
          }
          case 'practice': {
            if (speech) {
              const metrics = speech.stop(); speech = null; act.classList.remove('recording'); act.textContent = '🎤 Luyện kể';
              const out = root.querySelector('.cr-speech-result');
              if (out && metrics) out.innerHTML = App.ui.speechStats(metrics) + `<p class="muted small">Mục tiêu khoảng 2 phút; ${metrics.seconds < 90 ? 'thử bổ sung thêm chi tiết.' : metrics.seconds > 150 ? 'thử rút gọn để câu trả lời súc tích.' : 'thời lượng đang ở khoảng phù hợp.'}</p>`;
              return;
            }
            act.classList.add('recording'); act.textContent = '⏹ Dừng luyện kể';
            speech = App.speech.start({ lang: draftStar && draftStar.lang === 'en' ? 'en' : 'vi', onText(final, interim) { const out = root.querySelector('.cr-speech-result'); if (out) out.textContent = (final || '') + (interim ? ' ' + interim : ''); }, onError(msg) { const out = root.querySelector('.cr-speech-result'); if (out) out.textContent = msg; } });
            break;
          }
          case 'delete-log': { const x = (App.store.data.interviewLog || []).find(v => v.id === act.dataset.id); if (x) { x.deleted = true; x.updatedAt = Date.now(); saveStore(); renderLog(); } break; }
          case 'export-missing': {
            const missing = visible('interviewLog').flatMap(x => x.questions || []).filter(q => !matchQuestion(q));
            const unique = [...new Set(missing)];
            if (!unique.length) { act.insertAdjacentHTML('afterend', '<span class="muted small">Không có câu hỏi mới.</span>'); return; }
            const a = document.createElement('a'); const url = URL.createObjectURL(new Blob([unique.join('\n') + '\n'], { type: 'text/plain;charset=utf-8' }));
            a.href = url; a.download = 'cau-hoi-chua-co-' + App.dayKey(Date.now()) + '.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); break;
          }
        }
      }
      function onSubmit(e) {
        if (!e.target.matches('.cr-log-form')) return;
        e.preventDefault(); const f = new FormData(e.target);
        const entry = { id: uid(), updatedAt: Date.now(), company: String(f.get('company') || '').trim(), position: String(f.get('position') || '').trim(), date: String(f.get('date') || ''), round: String(f.get('round') || ''), result: String(f.get('result') || 'pending'), questions: String(f.get('questions') || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean), notes: String(f.get('notes') || '').trim() };
        (App.store.data.interviewLog = App.store.data.interviewLog || []).push(entry); saveStore(); renderLog();
      }
      function onInput(e) { if (e.target.matches('#cr-cv')) writeLocal(CV_KEY, e.target.value); }
      root.addEventListener('click', onClick); root.addEventListener('submit', onSubmit); root.addEventListener('input', onInput);
      return () => { if (speech) speech.stop(); root.removeEventListener('click', onClick); root.removeEventListener('submit', onSubmit); root.removeEventListener('input', onInput); };
    },
  });
})();
