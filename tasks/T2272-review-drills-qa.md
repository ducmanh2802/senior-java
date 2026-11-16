# T2272 — Rà soát chất lượng các bài luyện hỏi-đáp tiếng Anh trong drills-qa.js

Status: DONE
Agent: kilo
Owns: `js/data/drills-qa.js`
After: T1729

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài luyện hỏi-đáp tiếng Anh (`node scripts/qtool.js list js/data/drills-qa.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: câu trả lời mẫu tiếng Anh tự nhiên, đúng ngữ pháp, giọng Senior; thuật ngữ đúng; Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/drills-qa.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
- Kiểm tra: liệt kê toàn bộ 161 mục `drill-qa-*` (001–161) bằng grep/node, rà soát nội dung theo từng nhóm theme/level (intro, project, tech, design, behavioral, negotiation, smalltalk; mid/senior/lead) qua đọc theo đoạn và trích xuất mẫu; kiểm tra ngữ pháp/giọng nói tự nhiên, thuật ngữ Java/Spring/DB/system design, và quét backtick/`${`/ký tự bất thường. Số mục QA trước = sau = 161 (không xoá/không đổi id).
- `node --check js/data/drills-qa.js` OK. `node scripts/build-light-index.js` OK. `node scripts/validate.js` OK (chỉ còn cảnh báo cũ không thuộc file task).

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| drill-qa-118 | Sai ngữ pháp sở hữu trong sample và phrase: "a bug was caused by a teammate is code" | Sửa thành "a bug was caused by a teammate's code" ở cả `sample` và `phrases` để câu tiếng Anh tự nhiên, đúng ngữ pháp, giữ nguyên ý. |

Các mục đã kiểm tra kỹ (mẫu đại diện, không phát hiện lỗi cần sửa): `drill-qa-014` (Spring `@Transactional` self-invocation/proxy, thuật ngữ và giải thích đúng, giọng senior tự nhiên), `drill-qa-048` (smalltalk remote US-VN, tiếng Anh tự nhiên, thực tế), `drill-qa-154` (freelance project approach, giải thích thuật ngữ rõ cho người mới như API/staging/automated tests, giọng chuyên nghiệp).
Reviewed-by: verify-only (review task)
