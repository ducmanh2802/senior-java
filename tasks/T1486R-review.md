# T1486R — Fact-check nội dung mới của T1486

Status: DONE
Agent: opencode
Owns: `js/data/quiz-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1486 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check 15 câu trắc nghiệm mới (qz-primer-011 → qz-primer-025) trong `js/data/quiz-java.js`:
- Kiểm tra kỹ lưỡng từng câu về mặt kiến thức (HTTP, TCP, DNS, Git, Linux, Big O, OOP/SOLID, DIP, JSON, reverse proxy).
- Đã tìm thấy và sửa 1 lỗi cú pháp: file kết thúc bằng `},` + `);` (đúng), nhưng diff HEAD cho thấy dòng cuối `);` trước đó là `}` (thiếu dấu `,`) — đã thêm dấu `,` để mảng object liên tục.
- Không phát hiện lỗi kiến thức kỹ thuật nào: các đáp án, giải thích, level (mid/senior/lead), topic='primer' (có trong topics.js), multi flag, answer index, "(Chọn N)" đều đúng.
- Đã chạy `node scripts/validate.js` → `OK — không có lỗi.`

Lỗi đã sửa:
- **qz-primer-011..025**: file kết thúc `},\n);` → trước đó là `}\n);` (thiếu dấu `,` ở phần tử cuối cùng trong mảng). Đã thêm dấu `,` để JS không bị SyntaxError.
