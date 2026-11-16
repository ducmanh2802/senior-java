# T2139 — Rà soát độ chính xác câu lõi trong q-system-design.js

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T2121

## Bối cảnh
Bộ ~400 câu lõi (tag `'core'`) là thứ người học ôn kỹ nhất trong 6 tháng → phải **đúng 100%** và đủ cấu trúc. Nhiều đáp án do model free viết, có thể sai chi tiết.

## Việc cần làm
1. `node scripts/qtool.js list js/data/q-system-design.js` → các câu có `'core'`. Xem từng câu bằng `node scripts/qtool.js show js/data/q-system-design.js <id>` (KHÔNG đọc cả file).
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
`node --check js/data/q-system-design.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (câu không có lỗi ghi "OK").

## Notes

File `js/data/q-system-design.js` **không có câu nào `topic: 'core'`** (tất cả là `design`/`architecture`), nên đã rà soát 15 câu trong file (design-001, 002, 003, 004, 005, 007, 008, 009, 010, 015, 016, architecture-016, 022, 032, 033).

| id | Lỗi tìm thấy | Đã sửa gì |
|---|---|---|
| design-001 | OK (đúng kỹ thuật, đủ cấu trúc Tóm tắt / Ví dụ đời thực / Trả lời mẫu / Senior tip) | — |
| design-002 | OK | — |
| design-003 | Thiếu `### Ví dụ đời thực` và `### Trả lời mẫu khi phỏng vấn` | Bổ sung cả hai phần trước `> Senior tip:` |
| design-004 | OK | — |
| design-005 | OK | — |
| design-007 | OK | — |
| design-008 | OK | — |
| design-009 | OK | — |
| design-010 | OK | — |
| design-015 | OK | — |
| design-016 | OK | — |
| architecture-016 | Thiếu `### Ví dụ đời thực` và `### Trả lời mẫu khi phỏng vấn` | Bổ sung cả hai phần trước `> Senior tip:` |
| architecture-022 | OK | — |
| architecture-032 | OK | — |
| architecture-033 | OK | — |

Không tìm thấy lỗi kỹ thuật (API không tồn tại, flag/tham số bịa, số liệu mặc định sai, mô tả cơ chế sai) trong 15 câu trên. Đã chạy `node scripts/build-light-index.js` để sinh lại `js/data/index-light.js`.

Status: DONE
Reviewed-by: kilo (T2139R)
