# T2325 — 1 debug lab thread: CompletableFuture.supplyAsync không truyền executor, commonPool bị chặn bởi I/O

Status: DONE
Agent: kilo

Đã thêm lab `lab-thread-020` vào `js/data/labs-thread.js` theo yêu cầu. Đã chạy `node scripts/validate.js` (có báo lỗi tồn tại sẵn ở `lessons-jpa.js`, không thuộc sở hữu của task này).
Owns: `js/data/labs-thread.js`
After: T2324

Đọc AGENTS.md mục 10 và đọc KỸ 1 lab mẫu đầy đủ (`lab-thread-011`) để bắt chước cấu trúc. Thêm **ĐÚNG 1 lab**:
- id: lấy số lớn nhất bằng `grep -o "id: 'lab-thread-[0-9]*'" js/data/labs-thread.js | sort -V | tail -1` rồi +1 (KHÔNG dùng lại số cũ — lần trước có agent dùng trùng lab-thread-007 và bị huỷ).
- Tình huống: Server 8 CPU → commonPool 7 worker; 7 thread ForkJoinPool.commonPool-worker-N kẹt ở SocketInputStream read (gọi HTTP đối tác không timeout); các tính năng khác dùng parallel stream cũng treo. Sửa: executor riêng có giới hạn + timeout HTTP + orTimeout, bulkhead.
- Artifact: jstack 30–150 dòng giống thật (thread name, tid/nid, lock id khớp nhau), thêm 1 artifact log/metric; answer 2500–5000 ký tự với ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; questions 2–3; hints ≥ 2; rubric ≥ 3; tags.
- Chèn object mới NGAY TRƯỚC dòng `);` CUỐI FILE (dùng Edit tại đúng vị trí đó), KHÔNG viết lại file, KHÔNG đụng object cũ. Không backtick, không `${`.

## Nghiệm thu
`node --check js/data/labs-thread.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK (không có lỗi id trùng). Đếm lab trước/sau: `grep -c "^  id: 'lab-thread" js/data/labs-thread.js` tăng đúng 1. KHÔNG commit. Status: DONE + id vào Notes.

## Notes
Reviewed-by: kilo (T2325R)
