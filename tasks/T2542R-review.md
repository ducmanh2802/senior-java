# T2542R — Fact-check nội dung mới của T2542

Status: DONE
Agent: opencode
Owns: `js/data/lessons-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2542 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi kỹ thuật trong 2 bài học mới (lesson-ai-021: Streaming LLM qua SSE, lesson-ai-022: Đo TTFT và tổng thời gian).
- Validate: lessons-ai.js không báo lỗi (lỗi validate ở bugs.js là file khác, không thuộc task này).
- Test bài học: lesson-ai-021 pass 2/2 exercise (15 test case), lesson-ai-022 pass 1/1 exercise (12 test case).
- Kiểm tra kỹ thuật: định dạng SSE, buffer handling, tool-call assembly theo index, finish_reason/[DONE], Spring SseEmitter/WebFlux minh hoạ, ba chỉ số TTFT/Total/Throughput, công thức đo, tối ưu đúng chỗ, lỗi hay gặp — tất cả đều đúng theo chuẩn kỹ thuật hiện hành.
