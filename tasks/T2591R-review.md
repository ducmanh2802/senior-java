# T2591R — Fact-check nội dung mới của T2591

Status: DONE
Agent: opencode
Owns: `js/data/quiz-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2591 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 10 câu mới (qz-collections-042…051) của T2591. 9/10 đúng kỹ thuật (đã chạy JDK 17 kiểm chứng các câu có output xác định: 042→"20 30 30 10", 046→"1 1 2", 047→NPE, 050→"2 4"; 043/045/048/049/051 đúng qua phân tích).

Lỗi đã sửa:
- qz-collections-044: Đáp án ghi "ném IllegalStateException (Recursive update)" là SAI. Đoạn code gốc `computeIfAbsent("a", k -> computeIfAbsent("b", …))` KHÔNG ném gì trên JDK 17 mà in ra `{a=1, b=1}`, vì "a" (hash 97→bin 1) và "b" (hash 98→bin 2) rơi vào hai bin khác nhau nên không có đệ quy cùng bin. Đã sửa code thành cùng khóa: `computeIfAbsent("a", k -> computeIfAbsent("a", …))` (đã test: ném IllegalStateException "Recursive update" đúng như đáp án 3), đồng thời cập nhật option 0 thành `{a=1}` và sửa lại đoạn giải thích "cùng bin với a (hoặc chính là a)" → "chính là khóa a đang giữ, cùng một bin".

Không sửa nội dung đã có ở HEAD, không thêm/xoá mục, chỉ file js/data/quiz-java.js.

LƯU Ý cho integrator: `node scripts/validate.js` và `node scripts/build-light-index.js` hiện KHÔNG chạy tới OK được vì các file KHÁC (không thuộc task này) đang lỗi cú pháp/dữ liệu giữa chừng: q-devops.js (backtick `kubectl` trong template literal → SyntaxError), lessons-devops.js / lessons-jvm.js / projects.js / path.js (related/question devops-* chưa tồn tại). File quiz-java.js của task này: `node --check` OK và không sinh lỗi nào trong validate.
