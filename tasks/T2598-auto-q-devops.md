# T2598 — 3 câu hỏi Senior Java (devops) vào q-devops.js

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`
After: T2562

Thêm **3 câu hỏi phỏng vấn mới** (topic: devops) vào `js/data/q-devops.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-devops.js`); đọc danh sách để **không trùng ý**.

Chủ đề: rollout an toàn trên Kubernetes cho service Java (readinessProbe vs livenessProbe vs startupProbe, graceful shutdown, preStop), canary với số liệu SLO và tự rollback, quản lý cấu hình nhiều môi trường không lộ secret.

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
`node --check js/data/q-devops.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 3 câu hỏi mới vào `js/data/q-devops.js` (id nối tiếp devops-194, tổng 193 → 196 câu; không xoá/sửa mục của người khác):

- **devops-195** (senior): rolling update an toàn — startupProbe vs readinessProbe vs livenessProbe + health group Actuator (tách livenessState/readinessState) + graceful shutdown + preStop + terminationGracePeriodSeconds. Có ~~~seq, code yaml.
- **devops-196** (lead): canary tự động với Argo Rollouts + AnalysisTemplate query Prometheus theo SLO burn rate (5xx + business error rate, min sample, warmupDurationSecs, failureLimit), tự rollback, pause có kiểm soát. Có code yaml, bảng trade-off.
- **devops-197** (senior): quản lý cấu hình nhiều môi trường không lộ secret — External Secrets Operator + AWS Secrets Manager, mount file + configtree, rotation luân phiên 2 user + HikariCP maxLifetime, vì sao không dùng env var cho secret.

Mỗi câu đủ cấu trúc AGENTS.md mục 6: `**Tóm tắt:**`, giải thích từ gốc từng bước, code/seq ≤ 30 dòng có comment, bảng trade-off, pitfall production, `### Ví dụ đời thực` có số liệu, `### Trả lời mẫu khi phỏng vấn` (150–220 từ), `> Senior tip:`, `follow` 3 câu. Độ dài đáp án 7181–8818 ký tự.

Đã tự sửa lỗi cú pháp của lần chạy trước bị gián đoạn (chính là bài devops-197): bỏ 3 cặp backtick literal trong phần Tóm tắt (chuyển sang {{...}}), và sửa lỗi nested-brace {{ {{ .data.cert | b64decode }} }} ở Senior tip (đổi thành "b64decode trường {{cert}}").

Kiểm tra:
- `node --check js/data/q-devops.js` → OK.
- `node scripts/validate.js q-devops.js` → **0 lỗi thuộc q-devops.js**.
- `node scripts/validate.js` (toàn bộ) và `node scripts/build-light-index.js` → **đang ĐỎ vì file KHÁC, không phải file của T2598**: `js/data/q-microservices.js` lỗi cú pháp tại entry microservices-127 (khoảng dòng 10782–10785 — template literal đóng bằng backtick sớm, `> Senior tip:` và dấu `,` rơi ra ngoài string). Đây là file của **T2606 (auto-q-microservices)** bị bỏ dở, KHÔNG thuộc T2598 nên theo luật 3 AGENTS.md tôi **không tự sửa**. Mọi lỗi `related/path ... "microservices-XXX" không tồn tại` và `index-light.js: đã cũ` đều là hệ quả dây chuyền từ file q-microservices.js không load được. Đã báo blocker lên board (HOLD, reply_to all).

Đề xuất cho integrator / chủ T2606: sửa entry microservices-127 trong `js/data/q-microservices.js` (đưa `> Senior tip:` vào bên trong template literal `a`, xoá backtick đóng sớm ở cuối dòng "### Trả lời mẫu khi phỏng vấn", bỏ dấu `,` thừa sau Senior tip — xem dòng 10782–10785), rồi chạy lại `node scripts/build-light-index.js` và `node scripts/validate.js` để gate xanh toàn bộ. Sau khi file đó được sửa, phần đóng góp của T2598 sẽ tự động được index và validate sạch.
Reviewed-by: kilo (T2598R)
