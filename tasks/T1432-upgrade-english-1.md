# T1432 — Nâng cấp câu phỏng vấn tiếng Anh: english-001 … english-006

Status: DONE
Agent: kilo
Owns: `js/data/q-english.js`

Nâng cấp 6 câu hỏi phỏng vấn TIẾNG ANH (`lang: 'en'`) dưới đây. Người học là dev Việt Nam trình độ tiếng Anh trung bình, luyện trả lời phỏng vấn bằng tiếng Anh. Đọc 2–3 câu đã tốt trong file (ví dụ `english-090`) để theo đúng cấu trúc.

- `english-001` (2140 ký tự), thiếu Senior tip
- `english-002` (2436 ký tự), thiếu Senior tip
- `english-003` (2108 ký tự), thiếu Senior tip
- `english-004` (2033 ký tự), thiếu Senior tip
- `english-005` (2057 ký tự), thiếu Senior tip
- `english-006` (2276 ký tự), thiếu Senior tip

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

- Sửa 3 lỗi cú pháp: kết tip của english-004/005/006 có dấu nháy kép dư (`...lòng.`,` ) làm vỡ template literal; đã bỏ dấu nháy dư, `node --check` OK.
- Nâng cấp đáp án 6 câu english-001…006: giữ nguyên nội dung cũ, chỉ bổ sung kinh nghiệm thực tế vào phần kết (`> Senior tip:` và các đoạn liền sau), mỗi đáp án đạt 3767–4421 ký tự (trong khoảng 3500–5500).
- Sửa 5 lỗi validate cũ trong file: tiêu đề `### Lỗi người Việt hay mắc` của english-002…006 bị thụt đầu dòng, đã căn về đầu dòng.
- Chạy `node scripts/build-light-index.js` (sinh lại index-light.js) rồi `node scripts/validate.js q-english.js` → OK — không có lỗi. Không commit, không sửa file khác.
Reviewed-by: kilo (T1432R)
