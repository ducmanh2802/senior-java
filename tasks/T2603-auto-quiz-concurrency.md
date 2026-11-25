# T2603 — 10 câu trắc nghiệm (concurrency) vào quiz-java.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-java.js`
After: T2591

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-java.js` (topic `concurrency`; id `qz-concurrency-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-concurrency-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: volatile vs synchronized vs Atomic*, happens-before, ExecutorService sizing, CompletableFuture (thenApply vs thenCompose, exceptionally, thread chạy callback), ConcurrentHashMap.compute, điều kiện deadlock, virtual threads pinning. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-concurrency đã có.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/quiz-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 10 câu trắc nghiệm concurrency vào js/data/quiz-java.js, nối tiếp id lớn nhất 065: qz-concurrency-066, 067, 068, 069, 070, 071, 072, 073, 074, 075 (7 câu đơn, 3 câu multi: 070, 071, 074; đáp án đúng rải đều vị trí 0/1/2/3).
- Chủ đề: volatile vs synchronized vs Atomic* (066), happens-before/safe publication (067), ExecutorService sizing CPU-bound (068), CompletableFuture exceptionally (069), ConcurrentHashMap.compute (070 multi), điều kiện deadlock (071 multi), virtual threads pinning (072), synchronized static vs instance (073), ExecutorService submit/execute (074 multi), submit vs execute báo lỗi (075).
- `node --check js/data/quiz-java.js` → OK. `scripts/validate.js` không báo lỗi schema cho câu hỏi mới (chỉ báo `index-light.js: đã cũ`).
- Ghi chú môi trường: `node scripts/build-light-index.js` bị chặn bởi lỗi cú pháp sẵn có trong `js/data/q-sql.js` (và `q-devops.js`) — file không thuộc task này, không được sửa theo AGENTS.md luật 3/5; do đó `index-light.js` chưa sinh lại và `validate.js` vẫn báo `index-light.js: đã cũ` (không liên quan đến câu hỏi vừa thêm).
Reviewed-by: kilo (T2603R)
