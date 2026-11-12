# T1530 — Thêm 2 bài học (claude) vào lessons-claude.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-claude.js`

Thêm **2 bài học mới** vào `js/data/lessons-claude.js` (track `claude`, id và `order` nối tiếp bài cuối của track). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: vòng lặp agent với tool use (bài tập: mô phỏng agent loop bằng Java thuần với tool giả lập, xử lý tool_result và điều kiện dừng); thiết kế tool description và JSON schema input (bài tập: validate input theo schema đơn giản) — bám nội dung đề CCA-F.

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập Java tự chấm (starter biên dịch được, tests ≥ 3 case deterministic, reference pass 100%), 2–4 câu check, related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md (mục 4–6, 12) trước. **Chỉ thêm** vào `js/data/lessons-claude.js`, không sửa mục khác, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/lessons-claude.js logs/tmp-T1530.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG** (Java 17/21, Spring Boot 3.x, PostgreSQL hiện hành). Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` và `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm `lesson-claude-004` và `lesson-claude-005`; cập nhật `js/data/index-light.js`.
- `node scripts/test-lessons.js`: 221/221; `node scripts/validate.js`: `OK — không có lỗi.` Validator còn cảnh báo PATH chưa liệt kê hai bài mới; không sửa `js/data/path.js` vì file không thuộc task.
Reviewed-by: kilo (T1530R)
