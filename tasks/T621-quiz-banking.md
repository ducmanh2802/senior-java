# T621 — 12 câu trắc nghiệm nghiệp vụ ngân hàng

Status: DONE
Agent: kilo
Owns: `js/data/quiz-gaps.js`
After: T618

Thêm 12 câu topic **banking** (id qz-banking-001…) vào cuối `js/data/quiz-gaps.js`, theo tình huống: tiền bị trừ nhưng app báo lỗi thì hệ thống nên làm gì, bút toán nào đúng cho giao dịch hoàn tiền, cut-off và ngày làm việc, callback trùng, phân loại dòng lệch khi đối soát, làm tròn tiền, che số thẻ trong log, maker-checker. Đọc các câu trong js/data/q-banking.js để thống nhất thuật ngữ.

- **Sơ đồ:** luồng có nhiều bên (app, service, DB, Kafka, ngân hàng đối tác…) hãy vẽ bằng khối ~~~seq (cú pháp ở AGENTS.md mục 5), mỗi bài/câu/giai đoạn quan trọng ít nhất 1 sơ đồ; validator kiểm tra cú pháp.

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4 (phần trắc nghiệm) và 5. **Chỉ THÊM** vào cuối mảng trong `js/data/quiz-gaps.js`; id `qz-<topic>-NNN` tiếp nối số lớn nhất hiện có của topic **trên mọi file quiz** (grep "qz-<topic>-" js/data/quiz*.js).
- Đọc các câu cùng topic đã có để không trùng. Câu hỏi theo tình huống thực tế (đoạn code, log, cấu hình), không hỏi định nghĩa suông.
- Khoảng 1/4 là `multi: true` (Chọn 2/Chọn 3). Đáp án đúng rải đều vị trí 0–3. Phương án sai phải hợp lý (lỗi hiểu nhầm hay gặp).
- `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai, 400–1200 ký tự.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node --check js/data/quiz-gaps.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + số câu mới vào Notes.

## Notes

Thêm 12 câu qz-banking-001..012 vào js/data/quiz-gaps.js. validate OK.
Reviewed-by: kilo (T621R)
