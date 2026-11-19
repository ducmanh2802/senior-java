# T2473 — Viết lại tiếng Việt CÓ DẤU: microservices-086, microservices-087

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T2472

Các mục sau trong `js/data/q-microservices.js` đang viết tiếng Việt **KHÔNG DẤU** ("Tom tat", "khong", "nguyen nhan"…), người học đọc rất khó: **microservices-086, microservices-087**.

Với TỪNG mục: xem bằng `node scripts/qtool.js show js/data/q-microservices.js <id>`, rồi sửa NGAY TẠI CHỖ mọi chuỗi tiếng Việt (q, a, follow, title, body, prompt, explain, hints, scenario, answer, rubric, check…) thành **tiếng Việt có dấu chuẩn** ("**Tóm tắt:**", "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", "> Senior tip:"). Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh, nội dung kỹ thuật (chỉ sửa lỗi kỹ thuật nếu chắc chắn sai). KHÔNG sửa mục khác, KHÔNG đổi code/test trong bài học.

## Luật
AGENTS.md. Được phép SỬA các mục liệt kê ở trên (ngoại lệ của luật chỉ thêm). Không backtick, không ký hiệu đô-la + ngoặc nhọn. Số mục trong file trước/sau phải bằng nhau. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/q-microservices.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → OK. Kiểm tra lại: `grep -c "Tom tat" js/data/q-microservices.js` không còn tăng do các mục trên. Status: DONE + Notes liệt kê id đã sửa.

## Notes
- Fixed microservices-086: Added Vietnamese diacritics to all Vietnamese text (q, a, follow)
- Fixed microservices-087: Added Vietnamese diacritics to all Vietnamese text (q, a, follow)
- All validation checks passed: node --check, build-light-index.js, validate.js
- grep -c "Tom tat" returns 0 (no more undiacriticized Vietnamese)
Reviewed-by: kilo (T2473R)
