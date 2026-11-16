# T2270 — Rà soát chất lượng các câu trắc nghiệm trong quiz-gaps.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-gaps.js`
After: T1483

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu trắc nghiệm (`node scripts/qtool.js list js/data/quiz-gaps.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đáp án đúng thật sự đúng (Java 17/21, Spring Boot 3); explain nói vì sao từng phương án sai; phương án nhiễu hợp lý; Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-gaps.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Đã rà soát toàn bộ 85 mục (sql 12, testing 12, ai 12, kotlin 12, banking 27, behavioral 5, english 5). Kiểm tra từng đáp án với Java 17/21, Spring Boot 3.x, PostgreSQL 15; 84/85 đáp án đúng, 1 sai (đã sửa). Nội dung explain của các mục còn lại bám sát đáp án và giải thích được vì sao từng phương án sai.

### Bảng lỗi tìm thấy & đã sửa

| id | Lỗi tìm thấy | Đã sửa gì |
|---|---|---|
| qz-banking-006 | `answer: 2` trỏ tới "long lưu số tiền theo đơn vị nhỏ nhất (xu)" nhưng explain ghi "Đáp án đúng: BigDecimal với scale cố định" (index 1) và lập luận bác bỏ long. Mâu thuẫn đáp án/explain | Sửa `answer` 2 → 1 cho khớp explain. Sửa 2 câu diễn đạt sai trong explain: (1) cộng/trừ/nhân BigDecimal chính xác, phép chia phải chỉ rõ RoundingMode (nếu không 10/3 ném ArithmeticException); (2) so sánh float/double bằng == không đáng tin, còn BigDecimal phải dùng compareTo thay cho equals |
| qz-english-023 | Đoạn "Vì sao đúng" còn "Phương án 0"/"Phương án 2" (không in đậm) — không mapping với UI đã xáo trộn | Viết lại đoạn đó theo nội dung hai lựa chọn đúng (từ chối lịch sự + nhận việc kèm trade-off) |
| qz-sql-018 | Header "Đáp án đúng: phương án 1 và 4." và bullet "**Phương án N**" dùng số thứ tự gốc | Đổi header sang nêu nội dung đáp án đúng; đổi bullet sang nội dung option |
| qz-testing-011 | Header "phương án 1 và 3." | Đổi sang nội dung đáp án đúng |
| qz-kotlin-011 | Header "phương án 1 và 3." | Đổi sang nội dung đáp án đúng |
| qz-kotlin-018 | Header "phương án 1 và 3." | Đổi sang nội dung đáp án đúng |
| qz-behavioral-015 | Header "phương án 2." + bullet "**Phương án N**" | Đổi sang nội dung |
| qz-behavioral-016 | Header "phương án 2." + bullet | Đổi sang nội dung |
| qz-behavioral-017 | Header "phương án 1." + bullet | Đổi sang nội dung |
| qz-behavioral-018 | Header "phương án 1." + bullet | Đổi sang nội dung |
| qz-behavioral-019 | Header "phương án 2." + bullet | Đổi sang nội dung |
| qz-english-024 | Header "phương án 1." + bullet | Đổi sang nội dung |
| qz-english-025 | Header "phương án 2." + bullet | Đổi sang nội dung |
| qz-english-026 | Header "phương án 1 và 2." + bullet | Đổi sang nội dung |
| qz-english-027 | Header "phương án 2." + bullet | Đổi sang nội dung |
| qz-banking-013 | Header "phương án 1." + bullet | Đổi sang nội dung |
| qz-banking-014 | Header "phương án 0 và 2." + bullet đúng/sai | Đổi sang nội dung |
| qz-banking-015 | Header "phương án 1." + bullet | Đổi sang nội dung |
| qz-banking-016 | Header "phương án 0 và 2." + bullet đúng/sai | Đổi sang nội dung |
| qz-banking-017 | Header "phương án 1." + bullet | Đổi sang nội dung |
| qz-banking-018 | Header "phương án 1." + bullet | Đổi sang nội dung |
| qz-banking-019 | Header "phương án 0 và 2." + bullet đúng/sai | Đổi sang nội dung |
| qz-banking-020 | Header "phương án 1." + bullet | Đổi sang nội dung |
| qz-banking-021 | Header "phương án 0 và 2." + bullet đúng/sai | Đổi sang nội dung |
| qz-banking-022 | Header "phương án 1." + bullet | Đổi sang nội dung |
| qz-banking-023 | Header "phương án 0 và 2." + bullet đúng/sai | Đổi sang nội dung |
| qz-banking-024 | Header "phương án 2." + bullet | Đổi sang nội dung |
| qz-banking-025 | Header "phương án 1." + bullet | Đổi sang nội dung |
| qz-banking-026 | Header "phương án 1." + bullet | Đổi sang nội dung |
| qz-banking-027 | Header "phương án 1." + bullet | Đổi sang nội dung |

**Lý do sửa hàng loạt "phương án N":** view quiz (`js/views/quiz.js` hàm `prepare`) **xáo trộn options** và hiển thị nhãn A/B/C/D, nên mọi tham chiếu "phương án 0/1/2/3" theo chỉ số gốc trong explain đều sai so với thứ tự người học thấy. Đã chuyển sang mô tả bằng **nội dung** (đúng theo quy ước của `js/data/quiz.js`). Header đa đáp án dùng dấu " · " giữa các nội dung.

### Kiểm tra
- `node --check js/data/quiz-gaps.js` → OK
- `node scripts/build-light-index.js` → đã ghi `js/data/index-light.js`
- `node scripts/validate.js` → `OK — không có lỗi.`
- Số mục trước/sau: **85 = 85**; id, thứ tự và toàn bộ `options` không đổi; chỉ `answer` của `qz-banking-006` đổi (2 → 1).
- 29 explain có tham chiếu số đã đổi; 56 explain còn lại giữ nguyên (đã xác minh không có thay đổi ngoài ý muốn).
Reviewed-by: verify-only (review task)
