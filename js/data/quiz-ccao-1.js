/* CCAO-F (Claude Certified Associate – Foundations) practice questions (topic claude, tag "[Domain]" = exam domain in js/data/exams.js): tasks T2174–T2177. Format: AGENTS.md mục 4 (QUIZ). */
(window.QUIZ = window.QUIZ || []).push(
// qtool append point
{
  id: 'qz-ccao-001',
  topic: 'claude',
  q: '[Output Evaluation] A consultant used Claude to draft a market analysis for a client. The draft reads well and includes several percentage figures about market growth. Before sending it, what is the most appropriate evaluation step?',
  options: [
    'Send it because fluent, well-structured writing means the facts are reliable',
    'Ask Claude again in the same chat whether its own draft is correct and trust a yes',
    'Check the factual claims and figures against trusted sources before delivery',
    'Rewrite the report by hand and only keep Claude’s headings'
  ],
  answer: 2,
  explain: `**Đúng: đối chiếu dữ kiện với nguồn tin cậy trước khi gửi cho khách.** Văn viết trôi chảy và cấu trúc tốt là tín hiệu về phong cách, không phải bằng chứng về độ chính xác của số liệu. Đánh giá output nghĩa là kiểm tra riêng phần dễ sai nhất, ở đây là các con số và tuyên bố thực tế, bằng nguồn độc lập bên ngoài Claude.

### Vì sao các lựa chọn khác sai
- **Gửi luôn vì viết tốt:** chất lượng trình bày không tương quan chắc chắn với tính đúng. Một báo cáo mạch lạc vẫn có thể chứa số liệu sai hoặc bịa.
- **Hỏi lại chính Claude rồi tin câu trả lời có:** cùng một nguồn sinh ra câu trả lời cũng sinh ra lời tự đánh giá, nên nó có thể lặp lại cùng lỗi với giọng tự tin.
- **Viết lại tay và chỉ giữ tiêu đề:** lãng phí công sức và bỏ mất phần nội dung có thể đúng; vấn đề không phải chất lượng văn mà là độ tin cậy dữ kiện.

> Quy tắc thực tế: output càng dùng được cho quyết định quan trọng thì càng phải kiểm chứng phần dữ kiện, không chỉ đọc thấy hay.`
},
{
  id: 'qz-ccao-002',
  topic: 'claude',
  q: '[Output Evaluation] While summarizing a policy document, Claude states a specific legal deadline and sounds completely certain, but provides no source. The summary will inform a client decision. What should you do first?',
  options: [
    'Treat the confident tone as a warning sign and verify the deadline in the original document',
    'Accept it because Claude only states facts it is certain about',
    'Delete the deadline and ship the rest of the summary without checking',
    'Ask Claude to make the statement even more confident so it reads better'
  ],
  answer: 0,
  explain: `**Đúng: giọng chắc chắn không đồng nghĩa đúng, hãy kiểm tra lại trong tài liệu gốc.** Claude có thể tạo ra một chi tiết nghe rất thuyết phục nhưng không có trong nguồn (hiện tượng “hallucination”, tức bịa thông tin). Khi output ảnh hưởng tới quyết định của khách, bước đúng là mở chính văn bản gốc và xác nhận mốc thời hạn đó có thật và đúng như đã nêu.

### Vì sao các lựa chọn khác sai
- **Tin vì Claude chỉ nêu điều chắc chắn:** không có cơ chế đảm bảo như vậy. Mô hình tạo câu chữ theo xác suất, độ tự tin trong câu không phải chỉ báo độ đúng.
- **Xoá mốc thời hạn rồi gửi phần còn lại:** mốc thời hạn là thông tin quan trọng; xoá đi làm bản tóm tắt thiếu nội dung cốt lõi thay vì xác minh.
- **Yêu cầu viết tự tin hơn:** làm tăng nguy cơ truyền đạt sai một cách thuyết phục, đúng điều cần tránh.

### Thuật ngữ
“Hallucination” là khi mô hình tạo nội dung trông hợp lý nhưng không có căn cứ trong dữ liệu hay nguồn thật. Nó thường xuất hiện ở số liệu, ngày tháng, tên riêng và trích dẫn.

> Câu hỏi kiểm tra nhanh: “Nếu khách hỏi tôi lấy con số này ở đâu, tôi có chỉ ra được trang nào không?” Nếu không, hãy xác minh trước.`
},
{
  id: 'qz-ccao-003',
  topic: 'claude',
  multi: true,
  q: '[Output Evaluation] A delivery lead wants to raise the reliability of Claude-written summaries of long reports before they reach a client. Which two practices best support that goal? (Choose 2)',
  options: [
    'Provide a clear rubric for what a good summary must contain and check the output against it',
    'Always trust the summary when Claude says it followed the instructions',
    'Spot-check key facts and figures against the source document',
    'Remove all numbers from the summary so nothing can be wrong',
    'Let one team member sign off without reading, to save time'
  ],
  answer: [0, 2],
  explain: `**Đúng: có tiêu chí rõ ràng để chấm và đối chiếu dữ kiện với nguồn.** Một rubric (bộ tiêu chí đánh giá) biến “trông ổn” thành các mục kiểm tra được như độ phủ ý chính, độ chính xác, độ dài, tông giọng. Đối chiếu số liệu và tuyên bố quan trọng với tài liệu gốc là cách trực tiếp phát hiện lỗi bịa hoặc hiểu sai.

### Vì sao từng lựa chọn còn lại sai
- **Tin khi Claude nói đã tuân thủ:** lời tự khai của mô hình không phải bằng chứng; nó có thể bỏ sót hoặc hiểu sai yêu cầu mà vẫn tự tin.
- **Xoá hết số liệu:** né rủi ro bằng cách làm mất giá trị của bản tóm tắt; mục tiêu là kiểm chứng chứ không phải loại bỏ thông tin.
- **Một người ký mà không đọc:** bỏ hẳn lớp review của con người, đúng lỗ hổng cần bịt.

### Cách làm thực tế
Viết rubric ngắn 3–5 dòng, chấm từng mục đạt/không đạt, rồi kiểm tra chéo vài con số then chốt. Ghi lại chỗ phải sửa để lần sau cải thiện prompt.

> Rubric tốt giúp nhiều người chấm ra kết quả nhất quán, thay vì mỗi người một cảm nhận.`
},
{
  id: 'qz-ccao-004',
  topic: 'claude',
  q: '[Output Evaluation] Claude writes a research brief with a citation that looks legitimate, but when you open the link the page does not exist. What is the correct interpretation and next step?',
  options: [
    'The model must have been hacked; stop using Claude entirely',
    'A broken link always means the whole brief is worthless; discard everything',
    'Links can break over time, so ignore it and keep the citation',
    'Treat it as a fabricated or unverified citation and confirm every remaining source before use'
  ],
  answer: 3,
  explain: `**Đúng: coi trích dẫn đó là chưa kiểm chứng và xác minh mọi nguồn còn lại.** Claude đôi khi tạo ra trích dẫn nghe rất thật nhưng không tồn tại (fabricated citation), một dạng hallucination phổ biến. Trước khi dùng cho khách, hãy mở từng nguồn, kiểm tra nội dung có khớp với điều được khẳng định, và loại bỏ hoặc thay nguồn không xác minh được.

### Vì sao các lựa chọn khác sai
- **Cho rằng bị hack rồi bỏ Claude:** không đúng bản chất; đây là hạn chế đã biết của mô hình ngôn ngữ chứ không phải sự cố xâm nhập.
- **Bỏ toàn bộ brief:** phản ứng cực đoan; nhiều phần khác có thể đúng, chỉ cần kiểm chứng và sửa phần sai.
- **Bỏ qua vì link có thể hỏng:** đúng là link có thể chết, nhưng khi nội dung cũng không khớp thì phải coi là nguồn không đáng tin cho tới khi chứng minh được.

### Cách nghĩ
Một trích dẫn chỉ có giá trị khi bạn tự mở được nguồn và thấy nội dung ủng hộ tuyên bố. Không tìm thấy nguồn độc lập thì xem như chưa có bằng chứng.

> Với hồ sơ gửi khách hoặc tài liệu pháp lý, hãy kiểm tra 100% trích dẫn, không chỉ mẫu.`
},
{
  id: 'qz-ccao-005',
  topic: 'claude',
  q: '[Output Evaluation] A team produced two versions of a proposal with Claude and needs to pick the stronger one. Which evaluation approach is most sound?',
  options: [
    'Pick the longer version because more content always means better quality',
    'Score both against the same explicit criteria and compare the results',
    'Pick the one whose writing sounds more confident and polished',
    'Ask Claude to choose, then skip human review to save time'
  ],
  answer: 1,
  explain: `**Đúng: chấm cả hai theo cùng một bộ tiêu chí rồi so sánh.** So sánh công bằng đòi hỏi cùng thước đo cho cả hai bản: ví dụ mức độ đáp ứng yêu cầu, độ chính xác, độ rõ ràng, tông giọng, độ dài phù hợp, và rủi ro. Khi tiêu chí giống nhau, quyết định dựa trên bằng chứng chứ không dựa vào cảm giác.

### Vì sao các lựa chọn khác sai
- **Chọn bản dài hơn:** độ dài không đồng nghĩa chất lượng; bản dài có thể lan man hoặc thêm rủi ro.
- **Chọn bản nghe tự tin, bóng bẩy:** phong cách thuyết phục không chứng minh nội dung đúng hay phù hợp.
- **Để Claude tự chọn rồi bỏ review:** để bên tạo ra sản phẩm tự quyết định bên nào tốt hơn, thiếu tính độc lập và dễ thiên lệch.

### Cách làm thực tế
Lập bảng nhỏ: mỗi hàng là một tiêu chí, mỗi cột là một bản, chấm theo thang 1–5, cộng điểm và ghi lý do. Cách này cũng tạo hồ sơ để giải thích quyết định.

> Chấm theo tiêu chí chung giúp tránh thiên kiến “thích bản viết hoa mỹ hơn”.`
},
{
  id: 'qz-ccao-006',
  topic: 'claude',
  q: '[Output Evaluation] A reviewer is building a rubric to judge Claude’s answers to customer questions about refunds. Which rubric is most useful?',
  options: [
    'A single overall score from 1 to 10 with no explanation',
    'A long list of every possible edge case, impossible to apply consistently',
    'A few specific, observable criteria such as policy accuracy, completeness, and tone',
    'A rule that any answer longer than three paragraphs is automatically wrong'
  ],
  answer: 2,
  explain: `**Đúng: chọn vài tiêu chí cụ thể, quan sát được.** Một rubric hữu ích phải đo được cái quan trọng và nhất quán giữa nhiều người chấm. Với câu hỏi về hoàn tiền, ví dụ tiêu chí “chính xác theo chính sách”, “trả lời đủ câu hỏi”, “tông giọng phù hợp” vừa rõ vừa gắn với rủi ro thật.

### Vì sao các lựa chọn khác sai
- **Một điểm 1–10 không giải thích:** thiếu căn cứ, người khác không biết vì sao và khó tái lập.
- **Liệt kê mọi ngoại lệ:** dài và mơ hồ, người chấm sẽ áp dụng khác nhau, làm mất tính nhất quán.
- **Cấm mọi câu dài quá ba đoạn:** một quy tắc hình thức cứng không phản ánh đúng/sai về nội dung và dễ gây sai lệch.

### Cách nghĩ
Rubric tốt thường chỉ 3–6 tiêu chí, mỗi tiêu chí có mô tả ngắn thế nào là đạt. Thử với hai người chấm độc lập; nếu họ chấm lệch nhiều thì tiêu chí còn mơ hồ.

> Đo cái quan trọng hơn là đo cái dễ đếm: độ dài dễ đếm nhưng ít liên quan tới chất lượng.`
},
{
  id: 'qz-ccao-007',
  topic: 'claude',
  multi: true,
  q: '[Output Evaluation] A reviewer is scanning Claude output for signs that it needs closer human review before being used. Which two are the clearest red flags? (Choose 2)',
  options: [
    'The response uses bullet points and headings',
    'Specific figures and dates appear with no traceable source',
    'The answer is shorter than the reviewer expected',
    'Different sections of the same document give conflicting numbers',
    'The tone is polite and professional'
  ],
  answer: [1, 3],
  explain: `**Đúng: số liệu không có nguồn và mâu thuẫn nội bộ là dấu hiệu phải rà kỹ.** Các con số, ngày tháng không dẫn được nguồn dễ là thông tin bịa hoặc sai. Hai chỗ trong cùng tài liệu nói hai con số khác nhau cho cùng một sự việc chắc chắn là lỗi, cần dừng lại đối chiếu.

### Vì sao từng lựa chọn còn lại sai
- **Có bullet và tiêu đề:** đây chỉ là định dạng trình bày, không liên quan tới độ đúng.
- **Ngắn hơn mong đợi:** độ dài ngắn chưa chắc sai; có thể súc tích và đúng. Cần đánh giá theo nội dung.
- **Giọng lịch sự, chuyên nghiệp:** tông giọng tốt không nói gì về tính chính xác.

### Cách dùng
Khi thấy một trong hai dấu hiệu trên, đánh dấu, đối chiếu nguồn, và nếu không xác minh được thì loại hoặc sửa trước khi xuất bản.

> Xây một danh sách kiểm tra ngắn các red flag giúp cả nhóm soi nhanh và nhất quán.`
},
{
  id: 'qz-ccao-008',
  topic: 'claude',
  q: '[Output Evaluation] In a Claude-generated financial overview, the executive summary says revenue grew 12 percent while the detailed table shows 8 percent. What is the first thing to do?',
  options: [
    'Flag the internal inconsistency and reconcile which figure the source actually supports',
    'Average the two numbers and report 10 percent as a compromise',
    'Keep the higher number because it appears first in the document',
    'Assume both are correct because Claude produced them together'
  ],
  answer: 0,
  explain: `**Đúng: đánh dấu mâu thuẫn và tra lại nguồn để xác định con số đúng.** Hai con số khác nhau cho cùng một chỉ tiêu là lỗi nội bộ rõ ràng. Bước đầu là xác định nguồn gốc (báo cáo tài chính, bảng tính gốc) để biết con số nào đúng, rồi sửa mọi chỗ liên quan cho khớp.

### Vì sao các lựa chọn khác sai
- **Lấy trung bình hai số:** bịa ra một con số không tồn tại; cả hai có thể đều sai và giá trị trung bình càng vô nghĩa.
- **Giữ số lớn hơn vì xuất hiện trước:** vị trí trong văn bản không liên quan tới độ đúng.
- **Cho rằng cả hai đúng vì cùng do Claude tạo:** chính việc cùng nguồn lại ra hai số khác nhau là lý do phải kiểm tra, không phải lý do để tin.

### Cách làm thực tế
Ghi lại hai vị trí, mở nguồn gốc, xác định đúng/sai, sửa đồng bộ cả bản tóm tắt và bảng. Kiểm tra lại toàn tài liệu xem còn cặp số nào lệch nữa không.

> Mâu thuẫn nội bộ là lỗi dễ phát hiện nhất bằng mắt; hãy rà số liệu lặp lại ở nhiều phần trước khi gửi.`
},
{
  id: 'qz-ccao-009',
  topic: 'claude',
  q: '[Output Evaluation] Claude writes a technically accurate explanation of a new feature, but it is aimed at engineers while the audience is a group of non-technical executives. How should you evaluate the output?',
  options: [
    'Technical accuracy is the only thing that matters, so accept it unchanged',
    'Make it longer with more jargon so it looks thorough',
    'Reject it entirely because the content is wrong',
    'Judge it against audience fit: clarity, appropriate level, and no unnecessary jargon'
  ],
  answer: 3,
  explain: `**Đúng: đánh giá độ phù hợp với người đọc chứ không chỉ tính đúng kỹ thuật.** Output tốt phải đúng và dùng được cho đối tượng cụ thể. Với lãnh đạo không chuyên, tiêu chí gồm: giải thích dễ hiểu, bỏ hoặc giải nghĩa thuật ngữ, nêu ý nghĩa kinh doanh, tránh chi tiết kỹ thuật không cần thiết.

### Vì sao các lựa chọn khác sai
- **Chỉ cần đúng kỹ thuật:** đúng nhưng không ai hiểu thì không đạt mục tiêu truyền đạt.
- **Thêm thuật ngữ cho “đầy đủ”:** làm khó hiểu hơn, đi ngược nhu cầu của người đọc.
- **Loại bỏ vì cho là sai:** nội dung kỹ thuật đúng, vấn đề là cách diễn đạt và mức độ, không phải sai kiến thức.

### Cách làm
Đưa lại cho Claude kèm yêu cầu rõ về đối tượng và ví dụ về giọng điệu mong muốn, rồi chấm lại theo tiêu chí dễ hiểu. Một phép thử hay: người không chuyên đọc có nắm được ý chính mà không cần hỏi lại không.

> Luôn nêu rõ người đọc là ai ngay trong prompt; điều này ảnh hưởng lớn tới chất lượng output.`
},
{
  id: 'qz-ccao-010',
  topic: 'claude',
  q: '[Output Evaluation] After a long working chat with Claude, a reviewer asks the same Claude conversation to critique its own draft. It mostly praises the draft. What is a stronger way to get an independent review?',
  options: [
    'Ask the same chat to praise it even more so the flaws disappear',
    'Start a fresh conversation that receives the draft and the review criteria, without the earlier reasoning',
    'Add more of your own opinions until Claude agrees',
    'Skip review because a long conversation always improves quality'
  ],
  answer: 1,
  explain: `**Đúng: mở cuộc trò chuyện mới, chỉ đưa bản nháp và tiêu chí review.** Khi review trong cùng một mạch hội thoại dài, mô hình dễ bị “neo” vào các giả định và lời giải thích trước đó, nên có xu hướng đồng tình với chính nó (confirmation bias). Một phiên mới, độc lập, tập trung vào bản nháp và tiêu chí sẽ khách quan hơn.

### Vì sao các lựa chọn khác sai
- **Yêu cầu khen nhiều hơn:** làm tăng thiên lệch thay vì giảm; không tạo ra tính độc lập.
- **Thêm ý kiến của mình đến khi Claude đồng ý:** đẩy mô hình theo hướng bạn muốn thay vì kiểm tra thật.
- **Bỏ review vì hội thoại dài:** hội thoại dài không đảm bảo chất lượng; còn làm tăng nguy cơ bị cuốn theo mạch cũ.

### Cách làm
Phiên review nhận: bản nháp, mục tiêu, tiêu chí lỗi nghiêm trọng, và yêu cầu chỉ ra vị trí cụ thể cùng lý do. Sau đó con người xác nhận từng nhận xét.

> Độc lập không có nghĩa hoàn hảo, nhưng giảm được việc “tự khen mình” một cách hệ thống.`
},
{
  id: 'qz-ccao-011',
  topic: 'claude',
  multi: true,
  q: '[Output Evaluation] A team is deciding which Claude-generated outputs can be used with light review and which need strict human sign-off. Which two situations most clearly require strict human review? (Choose 2)',
  options: [
    'An internal brainstorm of possible marketing slogans',
    'A legal notice that will be sent to customers about their rights',
    'A first draft of meeting notes for the team to edit',
    'A medical dosage summary that will guide patient guidance',
    'A list of ideas for a team offsite'
  ],
  answer: [1, 3],
  explain: `**Đúng: nội dung pháp lý gửi khách và thông tin y tế ảnh hưởng sức khoẻ cần con người duyệt nghiêm ngặt.** Mức review nên tỉ lệ với hậu quả khi sai. Tài liệu pháp lý ràng buộc quyền lợi khách, còn liều dùng y tế ảnh hưởng an toàn con người, nên một lỗi nhỏ cũng gây hậu quả lớn và khó đảo ngược.

### Vì sao từng lựa chọn còn lại sai
- **Brainstorm slogan:** ý tưởng sáng tạo, rủi ro thấp, sai thì bỏ qua dễ dàng; review nhẹ là đủ.
- **Bản nháp biên bản họp:** nội dung nội bộ để nhóm sửa, hậu quả khi sai thấp.
- **Danh sách ý tưởng offsite:** thuần tổ chức nội bộ, không có tác động pháp lý hay an toàn.

### Cách nghĩ
Hai câu hỏi để phân loại: “Nếu sai thì hậu quả tới ai và lớn cỡ nào?” và “Có dễ sửa về sau không?”. Hậu quả lớn, khó đảo ngược thì cần sign-off chặt.

> Đặt ngưỡng review theo mức rủi ro giúp không vừa duyệt quá tay mọi thứ, vừa không lơ là chỗ nguy hiểm.`
},
{
  id: 'qz-ccao-012',
  topic: 'claude',
  q: '[Output Evaluation] Your company has strict brand voice guidelines. Claude’s draft is accurate but uses an overly casual tone. What is the best way to evaluate and correct it?',
  options: [
    'Accept it because accuracy is the only criterion that matters',
    'Rewrite the whole document yourself from zero to be safe',
    'Check the draft against the brand voice guidelines and ask Claude to revise using specific examples',
    'Tell Claude to “sound better” without giving it any reference'
  ],
  answer: 2,
  explain: `**Đúng: đối chiếu với hướng dẫn brand voice và sửa bằng ví dụ cụ thể.** Tiêu chí đánh giá phải bao gồm cả tông giọng khi tổ chức có quy chuẩn. Cách hiệu quả là chỉ ra các câu lệch chuẩn, đưa ví dụ “nên viết thế này”, rồi để Claude sửa lại đúng hướng thay vì đoán mò.

### Vì sao các lựa chọn khác sai
- **Chỉ cần chính xác:** bỏ qua yêu cầu thương hiệu, output vẫn không dùng được nguyên trạng.
- **Viết lại từ đầu:** tốn công và bỏ phí phần nội dung đúng; vấn đề chỉ ở tông giọng.
- **Bảo “nghe hay hơn” mà không có mẫu:** quá mơ hồ, Claude dễ sửa sai hướng hoặc loanh quanh.

### Cách làm
Dán 2–3 câu mẫu đúng chuẩn thương hiệu vào yêu cầu, liệt kê từ cần tránh, rồi yêu cầu giữ nguyên dữ kiện. Chấm lại theo checklist brand voice.

> Ví dụ cụ thể luôn hiệu quả hơn lời mô tả trừu tượng khi cần uốn theo một phong cách.`
},
{
  id: 'qz-ccao-013',
  topic: 'claude',
  q: '[Output Evaluation] A colleague says: “Claude answered instantly and sounded sure, so it must be right.” What is the most accurate correction?',
  options: [
    'Speed and confident wording are not evidence of correctness; verify important claims separately',
    'Instant answers are always more accurate than slow ones',
    'If it sounds sure, it is sure, but only in English',
    'Certainty in tone guarantees the facts were checked against a database'
  ],
  answer: 0,
  explain: `**Đúng: tốc độ và giọng chắc chắn không phải bằng chứng về độ đúng.** Mô hình ngôn ngữ tạo câu trả lời nhanh và có thể rất tự tin kể cả khi sai, vì nó dự đoán văn bản chứ không tra cứu sự thật theo cách con người hiểu. Vì vậy tuyên bố quan trọng cần được kiểm chứng độc lập.

### Vì sao các lựa chọn khác sai
- **Nhanh hơn thì đúng hơn:** tốc độ phản ánh cách máy tính toán, không liên quan tới độ chính xác nội dung.
- **Nghe chắc là chắc, nhưng chỉ tiếng Anh:** không có cơ chế như vậy; ngôn ngữ không bảo đảm tính đúng.
- **Chắc chắn nghĩa là đã tra database:** mô hình không tự động tra cơ sở dữ liệu sự thật để xác nhận mỗi câu.

### Cách nghĩ
Hãy tách hai câu hỏi: “câu này viết có hay không?” và “câu này có đúng không?”. Trả lời độc lập, và với điều quan trọng thì cần nguồn ngoài mô hình.

> Độ tự tin của mô hình là tín hiệu về cách nó tạo văn bản, không phải chứng nhận sự thật.`
},
{
  id: 'qz-ccao-014',
  topic: 'claude',
  multi: true,
  q: '[Output Evaluation] A reviewer must judge whether Claude’s summary of a 60-page report is faithful. Which two evaluation habits are most effective? (Choose 2)',
  options: [
    'Assume a polished summary is automatically faithful to the source',
    'Check that key claims in the summary actually appear in the source document',
    'Only count how many words the summary contains',
    'Look for important points in the source that the summary left out',
    'Trust the summary because it is well organized'
  ],
  answer: [1, 3],
  explain: `**Đúng: kiểm tra tuyên bố có trong nguồn và tìm ý quan trọng bị bỏ sót.** Đánh giá một bản tóm tắt cần hai chiều: không thêm điều không có trong nguồn (tránh bịa, sai lệch) và không bỏ mất ý cốt lõi (tránh thiếu). Cả hai đều đòi hỏi đối chiếu với tài liệu gốc.

### Vì sao từng lựa chọn còn lại sai
- **Mặc định bản bóng bẩy là trung thực:** hình thức đẹp không bảo đảm nội dung khớp nguồn.
- **Chỉ đếm số từ:** độ dài không phản ánh độ trung thực hay độ phủ ý.
- **Tin vì tổ chức gọn gàng:** cấu trúc tốt giúp đọc dễ, không chứng minh tính đúng.

### Cách làm
Chọn 5–8 tuyên bố then chốt, dò trong nguồn xem có khớp; đồng thời đọc lướt nguồn để phát hiện ý lớn nào bị thiếu. Ghi lại cả hai loại lỗi.

> “Không thêm” và “không thiếu” là hai tiêu chí song song khi đánh giá tóm tắt.`
},
{
  id: 'qz-ccao-015',
  topic: 'claude',
  q: '[Output Evaluation] Claude’s output for a project plan is close but misses two required milestones and uses the wrong date format. What is the most effective next step?',
  options: [
    'Start over in a brand new chat and hope for a better result',
    'Accept it and fix the missing milestones by hand without telling anyone',
    'Conclude that Claude cannot handle planning tasks and stop using it',
    'Give specific feedback on the missing milestones and required date format, then ask for a revised version'
  ],
  answer: 3,
  explain: `**Đúng: phản hồi cụ thể vào đúng chỗ sai rồi yêu cầu sửa.** Khi output gần đúng, vòng lặp hiệu quả là chỉ rõ thiếu gì (hai mốc nào) và yêu cầu định dạng ngày chính xác, thay vì bắt đầu lại từ đầu. Đây là cách cải thiện có kiểm soát, giữ phần đã tốt và sửa phần chưa đạt.

### Vì sao các lựa chọn khác sai
- **Làm lại từ đầu trong chat mới:** có thể lặp lại đúng lỗi cũ và mất phần nội dung đã đúng.
- **Tự sửa tay mà không nói:** che giấu nguyên nhân, không giúp cải thiện prompt hay quy trình cho lần sau.
- **Kết luận Claude không làm được planning:** kết luận quá vội từ một lỗi có thể sửa bằng phản hồi cụ thể.

### Cách làm
Nêu rõ: thiếu mốc A và B; định dạng ngày phải là kiểu đã quy định; giữ nguyên các phần còn lại. Yêu cầu Claude chỉ sửa hai điểm này để dễ so sánh.

> Phản hồi càng cụ thể (cái gì, ở đâu, sửa thành gì) thì vòng sửa càng nhanh và ít lặp lỗi.`
},
{
  id: 'qz-ccao-016',
  topic: 'claude',
  q: '[Workflow Integration] An operations team wants to use Claude every week to draft a status report from the same set of source documents. What is the best first step to integrate this into their workflow?',
  options: [
    'Ask each person to invent their own prompt with no shared standard',
    'Define a reusable prompt template and a short review checklist before rolling it out',
    'Start by letting Claude send the report directly to leadership without review',
    'Wait until someone has a spare month to build a custom application'
  ],
  answer: 1,
  explain: `**Đúng: chuẩn hoá prompt và checklist review trước khi đưa vào quy trình.** Tích hợp workflow bắt đầu từ việc làm rõ đầu vào, đầu ra và tiêu chí chất lượng. Một prompt template dùng chung giúp kết quả nhất quán giữa các tuần và giữa các thành viên; checklist review bảo đảm bước kiểm tra của con người luôn diễn ra.

### Vì sao các lựa chọn khác sai
- **Mỗi người tự nghĩ prompt:** kết quả dao động, khó so sánh và khó cải thiện vì không có chuẩn chung.
- **Gửi thẳng cho lãnh đạo không review:** bỏ qua lớp kiểm chứng, rủi ro cao với báo cáo quan trọng.
- **Chờ xây ứng dụng riêng:** chậm và tốn kém; nhiều quy trình chỉ cần chuẩn hoá cách dùng hiện có là đủ.

### Cách làm
Mô tả mục tiêu, cấu trúc báo cáo, nguồn dữ liệu và giọng điệu trong template; kèm ví dụ một báo cáo tốt. Chạy thử 1–2 tuần, chỉnh template, rồi mới nhân rộng.

> Chuẩn hoá trước, tự động hoá sau: quy trình ổn định rồi mới đáng đầu tư công cụ.`
},
{
  id: 'qz-ccao-017',
  topic: 'claude',
  q: '[Workflow Integration] A team keeps uploading the same 40-page product manual into every new Claude chat. Which change most improves their workflow?',
  options: [
    'Keep uploading each time because repetition improves accuracy',
    'Ask each person to retype the key sections from memory',
    'Put the manual into a shared Project knowledge base so the team reuses one source',
    'Delete the manual and rely on Claude’s general knowledge instead'
  ],
  answer: 2,
  explain: `**Đúng: đưa tài liệu vào knowledge base của một Project dùng chung.** Project cho phép lưu tài liệu tham chiếu gắn với một không gian làm việc, để các cuộc trò chuyện trong project dùng lại cùng nguồn thay vì tải lại mỗi lần. Điều này tiết kiệm thời gian và giúp cả nhóm dựa trên cùng một phiên bản tài liệu.

### Vì sao các lựa chọn khác sai
- **Tải lại mỗi lần vì “chính xác hơn”:** không có cơ chế như vậy; chỉ tốn công và dễ dùng nhầm phiên bản.
- **Gõ lại từ trí nhớ:** dễ sai và mất thời gian, không tận dụng được tài liệu gốc.
- **Xoá tài liệu, dựa vào kiến thức chung:** mất nguồn chuẩn, tăng nguy cơ câu trả lời chung chung hoặc lỗi thời.

### Cách làm
Tổ chức tài liệu theo phiên bản, đặt tên rõ, cập nhật khi có bản mới. Ghi chú trong project rằng tài liệu nào là nguồn chuẩn để tránh nhầm lẫn.

> Một nguồn chuẩn dùng chung giảm cả thời gian lẫn rủi ro lệch phiên bản giữa các thành viên.`
},
{
  id: 'qz-ccao-018',
  topic: 'claude',
  multi: true,
  q: '[Workflow Integration] A consulting team wants to use Projects to make their client work more consistent. Which two are appropriate ways to use a Project? (Choose 2)',
  options: [
    'Keep the client’s reference documents and background in the project for reuse',
    'Store one client’s confidential files in a project shared with other clients',
    'Set project-level instructions so outputs follow the team’s conventions',
    'Upload everyone’s personal passwords to help Claude log into tools',
    'Assume project files are automatically deleted after each chat'
  ],
  answer: [0, 2],
  explain: `**Đúng: lưu tài liệu tham chiếu của khách và đặt hướng dẫn cấp project.** Project giúp gom tài liệu nền và quy ước làm việc để mọi cuộc trò chuyện trong đó nhất quán. Đây là cách tổ chức hợp lý cho công việc lặp lại theo từng khách hàng.

### Vì sao từng lựa chọn còn lại sai
- **Trộn file mật của khách này vào project dùng chung với khách khác:** vi phạm bảo mật và có thể lộ dữ liệu giữa các bên.
- **Tải mật khẩu cá nhân lên:** không bao giờ nên đưa thông tin đăng nhập vào nội dung trò chuyện hay tài liệu tải lên.
- **Cho rằng file tự xoá sau mỗi chat:** không nên giả định vậy; cần hiểu rõ chính sách lưu trữ và quyền truy cập.

### Cách làm
Tạo một project riêng cho mỗi khách, kiểm soát ai được truy cập, chỉ đưa tài liệu được phép chia sẻ, và đặt hướng dẫn project ngắn gọn về định dạng, giọng điệu.

> Tách project theo khách hàng vừa bảo mật vừa giúp hướng dẫn và tài liệu không lẫn nhau.`
},
{
  id: 'qz-ccao-019',
  topic: 'claude',
  q: '[Workflow Integration] A team lead wants everyone to produce proposals with the same structure and tone using Claude. Which approach best supports that?',
  options: [
    'Share a well-documented prompt template with structure, tone rules, and an example',
    'Tell each member to “just ask Claude nicely” and trust they will match',
    'Keep the best prompt secret so only the lead can use it',
    'Change the template every day so people stay flexible'
  ],
  answer: 0,
  explain: `**Đúng: chia sẻ một prompt template có tài liệu kèm cấu trúc, quy tắc giọng điệu và ví dụ.** Template dùng chung tạo đầu ra nhất quán và giảm thời gian thử sai. Kèm ví dụ mẫu giúp mọi người hiểu “tốt” trông như thế nào, thay vì mỗi người diễn giải một kiểu.

### Vì sao các lựa chọn khác sai
- **Bảo “cứ hỏi Claude cho tử tế”:** quá mơ hồ, kết quả dao động mạnh giữa các thành viên.
- **Giữ prompt tốt làm bí mật:** lãng phí cải tiến và khiến cả nhóm không hưởng lợi; dễ sinh nhiều bản lệch nhau.
- **Đổi template mỗi ngày:** làm mất tính nhất quán đúng lúc cần nó.

### Cách làm
Đặt template ở nơi cả nhóm truy cập được, ghi rõ mục tiêu và các trường cần điền, kèm một ví dụ đầu ra tốt. Cập nhật có kiểm soát và ghi lại thay đổi.

> Template tốt vừa đủ chi tiết để nhất quán, vừa đủ linh hoạt để không cứng nhắc.`
},
{
  id: 'qz-ccao-020',
  topic: 'claude',
  q: '[Workflow Integration] A team is designing a workflow where Claude drafts customer emails that will later be sent out. Where should human approval sit?',
  options: [
    'Nowhere, to keep the process as fast as possible',
    'Only after the email has already been sent and complaints arrive',
    'Only for the first email ever, then never again',
    'Before sending, as a required review step for anything going to customers'
  ],
  answer: 3,
  explain: `**Đúng: đặt bước con người duyệt trước khi gửi tới khách.** Khi output có thể ảnh hưởng tới khách hàng và khó thu hồi sau khi gửi, con người phải là chốt chặn cuối. Claude tăng tốc soạn thảo, nhưng trách nhiệm về nội dung gửi đi vẫn thuộc về con người.

### Vì sao các lựa chọn khác sai
- **Không có bước duyệt:** tối đa tốc độ nhưng bỏ hết kiểm soát, rủi ro sai sót tới khách.
- **Chỉ duyệt sau khi đã gửi và có phàn nàn:** quá muộn; email đã đi và hậu quả đã xảy ra.
- **Chỉ duyệt email đầu tiên:** các email sau vẫn có thể sai trong tình huống mới; không đủ an toàn.

### Cách làm
Thiết kế luồng: Claude soạn, người phụ trách rà theo checklist ngắn (đúng người, đúng chính sách, không lộ dữ liệu), rồi mới gửi. Ghi log ai duyệt và khi nào.

> Nguyên tắc “human in the loop” đặt con người ở điểm không thể đảo ngược, không phải ở khâu dễ nhất.`
},
{
  id: 'qz-ccao-021',
  topic: 'claude',
  q: '[Workflow Integration] A company wants Claude to work with documents stored in their existing cloud drive, not re-uploaded copies. What should they evaluate before enabling such an integration?',
  options: [
    'Only whether the integration looks modern in screenshots',
    'Whether the connector is officially supported, what data it can access, and who is authorized',
    'Whether it removes the need for any human review forever',
    'Whether it makes Claude answer faster than typing'
  ],
  answer: 1,
  explain: `**Đúng: kiểm tra tính hỗ trợ chính thức, phạm vi dữ liệu truy cập và quyền của người dùng.** Kết nối Claude với nguồn tài liệu bên ngoài (qua connector/integration) mở rộng dữ liệu mô hình có thể đọc, nên trước tiên phải xác minh: đây có phải tích hợp được nhà cung cấp hỗ trợ, nó chạm tới dữ liệu nào, ai được cấp quyền, và dữ liệu được xử lý ra sao.

### Vì sao các lựa chọn khác sai
- **Chỉ xem ảnh chụp trông hiện đại:** giao diện đẹp không nói gì về bảo mật hay quyền truy cập.
- **Kỳ vọng bỏ hẳn review của con người:** tích hợp không thay thế trách nhiệm kiểm chứng nội dung quan trọng.
- **Chỉ quan tâm tốc độ gõ:** tốc độ không phải tiêu chí chính khi mở quyền truy cập dữ liệu công ty.

### Cách làm
Lập danh sách: connector có chính thức không, dữ liệu nào lộ ra, quyền theo vai trò, nhật ký truy cập, và chính sách dữ liệu của tổ chức. Thử với dữ liệu không nhạy cảm trước.

> Mở rộng quyền truy cập dữ liệu là thay đổi lớn về bảo mật; hãy đánh giá như một quyết định hạ tầng, không chỉ là tiện ích.`
},
{
  id: 'qz-ccao-022',
  topic: 'claude',
  multi: true,
  q: '[Workflow Integration] A team plans to plug Claude into a customer-facing workflow. Which two safeguards should be in place before launch? (Choose 2)',
  options: [
    'Let Claude publish directly with no limits to reduce delays',
    'Define a clear human review step for outputs that reach customers',
    'Remove all logging so nothing is ever recorded',
    'Test the workflow with representative examples and agreed quality criteria before go-live',
    'Assume the first live customer will report any problem'
  ],
  answer: [1, 3],
  explain: `**Đúng: có bước con người duyệt và kiểm thử trước khi chạy thật.** Workflow chạm tới khách cần hai lớp an toàn: con người duyệt các output quan trọng, và kiểm thử bằng ví dụ đại diện theo tiêu chí chất lượng đã thống nhất để phát hiện lỗi trước khi tới khách.

### Vì sao từng lựa chọn còn lại sai
- **Cho Claude xuất bản trực tiếp không giới hạn:** bỏ hết kiểm soát, rủi ro lỗi tới khách rất cao.
- **Xoá mọi log:** mất khả năng truy vết và cải thiện khi có sự cố.
- **Dựa vào khách báo lỗi:** để khách làm người thử nghiệm là cách tốn kém và gây mất uy tín.

### Cách làm
Chạy thử nội bộ với bộ mẫu đại diện, chấm theo tiêu chí, sửa lỗi, rồi mới mở dần. Giữ log và bước duyệt ở mức phù hợp rủi ro.

> Chuẩn bị trước khi ra mắt rẻ hơn nhiều so với xử lý sự cố khi khách đã gặp lỗi.`
},
{
  id: 'qz-ccao-023',
  topic: 'claude',
  q: '[Workflow Integration] A team is deciding whether to use Claude for a task that is repetitive but needs perfect legal wording every time. What is the most balanced decision approach?',
  options: [
    'Use Claude for the whole task with no review because it is fast',
    'Never use Claude because one imperfection is possible',
    'Use Claude to draft and accelerate, but keep expert human review for the legal wording',
    'Replace the legal experts entirely to cut costs'
  ],
  answer: 2,
  explain: `**Đúng: dùng Claude để tăng tốc soạn thảo nhưng giữ chuyên gia duyệt phần pháp lý.** Đây là cách cân bằng giữa lợi ích tốc độ và yêu cầu chính xác tuyệt đối. Claude giỏi tạo bản nháp và các biến thể; con người có chuyên môn chịu trách nhiệm về câu chữ ràng buộc pháp lý.

### Vì sao các lựa chọn khác sai
- **Dùng toàn bộ, không review:** “mỗi lần đều phải hoàn hảo” là tiêu chuẩn mà một mình mô hình chưa đáp ứng chắc chắn.
- **Không bao giờ dùng:** bỏ lỡ lợi ích tăng tốc rõ ràng ở phần soạn thảo.
- **Thay hẳn chuyên gia pháp lý:** đặt rủi ro pháp lý và trách nhiệm vào chỗ không phù hợp.

### Cách nghĩ
Câu hỏi quyết định: “Giá trị của việc tăng tốc là bao nhiêu, và chi phí khi sai là bao nhiêu?”. Khi hậu quả khi sai lớn, giữ con người ở bước cuối.

> Tăng tốc phần dễ, giữ chuyên môn ở phần khó là cách phân công hợp lý giữa người và Claude.`
},
{
  id: 'qz-ccao-024',
  topic: 'claude',
  q: '[Workflow Integration] A manager wants to roll out Claude to a department. What is the most useful way to define success for the pilot?',
  options: [
    'Pick specific, measurable goals such as time saved and error rate on a defined task',
    'Declare success as “everyone feels excited about AI”',
    'Measure only how many prompts people typed',
    'Avoid any goals so no one is disappointed'
  ],
  answer: 0,
  explain: `**Đúng: đặt mục tiêu cụ thể, đo được như thời gian tiết kiệm và tỉ lệ lỗi trên một tác vụ xác định.** Pilot có giá trị khi trả lời được “có tốt hơn cách cũ không, tốt hơn bao nhiêu?”. Tiêu chí đo được giúp so sánh trước/sau và quyết định mở rộng hay dừng dựa trên dữ liệu.

### Vì sao các lựa chọn khác sai
- **Định nghĩa thành “mọi người thấy hào hứng”:** cảm xúc không đo được khách quan và không nói lên hiệu quả công việc.
- **Chỉ đếm số prompt:** số lượng thao tác không phản ánh chất lượng hay giá trị tạo ra.
- **Không đặt mục tiêu:** không có căn cứ để đánh giá, dễ rơi vào cảm tính.

### Cách làm
Chọn 1–2 tác vụ đại diện, đo thời gian và chất lượng trước khi dùng, sau khi dùng, cùng một bộ tiêu chí. Ghi cả phản hồi người dùng về mức dễ dùng.

> Pilot tốt trả lời được một câu: “Chúng ta có bằng chứng gì cho thấy cách mới hiệu quả hơn?”.`
},
{
  id: 'qz-ccao-025',
  topic: 'claude',
  q: '[Workflow Integration] An employee wants to paste a client’s confidential contract into a personal Claude account to get a quick summary. What should they check first?',
  options: [
    'Whether the contract is long enough to be worth it',
    'Whether Claude can summarize contracts at all',
    'Whether the summary will sound professional',
    'Whether company policy and the account/plan allow handling that confidential data this way'
  ],
  answer: 3,
  explain: `**Đúng: kiểm tra chính sách công ty và loại tài khoản trước khi đưa dữ liệu mật vào.** Dữ liệu khách hàng có thể bị ràng buộc bởi hợp đồng và quy định nội bộ. Việc dùng đúng công cụ, đúng tài khoản được công ty cho phép (ví dụ tài khoản công việc có thoả thuận phù hợp) quan trọng hơn việc tóm tắt nhanh.

### Vì sao các lựa chọn khác sai
- **Chỉ quan tâm độ dài hợp đồng:** độ dài không liên quan tới việc có được phép xử lý dữ liệu đó hay không.
- **Hỏi Claude có tóm tắt được không:** năng lực tóm tắt không thay thế yêu cầu về bảo mật và tuân thủ.
- **Chỉ quan tâm giọng văn chuyên nghiệp:** chất lượng trình bày không giải quyết rủi ro lộ dữ liệu.

### Cách làm
Tra chính sách dữ liệu của công ty, xác định tài khoản/kế hoạch nào được dùng cho dữ liệu khách, và hỏi bộ phận phụ trách nếu chưa rõ. Khi nghi ngờ, không dán dữ liệu mật.

> Bảo mật dữ liệu khách là trách nhiệm của người dùng công cụ, không phải điều Claude tự bảo đảm thay bạn.`
},
{
  id: 'qz-ccao-026',
  topic: 'claude',
  multi: true,
  q: '[Workflow Integration] A team wants a repeatable, consistent workflow for using Claude across the group. Which two steps most help standardize it? (Choose 2)',
  options: [
    'Document the prompt structure, inputs, and expected output format in one shared place',
    'Let everyone use a different tool version so results vary widely',
    'Agree on a review checklist that each person applies before using an output',
    'Keep the process only in one person’s memory',
    'Change the rules every week without recording them'
  ],
  answer: [0, 2],
  explain: `**Đúng: ghi tài liệu cách làm dùng chung và thống nhất checklist review.** Chuẩn hoá workflow cần hai trụ cột: tài liệu mô tả prompt, đầu vào và định dạng đầu ra để mọi người làm giống nhau; và checklist review để chất lượng được kiểm tra nhất quán trước khi dùng output.

### Vì sao từng lựa chọn còn lại sai
- **Mỗi người một phiên bản công cụ:** tạo khác biệt khó kiểm soát và khó so sánh kết quả.
- **Giữ quy trình trong đầu một người:** người khác không tái lập được, và khi người đó vắng thì quy trình đứt.
- **Đổi luật mỗi tuần mà không ghi lại:** không ai theo kịp, tính nhất quán mất hoàn toàn.

### Cách làm
Viết một trang hướng dẫn ngắn: mục tiêu, prompt mẫu, ví dụ tốt/xấu, checklist review, ai chịu trách nhiệm. Cập nhật có phiên bản.

> Quy trình chỉ thật sự chuẩn hoá khi người mới có thể làm theo tài liệu mà không cần hỏi từng bước.`
},
{
  id: 'qz-ccao-027',
  topic: 'claude',
  q: '[Workflow Integration] A user sets custom instructions to always “be extremely brief and never ask clarifying questions.” What is a likely downside in their workflow?',
  options: [
    'Custom instructions have no effect on output style',
    'Claude may omit needed detail and guess instead of clarifying, leading to poorer results',
    'It will make Claude refuse all tasks',
    'It permanently disables file uploads'
  ],
  answer: 1,
  explain: `**Đúng: cấu hình quá cực đoan có thể làm output thiếu chi tiết và tăng đoán mò.** Custom instructions (hướng dẫn tuỳ chỉnh) định hình cách Claude trả lời trên nhiều cuộc trò chuyện. “Cực ngắn và không bao giờ hỏi lại” có thể khiến câu trả lời bỏ sót thông tin quan trọng và tự giả định thay vì làm rõ yêu cầu.

### Vì sao các lựa chọn khác sai
- **Không có tác dụng:** custom instructions thực sự ảnh hưởng tới phong cách và hành vi trả lời.
- **Khiến Claude từ chối mọi tác vụ:** đây không phải hệ quả của việc đặt giọng điệu ngắn gọn.
- **Vô hiệu hoá tải file vĩnh viễn:** không liên quan; hướng dẫn văn phong không tắt tính năng tải tệp.

### Cách làm
Đặt hướng dẫn cân bằng: ưu tiên ngắn gọn nhưng vẫn cho phép hỏi lại khi yêu cầu mơ hồ hoặc khi thiếu dữ liệu quan trọng. Điều chỉnh theo loại công việc.

> Hướng dẫn tuỳ chỉnh nên phục vụ công việc, không nên biến thành quy tắc cứng gây hại cho chất lượng.`
},
{
  id: 'qz-ccao-028',
  topic: 'claude',
  q: '[Workflow Integration] A reusable Claude workflow works well, but it fails whenever the input spreadsheet has an extra column. What is the best way to make it more robust?',
  options: [
    'Ask users to never change the spreadsheet, and blame them when it breaks',
    'Make the prompt longer with no structural changes and hope it copes',
    'Define the expected input clearly, handle variations up front, and test with changed inputs',
    'Abandon the workflow because computers cannot handle change'
  ],
  answer: 2,
  explain: `**Đúng: mô tả rõ đầu vào mong đợi, xử lý biến thể và kiểm thử với dữ liệu thay đổi.** Workflow bền vững cần được thiết kế cho sự thay đổi hợp lý của dữ liệu. Nêu rõ cấu trúc cột bắt buộc, chỉ định cách xử lý cột thừa hoặc thiếu, và thử với vài biến thể để phát hiện điểm gãy trước khi dùng thật.

### Vì sao các lựa chọn khác sai
- **Cấm đổi bảng tính rồi đổ lỗi cho người dùng:** không thực tế và không giải quyết gốc vấn đề.
- **Chỉ kéo dài prompt mà không đổi cấu trúc:** thêm chữ không tự xử lý được biến thể dữ liệu.
- **Từ bỏ vì “máy không chịu được thay đổi”:** sai; xử lý biến thể là việc thiết kế được.

### Cách làm
Viết mô tả đầu vào, thêm hướng dẫn “bỏ qua cột không liên quan”, và tạo bộ ví dụ gồm trường hợp chuẩn lẫn biến thể. Chạy thử trước khi triển khai.

> Thiết kế cho biến thể ngay từ đầu rẻ hơn nhiều so với sửa liên tục sau khi đưa vào dùng.`
},
{
  id: 'qz-ccao-029',
  topic: 'claude',
  q: '[Workflow Integration] A regulated team must be able to explain, months later, how a Claude-assisted document was produced. What should they keep as part of the workflow?',
  options: [
    'A record of the prompts used, inputs, versions, and the human review that happened',
    'Nothing, because records slow people down',
    'Only a screenshot of the final document',
    'A verbal recollection from whoever was on shift that day'
  ],
  answer: 0,
  explain: `**Đúng: lưu lại prompt, đầu vào, phiên bản và bước con người đã duyệt.** Khả năng truy vết (auditability) là yêu cầu cốt lõi trong môi trường được quản lý. Khi cần giải trình, một hồ sơ cho biết dùng prompt nào, dữ liệu nào, ai duyệt, khi nào, giúp chứng minh quy trình và tìm nguyên nhân nếu có vấn đề.

### Vì sao các lựa chọn khác sai
- **Không lưu gì:** không thể giải trình hay điều tra về sau; thường vi phạm yêu cầu tuân thủ.
- **Chỉ ảnh chụp bản cuối:** thiếu ngữ cảnh về cách tạo ra và ai đã kiểm tra.
- **Nhớ miệng:** không đáng tin, dễ quên và không kiểm chứng được.

### Cách làm
Ghi log tối thiểu: prompt/template, nguồn dữ liệu, phiên bản, người review, thời điểm. Bảo đảm không ghi vào log các dữ liệu nhạy cảm không được phép lưu.

> Truy vết vừa phục vụ tuân thủ vừa giúp cải thiện quy trình khi cùng một lỗi lặp lại.`
},
{
  id: 'qz-ccao-030',
  topic: 'claude',
  q: '[Workflow Integration] A single power user got great results with Claude and now the whole department is adopting it. What is the biggest integration risk to manage?',
  options: [
    'That Claude will suddenly stop being useful for everyone at once',
    'That the department will forget how to type',
    'That there will be too few people wanting to use it',
    'That practices which worked for one expert are copied without documentation, training, and consistent review'
  ],
  answer: 3,
  explain: `**Đúng: rủi ro lớn là sao chép cách làm của một chuyên gia mà thiếu tài liệu, đào tạo và review nhất quán.** Một người giỏi có thể đạt kết quả tốt nhờ kinh nghiệm ngầm. Khi mở rộng, nếu không chuyển hoá thành hướng dẫn rõ ràng, người khác sẽ làm khác đi, chất lượng dao động và lỗi khó phát hiện.

### Vì sao các lựa chọn khác sai
- **Claude tự nhiên mất tác dụng cho mọi người:** không phải rủi ro tích hợp điển hình; vấn đề nằm ở cách tổ chức triển khai.
- **Cả phòng quên gõ phím:** lo ngại không thực tế, không liên quan tới chất lượng workflow.
- **Quá ít người muốn dùng:** ngược với tình huống đang mở rộng nhanh.

### Cách làm
Chuyển kinh nghiệm của người giỏi thành tài liệu, ví dụ mẫu và checklist; đào tạo ngắn; theo dõi chất lượng đầu ra khi mở rộng; điều chỉnh hướng dẫn dựa trên lỗi thực tế.

> Mở rộng bền vững là biến “bí quyết cá nhân” thành “chuẩn chung có thể dạy lại”.`
}
);
