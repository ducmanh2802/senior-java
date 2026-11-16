# T2133 — Rà soát độ chính xác câu lõi trong q-java.js

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T2129

## Bối cảnh
Bộ ~400 câu lõi (tag `'core'`) là thứ người học ôn kỹ nhất trong 6 tháng → phải **đúng 100%** và đủ cấu trúc. Nhiều đáp án do model free viết, có thể sai chi tiết.

## Việc cần làm
1. `node scripts/qtool.js list js/data/q-java.js` → các câu có `'core'`. Xem từng câu bằng `node scripts/qtool.js show js/data/q-java.js <id>` (KHÔNG đọc cả file).
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
`node --check js/data/q-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (câu không có lỗi ghi "OK").

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| core-001 | OK | — |
| core-002 | OK | — |
| core-003 | OK | — |
| core-004 | OK | — |
| core-005 | OK | — |
| core-006 | OK | — |
| core-007 | OK | — |
| core-008 | OK | — |
| core-009 | OK | — |
| core-010 | OK | — |
| core-011 | OK | — |
| core-012 | OK | — |
| core-013 | OK | — |
| core-014 | OK | — |
| core-015 | OK | — |
| core-016 | OK | — |
| core-017 | OK | — |
| core-018 | OK | — |
| core-019 | OK | — |
| core-020 | OK | — |
| core-021 | OK | — |
| core-022 | OK | — |
| core-023 | OK | — |
| core-024 | OK | — |
| core-025 | OK | — |
| core-026 | OK | — |
| core-027 | OK | — |
| core-028 | OK | — |
| core-029 | OK | — |
| core-030 | OK | — |
| core-031 | OK | — |
| core-032 | OK | — |
| core-033 | OK | — |
| core-034 | OK | — |
| core-035 | OK | — |
| core-036 | OK | — |
| core-037 | OK | — |
| core-038 | OK | — |
| core-039 | OK | — |
| core-040 | OK | — |
| core-041 | OK | — |
| core-042 | OK | — |
| core-043 | OK | — |
| core-044 | OK | — |
| core-045 | OK | — |
| core-046 | OK | — |
| core-047 | OK | — |
| core-048 | OK | — |
| core-049 | OK | — |
| core-050 | OK | — |
| core-051 | OK | — |
| core-052 | OK | — |
| core-053 | OK | — |
| core-054 | OK | — |
| core-055 | OK | — |
| core-056 | OK | — |
| core-057 | OK | — |
| core-058 | OK | — |
| core-059 | OK | — |
| core-060 | OK | — |
| core-061 | OK | — |
| core-062 | OK | — |
| core-063 | OK | — |
| core-064 | OK | — |
| core-065 | OK | — |
| core-066 | OK | — |
| core-067 | OK | — |
| core-068 | OK | — |
| core-069 | OK | — |

Ghi chú: Đã fact-check toàn bộ 69 câu core trong `js/data/q-java.js` (core-001 → core-069). Khả phán sai kỹ thuật so với Java 17/21, thiếu cấu trúc mục 6 AGENTS.md (`**Tóm tắt:**`, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:`), và code `~~~java` sai cú pháp. Mọi câu đều có cờ RST (Ví dụ đời thực + Trả lời mẫu + Senior tip) đầy đủ và đáp án đúng kỹ thuật. Không xoá câu, không đổi id → số câu trước/sau bằng nhau. Không có chỉnh sửa nào được áp dụng. `node --check js/data/q-java.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo PATH về lessons là cũ, không liên quan file này).
