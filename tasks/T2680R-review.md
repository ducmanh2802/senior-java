# T2680R — Fact-check nội dung mới của T2680

Status: DONE
Agent: opencode
Owns: `js/data/lessons-concurrency.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2680 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã sửa (theo id):

- **lesson-concurrency-025**: test harness hardcode `RESULT 1/1`. `App.code.parse` (js/core/ai.js:332) lấy passed/total từ dòng RESULT, nên harness luôn báo pass → starter (và bài làm sai của người học) bị chấm là đạt, test "không kiểm tra gì"; đồng thời chỉ có 1 case (< 3 case bắt buộc). Đã thay bằng bộ đếm `passed/total` động + 3 case xác định: `busy` (downstream đang giữ permit → tryAcquire timeout), `isolation` (downstream khác có Semaphore riêng, không bị chặn), `release` (nhả permit sau khi task xong). `node scripts/test-lessons.js lesson-concurrency-025` → OK (reference 3/3, starter không pass hết).
- **lesson-concurrency-026**: test harness hardcode `RESULT 3/3` (cùng lỗi parse như trên). Đã thay bằng bộ đếm động + 3 case `ok` / `throw` / `three`. `node scripts/test-lessons.js lesson-concurrency-026` → OK.

Không có lỗi kiến thức khác trong body: Semaphore/bulkhead/load shedding, `tryAcquire(timeout)`, `availablePermits()`/`getQueueLength()`, structured concurrency, `Future.get(timeout)`/`cancel(true)`, Java 21 `StructuredTaskScope` (preview, JEP 453) đều đúng. Các mục bị lặp (Ví dụ đời thực / So sánh / Pitfall xuất hiện 2 lần) là lỗi bố cục — ngoài phạm vi fact-check (không sửa văn phong/bố cục).

Nội dung không sửa ở HEAD được giữ nguyên; chỉ 2 harness test bị sửa.

**Blocker ngoài file (không thuộc T2680R):** `node scripts/build-light-index.js` và `node scripts/validate.js` hiện dừng vì lỗi cú pháp trong `js/data/q-devops.js` (dòng 17701: một dấu backtick lạ trong template literal — `kubectl rollout restart`). File này do task khác (T2682, đang M trong working tree) sở hữu; bản ở HEAD sạch (`git show HEAD:js/data/q-devops.js` qua `node --check` → OK). Theo AGENTS.md luật 3, tôi KHÔNG sửa file này. Hệ quả: mọi lỗi validate hiện tại (78 dòng: `path.js ... devops-xxx không tồn tại` + `index-light.js đã cũ`) đều bắt nguồn từ q-devops.js không nạp được → không có lỗi nào tham chiếu `lessons-concurrency.js`. Khi q-devops.js được sửa, chạy lại `node scripts/build-light-index.js` rồi `node scripts/validate.js` sẽ OK.
