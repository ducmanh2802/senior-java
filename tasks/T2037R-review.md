# T2037R — Fact-check nội dung mới của T2037

Status: DONE
Agent: opencode
Owns: `js/data/labs-gc.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2037 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Phạm vi review (diff mới so với HEAD): sửa nhỏ nội dung cũ liên quan fact-check và bổ sung `lab-gc-015`, `lab-gc-016`, `lab-gc-017`, `lab-gc-018`.
- `lab-gc-015`: sửa **mâu thuẫn số liệu artifact/answer** (GC log và timeline OOM ở 192 MB nhưng classloader_stats/metrics cộng dồn vượt 192 MB, total loader/classes không khớp). Đồng bộ lại: `MaxMetaspaceSize=256m`, `Total = 40329` loader (20,485 `GroovyClassLoader$InnerLoader` + loader hệ thống, tổng classes 46,757), metrics tại 13:00 đạt ~231 MB và tại 13:41 chạm ngưỡng 256 MB; cập nhật answer/rubric cho khớp (classes_loaded tăng ~1.54/s = preview/s, Metaspace ~26 MB/giờ, 2 Full GC Metadata GC Threshold/Clear Soft References không giảm).
- `lab-gc-016`: sửa **`jcmd GC.heap_info` không nhất quán** với log mixed GC (log cho thấy sau GC(415) Eden 0/120, Survivor 60, Old 512 vùng = live set ~4–5 GB, nhưng heap_info cũ ghi 1260 old ~9.8 GB). Thay heap_info bằng snapshot sau mixed GC: 120 young, 60 survivors, 512 old (~4 GB), used ~4.8 GB, phù hợp old_after_mixed ~5 GB.
- `lab-gc-017`: **không phát hiện lỗi kiến thức kỹ thuật** cần sửa (cơ chế Metaspace/classloader/proxy, dẫn chứng GC log/metrics/stats, hướng xử lý đều đúng; không có backtick/`${` vi phạm trong nội dung lab).
- `lab-gc-018`: sửa **`jcmd GC.heap_info` không nhất quán** với log/mixed GC (heap_info cũ ghi 1152 old ~4.5 GB trong khi GC(415) để lại Old 512 vùng ~2 GB, live set ~3 GB). Thay heap_info bằng snapshot sau mixed GC: 120 young, 60 survivors, 512 old (~2 GB), used ~2.9 GB, khớp old_after_mixed ~3 GB.
- Hoàn nguyên thay đổi số liệu không cần thiết trong phần cũ `lab-gc-004` (Groovy pricing rule) để không sửa nội dung đã có ở HEAD ngoài phạm vi cần thiết.
- `node scripts/build-light-index.js` → OK. `node scripts/validate.js` hiện vẫn còn **3 lỗi pre-existing không thuộc file sở hữu**: `q-devops-part.js` chưa khai báo trong `js/core/data-manifest.js`, `q-devops.js: devops-160.a` có ký tự lạ "同上". Không sửa do vi phạm quyền sở hữu (AGENTS.md luật 3). `node --check js/data/labs-gc.js` → OK.
