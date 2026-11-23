# T2607 — System design: 2 đề mới vào sd-problems.js

Status: DONE
Agent: kilo
Owns: `js/data/sd-problems.js`
After: T2283

Thêm **2 đề system design mới** vào `js/data/sd-problems.js` (id `sd-NNN` nối tiếp đề cuối). **Đọc kỹ 2–3 đề có sẵn** và giữ đúng schema (id, title, kind, level, prompt, phases, rubric, reference, followups, related) cùng độ sâu: yêu cầu chức năng/phi chức năng, ước lượng tải có phép tính, API, data model, kiến trúc (~~~seq cho luồng chính), deep dive điểm khó, trade-off, sự cố hay gặp. Đọc danh sách tiêu đề đề cũ để **không trùng**.

Đề: (1) **Hệ thống trả góp / BNPL**: duyệt hạn mức trong 3 giây, lịch trả nợ, nhắc nợ, phạt trễ hạn, đối soát với đối tác bán hàng. (2) **Hệ thống eKYC mở tài khoản online**: chụp CCCD + selfie, đọc chip NFC, hàng đợi duyệt thủ công, lưu ảnh an toàn, 50.000 hồ sơ/ngày.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/sd-problems.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 2 đề vào `js/data/sd-problems.js` trước dòng `];` cuối cùng (không sửa đề cũ, không sửa file khác):
- `sd-043` "Hệ thống trả góp BNPL (mua ngay trả soum)" — kind: bank, level: senior.
- `sd-044` "Hệ thống eKYC mở tài khoản online (chụp CCCD + selfie + chip NFC)" — kind: bank, level: senior.

Mỗi đề có prompt, phases (yêu cầu, ước lượng, API/data model, kiến trúc, deep dive), rubric, reference (kèm ~~sql, ~~seq), followups, related. Validation đã chạy OK: `node --check`, `node scripts/build-light-index.js`, `node scripts/validate.js` → `OK — không có lỗi.` Không commit.
Reviewed-by: kilo (T2607R)
