# T1483 — Trắc nghiệm: thêm 15 câu topic banking

Status: DONE
Agent: kilo
Owns: `js/data/quiz-gaps.js`

Thêm **15 câu trắc nghiệm** topic `banking` vào cuối `js/data/quiz-gaps.js` (schema AGENTS.md mục 4; xem các câu có sẵn trong file làm mẫu). Id `qz-banking-NNN`, nối tiếp id lớn nhất hiện có của topic (tìm: `grep -oh "qz-banking-[0-9]*" js/data/quiz*.js | sort | tail -1`).

Nội dung: nghiệp vụ ngân hàng/fintech cho backend: ledger, double-entry, idempotency thanh toán, đối soát, chuẩn ISO 8583/20022 ở mức khái niệm, bảo mật dữ liệu thẻ. Câu hỏi dạng tình huống thực tế ("Service X gặp…, nguyên nhân/cách sửa nào đúng?"), không hỏi định nghĩa suông, không trùng ý câu đã có. Khoảng 10 câu một đáp án và 5 câu `multi: true` (Chọn 2). Đáp án đúng rải đều vị trí 0–3. `explain` (tiếng Việt có dấu) giải thích vì sao đúng VÀ vì sao từng phương án sai là sai. Kiến thức phải ĐÚNG (Java 17/21, Spring Boot 3.x).

## Luật
- Đọc AGENTS.md trước. **Chỉ thêm** object mới vào cuối `js/data/quiz-gaps.js`; không sửa/xoá mục đã có; không sửa file nào khác.
- Cách thêm an toàn (khuyên dùng): viết các object mới (cú pháp JavaScript, cách nhau bằng dấu phẩy) vào file tạm `logs/tmp-T1483.js`, rồi chạy `node scripts/qtool.js append js/data/quiz-gaps.js logs/tmp-T1483.js`. Tool tự kiểm tra cú pháp, id trùng và chèn đúng chỗ. **KHÔNG ghi lại toàn bộ file dữ liệu.**
- Chuỗi tiếng Anh có dấu nháy đơn (I'm, don't, it's) → bọc chuỗi bằng dấu nháy kép "...". Không dùng backtick và ký tự $ trong nội dung.
- Tiếng Anh phải **đúng ngữ pháp, tự nhiên, câu ngắn dễ nói** (trình độ B1–B2, đúng kiểu một kỹ sư nói khi phỏng vấn, không văn viết hoa mỹ). Nội dung kỹ thuật phải ĐÚNG. Tiếng Việt có dấu đầy đủ.
- Tự viết bằng lời của mình, không chép từ sách hay trang web. Không trùng ý với mục đã có.

## Nghiệm thu
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Sửa dòng `Status: TODO` thành `Status: DONE` và ghi Notes: danh sách id đã thêm.

## Notes
- Added 15 banking quiz questions to `js/data/quiz-gaps.js` (appended via `node scripts/qtool.js append` from `logs/tmp-T1483.js`).
- IDs: `qz-banking-013`, `qz-banking-014` (multi), `qz-banking-015`, `qz-banking-016` (multi), `qz-banking-017`, `qz-banking-018`, `qz-banking-019` (multi), `qz-banking-020`, `qz-banking-021` (multi), `qz-banking-022`, `qz-banking-023` (multi), `qz-banking-024`, `qz-banking-025`, `qz-banking-026`, `qz-banking-027`.
- Split: 10 single-answer + 5 multi (Chọn 2). Correct answers spread across positions 0–3.
- Topics covered: ledger/append-only audit trail, double-entry, idempotency key & retries/timeouts, reconciliation (matched/mismatched/unmatched, timing, amount mismatch), ISO 8583 (concept, bitmap/MTI), ISO 20022 (conceptual difference), card data security/PCI DSS (no CVV, tokenization/masking), transactional outbox.
- Ran `node scripts/build-light-index.js` and `node scripts/validate.js` → OK (only pre-existing warning: `path.js: có 1 bài học không nằm trong PATH: lesson-design-007`). Banking quiz count now 27. No git commit. No files outside task ownership modified.
Reviewed-by: kilo (T1483R)
