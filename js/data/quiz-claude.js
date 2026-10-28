/* Multiple-choice bank for the Trac nghiem view - owner: task T318. Format: see AGENTS.md */
(window.QUIZ = window.QUIZ || []).push(
{
  id: 'qz-claude-001',
  topic: 'claude',
  q: '[Applications] Một chatbot dùng Messages API trả lời sai ngữ cảnh ở lượt thứ 3 vì mỗi request chỉ gửi tin nhắn mới nhất. Nguyên nhân và cách sửa phù hợp nhất là gì?',
  options: [
    'API stateless; phải gửi toàn bộ lịch sử messages theo thứ tự, và cắt/tóm tắt khi gần đầy context',
    'API tự lưu lịch sử theo conversation_id, nên chỉ cần gửi message mới',
    'Gửi system prompt mới mỗi lượt để API khôi phục ngữ cảnh',
    'Tăng max_tokens để API nhớ các lượt trước'
  ],
  answer: 0,
  explain: `**Đáp án đúng: Messages API là stateless.** Mỗi request độc lập, server không giữ lịch sử; client phải gửi mảng messages theo thứ tự. Khi hội thoại dài, cần cắt hoặc tóm tắt phần cũ để không vượt context window.

### Vì sao các phương án còn lại sai
- **API tự lưu lịch sử**: không có conversation_id mặc định; phải tự quản lý.
- **System prompt mới mỗi lượt**: system prompt định hướng hành vi, không thay thế lịch sử hội thoại.
- **Tăng max_tokens**: chỉ giới hạn độ dài output, không làm model nhớ lượt trước.`
},
{
  id: 'qz-claude-002',
  topic: 'claude',
  q: '[Applications] Response trả về stop_reason là max_tokens: câu trả lời bị cắt giữa chừng. Bước tiếp theo nào hợp lý nhất?',
  options: [
    'Retry nguyên request vì đây là lỗi tạm thời của server',
    'Gọi lại với max_tokens lớn hơn (dùng streaming nếu output dài), hoặc yêu cầu model trả lời ngắn gọn hơn',
    'Giảm temperature để model viết ít chữ hơn',
    'Coi như câu trả lời đã hoàn chỉnh và trả cho người dùng'
  ],
  answer: 1,
  explain: `**Đúng: phương án 2.** {{max_tokens}} là trần số token **output** của một lượt. Khi model chạm trần, API dừng sinh và trả {{stop_reason: "max_tokens"}}: request **thành công** (HTTP 200) nhưng nội dung bị cắt.

### Vì sao các phương án khác sai
- **Retry nguyên request:** đây không phải lỗi tạm thời. Gửi lại y hệt thì lại bị cắt đúng chỗ đó.
- **Giảm temperature:** temperature không quyết định độ dài. Trên API version mới, gửi temperature cho các model hiện hành còn bị lỗi 400.
- **Coi như xong:** câu trả lời đang dở dang. Nếu là JSON hay code thì còn không parse được.

> Lưu ý: các model hiện hành (Opus 5.5, Sonnet 5.5, Fable 5.1…) **không còn hỗ trợ prefill** (gửi sẵn đoạn đầu của câu trả lời assistant), nên không "nối tiếp" bằng cách prefill được. Nếu output thật sự dài (tới 128K token), SDK yêu cầu dùng streaming để không bị timeout HTTP.`
},
{
  id: 'qz-claude-003',
  topic: 'claude',
  q: '[Applications] Ứng dụng nhận HTTP 529 (overloaded) khi gọi Messages API. Cách xử lý phù hợp nhất là gì?',
  options: [
    'Retry ngay lập tức liên tục cho đến khi thành công',
    'Chuyển mọi request sang model Haiku để tránh quá tải',
    'Exponential backoff có jitter, giới hạn số lần retry, và circuit breaker nếu lỗi kéo dài',
    'Bỏ qua lỗi và trả về cache cũ vĩnh viễn'
  ],
  answer: 2,
  explain: `**Đáp án đúng: 529 là quá tải tạm thời.** Nên dùng exponential backoff có jitter, giới hạn retry và circuit breaker nếu kéo dài; tránh thundering herd.

### Vì sao các phương án còn lại sai
- **Retry ngay**: làm tăng tải và có thể bị chặn thêm.
- **Chuyển mọi request sang Haiku**: không phải giải pháp mặc định và có thể giảm chất lượng.
- **Cache cũ vĩnh viễn**: chỉ nên dùng fallback tạm thời, không vĩnh viễn.`
},
{
  id: 'qz-claude-004',
  topic: 'claude',
  q: '[Applications] Response 429 có header retry-after: 30. Ứng dụng nên làm gì?',
  options: [
    'Bỏ qua header và retry sau 1 giây',
    'Tăng số thread gửi request để throughput cao hơn',
    'Đổi API key khác để bỏ qua limit',
    'Chờ ít nhất 30 giây trước khi retry, đồng thời giảm tốc gửi request'
  ],
  answer: 3,
  explain: `**Đáp án đúng: retry-after là thời gian chờ tối thiểu.** Ứng dụng phải chờ ít nhất 30 giây và giảm tốc để không tiếp tục vượt rate limit.

### Vì sao các phương án còn lại sai
- **Bỏ qua header**: vi phạm hướng dẫn và dễ bị chặn tiếp.
- **Tăng thread**: làm rate limit tệ hơn.
- **Đổi API key**: limit thường ở cấp tổ chức/workspace, không bypass được.`
},
{
  id: 'qz-claude-005',
  topic: 'claude',
  q: '[Applications] Để prompt caching hiệu quả, thứ tự nội dung trong prompt nên như thế nào?',
  options: [
    'Đặt phần tĩnh trước và phần động sau; cache breakpoint ở ranh giới tĩnh/động',
    'Đặt phần động (câu hỏi user) trước, phần tĩnh (system, docs) sau để cache suffix',
    'Trộn lẫn tĩnh và động để phân tán cache',
    'Không cần thứ tự, cache tự tìm prefix chung'
  ],
  answer: 0,
  explain: `**Đáp án đúng: cache theo prefix.** Phần tĩnh phải đứng trước để trở thành prefix được cache; phần động đứng sau. Đặt breakpoint ở ranh giới tĩnh/động.

### Vì sao các phương án còn lại sai
- **Động trước**: prefix thay đổi mỗi request, cache vô hiệu.
- **Trộn**: phá vỡ prefix ổn định.
- **Cache tự tìm**: cache không tự tìm prefix; cần thứ tự và breakpoint.`
},
{
  id: 'qz-claude-006',
  topic: 'claude',
  q: '[Applications] Response usage có cache_read_input_tokens cao và input_tokens thấp. Điều này có nghĩa là gì?',
  options: [
    'Cache không hoạt động vì input_tokens thấp',
    'Phần lớn prompt được đọc từ cache, nên chi phí và độ trễ giảm',
    'Model đã bỏ qua phần cache và chỉ xử lý phần mới',
    'output_tokens sẽ tự động giảm theo'
  ],
  answer: 1,
  explain: `**Đáp án đúng: cache_read_input_tokens cao cho thấy phần lớn prompt được đọc từ cache.** input_tokens chỉ là phần sau breakpoint cuối, nên thấp là bình thường và có lợi.

### Vì sao các phương án còn lại sai
- **Cache không hoạt động**: ngược lại, đây là dấu hiệu cache hoạt động tốt.
- **Bỏ qua cache**: cache read được dùng trong attention, không bị bỏ qua.
- **output_tokens giảm**: output không tự giảm theo cache read.`
},
{
  id: 'qz-claude-007',
  topic: 'claude',
  q: '[Applications] Bạn cần xử lý 50.000 bản tóm tắt không cần kết quả ngay. Lựa chọn nào phù hợp nhất?',
  options: [
    'Gọi Messages API đồng bộ 50.000 lần với streaming',
    'Gửi tất cả trong một request với max_tokens lớn',
    'Dùng Message Batches API để xử lý async với giảm 50% chi phí',
    'Dùng prompt caching thay cho batch'
  ],
  answer: 2,
  explain: `**Đáp án đúng: Message Batches API xử lý async và giảm 50% chi phí input/output**, phù hợp workload bulk không cần ngay.

### Vì sao các phương án còn lại sai
- **Đồng bộ 50.000 lần**: tốn rate limit và phức tạp.
- **Một request**: không chứa 50.000 tác vụ độc lập.
- **Caching thay batch**: caching giảm chi phí prefix, không thay thế xử lý bulk async.`
},
{
  id: 'qz-claude-008',
  topic: 'claude',
  q: '[Applications] Về Message Batches API, phát biểu nào đúng?',
  options: [
    'Kết quả stream về client theo thời gian thực',
    'Mỗi batch chỉ chứa 1 request để đảm bảo thứ tự',
    'Batch không được giảm giá',
    'Batch giới hạn 100.000 request hoặc 256MB; kết quả có sau khi xử lý xong hoặc 24h; lưu 29 ngày'
  ],
  answer: 3,
  explain: `**Đáp án đúng: Batch giới hạn 100.000 request hoặc 256MB; kết quả truy cập khi tất cả xong hoặc sau 24h; kết quả lưu 29 ngày.** Batch xử lý async, không stream.

### Vì sao các phương án còn lại sai
- **Stream realtime**: batch không stream.
- **1 request/batch**: sai, batch chứa nhiều request.
- **Không giảm giá**: batch giảm 50%.`
},
{
  id: 'qz-claude-009',
  topic: 'claude',
  q: '[Applications] Khi stream Messages API, để hiển thị text dần cho người dùng, bạn nên xử lý event nào?',
  options: [
    'message_start rồi content_block_delta với delta.text',
    'content_block_stop rồi message_delta',
    'ping event chứa text',
    'error event chứa text đầy đủ'
  ],
  answer: 0,
  explain: `**Đáp án đúng: text tăng dần nằm trong content_block_delta (delta.text).** message_start chỉ bắt đầu message, chưa có text.

### Vì sao các phương án còn lại sai
- **content_block_stop/message_delta**: occur khi block/message kết thúc, không phải text dần.
- **ping**: heartbeat, không chứa text.
- **error**: lỗi, không chứa text đầy đủ.`
},
{
  id: 'qz-claude-010',
  topic: 'claude',
  q: '[Applications] Hội thoại của chatbot đã dài gần chạm context window. Chiến lược nào phù hợp nhất?',
  options: [
    'Cứ gửi toàn bộ lịch sử, API sẽ tự cắt bớt lượt cũ mà không cần cấu hình gì',
    'Xoá system prompt để nhường chỗ cho lịch sử',
    'Tóm tắt các lượt cũ (tự làm, hoặc bật compaction phía server, đang beta), giữ nguyên các lượt gần nhất',
    'Tăng max_tokens để mở rộng context window'
  ],
  answer: 2,
  explain: `**Đúng: phương án 3.** Messages API là **stateless**: mỗi request gửi lại toàn bộ hội thoại. Khi gần đầy context, cần giảm kích thước lịch sử nhưng vẫn giữ ý chính:
1. **Tự tóm tắt:** gọi model tóm tắt các lượt cũ rồi thay chúng bằng bản tóm tắt.
2. **Compaction (beta, header {{compact-2026-01-12}}):** server tự tóm tắt phần đầu hội thoại khi vượt ngưỡng. Client phải append nguyên {{response.content}} (gồm block compaction) vào lịch sử, không chỉ lấy phần text.

### Vì sao các phương án khác sai
- **API tự cắt mà không cần cấu hình:** sai. Không bật compaction thì request vượt context sẽ lỗi, không có chuyện tự cắt.
- **Xoá system prompt:** mất vai trò, ràng buộc và định dạng; tiết kiệm được rất ít.
- **Tăng max_tokens:** max_tokens là trần **output**, không mở rộng context window. Input cộng output vẫn phải nằm trong context.`
},
{
  id: 'qz-claude-011',
  topic: 'claude',
  q: '[Applications] Trước khi gửi request lớn, bạn muốn ước lượng chi phí. API nào phù hợp?',
  options: [
    'Gọi messages.create với max_tokens=0',
    'Nhân độ dài ký tự cho 4',
    'Dùng endpoint token counting để đếm input tokens mà không sinh output',
    'Dùng batch API để đếm'
  ],
  answer: 2,
  explain: `**Đáp án đúng: Token counting endpoint trả về số input token cho prompt.** Dùng để ước lượng chi phí trước khi gửi.

### Vì sao các phương án còn lại sai
- **max_tokens=0**: không phải cách đếm input.
- **Nhân ký tự**: heuristic không chính xác.
- **Batch API**: xử lý batch, không đếm token.`
},
{
  id: 'qz-claude-012',
  topic: 'claude',
  q: '[Applications] Bạn cần response đúng JSON schema để parse tự động. Cách đúng trong Messages API là gì?',
  options: [
    'Nhờ model trả về JSON trong prompt và parse tự do',
    'Đặt temperature=0',
    'Dùng stop_sequences để ép JSON',
    'Dùng output_config.format với type json_schema (hoặc strict tool use) để ràng buộc schema'
  ],
  answer: 3,
  explain: `**Đáp án đúng: output_config.format với type json_schema ràng buộc output theo schema.** Strict tool use cũng đảm bảo schema cho tool input.

### Vì sao các phương án còn lại sai
- **Nhờ prompt**: không đảm bảo hợp lệ.
- **temperature=0**: chỉ giảm ngẫu nhiên, không ràng buộc schema.
- **stop_sequences**: chỉ dừng ở chuỗi, không đảm bảo JSON.`
},
{
  id: 'qz-claude-013',
  topic: 'claude',
  q: '[Applications] Trên Claude Opus 5.5, bạn muốn các tác vụ đơn giản (phân loại, trích xuất) chạy nhanh và rẻ hơn. Cấu hình nào đúng?',
  options: [
    'Đặt output_config.effort thấp (ví dụ low) cho route đó',
    'Gửi thinking: {type: "disabled"}',
    'Gửi thinking: {type: "enabled", budget_tokens: 1024}',
    'Đặt temperature: 0'
  ],
  answer: 0,
  explain: `**Đúng: phương án 1.** Trên Claude Opus 5.5 thinking **luôn bật** (adaptive). Cách duy nhất để điều chỉnh độ sâu suy nghĩ và lượng token tiêu tốn là {{output_config.effort}} ({{low}} / {{medium}} / {{high}} / {{xhigh}} / {{max}}). Mặc định của Opus 5.5 là {{medium}}; tác vụ đơn giản thường đạt yêu cầu ở {{low}}.

### Vì sao các phương án khác sai
- **thinking disabled:** Opus 5.5 trả lỗi 400 ở mọi mức effort.
- **budget_tokens:** cơ chế "ngân sách thinking" kiểu cũ đã bị bỏ trên các model 5.x. Gửi lên sẽ bị lỗi 400.
- **temperature: 0:** không làm model suy nghĩ ít đi. Từ API version 2026-10-21, gửi temperature còn bị lỗi 400 trên mọi model.

> Mẹo phỏng vấn: hãy nói "chỉnh effort theo từng route và đo trên mẫu request thật", đừng nói "tắt thinking cho rẻ".`
},
{
  id: 'qz-claude-014',
  topic: 'claude',
  q: '[Applications] Gửi ảnh cho Claude trong Messages API. Cách biểu diễn đúng là gì?',
  options: [
    'Chỉ gửi URL ảnh trong text',
    'Content block type image với source base64 hoặc url được hỗ trợ',
    'Gửi ảnh như file binary trong header',
    'Convert ảnh sang ASCII art'
  ],
  answer: 1,
  explain: `**Đáp án đúng: dùng content block type image với source phù hợp.** Model xử lý hình ảnh trực tiếp.

### Vì sao các phương án còn lại sai
- **URL trong text**: không đảm bảo model fetch ảnh.
- **Binary header**: API không nhận ảnh qua header.
- **ASCII art**: mất thông tin và không cần thiết.`
},
{
  id: 'qz-claude-015',
  topic: 'claude',
  q: '[Applications] Claude hỗ trợ PDF input. Điều nào đúng?',
  options: [
    'PDF luôn phải convert sang text trước khi gửi',
    'Chỉ hỗ trợ PDF dưới 1 trang',
    'Có thể gửi PDF như document block; model đọc text và hình trong PDF',
    'PDF chỉ dùng cho batch API'
  ],
  answer: 2,
  explain: `**Đáp án đúng: có thể gửi PDF như document block**, model đọc nội dung (subject to context limits).

### Vì sao các phương án còn lại sai
- **Luôn convert**: không bắt buộc.
- **Chỉ dưới 1 trang**: không đúng, giới hạn là context window.
- **Chỉ batch**: không đúng.`
},
{
  id: 'qz-claude-016',
  topic: 'claude',
  q: '[Applications] Trên Claude Opus 5.5, bạn cần chắc chắn Claude gọi tool extract_invoice với input đúng schema. Cách nào phù hợp?',
  options: [
    'tool_choice: {type: "tool", name: "extract_invoice"}',
    'tool_choice: {type: "any"}',
    'Tăng max_tokens và hy vọng model tự gọi',
    'tool_choice auto, system prompt nói rõ phải gọi extract_invoice, và đặt strict: true trên tool (hoặc dùng structured outputs nếu chỉ cần JSON)'
  ],
  answer: 3,
  explain: `**Đúng: phương án 4.** Trên Claude Opus 5.5, Sonnet 5.5 và Fable 5.1, **forced tool use** ({{tool_choice}} {{any}} hoặc {{tool}}) trả lỗi 400. Cách thay thế:
1. {{tool_choice}} kiểu {{auto}} kèm hướng dẫn rõ trong prompt (ví dụ "luôn gọi extract_invoice với dữ liệu hoá đơn").
2. {{strict: true}} trên định nghĩa tool (schema có {{additionalProperties: false}} và {{required}}). API đảm bảo {{tool_use.input}} hợp lệ theo schema.
3. Nếu mục đích chỉ là lấy JSON, dùng **structured outputs** ({{output_config.format}}), không cần tool.

### Vì sao các phương án khác sai
- **type tool / type any:** đúng với model đời cũ, nhưng bị từ chối (400) trên các model hiện hành kể trên.
- **Tăng max_tokens:** không liên quan đến việc chọn tool.

> Đây là bẫy hay gặp khi nâng cấp model: code cũ ép tool bằng {{tool_choice}} sẽ bắt đầu lỗi 400 sau khi đổi model.`
},
{
  id: 'qz-claude-017',
  topic: 'claude',
  q: '[Applications] max_tokens trong request Messages API kiểm soát điều gì?',
  options: [
    'Số token output tối đa model được sinh',
    'Số token input tối đa',
    'Tổng token context window',
    'Số request mỗi phút'
  ],
  answer: 0,
  explain: `**Đáp án đúng: max_tokens giới hạn output.** Input/context/rate limit là khái niệm khác.

### Vì sao các phương án còn lại sai
- **Input tối đa**: do context window và rate limit.
- **Context window**: capability của model.
- **RPM**: rate limit.`
},
{
  id: 'qz-claude-018',
  topic: 'claude',
  q: '[Applications] Khi gọi Claude API bằng HTTP thuần (không qua SDK), header nào bắt buộc để chỉ định phiên bản API?',
  options: [
    'api-version: v1',
    'x-api-version: latest',
    'anthropic-version, ví dụ 2023-06-01 (SDK mới gửi phiên bản mới hơn, như 2026-10-21)',
    'version: claude-5'
  ],
  answer: 2,
  explain: `**Đúng: phương án 3.** Mọi request HTTP tới Claude API cần 3 header:
- {{x-api-key}}: API key;
- {{anthropic-version}}: phiên bản API, ví dụ {{2023-06-01}};
- {{content-type: application/json}}.

SDK chính thức tự gửi {{anthropic-version}}. Các bản SDK mới chuyển sang phiên bản mới hơn ({{2026-10-21}}). Phiên bản này thay đổi một số hành vi, ví dụ gửi {{temperature}} / {{top_p}} / {{top_k}} sẽ bị lỗi 400. Vì vậy khi nâng SDK cần đọc hướng dẫn chuyển version.

### Vì sao các phương án khác sai
Các header {{api-version}}, {{x-api-version}}, {{version}} không tồn tại trong Claude API. Không có giá trị "latest": version luôn là một ngày cụ thể, để hành vi API không đổi ngầm dưới chân bạn.`
},
{
  id: 'qz-claude-019',
  topic: 'claude',
  q: '[Applications] stop_reason là refusal. Cách xử lý phù hợp?',
  options: [
    'Retry vô hạn với cùng prompt',
    'Tăng max_tokens',
    'Đọc stop_details, điều chỉnh prompt hoặc fallback model, không ép model vi phạm policy',
    'Bỏ qua và trả về rỗng'
  ],
  answer: 2,
  explain: `**Đáp án đúng: refusal là model từ chối.** Cần điều chỉnh yêu cầu hoặc fallback an toàn.

### Vì sao các phương án còn lại sai
- **Retry vô hạn**: không thay đổi kết quả và lãng phí.
- **Tăng max_tokens**: không liên quan policy.
- **Trả rỗng**: trải nghiệm kém và không giải thích.`
},
{
  id: 'qz-claude-020',
  topic: 'claude',
  q: '[Applications] Web search tool của Claude khác user-defined tool ở điểm nào?',
  options: [
    'Web search phải implement ở client',
    'User-defined tool chạy trên Anthropic',
    'Cả hai đều chạy ở client',
    'Web search chạy trên hạ tầng Anthropic, kết quả trả về trong cùng response'
  ],
  answer: 3,
  explain: `**Đáp án đúng: web search là server tool**, Anthropic thực thi và trả kết quả; client tool cần round trip tool_result.

### Vì sao các phương án còn lại sai
- **Web search client**: sai.
- **User-defined trên Anthropic**: sai, chạy ở client.
- **Cả hai client**: sai.`
},
{
  id: 'qz-claude-021',
  topic: 'claude',
  q: '[Model Selection] Ứng dụng phân loại email khối lượng lớn, độ trễ thấp. Nên chọn model nào?',
  options: [
    'Claude Haiku 5.5',
    'Claude Fable 5.1',
    'Claude Opus 5.5',
    'Claude Sonnet 5.5'
  ],
  answer: 0,
  explain: `**Đáp án đúng: Haiku 5.5 nhanh nhất và rẻ nhất** cho tác vụ high-volume, latency-sensitive như classification/extraction/routing.`
},
{
  id: 'qz-claude-022',
  topic: 'claude',
  q: '[Model Selection] Tác vụ coding agent chạy lâu, nhiều bước. Model nào phù hợp nhất?',
  options: [
    'Claude Haiku 5.5',
    'Claude Opus 5.5',
    'Claude Sonnet 5.5',
    'Claude Fable 5.1'
  ],
  answer: 1,
  explain: `**Đáp án đúng: Opus 5.5 dành cho long-running agentic coding và knowledge work.** Fable dành cho reasoning rất nặng/long-horizon; Sonnet cân bằng tốc độ/trí tuệ; Haiku cho tác vụ nhẹ.`
},
{
  id: 'qz-claude-023',
  topic: 'claude',
  q: '[Model Selection] Model nào được mô tả là cân bằng tốt nhất giữa tốc độ và trí tuệ?',
  options: [
    'Claude Opus 5.5',
    'Claude Haiku 5.5',
    'Claude Sonnet 5.5',
    'Claude Fable 5.1'
  ],
  answer: 2,
  explain: `**Đáp án đúng: Sonnet 5.5** là best combination of speed and intelligence.`
},
{
  id: 'qz-claude-024',
  topic: 'claude',
  q: '[Model Selection] Tác vụ reasoning rất nặng, agent dài hạn; eval trên Opus ở effort cao vẫn chưa đủ. Nên chọn gì?',
  options: [
    'Claude Opus 5.5',
    'Claude Sonnet 5.5',
    'Claude Haiku 5.5',
    'Claude Fable 5.1'
  ],
  answer: 3,
  explain: `**Đáp án đúng: Fable 5.1** cho demanding reasoning và long-horizon agentic work, hoặc khi eval trên Opus ở effort cao vẫn thiếu.`
},
{
  id: 'qz-claude-025',
  topic: 'claude',
  q: '[Model Selection] Claude Haiku 5.5 có đặc điểm pricing nào?',
  options: [
    'Prompt trên 100.000 tokens trả giá cao hơn cho input/output',
    'Giá cố định mọi prompt length',
    'Prompt trên 100.000 tokens được giảm giá',
    'Chỉ batch API mới áp dụng'
  ],
  answer: 0,
  explain: `**Đáp án đúng: Haiku 5.5 giá theo độ dài prompt; prompt trên 100.000 tokens trả giá cao hơn.** Các model khác có full 1M context ở giá chuẩn.`
},
{
  id: 'qz-claude-026',
  topic: 'claude',
  q: '[Model Selection] Context window của các model Claude hiện hành là bao nhiêu?',
  options: [
    '32K tokens',
    '1M tokens',
    '128K tokens',
    '200K tokens'
  ],
  answer: 1,
  explain: `**Đáp án đúng: 1M tokens.** 1M là context window của các model hiện hành (Opus/Sonnet/Haiku 5.5, Fable 5.1), tính cả input lẫn output. 128K là trần **output** (max_tokens); 200K là context của một số model đời trước như Haiku 4.5; 32K là của các thế hệ rất cũ.`
},
{
  id: 'qz-claude-027',
  topic: 'claude',
  q: '[Model Selection] max_tokens tối đa của các model hiện hành (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.1) là bao nhiêu, và cần lưu ý gì?',
  options: [
    '4K token, không lưu ý gì',
    '128K token; với giá trị lớn như vậy, SDK yêu cầu dùng streaming để tránh timeout HTTP',
    '1M token, bằng context window',
    '32K token, chỉ nâng được bằng Batch API'
  ],
  answer: 1,
  explain: `**Đúng: phương án 2.** Các model hiện hành cho phép tới **128K token output** mỗi lượt. Request non-streaming chờ lâu có thể vượt timeout HTTP, nên SDK yêu cầu streaming với giá trị lớn ({{.stream()}} rồi lấy {{finalMessage()}} / {{get_final_message()}}).

### Vì sao các phương án khác sai
- **4K / 32K:** là giới hạn của các thế hệ model rất cũ.
- **1M:** đó là **context window** (input cộng output), không phải trần output.

> Gợi ý thực tế: request non-streaming nên để max_tokens khoảng 16K; streaming thì có thể để cao hơn. Đừng đặt max_tokens quá thấp, vì bị cắt giữa chừng sẽ phải gọi lại, tốn hơn.`
},
{
  id: 'qz-claude-028',
  topic: 'claude',
  q: '[Applications] Bạn nhận kết quả của một Message Batch gồm 10.000 request. Cách ghép kết quả với dữ liệu gốc nào là đúng?',
  options: [
    'Ghép theo thứ tự: kết quả thứ i ứng với request thứ i',
    'Ghép theo thời gian hoàn thành',
    'Ghép theo nội dung câu trả lời',
    'Ghép theo custom_id đã gán cho từng request khi tạo batch'
  ],
  answer: 3,
  explain: `**Đúng: phương án 4.** Mỗi request trong batch có {{custom_id}} do bạn đặt (ví dụ id bản ghi trong DB). Kết quả trả về **theo thứ tự bất kỳ**, nên phải ghép theo {{custom_id}}, không bao giờ theo vị trí.

Mỗi kết quả có {{result.type}} là một trong {{succeeded}}, {{errored}}, {{canceled}}, {{expired}}. Cần xử lý cả bốn: ví dụ gom các request errored hoặc expired để gửi lại trong batch sau.

### Vì sao các phương án khác sai
- **Theo thứ tự:** thứ tự không được đảm bảo. Ghép theo vị trí sẽ gán nhầm kết quả cho bản ghi khác, và lỗi này rất khó phát hiện.
- **Theo thời gian / nội dung:** không xác định duy nhất request gốc.`
},
{
  id: 'qz-claude-029',
  topic: 'claude',
  q: '[Model Selection] Giá cache read (đọc từ prompt cache) so với giá input thường như thế nào?',
  options: [
    'Rẻ hơn nhiều: khoảng 0.1x giá input; một số model có giá riêng (ví dụ Opus 5.5: $0.20/MTok so với $4/MTok input)',
    'Bằng 1.25x giá input',
    'Bằng giá input, cache chỉ giúp giảm độ trễ',
    'Gấp 2 lần giá input'
  ],
  answer: 0,
  explain: `**Đúng: phương án 1.** Prompt caching có 2 loại chi phí:
- **Cache write** (lần đầu ghi prefix vào cache): **đắt hơn** input thường, khoảng 1.25x với TTL 5 phút, cao hơn nữa với TTL 1 giờ.
- **Cache read** (các lần sau dùng lại prefix): **rẻ hơn rất nhiều**, thường khoảng 0.1x. Một số model có giá riêng: Opus 5.5 và Sonnet 5.5 đọc cache với giá $0.20/MTok (tương ứng 0.05x và 0.1x giá input), Fable 5.1 là $0.25/MTok.

Vì vậy cache chỉ có lợi khi prefix **được dùng lại nhiều lần** trong thời gian TTL.

### Vì sao các phương án khác sai
- **1.25x:** đó là giá **write**, không phải read.
- **Bằng giá input:** sai. Cache giảm cả chi phí lẫn độ trễ.
- **Gấp 2:** không có mức giá nào như vậy.

> Kiểm tra cache có hoạt động không: xem {{usage.cache_read_input_tokens}}. Nếu luôn bằng 0 dù prefix giống nhau thì có thứ gì đó làm prefix thay đổi, ví dụ timestamp trong system prompt.`
},
{
  id: 'qz-claude-030',
  topic: 'claude',
  q: '[Model Selection] Để tối ưu chi phí/chất lượng, chiến lược routing nào hợp lý?',
  options: [
    'Luôn dùng model lớn nhất cho mọi request',
    'Dùng model nhỏ/rẻ cho tác vụ đơn giản, escalate lên model lớn khi eval cho thấy cần',
    'Chỉ dùng Haiku vì rẻ nhất',
    'Chọn model theo tên người dùng'
  ],
  answer: 1,
  explain: `**Đáp án đúng: routing theo độ khó**, bắt đầu model nhỏ và escalate khi eval cho thấy cần.`
},
{
  id: 'qz-claude-031',
  topic: 'claude',
  q: '[Agents] Trong agent dùng tool, vòng lặp cơ bản là gì?',
  options: [
    'Gửi prompt một lần và parse text',
    'Gửi tất cả tool cùng lúc rồi kết thúc',
    'Gửi request; nếu stop_reason là tool_use thì chạy tool và gửi tool_result; lặp cho đến end_turn',
    'Chỉ dùng server tools, không loop'
  ],
  answer: 2,
  explain: `**Đáp án đúng: agentic loop dựa trên stop_reason tool_use**, xử lý tool rồi gửi kết quả về, lặp cho đến end_turn.`
},
{
  id: 'qz-claude-032',
  topic: 'claude',
  q: '[Agents] stop_reason là pause_turn. Bạn nên làm gì?',
  options: [
    'Bỏ qua và kết thúc',
    'Retry từ đầu',
    'Tăng max_tokens',
    'Gửi lại assistant content để tiếp tục vòng server-tool'
  ],
  answer: 3,
  explain: `**Đáp án đúng: pause_turn nghĩa là server-tool loop đạt giới hạn iteration**, gửi lại assistant content để tiếp tục.`
},
{
  id: 'qz-claude-033',
  topic: 'claude',
  q: '[Agents] Claude có thể gọi nhiều tool trong cùng một lượt. Để xử lý đúng, ứng dụng phải làm gì?',
  options: [
    'Chạy tất cả tool_use block và trả về nhiều tool_result tương ứng',
    'Chỉ xử lý tool_use đầu tiên',
    'Bỏ qua các tool còn lại',
    'Gửi lại prompt'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phải xử lý mọi tool_use block và trả về tool_result khớp từng id.**`
},
{
  id: 'qz-claude-034',
  topic: 'claude',
  q: '[Agents] Nếu muốn Claude gọi từng tool một, dùng tham số nào?',
  options: [
    'max_tokens: 1',
    'tool_choice: {type: auto, disable_parallel_tool_use: true}',
    'temperature: 0',
    'stop_sequences: [tool_use]'
  ],
  answer: 1,
  explain: `**Đáp án đúng: disable_parallel_tool_use trong tool_choice auto** ngăn gọi nhiều tool song song.`
},
{
  id: 'qz-claude-035',
  topic: 'claude',
  q: '[Agents] Một tool do bạn định nghĩa bị lỗi khi chạy (ví dụ API ngoài trả 500). Bạn nên báo lại cho Claude thế nào?',
  options: [
    'Bỏ qua tool_use đó, không gửi tool_result',
    'Gửi tool_result có is_error: true kèm thông điệp lỗi ngắn gọn, để Claude tự quyết thử lại hay đổi cách',
    'Ném exception và dừng toàn bộ agent',
    'Gửi tool_result rỗng như thể thành công'
  ],
  answer: 1,
  explain: `**Đúng: phương án 2.** Với mỗi {{tool_use}} trong lượt assistant, lượt user tiếp theo **phải** có {{tool_result}} cùng {{tool_use_id}}. Khi tool lỗi, gửi {{is_error: true}} và một thông điệp rõ ràng (ví dụ "Billing API timeout sau 5s"). Claude sẽ tự chọn thử lại, dùng tool khác hoặc báo cho người dùng.

### Vì sao các phương án khác sai
- **Không gửi tool_result:** request tiếp theo bị lỗi vì có tool_use chưa được trả lời.
- **Dừng cả agent:** một lỗi tạm thời không nên làm hỏng cả phiên làm việc. Nên để model xử lý, kèm giới hạn số bước và số lần thử lại ở phía bạn.
- **Giả vờ thành công:** model sẽ suy luận trên dữ liệu không tồn tại, dẫn tới trả lời sai mà không ai biết.

> Nếu Claude gọi nhiều tool song song, trả **tất cả** tool_result trong **một** message user. Tool nào lỗi thì đánh dấu is_error, đừng bỏ sót.`
},
{
  id: 'qz-claude-036',
  topic: 'claude',
  q: '[Agents] Khi gửi tool_result về API, trường nào phải khớp với tool_use?',
  options: [
    'name phải bằng user id',
    'content phải rỗng',
    'type phải là tool_use',
    'tool_use_id phải bằng id của tool_use block'
  ],
  answer: 3,
  explain: `**Đáp án đúng: tool_result dùng tool_use_id để liên kết với tool_use block.**`
},
{
  id: 'qz-claude-037',
  topic: 'claude',
  q: '[Agents] Để Claude gọi tool ít hoặc nhiều hơn, nên làm gì?',
  options: [
    'Dùng system prompt mô tả khi nào dùng tool, và tool description rõ ràng',
    'Chỉ chỉnh temperature',
    'Xóa tool description',
    'Tăng max_tokens'
  ],
  answer: 0,
  explain: `**Đáp án đúng: steering qua system prompt và mô tả tool rõ ràng.** Temperature không điều khiển tool use.`
},
{
  id: 'qz-claude-038',
  topic: 'claude',
  q: '[Agents] Dùng MCP connector trong Messages API cần header beta nào?',
  options: [
    'anthropic-version: 2023-06-01',
    'anthropic-beta: mcp-client-2025-11-20',
    'x-mcp: true',
    'beta: mcp-latest'
  ],
  answer: 1,
  explain: `**Đáp án đúng: beta header mcp-client-2025-11-20.** Version header là bắt buộc nhưng không phải beta MCP.`
},
{
  id: 'qz-claude-039',
  topic: 'claude',
  q: '[Agents] MCP connector hiện hỗ trợ gì và giới hạn gì?',
  options: [
    'Hỗ trợ toàn bộ MCP spec kể cả resources/prompts',
    'Hỗ trợ local STDIO server trực tiếp',
    'Hỗ trợ tool calls; server phải public HTTP, không STDIO; chỉ tool calls trong spec',
    'Không cần beta header'
  ],
  answer: 2,
  explain: `**Đáp án đúng: chỉ tool calls, server public HTTP, không STDIO.** Resources/prompts chưa hỗ trợ.`
},
{
  id: 'qz-claude-040',
  topic: 'claude',
  q: '[Prompt] System prompt nên dùng để làm gì?',
  options: [
    'Chứa toàn bộ lịch sử hội thoại',
    'Thay thế tool schema',
    'Lưu API key',
    'Định nghĩa vai trò, ràng buộc, định dạng và chính sách cho model'
  ],
  answer: 3,
  explain: `**Đáp án đúng: system prompt định hướng hành vi và ràng buộc.** Lịch sử nằm ở messages.`
},
{
  id: 'qz-claude-041',
  topic: 'claude',
  q: '[Prompt] Prompt cache có TTL nào?',
  options: [
    '5 phút mặc định; có thể 1 giờ với cache_control ttl 1h (write giá cao hơn)',
    'Chỉ 1 phút',
    'Vĩnh viễn',
    '24 giờ'
  ],
  answer: 0,
  explain: `**Đáp án đúng: mặc định 5 phút; 1 giờ với ttl 1h** và cache write đắt hơn.`
},
{
  id: 'qz-claude-042',
  topic: 'claude',
  q: '[Prompt] Automatic caching (cache_control ở top-level) phù hợp khi nào?',
  options: [
    'Khi cần kiểm soát chính xác từng breakpoint',
    'Khi muốn hệ thống tự quản lý cache breakpoint khi hội thoại tăng dần',
    'Khi không muốn cache',
    'Chỉ dùng cho batch API'
  ],
  answer: 1,
  explain: `**Đáp án đúng: automatic caching tự quản lý breakpoint** khi hội thoại tăng dần; explicit cho kiểm soát chi tiết.`
},
{
  id: 'qz-claude-043',
  topic: 'claude',
  q: '[Prompt] Khi đưa tài liệu lớn và câu hỏi, thứ tự nào giúp caching và attention tốt hơn?',
  options: [
    'Câu hỏi trước, tài liệu sau',
    'Trộn tài liệu và câu hỏi',
    'Tài liệu (tĩnh) trước, câu hỏi (động) sau',
    'Chỉ gửi câu hỏi'
  ],
  answer: 2,
  explain: `**Đáp án đúng: nội dung tĩnh trước, động sau** để cache prefix và rõ ràng.`
},
{
  id: 'qz-claude-044',
  topic: 'claude',
  q: '[Prompt] Để giảm prompt injection từ nội dung người dùng, biện pháp nào phù hợp?',
  options: [
    'Tin mọi instruction trong user content',
    'Tắt system prompt',
    'Dùng temperature cao',
    'Tách system policy và user content, validate/escape, dùng tool schema và output constraints'
  ],
  answer: 3,
  explain: `**Đáp án đúng: tách policy và content, validate/sanitize.** Không tin instruction trong user content.`
},
{
  id: 'qz-claude-045',
  topic: 'claude',
  q: '[Prompt] Few-shot examples nên đặt ở đâu để hiệu quả và cache tốt?',
  options: [
    'Trong system/user prompt trước câu hỏi thực tế, ổn định giữa các request',
    'Sau câu hỏi người dùng',
    'Trong tool result',
    'Không dùng examples'
  ],
  answer: 0,
  explain: `**Đáp án đúng: examples ổn định đứng trước câu hỏi thực tế**, giúp cache và nhất quán.`
},
{
  id: 'qz-claude-046',
  topic: 'claude',
  q: '[Prompt] Muốn câu trả lời ngắn gọn, cách nào hiệu quả hơn chỉ dựa vào max_tokens?',
  options: [
    'Chỉ giảm max_tokens',
    'Nêu rõ ràng độ dài mong muốn trong prompt và format',
    'Tăng temperature',
    'Dùng model lớn hơn'
  ],
  answer: 1,
  explain: `**Đáp án đúng: chỉ dẫn rõ ràng về độ dài/format trong prompt** hiệu quả hơn chỉ cắt token.`
},
{
  id: 'qz-claude-047',
  topic: 'claude',
  q: '[Tools] Để Claude gọi function do bạn định nghĩa, cần cung cấp gì?',
  options: [
    'Chỉ tên function',
    'Chỉ description',
    'name, description và input_schema JSON Schema',
    'API key của function'
  ],
  answer: 2,
  explain: `**Đáp án đúng: tool cần name, description và input_schema.**`
},
{
  id: 'qz-claude-048',
  topic: 'claude',
  q: '[Tools] tool_choice: {type: none} có tác dụng gì?',
  options: [
    'Buộc gọi tool',
    'Tắt tất cả tool',
    'Chỉ dùng server tools',
    'Ngăn Claude gọi tool, chỉ sinh text'
  ],
  answer: 3,
  explain: `**Đáp án đúng: none ngăn model gọi tool trong lượt đó**, nhưng tool vẫn được khai báo.`
},
{
  id: 'qz-claude-049',
  topic: 'claude',
  q: '[Tools] Strict tool use (strict: true) đảm bảo điều gì?',
  options: [
    'Tên tool và input được validate theo schema',
    'Model luôn gọi tool',
    'Tool chạy nhanh hơn',
    'Không cần input_schema'
  ],
  answer: 0,
  explain: `**Đáp án đúng: strict đảm bảo tên tool và input đúng schema.**`
},
{
  id: 'qz-claude-050',
  topic: 'claude',
  q: '[Tools] Web search là loại tool nào và ai thực thi?',
  options: [
    'Client tool, ứng dụng phải gọi search engine',
    'Server tool, Anthropic thực thi và trả kết quả trong response',
    'MCP tool bắt buộc',
    'Batch-only tool'
  ],
  answer: 1,
  explain: `**Đáp án đúng: web search là server tool**, Anthropic thực thi.`
},
{
  id: 'qz-claude-051',
  topic: 'claude',
  q: '[Tools] Code execution tool cho phép gì?',
  options: [
    'Chạy code trên máy client',
    'Biên dịch Java trên server người dùng',
    'Claude chạy code trong sandbox của Anthropic',
    'Chỉ chạy Python local'
  ],
  answer: 2,
  explain: `**Đáp án đúng: code execution chạy trong sandbox của Anthropic.**`
},
{
  id: 'qz-claude-052',
  topic: 'claude',
  q: '[Tools] Dùng MCP connector trong Messages API, ngoài mcp_servers bạn còn phải khai báo gì?',
  options: [
    'Không cần gì thêm, chỉ mcp_servers là đủ',
    'Một client tool tên "mcp" do bạn tự viết',
    'Một tool type mcp_toolset trong tools, trỏ tới cùng tên server (mcp_server_name), kèm beta header mcp-client-2025-11-20',
    'Một system prompt liệt kê URL của server'
  ],
  answer: 2,
  explain: `**Đúng: phương án 3.** MCP connector cần **cả hai phần**:
1. {{mcp_servers}} (mỗi phần tử có {{type: "url"}}, {{url}}, {{name}}): khai báo server MCP từ xa (qua HTTP).
2. Trong {{tools}}, một mục {{type: "mcp_toolset"}} với {{mcp_server_name}} trùng {{name}} ở trên: cho phép Claude dùng tool của server đó. Trong toolset có thể cấu hình bật hoặc tắt từng tool.

Kèm beta header {{mcp-client-2025-11-20}}.

### Vì sao các phương án khác sai
- **Chỉ mcp_servers:** bị từ chối với lỗi validation.
- **Tự viết client tool "mcp":** đó là cách tự triển khai, không phải MCP connector. Với connector, Anthropic gọi server MCP giúp bạn.
- **Ghi URL trong prompt:** model không tự kết nối tới URL nằm trong prompt.`
},
{
  id: 'qz-claude-053',
  topic: 'claude',
  q: '[Security] API key Anthropic nên được lưu ở đâu trong ứng dụng web?',
  options: [
    'Trên server/backend, frontend gọi qua backend',
    'Trong frontend JS để gọi trực tiếp',
    'Trong localStorage',
    'Trong URL query'
  ],
  answer: 0,
  explain: `**Đáp án đúng: không để API key ở client.** Gọi qua backend để bảo mật.`
},
{
  id: 'qz-claude-054',
  topic: 'claude',
  q: '[Security] Khi Claude có tool truy cập dữ liệu nhạy cảm, rủi ro nào lớn nhất?',
  options: [
    'Model tự xóa database',
    'Prompt injection khiến model gọi tool với tham số độc hại',
    'API key hết hạn',
    'Rate limit'
  ],
  answer: 1,
  explain: `**Đáp án đúng: prompt injection có thể làm model gọi tool sai mục đích.** Cần guardrails và validation.`
},
{
  id: 'qz-claude-055',
  topic: 'claude',
  q: '[Security] Trước khi gửi dữ liệu người dùng cho API, nên làm gì?',
  options: [
    'Gửi nguyên mọi PII vì API an toàn tuyệt đối',
    'Mã hóa bằng base64',
    'Cân nhắc minimize/redact PII, tuân thủ chính sách và pháp lý',
    'Nén gzip'
  ],
  answer: 2,
  explain: `**Đáp án đúng: giảm thiểu PII và tuân thủ chính sách.** Base64/gzip không phải bảo mật.`
},
{
  id: 'qz-claude-056',
  topic: 'claude',
  q: '[Security] Khi model từ chối do safety, ứng dụng nên làm gì?',
  options: [
    'Retry liên tục với cùng prompt',
    'Tăng temperature',
    'Bỏ qua policy',
    'Giải thích giới hạn, điều chỉnh yêu cầu hợp lệ, hoặc fallback an toàn'
  ],
  answer: 3,
  explain: `**Đáp án đúng: không ép model vi phạm; điều chỉnh hoặc fallback an toàn.**`
},
{
  id: 'qz-claude-057',
  topic: 'claude',
  q: '[Security] Dù dùng structured output, server vẫn nên làm gì?',
  options: [
    'Validate/sanitize output trước khi dùng, đặc biệt với code/SQL',
    'Tin tuyệt đối output',
    'Không cần log',
    'Tắt schema'
  ],
  answer: 0,
  explain: `**Đáp án đúng: output vẫn cần validate/sanitize** vì schema không đảm bảo an toàn ngữ nghĩa.`
},
{
  id: 'qz-claude-058',
  topic: 'claude',
  q: '[Claude Code] Trong Claude Code, file CLAUDE.md dùng để làm gì?',
  options: [
    'Lưu API key',
    'Cung cấp hướng dẫn/ngữ cảnh dự án cho agent',
    'Định nghĩa database schema bắt buộc',
    'Thay thế git'
  ],
  answer: 1,
  explain: `**Đáp án đúng: CLAUDE.md cung cấp context/hướng dẫn dự án** cho Claude Code.`
},
{
  id: 'qz-claude-059',
  topic: 'claude',
  q: '[Claude Code] Claude Code thực thi lệnh shell/file. Best practice về quyền là gì?',
  options: [
    'Cho phép mọi lệnh tự động',
    'Tắt sandbox',
    'Review/approve các hành động nguy hiểm, giới hạn quyền và audit',
    'Chia sẻ session công khai'
  ],
  answer: 2,
  explain: `**Đáp án đúng: giới hạn quyền, review hành động nguy hiểm và audit.**`
},
{
  id: 'qz-claude-060',
  topic: 'claude',
  q: '[Eval] Để đánh giá chất lượng ứng dụng LLM, phương pháp nào phù hợp?',
  options: [
    'Chỉ đọc vài câu trả lời',
    'Tăng temperature để đa dạng',
    'Xóa log',
    'Bộ eval có test case, expected behavior, chấm tự động/model grader, theo dõi regression'
  ],
  answer: 3,
  explain: `**Đáp án đúng: eval có test case và regression tracking** để đo chất lượng khách quan.`
},
);