# T2288 — 30 câu luyện thi CCAO-F (pool 2): Output Evaluation, Workflow Integration

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccao-2.js`
After: T2177

## Bối cảnh
Người học muốn pass các chứng chỉ Claude của Anthropic trong 3 tháng. Đề thật: 120 phút, câu **tình huống** multiple-choice / multiple-response, thang 1000, đậu 720, thi bằng **tiếng Anh**. Đối tượng CCAO-F (Associate – Foundations): người dùng Claude trong công việc (không cần code) — chọn sản phẩm (Claude.ai, Projects, Claude Code, Cowork…), viết prompt, cấu hình knowledge/Projects, đánh giá output, tích hợp vào workflow, dùng có trách nhiệm, xử lý sự cố. Câu tình huống thực tế, mức trung bình.
Pool 1 (`js/data/quiz-ccao-1.js`) đã có câu; pool 2 phải **khác ý** hoàn toàn (đọc lướt `q` của pool 1 bằng `node scripts/qtool.js list js/data/quiz-ccao-1.js` trước).
Domain phải là tag **`[Tên domain]` ở đầu `q`**, đúng y tên trong `js/data/exams.js` (exam `ccao-f`).

## Việc cần làm
Thêm **30 câu** vào `js/data/quiz-ccao-2.js` (trước dòng `);` cuối file), chia đều: `[Output Evaluation]`, `[Workflow Integration]`.
- id: `qz-ccao-NNN` — số nối tiếp **lớn nhất trong toàn bộ js/data/** (`grep -ohE "qz-ccao-[0-9]+" js/data/*.js | sort -V | tail -1`; hiện ≥ 105). topic: `'claude'`.
- `q` và `options` bằng **tiếng Anh**, tình huống 2–4 câu ("A legal team… Which approach…?"), không hỏi định nghĩa suông. Phương án nhiễu **hợp lý**, độ dài tương đương đáp án đúng.
- Khoảng 1/4 là `multi: true` với "(Choose 2)" (4–6 options, answer mảng tăng dần). Câu 1 đáp án: đúng 4 options, answer 0..3 rải đều.
- `explain` bằng **tiếng Việt**: vì sao đáp án đúng + vì sao TỪNG phương án sai; thuật ngữ giữ tiếng Anh.
- Chỉ dùng điều CHẮC CHẮN đúng theo tài liệu chính thức Anthropic (docs.claude.com, code.claude.com/docs, modelcontextprotocol.io, Anthropic Academy). Model hiện hành: Fable 5.2 ($8/$40 per MTok), Opus 5.5 ($4/$20), Sonnet 5.5 ($2/$10), Haiku 5.5 ($0.10/$0.50). Trên model mới: `budget_tokens`, temperature/top_p/top_k, prefill bị 400; dùng `thinking: {type: "adaptive"}` + effort. Không chắc → hỏi ở mức nguyên lý.

## Luật
AGENTS.md mục "Câu trắc nghiệm" + mục 5 (không backtick, không ký hiệu đô-la + ngoặc nhọn). Chỉ thêm, không sửa câu cũ. Không commit.

## Nghiệm thu
`node --check js/data/quiz-ccao-2.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`, Notes ghi id + số câu theo domain.

## Notes

- Đã thêm 30 câu vào `js/data/quiz-ccao-2.js`, id `qz-ccao-106` … `qz-ccao-135` (nối tiếp pool 1, không trùng ý).
- `[Output Evaluation]`: 15 câu (qz-ccao-106 → qz-ccao-120). `[Workflow Integration]`: 15 câu (qz-ccao-121 → qz-ccao-135).
- 7 câu `multi: true` (108, 111, 114, 119, 124, 129, 133), mỗi câu 5 options, answer mảng tăng dần, `(Choose 2)` khớp answer.length.
- 23 câu 1 đáp án; vị trí đáp án rải đều: index 0 = 6, 1 = 5, 2 = 6, 3 = 6.
- `q` + `options` tiếng Anh (tình huống 2–4 câu, có tag domain ở đầu); `explain` tiếng Việt, nêu vì sao đáp án đúng và vì sao từng phương án sai, giải thích thuật ngữ (back-translation, LLM-as-judge, sampling/oversample, regression set, agentic workflow, least privilege, provenance, API/batch/queue…).
- Nghiệm thu: `node --check js/data/quiz-ccao-2.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (chạy lại nhiều lần; có giai đoạn báo lỗi cú pháp/nội dung ở `js/data/bugs.js` do task khác đang sửa dở, không phải file này, và đã OK sau khi task đó sửa xong).
