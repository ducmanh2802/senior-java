# T2334 — 30 câu luyện thi CCDV-F (pool 2): Model Selection, Agents, Security

Status: DONE

## Notes
Added 30 questions (qz-ccdv-151 to qz-ccdv-180) to js/data/quiz-ccdv-1.js:
- [Model Selection]: 10 questions (qz-ccdv-151..160) — model routing, thinking vs structured output, aliases, deprecation, multimodal, context window, Batch API, regional endpoints
- [Agents]: 10 questions (qz-ccdv-161..170) — parallel tool calling, timeout handling, sub-agent delegation, context management, MCP server, structured output + tools, Computer Use safety, human-in-the-loop, evaluation methodology, circuit breaker
- [Security]: 10 questions (qz-ccdv-171..180) — secrets manager, PII pseudonymization, prompt injection defense, per-tenant rate limiting, audit logging, GDPR/DPA compliance, tool result sanitization, refusal handling, external API key storage, key compromise incident response
- 7 multi-select questions (≈23%)
- All explain in Vietnamese, questions in English, following official Anthropic docs
- node --check passes, build-light-index passes, validate.js shows no errors in quiz-ccdv-1.js (pre-existing errors in other files unaffected)
Agent: kilo
Owns: `js/data/quiz-ccdv-1.js`
After: T2302

## Bối cảnh
Người học muốn pass các chứng chỉ Claude của Anthropic trong 3 tháng. Đề thật: 120 phút, câu **tình huống** multiple-choice / multiple-response, thang 1000, đậu 720, thi bằng **tiếng Anh**. Đối tượng CCDV-F (Developer – Foundations): developer xây ứng dụng trên Claude API — Messages API, streaming, tool use, MCP, Agent SDK, prompt caching, batch, chọn model/effort, bảo mật (prompt injection, secrets), Claude Code, eval. Câu tình huống kỹ thuật cụ thể (request/response, tham số, lỗi 400 thường gặp).
Pool 1 (`js/data/quiz-claude.js`, id qz-claude-*) đã có ~220 câu CCDV; pool 2 phải **khác ý** hoàn toàn (đọc lướt `q` của pool 1 bằng `node scripts/qtool.js list js/data/quiz-ccdv-1.js` trước).
Domain phải là tag **`[Tên domain]` ở đầu `q`**, đúng y tên trong `js/data/exams.js` (exam `claude`).

## Việc cần làm
Thêm **30 câu** vào `js/data/quiz-ccdv-1.js` (trước dòng `);` cuối file), chia đều: `[Model Selection]`, `[Agents]`, `[Security]`.
- id: `qz-ccdv-NNN` — số nối tiếp **lớn nhất trong toàn bộ js/data/** (`grep -ohE "qz-ccdv-[0-9]+" js/data/*.js | sort -V | tail -1`; hiện ≥ 120). topic: `'claude'`.
- `q` và `options` bằng **tiếng Anh**, tình huống 2–4 câu ("A legal team… Which approach…?"), không hỏi định nghĩa suông. Phương án nhiễu **hợp lý**, độ dài tương đương đáp án đúng.
- Khoảng 1/4 là `multi: true` với "(Choose 2)" (4–6 options, answer mảng tăng dần). Câu 1 đáp án: đúng 4 options, answer 0..3 rải đều.
- `explain` bằng **tiếng Việt**: vì sao đáp án đúng + vì sao TỪNG phương án sai; thuật ngữ giữ tiếng Anh.
- Chỉ dùng điều CHẮC CHẮN đúng theo tài liệu chính thức Anthropic (docs.claude.com, code.claude.com/docs, modelcontextprotocol.io, Anthropic Academy). Model hiện hành: Fable 5.2 ($8/$40 per MTok), Opus 5.5 ($4/$20), Sonnet 5.5 ($2/$10), Haiku 5.5 ($0.10/$0.50). Trên model mới: `budget_tokens`, temperature/top_p/top_k, prefill bị 400; dùng `thinking: {type: "adaptive"}` + effort. Không chắc → hỏi ở mức nguyên lý.

## Luật
AGENTS.md mục "Câu trắc nghiệm" + mục 5 (không backtick, không ký hiệu đô-la + ngoặc nhọn). Chỉ thêm, không sửa câu cũ. Không commit.

## Nghiệm thu
`node --check js/data/quiz-ccdv-1.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`, Notes ghi id + số câu theo domain.

## Notes
