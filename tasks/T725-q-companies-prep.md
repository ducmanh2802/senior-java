# T725 — 6 câu "chuẩn bị phỏng vấn theo loại công ty" (bank / product / outsourcing)

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`
After: T722

Nguồn: `docs/research/voz-interview-reviews.md` và `docs/research/voz-salary-posts.md`, cùng `js/data/companies.js`. Thêm 6 câu topic `behavioral` (đọc topic để không trùng, kể cả câu T722): khác biệt phỏng vấn ở ngân hàng / fintech / big tech / outsourcing Nhật / outsourcing Âu-Mỹ / startup; cách chuẩn bị 2 tuần cho từng loại; cách hỏi recruiter về quy trình, range lương, onsite/remote; cách so sánh 2 offer (tổng thu nhập năm, tháng 13, bonus, ESOP, bảo hiểm, OT, học hỏi). Không đưa số lương cụ thể chưa kiểm chứng — dùng "theo chia sẻ trên voz 2025–2026, khoảng…" chỉ khi ≥ 3 bài cùng mức và ghi refs.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-soft.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-soft.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes

Đã thêm 6 câu topic `behavioral` vào `js/data/q-soft.js`, id tiếp nối từ behavioral-038:
- behavioral-039 (senior): khác biệt phỏng vấn ngân hàng / fintech / big tech / outsourcing Nhật / outsourcing Âu-Mỹ / startup và cách chọn loại phù hợp.
- behavioral-040 (senior): kế hoạch ôn tập 14 ngày theo từng loại công ty, kèm lịch ví dụ chi tiết.
- behavioral-041 (mid): câu hỏi nhờ recruiter về quy trình, range lương, onsite/remote; cách nhận diện công ty nghiêm túc.
- behavioral-042 (senior): so sánh 2 offer — tổng thu nhập năm, tháng 13, bonus, ESOP, bảo hiểm, OT, học hỏi; bảng so sánh và mức walk-away.
- behavioral-043 (senior): outsourcing Nhật vs outsourcing Âu-Mỹ — hợp đồng, tiếng nước ngoài, múi giờ, rủi ro hợp đồng.
- behavioral-044 (mid): startup — cơ hội học hỏi, rủi ro, ESOP (vesting/cliff/liquidity event), OT, câu hỏi hỏi founder.

Số ký tự đáp án: 039=4392, 040=4373, 041=4118, 042=3839, 043=3674, 044=3763 (trong khoảng 2500–4500).
Tổng id trong file: 70 (64 cũ + 6 mới), không trùng id, không sửa object cũ.
Chạy: node --check js/data/q-soft.js OK; node scripts/build-light-index.js OK; node scripts/validate.js → OK — không có lỗi. Không commit.Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
