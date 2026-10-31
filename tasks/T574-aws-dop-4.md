# T574 — AWS dop-c02: thêm 30 câu luyện thi (dop-129..dop-158)

Status: TODO
Agent: opencode
Owns: `js/data/aws-dop-4.js`

Đọc docs/AWS-TRACK.md (schema window.AWS_QUESTIONS), js/data/aws-plan.js (id domain), AGENTS.md mục 5 (không backtick, không `${`).
Đọc các file js/data/aws-dop-*.js đã có để KHÔNG trùng tình huống.

Thay nội dung file (đang rỗng) `js/data/aws-dop-4.js` gồm 30 câu, id dop-129..dop-158, exam 'dop-c02', chia đều các domain của dop-c02 theo weight.
- q và options bằng TIẾNG ANH, giống đề thật (bối cảnh công ty, ràng buộc LEAST operational overhead / MOST cost-effective); 4 options; khoảng 6 câu multi (5 options, "(Choose two.)").
- explain bằng TIẾNG VIỆT 600–1500 ký tự: từ khoá trong đề, vì sao đúng, vì sao TỪNG phương án sai, kết thúc "> Exam tip: …".
- Chỉ dùng tính năng AWS hiện hành, KHÔNG bịa. Không chắc thì chọn tình huống khác. Không thêm refs.

## Nghiệm thu
node scripts/check-aws.js → OK; node scripts/validate.js → OK. KHÔNG commit (Claude sẽ review trước khi đưa lên).

## Notes
