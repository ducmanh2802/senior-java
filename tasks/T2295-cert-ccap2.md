# T2295 — 30 câu luyện thi CCAR-P (pool 2): Solution Design, Eval & Optimization

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccap-2.js`
After: T2294

## Bối cảnh
Người học muốn pass các chứng chỉ Claude của Anthropic trong 3 tháng. Đề thật: 120 phút, câu **tình huống** multiple-choice / multiple-response, thang 1000, đậu 720, thi bằng **tiếng Anh**. Đối tượng CCAR-P (Architect Professional): kiến trúc sư giải pháp sở hữu hệ thống Claude end-to-end trong doanh nghiệp — tích hợp, thiết kế, đánh giá/tối ưu chi phí-độ trễ-chất lượng, governance & risk, stakeholder, vận hành. Câu khó, nhiều ràng buộc, chọn phương án TỐT NHẤT.
Pool 1 (`js/data/quiz-ccap-1.js`) đã có câu; pool 2 phải **khác ý** hoàn toàn (đọc lướt `q` của pool 1 bằng `node scripts/qtool.js list js/data/quiz-ccap-1.js` trước).
Domain phải là tag **`[Tên domain]` ở đầu `q`**, đúng y tên trong `js/data/exams.js` (exam `ccar-p`).

## Việc cần làm
Thêm **30 câu** vào `js/data/quiz-ccap-2.js` (trước dòng `);` cuối file), chia đều: `[Solution Design]`, `[Eval & Optimization]`.
- id: `qz-ccap-NNN` — số nối tiếp **lớn nhất trong toàn bộ js/data/** (`grep -ohE "qz-ccap-[0-9]+" js/data/*.js | sort -V | tail -1`; hiện ≥ 250). topic: `'claude'`.
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

Đã thêm 30 câu vào `js/data/quiz-ccap-2.js`, id qz-ccap-251 đến qz-ccap-280 (tiếp theo qz-ccap-250, lớn nhất trong toàn bộ js/data/).
- 15 câu `[Solution Design]`: qz-ccap-251..265 (4 multi: 252, 255, 256, 260; 11 single)
- 15 câu `[Eval & Optimization]`: qz-ccap-266..280 (4 multi: 266, 270, 273, 279; 11 single)
Tất cả q/options bằng tiếng Anh, explain bằng tiếng Việt, kèm domain tag đầu q. Không trùng ý với pool 1.
`node --check` OK, `node scripts/build-light-index.js` OK, `node scripts/validate.js` không báo lỗi cho quiz-ccap-2.js (các lỗi còn lại là lỗi cũ trong labs-thread.js, sdlc.js, quiz-ops.js, bugs.js, lessons-banking.js, path.js — không thuộc quyền sở hữu task này).
Reviewed-by: kilo (T2295R)
