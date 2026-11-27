# T2867 — 3 câu hỏi Senior Java (jvm) vào q-concurrency-jvm.js

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T2813

Thêm **3 câu hỏi phỏng vấn mới** (topic: jvm) vào `js/data/q-concurrency-jvm.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-concurrency-jvm.js`); đọc danh sách để **không trùng ý**.

Chủ đề: chọn GC cho service latency thấp (G1 vs ZGC generational JDK 21) có số liệu, container memory: -XX:MaxRAMPercentage và vì sao pod bị OOMKilled dù heap chưa đầy (native memory, thread stack, direct buffer), đọc JFR để tìm allocation hotspot.

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
`node --check js/data/q-concurrency-jvm.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 3 câu (id nối tiếp, lớn nhất trước là jvm-088):
- jvm-089 (senior) — Góc CHƯA có: vì sao ZGC tốn CPU hơn G1 + allocation stall + khi nào KHÔNG nên đổi collector (các câu jvm-023/051/068/079/085/086 đã bàn "chọn G1 vs ZGC" theo latency/throughput; câu này đào vào chi phí CPU và tình huống migration làm throughput tụt).
- jvm-090 (senior) — Góc CHƯA có: glibc malloc arena làm RSS phình theo thread dù heap ổn định + MALLOC_ARENA_MAX + NMT baseline diff (các câu jvm-041/057/066/074/080/087 bàn OOMKilled do thread stack/direct buffer; câu này là native do malloc arena — không nằm trong NMT).
- jvm-091 (lead) — Góc CHƯA có: JFR event streaming (jfr stream / EventStream API) bắt spike allocation theo thời gian thực + bẫy sampling jdk.ObjectAllocationSample (các câu jvm-042/067/075/081/088 bàn continuous recording + JMC post-mortem; câu này là streaming trực tiếp).

Kiểm tra: `node --check` OK; `node scripts/qtool.js check js/data/q-concurrency-jvm.js jvm-089 jvm-090 jvm-091` → OK; đã chạy build-light-index.js. `node scripts/validate.js` báo lỗi nhưng TẤT CẢ nằm ở file khác (q-frontend.js, quiz-ops.js, quiz-ckad-1.js, lessons-*.js, toeic-lr-1a.js) — không thuộc quyền sở hữu của task này (AGENTS.md luật 3), file q-concurrency-jvm.js không có lỗi/cảnh báo nào cho 3 mục mới. Không commit.
Reviewed-by: kilo (T2867R)
