/*
 * Topic frontend (Vue 3 / JavaScript / TypeScript cho dev Java fullstack). Schema: AGENTS.md muc 4.
 */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'frontend-001',
  topic: 'frontend',
  level: 'senior',
  q: 'JavaScript là single-threaded, event loop xử lý bất đồng bộ như thế nào? Phân biệt microtask (Promise) và macrotask (setTimeout).',
  a: `**Tóm tắt:** JavaScript chỉ chạy trên một luồng chính. Khi cần chờ (timer, mạng, I/O) công việc được đẩy vào hàng đợi, event loop lấy từng việc chạy xong rồi mới lấy việc tiếp theo. Microtask (Promise) được ưu tiên chạy trước macrotask (setTimeout, setInterval, sự kiện trình duyệt).

### Cơ chế bên trong, từng bước
1. JS đọc code trên luồng chính, chạy các dòng đồng bộ ngay lập tức.
2. Khi gặp setTimeout hay fetch, trình duyệt nhận yêu cầu, giải phóng luồng JS, và hẹn chạy callback sau khi xong.
3. Callback được đẩy vào hàng đợi macrotask.
4. Khi một Promise hoàn thành, callback .then được đẩy vào hàng đợi microtask.
5. Event loop: chạy xong task hiện tại -> lấy tất cả microtask chạy hết -> vẽ lại giao diện (nếu có) -> lấy một macrotask tiếp theo -> lặp lại.

Vì chỉ có 1 luồng, JS giống một trình xử lý đơn luồng trong Java (single-threaded Executor), nhưng không cần pool luồng.

### Ví dụ code
~~~text
console.log('A: đồng bộ');

setTimeout(function () {
  console.log('B: macrotask setTimeout');
}, 0);

Promise.resolve().then(function () {
  console.log('C: microtask Promise');
});

console.log('D: đồng bộ kết thúc');
~~~

Thứ tự in ra: A, D, C, B.
Giải thích: A và D chạy ngay. C là microtask, chạy sau D nhưng trước B. B là macrotask, chờ lượt sau của event loop.

### So sánh microtask và macrotask
| Thuộc tính | Microtask | Macrotask |
|---|---|---|
| Nguồn phổ biến | Promise.then, await, queueMicrotask | setTimeout, setInterval, sự kiện click, I/O |
| Khi chạy | Hết task hiện tại, trước khi vẽ lại giao diện | Mỗi lượt mới của event loop |
| Ưu tiên | Cao hơn macrotask | Thấp hơn microtask |

### Lỗi hay gặp
- Vòng microtask vô hạn: Promise liên tục tạo Promise mới làm event loop không kịp vẽ giao diện, trang treo.
- Đặt quá nhiều công việc nặng vào microtask làm chuột bị chậm vài trăm mili-giây vì microtask chạy trước vẽ giao diện (render là một macrotask).

### Ví dụ đời thực
Một trang admin gọi API lấy danh sách đơn hàng (khoảng 5000 đơn). Code đặt xử lý render trong Promise.then (microtask) rồi tiếp tục gọi setTimeout trong microtask. Kết quả: microtask chạy liên tục 1200 ms, người dùng không bấm nút được trong khoảng đó, cảm giác trang bị đơ.

### Trả lời mẫu khi phỏng vấn
JavaScript chạy trên một luồng duy nhất nên nó không đồng bộ bằng cách tạo thread mới như Java. Thay vào đó, các tác vụ cần chờ được nhường cho trình duyệt hoặc Node.js, và kết quả được đẩy về hàng đợi. Event loop là vòng lặp lấy từng tác vụ từ hàng đợi chạy xong rồi lấy tác vụ tiếp theo. Microtask, ví dụ callback của Promise, được ưu tiên chạy ngay sau task hiện tại và trước macrotask như setTimeout. Vì microtask chạy trước vẽ giao diện, quá nhiều microtask có thể làm giao diện bị đơ. Trong phỏng vấn tôi nhấn mạnh điểm này để tránh việc viết code chặn luồng chính.

> Senior tip: Tránh đặt xử lý nặng trong microtask. Nếu cần chạy lâu, hãy chia nhỏ hoặc dùng setTimeout để event loop có thời gian vẽ giao diện và đáp ứng nhập chuột.
`,
  tags: ['javascript', 'event-loop'],
  follow: ['Promise.all', 'queueMicrotask', 'requestAnimationFrame']
},
{
  id: 'frontend-002',
  topic: 'frontend',
  level: 'senior',
  q: 'async/await trong JavaScript hoạt động như thế nào và xử lý lỗi ra sao? So sánh với Java CompletableFuture.',
  a: `**Tóm tắt:** async/await là cú pháp làm việc với Promise nhẹ nhàng hơn. Hàm đánh dấu async luôn trả về một Promise; từ khóa await tạm dừng hàm nhưng không chặn luồng chính, và lỗi được bắt bằng try/catch tương tự Java.

### Cơ chế hoạt động
1. Hàm async chạy đến dòng đầu tiên chứa await, tạm dừng và trả về Promise ngay lập tức.
2. Trình duyệt tiếp tục chạy các tác vụ khác, luồng JS không bị treo.
3. Khi Promise được await hoàn thành, phần còn lại của hàm được xếp vào microtask để chạy tiếp.
4. Lỗi trong hàm async thành Promise bị từ chối (rejected), bắt bằng try/catch.

async/await không tạo luồng mới; nó chỉ viết lại luồng thực thi bằng Promise và microtask dễ hiểu hơn.

### So sánh với Java CompletableFuture
| Đặc điểm | JavaScript async/await | Java CompletableFuture |
|---|---|---|
| Luồng thực thi | 1 luồng chính, không chặn | Có thể dùng pool nhiều luồng |
| Cách chờ | await (dừng hàm, không chặn luồng) | .join()/.get() (chặn luồng gọi) |
| Xử lý lỗi | try/catch | exceptionally / handle |
| Chạy song song | Promise.all | allOf / thenCompose |

### Ví dụ code
~~~text
function layDuLieu(id) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if (id > 0) resolve({ id: id, ten: 'San pham ' + id });
      else reject(new Error('ID khong hop le'));
    }, 100);
  });
}

async function hienThi(id) {
  try {
    var sp = await layDuLieu(id);
    console.log(sp.ten);
  } catch (loi) {
    console.log('Loi: ' + loi.message);
  }
}

hienThi(1);
hienThi(-1);
~~~

### Lỗi hay gặp
- Bỏ qua await làm hàm tiếp tục chạy trước khi dữ liệu đến, biến số nhận giá trị undefined.
- Gọi await tuần tự cho các API độc lập làm tổng thời gian chờ bằng tổng từng API, thay vì bằng API chậm nhất. Dùng Promise.all để chạy song song.
- Quên try/catch làm lỗi không được bắt, ứng dụng bị treo mà không báo sai.

### Ví dụ đời thực
Trang chi tiết sản phẩm gọi 3 API độc lập: thông tin sản phẩm (300 ms), đánh giá (200 ms), tồn kho (100 ms). Nếu await tuần tự, tổng là 600 ms. Dùng Promise.all, tổng là khoảng 300 ms (chậm nhất), giảm nửa thời gian chờ của người dùng.

### Trả lời mẫu khi phỏng vấn
async/await là cách viết Promise để đọc hơn. Một hàm async luôn trả về Promise, và await tạm dừng hàm tại chỗ đó đến khi Promise hoàn thành, nhưng không chặn luồng chính của trình duyệt. Lỗi được bắt bằng try/catch, giống Java. Nếu gọi nhiều API độc lập, nên dùng Promise.all thay vì await từng cái một, để không làm chậm giao diện. Tôi cũng luôn bọc await trong try/catch để xử lý lỗi mạng một cách nhất quán.

> Senior tip: await không chặn luồng, nhưng vẫn chỉ chạy trên 1 luồng. Công việc CPU nặng (ví dụ mã hóa hình ảnh lớn) vẫn nên chạy trong Web Worker để tránh làm đơ giao diện.
`,
  tags: ['javascript', 'async-await'],
  follow: ['Promise.all', 'retry', 'top-level await']
},
{
  id: 'frontend-003',
  topic: 'frontend',
  level: 'senior',
  q: 'Closure trong JavaScript là gì và this hoạt động như thế nào? So sánh với Java lambda.',
  a: `**Tóm tắt:** Closure là hàm nhúng giữ được biến của hàm cha ngay sau khi hàm cha đã chạy xong. Từ khóa this trong JavaScript được quyết định theo cách hàm được GỌI, không theo nơi hàm được KHAI BÁO, khác hoàn toàn với Java.

### Closure
Closure xuất hiện khi một hàm con được định nghĩa bên trong hàm và sử dụng biến của hàm. Hàm con "kết lại" biến đó, nên biến vẫn tồn tại ngay sau khi hàm cha hoàn thành.

Ví dụ Java lambda cũng bắt biến từ vùng không gian xung quanh, nhưng Java yêu cầu biến bắt phải là effectively final, trong khi closure JavaScript cho phép thay đổi biến đã bắt.

### this
- Hàm thường: this được gán khi gọi (ví dụ obj.method() thì this là obj).
- Hàm mũi tên (arrow function): không có this riêng, kế thừa this từ hàm bao quanh (lexical this), khác với lambda Java - Java lambda kế thừa this của class bao quanh, còn arrow function kế thừa this từ phạm vi từ vựng (có thể là function, không nhất thiết là class).
- Hàm xử lý sự kiện (click, v.v.) thường bị mất this nếu gán trực tiếp.

### Ví dụ code
~~~text
function taoBoDem() {
  var dem = 0; // biến được closure bỏ nhớ

  return function () {
    dem = dem + 1;
    console.log('Dem: ' + dem);
  };
}

var boDem = taoBoDem();
boDem(); // Dem: 1
boDem(); // Dem: 2

var obj = {
  ten: 'May chu A',
  inTen: function () {
    setTimeout(function () {
      console.log(this.ten); // this là window, không phải obj
    }, 100);
  },
  inTenDung: function () {
    var that = this; // lưu this trước
    setTimeout(function () {
      console.log(that.ten); // May chu A
    }, 100);
  },
  inTenArrow: function () {
    setTimeout(() => {
      console.log(this.ten); // May chu A, arrow lấy this từ ngoài
    }, 100);
  }
};

obj.inTen();
obj.inTenDung();
obj.inTenArrow();
~~~

### Lỗi hay gặp
- Gán hàm xử lý sự kiện trực tiếp (button.onclick = obj.inTen) làm this trở thành nút nhấn, không phải obj.
- Quên rằng var trong closure là biến tham chiếu, nhiều hàm closure chia cùng một biến nếu tạo trong vòng lặp (với let/const thì mỗi vòng lặp có binding riêng).

### Ví dụ đời thực
Một thành phần Vue hiển thị danh sách 1000 mục. Mỗi mục có nút xóa. Nếu gán hàm xóa mất this, bấm xóa bị lỗi 'Cannot read property of undefined' và toàn bộ danh sách không cập nhật được, ảnh hưởng trực tiếp người dùng.

### Trả lời mẫu khi phỏng vấn
Closure là hàm nhúng lại biến của hàm sau khi kết thúc, tương tự lambda Java bắt biến từ vùng ngoài, tuy nhiên Java yêu cầu biến bắt phải effectively final còn JavaScript cho phép thay đổi biến đã bắt. this trong JavaScript được quyết định lúc gọi hàm không lúc khai báo, nên gán hàm làm sự kiện hoặc truyền callback rất dễ mất this. Cách khắc phục phổ biến là dùng arrow function để kế thừa this từ hàm bao quanh, hoặc lưu this vào biến tạm trước khi truyền callback.

> Senior tip: Trong callback sự kiện DOM, hãy dùng arrow function hoặc gọi bind(this) lúc đăng ký sự kiện, để không để this tùy ý cách trình duyệt gọi hàm.
`,
  tags: ['javascript', 'closure'],
  follow: ['bind', 'arrow function', 'memory leak']
},
{
  id: 'frontend-004',
  topic: 'frontend',
  level: 'senior',
  q: 'Trong JavaScript, == và === khác nhau thế nào? So sánh object và mảng với tập hợp trong Java.',
  a: `**Tóm tắt:** == so sánh sau khi ép kiểu hai vế sang cùng kiểu, còn === so sánh trực tiếp không ép kiểu. Object và mảng trong JavaScript so sánh theo tham chiếu (không giống Java so sánh nội dung qua equals).

### == và ===
- ==: ép kiểu trước khi so sánh. Ví dụ '5' == 5 là đúng vì chuỗi '5' được ép thành số 5.
- ===: không ép kiểu, cả giá trị và kiểu phải khớp. '5' === 5 là sai.

### Object và mảng so sánh tham chiếu
Hai object hoặc hai mảng có nội dung giống nhau vẫn được coi là khác nhau nếu chúng là hai đối tượng riêng biệt trong bộ nhớ. Điều này khác Java, nơi List hay Map so sánh nội dung thông qua equals().

### Ví dụ code
~~~text
console.log('5' == 5); // true, ép kiểu
console.log('5' === 5); // false, không ép kiểu
console.log(null == undefined); // true
console.log(null === undefined); // false
console.log([] == []); // false, hai mảng khác nhau ở bộ nhớ
console.log({} == {}); // false, hai object khác nhau

var a = { id: 1 };
var b = a; // cùng tham chiếu
console.log(a == b); // true
console.log(a === b); // true
~~~

### So sánh với Java
| Hành vi | JavaScript | Java |
|---|---|---|
| So sánh giá trị nguyên thủy | === so sánh trực tiếp | == cho nguyên thủy |
| Ép kiểu | == ép kiểu tự động | Không ép kiểu tự động cho == |
| So sánh object/mảng | Tham chiếu (khác nếu khác đối tượng) | equals() so sánh nội dung |

### Lỗi hay gặp
- Dùng == kiểm tra dữ liệu từ input (chuỗi) với số, gây sai lệch nhập liệu.
- So sánh hai mảng bằng === mong đợi nội dung giống nhau, nhưng kết quả luôn sai vì so sánh tham chiếu. Phải duyệt từng phần tử.

### Ví dụ đời thực
Form nhập số lượng sản phẩm. Code viết if (soLuong == 0) nhưng soLuong là chuỗi '0' từ ô input. Với ==, '0' == 0 là đúng nên vẫn chạy. Tuy nhiên đây là thói quen xấu: nên parse sang số trước rồi mới so sánh bằng ===. Nếu dùng if (soLuong === 0) mà quên parse, chuỗi '0' sẽ khác số 0, gây sai logic kiểm tra tồn kho.

### Trả lời mẫu khi phỏng vấn
Toán tử == sẽ ép kiểu hai vế sang cùng kiểu trước khi so sánh, nên '5' == 5 trả về đúng. Toán tử === không ép kiểu, cả giá trị và kiểu phải giống nhau nên '5' === 5 trả về sai. Object và mảng trong JavaScript được so sánh theo tham chiếu: hai object có nội dung giống nhau vẫn khác nhau nếu là hai đối tượng riêng biệt trong bộ nhớ. Điều này khác Java, trong List và Map dùng equals() để so sánh nội dung. Do đó, khi làm việc với dữ liệu từ form hoặc API, tôi luôn dùng === và so sánh đối tượng theo từng trường thay vì so sánh đối tượng trực tiếp.

> Senior tip: Luôn dùng === trong code production. Ép kiểu ngầm của == là nguồn lỗi khó phát hiện, đặc biệt khi dữ liệu từ input luôn là chuỗi.
`,
  tags: ['javascript', 'equality'],
  follow: ['Object.is', 'deep compare', 'Map Set']
},
{
  id: 'frontend-005',
  topic: 'frontend',
  level: 'lead',
  q: 'ES Modules và bundler (như Vite) hoạt động như thế nào ở mức khái niệm? Khi nào cần bundler?',
  a: `**Tóm tắt:** ES Modules là chuẩn module của JavaScript dùng import/export để chia code thành các tập tin nhỏ. Bundler (như Vite) gộp các tập tin này thành ít tập tin lớn hơn để trình duyệt tải nhanh hơn, và chỉ cần khi ứng dụng lớn hoặc cần tối ưu tải.

### ES Modules
- Mỗi tập tin là một module, có phạm vi biến riêng, không bị đụng độ tên toàn cục.
- Xuất bằng export, nhập bằng import. Trình duyệt phân tích câu lệnh import để xây dựng đồ thị module (module graph) và tải đúng thứ tự cần thiết.

### Bundler (Vite)
- Đọc file nhập vào, theo dõi các câu lệnh import, gộp tất thành một hoặc ít tập tin JavaScript.
- Vite ở chế độ phát triển không gộp toàn bộ ứng dụng, mà phục vụ từng module riêng lẻ, nên khởi động nhanh và hỗ trợ HMR (thay đổi module không tải lại trang).
- Khi build cho production, Vite gộp, loại bỏ code không dùng (tree-shaking), và chia nhỏ tập tin (code-splitting) để trình duyệt chỉ tải phần cần thiết.

### Khi nào cần bundler
- Ứng dụng chỉ có ít tập tin: có thể chạy thô trên trình duyệt hiện nay, không cần bundler.
- Ứng dụng lớn, nhiều thư viện ngoài, cần tối ưu kích thước và tốc độ tải: cần bundler.

### Ví dụ code
~~~text
// math.js
export function cong(a, b) {
  return a + b;
}

// app.js
import { cong } from './math.js';

console.log('Tong: ' + cong(2, 3));
~~~

Trình duyệt tải math.js trước, rồi mới chạy app.js vì app.js phụ thuộc vào math.js.

### Lỗi hay gặp
- Quên thêm type="module" vào thẻ script làm trình duyệt không hiểu import/export.
- Import từ đường dẫn sai hoặc thiếu ./ làm trình duyệt tìm module tại gốc trang thay cùng thư mục.
- Dùng biến toàn cục chia sẻ giữa các module làm code khó bảo trì và dễ bị ghi đè.

### Ví dụ đời thực
Một trang quản lý kho hàng có 200 tập tin JavaScript. Nếu không gộp, trình duyệt phải gửi 200 yêu cầu HTTP, mỗi yêu cầu tầm 50 ms, tổng 10 giây chỉ để tải code. Dùng Vite gộp thành 3 tập tin, tổng dung lượng 250 KB sau nén, thời gian tải giảm xuống dưới 1 giây trên mạng 4G.

### Trả lời mẫu khi phỏng vấn
ES Modules là tiêu chuẩn chia code JavaScript thành các tập tin riêng biệt bằng import và export. Mỗi module có biến riêng, không bị xung đột tên toàn cục. Bundler như Vite đọc đồ thị import, gộp các tập tin lại, và cho phát triển nhanh nhờ phục vụ từng module thay vì gộp toàn bộ ứng dụng. Khi build cho sản phẩm, Vite loại bỏ code không dùng và chia nhỏ tập tin để trình duyệt chỉ tải phần cần thiết. Ứng dụng nhỏ chỉ có ít tập tin có thể bỏ qua bundler; ứng dụng lớn thì cần bundler để tối ưu kích thước và tốc độ tải.

> Senior tip: Ở chế độ phát triển, Vite không gộp toàn bộ ứng dụng nên khởi động gần như ngay lập tức, nhưng luôn kiểm tra bản build production vì tree-shaking có thể loại bỏ code bạn còn cho đang sử dụng.
`,
  tags: ['javascript', 'esm', 'vite'],
  follow: ['code splitting', 'HMR', 'import maps']
}
);