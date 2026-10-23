# T103R — Fact-check nội dung mới của T103

Status: DONE
Agent: opencode
Owns: `js/data/algo.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T103 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- algo-058: sửa heap để loại toàn bộ phòng đã kết thúc trước khi gán cuộc họp mới; thêm trường hợp nhiều phòng cùng rảnh.
- algo-064: làm rõ greedy không đảm bảo nghiệm tối thiểu/tìm được với tồn kho giới hạn; nêu counterexample và giữ hợp đồng là mô phỏng chiến lược greedy.
- algo-066: dùng long cho lợi nhuận trung gian/kết quả để tránh tràn int với chuỗi giá dài.
- Xác minh các mục còn lại trong algo-049..068; node --check thành công. Validator chạy cuối cùng thành công: OK — không có lỗi.
