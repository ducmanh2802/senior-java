# T1528 — Thêm 2 bài học (collections) vào lessons-collections.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-collections.js`

Thêm **2 bài học mới** vào `js/data/lessons-collections.js` (track `collections`, id và `order` nối tiếp bài cuối của track). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: HashMap bên trong (bucket, hash spreading, resize, treeify) với bài tập tự cài một HashMap nhỏ; LinkedHashMap làm LRU cache với bài tập.

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập Java tự chấm (starter biên dịch được, tests ≥ 3 case deterministic, reference pass 100%), 2–4 câu check, related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md (mục 4–6, 12) trước. **Chỉ thêm** vào `js/data/lessons-collections.js`, không sửa mục khác, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/lessons-collections.js logs/tmp-T1528.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG** (Java 17/21, Spring Boot 3.x, PostgreSQL hiện hành). Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` và `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm `lesson-collections-008` (MiniHashMap) và `lesson-collections-009` (weighted LRU với LinkedHashMap).
- `node scripts/test-lessons.js` đạt 225/225; `node scripts/build-light-index.js` đã chạy; `node scripts/validate.js` in `OK — không có lỗi.`
Reviewed-by: kilo (T1528R)
