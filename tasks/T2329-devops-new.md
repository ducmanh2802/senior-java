# T2329 — 5 câu phỏng vấn DevOps/observability mới

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`
After: T2240

Thêm 5 câu: OpenTelemetry tracing cho Spring Boot 3 (Micrometer Tracing, propagate qua Kafka), SLO/error budget và alert theo burn rate, zero-downtime deploy với migration DB (expand/contract), GitHub Actions pipeline cho Java (cache, test song song, build image), điều tra memory leak trên pod K8s (heap dump, NMT). Đúng chuẩn AGENTS.md mục 6 (Tóm tắt, ### cơ chế, code ≤30 dòng, ### Ví dụ đời thực có số liệu, ### Trả lời mẫu khi phỏng vấn, > Senior tip:, 3000–5000 ký tự). Dùng qtool.js list để không trùng ý.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT (không dùng lại số cũ), không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/q-devops.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
- Trước: id lớn nhất devops-174 (line 15430). Sau: thêm devops-175..devops-179 (5 câu).
  - devops-175 (senior): OpenTelemetry tracing cho Spring Boot 3 qua Micrometer Tracing, propagate context qua Kafka headers (W3C traceparent), bẫy ProducerRecord/KafkaTemplate, async ThreadLocal.
  - devops-176 (senior): SLO/SLI/error budget, burn rate alert multi-window (PromQL Prometheus) cho payment API 99.95%.
  - devops-177 (lead): Zero-downtime deploy với migration DB theo expand/contract (thêm cột NOT NULL, đổi tên cột, dual-write, backfill) kết hợp K8s rolling deploy.
  - devops-178 (senior): GitHub Actions pipeline Java 21 Spring Boot 3 (cache Maven, test song song matrix, Docker Buildx build image, tag SHA).
  - devops-179 (senior): Điều tra OOMKilled/Pod K8s (heap dump + Eclipse MAT, NMT baseline/diff, thread dump series) phân biệt heap vs off-heap leak.
- Mỗi câu: **Tóm tắt**, giải thích thuật ngữ, ### cơ chế từng bước, code block ~~~, ### Ví dụ đời thực có số liệu, ### Lỗi hay gặp, ### Trả lời mẫu khi phỏng vấn, > Senior tip, follow >=3. Không backtick, không ${.
- Chạy: node --check js/data/q-devops.js OK. node scripts/build-light-index.js OK (tổng 2165 câu, devops 178 câu). node scripts/validate.js exit 1 do lỗi **pre-existing không thuộc phạm vi task**: quiz-ccao-2.js (lỗi cú pháp), devops-171.a (inline code có { } lồng nhau, có từ trước), devops-173.a (code fence ~~~ chưa đóng, có từ trước). Không sửa được theo luật 3/5 (chỉ thêm vào cuối file sở hữu). Các câu mới devops-175..179 không phát sinh lỗi/warning mới.
