# T1326R — Fact-check nội dung mới của T1326

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1326 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- devops-033 (mục "Cách xử lý" ví dụ Terraform, dòng mới của T1326): sửa `{{use_lockfile = true}}` — flag bịa. Terraform backend S3 **không có** tham số `use_lockfile` / khóa qua file `.tflock` trên S3; khóa state thực tế qua bảng DynamoDB (`dynamodb_table`). Thay bằng "khóa state qua bảng DynamoDB". Dòng tương tự ở js/data/q-devops.js:3092-3093 là nội dung HEAD, không chạm (luật 10).
- Các phần mới khác đã fact-check: commons-text Text4Shell (CVE-2022-42889) ảnh hưởng 1.5–1.9, vá ở 1.10.0 (xác thực NVD/CERT-EU) → nâng lên 1.10.0 đúng; distroless/java21-debian12 + jlink (jdk.crypto.ec từ JDK 22 gộp vào java.base, --compress=zip-6 từ JDK 21); fd/TIME_WAIT (60s, tcp_tw_reuse safe, tcp_tw_recycle đã xoá kernel 4.12); DNS ndots:5/glibc timeout 5s/NodeLocal DNSCache; K8s eviction-hard memory.available<100Mi, QoS oom_score_adj, PriorityClass preemptionPolicy. Không sai kỹ thuật nào khác.
- `node --check js/data/q-devops.js` OK; `node scripts/validate.js`: không báo lỗi nào thuộc q-devops.js. Lỗi còn lại (cú pháp lessons-*.js, path.js, index-light.js cũ) là lỗi trước đó của file không do task này sở hữu, không được chạm theo luật 3.
