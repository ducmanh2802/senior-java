# T773 — 2 bài AWS: SQS visibility/DLQ và target-tracking autoscaling

Status: DONE
Agent: qoder
Owns: `js/data/lessons-aws.js`

Track **aws** đã có một số bài (đọc hết file, không trùng). Thêm các bài dưới, id và order tiếp nối số lớn nhất hiện có, bài tập Java thuần chạy với Java 17 và tự chấm (≥ 4 case mỗi bài tập). Nếu một chủ đề đã có thì chọn chủ đề cùng track chưa có và ghi lý do vào Notes.

1. **SQS: visibility timeout, at-least-once, DLQ**: vì sao message bị xử lý hai lần, chọn visibility timeout theo thời gian xử lý, maxReceiveCount → DLQ, idempotent consumer, FIFO (message group, dedup id) khác Standard thế nào. Bài tập: `FakeQueue` với đồng hồ giả: receive ẩn message trong visibility timeout, delete, hết hạn thì hiện lại, quá maxReceiveCount thì chuyển DLQ; và consumer idempotent không xử lý trùng.
2. **Auto Scaling target tracking và cooldown**: target CPU 50%, công thức số instance mong muốn, scale-out nhanh / scale-in chậm, warm-up, vì sao app JVM khởi động chậm cần warm-up dài. Bài tập: `TargetTracker.desired(current, metric, target, min, max)` + mô phỏng chuỗi metric theo phút có cooldown, kiểm tra không dao động (flapping).

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-aws.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes

**id mới: `lesson-aws-005` (order 5), `lesson-aws-006` (order 6)** — chỉ THÊM, không sửa object cũ.
Đếm `grep -c "id: 'lesson-aws"`: trước = 4, sau = 6 (đúng +2). `git diff --numstat`: 688 thêm / **0 xoá** ở `js/data/lessons-aws.js`.

**Đề mục (thay chủ đề, theo dòng "Nếu một chủ đề đã có thì chọn chủ đề cùng track chưa có"):**
cả 2 chủ đề task chỉ định **đã tồn tại sẵn** trong track aws:
- SQS visibility timeout / at-least-once / DLQ / FIFO / idempotent consumer = `lesson-aws-003` (body + bài tập `SimQueue` với clock giả, receive/delete/changeVisibility/maxReceiveCount→DLQ — đúng yêu cầu mục 1).
- Auto Scaling target tracking + cooldown + warm-up = `lesson-aws-004` (body mục "Auto Scaling: target tracking" + bài tập `TargetTrackingScaler.desired(current, avgCpu, nowSec)` có scaleOut/scaleIn cooldown, min/max, test chống flapping — đúng yêu cầu mục 2).

Viết lại sẽ trùng nội dung và vi phạm luật "không sửa bài cũ / không trùng". Track aws trước đây chỉ có IAM, S3, messaging, compute — **thiếu hẳn networking và database**, là hai lỗ hổng lớn với người đọc "chưa tiếp xúc AWS". Nên chọn:

1. `lesson-aws-005` — **VPC cho dev Java**: CIDR & cách tính dải IP, subnet↔AZ, public/private subnet, route table + longest prefix match, IGW vs NAT, **security group (chỉ allow, stateful) vs NACL (allow/deny xét theo `number`, stateless → bẫy ephemeral port 1024–65535)**, gateway endpoint (S3/DynamoDB, miễn phí) vs interface endpoint (PrivateLink), 3 lỗi mạng hay gặp, cách debug bằng VPC Flow Logs + Reachability Analyzer. Có 1 sơ đồ `~~~seq` (Client→ALB→App→RDS). Bài tập `VpcFilter`: `cidrContains` (so bit), `firstMatch` (thứ tự rule number), `checkRequest` (SG rồi NACL inbound), `checkResponse` (SG stateful bỏ qua, chỉ NACL outbound) — **21 case, JDK thuần, clock-free**.
2. `lesson-aws-006` — **DynamoDB cho dev Java**: item 400 KB, partition key quyết định vị trí vật lý + hot partition, sort key là thứ tự từ điển (bẫy zero-pad), GetItem/BatchGet/Query/Scan so về chi phí, RCU/WCU (đọc 4 KB, ghi 1 KB, EC = nửa RCU), on-demand vs provisioned, conditional write (`attribute_not_exists`) + **khoá lạc quan theo `version`**, TransactWriteItems, GSI/sparse GSI/LSI/TTL/Streams, Enhanced Client (SDK v2), bảng "khi nào KHÔNG dùng DynamoDB". Có 1 sơ đồ `~~~seq` (2 worker cùng trừ tồn kho). Bài tập `FakeDynamo`: `query` (một partition, sắp theo sk), `conditionalPut` (version), `capacityUnits` (làm tròn từng item, 4 KB vs 1 KB, EC halving) — **32 case, deterministic**.

**Đề xuất cho integrator (`js/data/path.js`, dòng 74):** thêm 2 id vào danh sách `lessons` của stage đang chứa aws, ví dụ
`'lesson-aws-001', 'lesson-aws-002', 'lesson-aws-003', 'lesson-aws-004', 'lesson-aws-005', 'lesson-aws-006'`
— hiện `validate.js` còn cảnh báo `path.js: có N bài học không nằm trong PATH` trong đó có `lesson-aws-005`, `lesson-aws-006` (và bài của task khác); em không sở hữu path.js nên không sửa.

**Gate đã chạy (kết quả cuối):** `node scripts/test-lessons.js lesson-aws-005` → **21/21**; `lesson-aws-006` → **32/32** (starter biên dịch được và không pass hết); `node scripts/test-lessons.js` toàn bộ → **162/162 OK**; `node scripts/build-light-index.js` → đã ghi `js/data/index-light.js`; `node scripts/validate.js` → **OK — không có lỗi** (exit 0). Quét codepoint tiếng Việt cho `js/data/lessons-aws.js`: không CJK/Cyrillic/fullwidth, không NFD combining, không invisible char. Không commit, không mở trình duyệt, không chạy file .js trực tiếp, không kill tiến trình.

Trong phiên có lúc validate tạm báo lỗi markup ở `js/data/lessons-jvm.js` (task song song T772 đang ghi dở) — em **không đụng vào file không thuộc quyền sở hữu**; lần chạy cuối đã sạch. Cảnh báo còn lại (không phải lỗi): `path.js: có 4 bài học không nằm trong PATH` → integrator xem đề xuất ở trên.
Reviewed-by: kilo (T773R)
