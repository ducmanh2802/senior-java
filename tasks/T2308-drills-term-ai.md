# T2308 — 20 thẻ thuật ngữ tiếng Anh về LLM/AI integration

Status: DONE
Agent: kilo
Owns: `js/data/drills-term.js`
After: T2276

Đã thêm 20 thẻ drill-term (theme tech) vào js/data/drills-term.js, id drill-term-221..drill-term-240 (trước: 001..220, sau: 001..240).
Terms từ danh sách đã có sẵn nên bỏ: token (040), context window (195), latency (014), throughput (013), embedding (182), vector (189), retrieval (183), rerank (trùng reranking 193), hallucination (184), grounding (194), inference (181), schema (012), idempotency key (050), exponential backoff (trùng backoff 046), deterministic (017).
20 thẻ mới: tokenizer, fine-tuning, prompt injection, guardrail, rate limit, LLM, RAG, system prompt, few-shot, zero-shot, chain-of-thought, temperature, top-p, vector database, tool calling, quantization, RLHF, foundation model, perplexity, KV cache.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa mục cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Đếm id trước/sau trong Notes (phải tăng đúng số đã thêm) — lần trước có task ghi đã thêm mà file không đổi.

## Nghiệm thu
`node --check js/data/drills-term.js` → OK. `node scripts/build-light-index.js` → OK (sinh lại index-light.js). `node scripts/validate.js` → không báo lỗi nào về drills-term.js (các lỗi còn lại là của sdlc.js, labs-thread.js, lessons-claude.js do agent khác sở hữu, không đụng).

## Notes
ID drill-term tăng từ 220 → 240 (+20). Không backtick, không `${`, id duy nhất drill-term-NNN, theme tech.
