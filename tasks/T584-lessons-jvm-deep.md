# T584 — 2 bài học JVM có bài tập tự chấm

Status: TODO
Agent: qoder
Owns: `js/data/lessons-jvm.js`

Track jvm có 3 bài. Thêm 2 bài (order tiếp nối); đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước:
1. **Memory leak trong Java và cách tìm**: reachability, GC root, leak qua static collection / listener / ThreadLocal / cache không giới hạn; WeakReference/SoftReference; heap dump + dominator tree. Bài tập: `BoundedCache<K,V>` LRU (LinkedHashMap removeEldestEntry) + registry listener có hàm gỡ đăng ký; test KHÔNG dựa vào System.gc().
2. **Bộ nhớ JVM trong container**: heap vs metaspace vs thread stack vs direct buffer vs code cache; MaxRAMPercentage; NMT; ngân sách bộ nhớ Pod. Bài tập: `MemoryBudget.plan(podLimitMb, threads, stackKb, directMb, metaspaceMb, codeCacheMb)` trả heap tối đa an toàn (headroom ≥ 10%) và báo lỗi khi không đủ; ≥ 4 case test.
Body ≥ 2500 ký tự, kết bằng "### Liên hệ phỏng vấn". Java 17, deterministic.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes.

## Notes
