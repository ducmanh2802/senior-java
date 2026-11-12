# T1482 — Luyện phát âm thuật ngữ: thêm 20 từ drill-term-141…160

Status: DONE
Agent: kilo
Owns: `js/data/drills-term.js`
After: T1481

Thêm **20 thuật ngữ kỹ thuật mà dev Việt hay phát âm sai** vào `js/data/drills-term.js`, id `drill-term-141` … `drill-term-160`. Xem danh sách từ đã có bằng `node scripts/qtool.js list js/data/drills-term.js` và **không lặp lại** từ nào. Ưu tiên từ hay dùng khi phỏng vấn backend: tên khái niệm (ví dụ asynchronous, concurrency, throughput, latency, queue, cache, schema, hierarchy, parameter, architecture, authorization, deprecated, algorithm, tuple, enum, daemon, façade…), động từ và danh từ hay nói (determine, analysis, component, environment, priority, occur, purchase, debt, subtle, receipt…).

Mỗi mục: `{ id: 'drill-term-NNN', kind: 'term', theme: 'tech', level, term, say, wrong, example }`
- `term`: từ tiếng Anh. `say`: gợi ý đọc cho người Việt, viết kiểu phiên âm tiếng Việt, âm tiết mang trọng âm VIẾT HOA, ví dụ `'mi-ti-GÂY-sần, trọng âm GÂY'`. Phải đúng với cách phát âm chuẩn (kiểm tra trọng âm trong từ điển Cambridge/Oxford); không chắc thì chọn từ khác.
- `wrong`: lỗi người Việt hay mắc với từ này (đọc sai âm nào, sai trọng âm ở đâu, âm câm).
- `example`: MỘT câu tiếng Anh dùng từ đó trong ngữ cảnh phỏng vấn kỹ thuật.
- `level`: mid | senior | lead.

## Luật
- Đọc AGENTS.md trước. **Chỉ thêm** object mới vào cuối `js/data/drills-term.js`; không sửa/xoá mục đã có; không sửa file nào khác.
- Cách thêm an toàn (khuyên dùng): viết các object mới (cú pháp JavaScript, cách nhau bằng dấu phẩy) vào file tạm `logs/tmp-T1482.js`, rồi chạy `node scripts/qtool.js append js/data/drills-term.js logs/tmp-T1482.js`. Tool tự kiểm tra cú pháp, id trùng và chèn đúng chỗ. **KHÔNG ghi lại toàn bộ file dữ liệu.**
- Chuỗi tiếng Anh có dấu nháy đơn (I'm, don't, it's) → bọc chuỗi bằng dấu nháy kép "...". Không dùng backtick và ký tự $ trong nội dung.
- Tiếng Anh phải **đúng ngữ pháp, tự nhiên, câu ngắn dễ nói** (trình độ B1–B2, đúng kiểu một kỹ sư nói khi phỏng vấn, không văn viết hoa mỹ). Nội dung kỹ thuật phải ĐÚNG. Tiếng Việt có dấu đầy đủ.
- Tự viết bằng lời của mình, không chép từ sách hay trang web. Không trùng ý với mục đã có.

## Nghiệm thu
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Sửa dòng `Status: TODO` thành `Status: DONE` và ghi Notes: danh sách id đã thêm.

## Notes

Đã thêm `drill-term-141` đến `drill-term-160` vào `js/data/drills-term.js`; đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js` thành công. Validator vẫn in cảnh báo không chặn về `lesson-design-007` chưa nằm trong PATH.
Reviewed-by: check-i18n (translation, no LLM review)
