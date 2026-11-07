# T857R — Fact-check nội dung mới của T857

Status: DONE
Agent: opencode
Owns: `js/data/labs-thread.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T857 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lab-thread-011: xoá dòng `<neverBlock>false</neverBlock>` trùng lặp trong cấu hình AsyncAppender (mẫu XML ở phần Cách sửa). Logback Joran áp dụng phần tử cuối cùng, nên hai dòng `<neverBlock>` liên tiếp khiến giá trị cuối cùng (`false`) ghi đè ý định `neverBlock=true`, làm sai toàn bộ ý nghĩa cấu hình đề xuất.
