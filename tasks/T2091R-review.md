# T2091R — Fact-check nội dung mới của T2091

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2091 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 6 câu mới của T2091 (devops-164 … devops-169). Sửa các lỗi kiến thức sau (chỉ trong file sở hữu `js/data/q-devops.js`, không đụng nội dung HEAD):

- **devops-164**: lệnh tách layer thiếu cờ → `java -Djarmode=tools ... extract` (không cờ) chỉ tạo `lib/` + `runner.jar`, KHÔNG tạo các thư mục `dependencies/`, `spring-boot-loader/`, `snapshot-dependencies/`, `application/` mà Dockerfile `COPY` → build fail. Đã sửa thành `extract --layers --launcher --destination extracted` (đúng docs Spring Boot "Efficient Deployments"; nhất quán ví dụ HEAD ở dòng 40 cùng file, cũng dùng `--layers --launcher` + `JarLauncher`).
- **devops-165**: "KubeT" (không phải khái niệm) → "kubelet" ở 2 chỗ (Ví dụ đời thực + câu follow-up).
- **devops-166**: "Đặt memory.limit nhỏ hơn memory.request" là cấu hình Kubernetes từ chối (limit phải ≥ request), không phải nguyên nhân gây evict → đổi thành "Đặt memory.request quá thấp so với thực tế: pod thuộc lớp Burstable, dễ bị evict sớm khi node thiếu bộ nhớ".
- **devops-168**: cache key `${CI_COMMIT_REF_SLUG}-${CI_COMMIT_SHA}` khiến mỗi commit có cache riêng, không tái dùng `.m2/repository` → đổi thành `${CI_COMMIT_REF_SLUG}` (nhất quán ví dụ HEAD dòng 9041).
- **devops-169**: bỏ 2 từ tiếng Anh lẫn vào: "mã băm uniquely" → "mã băm duy nhất"; "chưa thay đổi schema destroys data" → "chưa thay đổi schema làm hỏng dữ liệu".

Nội dung còn lại đúng kỹ thuật (Spring Boot 3.x layered jar/JarLauncher, K8s probe/health group, OOMKilled/NMT, rolling update/preStop/PDB/expand-contract, CI/CD gitleaks/trivy/semgrep/SBOM, rollback/Helm/ArgoCD). Không thêm/xoá mục, không sửa văn phong.

Nghiệm thu: `node --check js/data/q-devops.js` OK; `node scripts/validate.js` không còn lỗi nào thuộc `q-devops.js` (168 câu nạp bình thường). Validate tổng vẫn báo lỗi NGOÀI phạm vi task: `js/data/q-microservices.js` lỗi cú pháp "Unexpected identifier 'tắt'" (file của task khác đang viết dở) kéo theo các lỗi `microservices-*` ở bugs/lessons/projects/path, và `index-light.js` đã cũ (integrator chạy `node scripts/build-light-index.js`). Không tự sửa vì không thuộc quyền sở hữu.
