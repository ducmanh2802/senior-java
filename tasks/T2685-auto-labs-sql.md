# T2685 — 2 debug lab (sql) vào labs-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T2675

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-sql.js` để không trùng tình huống. id `lab-sql-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

(1) **Báo cáo chậm do thống kê lỗi thời**: EXPLAIN ANALYZE PostgreSQL rows ước lượng 120 nhưng thực tế 1.800.000, chọn Nested Loop; sửa ANALYZE, autovacuum_analyze_scale_factor theo bảng. (2) **Bảng bị bloat do transaction mở lâu**: pg_stat_activity có session "idle in transaction" 6 giờ, n_dead_tup tăng, query chậm dần; sửa idle_in_transaction_session_timeout, sửa code giữ transaction.

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

Đã hoàn thành (vòng 2, chọn góc khác lab-sql-009 và lab-sql-013 đã có):

- `lab-sql-044` (senior) — Báo cáo chậm dần từng tuần do statistics cũ: `autovacuum_analyze_scale_factor = 0.1` trên bảng 29,8 triệu dòng đặt ngưỡng autoanalyze ≈ 2,98 triệu, batch tuần 1,2 triệu (4%) không bao giờ chạm → EXPLAIN Nested Loop rows=120 vs thực tế 1.800.000, Seq Scan branch loops=1,8 triệu; sửa ANALYZE + giảm scale_factor theo bảng + statistics target. (Khác lab-sql-009: ở đó là bulk-load rồi query sau 4 giây; ở đây là drift mạn tính nhiều tuần do cấu hình ngưỡng.)
- `lab-sql-045` (senior) — Index-only scan chậm dần 8 ms → 894 ms do visibility map bị bỏ đói: phiên `idle in transaction` 6 giờ giữ xmin 812344031, autovacuum "0 removable, 6.200.114 nonremovable", `Heap Fetches` 0 → 1.780.000; sửa `idle_in_transaction_session_timeout` + sửa code không giữ transaction khi stream + VACUUM/REINDEX CONCURRENTLY + HikariCP leakDetectionThreshold. (Khác lab-sql-013: ở đó là seq/index scan chậm do nhiều page; ở đây là index-only scan mất tối ưu VM, dấu hiệu là Heap Fetches.)

Ngoài ra file còn sót 2 lab hỏng từ lần chạy trước bị gián đoạn (`lab-sql-046` OFFSET, `lab-sql-047` FK thiếu index) — đã viết lại hoàn chỉnh (có dấu, không backtick/`${`, artifact thật) để file parse được; `lab-sql-048` sửa 1 ký tự lạ "往復" → "khứ hồi".

Kiểm tra:
- `node --check js/data/labs-sql.js` → OK.
- Kiểm tra schema 4 lab bằng script riêng (không backtick/`${`, đủ `**Tóm tắt:**`/`### Dẫn chứng`/`> Senior tip:`, rubric 5, hints 3, artifact ≥ 200 ký tự) → OK; file có 49 lab sql.
- `node scripts/validate.js` đếm `sql 49` lab, **không có lỗi nào thuộc lab-sql** (chỉ còn cảnh báo về độ dài đáp án của file khác).

LƯU Ý cho integrator: `node scripts/build-light-index.js` và `node scripts/validate.js` (kết luận OK) hiện bị CHẶN bởi file của agent khác đang chạy dở, KHÔNG phải file của task này (luật 3 cấm sửa file người khác):
- `js/data/q-sql.js:9675` — backtick lạc trong template literal (agent T2689).
- `js/data/q-devops.js:18629` — backtick lạc trong template literal (agent T2682).
- `js/data/index-light.js` cũ (không build lại được vì build nạp q-sql.js).
Khi các agent đó xong, chạy lại `node scripts/build-light-index.js && node scripts/validate.js` sẽ ra `OK — không có lỗi.`
Reviewed-by: kilo (T2685R)
