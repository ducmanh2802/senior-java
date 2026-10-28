# AGENTS.md — Senior Java Prep

Hướng dẫn chung cho mọi coding agent (opencode, Cline, Claude Code…) làm việc trong repo này.
Đọc file này **và** file task của bạn trong `tasks/` trước khi làm bất cứ điều gì.

## 1. Dự án là gì

Web tĩnh để ôn luyện phỏng vấn **Senior Java Backend**, gồm Java core, Spring, cơ sở dữ liệu, microservices,
system design, AWS, AI/LLM, soft skills và **phỏng vấn tiếng Anh**.
Giao diện viết bằng tiếng Việt; thuật ngữ kỹ thuật giữ nguyên tiếng Anh.

Gồm 5 màn hình (route dạng hash):

| Route | View | Mô tả |
|---|---|---|
| `#/` | dashboard | Kế hoạch hôm nay (câu đến hạn ôn), tiến độ, streak, lịch sử |
| `#/roadmap` | roadmap | Lộ trình 26 tuần + nhật ký học hằng ngày |
| `#/bank[/topicId]` | bank | Danh sách câu hỏi kèm tìm kiếm, bộ lọc, đáp án mẫu, tự đánh giá |
| `#/flash[/topicId]` | flash | Flashcard: lật thẻ, chấm Đã thuộc / Cần ôn / Chưa biết |
| `#/quiz` | quiz | Trắc nghiệm 4 lựa chọn, có giải thích |
| `#/algo[/algoId]` | algo | Luyện thuật toán: đề, gợi ý từng bước, editor, timer, lời giải Java |
| `#/mock` | mock | Phỏng vấn thử: preset, bấm giờ, ghi chú, vòng coding, tự chấm 1–5, tổng kết |

Deploy: site tĩnh trên **Vercel** (import repo GitHub, không có build command, output là thư mục gốc).
Nhánh: mọi commit (autopilot, integrator) vào nhánh **`content`**, Vercel dựng Preview deploy cho nhánh này. Production là `main`, chỉ đổi khi người dùng merge PR `content → main` (tạo bằng `scripts/release.sh`, kèm `CHANGELOG.md`).

## 2. Luật bắt buộc

1. **Không framework, không build step, không npm dependency.** Chỉ dùng HTML, CSS và JS thuần (ES2020).
   Site phải chạy khi mở trực tiếp `index.html` qua `file://`.
2. **Chỉ dùng classic `<script>`**, không ES modules (`import`/`export`) và không `fetch()` file local, vì cả hai đều hỏng trên `file://`.
3. **Chỉ sửa những file mà task của bạn sở hữu** (xem mục 3). Cần đổi file khác (core, base.css, index.html…) thì
   **dừng lại** và ghi đề xuất vào phần `## Notes` của file task, đừng tự sửa.
4. **Không chạy `git commit` / `git push`** và không tạo branch. Người tích hợp sẽ review rồi commit.
5. Không xoá hoặc ghi đè nội dung của người khác. File dữ liệu chỉ được **thêm** câu hỏi.
6. Làm xong phải chạy `node scripts/validate.js` cho đến khi in ra `OK — không có lỗi.`
7. Cuối cùng, cập nhật trạng thái trong file task của bạn: `Status: DONE`, kèm ghi chú ngắn.
8. **TUYỆT ĐỐI KHÔNG kill tiến trình theo tên** (`taskkill /IM`, `Stop-Process -Name`, `Get-Process node | Stop-Process`, `pkill`, `killall`…).
   Máy này đang chạy nhiều agent và công cụ khác dùng `node`/`chrome`; kill theo tên sẽ tắt hết chúng và cả trình duyệt của người dùng.
   Chỉ được dừng tiến trình **do chính bạn khởi động**, theo PID cụ thể.
9. **Không mở trình duyệt / Chrome / CDP / headless browser để tự test.** Kiểm tra bằng `node --check <file>` và `node scripts/validate.js`;
   người tích hợp sẽ test UI bằng trình duyệt sau. Không khởi động server chạy nền.

## 3. Cấu trúc & quyền sở hữu file

```
index.html                 # khung trang, thứ tự script/css      (integrator)
css/base.css               # design tokens + component dùng chung (integrator)
css/views/<view>.css       # style riêng từng view                (task view tương ứng)
js/core/app.js             # App core: store, router, md, helpers (integrator)
js/core/data-manifest.js   # danh sách file js/data + group nạp lười theo route (integrator), xem docs/PERFORMANCE.md
js/data/topics.js          # danh sách chủ đề                    (integrator)
js/data/q-*.js             # câu hỏi tự luận, mỗi topic thuộc đúng 1 file (xem topics.js) (task nội dung)
js/data/quiz.js            # câu trắc nghiệm                       (T12)
js/data/algo.js            # bài thuật toán (window.ALGOS)         (T14)
js/data/roadmap.js         # lộ trình 26 tuần (window.ROADMAP)     (integrator)
js/views/<view>.js         # màn hình                              (task view)
scripts/validate.js        # kiểm tra schema dữ liệu               (integrator)
tasks/T*.md                # đặc tả từng task
docs/PLAN.md               # thiết kế + bảng phân công
```

## 4. Dữ liệu câu hỏi (`js/data/q-*.js`)

Mỗi file đẩy object vào `window.QUESTIONS`:

```js
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'core-001',            // <topicId>-NNN, 3 chữ số, duy nhất, tăng dần trong topic
  topic: 'core',             // id có trong js/data/topics.js và topic đó thuộc đúng file này
  level: 'senior',           // 'mid' | 'senior' | 'lead'
  q: 'Câu hỏi…',             // 1–2 câu, có thể dùng {{code}}
  a: `Đáp án mẫu…`,          // template literal, dùng Markup ở mục 5
  follow: ['Câu hỏi đào sâu 1', '…'],  // 2–3 câu interviewer hay hỏi tiếp (khuyến nghị)
  tags: ['HashMap', '…'],    // tuỳ chọn, phục vụ tìm kiếm
  lang: 'en'                 // CHỈ dùng cho câu hỏi tiếng Anh (topic english)
},
{ ... }
);
```

Không thêm field nào khác (validator sẽ báo lỗi).

### Bài thuật toán (`js/data/algo.js`) → `window.ALGOS`

```js
{
  id: 'algo-002',                 // algo-NNN
  title: 'Valid Parentheses',
  difficulty: 'easy',             // 'easy' | 'medium' | 'hard'
  pattern: 'Stack',               // tên pattern (dùng làm bộ lọc)
  tags: ['stack', 'string'],      // tuỳ chọn
  prompt: `markup: đề, ### Ví dụ (~~~text), ### Ràng buộc`,
  hints: ['gợi ý 1', 'gợi ý 2', 'gợi ý 3'],     // ≥ 2, tăng dần
  solution: `markup: ### Ý tưởng, ~~~java …~~~, ### Lưu ý khi phỏng vấn`,
  complexity: 'Time O(n), Space O(n)',
  follow: ['…']                   // tuỳ chọn
}
```

### Câu trắc nghiệm (`js/data/quiz.js`) → `window.QUIZ`

```js
{ id: 'qz-jvm-001', topic: 'jvm', q: '…', options: ['A', 'B', 'C', 'D'], answer: 2, explain: `…markup…` }
{ id: 'qz-jvm-002', topic: 'jvm', multi: true, q: '… (Chọn 2)', options: ['A', 'B', 'C', 'D', 'E'], answer: [0, 3], explain: `…markup…` }
```
Một đáp án: đúng 4 options không trùng, `answer` là số nguyên 0..3. nhiều đáp án: `multi: true`, 4–6 options không trùng, `answer` là mảng 2–3 index **khác nhau, tăng dần**, nằm trong phạm vi `options`; `q` phải ghi rõ "(Chọn N)" hoặc "(Choose N)" khớp `answer.length`. `multi` chỉ được là `true` hoặc không có; không thêm field nào khác. Đáp án đúng nên rải đều các vị trí. `scripts/validate.js` kiểm tra mọi điều trên (options trùng, answer ngoài range, answer không tăng dần, thiếu `(Chọn N)`, `multi` không phải `true`).

## 5. Markup trong `a`, `explain`, `q`, `follow`

Đây là một tập con nhỏ, do `App.md()` render. **Không dùng markdown đầy đủ và không dùng HTML.**

| Cú pháp | Kết quả |
|---|---|
| `**đậm**` | chữ đậm |
| `{{code}}` | inline code (**không** dùng backtick, vì đáp án nằm trong template literal) |
| `### Tiêu đề` | tiêu đề nhỏ |
| `- item` / `1. item` | danh sách; dòng tiếp theo thụt ≥2 space sẽ được nối vào item |
| `> ghi chú` | hộp tip / lưu ý |
| `\| a \| b \|` | bảng; dòng đầu là header, dòng `\|---\|` bị bỏ qua |
| `~~~java` … `~~~` | code block (`java`, `sql`, `yaml`, `json`, `bash`, `text`) |

Bẫy hay gặp:
- **Không** được có ký tự backtick `` ` `` bên trong đáp án, vì sẽ làm vỡ template literal.
- **Không** được viết `${` trong đáp án, vì template literal sẽ nội suy nó. Nếu bắt buộc phải có (ví dụ Spring placeholder) thì viết `\${`.
- Dấu `\` trong template literal cần escape thành `\\`.

## 6. Chuẩn chất lượng nội dung

Người đọc là dev Java 4–8 năm kinh nghiệm chuẩn bị phỏng vấn Senior, Lead hoặc Architect.

- **Giải thích chi tiết** là yêu cầu số 1 (người học tự ôn, không có ai giảng thêm):
  - Mở đầu bằng `**Tóm tắt:**`, gồm 1–2 câu đủ để trả lời miệng trong 30 giây.
  - Sau đó đi sâu bằng các mục `###`: **cơ chế bên trong hoạt động thế nào và VÌ SAO lại như vậy** (giải thích từng bước,
    như đang dạy một người chưa biết), ví dụ minh hoạ cụ thể (code, số liệu, sơ đồ ASCII), so sánh/bảng trade-off,
    khi nào dùng / không dùng, **pitfall thực tế trên production**.
  - Code ngắn (≤ 30 dòng), có comment giải thích những dòng quan trọng.
  - Độ dài khoảng **1500–4000 ký tự** (câu system design / tình huống có thể dài hơn).
- Câu trắc nghiệm: `explain` giải thích vì sao đáp án đúng **và vì sao từng phương án sai** là sai.
- Kết thúc bằng một `> Senior tip:` thể hiện góc nhìn kinh nghiệm thực tế: số liệu, tuning, case thật.
- Nội dung phải **đúng kỹ thuật** với Java 17/21, Spring Boot 3.x, Hibernate 6 và AWS hiện hành. Không bịa API.
  Gặp chỗ không chắc thì viết ít lại nhưng đúng.
- Câu hỏi phải theo phong cách phỏng vấn thật ("Bạn sẽ xử lý … thế nào?", "So sánh … khi nào chọn cái nào?"),
  không hỏi định nghĩa suông.
- Tỉ lệ level gợi ý: khoảng 25% mid, 55% senior, 20% lead.
- Không trùng nội dung với câu đã có (đọc file của bạn và các file khác trước khi viết).

## 7. Views (`js/views/*.js`)

Mỗi view là một IIFE tự đăng ký:

```js
(function () {
  'use strict';
  App.registerView('bank', {
    title: 'Ngân hàng câu hỏi',
    render(root, params) {          // root = <main>, params = phần sau route, ví dụ ['core']
      root.innerHTML = `...`;       // nhớ escape mọi dữ liệu bằng App.esc()
      // gắn event (ưu tiên delegation trên root)
      return () => { /* cleanup: clearInterval, gỡ key handler… */ };
    },
  });
})();
```

API dùng chung (`js/core/app.js`), **không sửa file này**:

| API | Mô tả |
|---|---|
| `App.questions()` / `App.quiz()` / `App.algos()` / `App.topics()` / `window.ROADMAP` | dữ liệu |
| `App.topic(id)` | `{id, name, icon, group}` |
| `App.filterQuestions({topic, level, status, q})` | `status`: `all\|due\|known\|review\|unknown\|unseen\|bookmarked` |
| `App.stats(topicId?)` | `{total, known, review, unknown, unseen}` |
| `App.store.getStatus(id)` / `setStatus(id, 'known'\|'review'\|'unknown')` | tiến độ từng câu/bài; `setStatus` **tự lên lịch ôn lặp lại (SRS)** và ghi nhật ký ngày |
| `App.store.isDue(id)` / `getDue(id)` / `App.dueItems()` | spaced repetition: câu/bài đến hạn ôn hôm nay (quá hạn lâu nhất xếp trước) |
| `App.store.log(kind, n?)` / `App.store.day(key?)` / `App.store.streak()` | nhật ký học: `kind` = `review\|known\|quiz\|mock\|algo\|minutes` (minutes tự đếm; quiz/mock tự log khi addQuizResult/addMockResult) |
| `App.dayKey(ts)` / `App.startOfDay(ts)` / `App.DAY` | tiện ích ngày (`'YYYY-MM-DD'`) |
| `App.store.data.roadmap` | `{ start, done: { '<weekId>-<i>': true } }`; sửa xong gọi `App.store.save()` |
| `App.store.isBookmarked(id)` / `toggleBookmark(id)` | đánh dấu |
| `App.store.addQuizResult(obj)` / `addMockResult(obj)` / `App.store.data` | lịch sử (`data.quizHistory`, `data.mockHistory`) |
| `App.md(text)` | render markup → HTML (đã escape an toàn) |
| `App.esc(str)` | escape HTML |
| `App.shuffle(arr)` | trả về mảng mới đã xáo trộn |
| `App.onKey(fn)` | phím tắt, tự bỏ qua khi đang gõ trong input; trả về hàm cleanup |
| `App.LEVELS`, `App.STATUS` | nhãn tiếng Việt cho level / trạng thái (`STATUS[s].cls` = `ok\|warn\|bad`) |
| `App.navigate('#/bank/core')`, `App.fmtDate(ts)` | điều hướng, định dạng ngày |

Quy ước UI:
- Dùng class có sẵn trong `css/base.css`: `.card .btn(.primary/.ok/.warn/.bad/.sm/.lg) .chip(.active) .chips .badge .dot .input .select .textarea .progress .stat .grid .row .page-head .empty .md kbd`.
- CSS riêng đặt trong `css/views/<view>.css` và **mọi selector phải bắt đầu bằng `.view-<view>`** (router gắn class này lên `<main>`).
- Chỉ dùng màu qua biến CSS (`var(--accent)`…) để dark mode tự hoạt động. Không hard-code màu.
- Responsive tới 360px. Nút bấm phải có text hoặc `aria-label`. Có phím tắt kèm gợi ý `<kbd>`.
- Câu hỏi có `lang: 'en'` thì gắn `lang="en"` lên phần tử chứa nó.

## 8. Definition of Done

- [ ] Chỉ những file được sở hữu bị thay đổi
- [ ] `node scripts/validate.js` → OK
- [ ] Mở `index.html` không có lỗi trong console; view chạy được ở cả light và dark mode, ở cả 360px và desktop
- [ ] File task đã ghi `Status: DONE` kèm ghi chú

## 9. AI, speech & code run (`js/core/ai.js`, `api/`)

Phần server gồm các Vercel function trong `api/` (integrator sở hữu). Trình duyệt gọi qua `App.ai`, có kèm mật mã truy cập.
**Không gọi `fetch('/api/...')` trực tiếp trong view**, chỉ dùng các API dưới đây:

| API | Mô tả |
|---|---|
| `await App.ai.grade({question, reference, answer, lang, topic, level, history?, speech?})` | AI chấm câu trả lời tự luận → `{score 1-5, verdict, strengths[], missing[], mistakes[], follow_up, improved_answer, language:{grammar[{wrong,right,note}], phrasing_tips[], fluency}}` |
| `await App.ai.review({title, prompt, reference, code, complexity, run?})` | AI review code → `{score, verdict, correct, bugs[], failing_cases[], complexity, style[], follow_up, improved_answer}` |
| `await App.ai.run(source)` | Chạy chương trình Java (có `public class Main`) → `{configured, status, stdout, stderr, compile_output, time, memory}`; nếu `configured === false` thì gợi ý dùng AI review |
| `App.ai.AiError` | Lỗi ném ra có thêm `.code` (`no_server`, `no_passcode`, `bad_passcode`, `not_configured`, …). Luôn bọc `try/catch` và hiển thị bằng `App.ui.error(e)` |
| `App.speech.supported` / `App.speech.start({lang:'vi'\|'en', onText(final, interim), onError(msg)})` | Đọc chính tả. Trả về handle; gọi `handle.stop()` để nhận `{text, seconds, words, wpm, fillers}` |
| `App.code.hasTests(algo)` / `App.code.assemble(userCode, algo.tests)` / `App.code.parse(stdout)` | Ghép code người dùng với test harness; `parse` trả về `{cases[{ok,name,detail}], passed, total, allPassed}` |
| `App.ui.feedback(result, lang)` / `App.ui.codeFeedback(r)` / `App.ui.runResult(run, parsed)` / `App.ui.speechStats(metrics)` / `App.ui.scoreBadge(n)` / `App.ui.error(e)` | HTML dựng sẵn, **dùng thống nhất ở mọi view** |
| `App.openSettings()` / phần tử có `data-open-settings` | Mở hộp cài đặt mật mã |

Quy ước UI:
- Nút micro dùng class `.btn.mic-btn`, khi đang ghi âm thêm class `.recording`.
- Khi đang chờ AI, hiển thị `<span class="ai-loading">AI đang chấm…</span>` và disable nút để tránh gửi hai lần.
- Ẩn nút micro khi `!App.speech.supported`.
- Mỗi lần gọi AI đều tốn tiền của người dùng: **không bao giờ gọi tự động**, chỉ gọi khi người dùng bấm nút.
- Để test logic trong Node mà không cần trình duyệt: `const App = require('./scripts/browser-shim.js')`.

### ALGOS: field mới
- `starter`: code khởi đầu hiển thị trong editor, gồm class và chữ ký method, ví dụ `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}`.
- `tests`: test harness Java, xem `tasks/T18-algo-tests.md`. Kiểm tra bằng `node scripts/test-algos.js`.

## 10. Tài khoản, đồng bộ & Debug lab

### `App.auth` / `App.sync` (`js/core/auth.js`, integrator sở hữu)
Hiện file này là **contract**: các hàm đã có đủ nhưng báo "chưa cấu hình". Integrator đang viết phần thật. View phải xử lý được cả 3 trạng thái: chưa cấu hình (`App.auth.enabled === false`), chưa đăng nhập, đã đăng nhập.

| API | Mô tả |
|---|---|
| `App.auth.enabled` / `App.auth.user` | `user = {id, email, name, avatar}` hoặc `null` |
| `App.auth.onChange(fn)` | đăng ký theo dõi đăng nhập/đăng xuất; trả về hàm huỷ (nhớ gọi trong cleanup) |
| `App.auth.signInWithGoogle()` / `signInWithEmail(email)` / `signOut()` | đăng nhập Google; email gửi magic link |
| `await App.auth.profile()` / `updateDisplayName(name)` | `{display_name, role, ai_daily_limit}` |
| `await App.auth.usageToday()` | `{used, limit, byKind}` |
| `await App.auth.exportData()` / `deleteAccount({clearLocal})` | xuất toàn bộ dữ liệu; xoá tài khoản (bắt buộc confirm 2 bước) |
| `App.sync.status` / `lastSyncAt` / `lastError` / `onStatus(fn)` / `now()` | `status`: `off \| idle \| syncing \| error` |

Mọi hàm async có thể ném lỗi, nên luôn bọc `try/catch` và hiển thị lỗi thân thiện.

### Debug lab: `window.LABS` (`js/data/labs-<category>.js`)
Mỗi bài cho người học dữ liệu thật (dump, log, plan…). Người học tìm nguyên nhân gốc và đề xuất cách sửa, AI chấm theo rubric.

```js
{
  id: 'lab-thread-001',              // lab-<category>-NNN
  category: 'thread',                // 'thread' | 'gc' | 'sql' | 'incident' (khớp với id và file)
  title: 'API treo sau giờ cao điểm',
  level: 'senior',                   // mid | senior | lead
  scenario: `markup: bối cảnh hệ thống, triệu chứng, số liệu (người học đọc trước)`,
  artifacts: [                       // giống THẬT: đúng định dạng jstack, GC log JDK 17+, EXPLAIN PostgreSQL…
    { name: 'jstack-1.txt', lang: 'text', content: `...` },   // content ≥ 200 ký tự, thường 30–150 dòng
  ],
  questions: ['Nguyên nhân gốc là gì? Dẫn chứng từ artifact.', 'Bạn sẽ sửa thế nào, ngắn hạn và dài hạn?'],
  hints: ['gợi ý 1', 'gợi ý 2'],     // ≥ 2, tăng dần
  answer: `markup: ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể trong artifact) / ### Cách sửa / ### Phòng ngừa`,
  rubric: ['ý bắt buộc 1', 'ý 2', 'ý 3'],   // ≥ 3 ý AI dùng để chấm
  tags: ['deadlock']
}
```
- Artifact phải **tự nhất quán**: tên thread, lock id (`<0x...>`), timestamp và số liệu phải khớp nhau và khớp với `answer`.
- Không dùng backtick và `${` trong template literal. Trong artifact được dùng `{` `}` thoải mái, vì artifact không phải markup.
- Khi chấm, view gọi `App.ai.grade({question: questions.join(' '), reference: answer + '\nRubric: ' + rubric.join('; '), answer, topic: 'lab-' + category, level})`.

## 11. Phỏng vấn AI bằng giọng nói (`#/interview`)

Claude đóng vai interviewer, hội thoại nhiều lượt. **Một phiên chỉ tốn 1 lượt hạn mức**: lượt đầu không có `session_token`, server trừ hạn mức rồi trả token; các lượt sau và phần tổng kết phải gửi lại token đó (hết hạn sau 90 phút, tối đa 24 câu trả lời).

| API | Mô tả |
|---|---|
| `await App.ai.interview.turn({session_token?, config, transcript, elapsed_seconds})` | → `{say, intent, topic, seed_index, last_answer:{score 0-5, note}, done, session_token}`. `say` là lời interviewer (đọc to bằng TTS); `intent` ∈ `question\|follow_up\|clarify\|hint\|wrap_up`; `last_answer.score = 0` ở lượt đầu |
| `await App.ai.interview.summary({session_token, config, transcript})` | → `{overall_score 1-5, hire_signal, verdict, by_question[{question, score, comment, better_answer}], strengths[], improvements[], study_next[], communication}`; `hire_signal` ∈ `strong_no\|no\|lean_no\|lean_yes\|yes\|strong_yes` |

- `config = {lang: 'vi'|'en', level: 'mid'|'senior'|'lead', minutes: 10-60, persona: 'friendly'|'strict', focus: 'mô tả ngắn trọng tâm', seeds: [{topic, q, ref}]}`. `seeds` là ≤ 12 câu lấy từ `App.questions()` theo chủ đề hoặc công ty đã chọn; `ref` là đoạn `**Tóm tắt:**` của đáp án (≤ 600 ký tự), **không gửi cả đáp án**.
- `transcript = [{role: 'interviewer'|'candidate', text}]` là toàn bộ hội thoại. Client giữ transcript và gửi lại mỗi lượt.
- Lỗi `code`: `bad_session` (hết hạn: mời bắt đầu phiên mới, vẫn cho xem tổng kết nếu có), `session_full`, `quota_exceeded`, `no_auth`.
- Giọng nói: STT dùng `App.speech.start({lang})`. TTS dùng `window.speechSynthesis` với `SpeechSynthesisUtterance`, `lang` là `'vi-VN'` hoặc `'en-US'` (chọn voice khớp nếu có). Khi `speechSynthesis` không có thì chỉ hiện chữ. Luôn có chế độ **gõ phím** thay cho mic.
- Không gọi `turn` tự động liên tục: mỗi lượt chỉ được gửi khi người dùng kết thúc câu trả lời (bấm "Trả lời xong", hoặc tự dừng sau khi im lặng ≥ 2.5 giây và đang bật chế độ rảnh tay).

## 12. Bài học + bài tập Java tự chấm: `window.LESSONS` (`js/data/lessons-<track>.js`)

Mỗi bài học dạy một khái niệm cho người hổng nền tảng: lý thuyết có ví dụ, rồi **bài tập Java chạy và tự chấm** bằng test harness (giống ALGOS), rồi 2–4 câu kiểm tra nhanh. **Bài mẫu: `lesson-collections-001` trong `js/data/lessons-collections.js`; đọc kỹ trước khi viết.**

```js
{
  id: 'lesson-collections-002',     // lesson-<track>-NNN; track = topic id trong topics.js; file lessons-<track>.js
  track: 'collections', order: 2,   // thứ tự trong track (1, 2, 3…)
  title: '…', level: 'mid',         // mid | senior | lead
  minutes: 25,                      // 5..90
  goals: ['…', '…'],                // 2–5 mục "sau bài này bạn làm được gì"
  body: `markup ≥ 2500 ký tự`,      // ### các phần, ~~~java ví dụ ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn"
  exercises: [{                     // 1–3 bài
    title, prompt: `markup`,
    starter: 'Java',                // PHẢI biên dịch được; phần chưa làm: throw new UnsupportedOperationException("TODO")
    tests: 'public class Main { … in "PASS name" / "FAIL name: chi tiết" … cuối cùng "RESULT passed/total" }',  // ≥ 3 case
    reference: 'Java',              // lời giải mẫu: phải pass 100% test
    hints: ['…'],                   // ≥ 1
    explain: `markup`               // giải thích lời giải + lỗi hay gặp
  }],
  check: [{ q, options: [4], answer: 0..3, explain }],   // 2–4 câu
  related: ['collections-001'],     // id câu hỏi có thật trong ngân hàng (tuỳ chọn)
  tags: ['…']                       // tuỳ chọn
}
```
- Code bài tập **chỉ dùng JDK chuẩn** (không Spring, không thư viện ngoài), **không class public** ngoài `Main` (code được ghép vào một file), import `java.util.*`, `java.util.function.*`, `java.util.stream.*`, `java.util.concurrent.*` (+ `.atomic`), `java.math.*` được tự thêm (xem `App.code.assemble`). Với chủ đề framework (Spring, JPA), bài tập **mô phỏng cơ chế bằng Java thuần** (ví dụ: tự viết một DI container nhỏ, một dynamic proxy bọc transaction, đếm số query để thấy N+1).
- Test phải **xác định (deterministic)**: không phụ thuộc thời gian thực hay thứ tự lập lịch thread; với concurrency hãy dùng `CountDownLatch`/`ExecutorService` + `join`/`awaitTermination` có timeout và lặp đủ nhiều lần để lỗi race lộ ra ổn định ở code sai.
- Bài tập phải biên dịch với **Java 17** (JDK trên máy và CI là 17; Judge0 còn cũ hơn): tính năng Java 21 (virtual threads, switch pattern) chỉ được dạy trong `body`/`explain`.
- Chạy `node scripts/test-lessons.js` (biên dịch thật bằng JDK 17): reference phải pass hết, starter phải biên dịch được và **không** pass hết. Và `node scripts/validate.js` → OK.

## 13. Nguồn học thêm: `refs` cho câu hỏi

Câu hỏi khó có thể có `refs` (≤ 5): app tự hiện mục "📚 Tìm hiểu sâu hơn" cuối đáp án.
```js
refs: [
  { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
  { type: 'video', title: 'Tên video đúng như trên YouTube', url: 'https://www.youtube.com/watch?v=…', note: 'phút 12–25 nói về pinning' },
]
```
- `type`: `doc | video | article | book | course`. `title` không chứa `[` `]`. `url` https.
- **Chỉ dùng link bạn chắc chắn tồn tại.** `node scripts/check-links.mjs <file>` gọi thật từng link (YouTube qua oEmbed, in ra tên video thật để đối chiếu); link 404/không tồn tại sẽ bị chặn, không được commit. Không chắc thì bỏ, đừng đoán ID video.
- Ưu tiên: tài liệu chính thức (docs.oracle.com, openjdk.org/jeps, docs.spring.io, docs.jboss.org/hibernate, postgresql.org/docs, kafka.apache.org, docs.aws.amazon.com, kubernetes.io, owasp.org), bài kinh điển (martinfowler.com, vladmihalcea.com, baeldung.com, highscalability), sách (link trang nhà xuất bản), video hội thảo chính thống (Devoxx, Spring I/O, JavaOne/Java YouTube channel, InfoQ, GOTO).

## 14. Phỏng vấn theo JD: `App.ai.jd(text)`

`await App.ai.jd(jdText)` (1 lượt hạn mức) → `{role, company, level: mid|senior|lead, domain, summary, must_have: [{skill, topic, weight 1-3}], nice_to_have: [...], likely_questions: [{q, topic, why}], prep_tips: [], questions_to_ask: []}`. `topic` là id trong `App.topics()` hoặc `""` (server đã lọc id lạ). JD < 200 ký tự bị từ chối (400). Lỗi hiển thị bằng `App.ui.error(e)`.

## 15. Sự nghiệp: STAR, CV và nhật ký phỏng vấn

- `await App.ai.coach.star({situation, theme?, lang?})` → `{title, themes[], situation, task, action, result, spoken, gaps[], follow_ups[]}` (ghi chú < 80 ký tự → 400).
- `await App.ai.coach.cv({cv, target?})` → `{score 1-5, verdict, strengths[], issues[{where, problem, fix}], missing_keywords[], likely_questions[]}` (CV < 300 ký tự → 400). Mỗi lần gọi = 1 lượt hạn mức.
- Dữ liệu người dùng lưu trong `App.store.data.stories` và `App.store.data.interviewLog`: **mảng object có `id` (chuỗi duy nhất) và `updatedAt` (ms)**; sửa xong gọi `App.store.save()`. Sync gộp theo id, bản `updatedAt` mới hơn thắng — luôn cập nhật `updatedAt` khi sửa, xoá thì đặt `deleted: true` (không xoá khỏi mảng, để thiết bị khác biết).
