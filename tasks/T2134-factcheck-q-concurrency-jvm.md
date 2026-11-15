# T2134 — Rà soát độ chính xác câu lõi trong q-concurrency-jvm.js

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T2130

## Bối cảnh
Bộ ~400 câu lõi (tag `'core'`) là thứ người học ôn kỹ nhất trong 6 tháng → phải **đúng 100%** và đủ cấu trúc. Nhiều đáp án do model free viết, có thể sai chi tiết.

## Việc cần làm
1. `node scripts/qtool.js list js/data/q-concurrency-jvm.js` → các câu có `'core'`. Xem từng câu bằng `node scripts/qtool.js show js/data/q-concurrency-jvm.js <id>` (KHÔNG đọc cả file).
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
`node --check js/data/q-concurrency-jvm.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (câu không có lỗi ghi "OK").

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| concurrency-001 | OK | — |
| concurrency-002 | OK | — |
| concurrency-003 | OK | — |
| concurrency-004 | OK | — |
| concurrency-005 | OK | — |
| concurrency-006 | OK | — |
| concurrency-007 | OK | — |
| concurrency-010 | OK | — |
| concurrency-012 | OK | — |
| concurrency-032 | OK | — |
| concurrency-033 | OK | — |
| concurrency-038 | OK | — |
| concurrency-045 | OK | — |
| concurrency-046 | OK | — |
| jvm-032 | OK | — |

Kết quả: rà soát 15 câu core trong `js/data/q-concurrency-jvm.js`. Không tìm thấy sai kỹ thuật, thiếu cấu trúc (`**Tóm tắt:**`, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:`), hay code `~~~java` lỗi cú pháp. Không sửa nội dung file dữ liệu. Chạy `node --check js/data/q-concurrency-jvm.js` OK, `node scripts/build-light-index.js` OK, `node scripts/validate.js` → `OK — không có lỗi.`
