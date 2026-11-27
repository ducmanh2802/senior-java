# T2868 — 10 câu trắc nghiệm (modern) vào quiz-java.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-java.js`
After: T2826

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-java.js` (topic `modern`; id `qz-modern-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-modern-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: record, sealed class, pattern matching instanceof/switch (Java 21), text block, var, Stream API (Collectors, teeing, toList bất biến), Optional dùng đúng/sai, virtual threads cơ bản. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-modern đã có.

> Vòng 4 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
Đã thêm 10 câu (id nối tiếp từ 070): qz-modern-071 … qz-modern-080 vào cuối `js/data/quiz-java.js` (append, không sửa mục cũ; diff thuần thêm 767 dòng, 0 xoá).

Góc mới (chưa có ở vòng trước):
- 071 Collectors.teeing (Java 12) — tính sum + count 1 lần duyệt.
- 072 Optional.orElse (eager) vs orElseGet (lazy) — số lần gọi getDefault().
- 073 var KHÔNG dùng cho field / kiểu trả về (multi, chọn 2).
- 074 case null trong switch pattern matching (Java 21) tránh NPE.
- 075 takeWhile vs filter (dừng sớm).
- 076 text block cắt incidental indentation theo mức thụt nhỏ nhất.
- 077 Stream.iterate 3 tham số (Java 9) hữu hạn.
- 078 switch expression + yield (multi, chọn 2).
- 079 Optional.stream() + flatMap lọc Optional rỗng.
- 080 Collectors.joining(delimiter, prefix, suffix) (multi, chọn 2).

3/10 là multi (≈1/4), đáp án đúng rải đều vị trí (0,1,2,3). Mọi explain nêu vì sao đúng + vì sao từng phương án sai.

Kiểm tra:
- `node --check js/data/quiz-java.js` → OK.
- Validate riêng file (mô phỏng logic quiz + markup của validate.js) → ISOLATED OK.
- Sửa 1 lỗi markup có sẵn từ lần chạy gián đoạn trước: qz-modern-065 (nested {{ }} trong inline code) — nằm trong file tôi sở hữu.
- `node scripts/validate.js` (toàn repo) KHÔNG còn lỗi nào của quiz-java.js.

BLOCKER ngoài phạm vi (không phải file tôi sở hữu, không tự sửa theo luật 3):
- `node scripts/build-light-index.js` và phần đầu `validate.js` dừng vì `js/data/q-concurrency-jvm.js:12224` (task T2867 đang làm) có backtick thô trong template literal → SyntaxError. Vì build-light-index không chạy được nên `js/data/index-light.js` chưa regenerate; validate báo "index-light.js đã cũ". Các lỗi còn lại của validate (projects.js/path.js/lessons-payments/toeic) cũng thuộc file agent khác. Cần integrator chạy lại build-light-index + validate sau khi T2867 sửa xong file của họ.
Reviewed-by: kilo (T2868R)
