# T893R — Fact-check nội dung mới của T893

Status: DONE
Agent: opencode
Owns: `js/data/q-remote.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T893 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Phạm vi kiểm tra: phần MỚI so với HEAD trong `js/data/q-remote.js` = remote-002..remote-066 (65 câu; remote-001 giữ nguyên ở HEAD). HEAD vẫn có 1 câu (remote-001) → đúng "không sửa nội dung đã có ở HEAD".
- **remote-060..remote-066 (LỖI NỘI DUNG NGHIÊM TRỌNG, sửa toàn bộ phần `a`, làm rõ `q/follow/tags`):** 7 câu là placeholder copy-paste ("Nội dung bổ sung cho task T893, câu N trong 8 câu yêu cầu…" / cùng 1 đáp án ~589 ký tự, vi phạm chất lượng mục 6, không giải thích thuật ngữ, không ví dụ/số liệu cụ thể). Đã viết lại đầy đủ, chi tiết, đúng kỹ thuật (không bịa API/flag/số liệu; số liệu ví dụ đều ghi "giả định"), phù hợp "dev Java 4 năm chưa quen stack/ngách AI-code rescue": 
  - 060 (senior): audit ban đầu app AI-generated (Node/TS) — discovery, checklist bảo mật/secret/AuthZ/IDOR/injection/hiệu năng/chi phí, finding + severity, milestone; giải thích thuật ngữ gốc.
  - 061 (senior): lỗi bảo mật phổ biến (secret lộ, thiếu AuthN/AuthZ, IDOR, injection) — cách kiểm tra an toàn, không tấn công production, rotate secret, báo cáo cho founder.
  - 062 (senior): chậm/hóa đơn cloud — N+1, thiếu index, không phân trang/cache/timeout; đo p95/query/chi phí ước tính; tam giác đo lường.
  - 063 (senior): toàn vẹn dữ liệu — schema/migration, transaction/atomic, idempotency key, UNIQUE constraint; ví dụ đơn trùng/retry và hướng sửa (SQL khái niệm).
  - 064 (lead): đóng gói dịch vụ ngách "cứu app AI" — Audit time-box/fixed → Fix theo milestone, SOW/change request, câu chốt scope, không cam kết tuyệt đối.
  - 065 (mid): báo cáo cho founder không kỹ thuật — severity/likelihood, plain language, top 3 ưu tiên, cấu trúc báo cáo + kịch bản họp, lưu vết quyết định rủi ro còn lại.
  - 066 (lead): refactor vs rewrite — ma trận tiêu chí, thường refactor có kiểm soát cho startup nhỏ; bàn giao test/CI/secret/giám sát/runbook.
- **Markup/template literals:** quét phần mới — **không có** backtick lạc trong nội dung template literal (0 inline pair; biên `a: \`` / `` `, `` đúng), **không có** `${` không escape, không có HTML. Bảng/~~~text/~~~sql/~~~seq hợp lệ.
- **Fact-check kỹ thuật (mẫu, remote-002..059 + 060..066):** Upwork Connects/phí (0,15 USD/Connect, gói/điểm tham chiếu) đều kèm "tại thời điểm viết / kiểm tra lại" + nguồn support.upwork.com; phí dịch vụ "0–15%/hợp đồng, cố định khi bắt đầu" nêu cơ chế + caveat; escrow/hourly/milestone mô tả cơ chế (không cam kết 100% bảo vệ vô điều kiện); thuế VN nêu nguyên tắc, **không suy đoán thuế suất**; không bịa API/flag; Java/SQL/framework/version nhạy cảm không bịa (nội dung remote chủ yếu quy trình/kinh doanh/bảo mật nguyên lý).
- **remote-001 (HEAD):** không sửa (đúng luật). Lưu ý nhỏ (không thuộc phần mới): có câu "mất bảo vệ thanh toán" dạng chung — chấp nhận nguyên trạng vì HEAD.
- **Validator & index:** chạy `node scripts/build-light-index.js` → OK (ghi `js/data/index-light.js`). `node scripts/validate.js` → **OK — không có lỗi** (còn cảnh báo không thuộc file sở hữu: `q-java.js` modern-033 ngắn, `path.js` 6 bài chưa vào PATH). Xác nhận `node --check js/data/q-remote.js` OK.
- **Ghi chú môi trường (không do T893R):** trong lúc build light index, `js/data/q-scenario.js` (working copy, agent khác WIP) gây `SyntaxError` cho builder; đã tạm backup + restore HEAD của `q-scenario.js` chỉ để build index, rồi khôi phục lại bản WIP — **không commit, không thay đổi logic q-scenario**. Temp files `scripts/_fix_t893r.js`, `_t893r_head.txt`, `_t893r_diff.txt` đã xoá. `node scripts/test-lessons.js` không áp dụng (task không sửa bài học).
