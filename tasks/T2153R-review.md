# T2153R — Fact-check nội dung mới của T2153

Status: DONE
Agent: opencode
Owns: `js/data/labs-gc.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2153 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- **Không có lỗi trong diff của T2153** (2 dòng sửa ở `lab-gc-015`, `js/data/labs-gc.js`): đều đúng.
  - Tóm tắt "khoảng 32 nghìn class": 52.116 − 20.238 = 31.878 ≈ 32 nghìn (khớp metric `classes_loaded`).
  - "1.54 class/giây": 5.544 ÷ 3.600 = 1.54 (khớp metric).
  - "mỗi preview request ~1.5 class": 1.54 class/s ÷ ~1.02 preview/s ≈ 1.51 (khớp metric `preview/s`).
- `node scripts/validate.js` → `OK — không có lỗi.` (`node --check js/data/labs-gc.js` → OK).
- **Quan sát NGOÀI diff** (thuộc HEAD, không sửa theo luật "không sửa nội dung đã có ở HEAD"): artifact `classloader-stats-1300.txt` của `lab-gc-015` vẫn **không tự nhất quán** — T2037R đã cố đồng bộ (`Total = 40329`, 20.485 `InnerLoader`, classes 46.757) nhưng các số không cộng khớp:
  - Dòng `Total = 40329 loader / 46757 classes / 150817280 ChunkSz` (dòng 2947) không khớp tổng các dòng hiển thị: chỉ ~20.490 loader (20.485 `InnerLoader` + 5 loader hệ thống: Groovy/Launched/App/Platform/boot), ~40.328 classes, và ~224.158.720 byte ChunkSz (104,9 MB InnerLoader + 92,3 MB Launched + 21,0 MB boot + …). ChunkSz `Total` 150.817.280 byte (~144 MB) còn **nhỏ hơn** tổng cột (~214 MB) — bất khả thi với jcmd thật.
  - `classes_loaded` metric = 46.757 (13:00) khớp `Total` classes, nhưng breakdown 20.485 `InnerLoader` (mỗi loader 1 class) + 19.843 class hệ thống = 40.328, **không** cộng tới 46.757.
  - Gợi ý task riêng: neo theo `classes_loaded = 46.757` → số `InnerLoader` ≈ 26.914 (26.909 dòng ẩn + 5 dòng liệt kê), `Total` loader ≈ 26.919, ChunkSz ≈ 257 MB; cập nhật dòng 2941 (`20,480` → `26,909`), dòng 2947 (`Total`), dòng 3068 (`answer`) và dòng 3122 (`rubric`) cho khớp.
- Không sửa nội dung HEAD, không thêm/xoá mục. `index-light.js` không cần build lại (không đổi nội dung dữ liệu).
