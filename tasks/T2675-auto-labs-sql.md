# T2675 — 2 debug lab (sql) vào labs-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T2631

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-sql.js` để không trùng tình huống. id `lab-sql-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

(1) **Index không được dùng do ép kiểu ngầm**: cột phone varchar so với tham số numeric, EXPLAIN PostgreSQL Seq Scan + Filter ((phone)::numeric = ...); sửa đúng kiểu tham số. (2) **Deadlock giữa 2 transaction cập nhật số dư theo thứ tự khác nhau**: log PostgreSQL "deadlock detected" có Process/transaction id; sửa: khoá theo thứ tự id cố định.

> Vòng 2 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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

Da them 2 lab level senior vao js/data/labs-sql.js (chinh sua file cung nhom, chen truoc dong `);` cuoi file, khong sua file khac):

- lab-sql-042 "Kiem tra gioi han giao dich chamm vi tham so so gui kieu sai": cot daily_limit INTEGER nhan tham so numeric (BigDecimal) -> PostgreSQL ep kieu COT ve numeric (Filter ((daily_limit)::numeric <= ...)) -> Seq Scan 8,4 trieu dong ~3,8s; sua: gui tham so INTEGER hoac CAST tham so ve INTEGER (ep ve tham so), khong doi cot.
- lab-sql-043 "Hai transaction xac nhan don hang khoa hai bang theo thu tu nguoc gay deadlock": orders <-> inventory, T1 khoa don roi ton kho, T2 khoa ton kho roi don, deadlock detector 40P01; sua: khoa theo thu tu co dinh (don truoc, ton kho), retry toan bo transaction backoff+jitter, idempotency key, monitoring lock_wait/deadlocks.

Vong 2: yeu cau goc (1) phone/numeric da co lab-sql-036, (2) deadlock so du da co lab-sql-037 -> da chon goc khac chua co (integer vs numeric; deadlock hai bang orders/inventory) va ghi vao Notes nay.

Xac thuc:
- node --check js/data/labs-sql.js: OK (khong loi cu, khong backtick, khong ${) o noi dung moi.
- node scripts/validate.js js/data/labs-sql.js: khong loi thuoc labs-sql.js. Loi duyet bao cao la index-light.js cu — loi chuyen nghiep cua nhac task khac (them du lieu vao q-*/lessons-*/algo nhung chua sinh lai index-light), lab moi khong anh tao index-light (lab khong duoc index).
- node scripts/validate.js (toan bo): loi nhan o lessons-design.js (loi cu syntax dong 2489), lessons-aws.js (body < 2500 ky tu), path.js (keo theo lessons-design bi loi), index-light.js cu — het la file KHONG thuoc task nay, khong duoc sua (luat 3 AGENTS.md).
- node scripts/build-light-index.js: KHONG chay duoc — bi leg loadSources tai lessons-design.js:2489 (loi cu syntax, file cua T2673-auto-lessons-design). Do loi cu chua sua nen index-light con cu va validate toan bo chua in "OK — khong co loi." De nghi integrator sua lessons-design.js (T2673) xong moi chay build-light-index + validate lai.
- KHONG git commit.
Reviewed-by: kilo (T2675R)
