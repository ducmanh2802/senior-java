# T859 — 2 debug lab SQL: bloat do autovacuum và N+1 trong pg_stat_statements

Status: DONE
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T821

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab hiện có trong `js/data/labs-sql.js` (đang có 12 lab) để không trùng tình huống. Artifact phải giống THẬT và tự nhất quán (tên thread, lock id, timestamp, số liệu khớp nhau và khớp answer). id tiếp nối số lớn nhất. Thêm 2 lab level senior (PostgreSQL 15+):
1. **Bảng phình to, query chậm dần** vì transaction mở lâu chặn vacuum: pg_stat_user_tables (n_dead_tup), pg_stat_activity idle in transaction, cảnh báo xid age.
2. **N+1 lộ ra trong pg_stat_statements**: một câu SELECT theo id chạy 2 triệu lần/giờ; artifact: pg_stat_statements top, log Hibernate, code entity; cách sửa (fetch join, batch size, DTO projection).

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6 và docs/PLAN-v4-deep.md. Người đọc: dev Java 4 năm, ít va chạm thực tế, cần giải thích **từ gốc, rất chi tiết**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/labs-sql.js`; id tiếp nối số lớn nhất hiện có của topic. Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic (grep "topic: '<id>'") để **không trùng ý**. Góc gợi ý nào đã có thì chọn góc khác cùng mảng.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (cơ chế bên trong, ví dụ code/số liệu, bảng trade-off, pitfall production) → `> Senior tip:`. answer 2500–5000 ký tự.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x. Không bịa flag/API; không chắc thì bỏ.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`.
- `refs` tuỳ chọn, chỉ link chính thức chắc chắn tồn tại; có refs thì chạy `node scripts/check-links.mjs js/data/labs-sql.js`.

## Nghiệm thu
`node --check js/data/labs-sql.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id lab mới vào Notes.

## Notes
Reviewed-by: kilo (T859R)
