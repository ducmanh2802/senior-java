# T2194 — Rà soát chất lượng 15 câu KHÔNG có tag core, id lớn nhất trong q-java.js

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T2133

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu KHÔNG có tag core, id lớn nhất (`node scripts/qtool.js list js/data/q-java.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật Java 17/21, Spring Boot 3, Hibernate 6, PostgreSQL 15+, Kafka 3.x; không bịa API/flag/giá trị mặc định; câu không có tag core cũng phải đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:; ghi vào Notes nếu trùng ý câu khác.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
- Đã rà soát 15 câu KHÔNG có tag `core`, id lớn nhất (theo số thứ tự id, tiebreak chuỗi id giảm dần): `modern-068, modern-066, modern-063, modern-062, modern-061, modern-060, modern-059, modern-057, modern-056, collections-056, modern-055, collections-055, modern-054, collections-054, modern-053`.
- Kiểm tra: đúng kỹ thuật Java 17/21/Spring Boot 3.x (virtual threads, sealed/record/switch pattern, sequenced collections, text block, preview/string templates); không thấy API/flag bịa; không có backtick hay `${`; đủ `**Tóm tắt:**`, `### Ví dụ đời thực`/ví dụ production, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:` và `follow`.
- `js/data/q-java.js` giữ nguyên 192 câu (trước/sau bằng nhau). Không phát hiện trùng ý rõ với các câu cùng nhóm trong tập đã kiểm tra.

| id | Lỗi tìm thấy | Đã sửa gì |
|---|---|---|
| modern-068 | Không phát hiện lỗi kỹ thuật/markup/schema | Không sửa (giữ nguyên) |
| modern-066 | Không phát hiện lỗi kỹ thuật/markup/schema | Không sửa (giữ nguyên) |
| modern-063 | Không phát hiện lỗi kỹ thuật/markup/schema | Không sửa (giữ nguyên) |
| modern-062 | Không phát hiện lỗi kỹ thuật/markup/schema | Không sửa (giữ nguyên) |
| modern-061 | Không phát hiện lỗi kỹ thuật/markup/schema | Không sửa (giữ nguyên) |
| modern-060 | Không phát hiện lỗi kỹ thuật/markup/schema | Không sửa (giữ nguyên) |
| modern-059 | Không phát hiện lỗi kỹ thuật/markup/schema | Không sửa (giữ nguyên) |
| modern-057 | Không phát hiện lỗi kỹ thuật/markup/schema | Không sửa (giữ nguyên) |
| modern-056 | Không phát hiện lỗi kỹ thuật/markup/schema | Không sửa (giữ nguyên) |
| collections-056 | Không phát hiện lỗi kỹ thuật/markup/schema | Không sửa (giữ nguyên) |
| modern-055 | Không phát hiện lỗi kỹ thuật/markup/schema | Không sửa (giữ nguyên) |
| collections-055 | Không phát hiện lỗi kỹ thuật/markup/schema | Không sửa (giữ nguyên) |
| modern-054 | Không phát hiện lỗi kỹ thuật/markup/schema | Không sửa (giữ nguyên) |
| collections-054 | Không phát hiện lỗi kỹ thuật/markup/schema | Không sửa (giữ nguyên) |
| modern-053 | Không phát hiện lỗi kỹ thuật/markup/schema | Không sửa (giữ nguyên) |

- Nghiệm thu: `node --check js/data/q-java.js` OK, `node scripts/build-light-index.js` OK, `node scripts/validate.js` → `OK — không có lỗi.` (chỉ cảnh báo PATH không liên quan).
