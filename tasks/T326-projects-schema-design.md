# T326 — Pet project: thêm phần "Thiết kế chi tiết" và đáp án câu hỏi phỏng vấn (schema + view)

Status: DONE
Agent: opencode
Owns: `scripts/validate.js`, `js/views/projects.js`, `css/views/projects.css`
After: T320

Integrator cho phép sửa đúng các file trong `Owns`. Đọc AGENTS.md mục 7. Dự án nào chưa có các field mới vẫn phải hiển thị và validate như cũ.

1. `window.PROJECTS` thêm 2 field **tuỳ chọn**:
   - `design`: chuỗi markup (bắt buộc ≥ 1500 ký tự nếu có). Đây là phần thiết kế chi tiết: schema DB, API, sơ đồ luồng, xử lý lỗi, chiến lược test, chạy local, quan sát.
   - `interview.answers`: mảng chuỗi markup, **cùng độ dài** với `interview.questions`. Mỗi đáp án ≥ 300 ký tự.
2. `scripts/validate.js`: cho phép 2 field trên (hiện code đang báo "field lạ"), kiểm tra độ dài và `checkMarkup` cho từng đáp án. Mọi luật khác giữ nguyên.
3. `js/views/projects.js` (trang chi tiết dự án):
   - Thêm tab hoặc anchor "Thiết kế chi tiết" render `App.md(p.design)`, đặt sau Kiến trúc.
   - Mỗi câu hỏi phỏng vấn có `<details>` "Xem gợi ý trả lời" chứa đáp án tương ứng.
   - Thêm mục lục nhỏ ở đầu trang (Pitch · Yêu cầu · Kiến trúc · Thiết kế · Milestones · Thách thức · README · Phỏng vấn) dùng anchor `#`. Không phá route hash: dùng `scrollIntoView` thay vì đổi `location.hash`.
   - i18n vi/en cho các chuỗi mới, theo cách view đang làm.
4. CSS: mọi selector bắt đầu bằng `.view-projects`, chỉ dùng biến màu, responsive tới 360px; code block trong design cuộn ngang được.
5. `node --check` các file, `node scripts/validate.js` → OK. Ghi Notes, `Status: DONE`.

## Notes
- `scripts/validate.js`: added `design` (≥1500 ký tự, optional) and `interview.answers` (mảng markup, cùng độ dài với `interview.questions`, mỗi đáp án ≥300 ký tự) vào phần projects. Field `answers` đã được thêm vào allowed set của `interview` và `design` vào allowed set của project. Projects không có 2 field này vẫn validate như cũ (chỉ báo lỗi nếu có).
- `js/views/projects.js`: thêm i18n keys mới (vi/en), mục lục `.pr-toc` dùng `data-scroll` + `scrollIntoView` (không đổi `location.hash`), section `#pr-design` render `App.md(p.design)` sau Kiến trúc (ẩn nếu không có), `<details class="pr-answer">` hiển thị đáp án tương ứng cho mỗi câu hỏi phỏng vấn (ẩn nếu không có `interview.answers`).
- `css/views/projects.css`: thêm `.pr-toc`, `.pr-answer`, `.pr-answer .md`, cuộn ngang code block trong `#pr-design`; responsive 360px.
- `node --check` các file đều OK; `node scripts/validate.js` → `OK — không có lỗi.`

Status: DONE

Reviewed-by: verify-only (code/UI task)
