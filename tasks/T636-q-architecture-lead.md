# T636 — 8 câu kiến trúc cho Lead/Architect

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`

Topic **architecture** có 22 câu trong q-system-design.js (file này còn topic khác, đọc hết câu architecture để không trùng). Thêm 8 câu architecture-0NN tiếp theo, level 2 senior / 6 lead, gợi ý:
- Viết ADR (Architecture Decision Record): khi nào cần, cấu trúc, ví dụ ADR chọn Kafka vs RabbitMQ.
- Modular monolith: ranh giới module, kiểm tra bằng ArchUnit, khi nào tách thành service.
- Strangler fig khi thay hệ thống legacy: routing, đồng bộ dữ liệu hai chiều, khi nào tắt hệ cũ (~~~seq).
- Multi-tenancy cho SaaS B2B: shared schema vs schema-per-tenant vs DB-per-tenant, noisy neighbor.
- Event sourcing: khi nào đáng, khi nào là over-engineering; snapshot, schema evolution của event.
- Cell-based architecture / giới hạn blast radius.
- Chi phí cloud (FinOps) như một thuộc tính kiến trúc: ví dụ con số, trade-off.
- Dẫn dắt quyết định kiến trúc khi team không đồng ý: RFC, spike, tiêu chí đo.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-system-design.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-system-design.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes
- Trước: 22 câu topic `architecture` trong `js/data/q-system-design.js` (id `architecture-001`..`architecture-022`, max 022; tổng id trong file 51). Sau: 30 câu architecture (id mới `architecture-023`..`architecture-030`), tổng id trong file 59. Số sau = số trước + 8 (đúng).
- Id mới (8, level 2 senior / 6 lead):
  - `architecture-023` (lead): ADR — khi nào cần, cấu trúc, ví dụ ADR chọn Kafka vs RabbitMQ.
  - `architecture-024` (senior): Modular monolith — ranh giới module, kiểm tra bằng ArchUnit, khi nào tách service.
  - `architecture-025` (lead): Strangler fig thay legacy — routing, đồng bộ dữ liệu hai chiều, khi nào tắt hệ cũ (có 2 sơ đồ `~~~seq`).
  - `architecture-026` (lead): Multi-tenancy SaaS B2B — shared schema vs schema-per-tenant vs DB-per-tenant, noisy neighbor (có `~~~seq`).
  - `architecture-027` (lead): Event sourcing — khi nào đáng/over-engineering, snapshot, schema evolution của event.
  - `architecture-028` (senior): Cell-based architecture / giới hạn blast radius (có `~~~seq`).
  - `architecture-029` (lead): FinOps/chi phí cloud như thuộc tính kiến trúc — ví dụ con số, trade-off.
  - `architecture-030` (lead): Dẫn dắt quyết định kiến trúc khi team không đồng ý — RFC, spike, tiêu chí đo (có `~~~seq`).
- Kiểm tra: `node --check js/data/q-system-design.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → "OK — không có lỗi." (chỉ cảnh báo path.js pre-existing). Không commit. Không mở trình duyệt, không kill tiến trình theo tên. Chỉ chỉnh `js/data/q-system-design.js` (thêm cuối mảng, trước `);`) và file task này.
Reviewed-by: kilo (T636R)
