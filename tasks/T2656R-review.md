# T2656R — Fact-check nội dung mới của T2656

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2656 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Nội dung mới của T2656 gồm 3 câu (devops-017/018/019 theo diff), đã fact-check và sửa trực tiếp. Tất cả đều bị lỗi nặng: **thiếu backtick đóng template literal** ở cả 3 câu (gây `SyntaxError`), **backtick lồng bên trong** `a` (làm vỡ template literal), **trùng id** với devops-017/018/019 đã có ở HEAD, và nhiều **chữ nước ngoài lẫn vào**. Chi tiết theo id (đã đổi id mới):

- **devops-198** (trước là devops-017): thêm backtick đóng; đổi các backtick lồng thành {{...}}; xoá 1 dòng `> Senior tip:` bị lặp 2 lần; sửa "registry pull GB → MB" thành "150 MB → 5 MB" cho khớp số liệu; bỏ flag bịa `build --changed`/`--changed` → dùng `git diff`; bỏ "Test song pool" → "Chạy test song song..."; `dependency.go-offline và go-offline` trùng lặp → gọn; xoá chữ Hàn "dependency순환" → "dependency tuần hoàn"; đổi id 017→198 (trùng id).
- **devops-199** (trước là devops-018): thêm backtick đóng; đổi backtick lồng thành {{...}}; sửa "UID < 10000" (sai — non-root là UID ≠ 0) → "UID số khác 0 (ví dụ 10001)"; sửa "Image eclipse-temurin:21 khoảng 900 MB" (không đúng, image này vài trăm MB) → "khoảng vài trăm MB"; xoá chữ Trung "利用" → "tận dụng"; "detect lỗ hiểm" → "phát hiện lỗ hổng"; "xuất hình" → "xuất hiện"; xoá chữ Nga "сложность" → "độ phức tạp"; "đểcompile" → "để compile"; "temporarily `pause` container" (khái niệm sai, không debug được distroless bằng pause) → "container phụ có shell"; "exec arbitrary lệnh" → "thực thi lệnh tùy ý"; đổi id 018→199 (trùng id).
- **devops-200** (trước là devops-019): thêm backtick đóng; sửa "đồng hồ điều khiển of control tower" → "bảng điều khiển vận hành (control tower)"; "phầnback" → "phân vị (percentile)"; "chiến cảnh báo theo bước" → "chiến lược cảnh báo theo loại service"; sửa PromQL sai (histogram p99 phải dùng histogram_quantile theo `le`, không phải `{quantile="0.99"}`; metric cAdvisor sai `container_spec_limits_memory_bytes`/`container_memory_usage_bytes` → `container_spec_memory_limit_bytes`/`container_memory_working_set_bytes`); "SLVi" → "SLI"; "tinậy" → "mất tin tưởng"; sửa logic SLO/SLA bị ngược ("99% là SLA... SLO chặt hơn 95-98%" — 95-98% lỏng hơn 99%) → "SLO chặt hơn SLA (ví dụ 99.9%)"; xoá chữ Trung "而非" → "thay vì"; "teamOps" → "team vận hành"; "95th percentile" → "p95"; xoá chữ Hàn "cảm진 (half-silence)" → "cơ chế silence"; "lateny" → "latency"; đổi id 019→200 (trùng id).

Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK — không có lỗi. Các cảnh báo còn lại (concurrency-081..084, jvm-070..072, db-069, path.js) đều thuộc file khác, không phải nội dung T2656.
