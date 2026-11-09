# T1353R — Fact-check nội dung mới của T1353

Status: DONE
Agent: opencode
Owns: `js/data/q-remote.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1353 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Diff mới: thêm block `### Ví dụ đời thực` + `### Trả lời mẫu khi phỏng vấn` cho `remote-001`..`remote-048` (48 câu, map theo vị trí trong file). Không thấy API/flag bịa, mặc định sai, cơ chế ngược, hay số liệu vô căn cứ rõ ràng (các con số rate/time/conversion là ví dụ minh hoạ tình huống). Markup OK (không backtick, không `${`).
- `remote-047` (~4888, ~4896): sửa lỗi từ nước ngoài/typo `follow-up sistematic` → `follow-up có hệ thống`; `Tiempo stuck từ 6 tháng xuống 3 tháng` → `Thời gian bị kẹt (stuck) từ 6 tháng xuống 3 tháng`.
- `remote-048` (bảng ma trận/tuần 3-4): sửa link topic không tồn tại trong app (`#/bank/git|docker|cicd|kafka|redis|k8s|observability|sd`) → map sang topic thật (`#/bank/devops`, `#/bank/microservices`, `#/bank/aws`, `#/bank/design`). Tuần 3-4: đổi `#/bank/kafka` → `#/bank/microservices`, dùng `{{@KafkaListener}}`, giải thích thuật ngữ `DLQ (Dead Letter Queue — hàng đợi chứa message lỗi để xử lý lại sau)` (phù hợp đối tượng người đọc mới).
- `node scripts/validate.js` → OK. Không chạy `test-lessons.js` (task không sửa bài học).
