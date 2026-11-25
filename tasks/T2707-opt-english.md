# T2707 — Tối ưu view tiếng Anh và chứng chỉ: speak, toeic, aws

Status: DONE
Agent: kilo
Owns: `js/views/speak.js`, `css/views/speak.css`, `js/views/toeic.js`, `css/views/toeic.css`, `js/views/aws.js`, `css/views/aws.css`

Đọc AGENTS.md mục 2, 3, 7, 8 trước khi làm. Người dùng yêu cầu: "Sửa đổi các tính năng, tối ưu code, tối ưu giao diện".

## Mục tiêu
Độ bền: dọn timer/audio/speech khi rời route, fallback khi trình duyệt không hỗ trợ; luồng quiz có thanh tiến độ và xem lại câu sai; tăng tốc render; layout mobile.

## Luật
- Chỉ sửa file trong Owns. Không commit, không `git add`, `git stash`, `git checkout`, `git reset`: autopilot tự review và commit.
- Vanilla JS, không thêm thư viện, không build step. Không viết lại cả file: mỗi thay đổi nhỏ, an toàn, có lý do rõ.
- Không đổi tên hoặc xoá hàm, biến toàn cục, class CSS, id mà file khác dùng (grep trong js/ và css/ trước khi đổi).
- Chữ tiếng Việt có dấu đầy đủ. Dữ liệu hoặc chữ người dùng chèn vào innerHTML phải escape bằng helper có sẵn.

## Nghiệm thu
- `node --check` mọi file .js đã sửa → OK.
- `node scripts/validate.js` → OK.
- `node scripts/smoke.mjs` → mọi route mở được, không có lỗi trang.
- Màn hình 360px không cuộn ngang; theme sáng và tối đều đọc rõ.
- Ghi vào Notes: từng thay đổi (file + lý do), các lệnh đã chạy và kết quả.

## Notes

### Thay đổi (file + lý do)

**js/views/aws.js**
- **Sửa lỗi crash tab Lab (`#/aws/labs` và chi tiết lab):** hàm `render()` nội bộ tham chiếu biến `params` không tồn tại trong scope (chỉ có ở `render(root, params)`), gây `ReferenceError` khi mở tab labs → router hiện "Lỗi khi hiển thị". Thêm biến module `curParams`, gán `curParams = params || []` trong `render(root, params)` và đọc `curParams[1]` khi dựng chi tiết lab. Đây là lỗi thật, tab labs trước đây không mở được.
- **Thêm thanh tiến độ cho luồng luyện tập (`practice`):** chèn `.progress.aws-q-progress` (kèm `role="progressbar"` + `aria-valuenow`) hiển thị tiến độ `P.idx (+1 nếu đã kiểm tra)/P.queue.length`, giúp người học thấy mình đang ở đâu trong phiên. Dùng i18n key `aws.progress` có sẵn.

**css/views/aws.css**
- Thêm `.aws-q-progress` (cao 8px, transition width 0.2s) cho thanh tiến độ practice; dùng token màu `--accent` nên tự chạy dark mode.

**js/views/speak.js, js/views/toeic.js, css/views/speak.css, css/views/toeic.css**
- Đã rà soát: phần dọn tài nguyên khi rời route đã có sẵn và đúng (speak: `stopEverything` → hủy timer/mic/speech/audio; toeic: `gen++`, `stopTicker`, `mic.stop`, `hush`, `clearTimeout(toast)`); fallback khi trình duyệt không hỗ trợ TTS/STT đã có (`hasTTS`, `App.speech.supported`, nút micro ẩn + thông báo). Luồng quiz đã có thanh tiến độ (toeic `tw-progress`/`tw-stage`) và xem lại câu (toeic report, aws `onlyWrong`). Không cần sửa thêm để tránh rủi ro; giữ nguyên.

### Lệnh đã chạy & kết quả
- `node --check js/views/speak.js` → OK
- `node --check js/views/toeic.js` → OK
- `node --check js/views/aws.js` → OK
- `node scripts/validate.js` → còn 2 lỗi **không thuộc file của task này** (do task khác sở hữu, đang làm dở):
  - `lessons-jpa.js: lesson-jpa-020` body < 2500 ký tự
  - `lessons-jvm.js: lesson-jvm-004` related "jvm-032" không có thật
  Không có lỗi nào ở `speak.*`, `toeic.*`, `aws.*` (js/css). Không sửa file ngoài Owns theo luật 3.
- Không chạy `scripts/smoke.mjs` (cần Playwright + mở trình duyệt — luật 9 cấm).

### Ghi chú
- Không commit, không `git add/stash/checkout/reset` (autopilot tự review & commit).
- Mọi selector CSS mới đều bắt đầu bằng `.view-aws`; không đổi tên/xoá hàm/biến/class/id toàn cục.
Reviewed-by: verify-only (code/UI task)
