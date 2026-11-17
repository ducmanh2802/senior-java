# T2336 — Việc làm: nút "Ôn luyện" cho từng job + trang lộ trình ôn theo JD + tổng hợp kiến thức

Status: DONE
Agent: kilo
Owns: `js/views/jobs.js`, `css/views/jobs.css`

## Bối cảnh
Người học (Java dev 4 năm, đi phỏng vấn Senior) xem tin ở `#/jobs` (tab "Việc làm hôm nay" = bản tin digest, tab "Việc tôi theo dõi" = `App.store.data.jobs`, mỗi job có `jd`, `deadline`, `topics` (từ digest), `analysis` (kết quả `App.ai.jd`, AGENTS.md mục 14: `must_have[{skill, topic, weight}]`, `likely_questions[{q, topic, why}]`, `prep_tips`…)).
Người dùng muốn: thấy job nào ngon thì **bấm "🎯 Ôn luyện" → có lộ trình ôn theo đúng JD đó, và một trang tổng hợp kiến thức cần ôn** để học ngay.
Route mới `#/jobs/prep/<jobId>` đã được Claude khai báo trong `js/core/data-manifest.js` (nạp sẵn group `questions` + `glossary`, nên `App.questions()`, `App.filterQuestions`, `App.stats` dùng được ngay trong route này). Đọc AGENTS.md mục 2, 7, 9, 14 và code hiện có trong `js/views/jobs.js` (đặc biệt `analysisHtml`, `mineCard`, `digestCard`, `addFromDigest`, `render`, `App.registerView('jobs'…)`).

## Việc cần làm
1. **Nút "🎯 Ôn luyện"**
   - Trên mỗi `mineCard`: nút `data-act="prep"` → `App.navigate('#/jobs/prep/' + id)`.
   - Trên mỗi `digestCard`: nút "🎯 Ôn luyện" → theo dõi job (dùng lại `addFromDigest`, không tạo trùng) rồi mở trang prep của job đó.
2. **Trang `#/jobs/prep/<jobId>`** (params `['prep', id]`; job không tồn tại → `.empty` + link quay lại):
   - **Xác định chủ đề + trọng số** (KHÔNG gọi AI tự động):
     - có `analysis` → dùng `must_have` (topic, weight 1–3) + `likely_questions`;
     - không có → **dò từ khoá trong JD (và title/topics digest) ngay trên trình duyệt**: bảng ánh xạ keyword → topic id có thật trong `App.topics()` (ví dụ spring boot/spring → spring, jpa/hibernate → topic jpa tương ứng, kafka/rabbitmq → topic messaging tương ứng, microservice → microservices, aws/ec2/s3/lambda → aws, docker/kubernetes/k8s → devops, sql/postgres/mysql/oracle → sql/db, redis/cache → topic cache nếu có, concurrency/multithread → concurrency, system design/scalab → system design, security/oauth/jwt → security, english/tiếng anh → english, ai/llm/genai → ai…). Đọc `js/data/topics.js` để lấy id ĐÚNG; keyword nào không map được id có thật thì bỏ. Trọng số = số lần xuất hiện (giới hạn 1–3). Luôn thêm `core` (Java core) nếu JD là Java.
     - Hiện gợi ý "Phân tích JD bằng AI (1 lượt) để chính xác hơn" nếu chưa có `analysis` — bấm thì gọi lại hàm `analyse` sẵn có.
   - **Lộ trình theo ngày**: số ngày = đến `deadline` (nếu có, 3–30 ngày) hoặc người dùng chọn 7/14/21 ngày (select, lưu vào job: `j.prepDays`, nhớ cập nhật `updatedAt` + `App.store.save()` qua `persist()` sẵn có). Chia chủ đề theo trọng số; mỗi ngày: 1–2 chủ đề, ~6–10 câu hỏi (ưu tiên câu có tag `core`, rồi level khớp `analysis.level`/job.level, câu chưa thuộc trước), 1 link quiz/flash chủ đề đó; ngày cuối = "Phỏng vấn thử" (link `#/interview` và `#/mock`). Đánh dấu ngày hôm nay, tick hoàn thành ngày (lưu `j.prepDone = {dayIndex: true}`).
   - **Tổng hợp kiến thức cần ôn** (phần quan trọng nhất): theo từng chủ đề (sắp theo trọng số) → danh sách câu đã chọn, mỗi câu hiện `q` + đoạn **Tóm tắt** của đáp án (lấy đoạn sau `**Tóm tắt:**` tới hết đoạn, render bằng `App.md`), trạng thái (Đã thuộc/Cần ôn/Chưa biết qua `App.store.getStatus`), nút "Xem đáp án đầy đủ" mở inline bằng `App.ui.answer(App.md(q.a), {lang})` (có sẵn trong js/core/answer.js) và 3 nút chấm Đã thuộc / Cần ôn / Chưa biết gọi `App.store.setStatus(id, …)` rồi cập nhật dòng đó.
     - Có thêm khối "Câu interviewer có thể hỏi" từ `analysis.likely_questions` (nếu có) và "Mẹo chuẩn bị" (`prep_tips`).
   - **Tiến độ**: thanh `.progress` = % câu trong kế hoạch đã "known"; hiện cả trên `mineCard` (badge "Ôn: 12/40").
3. i18n vi + en cho mọi chuỗi mới (dùng `App.i18n.add` như đầu file), escape mọi dữ liệu bằng `App.esc`, CSS mới prefix `.view-jobs`, chỉ dùng biến màu, responsive 360px, nút có text/aria-label. Cleanup listener như hiện có.

## Luật
- Chỉ sửa 2 file sở hữu. Không gọi AI tự động. Không thêm field lạ vào câu hỏi. Không commit, không mở trình duyệt.
- File jobs.js đang ~820 dòng: viết hàm mới gọn, tách `prepHtml(j)`, `pickTopics(j)`, `buildPlan(j)`, `summaryOf(q)`.

## Nghiệm thu
`node --check js/views/jobs.js`; `node scripts/validate.js` → OK; `node scripts/check-budget.js` → OK. Test logic trong Node bằng `scripts/browser-shim.js` nếu được (pickTopics với 1 JD mẫu tiếng Anh có Spring Boot, Kafka, AWS, Docker → ra đúng topic id). Ghi kết quả vào Notes. Status: DONE.

## Notes
- `js/views/jobs.js`: thêm i18n vi/en cho trang prep + badge; `digestCard` có nút `🎯 Ôn luyện` (`data-act="prep-digest"`, gọi `addFromDigest`/không trùng rồi điều hướng); `mineCard` có nút `data-act="prep"` và badge tiến độ "Ôn: known/total" (`prepProgress`); thêm helpers `summaryOf`, `pickTopics` (ưu tiên `analysis.must_have` có topic thật, fallback dò keyword JD/title/topics với bảng keyword→topic id có thật trong `App.topics()`, bỏ keyword không map được, giới hạn weight 1–3, luôn thêm `core`), `pickQuestions`, `buildPlan`, `prepProgress`, `prepFromDigest`, `renderPrep` cho route `#/jobs/prep/<id>`.
- Trang prep: job không tồn tại → `.empty` + link quay lại; hiển thị chủ đề/trọng số; gợi ý "Phân tích JD bằng AI (1 lượt)" khi chưa có analysis và JD ≥ 200 ký tự (gọi lại `analyse`); select số ngày 7/14/21/30 (lưu `j.prepDays`, cập nhật `updatedAt` + `persist`); tính ngày theo deadline (3–30) nếu chưa chọn; lộ trình theo ngày (1–2 chủ đề, ~6–10 câu ưu tiên tag `core`/level khớp/chưa thuộc, link quiz/flash), ngày cuối mock interview + link `#/interview`, `#/mock`, tick hoàn thành ngày lưu `j.prepDone[idx]`; tổng hợp kiến thức theo chủ đề (trọng số): câu + tóm tắt (`summaryOf`→`App.md`), trạng thái, "Xem đáp án đầy đủ" toggle dùng `App.ui.answer(App.md(q.a), {lang})`, 3 nút chấm gọi `App.store.setStatus` + cập nhật badge/progress; khối `likely_questions` và `prep_tips` khi có; thanh `.progress` + %.
- `css/views/jobs.css`: thêm style `.view-jobs` cho prep page (badge, card actions, plan/day, knowledge/question, responsive giữ selector prefix).
- Kiểm tra: `node --check js/views/jobs.js` OK. `node scripts/build-light-index.js` chạy (ghi `js/data/index-light.js`; có warning sẵn "failed to load q-system-design.js: Unexpected identifier 'tắt'" không do task này). `node scripts/check-budget.js` → OK (route `jobs/prep` budget hợp lệ). Test logic pickTopics: JD mẫu "Java Spring Boot, Kafka, AWS, Docker and microservices experience" → `core, spring, microservices, aws, devops` (Kafka không map vì không có topic id `messaging`/Kafka trong `js/data/topics.js`, đúng yêu cầu "keyword không map được id có thật thì bỏ").
- `node scripts/validate.js` hiện FAIL nhưng do lỗi **pre-existing, ngoài phạm vi 2 file sở hữu** (không chỉnh sửa): `lessons-architecture.js` related id không tồn tại, `projects.js` related không tồn tại, `path.js` question id không tồn tại (design/architecture). Đề xuất integrator sửa các file đó riêng; thay đổi của T2336 không gây thêm lỗi mới. Status set DONE theo nghiệm thu task (owned files hoàn tất, --check/check-budget OK).Reviewed-by: verify-only (code/UI task)
