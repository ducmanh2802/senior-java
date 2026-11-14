# T573 — AWS sap-c02: thêm 30 câu luyện thi (sap-127..sap-156)

Status: DONE
Agent: opencode

Đã thêm 30 câu hỏi AWS SAP-C02 (id: sap-127..sap-156) vào file `js/data/aws-sap-4.js`. Nội dung tuân thủ đúng yêu cầu về schema, định dạng (không backtick, không ${) và chất lượng (detail explain, exam tip, etc.). Đã chạy validate và check-aws thành công.
Owns: `js/data/aws-sap-4.js`

Đọc docs/AWS-TRACK.md (schema window.AWS_QUESTIONS), js/data/aws-plan.js (id domain), AGENTS.md mục 5 (không backtick, không `${`).
Đọc các file js/data/aws-sap-*.js đã có để KHÔNG trùng tình huống.

Thay nội dung file (đang rỗng) `js/data/aws-sap-4.js` gồm 30 câu, id sap-127..sap-156, exam 'sap-c02', chia đều các domain của sap-c02 theo weight.
- q và options bằng TIẾNG ANH, giống đề thật (bối cảnh công ty, ràng buộc LEAST operational overhead / MOST cost-effective); 4 options; khoảng 6 câu multi (5 options, "(Choose two.)").
- explain bằng TIẾNG VIỆT 600–1500 ký tự: từ khoá trong đề, vì sao đúng, vì sao TỪNG phương án sai, kết thúc "> Exam tip: …".
- Chỉ dùng tính năng AWS hiện hành, KHÔNG bịa. Không chắc thì chọn tình huống khác. Không thêm refs.

## Nghiệm thu
node scripts/check-aws.js → OK; node scripts/validate.js → OK. KHÔNG commit (Claude sẽ review trước khi đưa lên).

## Notes
Reviewed-by: verify-only (code/UI task)
