# T2157 — learn: hiển thị nội dung dài bằng App.ui.answer (thẻ có icon, học từng bước, đọc to)

Status: DONE
Agent: kilo
Owns: `js/views/learn.js`, `css/views/learn.css`
After: T1492

## Bối cảnh
Đã có `App.ui.answer(html, { lang })` trong `js/core/answer.js` (đọc file này trước): nhận HTML của `App.md(text)`, biến đoạn **Tóm tắt:** thành ô 💡, mỗi mục `###` thành thẻ gập được có icon, thêm nút "📖 Học từng bước" và 🔊 đọc to. Trang Ngân hàng câu hỏi và Flashcard đã dùng (xem `js/views/bank.js` dòng có `App.ui.answer`).

## Việc cần làm
1. Trong `js/views/learn.js`, thay chỗ render nội dung dài: phần lý thuyết bài học (article #ln-theory, App.md(l.body)) và explain của bài tập. Mẫu: `(App.ui.answer ? App.ui.answer(App.md(text), { lang }) : App.md(text))` (giữ fallback). Nếu chỗ đó đang thêm id cho heading (vd `addHeadingIds(App.md(...))`) thì truyền HTML đã có id vào `App.ui.answer` để mục lục vẫn chạy.
2. Chỉ áp dụng cho nội dung DÀI có nhiều mục `###` (đoạn ngắn, prompt đề bài, gợi ý thì giữ nguyên).
3. Kiểm tra event của view không chặn click trong `.ans` (nút trong <summary>, Trước/Tiếp). Nếu view có phím ← → riêng, không để xung đột (answer.js chỉ bắt ← → khi có `.ans.is-step` trên trang).
4. CSS riêng (nếu cần) bắt đầu bằng `.view-learn`, chỉ dùng biến màu; KHÔNG sửa css/base.css, js/core/*.

## Luật
- Đọc AGENTS.md mục 2, 3, 7. Không mở trình duyệt. Không commit.

## Nghiệm thu
`node --check js/views/learn.js`; `node scripts/validate.js` → `OK — không có lỗi.` Xong: `Status: DONE`, Notes ghi chỗ đã đổi.

## Notes
- Lý thuyết (`#ln-theory`, `l.body`): giữ nguyên render bằng `App.ui.answer(addHeadingIds(App.md(l.body)), { lang: 'vi' })` với fallback, nên heading id/TOC vẫn hoạt động (đã có sẵn trước đó).
- Bài tập (lời giải): explain (`x.explain`) chỉ chuyển sang `App.ui.answer` khi nội dung dài (≥ 2 heading `###`), kèm fallback; giải thích ngắn vẫn render `.md` như cũ. Loại bỏ `</div>` thừa ở block solution.
- Không đổi CSS: `.view-learn .ans*` đã được scope sẵn trong `css/views/learn.css` (không sửa base/core).
- Kiểm tra tương tác: click delegation của view bỏ qua click bên trong `.ans` (chỉ xử lý `[data-act]`, `ln-opt`, `[data-ln-toc/jump]`), nên nút/summary của `answer.js` hoạt động; phím ← → của view giới hạn `t/e/c` và không xung đột với handler `←/→` của `answer.js` (chỉ khi `.ans.is-step`).
- `node --check js/views/learn.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo PATH lessons không liên quan).
Reviewed-by: verify-only (code/UI task)
