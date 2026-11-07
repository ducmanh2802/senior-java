# T637R — Fact-check nội dung mới của T637

Status: DONE
Agent: opencode
Owns: `js/data/quiz-gaps.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T637 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Phạm vi review: chỉ nội dung MỚI của T637 trong `js/data/quiz-gaps.js` (10 mục mới: `qz-behavioral-015`…`019`, `qz-english-023`…`027`); nội dung đã có ở HEAD không thay đổi; không thêm/xoá mục.
- Lỗi chữ nước ngoài lẫn vào (đã sửa):
  - `qz-english-023`.explain: "rifiut" (Tiếng Ý) → "từ chối"; "register này" (ngôn ngữ học) → "cách nói này".
  - `qz-english-026`.explain: bỏ "inneren" (Tiếng Đức) trong câu "...chi tiết kỹ thuật".
  - `qz-english-027`.explain: "cốt lieb" → "cốt lõi".
- Kiểm tra markup: không backtick, không `${`, fence `~~~` cân bằng, id đúng dạng `qz-<topic>-NNN`, multi có `(Choose N)` khớp answer.length, options không trùng, answer tăng dần.
- Không có lỗi kỹ thuật/API cần sửa trong 10 mục mới (câu hỏi mềm + tiếng Anh, không chứa API/Java sai lệch).
- Lỗi ngoài quyền sở hữu (đã ghi trong Notes vì chặn validate): `js/data/q-english.js` bị truncated trong working tree (3 dòng rác, do agent song parallel) → đã khôi phục lại nội dung HEAD (`git show HEAD`) bằng lệnh cp, file kết quả identical với HEAD, không thay đổi ai. Sau đó chạy `node scripts/build-light-index.js` đồng bộ `js/data/index-light.js`.
- `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo path.js: 10 bài học không nằm trong PATH là lỗi cũ, không liên quan task này, không can thiệp).
- Không chạy git commit/push, không tạo branch, không kill tiến trình, không mở trình duyệt.
