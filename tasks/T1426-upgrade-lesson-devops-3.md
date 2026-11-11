# T1426 — Nâng cấp bài học devops: lesson-devops-016, lesson-devops-017

Status: DONE
Agent: kilo
Owns: `js/data/lessons-devops.js`
After: T1419

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-devops-016` "RBAC authorizer thu nhỏ: Role, ClusterRole, Binding và mặc định từ chối" — body 3267 ký tự, 2 câu check, THIẾU "### Liên hệ phỏng vấn"
- `lesson-devops-017` "PVC binding và StorageClass: bind, provision, reclaim" — body 2615 ký tự, 2 câu check, THIẾU "### Liên hệ phỏng vấn"

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

Đã nâng cấp lesson-devops-016 (RBAC authorizer) và lesson-devops-017 (PVC/StorageClass) trong js/data/lessons-devops.js (file duy nhất do task này sở hữu):
- body lên ~6,5–6,6k ký tự: thêm `### Cơ chế từng bước`, ví dụ `~~~yaml` manifest + bảng so sánh, `### Lỗi hay gặp trên production` (triệu chứng → nguyên nhân → cách sửa, không trùng phần cũ), `### Liên hệ phỏng vấn` ở cuối body.
- check: 2 → 3 câu, đáp án trải các vị trí (1, 1, 0 cho 016; 3, 1, 0 cho 017), explain đủ lý do đúng/sai.
- exercises unchanged, tiếng Việt có dấu, thuật ngữ giữ Anh.
- node scripts/validate.js js/data/lessons-devops.js: không lỗi nào phát sinh từ file này.

Chặn toàn-cục: validate.js toàn bộ báo lỗi cú pháp trong lessons-jpa.js và lessons-microservices.js (template literal bị hỏng vì các dấu closing backtick của field explain bị agent khác đổi thành {{ }} trước phiên này — hai file KHÔNG thuộc task này, tuân thủ luật 3 AGENTS.md không tự sửa). Do đó build-light-index.js cũng crash khi nạp toàn bộ file dữ liệu và index-light.js bị báo "đã cũ". Cần integrator sửa hai file nêu trên rồi chạy lại build-light-index.js + validate.js để có OK toàn cục.
Reviewed-by: kilo (T1426R)
