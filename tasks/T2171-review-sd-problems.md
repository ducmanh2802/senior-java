# T2171 — Rà soát chất lượng 3 đề system design mới nhất trong sd-problems.js

Status: DONE
Agent: kilo
Owns: `js/data/sd-problems.js`
After: T1725

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 3 đề system design mới nhất (`node scripts/qtool.js list js/data/sd-problems.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: ước lượng số liệu hợp lý và nhất quán; kiến trúc đúng; trade-off rõ; sơ đồ ~~~seq đúng cú pháp.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/sd-problems.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| sd-040 | Feature store online user ước lượng 200 GB (50M x 500 x 8B) — mâu thuẫn với guide trước đó "chỉ lưu feature active" và table dưới đây chỉ lưu 1M active user (~4 GB). 200 GB tương đương lưu toàn bộ 50M user, không cần thiết. | Sửa guide: user active 1M x 500 x 8B ≈ 4 GB, đồng bộ với table. |
| sd-040 | Chi phí feature store ghi "$1.000/ngày" — cao không thực tế; 20 node r6g.xlarge on-demand chỉ ~$50/ngày (~$0,10/giờ/node). Tổng chi phí bị phồng lên ~$3.000–4.000/ngày, không nhất quán với serving $384–1.440. | Sửa chi phí feature store ~$50/ngày, tổng ~$1.900–2.900/ngày (~$57.000–87.000/tháng). |
| sd-040 | Serving cluster ước lượng "20M scoring/s, ~200 CPU core hoặc 20 GPU A100" — 200 CPU core chỉ đủ cho ~4M scoring/s, không đủ 20M scoring/s. | Sửa thành ~1.000 CPU core hoặc 20 GPU A100 (đồng bộ với guide). |
| sd-040 | ANN index ước lượng "~5–10 GB" ở guide, table dưới ghi "~4 GB" (2,56 GB x 1.5). | Sửa guide thành ~4–10 GB để bao quát cả hai trường hợp. |
| sd-040 | Table "Online serving cluster" ghi "~200 CPU core" — không đủ cho 20M scoring/s. | Đã sửa thành ~1.000 CPU core (xem dòng trên). |
| sd-041 | Không có lỗi số liệu nào nghiêm trọng; ước lượng 18.000 case, 36.000 lần gọi, 68,4 triệu token, 90 MB/ngày (~33 GB/năm) đều nhất quán và có phép tính. 3 seq blocks (Client|EvalAPI|Kafka|Worker|Provider, 9 bước; 4 actors; 4 actors) đều đúng cú pháp, 2–6 actors, ≥2 bước. | Không cần sửa. |
| sd-042 | Không có lỗi số liệu nào nghiêm trọng; 50M txn = 578 TPS trung bình, peak 5.000 TPS, 50 GB/ngày Kafka, 350 GB 7 ngày, budget 100ms (ingest <10ms, model <30ms, rules <10ms) đều nhất quán. Seq block (TxnService|Kafka|StreamProc|Redis|Scoring, 12 bước, 5 actors) đúng cú pháp. | Không cần sửa. |

Kiểm tra lại: 37 SD problems (sd-001..sd-042), số mục trước/sau bằng nhau (37). `node --check` OK, `node scripts/build-light-index.js` OK, `node scripts/validate.js` → "OK — không có lỗi." Không commit.
Reviewed-by: kilo (T2171R)
