# T2648 — 2 debug lab (thread) vào labs-thread.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-thread.js`
After: T2611

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-thread.js` để không trùng tình huống. id `lab-thread-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

(1) **parallelStream cho I/O làm nghẽn cả service**: jstack thấy ForkJoinPool.commonPool-worker-* bận gọi HTTP từ nhiều request, request khác chờ; sửa bỏ parallelStream cho I/O, executor riêng. (2) **Deadlock khi chuyển tiền 2 chiều**: jstack "Found one Java-level deadlock" giữa transfer-1 và transfer-2 trên 2 monitor Account; sửa khoá theo thứ tự id.

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

Đã thêm:
- lab-thread-028: parallelStream gọi HTTP chặn ForkJoinPool.commonPool (jstack: worker RUNNABLE tại Socket.read, exec thread WAITING parking)
- lab-thread-029: deadlock chuyển tiền 2 chiều (jstack: 2 thread BLOCKED chờ lẫn nhau trên monitor Account, "Found one Java-level deadlock")
Reviewed-by: kilo (T2648R)
