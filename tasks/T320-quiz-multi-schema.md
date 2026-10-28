# T320 — Trắc nghiệm: hỗ trợ câu chọn nhiều đáp án (schema + validate)

Status: DONE
Agent: opencode
Owns: `scripts/validate.js`, `AGENTS.md`

Integrator cho phép sửa đúng các file trong `Owns`. Đề CCDV-F có câu chọn nhiều đáp án (multiple-response). Mở rộng schema QUIZ mà **không làm vỡ câu cũ**:

1. Câu một đáp án giữ nguyên như hiện tại: `options` có đúng 4 phần tử, `answer` là số nguyên 0..3.
2. Câu nhiều đáp án: `multi: true`, `options` có 4–6 phần tử không trùng, `answer` là mảng 2–3 index **khác nhau**, tăng dần, nằm trong phạm vi `options`. Câu `q` phải ghi rõ số đáp án cần chọn, ví dụ "(Chọn 2)". Validator kiểm tra chuỗi "(Chọn N)" hoặc "(Choose N)" khớp với `answer.length`.
3. `multi` chỉ được phép là `true` hoặc không có. Không thêm field nào khác.
4. Cập nhật mục 4 của `AGENTS.md` (đoạn "Câu trắc nghiệm") để mô tả định dạng mới, 3–4 dòng.
5. Kiểm chứng: `node scripts/validate.js` → `OK — không có lỗi.` với dữ liệu hiện tại. Tạo tạm 1 câu multi sai và 1 câu multi đúng trong file scratch (KHÔNG commit, xoá sau khi thử) để chắc chắn validator bắt đúng; ghi kết quả vào Notes. `Status: DONE`.

## Notes

- Integrator (Claude) kiểm tra bản agent làm: validate dữ liệu thật OK; thử 4 câu scratch (không commit) → câu multi đúng qua, sai số (Chọn N), answer không tăng dần, multi khác true đều bị báo lỗi.
