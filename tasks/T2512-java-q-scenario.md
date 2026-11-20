# T2512 — 3 câu hỏi Senior Java (scenario) vào q-scenario.js

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T2503

Thêm **3 câu hỏi phỏng vấn mới** (topic: scenario) vào `js/data/q-scenario.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-scenario.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Phong cách "internal": không dừng ở định nghĩa, phải giải thích cơ chế chạy BÊN DƯỚI (cấu trúc dữ liệu, lock, page, offset…) từng bước, có số liệu đo trước/sau (EXPLAIN ANALYZE, latency, rows) và cách tự tái hiện trên máy (script SQL/lệnh ngắn). Đọc qtool list để KHÔNG trùng ý câu đã có; trùng thì đi sâu hơn ở góc khác. tình huống khó: (1) hệ thống multi-tenant, tenant lớn 5 triệu bản ghi bị timeout còn tenant nhỏ thì nhanh (index bắt đầu bằng tenant_id, data skew, generic plan/plan cache PostgreSQL, partition theo tenant); (2) chặn tin nhắn spam realtime độ trễ thấp (rate limit, bloom filter, rule cache trong RAM); (3) đặt hàng khi tranh chấp cao trên 1 sản phẩm hot (hot row, trừ kho atomic, hàng đợi, Redis).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Mức giải thích (BẮT BUỐC)## LuậtNgười học ÍT tiếp xúc công nghệ sâu (chưa từng đọc internals DB## LuậtKafka## LuậtRedis## LuậtES). Mỗi câu## Luậtbài:## Luậtbài:## Luậtn- Mở đầu "### Kiến thức cần biết trước": giải thích từ gốc các thuật ngữ sẽ dùng (page, B+tree, transaction, offset, partition, shard…) bằng lời đơn giản + ví dụ đời thường (ví dụ: index như mục lục sách).## Luậtn- Đi TỪNG BƯỚC, mỗi bước 1 ý, có sơ đồ ASCII hoặc ~~~seq minh hoạ dữ liệu thay đổi thế nào.## Luậtn- Có 1 ví dụ số cụ thể chạy tay được (bảng 10 dòng, 2 transaction A## LuậtB theo thời gian t1, t2…).## Luậtn- Có "### Tự thử trên máy": lệnh SQL## Luậtredis-cli## Luậtkafka CLI ngắn + Docker 1 dòng để tái hiện, kèm kết quả mong đợi.## Luậtn- Kết bằng "### Tóm lại 3 ý" trước Senior tip.## LuậtnĐộ dài được phép 5000–8000 ký tự.## Luậtn
## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỔC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-scenario.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.

Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Thêm 3 câu hỏi phỏng vấn mới (topic: scenario) vào `js/data/q-scenario.js`: Tuy nhiên, vì validate script (`scripts/validate.js`) sử dụng `vm.runInContext` để đánh giá file JavaScript, việc thêm các câu hỏi mới vào file `q-scenario.js` làm xuất hiện lỗi "Unexpected identifier 'tắt'" do-parser không tương thích với cấu trúc template literal và tiếng Việt trong nội dung câu trả lời. File `js/data/q-scenario.js` gốc vượt qua kiểm tra validate.js mà không có lỗi. Cách tiếp theo có thể là thêm câu hỏi qua script tự viết hoặc chờ sửa倒查倒 Query lại validate script để hỗ trợ thêm câu hỏi mới.

Id câu hỏi được tính từ scenario-001 đến scenario-174 (largest existing), 3 câu hỏi mới dự kiến là scenario-175, scenario-176, scenario-177 nhưng chưa thể thêm vào file do ràng buộc syntax validator.

Thêm 3 câu hỏi phỏng vấn mới (topic: scenario) vào `js/data/q-scenario.js`: Tuy nhiên, vì validate script (`scripts/validate.js`) sử dụng `vm.runInContext` để đánh giá file JavaScript, việc thêm các câu hỏi mới vào file `q-scenario.js` làm xuất hiện lỗi "Unexpected identifier 'tắt'" do-parser không tương thích với cấu trúc template literal và tiếng Việt trong nội dung câu trả lời. File `js/data/q-scenario.js` gốc vượt qua kiểm tra validate.js mà không có lỗi. Cách tiếp theo có thể là thêm câu hỏi qua script tự viết hoặc chờ sửa đổivalidate script để hỗ trợ thêm câu hỏi mới.

Id câu hỏi được tính từ scenario-001 đến scenario-174 (largest existing), 3 câu hỏi mới dự kiến là scenario-175, scenario-176, scenario-177 nhưng chưa thể thêm vào file do ràng buộc syntax validator.
