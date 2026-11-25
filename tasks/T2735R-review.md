# T2735R — Fact-check nội dung mới của T2735

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2735 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Lỗi kỹ thuật đã sửa trong js/data/q-soft.js (theo từng id):
- testing-079: thiếu ký tự đóng backtick + dấu phẩy sau template literal `a:` (dòng 10824) → gây lỗi cú pháp "Unexpected identifier 'tắt'" rồi "follow". Đã bổ sung backtick và dấu phẩy `,` để đóng `a:` đúng cách.
- testing-077.a (dòng 10635): `${UUID}` trong template literal được JS nội suy như biến không định nghĩa → lỗi runtime "UUID is not defined". Đã viết lại thành inline code không chứa `${}`/{}: {{order.created-<uuid duy nhất>}}.
- testing-080.a: dùng backtick thô \`X\` làm mã nội dòng ở nhiều chỗ (dòng 10841, 10842, 10859, 10861, 10876, 10898) — phải dùng markup {{X}}; có ký tự Trung "勝过" (dòng 10901) → viết lại "hệ thống quan trọng hơn cá nhân".

validate.js trên q-soft.js: 0 lỗi (còn 3 cảnh báo đáp án ngắn testing-082/083/084 <1500 ký tự — không chỉnh độ dài theo chỉ dẫn). Đã cố chạy node scripts/build-light-index.js để cập nhật js/data/index-light.js nhưng script bị crash do lỗi cú pháp trước đó trong q-aws.js (file không thuộc quyền sở hữu task này, không sửa theo AGENTS.md §3), nên index-light.js chưa tái sinh.

Các lỗi còn lại của validate.js nằm trong file KHÔNG sở hữu (quiz-ops.js, lessons-modern.js, lessons-jpa.js, q-concurrency-jvm.js, q-spring-data.js, q-aws.js) — không sửa theo AGENTS.md §3.
