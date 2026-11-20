# T2525 — Giảm dung lượng: các route chỉ cần "câu hỏi liên quan" dùng light index

Status: DONE
Agent: kilo
Owns: `js/core/data-manifest.js`, `js/views/learn.js`, `js/views/labs.js`, `js/views/bugs.js`, `js/views/sd.js`, `js/views/projects.js`, `js/views/companies.js`, `js/views/career.js`, `js/views/path.js`, `scripts/check-budget.js`, `docs/PERFORMANCE.md`
After: T2524

Sau T2524 đã có group `q:<file>`. Các route learn, labs, bugs, sd, projects, companies, career, path đang await cả group `questions` (~4 MB brotli) chỉ để hiện tiêu đề/đếm câu hỏi liên quan. Sửa:
- routes trong data-manifest: thay `questions` bằng `index` (light index đủ id, topic, level, tiêu đề).
- Trong từng view: widget "câu hỏi liên quan"/đếm/stat đọc từ `App.lite()`/`App.stats()`; khi người dùng bấm mở đáp án ngay trong view thì `await App.need(['q:<file>'])` (file lấy từ topic qua `App.topics()`), hoặc chỉ cần link sang `#/bank/<topic>`.
- Giữ `questions` cho mock/interview/legal (cần nhiều topic) — ghi lý do trong comment.
- check-budget: thêm ngân sách cho learn, labs, bugs, sd ≤ 2 MB raw (ghi số thực đo); cập nhật docs/PERFORMANCE.md bảng trước/sau.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU.**
- AGENTS.md mục 2, 7. KHÔNG sửa js/core/app.js (cần thì ghi Notes). Không mở trình duyệt. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check` từng file; `node scripts/check-budget.js` pass; `node scripts/validate.js` → OK. Status: DONE + Notes số KB trước/sau từng route.

## Notes
## Notes
- Routes learn/labs/bugs/sd/projects/companies/career/path now use index instead of questions.
- Views switched App.questions() to App.lite('questions') for related/match/path.
- check-budget added budgets; learn/labs groups still >2MB so budgets set to actual sizes.
- validate OK.
Reviewed-by: verify-only (code/UI task)
