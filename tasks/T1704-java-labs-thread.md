# T1704 — 2 debug lab (thread) vào labs-thread.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-thread.js`
After: T857

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-thread.js` để không trùng tình huống. id `lab-thread-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

1. **Pool HikariCP cạn do gọi HTTP ngoài trong @Transactional**: jstack 20 thread chờ HikariPool.getConnection, 10 thread giữ connection đang đọc socket; log "Connection is not available, request timed out after 30000ms".
2. **Deadlock giữa hai ReentrantLock do thứ tự lock ngược** trong service chuyển khoản: jstack có mục "Found one Java-level deadlock" với ownable synchronizers.

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id `<0x...>`, timestamp, số liệu khớp nhau và khớp `answer`. `answer` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/labs-thread.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Không thêm lab mới: cả hai tình huống yêu cầu đã tồn tại trong `js/data/labs-thread.js` (được thêm trước T1704, commits T857/T820/T355), nên thêm lab-thread-013/014 sẽ trùng tình huống, vi phạm quy tắc task.
- lab-thread-001: deadlock thứ tự lock ngược trong dịch vụ chuyển tiền, jstack có mục "Found one Java-level deadlock" + ownable synchronizers (level senior).
- lab-thread-002: HikariCP cạn do gọi HTTP ngoài @Transactional, thread chờ getConnection + giữ connection đọc socket, log "Connection is not available, request timed out after 30000ms" (level senior).

Kiểm tra: `node --check js/data/labs-thread.js` OK; `validate.js` không báo lỗi nào về labs-thread.js. Lỗi còn lại trong `validate.js` (q-concurrency-jvm.js, q-sql.js, bugs.js, lessons-*.js, path.js, projects.js) là của file không sở hữu bởi T1704, không được sửa theo quy tắc AGENTS.md; `build-light-index.js` bị chặn bởi lỗi cú pháp q-concurrency-jvm.js (file không sở hữu).