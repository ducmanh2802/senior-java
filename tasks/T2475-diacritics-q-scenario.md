# T2475 — Viết lại tiếng Việt CÓ DẤU: scenario-142, scenario-145, scenario-146, scenario-147

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T2474

Các mục sau trong `js/data/q-scenario.js` đang viết tiếng Việt **KHÔNG DẤU** ("Tom tat", "khong", "nguyen nhan"…), người học đọc rất khó: **scenario-142, scenario-145, scenario-146, scenario-147**.

Với TỪNG mục: xem bằng `node scripts/qtool.js show js/data/q-scenario.js <id>`, rồi sửa NGAY TẠI CHỖ mọi chuỗi tiếng Việt (q, a, follow, title, body, prompt, explain, hints, scenario, answer, rubric, check…) thành **tiếng Việt có dấu chuẩn** ("**Tóm tắt:**", "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", "> Senior tip:"). Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh, nội dung kỹ thuật (chỉ sửa lỗi kỹ thuật nếu chắc chắn sai). KHÔNG sửa mục khác, KHÔNG đổi code/test trong bài học.

## Luật
AGENTS.md. Được phép SỬA các mục liệt kê ở trên (ngoại lệ của luật chỉ thêm). Không backtick, không ký hiệu đô-la + ngoặc nhọn. Số mục trong file trước/sau phải bằng nhau. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/q-scenario.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → OK. Kiểm tra lại: `grep -c "Tom tat" js/data/q-scenario.js` không còn tăng do các mục trên. Status: DONE + Notes liệt kê id đã sửa.

## Notes
- Đã sửa có dấu: scenario-142, scenario-145, scenario-146, scenario-147.
Reviewed-by: kilo (T2475R)
