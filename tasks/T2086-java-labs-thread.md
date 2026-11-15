# T2086 — 2 debug lab (thread) vào labs-thread.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-thread.js`
After: T2069

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-thread.js` để không trùng tình huống. id `lab-thread-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

1. **Pool HikariCP cạn do transaction giữ connection trong lúc gọi HTTP ra ngoài**: jstack nhiều thread chờ HikariPool.getConnection, metrics pending=200, active=20; cách sửa: tách gọi ngoài khỏi @Transactional, timeout, tăng pool không phải lời giải

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

- Thêm 2 lab thread senior (id nối tiếp sau lab-thread-016): `lab-thread-017` (InterruptedException bị nuốt → job shutdown không dừng được, `awaitTermination` trả về false) và `lab-thread-018` (ScheduledThreadPoolExecutor pool.size=1 bị task dài chặn → tất cả `@Scheduled` đói).
- Lab #1 của task (HikariCP cạn do `@Transactional` giữ connection khi gọi HTTP) **đã tồn tại** làm `lab-thread-002` (thêm bởi T2069) ⇒ không thêm trùng, thay vào đó viết 2 lab mới.
- `node --check js/data/labs-thread.js` → OK. `node scripts/validate.js` → không có lỗi nào thuộc `labs-thread.js`.
- `node scripts/build-light-index.js` bị crash trước do lỗi cú pháp sẵn có ở `q-concurrency-jvm.js:11796` (file không sở hữu, không sửa). `index-light.js` cảnh báo đã cũ (cùng nguyên nhân) — không liên quan đến thay đổi này.
- Các lỗi validate còn lại (`path.js`, `lessons-*.js`, `toeic.js`, `projects.js`, `q-concurrency-jvm.js`) là sẵn có trong file khác, không phải do labs-thread.js.
Reviewed-by: kilo (T2086R)
