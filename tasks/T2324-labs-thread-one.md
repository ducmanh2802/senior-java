# T2324 — 1 debug lab thread: HikariCP cạn pool do REQUIRES_NEW lồng trong transaction ngoài

Status: DONE
Agent: kilo
Owns: `js/data/labs-thread.js`
After: T2223

Đọc AGENTS.md mục 10 và đọc KỸ 1 lab mẫu đầy đủ (`lab-thread-011`) để bắt chước cấu trúc. Thêm **ĐÚNG 1 lab**:
- id: lấy số lớn nhất bằng `grep -o "id: 'lab-thread-[0-9]*'" js/data/labs-thread.js | sort -V | tail -1` rồi +1 (KHÔNG dùng lại số cũ — lần trước có agent dùng trùng lab-thread-007 và bị huỷ).
- Tình huống: Pool 10, mỗi request giữ 2 connection (ngoài + REQUIRES_NEW) → từ request đồng thời thứ 6 bắt đầu chờ; jstack ≥ 8 thread http-nio chờ HikariPool.getConnection (ConcurrentBag.borrow), log Hikari 'Connection is not available, request timed out after 30000ms', metric hikaricp_connections_active=10 pending tăng. Sửa: bỏ REQUIRES_NEW / tách sau commit, tăng pool có tính toán, connection-timeout ngắn, giám sát.
- Artifact: jstack 30–150 dòng giống thật (thread name, tid/nid, lock id khớp nhau), thêm 1 artifact log/metric; answer 2500–5000 ký tự với ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; questions 2–3; hints ≥ 2; rubric ≥ 3; tags.
- Chèn object mới NGAY TRƯỚC dòng `);` CUỐI FILE (dùng Edit tại đúng vị trí đó), KHÔNG viết lại file, KHÔNG đụng object cũ. Không backtick, không `${`.

## Nghiệm thu
`node --check js/data/labs-thread.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK (không có lỗi id trùng). Đếm lab trước/sau: `grep -c "^  id: 'lab-thread" js/data/labs-thread.js` tăng đúng 1. KHÔNG commit. Status: DONE + id vào Notes.

## Notes
- Added lab-thread-019 (HikariCP pool exhaustion due to REQUIRES_NEW nested in outer transaction).
