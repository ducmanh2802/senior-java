# T772 — 2 bài JVM: đọc GC log và thread dump bằng code

Status: DONE
Agent: qoder
Owns: `js/data/lessons-jvm.js`

Track **jvm** đã có một số bài (đọc hết file, không trùng). Thêm các bài dưới, id và order tiếp nối số lớn nhất hiện có, bài tập Java thuần chạy với Java 17 và tự chấm (≥ 4 case mỗi bài tập). Nếu một chủ đề đã có thì chọn chủ đề cùng track chưa có và ghi lý do vào Notes.

1. **Đọc GC log JDK 17 (G1)**: dòng log unified logging trông thế nào, pause young/mixed/full, tính throughput và p99 pause, dấu hiệu cần tăng heap hay sửa leak. Bài tập: `GcLogStats` parse các dòng `[12.345s][info][gc] GC(7) Pause Young (Normal) (G1 Evacuation Pause) 512M->128M(1024M) 8.123ms`, trả về số lần pause theo loại, tổng pause, p99, throughput %.
2. **Thread dump: tìm deadlock và thread bị block**: định dạng jstack (state, "waiting to lock <0x...>", "- locked <0x...>"), BLOCKED vs WAITING vs TIMED_WAITING, cách đọc để tìm chu trình khoá. Bài tập: `DumpAnalyzer` nhận text thread dump, dựng đồ thị thread→lock→owner, trả về danh sách thread nằm trong deadlock (tìm chu trình) và top lock bị chờ nhiều nhất.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-jvm.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes

**Đã thêm 2 bài vào `js/data/lessons-jvm.js` (chỉ chèn object mới ngay trước `);` cuối file — không sửa/viết lại bài cũ):**

| id | order | title | bài tập |
|---|---|---|---|
| `lesson-jvm-006` | 6 | Đọc GC log JDK 17 (G1): đếm pause theo loại, tính throughput và p99 bằng code | `GcLogStats` — 10 case |
| `lesson-jvm-007` | 7 | Thread dump: đọc jstack, phân biệt BLOCKED/WAITING/TIMED_WAITING, dựng đồ thị chờ để tìm deadlock | `DumpAnalyzer` — 9 case |

- **Không phải đổi chủ đề**: cả hai chủ đề trong task đều **chưa** có bài nào trong file (5 bài cũ: jvm-001..005). Write đầy đủ theo yêu cầu gốc.
- `GcLogStats`: `pausesByType / totalPauseMs / pausePercentileMs / throughputPct`. Parse 4 nhãn pause G1 bằng unified logging; percentile theo nearest-rank (`k = ceil(p/100*n)`); throughput làm tròn **xuống** 2 chữ số bằng số nguyên micro-giây (test cố tình phân biệt 95.66 vs 95.67); chịu CRLF; log rỗng không chia 0.
- `DumpAnalyzer`: `statesByThread / deadlockThreads / topContendedLocks`. Dựng đồ thị thread → lock → owner từ `- waiting to lock <0x…>` / `- locked <0x…>` / `- parking to wait for  <0x…>` / `Locked ownable synchronizers`, đi theo con trỏ (out-degree = 1) để bắt chu trình; phân biệt `wait()` trên condition (đã nhả monitor) với chờ khoá; tên kết quả sắp tăng dần nên deterministic.
- Bài 007 có `~~~seq` cho vòng khoá 4 bên (T-A / Lock-1 / T-B / Lock-2) theo luật sơ đồ ≥ 3 hệ thống.
- Body viết cho người ~4 năm chưa đụng observability: giải thích từng thuật ngữ lần đầu xuất hiện (IHOP, To-space exhausted, humongous, safepoint, humongous region…), ví dụ log/dump thật, bảng quyết định, pitfall production, `> Senior tip:`, và mục "### Liên hệ phỏng vấn" cuối mỗi bài.

**Cổng nghiệm thu (đã chạy, tất cả xanh):**
- `node scripts/test-lessons.js lesson-jvm-006` → `RESULT 10/10`, `node scripts/test-lessons.js lesson-jvm-007` → `RESULT 9/9` (reference pass hết; starter biên dịch được và không pass hết).
- `node scripts/test-lessons.js` → `Lesson exercises OK: 162/162`.
- `node scripts/build-light-index.js` → đã ghi lại `js/data/index-light.js` (132.4 KB) — file sinh tự động, có 2 entry mới.
- `node scripts/validate.js` → **`OK — không có lỗi.`**
- `git diff --stat js/data/lessons-jvm.js` → `911 insertions(+)`, 0 deletion. Đếm id trước = 5, sau = 7 (đúng +2).
- Quét codepoint tiếng Việt (FOREIGN_SCRIPT / FULLWIDTH / MOJIBAKE / NFD / INVISIBLE) trên file: sạch, không ký tự lạ, không backtick, không `${` trong template literal.

**Đề xuất cho integrator (2 file ngoài quyền sở hữu của task, tôi không sửa):**
1. `js/data/path.js:33` — thêm 2 id vào danh sách lessons của track jvm: `['lesson-jvm-001', …, 'lesson-jvm-005', 'lesson-jvm-006', 'lesson-jvm-007']`. Hiện `validate.js` đang **CẢNH BÁO** (không phải lỗi): `path.js: có 4 bài học không nằm trong PATH: lesson-jvm-006, lesson-jvm-007, lesson-aws-005, lesson-aws-006` — trong đó `lesson-aws-005/006` đã tồn tại trước task này.
2. Bản dịch Anh văn `js/i18n/lessons-jvm-*.en.js` (dòng `ids:` trong header + `App.i18n.content({...})`) là luồng task khác (`en-lessons-*`), cần thêm `lesson-jvm-006 lesson-jvm-007` khi dịch.

Không commit, không tạo branch theo luật 4.
Reviewed-by: kilo (T772R)
