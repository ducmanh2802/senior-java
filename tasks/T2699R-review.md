# T2699R — Fact-check nội dung mới của T2699

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2699 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 10 mục mới (qz-devops-134 … qz-devops-143) trong `js/data/quiz-ops.js`. Nội dung kỹ thuật đúng chuẩn (Spring Boot 3.x layered jar + `-Djarmode=layertools` + `JarLauncher`, K8s 3 probe, Helm `--set`/`--values`, `actions/setup-java` cache maven, Prometheus counter/gauge/histogram + PromQL, Pushgateway). Không có API/flag bịa, không lẫn chữ nước ngoài, markup hợp lệ.

Lỗi đã sửa:
- qz-devops-135: tính sai thời điểm restart. Với `initialDelaySeconds: 10`, `periodSeconds: 5`, `failureThreshold: 3`, probe chạy tại 10s/15s/20s → lần fail thứ 3 ở ~20s, không phải 15s. Đã sửa "sau 3 lần fail (15 giây)" → "sau 3 lần fail (probe tại 10s, 15s, 20s → restart khoảng 20 giây)".

Không sửa các mục còn lại (không có lỗi kiến thức).

`node scripts/validate.js`: file `quiz-ops.js` KHÔNG còn lỗi. Validator vẫn báo 2 lỗi ở file KHÔNG thuộc task này (không được phép sửa theo luật 3):
- lessons-jpa.js: lesson-jpa-020 (body < 2500 ký tự) — file đang dở của agent khác (working tree M).
- lessons-jvm.js: lesson-jvm-004 (related "jvm-032" không tồn tại) — lỗi có sẵn ở HEAD.
Đề xuất integrator/agent chủ sở hữu các file đó xử lý riêng.
