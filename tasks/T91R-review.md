# T91R — Fact-check nội dung mới của T91

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`, `js/data/q-system-design.js`, `js/data/q-scenario.js`, `js/data/q-aws.js`, `js/data/q-ai.js`, `js/data/q-devops.js`, `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T91 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review phần diff của bảy file sở hữu: nội dung đáp án mới không có thay đổi; các thay đổi là refs. Đã sửa refs bị khai báo lặp ở `devops-009`, `devops-010`, `devops-014`. Không phát hiện lỗi kỹ thuật/markup khác trong phần diff được giao. `node --check` cả bảy file đạt; `node scripts/validate.js` in `OK — không có lỗi.` Link checker không nhận diện refs trong các file này (báo 0 link), nên chưa xác nhận URL bằng checker.
