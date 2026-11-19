# T2465 — Viết lại tiếng Việt CÓ DẤU: ai-102

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`
After: T2464

Các mục sau trong `js/data/q-ai.js` đang viết tiếng Việt **KHÔNG DẤU** ("Tom tat", "khong", "nguyen nhan"…), người học đọc rất khó: **ai-102**.

Với TỪNG mục: xem bằng `node scripts/qtool.js show js/data/q-ai.js <id>`, rồi sửa NGAY TẠI CHỖ mọi chuỗi tiếng Việt (q, a, follow, title, body, prompt, explain, hints, scenario, answer, rubric, check…) thành **tiếng Việt có dấu chuẩn** ("**Tóm tắt:**", "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", "> Senior tip:"). Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh, nội dung kỹ thuật (chỉ sửa lỗi kỹ thuật nếu chắc chắn sai). KHÔNG sửa mục khác, KHÔNG đổi code/test trong bài học.

## Luật
AGENTS.md. Được phép SỬA các mục liệt kê ở trên (ngoại lệ của luật chỉ thêm). Không backtick, không ký hiệu đô-la + ngoặc nhọn. Số mục trong file trước/sau phải bằng nhau. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/q-ai.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → OK. Kiểm tra lại: `grep -c "Tom tat" js/data/q-ai.js` không còn tăng do các mục trên. Status: DONE + Notes liệt kê id đã sửa.

## Notes
- Đã sửa **ai-102**: chuyển toàn bộ tiếng Việt không dấu sang có dấu chuẩn (q, a, follow). Các từ như "Luat" → "Luật", "yeu cau" → "yêu cầu", "luu nhat ky" → "lưu nhật ký", "phan hoi" → "phản hồi", "nguoi duoc" → "người dùng", "thoi gian luu giu" → "thời gian lưu giữ", "he thong" → "hệ thống", "vector store va cache" → "vector store và cache", "ban do luu tru" → "bản đồ lưu trữ", "kiem tra" → "kiểm tra", "khu du lieu hoang" → "khu dữ liệu hoang", "loi hay gap" → "lỗi hay gặp", "vi du doi thuc" → "ví dụ đời thực", "tra loi mau" → "trả lời mẫu", "khi ho yeu cau" → "khi họ yêu cầu", "noi nao" → "nơi nào", "bao nhieu ngay" → "bao nhiêu ngày", "xoa tu dong" → "xoá tự động", "kiem chung" → "kiểm chứng", "da xoa het" → "đã xoá hết".
Reviewed-by: kilo (T2465R)
