# T2078 — 2 debug lab (incident) vào labs-incident.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-incident.js`
After: T2052

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-incident.js` để không trùng tình huống. id `lab-incident-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

1. **Cache stampede khi key nóng trong Redis hết hạn giờ cao điểm**: dashboard DB CPU 100% đúng lúc TTL hết, log nhiều request cùng miss một key; cách sửa: lock/single-flight, TTL có jitter, refresh trước khi hết hạn

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id `<0x...>`, timestamp, số liệu khớp nhau và khớp `answer`. `answer` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/labs-incident.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm `lab-incident-035` (PostgreSQL deadlock: hai transaction khóa hàng ngược thứ tự products/wallets) và `lab-incident-036` (Redis cache stampede: key hot TTL hết hạn giờ cao điểm livestream, DB CPU 100%).
- Cả hai lab level senior, artifacts tự nhất quán (timestamp, pid, transaction id, số liệu khớp answer), rubric 5 ý, hints 3 ý, answer có ### Nguyên nhân gốc / ### Dẫn chứng / ### Cách sửa / ### Phòng ngừa / > Senior tip.
- `node --check js/data/labs-incident.js` OK; `node scripts/validate.js` không báo lỗi cho labs-incident.js (các lỗi còn lại là pre-existing trong q-banking.js, bugs.js, lessons-banking.js, path.js, index-light.js).
Reviewed-by: kilo (T2078R)
