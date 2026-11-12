# T1576 — Kiến thức: 8 câu hỏi kinh điển (devops) vào q-devops.js

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`

Thêm **8 câu hỏi phỏng vấn mới** (topic: devops) vào `js/data/q-devops.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-devops.js`); đọc danh sách để **không trùng ý**.

Chủ đề: Dockerfile tối ưu cho Spring Boot (layered jar, JRE nhỏ, non-root), JVM trong container (MaxRAMPercentage), Kubernetes requests/limits và OOMKilled, readiness/liveness/startup probe đúng, rolling update vs blue-green vs canary, quản lý secret trên K8s, observability (metrics, logs, traces) với Micrometer/OpenTelemetry.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-devops.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-devops.js logs/tmp-T1576.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm devops-144 đến devops-151 về Docker layered image, JVM/container memory, Kubernetes resources và probes, rollout/drain, Secret rotation, observability. `node scripts/build-light-index.js` và `node scripts/validate.js` đã chạy; validator báo `OK — không có lỗi.`
Reviewed-by: kilo (T1576R)
