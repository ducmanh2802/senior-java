# T1705 — 2 debug lab (gc) vào labs-gc.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-gc.js`

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-gc.js` để không trùng tình huống. id `lab-gc-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

1. **Humongous allocation trên G1** do đọc file/byte[] lớn: GC log JDK 17 (-Xlog:gc*) có "Humongous regions", to-space exhausted, Full GC; cách sửa (stream, tăng G1HeapRegionSize có cân nhắc).
2. **Rò rỉ bộ nhớ do cache static không giới hạn**: old gen tăng dần sau mỗi GC qua 3 ngày, histogram jcmd GC.class_histogram; cách sửa (Caffeine có maximumSize/expire).

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id `<0x...>`, timestamp, số liệu khớp nhau và khớp `answer`. `answer` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/labs-gc.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Added `lab-gc-013` (Import hóa đơn PDF: humongous allocation trên G1 do `readAllBytes()`/byte[] lớn, GC log JDK 17 -Xlog:gc* có G1 Humongous Allocation, To-space exhausted, Pause Full, hướng sửa stream/giới hạn đồng thời và cân nhắc G1HeapRegionSize) và `lab-gc-014` (Old gen tăng dần 3 ngày do cache static ConcurrentHashMap không giới hạn, 3 lần jcmd GC.class_histogram + heap metrics, sửa bằng Caffeine maximumSize/expireAfterWrite/expireAfterAccess). Cả hai level senior, rubric ≥3, hints ≥2, artifact tự nhất quán.
- `node --check js/data/labs-gc.js` OK; `node scripts/build-light-index.js` đã cập nhật `js/data/index-light.js`.
- `node scripts/validate.js` hiện FAIL do lỗi có sẵn ngoài phạm vi task (không thuộc file sở hữu): `q-spring-data.js: jpa-053.a: có ký tự lạ "属于" ...` — không chỉnh sửa theo luật ownership.
Reviewed-by: kilo (T1705R)
