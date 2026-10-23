# T20 — Thuật toán: Run tests + AI review · Câu hỏi: luyện trả lời với AI

Status: DONE
Agent: opencode
Owns: `js/views/algo.js`, `css/views/algo.css`, `js/views/bank.js`, `css/views/bank.css`

> **Quan trọng — ghi theo lô nhỏ:** sửa bằng nhiều edit nhỏ (≤ 120 dòng mỗi lần). Các file đang chạy tốt, chỉ **bổ sung**.

Đọc `AGENTS.md` mục 7 và **mục 9**, `js/core/ai.js`, rồi đọc kỹ `js/views/algo.js` và `js/views/bank.js` hiện tại.
Lưu ý: `tests`/`starter` đang được agent T18 thêm dần vào `js/data/algo.js`. Code phải chạy được cả khi bài **chưa có** hai field này.

## A. Màn luyện bài (`#/algo/<id>`)
1. Code khởi đầu: nếu chưa có nháp đã lưu thì dùng `algo.starter`; không có `starter` thì dùng template cũ.
2. Nút **▶ Chạy test** (primary), hiện khi `App.code.hasTests(algo)`:
   - `source = App.code.assemble(editorCode, algo.tests)` → `await App.ai.run(source)` → `parsed = App.code.parse(run.stdout)`.
   - Hiển thị `App.ui.runResult(run, parsed)` trong một panel kết quả dưới editor.
   - Nếu `run.configured === false`: hiển thị thông báo kèm nút "Dùng AI review thay thế".
   - Nếu `parsed.allPassed`: gợi ý bấm "Đã giải" (highlight nút đó) và `App.store.log('algo')` chỉ một lần mỗi bài mỗi ngày.
   - Ghi chú nhỏ: "Máy chạy dùng Java 13: tránh record / text block / switch pattern".
3. Nút **🤖 AI review code**: `App.ai.review({title, prompt: algo.prompt, reference: algo.solution, complexity: algo.complexity, code, run: lastRun ? {passed, total, output: stdout} : undefined})` → `App.ui.codeFeedback(r)`.
4. Phím tắt `Ctrl+Enter` = Chạy test (khi đang focus trong editor). Cập nhật gợi ý phím tắt.
5. Giữ lại kết quả chạy và review cuối cùng khi người dùng mở gợi ý hay lời giải (không mất khi re-render).

## B. Ngân hàng câu hỏi (`#/bank`): luyện trả lời với AI
Trong phần mở rộng của mỗi câu hỏi, **trên** đáp án mẫu, thêm khối **"✍️ Luyện trả lời"** (có thể thu gọn, mặc định đóng):
- Textarea "Câu trả lời của bạn" kèm nút 🎤 (ẩn nếu không hỗ trợ). Speech dùng `lang = 'en'` nếu câu có `lang:'en'`. Có speech stats.
- Nút "🤖 Chấm bằng AI" → `App.ai.grade({question, reference: q.a, answer, lang, topic, level, speech})` → `App.ui.feedback`.
- Sau khi chấm: điểm ≥ 4 thì gợi ý bấm "Đã thuộc", 3 thì "Cần ôn", ≤ 2 thì "Chưa biết" (chỉ highlight, người dùng tự bấm).
- Hiện tại đáp án mẫu hiển thị ngay khi mở câu hỏi. Thêm tuỳ chọn ở thanh lọc "Ẩn đáp án cho tới khi tự trả lời"
  (lưu `localStorage` key `sjp.bank.hideAnswer`). Khi bật, đáp án mẫu bị che bởi nút "Xem đáp án mẫu".
- Nội dung đang gõ cho từng câu giữ trong bộ nhớ khi đổi bộ lọc (không cần lưu bền vững).

## Nghiệm thu
- `node --check` cả hai file OK. Không lỗi console khi mở `#/algo`, `#/algo/algo-001`, `#/bank` (trên `file://` nút AI/Run báo lỗi thân thiện).
- Không gọi API tự động. Không phá tính năng cũ (lọc, SRS, timer, gợi ý, lời giải, lưu nháp).

## Notes
- Hoàn thiện Run tests/AI review trong algo và luyện trả lời AI, speech, hide-answer, giữ nháp trong bank; kết quả algo cũ bị xóa khi nội dung editor thay đổi.
- `node --check js/views/algo.js`, `node --check js/views/bank.js` và `node scripts/validate.js` đều OK.
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
