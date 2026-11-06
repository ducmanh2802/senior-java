# T786 — 8 câu nền tảng cho người hổng kiến thức

Status: DONE
Agent: kilo
Owns: `js/data/q-primer.js`

Topic **primer** đã có 17 câu: đọc HẾT các câu hiện có, không lặp lại nội dung, chỉ đào sâu góc khác. Câu hỏi theo kiểu phỏng vấn thật ở Việt Nam 2025–2026 (công ty product, ngân hàng, outsource lớn). Đọc mô tả topic primer trong js/data/topics.js để đúng tinh thần (nền tảng cho người mới lên senior). Thêm 8 câu level mid, giải thích từ gốc: process vs thread vs core CPU, stack vs heap ở mức OS, TCP handshake và connection pool vì sao cần, DNS phân giải thế nào, HTTPS/TLS bắt tay đơn giản, index B-tree trực quan, encoding (UTF-8, byte vs char), độ phức tạp Big-O qua ví dụ thực tế backend.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-primer.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-primer.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes
- Đã đọc hết 17 câu primer hiện có (primer-001 → primer-017) và topics.js (primer: nền tảng cho người mới lên senior). Id lớn nhất trước: 017; sau khi thêm: 025 (+8).
- Đếm id: `grep -c "id: 'primer-" js/data/q-primer.js` = 25 (trước 17).
- Thêm 8 câu level `mid`, chỉ chèn mới trước `);` cuối `js/data/q-primer.js` (không sửa/xóa câu cũ):
  - `primer-018`: Process vs thread vs core CPU (bối cảnh Spring Boot/Tomcat thread pool, I/O-bound vs CPU-bound, ASCII, bảng so sánh, context switch).
  - `primer-019`: Stack vs heap ở mức OS/JVM (primitive/reference/object, stack frame, GC, ASCII, `StackOverflowError` vs `OutOfMemoryError`, ví dụ rename/reassign).
  - `primer-020`: TCP 3-way handshake + vì sao cần connection pool (sơ đồ `~~~seq`, RTT/chi phí, HikariCP config, pool exhaustion).
  - `primer-021`: DNS phân giải (sơ đồ `~~~seq` resolver→root→TLD→authoritative, TTL/cache, `UnknownHostException`).
  - `primer-022`: HTTPS/TLS bắt tay đơn giản (sơ đồ `~~~seq`, certificate/CA, mã hóa bất đối xứng→khóa phiên đối xứng, `PKIX path building failed`).
  - `primer-023`: Index B-tree trực quan (full scan vs cây cân bằng ASCII, composite index, khi index không tác dụng, `EXPLAIN`).
  - `primer-024`: Encoding UTF-8, byte vs char (Unicode code point, ví dụ "Nguyễn" 6 ký tự/8 byte UTF-8, `StandardCharsets.UTF_8`, DB `utf8mb4`).
  - `primer-025`: Big-O qua ví dụ backend (O(1)/O(log n)/O(n)/O(n log n)/O(n^2), bảng tăng trưởng, `HashMap` vs `List.contains` trong vòng lặp, index/EXPLAIN).
- Mỗi câu: `**Tóm tắt:**` → bối cảnh thật/thuật ngữ/cơ chế từng bước/ví dụ (code/số liệu/sơ đồ)/bảng trade-off/pitfall production → `> Senior tip:`; `follow` 2 câu; giải thích từ gốc cho dev 4 năm ít va chạm công nghệ.
- `primer-020`, `primer-021`, `primer-022` dùng khối `~~~seq` (luồng nhiều bên). Không backtick, không `${` trong template literal.
- Kiểm tra: `node --check js/data/q-primer.js` OK; `node scripts/build-light-index.js` (đã ghi `js/data/index-light.js`); `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo còn lại là file khác, pre-existing). Không commit.
Reviewed-by: kilo (T786R)
