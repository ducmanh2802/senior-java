# T2156 — Rà soát chất lượng 15 câu tình huống mới nhất (id lớn nhất) trong q-scenario.js

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T2092

## Bối cảnh
Nội dung mới do model free viết chưa được kiểm tra chéo. Giai đoạn này ưu tiên **chất lượng** hơn số lượng: người học (dev Java ~4 năm, hổng nền tảng) dùng để đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu tình huống mới nhất (id lớn nhất) trong `js/data/q-scenario.js` (grep -n theo id, hoặc `node scripts/qtool.js` nếu hỗ trợ file này). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: mỗi câu đi đúng trình tự triệu chứng → điều tra (lệnh/metric cụ thể, có thật) → khắc phục → phòng ngừa; số liệu nhất quán; có **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema của loại dữ liệu này; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-scenario.js`; `node scripts/build-light-index.js`; node scripts/validate.js → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (không lỗi ghi "OK").

## Notes
- Đã rà soát 15 câu mới nhất (145-159). Nội dung tuân thủ đúng định dạng và tiêu chuẩn chất lượng. OK.
