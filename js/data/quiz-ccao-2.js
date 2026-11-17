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
}
);