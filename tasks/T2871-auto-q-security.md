# T2871 — 3 câu hỏi Senior Java (security) vào q-security.js

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`
After: T2784

Thêm **3 câu hỏi phỏng vấn mới** (topic: security) vào `js/data/q-security.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-security.js`); đọc danh sách để **không trùng ý**.

Chủ đề: quản lý secret trong Spring Boot trên Kubernetes/AWS (Secrets Manager, xoay vòng mật khẩu DB không downtime), chống brute force OTP/login (rate limit theo user + IP, lockout), audit log không thể sửa cho hệ thống tài chính.

> Vòng 4 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment hoặc ~~~seq cho luồng nhiều bên → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/q-security.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 3 câu (id nối tiếp security-090 → 091/092/093), mỗi câu chọn góc CHƯA có so với các vòng trước:
- security-091 (senior): Secret trên Kubernetes — etcd chỉ base64 KHÔNG mã hoá (EncryptionConfiguration/KMS), vì sao KHÔNG nhúng secret vào env var (lộ qua /proc, kubectl describe, crash dump), CSI Secret Store driver (tmpfs) vs External Secrets Operator vs env, projected service account token. Khác security-019 (AWS Secrets Manager + HikariCP rotation) và security-025 (Vault/AWS chung).
- security-092 (senior): Rate limiter phân tán nhiều instance — bẫy fixed-window burst ở biên, INCR+EXPIRE không atomic (key kẹt ttl=-1), cài đúng bằng Lua atomic, sliding window counter 2 cửa sổ. Khác security-014 (chống brute force tổng thể) và security-027 (rate limit ngân hàng/gateway vs app) ở góc chính xác thuật toán + atomicity.
- security-093 (lead): Audit log tài chính qua transactional outbox — dual-write problem, relay CDC/polling, idempotency key, partition theo aggregate id giữ thứ tự, nối WORM + hash chain. Khác security-021/030 (thiết kế audit, hash chain) và security-071 (audit là gì) ở góc dual-write/outbox.

Kiểm tra: node --check OK; build-light-index OK; validate.js không báo lỗi/cảnh báo nào cho q-security.js (các LỖI còn lại thuộc file khác không sở hữu: frontend-036, quiz-ops, quiz-ckad, lessons-*, toeic — có sẵn từ trước). Số câu security 90 → 93. Không commit.
Reviewed-by: kilo (T2871R)
