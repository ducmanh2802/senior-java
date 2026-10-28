# T321 — Trắc nghiệm: chế độ "Thi thử" kiểu chứng chỉ + ôn câu sai

Status: DONE
Agent: opencode
Owns: `js/views/quiz.js`, `css/views/quiz.css`
After: T320

Đọc AGENTS.md mục 7 trước. Thêm vào view quiz (route `#/quiz`, chế độ thi thử là `#/quiz/exam/<topic>`) mà không làm hỏng chế độ trắc nghiệm hiện có.

1. **Câu chọn nhiều đáp án** (schema của T320, `multi: true`, `answer` là mảng):
   - Hiển thị checkbox kèm dòng "Chọn N đáp án". Chỉ cho xác nhận khi đã chọn đủ N.
   - Chỉ đúng khi chọn đúng toàn bộ, không có điểm từng phần.
   - Áp dụng cho cả chế độ thường.
2. **Thi thử** (nút "Thi thử" ở màn chọn quiz, hiển thị khi topic có ≥ 53 câu; mặc định cho topic `claude`):
   - Domain lấy từ tag đầu câu `q` dạng `[Domain]`. Câu không có tag thuộc nhóm "Khác".
   - Bốc ngẫu nhiên 53 câu, phân bổ theo trọng số domain:

     | Domain | Trọng số |
     |---|---|
     | Applications | 33% |
     | Model Selection | 17% |
     | Agents | 15% |
     | Prompt | 11% |
     | Tools | 11% |
     | Security | 8% |
     | Claude Code | 3% |
     | Eval | 2% |

     Thiếu câu ở domain nào thì bù từ domain khác.
   - Bấm giờ 120 phút, đồng hồ đếm ngược luôn hiển thị; hết giờ thì tự nộp bài.
   - **Không hiện đáp án trong lúc thi.** Có lưới điều hướng tới từng câu, có nút "Đánh dấu xem lại", có thể đổi đáp án trước khi nộp.
   - Nộp bài thì tính điểm thang 1000: `round(100 + 900 × đúng / tổng)`; đậu khi ≥ 720. Ghi rõ "thang điểm mô phỏng, không phải cách chấm chính thức".
   - Trang kết quả gồm: điểm, ĐẬU/TRƯỢT, bảng % đúng theo từng domain (domain < 72% tô màu `bad`), danh sách câu sai kèm `explain` (dùng `App.md`), nút "Ôn lại câu sai" (bắt đầu một quiz thường chỉ gồm các câu sai).
3. **Lưu tiến độ:**
   - Lưu kết quả bằng `App.store.addQuizResult({ mode: 'exam', topic, score, passed, total, correct, byDomain, wrongIds })`.
   - Màn chọn quiz hiển thị 5 lần thi gần nhất và nút "Luyện domain yếu" (quiz thường gồm các câu thuộc domain có tỉ lệ đúng thấp nhất trong lần thi gần nhất).
   - Bài thi đang làm dở được lưu vào `sessionStorage` (bọc try/catch) để reload không mất.
4. Phím tắt: 1–6 chọn đáp án, N/P sang câu sau/trước, F đánh dấu; hiện gợi ý `<kbd>`. Responsive tới 360px, chỉ dùng biến màu CSS, i18n vi/en theo cách view đang làm.
5. `node --check js/views/quiz.js`, `node scripts/validate.js` → OK. Ghi Notes, `Status: DONE`.

## Notes

- Integrator (Claude): làm thành view riêng #/exam/<topic> (js/views/exam.js + css/views/exam.css, đăng ký trong index.html) thay vì nhồi vào quiz.js; quiz.js thêm hỗ trợ multi (tick + Xác nhận/Enter, đúng khi khớp toàn bộ) và nút "Vào thi thử". Exam: 53 câu theo trọng số domain, 120 phút, lưới câu + đánh dấu, không hiện đáp án khi thi, nộp tự động khi hết giờ, thang 100–1000 (đậu 720), điểm theo domain, ôn câu sai / luyện domain yếu (chế độ luyện tập hiện giải thích ngay), lưu bài dở trong sessionStorage, lịch sử 5 lần thi. Smoke test headless (vm + DOM giả): 53 câu, 8 domain, lưu/xoá sessionStorage, kết quả + lịch sử mode=exam.
Reviewed-by: claude (integrator)
