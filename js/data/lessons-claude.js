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
    static void ok(boolean cond) { if (!cond) throw new AssertionError("check failed"); }

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
{
  id: 'lesson-claude-006',
  track: 'claude',
  order: 6,
  title: 'Agent đa phụ trách: chia công việc, giao cho subagent và tổng hợp',
  level: 'senior',
  minutes: 45,
  goals: [
    'Hiểu được khi nào nên chia một tác vụ lớn thành nhiều công việc con thay vì dùng một agent duy nhất',
    'Làm được vòng lặp "giao công việc → chờ kết quả → tổng hợp" mà không làm mess ngữ cảnh',
    'Biết khi nào kết thúc vòng lặp: hàng đợi công việc trống, model báo xong, hoặc đạt số bước tối đa'
  ],
  body: `### Vì sao một agent nên chia công việc
Một agent là chương trình dùng model ngôn ngữ để lập kế hoạch, chọn tool và gọi tool liên tiếp cho đến khi xong. Với tác vụ ngắn (tra một đơn hàng, tính phí giao) một agent gọi 1–2 tool là xong. Nhưng tác vụ lớn (kiểm tra 50 đơn giao chậm, gửi thông báo cho từng khách, báo cáo sai sót) thì một agent duy nhất gọi nhiều tool liên tiếp: dễ rơi vào vòng lặp, ngữ cảnh phình to, và khó theo dõi từng bước.

**Phân chia công việc (task decomposition)** là chia tác vụ lớn thành nhiều công việc con nhỏ, mỗi công việc có một mục tiêu duy nhất. Ví dụ kiểm tra đơn giao chậm:
- Công việc 1: lấy danh sách đơn giao chậm hôm nay (dùng tool {{orders_list}}).
- Công việc 2: kiểm tra lý do chậm của mỗi đơn (dùng tool {{shipping_get_delay}}).
- Công việc 3: gửi email thông báo khách hàng (dùng tool {{notify_send}}).

Mỗi công việc có thể được giao cho một **subagent** — agent nhỏ chạy độc lập với ngữ cảnh của chính nó, thường ít lịch sử hơn, hoàn thành một mục tiêu duy nhất rồi trả tóm tắt về agent cha. Agent cha không cần xem chi tiết từng lệnh tool của subagent, chỉ cần tóm tắt kết quả.

### Giao công việc qua tool
Delegation cũng là một tool trong Messages API. Agent cha gọi tool {{delegate_task}} với input gồm tên subagent, nhiệm vụ và dữ liệu cần thiết. Tool này chạy subagent bên trong (có thể là một cuộc gọi Claude riêng) và trả về kết quả ngắn gọn.

~~~json
{ "type": "tool_use", "id": "toolu_D1", "name": "delegate_task",
  "input": { "agent": "shipping_checker", "task": "Lý do đơn ORD-42 bị chậm giao?", "input": { "order_id": "ORD-42" } } }
~~~

Trường {{id}} của {{tool_use}} gắn liền với {{tool_use_id}} trong {{tool_result}} trả về, giống mã vận đơn và kiện hàng: nội dung có thể giống nhau, nhưng nhầm mã thì không biết kết quả thuộc yêu cầu nào.

### Vòng lặp plan-delegate-aggregate
Agent cha giữ hàng đợi công việc chưa làm. Mỗi bước:

1. Nếu còn công việc chưa làm, chọn một công việc → gọi {{delegate_task}} (hoặc tool nghiệp vụ trực tiếp nếu đơn giản).
2. Nhận {{tool_result}} của công việc con: thành công kèm tóm tắt, hoặc lỖ ({{is_error = true}}).
3. Ghi kết quả vào ngữ cảnh, xóa công việc khỏi hàng đợi.
4. Nếu hàng đợi còn công việc → lặp lại. Nếu hết → gọi model một lần cuối để tổng hợp câu trả lời cho người dùng.

~~~text
agent cha                      subagent A (shipping)
   |                             |
   |-- delegate_task ----------->|
   |                             |-- gọi tool shipping_get_delay
   |<-- tool_result (lý do chậm) --|
   |-- delegate_task (ORD-99) ---->|
   |                             |-- ...
   |<-- tool_result ---------------|
   |-- end_turn: tổng hợp cho user |
~~~

### Khi nào dùng delegation và khi nào không
Dùng khi: tác vụ có nhiều bước độc lập, cần gọi cùng tool nhiều lần với input khác, hoặc muốn tách ngữ cảnh để mỗi subagent tập trung một việc. Không dùng khi: tác vụ ngắn gọn, tool chỉ gọi một lần, hoặc chi phí gọi subagent cao hơn lợi ích. Mỗi lần gọi subagent cũng tốn token và tiền, giống một cuộc gọi model bình thường.

### Lỗi hay gặp
- **Gộp quá nhiều nhiệm vụ vào một subagent**: subagent quá tải ngữ cảnh, trả kết quả sai hoặc bỏ sót bước. Chia nhỏ hơn nữa.
- **Không xử lý lỗi của subagent**: một công việc con lỗi làm agent cha cứ chờ mãi hoặc crash. Luôn có {{tool_result}} với {{is_error}} và kế hoạch dự phòng (thử tool khác, hỏi người dùng, hoặc báo thất bại phần nào).
- **Quên dừng vòng lặp**: agent tạo công việc con mới từ kết quả công việc cũ → lặp vô hạn. Đặt số bước tối đa (maxSteps) và số công việc con tối đa (maxTasks).
- **Truyền quá nhiều ngữ cảnh xuống subagent**: làm phình token, chậm, và rủi ro rò rỉ dữ liệu không liên quan. Chỉ truyền tối thiểu dữ liệu cần thiết.

### Trả lời mẫu khi phỏng vấn
"Khi tác vụ lớn, tôi chia thành các công việc con độc lập và dùng agent con (subagent) qua một tool delegation, mỗi agent con chỉ nhận tối thiểu dữ liệu cần thiết và hoàn thành một mục tiêu duy nhất. Agent cha giữ hàng đợi công việc, gọi delegation theo thứ tự, thu thập tool_result (bao gồm cả is_error khi subagent lỗi), rồi khi hàng đợi trống tổng hợp câu trả lời cuối. Tôi đặt ngân sách bước và số công việc tối đa để tránh lặp vô hạn, và không bao giờ để một lỗi của subagent làm crash toàn bộ phiên."

### Liên hệ phỏng vấn
Interviewer có thể hỏi: "subagent khác agent chính thế nào?" (ngữ cảnh nhỏ hơn, mục tiêu duy nhất, chạy độc lập), "làm sao biết khi nào dừng delegation?" (hàng đợi trống, maxSteps, hoặc model báo end_turn), và "lỗi subagent xử lý thế nào?" (tool_result is_error, kế hoạch dự phòng, báo người dùng thay vì crash).
`,
  exercises: [
    {
      title: 'TaskDelegator: hàng đợi công việc, gọi delegation và tổng hợp',
      prompt: `Các kiểu Block, Message, ModelReply, FakeModel, AgentResult và TaskResult mô phỏng Messages API với delegation (không cần sửa). Hãy viết TaskDelegator.run(history, model, delegate, maxSteps):

1. Lịch sử ban đầu đã có sẵn (ví dụ message user chứa kế hoạch). Không được sửa list gốc.
2. Mỗi bước: gọi model.next(truyền bản sao của lịch sử), tăng số bước, rồi nối nguyên văn reply.content() vào lịch sử dưới role assistant.
3. Nếu stopReason là "task_use": với mỗi block task_use theo thứ tự, gọi delegate(name, input) nhận TaskResult{ok, summary}. Nếu delegate ném RuntimeException → tạo task_result với is_error = true và nội dung "Error: " + thông điệp exception. Gom tất cả kết quả trong một message user, mỗi block task_result có task_useId khớp id của task_use tương ứng.
4. Nếu stopReason là "end_turn": trả về AgentResult(text, steps, "end_turn") với text là nối các block text của reply cuối.
5. Các stopReason khác (max_tokens, refusal…): trả về AgentResult(text, steps, stopReason).
6. Đã gọi model đủ maxSteps mà chưa end_turn → trả về AgentResult(text của reply cuối, maxSteps, "max_steps").`,
      starter: `// ====== Có sẵn (không cần sửa) ======
record Block(String type, String text, String id, String name, Map<String, Object> input,
             String toolUseId, String content, boolean isError) {
    static Block text(String text) { return new Block("text", text, null, null, null, null, null, false); }
    static Block taskUse(String id, String name, Map<String, Object> input) {
        return new Block("task_use", null, id, name, input, null, null, false);
    }
    static Block taskResult(String taskUseId, String content, boolean isError) {
        return new Block("task_result", null, null, null, null, taskUseId, content, isError);
    }
}
record Message(String role, List<Block> content) {}           // role: "user" | "assistant"
record ModelReply(String stopReason, List<Block> content) {}
interface FakeModel { ModelReply next(List<Message> conversation); }
record AgentResult(String answer, int steps, String stopReason) {}
record TaskResult(boolean ok, String summary) {}

// ====== Bài của bạn ======
class TaskDelegator {
    static AgentResult run(List<Message> history, FakeModel model,
                           BiFunction<String, Map<String, Object>, TaskResult> delegate, int maxSteps) {
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
    static void ok(boolean cond) { if (!cond) throw new AssertionError("check failed"); }
    static Map<String, Object> in(String k, Object v) { Map<String, Object> m = new HashMap<>(); m.put(k, v); return m; }

    static class ScriptedModel implements FakeModel {
        final List<ModelReply> script;
        final List<List<Message>> seen = new ArrayList<>();
        ScriptedModel(ModelReply... replies) { script = List.of(replies); }
        public ModelReply next(List<Message> conversation) {
            seen.add(new ArrayList<>(conversation));
            return script.get(Math.min(seen.size() - 1, script.size() - 1));
        }
    }
    static ModelReply reply(String stop, Block... blocks) { return new ModelReply(stop, List.of(blocks)); }

    public static void main(String[] args) {
        check("gọi delegation một lần và kết thúc khi end_turn", () -> {
            List<Map<String, Object>> calls = new ArrayList<>();
            BiFunction<String, Map<String, Object>, TaskResult> delegate =
                (name, input) -> { calls.add(input); return new TaskResult(true, "Đã giao hàng hôm qua"); };
            ScriptedModel m = new ScriptedModel(
                reply("task_use", Block.taskUse("D1", "ship_check", in("order_id", "ORD-42"))),
                reply("end_turn", Block.text("Đã kiểm tra xong.")));
            AgentResult r = TaskDelegator.run(List.of(new Message("user", List.of(Block.text("Kiểm tra đơn.")))), m, delegate, 5);
            eq(1, calls.size()); eq("ORD-42", calls.get(0).get("order_id"));
            eq("Đã kiểm tra xong.", r.answer()); eq(2, r.steps()); eq("end_turn", r.stopReason());
        });
        check("task_result khớp task_use_id và vào một message user", () -> {
            BiFunction<String, Map<String, Object>, TaskResult> delegate =
                (name, input) -> new TaskResult(true, "delay 2 ngày");
            ScriptedModel m = new ScriptedModel(
                reply("task_use", Block.taskUse("D1", "ship_check", in("order_id", "ORD-42"))),
                reply("end_turn", Block.text("xong")));
            TaskDelegator.run(List.of(new Message("user", List.of(Block.text("Kiểm tra.")))), m, delegate, 5);
            List<Message> second = m.seen.get(1);
            eq(3, second.size());
            eq("assistant", second.get(1).role());
            List<Block> c = second.get(2).content();
            eq(1, c.size());
            Block b = c.get(0);
            eq("task_result", b.type()); eq("D1", b.toolUseId()); eq("delay 2 ngày", b.content()); eq(false, b.isError());
        });
        check("hai delegation song song: cả hai gọi, thứ tự giữ, một message user", () -> {
            List<Map<String, Object>> inputs = new ArrayList<>();
            BiFunction<String, Map<String, Object>, TaskResult> delegate =
                (name, input) -> { inputs.add(input); return new TaskResult(true, "ok " + name); };
            ScriptedModel m = new ScriptedModel(
                reply("task_use", Block.taskUse("D1", "ship_check", in("a", 1)), Block.taskUse("D2", "ship_check", in("a", 2))),
                reply("end_turn", Block.text("ok")));
            TaskDelegator.run(List.of(new Message("user", List.of(Block.text("x")))), m, delegate, 5);
            eq(2, inputs.size()); eq(1, inputs.get(0).get("a")); eq(2, inputs.get(1).get("a"));
            List<Block> c = m.seen.get(1).get(2).content();
            eq(2, c.size());
            eq("D1", c.get(0).toolUseId()); eq("ok ship_check", c.get(0).content());
            eq("D2", c.get(1).toolUseId()); eq("ok ship_check", c.get(1).content());
        });
        check("delegate ném lỗi → is_error và vòng lặp tiếp tục", () -> {
            BiFunction<String, Map<String, Object>, TaskResult> delegate =
                (name, input) -> { throw new IllegalStateException("API ship lỗi"); };
            ScriptedModel m = new ScriptedModel(
                reply("task_use", Block.taskUse("D1", "ship_check", in("order_id", "ORD-42"))),
                reply("end_turn", Block.text("Có lỗi, hỏi lại sau.")));
            AgentResult r = TaskDelegator.run(List.of(new Message("user", List.of(Block.text("Kiểm tra.")))), m, delegate, 5);
            eq("end_turn", r.stopReason()); eq(2, r.steps());
            Block b = m.seen.get(1).get(2).content().get(0);
            eq("D1", b.toolUseId()); ok(b.isError(), "lỗi subagent phải is_error = true");
            ok(b.content() != null && b.content().contains("API ship lỗi"), "nội dung lỗi: " + b.content());
        });
        check("end_turn ngay lập tức", () -> {
            BiFunction<String, Map<String, Object>, TaskResult> delegate = (n, i) -> new TaskResult(true, "x");
            ScriptedModel m = new ScriptedModel(reply("end_turn", Block.text("Không cần công việc nào.")));
            AgentResult r = TaskDelegator.run(List.of(new Message("user", List.of(Block.text("Hello")))), m, delegate, 5);
            eq("end_turn", r.stopReason()); eq(1, r.steps()); eq("Không cần công việc nào.", r.answer());
        });
        check("dừng sau maxSteps", () -> {
            BiFunction<String, Map<String, Object>, TaskResult> delegate = (n, i) -> new TaskResult(true, "ok");
            ScriptedModel m = new ScriptedModel(reply("task_use", Block.taskUse("D1", "ship_check", in("x", 1))));
            AgentResult r = TaskDelegator.run(List.of(new Message("user", List.of(Block.text("Làm mãi.")))), m, delegate, 3);
            eq(3, r.steps()); eq("max_steps", r.stopReason()); eq(3, m.seen.size());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `// ====== Có sẵn (không cần sửa) ======
record Block(String type, String text, String id, String name, Map<String, Object> input,
             String toolUseId, String content, boolean isError) {
    static Block text(String text) { return new Block("text", text, null, null, null, null, null, false); }
    static Block taskUse(String id, String name, Map<String, Object> input) {
        return new Block("task_use", null, id, name, input, null, null, false);
    }
    static Block taskResult(String taskUseId, String content, boolean isError) {
        return new Block("task_result", null, null, null, null, taskUseId, content, isError);
    }
}
record Message(String role, List<Block> content) {}           // role: "user" | "assistant"
record ModelReply(String stopReason, List<Block> content) {}
interface FakeModel { ModelReply next(List<Message> conversation); }
record AgentResult(String answer, int steps, String stopReason) {}
record TaskResult(boolean ok, String summary) {}

// ====== Lời giải ======
class TaskDelegator {
    static AgentResult run(List<Message> history, FakeModel model,
                           BiFunction<String, Map<String, Object>, TaskResult> delegate, int maxSteps) {
        List<Message> conv = new ArrayList<>(history);
        String lastText = "";
        int steps = 0;
        while (steps < maxSteps) {
            ModelReply reply = model.next(new ArrayList<>(conv));  // API stateless: gửi toàn bộ lịch sử
            steps++;
            conv.add(new Message("assistant", reply.content()));   // giữ nguyên mọi block
            lastText = textOf(reply.content());
            switch (reply.stopReason()) {
                case "task_use" -> {
                    List<Block> results = new ArrayList<>();
                    for (Block b : reply.content())
                        if ("task_use".equals(b.type())) results.add(execute(b, delegate));
                    conv.add(new Message("user", results));          // mọi kết quả trong một message user
                }
                default -> { return new AgentResult(lastText, steps, reply.stopReason()); }
            }
        }
        return new AgentResult(lastText, steps, "max_steps");        // trần số bước: không lặp vô hạn
    }

    private static Block execute(Block call, BiFunction<String, Map<String, Object>, TaskResult> delegate) {
        try {
            TaskResult r = delegate.apply(call.name(), call.input());
            return Block.taskResult(call.id(), r.summary(), !r.ok());
        } catch (RuntimeException e) {                               // subagent lỗi → báo cho model, không sập
            return Block.taskResult(call.id(), "Error: " + e.getMessage(), true);
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
        'Nhánh {{task_use}} gom mọi {{task_result}} vào một list rồi thêm đúng một message {{user}}; mỗi block có {{taskUseId}} khớp {{id}} của task_use.',
        'Bọc lời gọi delegate trong {{try/catch (RuntimeException e)}} và trả task_result với {{is_error = true}} khi subagent ném lỗi.'
      ],
      explain: `Vòng delegation khác vòng tool_use thường ở điểm mỗi block task_use đại diện cho một công việc con chạy độc lập (subagent), nên agent cha không cần biết chi tiết tool nội bộ của subagent, chỉ cần tóm tắt kết quả (summary) hay lỗi (is_error).

Ba lỗi hay gặp:
- **Quên giữ nguyên message assistant** trước khi thêm message user chứa task_result. API thật trả 400 vì task_result không có task_use ngay trước nó.
- **Gom tất cả kết quả trong một message user** khi model gọi nhiều task_use cùng lúc; tách thành nhiều message user là sai cấu trúc.
- **Không xử lý lỗi subagent**: một công việc con lỗi không được để làm crash phiên. Trả task_result is_error với thông điệp rõ để model quyết định bước tiếp (thử lại, hỏi người dùng, hoặc báo thất bại).

Vì sao cần maxSteps: agent có thể tạo công việc con mới từ kết quả công việc cũ dẫn lặp vô hạn. Trả về stopReason "max_steps" để tầng trên hiển thị "không hoàn thành được" thay vì treo.`,
    },
  ],
  check: [
    {
      q: 'Khi agent dùng delegation để giao công việc cho subagent qua Messages API, điều kiện bắt buộc để request không bị lỗi là gì?',
      options: [
        'Mỗi block tool_use phải có block tool_result với tool_use_id khớp id',
        'Chỉ cần gửi kết quả của công việc đầu tiên, model sẽ tự hỏi lại công việc còn lại',
        'tool_result phải nằm trong message assistant cùng với tool_use',
        'Mỗi công việc con phải chạy trên một agent vật lý khác nhau'
      ],
      answer: 0,
      explain: `Mỗi tool_use phải có đúng một tool_result với tool_use_id khớp id, tất cả nằm trong một message user ngay sau message assistant. Gửi thiếu một kết quả làm API báo lỗi; tool_result không bao giờ nằm trong message assistant; không yêu cầu agent chạy trên máy vật lý khác.`,
    },
    {
      q: 'Khi nào nên dùng delegation (giao cho subagent) thay để agent duy nhất gọi tool trực tiếp?',
      options: [
        'Tác vụ ngắn gọn chỉ gọi một tool',
        'Tác vụ lớn có nhiều bước độc lập, cần gọi cùng tool nhiều lần với input khác',
        'Luôn dùng delegation vì delegation miễn phí',
        'Chỉ dùng khi muốn gọi tool song song'
      ],
      answer: 1,
      explain: `Delegation tốn token và tiền như một cuộc gọi model bình thường, nên chỉ đáng giá khi tác vụ lớn, nhiều bước độc lập, hoặc cần tách ngữ cảnh để mỗi subagent tập trung một việc. Tác vụ ngắn gọi một tool thì agent duy nhất gọi trực tiếp là đủ. Delegation không miễn phí và không bắt buộc gọi song song.`,
    },
    {
      q: 'Vòng lặp delegation phải dừng khi nào để tránh lỗi trên production?',
      options: [
        'Chạy mãi cho đến khi model trả lời xong',
        'Khi hàng đợi công việc trống, model báo end_turn, hoặc đạt số bước tối đa (maxSteps)',
        'Chỉ khi đạt maxSteps',
        'Không bao giờ dừng, agent phải hoàn thành mọi công việc con'
      ],
      answer: 1,
      explain: `Dừng khi hàng đợi trống (hoàn tất), model báo end_turn (không cần công việc thêm), hoặc đạt maxSteps (tránh lặp vô hạn và chi phí tăng theo từng request). Chỉ dừng khi maxSteps có thể bỏ sót công việc còn lại; chạy mãi là nguy hiểm nhất.`,
    },
  ],
  related: ['claude-001', 'claude-013'],
  tags: ['subagent', 'delegation', 'task decomposition', 'agent loop'],
},
{
  id: 'lesson-claude-007',
  track: 'claude',
  order: 7,
  title: 'Bảo vệ agent loop: xác nhận trước side effect và idempotency key',
  level: 'senior',
  minutes: 40,
  goals: [
    'Phân loại được tool chỉ đọc và tool có side effect (ghi dữ liệu, gửi tiền, gửi mail)',
    'Viết gate xác nhận: chạy ngay, từ chối, hoặc chờ người dùng xác nhận',
    'Hiểu idempotency key: cùng yêu cầu nghiệp vụ chỉ được thực hiện một lần ngay cả khi retry'
  ],
  body: `### Tool chỉ đọc và tool có side effect
Tool chỉ đọc (tra đơn hàng, kiểm tra tồn kho) có thể gọi nhiều lần mà không thay đổi trạng thái hệ thống. Tool có **side effect** thay đổi trạng thái: chuyển tiền, gửi email, xóa tài khoản, triển khai code. Gọi lại tool có side effect hai lần có thể tạo hai giao dịch, gửi hai email — tai nạn thực tế trên production.

### Gate xác nhận trước khi chạy
Trước khi thực thi tool có side effect, agent nên hỏi người dùng: "Bạn đồng ý chuyển 5 triệu VND cho người A không?" Ba nhánh:
- **RUN**: tool chỉ đọc, hoặc tool có side effect nằm trong danh sách cho phép tự chạy (allowlist).
- **WAIT**: tool có side effect, không trong allowlist, chưa xác nhận → dừng vòng lặp, hỏi người dùng.
- **DENY**: tool bị cấm (ví dụ xóa toàn bộ database), hoặc cùng idempotency key đã chạy rồi.

Với Messages API, khi WAIT agent dừng vòng lặp (không gửi tool_result), UI hiện nút xác nhận. Khi người dùng bấm đồng ý, gửi lại cùng lịch sử kèm thông tin xác nhận và chạy tool.

### Idempotency key
Idempotency key là mã nhận dạng duy nhất của một yêu cầu nghiệp vụ (ví dụ mã đơn hàng, mã chuyển khoản). Server lưu key đã xử lý; yêu cầu cùng key lần nữa → trả kết quả cũ, không thực hiện lại. Điều này rất quan trọng khi agent retry sau lỗi mạng: không biết lần trước đã thành công hay chưa, gửi lại cùng key đảm bảo không tạo giao dịch trùng.

~~~text
agent                            server
   |                             |
   |-- transfer(key=TX-100, 5tr) -->|
   |                             |-- lưu key TX-100, trừ tiền
   |<-- thành công ----------------|
   |                             |
   |-- transfer(key=TX-100, 5tr) -->|  retry sau lỗi mạng
   |                             |-- key TX-100 đã tồn tại → trả kết quả cũ
   |<-- thành công (không trừ lại) --|
~~~

### Lỗi hay gặp
- **Xác nhận sau khi đã chạy**: nếu agent chạy tool rồi mới hỏi người dùng, đã muộn. Xác nhận phải xảy ra **trước** thực thi.
- **Dùng tool_use_id làm idempotency key**: tool_use_id chỉ nhận diện một lần gọi model, có thể thay đổi khi retry. Idempotency key phải là mã nghiệp vụ (mã đơn, mã giao dịch).
- **Không phân biệt tool đọc/ghi**: gọi tool xóa hay gửi mail mà không hỏi là nguy hiểm trên production.
- **Retry vô hạn tool lỗi**: lỗi tạm thời (mạng) thì retry có ý nghĩa, lỗi logic (sai input, thiếu quyền) thì retry cũng lỗi. Phân loại lỗi trước khi retry.

### Trả lời mẫu khi phỏng vấn
"Tool chỉ đọc có thể gọi tự do, nhưng tool có side effect (chuyển tiền, gửi email, xóa dữ liệu) phải qua gate xác nhận trước khi chạy: nếu trong danh sách cho phép thì chạy ngay, nếu không thì dừng và hỏi người dùng. Mọi lệnh ghi dữ liệu đều kèm idempotency key lấy từ mã nghiệp vụ (mã đơn hàng, mã giao dịch) để retry sau lỗi mạng không tạo giao dịch trùng. Tôi cũng phân loại lỗi: lỗi mạng/tạm thời thì retry với backoff, lỗi input hay quyền thì báo người dùng thay vì retry vô hạn."

### Liên hệ phỏng vấn
Interviewer có thể hỏi: "idempotency key khác tool_use_id thế nào?" (key là mã nghiệp vụ, tool_use_id chỉ là mã lần gọi model), "khi nào chờ xác nhận trước khi gọi tool?" (side effect và không trong allowlist), và "lỗi nào nên retry, lỗi nào không?" (mạng/tạm thời retry, sai input hay quyền không retry).
`,
  exercises: [
    {
      title: 'SafetyGuard: xác nhận trước side effect và idempotency key',
      prompt: `Các kiểu ToolCall và GuardDecision mô phỏng gate bảo vệ agent loop (không cần sửa). Hãy viết class SafetyGuard:

- Constructor SafetyGuard(Set<String> autoRun): danh sách tool có side effect nhưng được phép chạy tự động (không cần xác nhận).
- GuardDecision guard(ToolCall call, boolean confirmedByUser):
  + Tool chỉ đọc (sideEffect = false) → RUN.
  + Tool có side effect và tên nằm trong autoRun → RUN.
  + Tool có side effect, không trong autoRun, chưa xác nhận → WAIT (dừng và hỏi người dùng).
  + Tool có side effect, không trong autoRun, đã xác nhận → RUN.
  + Nếu input chứa idempotencyKey đã dùng trước đó → DENY (không chạy lại yêu cầu đã xử lý).
- boolean recordKey(String key): đánh dấu idempotency key đã dùng. Trả true nếu key mới (chưa từng dùng), false nếu key đã được dùng trước đó.

action của GuardDecision là một trong "RUN", "WAIT", "DENY".`,
      starter: `// ====== Có sẵn (không cần sửa) ======
record ToolCall(String id, String name, Map<String, Object> input, boolean sideEffect) {}
record GuardDecision(String action, String reason) {}

// ====== Bài của bạn ======
class SafetyGuard {
    final Set<String> autoRun;
    final Set<String> usedKeys;

    SafetyGuard(Set<String> autoRun) {
        this.autoRun = new HashSet<>(autoRun);
        this.usedKeys = new HashSet<>();
    }

    GuardDecision guard(ToolCall call, boolean confirmedByUser) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean recordKey(String key) {
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
    static void ok(boolean cond) { if (!cond) throw new AssertionError("check failed"); }
    static Map<String, Object> in(String k, Object v) { Map<String, Object> m = new HashMap<>(); m.put(k, v); return m; }
    static ToolCall readOnly() { return new ToolCall("T1", "get_order", in("order_id", "ORD-1"), false); }
    static ToolCall autoRun() { return new ToolCall("T2", "send_receipt", in("order_id", "ORD-1"), true); }
    static ToolCall dangerous() { return new ToolCall("T3", "delete_account", in("user_id", "U1"), true); }

    public static void main(String[] args) {
        check("tool chỉ đọc chạy ngay không cần xác nhận", () -> {
            SafetyGuard g = new SafetyGuard(Set.of());
            eq("RUN", g.guard(readOnly(), false).action());
        });
        check("tool trong allowlist chạy ngay", () -> {
            SafetyGuard g = new SafetyGuard(Set.of("send_receipt"));
            eq("RUN", g.guard(autoRun(), false).action());
        });
        check("tool nguy hiểm chờ xác nhận", () -> {
            SafetyGuard g = new SafetyGuard(Set.of());
            eq("WAIT", g.guard(dangerous(), false).action());
        });
        check("tool nguy hiểm chạy sau khi xác nhận", () -> {
            SafetyGuard g = new SafetyGuard(Set.of());
            eq("RUN", g.guard(dangerous(), true).action());
        });
        check("idempotency key chỉ nhận một lần", () -> {
            SafetyGuard g = new SafetyGuard(Set.of());
            ok(g.recordKey("TX-1"), "lần đầu nhận key");
            ok(!g.recordKey("TX-1"), "key trùng phải bị từ chối");
        });
        check("key khác nhau độc lập nhau", () -> {
            SafetyGuard g = new SafetyGuard(Set.of());
            ok(g.recordKey("TX-1"), "lần đầu nhận TX-1");
            ok(g.recordKey("TX-2"), "lần đầu nhận TX-2");
            ok(!g.recordKey("TX-1"), "key trùng phải bị từ chối");
        });
        check("guard từ chối khi idempotency key đã dùng", () -> {
            SafetyGuard g = new SafetyGuard(Set.of());
            g.recordKey("TX-100");
            ToolCall call = new ToolCall("T4", "transfer", in("idempotencyKey", "TX-100"), true);
            eq("DENY", g.guard(call, true).action());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `// ====== Có sẵn (không cần sửa) ======
record ToolCall(String id, String name, Map<String, Object> input, boolean sideEffect) {}
record GuardDecision(String action, String reason) {}

// ====== Lời giải ======
class SafetyGuard {
    final Set<String> autoRun;
    final Set<String> usedKeys;

    SafetyGuard(Set<String> autoRun) {
        this.autoRun = new HashSet<>(autoRun);
        this.usedKeys = new HashSet<>();
    }

    GuardDecision guard(ToolCall call, boolean confirmedByUser) {
        String key = (String) call.input().getOrDefault("idempotencyKey", null);
        if (key != null && usedKeys.contains(key)) return new GuardDecision("DENY", "đã xử lý yêu cầu này");
        if (!call.sideEffect()) return new GuardDecision("RUN", "tool chỉ đọc");
        if (autoRun.contains(call.name())) return new GuardDecision("RUN", "trong allowlist");
        if (!confirmedByUser) return new GuardDecision("WAIT", "chưa xác nhận");
        return new GuardDecision("RUN", "đã xác nhận");
    }

    boolean recordKey(String key) {
        if (usedKeys.contains(key)) return false;
        usedKeys.add(key);
        return true;
    }
}`,
      hints: [
        'Xét idempotency key trước: nếu key đã nằm trong {{usedKeys}} thì trả {{DENY}}.',
        'Dùng {{getOrDefault("idempotencyKey", null)}} để lấy key từ input một cách an toàn.',
        'Dùng {{usedKeys.contains(key)}} trong {{recordKey}} để phát hiện key trùng và {{usedKeys.add(key)}} để ghi nhớ key mới.'
      ],
      explain: `Gate bảo vệ agent loop chạy **trước** khi thực thi tool: tool chỉ đọc và tool trong allowlist chạy ngay; tool có side effect chưa xác nhận thì WAIT để dừng vòng lặp và hỏi người dùng; tool đã có idempotency key thì DENY để không chạy lại yêu cầu đã xử lý.

Idempotency key khác tool_use_id: tool_use_id chỉ nhận diện một lần gọi model (có thể thay đổi khi retry), còn idempotency key là mã nghiệp vụ (mã đơn hàng, mã giao dịch) — gửi lại cùng key đảm bảo không tạo giao dịch trùng khi agent retry sau lỗi mạng. recordKey đánh dấu key đã dùng; gọi lại cùng key trả false để guard biết từ chối.

Lỗi hay gặp là xác nhận sau khi đã chạy (đã muộn), dùng tool_use_id làm idempotency key, và retry vô hạn lỗi logic (sai input, thiếu quyền). Chỉ retry lỗi tạm thời (mạng, quá tải).`,
    },
  ],
  check: [
    {
      q: 'Tool nào phải qua gate xác nhận trước khi chạy?',
      options: [
        'Tra đơn hàng (chỉ đọc)',
        'Xóa toàn bộ database (có side effect, không trong allowlist)',
        'Gửi thông báo lại cho chính khách hàng đã hỏi (có side effect nhưng trong allowlist)',
        'Tính tổng doanh thu (chỉ đọc)'
      ],
      answer: 1,
      explain: `Chỉ tool có side effect và **không** trong allowlist mới cần xác nhận trước khi chạy. Tra đơn và tính doanh thu là chỉ đọc, chạy ngay. Gửi thông báo lại khách hàng nằm trong allowlist nên chạy ngay, không chờ xác nhận.`,
    },
    {
      q: 'Idempotency key dùng để làm gì?',
      options: [
        'Nhận diện từng lần gọi model (giống tool_use_id)',
        'Đảm bảo cùng yêu cầu nghiệp vụ chỉ được thực hiện một lần ngay cả khi retry',
        'Mã hóa dữ liệu gửi sang server',
        'Giới hạn số bước của vòng lặp agent'
      ],
      answer: 1,
      explain: `Idempotency key là mã nghiệp vụ (mã đơn hàng, mã giao dịch). Server lưu key đã xử lý; yêu cầu cùng key lần nữa trả kết quả cũ, không thực hiện lại. Nó khác tool_use_id (chỉ nhận diện một lần gọi model) và không dùng để mã hóa hay giới hạn bước.`,
    },
    {
      q: 'Lỗi nào nên retry, lỗi nào không?',
      options: [
        'Retry mọi lỗi cho đến khi thành công',
        'Không bao giờ retry',
        'Retry lỗi tạm thời (mạng, quá tải), không retry lỗi input hay quyền',
        'Chỉ retry lỗi 400'
      ],
      answer: 2,
      explain: `Lỗi tạm thời (mạng, quá tải) có thể retry có ý nghĩa; lỗi input sai hoặc thiếu quyền thì retry cũng lỗi, nên báo người dùng thay vì retry vô hạn. Lỗi 400 (yêu cầu sai) không nên retry.`,
    },
  ],
  related: ['claude-026', 'claude-014'],
  tags: ['side effect', 'confirmation', 'idempotency', 'safety'],
},
{
  id: 'lesson-claude-008',
  track: 'claude',
  order: 8,
  title: 'MCP: mô hình host-client-server, tools/resources/prompts, transport stdio và streamable HTTP',
  level: 'senior',
  minutes: 40,
  goals: [
    'Phân biệt được ba vai trò trong MCP: host, client và server',
    'Hiểu ba nguyên ngữ: tool (hành động), resource (dữ liệu chỉ đọc) và prompt (mẫu câu), khi nào dùng cái nào',
    'So sánh transport stdio (process cục bộ) và streamable HTTP (server từ xa), biết trade-off của từng cái'
  ],
  body: `**Tóm tắt:** MCP (Model Context Protocol) là giao thức mở chuẩn hóa cách ứng dụng AI kết nối với công cụ và dữ liệu bên ngoài. Ba vai trò: host là ứng dụng người dùng dùng (ví dụ Claude Desktop hoặc trình chỉnh sửa mã), client là thư viện MCP nằm trong host giữ phiên làm việc với server, server là chương trình độc lập cung cấp khả năng. Ba nguyên ngữ: tool là hành động model có thể gọi, resource là dữ liệu chỉ đọc, prompt là mẫu câu tái dùng. Truyền tin qua stdio cho process cục bộ hoặc streamable HTTP cho server từ xa.

### Các khái niệm cơ bản

**MCP (Model Context Protocol):** giao thức mở (Anthropic công bố năm 2024) để các ứng dụng AI kết nối với dịch vụ bên ngoài theo một chuẩn duy nhất, thay vì mỗi dịch vụ phải viết adapter riêng cho từng model.

**Host:** ứng dụng cuối cùng mà người dùng sử dụng (trình desktop, trình chỉnh sửa mã, ứng dụng chăm sóc khách hàng). Một host có thể chứa nhiều client MCP.

**Client MCP:** thư viện nằm trong host, giữ một phiên làm việc 1-1 với một server MCP: gửi yêu cầu, nhận phản hồi, chuyển kết quả về cho model.

**Server MCP:** chương trình nhỏ, chạy độc lập, cung cấp khả năng cho model (tra đơn hàng, đọc file log, gửi email). Server có thể là process cục bộ hoặc dịch vụ chạy trên máy khác.

**JSON-RPC 2.0:** định dạng tin nhắn của MCP. Mỗi yêu cầu có một mã số, phản hồi mang cùng mã số để host biết yêu cầu nào được trả lời. Lỗi được mã hóa bằng số (ví dụ -32601 là phương thức không tìm thấy, -32603 là lỗi nội bộ).

### Ba nguyên ngữ: tools, resources, prompts

**Tool** là hàm có thể model gọi thông qua host (ví dụ {{orders_get_status}} tra đơn hàng, {{send_email}} gửi email). Tool có thể có side effect (thay đổi dữ liệu), nên host phải kiểm tra quyền trước khi chạy. Model chỉ đề nghị gọi và cung cấp input; host thực thi rồi gửi kết quả về.

**Resource** là dữ liệu chỉ đọc server làm cho sẵn (ví dụ file log, bảng giá), địa chỉ bởi URI ({{file:///var/log/app.log}} hoặc {{postgresql://db/customers}}). Model đọc resource để bổ ngữ cảnh, không sửa dữ liệu. Resource phù hợp với dữ liệu lớn, thay đổi ít, dùng lại nhiều lần.

**Prompt** là mẫu câu viết sẵn (ví dụ "tóm tắt cuộc khiếu nại" với tham số khách hàng). Host gợi ý prompt, người dùng chọn, model điền tham số. Prompt giúp kết quả ổn định hơn so với để model tự viết câu lệnh.

Quy tắc chọn: cần thực hiện hành động → tool; cần đọc dữ liệu làm ngữ cảnh → resource; cần mẫu câu tái dùng → prompt.

### Hai cách truyền tin: stdio và streamable HTTP

**Stdio (standard input/output):** host khởi động server như một process con, gửi yêu cầu vào stdin của server và đọc phản hồi từ stdout. Mỗi tin nhắn là một dòng. Ưu điểm: đơn giản, không cần mạng, thích hợp cho tool chạy cục bộ (tra file trên máy, gọi database cục bộ). Nhược điểm: mỗi server là một process riêng, khó mở rộng, không phù hợp khi server ở máy khác.

**Streamable HTTP:** server mở endpoint HTTP, client gọi qua HTTP (thường dùng streaming để nhận phản hồi liên tục). Ưu điểm: server có thể nằm ở đâu, nhiều client chia sẻ, dễ đặt sau cân bằng tải. Nhược điểm: cần bảo mật HTTP (mã thông báo, TLS), quản lý session và kết nối riêng.

Ví dụ: công ty có tool kiểm tra tồn kho chạy trên máy kho hàng → stdio. Cùng công ty có API tra cứu đơn hàng để nhiều chi nhánh gọi → streamable HTTP.

### Ví dụ đời thực

Trung tâm chăm sóc khách hàng muốn agent tra đơn hàng và gửi email xác nhận. Lập trình viên dựng hai server MCP: server {{orders}} (stdio, chạy cục bộ) cung cấp tool {{orders_get_status}} đọc cơ sở dữ liệu cục bộ, và server {{notify}} (streamable HTTP, chạy trên máy chủ trung tâm) cung cấp tool {{notify_send_email}}. Host (ứng dụng chăm sóc khách hàng) khởi động cả hai và khai báo tool vào model. Khách hỏi "Đơn ORD-42 giao chưa?" → model gọi {{orders_get_status}} → host chạy tool, nhận "đang giao", trả lời. Khách tiếp tục "Gửi email nhắc nhở" → model gọi {{notify_send_email}} → host gọi HTTP đến server notify. Số liệu: sau khi dùng MCP, thời gian tích hợp một tool mới giảm từ hai ngày xuống bốn giờ vì cả đội dùng chung chuẩn thay vì viết adapter riêng cho từng tool.

### Trả lời mẫu khi phỏng vấn

"MCP là giao thức chuẩn nối ứng dụng AI với công cụ và dữ liệu bên ngoài, do Anthropic công bố vào năm 2024. Trong mô hình này, host (ví dụ ứng dụng máy tính để bàn hoặc trình chỉnh sửa mã) chứa client MCP; client giữ phiên làm việc 1-1 với server MCP, chương trình độc lập cung cấp khả năng cho model. Ba loại khả năng: tool để model thực hiện hành động (có thể có side effect), resource để đọc dữ liệu chỉ đọc theo URI, và prompt là mẫu câu tái dùng giúp kết quả ổn định. Tin nhắn dùng JSON-RPC 2.0: mỗi yêu cầu kèm mã số, phản hồi mang cùng mã số để host biết yêu cầu nào được trả lời, lỗi được mã hóa bằng số. Giao tiếp qua stdio cho process cục bộ, hoặc streamable HTTP cho server từ xa dùng bởi nhiều client. Về bảo mật, host không cho model tự chạy tool: host kiểm tra quyền, quản lý khóa idempotency, và cho phép người dùng xác nhận trước khi thực thi hành động ghi dữ liệu."`,
  exercises: [
    {
      title: 'McpServer: đăng ký khả năng, đáp yêu cầu initialize/tools/list/tools/call',
      prompt: `Hoàn thiện McpServer mô phỏng một server MCP (các kiểu McpRequest, McpResponse, McpError, ToolHandler đã có sẵn, không cần sửa):

- registerTool(name, handler): đăng ký hàm xử lý cho một tool.
- registerResource(uri, nhan): đăng ký một tài nguyên chỉ đọc với URI.
- registerPrompt(name, nhan): đăng ký một mẫu câu.
- handle(request): trả về McpResponse mang cùng id của yêu cầu:
  + initialize → kết quả có protocolVersion, serverInfo (tên và phiên bản) và capabilities
  + tools/list → danh sách tên tool đã đăng ký
  + resources/list → danh sách URI tài nguyên
  + prompts/list → danh sách tên mẫu câu
  + tools/call → lấy tên tool và đối số từ params, gọi handler, trả kết quả; tool không tồn tại → lỗi mã -32601 "Tool không tồn tại"; handler ném RuntimeException → lỗi mã -32603 với thông điệp của exception; phương thức khác → lỗi mã -32601 "Phương thức không tìm thấy"
Mỗi phản hồi phải mang id trùng với yêu cầu, cho dù là lỗi. Server phải hoạt động liên tục: sau lỗi vẫn đáp yêu cầu tiếp theo.`,
      starter: `// ====== Có sẵn (không cần sửa) ======
record McpRequest(String method, Map<String, Object> params, String id) {}
record McpResponse(String id, Object result, McpError error) {}
record McpError(int code, String message) {}
interface ToolHandler { Object handle(Map<String, Object> input); }

// ====== Bài của bạn ======
class McpServer {
    private final String serverName;
    private final String serverVersion;
    private final Map<String, ToolHandler> tools = new HashMap<>();
    private final Map<String, String> resources = new HashMap<>();
    private final Map<String, String> prompts = new HashMap<>();

    McpServer(String name, String version) {
        this.serverName = name;
        this.serverVersion = version;
    }

    void registerTool(String name, ToolHandler handler) {
        throw new UnsupportedOperationException("TODO");
    }

    void registerResource(String uri, String label) {
        throw new UnsupportedOperationException("TODO");
    }

    void registerPrompt(String name, String label) {
        throw new UnsupportedOperationException("TODO");
    }

    McpResponse handle(McpRequest request) {
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
    static void ok(boolean cond) { if (!cond) throw new AssertionError("check failed"); }
    static Map<String, Object> in(String k, Object v) { Map<String, Object> m = new HashMap<>(); m.put(k, v); return m; }

    public static void main(String[] args) {
        check("initialize tra id trung va thong tin server", () -> {
            McpServer server = new McpServer("test-server", "1.0");
            McpResponse r = server.handle(new McpRequest("initialize", null, "req-1"));
            eq("req-1", r.id());
            ok(r.error() == null);
            Map<?, ?> result = (Map<?, ?>) r.result();
            eq("2025-06-18", result.get("protocolVersion"));
            Map<?, ?> info = (Map<?, ?>) result.get("serverInfo");
            eq("test-server", info.get("name"));
            eq("1.0", info.get("version"));
        });
        check("tools/list tra ten tool da dang ky", () -> {
            McpServer server = new McpServer("s", "1");
            server.registerTool("orders_get_status", in -> "x");
            server.registerTool("inventory_check_stock", in -> "x");
            McpResponse r = server.handle(new McpRequest("tools/list", null, "req-2"));
            ok(r.error() == null);
            List<?> names = (List<?>) r.result();
            eq(2, names.size());
            ok(names.contains("orders_get_status") && names.contains("inventory_check_stock"));
        });
        check("tools/call goi handler voi doi soa va tra ket qua", () -> {
            McpServer server = new McpServer("s", "1");
            server.registerTool("orders_get_status", input -> "SHIPPED for " + input.get("order_id"));
            Map<String, Object> params = new HashMap<>();
            params.put("name", "orders_get_status");
            params.put("arguments", Map.of("order_id", "ORD-42"));
            McpResponse r = server.handle(new McpRequest("tools/call", params, "req-3"));
            ok(r.error() == null);
            Map<?, ?> result = (Map<?, ?>) r.result();
            eq("SHIPPED for ORD-42", result.get("output"));
        });
        check("tool khong ton tai tra loi -32601 va giu id", () -> {
            McpServer server = new McpServer("s", "1");
            McpResponse r = server.handle(new McpRequest("tools/call", Map.of("name", "missing"), "req-4"));
            eq("req-4", r.id());
            McpError err = r.error();
            eq(-32601, err.code());
            ok(err.message().contains("khong ton tai"));
        });
        check("handler nem exception tra loi -32603 khong chua stack trace", () -> {
            McpServer server = new McpServer("s", "1");
            server.registerTool("broken", input -> { throw new IllegalStateException("db down after 5s"); });
            McpResponse r = server.handle(new McpRequest("tools/call", Map.of("name", "broken", "arguments", Map.of()), "req-5"));
            McpError err = r.error();
            eq(-32603, err.code());
            ok(err.message().contains("db down after 5s"));
            ok(!err.message().contains("StackTrace"));
        });
        check("phuong thuc khong xac dinh tra loi -32601", () -> {
            McpServer server = new McpServer("s", "1");
            McpResponse r = server.handle(new McpRequest("unknown_method", null, "req-6"));
            McpError err = r.error();
            eq(-32601, err.code());
            ok(err.message().contains("unknown_method"));
        });
        check("resources/list va prompts/list", () -> {
            McpServer server = new McpServer("s", "1");
            server.registerResource("file:///var/log/app.log", "nhat ky");
            server.registerPrompt("tom_tat_khieu_nai", "tom tat");
            McpResponse r1 = server.handle(new McpRequest("resources/list", null, "req-7"));
            McpResponse r2 = server.handle(new McpRequest("prompts/list", null, "req-8"));
            eq("req-7", r1.id()); eq("req-8", r2.id());
            List<?> uris = (List<?>) r1.result();
            List<?> names = (List<?>) r2.result();
            ok(uris.contains("file:///var/log/app.log"));
            ok(names.contains("tom_tat_khieu_nai"));
        });
        check("server van hoat dong sau loi", () -> {
            McpServer server = new McpServer("s", "1");
            McpResponse bad = server.handle(new McpRequest("x", null, "req-9"));
            ok(bad.error() != null);
            McpResponse good = server.handle(new McpRequest("initialize", null, "req-10"));
            eq("req-10", good.id()); ok(good.error() == null);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `// ====== Có sẵn (không cần sửa) ======
record McpRequest(String method, Map<String, Object> params, String id) {}
record McpResponse(String id, Object result, McpError error) {}
record McpError(int code, String message) {}
interface ToolHandler { Object handle(Map<String, Object> input); }

// ====== Lời giải ======
class McpServer {
    private final String serverName;
    private final String serverVersion;
    private final Map<String, ToolHandler> tools = new HashMap<>();
    private final Map<String, String> resources = new HashMap<>();
    private final Map<String, String> prompts = new HashMap<>();

    McpServer(String name, String version) {
        this.serverName = name;
        this.serverVersion = version;
    }

    void registerTool(String name, ToolHandler handler) {
        tools.put(name, handler);
    }

    void registerResource(String uri, String label) {
        resources.put(uri, label);
    }

    void registerPrompt(String name, String label) {
        prompts.put(name, label);
    }

    McpResponse handle(McpRequest request) {
        String id = request.id();
        switch (request.method()) {
            case "initialize":
                return new McpResponse(id, Map.of(
                    "protocolVersion", "2025-06-18",
                    "serverInfo", Map.of("name", serverName, "version", serverVersion),
                    "capabilities", Map.of("tools", Map.of(), "resources", Map.of(), "prompts", Map.of())
                ), null);
            case "tools/list":
                return new McpResponse(id, new ArrayList<>(tools.keySet()), null);
            case "resources/list":
                return new McpResponse(id, new ArrayList<>(resources.keySet()), null);
            case "prompts/list":
                return new McpResponse(id, new ArrayList<>(prompts.keySet()), null);
            case "tools/call": {
                Map<String, Object> p = request.params() == null ? Map.of() : request.params();
                String name = (String) p.get("name");
                ToolHandler handler = tools.get(name);
                if (handler == null) {
                    return new McpResponse(id, null, new McpError(-32601, "Tool khong ton tai: " + name));
                }
                try {
                    Object args = p.get("arguments");
                    Map<String, Object> input = args instanceof Map ? (Map<String, Object>) args : Map.of();
                    Object result = handler.handle(input);
                    return new McpResponse(id, Map.of("output", result), null);
                } catch (RuntimeException e) {
                    return new McpResponse(id, null, new McpError(-32603, "Loi thuc thi tool: " + e.getMessage()));
                }
            }
            default:
                return new McpResponse(id, null, new McpError(-32601, "Phuong thuc khong tim thay: " + request.method()));
        }
    }
}`,
      hints: [
        'Dung switch theo method cua request; tat ca nhanh phai tra McpResponse cung id voi yeu cau.',
        'Trong nhanh tools/call, lay ten tool tu params.get("name"), doi so tu params.get("arguments") neu la Map.',
        'Bat RuntimeException chung quanh handler.handle va tra McpError -32603 thong diep loi, de server khong sap.'
      ],
      explain: `McpServer lap trinh giao thuc MCP o muc yeu cau: id doi phap voi moi yeu cau (JSON-RPC 2.0), mot cach danh ung nhung cac method ho tro (initialize, tools/list, resources/list, prompts/list, tools/call), va ma loi cho tool khong ton tai (-32601) hoac loi thuc thi (-32603).

Loi hay gap: quench tra cung id khi loi (host khong biet yeu cau nao bi loi), bo qua ngoai le cua handler (làm server sap), va cho phep tool chay vinh vien sau khi gap loi (server phu luon hoat dong de nhan yeu cau tiep theo).`,
    },
  ],
  check: [
    {
      q: 'Trong MCP, host, client va server o vai tro nao?',
      options: [
        'Host chua client va noi voi nhieu server; client giu phien lam viec 1-1 voi mot server; server cung khang nang cho model',
        'Host chay tool, client dien gia tri vao template, server luu bo nho dem',
        'Client giao tiep thuan model, host dieu chinh trong luong, server chuan bi du lieu',
        'Ba vai tro giong nhau, deu co the thay the nhau'
      ],
      answer: 0,
      explain: 'Host la ung dung cuoi cung (vd desktop app, IDE) va co the chua nhieu client. Moi client MCP giu mot phien lam viec 1-1 voi mot server. Server cung cap tool, resource hoac prompt. Khong the doi thay vai tro vi moi tro tham gia khau truc khac nhau trong giao thuc.'
    },
    {
      q: 'Khi client yeu cau server doc mot resource, dinh dang nao chi duong dan den du lieu chi doc?',
      options: [
        'SQL query',
        'URI (vd file:///var/log/app.log, postgresql://db/customers)',
        'Duong dan tuyet doi tren o cung cua client',
        'Ma so tool_use_id'
      ],
      answer: 1,
      explain: 'Resource duoc dia chi bang URI. Model chi doc du lieu tu resource, khong sua. tool_use_id la ma cua tool goi, khong lien quan den resource.'
    },
    {
      q: 'Phan biet stdio va streamable HTTP trong MCP: khi nao nen chon stdio?',
      options: [
        'Luon chon stdio vi no nhanh hon HTTP',
        'Server co the o may khac va nhieu client chia se',
        'Tool chay cuc bo mot process, can don gian va khong mang',
        'Can ho tro nhieu thiet luong cao tai dong'
      ],
      answer: 2,
      explain: 'Stdio phu hop voi process cuc bo (mot server = mot process), cai dat don gian khong can mang. Streamable HTTP phu hop voi server xa nhieu client. Stdio khong tinh toan duoc "luon nhanh hon" va khong xay dung duoc nhieu thiet luong tai dong nhu HTTP.'
    },
  ],
  related: ['claude-001', 'claude-026'],
  tags: ['mcp', 'protocol', 'stdio', 'streamable-http'],
},
{
  id: 'lesson-claude-009',
  track: 'claude',
  order: 9,
  title: 'Thiết kế tool cho MCP: tên, mô tả, schema, lỗi có ích, idempotent',
  level: 'mid',
  minutes: 35,
  goals: [
    'Đặt tên tool theo domain-hành động và viết mô tả ràng buộc khi sử dụng',
    'Hiểu JSON Schema cơ bản (type, required, enum, additionalProperties) và ràng buộc đầu vào ở server',
    'Xây dựng lỗi trả về có ích, không lộ nội bộ, và biết idempotency key khác tool_use_id'
  ],
  body: `**Tóm tắt:** Tool tốt cho MCP phải đặt tên theo domain-hành động, có mô tả nói rõ khi sử dụng, khi không sử dụng, đầu vào lấy từ đâu và kết quả/lỗi như thế nào. Input schema phải ràng buộc (trường bắt buộc, kiểu, giá trị cho phép, từ chối trường lạ). Server phải validate đầu tiên, sau mỗi kiểm tra quyền và nghiệp vụ. Lỗi trả về model phải dễ hiểu, không lộ nội bộ. Mọi tool ghi dữ liệu phải idempotent: cùng khóa idempotency (mã nghiệp vụ) chỉ thực hiện một lần, ngay khi agent retry sau lỗi mạng.

### Tên tool: như đặt tên API cho từng nghiệp vụ mới

Model không đọc code Java ở server. Nó quyết định gọi tool nào dựa trên tên và mô tả bạn khai báo. Tên hay: {{orders_get_status}}, {{payments_refund}}, {{inventory_check_stock}}. Tên không hay: {{get_data}}, {{run_action}}, {{do_thing}}, {{run_sql}} — model không biết dùng khi nào, dễ gọi nhầm. Dùng chữ thường, dấu gạch dưới, viết domain trước rồi hành động. Nếu hai tool dễ nhầm (tra đơn hàng so với tra thanh toán), hãy đặt tên khác biệt rõ và ghi ranh giới trong mô tả ("không dùng để tra thanh toán").

### Mô tả tool: bốn câu trả lời

Mô tả tốt phải trả lời: (1) tool làm công việc gì, (2) sử dụng khi nào, (3) KHÔNG sử dụng khi nào, (4) đầu vào lấy từ đâu, kết quả và lỗi như thế nào. Mô tả đọc như hướng dẫn cho nhân viên mới, không chỉ ghi "Tra đơn hàng". Vì mô tả là phần model nhìn thấy, nó trực tiếp ảnh hưởng đến tỷ lệ gọi nhầm tool.

### Schema: hình dạng đầu vào

JSON Schema đơn giản: {{type}} (string, integer, boolean), {{required}} (trường bắt buộc), {{enum}} (tập giá trị cho phép), {{additionalProperties: false}} (từ chối trường không khai báo). Schema giúp model sinh đầu vào đúng hình dạng, nhưng schema KHÔNG thay thế kiểm tra ở server: schema có thể đảm bảo {{order_id}} là chuỗi, nhưng không chứng minh đơn tồn tại hay người dùng hiện tại được xem đơn đó.

Ví dụ định nghĩa tool:

~~~json
{
  "name": "orders_get_status",
  "description": "Tra trạng thái đơn ORD. Sử dụng khi khách hỏi đơn đang giao hoặc đã giao. Không dùng để tra thanh toán hay hoàn tiền. Trả trạng thái và ngày giao dự kiến; nếu không tìm thấy thì trả NOT_FOUND.",
  "input_schema": {
    "type": "object",
    "properties": {
      "order_id": { "type": "string", "description": "Mã đơn ORD-123, lấy từ khách hàng" },
      "view": { "type": "string", "enum": ["status", "delivery_date"] }
    },
    "required": ["order_id"],
    "additionalProperties": false
  }
}
~~~

### Ba lớp bảo vệ ở server

1. Schema: kiểm tra hình dạng (kiểu, trường bắt buộc, enum, trường lạ). Không ép kiểu và không "sửa" đầu vào sai.
2. Quyền: lấy người dùng từ security context đã xác thực. KHÔNG tin {{customer_id}} do model gửi. Kiểm tra người dùng được xem hoặc sửa đối tượng nào.
3. Nghiệp vụ: trạng thái đối tượng có cho phép hành động không (ví dụ đơn đã giao thì không thể hủy).

### Lỗi trả về model: có ích và an toàn

Khi tool thất bại, trả về lỗi có mã và thông điệp bằng ngôn ngữ thường ngày (ví dụ "Mã đơn không đúng định dạng ORD-XXX" hoặc "Bạn không có quyền xem đơn này"). KHÔNG trả stack trace, câu SQL, mã thông báo hoặc chi tiết nội bộ. Model chỉ cần đủ thông tin để quyết định bước tiếp (thử lại với đầu vào khác, gọi tool khác, hoặc xin lỗi khách hàng).

### Idempotent: cùng yêu cầu chỉ chạy một lần

Agent có thể retry tool sau lỗi mạng mà không biết lần trước đã thành công chưa. Khóa idempotency là mã nghiệp vụ (mã đơn hàng, mã chuyển khoản). Server lưu khóa đã xử lý; yêu cầu cùng khóa lần nữa trả kết quả cũ, không thực hiện lại. {{tool_use_id}} KHÔNG phải khóa idempotency: nó chỉ đánh dấu một lần gọi model, có thể thay đổi khi retry.

Ví dụ: chuyển tiền khóa {{TX-100}} → lưu khóa, trừ tiền, trả thành công. Lần gọi lại cùng khóa {{TX-100}} → trả kết quả cũ, không trừ lại.

### Ví dụ đời thực

Trung tâm chăm sóc khách hàng có 18 nhân viên dùng agent. Tỷ lệ gọi nhầm tool trạng thái đơn so với tool thanh toán là 11% trên 900 câu kiểm tra, vì hai mô tả đều ghi "Tra đơn hàng". Đổi tên thành {{orders_get_status}} và {{payments_get_summary}}, mô tả rõ ranh giới, thêm enum cho trường chọn, đặt {{additionalProperties: false}}. Backend Java validate kiểu, kiểm tra chủ sở hữu đơn qua người dùng đăng nhập rồi mới gọi service. Chạy lại 900 câu: tỷ lệ nhầm giảm còn 1,4%; không còn đầu vào sai schema nào đến service. Đây là phép đo chất lượng tool routing, không phải bằng chứng model luôn đúng.

### Trả lời mẫu khi phỏng vấn

"Tôi thiết kế tool như API nội bộ cho một ngành nghiệp vụ mới: tên theo domain-hành động, mô tả rõ khi sử dụng, khi không sử dụng, đầu vào lấy từ đâu và kết quả hoặc lỗi nào có thể nhận. JSON Schema mô tả object, trường bắt buộc, kiểu, enum và từ chối trường lạ. Schema chỉ kiểm tra hình dạng, nên Java vẫn phải validate cấu trúc, lấy người dùng từ security context, kiểm tra quyền và quy tắc nghiệp vụ trước khi gọi service. Lỗi trả về model có mã và thông điệp dễ hiểu, không lộ stack trace hay SQL. Mọi tool ghi dữ liệu dùng khóa idempotency lấy từ mã nghiệp vụ để retry sau lỗi mạng không tạo giao dịch trùng. tool_use_id chỉ đánh dấu lần gọi model, không thể thay khóa idempotency. Tôi có bộ kiểm tra trường hợp đúng, mô phỏng và thiếu đầu vào để đo tỷ lệ gọi nhầm tool."`,
  exercises: [
    {
      title: 'ToolRegistry: đăng ký, validate đầu vào, gọi tool và idempotency',
      prompt: `Hoàn thiện ToolRegistry để đăng ký, validate và chạy tool kiểu MCP:

1. register(def): đăng ký ToolDef (tên, mô tả, schema, hàm xử lý). Tên tool không được trùng.
2. call(name, input, idempotencyKey):
   - Tool không tồn tại → ToolResult(ok=false, errors=["Tool không tồn tại: ten"])
   - Đầu vào không khớp schema (thiếu trường bắt buộc, sai kiểu, giá trị ngoài enum, trường lạ khi additionalProperties=false) → errors liệt kê vấn đề
   - Nếu idempotencyKey khác null và đã dùng trước đó → trả ToolResult đã lưu, không chạy lại handler
   - Ngược lại chạy handler, lưu kết quả nếu có khóa; handler ném RuntimeException → errors=["Lỗi thực thi tool: ..."], không rò stack trace
3. validate(input, schema): kiểm tra required, type (string, integer là Integer hoặc Long, boolean; không ép kiểu), enum, additionalProperties. Thứ tự lỗi theo tên trường alphabet.`,
      starter: `// ====== Có sẵn (không cần sửa) ======
record Rule(String type, boolean required, Set<?> enumValues) {}
record SimpleSchema(Map<String, Rule> properties, boolean additionalProperties) {}
record ToolDef(String name, String description, SimpleSchema schema, Function<Map<String, Object>, Object> handler) {}
record ToolResult(boolean ok, Object result, List<String> errors) {}

// ====== Bài của bạn ======
class ToolRegistry {
    private final Map<String, ToolDef> tools = new HashMap<>();
    private final Set<String> usedKeys = new HashSet<>();
    private final Map<String, ToolResult> cached = new HashMap<>();

    void register(ToolDef def) {
        throw new UnsupportedOperationException("TODO");
    }

    ToolResult call(String name, Map<String, Object> input, String idempotencyKey) {
        throw new UnsupportedOperationException("TODO");
    }

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
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static void ok(boolean cond, String msg) { if (!cond) throw new AssertionError(msg); }
    static void ok(boolean cond) { if (!cond) throw new AssertionError("check failed"); }
    static Map<String, Object> in(String k, Object v) { Map<String, Object> m = new HashMap<>(); m.put(k, v); return m; }
    static SimpleSchema schema(boolean extra) {
        Map<String, Rule> p = new HashMap<>();
        p.put("order_id", new Rule("string", true, Set.of()));
        p.put("view", new Rule("string", false, Set.of("status", "delivery_date")));
        p.put("priority", new Rule("integer", false, Set.of()));
        return new SimpleSchema(p, extra);
    }

    public static void main(String[] args) {
        check("goi hop le tra ket qua cua handler", () -> {
            ToolRegistry reg = new ToolRegistry();
            reg.register(new ToolDef("orders_get_status", "x", schema(false), in -> "SHIPPED"));
            ToolResult r = reg.call("orders_get_status", in("order_id", "ORD-1"), null);
            eq(true, r.ok()); eq("SHIPPED", r.result()); ok(r.errors().isEmpty());
        });
        check("tool khong ton tai bao loi", () -> {
            ToolRegistry reg = new ToolRegistry();
            ToolResult r = reg.call("orders_get_status", Map.of(), null);
            eq(false, r.ok()); ok(r.errors().get(0).contains("Tool khong ton tai"));
        });
        check("thieu truong bat buoc", () -> {
            ToolRegistry reg = new ToolRegistry();
            reg.register(new ToolDef("orders_get_status", "x", schema(false), in -> "x"));
            ToolResult r = reg.call("orders_get_status", Map.of(), null);
            ok(r.errors().stream().anyMatch(e -> e.contains("order_id")), "thieu order_id chua bao: " + r.errors());
        });
        check("sai kieu khong duoc ep kieu", () -> {
            ToolRegistry reg = new ToolRegistry();
            reg.register(new ToolDef("t", "x", schema(false), in -> "x"));
            Map<String, Object> input = new HashMap<>(); input.put("order_id", 17);
            ToolResult r = reg.call("t", input, null);
            ok(r.errors().stream().anyMatch(e -> e.contains("order_id")), "sai kieu chap nhan: " + r.errors());
        });
        check("gia tri ngoai enum", () -> {
            ToolRegistry reg = new ToolRegistry();
            reg.register(new ToolDef("t", "x", schema(false), in -> "x"));
            Map<String, Object> input = new HashMap<>(); input.put("order_id", "ORD-1"); input.put("view", "refund");
            ToolResult r = reg.call("t", input, null);
            ok(r.errors().stream().anyMatch(e -> e.contains("view")), "enum chap nhan: " + r.errors());
        });
        check("additionalProperties false tu choi truong la", () -> {
            ToolRegistry reg = new ToolRegistry();
            reg.register(new ToolDef("t", "x", schema(false), in -> "x"));
            Map<String, Object> input = new HashMap<>(); input.put("order_id", "ORD-1"); input.put("trace", "t-1");
            ToolResult r = reg.call("t", input, null);
            ok(r.errors().stream().anyMatch(e -> e.contains("trace")), "truong la chap nhan: " + r.errors());
        });
        check("additionalProperties true cho phep truong la", () -> {
            ToolRegistry reg = new ToolRegistry();
            reg.register(new ToolDef("t", "x", schema(true), in -> "x"));
            Map<String, Object> input = new HashMap<>(); input.put("order_id", "ORD-1"); input.put("trace", "t-1");
            ToolResult r = reg.call("t", input, null);
            eq(true, r.ok()); ok(r.errors().isEmpty(), "truong duoc phep bi tu choi: " + r.errors());
        });
        check("khoa idempotency cung nhat chay handler mot lan", () -> {
            int[] calls = {0};
            ToolRegistry reg = new ToolRegistry();
            reg.register(new ToolDef("t", "x", schema(false), in -> { calls[0]++; return "done"; }));
            ToolResult r1 = reg.call("t", in("order_id", "ORD-1"), "TX-100");
            ToolResult r2 = reg.call("t", in("order_id", "ORD-1"), "TX-100");
            eq(true, r1.ok()); eq(true, r2.ok()); eq(1, calls[0]); eq(r1.result(), r2.result());
        });
        check("khoa khac nhau chay handler hai lan", () -> {
            int[] calls = {0};
            ToolRegistry reg = new ToolRegistry();
            reg.register(new ToolDef("t", "x", schema(false), in -> { calls[0]++; return "done"; }));
            reg.call("t", in("order_id", "ORD-1"), "TX-1");
            reg.call("t", in("order_id", "ORD-2"), "TX-2");
            eq(2, calls[0]);
        });
        check("handler nem exception tra loi an toan va server con hoat dong", () -> {
            ToolRegistry reg = new ToolRegistry();
            reg.register(new ToolDef("t", "x", schema(false), in -> { if ("ORD-1".equals(in.get("order_id"))) throw new IllegalStateException("db down"); return "done " + in.get("order_id"); }));
            ToolResult r = reg.call("t", in("order_id", "ORD-1"), null);
            eq(false, r.ok()); ok(r.errors().get(0).contains("Loi thuc thi tool"), "thong diep an toan: " + r.errors());
            ok(!r.errors().get(0).contains("StackTrace"), "lot stack trace: " + r.errors());
            ToolResult r2 = reg.call("t", in("order_id", "ORD-2"), null);
            eq(true, r2.ok()); eq("done ORD-2", r2.result());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `// ====== Có sẵn (không cần sửa) ======
record Rule(String type, boolean required, Set<?> enumValues) {}
record SimpleSchema(Map<String, Rule> properties, boolean additionalProperties) {}
record ToolDef(String name, String description, SimpleSchema schema, Function<Map<String, Object>, Object> handler) {}
record ToolResult(boolean ok, Object result, List<String> errors) {}

// ====== Lời giải ======
class ToolRegistry {
    private final Map<String, ToolDef> tools = new HashMap<>();
    private final Set<String> usedKeys = new HashSet<>();
    private final Map<String, ToolResult> cached = new HashMap<>();

    void register(ToolDef def) {
        if (tools.containsKey(def.name())) throw new IllegalArgumentException("Tool da dang ky: " + def.name());
        tools.put(def.name(), def);
    }

    ToolResult call(String name, Map<String, Object> input, String idempotencyKey) {
        ToolDef def = tools.get(name);
        if (def == null) return new ToolResult(false, null, List.of("Tool khong ton tai: " + name));
        Map<String, Object> safeInput = input == null ? Map.of() : input;
        List<String> errors = validate(safeInput, def.schema());
        if (!errors.isEmpty()) return new ToolResult(false, null, errors);
        if (idempotencyKey != null) {
            if (usedKeys.contains(idempotencyKey)) return cached.get(idempotencyKey);
            usedKeys.add(idempotencyKey);
        }
        try {
            Object result = def.handler().apply(safeInput);
            ToolResult out = new ToolResult(true, result, List.of());
            if (idempotencyKey != null) cached.put(idempotencyKey, out);
            return out;
        } catch (RuntimeException e) {
            return new ToolResult(false, null, List.of("Loi thuc thi tool: " + e.getMessage()));
        }
    }

    static List<String> validate(Map<String, Object> input, SimpleSchema schema) {
        List<String> errors = new ArrayList<>();
        if (input == null) {
            errors.add("Input must be an object");
            return errors;
        }
        for (String name : new TreeSet<>(schema.properties().keySet())) {
            Rule rule = schema.properties().get(name);
            if (rule.required() && !input.containsKey(name)) errors.add("Missing required property: " + name);
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
        'Dùng TreeSet duyệt tên trường theo thứ tự alphabet để thứ tự lỗi cố định.',
        'Kiểm tra required bằng containsKey: trường có giá trị null vẫn đã có mặt, được xem như có trường.',
        'Kiểm tra type trước enum để không so sánh giá trị sai kiểu với tập giá trị.'
      ],
      explain: `ToolRegistry thực hiện ba lớp bảo vệ: schema xác nhận hình dạng đầu vào, call bỏ qua tool không tồn tại và dữ liệu sai schema, handler chỉ được gọi sau khi dữ liệu hợp lệ. Khóa idempotency được lưu trước khi chạy handler: cùng khóa gọi lại trả kết quả cũ, không chạy lại xử lý nghiệp vụ.

Lỗi hay gặp: ép kiểu đầu vào sai (ví dụ số thành chuỗi), tin customer_id từ model thay vì security context, và để lỗi thực thi lộ stack trace ra model. tool_use_id không thể thay thế khóa idempotency vì nó chỉ đánh dấu một lần gọi model, có thể đổi khi retry.`,
    },
  ],
  check: [
    {
      q: 'Mô tả tốt của tool orders_get_status phải nói gì?',
      options: [
        "Chỉ ghi 'Tra đơn' để model tự suy luận",
        'Công việc tool làm, khi nào dùng, khi KHÔNG dùng, đầu vào lấy từ đâu, kết quả/lỗi ra sao',
        'Chứa toàn bộ code Java của service',
        'Không cần mô tả đầu vào vì schema đã có tên trường'
      ],
      answer: 1,
      explain: 'Tên và mô tả là thông tin chính model thấy về tool. Ranh giới, nguồn đầu vào và kết quả giúp phân biệt tool trạng thái đơn với tool thanh toán. Mô tả chung chung tăng mơ hồ; model không đọc code backend; tên trường trong schema một mình không giải thích nghiệp vụ.'
    },
    {
      q: 'Schema KHÔNG chứng minh được điều gì?',
      options: [
        'order_id là chuỗi',
        'Người dùng đang đăng nhập được xem đơn này',
        'Giá trị view nằm trong tập cho phép',
        'Không có trường lạ khi additionalProperties false'
      ],
      answer: 1,
      explain: 'Schema chỉ kiểm tra hình dạng. Quyền xem đơn lấy từ security context đã xác thực, không từ customer_id model gửi; schema không chứng minh đơn tồn tại, trạng thái có cho phép hành động hay người dùng có quyền.'
    },
    {
      q: 'tool_use_id và khóa idempotency khác nhau như thế nào?',
      options: [
        'Giống nhau, cùng đánh dấu một yêu cầu nghiệp vụ',
        'tool_use_id đánh dấu một lần gọi model; khóa idempotency là mã nghiệp vụ đảm bảo cùng yêu cầu chỉ chạy một lần',
        'Khóa idempotency mã hoá dữ liệu, tool_use_id giới hạn số bước',
        'Chỉ dùng tool_use_id ở server, khóa idempotency chỉ ở client'
      ],
      answer: 1,
      explain: 'tool_use_id đánh dấu một lần gọi model, có thể thay đổi khi retry. Khóa idempotency là mã nghiệp vụ (mã đơn, mã chuyển khoản); server lưu khóa đã xử lý, yêu cầu cùng khóa trả kết quả cũ, không tạo giao dịch trùng. Cả hai đều không mã hoá dữ liệu và không giới hạn số bước.'
    },
  ],
  related: ['claude-026', 'claude-001'],
  tags: ['mcp', 'tool design', 'json schema', 'idempotent'],
},
{
  id: 'lesson-claude-010',
  track: 'claude',
  order: 10,
  title: 'Claude Code cho team: CLAUDE.md, settings.json va permissions',
  level: 'mid',
  minutes: 30,
  goals: ['Phan biet 3 cap CLAUDE.md', 'Cau hinh settings.json theo cap', 'Thiet ke allow/deny theo pattern'],
  body: `**Tóm tắt:** Claude Code đọc CLAUDE.md ở ba cấp (user, project, local) và settings.json ở ba cấp tương ứng. Quyền tool được kiểm soát bằng danh sách allow/deny theo pattern. Mục tiêu là chia sẻ quy ước team ở cấp project, giữ bí mật ở cấp local, và khóa các lệnh nguy hiểm ở cấp user.

### CLAUDE.md: ba cấp và ai đọc

CLAUDE.md là file hướng dẫn cho agent. Ba cấp: User ~/.claude/CLAUDE.md áp dụng mọi repo; Project ./CLAUDE.md commit vào repo cả team đọc; Local ./.claude/CLAUDE.local.md không commit chứa thông tin cá nhân. Khi chạy, Claude Code gộp cả ba theo thứ tự user rồi project rồi local, cấp sau ghi đè cấp trước khi xung đột. Đặt quy ước code style, lệnh build/test ở project; đặt bí mật và ghi chú cá nhân ở local.

### settings.json: ba cấp tương ứng

~/.claude/settings.json (user); ./.claude/settings.json (project, commit); ./.claude/settings.local.json (local, không commit). Thuộc tính chính: permissions.allow, permissions.deny, hooks, env. Khi deny và allow cùng khớp một lệnh, deny thắng.

### Quyền tool: pattern allow/deny

Mỗi tool có tên (Bash, Read, Edit, Write). Với Bash có thể lọc theo lệnh: "Bash(git status)" cho phép chính xác; "Bash(git *)" cho phép mọi lệnh git; "Bash(rm -rf *)" bị deny.

Ví dụ settings an toàn:
~~~json
{
  "permissions": {
    "allow": ["Bash(git status)", "Bash(git diff *)", "Read", "Edit"],
    "deny": ["Bash(rm -rf *)", "Bash(curl * | bash)", "Bash(sudo *)"]
  }
}
~~~

### Nguyên tắc thiết kế

1. Mặc định deny các lệnh phá hủy và tải code từ mạng rồi chạy.
2. Cho phép đọc/ghi trong repo, deny ghi ngoài repo.
3. Đặt deny ở cấp user để bảo vệ mọi repo; đặt allow ở cấp project để team cùng dùng.
4. Kiểm tra bằng lệnh thật: chạy /permissions trong Claude Code để xem effective rules.

### Vi du doi thuc

Team 6 dev dùng Claude Code. Trước đây mỗi người tự cấu hình, có người cho phép "Bash(*)" và vô tình xóa thư mục build. Sau khi chuyển sang settings.json ở cấp project với allow git/npm/test và deny rm/sudo/curl-pipe-bash, số lần lệnh nguy hiểm bị chặn là 14 lần trong 2 tuần, không còn sự cố mất dữ liệu. Thời gian onboarding dev mới giảm từ 1 ngày xuống 30 phút vì CLAUDE.md đã có sẵn lệnh build/test.

### Tra loi mau khi phong vien

"Toi quan ly Claude Code cho team bang ba cap cau hinh. CLAUDE.md project commit chung, chua quy uoc code style, lenh build va test. CLAUDE.local.md khong commit, chua duong dan va tai khoan test ca nhan. settings.json project chua allow/deny cho tool va Bash theo pattern; deny thang allow khi trung. Toi deny rm -rf, sudo, curl pipe bash o cap user de bao ve moi repo, va allow git/npm/test o cap project de team cung dung. Moi dev co the mo rong allow o local nhung khong the bo deny o user. Toi kiem tra effective rules bang /permissions va co smoke test chay Claude Code headless trong CI."`,
  exercises: [
    {
      title: 'PermissionEvaluator: danh gia allow/deny theo pattern',
      prompt: `Hoan thien PermissionEvaluator danh gia mot lenh shell theo danh sach allow va deny. match(pattern, command): pattern co the la "Bash" khop moi lenh Bash; hoac "Bash(git status)" khop chinh xac; hoac "Bash(git *)" khop bat dau voi "git ". evaluate(command): tra ve "DENY" neu co bat ky deny pattern khop; "ALLOW" neu co allow pattern khop va khong deny; "ASK" neu khong khop gi. deny luon uu tien allow.`,
      starter: `class PermissionEvaluator {
    private final List<String> allow = new ArrayList<>();
    private final List<String> deny = new ArrayList<>();

    void addAllow(String pattern) { allow.add(pattern); }
    void addDeny(String pattern) { deny.add(pattern); }

    static boolean match(String pattern, String command) {
        throw new UnsupportedOperationException("TODO");
    }

    String evaluate(String command) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) { total++; try { r.run(); passed++; System.out.println("PASS " + name); } catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); } }
    static void eq(Object expected, Object actual) { if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual); }

    public static void main(String[] args) {
        check("allow chinh xac", () -> { PermissionEvaluator pe = new PermissionEvaluator(); pe.addAllow("Bash(git status)"); eq("ALLOW", pe.evaluate("git status")); });
        check("deny thang allow", () -> { PermissionEvaluator pe = new PermissionEvaluator(); pe.addAllow("Bash(git *)"); pe.addDeny("Bash(git push *)"); eq("DENY", pe.evaluate("git push origin main")); });
        check("wildcard cuoi", () -> { PermissionEvaluator pe = new PermissionEvaluator(); pe.addAllow("Bash(git *)"); eq("ALLOW", pe.evaluate("git diff --cached")); });
        check("khong khop tra ASK", () -> { PermissionEvaluator pe = new PermissionEvaluator(); pe.addAllow("Bash(git status)"); eq("ASK", pe.evaluate("npm test")); });
        check("Bash khong ngoac khop moi lenh", () -> { PermissionEvaluator pe = new PermissionEvaluator(); pe.addAllow("Bash"); eq("ALLOW", pe.evaluate("rm -rf /tmp/x")); pe.addDeny("Bash(rm *)"); eq("DENY", pe.evaluate("rm -rf /tmp/x")); });
        check("pattern khong khop lenh khac", () -> { PermissionEvaluator pe = new PermissionEvaluator(); pe.addAllow("Bash(git status)"); eq("ASK", pe.evaluate("git status --short")); });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class PermissionEvaluator {
    private final List<String> allow = new ArrayList<>();
    private final List<String> deny = new ArrayList<>();

    void addAllow(String pattern) { allow.add(pattern); }
    void addDeny(String pattern) { deny.add(pattern); }

    static boolean match(String pattern, String command) {
        String p = pattern.trim();
        if (p.equals("Bash")) return true;
        if (!p.startsWith("Bash(") || !p.endsWith(")")) return false;
        String inner = p.substring(5, p.length() - 1).trim();
        if (inner.endsWith("*")) {
            String prefix = inner.substring(0, inner.length() - 1).trim();
            return command.startsWith(prefix);
        }
        return command.equals(inner);
    }

    String evaluate(String command) {
        for (String d : deny) if (match(d, command)) return "DENY";
        for (String a : allow) if (match(a, command)) return "ALLOW";
        return "ASK";
    }
}`,
      hints: ['Xu ly deny truoc allow.', 'Wildcard "*" chi nam cuoi pattern.', 'Bash khong co ngoac la quyen rong cho moi lenh Bash.'],
      explain: `PermissionEvaluator mo phong logic danh gia quyen: deny uu tien, allow chi khi khong deny, con lai hoi nguoi dung. Pattern don gian ho tro khop chinh xac va wildcard cuoi. Loi hay gap la cho phep wildcard qua rong o dau pattern lam deny vo hieu, hoac quen deny thang allow.`
    }
  ],
  check: [
    { q: 'Khi deny va allow cung khop mot lenh, ket qua la gi?', options: ['ALLOW', 'DENY', 'ASK', 'Loi'], answer: 1, explain: 'deny luon thang allow. Day la nguyen tac an toan.' },
    { q: 'File nao khong nen commit vao repo?', options: ['CLAUDE.md', '.claude/settings.json', '.claude/CLAUDE.local.md', 'README.md'], answer: 2, explain: 'CLAUDE.local.md va settings.local.json chua thong tin ca nhan va khong commit.' },
    { q: 'Pattern nao cho phep moi lenh git?', options: ['Bash(git)', 'Bash(git *)', 'Bash(*git*)', 'Bash(git all)'], answer: 1, explain: 'Bash(git *) khop moi lenh bat dau bang "git ".' }
  ],
  related: ['claude-001', 'claude-002'],
  tags: ['claude code', 'permissions', 'settings', 'CLAUDE.md']
}
,
{
  id: 'lesson-claude-011',
  track: 'claude',
  order: 11,
  title: 'Hooks, slash command, subagents, skills va chay headless trong CI',
  level: 'senior',
  minutes: 35,
  goals: ['Biet cac hook PreToolUse/PostToolUse', 'Tao slash command va subagent', 'Chay Claude Code headless trong CI'],
  body: `**Tóm tắt:** Hooks cho phép chạy script trước/sau tool call để chặn hoặc ghi log. Slash command đóng gói tác vụ lặp lại. Subagent và skill mở rộng khả năng với ngữ cảnh riêng. Chạy headless trong CI giúp tự động hóa review/test mà vẫn kiểm soát quyền.

### Hooks: PreToolUse va PostToolUse

Hook là lệnh shell chạy khi một sự kiện xảy ra. Sự kiện phổ biến: PreToolUse trước khi tool chạy, có thể trả về quyết định block để ngăn tool. PostToolUse sau khi tool chạy, dùng để log, format code, chạy test.

Cấu hình trong settings.json:
~~~json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [{ "type": "command", "command": "node check-dangerous.js" }] }
    ],
    "PostToolUse": [
      { "matcher": "Edit", "hooks": [{ "type": "command", "command": "npm run lint" }] }
    ]
  }
}
~~~

Script hook đọc JSON từ stdin (tool name, input) và trả exit code 0 (cho phép) hoặc 2 (chặn, in lý do ra stderr).

### Chan lenh nguy hiem bang hook

Một hook PreToolUse cho Bash có thể kiểm tra lệnh có chứa rm -rf, sudo, curl ... | bash. Nếu có, exit 2 và in "Blocked: dangerous command". Đây là lớp bảo vệ thứ hai sau permissions, hữu ích khi pattern allow quá rộng.

### Slash command

Slash command là file markdown trong .claude/commands/ (project) hoặc ~/.claude/commands/ (user). Tên file thành tên lệnh: review.md → /review. Nội dung là prompt mẫu, có thể dùng $ARGUMENTS. Ví dụ /review đọc diff và trả nhận xét theo checklist.

### Subagent va skill

- Subagent: agent con với system prompt và tool riêng, được gọi qua Task tool. Phù hợp tác vụ lớn cần ngữ cảnh riêng (explore codebase, review).
- Skill: thư mục chứa SKILL.md mô tả khi nào dùng và tài nguyên kèm. Agent tự load khi task khớp. Giữ SKILL.md ngắn, tài nguyên chi tiết trong file riêng.

Nguyên tắc: subagent cho tác vụ có phạm vi rõ và trả kết quả tóm tắt; skill cho kiến thức tái sử dụng.

### Chay headless trong CI

Claude Code hỗ trợ chế độ không tương tác:
~~~bash
claude -p "Review PR diff va tra JSON" --output-format json
~~~
CI có thể gọi lệnh này với prompt từ file, thu output JSON và fail pipeline nếu kết quả không đạt. Cần đặt ANTHROPIC_API_KEY trong secret và giới hạn quyền bằng settings deny.

### Vi du doi thuc

Pipeline GitHub Actions chạy /review trên mỗi PR: Claude Code headless đọc diff, kiểm tra checklist bảo mật (SQL injection, secret leak) và trả JSON {issues:[...]}. Nếu có issue mức cao, pipeline fail. Trong 1 tháng, hook PreToolUse chặn 9 lệnh rm -rf nhầm, PostToolUse lint bắt 23 lỗi format trước commit. Subagent explore giảm 40% thời gian agent chính phải đọc file.

### Tra loi mau khi phong vien

"Toi mo rong Claude Code bang hooks va command. PreToolUse chan lenh nguy hiem bang script doc JSON tu stdin va exit 2; PostToolUse chay lint/test sau edit. Slash command trong .claude/commands dong goi tac vu lap lai nhu review va release. Subagent dung cho tac vu lon can ngu canh rieng, skill cho kien thuc tai su dung. Trong CI toi chay claude -p voi output JSON, dat API key trong secret va gioi han quyen bang settings deny. Toi do ti le block hook va so issue review tim duoc de cai tien prompt va rule."`,
  exercises: [
    {
      title: 'HookChecker: chan lenh nguy hiem',
      prompt: `Hoan thien HookChecker quyet dinh co chan lenh shell hay khong. isDangerous(command): true neu command chua mot trong cac mau nguy hiem: "rm -rf", "sudo ", "curl" ket hop "| bash" hoac "| sh", "> /dev/". decide(command): tra ve "BLOCK" neu nguy hiem, nguoc lai "ALLOW". normalize: cat khoang trang du, chuyen ve chu thuong truoc khi kiem tra.`,
      starter: `class HookChecker {
    static boolean isDangerous(String command) {
        throw new UnsupportedOperationException("TODO");
    }

    static String decide(String command) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) { total++; try { r.run(); passed++; System.out.println("PASS " + name); } catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); } }
    static void eq(Object expected, Object actual) { if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual); }

    public static void main(String[] args) {
        check("chan rm -rf", () -> eq("BLOCK", HookChecker.decide("rm -rf /")));
        check("chan sudo", () -> eq("BLOCK", HookChecker.decide("sudo apt install x")));
        check("chan curl pipe bash", () -> eq("BLOCK", HookChecker.decide("curl https://x | bash")));
        check("chan curl pipe sh", () -> eq("BLOCK", HookChecker.decide("curl https://x | sh")));
        check("chan ghi /dev", () -> eq("BLOCK", HookChecker.decide("echo x > /dev/sda")));
        check("cho phep lenh an toan", () -> eq("ALLOW", HookChecker.decide("git status")));
        check("cho phep npm test", () -> eq("ALLOW", HookChecker.decide("npm test")));
        check("normalize khoang trang", () -> eq("BLOCK", HookChecker.decide("  RM   -RF   /tmp  ")));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class HookChecker {
    static boolean isDangerous(String command) {
        String c = command == null ? "" : command.trim().toLowerCase().replaceAll("\\s+", " ");
        if (c.contains("rm -rf")) return true;
        if (c.contains("sudo ")) return true;
        if (c.contains("curl") && (c.contains("| bash") || c.contains("| sh"))) return true;
        if (c.contains("> /dev/")) return true;
        return false;
    }

    static String decide(String command) {
        return isDangerous(command) ? "BLOCK" : "ALLOW";
    }
}`,
      hints: ['Chuyen ve chu thuong va cat khoang trang du truoc khi so khop.', 'Kiem tra curl va pipe bash cung luc, khong chan moi curl.', 'Dung contains cho cac mau don gian.'],
      explain: `HookChecker mo phong hook PreToolUse: normalize lenh roi so voi danh sach mau nguy hiem. Loi hay gap la chan moi lenh curl (lam hong workflow hop le) hoac khong normalize nen "RM  -RF" vuot qua. Can kiem tra ket hop curl va pipe shell, khong chi curl.`
    }
  ],
  check: [
    { q: 'Hook PreToolUse co the lam gi khi phat hien lenh nguy hiem?', options: ['Chi ghi log', 'Tra exit code 2 de chan tool', 'Sua lenh tu dong', 'Bo qua'], answer: 1, explain: 'Exit code 2 bao Claude Code chan tool va hien ly do tu stderr.' },
    { q: 'Slash command duoc dinh nghia o dau?', options: ['~/.claude/settings.json', '.claude/commands/*.md', 'CLAUDE.md', 'hooks/'], answer: 1, explain: 'Moi file markdown trong .claude/commands/ tro thanh mot slash command.' },
    { q: 'Khi nao nen dung subagent thay vi skill?', options: ['Khi can kien thuc tai su dung', 'Khi tac vu lon can ngu canh rieng va tra ket qua tom tat', 'Khi muon chay nhanh hon', 'Khi khong co tool'], answer: 1, explain: 'Subagent phu hop tac vu lon, co pham vi ro, tra ket qua tom tat.' },
    { q: 'Chay Claude Code headless trong CI dung flag nao?', options: ['--daemon', '--interactive', '-p voi --output-format json', '--serve'], answer: 2, explain: 'Flag -p chay khong tuong tac va --output-format json tra ket qua co cau truc.' }
  ],
  related: ['claude-001', 'claude-002'],
  tags: ['claude code', 'hooks', 'slash command', 'subagent', 'skill', 'CI']
},
{
  id: 'lesson-claude-012',
  track: 'claude',
  order: 12,
  title: 'Đọc streaming SSE của Messages API: message_start, content_block_delta, message_delta, message_stop',
  level: 'senior',
  minutes: 40,
  goals: [
    'Mô tả được trật tự các event SSE của Messages API: message_start, content_block_start, content_block_delta, content_block_stop, message_delta, message_stop',
    'Ghép lại {{text_delta}} từ nhiều event và {{input_json_delta}} cho {{tool_use}} bị cắt thành nhiều mảnh',
    'Xử lý đúng {{stop_reason}} trong event {{message_delta}} (end_turn, max_tokens, tool_use, stop_sequence, pause_turn, refusal)',
    'Bỏ qua dòng ping (event: ping, data: {}) và dòng comment (bắt đầu bằng : )'
  ],
body: `**Tóm tắt:** Messages API của Anthropic hỗ trợ streaming qua Server-Sent Events (SSE). Server gửi một chuỗi các event theo thứ tự: {{message_start}} (chứa message id và role), các cặp {{content_block_start}}/{{content_block_delta}}/{{content_block_stop}} cho từng block (text hoặc tool_use), sau đó {{message_delta}} (chứa stop_reason và usage), cuối cùng {{message_stop}}. Client phải ghép text_delta để dựng câu trả lời, ghép input_json_delta cho tool_use (JSON có thể bị cắt giữa chừng), đọc stop_reason để biết khi nào dừng, và bỏ qua event ping/comment.
  
### Tổng quan SSE (Server-Sent Events)
SSE là kỹ thuật server đẩy dữ liệu lên client qua một kết nối HTTP keep-alive. Mỗi event có dạng:
~~~text
event: message_start
data: {{"type":"message_start","message":{"id":"msg_01","type":"message","role":"assistant",...}}}

event: content_block_start
data: {{"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}}

event: content_block_delta
data: {{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Xin"}}}

event: content_block_delta
data: {{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" chào"}}}
~~~
Client đọc theo dòng: dòng {{event:}} cho tên event, dòng {{data:}} cho JSON payload. Dòng trống kết thúc một event. Dòng bắt đầu bằng dấu hai chấm (:) là comment (bỏ qua). Event {{ping}} (data: object rỗng) dùng để giữ kết nối sống.

Hai khái niệm cần nắm trước khi đọc code: **token** là mảnh nhỏ của văn bản (tiếng Anh khoảng 3–4 ký tự/token, tiếng Việt thường 1–2 chữ/token); model sinh token theo thứ tự và server gom vài token thành một event. **Delta** nghĩa là "phần tăng thêm": mỗi {{content_block_delta}} chỉ chở phần chữ hoặc JSON mới, không chở toàn bộ. Vì vậy muốn có câu trả lời đầy đủ, client phải **nối dồn** các delta lại — nối sai thứ tự hoặc bỏ sót một delta là mất chữ.
  
### Trật tự các event quan trọng
  
1. **message_start** — duy nhất, đầu tiên. Chứa {{id}}, {{type}}, {{role}}, {{model}}, {{usage}} (input tokens), {{content}} rỗng.
2. **content_block_start** — báo bắt đầu một block trong content. Có {{index}} (0-based) và {{content_block}} (type: text hoặc tool_use; nếu tool_use có id, name, input rỗng).
3. **content_block_delta** — payload tăng dần cho block {{index}}.
   - Với text: {"type":"text_delta","text":"..."} — nối chuỗi này vào text đang dựng.
   - Với tool_use: {"type":"input_json_delta","partial_json":"..."} — nối partial_json vào chuỗi JSON đang dựng cho tool_use đó. JSON có thể bị cắt giữa chừng (ví dụ {"city":"Han rồi tiếp oi}), chỉ parse khi content_block_stop.
4. **content_block_stop** — kết thúc block {{index}}. Lúc này block đã hoàn chỉnh (text đầy đủ, hoặc tool_use có input JSON hoàn chỉnh parse được).
5. **message_delta** — chứa {{stop_reason}} (end_turn, max_tokens, tool_use, stop_sequence, pause_turn, refusal) và {{usage}} (output_tokens). Nếu stop_reason là max_tokens, câu trả lời bị cắt giữa chừng; KHÔNG coi là end_turn.
6. **message_stop** — kết thúc stream. Không có data quan trọng.
  
### Ví dụ luồng hoàn chỉnh (text đơn giản)
~~~text
event: message_start
data: {"type":"message_start","message":{"id":"msg_01","type":"message","role":"assistant","model":"claude-3-5-sonnet-20241022","content":[],"stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":10,"output_tokens":0}}}

event: content_block_start
data: {{"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}}

event: content_block_delta
data: {{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Xin chào"}}}

event: content_block_stop
data: {{"type":"content_block_stop","index":0}}

event: message_delta
data: {{"type":"message_delta","delta":{"stop_reason":"end_turn","stop_sequence":null},"usage":{"output_tokens":5}}}

event: message_stop
data: {{"type":"message_stop"}}
~~~
  
### Ví dụ tool_use (JSON bị cắt nhiều mảnh)
~~~text
event: content_block_start
data: {{"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"toolu_01","name":"get_weather","input":{}}}}

event: content_block_delta
data: {{"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\\"cit"}}}

event: content_block_delta
data: {{"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"y\\":\\"Han"}}}

event: content_block_delta
data: {{"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"oi\\"}"}}}

event: content_block_stop
data: {{"type":"content_block_stop","index":1}}
~~~
Client nối partial_json thành {{"city":"Hanoi"}} rồi parse JSON một lần tại content_block_stop.
  
### Pitfall trên production
- **Không parse JSON tại mỗi delta**: partial_json thường **không** là JSON hợp lệ (thiếu ngoặc, chuỗi chưa đóng). Chỉ parse khi content_block_stop.
- **Quên bỏ qua ping/comment**: dòng {{:}} và event {{ping}} làm vỡ parser nếu không lọc.
- **Coi max_tokens như end_turn**: output bị cắt, cần báo cho người dùng "câu trả lời chưa đầy đủ" hoặc tự động yêu cầu tiếp tục.
- **Không xử lý index không theo thứ tự**: API đảm bảo index tăng dần, nhưng code phòng vệ nên dùng map theo index thay vì list.
- **Quên đọc usage trong message_delta**: output_tokens chỉ có ở message_delta, dùng để tính chi phí.
   
### Ví dụ đời thực
Một chatbot nội bộ trả lời câu hỏi về đơn hàng. Khi bật streaming, time-to-first-token giảm từ 18 giây (non-streaming) xuống 0,6 giây; tổng thời gian sinh 420 token khoảng 7 giây, nhưng người dùng thấy chữ chạy ngay nên không bấm F5. Khi chuyển sang dùng {{tool_use}} để tra {{get_order}}, có lần đặt {{max_tokens}} = 64 cho tiết kiệm. Model viết được {{tool_use}} nhưng JSON {{input}} bị cắt sau {{order_id}} = ORD-5432, còn thiếu {{quantity}}. Client non-streaming parse ra object thiếu field và tạo yêu cầu với quantity = 0; client streaming đọc {{stop_reason}} = max_tokens nên biết output bị cắt, không chạy tool, tăng {{max_tokens}} lên 512 và gọi lại. Kết quả: đơn hàng đúng, không phát sinh đơn rác. Bài học: luôn đọc {{stop_reason}} trước khi tin vào JSON của {{tool_use}}.
   
### Trả lời mẫu khi phỏng vấn
"Messages API streaming dùng SSE. Event theo thứ tự: message_start, rồi lặp content_block_start/delta/stop cho từng block (text hoặc tool_use), sau đó message_delta có stop_reason và usage, cuối message_stop. Với text tôi nối text_delta; với tool_use tôi nối input_json_delta rồi parse JSON khi content_block_stop vì delta có thể cắt giữa chuỗi. Tôi bỏ qua event ping và dòng comment. stop_reason max_tokens khác end_turn: output bị cắt, không báo thành công. Tôi test bằng cách mô phỏng chuỗi event giả lập để kiểm tra ghép text, ghép JSON tool_use, đọc stop_reason, và bỏ qua ping."
  
### Liên hệ phỏng vấn
Interviewer hay hỏi: "SSE khác WebSocket thế nào?" (SSE đơn chiều server→client, HTTP thuần, tự reconnect; WebSocket hai chiều, protocol riêng), "tool_use input_json_delta parse khi nào?" (khi content_block_stop), "max_tokens và end_turn khác nhau chỗ nào?" (max_tokens = bị cắt, cần tiếp tục).`,
  exercises: [
    {
      title: 'SseAccumulator: ghép event SSE thành message hoàn chỉnh',
      prompt: `Các kiểu Event, Message, ContentBlock, ToolUseBlock, TextBlock, Usage, AccumulatorResult mô phỏng dữ liệu SSE đã parse (không cần sửa). Hãy viết class SseAccumulator:
 
1. feed(event): nhận một Event (đã parse từ dòng event:/data:). Bỏ qua event.type === "ping" và event.type === "comment".
2. Xử lý theo event.type:
   - "message_start": khởi tạo message mới, lưu id, role, usage.input_tokens.
   - "content_block_start": tạo block mới theo index (text rỗng hoặc tool_use với id, name, input_json rỗng).
   - "content_block_delta":
     * text_delta: nối delta.text vào block.text.
     * input_json_delta: nối delta.partial_json vào block.inputJsonBuffer.
   - "content_block_stop": nếu block là tool_use, parse block.inputJsonBuffer thành JSON object gán vào block.input, xoá buffer.
   - "message_delta": lưu stop_reason và usage.output_tokens.
   - "message_stop": hoàn tất, trả về AccumulatorResult(message, true). Các event khác trả AccumulatorResult(null, false).
3. getResult(): trả về AccumulatorResult hiện tại (message đã dựng được cho đến lúc đó, done=false nếu chưa message_stop).
 
Input JSON của tool_use có thể bị cắt giữa chừng qua nhiều delta; chỉ parse KHI content_block_stop.
 
Khi feed gây lỗi parse JSON (sai cú pháp), ném IllegalStateException kèm index block và nội dung buffer.`,
      starter: `// ====== Có sẵn (không cần sửa) ======
record Event(String type, int index, Map<String, Object> data) {}
record Message(String id, String role, List<ContentBlock> content, String stopReason, Usage usage) {}
sealed interface ContentBlock permits TextBlock, ToolUseBlock {}
record TextBlock(String text) implements ContentBlock {}
record ToolUseBlock(String id, String name, Map<String, Object> input) implements ContentBlock {}
record Usage(int inputTokens, int outputTokens) {}
record AccumulatorResult(Message message, boolean done) {}
 
// ====== Bài của bạn ======
class SseAccumulator {
    private String id;
    private String role;
    private String stopReason;
    private Usage usage;
    private final Map<Integer, BlockBuilder> blocks = new LinkedHashMap<>();
    private boolean finished = false;

    // Chỉ gọi khi content_block_stop: các mảnh partial_json đã ghép thành JSON hoàn chỉnh.
    // Trả về Map<String, Object>; ném IllegalStateException nếu sai cú pháp.
    private static Map<String, Object> parseJson(String json) {
        throw new UnsupportedOperationException("TODO");
    }

    AccumulatorResult feed(Event event) {
        throw new UnsupportedOperationException("TODO");
    }

    AccumulatorResult getResult() {
        throw new UnsupportedOperationException("TODO");
    }

    // Một block đang được ghép: text, hoặc tool_use với json là buffer partial_json.
    private static class BlockBuilder {
        String type;
        String text = "";
        String id;
        String name;
        String json = "";
        Map<String, Object> input = Map.of();
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
    static Event ev(String type) { return new Event(type, -1, Map.of()); }
    static Event ev(String type, int index, Map<String, Object> data) { return new Event(type, index, data); }
    static Map<String, Object> d(String k, Object v) { Map<String, Object> m = new HashMap<>(); m.put(k, v); return m; }
    static Map<String, Object> d2(String k1, Object v1, String k2, Object v2) { Map<String, Object> m = new HashMap<>(); m.put(k1, v1); m.put(k2, v2); return m; }
    static Map<String, Object> d3(String k1, Object v1, String k2, Object v2, String k3, Object v3) { Map<String, Object> m = new HashMap<>(); m.put(k1, v1); m.put(k2, v2); m.put(k3, v3); return m; }
    static Map<String, Object> textBlock() { return d2("type", "text", "text", ""); }

    public static void main(String[] args) {
        check("ghép text từ nhiều text_delta", () -> {
            SseAccumulator acc = new SseAccumulator();
            acc.feed(ev("message_start", -1, d3("id", "msg_1", "role", "assistant", "usage", d("input_tokens", 10))));
            acc.feed(ev("content_block_start", 0, d2("content_block", textBlock(), "index", 0)));
            acc.feed(ev("content_block_delta", 0, d("delta", d2("type", "text_delta", "text", "Xin"))));
            acc.feed(ev("content_block_delta", 0, d("delta", d2("type", "text_delta", "text", " chào"))));
            acc.feed(ev("content_block_stop", 0, Map.of()));
            acc.feed(ev("message_delta", -1, d2("delta", d2("stop_reason", "end_turn", "stop_sequence", null), "usage", d("output_tokens", 5))));
            AccumulatorResult r = acc.feed(ev("message_stop", -1, Map.of()));
            eq(true, r.done());
            eq("Xin chào", ((TextBlock) r.message().content().get(0)).text());
            eq("end_turn", r.message().stopReason());
            eq(5, r.message().usage().outputTokens());
            eq(10, r.message().usage().inputTokens());
        });

        check("ghép tool_use JSON từ nhiều input_json_delta", () -> {
            SseAccumulator acc = new SseAccumulator();
            acc.feed(ev("message_start", -1, d3("id", "msg_2", "role", "assistant", "usage", d("input_tokens", 12))));
            acc.feed(ev("content_block_start", 0, d2("content_block", d3("type", "tool_use", "id", "toolu_01", "name", "get_weather"), "index", 0)));
            acc.feed(ev("content_block_delta", 0, d("delta", d2("type", "input_json_delta", "partial_json", "{\\"cit"))));
            acc.feed(ev("content_block_delta", 0, d("delta", d2("type", "input_json_delta", "partial_json", "y\\":\\"Han"))));
            acc.feed(ev("content_block_delta", 0, d("delta", d2("type", "input_json_delta", "partial_json", "oi\\"}"))));
            acc.feed(ev("content_block_stop", 0, Map.of()));
            acc.feed(ev("message_delta", -1, d2("delta", d2("stop_reason", "tool_use", "stop_sequence", null), "usage", d("output_tokens", 8))));
            AccumulatorResult r = acc.feed(ev("message_stop", -1, Map.of()));
            eq(true, r.done());
            ToolUseBlock tb = (ToolUseBlock) r.message().content().get(0);
            eq("toolu_01", tb.id());
            eq("get_weather", tb.name());
            eq("Hanoi", tb.input().get("city"));
            eq("tool_use", r.message().stopReason());
        });

        check("stop_reason max_tokens khác end_turn", () -> {
            SseAccumulator acc = new SseAccumulator();
            acc.feed(ev("message_start", -1, d3("id", "msg_3", "role", "assistant", "usage", d("input_tokens", 5))));
            acc.feed(ev("content_block_start", 0, d2("content_block", textBlock(), "index", 0)));
            acc.feed(ev("content_block_delta", 0, d("delta", d2("type", "text_delta", "text", "Đang viết"))));
            acc.feed(ev("content_block_stop", 0, Map.of()));
            acc.feed(ev("message_delta", -1, d2("delta", d2("stop_reason", "max_tokens", "stop_sequence", null), "usage", d("output_tokens", 100))));
            AccumulatorResult r = acc.feed(ev("message_stop", -1, Map.of()));
            eq("max_tokens", r.message().stopReason());
            ok(!"end_turn".equals(r.message().stopReason()), "max_tokens không được coi là end_turn");
        });

        check("bỏ qua ping và comment", () -> {
            SseAccumulator acc = new SseAccumulator();
            acc.feed(ev("message_start", -1, d3("id", "msg_4", "role", "assistant", "usage", d("input_tokens", 5))));
            acc.feed(ev("ping", -1, Map.of()));
            acc.feed(ev("comment", -1, d("text", "keep-alive")));
            acc.feed(ev("content_block_start", 0, d2("content_block", textBlock(), "index", 0)));
            acc.feed(ev("content_block_delta", 0, d("delta", d2("type", "text_delta", "text", "OK"))));
            acc.feed(ev("content_block_stop", 0, Map.of()));
            acc.feed(ev("message_delta", -1, d2("delta", d2("stop_reason", "end_turn", "stop_sequence", null), "usage", d("output_tokens", 2))));
            AccumulatorResult r = acc.feed(ev("message_stop", -1, Map.of()));
            eq(true, r.done());
            eq("OK", ((TextBlock) r.message().content().get(0)).text());
        });

        check("lỗi parse JSON khi content_block_stop ném IllegalStateException", () -> {
            SseAccumulator acc = new SseAccumulator();
            acc.feed(ev("message_start", -1, d3("id", "msg_5", "role", "assistant", "usage", d("input_tokens", 5))));
            acc.feed(ev("content_block_start", 0, d2("content_block", d3("type", "tool_use", "id", "toolu_01", "name", "t"), "index", 0)));
            acc.feed(ev("content_block_delta", 0, d("delta", d2("type", "input_json_delta", "partial_json", "{ invalid json"))));
            try {
                acc.feed(ev("content_block_stop", 0, Map.of()));
                throw new AssertionError("phải ném IllegalStateException");
            } catch (IllegalStateException e) {
                ok(e.getMessage().contains("index 0"), "thông báo phải chứa index: " + e.getMessage());
            }
        });

        check("getResult trả message đang dựng, done=false khi chưa message_stop", () -> {
            SseAccumulator acc = new SseAccumulator();
            acc.feed(ev("message_start", -1, d3("id", "msg_6", "role", "assistant", "usage", d("input_tokens", 3))));
            acc.feed(ev("content_block_start", 0, d2("content_block", textBlock(), "index", 0)));
            acc.feed(ev("content_block_delta", 0, d("delta", d2("type", "text_delta", "text", "Đang"))));
            AccumulatorResult r = acc.getResult();
            eq(false, r.done());
            eq("Đang", ((TextBlock) r.message().content().get(0)).text());
        });

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `// ====== Có sẵn (không cần sửa) ======
record Event(String type, int index, Map<String, Object> data) {}
record Message(String id, String role, List<ContentBlock> content, String stopReason, Usage usage) {}
sealed interface ContentBlock permits TextBlock, ToolUseBlock {}
record TextBlock(String text) implements ContentBlock {}
record ToolUseBlock(String id, String name, Map<String, Object> input) implements ContentBlock {}
record Usage(int inputTokens, int outputTokens) {}
record AccumulatorResult(Message message, boolean done) {}

// ====== Lời giải ======
class SseAccumulator {
    private String id;
    private String role;
    private String stopReason;
    private Usage usage;
    private final Map<Integer, BlockBuilder> blocks = new LinkedHashMap<>();
    private boolean finished = false;

    // Parser JSON nhỏ; chỉ gọi khi content_block_stop (các mảnh partial_json đã ghép xong)
    private static Map<String, Object> parseJson(String json) {
        int[] i = {0};
        skipWs(json, i);
        Object v = parseValue(json, i);
        skipWs(json, i);
        if (i[0] != json.length()) throw new IllegalStateException("Thừa ký tự ở cuối JSON");
        if (!(v instanceof Map)) throw new IllegalStateException("JSON phải là object");
        return (Map<String, Object>) v;
    }

    private static Object parseValue(String s, int[] i) {
        skipWs(s, i);
        if (i[0] >= s.length()) throw new IllegalStateException("JSON kết thúc bất chợt");
        char c = s.charAt(i[0]);
        if (c == '{') return parseObject(s, i);
        if (c == '[') return parseArray(s, i);
        if (c == '"') return parseString(s, i);
        if (c == 't' || c == 'f') return parseBoolean(s, i);
        if (c == 'n') return parseNull(s, i);
        if (c == '-' || (c >= '0' && c <= '9')) return parseNumber(s, i);
        throw new IllegalStateException("Ký tự không mong đợi: " + c + " tại " + i[0]);
    }

    private static Map<String, Object> parseObject(String s, int[] i) {
        Map<String, Object> map = new LinkedHashMap<>();
        i[0]++;
        skipWs(s, i);
        if (i[0] < s.length() && s.charAt(i[0]) == '}') { i[0]++; return map; }
        while (true) {
            skipWs(s, i);
            if (i[0] >= s.length() || s.charAt(i[0]) != '"') throw new IllegalStateException("Key phải là string");
            String key = parseString(s, i);
            skipWs(s, i);
            if (i[0] >= s.length() || s.charAt(i[0]) != ':') throw new IllegalStateException("Thiếu ':' sau key " + key);
            i[0]++;
            map.put(key, parseValue(s, i));
            skipWs(s, i);
            if (i[0] >= s.length()) throw new IllegalStateException("Object chưa đóng");
            char c = s.charAt(i[0]++);
            if (c == '}') break;
            if (c != ',') throw new IllegalStateException("Ký tự lạ trong object: " + c);
        }
        return map;
    }

    private static List<Object> parseArray(String s, int[] i) {
        List<Object> list = new ArrayList<>();
        i[0]++;
        skipWs(s, i);
        if (i[0] < s.length() && s.charAt(i[0]) == ']') { i[0]++; return list; }
        while (true) {
            list.add(parseValue(s, i));
            skipWs(s, i);
            if (i[0] >= s.length()) throw new IllegalStateException("Array chưa đóng");
            char c = s.charAt(i[0]++);
            if (c == ']') break;
            if (c != ',') throw new IllegalStateException("Ký tự lạ trong array: " + c);
        }
        return list;
    }

    private static String parseString(String s, int[] i) {
        i[0]++;
        StringBuilder sb = new StringBuilder();
        while (i[0] < s.length()) {
            char c = s.charAt(i[0]++);
            if (c == '"') return sb.toString();
            if (c == 92) {                       // ký tự backslash, viết bằng số để tránh escape
                char e = s.charAt(i[0]++);
                if (e == '"' || e == 92 || e == '/') sb.append(e);
                else if (e == 'b') sb.append((char) 8);
                else if (e == 'f') sb.append((char) 12);
                else if (e == 'n') sb.append((char) 10);
                else if (e == 'r') sb.append((char) 13);
                else if (e == 't') sb.append((char) 9);
                else throw new IllegalStateException("Escape không hợp lệ: " + e);
            } else sb.append(c);
        }
        throw new IllegalStateException("String không đóng");
    }

    private static Boolean parseBoolean(String s, int[] i) {
        if (s.startsWith("true", i[0])) { i[0] += 4; return true; }
        if (s.startsWith("false", i[0])) { i[0] += 5; return false; }
        throw new IllegalStateException("Boolean không hợp lệ tại " + i[0]);
    }

    private static Object parseNull(String s, int[] i) {
        if (s.startsWith("null", i[0])) { i[0] += 4; return null; }
        throw new IllegalStateException("null không hợp lệ tại " + i[0]);
    }

    private static Number parseNumber(String s, int[] i) {
        int start = i[0];
        while (i[0] < s.length()) {
            char c = s.charAt(i[0]);
            if ((c >= '0' && c <= '9') || c == '-' || c == '+' || c == '.' || c == 'e' || c == 'E') i[0]++;
            else break;
        }
        String num = s.substring(start, i[0]);
        try {
            if (num.contains(".") || num.toLowerCase().contains("e")) return Double.parseDouble(num);
            long l = Long.parseLong(num);
            return (l >= Integer.MIN_VALUE && l <= Integer.MAX_VALUE) ? (int) l : l;
        } catch (NumberFormatException ex) {
            throw new IllegalStateException("Số không hợp lệ: " + num);
        }
    }

    private static void skipWs(String s, int[] i) {
        while (i[0] < s.length() && Character.isWhitespace(s.charAt(i[0]))) i[0]++;
    }

    AccumulatorResult feed(Event event) {
        if (finished) return new AccumulatorResult(null, false);
        String type = event.type();
        if ("ping".equals(type) || "comment".equals(type)) return new AccumulatorResult(null, false);
        switch (type) {
            case "message_start" -> {
                id = (String) event.data().get("id");
                role = (String) event.data().get("role");
                Map<String, Object> u = (Map<String, Object>) event.data().get("usage");
                usage = new Usage(u == null ? 0 : ((Number) u.get("input_tokens")).intValue(), 0);
            }
            case "content_block_start" -> {
                BlockBuilder b = new BlockBuilder();
                Map<String, Object> cb = (Map<String, Object>) event.data().get("content_block");
                b.type = (String) cb.get("type");
                if ("tool_use".equals(b.type)) {
                    b.id = (String) cb.get("id");
                    b.name = (String) cb.get("name");
                }
                blocks.put(event.index(), b);
            }
            case "content_block_delta" -> {
                BlockBuilder b = blocks.get(event.index());
                if (b == null) return new AccumulatorResult(null, false);
                Map<String, Object> delta = (Map<String, Object>) event.data().get("delta");
                String dt = (String) delta.get("type");
                if ("text_delta".equals(dt)) b.text += (String) delta.get("text");
                else if ("input_json_delta".equals(dt)) b.json += (String) delta.get("partial_json");
            }
            case "content_block_stop" -> {
                int idx = event.index();
                BlockBuilder b = blocks.get(idx);
                if (b != null && "tool_use".equals(b.type)) {
                    try {
                        b.input = parseJson(b.json);
                    } catch (IllegalStateException e) {
                        throw new IllegalStateException("Parse JSON thất bại ở block index " + idx + ": " + e.getMessage());
                    }
                }
            }
            case "message_delta" -> {
                Map<String, Object> delta = (Map<String, Object>) event.data().get("delta");
                stopReason = (String) delta.get("stop_reason");
                Map<String, Object> u = (Map<String, Object>) event.data().get("usage");
                if (u != null) usage = new Usage(usage.inputTokens(), ((Number) u.get("output_tokens")).intValue());
            }
            case "message_stop" -> finished = true;
            default -> { }
        }
        if (finished) return new AccumulatorResult(build(), true);
        return new AccumulatorResult(null, false);
    }

    AccumulatorResult getResult() {
        if (id == null && role == null && blocks.isEmpty()) return new AccumulatorResult(null, false);
        return new AccumulatorResult(build(), finished);
    }

    private Message build() {
        List<ContentBlock> list = new ArrayList<>();
        for (BlockBuilder b : blocks.values()) {
            if ("text".equals(b.type)) list.add(new TextBlock(b.text));
            else list.add(new ToolUseBlock(b.id, b.name, b.input));
        }
        return new Message(id, role, list, stopReason, usage);
    }

    private static class BlockBuilder {
        String type;
        String text = "";
        String id;
        String name;
        String json = "";
        Map<String, Object> input = Map.of();
    }
}`,
      hints: [
        'Dùng switch trên event.type(); ping/comment trả về AccumulatorResult(null, false) ngay, không chạm vào state.',
        'Giữ Map<Integer, BlockBuilder> blocks theo index. content_block_start tạo BlockBuilder (type, text rỗng hoặc id/name + json rỗng).',
        'text_delta: nối vào block.text. input_json_delta: nối partial_json vào block.json. content_block_stop: nếu là tool_use thì parse block.json thành Map rồi gán block.input.',
        'message_delta: lưu stop_reason và output_tokens. message_stop: đánh dấu finished rồi dựng Message từ các block theo thứ tự index.',
        'Parser JSON: viết hàm đệ quy parseValue → parseObject/parseArray/parseString/parseNumber. Dùng c == 92 cho backslash và (char) 8/9/10/13 cho escape để không phải escape trong template.',
      ],
      explain: `Chìa khóa là **chỉ parse JSON khi content_block_stop**. Các partial_json_delta thường không phải JSON hợp lệ (thiếu ngoặc đóng, chuỗi chưa xong). Nếu parse sớm sẽ ném lỗi hoặc cho kết quả sai.
 
Việc bỏ qua ping/comment quan trọng: server gửi ping vài giây/lần để giữ kết nối; nếu không lọc, code sẽ crash hoặc tạo rác trong blocks.
 
stop_reason max_tokens khác end_turn: output bị cắt giữa chừng, cần báo cho người dùng hoặc tự động gọi lại với max_tokens lớn hơn. end_turn mới là câu trả lời hoàn tất.
 
Parser JSON trong bài chỉ hỗ trợ object phẳng (string/number/boolean/null) để tập trung vào logic ghép event. Production nên dùng Jackson/Gson cho an toàn và hỗ trợ nested.
 
Lỗi hay gặp: quên sắp xếp blocks theo index (API đảm bảo thứ tự nhưng code phòng vệ nên sort), quên gán output_tokens từ message_delta vào usage, và không xử lý trường hợp feed được gọi sau message_stop (trả done=false).`,
    },
  ],
  check: [
    {
      q: 'Event nào chứa stop_reason và output_tokens trong Messages API streaming?',
      options: ['message_start', 'content_block_delta', 'message_delta', 'message_stop'],
      answer: 2,
      explain: 'message_delta chứa delta.stop_reason (end_turn, max_tokens, tool_use...) và usage.output_tokens. message_start chỉ có input_tokens. content_block_delta chỉ có text_delta hoặc input_json_delta. message_stop không có data quan trọng.'
    },
    {
      q: 'Khi nhận input_json_delta cho tool_use, client nên làm gì?',
      options: ['Parse JSON ngay tại mỗi delta', 'Nối partial_json vào buffer, chỉ parse khi content_block_stop', 'Bỏ qua cho đến message_stop', 'Gửi lại cho server để sửa'],
      answer: 1,
      explain: 'partial_json thường bị cắt giữa chừng (ví dụ {"city":"Han rồi tiếp oi"}) nên không parse được. Chỉ khi content_block_stop buffer mới là JSON hoàn chỉnh.'
    },
    {
      q: 'stop_reason là max_tokens có nghĩa gì?',
      options: ['Câu trả lời hoàn tất', 'Output bị cắt vì chạm giới hạn token, chưa đầy đủ', 'Server quá tải', 'Người dùng dừng stream'],
      answer: 1,
      explain: 'max_tokens nghĩa là output đã chạm trần token cho phép và bị cắt giữa chừng. Khác với end_turn (hoàn tất tự nhiên). Không báo thành công như câu trả lời đầy đủ.'
    },
    {
      q: 'Dòng nào trong SSE là comment và phải bỏ qua?',
      options: ['event: ping', 'data: {}', ': keep-alive', 'event: message_start'],
      answer: 2,
      explain: 'Dòng bắt đầu bằng dấu hai chấm (:) là comment trong SSE, dùng cho keep-alive hoặc ghi chú, phải bỏ qua. event: ping là event ping (cũng bỏ qua), data: {} là payload của ping.'
    },
  ],
  related: ['claude-001', 'claude-002'],
  tags: ['sse', 'streaming', 'messages api', 'tool_use', 'stop_reason'],
},
{
  id: 'lesson-claude-013',
  track: 'claude',
  order: 13,
  title: 'Structured output và validate phía client: JSON schema, required/type/enum, retry giới hạn, không chạy tool_use bị cắt',
  level: 'senior',
  minutes: 40,
  goals: [
    'Yêu cầu model trả JSON theo schema (required, type, enum) và hiểu cách dùng system prompt / tool để ép format',
    'Validate phía client: kiểm tra field bắt buộc, kiểu dữ liệu (string, integer, boolean), giá trị enum, từ chối field lạ',
    'Xử lý output sai: retry có giới hạn (maxRetries), backoff, ghi log lỗi để debug, không ném exception làm sập pipeline',
    'Không thực thi tool_use khi stop_reason là max_tokens (output bị cắt, JSON tool_use không hoàn chỉnh)'
  ],
  body: `**Tóm tắt:** Structured output là kỹ thuật ép model trả về JSON tuân theo schema xác định (field bắt buộc, kiểu, enum). Client bắt buộc validate response trước khi dùng: kiểm tra required, type, enum, additionalProperties. Nếu sai, retry có giới hạn (maxRetries, backoff, log). Quan trọng: khi stop_reason là max_tokens, output bị cắt giữa chừng — KHÔNG được parse JSON hay thực thi tool_use vì có thể thiếu field, thiếu ngoặc, hoặc chỉ có một nửa object.
 
### Vì sao cần structured output
Model ngôn ngữ sinh ra văn bản tự do, dễ sai format (thiếu field, sai kiểu, thêm chữ giải thích). Structured output ép model tuân theo schema:
- **System prompt**: "Trả về CHỈ JSON hợp lệ theo schema sau, không thêm chữ nào: {...}"
- **Tool use**: khai báo tool với input_schema, model buộc phải sinh argument đúng schema (nếu endpoint hỗ trợ strict mode)
- **JSON mode** (nếu có): tham số response_format={type: "json_object"} (một số provider hỗ trợ)
 
### Schema cơ bản (subset JSON Schema)
~~~json
{
  "type": "object",
  "properties": {
    "action": { "type": "string", "enum": ["create", "update", "delete"] },
    "order_id": { "type": "string" },
    "quantity": { "type": "integer", "minimum": 1 },
    "notify": { "type": "boolean" }
  },
  "required": ["action", "order_id"],
  "additionalProperties": false
}
~~~
- **type**: string, integer, number, boolean, array, object
- **required**: mảng tên field bắt buộc
- **enum**: tập giá trị cho phép
- **additionalProperties: false**: từ chối field không khai báo
- **minimum/maximum**: cho số (tuỳ chọn)
 
### Validate phía client (bắt buộc)
Dù model có tuân schema, client **luôn phải validate** vì:
1. Model có thể hallucinate (sai field, sai kiểu)
2. Stream bị cắt (max_tokens) tạo JSON không hoàn chỉnh
3. Provider có thể không enforce strict mode
 
Quy trình validate:
1. Parse JSON → nếu lỗi cú pháp: retry
2. Kiểm tra required field (containsKey, không dùng get==null)
3. Kiểm tra type: string, integer (Integer/Long), boolean, array, object
4. Kiểm tra enum (nếu có)
5. Kiểm tra additionalProperties: false → từ chối field lạ
6. Thứ tự lỗi: duyệt key theo alphabet (TreeSet) để deterministic
 
### Retry có giới hạn khi validate thất bại
Không retry vô hạn. Chiến lược:
- maxRetries: 2-3 lần
- Backoff: exponential + jitter (ví dụ 500ms, 1s, 2s...)
- Ghi log: raw response, lỗi validate, schema dùng
- Không ném exception làm sập pipeline; trả kết quả lỗi có cấu trúc để tầng trên quyết định
 
### Không chạy tool_use khi stop_reason = max_tokens
Khi streaming, stop_reason trong message_delta báo lý do dừng:
- end_turn: model tự dừng, output hoàn chỉnh → an toàn để parse tool_use
- max_tokens: output bị cắt giữa chừng → **JSON tool_use có thể thiếu field, thiếu ngoặc, chỉ có nửa object**. Tuyệt đối KHÔNG parse hay chạy tool_use. Cách xử lý: báo "câu trả lời chưa đầy đủ", tăng max_tokens và gọi lại, hoặc hỏi người dùng.
 
### Ví dụ đời thực
Hệ thống đặt hàng dùng model để trích xuất intent từ chat: {action, order_id, quantity}. Một ngày model trả: {"action": "create", "order_id": "ORD-123", "quantity": "nhiều"} (quantity là string thay vì integer). Validate phía client bắt lỗi, retry 1 lần, lần 2 model trả đúng integer. Nếu không validate, service đơn hàng nhận string "nhiều" và crash.
Một trường hợp khác: max_tokens=100 quá nhỏ, model dừng giữa {"action": "create", "order_id": "ORD-123", "quan. Client parse JSON crash, hoặc tệ hơn parse được một object thiếu quantity và tạo đơn số lượng 0. Luôn check stop_reason trước khi parse.
 
### Trả lời mẫu khi phỏng vấn
"Tôi ép structured output bằng system prompt yêu cầu chỉ trả JSON theo schema, hoặc dùng tool use với input_schema. Phía client tôi validate bắt buộc: parse JSON, kiểm tra required field, type (string/integer/boolean), enum, additionalProperties false. Validate thất bại thì retry có giới hạn (max 3 lần, exponential backoff + jitter), ghi log raw response và lỗi để debug. Quan trọng: khi stop_reason là max_tokens, tôi KHÔNG parse JSON tool_use vì output bị cắt giữa chừng — tôi báo người dùng câu trả lời chưa đầy đủ và tăng max_tokens. Tôi dùng TreeSet duyệt key alphabet để thứ tự lỗi deterministic, dễ test và log."
 
### Liên hệ phỏng vấn
Interviewer hay hỏi: "Model trả JSON sai schema thì sao?" (validate client, retry có giới hạn), "max_tokens và tool_use có liên quan gì?" (max_tokens cắt JSON, không được chạy tool_use), "additionalProperties: false có ý nghĩa gì?" (từ chối field lạ, bảo vệ schema), "vì sao không retry vô hạn?" (tốn token, tiền, latency, che bug).`,
  exercises: [
    {
      title: 'OutputValidator + RetryOnInvalid: validate JSON schema và retry có giới hạn',
      prompt: `Các kiểu Schema, ValidationResult, RetryPolicy, RetryResult mô phỏng validation và retry (không cần sửa). Hãy viết:
 
1. OutputValidator.validate(jsonText, schema):
   - Parse jsonText thành Map<String, Object> (dùng parser JSON đơn giản, ném ParseException nếu sai cú pháp).
   - Kiểm tra required: field nào trong schema.required mà không có trong input → lỗi "Missing required property: <field>".
   - Kiểm tra type: string, integer (Integer/Long), boolean. Sai → "Invalid type for property: <field>".
   - Kiểm tra enum: nếu schema.enumValues không rỗng và giá trị không trong tập → "Value not allowed for property: <field>".
   - Kiểm tra additionalProperties: nếu schema.additionalProperties = false và input có field không trong schema.properties → "Unknown property: <field>".
   - Thứ tự lỗi: duyệt key theo alphabet (TreeSet).
   - Trả ValidationResult(valid, errors, parsedData).
 
2. RetryOnInvalid.execute(supplier, validator, schema, policy):
   - {{maxRetries}} là số lần **thử lại** sau lần gọi đầu; tổng số lần gọi tối đa = {{maxRetries + 1}}.
   - Gọi supplier.get() lấy raw JSON string (có thể sai).
   - validator.validate(json, schema).
   - Nếu valid → trả RetryResult(success=true, data=parsedData, attempts=số lần đã gọi).
   - Nếu không valid:
     * Ghi log (System.err.printf) attempt số, lỗi validate, raw JSON (để debug).
     * Nếu attempt < policy.maxRetries(): chờ policy.backoffMillis(attempt) ms (attempt = 0 cho lần chờ đầu, dùng policy.sleeper()), rồi thử lại.
     * Nếu attempt >= policy.maxRetries(): trả RetryResult(success=false, errors=errors, attempts=maxRetries + 1).
   - Nếu supplier ném exception → coi như invalid, retry theo policy.
 
Parser JSON đơn giản chỉ cần xử lý object phẳng: {"key": "value", "num": 123, "bool": true, "arr": [1,2], "obj": {"a":1} }.
Có thể dùng Jackson nếu môi trường cho phép, nhưng bài tập yêu cầu JDK thuần: viết parser đơn giản cho object, string, number, boolean, null, array, nested object.`,
      starter: `// ====== Có sẵn (không cần sửa) ======
record Schema(
    Map<String, Property> properties,
    Set<String> required,
    boolean additionalProperties
) {}
record Property(String type, Set<?> enumValues) {}
record ValidationResult(boolean valid, List<String> errors, Map<String, Object> data) {}
 
interface RetryPolicy {
    int maxRetries();
    long backoffMillis(int attempt);  // attempt = 0 cho lần chờ đầu tiên
    Sleeper sleeper();
}
interface Sleeper { void sleep(long millis); }
 
record RetryResult(boolean success, Map<String, Object> data, List<String> errors, int attempts) {}
 
// Exception parser JSON đơn giản
class ParseException extends RuntimeException {
    ParseException(String msg) { super(msg); }
}
 
// ====== Bài của bạn ======
class OutputValidator {
    static ValidationResult validate(String jsonText, Schema schema) {
        throw new UnsupportedOperationException("TODO");
    }
 
    // Parser JSON đơn giản cho object phẳng (hỗ trợ nested object, array, string, number, boolean, null)
    private static Map<String, Object> parseJson(String json) {
        throw new UnsupportedOperationException("TODO");
    }
}
 
class RetryOnInvalid {
    static RetryResult execute(Supplier<String> supplier, OutputValidator validator, Schema schema, RetryPolicy policy) {
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
    static Schema schema() {
        Map<String, Property> p = new HashMap<>();
        p.put("action", new Property("string", Set.of("create", "update", "delete")));
        p.put("order_id", new Property("string", Set.of()));
        p.put("quantity", new Property("integer", Set.of()));
        p.put("notify", new Property("boolean", Set.of()));
        return new Schema(p, Set.of("action", "order_id"), false);
    }
    static class FixedPolicy implements RetryPolicy {
        final int max; final long backoff; final List<Long> sleeps = new ArrayList<>();
        FixedPolicy(int max, long backoff) { this.max = max; this.backoff = backoff; }
        public int maxRetries() { return max; }
        public long backoffMillis(int attempt) { return backoff; }
        public Sleeper sleeper() { return ms -> sleeps.add(ms); }
    }
    static String json(String s) { return s; }
 
    public static void main(String[] args) {
        check("validate JSON đúng schema", () -> {
            ValidationResult r = OutputValidator.validate(json("{\\"action\\":\\"create\\",\\"order_id\\":\\"ORD-1\\",\\"quantity\\":5,\\"notify\\":true}"), schema());
            eq(true, r.valid()); ok(r.errors().isEmpty(), "errors: " + r.errors());
            eq("create", r.data().get("action")); eq(5, r.data().get("quantity")); eq(true, r.data().get("notify"));
        });
 
        check("thiếu required field", () -> {
            ValidationResult r = OutputValidator.validate(json("{\\"action\\":\\"create\\"}"), schema());
            eq(false, r.valid());
            ok(r.errors().stream().anyMatch(e -> e.contains("order_id")), "thiếu order_id: " + r.errors());
        });
 
        check("sai type: quantity là string", () -> {
            ValidationResult r = OutputValidator.validate(json("{\\"action\\":\\"create\\",\\"order_id\\":\\"ORD-1\\",\\"quantity\\":\\"nhiều\\"}"), schema());
            eq(false, r.valid());
            ok(r.errors().stream().anyMatch(e -> e.contains("quantity")), "sai type quantity: " + r.errors());
        });
 
        check("giá trị ngoài enum", () -> {
            ValidationResult r = OutputValidator.validate(json("{\\"action\\":\\"refund\\",\\"order_id\\":\\"ORD-1\\"}"), schema());
            eq(false, r.valid());
            ok(r.errors().stream().anyMatch(e -> e.contains("action")), "action ngoài enum: " + r.errors());
        });
 
        check("additionalProperties false từ chối field lạ", () -> {
            ValidationResult r = OutputValidator.validate(json("{\\"action\\":\\"create\\",\\"order_id\\":\\"ORD-1\\",\\"trace\\":\\"x\\"}"), schema());
            eq(false, r.valid());
            ok(r.errors().stream().anyMatch(e -> e.contains("trace")), "field lạ trace: " + r.errors());
        });
 
        check("thứ tự lỗi deterministic theo alphabet", () -> {
            ValidationResult r = OutputValidator.validate(json("{\\"z_extra\\":1,\\"a_extra\\":2}"), schema());
            List<String> errs = r.errors();
            int idxA = errs.indexOf(errs.stream().filter(e -> e.contains("a_extra")).findFirst().orElse(""));
            int idxZ = errs.indexOf(errs.stream().filter(e -> e.contains("z_extra")).findFirst().orElse(""));
            ok(idxA < idxZ, "lỗi a_extra phải trước z_extra: " + errs);
        });
 
        check("retry thành công lần 2", () -> {
            int[] calls = {0};
            FixedPolicy policy = new FixedPolicy(3, 10);
            String bad = "{\\"action\\":\\"refund\\",\\"order_id\\":\\"ORD-1\\"}";
            String good = "{\\"action\\":\\"create\\",\\"order_id\\":\\"ORD-1\\",\\"quantity\\":1}";
            RetryResult r = RetryOnInvalid.execute(() -> { calls[0]++; return calls[0] == 1 ? bad : good; }, new OutputValidator(), schema(), policy);
            eq(true, r.success()); eq(2, r.attempts()); eq("create", r.data().get("action")); eq(1, policy.sleeps.size());
        });
 
        check("retry hết lượt trả thất bại", () -> {
            FixedPolicy policy = new FixedPolicy(2, 5);
            String bad = "{\\"action\\":\\"refund\\"}";
            RetryResult r = RetryOnInvalid.execute(() -> bad, new OutputValidator(), schema(), policy);
            eq(false, r.success()); eq(3, r.attempts()); ok(!r.errors().isEmpty(), "errors rong"); eq(2, policy.sleeps.size());
        });
 
        check("supplier ném exception được retry", () -> {
            int[] calls = {0};
            FixedPolicy policy = new FixedPolicy(3, 10);
            String good = "{\\"action\\":\\"create\\",\\"order_id\\":\\"ORD-1\\"}";
            RetryResult r = RetryOnInvalid.execute(() -> { calls[0]++; if (calls[0] < 2) throw new RuntimeException("network"); return good; }, new OutputValidator(), schema(), policy);
            eq(true, r.success()); eq(2, r.attempts());
        });
 
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `// ====== Có sẵn (không cần sửa) ======
record Schema(
    Map<String, Property> properties,
    Set<String> required,
    boolean additionalProperties
) {}
record Property(String type, Set<?> enumValues) {}
record ValidationResult(boolean valid, List<String> errors, Map<String, Object> data) {}
 
interface RetryPolicy {
    int maxRetries();
    long backoffMillis(int attempt);
    Sleeper sleeper();
}
interface Sleeper { void sleep(long millis); }
 
record RetryResult(boolean success, Map<String, Object> data, List<String> errors, int attempts) {}
 
class ParseException extends RuntimeException {
    ParseException(String msg) { super(msg); }
}
 
// ====== Lời giải ======
class OutputValidator {
    static ValidationResult validate(String jsonText, Schema schema) {
        Map<String, Object> data;
        try {
            data = parseJson(jsonText);
        } catch (ParseException e) {
            return new ValidationResult(false, List.of("JSON parse error: " + e.getMessage()), Map.of());
        }
        List<String> errors = new ArrayList<>();
        if (data == null) {
            errors.add("Input must be an object");
            return new ValidationResult(false, errors, Map.of());
        }
        // Required fields
        for (String key : new TreeSet<>(schema.required())) {
            if (!data.containsKey(key)) errors.add("Missing required property: " + key);
        }
        // Validate each input field
        for (String key : new TreeSet<>(data.keySet())) {
            Property prop = schema.properties().get(key);
            if (prop == null) {
                if (!schema.additionalProperties()) errors.add("Unknown property: " + key);
                continue;
            }
            Object value = data.get(key);
            if (!matchesType(prop.type(), value)) {
                errors.add("Invalid type for property: " + key);
            } else if (!prop.enumValues().isEmpty() && !prop.enumValues().contains(value)) {
                errors.add("Value not allowed for property: " + key);
            }
        }
        return new ValidationResult(errors.isEmpty(), errors, data);
    }
 
    private static boolean matchesType(String type, Object value) {
        return switch (type) {
            case "string" -> value instanceof String;
            case "integer" -> value instanceof Integer || value instanceof Long;
            case "boolean" -> value instanceof Boolean;
            case "number" -> value instanceof Number;
            case "array" -> value instanceof List;
            case "object" -> value instanceof Map;
            default -> throw new IllegalArgumentException("Unsupported type: " + type);
        };
    }
 
    private static Map<String, Object> parseJson(String json) {
        // Parser đệ quy đơn giản cho JSON object/array/primitive
        // Chỉ hỗ trợ: object, array, string, number, boolean, null
        // Không hỗ trợ: escape phức tạp trong string, comment, trailing comma
        int[] idx = {0};
        String s = json.trim();
        Object val = parseValue(s, idx);
        if (!(val instanceof Map)) throw new ParseException("Root phải là object");
        skipWhitespace(s, idx);
        if (idx[0] < s.length()) throw new ParseException("Dư ký tự sau JSON");
        return (Map<String, Object>) val;
    }
 
    private static Object parseValue(String s, int[] idx) {
        skipWhitespace(s, idx);
        if (idx[0] >= s.length()) throw new ParseException("JSON bất chợt kết thúc");
        char c = s.charAt(idx[0]);
        if (c == '{') return parseObject(s, idx);
        if (c == '[') return parseArray(s, idx);
        if (c == '"') return parseString(s, idx);
        if (c == 't' || c == 'f') return parseBoolean(s, idx);
        if (c == 'n') return parseNull(s, idx);
        if (c == '-' || (c >= '0' && c <= '9')) return parseNumber(s, idx);
        throw new ParseException("Ký tự không mong đợi: " + c + " tại vị trí " + idx[0]);
    }
 
    private static Map<String, Object> parseObject(String s, int[] idx) {
        Map<String, Object> obj = new LinkedHashMap<>();
        idx[0]++; // bỏ qua {
        skipWhitespace(s, idx);
        if (idx[0] < s.length() && s.charAt(idx[0]) == '}') { idx[0]++; return obj; }
        while (true) {
            skipWhitespace(s, idx);
            if (idx[0] >= s.length() || s.charAt(idx[0]) != '"') throw new ParseException("Key phải là string");
            String key = parseString(s, idx);
            skipWhitespace(s, idx);
            if (idx[0] >= s.length() || s.charAt(idx[0]) != ':') throw new ParseException("Thiếu dấu hai chấm sau key");
            idx[0]++; // bỏ qua :
            Object val = parseValue(s, idx);
            obj.put(key, val);
            skipWhitespace(s, idx);
            if (idx[0] >= s.length()) throw new ParseException("JSON object bất chợt kết thúc");
            char c = s.charAt(idx[0]);
            if (c == '}') { idx[0]++; break; }
            if (c == ',') { idx[0]++; continue; }
            throw new ParseException("Ký tự không mong đợi trong object: " + c);
        }
        return obj;
    }
 
    private static List<Object> parseArray(String s, int[] idx) {
        List<Object> arr = new ArrayList<>();
        idx[0]++; // bỏ qua [
        skipWhitespace(s, idx);
        if (idx[0] < s.length() && s.charAt(idx[0]) == ']') { idx[0]++; return arr; }
        while (true) {
            arr.add(parseValue(s, idx));
            skipWhitespace(s, idx);
            if (idx[0] >= s.length()) throw new ParseException("JSON array bất chợt kết thúc");
            char c = s.charAt(idx[0]);
            if (c == ']') { idx[0]++; break; }
            if (c == ',') { idx[0]++; continue; }
            throw new ParseException("Ký tự không mong đợi trong array: " + c);
        }
        return arr;
    }
 
    private static String parseString(String s, int[] idx) {
        idx[0]++;
        StringBuilder sb = new StringBuilder();
        while (idx[0] < s.length()) {
            char c = s.charAt(idx[0]++);
            if (c == '"') return sb.toString();
            if (c == 92) {
                if (idx[0] >= s.length()) throw new ParseException("Escape bất chợt kết thúc");
                char esc = s.charAt(idx[0]++);
                if (esc == '"' || esc == 92 || esc == '/') sb.append(esc);
                else if (esc == 'b') sb.append((char) 8);
                else if (esc == 'f') sb.append((char) 12);
                else if (esc == 'n') sb.append((char) 10);
                else if (esc == 'r') sb.append((char) 13);
                else if (esc == 't') sb.append((char) 9);
                else throw new ParseException("Escape không hợp lệ: " + esc);
            } else {
                sb.append(c);
            }
        }
        throw new ParseException("String không đóng");
    }

    private static Boolean parseBoolean(String s, int[] idx) {
        if (s.startsWith("true", idx[0])) { idx[0] += 4; return true; }
        if (s.startsWith("false", idx[0])) { idx[0] += 5; return false; }
        throw new ParseException("Boolean không hợp lệ tại " + idx[0]);
    }

    private static Object parseNull(String s, int[] idx) {
        if (s.startsWith("null", idx[0])) { idx[0] += 4; return null; }
        throw new ParseException("Null không hợp lệ tại " + idx[0]);
    }

    private static Number parseNumber(String s, int[] idx) {
        int start = idx[0];
        while (idx[0] < s.length()) {
            char c = s.charAt(idx[0]);
            if ((c >= '0' && c <= '9') || c == '-' || c == '+' || c == '.' || c == 'e' || c == 'E') idx[0]++;
            else break;
        }
        String numStr = s.substring(start, idx[0]);
        try {
            if (numStr.contains(".") || numStr.toLowerCase().contains("e")) return Double.parseDouble(numStr);
            long v = Long.parseLong(numStr);
            if (v >= Integer.MIN_VALUE && v <= Integer.MAX_VALUE) return (int) v;
            return v;
        } catch (NumberFormatException e) {
            throw new ParseException("Số không hợp lệ: " + numStr);
        }
    }

    private static void skipWhitespace(String s, int[] idx) {
        while (idx[0] < s.length() && Character.isWhitespace(s.charAt(idx[0]))) idx[0]++;
    }
}
 
class RetryOnInvalid {
    static RetryResult execute(Supplier<String> supplier, OutputValidator validator, Schema schema, RetryPolicy policy) {
        List<String> lastErrors = List.of();
        Map<String, Object> lastData = Map.of();
        for (int attempt = 0; attempt <= policy.maxRetries(); attempt++) {
            String json;
            try {
                json = supplier.get();
            } catch (RuntimeException e) {
                lastErrors = List.of("Supplier exception: " + e.getMessage());
                lastData = Map.of();
                logAttempt(attempt + 1, lastErrors, "");
                if (attempt >= policy.maxRetries()) break;
                policy.sleeper().sleep(policy.backoffMillis(attempt));
                continue;
            }
            ValidationResult vr = validator.validate(json, schema);
            if (vr.valid()) {
                return new RetryResult(true, vr.data(), List.of(), attempt + 1);
            }
            lastErrors = vr.errors();
            lastData = vr.data();
            logAttempt(attempt + 1, lastErrors, json);
            if (attempt >= policy.maxRetries()) break;
            policy.sleeper().sleep(policy.backoffMillis(attempt));
        }
        return new RetryResult(false, lastData, lastErrors, policy.maxRetries() + 1);
    }
 
    private static void logAttempt(int attempt, List<String> errors, String rawJson) {
        System.err.printf("[RetryOnInvalid] Attempt %d: errors=%s, raw=%s%n", attempt, errors, rawJson.length() > 200 ? rawJson.substring(0, 200) + "..." : rawJson);
    }
}`,
      hints: [
        'OutputValidator.validate: parse JSON trước, bắt ParseException. Duyệt required bằng containsKey. Duyệt input key bằng TreeSet để alphabet. Kiểm tra type trước enum. additionalProperties false → báo field lạ.',
        'Parser JSON đệ quy: parseValue chuyển hướng theo ký tự đầu ({ [ " t f n số). parseObject/parseArray đệ quy. parseString xử lý escape cơ bản. parseNumber phân biệt integer/double.',
        'RetryOnInvalid: vòng lặp attempt=0..maxRetries. Gọi supplier trong try/catch. Validate. Nếu valid return success. Log lỗi (System.err). Nếu attempt < maxRetries: sleep(backoffMillis(attempt)) rồi tiếp. Hết lượt return failure.',
        'Sleeper trong test ghi lại thời gian chờ; production dùng Thread::sleep. BackoffMillis(attempt) với attempt=0 là lần chờ đầu tiên.'
      ],
      explain: `OutputValidator tách rõ parse và validate: parse thất bại → lỗi cú pháp; parse thành công → validate schema. TreeSet đảm bảo thứ tự lỗi deterministic (quan trọng cho test và log ổn định).
 
RetryOnInvalid không ném exception khi thất bại: trả RetryResult(success=false) để tầng trên quyết định (hỏi người dùng, fallback, alert). Việc ghi log raw JSON và errors ở mỗi attempt giúp debug production: biết model sai ở đâu, schema có quá chặt không.
 
Quan trọng: **không parse JSON tool_use khi stop_reason = max_tokens**. Bài tập này không xử lý streaming, nhưng kiến thức đi kèm: trước khi validate, phải check stop_reason. Nếu max_tokens → báo "output bị cắt", tăng max_tokens và gọi lại. Parse JSON cắt giữa chừng sẽ cho object thiếu field, sai type, hoặc ném ParseException gây retry vô ích.
 
Lỗi hay gặp: dùng get(key) == null để kiểm tra required (sai khi field có giá trị null), quên kiểm tra type trước enum (so sánh giá trị sai kiểu với enum), retry vô hạn không có backoff (đốt token), và parse JSON tự viết không xử lý escape string (crash khi gặp \\\" trong chuỗi).`,
    },
  ],
  check: [
    {
      q: 'Khi stop_reason là max_tokens, cách xử lý đúng với tool_use là gì?',
      options: ['Parse JSON tool_use và chạy ngay', 'Không parse, báo output bị cắt, tăng max_tokens và gọi lại', 'Bỏ qua tool_use, chỉ lấy text', 'Retry ngay lập tức không đổi max_tokens'],
      answer: 1,
      explain: 'max_tokens nghĩa là output bị cắt giữa chừng. JSON tool_use có thể thiếu field, thiếu ngoặc, hoặc chỉ có nửa object. Parse sẽ crash hoặc chạy tool với input sai. Phải báo chưa đầy đủ và gọi lại với max_tokens lớn hơn.'
    },
    {
      q: 'Validate JSON schema phía client cần kiểm tra gì?',
      options: ['Chỉ required field', 'Required, type, enum, additionalProperties', 'Chỉ type', 'Chỉ enum'],
      answer: 1,
      explain: 'Validate đầy đủ: required (containsKey), type (string/integer/boolean...), enum (giá trị trong tập cho phép), additionalProperties false (từ chối field lạ). Chỉ kiểm tra một phần để lỗi lọt qua.'
    },
    {
      q: 'Vì sao retry có giới hạn (maxRetries) và backoff?',
      options: ['Để code phức tạp hơn', 'Tránh retry vô hạn đốt token, tiền, latency, và che bug cấu hình/schema', 'API bắt buộc', 'Để model học được'],
      answer: 1,
      explain: 'Retry vô hạn khi model liên tục sai schema (do schema quá chặt hoặc prompt không rõ) sẽ đốt token, tốn tiền, tăng latency, và che bug. Backoff + jitter giảm tải server. Giới hạn 2-3 lần là thực hành tốt.'
    },
    {
      q: 'Thứ tự lỗi validate nên deterministic để làm gì?',
      options: ['Để model hiểu dễ hơn', 'Dễ test, log ổn định, so sánh diff giữa các lần chạy', 'API yêu cầu', 'Không quan trọng'],
      answer: 1,
      explain: 'Duyệt key bằng TreeSet (alphabet) khiến thứ tự lỗi luôn giống nhau. Test không bị flaky, log production dễ grep và so sánh.'
    },
  ],
related: ['claude-001', 'claude-012'],
  tags: ['structured output', 'json schema', 'validation', 'retry', 'max_tokens'],
},
{
  id: 'lesson-claude-014',
  track: 'claude',
  order: 14,
  title: 'Prompt caching và Batch API: cache write vs cache read, TTL, đặt cache_control, chọn model',
  level: 'senior',
  minutes: 40,
  goals: [
    'Phân biệt cache write (ghi cache) và cache read (đọc cache), hiểu tỷ giá 1.25x và 0.1x so với input thường',
    'Biết đặt breakpoint cache_control đúng chỗ: phần tĩnh lên trước, phần động ra sau, tối đa 4 breakpoint',
    'Hiểu TTL mặc định 5 phút, TTL 1 giờ (giá ghi cao hơn), và cách làm mới TTL khi cache hit',
    'Biết dùng Batch API cho tác vụ không gấp (giảm 50% chi phí), hiểu trade-off latency',
    'Chọn model theo tác vụ: Opus cho reasoning phức tạp, Sonnet cho cân bằng, Haiku cho tốc độ/rẻ'
  ],
  body: `### Vì sao chi phí tăng khi ngữ cảnh dài
Messages API tính tiền theo token. Khi chatbot nói chuyện nhiều lượt, mỗi lượt phải gửi lại toàn bộ lịch sử (system prompt, các lượt trước). Giả sử system prompt 3.000 token, mỗi lượt thêm 500 token:
~~~text
Lượt 1 : 3.000 + 500    =  3.500 token input
Lượt 10: 3.000 + 5.000  =  8.000 token input
Lượt 40: 3.000 + 20.000 = 23.000 token input   ← mỗi câu hỏi ngắn cũng trả tiền cho 23K token
~~~
Tổng chi phí input của cả phiên tăng gần **bình phương** theo số lượt. Hai công cụ để kiểm soát: **cắt lịch sử** (giảm token gửi đi) và **prompt caching** (giảm giá token lặp lại).

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

### Cache write vs cache read: đọc usage để biết cache có chạy không
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

### TTL: 5 phút vs 1 giờ
TTL (Time To Live) quyết định cache tồn tại bao lâu nếu không được truy cập. Mặc định là **5 phút** (ephemeral). Mỗi lần cache hit (đọc), TTL được làm mới lại 5 phút. Nếu cần cache lâu hơn cho các workload ít truy cập (ví dụ tài liệu pháp lý hàng ngày), có thể đặt {{"type": "ephemeral", "ttl": "1h"}}:
~~~json
{ "type": "text", "text": "<tài liệu lớn>", "cache_control": { "type": "ephemeral", "ttl": "1h" } }
~~~
Giá ghi (cache_creation_input_tokens) với TTL 1 giờ là **2x** input thường (cao hơn 5 phút 1.25x). Giá đọc vẫn là **0.1x**. Chỉ chọn TTL 1 giờ khi chắc chắn prefix sẽ được đọc lại sau hơn 5 phút nhưng trong 1 giờ, và số lần đọc đủ để bù đắp chi phí ghi cao hơn.

### Đặt cache_control đúng chỗ: prefix ổn định là chìa khóa
Ví dụ SAI (cache không bao giờ hit):
~~~json
"system": [
  { "type": "text", "text": "Hôm nay là " + new Date() + ". Bạn là trợ lý..." },
  { "type": "text", "text": "<tài liệu>", "cache_control": { "type": "ephemeral" } }
]
~~~
Timestamp thay đổi mỗi request → prefix khác → toàn bộ cache miss.
Ví dụ ĐÚNG:
~~~json
"system": [
  { "type": "text", "text": "Bạn là trợ lý CSKH của ngân hàng X. Quy định: ...",
    "cache_control": { "type": "ephemeral" } },
  { "type": "text", "text": "<tài liệu sản phẩm>", "cache_control": { "type": "ephemeral" } },
  { "type": "text", "text": "Hôm nay là " + new Date() + ". Khách hỏi: " }
]
~~~
Phần tĩnh (vai trò, quy định, tài liệu) có breakpoint; phần động (ngày, câu hỏi) nằm sau breakpoint cuối. Với hội thoại nhiều lượt, thường đặt thêm breakpoint ở message cuối cùng của lượt trước để lịch sử cũng được cache:
~~~json
"messages": [
  { "role": "user", "content": "Phí chuyển khoản?" },
  { "role": "assistant", "content": "Phí là 1.100 VNĐ..." },
  { "role": "user", "content": [
    { "type": "text", "text": "Cảm ơn. Thêm một câu hỏi.",
      "cache_control": { "type": "ephemeral" } }
  ]}
]
~~~
Breakpoint ở message user cuối cho phép lượt sau đọc lại cả lịch sử từ cache.

### Batch API: giảm 50% chi phí cho tác vụ không gấp
Batch API xử lý nhiều request cùng lúc dưới dạng job bất đồng bộ. Bạn gửi file JSONL (mỗi dòng một request), API xử lý trong vòng 24 giờ và trả file kết quả. Giá **giảm 50%** so với request online.
~~~bash
# Tạo file requests.jsonl
{"custom_id": "req-1", "params": {"model": "claude-sonnet-5-5", "max_tokens": 1024, "messages": [{"role": "user", "content": "Tóm tắt tài liệu A"}]}}
{"custom_id": "req-2", "params": {"model": "claude-sonnet-5-5", "max_tokens": 1024, "messages": [{"role": "user", "content": "Tóm tắt tài liệu B"}]}}
~~~
~~~bash
# Gửi batch
curl -X POST https://api.anthropic.com/v1/messages/batches \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -F "file=@requests.jsonl"
~~~
Khi job xong, tải file kết quả (JSONL mỗi dòng là kết quả của custom_id tương ứng). Trade-off: **latency cao** (phút đến giờ) đổi lấy **giá rẻ 50%**. Phù hợp: tóm tắt hàng nghìn tài liệu hàng đêm, phân loại ticket hỗ trợ, sinh dữ liệu huấn luyện, tạo embedding. KHÔNG phù hợp: chatbot realtime, phê duyệt giao dịch, bất kỳ luồng nào cần kết quả ngay.

### Chọn model theo tác vụ: Opus, Sonnet, Haiku
| Model | Điểm mạnh | Giá (input/output per 1M tokens) | Khi nào dùng |
|---|---|---|---|
| **Opus** | Reasoning phức tạp, code dài, phân tích sâu | ~$4 / $20 | Kiến trúc hệ thống, refactor lớn, security review, math proof |
| **Sonnet** | Cân bằng tốt mọi tác vụ, code production | ~$2 / $10 | Đại đa số tác vụ: API, business logic, SQL, review PR, agent loop |
| **Haiku** | Nhanh, rẻ, đủ cho tác vụ đơn giản | ~$0.10 / $0.50 | Phân loại, trích xuất field, tóm tắt ngắn, format lại, intent detection |

Quy tắc thực tế: **mặc định Sonnet**. Chỉ lên Opus khi Sonnet thất bại ở reasoning phức tạp (kiểm tra bằng eval set). Dùng Haiku cho tác vụ lặp lại nhiều, rõ ràng, cần độ trễ thấp và chi phí cực thấp. Có thể kết hợp: Haiku làm intent detection/router, Sonnet xử lý nghiệp vụ, Opus làm architecture review cuối tuần.

### Tính chi phí thực tế: CostEstimator
Để quyết định cache hay batch, bạn cần tính tiền chính xác. Công thức chi phí một request:
~~~text
cost = (input_tokens × input_price)
     + (cache_creation_input_tokens × input_price × 1.25)
     + (cache_read_input_tokens × input_price × 0.1)
     + (output_tokens × output_price)
~~~
Với Batch API: nhân toàn bộ kết quả với 0.5 (giảm 50%).
Bảng giá truyền vào (không hard-code) cho phép so sánh model, TTL, và chiến lược cache/batch.

### Ví dụ đời thực
Hệ thống hỗ trợ khách hàng 10.000 lượt/ngày. System prompt + tài liệu = 25.000 token. Không cache: 25K × 10K = 250M token input/ngày. Bật cache (breakpoint sau tài liệu): lượt đầu ghi 25K (1.25x), 9.999 lượt đọc 25K (0.1x). Token hiệu quả = 25K×1.25 + 9.999×25K×0.1 ≈ 251K token/ngày. Giảm **99.9% chi phí input**. Thêm Batch cho tác vụ tóm tắt tài liệu hàng đêm (500 request/ngày): giảm 50% chi phí batch. Kết hợp cả hai: chi phí input/ngày chỉ còn ~0,1% ban đầu.

### Trả lời mẫu khi phỏng vấn
"Tôi dùng prompt caching để giảm chi phí input lặp lại: đặt breakpoint cache_control sau phần tĩnh (system, tài liệu, tools), phần động (ngày, câu hỏi user) ra sau. Cache write (ghi) tốn 1.25x, cache read (đọc) chỉ 0.1x, TTL 5 phút làm mới mỗi hit; có thể chọn TTL 1 giờ (ghi 2x) cho workload ít truy cập. Tôi đọc usage: cache_read_input_tokens > 0 có nghĩa cache đang hit. Với tác vụ không gấp (tóm tắt hàng đêm, phân loại ticket), tôi dùng Batch API giảm 50% chi phí, chấp nhận latency vài giờ. Tôi chọn model: Haiku cho intent detection/router, Sonnet mặc định cho nghiệp vụ, Opus chỉ cho architecture review. Tôi viết CostEstimator nhận bảng giá và usage để so sánh chiến lược trước khi deploy."
`,
  exercises: [
    {
      title: 'CostEstimator: tính chi phí request theo usage và bảng giá, so sánh cache/batch/model',
      prompt: `Các kiểu PriceTable, UsageSnapshot, CostBreakdown, CompareResult mô phỏng dữ liệu định giá và usage (không cần sửa). Hãy viết class CostEstimator:
1. estimate(usage, prices): tính chi phí một request.
   - inputCost = usage.inputTokens × prices.inputPrice
   - cacheWriteCost = usage.cacheCreationInputTokens × prices.inputPrice × 1.25
   - cacheReadCost = usage.cacheReadInputTokens × prices.inputPrice × 0.1
   - outputCost = usage.outputTokens × prices.outputPrice
   - Nếu prices.isBatch = true: toàn bộ tổng nhân 0.5
   - Trả CostBreakdown(inputCost, cacheWriteCost, cacheReadCost, outputCost, total, isBatch)
2. compare(strategies): so sánh nhiều chiến lược, trả CompareResult(cheapestName, savingsVsFirst, breakdowns).
   - strategies là Map<name, {usage, prices}>. Tính estimate cho từng cái.
   - cheapestName: tên chiến lược có total nhỏ nhất.
   - savingsVsFirst: (firstTotal - cheapestTotal) / firstTotal × 100 (phần trăm tiết kiệm so với chiến lược đầu tiên).
   - breakdowns: Map tên → CostBreakdown.

Lưu ý: prices.inputPrice và prices.outputPrice là giá cho 1 MILLION token. usage đơn vị là token. Công thức: token × price / 1_000_000.`,
      starter: `// ====== Có sẵn (không cần sửa) ======
record PriceTable(
    double inputPrice,          // giá 1M token input thường
    double outputPrice,         // giá 1M token output
    boolean isBatch             // true = Batch API (giảm 50%)
) {}
record UsageSnapshot(
    long inputTokens,
    long cacheCreationInputTokens,
    long cacheReadInputTokens,
    long outputTokens
) {}
record CostBreakdown(
    double inputCost,
    double cacheWriteCost,
    double cacheReadCost,
    double outputCost,
    double total,
    boolean isBatch
) {}
record CompareResult(
    String cheapestName,
    double savingsVsFirstPercent,
    Map<String, CostBreakdown> breakdowns
) {}

  // ====== Bài của bạn ======
class CostEstimator {
    static CostBreakdown estimate(UsageSnapshot usage, PriceTable prices) {
        throw new UnsupportedOperationException("TODO");
    }

    static CompareResult compare(Map<String, Pair<UsageSnapshot, PriceTable>> strategies) {
        throw new UnsupportedOperationException("TODO");
    }
}

// Helper Pair vì Java không có sẵn
record Pair<U, V>(U first, V second) {}`,
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
    static void near(double expected, double actual, double eps) {
        if (Math.abs(expected - actual) > eps) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static PriceTable sonnet = new PriceTable(2.00, 10.00, false);
    static PriceTable sonnetBatch = new PriceTable(2.00, 10.00, true);
    static PriceTable haiku = new PriceTable(0.10, 0.50, false);
    static PriceTable opus = new PriceTable(4.00, 20.00, false);

    public static void main(String[] args) {
        check("request thường không cache", () -> {
            UsageSnapshot u = new UsageSnapshot(10_000, 0, 0, 2_000);
            CostBreakdown c = CostEstimator.estimate(u, sonnet);
            near(0.02, c.inputCost(), 1e-9);      // 10k * 2 / 1M
            near(0.0, c.cacheWriteCost(), 1e-9);
            near(0.0, c.cacheReadCost(), 1e-9);
            near(0.02, c.outputCost(), 1e-9);     // 2k * 10 / 1M
            near(0.04, c.total(), 1e-9);
            eq(false, c.isBatch());
        });
        check("request có cache write lần đầu", () -> {
            UsageSnapshot u = new UsageSnapshot(1_000, 20_000, 0, 500);
            CostBreakdown c = CostEstimator.estimate(u, sonnet);
            near(0.002, c.inputCost(), 1e-9);           // 1k * 2 / 1M
            near(0.05, c.cacheWriteCost(), 1e-9);       // 20k * 2 * 1.25 / 1M
            near(0.0, c.cacheReadCost(), 1e-9);
            near(0.005, c.outputCost(), 1e-9);          // 500 * 10 / 1M
            near(0.057, c.total(), 1e-9);
        });
        check("request cache read (hit)", () -> {
            UsageSnapshot u = new UsageSnapshot(500, 0, 20_000, 500);
            CostBreakdown c = CostEstimator.estimate(u, sonnet);
            near(0.001, c.inputCost(), 1e-9);          // 500 * 2 / 1M
            near(0.0, c.cacheWriteCost(), 1e-9);
            near(0.004, c.cacheReadCost(), 1e-9);       // 20k * 2 * 0.1 / 1M
            near(0.005, c.outputCost(), 1e-9);
            near(0.01, c.total(), 1e-9);
        });
        check("Batch API giảm 50%", () -> {
            UsageSnapshot u = new UsageSnapshot(10_000, 0, 0, 2_000);
            CostBreakdown c = CostEstimator.estimate(u, sonnetBatch);
            near(0.02, c.total(), 1e-9);   // (0.02+0.02) * 0.5 = 0.02
            eq(true, c.isBatch());
        });
        check("so sánh chiến lược: cache read thắng, Batch gần bằng", () -> {
            Map<String, Pair<UsageSnapshot, PriceTable>> s = new LinkedHashMap<>();
            s.put("no_cache", new Pair<>(new UsageSnapshot(25_000, 0, 0, 1_000), sonnet));
            s.put("cache_write", new Pair<>(new UsageSnapshot(1_000, 24_000, 0, 1_000), sonnet));
            s.put("cache_read", new Pair<>(new UsageSnapshot(500, 0, 24_000, 1_000), sonnet));
            s.put("batch_no_cache", new Pair<>(new UsageSnapshot(25_000, 0, 0, 1_000), sonnetBatch));
            CompareResult r = CostEstimator.compare(s);
            eq("cache_read", r.cheapestName());
            near(73.67, r.savingsVsFirstPercent(), 0.5);   // tiết kiệm ~73.7% so với no_cache
            eq(4, r.breakdowns().size());
        });
        check("Haiku rẻ hơn Sonnet cho tác vụ đơn giản", () -> {
            UsageSnapshot u = new UsageSnapshot(5_000, 0, 0, 1_000);
            CostBreakdown c1 = CostEstimator.estimate(u, sonnet);
            CostBreakdown c2 = CostEstimator.estimate(u, haiku);
            ok(c2.total() < c1.total(), "Haiku phải rẻ hơn: " + c2.total() + " vs " + c1.total());
        });
        check("Opus đắt hơn Sonnet gấp nhiều lần", () -> {
            UsageSnapshot u = new UsageSnapshot(10_000, 0, 0, 2_000);
            CostBreakdown c1 = CostEstimator.estimate(u, sonnet);
            CostBreakdown c2 = CostEstimator.estimate(u, opus);
            ok(c2.total() >= c1.total() * 1.5, "Opus phải đắt gấp >=1.5x: " + c2.total() + " vs " + c1.total());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `// ====== Có sẵn (không cần sửa) ======
record PriceTable(
    double inputPrice,
    double outputPrice,
    boolean isBatch
) {}
record UsageSnapshot(
    long inputTokens,
    long cacheCreationInputTokens,
    long cacheReadInputTokens,
    long outputTokens
) {}
record CostBreakdown(
    double inputCost,
    double cacheWriteCost,
    double cacheReadCost,
    double outputCost,
    double total,
    boolean isBatch
) {}
record CompareResult(
    String cheapestName,
    double savingsVsFirstPercent,
    Map<String, CostBreakdown> breakdowns
) {}
record Pair<U, V>(U first, V second) {}

  // ====== Lời giải ======
class CostEstimator {
    private static final double MILLION = 1_000_000.0;
    private static final double CACHE_WRITE_MULTIPLIER = 1.25;
    private static final double CACHE_READ_MULTIPLIER = 0.1;
    private static final double BATCH_DISCOUNT = 0.5;

    static CostBreakdown estimate(UsageSnapshot usage, PriceTable prices) {
        double inputCost = usage.inputTokens() * prices.inputPrice() / MILLION;
        double cacheWriteCost = usage.cacheCreationInputTokens() * prices.inputPrice() * CACHE_WRITE_MULTIPLIER / MILLION;
        double cacheReadCost = usage.cacheReadInputTokens() * prices.inputPrice() * CACHE_READ_MULTIPLIER / MILLION;
        double outputCost = usage.outputTokens() * prices.outputPrice() / MILLION;
        double subtotal = inputCost + cacheWriteCost + cacheReadCost + outputCost;
        double total = prices.isBatch() ? subtotal * BATCH_DISCOUNT : subtotal;
        return new CostBreakdown(inputCost, cacheWriteCost, cacheReadCost, outputCost, total, prices.isBatch());
    }

    static CompareResult compare(Map<String, Pair<UsageSnapshot, PriceTable>> strategies) {
        Map<String, CostBreakdown> breakdowns = new LinkedHashMap<>();
        String firstName = null;
        double firstTotal = 0;
        String cheapestName = null;
        double cheapestTotal = Double.MAX_VALUE;
        for (Map.Entry<String, Pair<UsageSnapshot, PriceTable>> entry : strategies.entrySet()) {
            String name = entry.getKey();
            UsageSnapshot usage = entry.getValue().first();
            PriceTable prices = entry.getValue().second();
            CostBreakdown bd = estimate(usage, prices);
            breakdowns.put(name, bd);
            if (firstName == null) {
                firstName = name;
                firstTotal = bd.total();
            }
            if (bd.total() < cheapestTotal) {
                cheapestTotal = bd.total();
                cheapestName = name;
            }
        }
        double savings = firstTotal > 0 ? (firstTotal - cheapestTotal) / firstTotal * 100.0 : 0.0;
        return new CompareResult(cheapestName, savings, breakdowns);
    }
}`,
      hints: [
        'estimate: công thức token × price / 1_000_000. cache_write nhân 1.25, cache_read nhân 0.1. Batch nhân 0.5 cuối cùng.',
        'compare: duyệt LinkedHashMap để giữ thứ tự; firstName là entry đầu tiên. Tìm min total. savings = (first - cheapest) / first * 100.',
        'Dùng hằng số cho 1.25, 0.1, 0.5, 1_000_000 để không hard-code số magic.'
      ],
      explain: `CostEstimator tách rõ từng thành phần chi phí để bạn thấy đâu đắt, đâu rẻ. Cache write (ghi) tốn 1.25x — lần đầu "lỗ" so với không cache. Cache read (đọc) chỉ 0.1x — mỗi lần hit lời 90%. Batch giảm 50% toàn bộ nhưng latency cao.
Lỗi hay gặp: quên chia 1_000_000 (price là per 1M token), nhầm cache_write multiplier (1.25 không phải 0.25), quên nhân 0.5 cho batch, và so sánh total mà không chuẩn hóa usage (cùng usage mới so sánh được model). compare dùng LinkedHashMap để thứ tự deterministic, quan trọng cho test và log.`,
    },
  ],
  check: [
    {
      q: 'Đặt cache_control ở đâu để cache hit cho chatbot nhiều lượt?',
      options: [
        'Cuối system prompt, trước phần động (ngày, câu hỏi user)',
        'Đầu system prompt, trước vai trò',
        'Mỗi message user',
        'Chỉ trên tool definitions'
      ],
      answer: 0,
      explain: 'Prefix ổn định = tools → system → messages. Đặt breakpoint sau phần tĩnh (vai trò, tài liệu), phần động ra sau. Với nhiều lượt, thêm breakpoint ở message user cuối để lịch sử cũng được cache.'
    },
    {
      q: 'Batch API giảm bao nhiêu % chi phí so với request online?',
      options: ['25%', '50%', '75%', '90%'],
      answer: 1,
      explain: 'Batch API giá giảm 50% (nhân 0.5). Trade-off: latency từ vài phút đến 24 giờ. Phù hợp tác vụ offline: tóm tắt hàng đêm, phân loại ticket, sinh dữ liệu huấn luyện.'
    },
    {
      q: 'UsageSnapshot có cache_read_input_tokens = 20.000, cache_creation_input_tokens = 0. Điều này có nghĩa gì?',
      options: [
        'Đang ghi cache lần đầu',
        'Đang đọc cache (cache hit), không ghi mới',
        'Cache bị miss',
        'Batch API đang chạy'
      ],
      answer: 1,
      explain: 'cache_creation = 0 và cache_read > 0 nghĩa là request này đọc từ cache đã có (hit). Lần ghi đầu thường có cache_creation > 0, cache_read = 0.'
    },
    {
      q: 'Tại sao Haiku phù hợp cho intent detection/router trong chuỗi xử lý?',
      options: [
        'Vì Haiku có reasoning tốt nhất',
        'Vì Haiku nhanh, rẻ, đủ cho tác vụ phân loại/trích xuất đơn giản',
        'Vì Haiku hỗ trợ cache tốt hơn',
        'Vì Haiku có context window lớn nhất'
      ],
      answer: 1,
      explain: 'Haiku giá ~$0.10/$0.50 per 1M token (rẻ gấp ~20x Sonnet), độ trễ thấp, đủ chính xác cho intent detection, phân loại, trích xuất field. Dùng Haiku làm router, Sonnet xử lý nghiệp vụ, Opus cho architecture review.'
    },
  ],
  related: ['claude-003', 'claude-012'],
  tags: ['prompt caching', 'batch api', 'cost optimization', 'cache_control', 'ttl', 'model selection'],
}
);
