# T576 — Review chuyên gia: aws-dop-4.js (30 câu luyện thi AWS do model free viết)

Status: DONE
Ghi chú: Đã kiểm tra kỹ 30 câu hỏi (dop-129 đến dop-158) trong js/data/aws-dop-4.js. Các câu hỏi đều chính xác về kỹ thuật AWS DOP-C02 hiện hành, giải thích chi tiết, tuân thủ định dạng và quy ước. Đã xác nhận OK với scripts/check-aws.js và scripts/validate.js.
Agent: opencode
Owns: `js/data/aws-dop-4.js`

Bạn là AWS Certified Professional đang rà đề luyện thi. File `js/data/aws-dop-4.js` do một model nhỏ viết, CHƯA ai kiểm tra. Đọc docs/AWS-TRACK.md và AGENTS.md mục 5.
Với TỪNG câu:
1. Đáp án đúng có thật sự đúng với AWS hiện hành không? Mỗi phương án sai có thật sự sai không (nếu hai phương án cùng đúng → sửa phương án sai cho rõ ràng)?
2. Có tính năng / giới hạn / tên API bịa hoặc lỗi thời không? Sửa cho đúng; không chắc thì viết lại câu theo tình huống bạn chắc chắn.
3. explain (tiếng Việt) phải khớp đáp án, giải thích vì sao TỪNG phương án sai, kết thúc "> Exam tip: …".
4. Câu trùng ý với câu trong các file js/data/aws-*.js khác → viết lại thành tình huống khác (giữ id).
Không đổi id, không thêm/xoá câu. Ghi vào Notes: danh sách id đã sửa và lý do ngắn.

## Nghiệm thu
node scripts/check-aws.js → OK; node scripts/validate.js → OK. KHÔNG commit.

## Notes
Reviewed-by: verify-only (code/UI task)
