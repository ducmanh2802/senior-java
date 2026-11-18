# T2367 — 5 câu phỏng vấn tiếng Anh: kể dự án fintech/banking và AI

Status: DONE
Agent: kilo
Owns: `js/data/q-english.js`
After: T2219

Đọc AGENTS.md mục 4–6 (câu tiếng Anh có lang: 'en'); qtool.js list để không trùng. Thêm 5 câu (topic english, lang 'en', senior): 'Walk me through a payment system you built', 'How did you guarantee no double charge?', 'Tell me about integrating an LLM into a production system', 'How do you handle a disagreement about architecture with a client?', 'Explain a complex technical concept to a non-technical stakeholder'. Đáp án: Summary, phân tích ý interviewer muốn nghe, sample answer 150–220 từ tiếng Anh tự nhiên có số liệu, cụm từ hữu ích, lỗi người Việt hay mắc, > Senior tip:.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/q-english.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

Ids trước: english-209 (max cũ). Thêm 5 câu mới: english-210 (payment walkthrough), english-211 (no double charge / idempotency), english-212 (LLM integration), english-213 (architecture disagreement with client), english-214 (explain tech to non-technical stakeholder). Sau: max id english-214. Sample answers 150–220 từ (210:195, 211:213, 212:160, 213:155, 214:208). validate.js sạch đối với q-english.js (lỗi còn lại của q-primer.js/projects.js/concurrency là cũ, không liên quan).
