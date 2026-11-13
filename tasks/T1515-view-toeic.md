# T1515 — Màn hình #/toeic: luyện TOEIC Speaking & Writing

Status: DONE
Agent: kilo
Owns: `js/views/toeic.js`, `css/views/toeic.css`

Viết view thật thay cho placeholder hiện tại. Dữ liệu: `window.TOEIC` (đã nạp cho route; đọc chú thích schema + bảng format/thời gian ở đầu `js/data/toeic.js`). Đọc AGENTS.md mục 7 và 9, và xem `js/views/speak.js` để dùng lại đúng cách gọi mic/AI/hiển thị kết quả.

## Chức năng
1. **Trang chính**: 2 cột Speaking / Writing, liệt kê các part (Q1–2 Read aloud…, Q8 Essay) kèm số bài; nút "Luyện part này" và nút **"Thi thử đầy đủ"** (Speaking 11 câu hoặc Writing 8 câu, chọn ngẫu nhiên đúng số lượng mỗi part: s1×2, s2×2, s3×1 bộ (3 câu), s4×1 bộ, s5×1; w1×5, w2×2, w3×1).
2. **Speaking**: mỗi câu có pha chuẩn bị và pha trả lời đếm ngược đúng thời gian của part (bảng trong data file), tự chuyển pha; pha trả lời tự bật `App.speech.start({lang:'en'})` nếu có, luôn có ô gõ phím thay thế. s3/s4: đọc câu hỏi bằng `speechSynthesis` (en-US) nếu có, đồng thời hiện chữ. s2/w1: hiện `scene` trong khung "Ảnh (mô tả)" vì app không có ảnh thật.
3. **Writing**: textarea, đồng hồ theo part (w1: 8 phút cho cả 5 câu, w2: 10 phút/câu, w3: 30 phút), đếm số từ.
4. **Chấm**: sau mỗi câu (hoặc cuối bài thi thử) nút **"AI chấm"** — chỉ gọi khi người dùng bấm: `App.ai.grade({question, reference, answer, lang:'en', topic:'toeic', level:'mid', speech?})`, reference = sample + tiêu chí chấm của part (ví dụ "TOEIC Writing Q8, scale 0–5: opinion supported with reasons/examples, grammar, vocabulary, organization"). Hiển thị bằng `App.ui.feedback(result,'en')`, lỗi bằng `App.ui.error(e)`, trạng thái chờ `<span class="ai-loading">AI đang chấm…</span>` và disable nút.
5. Sau khi trả lời: nút "Xem bài mẫu" hiện sample(s) và tips.
6. Phím tắt có `<kbd>`; nội dung tiếng Anh đặt trong phần tử có `lang="en"`; cleanup khi rời view (clearInterval, dừng speech/TTS).

## Luật
- Chỉ sửa 2 file trên; escape dữ liệu bằng `App.esc()` (hoặc `App.md` cho markup); CSS bắt đầu `.view-toeic`, màu qua biến CSS, responsive 360px.
- Không mở trình duyệt. Kiểm tra: `node --check js/views/toeic.js`, `node scripts/validate.js` → OK. KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi ngắn.

## Notes
- `js/views/toeic.js`: state machine `home | drill | mock | report`; Speaking pha `ready → readInfo/prep → answer → done` tự chuyển theo đồng hồ (s3/s4 mỗi item = 3 câu trả lời liên tiếp, dùng `qIdx` để chọn 15s/15s/30s); Writing `ready → writing → done`. Micro qua `App.speech.start({lang:'en'})` khi `App.speech.supported`, luôn có textarea thay thế; s3/s4 đọc câu hỏi bằng `speechSynthesis` en-US + nút "Nghe câu hỏi". AI chấm chỉ khi bấm nút: `App.ai.grade({question, reference = sample + tiêu chí part, answer, lang:'en', topic:'toeic', level:'mid', speech?})` → `App.ui.feedback(res,'en')`, lỗi `App.ui.error(e)`, chờ `<span class="ai-loading">`. Bài mẫu + tips mở bằng nút. Phím tắt 1–8/M/?/Space/N/P/S/L/G, có `<kbd>`. Cleanup: clearInterval, dừng mic, huỷ TTS, gỡ listener, chặn callback async bằng `gen`.
- `css/views/toeic.css`: mọi selector tiền tố `.view-toeic`, chỉ dùng token trong `base.css`, dark mode OK, responsive 640/400px + `prefers-reduced-motion`.
- **Dữ liệu hiện chỉ có s1–s4 (28 item); chưa có s5/w1/w2/w3** → part Writing và s5 hiển thị "0 bài luyện" và mock Writing/đầy đủ chỉ chạy được phần Speaking (view degrade mượt, không lỗi). Khi data bổ sung, view tự dùng mà không cần sửa.
- Kiểm tra: `node --check js/views/toeic.js` OK; `node scripts/validate.js` → OK (cảnh báo duy nhất `lesson-design-007` không thuộc task này). Đã smoke-test logic bằng browser-shim (home/drill s1/s3/s4/mock/report/grade-error).
- Không commit.
Reviewed-by: verify-only (code/UI task)
