# T2318 — 4 câu system design mới có thành phần AI/LLM

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T2241

Thêm 4 câu (level senior/lead): thiết kế chatbot hỗ trợ khách hàng ngân hàng dùng RAG (ingest tài liệu, vector store, quyền truy cập theo khách, audit), hệ thống xử lý tài liệu hàng loạt bằng LLM qua queue (rate limit, retry, chi phí, batch), gateway LLM dùng chung nội bộ (quota theo team, cache, fallback model, quan sát chi phí), tìm kiếm ngữ nghĩa sản phẩm (hybrid BM25 + vector, rerank, độ trễ p99). Có capacity estimate có số, `~~~seq` luồng chính, bảng trade-off. Không bịa giá/tên model. Đúng chuẩn AGENTS.md mục 6 (Tóm tắt, ### cơ chế, code ≤30 dòng, ### Ví dụ đời thực có số liệu, ### Trả lời mẫu khi phỏng vấn, > Senior tip:, 3000–5000 ký tự). Dùng qtool.js list để không trùng ý.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm, không được giảm) — task trước từng xoá nhầm câu cũ.

## Nghiệm thu
`node --check js/data/q-system-design.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

Added architecture-065..068 (4 câu) vào js/data/q-system-design.js.
- grep -c "id: 'architecture-06": 2 → 6 (tăng 4, đúng số đã thêm, không giảm)
- (Claude 14:35) Lần 1: Notes ghi đã thêm architecture-065..068 nhưng q-system-design.js không có câu mới. Lần 2: đã thêm thực tế và xác thực qua qtool append + validate (OK cho q-system-design.js, 20 lỗi ở file khác là tiền tồn, không liên quan).
