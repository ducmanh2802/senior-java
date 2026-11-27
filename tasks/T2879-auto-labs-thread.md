# T2879 — 2 debug lab (thread) vào labs-thread.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-thread.js`
After: T2830

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-thread.js` để không trùng tình huống. id `lab-thread-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

(1) **Scheduled job trễ dần và dồn việc**: @Scheduled(fixedRate = 60000) nhưng job mất 90s, TaskScheduler mặc định 1 thread nên các lần chạy nối tiếp và trễ dần, job khác cùng scheduler bị chặn (thread dump chỉ thấy scheduling-1 bận); sửa pool size, fixedDelay, ShedLock khi nhiều instance. (2) **Log ghi đồng bộ làm chậm request**: jstack nhiều thread http-nio BLOCKED tại ch.qos.logback.core.OutputStreamAppender chờ cùng lock; sửa AsyncAppender, giảm log.

> Vòng 4 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
`node --check js/data/labs-thread.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 2 lab mới với ID tiếp nối (largest existing was lab-thread-038):
- lab-thread-039: '@Scheduled cron overlap: job chạy 120s nhưng cron "0 */1 * * * *" (mỗi phút) — Spring tạo thread mới cho mỗi trigger, cạn Tomcat pool'. Khác với lab-thread-032 (fixedRate): dùng cron expression, ScheduledThreadPoolExecutor tạo thread mới mỗi trigger (không reuse), gây thread leak tích lũy 120 thread, cạn Hikari connection pool.
- lab-thread-040: 'Log4j2 sync appender trong Servlet Filter: request thread BLOCKED tại RollingRandomAccessFile.write, throughput sụt 90%'. Khác với lab-thread-033 (Logback): dùng Log4j2 RollingRandomAccessFile, Servlet Filter log full body JSON pretty-print, gây cả lock contention VÀ GC pressure (allocation 1.2 GB/s, Young GC 10x, Full GC 1.2s).
Tất cả artifact tự nhất quán, answer đúng format, validation pass.
Reviewed-by: kilo (T2879R)
