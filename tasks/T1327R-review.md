# T1327R — Fact-check nội dung mới của T1327

Status: DONE
Agent: opencode
Owns: `js/data/q-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1327 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Reviewed new content of `security-040` (Java deserialization, diff-added): kỹ thuật chính xác (magic bytes AC ED 00 05, instanceof sau readObject quá muộn, ObjectInputFilter/JEP 290 allowlist, Jackson enableDefaultTyping/@JsonTypeInfo Id.CLASS nguy hiểm), markup hợp lệ (không backtick, không ${, {{…}} đúng quy ước), không lỗi ngôn ngữ.
- Chỉ sửa phần mới (diff), không đụng nội dung HEAD.
- Hoàn thiện định nghĩa thuật ngữ lần đầu xuất hiện cho người đọc chưa tiếp xúc K8s/observability: EDR (Endpoint Detection and Response), pod, heap dump, kết nối outbound, HMAC — trong `### Ví dụ đời thực` và `**Cách xử lý**`.
- `node --check js/data/q-security.js` OK; `node scripts/validate.js` → OK — không có lỗi (cảnh báo q-claude.js/path.js là của file khác, trước đây đã có).
