# T296R — Fact-check nội dung mới của T296

Status: DONE
Agent: opencode
Owns: `js/data/lessons-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T296 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Chỉ review phần diff mới của T296 (2 khối `**Tóm tắt:**`, 1 dòng sửa "CSRF webpack", 2 `> Senior tip:`); nội dung ở HEAD giữ nguyên, không thêm/xoá mục.

Lỗi đã sửa theo id:

- `lesson-security-004`
  - Tóm tắt gộp sai cơ chế: viết như thể {{resolve}} làm cả "session fixation (rotate sid)" và "Tóm tắt" cho rằng mọi thao tác đều trả {{Optional<Session>}}. Đã tách đúng: {{resolve}} trả {{ResolveResult}} và chỉ lo tenant disabled (401), CSRF (403), {{NullSecurityContext}} ({{ANON}}), renew TTL; rotate sid nằm ở {{afterLogin}}; mọi thao tác nhận {{nowMs}} truyền vào (không đọc đồng hồ hệ thống).
  - Dòng sửa mới trích tên test không tồn tại (`"CSRF webpack"` → `"CSRF check"`): đổi sang đúng tên test thật trong harness là {{csrf mismatch rejects}}.
  - `> Senior tip:` mới có chữ lạ/ sai chính tả ("exception bong lên") và khẳng định "production đã từng bị…" không có căn cứ → viết lại: 401/403 thay vì để exception biến thành 500, đã có hệ thống bị enumerate tenant qua lỗi 500.
- `lesson-security-005`
  - `> Senior tip:` mới gộp lẫn 2 lỗi khác nhau: nói test bijection bắt được lỗi STEWARD tự cấp ADMIN, trong khi {{canGrant(role)}} không phụ thuộc domain nên bijection billing/vm vs project không thể phát hiện leo thang grant. Đã tách: trộn grant vào write → leo thang (không test bijection bắt được); copy-paste rule giữa domain → bắt bằng bijection.

Kiểm chứng: `node scripts/validate.js` → `OK — không có lỗi.`; `node scripts/test-lessons.js` → 91/91, chạy riêng `lesson-security-004` (RESULT 9/9) và `lesson-security-005` (RESULT 8/8) không dùng cache; `node --check js/data/lessons-security.js` OK; render thử `App.md()` 2 body không còn `{{`/backtick sót, body 4823 và 3266 ký tự (≥ 2500).
