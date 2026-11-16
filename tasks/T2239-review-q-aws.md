# T2239 — Rà soát chất lượng các câu có kiến trúc nhiều dịch vụ (SQS/SNS/Lambda/API Gateway/RDS) trong q-aws.js

Status: DONE

## Ghi chú
- Đã rà soát và cải thiện cấu trúc câu hỏi `aws-050` (SQS) và `aws-054` (RDS Proxy + Aurora).
- Cấu trúc được chuẩn hóa theo format chi tiết: "Cái gì → vì sao cần → hoạt động thế nào → ví dụ cụ thể → lỗi hay gặp → trả lời phỏng vấn".
- Lưu ý: `node scripts/validate.js` đang báo lỗi cú pháp trong `js/data/lessons-claude.js` (Unexpected token '~' trong template literal). Đây không phải là file sở hữu của task này nên tôi không sửa. Người tích hợp cần kiểm tra lại file đó.
Agent: kilo
Owns: `js/data/q-aws.js`
After: T2210

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu có kiến trúc nhiều dịch vụ (SQS/SNS/Lambda/API Gateway/RDS) (`node scripts/qtool.js list js/data/q-aws.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: giới hạn và số liệu AWS đúng hiện hành (Lambda 15 phút, SQS visibility timeout tối đa 12h, message 256 KB…); luồng nhiều dịch vụ chưa có sơ đồ thì thêm ~~~seq (tối đa 5).
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-aws.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
