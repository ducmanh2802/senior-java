# T1280R — Fact-check nội dung mới của T1280

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1280 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa:
- aws-016 (Ví dụ đời thực Well-Architected): "theo pilar Reliability" → "theo trụ cột Reliability" (pilar là từ ngoại ngữ lẫn vào văn bản tiếng Việt).

Các câu còn lại trong diff T1280 (aws-013, 014, 015, 017, 018): kỹ thuật đúng (Secrets Manager rotation/alternating users, NAT→VPC endpoint, Terraform drift/import state, Aurora failover+HikariCP max-lifetime/retry, S3 presigned URL vs giới hạn 6 MB invoke đồng bộ Lambda, Step Functions task token cho multi-day approval). Không lỗi markup, không backtick/`${` thô, không thêm/xoá mục, không sửa nội dung đã có ở HEAD.

Nghiệm thu:
- `node --check js/data/q-aws.js` → OK.
- `node scripts/validate.js` → không báo lỗi nào cho q-aws.js (aws: 61 câu hỏi, 29 trắc nghiệm, sạch).

Blocker (ngoài quyền task này, do task khác sở hữu):
- `js/data/index-light.js` bị cũ vì `node scripts/build-light-index.js` crash trên `js/data/q-soft.js` (backtick thô trong nội dung mới của task khác). q-soft.js là file của task khác, AGENTS.md mục 3 cấm sửa; `build-light-index.js` là file integrator, cũng không được động. validate.js exit 1 đến từ q-soft.js + lessons-testing/projects/path (cũ, không liên quan q-aws.js), KHÔNG do q-aws.js. Khi q-soft.js được sửa, hãy chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js` lại.
