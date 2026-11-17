# T2361 — 1 bài học concurrency: lock-free với CAS và false sharing (mô phỏng)

Status: DONE
Agent: kilo
Owns: `js/data/lessons-concurrency.js`
After: T2251

Đọc AGENTS.md mục 12 + bài mẫu lesson-collections-001; grep title: để không trùng. Thêm ĐÚNG 1 bài (id lesson-concurrency-NNN tiếp số lớn nhất, order tiếp theo, senior): CAS (AtomicLong/compareAndSet), vòng lặp retry, ABA ở mức nguyên lý, LongAdder vs AtomicLong khi tranh chấp cao, false sharing và padding (nguyên lý, không phụ thuộc đo thời gian). Bài tập: SpinCounter/BoundedStack lock-free bằng AtomicReference; test xác định bằng ExecutorService + CountDownLatch, lặp nhiều lần, KHÔNG đo thời gian.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/lessons-concurrency.js`, `node scripts/build-light-index.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Added lesson-concurrency-019 (order 19, level: senior) — previous max was lesson-concurrency-018. Lesson covers CAS/AtomicLong/LongAdder, ABA problem, false sharing & padding, with two exercises: SpinCounter (AtomicLong vs LongAdder comparison) and BoundedStack (lock-free stack with AtomicReference). All tests pass deterministically with CountDownLatch.
