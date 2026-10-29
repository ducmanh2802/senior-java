# T361 — Primer: 10 bài nhập môn công nghệ cho người mới

Status: DONE
Agent: kilo
Owns: `js/data/q-primer.js`

Thêm **10 câu** topic primer, tất cả level **mid**, theo đúng phong cách các câu primer-001..007, phong cách câu hỏi phỏng vấn thật ("Bạn sẽ… thế nào?", "So sánh… khi nào chọn cái nào?"). Gợi ý chủ đề (kiểm tra trùng trước, thay bằng chủ đề tương đương nếu đã có):
- Git: commit, branch, merge vs rebase, xử lý conflict
- Linux cho dev backend: process, port, log, quyền file, top/ss/journalctl
- HTTP từ đầu: request/response, header, status code, keep-alive, HTTPS
- Maven và Gradle: dependency, scope, lifecycle, xung đột version
- Nginx: reverse proxy, load balancing, TLS termination
- RabbitMQ: exchange, queue, ack, so với Kafka
- OAuth2 và OpenID Connect cho người mới: các vai trò và luồng authorization code
- gRPC: protobuf, HTTP/2, khi nào dùng thay REST
- Elasticsearch/OpenSearch: inverted index, mapping, khi nào cần
- CI/CD: pipeline build-test-deploy, artifact, môi trường

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
- Thêm primer-008..017 (Git, Linux, HTTP, Maven/Gradle, Nginx, RabbitMQ, OAuth2/OIDC, gRPC, Elasticsearch/OpenSearch, CI/CD), tất cả mid.
- Review (claude): bỏ chữ Trung lẫn vào (008, 012, 015, 016, 017), sửa lỗi chính tả (keep-alide, bắt teway…), sửa sai kỹ thuật (TLS dùng ECDHE không gửi khoá phiên; inverted index ví dụ sai; analyzer char/token filter; Spring AMQP requeue mặc định + DLQ; nginx keepalive cần proxy_http_version 1.1; proto dùng int64 cho tiền), bỏ bảng thụt lề trong list, sửa analogy OAuth2, thêm OpenSearch.

Reviewed-by: claude (subagent; validate OK)
