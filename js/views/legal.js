/* View "legal" — owner: task T34. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';

  var UPDATED = '22/10/2026';
  var REPO = 'https://github.com/ducmanh2802/senior-java';
  var ISSUES = 'https://github.com/ducmanh2802/senior-java/issues';

  function h(s) { return App.esc(s); }

  /* ---------- static page content ---------- */

  var PRIVACY_BODY =
    '<h2>Tóm tắt nhanh</h2>' +
    '<ul>' +
    '<li>Không đăng nhập: toàn bộ tiến độ học nằm trong <code>localStorage</code> của trình duyệt bạn, không gửi đi đâu cả.</li>' +
    '<li>Đăng nhập: dữ liệu nằm trong database Supabase; mỗi tài khoản chỉ đọc/ghi được dữ liệu của chính mình.</li>' +
    '<li>AI chấm điểm: câu trả lời và code được gửi tới server của app rồi tới API của Anthropic (Claude) để chấm.</li>' +
    '<li>Chạy code: code Java được gửi tới Judge0 để biên dịch và chạy.</li>' +
    '<li>Không bán dữ liệu, không quảng cáo, không cookie theo dõi của bên thứ ba.</li>' +
    '</ul>' +

    '<h2>Dữ liệu khi không đăng nhập</h2>' +
    '<p>App không bắt buộc tạo tài khoản. Tiến độ học (câu hỏi đã tự chấm, flashcard, kết quả trắc nghiệm, phỏng vấn thử, thuật toán, lộ trình 26 tuần), giao diện sáng/tối và mật mã truy cập AI đều được lưu trong <code>localStorage</code> của chính trình duyệt (các key <code>sjp.v1</code> và <code>sjp.passcode</code>). Mọi thứ chỉ tồn tại trên máy bạn — app không gửi đi đâu.</p>' +
    '<ul>' +
    '<li>Đổi máy, đổi trình duyệt hoặc dọn dẹp dữ liệu duyệt web là mất tiến độ. Hãy dùng <b>Xuất tiến độ</b> ở footer để sao lưu ra file JSON và <b>Nhập tiến độ</b> để khôi phục.</li>' +
    '<li>Xoá mọi thứ: nút <b>Xoá tiến độ</b> ở footer, hoặc xoá dữ liệu trang này trong phần cài đặt của trình duyệt.</li>' +
    '</ul>' +

    '<h2>Dữ liệu khi đăng nhập</h2>' +
    '<p>Đăng nhập qua Google hoặc email (magic link) sẽ tạo tài khoản để đồng bộ tiến độ và chia sẻ hạn mức AI. App lưu:</p>' +
    '<div class="table-wrap"><table>' +
    '<thead><tr><th>Dữ liệu</th><th>Nội dung</th></tr></thead><tbody>' +
    '<tr><td>Hồ sơ</td><td>    Email, tên, avatar lấy từ Google khi đăng nhập; tên hiển thị (bạn tự sửa được trên trang #/account), vai trò và hạn mức AI mỗi ngày (mặc định 10 lượt, chỉ server sửa được).</td></tr>' +
    '<tr><td>Tiến độ học</td><td><code>user_state</code>: một bản JSON giống hệt file "Xuất tiến độ", được đồng bộ lên cloud.</td></tr>' +
    '<tr><td>Lượt dùng AI</td><td><code>ai_usage</code>: tổng số lượt gọi AI mỗi ngày, theo từng loại (chấm câu hỏi, review code, chạy code, phỏng vấn AI). Chỉ dùng để đếm hạn mức.</td></tr>' +
    '</tbody></table></div>' +
    '<p>Database là <b>Supabase</b> (PostgreSQL). Mọi bảng bật Row Level Security: tài khoản chỉ đọc/ghi được đúng hàng của mình, không đụng được tới dữ liệu người khác. Số lượt dùng AI và vai trò chỉ server ghi — tài khoản không thể tự tăng hạn mức của mình.</p>' +

    '<h2>AI chấm điểm và chạy code</h2>' +
    '<p>Khi bạn bấm <b>AI chấm</b> / <b>AI review</b>, app gửi lên server <code>/api/grade</code> trên Vercel chứa: câu hỏi, đáp án mẫu của app, câu trả lời hoặc code của bạn (tối đa vài nghìn ký tự), các lượt đào sâu trước đó (nếu có) và một số số liệu giọng nói (thời lượng, số từ, tốc độ, từ đệm — nếu dùng micro). Server sau đó gọi API của <b>Anthropic (Claude)</b> để chấm. Theo chính sách API của Anthropic, dữ liệu gửi qua API <b>không được dùng để huấn luyện mô hình</b> (mặc định): xem chi tiết tại ' +
    '<a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer">anthropic.com/legal/privacy</a>.</p>' +
    '<p>Khi bạn bấm <b>Chạy code</b>, mã nguồn Java (ghép với test harness có sẵn của bài) được gửi tới <b>Judge0 CE</b> qua server của app để biên dịch và chạy, giới hạn 5 giây CPU / 256 MB; stdout, stderr và lỗi biên dịch được trả về để hiển thị.</p>' +
    '<p>Khi bạn dùng <b>Phỏng vấn AI</b>, mỗi lượt app gửi tới <code>/api/interview</code>: cấu hình buổi phỏng vấn (ngôn ngữ, level, thời lượng, chủ đề hoặc công ty), toàn bộ transcript hội thoại đến thời điểm đó và tối đa 12 câu hỏi gợi ý lấy từ ngân hàng câu hỏi; server gọi Claude để sinh lượt hỏi tiếp theo và bản đánh giá cuối buổi. Transcript chỉ được lưu trong trình duyệt của bạn (và lịch sử phỏng vấn thử nếu bạn đăng nhập), server không lưu lại.</p>' +
    '<blockquote>Để dùng AI, bạn cần <b>đăng nhập</b>: trình duyệt gửi kèm token phiên đăng nhập, server kiểm tra token với Supabase và trừ 1 lượt trong <b>hạn mức mỗi ngày</b> của tài khoản (một buổi Phỏng vấn AI chỉ tính 1 lượt). Chủ site có thêm một <b>mật mã quản trị</b> (biến môi trường APP_PASSCODE) để dùng không giới hạn. Server cũng giới hạn tần suất gọi theo IP.</blockquote>' +

    '<h2>Giọng nói</h2>' +
    '<p>Nút micro dùng <b>Web Speech API</b> có sẵn trong trình duyệt. Ở Chrome/Edge, trình duyệt của bạn sẽ gửi âm thanh tới dịch vụ nhận dạng giọng nói của Google hoặc Microsoft để chuyển thành chữ — điều này nằm ngoài kiểm soát của app. Bản thân app <b>không ghi âm và không lưu file âm thanh nào</b>. Chỉ văn bản cuối cùng và một vài số liệu (thời lượng, số từ, tốc độ, từ đệm) được tính, và chỉ được gửi kèm lời trả lời đi chấm khi bạn bấm nút chấm điểm.</p>' +

    '<h2>Nơi chạy và lưu trữ</h2>' +
    '<ul>' +
    '<li>Site tĩnh chạy trên <b>Vercel</b>; các hàm API (chấm AI, chạy code) cũng chạy trên Vercel.</li>' +
    '<li>Database <b>Supabase</b> (PostgreSQL), hệ thống login của Supabase.</li>' +
    '<li>Dịch vụ bên thứ ba duy nhất khi không dùng AI là font chữ (Be Vietnam Pro, JetBrains Mono tải từ Google Fonts — trình duyệt thay bạn tải font). Không có script tracking, không cookie theo dõi, không analytics.</li>' +
    '</ul>' +

    '<h2>Quyền của bạn</h2>' +
    '<ul>' +
    '<li><b>Tải toàn bộ dữ liệu</b> ra file JSON: tại trang <a href="#/account">#/account</a>, nút "Tải dữ liệu của tôi" (gồm cả dữ liệu local và cloud).</li>' +
    '<li><b>Xoá tài khoản</b> cùng toàn bộ dữ liệu trên cloud: tại <a href="#/account">#/account</a>, yêu cầu xác nhận hai bước.</li>' +
    '<li>Dữ liệu không đăng nhập: xoá bằng nút "Xoá tiến độ" ở footer của mọi trang.</li>' +
    '<li>Câu hỏi về quyền riêng tư: tạo issue tại ' + ISSUES + '.</li>' +
    '</ul>';

  var TERMS_BODY =
    '<h2>1. Mục đích sử dụng</h2>' +
    '<p>Senior Java Prep (gọi tắt là "app") làm sẵn cho bạn để <b>học và ôn luyện cá nhân</b>. Bạn có thể dùng tự do cho bản thân: học offline, xuất/nhập tiến độ, dùng sandbox thuật toán. Ứng dụng được cung cấp "nguyên trạng" (as-is).</p>' +

    '<h2>2. Độ chính xác của nội dung</h2>' +
    '<p>Câu hỏi, đáp án, trắc nghiệm, gợi ý thuật toán… chỉ nhằm mục đích học, có thể sai hoặc lỗi thời (mặc dù được review và kiểm chứng thực tế — xem trang <a href="#/legal/about">Giới thiệu</a> để biết nội dung được tạo ra như thế nào). Hãy luôn kiểm chứng với tài liệu chính thức trước khi áp dụng mạnh tay vào công việc hay phỏng vấn thật. Nếu thấy sai, hãy tạo issue giúp app tốt hơn: ' + h(ISSUES) + '</p>' +

    '<h2>3. Thông tin công ty</h2>' +
    '<p>Trang <a href="#/companies">Công ty</a> tổng hợp thông tin (định hướng phỏng vấn, các vòng, mức lương…) từ <b>nguồn công khai</b>, có ghi nguồn ở cuối mỗi trang. Thông tin thay đổi theo thời gian, nên luôn kiểm tra lại với nguồn gốc. Nếu bạn là chủ sở hữu hay đại diện hợp pháp của công ty được nhắc và muốn gỡ hoặc sửa một phần nào, tạo issue tại ' + h(ISSUES) + ' — sẽ được xử lý kịp thời.</p>' +

    '<h2>4. Hạn mức AI và quy tắc dùng dịch vụ AI</h2>' +
    '<ul>' +
    '<li>Chấm bằng AI miễn phí có <b>hạn mức mỗi ngày</b> (mặc định 10 lượt, đếm theo tài khoản). Hạn mức có thể thay đổi hoặc dịch vụ tạm dừng bất cứ lúc nào.</li>' +
    '<li>Tính năng AI yêu cầu đăng nhập; mỗi tài khoản có hạn mức riêng. Mỗi người dùng một tài khoản của chính mình.</li>' +
    '<li>Cấm: dùng bot / script tự động gọi API, cố gắng vượt hạn mức (ví dụ tạo nhiều tài khoản), chia sẻ tài khoản, hoặc gửi nội dung trái pháp luật / nội dung không phải dạng câu trả lời phỏng vấn. Vi phạm có thể bị thu hồi quyền truy cập.</li>' +
    '</ul>' +

    '<h2>5. Không bảo đảm kết quả phỏng vấn</h2>' +
    '<p>Điểm AI (1–5) là ước lượng theo thang rubric của app, không phải đánh giá chính thức từ bất kỳ công ty nào. App không hợp tác với các ngân hàng / fintech / big tech nào được nhắc trên trang Công ty, và không cam kết bạn sẽ đậu hay nhận được lời mời. Kết quả vẫn phụ thuộc vào kiến thức của bạn và cách trình bày trong phòng phỏng vấn.</p>' +

    '<h2>6. Thay đổi điều khoản</h2>' +
    '<p>Điều khoản có thể được cập nhật; thay đổi được công bố trực tiếp trên chính trang này. Ngày cập nhật mới nhất ở đầu các trang.</p>';

  function aboutBody() {
    var nQ = App.questions().length;
    var nQz = App.quiz().length;
    var nA = App.algos().length;
    var nT = App.topics().length;
    return '' +
      '<h2>App là gì, dành cho ai</h2>' +
      '<p><b>Senior Java Prep</b> là một web app tĩnh giúp bạn ôn luyện phỏng vấn Senior Java Backend: Java core, concurrent / JVM, Spring & database, microservices, system design, AWS, kỹ năng mềm và cách nói khi phỏng vấn. Xây dựng cho dev Java có 4–8 năm kinh nghiệm chuẩn bị vòng phỏng vấn Senior / Lead / Architect tại các ngân hàng, fintech, big tech Việt Nam.</p>' +
      '<p>Miễn phí, chạy ngay trong trình duyệt, không cần tạo tài khoản (chỉ cần tài khoản nếu bạn muốn đồng bộ tiến độ cloud và chia sẻ hạn mức AI).</p>' +

      '<h2>Tính năng chính</h2>' +
      '<ul>' +
      '<li><b>Tổng quan</b> hôm nay: câu đến hạn ôn, tiến độ, streak và kế hoạch.</li>' +
      '<li><b>Lộ trình</b> 26 tuần kèm nhật ký học từng ngày.</li>' +
      '<li><b>Ngân hàng câu hỏi</b>: ' + nQ + ' câu tự luận cho ' + nT + ' chủ đề, đáp án mẫu chi tiết và lặp lại theo spaced repetition.</li>' +
      '<li><b>Flashcard</b> và <b>trắc nghiệm</b> (' + nQz + ' câu) để tự kiểm tra nhanh.</li>' +
      '<li><b>Thuật toán</b>: ' + nA + ' bài kèm gợi ý từng bước, editor Java chạy được trên Judge0, và AI review.</li>' +
      '<li><b>Phỏng vấn thử</b>: preset các vòng, bấm giờ, ghi chú, luyện nói với nhận dạng giọng nói và AI chấm.</li>' +
      '<li><b>Phỏng vấn AI</b>: hội thoại liên tục bằng giọng nói với interviewer AI, hỏi đào sâu theo câu trả lời của bạn, chấm và nhận xét cuối buổi.</li>' +
      '<li><b>Công ty</b>: thông tin tổng hợp từ nguồn công khai về định hướng phỏng vấn từng ngân hàng / fintech / big tech.</li>' +
      '<li><b>Debug lab</b>: cho bạn một đợt sự cố production mô phỏng — đọc dump jstack, GC log, EXPLAIN plan thật để suy luận nguyên nhân gốc; AI chấm phân tích theo rubric.</li>' +
      '<li><b>Tài khoản</b>: đăng ký/đăng nhập qua Supabase, đồng bộ tiến độ cloud, bạn có thể tải toàn bộ dữ liệu về máy bất cứ lúc nào.</li>' +
      '</ul>' +

      '<h2>Nội dung được tạo ra như thế nào</h2>' +
      '<p>Mỗi câu hỏi và đáp án được <b>agent AI viết</b> theo outline chi tiết của người chủ repo, sau đó được một <b>AI khác (Claude) fact-check</b> từng câu dựa trên Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL và AWS hiện hành, sửa API bịa, số liệu sai và đoạn văn lỗi trước khi đưa lên web. Validator tự động kiểm tra định dạng của mọi câu. Dù vậy, sai sót vẫn có thể sót lại — nếu bạn phát hiện chỗ nào sai, hãy cho repo biết bằng cách tạo issue.</p>' +

      '<h2>Mã nguồn & liên hệ</h2>' +
      '<ul>' +
      '<li>Mã nguồn công khai: <a href="' + h(REPO) + '" target="_blank" rel="noopener noreferrer">github.com/ducmanh2802/senior-java</a></li>' +
      '<li>Báo lỗi, tính năng đề xuất hoặc yêu cầu gỡ nội dung: <a href="' + h(ISSUES) + '" target="_blank" rel="noopener noreferrer">tạo issue trên GitHub</a></li>' +
      '</ul>';
  }

  var PAGES = [
    { id: 'about', tab: 'Giới thiệu', h1: 'Về Senior Java Prep', lead: 'App ôn luyện phỏng vấn miễn phí, chạy ngay trong trình duyệt.' },
    { id: 'privacy', tab: 'Quyền riêng tư', h1: 'Quyền riêng tư', lead: 'Nói đúng những gì app thật sự làm — không che giấu, không câu chữ pháp lý rườm rà.' },
    { id: 'terms', tab: 'Điều khoản', h1: 'Điều khoản sử dụng', lead: 'Vài quy tắc ngắn gọn khi dùng app.' },
  ];
  function bodyFor(id) {
    if (id === 'privacy') return PRIVACY_BODY;
    if (id === 'terms') return TERMS_BODY;
    return aboutBody();
  }

  function renderTabBar(current) {
    return '<nav class="chips lg-tabs" aria-label="Trang quyền riêng tư / điều khoản">' +
      PAGES.map(function (p, i) {
        var active = p.id === current;
        return '<a class="chip' + (active ? ' active' : '') + '" href="#/legal/' + p.id + '"' +
          (active ? ' aria-current="page"' : '') +
          '><kbd>' + (i + 1) + '</kbd> ' + h(p.tab) + '</a>';
      }).join('') + '</nav>';
  }

  function renderPage(root, page) {
    var title = page.h1 + ' · Senior Java Prep';
    document.title = title;
    root.innerHTML =
      '<div class="page-head"><div><h1>' + h(page.h1) + '</h1><p>' + h(page.lead) + '</p></div></div>' +
      renderTabBar(page.id) +
      '<article class="card legal-doc md" lang="vi">' +
      '<p class="lg-updated">Cập nhật lần cuối: <b>' + h(UPDATED) + '</b></p>' +
      bodyFor(page.id) +
      '</article>' +
      '<p class="lg-hint">Phím tắt: <kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd> để đổi trang.</p>';
  }

  App.registerView('legal', {
    // Tiêu đề từng trang được đặt riêng trong render, nên không khai title chung ở đây.
    render(root, params) {
      var id = params && params.length ? params[0] : 'about';
      var page = PAGES.find(function (p) { return p.id === id; });
      if (!page) page = PAGES[0];
      renderPage(root, page);
      // Phím tắt 1/2/3 đổi trang; cleanup gỡ handler khi rời view.
      return App.onKey(function (e) {
        var i = ['1', '2', '3'].indexOf(e.key);
        if (i >= 0 && PAGES[i] && PAGES[i].id !== page.id) App.navigate('#/legal/' + PAGES[i].id);
      });
    },
  });
})();
