(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'career.title': 'Sự nghiệp',
      'career.starTitle': 'Câu chuyện STAR',
      'career.starSubtitle': 'Biến trải nghiệm công việc thành câu trả lời behavioral ngắn gọn, có kết quả cụ thể.',
      'career.cvTitle': 'Góp ý CV',
      'career.cvSubtitle': 'Nhận phản hồi về độ rõ ràng, tác động và mức phù hợp với vị trí mục tiêu.',
      'career.logTitle': 'Nhật ký phỏng vấn',
      'career.logSubtitle': 'Ghi lại từng vòng để rút kinh nghiệm và tìm câu hỏi cần ôn tiếp.',
      'career.tabStar': 'Câu chuyện STAR', 'career.tabCv': 'Góp ý CV', 'career.tabLog': 'Nhật ký phỏng vấn',
      'career.addStory': 'Thêm câu chuyện', 'career.editStory': 'Chỉnh sửa câu chuyện STAR',
      'career.notesLabel': 'Ghi chú thô: bối cảnh, việc bạn làm, kết quả', 'career.themeLabel': 'Chủ đề (tuỳ chọn)',
      'career.themePlaceholder': 'Ví dụ: Dẫn dắt, sự cố production', 'career.generateStar': '🤖 Viết thành STAR',
      'career.situation': 'Situation', 'career.task': 'Task', 'career.action': 'Action', 'career.result': 'Result',
      'career.spoken': 'Bản kể hoàn chỉnh', 'career.saveStar': 'Lưu câu chuyện', 'career.cancelStar': 'Huỷ',
      'career.gapsTitle': 'Cần bổ sung', 'career.followUpTitle': 'Câu hỏi đào sâu',
      'career.practiceTitle': 'Luyện kể trong khoảng 2 phút', 'career.practiceBtn': '🎤 Luyện kể',
      'career.behavioralTopics': 'Chủ đề behavioral hay gặp', 'career.behavioralNote': 'Chủ đề có ít nhất một câu chuyện đã lưu sẽ được đánh dấu.',
      'career.savedStories': 'Câu chuyện đã lưu', 'career.editBtn': 'Sửa', 'career.deleteBtn': 'Xoá',
      'career.cvLabel': 'Nội dung CV', 'career.cvPlaceholder': 'Dán CV dạng text vào đây…',
      'career.targetLabel': 'Vị trí/JD mục tiêu (tuỳ chọn)', 'career.targetPlaceholder': 'Senior Java Backend Engineer…',
      'career.reviewCv': '🤖 Review CV', 'career.strengths': 'Điểm mạnh', 'career.missingKeywords': 'Từ khoá còn thiếu',
      'career.missingNote': 'Chỉ thêm từ khoá nếu bạn thực sự đã làm việc đó.', 'career.editSuggestions': 'Gợi ý chỉnh sửa',
      'career.copyBtn': 'Copy', 'career.likelyQuestions': 'Câu hỏi có thể được hỏi', 'career.noIssues': 'Không có mục cần sửa cụ thể.', 'career.noQuestions': 'Chưa có câu hỏi gợi ý.',
      'career.logFormTitle': 'Thêm buổi phỏng vấn', 'career.company': 'Công ty', 'career.companyPlaceholder': 'Tên công ty',
      'career.position': 'Vị trí', 'career.positionPlaceholder': 'Senior Java Engineer', 'career.date': 'Ngày',
      'career.round': 'Vòng', 'career.result': 'Kết quả', 'career.pending': 'Chờ', 'career.passed': 'Đậu', 'career.failed': 'Trượt',
      'career.questionsLabel': 'Câu hỏi đã được hỏi (mỗi dòng một câu)', 'career.notesLog': 'Ghi chú / bài học',
      'career.saveLog': 'Lưu buổi phỏng vấn', 'career.historyTitle': 'Lịch sử ({n})',
      'career.session': 'buổi', 'career.passRate': 'tỷ lệ đậu', 'career.companyCount': 'công ty',
      'career.logEmpty': 'Chưa có nhật ký phỏng vấn.', 'career.exportBtn': 'Xuất câu chưa có', 'career.exportNote': 'Tải các câu chưa tìm thấy trong ngân hàng thành file .txt.',
      'career.deleteLog': 'Xoá nhật ký', 'career.noNewQuestions': 'Không có câu hỏi mới.',
      'career.copyDone': 'Đã copy', 'career.copyFailed': 'Không copy được',
      'career.speechHint': 'Mục tiêu khoảng 2 phút; {detail}', 'career.speechShort': 'thử bổ sung thêm chi tiết.', 'career.speechLong': 'thử rút gọn để câu trả lời súc tích.', 'career.okLength': 'thời lượng đang ở khoảng phù hợp.',
      'career.cvTooShort': 'CV cần ít nhất 300 ký tự để review.', 'career.noteTooShort': 'Hãy thêm ít nhất 80 ký tự để có đủ bối cảnh.',
      'career.starPage': 'Sự nghiệp · Câu chuyện STAR', 'career.cvPage': 'Sự nghiệp · Góp ý CV', 'career.logPage': 'Sự nghiệp · Nhật ký phỏng vấn',
      'career.navAria': 'Công cụ sự nghiệp', 'career.notesPlaceholder': 'Kể tự nhiên, chưa cần viết theo STAR…',
      'career.writingStar': 'AI đang viết câu chuyện…', 'career.reviewingCv': 'AI đang review CV…',
      'career.noComment': 'Chưa có nhận xét.', 'career.noKeywords': 'Không có từ khoá được đề xuất.',
      'career.noCompany': 'Chưa ghi công ty', 'career.questionsMet': 'Câu hỏi đã gặp',
      'career.similarQ': 'Ôn câu tương tự: {q}', 'career.notInBank': 'Chưa có trong ngân hàng',
      'career.noStories': 'Chưa lưu câu chuyện nào.', 'career.stopPractice': '⏹ Dừng luyện kể',
      'career.spokenPending': 'Bản kể sẽ xuất hiện sau khi bạn tạo STAR.',
      'career.speechUnsupported': 'Nhận dạng giọng nói không được hỗ trợ; bạn vẫn có thể luyện bằng cách đọc bản kể thành tiếng.',
      'career.whereCol': 'Vị trí', 'career.problemCol': 'Vấn đề', 'career.fixCol': 'Gợi ý sửa',
      'career.themeProd': 'Sự cố production', 'career.themeConflict': 'Xung đột', 'career.themeLead': 'Dẫn dắt',
      'career.themeFail': 'Thất bại', 'career.themeDeadline': 'Deadline gấp', 'career.themePersuade': 'Thuyết phục',
      'career.themeMentoring': 'Mentoring', 'career.langLabel': 'Ngôn ngữ',
    },
    en: {
      'career.title': 'Career', 'career.starTitle': 'STAR Stories', 'career.starSubtitle': 'Turn work experience into concise behavioral answers with concrete results.', 'career.cvTitle': 'CV Feedback', 'career.cvSubtitle': 'Get feedback on clarity, impact and fit for your target role.', 'career.logTitle': 'Interview Log', 'career.logSubtitle': 'Record each round to learn and find questions to review.', 'career.tabStar': 'STAR Stories', 'career.tabCv': 'CV Feedback', 'career.tabLog': 'Interview Log', 'career.addStory': 'Add story', 'career.editStory': 'Edit STAR story', 'career.notesLabel': 'Raw notes: context, what you did, result', 'career.themeLabel': 'Theme (optional)', 'career.themePlaceholder': 'E.g. Leadership, production incident', 'career.generateStar': '🤖 Write STAR', 'career.situation': 'Situation', 'career.task': 'Task', 'career.action': 'Action', 'career.result': 'Result', 'career.spoken': 'Complete spoken version', 'career.saveStar': 'Save story', 'career.cancelStar': 'Cancel', 'career.gapsTitle': 'Needs supplement', 'career.followUpTitle': 'Follow-up questions', 'career.practiceTitle': 'Practice telling in ~2 minutes', 'career.practiceBtn': '🎤 Practice', 'career.behavioralTopics': 'Common behavioral topics', 'career.behavioralNote': 'Topics with at least one saved story are marked.', 'career.savedStories': 'Saved stories', 'career.editBtn': 'Edit', 'career.deleteBtn': 'Delete', 'career.cvLabel': 'CV content', 'career.cvPlaceholder': 'Paste CV text here…', 'career.targetLabel': 'Target role / JD (optional)', 'career.targetPlaceholder': 'Senior Java Backend Engineer…', 'career.reviewCv': '🤖 Review CV', 'career.strengths': 'Strengths', 'career.missingKeywords': 'Missing keywords', 'career.missingNote': 'Only add keywords if you actually did that work.', 'career.editSuggestions': 'Edit suggestions', 'career.copyBtn': 'Copy', 'career.likelyQuestions': 'Likely questions', 'career.noIssues': 'No specific fixes needed.', 'career.noQuestions': 'No suggested questions.', 'career.logFormTitle': 'Add interview', 'career.company': 'Company', 'career.companyPlaceholder': 'Company name', 'career.position': 'Position', 'career.positionPlaceholder': 'Senior Java Engineer', 'career.date': 'Date', 'career.round': 'Round', 'career.result': 'Result', 'career.pending': 'Pending', 'career.passed': 'Passed', 'career.failed': 'Failed', 'career.questionsLabel': 'Questions asked (one per line)', 'career.notesLog': 'Notes / lessons', 'career.saveLog': 'Save session', 'career.historyTitle': 'History ({n})', 'career.session': 'session', 'career.passRate': 'pass rate', 'career.companyCount': 'companies', 'career.logEmpty': 'No interview logs yet.', 'career.exportBtn': 'Export missing', 'career.exportNote': 'Download questions not found in the bank as .txt.', 'career.deleteLog': 'Delete log', 'career.noNewQuestions': 'No new questions.', 'career.copyDone': 'Copied', 'career.copyFailed': 'Copy failed', 'career.speechHint': 'Target ~2 minutes; {detail}', 'career.speechShort': 'add more detail.', 'career.speechLong': 'shorten to be concise.', 'career.okLength': 'duration looks good.', 'career.cvTooShort': 'CV must be at least 300 characters for review.', 'career.noteTooShort': 'Add at least 80 characters for enough context.',
      'career.starPage': 'Career · STAR Stories', 'career.cvPage': 'Career · CV Feedback', 'career.logPage': 'Career · Interview Log',
      'career.navAria': 'Career tools', 'career.notesPlaceholder': 'Tell it naturally, STAR format not required…',
      'career.writingStar': 'AI is writing your story…', 'career.reviewingCv': 'AI is reviewing your CV…',
      'career.noComment': 'No feedback yet.', 'career.noKeywords': 'No keywords suggested.',
      'career.noCompany': 'Company not recorded', 'career.questionsMet': 'Questions asked',
      'career.similarQ': 'Review a similar question: {q}', 'career.notInBank': 'Not in the bank yet',
      'career.noStories': 'No saved stories yet.', 'career.stopPractice': '⏹ Stop practicing',
      'career.spokenPending': 'The spoken version will appear after you generate STAR.',
      'career.speechUnsupported': 'Voice recognition is not supported; you can still practise by reading the spoken version aloud.',
      'career.whereCol': 'Where', 'career.problemCol': 'Problem', 'career.fixCol': 'Suggested fix',
      'career.themeProd': 'Production incident', 'career.themeConflict': 'Conflict', 'career.themeLead': 'Leadership',
      'career.themeFail': 'Failure', 'career.themeDeadline': 'Tight deadline', 'career.themePersuade': 'Persuasion',
      'career.themeMentoring': 'Mentoring', 'career.langLabel': 'Language',
    },
  });

  const esc = App.esc;
  const CV_KEY = 'sjp.career.cv';
  const CV_RESULT_KEY = 'sjp.career.cvResult';
  const THEMES = ['Sự cố production', 'Xung đột', 'Dẫn dắt', 'Thất bại', 'Deadline gấp', 'Thuyết phục', 'Mentoring'];
  const THEME_KEYS = { 'Sự cố production': 'career.themeProd', 'Xung đột': 'career.themeConflict', 'Dẫn dắt': 'career.themeLead', 'Thất bại': 'career.themeFail', 'Deadline gấp': 'career.themeDeadline', 'Thuyết phục': 'career.themePersuade', 'Mentoring': 'career.themeMentoring' };
  const themeLabel = t => (THEME_KEYS[t] ? App.t(THEME_KEYS[t]) : t);
  const ROUNDS = ['HR', 'Technical', 'System design', 'Manager', 'Final'];
  const resultLabel = r => App.t('career.' + (r === 'passed' ? 'passed' : r === 'failed' ? 'failed' : 'pending'));
  const readLocal = key => { try { return localStorage.getItem(key) || ''; } catch (e) { return ''; } };
  const writeLocal = (key, value) => { try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ } };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const list = (items, empty) => items && items.length ? '<ul>' + items.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<p class="muted">' + empty + '</p>';
  const visible = key => (App.store.data[key] || []).filter(x => !x.deleted);
  const saveStore = () => App.store.save();

  App.registerView('career', {
    get title() { return App.t('career.title'); },
    render(root, params) {
      const tab = ['cv', 'log'].includes(params && params[0]) ? params[0] : 'star';
      let draftStar = null, speech = null, busy = false;

      const tabs = `<nav class="cr-tabs" aria-label="${App.t('career.navAria')}">
        <a class="btn${tab === 'star' ? ' primary' : ''}" href="#/career/star">${App.t('career.tabStar')}</a>
        <a class="btn${tab === 'cv' ? ' primary' : ''}" href="#/career/cv">${App.t('career.tabCv')}</a>
        <a class="btn${tab === 'log' ? ' primary' : ''}" href="#/career/log">${App.t('career.tabLog')}</a>
      </nav>`;

      function renderStar() {
        const stories = visible('stories').slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        const represented = new Set(stories.flatMap(s => s.themes || []));
        root.innerHTML = `<div class="page-head"><h1>${App.t('career.starPage')}</h1><p class="muted">${App.t('career.starSubtitle')}</p></div>${tabs}
          <div class="cr-layout"><section class="card"><h2>${draftStar ? App.t('career.editStory') : App.t('career.addStory')}</h2>
            <label class="cr-label" for="cr-notes">${App.t('career.notesLabel')}</label>
            <textarea class="textarea" id="cr-notes" rows="5" placeholder="${App.t('career.notesPlaceholder')}">${esc(draftStar ? draftStar.notes || '' : '')}</textarea>
            <label class="cr-label" for="cr-theme">${App.t('career.themeLabel')}</label><input class="input" id="cr-theme" list="cr-themes" value="${esc(draftStar ? (draftStar.themes || []).join(', ') : '')}" placeholder="${App.t('career.themePlaceholder')}">
            <datalist id="cr-themes">${THEMES.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
            <div class="cr-field"><label for="cr-lang">${App.t('career.langLabel')}</label><select id="cr-lang" class="select"><option value="vi"${!draftStar || draftStar.lang !== 'en' ? ' selected' : ''}>Tiếng Việt</option><option value="en"${draftStar && draftStar.lang === 'en' ? ' selected' : ''}>English</option></select></div>
            <div class="row"><button type="button" class="btn primary" data-act="generate-star">${App.t('career.generateStar')}</button><span class="cr-ai-status" aria-live="polite"></span></div>
            ${draftStar ? `<div class="cr-star-editor"><label class="cr-label" for="cr-s">${App.t('career.situation')}</label><textarea id="cr-s" class="textarea" rows="3">${esc(draftStar.situation || '')}</textarea>
              <label class="cr-label" for="cr-t">${App.t('career.task')}</label><textarea id="cr-t" class="textarea" rows="3">${esc(draftStar.task || '')}</textarea>
              <label class="cr-label" for="cr-a">${App.t('career.action')}</label><textarea id="cr-a" class="textarea" rows="4">${esc(draftStar.action || '')}</textarea>
              <label class="cr-label" for="cr-r">${App.t('career.result')}</label><textarea id="cr-r" class="textarea" rows="3">${esc(draftStar.result || '')}</textarea>
              <label class="cr-label" for="cr-spoken">${App.t('career.spoken')}</label><textarea id="cr-spoken" class="textarea" rows="6">${esc(draftStar.spoken || '')}</textarea>
              ${(draftStar.gaps || []).length ? `<div class="cr-warnings"><b>${App.t('career.gapsTitle')}</b>${list(draftStar.gaps)}</div>` : ''}
              ${(draftStar.follow_ups || []).length ? `<h3>${App.t('career.followUpTitle')}</h3>${list(draftStar.follow_ups)}</div>` : '</div>'}
              <div class="row"><button type="button" class="btn primary" data-act="save-star">${App.t('career.saveStar')}</button><button type="button" class="btn" data-act="cancel-star">${App.t('career.cancelStar')}</button></div>
              <section class="cr-practice"><h3>${App.t('career.practiceTitle')}</h3><div class="cr-spoken-preview" lang="${draftStar.lang === 'en' ? 'en' : 'vi'}">${esc(draftStar.spoken || App.t('career.spokenPending'))}</div>
                ${App.speech.supported ? `<button type="button" class="btn mic-btn" data-act="practice">${App.t('career.practiceBtn')}</button>` : `<p class="muted small">${App.t('career.speechUnsupported')}</p>`}<div class="cr-speech-result" aria-live="polite"></div></section>` : ''}
          </section><aside class="card"><h2>${App.t('career.behavioralTopics')}</h2><p class="muted small">${App.t('career.behavioralNote')}</p><div class="cr-theme-list">${THEMES.map(t => `<span class="badge${represented.has(t) ? ' ok' : ''}">${represented.has(t) ? '✓ ' : '○ '}${esc(themeLabel(t))}</span>`).join('')}</div>
            <h2>${App.t('career.savedStories')} (${stories.length})</h2>${stories.length ? stories.map(s => `<article class="cr-story"><h3>${esc(s.title || s.themes && s.themes[0] || App.t('career.starTitle'))}</h3><div class="chips">${(s.themes || []).map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div><p class="muted">${esc((s.spoken || s.notes || '').slice(0, 240))}${(s.spoken || s.notes || '').length > 240 ? '…' : ''}</p><div class="row"><button class="btn sm" data-act="edit-story" data-id="${esc(s.id)}">${App.t('career.editBtn')}</button><button class="btn sm bad" data-act="delete-story" data-id="${esc(s.id)}">${App.t('career.deleteBtn')}</button></div></article>`).join('') : `<p class="muted">${App.t('career.noStories')}</p>`}</aside></div>`;
      }

      function renderCv() {
        let result = null;
        try { result = JSON.parse(readLocal(CV_RESULT_KEY) || 'null'); } catch (e) { result = null; }
        root.innerHTML = `<div class="page-head"><h1>${App.t('career.cvPage')}</h1><p class="muted">${App.t('career.cvSubtitle')}</p></div>${tabs}
          <section class="card"><label class="cr-label" for="cr-cv">${App.t('career.cvLabel')}</label><textarea class="textarea cr-cv-input" id="cr-cv" rows="16" placeholder="${App.t('career.cvPlaceholder')}">${esc(readLocal(CV_KEY))}</textarea>
          <label class="cr-label" for="cr-target">${App.t('career.targetLabel')}</label><textarea class="textarea" id="cr-target" rows="4" placeholder="${App.t('career.targetPlaceholder')}"></textarea>
          <div class="row"><button class="btn primary" data-act="review-cv">${App.t('career.reviewCv')}</button><span class="cr-ai-status" aria-live="polite"></span></div></section>${result ? renderCvResult(result) : ''}`;
      }

      function renderCvResult(r) {
        return `<section class="card cr-cv-result"><div class="row">${App.ui.scoreBadge(r.score)}<b>${esc(r.verdict || '')}</b></div>
          <div class="grid"><section><h3>${App.t('career.strengths')}</h3>${list(r.strengths, App.t('career.noComment'))}</section><section><h3>${App.t('career.missingKeywords')}</h3>${list(r.missing_keywords, App.t('career.noKeywords'))}
          ${(r.missing_keywords || []).length ? `<p class="muted small">${App.t('career.missingNote')}</p>` : ''}</section></div>
          <h3>${App.t('career.editSuggestions')}</h3>${r.issues && r.issues.length ? `<div class="cr-table-wrap"><table><thead><tr><th>${App.t('career.whereCol')}</th><th>${App.t('career.problemCol')}</th><th>${App.t('career.fixCol')}</th><th></th></tr></thead><tbody>${r.issues.map((x, i) => `<tr><td>${esc(x.where)}</td><td>${esc(x.problem)}</td><td>${esc(x.fix)}</td><td><button class="btn sm" data-act="copy-fix" data-index="${i}">${App.t('career.copyBtn')}</button></td></tr>`).join('')}</tbody></table></div>` : `<p class="muted">${App.t('career.noIssues')}</p>`}
          <h3>${App.t('career.likelyQuestions')}</h3>${list(r.likely_questions, App.t('career.noQuestions'))}</section>`;
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
        root.innerHTML = `<div class="page-head"><h1>${App.t('career.logPage')}</h1><p class="muted">${App.t('career.logSubtitle')}</p></div>${tabs}
          <div class="cr-stats"><div class="stat"><b>${logs.length}</b><span>${App.t('career.session')}</span></div><div class="stat"><b>${logs.length ? Math.round(passed * 100 / logs.length) : 0}%</b><span>${App.t('career.passRate')}</span></div><div class="stat"><b>${companies.size}</b><span>${App.t('career.companyCount')}</span></div></div>
          <form class="card cr-log-form"><h2>${App.t('career.logFormTitle')}</h2><div class="cr-form-grid"><div><label class="cr-label" for="cr-company">${App.t('career.company')}</label><input class="input" id="cr-company" name="company" list="cr-company-list" placeholder="${App.t('career.companyPlaceholder')}"><datalist id="cr-company-list">${companiesList.map(c => `<option value="${esc(c.name)}">`).join('')}</datalist></div>
          <div><label class="cr-label" for="cr-position">${App.t('career.position')}</label><input class="input" id="cr-position" name="position" placeholder="${App.t('career.positionPlaceholder')}"></div><div><label class="cr-label" for="cr-date">${App.t('career.date')}</label><input class="input" id="cr-date" name="date" type="date" value="${App.dayKey(Date.now())}" required></div>
          <div><label class="cr-label" for="cr-round">${App.t('career.round')}</label><select class="select" id="cr-round" name="round">${ROUNDS.map(x => `<option>${esc(x)}</option>`).join('')}</select></div><div><label class="cr-label" for="cr-result">${App.t('career.result')}</label><select class="select" id="cr-result" name="result"><option value="pending">${App.t('career.pending')}</option><option value="passed">${App.t('career.passed')}</option><option value="failed">${App.t('career.failed')}</option></select></div></div>
          <label class="cr-label" for="cr-questions">${App.t('career.questionsLabel')}</label><textarea class="textarea" id="cr-questions" name="questions" rows="5"></textarea>
          <label class="cr-label" for="cr-notes">${App.t('career.notesLog')}</label><textarea class="textarea" id="cr-log-notes" name="notes" rows="4"></textarea><button class="btn primary" type="submit">${App.t('career.saveLog')}</button></form>
          <div class="cr-log-list"><h2>${App.t('career.historyTitle', { n: logs.length })}</h2>${logs.length ? logs.map(x => `<article class="card cr-log-card"><div class="cr-log-head"><div><h3>${esc(x.company || App.t('career.noCompany'))} · ${esc(x.round || '')}</h3><p class="muted">${esc(x.date || '')}${x.position ? ' · ' + esc(x.position) : ''}</p></div><span class="badge ${x.result === 'passed' ? 'ok' : x.result === 'failed' ? 'bad' : 'warn'}">${esc(resultLabel(x.result))}</span></div>
          ${x.notes ? `<p>${esc(x.notes)}</p>` : ''}${(x.questions || []).length ? `<h4>${App.t('career.questionsMet')}</h4><ul>${x.questions.map(q => { const match = matchQuestion(q); return `<li>${esc(q)} ${match ? `<a href="#/bank/${esc(match.topic)}" class="cr-match">${App.t('career.similarQ', { q: esc(match.q.slice(0, 100)) })}</a>` : `<span class="badge warn">${App.t('career.notInBank')}</span>`}</li>`; }).join('')}</ul>` : ''}
          <button class="btn sm bad" data-act="delete-log" data-id="${esc(x.id)}">${App.t('career.deleteLog')}</button></article>`).join('') : `<p class="empty">${App.t('career.logEmpty')}</p>`}</div>
          <div class="row"><button class="btn" data-act="export-missing">${App.t('career.exportBtn')}</button><span class="muted small">${App.t('career.exportNote')}</span></div>`;
      }

      function render() { if (tab === 'cv') renderCv(); else if (tab === 'log') renderLog(); else renderStar(); }
      render();

      async function generateStar(button) {
        const notes = root.querySelector('#cr-notes').value.trim();
        if (notes.length < 80) { root.querySelector('.cr-ai-status').textContent = App.t('career.noteTooShort'); return; }
        if (busy) return;
        busy = true; button.disabled = true;
        root.querySelector('.cr-ai-status').innerHTML = '<span class="ai-loading">' + App.t('career.writingStar') + '</span>';
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
        if (cv.length < 300) { root.querySelector('.cr-ai-status').textContent = App.t('career.cvTooShort'); return; }
        if (busy) return;
        busy = true; button.disabled = true;
        root.querySelector('.cr-ai-status').innerHTML = '<span class="ai-loading">' + App.t('career.reviewingCv') + '</span>';
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
            if (fix && navigator.clipboard) navigator.clipboard.writeText(fix).then(() => { act.textContent = App.t('career.copyDone'); }).catch(() => { act.textContent = App.t('career.copyFailed'); });
            break;
          }
          case 'practice': {
            if (speech) {
              const metrics = speech.stop(); speech = null; act.classList.remove('recording'); act.textContent = App.t('career.practiceBtn');
              const out = root.querySelector('.cr-speech-result');
              if (out && metrics) out.innerHTML = App.ui.speechStats(metrics) + `<p class="muted small">${App.t('career.speechHint', { detail: App.t(metrics.seconds < 90 ? 'career.speechShort' : metrics.seconds > 150 ? 'career.speechLong' : 'career.okLength') })}</p>`;
              return;
            }
            act.classList.add('recording'); act.textContent = App.t('career.stopPractice');
            speech = App.speech.start({ lang: draftStar && draftStar.lang === 'en' ? 'en' : 'vi', onText(final, interim) { const out = root.querySelector('.cr-speech-result'); if (out) out.textContent = (final || '') + (interim ? ' ' + interim : ''); }, onError(msg) { const out = root.querySelector('.cr-speech-result'); if (out) out.textContent = msg; } });
            break;
          }
          case 'delete-log': { const x = (App.store.data.interviewLog || []).find(v => v.id === act.dataset.id); if (x) { x.deleted = true; x.updatedAt = Date.now(); saveStore(); renderLog(); } break; }
          case 'export-missing': {
            const missing = visible('interviewLog').flatMap(x => x.questions || []).filter(q => !matchQuestion(q));
            const unique = [...new Set(missing)];
            if (!unique.length) { act.insertAdjacentHTML('afterend', '<span class="muted small">' + App.t('career.noNewQuestions') + '</span>'); return; }
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
