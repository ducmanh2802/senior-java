# T2455 — 10 câu trắc nghiệm (devops) vào quiz.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz.js`
After: T2439
Notes: Thêm 10 câu trắc nghiệm topic devops vào js/data/quiz.js: qz-devops-104 (graceful shutdown), qz-devops-105 (image tag immutable/digest), qz-devops-106 (readiness vs liveness probe), qz-devops-107 (QoS/OOMKilled eviction), qz-devops-108 (alert burn rate theo SLO), qz-devops-109 (multi, tracing qua Kafka), qz-devops-110 (kubectl rollout undo), qz-devops-111 (multi, best practice Docker image), qz-devops-112 (distributed tracing), qz-devops-113 (canary so sánh với baseline). node --check quiz.js OK; build-light-index.js OK; validate.js không báo lỗi nào về quiz.js (các lỗi còn lại của validate là pre-existing ở lessons-spring.js, newlessons.txt — file không sở hữu).

Thêm **10 câu trắc nghiệm** vào `js/data/quiz.js` (topic `devops`; id `qz-devops-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-devops-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: tình huống Docker/K8s/CI-CD/observability: probe, resource limit và OOMKilled, rolling update, graceful shutdown, alert theo SLO, trace qua Kafka.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/quiz.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Reviewed-by: kilo (T2455R)
