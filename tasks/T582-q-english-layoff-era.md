# T582 — 8 câu phỏng vấn tiếng Anh thời layoff + AI

Status: DONE
Reviewed-by: claude (self-checked: validate)
Agent: qoder
Owns: `js/data/q-english.js`

Thêm 8 câu topic english, **`lang: 'en'`**, theo đúng format các câu english hiện có (đọc 5 câu mẫu trước, giữ cùng cấu trúc đáp án). Đọc hết các câu cũ để không trùng. Gợi ý:
1. "Why are you looking for a new job?" khi vừa bị layoff: thật, ngắn, không tiêu cực.
2. "I see a gap in your CV. What have you been doing?"
3. "Why should we hire you over other candidates?": bằng chứng có số liệu.
4. "How do you use AI tools in your daily work? How do you make sure AI-generated code is correct?"
5. "Walk me through a production incident you handled.": timeline, impact, root cause, fix, prevention.
6. "Explain a technical trade-off you made to a non-technical stakeholder."
7. "What are your salary expectations?" + phản hồi khi bị trả thấp.
8. "Do you have any questions for us?": câu hỏi kiểm tra sức khoẻ team / headcount (xem docs/market-layoffs-2026.md).
Câu mẫu tiếng Anh tự nhiên, B2–C1, 120–200 từ, gắn bối cảnh Java backend. Level senior (1–2 câu mid).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6 và docs/PLAN-v4-deep.md. Người đọc: dev Java 4 năm, cần giải thích **từ gốc, rất chi tiết**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-english.js`; id tiếp nối số lớn nhất hiện có của topic. Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**. Trùng thì chọn góc khác cùng mảng.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (cơ chế bên trong, ví dụ code/số liệu, bảng trade-off, pitfall production) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Đúng kỹ thuật với Java 17/21 (có thể nhắc 25 LTS), Spring Boot 3.x. Không bịa flag/API; không chắc thì bỏ.
- Không backtick, không `${` trong template literal.
- `refs` tuỳ chọn, chỉ link chính thức chắc chắn tồn tại; có refs thì chạy `node scripts/check-links.mjs js/data/q-english.js`.

## Nghiệm thu
`node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes
- Thêm english-072 … english-079 (8 câu, lang en; 2 mid: 072, 073; 6 senior). Cấu trúc như câu cũ: Tóm tắt → Sample answer (150–190 từ) → Vì sao hiệu quả → Useful phrases → Lỗi người Việt hay mắc → Senior tip.
- Góc mới so với câu cũ: layoff (072), CV gap (073), why hire you (074), kiểm chứng code AI (075, khác 016), incident timeline OOM (076), PM hỏi dashboard real-time (077), offer thấp hơn range + lương cũ (078), câu hỏi kiểm tra headcount/ngân sách (079).
- build-light-index + validate: OK.
