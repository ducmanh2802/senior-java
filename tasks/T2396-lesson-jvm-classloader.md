# T2396 — 1 bài học JVM: class loading và memory leak do ClassLoader

Status: DONE
Agent: kilo
Owns: `js/data/lessons-jvm.js`
After: T2255

Đọc AGENTS.md mục 12 + bài mẫu lesson-collections-001; grep title: để không trùng. Thêm ĐÚNG 1 bài (id tiếp số lớn nhất, order tiếp theo), body ≥ 2500 ký tự dạy từ gốc, 1–2 bài tập Java thuần JDK 17 test ≥ 3 case xác định, check 2–4 câu. Chủ đề: class loader hierarchy, parent delegation, metaspace, leak khi redeploy/ThreadLocal giữ class. Bài tập mô phỏng registry giữ tham chiếu gây leak và bản sửa (WeakReference/clear), test bằng đếm tham chiếu (không dựa GC thật).

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng; không tăng thì chưa được DONE).

## Nghiệm thu
`node --check js/data/lessons-jvm.js`, `node scripts/build-light-index.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Added lesson-jvm-010 (order 10), previous highest was lesson-jvm-009 (order 9). All validation checks pass.
Reviewed-by: kilo (T2396R)
