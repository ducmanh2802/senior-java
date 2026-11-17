# T2365 — 20 câu trắc nghiệm lấp lỗ hổng: SQL, HTTP, Git, Linux cho dev Java

Status: DONE
Agent: kilo
Owns: `js/data/quiz-gaps.js`
After: T2270

Định dạng QUIZ; grep q: để không trùng. Thêm 20 câu: JOIN/GROUP BY/HAVING bẫy NULL, index composite, HTTP status 401/403/409/422, cache header, git rebase vs merge, cherry-pick, Linux top/ss/lsof/grep log, chmod, cron. 1/4 multi (Chọn 2/Chọn 3 khớp answer.length), explain vì sao từng phương án sai, đáp án rải đều.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/quiz-gaps.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

## Notes
Added 20 quiz questions (sql-033..034, api-041..045, devops-094..103); multi: api-042, devops-103. node --check OK.
