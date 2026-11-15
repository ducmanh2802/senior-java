# T2143 — Rà soát độ chính xác 15 câu mới nhất trong q-devops.js

Status: DONE
Notes: OK — không có lỗi (đã rà soát 15 câu cuối devops-155 tới devops-169).
Agent: kilo
Owns: `js/data/q-devops.js`
After: T2091

## Bối cảnh
Các câu devops mới do model free viết (đợt T20xx) chưa được kiểm tra chéo. Mảng: Docker/Kubernetes/CI-CD (probe, resource limits, rolling update, layered jar). Người học dùng để đi phỏng vấn thật → phải đúng.

## Việc cần làm
1. `node scripts/qtool.js list js/data/q-devops.js` → lấy **15 câu có id lớn nhất** của topic devops. Xem từng câu bằng `node scripts/qtool.js show js/data/q-devops.js <id>` (KHÔNG đọc cả file).
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
`node --check js/data/q-devops.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (không lỗi ghi "OK").

## Notes
