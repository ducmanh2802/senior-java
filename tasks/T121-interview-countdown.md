# T121 — Dashboard: đếm ngược ngày phỏng vấn + kế hoạch ôn tới ngày đó

Status: TODO
Agent: codex
Owns: `js/views/dashboard.js`, `css/views/dashboard.css`

Đọc AGENTS.md mục 7. Thêm thẻ "🎯 Buổi phỏng vấn sắp tới" trên dashboard: người dùng nhập ngày + công ty (chọn từ `window.COMPANIES` nếu có, hoặc gõ tự do) + vòng (HR/technical/final). Lưu vào `App.store.data.interviewPlan = {date, company, round, updatedAt}` rồi `App.store.save()`. Hiện: còn N ngày; số câu cần ôn mỗi ngày = (câu chưa thuộc ở các topic công ty cần, hoặc mọi topic nếu không rõ) / số ngày còn lại; 3 topic yếu nhất kèm link `#/flash/<topic>`; checklist ngày cuối (đọc lại STAR stories `#/career`, mock `#/interview`, chuẩn bị câu hỏi ngược). Có nút xoá kế hoạch. Không đổi các phần khác của dashboard. `node --check` + `node scripts/validate.js` → OK. Ghi vào Notes nếu cần integrator thêm merge rule sync cho `interviewPlan`.

## Notes
