# T1301R — Fact-check nội dung mới của T1301

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1301 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Sửa trực tiếp các lỗi kiến thức trong nội dung mới của T1301 (js/data/q-soft.js), chỉ sửa file sở hữu của task:
- testing-011 (Kafka): "consumer cũ deserialize thất bại vì thiếu field" là hướng ngược (Avro reader bỏ qua trường mới của writer ⇒ không lỗi). Sửa thành: consumer mới dùng schema mới có trường bắt buộc không default đọc message cũ ⇒ deserialize thất bại ⇒ DLT (chỉ khi có DeadLetterPublishingRecoverer). Sửa "retry policy mặc định chỉ retry 3 lần rồi bỏ qua" ⇒ default error handler của Spring Kafka retry theo backoff cố định rồi recoverer ghi log (maxFailures 10), DLT không tự tạo nếu không cấu hình recoverer. Cùng chỉnh phần Trả lời mẫu cho nhất quán.
- testing-014 (Migration): "Postgres phải viết lại toàn bộ 200 triệu dòng" cho ALTER TABLE ... TYPE varchar(50) là sai — widening varchar không viết lại bảng từ PostgreSQL 9.2+, chỉ giữ khóa ACCESS EXCLUSIVE trong thời gian chạy câu lệnh. Sửa quy tắc (3): trên bảng > 10 triệu dòng, đo thời gian trên dữ liệu production-like trước khi deploy; thay đổi viết lại bảng dùng expand–contract.
- testing-016 (Resilience): "circuit breaker chưa bao giờ mở vì sliding window size 100, traffic 20 call/phút" là sai — mặc định slidingWindowSize=100 và minimumNumberOfCalls=100 (COUNT_BASED) ⇒ breaker mở sau vài phút ở traffic thấp (mở muộn, không phải không bao giờ mở). Cùng chỉnh Trả lời mẫu.

Không chỉnh văn phong, độ dài, bố cục; không thêm/xoá mục; không sửa nội dung đã có ở HEAD.

Không chạy được node scripts/validate.js → OK trong working tree hiện tại: js/data/q-scenario.js (file không thuộc quyền sở hữu của task này, đã được sửa trước khi tôi bắt đầu) có văn bản thô ngoài template literal ở dòng 4093 ⇒ loadSources ném ReferenceError, nên build-light-index.js và validate.js dừng lại trước khi tóm tắt. Theo AGENTS.md §3 không sửa file ngoài quyền sở hữu. Xác thực riêng q-soft.js: node sandbox-eval cú pháp OK, 6 câu testing-011..016 đáp ứng schema (id dạng topic-NNN, topic testing ánh file q-soft.js, level hợp lệ, đáp án > 1000 ký tự, không backtick trong prose, {{ }} cân bằng, không thẻ HTML thô). index-light.js chỉ lưu [id, topic, level] nên nội dung không thay đổi do chỉ sửa nội dung đáp án, không cần sinh lại.
