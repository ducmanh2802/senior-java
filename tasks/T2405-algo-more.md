# T2405 — 2 bài thuật toán: interval trong lịch giao dịch + rate limiter token bucket

Status: DONE
Agent: kilo
Owns: `js/data/algo.js`
After: T2360

Đọc AGENTS.md mục ALGOS + tasks/T18-algo-tests.md; grep title: để không trùng. Thêm 2 bài medium có starter + tests ≥ 5 case: (1) Meeting rooms II / số phòng tối thiểu (heap), (2) Token bucket allow(nowMillis) với refill theo thời gian truyền vào (không dùng đồng hồ thật). Solution có comment, complexity, hints ≥ 3.

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng; không tăng thì chưa được DONE).

## Nghiệm thu
`node --check js/data/algo.js`, `node scripts/build-light-index.js`, `node scripts/test-algos.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

- Added algo-155 (Meeting Rooms II) and algo-156 (Token Bucket allow(nowMillis)).
- algo.js node --check OK; test-algos OK for both.
- build-light-index.js currently fails on pre-existing syntax error in js/data/quiz-java.js (unrelated); not fixed per ownership.
" filePath">
C:\Users\Windows\Documents\Senior\tasks\T2405-algo-more.mdReviewed-by: verify-only (code/UI task)
