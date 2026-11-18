# T2401R — Fact-check nội dung mới của T2401

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ccdv-1.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2401 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã fact-check toàn bộ câu mới qz-ccdv-181..210. Lỗi kiến thức/API bịa đã sửa:
- qz-ccdv-185: `output_config.format` không tồn tại → `output_format: {type: "json_schema"}`; bỏ khẳng định "JSON Schema Draft 2020-12" (Anthropic không công bố draft đó) → nói schema chỉ ràng buộc cấu trúc/kiểu.
- qz-ccdv-187: `metadata.user_id` được mô tả sai là "attribution/analytics" → đúng là gắn request với end-user cho phát hiện lạm dụng/thống kê; nói rõ key riêng per tenant cũng tách được quota nhưng khó quản lý.
- qz-ccdv-189: "BAA/DPAddendum" → "BAA/DPA"; bỏ chi tiết sai "server Anthropic có thể ở region khác" theo nghĩa server riêng, đổi thành request xử lý trên hạ tầng Anthropic có thể khác region.
- qz-ccdv-193: hỏng đáp án — `answer: [1,3]` nhưng phương án 4 là mệnh đề SAI và explain chỉ nêu "phương án 2". Viết lại phương án 4 thành tính tái lập (reproducible) và explain giải thích đúng 2 đúng/2 sai.
- qz-ccdv-202: bịa flag `--no-shell`, `--unsafe-disable-hooks`, khẳng định hooks cấu hình trong CLAUDE.md. Sửa thành permission rule `Bash: ask` trong `.claude/settings.json` hoặc PreToolUse hook exit code 2; nêu rõ CLAUDE.md chỉ là hướng dẫn văn bản, không phải ranh giới bảo mật.
- qz-ccdv-203: thư mục `.claudecodes` không tồn tại → `.claude/` (settings.json, hooks, agents/, commands/); nêu ~/.claude/ cho cấp người dùng.
- qz-ccdv-205: câu hỏi/đáp án mơ hồ ("blocks" vs "background") → nêu đúng timeout Bash mặc định ~2 phút, tối đa ~10 phút và khả năng chạy nền đọc output sau.
- qz-ccdv-206: `--output-format json` in JSON ra **stdout** (không tạo file); bổ sung `stream-json`, các field result/session_id/cost.
- qz-ccdv-207: bịa flag `--read-only`; đáp án đúng là deny rule Edit/Write theo path trong `.claude/settings.json` (hook là lớp bổ sung), nêu rõ settings cấp dự án vẫn được áp dụng.
- qz-ccdv-208: "không đọc file ignore" là sai tuyệt đối → Grep/Glob bỏ qua theo .gitignore, nhưng đọc được nếu chỉ đích danh; nhắc không coi .gitignore là ranh giới bảo mật.
- qz-ccdv-210: "merge conflict khi edit" là cơ chế bịa → Edit là exact-string replace, nếu `old_string` cũ thì tool trả lỗi, Claude Read lại rồi retry; xung đột git thật vẫn do người dùng quyết định.
- qz-ccdv-201: phương án nhiễu "AGENTS.md" gây nhập nhằng (Claude Code cũng đọc được AGENTS.md) → đổi thành `.cursorrules`; explain nói rõ CLAUDE.md cấp repo và ~/.claude/CLAUDE.md.
Không sửa các câu còn lại (181–184, 186, 188, 190–192, 194–201, 204, 209): kiến thức đúng.
Kiểm tra: `node --check js/data/quiz-ccdv-1.js` OK (0 backtick/`${`), script kiểm schema quiz riêng cho 210 câu topic claude: 0 lỗi; `node scripts/build-light-index.js` + `node scripts/validate.js` → `OK — không có lỗi.` (lỗi `labs-incident.js` thoáng qua do agent khác đang ghi file, không thuộc task này).
