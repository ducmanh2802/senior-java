# T356 — Debug lab: thêm 2 bài SQL + 4 bài incident

Status: DONE
Agent: claude
Owns: `js/data/labs-sql.js`, `js/data/labs-incident.js`

Đọc AGENTS.md mục 10 (Debug lab) và các bài có sẵn. Thêm 2 bài sql (EXPLAIN ANALYZE PostgreSQL thật: ví dụ ước lượng sai số dòng do statistics cũ, index không dùng được vì kiểu dữ liệu hoặc hàm) và 4 bài incident (ví dụ: connection pool cạn sau deploy, Kafka consumer lag do rebalance, cache stampede, cascading failure do thiếu timeout) với log ứng dụng, metric, timeline thật và tự nhất quán. Không trùng bài đã có.

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
- Đã thêm lab-sql-009 (statistics cũ sau bulk load → Nested Loop, extended statistics), lab-sql-010 (generic plan prepared statement + data skew multi-tenant).
- Đã thêm lab-incident-010 (Hikari pool 40 làm cạn max_connections, payment bị hại), lab-incident-011 (KEDA autoscale vượt số partition → eager rebalance storm, SMS trùng), lab-incident-012 (đổi serializer/prefix Redis cache → cold cache, DB sập), lab-incident-013 (thiếu timeout + liveness probe → restart storm).
- node --check cả hai file OK; node scripts/validate.js → OK. Không dùng refs.
Reviewed-by: claude (subagent; validate OK)
