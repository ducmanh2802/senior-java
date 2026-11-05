# T637 — 10 câu trắc nghiệm tình huống behavioral / giao tiếp tiếng Anh

Status: DONE
Agent: kilo
Owns: `js/data/quiz-gaps.js`
After: T621

Topic **behavioral** mới có 14 câu quiz. Thêm 10 câu vào cuối `js/data/quiz-gaps.js` (đọc file để biết định dạng id đang dùng, id tiếp nối không trùng): 5 câu topic **behavioral** (chọn cách phản hồi tốt nhất khi: bất đồng với lead, deadline không thực tế, sự cố production do mình gây ra, đồng nghiệp không làm phần việc, được giao việc mơ hồ) và 5 câu topic **english** (chọn câu tiếng Anh tự nhiên/lịch sự nhất cho: từ chối yêu cầu, báo trễ tiến độ, hỏi lại khi không nghe rõ trong phỏng vấn, tóm tắt incident cho stakeholder, nói về điểm yếu). explain giải thích vì sao từng phương án sai, kèm lỗi người Việt hay mắc. Có 2–3 câu multi (Chọn 2).

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4 (phần trắc nghiệm) và 5. **Chỉ THÊM** vào cuối mảng trong `js/data/quiz-gaps.js`; id `qz-<topic>-NNN` tiếp nối số lớn nhất hiện có của topic **trên mọi file quiz** (grep "qz-<topic>-" js/data/quiz*.js).
- Đọc các câu cùng topic đã có để không trùng. Câu hỏi theo tình huống thực tế (đoạn code, log, cấu hình), không hỏi định nghĩa suông.
- Khoảng 1/4 là `multi: true` (Chọn 2/Chọn 3). Đáp án đúng rải đều vị trí 0–3. Phương án sai phải hợp lý (lỗi hiểu nhầm hay gặp).
- `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai, 400–1200 ký tự.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node --check js/data/quiz-gaps.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + số câu mới vào Notes.

## Notes

Đã thêm 10 câu trắc nghiệm vào js/data/quiz-gaps.js:
- 5 câu topic behavioral (qz-behavioral-015 → 019): bất đồng với lead, deadline không thực tế, sự cố production do mình gây ra, đồng nghiệp không làm phần việc, được giao việc mơ hồ.
- 5 câu topic english (qz-english-023 → 027): từ chối yêu cầu (multi), báo trễ tiến độ, hỏi lại khi không nghe rõ, tóm tắt incident cho stakeholder (multi), nói về điểm yếu.
- 2 câu multi (Chọn 2): qz-english-023, qz-english-026.
- validate.js → OK.
Reviewed-by: kilo (T637R)
