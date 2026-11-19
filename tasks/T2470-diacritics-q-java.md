# T2470 — Viết lại tiếng Việt CÓ DẤU: core-072, core-073, core-074, core-075

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T2469

Các mục sau trong `js/data/q-java.js` đang viết tiếng Việt **KHÔNG DẤU** ("Tom tat", "khong", "nguyen nhan"…), người học đọc rất khó: **core-072, core-073, core-074, core-075**.

Với TỪNG mục: xem bằng `node scripts/qtool.js show js/data/q-java.js <id>`, rồi sửa NGAY TẠI CHỖ mọi chuỗi tiếng Việt (q, a, follow, title, body, prompt, explain, hints, scenario, answer, rubric, check…) thành **tiếng Việt có dấu chuẩn** ("**Tóm tắt:**", "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", "> Senior tip:"). Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh, nội dung kỹ thuật (chỉ sửa lỗi kỹ thuật nếu chắc chắn sai). KHÔNG sửa mục khác, KHÔNG đổi code/test trong bài học.

## Luật
AGENTS.md. Được phép SỬA các mục liệt kê ở trên (ngoại lệ của luật chỉ thêm). Không backtick, không ký hiệu đô-la + ngoặc nhọn. Số mục trong file trước/sau phải bằng nhau. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/q-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → OK. Kiểm tra lại: `grep -c "Tom tat" js/data/q-java.js` không còn tăng do các mục trên. Status: DONE + Notes liệt kê id đã sửa.

## Notes
Đã sửa 4 câu hỏi: core-072, core-073, core-074, core-075. Tất cả tiếng Việt không dấu đã được chuyển sang tiếng Việt có dấu chuẩn (ví dụ: "Tom tat" → "Tóm tắt", "co che" → "cơ chế", "vi du thuc su" → "ví dụ thực sự", "tra loi mau" → "trả lời mẫu", "khoa nghiep thu" → "khoa nghiệp vụ", "mo rong" → "mở rộng", "dong de sua" → "đóng để sửa", "cai gi - vi sao can" → "cái gì - vì sao cần", "buoc buoc" → "bước bước", "bang so sanh" → "bảng so sánh", "khi nao dung" → "khi nào dùng", "pitfall" → "pitfall", "vi du doi thuc" → "ví dụ đời thực", "follow" questions đều có dấu). Không thay đổi id, cấu trúc, code Java, thuật ngữ tiếng Anh, hay nội dung kỹ thuật.
Reviewed-by: kilo (T2470R)
