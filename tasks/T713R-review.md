# T713R — Fact-check nội dung mới của T713

Status: DONE
Agent: opencode
Owns: `js/data/lessons-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T713 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review toàn bộ nội dung mới trong `js/data/lessons-devops.js` (lesson-devops-008 "Rolling update trên Kubernetes" và lesson-devops-009 "Prometheus metrics & SLO").

**Kiểm tra đã thực hiện:**
1. **Technical accuracy**: 
   - lesson-devops-008: maxSurge/maxUnavailable rounding rules (maxSurge round up, maxUnavailable round down) đúng theo K8s. preStop sleep + graceful shutdown + startupProbe + ENTRYPOINT exec form giải thích đúng. Số liệu ví dụ (10 replicas, 25% → 3 Pod surge, 2 Pod unavailable, minReady=8) tính đúng.
   - lesson-devops-009: Counter/Gauge/Histogram phân loại đúng. rate() và histogram_quantile() dùng đúng. Error budget formula: `allowed = (100-SLO%)/100 * total; remaining = allowed - errors` đúng. Bucket recommendations (50ms, 100ms, 250ms, 500ms, 1s, 2.5s) theo SLA thực tế. Cardinality warning về userId đúng.
2. **Markup**: Không có nested braces `{}` trong inline code `{{...}}`. Không có backtick hay `${` trong template literal. Tables, code blocks `~~~java`, headers `###`, lists `-` đều đúng format.
3. **Language**: Giao diện tiếng Việt, thuật ngữ kỹ thuật giữ nguyên tiếng Anh (rolling update, maxSurge, readiness probe, counter, gauge, histogram, error budget, cardinality, scrape, time series...).
4. **Validation**: `node scripts/validate.js` — không lỗi cho lessons-devops.js (lỗi hiển thị là ở file khác: q-kotlin.js, q-claude.js, q-english.js, lessons-testing.js — không thuộc task này).
5. **Exercises**: `node scripts/test-lessons.js` → 220/220 pass (bao gồm 2 bài tập mới của devops-008 và devops-009).

**Lưu ý**: Các lỗi validation ở file khác (q-kotlin.js, q-claude.js, q-english.js, lessons-testing.js) là nội dung T713 sửa ở file khác, không thuộc ownership của task này. Sẽ được owner tương ứng xử lý.
