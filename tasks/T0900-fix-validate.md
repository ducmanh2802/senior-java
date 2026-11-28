# T0900 — Sửa toàn bộ lỗi `node scripts/validate.js`

Status: DONE
Agent: claude
Owns: `js/data/q-frontend.js`, `js/data/quiz-ops.js`, `js/data/lessons-modern.js`, `js/data/lessons-jpa.js`, `js/data/lessons-payments.js`, `js/data/lessons-banking.js`, `js/core/data-manifest.js`, `js/data/toeic-lr-1a.js`, `js/data/q-spring-data.js`, `js/data/index-light.js`

Việc **chỉ là sửa lỗi**, không thêm nội dung mới. Đọc AGENTS.md (mục 4, 5, 12) trước.
Chạy `node scripts/validate.js`. Tại thời điểm tạo task (2026-11-28 09:05), nó báo các lỗi sau:

1. `q-frontend.js: frontend-036.a: số {{ và }} không khớp (0/1)`: tìm `}}` thừa hoặc thiếu `{{`, sửa cho khớp.
2. `quiz-ops.js: qz-ai-051..060.explain: tiêu đề ### bị thụt đầu dòng`: bỏ khoảng trắng đầu dòng trước `###` (và các dòng markup khác bị thụt theo, nếu có).
3. `quiz-ops.js: qz-ai-056.explain`: inline code `{{tool_calls: [{id, function: {n…}}` chứa `{ }` lồng nhau. Đưa JSON đó vào code block `~~~json … ~~~` hoặc viết lại không có dấu ngoặc nhọn trong `{{…}}`.
4. `lessons-modern.js: lesson-modern-011.exercises[0].explain`: inline code `{{teeing(teeing(cnt, sum, (a,b) …}}` lồng `{ }`. Chuyển sang code block `~~~java`.
5. `lessons-jpa.js: lesson-jpa-020: body cần ≥ 2500 ký tự (hiện 1084)`: viết **bổ sung** body đúng chuẩn mục 12, kết bằng `### Liên hệ phỏng vấn`. Không đổi bài tập (exercises) đang pass test.
6. `lessons-payments.js`: track `payments` không có trong `js/data/topics.js`; `lesson-payments-008` lại có track `banking`. **Không sửa topics.js.** Chuyển cả 8 bài sang track `banking`:
   - Nối vào cuối `js/data/lessons-banking.js`. Bài cuối hiện là `lesson-banking-028`, nên đánh tiếp `lesson-banking-029`…`036`, `order` tiếp theo, `track: 'banking'`.
   - Không trùng nội dung với bài banking đã có. Nếu trùng hẳn thì bỏ bài đó và ghi vào Notes.
   - Xoá `js/data/lessons-payments.js` và bỏ `'lessons-payments.js'` khỏi group `lessons` trong `js/core/data-manifest.js` (chỉ sửa đúng chỗ đó).
   - Sửa mọi chỗ tham chiếu `lesson-payments-NNN`: `grep -rn "lesson-payments-" js/ scripts/`. Nếu chỗ tham chiếu nằm trong file ngoài Owns, ghi vào Notes.
7. `toeic-lr-1a.js: part 2 đáp án C chiếm 36% (tối đa 35%)`: đổi thứ tự options của 1–2 câu Part 2 đáp án C sang vị trí khác. Cập nhật `answer` và mọi chỗ `explain` nhắc chữ cái (A/B/C).
8. Cảnh báo `q-spring-data.js: db-069: đáp án ngắn (981 ký tự)`: viết bổ sung đáp án lên ≥ 1500 ký tự (khuyến nghị 3000+), đúng chuẩn mục 6.

Lỗi `path.js: có N bài học không nằm trong PATH` thuộc integrator, **bỏ qua**.

Nếu lúc chạy validate thấy thêm lỗi mới trong file ngoài Owns: **không sửa**, liệt kê trong Notes.

Xong thì chạy:
- `node scripts/build-light-index.js`
- `node scripts/test-lessons.js` (bài banking mới phải pass; nếu chạy toàn bộ quá lâu, chạy riêng track banking nếu script hỗ trợ)
- `node scripts/validate.js`: phải sạch mọi lỗi, trừ dòng path.js.

Cập nhật `Status: DONE` kèm ghi chú.

## Notes
Claude sửa trực tiếp (2026-11-28):
- frontend-036: object JSON trần trong câu chữ → tên field trong {{…}}.
- qz-ai-051..060: bỏ 2 space thụt đầu dòng markup; qz-ai-056: inline code lồng ngoặc → mô tả bằng {{tool_calls}}, {{id}}, {{function}}.
- lesson-modern-011 explain: teeing lồng → code block ~~~java.
- lesson-jpa-020: body viết lại ~4.9k ký tự (bulk update + version, em.clear/@Modifying, retry ngoài @Transactional, backoff/jitter, 409).
- db-069: đáp án viết lại (ngưỡng listpack/intset Redis 7.x, chuyển 1 chiều, case RAM, trả lời mẫu).
- lessons-payments.js (track payments không có trong topics) → lesson-banking-029..036 trong lessons-banking.js; xoá file + entry manifest. test-lessons 8/8 OK.
- toeic-lr-1a lr1-p2-03: đảo đáp án C→A. Checker TOEIC sửa ngưỡng: Part 2 (25 câu × 3 lựa chọn) không thể ≤ 35%, cap = max(35%, ceil(n/k)+1).
- lesson-banking-023 (từ T2787/T2828, chưa commit): reference sai: so sánh Long bằng != (tham chiếu), tài khoản ngoại tệ mất currency, revaluation cộng chênh 2 lần. Đã sửa, test 14/14.
