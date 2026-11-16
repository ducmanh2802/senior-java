# T2211 — Rà soát chất lượng 15 câu id NHỎ nhất trong q-banking.js

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`
After: T2141

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu id NHỎ nhất (`node scripts/qtool.js list js/data/q-banking.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật hiện hành (Java 17/21, Spring Boot 3, AWS/K8s 2026); không bịa API/flag/giá/giới hạn; đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:; Notes ghi câu trùng ý.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-banking.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| banking-001 | Sai chữ "đối sàng" | Sửa thành "đối soát" |
| banking-002 | Sai chữ "duy tiên" | Sửa thành "duy nhất" |
| banking-003 | Sai chữ "lại lại" | Sửa thành "dò lại" |
| banking-005 | Thiếu dấu: "mat", "ben", "so tien", "Ngay le/gio bao tri..." | Sửa thành "mất", "bên", "số tiền", "Ngày lễ/giờ bảo trì: hệ thống ngừng, giao dịch bị trễ, đến ngày mới thì khớp." |
| banking-013 | Sai chữ "The quet" trong title sơ đồ sequence | Sửa thành "Thẻ quẹt" |

Tóm tắt kiểm tra 15 câu (banking-001 → banking-015):
- Tất cả 15 câu đủ các mục bắt buộc: **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:.
- Nội dung đúng kỹ thuật hiện hành (Java 17, BigDecimal, ISO 8583/20022, PCI DSS, NAPAS, VietQR…), không bịa API/flag/giới hạn.
- Không trùng ý với nhau trong 15 câu; không xoá mục, không đổi id.
- Số mục trước/sau sửa bằng nhau (chỉ sửa chữ sai, không thêm/bớt phần).
Reviewed-by: verify-only (review task)
