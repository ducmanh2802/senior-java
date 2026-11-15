# T2155 — Rà soát chất lượng 4 lab mới nhất trong labs-thread.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-thread.js`
After: T2086

## Bối cảnh
Nội dung mới do model free viết chưa được kiểm tra chéo. Giai đoạn này ưu tiên **chất lượng** hơn số lượng: người học (dev Java ~4 năm, hổng nền tảng) dùng để đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 lab mới nhất trong `js/data/labs-thread.js` (grep -n theo id, hoặc `node scripts/qtool.js` nếu hỗ trợ file này). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: artifact giống thật và tự nhất quán (định dạng jstack/GC log JDK 17+/EXPLAIN PostgreSQL đúng, timestamp, lock id, số liệu khớp nhau và khớp answer); answer trích đúng dòng trong artifact; cách sửa đúng kỹ thuật; rubric ≥ 3 ý đo được.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema của loại dữ liệu này; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/labs-thread.js`; `node scripts/build-light-index.js`; node scripts/validate.js → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (không lỗi ghi "OK").

## Notes
- lab-thread-001 | OK | Không lỗi.
- lab-thread-002 | OK | Không lỗi.
- lab-thread-003 | OK | Không lỗi.
- lab-thread-004 | OK | Không lỗi.
