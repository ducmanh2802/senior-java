# T2073R — Fact-check nội dung mới của T2073

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2073 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff mới `HEAD -- js/data/q-api.js` (api-061..api-066): không phát hiện lỗi kỹ thuật/API/flag/cơ chế, không lỗi markup (không backtick, không `${`), không bịa số liệu rõ ràng; nội dung phù hợp Java 17/21, Spring Boot 3.x, RFC 9457, idempotency, Bucket4j, cursor pagination, timeout/retry. **Không sửa nội dung**.
- Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js`: file owned `js/data/q-api.js` không phát sinh lỗi mới; validate tổng vẫn FAIL do lỗi ngoài phạm vi sở hữu (`bugs.js` related banking-036, `lessons-banking.js` related banking-027/030/023/016/028, `path.js` lessons không trong PATH). Không được sửa file không sở hữu theo AGENTS.md.
- Syntax check `node --check js/data/q-api.js`: OK.
