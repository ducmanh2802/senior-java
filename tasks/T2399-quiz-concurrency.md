# T2399 — 20 câu trắc nghiệm concurrency Java

Status: DONE
Agent: kilo
Owns: `js/data/quiz-java.js`
After: T2312

Định dạng QUIZ; grep q: để không trùng. 20 câu: volatile vs synchronized, happens-before, ConcurrentHashMap compute, CompletableFuture thenApply vs thenCompose và executor, ExecutorService shutdown, virtual threads pinning (ghi đúng phiên bản), ThreadLocal leak, deadlock điều kiện. 1/4 multi (Chọn N khớp answer.length), explain từng phương án, đáp án rải đều.

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng; không tăng thì chưa được DONE).

## Nghiệm thu
`node --check js/data/quiz-java.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
