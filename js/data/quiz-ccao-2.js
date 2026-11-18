/* CCAO-F (Claude Certified Associate – Foundations) practice questions, pool 2 (topic claude, tag "[Domain]" = exam domain in js/data/exams.js): tasks T2288+. Format: AGENTS.md mục 4 (QUIZ). */
(window.QUIZ = window.QUIZ || []).push(
// qtool append point
{
  id: 'qz-ccao-106',
  topic: 'claude',
  q: "[Output Evaluation] A team asks Claude to turn three department figures into a budget table. The rows match the source numbers, but the total at the bottom is 5 percent higher than the rows added together. What is the most useful evaluation step before the table is used?",
  options: [
    "Keep the total as the headline figure and treat the row values as supporting detail",
    "Remove the total so nobody can rely on a number that might be wrong",
    "Ask Claude to rebuild the whole table in a new chat and use whichever version looks neater",
    "Add the rows again, correct the total, and check why the mismatch happened"
  ],
  answer: 3,
  explain: `**Đúng: cộng lại các dòng, sửa tổng, và tìm nguyên nhân lệch trước khi dùng.** Một bảng số liệu có giá trị chủ yếu ở con số tổng: người đọc nhìn tổng trước, rồi mới xem chi tiết. Nếu tổng sai 5 phần trăm thì mọi kết luận dựa trên nó (xin ngân sách, so sánh quý, báo cáo lên trên) đều lệch theo. Cách kiểm tra rẻ nhất là cộng lại các dòng bằng máy tính hoặc công thức, sau đó truy nguyên nhân: Claude cộng nhầm, một dòng bị làm tròn, hay nguồn thiếu một khoản.

### Vì sao các lựa chọn khác sai
- **Giữ nguyên tổng, coi các dòng là chi tiết phụ:** người ra quyết định thường chỉ đọc tổng; một tổng sai làm hỏng toàn bộ kết luận dù các dòng đúng.
- **Xoá tổng cho an toàn:** mất thông tin quan trọng nhất của bảng. Việc cần làm là sửa, không phải bỏ.
- **Dựng lại cả bảng ở chat mới rồi chọn bản "trông đẹp hơn":** "đẹp" không phải tiêu chí đúng, và bản mới vẫn phải kiểm tra phép cộng. Dựng lại cũng không giải thích được vì sao lệch.

### Cách làm
Cộng lại ba dòng; nếu lệch, yêu cầu Claude giải thích từng bước tính tổng; đối chiếu với file gốc; ghi lại công thức kiểm tra để lần sau chỉ mất vài giây.

> Mẹo thực tế: với bảng số, luôn kiểm tra phép cộng trước khi đọc nội dung — đó là lỗi rẻ nhất để phát hiện và tốn kém nhất nếu bỏ qua.`
},
{
  id: 'qz-ccao-107',
  topic: 'claude',
  q: "[Output Evaluation] Claude translates a safety notice from English into Vietnamese. The Vietnamese reads smoothly, but one sentence can be read as 'may do this' instead of 'must do this'. Which check is most likely to catch this kind of meaning error?",
  options: [
    "Ask Claude to translate the Vietnamese version back into English, then compare each sentence with the original",
    "Count words in both versions and reject the translation if the counts differ by more than 10 percent",
    "Ask a colleague who does not read Vietnamese whether the layout looks professional",
    "Accept it, because smooth and natural language proves the meaning is correct"
  ],
  answer: 0,
  explain: `**Đúng: dịch ngược (back-translation) rồi so sánh nghĩa.** Dịch ngược là đưa bản dịch trở lại ngôn ngữ gốc rồi xem câu nào đổi nghĩa. Nếu bản tiếng Anh thu được nói "may" trong khi bản gốc nói "must", bạn thấy ngay chỗ lệch. Đây là cách kiểm tra nội dung chứ không kiểm tra hình thức, và nó đặc biệt hiệu quả với câu có động từ tình thái (must, should, may) — vừa dễ sai, vừa nguy hiểm nhất trong thông báo an toàn.

### Vì sao các lựa chọn khác sai
- **Đếm số từ:** hai ngôn ngữ có độ dài câu khác nhau là bình thường; đếm từ không phát hiện được chuyện "may" biến thành "must".
- **Nhờ người không đọc được tiếng Việt xem bố cục:** bố cục không nói gì về nghĩa; người đó không thể xác nhận nội dung.
- **Tin vì văn trôi chảy:** độ trôi chảy là dấu hiệu của văn phong, không phải của độ chính xác. Một câu sai nghĩa vẫn có thể rất mượt.

### Cách làm
Dịch ngược câu quan trọng nhất (nghĩa vụ, thời hạn, điều kiện); đặt hai bản cạnh nhau; ghi lại kết quả đối chiếu để người khác kiểm tra lại.

> Mẹo thực tế: với tài liệu pháp lý, y tế, an toàn, hãy dịch ngược câu quan trọng nhất và lưu lại bản đối chiếu.`
},
{
  id: 'qz-ccao-108',
  topic: 'claude',
  multi: true,
  q: "[Output Evaluation] A team creates about 120 Claude-generated customer replies every week and cannot review all of them. Which two sampling approaches give the most useful picture of quality? (Choose 2)",
  options: [
    "Review only the replies that look short, because length predicts quality",
    "Take a random sample that covers all agents and all weeks, so it reflects normal work",
    "Review only the replies from the highest-rated agent and treat them as the standard",
    "Include extra cases from the riskiest categories, such as refunds or legal wording, plus a random base sample",
    "Review replies only during the week after a complaint, since that is when problems appear"
  ],
  answer: [1, 3],
  explain: `**Đúng: mẫu ngẫu nhiên đại diện, cộng thêm phần lấy dày hơn ở nhóm rủi ro cao.** "Ngẫu nhiên" (random) nghĩa là mỗi câu trả lời có cơ hội được chọn như nhau, nên kết quả không bị dẫn dắt bởi lựa chọn của người review. "Nhóm rủi ro cao" là nhóm ít câu nhưng hậu quả lớn (hoàn tiền, cam kết pháp lý); với nhóm này nên oversample — chọn nhiều hơn tỷ lệ tự nhiên. Cách kết hợp cho bạn cả bức tranh chung và sự bảo vệ cho phần dễ gây thiệt hại.

### Vì sao các lựa chọn khác sai
- **Chỉ đọc câu ngắn:** độ dài không phải chỉ báo chất lượng; câu ngắn vẫn có thể sai, câu dài vẫn có thể đúng. Đây là chọn mẫu theo phỏng đoán, không đại diện.
- **Chỉ đọc câu của agent giỏi nhất:** bạn chỉ chứng minh được người giỏi làm tốt, không biết phần còn lại của tổ chức ra sao.
- **Chỉ review tuần sau khi có khiếu nại:** khiếu nại là tín hiệu trễ và chỉ xuất hiện khi việc đã sai; bạn luôn đi sau vấn đề thay vì phát hiện sớm.

### Cách làm
Chia tổng theo tuần, agent và loại việc; bốc ngẫu nhiên trong từng nhóm; thêm 10–20 phần trăm từ nhóm rủi ro; ghi kết quả theo cùng một rubric để so sánh giữa các tuần.

> Mẹo thực tế: mẫu tốt phải trả lời được câu "chất lượng đang tốt lên hay xấu đi?", chứ không chỉ "tuần này có lỗi gì".`
},
{
  id: 'qz-ccao-109',
  topic: 'claude',
  q: "[Output Evaluation] A team uses Claude to score two draft answers against a rubric. In testing, it almost always prefers the longer answer, even when the longer one only adds filler. What is the most appropriate response?",
  options: [
    "Stop using model-based scoring, because a biased judge can never be trusted",
    "Remove the rubric so the judge has more freedom to decide",
    "Calibrate the judge with examples scored by people, and add an explicit conciseness or relevance criterion",
    "Always choose the shorter answer, since the judge is known to prefer long ones"
  ],
  answer: 2,
  explain: `**Đúng: hiệu chỉnh (calibrate) người chấm bằng dữ liệu người thật, và đưa tiêu chí ngắn gọn/đúng trọng tâm vào rubric.** "LLM-as-judge" là dùng một mô hình để chấm output của mô hình khác: rẻ, nhanh, nhưng có thiên lệch (bias), ví dụ thiên vị câu dài, thiên vị văn phong giống mình, hoặc thiên vị câu trả lời xuất hiện trước. Cách sửa không phải bỏ đi mà là đo: đưa cho nó vài chục cặp đã có điểm người thật, xem nó lệch bao nhiêu, rồi chỉnh rubric cho đến khi khớp.

### Vì sao các lựa chọn khác sai
- **Bỏ hẳn chấm bằng mô hình:** mất một công cụ rẻ và mở rộng được; vấn đề nằm ở hiệu chỉnh, không phải ở bản thân kỹ thuật.
- **Bỏ rubric:** khi không có tiêu chí, mô hình càng dễ chọn theo cảm giác và theo độ dài; rubric chính là thứ neo lại.
- **Cứ chọn câu ngắn hơn:** chỉ đổi một thiên lệch này thành một thiên lệch khác; có câu ngắn nhưng thiếu ý.

### Cách làm
Chọn khoảng 30 cặp có điểm người thật; đo mức đồng thuận; thêm tiêu chí rõ ràng (ví dụ "mỗi câu phải đóng góp thông tin mới"); chạy lại đến khi độ lệch giảm.

> Mẹo thực tế: khi dùng AI để chấm AI, hãy giữ một tập đáp án mẫu do người chấm — nếu không, bạn chỉ đang tin vào cảm giác của mô hình.`
},
{
  id: 'qz-ccao-110',
  topic: 'claude',
  q: "[Output Evaluation] Two Claude drafts answer the same market question. Draft A is polished and gives a precise 34 percent figure with no source. Draft B is rougher, gives a range, and names the two reports it used. Which is the better basis for a client slide, and why?",
  options: [
    "Draft A, because a precise number is more persuasive in a client slide",
    "Draft A, as long as a colleague reads it aloud once before the meeting",
    "Draft B, because it is traceable and states uncertainty, so the claims can be checked",
    "Neither; both must be rejected because neither is perfect"
  ],
  answer: 2,
  explain: `**Đúng: chọn bản truy được nguồn và nói rõ khoảng dao động.** Một con số "34%" nghe rất chắc chắn, nhưng nếu không có nguồn thì không ai kiểm chứng được — đó chính là dạng output nguy hiểm nhất: sai mà vẫn thuyết phục. Bản B kém bóng bẩy nhưng cho bạn hai báo cáo để mở ra đối chiếu, và khoảng dao động phản ánh đúng thực tế là dữ liệu thị trường không có một con số duy nhất.

### Vì sao các lựa chọn khác sai
- **Chọn A vì chính xác hơn khi thuyết trình:** độ chính xác không đến từ độ bóng bẩy. Con số không nguồn vẫn có thể là bịa (hallucination — mô hình tạo thông tin nghe hợp lý nhưng không có thật).
- **Giữ A và nhờ đọc to một lần:** đọc to chỉ kiểm tra văn phong, không kiểm tra dữ kiện.
- **Loại cả hai:** không cần thiết; B dùng được sau khi kiểm tra, còn A phải bổ sung nguồn trước.

### Cách làm
Mở hai báo cáo mà B dẫn; xác nhận số liệu; nếu vẫn muốn dùng A thì yêu cầu Claude đưa nguồn cho từng số rồi kiểm tra như trên.

> Mẹo thực tế: trong tài liệu gửi khách, một khoảng có nguồn đáng giá hơn một con số đẹp không nguồn.`
},
{
  id: 'qz-ccao-111',
  topic: 'claude',
  multi: true,
  q: "[Output Evaluation] A user asks Claude for exactly five bullet points, each under two lines, with no introduction. The answer is factually accurate but has nine bullets and a two-paragraph introduction. Which two statements about evaluating this output are correct? (Choose 2)",
  options: [
    "The output does not meet the format requirements, even if the facts are correct",
    "Format problems do not matter when the information is accurate",
    "Accuracy and format compliance are separate checks, and both should be reported",
    "The output should be accepted, because more detail is always better",
    "The fix is to rewrite the content from scratch, not to reformat it"
  ],
  answer: [0, 2],
  explain: `**Đúng: tách thành hai câu hỏi — "nội dung có đúng không?" và "có đúng định dạng yêu cầu không?".** Trong công việc, định dạng là một phần của yêu cầu: người nhận cần dán đúng 5 bullet vào ticket, không cần đọc 9 bullet và hai đoạn mở đầu. Một output đúng nội dung nhưng sai định dạng vẫn phải trả lại để sửa, và người đánh giá cần nói rõ lỗi thuộc loại nào để người dùng biết sửa ở đâu.

### Vì sao các lựa chọn khác sai
- **Bỏ qua định dạng:** nếu ai cũng tự "cải tiến" định dạng, các bước sau (dán vào tool, in, gửi) sẽ hỏng; ràng buộc định dạng thường đến từ yêu cầu thật.
- **Chấp nhận vì nhiều chi tiết hơn:** nhiều hơn không phải tốt hơn; ở đây nó phá vỡ giới hạn đã thống nhất.
- **Viết lại từ đầu:** lãng phí; nội dung đã đúng, chỉ cần bỏ phần mở đầu và gộp bớt bullet.

### Cách làm
Chạy hai checklist riêng: (1) đối chiếu dữ kiện, (2) đối chiếu số lượng, độ dài và cấu trúc. Báo cả hai kết quả.

> Mẹo thực tế: khi yêu cầu có ràng buộc định dạng, hãy nói rõ trong prompt "chỉ xuất 5 bullet, không mở đầu"; nếu vẫn sai, coi đó là lỗi cần sửa, không phải "sáng tạo".`
},
{
  id: 'qz-ccao-112',
  topic: 'claude',
  q: "[Output Evaluation] An operations analyst is not a programmer. Claude gives a spreadsheet formula for a discount, and the first result looks plausible. What is the most reliable way to check the formula before applying it to 4,000 rows?",
  options: [
    "Apply it to all rows and see whether the totals look reasonable",
    "Ask Claude whether the formula is correct",
    "Test it on a copy with a few rows whose correct answer is known by hand, then compare",
    "Check that the formula uses valid spreadsheet syntax"
  ],
  answer: 2,
  explain: `**Đúng: kiểm thử bằng vài dòng có đáp án đã biết trước (known-answer test).** Bạn tự tính tay 3–4 dòng đơn giản, kể cả dòng biên (0%, 100%, số âm nếu có), rồi xem công thức có cho đúng kết quả không. Đây là cách kiểm tra logic mà không cần biết lập trình: bạn không cần đọc công thức, chỉ cần biết kết quả đúng. Nếu đúng ở các ca biên, khả năng cao công thức đúng cho cả 4,000 dòng.

### Vì sao các lựa chọn khác sai
- **Áp dụng cho tất cả rồi xem tổng:** nếu sai, bạn đã sửa 4,000 dòng và có thể đã gửi kết quả sai; tổng "trông hợp lý" không chứng minh từng dòng đúng.
- **Hỏi chính Claude:** cùng một nguồn tạo ra công thức cũng đánh giá công thức; nó có thể lặp lại lỗi một cách tự tin.
- **Kiểm tra cú pháp:** cú pháp đúng chỉ nghĩa là công thức chạy được, không có nghĩa nó tính đúng logic (ví dụ trừ thiếu thuế).

### Cách làm
Nhân bản sheet; chọn 5 dòng đại diện; tính tay; dán công thức; so sánh; nếu lệch, yêu cầu Claude giải thích từng phần của công thức.

> Mẹo thực tế: với việc lặp lại hàng nghìn lần, 1% lỗi cũng là hàng chục dòng sai — luôn kiểm thử trên mẫu nhỏ trước.`
},
{
  id: 'qz-ccao-113',
  topic: 'claude',
  q: "[Output Evaluation] Claude summarizes a 20-page services contract for a project manager. The summary reads well, but the manager later notices it never mentions the termination-notice period. What does this reveal about how the summary was evaluated?",
  options: [
    "It was judged mainly on readability, when it also needed a coverage check against the contract's key clauses",
    "Claude cannot summarize contracts accurately",
    "Longer summaries are always safer",
    "A summary is not expected to mention every important clause"
  ],
  answer: 0,
  explain: `**Đúng: thiếu bước kiểm tra độ phủ (coverage) — đối chiếu với danh sách điều khoản bắt buộc.** Đọc thấy hay chỉ kiểm tra văn phong; muốn biết bản tóm tắt có dùng được không, bạn phải có checklist các mục phải có: thời hạn thanh toán, điều khoản chấm dứt, giới hạn trách nhiệm, vi phạm, gia hạn. Với hợp đồng dịch vụ, thời hạn báo trước khi chấm dứt là mục dễ bị bỏ và hậu quả lớn.

### Vì sao các lựa chọn khác sai
- **Kết luận Claude không tóm tắt được hợp đồng:** vấn đề nằm ở cách đánh giá, không phải ở khả năng; cùng prompt đó vẫn có thể tốt nếu có checklist.
- **Bản dài hơn luôn an toàn hơn:** dài hơn có thể chứa nhiều thứ không liên quan; điều cần là đủ các mục bắt buộc, không phải nhiều chữ.
- **Cho rằng bản tóm tắt không cần đủ mục:** nếu người đọc dùng bản tóm tắt để ra quyết định, thiếu mục quan trọng là lỗi thật.

### Cách làm
Lập checklist 6–8 mục bắt buộc; đánh dấu có/không trong bản tóm tắt; mục nào thiếu thì yêu cầu bổ sung kèm số trang.

> Mẹo thực tế: "đọc thấy hay" là đánh giá văn phong; "dùng được" là đánh giá độ phủ và độ chính xác. Luôn hỏi mục nào bắt buộc phải có.`
},
{
  id: 'qz-ccao-114',
  topic: 'claude',
  multi: true,
  q: "[Output Evaluation] Two reviewers rate the same Claude draft very differently: one says it is ready to send, the other says it needs a full rewrite. Which two actions best resolve the disagreement? (Choose 2)",
  options: [
    "Let the more senior reviewer decide, without discussion",
    "Compare both ratings with the shared rubric and point to specific sentences as evidence",
    "Discard both ratings and average them into a single score",
    "Agree on a few reference examples with known ratings and re-check the rubric wording",
    "Ask Claude which reviewer is right"
  ],
  answer: [1, 3],
  explain: `**Đúng: quay về rubric và bằng chứng cụ thể, rồi hiệu chỉnh rubric bằng ví dụ mẫu.** Khi hai người lệch nhau, thường vì họ hiểu tiêu chí khác nhau: một người coi "gửi được" là không có lỗi chính tả, người kia coi là phải đủ dữ kiện và đúng giọng. Cách xử lý là chỉ ra câu chữ cụ thể làm căn cứ, và nếu rubric còn mơ hồ (ví dụ "đủ tốt") thì sửa lại kèm ví dụ mẫu đã có điểm chuẩn.

### Vì sao các lựa chọn khác sai
- **Cứ để người thâm niên quyết:** không giải quyết gốc rễ là tiêu chí chưa thống nhất; lần sau vẫn lệch.
- **Lấy trung bình hai điểm:** điểm trung bình không tương ứng với bất kỳ trạng thái thực tế nào của tài liệu, và che mất lý do bất đồng.
- **Hỏi Claude:** mô hình không biết bối cảnh, khách hàng hay rủi ro pháp lý của bạn; nó chỉ đoán theo văn bản.

### Cách làm
Cùng mở rubric; mỗi người đánh dấu câu làm bằng chứng; lập 5 ví dụ mẫu có điểm; chạy lại đến khi cả hai cùng cho một mức.

> Mẹo thực tế: bất đồng đánh giá gần như luôn là bất đồng về tiêu chí, không phải về tài liệu — sửa tiêu chí trước.`
},
{
  id: 'qz-ccao-115',
  topic: 'claude',
  q: "[Output Evaluation] Claude recommends changing a supplier's payment terms and supports it with two clear charts. The charts are easy to read, but the underlying numbers were typed in by the same person who asked the question. What should the evaluation focus on first?",
  options: [
    "Whether the recommendation is easy to understand",
    "Whether the tone is confident enough for the decision meeting",
    "Whether the charts use the company colors",
    "Whether the input data is accurate and complete, because the output cannot be better than its inputs"
  ],
  answer: 3,
  explain: `**Đúng: kiểm tra dữ liệu đầu vào trước khi đánh giá kết luận.** Nguyên tắc "garbage in, garbage out" (rác vào thì rác ra): nếu số liệu công nợ, thời hạn hay sản lượng bị nhập sai, mọi biểu đồ và khuyến nghị đều đẹp mà vô nghĩa. Với khuyến nghị ảnh hưởng tới tiền, bước đầu tiên là đối chiếu vài dòng dữ liệu với nguồn gốc (hóa đơn, hợp đồng) và kiểm tra xem có thiếu khoản nào không.

### Vì sao các lựa chọn khác sai
- **Dễ hiểu là đủ:** dễ hiểu làm sai lệch lan nhanh hơn, vì người đọc tin ngay.
- **Giọng tự tin:** tự tin không phải bằng chứng; đây là kiểu đánh giá theo cảm giác.
- **Màu sắc biểu đồ:** thẩm mỹ không liên quan đến độ đúng của khuyến nghị.

### Cách làm
Chọn ngẫu nhiên 5 dòng trong dữ liệu, đối chiếu với hóa đơn hoặc hợp đồng; hỏi rõ dữ liệu lấy từ đâu và ngày nào; sau đó mới đọc kết luận.

> Mẹo thực tế: khi output là khuyến nghị tài chính, hãy hỏi "số này từ đâu ra?" trước khi hỏi "kết luận có hay không?".`
},
{
  id: 'qz-ccao-116',
  topic: 'claude',
  q: "[Output Evaluation] A Claude-written market summary says: 'Our CEO said last quarter that margins would recover.' The quote is fluent and specific, but you cannot find it in any transcript or recording. What is the correct handling?",
  options: [
    "Keep the quote, because Claude rarely invents direct quotations",
    "Remove the quotation and, if the point matters, attribute it only to a source you can open",
    "Turn it into a paraphrase and keep it without any attribution",
    "Add a note saying the source is internal, so readers know where it came from"
  ],
  answer: 1,
  explain: `**Đúng: bỏ câu trích, và chỉ giữ nội dung nếu bạn mở được nguồn gốc.** Trích dẫn trực tiếp là dạng nội dung dễ bị làm giả (fabricated) nhất: câu văn nghe rất thật, có cả chức danh và mốc thời gian, nhưng không transcript nào chứa nó. Nếu không xác minh được, bạn không được gán câu nói cho một người cụ thể — đó là rủi ro uy tín và pháp lý.

### Vì sao các lựa chọn khác sai
- **Tin vì Claude ít khi bịa trích dẫn:** không có cơ chế nào đảm bảo điều đó; mô hình tạo câu theo xác suất, và trích dẫn là mẫu câu rất dễ tạo.
- **Chuyển thành paraphrase không nguồn:** vẫn là gán một quan điểm cho CEO mà không có căn cứ; chỉ là khó phát hiện hơn.
- **Ghi "nguồn: nội bộ":** không có nguồn thật nào để kiểm tra; ghi như vậy làm người đọc tưởng đã được xác minh.

### Cách làm
Tìm trong email, biên bản họp, thông cáo; nếu có, trích đúng nguyên văn kèm ngày; nếu không, bỏ hẳn hoặc viết "theo một số phân tích nội bộ" mà không nêu tên người.

> Mẹo thực tế: nguyên tắc an toàn với trích dẫn — không mở được nguồn thì không gán cho người thật.`
},
{
  id: 'qz-ccao-117',
  topic: 'claude',
  q: "[Output Evaluation] A team changes the prompt for a recurring report. The new version looks better on the three examples they tried. What is the most useful check before rolling it out to 30 users?",
  options: [
    "Run the old and new prompts on a fixed set of past inputs and score both against the same rubric",
    "Ask the users whether they like the new style",
    "Roll it out, because three good examples are enough evidence",
    "Wait two weeks and count complaints"
  ],
  answer: 0,
  explain: `**Đúng: so sánh trên một tập kiểm thử cố định (regression set) với cùng rubric.** Ba ví dụ bạn tự chọn là mẫu quá nhỏ và dễ trùng với trường hợp bạn đã tối ưu. Tập cố định gồm 15–20 đầu vào thật trong quá khứ, chấm bằng cùng tiêu chí, sẽ cho biết bản mới tốt hơn ở đâu và có làm hỏng trường hợp nào không (hồi quy — regression, tức phần vốn chạy tốt nay kém đi).

### Vì sao các lựa chọn khác sai
- **Hỏi người dùng có thích không:** sở thích không đo được độ chính xác và độ phủ; hơn nữa họ chưa dùng bản mới trên việc thật.
- **Triển khai ngay:** 3 ví dụ không đủ để kết luận; nếu bản mới kém ở ca biên, 30 người sẽ cùng gặp.
- **Chờ hai tuần đếm khiếu nại:** khiếu nại chỉ ghi nhận việc đã hỏng; bạn mất hai tuần dữ liệu và niềm tin.

### Cách làm
Chọn 15–20 ca đã có kết quả tốt; chạy song song hai prompt; chấm mù (không biết bản nào mới); so sánh điểm và các ca hồi quy.

> Mẹo thực tế: đổi prompt cũng như đổi code — có test hồi quy thì mới dám triển khai rộng.`
},
{
  id: 'qz-ccao-118',
  topic: 'claude',
  q: "[Output Evaluation] For a leadership deck, Claude produces two openings. One is generic: it cannot be wrong, but it says little. The other makes three specific claims that are useful but need checking. What is the best evaluation decision?",
  options: [
    "Use the generic one, because an opening that cannot be wrong is the safest choice",
    "Merge them and delete the specific claims to avoid risk",
    "Use the specific one after verifying its three claims, and keep the generic phrasing as a fallback",
    "Use the specific one as is, because specific claims impress executives"
  ],
  answer: 2,
  explain: `**Đúng: giữ phần có giá trị (các câu cụ thể) nhưng chỉ sau khi kiểm chứng; phần chung chung để dành làm dự phòng.** Một mở đầu không thể sai thường cũng không nói gì, nên không giúp người nghe quyết định. Ba tuyên bố cụ thể mới là thứ tạo giá trị, nhưng chúng phải được đối chiếu với nguồn; nếu một tuyên bố sai, cả bài mất uy tín.

### Vì sao các lựa chọn khác sai
- **Chọn bản chung chung vì an toàn:** an toàn giả tạo; bài trình bày không có thông tin thì không đạt mục đích.
- **Bỏ hết tuyên bố cụ thể:** vứt đi phần giá trị nhất chỉ vì cần kiểm tra — kiểm tra là việc bình thường.
- **Dùng nguyên bản vì nghe ấn tượng:** ấn tượng không thay thế được tính đúng; một sai sót trước lãnh đạo tốn kém hơn nhiều so với việc mở nguồn.

### Cách làm
Đánh dấu 3 tuyên bố; với mỗi cái, tìm nguồn hoặc bỏ; viết lại thành câu có dẫn nguồn; giữ bản chung làm phương án nếu không xác minh kịp.

> Mẹo thực tế: "không thể sai" thường đồng nghĩa với "không đáng đọc". Giá trị nằm ở câu cụ thể, và câu cụ thể luôn cần nguồn.`
},
{
  id: 'qz-ccao-119',
  topic: 'claude',
  multi: true,
  q: "[Output Evaluation] A team wants to know whether Claude's answers are actually getting better over a quarter. Which two measurements are most useful? (Choose 2)",
  options: [
    "Score a fixed set of representative tasks with the same rubric each month",
    "Track how often a person has to correct the answer before it can be used",
    "Count the total number of chats created in the period",
    "Measure the average length of the answers",
    "Run a satisfaction survey once, at the end of the quarter"
  ],
  answer: [0, 1],
  explain: `**Đúng: một tập việc cố định chấm bằng rubric không đổi, và tỷ lệ phải sửa trước khi dùng.** Hai thước đo này lặp lại được theo thời gian nên so sánh được: cùng đầu vào, cùng tiêu chí, khác thời điểm. Tỷ lệ phải sửa (correction rate) đo trực tiếp công việc thật và phản ánh cả lỗi lẫn mức độ chấp nhận của người dùng.

### Vì sao các lựa chọn khác sai
- **Đếm số chat:** mức độ sử dụng không nói gì về chất lượng; dùng nhiều hơn có thể vì bắt buộc.
- **Đo độ dài câu trả lời:** dài hơn không có nghĩa tốt hơn; đây là thước đo hình thức.
- **Một khảo sát hài lòng duy nhất:** một lần đo không cho thấy xu hướng, và cảm giác hài lòng thường trôi theo thói quen.

### Cách làm
Chốt 15–20 việc đại diện; mỗi tháng chạy lại; chấm cùng rubric; ghi thêm tỷ lệ phải sửa và lý do sửa.

> Mẹo thực tế: muốn biết có tiến bộ, hãy giữ nguyên đề bài và thước đo; đổi thước đo thì mọi so sánh đều vô nghĩa.`
},
{
  id: 'qz-ccao-120',
  topic: 'claude',
  q: "[Output Evaluation] Claude explains a refund policy accurately, but the user needed to know whether one specific purchase qualifies. The explanation is correct and still does not answer the question. How should the output be evaluated?",
  options: [
    "Accept it, because accuracy is the only thing that matters",
    "Accurate but not fit for purpose: relevance to the actual question is a separate dimension to check",
    "Reject it as wrong",
    "Ask for a longer explanation so it eventually covers the case"
  ],
  answer: 1,
  explain: `**Đúng: đúng và đúng trọng tâm là hai tiêu chí khác nhau.** Output có thể chính xác về từng câu nhưng không giải quyết việc người dùng cần. Trong công việc, người dùng thường hỏi một tình huống cụ thể ("đơn này có được hoàn không?"), nên phải kiểm tra xem câu trả lời có áp dụng vào tình huống đó không, chứ không chỉ kiểm tra kiến thức chung.

### Vì sao các lựa chọn khác sai
- **Chấp nhận vì đúng:** người dùng vẫn phải tự làm nốt phần khó; output không tiết kiệm thời gian.
- **Bác bỏ vì sai:** nó không sai, chỉ lệch mục tiêu; gán nhãn sai làm mất dữ liệu đánh giá.
- **Yêu cầu dài hơn:** thêm chữ không tạo ra sự liên quan; cần nói rõ tình huống và hỏi lại đúng câu.

### Cách làm
Khi đánh giá, ghi hai dòng: "nội dung đúng?" và "trả lời đúng câu hỏi?". Nếu thiếu, yêu cầu Claude áp dụng vào dữ kiện cụ thể của người dùng.

> Mẹo thực tế: một câu trả lời đúng nhưng lạc đề vẫn là một câu trả lời chưa xong việc.`
},
{
  id: 'qz-ccao-121',
  topic: 'claude',
  q: "[Workflow Integration] A team wants Claude to classify incoming support tickets and route them automatically, with no person checking each result. What is the most appropriate step before going fully live?",
  options: [
    "Go fully live immediately, because classification is low-risk",
    "Automate everything and fix mistakes when customers complain",
    "Start with Claude's suggestion shown to the agent, then automate only categories that stay accurate over a measured period",
    "Make agents retype every category by hand to stay in control"
  ],
  answer: 2,
  explain: `**Đúng: chạy giai đoạn "human-in-the-loop" trước, đo độ chính xác theo từng nhóm, rồi mới tự động hoá nhóm đã ổn định.** Phân loại sai thường không làm mất dữ liệu nhưng làm khách hàng bị chuyển nhầm nhiều lần, rất khó chịu. Cách an toàn là để Claude đề xuất, người thật xác nhận (một cú nhấp), đồng thời ghi lại tỷ lệ đúng theo từng loại vé; sau vài tuần, nhóm nào đạt ngưỡng thì mới tự động.

### Vì sao các lựa chọn khác sai
- **Lên sóng ngay:** không có dữ liệu để biết nhóm nào sai; khi lỗi xuất hiện, nó đã đến tay khách.
- **Tự động hết rồi chờ khách khiếu nại:** khiếu nại là tín hiệu trễ và tốn niềm tin; sửa xong vẫn mất khách.
- **Nhân viên tự gõ lại toàn bộ:** loại bỏ luôn lợi ích của tự động hoá; đây là "kiểm soát" bằng cách không dùng gì cả.

### Cách làm
Chọn 2–3 loại vé phổ biến; bật chế độ gợi ý; đo tỷ lệ chấp nhận; đặt ngưỡng (ví dụ 95%) trước khi tự động; luôn có đường chuyển cho ca không chắc.

> Mẹo thực tế: tự động hoá nên bắt đầu ở chỗ sai thì hậu quả nhỏ và dễ phát hiện, rồi mới mở rộng dần.`
},
{
  id: 'qz-ccao-122',
  topic: 'claude',
  q: "[Workflow Integration] A finance team handles about 500 supplier invoices each night and wants Claude to extract totals and dates. Pasting each invoice into a chat is far too slow. What is the most suitable integration approach?",
  options: [
    "Call the Claude API from their existing batch job, with validation rules and a queue for items that need a person",
    "Have each clerk open 500 chats in parallel",
    "Put all 500 invoices in a single message and ask for one combined answer",
    "Wait for a manual upload button to appear in the chat interface"
  ],
  answer: 0,
  explain: `**Đúng: gọi API từ quy trình xử lý hàng loạt có sẵn, kèm kiểm tra dữ liệu và hàng đợi cho ca cần người xem.** API (application programming interface) là cách chương trình của bạn gọi Claude trực tiếp thay vì qua giao diện chat, nên chạy được 500 lần mỗi đêm mà không cần ai bấm. "Batch" là xử lý theo lô. Vì dữ liệu tài chính không được sai, cần bước kiểm tra (tổng khớp với chứng từ, ngày hợp lệ) và hàng đợi (queue) chứa các hóa đơn không đọc được để người thật xử lý.

### Vì sao các lựa chọn khác sai
- **Mỗi người mở hàng trăm chat:** không thể mở rộng, dễ sót, và không có cách nào đối chiếu kết quả.
- **Dồn 500 hóa đơn vào một tin nhắn:** vượt ngữ cảnh, kết quả khó truy vết, và một lỗi ở giữa làm hỏng cả lô.
- **Chờ tính năng upload thủ công:** không giải quyết được yêu cầu tự động, hằng đêm.

### Cách làm
Chạy lô nhỏ 20 hóa đơn; đối chiếu kết quả với kiểm tra thủ công; thêm quy tắc kiểm tra và hàng đợi; theo dõi tỷ lệ lỗi trước khi tăng lên 500.

> Mẹo thực tế: tích hợp tự động nào cũng cần một "cửa thoát" cho trường hợp bất thường — nếu không, người vận hành sẽ phải sửa tay cả lô.`
},
{
  id: 'qz-ccao-123',
  topic: 'claude',
  q: "[Workflow Integration] A consultant drafts a proposal with Claude, then a designer edits it in a shared document. Months later the team must show which parts came from Claude and who changed them. Which workflow detail makes that possible?",
  options: [
    "Keeping the Claude chat open in a browser tab",
    "Saving the exact prompt, model, and Claude draft version next to the document, plus the document's edit history",
    "Asking Claude to remember the draft for the next session",
    "Naming the file 'final' so the version is clear"
  ],
  answer: 1,
  explain: `**Đúng: lưu lại prompt, model và bản nháp gốc cùng với lịch sử chỉnh sửa của tài liệu.** Đây là truy xuất nguồn gốc (provenance): biết nội dung nào do AI tạo, bằng prompt nào, model nào, và người nào sửa sau đó. Khi có khiếu nại hoặc kiểm toán, bạn cần chuỗi bằng chứng đó; nếu chỉ còn file cuối, không ai chứng minh được phần nào là của Claude.

### Vì sao các lựa chọn khác sai
- **Giữ tab chat đang mở:** đóng trình duyệt là mất; không phải bản lưu, không dùng để đối chiếu sau.
- **Nhờ Claude ghi nhớ:** mỗi phiên chat độc lập; mô hình không lưu nội dung giữa các phiên để bạn truy vấn.
- **Đặt tên "final":** tên file không cho biết nguồn gốc hay ai sửa; dễ trùng và vẫn mất dấu vết.

### Cách làm
Trong quy trình, lưu prompt và bản nháp vào cùng thư mục dự án; bật lịch sử phiên bản của tài liệu; ghi rõ ngày và model.

> Mẹo thực tế: quy tắc đơn giản — nếu cần chứng minh sau này, hãy lưu prompt và bản nháp ngay lúc tạo, đừng cố tái tạo.`
},
{
  id: 'qz-ccao-124',
  topic: 'claude',
  multi: true,
  q: "[Workflow Integration] A workflow has two Claude steps: first summarize a long report, then extract action items from that summary. Which two practices best reduce the risk of errors piling up? (Choose 2)",
  options: [
    "Keep the intermediate summary editable so a person can fix it before step two runs",
    "Store only the final output, to keep the workflow simple",
    "Define what a good summary must contain before automating step two",
    "Run both steps in a single prompt so there is no middle version to check",
    "Assume small errors are random and will cancel each other out"
  ],
  answer: [0, 2],
  explain: `**Đúng: giữ bản trung gian để người sửa, và định nghĩa trước thế nào là bản tóm tắt đạt.** Khi hai bước nối tiếp, lỗi ở bước một đi thẳng vào bước hai: nếu bản tóm tắt bỏ mất một rủi ro, bước hai không thể trích ra hành động cho rủi ro đó. Vì vậy phải có điểm kiểm tra giữa hai bước, và tiêu chí rõ ràng để biết bản tóm tắt đã đủ.

### Vì sao các lựa chọn khác sai
- **Chỉ giữ kết quả cuối:** khi kết quả sai, bạn không biết do tóm tắt hay do trích xuất; mất khả năng chẩn đoán.
- **Gộp hai bước vào một prompt:** không có bản trung gian để kiểm tra, và khó biết bước nào hỏng; prompt dài cũng dễ bị bỏ sót yêu cầu.
- **Cho rằng lỗi sẽ triệt tiêu nhau:** lỗi trong trích xuất thường cộng dồn (thiếu mục này kéo theo thiếu mục khác), không tự triệt tiêu.

### Cách làm
Bước 1: yêu cầu bản tóm tắt theo checklist; người xác nhận. Bước 2: trích hành động từ bản đã chốt, kèm liên kết tới đoạn gốc.

> Mẹo thực tế: chuỗi nhiều bước AI cần "điểm dừng có người kiểm tra" ở giữa, không chỉ ở cuối.`
},
{
  id: 'qz-ccao-125',
  topic: 'claude',
  q: "[Workflow Integration] A company is choosing how to connect Claude to its document store. Which question matters most for a legal team that handles client contracts?",
  options: [
    "Does the interface have a dark mode?",
    "Can we change the logo color in the workspace?",
    "How many chats can one person create per day?",
    "How is our data handled after each request: is it retained, used for training, and who can access it?"
  ],
  answer: 3,
  explain: `**Đúng: hỏi thẳng về vòng đời dữ liệu — lưu bao lâu, có dùng để huấn luyện không, ai truy cập được.** Với hợp đồng khách hàng, đây là câu hỏi quyết định có được phép dùng hay không, chứ không phải giao diện. Cần kiểm tra tài liệu chính thức của nhà cung cấp, điều khoản dịch vụ, và nếu cần thì làm việc với bộ phận pháp chế; câu trả lời phải bằng văn bản, không phải cảm nhận.

### Vì sao các lựa chọn khác sai
- **Dark mode:** là sở thích giao diện, không liên quan đến rủi ro dữ liệu.
- **Màu logo:** không ảnh hưởng gì đến việc bảo vệ thông tin khách hàng.
- **Số chat mỗi ngày:** là giới hạn sử dụng, không phải câu hỏi về bảo mật.

### Cách làm
Lập danh sách câu hỏi: lưu trữ, huấn luyện, vị trí dữ liệu, quyền truy cập, quy trình xoá; gửi cho nhà cung cấp và lưu câu trả lời.

> Mẹo thực tế: trước khi đưa dữ liệu khách vào công cụ AI, hãy xác định "dữ liệu này được phép đi tới đâu?" — không chỉ "công cụ này có tiện không?".`
},
{
  id: 'qz-ccao-126',
  topic: 'claude',
  q: "[Workflow Integration] An HR team sets up Claude to answer employee questions from the staff handbook. What should the workflow include for the case where Claude cannot find the answer?",
  options: [
    "Let Claude answer from general knowledge so every employee gets a reply",
    "Search again with different wording until something appears",
    "Say it does not know, route the question to a named HR contact, and log the unanswered question",
    "Close the chat automatically without a reply"
  ],
  answer: 2,
  explain: `**Đúng: thừa nhận không biết, chuyển cho người phụ trách, và ghi lại câu hỏi chưa trả lời được.** Trong HR, trả lời sai về lương, nghỉ phép hay phúc lợi có thể dẫn tới quyết định sai của nhân viên và khiếu nại. Một câu trả lời thành thật "chưa có trong sổ tay" kèm đầu mối liên hệ là đủ; nhật ký câu hỏi còn giúp HR biết chính sách nào đang thiếu hoặc khó hiểu.

### Vì sao các lựa chọn khác sai
- **Trả lời bằng kiến thức chung:** chính sách mỗi công ty một khác; câu trả lời chung nghe hợp lý nhưng có thể trái quy định nội bộ.
- **Thử lại nhiều cách diễn đạt:** nếu tài liệu không có nội dung đó, việc diễn đạt lại không tạo ra câu trả lời; nó chỉ dẫn tới một câu bịa tự tin hơn.
- **Đóng chat không phản hồi:** nhân viên không biết phải làm gì tiếp; mất luôn cơ hội ghi nhận câu hỏi.

### Cách làm
Cấu hình câu trả lời mặc định: "Chưa có trong sổ tay" + liên kết tới người phụ trách; hàng tuần xem lại các câu chưa trả lời được.

> Mẹo thực tế: với trợ lý nội bộ, "không biết" đúng lúc có giá trị hơn một câu trả lời trôi chảy.`
},
{
  id: 'qz-ccao-127',
  topic: 'claude',
  q: "[Workflow Integration] A support team drafts replies with Claude and agents edit them before sending. Which measure best shows whether the drafts are reducing work rather than adding to it?",
  options: [
    "The number of chats opened each week",
    "Time spent per ticket and how much of each draft agents keep unchanged",
    "How many employees have tried the tool",
    "The average length of the replies"
  ],
  answer: 1,
  explain: `**Đúng: đo thời gian xử lý mỗi ticket và tỷ lệ giữ lại của bản nháp.** Nếu bản nháp tốt, thời gian trên mỗi ticket giảm và người dùng giữ nhiều câu nguyên văn. Nếu bản nháp tệ, họ phải viết lại gần hết — lúc đó công cụ làm tăng việc chứ không giảm. Đây là thước đo kết quả (outcome), không phải thước đo hoạt động (activity).

### Vì sao các lựa chọn khác sai
- **Số chat đã mở:** chỉ cho biết có người dùng thử, không cho biết có tiết kiệm thời gian.
- **Số người đã dùng thử:** mức độ áp dụng không đồng nghĩa với hiệu quả.
- **Độ dài câu trả lời:** dài hơn không có nghĩa tốt hơn; khách hàng thường muốn ngắn và đúng.

### Cách làm
Đo thời gian trung bình mỗi ticket trong 2 tuần trước và 2 tuần sau; ghi tỷ lệ nội dung được giữ nguyên; hỏi thêm khách hàng về chất lượng.

> Mẹo thực tế: công cụ AI chỉ đáng dùng khi đo được thời gian tiết kiệm; nếu không đo được, rất có thể nó đang thêm việc.`
},
{
  id: 'qz-ccao-128',
  topic: 'claude',
  q: "[Workflow Integration] A company wants to launch a Claude onboarding assistant that answers new-hire questions from internal policies. What content choice most affects whether the assistant is trustworthy?",
  options: [
    "Loading a large number of unrelated documents, to give Claude more to work with",
    "Whatever files the HR team happens to have on their laptops",
    "No documents, and rely on Claude's general knowledge of employment practice",
    "A small, current, approved set of policy documents with a clear owner who keeps them updated"
  ],
  answer: 3,
  explain: `**Đúng: một tập tài liệu nhỏ, đã được phê duyệt, còn hiệu lực, có người chịu trách nhiệm cập nhật.** Người mới hỏi những câu rất cụ thể ("mang thai bao lâu thì báo?"), và câu trả lời phải khớp chính sách công ty. Nhiều tài liệu không liên quan làm loãng ngữ cảnh và khiến Claude trộn thông tin từ nguồn khác; tài liệu cũ thì tạo ra câu trả lời tự tin nhưng sai.

### Vì sao các lựa chọn khác sai
- **Nhồi nhiều tài liệu không liên quan:** tăng nhiễu, giảm độ chính xác, và khó biết nguồn nào đã dùng.
- **Lấy file có sẵn trên laptop:** không ai kiểm soát phiên bản, có thể là bản cũ hoặc tài liệu nội bộ không nên phổ biến.
- **Không dùng tài liệu:** chính sách mỗi công ty khác nhau; câu trả lời chung có thể mâu thuẫn quy định nội bộ.

### Cách làm
Chọn 10–15 tài liệu cốt lõi; gán chủ sở hữu và ngày cập nhật; mỗi quý rà soát; ghi rõ trong câu trả lời nguồn đã dùng.

> Mẹo thực tế: trợ lý nội bộ tốt không phải nhờ nhiều tài liệu, mà nhờ đúng tài liệu và được cập nhật.`
},
{
  id: 'qz-ccao-129',
  topic: 'claude',
  multi: true,
  q: "[Workflow Integration] A back-office team handles contracts, invoices, and internal memos all day. Which two are appropriate ways to integrate Claude into this work? (Choose 2)",
  options: [
    "Drafting a first-pass summary of a long contract for a person to verify",
    "Approving supplier payments automatically with no human check",
    "Extracting dates and amounts from invoices into a table, with a validation step",
    "Replacing the contract management system entirely",
    "Deleting memos that Claude thinks are unimportant"
  ],
  answer: [0, 2],
  explain: `**Đúng: dùng Claude để làm bản nháp và trích xuất có kiểm tra, giữ người thật ở khâu quyết định.** Tóm tắt hợp đồng và bóc tách dữ liệu là việc lặp lại, tốn thời gian đọc, và sai sót thường dễ phát hiện khi đối chiếu với bản gốc. Đây là kiểu việc phù hợp: AI tăng tốc, người kiểm chứng.

### Vì sao các lựa chọn khác sai
- **Tự động phê duyệt thanh toán:** sai một lần là mất tiền thật; không có người kiểm tra thì không có cơ chế chặn.
- **Thay thế hoàn toàn hệ thống quản lý hợp đồng:** hệ thống đó giữ metadata, phân quyền và lịch sử; Claude không thay thế được các chức năng này.
- **Xoá memo theo đánh giá của AI:** không thể đảo ngược và không có căn cứ; rủi ro mất thông tin là quá lớn.

### Cách làm
Chọn việc có đầu ra kiểm tra được; luôn kèm bước đối chiếu nguồn; giữ người phê duyệt cho việc liên quan tiền và pháp lý.

> Mẹo thực tế: nguyên tắc phân vai — AI làm bản nháp và trích xuất, người làm quyết định và chịu trách nhiệm.`
},
{
  id: 'qz-ccao-130',
  topic: 'claude',
  q: "[Workflow Integration] A workflow asks Claude to summarize a weekly report, but some weeks the source file is missing or empty. What is the best design?",
  options: [
    "Let Claude fill the gap with plausible content so the report always ships on time",
    "Detect the missing input and send that week to a person, with a clear message about what failed",
    "Send the prompt anyway and hope Claude notices the missing file",
    "Remove the workflow completely"
  ],
  answer: 1,
  explain: `**Đúng: kiểm tra đầu vào trước, và nếu thiếu thì chuyển cho người kèm thông báo rõ.** Tự động hoá tốt phải xử lý được ngoại lệ: khi không có dữ liệu, hệ thống nên dừng lại và nói chính xác thiếu gì (tên file, ngày, bước nào), thay vì tạo ra nội dung nghe hợp lý nhưng không có thật. Cách này giữ được niềm tin vào quy trình.

### Vì sao các lựa chọn khác sai
- **Bịa nội dung cho đủ báo cáo:** đây là rủi ro lớn nhất; báo cáo thiếu dữ liệu vẫn dễ phát hiện hơn báo cáo sai số liệu.
- **Gửi prompt và hy vọng:** Claude không thể đọc file không tồn tại; nó có thể trả lời chung chung hoặc bịa.
- **Bỏ hẳn quy trình:** phản ứng thái quá với một lỗi có thể phòng ngừa bằng kiểm tra đầu vào.

### Cách làm
Thêm bước kiểm tra file tồn tại và không rỗng; nếu lỗi, gửi thông báo kèm tên file và người phụ trách; ghi log để đếm số lần thiếu.

> Mẹo thực tế: quy trình tự động phải "kêu to" khi thiếu dữ liệu; im lặng tạo ra báo cáo sai trông như thật.`
},
{
  id: 'qz-ccao-131',
  topic: 'claude',
  q: "[Workflow Integration] A manager must show whether a Claude-assisted reporting workflow is worth its cost. Which comparison is most credible?",
  options: [
    "Ask the team whether they feel faster",
    "Count how many prompts were written in the period",
    "Compare this quarter's report length with last quarter's",
    "Compare the same reporting task before and after, measuring hours, rework, and error rate"
  ],
  answer: 3,
  explain: `**Đúng: so sánh cùng một việc trước và sau, đo giờ làm, số lần phải sửa và tỷ lệ lỗi.** Đây là đo có nhóm đối chứng (baseline): cùng loại báo cáo, cùng người hoặc nhóm tương đương, cùng kỳ. "Cảm giác nhanh hơn" là chủ quan và dễ bị ảnh hưởng bởi hiệu ứng mới lạ; số giờ và số lần sửa là dữ liệu kiểm chứng được.

### Vì sao các lựa chọn khác sai
- **Hỏi cảm giác:** không so sánh được giữa các nhóm và dễ thổi phồng; dùng bổ trợ thì được, làm bằng chứng chính thì không.
- **Đếm số prompt:** hoạt động nhiều không chứng minh tiết kiệm; có thể đang phải viết lại prompt rất nhiều.
- **So độ dài báo cáo:** độ dài không phải giá trị; báo cáo dài hơn có thể do thêm việc.

### Cách làm
Chọn 4–6 báo cáo tương đương; ghi giờ trước/sau; đếm số vòng sửa; theo dõi lỗi được khách hàng phản ánh; tính cả chi phí công cụ.

> Mẹo thực tế: khi trình bày ROI, hãy nói rõ đã đo gì và bỏ qua chi phí nào — con số trung thực có sức thuyết phục hơn con số đẹp.`
},
{
  id: 'qz-ccao-132',
  topic: 'claude',
  q: "[Workflow Integration] A shared prompt for a weekly report is improved, but half the team keeps using the old version from their own notes. What is the best integration practice?",
  options: [
    "Keep the prompt in one shared, documented place and tell users to stop keeping local copies",
    "Email the new prompt and assume everyone will switch",
    "Maintain several versions so that nobody is blocked",
    "Ask each person to rewrite the prompt in their own words"
  ],
  answer: 0,
  explain: `**Đúng: một nguồn duy nhất (single source of truth) cho prompt, có ghi chú thay đổi, và hướng dẫn dùng bản đó.** Khi prompt nằm rải rác, mỗi người dùng một phiên bản, kết quả khác nhau và không ai biết vì sao. Một nơi chung (ví dụ Project hoặc trang tài liệu) giúp cập nhật một lần là cả nhóm có, và khi có sự cố thì truy được phiên bản nào đã dùng.

### Vì sao các lựa chọn khác sai
- **Gửi email rồi mặc định mọi người đổi:** email dễ bị trôi; không có nơi tra cứu, người mới vào không biết bản nào đúng.
- **Giữ nhiều phiên bản song song:** chính là nguyên nhân của sự thiếu nhất quán; "không ai bị chặn" nhưng chất lượng không đồng đều.
- **Mỗi người tự viết lại:** mất luôn lợi ích của việc chuẩn hoá; khó so sánh và khó cải tiến.

### Cách làm
Đặt prompt trong Project hoặc tài liệu dùng chung; ghi phiên bản và ngày; khi sửa, thông báo kèm thay đổi; khoá các bản cũ.

> Mẹo thực tế: bất cứ thứ gì cả nhóm phải dùng giống nhau (prompt, rubric, checklist) đều cần một chỗ duy nhất để tra cứu.`
},
{
  id: 'qz-ccao-133',
  topic: 'claude',
  multi: true,
  q: "[Workflow Integration] A developer team wants Claude to work across their code repository, run tests, and iterate on failures. Which two practices best fit this kind of agentic workflow? (Choose 2)",
  options: [
    "Work on a branch and require human review before merging",
    "Give it unrestricted production credentials so it can fix issues faster",
    "Run the test suite after changes and require it to report failing cases before finishing",
    "Let it commit directly to the main branch to save review time",
    "Keep all changes in one large rewrite so the intent stays together"
  ],
  answer: [0, 2],
  explain: `**Đúng: làm trên nhánh riêng, có người review trước khi gộp, và bắt buộc chạy test rồi báo cáo các ca còn lỗi.** Agentic workflow (quy trình có tác nhân tự hành động) nghĩa là Claude không chỉ trả lời mà còn sửa file, chạy lệnh, thử lại. Vì nó hành động thay bạn, phải có giới hạn: môi trường cách ly (branch), bước kiểm chứng (test), và người phê duyệt.

### Vì sao các lựa chọn khác sai
- **Đưa credential production không giới hạn:** vi phạm nguyên tắc đặc quyền tối thiểu (least privilege); một lệnh sai có thể xoá dữ liệu thật.
- **Commit thẳng vào nhánh chính:** bỏ qua review, lỗi lọt vào bản dùng chung; khó truy vết.
- **Gộp tất cả thành một lần viết lại lớn:** diff khổng lồ rất khó review; nên chia nhỏ để kiểm tra từng phần.

### Cách làm
Tạo branch; yêu cầu chạy test sau mỗi thay đổi và in kết quả; người thật đọc diff; chỉ gộp khi test xanh.

> Mẹo thực tế: với AI có quyền sửa file, "chạy được test" quan trọng hơn "đọc code thấy hay" — test là bằng chứng, còn cảm giác thì không.`
},
{
  id: 'qz-ccao-134',
  topic: 'claude',
  q: "[Workflow Integration] A team's weekly report task is identical every week: same inputs, same format, same audience. Which workflow design is most maintainable?",
  options: [
    "Store the instructions, format, and reference inputs once in a reusable Project",
    "Start a new chat every week and type the instructions from scratch",
    "Save a bookmark to last week's chat and reuse that thread",
    "Keep the prompt only in one person's personal notes"
  ],
  answer: 0,
  explain: `**Đúng: đóng gói thành một quy trình tái sử dụng (Project) chứa hướng dẫn, định dạng và tài liệu mẫu.** Việc giống nhau lặp lại thì nên chuẩn hoá một lần, dùng nhiều lần; như vậy mọi người ra kết quả cùng cấu trúc và khi cần sửa chỉ sửa một chỗ. Project là không gian có hướng dẫn và tài liệu riêng, phù hợp cho việc lặp lại theo tuần.

### Vì sao các lựa chọn khác sai
- **Chat mới, gõ lại từ đầu:** tốn thời gian và mỗi người gõ một kiểu; chất lượng phụ thuộc trí nhớ.
- **Bookmark sang chat cũ:** nội dung cũ làm nhiễu, và chat cũ có thể đã trôi khỏi ngữ cảnh; không rõ ràng cho người khác dùng.
- **Giữ trong sổ tay cá nhân:** không chia sẻ được, người nghỉ là mất quy trình.

### Cách làm
Tạo Project với một trang hướng dẫn, một file định dạng mẫu, danh sách nguồn; ghi rõ ai cập nhật; dùng thử 2 tuần rồi chốt.

> Mẹo thực tế: nếu một việc lặp lại hàng tuần, đừng để nó phụ thuộc vào việc ai gõ prompt giỏi hơn.`
},
{
  id: 'qz-ccao-135',
  topic: 'claude',
  q: "[Workflow Integration] A team wants Claude to read files from a shared drive and also write summaries back into that drive. What should the review cover before write access is enabled?",
  options: [
    "Only whether the feature is available on the current plan",
    "Whether the drive is fast enough for the files",
    "Whether the interface supports nested folders",
    "Who can trigger writes, what gets written, and whether a person approves before anything changes"
  ],
  answer: 3,
  explain: `**Đúng: review quyền ghi — ai kích hoạt, ghi cái gì, và ai duyệt trước khi thay đổi.** Quyền đọc ít rủi ro hơn quyền ghi nhiều: ghi có thể tạo file sai, ghi đè bản gốc, hoặc đưa dữ liệu nhạy cảm vào nơi không phù hợp. Cần giới hạn phạm vi (chỉ thư mục dự án), quy tắc đặt tên file rõ ràng, và một bước người xác nhận nếu file được dùng cho việc quan trọng.

### Vì sao các lựa chọn khác sai
- **Chỉ kiểm tra gói dịch vụ:** tính năng có hay không không nói gì về an toàn dữ liệu.
- **Tốc độ ổ đĩa:** không liên quan đến rủi ro khi ghi.
- **Hỗ trợ thư mục lồng nhau:** là chi tiết giao diện, không phải kiểm soát truy cập.

### Cách làm
Chọn một thư mục riêng cho output; bật lịch sử phiên bản; quy định ai được bấm "ghi"; chạy thử với vài file.

> Mẹo thực tế: đọc thì cần kiểm tra độ chính xác; ghi thì cần kiểm tra quyền và khả năng hoàn tác.`
},
{
  id: 'qz-ccao-136',
  topic: 'claude',
  q: "[Responsible Use] A marketing team uses Claude to draft product descriptions that include health claims about a supplement. Which practice best reduces the risk of misleading customers?",
  options: [
    "Publish Claude's draft unchanged because it sounds professional",
    "Add a disclaimer that Claude wrote it and move on",
    "Have a qualified reviewer verify every health claim against approved sources before publishing",
    "Ask Claude to make the claims stronger so they stand out"
  ],
  answer: 2,
  explain: `**Đúng: người có chuyên môn kiểm chứng từng claim sức khoẻ trước khi đăng.** Claude có thể viết câu chữ trôi chảy nhưng không tự bảo đảm sự thật; claim sức khoẻ ảnh hưởng người dùng và pháp lý. Quy trình đúng là human-in-the-loop: AI soạn draft, người chịu trách nhiệm duyệt nội dung và đối chiếu nguồn đã phê duyệt.

### Vì sao các lựa chọn khác sai
- **Đăng nguyên bản vì văn phong chuyên nghiệp:** văn phong không đồng nghĩa đúng sự thật.
- **Chỉ thêm disclaimer:** disclaimer không sửa sai; claim sai vẫn gây hại và rủi ro pháp lý.
- **Yêu cầu Claude viết mạnh hơn:** tăng rủi ro phóng đại, vi phạm quảng cáo.`
},
{
  id: 'qz-ccao-137',
  topic: 'claude',
  q: "[Prompting Basics] A user wants Claude to summarize a 40-page contract into bullet points for a non-lawyer. Which prompt is most effective?",
  options: [
    "Summarize this.",
    "Read the contract and give me bullets.",
    "Summarize this contract for a non-lawyer in 8-10 bullets; focus on obligations, deadlines, and penalties; skip boilerplate.",
    "Make it short."
  ],
  answer: 2,
  explain: `**Đúng: nêu rõ audience, format, phạm vi và độ dài.** Prompt tốt chỉ rõ: người đọc (non-lawyer), số lượng bullet, trọng tâm (obligations/deadlines/penalties) và những gì bỏ qua. Claude tuân theo ràng buộc rõ ràng hơn.

### Vì sao các lựa chọn khác sai
- **"Summarize this."**: không có ràng buộc, kết quả khó kiểm soát.
- **"Read the contract and give me bullets."**: chỉ thêm format, thiếu trọng tâm.
- **"Make it short."**: mơ hồ, không nói ngắn bao nhiêu và giữ gì.`
}
,
{
  id: 'qz-ccao-138',
  topic: 'claude',
  multi: true,
  q: "[Responsible Use] A company deploys Claude to answer customer emails. Which TWO controls best protect customer data? (Choose 2)",
  options: [
    "Disable logging of conversation content where possible",
    "Share full customer records in every prompt for context",
    "Restrict access to approved staff and review outputs",
    "Publish all chats publicly for transparency",
    "Let any employee paste arbitrary data"
  ],
  answer: [0, 2],
  explain: `**Đúng: giảm lưu trữ dữ liệu nhạy cảm và giới hạn truy cập + review output.** Hai lớp kiểm soát: kỹ thuật (không lưu nội dung) và tổ chức (quyền + rà soát). 

### Vì sao các lựa chọn khác sai
- **Chia sẻ toàn bộ hồ sơ khách hàng:** vi phạm tối thiểu hoá dữ liệu.
- **Công khai chat:** lộ dữ liệu cá nhân.
- **Cho mọi nhân viên paste dữ liệu tuỳ ý:** không kiểm soát nguồn và phạm vi.`
},
{
  id: 'qz-ccao-139',
  topic: 'claude',
  q: '[Product Selection] A content team needs to create long-form blog posts with consistent brand voice and wants to reuse research documents across multiple writing sessions. Which Claude interface is the best fit?',
  options: [
    'Claude.ai free chat for each post',
    'Claude Code in the terminal',
    'Projects with shared knowledge base and custom instructions',
    'API with a custom-built writing application'
  ],
  answer: 2,
  explain: `**Đúng: Projects cung cấp knowledge base dùng chung và custom instructions để giữ giọng văn nhất quán.** Projects cho phép tải tài liệu tham chiếu một lần, đặt hướng dẫn cấp project (custom instructions) áp dụng cho mọi cuộc trò chuyện trong project, và chia sẻ với cả nhóm. Đây chính là tính năng thiết kế cho việc lặp lại có ngữ cảnh chung.
### Vì sao các lựa chọn khác sai
- **Claude.ai free chat:** mỗi phiên độc lập, không lưu tài liệu hay hướng dẫn giữa các phiên, phải tải lại và nhắc lại yêu cầu mỗi lần.
- **Claude Code:** dành cho lập trình viên làm việc với code repository, không phù hợp cho content writing.
- **API + custom app:** tốn công xây dựng và vận hành trong khi Projects đã có sẵn chức năng cần thiết.`
},
{
  id: 'qz-ccao-140',
  topic: 'claude',
  q: '[Product Selection] A software engineer wants to refactor a large TypeScript codebase, run tests after each change, and iterate based on test failures. Which product should they use?',
  options: [
    'Claude.ai web chat',
    'Claude Code (CLI agent)',
    'Projects with uploaded source files',
    'Claude for Slack integration'
  ],
  answer: 1,
  explain: `**Đúng: Claude Code là agent CLI chạy trong terminal, có quyền đọc/ghi file, chạy lệnh, và lặp lại cho đến khi test pass.** Claude Code thiết kế cho agentic coding workflow: nó thao tác trực tiếp trên codebase, chạy test suite, đọc lỗi, sửa lại, và lặp lại — tất cả trong môi trường phát triển cục bộ của engineer.
### Vì sao các lựa chọn khác sai
- **Claude.ai web chat:** không truy cập được file hệ thống, không chạy lệnh, không lặp tự động.
- **Projects:** chỉ cung cấp ngữ cảnh đọc, không có quyền thực thi code hay chạy test.
- **Claude for Slack:** kênh giao tiếp, không phải môi trường phát triển.`
},
{
  id: 'qz-ccao-141',
  topic: 'claude',
  q: '[Product Selection] A small business owner with no coding skills wants to ask questions about their uploaded PDF catalogs and get answers with citations. Which product requires the least setup?',
  options: [
    'Build a RAG pipeline with the API',
    'Use Projects on Claude.ai and upload the PDFs',
    'Deploy a custom vector database and connect via MCP',
    'Write a Python script to chunk PDFs and call the API'
  ],
  answer: 1,
  explain: `**Đúng: Projects trên Claude.ai cho phép tải PDF lên và hỏi ngay, không cần code hay hạ tầng.** Projects xử lý tự động việc trích xuất văn bản từ PDF, lập chỉ mục, và trích dẫn nguồn trong câu trả lời. Đây là cách nhanh nhất cho người không kỹ thuật.
### Vì sao các lựa chọn khác sai
- **RAG pipeline với API:** cần kiến thức lập trình, vector DB, embedding model, và việc vận hành.
- **Vector DB + MCP:** phức tạp tương tự, dành cho nhà phát triển.
- **Python script:** yêu cầu code, xử lý chunking, embedding, và gọi API thủ công.`
},
{
  id: 'qz-ccao-142',
  topic: 'claude',
  multi: true,
  q: '[Product Selection] A team needs to analyze customer feedback spread across 200 support tickets. They want to upload all tickets once, then run multiple analyses (sentiment, common issues, feature requests) over several days. Which TWO products support this workflow? (Choose 2)',
  options: [
    'Projects on Claude.ai with all tickets uploaded',
    'Claude.ai free chat, pasting 20 tickets per session',
    'Claude Code with tickets checked into the repository',
    'API with a persistent vector store and session management',
    'Claude for Slack, forwarding each ticket individually'
  ],
  answer: [0, 3],
  explain: `**Đúng: Projects (lưu knowledge base dùng lại nhiều phiên) và API với vector store bền vững (custom workflow).** Cả hai đều cho phép nạp dữ liệu một lần và truy vấn lặp lại. Projects phù hợp cho team dùng giao diện web; API phù hợp khi cần tích hợp vào quy trình tự động hoặc ứng dụng riêng.
### Vì sao các lựa chọn khác sai
- **Free chat dán 20 vé mỗi lần:** ngữ cảnh không liên tục, phải tải lại, giới hạn độ dài context.
- **Claude Code với ticket trong repo:** Claude Code làm việc với code, không phải dữ liệu ticket thô; cách này cồng kềnh.
- **Slack chuyển từng vé:** không tập trung được dữ liệu, mất ngữ cảnh phân tích tổng thể.`
},
{
  id: 'qz-ccao-143',
  topic: 'claude',
  q: '[Product Selection] A data analyst wants to use Claude to write SQL queries against their company database. They need to run the queries and see results immediately. Which product is appropriate?',
  options: [
    'Claude.ai chat with database schema pasted in',
    'Claude Code with MCP server connected to the database',
    'Projects with database credentials uploaded as a file',
    'API with database connection string in the prompt'
  ],
  answer: 1,
  explain: `**Đúng: Claude Code kết nối MCP (Model Context Protocol) server cho database cho phép truy vấn thực tế.** MCP server là cầu nối chuẩn hóa: Claude Code gọi tool qua MCP để chạy SQL thật trên database, lấy kết quả, và lặp lại. Đây là cách an toàn và có kiểm soát để AI tương tác với dữ liệu thật.
### Vì sao các lựa chọn khác sai
- **Chat với schema dán vào:** chỉ sinh SQL lý thuyết, không chạy được, không thấy kết quả thực.
- **Projects với credentials file:** Projects không thực thi code hay kết nối database; upload credentials còn vi phạm bảo mật.
- **API với connection string trong prompt:** lộ credentials, không có khả năng chạy query, và prompt không phải nơi đặt secret.`
},
{
  id: 'qz-ccao-144',
  topic: 'claude',
  q: '[Product Selection] A marketing team of five people wants to collaboratively refine prompts for ad copy, share successful prompts, and maintain a library of approved prompts. Which product feature best supports this?',
  options: [
    'Individual Claude.ai chats with personal prompt notes',
    'Projects with shared custom instructions and team access',
    'Claude Code with prompt files in git',
    'API with a prompt management database'
  ],
  answer: 1,
  explain: `**Đúng: Projects hỗ trợ chia sẻ cấp team, custom instructions dùng chung, và knowledge base tập trung.** Các thành viên trong project cùng thấy và dùng các hướng dẫn, tài liệu, và prompt mẫu đã duyệt. Thay đổi một lần áp dụng cho cả nhóm.
### Vì sao các lựa chọn khác sai
- **Chat cá nhân với ghi chú:** không chia sẻ được, mỗi người một phiên bản, khó đồng bộ.
- **Claude Code + git:** quá kỹ thuật cho marketing team; git không thay thế được giao diện cộng tác.
- **API + database:** phải tự xây dựng toàn bộ giao diện quản lý prompt và phân quyền.`
},
{
  id: 'qz-ccao-145',
  topic: 'claude',
  q: '[Product Selection] A customer support lead wants to deploy an AI assistant that reads the internal knowledge base and answers agent questions in real time during live chats. The assistant must not store conversation data. Which deployment approach is most suitable?',
  options: [
    'Projects on Claude.ai with the knowledge base uploaded',
    'API integration with stateless requests and no logging',
    'Claude Code running on each agent machine',
    'Claude for Slack with the knowledge base in a channel'
  ],
  answer: 1,
  explain: `**Đúng: API stateless cho phép kiểm soát vòng đời dữ liệu — không lưu log, không giữ state giữa các request.** Với yêu cầu real-time trong live chat và không lưu dữ liệu hội thoại, API là lựa chọn duy nhất cho phép: (1) gửi ngữ cảnh knowledge base + câu hỏi, (2) nhận câu trả lời, (3) huỷ request/response ngay. Projects và Slack đều lưu lịch sử hội thoại.
### Vì sao các lựa chọn khác sai
- **Projects:** lưu toàn bộ lịch sử chat trong project, không tắt được.
- **Claude Code:** chạy local trên máy agent, không phù hợp cho assistant real-time trong giao diện chat hỗ trợ.
- **Claude for Slack:** lưu tin nhắn trong Slack, không đáp ứng yêu cầu không lưu dữ liệu.`
},
{
  id: 'qz-ccao-146',
  topic: 'claude',
  multi: true,
  q: '[Product Selection] An enterprise needs to give 200 employees access to Claude for general productivity (writing, summarizing, coding help). They want centralized billing, admin controls, and the ability to enforce data handling policies. Which TWO plans/features should they evaluate? (Choose 2)',
  options: [
    'Claude Pro individual subscriptions',
    'Claude Team plan with admin console',
    'Claude Enterprise plan with SSO and audit logs',
    'Free tier with shared login credentials',
    'API keys distributed to each employee'
  ],
  answer: [1, 2],
  explain: `**Đúng: Team plan (cho nhóm nhỏ đến trung bình) và Enterprise plan (cho tổ chức lớn) cung cấp billing tập trung, admin console, SSO, audit logs.** Đây là hai gói dành cho tổ chức: Team cho phép quản lý thành viên, thanh toán một lần; Enterprise thêm SSO, domain capture, audit logs, và các kiểm soát tuân thủ.
### Vì sao các lựa chọn khác sai
- **Pro cá nhân:** không có quản trị tập trung, mỗi người thanh toán riêng, không audit.
- **Free tier chia sẻ đăng nhập:** vi phạm điều khoản, không bảo mật, không kiểm soát.
- **API key phân phát cho từng nhân viên:** không phải giao diện người dùng cuối, không có admin console cho việc dùng chat.`
},
{
  id: 'qz-ccao-147',
  topic: 'claude',
  q: '[Product Selection] A researcher needs to analyze 50 academic papers (PDFs, 20-40 pages each) and extract methodology, findings, and limitations into a structured table. They will iterate on the extraction criteria over several sessions. Which product is the best fit?',
  options: [
    'Claude.ai free chat, uploading 5 papers per session',
    'Projects with all 50 papers uploaded to the knowledge base',
    'Claude Code with papers in the working directory',
    'API with manual PDF text extraction each time'
  ],
  answer: 1,
  explain: `**Đúng: Projects cho phép nạp 50 PDF một lần vào knowledge base, rồi truy vấn lặp lại nhiều phiên với tiêu chí thay đổi.** Knowledge base của Projects xử lý PDF lớn, giữ ngữ cảnh giữa các phiên, và trích dẫn nguồn (trang/đoạn) trong câu trả lời — quan trọng cho nghiên cứu học thuật.
### Vì sao các lựa chọn khác sai
- **Free chat 5 paper/lần:** vượt context window, mất ngữ cảnh giữa các phiên, phải tải lại liên tục.
- **Claude Code:** dành cho code, không tối ưu cho đọc PDF học thuật và trích xuất có trích dẫn.
- **API + extract thủ công:** phải tự viết code extract PDF, chunking, embedding, và quản lý state giữa các phiên.`
},
{
  id: 'qz-ccao-148',
  topic: 'claude',
  q: '[Product Selection] A developer wants to use Claude to generate boilerplate code for a new React component library, then iterate on the designs with visual feedback. They prefer working in their IDE. Which product integrates best?',
  options: [
    'Claude.ai web chat, copy-paste code to IDE',
    'Claude Code running in the terminal within the IDE',
    'Projects with component specs uploaded',
    'API called from a custom VS Code extension'
  ],
  answer: 1,
  explain: `**Đúng: Claude Code chạy trong terminal của IDE (VS Code, JetBrains, v.v.), đọc/ghi file trực tiếp, và làm việc cùng codebase.** Developer không cần chuyển ngữ cảnh; Claude Code sinh file, sửa file, chạy dev server, và lặp lại dựa trên feedback — tất cả trong môi trường phát triển quen thuộc.
### Vì sao các lựa chọn khác sai
- **Web chat copy-paste:** ngắt luồng làm việc, dễ sót dòng, không thấy kết quả chạy ngay.
- **Projects:** chỉ cung cấp ngữ cảnh đọc, không ghi file vào project hay chạy lệnh.
- **API + VS Code extension tự xây:** tốn công phát triển trong khi Claude Code đã có sẵn tích hợp terminal.`
},
{
  id: 'qz-ccao-149',
  topic: 'claude',
  q: '[Product Selection] A legal team needs to review contracts for specific clauses (indemnification, termination, liability cap) across 100+ documents. They want to upload once, run multiple reviews, and export findings. Which product supports this best?',
  options: [
    'Claude.ai chat, pasting one contract at a time',
    'Projects with all contracts in the knowledge base',
    'Claude Code with contracts in a folder',
    'API with a document processing pipeline'
  ],
  answer: 1,
  explain: `**Đúng: Projects knowledge base chấp nhận upload hàng loạt tài liệu pháp lý, cho phép truy vấn lặp lại ("tìm mọi điều khoản bồi thường"), và trích dẫn chính xác tài liệu + trang.** Đây là workflow review tài liệu lặp lại: nạp một lần, phân tích nhiều góc độ, xuất kết quả.
### Vì sao các lựa chọn khác sai
- **Chat dán từng hợp đồng:** giới hạn context, không quy mô được 100+ văn bản, mất ngữ cảnh.
- **Claude Code:** không thiết kế cho review tài liệu pháp lý hàng loạt; không trích dẫn nguồn dễ dàng.
- **API + pipeline:** phải tự xây dựng toàn bộ quy trình upload, chunking, query, và export.`
},
{
  id: 'qz-ccao-150',
  topic: 'claude',
  multi: true,
  q: '[Product Selection] A startup is choosing between Projects and API for their internal knowledge assistant. Which TWO factors favor choosing the API? (Choose 2)',
  options: [
    'Need to embed the assistant inside their own web application',
    'Want a ready-to-use web interface for non-technical staff',
    'Require custom authentication and per-user data isolation',
    'Prefer no infrastructure management',
    'Need to share a single knowledge base across the team'
  ],
  answer: [0, 2],
  explain: `**Đúng: nhúng vào ứng dụng riêng (embedded) và xác thực/phân quyền dữ liệu tùy biến.** API cho phép: (1) tích hợp vào UI sản phẩm của bạn (chat widget, side panel), (2) kiểm soát hoàn toàn authentication, authorization, và data isolation theo user/tenant. Projects là SaaS có sẵn giao diện, không nhúng được, và quyền quản lý theo project không phải per-user.
### Vì sao các lựa chọn khác sai
- **Giao diện web sẵn sàng:** là ưu điểm của Projects, không phải API.
- **Không quản lý hạ tầng:** Projects lo hết hosting; API cần tự lo server/infra.
- **Knowledge base chia sẻ team:** Projects làm tốt việc này; API cần tự xây vector store và logic chia sẻ.`
},
{
  id: 'qz-ccao-151',
  topic: 'claude',
  q: '[Product Selection] A financial analyst needs to build a monthly reporting workflow: pull data from CSV exports, compute metrics, generate narrative summaries, and output formatted slides. They want to run this end-to-end with minimal manual steps. Which product is the best fit?',
  options: [
    'Claude.ai chat with CSV pasted each month',
    'Projects with CSV uploaded and custom instructions',
    'Claude Code with a script that reads CSV, calls tools, and writes slides',
    'API with a scheduled job and custom slide generation code'
  ],
  answer: 2,
  explain: `**Đúng: Claude Code có thể đọc file CSV cục bộ, tính toán (dùng Python/JS tool), sinh nội dung, và ghi file slide (PowerPoint/Markdown) — toàn bộ tự động trong một lệnh.** Analyst chỉ cần chạy {{claude-code "generate monthly report"}}; agent lo phần còn lại: đọc data, compute, viết narrative, xuất file.
### Vì sao các lựa chọn khác sai
- **Chat dán CSV:** giới hạn context, không tính toán được, không ghi file slide.
- **Projects:** không thực thi code, không đọc CSV cục bộ định kỳ, không xuất file.
- **API + scheduled job:** cần tự viết toàn bộ logic orchestration; Claude Code đã có sẵn agent loop.`
},
{
  id: 'qz-ccao-152',
  topic: 'claude',
  q: '[Product Selection] A teacher wants to create a study assistant for students: upload the syllabus and readings, let students ask questions, and see which source each answer comes from. The teacher is not technical. Which product should they use?',
  options: [
    'Build a RAG app with the API',
    'Create a Project, upload materials, and share the project link with students',
    'Use Claude Code with the syllabus in the repo',
    'Give students API keys and a Python notebook'
  ],
  answer: 1,
  explain: `**Đúng: Projects thiết kế chính cho use case này — upload tài liệu, chia sẻ project cho nhóm, câu trả lời kèm trích dẫn nguồn.** Teacher chỉ cần tạo project, tải syllabus/readings lên, mời học sinh (via link hoặc email), và học sinh hỏi trực tiếp trên giao diện web. Không cần code, không cần API key.
### Vì sao các lựa chọn khác sai
- **RAG app với API:** yêu cầu phát triển phần mềm, hosting, authentication.
- **Claude Code:** chạy local trên máy teacher, học sinh không truy cập được.
- **API key + notebook:** học sinh phải biết lập trình, quản lý key, chạy code.`
},
{
  id: 'qz-ccao-153',
  topic: 'claude',
  q: '[Product Selection] A security team needs to audit all Claude usage across the organization: who asked what, what data was sent, and what was returned. Which plan provides the necessary audit logs?',
  options: [
    'Free tier',
    'Pro plan',
    'Team plan',
    'Enterprise plan'
  ],
  answer: 3,
  explain: `**Đúng: Enterprise plan cung cấp audit logs chi tiết (ai, khi nào, prompt, response, dữ liệu up/download).** Đây là tính năng dành riêng cho tổ chức lớn có yêu cầu tuân thủ (compliance) và bảo mật: log đầy đủ để điều tra sự cố, chứng minh tuân thủ, và phát hiện rò rỉ dữ liệu. Team plan có admin console nhưng không có audit logs mức độ chi tiết như Enterprise.
### Vì sao các lựa chọn khác sai
- **Free/Pro:** dùng cá nhân, không có quản trị tổ chức.
- **Team:** có quản lý thành viên và billing, nhưng thiếu audit logs cấp độ enterprise.`
},
{
  id: 'qz-ccao-154',
  topic: 'claude',
  multi: true,
  q: '[Knowledge Config] A product manager is evaluating whether to use Projects or the API for a new feature that lets users chat with their own uploaded documents. Which TWO statements are true? (Choose 2)',
  options: [
    'Projects allows end-users to upload their own documents in a shared project',
    'API enables per-user document isolation with custom backend logic',
    'Projects supports custom UI branding and domain',
    'API requires you to manage document storage and indexing',
    'Projects charges per API call rather than per seat'
  ],
  answer: [1, 3],
  explain: `**Đúng: (1) API cho phép cách ly tài liệu theo user bằng backend tùy chỉnh; (3) API yêu cầu bạn tự quản lý storage/indexing (vendor không lo phần này).** Với API, bạn xây backend: user upload -> bạn lưu -> bạn index -> bạn gọi API kèm context. Với Projects, tài liệu ở cấp project (chia sẻ nhóm), không cách ly per-user; UI là của Anthropic; billing theo seat.
### Vì sao các lựa chọn khác sai
- **Projects cho user tự upload trong project chung:** user không upload được vào project của org; chỉ admin/member thêm tài liệu.
- **Projects hỗ trợ custom UI/domain:** Projects dùng giao diện Claude.ai chuẩn.
- **Projects tính tiền theo API call:** Projects billing theo seat/user, không theo token.`
},
{
  id: 'qz-ccao-155',
  topic: 'claude',
  q: '[Knowledge Config] A Project knowledge base contains 50 PDFs. A user asks a question that requires synthesizing information from three different documents. How does the knowledge base retrieval work by default?',
  options: [
    'It reads all 50 PDFs in full and then answers',
    'It searches for relevant chunks across all documents and includes top matches in context',
    'It only searches the most recently uploaded document',
    'It asks the user to specify which document to search'
  ],
  answer: 1,
  explain: `**Đúng: knowledge base dùng semantic search (tìm kiếm ngữ nghĩa) để lấy các đoạn (chunks) liên quan nhất từ tất cả tài liệu, rồi đưa vào context cho model.** Khi upload, tài liệu được chia nhỏ (chunk), vector hóa (embedding), và lưu trong vector store. Khi query, hệ thống tìm top-k chunks giống nhất về mặt ngữ nghĩa (không phụ thuộc từ khóa chính xác), ghép vào prompt làm ngữ cảnh. Điều này cho phép tổng hợp từ nhiều tài liệu khác nhau.
### Vì sao các lựa chọn khác sai
- **Đọc toàn bộ 50 PDF:** vượt context window (nhiều PDF 20-40 trang); không hiệu quả và tốn token.
- **Chỉ tài liệu mới nhất:** bỏ qua kiến thức trong 49 tài liệu còn lại.
- **Hỏi user chọn tài liệu:** knowledge base thiết kế để tự động tìm tài liệu liên quan, không cần user chỉ định.`
},
{
  id: 'qz-ccao-156',
  topic: 'claude',
  q: '[Knowledge Config] A team uploads a 200-page technical manual to a Project. They notice Claude sometimes misses details in the middle of long chapters. Which configuration change is most likely to help?',
  options: [
    'Increase the temperature to make answers more creative',
    'Enable a larger chunk size and overlap during indexing',
    'Delete the manual and re-upload as individual chapter files',
    'Ask Claude to read the whole manual before answering'
  ],
  answer: 1,
  explain: `**Đúng: tăng chunk size (kích thước đoạn) và overlap (chồng lấp) giúp giữ ngữ cảnh dài hơn, giảm việc cắt ngang giữa ý.** Mặc định chunking có thể cắt ngang câu hoặc đoạn quan trọng. Chunk lớn hơn (ví dụ 1000-1500 token) và overlap 10-20% giúp mỗi chunk chứa đủ một ý hoàn chỉnh, còn overlap đảm bảo ranh giữa hai chunk không mất thông tin.
### Vì sao các lựa chọn khác sai
- **Tăng temperature:** làm tăng sự ngẫu nhiên, không cải thiện retrieval; có thể gây hallucination.
- **Tách file chương:** thủ công, dễ sai sót, và Project vẫn chunk từng file — vấn đề cắt ngang vẫn có thể xảy ra.
- **Yêu cầu đọc toàn bộ:** không thể; context window không chứa 200 trang, và retrieval vẫn chỉ lấy top chunks.`
},
{
  id: 'qz-ccao-157',
  topic: 'claude',
  multi: true,
  q: '[Knowledge Config] A Project contains outdated policy documents mixed with current ones. Users get answers citing old policies. Which TWO actions best fix this? (Choose 2)',
  options: [
    'Add a note in custom instructions saying "ignore old policies"',
    'Remove or archive outdated documents from the knowledge base',
    'Upload a "current policies only" summary document and tell users to trust it',
    'Tag documents with version dates and update custom instructions to prefer newer versions',
    'Increase the number of retrieved chunks so the model sees both old and new'
  ],
  answer: [1, 3],
  explain: `**Đúng: (1) xoá/archiving tài liệu cũ khỏi knowledge base; (3) gắn tag phiên bản/ngày và hướng dẫn ưu tiên mới.** Retrieval tìm chunk giống ngữ nghĩa — nếu cả cũ và mới đều tương tự, model có thể trích dẫn sai. Cách gốc là loại bỏ nguồn cũ; cách bổ trợ là metadata (tag) + custom instructions để model ưu tiên chunk mới.
### Vì sao các lựa chọn khác sai
- **Note "ignore old policies":** model không biết chunk nào thuộc policy cũ trừ khi có metadata; instruction mơ hồ không đủ.
- **Tóm tắt "chỉ policy mới":** tạo nguồn thứ ba có thể sai/ lạc hậu; thêm độ phức tạp thay vì dọn dẹp nguồn gốc.
- **Tăng số chunk retrieved:** càng lấy nhiều chunk càng dễ lẫn cũ/lạ vào context, làm model bối rối hơn.`
},
{
  id: 'qz-ccao-158',
  topic: 'claude',
  q: '[Knowledge Config] A user wants Claude to answer questions based ONLY on the uploaded knowledge base, not its general training knowledge. Which custom instruction is most effective?',
  options: [
    '"Be helpful and accurate"',
    '"Only use information from the knowledge base. If the answer is not there, say you do not know."',
    '"Answer concisely"',
    '"Cite your sources"'
  ],
  answer: 1,
  explain: `**Đúng: instruction rõ ràng cấm dùng kiến thức ngoài và bắt buộc nói "không biết" khi KB thiếu thông tin.** Custom instructions áp dụng cho mọi tin nhắn trong project. Câu lệnh này thiết lập ranh giới chặt: model chỉ được dùng context từ KB (retrieved chunks), không được dùng parametric knowledge (kiến thức huấn luyện). Nếu KB không có, phải từ chối trả lời thay vì bịa.
### Vì sao các lựa chọn khác sai
- **"Be helpful and accurate":** quá chung chung, không cấm dùng kiến thức ngoài.
- **"Answer concisely":** chỉ kiểm soát độ dài, không kiểm soát nguồn kiến thức.
- **"Cite your sources":** model có thể trích dẫn nguồn bịa (hallucinated citation) nếu không cấm dùng kiến thức ngoài.`
},
{
  id: 'qz-ccao-159',
  topic: 'claude',
  q: '[Knowledge Config] A team uploads a mix of English and Vietnamese documents to a Project. A user asks in Vietnamese but gets an answer citing only English chunks. What is the most likely cause?',
  options: [
    'The knowledge base only indexes English documents',
    'Semantic search matches by meaning across languages, but the query may align better with English chunks',
    'Claude does not support Vietnamese in knowledge bases',
    'The user must specify the language in the query'
  ],
  answer: 1,
  explain: `**Đúng: semantic search (embedding đa ngôn ngữ) so khớp ý nghĩa chứ không phải từ khóa, nhưng chunk tiếng Anh có thể gần hơn về vector space do dữ liệu huấn luyện embedding thiên về tiếng Anh.** Embedding model (thường đa ngôn ngữ) map cả tiếng Việt và tiếng Anh vào cùng vector space. Tuy nhiên, do dữ liệu tiếng Anh chiếm đa số, vector tiếng Anh đôi khi "gần" query tiếng Việt hơn về mặt toán học, khiến retrieval trả về chunk tiếng Anh.
### Vì sao các lựa chọn khác sai
- **Chỉ index tiếng Anh:** knowledge base index tất cả tài liệu upload, không phân biệt ngôn ngữ.
- **Không hỗ trợ tiếng Việt:** knowledge base hoạt động đa ngôn ngữ; câu trả lời có thể bằng tiếng Việt.
- **Phải chỉ định ngôn ngữ:** retrieval tự động, không có tham số ngôn ngữ cho user.`
},
{
  id: 'qz-ccao-160',
  topic: 'claude',
  multi: true,
  q: '[Knowledge Config] A Project knowledge base returns irrelevant chunks for a specific technical query. Which TWO adjustments can improve retrieval precision? (Choose 2)',
  options: [
    'Restructure source documents with clear headings and section boundaries before re-uploading',
    'Increase temperature to 1.0',
    'Add a custom instruction to "search more carefully"',
    'Reduce the number of retrieved chunks (top-k) to focus on the most relevant',
    'Delete all documents and start over with a different embedding model'
  ],
  answer: [0, 3],
  explain: `**Đúng: (0) cấu trúc tài liệu rõ ràng (heading, section) giúp chunking giữ nguyên ngữ cảnh logic; (3) giảm top-k loại bỏ chunk nhiễu.** Chunking theo cấu trúc (heading-aware) tạo chunk gắn liền một chủ đề. Giảm top-k (ví dụ từ 10 xuống 5) chỉ giữ chunk nhất quán nhất, giảm ngữ cảnh thừa làm loãng prompt.
### Vì sao các lựa chọn khác sai
- **Tăng temperature:** chỉ ảnh hưởng generation, không ảnh hưởng retrieval.
- **Instruction "search more carefully":** retrieval chạy trước khi model thấy instruction; instruction không thay đổi vector search.
- **Xoá hết và đổi embedding model:** quá cực đoán; embedding model thường do platform quản lý, user không tự chọn.`
},
{
  id: 'qz-ccao-161',
  topic: 'claude',
  q: '[Knowledge Config] A user adds a new PDF to an existing Project knowledge base. When does the new document become searchable?',
  options: [
    'Immediately after upload',
    'After the next chat session starts',
    'After the platform processes and indexes it (usually a few minutes)',
    'Only after the user manually triggers re-indexing'
  ],
  answer: 2,
  explain: `**Đúng: platform xử lý (extract text, chunk, embed, index) mất vài phút tùy kích thước tài liệu.** Upload không đồng nghĩa sẵn sàng truy vấn ngay; hệ thống chạy pipeline bất đồng bộ: trích xuất văn bản -> chia chunk -> tạo embedding -> ghi vào vector store. Chỉ khi pipeline hoàn tất, chunks mới xuất hiện trong retrieval.
### Vì sao các lựa chọn khác sai
- **Ngay lập tức:** pipeline chưa kịp chạy; retrieval không thấy chunks mới.
- **Sau phiên chat tiếp theo:** không liên quan đến session; indexing là background job.
- **Trigger thủ công:** user không có nút re-index; platform tự động xử lý sau upload.`
},
{
  id: 'qz-ccao-162',
  topic: 'claude',
  q: '[Knowledge Config] A Project custom instruction says: "Always cite the document name and page number." The user asks a question, and the answer cites "Document.pdf, page 5" but that page does not contain the cited information. What is the most likely explanation?',
  options: [
    'The knowledge base retrieval returned a wrong chunk',
    'The model hallucinated the citation while following the instruction to cite',
    'The PDF page numbers are offset by one from the original',
    'The user misread the page number'
  ],
  answer: 1,
  explain: `**Đúng: model có thể bịa trích dẫn (hallucinated citation) để tuân thủ instruction "luôn trích dẫn" ngay cả khi chunk không hỗ trợ.** Instruction ép model phải xuất ra citation; nếu retrieved chunks không đủ cụ thể (ví dụ không có page number trong metadata, hoặc chunk không chứa thông tin cần thiết), model có thể sáng tạo một citation trông hợp lý. Đây là rủi ro khi ép citation mà không kiểm soát retrieval quality.
### Vì sao các lựa chọn khác sai
- **Retrieval trả chunk sai:** retrieval trả chunk theo độ tương đồng ngữ nghĩa; chunk có thể liên quan nhưng không chứa fact cụ thể — model vẫn có thể bịa citation.
- **Page number lệch 1:** có thể xảy ra nhưng ít hơn hallucination citation; thường metadata page number được extract đúng từ PDF.
- **User đọc sai:** giả định lỗi ở user không giải quyết được gốc rễ là model bịa citation.`
},
{
  id: 'qz-ccao-163',
  topic: 'claude',
  multi: true,
  q: '[Knowledge Config] A team wants to improve answer quality for a Project that handles technical troubleshooting. Which TWO knowledge base practices are most effective? (Choose 2)',
  options: [
    'Include troubleshooting guides with clear problem-solution pairs and error codes',
    'Upload all historical chat logs as context',
    'Structure documents with consistent headings: Symptom, Cause, Resolution, Prevention',
    'Add a 500-page generic product manual without section markers',
    'Set temperature to 0.8 for more creative solutions'
  ],
  answer: [0, 2],
  explain: `**Đúng: (0) tài liệu troubleshooting có cặp problem-solution + error code khớp trực tiếp với query; (2) cấu trúc heading nhất quán giúp chunking tách đúng ranh giới chủ đề.** Retrieval hiệu quả khi chunk chứa một vấn đề hoàn chỉnh (symptom + cause + resolution). Error code trong query khớp chính xác với error code trong chunk. Heading nhất quán cho phép chunking nhận diện section boundary.
### Vì sao các lựa chọn khác sai
- **Chat log lịch sử:** nhiễu, không cấu trúc, chứa thông tin cũ/ sai, làm loãng knowledge base.
- **Manual 500 trang không section:** chunking cắt ngang chủ đề, retrieval trả chunk mảnh không đủ ngữ cảnh.
- **Temperature 0.8:** generation parameter, không ảnh hưởng retrieval; creativity không phù hợp cho troubleshooting.`
},
{
  id: 'qz-ccao-164',
  topic: 'claude',
  q: '[Knowledge Config] A user notices that a Project answer includes a correct fact but cites the wrong document (the fact is in Document A, but citation says Document B). What should they do first?',
  options: [
    'Report it as a platform bug',
    'Check whether both documents contain similar content and the retrieval matched the wrong one',
    'Delete Document B from the knowledge base',
    'Add a custom instruction to "cite correctly"'
  ],
  answer: 1,
  explain: `**Đúng: kiểm tra trùng lặp nội dung giữa tài liệu — retrieval trả về chunk giống nhất về mặt ngữ nghĩa, có thể từ tài liệu sai nếu nội dung tương tự.** Semantic search không phân biệt "nguồn gốc" của fact; nếu Document A và B đều chứa đoạn văn tương tự (ví dụ boilerplate, định nghĩa chung), retrieval có thể trả chunk từ B. Cần kiểm tra nội dung trùng lặp trước khi hành động.
### Vì sao các lựa chọn khác sai
- **Báo bug nền tảng:** đây là hành vi bình thường của semantic search, không phải bug.
- **Xoá Document B:** quá vội; B có thể chứa thông tin khác độc nhất; xoá làm mất kiến thức.
- **Instruction "cite correctly":** instruction không thay đổi retrieval; model chỉ cite chunk mà retrieval đưa cho.`
},
{
  id: 'qz-ccao-165',
  topic: 'claude',
  q: '[Knowledge Config] A Project contains 100 documents. The team wants to restrict certain sensitive documents so only managers can access answers derived from them. How can this be achieved within Projects?',
  options: [
    'Add a password to sensitive documents before uploading',
    'Create a separate Project for sensitive documents and control membership',
    'Tag documents as "sensitive" and add a custom instruction to check user role',
    'Encrypt sensitive documents and only give managers the key'
  ],
  answer: 1,
  explain: `**Đúng: tách Project riêng cho tài liệu nhạy cảm và kiểm soát thành viên (membership) là cách Projects hỗ trợ phân quyền.** Projects không có RBAC (role-based access control) cấp document bên trong một project; mọi member của project truy cập được toàn bộ KB. Cách chuẩn là: Project A (công khai) cho toàn nhân viên, Project B (nhạy cảm) chỉ mời manager. Mỗi project có KB và membership độc lập.
### Vì sao các lựa chọn khác sai
- **Mật khẩu file:** Projects không hỗ trợ decrypt file khi indexing; file có password sẽ không đọc được.
- **Tag + instruction check role:** model không biết user là ai; custom instructions không có biến user role.
- **Mã hóa + chia key:** Projects không decrypt được file mã hóa để index.`
},
{
  id: 'qz-ccao-166',
  topic: 'claude',
  multi: true,
  q: '[Knowledge Config] A user wants to optimize a knowledge base for a FAQ bot: short questions, precise answers, low latency. Which TWO configurations help? (Choose 2)',
  options: [
    'Split documents into small, self-contained Q&A pairs (one question + answer per chunk)',
    'Keep documents as long chapters to preserve context',
    'Reduce top-k to 3-5 to minimize context size and latency',
    'Increase top-k to 20 for maximum coverage',
    'Disable citations to save tokens'
  ],
  answer: [0, 2],
  explain: `**Đúng: (0) chunking theo cặp Q&A tự chứa (atomic) khớp trực tiếp với query ngắn; (2) top-k nhỏ (3-5) giảm context, giảm latency, giảm chi phí token.** FAQ bot: user hỏi ngắn ("reset password?"), retrieval cần trả về ngay chunk chứa câu trả lời reset password. Chunk Q&A nhỏ + top-k nhỏ = nhanh, chính xác, rẻ.
### Vì sao các lựa chọn khác sai
- **Chương dài:** chunk chứa nhiều Q&A, retrieval trả chunk lớn, model phải tìm trong chunk -> chậm, tốn token.
- **Top-k 20:** context quá lớn, chậm, tốn tiền, nhiễu nhiều.
- **Tắt citation:** citation giá trị cho trust; tắt chỉ tiết kiệm vài token, không đáng giá.`
},
{
  id: 'qz-ccao-167',
  topic: 'claude',
  q: '[Knowledge Config] A team updates a policy document in their Project knowledge base (deletes old version, uploads new version). A user asks about the policy immediately after. What determines whether the answer reflects the new version?',
  options: [
    'Whether the user clears their browser cache',
    'Whether the indexing pipeline has finished processing the new document',
    'Whether the user starts a new chat session',
    'Whether the custom instruction mentions "latest version"'
  ],
  answer: 1,
  explain: `**Đúng: indexing pipeline (extract -> chunk -> embed -> index) phải hoàn tất trước khi retrieval thấy version mới.** Xoá cũ + upload mới trigger background job. Cho đến khi job xong, vector store vẫn chứa chunks cũ (chưa xoá) hoặc chưa có chunks mới. Browser cache, session, instruction không ảnh hưởng retrieval backend.
### Vì sao các lựa chọn khác sai
- **Browser cache:** retrieval chạy server-side, không liên quan cache client.
- **Phiên chat mới:** retrieval độc lập với session; chunks cũ/mới quyết định bởi vector store.
- **Instruction "latest version":** instruction không làm index nhanh hơn; model chỉ dùng chunks retrieval trả về.`
},
{
  id: 'qz-ccao-168',
  topic: 'claude',
  multi: true,
  q: '[Knowledge Config] A Project is used for contract review. The team wants answers to always include the specific clause section (e.g., "Section 7.2") when citing. Which TWO approaches work together? (Choose 2)',
  options: [
    'Ensure source contracts have clear section headings (e.g., "### Section 7.2 Indemnification") before uploading',
    'Add a custom instruction: "Always cite the section heading from the source document"',
    'Rename uploaded files to include section numbers',
    'Ask users to specify the section in every query',
    'Set a system prompt via API instead of Projects'
  ],
  answer: [0, 1],
  explain: `**Đúng: (0) cấu trúc tài liệu có heading section rõ ràng giúp chunking giữ nguyên section header trong chunk; (1) instruction yêu cầu model trích dẫn heading đó.** Nếu PDF có heading "Section 7.2" và chunking bảo toàn heading, retrieved chunk sẽ chứa "Section 7.2 ...". Instruction sau đó nhắc model: "khi trích dẫn, ghi rõ section heading trong chunk". Hai bước cùng cần: dữ liệu có cấu trúc + hướng dẫn generation.
### Vì sao các lựa chọn khác sai
- **Đổi tên file:** tên file không xuất hiện trong chunk content; retrieval không dùng tên file làm citation.
- **User chỉ định section:** bỏ trách nhiệm cho user; KB nên tự trả section đúng.
- **System prompt qua API:** Projects dùng custom instructions, không có system prompt riêng; và API không thay đổi cách Projects hoạt động.`
},
{
  id: 'qz-ccao-169',
  topic: 'claude',
  q: "[Troubleshooting] A user asks Claude in English, but Claude keeps replying in Vietnamese. The user has not set any language preference. What is the most effective first step?",
  options: [
    "Start every message with 'Reply in English'",
    "Check whether a custom instruction or Project instruction sets the reply language, and change it",
    "Switch to a more powerful Claude model that speaks English better",
    "Accept the Vietnamese reply and translate it manually each time"
  ],
  answer: 1,
  explain: `**Đúng: kiểm tra và sửa hướng dẫn cấu hình (custom instruction hoặc Project instruction) nếu nó đang bắt Claude trả lời bằng tiếng Việt.** Claude tuân theo hướng dẫn về ngôn ngữ nếu có; nếu hướng dẫn yêu cầu tiếng Việt, Claude sẽ dùng tiếng Việt bất kể người dùng hỏi bằng tiếng Anh. Việc chỉnh hướng dẫn một lần là xử lý gốc rễ vấn đề, sau đó mọi cuộc hội thoại mới sẽ dùng đúng ngôn ngữ.
### Vì sao các lựa chọn khác sai
- **Bắt đầu mỗi tin nhắn bằng "Reply in English":** làm việc tạm thời nhưng không sửa gốc, và dễ quên ở các tin nhắn sau.
- **Đổi sang model mạnh hơn:** ngôn ngữ trả lời không phụ thuộc model mạnh hay yếu; model mạnh vẫn có thể dùng tiếng Việt nếu hướng dẫn bắt.
- **Chấp nhận tiếng Việt rồi dịch tay mỗi lần:** tốn công và không xử lý được vấn đề cấu hình.

> Mẹo thực tế: nếu Claude liên tục dùng ngôn ngữ không mong muốn, hãy xem xét custom instruction và Project instruction trước khi đổ lỗi cho model.`,
},
{
  id: 'qz-ccao-170',
  topic: 'claude',
  q: "[Troubleshooting] Claude gives a different answer to the same question in two separate chats. What is the most likely reason?",
  options: [
    "Claude changes its mind randomly like a person",
    "Each chat is independent and answers can vary because Claude generates text probabilistically",
    "One chat is using a newer model than the other",
    "The first answer is always correct and the second is wrong"
  ],
  answer: 1,
  explain: `**Đúng: mỗi cuộc hội thoại là độc lập, và Claude sinh văn bản theo xác suất nên cùng câu hỏi có thể cho câu trả lời khác nhau ở các cuộc trò chuyện khác nhau.** Điều này không có nghĩa là Claude "đổi ý" hay một câu trả lời luôn đúng. Cần kiểm tra cả hai bằng nguồn độc lập thay vì chọn cái đầu tiên.
### Vì sao các lựa chọn khác sai
- **Claude đổi ý ngẫu nhiên như con người:** mô hình không có ý thức hay sở thích; sự khác biệt do cơ chế sinh văn bản, không phải thay đổi ý kiến.
- **Một cuộc dùng model mới hơn:** không cần thiết là đúng; cả hai có thể dùng cùng model và vẫn khác nhau.
- **Câu trả lời đầu luôn đúng:** câu trả lời đầu cũng có thể sai; độ tin cậy không đến từ thứ tự xuất hiện.

> Mẹo thực tế: với câu hỏi quan trọng, hãy dùng một nguồn bên ngoài để xác nhận thay vì dựa vào một cuộc trò chuyện duy nhất.`,
},
{
  id: 'qz-ccao-171',
  topic: 'claude',
  multi: true,
  q: "[Troubleshooting] A user pastes a long document and asks a specific question, but Claude's answer mentions facts that are not in the document. Which two actions best handle this? (Choose 2)",
  options: [
    "Treat the unmentioned facts as correct because Claude read the whole document",
    "Re-ask with the instruction 'use only the pasted document' and check each claim against the document",
    "Assume the document is wrong and trust Claude",
    "Ask Claude to show which part of the document supports each claim"
  ],
  answer: [1, 3],
  explain: `**Đúng: yêu cầu Claude chỉ dùng tài liệu đã dán và kiểm tra từng khẳng định; đồng thời yêu cầu Claude chỉ ra đoạn tài liệu hỗ trợ mỗi khẳng định.** Đây là cách thực hiện grounding — neo câu trả lời vào nguồn được cung cấp. Những sự thật không được đề cập trong tài liệu không nên được coi là đúng chỉ vì Claude đã đọc tài liệu đó.
### Vì sao các lựa chọn khác sai
- **Xem các sự thật không được đề cập là đúng:** Claude có thể thêm thông tin từ trí nhớ chung hoặc bịa; không có trong tài liệu thì không nên tin.
- **Giả định tài liệu sai và tin Claude:** tài liệu là nguồn đã cung cấp; việc tin Claude hơn tài liệu ngược ngược lại với mục đích kiểm tra.

> Mẹo thực tế: khi cần Claude chỉ dùng tài liệu đã cho, hãy nói rõ "chỉ dùng thông tin trong tài liệu này" và yêu cầu trích dẫn đoạn cụ thể.`,
},
{
  id: 'qz-ccao-172',
  topic: 'claude',
  q: "[Troubleshooting] Claude's reply stops in the middle of a sentence. What is the most practical next step?",
  options: [
    "Rewrite the whole request from scratch",
    "Ask Claude to continue from where it stopped",
    "Assume the document is too long and give up",
    "Paste the document again in every message"
  ],
  answer: 1,
  explain: `**Đúng: yêu cầu Claude tiếp tục từ nơi đã dừng.** Trả lời có thể bị cắt vì đạt đến giới hạn độ dài đầu ra; yêu cầu tiếp tục là cách nhanh và giữ được phần đã viết đúng. Không phải mỗi lần sao chép lại tài liệu, cũng không phải từ bỏ ngay.
### Vì sao các lựa chọn khác sai
- **Viết lại yêu cầu từ đầu:** tốn công và có thể làm mất phần nội dung đã viết đúng.
- **Giả định tài liệu quá dài và từ bỏ:** việc dừng giữa câu thường do giới hạn đầu ra, không nhất quansas tài liệu quá dài.
- **Dán tài liệu lại vào mọi tin nhắn:** không cần thiết nếu tài liệu đã nằm trong ngữ cảnh của cuộc trò chuyện.

> Mẹo thực tế: nếu Claude thường dừng giữa câu ở cùng một vị trí, hãy yêu cầu trả lời ngắn gọn hơn hoặc chia yêu cầu thành các phần nhỏ.`,
},
{
  id: 'qz-ccao-173',
  topic: 'claude',
  q: "[Troubleshooting] A user keeps correcting Claude's spelling of a client's name, but Claude keeps misspelling it in the same chat. What is the best fix?",
  options: [
    "Keep correcting it every time, forever",
    "Start a new chat and give the correct spelling explicitly at the start",
    "Assume Claude cannot spell proper names and avoid using it",
    "Type the name in all capital letters so Claude notices"
  ],
  answer: 1,
  explain: `**Đúng: mở cuộc trò chuyện mới và nêu rõ chính tả đúng ngay từ đầu.** Sửa lỗi nhiều lần trong cùng một cuộc trò chuyện không đảm bảo Claude ghi nhớ cho các tin nhắn sau; cuộc mới với chính xác được cung cấp sớm là cách tin cậy nhất. Không phải tránh hoàn toàn Claude vì một lỗi chính tả.
### Vì sao các lựa chọn khác sai
- **Sửa lại mỗi lần mãi mãi:** không hiệu quả và Claude vẫn có thể sai ở tin nhắn sau.
- **Giả định Claude không thể viết tên riêng và tránh dùng:** quá cực đoan; một lỗi chính tả có thể sửa bằng hướng dẫn rõ ràng.
- **Viết tên bằng chữ in hoa để Claude chú ý:** không phải cơ chế giúp Claude chính tả đúng; có thể làm thay đổi cách tên hiển thị.

> Mẹo thực tế: với tên riêng quan trọng, hãy đưa chính tả đúng vào hướng dẫn dự án hoặc hướng dẫn tuỳ chỉnh để áp dụng cho nhiều cuộc trò chuyện.`,
},
{
  id: 'qz-ccao-174',
  topic: 'claude',
  multi: true,
  q: "[Troubleshooting] A team connected Claude to a cloud drive, but Claude says it cannot find a specific file that the team knows exists. Which two checks are most appropriate? (Choose 2)",
  options: [
    "Check whether the file is within the folders the connection is allowed to access",
    "Check whether the file name and path typed in the question match the actual file",
    "Upload the same file again in every new chat",
    "Assume the cloud drive integration is broken and stop using it"
  ],
  answer: [0, 1],
  explain: `**Đúng: kiểm tra xem tệp nằm trong phạm vi thư mục mà kết nối được phép truy cập hay không, và kiểm tra tên tệp cùng đường dẫn trong câu hỏi có khớp với tệp thực hay không.** Hai vấn đề phổ biến là quyền truy cập giới hạn và gõ nhầm tên tệp. Không phải mỗi lần tải lại tệp, cũng không phải cho rằng kết nối đã hỏng.
### Vì sao các lựa chọn khác sai
- **Tải lại cùng một tệp vào mọi cuộc trò chuyện mới:** làm mất ích điểm của việc kết nối và tốn công.
- **Giả định kết nối hỏng và ngừng dùng:** trước khi kết luận hỏng, cần kiểm tra quyền truy cập và tên tệp.

> Mẹo thực tế: trước khi cho rằng tích nối bị lỗi, hãy xác nhận tệp nằm trong thư mục được kết nối và tên tệp được viết chính xác.`,
},
{
  id: 'qz-ccao-175',
  topic: 'claude',
  q: "[Troubleshooting] Claude keeps using a technical term the team does not use, even after being told once to stop. What is the most reliable fix?",
  options: [
    "Hope Claude remembers next time",
    "Add the preferred term and the term to avoid to the Project instructions or custom instructions",
    "Use a different language",
    "Replace the term manually every time without telling Claude"
  ],
  answer: 1,
  explain: `**Đúng: đưa từ ưu tiên và từ cần tránh vào hướng dẫn dự án hoặc hướng dẫn tuỳ chỉnh để Claude áp dụng nhất quán trong nhiều cuộc trò chuyện.** Một lời nhắc một lần trong một cuộc trò chuyện không đảm bảo được ghi nhớ lâu dài; hướng dẫn cấu hình là nơi phù hợp cho sở thích thuật ngữ cố định.
### Vì sao các lựa chọn khác sai
- **Hy vọng Claude nhớ lần sau:** không có cơ chế ghi nhớ giữa các cuộc trò chuyện trừ khi dùng hướng dẫn cấu hình.
- **Đổi sang ngôn ngữ khác:** không giải quyết vấn đề thuật ngữ và gây thêm phiền phức.
- **Thay thế thủ công mỗi lần không nói với Claude:** tốn công và không giúp các thành viên khác trong nhóm.

> Mẹo thực tế: sở thích về thuật ngữ và cách dùng từ nên nằm trong hướng dẫn cấu hình, không nằm trong lời nhắc từng tin nhắn.`,
},
{
  id: 'qz-ccao-176',
  topic: 'claude',
  q: "[Troubleshooting] Claude is much slower than usual and some requests time out. What is the most sensible first change?",
  options: [
    "Paste even more context so Claude has everything",
    "Use a shorter prompt and ask for a shorter answer, and avoid very large files in one chat",
    "Switch to the most powerful model",
    "Send the same request many times at once"
  ],
  answer: 1,
  explain: `**Đúng: dùng yêu cầu ngắn gọn hơn, yêu cầu câu trả lời ngắn hơn, và tránh dùng tệp quá lớn trong một cuộc trò chuyện.** Đầu vào nhỏ hơn và đầu ra ngắn hơn giúp Claude xử lý nhanh hơn và giảm nguy cơ hết thời gian. Thêm ngữ cảnh làm chậm hơn, model mạnh hơn không nhất thiết nhanh hơn, và gửi nhiều yêu cầu cùng lúc làm tình trạng tệ hơn.
### Vì sao các lựa chọn khác sai
- **Dán thêm nhiều ngữ cảnh:** làm tăng khối lượng xử lý, chậm hơn không phải nhanh hơn.
- **Đổi sang model mạnh nhất:** model mạnh thường chậm hơn và tốn hơn, không phải giải pháp cho vấn đề tốc độ.
- **Gửi cùng yêu cầu nhiều lần cùng lúc:** làm tăng tải và có thể gây hạn mức sử dụng nhanh hơn.

> Mẹo thực tế: nếu một yêu cầu vẫn bị chậm, hãy chia nhỏ thành các phần và xử lý lần lượt thay vì gửi toàn bộ cùng lúc.`,
},
{
  id: 'qz-ccao-177',
  topic: 'claude',
  multi: true,
  q: "[Troubleshooting] Claude refuses to answer a question that seems harmless and within policy. Which two responses are most appropriate? (Choose 2)",
  options: [
    "Rephrase the question in a neutral, factual way and try again",
    "Assume Claude is broken and uninstall it",
    "Check whether the wording accidentally touches a sensitive topic, and adjust",
    "Keep sending the same question until Claude answers"
  ],
  answer: [0, 2],
  explain: `**Đúng: diễn đạt lại câu hỏi theo cách trung tính và dựa trên sự thật, rồi thử lại; đồng thời kiểm tra xem cách diễn đạt có vô tình chạm vào chủ đề nhạy cảm không và điều chỉnh.** Từ chối có thể do cách diễn đạt kích hoạt bộ lọc an toàn chứ không phải do nội dung thật sự vi phạm. Không nên cho rằng Claude hỏng và gỡ cài đặt, cũng không nên gửi liên tục cùng một câu hỏi.
### Vì sao các lựa chọn khác sai
- **Giả định Claude hỏng và gỡ cài đặt:** quá cực đoan; từ chối thường do cách diễn đạt, không phải lỗi kỹ thuật.
- **Gửi liên tục cùng câu hỏi cho đến khi Claude trả lời:** không thay đổi gì và có thể gây khó hiểu thêm.

> Mẹo thực tế: khi Claude từ chối, hãy thử diễn đạt lại câu hỏi một cách trung tính và khách quan trước khi kết luận có vấn đề.`,
},
{
  id: 'qz-ccao-178',
  topic: 'claude',
  q: "[Troubleshooting] Claude's answer sounds very confident, but the user knows one stated fact is wrong. What should the user conclude?",
  options: [
    "Confidence means the fact has been checked against a database",
    "Confident tone is not proof of correctness; verify the fact independently",
    "Everything else in the answer must also be wrong",
    "Only answers given slowly are trustworthy"
  ],
  answer: 1,
  explain: `**Đúng: giọng điệu tự tin không phải bằng chứng về độ chính xác; hãy xác minh sự thật độc lập.** Claude có thể đưa ra câu trả lời sai một cách rất tự tin vì nó sinh văn bản theo xác suất, không phải tra cứu cơ sở dữ liệu sự thật. Việc một chỗ sai không có nghĩa là toàn bộ câu trả lời sai, và tốc độ cũng không cho biết độ tin cậy.
### Vì sao các lựa chọn khác sai
- **Tự tin nghĩa là sự thật đã được kiểm tra theo cơ sở dữ liệu:** không đúng; mô hình không tự động kiểm chứng từng khẳng định.
- **Mọi thứ khác trong câu trả lời cũng phải sai:** một chỗ sai không làm toàn bộ câu trả lời sai; cần kiểm tra từng phần.
- **Chỉ câu trả lời chậm mới đáng tin:** tốc độ phản hồi không liên quan đến độ chính xác nội dung.

> Mẹo thực tế: hãy tách hai câu hỏi — "câu này viết hay hay không?" và "câu này có đúng không?" — và trả lời chúng độc lập.`,
},
{
  id: 'qz-ccao-179',
  topic: 'claude',
  q: "[Troubleshooting] A user uploads a file, asks several questions, and later Claude seems to have forgotten details from the file. What is the most likely explanation?",
  options: [
    "Claude deletes files after each question",
    "The conversation has grown long and the file content may fall outside the active context window",
    "The file was never actually read",
    "Only the first question can use the file"
  ],
  answer: 1,
  explain: `**Đúng: cuộc trò chuyện đã trở nên dài và nội dung tệp có thể nằm ngoài cửa sổ ngữ cảnh đang kích hoạt.** Khi nhiều tin nhắn đã được trao đổi, nội dung cũ có thể bị đẩy ra khỏi phạm vi mà Claude có thể nhìn thấy, khiến nó dường như quên chi tiết từ tệp. Tệp không bị xóa sau mỗi câu hỏi, cũng không phải chỉ câu hỏi đầu tiên mới sử dụng được.
### Vì sao các lựa chọn khác sai
- **Claude xóa tệp sau mỗi câu hỏi:** không có cơ chế như vậy; tệp vẫn nằm trong ngữ cảnh cho đến khi bị đẩy ra.
- **Tệp chưa từng được đọc:** nếu Claude đã trả lời dựa trên tệp, thì nó đã đọc; vấn đề là ngữ cảnh đã dài.
- **Chỉ câu hỏi đầu tiên có thể dùng tệp:** không đúng; các câu hỏi sau vẫn có thể dùng tệp trong khi nội dung còn trong ngữ cảnh.

> Mẹo thực tế: nếu cuộc trò chuyện quá dài, hãy mở cuộc mới và cung cấp lại phần bối cảnh cần thiết từ tệp.`,
},
{
  id: 'qz-ccao-180',
  topic: 'claude',
  q: "[Troubleshooting] Claude keeps suggesting a feature that does not exist in the user's software. What is the best way to handle this?",
  options: [
    "Follow the suggestion because Claude knows all software",
    "Check the software's official documentation before using the feature",
    "Assume the feature exists but is hidden",
    "Stop using Claude for anything related to that software"
  ],
  answer: 1,
  explain: `**Đúng: kiểm tra tài liệu chính thức của phần mềm trước khi sử dụng tính năng được Claude gợi ý.** Claude có thể bịa ra tính năng không tồn tại (một dạng ảo giác); nó không biết toàn bộ phần mềm của người dùng. Xác minh bằng tài liệu chính thức là cách an toàn nhất. Không nên giả định tính năng ẩn, cũng không nên tránh hoàn toàn Claude vì một gợi ý sai.
### Vì sao các lựa chọn khác sai
- **Làm theo gợi ý vì Claude biết mọi phần mềm:** Claude không biết mọi phần mềm và có thể gợi ý tính năng không tồn tại.
- **Giả định tính năng tồn tại nhưng đang ẩn:** không có căn cứ; hãy xác minh bằng tài liệu chính thức.
- **Ngừng dùng Claude cho mọi việc liên quan đến phần mềm đó:** quá cực đoan; Claude vẫn hữu ích cho nhiều nhiệm vụ khác.

> Mẹo thực tế: trước khi thực hiện một lệnh hoặc tính năng Claude gợi ý, hãy kiểm tra trong tài liệu chính thức của sản phẩm.`,
},
{
  id: 'qz-ccao-181',
  topic: 'claude',
  q: "[Troubleshooting] A user asks Claude to 'be brief,' but Claude still writes long answers. What is the most effective adjustment?",
  options: [
    "Keep saying 'be brief' in every message",
    "Give a specific limit such as 'under 100 words' or 'one paragraph,' and repeat it in the prompt",
    "Assume Claude cannot be brief and write everything by hand",
    "Ask Claude to write in a different language"
  ],
  answer: 1,
  explain: `**Đúng: đưa ra một giới hạn cụ thể như 'dưới 100 từ' hoặc 'một đoạn', và lặp lại trong yêu cầu.** 'Viết ngắn gọn' quá mơ hồ; một giới hạn số từ hoặc số đoạn rõ ràng giúp Claude biết chính xác mức độ mong đợi. Không phải Claude không thể viết ngắn, và không cần đổi ngôn ngữ hay viết tay tất cả.
### Vì sao các lựa chọn khác sai
- **Nói 'viết ngắn gọn' trong mỗi tin nhắn:** quá mơ hồ, Claude vẫn có thể hiểu sai mức độ ngắn gọn.
- **Giả định Claude không thể viết ngắn và viết tay tất cả:** không đúng; chỉ cần hướng dẫn rõ ràng hơn.
- **Yêu cầu Claude viết bằng ngôn ngữ khác:** không liên quan đến độ dài câu trả lời.

> Mẹo thực tế: giới hạn đo được được (số từ, số đoạn) hiệu quả hơn nhiều so với lời nhắc trừu tượng như 'viết ngắn gọn'.`,
},
{
  id: 'qz-ccao-182',
  topic: 'claude',
  q: "[Troubleshooting] Claude gives a calculation that looks right, but the user will use the number in a budget. What is the safest step?",
  options: [
    "Use the number directly because Claude is good at math",
    "Check the calculation with a calculator or spreadsheet before using it",
    "Ask Claude to confirm the number again in the same chat",
    "Round the number to make it look safer"
  ],
  answer: 1,
  explain: `**Đúng: kiểm tra tính toán bằng máy tính hoặc bảng tính trước khi sử dụng số trong ngân sách.** Claude không phải là máy tính chính xác tuyệt đối; nó có thể sai phép tính nhưng vẫn viết kết quả trông hợp lý. Yêu cầu Claude xác nhận lại trong cùng cuộc trò chuyện không đáng tin cậy, và làm tròn số chỉ che giấu lỗi chứ không sửa nó.
### Vì sao các lựa chọn khác sai
- **Dùng số trực tiếp vì Claude giỏi toán:** Claude không đảm bảo tính toán chính xác cho các con số quan trọng.
- **Yêu cầu Claude xác nhận lại trong cùng cuộc trò chuyện:** mô hình có thể lặp lại cùng một sai lầm với giọng tự tin.
- **Làm tròn số để trông an toàn hơn:** làm tròn không thay đổi việc số đó có thể sai; ngân sách cần con số chính xác.

> Mẹo thực tế: với con số sẽ dùng trong ngân sách hay báo cáo tài chính, luôn kiểm chứng bằng công cụ tính toán deterministic trước khi gửi.`,
},
{
  id: 'qz-ccao-183',
  topic: 'claude',
  q: "[Troubleshooting] After a mistake, Claude keeps apologizing and refuses to continue the task. What is the best next step?",
  options: [
    "Keep apologizing back to Claude",
    "Start a new chat with a clear, corrected request",
    "Assume the task is impossible for Claude",
    "Send the same mistake again to test Claude"
  ],
  answer: 1,
  explain: `**Đúng: mở cuộc trò chuyện mới với yêu cầu rõ ràng và đã được sửa.** Khi Claude bị kẹt trong trạng thái xin lỗi và từ chối tiếp tục, cuộc trò chuyện mới với yêu cầu chỉnh sửa là cách nhanh nhất để khôi phục. Không phải xin lỗi lại với Claude, cũng không phải cho rằng nhiệm vụ không thể làm được.
### Vì sao các lựa chọn khác sai
- **Tiếp tục xin lỗi lại với Claude:** không giải quyết được vấn đề; Claude không cần được xin lỗi.
- **Giả định nhiệm vụ không thể làm được cho Claude:** một lỗi hoặc một trạng thái kẹt không có nghĩa là nhiệm vụ không thể thực hiện.
- **Gửi lại cùng sai lầm để kiểm tra Claude:** làm kéo dài trạng thái kẹt và không tạo ra tiến bộ.

> Mẹo thực tế: khi Claude kẹt trong vòng lặp xin lỗi, hãy mở cuộc trò chuyện mới và trình bày yêu cầu một cách rõ ràng, súc tích.`,
},
{
  id: 'qz-ccao-184',
  topic: 'claude',
  multi: true,
  q: "[Output Evaluation] A team must choose between two Claude drafts of a client email. Draft A covers more points but states one figure that cannot be verified. Draft B covers fewer points but every figure can be traced to a source. Which two evaluation points matter most? (Choose 2)",
  options: [
    "Accuracy and traceability of claims matter more than covering more points",
    "The longer draft is always better for the client",
    "Unverifiable figures should be removed or sourced before sending",
    "Choose the draft with the friendlier tone regardless of accuracy"
  ],
  answer: [0, 2],
  explain: `**Đúng: độ chính xác và khả năng truy nguồn của các khẳng định quan trọng hơn là bao nhiêu điểm được nêu; các con số không thể xác minh nên được loại bỏ hoặc có nguồn trước khi gửi.** Khả năng bao quát nhiều điểm không bù được cho một con số sai, và giọng điệu thân thiện không thay thế cho độ chính xác.
### Vì sao các lựa chọn khác sai
- **Bản trả lời dài hơn luôn tốt hơn cho khách:** độ dài không bằng chất lượng; bản dài có thể chứa thông tin không cần thiết hoặc sai.
- **Chọn bản có giọng điệu thân thiện hơn bất kể độ chính xác:** giọng điệu quan trọng nhưng không overrides sự đúng đắn của nội dung.

> Mẹo thực tế: khi gửi khách, ưu tiên những khẳng định có thể chứng minh được; con số không nguồn là rủi ro lớn nhất.`,
},
{
  id: 'qz-ccao-185',
  topic: 'claude',
  q: "[Output Evaluation] Claude summarizes a meeting and lists three decisions. The user remembers only two decisions from the meeting. What is the best way to evaluate the summary?",
  options: [
    "Accept the third decision because Claude was present in the meeting",
    "Check the meeting recording or notes to verify whether the third decision actually happened",
    "Assume Claude added a useful decision that everyone forgot",
    "Delete all three decisions and write the summary by hand"
  ],
  answer: 1,
  explain: `**Đúng: kiểm tra bản ghi hoặc ghi chú cuộc họp để xác minh xem quyết định thứ ba có thực sự xảy ra hay không.** Claude không tham dự cuộc họp; nó tóm tắt dựa trên nội dung được cung cấp và có thể thêm chi tiết không có thật. Không nên chấp nhận quyết định thứ ba chỉ vì Claude nêu ra, cũng không nên xóa tất cả và viết tay từ đầu.
### Vì sao các lựa chọn khác sai
- **Chấp nhận quyết định thứ ba vì Claude tham dự cuộc họp:** Claude không tham dự; đây là hiểu lầm.
- **Giả định Claude thêm một quyết định hữu ích mà mọi người đã quên:** không có căn cứ; cần kiểm chứng trước khi nhận.
- **Xóa tất cả ba quyết định và viết tay từ đầu:** tốn công; hai quyết định đúng có thể được giữ.

> Mẹo thực tế: với bản tóm tắt cuộc họp, hãy đối chiếu từng quyết định với ghi chú hoặc bản ghi âm trước khi gửi.`,
},
{
  id: 'qz-ccao-186',
  topic: 'claude',
  q: "[Output Evaluation] Claude's answer includes a quote attributed to a company executive, but no one can find the source. What is the correct handling?",
  options: [
    "Keep the quote because it sounds authentic",
    "Remove the quote unless it can be verified from a real source",
    "Change it to a paraphrase and keep it without attribution",
    "Add 'according to internal sources' to make it safe"
  ],
  answer: 1,
  explain: `**Đúng: xóa trích dẫn trừ khi có thể xác minh từ một nguồn thật.** Trích dẫn không nguồn là rủi ro uy tín và pháp lý; chuyển thành bản diễn giải lại không gán nguồn vẫn gán một quan điểm cho người phản hồi mà không có căn cứ. Viết 'theo các nguồn nội bộ' không làm trích dẫn an toàn vì vẫn không có nguồn để kiểm tra.
### Vì sao các lựa chọn khác sai
- **Giữ trích dẫn vì nghe thật:** nghe thật không có nghĩa là thực sự có; trích dẫn bịa là dạng phổ biến của ảo giác.
- **Diễn giải lại và giữ mà không gán nguồn:** vẫn gán một quan điểm cho người phản hồi mà không có căn cứ, chỉ khó phát hiện hơn.
- **Thêm 'theo các nguồn nội bộ' để an toàn:** không có nguồn thật nào để kiểm tra; làm độc giả tưởng đã được xác minh.

> Mẹo thực tế: nguyên tắc an toàn với trích dẫn — không mở được nguồn thì không gán cho người thật.`,
},
{
  id: 'qz-ccao-187',
  topic: 'claude',
  multi: true,
  q: "[Output Evaluation] A reviewer must check Claude's step-by-step solution to a multi-step problem. Which two practices are most effective? (Choose 2)",
  options: [
    "Check each step individually against the known facts, not only the final result",
    "Trust the final result if it looks reasonable",
    "Assume the first step is correct because it comes first",
    "Look for where an early error could make later steps wrong"
  ],
  answer: [0, 3],
  explain: `**Đúng: kiểm tra từng bước riêng lẻ dựa trên các sự thật đã biết, không chỉ xem kết quả cuối; đồng thời tìm xem một lỗi ở bước đầu có thể làm sai các bước sau hay không.** Lỗi ở bước đầu có thể lan sang các bước sau, nên kiểm tra quy trình không chỉ kết quả. Kết quả cuối nhìn hợp lý không đồng nghĩa từng bước đều đúng.
### Vì sao các lựa chọn khác sai
- **Tin kết quả cuối nếu nó trông hợp lý:** kết quả cuối có thể đúng tình cờ trong khi các bước đều sai.
- **Giả định bước đầu đúng vì nó xuất hiện đầu tiên:** bước đầu cũng có thể sai; mỗi bước cần kiểm tra độc lập.

> Mẹo thực tế: với bài toán nhiều bước, hãy yêu cầu Claude trình bày từng bước rồi kiểm tra từng phép tính riêng lẻ.`,
},
{
  id: 'qz-ccao-188',
  topic: 'claude',
  q: "[Output Evaluation] Claude writes a customer reply and includes a medical disclaimer at the end. The user plans to remove the disclaimer to make the reply shorter. What is the best evaluation?",
  options: [
    "The disclaimer is optional decoration and can be removed",
    "If the reply touches health topics, the disclaimer may be required; removing it increases risk",
    "Disclaimers make replies look less confident, so always remove them",
    "Keep the disclaimer only if the customer asks for it"
  ],
  answer: 1,
  explain: `**Đúng: nếu phản hồi liên quan đến chủ đề y tế, bản miễn trừ trách nhiệm có thể là bắt buộc; xóa nó làm tăng rủi ro.** Bản miễn trừ không phải trang trí tùy ý; khi nội dung chạm đến sức khỏe, việc thiếu bản miễn trừ có thể gây hiểu lầm và rủi ro pháp lý. Không nên xóa vì bản trả lời trông kém tự tin, cũng không nên chỉ giữ khi khách hỏi.
### Vì sao các lựa chọn khác sai
- **Bản miễn trừ là trang trí tùy ý và có thể xóa:** không đúng đối với nội dung liên quan đến y tế, tài chính hay pháp lý.
- **Bản miễn trừ làm phản hồi kém tự tin nên luôn xóa:** độ tự tin không phải lý do để bỏ qua bản miễn trừ bắt buộc.
- **Giữ bản miễn trừ chỉ khi khách hỏi:** khi đó đã muộn; bản miễn trừ cần có trước khi gửi.

> Mẹo thực tế: với nội dung liên quan đến sức khỏe hoặc tài chính, hãy giữ bản miễn trừ và để người có chuyên môn xem xét.`,
},
{
  id: 'qz-ccao-189',
  topic: 'claude',
  q: "[Output Evaluation] Claude uses two different names for the same software feature across a long document. What is the best evaluation?",
  options: [
    "This is normal and does not matter",
    "Inconsistent terminology confuses readers; choose one term and use it throughout",
    "Ask Claude to use even more names so all users are covered",
    "Assume the different names refer to different features"
  ],
  answer: 1,
  explain: `**Đúng: thuật ngữ không nhất quán làm người đọc bối rối; hãy chọn một từ và dùng nó xuyên suốt tài liệu.** Khi cùng một tính năng được gọi bằng hai tên, người đọc có thể nghĩ đó là hai thứ khác nhau. Không nên yêu cầu Claude dùng thêm nhiều tên, cũng không nên giả định các tên khác nhau là các tính năng khác nhau mà không kiểm tra.
### Vì sao các lựa chọn khác sai
- **Điều này bình thường và không quan trọng:** thuật ngữ không nhất quán gây nhầm lẫn, đặc biệt trong tài liệu dài.
- **Yêu cầu Claude dùng càng nhiều tên càng tốt để bao phủ tất cả người dùng:** nhiều tên càng gây bối rối và khó duy trì.
- **Giả định các tên khác nhau chỉ các tính năng khác nhau:** không nhất thiết; cần kiểm tra tài liệu hoặc ngữ cảnh.

> Mẹo thực tế: hãy xây dựng một bảng thuật ngữ ngắn cho dự án và yêu cầu Claude dùng các từ trong bảng.`,
},
{
  id: 'qz-ccao-190',
  topic: 'claude',
  multi: true,
  q: "[Output Evaluation] A team evaluates Claude's answer to a regulatory question. Which two signs show the answer needs closer checking? (Choose 2)",
  options: [
    "The answer states specific legal deadlines with no source",
    "The answer is short",
    "The answer uses polite language",
    "The answer conflicts with the team's own compliance handbook"
  ],
  answer: [0, 3],
  explain: `**Đúng: các thời hạn pháp lý cụ thể không có nguồn và nội dung mâu thuẫn với sách hướng dẫn tuân thủ của nhóm là dấu hiệu cần kiểm tra kỹ hơn.** Cả hai đều có thể dẫn đến vi phạm quy định nếu sai. Câu trả lời ngắn và ngôn ngữ lịch sự không phải dấu hiệu báo động.
### Vì sao các lựa chọn khác sai
- **Câu trả lời ngắn:** độ dài ngắn không liên quan đến độ chính xác; câu trả lời ngắn vẫn có thể đúng.
- **Câu trả lời dùng ngôn ngữ lịch sự:** ngữ văn lịch sự không cho biết nội dung đúng hay sai.

> Mẹo thực tế: với câu hỏi quy định pháp lý, hãy ưu tiên kiểm tra các con số, thời hạn và bất kỳ nội dung nào mâu thuẫn với sách hướng dẫn của tổ chức.`,
},
{
  id: 'qz-ccao-191',
  topic: 'claude',
  q: "[Output Evaluation] Claude offers to write a script that will edit files on the user's computer. The user will run it. What is the safest evaluation?",
  options: [
    "Run it immediately because Claude wrote it",
    "Review the script carefully, test it on non-important files first, and keep a backup",
    "Assume scripts from Claude are always safe",
    "Ask Claude to guarantee the script is safe"
  ],
  answer: 1,
  explain: `**Đúng: xem xét kỹ script, kiểm tra trên các tệp không quan trọng trước, và giữ bản sao lưu trước khi chạy.** Claude có thể viết script có hành động không mong muốn, như xóa hoặc sửa nhầm tệp. Không nên chạy ngay, không nên cho rằng script từ Claude luôn an toàn, và Claude không thể bảo đảm an toàn.
### Vì sao các lựa chọn khác sai
- **Chạy ngay vì Claude đã viết:** script từ mô hình vẫn có thể lỗi hoặc nguy hiểm; cần kiểm tra trước.
- **Giả định script từ Claude luôn an toàn:** không có cơ chế đảm bảo này.
- **Yêu cầu Claude bảo đảm script an toàn:** mô hình không thể bảo đảm; người dùng vẫn chịu trách nhiệm khi chạy.

> Mẹo thực tế: trước khi chạy script chỉnh sửa tệp, hãy sao lưu dữ liệu và thử trên bản sao không quan trọng.`,
},
{
  id: 'qz-ccao-192',
  topic: 'claude',
  q: "[Output Evaluation] A Claude translation uses a different term for the same concept in two documents for the same client. What should the evaluation focus on?",
  options: [
    "Terminology consistency with the client's preferred glossary",
    "Which document is longer",
    "Whether the translator sounds fluent",
    "The number of words in each document"
  ],
  answer: 0,
  explain: `**Đúng: tập trung vào tính nhất quán thuật ngữ với bảng thuật ngữ ưu tiên của khách hàng.** Cùng một khái niệm nên được dịch bằng một từ xuyên suốt các tài liệu cho cùng một khách hàng. Độ dài tài liệu, sự trôi chải và số lượng từ không phải là vấn đề cốt lõi ở đây.
### Vì sao các lựa chọn khác sai
- **Tài liệu nào dài hơn:** độ dài không liên quan đến tính nhất quán thuật ngữ.
- **Người dịch có nghe trôi chải không:** sự trôi chải không giải quyết việc dùng từ khác nhau cho cùng một khái niệm.
- **Số lượng từ trong mỗi tài liệu:** số từ không phải thước đo đánh giá bản dịch trong trường hợp này.

> Mẹo thực tế: hãy dùng bảng thuật ngữ của khách hàng và yêu cầu Claude dịch các thuật ngữ chủ lực theo bảng đó.`,
},
{
  id: 'qz-ccao-193',
  topic: 'claude',
  multi: true,
  q: "[Output Evaluation] Claude produces a chart and an accompanying summary. The summary states a percentage that does not match the chart. Which two steps are most appropriate? (Choose 2)",
  options: [
    "Treat the summary as correct because it was written after the chart",
    "Check the underlying data to find which figure is right",
    "Fix the summary or chart so both agree, and note the source",
    "Assume both are correct because they come from Claude"
  ],
  answer: [1, 2],
  explain: `**Đúng: kiểm tra dữ liệu gốc để tìm con số nào đúng, sau đó sửa bản tóm tắt hoặc biểu đồ cho hai bên khớp nhau và ghi rõ nguồn.** Bản tóm tắt viết sau không tự động đúng hơn; khi hai bên xung đột, ít nhất một bên là sai. Không nên coi cả hai đều đúng vì chúng từ Claude.
### Vì sao các lựa chọn khác sai
- **Xem bản tóm tắt là đúng vì nó được viết sau biểu đồ:** thứ tự viết không quyết định độ chính xác.
- **Giả định cả hai đều đúng vì chúng từ Claude:** hai con số khác nhau cho cùng một chỉ số không thể cùng đúng.

> Mẹo thực tế: khi số liệu trong bản tóm tắt và biểu đồ không khớp, hãy quay về dữ liệu gốc chứ không phải chọn cái nào trông hay hơn.`,
},
{
  id: 'qz-ccao-194',
  topic: 'claude',
  q: "[Output Evaluation] Claude's output is mostly correct but has two small errors. The user needs to send it to a client. What is the best approach?",
  options: [
    "Send it as is because it is mostly correct",
    "Fix the two errors before sending, or ask Claude to fix them",
    "Assume the client will not notice small errors",
    "Rewrite the whole thing by hand"
  ],
  answer: 1,
  explain: `**Đúng: sửa hai sai lầm trước khi gửi, hoặc yêu Claude sửa lại.** Output phần lớn đúng nhưng vẫn có lỗi không nên gửi cho khách; sai lầm nhỏ cũng có thể gây hiểu lầm hoặc ảnh hưởng đến quyết định. Không cần viết lại toàn bộ từ đầu; chỉ cần sửa phần sai.
### Vì sao các lựa chọn khác sai
- **Gửi nguyên trạng vì phần lớn đúng:** lỗi nhỏ vẫn có thể gây hậu quả với khách.
- **Giả định khách sẽ không chú ý đến sai lầm nhỏ:** không thể biết khách sẽ chú ý gì; không nên bets vào điều đó.
- **Viết lại toàn bộ từ tay:** tốn công và bỏ phần nội dung đã đúng.

> Mẹo thực tế: trước khi gửi cho khách, hãy dành vài phút để sửa lại sai lầm rõ rệt thay vì hy vọng khách sẽ không để ý.`,
},
{
  id: 'qz-ccao-195',
  topic: 'claude',
  q: "[Output Evaluation] Claude answers a question by referring to 'the document you uploaded,' but the user uploaded no document. What is the best evaluation?",
  options: [
    "Accept the answer because Claude probably knows the document",
    "Treat the answer as unreliable; Claude may be inventing a source",
    "Ask Claude to describe the document in more detail",
    "Assume there is a hidden document the user forgot about"
  ],
  answer: 1,
  explain: `**Đúng: coi câu trả lời là không đáng tin cậy; Claude có thể đang bịa ra một nguồn.** Claude không biết về tài liệu mà người dùng chưa tải lên; khi nó nhắc đến 'tài liệu bạn đã tải lên' trong khi không có tài liệu nào, đó là dấu hiệu của thông tin bịa. Không nên chấp nhận, cũng không nên giả định có tài liệu ẩn nào.
### Vì sao các lựa chọn khác sai
- **Chấp nhận câu trả lời vì Claude có thể biết tài liệu:** Claude không có quyền truy cập vào tài liệu không được tải lên.
- **Yêu cầu Claude mô tả tài liệu chi tiết hơn:** nếu không có tài liệu, Claude chỉ có thể tiếp tục bịa ra mô tả.
- **Giả định có tài liệu ẩn nào đó người dùng quên:** không có căn cứ; trước tiên hãy xác nhận người dùng đã tải lên gì.

> Mẹo thực tế: khi Claude nhắc đến một tài liệu không tồn tại, hãy coi phần liên quan đến tài liệu đó là không đáng tin cậy.`,
},
{
  id: 'qz-ccao-196',
  topic: 'claude',
  q: "[Output Evaluation] Two Claude answers to the same question conflict on an important fact. What should the evaluator do?",
  options: [
    "Pick the answer that sounds more confident",
    "Check an independent source to determine the correct fact",
    "Average the two answers",
    "Ask Claude to choose between its own answers"
  ],
  answer: 1,
  explain: `**Đúng: kiểm tra một nguồn độc lập để xác định sự thật đúng.** Khi hai câu trả lời mâu thuẫn về một sự thật quan trọng, ít nhất một câu là sai; cần nguồn bên ngoài để giải quyết. Không nên chọn cái nghe tự tin hơn, lấy trung bình, hoặc nhờ Claude tự chọn giữa các câu trả lời của nó.
### Vì sao các lựa chọn khác sai
- **Chọn câu trả lời nghe tự tin hơn:** giọng tự tin không cho biết đâu là đúng.
- **Lấy trung bình hai câu trả lời:** đối với sự thật, trung bình hai con số khác nhau thường là sai cả hai.
- **Nhờ Claude chọn giữa các câu trả lời của nó:** Claude không biết đâu là đúng hơn; nó chỉ có thể đoán lại.

> Mẹo thực tế: mâu thuẫn giữa các câu trả lời là tín hiệu cần dừng lại và kiểm chứng bằng nguồn độc lập.`,
},
{
  id: 'qz-ccao-197',
  topic: 'claude',
  q: "[Output Evaluation] Claude writes a report that includes a section clearly copied from a website without saying where it came from. What is the best evaluation?",
  options: [
    "It is fine because it is accurate",
    "Treat it as an unverified source; find the original and cite it, or remove the passage",
    "Assume Claude has permission to copy it",
    "Copy it again into the client report"
  ],
  answer: 1,
  explain: `**Đúng: coi đó là nguồn chưa được xác minh; hãy tìm bản gốc và trích dẫn nguồn, hoặc loại bỏ đoạn đó.** Nội dung sao chép từ trang web không ghi nguồn là rủi ro bản quyền và uy tín; sự chính xác không làm mất đi yêu cầu ghi nguồn. Claude không có quyền sao chép, và không nên sao chép lại vào báo cáo gửi khách.
### Vì sao các lựa chọn khác sai
- **Được vì nó chính xác:** chính xác không đồng nghĩa với được phép sao chép hay không cần ghi nguồn.
- **Giả định Claude có quyền sao chép:** Claude không có quyền bản quyền đối với nội dung web.
- **Sao chép lại vào báo cáo gửi khách:** làm lan rộng rủi ro bản quyền và thiếu minh bạch.

> Mẹo thực tế: mọi đoạn nội dung được sao chép từ web đều cần được xác minh nguồn và trích dẫn rõ trước khi dùng cho khách hàng.`,
},
{
  id: 'qz-ccao-198',
  topic: 'claude',
  q: "[Output Evaluation] Claude's answer is correct but hard to read because it is one long paragraph. The audience needs to scan it quickly. What is the best evaluation?",
  options: [
    "Correctness is the only thing that matters, so keep it",
    "Break it into short paragraphs or bullets for readability; correctness and readability both matter",
    "Assume the audience will read slowly and carefully",
    "Make it longer so it looks more thorough"
  ],
  answer: 1,
  explain: `**Đúng: chia thành các đoạn ngắn hoặc gạch đầu dòng để dễ đọc; độ chính xác và khả năng đọc đều quan trọng.** Đối tượng cần quét nhanh thì một đoạn văn dài làm giảm giá trị của câu trả lời ngay cả khi chính xác. Không nên giữ nguyên vì đúng duy nhất, cũng không nên giả định người đọc sẽ đọc chậm, và làm dài hơn không giúp ích.
### Vì sao các lựa chọn khác sai
- **Độ chính xác là thứ duy nhất quan trọng, nên giữ nguyên:** correct nhưng khó đọc thì người đọc có thể bỏ lỡ thông tin quan trọng.
- **Giả định người đọc sẽ đọc chậm và cẩn thận:** không thể đảm bảo; đối tượng cần quét nhanh thì cấu trúc rõ ràng là quan trọng.
- **Làm dài hơn để trông chi tiết hơn:** dài hơn không giúp đọc nhanh và có thể làm giảm tính hữu dụng.

> Mẹo thực tế: nếu người đọc cần quét nhanh, hãy dùng các đoạn ngắn, gạch đầu dòng và đưa ý chính ra đầu mỗi đoạn.`,
},
{
  id: "qz-ccao-199",
  topic: "claude",
  q: "[Responsible Use] A marketing manager wants Claude to write a launch announcement that says the new product is 'clinically proven to reduce stress by 40%'. The team has one small internal survey and no clinical study. Which approach is most appropriate?",
  options: [
    "Let Claude write the claim, because the product is a wellness tool rather than a medicine",
    "Keep the claim but add a line saying the figure comes from an internal survey",
    "Write the claim in softer words, such as 'may help some users relax', so nobody can object",
    "Remove the claim and describe only what the internal survey measured, with its sample size"
  ],
  answer: 3,
  explain: `**Đúng: bỏ tuyên bố không có bằng chứng và mô tả đúng những gì khảo sát nội bộ đo được, kèm cỡ mẫu.** "Clinically proven" là một tuyên bố khoa học: nó hàm ý đã có thử nghiệm lâm sàng (clinical trial) được thiết kế đúng, có nhóm đối chứng và được bên độc lập đánh giá. Một khảo sát nội bộ vài chục người không phải thử nghiệm lâm sàng, nên câu đó là sai sự thật và có thể vi phạm quy định quảng cáo ở nhiều quốc gia. Cách đúng là hạ tuyên bố xuống đúng mức bằng chứng: nói rõ đây là khảo sát nội bộ, bao nhiêu người tham gia, và chỉ mô tả điều đã đo. Như vậy thông điệp vẫn hữu ích mà không phóng đại.

### Vì sao các lựa chọn khác sai
- **Cứ viết vì đây là sản phẩm wellness:** "wellness" không miễn trừ nghĩa vụ quảng cáo trung thực; tuyên bố sức khoẻ vẫn cần bằng chứng, và càng dễ gây hiểu lầm thì rủi ro pháp lý càng lớn.
- **Giữ số 40% và ghi chú "nguồn: khảo sát nội bộ":** ghi nguồn không biến một khảo sát nhỏ thành thử nghiệm lâm sàng; cụm "clinically proven" vẫn là câu sai, và chú thích nhỏ thường bị người đọc bỏ qua.
- **Viết mềm hơn để khó bị bắt lỗi:** làm câu chữ mơ hồ đi không sửa được gốc rễ là không có bằng chứng; nó chỉ khiến tuyên bố khó kiểm chứng hơn.

### Cách làm
Tách hai việc: (1) bằng chứng đang có là gì (ai làm, bao nhiêu người, đo bằng cách nào); (2) được phép nói gì dựa trên bằng chứng đó. Yêu cầu Claude viết đúng phần (2), và nếu cần tuyên bố mạnh hơn thì đưa việc đó cho người phụ trách thử nghiệm sản phẩm.

> Mẹo thực tế: khi một tuyên bố nghe "khoa học" mà bạn không có nghiên cứu tương ứng, hãy coi đó là rủi ro pháp lý chứ không phải lỗi câu chữ.`
},
{
  id: "qz-ccao-200",
  topic: "claude",
  multi: true,
  q: "[Responsible Use] A clinic is considering Claude for two jobs. Which two uses are appropriate for Claude to draft or organise, with a qualified person making the final call? (Choose 2)",
  options: [
    "Turning a patient's recorded visit notes into a structured draft letter for the doctor to check",
    "Writing the final dosage instructions a patient should follow after reading their test results",
    "Making the final decision on whether an insurance claim should be approved",
    "Grouping patient feedback into themes so staff can decide what to improve",
    "Telling a patient whether a symptom is serious without a clinician reviewing the message"
  ],
  answer: [0, 3],
  explain: `**Đúng: Claude được dùng để biến ghi chú thành bản nháp có cấu trúc cho bác sĩ kiểm tra, và để gom phản hồi thành chủ đề cho nhân viên quyết định.** Cả hai việc đều thuộc nhóm "AI làm bản nháp, người có chuyên môn quyết định": đầu ra là tài liệu trung gian, có người kiểm chứng trước khi dùng, và sai sót dễ phát hiện khi đối chiếu với ghi chép gốc. Đây là cách khai thác tốc độ của Claude mà vẫn giữ trách nhiệm chuyên môn ở người.

### Vì sao các lựa chọn khác sai
- **Claude viết chỉ dẫn liều dùng cuối cùng cho bệnh nhân:** đây là quyết định điều trị; liều sai có thể gây hại trực tiếp, và mô hình không có giấy phép hành nghề lẫn hồ sơ bệnh án đầy đủ.
- **Claude quyết định duyệt hay từ chối yêu cầu bảo hiểm:** ảnh hưởng quyền lợi tài chính của người khác; cần người có thẩm quyền xem xét và chịu trách nhiệm.
- **Claude trả lời bệnh nhân về mức độ nghiêm trọng của triệu chứng:** không có bác sĩ duyệt, đây là tư vấn y khoa; một câu trấn an sai có thể làm chậm việc khám thật.

### Cách làm
Chọn việc có đầu ra kiểm chứng được (bản nháp, bảng tổng hợp, danh sách chủ đề); quy định rõ người nào duyệt; lưu lại bản gốc để đối chiếu.

> Mẹo thực tế: trong y tế, ranh giới an toàn là "bản nháp có người ký duyệt" — không phải "câu trả lời nghe rất hợp lý".`
},
{
  id: "qz-ccao-201",
  topic: "claude",
  q: "[Responsible Use] A consultant wants to check a public company's last four quarterly revenue figures before putting them in a client deck. What is the most reliable approach?",
  options: [
    "Look the figures up in the company's published quarterly results or annual report, then compare",
    "Ask Claude for the four figures and use them if the numbers look consistent with each other",
    "Ask Claude to list its sources, and trust the list without opening the links",
    "Use Claude's figures but round each one so a small error becomes invisible"
  ],
  answer: 0,
  explain: `**Đúng: tra báo cáo tài chính chính thức do công ty công bố, rồi đối chiếu.** Báo cáo quý và báo cáo thường niên là tài liệu gốc, có thể mở ra và kiểm tra; đó là loại nguồn duy nhất cho phép bạn khẳng định một con số trước khách hàng. Việc bốn con số "trông nhất quán với nhau" không chứng minh điều gì: Claude tạo văn bản theo xác suất, nên bốn con số có thể cùng sai theo một hướng hợp lý. Làm tròn cũng không sửa lỗi, chỉ che nó đi. Và một danh sách nguồn do chính Claude đưa ra cũng cần được mở ra kiểm tra, vì trích dẫn có thể không tồn tại.

### Vì sao các lựa chọn khác sai
- **Tin vì các số nhất quán với nhau:** tính nhất quán nội tại không phải bằng chứng; một mô hình có thể tạo ra cả một bảng số sai một cách mạch lạc.
- **Tin danh sách nguồn mà không mở link:** danh sách do mô hình sinh ra có thể chứa nguồn không tồn tại; chỉ mở nguồn thật mới xác minh được.
- **Làm tròn để lỗi nhỏ không lộ:** làm tròn không thay đổi sự thật, và trong báo cáo tài chính, sai số nhỏ vẫn có thể làm lệch kết luận.

### Cách làm
Ghi lại từng con số kèm tài liệu nguồn và kỳ báo cáo; nếu không tìm được nguồn, bỏ con số đó khỏi tài liệu gửi khách.

> Mẹo thực tế: nguyên tắc "một con số, một nguồn mở được" giúp bạn loại phần lớn rủi ro khi dùng số liệu do AI tổng hợp.`
},
{
  id: "qz-ccao-202",
  topic: "claude",
  q: "[Responsible Use] An operations manager wants every supplier invoice to be approved automatically by Claude, with nobody checking the result. The system would also pay the invoice. What is the main problem with this design?",
  options: [
    "It is fine, because invoice totals are simple numbers that Claude handles well",
    "It will be too slow, since reading invoices takes time",
    "It uses too many tokens, so the monthly cost will be high",
    "It removes a person from a decision that spends company money, so one mistake is paid without review"
  ],
  answer: 3,
  explain: `**Đúng: vấn đề cốt lõi là tự động hoàn toàn một quyết định chi tiền mà không có người kiểm tra.** "Approval" là một hành động có hậu quả tài chính: khi sai, tiền đã ra khỏi công ty và việc đòi lại thường khó hơn nhiều so với việc chặn trước. Với AI, còn thêm một lớp rủi ro: mô hình có thể đọc sai một dòng, bỏ sót một khoản phụ thu, hoặc bị đánh lừa bởi văn bản trong hóa đơn. Vì vậy mẫu thiết kế an toàn là "AI đề xuất, người phê duyệt" — Claude trích xuất và gắn cờ bất thường, còn người có thẩm quyền bấm duyệt.

### Vì sao các lựa chọn khác sai
- **Cho rằng số đơn giản nên Claude làm tốt:** độ đơn giản của phép tính không làm mất hậu quả của việc chi tiền sai; và chính các con số "đơn giản" cũng có thể bị đọc lệch.
- **Lo tốc độ:** tốc độ là lý do người ta muốn tự động hoá, không phải lý do để bỏ kiểm soát.
- **Lo chi phí token:** chi phí token nhỏ hơn nhiều so với thiệt hại từ một khoản chi sai; đây không phải vấn đề chính.

### Cách làm
Giữ người phê duyệt; dùng Claude để rút trích dữ liệu và đánh dấu bất thường (số tiền lớn hơn trung bình, thiếu số hóa đơn, ngày bất thường); đặt ngưỡng giá trị dưới mức nào thì mới tự động, và ghi log mọi quyết định.

> Mẹo thực tế: tự động hoá nên bắt đầu ở khâu chuẩn bị dữ liệu, còn quyền chi tiền thì nên giữ ở người.`
},
{
  id: "qz-ccao-203",
  topic: "claude",
  multi: true,
  q: "[Responsible Use] A manager is writing the AI section of the team handbook. Which two rules best protect confidential project information? (Choose 2)",
  options: [
    "Paste any internal document into Claude as long as you delete the chat afterwards",
    "Store confidential source material in the company's approved workspace rather than a personal account",
    "Let each person decide case by case whether a document is too sensitive to share",
    "Use a personal account when the company workspace feels slower, to save time",
    "Strip client names and identifiers before sharing, and share only the passages the task needs"
  ],
  answer: [1, 4],
  explain: `**Đúng: giữ tài liệu mật trong workspace được công ty phê duyệt, và chỉ đưa vào đúng đoạn cần thiết sau khi ẩn danh.** Workspace của công ty là nơi có thoả thuận xử lý dữ liệu, quyền quản trị và chính sách lưu trữ rõ ràng; tài khoản cá nhân thì không. "Chỉ đưa phần cần thiết" (data minimisation) và "ẩn danh" (redaction) làm giảm cả xác suất lẫn hậu quả nếu dữ liệu bị lộ. Đây là hai biện pháp rẻ, làm được ngay, và áp dụng cho mọi loại tài liệu.

### Vì sao các lựa chọn khác sai
- **Dán rồi xoá chat là đủ:** xoá giao diện không đồng nghĩa với xoá dữ liệu khỏi mọi bản ghi, bản sao, log; và trong lúc dữ liệu còn ở đó, nó vẫn có thể bị dùng sai.
- **Để mỗi người tự đánh giá mức nhạy cảm:** thiếu nhất quán, và người đang gấp thường chọn cách nhanh; cần quy tắc chung để không phụ thuộc phán đoán cá nhân.
- **Dùng tài khoản cá nhân vì workspace chậm:** nguyên nhân của việc né tránh là trải nghiệm kém; tổ chức phải sửa phần đó, còn cá nhân vẫn phải dùng đúng nơi được duyệt.

### Cách làm
Viết vào handbook: (1) chỉ dùng workspace công ty; (2) phân loại dữ liệu trước khi chia sẻ; (3) ẩn tên và chỉ gửi phần liên quan; (4) kênh hỏi khi chưa rõ.

> Mẹo thực tế: chính sách tốt là chính sách dễ tuân theo — nếu chỗ được duyệt chậm hơn chỗ không được duyệt, nhân viên sẽ chọn chỗ nhanh.`
},
{
  id: "qz-ccao-204",
  topic: "claude",
  q: "[Responsible Use] A student pastes a textbook chapter into Claude and asks it to write a graded essay for them, then submits the essay under their own name. Which statement best describes the problem?",
  options: [
    "None, because the student read the chapter first",
    "It is acceptable if the essay receives a good grade",
    "It is a form of academic dishonesty, because the work is presented as the student's own when it was produced by AI",
    "The only risk is that Claude might write in a style the teacher dislikes"
  ],
  answer: 2,
  explain: `**Đúng: đây là gian lận học thuật — nộp sản phẩm do AI tạo ra dưới tên mình.** Vấn đề không nằm ở chất lượng bài viết mà ở chỗ khai sai nguồn gốc của công việc: người chấm đang đánh giá năng lực của sinh viên, còn bài viết thì không phản ánh năng lực đó. Phần lớn cơ sở giáo dục có quy định riêng về việc dùng AI, và nhiều nơi yêu cầu khai báo hoặc cấm hoàn toàn với bài thi. Việc đã đọc chương sách không làm thay đổi bản chất: đọc để hiểu là một chuyện, nộp bài do máy viết là chuyện khác.

### Vì sao các lựa chọn khác sai
- **Không sao vì đã đọc chương sách:** đọc tài liệu không đồng nghĩa với việc tự viết; bài nộp vẫn là của AI.
- **Chấp nhận nếu được điểm cao:** điểm cao càng làm sai lệch đánh giá năng lực và có thể dẫn tới kỷ luật nặng hơn khi bị phát hiện.
- **Chỉ sợ văn phong giống giáo viên:** đây là rủi ro phụ; vấn đề chính là trung thực học thuật, không phải phong cách.

### Cách làm
Dùng Claude để học: yêu cầu giải thích, gợi ý dàn ý, đặt câu hỏi phản biện, hoặc nhận xét bản nháp do chính bạn viết. Nếu quy định cho phép dùng AI, hãy khai báo đúng phạm vi đã dùng.

> Mẹo thực tế: ranh giới an toàn trong học tập là "AI giúp bạn làm tốt hơn việc bạn tự làm", không phải "AI làm thay bạn".`
},
{
  id: "qz-ccao-205",
  topic: "claude",
  q: "[Responsible Use] An employee wants to connect Claude to the company's shared drive so it can read project files. Which question matters most before enabling that connection?",
  options: [
    "Does the connection work on the employee's phone as well as their laptop?",
    "Which folders can be reached, which account permissions apply, and whether sending that data to the model is allowed by policy?",
    "How many files can be uploaded at once?",
    "Can the interface be switched to dark mode?"
  ],
  answer: 1,
  explain: `**Đúng: phải biết phạm vi truy cập, quyền của tài khoản, và liệu việc gửi dữ liệu đó cho mô hình có được chính sách cho phép hay không.** Kết nối (connector) thường đi kèm nguyên tắc "mirror permissions": Claude chỉ thấy những gì tài khoản của bạn vốn đã thấy. Nhưng "thấy được" không đồng nghĩa với "được phép đưa vào công cụ AI". Cần khoanh vùng đúng thư mục dự án, dùng tài khoản công ty có quyền tối thiểu, và kiểm tra điều khoản xử lý dữ liệu trước khi bật.

### Vì sao các lựa chọn khác sai
- **Có chạy trên điện thoại không:** là câu hỏi tiện ích, không liên quan đến rủi ro dữ liệu.
- **Upload được bao nhiêu file một lúc:** là giới hạn kỹ thuật, không phải câu hỏi về quyền và phạm vi dữ liệu.
- **Có dark mode không:** hoàn toàn không liên quan.

### Cách làm
Chọn một thư mục dự án riêng; dùng tài khoản công ty với quyền đọc tối thiểu; kiểm tra chính sách về dữ liệu đưa vào AI; tắt kết nối khi không dùng; rà lại danh sách quyền theo định kỳ.

> Mẹo thực tế: khi kết nối AI với kho dữ liệu, hãy hỏi "nếu thư mục này bị đọc và gửi đi, ai bị ảnh hưởng?" trước khi hỏi "tính năng có tiện không?".`
},
{
  id: "qz-ccao-206",
  topic: "claude",
  multi: true,
  q: "[Responsible Use] A team wants to use Claude to screen written applications for an internship programme. Which two statements are true about doing this responsibly? (Choose 2)",
  options: [
    "Claude can make the final decision alone if the same rubric is applied to every application",
    "A human should make the shortlisting decision, while Claude helps organise and summarise the evidence",
    "Removing names from applications removes all fairness concerns",
    "The criteria should be written down and reviewed for effects on different groups before use",
    "Automated screening is always fairer than people because it is consistent"
  ],
  answer: [1, 3],
  explain: `**Đúng: người quyết định, Claude chỉ tổ chức bằng chứng; và tiêu chí phải được viết ra, rà soát tác động tới các nhóm khác nhau.** Claude có thể tóm tắt, gom điểm mạnh, đối chiếu với yêu cầu — việc đó tiết kiệm thời gian và giúp người tuyển dụng nhìn đều các hồ sơ. Nhưng quyết định loại ai là quyết định về cơ hội của con người, cần người chịu trách nhiệm và giải thích được. Tiêu chí chấm phải rõ và được kiểm tra xem có vô tình bất lợi cho một nhóm nào không.

### Vì sao các lựa chọn khác sai
- **Claude tự quyết nếu cùng một rubric:** áp dụng cùng tiêu chí không xoá được thiên lệch trong dữ liệu huấn luyện hoặc trong cách tiêu chí được viết; và không có ai chịu trách nhiệm khi sai.
- **Ẩn tên là xong:** ẩn tên chỉ xử lý một nguồn thiên lệch; các tín hiệu khác (trường, cách viết, khoảng trống trong hồ sơ) vẫn có thể dẫn tới đối xử không công bằng.
- **Tự động luôn công bằng hơn người:** tính nhất quán không đồng nghĩa với công bằng; một quy tắc sai được áp dụng đều vẫn là một quy tắc sai.

### Cách làm
Dùng Claude để tóm tắt và đánh dấu hồ sơ phù hợp; người tuyển dụng quyết định; định kỳ rà soát các hồ sơ bị loại để xem có mẫu bất thường không; lưu tiêu chí và lý do.

> Mẹo thực tế: khi AI tham gia vào quyết định về người, hãy thiết kế thêm hai thứ — người quyết định cuối và cách để người bị ảnh hưởng phản hồi.`
},
{
  id: "qz-ccao-207",
  topic: "claude",
  q: "[Responsible Use] A developer pastes a company config file into a personal Claude account because it is quicker. The file contains database connection strings. What is the most accurate assessment?",
  options: [
    "It is fine, because the file is only being used for debugging and not shared publicly",
    "It is fine as long as the developer deletes the chat when finished",
    "It is fine because Claude is operated by a large, reputable company",
    "Confidential company data has left the company environment, which may breach policy and client commitments"
  ],
  answer: 3,
  explain: `**Đúng: dữ liệu mật của công ty đã ra khỏi môi trường do công ty kiểm soát.** Khi bạn dán vào tài khoản cá nhân, bạn không còn biết dữ liệu được lưu ở đâu, theo chính sách nào, và công ty không còn quyền quản trị. Điều này có thể vi phạm quy định nội bộ, thoả thuận với khách hàng, hoặc nghĩa vụ pháp lý về bảo mật. Uy tín của nhà cung cấp không thay thế được việc công ty bạn đã duyệt công cụ đó hay chưa, và việc xoá chat không hoàn tác được việc dữ liệu đã rời khỏi hệ thống.

### Vì sao các lựa chọn khác sai
- **Chỉ dùng để debug nên không sao:** mục đích không làm giảm độ nhạy cảm của dữ liệu; connection string thường chứa mật khẩu và địa chỉ hệ thống nội bộ.
- **Xoá chat là xong:** xoá giao diện không đồng nghĩa với xoá mọi bản ghi; rủi ro vẫn còn.
- **Nhà cung cấp uy tín nên an toàn:** uy tín nói về chất lượng dịch vụ, không phải về việc tổ chức của bạn đã cho phép đưa dữ liệu đó vào công cụ.

### Cách làm
Dùng tài khoản và workspace do công ty cung cấp; nếu chưa có, gửi yêu cầu xin phê duyệt; ẩn hoặc thay thế thông tin đăng nhập trước khi chia sẻ.

> Mẹo thực tế: trước khi dán một file cấu hình, hãy tìm nhanh các khoá như password, token, connection string — nếu có, coi như file đó không được phép rời khỏi công ty.`
},
{
  id: "qz-ccao-208",
  topic: "claude",
  multi: true,
  q: "[Responsible Use] A team is choosing a Claude plan for a department that handles personal customer data. Which two checks matter most before they start uploading files? (Choose 2)",
  options: [
    "Whether the interface is available in Vietnamese",
    "Who administers the account and what controls the organisation has over its data",
    "Whether the plan is the cheapest per seat",
    "How long conversations and project data are kept, and who can access or export them",
    "Whether the plan supports dark mode on mobile"
  ],
  answer: [1, 3],
  explain: `**Đúng: ai quản trị tài khoản và tổ chức có kiểm soát gì trên dữ liệu; cùng với thời gian lưu trữ và quyền truy cập, xuất dữ liệu.** Với dữ liệu cá nhân của khách, hai câu hỏi này quyết định bạn có đáp ứng được nghĩa vụ bảo vệ dữ liệu hay không. Tài khoản thuộc tổ chức cho phép quản trị viên đặt chính sách, quản lý thành viên và xử lý yêu cầu xoá; thời gian lưu trữ và quyền export cho biết dữ liệu tồn tại bao lâu và ai có thể lấy ra. Đây là các câu hỏi về vòng đời dữ liệu, không phải về giao diện.

### Vì sao các lựa chọn khác sai
- **Giao diện tiếng Việt:** là chi tiết trải nghiệm, không liên quan đến bảo vệ dữ liệu.
- **Gói rẻ nhất mỗi ghế:** chi phí là yếu tố kinh doanh, nhưng không được đặt trước yêu cầu bảo mật khi dữ liệu là thông tin cá nhân.
- **Dark mode trên mobile:** hoàn toàn không liên quan.

### Cách làm
Lập danh sách câu hỏi gửi cho nhà cung cấp: quản trị, lưu trữ, truy cập, export, quy trình xoá, vị trí dữ liệu; lưu câu trả lời bằng văn bản và cho pháp chế xem trước khi ký.

> Mẹo thực tế: câu hỏi "dữ liệu của chúng tôi nằm ở đâu, bao lâu và ai mở được?" quan trọng hơn mọi câu hỏi về tính năng.`
},
{
  id: "qz-ccao-209",
  topic: "claude",
  q: "[Responsible Use] A marketing team uses Claude to write social posts, and the drafts sometimes copy a competitor's slogan almost word for word. What is the most responsible response?",
  options: [
    "Publish them, since slogans are short and hard to own",
    "Keep the wording but add a note that it was written by AI",
    "Add more emojis so the posts look different from the original",
    "Have the wording checked and rewritten so it is original and cleared for use before publishing"
  ],
  answer: 3,
  explain: `**Đúng: kiểm tra và viết lại thành nội dung gốc, được duyệt trước khi đăng.** Claude học từ lượng văn bản rất lớn, nên đôi khi tái tạo gần nguyên văn một câu đã tồn tại, đặc biệt với các câu slogan ngắn và nổi tiếng. Đây là rủi ro đạo văn và bản quyền: đăng lên là công khai và có thể dẫn tới khiếu nại, gỡ bài, hoặc tranh chấp. "Ngắn nên khó bị sở hữu" là suy nghĩ sai — slogan là đối tượng được bảo hộ ở nhiều nơi, và việc cố ý sao chép là hành vi khác hẳn với trùng hợp.

### Vì sao các lựa chọn khác sai
- **Đăng vì slogan ngắn:** độ ngắn không loại bỏ quyền tác giả; đây là lý do phổ biến khiến doanh nghiệp gặp rủi ro.
- **Thêm ghi chú "do AI viết":** ghi chú không làm câu chữ trở thành bản gốc, cũng không xử lý vấn đề bản quyền.
- **Thêm emoji cho khác đi:** thay đổi hình thức không thay đổi phần được bảo hộ; nội dung cốt lõi vẫn giống.

### Cách làm
Tìm kiếm nhanh câu slogan trên internet; nếu trùng, yêu cầu Claude viết lại theo thông điệp của bạn thay vì câu mẫu; lưu lại bản đã duyệt và nguồn cảm hứng.

> Mẹo thực tế: khi Claude tạo ra một câu nghe rất "gọn và quen", hãy tìm kiếm nó — đó thường là dấu hiệu nó đang lặp lại một câu đã có.`
},
{
  id: "qz-ccao-210",
  topic: "claude",
  q: "[Responsible Use] An employee discovers that a colleague has been pasting confidential client documents into a personal Claude account for months. What is the most appropriate response?",
  options: [
    "Mention it to the colleague as a friendly reminder and assume they have it under control",
    "Post about the incident in the company's public chat channel to warn others",
    "Do nothing, assuming that experienced colleagues are already aware of all company security policies",
    "Report it through the company's official security or compliance channel for proper assessment and handling"
  ],
  answer: 3,
  explain: `**Đúng: báo theo kênh chính sách hoặc an toàn thông tin của công ty.** Đây là vấn đề của tổ chức, không phải tranh chấp cá nhân: dữ liệu khách hàng đã rời khỏi môi trường được kiểm soát trong nhiều tháng, nên cần người có thẩm quyền đánh giá phạm vi, nghĩa vụ thông báo và biện pháp khắc phục. Bạn không cần kết luận ai đúng sai; chỉ cần đưa thông tin cho người có trách nhiệm xử lý. Báo cáo đúng kênh cũng bảo vệ chính bạn khỏi bị xem là che giấu.

### Vì sao các lựa chọn khác sai
- **Nói với đồng nghiệp rồi để đó:** không tạo ra hành động khắc phục; dữ liệu vẫn ở ngoài kiểm soát.
- **Đăng lên chat nhóm:** lan truyền thông tin chưa được xác minh, có thể vi phạm quyền riêng tư của đồng nghiệp và không giải quyết được gì.
- **Bỏ qua vì đồng nghiệp giàu kinh nghiệm:** kinh nghiệm không thay thế quy định; việc kéo dài càng làm tăng rủi ro.

### Cách làm
Thông báo cho quản lý trực tiếp hoặc bộ phận an toàn thông tin; mô tả sự việc, thời gian, loại dữ liệu nếu biết; không tự ý mở rộng việc điều tra.

> Mẹo thực tế: xử lý sự cố dữ liệu là việc của tổ chức, không phải việc của một cá nhân — hãy đưa thông tin cho đúng người có thẩm quyền.`
},
{
  id: "qz-ccao-211",
  topic: "claude",
  q: "[Responsible Use] A team feeds Claude several months of chat logs to build a summary of recurring support problems. Some logs contain customer phone numbers. What is the most responsible approach?",
  options: [
    "Paste everything and trust Claude's built-in safety filters to automatically redact personal information.",
    "Remove or mask the phone numbers before analysis and keep the chat counts and issue types.",
    "Paste only a small sample of the logs, assuming they are representative, and ignore the phone numbers in the rest.",
    "Paste the data as a single long string, hoping the phone numbers will be too small a percentage to be noticed."
  ],
  answer: 1,
  explain: `**Đúng: ẩn hoặc bỏ số điện thoại trước khi phân tích, chỉ giữ những gì cần cho việc đếm vấn đề.** Số điện thoại là dữ liệu cá nhân, và ở đây hoàn toàn không cần thiết: mục tiêu là biết loại vấn đề nào xuất hiện nhiều, không phải từng khách hàng. Nguyên tắc data minimisation nói rằng chỉ đưa vào đúng lượng dữ liệu cần cho việc; làm vậy vừa giảm rủi ro vừa giúp ngữ cảnh gọn hơn. "Bảo Claude bỏ qua" không phải biện pháp bảo vệ, vì dữ liệu đã được gửi đi trước khi mô hình đọc chỉ dẫn.

### Vì sao các lựa chọn khác sai
- **Dán hết rồi bảo Claude bỏ qua số điện thoại:** dữ liệu đã rời khỏi hệ thống; "bỏ qua" chỉ là một câu lệnh, không xoá được gì.
- **Cho rằng số điện thoại không phải dữ liệu cá nhân:** số điện thoại là thông tin nhận dạng cá nhân và được bảo vệ ở hầu hết các quy định.
- **Thay mọi số bằng "UNKNOWN":** không cần thiết và làm mất thông tin nếu bạn thật sự cần đếm theo kênh liên hệ; che đúng phần nhạy cảm là đủ.

### Cách làm
Trước khi phân tích, lọc các cột định danh bằng công cụ hoặc script; giữ cột loại vấn đề, thời gian, số lượng; ghi lại quy trình lọc để lần sau lặp lại.

> Mẹo thực tế: nếu một cột không cần cho câu hỏi bạn đang hỏi, đừng dán nó — đó là biện pháp bảo vệ rẻ và hiệu quả nhất.`
},
{
  id: "qz-ccao-212",
  topic: "claude",
  multi: true,
  q: "[Responsible Use] A company is writing guidance on when employees should ask a qualified person instead of relying on Claude's answer. Which two situations clearly need that escalation? (Choose 2)",
  options: [
    "Rewording an internal announcement so it reads more clearly",
    "Interpreting a tax rule that will decide how much a client must pay",
    "Drafting a first version of a meeting agenda",
    "Deciding whether an employee's dismissal is legally justified",
    "Summarising a document the employee has already read"
  ],
  answer: [1, 3],
  explain: `**Đúng: diễn giải quy tắc thuế ảnh hưởng số tiền phải nộp, và quyết định cho thôi việc.** Cả hai đều là quyết định có hậu quả pháp lý hoặc tài chính, cần người có chuyên môn và thẩm quyền chịu trách nhiệm. Claude có thể giúp bạn hiểu khái niệm, soạn câu hỏi, hoặc chuẩn bị tài liệu để mang đi hỏi chuyên gia — nhưng không thay thế được ý kiến của kế toán, luật sư hay người phụ trách nhân sự.

### Vì sao các lựa chọn khác sai
- **Viết lại thông báo nội bộ cho rõ hơn:** rủi ro thấp, có người kiểm tra, sai thì sửa được.
- **Soạn dàn ý cuộc họp:** là bản nháp, không ràng buộc và dễ thay đổi.
- **Tóm tắt tài liệu đã đọc:** người đọc vẫn giữ bản gốc và tự kiểm chứng được.

### Cách làm
Trong hướng dẫn, liệt kê các nhóm việc cần chuyên gia: thuế, pháp lý, y tế, y tế nghề nghiệp, sa thải, hợp đồng lớn. Với các nhóm này, dùng Claude để chuẩn bị câu hỏi và bối cảnh, còn kết luận thì do chuyên gia đưa ra.

> Mẹo thực tế: nếu câu trả lời có thể làm ai đó mất tiền, mất việc hoặc bị ảnh hưởng pháp lý, hãy coi đó là việc cần người có chuyên môn.`
},
{
  id: "qz-ccao-213",
  topic: "claude",
  q: "[Responsible Use] A team publishes a report on its website and adds a small line at the end: 'Some sections were drafted with AI assistance.' What is the main benefit of this disclosure?",
  options: [
    "It legally indemnifies the publisher from any inaccuracies caused by the AI.",
    "It formally validates that the report has passed all quality assurance checks.",
    "It indicates that the report requires less human review because AI did the drafting.",
    "It lets readers judge the content knowing how it was produced, which supports informed trust"
  ],
  answer: 3,
  explain: `**Đúng: người đọc biết được cách nội dung được tạo ra, nên có thể đánh giá và kiểm chứng phù hợp.** Minh bạch (transparency) không phải là thú nhận điểm yếu, mà là cung cấp thông tin để người đọc đặt đúng mức tin cậy. Nó không chuyển trách nhiệm cho nhà cung cấp AI: người xuất bản vẫn chịu trách nhiệm về nội dung. Nó cũng không bảo đảm nội dung đúng — đó là việc của quy trình kiểm tra, chứ không phải của dòng ghi chú.

### Vì sao các lựa chọn khác sai
- **Chuyển trách nhiệm cho nhà cung cấp AI:** trách nhiệm vẫn thuộc về tổ chức xuất bản; không có cơ chế pháp lý nào chuyển nó bằng một dòng ghi chú.
- **Bảo đảm không có lỗi:** công bố việc dùng AI không đồng nghĩa với việc đã kiểm định; chất lượng đến từ bước review.
- **Cho rằng báo cáo không có phần do người viết:** thường là kết hợp; ghi chú đúng phải phản ánh đúng mức độ tham gia.

### Cách làm
Ghi rõ mức độ tham gia nếu có thể (ví dụ "bản nháp đầu tiên do AI tạo, nội dung do nhóm kiểm chứng"); kèm quy trình review; không dùng dòng ghi chú để thay cho bước kiểm tra.

> Mẹo thực tế: minh bạch hiệu quả nhất khi đi kèm bằng chứng về quy trình kiểm tra — người đọc tin vào quy trình, không tin vào câu "AI đã viết".`
},
{
  id: "qz-ccao-214",
  topic: "claude",
  q: "[Prompting Basics] A client asks: 'We have three proposals on the table. Which one should we choose?' The analyst wants Claude to compare them, not guess. Which prompt is most likely to give a defensible comparison?",
  options: [
    "Choose the proposal with the best formatting and tone, as these indicate professionalism.",
    "Compare the three proposals against these five requirements: cost, delivery time, support terms, security, and references. For each requirement, quote the evidence from the proposal and rate it strong, adequate, or weak. End with the trade-offs, not a single winner.",
    "Select the proposal that mentions the most features, assuming more features equals better value.",
    "Ask Claude to generate a new proposal that combines the best parts of all three."
  ],
  answer: 1,
  explain: `**Đúng: prompt nêu rõ tiêu chí so sánh, yêu cầu trích bằng chứng từ từng đề xuất, và yêu cầu kết thúc bằng trade-off thay vì một lựa chọn duy nhất.** So sánh (compare) là một động từ cụ thể: nó cần biết so theo tiêu chí nào và căn cứ vào đâu. Khi bạn đưa ra năm tiêu chí và yêu cầu trích dẫn bằng chứng, Claude buộc phải bám vào văn bản thay vì suy đoán. Yêu cầu kết thúc bằng trade-off phù hợp với thực tế: quyết định cuối thuộc về người đọc, và điều họ cần là bức tranh đánh đổi.

### Vì sao các lựa chọn khác sai
- **"Proposal nào tốt nhất, trả lời một câu":** không có tiêu chí, buộc Claude phải đoán; một câu cũng không đủ chỗ cho bằng chứng.
- **"Chọn giá rẻ nhất":** áp đặt sẵn một tiêu chí duy nhất và loại bỏ các yếu tố có thể quan trọng hơn.
- **"Đoán khách sẽ thích gì":** yêu cầu mô hình suy diễn tâm lý, không dựa trên dữ liệu.

### Cách làm
Trước khi hỏi, viết ra 3–5 tiêu chí quan trọng với khách hàng này; dán cả ba đề xuất; yêu cầu bảng bằng chứng; đọc lại các ô quan trọng so với bản gốc.

> Mẹo thực tế: nếu bạn không thể viết ra tiêu chí so sánh, hãy viết chúng trước khi hỏi Claude — nếu không, bạn sẽ nhận về một bài văn xuôi nghe hợp lý.`
},
{
  id: "qz-ccao-215",
  topic: "claude",
  multi: true,
  q: "[Prompting Basics] A user needs to turn a 30-page research report into a board-ready pack of 8 slides. Which two prompt designs are most likely to produce a usable result? (Choose 2)",
  options: [
    "Ask for all 8 slides in one prompt and accept the first version as final.",
    "First extract the key findings and numbers into a table, check it, then group them into 8 slide titles.",
    "Ask for a full 30-page summary instead of slides, to ensure no information is lost.",
    "Ask Claude to design the deck using its general knowledge of the report, to ensure the slides look high-level.",
    "Write one slide at a time after the structure is agreed, checking each against the source"
  ],
  answer: [1, 4],
  explain: `**Đúng: tách thành các bước có thể kiểm tra — trích xuất dữ kiện thành bảng, chốt cấu trúc slide, rồi viết từng slide và đối chiếu với nguồn.** Đây là task decomposition (chia việc lớn thành các bước nhỏ): mỗi bước cho ra một sản phẩm trung gian mà bạn kiểm tra được trước khi đi tiếp. Nếu yêu cầu cả 8 slide trong một lần, bạn chỉ nhận được một khối lớn và rất khó biết sai từ đâu; nếu tách ra, lỗi ở bước trích xuất được phát hiện trước khi nó lan vào slide.

### Vì sao các lựa chọn khác sai
- **Yêu cầu 8 slide trong một prompt:** không có điểm kiểm tra trung gian; lỗi lan ra toàn bộ deck.
- **Yêu cầu tóm tắt 30 trang:** không phải là sản phẩm được yêu cầu; bản tóm tắt dài vẫn cần chuyển thành slide.
- **Thiết kế deck không có báo cáo:** mất toàn bộ dữ kiện, chỉ còn khung sườn chung chung.

### Cách làm
Bước 1: yêu cầu bảng gồm phát hiện chính, số liệu, nguồn trang. Bước 2: bạn kiểm tra bảng. Bước 3: yêu cầu gom thành 8 tiêu đề slide. Bước 4: viết từng slide, mỗi slide một yêu cầu ngắn.

> Mẹo thực tế: khi một việc lớn cho ra kết quả "nửa vời", hãy chia nhỏ — bạn sẽ đổi một câu trả lời khó kiểm tra thành ba câu trả lời dễ kiểm tra.`
},
{
  id: "qz-ccao-216",
  topic: "claude",
  q: "[Prompting Basics] A prompt asks Claude to analyse last quarter's sales data and produce conclusions, but the answer mixes facts from the data with the model's own guesses. Which change best separates analysis from invention?",
  options: [
    "Tell Claude to use only the numbers in the attached data, mark any gap as [not in data], and keep assumptions in a separate section",
    "Include general background about the industry so Claude has more context to interpret the numbers.",
    "Ask for the answer to be at least 1,000 words to ensure it covers all possible interpretations.",
    "Ask Claude to sound more confident and authoritative so the conclusions are more persuasive to stakeholders."
  ],
  answer: 0,
  explain: `**Đúng: giới hạn nguồn dữ liệu kèm quy tắc đánh dấu chỗ thiếu, và tách phần giả định khỏi phần kết luận.** Giới hạn nguồn chặn việc Claude lấy số từ trí nhớ chung; đánh dấu "[not in data]" biến chỗ thiếu thành thông tin hữu ích thay vì một câu bịa tự tin. Tách giả định khỏi phát hiện giúp người đọc biết đâu là dữ kiện, đâu là suy luận — điều tối quan trọng khi phân tích.

### Vì sao các lựa chọn khác sai
- **Dán thêm bối cảnh chung về ngành:** làm loãng dữ liệu thật và mời gọi Claude kết hợp thông tin không kiểm chứng.
- **Yêu cầu dài hơn 1,000 từ:** độ dài không tạo ra độ chính xác; nó chỉ tạo thêm chỗ để suy đoán.
- **Yêu cầu tự tin hơn:** tự tin làm sai lệch khó phát hiện hơn, không làm nó đúng hơn.

### Cách làm
Prompt mẫu: "Chỉ dùng số trong file đính kèm. Mỗi số phải kèm tên cột và hàng. Nếu thiếu, ghi [không có trong dữ liệu]. Cuối báo cáo, liệt kê riêng các giả định."

> Mẹo thực tế: một quy tắc nhỏ — "thiếu thì ghi là thiếu" — thường hiệu quả hơn cả một trang hướng dẫn.`
},
{
  id: "qz-ccao-217",
  topic: "claude",
  q: "[Prompting Basics] A user asks Claude to 'brainstorm names for a new product'. Claude returns 40 names. The user needs 8 names that fit a specific market. What change is most likely to help?",
  options: [
    "Ask for 50 names to maximize the chance that one of them is perfect.",
    "Add a short brief: target market, tone, names to avoid, and a two-line reason for each suggestion, plus ask for 8 rather than 40.",
    "Ask Claude to sort the list of names by popularity or usage frequency.",
    "Ask Claude to generate names in multiple languages to increase the creative pool."
  ],
  answer: 1,
  explain: `**Đúng: thêm brief ngắn — thị trường mục tiêu, giọng điệu, những gì cần tránh, và yêu cầu kèm lý do — cùng số lượng cụ thể.** Brainstorming (động não) cần tự do, nhưng tự do không có nghĩa là thiếu bối cảnh: brief cho Claude biết "tốt" trong trường hợp này nghĩa là gì. Yêu cầu kèm lý do hai dòng buộc mỗi đề xuất phải gắn với tiêu chí, giúp bạn loại nhanh. Giới hạn 8 thay vì 40 làm tăng chất lượng và giảm thời gian sàng lọc.

### Vì sao các lựa chọn khác sai
- **Yêu cầu nhiều tên hơn:** 40 tên khó sàng lọc; vấn đề là thiếu tiêu chí, không phải thiếu số lượng.
- **Sắp xếp theo thứ tự alphabet:** sắp xếp không cải thiện mức độ phù hợp.
- **Đổi ngôn ngữ:** không liên quan đến tiêu chí phù hợp thị trường.

### Cách làm
Viết brief 3–4 dòng trước khi brainstorm; yêu cầu mỗi tên kèm một lý do; chọn 8–10; sau đó mới yêu cầu Claude đánh giá theo tiêu chí.

> Mẹo thực tế: brainstorm hiệu quả nhất khi bạn nói rõ "thế nào là hay" trước, không phải sau khi nhận danh sách.`
},
{
  id: "qz-ccao-218",
  topic: "claude",
  q: "[Prompting Basics] A user wants Claude to extract every date mentioned in a 20-page contract into a table, with the clause number. Claude returns a table with dates but no clause numbers. What is the best next message?",
  options: [
    "Send the same prompt again with the word 'please' added.",
    "Accept the table as is, since the dates are the most important part of the information.",
    "Paste the whole contract again in a new chat, hoping the model will adopt a different formatting style.",
    "Ask specifically for a three-column table (date, what it applies to, clause number) and point out that clause numbers were missing."
  ],
  answer: 3,
  explain: `**Đúng: chỉ rõ định dạng mong muốn thành ba cột và nêu rõ phần còn thiếu.** Đây là cách iterate (lặp và cải thiện) hiệu quả: mô tả chính xác cấu trúc đầu ra, thay vì nhắc lại yêu cầu chung. Việc nói rõ "thiếu số điều khoản" cho Claude biết chính xác cần bổ sung gì, còn việc đưa cấu trúc cột làm cho kết quả kiểm tra được bằng mắt. Thêm "please" hay gửi lại nguyên prompt không thay đổi thông tin.

### Vì sao các lựa chọn khác sai
- **Thêm "please":** không thêm thông tin, không thay đổi hành vi.
- **Chấp nhận vì có ngày:** thiếu số điều khoản làm bảng khó dùng cho việc kiểm tra và đàm phán.
- **Dán lại từ đầu và hy vọng khác:** cùng đầu vào thường cho cùng kiểu đầu ra; hy vọng không phải chiến lược.

### Cách làm
Mô tả đầu ra bằng cấu trúc: "Bảng 3 cột: Ngày | Điều khoản | Nội dung áp dụng". Nếu vẫn thiếu, yêu cầu kiểm tra lại và đánh dấu dòng nào không tìm thấy số điều khoản.

> Mẹo thực tế: khi định dạng sai, hãy mô tả định dạng đúng bằng cấu trúc cụ thể — Claude sửa theo cấu trúc tốt hơn theo tính từ.`
},
{
  id: "qz-ccao-219",
  topic: "claude",
  multi: true,
  q: "[Prompting Basics] A user has a prompt that produces good drafts for emails, but the drafts are sometimes too formal for a casual team. Which two changes are most likely to help without breaking what already works? (Choose 2)",
  options: [
    "Rewrite the entire prompt from scratch to completely change the structure.",
    "Add one short example of a casual message the team actually sends, labelled as the tone to match.",
    "Add the phrase 'be casual' to every single sentence in the prompt to ensure it's understood.",
    "Replace the word 'email' with 'message' throughout the prompt to imply a less formal medium.",
    "State the audience and context explicitly, such as 'internal note to teammates you work with daily, short and direct'."
  ],
  answer: [1, 4],
  explain: `**Đúng: thêm một ví dụ thật về giọng điệu cần theo, và nêu rõ người đọc cùng bối cảnh.** Ví dụ mẫu (few-shot) cho Claude một đích cụ thể thay vì một tính từ trừu tượng; "casual" với người này có thể là "thân thiện", với người khác là "thô". Nêu người đọc ("đồng nghiệp cùng nhóm, ghi chú nội bộ") giúp suy ra độ trang trọng phù hợp. Cả hai đều là thay đổi nhỏ, giữ nguyên phần prompt đã hoạt động tốt.

### Vì sao các lựa chọn khác sai
- **Viết lại toàn bộ prompt:** rủi ro làm mất phần đang hoạt động tốt; nên đổi từng phần một.
- **Lặp "be casual" nhiều lần:** lặp từ khoá không làm rõ nghĩa; "casual" vẫn là khái niệm chủ quan.
- **Đổi "email" thành "message":** chỉ đổi tên, không thay đổi giọng điệu.

### Cách làm
Thêm một dòng "Ví dụ giọng điệu:" kèm 2–3 câu thật; thêm một dòng "Người đọc: đồng nghiệp nội bộ". Chạy lại vài lần để kiểm tra độ ổn định.

> Mẹo thực tế: khi một prompt đã tốt, hãy thay đổi một phần mỗi lần — như vậy bạn luôn biết thay đổi nào có tác dụng.`
},
{
  id: "qz-ccao-220",
  topic: "claude",
  q: "[Prompting Basics] A user asks Claude to write a short product description and says 'keep it under 100 words'. The first draft is 140 words. What is the most useful adjustment?",
  options: [
    "Ask for a much shorter answer, such as 20 words, to guarantee it lands under 100",
    "Remove the length limit and ask Claude to be concise",
    "Accept 140 words, since it is close enough to 100",
    "Ask for exactly 5 short sentences, each under 18 words, and say the total must be at most 100 words"
  ],
  answer: 3,
  explain: `**Đúng: chuyển giới hạn thành ràng buộc kiểm tra được — 5 câu, mỗi câu dưới 18 từ, tổng không quá 100 từ.** Đây là cách viết ràng buộc định lượng: thay vì một con số chung, bạn đưa ra các đơn vị nhỏ mà cả bạn và Claude đều đếm được. Claude thường ước lượng độ dài kém, nên các ràng buộc nhỏ giúp nó kiểm soát tốt hơn. Bạn cũng kiểm tra dễ hơn: chỉ cần đếm từ trong từng câu.

### Vì sao các lựa chọn khác sai
- **Yêu cầu 20 từ:** quá ngắn so với nhu cầu, và không đảm bảo được 100 từ.
- **Bỏ giới hạn và bảo "ngắn gọn":** quay lại chỗ mơ hồ ban đầu; "ngắn gọn" không đo được.
- **Chấp nhận 140 từ vì gần đúng:** nếu con số là ràng buộc thật (ví dụ chỗ trên website), 40% vượt là lỗi thật.

### Cách làm
Viết ràng buộc thành các đơn vị nhỏ; sau khi nhận bản nháp, đếm nhanh; nếu vẫn vượt, yêu cầu cắt một câu cụ thể thay vì viết lại từ đầu.

> Mẹo thực tế: giới hạn dạng "N câu, mỗi câu M từ" dễ tuân theo hơn nhiều so với "hãy viết ngắn".`
},
{
  id: "qz-ccao-221",
  topic: "claude",
  q: "[Prompting Basics] A user wants Claude to write a job advertisement and gives the role title only. The result is generic and could fit any company. What single change would most improve it?",
  options: [
    "Ask Claude to make the advertisement more exciting and engaging for candidates.",
    "Add the must-have skills, the team context, and what makes this role different from similar ones.",
    "Ask for a longer advertisement so more detail and company history can appear.",
    "Ask Claude to use more strong adjectives and punchy language to attract top talent."
  ],
  answer: 1,
  explain: `**Đúng: thêm thông tin đầu vào — kỹ năng bắt buộc, bối cảnh nhóm, điểm khác biệt của vị trí.** Một tin tuyển dụng chung chung là hệ quả trực tiếp của việc đầu vào chung chung: Claude không thể viết cụ thể về một vị trí mà nó chỉ biết tên. Khi bạn cung cấp ba mảnh thông tin này, mô hình có đủ chất liệu để viết câu cụ thể và loại bớt những câu có thể dùng cho bất kỳ công ty nào.

### Vì sao các lựa chọn khác sai
- **Yêu cầu hấp dẫn hơn:** tính từ mạnh không tạo ra thông tin; nó chỉ làm câu văn ồn ào hơn.
- **Yêu cầu dài hơn:** dài hơn với đầu vào nghèo nàn sẽ là dài dòng hơn, không cụ thể hơn.
- **Yêu cầu nhiều tính từ mạnh:** cùng vấn đề như trên; không thay thế được thông tin.

### Cách làm
Chuẩn bị 5 gạch đầu dòng: 3 kỹ năng bắt buộc, 1 câu về nhóm, 1 câu về lý do vị trí này tồn tại; đưa vào prompt cùng yêu cầu độ dài và giọng điệu.

> Mẹo thực tế: nếu kết quả của Claude có thể dán vào website của bất kỳ công ty nào, vấn đề nằm ở đầu vào của bạn, không phải ở mô hình.`
},
{
  id: "qz-ccao-222",
  topic: "claude",
  q: "[Prompting Basics] A manager asks Claude to 'review this report and tell me what is wrong'. Claude returns a long list of everything, including style preferences. What is the most useful follow-up?",
  options: [
    "Ask for the review to be sorted by sentence length, from longest to shortest.",
    "Start a new chat and ask the same question again to see if the critique changes.",
    "Ask for the review to be limited to factual and logical errors, ranked by severity, with the sentence quoted for each.",
    "Ask Claude to write a new, improved version of the report, incorporating all the suggestions."
  ],
  answer: 2,
  explain: `**Đúng: giới hạn phạm vi review vào lỗi sự thật và logic, xếp theo mức nghiêm trọng, kèm câu bị trích dẫn.** "Tell me what is wrong" quá rộng: nó bao gồm văn phong, sở thích, cấu trúc — những thứ khác nhau về mức quan trọng. Khi bạn thu hẹp phạm vi và yêu cầu xếp hạng, bạn nhận được một danh sách dùng được: lỗi nghiêm trọng trước, kèm bằng chứng để kiểm tra. Việc trích dẫn từng câu giúp bạn xác minh nhanh thay vì đọc lại toàn bộ.

### Vì sao các lựa chọn khác sai
- **Sắp xếp theo độ dài:** độ dài không phải tiêu chí mức nghiêm trọng.
- **Hỏi lại y nguyên trong chat mới:** cùng đầu vào, cùng kết quả; không thay đổi phạm vi.
- **Nhờ Claude viết báo cáo mới:** không trả lời câu hỏi review; và viết lại từ đầu thường mất phần đã đúng.

### Cách làm
Prompt mẫu: "Chỉ nêu lỗi sự thật hoặc logic. Xếp theo mức nghiêm trọng: cao, trung bình, thấp. Mỗi lỗi: trích 1 câu, nói vì sao sai, đề xuất sửa."

> Mẹo thực tế: review tốt cần ba yếu tố — phạm vi, mức ưu tiên, bằng chứng; thiếu một trong ba thì danh sách sẽ khó dùng.`
},
{
  id: "qz-ccao-223",
  topic: "claude",
  multi: true,
  q: "[Prompting Basics] A prompt for a weekly report says: 'Write a detailed report about the project.' The output is long but unusable. Which two changes most directly address this? (Choose 2)",
  options: [
    "Ask for more detail in every section",
    "Specify the audience and the decisions they need to make from the report",
    "Ask Claude to use a more formal tone",
    "Paste every project document available so Claude has full context",
    "List the exact sections and what each must contain, plus a length limit per section"
  ],
  answer: [1, 4],
  explain: `**Đúng: nêu người đọc và quyết định họ cần, cùng cấu trúc phần rõ ràng kèm giới hạn độ dài.** "Detailed report about the project" không cho Claude biết viết cho ai, để làm gì, gồm những phần nào. Khi bạn nói "viết cho hội đồng dự án, họ quyết định có gia hạn giai đoạn hai không", Claude biết cần dữ kiện gì và mức độ chi tiết nào. Cấu trúc phần kèm giới hạn biến yêu cầu mơ hồ thành đầu ra kiểm tra được.

### Vì sao các lựa chọn khác sai
- **Yêu cầu chi tiết hơn ở mọi phần:** làm dài hơn, không làm đúng trọng tâm hơn.
- **Yêu cầu trang trọng hơn:** giọng điệu không phải vấn đề; cấu trúc và mục đích mới là vấn đề.
- **Dán mọi tài liệu:** làm loãng ngữ cảnh và khiến Claude khó chọn thông tin quan trọng.

### Cách làm
Viết prompt theo mẫu: người đọc, quyết định, 3–5 phần với nội dung bắt buộc, giới hạn từ mỗi phần, điều cần tránh.

> Mẹo thực tế: một báo cáo tốt được thiết kế quanh quyết định của người đọc, không quanh lượng dữ liệu có sẵn.`
},
{
  id: "qz-ccao-224",
  topic: "claude",
  q: "[Prompting Basics] A user gives Claude a long prompt with ten separate requests in it. The output handles three of them well and ignores the rest. What is the most effective fix?",
  options: [
    "Repeat the prompt twice in the same message",
    "Split the work into a short sequence of prompts, one or two requests each, carrying earlier results forward",
    "Make the prompt longer with more explanation",
    "Ask Claude to read the prompt again more carefully"
  ],
  answer: 1,
  explain: `**Đúng: chia thành một chuỗi prompt ngắn, mỗi lần một hoặc hai yêu cầu, và chuyển kết quả trước sang bước sau.** Đây là prompt chaining (chuỗi prompt): mỗi bước có một mục tiêu, nên Claude tập trung được và bạn kiểm tra được kết quả từng bước. Mười yêu cầu trong một prompt buộc mô hình phải cân bằng nhiều mục tiêu cùng lúc, và nó có xu hướng làm tốt vài mục nổi bật rồi bỏ sót phần còn lại. Chia nhỏ không phải là làm nhiều việc hơn, mà là làm mỗi việc một cách kiểm soát được.

### Vì sao các lựa chọn khác sai
- **Lặp lại prompt hai lần:** làm dài ngữ cảnh, không tăng khả năng theo dõi đủ yêu cầu.
- **Giải thích dài hơn:** thêm chữ không tạo thêm cấu trúc; vấn đề là số lượng yêu cầu.
- **Bảo Claude đọc kỹ hơn:** không có cơ chế "đọc kỹ hơn"; cần chia nhỏ để kiểm soát.

### Cách làm
Đánh số các yêu cầu; gom thành 3–4 nhóm; mỗi nhóm một prompt riêng; kiểm tra đầu ra trước khi sang nhóm tiếp theo.

> Mẹo thực tế: dấu hiệu cần chia prompt là khi bạn phải dùng dấu chấm phẩy để liệt kê nhiều việc trong một câu.`
},
{
  id: "qz-ccao-225",
  topic: "claude",
  multi: true,
  q: "[Prompting Basics] A user has a prompt that works well for summarising reports, and now wants the same prompt to work for comparing two suppliers. Which two changes are most appropriate? (Choose 2)",
  options: [
    "Keep the prompt identical, because a good prompt works for every task",
    "Use a comparison verb such as 'compare' instead of 'summarise', and list the criteria to compare on",
    "Ask for the output to be as long as possible so nothing is missed",
    "Remove all formatting instructions so Claude can decide the layout",
    "Add the source material for both suppliers and ask for evidence for each criterion"
  ],
  answer: [1, 4],
  explain: `**Đúng: đổi động từ nhiệm vụ sang "compare" và nêu tiêu chí, đồng thời cung cấp tài liệu của cả hai bên kèm yêu cầu bằng chứng.** Mỗi loại nhiệm vụ cần một cách viết khác nhau: tóm tắt cần độ đầy đủ và trung thành với nguồn; so sánh cần tiêu chí, bằng chứng hai phía và kết luận dạng trade-off. Giữ nguyên prompt tóm tắt cho việc so sánh sẽ cho ra hai bản tóm tắt rời rạc chứ không phải một phép so sánh.

### Vì sao các lựa chọn khác sai
- **Giữ nguyên prompt vì nó tốt:** hiệu quả phụ thuộc vào loại nhiệm vụ; một prompt tốt cho việc này có thể sai cho việc khác.
- **Yêu cầu dài nhất có thể:** độ dài không thay thế tiêu chí; và prompt dài dễ bị bỏ sót.
- **Bỏ hướng dẫn định dạng:** Claude phải đoán cách trình bày, kết quả khó so sánh.

### Cách làm
Viết lại prompt so sánh: động từ "compare", 4–5 tiêu chí, yêu cầu bảng bằng chứng, yêu cầu kết luận dạng "A tốt hơn ở X, B tốt hơn ở Y".

> Mẹo thực tế: khi đổi loại việc, hãy đổi cả động từ và cấu trúc đầu ra — đừng chỉ đổi tên tài liệu trong prompt cũ.`
},
{
  id: "qz-ccao-226",
  topic: "claude",
  q: "[Prompting Basics] A user wants a Claude prompt to answer questions about a company policy document. They paste the policy and add: 'Answer any question about our policies.' What is the most useful addition?",
  options: [
    "Add: 'Be as detailed as possible in every answer.'",
    "Add: 'Use only this policy document; if the answer is not in it, say so and do not guess.'",
    "Add: 'Answer in a friendly tone.'",
    "Add: 'If the policy is unclear, imagine what the policy probably intends.'"
  ],
  answer: 1,
  explain: `**Đúng: giới hạn nguồn vào đúng tài liệu và yêu cầu nói rõ khi không có câu trả lời.** Đây là grounding (neo câu trả lời vào tài liệu được cung cấp) kết hợp với quy tắc xử lý khoảng trống. Không có hai câu này, Claude có thể dùng kiến thức chung về chính sách nhân sự — nghe rất hợp lý nhưng có thể trái với quy định của công ty. Yêu cầu "nói không biết" biến sự thiếu thông tin thành tín hiệu hữu ích thay vì một câu trả lời tự tin sai.

### Vì sao các lựa chọn khác sai
- **"Càng chi tiết càng tốt":** chi tiết không đồng nghĩa đúng nguồn; nó còn làm tăng nguy cơ thêm thông tin ngoài tài liệu.
- **"Giọng thân thiện":** không liên quan đến độ chính xác.
- **"Hãy đoán ý định của chính sách":** đây chính là hành vi cần tránh; chính sách phải được hiểu đúng câu chữ, không phải suy diễn.

### Cách làm
Prompt mẫu: "Chỉ dùng tài liệu dưới đây. Mỗi câu trả lời phải trích số điều khoản. Nếu không có trong tài liệu, trả lời: 'Chính sách không đề cập nội dung này'."

> Mẹo thực tế: một câu "nếu không có thì nói không có" thường giảm mạnh số câu trả lời bịa mà không làm giảm chất lượng câu trả lời đúng.`
},
{
  id: "qz-ccao-227",
  topic: "claude",
  q: "[Prompting Basics] A user asks Claude to translate a technical paragraph into Vietnamese, and the translation is accurate but hard for the target readers to follow. What is the best follow-up?",
  options: [
    "Ask for the translation to be shorter",
    "Ask Claude to translate into a different language instead",
    "Paste the paragraph again and ask for a new translation",
    "Tell Claude who will read it and what they already know, then ask it to keep the technical terms but explain each one in plain language on first use"
  ],
  answer: 3,
  explain: `**Đúng: cung cấp thông tin về người đọc và yêu cầu giữ thuật ngữ kèm giải thích ngắn ở lần đầu xuất hiện.** Bản dịch đúng nhưng khó đọc thường vì nó bám sát cấu trúc câu gốc, vốn viết cho người trong ngành. Khi bạn nói rõ người đọc là ai và mức nền tảng của họ, Claude có thể điều chỉnh cách diễn đạt mà không làm sai nghĩa. Giữ thuật ngữ tiếng Anh và giải thích một lần là cách làm phổ biến trong tài liệu kỹ thuật: vừa chính xác vừa dễ theo.

### Vì sao các lựa chọn khác sai
- **Yêu cầu ngắn hơn:** ngắn hơn có thể làm mất thông tin; vấn đề là mức độ giải thích, không phải độ dài.
- **Dịch sang ngôn ngữ khác:** không giải quyết vấn đề người đọc.
- **Dịch lại từ đầu:** cùng đầu vào, cùng kiểu bản dịch.

### Cách làm
Mô tả người đọc: "kỹ thuật viên mới, chưa biết thuật ngữ này"; yêu cầu giữ thuật ngữ, thêm một câu giải thích ở lần đầu, và dùng câu ngắn hơn.

> Mẹo thực tế: với tài liệu kỹ thuật, "đúng" và "dễ hiểu" là hai yêu cầu riêng — hãy nói rõ cả hai trong prompt.`
},
{
  id: "qz-ccao-228",
  topic: "claude",
  multi: true,
  q: "[Prompting Basics] A user wants Claude to help prepare for a difficult conversation with a supplier about late deliveries. Which two prompt designs are most useful? (Choose 2)",
  options: [
    "Ask Claude to write the supplier's reply for them, so both sides are scripted",
    "Give the facts: dates, quantities, previous commitments, and the outcome the user wants",
    "Ask Claude to list what could go wrong in the conversation and suggest a calm response for each",
    "Ask Claude to write a message that makes the supplier feel guilty",
    "Ask Claude to decide whether the user should end the contract"
  ],
  answer: [1, 2],
  explain: `**Đúng: cung cấp dữ kiện và mục tiêu mong muốn, rồi yêu cầu lường trước các tình huống khó kèm cách phản hồi bình tĩnh.** Chuẩn bị cho một cuộc trao đổi khó cần hai thứ: thông tin (ngày, số lượng, cam kết trước đó) để không nói sai, và kịch bản (nếu họ nói X thì trả lời thế nào) để không bị động. Claude rất phù hợp để diễn tập các nhánh hội thoại; điều nó không nên làm là thay bạn quyết định hoặc viết lời buộc tội.

### Vì sao các lựa chọn khác sai
- **Viết luôn lời của supplier:** không giúp bạn chuẩn bị; và việc giả định nội dung hai phía dễ dẫn tới hiểu sai.
- **Yêu cầu câu chữ khiến supplier thấy tội lỗi:** mục tiêu là giải quyết vấn đề, không phải thắng cảm xúc; giọng buộc tội thường làm quan hệ xấu đi.
- **Nhờ Claude quyết định có nên chấm dứt hợp đồng:** đây là quyết định kinh doanh của bạn, cần số liệu và thẩm quyền, không phải suy đoán của mô hình.

### Cách làm
Prompt mẫu: "Đây là các dữ kiện. Tôi muốn kết quả là một kế hoạch khắc phục. Hãy liệt kê 4 phản ứng có thể có của họ và cách tôi trả lời, giữ giọng điệu hợp tác nhưng dứt khoát."

> Mẹo thực tế: dùng AI để diễn tập các nhánh hội thoại; quyết định và câu chữ cuối cùng vẫn nên là của bạn.`
},
{
  id: "qz-ccao-229",
  topic: "claude",
  q: "[Responsible Use] A consultant is summarizing customer support transcripts. What is the most important first step before uploading this data to Claude?",
  options: [
    "Ask Claude if the data is safe.",
    "Remove or anonymize any personally identifiable information (PII) such as customer names and email addresses.",
    "Upload the raw files to a public project for faster team access.",
    "Format the transcripts as a PDF before uploading."
  ],
  answer: 1,
  explain: `**Đúng: loại bỏ hoặc ẩn danh thông tin định danh cá nhân (PII).** Bảo mật dữ liệu là ưu tiên hàng đầu. Thông tin khách hàng như tên, địa chỉ, email cần được xoá sạch trước khi đưa vào mô hình để tuân thủ quyền riêng tư và bảo vệ danh tính khách hàng.`
},
{
  id: "qz-ccao-230",
  topic: "claude",
  q: "[Responsible Use] Claude generates a response that includes a historical date which feels wrong. What should you do?",
  options: [
    "Assume it is correct because Claude is a state-of-the-art model.",
    "Verify the date against a reliable, independent source before accepting the output.",
    "Delete the whole response because one date is wrong.",
    "Ask Claude to explain why it thinks the date is right and trust that explanation."
  ],
  answer: 1,
  explain: `**Đúng: kiểm chứng với nguồn độc lập tin cậy trước khi chấp nhận.** Mô hình có thể bị nhầm lẫn về dữ kiện (hallucination). Khi thấy nghi ngờ, việc kiểm tra lại với nguồn tin cậy là bắt buộc, đặc biệt khi nội dung dùng cho quyết định quan trọng.`
},
{
  id: "qz-ccao-231",
  topic: "claude",
  multi: true,
  q: "[Responsible Use] You are responsible for overseeing Claude's output in your team's workflow. Which two actions are essential for responsible oversight? (Choose 2)",
  options: [
    "Skip oversight for routine tasks to save time.",
    "Regularly review a sample of Claude-generated outputs to check for quality and safety.",
    "Require all team members to never question Claude's output.",
    "Set clear guidelines and rubrics for what is considered acceptable output.",
    "Trust that Claude automatically understands and follows all company policies."
  ],
  answer: [1, 3],
  explain: `**Đúng: rà soát mẫu đầu ra thường xuyên và đặt rubric chấp nhận rõ ràng.** Oversight (giám sát) cần có tiêu chuẩn (rubric) để đánh giá và quy trình kiểm tra (rà soát mẫu) để đảm bảo chất lượng và an toàn. Không thể mặc định mô hình tự hiểu chính sách công ty.`
},
{
  id: "qz-ccao-232",
  topic: "claude",
  q: "[Responsible Use] Claude's output shows bias in how it describes job candidates based on their background. What should you do?",
  options: [
    "Ignore it, as AI models are naturally neutral.",
    "Report the issue, investigate the cause (e.g., prompt, data), and update instructions to mitigate the bias.",
    "Accept it as the definitive evaluation of candidates.",
    "Ask Claude to generate the same biased response again to confirm."
  ],
  answer: 1,
  explain: `**Đúng: báo cáo, tìm nguyên nhân và cập nhật hướng dẫn.** AI có thể bị thiên kiến từ dữ liệu huấn luyện hoặc prompt. Việc của người dùng là nhận diện, báo cáo và điều chỉnh để giảm thiểu thiên kiến, đảm bảo công bằng.`
},
{
  id: "qz-ccao-233",
  topic: "claude",
  q: "[Responsible Use] What is the most dangerous risk of sharing sensitive API keys or passwords in a prompt?",
  options: [
    "It makes Claude answer slightly slower.",
    "It exposes sensitive credentials that can be misused.",
    "Claude will refuse to answer the prompt.",
    "It has no risk, as Claude is secure."
  ],
  answer: 1,
  explain: `**Đúng: nó làm lộ thông tin xác thực nhạy cảm có thể bị lạm dụng.** API keys và mật khẩu là dữ liệu cực mật. Việc đưa chúng vào prompt có thể làm lộ ra cho bên thứ ba hoặc trong dữ liệu lưu trữ không mong muốn.`
},
{
  id: "qz-ccao-234",
  topic: "claude",
  q: "[Responsible Use] A company is using Claude for internal decisions. How do they best ensure transparency?",
  options: [
    "Keep Claude's use a secret from employees.",
    "Clearly document which parts of the decision process involve Claude, and maintain human accountability.",
    "Let Claude make all decisions automatically without telling anyone.",
    "Tell employees Claude is always 100% correct."
  ],
  answer: 1,
  explain: `**Đúng: minh bạch hoá quy trình dùng Claude và duy trì trách nhiệm giải trình của con người.** Transparency (minh bạch) nghĩa là rõ ràng về vai trò của AI và luôn có người chịu trách nhiệm cuối cùng cho quyết định, không phải AI.`
},
{
  id: "qz-ccao-235",
  topic: "claude",
  q: "[Responsible Use] A team is considering using Claude for legal document analysis. What is a key compliance concern?",
  options: [
    "Whether Claude uses a specific font.",
    "Ensuring data privacy and confirming that the use of Claude complies with legal and organizational data policies.",
    "Whether Claude can generate images.",
    "Whether Claude is fast enough to do it in one second."
  ],
  answer: 1,
  explain: `**Đúng: đảm bảo quyền riêng tư dữ liệu và tuân thủ các chính sách dữ liệu pháp lý/công ty.** Tài liệu pháp lý là dữ liệu cực kỳ nhạy cảm và cần tuân thủ nghiêm ngặt các quy định về bảo mật.`
},
{
  id: "qz-ccao-236",
  topic: "claude",
  q: "[Responsible Use] Claude generates an output that contains potentially harmful content. What is the appropriate response?",
  options: [
    "Share it on social media.",
    "Report the output using the feedback mechanisms provided, and stop using that prompt.",
    "Keep generating similar content to see if it improves.",
    "Assume it was a test and ignore it."
  ],
  answer: 1,
  explain: `**Đúng: báo cáo nội dung thông qua các cơ chế phản hồi và dừng dùng prompt đó.** Báo cáo giúp Anthropic cải thiện mô hình, và dừng dùng prompt giúp bạn tránh rủi ro tiếp theo.`
},
{
  id: "qz-ccao-237",
  topic: "claude",
  multi: true,
  q: "[Responsible Use] A company wants to protect data in Claude Projects. Which two practices are best? (Choose 2)",
  options: [
    "Upload all employee personal documents to a shared project.",
    "Only upload data that is authorized for use in the Claude account according to company policy.",
    "Assume the project is public to everyone in the world.",
    "Periodically review the project files and remove unnecessary or sensitive data.",
    "Share the login credentials of the project with external people."
  ],
  answer: [1, 3],
  explain: `**Đúng: chỉ tải dữ liệu được cho phép và rà soát định kỳ để xoá dữ liệu không cần thiết.** Bảo vệ dữ liệu trong Project đòi hỏi tuân thủ chính sách dùng (không tải dữ liệu cấm) và vệ sinh dữ liệu (ràng buộc quyền hạn, định kỳ xoá file cũ).`
},
{
  id: "qz-ccao-238",
  topic: "claude",
  q: "[Responsible Use] A team lead is evaluating the impact of Claude on brand reputation. What is the most critical risk?",
  options: [
    "Claude might use too many colors in its output.",
    "Claude might accidentally publish or use hallucinated or incorrect information that damages the company's brand.",
    "Claude might use words that are too short.",
    "Claude might be too fast for customers to read."
  ],
  answer: 1,
  explain: `**Đúng: Claude có thể vô tình xuất bản thông tin sai hoặc bịa đặt gây hại cho thương hiệu.** Thương hiệu dựa vào sự tin tưởng và chuyên môn. Thông tin sai lan truyền từ phía công ty (kể cả do AI tạo) làm tổn hại nghiêm trọng đến hình ảnh chuyên nghiệp.`
},
{
  id: "qz-ccao-239",
  topic: "claude",
  q: "[Responsible Use] A company has a policy that prohibits sharing proprietary code with AI. What is the correct action?",
  options: [
    "Share only part of the code.",
    "Do not share any proprietary code, regardless of convenience.",
    "Share the code only if you are in a rush.",
    "Share the code but ask Claude to 'keep it secret'."
  ],
  answer: 1,
  explain: `**Đúng: tuyệt đối không chia sẻ mã nguồn độc quyền, bất kể sự tiện lợi.** Tuân thủ chính sách bảo mật của công ty là nghĩa vụ. Mã nguồn độc quyền là tài sản trí tuệ quan trọng, cần bảo vệ tuyệt đối.`
},
{
  id: "qz-ccao-240",
  topic: "claude",
  q: "[Responsible Use] You want to use Claude to generate meeting minutes that include participants' names and private discussions. What is the best practice?",
  options: [
    "Upload the raw recordings directly without editing.",
    "Anonymize or summarize the minutes to remove unnecessary PII, and ensure this use is compliant with company policy.",
    "Share the full minutes on a public forum.",
    "Assume it's fine because it's an internal meeting."
  ],
  answer: 1,
  explain: `**Đúng: ẩn danh hoặc tóm tắt biên bản để loại bỏ PII không cần thiết và đảm bảo tuân thủ chính sách.** Việc bảo vệ thông tin cá nhân và thảo luận riêng tư trong nội bộ là trách nhiệm, kể cả khi dùng AI.`
},
{
  id: "qz-ccao-241",
  topic: "claude",
  q: "[Responsible Use] What should you do if you notice Claude consistently providing incorrect information on a specific topic important to your work?",
  options: [
    "Continue using it and hope it improves by itself.",
    "Stop using Claude entirely for everything.",
    "Investigate if your prompts are causing the issue, or if the model's knowledge on that topic is unreliable, then take appropriate corrective actions.",
    "Assume you are the one who is wrong."
  ],
  answer: 2,
  explain: `**Đúng: điều tra xem prompt có gây ra lỗi không, hoặc kiến thức của mô hình về chủ đề đó không đáng tin, rồi hành động.** Nhận diện sự không ổn định (unreliability) của AI trong một chủ đề cụ thể là bước quan trọng để biết khi nào cần thay đổi phương pháp.`
},
{
  id: "qz-ccao-242",
  topic: "claude",
  q: "[Responsible Use] A new AI regulation requires human-in-the-loop for decisions affecting customer credit. How does this apply to using Claude?",
  options: [
    "Claude can make all credit decisions automatically.",
    "Claude can assist, but a human must review and approve all final decisions affecting customer credit.",
    "Human review is optional, not mandatory.",
    "Claude must be disabled immediately."
  ],
  answer: 1,
  explain: `**Đúng: Claude có thể hỗ trợ, nhưng con người phải rà soát và phê duyệt mọi quyết định cuối cùng.** Quy định "human-in-the-loop" (con người trong vòng lặp) yêu cầu sự can thiệp của con người đối với các quyết định quan trọng, không thể uỷ thác hoàn toàn cho AI.`
},
{
  id: "qz-ccao-243",
  topic: "claude",
  q: "[Responsible Use] What is a good way to handle sensitive data when you only need Claude to perform a generic analysis?",
  options: [
    "Upload all raw sensitive data anyway.",
    "Use a dummy dataset or anonymized data that still allows Claude to perform the analysis.",
    "Share the data with a random AI tool instead.",
    "Upload the data and hope Claude 'forgets' it."
  ],
  answer: 1,
  explain: `**Đúng: sử dụng dữ liệu giả hoặc dữ liệu đã ẩn danh mà vẫn cho phép Claude phân tích.** Khi không cần dữ liệu thật để có kết quả phân tích tổng quát, việc dùng dữ liệu giả là biện pháp bảo mật tối ưu.`
},
{
  id: "qz-ccao-244",
  topic: "claude",
  q: "[Prompting Basics] You want Claude to act as a project manager to create a timeline. What is the most effective prompt start?",
  options: [
    "Make a timeline.",
    "Act as a professional project manager. Here are the project requirements: [Insert details]. Create a detailed timeline.",
    "I need a project, give me a timeline.",
    "Claude, be a manager and do a timeline."
  ],
  answer: 1,
  explain: `**Đúng: yêu cầu Claude đóng vai (persona) và cung cấp đầy đủ chi tiết đầu vào.** Persona giúp Claude áp dụng giọng điệu và cách tiếp cận phù hợp; thông tin chi tiết (requirements) giúp kết quả thực tế, sát nhu cầu.`
},
{
  id: "qz-ccao-245",
  topic: "claude",
  q: "[Prompting Basics] You give Claude a task, and the output is too generic. What is the best improvement?",
  options: [
    "Ask it to 'be better'.",
    "Provide context, specific constraints, and examples of the desired quality/output (few-shot prompting).",
    "Stop using Claude and write it yourself.",
    "Ask Claude to generate the same output again."
  ],
  answer: 1,
  explain: `**Đúng: cung cấp bối cảnh, hạn chế cụ thể và ví dụ về chất lượng/định dạng mong muốn (few-shot).** Cung cấp ví dụ (few-shot) là cách mạnh mẽ nhất để định hình output theo đúng phong cách và cấu trúc bạn cần.`
},
{
  id: "qz-ccao-246",
  topic: "claude",
  q: "[Prompting Basics] Claude is answering too much irrelevant info. How do you fix this?",
  options: [
    "Ask it to 'be quiet'.",
    "Add a constraint: 'Focus only on [Topic], do not include information about [Irrelevant Topic].'",
    "Give up on this prompt.",
    "Just accept the irrelevant info."
  ],
  answer: 1,
  explain: `**Đúng: thêm hạn chế cụ thể: 'Chỉ tập trung vào... không bao gồm thông tin về...'** Hạn chế tiêu cực (negative constraints) giúp mô hình biết rõ phạm vi không được chạm tới.`
},
{
  id: "qz-ccao-247",
  topic: "claude",
  multi: true,
  q: "[Prompting Basics] Which two practices help Claude follow a complex instruction? (Choose 2)",
  options: [
    "Put all instructions in one long, rambling sentence.",
    "Break the instruction down into clear, sequential steps.",
    "Use bullet points for different parts of the task.",
    "Write the prompt in another language and hope it understands.",
    "Assume it knows your internal company acronyms without explaining them."
  ],
  answer: [1, 2],
  explain: `**Đúng: chia nhỏ thành các bước rõ ràng và dùng bullet points.** Chia nhỏ giúp mô hình tập trung vào từng phần, tránh bị quá tải. Bullet points tăng tính tổ chức, giúp mô hình dễ nhận diện và thực hiện theo cấu trúc.`
},
{
  id: "qz-ccao-248",
  topic: "claude",
  q: "[Prompting Basics] You want Claude to provide feedback on your draft. What will likely get the best feedback?",
  options: [
    "Just say 'Review this.'",
    "Provide the draft, the context of who the audience is, and a specific checklist or rubric for the review.",
    "Ask it to tell you if the draft is 'good'.",
    "Hope it finds all errors automatically without guidance."
  ],
  answer: 1,
  explain: `**Đúng: cung cấp bản nháp, ngữ cảnh đối tượng đọc và rubric/checklist cụ thể.** Review hiệu quả cần căn cứ vào mục tiêu (ngữ cảnh) và thước đo (rubric). Checklist giúp Claude không bỏ sót các điểm quan trọng bạn cần kiểm tra.`
},
{
  id: "qz-ccao-249",
  topic: "claude",
  q: "[Prompting Basics] You want to use Claude for a repeating task, but it keeps forgetting the formatting rules. What is the most effective solution?",
  options: [
    "Resend the rules every time in the prompt, or create a 'Project' with custom instructions that include these rules.",
    "Complain to Claude about its memory.",
    "Type the rules in all caps.",
    "Accept that formatting will never be perfect."
  ],
  answer: 0,
  explain: `**Đúng: gửi lại quy tắc trong prompt hoặc tạo một 'Project' với hướng dẫn tuỳ chỉnh (custom instructions).** Project giúp lưu hướng dẫn cốt lõi xuyên suốt nhiều phiên trò chuyện, bảo đảm các quy tắc được áp dụng nhất quán.`
},
{
  id: "qz-ccao-250",
  topic: "claude",
  q: "[Prompting Basics] Claude gives a response that is grammatically correct but factually hallucinated. How should you adjust your prompt?",
  options: [
    "Ask it to be 'more creative'.",
    "Add instructions to 'verify each fact against the provided source' and 'if you are unsure, state you do not know'.",
    "Use a more complex prompt structure.",
    "Ignore it, as hallucination is inevitable."
  ],
  answer: 1,
  explain: `**Đúng: thêm yêu cầu 'xác minh từng dữ kiện dựa trên nguồn cung cấp' và 'nếu không chắc chắn, hãy nói không biết'.** Đây là kỹ thuật grounding (neo câu trả lời vào tài liệu được cung cấp) kết hợp với quy tắc xử lý khoảng trống kiến thức (uncertainty management).`
},
{
  id: "qz-ccao-251",
  topic: "claude",
  multi: true,
  q: "[Prompting Basics] Which two prompt elements help Claude generate more reliable, less hallucinated output? (Choose 2)",
  options: [
    "Providing the reference source text directly in the prompt.",
    "Asking Claude to make up information if it doesn't know the answer.",
    "Adding: 'Base your answer strictly on the provided text.'",
    "Requesting it to always sound 100% confident, even if it's guessing.",
    "Telling it to ignore the source text if it has a better 'internal' idea."
  ],
  answer: [0, 2],
  explain: `**Đúng: cung cấp tài liệu tham chiếu và yêu cầu dựa chặt chẽ vào đó.** Grounding (neo) là kỹ thuật quan trọng nhất. Yêu cầu mô hình dựa vào tài liệu cung cấp giúp giới hạn phạm vi kiến thức và giảm khả năng tự bịa (hallucination).`
},
{
  id: "qz-ccao-252",
  topic: "claude",
  q: "[Prompting Basics] You want Claude to analyze data in a CSV file. What is the best prompt approach?",
  options: [
    "Just upload the file and say nothing.",
    "Upload the file and provide a prompt explaining what the data represents, what you want to analyze, and the format of the result.",
    "Ask Claude to guess what the CSV is about.",
    "Try to copy-paste the CSV without uploading the file, hoping it works."
  ],
  answer: 1,
  explain: `**Đúng: tải tệp lên và cung cấp prompt giải thích dữ liệu đại diện cho điều gì, mục tiêu phân tích và định dạng đầu ra.** Claude cần ngữ cảnh để hiểu cấu trúc và ý nghĩa của các cột dữ liệu trước khi phân tích.`
},
{
  id: "qz-ccao-253",
  topic: "claude",
  q: "[Prompting Basics] When Claude returns an output that is logically sound but too long, what is the best modification?",
  options: [
    "Ask it to 'be short'.",
    "Ask it to 'Summarize the response in 3 bullet points, keeping the core reasoning'.",
    "Ignore the length issue.",
    "Copy-paste it and delete the excess yourself."
  ],
  answer: 1,
  explain: `**Đúng: yêu cầu tóm tắt bằng 3 bullet points, giữ lại lập luận cốt lõi.** Yêu cầu định dạng (bullet points) và độ dài (số ý) cụ thể giúp Claude kiểm soát độ dài hiệu quả hơn lời mô tả chung chung.`
},
{
  id: "qz-ccao-254",
  topic: "claude",
  q: "[Prompting Basics] You find that Claude is consistently ignoring one specific constraint in a long prompt. What should you do?",
  options: [
    "Keep repeating the prompt until it works.",
    "Move that specific constraint to the end of the prompt or make it the very first instruction (recency/primacy bias).",
    "Assume Claude can't follow constraints.",
    "Change the topic of the prompt."
  ],
  answer: 1,
  explain: `**Đúng: di chuyển constraint đó lên đầu hoặc xuống cuối prompt.** Mô hình ngôn ngữ chịu ảnh hưởng của hiệu ứng thứ tự (vị trí đầu/cuối của prompt thường được chú ý hơn phần giữa). Đưa các yêu cầu quan trọng vào vị trí này giúp tăng xác suất được thực thi.`
},
{
  id: "qz-ccao-255",
  topic: "claude",
  multi: true,
  q: "[Prompting Basics] Which two techniques help Claude maintain consistency over a long, multi-part task? (Choose 2)",
  options: [
    "Providing a checklist for Claude to follow throughout the response generation.",
    "Giving one giant instruction and expecting Claude to figure out the parts.",
    "Prompting Claude to 'Stop and think' or 'Draft a plan before writing the full response'.",
    "Changing the instructions midway through the generation.",
    "Ignoring the need for structure in the output."
  ],
  answer: [0, 2],
  explain: `**Đúng: cung cấp checklist và yêu cầu lập kế hoạch trước khi viết.** Checklist giúp Claude tự kiểm tra các yêu cầu quan trọng. Lập kế hoạch (Chain of Thought) giúp mô hình có cái nhìn tổng thể trước khi thực hiện chi tiết, tăng tính nhất quán.`
},
{
  id: "qz-ccao-256",
  topic: "claude",
  q: "[Prompting Basics] A user wants Claude to write a technical blog post. What is the most robust prompt structure?",
  options: [
    "Just 'Write a blog post.'",
    "Provide: 1. Persona (Expert dev), 2. Audience (Junior devs), 3. Topic, 4. Required structure/tone, 5. Key facts to include.",
    "Paste the entire website content into the prompt.",
    "Ask Claude to 'Write something technical'."
  ],
  answer: 1,
  explain: `**Đúng: cung cấp: 1. Persona, 2. Đối tượng đọc, 3. Chủ đề, 4. Cấu trúc/Tông giọng, 5. Các dữ kiện chính.** Cấu trúc prompt đầy đủ giúp định hình mọi khía cạnh của output, từ giọng điệu đến nội dung.`
},
{
  id: "qz-ccao-257",
  topic: "claude",
  q: "[Prompting Basics] When asked to categorize a list of feedback, Claude misinterprets the categories. What is the best fix?",
  options: [
    "Assume it's impossible.",
    "Provide clear definitions for each category and 2-3 examples of feedback that belong to each category.",
    "Ask it to categorize again, hoping for luck.",
    "Choose different categories."
  ],
  answer: 1,
  explain: `**Đúng: cung cấp định nghĩa rõ ràng cho mỗi danh mục và 2–3 ví dụ cho từng danh mục.** Few-shot prompting (cung cấp ví dụ) là cách tốt nhất để định nghĩa lại các khái niệm theo ý muốn, giúp mô hình phân loại chính xác.`
},
{
  id: "qz-ccao-258",
  topic: "claude",
  q: "[Prompting Basics] A user wants to use Claude to help brainstorm product features, but Claude is being too 'safe' and uninspired. How can they prompt differently?",
  options: [
    "Ask Claude to be 'safer'.",
    "Add: 'Be creative, propose radical and out-of-the-box ideas, and don't worry about initial technical constraints.'",
    "Stop using Claude.",
    "Just ask the same thing again."
  ],
  answer: 1,
  explain: `**Đúng: thêm yêu cầu 'Hãy sáng tạo, đề xuất ý tưởng táo bạo/độc đáo, và chưa cần lo về rào cản kỹ thuật ngay.'** Khi cần sự sáng tạo, prompt phải explicit hướng dẫn mô hình nới lỏng các ràng buộc thông thường về thực tế.`
},
{
  id: "qz-ccao-913",
  topic: "claude",
  q: "[Workflow Integration] A team wants Claude to read free-text customer orders and pull out the shipping address into a structured field. Some orders are messy, and a wrong address means a parcel goes to the wrong person. How should the workflow treat low-confidence results?",
  options: [
    "Ship every order automatically, because Claude is usually right",
    "Auto-fill only high-confidence rows, and send low-confidence ones to a person before shipping",
    "Ask Claude to guess the missing parts so every row is complete",
    "Drop orders Claude cannot parse so the queue stays clean"
  ],
  answer: 1,
  explain: `**Đúng: tự động hoá phần chắc chắn, còn phần mơ hồ thì chuyển cho người xử lý trước khi gửi hàng.** "Độ tin cậy" (confidence) ở đây là mức chắc chắn mà hệ thống gán cho kết quả trích xuất — có thể là điểm số của model, hoặc là kết quả của các quy tắc kiểm tra (địa chỉ có đủ số nhà, mã bưu chính, thành phố không). Địa chỉ sai khiến hàng đến nhầm người, phát sinh chi phí giao lại và mất khách; đây là kiểu lỗi "rẻ để chặn, đắt nếu bỏ qua". Cách tiếp cận an toàn là "human-in-the-loop" (con người trong vòng lặp): máy làm phần dễ, người gánh phần khó.

### Vì sao các lựa chọn khác sai
- **Gửi mọi đơn, tin Claude thường đúng:** "thường đúng" vẫn có tỷ lệ sai; với hàng nghìn đơn, một tỷ lệ nhỏ sai vẫn là rất nhiều bưu kiện giao nhầm.
- **Bảo Claude đoán phần thiếu cho đủ:** đoán địa chỉ là bịa dữ liệu; một địa chỉ nghe hợp lý nhưng sai còn nguy hiểm hơn một ô trống.
- **Bỏ đơn không đọc được:** đơn biến mất khỏi quy trình, khách không nhận được hàng mà không ai biết; đây là "sạch sổ" bằng cách mất việc.

### Cách làm
Đặt ngưỡng tin cậy; trên ngưỡng thì tự điền; dưới ngưỡng thì đưa vào hàng đợi chờ người; ghi log tỷ lệ phải sửa tay để theo dõi.

> Mẹo thực tế: tự động hoá nên bắt đầu ở khâu "đọc và chuẩn bị dữ liệu", còn khâu "gửi hàng thật" thì giữ một chốt người cho đến khi tỷ lệ sai đủ thấp và ổn định.`
},
{
  id: "qz-ccao-914",
  topic: "claude",
  q: "[Workflow Integration] A company runs the same Claude translation workflow for 12 markets. They want to expand from 2 pilot markets to all 12. What is the most sensible rollout?",
  options: [
    "Switch all 12 markets on at once to save management time",
    "Let each market start whenever its local team is ready, with no shared quality check",
    "Expand in stages, checking translation quality per market before adding the next",
    "Roll back to human-only translation because two pilots are not enough"
  ],
  answer: 2,
  explain: `**Đúng: mở rộng theo từng đợt (staged rollout), đo chất lượng từng thị trường rồi mới thêm thị trường tiếp theo.** Mỗi ngôn ngữ có đặc thù riêng (thuật ngữ, định dạng ngày, cách viết số, sắc thái), nên kết quả tốt ở hai thị trường này không đảm bảo tốt ở thị trường khác. Mở rộng theo đợt giúp bạn phát hiện sớm một kiểu lỗi (ví dụ sai chính tả tên riêng) trước khi nó lan ra 12 nước, và giữ được khả năng dừng lại ở phạm vi nhỏ nếu có sự cố.

### Vì sao các lựa chọn khác sai
- **Bật cả 12 nước cùng lúc:** nếu quy trình có lỗi hệ thống, cả 12 thị trường cùng sai và bạn phải sửa gấp trên diện rộng.
- **Mỗi thị trường tự bật, không kiểm tra chung:** thiếu chuẩn chất lượng chung; mỗi nơi một kiểu, khó so sánh và khó cải tiến.
- **Quay về làm tay hoàn toàn:** phản ứng thái quá; hai pilot đã cho dữ liệu để cải thiện, chưa có bằng chứng là quy trình hỏng.

### Cách làm
Liệt kê thị trường theo mức rủi ro; mỗi đợt thêm 2–3 nước; đo tỷ lệ phải sửa và khiếu nại; chốt tiêu chí "đạt" trước khi mở đợt sau.

> Mẹo thực tế: mở rộng theo đợt biến một quyết định lớn khó đảo ngược thành nhiều quyết định nhỏ dễ dừng.`
},
{
  id: "qz-ccao-915",
  topic: "claude",
  multi: true,
  q: "[Workflow Integration] A bank is adding a Claude step to its loan application process to summarise documents and flag missing information. Which TWO controls are essential before going live? (Choose 2)",
  options: [
    "Let Claude make the final approve-or-reject decision to keep the process fast",
    "Keep a person making the final credit decision, with Claude only preparing a summary",
    "Log the inputs, the model output, and the human decision for each application",
    "Send full identity documents to a public chat tool so the whole team can review them together",
    "Remove the audit trail to reduce storage cost"
  ],
  answer: [1, 2],
  explain: `**Đúng: người quyết định tín dụng cuối cùng (Claude chỉ tóm tắt), và ghi log đầu vào, đầu ra, quyết định của người cho từng hồ sơ.** Quyết định cho vay ảnh hưởng tài chính của người khác và bị quản lý chặt; mô hình không có thẩm quyền và không chịu trách nhiệm, nên con người phải là người phê duyệt. Log đầy đủ (audit trail — dấu vết kiểm toán) giúp bạn trả lời "vì sao hồ sơ này bị từ chối" khi khách khiếu nại hoặc khi cơ quan quản lý hỏi, và giúp phát hiện nếu model bỏ sót thông tin.

### Vì sao các lựa chọn khác sai
- **Để Claude tự quyết duyệt/từ chối:** không có người chịu trách nhiệm; một quyết định sai ảnh hưởng trực tiếp đến quyền lợi khách hàng.
- **Gửi hồ sơ định danh đầy đủ lên công cụ chat công khai:** vi phạm bảo vệ dữ liệu cá nhân; đây là dữ liệu nhạy cảm nhất trong quy trình.
- **Bỏ audit trail cho rẻ:** khi có tranh chấp, bạn không có bằng chứng để giải trình; chi phí lưu log nhỏ hơn nhiều so với rủi ro.

### Cách làm
Claude làm bản tóm tắt và đánh dấu mục còn thiếu; người có thẩm quyền quyết định; lưu gói hồ sơ gồm input, output, người duyệt, thời gian.

> Mẹo thực tế: trong quy trình tài chính, nguyên tắc là "AI chuẩn bị, người ký duyệt, hệ thống ghi lại".`
},
{
  id: "qz-ccao-916",
  topic: "claude",
  q: "[Workflow Integration] A team wants a Claude bot to read a shared chat channel and post a daily summary of decisions. What should they check first about the bot's access?",
  options: [
    "Whether the bot's name is easy to remember",
    "How many messages the bot can post per day",
    "Whether the summary uses bullet points",
    "Which channels the bot can read and write, scoped to only what it needs"
  ],
  answer: 3,
  explain: `**Đúng: giới hạn phạm vi kênh mà bot đọc và ghi, chỉ đúng những gì cần cho việc.** Kết nối (connector) thường đi kèm nguyên tắc "mirror permissions": bot chỉ thấy nội dung mà tài khoản của nó vốn đã thấy. Nếu cấp cho bot quyền đọc toàn bộ workspace, nó có thể tóm tắt cả những kênh chứa thông tin nhạy cảm (lương, nhân sự, pháp lý) mà việc tóm tắt không cần đến. "Least privilege" (đặc quyền tối thiểu) nghĩa là chỉ cấp đúng quyền cần cho nhiệm vụ, không hơn.

### Vì sao các lựa chọn khác sai
- **Tên bot dễ nhớ:** là chuyện tiện dụng, không liên quan đến quyền truy cập dữ liệu.
- **Số tin nhắn mỗi ngày:** là giới hạn tần suất, không phải phạm vi dữ liệu.
- **Định dạng bullet:** là cách trình bày, không ảnh hưởng đến quyền.

### Cách làm
Tạo một kênh riêng chỉ chứa thông tin cần tóm tắt; cấp bot quyền đọc đúng kênh đó; ghi rõ quyền ghi; rà lại danh sách quyền định kỳ.

> Mẹo thực tế: trước khi kết nối AI với một kho dữ liệu, hãy hỏi "nếu toàn bộ nội dung ở đây bị đọc và gửi đi, ai bị ảnh hưởng?".`
},
{
  id: "qz-ccao-917",
  topic: "claude",
  q: "[Workflow Integration] A company wants to tag the sentiment of one million old support tickets from last year. The result is not needed immediately. Which integration style fits best?",
  options: [
    "A batch job that sends records in bulk and collects results later",
    "A live chat where an agent waits for each answer",
    "Embedding the model inside the customer-facing chat widget",
    "Asking each agent to paste tickets one by one into the web chat"
  ],
  answer: 0,
  explain: `**Đúng: dùng xử lý theo lô (batch) — gửi một lượng lớn bản ghi, nhận kết quả sau, không cần người trực.** Batch phù hợp với việc lớn, không gấp, chạy một lần: thường rẻ hơn so với gọi từng yêu cầu thời gian thực và không chiếm chỗ của việc hỗ trợ khách đang diễn ra. "Real-time" (thời gian thực) là khi người dùng chờ câu trả lời ngay; ở đây không ai chờ, nên tối ưu là thông lượng (throughput — số việc xử lý được trong một đơn vị thời gian) và chi phí, không phải độ trễ.

### Vì sao các lựa chọn khác sai
- **Chat trực tiếp từng cái:** một triệu ticket qua chat là không khả thi và đắt; đây là kiểu dùng sai công cụ.
- **Nhúng vào widget khách hàng:** việc này là phân tích nội bộ, không phải trả lời khách theo thời gian thực.
- **Nhờ từng agent dán tay:** tốn công người, dễ sót, không có cách đối chiếu.

### Cách làm
Chọn cơ chế batch; chia lô nhỏ để chạy thử; đối chiếu kết quả với một mẫu đã gán nhãn tay; theo dõi tỷ lệ lỗi trước khi chạy toàn bộ.

> Mẹo thực tế: chọn "real-time" hay "batch" dựa trên việc có ai đang chờ câu trả lời hay không — nếu không, batch gần như luôn rẻ hơn.`
},
{
  id: "qz-ccao-918",
  topic: "claude",
  q: "[Workflow Integration] A workflow asks Claude for a JSON object, then a downstream system reads it automatically. Sometimes the reply is not valid JSON and the next step crashes. What is the best safeguard?",
  options: [
    "Trust the model and remove the downstream validation",
    "Ask Claude to always reply with valid JSON and assume it will",
    "Validate the JSON against a schema and route invalid replies to a retry or a person",
    "Store the raw text and let the next step guess the fields"
  ],
  answer: 2,
  explain: `**Đúng: kiểm tra JSON theo schema (lược đồ cấu trúc) và chuyển bản không hợp lệ sang thử lại hoặc cho người xử lý.** Mô hình sinh văn bản, nên đôi khi nó thêm lời chào, thiếu dấu ngoặc, hoặc đổi tên trường — khiến JSON hỏng. Nếu bước sau đọc thẳng mà không kiểm tra, một câu trả lời lỗi làm sập cả quy trình. Cách bền vững là coi đầu ra của model là "chưa tin cậy": có cổng kiểm tra cấu trúc, và một đường thoát (retry hoặc hàng đợi) khi sai. Đây là nguyên tắc "validate at the boundary" — kiểm tra ngay tại ranh giới giữa hai hệ thống.

### Vì sao các lựa chọn khác sai
- **Tin model và bỏ kiểm tra:** lỗi không được chặn sẽ lan xuống hệ thống sau; hậu quả khó truy vết.
- **Bảo "luôn trả JSON hợp lệ" rồi tin:** câu lệnh không đảm bảo; mô hình vẫn có thể sai định dạng.
- **Lưu text thô cho bước sau tự đoán:** đẩy vấn đề xuống, không giải quyết; "đoán" càng dễ sai.

### Cách làm
Định nghĩa schema; kiểm tra từng trường và kiểu; nếu sai, thử lại một lần với yêu cầu sửa; vẫn sai thì đưa vào hàng đợi và báo động.

> Mẹo thực tế: mọi đầu ra của AI dùng cho máy đọc lại đều cần một cổng kiểm tra — đừng để "model nói là đúng" thay cho kiểm tra.`
},
{
  id: "qz-ccao-919",
  topic: "claude",
  multi: true,
  q: "[Workflow Integration] A company has launched a Claude-assisted email drafting feature and wants to know if it helps or hurts. Which TWO metrics are most useful? (Choose 2)",
  options: [
    "How many drafts agents keep with little or no editing",
    "Average time to finish and send a reply compared with before",
    "Total number of chats opened in the app",
    "The average length of the generated drafts",
    "How many employees have logged in at least once"
  ],
  answer: [0, 1],
  explain: `**Đúng: tỷ lệ bản nháp được giữ gần như nguyên vẹn, và thời gian xử lý mỗi thư so với trước khi có công cụ.** Hai thước đo này phản ánh kết quả thật: nếu bản nháp tốt, người dùng giữ nhiều và làm nhanh hơn; nếu tệ, họ viết lại gần hết — tức công cụ đang thêm việc. Đây là "outcome metrics" (thước đo kết quả), khác với "activity metrics" (thước đo hoạt động) như số chat hay số người đăng nhập, vốn chỉ cho biết có người dùng chứ không cho biết có lợi hay không.

### Vì sao các lựa chọn khác sai
- **Số chat đã mở:** chỉ đo mức sử dụng; dùng nhiều không đồng nghĩa với tiết kiệm thời gian.
- **Số người đã đăng nhập:** mức độ áp dụng, không phải hiệu quả.
- **Độ dài bản nháp:** dài hơn không có nghĩa tốt hơn; khách thường muốn ngắn và đúng.

### Cách làm
Đo thời gian trung bình mỗi thư trong hai tuần trước và sau; ghi tỷ lệ nội dung giữ nguyên; hỏi thêm khách hàng về chất lượng.

> Mẹo thực tế: nếu không đo được thời gian tiết kiệm, rất có thể công cụ đang thêm việc chứ không giảm việc.`
},
{
  id: "qz-ccao-920",
  topic: "claude",
  q: "[Workflow Integration] A nightly Claude workflow's token usage suddenly triples, raising the bill. What is the most sensible first step?",
  options: [
    "Switch to the most expensive model to improve quality",
    "Remove all limits so the workflow never stops early",
    "Run the same workflow twice to confirm the number",
    "Measure which step consumes the tokens, then cut oversized context and unnecessary retries"
  ],
  answer: 3,
  explain: `**Đúng: đo xem bước nào ngốn token, rồi cắt bớt ngữ cảnh quá lớn và các lần thử lại không cần thiết.** "Token" là đơn vị văn bản mà mô hình đọc/ghi (xem mục 9 của AGENTS.md); chi phí tỉ lệ với số token. Nguyên nhân phổ biến khi chi phí tăng vọt: một bước nhồi cả tài liệu dài vào mỗi lần gọi, hoặc vòng lặp thử lại nhiều lần khi output lỗi. Trước khi đổi model hay tăng ngân sách, bạn cần biết tiền đang đi đâu — nếu không, mọi điều chỉnh chỉ là phỏng đoán.

### Vì sao các lựa chọn khác sai
- **Đổi sang model đắt nhất:** làm tăng chi phí, và không chẩn đoán được nguyên nhân.
- **Bỏ mọi giới hạn:** khiến chi phí và rủi ro tăng thêm; giới hạn tồn tại để chặn đúng loại sự cố này.
- **Chạy lại để xác nhận:** không cho biết bước nào tốn; chỉ tốn thêm tiền.

### Cách làm
Bật thống kê token theo bước; tìm bước chiếm phần lớn; rút gọn ngữ cảnh (chỉ gửi phần liên quan); giới hạn số lần retry; đặt trần chi phí và cảnh báo.

> Mẹo thực tế: khi chi phí AI tăng đột ngột, hãy hỏi "bước nào tiêu token?" trước khi hỏi "đổi model nào?".`
},
{
  id: "qz-ccao-921",
  topic: "claude",
  q: "[Workflow Integration] A healthcare workflow must not send patient notes to any model that keeps or trains on the data. Which integration choice best respects that rule?",
  options: [
    "Use a free consumer chat account because it is convenient",
    "Use an enterprise or API arrangement with a data processing agreement and no-retention terms",
    "Paste the notes and ask the model to forget them afterwards",
    "Send only half of each note to reduce exposure"
  ],
  answer: 1,
  explain: `**Đúng: dùng gói doanh nghiệp/API có thoả thuận xử lý dữ liệu (DPA — data processing agreement) và điều khoản không lưu, không huấn luyện.** Với dữ liệu bệnh nhân, yêu cầu không phải là "model có tiện không" mà là "dữ liệu này được phép đi tới đâu, ai giữ, giữ bao lâu". DPA là văn bản ràng buộc nhà cung cấp về cách xử lý dữ liệu; điều khoản no-retention quy định dữ liệu không bị lưu sau khi xử lý. Tài khoản tiêu dùng miễn phí thường không có các bảo đảm này và có thể dùng dữ liệu để cải thiện dịch vụ.

### Vì sao các lựa chọn khác sai
- **Dùng chat miễn phí cho tiện:** không có bảo đảm hợp đồng về lưu trữ hay huấn luyện; dữ liệu bệnh nhân có thể bị dùng ngoài mong muốn.
- **Dán rồi bảo model quên:** "quên" là câu lệnh, không xoá được bản ghi; dữ liệu đã rời khỏi hệ thống.
- **Gửi nửa ghi chú:** vẫn là dữ liệu bệnh nhân; giảm lượng không làm nó hợp lệ.

### Cách làm
Làm việc với pháp chế để ký DPA; chọn kênh có điều khoản no-retention; giới hạn dữ liệu gửi vào đúng phần cần; kiểm tra định kỳ.

> Mẹo thực tế: với dữ liệu y tế, câu hỏi đầu tiên luôn là "kênh này có DPA và điều khoản không lưu không?", không phải "tính năng có nhanh không?".`
},
{
  id: "qz-ccao-922",
  topic: "claude",
  multi: true,
  q: "[Workflow Integration] A team is deciding where to place human checkpoints in a Claude-assisted workflow. Which TWO are the strongest candidates for a required human review? (Choose 2)",
  options: [
    "Actions that spend money or are hard to undo, such as issuing refunds",
    "Outputs where Claude's confidence is low or the inputs are ambiguous",
    "Reformatting a date into a standard style",
    "Every single suggestion, no matter how routine, to be safe",
    "Sorting a list of names alphabetically"
  ],
  answer: [0, 1],
  explain: `**Đúng: chốt người ở hành động tốn tiền/khó hoàn tác, và ở đầu ra có độ tin cậy thấp hoặc đầu vào mơ hồ.** Đây là cách đặt "human-in-the-loop" đúng chỗ: rủi ro cao thì cần người, việc cơ học thì không. Hoàn tiền sai là mất tiền thật và khó đòi lại; đầu vào mơ hồ dễ khiến model suy diễn sai. Ngược lại, việc như chuẩn hoá ngày hay sắp xếp tên gần như không có hậu quả nếu sai, nên bắt người duyệt chỉ làm chậm mà không tăng an toàn.

### Vì sao các lựa chọn khác sai
- **Duyệt mọi đề xuất, kể cả việc vụn vặt:** biến con người thành nút cổ chai; mọi người sẽ bấm duyệt theo phản xạ, và chốt trở nên vô nghĩa.
- **Chuẩn hoá định dạng ngày:** hậu quả thấp, dễ phát hiện; không cần người.
- **Sắp xếp danh sách theo tên:** việc máy làm tốt và sai cũng dễ sửa; không cần chốt người.

### Cách làm
Lập danh sách hành động theo mức hậu quả; đặt chốt người cho nhóm "tốn tiền / khó đảo / tin cậy thấp"; nhóm còn lại để tự động kèm ghi log.

> Mẹo thực tế: đặt chốt người ở nơi sai thì tốn kém, đặt đúng nơi thì rẻ — hãy xếp theo hậu quả, không theo cảm giác.`
},
{
  id: "qz-ccao-923",
  topic: "claude",
  q: "[Product Selection] A freelance consultant travels a lot and, on a tablet, wants to ask questions about a handful of PDF reports and get answers with citations. They do not code. Which option needs the least setup?",
  options: [
    "Projects on Claude.ai with the PDFs uploaded",
    "Claude Code installed in a terminal",
    "A custom RAG pipeline built on the API",
    "A self-hosted vector database connected via MCP"
  ],
  answer: 0,
  explain: `**Đúng: Projects trên Claude.ai — tải vài PDF lên, hỏi kèm trích dẫn, dùng được trên máy tính bảng, không cần code.** Projects xử lý việc trích xuất văn bản, lập chỉ mục và trích dẫn nguồn; người không kỹ thuật chỉ cần tạo project và tải tài liệu. "RAG" (retrieval-augmented generation — sinh câu trả lời có truy hồi tài liệu) là kỹ thuật đằng sau, nhưng bạn không phải tự dựng khi dùng Projects. "MCP" (Model Context Protocol) là chuẩn để nối model với công cụ/dữ liệu bên ngoài, thường dùng cho lập trình viên.

### Vì sao các lựa chọn khác sai
- **Claude Code trong terminal:** cần cài đặt và biết dùng dòng lệnh; không phù hợp với người không code và với việc đọc PDF khi di chuyển.
- **RAG pipeline trên API:** phải tự viết code, dựng vector database, xử lý chunking — tốn công.
- **Vector database + MCP:** dành cho nhà phát triển, phức tạp và cần hạ tầng.

### Cách làm
Tạo một project; tải PDF; viết custom instruction ngắn (ví dụ "chỉ dùng tài liệu trong project, nêu rõ nguồn"); thử vài câu hỏi.

> Mẹo thực tế: với người không kỹ thuật, "ít cài đặt nhất" thường thắng — hãy chọn giao diện có sẵn trước khi nghĩ đến tự dựng.`
},
{
  id: "qz-ccao-924",
  topic: "claude",
  q: "[Product Selection] A 5,000-person company needs single sign-on, automated user provisioning, admin controls, and audit logs for Claude. Which plan fits?",
  options: [
    "Free tier with a shared login",
    "Individual Pro subscriptions bought by each employee",
    "Enterprise plan",
    "Pay-per-token API keys handed out by email"
  ],
  answer: 2,
  explain: `**Đúng: gói Enterprise, vì nó cung cấp SSO, SCIM, quản trị tập trung và audit logs.** "SSO" (single sign-on — đăng nhập một lần) cho phép nhân viên dùng tài khoản công ty để vào Claude; "SCIM" là chuẩn tự động tạo/gỡ tài khoản khi nhân sự thay đổi; "audit logs" là nhật ký ghi ai làm gì, phục vụ kiểm toán và điều tra sự cố. Ở quy mô 5,000 người, việc tạo/gỡ tài khoản thủ công là không khả thi, và yêu cầu tuân thủ đòi hỏi dấu vết kiểm toán.

### Vì sao các lựa chọn khác sai
- **Free tier dùng chung tài khoản:** vi phạm điều khoản, không kiểm soát, không audit.
- **Mỗi người tự mua Pro:** phân tán, không có quản trị tập trung, không SSO.
- **API key gửi qua email:** không phải giao diện cho người dùng cuối; phát key thủ công không an toàn và không có quản trị.

### Cách làm
Làm việc với bộ phận mua sắm/pháp chế; yêu cầu SSO, SCIM, audit logs, DPA; thử nghiệm trên một nhóm nhỏ trước khi triển khai rộng.

> Mẹo thực tế: khi quy mô vượt vài chục người, câu hỏi không còn là "model nào mạnh" mà là "quản trị và tuân thủ thế nào".`
},
{
  id: "qz-ccao-925",
  topic: "claude",
  multi: true,
  q: "[Product Selection] A company is choosing between the Team plan and the Enterprise plan for Claude. Which TWO needs clearly point to Enterprise? (Choose 2)",
  options: [
    "Single sign-on with the company identity provider and automated user provisioning",
    "Audit logs and compliance controls required by regulators",
    "The lowest possible price per seat",
    "The simplest possible monthly billing with no admin setup"
  ],
  answer: [0, 1],
  explain: `**Đúng: SSO/SCIM và audit logs/compliance là những nhu cầu chỉ gói Enterprise đáp ứng.** Team plan phù hợp cho nhóm nhỏ đến trung bình cần quản lý thành viên và thanh toán tập trung, nhưng không có SSO cấp doanh nghiệp, SCIM, hay audit logs chi tiết. Khi công ty bị quản lý chặt hoặc có hàng nghìn nhân sự, hai nhu cầu này là điều kiện bắt buộc chứ không phải tuỳ chọn.

### Vì sao các lựa chọn khác sai
- **Giá mỗi ghế rẻ nhất:** là yếu tố kinh doanh, không phải yếu tố quyết định giữa Team và Enterprise; và Enterprise thường không rẻ hơn.
- **Billing đơn giản, không cần admin:** đây là điểm mạnh của gói nhỏ, không phải lý do chọn Enterprise.

### Cách làm
Liệt kê yêu cầu bắt buộc (bảo mật, tuân thủ, quản trị); đối chiếu với tính năng từng gói; chọn gói đáp ứng đủ, không thừa.

> Mẹo thực tế: chọn gói theo yêu cầu bắt buộc trước, rồi mới tối ưu chi phí — không làm ngược lại.`
},
{
  id: "qz-ccao-926",
  topic: "claude",
  q: "[Product Selection] A startup wants to ship a customer-facing support chatbot in two weeks, with per-user conversation isolation and a custom look inside their own web app. Which is the best fit?",
  options: [
    "Projects on Claude.ai, shared with all users",
    "Claude Code running on each customer's laptop",
    "A shared free-tier account for everyone",
    "The Claude API, embedded in their own application"
  ],
  answer: 3,
  explain: `**Đúng: dùng API và nhúng vào ứng dụng riêng của startup.** "Per-user isolation" (cách ly theo người dùng) nghĩa là mỗi khách chỉ thấy hội thoại của mình — điều này phải do backend của startup tự quản lý khi dùng API. "Custom look" (giao diện riêng) cũng chỉ làm được khi bạn tự xây UI và gọi API. Projects là giao diện có sẵn của Claude.ai, không nhúng vào sản phẩm của bạn được, và không cách ly theo từng người dùng cuối.

### Vì sao các lựa chọn khác sai
- **Projects chia sẻ cho mọi người:** không cách ly hội thoại theo user, không tuỳ biến giao diện.
- **Claude Code trên máy từng khách:** đây là công cụ lập trình, không phải chatbot cho người dùng cuối.
- **Tài khoản free dùng chung:** vi phạm điều khoản, không bảo mật, không cách ly.

### Cách làm
Thiết kế backend: mỗi user một phiên; lưu/lọc hội thoại theo user; gọi API; tự xây UI chat; thêm kiểm duyệt và giới hạn.

> Mẹo thực tế: khi sản phẩm cần giao diện riêng và dữ liệu tách theo người dùng, API gần như luôn là lựa chọn — Projects là sản phẩm đóng gói.`
},
{
  id: "qz-ccao-927",
  topic: "claude",
  q: "[Product Selection] A data team wants Claude to read a warehouse schema, write SQL, run it against the database, see the results, and iterate on a dbt model. Which option fits this loop?",
  options: [
    "Claude.ai web chat with the schema pasted in",
    "Claude Code connected to the database through an MCP server",
    "Projects with the database password uploaded as a text file",
    "The API with the database connection string written in the prompt"
  ],
  answer: 1,
  explain: `**Đúng: Claude Code nối tới database qua MCP server để chạy SQL thật và lặp lại.** "dbt" là công cụ biến đổi dữ liệu bằng SQL; vòng lặp ở đây cần chạy truy vấn, đọc kết quả và sửa — tức cần một agent có quyền thực thi, không chỉ sinh chữ. MCP server là cầu nối chuẩn để Claude Code gọi công cụ (ở đây là truy vấn database) một cách có kiểm soát. Đưa mật khẩu vào prompt hay upload file cấu hình là vi phạm bảo mật và không cho phép chạy truy vấn.

### Vì sao các lựa chọn khác sai
- **Web chat dán schema:** chỉ sinh SQL lý thuyết, không chạy được, không thấy kết quả.
- **Projects với file mật khẩu:** Projects không thực thi truy vấn; upload secret là rủi ro bảo mật.
- **API với connection string trong prompt:** prompt không phải nơi đặt secret; và vẫn phải tự viết vòng lặp chạy truy vấn.

### Cách làm
Dùng MCP server cấu hình quyền đọc tối thiểu; chạy thử trên schema ở chế độ chỉ đọc; kiểm tra kết quả; bật log truy vấn.

> Mẹo thực tế: khi AI cần "chạy và xem kết quả", hãy chọn công cụ có quyền thực thi có kiểm soát (agent + MCP), không phải công cụ chỉ sinh văn bản.`
},
{
  id: "qz-ccao-928",
  topic: "claude",
  q: "[Product Selection] A non-technical operations analyst must produce the same weekly report every week from a shared folder of files, in a fixed format. Which option is the most maintainable?",
  options: [
    "A Project with the format, instructions, and reference files stored once",
    "Start a fresh chat each week and retype the instructions",
    "A bookmark to last week's chat thread",
    "Keep the prompt only in the analyst's personal notes"
  ],
  answer: 0,
  explain: `**Đúng: một Project chứa hướng dẫn, định dạng và tài liệu mẫu, dùng lại mỗi tuần.** Việc lặp lại thì nên chuẩn hoá một lần: mọi người ra cùng cấu trúc, và khi cần sửa chỉ sửa một chỗ. Project là không gian có hướng dẫn riêng và tài liệu dùng chung, phù hợp với việc lặp lại định kỳ mà không cần ai biết lập trình.

### Vì sao các lựa chọn khác sai
- **Chat mới, gõ lại từ đầu:** tốn thời gian, mỗi người một kiểu, phụ thuộc trí nhớ.
- **Bookmark sang chat cũ:** nội dung cũ làm nhiễu, chat cũ có thể đã trôi khỏi ngữ cảnh; người khác khó dùng.
- **Giữ trong sổ tay cá nhân:** không chia sẻ được; người nghỉ là mất quy trình.

### Cách làm
Tạo Project với một trang hướng dẫn, một file định dạng mẫu, danh sách nguồn; ghi ai cập nhật; dùng thử hai tuần rồi chốt.

> Mẹo thực tế: nếu một việc lặp lại hàng tuần, đừng để nó phụ thuộc vào việc ai gõ prompt giỏi hơn.`
},
{
  id: "qz-ccao-929",
  topic: "claude",
  multi: true,
  q: "[Product Selection] Which TWO tasks are a natural fit for Claude Code rather than a chat window? (Choose 2)",
  options: [
    "Refactoring a feature across many files and running the test suite after each change",
    "Scaffolding a new component inside the developer's IDE and iterating on it",
    "Answering a one-off general knowledge question",
    "Drafting a short marketing caption for a post"
  ],
  answer: [0, 1],
  explain: `**Đúng: (0) refactor nhiều file kèm chạy test, và (1) tạo code trong IDE rồi lặp — cả hai đều cần đọc/ghi file, chạy lệnh và thử lại.** Claude Code là agent chạy trong terminal: nó thao tác trực tiếp trên codebase, chạy test, đọc lỗi và sửa. Đây là "agentic coding" (lập trình có tác nhân tự hành động), khác với chat vốn chỉ sinh văn bản. Hai việc còn lại không cần quyền thực thi, nên chat là đủ và đơn giản hơn.

### Vì sao các lựa chọn khác sai
- **Hỏi một câu kiến thức chung:** không cần đọc/ghi file; chat là đủ.
- **Viết một câu quảng cáo ngắn:** không cần chạy lệnh; dùng chat nhanh hơn.

### Cách làm
Với việc code: giao cho Claude Code trên một nhánh riêng, yêu cầu chạy test và báo cáo ca lỗi, người review diff trước khi gộp.

> Mẹo thực tế: nếu việc cần "chạy và xem kết quả", chọn agent; nếu chỉ cần "viết và đọc", chat là đủ.`
},
{
  id: "qz-ccao-930",
  topic: "claude",
  q: "[Product Selection] An enterprise in the EU must keep all data within approved regions and sign a data processing agreement before using Claude. Which is the most appropriate choice?",
  options: [
    "A free consumer account, since the data is not sensitive",
    "A personal Pro subscription for each employee",
    "An enterprise agreement that covers data residency and a signed DPA",
    "A public chat channel shared with a partner"
  ],
  answer: 2,
  explain: `**Đúng: thoả thuận doanh nghiệp có điều khoản về nơi lưu trữ dữ liệu (data residency) và DPA đã ký.** "Data residency" là yêu cầu dữ liệu phải nằm trong một khu vực địa lý nhất định; "DPA" là hợp đồng ràng buộc cách nhà cung cấp xử lý dữ liệu. Với dữ liệu bị quản lý (regulated data), đây là điều kiện pháp lý, không phải tuỳ chọn. Tài khoản tiêu dùng không có các bảo đảm này.

### Vì sao các lựa chọn khác sai
- **Tài khoản free vì "không nhạy cảm":** dữ liệu khách hàng và nội bộ vẫn có thể thuộc diện quản lý; và free không có DPA.
- **Pro cá nhân từng người:** không có hợp đồng doanh nghiệp, không có bảo đảm residency.
- **Kênh chat công khai với đối tác:** làm dữ liệu ra ngoài kiểm soát, vi phạm residency.

### Cách làm
Chọn gói doanh nghiệp có DPA và cam kết residency; cho pháp chế review; kiểm tra tài liệu chính thức về nơi lưu trữ.

> Mẹo thực tế: "dữ liệu nằm ở đâu và ai được giữ nó" là câu hỏi pháp lý, phải trả lời bằng văn bản trước khi dùng.`
},
{
  id: "qz-ccao-931",
  topic: "claude",
  q: "[Product Selection] A team is building a high-volume feature that classifies short incoming messages into a few categories, plus a smaller set of hard cases that need deeper reasoning. What model strategy fits best?",
  options: [
    "Use the single most powerful model for every message to maximize quality",
    "Use the same slow model for everything to keep behaviour uniform",
    "Avoid models and classify everything by hand",
    "Use a smaller, faster model for the bulk of simple cases and escalate hard cases to a stronger model"
  ],
  answer: 3,
  explain: `**Đúng: dùng model nhỏ/nhanh cho phần lớn ca đơn giản, và chỉ đẩy ca khó sang model mạnh hơn.** Chi phí và độ trễ tỉ lệ với kích thước model; với việc phân loại hàng loạt, một model nhỏ thường đủ chính xác và rẻ hơn nhiều. "Escalation" (đẩy lên trên) nghĩa là khi độ tin cậy thấp hoặc gặp ca bất thường, chuyển sang model mạnh hơn để lấy kết quả tốt. Cách này cân bằng giữa chi phí, tốc độ và chất lượng — thay vì trả giá cao nhất cho mọi yêu cầu.

### Vì sao các lựa chọn khác sai
- **Model mạnh nhất cho mọi tin nhắn:** tốn kém và chậm; phần lớn ca không cần đến.
- **Cùng một model chậm cho tất cả:** chậm và tốn, và không tận dụng được việc ca khó cần model mạnh hơn.
- **Phân loại tay toàn bộ:** không mở rộng được cho lưu lượng lớn.

### Cách làm
Đo độ chính xác của model nhỏ trên mẫu; đặt ngưỡng tin cậy; ca dưới ngưỡng thì escalate; theo dõi tỷ lệ escalate và chi phí.

> Mẹo thực tế: đừng chọn một model cho mọi việc — hãy chọn theo từng loại việc, và để ca khó đi đường riêng.`
},
{
  id: "qz-ccao-932",
  topic: "claude",
  q: "[Product Selection] A five-person team wants a shared library of approved prompts and consistent instructions for everyone, with the least setup and no coding. Which is the best fit?",
  options: [
    "Individual free chats, each person keeping their own notes",
    "A Team plan with shared Projects for the prompt library",
    "A custom API application with a prompt database",
    "Claude Code with prompt files in a git repository"
  ],
  answer: 1,
  explain: `**Đúng: gói Team kèm Projects để cả nhóm dùng chung thư viện prompt và hướng dẫn nhất quán.** Projects cho phép lưu custom instructions và tài liệu ở cấp nhóm; Team plan cho phép quản lý thành viên và thanh toán tập trung. Đây là mức setup thấp nhất cho một nhóm nhỏ cần chia sẻ và đồng bộ mà không phải viết code.

### Vì sao các lựa chọn khác sai
- **Chat cá nhân với ghi chú riêng:** không chia sẻ được, mỗi người một phiên bản, khó đồng bộ.
- **Ứng dụng API + database prompt:** phải tự xây giao diện, phân quyền, đồng bộ — tốn công.
- **Claude Code + git:** quá kỹ thuật cho nhóm không lập trình; git không thay được giao diện cộng tác.

### Cách làm
Mua Team plan; tạo Project chung; đưa prompt mẫu và hướng dẫn vào; mời cả nhóm; chỉ định người cập nhật.

> Mẹo thực tế: khi cả nhóm phải dùng giống nhau, hãy chọn một chỗ chung có quản trị — đừng để mỗi người tự giữ một bản.`
},
{
  id: "qz-ccao-933",
  topic: "claude",
  q: "[Knowledge Config] A Project's custom instructions have grown into a long list that sometimes contradicts itself, and answer quality is dropping. What is the most effective fix?",
  options: [
    "Consolidate the instructions into a short, prioritised set with no contradictions",
    "Make the instructions even longer so every case is covered",
    "Remove custom instructions entirely and rely on each message",
    "Set the temperature higher so the model decides"
  ],
  answer: 0,
  explain: `**Đúng: gom lại thành một bộ hướng dẫn ngắn, có thứ tự ưu tiên và không mâu thuẫn.** Custom instructions áp dụng cho mọi tin nhắn trong project; càng dài và càng mâu thuẫn thì model càng khó tuân theo nhất quán, vì các yêu cầu "chống nhau" và mô hình phải đoán ý. Nguyên tắc là viết ít nhưng rõ: nhóm các quy tắc liên quan, bỏ cái trùng, xếp cái quan trọng lên trước. "Temperature" là tham số điều khiển độ ngẫu nhiên khi sinh văn bản — tăng nó không sửa được hướng dẫn mâu thuẫn.

### Vì sao các lựa chọn khác sai
- **Viết dài hơn nữa:** làm tăng mâu thuẫn và loãng; dài không đồng nghĩa rõ.
- **Bỏ hẳn custom instructions:** mất phần hướng dẫn đang có tác dụng; quay về chỗ mỗi tin nhắn phải nhắc lại.
- **Tăng temperature:** chỉ thêm ngẫu nhiên; không xử lý gốc rễ.

### Cách làm
Đọc lại toàn bộ; gộp các mục trùng; xếp ưu tiên; thử lại vài câu hỏi để kiểm tra; cập nhật khi có mâu thuẫn mới.

> Mẹo thực tế: custom instructions tốt là bản ngắn mà người mới đọc cũng hiểu phải làm gì — không phải bản dài liệt kê mọi tình huống.`
},
{
  id: "qz-ccao-934",
  topic: "claude",
  q: "[Knowledge Config] Users ask for page numbers in citations, but the knowledge base chunks often do not include a page number, so citations are vague. What is the most useful first improvement?",
  options: [
    "Increase the temperature so citations become more specific",
    "Ask users to stop requesting page numbers",
    "Make sure source documents have clear structure and headings so chunks carry section labels, and instruct the model to cite what the chunk contains",
    "Delete the documents and re-upload them as plain text with no headings"
  ],
  answer: 2,
  explain: `**Đúng: chuẩn hoá cấu trúc tài liệu để chunk giữ được nhãn mục/đầu đề, và yêu cầu model trích dẫn đúng những gì có trong chunk.** Retrieval (truy hồi) trả về các đoạn (chunk); nếu chunk không chứa thông tin vị trí, model không thể trích dẫn chính xác và sẽ có xu hướng "đoán" một số trang nghe hợp lý. Khi tài liệu có heading rõ ràng ("Mục 7.2 Bồi thường"), chunk thường giữ được nhãn đó, và instruction "trích đúng nhãn mục trong chunk" giúp citation bám vào dữ liệu thật.

### Vì sao các lựa chọn khác sai
- **Tăng temperature:** không thêm thông tin vị trí; chỉ làm sinh văn bản ngẫu nhiên hơn.
- **Bảo người dùng đừng hỏi số trang:** né tránh; nhu cầu trích dẫn chính là lý do dùng knowledge base.
- **Xoá heading rồi up lại:** mất chính cấu trúc giúp chunk có nhãn; làm việc tệ hơn.

### Cách làm
Bổ sung heading/đánh số mục trước khi upload; viết instruction trích dẫn theo nhãn có trong chunk; kiểm tra vài câu trả lời thực tế.

> Mẹo thực tế: citation tốt bắt đầu từ tài liệu có cấu trúc — model chỉ trích được những gì chunk đang chứa.`
},
{
  id: "qz-ccao-935",
  topic: "claude",
  multi: true,
  q: "[Knowledge Config] A team wants fewer fabricated citations from a Project (citations that point to text the documents do not contain). Which TWO changes help most? (Choose 2)",
  options: [
    "Instruct the model to quote the supporting text from the retrieved chunk before giving a citation",
    "Remove duplicate or near-duplicate documents so retrieval is not confused about the source",
    "Increase the number of retrieved chunks so the model has more to choose from",
    "Turn off citations entirely",
    "Raise the temperature to make answers more varied"
  ],
  answer: [0, 1],
  explain: `**Đúng: (0) bắt model trích nguyên văn câu hỗ trợ từ chunk trước khi ghi citation, và (1) bỏ tài liệu trùng lặp để retrieval không nhầm nguồn.** Ép trích nguyên văn buộc model phải bám vào văn bản thật; nếu không tìm được câu hỗ trợ, nó khó bịa citation hơn. Tài liệu trùng lặp khiến nhiều chunk giống nhau cạnh tranh, và model dễ gán nhầm nguồn; dọn trùng giúp retrieval xác định đúng nguồn. Đây là hai can thiệp vào prompt và vào dữ liệu, thay vì vào tham số sinh văn bản.

### Vì sao các lựa chọn khác sai
- **Tăng số chunk lấy về:** nhiều chunk hơn làm loãng ngữ cảnh và tăng cơ hội lẫn nguồn.
- **Tắt citation:** mất luôn giá trị kiểm chứng; vấn đề là citation đúng, không phải bỏ citation.
- **Tăng temperature:** không liên quan đến việc trích dẫn đúng nguồn.

### Cách làm
Thêm bước "trích nguyên văn câu hỗ trợ"; rà và gộp tài liệu trùng; chạy lại tập câu hỏi kiểm thử và đối chiếu citation.

> Mẹo thực tế: muốn citation đáng tin, hãy buộc model trưng ra câu bằng chứng — không có câu thì không có citation.`
},
{
  id: "qz-ccao-936",
  topic: "claude",
  q: "[Knowledge Config] A team uploads PDFs that are mostly scanned images (photos of pages) to a Project, but Claude cannot find answers that are clearly in those pages. What is the most likely cause and fix?",
  options: [
    "The knowledge base only works with English documents",
    "Claude refuses to read images",
    "The documents are too few to be indexed",
    "Scanned image PDFs may not contain selectable text, so text extraction misses them; use text-based documents or OCR"
  ],
  answer: 3,
  explain: `**Đúng: PDF scan (ảnh chụp trang) thường không có lớp văn bản chọn được, nên bước trích xuất text không lấy được chữ; cần tài liệu có text hoặc chạy OCR.** "OCR" (optical character recognition — nhận dạng ký tự quang học) là công nghệ biến ảnh chữ thành văn bản. Nếu tài liệu chỉ là ảnh, retrieval không có chunk để tìm, và câu trả lời sẽ như thể tài liệu trống. Đây là lỗi ở khâu dữ liệu, không phải ở model.

### Vì sao các lựa chọn khác sai
- **Chỉ hỗ trợ tiếng Anh:** không đúng; vấn đề là ảnh không có text, không phải ngôn ngữ.
- **Claude từ chối đọc ảnh:** model không "từ chối"; nó chỉ không nhận được văn bản để dùng.
- **Tài liệu quá ít:** số lượng không phải nguyên nhân; một file scan cũng không có text.

### Cách làm
Chuyển sang PDF có text hoặc chạy OCR trước khi upload; kiểm tra thử một trang bằng cách bôi đen chữ; sau đó mới hỏi.

> Mẹo thực tế: trước khi đổ lỗi cho AI, hãy thử bôi đen chữ trong PDF — nếu không bôi được, đó là ảnh, không phải text.`
},
{
  id: "qz-ccao-937",
  topic: "claude",
  q: "[Knowledge Config] A user wants a rule to apply to every chat in a project without retyping it each time. Which statement about custom instructions is correct?",
  options: [
    "Custom instructions apply to all chats in the project and are the right place for stable rules",
    "Custom instructions only affect the first message of a chat",
    "Custom instructions override the user's own message every time",
    "Custom instructions are only available through the API"
  ],
  answer: 0,
  explain: `**Đúng: custom instructions áp dụng cho mọi cuộc trò chuyện trong project, nên là nơi đặt các quy tắc ổn định.** Đây là điểm khác biệt giữa "nhắc trong một tin nhắn" (chỉ có tác dụng một lần) và "hướng dẫn cấp project" (áp dụng liên tục). Các quy tắc ít thay đổi — định dạng, giọng điệu, cách trích dẫn — nên đặt ở custom instructions để không phải lặp lại.

### Vì sao các lựa chọn khác sai
- **Chỉ ảnh hưởng tin nhắn đầu:** không đúng; nó áp dụng cho cả cuộc trò chuyện.
- **Ghi đè mọi tin nhắn của người dùng:** không phải cơ chế; nó là hướng dẫn nền, không thay thế nội dung người dùng.
- **Chỉ có qua API:** không đúng; custom instructions có trong Projects trên giao diện.

### Cách làm
Đưa các quy tắc ổn định vào custom instructions; giữ ngắn gọn; kiểm tra bằng vài tin nhắn trong một chat mới.

> Mẹo thực tế: nếu bạn phải nhắc cùng một quy tắc mỗi lần, đó là dấu hiệu nó nên nằm trong custom instructions.`
},
{
  id: "qz-ccao-938",
  topic: "claude",
  multi: true,
  q: "[Knowledge Config] A Project knowledge base is two years old and answers are drifting out of date. Which TWO practices keep it healthy over time? (Choose 2)",
  options: [
    "Assign an owner and a regular review schedule for the documents",
    "Archive or remove outdated versions when newer ones are added",
    "Upload every document ever created so nothing is missing",
    "Rename files randomly so users cannot get attached to old names"
  ],
  answer: [0, 1],
  explain: `**Đúng: (0) có người chịu trách nhiệm và lịch rà soát định kỳ, và (1) lưu trữ/loại bỏ bản cũ khi có bản mới.** Knowledge base giống như một thư viện: nếu không ai chăm, nó đầy sách cũ và không ai biết bản nào còn hiệu lực. Người phụ trách và lịch rà soát giúp phát hiện tài liệu lạc hậu; archive bản cũ giúp retrieval không trộn lẫn thông tin cũ và mới. "Data hygiene" (vệ sinh dữ liệu) là việc dọn dẹp định kỳ để nguồn luôn sạch.

### Vì sao các lựa chọn khác sai
- **Upload mọi thứ từng tạo ra:** càng nhiều tài liệu cũ càng dễ trả lời lạc hậu và loãng ngữ cảnh.
- **Đổi tên file ngẫu nhiên:** không giúp gì cho việc cập nhật; còn gây khó theo dõi phiên bản.

### Cách làm
Gán chủ sở hữu; đặt lịch rà soát (ví dụ mỗi quý); khi thêm bản mới, archive bản cũ; ghi ngày cập nhật.

> Mẹo thực tế: một knowledge base không có người trông coi sẽ cũ đi từng ngày — hãy coi việc cập nhật là một phần công việc, không phải việc làm một lần.`
},
{
  id: "qz-ccao-939",
  topic: "claude",
  q: "[Knowledge Config] A user asks a question whose answer requires combining an organisation chart from one document and a budget figure from another. How does retrieval typically handle this, and what should the user check?",
  options: [
    "It reads only the first document, so the answer must be incomplete",
    "It retrieves relevant chunks across documents and the model combines them; check that chunks from both documents were actually used",
    "It refuses any question that spans two documents",
    "It answers from general knowledge when documents disagree"
  ],
  answer: 1,
  explain: `**Đúng: retrieval lấy các đoạn liên quan từ nhiều tài liệu và model tổng hợp; người dùng nên kiểm tra câu trả lời có thực sự dùng cả hai nguồn.** Knowledge base tìm chunk giống nhất về ngữ nghĩa trên toàn bộ tài liệu, nên về nguyên tắc có thể lấy cả sơ đồ tổ chức lẫn con số ngân sách. Nhưng nếu một trong hai tài liệu không được truy hồi (ví dụ chunk quá nhỏ, hoặc câu hỏi không khớp), câu trả lời sẽ thiếu một nửa. Vì vậy hãy đối chiếu xem cả hai nguồn có được nhắc tới không.

### Vì sao các lựa chọn khác sai
- **Chỉ đọc tài liệu đầu tiên:** retrieval không giới hạn như vậy; nó tìm trên tất cả tài liệu.
- **Từ chối câu hỏi hai tài liệu:** không có cơ chế từ chối; model vẫn tổng hợp.
- **Dùng kiến thức chung khi mâu thuẫn:** nếu instruction yêu cầu chỉ dùng knowledge base, model không nên lấy số từ trí nhớ chung.

### Cách làm
Nếu câu trả lời thiếu một nguồn, hỏi lại rõ "dùng cả tài liệu A và B"; nếu vẫn thiếu, kiểm tra chunk của tài liệu đó có đủ lớn và rõ không.

> Mẹo thực tế: câu hỏi cần tổng hợp nhiều nguồn là phép thử tốt cho knowledge base — nếu thiếu một nguồn, hãy kiểm tra chunk trước khi nghi model.`
},
{
  id: "qz-ccao-940",
  topic: "claude",
  q: "[Knowledge Config] Even though a custom instruction says 'use only the knowledge base', the model sometimes answers from its general training knowledge. What is the most effective response?",
  options: [
    "Delete the custom instruction, since it clearly does not work",
    "Add more unrelated documents so the model has more context",
    "Strengthen the instruction with an explicit 'if not in the knowledge base, say you do not know' and add an example of that behaviour",
    "Ask the model to be more creative"
  ],
  answer: 2,
  explain: `**Đúng: làm rõ instruction kèm quy tắc "nếu không có trong knowledge base thì nói không biết", và thêm một ví dụ mẫu về hành vi đó.** "Parametric knowledge" (kiến thức trong tham số model) là những gì model học được khi huấn luyện; nó luôn ở đó và có thể trồi lên khi câu hỏi gần với kiến thức chung. Một câu cấm chung chung dễ bị bỏ qua; một quy tắc cụ thể kèm ví dụ ("khi tài liệu không có, trả lời: 'Chính sách không đề cập nội dung này'") cho model một mẫu hành vi để làm theo. Few-shot (một vài ví dụ) hiệu quả hơn mệnh lệnh trừu tượng.

### Vì sao các lựa chọn khác sai
- **Bỏ custom instruction:** quay về chỗ model tự do dùng kiến thức chung, tệ hơn.
- **Thêm tài liệu không liên quan:** làm loãng, không giúp model bám nguồn.
- **Bảo model sáng tạo hơn:** đi ngược mục tiêu; sáng tạo làm tăng bịa.

### Cách làm
Viết lại instruction theo mẫu "chỉ dùng KB; nếu thiếu, nói không biết" kèm một ví dụ; kiểm tra bằng câu hỏi mà KB không có.

> Mẹo thực tế: muốn model "không biết thì nói không biết", hãy cho nó một câu mẫu để nói — nó bắt chước tốt hơn là nghe cấm.`
},
{
  id: "qz-ccao-941",
  topic: "claude",
  multi: true,
  q: "[Knowledge Config] A team wants to know whether their Project knowledge base is actually good. Which TWO measurements are most useful? (Choose 2)",
  options: [
    "Score a fixed set of representative questions for answer accuracy and correct citation",
    "Track how often the assistant says it does not know or escalates to a person",
    "Count how many documents are in the project",
    "Measure the total file size of the knowledge base"
  ],
  answer: [0, 1],
  explain: `**Đúng: (0) chấm một tập câu hỏi cố định về độ chính xác và citation, và (1) theo dõi tỷ lệ "không biết" hoặc phải chuyển người.** Tập câu hỏi cố định cho phép so sánh giữa các thời điểm và giữa các phiên bản cấu hình; chấm cả trích dẫn giúp phát hiện citation bịa. Tỷ lệ "không biết"/escalate cho biết knowledge base có phủ được câu hỏi thực tế hay không — nếu quá cao, có thể thiếu tài liệu hoặc chunking kém.

### Vì sao các lựa chọn khác sai
- **Đếm số tài liệu:** nhiều tài liệu không đồng nghĩa với KB tốt; tài liệu cũ/trùng còn gây hại.
- **Đo tổng dung lượng file:** dung lượng không đo được độ chính xác hay độ phủ.

### Cách làm
Chốt 15–20 câu đại diện kèm đáp án đúng; mỗi lần đổi cấu hình thì chạy lại; ghi tỷ lệ "không biết" và lý do.

> Mẹo thực tế: "bao nhiêu tài liệu" là thước đo hình thức; "trả lời đúng bao nhiêu phần trăm" mới là thước đo chất lượng.`
},
{
  id: "qz-ccao-942",
  topic: "claude",
  q: "[Knowledge Config] A Project serves two product versions, and users complain that answers blend features from both versions. What is the most effective structural fix within Projects?",
  options: [
    "Add a custom instruction asking the model to guess which version the user means",
    "Upload both versions into one document to save space",
    "Delete the older version entirely",
    "Use a separate Project for each product version, with clear naming and membership"
  ],
  answer: 3,
  explain: `**Đúng: tách thành hai Project theo phiên bản, đặt tên rõ ràng và quản lý thành viên riêng.** Khi hai phiên bản nằm chung một knowledge base, retrieval có thể lấy chunk của cả hai, và model trộn lẫn tính năng cũ với mới. Tách project là cách "cách ly theo ngữ cảnh": mỗi project chỉ chứa một phiên bản, nên câu trả lời không thể lẫn sang phiên bản kia. Đây là cùng nguyên tắc như tách project cho tài liệu nhạy cảm — ranh giới rõ ràng giúp retrieval và người dùng không nhầm.

### Vì sao các lựa chọn khác sai
- **Instruction bảo model đoán phiên bản:** model không biết người dùng đang hỏi phiên bản nào; đoán sẽ gây ra chính sự nhầm lẫn đang muốn tránh.
- **Gộp hai phiên bản vào một tài liệu:** vẫn trộn nội dung trong cùng chunk; không giải quyết gốc rễ.
- **Xoá phiên bản cũ:** mất thông tin hợp lệ; nhiều khách vẫn dùng phiên bản cũ.

### Cách làm
Tạo project riêng cho từng phiên bản; đặt tên gồm tên sản phẩm và số phiên bản; chỉ chia sẻ đúng project cho đúng nhóm.

> Mẹo thực tế: khi một knowledge base trả lời "lai" giữa hai thứ, hãy tách nguồn theo ranh giới rõ ràng thay vì cố dặn model đừng lẫn.`
}
);