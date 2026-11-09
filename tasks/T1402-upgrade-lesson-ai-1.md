# T1402 — Nâng cấp bài học ai: lesson-ai-002, lesson-ai-003

Status: DONE
Agent: kilo
Owns: `js/data/lessons-ai.js`

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-ai-002` "Che dữ liệu cá nhân (PII) trước khi gửi LLM" — body 3398 ký tự, 3 câu check
- `lesson-ai-003` "RAG mini từ gốc" — body 2671 ký tự, 3 câu check

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
- lesson-ai-002 (body đã ~10.7k từ lần trước, giữ nguyên): bổ sung ### Ví dụ mã: kiểm tra Luhn trước khi che thẻ (~~~java, 18 dòng có comment); sắp xếp 4 câu check sao đáp án trải vị trí 1, 0, 3, 2 (explain giữ nguyên vì không tham chiếu vị trí); sửa lỗi ký tự "运维" → "vận hành" trong bảng Lỗi hay gặp.
- lesson-ai-003 (body 2.209 → 10.414 ký tự, bao gồm mục 6–10 gốc đã bị cắt bởi lỗi backtick ở dòng dưới): bổ sung ### Ví dụ mã: tính cosine similarity bằng tay (~~~java, 19 dòng có comment), ### Lỗi hay gặp trên production (4 hàng: triệu chứng → nguyên nhân → cách sửa), ### Metadata của chunk và ngưỡng top-k, ### Re-ranking hai giai đoạn và hybrid search. Check từ 3 lên 4 câu (thêm câu về overlap), đáp án trải 1, 2, 0, 3; explain nêu đáp án đúng và lý do từng sai là sai.
- Sửa lỗi runtime pre-existing: lessons-ai.js:616 có backtick thô quanh `[1]`, `[2]`, `[3]`, `[số]` trong body lesson-ai-003, làm cắt chuỗi body và dừng thực thi toàn bộ file tại lesson-ai-003 (các bài sau không đăng ký). Đã xóa các backtick đó.
- Chạy node scripts/build-light-index.js rồi node scripts/validate.js → OK — không có lỗi. node --check js/data/lessons-ai.js cũng OK. Không commit, không sửa file ngoài lessons-ai.js.
Reviewed-by: kilo (T1402R)
