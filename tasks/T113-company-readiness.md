# T113 — Điểm sẵn sàng theo công ty (`#/companies`)

Status: DONE
Agent: opencode
Owns: `js/views/companies.js`, `css/views/companies.css`

Đọc AGENTS.md mục 7 và `js/data/companies.js` (field topic/trọng tâm của từng công ty). Với mỗi công ty, tính **Readiness 0–100%** từ tiến độ học: trung bình có trọng số của `App.stats(topicId)` cho các topic công ty đó cần (known = 1, review = 0.5, unknown/unseen = 0), cộng thêm nếu có lịch sử mock/interview gần đây nếu dữ liệu có sẵn trong `App.store.data`. Hiện thanh `.progress` + % trên thẻ công ty và ở trang chi tiết: 3 topic yếu nhất kèm link `#/bank/<topic>` và `#/flash/<topic>` để ôn ngay. Sắp xếp được theo readiness. Chỉ đọc dữ liệu, không ghi store. `node --check` + `node scripts/validate.js` → OK.

## Notes

- Readiness dùng trung bình `known + 0.5 × review`, có trọng số theo số câu từng topic; dữ liệu mock/interview 90 ngày gần nhất bổ sung 20% khi có.
- Thêm progress bar ở thẻ và trang chi tiết, sắp xếp readiness tăng/giảm, cùng 3 topic yếu nhất với link bank/flash.
- Đã chạy `node --check js/views/companies.js` và `node scripts/validate.js`; validator báo `OK — không có lỗi.`
Reviewed-by: codex (T113R)
