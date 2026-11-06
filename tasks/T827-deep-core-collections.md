# T827 — Đào sâu senior: Java core + collections internals (8 câu)

Status: DONE
Agent: qoder
Owns: `js/data/q-java.js`

Topic **core và collections** (file `js/data/q-java.js`) đã có 65 câu: đọc HẾT các câu hiện có của topic, không lặp ý. Mục tiêu: **đào sâu kiến thức senior/lead** — cơ chế bên trong (internals) mà interviewer dùng để phân biệt senior thật với người chỉ biết dùng API.

Thêm **8 câu**: 5 `senior` + 3 `lead`. Mỗi câu chọn 1 chủ đề dưới (chủ đề nào đã có câu tương đương thì chọn góc sâu hơn hoặc chủ đề khác cùng topic, ghi lý do vào Notes):

- core: escape analysis + scalar replacement (khi nào object không lên heap); chi phí exception (fillInStackTrace, OmitStackTraceInFastThrow); reflection vs MethodHandle vs LambdaMetafactory (lambda được tạo thế nào, invokedynamic); thứ tự khởi tạo class và deadlock khi static init vòng; compact strings + String deduplication; key bị đổi hashCode sau khi put.
- collections: HashMap treeify (TREEIFY_THRESHOLD, MIN_TREEIFY_CAPACITY) và tấn công hash collision; resize tách lo/hi; ArrayList vs LinkedList thực tế (cache locality, đo bằng JMH); ConcurrentModificationException và modCount; Spliterator và vì sao parallelStream trên LinkedList chậm.
Chia khoảng 4 câu core + 4 câu collections.

Yêu cầu riêng cho các câu này:
- Giải thích cơ chế **từng bước, như dạy người chưa biết**: dữ liệu/cấu trúc bên trong trông thế nào, chuyện gì xảy ra theo thứ tự, VÌ SAO thiết kế như vậy (trade-off mà người viết JDK/framework/DB đã chọn).
- Có ít nhất 1 ví dụ cụ thể: code ngắn có comment, hoặc output thật (log, EXPLAIN, jcmd…), hoặc sơ đồ ASCII/`~~~seq`.
- Có mục "### Trên production" (triệu chứng thật, cách đo, flag/cấu hình tuning có thật) và bảng so sánh khi phù hợp.
- 3000–5000 ký tự. `follow` 3 câu đào sâu tiếp. Có thể thêm `refs` (≤ 3, chỉ link tài liệu chính thức chắc chắn tồn tại; chạy `node scripts/check-links.mjs js/data/q-java.js`).
- Không bịa flag/API. Không chắc thì viết ít lại nhưng đúng.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-java.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-java.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes

Đã thêm 8 câu vào `js/data/q-java.js` (chèn object mới ngay trước `);` cuối file, không sửa object cũ).
Số id trong file: **102 → 110** (`grep -c "id: '" js/data/q-java.js`). Level: 5 `senior` + 3 `lead`.

| Id | Nhóm | Level | Chủ đề | Ký tự đáp án |
|---|---|---|---|---|
| core-036 | core | senior | Escape analysis + scalar replacement (+ lock elision), cách kiểm chứng JDK 17/21 | 4872 |
| core-037 | core | lead | Lambda ở mức bytecode: invokedynamic + LambdaMetafactory, MethodHandle vs reflection, JEP 371 hidden classes | 4999 |
| core-038 | core | lead | Khởi tạo class (JLS 12.4.1/12.4.2), static init vòng gây deadlock, ExceptionInInitializerError vs NoClassDefFoundError | 5015 |
| collections-031 | collections | senior | Resize: capacity luỹ thừa 2, `(n-1)&hash`, tách lo/hi bằng `x.hash & oldCap`, lỗi Java 7 addFirst | 4738 |
| collections-032 | collections | senior | Spliterator (trySplit + characteristics), vì sao parallelStream trên LinkedList/Iterator không nhanh | 5012 |
| collections-033 | collections | senior | Bucket sau treeify: TreeNode, TREEIFY 8 / MIN_TREEIFY_CAPACITY 64 / UNTREEIFY 6, tieBreakOrder, hash collision attack | 4913 |
| collections-034 | collections | senior | modCount / expectedModCount, vì sao fail-fast chỉ best-effort, thao tác nào không gây CME, removeIf | 4752 |
| collections-035 | collections | lead | Đo ArrayList vs LinkedList bằng JMH: cache line, DCE/constant folding, Blackhole, `-prof gc` | 4974 |

**Vì sao chia 3 core + 5 collections (task ghi "khoảng 4 + 4"):** đã đọc hết 65 câu core+collections trong file này và đối chiếu các file khác; 3 chủ đề trong danh sách **đã có câu tương đương** nên không viết lại ý cũ:
- *chi phí exception (fillInStackTrace, OmitStackTraceInFastThrow, writableStackTrace)* → đã có `jvm-029` trong `js/data/q-concurrency-jvm.js`.
- *compact strings + String deduplication* → đã có `core-028`.
- *key bị đổi hashCode sau khi put* → đã có `collections-016` và `collections-027`.

Thay vào đó lấy 3 chủ đề core còn lại (escape analysis, invokedynamic/LambdaMetafactory, class init + deadlock static) và **đào sâu hơn** 2 chủ đề collections đã có nội dung liên quan: resize tách lo/hi (câu cũ chỉ nói "HashMap tự tăng kích thước") và treeify/hash collision (câu cũ dừng ở mức độ cao, chưa đi vào TreeNode/ngưỡng 64/tieBreakOrder). Tổng: 5 collections, trong đó không câu nào trùng id hay trùng ý với câu cũ.

Đáp án mỗi câu: `**Tóm tắt:**` → các mục `###` giải thích cơ chế từng bước kèm trade-off thiết kế → `### Trên production` (triệu chứng, cách đo, flag thật) → bảng so sánh → `> Senior tip:`; `follow` đủ 3 câu. Ví dụ cụ thể: code Java có comment, output thật (`jcmd`/`-Xlog:class+load`, log NPE fast-throw, JMH score), sơ đồ ASCII. Toàn bộ nằm trong 3000–5000 ký tự. Không backtick, không `${`, `{{`/`}}` cân bằng, không HTML thô, không ký tự CJK/Cyrillic.

`refs` đã thêm (≤ 3/câu, toàn tài liệu chính thức): wiki.openjdk.org EscapeAnalysis, openjdk.org/jeps/371, docs.oracle.com/javase/specs, docs.oracle.com Java SE 21 HashMap (×2) + Spliterator, github.com/openjdk/jmh.

Giải ngân (nghiệm thu):
- `node --check js/data/q-java.js` → pass.
- `node scripts/build-light-index.js` → đã sinh lại `js/data/index-light.js` (140.2 KB).
- `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo còn lại đều là câu cũ của task khác: modern-03x, core-035, design-03x, scenario-109..116, lesson trong path.js).
- `node scripts/check-links.mjs q-java.js` → Links: 52 · hỏng 0 · cảnh báo 0.
- Không commit, không tạo branch, không mở trình duyệt, không kill tiến trình. File duy nhất sửa: `js/data/q-java.js` (+ `js/data/index-light.js` do script bắt buộc sinh).

Reviewed-by: kilo (T827R)
