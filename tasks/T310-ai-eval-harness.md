# T310 — Bộ đánh giá chất lượng model free (golden set)

Status: TODO
Agent: opencode
Owns: `scripts/eval-ai.js`, `scripts/eval/golden.json`
After: T309

Mục tiêu: **đo** được model free nào chấm đúng, để chọn `AI_MODELS` bằng số liệu chứ không đoán.

1. `scripts/eval/golden.json` gồm 12 case lấy từ ngân hàng câu hỏi: java core, spring, jpa, concurrency, db, system design, và 2 câu `lang: 'en'`. Mỗi case có:
   - `question` và `reference` (đoạn Tóm tắt + ý chính).
   - 3 câu trả lời viết tay: `bad` (sai hoặc lạc đề, kỳ vọng 1–2), `mid` (đúng ý chính nhưng thiếu sâu, kỳ vọng 3), `good` (đầy đủ trade-off + pitfall, kỳ vọng 4–5).
2. `scripts/eval-ai.js`, chạy bằng `node scripts/eval-ai.js model1,model2,...`:
   - Đọc `OPENROUTER_API_KEY` từ env. Với mỗi model, đặt `process.env.AI_MODELS` = model đó, rồi chấm mọi câu trả lời bằng đúng logic và prompt của `api/grade.js`, gọi trực tiếp handler hoặc hàm export.
   - In bảng cho mỗi model: tỉ lệ JSON hợp lệ, tỉ lệ đúng thứ tự (bad < mid < good), MAE so với kỳ vọng, độ trễ trung bình, số lượt gọi.
   - Ghi kết quả vào `logs/eval-ai-<timestamp>.json`.
   - Có cờ `--dry` để chạy với fetch mock, không tốn hạn mức, dùng để tự kiểm.
3. Chạy tuần tự, nghỉ 3.5s giữa các request (giới hạn free của OpenRouter khoảng 20 request/phút). Trước khi chạy, in tổng số request dự kiến (36/model). Chỉ chạy các model được truyền vào, không tự quét hết.
4. Kiểm chứng: `node --check`; `node scripts/eval-ai.js --dry` chạy hết không lỗi. KHÔNG chạy thật vì tốn hạn mức; ghi lệnh chạy thật vào Notes. `Status: DONE`.

## Notes

