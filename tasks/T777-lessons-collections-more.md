# T777 — 2 bài collections: ConcurrentHashMap đúng cách và PriorityQueue

Status: DONE
Agent: qoder
Owns: `js/data/lessons-collections.js`

Track **collections** đã có một số bài (đọc hết file, không trùng). Thêm các bài dưới, id và order tiếp nối số lớn nhất hiện có, bài tập Java thuần chạy với Java 17 và tự chấm (≥ 4 case mỗi bài tập). Nếu một chủ đề đã có thì chọn chủ đề cùng track chưa có và ghi lý do vào Notes.

1. **ConcurrentHashMap: compute, merge, putIfAbsent và lỗi check-then-act**: vì sao get rồi put mất cập nhật dưới tải, LongAdder, computeIfAbsent không được gọi lại map bên trong. Bài tập: `HitCounter` đếm theo key từ 8 thread, phải chính xác tuyệt đối (lặp nhiều lần để code sai lộ lỗi).
2. **PriorityQueue và heap: top-K, merge K danh sách, lập lịch job**: Comparator ổn định, vì sao iterator không theo thứ tự, độ phức tạp. Bài tập: `TopK.of(stream, k)` bằng min-heap kích thước k, và `Scheduler` lấy job theo priority rồi theo thời gian tạo.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-collections.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes

**Done 2026-11-06 (agent qoder).** File `js/data/lessons-collections.js` chỉ được THÊM: số `id: '` 5 → 7, không sửa object cũ.

### Lý do đổi chủ đề (dùng quyền chọn chủ đề khác cùng track mà task cho phép)
Cả 2 chủ đề trong đề bài **đã có bài trong track collections**, viết lại sẽ trùng:
- ConcurrentHashMap / compute / merge / check-then-act → đã là `lesson-collections-003`.
- PriorityQueue / heap / top-K / merge K danh sách → đã là `lesson-collections-005` (đã có bài tập `TopK` và `Scheduler`).

Nên chọn 2 chủ đề cùng track chưa có bài nào, và là chủ đề hay bị hỏi trong phỏng vấn:

### Bài đã thêm
1. `lesson-collections-006` (order 6, senior, 30′) — **Iterator từ bên trong: modCount, fail-fast, removeIf, ListIterator và tự viết một Iterable.** Body: for-each chỉ là Iterator đội lốt; so `modCount` với `expectedModCount` và bẫy "chỉ `next()` mới kiểm tra nên có thể sai mà không nổ"; 4 cách xoá khi đang lặp + bảng giá; view (`subList`/`keySet`/`entrySet`) và leak memory của `subList`; fail-fast vs snapshot (`CopyOnWriteArrayList`) vs weakly consistent (`ConcurrentHashMap`) — phần này thay cho chủ đề ConcurrentHashMap đã có bài, chỉ nói ở góc iterator; `ListIterator`; tự viết `Iterable`/`Iterator` (prefetch) và vì sao cần override `spliterator()` cho parallel stream.
   - BT1 `SessionStore.removeExpired/liveIds` (7 case, có case 5000 entry bắt lỗi "sót phần tử cuối" và case bắt lỗi trả view thay vì snapshot).
   - BT2 tự viết `PeekingIterator` (8 case, gồm `IllegalStateException` khi remove sai thời điểm, remove 2 lần, tách câu theo dấu chấm).
2. `lesson-collections-007` (order 7, senior, 30′) — **Sắp xếp trong Java: Comparable hay Comparator, TimSort ổn định và lỗi "Comparison method violates its general contract!".** Body: Comparable vs Comparator; TimSort (run, insertion sort cho run ngắn, ổn định, ~n/2 bộ nhớ tạm); vì sao `Arrays.sort(int[])` (dual-pivot quicksort) và `PriorityQueue` KHÔNG ổn định; 3 điều kiện tổng thứ tự + vì sao exception phụ thuộc kích thước/dữ liệu; overflow khi trừ, NaN; key đổi trong lúc sort; `reversed()` đặt sai chỗ; `nullsFirst/nullsLast`; collation tiếng Việt (`Collator` + NFC/NFD); tie-breaker khi phân trang (có khối `~~~seq` Client/API/DB); dữ liệu lớn (external merge sort, top-K heap).
   - BT1 `Ordering.byScore/sorted` cho bảng xếp hạng (8 case: cực trị `Long.MIN/MAX`, ±4e9 bắt lỗi trừ; không mutate đầu vào + trả list khác; lọc null; kiểm tra hợp đồng comparator bằng fuzz 4000 bộ ba; sort 20 000 phần tử trùng nhiều để bắt lỗi contract).
   - BT2 `Scheduler.byPriority/rankByPriority` (7 case: tính ổn định của `List.sort`, cực trị int, dense rank, mọi phần tử bằng nhau, không phụ thuộc thứ tự đầu vào).

### Nghiệm thu (đã chạy, tất cả xanh)
- `node scripts/test-lessons.js lesson-collections-006` → `OK: 2/2` (7/7 và 8/8; starter biên dịch được và không pass hết).
- `node scripts/test-lessons.js lesson-collections-007` → `OK: 2/2` (8/8 và 7/7).
- `node scripts/test-lessons.js` (toàn bộ) → `Lesson exercises OK: 177/177 (155 bài học)` — không hồi quy bài khác.
- `node scripts/build-light-index.js` → `js/data/index-light.js` (136.8 KB).
- `node scripts/validate.js` → `Bài học: 155 bài, 177 bài tập (collections 7, …)` và **`OK — không có lỗi.`** (console Windows in dấu tiếng Việt bị lỗi codepage, file nguồn vẫn đúng UTF-8).
- Không commit, không tạo branch.

### Đề xuất cho integrator
1. **Thêm vào `js/data/path.js`**: `lesson-collections-006`, `lesson-collections-007` (validate đang cảnh báo "12 bài học không nằm trong PATH", trong đó có 2 id này — gộp cùng các bài modern/jvm/testing/ai của task khác).
2. Không có gì thuộc file ngoài phạm vi T777 bị sửa. Lưu ý ngoài lề (không thuộc task này, chỉ báo): `q-aws.js` có vài dòng tiếng Anh lẫn trong prose ("Cách avoid") và `validate` đang cảnh báo nhiều đáp án ngắn (`modern-031..038`, `design-030..035`, `scenario-109..116`) — để task tương ứng xử lý.
Reviewed-by: kilo (T777R)
