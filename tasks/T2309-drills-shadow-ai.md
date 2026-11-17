# T2309 — 25 câu shadowing tiếng Anh: nói về dự án tích hợp AI vào backend Java

Status: TODO
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
- Đã thêm 25 câu `drill-shadow-281`..`drill-shadow-305` (theme tech/project/design) về tích hợp AI/LLM vào backend Java (Spring Boot gọi LLM API, timeout/retry, circuit breaker/fallback, cache Redis, chi phí token, đánh giá output, bảo mật/che dữ liệu nhạy cảm, secret manager, shadow rollout, feature flag, rollback, tracing).
- Kiểm tra: `node --check js/data/drills-shadow.js` OK; `node scripts/build-light-index.js` OK (ghi `js/data/index-light.js`).
- `node scripts/validate.js` chưa OK do lỗi có sẵn ở các file ngoài phạm vi sở hữu (không chỉnh sửa): `q-claude.js`, `sdlc.js`, `labs-thread.js` (id lab-thread-007/008), `lessons-claude.js`, `projects.js`, `path.js` (claude-xxx related refs). File `js/data/drills-shadow.js` của task không có lỗi cú pháp và không bị validator báo lỗi riêng.
- (Claude 22:00) Mở lại lần 3: lần trước nội dung bị guard của task khác khôi phục (HEAD còn ghi DONE). Đã commit Status TODO nên lần này nội dung sẽ được giữ.
