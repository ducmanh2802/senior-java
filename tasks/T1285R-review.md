# T1285R — Fact-check nội dung mới của T1285

Status: DONE
Agent: opencode
Owns: `js/data/q-claude.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1285 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa các lỗi kỹ thuật trong các câu hỏi mới (claude-013 đến claude-042):

1. **claude-015 (refusal/fallback)**: Xoá tham chiếu model "Fable 5.1" không tồn tại (chỉ còn Opus 5.5, Sonnet 5.5).
2. **claude-011 (model selection)**: Xoá "Fable 5.1" khỏi danh sách 4 tầng model, thay bằng "Opus 5.5 (high/xhigh effort)"; sửa analogy "chuyên gia đầu ngành (Fable)" thành "chuyên gia đầu ngành (Opus effort cao)"; xoá tag "Fable".
3. **claude-017 (migration)**: Xoá "Fable 5.1" khỏi danh sách breaking changes và bảng thay đổi (chỉ còn Opus 5.5, Sonnet 5.5).
4. **claude-022 (agent stop conditions)**: Xoá "Fable 5.1" khỏi danh sách model không có context awareness.
5. **claude-027 (tool_choice)**: Xoá "Fable 5.1" khỏi các dòng "không hỗ trợ trên..." và xoá "Mythos 5.1"; bổ sung lại các chi tiết docs bị xoá khi sửa (cache miss, disable_parallel_tool_use position).
6. **claude-028 (parallel tool use)**: Xoá "Fable 5.1" khỏi bảng bật/tắt song song.
7. **claude-040 (debugging)**: Xoá "Fable 5.1" khỏi 2 chỗ liệt kê model không hỗ trợ any/tool.
8. **claude-018 (enterprise knowledge)**: Thay ví dụ "Samsung" thành "tập đoàn lớn (ví dụ quy mô hàng chục nghìn nhân viên...)" — tránh tên công ty thật.
9. **claude-019 (Agent Skills)**: Làm rõ Skill là tính năng của **Claude Code** và **ứng dụng Claude**, không phải Messages API.
10. **claude-020 (enterprise architecture)**: Sửa "Microsoft Foundry" thành "Azure AI Foundry" (tên chính xác của nền tảng Microsoft).
11. **claude-031 (prefill migration)**: Sửa "Claude 4.6" thành "Claude 4 (Opus 4, Sonnet 4)" — prefill bị xoá từ dòng model 4.
12. **claude-014 (vision/PDF)**: Xoá ghi chú sai "(100 trang với model context 200K)" — giới hạn PDF là 600 trang/32 MB cho mọi model hiện hành.
13. **Kiểm tra chung**: Không có backtick hay `${` trong template literal; markup `{{}}` dùng đúng; Senior tip có mặt ở mọi câu hỏi; Ví dụ đời thực chi tiết có số liệu.