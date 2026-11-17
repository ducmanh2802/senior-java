# T2315 — 5 câu phỏng vấn Spring Data/JPA mới

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T2196

Thêm 5 câu: optimistic locking @Version khi 2 request sửa cùng đơn hàng (retry ở đâu), batch insert với Hibernate (hibernate.jdbc.batch_size, IDENTITY chặn batch, SEQUENCE + pooled optimizer), projection DTO/interface để tránh load entity nặng, @Transactional(readOnly = true) thực sự làm gì với Hibernate 6 + PostgreSQL, phân trang dữ liệu lớn: keyset pagination với Spring Data. Đúng chuẩn AGENTS.md mục 6 (Tóm tắt, ### cơ chế, code ≤30 dòng, ### Ví dụ đời thực có số liệu, ### Trả lời mẫu khi phỏng vấn, > Senior tip:, 3000–5000 ký tự). Dùng qtool.js list để không trùng ý.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm, không được giảm) — task trước từng xoá nhầm câu cũ.

## Nghiệm thu
`node --check js/data/q-spring-data.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

Đã thêm 5 câu mới (append qua `node scripts/qtool.js append`, không sửa/xoá mục cũ), tất cả thuộc topic `jpa`:

- **jpa-070** (senior) — `@Version` khi 2 request sửa cùng đơn hàng: cơ chế UPDATE có điều kiện, vì sao retry trong `@Transactional` vô nghĩa (L1 cache + rollback-only), đặt retry ở đâu (RetryTemplate/@Retryable ở tầng điều phối, bean @Transactional riêng), bẫy side-effect không idempotent.
- **jpa-071** (senior) — batch insert: vì sao `IDENTITY` phá batch (phải insert từng dòng lấy generated key), `SEQUENCE` + `allocationSize` (pooled), `batch_size`, `order_inserts`, `flush/clear` chunk, và **kiểm chứng bằng `generate_statistics`/`getPrepareStatementCount`/datasource-proxy** (đếm số câu INSERT).
- **jpa-072** (senior) — projection: derived query + interface projection KHÔNG giảm cột (vẫn select cả entity), chỉ `@Query` (select cột / constructor expression) mới giảm I/O; closed vs open projection (`@Value` SpEL) và nguy cơ N+1.
- **jpa-073** (senior) — `@Transactional(readOnly = true)` trên Hibernate 6 + PostgreSQL: hai tầng (FlushMode.MANUAL → "im lặng" mất UPDATE; `Connection.setReadOnly` → PostgreSQL enforce "cannot execute INSERT in a read-only transaction"), bảng "im lặng vs ném lỗi", vì sao MySQL thường bỏ qua.
- **jpa-074** (lead) — keyset/cursor pagination bằng Spring Data: tự viết `@Query` với tie-breaker `id`, cursor opaque (base64), mẹo `size+1`, index khớp `ORDER BY`, khi nào buộc quay về `OFFSET`.

Số id trước/sau (theo topic):
- `jpa`: 069 → **074** (thêm 5: jpa-070…074)
- `db`: 058 → 058 (không đổi)
- `spring`: 094 → 094 (không đổi)

Kiểm tra:
- `node --check js/data/q-spring-data.js` → SYNTAX OK
- `node scripts/qtool.js check js/data/q-spring-data.js` → OK
- `node scripts/build-light-index.js` → đã chạy lại (index-light.js cập nhật)
- `node scripts/validate.js` → **không còn lỗi thuộc file này**. LỖI duy nhất còn lại là `sdlc.js: lỗi cú pháp/chạy: missing ) after argument list` — đây là WIP chưa commit của agent khác (bản HEAD của sdlc.js hợp lệ, `git status` cho thấy sdlc.js đang bị sửa dở), KHÔNG thuộc quyền sở hữu của T2315 nên không tự sửa (AGENTS.md luật 3). Khi agent kia hoàn tất, validate sẽ OK toàn cục.

Lưu ý: đã cố ý chọn góc nhìn KHÁC với các câu đã có (jpa-004/025/030/047/050/055/066/069, db-005/057, jpa-014/016/033/051/061/062) — mỗi câu mới đào sâu một khía cạnh chưa được hỏi: retry boundary, kiểm chứng batch bằng số liệu, derived-vs-@Query projection, readOnly "im lặng" vs PostgreSQL enforce, và tự cài keyset trong Spring Data.
Reviewed-by: kilo (T2315R)
