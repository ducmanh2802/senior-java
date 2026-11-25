# T2682R — Fact-check nội dung mới của T2682

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2682 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa trong `js/data/q-devops.js` (nội dung mới T2682: devops-201..devops-209), theo từng id:

- devops-206: cấu trúc JS bị hỏng — `a:` bị đóng sớm ngay sau bản tóm tắt, toàn bộ phần thân câu trả lời bị đè làm mã trống (`### Hiểu nhanh`... nằm ngoài template literal), và thiếu backtick đóng trước `follow:` → đã khôi phục cấu trúc template literal bao toàn bộ đáp án (giống devops-201..205).
- devops-201, devops-206, devops-207, devops-208: có ký tự backtick `` ` `` nằm **trong** nội dung template literal (`/actuator/health/readiness`, `.hprof`, `CREATE ROLE`, `sys/leases/lookup`, `locks`, `pool usage`, `server.shutdown=graceful`, `spring.lifecycle.timeout-per-shutdown-phase=30s`, `rollout`, `canaryMetadata.labels.rollout`, `stableMetadata.labels.rollout`) → làm vỡ template literal. Thay bằng markup `{{...}}`.
- devops-205: ký tự lạ `'` dính sau backtick đóng template literal (`` `', `` → `` `, ``).
- devops-202: số liệu sai — SLO 99.95% → error budget 0.05% ≈ **21.6 phút/tháng** (tháng 30 ngày), không phải 43.2 phút. Sửa ở cả "Hiểu nhanh" và "Thuật ngữ".
- devops-205: số liệu vô căn cứ — query burn-rate có phép `* 8640` không có nghĩa → bỏ đi; đồng thời sửa lỗi thụt lề metric `error-budget-burn-rate` trong YAML mẫu (`- name:` bị lệch cấp so với `metrics:`).
- devops-205: cơ chế nói ngược — `initContainer` gọi `curl http://localhost:8080/api/warmup`, nhưng init container chạy **trước** container chính, endpoint chưa nghe → xóa block initContainer này.
- devops-203: API bịa — manifest YAML thuần (Argo CD, không qua Helm) dùng cú pháp Helm `{{ include (print $.Template.BasePath "/configmap.yaml") | sha256sum }}` cho annotation `checksum/config` → bỏ dòng này (reloader annotation `reloader.stakater.com/auto: "true"` đã đủ).
- devops-201: ký tự lạ tiếng Nga "накопи" trong "Điều tra" → sửa thành "tích lũy".

Kết quả: `node --check js/data/q-devops.js` OK; `node scripts/validate.js` không báo lỗi/cảnh báo nào cho `q-devops.js`.

### Notes về toàn repo (không phải file của task này, không đụng)
- `js/data/q-sql.js` (của T2689, đã bị chỉnh sửa trong working tree bởi agent khác) có lỗi cú pháp tại `tắt` → chặn `node scripts/build-light-index.js` và `validate.js` tổng thể. Bản HEAD của q-sql.js không lỗi. Không sửa vì không sở hữu file.
- `js/data/lessons-jpa.js`, `lessons-jvm.js`, `lessons-sql.js` (của T2686/T2689…) và `q-concurrency-jvm.js`, `q-spring-data.js` còn lỗi/cảnh báo riêng, không liên quan nội dung devops của task này.
- `index-light.js` stale do `build-light-index.js` không thể chạy đầy đủ (chặn ở q-sql.js trên); file này không thuộc quyền sở hữu task này.
