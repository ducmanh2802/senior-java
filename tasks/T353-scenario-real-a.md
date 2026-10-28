# T353 — Tình huống production thật (phần 1): Spring, Kubernetes, Kafka, nâng cấp

Status: DONE
Agent: claude
Owns: `js/data/q-scenario.js`

Thêm **15 câu** topic scenario (khoảng 20% mid, 55% senior, 25% lead). Mỗi câu là một tình huống production cụ thể có triệu chứng và số liệu; đáp án theo khung: triệu chứng → giả thuyết → cách xác minh (lệnh, metric, log) → nguyên nhân gốc → sửa ngắn hạn/dài hạn → phòng ngừa. Chủ đề:
- Spring: @Transactional không rollback (checked exception, self-invocation, private method); @Async mất SecurityContext/MDC; OSIV gây N+1 ngầm; state dùng chung trong singleton bean.
- Kubernetes: liveness probe giết pod khi GC dài hoặc lúc khởi động; rolling deploy làm rơi request (graceful shutdown, preStop); HPA dao động; CPU throttling do limit.
- Kafka: rebalance storm (max.poll.interval.ms), poison message kẹt partition (DLT), consumer lag tăng dần.
- Nâng cấp: Java 8/11 lên 21; Spring Boot 2 lên 3 (javax → jakarta, Hibernate 6); đổi API làm vỡ app mobile phiên bản cũ.
Không trùng scenario-001..056 (đọc hết trước).

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
- Đã thêm 15 câu scenario-057..071 (mid 3, senior 8, lead 4): 057 @Transactional không rollback, 058 @Async mất SecurityContext/MDC, 059 OSIV N+1 ẩn, 060 state trong singleton, 061 liveness/startupProbe, 062 rolling deploy rơi request, 063 HPA dao động, 064 CPU throttling, 065 rebalance storm, 066 poison message/DLT, 067 consumer lag tăng dần, 068 Java 8/11 lên 21, 069 Boot 2 lên 3, 070 đổi API vỡ app mobile cũ, 071 virtual threads pinning sau khi lên Java 21.
- node --check, check-links (51 link OK, đã bỏ 1 link OpenRewrite 404), validate.js OK.

Reviewed-by: claude (subagent; validate OK)
