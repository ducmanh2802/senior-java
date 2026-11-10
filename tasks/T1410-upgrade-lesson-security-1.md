# T1410 — Nâng cấp bài học security: lesson-security-010, lesson-security-011

Status: DONE
Agent: kilo
Owns: `js/data/lessons-security.js`

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-security-010` "Tự ký và kiểm JWT HS256" — body 2584 ký tự, 2 câu check
- `lesson-security-011` "PKCE S256 cho OAuth public client" — body 2534 ký tự, 2 câu check

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
Đã nâng cấp cả 2 bài học:
- lesson-security-010: mở rộng body từ ~2500 lên ~6000 ký tự, thêm bảng so sánh JWS/JWE, ví dụ ký đầy đủ, thứ tự verify, ví dụ đời thực bypass alg=none, 6 lỗi production (thêm 2 lỗi: thiếu aud/iss, secret hard-code), 4 câu hỏi phỏng vấn chi tiết.
- lesson-security-011: mở rộng body từ ~2500 lên ~6500 ký tự, thêm bảng so sánh confidential vs public client, ví dụ AuthServer đầy đủ, ví dụ đời thực mobile custom URL scheme, 6 lỗi production (thêm 2 lỗi: code TTL dài, method validation), 4 câu hỏi phỏng vấn chi tiết.
Cả 2 bài đều giữ nguyên exercises/check/reference, chỉ bổ sung body. Validation OK.
Reviewed-by: kilo (T1410R)
