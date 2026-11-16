# T2171R — Fact-check nội dung mới của T2171

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2171 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Rà soát nội dung mới của T2171 (`git diff HEAD -- js/data/sd-problems.js`, chỉ chạm sd-040). Đã sửa 2 lỗi số liệu; các thay đổi còn lại của T2171 đúng.

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| sd-040 | T2171 đổi serving estimate sang "~1.000 CPU core" nhưng dòng chi phí serving (không đổi ở HEAD) vẫn tính "200 CPU core x 24h x $0.08 = $384/ngày" → mâu thuẫn nội bộ. Với 20M scoring/s GBDT+LR, ~200 CPU core là hợp lý (~100k scoring/s/core), khớp chi phí $384. | Revert estimate về "~200 CPU core" ở cả guide (phần Estimation) và bảng "Online serving cluster" để đồng bộ với dòng chi phí. |
| sd-040 | Tổng chi phí không khớp giữa guide ("$2.000–3.000/ngày") và bảng chi phí ("$1.900–2.900/ngày"). Tổng đúng = 1000 + (384..1440) + 50 + 500 = 1.934..2.990. | Đồng bộ cả hai thành "~$1.900–3.000/ngày (~$57.000–90.000/tháng)". |

Đã kiểm tra và thấy ĐÚNG (không sửa): ANN index ~4–10 GB (item embedding 2,56 GB x 1,5 ≈ 4 GB); feature store online 1M active user x 500 x 8B ≈ 4 GB; feature store ~$50/ngày (20 node r6g.xlarge x $0,10/giờ x 24h ≈ $48). Số mục không đổi: 42 SD problem (sd-001..sd-042).

Nghiệm thu: `node --check js/data/sd-problems.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → "OK — không có lỗi." Không commit.
