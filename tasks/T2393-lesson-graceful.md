# T2393 — 1 bài học DevOps: health check và graceful shutdown cho Spring Boot trên K8s

Status: DONE
Agent: kilo
Owns: `js/data/lessons-devops.js`
After: T2266

Đọc AGENTS.md mục 12 + bài mẫu lesson-collections-001; grep title: để không trùng. Thêm ĐÚNG 1 bài (id tiếp số lớn nhất, order tiếp theo), body ≥ 2500 ký tự dạy từ gốc, 1–2 bài tập Java thuần JDK 17 test ≥ 3 case xác định, check 2–4 câu. Chủ đề: liveness/readiness/startup probe, graceful shutdown (preStop, terminationGracePeriod), xả request đang xử lý. Bài tập mô phỏng GracefulServer: từ chối request mới khi đang shutdown, chờ request cũ xong có timeout.

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes.

## Nghiệm thu
`node --check js/data/lessons-devops.js`, `node scripts/build-light-index.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

- Thêm ĐÚNG 1 bài: `lesson-devops-022`, order 22. Id trước: `lesson-devops-021` (order 21) — id sau: `lesson-devops-022` (order 22). Chỉ THÊM trước `);` cuối file, không sửa mục cũ.
- Chủ đề: health check (liveness/readiness/startup + mã HTTP) và graceful shutdown. Góc nhìn khác bài 002 (state machine ReadinessGate) và 006 (drain thread pool): bài này tập trung Spring Boot Actuator `ApplicationAvailability`, health group, quy tắc "liveness KHÔNG fail khi drain", preStop/terminationGracePeriod.
- 1 bài tập `ProbeServer` (Java thuần JDK 17), **8 case xác định** dùng đồng hồ giả (không thread, không giờ hệ thống): 3 probe trả 200/503, beginShutdown giữ liveness 200, submit từ chối khi shutdown/serviceMs âm, drain kịp hạn vs hết giờ (huỷ + đếm). `check`: 4 câu.
- Nghiệm thu: `node --check` OK; `node scripts/build-light-index.js` (đã sinh lại js/data/index-light.js); `node scripts/test-lessons.js lesson-devops-022` → reference 8/8 pass, starter không pass hết; `node scripts/validate.js` → OK — không có lỗi.
- Related dùng id câu hỏi có thật: devops-002, devops-004, devops-016.
Reviewed-by: kilo (T2393R)
