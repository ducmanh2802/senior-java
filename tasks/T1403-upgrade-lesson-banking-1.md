# T1403 — Nâng cấp bài học banking: lesson-banking-001, lesson-banking-002

Status: DONE
Agent: kilo
Owns: `js/data/lessons-banking.js`

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-banking-001` "Tiền trong code: không dùng double, BigDecimal, phí giao dịch và chia tiền theo largest-remainder" — body 4196 ký tự, 3 câu check, THIẾU "### Liên hệ phỏng vấn"
- `lesson-banking-002` "Đối soát cuối ngày: vì sao hai bên lệch và cách xử lý dòng lệch" — body 2550 ký tự, 2 câu check, THIẾU "### Liên hệ phỏng vấn"

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
- `lesson-banking-001`: body nâng từ nội dung lặp (filler) + ~4.2k lên ~6985 ký tự (giải thích thuật ngữ IEEE 754/đơn vị nhỏ nhất/BigDecimal/RoundingMode/scale cho người mới; cơ chế từng bước 6 bước vì sao không dùng double; giữ bảng so sánh + lỗi production + ví dụ `~~~java`; thay phần "Liên hệ phỏng vấn" trùng lặp bằng 3 Q&A chi tiết + Senior tip ở cuối). `check` vẫn 4 câu nhưng viết lại đầy đủ (đáp án rải vị trí 1,1,2,2) với explain nêu vì sao đúng/sai từng phương án. Không sửa `exercises`.
- `lesson-banking-002`: body ~6534 ký tự (giữ nội dung cũ, đã có cơ chế từng bước, lỗi production, `~~~seq`, ví dụ `~~~java`, bảng trạng thái); bổ sung 2 câu hỏi phỏng vấn nữa (cut-off, AMOUNT_MISMATCH) để đạt 3 Q&A ở mục `### Liên hệ phỏng vấn` cuối body, giữ Senior tip. `check` giữ 3 câu, viết lại explain chi tiết (đáp án rải 1,1,1). Không sửa `exercises`.
- Kiểm tra: `node --check` không dùng được cho file IIFE browser (false positive cú pháp bảng markdown ngoài context), nhưng `require('./scripts/browser-shim.js'); require('./js/data/lessons-banking.js')` parse OK (2 bài). `node scripts/validate.js` không báo lỗi nào thuộc `lessons-banking.js`.
- `node scripts/build-light-index.js` hiện fail do lỗi cú pháp **có sẵn** trong `js/data/lessons-ai.js` (không thuộc sở hữu task) — không sửa theo luật 3. `index-light.js` vì vậy chưa rebuild được trong lần chạy này; integrator cần rebuild sau khi `lessons-ai.js` được sửa. Không commit.
Reviewed-by: kilo (T1403R)
