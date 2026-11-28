# T2910 — #/ckad: ô làm bài ngay trên trình duyệt + terminal online

Status: TODO
Agent: kilo
Owns: `js/views/ckad.js`, `css/views/ckad.css`
After: T2905

Người dùng hỏi: "lab CKAD không có chỗ viết câu lệnh làm đề trên trình duyệt à". Site là web tĩnh, không có cluster, nên làm 2 việc:

## Làm
1. **Ô bài làm cho mỗi task** (đề thực hành `#/ckad/exam/<id>` và lab `#/ckad/lab/<id>`), đặt ngay dưới đề bài:
   - `<textarea class="textarea ck-answer" spellcheck="false">` font monospace, cao ~10 dòng, placeholder "Gõ lệnh kubectl / YAML của bạn…".
   - Tự lưu (debounce ~500 ms) vào `App.store.data.ckad.answers[taskId] = {text, updatedAt}` rồi `App.store.save()`; mở lại trang thì hiện lại.
   - Nút: "📋 Copy bài làm" (dán vào terminal), "🆚 So với lời giải" (mở lời giải cạnh bài làm: 2 cột trên desktop, 1 cột ở 360px), "🤖 AI chấm" (xem bước 2), "🗑️ Xoá".
   - Tab trong textarea chèn 2 dấu cách (không nhảy focus) để gõ YAML. Phím tắt của view không được kích hoạt khi đang gõ (App.onKey đã tự bỏ qua input).
2. **AI chấm (chỉ khi bấm nút)**: `await App.ai.review({title: t.title, prompt: t.task, reference: t.solution + '\nVerify script:\n' + t.verify, code: answerText, complexity: ''})`, hiển thị bằng `App.ui.codeFeedback(r)`; trong lúc chờ hiện `<span class="ai-loading">AI đang chấm…</span>` và disable nút; lỗi bọc try/catch hiển thị `App.ui.error(e)`. Bài làm rỗng thì không gọi.
3. **Terminal online thật**: trên trang tổng quan `#/ckad`, đầu mỗi đề và mỗi lab, thêm thẻ "🖥️ Không cài được kind? Dùng terminal Kubernetes miễn phí trên trình duyệt" với link mở tab mới:
   - Killercoda Kubernetes playground: https://killercoda.com/playgrounds/scenario/kubernetes (đã kiểm tra tồn tại)
   Ghi chú: cần đăng nhập Killercoda; phiên có giới hạn thời gian; dán **setup** vào terminal đó, làm bài, rồi dán **verify**. Context trên Killercoda khác `kind-ckad`: hướng dẫn bỏ qua dòng `kubectl config use-context` hoặc chạy `kubectl config rename-context $(kubectl config current-context) kind-ckad`.
   Không nhúng iframe Killercoda (trang chặn nhúng).
4. Trang tổng quan: thêm 1 đoạn "Cách làm bài" 3 bước: dựng cluster (kind hoặc Killercoda) → copy setup → gõ lệnh trong terminal (có thể nháp trong ô bài làm) → chạy verify → bấm "Verify PASS hết".

## Luật
AGENTS.md mục 7 và 9: escape bằng `App.esc`, không gọi AI tự động, CSS selector bắt đầu `.view-ckad`, chỉ dùng biến màu css/base.css, responsive 360px, nút có text/aria-label. Giữ nguyên tính năng video nhúng (T2905) và các phần hiện có. Không sửa file khác. Không commit, không mở trình duyệt.

## Nghiệm thu
`node --check js/views/ckad.js`; `node scripts/check-budget.js`; `node scripts/validate.js` OK. Script Node tạm với `scripts/browser-shim.js` render `[]`, `['exams']`, `['exam','ckad-2']`, `['lab']`, `['lab','ckad-lab-01']` không throw, HTML không có `undefined`/`NaN`; xoá script tạm.
Xong: `Status: DONE` + Notes.

## Notes
