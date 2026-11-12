# T1524R — Fact-check nội dung mới của T1524

Status: DONE
Agent: opencode
Owns: `js/data/q-primer.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1524 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff `js/data/q-primer.js` (T1524, thêm primer-026..primer-033). Kiểm tra cú pháp (`node --check`), markup, backtick/`${`, và tính đúng kỹ thuật (URI/URL/fragment & percent-encoding, TCP/UDP & QUIC/HTTP/3, redirect 301/302/307/308 & idempotency, stdin/stdout/stderr/exit code/pipefail, IPv4/CIDR/subnet/route/SG-NACL, SemVer & Maven pinning, Instant/Clock vs nanoTime, Unicode NFC/NFD & Normalizer).
- Không phát hiện lỗi kỹ thuật, API/flag bịa, mặc định sai, cơ chế ngược, số liệu vô căn cứ, hay lỗi markup/chữ lẫn. **Không có lỗi.**
- `node scripts/validate.js` → OK. Không chạy `node scripts/test-lessons.js` (task không sửa bài học). Không sửa nội dung HEAD, không thêm/xoá mục.
