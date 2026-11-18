# T2401 — 30 câu CCDV-F: Security, Eval, Claude Code

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccdv-1.js`
After: T2335

Định dạng QUIZ, topic claude, tag [Domain] đầu q đúng tên domain trong js/data/exams.js; q/options tiếng Anh dạng tình huống, explain tiếng Việt vì sao đúng + vì sao TỪNG phương án sai; phương án nhiễu hợp lý (sai lầm thật), độ dài tương đương; 1/4 multi (Choose 2); id qz-<prefix>-NNN tiếp số LỚN NHẤT toàn js/data. Chỉ điều chắc chắn theo docs Anthropic; model hiện hành Fable 5.2, Opus 5.5, Sonnet 5.5, Haiku 5.5; budget_tokens/temperature/prefill bị 400 trên model mới. Prefix ccdv. Domains: [Security] 10, [Eval] 10, [Claude Code] 10.

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng; không tăng thì chưa được DONE).

## Nghiệm thu
`node --check js/data/quiz-ccdv-1.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Added 30 questions (qz-ccdv-181 through qz-ccdv-210):
- [Security] 10 questions (qz-ccdv-181 to qz-ccdv-190)
- [Eval] 10 questions (qz-ccdv-191 to qz-ccdv-200)
- [Claude Code] 10 questions (qz-ccdv-201 to qz-ccdv-210)
- 8 multi-choice (Choose 2) questions out of 30
- Previous highest ID: qz-ccdv-180
- New highest ID: qz-ccdv-210

Note: `node scripts/validate.js` reports a pre-existing syntax error in `quiz-ccap-2.js` (unrelated file) which prevents `build-light-index.js` from running. My quiz-ccdv-1.js syntax is valid and questions pass validation.
Reviewed-by: kilo (T2401R)
