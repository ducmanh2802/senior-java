# T2141 — Rà soát độ chính xác 15 câu mới nhất trong q-banking.js

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`
After: T2075

## Bối cảnh
Các câu banking mới do model free viết (đợt T20xx) chưa được kiểm tra chéo. Mảng: nghiệp vụ ngân hàng (ledger, đối soát, chuyển tiền liên ngân hàng, ISO 8583/20022 ở mức khái niệm). Người học dùng để đi phỏng vấn thật → phải đúng.

## Việc cần làm
1. `node scripts/qtool.js list js/data/q-banking.js` → lấy **15 câu có id lớn nhất** của topic banking. Xem từng câu bằng `node scripts/qtool.js show js/data/q-banking.js <id>` (KHÔNG đọc cả file).
2. Mỗi câu kiểm tra:
   - **Sai kỹ thuật**: API/annotation/flag không tồn tại, giá trị mặc định sai, tên dịch vụ/tính năng AWS sai hoặc đã đổi, giới hạn/quota bịa, mô tả cơ chế sai → **sửa đúng**; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa.
   - **Trùng ý** với câu cũ hơn trong file → ghi vào Notes (không xoá).
   - **Thiếu cấu trúc** (AGENTS.md mục 6): **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip: → bổ sung ngắn, đúng.
   - Code java/yaml trong khối ~~~ hợp lệ (Java 17, YAML đúng thụt lề).
3. Chỉ sửa chỗ sai/thiếu, giữ phần đúng. Không xoá câu, không đổi id.

## Luật
- Đọc AGENTS.md mục 4–6 (bẫy backtick và ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung. Đếm số câu trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-banking.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (không lỗi ghi "OK").

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| banking-042 | OK | OK |
| banking-043 | OK | OK |
| banking-044 | OK | OK |
| banking-045 | OK | OK |
| banking-046 | OK | OK |
| banking-047 | OK | OK |
| banking-048 | OK | OK |
| banking-049 | OK | OK |
| banking-050 | OK | OK |
| banking-051 | OK | OK |
| banking-052 | OK | OK |
| banking-053 | OK | OK |
| banking-054 | OK | OK |
| banking-055 | OK | OK |
| banking-056 | OK | OK |
Reviewed-by: kilo (T2141R)
