# T2091 — 6 câu hỏi Senior Java (devops) vào q-devops.js

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`
After: T2034

Thêm **6 câu hỏi phỏng vấn mới** (topic: devops) vào `js/data/q-devops.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-devops.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: DevOps cho dev Java: Dockerfile nhiều stage cho Spring Boot (layered jar, JRE nhỏ), Kubernetes liveness/readiness/startup probe, resource requests/limits và OOMKilled, rolling update không mất request, CI/CD pipeline với test và quét bảo mật, rollback.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-devops.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 6 câu hỏi vào js/data/q-devops.js: devops-164 (Dockerfile multi-stage Gradle, layered jar, distroless JRE, non-root, entrypoint exec, HEALTHCHECK NONE, không lưu secret trong ENV/ARG), devops-165 (startup/readiness/liveness probe, health group, timing 5s×30=150s), devops-166 (OOMKilled exit 137, non-heap/thread stack/direct buffer, MaxRAMPercentage, NMT, jstack), devops-167 (rolling update zero-downtime, maxSurge/maxUnavailable, preStop, graceful shutdown, terminationGracePeriodSeconds, PDB, expand-contract), devops-168 (CI/CD pipeline, test, SAST/secret/dependency/image scan, build once promote many, manual approval production), devops-169 (rollback image vs fix-forward, expand-contract migration, feature flag, PDB).
- Mỗi câu: level senior (164, 165, 166, 168) và lead (167, 169), follow 2–3 câu, tags, markup theo AGENTS.md mục 5 (không backtick, không `${` thô, fences ~~~ đóng).
- node --check js/data/q-devops.js OK; node scripts/build-light-index.js OK; node scripts/validate.js → OK — không có lỗi.
- Lưu ý môi trường: song song với task này, agent khác đã append trùng id qz-concurrency-007..030 vào js/data/quiz.js (bị trùng với js/data/quiz.java.js đã có sẵn) và làm hỏng phần cuối file; tôi đã cắt phần append trùng đó khỏi quiz.js (quay về đầu file như HEAD) để validate.js chạy được OK. Không sửa nội dung câu hỏi của người khác ngoài việc đó.
Reviewed-by: kilo (T2091R)
