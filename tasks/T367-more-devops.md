# T367 — DevOps: thêm 8 câu nền tảng

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`

Thêm **8 câu** topic devops, ưu tiên level **mid** (khoảng 60% mid, 30% senior, 10% lead), phong cách câu hỏi phỏng vấn thật ("Bạn sẽ… thế nào?", "So sánh… khi nào chọn cái nào?"). Gợi ý chủ đề (kiểm tra trùng trước, thay bằng chủ đề tương đương nếu đã có):
- Dockerfile tốt cho Spring Boot: multi-stage, layer, non-root
- Docker Compose cho môi trường dev
- Kubernetes cho người mới: Pod, Deployment, Service, Ingress
- ConfigMap/Secret và cấu hình Spring theo môi trường
- Rolling update, blue-green, canary
- Health check: readiness vs liveness vs startup probe
- Log, metric, trace: ba trụ cột observability
- GitHub Actions: pipeline build, test, build image, deploy

### Chuẩn chung (bắt buộc)
- Đọc AGENTS.md mục 2, 4, 5, 6, 13 trước khi viết. Người học là dev Java ~4 năm, **hổng nền tảng**: giải thích từ gốc, ví dụ đời thường, cơ chế từng bước có "vì sao", sơ đồ ASCII hoặc số liệu, code ngắn có comment, bảng trade-off, ### Lỗi hay gặp, ### Trả lời miệng 1 phút ngay trước > Senior tip:.
- Chống trùng: đọc hết câu cùng topic trong file của bạn và grep các file js/data/q-*.js khác; chủ đề đã có thì chọn góc khác hoặc bỏ.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6, Kubernetes/AWS hiện hành. Không chắc thì viết ít lại nhưng đúng. refs chỉ dùng link chắc chắn tồn tại; chạy node scripts/check-links.mjs <tên-file.js> (chỉ tên file) và bỏ link hỏng.
- Chỉ **thêm**, id tiếp số lớn nhất của topic/category trong file. Không sửa nội dung đã có.
- Trong template literal: không có ký tự backtick, không có ${ chưa escape, dấu \ phải viết \\; inline code dùng {{code}}.
- **Không bao giờ để file hỏng cú pháp**: sau mỗi lần sửa chạy node --check <file>; nếu hỏng mà không sửa được thì khôi phục bằng git checkout -- <file> rồi làm lại từng mục một.
- Không chạy trực tiếp file .js như lệnh (luôn node <file>). Không commit/push, không kill tiến trình, không mở trình duyệt.
- Xong: node scripts/validate.js → OK — không có lỗi.; ghi Notes (id đã thêm) và đổi dòng trạng thái thành đúng Status: DONE (chỉ dùng TODO hoặc DONE, không dùng giá trị khác).

## Notes

- Thêm 8 câu devops-023 … devops-030 (mid 5: 023 Docker Compose môi trường dev + spring-boot-docker-compose, 024 mạng/volume Docker, 025 ConfigMap/Secret → Spring (env, configtree, reload), 026 tag/digest/imagePullPolicy/lifecycle, 027 GitHub Actions OIDC/cache/environment/concurrency; senior 2: 028 CronJob/Job cho batch Spring Boot, 029 PDB + topology spread khi drain node; lead 1: 030 multi-tenancy cluster dùng chung: namespace, RBAC, quota, LimitRange, NetworkPolicy, PSA).
- Các gợi ý Dockerfile/K8s cơ bản/rollout/probe/observability/pipeline đã có (devops-001…022, primer) nên chọn góc mới.
- refs: kubernetes.io, docs.github.com; check-links q-devops.js: 10 link, hỏng 0. node --check + validate OK.

Reviewed-by: claude (subagent; validate OK)
