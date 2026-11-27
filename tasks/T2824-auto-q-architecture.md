# T2824 — 3 câu hỏi Senior Java (architecture) vào q-system-design.js

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T2769

Thêm **3 câu hỏi phỏng vấn mới** (topic: architecture) vào `js/data/q-system-design.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-system-design.js`); đọc danh sách để **không trùng ý**.

Chủ đề: chọn modular monolith vs microservices cho team 8 người, tách dần monolith bằng strangler fig có số liệu, ADR (Architecture Decision Record) — cách viết và ví dụ.

> Vòng 4 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment hoặc ~~~seq cho luồng nhiều bên → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/q-system-design.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 3 câu (id nối tiếp architecture-083 → 084, 085, 086), chọn góc CHƯA có ở các vòng trước (078–083 đã viết: service budget/Conway, strangler read path, ADR supersede, thu gom microservice, strangler write path, ADR build-vs-buy):
- **architecture-084** (senior): tách DỮ LIỆU khi tách microservice — database per service, bỏ FK liên service thay bằng reconciliation, shared database tạm thời trong strangler + cổng đo {{db.shared_table}} về 0. Góc mới: ranh giới dữ liệu (chưa có ở vòng trước).
- **architecture-085** (lead): biến review trigger của ADR thành **fitness function** chạy CI/SLO (ArchUnit, contract, alert), ADR mẫu + quy trình xử lý khi đỏ. Góc mới: cưỡng chế ADR bằng máy (080/083 chưa có).
- **architecture-086** (senior): chọn THỨ TỰ tách module bằng số liệu — churn (git log), coupling (ArchUnit/jdeps), blast radius, giá trị; công thức điểm ưu tiên. Góc mới: sequencing strangler (079/082 chưa có).

Kiểm tra: `node --check js/data/q-system-design.js` OK; qtool list xác nhận 084/085/086 (senior/lead/senior, follow=3); `node scripts/validate.js` KHÔNG báo lỗi nào cho q-system-design.js (đã grep xác nhận). Không backtick/`${` trong nội dung.

LƯU Ý (không thuộc file sở hữu, không tự sửa theo luật 3): `node scripts/build-light-index.js` và phần cuối `validate.js` đang bị chặn bởi file của task khác đang làm dở — `js/data/labs-gc.js` lỗi cú pháp (Unexpected identifier 'cảnh' dòng 7581, thuộc T2822), cùng các lỗi ở q-frontend.js / quiz-ops.js / lessons-modern.js / lessons-jpa.js / lessons-payments.js. Vì build-light-index nạp TẤT CẢ file data nên không sinh lại được index-light.js ⇒ validate báo index-light cũ. Khi các file kia được chủ sở hữu sửa xong, integrator chạy lại `node scripts/build-light-index.js` là index-light sẽ gồm 084–086. Không commit.
Reviewed-by: kilo (T2824R)
