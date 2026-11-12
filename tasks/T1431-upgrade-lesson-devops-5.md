# T1431 — Nâng cấp bài học devops: lesson-devops-020, lesson-devops-021

Status: DONE
Agent: kilo
Owns: `js/data/lessons-devops.js`
After: T1429

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-devops-020` "Golden path: template tạo service mới với tham số được kiểm tra" — body 3264 ký tự, 3 câu check
- `lesson-devops-021` "Đo nền tảng như sản phẩm: tính 4 chỉ số DORA từ dữ liệu deploy và sự cố" — body 2509 ký tự, 3 câu check

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
- `lesson-devops-020`: bổ sung `### Cơ chế từng bước` (quy trình 6 bước validate→render→quét placeholder), ví dụ `~~~java` (render+quét), `### Lỗi hay gặp trên production` (4 tình huống), mở rộng `### Liên hệ phỏng vấn`; thêm 1 câu check (tổng 4), đáp án đúng phân bố vị trí 0,0,0,1.
- `lesson-devops-021`: bổ sung `### Cơ chế từng bước` (8 bước tính 4 chỉ số DORA, lý do dùng trung vị), ví dụ `~~~java` (medianLeadTime), `### Lỗi hay gặp trên production` (4 tình huống); thêm 1 câu check (tổng 4), đáp án đúng phân bố vị trí 0,0,0,1.
- Không sửa `exercises` (starter/tests/reference) và không đụng bài khác. `node scripts/build-light-index.js` và `node scripts/validate.js` → OK (cảnh báo sẵn có: `lesson-design-007` không nằm trong PATH). Không commit.
Reviewed-by: kilo (T1431R)
