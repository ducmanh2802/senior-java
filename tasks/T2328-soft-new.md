# T2328 — 5 câu behavioral mới cho Senior/Lead

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`
After: T2246

Thêm 5 câu: kể lần bạn xử lý sự cố production lớn (vai trò, giao tiếp, postmortem), mentoring junior dùng AI coding tool sai cách, bất đồng kỹ thuật với lead/architect, ước lượng sai và trễ deadline, đưa một thay đổi lớn (migrate Java 21/Spring Boot 3) qua nhiều team. Khung STAR có số liệu, ### Trả lời mẫu khi phỏng vấn 150–220 từ (có bản tiếng Anh ngắn ở cuối). Đúng chuẩn AGENTS.md mục 6 (Tóm tắt, ### cơ chế, code ≤30 dòng, ### Ví dụ đời thực có số liệu, ### Trả lời mẫu khi phỏng vấn, > Senior tip:, 3000–5000 ký tự). Dùng qtool.js list để không trùng ý.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT (không dùng lại số cũ), không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/q-soft.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

- Before: largest behavioral id was behavioral-054 (testing-061 was largest in file but different topic).
- Added 5 behavioral questions in js/data/q-soft.js, appended before final `);`: behavioral-055 (lead: sự cố production/postmortem), behavioral-056 (senior: mentoring junior lạm dụng AI coding tool), behavioral-057 (senior: bất đồng với lead/architect), behavioral-058 (senior: ước lượng sai/trễ deadline), behavioral-059 (lead: migration Java 21/Spring Boot 3 qua nhiều team).
- Ids increase within topic (behavioral-055 → behavioral-059), no reused ids, topic=behavioral (owned by q-soft.js per topics.js), levels 2 lead + 3 senior.
- Each answer: Tóm tắt, ### cơ chế từng bước (cái gì → tại sao cần → hoạt động thế nào → ví dụ số liệu/code ≤30 dòng → lỗi hay gặp), ### Ví dụ đời thực có số liệu, ### Trả lời mẫu khi phỏng vấn 167–187 từ, bản tiếng Anh ngắn ở cuối, > Senior tip:, 3 follow-up câu, tags.
- node --check js/data/q-soft.js → SYNTAX_OK.
- node scripts/qtool.js check js/data/q-soft.js → OK for q-soft.js (6 errors in OTHER files are pre-existing breakage in q-system-design.js, sdlc.js, quiz-design.js, lessons-architecture.js, projects.js, path.js — untouched by this task).
- node scripts/build-light-index.js → index-light.js regenerated.
- Full node scripts/validate.js cannot reach OK due to pre-existing errors in other files (not caused by this task); q-soft.js contributes zero errors.
- Did not commit (integration handled separately).
