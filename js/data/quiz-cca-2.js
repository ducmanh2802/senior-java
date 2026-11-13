/* CCA-F practice questions (topic claude, tag = CCA-F domain): task T1517. Format: AGENTS.md mục 4. */
(window.QUIZ = window.QUIZ || []).push(
// qtool append point,
{
  id: 'qz-ccaf-001',
  topic: 'claude',
  q: '[Claude Code Configuration] A team wants Claude to follow shared repository conventions while each developer can also keep personal preferences. Which setup best separates those needs?',
  options: [
    'Put every instruction in each developer’s user-level CLAUDE.md and leave the repository without instructions',
    'Put shared rules in CLAUDE.local.md and personal preferences in the checked-in project CLAUDE.md',
    'Put shared repository guidance in the project CLAUDE.md and individual preferences in the user-level ~/.claude/CLAUDE.md',
    'Put both kinds of instructions in settings.json because CLAUDE.md only stores secrets'
  ],
  answer: 2,
  explain: `**Đúng: hướng dẫn dùng chung thuộc project, sở thích cá nhân thuộc user.** {{CLAUDE.md}} là tệp hướng dẫn được Claude Code đọc vào ngữ cảnh làm việc, không phải tệp cấu hình bí mật. Tệp ở thư mục dự án có thể được review và chia sẻ cùng source code; tệp user-level trong {{~/.claude/CLAUDE.md}} áp dụng theo người dùng trên các dự án, phù hợp với sở thích riêng như cách trình bày câu trả lời.

### Vì sao các lựa chọn khác sai
- **Mọi thứ ở user-level:** đồng đội không tự nhận được quy ước dự án; mỗi người phải tự sao chép và các bản dễ lệch nhau.
- **Đổi ngược project/local:** {{CLAUDE.local.md}} dành cho chỉ dẫn riêng tại một bản checkout, không phù hợp làm nguồn chuẩn đã review cho cả team. Project {{CLAUDE.md}} mới là chỗ chia sẻ.
- **Dùng settings.json:** settings chứa cấu hình như quyền và hooks; nó không thay thế tệp hướng dẫn bằng ngôn ngữ tự nhiên. {{CLAUDE.md}} cũng không phải nơi cất secret.

> Hãy hỏi “ai cần nhận chỉ dẫn này?”: mọi contributor thì đặt ở project; một người thì đặt ở user hoặc local.`
},
{
  id: 'qz-ccaf-002',
  topic: 'claude',
  q: '[Claude Code Configuration] A developer wants repository-specific notes that should not be shared with teammates, such as a local test endpoint and personal debugging preferences. Where should they put them?',
  options: [
    'In CLAUDE.local.md at the project root, keeping shared conventions in the normal project instructions',
    'In the enterprise-managed policy file so it always wins over team guidance',
    'In the root settings.json permissions.allow list, because it is private by default',
    'In a new copy of the project CLAUDE.md committed under the developer’s name'
  ],
  answer: 0,
  explain: `**Đúng: dùng {{CLAUDE.local.md}} cho chỉ dẫn riêng của checkout.** Claude Code có thể đọc tệp này như phần hướng dẫn dự án bổ sung. Ví dụ, một endpoint chỉ tồn tại trên máy cá nhân không nên buộc mọi thành viên dùng theo. Tách nó khỏi {{CLAUDE.md}} được commit giúp nhóm vẫn có một nguồn quy ước chung.

### Vì sao các lựa chọn khác sai
- **Enterprise policy:** đây là cấu hình do tổ chức quản trị triển khai, không phải chỗ cá nhân ghi chú debug; dùng sai phạm vi còn có thể ảnh hưởng nhiều người.
- **settings.json permissions.allow:** danh sách này quyết định công cụ/hành động nào được phép, không phải kho ghi chú hướng dẫn riêng. Quyền chia sẻ của settings còn tùy tệp và cấu hình team.
- **Commit một bản CLAUDE.md cá nhân:** bản cá nhân sẽ trở thành thay đổi dự án, gây nhiễu review và có thể áp đặt thói quen riêng lên đồng đội.

### Ví dụ
Team hướng dẫn chạy test bằng lệnh chuẩn trong {{CLAUDE.md}}. Một dev thêm URL mock riêng vào {{CLAUDE.local.md}}. Claude nhận cả hướng dẫn nhóm lẫn ghi chú local mà không biến URL cá nhân thành quy ước chung.

> Local không đồng nghĩa với secret store: không ghi mật khẩu hay token vào tệp hướng dẫn.`
},
{
  id: 'qz-ccaf-003',
  topic: 'claude',
  q: '[Claude Code Configuration] A security review finds “Never read production credentials” in CLAUDE.md, but Claude still attempts a tool call that could access a secret file. What is the strongest configuration change?',
  options: [
    'Repeat the sentence in every user message so the model sees it more often',
    'Rename the file to CLAUDE.local.md so the rule has higher priority',
    'Add a longer explanation to the project CLAUDE.md and assume the model must obey it',
    'Use an enforceable permission rule to deny access to the sensitive resource, and keep the instruction as supporting context'
  ],
  answer: 3,
  explain: `**Đúng: dùng lớp quyền có thể cưỡng chế, không chỉ dùng lời nhắc.** {{CLAUDE.md}} được đưa vào context để định hướng hành vi của mô hình; context là thông tin mô hình đọc và cân nhắc, không phải một ranh giới bảo mật chắc chắn. Permission rule trong settings mới là cấu hình dùng để cho phép, hỏi hoặc từ chối các công cụ/hành động. Với tệp nhạy cảm, hãy tạo deny phù hợp, kiểm tra cách nó khớp trên phiên bản đang chạy, rồi giữ câu trong {{CLAUDE.md}} để Claude hiểu lý do.

### Vì sao các lựa chọn khác sai
- **Lặp trong user message:** lặp chỉ làm chỉ dẫn dễ thấy hơn, không biến nó thành quyền cưỡng chế. Nội dung người dùng cũng có thể xung đột.
- **Đổi sang CLAUDE.local.md:** tệp local không tạo cơ chế bảo vệ hay độ ưu tiên bảo mật đặc biệt.
- **Viết dài hơn:** giải thích rõ có ích cho chất lượng quyết định nhưng vẫn là chỉ dẫn ngôn ngữ tự nhiên, không chặn được hành động bằng kỹ thuật.

### Thuật ngữ
“Defense in depth” là nhiều lớp bảo vệ: hướng dẫn giúp mô hình chọn đúng; permission rule giới hạn hành động; kiểm tra phía hệ thống xác nhận kết quả.

> Với secret, hãy kiểm thử deny bằng một tình huống giả lập trước khi tin rằng cấu hình đã chặn đúng.`
},
{
  id: 'qz-ccaf-004',
  topic: 'claude',
  multi: true,
  q: '[Claude Code Configuration] A repository needs shared coding conventions and a separate set of instructions for one developer’s local checkout. Which two placements are appropriate? (Choose 2)',
  options: [
    'Keep team-wide project guidance in the checked-in project CLAUDE.md',
    'Store all team rules in ~/.claude/CLAUDE.md on the team lead’s laptop',
    'Put private checkout-specific notes in CLAUDE.local.md',
    'Put private notes in the managed enterprise policy so they are not visible in Git',
    'Put prose instructions in permissions.deny so they cannot be ignored'
  ],
  answer: [0, 2],
  explain: `**Đúng: project {{CLAUDE.md}} cho cả nhóm, {{CLAUDE.local.md}} cho một checkout.** Một tệp project đã được review và chia sẻ giúp thành viên mới có cùng quy ước. Tệp local dành cho phần chỉ dẫn bổ sung mà người dùng không muốn biến thành quy ước chung, chẳng hạn cách chạy một mock service chỉ có trên máy.

### Vì sao từng lựa chọn còn lại sai
- **User-level trên laptop trưởng nhóm:** user-level chỉ gắn với cấu hình người dùng đó; đồng đội không tự nhận được nó khi clone repo.
- **Managed enterprise policy cho ghi chú riêng:** managed policy do tổ chức quản trị, có phạm vi áp dụng rộng và dành cho yêu cầu tổ chức, không phải ghi chú cá nhân.
- **permissions.deny cho văn xuôi:** đây là cấu hình quyền theo công cụ/tài nguyên, không phải tệp chứa chỉ dẫn tự nhiên. Dùng sai chỗ sẽ không biểu đạt quy ước dự án đúng cách.

> Tách theo phạm vi người nhận sẽ tránh hai lỗi: team không nhận được quy tắc cần thiết, hoặc quy tắc cá nhân vô tình áp lên tất cả.`
},
{
  id: 'qz-ccaf-005',
  topic: 'claude',
  q: '[Claude Code Configuration] A monorepo has different testing instructions for services/payments and services/catalog. How should the team avoid sending irrelevant instructions to every task?',
  options: [
    'Create separate user-level CLAUDE.md files and ask developers to switch accounts',
    'Put path-scoped rule files under .claude/rules/ and associate each rule with the matching service paths',
    'Duplicate the full monorepo guide into every source file as a comment',
    'Use one global rule that lists every possible test command without any path scope'
  ],
  answer: 1,
  explain: `**Đúng: dùng path-scoped rules trong {{.claude/rules/}}.** Rule là một tệp hướng dẫn riêng; metadata phạm vi đường dẫn cho Claude biết nội dung nào liên quan đến tệp đang làm. Ví dụ, hướng dẫn test payments chỉ cần được nạp khi tác vụ chạm {{services/payments/**}}, còn catalog nhận hướng dẫn riêng. Cách này giảm nhiễu context — tức thông tin không cần thiết đang chiếm chỗ và khiến mô hình khó tập trung.

### Vì sao các lựa chọn khác sai
- **Nhiều tài khoản user:** quy tắc thuộc dự án nhưng lại gắn với danh tính người dùng, không được chia sẻ ổn định và khó bảo trì.
- **Comment mọi source file:** lặp nội dung làm source ồn, dễ cũ, và vẫn không chọn đúng hướng dẫn theo phạm vi.
- **Một rule toàn cục khổng lồ:** Claude luôn phải đọc các lệnh không liên quan; tăng khả năng chọn nhầm và làm context dài hơn.

### Cách nghĩ
Đặt nguyên tắc chung ở project CLAUDE.md; đặt chi tiết gắn với thư mục/file vào rules có phạm vi tương ứng. Sau khi tạo rule, thử một tác vụ ở từng thư mục để xác nhận rule được nạp đúng.

> Tên thư mục rule không tự tạo scope; chính phạm vi khai báo trong rule mới quyết định nó áp dụng ở đâu.`
},
{
  id: 'qz-ccaf-006',
  topic: 'claude',
  q: '[Claude Code Configuration] A rule in .claude/rules/ is intended to apply only to database migration files, but Claude follows it while editing unrelated Java classes. What should the maintainer check first?',
  options: [
    'Whether the rule has a path scope that matches migration files rather than applying globally',
    'Whether the developer has enabled plan mode',
    'Whether the project uses a user-level CLAUDE.md',
    'Whether the rule file is named after the database vendor'
  ],
  answer: 0,
  explain: `**Đúng: kiểm tra scope đường dẫn.** Một rule không gắn phạm vi riêng có thể được xem là hướng dẫn áp dụng rộng trong dự án. Metadata path scope là mẫu đường dẫn để Claude biết rule có liên quan đến file nào, ví dụ các file migration dưới một thư mục cụ thể. Nếu thiếu hoặc viết glob quá rộng, rule có thể ảnh hưởng cả Java source.

### Vì sao các lựa chọn khác sai
- **Plan mode:** chế độ lập kế hoạch thay đổi cách Claude tiếp cận tác vụ, không sửa phạm vi file của rule.
- **User CLAUDE.md:** có thể bổ sung hướng dẫn khác nhưng không quyết định một rule project được gắn với loại file nào.
- **Tên theo database vendor:** tên file giúp con người tổ chức, nhưng tự nó không giới hạn phạm vi áp dụng.

### Thuật ngữ
Glob là mẫu đường dẫn có ký tự đại diện, ví dụ {{**/migrations/*.sql}}. Glob quá rộng như {{**/*}} gần như loại bỏ lợi ích giới hạn scope.

> Khi scope sai, sửa metadata path trước; đừng chữa bằng cách lặp lại “chỉ áp dụng cho migration” trong nội dung.`
},
{
  id: 'qz-ccaf-007',
  topic: 'claude',
  q: '[Claude Code Configuration] A team puts a general rule file in .claude/rules/ without any path-specific metadata. Which expectation is safest?',
  options: [
    'The rule is ignored unless every developer invokes it as a slash command',
    'The rule is applied only to the directory whose name matches the rule filename',
    'The rule is project guidance without a narrower file-path scope, so it may be relevant across the project',
    'The rule becomes an enterprise permission policy'
  ],
  answer: 2,
  explain: `**Đúng: không có path scope thì đừng giả định rule chỉ áp dụng cho một loại file.** Rule trong {{.claude/rules/}} là hướng dẫn của project. Phạm vi đường dẫn dùng để giới hạn khi nào nội dung liên quan; nếu không khai báo phạm vi hẹp, Claude có thể xem nó là hướng dẫn chung. Điều này hữu ích cho quy tắc toàn repo nhưng không phù hợp cho hướng dẫn chỉ dành cho migration hay frontend.

### Vì sao các lựa chọn khác sai
- **Cần slash command:** rule được nạp như hướng dẫn theo cấu hình, không phải lệnh mà người dùng phải gọi thủ công mỗi lần.
- **Suy ra scope từ tên file:** tên như {{database.md}} chỉ có tác dụng tổ chức cho con người; không thay thế khai báo path scope.
- **Thành enterprise policy:** vị trí trong repo vẫn là project-level; nó không biến thành policy do tổ chức quản trị.

### Ví dụ
Rule “mọi endpoint mới phải có integration test” có thể để chung. Quy tắc “migration phải có rollback note” nên được giới hạn vào đường dẫn migration để không làm nhiễu sửa Java thông thường.

> Nếu quy tắc chỉ đúng với một phần repo, hãy biểu đạt phạm vi bằng cấu hình thay vì trông chờ Claude tự suy ra từ tiêu đề.`
},
{
  id: 'qz-ccaf-008',
  topic: 'claude',
  multi: true,
  q: '[Claude Code Configuration] A team wants one general project convention and one instruction set only for files under services/billing. Which two approaches best fit? (Choose 2)',
  options: [
    'Put the general convention in a developer’s home-directory CLAUDE.md',
    'Keep shared general guidance in the repository project CLAUDE.md',
    'Put the billing-specific guidance in a rule with a matching path scope under .claude/rules/',
    'Copy the billing guide into every developer’s personal preferences',
    'Use a Bash allow permission to decide which prose instructions Claude reads'
  ],
  answer: [1, 2],
  explain: `**Đúng: project CLAUDE.md cho nguyên tắc chung, scoped rule cho billing.** Nguyên tắc cần cả team nên sống trong repository. Hướng dẫn chỉ liên quan tới một khu vực nên được đặt trong {{.claude/rules/}} với scope đường dẫn phù hợp, giúp Claude chỉ nhận chi tiết billing khi làm việc với phần đó.

### Vì sao từng lựa chọn còn lại sai
- **Home-directory của một dev:** user-level là cấu hình theo người, không phải nguồn chuẩn project mà mọi contributor nhận được.
- **Sao chép vào từng người:** nhiều bản sao nhanh chóng lệch nhau, không có review tập trung và người mới dễ thiếu hướng dẫn.
- **Bash permission:** quyền Bash điều khiển việc chạy shell, không chọn tệp hướng dẫn nào được áp dụng.

### Thiết kế thực tế
Giữ {{CLAUDE.md}} ngắn với lệnh build chung, kiến trúc cấp cao và quy tắc toàn repo. Chuyển chi tiết chuyên biệt theo package vào các rules có scope. Khi tổ chức lại thư mục, cập nhật scope và xác minh bằng tác vụ thật.

> Chia nhỏ theo phạm vi giúp context vừa đủ, nhưng đừng tách thành hàng chục rule trùng lặp khó quản lý.`
},
{
  id: 'qz-ccaf-009',
  topic: 'claude',
  q: '[Claude Code Configuration] An enterprise-managed policy denies a tool, while a repository settings file adds that tool to an allow list. What should the platform team expect?',
  options: [
    'The project allow entry always wins because it is closest to the source file',
    'The user can resolve the conflict by adding the tool to CLAUDE.md',
    'The allow entry and deny entry cancel each other out, so the tool is unrestricted',
    'A deny rule is the restrictive choice; a lower-level project allow should not be treated as a way to bypass managed policy'
  ],
  answer: 3,
  explain: `**Đúng: không dùng project allow để vượt qua deny do tổ chức đặt.** Permission rules dùng để quản lý hành động của tool. Trong xung đột allow/deny, deny là lựa chọn hạn chế hơn và cần được giữ để bảo vệ ranh giới tổ chức. Cấu hình managed được quản trị bởi doanh nghiệp và không nên bị xem như một gợi ý mà project có thể ghi đè.

### Vì sao các lựa chọn khác sai
- **Project gần source hơn nên thắng:** vị trí file không khiến allow dự án vô hiệu hóa chính sách quản trị cấp cao.
- **Viết trong CLAUDE.md:** văn bản hướng dẫn không thay đổi permission engine và không giải quyết xung đột cấu hình.
- **Hai rule triệt tiêu:** cách hiểu này tạo hành vi fail-open — khi có xung đột thì vô tình mở quyền. Với bảo mật, cần giữ quyết định chặn.

### Thuật ngữ
“Fail closed” nghĩa là khi cấu hình mâu thuẫn hoặc không rõ, giữ trạng thái hạn chế thay vì tự mở quyền. Managed settings là cấu hình triển khai bởi tổ chức.

> Kiểm thử quyền ở đúng môi trường doanh nghiệp; đừng chỉ xác minh trên máy cá nhân không có policy quản trị.`
},
{
  id: 'qz-ccaf-010',
  topic: 'claude',
  q: '[Claude Code Configuration] Developers need shared project permissions, but one developer also needs a personal local exception. Which settings layout is the clearest starting point?',
  options: [
    'Keep team settings in .claude/settings.json and local-only overrides in .claude/settings.local.json',
    'Put both sets of permissions in CLAUDE.md and ask each developer to remember the differences',
    'Store team permissions in ~/.claude/settings.json on one workstation',
    'Use CLAUDE.local.md as the only settings file because it is automatically managed by the company'
  ],
  answer: 0,
  explain: `**Đúng: phân tách settings của project và settings local.** {{.claude/settings.json}} là nơi phù hợp để nhóm review và chia sẻ cấu hình dự án. {{.claude/settings.local.json}} dành cho cấu hình riêng của máy/checkout theo quy ước Claude Code, thay vì làm bẩn cấu hình dùng chung. Nhóm vẫn phải kiểm tra cụ thể cách Git và môi trường deploy xử lý tệp local.

### Vì sao các lựa chọn khác sai
- **Để permissions trong CLAUDE.md:** câu văn không cấu hình permission engine; sự khác biệt giữa máy còn dễ bị bỏ sót.
- **User settings của một workstation:** chỉ người sở hữu workstation nhận cấu hình đó; clone repo không mang theo cài đặt chung.
- **CLAUDE.local.md là settings doanh nghiệp:** đây là tệp hướng dẫn local của project, không phải settings file managed hay chính sách do công ty tự động cấp.

### Lưu ý vận hành
Không đặt token hay mật khẩu vào settings chỉ vì tệp có chữ “local”. Kiểm tra ignore rules và quy trình review để chắc chắn dữ liệu cá nhân không bị commit ngoài ý muốn.

> Trước khi dựa vào một override local, xác minh nó thực sự được nạp trên phiên bản Claude Code của team.`
},
{
  id: 'qz-ccaf-011',
  topic: 'claude',
  q: '[Claude Code Configuration] A team wants Claude to run the test command automatically but must not grant arbitrary shell access. Which permission design is safer?',
  options: [
    'Allow every Bash command because the project is trusted',
    'Allow only the narrow, expected test command and keep unrelated commands subject to review or denial',
    'Put “run tests only” in CLAUDE.md and grant unrestricted Bash permission',
    'Disable all permission checks so the test cannot be interrupted'
  ],
  answer: 1,
  explain: `**Đúng: allow đúng command cần dùng, không mở toàn bộ Bash.** Permission allow là danh sách hành động được chạy mà không cần hỏi theo cấu hình hiện tại. Cấp quyền rộng như mọi lệnh shell cho phép nhiều hơn yêu cầu: nếu prompt hoặc file bị thao túng, Claude có thể gọi lệnh ngoài ý định. Nguyên tắc least privilege (quyền tối thiểu) là chỉ cấp phần quyền đủ để hoàn thành việc.

### Vì sao các lựa chọn khác sai
- **Allow mọi Bash:** biến yêu cầu “chạy test” thành quyền thực thi tùy ý; phạm vi nguy cơ lớn hơn rất nhiều.
- **Chỉ ghi trong CLAUDE.md:** hướng dẫn không giới hạn tool, nên nó không thay thế allow/deny.
- **Tắt mọi kiểm tra:** bỏ lớp bảo vệ thay vì giải quyết đúng một điểm nghẽn; tác động tới cả hành động không liên quan.

### Ví dụ
Nếu quy trình chỉ cần {{npm test}}, hãy cho phép đúng pattern đã xác minh cho lệnh test của dự án, không cho phép mọi shell command. Xem kỹ pattern vì wildcard rộng có thể khớp lệnh ngoài dự kiến.

> Đánh giá lại allowlist khi script package thay đổi; một lệnh build có thể gọi các script con mà team chưa kiểm tra.`
},
{
  id: 'qz-ccaf-012',
  topic: 'claude',
  multi: true,
  q: '[Claude Code Configuration] A repository must reduce accidental exposure of local credentials while keeping ordinary development useful. Which two measures are appropriate? (Choose 2)',
  options: [
    'Add a targeted deny rule for reading the credential file using the relevant file-reading tool',
    'Grant unrestricted Bash access because a Read deny rule also blocks every shell command that could print the file',
    'Keep any allow rules narrowly scoped to the commands the workflow actually needs',
    'Store the credential contents in CLAUDE.md so Claude can avoid asking for them',
    'Replace all access controls with a warning in the user prompt'
  ],
  answer: [0, 2],
  explain: `**Đúng: chặn đúng tài nguyên nhạy cảm và giữ allowlist hẹp.** Permission deny cho tool đọc file có thể chặn đường truy cập trực tiếp qua tool đó; allowlist hẹp giảm số hành động được thực thi tự động. Cần hiểu giới hạn: quyền của một tool không nhất thiết bao phủ mọi đường khác. Chẳng hạn, Bash là một tool riêng; đừng giả định deny cho thao tác đọc file tự động ngăn một lệnh shell in cùng nội dung.

### Vì sao từng lựa chọn còn lại sai
- **Unrestricted Bash:** chính lựa chọn này tạo đường vòng quanh quyền đọc file; cấp quyền rộng phá vỡ mục đích bảo vệ.
- **Ghi credential vào CLAUDE.md:** hướng dẫn có thể được đưa vào context, chia sẻ hoặc lưu trong repository; đó là phơi bày bí mật chứ không phải bảo vệ.
- **Chỉ cảnh báo bằng prompt:** lời nhắc không phải enforcement kỹ thuật và có thể bị hiểu sai hoặc bị nội dung khác lấn át.

### Thực hành an toàn
Xác định các đường truy cập: Read/Edit, shell, hooks và công cụ tích hợp. Chỉ cấp những gì cần, dùng secret manager/runtime injection cho bí mật, rồi thử các đường truy cập bị cấm trong môi trường giả lập.

> Permission rule là một lớp; không đưa secret vào prompt hay hướng dẫn để rồi kỳ vọng model tự giữ kín.`
},
{
  id: 'qz-ccaf-013',
  topic: 'claude',
  q: '[Claude Code Configuration] A deterministic formatter must run after Claude edits a matching source file, regardless of what the model remembers. Which mechanism best fits?',
  options: [
    'Add a paragraph in CLAUDE.md saying the formatter is mandatory',
    'Ask the model to remember to run formatting at the end of every turn',
    'Configure an appropriate post-tool hook for the relevant file-editing activity and test its behavior',
    'Create a user-level slash command and assume it runs after every edit'
  ],
  answer: 2,
  explain: `**Đúng: dùng hook cho công việc tự động gắn với sự kiện tool.** Hook là cơ chế chạy hành động khi Claude Code gặp một sự kiện đã cấu hình, ví dụ sau khi một tool chỉnh sửa file hoàn tất. Nó phù hợp hơn văn bản khi yêu cầu là hành động lặp lại, xác định được. Hãy giới hạn matcher vào tool/đối tượng cần thiết và chạy thử hook với thay đổi nhỏ trước khi áp dụng rộng.

### Vì sao các lựa chọn khác sai
- **Đoạn CLAUDE.md:** hữu ích để giải thích quy ước nhưng còn phụ thuộc model có nhớ và làm đúng không.
- **Nhờ model nhớ:** vẫn là chỉ dẫn mềm; có thể quên, kết thúc sớm hoặc diễn giải khác.
- **Slash command:** là thao tác chủ động do người dùng gọi, không tự chạy sau từng edit.

### Thuật ngữ
“Post-tool hook” là hook chạy sau khi tool phù hợp được thực thi; khác với cơ chế kiểm tra trước tool. Hook cũng không thay thế test cuối quy trình.

> Đừng để formatter thay đổi toàn repo sau mỗi edit; hook nên có scope nhỏ để tránh chậm và tạo diff khó review.`
},
{
  id: 'qz-ccaf-014',
  topic: 'claude',
  q: '[Claude Code Configuration] A team’s deployment rule says “production release requires a change ticket,” but Claude sometimes forgets it despite reading CLAUDE.md. What is the best architectural response?',
  options: [
    'Move the requirement to a longer CLAUDE.md and assume that makes it mandatory',
    'Use an enforceable workflow or permission gate for the release action, while keeping CLAUDE.md as explanatory guidance',
    'Ask every user to paste the ticket number into every prompt',
    'Put the release rule in a project-specific path rule that only applies to Java files'
  ],
  answer: 1,
  explain: `**Đúng: ràng buộc phát hành cần enforcement ngoài lời nhắc.** Một hook hoặc cổng triển khai có thể kiểm tra ticket trước khi cho hành động release tiếp tục. {{CLAUDE.md}} vẫn nên nói rõ quy trình và lý do, nhưng nó không phải bộ thực thi chính sách. Hệ thống phát hành thật nên xác minh ticket bằng nguồn tin cậy, thay vì chỉ tin text Claude gửi.

### Vì sao các lựa chọn khác sai
- **Viết dài hơn:** thêm giải thích có thể giúp model hiểu, nhưng không đảm bảo hành động bị chặn khi thiếu ticket.
- **Dán ticket vào prompt:** dễ quên, có thể ghi nhầm, và model không xác nhận ticket hợp lệ.
- **Rule chỉ cho file Java:** phạm vi không liên quan đến một hành động release; rule path chỉ chọn hướng dẫn theo file chứ không tự chặn deploy.

### Ví dụ
Trước khi triển khai, pipeline gọi bước kiểm tra ticket tồn tại và trạng thái được phê duyệt. Nếu không đạt, pipeline dừng. Claude có thể hướng dẫn người dùng bổ sung thông tin thay vì thực hiện release.

> Với thao tác có tác động thật, cưỡng chế ở nơi sở hữu hành động; đừng giao quyền quyết định cuối cùng cho prompt.`
},
{
  id: 'qz-ccaf-015',
  topic: 'claude',
  q: '[Claude Code Configuration] A hook that runs on every tool call is making a large project noticeably slower. What is the best first optimization?',
  options: [
    'Remove all hooks and rely entirely on model memory',
    'Run the same hook in every repository and every user session to warm its cache',
    'Increase the model context so the hook result is less important',
    'Narrow the hook to the relevant event and tool matcher, and make its check fast'
  ],
  answer: 3,
  explain: `**Đúng: giảm số lần hook chạy bằng scope chính xác.** Hook là chương trình được kích hoạt bởi event; nếu matcher rộng, một script có thể chạy cho cả thao tác không liên quan. Ví dụ kiểm tra SQL migration không cần chạy sau khi Claude đọc một file Markdown. Giới hạn event/tool phù hợp và làm check nhanh sẽ giảm độ trễ tích lũy mà vẫn giữ automation cần thiết.

### Vì sao các lựa chọn khác sai
- **Xóa hết hook:** giải quyết độ trễ bằng cách bỏ luôn kiểm soát/automation, có thể làm lỗi quy trình quay lại.
- **Chạy mọi nơi:** làm tăng số lần thực thi thay vì giảm; “warm cache” không phải giả định an toàn nếu chưa đo.
- **Tăng context:** kích thước context không làm chương trình hook chạy nhanh hơn.

### Điều tra
Đo thời gian hook, tần suất kích hoạt, và công việc nó làm. Nếu mỗi lần mất 300 ms và chạy 100 lần, độ trễ cộng dồn có thể đáng kể. Chỉ sau khi đo mới quyết định tối ưu thuật toán hoặc cache.

> Hook nên nhỏ, có thể dự đoán và được kiểm soát phạm vi; mọi hook chạy thường xuyên đều cần tính ngân sách thời gian.`
},
{
  id: 'qz-ccaf-016',
  topic: 'claude',
  multi: true,
  q: '[Claude Code Configuration] A team adds a pre-tool guard and a post-edit check. Which two statements describe a sound hook design? (Choose 2)',
  options: [
    'A hook is just prose; Claude may choose whether to run it',
    'A hook should be scoped to the relevant event/tool instead of matching everything',
    'A hook can make every action safe, so permission settings and external validation are unnecessary',
    'The team should test the hook with representative inputs and observe its failure behavior',
    'A hook should silently report success even when its check could not run'
  ],
  answer: [1, 3],
  explain: `**Đúng: scope phù hợp và kiểm thử hành vi thật.** Hook là automation gắn với event, vì vậy matcher quá rộng sẽ chạy không cần thiết. Test cần bao gồm trường hợp bình thường lẫn lỗi, ví dụ script không tồn tại hoặc đầu vào có ký tự lạ. Quan sát kết quả giúp team biết hook có chặn đúng và thông báo đủ rõ không.

### Vì sao từng lựa chọn còn lại sai
- **Chỉ là prose:** hook không phải câu nhắc; đây là cấu hình automation.
- **Thay mọi lớp an toàn:** hook có thể lỗi, bị cấu hình sai hoặc không bao phủ tool khác. Permission và xác thực phía hệ thống vẫn cần.
- **Giả thành công khi check lỗi:** che giấu lỗi khiến người dùng tin rằng đã kiểm tra, trong khi thực tế không chạy. Lỗi phải được xử lý rõ theo chính sách.

### Ví dụ
Một hook post-edit chạy formatter trên file Java phù hợp, còn hook pre-tool kiểm tra lệnh deploy có approval. Formatter không thay thế cổng deploy và ngược lại.

> Ghi log vừa đủ để debug, nhưng tránh in credential hoặc toàn bộ nội dung nhạy cảm vào log hook.`
},
{
  id: 'qz-ccaf-017',
  topic: 'claude',
  q: '[Claude Code Configuration] A product team wants an engineer to intentionally start a repeatable “prepare release notes” workflow, rather than have Claude launch it unexpectedly. What is the best fit?',
  options: [
    'Put the workflow in an enterprise permission deny rule',
    'Expose an explicit user-invoked command or skill and document its inputs',
    'Add a path-scoped rule for every file in the repository',
    'Make it an automatic hook on every Read operation'
  ],
  answer: 1,
  explain: `**Đúng: chọn điểm gọi tường minh bởi người dùng.** Slash command là lệnh người dùng chủ động gọi; skill có thể đóng gói hướng dẫn workflow và tài liệu/phần hỗ trợ để tái sử dụng. Với bước phát hành cần chủ ý, yêu cầu người dùng gọi lệnh rõ ràng giúp tránh chạy ngoài thời điểm mong muốn. Ghi rõ dữ liệu đầu vào như phiên bản, phạm vi thay đổi và người duyệt.

### Vì sao các lựa chọn khác sai
- **Permission deny:** dùng để chặn hành động/tool, không để khởi động công việc tạo release notes.
- **Rule toàn repo:** rule là hướng dẫn theo ngữ cảnh, không tạo nút gọi workflow có chủ đích.
- **Hook mỗi lần Read:** sẽ chạy rất thường xuyên, sai thời điểm và tốn tài nguyên; hook phù hợp sự kiện tự động, không phải quy trình cần quyết định của người dùng.

### Phân biệt
Command/skill định nghĩa cách làm; permission và hook có thể giới hạn hoặc tự động hóa các hành động xung quanh nó. Không nên nhầm lẫn giữa “cách Claude làm” và “ai có quyền cho phép thao tác”.

> Với workflow tác động production, sau bước tạo ghi chú vẫn cần người có thẩm quyền review và pipeline kiểm tra.`
},
{
  id: 'qz-ccaf-018',
  topic: 'claude',
  q: '[Claude Code Configuration] A team has a small custom slash command that has grown into a workflow needing reference documents and helper files. What is the best next design?',
  options: [
    'Copy the entire workflow into every developer’s user-level CLAUDE.md',
    'Turn the reference documents into permission rules',
    'Package the reusable workflow as a skill with its instructions and supporting files',
    'Replace it with a hook that runs whenever Claude starts'
  ],
  answer: 2,
  explain: `**Đúng: skill phù hợp khi workflow có hướng dẫn và tài nguyên đi kèm.** Skill là đơn vị đóng gói một khả năng có thể tái sử dụng; ngoài hướng dẫn chính, nó có thể đi kèm tài liệu tham khảo hay file hỗ trợ. Một slash command nhỏ vẫn hợp lý cho prompt ngắn, nhưng khi nội dung phát triển thành quy trình có nhiều thành phần thì skill giúp tổ chức rõ hơn.

### Vì sao các lựa chọn khác sai
- **Sao chép vào từng CLAUDE.md:** làm hướng dẫn xuất hiện mọi lúc, gây nhiễu và dễ có các bản khác nhau.
- **Reference thành permission:** permission điều khiển quyền tool, không chứa tri thức hay quy trình.
- **Hook lúc startup:** hook là automation theo sự kiện, không phải cách cung cấp một quy trình chỉ cần khi được gọi.

### Ví dụ
Skill release-notes có hướng dẫn định dạng, checklist và mẫu changelog. Claude chỉ cần nạp phần liên quan khi thực hiện workflow; người dùng có thể yêu cầu rõ ràng nếu muốn kiểm soát thời điểm.

> Giữ mô tả skill ngắn và phân biệt các skill bằng mục đích, để Claude và người dùng chọn đúng workflow.`
},
{
  id: 'qz-ccaf-019',
  topic: 'claude',
  multi: true,
  q: '[Claude Code Configuration] A team wants a reusable skill for an occasional compliance workflow that must only start when a person explicitly requests it. Which two choices support that intent? (Choose 2)',
  options: [
    'Put all compliance requirements only in a user’s shell history',
    'Package the workflow in a skill with clear instructions and relevant supporting material',
    'Allow the model to start the workflow whenever it thinks compliance might be relevant',
    'Configure the skill so it is not automatically invoked by the model, while retaining the intended user invocation path',
    'Run the workflow as a hook after every tool call'
  ],
  answer: [1, 3],
  explain: `**Đúng: đóng gói nội dung thành skill và tắt việc model tự khởi động nó.** Skill giữ quy trình ở dạng có thể chia sẻ/tái sử dụng; tài liệu hỗ trợ giúp các bước nhất quán. Metadata như {{disable-model-invocation: true}} dùng khi skill phải được gọi rõ ràng bởi người dùng thay vì tự động được model chọn. Hãy xác minh tên và hành vi metadata trên phiên bản Claude Code mà team triển khai.

### Vì sao từng lựa chọn còn lại sai
- **Shell history:** không phải kho cấu hình dùng chung, khó review và dễ chứa lệnh/secret không nên chia sẻ.
- **Cho model tự gọi:** ngược với yêu cầu quy trình chỉ chạy khi có chủ ý.
- **Hook sau mọi tool:** gọi quá thường xuyên và sai mục đích; compliance workflow không cần khởi động sau mỗi thao tác.

### Thuật ngữ
“User invocation” nghĩa là người dùng chủ động gọi workflow. “Model invocation” nghĩa là Claude tự chọn skill dựa trên nội dung tác vụ.

> Metadata kiểm soát cách gọi không phải permission boundary: nếu workflow có hành động nguy hiểm, vẫn cần kiểm tra quyền riêng.`
},
{
  id: 'qz-ccaf-020',
  topic: 'claude',
  q: '[Claude Code Configuration] A new feature spans several services, and the team wants Claude to inspect the codebase and propose steps before editing files. Which workflow is most appropriate?',
  options: [
    'Use plan mode to investigate and outline the approach, review the plan, then proceed with implementation',
    'Grant unrestricted permissions first so planning cannot be interrupted',
    'Put the entire proposed implementation in CLAUDE.local.md and skip repository inspection',
    'Run a post-tool hook that writes code before Claude has examined the feature'
  ],
  answer: 0,
  explain: `**Đúng: lập kế hoạch trước, xem lại rồi mới triển khai.** Plan mode phù hợp với thay đổi rộng hoặc chưa rõ vì khuyến khích Claude khảo sát cấu trúc, xác định phụ thuộc và trình bày các bước trước khi sửa code. Kế hoạch là đề xuất để con người review; sau khi được duyệt, team vẫn phải theo dõi diff và chạy test.

### Vì sao các lựa chọn khác sai
- **Mở toàn bộ quyền:** quyền rộng không giúp kế hoạch tốt hơn; nó làm tăng rủi ro hành động không cần thiết.
- **Ghi phương án vào CLAUDE.local.md:** local file chứa chỉ dẫn bổ sung, không thay thế việc tìm hiểu repository; kế hoạch một lần cũng không nên biến thành hướng dẫn lâu dài.
- **Hook viết code trước khi khảo sát:** đảo thứ tự công việc và tạo thay đổi có thể dựa trên giả định sai.

### Ví dụ
Trước khi đổi API giữa billing và catalog, kế hoạch nên nêu call sites, thứ tự cập nhật, migration cần thiết và test hồi quy. Reviewer có thể phát hiện thiếu bước trước khi code lan rộng.

> Với một sửa lỗi một dòng, plan mode có thể dư thừa; chọn mức quy trình tương xứng với độ bất định và blast radius.`
},
{
  id: 'qz-ccaf-021',
  topic: 'claude',
  q: '[Claude Code Configuration] A manager assumes that using plan mode guarantees Claude cannot make unsafe changes. What is the correct clarification?',
  options: [
    'Plan mode permanently disables every tool in all future sessions',
    'Plan mode is only a way to format the final answer',
    'Plan mode helps separate investigation/planning from implementation, but it does not replace permission controls or human review',
    'Plan mode automatically validates every generated patch against production'
  ],
  answer: 2,
  explain: `**Đúng: plan mode hỗ trợ quy trình, không phải ranh giới bảo mật.** Chế độ này hữu ích để Claude phân tích và đề xuất trước khi chỉnh sửa. Nó không chứng minh code đúng, không tự kiểm tra production, cũng không thay thế permission rules. Quyền thực thi và quy trình review vẫn cần được cấu hình độc lập.

### Vì sao các lựa chọn khác sai
- **Tắt tool vĩnh viễn:** plan mode không phải một chính sách áp dụng mọi phiên về sau.
- **Chỉ định dạng câu trả lời:** mục đích của nó là thay đổi cách tiếp cận tác vụ, không đơn thuần là trình bày.
- **Tự validate với production:** Claude Code không thể suy ra mọi đặc tính production chỉ từ plan mode; kiểm thử tích hợp và staging vẫn cần.

### Ví dụ
Kế hoạch đề xuất thêm migration có thể hợp lý nhưng vẫn sai với dữ liệu thật. Chạy migration trên môi trường thử, xem execution plan và chuẩn bị rollback trước khi production.

> Tách ba câu hỏi: “đã nghĩ trước chưa?”, “được phép làm gì?”, “đã chứng minh thay đổi đúng chưa?” — chúng cần các cơ chế khác nhau.`
},
{
  id: 'qz-ccaf-022',
  topic: 'claude',
  q: '[Claude Code Configuration] A CI job needs one complete machine-readable response from a non-interactive Claude Code run, not a stream of intermediate events. Which invocation is the best fit?',
  options: [
    'Start the normal interactive terminal session and scrape whatever appears on screen',
    'Use claude -p with --output-format json and parse the documented JSON response rather than treating it as plain prose',
    'Use --output-format stream-json and assume it is one ordinary JSON object',
    'Run claude without a prompt and wait indefinitely for a human to answer'
  ],
  answer: 1,
  explain: `**Đúng: chạy prompt mode {{-p}} và chọn JSON output.** {{-p}} (print/non-interactive mode) phù hợp để chạy prompt trong script mà không chờ một phiên hội thoại terminal. {{--output-format json}} trả cấu trúc JSON cuối cùng để chương trình tiêu thụ. Script phải parse theo cấu trúc tài liệu quy định và xử lý lỗi/thiếu trường, không lấy toàn bộ stdout như văn xuôi.

### Vì sao các lựa chọn khác sai
- **Scrape terminal tương tác:** output có thể chứa prompt giao diện, thay đổi theo phiên bản và treo chờ thao tác.
- **Coi stream-json là một object:** chế độ stream phát nhiều sự kiện JSON theo dòng; cần bộ đọc stream và logic ghép event, không phải một JSON object duy nhất.
- **Không có prompt:** tiến trình không có tác vụ xác định; chờ người dùng trái với yêu cầu CI không tương tác.

### Vận hành CI
Đặt timeout, giới hạn quyền tool, xử lý exit status và log output an toàn. JSON giúp máy đọc cấu trúc, nhưng không có nghĩa nội dung luôn hợp lệ ngữ nghĩa hay có đủ trường.

> Phân biệt JSON response cuối với stream-json event stream trước khi viết parser.`
},
{
  id: 'qz-ccaf-023',
  topic: 'claude',
  q: '[Claude Code Configuration] A CI script parses Claude’s JSON response and assumes every run contains the same result field, even when Claude refuses or the process fails. What should the script do?',
  options: [
    'Assume a zero-byte response means the model returned an empty but valid answer',
    'Retry forever until the field appears',
    'Ignore process status because JSON output guarantees success',
    'Check the process outcome and validate that the expected field exists and has the expected type before using it'
  ],
  answer: 3,
  explain: `**Đúng: kiểm tra cả tiến trình lẫn cấu trúc response.** Một JSON mode tạo format máy đọc được, không đảm bảo mỗi nhánh chạy đều trả đủ trường ứng dụng cần. Từ chối yêu cầu, lỗi CLI, timeout hoặc output không đạt schema đều cần xử lý riêng. Parse thành công cũng không đồng nghĩa dữ liệu hợp lệ; hãy kiểm tra trường bắt buộc và kiểu trước khi đưa vào bước kế tiếp.

### Vì sao các lựa chọn khác sai
- **Coi rỗng là câu trả lời hợp lệ:** có thể che giấu lỗi hoặc refusal thành dữ liệu nghiệp vụ rỗng.
- **Retry vô hạn:** tiêu tốn thời gian/tài nguyên và có thể lặp lại cùng lỗi cấu hình.
- **Bỏ qua exit status:** bỏ tín hiệu lỗi của tiến trình; response không nên được dùng khi command báo thất bại.

### Ví dụ
Nếu pipeline mong đợi danh sách finding, kiểm tra command thành công, parse JSON, xác nhận field là mảng, rồi mới xử lý. Nếu không đạt, fail bước với thông báo rõ và lưu log đã loại secret.

> Parser production cần xử lý “không có kết quả” khác với “lỗi khi tạo kết quả”.`
},
{
  id: 'qz-ccaf-024',
  topic: 'claude',
  q: '[Claude Code Configuration] A coding agent and an automated reviewer share one long session. The reviewer keeps repeating the agent’s earlier claims instead of independently examining the patch. What is the best change?',
  options: [
    'Run review in a separate, fresh session with the diff and review criteria as its context',
    'Append more praise for the implementation to the shared conversation',
    'Ask the coding agent to grade its own work twice',
    'Add the coding agent’s conclusions to user-level CLAUDE.md before review'
  ],
  answer: 0,
  explain: `**Đúng: tách reviewer thành session mới, độc lập.** Session là cuộc hội thoại có context riêng. Khi reviewer kế thừa toàn bộ lịch sử coding agent, nó dễ bị neo vào giả định và kết luận có sẵn; đây là confirmation bias, tức xu hướng tìm bằng chứng ủng hộ điều đã tin. Phiên mới nhận diff cùng tiêu chí review giúp tập trung vào bằng chứng trong thay đổi.

### Vì sao các lựa chọn khác sai
- **Thêm lời khen:** tăng thiên kiến thay vì giảm nó.
- **Cho coding agent tự chấm:** vẫn dùng cùng tác nhân và giả định; lặp lại không tạo tính độc lập.
- **Ghi kết luận vào user CLAUDE.md:** làm kết luận một lần thành hướng dẫn bền vững, dễ ảnh hưởng các tác vụ sau và không cung cấp kiểm chứng.

### Quy trình gợi ý
Reviewer nhận base/head diff, mục tiêu feature, tiêu chí lỗi nghiêm trọng và yêu cầu chỉ báo cáo finding có vị trí cụ thể. Sau đó con người xác minh từng finding.

> Session độc lập giảm nhiễu nhận thức, nhưng không tự biến review thành kiểm chứng hoàn hảo.`
},
{
  id: 'qz-ccaf-025',
  topic: 'claude',
  q: '[Claude Code Configuration] An automated reviewer flags “possible SQL injection” but provides no file, line, input path, or reproduction. What should the pipeline do to reduce false positives?',
  options: [
    'Fail every build on any security-related phrase, regardless of evidence',
    'Ask Claude to repeat the same finding with stronger wording',
    'Require a concrete location and evidence connecting untrusted input to an unsafe query before treating it as actionable',
    'Suppress every security finding because automated reviewers are imperfect'
  ],
  answer: 2,
  explain: `**Đúng: yêu cầu bằng chứng cụ thể trước khi biến cảnh báo thành finding.** False positive là cảnh báo nói có lỗi nhưng code thực tế không mắc lỗi. Với SQL injection — dữ liệu đầu vào độc hại bị ghép vào câu SQL — reviewer nên chỉ ra file/dòng, nguồn dữ liệu không tin cậy, cách nó đi vào query, và vì sao parameterization không bảo vệ ở đây. Không có chuỗi bằng chứng thì finding cần được đánh dấu chưa xác minh thay vì mặc định là bug.

### Vì sao các lựa chọn khác sai
- **Fail theo từ khóa:** tạo nhiều build đỏ giả, làm developer mất niềm tin và có thể bỏ qua cảnh báo thật.
- **Yêu cầu nói mạnh hơn:** độ tự tin trong câu chữ không phải bằng chứng mới.
- **Tắt toàn bộ security finding:** bỏ lỡ lỗi thật; cần cải thiện chất lượng triage, không loại bỏ cả tín hiệu hữu ích.

### Triage
Reviewer tạo candidate finding; test, static analyzer hoặc engineer xác minh; pipeline quyết định fail theo severity và độ chắc chắn. Lưu lý do đóng false positive để cải thiện quy tắc.

> Chất lượng review được đo bằng finding có thể hành động, không phải số lượng cảnh báo.`
},
{
  id: 'qz-ccaf-026',
  topic: 'claude',
  multi: true,
  q: '[Claude Code Configuration] A team wants independent automated code review with fewer speculative findings. Which two practices best support that goal? (Choose 2)',
  options: [
    'Give the reviewer the entire coding conversation and instruct it to agree with the author',
    'Use a fresh review session with the relevant diff and explicit criteria',
    'Require each finding to include a location and a reasoned link from code to impact',
    'Treat every model confidence statement as proof that the defect is real',
    'Let the reviewer edit the patch before reporting what it changed'
  ],
  answer: [1, 2],
  explain: `**Đúng: context độc lập, đầu vào tập trung và finding có bằng chứng.** Session mới hạn chế việc reviewer bị ảnh hưởng bởi lời giải thích/thiên kiến của người viết. Diff giúp nó tập trung vào phần thay đổi. Tiêu chí yêu cầu vị trí và chuỗi lý do từ code tới tác động giúp người đọc xác minh, thay vì nhận một phán đoán chung chung.

### Vì sao từng lựa chọn còn lại sai
- **Cho toàn bộ hội thoại rồi yêu cầu đồng ý:** khiến reviewer bị neo vào kết luận coding agent, trái mục tiêu độc lập.
- **Coi confidence là bằng chứng:** điểm tự tin của model không chứng minh đường chạy hay tác động tồn tại.
- **Cho reviewer sửa trước khi báo:** trộn nhiệm vụ phát hiện với nhiệm vụ thay đổi code; diff sau review khó quy trách nhiệm và kiểm chứng finding ban đầu.

### Thực hành
Yêu cầu mỗi finding có vị trí, điều kiện tái hiện, tác động và lý do không phải false alarm. Chạy test/static analysis nếu có, rồi để engineer quyết định sửa.

> Reviewer tự động nên tạo danh sách giả thuyết kiểm chứng được, không tự đóng vai trò gatekeeper tuyệt đối.`
},
{
  id: 'qz-ccaf-027',
  topic: 'claude',
  q: '[Claude Code Configuration] A reviewer repeatedly reports style preferences as defects even though they are not part of the project standard. What is the best prompt/configuration adjustment?',
  options: [
    'Ask for every possible improvement, even if it is subjective',
    'State the review scope and severity threshold, and exclude preferences that do not affect correctness, security, reliability, or maintainability',
    'Tell Claude that the patch is excellent before asking for a review',
    'Allow the reviewer to browse unrelated files until it finds more issues'
  ],
  answer: 1,
  explain: `**Đúng: giới hạn review vào tiêu chí có tác động.** Một review prompt rõ nên nói phạm vi là diff nào, loại lỗi nào cần báo và ngưỡng severity ra sao. Nếu mỗi khác biệt style đều bị coi là bug, kết quả có nhiều false positive và reviewer tốn thời gian. Quy ước style đã được formatter/linter xử lý thì không cần lặp lại như finding.

### Vì sao các lựa chọn khác sai
- **Mọi cải tiến có thể:** khuyến khích nitpick và ý kiến chủ quan, không phải lỗi cần sửa.
- **Khen trước:** tạo thiên kiến tích cực, không giúp xác định tiêu chí.
- **Mở rộng file tùy ý:** làm scope trôi khỏi diff, tăng finding không liên quan và chi phí context.

### Ví dụ
Yêu cầu reviewer chỉ báo lỗi gây regression hoặc vi phạm security; mỗi finding phải trỏ tới dòng thuộc diff và giải thích impact. Style format giao cho formatter tự động.

> Đừng yêu cầu “tìm mọi vấn đề có thể”; hãy định nghĩa trước vấn đề nào đủ giá trị để làm dừng release.`
},
{
  id: 'qz-ccaf-028',
  topic: 'claude',
  q: '[Claude Code Configuration] An automated review job reports the same pre-existing warning on every pull request because it scans the entire repository. What is the best adjustment?',
  options: [
    'Focus the reviewer on the pull request diff and enough surrounding context to judge the changed lines',
    'Increase the severity of the warning on every run',
    'Tell the model to ignore all files not changed without giving it the changed-file list',
    'Move the warning into a user-level CLAUDE.md'
  ],
  answer: 0,
  explain: `**Đúng: review diff thay vì quét vô định toàn repo.** Diff là phần khác biệt giữa base và nhánh thay đổi. Reviewer nên được cung cấp phần diff cùng context xung quanh đủ để hiểu logic. Điều này giúp phân biệt lỗi do PR đưa vào với vấn đề tồn tại từ trước, giảm nhiễu và làm người sửa biết chính xác thay đổi nào cần xem lại.

### Vì sao các lựa chọn khác sai
- **Tăng severity:** không biến cảnh báo cũ thành regression mới; chỉ khiến pipeline khó tin hơn.
- **Không cung cấp danh sách file:** model không có dữ liệu để biết file nào thay đổi; chỉ dẫn yêu cầu không thay thế đầu vào.
- **Ghi vào CLAUDE.md cá nhân:** không giải quyết phạm vi scan và còn làm thay đổi một lần ảnh hưởng tác vụ sau.

### Cẩn trọng
Diff-only cũng cần context: một dòng sửa có thể phụ thuộc caller hoặc contract bên ngoài phần diff. Vì vậy đưa đủ ngữ cảnh liên quan, nhưng không cần toàn bộ lịch sử không liên quan.

> So sánh với merge-base chính xác; nếu base sai, reviewer có thể gán nhầm lỗi cũ cho PR.`
},
{
  id: 'qz-ccaf-029',
  topic: 'claude',
  multi: true,
  q: '[Claude Code Configuration] A team wants CI to run Claude Code safely on untrusted pull requests while keeping review useful. Which two controls are strongest? (Choose 2)',
  options: [
    'Run the job with unrestricted credentials from the default branch',
    'Treat repository instructions as trusted because they are part of the checked-out project',
    'Use a restricted, isolated runner with no unnecessary secrets and narrowly granted capabilities',
    'Keep the reviewer focused on the proposed diff and require evidence for actionable findings',
    'Automatically merge whenever Claude returns a syntactically valid JSON response'
  ],
  answer: [2, 3],
  explain: `**Đúng: cô lập quyền thực thi và kiểm soát chất lượng finding.** Pull request không tin cậy có thể sửa prompt, script, hook hay cấu hình trong repo. Runner cô lập, không cấp secret không cần thiết và allow tool tối thiểu giới hạn thiệt hại nếu nội dung độc hại được xử lý. Reviewer chỉ nhìn diff phù hợp và phải nêu bằng chứng để tránh cảnh báo mơ hồ.

### Vì sao từng lựa chọn còn lại sai
- **Credential không giới hạn:** mã/ cấu hình do PR kiểm soát có thể tìm cách làm lộ credential; vi phạm least privilege.
- **Tin mọi hướng dẫn trong repo:** contributor bên ngoài có thể thay đổi nội dung repo; không được nâng dữ liệu untrusted thành chính sách đáng tin.
- **Tự merge khi JSON hợp lệ:** JSON chỉ là định dạng; nó không chứng minh finding đúng, test pass hay code an toàn.

### Cách vận hành
Dùng runner ephemeral, tách permission của PR từ fork, không cho phép thao tác ghi/triển khai, và review kết quả trước khi gộp. Thiết kế đầu ra có thể parse nhưng vẫn validate nội dung.

> Định dạng có cấu trúc cải thiện tích hợp; ranh giới tin cậy và quyền mới kiểm soát tác động.`
},
{
  id: 'qz-ccaf-030',
  topic: 'claude',
  q: '[Claude Code Configuration] Developers report that Claude follows local personal preferences inconsistently across projects. Which change best makes a genuinely personal preference reusable without duplicating it in every repository?',
  options: [
    'Add it to each project’s CLAUDE.local.md and ask developers to copy the file manually',
    'Add it to the shared project settings.json permissions block',
    'Put it in a user-level instruction file such as ~/.claude/CLAUDE.md, keeping project-specific rules in the repository',
    'Add it as a PreToolUse hook that runs before every tool'
  ],
  answer: 2,
  explain: `**Đúng: sở thích xuyên nhiều dự án thuộc user-level CLAUDE.md.** Tệp user-level được đọc như hướng dẫn của người dùng trên các dự án mà họ làm việc. Ví dụ, một người muốn câu trả lời luôn có phần “giả định” có thể đặt sở thích đó ở đây. Quy tắc riêng của một repository vẫn nên ở tệp project để cả team review.

### Vì sao các lựa chọn khác sai
- **Sao chép CLAUDE.local.md mọi nơi:** tạo công việc thủ công và nhiều bản dễ lệch; local file phù hợp với chỉ dẫn riêng của một project checkout.
- **Project permissions:** settings permissions là quyền tool, không phải sở thích diễn đạt.
- **PreToolUse hook:** hook chạy theo hành động tool, không phải cách lưu preference; sẽ gây chi phí mỗi lần gọi và sai phạm vi.

### Nguyên tắc tổ chức
User-level: cách người đó muốn làm việc. Project-level: cách repository yêu cầu contributor làm việc. Managed policy: ràng buộc tổ chức. Tách đúng phạm vi giúp xử lý xung đột và review dễ hơn.

> Nếu sở thích có tác động bảo mật hoặc bắt buộc cho team, đừng để nó chỉ nằm trong cấu hình cá nhân.`
},
{
  id: 'qz-ccaf-031',
  topic: 'claude',
  q: '[Claude Code Configuration] A team opens a mature repository that has no Claude Code project guidance. They want a useful first draft without treating guessed conventions as policy. What should they do?',
  options: [
    'Copy the whole source tree into every developer’s user-level CLAUDE.md',
    'Run /init to create a project guidance draft, then review and correct it before sharing',
    'Put every build and security rule in a post-tool hook without examining the repository',
    'Assume Claude Code automatically knows every private convention from the repository'
  ],
  answer: 1,
  explain: `**Đúng: dùng {{/init}} để tạo bản nháp, rồi con người kiểm tra.** Đây là lệnh Claude Code có thể khảo sát repository và giúp khởi tạo {{CLAUDE.md}}. File này là hướng dẫn bằng ngôn ngữ tự nhiên được đưa vào ngữ cảnh làm việc, không phải kết quả kiểm định tự động. Vì vậy cần xác nhận lệnh build, cấu trúc thư mục và quy ước mà bản nháp ghi ra có thật; sửa phần suy đoán, bỏ nội dung không cần thiết, rồi mới chia sẻ qua Git.

### Vì sao các lựa chọn khác sai
- **Sao chép source vào file user-level:** làm file hướng dẫn khổng lồ, nhanh lỗi thời và chỉ gắn với một người thay vì repository.
- **Chuyển mọi quy tắc thành hook:** hook là automation theo sự kiện, không phải nơi phù hợp để ghi toàn bộ kiến trúc và quy ước. Không thể thiết kế đúng hook nếu chưa biết hệ thống.
- **Cho rằng model tự biết quy ước riêng:** model có thể đọc file, nhưng không nên mặc định nó suy ra đúng lệnh nội bộ hay quyết định của team.

### Cách dùng an toàn
Hãy xem bản do {{/init}} tạo như ghi chú khởi đầu: xác minh từng sự kiện và chỉ giữ hướng dẫn giúp các tác vụ sau thực hiện tốt hơn. Không đưa token, mật khẩu hoặc dữ liệu riêng vào đó.

> Một CLAUDE.md ngắn, chính xác và được review thường hữu ích hơn tài liệu dài chứa nhiều phỏng đoán.`
},
{
  id: 'qz-ccaf-032',
  topic: 'claude',
  multi: true,
  q: '[Claude Code Configuration] A team wants every contributor to discover the same project MCP server, but the server also needs an access credential. Which two choices are appropriate? (Choose 2)',
  options: [
    'Put the shareable project server configuration in the repository-level .mcp.json',
    'Commit a developer’s personal access token in the shared server configuration',
    'Provide the credential through an approved runtime environment or secret store instead of committing its value',
    'Put the server definition in one developer’s home directory and assume Git distributes it',
    'Write the credential into CLAUDE.md so Claude can reuse it'
  ],
  answer: [0, 2],
  explain: `**Đúng: chia sẻ cấu hình server bằng {{.mcp.json}} và cấp bí mật ngoài Git.** MCP (Model Context Protocol) là giao thức để ứng dụng AI kết nối tới server cung cấp tool hoặc dữ liệu. Claude Code hỗ trợ cấu hình MCP theo phạm vi dự án; file {{.mcp.json}} trong repository giúp thành viên thấy cùng khai báo server. Một khai báo kết nối không đồng nghĩa phải lưu credential thật trong file: môi trường chạy hoặc secret store đã được tổ chức phê duyệt nên cung cấp giá trị nhạy cảm.

### Vì sao từng lựa chọn còn lại sai
- **Commit token cá nhân:** bất kỳ ai đọc repository có thể lấy token; token còn có thể tồn tại trong lịch sử Git sau khi xóa khỏi phiên bản mới.
- **Cấu hình trong home của một người:** phạm vi user chỉ thuộc môi trường của người đó, không tự đi cùng repository khi đồng nghiệp clone.
- **Ghi credential vào CLAUDE.md:** file hướng dẫn có thể được chia sẻ và đưa vào ngữ cảnh model. Nó không phải kho bí mật.

### Ví dụ cụ thể
Repository có thể mô tả server dùng để tra cứu tài liệu nội bộ, còn CI và từng máy dev tự nhận credential từ hệ thống cấp secret. Nhờ vậy tên/cách kết nối nhất quán mà mỗi môi trường vẫn dùng thông tin xác thực phù hợp.

> Hãy review nội dung .mcp.json như cấu hình thực thi: chỉ khai báo server cần thiết và không để token thật lọt vào diff.`
},
{
  id: 'qz-ccaf-033',
  topic: 'claude',
  q: '[Claude Code Configuration] One engineer uses the same personal MCP server in several unrelated repositories. The rest of the team should not inherit that server. Which configuration scope best matches this need?',
  options: [
    'Project scope, committed into every repository',
    'A path-scoped rule under .claude/rules/',
    'User scope, so the configuration belongs to that engineer across their projects',
    'Enterprise-managed scope, so the server is private to one workstation'
  ],
  answer: 2,
  explain: `**Đúng: chọn user scope cho cấu hình của một người dùng qua nhiều project.** Scope là phạm vi áp dụng của cấu hình. Cấu hình user gắn với môi trường Claude Code của cá nhân, thích hợp khi server phục vụ công việc riêng và cần dùng ở nhiều repository. Ngược lại, cấu hình project nhằm cung cấp thiết lập cho một repository/team; cấu hình local của project dành cho ngoại lệ riêng của checkout đó.

### Vì sao các lựa chọn khác sai
- **Project scope:** đặt server vào từng repository khiến thành viên khác có thể nhận cấu hình ngoài ý muốn; phải lặp lại và bảo trì nhiều bản.
- **Path-scoped rule:** rule trong {{.claude/rules/}} là hướng dẫn theo đường dẫn, không phải nơi khai báo MCP server.
- **Enterprise-managed:** managed config là phạm vi do tổ chức quản trị, không phải cách để một cá nhân lưu cấu hình riêng trên một máy.

### Chọn scope theo người nhận
Hãy hỏi ai cần cấu hình: một người qua nhiều repo thì user; một nhóm trong repo thì project; một ngoại lệ chỉ cho checkout hiện tại thì local. Dù chọn scope nào, không nên lưu credential thật vào một file chỉ vì file đó không được chia sẻ.

> Chọn sai scope gây hai kiểu lỗi: server không đến được người cần dùng, hoặc vô tình cấp khả năng cho người không cần nó.`
},
{
  id: 'qz-ccaf-034',
  topic: 'claude',
  q: '[Claude Code Configuration] A configured MCP server is listed in a project, but its tools are unavailable in the current Claude Code session. What is the most useful first diagnostic?',
  options: [
    'Repeat the user prompt until Claude guesses the missing tool name',
    'Add the tool name to CLAUDE.md and assume that creates the connection',
    'Delete every project instruction file and reinstall Claude Code',
    'Use Claude Code’s /mcp interface to inspect the server connection and address its reported setup or authentication issue'
  ],
  answer: 3,
  explain: `**Đúng: kiểm tra trạng thái kết nối MCP trước khi sửa prompt.** Việc khai báo server chỉ mô tả cách Claude Code nên kết nối; nó không chứng minh tiến trình server đã khởi động, xác thực thành công hay cung cấp tool. Lệnh {{/mcp}} trong Claude Code giúp người dùng xem và quản lý các server MCP đã cấu hình. Bắt đầu từ trạng thái kết nối và thông báo lỗi cụ thể, rồi xử lý đúng nguyên nhân như cấu hình sai hoặc cần xác thực.

### Vì sao các lựa chọn khác sai
- **Lặp prompt:** prompt không khởi động server và cũng không sửa lỗi kết nối. Model không thể gọi một tool chưa được cung cấp trong phiên.
- **Ghi tên tool vào CLAUDE.md:** hướng dẫn chỉ cung cấp văn bản; nó không đăng ký tool hay tạo kết nối MCP.
- **Xóa mọi hướng dẫn và cài lại:** thay đổi lớn, không dựa trên bằng chứng; có thể mất cấu hình hợp lệ mà vẫn không xử lý được lỗi server.

### Tách lớp khi điều tra
Kiểm tra lần lượt: file cấu hình có được nhận diện không, server có khởi động không, kết nối/xác thực có thành công không, rồi mới xem tool cụ thể. Không đưa token vào log hay câu hỏi để tiện debug.

> Khi báo “tool không có”, trước hết xác nhận nó đã kết nối và được cung cấp trong phiên, thay vì chỉ đổi cách diễn đạt yêu cầu.`
},
{
  id: 'qz-ccaf-035',
  topic: 'claude',
  q: '[Claude Code Configuration] A developer proposes installing a third-party Claude Code plugin from an unfamiliar source because it promises useful shortcuts. What is the best configuration practice?',
  options: [
    'Review the source and requested capabilities, then install only through an approved source and scope',
    'Install it immediately because a plugin cannot affect tools or project behavior',
    'Give it unrestricted access to every repository before checking what it contains',
    'Copy its files into CLAUDE.md, which makes the plugin safe without review'
  ],
  answer: 0,
  explain: `**Đúng: xem nguồn và khả năng plugin trước, rồi mới cài ở phạm vi cần thiết.** Plugin mở rộng Claude Code bằng các thành phần có thể ảnh hưởng cách làm việc; nội dung từ nguồn lạ không tự trở nên đáng tin chỉ vì được đóng gói thành plugin. Review giúp biết ai duy trì, nó thêm những gì và có yêu cầu quyền không cần thiết hay không. Dùng nguồn được tổ chức phê duyệt và giới hạn scope cài đặt để tránh áp dụng rộng hơn nhu cầu.

### Vì sao các lựa chọn khác sai
- **Cho rằng plugin vô hại:** plugin có thể bổ sung cấu hình hoặc workflow; nội dung không tin cậy có thể tạo hành vi ngoài mong muốn.
- **Cấp mọi quyền trước khi xem:** đi ngược nguyên tắc quyền tối thiểu và làm tăng hậu quả nếu plugin có hành vi không an toàn.
- **Chép vào CLAUDE.md:** biến nội dung thành hướng dẫn văn bản không kiểm tra nguồn gốc; việc sao chép không loại bỏ rủi ro và còn làm cấu hình lẫn lộn.

### Quy trình nhóm
Kiểm tra repository nguồn, nội dung cấu hình và lý do cần từng khả năng; thử trong môi trường không chứa secret trước. Sau đó review thay đổi cấu hình như review code và thống nhất ai được cài ở phạm vi user hay project.

> “Có trong marketplace” không đồng nghĩa “đã được tổ chức phê duyệt”; nguồn và quyền vẫn cần được xác minh.`
},
{
  id: 'qz-ccaf-036',
  topic: 'claude',
  q: '[Claude Code Configuration] A repository has a long architecture guide that should remain reusable from project instructions, but copying its full contents into CLAUDE.md creates duplication. Which approach best preserves one source of truth?',
  options: [
    'Paste another full copy into every developer’s user-level instructions',
    'Reference the guide from CLAUDE.md with the supported @path import syntax, then verify the path and content',
    'Rename the guide to settings.json so Claude Code merges it automatically',
    'Mention the guide filename in a prompt and assume Claude reads it without access'
  ],
  answer: 1,
  explain: `**Đúng: dùng cú pháp import {{@path}} để tham chiếu tài liệu cần thiết.** Claude Code hỗ trợ đưa nội dung file khác vào hướng dẫn bằng cú pháp tham chiếu đường dẫn trong {{CLAUDE.md}}. Cách này giữ tài liệu kiến trúc ở một nơi để nhóm cập nhật, còn hướng dẫn dự án chỉ rõ nơi cần đọc. Đường dẫn phải trỏ tới file thực sự có thể truy cập; một cái tên được nhắc như văn bản không tự cung cấp nội dung.

### Vì sao các lựa chọn khác sai
- **Sao chép vào từng user file:** tạo nhiều bản có thể lệch nhau, không phải một nguồn sự thật và không tự chia sẻ với nhóm.
- **Đổi đuôi thành settings.json:** file settings có schema cấu hình, không phải cơ chế tự gộp tài liệu tùy ý.
- **Chỉ nhắc tên file:** Claude cần nội dung trong context hoặc quyền đọc file; tên file đơn thuần không đảm bảo nó đã được nạp.

### Cân nhắc context
Import giúp tránh trùng lặp, nhưng nội dung được đưa vào context khi áp dụng hướng dẫn, không phải một kho tìm kiếm tự động chỉ tải đoạn cần thiết. Vì thế không nên import hàng trăm trang không liên quan cho mọi tác vụ; tách tài liệu theo chủ đề và chỉ tham chiếu phần thực sự dùng chung.

> Một đường dẫn import hỏng khiến hướng dẫn quan trọng không tới được model; hãy kiểm tra nó sau khi di chuyển hoặc đổi tên tài liệu.`
},
{
  id: 'qz-ccaf-037',
  topic: 'claude',
  q: '[Claude Code Configuration] Claude Code seems unaware of a project instruction that should apply to the current work. Which first check provides the clearest evidence about the instruction files Claude Code knows about?',
  options: [
    'Ask the model to promise that it read every file in the repository',
    'Add the same instruction to every future user message without checking configuration',
    'Open /memory to inspect the memory and instruction files available to the current project context',
    'Put the instruction in a Bash permission pattern'
  ],
  answer: 2,
  explain: `**Đúng: dùng {{/memory}} để kiểm tra các file hướng dẫn/memory được nhận diện.** Trước khi viết lại nội dung, cần biết Claude Code đang nhìn thấy những nguồn hướng dẫn nào trong phiên. Lệnh {{/memory}} mở giao diện quản lý và xem các file memory/instruction liên quan. Nó giúp phân biệt lỗi nội dung với lỗi vị trí hoặc file không được nạp. Sau khi xác định file, kiểm tra đường dẫn và phạm vi của nó.

### Vì sao các lựa chọn khác sai
- **Yêu cầu model hứa:** câu trả lời không phải bằng chứng file đã được phát hiện hay nội dung được đưa vào context.
- **Lặp lại ở mọi prompt:** có thể tạm thời che nguyên nhân, tạo thao tác lặp và để lỗi cấu hình gốc tiếp tục tồn tại.
- **Bash permission:** permission điều khiển việc tool shell được chạy; nó không nạp chỉ dẫn bằng ngôn ngữ tự nhiên.

### Cách xử lý
Nếu file không xuất hiện, kiểm tra tên, vị trí và project đang mở. Nếu file có mặt nhưng chỉ dẫn vẫn không phù hợp, làm rõ nội dung hoặc loại bỏ mâu thuẫn. Không biến một vấn đề phạm vi thành lý do cấp thêm quyền tool.

> Dùng công cụ kiểm tra context trước khi tăng độ dài prompt: đôi khi Claude chưa hề nhận được file mà bạn nghĩ nó đã đọc.`
},
{
  id: 'qz-ccaf-038',
  topic: 'claude',
  multi: true,
  q: '[Claude Code Configuration] An engineer opens a newly cloned repository from an unfamiliar contributor. It contains project instructions and executable automation. Which two actions best reduce configuration risk before normal use? (Choose 2)',
  options: [
    'Trust every repository file because checked-in content is always safe',
    'Inspect project instructions and configuration for unexpected behavior before accepting the project trust prompt',
    'Assume a trust prompt is equivalent to a full security audit',
    'Review hooks and server configuration that may run or grant access, and use an isolated environment if uncertain',
    'Put personal credentials into the repository so the project can initialize successfully'
  ],
  answer: [1, 3],
  explain: `**Đúng: review cấu hình trước khi tin cậy, đặc biệt là automation và server.** Repository có thể chứa hướng dẫn, hook hoặc khai báo kết nối tới công cụ bên ngoài. Project trust là quyết định cho phép Claude Code làm việc với project theo cơ chế của nó; đây không phải chứng nhận rằng mọi nội dung trong repo đã an toàn. Người mới clone cần xem các file có thể ảnh hưởng hành vi trước khi chấp nhận.

### Vì sao từng lựa chọn còn lại sai
- **Tin mọi file đã commit:** Git ghi lại thay đổi, không xác minh người đóng góp hay tính an toàn của nội dung. Repo vẫn có thể chứa cấu hình độc hại hoặc lỗi.
- **Coi trust prompt là audit:** prompt xin quyết định trust không phân tích đầy đủ tác động bảo mật thay cho người dùng.
- **Đưa credential cá nhân vào repo:** làm lộ bí mật cho mọi người có quyền đọc và có thể để lại trong lịch sử Git.

### Thực hành an toàn
Đọc hướng dẫn, settings, hooks và MCP config trước; xác minh server và script đến từ nguồn mong đợi. Nếu còn nghi ngờ, dùng môi trường cô lập không chứa token hay quyền truy cập production để khảo sát.

> Trust project là ranh giới cần cân nhắc, không phải nút “quét và bảo đảm an toàn”.`
},
{
  id: 'qz-ccaf-039',
  topic: 'claude',
  q: '[Claude Code Configuration] A monorepo needs special test instructions only when work is performed inside services/payments. The instructions should not clutter unrelated catalog work. Which placement best matches this boundary?',
  options: [
    'Add the payments commands to every developer’s global user instructions',
    'Put the payment-only instructions in the repository root and say they are optional',
    'Create a CLAUDE.md inside services/payments so the guidance is associated with that subtree',
    'Put the commands in an enterprise policy shared with every repository'
  ],
  answer: 2,
  explain: `**Đúng: đặt hướng dẫn tại thư mục con tương ứng.** Claude Code có thể dùng các file {{CLAUDE.md}} trong cây thư mục để cung cấp chỉ dẫn theo khu vực; file dưới {{services/payments}} phù hợp với quy ước chỉ có ý nghĩa khi làm trong subtree đó. Nhờ vậy hướng dẫn test payments không phải xuất hiện như quy tắc toàn repo trong mọi việc catalog.

### Vì sao các lựa chọn khác sai
- **User-level toàn cục:** quy tắc đặc thù payments sẽ đi theo một người qua project khác và gây nhiễu khi họ không làm payments.
- **Đưa hết vào root:** lời nhắc “optional” vẫn buộc mọi task đọc hoặc cân nhắc chi tiết không liên quan; về lâu dài file root thành danh sách dài khó ưu tiên.
- **Enterprise policy:** đây là quy ước của một phần repository, không phải ràng buộc quản trị cần áp dụng cho mọi repo.

### Phân biệt với path-scoped rule
Nested {{CLAUDE.md}} có thể tổ chức hướng dẫn theo vị trí trong cây thư mục; {{.claude/rules/}} có thể dùng metadata phạm vi đường dẫn cho các rule cụ thể. Chọn cơ chế mà team đã chuẩn hóa, tránh sao chép cùng nội dung ở cả hai nơi.

> Khi di chuyển package, hãy di chuyển hoặc cập nhật hướng dẫn đi kèm và kiểm tra lại đường dẫn test.`
},
{
  id: 'qz-ccaf-040',
  topic: 'claude',
  multi: true,
  q: '[Claude Code Configuration] A company uses Claude Code in repositories and also calls the Claude Messages API from a Java service. The team expects project CLAUDE.md guidance to affect both automatically. Which two statements are correct? (Choose 2)',
  options: [
    'Project CLAUDE.md provides guidance to Claude Code when it works in that project',
    'The Messages API automatically reads the caller’s local CLAUDE.md file',
    'The Java service must send the instructions it needs through its API request or application logic',
    'The API will load .claude/settings.json whenever the request uses the same model',
    'Putting a project file on disk makes it a system policy for every Anthropic product'
  ],
  answer: [0, 2],
  explain: `**Đúng: phân biệt cấu hình Claude Code với request gửi tới API.** {{CLAUDE.md}} là quy ước hướng dẫn dành cho Claude Code khi làm việc với project. Một Java service gọi Messages API là một ứng dụng khác; request chỉ chứa những nội dung và tham số mà ứng dụng gửi. API không tự truy cập ổ đĩa repository của máy developer để đọc file cấu hình Claude Code.

### Vì sao từng lựa chọn còn lại sai
- **API tự đọc CLAUDE.md:** API nhận request qua mạng và không biết đường dẫn local trên máy gọi, trừ khi ứng dụng chủ động gửi nội dung.
- **API đọc settings.json theo model:** chọn cùng model không làm ứng dụng API kế thừa cấu hình tool, quyền hay hướng dẫn của Claude Code.
- **Mọi sản phẩm dùng file làm policy chung:** một file trên đĩa chỉ ảnh hưởng thành phần được thiết kế để đọc file đó; không tự trở thành chính sách toàn nền tảng.

### Ví dụ
Nếu backend cần nguyên tắc trả lời giống với Claude Code, ứng dụng phải quản lý phiên bản hướng dẫn và gửi nội dung thích hợp trong API request. Cần tránh gửi file nội bộ hoặc secret nếu không cần thiết.

> Xác định rõ thành phần nào đọc cấu hình: Claude Code, SDK, hay ứng dụng API tự xây; đừng giả định chúng chia sẻ môi trường tự động.`
},
{
  id: 'qz-ccaf-041',
  topic: 'claude',
  q: '[Claude Code Configuration] Every contributor should receive the same formatter automation after a matching file edit. The team wants this behavior reviewed and versioned with the repository. Where should they keep the hook configuration?',
  options: [
    'In each developer’s shell history',
    'In a project-level .claude/settings.json, with the referenced hook implementation available and reviewed',
    'Only in CLAUDE.local.md, which is automatically shared by Git',
    'In a path-scoped prose rule and assume that prose executes a formatter'
  ],
  answer: 1,
  explain: `**Đúng: đặt khai báo hook dùng chung trong project settings.** Hook là automation được Claude Code kích hoạt khi sự kiện cấu hình xảy ra; project-level {{.claude/settings.json}} là nơi team có thể version-control cấu hình chung. Phần cấu hình phải trỏ tới implementation thực sự có mặt và được review trong repository hoặc môi trường đã chuẩn bị. Cần thử matcher để chắc chắn hook chỉ chạy cho file phù hợp.

### Vì sao các lựa chọn khác sai
- **Shell history cá nhân:** không phải cấu hình được chia sẻ hay review có cấu trúc; các máy sẽ có hành vi khác nhau.
- **CLAUDE.local.md:** đây là hướng dẫn local không được xem là cấu hình team chia sẻ tự động; hơn nữa văn bản không tự thực thi formatter.
- **Rule dạng prose:** rule hướng dẫn model đọc, không phải cấu hình hook chạy chương trình khi event xảy ra.

### Khi triển khai
Review cả lệnh hook lẫn script được gọi, giới hạn quyền của script và test trên môi trường developer/CI. Đừng giả định việc commit settings tự cài được dependency hoặc bảo đảm script tồn tại ở mọi máy.

> Cấu hình được chia sẻ chỉ có ích khi implementation cũng có sẵn, có thể kiểm tra và hoạt động nhất quán.`
},
{
  id: 'qz-ccaf-042',
  topic: 'claude',
  q: '[Claude Code Configuration] A developer wants to learn what an unfamiliar Claude Code plugin adds before enabling it. Which built-in interaction is the most relevant starting point?',
  options: [
    'Use /plugin to inspect and manage Claude Code plugins, then review the source and requested capabilities',
    'Use /memory because it automatically audits all third-party executable code',
    'Use plan mode because it guarantees a plugin cannot run tools',
    'Add the plugin name to CLAUDE.md, which installs and verifies it'
  ],
  answer: 0,
  explain: `**Đúng: dùng {{/plugin}} để xem/quản lý plugin, đồng thời review nguồn.** Plugin là phần mở rộng được quản lý trong Claude Code; giao diện {{/plugin}} là điểm bắt đầu để xem và quản lý các plugin khả dụng/đã cài. Việc hiển thị trong giao diện không thay cho đánh giá nguồn gốc và nội dung. Trước khi bật, cần hiểu plugin thêm workflow hay cấu hình gì và chọn phạm vi cài đặt phù hợp.

### Vì sao các lựa chọn khác sai
- **/memory:** lệnh này phục vụ quản lý memory/hướng dẫn, không phải công cụ audit mã plugin.
- **Plan mode:** giúp lập kế hoạch, không đảm bảo rằng extension không thể thực hiện hành động hay thay thế permission controls.
- **Ghi tên vào CLAUDE.md:** chỉ tạo văn bản hướng dẫn; không cài đặt, xác thực hay kiểm tra plugin.

### Dùng trong team
Chỉ cài plugin từ nguồn được tin cậy/duyệt, xem thay đổi cấu hình và quyền liên quan, rồi thử trong môi trường an toàn. Ghi rõ ai cần plugin và ở scope nào để tránh cài rộng ngoài ý muốn.

> Giao diện quản lý cho biết cách bật/tắt; quyết định plugin có đáng tin hay không vẫn cần review nguồn và tác động.`
},
{
  id: 'qz-ccaf-043',
  topic: 'claude',
  multi: true,
  q: '[Claude Code Configuration] A team maintains both general project conventions and a detailed architecture reference that is relevant to most coding tasks. Which two practices keep the guidance maintainable without making it disappear from Claude Code context? (Choose 2)',
  options: [
    'Keep concise shared conventions in the project CLAUDE.md',
    'Put all guidance only in a local file that teammates do not receive',
    'Reference a reviewed architecture document from CLAUDE.md using the supported import mechanism',
    'Assume a filename mentioned in a prompt is automatically read',
    'Put the architecture text into permission rules so it is enforced as access control'
  ],
  answer: [0, 2],
  explain: `**Đúng: giữ quy tắc chung ngắn gọn và import tài liệu chuẩn đã review.** Project {{CLAUDE.md}} là nơi phù hợp cho hướng dẫn cần mọi contributor nhận được. Nếu có một tài liệu kiến trúc riêng, cú pháp import file được hỗ trợ giúp tránh chép cùng nội dung vào nhiều nơi và cho phép duy trì nguồn chuẩn. Import chỉ tốt khi tài liệu thực sự cần trong context, đường dẫn đúng và nội dung được kiểm tra.

### Vì sao từng lựa chọn còn lại sai
- **Chỉ để trong file local:** đồng đội clone repository không nhận được chỉ dẫn cần chia sẻ; đây là phạm vi sai.
- **Chỉ nhắc tên file:** tên trong prompt không tự đọc file; cần nội dung được nạp hoặc model được yêu cầu và có quyền đọc.
- **Đưa kiến trúc vào permission:** permission giới hạn hành động/tool; nó không phải cơ chế enforcement cho các quy tắc thiết kế trong tài liệu.

### Trade-off
Import giúp một nguồn sự thật, nhưng tài liệu nhập vào có thể làm context dài hơn. Chia tài liệu theo chủ đề, đưa nguyên tắc cốt lõi vào file gốc, và không import mọi trang thiết kế nếu task chỉ cần một phần nhỏ.

> Tài liệu chuẩn phải vừa dễ cập nhật với con người, vừa được cung cấp đúng lúc cho Claude Code.`
},
{
  id: 'qz-ccaf-044',
  topic: 'claude',
  q: '[Claude Code Configuration] A developer has conflicting instructions in the project guide and a personal preference file. Before changing priorities, they want to confirm which files Claude Code has loaded. What should they do?',
  options: [
    'Add a deny permission for every instruction that seems unfamiliar',
    'Ask Claude to ignore all project files and continue without reviewing the context',
    'Copy both files into every prompt and hope the later text wins',
    'Inspect the active memory and instruction files with /memory, then resolve the actual source and scope of the conflict'
  ],
  answer: 3,
  explain: `**Đúng: xem nguồn hướng dẫn đang hoạt động bằng {{/memory}} trước khi điều chỉnh.** Khi hai chỉ dẫn có vẻ mâu thuẫn, cần xác định chúng đến từ file nào và file đó có được nạp trong context không. {{/memory}} cho phép xem/quản lý memory và hướng dẫn liên quan trong Claude Code. Sau đó kiểm tra phạm vi project hay user và sửa ở nguồn có trách nhiệm; không nên thêm quyền hoặc lặp prompt để che mâu thuẫn.

### Vì sao các lựa chọn khác sai
- **Deny mọi thứ lạ:** permission là quyền tool, không giải quyết ưu tiên giữa hai đoạn hướng dẫn.
- **Bỏ qua toàn bộ project:** có thể làm mất quy ước build, test hoặc kiến trúc cần thiết; xử lý chọn lọc nguồn mâu thuẫn tốt hơn.
- **Chép cả hai vào prompt:** thêm bản sao làm khó biết nguồn nào đúng và không bảo đảm thứ tự giải quyết phù hợp.

### Cách phân loại
Nếu một rule chung của team xung đột với sở thích cá nhân, xác định nội dung nào thực sự cần thiết cho task và sửa scope/wording để tránh nhập nhằng. Nếu chính sách tổ chức liên quan tới bảo mật, không dùng preference cá nhân để thay thế.

> Trước khi chỉnh thứ bậc, hãy xác nhận các file thực tế được nạp; đôi khi nguyên nhân là file nằm sai vị trí chứ không phải ưu tiên sai.`
},
{
  id: 'qz-ccaf-045',
  topic: 'claude',
  q: '[Claude Code Configuration] A team moves a package-specific CLAUDE.md but developers report that its guidance no longer appears while working in that package. What should they verify first?',
  options: [
    'Whether the package path and working repository still place the file in the relevant directory hierarchy',
    'Whether every developer has copied the old file into their home directory',
    'Whether the project has enabled plan mode for every session',
    'Whether the package instructions were converted into a Bash allow rule'
  ],
  answer: 0,
  explain: `**Đúng: kiểm tra lại vị trí file và cây thư mục của project.** Hướng dẫn lồng trong {{CLAUDE.md}} có phạm vi gắn với vị trí thư mục. Khi package được di chuyển, file có thể không còn nằm trong nhánh mà Claude Code đang làm việc; vì vậy Claude không nhận được hướng dẫn ở vị trí mới như mong đợi. Xác nhận repository/working directory và đặt file tại cây thư mục phù hợp trước khi thay đổi nội dung.

### Vì sao các lựa chọn khác sai
- **Chép vào home của từng người:** làm mất tính chia sẻ và tạo nhiều bản riêng, trong khi đây là hướng dẫn gắn với package trong repo.
- **Bật plan mode:** plan mode ảnh hưởng cách Claude tiếp cận công việc, không quyết định file hướng dẫn nào được phát hiện.
- **Chuyển thành Bash allow rule:** quyền shell không biểu đạt quy ước package và không thay thế chỉ dẫn bằng văn bản.

### Kiểm tra sau khi sửa
Mở một tác vụ thực sự trong thư mục package, xem các file hướng dẫn đã được nhận diện và xác minh nội dung còn đúng sau khi di chuyển. Nếu nhiều package dùng cùng quy tắc, cân nhắc một cơ chế shared rule thay vì sao chép lệch nhau.

> Sau refactor thư mục, cập nhật cả import path, scoped rules và nested instructions; đường dẫn cũ thường tạo lỗi cấu hình âm thầm.`
},
{
  id: 'qz-ccaf-046',
  topic: 'claude',
  q: '[Claude Code Configuration] A team uses Claude Code on a repository that contains production deployment scripts. Developers still need normal commands such as tests and builds. Which permission setup is the safest starting point?',
  options: [
    'Allow all shell commands silently because developers review Claude output afterward',
    'Run read-only commands automatically, but ask before commands that change systems or delete data, and deny the most destructive ones',
    'Put "ask before production commands" in CLAUDE.md and leave all shell permissions unrestricted',
    'Disable all shell automation and run every command manually'
  ],
  answer: 1,
  explain: `**Đúng: cặn kèm quyền cho lệnh phá hủy, chỉ cho phép lệnh cần thiết.** Permission rule trong {{settings.json}} quyết định công cụ nào được chạy tự động, hỏi hay từ chối. Cho phép lệnh chỉ đọc chạy tự động nhưng hỏi trước khi chạy lệnh thay đổi hệ thống hoặc xóa dữ liệu, đồng thời từ chối những lệnh phá hủy nhất, là nguyên tắc quyền tối thiểu: chỉ cấp đủ để làm việc và hạn chế thiệt hại nếu prompt sai hoặc tệp bị thay đổi.

### Vì sao các lựa chọn khác sai
- **Cho phép mọi lệnh shell im lặng:** một lỗi trong prompt hoặc tệp bị thay đổi có thể dẫn đến lệnh nguy hiểm chạy ngoài ý định; xem xét sau khi chạy không ngăn thiệt hại đã xảy ra.
- **Chỉ ghi nhắc vào CLAUDE.md:** văn bản hướng dẫn không ép engine quyền; Claude vẫn có thể quên và chạy lệnh phá hủy.
- **Tắt hoàn toàn tự động hóa shell:** làm mất khả năng hợp lý như chạy test và build, và không phân biệt lệnh an toàn với lệnh nguy hiểm.

> Thuật ngữ: "permission allow/deny/ask" là danh sách cho phép, từ chối hoặc hỏi trước khi chạy công cụ theo cấu hình. Kiểm thử quy tắc deny trên môi trường thử trước khi áp dụng trong production.`
},
{
  id: 'qz-ccaf-047',
  topic: 'claude',
  q: '[Claude Code Configuration] In a long Claude Code session, the model starts forgetting instructions given at the beginning. What should the team do?',
  options: [
    'Keep repeating the same instructions in every message so the model cannot forget',
    'Assume context is unlimited and continue without changes',
    'Save important decisions and conventions into project CLAUDE.md, or start a new session with a concise summary, instead of relying on memory',
    'Put all past conversation into permission rules so it is always remembered'
  ],
  answer: 2,
  explain: `**Đúng: ghi quyết định quan trọng vào CLAUDE.md hoặc mở phiên mới với bản tóm tắt.** Ngữ cảnh của một phiên không phải vô hạn; khi quá dài, mô hình có thể quên hướng dẫn ban đầu. Lưu quy ước và quyết định kiến trúc vào {{CLAUDE.md}} (được nạp mỗi phiên) hoặc bắt đầu phiên mới với bản tóm tắt ngắn giúp tính nhất quán mà không dựa vào trí nhớ mô hình.

### Vì sao các lựa chọn khác sai
- **Lặp lại mọi tin nhắn:** làm context dài hơn mà không giải quyết gốc rễ, và vẫn có thể bỏ sót hướng dẫn quan trọng.
- **Giả định ngữ cảnh không giới hạn:** ngữ cảnh có kích thước giới hạn; khi vượt quá, đoạn đầu sẽ bị lược bỏ.
- **Đưa cuộc trò chuyện vào permission rules:** permission kiểm soát hành động công cụ, không lưu lịch hội thoại.

> Thuật ngữ: ngữ cảnh (context) là phần nội dung mô hình đọc khi trả lời; nó bị giới hạn kích thước, nên hãy trích yếu vào tệp hướng dẫn thay vì nhớ tất cả trong cuộc trò chuyện.`
},
{
  id: 'qz-ccaf-048',
  topic: 'claude',
  q: '[Claude Code Configuration] A post-edit hook that runs a formatter sometimes fails due to an environment issue. The team wants edits to keep flowing. Which handling is safer?',
  options: [
    'Treat a hook error as success so edits are never blocked',
    'Remove the hook entirely and rely on the model to remember formatting',
    'Run the hook after every tool call so it eventually catches everything',
    'Let the hook fail closed: surface the error, require the team to fix or explicitly bypass the hook, and do not silently skip the check'
  ],
  answer: 3,
  explain: `**Đúng: khi hook lỗi thì giữ trạng thái hạn chế, không thụt lỡ.** Hook là tự động hóa gắn với sự kiện công cụ. Nếu bỏ qua lỗi hook một cách im lặng, kiểm định như định dạng hay quét bảo mật sẽ không bao giờ chạy thực sự và các vấn đề sẽ lọt qua. Gặp lỗi, hãy hiện thông báo, sửa môi trường hoặc chọn bỏ qua có ý thức thay vì giả thành công.

### Vì sao các lựa chọn khác sai
- **Xem lỗi hook thành thành công:** che giấu việc kiểm định không chạy; lỗi sẽ được phát hiện muộn hơn.
- **Gỡ hook hoàn toàn:** mất tự động hóa cần thiết và còn phụ thuộc trí nhớ của mô hình.
- **Chạy hook sau mọi công cụ:** hook chạy quá thường xuyên làm chậm hệ thống, không phải cách sửa lỗi môi trường.

> Thuật ngữ: "fail closed" là khi xảy ra lỗi hoặc không rõ ràng, giữ trạng thái hạn chế/an toàn thay vì tự mở. Ghi log đủ để sửa hook, nhưng tránh in bí mật vào log hook.`
},
{
  id: 'qz-ccaf-049',
  topic: 'claude',
  q: '[Claude Code Configuration] Two developers use separate Claude Code sessions to edit the same source file at the same time. What is the main risk and the best way to handle it?',
  options: [
    'Both sessions may overwrite each other; serialize work, review diffs, and communicate before editing shared files',
    'Claude Code automatically merges edits from both sessions, so no coordination is needed',
    'Ask the second Claude session to ignore the first session changes automatically',
    'Put the file into CLAUDE.local.md so only one developer can edit it'
  ],
  answer: 0,
  explain: `**Đúng: hai phiên có thể ghi đè lẫn nhau.** Mỗi phiên Claude Code có ngữ cảnh riêng và không khóa tệp cho phiên khác. Nếu hai người chỉnh sửa cùng tệp, bản lưu sau có thể làm mất chỉnh sửa trước. Cách an toàn là tuần tự hóa công việc, xem xét diff trước khi đồng bộ và giao tiếp trước khi sửa tệp chung.

### Vì sao các lựa chọn khác sai
- **Gộp tự động:** Claude Code không tự động hợp nhất chỉnh sửa từ nhiều phiên; người dùng phải tự xử lý xung đột.
- **Bỏ qua phiên trước:** không có cơ chế tự động biết phiên khác đã đổi gì, nên có thể ghi đè không hay biết.
- **CLAUDE.local.md:** đây là tệp hướng dẫn local, không phải cơ chế khóa tệp hay phân quyền chỉnh sửa.

> Xem xét diff sau mỗi lần Claude Code sửa tệp được chia sẻ, và ưu tiên làm việc tuần tự trên cùng một tệp quan trọng.`
},
{
  id: 'qz-ccaf-050',
  topic: 'claude',
  q: '[Claude Code Configuration] A team wants Claude Code to spend more analysis effort on complex architecture changes but less on simple formatting tasks. Which guideline fits best?',
  options: [
    'Use maximum analysis effort for every task, simple or complex, so nothing is missed',
    'Disable analysis entirely and let Claude reply immediately for all tasks',
    'Match analysis effort to task complexity: deeper analysis for architecture and security decisions, lighter effort for routine formatting',
    'Ask the model to promise it analyzed deeply before every answer'
  ],
  answer: 2,
  explain: `**Đúng: căn chỉnh công sức phân tích với độ phức tạp của tác vụ.** Quyết định kiến trúc và bảo mật có chi phí sai lầm cao, nên dành thời gian phân tích nhiều hơn (xem xét phụ thuộc, kịch bản lỗi, phương án thay thế); công việc định dạng thường ngày không cần phân tích sâu. Cách này cân bằng chất lượng với thời gian và chi phí chạy mô hình.

### Vì sao các lựa chọn khác sai
- **Tối đa phân tích mọi tác vụ:** tốn tài nguyên và làm chậm những việc đơn giản mà không mang lại lợi ích thực.
- **Tắt hoàn toàn phân tích:** bỏ qua việc xem xét rủi ro đối với quyết định quan trọng.
- **Hứa hẹn phân tích sâu:** lời cam kết của mô hình không phải bằng chứng việc nó đã xem xét kỹ đúng chủ đề nào.

> Đánh giá mức độ phức tạp trước khi chọn cách dùng Claude Code: thiết kế hệ thống cần phân tích sâu, sửa lỗi chữ thì không cần.`
},
{
  id: 'qz-ccaf-051',
  topic: 'claude',
  q: '[Claude Code Configuration] A developer wants Claude Code to use an API key by pasting it into CLAUDE.md so the model can read it. Which practice is safer?',
  options: [
    'Paste the API key into CLAUDE.md because instruction files are only read by Claude Code',
    'Put the key in settings.json because settings files are secret by default',
    'Send the key in every user message so Claude does not need to store it',
    'Store the key outside instruction files, for example in environment variables or a secret manager, and let the runtime supply it'
  ],
  answer: 3,
  explain: `**Đúng: không để bí mật trong tệp hướng dẫn.** {{CLAUDE.md}} là tệp văn bản có thể được commit, chia sẻ và đưa vào ngữ cảnh mô hình — không phải kho bí mật. API key nên nằm trong biến môi trường hoặc secret manager, và môi trường chạy sẽ cung cấp khóa khi cần, không qua tệp hướng dẫn.

### Vì sao các lựa chọn khác sai
- **Ghi key vào CLAUDE.md:** bất kỳ ai đọc repository có thể thấy khóa; khóa còn có thể tồn tại trong lịch sử Git sau khi xóa khỏi phiên bản mới.
- **settings.json không phải nơi chứa secret:** file settings cấu hình công cụ và quyền, không tự được mã hóa hay coi là kho bí mật.
- **Gửi key trong mọi tin nhắn:** khóa sẽ bị lưu trong lịch hội thoại và có thể rò rỉ qua các phiên khác.

> Mọi khóa API, token hoặc mật khẩu nên được cung cấp bằng môi trường chạy hoặc secret store; đừng để chúng trong CLAUDE.md, settings hay prompt.`
},
{
  id: 'qz-ccaf-052',
  topic: 'claude',
  multi: true,
  q: '[Claude Code Configuration] A CI job uses Claude Code to create a branch and push changes. Which two controls reduce risk the most? (Choose 2)',
  options: [
    'Run the CI job with the default branch broad credentials so nothing is blocked',
    'Use an isolated runner with no unnecessary secrets',
    'Grant only the narrow permissions the CI job actually needs, using a short-lived token',
    'Trust repository instructions because they are part of the checked-out project'
  ],
  answer: [1, 2],
  explain: `**Đúng: cô lập môi trường và cấp quyền tối thiểu.** Pull request không tin cậy có thể sửa script, hook hoặc cấu hình trong repository. Runner cô lập không chứa secret không cần thiết và token thời gian ngắn với quyền chỉ đủ nhu cầu làm hạn chế thiệt hại nếu nội dung độc hại được xử lý. JSON trả về chỉ là định dạng, không chứng minh code an toàn.

### Vì sao từng lựa chọn còn lại sai
- **Credential rộng của nhánh mặc định:** mã do PR kiểm soát có thể tìm cách lấy credential; vi phạm nguyên tắc quyền tối thiểu.
- **Tin toàn bộ hướng dẫn trong repo:** contributor bên ngoài có thể thay đổi nội dung repository; không đưa dữ liệu không tin cậy lên mức chính sách đáng tin cậy.

> Thiết kế đầu ra có thể parse bởi máy nhưng vẫn validate nội dung trước khi gộp; kết hợp với runner ephemeral và không cho phép thao tác ghi hay triển khai từ PR.`
},
{
  id: 'qz-ccaf-053',
  topic: 'claude',
  multi: true,
  q: '[Claude Code Configuration] After an incident where Claude Code edited several files, the team wants to audit what actually happened. Which two actions help? (Choose 2)',
  options: [
    'Review the session transcript and tool-call log to see which files were read or edited',
    'Trust Claude summary that no important files were changed',
    'Redact secrets before sharing logs or transcripts with others outside the team',
    'Assume the transcript contains every system event outside Claude Code'
  ],
  answer: [0, 2],
  explain: `**Đúng: kiểm tra nhật ký công cụ và giấu bí mật trước khi chia sẻ.** Cuộc hội thoại và nhật ký lệnh công cụ trong Claude Code ghi lại các tệp được đọc, chỉnh sửa và lệnh shell đã chạy; đây là bằng chứng thực tế để điều tra sự cố, thay vì chỉ dựa vào lời tóm tắt của mô hình. Nhật ký có thể chứa khóa API hoặc dữ liệu nhạy cảm, nên giấu hoặc loại bỏ chúng trước khi gửi cho bên ngoài nhóm.

### Vì sao từng lựa chọn còn lại sai
- **Tin tóm tắt của Claude:** mô hình có thể bỏ sót hoặc mô tả lại không chính xác; nhật ký công cụ là nguồn bằng chứng trực tiếp hơn.
- **Giả định transcript chứa mọi sự kiện hệ thống:** transcript chỉ ghi tương tác trong Claude Code, không phải tất cả sự kiện của máy chủ hay cơ sở dữ liệu bên ngoài.

> Sau sự cố, diff của repository kết hợp với nhật ký công cụ giúp xác định chính xác thay đổi nào đến từ Claude Code.`
},
{
  id: 'qz-ccaf-054',
  topic: 'claude',
  multi: true,
  q: '[Claude Code Configuration] A CI job runs Claude Code non-interactively and needs an API credential. Which two choices are safer? (Choose 2)',
  options: [
    'Provide the credential through a protected CI secret or environment variable, never hard-coded in the script',
    'Hard-code the API key in the prompt so Claude can authenticate itself automatically',
    'Store the key in CLAUDE.md so all CI runs can read it',
    'Rotate the credential and restrict its scope to what CI actually needs'
  ],
  answer: [0, 3],
  explain: `**Đúng: cung cấp credential qua secret/CI env và xoay vòng, giới hạn phạm vi.** API key cho Claude Code không nên được viết cứng vào script hay để trong {{CLAUDE.md}}; biến môi trường hoặc secret store được bảo vệ của hệ thống CI là nơi phù hợp, và credential chỉ nên có quyền cần đúng cho công việc CI.

### Vì sao từng lựa chọn còn lại sai
- **Viết cứng key vào prompt:** key sẽ được lưu trong log và lịch hội thoại, dễ bị lộ.
- **Lưu key vào {{CLAUDE.md}}:** tệp hướng dẫn không phải kho bí mật và có thể được commit hoặc đưa vào ngữ cảnh mô hình.

> Credential của CI nên có thời gian tồn tại ngắn và chỉ được cấp quyền cần tối thiểu cho công việc triển khai.`
},
{
  id: 'qz-ccaf-055',
  topic: 'claude',
  multi: true,
  q: '[Claude Code Configuration] A team wants to add an MCP server that provides several tools, but not all tools are needed. Which two choices fit best? (Choose 2)',
  options: [
    'Review which tools the MCP server exposes and enable only the tools the workflow needs',
    'Commit the server access token inside .mcp.json so every teammate can connect',
    'Provide credentials through an approved runtime environment or secret store, not through Git',
    'Define the server in one developer home directory and assume Git distributes it'
  ],
  answer: [0, 2],
  explain: `**Đúng: xem xét công cụ MCP và để credential ngoài Git.** MCP cho phép Claude Code kết nối đến server cung cấp công cụ hoặc dữ liệu. File {{.mcp.json}} trong repository chia sẻ khai báo kết nối, nhưng không nên chứa giá trị credential thật; credential nên do môi trường chạy hoặc secret store đã phê duyệt cung cấp. Review công cụ server hiển thị để chỉ kích hoạt công cụ thực sự cần thiết.

### Vì sao từng lựa chọn còn lại sai
- **Commit token vào .mcp.json:** bất kỳ ai đọc repository có thể lấy token; giá trị còn có thể còn tồn tại trong lịch sử Git.
- **Cấu hình trong thư mục nhà của một người:** chỉ người đó nhận cấu hình; đồng nghiệp clone repository không tự động có nó.

> Hãy review {{.mcp.json}} như cấu hình thực thi: chỉ khai báo server cần thiết và không để token thật lọt vào diff.`
},
);
