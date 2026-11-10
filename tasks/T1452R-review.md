# T1452R — Fact-check nội dung mới của T1452

Status: DONE
Agent: opencode
Owns: `js/data/q-primer.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1452 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 2 câu hỏi mới trong `js/data/q-primer.js`:
- `primer-024` (Encoding/UTF-8): Nội dung kỹ thuật đúng. Giải thích char vs byte vs encoding, UTF-8 biến độ dài 1-4 byte, ví dụ "Nguyễn" 6 ký tự = 8 byte UTF-8, Java `StandardCharsets.UTF_8`, mojibake, PostgreSQL varchar tính theo ký tự, MySQL utf8mb4 cho emoji. Ví dụ đời thực nhất quán (Spring Boot 3, Java 17, PostgreSQL, log encoding, charset DB).
- `primer-025` (Big-O): Nội dung kỹ thuật đúng. Định nghĩa Big-O, 5 mức O(1)/O(log n)/O(n)/O(n log n)/O(n²) với ví dụ backend thực tế (HashMap, B-tree index, duyệt list, TimSort/dual-pivot quicksort, vòng lặp lồng). Bảng tăng trưởng log₂(n) đúng (~10 cho 1K, ~20 cho 1M). Ví dụ đời thực O(n²) → O(n) bằng HashMap, số liệu 30K×30K=900M so sánh, giảm 45s → 250-400ms.

Không phát hiện lỗi kỹ thuật, lỗi markup, hay thuật ngữ sai. `node scripts/validate.js` không báo lỗi cho q-primer.js (các lỗi hiển thị là file khác sẵn có: q-autotest.js, lessons-autotest.js, path.js).
