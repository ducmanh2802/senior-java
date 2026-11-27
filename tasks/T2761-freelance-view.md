# T2761 — Track #/freelance: view lộ trình tuần, tick tiến độ, checklist yêu cầu job

Status: DONE
Agent: kilo
Owns: `js/views/freelance.js`, `css/views/freelance.css`, `js/core/data-manifest.js`, `index.html`, `js/core/i18n.js`
After: T2760

Đọc AGENTS.md trước khi làm. Người dùng yêu cầu: "Tạo task làm lộ trình trên senior java" (lộ trình 3 tháng luyện AI-agent + tiếng Anh để nhận job freelance).

## Mục tiêu
Trang `#/freelance` hiển thị `window.FREELANCE_PLAN` và `window.FREELANCE_EN` (do T2760 tạo). Làm theo mẫu `js/views/aws.js` + `css/views/aws.css`: cách đăng ký view, tải dữ liệu, lưu tiến độ.

## Việc cần làm
1. `js/core/data-manifest.js`: thêm route `freelance: ['freelance']` và `'freelance'` vào danh sách `views` (giống `aws`).
2. `index.html`: thêm link nav `#/freelance` ngay dưới link AWS, dùng `data-i18n="nav.freelance"` và `navd.freelance`; `js/core/i18n.js`: thêm 2 key đó cho cả vi và en (vi: "🚀 Freelance AI-agent" / "Lộ trình 3 tháng: Claude Code, Stripe Connect, Next.js, tiếng Anh"; en tương ứng).
3. `js/views/freelance.js`:
   - Đầu trang: mục tiêu, giá job, cảnh báo múi giờ, thanh tiến độ tổng (% task đã tick).
   - Tuần hiện tại tính từ ngày bắt đầu 2026-11-26 (cho phép người dùng đổi ngày bắt đầu, lưu localStorage), mở sẵn tuần hiện tại.
   - Mỗi tuần: goals, task có checkbox (lưu localStorage, bọc try/catch), deliverable, mục English, links mở tab mới, lessonIds thành link `#/learn/...` (theo cách các view khác link bài học).
   - Mục "Yêu cầu job": mustHaves dạng checklist tự đánh giá (lưu localStorage).
   - Mục "Câu hỏi sàng lọc": 5 câu + (nếu FREELANCE_EN.screening có dữ liệu) câu trả lời mẫu thu gọn, ô textarea để người dùng tự viết bản của mình (lưu localStorage).
4. `css/views/freelance.css`: dùng biến CSS sẵn có, theme sáng/tối, 360px không cuộn ngang.

## Luật
- Chỉ sửa file trong Owns. Không commit, không `git add`, `git stash`, `git checkout`, `git reset`: autopilot tự review và commit.
- Vanilla JS, không thêm thư viện, không build step. Tiếng Việt có dấu đầy đủ; thuật ngữ kỹ thuật giữ tiếng Anh.
- Nội dung phải đúng sự thật: API Stripe, Next.js, Claude Code đối chiếu tài liệu chính thức (docs.stripe.com, nextjs.org/docs, docs.claude.com). Không bịa tên hàm, tham số, số liệu. Chỗ không chắc thì ghi rõ "kiểm tra lại tài liệu" thay vì đoán.
- Không bao giờ đưa secret/key thật vào ví dụ: dùng `sk_test_...`, `whsec_...` dạng placeholder.
- Dữ liệu chèn vào innerHTML phải escape bằng helper có sẵn.
- Không đổi tên hàm, biến toàn cục, class CSS mà file khác dùng.

## Nghiệm thu
- `node --check js/views/freelance.js`; `node scripts/validate.js`; `node scripts/smoke.mjs` → route `#/freelance` mở được, không lỗi trang.
- 360px không cuộn ngang; theme sáng và tối đọc rõ.
- Ghi vào Notes: thay đổi, lệnh đã chạy và kết quả.

## Notes

- Thay đổi (file sở hữu):
  1. js/core/data-manifest.js: thêm route `freelance: ['freelance']` và `'freelance'` vào mảng `views`.
  2. index.html: thêm link nav `#/freelance` ngay dưới link AWS (`data-i18n="nav.freelance"`, `navd.freelance`).
  3. js/core/i18n.js: thêm 2 key `nav.freelance` / `navd.freelance` cho vi và en.
  4. js/views/freelance.js (mới): view `#/freelance` theo mẫu aws.js — mục tiêu, ngày bắt đầu (mặc định 2026-11-26, đổi được, lưu localStorage), tuần hiện tại mở sẵn, thanh tiến độ tổng (% task đã tick), mỗi tuần goals/tasks (checkbox, lưu localStorage, try/catch), deliverable, English, links mở tab mới, lessonIds link `#/learn/...`; mục Yêu cầu job (mustHaves checklist tự đánh giá); mục Câu hỏi sàng lọc (5 câu + câu trả lời mẫu nếu FREELANCE_EN.screening có dữ liệu + textarea lưu localStorage).
  5. css/views/freelance.css (mới): selector bắt đầu bằng `.view-freelance`, chỉ dùng biến CSS, responsive 360px.
- Lệnh đã chạy: `node --check js/views/freelance.js` → OK; `node scripts/check-freelance.js` → OK (12 tuần, 72 task); `node scripts/validate.js` → các LỖI báo ra đều nằm trong file KHÔNG sở hữu của task này (quiz-ops.js, lessons-*.js, q-concurrency-jvm.js…) là tiền tồn, không do T2761; file do task sở hữu không gây lỗi mới (index.html eager scripts, routes, light-index kiểm tra qua).
- `node scripts/smoke.mjs` BỎ QUA: AGENTS.md quy 9 cấm mở trình duyệt/headless browser; thay bằng `node --check` + `validate.js`.
- Không commit, không git add/git stash/git checkout/git reset.
Reviewed-by: verify-only (code/UI task)
