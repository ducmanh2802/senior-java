# T1406R — Fact-check nội dung mới của T1406

Status: DONE
Agent: opencode
Owns: `js/data/lessons-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1406 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi kỹ thuật trong nội dung mới của T1406 trên js/data/lessons-design.js (lessons 001–002): cơ chế token bucket/sliding window log, LRU/LFU, câu hỏi trắc nghiệm và đáp án đã được fact-check theo Java 17/21, Kafka 3.x, Redis/Bucket4j; số liệu đã kiểm chứng (movedKeys 4→6 = 802/1200 = 66,8%, imbalance đều 0,013, hot tenant 124–126/8 shard). Các bài tập chạy pass: node scripts/test-lessons.js → 220/220. node scripts/validate.js → OK. Cảnh báo pre-existing không phải do file này: lesson-design-006/007 chưa có trong PATH (path.js do integrator sở hữu) và q-claude.js có thẻ HTML thô.
