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
);
