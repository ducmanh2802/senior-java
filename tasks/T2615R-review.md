# T2615R — Fact-check nội dung mới của T2615

Status: DONE
Agent: opencode
Owns: `js/data/lessons-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2615 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review 2 bài học mới của T2615 (lesson-microservices-025, lesson-microservices-026).

**Lỗi kỹ thuật đã sửa:**
- lesson-microservices-025: phần "Sliding window đếm lỗi" ghi SAI "Bài tập dưới đây dùng sliding window theo thời gian với danh sách timestamp". Thực tế reference chỉ đếm **số lỗi liên tiếp** (consecutiveFailures, reset về 0 khi thành công), KHÔNG có ring buffer/mảng timestamp. Đã sửa lại mô tả đúng cơ chế của bài tập và ghi rõ production (Resilience4j) mới dùng sliding window thật.

**Đã kiểm nhưng KHÔNG có lỗi:**
- Code 025 (starter/reference/tests) biên dịch Java 17 OK, test 6/6 pass; 026 test 4/4 pass (node scripts/test-lessons.js).
- 026 idempotency: UUID v4, in-flight → 409/202, payload khác → 422, TTL 24h–7 ngày, putIfAbsent dedup — đều đúng.
- Memory model 026: `done` là volatile ghi sau cùng; thread đọc thấy done==true sẽ thấy result/payloadHash (happens-before qua volatile) — đúng, không có lỗi đồng thời.
- Related IDs (microservices-001/006/011/015/016/017) đều tồn tại.
- Markup, độ dài, không có backtick/`${` lẫn, không có chữ nước ngoài lạ.

**không chỉnh:** snippet minh hoạ "Mô phỏng đơn giản" ở body 025 dùng API `call(...)`/`CircuitOpenException` (phong cách Resilience4j) khác với bài tập `tryCall(...)` trả boolean — đây là 2 phong cách API đều hợp lệ, snippet ghi rõ là mô phỏng nên giữ nguyên (tránh sửa theo văn phong).

**Nghiệm thu:** `node scripts/validate.js` → OK; `node scripts/test-lessons.js lesson-microservices-025/026` → pass.
