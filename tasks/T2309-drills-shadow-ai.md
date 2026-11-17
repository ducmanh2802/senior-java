# T2309 — 25 câu shadowing tiếng Anh: nói về dự án tích hợp AI vào backend Java

Status: DONE
Agent: kilo
Owns: `js/data/drills-shadow.js`
After: T2282

Định dạng `shadow` ở comment đầu `js/data/drills-shadow.js`; đọc 3 câu có sẵn.
Thêm 25 câu `drill-shadow-NNN` (theme tech/project/design), mỗi câu 8–25 từ, văn nói tự nhiên của Senior khi kể về: gọi LLM API từ Spring Boot, timeout/retry, cache, chi phí token, đánh giá output, bảo mật dữ liệu khách hàng, rollout an toàn. `vi`: nghĩa tiếng Việt chính xác.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa mục cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Đếm id trước/sau trong Notes (phải tăng đúng số đã thêm) — lần trước có task ghi đã thêm mà file không đổi.

## Nghiệm thu
`node --check js/data/drills-shadow.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
- Trước: 281 câu `drill-shadow-*` (id lớn nhất `drill-shadow-280`). Sau: 306 câu (id lớn nhất `drill-shadow-305`) — tăng đúng 25.
- Đã thêm 25 câu `drill-shadow-281`..`drill-shadow-305` (theme tech/project/design) về tích hợp AI/LLM vào backend Java (Spring Boot gọi LLM API, timeout, retry, cache Redis, chi phí token, đánh giá output, che dữ liệu khách hàng, secret không gửi vào prompt, feature flag, rollout phần trăm, rollback, human-in-the-loop, circuit breaker, lưu prompt/config ngoài code).
- Kiểm tra: `node --check js/data/drills-shadow.js` OK; `node scripts/build-light-index.js` OK (ghi `js/data/index-light.js`); `node scripts/validate.js drills-shadow.js` OK (không lỗi nào thuộc file của task).
- `node scripts/validate.js` toàn repo thoát mã 1 do lỗi có sẵn ở file ngoài phạm vi sở hữu: `quiz-ccao-2.js` (lỗi cú pháp `missing ) after argument list`), không được sửa theo quy tắc chỉ sở hữu `js/data/drills-shadow.js`.
