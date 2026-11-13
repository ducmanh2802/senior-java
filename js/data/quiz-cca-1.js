/* CCA-F practice questions (topic claude, tag = CCA-F domain): task T1516. Format: AGENTS.md mục 4. */
(window.QUIZ = window.QUIZ || []).push(
{
  id: 'qz-cca-001',
  topic: 'claude',
  q: '[Agentic Architecture] In an agent loop, Claude replies with stop_reason "end_turn" and no tool_use block. What should the harness do next?',
  options: ['Send an empty tool_result to keep the loop alive', 'Treat the task as complete and return the final text answer to the user', 'Retry the request with a higher max_tokens', 'Start a new subagent to double-check the answer'],
  answer: 1,
  explain: `**Đáp án đúng: B.** stop_reason là "end_turn" có nghĩa model đã hoàn tác: không còn lệnh tool nào để chạy, câu trả lời cuối cùng đã nằm trong content. Harness chỉ cần hiển thị nội dung đó cho người dùng (hoặc lưu vào transcript) và kết thúc phiên.

### Vì sao các phương án còn lại sai
- **A:** tool_result chỉ gửi khi có tool_use cần đáp lại; gửi tool_result trống mà không có tool_use sẽ làm lỗi request.
- **C:** max_tokens chỉ cần tăng khi output bị cắt (stop_reason là max_tokens). end_turn không phải lỗi.
- **D:** end_turn đã là tín hiệu xong việc; tạo subagent thêm là lãng phí chi phí và độ trễ.`
},
{
  id: 'qz-cca-002',
  topic: 'claude',
  q: '[Agentic Architecture] Claude returns stop_reason "tool_use" with two independent tool_use blocks in one turn. What must the harness do before calling Claude again?',
  options: ['Run only the first tool_use and ignore the second one', 'Execute every tool_use block, then send all matching tool_result blocks in a single user message', 'Send one user message per tool_result, in separate HTTP requests', 'Summarize both tool intentions in text and skip running the tools'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Một lượt assistant có thể yêu cầu gọi nhiều tool cùng lúc (các lệnh độc lập). Harness phải chạy mỗi tool_use, rồi gom toàn bộ tool_result kèm tool_use_id tương ứng vào **một** tin nhắn user gửi lại API. Model sẽ tiếp tục vòng lặp từ kết quả đó.

### Vì sao các phương án còn lại sai
- **A:** bỏ tool_use nào khiến model chưa có dữ liệu cần thiết; vòng lặp không hoàn chỉnh.
- **C:** tất cả tool_result của cùng một lượt phải đi cùng một message user; tách thành nhiều request sai định dạng.
- **D:** không chạy tool thì không có dữ liệu thực; model chỉ đang mượn suy đoán.`
},
{
  id: 'qz-cca-003',
  topic: 'claude',
  q: '[Agentic Architecture] In Claude Code, where are subagents defined so they can be reused across tasks?',
  options: ['In the system prompt of every request', 'In .claude/agents/*.md files inside the project', 'In a database table managed by Anthropic', 'Only through the Claude web chat settings'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Trong Claude Code, subagent được định nghĩa bằng file markdown trong thư mục {{code}}.claude/agents/{{code}} của dự án. Mỗi file đặt tên subagent, mô tả, hướng dẫn hệ thống, danh sách tool được phép và có thể chỉ định model riêng. Các agent khác trong team có thể reuse file này qua git.

### Vì sao các phương án còn lại sai
- **A:** system prompt là hướng dẫn cho mỗi lượt, không phải nơi đăng ký subagent dùng lại.
- **C:** Anthropic không lưu subagent của bạn trên cloud theo cách đó; định nghĩa nằm trong repo của bạn.
- **D:** cài đặt web chat không áp dụng cho agent chạy trong Claude Code locally.`
},
{
  id: 'qz-cca-004',
  topic: 'claude',
  q: '[Agentic Architecture] Which fields are typically part of a Claude Code subagent definition in .claude/agents/?',
  options: ['Only the agent name', 'Name, description, system prompt/instructions, allowed tools, and optionally model', 'Name and API key for the subagent to use', 'Name and a GitHub repository URL'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Một định nghĩa subagent bản chất là brief gắn kèm cấu hình: tên (để gọi), mô tả (để orchestrator quyết định khi nào gọi), hướng dẫn hệ thống (mục tiêu, ràng buộc), tool được phép (theo nguyên tắc tối thiểu quyền), và model ưu tiên (tuỳ chọn). API key hoặc URL repo không phải trường định nghĩa subagent.

### Vì sao các phương án còn lại sai
- **A:** chỉ tên là không đủ; orchestrator cần biết subagent làm gì và được dùng tool gì.
- **C:** subagent không mang API key riêng; nó chạy dưới quyền và cấu hình của phiên cha.
- **D:** URL repo không liên quan đến định nghĩa subagent.`
},
{
  id: 'qz-cca-005',
  topic: 'claude',
  q: '[Agentic Architecture] An orchestrator delegates "fix the login bug" to a subagent but does not pass the repository path, failing test names, or environment variables. The subagent fails. Why?',
  options: ['The subagent model is too weak', 'Subagents run in an isolated context and cannot see the orchestrator\'s message history; the brief must be self-contained', 'Subagents cannot read source code', 'The subagent needs a separate API key'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Subagent chạy trong ngữ cảnh riêng (isolated context): nó không xem được lịch sử hội thoại của orchestrator, không biết cuộc họp "trên đầu" đã bàn gì. Mọi thông tin cần thiết (mục tiêu, đường dẫn repository, tên test thất bại, biến môi trường, định dạng kết quả, điều kiện dừng) phải được ghi rõ trong brief gửi xuống.

### Vì sao các phương án còn lại sai
- **A:** model kém không phải nguyên nhân nếu brief thiếu thông tin cơ bản; model nào cũng không đoán được điều nó không thấy.
- **C:** subagent có thể đọc mã nguồn nếu được cấp tool đọc file.
- **D:** subagent không sử dụng API key riêng.`
},
{
  id: 'qz-cca-006',
  topic: 'claude',
  q: '[Agentic Architecture] For a hub-and-spoke agent, which model assignment fits the cost-quality trade-off best?',
  options: ['Use a capable model for the orchestrator and cheaper, faster models for simple worker tasks', 'Use the most expensive model for every subagent', 'Use the same cheap model for both orchestrator and workers', 'Let each subagent pick its own model randomly'],
  answer: 0,
  explain: `**Đáp án đúng: A.** Orchestrator chịu trách nhiệm quyết định tuyến đường và tổng hợp nên cần trí tuệ cao (model lớn như Sonnet/Opus). Các worker làm việc đơn giản (trích xuất, ghi log, gọi API rõ ràng) có thể dùng model nhỏ rẻ hơn (Haiku) mà chất lượng không giảm nhiều, giúp giảm chi phí và độ trễ tổng thể.

### Vì sao các phương án còn lại sai
- **B:** trả tiền cao cho việc đơn giản là lãng phí; không mỗi công việc cũng cần model đắt.
- **C:** orchestrator dùng model rẻ có thể quyết định sai tuyến đường, làm hỏng cả luồng.
- **D:** chọn model ngẫu nhiên làm hành động không thể dự đoán và khó đánh giá chi phí.`
},
{
  id: 'qz-cca-007',
  topic: 'claude',
  q: '[Agentic Architecture] A customer support agent needs to fetch the user profile, order history, and product catalog in parallel because none depends on the others. Which approach is best?',
  options: ['Call the three tools one after another to be safe', 'Call all three tools in parallel in one turn, then combine the results', 'Ask the user to provide the data manually', 'Use Message Batches API for these three calls'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Các lệnh độc lập (không cần đầu ra của nhau) nên gọi song song trong cùng một lượt tool_use: giảm tổng thời gian chờ từ tổng cộng từng lệnh xuống khoảng thời gian của lệnh chậm nhất. Sau khi có kết quả, orchestrator ghép và trả lời.

### Vì sao các phương án còn lại sai
- **A:** gọi tuần tự làm tăng độ trễ tổng cộng mà không có lợi ích khi các lệnh không phụ thuộc nhau.
- **C:** dữ liệu này có sẵn qua tool, không cần người dùng nhập tay.
- **D:** Message Batches API dành cho hàng ngàn request độc lập xử lý bất đồng bộ (tới 24 giờ), không dùng cho ba lệnh trong một tác vụ agent.`
},
{
  id: 'qz-cca-008',
  topic: 'claude',
  q: '[Agentic Architecture] Agent must create an invoice and then email it to the customer. The email tool needs the invoice ID from the first call. How should these calls be scheduled?',
  options: ['Both in parallel to save time', 'Sequentially: create invoice first, then send email using the returned ID', 'Send the email first, then create the invoice', 'Skip creating the invoice and just email'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Lệnh thứ hai phụ thuộc đầu ra của lệnh đầu tiên (invoice ID), nên phải gọi tuần tự. Gọi song song sẽ thiếu dữ liệu đầu vào cho email.

### Vì sao các phương án còn lại sai
- **A:** song song chỉ dùng cho các lệnh độc lập; ở đây email không thể gửi trước khi có ID hóa đơn.
- **C/D:** thứ tự logic ngược hoặc bỏ qua bước bắt buộc.`
},
{
  id: 'qz-cca-009',
  topic: 'claude',
  q: '[Agentic Architecture] A team splits a simple 3-step task into 20 subagents, one per step detail. What is the main risk?',
  options: ['Subagents will run faster than a single agent', 'Higher latency, higher cost, fragmented context, and harder debugging', 'The orchestrator becomes unnecessary', 'Each subagent gets a larger context window'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Chia nhỏ quá mức (over-decomposition) làm tăng số lượt gọi API, độ trễ cộng dồn, và mỗi subagent chỉ nhìn thấy một phần ngữ cảnh → dễ mất thông tin liên quan. Việc gỡ lỗi cũng khó hơn vì lỗi có thể nằm ở bất kỳ subagent nào.

### Vì sao các phương án còn lại sai
- **A:** nhiều subagent hơn thường chậm hơn vì chi phí điều phối và khởi tạo ngữ cảnh riêng.
- **C:** orchestrator vẫn cần thiết để điều phối và tổng hợp.
- **D:** mỗi subagent có ngữ cảnh riêng, thường nhỏ hơn ngữ cảnh tổng thể, không phải lớn hơn.`
},
{
  id: 'qz-cca-010',
  topic: 'claude',
  q: '[Agentic Architecture] You need to convert a CV into a fixed JSON schema (name, skills, experience). The schema is stable and the steps are known. Which approach is best?',
  options: ['A single structured-output call (JSON schema) instead of an autonomous agent', 'A fully autonomous agent that decides the steps itself', 'Five subagents, one per CV section', 'Message Batches API with 24-hour turnaround'],
  answer: 0,
  explain: `**Đáp án đúng: A.** Khi bước xử lý đã biết trước, định dạng đầu ra cố định, và không cần khám phá, workflow cố định (single call với structured outputs / JSON schema) rẻ, nhanh, dễ kiểm thử hơn agent tự trị. Agent lý tưởng cho việc đường đi không biết trước.

### Vì sao các phương án còn lại sai
- **B:** agent tự trị tốn nhiều lượt gọi và khó dự đoán; thừa cho việc có sẵn quy trình.
- **C:** chia ra năm subagent là over-decomposition cho một bài toán đơn giản.
- **D:** Batch API không phù hợp khi cần kết quả ngay và không có vòng lặp tool.`
},
{
  id: 'qz-cca-011',
  topic: 'claude',
  q: '[Agentic Architecture] You are planning a business trip: hotels, flights, and restaurants must be chosen, but you do not know which options exist yet. Which pattern fits best?',
  options: ['One fixed prompt that returns the whole itinerary', 'An autonomous agent that searches, compares, and books step by step', 'Message Batches API', 'Simple routing with no tool use'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Khi đường đi không biết trước (cần tìm hiểu, so sánh, quyết định dựa trên kết quả vừa tìm), agent tự trị phù hợp: nó gọi tool tìm kiếm, xem kết quả, rồi quyết định bước tiếp theo theo ngữ cảnh.

### Vì sao các phương án còn lại sai
- **A:** prompt cố định không thể biết trước các khách sạn và vé máy bay cụ thể.
- **C:** Batch API xử lý các request độc lập, không hỗ trợ vòng lặp tool theo kết quả trung gian.
- **D:** không có tool thì agent không thể tìm kiếm hay đặt chỗ.`
},
{
  id: 'qz-cca-012',
  topic: 'claude',
  q: '[Agentic Architecture] An agent has a tool to permanently delete a customer account. According to human-in-the-loop best practice, what should happen before the tool runs?',
  options: ['Run immediately because the agent decided it', 'Pause and ask a human to approve; show the account ID and reason', 'Log the deletion and notify the user afterwards', 'Delete only if the customer email contains the word "confirm"'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Hành động không đảo ngược được (xoá vĩnh viễn tài khoản) cần con người duyệt trước khi thực thi. Harness nên hiển thị thông tin cần thiết (ID tài khoản, lý do) và chờ xác nhận, thay vì tin vào bản quyết định của model.

### Vì sao các phương án còn lại sai
- **A:** model có thể hiểu sai hoặc bị injection; không nên tự thực thi hành động phá huỷ.
- **C:** thông báo sau khi xoá đã muộn; phải chặn trước khi hành động xảy ra.
- **D:** tìm từ khóa trong email không phải cơ chế ủy quyền đáng tin cậy.`
},
{
  id: 'qz-cca-013',
  topic: 'claude',
  q: '[Agentic Architecture] Which action generally does NOT require human approval before execution?',
  options: ['Grep application logs to investigate an incident (read-only)', 'Force-push to the main branch', 'Send an invoice to a customer', 'Drop a production database table'],
  answer: 0,
  explain: `**Đáp án đúng: A.** Đọc log là hành động chỉ đọc, không thay đổi hệ thống, nên thường không cần duyệt trước. Các hành động ghi dữ liệu, ảnh hưởng người dùng, hoặc khó đảo ngược nên có cổng duyệt.

### Vì sao các phương án còn lại sai
- **B:** force-push ghi đè lịch sử cộng đồng, khó khôi phục → cần duyệt.
- **C:** gửi hóa đơn ảnh hưởng khách hàng và tài chính → cần duyệt.
- **D:** xóa bảng dữ liệu là phá huỷ dữ liệu → cần duyệt và sao lưu trước.`
},
{
  id: 'qz-cca-014',
  topic: 'claude',
  q: '[Agentic Architecture] In the Claude Agent SDK, what is a key characteristic of a subagent compared to the main agent loop?',
  options: ['Subagents share the same message history automatically', 'Subagents run with isolated context; the orchestrator waits for the final result', 'Subagents cannot use any tools', 'Subagents always run on Anthropic\'s servers'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Subagent trong Agent SDK chạy trong ngữ cảnh riêng biệt: orchestrator giao một brief, subagent tự thực thi vòng lặp tool của mình, rồi chỉ trả kết quả cuối cùng về. Lịch sử chi tiết bên trong subagent không tự spill ngược vào transcript của orchestrator.

### Vì sao các phương án còn lại sai
- **A:** ngữ cảnh riêng là điểm khác biệt chính; nếu không, subagent không có ích riêng so với một lượt gọi lớn.
- **C:** subagent có tool, thường là tập hợp nhỏ gợi ý theo nhiệm vụ.
- **D:** Agent SDK chạy trên hạ tầng của bạn, không nhất thiết là server Anthropic.`
},
{
  id: 'qz-cca-015',
  topic: 'claude',
  q: '[Agentic Architecture] An agent wants to fetch data from 100 independent endpoints in one turn. What is a practical concern?',
  options: ['There is no concern; 100 parallel calls always work best', 'Too many concurrent calls can hit limits and make error handling hard; batch them into groups', 'Use a subagent for each endpoint', 'Use the Message Batches API instead of any tool calls'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Gọi song song quá nhiều lệnh trong một lượt có thể vượt quá giới hạn gọi song song, vượt context khi kết quả về, và khiến xử lý lỗi phức tạp (một lệnh lỗi ảnh hưởng toàn bộ lượt). Nên chia thành các đợt nhỏ hoặc dùng vòng lặp có kiểm soát.

### Vì sao các phương án còn lại sai
- **A:** số lượng lớn đồng thời không phải luôn tốt; có giới hạn hệ thống và chi phí xử lý kết quả.
- **C:** 100 subagent là over-decomposition nghiêm trọng.
- **D:** Batch API là xử lý bất đồng bộ cho hàng ngàn request, không thay tool call trong một tác vụ agent.`
},
{
  id: 'qz-cca-016',
  topic: 'claude',
  q: '[Agentic Architecture] An orchestrator fans out 8 parallel subagents and aggregates their summaries. Subagent results may arrive in any order. How should the orchestrator match results to the original tasks?',
  options: ['Assume results arrive in the same order as tasks were sent', 'Match each result by the request/task ID assigned when fanning out, not by position', 'Ignore results that arrive late', 'Restart the whole fan-out if any result is late'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Kết quả song song không đảm bảo thứ tự về. Harness nên gán mỗi task một ID (custom_id) khi gửi, rồi ghép kết quả theo ID. Giống như Message Batches API, thứ tự vị trí không đáng tin cậy.

### Vì sao các phương án còn lại sai
- **A:** thứ tự về không garant; ghép theo vị trí sẽ gán nhầm nội dung cho task khác.
- **C:** kết quả muộn vẫn có giá trị; không nên bỏ qua.
- **D:** khởi động lại tốn chi phí và không giải quyết vấn đề thứ tự.`
},
{
  id: 'qz-cca-017',
  topic: 'claude',
  q: '[Agentic Architecture] A support agent must route user messages to either a billing specialist or a technical specialist. Which design is appropriate?',
  options: ['Let one autonomous agent handle everything without classification', 'Router pattern: classify intent first, then route to the specialized subagent', 'Use Message Batches API for every message', 'Always ask a human to choose the specialist'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Mẫu router: một lời gọi phân loại ý định (rất rẻ, có thể dùng structured output với enum nhãn), sau đó route sang subagent chuyên môn. Giảm chi phí, dễ kiểm thử, và mỗi subagent chỉ cần tập trung vào một lĩnh vực.

### Vì sao các phương án còn lại sai
- **A:** một agent làm tất cả dễ nhầm lẫn và tốn nhiều tool hơn cần thiết.
- **C:** Batch API không xử lý tin nhắn chat theo thời gian thực.
- **D:** hỏi người dùng cho mỗi tin nhắn làm chậm trải nghiệm và không cần thiết.`
},
{
  id: 'qz-cca-018',
  topic: 'claude',
  q: '[Agentic Architecture] When giving tools to a subagent, which principle reduces wrong tool calls?',
  options: ['Give every available tool to every subagent', 'Give only the tools the subagent needs for its task (least privilege)', 'Do not give descriptions for the tools', 'Let the subagent invent its own tools'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Nguyên tắc tối thiểu quyền: mỗi subagent chỉ nhận tool liên quan đến nhiệm vụ. Ít lựa chọn hơn nghĩa là ít cơ hội model chọn nhầm tool, và mô tả tool rõ ràng còn quan trọng hơn số lượng tool.

### Vì sao các phương án còn lại sai
- **A:** quá nhiều tool tương tự làm mô hồ kết luận khi chọn tool, dẫn gọi nhầm.
- **C:** mô tả là yếu tố quan trọng nhất giúp model chọn tool đúng.
- **D:** subagent không thể tạo ra tool mới ngoài danh sách bạn khai báo.`
},
{
  id: 'qz-cca-019',
  topic: 'claude',
  q: '[Agentic Architecture] An agent can publish articles to a public blog. Publishing is hard to undo. What is the right human-in-the-loop design?',
  options: ['Publish immediately when the agent finishes the draft', 'Show the draft to a human for approval before calling the publish tool', 'Publish and delete the article if the user complains later', 'Never allow the agent to write drafts'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Hành động khó đảo ngược (xuất bản công khai) cần con người kiểm duyệt và duyệt trước khi tool publish được gọi. Harness hiển thị bản nháp, chờ nút duyệt, rồi mới thực thi.

### Vì sao các phương án còn lại sai
- **A:** xuất bản ngay có thể lỡ bài chưa sẵn sàng hoặc chứa thông tin sai.
- **C:** xóa sau khi phàn nàn đã làm ảnh hưởng độc giả; không phải quy trình chủ động.
- **D:** viết bản nháp là an toàn và hữu ích; không cần cấm hoàn toàn.`
},
{
  id: 'qz-cca-020',
  topic: 'claude',
  q: '[Agentic Architecture] A coding agent chains three subagents: planner → coder → reviewer, and the reviewer spawns yet another subagent to check formatting. What is the risk of deep subagent chaining?',
  options: ['It always improves quality', 'Each level adds latency, cost, and context loss, making the flow harder to debug', 'Deep chaining reduces the total number of tool calls', 'It makes the context window larger'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Mỗi cấp subagent mới tốn một lượt gọi API, khởi tạo ngữ cảnh riêng, và có thể làm mất thông tin từ cấp trên. Chuỗi sâu rất khó theo dõi khi lỗi xảy ra: không biết sai ở planners, coder, hay reviewer cấp hai.

### Vì sao các phương án còn lại sai
- **A:** chất lượng không nhất thiết tăng; đôi khi nhiều lớp hơn càng làm suy yếu thông tin.
- **C:** thêm subagent là thêm lượt gọi, không giảm.
- **D:** ngữ cảnh mỗi cấp là riêng và thường nhỏ hơn, không làm lớn bối cảnh tổng thể.`
},
{
  id: 'qz-cca-021',
  topic: 'claude',
  q: '[Agentic Architecture] A research agent needs to compare five competing products by visiting their public pages. When is a subagent a good fit here?',
  options: ['Never; one agent must do everything', 'Assign one subagent per product page so they research in parallel', 'Use one subagent per paragraph of the final report', 'Avoid tools entirely and ask the model from memory'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Năm trang web độc lập có thể được nghiên cứu song song bởi năm subagent, mỗi subagent tập trung vào một sản phẩm, rồi orchestrator tổng hợp báo cáo so sánh. Đây là phân chia công việc hợp lý: độc lập, song song, ngữ cảnh từng phần manageable.

### Vì sao các phương án còn lại sai
- **A:** một agent làm hết vẫn được, nhưng song parallel qua subagent nhanh hơn cho nhiều nguồn độc lập.
- **C:** chia mỗi đoạn văn là over-decomposition, đoạn văn phụ thuộc lẫn nhau và nhỏ lắm.
- **D:** không có tool thì model không thể xem trang web thật, chỉ bịa từ bộ nhớ.`
},
{
  id: 'qz-cca-022',
  topic: 'claude',
  q: '[Agentic Architecture] An agent only needs to grep one log file for an error string. What should the orchestrator do?',
  options: ['Spawn a dedicated subagent for the grep', 'Call the grep tool directly in the main loop; no subagent needed', 'Use Message Batches API', 'Ask the user to run grep manually'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Việc đơn giản, tuần tự, tác dụng ngay (grep một file) nên làm trực tiếp trong vòng lặp chính. Tạo subagent cho một lệnh là over-decomposition: tốn thêm lượt gọi và khởi tạo ngữ cảnh không cần thiết.

### Vì sao các phương án còn lại sai
- **A:** subagent cho một grep là chi phí cao không đáng.
- **C:** Batch API xử lý hàng ngàn request độc lập, không phù hợp một lệnh.
- **D:** agent có tool thì không cần nhờ người dùng chạy lệnh tay.`
},
{
  id: 'qz-cca-023',
  topic: 'claude',
  q: '[Agentic Architecture] A subagent finishes its work and returns a summary to the orchestrator. Does the orchestrator automatically see all messages inside the subagent?',
  options: ['Yes, the full subagent transcript is merged automatically', 'No; only the result returned by the subagent is visible to the orchestrator', 'Only if the subagent uses the same model', 'Only when thinking blocks are enabled'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Ngữ cảnh của subagent bị kín lại với orchestrator. Orchestrator chỉ nhận kết quả cuối cùng (summary hoặc dữ liệu) mà subagent chọn gửi về. Nếu chi tiết bên trong cần thiết, subagent phải tự đưa vào kết quả trả về.

### Vì sao các phương án còn lại sai
- **A:** transcript bên trong không tự hợp nhất; điều đó sẽ phá vỡ mục đích ngữ cảnh riêng.
- **C/D:** model và thinking block không thay đổi quy tắc nhìn kín ngữ cảnh.`
},
{
  id: 'qz-cca-024',
  topic: 'claude',
  q: '[Agentic Architecture] A worker subagent calls five tools internally and then returns the final answer. What does the orchestrator receive?',
  options: ['Five separate tool_result messages from the worker', 'Only the final answer the worker chooses to return', 'Nothing; workers cannot return results', 'The raw transcript of the worker'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Từ góc nhìn orchestrator, subagent là một "hộp đen": nó tự quản lý vòng lặp tool bên trong, rồi trả về một kết quả cuối cùng. Các tool_result bên trong subagent không lộ ra transcript của orchestrator.

### Vì sao các phương án còn lại sai
- **A:** orchestrator không thấy tool_result nội bộ của subagent.
- **C:** subagent được thiết kế để trả về kết quả.
- **D:** raw transcript bị kín, không gửi ngược.`
},
{
  id: 'qz-cca-025',
  topic: 'claude',
  q: '[Agentic Architecture] For a legal document, you want separate stages: draft, review against criteria, then revise. Each stage must be logged and scored independently. Which pattern fits?',
  options: ['One agent call with maximum effort', 'Prompt chaining: separate API calls for draft, review, and revise', 'Let an autonomous agent decide whether to review', 'Ten few-shot examples in one prompt'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Prompt chaining chia tác vụ thành các cuộc gọi API riêng biệt: bản nháp → đánh giá theo tiêu chí → sửa lại. Mỗi bước là một call riêng nên bạn có thể log, chấm điểm và rẽ nhánh theo từng điểm kiểm soát. Dùng cho tài liệu pháp lý cần kiểm soát chặt chẽ.

### Vì sao các phương án còn lại sai
- **A:** một cuộc gọi không cho bạn kiểm soát hay log ở các bước trung gian.
- **C:** agent tự quyết định sẽ bỏ qua hoặc thay đổi pipeline, khó kiểm chứng từng bước.
- **D:** few-shot giúp định dạng nhưng không tạo ra các bước xử lý riêng biệt.`
},
{
  id: 'qz-cca-026',
  topic: 'claude',
  q: '[Agentic Architecture] For audit purposes, what should an agent harness record for every tool call?',
  options: ['Only the final answer given to the user', 'Tool name, input, output (or error), timestamps, and any human approval decision', 'Nothing; the model provider logs everything', 'Only successful tool calls'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Để kiểm toán và gỡ lỗi agent, harness cần ghi từng lệnh tool: tên tool, tham số đầu vào, kết quả hoặc lỗi, thời điểm, và nếu có, quyết định duyệt của con người. Điều này giúp biết genau agent đã làm gì và tại sao.

### Vì sao các phương án còn lại sai
- **A:** câu trả lời cuối không đủ để tái tạo hành vi agent ở giữa chừng.
- **C:** nhà cung cấp model không nhìn vào logic tool bên phía ứng dụng của bạn.
- **D:** lệnh tool thất bại cũng quan trọng để hiểu lỗi và cải thiện prompt.`
},
{
  id: 'qz-cca-027',
  topic: 'claude',
  q: '[Agentic Architecture] An agent can deploy code to production, which is hard to roll back. What control should be in place before the deploy tool runs?',
  options: ['No control; trust the agent', 'Human approval gate showing the commit and target environment before execution', 'Deploy only if tests pass locally, decided by the agent', 'Deploy on every message from the user'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Triển khai sản xuất khó đảo ngược nên cần cổng duyệt con người: hiển thị commit và môi trường đích, chờ xác nhận, rồi mới gọi tool deploy. Quyết định của agent alone không đủ cho hành động này.

### Vì sao các phương án còn lại sai
- **A:** tin tưởng agent hoàn toàn với hành động phá huỷ là rủi ro cao.
- **C:** agent có thể hiểu sai "tests pass" hoặc bỏ qua điều kiện; con người cần xác nhận.
- **D:** triển khai mỗi tin nhắn là sai logic và nguy hiểm.`
},
{
  id: 'qz-cca-028',
  topic: 'claude',
  q: '[Agentic Architecture] For the router pattern, why is structured output with an enum of labels better than free-text classification?',
  options: ['Free text is always more accurate', 'Enum output is deterministic, easy to parse, and simple to route in code', 'Structured output costs more per call', 'Enum labels cannot be changed later'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Structured output với enum (ví dụ billing, technical, general) trả về giá trị cố định, parse dễ dàng trong code, và route trực tiếp sang subagent tương ứng. Dễ kiểm thử và đánh giá hơn văn bản tự do.

### Vì sao các phương án còn lại sai
- **A:** văn bản tự do dễ sai định dạng, cần parse phức tạp, và khó route chính xác.
- **C:** structured output không tốn nhiều hơn văn bản tự do đáng kể.
- **D:** nhãn có thể cập nhật khi schema thay đổi; không phải vĩnh viễn.`
},
{
  id: 'qz-cca-029',
  topic: 'claude',
  q: '[Agentic Architecture] You need to fetch a user record, then transform it with a fixed JavaScript function. The steps never change. Should you use an agent?',
  options: ['Yes, every task should use an agent', 'No; use a fixed workflow (single call or simple code) since steps are known and deterministic', 'Yes, but with five subagents', 'Only if you use Message Batches API'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Khi các bước đã biết trước vàkhông thay đổi (fetch rồi transform bằng hàm cố định), agent là over-engineering. Dùng một cuộc gọi hoặc code thuần trực tiếp, rẻ và dễ bảo trì hơn.

### Vì sao các phương án còn lại sai
- **A:** không phải mọi bài toán cũng cần agent; agent có chi phí và độ trễ cao hơn.
- **C:** năm subagent là over-decomposition nghiêm trọng.
- **D:** Batch API không thay thế việc quyết định dùng agent hay không.`
},
{
  id: 'qz-cca-030',
  topic: 'claude',
  q: '[Agentic Architecture] You need to research an issue but do not know which APIs or data sources to call yet. Which pattern fits best?',
  options: ['Fixed workflow with hardcoded calls', 'Autonomous agent that chooses tools based on findings', 'Message Batches API', 'One structured-output call'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Khi đường đi không biết trước và agent cần khám phá (tìm log, xem API, đọc tài liệu, rồi quyết định bước tiếp theo), agent tự trị phù hợp vì nó điều chỉnh công cụ dựa trên kết quả vừa thu được.

### Vì sao các phương án còn lại sai
- **A:** workflow cố định không thể hardcode các bước bạn chưa biết trước.
- **C:** Batch API không có vòng lặp quyết định theo kết quả trung gian.
- **D:** một cuộc gọi structured output không thực hiện được nhiều bước tìm kiếm linh hoạt.`
},
{
  id: 'qz-cca-031',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] Which statements about parallel tool calls in one agent turn are true? (Choose 2)',
  options: ['Independent calls (fetch profile, fetch catalog) can run in parallel in the same turn', 'A call that needs another call\'s output should run after it, sequentially', 'Each tool result must be sent in its own separate user message', 'Tool results always come back in the same order they were called', 'Parallel calls never affect cost or latency'],
  answer: [0, 1],
  explain: `**Đáp án đúng: A, B.** Lệnh độc lập có thể chạy song song trong cùng một lượt để giảm độ trễ; lệnh phụ thuộc đầu ra của lệnh khác phải chạy tuần sau.

### Vì sao các phương án còn lại sai
- **C:** tất cả tool_result của một lượt phải nằm trong **một** tin nhắn user, không phải mỗi cái một tin nhắn.
- **D:** thứ tự kết quả song song không garant; nên ghép theo tool_use_id/task ID, không theo vị trí.
- **E:** gọi song song vẫn tốn token cho mỗi kết quả và có thể làm phức tạp xử lý lỗi; không phải "không ảnh hưởng chi phí hay độ trễ".`
},
{
  id: 'qz-cca-032',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] Which actions generally require human approval before a tool runs? (Choose 2)',
  options: ['Delete a customer account permanently', 'Deploy code to production', 'Grep application logs for an incident (read-only)', 'Read a local file', 'Search the product catalog'],
  answer: [0, 1],
  explain: `**Đáp án đúng: A, B.** Xoá tài khoản và triển khai sản xuất là hành động khó đảo ngược hoặc ảnh hưởng người dùng, nên cần con người duyệt trước khi thực thi.

### Vì sao các phương án còn lại sai
- **C:** đọc log là chỉ đọc, không thay đổi hệ thống, thường không cần duyệt trước.
- **D:** đọc file cục bộ cũng chỉ đọc, rủi ro thấp.
- **E:** tìm kiếm danh sách sản phẩm chỉ đọc dữ liệu công khai, không cần duyệt.`
},
{
  id: 'qz-cca-033',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] What are good reasons to use subagents in a hub-and-spoke design? (Choose 2)',
  options: ['Give each subagent an isolated context so it does not carry the full orchestrator history', 'Use a cheaper, faster model for simple worker tasks', 'Every subagent must use the same model as the orchestrator', 'Subagents make the context window infinitely large', 'One subagent per line of code is always best'],
  answer: [0, 1],
  explain: `**Đáp án đúng: A, B.** Subagent có ngữ cảnh riêng (không mang lịch sử của orchestrator) và có thể dùng model nhỏ rẻ hơn cho việc đơn giản, giúp giảm chi phí và giữ ngữ cảnh tập trung.

### Vì sao các phương án còn lại sai
- **C:** mỗi subagent có thể chọn model riêng theo nh workload; không bắt buộc giống orchestrator.
- **D:** ngữ cảnh không vô hạn; mỗi subagent vẫn bị giới hạn context window của riêng nó.
- **E:** một subagent mỗi dòng mã là over-decomposition, làm chậm và tốn tiền.`
},
{
  id: 'qz-cca-034',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] When should you choose a fixed workflow instead of an autonomous agent? (Choose 2)',
  options: ['The steps are known ahead of time and deterministic', 'The task is cheap, repeated often, and easy to test', 'You do not know which tools or data sources you need yet', 'The task requires exploring many unknown APIs', 'You want the model to decide the steps freely'],
  answer: [0, 1],
  explain: `**Đáp án đúng: A, B.** Workflow cố định phù hợp khi quy trình đã biết,không thay đổi, lặp lại nhiều, và rẻ/dễ kiểm thử. Agent tự trị dành cho việc đường đi không biết trước.

### Vì sao các phương án còn lại sai
- **C/D:** đây là trường hợp nên dùng agent (cần khám phá).
- **E:** muốn model tự do quyết định bước là đặc điểm của agent, không phải workflow cố định.`
},
{
  id: 'qz-cca-035',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] Which statements about the basic agent loop are correct? (Choose 3)',
  options: ['Every tool_use block must get a matching tool_result before the model continues', 'tool_result must carry the tool_use_id of the block it answers', 'A tool_use whose input was cut off by max_tokens should not be executed', 'The harness can skip sending tool_result for tools it decides not to run', 'stop_reason end_turn means there was an error'],
  answer: [0, 1, 2],
  explain: `**Đáp án đúng: A, B, C.** Mỗi tool_use cần tool_result kèm tool_use_id trùng khớp; nếu input bị cắt (max_tokens), không nên chạy tool vì dữ liệu thiếu có thể gây hại; end_turn nghĩa là hoàn tác, không phải lỗi.

### Vì sao các phương án còn lại sai
- **D:** bỏ tool_result khiến request sau lỗi 400 vì có tool_use chưa được trả lời. Nếu không chạy tool, vẫn phải gửi tool_result với is_error và lý do.
- **E:** end_turn là model kết thúc tác vụ bình thường.`
},
{
  id: 'qz-cca-036',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] When writing a brief for a subagent, which items should it include? (Choose 3)',
  options: ['The goal and scope of the task', 'Inputs needed (repository path, failing test names, environment variables)', 'Expected output format and stop condition', 'The API key the subagent should use', 'The full chat history of the orchestrator'],
  answer: [0, 1, 2],
  explain: `**Đáp án đúng: A, B, C.** Brief phải tự chứa đủ: mục tiêu, phạm vi, đầu vào cần thiết, định dạng đầu ra và khi nào dừng. Vì subagent không xem lịch sử của orchestrator.

### Vì sao các phương án còn lại sai
- **D:** subagent không dùng API key riêng; nó chạy dưới cấu hình của phiên cha.
- **E:** lịch sử orchestrator không tự động gửi qua; đó là lý do brief phải tự đầy đủ.`
},
{
  id: 'qz-cca-037',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] What are risks of over-decomposing a task into too many subagents? (Choose 2)',
  options: ['Higher total latency and API cost', 'Each subagent only sees part of the context (context fragmentation)', 'Subagents run faster than a single agent', 'Debugging becomes easier because each subagent is tiny', 'The context window becomes unlimited'],
  answer: [0, 1],
  explain: `**Đáp án đúng: A, B.** Quá nhiều subagent làm tăng số lượt gọi, độ trễ cộng dồn, và mỗi subagent chỉ nhìn thấy một phần ngữ cảnh → dễ bị lỡ thông tin; gỡ lỗi cũng khó hơn khi lỗi có thể ở bất kỳ subagent nào.

### Vì sao các phương án còn lại sai
- **C:** nhiều subagent thường chậm hơn do chi phí điều phối và khởi tạo ngữ cảnh riêng.
- **D:** gỡ lỗi khó hơn, không dễ hơn, vì luồng bị chia nhỏ.
- **E:** ngữ cảnh không vô hạn; mỗi subagent vẫn có giới hạn context window riêng.`
},
{
  id: 'qz-cca-038',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] Which statements about the router pattern are true? (Choose 2)',
  options: ['Classify the user intent first, then route to a specialized subagent', 'A cheap model with structured output enum can do the classification', 'Every message must go through all subagents', 'The router makes the system harder to test than one big agent', 'Routing works only with Message Batches API'],
  answer: [0, 1],
  explain: `**Đáp án đúng: A, B.** Router phân loại ý định bằng một cuộc gọi rẻ (thường structured output với enum nhãn), rồi chuyển đến subagent chuyên môn. Mỗi subagent tập trung một lĩnh vực, dễ kiểm thử và guardian.

### Vì sao các phương án còn lại sai
- **C:** mỗi tin nhắn chỉ route đến subagent phù hợp, không phải qua tất cả.
- **D:** chia nhỏ theo lĩnh vực thường dễ kiểm thử hơn một agent làm hết.
- **E:** router là cuộc gọi thông thường, không cần Batch API.`
},
{
  id: 'qz-cca-039',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] How can a harness implement a human approval gate before a tool runs? (Choose 2)',
  options: ['Inspect the tool call in the message yielded before executing, and ask the user', 'Run the tool first and ask for forgiveness later', 'Show the tool name and input to the user, then wait for approve/reject', 'Always auto-approve because the model is always right', 'Ask approval only after the tool result is back'],
  answer: [0, 2],
  explain: `**Đáp án đúng: A, C.** Trước khi chạy tool, harness xem xét lời gọi tool (ví dụ trong message mà Tool Runner yield ra), hiển thị tên tool và tham số, chờ người dùng đồng ý hoặc từ chối. Nếu từ chối, gửi tool_result với is_error và lý do thay vì thực thi.

### Vì sao các phương án còn lại sai
- **B:** chạy trước rồi xin lỗi sau là sai với hành động khó đảo ngược (xoá dữ liệu, gửi tiền).
- **D:** model không phải luôn đúng; có thể hiểu sai hoặc bị injection.
- **E:** phê duyệt sau khi chạy đã muộn; hành động đã xảy ra.`
},
{
  id: 'qz-cca-040',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] Which statements are true when comparing Claude Code subagents (.claude/agents) and Agent SDK subagents? (Choose 2)',
  options: ['Both give the subagent an isolated context from the orchestrator', 'Claude Code subagents are defined as files in .claude/agents/; Agent SDK subagents are configured programmatically', 'Only Claude Code subagents can use tools', 'Both always run on Anthropic\'s servers', 'Agent SDK subagents cannot use a different model than the orchestrator'],
  answer: [0, 1],
  explain: `**Đáp án đúng: A, B.** Cả hai kiểu subagent đều chạy trong ngữ cảnh riêng biệt. Trong Claude Code, subagent định nghĩa qua file trong .claude/agents/; trong Agent SDK, subagent được cấu hình bằng code khi bạn xây harness.

### Vì sao các phương án còn lại sai
- **C:** cả hai đều có thể cấp tool cho subagent.
- **D:** hai cách này chạy trên hạ tầng của bạn (hoặc máy local), không nhất thiết server Anthropic.
- **E:** mỗi subagent có thể chọn model riêng, không bắt buộc giống orchestrator.`
},
{
  id: 'qz-cca-041',
  topic: 'claude',
  q: '[Agentic Architecture] An agent encounters a tool_call_timeout error after 60 seconds. What should the harness do?',
  options: ['Retry the same tool call immediately', 'Return the error to the model so it can decide next steps', 'Skip the tool and continue with the next tool_use', 'Cancel the entire agent run'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Khi tool gọi timeout, harness nên trả error về cho model (qua tool_result với is_error). Model có thể thử tool khác, giảm yêu cầu, hoặc báo lỗi cho user. Đây là cách model vẫn kiểm soát luồng thay vì harness tự quyết động.

### Vì sao các phương án còn lại sai
- **A:** retry ngay có thể tiếp tục timeout, tạo vòng lặp vô hạn.
- **C:** bỏ qua tool lỗi khiến model thiếu dữ liệu cần thiết.
- **D:** hủy toàn bộ run là quyết định quá mạnh; model có thể xử lý được.`
},
{
  id: 'qz-cca-042',
  topic: 'claude',
  q: '[Agentic Architecture] When should you use the Message Batches API instead of real-time agent calls?',
  options: ['For interactive customer support chats', 'For processing 10,000 independent document classifications asynchronously', 'For a single coding task with tool use', 'When you need the result immediately'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Message Batches API dành cho hàng ngàn request độc lập xử lý bất đồng bộ (tới 24 giờ), phù hợp khi không cần kết quả ngay và các task không phụ thuộc nhau. Classification 10,000 tài liệu là use case lý tưởng.

### Vì sao các phương án còn lại sai
- **A:** chat tương tác cần kết quả ngay → dùng real-time API.
- **C:** coding task với tool cần vòng lặp agent → real-time.
- **D:** cần kết quả ngay thì không dùng Batch.`
},
{
  id: 'qz-cca-043',
  topic: 'claude',
  q: '[Agentic Architecture] Which Claude API feature allows the model to "think" before generating a response?',
  options: ['The thinking block, enabled via thinking: { type: "enabled" }', 'The system prompt only', 'The max_tokens parameter', 'The temperature setting'],
  answer: 0,
  explain: `**Đáp án đúng: A.** Claude API hỗ trợ thinking blocks (Extended Thinking) được bật qua tham số thinking: { type: "enabled" }. Model sẽ tạo một block nội suy trước khi trả lời, giúp suy nghĩ từng bước cho các bài toán phức tạp.

### Vì sao các phương án còn lại sai
- **B:** system prompt định hướng nhưng không tạo thinking block riêng.
- **C:** max_tokens giới hạn độ dài output, không liên quan đến suy nghĩ trước.
- **D:** temperature kiểm soát độ ngẫu nhiên, không phải cơ chế think before answer.`
},
{
  id: 'qz-cca-044',
  topic: 'claude',
  q: '[Agentic Architecture] A tool returns a very large response (500KB) that exceeds the context window. What is the best approach?',
  options: ['Truncate the response to fit the window', 'Summarize the response with another model call before passing to the agent', 'Skip passing the response to the agent entirely', 'Increase max_tokens to infinity'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Khi response quá lớn, nên tóm tắt bằng một cuộc gọi riêng (có thể dùng model nhỏ rẻ) rồi mới gửi tóm tắt cho agent. Điều này giữ thông tin quan trọng mà không vượt context.

### Vì sao các phương án còn lại sai
- **A:** truncate có thể mất thông tin cần thiết.
- **C:** bỏ qua hoàn toàn khiến agent thiếu dữ liệu.
- **D:** max_tokens không thể vô hạn và không giải quyết vấn đề context.`
},
{
  id: 'qz-cca-045',
  topic: 'claude',
  q: '[Agentic Architecture] What is the primary purpose of the tool_choice parameter in the Claude API?',
  options: ['To force the model to use a specific tool', 'To let the model decide which tool to use, or force no tool', 'To limit the number of tools available', 'To disable all tool definitions'],
  answer: 1,
  explain: `**Đáp án đúng: B.** tool_choice cho phép bạn: auto (model tự quyết), any (bắt buộc gọi tool), hoặc none (không gọi tool). Dùng để kiểm soát hành vi model khi cần.

### Vì sao các phương án còn lại sai
- **A:** không thể force một tool cụ thể; chỉ có thể bắt buộc gọi tool (any) hoặc không gọi (none).
- **C:** giới hạn tool dùng tool_definition, không phải tool_choice.
- **D:** tool_choice không disable definitions; để làm điều đó không truyền tool trong request.`
},
{
  id: 'qz-cca-046',
  topic: 'claude',
  q: '[Agentic Architecture] In an agent loop, the model returns stop_reason "max_tokens" with an incomplete tool_use block. What should the harness do?',
  options: ['Execute the incomplete tool_use with the partial input', 'Return the partial output as tool_result with is_error: true, letting the model decide', 'Ignore the incomplete tool_use and continue', 'Restart the entire request with higher max_tokens'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Khi input bị cắt do max_tokens, tool không có đủ dữ liệu đầu vào. Harness nên báo lỗi qua tool_result để model biết và có thể yêu cầu lại hoặc thử cách khác.

### Vì sao các phương án còn lại sai
- **A:** chạy tool với input thiếu có thể gây lỗi hoặc kết quả sai.
- **C:** bỏ qua khiến model thiếu phản hồi và có thể tiếp tục sai.
- **D:** restart với max_tokens cao hơn là một chiến lược hợp lý nhưng không phải câu trả lời "phải làm gì" với incomplete tool_use hiện tại.`
},
{
  id: 'qz-cca-047',
  topic: 'claude',
  q: '[Agentic Architecture] Which is a valid reason to persist agent state between sessions?',
  options: ['To save money on API calls', 'To resume a long-running task after a system restart', 'To make the agent run faster', 'To reduce the number of tools needed'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Agent state (message history, tool results) có thể được lưu để resume tác vụ dài sau khi hệ thống restart hoặc user quay lại. Điều này quan trọng cho các tác vụ multi-hour.

### Vì sao các phương án còn lại sai
- **A:** persist state không giảm API call; thậm chí có thể tăng vì phải gửi lại history.
- **C:** persist không làm agent nhanh hơn; thêm data có thể tăng latency.
- **D:** số tool không liên quan đến state persistence.`
},
{
  id: 'qz-cca-048',
  topic: 'claude',
  q: '[Agentic Architecture] What does it mean when the Claude API returns stop_reason "stop_sequence"?',
  options: ['The model completed the task successfully', 'The model hit a custom stop sequence you defined', 'The response was truncated', 'There was an error in the request'],
  answer: 1,
  explain: `**Đáp án đúng: B.** stop_sequence là một chuỗi tuỳ chỉnh (do bạn định nghĩa trong request) mà khi model gõ ra, API sẽ dừng lại ngay. Dùng để kiểm soát khi nào model dừng tạo text.

### Vì sao các phương án còn lại sai
- **A:** hoàn thành task là end_turn, không phải stop_sequence.
- **C:** truncate là max_tokens.
- **D:** lỗi request trả về HTTP status khác, không phải stop_reason.`
},
{
  id: 'qz-cca-049',
  topic: 'claude',
  q: '[Agentic Architecture] In MCP (Model Context Protocol), what is the relationship between a client and a server?',
  options: ['MCP client is the agent, MCP server provides tools/resources', 'MCP server is the agent, MCP client provides tools', 'MCP has no server-client relationship', 'MCP only works with local files'],
  answer: 0,
  explain: `**Đáp án đúng: A.** MCP định nghĩa client-server: ứng dụng (agent, IDE) là client kết nối đến MCP server cung cấp tool, resource, và prompt. Server định nghĩa capabilities, client sử dụng.

### Vì sao các phương án còn lại sai
- **B:** ngược lại: client là ứng dụng dùng LLM, server cung cấp khả năng.
- **C:** MCP có rõ ràng client-server.
- **D:** MCP hỗ trợ cả local và remote servers.`
},
{
  id: 'qz-cca-050',
  topic: 'claude',
  q: '[Agentic Architecture] Which MCP component allows a server to push updates to the client without being asked?',
  options: ['Tools', 'Resources', 'Prompts', 'Sampling'],
  answer: 3,
  explain: `**Đáp án đúng: D.** Sampling (trong MCP) cho phép server gửi yêu cầu sampling (tạo LLM response) về client mà không cần client chủ động yêu cầu. Đây là cơ chế "push" duy nhất trong MCP spec.

### Vì sao các phương án còn lại sai
- **A:** Tools là remote procedure calls do client gọi.
- **B:** Resources do client request, không push.
- **C:** Prompts do client request.`
},
{
  id: 'qz-cca-051',
  topic: 'claude',
  q: '[Agentic Architecture] When testing an agent harness, what is the main challenge compared to testing regular code?',
  options: ['Agents always produce deterministic output', 'The agent can choose different tool combinations, making output non-deterministic', 'Agents cannot use tools in tests', 'Testing is not necessary for agents'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Agent có thể chọn nhiều đường đi khác nhau cho cùng một input, làm output có thể khác nhau. Testing cần cover nhiều paths, dùng mock tool, và định nghĩa rõ expected outcome thay vì exact output.

### Vì sao các phương án còn lại sai
- **A:** ngược lại hoàn toàn với thực tế.
- **C:** agent có thể và nên test với mock tools.
- **D:** testing rất cần thiết để đảm bảo harness hoạt động đúng.`
},
{
  id: 'qz-cca-052',
  topic: 'claude',
  q: '[Agentic Architecture] What is "prompt chaining" and when is it useful?',
  options: ['A single prompt that does everything', 'Multiple separate API calls where each output feeds into the next, for multi-step workflows', 'A way to chain multiple subagents together', 'A method to reduce API costs'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Prompt chaining chia tác vụ thành nhiều bước, mỗi bước là một API call riêng, output của bước trước là input của bước sau. Hữu ích khi cần kiểm soát từng bước, log riêng, hoặc rẽ nhánh.

### Vì sao các phương án còn lại sai
- **A:** single prompt là một call, không phải chaining.
- **C:** chaining subagent là một khái niệm khác (nested subagents).
- **D:** prompt chaining có thể tăng cost vì nhiều call hơn.`
},
{
  id: 'qz-cca-053',
  topic: 'claude',
  q: '[Agentic Architecture] Which metric is most important to track for agent cost optimization?',
  options: ['Number of users', 'Average tokens per task completion', 'Number of subagents', 'Response time only'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Tokens quyết định cost (prompt tokens + completion tokens). Track trung bình tokens/task giúp bạn biết efficiency của agent, phát hiện loops không cần thiết, và tối ưu prompt.

### Vì sao các phương án còn lại sai
- **A:** users không liên quan trực tiếp đến cost per task.
- **C:** số subagents chỉ là yếu tố ảnh hưởng, không phải metric chính.
- **D:** response time quan trọng nhưng cost được tính bằng tokens.`
},
{
  id: 'qz-cca-054',
  topic: 'claude',
  q: '[Agentic Architecture] An agent is stuck in a loop calling the same tool with the same input. What is likely the cause?',
  options: ['The model is too smart', 'The tool is returning the same result, and the model is not making progress', 'The API is down', 'The context window is too large'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Loop thường xảy ra khi tool luôn trả cùng kết quả (ví dụ: search không tìm thấy gì, model retry với cùng query). Model cần diverse input hoặc different strategy để thoát loop.

### Vì sao các phương án còn lại sai
- **A:** model "quá thông minh" không phải nguyên nhân.
- **C:** API down sẽ có error, không phải loop.
- **D:** context window lớn không gây loop.`
},
{
  id: 'qz-cca-055',
  topic: 'claude',
  q: '[Agentic Architecture] What is the purpose of temperature in Claude API, and when would you set it low?',
  options: ['Controls response length; set low for short answers', 'Controls randomness; set low for consistent, deterministic outputs', 'Controls speed; set low for faster responses', 'Controls context window; set low for more memory'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Temperature kiểm soát độ ngẫu nhiên của output (0 = gần như deterministic, 1 = nhiều variation). Set thấp khi bạn cần output nhất quán, ví dụ: classification, extraction, hay agent cần reproducible behavior.

### Vì sao các phương án còn lại sai
- **A:** length không phải temperature; dùng max_tokens cho length.
- **C:** temperature không ảnh hưởng đến speed.
- **D:** context window là tham số riêng.`
},
{
  id: 'qz-cca-056',
  topic: 'claude',
  q: '[Agentic Architecture] When building a multi-agent system, what is a key advantage of using MCP servers?',
  options: ['MCP servers run the agents directly', 'MCP provides a standardized way for agents to discover and use tools across different platforms', 'MCP eliminates the need for API keys', 'MCP automatically optimizes costs'],
  answer: 1,
  explain: `**Đáp án đúng: B.** MCP chuẩn hoá cách agent tìm và dùng tool/resource từ nhiều server khác nhau. Một agent có thể kết nối nhiều MCP server mà không cần biết chi tiết implementation của từng server.

### Vì sao các phương án còn lại sai
- **A:** MCP server cung cấp tools, không chạy agent.
- **C:** MCP không loại bỏ API keys.
- **D:** MCP không tự tối ưu cost.`
},
{
  id: 'qz-cca-057',
  topic: 'claude',
  q: '[Agentic Architecture] An agent needs to process a 5MB text file. What is the best approach?',
  options: ['Send the entire file in one prompt', 'Split the file into chunks and process sequentially', 'Use a vector database first', 'Refuse to process the file'],
  answer: 1,
  explain: `**Đáp án đúng: B.** File 5MB quá lớn cho context window. Chia thành các chunk nhỏ hơn (ví dụ 8K tokens), xử lý từng phần, rồi tổng hợp kết quả. Đây là cách thực tế nhất.

### Vì sao các phương án còn lại sai
- **A:** vượt context limit, request sẽ lỗi.
- **C:** vector database dùng cho search, không phải cho xử lý file.
- **D:** từ chối là over-conservative; có cách xử lý được.`
},
{
  id: 'qz-cca-058',
  topic: 'claude',
  q: '[Agentic Architecture] What is "tool recursion" in agent systems and why is it risky?',
  options: ['An agent calling itself as a tool', 'A tool that calls another tool, potentially creating deep call stacks', 'Using the same tool many times in one turn', 'A tool that returns an error'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Tool recursion xảy ra khi tool A gọi tool B, B gọi C... có thể tạo deep stack khó debug và predict. Rủi ro: infinite loop, context bloat, không biết ai responsible cho kết quả.

### Vì sao các phương án còn lại sai
- **A:** agent không tự gọi mình như tool.
- **C:** dùng same tool nhiều lần không gọi là recursion.
- **D:** error không liên quan đến recursion.`
},
{
  id: 'qz-cca-059',
  topic: 'claude',
  q: '[Agentic Architecture] In Claude Code, how do you restrict which tools a subagent can use?',
  options: ['In the system prompt', 'By specifying tools in the subagent .md file', 'You cannot restrict tools in Claude Code', 'By setting environment variables'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Trong Claude Code, subagent file (.claude/agents/xxx.md) có trường tools (mảng tên tool) để liệt kê tool được phép. Đây là cách enforce least privilege.

### Vì sao các phương án còn lại sai
- **A:** system prompt định hướng, không list tools.
- **C:** có thể restrict qua file definition.
- **D:** env vars không dùng để restrict tools.`
},
{
  id: 'qz-cca-060',
  topic: 'claude',
  q: '[Agentic Architecture] What happens if you set top_p very low (e.g., 0.1) in the Claude API?',
  options: ['The model becomes more creative', 'The model only considers the most probable tokens, making output more deterministic', 'The model ignores the temperature setting', 'The response becomes longer'],
  answer: 1,
  explain: `**Đáp án đúng: B.** top_p (nucleus sampling) kiểm soát token pool: chỉ consider tokens có cumulative probability ≤ top_p. Set thấp = chọn từ nhóm nhỏ nhất → output deterministic hơn, ít creative.

### Vì sao các phương án còn lại sai
- **A:** ngược lại: low top_p = ít creative.
- **C:** temperature và top_p là separate parameters, không ignore nhau.
- **D:** length không bị ảnh hưởng bởi top_p.`
},
{
  id: 'qz-cca-061',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] Which are valid strategies to handle a large tool response? (Choose 2)',
  options: ['Summarize the response with another LLM call', 'Truncate to fit context window', 'Stream the response to the user in real-time', 'Store in vector database and retrieve relevant parts', 'Refuse to process'],
  answer: [0, 3],
  explain: `**Đáp án đúng: A, D.** Summarize và store-then-retrieve là strategies hợp lý. Truncate mất thông tin; streaming không giải quyết vấn đề context; refuse là over-conservative.

### Vì sao các phương án còn lại sai
- **B:** truncate mất dữ liệu có thể quan trọng.
- **C:** streaming hiển thị cho user nhưng không thay đổi context limit.
- **E:** từ chối là không cần thiết khi có cách xử lý.`
},
{
  id: 'qz-cca-062',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] Which MCP components can a client use to interact with a server? (Choose 3)',
  options: ['Tools (remote procedure calls)', 'Resources (data that can be read)', 'Prompts (pre-built prompt templates)', 'Database (direct SQL queries)', 'Memory (persistent state)'],
  answer: [0, 1, 2],
  explain: `**Đáp án đúng: A, B, C.** MCP định nghĩa ba loại capability chính: tools (gọi function), resources (đọc data), và prompts (template). Database và Memory không phải MCP components.

### Vì sao các phương án còn lại sai
- **D/E:** không phải MCP components.`
},
{
  id: 'qz-cca-063',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] What are signs of an agent loop getting stuck? (Choose 2)',
  options: ['The same tool is called repeatedly with similar input', 'Token usage keeps growing without progress', 'The response gets faster each turn', 'Error rate increases', 'stop_reason is always "end_turn"'],
  answer: [0, 1],
  explain: `**Đáp án đúng: A, B.** Loop stuck thường thấy: same tool/similar input (model retry same strategy), token growth (context grows nhưng không tiến triển). Response speed và error rate không phải indicators chính; end_turn là normal.

### Vì sao các phương án còn lại sai
- **C:** loop thường chậm dần, không nhanh hơn.
- **D:** error rate có thể tăng nhưng không phải dấu hiệu đặc trưng.
- **E:** end_turn means completed, not stuck.`
},
{
  id: 'qz-cca-064',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] When should you consider using a more capable (expensive) model? (Choose 2)',
  options: ['For the orchestrator that makes routing decisions', 'For simple, repetitive tasks', 'For complex reasoning or multi-step planning', 'For all subagents uniformly', 'When budget is unlimited'],
  answer: [0, 2],
  explain: `**Đáp án đúng: A, C.** Model mạnh (Opus/Sonnet) dùng cho: orchestrator quyết định đường đi, và tasks cần complex reasoning. Simple tasks dùng cheap model (Haiku) để tiết kiệm.

### Vì sao các phương án còn lại sai
- **B:** simple tasks nên dùng cheap model.
- **D:** uniform model là lãng phí.
- **E:** budget unlimited không phải lý do kỹ thuật.`
},
{
  id: 'qz-cca-065',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] Which are valid ways to reduce agent costs? (Choose 2)',
  options: ['Use cheaper models for simple subagents', 'Cache tool results that are expensive to compute', 'Increase max_tokens to get more in each call', 'Reduce context window size', 'Skip error handling to save tokens'],
  answer: [0, 1],
  explain: `**Đáp án đúng: A, B.** Cost reduction: cheap model cho simple work, cache kết quả (ví dụ: user profile không thay đổi mỗi request). Tăng max_tokens tốn nhiều hơn; reduce context có thể break functionality; skip error handling nguy hiểm.

### Vì sao các phương án còn lại sai
- **C:** max_tokens cao hơn = nhiều tokens = cao hơn.
- **D:** context quá nhỏ có thể làm agent không đủ thông tin.
- **E:** skip error handling là bad practice, không liên quan đến cost optimization.`
},
{
  id: 'qz-cca-066',
  topic: 'claude',
  q: '[Agentic Architecture] An agent calls two tools in parallel: one appends a line to deploy.log, and another overwrites deploy.log with a summary. Both report success. What is the most likely problem?',
  options: ['The log will contain both entries in the exact order the tools were listed', 'One write may overwrite the other, losing data; parallel writes to the same resource are unsafe', 'Claude API automatically merges parallel tool results into one file', 'The second tool will fail because the file is locked by the first'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Khi hai tool chạy song song và đều ghi vào cùng một tệp, thứ tự hoàn thành không garant. Nó có thể ghi đè lẫn nhau: ví dụ công cụ A đang nối dòng mới vào cuối file trong khi công cụ B ghi đè toàn bộ file bằng bản tóm tắt, thì dòng của A bị mất. Đây là vấn đề race condition (tranh tài nguyên): nhiều tác vụ cùng truy cập hoặc ghi một tài nguyên chia sẻ mà không điều phối, dẫn đến kết quả không dự đoán được và có thể bị hỏng dữ liệu. Cách xử lý đúng là chạy các thao tác ghi cùng một tệp theo thứ tự tuần tự, hoặc chỉ để một công cụ chịu trách nhiệm ghi file sau khi đã thu thập hết dữ liệu cần thiết.

### Vì sao các phương án còn lại sai
- **A:** song song không đảm bảo thứ tự; hai lệnh ghi cùng một tệp không thể tự động sắp xếp đúng thứ tự.
- **C:** API Claude chỉ chuyển kết quả tool về cho model, không hiểu ý nghĩa nội dung file và không hợp nhất file cho bạn.
- **D:** không có cơ chế khóa file tự động trong tool gọi kiểu này; hai công việc đều báo thành công nhưng dữ liệu có thể đã bị mất.`
},
{
  id: 'qz-cca-067',
  topic: 'claude',
  q: '[Agentic Architecture] An agent can start a model training job that costs about $500 per hour. What control should be in place before the start-training tool runs?',
  options: ['Run immediately; the agent decides based on its own judgment', 'Human approval gate showing estimated cost, duration, and expected outcome before execution', 'Start the job and stop it only if the user complains later', 'Ask the model to estimate the cost and trust its estimate'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Hành động tốn kém và khó đảo ngược (huấn luyện mô hình tốn khoảng 500 USD mỗi giờ) cần cổng duyệt của con người trước khi thực thi. Harness nên hiện thông tin chi tiết (chi phí ước tính, thời gian chạy, kết quả mong đợi), chờ người dùng nhấn duyệt hoặc từ chối, rồi mới gọi tool. Điều này ngăn chặn việc agent vô tình gây chi phí lớn do hiểu nhầm yêu cầu.

### Vì sao các phương án còn lại sai
- **A:** agent có thể hiểu sai yêu cầu hoặc ưa chọn giải pháp tốn kém; không nên tin toàn bộ quyết định của model với hành động tốn phí lớn.
- **C:** dừng sau khi khách hàng phàn nàn đã gây thiệt hại tài chính; phải ngăn chặn trước khi hành động xảy ra.
- **D:** ước tính của model không chính xác 100% và không thay thế được sự đồng ý của con người.`
},
{
  id: 'qz-cca-068',
  topic: 'claude',
  q: '[Agentic Architecture] You want a subagent to reformat 200 Java files to a specific coding style. What makes the brief effective?',
  options: ['Only state the goal "reformat all files"; let the subagent guess the style', 'Goal, allowed tools, input/output format, before/after examples, and a clear stop condition', 'Paste the entire repository contents into the brief', 'Do not give a brief; subagents infer everything from context'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Subagent chạy trong ngữ cảnh riêng và không xem lịch sử của orchestrator, vì vậy brief phải tự chứa đủ mọi thứ: mục tiêu, phạm vi (200 file Java), tool được phép (đọc và ghi file), định dạng đầu vào/đầu ra, ví dụ trước/sau kiểu code, và điều kiện dừng (khi nào coi như xong). Ví dụ rõ giúp subagent hiểu chuẩn mực mà không cần hỏi lại, và điều kiện dừng tránh vòng lặp vô hạn.

### Vì sao các phương án còn lại sai
- **A:** chỉ có mục tiêu là không đủ; subagent không biết kiểu code mà bạn muốn và sẽ đoán sai.
- **C:** dán toàn bộ nội dung repository vào brief làm brief quá dài, tốn context, và chứa nhiều thông tin không cần thiết.
- **D:** subagent không thể suy luận mọi thứ; thiếu brief dẫn đến kết quả không ổn định và sai yêu cầu.`
},
{
  id: 'qz-cca-069',
  topic: 'claude',
  q: '[Agentic Architecture] An agent has been working for two hours and the conversation is approaching the context window limit. What should the harness do to keep the agent effective?',
  options: ['Keep adding every message; context is unlimited', 'Summarize earlier turns into a compact summary and continue with recent turns plus the summary', 'Start a brand new agent with no history', 'Delete the most recent turns'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Context window là giới hạn lượng text model có thể xử lý trong một lượt. Khi gần hết, harness nên tóm tắt các lượt trước thành một bản tóm tắt ngắn gọn (giữ lại quyết định quan trọng, kết quả tool, trạng thái công việc), rồi kết hợp bản tóm tắt đó với các lượt gần nhất để gửi lại model. Như vậy agent vẫn bám được bối cảnh mà không vượt giới hạn.

### Vì sao các phương án còn lại sai
- **A:** context window có giới hạn cố định; vượt quá sẽ khiến request bị lỗi.
- **C:** bắt đầu agent mới mất toàn bộ lịch sử, agent phải làm lại từ đầu và bỏ qua kết quả đã đạt được.
- **D:** xoá lượt gần nhất là xoá thông tin mới nhất và quan trọng nhất, làm agent mất bối cảnh hiện tại.`
},
{
  id: 'qz-cca-070',
  topic: 'claude',
  q: '[Agentic Architecture] An agent repeatedly fetches the same user profile that changes once per day. How to reduce cost and latency?',
  options: ['Fetch every time; never cache', 'Cache the result with a TTL (for example 24 hours) and reuse it within the TTL', 'Store the profile in a vector database', 'Ask the user for the profile on every request'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Nếu hồ sơ người dùng chỉ thay đổi một lần mỗi ngày, bạn có thể lưu kết quả vào bộ nhớ đệm (cache) với thời gian sống (TTL) ví dụ 24 giờ. Trong khoảng thời gian TTL, agent sử dụng bản cache thay vì gọi tool lại, giúp giảm số lần gọi API (tiết kiệm chi phí) và giảm độ chờ (giảm latency). Sau khi TTL hết, agent gọi tool lại để lấy bản mới nhất.

### Vì sao các phương án còn lại sai
- **A:** gọi lại mỗi lần tốn phí và thời gian trong khi dữ liệu không đổi.
- **C:** vector database dùng để tìm kiếm ngữ nghĩa, không phải để lưu đệm ngắn hạn có thời gian hết hạn.
- **D:** hỏi người dùng mỗi lần làm chậm trải nghiệm và dữ liệu đã có sẵn qua tool.`
},
{
  id: 'qz-cca-071',
  topic: 'claude',
  q: '[Agentic Architecture] A tool has failed five times in a row with the same error. What should the harness do?',
  options: ['Retry forever until it succeeds', 'Stop calling that tool, report the failure to the model or user, and try an alternative path', 'Ignore the errors and pretend the tool succeeded', 'Restart the entire agent session'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Khi một công cụ thất bại nhiều lần liên tiếp với cùng lỗi, thử lại vĩnh viễn sẽ tạo vòng lặp vô hạn, tốn phí và làm chậm hệ thống. Harness nên ngừng gọi công cụ đó, báo lỗi rõ ràng cho model hoặc người dùng, và chuyển sang hướng giải quyết thay thế (ví dụ dùng tool khác hoặc hỏi người dùng). Đây là mô hình circuit breaker (ngắt mạch): ngắt kết nối khi lỗi lặp lại để bảo vệ hệ thống.

### Vì sao các phương án còn lại sai
- **A:** thử lại vĩnh viễn không giải quyết nguyên nhân gốc của lỗi và tốn tài nguyên.
- **C:** giả vờ thành công khiến agent làm việc dựa trên dữ liệu sai, dẫn đến quyết định sai.
- **D:** khởi động lại toàn bộ session tốn phí và mất bối cảnh; không cần thiết nếu chỉ một công cụ bị lỗi.`
},
{
  id: 'qz-cca-072',
  topic: 'claude',
  q: '[Agentic Architecture] An agent fans out 50 parallel calls and hits Anthropic rate limits (HTTP 429). What is the best practice?',
  options: ['Retry all 50 calls immediately in parallel again', 'Split calls into smaller groups with backoff and retry on 429, respecting rate limits', 'Switch to a cheaper model to avoid rate limits', 'Reduce max_tokens to fix rate limits'],
  answer: 1,
  explain: `**Đáp án đúng: B.** HTTP 429 có nghĩa là bạn gửi quá nhiều request trong một khoảng thời gian (vượt quá rate limit của Anthropic). Cách xử lý đúng là chia 50 lệnh thành các đợt nhỏ hơn, gọi tuần tự hoặc ít song song, và khi nhận 429 thì đợi một khoảng thời gian (backoff) trước khi thử lại. Điều này tránh bị chặn tạm thời và giữ hệ thống ổn định.

### Vì sao các phương án còn lại sai
- **A:** thử lại ngay lập tức tất cả 50 lệnh sẽ tiếp tục vượt giới hạn, có thể dẫn đến bị chặn lâu hơn.
- **C:** đổi model rẻ hơn không thay đổi rate limit theo cách đó; rate limit gắn với tài khoản và endpoint.
- **D:** max_tokens chỉ điều khiển độ dài output, không liên quan đến số lượng request hay rate limit.`
},
{
  id: 'qz-cca-073',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] An orchestrator uses a subagent that returns structured JSON. Which practices reduce the risk of using bad subagent output? (Choose 2)',
  options: ['Validate the subagent output against a schema before using it', 'Trust the subagent output blindly; subagents never make mistakes', 'Ask the subagent to return output plus a confidence or rationale field and review low-confidence cases', 'Always run the subagent three times and pick the majority answer', 'Never let subagents return structured data'],
  answer: [0, 2],
  explain: `**Đáp án đúng: A, C.** Đầu ra của subagent có thể sai định dạng hoặc chứa thông tin không chính xác. Bạn nên xác thực (validate) output theo schema (ví dụ các trường bắt buộc, kiểu dữ liệu) trước khi dùng, và yêu cầu subagent kèm theo trường tin cậy hoặc lý do để bạn có thể kiểm tra lại các trường hợp confidence thấp. Hai cách này giúp phát hiện lỗi sớm trước khi ảnh hưởng đến quy trình chính.

### Vì sao các phương án còn lại sai
- **B:** subagent cũng có thể nhầm lẫn hoặc bỏ sót; tin tưởng mù lòa là nguyên nhân của lỗi production.
- **D:** chạy ba lần tốn ba lần phí và không đảm bảo câu trả lời đa số là đúng (cả ba lần có thể sai cùng cách).
- **E:** dữ liệu có cấu trúc dễ xử lý hơn; việc không bao giờ sử dụng dữ liệu có cấu trúc là không hợp lý và khó xử lý.`
},
{
  id: 'qz-cca-074',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] An agent works on a task that may take hours and could be interrupted. Which practices help it resume correctly? (Choose 2)',
  options: ['Persist agent state (message history, tool results, progress) to durable storage', 'Keep all state only in memory; restart from scratch if interrupted', 'Save checkpoints after each major step so the harness can reload and continue', 'Hope the system never restarts', 'Store state only in the model context window'],
  answer: [0, 2],
  explain: `**Đáp án đúng: A, C.** Đối với tác vụ chạy kéo dài hàng giờ, hệ thống có thể khởi động lại hoặc gián đoạn bất cứ lúc nào. Bạn nên lưu trạng thái agent (lịch sử tin nhắn, kết quả tool, tiến độ) vào lưu trữ bền vững và tạo điểm kiểm tra (checkpoint) sau mỗi bước quan trọng. Khi khôi phục, harness nạp trạng thái gần nhất và agent tiếp tục từ đó thay vì bắt đầu lại từ đầu.

### Vì sao các phương án còn lại sai
- **B:** chỉ lưu trong bộ nhớ thì mất hết khi khởi động lại; phải làm lại từ đầu.
- **D:** hy vọng hệ thống không khởi động lại không phải là chiến pháp đáng tin cậy.
- **E:** context window có giới hạn và bị mất khi phiên kết thúc; không thể dùng làm lưu trữ dài hạn.`
},
{
  id: 'qz-cca-075',
  topic: 'claude',
  multi: true,
  q: '[Agentic Architecture] Which improvements to a tool description help the model pick and use the tool correctly? (Choose 2)',
  options: ['Describe what the tool does, its parameters, required vs optional fields, and when to use it', 'Give every tool the same generic description so the model is not confused', 'Include example inputs/outputs and error meanings in the description', 'Make descriptions as short as possible (one word)', 'Never describe tools; the model knows them'],
  answer: [0, 2],
  explain: `**Đáp án đúng: A, C.** Mô tả tool là cách chính để model biết công cụ đó làm gì và khi nào gọi. Một mô tả tốt cần giải thích mục đích, danh sách tham số (bắt buộc và tùy chọn), và trường hợp sử dụng. Kèm ví dụ đầu vào/đầu ra và ý nghĩa các lỗi giúp model chọn đúng công cụ và xử lý lỗi thích hợp.

### Vì sao các phương án còn lại sai
- **B:** mô tả chung chung giống hệt nhau khiến model không phân biệt được công cụ nào dùng cho mục đích gì, dẫn đến gọi nhầm.
- **D:** mô tả quá ngắn không cung cấp đủ thông tin để model sử dụng đúng.
- **E:** model không biết công cụ trừ khi bạn khai báo và mô tả trong request.`
},
{
  id: 'qz-cca-076',
  topic: 'claude',
  q: '[Agentic Architecture] A user says "fix the bug" without specifying which bug or where it is. What should the agent do first?',
  options: ['Guess which bug and start fixing immediately', 'Ask the user for clarification before acting', 'Fix all bugs in the repository', 'Refuse to answer'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Khi yêu cầu của người dùng mơ hồ (không biết lỗi nào, nằm ở đâu), agent nên hỏi ngược lại để làm rõ thay vì đoán. Việc đoán có thể dẫn đến sửa nhầm chỗ, làm hỏng code, và bỏ lỡ lỗi thực sự. Một agent tốt xác định mục tiêu trước khi hành động.

### Vì sao các phương án còn lại sai
- **A:** đoán lỗi gây nguy cơ sửa nhầm, tạo ra lỗi mới, và lãng phí thời gian.
- **C:** sửa tất cả lỗi là không thực tế và không phải những gì người dùng hỏi.
- **D:** từ chối hoàn toàn không giúp ích; agent nên yêu cầu thêm thông tin để có thể phục vụ.`
},
{
  id: 'qz-cca-077',
  topic: 'claude',
  q: '[Agentic Architecture] An agent cannot resolve a customer issue after trying several tools. What is the best handoff design?',
  options: ['Drop the conversation silently', 'Escalate to a human with a summary of what was tried, tool results, and current state', 'Make up a solution to avoid escalation', 'Restart the agent from the beginning'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Khi agent đã thử nhiều cách nhưng chưa giải quyết được, nó nên chuyển tiếp cho người hỗ trợ nhân sự kèm theo bản tóm tắt: đã thử công cụ nào, kết quả của mỗi công cụ, và trạng thái hiện tại của vấn đề. Người hỗ trợ nắm bắt nhanh tình trạng mà không cần hỏi lại khách hàng từ đầu, làm trải nghiệm mượt hơn.

### Vì sao các phương án còn lại sai
- **A:** ngắt đối thoại lặng lẽ khiến khách hàng bị bỏ rơi và cảm thấy bức xúc.
- **C:** bịa ra giải pháp không xác thực có thể làm trầm trọng thêm vấn đề và làm mất niềm tin.
- **D:** khởi động lại từ đầu làm mất toàn bộ bối cảnh đã thu thập, tốn thời gian của cả hai bên.`
},
);
