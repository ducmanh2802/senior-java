# T2128 — Phỏng vấn AI giọng nói: seeds từ bộ câu lõi

Status: DONE
Agent: claude
Owns: `js/views/interview.js`, `css/views/interview.css`
After: T2122

## Bối cảnh
Người học có 6 tháng ôn phỏng vấn Senior Java, ngân hàng ~2000 câu là quá nhiều; trọng tâm là bộ ~400 câu lõi (tag 'core'). App phải tự dẫn người học ôn đúng thứ cần ôn.

## Việc cần làm
1. Trong js/views/interview.js, chỗ dựng `seeds` (khoảng dòng 295–302): thêm lựa chọn **"Bốc từ bộ câu lõi"** (mặc định bật khi có ≥ 12 câu core). Khi bật, seeds ưu tiên câu có tag 'core' trong các chủ đề đã chọn, ưu tiên câu chưa thuộc/cần ôn; vẫn ≤ 12 seeds, `ref` vẫn là đoạn **Tóm tắt:** ≤ 600 ký tự như AGENTS.md mục 11.
2. Thêm 2 preset focus: "Senior Java – Ngân hàng" và "Senior Java – Outsource/Product" (giống T2127) điền sẵn chủ đề + focus text.
3. Không đổi giao thức gọi `App.ai.interview.turn/summary`. Không gọi AI khi chưa bấm bắt đầu.
4. Bỏ qua file js/views/interview_new.js (file lạ, không thuộc task).

## Luật
- Đọc AGENTS.md mục 2, 3, 7 (và 9, 11 nếu đụng AI/phỏng vấn). Không framework, classic script, escape mọi dữ liệu bằng App.esc(). Chuỗi UI thêm vào cả bảng i18n 'vi' và 'en' ở đầu file view (theo mẫu có sẵn).
- Danh sách id câu lõi: `(window.DATA_INDEX && window.DATA_INDEX.core) || []` (sinh từ tag 'core', các task T2115–T2122 đang gắn). Khi danh sách rỗng, mọi tính năng mới phải tự ẩn hoặc hiện `.empty` thân thiện, không lỗi.
- KHÔNG sửa js/core/*, css/base.css, index.html, scripts/*. Cần thì ghi đề xuất vào Notes. CSS mới bắt đầu bằng `.view-<view>`, chỉ dùng biến màu, responsive 360px.
- Không gọi AI tự động. Không mở trình duyệt. Không commit.

## Nghiệm thu
`node --check` các file đã sửa; `node scripts/validate.js` → `OK — không có lỗi.` Xong: `Status: DONE`, Notes mô tả thay đổi.

## Notes
- 2026-11-15 Claude: preset chips bank/product (focus text riêng), checkbox ⭐ Bốc từ bộ câu lõi (auto bật khi ≥ 12 câu lõi), pickSeeds(preferCore). Không đổi giao thức AI. File chuẩn hoá CRLF→LF.
