# T1503 — Luyện nói tiếng Anh: thêm 20 câu shadowing drill-shadow-221…240

Status: DONE
Agent: kilo
Owns: `js/data/drills-shadow.js`

Thêm **20 câu shadowing** (nghe và nhắc lại) vào `js/data/drills-shadow.js`, id `drill-shadow-221` … `drill-shadow-240`. Đây là những câu một ứng viên Senior Java hay phải nói khi phỏng vấn bằng tiếng Anh; mỗi câu nên chứa một mẫu câu dùng lại được (ví dụ "The main trade-off here is…", "What I would do first is…").

Nội dung đợt này: 10 câu theme "design" (giải thích lựa chọn kiến trúc, ước lượng tải, rủi ro) và 10 câu theme "behavioral" (nhận lỗi, đưa phản hồi, bất đồng ý kiến lịch sự).

Mỗi câu: `{ id: "drill-shadow-NNN", kind: "shadow", theme, level, en: "…", vi: "…" }`
- `en`: MỘT câu tiếng Anh **8–25 từ**, tự nhiên, đúng ngữ pháp, đúng kỹ thuật. `vi`: nghĩa tiếng Việt có dấu.
- `theme`: intro | tech | behavioral | design | project | negotiation | smalltalk. `level`: mid | senior | lead.
- Xem các câu đã có để không trùng: `grep -o 'en: "[^"]*"' js/data/drills-shadow.js`.

## Luật
- Đọc AGENTS.md trước. **Chỉ thêm** object mới vào cuối `js/data/drills-shadow.js`; không sửa/xoá mục đã có; không sửa file nào khác.
- Cách thêm an toàn (khuyên dùng): viết các object mới (cú pháp JavaScript, cách nhau bằng dấu phẩy) vào file tạm `logs/tmp-T1503.js`, rồi chạy `node scripts/qtool.js append js/data/drills-shadow.js logs/tmp-T1503.js`. Tool tự kiểm tra cú pháp, id trùng và chèn đúng chỗ. **KHÔNG ghi lại toàn bộ file dữ liệu.**
- Chuỗi tiếng Anh có dấu nháy đơn (I'm, don't, it's) → bọc chuỗi bằng dấu nháy kép "...". Không dùng backtick và ký tự $ trong nội dung.
- Tiếng Anh phải **đúng ngữ pháp, tự nhiên, câu ngắn dễ nói** (trình độ B1–B2, đúng kiểu một kỹ sư nói khi phỏng vấn, không văn viết hoa mỹ). Nội dung kỹ thuật phải ĐÚNG. Tiếng Việt có dấu đầy đủ.
- Tự viết bằng lời của mình, không chép từ sách hay trang web. Không trùng ý với mục đã có.

## Nghiệm thu
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Sửa dòng `Status: TODO` thành `Status: DONE` và ghi Notes: danh sách id đã thêm.

## Notes

Đã thêm 20 câu shadowing mới (append bằng `node scripts/qtool.js append js/data/drills-shadow.js logs/tmp-T1503.js`, sau đó xoá file tạm):

- 10 câu theme `design`: drill-shadow-221 … drill-shadow-230 (trade-off, ước lượng tải, rủi ro, message queue, partition theo tenant, RTO/consistency, chi phí vận hành, bắt đầu đơn giản rồi mới tách service).
- 10 câu theme `behavioral`: drill-shadow-231 … drill-shadow-240 (nhận lỗi, báo lead sớm, bất đồng với đồng đội, feedback về hành vi, giúp đồng đội chậm, bất đồng với quản lý rồi vẫn ủng hộ quyết định, bài học từ sự cố, nêu lo ngại sớm, feedback khó, xin lỗi và gửi bản sửa).

Tổng file hiện có 240 câu shadowing, không trùng `en` (đã kiểm tra bằng script: 0 câu trùng, mọi câu 8–25 từ). Mỗi câu có mẫu câu dùng lại được ("The main trade-off here is…", "What I would do first is…", "I would rather … than …").

Nghiệm thu: `node scripts/build-light-index.js` → ghi lại `js/data/index-light.js`; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo cũ không liên quan: `path.js: lesson-design-007` không nằm trong PATH). Không commit, không sửa file nào khác.
Reviewed-by: check-i18n (translation, no LLM review)
