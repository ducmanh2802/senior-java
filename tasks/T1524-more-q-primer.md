# T1524 — Bổ sung 8 câu hỏi (primer) vào q-primer.js

Status: DONE
Agent: kilo
Owns: `js/data/q-primer.js`

Thêm **8 câu hỏi phỏng vấn mới** (topic: primer) vào `js/data/q-primer.js`. Id nối tiếp id lớn nhất hiện có của topic (xem `node scripts/qtool.js list js/data/q-primer.js`); đọc danh sách đó để **không trùng ý**.

Gợi ý chủ đề: nền tảng cho dev hổng gốc nhưng hỏi theo tình huống: điều gì xảy ra khi gõ URL (DNS, TCP, TLS, HTTP), HTTP/1.1 vs HTTP/2, cookie/session vs token, Git rebase vs merge và xử lý conflict, lệnh Linux điều tra server chậm (top, df, free, ss, journalctl), process vs thread, encoding UTF-8 và lỗi font tiếng Việt, độ phức tạp Big-O khi chọn cấu trúc dữ liệu.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → ví dụ code ngắn có comment → bảng so sánh/khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: phần lớn mid/senior.

## Luật
- Đọc AGENTS.md (mục 4–6, 13) trước. **Chỉ thêm** vào `js/data/q-primer.js`, không sửa mục khác, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-primer.js logs/tmp-T1524.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG** (Java 17/21, Spring Boot 3.x, PostgreSQL hiện hành). Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm `primer-026`–`primer-033` (URI, TCP/UDP, HTTP redirect, shell streams, CIDR, SemVer, đo thời gian Java, Unicode normalization); câu trả lời có ví dụ đời thực, mẫu phỏng vấn và Senior tip.
- `node --check js/data/q-primer.js`, `node scripts/qtool.js check ...` đạt; đã chạy `node scripts/build-light-index.js`.
- `node scripts/validate.js` chưa thể in `OK`: hiện còn lỗi ID và backtick trong `js/data/quiz-cca-5.js` (file task T1520, ngoài quyền sở hữu). Không sửa file ngoài phạm vi. Validator cũng nêu cảnh báo có sẵn về `lesson-design-007` trong `path.js`.
Reviewed-by: kilo (T1524R)
