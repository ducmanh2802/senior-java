# T2158 — sd: hiển thị nội dung dài bằng App.ui.answer (thẻ có icon, học từng bước, đọc to)

Status: DONE
Agent: kilo
Owns: `js/views/sd.js`, `css/views/sd.css`
After: T1497

## Bối cảnh
Đã có `App.ui.answer(html, { lang })` trong `js/core/answer.js` (đọc file này trước): nhận HTML của `App.md(text)`, biến đoạn **Tóm tắt:** thành ô 💡, mỗi mục `###` thành thẻ gập được có icon, thêm nút "📖 Học từng bước" và 🔊 đọc to. Trang Ngân hàng câu hỏi và Flashcard đã dùng (xem `js/views/bank.js` dòng có `App.ui.answer`).

## Việc cần làm
1. Trong `js/views/sd.js`, thay chỗ render nội dung dài: lời giải tham khảo của đề system design (els.refBody.innerHTML = App.md(ref)) và đáp án mẫu dài. Mẫu: `(App.ui.answer ? App.ui.answer(App.md(text), { lang }) : App.md(text))` (giữ fallback). Nếu chỗ đó đang thêm id cho heading (vd `addHeadingIds(App.md(...))`) thì truyền HTML đã có id vào `App.ui.answer` để mục lục vẫn chạy.
2. Chỉ áp dụng cho nội dung DÀI có nhiều mục `###` (đoạn ngắn, prompt đề bài, gợi ý thì giữ nguyên).
3. Kiểm tra event của view không chặn click trong `.ans` (nút trong <summary>, Trước/Tiếp). Nếu view có phím ← → riêng, không để xung đột (answer.js chỉ bắt ← → khi có `.ans.is-step` trên trang).
4. CSS riêng (nếu cần) bắt đầu bằng `.view-sd`, chỉ dùng biến màu; KHÔNG sửa css/base.css, js/core/*.

## Luật
- Đọc AGENTS.md mục 2, 3, 7. Không mở trình duyệt. Không commit.

## Nghiệm thu
`node --check js/views/sd.js`; `node scripts/validate.js` → `OK — không có lỗi.` Xong: `Status: DONE`, Notes ghi chỗ đã đổi.

## Notes
- `js/views/sd.js` `renderReference()` (cột "Đáp án mẫu" trong panel so sánh): render `p.reference` bằng `App.ui.answer(App.md(ref), { lang: 'vi' })` với fallback về `App.md(ref)` khi `App.ui.answer` chưa sẵn sàng; giữ thông báo `sd.noRef` khi trống.
- Không có `addHeadingIds` trong view nên không cần truyền HTML có id. Nội dung ngắn/phase (đề bài `sd-brief`, hướng dẫn pha `sd-guide`, nháp từng pha `renderDrafts`) giữ nguyên `App.md(...)` theo yêu cầu.
- Event: view dùng delegation trên từng vùng (`els.phases`, `els.self`, `els.refBtn`…) và không chặn click trong `.ans`; phím `n/p` của view không xung đột với `←/→` step-mode của `answer.js` (chỉ bắt khi có `.ans.is-step` và dùng `stopImmediatePropagation`).
- `css/views/sd.css`: không cần chỉnh (selector `.view-sd` đã có style cho `.sd-compare-col .md`/pre/table); không sửa `css/base.css` hay `js/core/*`.
- Kiểm tra: `node --check js/views/sd.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (có cảnh báo sẵn về `path.js`).
