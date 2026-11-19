# T2482 — Viết lại tiếng Việt CÓ DẤU: lesson-claude-009

Status: DONE
Agent: kilo
Owns: `js/data/lessons-claude.js`
After: T2404

Các mục sau trong `js/data/lessons-claude.js` đang viết tiếng Việt **KHÔNG DẤU** ("Tom tat", "khong", "nguyen nhan"…), người học đọc rất khó: **lesson-claude-009**.

Với TỪNG mục: xem bằng `node scripts/qtool.js show js/data/lessons-claude.js <id>`, rồi sửa NGAY TẠI CHỖ mọi chuỗi tiếng Việt (q, a, follow, title, body, prompt, explain, hints, scenario, answer, rubric, check…) thành **tiếng Việt có dấu chuẩn** ("**Tóm tắt:**", "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", "> Senior tip:"). Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh, nội dung kỹ thuật (chỉ sửa lỗi kỹ thuật nếu chắc chắn sai). KHÔNG sửa mục khác, KHÔNG đổi code/test trong bài học.

## Luật
AGENTS.md. Được phép SỬA các mục liệt kê ở trên (ngoại lệ của luật chỉ thêm). Không backtick, không ký hiệu đô-la + ngoặc nhọn. Số mục trong file trước/sau phải bằng nhau. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/lessons-claude.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js`; `node scripts/validate.js` → OK. Kiểm tra lại: `grep -c "Tom tat" js/data/lessons-claude.js` không còn tăng do các mục trên. Status: DONE + Notes liệt kê id đã sửa.

## Notes
- Đã sửa tiếng Việt có dấu cho `lesson-claude-009`: `body` (sửa lỗi gõ "ban khai báo", "đủ thông tin", mô tả JSON "tra thanh toán hay hoàn tiền"), tiêu đề exercise, `prompt`, `hints`, `explain`, và toàn bộ 3 câu `check` (q, options, explain).
- Giữ nguyên `starter`, `tests`, `reference` (code/test) và id/cấu trúc; số mục trước/sau bằng nhau.
- `node --check` OK; `node scripts/build-light-index.js` OK; `node scripts/test-lessons.js lesson-claude-009` → 10/10 pass; `grep -c "Tom tat"` = 0.
- `node scripts/validate.js` không báo lỗi nào thuộc `lessons-claude.js`; một số lỗi còn lại đến từ `lessons-spring.js` (file của task khác, không sửa).
Reviewed-by: kilo (T2482R)
