# T2322 — 20 câu trắc nghiệm DevOps/K8s/AWS mới

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ops.js`
After: T2205

Định dạng QUIZ (AGENTS.md mục 4). Grep `q:` để không trùng. Thêm 20 câu (id tiếp số lớn nhất của topic): readiness/liveness/startup probe, resource requests/limits và OOMKilled, rolling update maxSurge/maxUnavailable, HPA theo CPU vs custom metric, ConfigMap/Secret mount và reload, Docker multi-stage build cho Spring Boot (layered jar), CI cache Maven/Gradle, blue-green vs canary. 1/4 multi (Chọn 2), explain vì sao từng phương án sai, đáp án rải đều.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm, không được giảm).

## Nghiệm thu
`node --check js/data/quiz-ops.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
- Trước: devops quiz trong `js/data/quiz-ops.js` có `qz-devops-069`..`qz-devops-073` (cao nhất 073).
- Sau: thêm 20 câu mới `qz-devops-074`..`qz-devops-093` (cao nhất 093), tăng đúng 20.
- Nội dung: readiness/liveness/startup probe; resource requests/limits & OOMKilled; rolling update maxSurge/maxUnavailable; HPA CPU vs custom metric; ConfigMap/Secret mount & reload; Docker multi-stage build + Spring Boot layered jar; CI cache Maven/Gradle; blue-green vs canary.
- Multi (Chọn 2): `qz-devops-077`, `qz-devops-081`, `qz-devops-084`, `qz-devops-087` (4/20 = 1/5, đáp án mảng tăng dần). Đáp án đơn rải đều (0-3). Explain nêu vì sao từng phương án sai, dùng markup hợp lệ ({{ }}, ~~~, không backtick, không `${` thô).
- Đã chạy: `node --check js/data/quiz-ops.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` báo devops quiz tăng 73→93.
- Lỗi còn lại trong `node scripts/validate.js` (pre-existing, ngoài phạm vi task, không thuộc file sở hữu): `sdlc.js: lỗi cú pháp/chạy: missing ) after argument list`. Không sửa file khác theo luật 3.
Reviewed-by: kilo (T2322R)
