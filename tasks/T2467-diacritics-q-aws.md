# T2467 — Viết lại tiếng Việt CÓ DẤU: aws-070, aws-071, aws-072, aws-073

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`
After: T2466

Các mục sau trong `js/data/q-aws.js` đang viết tiếng Việt **KHÔNG DẤU** ("Tom tat", "khong", "nguyen nhan"…), người học đọc rất khó: **aws-070, aws-071, aws-072, aws-073**.

Với TỪNG mục: xem bằng `node scripts/qtool.js show js/data/q-aws.js <id>`, rồi sửa NGAY TẠI CHỖ mọi chuỗi tiếng Việt (q, a, follow, title, body, prompt, explain, hints, scenario, answer, rubric, check…) thành **tiếng Việt có dấu chuẩn** ("**Tóm tắt:**", "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", "> Senior tip:"). Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh, nội dung kỹ thuật (chỉ sửa lỗi kỹ thuật nếu chắc chắn sai). KHÔNG sửa mục khác, KHÔNG đổi code/test trong bài học.

## Luật
AGENTS.md. Được phép SỬA các mục liệt kê ở trên (ngoại lệ của luật chỉ thêm). Không backtick, không ký hiệu đô-la + ngoặc nhọn. Số mục trong file trước/sau phải bằng nhau. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/q-aws.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → OK. Kiểm tra lại: `grep -c "Tom tat" js/data/q-aws.js` không còn tăng do các mục trên. Status: DONE + Notes liệt kê id đã sửa.

## Notes
Đã sửa tiếng Việt có dấu cho 4 câu hỏi: aws-070, aws-071, aws-072, aws-073. Tất cả các trường q, a (Tóm tắt, Hiểu nhanh, Thuật ngữ, Cơ chế từng bước, Code, Giới hạn, Lỗi hay gặp, Ví dụ đời thực, Trả lời mẫu khi phỏng vấn, Senior tip), follow đều đã được chuyển sang tiếng Việt có dấu chuẩn. Không có thay đổi về cấu trúc, id, code Java, hay thuật ngữ tiếng Anh. Validation OK.
Reviewed-by: kilo (T2467R)
