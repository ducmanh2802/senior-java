# T1442R — Fact-check nội dung mới của T1442

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1442 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- api-011: xoá claim bịa module Jackson `jackson-dataformat-json-patch` (không tồn tại trên Maven Central, không có class `com.fasterxml.jackson.dataformat.jsonpatch.JsonPatch`) — sửa lại về hai thư viện thực tế: `com.github.java-json-tools:json-patch` và `com.flipkart.zjsonpatch:zjsonpatch`.
- api-005: câu trả lời mẫu dùng "based on" → viết lại bằng tiếng Việt ("dựa trên trách nhiệm", "tùy ngẫu nhiên").
- api-008: câu trả lời mẫu dùng "fixes" → viết lại bằng tiếng Việt ("đã khắc phục ngay lập tức").
- Các block "Ví dụ đời thực"/"Trả lời mẫu khi phỏng vấn" mới thêm ở api-005..api-010 và sửa @Validated/validation ở api-006, api-011 đã kiểm tra kỹ thuật: đúng Spring Boot 3.x, Java 17/21, không lỗi markup, không chạm nội dung đã có ở HEAD. Không chỉnh văn phong/độ dài/bố cục.
