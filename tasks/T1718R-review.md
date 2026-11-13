# T1718R — Fact-check nội dung mới của T1718

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1718 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Status: DONE

Fact-check 6 câu hỏi mới microservices-070 → microservices-075 (từ T1718, model free viết). Đã đọc kỹ AGENTS.md mục 4–6; nội dung đã có ở HEAD không bị thay đổi. Kết luận: **không có lỗi kiến thức/markup** — không cần sửa gì.

Đã kiểm tra:
- `node --check js/data/q-microservices.js` → PARSE OK (không backtick, không `${`, template literal đúng).
- `node scripts/validate.js` → không có dòng nào báo lỗi cho `q-microservices.js` / microservices-070..075 (tổng 75 câu, 20 trắc nghiệm).
- Tham chiếu trong câu hỏi đều tồn tại: microservices-071 trích "xem câu 026 và 058" → microservices-026, microservices-058 có thật; microservices-072 trích "xem câu 067" → microservices-067 có thật; microservices-075 trích "xem câu 067" → có thật.
- Tỉ lệ level: 070 senior, 071 senior, 072 lead, 073 senior, 074 senior, 075 lead — hợp lý.
- Markup hợp lệ: `###`, `-`, bảng `|`, `~~~java`/`~~~seq` (actors 2–6, text ≤60 ký tự), `> ghi chú`, `{{code}}`. Seq diagrams: "AI gateway dùng chung" (Order/Support/AI Gateway/LLM API/Redis), "Tóm tắt tài liệu qua queue" (Client/API/Kafka/Worker/LLM API/DB), "Quota hai pha" (Order/AI Gateway/Redis/LLM API), "Ba lớp kiểm thử service AI" (Caller/AI Service/Provider Mock/Eval Runner) — đúng cú pháp.
- `index-light.js` đã có sẵn 6 entry microservices-070..075 (do agent khác chạy build-light-index trước đó).

**Blocker không phải của mình:** `node scripts/build-light-index.js` và `node scripts/validate.js` (toàn bộ) đều fail với lỗi cú pháp ở `js/data/q-concurrency-jvm.js:9938` — dòng `**ArrayBlockingQueue**: Mảng \`Object[] items\` + ...` có backtick bên trong template literal, làm Node 24 báo `Unexpected identifier 'Object'`. Đây là file của task T1237/T1255/T1273/T1291/T1306/T1321/T1335/T1346/T1355/T1364/T1373/T1381/T1392 (không phải T1718R), theo luật 3 AGENTS.md mình không được tự sửa. Vì vậy `index-light.js` không thể sinh lại được và validate báo "index-light.js: đã cũ". Lỗi này cần integrator/T02-series agent sửa backtick ở q-concurrency-jvm.js:9938 (và các dòng 9940/9942/9944/9946 tương tự) rồi chạy `node scripts/build-light-index.js` để validate trở về OK.
