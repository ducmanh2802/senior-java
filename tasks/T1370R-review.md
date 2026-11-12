# T1370R — Fact-check nội dung mới của T1370

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1370 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa (tất cả trong js/data/q-soft.js, nội dung T1370 thêm vào behavioral-034…040; không đụng nội dung đã có ở HEAD):
- behavioral-034: đoạn `### Ví dụ đời thực` bị thụt 2 Space → khối `~~~text` không hiển thị thành code; sửa lại cột 0.
- behavioral-035: T1370 đã xoá 4 hàng + dòng phân cách `|---|---|` của bảng ma trận ưu tiên → khôi phục lại; sửa items 4, 5 của danh sách 5 bước bị thụt (parser md() cột 0 không nhận list); xoá đoạn `### Ví dụ đời thực` trùng lặp sau `### Sai lầm hay gặp`.
- behavioral-036: mục `1./2./3./4.` của khung STAR bị thụt 2 Space → không render thành list; sửa về cột 0; xoá đoạn `### Ví dụ đời thực` trùng lặp.
- behavioral-037: cùng sửa thụt lề 6 bước (cột 0); xoá đoạn `### Ví dụ đời thực` trùng lặp.
- behavioral-038: cùng sửa thụt lề khung STAR (cột 0); xoá đoạn `### Ví dụ đời thực` trùng lặp.
- behavioral-040: sửa lỗi chính tả "bu lòng mock interview" → "buổi mock interview".
- Không có lỗi kiến thức (API/flag, số liệu, cơ chế) trong 6 đáp án; markup `{{…}}`, `~~~`, bảng, headings đã chạy qua validate.js.
- Chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo `path.js: lesson-design-007` không nằm trong PATH là cảnh báo cũ, không liên quan task này).
- File khác (companies.js, i18n, tasks…) không thuộc quyền sở hữu T1370R nên không sửa.
