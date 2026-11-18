# T2408 — 20 drill hỏi-đáp tiếng Anh: phỏng vấn AI Integration Engineer

Status: DONE
## Notes
Added drills drill-qa-222..241 (20 drills, AI integration engineer theme). Max id before: 221.
Agent: kilo
Owns: `js/data/drills-qa.js`
After: T2373

Định dạng qa; grep q: để không trùng. 20 drill (theme tech/project/design): RAG, eval, hallucination, chi phí token, bảo mật dữ liệu khi dùng LLM, agent có tool, đưa AI từ PoC lên production. sample 80–200 từ giọng Senior có số liệu; phrases 3–6.

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng; không tăng thì chưa được DONE).

## Nghiệm thu
`node --check js/data/drills-qa.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Reviewed-by: kilo (T2408R)
