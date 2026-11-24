# T2666R — Fact-check nội dung mới của T2666

Status: DONE
Agent: opencode
Owns: `js/data/labs-thread.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2666 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `lab-thread-030`: Sửa 6 lỗi:
  1. Dấu backtick lồng trong template literal `{{Rendering page 3/10 took 12s}}` → bỏ wrapper, chỉ để text thuần `Rendering page 3/10 took 12s`.
  2. Hint 1 ghi "BLOCKED" nhưng artifact ghi RUNNABLE → đổi thành "RUNNABLE trên SocketInputStream.socketRead0, không phải CPU work (trạng thái RUNNABLE trong Java bao gồm cả block I/O)".
  3. Câu 1 trong phần Dẫn chứng ghi "BLOCKED (on object monitor)" → artifact thực tế là RUNNABLE, đổi thành "RUNNABLE".
  4. Câu 2 trong phần Dẫn chứng ghi "BLOCKED (on object monitor)" → artifact thực tế là WAITING (parking), đổi thành "WAITING (parking)".
  5. Rubric ghi "commonPool-worker-* BLOCKED" → đổi thành "RUNNABLE trên SocketInputStream.socketRead0 (block I/O); Tomcat exec-* WAITING/BLOCKED trên ForkJoinPool.awaitJoin".
  6. Ở phần "Hệ quả" ghi "BLOCKED trên monitor của ForkJoinPool" → đổi thành "WAITING (parking) hoặc BLOCKED trên monitor của ForkJoinPool" (phù hợp hơn với cả 2 trạng thái trong artifact).

- `lab-thread-031`: Sửa 1 lỗi:
  1. Dòng "Static analysis" đề cập annotation `@MayBlock` — không phải annotation chuẩn Java/Spring. Đổi thành "custom Error Prone check cho synchronized block chứa method call có thể block I/O".
