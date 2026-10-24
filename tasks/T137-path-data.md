# T137 — Dữ liệu lộ trình học Java junior → Senior

Status: TODO
Agent: opencode
After: T139
Owns: `js/data/path.js`, `scripts/validate.js`

Người học: dev Java **junior** (đã code Java, hổng nền collections, concurrency, JVM, SQL…) muốn lên **Senior** trong ~26 tuần. Đọc comment schema đầu `js/data/path.js` (đã có 2 chặng mẫu) và AGENTS.md mục 4, 12.

1. Viết đủ **10–12 chặng** `window.PATH` theo thứ tự học hợp lý, 3 phase: **Nền tảng** (core, collections, SQL, JVM, HTTP/API), **Vững vàng** (concurrency, modern Java, Spring, JPA, DB nâng cao, testing, security, devops), **Senior** (system design, microservices, architecture, chuẩn bị phỏng vấn). Mỗi chặng:
   - `lessons`: id bài học CÓ THẬT trong mọi `js/data/lessons-*.js` (liệt kê bằng node trước khi viết). Mọi bài học đang có phải xuất hiện đúng 1 lần trong lộ trình.
   - `questions`: 4–8 id câu hỏi CÓ THẬT trong ngân hàng (`js/data/q-*.js`), ưu tiên level mid/senior, đúng chủ đề chặng — đây là "câu chốt chặng".
   - `quizTopics`: topic id có thật trong `js/data/topics.js`. `requires`: chặng trước (cho phép 2 chặng song song nếu hợp lý). `weeks`: phủ tuần 1→26 không chồng chéo vô lý. `goal`: 1–2 câu markup nói rõ học xong làm được gì.
2. Thêm vào `scripts/validate.js` phần kiểm tra `window.PATH` (chỉ THÊM, không sửa logic cũ): id `path-NN` duy nhất, order tăng dần, phase hợp lệ, mọi lesson/question/topic/requires id tồn tại, requires không trỏ tới chặng sau, không lesson nào lặp; cảnh báo (không lỗi) nếu có bài học không nằm trong lộ trình.
3. `node scripts/validate.js` → OK, rồi `Status: DONE` + ghi chú.

## Notes
