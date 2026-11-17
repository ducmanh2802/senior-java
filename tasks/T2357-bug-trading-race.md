# T2357 — 1 bài sửa bug: race condition khớp lệnh khiến số dư âm

Status: DONE
Agent: kilo
Owns: `js/data/bugs.js`
After: T2298

Đọc AGENTS.md mục 17 và bài mẫu bug-001. Thêm ĐÚNG 1 bài (id bug-NNN tiếp số lớn nhất), domain 'Sàn giao dịch / Trading', severity P1: hai lệnh mua cùng lúc của một tài khoản cùng qua bước kiểm tra số dư (check-then-act) → số dư âm. Artifact: log 2 thread có timestamp khớp, số liệu. starter (code đang lỗi, biên dịch được) + tests tái hiện xác định bằng CountDownLatch/CyclicBarrier (≥ 4 case) + reference sửa bằng khoá theo tài khoản hoặc compare-and-set, rootCause, fix ≥ 800 ký tự, hints ≥ 2, related id câu hỏi có thật, tags. Code JDK chuẩn, Java 17, không class public ngoài Main, System.exit(0) cuối nếu có thread.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT (không dùng lại số cũ), không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm, không được giảm).

## Nghiệm thu
`node --check js/data/bugs.js`, `node scripts/build-light-index.js`, `node scripts/test-bugs.js` (reference pass hết, starter không pass hết), `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
- Max bug id trước: bug-037. Đã thêm bug-038 (domain 'Sàn giao dịch / Trading', severity P1, level senior) vào js/data/bugs.js.
- starter/reference + tests chạy OK qua node scripts/test-bugs.js bug-038 (reference 6/6 PASS, starter 5/6 — race condition tái hiện được).
- node scripts/validate.js: không có lỗi liên quan đến bugs.js/bug-038 (lỗi quiz-ccao-2.js là pre-existing, không liên quan).
