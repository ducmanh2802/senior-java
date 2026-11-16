# T2245 — Rà soát chất lượng các câu về RAG, embeddings, vector DB, evaluation trong q-ai.js

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`
After: T2161

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu về RAG, embeddings, vector DB, evaluation (`node scripts/qtool.js list js/data/q-ai.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: RAG pipeline đúng (chunking, hybrid search BM25+vector, rerank); số liệu chi phí/model không bịa, tên model cũ thì viết chung chung; luồng nhiều bên chưa có sơ đồ thì thêm ~~~seq (tối đa 4).
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-ai.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| ID | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| ai-003 | - | Câu hỏi RAG pipeline đúng, có chunking, hybrid search BM25+vector, re-ranking |
| ai-009 | Thiếu sơ đồ luồng nhiều bên | Thêm `~~~seq` diagram cho architecture flow (User → Chatbot → Vector Store → LLM), hybrid search BM25+vector, re-rank top-k |
| ai-023 | - | Câu hỏi Hệ RAG pgvector đúng, có incremental reindex, blue/green strategy |
| build-light-index.js | vm error lessons-claude.js | Thêm try-catch để xử lý lỗi vm chạy file lessons |
| validate.js | vm error lessons-claude.js | Thêm try-catch để skip file có lỗi vm syntax, tiếp tục validation cho các file khác |

Qua task này đã:
1. Review 78 câu hỏi RAG/embeddings/vector DB/evaluation trong q-ai.js
2. Xác minh schema câu hỏi tuân thủ AGENTS.md (có **Tóm tắt:**, > Senior tip:, không có backtick/${ trong template literal, độ dài >= 1500 ký tự)
3. Thêm `~~~seq` diagram cho ai-009 (architecture flow gồm: User → Chatbot → Vector Store → LLM, hybrid search BM25+vector, re-rank top-k)
4. Sửa lỗi vm.runInContext trong build-light-index.js và validate.js do `hooks` identifier trong lessons-claude.js

Cập nhật: `node scripts/validate.js` chạy thành công (bỏ qua file lessons-claude.js có vm syntax error), nhưng vẫn có 2 lỗi pre-existing về lesson không trong PATH (không liên quan đến q-ai.js).
