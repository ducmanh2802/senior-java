/* Lessons for the claude track (owner: T319). Format: see AGENTS.md */
(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-claude-001',
  track: 'claude',
  order: 1,
  title: 'Vòng lặp agent với tool use: tool_use, tool_result, stop_reason và giới hạn số bước',
  level: 'senior',
  minutes: 40,
  goals: [
    'Mô tả được một vòng tool use đầy đủ: khai báo {{tools}}, nhận {{tool_use}}, chạy tool, gửi {{tool_result}} và gọi lại model',
    'Xử lý đúng từng giá trị {{stop_reason}}: {{end_turn}}, {{tool_use}}, {{max_tokens}}, {{stop_sequence}}, {{pause_turn}}, {{refusal}}',
    'Viết vòng lặp an toàn: giới hạn số bước, tool lỗi thì trả {{is_error}} cho model thay vì làm sập request',
  ],
  body: `### Vì sao cần một "vòng lặp"
Model không tự chạy được code của bạn. Nó chỉ sinh ra văn bản. Khi bạn khai báo cho Claude danh sách **tools** (ví dụ "tra thời tiết", "truy vấn đơn hàng"), model có thể trả lời bằng một yêu cầu kiểu "hãy gọi tool {{get_weather}} với input này". **Chính backend Java của bạn** chạy tool, rồi gửi kết quả trở lại trong một request mới. Model đọc kết quả rồi hoặc trả lời người dùng, hoặc xin gọi thêm tool. Lặp lại cho tới khi model nói "xong". Đó là **agent loop**.

Điều quan trọng cần nhớ: Messages API là **stateless**. Server không nhớ gì giữa hai request, nên mỗi lần gọi bạn phải gửi **toàn bộ hội thoại** từ đầu: message của user, message của assistant (nguyên văn, kể cả block {{tool_use}}), message chứa {{tool_result}}… Nếu bạn quên nối message assistant vào lịch sử, model sẽ thấy một {{tool_result}} "từ trên trời rơi xuống" và API trả lỗi 400.

### Bước 1: khai báo tool trong request
Mỗi tool có {{name}}, {{description}} (viết kỹ: model dựa vào đây để quyết định có gọi hay không) và {{input_schema}} là một JSON Schema mô tả input.

~~~json
{
  "model": "claude-sonnet-5-5",
  "max_tokens": 1024,
  "tools": [{
    "name": "get_weather",
    "description": "Lấy thời tiết hiện tại của một thành phố. Dùng khi người dùng hỏi về thời tiết.",
    "input_schema": {
      "type": "object",
      "properties": { "city": { "type": "string", "description": "Tên thành phố, ví dụ Hanoi" } },
      "required": ["city"]
    }
  }],
  "messages": [{ "role": "user", "content": "Hà Nội hôm nay nóng không?" }]
}
~~~

### Bước 2: model trả về block tool_use
Response có {{stop_reason}} là {{"tool_use"}} và trong {{content}} có một (hoặc nhiều) block {{tool_use}} gồm {{id}}, {{name}}, {{input}}. Có thể kèm block {{text}} phía trước (model "nghĩ thành tiếng").

~~~json
{
  "role": "assistant",
  "stop_reason": "tool_use",
  "content": [
    { "type": "text", "text": "Để tôi kiểm tra thời tiết Hà Nội." },
    { "type": "tool_use", "id": "toolu_01A", "name": "get_weather", "input": { "city": "Hanoi" } }
  ]
}
~~~

### Bước 3: chạy tool, gửi tool_result theo đúng tool_use_id
Bạn nối **nguyên văn** message assistant ở trên vào lịch sử, rồi thêm một message **role user** chứa block {{tool_result}}. Trường {{tool_use_id}} phải trùng {{id}} của block {{tool_use}} tương ứng: đây là cách model biết kết quả nào thuộc lời gọi nào.

~~~json
{
  "role": "user",
  "content": [
    { "type": "tool_result", "tool_use_id": "toolu_01A", "content": "32°C, nắng, độ ẩm 70%" }
  ]
}
~~~

Quy tắc hay bị vi phạm:
- Message chứa {{tool_result}} phải đi **ngay sau** message assistant chứa {{tool_use}}, và các block {{tool_result}} phải đứng **trước** mọi block text trong content đó.
- **Mỗi** {{tool_use}} phải có đúng một {{tool_result}}. Khi model gọi song song nhiều tool trong một lượt (parallel tool use), bạn gửi **tất cả** kết quả trong **một** message user, không tách thành nhiều message.
- Tool lỗi: vẫn gửi {{tool_result}}, nhưng đặt {{"is_error": true}} và ghi rõ lỗi trong {{content}}. Model đọc được lỗi và thường tự sửa (đổi input, thử tool khác, hoặc xin lỗi người dùng). Đừng ném exception làm sập cả request: người dùng mất toàn bộ công việc trước đó.

### Bước 4: lặp theo stop_reason

| stop_reason | Nghĩa | Backend nên làm gì |
|---|---|---|
| {{end_turn}} | Model trả lời xong tự nhiên | Trả kết quả cho người dùng, thoát vòng lặp |
| {{tool_use}} | Model muốn gọi tool | Chạy tool, gửi {{tool_result}}, gọi lại |
| {{max_tokens}} | Chạm giới hạn {{max_tokens}} của request | Câu trả lời bị **cắt**: tăng {{max_tokens}} hoặc yêu cầu viết tiếp; không coi là xong |
| {{stop_sequence}} | Gặp một chuỗi trong {{stop_sequences}} bạn tự đặt | Xử lý theo logic của bạn (trường {{stop_sequence}} cho biết chuỗi nào) |
| {{pause_turn}} | Lượt dài bị tạm dừng (thường gặp với server tool như web search) | Gửi lại hội thoại kèm message assistant đó để model làm tiếp |
| {{refusal}} | Model từ chối vì lý do an toàn | Không retry y nguyên; báo người dùng hoặc chuyển hướng |

> Bẫy hay gặp: chỉ kiểm tra "có block tool_use không" mà bỏ qua {{max_tokens}}. Nếu {{max_tokens}} quá nhỏ, block {{tool_use}} có thể bị cắt giữa chừng và input không đầy đủ. Luôn rẽ nhánh theo {{stop_reason}}.

### Giới hạn số bước: vì sao bắt buộc
Model có thể rơi vào vòng lặp: gọi cùng một tool với cùng input mãi, hoặc tool cứ trả lỗi và model cứ thử lại. Mỗi vòng là một request tính tiền và cộng thêm token (vì lịch sử ngày càng dài). Một agent không có trần số bước có thể đốt hàng trăm nghìn token chỉ cho một câu hỏi. Vì vậy vòng lặp luôn có {{maxSteps}} (thường 5–20 tuỳ tác vụ), và khi chạm trần thì dừng với một trạng thái rõ ràng ("max_steps") để UI hiển thị "không hoàn thành được" thay vì treo.

~~~java
// Khung vòng lặp (giả mã, dùng kiểu tự định nghĩa thay vì SDK cụ thể)
List<Message> history = new ArrayList<>(List.of(userMessage(prompt)));
for (int step = 1; step <= maxSteps; step++) {
    Reply reply = client.send(history);              // gửi TOÀN BỘ lịch sử (API stateless)
    history.add(assistantMessage(reply.content()));  // nối nguyên văn, kể cả tool_use
    if (!reply.stopReason().equals("tool_use")) return finish(reply);  // end_turn, max_tokens, refusal...
    List<Block> results = new ArrayList<>();
    for (Block call : toolUses(reply))               // có thể nhiều tool_use song song
        results.add(runSafely(call));                // exception → tool_result với is_error = true
    history.add(userMessage(results));               // tất cả kết quả trong MỘT message user
}
return stoppedAt(maxSteps);                          // không bao giờ lặp vô hạn
~~~

### Pitfall trên production
- **Tool chạy lâu**: đặt timeout cho từng tool (ví dụ 10 giây); hết giờ thì trả {{is_error}} "timeout" thay vì để request HTTP của người dùng treo.
- **Tool có side effect** (chuyển tiền, gửi email): model có thể gọi lại cùng tool khi thấy lỗi. Hãy dùng idempotency key và với hành động nguy hiểm thì cần người dùng xác nhận trước khi chạy.
- **Kết quả tool quá lớn** (trả cả bảng 5.000 dòng) làm phình context và tăng chi phí mỗi vòng. Cắt bớt, phân trang, hoặc tóm tắt trước khi gửi.
- **Không tin input của model**: validate input theo schema và quyền của người dùng hiện tại trước khi chạy tool, vì nội dung độc hại trong tài liệu có thể dẫn model gọi tool sai (prompt injection).

### Liên hệ phỏng vấn
Interviewer hay hỏi: "API stateless thì agent nhớ ngữ cảnh bằng cách nào?" (client gửi lại toàn bộ lịch sử), "model gọi 3 tool song song thì gửi kết quả ra sao?" (một message user, ba {{tool_result}}, khớp {{tool_use_id}}), "tool ném exception thì sao?" ({{is_error}}), và "làm sao chặn agent chạy mãi?" (trần số bước, timeout, ngân sách token). Bài tập dưới đây bắt bạn tự viết đúng vòng lặp này với một model giả.`,
  exercises: [
    {
      title: 'Viết AgentLoop: gọi tool, nối tool_result, dừng đúng lúc',
      prompt: `Các kiểu {{Block}}, {{Message}}, {{ModelReply}}, {{FakeModel}}, {{AgentResult}} mô phỏng Messages API (không cần sửa). Hãy viết {{AgentLoop.run(userPrompt, model, tools, maxSteps)}}:

1. Hội thoại bắt đầu bằng một message {{user}} chứa một block text là {{userPrompt}}.
2. Mỗi **bước**: gọi {{model.next(hội thoại)}} (truyền **bản sao** của danh sách), tăng số bước, rồi nối nguyên văn {{reply.content()}} vào hội thoại dưới dạng message {{assistant}}.
3. Nếu {{stopReason}} là {{"tool_use"}}: với **mỗi** block {{tool_use}} theo thứ tự, chạy tool trong map {{tools}} theo {{name}} với {{input}}; tạo {{Block.toolResult(id, kết quả, false)}}. Tool không tồn tại → {{is_error = true}}, content {{"Unknown tool: " + name}}. Tool ném {{RuntimeException}} → {{is_error = true}}, content chứa message của exception. Gửi **tất cả** kết quả trong **một** message {{user}}, rồi lặp tiếp.
4. Nếu {{stopReason}} là {{"pause_turn"}}: không thêm gì, gọi lại model.
5. Các {{stopReason}} khác ({{end_turn}}, {{max_tokens}}, {{refusal}}…): trả về {{AgentResult(text, steps, stopReason)}} với {{text}} là nối các block text của reply cuối.
6. Đã gọi model đủ {{maxSteps}} lần mà chưa xong → trả về {{AgentResult(text của reply cuối, maxSteps, "max_steps")}}.`,
      starter: `// ====== Mô phỏng Messages API (không cần sửa) ======
record Block(String type, String text, String id, String name, Map<String, Object> input,
             String toolUseId, String content, boolean isError) {
    static Block text(String text) { return new Block("text", text, null, null, null, null, null, false); }
    static Block toolUse(String id, String name, Map<String, Object> input) {
        return new Block("tool_use", null, id, name, input, null, null, false);
    }
    static Block toolResult(String toolUseId, String content, boolean isError) {
        return new Block("tool_result", null, null, null, null, toolUseId, content, isError);
    }
}
record Message(String role, List<Block> content) {}           // role: "user" | "assistant"
record ModelReply(String stopReason, List<Block> content) {}
interface FakeModel { ModelReply next(List<Message> conversation); }
record AgentResult(String answer, int steps, String stopReason) {}

// ====== Bài của bạn ======
class AgentLoop {
    static AgentResult run(String userPrompt, FakeModel model,
                           Map<String, Function<Map<String, Object>, String>> tools, int maxSteps) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static void ok(boolean cond, String msg) { if (!cond) throw new AssertionError(msg); }

    // Model giả: trả lần lượt các reply định sẵn, ghi lại hội thoại nhận được ở mỗi lần gọi
    static class ScriptedModel implements FakeModel {
        final List<ModelReply> script;
        final List<List<Message>> seen = new ArrayList<>();
        ScriptedModel(ModelReply... replies) { script = List.of(replies); }
        public ModelReply next(List<Message> conversation) {
            seen.add(new ArrayList<>(conversation));
            return script.get(Math.min(seen.size() - 1, script.size() - 1));   // hết kịch bản: lặp reply cuối
        }
    }
    static ModelReply reply(String stop, Block... blocks) { return new ModelReply(stop, List.of(blocks)); }
    static Map<String, Object> in(String k, Object v) { Map<String, Object> m = new HashMap<>(); m.put(k, v); return m; }

    public static void main(String[] args) {
        check("calls the tool with the model's input", () -> {
            List<Map<String, Object>> calls = new ArrayList<>();
            Map<String, Function<Map<String, Object>, String>> tools = new HashMap<>();
            tools.put("get_weather", input -> { calls.add(input); return "30C, nang"; });
            ScriptedModel m = new ScriptedModel(
                reply("tool_use", Block.text("De toi xem."), Block.toolUse("toolu_01", "get_weather", in("city", "Hanoi"))),
                reply("end_turn", Block.text("Ha Noi dang 30 do.")));
            AgentResult r = AgentLoop.run("Thoi tiet Ha Noi?", m, tools, 5);
            eq(1, calls.size()); eq("Hanoi", calls.get(0).get("city"));
            eq("Ha Noi dang 30 do.", r.answer()); eq(2, r.steps()); eq("end_turn", r.stopReason());
        });
        check("tool_result goes back with the matching tool_use_id", () -> {
            Map<String, Function<Map<String, Object>, String>> tools = new HashMap<>();
            tools.put("get_weather", input -> "30C, nang");
            ModelReply first = reply("tool_use", Block.toolUse("toolu_01", "get_weather", in("city", "Hanoi")));
            ScriptedModel m = new ScriptedModel(first, reply("end_turn", Block.text("xong")));
            AgentLoop.run("Thoi tiet?", m, tools, 5);
            eq(1, m.seen.get(0).size()); eq("user", m.seen.get(0).get(0).role());
            eq("Thoi tiet?", m.seen.get(0).get(0).content().get(0).text());
            List<Message> second = m.seen.get(1);
            eq(3, second.size());
            eq("assistant", second.get(1).role()); eq(first.content(), second.get(1).content());
            Message last = second.get(2);
            eq("user", last.role()); eq(1, last.content().size());
            Block b = last.content().get(0);
            eq("tool_result", b.type()); eq("toolu_01", b.toolUseId()); eq("30C, nang", b.content()); eq(false, b.isError());
        });
        check("parallel tool calls: all results in one user message, same order", () -> {
            Map<String, Function<Map<String, Object>, String>> tools = new HashMap<>();
            tools.put("price", input -> "100");
            tools.put("stock", input -> "7");
            ScriptedModel m = new ScriptedModel(
                reply("tool_use", Block.toolUse("toolu_A", "price", in("sku", "X")), Block.toolUse("toolu_B", "stock", in("sku", "X"))),
                reply("end_turn", Block.text("ok")));
            AgentLoop.run("Gia va ton kho?", m, tools, 5);
            eq(3, m.seen.get(1).size());
            List<Block> c = m.seen.get(1).get(2).content();
            eq(2, c.size());
            eq("toolu_A", c.get(0).toolUseId()); eq("100", c.get(0).content());
            eq("toolu_B", c.get(1).toolUseId()); eq("7", c.get(1).content());
        });
        check("tool exception becomes is_error and the loop keeps going", () -> {
            Map<String, Function<Map<String, Object>, String>> tools = new HashMap<>();
            tools.put("query_db", input -> { throw new IllegalStateException("DB timeout after 5s"); });
            ScriptedModel m = new ScriptedModel(
                reply("tool_use", Block.toolUse("toolu_09", "query_db", in("sql", "select 1"))),
                reply("end_turn", Block.text("Xin lỗi, DB đang lỗi.")));
            AgentResult r = AgentLoop.run("Dem don hang", m, tools, 5);
            eq("end_turn", r.stopReason()); eq(2, r.steps());
            Block b = m.seen.get(1).get(2).content().get(0);
            eq("toolu_09", b.toolUseId());
            ok(b.isError(), "is_error phai la true");
            ok(b.content() != null && b.content().contains("DB timeout"), "content nên chứa message lỗi, nhận: " + b.content());
        });
        check("unknown tool also returns is_error", () -> {
            ScriptedModel m = new ScriptedModel(
                reply("tool_use", Block.toolUse("toolu_X", "delete_everything", in("all", true))),
                reply("end_turn", Block.text("Khong co tool do.")));
            AgentResult r = AgentLoop.run("Xoa het", m, new HashMap<>(), 5);
            eq("end_turn", r.stopReason());
            Block b = m.seen.get(1).get(2).content().get(0);
            eq("toolu_X", b.toolUseId()); ok(b.isError(), "tool không tồn tại phải trả is_error = true");
        });
        check("stops after maxSteps", () -> {
            Map<String, Function<Map<String, Object>, String>> tools = new HashMap<>();
            tools.put("noop", input -> "ok");
            ScriptedModel m = new ScriptedModel(reply("tool_use", Block.text("thu lai"), Block.toolUse("toolu_L", "noop", in("x", 1))));
            AgentResult r = AgentLoop.run("lap mai", m, tools, 3);
            eq(3, r.steps()); eq("max_steps", r.stopReason()); eq(3, m.seen.size());
        });
        check("max_tokens and pause_turn are not end_turn", () -> {
            ScriptedModel cut = new ScriptedModel(reply("max_tokens", Block.text("Cau tra loi bi cat giua")));
            AgentResult r = AgentLoop.run("Viet dai", cut, new HashMap<>(), 5);
            eq("max_tokens", r.stopReason()); eq("Cau tra loi bi cat giua", r.answer()); eq(1, r.steps());
            ScriptedModel paused = new ScriptedModel(reply("pause_turn", Block.text("dang tim...")), reply("end_turn", Block.text("Ket qua")));
            AgentResult p = AgentLoop.run("Tim kiem", paused, new HashMap<>(), 5);
            eq("end_turn", p.stopReason()); eq(2, p.steps()); eq("Ket qua", p.answer());
            eq(2, paused.seen.get(1).size());   // pause_turn: chi noi message assistant, khong them message user
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `// ====== Mô phỏng Messages API (không cần sửa) ======
record Block(String type, String text, String id, String name, Map<String, Object> input,
             String toolUseId, String content, boolean isError) {
    static Block text(String text) { return new Block("text", text, null, null, null, null, null, false); }
    static Block toolUse(String id, String name, Map<String, Object> input) {
        return new Block("tool_use", null, id, name, input, null, null, false);
    }
    static Block toolResult(String toolUseId, String content, boolean isError) {
        return new Block("tool_result", null, null, null, null, toolUseId, content, isError);
    }
}
record Message(String role, List<Block> content) {}           // role: "user" | "assistant"
record ModelReply(String stopReason, List<Block> content) {}
interface FakeModel { ModelReply next(List<Message> conversation); }
record AgentResult(String answer, int steps, String stopReason) {}

// ====== Lời giải ======
class AgentLoop {
    static AgentResult run(String userPrompt, FakeModel model,
                           Map<String, Function<Map<String, Object>, String>> tools, int maxSteps) {
        List<Message> conversation = new ArrayList<>();
        conversation.add(new Message("user", List.of(Block.text(userPrompt))));
        String lastText = "";
        int steps = 0;
        while (steps < maxSteps) {
            ModelReply reply = model.next(new ArrayList<>(conversation));  // bản sao: API stateless, gửi cả lịch sử
            steps++;
            conversation.add(new Message("assistant", reply.content()));  // nối NGUYÊN VĂN, kể cả tool_use
            lastText = textOf(reply.content());
            switch (reply.stopReason()) {
                case "tool_use" -> {
                    List<Block> results = new ArrayList<>();
                    for (Block b : reply.content())
                        if ("tool_use".equals(b.type())) results.add(execute(b, tools));
                    conversation.add(new Message("user", results));       // MỌI kết quả trong một message user
                }
                case "pause_turn" -> { }                                    // gọi lại để model làm tiếp
                default -> { return new AgentResult(lastText, steps, reply.stopReason()); }
            }
        }
        return new AgentResult(lastText, steps, "max_steps");             // trần số bước: không lặp vô hạn
    }

    private static Block execute(Block call, Map<String, Function<Map<String, Object>, String>> tools) {
        Function<Map<String, Object>, String> tool = tools.get(call.name());
        if (tool == null) return Block.toolResult(call.id(), "Unknown tool: " + call.name(), true);
        try {
            return Block.toolResult(call.id(), tool.apply(call.input()), false);
        } catch (RuntimeException e) {                                     // lỗi tool → báo cho model, không sập
            return Block.toolResult(call.id(), "Error: " + e.getMessage(), true);
        }
    }

    private static String textOf(List<Block> blocks) {
        StringBuilder sb = new StringBuilder();
        for (Block b : blocks) if ("text".equals(b.type())) sb.append(b.text());
        return sb.toString();
    }
}`,
      hints: [
        'Giữ một {{List<Message>}} làm lịch sử. Mỗi bước: gọi model với bản sao, tăng {{steps}}, rồi luôn nối reply vào lịch sử dưới role {{assistant}} trước khi xét {{stopReason}}.',
        'Dùng {{switch}} theo {{stopReason}}: nhánh {{tool_use}} gom mọi {{tool_result}} vào một list rồi thêm đúng một message {{user}}; nhánh {{pause_turn}} không làm gì; nhánh mặc định thì return.',
        'Bọc {{tool.apply(...)}} trong {{try/catch (RuntimeException e)}} và trả {{Block.toolResult(id, "Error: " + e.getMessage(), true)}}.',
      ],
      explain: `Ba lỗi hay gặp nhất:
- **Quên nối message assistant** trước khi thêm {{tool_result}}. Với API thật, đây là lỗi 400 vì {{tool_result}} không có {{tool_use}} tương ứng ngay trước nó.
- **Gửi mỗi tool_result trong một message riêng** khi model gọi song song. API yêu cầu các kết quả nằm chung trong message user kế tiếp; tách ra làm hai message user liền nhau là sai cấu trúc, và còn "dạy" model ngừng gọi song song.
- **Để exception của tool bay ra ngoài**. Một tool lỗi tạm thời (DB timeout) không nên làm mất cả phiên agent. Trả {{is_error = true}} với thông điệp rõ ràng để model tự quyết: thử lại, đổi cách, hoặc báo người dùng.

Vì sao {{max_tokens}} không được coi như {{end_turn}}: câu trả lời đã bị cắt, có thể dở dang giữa câu hoặc giữa một JSON. Trả về {{stopReason}} riêng để tầng trên quyết định (tăng {{max_tokens}}, hoặc hiển thị "câu trả lời chưa đầy đủ").`,
    },
  ],
  check: [
    {
      q: 'Model trả về 2 block {{tool_use}} trong cùng một response (parallel tool use). Bạn gửi kết quả thế nào?',
      options: [
        'Hai request riêng, mỗi request chứa một {{tool_result}}',
        'Một message {{assistant}} chứa hai {{tool_result}}',
        'Một message {{user}} chứa hai block {{tool_result}}, mỗi block có {{tool_use_id}} khớp với {{id}} tương ứng',
        'Chỉ cần gửi kết quả của tool đầu tiên, model sẽ tự gọi lại tool thứ hai',
      ],
      answer: 2,
      explain: `Tất cả {{tool_result}} của một lượt nằm trong **một** message role {{user}} ngay sau message assistant, khớp theo {{tool_use_id}}. Gửi hai request riêng làm lịch sử sai cấu trúc và tốn gấp đôi; {{tool_result}} không bao giờ nằm trong message assistant (đó là phần do client cung cấp); bỏ sót một kết quả khiến API báo lỗi vì mỗi {{tool_use}} phải có {{tool_result}} tương ứng.`,
    },
    {
      q: 'Response có {{stop_reason}} là {{max_tokens}}. Điều đó có nghĩa gì?',
      options: [
        'Hội thoại đã vượt context window của model',
        'Output bị cắt vì chạm giới hạn {{max_tokens}} đặt trong request; câu trả lời chưa đầy đủ',
        'Model đã trả lời xong, giống {{end_turn}}',
        'Bạn đã vượt rate limit token mỗi phút',
      ],
      answer: 1,
      explain: `{{max_tokens}} là trần số token **output** bạn cho phép; chạm trần thì model dừng giữa chừng. Nó khác {{end_turn}} (dừng tự nhiên). Vượt context window với input thì request bị từ chối bằng lỗi 400 chứ không phải stop_reason này. Vượt rate limit thì nhận HTTP 429, không có response thành công nào.`,
    },
    {
      q: 'Một tool trong agent của bạn ném exception (ví dụ timeout khi gọi DB). Cách xử lý tốt nhất?',
      options: [
        'Ném exception lên controller và trả HTTP 500 cho người dùng',
        'Bỏ qua lời gọi đó, không gửi gì cho model',
        'Tự động gọi lại tool vô hạn cho tới khi thành công',
        'Gửi {{tool_result}} với {{is_error: true}} và mô tả lỗi để model tự quyết định bước tiếp theo',
      ],
      answer: 3,
      explain: `{{is_error}} cho model biết tool thất bại và vì sao; model có thể thử lại với input khác, dùng tool khác, hoặc giải thích cho người dùng. Trả 500 làm mất toàn bộ công việc của phiên. Không gửi kết quả thì request sau bị lỗi vì {{tool_use}} thiếu {{tool_result}}. Retry vô hạn có thể treo request và đốt chi phí.`,
    },
  ],
  related: ['claude-001', 'claude-002'],
  tags: ['tool use', 'agent loop', 'stop_reason', 'is_error'],
},
{
  id: 'lesson-claude-002',
  track: 'claude',
  order: 2,
  title: 'Retry đúng cách cho 429, 529 và 5xx: retry-after, exponential backoff và full jitter',
  level: 'mid',
  minutes: 30,
  goals: [
    'Phân loại được lỗi nào của Claude API nên retry (429, 529, 5xx) và lỗi nào tuyệt đối không (400, 401, 403)',
    'Tính được thời gian chờ theo exponential backoff + full jitter và hiểu vì sao cần jitter',
    'Tôn trọng header {{retry-after}}, giới hạn số lần thử và tổng thời gian chờ',
  ],
  body: `### Không phải lỗi nào cũng nên thử lại
Một lời gọi Claude API có thể thất bại vì nhiều lý do. Câu hỏi quan trọng nhất: **gửi lại y nguyên request đó có khả năng thành công không?** Nếu lỗi nằm ở chính request (sai format, sai API key) thì gửi lại 100 lần vẫn lỗi, chỉ tốn thời gian và làm chậm phát hiện bug. Nếu lỗi là **tạm thời** (server bận, bạn gửi quá nhanh) thì đợi một chút rồi thử lại thường thành công.

Khi lỗi, API trả về HTTP status kèm body JSON có {{type}} của lỗi:

~~~json
{
  "type": "error",
  "error": { "type": "overloaded_error", "message": "Overloaded" }
}
~~~

| HTTP | error.type | Ý nghĩa | Retry? |
|---|---|---|---|
| 400 | {{invalid_request_error}} | Request sai: thiếu field, sai cấu trúc message, prompt quá dài | **Không**, sửa code |
| 401 | {{authentication_error}} | API key sai / thiếu | **Không** |
| 403 | {{permission_error}} | Key không có quyền dùng tài nguyên này | **Không** |
| 404 | {{not_found_error}} | Sai endpoint hoặc tên model | **Không** |
| 413 | {{request_too_large}} | Request vượt kích thước tối đa | **Không**, cắt nhỏ |
| 429 | {{rate_limit_error}} | Bạn vượt rate limit (request/phút, token/phút) | **Có**, theo {{retry-after}} |
| 500 | {{api_error}} | Lỗi nội bộ bất ngờ phía Anthropic | **Có**, backoff |
| 529 | {{overloaded_error}} | API đang quá tải trên toàn hệ thống | **Có**, backoff |

Khác biệt cần nói được khi phỏng vấn: **429 là lỗi "của bạn"** (tài khoản bạn gửi quá hạn mức, giảm tốc độ là hết), còn **529 là lỗi "của hệ thống"** (server quá tải với mọi người, bạn gửi chậm lại cũng góp phần giúp hệ thống hồi phục). Các SDK chính thức của Anthropic mặc định đã tự retry một số lần cho lỗi kết nối, 408, 409, 429 và lỗi ≥ 500; nếu bạn tự viết HTTP client (ví dụ bằng {{RestClient}} của Spring) thì phải tự làm phần này.

### Tôn trọng header retry-after
Với 429, response có header {{retry-after}}: số **giây** cần đợi trước khi thử lại. Đây là thông tin chính xác nhất bạn có, vì server biết khi nào hạn mức của bạn được nạp lại. Ngoài ra còn các header {{anthropic-ratelimit-requests-remaining}}, {{anthropic-ratelimit-input-tokens-remaining}}… giúp bạn chủ động giảm tốc **trước khi** bị 429. Quy tắc: có {{retry-after}} thì dùng đúng giá trị đó, không có thì tự tính backoff.

### Exponential backoff: vì sao đợi tăng dần
Nếu retry ngay lập tức, bạn dội thêm tải vào một server đang quá tải, làm nó càng chậm hồi phục. Exponential backoff nhân đôi thời gian chờ sau mỗi lần thất bại và có một **trần (cap)**:

~~~text
ceiling(n) = min(cap, base * 2^n)      n = 0, 1, 2... (lần chờ thứ n+1)
base = 1000 ms, cap = 30000 ms  →  1000, 2000, 4000, 8000, 16000, 30000, 30000...
~~~

### Full jitter: vì sao cần ngẫu nhiên
Tưởng tượng 500 instance cùng bị 529 lúc 10:00:00. Nếu tất cả đợi đúng 1 giây, chúng lại cùng dội vào lúc 10:00:01, rồi cùng lúc 10:00:03… Đây là hiện tượng **thundering herd**: các đợt retry đồng bộ tạo ra những "cơn sóng" tải. **Full jitter** chọn thời gian chờ ngẫu nhiên đều trong khoảng [0, ceiling(n)), khiến các client tản ra theo thời gian. Phân tích kinh điển trên AWS Architecture Blog ("Exponential Backoff And Jitter") cho thấy full jitter giảm mạnh tổng số lời gọi so với backoff không jitter.

~~~java
long backoffMillis(int n) {
    long ceiling = Math.min(capMillis, baseMillis << n);  // base * 2^n, có trần
    return (long) (random.nextDouble() * ceiling);         // full jitter: đều trong [0, ceiling)
}
// Test: truyền Random có seed cố định (new Random(42)) → chuỗi thời gian chờ xác định, test được
~~~

### Ba giới hạn bắt buộc
1. **Số lần retry tối đa** (ví dụ 3–5). Sau đó trả lỗi rõ ràng cho tầng trên.
2. **Tổng thời gian chờ tối đa**. Request của người dùng thường có timeout 30–60 giây; nếu {{retry-after}} báo đợi 120 giây thì đừng đợi, hãy fail nhanh (hoặc đưa vào hàng đợi xử lý sau). Lần chờ nào làm tổng vượt ngân sách thì bỏ cuộc ngay, không ngủ vô ích.
3. **Không retry lỗi không thể tự hết**: 400, 401, 403, 404, 413.

### Pitfall trên production
- **Retry ở nhiều tầng**: SDK retry 2 lần, service của bạn retry 3 lần, API gateway lại retry 3 lần → một lỗi có thể thành 2 × 3 × 3 = 18 lời gọi. Chỉ retry ở **một** tầng.
- **Retry làm tốn tiền**: request Claude không có "idempotent miễn phí". Lỗi 529 trả về trước khi xử lý thì không tính token, nhưng nếu bạn timeout phía client trong khi server vẫn đang sinh output thì lần retry sẽ tính tiền lại từ đầu.
- **Streaming**: lỗi có thể đến **giữa** stream dưới dạng event {{error}} (ví dụ {{overloaded_error}}) sau khi đã nhận HTTP 200. Code chỉ xét status code sẽ bỏ sót; cần xử lý event lỗi và quyết định retry cả request.
- **Không có Sleeper giả thì không test được**: code gọi thẳng {{Thread.sleep}} sẽ làm test chạy hàng chục giây và phụ thuộc thời gian thực. Tách {{Sleeper}} và {{Random}} thành dependency để inject trong test.
- Ghi log header {{request-id}} của mỗi lỗi để gửi cho Anthropic support khi cần điều tra.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "429 và 529 khác nhau thế nào?", "vì sao cần jitter?", "retry-after và backoff ưu tiên cái nào?", "làm sao tránh retry storm khi cả cụm cùng lỗi?" (jitter, retry ở một tầng, circuit breaker, giới hạn concurrency phía client). Trả lời kèm công thức và một ví dụ số là ghi điểm. Bài tập dưới đây bắt bạn viết một {{RetryPolicy}} kiểm thử được hoàn toàn.`,
  exercises: [
    {
      title: 'Viết RetryPolicy với backoff + full jitter, test được nhờ Random có seed và Sleeper giả',
      prompt: `Hoàn thiện {{RetryPolicy}}:

- {{isRetryable(status)}}: true với 408, 429 và mọi status ≥ 500 (gồm 500 {{api_error}}, 529 {{overloaded_error}}); false với các status khác (400, 401, 403, 404…).
- {{backoffMillis(n)}} (n = 0 cho lần chờ đầu tiên): {{ceiling = min(capMillis, baseMillis * 2^n)}}, trả về {{(long) (random.nextDouble() * ceiling)}}. Gọi {{random.nextDouble()}} **đúng một lần** mỗi lần tính.
- {{execute(call)}}: gọi {{call.get()}}. Nếu ném {{ApiException}}:
  1. Không retryable, hoặc đã retry đủ {{maxRetries}} lần → ném lại chính exception đó.
  2. Thời gian chờ = {{retryAfterSeconds * 1000}} nếu exception có {{retryAfterSeconds}} (và **không** dùng random), ngược lại = {{backoffMillis(n)}} với n là số lần đã retry trước đó.
  3. Nếu tổng thời gian đã chờ cộng lần chờ này vượt {{maxTotalWaitMillis}} → ném lại exception, **không** sleep.
  4. Gọi {{sleeper.sleep(wait)}}, cộng dồn rồi thử lại.`,
      starter: `// ====== Có sẵn (không cần sửa) ======
interface Sleeper { void sleep(long millis); }   // production: Thread::sleep; test: ghi lại thời gian chờ

class ApiException extends RuntimeException {
    final int status;              // HTTP status: 429, 529, 500, 400...
    final Long retryAfterSeconds;  // giá trị header retry-after (null nếu không có)
    ApiException(int status, Long retryAfterSeconds) {
        super("HTTP " + status);
        this.status = status;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

// ====== Bài của bạn ======
class RetryPolicy {
    private final int maxRetries;
    private final long baseMillis, capMillis, maxTotalWaitMillis;
    private final Random random;
    private final Sleeper sleeper;

    RetryPolicy(int maxRetries, long baseMillis, long capMillis, long maxTotalWaitMillis, Random random, Sleeper sleeper) {
        this.maxRetries = maxRetries;
        this.baseMillis = baseMillis;
        this.capMillis = capMillis;
        this.maxTotalWaitMillis = maxTotalWaitMillis;
        this.random = random;
        this.sleeper = sleeper;
    }

    static boolean isRetryable(int status) {
        throw new UnsupportedOperationException("TODO");
    }

    long backoffMillis(int n) {
        throw new UnsupportedOperationException("TODO");
    }

    <T> T execute(Supplier<T> call) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static ApiException expectApi(Runnable r) {
        try { r.run(); } catch (ApiException e) { return e; }
        throw new AssertionError("phai nem ApiException");
    }
    // Lời gọi giả: ném lần lượt các lỗi định sẵn, hết lỗi thì trả "ok"
    static class Flaky implements Supplier<String> {
        final List<ApiException> failures; int calls = 0;
        Flaky(ApiException... f) { failures = List.of(f); }
        public String get() { calls++; if (calls <= failures.size()) throw failures.get(calls - 1); return "ok"; }
    }
    static class AlwaysFail implements Supplier<String> {
        final int status; int calls = 0;
        AlwaysFail(int status) { this.status = status; }
        public String get() { calls++; throw new ApiException(status, null); }
    }
    static ApiException err(int s) { return new ApiException(s, null); }
    static ApiException err(int s, long retryAfter) { return new ApiException(s, retryAfter); }

    public static void main(String[] args) {
        check("classifies retryable statuses", () -> {
            for (int s : new int[] {408, 429, 500, 502, 503, 529}) eq(true, RetryPolicy.isRetryable(s));
            for (int s : new int[] {400, 401, 403, 404, 413}) eq(false, RetryPolicy.isRetryable(s));
        });
        check("full jitter sequence matches the formula", () -> {
            List<Long> sleeps = new ArrayList<>();
            RetryPolicy p = new RetryPolicy(5, 1000, 30_000, 120_000, new Random(42), sleeps::add);
            Flaky f = new Flaky(err(500), err(529), err(503));
            eq("ok", p.execute(f)); eq(4, f.calls);
            Random mirror = new Random(42);
            List<Long> expected = new ArrayList<>();
            for (int n = 0; n < 3; n++) expected.add((long) (mirror.nextDouble() * Math.min(30_000L, 1000L << n)));
            eq(expected, sleeps);
        });
        check("backoff never exceeds the cap", () -> {
            RetryPolicy p = new RetryPolicy(10, 1000, 4000, 1_000_000, new Random(7), ms -> { });
            Random mirror = new Random(7);
            for (int n = 0; n < 10; n++) {
                long expected = (long) (mirror.nextDouble() * Math.min(4000L, 1000L << n));
                long got = p.backoffMillis(n);
                eq(expected, got);
                if (got < 0 || got >= 4000) throw new AssertionError("n=" + n + " got " + got + " ngoai [0, 4000)");
            }
        });
        check("retry-after header wins over backoff", () -> {
            List<Long> sleeps = new ArrayList<>();
            RetryPolicy p = new RetryPolicy(3, 1000, 30_000, 60_000, new Random(42), sleeps::add);
            Flaky f = new Flaky(err(429, 7));
            eq("ok", p.execute(f));
            eq(List.of(7000L), sleeps);
            eq((long) (new Random(42).nextDouble() * 1000), p.backoffMillis(0));   // random chua bi dung
        });
        check("gives up after maxRetries", () -> {
            List<Long> sleeps = new ArrayList<>();
            RetryPolicy p = new RetryPolicy(3, 100, 1000, 60_000, new Random(1), sleeps::add);
            AlwaysFail f = new AlwaysFail(529);
            ApiException e = expectApi(() -> p.execute(f));
            eq(529, e.status); eq(4, f.calls); eq(3, sleeps.size());
        });
        check("does not retry 400 and 401", () -> {
            for (int s : new int[] {400, 401}) {
                List<Long> sleeps = new ArrayList<>();
                RetryPolicy p = new RetryPolicy(5, 100, 1000, 60_000, new Random(1), sleeps::add);
                AlwaysFail f = new AlwaysFail(s);
                ApiException e = expectApi(() -> p.execute(f));
                eq(s, e.status); eq(1, f.calls); eq(0, sleeps.size());
            }
        });
        check("stops when total wait budget would be exceeded", () -> {
            List<Long> sleeps = new ArrayList<>();
            RetryPolicy p = new RetryPolicy(5, 1000, 30_000, 30_000, new Random(3), sleeps::add);
            Flaky f = new Flaky(err(429, 20), err(429, 20));
            ApiException e = expectApi(() -> p.execute(f));
            eq(429, e.status); eq(2, f.calls); eq(List.of(20_000L), sleeps);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `// ====== Có sẵn (không cần sửa) ======
interface Sleeper { void sleep(long millis); }   // production: Thread::sleep; test: ghi lại thời gian chờ

class ApiException extends RuntimeException {
    final int status;              // HTTP status: 429, 529, 500, 400...
    final Long retryAfterSeconds;  // giá trị header retry-after (null nếu không có)
    ApiException(int status, Long retryAfterSeconds) {
        super("HTTP " + status);
        this.status = status;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

// ====== Lời giải ======
class RetryPolicy {
    private final int maxRetries;
    private final long baseMillis, capMillis, maxTotalWaitMillis;
    private final Random random;
    private final Sleeper sleeper;

    RetryPolicy(int maxRetries, long baseMillis, long capMillis, long maxTotalWaitMillis, Random random, Sleeper sleeper) {
        this.maxRetries = maxRetries;
        this.baseMillis = baseMillis;
        this.capMillis = capMillis;
        this.maxTotalWaitMillis = maxTotalWaitMillis;
        this.random = random;
        this.sleeper = sleeper;
    }

    static boolean isRetryable(int status) {
        return status == 408 || status == 429 || status >= 500;   // 500 api_error, 529 overloaded_error...
    }

    long backoffMillis(int n) {
        long ceiling = Math.min(capMillis, baseMillis << Math.min(n, 30));  // base * 2^n, chặn để không tràn số
        return (long) (random.nextDouble() * ceiling);                       // full jitter: đều trong [0, ceiling)
    }

    <T> T execute(Supplier<T> call) {
        long waited = 0;
        for (int retry = 0; ; retry++) {
            try {
                return call.get();
            } catch (ApiException e) {
                if (!isRetryable(e.status) || retry >= maxRetries) throw e;      // lỗi của request, hoặc hết lượt
                long wait = e.retryAfterSeconds != null
                        ? e.retryAfterSeconds * 1000                               // server biết rõ nhất: tin retry-after
                        : backoffMillis(retry);
                if (waited + wait > maxTotalWaitMillis) throw e;                   // vượt ngân sách: fail nhanh
                sleeper.sleep(wait);
                waited += wait;
            }
        }
    }
}`,
      hints: [
        '{{isRetryable}} chỉ là một biểu thức boolean: 408, 429, hoặc ≥ 500.',
        'Trong {{execute}}, dùng vòng {{for (int retry = 0; ; retry++)}} với {{try/catch (ApiException e)}}; điều kiện bỏ cuộc kiểm tra trước khi tính thời gian chờ.',
        'Phép {{baseMillis << n}} chính là {{baseMillis * 2^n}}; chặn {{n}} (ví dụ tối đa 30) để không tràn {{long}} khi n lớn.',
      ],
      explain: `Thứ tự kiểm tra trong {{catch}} quan trọng: (1) lỗi không retryable hoặc hết lượt thì ném ngay; (2) tính thời gian chờ, ưu tiên {{retry-after}}; (3) kiểm tra ngân sách **trước khi** ngủ, vì ngủ 20 giây rồi mới phát hiện vượt ngân sách là lãng phí 20 giây của người dùng.

Vì sao inject {{Random}} và {{Sleeper}}: code gọi thẳng {{Thread.sleep}} và {{Math.random()}} không thể test xác định; test vừa chậm vừa "lúc pass lúc fail". Với {{new Random(42)}}, chuỗi số ngẫu nhiên luôn giống nhau, nên test tự tính được kết quả mong đợi bằng một {{Random(42)}} khác. Trong production, bạn truyền {{Thread::sleep}} (bọc InterruptedException) và một {{Random}} bình thường hoặc {{ThreadLocalRandom}}.

Lỗi hay gặp: dùng random cả khi có {{retry-after}} (làm lệch chuỗi jitter và chờ sai), quên trần {{cap}} khiến lần thứ 10 chờ 17 phút, và retry cả 400/401 làm che lấp bug cấu hình.`,
    },
  ],
  check: [
    {
      q: 'Hai lỗi 429 {{rate_limit_error}} và 529 {{overloaded_error}} khác nhau thế nào?',
      options: [
        '429 nghĩa là tài khoản/tổ chức của bạn vượt hạn mức; 529 nghĩa là API đang quá tải chung, không do riêng bạn',
        'Cả hai đều do request sai cấu trúc, không nên retry',
        '429 là lỗi phía server, 529 là lỗi API key',
        '529 chỉ xảy ra khi dùng streaming',
      ],
      answer: 0,
      explain: `429 gắn với hạn mức (request/phút, token/phút) của bạn và thường kèm {{retry-after}}; 529 là quá tải toàn hệ thống. Cả hai đều nên retry có backoff, nên phương án "không retry" sai. Lỗi API key là 401, không phải 529. 529 có thể xảy ra cả với request thường lẫn streaming (khi đó đến dưới dạng event {{error}}).`,
    },
    {
      q: 'Vì sao nên dùng full jitter thay vì chỉ exponential backoff cố định (1s, 2s, 4s…)?',
      options: [
        'Vì full jitter luôn chờ lâu hơn, giảm chi phí API',
        'Vì nhiều client cùng lỗi một lúc sẽ retry đồng loạt vào cùng thời điểm; ngẫu nhiên hoá làm chúng tản ra, tránh thundering herd',
        'Vì Claude API yêu cầu bắt buộc phải có jitter',
        'Vì jitter giúp bỏ qua được header {{retry-after}}',
      ],
      answer: 1,
      explain: `Với backoff cố định, mọi client lỗi cùng lúc sẽ retry cùng nhịp và tạo những đợt tải dồn dập. Full jitter chọn ngẫu nhiên trong [0, ceiling), trung bình còn chờ **ngắn hơn**, nên phương án "chờ lâu hơn" sai. API không bắt buộc jitter (đó là thực hành tốt). {{retry-after}} vẫn luôn được ưu tiên khi có.`,
    },
    {
      q: 'Request bị lỗi 400 {{invalid_request_error}}. Policy retry nên làm gì?',
      options: [
        'Retry với backoff tối đa 5 lần',
        'Retry ngay lập tức một lần',
        'Đợi theo {{retry-after}} rồi thử lại',
        'Không retry; ném lỗi ngay để phát hiện và sửa request',
      ],
      answer: 3,
      explain: `400 nghĩa là chính request sai (thiếu field, sai cấu trúc messages, quá dài…); gửi lại y nguyên luôn lỗi, nên mọi phương án retry chỉ tốn thời gian và che giấu bug. Lỗi 400 cũng không kèm {{retry-after}}, header đó gắn với rate limit (429).`,
    },
  ],
  related: ['claude-004', 'claude-005'],
  tags: ['retry', 'backoff', 'jitter', '429', '529'],
},
{
  id: 'lesson-claude-003',
  track: 'claude',
  order: 3,
  title: 'Ngân sách context và prompt caching: cắt lịch sử an toàn, đặt cache_control và đọc usage',
  level: 'senior',
  minutes: 35,
  goals: [
    'Giải thích context window, {{max_tokens}} và vì sao chi phí input tăng theo độ dài lịch sử hội thoại',
    'Cắt lịch sử hội thoại vừa ngân sách mà không tách cặp {{tool_use}}/{{tool_result}}',
    'Sắp xếp prompt để cache hiệu quả, đặt breakpoint {{cache_control}} và tính tiết kiệm từ các trường {{usage}}',
  ],
  body: `### Context window là gì
Mỗi model có một **context window**: số token tối đa model "nhìn thấy" trong một lần gọi, bao gồm **cả input** (system, tools, toàn bộ messages) **và output** sẽ sinh ra. Token là đơn vị model đọc chữ: không phải ký tự, không phải từ; với tiếng Anh trung bình khoảng 3–4 ký tự một token, tiếng Việt có dấu thường tốn nhiều token hơn cho cùng lượng nội dung. Muốn biết chính xác thì dùng endpoint đếm token {{POST /v1/messages/count_tokens}} thay vì đoán.

{{max_tokens}} là tham số **bắt buộc** trong request: trần số token **output**. Nó không làm model viết dài hơn; nó chỉ cắt khi model viết tới đó (khi ấy {{stop_reason}} là {{max_tokens}}). Input cộng {{max_tokens}} phải nằm trong context window của model.

### Vì sao hội thoại dài thì đắt
API stateless: lượt thứ 20 của một chatbot phải gửi lại cả 19 lượt trước. Giả sử mỗi lượt thêm 500 token và system prompt 3.000 token:

~~~text
Lượt 1 : 3.000 + 500    =  3.500 token input
Lượt 10: 3.000 + 5.000  =  8.000 token input
Lượt 40: 3.000 + 20.000 = 23.000 token input   ← mỗi câu hỏi ngắn cũng trả tiền cho 23K token
~~~

Tổng chi phí input của cả phiên tăng gần **bình phương** theo số lượt. Hai công cụ để kiểm soát: **cắt lịch sử** (giảm số token gửi đi) và **prompt caching** (giảm giá của phần token lặp lại).

### Cắt lịch sử: giữ gì, bỏ gì
Chiến lược phổ biến: luôn giữ **system prompt** và các lượt **mới nhất**, bỏ (hoặc tóm tắt thành một đoạn ngắn) các lượt cũ. Hai quy tắc làm đúng:
- **Không tách cặp tool_use/tool_result.** Nếu bạn giữ message chứa {{tool_result}} nhưng bỏ message assistant chứa {{tool_use}} tương ứng, API trả lỗi 400. Hãy coi cặp đó là **một đơn vị** không chia cắt: giữ cả hai hoặc bỏ cả hai.
- **Giữ một đoạn liên tục** tính từ cuối. Nhảy cóc (bỏ lượt giữa, giữ lượt cũ hơn vì "vừa chỗ") làm hội thoại rời rạc, model hiểu sai ngữ cảnh.

> Tóm tắt lượt cũ (gọi một model rẻ như Haiku để nén 30 lượt thành 300 token) giữ được ý chính, nhưng mỗi lần tóm tắt lại làm **thay đổi prefix** và phá cache. Thường nên tóm tắt theo đợt (ví dụ khi vượt 70% ngân sách) thay vì mỗi lượt.

### Prompt caching hoạt động thế nào
Prompt caching cho phép API lưu lại **prefix** (phần đầu) của prompt đã xử lý. Lần gọi sau có **cùng prefix chính xác từng byte** thì phần đó được đọc từ cache: nhanh hơn và rẻ hơn nhiều. Prefix được xét theo thứ tự cố định: **tools → system → messages**. Bạn đánh dấu điểm kết thúc của phần cần cache bằng {{cache_control}} trên một content block:

~~~json
{
  "model": "claude-sonnet-5-5",
  "max_tokens": 1024,
  "system": [
    { "type": "text", "text": "Bạn là trợ lý CSKH của ngân hàng X. Quy định: ..." },
    { "type": "text", "text": "<toàn bộ tài liệu sản phẩm, 20.000 token>",
      "cache_control": { "type": "ephemeral" } }
  ],
  "messages": [{ "role": "user", "content": "Phí chuyển khoản liên ngân hàng là bao nhiêu?" }]
}
~~~

Những điều cần nhớ:
- **Đặt phần tĩnh lên trước**, phần thay đổi ra sau. Chỉ một ký tự khác ở đầu (ví dụ chèn giờ hiện tại vào system prompt, hay đổi thứ tự tools) là toàn bộ cache phía sau vô hiệu.
- Tối đa **4 breakpoint** {{cache_control}} trong một request. Với chatbot, thường đặt một breakpoint sau system/tài liệu và một breakpoint ở message cuối để các lượt sau đọc lại cả lịch sử từ cache.
- Có **độ dài tối thiểu** để được cache (khoảng 1024 token trở lên, tuỳ model); prompt ngắn hơn sẽ không được cache dù có {{cache_control}}.
- TTL mặc định **5 phút**, được làm mới mỗi lần cache hit. Có tuỳ chọn TTL 1 giờ với giá ghi cao hơn.

### Đọc usage để biết cache có chạy không
Response trả về {{usage}} với bốn con số:

~~~json
"usage": {
  "input_tokens": 45,
  "cache_creation_input_tokens": 0,
  "cache_read_input_tokens": 20180,
  "output_tokens": 210
}
~~~

| Trường | Nghĩa | Giá (so với input thường, TTL 5 phút) |
|---|---|---|
| {{input_tokens}} | Token **sau** breakpoint cuối, không được cache | 1x |
| {{cache_creation_input_tokens}} | Token vừa được **ghi** vào cache | 1.25x |
| {{cache_read_input_tokens}} | Token **đọc** từ cache | 0.1x |
| {{output_tokens}} | Token model sinh ra | giá output |

Tổng input thực tế = cả ba trường input cộng lại. Lần gọi đầu thường là "ghi" (đắt hơn 25%), các lần sau trong TTL là "đọc" (rẻ 90%). Vì vậy cache chỉ có lời khi prefix được **dùng lại ít nhất vài lần** trong TTL. Nếu dashboard cho thấy {{cache_read_input_tokens}} luôn bằng 0: kiểm tra prefix có thay đổi mỗi request không, có đủ độ dài tối thiểu không, và khoảng cách giữa các request có vượt TTL không.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Chatbot càng chat càng đắt, bạn xử lý thế nào?" (cắt hoặc tóm tắt lịch sử, caching, chọn model rẻ cho tóm tắt), "Đặt cache_control ở đâu?" (cuối phần tĩnh; tools → system → messages), "Làm sao biết cache hoạt động?" (đọc {{cache_read_input_tokens}}), và "Cắt lịch sử có bẫy gì?" (tách cặp {{tool_use}}/{{tool_result}} gây lỗi 400). Bài tập dưới đây bắt bạn tự viết hàm cắt lịch sử và hàm tính tiết kiệm từ usage.`,
  exercises: [
    {
      title: 'ContextBudget: cắt lịch sử vừa ngân sách và tính tiết kiệm nhờ cache',
      prompt: `{{Msg(role, kind, text, toolUseId)}}: {{role}} là {{system}}/{{user}}/{{assistant}}; {{kind}} là {{text}}/{{tool_use}}/{{tool_result}}. Để đơn giản, phần tử đầu tiên của lịch sử luôn là system prompt (trong API thật đây là tham số {{system}} riêng). Số token của một message là {{t.count(msg.text())}}.

**1. {{fit(history, budget, t)}}** trả về list mới (không sửa {{history}}):
- Luôn giữ {{history.get(0)}} (system). Nếu riêng nó đã vượt {{budget}} → ném {{IllegalArgumentException}}.
- Đi từ message **cuối** về đầu theo **đơn vị**: một {{tool_result}} cùng message {{tool_use}} ngay trước nó (cùng {{toolUseId}}) là **một** đơn vị; mọi message khác là đơn vị một phần tử.
- Thêm đơn vị nếu tổng token (system + đã giữ + đơn vị) ≤ {{budget}}; gặp đơn vị đầu tiên không vừa thì **dừng hẳn** (không nhảy cóc sang đơn vị cũ hơn).
- Kết quả: system rồi các message được giữ theo đúng thứ tự gốc.

**2. {{effectiveInputTokens(u)}}** = {{inputTokens + 1.25 × cacheCreationInputTokens + 0.1 × cacheReadInputTokens}} (quy về "token input giá gốc").

**3. {{cacheSavings(turns)}}** = tổng qua các lượt của (input + creation + read) trừ {{effectiveInputTokens}}. Có thể âm nếu chỉ ghi mà không đọc lại.`,
      starter: `// ====== Có sẵn (không cần sửa) ======
record Msg(String role, String kind, String text, String toolUseId) {}  // kind: text | tool_use | tool_result
interface Tokenizer { int count(String text); }
record Usage(int inputTokens, int cacheCreationInputTokens, int cacheReadInputTokens, int outputTokens) {}

// ====== Bài của bạn ======
class ContextBudget {
    static List<Msg> fit(List<Msg> history, int budget, Tokenizer t) {
        throw new UnsupportedOperationException("TODO");
    }

    static double effectiveInputTokens(Usage u) {
        throw new UnsupportedOperationException("TODO");
    }

    static double cacheSavings(List<Usage> turns) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static void near(double expected, double actual) {
        if (Math.abs(expected - actual) > 1e-6) throw new AssertionError("expected " + expected + " got " + actual);
    }
    // Tokenizer giả: số token nằm sau dấu ':' trong text, ví dụ "u1:50" = 50 token
    static final Tokenizer T = s -> Integer.parseInt(s.substring(s.indexOf(':') + 1));
    static final Msg SYS = new Msg("system", "text", "sys:100", null);
    static final Msg U1 = new Msg("user", "text", "u1:50", null);
    static final Msg A1 = new Msg("assistant", "text", "a1:50", null);
    static final Msg U2 = new Msg("user", "text", "u2:40", null);
    static final Msg TU = new Msg("assistant", "tool_use", "tu:30", "toolu_A");
    static final Msg TR = new Msg("user", "tool_result", "tr:200", "toolu_A");
    static final Msg A2 = new Msg("assistant", "text", "a2:60", null);
    static final Msg U3 = new Msg("user", "text", "u3:20", null);
    static final List<Msg> H = List.of(SYS, U1, A1, U2, TU, TR, A2, U3);   // tổng 550 token

    public static void main(String[] args) {
        check("keeps everything when it fits", () -> eq(H, ContextBudget.fit(H, 550, T)));
        check("keeps system and the newest turns", () -> {
            eq(List.of(SYS, A2, U3), ContextBudget.fit(H, 180, T));
            eq(List.of(SYS, U3), ContextBudget.fit(H, 170, T));
        });
        check("never splits a tool_use/tool_result pair", () -> {
            List<Msg> r = ContextBudget.fit(H, 380, T);   // tr (200) vừa cho nhưng tu + tr (230) thì không
            eq(List.of(SYS, A2, U3), r);
            eq(List.of(SYS, TU, TR, A2, U3), ContextBudget.fit(H, 410, T));
        });
        check("stops at the first unit that does not fit (no skipping)", () -> {
            eq(List.of(SYS, A2, U3), ContextBudget.fit(H, 405, T));   // u2 (40) vừa nhưng không được nhảy cóc
            eq(List.of(SYS, U2, TU, TR, A2, U3), ContextBudget.fit(H, 460, T));
        });
        check("system larger than budget throws", () -> {
            try { ContextBudget.fit(H, 50, T); } catch (IllegalArgumentException e) { return; }
            throw new AssertionError("phai nem IllegalArgumentException");
        });
        check("does not modify the input list", () -> {
            List<Msg> copy = new ArrayList<>(H);
            ContextBudget.fit(copy, 200, T);
            eq(H, copy);
        });
        check("effective input tokens use 1.25x write and 0.1x read", () -> {
            near(12_550, ContextBudget.effectiveInputTokens(new Usage(50, 10_000, 0, 300)));
            near(1_080, ContextBudget.effectiveInputTokens(new Usage(80, 0, 10_000, 200)));
        });
        check("cache savings across turns (first write costs extra)", () -> {
            near(-2_500, ContextBudget.cacheSavings(List.of(new Usage(50, 10_000, 0, 300))));
            near(15_500, ContextBudget.cacheSavings(List.of(
                new Usage(50, 10_000, 0, 300), new Usage(80, 0, 10_000, 200), new Usage(120, 0, 10_000, 250))));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `// ====== Có sẵn (không cần sửa) ======
record Msg(String role, String kind, String text, String toolUseId) {}  // kind: text | tool_use | tool_result
interface Tokenizer { int count(String text); }
record Usage(int inputTokens, int cacheCreationInputTokens, int cacheReadInputTokens, int outputTokens) {}

// ====== Lời giải ======
class ContextBudget {
    static List<Msg> fit(List<Msg> history, int budget, Tokenizer t) {
        Msg system = history.get(0);
        int used = t.count(system.text());
        if (used > budget) throw new IllegalArgumentException("system prompt vượt ngân sách: " + used + " > " + budget);
        Deque<Msg> kept = new ArrayDeque<>();
        int i = history.size() - 1;
        while (i >= 1) {
            int start = i;
            Msg m = history.get(i);
            // tool_result + tool_use ngay trước nó = một đơn vị: giữ cả cặp hoặc bỏ cả cặp
            if ("tool_result".equals(m.kind()) && i - 1 >= 1
                    && "tool_use".equals(history.get(i - 1).kind())
                    && Objects.equals(m.toolUseId(), history.get(i - 1).toolUseId())) start = i - 1;
            int cost = 0;
            for (int k = start; k <= i; k++) cost += t.count(history.get(k).text());
            if (used + cost > budget) break;              // không vừa: dừng hẳn, không nhảy cóc
            for (int k = i; k >= start; k--) kept.addFirst(history.get(k));
            used += cost;
            i = start - 1;
        }
        List<Msg> out = new ArrayList<>();
        out.add(system);
        out.addAll(kept);                                 // Deque giữ đúng thứ tự gốc
        return out;
    }

    static double effectiveInputTokens(Usage u) {
        return u.inputTokens() + 1.25 * u.cacheCreationInputTokens() + 0.1 * u.cacheReadInputTokens();
    }

    static double cacheSavings(List<Usage> turns) {
        double saved = 0;
        for (Usage u : turns) {
            int raw = u.inputTokens() + u.cacheCreationInputTokens() + u.cacheReadInputTokens();  // giá nếu không cache
            saved += raw - effectiveInputTokens(u);
        }
        return saved;
    }
}`,
      hints: [
        'Duyệt chỉ số {{i}} từ cuối về 1. Nếu {{history.get(i)}} là {{tool_result}} và {{history.get(i - 1)}} là {{tool_use}} cùng {{toolUseId}} thì đơn vị là [i - 1, i], ngược lại là [i, i].',
        'Dùng {{ArrayDeque}} với {{addFirst}} để vừa đi ngược vừa giữ đúng thứ tự gốc; thêm phần tử cuối của đơn vị trước.',
        'Tiết kiệm của một lượt = (input + creation + read) − (input + 1.25 × creation + 0.1 × read) = 0.9 × read − 0.25 × creation.',
      ],
      explain: `Ý chính của {{fit}}: làm việc theo **đơn vị** chứ không theo từng message. Nếu xét từng message, ở ngân sách 380 bạn sẽ giữ được {{tool_result}} (200 token) nhưng không còn chỗ cho {{tool_use}} (30 token) đứng trước nó: API thật sẽ trả 400 vì {{tool_result}} không có {{tool_use}} tương ứng. Dừng ở đơn vị đầu tiên không vừa (thay vì "tìm cái nhỏ hơn mà nhét") giữ cho hội thoại liên tục.

Trong thực tế, lịch sử bị bỏ thường được thay bằng một message tóm tắt, và bạn nên đếm token bằng endpoint {{count_tokens}} hoặc số {{usage}} của lượt trước thay vì ước lượng theo ký tự.

{{cacheSavings}} cho thấy vì sao lượt đầu "lỗ": ghi 10.000 token vào cache tốn 12.500 token giá gốc (lỗ 2.500), nhưng mỗi lượt đọc lại chỉ tốn 1.000 (lời 9.000). Chỉ cần prefix được đọc lại một lần trong TTL là đã có lời. Lỗi hay gặp: quên rằng {{input_tokens}} chỉ là phần **sau** breakpoint, nên cộng thiếu hai trường cache khi tính tổng input.`,
    },
  ],
  check: [
    {
      q: 'Bạn đặt {{cache_control}} sau một system prompt 20K token, nhưng {{cache_read_input_tokens}} luôn bằng 0. Nguyên nhân nào hợp lý nhất?',
      options: [
        'System prompt có chèn thời gian hiện tại ở đầu, nên prefix khác nhau ở mỗi request',
        'Prompt caching chỉ hoạt động khi dùng streaming',
        '{{max_tokens}} đặt quá nhỏ',
        'Cache chỉ có hiệu lực với message role {{assistant}}',
      ],
      answer: 0,
      explain: `Cache khớp theo prefix chính xác; một timestamp đổi mỗi request ở đầu prompt làm mọi lần đều là "ghi mới". Caching hoạt động cả với request thường lẫn streaming. {{max_tokens}} chỉ giới hạn output, không liên quan cache. Breakpoint có thể đặt ở tools, system hoặc message bất kỳ role nào.`,
    },
    {
      q: 'Response có usage: {{input_tokens}} = 50, {{cache_creation_input_tokens}} = 0, {{cache_read_input_tokens}} = 20.000. Tổng token input mà model xử lý là bao nhiêu?',
      options: [
        '50, vì chỉ {{input_tokens}} mới là input',
        '20.000',
        '20.050, vì phải cộng cả phần đọc từ cache',
        '2.050, vì cache đã giảm 90% số token',
      ],
      answer: 2,
      explain: `{{input_tokens}} chỉ là phần **sau** breakpoint cuối; tổng input = input + creation + read = 20.050 token. Cache giảm **giá** của 20.000 token đó (khoảng 0.1x), chứ không giảm số token model đọc, nên 2.050 là nhầm giữa token và chi phí. 50 hay 20.000 đều bỏ sót một phần.`,
    },
    {
      q: 'Khi cắt lịch sử hội thoại của một agent cho vừa ngân sách, quy tắc nào là bắt buộc để request không bị lỗi?',
      options: [
        'Luôn bỏ system prompt trước tiên vì nó dài nhất',
        'Chỉ giữ các message role {{user}}',
        'Bỏ message cũ nhất từng cái một, không cần quan tâm loại message',
        'Không được giữ một {{tool_result}} mà bỏ {{tool_use}} tương ứng ngay trước nó: giữ hoặc bỏ cả cặp',
      ],
      answer: 3,
      explain: `Mỗi {{tool_result}} phải tham chiếu tới một {{tool_use}} trong message assistant ngay trước; mất {{tool_use}} thì API trả 400. Bỏ system prompt làm model mất vai trò và quy tắc. Chỉ giữ message user làm hội thoại sai cấu trúc. Bỏ từng message không xét loại có thể tách đúng cặp nói trên.`,
    },
  ],
  related: ['claude-006', 'claude-007'],
  tags: ['context window', 'prompt caching', 'cache_control', 'usage', 'token'],
},
{
  id: 'lesson-claude-004',
  track: 'claude',
  order: 4,
  title: 'Agent loop có kiểm soát: ghép tool_result, xử lý lỗi và dừng đúng',
  level: 'senior',
  minutes: 40,
  goals: [
    'Mô phỏng được agent loop bằng Java thuần và phân biệt một model step với nhiều tool call trong cùng response',
    'Ghép từng {{tool_result}} với đúng {{tool_use_id}}, gom kết quả vào một message và giữ nguyên thứ tự',
    'Dừng an toàn theo {{stop_reason}} và {{maxSteps}}, kể cả khi tool cuối có thể gây side effect',
  ],
  body: `### Một agent không tự chạy tool
Một **agent** ở đây là chương trình ghép model ngôn ngữ với các hàm backend để hoàn thành việc nhiều bước. Model chỉ chọn hành động và tạo dữ liệu đầu vào; nó không thể tự truy cập database, gọi Java method hay gửi tiền. Backend của bạn mới là nơi thực thi tool. Ví dụ, model có thể đề nghị {{orders_get_status}} với {{order_id = "ORD-42"}}, nhưng code phải kiểm tra rồi mới gọi service đơn hàng.

### Tách rõ một vòng model và một tool call
**Model step** là một lần gửi toàn bộ hội thoại lên API và nhận một response. Một response có thể chứa nhiều block {{tool_use}}; vì thế một model step có thể yêu cầu nhiều tool. Đếm mỗi tool thành một step sẽ làm lệch ngân sách: 3 tool song song vẫn là một lần gọi model, nhưng có thể là 3 lần gọi dịch vụ thật, nên cần quota riêng cho cả model lẫn tool.

Luồng trạng thái cơ bản:

~~~text
user → model → assistant(tool_use A, tool_use B)
                    ↓ backend chạy A và B
user(tool_result A, tool_result B) → model → assistant(end_turn)
~~~

API Messages không lưu lịch sử giữa request. Mỗi lần gọi model, ứng dụng gửi lại transcript (toàn bộ các message trước đó). Vì vậy sau response có tool call, phải nối **toàn bộ message assistant nguyên trạng** trước; sau đó tạo đúng một message role {{user}} chứa các kết quả. Mỗi kết quả dùng {{tool_use_id}} khớp với {{id}} của lời gọi. Đây là quan hệ giống mã vận đơn và kiện hàng: nội dung có thể giống nhau, nhưng nhầm mã thì không biết kết quả thuộc yêu cầu nào.

### Gom kết quả và xử lý thất bại
Khi model gọi hai tool, chạy chúng theo thứ tự block và gửi cả hai kết quả trong cùng message kế tiếp. Mỗi {{tool_use}} phải có đúng một {{tool_result}}, kể cả tool không tồn tại hoặc ném lỗi. Trường {{is_error = true}} báo rằng nội dung là lỗi để model có thể giải thích hoặc chọn hành động khác; nó **không** tự retry và không thay thế log/alert của backend.

Không bắt mọi exception rồi trả kết quả thành công giả. Chỉ bắt lỗi dự kiến ở ranh giới thực thi tool, ghi log có correlation ID và trả mô tả an toàn (không lộ SQL, token hay stack trace). Tool có ghi dữ liệu phải có kiểm tra quyền, giới hạn thời gian và tính idempotent: cùng một yêu cầu nghiệp vụ gửi lại không được tạo giao dịch thứ hai. {{tool_use_id}} chỉ nhận diện một lần gọi của model, không tự là idempotency key nghiệp vụ.

### Dừng theo trạng thái, không đoán theo nội dung
{{stop_reason}} là tín hiệu giao thức:
- {{end_turn}}: câu trả lời hoàn tất, trả về người dùng.
- {{tool_use}}: thực thi các tool hợp lệ rồi gọi model tiếp.
- {{pause_turn}}: model tạm ngưng; tiếp tục bằng lịch sử có message assistant đó, không tự bịa {{tool_result}}.
- {{max_tokens}}: output đã chạm giới hạn và có thể bị cắt; không báo thành công như câu trả lời hoàn chỉnh.
- {{refusal}} hoặc trạng thái kết thúc khác: dừng và xử lý theo chính sách ứng dụng.

Đặt {{maxSteps}} là số lần gọi model tối đa để tránh vòng lặp vô hạn và chi phí tăng theo từng request. Cần để ý thời điểm hết ngân sách: nếu response cuối yêu cầu gọi tool nhưng không còn lượt model để đọc kết quả, chạy tool ghi dữ liệu rồi bỏ kết quả là side effect vô ích. Quyết định trong bài tập là dừng trước khi thực thi tool ở step cuối. Với tác vụ cần hoàn tất, tầng điều phối có thể dành riêng một lượt tổng kết hoặc yêu cầu xác nhận của người dùng.

~~~java
// Một response có thể có nhiều tool_use nhưng vẫn chỉ tốn một model step.
for (int step = 1; step <= maxSteps; step++) {
    Reply r = model.next(new ArrayList<>(history)); // API stateless: gửi snapshot transcript
    history.add(new Message("assistant", r.blocks())); // giữ nguyên mọi block
    if ("end_turn".equals(r.stopReason())) return answer(r);
    if ("tool_use".equals(r.stopReason()) && step < maxSteps) {
        List<Block> results = executeEveryCall(r.blocks(), tools); // cùng thứ tự, đúng id
        history.add(new Message("user", results)); // một message cho cả lượt tool
    }
}
return stopped("max_steps"); // không thực thi side effect mà không còn lượt tiếp
~~~

### Ví dụ đời thực
Một trợ lý CSKH tra trạng thái đơn và tồn kho ở hai service. Trong test tải, 6% hội thoại bị HTTP 400 sau khi model gọi cả hai tool: backend gửi hai message user liên tiếp, mỗi message chứa một kết quả, trong khi API yêu cầu một message gom cả hai. Log ứng dụng cũng chỉ ghi tên tool nên không lần ra kết quả nào thiếu ID. Nhóm sửa adapter để bảo toàn message assistant, gom hai block kết quả theo thứ tự và ghi {{tool_use_id}} vào log có che dữ liệu nhạy cảm. Họ thêm test kịch bản gọi song song, tool timeout và chạm max step; sau deploy tỷ lệ lỗi giao thức về 0 trong 20.000 lượt kiểm thử, còn thời gian xử lý p95 giữ ở 420 ms. Bài học là kiểm tra giao thức bằng transcript giả lập trước khi gọi API thật, vừa rẻ vừa tái lập được.

### Trả lời mẫu khi phỏng vấn
“Tôi coi agent loop là state machine ở backend, không phải model tự chạy công cụ. Mỗi lượt gửi toàn bộ transcript vì Messages API stateless. Tôi đọc stop_reason trước: end_turn thì trả lời; tool_use thì lưu nguyên message assistant, chạy từng tool sau khi kiểm tra schema và quyền, rồi đưa đủ tool_result vào một message user, đúng thứ tự và khớp tool_use_id. Lỗi dự kiến của tool cũng tạo tool_result có is_error để model xử lý, nhưng backend vẫn log correlation ID và không để lộ thông tin nhạy cảm. Tôi giới hạn số model step, thời gian và số tool call riêng; nếu hết ngân sách trước lượt kế tiếp thì không thực thi side effect mồ côi. Với thao tác ghi, tôi dùng idempotency key theo nghiệp vụ và xác nhận người dùng khi cần. Tôi kiểm thử bằng model giả định sẵn nhiều response, vì như vậy kiểm tra được cả protocol, lỗi và điều kiện dừng mà không tốn token.”

### Liên hệ phỏng vấn
Hãy phân biệt {{tool_use_id}} (ghép kết quả với một block gọi) với idempotency key (ngăn một hành động nghiệp vụ chạy lặp). Nếu được hỏi vì sao không chạy tool cuối khi chạm {{maxSteps}}, hãy nói rõ rủi ro side effect không có lượt tiếp theo để xác nhận kết quả.`,
  exercises: [
    {
      title: 'AgentLoop: ghép tool_result và dừng trước side effect cuối',
      prompt: `Các kiểu trong phần "Có sẵn" mô phỏng response của model. Hoàn thiện {{AgentLoop.run(prompt, model, tools, maxSteps)}}:

1. Tạo hội thoại ban đầu gồm một message {{user}} có block text {{prompt}}. Mỗi lần gọi {{model.next}} truyền một bản sao danh sách, tăng {{steps}}, rồi thêm nguyên response thành message {{assistant}}.
2. Với {{stopReason = "tool_use"}}, lấy mọi block {{tool_use}} theo thứ tự. Mỗi tool tồn tại thì gọi bằng input; nếu thiếu tool hoặc tool ném {{RuntimeException}}, tạo {{tool_result}} có {{isError = true}} và mô tả lỗi. Gom toàn bộ kết quả vào **một** message {{user}} theo thứ tự gốc.
3. Với {{pause_turn}}, gọi model tiếp mà không thêm message user. Mọi stop reason khác trả {{AgentResult(text, steps, stopReason)}}; {{text}} là nối các block text ở response cuối.
4. Nếu {{tool_use}} xuất hiện ở lần gọi model cuối cùng, **không chạy tool**, vì không còn lượt để model đọc kết quả. Trả {{stopReason = "max_steps"}} và text cuối. {{maxSteps}} ≤ 0 phải ném {{IllegalArgumentException}}.

Không cần gọi mạng hay dùng SDK; model và tool đều được test giả lập.`,
      starter: `// ====== Có sẵn (không cần sửa) ======
record Block(String type, String text, String id, String name, Map<String, Object> input,
             String toolUseId, String content, boolean isError) {
    static Block text(String text) { return new Block("text", text, null, null, null, null, null, false); }
    static Block toolUse(String id, String name, Map<String, Object> input) {
        return new Block("tool_use", null, id, name, input, null, null, false);
    }
    static Block toolResult(String id, String content, boolean isError) {
        return new Block("tool_result", null, null, null, null, id, content, isError);
    }
}
record Message(String role, List<Block> blocks) {}
record Reply(String stopReason, List<Block> blocks) {}
interface Model { Reply next(List<Message> history); }
record AgentResult(String text, int steps, String stopReason) {}

// ====== Bài của bạn ======
class AgentLoop {
    static AgentResult run(String prompt, Model model,
            Map<String, Function<Map<String, Object>, String>> tools, int maxSteps) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static Block call(String id, String name) {
        return Block.toolUse(id, name, Map.of("order_id", "ORD-7"));
    }
    static Reply reply(String stop, Block... blocks) { return new Reply(stop, List.of(blocks)); }
    static class ScriptModel implements Model {
        final List<Reply> script;
        final List<List<Message>> seen = new ArrayList<>();
        ScriptModel(Reply... script) { this.script = List.of(script); }
        public Reply next(List<Message> history) {
            seen.add(new ArrayList<>(history));
            return script.get(Math.min(seen.size() - 1, script.size() - 1));
        }
    }
    static Map<String, Function<Map<String, Object>, String>> tool(String name, Function<Map<String, Object>, String> f) {
        Map<String, Function<Map<String, Object>, String>> m = new HashMap<>();
        m.put(name, f);
        return m;
    }
    public static void main(String[] args) {
        check("keeps assistant call and sends matching tool result", () -> {
            ScriptModel m = new ScriptModel(
                reply("tool_use", Block.text("Checking"), call("u1", "status")),
                reply("end_turn", Block.text("Shipped")));
            AgentResult r = AgentLoop.run("Where is it?", m, tool("status", in -> "SHIPPED"), 3);
            eq("Shipped", r.text()); eq(2, r.steps()); eq("end_turn", r.stopReason());
            List<Message> h = m.seen.get(1);
            eq("assistant", h.get(1).role()); eq("tool_use", h.get(1).blocks().get(1).type());
            Block result = h.get(2).blocks().get(0);
            eq("user", h.get(2).role()); eq("tool_result", result.type());
            eq("u1", result.toolUseId()); eq("SHIPPED", result.content()); eq(false, result.isError());
        });
        check("groups parallel calls into one user message in call order", () -> {
            ScriptModel m = new ScriptModel(
                reply("tool_use", call("u1", "first"), call("u2", "second")),
                reply("end_turn", Block.text("done")));
            Map<String, Function<Map<String, Object>, String>> tools = tool("first", in -> "one");
            tools.put("second", in -> "two");
            AgentLoop.run("Check", m, tools, 3);
            List<Message> h = m.seen.get(1);
            eq(3, h.size()); eq("user", h.get(2).role());
            eq(2, h.get(2).blocks().size());
            eq("u1", h.get(2).blocks().get(0).toolUseId());
            eq("u2", h.get(2).blocks().get(1).toolUseId());
        });
        check("unknown tool and runtime failure become error results", () -> {
            ScriptModel m = new ScriptModel(
                reply("tool_use", call("u1", "missing"), call("u2", "broken")),
                reply("end_turn", Block.text("Handled")));
            AgentLoop.run("Do work", m, tool("broken", in -> { throw new IllegalStateException("service offline"); }), 3);
            List<Block> results = m.seen.get(1).get(2).blocks();
            eq(true, results.get(0).isError()); eq(true, results.get(0).content().contains("Unknown tool"));
            eq(true, results.get(1).isError()); eq(true, results.get(1).content().contains("service offline"));
        });
        check("pause_turn continues, while max_tokens is returned as incomplete", () -> {
            ScriptModel paused = new ScriptModel(reply("pause_turn", Block.text("continue")),
                reply("end_turn", Block.text("finished")));
            AgentResult p = AgentLoop.run("Search", paused, new HashMap<>(), 3);
            eq(2, p.steps()); eq("finished", p.text()); eq(2, paused.seen.get(1).size());
            AgentResult cut = AgentLoop.run("Write", new ScriptModel(reply("max_tokens", Block.text("partial"))),
                new HashMap<>(), 3);
            eq("max_tokens", cut.stopReason()); eq("partial", cut.text());
        });
        check("does not execute a tool when no model step remains", () -> {
            int[] calls = {0};
            ScriptModel m = new ScriptModel(reply("tool_use", call("u1", "charge")));
            AgentResult r = AgentLoop.run("Charge", m, tool("charge", in -> { calls[0]++; return "ok"; }), 1);
            eq(0, calls[0]); eq(1, r.steps()); eq("max_steps", r.stopReason());
        });
        check("max step cap and invalid cap are explicit", () -> {
            ScriptModel m = new ScriptModel(reply("pause_turn", Block.text("wait")));
            AgentResult r = AgentLoop.run("Wait", m, new HashMap<>(), 2);
            eq("max_steps", r.stopReason()); eq(2, r.steps());
            try { AgentLoop.run("x", m, new HashMap<>(), 0); }
            catch (IllegalArgumentException expected) { return; }
            throw new AssertionError("maxSteps <= 0 must be rejected");
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `// ====== Có sẵn (không cần sửa) ======
record Block(String type, String text, String id, String name, Map<String, Object> input,
             String toolUseId, String content, boolean isError) {
    static Block text(String text) { return new Block("text", text, null, null, null, null, null, false); }
    static Block toolUse(String id, String name, Map<String, Object> input) {
        return new Block("tool_use", null, id, name, input, null, null, false);
    }
    static Block toolResult(String id, String content, boolean isError) {
        return new Block("tool_result", null, null, null, null, id, content, isError);
    }
}
record Message(String role, List<Block> blocks) {}
record Reply(String stopReason, List<Block> blocks) {}
interface Model { Reply next(List<Message> history); }
record AgentResult(String text, int steps, String stopReason) {}

// ====== Lời giải ======
class AgentLoop {
    static AgentResult run(String prompt, Model model,
            Map<String, Function<Map<String, Object>, String>> tools, int maxSteps) {
        if (maxSteps <= 0) throw new IllegalArgumentException("maxSteps must be positive");
        List<Message> history = new ArrayList<>();
        history.add(new Message("user", List.of(Block.text(prompt))));
        int steps = 0;
        String lastText = "";
        while (steps < maxSteps) {
            Reply reply = model.next(new ArrayList<>(history));
            steps++;
            history.add(new Message("assistant", reply.blocks()));
            lastText = textOf(reply.blocks());
            if ("tool_use".equals(reply.stopReason())) {
                List<Block> calls = new ArrayList<>();
                for (Block b : reply.blocks()) if ("tool_use".equals(b.type())) calls.add(b);
                if (calls.isEmpty()) return new AgentResult(lastText, steps, "protocol_error");
                if (steps == maxSteps) return new AgentResult(lastText, steps, "max_steps");
                List<Block> results = new ArrayList<>();
                for (Block call : calls) results.add(execute(call, tools));
                history.add(new Message("user", results)); // một message chứa đủ kết quả
            } else if (!"pause_turn".equals(reply.stopReason())) {
                return new AgentResult(lastText, steps, reply.stopReason());
            }
        }
        return new AgentResult(lastText, steps, "max_steps");
    }

    private static Block execute(Block call, Map<String, Function<Map<String, Object>, String>> tools) {
        Function<Map<String, Object>, String> tool = tools.get(call.name());
        if (tool == null) return Block.toolResult(call.id(), "Unknown tool: " + call.name(), true);
        try {
            return Block.toolResult(call.id(), tool.apply(call.input()), false);
        } catch (RuntimeException e) {
            return Block.toolResult(call.id(), "Tool failed: " + e.getMessage(), true);
        }
    }

    private static String textOf(List<Block> blocks) {
        StringBuilder text = new StringBuilder();
        for (Block b : blocks) if ("text".equals(b.type())) text.append(b.text());
        return text.toString();
    }
}`,
      hints: [
        'Giữ một {{List<Message>}} làm transcript. Mỗi vòng gọi model bằng bản sao, rồi thêm {{reply.blocks()}} vào role {{assistant}} trước khi xét stop reason.',
        'Tạo một list kết quả, duyệt tool call theo thứ tự, bắt {{RuntimeException}} quanh từng tool riêng; chỉ sau đó thêm đúng một message role {{user}}.',
        'Kiểm tra {{steps == maxSteps}} trước khi gọi tool: lượt model tiếp theo không còn nên tránh chạy side effect không ai nhận kết quả.',
      ],
      explain: `{{steps}} đếm số lần gọi model, không phải số tool. Trong lượt có hai lời gọi, code tạo hai kết quả nhưng chỉ tăng step một lần. Test thứ hai kiểm tra đây là cùng một message user và giữ nguyên thứ tự; nếu gửi hai message, API không còn nhận được gói kết quả theo đúng lượt assistant.

Lời giải lưu response assistant đầy đủ trước khi gửi kết quả. Nếu chỉ lưu phần text, request sau thiếu block {{tool_use}} mà các kết quả đang tham chiếu. {{tool_use_id}} được chép vào {{tool_use_id}} của kết quả để đối chiếu, còn {{isError}} chỉ bật cho tool thiếu hoặc ném {{RuntimeException}}. Trong code thật, lỗi trả model cần được làm sạch, còn log nội bộ giữ request ID và stack trace có kiểm soát.

Điểm quan trọng ở điều kiện max là chưa gọi tool tại step cuối. Nếu đó là {{charge}} hoặc {{send_email}}, chạy rồi bỏ kết quả sẽ gây thay đổi thật mà agent không thể kiểm chứng. Một lỗi hay gặp là gọi tool xong mới phát hiện hết quota. Trong hệ thống thật, ngoài max step còn đặt timeout, giới hạn tổng số tool và ngân sách tiền; test giả lập giúp chứng minh không có tool nào chạy sau khi hết lượt.`,
    },
  ],
  check: [
    {
      q: 'Một response có {{stop_reason = "tool_use"}} và ba block {{tool_use}}. Backend nên gửi gì để model tiếp tục?',
      options: [
        'Ba request mới, mỗi request có một kết quả',
        'Một message {{user}} chứa ba {{tool_result}}, mỗi kết quả khớp {{tool_use_id}} và giữ thứ tự lời gọi',
        'Một message {{assistant}} chứa ba kết quả do backend tạo',
        'Chỉ cần gửi kết quả của tool chạy nhanh nhất',
      ],
      answer: 1,
      explain: `Tất cả kết quả của lượt tool nằm trong một message role {{user}} kế tiếp; mỗi block dùng ID của lời gọi tương ứng. Tách thành nhiều request hoặc message phá vỡ nhịp hội thoại; backend không được giả làm role assistant; bỏ kết quả thì còn lời gọi chưa được trả lời.`,
    },
    {
      q: '{{maxSteps}} chỉ còn một lượt nhưng model vừa yêu cầu tool {{charge_card}}. Cách nào tránh side effect không có lượt tiếp theo để kiểm tra?',
      options: [
        'Chạy tool rồi bỏ kết quả vì giới hạn đã hết',
        'Gọi tool hai lần để chắc chắn thành công',
        'Dừng với trạng thái giới hạn và không thực thi tool ở lượt cuối',
        'Đổi {{stop_reason}} thành {{end_turn}} rồi báo thành công',
      ],
      answer: 2,
      explain: `Nếu chạy tool ở lượt cuối, backend không gọi lại model để nhận kết quả, trong khi charge là thay đổi thật. Dừng minh bạch giúp tầng trên xin thêm ngân sách hoặc yêu cầu người dùng tiếp tục. Chạy hai lần nhân đôi rủi ro; đổi trạng thái thành end_turn là báo thành công sai sự thật.`,
    },
    {
      q: 'Tool ném lỗi timeout. Ý nghĩa đúng của {{tool_result.is_error = true}} là gì?',
      options: [
        'Nó báo model rằng tool thất bại; backend vẫn phải log, giới hạn retry và che dữ liệu nhạy cảm',
        'Nó tự động retry cho đến khi thành công',
        'Nó làm cho model có quyền chạy tool mà không cần kiểm tra authorization',
        'Nó xác nhận giao dịch nghiệp vụ đã rollback',
      ],
      answer: 0,
      explain: `{{is_error}} là thông tin giao thức cho model, không phải cơ chế retry, phân quyền hay transaction. Backend phải tự định nghĩa retry có giới hạn và kiểm tra trạng thái giao dịch; timeout không chứng minh rằng server phía sau chưa hoàn tất thao tác.`,
    },
  ],
  related: ['claude-001', 'claude-026'],
  tags: ['agent loop', 'tool_result', 'stop_reason', 'protocol'],
},
{
  id: 'lesson-claude-005',
  track: 'claude',
  order: 5,
  title: 'Thiết kế tool description và JSON Schema: rõ mục đích, validate ở server',
  level: 'mid',
  minutes: 35,
  goals: [
    'Viết description giúp model biết tool làm gì, lúc nào dùng, lúc nào không dùng và dữ liệu nào được trả về',
    'Đọc được JSON Schema đơn giản gồm {{properties}}, {{required}}, {{type}}, {{enum}} và {{additionalProperties}}',
    'Tự validate input bằng Java, đồng thời tách kiểm tra schema khỏi quyền và quy tắc nghiệp vụ',
  ],
  body: `### Tool definition là hợp đồng với model
Model không đọc code Java phía server. Nó được cung cấp định nghĩa tool gồm tên, mô tả và schema input; dựa vào đó model quyết định có gọi hàm nào và tạo input ra sao. **Schema** là bản mô tả cấu trúc dữ liệu, giống mẫu phiếu: ô nào cần có, ô nào là số hay chuỗi, giá trị nào được phép. Schema không nói thay cho code cách truy cập hệ thống, cũng không chứng minh dữ liệu là đúng sự thật.

Ví dụ tra trạng thái đơn:

~~~json
{
  "name": "orders_get_status",
  "description": "Tra trạng thái của một đơn theo mã ORD. Dùng khi khách hỏi đơn đang giao hay đã tới. Không dùng để tra thanh toán hoặc hoàn tiền. Trả status và ngày giao dự kiến; nếu không tìm thấy thì trả NOT_FOUND.",
  "input_schema": {
    "type": "object",
    "properties": {
      "order_id": { "type": "string", "description": "Mã đơn ORD-123, không tự tạo mã." },
      "view": { "type": "string", "enum": ["status", "delivery_date"] }
    },
    "required": ["order_id"],
    "additionalProperties": false
  }
}
~~~

### Viết description như hướng dẫn cho người mới
Một description tốt nêu bốn điều: **việc gì**, **khi nào dùng**, **ranh giới không dùng**, và **kết quả/lỗi sẽ có gì**. Tool {{orders_get_status}} cụ thể dễ chọn hơn {{get_data}} vì tên và mô tả loại bỏ mơ hồ. Tham số nên có tên dễ hiểu, một câu mô tả format và nguồn lấy giá trị. Nếu {{order_id}} phải được khách cung cấp thì nói rõ không tự đoán.

Hai tool có phạm vi chồng nhau thường khiến model chọn sai. Hãy chia theo năng lực và quyền hạn, không theo từng endpoint nhỏ li ti cũng không tạo một tool tổng quát {{run_sql}}. Khi khác nhau về ý nghĩa, viết rõ "không dùng để..." và chỉ sang tool phù hợp. Nên thử danh sách tool với các câu hỏi thật: nếu đồng nghiệp mới phân vân chọn tool nào, description cần sửa.

### Schema làm được gì và không làm được gì
{{type}} kiểm tra kiểu; {{required}} yêu cầu có thuộc tính; {{enum}} giới hạn tập giá trị; {{additionalProperties: false}} từ chối field không khai báo. Một số API có chế độ strict để ràng buộc model sinh input theo schema, nhưng khả năng hỗ trợ phụ thuộc endpoint/model và subset JSON Schema được chấp nhận. Hãy kiểm tra tài liệu của phiên bản đang dùng.

Strict không thay thế kiểm tra server. Schema có thể đảm bảo {{order_id}} là string nhưng không chứng minh đơn đó tồn tại, thuộc về người đang đăng nhập hay đang ở trạng thái có thể hủy. Phía Java cần validate cấu trúc, sau đó kiểm tra quyền dựa trên identity đã xác thực (không tin {{customer_id}} do model tự gửi), rồi áp dụng quy tắc nghiệp vụ. Không tự chuyển chuỗi sai thành số vì việc "cố sửa" có thể biến input không hợp lệ thành hành động khác.

~~~java
// JSON đã parse thành Map; đây chỉ là kiểm tra type/required/enum cơ bản.
if (!(input.get("order_id") instanceof String)) {
    return error("order_id must be a string");
}
String id = (String) input.get("order_id");
if (!id.matches("ORD-[0-9]+")) return error("invalid order_id");
if (!currentUser.canViewOrder(id)) return error("not authorized");
return orderService.status(id); // gọi service chỉ sau validation và authorization
~~~

Trong ứng dụng Spring, có thể bind JSON vào DTO rồi dùng Jakarta Bean Validation cho ràng buộc như {{@NotBlank}}/{{@Pattern}}. Dù dùng thư viện nào, luôn phân biệt lỗi parse/schema, lỗi quyền và lỗi nghiệp vụ; không trả stack trace hay câu SQL cho model.

### Pitfall khi đưa vào production
- Chỉ mô tả "tìm đơn hàng" mà không nói mã đơn khác mã khách; model có thể truyền nhầm định danh.
- Để field thừa được chấp nhận có thể che giấu lỗi tên field hoặc khiến code mới xử lý ngoài dự kiến; chọn {{additionalProperties}} có chủ đích.
- {{enum}} không đảm bảo trạng thái hiện tại hợp lệ để chuyển tiếp. Chẳng hạn "CANCELLED" là giá trị hợp lệ nhưng đơn đã giao vẫn không thể hủy.
- Dữ liệu hợp schema vẫn có thể chứa thông tin người dùng không được phép truy cập; quyền phải suy ra từ session đã xác thực.

### Ví dụ đời thực
Một trợ lý nội bộ hỗ trợ 18 agent CSKH. Tỉ lệ gọi nhầm tool trạng thái đơn so với tool thanh toán là 11% trên 900 câu hỏi kiểm thử, do cả hai description đều ghi "tra cứu đơn". Nhóm đổi tên thành {{orders_get_status}}/{{payments_get_summary}}, mô tả rõ trường hợp dùng và không dùng, thêm enum cho lựa chọn thời hạn, đồng thời đặt {{additionalProperties: false}}. Backend Java từ chối type sai, kiểm tra chủ sở hữu đơn bằng user đăng nhập rồi mới gọi service. Sau khi chạy lại cùng bộ eval 900 câu, tỉ lệ chọn nhầm giảm còn 1.4%; 0 input sai schema đi tới service. Đây là phép đo chất lượng tool routing, không phải bằng chứng rằng model luôn đúng—bộ eval cần cập nhật khi thêm nghiệp vụ.

### Trả lời mẫu khi phỏng vấn
“Tôi thiết kế tool như API cho một đồng nghiệp mới: tên nói rõ domain và hành động, description nêu khi nào dùng, khi nào không, input lấy từ đâu, output và lỗi nào có thể trả về. JSON Schema mô tả object, field bắt buộc, kiểu, enum và có cho field lạ hay không. Tôi giữ schema đơn giản, bật strict nếu endpoint hỗ trợ nhưng không dựa vào model để bảo vệ backend. Java vẫn parse và validate input, lấy user từ security context thay vì tin customer_id do model truyền, kiểm tra authorization rồi mới gọi service. Sau đó kiểm tra nghiệp vụ, ví dụ trạng thái đơn có cho phép hủy không. Tôi có test eval câu hỏi đúng, câu mơ hồ và câu thiếu dữ liệu để đo tool routing, và log tên tool cùng correlation ID nhưng không log secret. Nếu người mới không phân biệt được hai tool, tôi sửa mô tả hoặc ranh giới thay vì chỉ tăng prompt.”

### Liên hệ phỏng vấn
Nhấn mạnh ba lớp: schema kiểm tra hình dạng; authorization kiểm tra người gọi được phép làm gì; nghiệp vụ kiểm tra hành động có hợp lệ ở trạng thái hiện tại hay không. Một lớp không thay thế hai lớp còn lại.`,
  exercises: [
    {
      title: 'SimpleSchema: kiểm tra required, type, enum và field lạ',
      prompt: `Hoàn thiện validator cho một **tập con đơn giản** của JSON Schema: mỗi schema là object có {{properties}}, {{required}}, {{type}}, {{enum}} và {{additionalProperties}}. Không cần viết JSON parser.

Kiểu dữ liệu được phép trong bài: {{string}}, {{integer}} (Java {{Integer}} hoặc {{Long}}) và {{boolean}}. {{enumValues}} rỗng nghĩa là không giới hạn enum. {{validate(input, schema)}} trả về list rỗng nếu hợp lệ; nếu sai trả các thông báo lỗi. Báo field bắt buộc bị thiếu, kiểu sai, giá trị ngoài enum, và field không biết khi {{additionalProperties = false}}. Không ép kiểu và không sửa input. Thứ tự lỗi phải xác định bằng cách xét tên field theo thứ tự alphabet.`,
      starter: `// ====== Có sẵn (không cần sửa) ======
record Rule(String type, boolean required, Set<?> enumValues) {}
record SimpleSchema(Map<String, Rule> properties, boolean additionalProperties) {}

// ====== Bài của bạn ======
class InputValidator {
    static List<String> validate(Map<String, Object> input, SimpleSchema schema) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void ok(boolean value, String message) { if (!value) throw new AssertionError(message); }
    static SimpleSchema schema(boolean extra) {
        Map<String, Rule> p = new HashMap<>();
        p.put("order_id", new Rule("string", true, Set.of()));
        p.put("status", new Rule("string", true, Set.of("PENDING", "SHIPPED", "DELIVERED")));
        p.put("priority", new Rule("integer", false, Set.of()));
        p.put("notify", new Rule("boolean", false, Set.of()));
        return new SimpleSchema(p, extra);
    }
    static Map<String, Object> valid() {
        Map<String, Object> m = new HashMap<>();
        m.put("order_id", "ORD-17"); m.put("status", "SHIPPED"); m.put("priority", 2);
        return m;
    }
    static boolean has(List<String> errors, String text) {
        return errors.stream().anyMatch(e -> e.contains(text));
    }
    public static void main(String[] args) {
        check("accepts valid required fields and optional integer", () -> {
            ok(InputValidator.validate(valid(), schema(false)).isEmpty(), "valid input rejected");
        });
        check("reports each missing required property", () -> {
            List<String> errors = InputValidator.validate(Map.of(), schema(false));
            ok(has(errors, "order_id") && has(errors, "status"), "missing fields not reported: " + errors);
        });
        check("does not coerce a number into a string", () -> {
            Map<String, Object> input = valid(); input.put("order_id", 17);
            ok(has(InputValidator.validate(input, schema(false)), "order_id"), "wrong type accepted");
        });
        check("rejects enum values outside the allowed set", () -> {
            Map<String, Object> input = valid(); input.put("status", "RETURNED");
            ok(has(InputValidator.validate(input, schema(false)), "status"), "unknown enum accepted");
        });
        check("rejects extra fields when additionalProperties is false", () -> {
            Map<String, Object> input = valid(); input.put("customer_id", "C-9");
            ok(has(InputValidator.validate(input, schema(false)), "customer_id"), "extra field accepted");
        });
        check("allows extra fields only when configured", () -> {
            Map<String, Object> input = valid(); input.put("trace", "t-1");
            ok(InputValidator.validate(input, schema(true)).isEmpty(), "allowed extra field rejected");
        });
        check("rejects non-integer and null values for typed fields", () -> {
            Map<String, Object> input = valid(); input.put("priority", 2.5); input.put("notify", null);
            List<String> errors = InputValidator.validate(input, schema(false));
            ok(has(errors, "priority") && has(errors, "notify"), "typed invalid values accepted: " + errors);
        });
        check("error order is deterministic by field name", () -> {
            Map<String, Object> input = new HashMap<>();
            input.put("z_extra", 1); input.put("a_extra", 2);
            List<String> errors = InputValidator.validate(input, schema(false));
            ok(errors.indexOf(errors.stream().filter(e -> e.contains("a_extra")).findFirst().orElse("")) <
               errors.indexOf(errors.stream().filter(e -> e.contains("z_extra")).findFirst().orElse("")),
               "errors are not sorted: " + errors);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `// ====== Có sẵn (không cần sửa) ======
record Rule(String type, boolean required, Set<?> enumValues) {}
record SimpleSchema(Map<String, Rule> properties, boolean additionalProperties) {}

// ====== Lời giải ======
class InputValidator {
    static List<String> validate(Map<String, Object> input, SimpleSchema schema) {
        List<String> errors = new ArrayList<>();
        if (input == null) {
            errors.add("Input must be an object");
            return errors;
        }
        for (String name : new TreeSet<>(schema.properties().keySet())) {
            Rule rule = schema.properties().get(name);
            if (rule.required() && !input.containsKey(name))
                errors.add("Missing required property: " + name);
        }
        for (String name : new TreeSet<>(input.keySet())) {
            Rule rule = schema.properties().get(name);
            if (rule == null) {
                if (!schema.additionalProperties()) errors.add("Unknown property: " + name);
                continue;
            }
            Object value = input.get(name);
            if (!matches(rule.type(), value)) {
                errors.add("Invalid type for property: " + name);
            } else if (!rule.enumValues().isEmpty() && !rule.enumValues().contains(value)) {
                errors.add("Value is not allowed for property: " + name);
            }
        }
        return errors;
    }

    private static boolean matches(String type, Object value) {
        return switch (type) {
            case "string" -> value instanceof String;
            case "integer" -> value instanceof Integer || value instanceof Long;
            case "boolean" -> value instanceof Boolean;
            default -> throw new IllegalArgumentException("Unsupported schema type: " + type);
        };
    }
}`,
      hints: [
        'Tách hai lượt duyệt: lượt đầu kiểm tra {{required}} bằng {{containsKey}}; lượt sau xét từng input để phát hiện field lạ hoặc sai type/enum.',
        'Dùng {{new TreeSet<>(map.keySet())}} để duyệt alphabetically. Kiểm tra type trước enum để không so sánh một giá trị sai kiểu như thể nó hợp lệ.',
      ],
      explain: `Validator nhận một map đã parse, nên nó chỉ xử lý subset schema đã nêu, không phải bộ giải JSON Schema đầy đủ. Lượt đầu đi qua khai báo theo thứ tự alphabet và báo field required thiếu. {{containsKey}} quan trọng hơn {{get(name) == null}}: field có mặt nhưng giá trị null không giống field vắng mặt; trong subset này, null sẽ bị đánh dấu sai type.

Lượt sau đi qua key input đã sắp xếp. Không có rule thì chỉ báo lỗi khi {{additionalProperties}} là false. Có rule thì kiểm tra type trước, rồi mới kiểm tra enum; {{priority = 2.5}} không thể được ép thành integer, còn status "RETURNED" có đúng kiểu string nhưng không nằm trong tập giá trị cho phép. Thông báo lỗi không phụ thuộc thứ tự của {{HashMap}} nên test và log ổn định.

Trong ứng dụng thực tế, JSON parser có thể biểu diễn số bằng {{Long}} hoặc {{BigDecimal}}, vì vậy validator cần định nghĩa rõ thế nào là integer theo parser đang dùng. Schema cũng có thể hỗ trợ array, object lồng nhau, minimum hay pattern; bài tập cố ý không triển khai các phần đó để không giả vờ rằng đây là validator chuẩn đầy đủ.

Không dùng kết quả schema như quyết định truy cập. Sau khi input hợp lệ, server phải lấy user từ authentication context, kiểm tra quyền xem đơn rồi mới gọi service. Một input {{order_id}} đúng regex vẫn có thể là đơn của người khác; {{enum}} đúng cũng không chứng minh trạng thái hiện tại cho phép hủy.`,
    },
  ],
  check: [
    {
      q: 'Schema yêu cầu {{order_id}} là string và input đúng kiểu. Điều gì vẫn phải được backend kiểm tra?',
      options: [
        'Không cần gì nữa, schema chứng minh người dùng sở hữu đơn',
        'Chỉ cần kiểm tra tool name không quá dài',
        'Quyền của user đã xác thực và quy tắc nghiệp vụ như đơn có được hủy ở trạng thái hiện tại không',
        'Model có trả lời bằng tiếng Việt hay không',
      ],
      answer: 2,
      explain: `Schema chỉ kiểm tra cấu trúc, không biết danh tính người dùng, quyền truy cập, đơn có tồn tại hoặc trạng thái có cho phép hủy. Tool name cũng không giải quyết các điều kiện đó; ngôn ngữ trả lời không liên quan authorization hay business rule.`,
    },
    {
      q: 'Description của {{orders_get_status}} nên nói gì để giảm gọi nhầm tool?',
      options: [
        'Chỉ ghi "Get order" để model tự suy ra',
        'Nêu việc tool làm, trường hợp dùng/không dùng, input cần lấy từ đâu và output/lỗi có thể nhận',
        'Chép toàn bộ source code của service Java vào description',
        'Không mô tả input vì schema đã có tên field',
      ],
      answer: 1,
      explain: `Tên và description là hiểu biết chính của model về tool. Ranh giới, nguồn input và kết quả giúp phân biệt tool trạng thái đơn với tool thanh toán. Mô tả chung làm tăng mơ hồ; model không đọc source backend; schema field name một mình không giải thích nghiệp vụ.`,
    },
    {
      q: '{{additionalProperties: false}} kết hợp {{enum}} đảm bảo điều gì?',
      options: [
        'Không có field lạ và giá trị enum nằm trong tập khai báo, nhưng không đảm bảo dữ liệu đúng nghiệp vụ',
        'Model không thể mắc lỗi ở bất kỳ bước nào',
        'Người gọi chắc chắn có quyền truy cập tài nguyên',
        'Các trạng thái enum luôn hợp lệ cho mọi chuyển đổi trạng thái',
      ],
      answer: 0,
      explain: `Hai ràng buộc chỉ kiểm tra shape và tập giá trị. Enum "CANCELLED" có thể tồn tại nhưng không hợp lệ để chuyển một đơn đã giao; schema cũng không biết ai đang gọi. Strict generation giảm input sai schema nhưng không thay thế validation server.`,
    },
  ],
  related: ['claude-026', 'claude-001'],
  tags: ['tool description', 'JSON Schema', 'input validation', 'authorization'],
},
);
