# T1581 — AI agent: 8 câu hỏi thiết kế ứng dụng LLM (8)

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`

Thêm **8 câu hỏi phỏng vấn mới** (topic: ai) vào `js/data/q-ai.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-ai.js`); đọc danh sách để **không trùng ý**.

Chủ đề: kiến trúc tổng thể một ứng dụng LLM production (gateway, prompt store, retrieval, guardrail, eval, observability), sync request vs job bất đồng bộ cho tác vụ dài, multi-tenant và cách ly dữ liệu trong RAG, cập nhật knowledge base gần thời gian thực, đo chất lượng câu trả lời online (feedback, sampling), A/B test model, giảm chi phí khi lưu lượng tăng 10 lần, tuân thủ dữ liệu (lưu log prompt, xoá theo yêu cầu).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-ai.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-ai.js logs/tmp-T1581.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

Da them 8 cau hoi moi (topic: ai) vao js/data/q-ai.js, id ke tiep id lon nhat cua topic (ai-094): ai-095 (kien truc tong he ung dung LLM production: gateway, prompt store, retrieval, guardrail, eval, observability, senior), ai-096 (goi dong bo vs job bat dong bo cho tac vu dai, senior), ai-097 (multi-tenant va cach ly du lieu trong RAG, senior), ai-098 (cap nhat knowledge base gan thoi gian thuc, senior), ai-099 (do chat luong tra loi online: feedback, sampling, senior), ai-100 (A/B test model, lead), ai-101 (giam chi phi khi luu luong tang 10 lan, senior), ai-102 (tu thuan du lieu: luu log prompt, xoa theo yeu cau, lead).

Moi cau du theo AGENTS.md muc 4-6: **Tom tat**, co cau tung buoc va vi sao, code Java minh hoa hoac so do ~~~seq (ai-095), bang doi doi, loi hay gap trong production, ### Vi du doi thuc co so lieu, ### Tra loi mau khi pham van, > Senior tip, follow 2-3 cau. Level chu anh senior, 2 cau lead (ai-100, ai-102). Khong sua cau hoi cu, khong sua file khac.

Da chay node scripts/qtool.js append de them vao q-ai.js. Da chay node scripts/build-light-index.js (sinh lai js/data/index-light.js) va node scripts/qtool.js check js/data/q-ai.js -> OK cho q-ai.js. node scripts/validate.js bao loi chi o lessons-concurrency.js / lessons-db.js / lessons-jpa.js (file khong thuoc task nay, khong sua theo luat 3 AGENTS.md); nhom integrate can sua cac file do de validate toan bo chay OK.
Reviewed-by: kilo (T1581R)
