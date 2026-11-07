# T913 — Rewrite richer: English interview answers (1/2) — 10 câu

Status: DONE
Agent: claude
Owns: `js/data/q-english.js`
After: T885

Các câu dưới đây có đáp án **quá mỏng (< 2000 ký tự)**. Viết lại field `a` cho **hay hơn và chi tiết hơn**, giữ đúng ý câu hỏi `q` hiện có, giữ những gì đáp án cũ đã đúng; sửa chỗ sai (nếu thấy) và ghi vào Notes.

**Id cần viết lại:** `english-052`, `english-053`, `english-054`, `english-057`, `english-058`, `english-059`, `english-060`, `english-061`, `english-062`, `english-142`

Các câu này là câu **tiếng Anh** (`lang: 'en'`): viết đáp án mới **bằng tiếng Anh** theo đúng format các câu english hiện có (phân tích cách trả lời tốt, câu mẫu dùng được ngay, cụm từ hữu ích, lỗi người Việt hay mắc, bản ngắn để nói và bản viết), 2000–3500 ký tự, thêm mục `### Real-life example` (một tình huống cụ thể ở công ty) và `### Model answer (60–90 seconds)`.

Chạy `node scripts/validate.js` → OK.

> **CHỈ SỬA ĐÚNG CÁC ID LIỆT KÊ:** với mỗi id, chỉ thay nội dung field `a` (và thêm `follow` nếu thiếu); giữ nguyên `id`, `topic`, `level`, `q`, `tags`, `refs`, `lang`. KHÔNG viết lại cả file, KHÔNG đụng object khác (file có thể đang chứa nội dung chưa commit của task khác). Sửa bằng thao tác thay thế đúng đoạn `a: ` của từng id. Trước khi đánh DONE: số id trong file (`grep -c "id: '"`) phải KHÔNG đổi.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Task này là NGOẠI LỆ:** chỉ sửa field `a` (và thêm `follow` nếu thiếu) của các id liệt kê ở trên trong `js/data/q-english.js`; không thêm câu mới, không đụng câu khác.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-english.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id đã viết lại vào Notes.

## Notes

Claude 2026-11-07: viết lại 10 câu english (khung song ngữ: hướng dẫn tiếng Việt + Model answer 60–90s, Short version, Real-life example, cụm từ, lỗi hay mắc).
