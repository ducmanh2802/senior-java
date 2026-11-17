/* CCAR-P pool 2 */
(window.QUIZ = window.QUIZ || []).push(
{ id: 'qz-ccap-161', topic: 'claude', q: '[Eval & Optimization] A support team wants to know whether a prompt change actually improved answer quality. They manually read 200 random outputs before and after. Which evaluation approach is most reliable for ongoing regression detection?', options: ['Continue manual review of 200 outputs each release', 'Build an automated eval set with labeled expected answers and run it in CI', 'Compare average response length before and after', 'Track only user thumbs-up/down counts'], answer: 1, explain: `**Tóm tắt:** Eval tự động với dữ liệu labeled trong CI phát hiện regression ổn định.

### Vì sao đáp án đúng
Manual review không scale. Eval set + CI chạy mỗi thay đổi prompt/model, đo metric định lượng.

### Vì sao từng phương án sai
- Manual: chậm, không deterministic.
- Response length: không tương quan chất lượng.
- Thumbs-up: tín hiệu thưa, trễ, bias.` },
{ id: 'qz-ccap-162', topic: 'claude', multi: true, q: '[Eval & Optimization] Which two metrics best indicate a regression after a prompt change? (Choose 2)', options: ['Average latency', 'Task success rate on golden set', 'Output token count', 'Format/schema compliance rate', 'Number of API calls'], answer: [1, 3], explain: `**Tóm tắt:** Task success rate và format compliance là hai chỉ số chất lượng trực tiếp.

### Vì sao đáp án đúng
Golden set đo correctness; schema compliance đo adherence. Cả hai tied to user value.

### Vì sao từng phương án sai
- Latency/token/call count là perf/cost, không phải chất lượng.` },
{ id: 'qz-ccap-163', topic: 'claude', q: '[Eval & Optimization] A team switches from Claude Opus to Sonnet to cut cost. Quality drops slightly on complex cases. Which approach best validates the trade-off before rollout?', options: ['Roll out to 100% users immediately and monitor complaints', 'Run a side-by-side eval on a representative golden set comparing both models', 'Ask developers which model feels better', 'Compare token prices only'], answer: 1, explain: `**Tóm tắt:** Side-by-side eval trên golden set đại diện.

### Vì sao đáp án đúng
Eval định lượng cho thấy delta theo task type, cho phép routing.

### Vì sao từng phương án sai
- Rollout toàn bộ: rủi ro lớn.
- Subjective: không đo được.
- Price only: bỏ qua quality.` },
{ id: 'qz-ccap-164', topic: 'claude', q: '[Eval & Optimization] A Claude app has 40% failure rate when extracting invoice fields. Most failures are malformed JSON. Which fix most directly improves reliability?', options: ['Increase temperature', 'Use tool use / structured outputs with a JSON schema', 'Add more examples to prompt only', 'Switch to a larger model'], answer: 1, explain: `**Tóm tắt:** Structured outputs/tool use ép schema, giảm malformed JSON.

### Vì sao đáp án đúng
Anthropic hỗ trợ tool use và structured outputs đảm bảo valid JSON theo schema.

### Vì sao từng phương án sai
- Temperature cao: tăng randomness.
- Examples only: cải thiện nhưng không guarantee.
- Larger model: cost cao, không giải quyết format.` },
{ id: 'qz-ccap-165', topic: 'claude', q: '[Eval & Optimization] A team observes 80% of requests complete under 2s but p99 is 12s. Which metric best indicates system performance under load?', options: ['Average latency', 'p99 latency', 'Median token count', 'Total requests per day'], answer: 1, explain: `**Tóm tắt:** p99 latency phản ánh tail behavior dưới tải.

### Vì sao đáp án đúng
Average che giấu tail; p99 là SLA-relevant.

### Vì sao từng phương án sai
- Average/median: che tail.
- Volume: không đo latency.` },
{ id: 'qz-ccap-166', topic: 'claude', q: '[Eval & Optimization] A company wants to implement prompt caching for frequently repeated system prompts. Which condition must hold for caching to be effective?', options: ['Prompts must be identical prefix bytes', 'Prompts must be short', 'Temperature must be 0', 'Model must be Haiku'], answer: 0, explain: `**Tóm tắt:** Prompt caching khớp prefix byte-for-byte.

### Vì sao đáp án đúng
Cache key dựa trên prefix token; chỉ phần prefix identical mới hit.

### Vì sao từng phương án sai
- Short: không bắt buộc.
- Temp 0: không liên quan.
- Haiku: mọi model hỗ trợ.` },
{ id: 'qz-ccap-167', topic: 'claude', q: '[Eval & Optimization] Which metric best shows whether Claude usage is efficient across departments?', options: ['Total spend', 'Cost per successful task', 'Number of users', 'Average prompt length'], answer: 1, explain: `**Tóm tắt:** Cost per successful task kết hợp chi phí và chất lượng.

### Vì sao đáp án đúng
Efficiency = output value / cost.

### Vì sao từng phương án sai
- Total spend: không normalize.
- Users/volume: không đo hiệu quả.
- Prompt length: proxy yếu.` },
{ id: 'qz-ccap-168', topic: 'claude', q: '[Eval & Optimization] A team wants to evaluate whether switching from Claude Opus to Haiku for classification is safe. What is the safest first step?', options: ['Switch production traffic fully', 'Build labeled eval set and compare accuracy/cost', 'Ask users to vote', 'Reduce max_tokens only'], answer: 1, explain: `**Tóm tắt:** Eval labeled so sánh accuracy/cost.

### Vì sao đáp án đúng
Classification thường Haiku đủ; eval xác nhận không regression.

### Vì sao từng phương án sai
- Full switch: rủi ro.
- User vote: chậm, bias.
- max_tokens: không liên quan accuracy.` },
{ id: 'qz-ccap-169', topic: 'claude', q: '[Eval & Optimization] A Claude-powered assistant has a 40% failure rate when users ask multi-step questions. Logs show the model loses track of sub-tasks. Which design change most directly helps?', options: ['Increase max_tokens', 'Decompose into an agent loop with explicit plan and tool use', 'Lower temperature to 0', 'Add more system prompt text'], answer: 1, explain: `**Tóm tắt:** Agent loop với plan/tool use giữ state và thực thi từng bước.

### Vì sao đáp án đúng
Multi-step cần orchestration; tool use + explicit plan giảm hallucination.

### Vì sao từng phương án sai
- max_tokens: không fix planning.
- Temp 0: determinism nhưng không planning.
- More prompt: có thể worsen.` },
{ id: 'qz-ccap-170', topic: 'claude', q: '[Eval & Optimization] Which metric best detects a regression in Claude response quality after a model upgrade?', options: ['API error rate', 'Golden-set task success rate', 'Average response time', 'Token price'], answer: 1, explain: `**Tóm tắt:** Golden-set success rate đo chất lượng end-to-end.

### Vì sao đáp án đúng
So sánh trước/sau trên cùng golden set phát hiện regression.

### Vì sao từng phương án sai
- Error rate/time/price không đo correctness.` },
{ id: 'qz-ccap-171', topic: 'claude', q: '[Eval & Optimization] A team wants to reduce cost without hurting quality. They notice 60% of requests are simple FAQ. Which approach is best?', options: ['Route simple FAQ to Haiku, complex to Sonnet/Opus', 'Use Opus for everything with caching', 'Disable evals to save money', 'Shorten all prompts blindly'], answer: 0, explain: `**Tóm tắt:** Model routing theo độ khó tối ưu cost/quality.

### Vì sao đáp án đúng
Router phân loại request; Haiku rẻ cho simple.

### Vì sao từng phương án sai
- Opus everything: cost cao.
- Disable evals: blind.
- Blind shorten: có thể giảm chất lượng.` },
{ id: 'qz-ccap-172', topic: 'claude', q: '[Eval & Optimization] A prompt returns inconsistent formats across runs. Temperature is 0.7. What is the most direct fix?', options: ['Lower temperature to 0', 'Use structured outputs / tool use', 'Add retry logic', 'Increase max_tokens'], answer: 1, explain: `**Tóm tắt:** Structured outputs enforce format regardless of sampling.

### Vì sao đáp án đúng
Temperature 0 giảm variance nhưng không guarantee schema; structured outputs guarantee.

### Vì sao từng phương án sai
- Temp 0: helpful but not sufficient.
- Retry: không fix format.
- max_tokens: indirect.` },
{ id: 'qz-ccap-173', topic: 'claude', q: '[Eval & Optimization] A Claude-powered assistant returns correct answers with citations but 30% of citations are hallucinated. Which evaluation should they add?', options: ['Measure citation faithfulness against source', 'Measure response length', 'Measure latency', 'Measure token cost'], answer: 0, explain: `**Tóm tắt:** Faithfulness eval kiểm tra citation đúng nguồn.

### Vì sao đáp án đúng
Groundedness metric so sánh claim với retrieved docs.

### Vì sao từng phương án sai
- Length/latency/cost không phát hiện hallucination citation.` },
{ id: 'qz-ccap-174', topic: 'claude', q: '[Eval & Optimization] A company wants to migrate from on-premise document storage to cloud for Claude RAG. Which consideration is most important for eval validity?', options: ['Keep retrieval quality benchmark constant', 'Change embedding model simultaneously', 'Remove all metadata', 'Disable caching'], answer: 0, explain: `**Tóm tắt:** Giữ benchmark retrieval để so sánh apples-to-apples.

### Vì sao đáp án đúng
Migration phải đo retrieval recall/precision trên cùng eval set.

### Vì sao từng phương án sai
- Change embedding: confound.
- Remove metadata: harmful.
- Disable cache: perf.` },
{ id: 'qz-ccap-175', topic: 'claude', q: '[Eval & Optimization] A team wants to measure Claude usage efficiency per department. Which metric is most informative?', options: ['Total API calls', 'Cost per successful business outcome', 'Average prompt tokens', 'Number of users'], answer: 1, explain: `**Tóm tắt:** Cost per successful outcome đo hiệu quả kinh doanh.

### Vì sao đáp án đúng
Normalize chi phí theo kết quả thực tế.

### Vì sao từng phương án sai
- Calls/tokens/users không phản ánh value.` },
{ id: 'qz-ccap-176', topic: 'claude', q: '[Governance & Risk] A financial services company must ensure Claude does not expose customer PII in outputs. Which control is most direct?', options: ['Rely on model refusal alone', 'Apply output filtering/redaction and data minimization in pipeline', 'Log all outputs only', 'Increase temperature'], answer: 1, explain: `**Tóm tắt:** Output filtering + data minimization là control trực tiếp.

### Vì sao đáp án đúng
Defense in depth: redact PII, minimize data sent, validate outputs.

### Vì sao từng phương án sai
- Model refusal alone: không đủ.
- Logging: detect không prevent.
- Temp: không liên quan.` },
{ id: 'qz-ccap-177', topic: 'claude', q: '[Governance & Risk] A healthcare provider uses Claude to summarize patient notes. Which practice most directly protects PHI?', options: ['Send full records always', 'De-identify/minimize data and enforce access controls', 'Use public endpoints', 'Disable audit logs'], answer: 1, explain: `**Tóm tắt:** De-identify + access controls bảo vệ PHI.

### Vì sao đáp án đúng
HIPAA-style: minimize PHI, RBAC, audit.

### Vì sao từng phương án sai
- Full records: overexposure.
- Public endpoints: risk.
- Disable logs: no accountability.` },
{ id: 'qz-ccap-178', topic: 'claude', multi: true, q: '[Governance & Risk] Which two defences best prevent prompt injection? (Choose 2)', options: ['Trust user input', 'Separate trusted instructions from untrusted data', 'Validate/allowlist tool calls', 'Increase temperature', 'Hide system prompt'], answer: [1, 2], explain: `**Tóm tắt:** Tách instruction/data và validate tool calls.

### Vì sao đáp án đúng
Prompt injection mitigation: clear delimiters, treat retrieved content as data, enforce tool allowlist.

### Vì sao từng phương án sai
- Trust input: unsafe.
- Temp: irrelevant.
- Hide prompt: security by obscurity.` },
{ id: 'qz-ccap-179', topic: 'claude', q: '[Governance & Risk] Which practice most directly reduces risk when using Claude with sensitive data?', options: ['Send all data to model', 'Data minimization and least privilege', 'Disable monitoring', 'Use shared API key'], answer: 1, explain: `**Tóm tắt:** Data minimization + least privilege.

### Vì sao đáp án đúng
Chỉ gửi cần thiết, key per tenant, RBAC.

### Vì sao từng phương án sai
- Send all: overexposure.
- Disable monitoring: blind.
- Shared key: no accountability.` },
{ id: 'qz-ccap-180', topic: 'claude', q: '[Governance & Risk] A system must prevent Claude from following hidden instructions in retrieved documents. Which approach is best?', options: ['Put documents in system prompt', 'Treat retrieved content as untrusted data with clear delimiters and instruction hierarchy', 'Remove retrieval', 'Use larger model'], answer: 1, explain: `**Tóm tắt:** Delimiters + instruction hierarchy.

### Vì sao đáp án đúng
Mark content as data, system instructions take precedence.

### Vì sao từng phương án sai
- System prompt docs: injection risk.
- Remove retrieval: defeats purpose.
- Larger model: not fix.` },
{ id: 'qz-ccap-181', topic: 'claude', q: '[Governance & Risk] Which information is most essential to log for Claude interactions in a regulated industry?', options: ['User passwords', 'Request/response metadata, model version, timestamps, decisions', 'Full PII always', 'Raw API keys'], answer: 1, explain: `**Tóm tắt:** Metadata + model version + decisions cho audit.

### Vì sao đáp án đúng
Auditability needs who/when/what/model/decision without unnecessary PII.

### Vì sao từng phương án sai
- Passwords/keys: never.
- Full PII: violates minimization.` },
{ id: 'qz-ccap-182', topic: 'claude', q: '[Governance & Risk] A financial regulation requires all Claude interactions be auditable. Which practice best ensures auditability?', options: ['No logging', 'Immutable audit logs with retention and access controls', 'Client-side only logs', 'Verbal summaries'], answer: 1, explain: `**Tóm tắt:** Immutable audit logs + retention + access controls.

### Vì sao đáp án đúng
Tamper-evident, retained, RBAC.

### Vì sao từng phương án sai
- No logs: non-compliant.
- Client-only: tamperable.
- Verbal: not auditable.` },
{ id: 'qz-ccap-183', topic: 'claude', q: '[Governance & Risk] An assistant must not reveal internal document content even when asked directly. Which control helps most?', options: ['Ask model politely', 'Output policy + grounding + refusal training + filters', 'Hide docs in prompt', 'Increase temperature'], answer: 1, explain: `**Tóm tắt:** Policy + grounding + filters.

### Vì sao đáp án đúng
Layered: system policy, grounding to allowed content, output filters.

### Vì sao từng phương án sai
- Polite ask: weak.
- Hide: obscurity.
- Temp: irrelevant.` },
{ id: 'qz-ccap-184', topic: 'claude', q: '[Governance & Risk] Which practice best ensures data minimisation when using Claude?', options: ['Send entire database', 'Send only fields needed for the task', 'Cache all data in prompt', 'Log full payloads'], answer: 1, explain: `**Tóm tắt:** Chỉ gửi field cần thiết.

### Vì sao đáp án đúng
Data minimization principle.

### Vì sao từng phương án sai
- Entire DB/cache all/full payloads: overexposure.` },
{ id: 'qz-ccap-185', topic: 'claude', q: '[Governance & Risk] Which practice most reduces risk when using Claude with sensitive customer data?', options: ['Use shared tenant key', 'Tenant isolation, encryption, and least-privilege access', 'Disable evals', 'Store data in prompt'], answer: 1, explain: `**Tóm tắt:** Tenant isolation + encryption + least privilege.

### Vì sao đáp án đúng
Multi-tenant safety.

### Vì sao từng phương án sai
- Shared key: no accountability.
- Disable evals: blind.
- Store in prompt: leak.` },
{ id: 'qz-ccap-186', topic: 'claude', q: '[Governance & Risk] A system must ensure Claude interactions are auditable and reproducible. Which practice is essential?', options: ['No versioning', 'Version prompts/models and log inputs/outputs', 'Use random seeds', 'Manual only'], answer: 1, explain: `**Tóm tắt:** Versioning + logging.

### Vì sao đáp án đúng
Reproducibility needs prompt/model version and I/O logs.

### Vì sao từng phương án sai
- No versioning/random/manual: non-reproducible.` },
{ id: 'qz-ccap-187', topic: 'claude', q: '[Governance & Risk] Which practice best protects against prompt injection in RAG?', options: ['Concatenate docs into system prompt', 'Delimit retrieved docs as data and enforce tool allowlists', 'Trust retrieved content', 'Remove citations'], answer: 1, explain: `**Tóm tắt:** Delimit as data + tool allowlists.

### Vì sao đáp án đúng
Injection defense in RAG.

### Vì sao từng phương án sai
- Concatenate/trust: injection risk.
- Remove citations: less transparency.` },
{ id: 'qz-ccap-188', topic: 'claude', q: '[Governance & Risk] A company wants to prevent Claude from being used to generate harmful content. Which layer is most appropriate?', options: ['Rely on user honesty', 'Safety filters + policy + monitoring + human review for high-risk', 'Disable logging', 'Longer prompts only'], answer: 1, explain: `**Tóm tắt:** Layered safety.

### Vì sao đáp án đúng
Defense in depth.

### Vì sao từng phương án sai
- User honesty: weak.
- Others: not safety.` },
{ id: 'qz-ccap-189', topic: 'claude', q: '[Governance & Risk] Which practice most directly reduces risk of data leakage across tenants in a multi-tenant Claude app?', options: ['Shared prompt cache across tenants', 'Per-tenant keys, isolation, and no cross-tenant context', 'Global system prompt with all tenants data', 'Disable auth'], answer: 1, explain: `**Tóm tắt:** Per-tenant isolation.

### Vì sao đáp án đúng
Prevent cross-tenant contamination.

### Vì sao từng phương án sai
- Shared cache/global prompt/disable auth: leakage risk.` },
{ id: 'qz-ccap-190', topic: 'claude', q: '[Governance & Risk] A healthcare AI assistant must prevent PHI from being sent to non-compliant regions. Which control is most direct?', options: ['Use any region', 'Region pinning and data residency controls', 'Disable encryption', 'Log PHI in plaintext'], answer: 1, explain: `**Tóm tắt:** Region pinning + data residency.

### Vì sao đáp án đúng
Compliance with data residency.

### Vì sao từng phương án sai
- Any region/disable encryption/log plaintext: non-compliant.` }
);
