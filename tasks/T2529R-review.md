# T2529R — Fact-check nội dung mới của T2529

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2529 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 4 câu mới của T2529 (scenario-175..178). Sửa các lỗi sau:

- **scenario-175 (barcode offline sync):** cơ chế idempotency nói ngược — bản gốc vừa nói "server trả kết quả cũ nếu mã đã xử lý" (idempotent = 200) vừa coi 409 là "phản hồi trùng" rồi tự xóa bản ghi local. 409 là xung đột thật (trùng khóa nhưng khác nội dung), KHÔNG được auto-ack. Sửa lại: 200 = đã xử lý (mới hoặc idempotent) → xóa local; 409 = xung đột thật → giữ lại, báo điều tra, không xóa; cập nhật text, code, và phần Pitfall cho nhất quán.
- **scenario-175..177:** sửa lỗi chính tả "xường" → "yếu"/"xưởng" (4 chỗ, "wifi xường yếu" → "wifi yếu").
- **scenario-177 (MES-ERP):** bỏ từ tiếng Anh lẫn "counted" (2 chỗ) → "được tính".

Không sửa nội dung đã có ở HEAD; không thêm/xoá mục; không đổi văn phong/bố cục. `node --check js/data/q-scenario.js` OK; validate không báo lỗi nào cho q-scenario.js (178 câu). Các lỗi validate còn lại đều thuộc file KHÔNG sở hữu (bugs.js, path.js, q-concurrency-jvm.js, q-spring-data.js) — tồn tại từ trước, ngoài phạm vi task này.

Ghi chú kỹ thuật đã kiểm và ĐÚNG, giữ nguyên: scenario-176 `SELECT ... FOR UPDATE` + unique constraint + trạng thái RESERVED→PRINTED; scenario-177 `@Scheduled(cron="0 30 15 * * *")` đúng 6 field Spring (15:30:00 hằng ngày); scenario-178 expand/contract migration + blue-green + cutover qua load balancer.
