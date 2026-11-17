# T2136 — Rà soát độ chính xác câu lõi trong q-microservices.js

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T2132

## Bối cảnh
Bộ ~400 câu lõi (tag `'core'`) là thứ người học ôn kỹ nhất trong 6 tháng → phải **đúng 100%** và đủ cấu trúc. Nhiều đáp án do model free viết, có thể sai chi tiết.

## Việc cần làm
1. `node scripts/qtool.js list js/data/q-microservices.js` → các câu có `'core'`. Xem từng câu bằng `node scripts/qtool.js show js/data/q-microservices.js <id>` (KHÔNG đọc cả file).
2. Với **tối đa 15 câu core** (ưu tiên câu chưa có ghi chú rà soát), kiểm tra:
   - **Sai kỹ thuật** so với Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, Kafka 3.x: API không tồn tại, flag/tham số bịa, số liệu mặc định sai (vd default pool size, timeout), mô tả cơ chế sai → **sửa đúng** (không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa).
   - **Thiếu cấu trúc** theo AGENTS.md mục 6: thiếu `**Tóm tắt:**` đầu đáp án, thiếu `### Trả lời mẫu khi phỏng vấn`, thiếu `> Senior tip:` → bổ sung ngắn gọn, đúng.
   - Code trong `~~~java` biên dịch được với Java 17 (tên method/class thật, import hợp lý).
3. Chỉ sửa chỗ sai/thiếu; giữ nguyên phần đúng. Không xoá câu, không đổi id.

## Luật
- Đọc AGENTS.md mục 4–6. Không backtick, không `${` trong template literal.
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung câu core. Đếm số câu trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-microservices.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (câu không có lỗi ghi "OK").

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| microservices-001 | OK | — |
| microservices-002 | OK | — |
| microservices-020 | OK | — |
| microservices-032 | OK | — |
| microservices-050 | OK | — |
| microservices-082 | OK | — |
| microservices-083 | OK | — |
| microservices-084 | OK | — |
| microservices-085 | OK | — |
| microservices-086 | OK | — |
| microservices-087 | OK | — |
| microservices-088 | OK | — |
| microservices-089 | OK | — |
| microservices-090 | OK | — |
| microservices-091 | OK | — |
| microservices-092 | OK | — |
