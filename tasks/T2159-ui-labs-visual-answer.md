# T2159 — labs: hiển thị nội dung dài bằng App.ui.answer (thẻ có icon, học từng bước, đọc to)

Status: DONE
Agent: kilo
Owns: `js/views/labs.js`, `css/views/labs.css`
After: T1496

## Bối cảnh
Đã có `App.ui.answer(html, { lang })` trong `js/core/answer.js` (đọc file này trước): nhận HTML của `App.md(text)`, biến đoạn **Tóm tắt:** thành ô 💡, mỗi mục `###` thành thẻ gập được có icon, thêm nút "📖 Học từng bước" và 🔊 đọc to. Trang Ngân hàng câu hỏi và Flashcard đã dùng (xem `js/views/bank.js` dòng có `App.ui.answer`).

## Việc cần làm
1. Trong `js/views/labs.js`, thay chỗ render nội dung dài: phần đáp án/giải thích của lab (answer) sau khi người học nộp hoặc bấm xem đáp án. Mẫu: `(App.ui.answer ? App.ui.answer(App.md(text), { lang }) : App.md(text))` (giữ fallback). Nếu chỗ đó đang thêm id cho heading (vd `addHeadingIds(App.md(...))`) thì truyền HTML đã có id vào `App.ui.answer` để mục lục vẫn chạy.
2. Chỉ áp dụng cho nội dung DÀI có nhiều mục `###` (đoạn ngắn, prompt đề bài, gợi ý thì giữ nguyên).
3. Kiểm tra event của view không chặn click trong `.ans` (nút trong <summary>, Trước/Tiếp). Nếu view có phím ← → riêng, không để xung đột (answer.js chỉ bắt ← → khi có `.ans.is-step` trên trang).
4. CSS riêng (nếu cần) bắt đầu bằng `.view-labs`, chỉ dùng biến màu; KHÔNG sửa css/base.css, js/core/*.

## Luật
- Đọc AGENTS.md mục 2, 3, 7. Không mở trình duyệt. Không commit.

## Nghiệm thu
`node --check js/views/labs.js`; `node scripts/validate.js` → `OK — không có lỗi.` Xong: `Status: DONE`, Notes ghi chỗ đã đổi.

## Notes
- `js/views/labs.js` (`showAnswer`): render đáp án mẫu (`lab.answer`) qua `App.ui.answer(App.md(lab.answer || ''), { lang: 'vi' })` với fallback `.md` khi `App.ui.answer` không có. Không áp dụng cho scenario/questions/hints/prompt/rubric ngắn.
- Không có heading-id/mục lục trong labs answer nên không cần truyền HTML đã gắn id. Event delegation hiện có không chặn click trong `.ans`; phím ← → của `answer.js` (capture) chỉ kích hoạt khi có `.ans.is-step`, còn phím H/S/N/P/W của labs được bỏ qua khi đang gõ trong input/textarea — không xung đột.
- `css/views/labs.css`: không cần chỉnh (không chỉnh core/base). `node --check js/views/labs.js` và `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn warning path.js sẵn có).
