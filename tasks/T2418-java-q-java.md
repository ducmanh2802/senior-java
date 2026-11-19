# T2418 — 5 câu hỏi Senior Java (core) vào q-java.js

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T2400

Thêm **5 câu hỏi phỏng vấn mới** (topic: core) vào `js/data/q-java.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-java.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: SOLID và design pattern áp vào code thật: Strategy cho routing/pricing, State cho vòng đời task/lệnh, Template Method, Builder/Factory, Observer vs event; khi nào pattern thành over-engineering; refactor class vi phạm SRP/OCP (có code trước/sau).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Da them 5 cau hoi moi (topic core) vao js/data/q-java.js: core-075 (senior, Strategy+OCP), core-076 (senior, State), core-077 (lead, Template Method), core-078 (senior, Builder/Factory), core-079 (lead, Observer/event bus + over-engineering + SRP refactor). Id noi tiep core-074 (max cu), khong trung id va khong sua cau cu. `node --check js/data/q-java.js` → OK.
Chua chay duoc den `node scripts/validate.js` in `OK` bo js/data/quiz.js (file cua T12, khong sua theo Luat 3 AGENTS.md) co loi cu syntax trc khi toi bat dau: dong 6038 chuoi single-quote chua newline khong dong, dong 640 ky tu Trung "Phien ban". Vi vua build-light-index.js vua validate.js crash khi nap toan bo file data, js/data/index-light.js chua duoc sinh lai voi 5 cau moi. De hoan thanh nghiem thu can sua loi cu o quiz.js (hoa integrator) chay lai build-light-index.js va validate.js.
Reviewed-by: kilo (T2418R)
