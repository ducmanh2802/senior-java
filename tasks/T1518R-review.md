Status: DONE
Agent: opencode
Owns: `js/data/quiz-cca-3.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1518 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Sửa qz-ccap-005: sửa câu trả lời đúng (chỉ A), sửa giải thích "phương án 1 và 3" thành phân tích đúng cho từng phương án (văn bản là dữ liệu không đáng tin, delimiter chỉ là giảm rủi ro, XML không tự an toàn).
- Sửa qz-ccap-015: sửa answer từ [1,3] thành [2,3], sửa giải thích theo đúng đáp án (truyền passage có ID ổn định và yêu cầu trích ID; kiểm tra ID/trích dẫn khớp tập retrieved).
- Sửa qz-ccap-029: sửa giải thích (xác minh tương thích model/API và ưu tiên structured output thay vì prefill) cho đúng với answer [1,4]. Validate OK.
