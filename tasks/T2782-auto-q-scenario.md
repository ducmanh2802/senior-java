# T2782 — 3 câu hỏi Senior Java (scenario) vào q-scenario.js

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T2721

Thêm **3 câu hỏi phỏng vấn mới** (topic: scenario) vào `js/data/q-scenario.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-scenario.js`); đọc danh sách để **không trùng ý**.

Chủ đề: tình huống: bảng production bị xoá nhầm lúc 15:00 — các bước khôi phục (PITR) và giao tiếp; sau deploy CPU tăng từ 30% lên 90% — điều tra bằng JFR/async-profiler; đối tác báo nhận webhook trùng 3 lần — tìm nguyên nhân và sửa.

> Vòng 3 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
`node --check js/data/q-scenario.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 3 câu (id nối tiếp, max cũ là scenario-190):
- scenario-191 (senior): hỏng logic số dư 1 khách trên DB multi-tenant 2TB, không rõ mốc bắt đầu — PITR có chọn lọc ra instance tạm + vá theo tenant bằng bút toán idempotent, không restore cả cụm. Góc khác scenario-185 (vốn là "xoá bảng lúc 15:00", có mốc rõ, single DB).
- scenario-192 (senior): CPU 30%→90% nhưng throughput GIẢM sau deploy — phân biệt "code nóng thật" vs "tranh lock/spin" bằng JFR (JavaMonitorEnter/ThreadPark) và async-profiler wall vs cpu. Góc khác scenario-186 (task nền/regex đốt CPU, throughput không giảm).
- scenario-193 (lead): webhook trùng 3 lần KHÔNG do retry mà do 3 instance outbox cùng đọc 1 hàng — sửa bằng claim FOR UPDATE SKIP LOCKED + lease reclaim + idempotency key. Góc khác scenario-187 (trùng do retry/timeout, fix bằng idempotency key phía nhận).

Kiểm tra: `node --check js/data/q-scenario.js` OK; `node scripts/build-light-index.js` đã chạy lại; `node scripts/validate.js` — q-scenario.js KHÔNG có lỗi/cảnh báo nào (grep q-scenario = 0). Validate còn LỖI ở các file KHÁC không thuộc task này (quiz-ops.js, lessons-jpa/modern/payments.js, path.js) — không sửa vì luật 3 (chỉ sửa file sở hữu). Không commit.
Reviewed-by: kilo (T2782R)
