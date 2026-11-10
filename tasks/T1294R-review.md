# T1294R — Fact-check nội dung mới của T1294

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1294 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã fact-check các mục MỚI (### Ví dụ đời thực + ### Trả lời mẫu khi phỏng vấn) của microservices-019/020/021 trong git diff HEAD. Lỗi đã sửa:
- microservices-019 (~line 1732): "poll() trả về batch rỗng liên tục" không nhất quán với "3 partition hot quá tải" → rõ ràng 3 consumer partition hot xử lý chồng chất, 9 consumer partition lạnh poll batch rỗng; CPU 15% là trung bình cả 12 pod.
- microservices-020 (~line 1824): attempts=4 là tổng số lần attempt (1 initial + 3 retry) → đổi "lỗi hợp lý bị retry 4 lần rồi mới vào DLT" thành "thử hết 4 lần rồi mới vào DLT".
- microservices-021 (~line 1909): ví dụ Schema Registry claims old consumer crash "Unknown union branch discountStrategy" khi thêm field string có default — kỹ thuật sai (BACKWARD old reader dùng default, không crash); cả chữ "type/ten" trong answer mẫu viết lące vào code block enum → đổi field thành enum {"NONE","PERCENT"} + bổ sung "LOYALTY", lỗi thành "Unknown enum symbol LOYALTY", nhấn mạnh BACKWARD không bảo vệ consumer cũ đọc data mới (đó là FORWARD), phải rollout consumer xong trước khi producer ghi schema mới.
Lỗi còn lại trong validate.js (lessons-testing-005.body nested {{}}; path.js lesson-design-006/007 không trong PATH) KHÔNG thuộc file này, không sửa.
Da chay node scripts/build-light-index.js (sinh lai index-light) truoc validate.
