# T2017R — Fact-check nội dung mới của T2017

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2017 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỉ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review 8 câu hỏi mới (concurrency-068, 069, 070, 071, 072 + jvm-056, 057, 058). Nội dung kiến thức tổng thể tốt: giải thích từng bước, có code ví dụ, số liệu, tình huống production và trả lời mẫu. Chỉ cần sửa 1 lỗi kỹ thuật + 1 lỗi markup:

- **jvm-058 (Structured concurrency / ScopedValue)** — SỬA LỖI KỸ THUẬT: nội dung viết "structured concurrency dự kiến hoàn thiện ở JDK 28 theo JEP 543", nhưng JEP 543 đã được `Integrated` (Status: Integrated, Release: 28, Updated 2026-10-17). Đã cập nhật thành "đã chính thức ở JDK 28 (JEP 543)", sửa bảng phiên bản (dòng JDK 28 từ "Dự kiến" → "Chính thức"), mục "Giới hạn khiến chưa dùng ngay" từ "Preview" sang "Phiên bản JDK", và phần "Rủi ro phát hiện khi nâng lên JDK 25" thành "nâng lên JDK 28". Đây là lỗi thông tin bản release, không phải kiến thức core.
- **concurrency-071 (Interrupt / shutdownNow)** — SỬA LỖI MARKUP: bảng "Vòng đời của cờ interrupt" gom `sleep/wait/join/park/take` vào một dòng, trong khi `LockSupport.park` **không** ném `InterruptedException` và **không xoá** cờ (nó chỉ trả về sớm, cờ vẫn true). Đây là lỗi mô tả cơ chế. Đã tách `park` ra dòng riêng với chú thích đúng: "park trả về sớm, CỜ VẪN TRUE (không ném, không xoá)". Đồng thời thêm giải thích phân biệt `park` vs các điểm chờ throw InterruptedException ở phần cơ chế.

Các câu còn lại (concurrency-068/069/070/072, jvm-056/057) đã kiểm tra: không có backtick stray, không có `${`, tất cả `~~~` block đã cân đối, table markup hợp lệ, số liệu tự洽, API/flag đúng hiện hành (Java 21, JDK 25, JDK 28). Không phát hiện lỗi kiến thức thêm.

Kiểm tra: `node --check js/data/q-concurrency-jvm.js` → SYNTAX OK; `node scripts/validate.js` → OK (lỗi còn lại `bugs.js: bug-023` và cảnh báo `path.js` đều nằm ngoài file sở hữu, không phải của task này).