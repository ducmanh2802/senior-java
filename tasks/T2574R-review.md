# T2574R — Fact-check nội dung mới của T2574

Status: DONE
Agent: opencode
Owns: `js/data/quiz.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2574 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Reviewed nội dung mới của T2574 trong `js/data/quiz.js`: 10 câu trắc nghiệm `qz-scenario-021` → `qz-scenario-030` (topic scenario).
- Không có lỗi kiến thức: các đáp án và giải thích đúng chuẩn Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x (Hikari pool, jstack/pg_locks, jmap/dominator tree, PER/stale-while-revalidate, backoff+jitter+circuit breaker, off-heap vs container limit, batch chunk+idempotent+checkpoint...).
- Không có lỗi markup: không backtick, không `${`, fence ~~~ cân bằng, `{{`/`}}` cân bằng, không thẻ HTML thô, không ký tự lạ.
- ID hợp lệ `qz-scenario-NNN`; multi-select (022, 025) answer mảng tăng dần, khác nhau, trong range, q ghi "(Chọn 2)" khớp answer.length; single-select 4 options, answer 0..3.
- Không sửa nội dung đã ở HEAD, không thêm/xoá mục.
- `node scripts/validate.js` → `OK — không có lỗi.` (exit 0). Không lỗi nào liên quan đến quiz.js.
