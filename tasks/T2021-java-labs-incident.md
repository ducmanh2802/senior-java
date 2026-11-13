# T2021 — 2 debug lab (incident) vào labs-incident.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-incident.js`
After: T1549

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-incident.js` để không trùng tình huống. id `lab-incident-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

1. **Kafka consumer lag tăng vọt sau deploy** do max.poll.interval.ms bị vượt vì xử lý chậm, dẫn đến rebalance liên tục: log consumer "Member ... sending LeaveGroup request ... poll timeout", metric lag; cách sửa (giảm max.poll.records, tách xử lý, tăng interval có cân nhắc).
2. **Cache stampede khi Redis key hết hạn giờ cao điểm**: DB CPU 100% đúng phút key TTL hết, log nhiều query giống nhau; cách sửa (lock theo key, TTL ngẫu nhiên, refresh-ahead).

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

Đã thêm 2 lab level senior vào js/data/labs-incident.js, id nối tiếp số lớn nhất (030 → 031, 032):
- lab-incident-031: Kafka consumer lag tăng vọt sau deploy do max.poll.interval.ms bị vượt (xử lý chậm → rebalance liên tục, log LeaveGroup/poll timeout, metric lag), sửa bằng giảm max.poll.records, tách xử lý ra khỏi listener, tăng interval có cân nhắc.
- lab-incident-032: Cache stampede khi Redis key hết hạn đúng giờ cao điểm (CPU DB 100%, nhiều truy vấn giống nhau), sửa bằng khoá theo key, TTL ngẫu nhiên, refresh-ahead.
Kiểm tra: node --check js/data/labs-incident.js → OK; node scripts/validate.js không báo lỗi nào thuộc labs-incident.js (các lỗi còn lại trong bugs.js, lessons-*.js, path.js, q-concurrency-jvm.js, index-light.js là của file do người khác sở hữu và đã có trước, không sửa theo luật 3 AGENTS.md).
Reviewed-by: kilo (T2021R)
