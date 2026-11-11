# T1463 — Luyện nói tiếng Anh: thêm 20 câu shadowing drill-shadow-141…160

Status: DONE
Notes: Added 20 shadow drills (drill-shadow-141 … drill-shadow-160) via qtool append. 10 tech (141–150) + 10 design (151–160). build-light-index.js + validate.js → OK.
Owns: `js/data/drills-shadow.js`

Thêm **20 câu shadowing** (nghe và nhắc lại) vào `js/data/drills-shadow.js`, id `drill-shadow-141` … `drill-shadow-160`. Đây là những câu một ứng viên Senior Java hay phải nói khi phỏng vấn bằng tiếng Anh; mỗi câu nên chứa một mẫu câu dùng lại được (ví dụ "The main trade-off here is…", "What I would do first is…").

Nội dung đợt này: 10 câu theme "tech" (giải thích cơ chế: transaction, index, cache, Kafka, thread pool, GC…) và 10 câu theme "design" (nêu trade-off, ước lượng, bước tiếp theo khi thiết kế hệ thống).

Mỗi câu: `{ id: "drill-shadow-NNN", kind: "shadow", theme, level, en: "…", vi: "…" }`
- `en`: MỘT câu tiếng Anh **8–25 từ**, tự nhiên, đúng ngữ pháp, đúng kỹ thuật. `vi`: nghĩa tiếng Việt có dấu.
- `theme`: intro | tech | behavioral | design | project | negotiation | smalltalk. `level`: mid | senior | lead.
- Xem các câu đã có để không trùng: `grep -o 'en: "[^"]*"' js/data/drills-shadow.js`.

## Luật
- Đọc AGENTS.md trước. **Chỉ thêm** object mới vào cuối `js/data/drills-shadow.js`; không sửa/xoá mục đã có; không sửa file nào khác.
- Cách thêm an toàn (khuyên dùng): viết các object mới (cú pháp JavaScript, cách nhau bằng dấu phẩy) vào file tạm `logs/tmp-T1463.js`, rồi chạy `node scripts/qtool.js append js/data/drills-shadow.js logs/tmp-T1463.js`. Tool tự kiểm tra cú pháp, id trùng và chèn đúng chỗ. **KHÔNG ghi lại toàn bộ file dữ liệu.**
- Chuỗi tiếng Anh có dấu nháy đơn (I'm, don't, it's) → bọc chuỗi bằng dấu nháy kép "...". Không dùng backtick và ký tự $ trong nội dung.
- Tiếng Anh phải **đúng ngữ pháp, tự nhiên, câu ngắn dễ nói** (trình độ B1–B2, đúng kiểu một kỹ sư nói khi phỏng vấn, không văn viết hoa mỹ). Nội dung kỹ thuật phải ĐÚNG. Tiếng Việt có dấu đầy đủ.
- Tự viết bằng lời của mình, không chép từ sách hay trang web. Không trùng ý với mục đã có.

## Nghiệm thu
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Sửa dòng `Status: TODO` thành `Status: DONE` và ghi Notes: danh sách id đã thêm.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
