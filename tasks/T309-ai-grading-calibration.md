# T309 — Hiệu chuẩn chấm điểm + chuẩn hoá output AI (interview, grade)

Status: DONE
Agent: opencode
Owns: `api/interview.js`, `api/grade.js`, `scripts/test-ai-shape.js`
After: T308

Integrator cho phép sửa đúng các file trong `Owns`. Mục tiêu: model free chấm **ổn định và có căn cứ**.

1. System prompt chấm điểm (grade, interview summary, `last_answer` trong turn) phải có **thang điểm neo** 1–5 cụ thể:
   - 1 = sai hoặc không trả lời.
   - 2 = biết khái niệm nhưng sai hoặc thiếu cơ chế.
   - 3 = đúng ý chính nhưng thiếu chiều sâu và trade-off.
   - 4 = đúng, có cơ chế và ví dụ thực tế.
   - 5 = đạt mức senior: có trade-off, pitfall production, số liệu.

   Model phải so với `reference` và **trích dẫn ý cụ thể** trong câu trả lời làm bằng chứng. Câu trả lời rỗng, lạc đề hoặc "không biết" được tối đa 1–2 điểm. Không cho điểm vì độ dài.
2. Chấm điểm dùng `temperature` 0.2 (tham số mới của `askJson` từ T308); lượt hội thoại interview giữ khoảng 0.6 cho tự nhiên.
3. Chuẩn hoá output trước khi trả cho client:
   - Mọi field mảng phải là mảng chuỗi: lọc phần tử rỗng, cắt còn ≤ 8 phần tử.
   - Chuỗi được `String()` rồi cắt độ dài hợp lý.
   - `intent`/`hire_signal` nằm ngoài enum thì đổi về giá trị mặc định an toàn.
   - `score` đi qua `clampScore`.
   - Thiếu field thì điền giá trị rỗng, không để client vỡ.
4. `hire_signal` phải nhất quán với `overall_score`: score ≤ 2 không được là `yes`/`strong_yes`, score ≥ 4 không được là `no`/`strong_no`. Nếu mâu thuẫn thì chỉnh về mức gần nhất.
5. Interview: khi có `seeds` thì interviewer phải hỏi bám seeds, không bịa câu ngoài trọng tâm.
6. Kiểm chứng: `node --check` từng file, `node scripts/test-openrouter.js`. Viết `scripts/test-ai-shape.js` (mock, không gọi mạng) để test phần chuẩn hoá ở mục 3–4. Ghi Notes, `Status: DONE`.

## Notes
- Đã hiệu chuẩn prompt chấm điểm (RUBRIC neo 1–5, trích dẫn bằng chứng), temperature 0.2 cho grade/summary, 0.6 cho turn.
- Chuẩn hoá output qua shapeAnswer/shapeCode/shapeSummary/shapeTurn + normalizeOut; hire_signal align với overall_score.
- Seeds: systemTurn chỉ hỏi câu trong seeds, seed_index tương ứng.
- Test: node --check ok; scripts/test-openrouter.js 15/15; scripts/test-ai-shape.js 20/20; validate OK.
- (integrator, 19:5x) Đã sửa trên main (commit aa09aab): grade/interview phải kiểm tra `aiConfigured()` thay vì `process.env.OPENROUTER_API_KEY` — đã áp sẵn vào bản đang làm dở; GIỮ NGUYÊN khi sửa tiếp. Không sửa `api/_claude.js` (ngoài Owns); xoá `api/_claude.js.bad`, `api/_claude.new.js` nếu là file tạm của bạn.
Reviewed-by: verify-only (code/UI task)
