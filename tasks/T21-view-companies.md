# T21 — View: Lộ trình theo công ty + điểm sẵn sàng

Status: DONE
Agent: opencode
Owns: `js/views/companies.js`, `css/views/companies.css`

> **Quan trọng — ghi theo lô nhỏ:** viết file bằng nhiều edit nhỏ (≤ 120 dòng mỗi lần): khung trước, từng phần sau.

Đọc `AGENTS.md` mục 7 và 9, `js/core/app.js`, `css/base.css`.
Dữ liệu: `window.COMPANIES` (`js/data/companies.js`) đang được một agent nghiên cứu viết song song. Code phải chạy được khi mảng rỗng.
Schema mỗi phần tử:
`{ id, name, type: 'bank'|'fintech'|'bigtech'|'product', icon, summary, stack[], process[{round, detail}], focus[topicIds], algoWeight (0..1), englishRequired, questions[], tips[], sources[{title,url}], confidence: 'high'|'medium'|'low' }`

## Điểm sẵn sàng (0–100) cho mỗi công ty
Tính trong view, hàm thuần `readiness(company)`:
- **Kiến thức (K)**: trung bình trên các topic trong `company.focus` của `(known + 0.5*review) / total` từ `App.stats(topic)`. Topic không có câu thì bỏ qua.
- **Thuật toán (A)**: số bài trong `App.algos()` có status `known` chia cho `min(40, tổng số bài)`, tối đa 1.
- **Phỏng vấn thử (M)**: trung bình `avg` (thang 1–5, đổi ra 0–1 bằng `(avg-1)/4`) của tối đa 5 phiên gần nhất trong `App.store.data.mockHistory`. Chưa có phiên nào thì M = 0.
- **Tiếng Anh (E)**, chỉ khi `englishRequired`: tỉ lệ đã thuộc của topic `english`.
- Kết hợp: `score = 100 * (wK*K + wA*A + wM*M + wE*E)` với `wA = algoWeight*0.4`, `wM = 0.2`, `wE = englishRequired ? 0.1 : 0`, `wK = 1 - wA - wM - wE`.
- Hiển thị kèm phần giải thích từng thành phần, để người dùng hiểu vì sao được điểm đó.

## `#/companies`: danh sách
- `.page-head`: "Lộ trình theo công ty". Mô tả ngắn: thông tin tổng hợp từ nguồn công khai, có thể đã cũ, nên luôn kiểm tra lại.
- Chips lọc loại: Tất cả / Ngân hàng / Fintech / Big tech / Product.
- Lưới card: icon, tên, loại, **vòng tròn điểm sẵn sàng** (SVG, màu theo mức <40 bad, <70 warn, còn lại ok), 3 topic trọng tâm, badge độ tin cậy dữ liệu.
  Click vào card mở `#/companies/<id>`.

## `#/companies/<id>`: chi tiết
1. Header: icon, tên, summary, stack (chips), badge confidence, điểm sẵn sàng lớn kèm 4 thanh thành phần (K/A/M/E) và giải thích.
2. **Quy trình phỏng vấn**: timeline dọc từ `process`.
3. **Trọng tâm cần ôn**: mỗi topic trong `focus` hiển thị tên, tiến độ (`.progress`), link "Câu hỏi" `#/bank/<topic>` và "Flashcard" `#/flash/<topic>`.
   Topic có tỉ lệ thuộc thấp nhất được đánh dấu "Ưu tiên".
4. **Câu hỏi được chia sẻ công khai**: danh sách `questions`. Mỗi câu có nút "Luyện câu này" mở một khối trả lời
   (textarea + 🎤 + "🤖 Chấm bằng AI") giống T20 phần B, gọi `App.ai.grade` với `reference` là chuỗi
   `'Không có đáp án mẫu; hãy chấm theo kỳ vọng của interviewer Senior Java tại ' + name`.
5. **Mẹo chuẩn bị**: `tips`.
6. **Nguồn**: `sources` (link mở tab mới, `rel="noopener"`), kèm dòng "Dữ liệu tổng hợp từ nguồn công khai, có thể đã thay đổi".
7. Nút "Phỏng vấn thử theo công ty này" → lưu `localStorage['sjp.mock.preset'] = JSON.stringify({topics: focus, english: englishRequired})` rồi `App.navigate('#/mock')`.
   (View mock có thể đọc preset này sau; hiện tại chỉ cần lưu và điều hướng.)

## Nghiệm thu
- `node --check` OK. Không có lỗi console khi `COMPANIES` rỗng và khi có dữ liệu. Responsive tới 360px. Dark mode chỉ dùng biến CSS.

## Notes
- Viết xong đủ 2 màn hình: `#/companies` (lọc loại + lưới card với vòng SVG điểm, badge confidence, 3 topic trọng tâm)
  và `#/companies/<id>` (header + stack, điểm sẵn sàng kèm 4 thanh K/A/M/E và giải thích, timeline quy trình,
  trọng tâm cần ôn với nhãn "Ưu tiên" cho topic yếu nhất + link bank/flash, câu hỏi chia sẻ với khối luyện trả lời
  textarea + 🎤 + "🤖 Chấm bằng AI" (`App.ai.grade`, reference đúng chuỗi spec), mẹo, nguồn `rel="noopener"`
  + disclaimer, nút lưu `sjp.mock.preset` rồi navigate `#/mock`).
- `readiness()` là hàm thuần đúng công thức spec (K/A/M/E, trọng số `wA=algoWeight*0.4`, `wM=0.2`,
  `wE=englishRequired?0.1:0`, `wK=1-wA-wM-wE`), trả kèm số liệu thô để hiển thị giải thích.
- Chạy được với `window.COMPANIES` rỗng (empty state ở cả list và detail), question chấp nhận cả string lẫn
  `{q, lang}`; ẩn section khi mảng rỗng.
- Cleanup đúng: gỡ listener delegation trên `#main` và dừng mọi mic đang chạy khi rời view (luật chống rò listener).
- Kiểm chứng: `node --check js/views/companies.js` OK; smoke test Node (vm + DOM stub, 27 assertions — list/detail/
  empty/not-found/readiness K=50) ALL PASS; `node scripts/validate.js` → `OK — không có lỗi.` (lần chạy đầu còn lỗi
  `algo.js` do agent T18 đang ghi song song — không thuộc file của task này, đã chạy lại tới khi OK).
- CSS: mọi selector bắt đầu bằng `.view-companies`, chỉ dùng biến `var(--…)` (dark mode tự hoạt động),
  responsive có media query ≤640px (grid card ≥250px vẫn vừa 360px).
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
