# T579 — 8 câu core/collections/modern Java mức thiết kế

Status: TODO
Agent: qoder
Owns: `js/data/q-java.js`

Thêm 8 câu (khoảng 3 core, 2 collections, 3 modern), level senior/lead, hỏi kiểu "bạn thiết kế/xử lý thế nào", không hỏi định nghĩa. Gợi ý góc (chọn cái chưa có):
- modern: Mô hình hoá domain thanh toán bằng sealed interface + record + pattern matching switch (Java 21): exhaustiveness khi thêm loại mới, so với visitor/enum.
- modern: Record làm JPA entity / DTO / key của map: được gì, mất gì (immutability, Jackson, Hibernate).
- modern: parallel stream trên production: khi nào chậm hơn, ForkJoinPool chung, side effect.
- core: Thiết kế exception cho service/thư viện: checked vs unchecked, wrap, mất stack trace, chi phí exception làm control flow.
- core: Immutability và defensive copy trong API public; bug thật khi trả về list nội bộ.
- core: String và bộ nhớ: G1 string dedup, compact strings, nối chuỗi trong vòng lặp, intern: khi nào đáng quan tâm.
- collections: Key mutable trong HashMap/HashSet làm "mất" phần tử: cơ chế bucket, cách phòng.
- collections: Chọn cấu trúc cho cache in-memory 1 triệu entry: HashMap vs ConcurrentHashMap vs LinkedHashMap LRU vs Caffeine; footprint mỗi entry.

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6 và docs/PLAN-v4-deep.md. Người đọc: dev Java 4 năm, cần giải thích **từ gốc, rất chi tiết**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-java.js`; id tiếp nối số lớn nhất hiện có của topic. Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**. Trùng thì chọn góc khác cùng mảng.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (cơ chế bên trong, ví dụ code/số liệu, bảng trade-off, pitfall production) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Đúng kỹ thuật với Java 17/21 (có thể nhắc 25 LTS), Spring Boot 3.x. Không bịa flag/API; không chắc thì bỏ.
- Không backtick, không `${` trong template literal.
- `refs` tuỳ chọn, chỉ link chính thức chắc chắn tồn tại; có refs thì chạy `node scripts/check-links.mjs js/data/q-java.js`.

## Nghiệm thu
`node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes
