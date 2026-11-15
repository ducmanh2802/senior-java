# T2105 — 5 câu hỏi Senior Java (collections) vào q-java.js

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T2098

Thêm **5 câu hỏi phỏng vấn mới** (topic: collections) vào `js/data/q-java.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-java.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Collections trên production: HashMap resize và treeify, ConcurrentHashMap khác synchronizedMap thế nào, ArrayList vs LinkedList thực tế, PriorityQueue cho top-K, bộ nhớ của collection lớn (boxing, object header), fail-fast iterator.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 5 câu vào `js/data/q-java.js`: **collections-052** (List vs Set trong @OneToMany: PersistentBag/PersistentSet, MultipleBagFetchException, equals/hashCode, N+1 + @BatchSize), **collections-053** (lead — chống trùng 1 tỷ Long ID: HashSet ~53 B/phần tử, BitSet 125 MB, set nguyên thủy, unique index DB, Bloom filter và vì sao không dùng cho tiền), **collections-054** (size() O(n) của ConcurrentLinkedQueue/ConcurrentLinkedDeque vs O(1) của Array/LinkedBlockingQueue; queue không giới hạn, backpressure, đo an toàn), **collections-055** (sort 50 triệu primitive: Arrays.sort dual-pivot vs List<Integer>/TimSort vs parallelSort, top-K heap, external sort), **collections-056** (null semantics: HashMap vs Hashtable vs ConcurrentHashMap vs TreeMap vs List.of vs Collectors.toMap; getOrDefault vs computeIfAbsent/putIfAbsent).
- File đã có tới `collections-051` từ các task trước; các góc task gợi ý (HashMap resize/treeify, CHM vs synchronizedMap, ArrayList vs LinkedList, PriorityQueue top-K, memory collection lớn, fail-fast) đã có ở collections-001..051 nên 5 câu mới chọn góc khác, không trùng.
- Đã chạy: `node --check js/data/q-java.js` OK; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ có cảnh báo path.js về lessons cũ, không liên quan). `git diff --stat js/data/q-java.js`: 328 insertions, 0 deletions (chỉ thêm, không sửa mục cũ). Không commit.
- Level: 4 senior + 1 lead (collections-053), đúng yêu cầu. Mỗi câu có Tóm tắt, cơ chế từng bước, code ≤ 30 dòng có comment, bảng trade-off, bẫy production, Ví dụ đời thực có số liệu, Trả lời mẫu 183–206 từ, Senior tip, follow 3 câu.
Reviewed-by: kilo (T2105R)
