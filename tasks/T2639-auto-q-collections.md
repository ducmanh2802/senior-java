# T2639 — 3 câu hỏi Senior Java (collections) vào q-java.js

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T2629

Thêm **3 câu hỏi phỏng vấn mới** (topic: collections) vào `js/data/q-java.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-java.js`); đọc danh sách để **không trùng ý**.

Chủ đề: cache LRU trong bộ nhớ (LinkedHashMap accessOrder + removeEldestEntry) và giới hạn khi đa luồng, đếm top-K sản phẩm bán chạy trong luồng sự kiện (HashMap + PriorityQueue), Collections.unmodifiableList vs List.copyOf vs List.of khi trả về từ API.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment hoặc ~~~seq cho luồng nhiều bên → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/q-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 3 câu hỏi vào `js/data/q-java.js` (append bằng `node scripts/qtool.js append`, id nối tiếp `collections-057`):

- **collections-058** (senior, ~6314 ký tự): LRU bằng `LinkedHashMap` access-order + `removeEldestEntry` **và giới hạn đa luồng**. Góc khác với `collections-005` (cách dựng LRU cơ bản): tập trung vào vì sao `get` trong access-order là thao tác **ghi** → hỏng danh sách/CME/mất entry → vượt max → OOM/treo; vì sao `synchronizedMap` không cứu về throughput; thiết kế đúng (striped locks, LRU xấp xỉ CLOCK/sampling, Caffeine W-TinyLFU).
- **collections-059** (senior, ~5804 ký tự): đếm top-K sản phẩm bán chạy trên luồng sự kiện = `HashMap` đếm tần suất + min-heap `PriorityQueue` size K. Góc khác `collections-009` (giải thích heap/top-K chung): hai bẫy (count đổi theo thời gian → phải rebuild heap mỗi cửa sổ; **gộp phân tán cho COUNT phải cộng dồn theo mã rồi mới heap**, không lấy top-K cục bộ rồi trộn) + Count-Min Sketch.
- **collections-060** (lead, ~5019 ký tự): `Collections.unmodifiableList` vs `List.copyOf` vs `List.of` **khi trả về từ API**. Góc khác `collections-011` (ngữ nghĩa từng loại): ở mức lead — chính sách biên service, chi phí copy O(1) khi gốc bất biến, view "sống" vs snapshot nhất quán, null ở DTO, guideline review.

Mỗi câu đủ `**Tóm tắt:**` → cơ chế từng bước/vì sao → code ≤ 30 dòng → bảng trade-off → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 3 câu; có `tags` và `refs` (link chính thống: Caffeine wiki, API Java 21). Không backtick, không `${`.

Nghiệm thu:
- `node --check js/data/q-java.js` → OK.
- `node scripts/qtool.js check js/data/q-java.js collections-058 collections-059 collections-060` → OK.
- `node scripts/validate.js q-java.js` → OK cho q-java.js (không lỗi/cảnh báo cho file này).

**Blocker bên ngoài (không thuộc quyền sở hữu của task, KHÔNG tự sửa):** `node scripts/validate.js` (toàn bộ) và `node scripts/build-light-index.js` hiện **không thể OK** vì các file của agent khác đang dở dang:
- `js/data/q-devops.js`: lỗi cú pháp ở object `devops-017` (template `a:` thiếu backtick đóng) → kéo theo `lessons-devops.js`, `path.js`, `projects.js` báo "devops-… không tồn tại".
- `js/data/q-security.js`: trùng id `security-084/085/086`.
- `js/data/labs-thread.js`: `###` bị thụt đầu dòng ở `lab-thread-028/029.answer`.
- `js/data/index-light.js`: đã cũ (cần `node scripts/build-light-index.js`, nhưng script này crash vì `q-devops.js`).
→ Đề xuất: integrator chạy lại `node scripts/build-light-index.js` và `node scripts/validate.js` sau khi các task đồng bộ (T2656 q-devops, q-security, labs-thread) hoàn tất. `index-light.js` cố ý **không** ghi đè để tránh bake trạng thái dữ liệu đang hỏng (index cũ sẽ tự báo stale và được rebuild đúng sau khi merge).
Reviewed-by: kilo (T2639R)
