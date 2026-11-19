# T2491R — Fact-check nội dung mới của T2491

Status: DONE
Agent: opencode
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2491 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- ai-141: `private final Queue<InspectionRequest> queue;` → `BlockingQueue<...>` — `Queue.poll()` không có tham số, gọi `poll(100, TimeUnit.MILLISECONDS)` sẽ không biên dịch (lỗi kỹ thuật trong code minh họa).
- ai-142: bỏ từ hỏng "ngallet" trong câu hỏi → "không gây quá tải do báo động sai".
- ai-143: bỏ từ tiếng Anh "contested" trong tóm tắt → "bị tranh cãi".
- validate.js: q-ai.js không lỗi (0 lỗi tham chiếu q-ai). Còn lại lỗi ở lessons-spring.js (đã sửa sẵn trong working tree trước khi bắt đầu, không thuộc nhiệm vụ T2491R, quy tắc 3 AGENTS.md cấm sửa file của người khác) nên validate.js không in OK — không liên quan đến thay đổi của task này.
- Đã chạy node scripts/build-light-index.js (quy tắc 6 AGENTS.md) rồi node scripts/validate.js.
