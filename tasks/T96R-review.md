# T96R — Fact-check nội dung mới của T96

Status: DONE
Agent: opencode
Owns: `js/data/companies.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T96 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã fact-check nội dung mới trong `js/data/companies.js`:
- `tcb`: giữ số liệu hơn 8 triệu giao dịch/ngày theo AWS case study; annual report 2024 có dẫn chứng đầu tư công nghệ AWS.
- `vpbank`: stack và yêu cầu Java/Spring, MS SQL/Oracle được diễn đạt như yêu cầu JD, không suy thành nội dung vòng phỏng vấn.
- `nab`: giới hạn review 2026 ở Fullstack, dịch “professional” sang tiếng Việt và khẳng định rõ không đại diện cho Java.
- `gotymex`, `epam-vietnam`, `money-forward-vietnam`: quy trình được đối chiếu với trang nghề nghiệp chính thức; phân biệt rõ thông tin tuyển dụng, quy trình chung và trải nghiệm role riêng.
- `gft-technologies-vietnam`, `naver-vietnam`: cập nhật số đánh giá ITviec lần lượt thành 156/97% và 256/100% theo trang hiện hành.
- `rakuten-fintech-vietnam`: bỏ con số review/rating không còn được xác minh; làm rõ lĩnh vực sản phẩm thẻ tín dụng và giữ nhận định thận trọng về phỏng vấn.

Kiểm tra: `node --check js/data/companies.js`; `node scripts/validate.js` → OK.
