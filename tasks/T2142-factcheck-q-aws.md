# T2142 — Rà soát độ chính xác 15 câu mới nhất trong q-aws.js

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`
After: T2076

## Bối cảnh
Các câu aws mới do model free viết (đợt T20xx) chưa được kiểm tra chéo. Mảng: AWS (ECS/EKS, SQS/Kinesis/MSK, DynamoDB, Lambda SnapStart, IAM/IRSA, giá dịch vụ). Người học dùng để đi phỏng vấn thật → phải đúng.

## Việc cần làm
1. `node scripts/qtool.js list js/data/q-aws.js` → lấy **15 câu có id lớn nhất** của topic aws. Xem từng câu bằng `node scripts/qtool.js show js/data/q-aws.js <id>` (KHÔNG đọc cả file).
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
`node --check js/data/q-aws.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (không lỗi ghi "OK").

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| aws-059 | OK | OK |
| aws-060 | OK | OK |
| aws-061 | OK | OK |
| aws-062 | Code block dùng `~~~java` nhưng nội dung là shell command (ENTRYPOINT…), không phải Java | Đổi thành `~~~bash` và giải thích đây là Dockerfile / task definition command |
| aws-063 | OK | OK |
| aws-064 | OK | OK |
| aws-065 | OK | OK |
| aws-066 | OK | OK |
| aws-067 | OK | OK |
| aws-068 | OK | OK |
| aws-069 | OK | OK |
| aws-070 | OK | OK |
| aws-071 | Thuật ngữ "VPC ENI: the mang ao gắn…" sai chính tả và mô tả cơ chế cũ (ENI truyền thống); hiện Lambda dùng hyperplane ENI | Sửa lại thuật ngữ thành "VPC" với mô tả đúng: mỗi môi trường mới tạo kết nối mạng (trước là ENI, nay là hyperplane ENI), thêm ghi chú giữ Lambda ngoài VPC nếu không cần tài nguyên trong VPC |
| aws-072 | OK | OK |
| aws-073 | OK | OK |

Số câu trước = 73, sau = 73 (không thêm, không xoá).
Reviewed-by: kilo (T2142R)
