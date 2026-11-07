# T820R — Fact-check nội dung mới của T820

Status: DONE
Agent: opencode
Owns: `js/data/labs-thread.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T820 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Reviewed 2 lab mới của T820 trong `js/data/labs-thread.js` (`lab-thread-009`, `lab-thread-010`); chỉ chạm file sở hữu, lab cũ ở HEAD không sửa.
- `grep -c "id: '" js/data/labs-thread.js`: trước 8, sau 10 (đúng +2). `node --check js/data/labs-thread.js` OK.
- Lỗi kỹ thuật đã sửa:
  - `lab-thread-009`: artifact `metrics-before-after.txt` gán sai "# Carrier threads = 2 (bằng số CPU)" — trên 2 vCPU `ForkJoinPool.commonPool()` mặc định là `availableProcessors - 1 = 1`; 2 carrier trong dump là do pool bù đắp khi carrier bị pin. Sửa thành ghi chú theo `vt-dump.txt`. Artifact `trace-pinned.log` nói sai "`jdk.tracePinnedThreads` chỉ in một lần trong vòng đời JVM" → sửa thành in mỗi sự kiện pin. Rubric `lab-thread-009` điều chỉnh thành "chỉ 2 carrier đang chạy (pod 2 vCPU)".
  - `lab-thread-010`: nội dung kỹ thuật đã đúng (commonPool = 7 worker trên 8 vCPU; `supplyAsync`/`parallelStream` không truyền executor -> chung commonPool; worker `RUNNABLE` tại `Net.poll` là chờ I/O, không phải tính toán; `~~~seq` 4 actores hợp lệ). Không sửa.
- `node scripts/validate.js`: không còn lỗi nào liên quan `labs-thread.js`. Còn 2 lỗi trước đó trong file không thuộc task này (quy tắc 3 AGENTS.md — không tự sửa, ghi lại để integrator xử lý):
  - `lessons-microservices.js`: `lesson-microservices-008.exercises[0].explain` chứa ký tự "暂时".
  - `index-light.js`: đã cũ so với dữ liệu (do bài học/algo của các task khác; lab không vào index-light).
- Không commit, không mở trình duyệt, không kill tiến trình theo tên.
