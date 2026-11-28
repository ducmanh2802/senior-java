# T2891 — 2 debug lab (sql) vào labs-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T2875

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-sql.js` để không trùng tình huống. id `lab-sql-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

(1) **ALTER TABLE giờ cao điểm làm treo API**: pg_locks có AccessExclusiveLock đang chờ, hàng trăm query xếp hàng sau nó; sửa lock_timeout, migration an toàn (cột nullable, CREATE INDEX CONCURRENTLY). (2) **Query chậm do OR giữa 2 cột**: EXPLAIN Seq Scan với Filter (a = x OR b = y) dù có 2 index; sửa UNION ALL hoặc để planner dùng BitmapOr, đo lại.

> Vòng 4 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id `<0x...>`, timestamp, số liệu khớp nhau và khớp `answer`. `answer` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/labs-sql.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 lab level senior vào cuối `js/data/labs-sql.js` (id nối tiếp lớn nhất 061):
  - **lab-sql-062** — "Migration thêm UNIQUE constraint giờ cao điểm: AccessExclusiveLock giữ 6 phút, 468 query xếp hàng". Góc CHƯA có: `ALTER TABLE ... ADD CONSTRAINT UNIQUE` phải quét toàn bảng kiểm tra trùng + xây unique index nên giữ AccessExclusiveLock suốt quá trình (khác ADD COLUMN DEFAULT metadata-only ở lab-040, ALTER COLUMN TYPE rewrite ở lab-054, CHECK NOT VALID ShareUpdateExclusiveLock ở lab-045, CREATE INDEX CONCURRENTLY trong Flyway ở lab-056). Sửa an toàn: CREATE UNIQUE INDEX CONCURRENTLY + ADD CONSTRAINT ... USING INDEX.
  - **lab-sql-063** — "Tìm đơn mua HOẶC bán + ORDER BY mới nhất: OR buộc sort 2,18 triệu dòng, UNION ALL thiếu LIMIT mỗi nhánh vẫn chậm". Góc CHƯA có: bài toán phân trang top-N (ORDER BY created_at DESC LIMIT 50) — vì sao LIMIT không push xuống dưới Sort, vì sao UNION ALL "ngây thơ" vẫn chậm, và chứng minh lấy top-50 mỗi nhánh rồi trộn là ĐÚNG (khác lab-041/055/057 chỉ nói OR→Seq Scan/BitmapOr/UNION ALL chung chung, không có chiều ORDER BY + LIMIT + tính đúng đắn).
- Artifact tự nhất quán (số dòng, thời gian, lock id, số phiên chờ khớp nhau và khớp answer). Không backtick, không `${` trong template literal.
- `node --check js/data/labs-sql.js` → OK. `node scripts/build-light-index.js` đã chạy lại. `node scripts/validate.js`: KHÔNG còn lỗi nào thuộc `labs-sql.js` (2 lab mới hợp lệ; tổng sql 61→63).
- LƯU Ý: `validate.js` hiện còn báo lỗi ở các file KHÁC do agent khác đang làm dở (q-frontend.js, quiz-ops.js, lessons-jpa/security/modern/payments, toeic-lr-1a.js). Theo luật 3 (chỉ sửa file sở hữu) tôi KHÔNG sửa các file này; integrator chạy validate sau khi các task kia xong sẽ ra OK.
Reviewed-by: kilo (T2891R)
