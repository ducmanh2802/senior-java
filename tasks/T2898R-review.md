# T2898R — Fact-check nội dung mới của T2898

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2898 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa (chỉ nội dung mới của T2898 trong js/data/q-soft.js):
- testing-089: sửa bảng phân tầng test — dòng REST client ngân hàng gán nhãn "Slice" kèm {{@SpringBootTest}} là sai cơ chế (@SpringBootTest nạp toàn bộ context, không phải slice); đổi cột loại thành "Full context" và chú thích thành "WireMock + {{@SpringBootTest}}".
- testing-091: xóa ref `https://martinfowler.com/articles/mutationTesting.html` — URL không tồn tại (trang mutation testing thực của Martin Fowler là bliki/MutationTesting.html và tự đánh dấu "đừng chia sẻ link"); giữ lại ref pitest.org.
- testing-091: xóa cờ PIT bịa `<scmMutateOnlyChanged>true</scmMutateOnlyChanged>` trong ví dụ Maven (PIT không có cờ này; tăng thể thực hiện qua withHistory/history files) và xóa bullet giải thích cờ đó.
Không có lỗi kiến thức còn lại trong nội dung mới. node scripts/validate.js → không lỗi liên quan q-soft.js (các LỖI còn lại của lessons-api.js là nội dung cũ, không thuộc sở hữu task này, không sửa).
