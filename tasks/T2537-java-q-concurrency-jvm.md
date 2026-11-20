# T2537 — 3 câu hỏi Senior Java (concurrency) vào q-concurrency-jvm.js

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T2513

Thêm **3 câu hỏi phỏng vấn mới** (topic: concurrency) vào `js/data/q-concurrency-jvm.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-concurrency-jvm.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Concurrency qua sự cố thật: (1) ReentrantReadWriteLock: một thao tác IO chậm (ghi socket 20 giây) bên trong read lock làm cả service đứng — writer chờ, rồi reader mới cũng xếp hàng sau writer (fair/non-fair, writer starvation), cách sửa: không IO trong lock, StampedLock/copy-on-write; (2) Tăng thread pool 50 → 500 mà API vẫn chậm, parallelStream chậm hơn trên container 2 CPU: CPU-bound vs IO-bound, công thức kích thước pool, availableProcessors trong container, khi nào virtual thread giúp; (3) OOM từ dòng code vô hại: regex che token trong log trên chuỗi lớn / catastrophic backtracking, StringBuilder log khổng lồ, cache không giới hạn, ThreadLocal rò rỉ — bộ giác quan cần bật sẵn (heap dump on OOM, JFR, NMT) và playbook cấp cứu. Mỗi câu có số đo cụ thể (ms, TPS, MB) tự nhất quán và mục ### Checklist cuối (5–7 việc làm được ngay), trước > Senior tip..

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-concurrency-jvm.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 3 câu hỏi mới vào `js/data/q-concurrency-jvm.js` (chỉ THÊM, không sửa mục cũ):
- `concurrency-090` (senior, ~6.5k): ReentrantReadWriteLock — I/O 20s trong read lock làm cả service đứng; non-fair writer/reader xếp hàng, StampedLock optimistic read, CopyOnWriteArrayList; code đúng/sai; bảng trade-off; ví dụ số liệu; checklist; Senior tip.
- `concurrency-091` (lead, ~6.2k): pool 50→500 vẫn chậm + parallelStream chậm trên 2 CPU; CPU-bound vs IO-bound, công thức pool (core+1 / core×(1+wait÷compute)), Little's law, availableProcessors & cgroup, virtual thread; code đo seq vs parallel; ví dụ số liệu; checklist; Senior tip.
- `concurrency-092` (senior, ~5.5k): OOM từ code vô hại — regex catastrophic backtracking, StringBuilder khổng lồ, cache không giới hạn, ThreadLocal rò rỉ; HeapDumpOnOutOfMemoryError/ExitOnOutOfMemoryError/JFR/NMT; playbook cấp cứu MAT; ví dụ số liệu; checklist; Senior tip.
Mỗi câu có `**Tóm tắt:**` → cơ chế từng bước + vì sao → code ≤30 dòng có comment → bảng trade-off → pitfall → Ví dụ đời thực (số liệu) → Trả lời mẫu → ### Checklist → > Senior tip; follow 3 câu. Không backtick, không `${`.

Nghiệm thu:
- `node --check js/data/q-concurrency-jvm.js` → OK.
- `node scripts/build-light-index.js` → ghi lại index-light.js.
- `node scripts/validate.js` → file của tôi KHÔNG còn lỗi/cảnh báo nào trên 3 câu mới.

LƯU Ý: `validate.js` hiện vẫn in `LỖI` ở `bugs.js` (bug-047, bug-048: story/fix/hints/artifacts) — đây là file KHÔNG thuộc task này, đã lỗi từ trước khi tôi sửa (không phải do thay đổi của tôi). Các cảnh báo "đáp án ngắn" trên concurrency-081/083/084, jvm-070/071/072 là mục có sẵn của task khác, tôi không sửa theo luật "không sửa mục đã có".
Reviewed-by: kilo (T2537R)
