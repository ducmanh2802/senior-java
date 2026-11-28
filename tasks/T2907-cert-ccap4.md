# T2907 — 40 câu luyện thi CCAR-P: tăng ngân hàng cho đề full

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccap-1.js`
After: T2906

## Bối cảnh
Người học muốn pass các chứng chỉ Claude của Anthropic trong 3 tháng. Đề thật: 120 phút, câu **tình huống** multiple-choice / multiple-response, thang 1000, đậu 720, thi bằng **tiếng Anh**. Đối tượng CCAR-P (Architect Professional): kiến trúc sư giải pháp sở hữu hệ thống Claude end-to-end trong doanh nghiệp — tích hợp, thiết kế, đánh giá/tối ưu chi phí-độ trễ-chất lượng, governance & risk, stakeholder, vận hành. Câu khó, nhiều ràng buộc, chọn phương án TỐT NHẤT.
Pool 1 (`js/data/quiz-ccap-1.js`) đã có câu; pool 2 phải **khác ý** hoàn toàn (đọc lướt `q` của pool 1 bằng `node scripts/qtool.js list js/data/quiz-ccap-1.js` trước).
Domain phải là tag **`[Tên domain]` ở đầu `q`**, đúng y tên trong `js/data/exams.js` (exam `ccar-p`).


Người dùng muốn bộ đề luyện **full** kiểu các trang ôn thi chứng chỉ Claude: đề bốc ngẫu nhiên theo trọng số domain, đủ câu để thi nhiều lần không lặp. Ưu tiên câu **tình huống dài, nhiều ràng buộc**, khoảng 1/3 là multiple-response "(Choose 2)" hoặc "(Choose 3)". Có thể mô phỏng dạng "Matrix Yes/No" bằng câu multi: liệt kê 4–5 phát biểu trong options, hỏi "Which statements are correct? (Choose N)".
Không chép nội dung từ trang ôn thi bên thứ ba (có bản quyền); tự viết.

Domain là tag **`[Tên domain]` ở đầu `q`**, đúng y tên trong `js/data/exams.js` (exam `ccar-p`). Đọc lướt `q` các câu đã có của exam này (`node scripts/qtool.js list js/data/quiz-ccap-1.js` và các file quiz cùng exam) để **không trùng ý**.

## Việc cần làm
Thêm **40 câu** vào cuối `js/data/quiz-ccap-1.js` (trước dòng `);` cuối file): `[Enterprise Integration]` 10, `[Solution Design]` 8, `[Eval & Optimization]` 8, `[Governance & Risk]` 6, `[Models & Context]` 8.
- id: `qz-ccap-NNN` nối tiếp số **lớn nhất trong toàn bộ js/data/** (`grep -ohE "qz-ccap-[0-9]+" js/data/*.js | sort -V | tail -1`). topic: `'claude'`.
- `q` và `options` bằng **tiếng Anh**, tình huống 2–4 câu ("A legal team… Which approach…?"), không hỏi định nghĩa suông. Phương án nhiễu **hợp lý**, độ dài tương đương đáp án đúng.
- Khoảng 1/4 là `multi: true` với "(Choose 2)" (4–6 options, answer mảng tăng dần). Câu 1 đáp án: đúng 4 options, answer 0..3 rải đều.
- `explain` bằng **tiếng Việt**: vì sao đáp án đúng + vì sao TỪNG phương án sai; thuật ngữ giữ tiếng Anh.
- Chỉ dùng điều CHẮC CHẮN đúng theo tài liệu chính thức Anthropic (docs.claude.com, code.claude.com/docs, modelcontextprotocol.io, Anthropic Academy). Model hiện hành: Fable 5.2 ($8/$40 per MTok), Opus 5.5 ($4/$20), Sonnet 5.5 ($2/$10), Haiku 5.5 ($0.10/$0.50). Trên model mới: `budget_tokens`, temperature/top_p/top_k, prefill bị 400; dùng `thinking: {type: "adaptive"}` + effort. Không chắc → hỏi ở mức nguyên lý.

## Luật
AGENTS.md mục "Câu trắc nghiệm" + mục 5 (không backtick, không ký hiệu đô-la + ngoặc nhọn). Chỉ thêm, không sửa câu cũ. Không commit.

## Nghiệm thu
`node --check js/data/quiz-ccap-2.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`, Notes ghi id + số câu theo domain.

## Notes
Added qz-ccap-381..420 (40 câu tiếng Anh, explain tiếng Việt) vào cuối `js/data/quiz-ccap-1.js` (sau câu 160, trước `// qtool append point`):
- [Enterprise Integration] 10 (381–390)
- [Solution Design] 8 (391–398)
- [Eval & Optimization] 8 (399–406)
- [Governance & Risk] 6 (407–412)
- [Models & Context] 8 (413–420)
11/40 câu multi (Choose 2/3), còn lại single 4 options, đáp án rải đều 0..3. Ý khác hoàn toàn pool 1/pool 2 (đã đọc lướt q).
`node --check` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → OK — không có lỗi. Không commit.
Reviewed-by: kilo (T2907R)
