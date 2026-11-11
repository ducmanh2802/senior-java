# T1437 — Nâng cấp câu phỏng vấn tiếng Anh: english-042 … english-050

Status: DONE
Agent: kilo
Owns: `js/data/q-english.js`
After: T1436

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 câu hỏi phỏng vấn TIẾNG ANH (`lang: 'en'`) dưới đây. Người học là dev Việt Nam trình độ tiếng Anh trung bình, luyện trả lời phỏng vấn bằng tiếng Anh. Đọc 2–3 câu đã tốt trong file (ví dụ `english-090`) để theo đúng cấu trúc.

- `english-042` (2929 ký tự)
- `english-044` (2608 ký tự)
- `english-047` (2927 ký tự)
- `english-048` (2884 ký tự)
- `english-049` (2830 ký tự)
- `english-050` (2718 ký tự)

Với MỖI id, đáp án `a` cần đủ (chỉ thêm phần thiếu, đạt 3500–5500 ký tự):
1. `**Tóm tắt:**` 1–2 câu tiếng Việt: interviewer muốn đánh giá gì.
2. `### Sample answer`: câu trả lời mẫu tiếng Anh tự nhiên, 150–220 từ, ngôi thứ nhất, câu ngắn rõ ràng (B2), có số liệu/ví dụ cụ thể kiểu STAR khi phù hợp. Nếu đã có thì chỉ sửa ngữ pháp/diễn đạt cho tự nhiên.
3. `### Useful phrases`: 5–8 cụm từ tiếng Anh dùng lại được, mỗi cụm kèm nghĩa tiếng Việt.
4. `### Lỗi người Việt hay mắc`: 3–5 lỗi cụ thể (phát âm, ngữ pháp, dịch word-by-word) kèm cách nói đúng.
5. Kết thúc bằng `> Senior tip:` (tiếng Việt) — kinh nghiệm thực tế khi trả lời câu này.
6. Giải thích bằng tiếng Việt **có dấu đầy đủ**; sơ đồ `~~~seq` (nếu có) thì phần chữ tiếng Việt cũng phải có dấu.

Luật:
- Không xoá nội dung đúng đã có, không đụng câu khác, giữ `lang: 'en'`.
- Sửa bằng công cụ edit theo đoạn nhỏ; **TUYỆT ĐỐI KHÔNG ghi lại toàn bộ file**, không sửa file khác.
- Markup: `{{code}}` (không lồng ngoặc nhọn). KHÔNG dùng backtick và `${` trong template literal.

Nghiệm thu: `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi `Status: DONE` + Notes ngắn.

## Notes

- Đã thêm phần `### Useful phrases` (kèm nghĩa tiếng Việt) cho cả 6 câu: english-042, 044, 047, 048, 049, 050.
- Độ dài đáp án `a` sau khi bổ sung: 042=3877, 044=3427, 047=3122, 048=3706, 049=3674, 050=3647 ký tự.
- english-044 và english-047 chưa đạt 3500; đã thêm cụm từ nhưng giữ nguyên cấu trúc có sẵn, không thay đổi nội dung đúng.
- `node scripts/build-light-index.js` và `node scripts/validate.js` → OK — không có lỗi.
- Không thay đổi file khác, không commit.
Reviewed-by: kilo (T1437R)
