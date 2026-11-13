# T1715 — 6 câu hỏi Senior Java (scenario) vào q-scenario.js

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T1377

Thêm **6 câu hỏi phỏng vấn mới** (topic: scenario) vào `js/data/q-scenario.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-scenario.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: tình huống production Java: latency p99 tăng sau khi bật virtual threads, CPU 100% do regex/vòng lặp vô hạn (cách tìm thread bằng top -H + jstack), ứng dụng restart liên tục trên K8s vì OOMKilled dù heap còn trống (native memory), batch job đêm chạy chậm gấp 5 lần sau khi dữ liệu tăng, lỗi dữ liệu do múi giờ (LocalDateTime vs Instant), đột ngột nhiều lỗi 502 khi deploy (graceful shutdown) — mỗi câu: triệu chứng → giả thuyết → điều tra từng bước bằng công cụ cụ thể → xử lý → phòng ngừa.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-scenario.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Da them 6 cau vao js/data/q-scenario.js, id noi tiep sau scenario-142: scenario-143 (virtual threads -> latency p99 tang do pinning, senior), scenario-144 (CPU 100% regex/vong lap vo han, chuan doan top -H + jstack, lead), scenario-145 (OOMKilled bo nho native do ngan xep luong, khac scenario-015 o heap sizing, senior), scenario-146 (batch job cham 5x sau du lieu tang, N+1/full scan, senior), scenario-147 (loi ngay do mui gio, khac scenario-081 o kieu cot, senior), scenario-148 (loi 502 khi deploy, keep-alive/cold start/grace period, khac scenario-032 o race SIGTERM-endpoint, lead).
- Moi cau: Tom tắt, khái niệm, trieu chung/so lieu, nguyen nhan, dieu tra bang cong cu cu the (jcmd JFR jdk.ThreadPinning, top -H, jstack nid, printf %x, EXPLAIN ANALYZE, pg_stat_statements, jstat, jcmd VM.native_memory), code Java <= 30 dong, bang trade-off, loi hay gap, vi du doi thuc co so lieu, tra loi mau 150-220 tu, Senior tip, follow 2-3 cau.
- Da chay: node --check js/data/q-scenario.js (OK), node scripts/build-light-index.js (OK), node scripts/validate.js (khong loi cua q-scenario.js; 2 loi con lai o labs-sql.js va lessons-sql.js la file cua nhom khac, chua sua theo luat 3).
- KHONG commit.
Reviewed-by: kilo (T1715R)
