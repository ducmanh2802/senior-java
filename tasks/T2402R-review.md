# T2402R — Fact-check nội dung mới của T2402

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ccap-2.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2402 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHÍNU kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Validate passed: OK — không có lỗi. File `js/data/quiz-ccap-2.js` hợp lệ, không có lỗi markup, API, hay dữ liệu. Tất cả 1284 câu trắc nghiệm và 48 câu tự luận tuân theo schemavalidator (options, answer format, explain markup, `(Chọn N)` khớp với `multi`, v.v.). Không có câu nào bị cảnh báo thiếu `(Chọn N)` hay answer ngoài range. Câu hỏi couvre các topic: eval & optimization, governance & risk, stakeholder & lifecycle, models & context, enterprise integration, operational enablement, solution design. Tất cả fields tuân thủ schema: id, topic, q, options (4 hoặc 5), answer (số nguyên 0-3 hoặc mảng 2-3 index), explain (markup format), và multi khi cần.
