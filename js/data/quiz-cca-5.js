/* CCA-F practice questions: Context Management. */
(window.QUIZ = window.QUIZ || []).push(
{ id: 'qz-ccafive-001', topic: 'claude', q: '[Context Management] A support agent has a long conversation with repeated troubleshooting steps. Near the context limit, it forgets an unresolved refund request from earlier. What should the team change first?', options: [ 'Raise max_tokens because it increases the total context window', 'Keep the full transcript and tell Claude to focus harder on the refund', 'Maintain a compact summary of decisions and unresolved requests, retain recent turns, and budget space for the next answer', 'Delete the system instructions and all tool definitions before every turn' ], answer: 2, explain: `**Đáp án đúng: phương án 3.** Context window (cửa sổ ngữ cảnh) là dung lượng token hữu hạn mà model có thể xử lý trong một lượt, gồm hướng dẫn, lịch sử, kết quả tool và phần trả lời sắp sinh. Khi lịch sử dài, một thông tin cũ có thể bị bỏ sót hoặc request chạm giới hạn; model không tự biết chắc yêu cầu nào cần giữ. Hãy lưu một tóm tắt có cấu trúc gồm yêu cầu còn mở, quyết định, thông tin đã xác nhận và bước tiếp theo; giữ các lượt gần đây để bảo toàn chi tiết hội thoại, rồi dành ngân sách cho câu trả lời tiếp theo. Với thông tin quan trọng như yêu cầu hoàn tiền, giữ nguyên trạng thái và mã giao dịch cần thiết thay vì chỉ ghi “đã trao đổi về hoàn tiền”.

### Vì sao các phương án khác sai
- **Tăng max_tokens:** đây là giới hạn độ dài phần output, không làm context window lớn hơn; dành max_tokens quá nhiều còn có thể làm giảm chỗ cho input.
- **Giữ transcript và nhắc tập trung:** chỉ dẫn không làm lịch sử ngắn đi, cũng không bảo đảm model tìm được yêu cầu giữa nhiều lượt.
- **Xoá system prompt/tools:** làm mất quy tắc và khả năng hành động; không phải cách tỉa lịch sử an toàn.

> Senior tip: đặt ngưỡng compaction có khoảng dự phòng cho tool output và câu trả lời, không chờ đến khi API báo vượt giới hạn.` },
{ id: 'qz-ccafive-002', topic: 'claude', q: '[Context Management] A retrieval system puts 40 similarly sized policy documents into one prompt. Evaluation shows that relevant evidence near the middle is cited less often than evidence near the start or end. Which change is the best first experiment?', options: [ 'Retrieve and rerank a small set of relevant passages, then test their order and coverage against a fixed evaluation set', 'Increase temperature so the model explores more of the middle documents', 'Pad every document with repeated text so the middle receives more tokens', 'Move all evidence to the middle and remove the question from the prompt' ], answer: 0, explain: `**Đáp án đúng: phương án 1.** Hiện tượng lost-in-the-middle là xu hướng model sử dụng thông tin nằm giữa một ngữ cảnh dài kém ổn định hơn thông tin ở đầu/cuối; mức độ thay đổi theo tác vụ và model, nên không nên coi vị trí là quy luật tuyệt đối. Rerank (xếp hạng lại) là bước chọn và sắp thứ tự các đoạn dựa trên mức liên quan đến câu hỏi. Trước hết giảm 40 tài liệu xuống một tập nhỏ có bằng chứng tốt, rồi đo độ đúng trên bộ câu hỏi kiểm thử cố định. Có thể thử đặt bằng chứng quan trọng ở đầu/cuối, nhưng cần đo thay vì dựa vào mẹo vị trí duy nhất.

### Vì sao các phương án khác sai
- **Tăng temperature:** temperature điều chỉnh độ ngẫu nhiên khi sinh câu trả lời, không tăng khả năng truy xuất bằng chứng.
- **Lặp văn bản để padding:** làm prompt dài và tăng nhiễu; nội dung lặp không tạo bằng chứng mới.
- **Dồn tất cả vào giữa:** làm trầm trọng vấn đề và bỏ mất câu hỏi khỏi vị trí cần thiết.

> Senior tip: đánh giá retrieval recall và grounded answer riêng; câu trả lời nghe hợp lý chưa chứng minh rằng đoạn bằng chứng đã được tìm thấy.` },
{ id: 'qz-ccafive-003', topic: 'claude', q: '[Context Management] A repeated agent request reports 60,000 cache_read_input_tokens, 400 cache_creation_input_tokens, and 700 input_tokens. Which interpretation is most accurate?', options: [ 'The cache is broken because input_tokens must be zero on a cache hit', 'Cached tokens do not count toward the context window, so they can be ignored in capacity planning', 'The model has stored the conversation as durable memory and will recall it in a new session', 'A large prefix was read from cache while some uncached input was also processed; caching can reduce cost or latency but does not remove context usage' ], answer: 3, explain: `**Đáp án đúng: phương án 4.** Prompt caching (bộ nhớ đệm prompt) tái sử dụng tiền tố ổn định đã gửi trước đó để giảm phần việc phải xử lý lại. Các số liệu usage phân biệt token đọc từ cache, token ghi mới vào cache và input thông thường. Vì vậy còn 700 input token không chứng minh cache hỏng: phần mới hoặc phần sau điểm cache vẫn được tính riêng. Quan trọng hơn, cache không phải bộ nhớ hội thoại hay cơ chế nén: các nội dung đã cache vẫn thuộc request và vẫn chiếm chỗ trong context window. Ứng dụng vẫn phải quản lý lịch sử và dữ liệu cần thiết.

### Vì sao các phương án khác sai
- **Input phải bằng 0:** request thường có phần động như câu hỏi mới; cache hit không loại bỏ phần đó.
- **Bỏ token cache khỏi capacity:** caching không làm giảm số token nội dung mà model cần xử lý theo giới hạn context.
- **Cache giữ memory giữa phiên:** cache phục vụ tái sử dụng prompt trong thời hạn của nó; không thay thế lưu trữ bền vững do ứng dụng kiểm soát.

> Senior tip: theo dõi cả cache hit, token tổng, chi phí và chất lượng; tối ưu giá mà làm mất dữ liệu cần suy luận vẫn là lỗi thiết kế.` },
{ id: 'qz-ccafive-004', topic: 'claude', q: '[Context Management] A team adds the current timestamp and request ID near the beginning of a large system prompt. Cache hits fall sharply. What is the best fix?', options: [ 'Tell Claude to ignore the timestamp when it is unchanged', 'Keep the stable instructions and reference material in the reusable prefix, and place per-request values after its cache boundary', 'Move the request ID to the start of every cached document', 'Disable prompt caching because dynamic values are not supported anywhere in a request' ], answer: 1, explain: `**Đáp án đúng: phương án 2.** Prompt cache thường dựa trên tiền tố (prefix) giống nhau giữa các request. Một timestamp hoặc request ID thay đổi nằm trước điểm cache có thể khiến tiền tố không còn khớp, vì vậy cache không tái sử dụng được như trước. Hãy tách phần tĩnh — quy tắc, tài liệu tham chiếu ổn định — khỏi phần động — thời gian hiện tại, mã request và câu hỏi người dùng. Đặt ranh giới cache sau phần tĩnh và trước phần động, theo cách được API/model đang dùng hỗ trợ.

### Vì sao các phương án khác sai
- **Bảo model bỏ qua timestamp:** model vẫn nhận nội dung khác nhau; lời nhắc không làm tiền tố trở nên giống nhau.
- **Đưa ID lên đầu:** mỗi ID khác nhau tiếp tục phá tính ổn định của tiền tố.
- **Tắt cache hoàn toàn:** không cần làm vậy; chỉ cần tổ chức phần tĩnh và phần thay đổi hợp lý.

> Senior tip: dùng diff giữa hai request thực tế để tìm byte/token đầu tiên khác nhau trước ranh giới cache; đừng đoán dựa trên cấu trúc prompt nhìn bằng mắt.` },
{ id: 'qz-ccafive-005', topic: 'claude', q: '[Context Management] An application uses server-side conversation compaction. After compaction, its next request contains only the visible summary text extracted from the response. The API then loses track of the compacted history. What should the client do?', options: [ 'Discard all previous messages and start with only the latest user turn', 'Append only the summary text because non-text response blocks are display metadata', 'Retain and carry forward the complete response content required by the compaction flow, including its compaction block', 'Ask the model to reconstruct the discarded compaction metadata from the summary' ], answer: 2, explain: `**Đáp án đúng: phương án 3.** Compaction (nén/tóm tắt lịch sử) thay một phần hội thoại dài bằng trạng thái gọn hơn. Trong luồng compaction phía server, response có thể chứa block chuyên biệt bên cạnh text dễ đọc. Nếu client chỉ trích xuất text, block mang trạng thái compaction bị mất; lượt sau không còn đúng lịch sử mà API mong đợi. Client phải lưu và gửi lại đúng các block response theo hướng dẫn của tính năng, không tự chuyển mọi thứ thành một đoạn văn thuần. Messages API không tự giữ toàn bộ hội thoại thay cho ứng dụng.

### Vì sao các phương án khác sai
- **Chỉ gửi lượt mới nhất:** làm mất câu hỏi, ràng buộc và kết quả trước đó ngoài phần summary.
- **Chỉ giữ summary text:** chính là lỗi đã xảy ra; phần cấu trúc của compaction không phải metadata tùy ý để bỏ.
- **Yêu cầu model tái tạo block:** model không thể tái tạo trạng thái nội bộ có cấu trúc một cách đáng tin cậy.

> Senior tip: giữ nguyên các block response và thêm kiểm thử nhiều lượt cho nhánh compaction; kiểm thử chỉ nhìn câu trả lời cuối thường không phát hiện lỗi state.` },
{ id: 'qz-ccafive-006', topic: 'claude', q: '[Context Management] A coding agent must inspect 80 log files but only needs the likely root cause and supporting file names in its final answer. Why can a subagent help manage context?', options: [ 'It can investigate in a separate context and return a bounded result, while still consuming its own resources', 'It makes the investigation free because subagent tokens are not counted', 'It automatically shares every hidden reasoning step with the main agent without using tokens', 'It always runs in parallel, so the main agent can ignore coordination' ], answer: 0, explain: `**Đáp án đúng: phương án 1.** Subagent là agent con được giao một công việc hẹp, chẳng hạn rà soát log, trong ngữ cảnh làm việc riêng. Main agent chỉ nhận kết quả được trả về — ví dụ nguyên nhân khả dĩ, tên file và vài dòng bằng chứng — thay vì đưa toàn bộ thao tác đọc 80 file vào lịch sử chính. Đây là cách giữ context của agent điều phối gọn, không phải cách loại bỏ chi phí: agent con vẫn thực hiện suy luận và dùng token. Brief giao việc nên tự đủ, nêu phạm vi, tiêu chí bằng chứng và giới hạn độ dài kết quả.

### Vì sao các phương án khác sai
- **Miễn phí token:** tách context không làm biến mất chi phí tính toán.
- **Chia sẻ mọi bước suy luận:** subagent thường trả kết quả được yêu cầu, không tự động nhập toàn bộ lịch sử riêng vào main.
- **Luôn chạy song song:** khả năng song song tùy harness và cấu hình; vẫn cần kiểm soát phụ thuộc, quyền truy cập và kết quả.

> Senior tip: chỉ giao subagent khi phần việc đủ độc lập hoặc đầu ra lớn; yêu cầu summary kèm đường dẫn/dòng nguồn để main có thể kiểm chứng.` },
{ id: 'qz-ccafive-007', topic: 'claude', q: '[Context Management] A new engineer joins a repository where Claude Code repeatedly misses the test command and package boundaries. What is the best use of a project CLAUDE.md file?', options: [ 'Store API credentials there so every session can authenticate', 'Write concise, stable project instructions such as test commands, architecture boundaries, and coding conventions', 'Paste every source file into it so Claude never needs to inspect the repository', 'Use it as a replacement for the application user guide and source control history' ], answer: 1, explain: `**Đáp án đúng: phương án 2.** {{CLAUDE.md}} là tệp hướng dẫn dạng văn bản để cung cấp ngữ cảnh bền vững cho Claude Code, chẳng hạn cách chạy test, quy tắc kiến trúc, convention và giới hạn quan trọng của repo. Giống như README ngắn dành cho cộng tác viên, nó giúp giảm việc người dùng phải nhắc lại ở mỗi phiên. Nên giữ hướng dẫn ngắn, chính xác và cập nhật; phần giải thích dài có thể nằm trong tài liệu chuyên biệt mà agent đọc khi cần.

### Vì sao các phương án khác sai
- **Cất API key:** hướng dẫn dự án không phải kho secret; secret trong repo dễ bị lộ.
- **Chép mọi source file:** làm tệp hướng dẫn phình to và nhanh lỗi thời; agent vẫn nên đọc file liên quan trong repo.
- **Thay tài liệu/version control:** {{CLAUDE.md}} không thay thế tài liệu người dùng, Git history hay các công cụ quản lý mã.

> Senior tip: ghi lệnh kiểm thử có thể chạy thật và nêu rõ ngoại lệ kiến trúc; một hướng dẫn sai gây hại hơn việc thiếu hướng dẫn.` },
{ id: 'qz-ccafive-008', topic: 'claude', q: '[Context Management] A developer uses the /memory command in Claude Code to review what the assistant remembers between sessions. Which description is accurate?', options: [ 'It displays only the current chat transcript, which disappears when the chat ends', 'It creates a shared JSON file at the repository root that is automatically committed', 'It manages Claude Code auto memory stored locally for the project, separate from committed project instructions in CLAUDE.md', 'It uploads every note as training data and makes it available to all users' ], answer: 2, explain: `**Đáp án đúng: phương án 3.** Claude Code có cơ chế auto memory để ghi lại một số thông tin hữu ích giữa các phiên. Lệnh {{/memory}} cho phép người dùng kiểm tra hoặc quản lý cơ chế này; memory lưu cục bộ theo dự án của Claude Code, không đồng nghĩa với việc sửa tệp hướng dẫn đã commit. {{CLAUDE.md}} phù hợp với quy tắc ổn định muốn chia sẻ cùng team; auto memory phù hợp với ghi chú được tích lũy khi làm việc. Không nên giả định mọi chi tiết trong hội thoại sẽ được nhớ hoặc luôn được nạp đầy đủ: hãy kiểm tra nội dung và giữ nguồn sự thật quan trọng trong tài liệu dự án.

### Vì sao các phương án khác sai
- **Chỉ là transcript tạm:** auto memory hướng đến việc giữ một số ghi chú giữa các phiên.
- **JSON tại repo root tự commit:** memory không phải cơ chế tạo file chia sẻ đã commit như vậy.
- **Được chia sẻ/training toàn cầu:** đây là nhầm lẫn về phạm vi lưu trữ; không nên đưa dữ liệu nhạy cảm vào ghi chú.

> Senior tip: coi memory là gợi ý tiện lợi, không phải database có tính nhất quán; kiểm tra, sửa và xóa ghi chú sai hoặc lỗi thời.` },
{ id: 'qz-ccafive-009', topic: 'claude', multi: true, q: '[Context Management] (Choose 2) A repeated Messages API workflow has a large static policy and tool guide plus a short new customer question each turn. Which two changes are most likely to improve prompt cache reuse?', options: [ 'Keep the unchanged policy and tool definitions in a stable prefix before the changing conversation content', 'Insert a new timestamp at the start of the static policy on every request', 'Use supported cache breakpoints on the stable portion and keep dynamic values after that boundary', 'Change the model and tool schemas on every turn to force fresh analysis', 'Assume cache reuse persists indefinitely and stop resending required context' ], answer: [0, 2], explain: `**Đúng: phương án 1 và 3.** Prompt caching hiệu quả khi những phần đầu của request được dùng lại giống nhau. Giữ policy và tool definitions ổn định ở prefix giúp hệ thống có thể tái sử dụng phần đó. Breakpoint (điểm đánh dấu cache) xác định phần nội dung có thể được lưu theo cơ chế API hỗ trợ; đặt dữ liệu thay đổi sau ranh giới để không làm vô hiệu hóa prefix ổn định.

### Vì sao các phương án khác sai
- **Timestamp đầu prompt:** giá trị đổi mỗi lượt khiến prefix đổi theo.
- **Đổi model/schema:** thay đổi cấu hình có thể làm mất khả năng tái sử dụng; không nên thay vô cớ.
- **Coi cache là bộ nhớ vĩnh viễn:** cache có thể hết hạn hoặc miss; vẫn phải gửi đủ ngữ cảnh cần thiết trong request.

> Senior tip: đo cache read/write tokens và so sánh nội dung request, đồng thời xác nhận model/tool configuration không đổi giữa các lượt.` },
{ id: 'qz-ccafive-010', topic: 'claude', q: '[Context Management] A user-defined tool fails because an inventory service times out. The agent loop should be able to recover or choose another action. Which response should the application send?', options: [ 'Omit the tool result and send the next user message as if nothing happened', 'Return a success-shaped empty object so the model can continue', 'Return the full internal stack trace, request headers, and credentials', 'Return a tool_result for the matching tool call, mark it as an error, and provide a concise safe explanation' ], answer: 3, explain: `**Đáp án đúng: phương án 4.** Khi Claude gọi tool, ứng dụng chạy tool và gửi kết quả tương ứng với đúng lần gọi. Nếu tool lỗi, tool result có thể được đánh dấu lỗi bằng {{is_error: true}} và kèm mô tả an toàn, ngắn gọn, ví dụ “Inventory service timed out after 3 seconds”. Nhờ vậy model biết dữ liệu không lấy được và có thể xin thử lại, dùng nguồn khác hoặc báo không thể xác nhận. Agent loop vẫn cần giới hạn số lần thử và xử lý timeout trong code ứng dụng.

### Vì sao các phương án khác sai
- **Bỏ tool result:** luồng gọi tool không được hoàn tất đúng cách và model không nhận được trạng thái lỗi.
- **Giả vờ thành công:** model có thể xem dữ liệu rỗng là dữ liệu thật rồi quyết định sai.
- **Gửi stack/credentials:** có thể làm lộ bí mật và tạo nhiễu; chỉ gửi thông tin cần để phục hồi.

> Senior tip: giữ correlation ID trong log phía server, nhưng chỉ gửi model mã lỗi và chi tiết tối thiểu cần cho quyết định tiếp theo.` },
{ id: 'qz-ccafive-011', topic: 'claude', multi: true, q: '[Context Management] (Choose 2) A tool returns a rate-limit failure with a retry delay. Which two practices give the agent useful context without surrendering control of retries?', options: [ 'Drop the retry delay because models can infer it from the error name', 'Include a concise explanation and stable machine-readable error details such as an error code and retry delay', 'Expose raw credentials and the complete unfiltered service response so the model can diagnose it', 'Enforce retry timing and retry limits in trusted application code rather than relying on the model to wait correctly', 'Ask the model to retry forever until the tool succeeds' ], answer: [1, 3], explain: `**Đúng: phương án 2 và 4.** Tool result nên nói được chuyện gì đã xảy ra bằng ngôn ngữ dễ hiểu, đồng thời giữ các dữ kiện có cấu trúc như mã lỗi và thời gian có thể thử lại. Nội dung trả về cho model thường là text; các trường có cấu trúc cần được biểu diễn ổn định để ứng dụng và model hiểu nhất quán. Tuy nhiên, model không phải bộ định thời đáng tin cậy. Phía ứng dụng phải kiểm tra retry delay, đặt giới hạn số lần/thời gian, và quyết định có tự thử lại hay chuyển cho người.

### Vì sao các phương án khác sai
- **Bỏ retry delay:** mất thông tin cần để tránh gọi lại quá sớm.
- **Đưa secrets/raw response:** không cần thiết, có thể lộ thông tin nhạy cảm và làm prompt dài.
- **Retry vô hạn qua model:** tạo vòng lặp tốn tiền, tăng tải dịch vụ và không có bảo đảm dừng.

> Senior tip: phân biệt lỗi có thể retry (429/timeout tạm thời) với lỗi cấu hình hay quyền truy cập; retry sai loại lỗi chỉ làm sự cố kéo dài.` },
{ id: 'qz-ccafive-012', topic: 'claude', q: '[Context Management] A customer agent can issue refunds and update account ownership. Which policy best defines when it must hand off to a human?', options: [ 'Require human approval for high-impact or irreversible actions, out-of-scope sensitive-data access, and repeated failures; let low-risk uncertainty trigger clarification first', 'Hand off every time the model is not completely certain, even for harmless questions', 'Wait for the customer to type an exact phrase requesting a human, regardless of risk', 'Escalate whenever the conversation exceeds half of the context window' ], answer: 0, explain: `**Đáp án đúng: phương án 1.** Escalation (chuyển cấp) là chuyển một vụ việc sang người có thẩm quyền thay vì để agent tự quyết. Chính sách tốt dựa trên mức độ rủi ro và quyền hạn: hoàn tiền lớn, đổi chủ tài khoản, dữ liệu nhạy cảm hoặc lỗi lặp lại cần phê duyệt/chuyển người. Nếu thiếu thông tin ở câu hỏi ít rủi ro, agent có thể hỏi làm rõ trước. Tóm tắt bàn giao cần gồm mục tiêu, dữ kiện đã xác nhận, thao tác đã thử và lý do chuyển cấp; không nên gửi toàn bộ transcript không chọn lọc.

### Vì sao các phương án khác sai
- **Mọi bất định đều chuyển người:** làm giảm khả năng tự phục vụ; câu hỏi làm rõ thường đủ cho rủi ro thấp.
- **Chỉ chờ khách yêu cầu:** bỏ qua tình huống agent chủ động nhận ra thao tác vượt quyền hoặc nguy hiểm.
- **Ngưỡng 50% context:** độ dài hội thoại không phải thước đo rủi ro; dùng compaction/tóm tắt để quản lý context.

> Senior tip: quy định rõ action nào cần approval, ai được duyệt và thông tin bàn giao tối thiểu; “hãy dùng judgment” không phải policy vận hành.` },
{ id: 'qz-ccafive-013', topic: 'claude', multi: true, q: '[Context Management] (Choose 2) A legal-answer agent must preserve where each retrieved statement came from. Which two design choices improve provenance?', options: [ 'Attach a stable source or chunk identifier and useful source metadata to each retrieved passage', 'Ask Claude to invent a human-readable source name if the passage has no identifier', 'Merge passages from different documents into one paragraph and discard their boundaries', 'Validate that each returned citation refers to a passage actually supplied to the model', 'Trust a fluent citation because a capable model will not misattribute sources' ], answer: [0, 3], explain: `**Đúng: phương án 1 và 4.** Provenance (nguồn gốc thông tin) là khả năng lần ngược một khẳng định về tài liệu/đoạn nguồn cụ thể. Mỗi passage nên giữ ID ổn định cùng metadata cần thiết như tên nguồn, phiên bản hoặc ngày hiệu lực. Sau khi model trả citation, ứng dụng kiểm tra ID đó có thuộc tập passages đã truy xuất và gửi vào prompt hay không. Với nội dung pháp lý, có thể cần thêm kiểm tra đoạn trích và hiệu lực thời gian.

### Vì sao các phương án khác sai
- **Để model tự đặt nguồn:** model có thể tạo tên tài liệu nghe hợp lý nhưng không tồn tại.
- **Gộp và bỏ ranh giới:** mất liên kết giữa câu và nguồn gốc của nó.
- **Tin độ trôi chảy:** cách viết tự tin không chứng minh citation chính xác.

> Senior tip: giữ metadata của nguồn trong pipeline retrieval đến tận response; không thể khôi phục provenance đáng tin cậy sau khi đã vứt bỏ ID.` },
{ id: 'qz-ccafive-014', topic: 'claude', multi: true, q: '[Context Management] (Choose 2) A team adopts the Messages API server-side compaction flow for long conversations. Which two client behaviors are important?', options: [ 'Treat compaction as a way to increase the model maximum context size', 'Preserve the complete compaction response content, including its compaction block, for the next request', 'Assume the API permanently stores all earlier messages so the client can discard its own state', 'Use compaction on every short request even when there is no history to reduce', 'Keep the compacted conversation state in the client and continue with the response format required by the feature' ], answer: [1, 4], explain: `**Đúng: phương án 2 và 5.** Compaction nén phần hội thoại cũ để giải phóng dung lượng trong cùng luồng hội thoại; nó không làm tăng giới hạn tối đa của model. Response compaction có thể chứa block đặc biệt mà client cần giữ nguyên trong trạng thái hội thoại gửi lại ở lượt tiếp theo. Messages API vẫn yêu cầu ứng dụng quản lý và gửi trạng thái theo đúng contract; đừng nhầm compaction với một kho hội thoại server lưu bền vững.

### Vì sao các phương án khác sai
- **Tăng context tối đa:** compaction giảm nội dung lịch sử, không nâng giới hạn model.
- **Bỏ state client:** API không tự thay thế toàn bộ trách nhiệm quản lý lịch sử của ứng dụng.
- **Compaction mọi request ngắn:** không có lịch sử đáng kể để nén, có thể thêm chi phí/độ phức tạp không cần thiết.

> Senior tip: kiểm thử request kế tiếp sau compaction và cả trường hợp lỗi/retry; sai khác một block có thể chỉ lộ ra sau nhiều lượt.` },
{ id: 'qz-ccafive-015', topic: 'claude', q: '[Context Management] A document-review system delegates analysis of 200 files to subagents. The main agent still hits its context limit because every subagent returns a full transcript. What is the best change?', options: [ 'Increase the main agent context limit without changing its outputs', 'Specify a bounded result format with key findings, source references, confidence, and exceptions; omit routine intermediate steps', 'Disable all delegation and paste every file into the main conversation', 'Cache every transcript permanently and resend them on each turn' ], answer: 1, explain: `**Đáp án đúng: phương án 2.** Tách context chỉ hữu ích nếu dữ liệu trả về được giới hạn. Hãy giao subagent format đầu ra nhỏ: vài finding, đường dẫn và đoạn chứng minh, mức độ chắc chắn, cùng các trường hợp chưa giải quyết. Main agent có thể tổng hợp kết quả mà không phải đọc lại từng bước trung gian. Nếu cần điều tra sâu hơn, dùng source reference để mở đúng file/đoạn thay vì luôn mang transcript vào context.

### Vì sao các phương án khác sai
- **Chỉ tăng giới hạn:** không giải quyết tăng trưởng không giới hạn và có thể làm chi phí, độ trễ cao hơn.
- **Tắt delegation:** chuyển toàn bộ lượng đọc lớn về main agent, khiến context chính phình nhanh hơn.
- **Lưu/gửi lại mọi transcript:** cache không nén nội dung và transcript cũ làm tăng token ở các lượt sau.

> Senior tip: giới hạn số findings và yêu cầu trích nguồn; summary không có bằng chứng có thể ngắn nhưng vô dụng.` },
{ id: 'qz-ccafive-016', topic: 'claude', q: '[Context Management] A team assumes a cached policy prefix will still be available after a long idle period. The next request is valid but shows a cache miss. What should the team conclude?', options: [ 'The conversation was deleted and the API can no longer answer', 'A cache miss means the policy was rejected as unsafe', 'Prompt cache entries can expire or miss; the request must still include the required policy and work correctly without a hit', 'The application should retry the same request forever until the cache reappears' ], answer: 2, explain: `**Đáp án đúng: phương án 3.** Prompt cache là cơ chế tối ưu tái sử dụng trong thời hạn nhất định, không phải lưu trữ bền vững. Cache có thể hết hạn hoặc không khớp với request hiện tại; khi đó request vẫn phải chứa đủ hướng dẫn và dữ liệu cần thiết để xử lý đúng. Cache miss có thể ảnh hưởng chi phí/độ trễ, nhưng không đồng nghĩa model mất khả năng xử lý hay nội dung bị từ chối.

### Vì sao các phương án khác sai
- **Hội thoại bị xóa:** cache miss không nói lên trạng thái lưu hội thoại do ứng dụng quản lý.
- **Policy không an toàn:** cache miss là vấn đề tái sử dụng, không phải kết quả kiểm duyệt nội dung.
- **Retry vô hạn:** không thể bảo đảm cache hit và tạo tải vô ích; request phải hoạt động đúng ở cold cache.

> Senior tip: chạy evaluation cả cold-cache và warm-cache; chất lượng trả lời phải như nhau, chỉ khác hiệu năng/chi phí.` },
{ id: 'qz-ccafive-017', topic: 'claude', q: '[Context Management] A project CLAUDE.md has grown to 9,000 tokens with detailed notes for every package. Claude Code often ignores the one rule relevant to the current task. What is the best maintenance strategy?', options: [ 'Keep concise, broadly applicable instructions in CLAUDE.md and place detailed material in focused documents that can be read when relevant', 'Duplicate the entire file several times so the model sees the rules more often', 'Move every instruction into the current user message, even when it is unrelated', 'Delete all project guidance and rely on the model to infer conventions from code' ], answer: 0, explain: `**Đáp án đúng: phương án 1.** Tệp hướng dẫn quá dài làm tăng context nền ở mọi tác vụ và khiến quy tắc quan trọng khó được chú ý. Giữ {{CLAUDE.md}} ngắn với lệnh test, ranh giới kiến trúc và các nguyên tắc áp dụng rộng. Chi tiết riêng cho một package nên nằm trong tài liệu hẹp, được mở khi tác vụ cần. Như vậy vừa giảm token cố định vừa giúp đưa đúng kiến thức vào đúng lúc.

### Vì sao các phương án khác sai
- **Nhân bản hướng dẫn:** tăng độ dài và có thể tạo mâu thuẫn; lặp lại không đảm bảo tuân thủ.
- **Chép tất cả vào mỗi yêu cầu:** người dùng phải duy trì thủ công và vẫn đưa nhiều thông tin không liên quan.
- **Xóa hết quy tắc:** agent phải suy đoán convention và dễ vi phạm các giới hạn không thể suy ra từ code.

> Senior tip: gỡ bỏ các chỉ dẫn lặp, lỗi thời và mô tả thứ có thể tra bằng lệnh; đo hiệu quả bằng việc agent chạy đúng kiểm thử và tuân thủ boundaries.` },
{ id: 'qz-ccafive-018', topic: 'claude', q: '[Context Management] A search tool returns 300 KB of logs, but the agent only needs the three errors around a supplied correlation ID. Which tool design best protects context?', options: [ 'Return the entire log and ask Claude to ignore unrelated lines', 'Split the log into many messages but preserve every byte in the conversation', 'Remove timestamps and correlation IDs to make the output shorter', 'Filter around the correlation ID, cap the result, and return a reference to the full log for authorized follow-up' ], answer: 3, explain: `**Đáp án đúng: phương án 4.** Tool output được thêm vào context giống như nội dung khác; trả 300 KB log có thể chiếm phần lớn cửa sổ và che khuất yêu cầu. Tool nên lọc theo correlation ID (mã nối các log thuộc cùng một request), lấy một khoảng dòng trước/sau lỗi, giới hạn kích thước, đồng thời giữ timestamp và ID để điều tra. Đường dẫn tham chiếu tới log gốc cho phép agent hoặc người vận hành lấy thêm phần cần thiết khi có quyền.

### Vì sao các phương án khác sai
- **Trả toàn bộ rồi nhắc bỏ qua:** model vẫn phải nhận lượng token lớn; chỉ dẫn không giảm kích thước.
- **Chia thành nhiều message:** tổng số token gần như không giảm và lịch sử càng dài.
- **Bỏ timestamp/ID:** xóa thông tin cần để sắp xếp sự kiện và nối chúng với request.

> Senior tip: lọc tool output ở server-side; đừng gửi dữ liệu nhạy cảm hoặc log toàn hệ thống cho model nếu tác vụ chỉ cần một request.` },
{ id: 'qz-ccafive-019', topic: 'claude', multi: true, q: '[Context Management] (Choose 2) A retrieval-augmented answer often misses a relevant fact among dozens of long passages. Which two context changes are sound first steps?', options: [ 'Rerank candidates and include only a small, high-relevance set of passages', 'Randomize passage order on every request so no source is always in the middle', 'Repeat the user question after every paragraph to force attention', 'Keep every document in full because a larger context always improves accuracy', 'Summarize lower-relevance material and retain full text for the strongest evidence' ], answer: [0, 4], explain: `**Đúng: phương án 1 và 5.** Rerank giúp đưa những đoạn trả lời trực tiếp câu hỏi lên trước, còn tóm tắt tài liệu ít liên quan giúp giảm nhiễu. Giữ full text cho bằng chứng mạnh để model vẫn có chi tiết cần thiết. Những thay đổi này xử lý cả chất lượng retrieval (tìm đúng đoạn) và kích thước context; sau đó đánh giá citation và độ đúng trên bộ dữ liệu đại diện.

### Vì sao các phương án khác sai
- **Xáo trộn ngẫu nhiên:** làm vị trí bằng chứng thiếu ổn định và khó điều tra khi chất lượng giảm.
- **Lặp câu hỏi giữa mỗi đoạn:** tăng token nhưng không cải thiện chất lượng passage được truy xuất.
- **Giữ toàn bộ vì context lớn:** dung lượng lớn không bảo đảm model dùng mọi chi tiết chính xác, đồng thời tăng chi phí và độ nhiễu.

> Senior tip: ghi lại IDs của passages đã gửi cùng câu trả lời để phân biệt lỗi retrieval với lỗi suy luận/diễn đạt.` },
{ id: 'qz-ccafive-020', topic: 'claude', q: '[Context Management] A team uses the Messages API and assumes it remembers the prior turns because prompt caching is enabled. The next request contains only the latest user message, and the answer loses the conversation state. What should the team do?', options: [ 'Turn up temperature so the model can reconstruct the conversation', 'Persist the conversation state in the application and send the relevant history or a maintained summary with each request', 'Put the previous user messages in a cache and omit them from future requests', 'Increase max_tokens to make the API retain conversation history' ], answer: 1, explain: `**Đáp án đúng: phương án 2.** Messages API hoạt động theo request: ứng dụng gửi các message cần thiết cho lượt hiện tại. Prompt caching chỉ tái sử dụng phần prompt, không tạo kho hội thoại bền vững và không tự thêm lượt trước vào request mới. Vì thế backend phải lưu trạng thái phiên và gửi lại phần lịch sử hữu ích; khi dài, có thể thay phần cũ bằng summary đã kiểm chứng, đồng thời giữ yêu cầu chưa giải quyết và dữ kiện quan trọng.

### Vì sao các phương án khác sai
- **Tăng temperature:** làm kết quả ngẫu nhiên hơn, không khôi phục dữ kiện không được gửi.
- **Chỉ cache message cũ:** cache không thay đổi nội dung request thành một lịch sử hội thoại tự động.
- **Tăng max_tokens:** chỉ liên quan giới hạn output, không làm API lưu history.

> Senior tip: xác định rõ nguồn sự thật của session state ở backend và xử lý cập nhật đồng thời nếu cùng phiên có nhiều request.` },
{ id: 'qz-ccafive-021', topic: 'claude', q: '[Context Management] A RAG system finds two policy passages with conflicting refund limits. One is newer but the other has a stronger similarity score. What should the agent do?', options: [ 'Average the two limits and present the result as policy', 'Choose the passage with the longer text because it has more context', 'Preserve both sources and their dates, apply an explicit authority/recency rule if one exists, otherwise disclose the conflict or escalate', 'Silently choose the higher similarity score and omit the citation' ], answer: 2, explain: `**Đáp án đúng: phương án 3.** Khi nguồn mâu thuẫn, similarity score (độ tương đồng tìm kiếm) chỉ nói passage giống câu hỏi, không chứng minh nó là policy có hiệu lực. Hệ thống cần giữ nguồn, phiên bản/ngày hiệu lực và quyền ưu tiên của từng đoạn. Nếu policy xác định nguồn mới nhất hoặc hệ thống chính thức là chuẩn, áp dụng quy tắc đó và trích dẫn. Nếu không đủ metadata để chọn, phải nêu mâu thuẫn hoặc chuyển người thay vì tự hợp nhất.

### Vì sao các phương án khác sai
- **Lấy trung bình:** tạo ra một con số không có trong tài liệu nào.
- **Chọn đoạn dài hơn:** độ dài không xác định tính thẩm quyền hay hiệu lực.
- **Chọn similarity và giấu nguồn:** biến điểm retrieval thành quyết định policy và làm mất khả năng audit.

> Senior tip: lưu effective date và authority level trong metadata retrieval; đừng bắt model suy ra thứ tự ưu tiên từ văn phong.` },
{ id: 'qz-ccafive-022', topic: 'claude', multi: true, q: '[Context Management] (Choose 2) A coding agent works across many modules for several hours. Which two practices help keep its active context useful?', options: [ 'Include the entire repository in every request so no detail can be missed', 'Delegate a large independent investigation and ask for concise findings with source references', 'Maintain a rolling summary of decisions, files changed, tests run, and unresolved work; compact when needed', 'Remove tool outputs from the transcript even when they contain the only test result', 'Keep every obsolete plan and superseded summary in the active conversation' ], answer: [1, 2], explain: `**Đúng: phương án 2 và 3.** Một subagent có thể rà soát một phần độc lập rồi trả findings và source references, giữ lịch sử điều phối ngắn. Rolling summary (tóm tắt cập nhật liên tục) cần ghi trạng thái có thể hành động: quyết định, file đã sửa, test đã chạy/kết quả, việc chưa xong. Khi context tăng, thay phần hội thoại cũ bằng summary hoặc dùng compaction theo luồng hỗ trợ. Không xóa kết quả kiểm thử duy nhất nếu summary chưa ghi lại.

### Vì sao các phương án khác sai
- **Gửi toàn bộ repo:** lãng phí context và tăng khả năng lẫn thông tin không liên quan.
- **Xóa kết quả test:** mất bằng chứng quan trọng về trạng thái hiện tại.
- **Giữ mọi kế hoạch cũ:** thông tin lỗi thời mâu thuẫn với kế hoạch mới và làm context phình to.

> Senior tip: ghi rõ thời điểm và commit/diff liên quan trong progress summary để agent sau không nhầm kết quả cũ với trạng thái hiện tại.` },
{ id: 'qz-ccafive-023', topic: 'claude', q: '[Context Management] A research assistant must cite the exact sentence supporting each factual claim. Which implementation is most robust?', options: [ 'Give each supplied passage a stable ID, require a passage ID and exact quote for each citation, then verify the quote against that passage and review claim support', 'Ask the model to add footnotes from memory after it finishes writing', 'Append a bibliography without linking individual claims to passages', 'Accept any citation whose document title looks plausible' ], answer: 0, explain: `**Đáp án đúng: phương án 1.** Mỗi passage được gửi cho model cần có ID ổn định. Citation phải chỉ ra passage cụ thể và quote nguyên văn; ứng dụng kiểm tra ID thuộc tập nguồn đã cung cấp và quote khớp nội dung passage. Đây là kiểm tra provenance ở mức span (đoạn nguồn chính xác), giúp phát hiện quote/ID bịa. Khớp chuỗi chưa đủ để chứng minh quote hỗ trợ kết luận: với nội dung quan trọng, cần thêm kiểm tra xem claim có thực sự được câu đó chứng minh hay không.

### Vì sao các phương án khác sai
- **Footnote từ trí nhớ:** model có thể tạo nguồn hoặc câu trích dẫn không có trong context.
- **Bibliography không gắn claim:** người đọc không biết nguồn nào hỗ trợ khẳng định nào.
- **Tin tiêu đề nghe hợp lý:** tên tài liệu có thể bị bịa hoặc trỏ đến phiên bản sai.

> Senior tip: lưu cả đoạn nguyên gốc và phiên bản nguồn; exact quote có thể không xác định được nếu tài liệu đã thay đổi sau khi câu trả lời được tạo.` },
);
