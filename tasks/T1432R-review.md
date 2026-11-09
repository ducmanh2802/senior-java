# T1432R — Fact-check nội dung mới của T1432

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1432 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `eng-001`: Gộp/dọn `> Senior tip:` bị lặp nội dung (free model nối tip mới + tip cũ thành một block dài, lặp ý). Không lỗi kỹ thuật.
- `eng-002`: Gộp/dọn `> Senior tip:` bị lặp (2 phiên bản hướng dẫn vẽ sơ đồ/phát âm ghép liền). Chuẩn hóa IPA Kafka/EKS trong tip.
- `eng-003`: Gộp/dọn `> Senior tip:` bị lặp (phiên bản EN + phiên bản VI + câu hỏi gợi ý đảo ngược lặp lại).
- `eng-004`: Kiểm tra mục "Lỗi người Việt hay mắc" mới — đúng ngữ pháp/phát âm (IPA /strɛŋkθ/ cho *strength* đúng; phân biệt *used to + V* vs *be used to + V-ing* đúng). Tip trước đó đã thay sạch (không lặp). Không sửa thêm.
- `eng-005`: Sửa giải thích sai về *rather than / would rather*: bản cũ ghi "Sau 'rather than' dùng V-ing khi so sánh hai danh từ" (sai với ví dụ `I would rather be a manager than a tech lead`). Sửa thành quy tắc đúng: `would rather A than B` dùng bare infinitive; `rather than` đứng riêng mới thường đi với V-ing. Gộp/dọn tip bị lặp.
- `eng-006`: Gộp/dọn `> Senior tip:` bị lặp dài + loại cụm tiếng Anh lẫn không tự nhiên ("Khóa học quan trọng nhất...", "wherever you personally did it") trong phần hướng dẫn tiếng Việt. Nội dung STAR/số liệu không đổi.
- `node scripts/validate.js` → `OK — không có lỗi.`. Chỉ sửa `js/data/q-english.js` (file sở hữu). Không git commit.
