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
Đã thêm 25 câu shadowing drills (id 189-213) về chủ đề tích hợp AI trong Java Backend. Validation OK.
