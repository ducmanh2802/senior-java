# T1480 — Luyện nói tiếng Anh: thêm 20 câu shadowing drill-shadow-201…220

Status: DONE
Agent: kilo
Owns: `js/data/drills-shadow.js`
After: T1479

Thêm **20 câu shadowing** (nghe và nhắc lại) vào `js/data/drills-shadow.js`, id `drill-shadow-201` … `drill-shadow-220`. Đây là những câu một ứng viên Senior Java hay phải nói khi phỏng vấn bằng tiếng Anh; mỗi câu nên chứa một mẫu câu dùng lại được (ví dụ "The main trade-off here is…", "What I would do first is…").

Nội dung đợt này: 10 câu theme "project" (sự cố production, cải thiện hiệu năng, kết quả có số liệu) và 10 câu theme "smalltalk" hoặc "negotiation" (xin nhắc lại câu hỏi, xin thời gian suy nghĩ, chuyển ý, kết thúc buổi phỏng vấn lịch sự).

Mỗi câu: `{ id: "drill-shadow-NNN", kind: "shadow", theme, level, en: "…", vi: "…" }`
- `en`: MỘT câu tiếng Anh **8–25 từ**, tự nhiên, đúng ngữ pháp, đúng kỹ thuật. `vi`: nghĩa tiếng Việt có dấu.
- `theme`: intro | tech | behavioral | design | project | negotiation | smalltalk. `level`: mid | senior | lead.
- Xem các câu đã có để không trùng: `grep -o 'en: "[^"]*"' js/data/drills-shadow.js`.

## Luật
- Đọc AGENTS.md trước. **Chỉ thêm** object mới vào cuối `js/data/drills-shadow.js`; không sửa/xoá mục đã có; không sửa file nào khác.
- Cách thêm an toàn (khuyên dùng): viết các object mới (cú pháp JavaScript, cách nhau bằng dấu phẩy) vào file tạm `logs/tmp-T1480.js`, rồi chạy `node scripts/qtool.js append js/data/drills-shadow.js logs/tmp-T1480.js`. Tool tự kiểm tra cú pháp, id trùng và chèn đúng chỗ. **KHÔNG ghi lại toàn bộ file dữ liệu.**
- Chuỗi tiếng Anh có dấu nháy đơn (I'm, don't, it's) → bọc chuỗi bằng dấu nháy kép "...". Không dùng backtick và ký tự $ trong nội dung.
- Tiếng Anh phải **đúng ngữ pháp, tự nhiên, câu ngắn dễ nói** (trình độ B1–B2, đúng kiểu một kỹ sư nói khi phỏng vấn, không văn viết hoa mỹ). Nội dung kỹ thuật phải ĐÚNG. Tiếng Việt có dấu đầy đủ.
- Tự viết bằng lời của mình, không chép từ sách hay trang web. Không trùng ý với mục đã có.

## Nghiệm thu
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Sửa dòng `Status: TODO` thành `Status: DONE` và ghi Notes: danh sách id đã thêm.

## Notes

Đã thêm 20 câu `drill-shadow-201` đến `drill-shadow-220`: 10 câu project và 10 câu smalltalk/negotiation.
Reviewed-by: check-i18n (translation, no LLM review)
