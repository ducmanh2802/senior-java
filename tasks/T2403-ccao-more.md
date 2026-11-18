# T2403 — 30 câu CCAO-F: Workflow Integration + Product Selection + Knowledge Config

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccao-2.js`
After: T2371

Định dạng QUIZ, topic claude, tag [Domain] đầu q đúng tên domain trong js/data/exams.js; q/options tiếng Anh dạng tình huống, explain tiếng Việt vì sao đúng + vì sao TỪNG phương án sai; phương án nhiễu hợp lý (sai lầm thật), độ dài tương đương; 1/4 multi (Choose 2); id qz-<prefix>-NNN tiếp số LỚN NHẤT toàn js/data. Chỉ điều chắc chắn theo docs Anthropic; model hiện hành Fable 5.2, Opus 5.5, Sonnet 5.5, Haiku 5.5; budget_tokens/temperature/prefill bị 400 trên model mới. Prefix ccao. Domains: [Workflow Integration] 10, [Product Selection] 10, [Knowledge Config] 10.

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng; không tăng thì chưa được DONE).

## Nghiệm thu
`node --check js/data/quiz-ccao-2.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
- Thêm 30 câu vào `js/data/quiz-ccao-2.js` (append trước `);`, không sửa mục cũ): id `qz-ccao-913` … `qz-ccao-942`.
- Id trước: `qz-ccao-258` (lớn nhất file) → sau: `qz-ccao-942` (tăng). Số 913–942 tiếp số LỚN NHẤT toàn js/data (max = `qz-spring-912`), giữ đúng 3 chữ số theo regex validator.
- Phân bổ domain: [Workflow Integration] 10 (913–922), [Product Selection] 10 (923–932), [Knowledge Config] 10 (933–942). Multi (Choose 2) 8/30 ≈ 1/4: 915, 919, 922, 925, 929, 935, 938, 941. Đáp án đúng rải đều 4 vị trí; chỉ dùng khẳng định chắc chắn (model/plan/MCP/Projects), không bịa API.
- Nghiệm thu: `node --check` OK; `node scripts/build-light-index.js` OK (claude 1164 → 1194 trắc nghiệm); `node scripts/validate.js` → "OK — không có lỗi" (chỉ còn cảnh báo có sẵn ở file khác). Không commit.
Reviewed-by: kilo (T2403R)
