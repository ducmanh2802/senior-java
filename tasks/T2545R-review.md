# T2545R — Fact-check nội dung mới của T2545

Status: DONE
Agent: opencode
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2545 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Lỗi đã sửa (chỉ file js/data/q-ai.js, 4 câu mới ai-144..ai-147):
- ai-144 (senior): Sửa thứ tự gọi Spring AI ChatClient — phải là `.call().entity(MaintenanceOrder.class)`, không phải `.entity().call()`. Sửa sai kiến thức lớn: Spring AI KHÔNG tự áp Bean Validation (@NotNull/@NotBlank/…) khi deserialize entity và KHÔNG ném ConstraintViolationException; phải chạy jakarta.validation.Validator thủ công sau .entity() và ném InvalidMaintenanceRequestException riêng. Bỏ tên exception không chắc (MessageConversionException/OutputConversionException) → bat Exception chung. Cập nhật cả đoạn ví dụ và trả lời mẫu theo điều trên.
- ai-145 (senior): Sửa lỗi gõ "phiendoi thoai" → "phien thoai"; "chu so uu du lieu" → "chu so huu du lieu"; "dui agent bi prompt injection" → "khi agent bi prompt injection"; "bi injenction" → "bi prompt injection".
- ai-146 (lead): Sửa "giai explain" (lẫn tiếng Anh) → "giai thich"; hoàn thành câu còn thiếu về vector(1024); sửa gõ "h xem" → "hay xem", "lanc ca hai" → "lan ca hai".
- ai-147 (senior): Sửa lỗi biên dịch: `FakeChatModel implements ChatModel` với `call(String)` không khớp interface (ChatModel.call nhận `Prompt` trả `ChatResponse`) → đổi thành class fake đơn giản không implements, giữ ý nghĩa "giả lập model không gọi provider thật".
Không có lỗi kiến thức còn lại trong 4 câu này; không chỉnh văn phong, độ dài, bố cục; không thêm/xoá câu hỏi.
node scripts/build-light-index.js → OK; node scripts/validate.js → không lỗi nào thuộc q-ai.js (các Lỗi còn lại của validate ở bugs.js, lessons-api.js, q-concurrency-jvm.js… là file không do task này sở hữu, để nguyên).
