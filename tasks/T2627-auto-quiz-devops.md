# T2627 — 10 câu trắc nghiệm (devops) vào quiz-ops.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ops.js`
After: T2593

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-ops.js` (topic `devops`; id `qz-devops-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-devops-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: Dockerfile multi-stage cho Spring Boot (layered jar), Kubernetes probe, requests/limits và CPU throttling, rolling update vs blue-green vs canary, Helm values, cache trong GitHub Actions, Prometheus metric types (counter/gauge/histogram). Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-devops đã có.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/quiz-ops.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 10 câu trắc nghiệm devops:
- qz-devops-094: Dockerfile multi-stage Spring Boot layered jar (cache layer ordering)
- qz-devops-095: Kubernetes 3 loại probe (startup/readiness/liveness) - multi: true (Chọn 2)
- qz-devops-096: CPU throttling CFS quota (requests/limits, 2 thread song song)
- qz-devops-097: RollingUpdate vs Blue-Green vs Canary cho thanh toán
- qz-devops-098: Helm values merge priority (defaults -> -f -> --set)
- qz-devops-099: GitHub Actions cache key hashFiles(package-lock.json)
- qz-devops-100: Prometheus metric types Counter/Gauge/Histogram - multi: true (Chọn 2)
- qz-devops-101: Argo CD selfHeal + prune tự scale về Git
- qz-devops-102: Terraform plan tilde (~) nghĩa là update in-place
- qz-devops-103: Service EndpointSlice chỉ chứa Pod Ready

Kiểm tra: `node --check js/data/quiz-ops.js` OK. `node scripts/validate.js` lỗi chỉ từ file khác (lessons-design.js, quiz-gaps.js) không liên quan đến thay đổi này.
Reviewed-by: kilo (T2627R)
