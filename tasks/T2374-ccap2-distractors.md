# T2374 — Rà phương án nhiễu quá lộ liễu trong quiz-ccap-2.js (60 câu cuối)

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccap-2.js`
After: T2295

Đề thật CCAR-P: mọi phương án đều hợp lý bề ngoài. Dùng qtool.js list/show js/data/quiz-ccap-2.js, xét 60 câu có id lớn nhất: câu nào có phương án sai lộ liễu (vô lý, buồn cười, quá ngắn so với đáp án đúng) thì viết lại thành sai lầm kiến trúc thật (over-engineering, bỏ qua governance, chọn model sai chi phí/độ trễ, thiếu eval…), độ dài tương đương, cập nhật explain tiếng Việt cho khớp. Giữ id, q, số câu. Ghi danh sách id đã sửa vào Notes (đây là task sửa, không thêm câu: số câu trước = sau).

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa phần đặc tả của file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/quiz-ccap-2.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

Đã hoàn thành task T2374: rà phương án nhiễm quá lộ liễu trong quiz-ccap-2.js (60 câu cuối).

- **Số câu trước:** 114 câu (qz-ccap-161 → qz-ccap-280)
- **Số câu sau:** 114 câu (không thêm, không xoá — chỉ sửa phương án)
- **Số id đã sửa:** 1 — `qz-ccap-255`

Câu `qz-ccap-255` (Solution Design, multi: true, Choose 2) có phương án cuối cùng là `"Increase temperature so the model is more creative"` — một phương án lộ liễu vì tăng temperature chỉ làm tăng ngẫu nhiên của đầu ra, hoàn toàn không liên quan đến việc ngăn chặn prompt injection. Đã viết lại thành `"Rely solely on the model built-in safety features without any additional input validation or delimiters"` — một sai lầm kiến trúc thật (over-reliance on built-in defenses, bỏ qua input validation và clear delimiters), độ dài tương đương, và cập nhật `explain` để giải thích tại sao phương án mới này cũng sai (prompt injection có thể lách qua các lệnh tinh tế; cần phân cách rõ ràng giữa hệ thống và dữ liệu không tin cậy, cùng xác thực đầu vào).

Các câu còn lại (qz-ccap-161 → qz-ccap-254, qz-ccap-256 → qz-ccap-280) đã được kiểm tra: các phương án đều hợp lý, có liên quan, độ dài tương đương và không lộ liễu — giữ nguyên.

Kiểm tra:
- `node --check js/data/quiz-ccap-2.js` → OK
- `node scripts/build-light-index.js` → OK
- `node scripts/validate.js` → OK (lỗi còn lại `primer-037` thuộc file khác, không phải sở hữu của task này)
