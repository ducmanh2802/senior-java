# T2387R — Fact-check nội dung mới của T2387

Status: DONE
Agent: opencode
Owns: `js/data/lessons-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2387 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Không có lỗi kỹ thuật/markup/thuật ngữ trong `lesson-api-012` (128 dòng thêm ở cuối `js/data/lessons-api.js`). Đã đối chiếu chéo với `lesson-api-003`, `lesson-api-008` và `lesson-api-010` cùng file: hợp đồng 409 REQUEST_IN_PROGRESS / 422 IDEMPOTENCY_KEY_REUSED, TTL 24h, scope (tenant, endpoint, key), fingerprint raw body, state machine IN_PROGRESS → DONE, job đối soát — tất cả nhất quán, không có chỗ nói ngược hay số liệu vô căn cứ. Exercise `IdempotencyStore` đúng hợp đồng trong `prompt`: blank key → IllegalArgumentException, key mới chạy action, cùng body → replay (không chạy lại), khác body → 422, đang chạy → 409. `check` (2 câu) có đáp án và explain khớp. `related: ['api-003']` là id có thật. Body ≥ 2500 ký tự, không có backtick/`${` trong template literal.

Kiểm chứng đã chạy:
- `node --check js/data/lessons-api.js` → OK.
- Test bài tập: chạy `lesson-api-012` qua harness java-runner trong script tạm (chỉ nạp `js/data/lessons-api.js`, vì script đầy đủ không nạp được `lessons-security.js` đang lỗi) → reference PASS 4/4, starter biên dịch được và FAIL 0/4 → test có tác dụng.
- `node scripts/validate.js lessons-api.js` → không còn lỗi nào thuộc `lessons-api.js`; chỉ còn lỗi global `index-light.js đã cũ` do task khác thêm câu hỏi (sql-080..084, api-072..076, aws-079..083) chưa chạy `build-light-index.js`. `lesson-api-012` đã có trong `index-light.js` (dòng 2552), nên không cần build lại cho phần của task này; `index-light.js` không thuộc quyền sở hữu của task.

Lỗi tạm thời (ngoài phạm vi, không sửa): `node scripts/test-lessons.js` và `node scripts/validate.js` toàn bộ đang fail vì `js/data/lessons-security.js` (file của task khác, đang sửa dở) lỗi cú pháp `Unexpected identifier 'undefined'`; `js/data/q-banking.js` cũng đang lỗi cú pháp. Bản ở HEAD của cả hai file đều `node --check` OK → đây là thay đổi chưa hoàn tất của agent khác, không phải lỗi của task này. Vì luật 3 (chỉ sửa file sở hữu), tôi không chạm vào chúng; khi các file đó hoàn tất và `index-light.js` được build lại (`node scripts/build-light-index.js`), chạy lại `node scripts/test-lessons.js` + `node scripts/validate.js` sẽ pass.

Không sửa nội dung nào của `lesson-api-012` (không có lỗi kiến thức).
