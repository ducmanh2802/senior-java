# T2388 — 1 bài học bảo mật: kiểm quyền theo object (chống IDOR)

Status: DONE
Agent: kilo
Owns: `js/data/lessons-security.js`
After: T2166

Đọc AGENTS.md mục 12 + bài mẫu lesson-collections-001; grep title: để không trùng. Thêm ĐÚNG 1 bài (id tiếp số lớn nhất, order tiếp theo), body ≥ 2500 ký tự dạy từ gốc, 1–2 bài tập Java thuần JDK 17 test ≥ 3 case xác định, check 2–4 câu. Chủ đề: authentication vs authorization, IDOR, kiểm quyền ở service layer, policy theo owner/role, test phân quyền. Bài tập AccessPolicy.canRead(user, account) + service áp dụng.

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes.

## Nghiệm thu
`node --check js/data/lessons-security.js`, `node scripts/build-light-index.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Added lesson-security-014: "IDOR và kiểm soát truy cập tại Service Layer" (track security, order 14, level senior, 40 minutes). This lesson teaches about IDOR, authentication vs authorization, and implementing AccessPolicy in Service Layer. The exercise implements AccessPolicy.canRead(user, account) and applies it in AccountService.getAccount().
Reviewed-by: kilo (T2388R)
