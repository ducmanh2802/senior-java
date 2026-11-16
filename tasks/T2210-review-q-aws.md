# T2210 — Rà soát chất lượng 15 câu id NHỎ nhất (câu cũ chưa rà soát) trong q-aws.js

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`
After: T2142

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu id NHỎ nhất (câu cũ chưa rà soát) (`node scripts/qtool.js list js/data/q-aws.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật hiện hành (Java 17/21, Spring Boot 3, AWS/K8s 2026); không bịa API/flag/giá/giới hạn; đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:; Notes ghi câu trùng ý.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-aws.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | Lỗi tìm thấy | Đã sửa gì |
|---|---|---|
| aws-007 | Bịa giới hạn object S3 là 50 TB (cuối 2025); thực tế là 5 TB | Xoá chi tiết bịa, giữ "giới hạn một object 5 TB"; đổi heading "### Trả lời miệng 1 phút" → "### Trả lời mẫu khi phỏng vấn" |
| aws-008 | Heading đáp án chưa theo tiêu chuẩn | Đổi heading "### Trả lời miệng 1 phút" → "### Trả lời mẫu khi phỏng vấn" (số mục không đổi) |
| aws-009 | Heading chưa theo tiêu chuẩn | Tương tự aws-008 |
| aws-010 | Bịa "server.shutdown=graceful mặc định từ Boot 3.4"; đúng là phải khai báo (từ Spring Boot 2.3) | Sửa thành "phải khai báo, có từ Spring Boot 2.3"; đổi heading |
| aws-011 | Heading chưa theo tiêu chuẩn | Đổi heading |
| aws-012 | Heading chưa theo tiêu chuẩn | Đổi heading |
| aws-019 | Heading chưa theo tiêu chuẩn | Đổi heading |
| aws-025 | Heading chưa theo tiêu chuẩn | Đổi heading |
| aws-026 | Heading chưa theo tiêu chuẩn | Đổi heading |
| aws-027 | Heading chưa theo tiêu chuẩn | Đổi heading |
| aws-028 | Heading chưa theo tiêu chuẩn | Đổi heading |
| aws-029 | Heading chưa theo tiêu chuẩn | Đổi heading |
| aws-030 | Heading chưa theo tiêu chuẩn | Đổi heading |
| aws-039 | Đủ mục và nội dung chính xác (landing zone, Control Tower, SCP, AFT) | Không sửa |
| aws-062 | Đủ mục và nội dung chính xác (JVM container, MaxRAMPercentage, HikariCP theo vCPU) | Không sửa |

Tổng: rà soát 15 câu id nhỏ nhất chưa rà soát (aws-007…012, aws-019, aws-025…030, aws-039, aws-062). Tất cả đã đủ **Tóm tắt:**, **### Trả lời mẫu khi phỏng vấn**, **> Senior tip:**; số mục trong `a` giữ nguyên trước/sau. `node --check`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK.
Reviewed-by: verify-only (review task)
