# T2468 — Viết lại tiếng Việt CÓ DẤU: collections-057, modern-069, modern-070, modern-071

Status: DONE

## Notes
- Đã thêm dấu tiếng Việt cho collections-057 (và sửa "Tom tat" -> "Tóm tắt" cho modern-069/070/071).
- validate.js còn lỗi tiền tồn tại ở lessons-spring.js (không thuộc phạm vi task này).
Agent: kilo
Owns: `js/data/q-java.js`
After: T2418

Các mục sau trong `js/data/q-java.js` đang viết tiếng Việt **KHÔNG DẤU** ("Tom tat", "khong", "nguyen nhan"…), người học đọc rất khó: **collections-057, modern-069, modern-070, modern-071**.

Với TỪNG mục: xem bằng `node scripts/qtool.js show js/data/q-java.js <id>`, rồi sửa NGAY TẠI CHỖ mọi chuỗi tiếng Việt (q, a, follow, title, body, prompt, explain, hints, scenario, answer, rubric, check…) thành **tiếng Việt có dấu chuẩn** ("**Tóm tắt:**", "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", "> Senior tip:"). Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh, nội dung kỹ thuật (chỉ sửa lỗi kỹ thuật nếu chắc chắn sai). KHÔNG sửa mục khác, KHÔNG đổi code/test trong bài học.

## Luật
AGENTS.md. Được phép SỬA các mục liệt kê ở trên (ngoại lệ của luật chỉ thêm). Không backtick, không ký hiệu đô-la + ngoặc nhọn. Số mục trong file trước/sau phải bằng nhau. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/q-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → OK. Kiểm tra lại: `grep -c "Tom tat" js/data/q-java.js` không còn tăng do các mục trên. Status: DONE + Notes liệt kê id đã sửa.

## Notes
Reviewed-by: kilo (T2468R)
