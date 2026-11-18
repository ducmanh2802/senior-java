# T2394 — 1 bài học microservices: saga bù trừ cho chuyển tiền

Status: DONE
Agent: kilo
Owns: `js/data/lessons-microservices.js`
After: T2256

Đọc AGENTS.md mục 12 + bài mẫu lesson-collections-001; grep title: để không trùng. Thêm ĐÚNG 1 bài (id tiếp số lớn nhất, order tiếp theo), body ≥ 2500 ký tự dạy từ gốc, 1–2 bài tập Java thuần JDK 17 test ≥ 3 case xác định, check 2–4 câu. Chủ đề: saga orchestration, bước bù trừ, trạng thái saga, idempotency từng bước, timeout. Bài tập TransferSaga với các service giả có thể lỗi ở từng bước; test bù trừ đúng.

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes.

## Nghiệm thu
`node --check js/data/lessons-microservices.js`, `node scripts/build-light-index.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
- Trước: id lớn nhất `lesson-microservices-017` (order 17). Sau: thêm `lesson-microservices-018` (order 18).
- Nội dung: Saga bù trừ chuyển tiền (orchestration, state machine STARTED/DEBITED/COMPLETED/COMPENSATING/COMPENSATED/FAILED, compensation ngược, idempotency theo sagaId, timeout/kết quả không rõ) với 2 sơ đồ `~~~seq`, 1 bài tập `TransferSaga` + `AccountService` (fail debit/credit, bù trừ refund, idempotent theo sagaId), 5 test case xác định, 4 câu check.
- Kiểm tra: `node --check js/data/lessons-microservices.js` OK. `node scripts/test-lessons.js` → `Lesson exercises OK: 322/322 (287 bài học, 321 từ cache)` (bao gồm bài mới, reference pass, starter không pass). `node scripts/validate.js` hiện KHÔNG OK do lỗi sẵn có ngoài phạm vi sở hữu: `q-security.js` lỗi cú pháp (`Unexpected token '{'` tại dòng ~6700) khiến `node scripts/build-light-index.js` cũng fail và `index-light.js` bị đánh dấu cũ, cùng nhiều lỗi `related`/path/projects trỏ `security-*` không tồn tại trong các file khác (`lessons-spring.js`, `lessons-security.js`, `projects.js`, `path.js`). Không sửa file ngoài `js/data/lessons-microservices.js` theo luật task.
- Đã xóa file tạm `tmp_append_saga.js` tạo trong quá trình thêm bài.
Reviewed-by: kilo (T2394R)
