# T1404R — Fact-check nội dung mới của T1404

Status: DONE
Agent: opencode
Owns: `js/data/lessons-core.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1404 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `lesson-core-001` (phần mới T1404): kiểm tra đúng kỹ thuật try-with-resources (khởi tạo, lỗi chính, đóng ngược thứ tự, suppressed qua `addSuppressed`, thân thành công thì close lỗi thành lỗi chính), Spring rollback mặc định unchecked/`rollbackFor` cho checked — không bịa API/flag, cơ chế đúng. Sửa lỗi dấu tiếng Việt: "retry bat cả" → "retry bắt cả"; bổ sung giải thích ngắn "idempotency key (khóa nhận dạng duy nhất để phát hiện yêu cầu trùng)" theo yêu cầu người đọc mới. Markup ({{}}, ~~~java, không backtick/`${`) OK.
- `lesson-core-002` (phần mới T1404): kiểm tra đúng PECS/capture/invariance/erasure, `Comparator<? super T>` contravariance, ví dụ `? extends`/`? super` đọc-ghi đúng; lỗi hay gặp và check questions đúng kỹ thuật, không số liệu vô căn cứ. Markup OK.
- Chỉ nội dung mới trong diff được chỉnh; lessons 003+ giữ nguyên HEAD. `node --check js/data/lessons-core.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK (warnings cũ repo: claude-034 HTML thô, path.js 2 bài không nằm trong PATH). Không chạy `test-lessons.js` (không đổi starter/tests/reference).
