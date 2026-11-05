# T590 — 10 câu "bí kíp" pass phỏng vấn Senior (topic behavioral)

Status: DONE
Reviewed-by: claude (self-checked: validate)
Agent: qoder
Owns: `js/data/q-soft.js`

Thêm 10 câu topic **behavioral** vào `js/data/q-soft.js` (id tiếp nối; đọc hết câu behavioral cũ để không trùng). Mỗi câu là một tình huống phỏng vấn có thật, đáp án dạy **chiến thuật cụ thể + câu nói mẫu + sai lầm hay gặp**:
1. Bị hỏi câu bạn không biết: trả lời thế nào để vẫn ghi điểm (suy luận thành tiếng, nói giới hạn, đề xuất cách tìm hiểu).
2. Vòng system design 45 phút: phân bổ thời gian (làm rõ yêu cầu → ước lượng → API → data → deep dive → trade-off) và tín hiệu interviewer chấm.
3. Live coding bị bí: cách giao tiếp, viết brute force trước, tự test bằng ví dụ, khi nào xin gợi ý.
4. Thể hiện "seniority" trong câu trả lời kỹ thuật: trade-off, số liệu, vận hành, rủi ro (so sánh câu trả lời mid vs senior cho cùng một câu).
5. "Kể về dự án khó nhất": chọn dự án, cấu trúc STAR, con số impact, chuẩn bị 3 lớp câu hỏi đào sâu.
6. Bất đồng với tech lead / kiến trúc sư: disagree and commit, dẫn chứng bằng dữ liệu.
7. Take-home assignment: phạm vi, README, test, những gì reviewer thực sự nhìn.
8. Phỏng vấn vòng quản lý / HR thời layoff: trả lời về ổn định, cam kết, kỳ vọng lương; đọc tín hiệu công ty có đang khó khăn.
9. Chuẩn bị 2 tuần trước phỏng vấn: kế hoạch ôn theo JD, mock, câu chuyện STAR, nghiên cứu công ty.
10. Sau phỏng vấn: follow-up, xử lý bị từ chối, xin feedback, đàm phán khi có nhiều offer.
Level: 2 mid, 6 senior, 2 lead. Mỗi đáp án 2500–4000 ký tự theo chuẩn AGENTS.md mục 6.

## Nghiệm thu
`node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + tóm tắt vào Notes.

## Notes
- Thêm behavioral-021 … behavioral-030 (10 câu; mid: 021, 023; lead: 024, 026; còn lại senior). Mỗi câu 2900–3400 ký tự, cấu trúc như câu behavioral cũ: Tóm tắt → Interviewer muốn đánh giá gì → chiến thuật/bảng → câu nói mẫu → Những điều nên tránh → Senior tip.
- 021 câu không biết (ví dụ ZGC/G1), 022 rubric + giữ nhịp system design (không lặp phân bổ thời gian của design-001), 023 live coding bị bí, 024 mid vs senior vs lead (ví dụ cache), 025 dự án khó nhất + 3 lớp đào sâu, 026 role-play bất đồng với architect (khác behavioral-002 là kể chuyện cũ), 027 take-home, 028 vòng HR/manager thời layoff + tín hiệu công ty khó khăn, 029 kế hoạch 14 ngày, 030 sau phỏng vấn: follow-up, bị từ chối, nhiều offer.
- Thêm dấu phẩy sau entry cuối cũ (testing-024) để nối mảng; không đổi nội dung câu cũ.
- build-light-index + validate: OK.
