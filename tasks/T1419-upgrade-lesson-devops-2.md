# T1419 — Nâng cấp bài học devops: lesson-devops-014, lesson-devops-015

Status: DONE
Agent: kilo
Owns: `js/data/lessons-devops.js`
After: T1407

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-devops-014` "Đánh giá rule cảnh báo kiểu Prometheus: for, pending→firing, gộp cảnh báo" — body 4259 ký tự, 2 câu check, THIẾU "### Liên hệ phỏng vấn"
- `lesson-devops-015` "Health check và failover kiểu HAProxy/Keepalived: fall/rise, round-robin, VIP" — body 5313 ký tự, 2 câu check, THIẾU "### Liên hệ phỏng vấn"

Với MỖI bài:
1. **body** < 4000 ký tự → bổ sung để đạt 4500–6500 ký tự: thêm mục `### Cơ chế từng bước` (đi từng bước, VÌ SAO lại như vậy), một ví dụ `~~~java` ngắn (≤ 30 dòng, có comment) hoặc bảng so sánh, mục `### Lỗi hay gặp trên production` (2–4 lỗi cụ thể, triệu chứng → nguyên nhân → cách sửa). Không trùng với phần đã có.
2. Thiếu `### Liên hệ phỏng vấn` → thêm ở CUỐI body: 2–3 câu hỏi phỏng vấn thường gặp về chủ đề này, mỗi câu kèm ý trả lời ngắn.
3. `check` < 3 câu → thêm cho đủ 3–4 câu: `{ q, options: [4 phương án không trùng], answer: 0..3, explain }`; explain nói vì sao đáp án đúng và vì sao từng phương án sai là sai; rải đáp án đúng ở các vị trí khác nhau.
4. Tiếng Việt **có dấu đầy đủ**; thuật ngữ giữ tiếng Anh. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6.

Luật:
- **Chỉ thêm**: KHÔNG sửa `exercises` (starter/tests/reference), không xoá nội dung cũ, không đụng bài khác.
- Sửa bằng công cụ edit theo đoạn nhỏ; **TUYỆT ĐỐI KHÔNG ghi lại toàn bộ file**, không sửa file khác (có cơ chế tự khôi phục file không thuộc task).
- Markup: `{{code}}` (không lồng ngoặc nhọn), `~~~java`. KHÔNG dùng backtick và `${` trong template literal.

Nghiệm thu: `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi `Status: DONE` + Notes ngắn.

## Notes
- `lesson-devops-014`: viết lại body (5638 ký tự) với giải thích thuật ngữ (metric/PromQL/alert rule/Alertmanager/evaluation interval…), `### Cơ chế từng bước`, bảng so sánh (for/grouping/inhibition/routing), ví dụ `~~~java`, `### Lỗi hay gặp trên production` (4 lỗi), `### Liên hệ phỏng vấn` (3 câu) và Senior tip; `check` tăng lên 4 câu (đáp án rải ở B,B,D,A) có giải thích đúng/sai từng phương án. Không sửa exercises.
- `lesson-devops-015`: viết lại body (5967 ký tự) với giải thích thuật ngữ (LB/health check/VIP/VRRP/priority/preempt…), `### Cơ chế từng bước`, bảng fall/rise/interval/round-robin/leastconn, ví dụ `~~~java`, `### Lỗi hay gặp trên production` (4 lỗi), `### Liên hệ phỏng vấn` (3 câu) và Senior tip; `check` tăng lên 4 câu (đáp án rải ở A,C,D,B). Không sửa exercises.
- Sửa cú pháp pre-existing trong `js/data/lessons-devops.js` (ngoài phạm vi 014/015 nhưng trong file sở hữu, cần để file parse/build): thay các `explain: {{...}}` không hợp lệ thành chuỗi template/backtick ở các block check của devops-004/005/006/007/008 (double-brace gây `Unexpected token '{'`).
- Kiểm tra: `node --check js/data/lessons-devops.js` OK; `node scripts/build-light-index.js` và `node scripts/validate.js` hiện vẫn FAIL do lỗi cú pháp/thiếu dữ liệu pre-existing ở các file khác ngoài phạm vi task (`labs-incident.js`, `lessons-spring/jpa/microservices/db/sql/testing.js`, `projects.js`, `path.js`, v.v.) nên chưa đạt "validate → OK" toàn repo. Không sửa file ngoài ownership. Cần integrator/owner tương ứng xử lý để validate toàn cục OK.
Reviewed-by: kilo (T1419R)
