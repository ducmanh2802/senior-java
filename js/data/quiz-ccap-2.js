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
- Any region/disable encryption/log plaintext: non-compliant.` },
{ id: 'qz-ccap-191', topic: 'claude', q: '[Stakeholder & Lifecycle] A project team is planning a Claude-based solution for internal document search. Who should be primarily involved in defining the "success" criteria?', options: ['Developer team only', 'Business stakeholders, end users, and architects', 'Legal team only', 'IT operations only'], answer: 1, explain: `**Tóm tắt:** Business stakeholders, end users, và kiến trúc sư cần cùng định nghĩa thành công.

### Vì sao đáp án đúng
Sự thành công của dự án công nghệ phụ thuộc vào nhu cầu thực tế của người dùng, mục tiêu của doanh nghiệp và tính khả thi về kiến trúc.

### Vì sao từng phương án sai
- Chỉ Dev hoặc chỉ một bộ phận sẽ thiếu cái nhìn toàn diện về value và risk.` },
{ id: 'qz-ccap-192', topic: 'claude', q: '[Stakeholder & Lifecycle] During the design phase, the architect needs to balance system latency and response quality. What is the best way to handle this stakeholder trade-off?', options: ['Make the choice without consulting stakeholders', 'Document options, impact, and consult business stakeholders on preferences', 'Always prioritize latency', 'Always prioritize quality'], answer: 1, explain: `**Tóm tắt:** Tài liệu hóa các lựa chọn và consult stakeholders để quyết định.

### Vì sao đáp án đúng
Kiến trúc sư đóng vai trò cố vấn (advisor) và stakeholder đóng vai trò quyết định dựa trên ưu tiên kinh doanh.

### Vì sao từng phương án sai
- Tự quyết hoặc cực đoan (luôn ưu tiên 1 cái) sẽ không tối ưu cho mục tiêu kinh doanh cụ thể.` },
{ id: 'qz-ccap-193', topic: 'claude', multi: true, q: '[Stakeholder & Lifecycle] Which activities are critical during the "Design" stage of the AI lifecycle? (Choose 2)', options: ['User training', 'Defining API schema and data flows', 'Selecting models and orchestration strategy', 'Marketing the product', 'Monitoring costs'], answer: [1, 2], explain: `**Tóm tắt:** Định nghĩa API/Data flow và chọn Model/Orchestration.

### Vì sao đáp án đúng
Đây là các hoạt động cốt lõi của giai đoạn thiết kế để đảm bảo hệ thống chạy đúng và hiệu quả.

### Vì sao từng phương án sai
- User training và Marketing thuộc giai đoạn triển khai; Monitoring thuộc giai đoạn vận hành.` },
{ id: 'qz-ccap-194', topic: 'claude', q: '[Stakeholder & Lifecycle] A project is entering the "Testing" phase. What is the most important stakeholder engagement activity?', options: ['Planning the marketing campaign', 'Reviewing system performance against golden sets', 'Deciding on future development team hiring', 'Setting budget for next year'], answer: 1, explain: `**Tóm tắt:** Kiểm tra hiệu năng hệ thống dựa trên tập golden set.

### Vì sao đáp án đúng
Testing là để xác nhận độ chính xác và chất lượng, cần sự tham gia của các bên liên quan để đánh giá kết quả thực tế.

### Vì sao từng phương án sai
- Các hoạt động còn lại không trực tiếp phục vụ mục tiêu đảm bảo chất lượng của phase testing.` },
{ id: 'qz-ccap-195', topic: 'claude', q: '[Stakeholder & Lifecycle] What is a key responsibility of stakeholders during the "Deployment" phase of a Claude application?', options: ['Developing new features', 'Monitoring and verifying live performance and impact', 'Writing code', 'Selecting the model'], answer: 1, explain: `**Tóm tắt:** Theo dõi và xác thực hiệu năng thực tế.

### Vì sao đáp án đúng
Giai đoạn triển khai cần stakeholders theo dõi xem hệ thống có đáp ứng kỳ vọng kinh doanh không.

### Vì sao từng phương án sai
- Dev/Model selection đã xong trước đó.` },
{ id: 'qz-ccap-196', topic: 'claude', q: '[Stakeholder & Lifecycle] How should a team handle feedback from stakeholders *after* a production incident?', options: ['Ignore it', 'Conduct a Blameless Post-Mortem, share findings, and define preventive actions', 'Blame the developers', 'Stop the project'], answer: 1, explain: `**Tóm tắt:** Post-mortem không đổ lỗi, rút kinh nghiệm.

### Vì sao đáp án đúng
Đây là quy trình chuẩn để cải thiện hệ thống, tránh lặp lại lỗi, và tăng cường niềm tin.

### Vì sao từng phương án sai
- Bỏ qua, đổ lỗi, hay dừng dự án đều làm giảm chất lượng hệ thống và văn hóa đội ngũ.` },
{ id: 'qz-ccap-197', topic: 'claude', multi: true, q: '[Stakeholder & Lifecycle] Which are the main benefits of "Stakeholder Alignment" in a Claude project? (Choose 2)', options: ['Reduces project scope', 'Ensures shared understanding of goals and trade-offs', 'Increases project cost', 'Better handles expectation management during failures'], answer: [1, 3], explain: `**Tóm tắt:** Đảm bảo hiểu chung về mục tiêu/đánh đổi và quản lý kỳ vọng.

### Vì sao đáp án đúng
Alignment giúp mọi người hiểu hệ thống có thể làm gì/không thể làm gì, tránh kỳ vọng ảo.

### Vì sao từng phương án sai
- Alignment không làm giảm scope hay tăng cost; nó làm dự án hiệu quả hơn.` },
{ id: 'qz-ccap-198', topic: 'claude', q: '[Stakeholder & Lifecycle] During "Lifecycle Management", why is it important to define "success metrics" early?', options: ['Because Anthropic requires it', 'To ensure objective evaluation and stakeholder consensus on value', 'To limit developers\' work', 'To make the project faster'], answer: 1, explain: `**Tóm tắt:** Để đánh giá khách quan và đồng thuận về giá trị.

### Vì sao đáp án đúng
Không có metric rõ ràng, dự án dễ bị hiểu lầm về giá trị và không có căn cứ đánh giá.

### Vì sao từng phương án sai
- Các lý do khác không phản ánh đúng vai trò quản trị dự án.` },
{ id: 'qz-ccap-199', topic: 'claude', q: '[Stakeholder & Lifecycle] A project is in the "Maintenance" phase. What is the most critical activity for stakeholders?', options: ['Reworking the entire UI', 'Continuously evaluating performance and updating prompts/models', 'Changing the team entirely', 'None'], answer: 1, explain: `**Tóm tắt:** Đánh giá hiệu năng và cập nhật liên tục.

### Vì sao đáp án đúng
Môi trường thay đổi, dữ liệu thay đổi, mô hình thay đổi, nên Maintenance cần sự cải tiến liên tục.

### Vì sao từng phương án sai
- Các lựa chọn khác gây lãng phí hoặc làm gián đoạn dự án.` },
{ id: 'qz-ccap-200', topic: 'claude', q: '[Stakeholder & Lifecycle] Why should stakeholders be involved in "Cost-Benefit Analysis" of using Claude versus other models?', options: ['They should not be', 'To make an informed decision based on budget, quality, and performance requirements', 'To make it harder for devs', 'To choose the cheapest option always'], answer: 1, explain: `**Tóm tắt:** Quyết định dựa trên budget, chất lượng và hiệu năng.

### Vì sao đáp án đúng
Business cần hiểu trade-off giữa giá và chất lượng cho các use case cụ thể.

### Vì sao từng phương án sai
- Stakeholder luôn cần tham gia vào các quyết định tài chính quan trọng.` },
{ id: 'qz-ccap-201', topic: 'claude', multi: true, q: '[Stakeholder & Lifecycle] Which documents are typically used to communicate with stakeholders in the Claude project lifecycle? (Choose 2)', options: ['Code files', 'Project status reports/Architecture decision records (ADRs)', 'Deployment logs', 'Meeting notes only'], answer: [1, 3], explain: `**Tóm tắt:** Báo cáo trạng thái và tài liệu kiến trúc.

### Vì sao đáp án đúng
ADRs ghi lại các quyết định thiết kế, status reports cập nhật tiến độ.

### Vì sao từng phương án sai
- Code file/logs không phù hợp để giao tiếp ở mức quản lý/kinh doanh.` },
{ id: 'qz-ccap-202', topic: 'claude', q: '[Stakeholder & Lifecycle] When a model update is released by Anthropic, what should stakeholders do?', options: ['Ignore it', 'Assess the impact on the current system and decide whether to upgrade', 'Upgrade immediately without testing', 'Downgrade to a older model'], answer: 1, explain: `**Tóm tắt:** Đánh giá ảnh hưởng và quyết định nâng cấp.

### Vì sao đáp án đúng
Nâng cấp luôn có rủi ro, cần đánh giá tác động trước khi quyết định.

### Vì sao từng phương án sai
- Bỏ qua, nâng cấp ẩu, hay hạ cấp đều không phải là hành động quản lý rủi ro tốt.` },
{ id: 'qz-ccap-203', topic: 'claude', q: '[Stakeholder & Lifecycle] What is a key benefit of having a "Human-in-the-loop" (HITL) for high-stakes stakeholder decisions?', options: ['It slows down the project', 'It adds a layer of safety and validation for critical decisions', 'It costs too much', 'It is not necessary'], answer: 1, explain: `**Tóm tắt:** Tăng cường an toàn và xác thực cho quyết định quan trọng.

### Vì sao đáp án đúng
HITL đảm bảo có sự kiểm tra của con người với các quyết định ảnh hưởng đến business hoặc người dùng cuối.

### Vì sao từng phương án sai
- Dù có thể chậm/đắt, nhưng sự an toàn là mục tiêu tối thượng.` },
{ id: 'qz-ccap-204', topic: 'claude', q: '[Stakeholder & Lifecycle] When managing expectations for an AI product, what is a key pitfall?', options: ['Transparency about limitations', 'Promising 100% accuracy', 'Providing regular updates', 'Listening to user feedback'], answer: 1, explain: `**Tóm tắt:** Hứa hẹn độ chính xác tuyệt đối.

### Vì sao đáp án đúng
AI luôn có xác suất lỗi, hứa 100% sẽ dẫn đến mất niềm tin khi hệ thống xảy ra sự cố.

### Vì sao từng phương án sai
- Minh bạch, cập nhật, lắng nghe là thực hành tốt.` },
{ id: 'qz-ccap-205', topic: 'claude', q: '[Stakeholder & Lifecycle] How does "Governance" differ from "Operations" in the Claude project?', options: ['Governance is only for lawyers', 'Governance defines policies/standards; Operations executes them', 'Operations defines the policy', 'They are the same'], answer: 1, explain: `**Tóm tắt:** Governance định nghĩa, Operations thực thi.

### Vì sao đáp án đúng
Governance đảm bảo hướng đi đúng đắn, Ops đảm bảo vận hành ổn định theo hướng đó.

### Vì sao từng phương án sai
- Governance không chỉ cho luật sư, nó là khung quản lý cho toàn dự án.` },
{ id: 'qz-ccap-206', topic: 'claude', q: '[Models & Context] What is the effect of a large "Context Window" in Claude?', options: ['Increases latency always', 'Allows more information to be processed at once', 'Decreases model intelligence', 'Makes the model slower to load'], answer: 1, explain: `**Tóm tắt:** Xử lý nhiều thông tin hơn trong một lượt.

### Vì sao đáp án đúng
Context window lớn cho phép Claude giữ được nhiều tài liệu/hướng dẫn hơn trong bộ nhớ tạm khi xử lý.

### Vì sao từng phương án sai
- Latency có thể tăng nhưng không phải "luôn luôn", nó không làm giảm trí thông minh.` },
{ id: 'qz-ccap-207', topic: 'claude', q: '[Models & Context] What happens if a prompt exceeds the model\'s maximum context window?', options: ['The model will answer correctly', 'It will automatically reduce context', 'The API will return an error', 'The model will magically work'], answer: 2, explain: `**Tóm tắt:** API trả về lỗi vượt hạn mức.

### Vì sao đáp án đúng
Model không thể xử lý dữ liệu nằm ngoài cửa sổ ngữ cảnh, hệ thống sẽ chặn request.

### Vì sao từng phương án sai
- Model không thể tự động rút gọn hay hoạt động "ma thuật" được.` },
{ id: 'qz-ccap-208', topic: 'claude', multi: true, q: '[Models & Context] Which factors influence Claude\'s "latency"? (Choose 2)', options: ['The number of output tokens requested', 'The color of the UI', 'Input prompt complexity and size', 'The temperature parameter'], answer: [0, 2], explain: `**Tóm tắt:** Số token output và độ phức tạp/kích thước input.

### Vì sao đáp án đúng
Claude mất thời gian suy luận (input) và thời gian sinh token (output).

### Vì sao từng phương án sai
- Màu UI là frontend, không liên quan latency API; Temperature ảnh hưởng sự đa dạng, không ảnh hưởng trực tiếp latency.` },
{ id: 'qz-ccap-209', topic: 'claude', q: '[Models & Context] What is the primary purpose of "System Prompt"?', options: ['To generate content', 'To provide persistent instructions and behavior to the model', 'To store user chat history', 'To set temperature'], answer: 1, explain: `**Tóm tắt:** Cung cấp hướng dẫn và hành vi cố định.

### Vì sao đáp án đúng
System prompt là nơi định nghĩa vai trò, phong cách, và luật lệ mà Claude phải tuân theo xuyên suốt cuộc hội thoại.

### Vì sao từng phương án sai
- Generate là mục đích chính của completion, system prompt là hướng dẫn.` },
{ id: 'qz-ccap-210', topic: 'claude', q: '[Models & Context] How can you reduce the "cost" of Claude API calls?', options: ['Increase prompt length', 'Use larger models for all tasks', 'Use smaller models for simple tasks and prompt caching for frequent prompts', 'Use Opus for everything'], answer: 2, explain: `**Tóm tắt:** Dùng model nhỏ cho tác vụ đơn giản và cache prompt.

### Vì sao đáp án đúng
Tối ưu hóa mô hình theo độ phức tạp tác vụ và tận dụng cache giúp giảm chi phí đáng kể.

### Vì sao từng phương án sai
- Prompt dài hay dùng Opus cho mọi thứ chỉ làm tăng chi phí.` },
{ id: 'qz-ccap-211', topic: 'claude', q: '[Models & Context] What does "Temperature" represent in a Claude call?', options: ['Latency', 'Randomness of outputs', 'Total cost', 'Number of output tokens'], answer: 1, explain: `**Tóm tắt:** Sự ngẫu nhiên của đầu ra.

### Vì sao đáp án đúng
Temp 0 là deterministic (luôn giống nhau), temp cao làm Claude sáng tạo và thay đổi hơn.

### Vì sao từng phương án sai
- Các yếu tố khác không liên quan đến sampling.` },
{ id: 'qz-ccap-212', topic: 'claude', multi: true, q: '[Models & Context] Which Claude models are available in the current ecosystem? (Choose 2)', options: ['Opus', 'Sonnet', 'GPT-4', 'Llama-3'], answer: [0, 1], explain: `**Tóm tắt:** Opus và Sonnet là các mô hình chính.

### Vì sao đáp án đúng
Opus và Sonnet là các phiên bản nổi bật của gia đình Claude 3/3.5.

### Vì sao từng phương án sai
- GPT-4 (OpenAI) và Llama-3 (Meta) không phải của Anthropic.` },
{ id: 'qz-ccap-213', topic: 'claude', q: '[Models & Context] What is "Prompt Caching"?', options: ['A way to increase latency', 'A way to store frequent input prefixes to reduce cost and latency', 'A method to delete user data', 'A way to increase model accuracy'], answer: 1, explain: `**Tóm tắt:** Lưu trữ prefix đầu vào thường gặp để giảm cost/latency.

### Vì sao đáp án đúng
Caching giúp tránh việc xử lý lại những phần input dài giống nhau, tiết kiệm thời gian và tài nguyên.

### Vì sao từng phương án sai
- Cache nhằm giảm latency chứ không tăng.` },
{ id: 'qz-ccap-214', topic: 'claude', q: '[Models & Context] Why use "Structured Outputs" or "Tool Use" in Claude?', options: ['To make the output slower', 'To ensure deterministic JSON format for programmatic handling', 'To make it harder to read', 'To use more tokens'], answer: 1, explain: `**Tóm tắt:** Đảm bảo format JSON nhất quán để xử lý lập trình.

### Vì sao đáp án đúng
Dữ liệu đầu ra cần được parser xử lý, format nhất quán là bắt buộc.

### Vì sao từng phương án sai
- Mục tiêu là hiệu quả chứ không phải chậm hay khó đọc.` },
{ id: 'qz-ccap-215', topic: 'claude', q: '[Models & Context] What does "Context Window" size limitation actually mean?', options: ['The model will delete oldest messages', 'The API will stop working', 'The limit of combined input and output tokens', 'The model will get smarter'], answer: 2, explain: `**Tóm tắt:** Hạn mức tổng cộng của input và output tokens.

### Vì sao đáp án đúng
Claude cần tài nguyên để giữ cả input (prompt+docs) và output (response) trong cửa sổ này.

### Vì sao từng phương án sai
- Nó không tự xóa lịch sử và không làm model thông minh hơn.` },
{ id: 'qz-ccap-216', topic: 'claude', q: '[Models & Context] How can Claude support "Vision" tasks?', options: ['By only text input', 'By processing image inputs alongside text prompts', 'By only audio input', 'It cannot'], answer: 1, explain: `**Tóm tắt:** Xử lý đầu vào hình ảnh cùng prompt văn bản.

### Vì sao đáp án đúng
Claude 3 và 3.5 hỗ trợ phân tích hình ảnh (docs, charts, photos).

### Vì sao từng phương án sai
- Các phương án còn lại không đúng khả năng của model.` },
{ id: 'qz-ccap-217', topic: 'claude', multi: true, q: '[Models & Context] Which of the following are good practices for "Prompt Engineering"? (Choose 2)', options: ['Give ambiguous instructions', 'Provide specific examples (Few-shot)', 'Be extremely concise', 'Clearly define the role/persona'], answer: [1, 3], explain: `**Tóm tắt:** Few-shot examples và định nghĩa rõ persona.

### Vì sao đáp án đúng
Ví dụ giúp model hiểu pattern; persona giúp model định hình phong cách phản hồi.

### Vì sao từng phương án sai
- Hướng dẫn mơ hồ làm giảm độ chính xác.` },
{ id: 'qz-ccap-218', topic: 'claude', q: '[Models & Context] What happens when Claude "refuses" a request?', options: ['It always means it is wrong', 'The safety filters triggered because the request violated policies', 'The API is down', 'It is testing you'], answer: 1, explain: `**Tóm tắt:** Bộ lọc an toàn đã kích hoạt.

### Vì sao đáp án đúng
Anthropic có chính sách an toàn để tránh generate nội dung nguy hiểm/độc hại.

### Vì sao từng phương án sai
- Refusal không có nghĩa là model ngu, nó là rào cản an toàn.` },
{ id: 'qz-ccap-219', topic: 'claude', q: '[Models & Context] When is "Opus" model preferred over "Sonnet"?', options: ['For simple tasks', 'For highly complex reasoning and tasks requiring high precision', 'For cheapest cost', 'For highest latency'], answer: 1, explain: `**Tóm tắt:** Cho suy luận cực phức tạp và độ chính xác cao.

### Vì sao đáp án đúng
Opus là mô hình mạnh nhất, giỏi nhất trong việc xử lý logic khó.

### Vì sao từng phương án sai
- Sonnet cân bằng tốt hơn về tốc độ và chi phí cho các tác vụ trung bình/thông thường.` },
{ id: 'qz-ccap-220', topic: 'claude', q: '[Models & Context] What is "Pre-fill" in API terms for Claude?', options: ['Ignoring the prompt', 'Providing a partial response that Claude starts from', 'Deleting user prompts', 'Randomizing the output'], answer: 1, explain: `**Tóm tắt:** Cung cấp câu trả lời một phần để Claude tiếp tục.

### Vì sao đáp án đúng
Pre-fill ép Claude bắt đầu câu trả lời bằng một định dạng/nội dung cụ thể mà bạn mong muốn.

### Vì sao từng phương án sai
- Các phương án còn lại sai định nghĩa.` },
{ id: 'qz-ccap-221', topic: 'claude', q: '[Enterprise Integration] A legal team builds a Claude feature that drafts page-long contract summaries which take up to forty seconds to generate. Users complain the page looks frozen because nothing appears until the whole answer is ready. Which change best improves perceived performance?', options: ['Raise the browser timeout to sixty seconds so the page stops looking frozen', 'Stream the response and render text as tokens arrive, with a clear error state if the stream breaks midway', 'Switch to the smallest model so every answer returns in five seconds', 'Generate each paragraph synchronously and only show the page after all paragraphs finish'], answer: 1, explain: `**Tóm tắt:** Streaming (trả lời theo dòng) cho người dùng thấy chữ hiện ra ngay khi model sinh, thay vì chờ 40 giây trước màn hình trắng.

### Vì sao đáp án đúng
**Streaming** là chế độ API gửi từng phần câu trả lời ngay khi token được sinh, giống như xem video trực tuyến thay vì tải hết file rồi mới phát. Với tóm tắt dài, người đọc thấy tiêu đề và câu đầu xuất hiện sau một hai giây, cảm giác "đang chạy" thay vì "treo". Quan trọng không kém: khi stream đứt giữa đường, client phải biết để báo lỗi và cho thử lại, chứ không hiển thị nửa câu như thể đã xong.

### Vì sao từng phương án sai
- **Nâng timeout lên 60 giây:** chỉ trì hoãn việc bỏ cuộc, người dùng vẫn nhìn màn hình trắng suốt 40 giây; proxy hay load balancer vẫn có thể cắt kết nối.
- **Đổi sang model nhỏ nhất:** câu trả lời nhanh hơn nhưng có thể kém chính xác trên hợp đồng phức tạp, tức đánh đổi chất lượng không cần thiết.
- **Sinh từng đoạn đồng bộ rồi mới hiện:** vẫn là một khối chờ 40 giây, không cải thiện cảm nhận tốc độ.

### Khái niệm cần nhớ
**Perceived performance (hiệu năng cảm nhận)** là tốc độ mà người dùng *cảm thấy*, không phải tốc độ xử lý thực. **Token** là đơn vị văn bản nhỏ (khoảng một phần tư đến một từ) mà model sinh ra và tính phí. **Stream** là gửi từng token/đoạn nhỏ liên tục.

### Ví dụ cụ thể
Bật streaming: sau 1.8 giây chữ "Điều 1. Phạm vi công việc..." bắt đầu hiện; tổng 40 giây nhưng người dùng đọc được ngay. Nếu stream lỗi ở giây thứ 10, client hiện "Kết nối bị ngắt, bấm thử lại" thay vì để lại nửa bản tóm tắt.

> Mẹo phỏng vấn: nói cả hai vế — streaming để nhanh cảm nhận, và xử lý lỗi giữa stream để không bao giờ hiện kết quả dở dang như đã hoàn tất.` },
{ id: 'qz-ccap-222', topic: 'claude', q: '[Enterprise Integration] A bank already runs its workloads on AWS. It needs consolidated billing under one AWS account, IAM-based access control, and private networking to reach Claude models without going through the public internet. Which integration path fits best?', options: ['Call the Anthropic API directly from a new server and manage a separate contract and API key', 'Use Claude models through Amazon Bedrock in the same AWS account and region', 'Download the Claude model weights and run them on the bank own EC2 instances', 'Use Claude Code with a developer API key on each engineer laptop'], answer: 1, explain: `**Tóm tắt:** Chạy Claude qua Amazon Bedrock trong cùng tài khoản AWS để dùng IAM, billing hợp nhất và mạng riêng.

### Vì sao đáp án đúng
Claude được cung cấp cho doanh nghiệp qua các nền tảng cloud lớn như Amazon Bedrock và Google Vertex AI, ngoài API trực tiếp của Anthropic. Khi chọn Bedrock, ngân hàng dùng đúng cơ chế sẵn có: **IAM** (hệ thống phân quyền của AWS, ví dụ chỉ cho phép một vai trò cụ thể gọi model), **billing hợp nhất** (mọi chi phí gộp vào một hóa đơn AWS), và **VPC/private networking** (kết nối riêng, không đi ra internet công khai). Đây là lý do nhiều doanh nghiệp lớn chọn con đường này.

### Vì sao từng phương án sai
- **Gọi API trực tiếp rồi quản lý hợp đồng và key riêng:** tạo thêm một quan hệ nhà cung cấp, một hệ thống định danh và một luồng thanh toán tách biệt, đi ngược yêu cầu hợp nhất của ngân hàng.
- **Tải trọng số model về chạy trên EC2:** các model Claude là dịch vụ được quản lý, không phát hành trọng số để tải về; không thể tự chạy trên máy chủ của bạn.
- **Dùng Claude Code với key của từng kỹ sư:** Claude Code là công cụ dòng lệnh cho lập trình, không phải kênh xử lý dữ liệu có kiểm soát tập trung, không có audit hay phân quyền doanh nghiệp.

### Khái niệm cần nhớ
**Bedrock** là dịch vụ của AWS cho phép gọi nhiều model (gồm Claude) qua API AWS. **IAM** là hệ thống phân quyền theo vai trò và chính sách. **Private networking (VPC)** giúp lưu lượng không đi qua internet công cộng.

### Ví dụ cụ thể
Một yêu cầu từ dịch vụ nội bộ đi tới Bedrock trong cùng region, dùng vai trò IAM của dịch vụ đó, chi phí hiện trên hóa đơn AWS cuối tháng. Không có API key Anthropic nào nằm rải rác trong repo.

> Mẹo phỏng vấn: khi ngân hàng nói "không cho dữ liệu ra ngoài", câu trả lời đúng thường là chọn đúng hạ tầng (Bedrock/Vertex, region, mạng riêng), không phải hứa trong prompt.` },
{ id: 'qz-ccap-223', topic: 'claude', q: '[Enterprise Integration] An order service uses Claude to classify incoming purchase orders, then writes a row to the database and calls an external payment API. A network timeout right after the model call sometimes makes the whole handler retry, creating duplicate orders. What is the most appropriate fix?', options: ['Remove the retry so a request can never run twice', 'Attach an idempotency key derived from the order id, persist it before any side effect, and reuse it on every retry', 'Raise the timeout to one hour so the model always finishes before a retry happens', 'Call the payment API before the model so a retry cannot double-charge'], answer: 1, explain: `**Tóm tắt:** Dùng idempotency key (khoá chống trùng) để lần thử lại không tạo thêm đơn.

### Vì sao đáp án đúng
**Idempotency (tính bất biến khi lặp)** nghĩa là gọi cùng một yêu cầu nhiều lần vẫn cho kết quả như gọi một lần. Cách làm: sinh một khoá duy nhất từ mã đơn hàng, ghi khoá đó vào một bảng/bộ nhớ trước khi thực hiện tác dụng phụ (ghi DB, gọi thanh toán). Khi retry, hệ thống thấy khoá đã tồn tại nên trả về kết quả cũ thay vì xử lý lại. Đây là chuẩn trong mọi hệ thống có tác dụng phụ.

### Vì sao từng phương án sai
- **Bỏ retry:** một timeout mạng thoáng qua sẽ làm mất đơn hợp lệ; retry là cần thiết, chỉ cần làm cho nó an toàn.
- **Nâng timeout lên một giờ:** không loại bỏ khả năng timeout; chỉ hoãn, và giữ kết nối/tài nguyên lâu hơn.
- **Gọi thanh toán trước model:** vẫn phải xử lý trường hợp model lỗi sau khi đã thu tiền; không giải quyết trùng lặp, chỉ đổi thứ tự rủi ro.

### Khái niệm cần nhớ
**Side effect (tác dụng phụ)** là thay đổi bên ngoài như ghi cơ sở dữ liệu hay gọi API. **Retry (thử lại)** là gửi lại yêu cầu sau lỗi tạm thời. **Idempotency key (khoá chống trùng)** là mã duy nhất đi kèm yêu cầu để server nhận ra đây là lần lặp.

### Ví dụ cụ thể
Đơn A123 gọi model lúc 10:00, timeout sau khi model xong nhưng trước khi ghi DB. Handler retry cùng khoá A123; server thấy đã ghi lúc 10:00 nên không ghi thêm. Kết quả: đúng một đơn, đúng một lần gọi thanh toán.

> Mẹo phỏng vấn: "retry an toàn" = "retry cộng idempotency"; thiếu một trong hai là nguồn gây trùng lặp kinh điển.` },
{ id: 'qz-ccap-224', topic: 'claude', q: '[Enterprise Integration] Anthropic announces that a Claude model version the company depends on will be retired in six months. The model id is hard-coded in dozens of services. Which strategy best prepares for the migration?', options: ['Wait until the retirement date and then fix whichever service breaks first', 'Centralise model selection in the internal gateway, pin versions there, and re-run the eval suite on the replacement before switching traffic', 'Copy the old model id into a config file inside each service so it is easy to find later', 'Switch every service to the largest available model immediately so the old one is unused'], answer: 1, explain: `**Tóm tắt:** Gom việc chọn model về một nơi (gateway), ghim phiên bản ở đó, và chạy eval trước khi đổi.

### Vì sao đáp án đúng
Khi model id bị hard-code rải rác, mỗi lần đổi model là hàng chục lần sửa, dễ sót và không kiểm soát được chất lượng. Gom về một lớp chung (internal gateway) cho phép đổi model ở đúng một chỗ. "Ghim phiên bản" (pin) là cố định một phiên bản cụ thể thay vì dùng "mới nhất" trôi nổi, để hành vi không tự đổi. Trước khi chuyển, chạy bộ eval trên model thay thế để chắc chắn không có regression.

### Vì sao từng phương án sai
- **Chờ tới ngày khai tử rồi sửa service nào hỏng trước:** bị động, có thể gián đoạn dịch vụ, và không có thời gian đánh giá chất lượng.
- **Copy id vào config từng service:** vẫn phân tán, vẫn phải sửa nhiều nơi; không phải tập trung.
- **Đổi hết sang model lớn nhất ngay:** tốn kém, chậm hơn, và chưa chắc phù hợp cho các tác vụ đơn giản; đây là phản ứng thái quá.

### Khái niệm cần nhớ
**Model retirement (khai tử model)** là thời điểm nhà cung cấp ngừng phục vụ một phiên bản cũ. **Pin (ghim)** là cố định phiên bản để hành vi ổn định. **Eval suite (bộ đánh giá)** là tập câu kiểm thử chất lượng chạy trước mọi thay đổi.

### Ví dụ cụ thể
Gateway giữ cấu hình model cho từng loại tác vụ. Khi model cũ sắp khai tử, đội chỉ đổi cấu hình ở gateway, chạy eval so sánh, thấy điểm tương đương, rồi bật cho 5% traffic trước, sau đó mở rộng.

> Mẹo phỏng vấn: nhắc "model là dependency có ngày hết hạn" và "phiên bản phải được ghim và kiểm chứng, không mặc định cài mới nhất".` },
{ id: 'qz-ccap-225', topic: 'claude', multi: true, q: '[Enterprise Integration] A product runs on Claude through one cloud provider. During a regional outage the provider returns 503 for several minutes, and the business requires the assistant to keep working. Which two design choices best provide continuity? (Choose 2)', options: ['Route through a provider abstraction that can fail over to a second provider or region and degrade gracefully, then fail back after health checks pass', 'Retry the same provider continuously for thirty minutes before giving up', 'Serve a static apology page whenever the provider is unavailable', 'Cache frequent answers where correct and safe, so a subset of traffic survives a short outage', 'Store every prompt and answer in the browser so no network is needed'], answer: [0, 3], explain: `**Tóm tắt:** Failover có kiểm soát (chuyển dự phòng) cộng cache có chọn lọc để một phần lưu lượng vẫn được phục vụ.

### Vì sao đáp án đúng
**Failover** là tự động chuyển sang nhà cung cấp hoặc region dự phòng khi chính gặp sự cố; đi kèm **graceful degradation** (giảm chất lượng có kiểm soát) như tóm tắt ngắn hơn thay vì lỗi. **Failback** là quay lại khi health check báo đã ổn. **Cache (bộ nhớ đệm)** lưu câu trả lời đúng cho các câu hỏi lặp lại, nên khi provider sập vẫn phục vụ được phần phổ biến. Hai lớp này cộng lại giúp hệ thống "vẫn trả lời" thay vì "chết".

### Vì sao các phương án còn lại sai
- **Retry cùng provider suốt 30 phút:** nếu sự cố kéo dài, request treo vô hạn; người dùng bỏ đi.
- **Trang xin lỗi tĩnh:** không phục vụ ai; chỉ là cách bỏ cuộc tử tế.
- **Đưa mọi prompt và answer vào browser:** không khả thi cho dữ liệu lớn và tạo rủi ro lộ dữ liệu; client không phải nơi chứa sự thật.

### Khái niệm cần nhớ
**Failover (chuyển dự phòng)** là chuyển sang thành phần dự phòng. **Failback (quay lại)** là trở về thành phần chính sau khi nó hồi phục. **Degrade (giảm cấp)** là chấp nhận kết quả kém hơn một chút để vẫn có kết quả. **Health check (kiểm tra sức khoẻ)** là lệnh dò xem dịch vụ còn sống không.

### Ví dụ cụ thể
Provider chính trả 503 liên tục; sau 3 lần backoff, gateway chuyển sang provider dự phòng cho các tác vụ quan trọng; câu hỏi FAQ lặp lại được trả từ cache. Khi health check của provider chính xanh lại, traffic tự quay về.

> Mẹo phỏng vấn: nhấn mạnh failover phải tự động và có ngưỡng, còn fallback phải được ghi log để biết hệ thống đang chạy ở chế độ nào.` },
{ id: 'qz-ccap-226', topic: 'claude', q: '[Enterprise Integration] A request flows through an API gateway, an orchestration service, and several Claude calls. When one answer turns out wrong, engineers cannot tell which call or prompt produced it. What should the platform add?', options: ['Log only the final answer text so the logs stay small', 'Propagate a trace id across all services and record it with every Claude request, its prompt version and model, so the whole path can be reconstructed', 'Disable logging in the orchestration layer to reduce noise', 'Store all prompts in a spreadsheet updated weekly'], answer: 1, explain: `**Tóm tắt:** Lan truyền một trace id xuyên suốt và gắn nó vào mọi lần gọi Claude để dựng lại toàn bộ đường đi.

### Vì sao đáp án đúng
**Distributed tracing (truy vết phân tán)** là gán một mã duy nhất (trace id) cho một yêu cầu và giữ mã đó qua mọi dịch vụ nó đi qua. Khi có sự cố, bạn lọc theo trace id để thấy: request đi qua gateway nào, orchestration quyết định gì, gọi model nào, dùng prompt phiên bản nào, mất bao lâu. Đây là cách duy nhất để quy trách nhiệm và tái hiện lỗi khi hệ thống có nhiều bước.

### Vì sao từng phương án sai
- **Chỉ log câu trả lời cuối:** mất toàn bộ ngữ cảnh trung gian; không biết prompt hay model nào gây ra.
- **Tắt log ở orchestration:** làm mù đúng chỗ cần soi; không giải quyết vấn đề.
- **Để prompt trong spreadsheet cập nhật hàng tuần:** không khớp với request thực tế, không truy vết được theo thời gian thực.

### Khái niệm cần nhớ
**Trace id (mã truy vết)** là định danh duy nhất theo từng yêu cầu. **Span** là một bước con trong trace (ví dụ một lần gọi model). **Prompt version (phiên bản prompt)** là nhãn phiên bản để biết chính xác prompt nào đã chạy.

### Ví dụ cụ thể
Một câu trả lời sai được báo; kỹ sư dán trace id vào hệ thống, thấy request đi qua orchestration v3, gọi model Sonnet với prompt phiên bản 12. Họ so sánh prompt 12 với 11 và tìm ra chỗ sai.

> Mẹo phỏng vấn: nói "một yêu cầu = một trace id, gắn vào mọi lời gọi", vì đó là điều tách biệt hệ thống debug được và không debug được.` },
{ id: 'qz-ccap-227', topic: 'claude', q: '[Enterprise Integration] A company builds a Claude assistant over internal documents that have per-folder access permissions. Some folders are confidential and must never be shown to unauthorised staff. What is the correct place to enforce who can see which document?', options: ['In the system prompt: instruct the model never to reveal confidential folders', 'In the retrieval layer: filter candidate documents by the caller permissions before they ever reach the model', 'In the browser: hide confidential links from the interface', 'After generation: scan the answer for confidential keywords and redact them'], answer: 1, explain: `**Tóm tắt:** Lọc theo phân quyền ngay ở bước truy xuất, trước khi tài liệu kịp đến model.

### Vì sao đáp án đúng
Nếu tài liệu mật bị đưa vào ngữ cảnh model, nó đã "rời khỏi" vùng an toàn: model có thể nhắc, tóm tắt, hay bị prompt injection dụ lộ. Cách đúng là **retrieval-time filtering**: khi tìm tài liệu liên quan, chỉ lấy những tài liệu mà người gọi có quyền đọc. Model không bao giờ nhìn thấy nội dung không được phép, nên không có gì để lộ.

### Vì sao từng phương án sai
- **Dặn model trong system prompt:** prompt là chỉ dẫn mềm, có thể bị lừa hoặc hiểu sai; không phải cơ chế phân quyền cưỡng chế.
- **Ẩn link ở browser:** chỉ che giao diện; nội dung vẫn tồn tại và có thể lộ qua API hoặc chia sẻ link.
- **Lọc từ khoá sau khi sinh:** không đầy đủ (phân loại theo từ khoá bỏ sót cách diễn đạt khác), và hậu quả (đã lộ cho model) đã xảy ra.

### Khái niệm cần nhớ
**Retrieval (truy xuất)** là bước lấy tài liệu liên quan trước khi đưa cho model. **ACL (access control list)** là danh sách quyền ai đọc được gì. **Prompt injection** là kỹ thuật dùng nội dung độc hại để điều khiển model.

### Ví dụ cụ thể
Nhân viên bán hàng hỏi về chính sách giá. Hệ thống chỉ truy xuất trong thư mục "sales" mà người đó có quyền, bỏ qua thư mục "finance". Kết quả không thể chứa thông tin từ thư mục finance, kể cả khi câu hỏi cố tình gài bẫy.

> Mẹo phỏng vấn: "phân quyền nằm ở lớp truy xuất của bạn, không nằm trong prompt" — đây là nguyên tắc số một khi làm RAG doanh nghiệp.` },
{ id: 'qz-ccap-228', topic: 'claude', multi: true, q: '[Enterprise Integration] A global SaaS serves users in the US, EU, and Singapore through one Claude integration. EU users see high p95 latency, and EU law requires their data to stay inside the EU. Which two architecture changes best address both problems? (Choose 2)', options: ['Deploy a regional integration in the EU region for EU users, keeping their data in the EU', 'Add a router that sends each user to the nearest compliant region', 'Route all traffic through a single US integration to simplify operations', 'Strip names from EU requests and send them to any region'], answer: [0, 1], explain: `**Tóm tắt:** Triển khai theo vùng (regional) và định tuyến tới vùng gần nhất, giữ dữ liệu EU trong EU.

### Vì sao đáp án đúng
**Regional deployment (triển khai theo vùng)** đặt các instance ở nhiều vùng địa lý; người dùng EU đi tới vùng EU nên độ trễ thấp và dữ liệu ở lại EU. **Router (bộ định tuyến)** chọn vùng dựa trên vị trí người dùng, đảm bảo vừa nhanh vừa đúng luật. Hai thay đổi này giải quyết đồng thời latency và data residency (yêu cầu dữ liệu phải nằm trong vùng).

### Vì sao các phương án còn lại sai
- **Dồn tất cả về một tích hợp ở Mỹ:** người dùng EU vừa chậm hơn vừa vi phạm quy định lưu trú dữ liệu.
- **Bỏ tên rồi gửi đi bất kỳ đâu:** ẩn tên không loại bỏ toàn bộ dữ liệu cá nhân (mã hồ sơ, ngày tháng, mã số); không chứng minh được với cơ quan quản lý, và không cải thiện độ trễ.

### Khái niệm cần nhớ
**p95 latency (độ trễ phân vị 95)** là ngưỡng mà 95% yêu cầu nhanh hơn; phần còn lại chậm hơn. **Data residency (lưu trú dữ liệu)** là yêu cầu dữ liệu phải được lưu/xử lý trong một vùng cụ thể. **Region (vùng)** là cụm máy chủ đặt tại một địa điểm địa lý.

### Ví dụ cụ thể
EU users đi tới endpoint EU (p95 giảm từ 12s xuống 3s), US users tới endpoint US, Singapore users tới endpoint gần nhất. Dữ liệu EU chỉ nằm trong tài khoản EU.

> Mẹo phỏng vấn: khi luật và tốc độ xung đột, đừng chọn "chỉ một vùng cho tất cả"; hãy nói tới kiến trúc đa vùng có định tuyến.` },
{ id: 'qz-ccap-229', topic: 'claude', q: '[Enterprise Integration] A company stores long-lived Claude API keys in an environment variable and rotates them manually once a year. Two keys leaked last quarter. Which change most reduces the impact of a future leak?', options: ['Keep one key but make the string much longer', 'Store keys in a secret manager, issue short-lived scoped credentials per service, and rotate them automatically on a schedule', 'Write the keys in the README so everyone knows where to find and protect them', 'Share one key across all teams so there is only one thing to rotate'], answer: 1, explain: `**Tóm tắt:** Quản lý key bằng secret manager, cấp credential ngắn hạn theo phạm vi, và tự động xoay vòng.

### Vì sao đáp án đúng
Ba lớp phòng thủ: (1) **secret manager** lưu key tập trung, phân quyền và audit ai đọc; (2) **scoped credentials (credential theo phạm vi)** giới hạn mỗi service chỉ làm được việc của nó; (3) **short-lived + auto-rotation (ngắn hạn và tự xoay)** khiến key lộ cũng nhanh hết hiệu lực. Một key bị lộ chỉ ảnh hưởng một phạm vi nhỏ trong thời gian ngắn.

### Vì sao từng phương án sai
- **Key dài hơn:** độ dài không ngăn lộ; key lộ vẫn dùng được cho tới khi bị thu hồi.
- **Ghi key vào README:** công khai key cho mọi người; đây là phản tác dụng.
- **Chia sẻ một key cho mọi team:** một lần lộ là lộ toàn bộ; không phân biệt được ai làm gì, không thu hồi cục bộ được.

### Khái niệm cần nhớ
**Secret manager (kho quản lý bí mật)** là dịch vụ lưu và cấp secret có kiểm soát. **Scoped (theo phạm vi)** là giới hạn quyền. **Rotation (xoay vòng)** là thay key định kỳ và khi nghi lộ. **Least privilege (quyền tối thiểu)** là chỉ cấp quyền vừa đủ.

### Ví dụ cụ thể
Mỗi service có một credential riêng, tự hết hạn sau 24 giờ và tự gia hạn. Khi một key lộ, đội chỉ thu hồi đúng credential đó; các service khác không bị ảnh hưởng và không phải sửa gì.

> Mẹo phỏng vấn: nếu key đã từng nằm trong git history, coi như đã lộ — phải thu hồi, không chỉ xoá dòng code.` },
{ id: 'qz-ccap-230', topic: 'claude', multi: true, q: '[Enterprise Integration] A Claude-backed search endpoint serves five thousand requests per second at peak. The provider rate limit is nearly exceeded during flash crowds. Which two patterns best protect the platform while keeping most users served? (Choose 2)', options: ['Load shedding with a bounded queue and priority: serve cached or degraded results to low-priority traffic and return a busy state above the limit', 'A token-bucket limiter at the gateway to smooth bursts before they reach the provider', 'An unbounded queue that waits until the provider finally accepts every request', 'Double the retry count for every request during the crowd'], answer: [0, 1], explain: `**Tóm tắt:** Load shedding (rơi tải) có hàng đợi giới hạn và ưu tiên, cộng bộ giới hạn token-bucket để san bằng đột biến.

### Vì sao đáp án đúng
**Load shedding (rơi tải có kiểm soát)** là chủ động từ chối bớt một phần lưu lượng khi quá tải, giữ hệ thống sống cho phần còn lại. **Bounded queue (hàng đợi có giới hạn)** ngăn bộ nhớ bị chiếm vô hạn. **Priority (ưu tiên)** đảm bảo request quan trọng được phục vụ trước. **Token-bucket (kho token)** là thuật toán giới hạn tốc độ cho phép "bầu" một lượng request rồi rò rỉ đều, giúp mượt đột biến trước khi chạm provider.

### Vì sao các phương án còn lại sai
- **Hàng đợi không giới hạn:** khi đám đông kéo tới, hàng đợi phình vô hạn, tràn bộ nhớ, và mọi request đều chậm; đây là "retry storm" (bão thử lại).
- **Nhân đôi số lần retry:** mỗi lần retry lại tạo thêm request trong lúc provider đã quá tải, làm mọi thứ tệ hơn.

### Khái niệm cần nhớ
**Load shedding (rơi tải)** là chủ động bỏ bớt tải để giữ ổn định. **Token bucket** là thuật toán giới hạn tốc độ. **Flash crowd (đám đông đột biến)** là lượng truy cập tăng vọt trong thời gian ngắn. **Bounded (có giới hạn)** nghĩa là có trần cứng.

### Ví dụ cụ thể
Đám đông tăng gấp 3 lần trong 30 giây. Gateway nhận 5000 req/s nhưng chỉ cho 4000 qua token bucket; 1000 request thấp ưu tiên nhận kết quả từ cache hoặc thông báo "hệ thống bận, thử lại sau", còn request quan trọng vẫn được xử lý.

> Mẹo phỏng vấn: nhấn mạnh "có trần" và "có ưu tiên" — hàng đợi vô hạn là quả bom nổ chậm trong giờ cao điểm.` },
{ id: 'qz-ccap-231', topic: 'claude', q: '[Enterprise Integration] Ten product teams call the internal Claude gateway. The platform team wants to change the request schema, adding fields and renaming parameters. What is the safest way to evolve the contract without breaking teams?', options: ['Change the schema in place and tell all teams to update the same day', 'Version the gateway API, add fields additively, run old and new versions in parallel, and deprecate on a documented timeline', 'Delete the old fields immediately so there is only one schema to maintain', 'Freeze the API forever so it never has to change'], answer: 1, explain: `**Tóm tắt:** Version hoá API, thêm field theo kiểu cộng thêm, chạy song song, và khai tử có lộ trình.

### Vì sao đáp án đúng
**Versioning (đánh phiên bản)** cho phép client cũ và mới cùng tồn tại (ví dụ /v1 và /v2). **Additive change (thay đổi cộng thêm)** là chỉ thêm field mới, không xoá/đổi cái cũ, nên client chưa nâng cấp vẫn chạy. **Parallel run (chạy song song)** cho teams chuyển dần. **Deprecation timeline (lộ trình khai tử)** báo trước ngày bỏ version cũ, có thời gian chuẩn bị.

### Vì sao từng phương án sai
- **Đổi tại chỗ và bảo cập nhật trong một ngày:** chắc chắn làm gãy các team chưa kịp sửa; không tôn trọng hợp đồng.
- **Xoá field cũ ngay:** client cũ mất dữ liệu, lỗi runtime.
- **Đóng băng API vĩnh viễn:** không tiến hoá được; mọi nhu cầu mới bị chặn.

### Khái niệm cần nhớ
**API contract (hợp đồng API)** là cam kết về đầu vào/đầu ra giữa các bên. **Versioning (đánh phiên bản)** là đánh số phiên bản để nhiều phiên bản cùng chạy. **Deprecation (khai tử)** là báo trước và loại bỏ dần phiên bản cũ.

### Ví dụ cụ thể
Gateway mở /v2 với field mới; /v1 vẫn chạy 6 tháng. Teams chuyển dần; khi 95% qua /v2, đội gửi thông báo cuối rồi tắt /v1 vào ngày đã công bố.

> Mẹo phỏng vấn: "thêm thì dễ, đổi thì khó" — luôn thêm field mới và đánh phiên bản, đừng sửa hợp đồng đang chạy.` },
{ id: 'qz-ccap-232', topic: 'claude', multi: true, q: '[Enterprise Integration] A healthcare company legal team asks whether Claude can be used without retaining prompts and outputs for model training. Which two actions best satisfy this requirement? (Choose 2)', options: ['Use an enterprise offering with a data processing agreement and zero data retention, confirmed in writing', 'Record the configuration and provider terms as evidence for the compliance file', 'Ask users to avoid typing sensitive data and hope for the best', 'Encrypt the prompt with a homemade cipher before sending'], answer: [0, 1], explain: `**Tóm tắt:** Dùng gói doanh nghiệp có DPA và zero data retention, rồi lưu bằng chứng cấu hình và điều khoản.

### Vì sao đáp án đúng
**DPA (data processing agreement)** là hợp đồng quy định nhà cung cấp xử lý dữ liệu thế nào. **Zero data retention (không lưu dữ liệu)** nghĩa là prompt và output không được giữ lại để huấn luyện. Với regulated industry, phải **có văn bản** (ghi lại cấu hình, điều khoản) để chứng minh với kiểm toán. Đây là cách duy nhất đứng vững trước thanh tra.

### Vì sao các phương án còn lại sai
- **Nhờ người dùng đừng nhập dữ liệu nhạy cảm:** không cưỡng chế được, và không giải quyết việc nhà cung cấp có lưu hay không.
- **Tự mã hoá bằng cipher tự chế:** nhà cung cấp vẫn nhận và có thể lưu; cipher tự chế không phải kiểm soát tuân thủ.

### Khái niệm cần nhớ
**DPA (data processing agreement)** là thoả thuận xử lý dữ liệu. **Zero data retention** là chính sách không lưu prompt/output. **Compliance evidence (bằng chứng tuân thủ)** là hồ sơ chứng minh đã làm đúng khi bị kiểm tra.

### Ví dụ cụ thể
Đội pháp chế ký DPA với gói doanh nghiệp, bật zero retention, chụp lại màn hình cấu hình và lưu vào hồ sơ kiểm toán. Khi thanh tra hỏi, họ đưa ra bằng chứng này thay vì lời nói.

> Mẹo phỏng vấn: với y tế/tài chính, "tuân thủ" là chuyện hợp đồng và bằng chứng, không phải chuyện prompt.` },
{ id: 'qz-ccap-233', topic: 'claude', q: '[Enterprise Integration] A fast-growing startup hits its Claude token-per-minute limit every morning at 9am. The traffic is legitimate and keeps growing. Which action best addresses the root cause?', options: ['Retry every request five times each morning so some eventually pass', 'Request a higher rate-limit tier from the provider and shape bursts with a client-side token-bucket limiter', 'Reduce max_tokens to zero for every request so no tokens are billed', 'Randomly drop half the requests during the morning peak'], answer: 1, explain: `**Tóm tắt:** Xin nâng hạn mức và làm mượt đột biến bằng token-bucket, thay vì retry mù hoặc bỏ request.

### Vì sao đáp án đúng
Giới hạn token mỗi phút là **rate limit**; khi lưu lượng thật tăng đều, cách bền vững là **xin nâng hạn mức** (rate limit tiers) và **client-side smoothing (làm mượt phía client)** bằng token-bucket để tránh dồn đỉnh. Kết hợp hai thứ này giải quyết gốc rễ: năng lực tăng, đỉnh được san.

### Vì sao từng phương án sai
- **Retry 5 lần mỗi sáng:** vẫn vượt giới hạn, chỉ tạo bão retry và làm chậm tất cả; không tăng năng lực.
- **Đặt max_tokens = 0:** không sinh được output; vô hiệu hoá tính năng.
- **Bỏ ngẫu nhiên nửa request:** mất dữ liệu người dùng và không báo trước; trải nghiệm tệ.

### Khái niệm cần nhớ
**Rate limit tier (bậc hạn mức)** là mức giới hạn theo hợp đồng; nâng bậc = xin tăng. **Token-per-minute (token mỗi phút)** là đơn vị đo hạn mức. **Smoothing (làm mượt)** là phân tán tải đều theo thời gian.

### Ví dụ cụ thể
9h sáng traffic tăng gấp 2. Đội đã xin nâng hạn mức từ 100k lên 300k token/phút và đặt token bucket 250k/phút ở gateway; đỉnh được hấp thụ, tỉ lệ 429 gần như bằng 0.

> Mẹo phỏng vấn: phân biệt "giới hạn tạm thời do lỗi" và "giới hạn do năng lực" — cái sau phải xin nâng, không phải retry.` },
{ id: 'qz-ccap-234', topic: 'claude', q: '[Enterprise Integration] A document-analysis feature takes up to five minutes per file. The browser currently polls the server every second, creating thousands of unnecessary calls and hitting rate limits. Which pattern fits better?', options: ['Poll every 100 milliseconds instead so results arrive faster', 'Expose a job-status endpoint or callback that reports completion once, and notify the client a single time when done', 'Make the analysis synchronous and raise every timeout to ten minutes', 'Run the analysis on the user device so the server is not involved'], answer: 1, explain: `**Tóm tắt:** Dùng job-status/callback báo xong một lần, thay vì polling dày đặc.

### Vì sao đáp án đúng
**Polling (hỏi liên tục)** mỗi giây tạo 300 request cho một job 5 phút — tốn tài nguyên và dễ chạm rate limit. Mô hình đúng: client nhận job id, server chạy nền, khi xong thì **push (đẩy)** qua callback/webhook hoặc client hỏi một endpoint trạng thái **một lần** lúc cần. Ít request hơn, và kết quả đến ngay khi sẵn sàng.

### Vì sao từng phương án sai
- **Poll mỗi 100ms:** tăng gấp 10 lần số request; tệ hơn nhiều.
- **Đồng bộ với timeout 10 phút:** trình duyệt và proxy sẽ cắt; người dùng chờ trước màn hình trắng.
- **Chạy trên máy người dùng:** thiết bị không đủ tài nguyên cho phân tích 40 trang, và dữ liệu phân tán khó kiểm soát.

### Khái niệm cần nhớ
**Polling (thăm dò)** là hỏi lặp lại xem xong chưa. **Callback/Webhook (gọi lại)** là server chủ động báo khi có kết quả. **Job id (mã công việc)** là định danh để theo dõi tiến độ. **Async (bất đồng bộ)** là không chờ kết quả ngay.

### Ví dụ cụ thể
Client gửi file, nhận job id ngay. 5 phút sau server gọi webhook hoặc client truy vấn trạng thái một lần, nhận link kết quả. Tổng request giảm từ 300 xuống 2.

> Mẹo phỏng vấn: với tác vụ dài, "gửi rồi nhận sau" (async + job status) luôn thắng "hỏi liên tục".` },
{ id: 'qz-ccap-235', topic: 'claude', q: '[Enterprise Integration] A CIO must choose between building an in-house Claude integration layer and adopting a managed AI gateway product. Which consideration is most important for a sound build-versus-buy decision?', options: ['The number of lines of code in each option', 'Total cost of ownership, security and compliance fit, time to market, and the ability to swap providers later', 'Which option has the most logos on its website', 'Which option the loudest engineer prefers'], answer: 1, explain: `**Tóm tắt:** Quyết định build-vs-buy phải dựa trên TCO, tuân thủ, thời gian ra thị trường và khả năng đổi nhà cung cấp.

### Vì sao đáp án đúng
**Build (tự xây)** cho kiểm soát tối đa nhưng tốn chi phí duy trì dài hạn. **Buy (mua/thuê)** nhanh nhưng phụ thuộc nhà cung cấp và có thể khoá. Quyết định đúng cân nhắc: **TCO (tổng chi phí sở hữu)** gồm xây + vận hành + bảo trì; **compliance (tuân thủ)**; **time to market (thời gian ra mắt)**; và **lock-in (sự phụ thuộc)** — khả năng đổi provider sau này. Đây là khung tư duy kiến trúc sư.

### Vì sao từng phương án sai
- **Số dòng code:** không phản ánh chi phí vận hành, rủi ro, hay giá trị.
- **Số logo trên website:** tiếp thị, không phải bằng chứng phù hợp.
- **Kỹ sư nói to nhất thích:** sở thích cá nhân không phải căn cứ kỹ thuật.

### Khái niệm cần nhớ
**TCO (total cost of ownership)** là tổng chi phí sở hữu gồm cả vận hành và bảo trì. **Lock-in (phụ thuộc)** là bị ràng buộc vào một nhà cung cấp khó đổi. **Time to market (thời gian ra thị trường)** là tốc độ đưa sản phẩm tới người dùng.

### Ví dụ cụ thể
Tự xây mất 6 tháng và cần 3 kỹ sư bảo trì; mua gateway mất 2 tuần nhưng phí thuê hàng tháng. Đội so TCO 3 năm, thời gian ra mắt, và cam kết đổi được provider → chọn mua cho giai đoạn đầu, giữ lớp trừu tượng để dễ thay.

> Mẹo phỏng vấn: luôn nói "TCO + compliance + time to market + lock-in", và nhấn mạnh thiết kế lớp trừu tượng để không bị khoá.` },
{ id: 'qz-ccap-236', topic: 'claude', multi: true, q: '[Operational Enablement] An AI support feature is considered down whenever answers are slow or wrong. The team needs a measurable reliability target agreed with the business. Which two practices define a sound reliability target? (Choose 2)', options: ['Define an SLO such as "99% of answers under five seconds and 95% rated correct", and track the error budget', 'Alert on the burn rate of the error budget so problems are caught early', 'Promise that the feature will never fail', 'Measure only the number of servers running'], answer: [0, 1], explain: `**Tóm tắt:** Đặt SLO đo được (tốc độ + chất lượng) và theo dõi error budget cùng tốc độ đốt.

### Vì sao đáp án đúng
**SLO (service level objective)** là mục tiêu độ tin cậy đo được, ví dụ "99% câu trả lời dưới 5 giây và 95% được đánh giá đúng". **Error budget (ngân sách lỗi)** là phần cho phép sai (1% nếu SLO 99%); khi đốt quá nhanh nghĩa là có vấn đề. **Burn rate (tốc độ đốt)** giúp phát hiện sớm thay vì đợi hết tháng.

### Vì sao các phương án còn lại sai
- **Hứa không bao giờ lỗi:** không thực tế với hệ thống xác suất; hứa 100% làm mất niềm tin khi sự cố xảy ra.
- **Chỉ đếm số server chạy:** server sống không nói gì về chất lượng câu trả lời hay độ trễ thực.

### Khái niệm cần nhớ
**SLO (service level objective)** là mục tiêu độ tin cậy nội bộ. **SLA** là cam kết với khách hàng (thường kèm bồi thường). **Error budget** là lượng lỗi được phép. **Burn rate** là tốc độ tiêu thụ ngân sách lỗi.

### Ví dụ cụ thể
SLO: 99% câu dưới 5s, 95% câu đúng. Tháng có 1% ngân sách lỗi; nếu trong 3 ngày đã đốt 60% ngân sách, hệ thống gửi cảnh báo để đội rà soát trước khi ảnh hưởng người dùng.

> Mẹo phỏng vấn: nói "SLO phải đo được và có error budget" — đó là ngôn ngữ SRE mà nhà tuyển dụng kỳ vọng ở kiến trúc sư.` },
{ id: 'qz-ccap-237', topic: 'claude', q: '[Operational Enablement] After a routine prompt update, answer quality on a small set of tricky cases silently drops for two weeks before a customer complains. Which addition would have caught the problem sooner?', options: ['A scheduled automated run of the golden eval set with an alert when quality falls below a threshold', 'A bigger dashboard of request counts', 'A longer system prompt with more warnings', 'A weekly meeting to read customer complaints'], answer: 0, explain: `**Tóm tắt:** Chạy eval tự động định kỳ và cảnh báo khi chất lượng xuống dưới ngưỡng.

### Vì sao đáp án đúng
**Golden set (bộ vàng)** là tập câu mẫu có đáp án kỳ vọng. Chạy tự động (hàng ngày hoặc mỗi lần đổi prompt) cho ra một con số chất lượng theo thời gian. Khi điểm tụt dưới ngưỡng, hệ thống **alert (báo động)**, phát hiện trong vài giờ thay vì vài tuần. Đây là "regression detection (phát hiện thoái hoá)" tự động.

### Vì sao từng phương án sai
- **Dashboard đếm request:** cho biết lưu lượng, không nói gì về độ đúng.
- **Prompt dài hơn với cảnh báo:** không đo, không phát hiện; có thể còn làm tệ hơn.
- **Họp đọc phàn nàn hàng tuần:** tín hiệu quý nhưng đến trễ, không đại diện, không so sánh được.

### Khái niệm cần nhớ
**Golden set (bộ vàng)** là tập đánh giá chuẩn. **Threshold (ngưỡng)** là mức cảnh báo. **Regression (thoái hoá chất lượng)** là chất lượng giảm sau một thay đổi. **Alert (cảnh báo)** là thông báo tự động khi vượt ngưỡng.

### Ví dụ cụ thể
Mỗi 6h hệ thống chạy 200 câu golden set. Sau khi đổi prompt, điểm giảm từ 92% xuống 78%; trong 1 giờ đội nhận cảnh báo và rollback trước khi khách hàng kịp phàn nàn.

> Mẹo phỏng vấn: "không đo thì không cải thiện" — eval tự động là thứ biến chất lượng mơ hồ thành con số theo dõi được.` },
{ id: 'qz-ccap-238', topic: 'claude', q: '[Operational Enablement] A company is planning next quarter and must forecast Claude spend, which has grown 20% month over month. Which approach gives the most reliable forecast?', options: ['Multiply last month bill by 1.2 and hope', 'Model spend from token usage per feature, expected traffic growth, and planned model-mix changes, then compare with the provider quota', 'Ask each team to guess its own usage', 'Assume usage stays flat forever'], answer: 1, explain: `**Tóm tắt:** Dự báo từ token theo từng tính năng, tăng trưởng lưu lượng và thay đổi cơ cấu model, rồi đối chiếu hạn mức.

### Vì sao đáp án đúng
Chi phí Claude = số token vào/ra × giá model. Dự báo đáng tin phải đi từ **token usage per feature (token theo từng tính năng)**, cộng **traffic growth (tăng trưởng lưu lượng)** dự kiến, và **model-mix (cơ cấu model)** — ví dụ chuyển bớt sang model rẻ hơn. Sau đó so với **quota (hạn mức)** để biết có sắp chạm trần không.

### Vì sao từng phương án sai
- **Nhân hóa đơn tháng trước với 1.2:** tuyến tính hoá một hệ phi tuyến; bỏ qua thay đổi cơ cấu model và tính năng mới.
- **Mỗi team tự đoán:** số liệu cảm tính, không có nguồn sự thật.
- **Giả định đứng yên:** bỏ qua tăng trưởng đã biết 20%/tháng, chắc chắn dự báo thiếu.

### Khái niệm cần nhớ
**Token usage (lượng token dùng)** là số token vào và ra. **Model mix (cơ cấu model)** là tỉ lệ dùng từng model. **Quota (hạn mức)** là trần sử dụng. **Forecast (dự báo)** là ước lượng tương lai dựa trên dữ liệu.

### Ví dụ cụ thể
Tính năng A dùng 40M token/tháng, B 25M, C 10M; dự kiến lưu lượng tăng 20% và chuyển 30% traffic sang model rẻ hơn. Dự báo tháng sau ~90M token; so với hạn mức 100M → cần xin nâng sớm.

> Mẹo phỏng vấn: dự báo chi phí = token × giá, cộng thay đổi model-mix; đừng nhân hóa đơn một cách máy móc.` },
{ id: 'qz-ccap-239', topic: 'claude', q: '[Operational Enablement] A new Claude model version is available and the team wants to adopt it with minimal risk to a high-traffic feature. Which rollout strategy is safest?', options: ['Switch 100% of traffic to the new model immediately', 'Canary: route a small percentage to the new model, compare eval and live metrics against the control, then ramp up or roll back', 'Wait a year and never adopt it', 'Randomly choose a model per request forever'], answer: 1, explain: `**Tóm tắt:** Canary release — đưa một phần nhỏ lưu lượng sang model mới, so sánh với nhóm đối chứng, rồi tăng dần hoặc rollback.

### Vì sao đáp án đúng
**Canary release (phát hành thử theo giọt)** đưa thay đổi cho một tỉ lệ nhỏ người dùng trước, giữ phần lớn ở bản cũ (control). So sánh **eval và live metrics (chỉ số thực tế)** giữa hai nhóm; nếu tốt thì tăng dần (ramp up), nếu xấu thì **rollback (quay lại)**. Cách này giới hạn phạm vi ảnh hưởng khi có sự cố.

### Vì sao từng phương án sai
- **Chuyển 100% ngay:** nếu model mới có vấn đề, toàn bộ người dùng bị ảnh hưởng cùng lúc.
- **Chờ một năm không dùng:** bỏ lỡ cải tiến; model cũ còn bị khai tử.
- **Chọn model ngẫu nhiên mỗi request:** không kiểm soát, không so sánh được, trải nghiệm không nhất quán.

### Khái niệm cần nhớ
**Canary (chim hoàng yến)** là phát hành thử cho nhóm nhỏ. **Control (nhóm đối chứng)** là nhóm giữ bản cũ để so sánh. **Ramp up (tăng dần)** là mở rộng tỉ lệ theo từng bước. **Rollback (quay lại)** là trở về bản trước.

### Ví dụ cụ thể
5% traffic dùng model mới trong 2 ngày; eval và tỉ lệ lỗi ngang hoặc tốt hơn; tăng lên 25%, 50%, 100%. Nếu tỉ lệ lỗi tăng, quay về 0% ngay.

> Mẹo phỏng vấn: "canary + so sánh với control + ngưỡng dừng" là công thức phát hành an toàn cho mọi thay đổi model.` },
{ id: 'qz-ccap-240', topic: 'claude', q: '[Operational Enablement] A Claude feature began giving wrong refund answers after the provider updated a model, and 200 customers were affected. Which practice leads to the best organisational learning?', options: ['Discipline the engineer who last changed the prompt', 'Run a blameless postmortem covering the model change, missing eval coverage, and add regression tests plus a change-review gate', 'Delete the incident ticket and move on', 'Add more warning sentences to the prompt and close the incident'], answer: 1, explain: `**Tóm tắt:** Postmortem không đổ lỗi (blameless), tìm nguyên nhân gốc, rồi thêm eval hồi quy và cổng review thay đổi.

### Vì sao đáp án đúng
**Blameless postmortem (rút kinh nghiệm không đổ lỗi)** tập trung vào hệ thống chứ không vào cá nhân, nên mọi người dám nói thật. Phân tích: provider đổi model, thiếu eval cho ca hoàn tiền, không có cổng review. Hành động: thêm **regression test (kiểm thử hồi quy)** và **change-review gate (cổng duyệt thay đổi)** để lần sau không lặp lại.

### Vì sao từng phương án sai
- **Kỷ luật kỹ sư:** tạo văn hoá sợ hãi, che giấu sự cố; không sửa nguyên nhân gốc.
- **Xoá ticket rồi đi tiếp:** mất cơ hội học; cùng lỗi sẽ tái diễn.
- **Thêm câu cảnh báo vào prompt:** chỉ là chỉ dẫn mềm, không ngăn lỗi; không có kiểm chứng.

### Khái niệm cần nhớ
**Blameless (không đổ lỗi)** là văn hoá rút kinh nghiệm tập trung vào hệ thống. **Root cause (nguyên nhân gốc)** là lý do thật sự. **Regression test (kiểm thử hồi quy)** là bài kiểm tra đảm bảo lỗi cũ không tái phát. **Change-review gate (cổng duyệt)** là bước bắt buộc review trước khi đổi.

### Ví dụ cụ thể
Postmortem kết luận: đổi model mà không chạy eval hoàn tiền. Hành động: thêm 30 ca hoàn tiền vào golden set, bắt buộc eval trước khi đổi model, và review chéo. Sự cố tương tự không lặp lại.

> Mẹo phỏng vấn: nhấn mạnh "không đổ lỗi" và "biến sự cố thành test + quy trình" — đó là dấu hiệu của một tổ chức trưởng thành.` },
{ id: 'qz-ccap-241', topic: 'claude', q: '[Operational Enablement] During a Claude provider outage, the on-call engineer cannot tell whether the fault is the provider, the network, or their own code. What should already exist to speed up diagnosis?', options: ['Nothing; engineers should improvise under pressure', 'A runbook with provider status checks, health-check commands, and the failover procedure, plus dashboards of error codes', 'A list of everyone who ever touched the project', 'A longer system prompt for the support assistant'], answer: 1, explain: `**Tóm tắt:** Runbook (sổ tay vận hành) + dashboard lỗi + quy trình failover giúp chẩn đoán nhanh và có sẵn.

### Vì sao đáp án đúng
**Runbook** là tài liệu "làm gì khi X xảy ra": kiểm tra trang trạng thái nhà cung cấp, chạy health check, phân biệt lỗi 5xx từ provider với lỗi mạng hay code, và các bước failover. **Dashboard error codes (bảng mã lỗi)** cho thấy tỉ lệ 429/500/529 theo thời gian thực. Khi có runbook, người trực làm theo từng bước thay vì mò mẫm lúc 3 giờ sáng.

### Vì sao từng phương án sai
- **Không có gì, ứng biến:** mỗi sự cố một cách xử lý khác nhau; dễ sai và kéo dài.
- **Danh sách người từng chạm dự án:** không giúp chẩn đoán kỹ thuật.
- **Prompt dài hơn cho assistant:** không liên quan tới việc chẩn đoán sự cố hạ tầng.

### Khái niệm cần nhớ
**Runbook (sổ tay vận hành)** là hướng dẫn xử lý sự cố từng bước. **On-call (trực)** là người chịu trách nhiệm ngoài giờ. **Health check (kiểm tra sức khoẻ)** là lệnh dò dịch vụ. **Failover (chuyển dự phòng)** là chuyển sang thành phần dự phòng.

### Ví dụ cụ thể
Sự cố 3h sáng: người trực mở runbook, thấy bước 1 kiểm tra trang trạng thái provider (đang có sự cố), bước 2 xác nhận health check nội bộ xanh, bước 3 bật failover sang provider dự phòng. Khôi phục trong 10 phút.

> Mẹo phỏng vấn: "runbook + dashboard + failover" là bộ ba vận hành; thiếu runbook là du kích.` },
{ id: 'qz-ccap-242', topic: 'claude', multi: true, q: '[Operational Enablement] Executives want a monthly view of whether the Claude investment is paying off. Which two metrics best answer that question? (Choose 2)', options: ['Cost per successful task and adoption', 'Task success rate and user satisfaction over time', 'Number of lines of code in the integration', 'Number of API keys in use'], answer: [0, 1], explain: `**Tóm tắt:** Cost per successful task + adoption cho thấy hiệu quả; task success rate + satisfaction cho thấy giá trị.

### Vì sao đáp án đúng
**Cost per successful task (chi phí trên mỗi tác vụ thành công)** kết hợp chi phí và chất lượng: nếu chi phí tăng nhưng tỉ lệ thành công không tăng, đó là lãng phí. **Adoption (mức sử dụng)** cho biết công cụ có thực sự được dùng không. **Task success rate (tỉ lệ thành công)** và **user satisfaction (mức hài lòng)** đo giá trị thực. Đây là bốn thước đo kinh doanh, không phải kỹ thuật.

### Vì sao các phương án còn lại sai
- **Số dòng code:** không phản ánh giá trị hay chi phí vận hành.
- **Số API key:** chỉ là chi tiết cấu hình, không nói gì về hiệu quả đầu tư.

### Khái niệm cần nhớ
**Cost per successful task** là chi phí chia cho số tác vụ hoàn thành đúng. **Adoption** là mức độ người dùng thật sự dùng. **Task success rate** là tỉ lệ hoàn thành đúng. **Satisfaction** là mức hài lòng (thường đo bằng khảo sát hoặc đánh giá).

### Ví dụ cụ thể
Báo cáo tháng: adoption tăng từ 40% lên 65%, cost per successful task giảm từ 0.12 xuống 0.08 USD, satisfaction 4.3/5. Ban lãnh đạo thấy rõ ROI (lợi ích trên chi phí) dương.

> Mẹo phỏng vấn: nói "đo theo tác vụ thành công và mức sử dụng", đừng báo cáo số dòng code hay số key cho lãnh đạo.` },
{ id: 'qz-ccap-243', topic: 'claude', q: '[Operational Enablement] Business teams keep asking engineering to change prompts for small wording tweaks, and engineering is now a bottleneck. Which approach balances speed with safety?', options: ['Give everyone direct edit access to production prompts', 'Provide a governed prompt library with versioning, review, and a test suite so non-engineers can propose changes safely', 'Forbid all prompt changes', 'Let the model rewrite its own prompt every day'], answer: 1, explain: `**Tóm tắt:** Prompt library có quản trị (versioning + review + test) để người không phải kỹ sư vẫn đề xuất thay đổi an toàn.

### Vì sao đáp án đúng
**Prompt library (thư viện prompt có quản trị)** cho phép business tự sửa trong một khung an toàn: mọi thay đổi đều **version (đánh phiên bản)**, có **review (duyệt)** và chạy **test suite (bộ kiểm thử)** trước khi lên production. Vừa nhanh (không phải xếp hàng chờ kỹ sư), vừa an toàn (không sửa bừa trên production).

### Vì sao từng phương án sai
- **Ai cũng sửa trực tiếp production:** hỗn loạn, không truy vết, không rollback; một lỗi nhỏ ảnh hưởng tất cả.
- **Cấm mọi thay đổi:** triệt tiêu cải tiến, đẩy việc sang sửa lén hoặc bỏ tính năng.
- **Để model tự viết lại prompt hàng ngày:** không kiểm soát, không giải thích được vì sao hành vi đổi.

### Khái niệm cần nhớ
**Governed (có quản trị)** là có quy trình, phân quyền và kiểm soát. **Prompt library** là nơi lưu prompt có phiên bản. **Test suite (bộ kiểm thử)** là tập eval tự động. **Review (duyệt)** là bước người khác kiểm tra trước khi phát hành.

### Ví dụ cụ thể
Business đề xuất đổi câu chào trong prompt; hệ thống tạo pull request, chạy eval, một reviewer duyệt, rồi phát hành. Kỹ sư không còn là nút cổ chai cho từng câu chữ.

> Mẹo phỏng vấn: "tự phục vụ có quản trị" — mở quyền nhưng kèm version, review, test.` },
{ id: 'qz-ccap-244', topic: 'claude', q: '[Operational Enablement] A team adds detailed logging to debug a Claude issue, capturing full prompts and outputs. Later an auditor finds customer PII in the logs. Which practice best prevents this in future?', options: ['Disable logging entirely', 'Redact or tokenise PII at the logging layer and set retention and access policies for observability data', 'Store the logs in a public bucket for easy access', 'Log only error counts from now on'], answer: 1, explain: `**Tóm tắt:** Che/ẩn PII ngay ở lớp log, cộng chính sách lưu trữ và phân quyền cho dữ liệu observability.

### Vì sao đáp án đúng
**Redaction (làm mờ)** thay dữ liệu nhạy cảm bằng ký hiệu; **tokenisation** thay bằng token và giữ mapping ở nơi an toàn. Làm ngay ở **logging layer (lớp ghi log)** nghĩa là PII không bao giờ được ghi xuống đĩa. Cộng thêm **retention (thời gian lưu)** và **access policy (chính sách truy cập)** để giảm phạm vi và thời gian rủi ro.

### Vì sao từng phương án sai
- **Tắt toàn bộ log:** mất khả năng điều tra sự cố; không phải giải pháp.
- **Lưu log vào bucket công khai:** làm rò rỉ nặng hơn; cực kỳ nguy hiểm.
- **Chỉ ghi số lỗi:** quá ít thông tin để gỡ lỗi; không giải quyết gốc rễ PII.

### Khái niệm cần nhớ
**PII (personally identifiable information)** là thông tin định danh cá nhân. **Redaction (làm mờ)** là che dữ liệu nhạy cảm. **Tokenisation** là thay bằng token. **Retention (lưu trữ)** là thời gian giữ dữ liệu. **Observability (khả năng quan sát)** là log/metric/trace.

### Ví dụ cụ thể
Log tự động thay email, số điện thoại, số thẻ bằng [EMAIL], [PHONE] trước khi ghi. Chỉ truy cập được với vai trò đã phân quyền, và log tự xoá sau 30 ngày.

> Mẹo phỏng vấn: "observability không có nghĩa là log mọi thứ" — che PII ở lớp log và giới hạn truy cập.` },
{ id: 'qz-ccap-245', topic: 'claude', q: '[Operational Enablement] Two candidate prompts exist for a Claude feature. The team wants to pick the better one using real traffic rather than opinion. What is the most rigorous approach?', options: ['Let the loudest stakeholder choose the prompt', 'A/B test: split traffic between the two prompts, measure quality and cost metrics with enough samples, and pick the winner', 'Ask the model which prompt it prefers', 'Flip a coin'], answer: 1, explain: `**Tóm tắt:** A/B test — chia lưu lượng cho hai prompt, đo chất lượng và chi phí với đủ mẫu, chọn bản thắng.

### Vì sao đáp án đúng
**A/B testing (kiểm thử A/B)** chia lưu lượng ngẫu nhiên thành hai nhóm, mỗi nhóm dùng một prompt, rồi so sánh các chỉ số (độ đúng, tỉ lệ hài lòng, chi phí) trên cùng phân khúc người dùng. Cần **đủ mẫu (enough samples)** để kết quả có ý nghĩa thống kê, tránh kết luận từ may rủi.

### Vì sao từng phương án sai
- **Stakeholder nói to nhất chọn:** ý kiến cá nhân, không phải dữ liệu.
- **Hỏi model prompt nào tốt hơn:** model không khách quan về chính nó; không đo được tác động thực.
- ** Tung đồng xu:** bỏ qua toàn bộ dữ liệu, thuần may rủi.

### Khái niệm cần nhớ
**A/B test** là so sánh hai phiên bản trên lưu lượng thật. **Statistical significance (ý nghĩa thống kê)** là đảm bảo khác biệt không do ngẫu nhiên. **Sample size (kích thước mẫu)** là số quan sát cần đủ để tin kết quả.

### Ví dụ cụ thể
50/50 traffic trong một tuần; prompt B có tỉ lệ đúng cao hơn 4 điểm và chi phí thấp hơn 10%; với 10.000 mẫu, khác biệt có ý nghĩa → chọn B.

> Mẹo phỏng vấn: nói "đủ mẫu + đo cả chất lượng và chi phí", vì chỉ đo một vế dễ chọn sai.` },
{ id: 'qz-ccap-246', topic: 'claude', multi: true, q: '[Operational Enablement] The monthly Claude bill tripled in one week with no launch. Which two steps most quickly find the cause? (Choose 2)', options: ['Break down spend by caller, model, endpoint and token counts in the gateway to find the feature driving it', 'Set budget alerts and per-caller quotas so a spike is caught and capped early', 'Blame the provider and pay the bill', 'Randomly delete prompts until the bill drops'], answer: [0, 1], explain: `**Tóm tắt:** Phân rã chi phí theo caller/model/endpoint để tìm thủ phạm, và đặt ngân sách + quota để chặn sớm.

### Vì sao đáp án đúng
**Break down (phân rã)** chi phí theo từng chiều (ai gọi, model nào, endpoint nào, bao nhiêu token) giúp khoanh vùng ngay tính năng gây tăng. **Budget alert + quota (cảnh báo ngân sách và hạn mức)** giúp phát hiện và chặn khi vượt ngưỡng, tránh sốc hóa đơn. Đây là cách tiếp cận "đo trước, sửa sau".

### Vì sao các phương án còn lại sai
- **Đổ lỗi provider rồi trả tiền:** không tìm nguyên nhân; cùng vấn đề sẽ lặp lại.
- **Xoá prompt ngẫu nhiên:** phá tính năng, không dựa trên dữ liệu; có thể không liên quan.

### Khái niệm cần nhớ
**Break down (phân rã)** là chia tổng theo từng chiều. **Budget alert (cảnh báo ngân sách)** là thông báo khi chi phí vượt ngưỡng. **Quota (hạn mức)** là trần sử dụng. **Attribution (quy kết)** là gán chi phí cho đúng nguồn.

### Ví dụ cụ thể
Gateway cho thấy một endpoint "tóm tắt" chiếm 70% token tăng thêm, do một client lặp vô hạn. Đội sửa vòng lặp và đặt quota theo caller; hóa đơn trở lại bình thường.

> Mẹo phỏng vấn: "chi phí tăng đột biến = phân rã theo caller/model/endpoint trước, rồi mới đặt quota".` },
{ id: 'qz-ccap-247', topic: 'claude', q: '[Operational Enablement] Thumbs-up and thumbs-down ratings are collected on Claude answers, but nothing improves over time. What is missing?', options: ['More thumbs icons in the interface', 'A process that turns low-rated examples into labelled eval cases, fixes root causes, and re-measures', 'Removing the ratings feature', 'Increasing temperature so answers vary more'], answer: 1, explain: `**Tóm tắt:** Thiếu vòng khép kín: biến mẫu bị đánh giá thấp thành eval case có nhãn, sửa gốc, rồi đo lại.

### Vì sao đáp án đúng
Thu thập đánh giá chỉ là bước đầu. **Vòng cải tiến (improvement loop)** cần: gom các câu bị dislike, gán nhãn nguyên nhân (sai, thiếu, bịa), đưa vào **eval set (bộ đánh giá)**, sửa prompt/nguồn dữ liệu, rồi chạy lại để xác nhận. Không có bước này, nút dislike chỉ là trang trí.

### Vì sao từng phương án sai
- **Thêm nhiều nút đánh giá:** tăng dữ liệu thô nhưng không ai xử lý; không cải thiện.
- **Bỏ tính năng đánh giá:** mất tín hiệu quý từ người dùng.
- **Tăng temperature:** làm câu trả lời ngẫu nhiên hơn, không sửa nguyên nhân bị đánh giá thấp.

### Khái niệm cần nhớ
**Feedback loop (vòng phản hồi)** là vòng: thu thập → phân tích → sửa → đo lại. **Labelled (có nhãn)** là dữ liệu đã gán nguyên nhân. **Eval set (bộ đánh giá)** là tập câu kiểm thử chất lượng.

### Ví dụ cụ thể
Mỗi tuần gom 50 câu dislike, gán nhãn, thấy 30 câu do tài liệu cũ. Cập nhật tài liệu nguồn, chạy lại eval, tỉ lệ dislike giảm từ 8% xuống 3%.

> Mẹo phỏng vấn: "thu thập mà không có vòng xử lý là trang trí" — luôn nói tới eval set và đo lại.` },
{ id: 'qz-ccap-248', topic: 'claude', multi: true, q: '[Operational Enablement] A Claude feature is about to launch to 100,000 users and has only been tested with 10. Which two actions best prepare for the public launch? (Choose 2)', options: ['Run load tests with production-like concurrency to find rate-limit and latency limits, then set quotas and autoscaling', 'Prepare a rollback plan and a feature flag to disable or shrink the rollout quickly', 'Reduce answer quality so the feature runs faster', 'Launch at midnight so fewer people notice problems'], answer: [0, 1], explain: `**Tóm tắt:** Load test với lưu lượng thật để tìm trần, và chuẩn bị rollback + feature flag để tắt/giảm nhanh khi cần.

### Vì sao đáp án đúng
**Load testing (kiểm thử tải)** với **production-like concurrency (đồng thời như thật)** cho biết hệ thống gãy ở đâu (rate limit, độ trễ, hàng đợi). **Rollback + feature flag (cờ tính năng)** cho phép tắt hoặc giảm phạm vi ngay lập tức nếu sự cố, thay vì phải deploy lại. Hai thứ này biến "chờ may" thành "kiểm soát được".

### Vì sao các phương án còn lại sai
- **Giảm chất lượng cho nhanh hơn:** đánh đổi giá trị người dùng để chữa một vấn đề chưa xác nhận; không phải chuẩn bị.
- **Ra mắt lúc nửa đêm cho ít người thấy:** né tránh chứ không giải quyết; sự cố vẫn ảnh hưởng người dùng thật.

### Khái niệm cần nhớ
**Load test (kiểm thử tải)** là đo dưới tải cao. **Concurrency (đồng thời)** là số yêu cầu cùng lúc. **Autoscaling (tự co giãn)** là tự thêm/bớt tài nguyên theo tải. **Feature flag (cờ tính năng)** là công tắc bật/tắt tính năng từ xa. **Rollback (quay lại)** là trở về bản trước.

### Ví dụ cụ thể
Load test cho thấy ở 8,000 req/s hệ thống chạm rate limit; đội đặt autoscaling và quota, chuẩn bị feature flag. Ngày ra mắt, khi tỉ lệ lỗi vượt ngưỡng, chỉ cần bật cờ tắt tính năng trong 1 phút.

> Mẹo phỏng vấn: "load test + rollback + feature flag" là bộ ba an toàn trước mọi lần ra mắt lớn.` },
{ id: 'qz-ccap-249', topic: 'claude', q: '[Operational Enablement] A team wants to upgrade a production Claude feature to a newer model. Which practice most reduces the chance of a silent quality regression?', options: ['Deploy on Friday evening and watch the dashboards over the weekend', 'Run the golden eval set on both models, compare quality, cost and latency, then roll out gradually with monitoring', 'Skip evals because the newer model must be better', 'Switch all users instantly to save time'], answer: 1, explain: `**Tóm tắt:** Chạy eval trên cả hai model, so sánh chất lượng/chi phí/độ trễ, rồi phát hành dần có giám sát.

### Vì sao đáp án đúng
Model mới không mặc nhiên tốt hơn cho mọi tác vụ; nó có thể đổi hành vi. **So sánh có kiểm chứng (eval song song)** cho biết delta theo từng loại tác vụ. **Rollout dần (gradual rollout)** giới hạn rủi ro. **Monitoring (giám sát)** bắt regression trong lúc còn ít người dùng.

### Vì sao từng phương án sai
- **Deploy tối thứ Sáu rồi xem dashboard:** nếu lỗi, xử lý cuối tuần với ít người hỗ trợ; rủi ro cao.
- **Bỏ eval vì "mới hơn là tốt hơn":** giả định sai; nhiều model mới đổi hành vi, chi phí, độ trễ.
- **Chuyển hết ngay:** không có lưới an toàn; lỗi ảnh hưởng toàn bộ.

### Khái niệm cần nhớ
**Regression (thoái hoá)** là chất lượng giảm sau thay đổi. **Golden set (bộ vàng)** là tập đánh giá chuẩn. **Gradual rollout (phát hành dần)** là mở rộng theo từng bước. **Monitoring (giám sát)** là theo dõi chỉ số thực tế.

### Ví dụ cụ thể
Eval cho thấy model mới tốt hơn 3 điểm ở tác vụ khó nhưng đắt hơn 40%. Đội quyết định route tác vụ khó sang model mới, giữ model cũ cho tác vụ đơn giản; rollout 10% → 50% → 100%.

> Mẹo phỏng vấn: "model mới phải được kiểm chứng trên tác vụ của bạn", đừng giả định "mới = tốt hơn".` },
{ id: 'qz-ccap-250', topic: 'claude', q: '[Operational Enablement] Support agents repeatedly answer the same questions about how the Claude assistant behaves and when to trust it. What best reduces the load on engineering?', options: ['Tell agents to read the source code', 'Create and maintain an agent runbook/FAQ: known limitations, escalation path, and how to report a bad answer', 'Remove the assistant so there is nothing to explain', 'Give agents the API key so they can experiment'], answer: 1, explain: `**Tóm tắt:** Runbook/FAQ cho đội hỗ trợ: giới hạn đã biết, đường escalation, và cách báo câu trả lời sai.

### Vì sao đáp án đúng
Khi support có tài liệu rõ về **giới hạn đã biết (known limitations)**, **đường escalation (đường báo lỗi lên trên)**, và **cách báo cáo câu trả lời sai**, họ tự trả lời được phần lớn câu hỏi và chuyển đúng việc cần chuyển. Đây là **enablement (trang bị năng lực)** cho đội vận hành, giảm tải cho kỹ sư và cải thiện trải nghiệm người dùng cuối.

### Vì sao từng phương án sai
- **Bảo đọc source code:** không thực tế cho support; họ cần hướng dẫn vận hành, không phải code.
- **Gỡ assistant:** mất giá trị sản phẩm; né vấn đề.
- **Đưa API key cho support:** rủi ro bảo mật; key không phải công cụ hỗ trợ.

### Khái niệm cần nhớ
**Enablement (trang bị)** là cung cấp công cụ và kiến thức để đội làm việc độc lập. **Escalation path (đường báo lỗi)** là quy trình chuyển việc lên cấp trên. **Known limitation (giới hạn đã biết)** là những việc hệ thống chưa làm tốt. **Runbook (sổ tay)** là tài liệu vận hành.

### Ví dụ cụ thể
FAQ ghi rõ: assistant không xử lý hoàn tiền, hãy chuyển cho nhân viên; nếu câu trả lời sai, bấm "báo lỗi" kèm mã. Support tự trả lời 80% câu hỏi, kỹ sư chỉ nhận các ca đã được phân loại.

> Mẹo phỏng vấn: "enablement" là một domain vận hành — runbook, FAQ, đường escalation và cơ chế báo lỗi.` },
);
