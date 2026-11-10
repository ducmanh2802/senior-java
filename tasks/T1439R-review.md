# T1439R — Fact-check nội dung mới của T1439

Status: TODO
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1439 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `english-071`: không lỗi kiến thức; chỉ là format lại markup (bỏ phần "Full sample answer / Vocabulary / Delivery tips" lặp lại, thêm glossary các cụm từ, làm rõ lỗi người Việt). Đã giữ nguyên nội dung kỹ thuật.
- `english-072`: không lỗi kiến thức.
- `english-080`: không lỗi kiến thức.
- `english-081`: không lỗi kiến thức.
- `english-082`: không lỗi kiến thức.
- `english-083`: không lỗi kiến thức.
- `english-084`: không lỗi kiến thức.
- `english-085`: không lỗi kiến thức.
- `english-086`: không lỗi kiến thức.
- `english-087`: không lỗi kiến thức.
- `english-088`: không lỗi kiến thức.
- `english-089`: không lỗi kiến thức.
- `english-090`: không lỗi kiến thức.
- `english-091`: không lỗi kiến thức.
- `english-092`: không lỗi kiến thức.
- `english-093`: không lỗi kiến thức.
- `english-094`: không lỗi kiến thức.
- `english-095`: không lỗi kiến thức.
- `english-096`: không lỗi kiến thức.
- `english-097`: không lỗi kiến thức.
- `english-098`: không lỗi kiến thức.
- `english-099`: không lỗi kiến thức.
- `english-100`: không lỗi kiến thức.
- Sửa lỗi markup: 4 dòng `~~~seq` vượt quá giới hạn 60 ký tự/text mỗi bước (AGENTS.md mục 5) — đã rút ngắn:
  - `english-090`: "Ghi buc no va buc co trong 1 transaction" → "Ghi no/co trong 1 transaction"
  - `english-092`: "Callback tung lenh, khop reference" → "Callback tung lenh, khop ref"; "Khong thay callback -> goi status API" → "Khong thay callback -> goi status API"
  - `english-092`: note "Cuoi ngay doi soat file vs ledger, phat hien lech" → "Doi soat file vs ledger, phat hien lech"
  - `english-090`: note "Lenh treo qua dem -> doi soat hang ngay phat hien" → "Lenh treo qua dem -> doi soat ngay"
- Sửa lỗi định dạng: 2 object bị mất thụt lề (`id: 'english-072'`, `id: 'english-085'` ở cột 0) — đã restore lại 2-space indent để đồng bộ file.
- Không có backtick, `${`, ký tự foreign, HTML thô nào trong phần新增.

Status: DONE
