# T2402 — 30 câu CCAR-P: Enterprise Integration + Governance

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccap-2.js`
After: T2374

Định dạng QUIZ, topic claude, tag [Domain] đầu q đúng tên domain trong js/data/exams.js; q/options tiếng Anh dạng tình huống, explain tiếng Việt vì sao đúng + vì sao TỪNG phương án sai; phương án nhiễu hợp lý (sai lầm thật), độ dài tương đương; 1/4 multi (Choose 2); id qz-<prefix>-NNN tiếp số LỚN NHẤT toàn js/data. Chỉ điều chắc chắn theo docs Anthropic; model hiện hành Fable 5.2, Opus 5.5, Sonnet 5.5, Haiku 5.5; budget_tokens/temperature/prefill bị 400 trên model mới. Prefix ccap. Domains: [Enterprise Integration] 15, [Governance & Risk] 15. Câu khó, nhiều ràng buộc.

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng; không tăng thì chưa được DONE).

## Nghiệm thu
`node --check js/data/quiz-ccap-2.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Added qz-ccap-311..qz-ccap-340 (30 items: 15 Enterprise Integration, 15 Governance & Risk). validate OK.
Reviewed-by: kilo (T2402R)
