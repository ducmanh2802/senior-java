# T2043 — 12 câu trắc nghiệm (concurrency) vào quiz-java.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-java.js`
After: T2028

Thêm **12 câu trắc nghiệm** vào `js/data/quiz-java.js` (topic `concurrency`; id `qz-concurrency-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-concurrency-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: đoạn code concurrency Java ngắn: đoán output/lỗi (race, deadlock, visibility, CompletableFuture exception, ExecutorService không shutdown, ConcurrentHashMap compute) — mỗi câu có code ~~~java ngắn.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/quiz-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 12 câu trắc nghiệm topic `concurrency` vào `js/data/quiz-java.js`: `qz-concurrency-034`..`qz-concurrency-045` (nối tiếp id lớn nhất trước đó `qz-concurrency-033`).
- Nội dung: đoạn code Java ngắn đoán output/lỗi (Future/ExecutionException, HashMap race/computeIfAbsent không thread-safe, ThreadLocal leak, lambda effectively-final, sleep vs wait trong synchronized, double-checked locking/volatile, CompletableFuture commonPool & exceptionally/whenComplete, ConcurrentHashMap compute trả null xoá entry, virtual thread pinning với synchronized, AtomicInteger/CAS, CopyOnWriteArrayList, ThreadPoolExecutor queue/rejection). 3 câu multi (Chọn 2): `qz-concurrency-036` [0,2], `qz-concurrency-040` [0,1], `qz-concurrency-045` [0,1]; answer đúng rải vị trí; `explain` giải thích vì sao đúng và vì sao từng phương án sai.
- Kiểm tra: `node --check js/data/quiz-java.js` → OK.
- `node scripts/build-light-index.js` và `node scripts/validate.js` hiện **KHÔNG** đạt `OK — không có lỗi.` do lỗi có sẵn ngoài phạm vi file sở hữu (ví dụ `q-concurrency-jvm.js` lỗi cú pháp `Unexpected token ':'`, và nhiều lỗi tham chiếu `related`/path tới id concurrency/jvm không tồn tại trong bugs.js, lessons-*, projects.js, path.js; `index-light.js` báo cũ). Không thể tự sửa theo luật 3 (chỉ sửa file task sở hữu). Không có lỗi mới nào trỏ vào `js/data/quiz-java.js` hay các id `qz-concurrency-034`..`045`.
- Không chạy git commit/push, không mở trình duyệt, không kill tiến trình theo tên.
Reviewed-by: kilo (T2043R)
