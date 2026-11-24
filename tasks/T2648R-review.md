# T2648R — Fact-check nội dung mới của T2648

Status: DONE
Agent: opencode
Owns: `js/data/labs-thread.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2648 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Reviewed nội dung mới của T2648 trong `js/data/labs-thread.js` (2 lab mới: `lab-thread-028`, `lab-thread-029`):

- `lab-thread-028` (parallelStream chiếm common pool): SỬA title — gốc viết "hàng trăm thread **BLOCKED** tại Socket.read" sai artifacts (jstack cho thread đọc socket là trạng thái **RUNNABLE**, artifacts ghi 15 worker common pool, không phải hàng trăm; hint #2 cũng nêu RUNNABLE). Title đã đổi thành mô tả khớp artifact. Phần còn lại (cơ chế common pool, số thread = CPU-1, managedBlock/awaitQuiescence, dẫn chứng artifact, cách sửa executor riêng + timeout + circuit breaker) đúng kỹ thuật, tự nhất quán, không backtick/`${` trong template literal.
- `lab-thread-029` (deadlock chuyển tiền 2 chiều): đúng kỹ thuật — scenario ↔ artifact ↔ answer nhất quán (T1 giữ 0x...2220=Account A chờ 0x...1110=B; T2 giữ B chờ A; JVM báo "Found one Java-level deadlock"), 4 điều kiện deadlock đúng, sửa bằng consistent lock ordering theo id đúng. Không cần sửa.

`node --check js/data/labs-thread.js`: OK. `node scripts/validate.js`: không báo lỗi nào trên `labs-thread.js`. Các LỖI còn lại của validate (lessons-collections.js, index-light.js, q-*.js, path.js) nằm trong file không thuộc quyền sở hữu của T2648R, không được sửa theo quy tắc 3 AGENTS.md.
