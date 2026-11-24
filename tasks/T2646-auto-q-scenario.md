# T2646 — 3 câu hỏi Senior Java (scenario) vào q-scenario.js

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T2556

Thêm **3 câu hỏi phỏng vấn mới** (topic: scenario) vào `js/data/q-scenario.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-scenario.js`); đọc danh sách để **không trùng ý**.

Chủ đề: tình huống: bảng production bị xoá nhầm lúc 15:00 — các bước khôi phục (PITR) và giao tiếp; sau deploy CPU tăng từ 30% lên 90% — điều tra bằng JFR/async-profiler; đối tác báo nhận webhook trùng 3 lần — tìm nguyên nhân và sửa.

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

Đã thêm 3 câu hỏi mới (id nối tiếp, topic `scenario`), không trùng ý với mục đã có:
- **scenario-185** (senior): Bảng `orders` 40 triệu dòng bị xoá nhầm lúc 15:00 (DELETE thiếu WHERE) — quy trình khôi phục PITR (PostgreSQL: pg_basebackup + WAL archive + recovery_target_time), verify, chuyển traffic, giao tiếp; có code SQL/bash cấu hình recovery, bảng trade-off, ví dụ số liệu, trả lời mẫu, Senior tip.
- **scenario-186** (senior): Sau deploy CPU tăng 30% → ~90% trên mọi pod, p99 200ms → 700ms, traffic không đổi — điều tra bằng JFR (jdk.ExecutionSample, jcmd JFR.start) + async-profiler flame graph, phân biệt code nóng / GC / CPU throttling; code @Scheduled findAll vs query phân trang, bảng trade-off công cụ, ví dụ số liệu, trả lời mẫu.
- **scenario-187** (lead): Đối tác nhận webhook trùng tới 3 lần — nguyên nhân at-least-once + retry, sửa bằng idempotency key + dedup table + retry có kiểm soát; có sơ đồ ~~~seq, bảng trade-off, ví dụ số liệu, trả lời mẫu.

Tỉ lệ level: 2 senior + 1 lead (đúng yêu cầu "chủ yếu senior, 1 lead"). Mỗi câu ≥ 3600 ký tự, có **Tóm tắt:**, code/seq, bảng trade-off, pitfall, `### Ví dụ đời thực` có số liệu, `### Trả lời mẫu khi phỏng vấn` (150–220 từ), `> Senior tip:`, follow 2 câu. Đã sửa 1 lỗi chính tả trong 185 ("TÌM HÀI" → "TÌM HIỂU").

Kiểm tra file sở hữu:
- `node --check js/data/q-scenario.js` → OK (syntax hợp lệ).
- `node scripts/validate.js` → **q-scenario.js KHÔNG có lỗi/cảnh báo nào** (dòng tổng hợp: "scenario 187 câu hỏi"). 
- Không có backtick, không `${` trong nội dung; id duy nhất, tăng dần tới 187.

### BLOCKER (không thuộc file sở hữu — cần integrator xử lý, KHÔNG sửa trong task này theo luật 3)
`node scripts/validate.js` và `node scripts/build-light-index.js` hiện KHÔNG in ra `OK` vì các file của task KHÁC đang hỏng/dở dang trong working tree (máy chạy nhiều agent song song):
1. **js/data/lessons-api.js** (task T2645, abandoned ~đang dở): lỗi cú pháp "Unexpected identifier 'Clock'" ở dòng ~4489 — dùng backtick thô `` `Clock { now(); advance(ms); }` `` bên trong template literal `body:`. File này mtime cũ ~98 phút, agent trước dừng giữa chừng. `build-light-index.js` crash ngay tại đây → không regenerate được `index-light.js`.
2. **js/data/bugs.js**: bug-050.story/rootCause chứa ký tự lạ "客服" (Trung) → validate báo lỗi.
3. **js/data/path.js**: path-05 tham chiếu lesson-api-001..009 "không tồn tại" — hệ quả dây chuyền từ (1).
4. **js/data/index-light.js**: "đã cũ" — vì build-light-index không chạy được do (1); cần integrator chạy lại SAU KHI lessons-api.js được sửa.

Đề xuất cho integrator: yêu cầu agent T2645 sửa backtick ở lessons-api.js (escape hoặc bỏ backtick), xử lý "客服" ở bugs.js, rồi chạy `node scripts/build-light-index.js` để sinh lại index-light.js (khi đó sẽ có scenario-185..187) và `node scripts/validate.js` → OK. Phần q-scenario.js của T2646 đã hoàn tất và sạch.
Reviewed-by: kilo (T2646R)
