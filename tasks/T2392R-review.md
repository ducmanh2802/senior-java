# T2392R — Fact-check nội dung mới của T2392

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2392 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Không có lỗi kiến thức trong nội dung mới T2392 (devops-180 → devops-184, file js/data/q-devops.js): đã kiểm tra kỹ thuật (JVM container-aware/CFS throttling, PDB eviction + unhealthyPodEvictionPolicy, KEDA Kafka lag scaling, ESO/Vault CSI + Spring configtree refresh, Argo Rollouts AnalysisTemplate/rollbackWindow), markup (không backtick, không `${`, ~~~seq hợp lệ), và schema — `node scripts/validate.js q-devops.js` không báo lỗi thuộc q-devops.js; `node --check js/data/q-devops.js` OK. Không chỉnh văn phong/dộ dài theo luật review.
- Validate toàn repo hiện không OK do file của task khác bị lỗi ở working tree (lessons-claude.js:19 bloque build-light-index; q-banking.js:421, lessons-security.js:5114 đã ghi nhận trong T2392-.md) — không thuộc quyền sở nhiệm T2392R, không tự sửa.
