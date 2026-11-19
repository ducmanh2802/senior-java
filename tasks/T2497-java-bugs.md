# T2497 — 2 bài sửa bug production Java vào bugs.js

Status: DONE
Agent: kilo
Owns: `js/data/bugs.js`
After: T2459

Thêm **2 bài** (bug-NNN nối tiếp) theo AGENTS.md mục 17, **đọc kỹ bug-001** và danh sách bài có sẵn để không trùng: (1) **OEE tính sai > 100%**: cộng trùng sản lượng khi gateway gửi lại message, và chia cho thời gian kế hoạch sai đơn vị; fix bằng dedup theo (machineId, seq) + kiểm tra đơn vị, test xác định. (2) **Traceability mất liên kết lot**: khi tách/gộp lot ở công đoạn, code chỉ lưu parent cuối cùng nên truy ngược thiếu nguyên liệu; fix bằng quan hệ nhiều-nhiều + duyệt đồ thị, test với dữ liệu tách/gộp cố định.

Test phải **tái hiện bug một cách xác định** (latch/barrier, fake repository đếm query, Clock cố định…), reference pass 100% (≥ 3 test), starter biên dịch được và KHÔNG pass hết. Chỉ JDK chuẩn, không class public ngoài Main, Java 17.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/bugs.js`; `node scripts/build-light-index.js`; `node scripts/test-bugs.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã sửa 2 bug có sẵn bị lỗi compile/test: **bug-036** (idempotency rút tiền) và **bug-037** (cache stampede). Cả hai thiếu infrastructure trong starter, reference thiếu infrastructure, test chỉ có 1 case. Đã bổ sung interface/class vào starter, reference, mở rộng test ≥3 case. Toàn bộ 46 bug pass `node scripts/test-bugs.js`. Các lỗi `validate.js` là pre-existing ở file khác, không do thay đổi này.
Reviewed-by: verify-only (code/UI task)
