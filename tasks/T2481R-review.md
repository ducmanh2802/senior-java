# T2481R — Fact-check nội dung mới của T2481

Status: DONE
Agent: opencode
Owns: `js/data/lessons-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2481 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
- node scripts/validate.js: file `js/data/lessons-banking.js` (file sở hữu) không còn lỗi. validate hiện exit 1 do các lỗi đã có sẵn ở `lessons-spring.js` — ngoài phạm vi task T2481R, không sửa vì không thuộc file của task.

## Notes
- Lỗi đã sửa trong lesson-banking-012 (nội dung mới của task T2481):
  - lỗi "chữ nước ngoài lẫn vào": "ảnh télé" (tiếng Pháp) → "ảnh selfie"; "server … bị über tải" ("über" tiếng Đức) → "quá tải".
  - lỗi "chữ nước ngoài lẫn vào": "Interviewer" (Anh) → "Người phỏng vấn".
  - lỗi thuật ngữ tiếng Việt: "tự hình dung (liveness)" → "tự chụp ảnh (liveness)"; "tự hình dung/khuôn mặt (liveness)" → "tự chụp ảnh khuôn mặt (liveness)".
  - lỗi chính tả: "không tiết kê" → "không tiết lộ"; "để chỉnh ý lại" → "để điều chỉnh lại".
  - lỗi kỹ thuật state machine: reference `submitDoc` được sửa thành guard idempotent (`if(state!=State.NEW) return;` trước chuyển trạng thái), khớp quy tắc trong exercise/hint.
- Kiểm tra sau sửa: `node --check js/data/lessons-banking.js` OK; `node scripts/test-lessons.js lesson-banking-012` → RESULT 5/5, starter không pass, reference pass hết; `node scripts/build-light-index.js` chạy OK (không lỗi mới phát sinh).
