# T2459 — 2 bài sửa bug production Java vào bugs.js

Status: DONE
Agent: kilo
Owns: `js/data/bugs.js`
After: T2446

Thêm **2 bài** (bug-NNN nối tiếp) theo AGENTS.md mục 17, **đọc kỹ bug-001** và danh sách bài có sẵn để không trùng: (1) **Cache trả dữ liệu cũ sau cập nhật**: update DB rồi xóa cache nhưng race với request đọc đặt lại giá trị cũ; fix bằng delete-after-commit + version/TTL ngắn hoặc double delete, test xác định bằng latch. (2) **Lease task không gia hạn**: worker xử lý lâu hơn lease, task bị worker khác nhận lại và xử lý 2 lần; fix bằng heartbeat gia hạn + fencing token, test dùng Clock giả.

Test phải **tái hiện bug một cách xác định** (latch/barrier, fake repository đếm query, Clock cố định…), reference pass 100% (≥ 3 test), starter biên dịch được và KHÔNG pass hết. Chỉ JDK chuẩn, không class public ngoài Main, Java 17.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/bugs.js`; `node scripts/build-light-index.js`; `node scripts/test-bugs.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm bug-043 (cache race: xóa cache race với đọc đang xử lý, fix bằng version check + TTL ngắn) và bug-044 (lease task không gia hạn, fix bằng heartbeat renew + fencing token) vào `js/data/bugs.js`.
- Cả 2 bài: reference pass 100% test, starter không pass hết (tái hiện bug xác định bằng latch / FakeClock).
- `node --check js/data/bugs.js` OK; `node scripts/test-bugs.js` OK cho cả 2 bài; `node scripts/validate.js` không còn lỗi bugs.js.
Reviewed-by: verify-only (code/UI task)
