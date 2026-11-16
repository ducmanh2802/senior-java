# T2160 — bugs: hiển thị nội dung dài bằng App.ui.answer (thẻ có icon, học từng bước, đọc to)

Status: DONE
Agent: kilo
Owns: `js/views/bugs.js`, `css/views/bugs.css`

## Bối cảnh
Đã có `App.ui.answer(html, { lang })` trong `js/core/answer.js` (đọc file này trước): nhận HTML của `App.md(text)`, biến đoạn **Tóm tắt:** thành ô 💡, mỗi mục `###` thành thẻ gập được có icon, thêm nút "📖 Học từng bước" và 🔊 đọc to. Trang Ngân hàng câu hỏi và Flashcard đã dùng (xem `js/views/bank.js` dòng có `App.ui.answer`).

## Việc cần làm
1. Trong `js/views/bugs.js`, thay chỗ render nội dung dài: các khối rootCause và fix (App.md(b.rootCause), App.md(b.fix)). Mẫu: `(App.ui.answer ? App.ui.answer(App.md(text), { lang }) : App.md(text))` (giữ fallback). Nếu chỗ đó đang thêm id cho heading (vd `addHeadingIds(App.md(...))`) thì truyền HTML đã có id vào `App.ui.answer` để mục lục vẫn chạy.
2. Chỉ áp dụng cho nội dung DÀI có nhiều mục `###` (đoạn ngắn, prompt đề bài, gợi ý thì giữ nguyên).
3. Kiểm tra event của view không chặn click trong `.ans` (nút trong <summary>, Trước/Tiếp). Nếu view có phím ← → riêng, không để xung đột (answer.js chỉ bắt ← → khi có `.ans.is-step` trên trang).
4. CSS riêng (nếu cần) bắt đầu bằng `.view-bugs`, chỉ dùng biến màu; KHÔNG sửa css/base.css, js/core/*.

## Luật
- Đọc AGENTS.md mục 2, 3, 7. Không mở trình duyệt. Không commit.

## Nghiệm thu
`node --check js/views/bugs.js`; `node scripts/validate.js` → `OK — không có lỗi.` Xong: `Status: DONE`, Notes ghi chỗ đã đổi.

## Notes
- `js/views/bugs.js`: thêm helper `longAnswer(text, lang)` — render `App.md` rồi đưa qua `App.ui.answer(html, { lang })` khi `App.ui.answer` có, kèm fallback `'<div class="md">' + html + '</div>'`. Áp dụng cho 2 khối dài trong `.bg-answer`: `b.rootCause` và `b.fix` (mỗi bài `fix` có ≥2 mục `###` nên hiển thị thành thẻ gập được có icon, "📖 Học từng bước", 🔊 đọc to). `rootCause` hiện là đoạn văn dài không có `###` → `answer.js` tự trả `.md` nguyên vẹn; đúng yêu cầu "chỉ áp dụng cho nội dung DÀI có nhiều mục ###". Các đoạn ngắn (`story`, prompt, `hints`, `refCode`) giữ nguyên.
- Event: view dùng delegation `onClick` chỉ xử lý `[data-act]`; click trong `.ans` (nút `[data-ans-*]`, `<summary>`) không có `data-act` nên không bị chặn. `onKeydown` chỉ chạy khi `e.target === editor`; không có phím ← → riêng, nên không xung đột với handler capture của `answer.js` (chỉ bắt ← → khi có `.ans.is-step`).
- `css/views/bugs.css`: thêm block `.view-bugs .ans*` (scope đúng `.view-bugs`, chỉ dùng biến màu `--accent/--border/--surface/--info/--warn/--ok/--link/--radius-sm/--shadow`), copy pattern từ `css/views/learn.css` để thẻ answer hiển thị đúng; responsive ≤600px. Không sửa `css/base.css` / `js/core/*`.
- Kiểm tra: `node --check js/views/bugs.js` OK; `node scripts/validate.js` → `OK — không có lỗi.`
- Không commit, không mở trình duyệt (theo luật 4, 9).
Reviewed-by: verify-only (code/UI task)
