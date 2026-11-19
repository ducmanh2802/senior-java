# T2469 — Viết lại tiếng Việt CÓ DẤU: modern-072, modern-073, core-070, core-071

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T2468

Các mục sau trong `js/data/q-java.js` đang viết tiếng Việt **KHÔNG DẤU** ("Tom tat", "khong", "nguyen nhan"…), người học đọc rất khó: **modern-072, modern-073, core-070, core-071**.

Với TỪNG mục: xem bằng `node scripts/qtool.js show js/data/q-java.js <id>`, rồi sửa NGAY TẠI CHỖ mọi chuỗi tiếng Việt (q, a, follow, title, body, prompt, explain, hints, scenario, answer, rubric, check…) thành **tiếng Việt có dấu chuẩn** ("**Tóm tắt:**", "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", "> Senior tip:"). Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh, nội dung kỹ thuật (chỉ sửa lỗi kỹ thuật nếu chắc chắn sai). KHÔNG sửa mục khác, KHÔNG đổi code/test trong bài học.

## Luật
AGENTS.md. Được phép SỬA các mục liệt kê ở trên (ngoại lệ của luật chỉ thêm). Không backtick, không ký hiệu đô-la + ngoặc nhọn. Số mục trong file trước/sau phải bằng nhau. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/q-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → OK. Kiểm tra lại: `grep -c "Tom tat" js/data/q-java.js` không còn tăng do các mục trên. Status: DONE + Notes liệt kê id đã sửa.

## Notes
Đã sửa 4 câu hỏi: modern-072, modern-073, core-070, core-071. Tất cả chuỗi tiếng Việt trong q, a, follow đã được chuyển sang có dấu chuẩn (ví dụ: "Tom tat" → "**Tóm tắt:**", "khong" → "không", "nguyen nhan" → "nguyên nhân", "cai gi" → "cái gì", "vi sao" → "vì sao", "hoat dong" → "hoạt động", "chi" → "chỉ", "tinh nang" → "tính năng", "on dinh" → "ổn định", "ung vien" → "ứng viên", "nguoi hoi" → "người hỏi", "buoi phong van" → "buổi phỏng vấn", "noi suy" → "nội suy", "cong viec co cau truc" → "công việc có cấu trúc", "hieu sai" → "hiểu sai", "trang thai" → "trạng thái", "lam tron" → "làm tròn", "ngan hang" → "ngân hàng", "tien te" → "tiền tệ", "thue" → "thuế", "giam gia" → "giảm giá", "chia tien" → "chia tiền", "tai khoan" → "tài khoản", "bat bien" → "bất biến", "an toan luong" → "an toàn luồng", "sao chep ve phong thu" → "sao chép vệ phòng thủ", v.v.). Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh, và nội dung kỹ thuật. Số lượng câu hỏi trong file không thay đổi (208 câu). Validation pass.
Reviewed-by: kilo (T2469R)
