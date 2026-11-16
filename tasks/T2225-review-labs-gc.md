# T2225 — Rà soát chất lượng 4 lab id NHỎ nhất trong labs-gc.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-gc.js`
After: T2153

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 lab id NHỎ nhất (`node scripts/qtool.js list js/data/labs-gc.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: artifact giống thật và tự nhất quán (định dạng jstack/GC log JDK 17+/EXPLAIN PostgreSQL đúng; timestamp, lock id, số liệu khớp nhau và khớp answer); answer trích đúng dòng; cách sửa đúng kỹ thuật; rubric ≥ 3 ý.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/labs-gc.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Kết quả rà soát 4 lab id nhỏ nhất trong `js/data/labs-gc.js` (lab-gc-001, 002, 003, 004):
Không tìm thấy lỗi kỹ thuật, không sửa gì, không xoá mục, không đổi id. Số mục trước/sau bằng nhau (4 lab).

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lab-gc-001 | Không lỗi. GC log JDK 17 nhất quán (region 2M, heap 4GB, 9 Full GC 1.6–2.2s), answer trích đúng dòng: GC(846) Humongous 1288→1288, GC(847) Old 741→141, GC(851) Humongous 1131→12, heap về 229M sau khi export xong → bằng chứng không phải leak. Rubric 5 ý. | Giữ nguyên |
| lab-gc-002 | Không lỗi. Delta histogram khớp: FxQuoteSession/FxQuote/CHM$Node/String/[B +789,192, BigDecimal +2,367,576 (3×); Metric khớp: 276 quote/min không gỡ × 1.440 ≈ 395k/ngày ≈ 789k/2 ngày; old_floor 148→552 MB. Code sửa đúng Caffeine `removalListener`. Rubric 5 ý. | Giữ nguyên |
| lab-gc-003 | Không lỗi. classloader_stats: Total = 26919 loader (1 GroovyClassLoader + 26914 InnerLoader × Classes 1 + 4 hệ thống), cùng parent; class loaded 1.54/s = rule_eval/s, unloaded = 0; Metaspace 262101K→262101K ≈ 262144K (256m); stack trace OOM ở `defineClass1` từ `PricingRuleEngine.evaluate` dòng 26. Rubric 5 ý. | Giữ nguyên |
| lab-gc-004 | Không lỗi. Ngân sách NMT committed 1.90 GiB lúc 10:05 khớp working_set 1.90 GiB; direct_used 392 MB khớp NMT Other 401408 KB; stack reserved 413 MB / committed 69 MB; OOMKilled exit 137 hợp lý vì limit 2Gi < heap+direct. Rubric 5 ý. | Giữ nguyên |

Chứng thực: `node --check js/data/labs-gc.js` → OK; `node scripts/build-light-index.js` → OK; `node scripts/validate.js` → `OK — không có lỗi.`
