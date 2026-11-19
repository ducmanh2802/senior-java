# T2464 — Viết lại tiếng Việt CÓ DẤU: ai-097, ai-098, ai-099, ai-100

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`
After: T2454

Các mục sau trong `js/data/q-ai.js` đang viết tiếng Việt **KHÔNG DẤU** ("Tom tat", "khong", "nguyen nhan"…), người học đọc rất khó: **ai-097, ai-098, ai-099, ai-100**.

Với TỪNG mục: xem bằng `node scripts/qtool.js show js/data/q-ai.js <id>`, rồi sửa NGAY TẠI CHỖ mọi chuỗi tiếng Việt (q, a, follow, title, body, prompt, explain, hints, scenario, answer, rubric, check…) thành **tiếng Việt có dấu chuẩn** ("**Tóm tắt:**", "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", "> Senior tip:"). Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh, nội dung kỹ thuật (chỉ sửa lỗi kỹ thuật nếu chắc chắn sai). KHÔNG sửa mục khác, KHÔNG đổi code/test trong bài học.

## Luật
AGENTS.md. Được phép SỬA các mục liệt kê ở trên (ngoại lệ của luật chỉ thêm). Không backtick, không ký hiệu đô-la + ngoặc nhọn. Số mục trong file trước/sau phải bằng nhau. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/q-ai.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → OK. Kiểm tra lại: `grep -c "Tom tat" js/data/q-ai.js` không còn tăng do các mục trên. Status: DONE + Notes liệt kê id đã sửa.

## Notes

Đã thêm dấu tiếng Việt chuẩn cho q, a, follow của 4 mục ai-097, ai-098, ai-099, ai-100 trong js/data/q-ai.js; giữ nguyên id, cấu trúc, code, thuật ngữ Anh, không sửa mục khác.
- node --check js/data/q-ai.js: OK.
- node scripts/build-light-index.js: OK (index-light.js sinh lại).
- node scripts/validate.js: không báo lỗi nào về q-ai.js. Các LỖI/Cảnh báo còn lại (lessons-spring.js, labs-thread.js, newlessons.txt, path.js, q-concurrency-jvm.js, q-sql.js) là lỗi cũ trong file không sở hữu bởi task này, không được sửa theo quy tắc 3 AGENTS.md.
- grep -c "Tom tat" js/data/q-ai.js = 0.
Reviewed-by: kilo (T2464R)
