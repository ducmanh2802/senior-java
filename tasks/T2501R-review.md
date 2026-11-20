# T2501R — Fact-check nội dung mới của T2501

Status: DONE
Agent: opencode
Owns: `js/data/q-frontend.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2501 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review toàn bộ nội dung mới của T2501 (frontend-016 → frontend-020 trong `js/data/q-frontend.js`) và sửa các lỗi kỹ thuật.

Các lỗi đã sửa theo từng id:
- frontend-016: ví dụ interceptor refresh token dùng biến `refreshToken` chưa được khai báo (`var refreshToken = null;` bị thiếu) → thêm khai báo để ví dụ khởi chạy được. (Không dùng: khử lỗi tham chiếu undefined trong code mẫu.)
- frontend-019: client gửi params `{ trang: trang, kíchThước: 20 }` nhưng server đọc `@RequestParam(defaultValue = "0") int page` / `@RequestParam(defaultValue = "20") int size` → trùng tên tham số, phải nhất quán. Đã đổi client thành `params: { page: trang, size: 20 }`.

Nghiệm thu:
- node --check js/data/q-frontend.js → OK.
- node scripts/build-light-index.js → đã chạy (index-light.js cũ → đã sinh lại, validate không còn báo lỗi index-light).
- node scripts/validate.js → không còn lỗi cho q-frontend.js (frontend: 20 câu hỏi, 10 quiz). LỖI còn lại chỉ thuộc về `js/data/bugs.js` (bug-047, bug-048) của task sở hữu khác (T2532), ngoài phạm vi T2501R, không sửa.

Không có lỗi: markup (~~~text, bảng, heading, `>` tip) của các câu mới đúng chuẩn `App.md`; không dùng backtick/`${` trong template literal; không chữ nước ngoài lẫn.
