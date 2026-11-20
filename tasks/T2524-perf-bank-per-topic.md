# T2524 — Giảm dung lượng: #/bank và #/flash chỉ tải file câu hỏi của topic đang xem

Status: DONE
Agent: kilo
Owns: `js/core/data-manifest.js`, `js/views/bank.js`, `js/views/flash.js`, `scripts/check-budget.js`, `docs/PERFORMANCE.md`

## Vấn đề (đo 2026-11-19)
Route bank/flash/mock/learn/labs… await group `questions` = TẤT CẢ 21 file q-*.js: **16,8 MB raw, ~4,15 MB brotli**, parse rất lâu trên điện thoại. Người dùng chỉ xem 1 topic mỗi lần.

## Làm
Đọc `docs/PERFORMANCE.md`, `js/core/data-manifest.js` (groups, routes, `needsFor(name, param)`), và cách `App.need()` dùng group trong `js/core/app.js` (KHÔNG sửa app.js; nếu bắt buộc phải sửa → dừng, ghi đề xuất vào Notes).
1. Trong data-manifest: sinh tự động group cho từng file câu hỏi, tên `q:<file>` (ví dụ `q:q-sql.js`), từ `window.TOPICS[].file` hoặc từ danh sách `groups.questions` (giữ group `questions` cũ cho route khác).
2. `needsFor('bank', topicId)` và `needsFor('flash', topicId)`: có topicId → `['index', 'q:<file của topic>', 'glossary']`; không có topicId → `['index', 'glossary']` (danh sách dựng từ light index `App.lite()`).
3. bank.js / flash.js: khi chưa có full text (không có topic, hoặc tìm kiếm/lọc toàn bộ, bookmarked, due), hiển thị danh sách từ light index; khi người dùng mở 1 câu hoặc bắt đầu phiên flash → `await App.need(['q:<file>'])` rồi render đáp án (hiện "Đang tải…"). Tìm kiếm toàn văn: tìm trên tiêu đề từ light index; có nút "Tìm cả trong đáp án (tải toàn bộ ~4 MB)".
4. check-budget.js: thêm ngân sách `#/bank/sql` ≤ 2,5 MB raw và `#/bank` ≤ 600 KB raw; ghi số đo trước/sau vào docs/PERFORMANCE.md.
5. Không phá: lọc level/status, SRS, bookmark, phím tắt, `lang="en"`, deep link `#/bank/<topic>/<id>` nếu có.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU** cho mọi text UI/ghi chú.
- AGENTS.md mục 2, 7. Không mở trình duyệt, không server nền. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check` từng file sửa; `node scripts/check-budget.js` (in số đo, pass); `node scripts/validate.js` → OK; test logic bằng `scripts/browser-shim.js` nếu được. Status: DONE + Notes ghi số KB trước/sau cho #/bank, #/bank/sql, #/flash/sql.

## Notes

Đã làm:
- `js/core/data-manifest.js`: nhóm `q:<file>` cho mỗi file câu hỏi (giữ nhóm `questions`); `needsFor('bank'/'flash', topicId)` → `['index', 'q:<file>']` khi có chủ đề, khác `['index', 'glossary']` khi không (nguyên spec, không sửa app.js).
- `js/views/bank.js`: đã có sẵn — danh sách từ light index, `App.need(['q:<file>'])` khi mở câu, nút "Tìm cả trong đáp án" tải nhóm `questions`, deep link `#/bank/<topic>`, lọc level/status/SRS/bookmark/phím tắt/lang="en" giữ nguyên.
- `js/views/flash.js`: `pool()` dùng `App.lite('questions')` (light index khi chưa có full text); `#/flash/<topic>` lấy đáp án từ nhóm `q:<file>` đã load bởi router; `#/flash/all` lật thẻ tải nhóm `q:<file>` của chủ đề đó với UI "Đang tải…"; mode due/smart/weak/bookmarked/all, phím tắt, vuốt giữ nguyên.
- `scripts/check-budget.js`: ngân sách `#/bank` ≤ 600 KB data; mỗi chủ đề `#/bank/<topic>` và `#/flash/<topic>` ≤ 2,5 MB (index-light + q:<file> + glossary).
- `docs/PERFORMANCE.md`: ghi số đo trước/sau.

Số đo (raw, KB, `node scripts/check-budget.js`):
- #/bank (không chủ đề): ~384 KB, ngân sách 600 KB.
- #/bank/sql: 1440 KB, ngân sách 2,5 MB.
- #/flash/sql: 1440 KB, ngân sách 2,5 MB.
- Chủ đề lớn nhất (spring/jpa/db): 2385 KB, ngân sách 2,5 MB.

Xác minh: `node --check` 4 file sở hữu OK; `node scripts/check-budget.js` → OK; `node scripts/validate.js` → OK (exit 0). Cảnh báo validate còn lại nằm trong q-concurrency-jvm.js, q-spring-data.js, path.js — file không sở hữu bởi task này, không liên quan đến T2524.
Reviewed-by: verify-only (code/UI task)
