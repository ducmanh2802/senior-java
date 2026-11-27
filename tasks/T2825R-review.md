# T2825R — Fact-check nội dung mới của T2825

Status: DONE
Agent: opencode
Owns: `js/data/lessons-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2825 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Reviewed nội dung mới của T2825 trong `js/data/lessons-design.js` (bài 017 Saga orchestrator, bài 018 Bulkhead, thêm vào cuối file, không sửa nội dung HEAD):
- Không tìm thấy lỗi kỹ thuật (Java 17-compatible, code/starter/tests/reference đúng, markup hợp lệ, không backtick/`${`/ký tự lạ, không thêm trường ngoài schema).
- `node scripts/test-lessons.js lesson-design-017`: 7/7 PASS (reference pass hết, starter không pass hết). `lesson-design-018`: 9/9 PASS.
- `node scripts/validate.js js/data/lessons-design.js`: không lỗi trong file sở hữu (lỗi duy nhất là index-light.js cũ do dữ liệu thay đổi).

Chặn ngưỡng full validate (không phải do T2825R, đã có trước, file không sở hữu -> không sửa theo quy tắc 3 AGENTS.md, cần integrator xử lý):
- `labs-gc.js`: lỗi cú pháp (template literal `answer` của lab-gc-039 chưa đóng, làm hỏng lab-gc-040) -> build-light-index.js và validate.js toàn bộ bị lỗi.
- `q-frontend.js`, `quiz-ops.js`, `lessons-modern.js`, `lessons-jpa.js`, `lessons-payments.js`: lỗi validate trước đó.
- `index-light.js`: cũ so với dữ liệu (cần chạy build-light-index sau khi labs-gc.js được sửa).

Không git commit / không nhánh mới (quy tắc 4).

Status: DONE
