# T2031R — Fact-check nội dung mới của T2031

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2031 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Không có lỗi. Fact-check 6 câu mới design-043→design-048 (ví rút tiền ví: idempotency key + optimistic lock version/balance + ledger cùng transaction; booking: exclusion constraint gist tstzrange Postgres; import file lớn: 202 Accepted + queue + worker streaming batch; scheduler: ShedLock lockAtMostFor/lockAtLeastFor; audit log: outbox append-only; phân trang: offset vs keyset/cursor row-value). Không backtick, không `${`, chỉ trường hợp lệ, id không trùng và tăng dần. `node scripts/validate.js` → OK — không có lỗi. Không sửa nội dung đã có ở HEAD.
