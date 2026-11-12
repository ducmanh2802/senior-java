# T1368R — Fact-check nội dung mới của T1368

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1368 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- devops-056: không có lỗi kỹ thuật.
- devops-057: không có lỗi kỹ thuật.
- devops-058: sửa ví dụ curl Actuator loggers — thêm header {{Content-Type: application/json}} để đúng API Spring Boot (body JSON).
- devops-059: không có lỗi kỹ thuật.
- devops-060: sửa hướng xử lý đóng response — phân biệt Apache HttpClient ({{CloseableHttpResponse}} + consume entity, try-with-resources) và {{java.net.http.HttpClient}} (consume {{HttpResponse.BodyHandler}}, không tự tạo client mới mỗi request); bỏ cách nói try-with-resources trực tiếp với {{HttpResponse}} vì {{java.net.http.HttpResponse}} không phải {{AutoCloseable}}.
- devops-061: sửa property JVM thành {{networkaddress.cache.negative.ttl}} (thay vì shorthand {{negative.ttl}}); sửa gợi ý HikariCP để tránh giữ kết nối TCP cũ sau failover ({{maxLifetime}}/{{keepaliveTime}}/tạo kết nối mới định kỳ) và bỏ {{connectionInitSql}}/{{validationTimeout}} như cách giải quyết stale IP/DNS (validation DB không giải quyết IP cũ).
- `node scripts/validate.js` → OK (chỉ còn cảnh báo sẵn có, không phải do thay đổi T1368R). Không chạy build-light-index/test-lessons vì không thêm/sửa câu hỏi/bài học/algo/sd/drill/quiz/công ty (chỉ chỉnh nội dung đáp án).
