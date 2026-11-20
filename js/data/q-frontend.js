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
},
{
  id: 'frontend-006',
  topic: 'frontend',
  level: 'senior',
  q: 'Vue 3 dùng ref và reactive để làm phản ứng dữ liệu như thế nào? Những khác biệt cơ bản giữa hai cách này là gì?',
  a: `**Tóm tắt:** Vue 3 có hệ thống phản ứng (reactivity system) tự động theo dõi dữ liệu và cập nhật giao diện khi dữ liệu thay đổi. ref dùng để gói giá trị nguyên thủy thành đối tượng phản ứng, reactive dùng để biến toàn bộ object thành đối tượng phản ứng; hai cách đều được xây dựng trên Proxy của JavaScript.

### Cơ chế bên trong, từng bước
Vue 3 gói dữ liệu vào một Proxy, đối tượng đặc biệt của JavaScript có thể bắt mọi lần đọc và ghi thuộc tính.
1. Khi bạn tạo ref(0) hoặc reactive({ soLuong: 0 }), Vue gói dữ liệu vào Proxy.
2. Lúc component hiển thị template, Vue đọc các thuộc tính dữ liệu. Proxy ghi nhận: "component này đang sử dụng thuộc tính soLuong".
3. Khi bạn thay đổi dữ liệu (soLuong = 5), Proxy bắt sự kiện ghi, tìm ra các component phụ thuộc và yêu cầu chúng hiển thị lại.
4. Vue chỉ vẽ lại những phần giao diện thực sự thay đổi, không vẽ lại toàn bộ trang.

Vì Proxy là cơ chế nội place của JavaScript, Vue không cần quét lại toàn bộ dữ liệu để biết cái gì thay đổi, nên hiệu năng cao.

### ref và reactive khác nhau ở đâu
| Đặc điểm | ref | reactive |
|---|---|---|
| Dùng cho | Giá trị nguyên thủy (số, chuỗi, boolean) và object | Chỉ dùng cho object |
| Cách truy cập trong script | Phải dùng .value (ví dụ dem.value) | Truy cập trực tiếp (ví dụ state.soLuong) |
| Cách truy cập trong template | Không cần .value (viết dem) | Không cần .value |
| Tạo mới | ref(0), ref({ ten: 'A' }) | reactive({ soLuong: 0 }) |

### Ví dụ code
~~~text
import { ref, reactive } from 'vue';

// ref: gói giá trị vào đối tượng { value: ... }
var dem = ref(0);
console.log('Số hiện tại: ' + dem.value); // 0
dem.value = dem.value + 1;

// reactive: biến toàn bộ object thành phản ứng
var state = reactive({ ten: 'Máy chủ A', soLuong: 0 });
console.log('Tên: ' + state.ten);
state.soLuong = state.soLuong + 1;
~~~

Trong template của Vue, bạn viết dem (không cần .value) và state.soLuong, Vue tự động bổ sung .value khi cần.

### Lỗi hay gặp
- Thêm hoặc xóa thuộc tính mới vào đối tượng reactive sau khi tạo vẫn phản ứng được (Vue 3 dùng Proxy, khác Vue 2 cần Vue.set). Lỗi thường gặp là destructuring reactive object (var { a } = state) hoặc dùng spread ({...state}) làm mất bảo bóc Proxy, biến kết quả không còn phản ứng.
- Gán lại toàn bộ object cho reactive (state = newState) làm mất phản ứng vì biến trong template vẫn trỏ đến object cũ. Cần mutate các thuộc tính thay vì gán mới, hoặc dùng ref chứa object.
- Dùng .value ở trong template (viết dem.value) sẽ hiển thị undefined vì dem đã được auto-unwrap, chỉ dùng .value ở trong script.

### Ví dụ đời thực
Trang danh sách đơn hàng hiển thị tổng số đơn (1000 đơn). Kết thúc một đơn, cộng thêm 1 vào biến dem.ref. Vue cập nhật ngay số hiển thị từ 1000 sang 1001, không cần tải lại trang. Nếu bạn dùng biến thường không có ref, số hiển thị được cập nhật trong bộ nhớ nhưng giao diện vẫn cũ, người dùng thấy dữ liệu sai.

### Trả lời mẫu khi phỏng vấn
Vue 3 sử dụng Proxy để bảo bọc dữ liệu và bắt mọi lần đọc, ghi thuộc tính. ref gói một giá trị thành đối tượng có thuộc tính value, phù hợp cho giá trị nguyên thủy. reactive biến toàn bộ object thành phản ứng, truy cập trực tiếp. Khi dữ liệu thay đổi, Proxy biết thành phần nào sử dụng dữ liệu đó và chỉ cập nhật phần giao diện liên quan. Tôi luôn dùng ref cho giá trị đơn lẻ, reactive cho bộ dữ liệu liên quan nhau, và bổ sung .value ở script nhưng không viết .value ở template.

> Senior tip: Nếu cần thêm thuộc tính động vào object phản ứng, hãy dùng toàn mảng reactive và thêm vào lúc khởi tạo, hoặc dùng ref với một object chứa tất cả trường cần thiết. Không thêm thuộc tính mới sau khi reactive đã được tạo.`,
  tags: ['vue3', 'reactivity', 'ref', 'reactive'],
  follow: ['Proxy', 'ref vs reactive', 'computed'],
},
{
  id: 'frontend-007',
  topic: 'frontend',
  level: 'senior',
  q: 'Composition API và Options API trong Vue 3 khác nhau như thế nào? Khi nào nên dùng cái nào?',
  a: `**Tóm tắt:** Options API tổ chức component theo nhóm tùy chọn (data, methods, computed, mounted...), Composition API nhóm theo tính năng (feature) dùng setup() và ref/reactive. Composition API phù hợp hơn cho component lớn và truyền dụng logic qua composable.

### Cơ chế hoạt động
Options API: Vue tự kết nối các tùy chọn theo tên. Component được chia thành các nhóm phân loại, viết ở nhiều khoảng khác nhau trong cùng một file.
Composition API: tất cả logic viết trong setup(), trả về một đối tượng để template truy cập. Vue chạy setup() một lần khi component tạo ra, lấy kết quả trả về hiển thị.

### Ví dụ code
~~~text
// Options API
export default {
  data() { return { dem: 0 }; },
  methods: { tang() { this.dem = this.dem + 1; } },
  mounted() { console.log('Đã khởi tạo'); }
};

// Composition API
import { ref, onMounted } from 'vue';
export default {
  setup() {
    var dem = ref(0);
    function tang() { dem.value = dem.value + 1; }
    onMounted(function () { console.log('Đã khởi tạo'); });
    return { dem, tang };
  }
};
~~~

### Bảng so sánh
| Đặc điểm | Options API | Composition API |
|---|---|---|
| Tổ chức | Theo loại (data, methods...) | Theo tính năng (feature) |
| Phù hợp | Component nhỏ, đơn giản | Component lớn, phức tạp |
| Truyền dụng logic | Không dễ, phải mixin | Dễ qua composable |
| TypeScript | Hỗ trợ hạn chế | Hỗ trợ tốt |

### Lỗi hay gặp
- Viết setup() quá dài, không chia thành composable, component khó đọc và bảo trì.
- Quên trả về ref/reactive từ setup() làm template không truy cập được.
- Dùng this trong setup() (this không có ý nghĩa ở đây), phải trả về biến cần thiết.

### Ví dụ đời thực
Một trang quản lý đơn hàng có 800 dòng code. Với Options API, logic lấy đơn hàng, lọc đơn hàng, tính tổng tiền nằm ở nhiều khoảng (data, methods, computed), sửa lỗi khó tìm. Với Composition API, bạn viết composable useDonHang() gồm tất cả logic liên quan đến đơn hàng, component gọn hơn ít dòng, sửa lỗi và thêm tính năng mới nhanh hơn.

### Trả lời mẫu khi phỏng vấn
Options API sắp xếp code theo loại tùy chọn như data, methods, computed, mounted, phù hợp với component nhỏ. Composition API viết tất cả logic trong setup(), nhóm theo tính năng, trả về đối tượng để template sử dụng, phù hợp với component lớn và truyền dụng logic qua composable. Nếu component có dưới 100 dòng, Options API đủ dùng; nếu component lớn hoặc cần chia logic nhiều trang sử dụng, chọn Composition API. Tôi luôn chia setup() thành các composable nhỏ để component gọn gàng và dễ kiểm thử.

> Senior tip: Kết hợp hai cách cùng một component là thường xảy ra: Options API cho phần giao diện đơn giản, Composition API cho phần logic phức tạp. Nhưng nếu dự án đã chọn một cách, hãy duy trì nhất quán toàn bộ để không làm đối với mọi người.`,
  tags: ['vue3', 'composition-api', 'options-api'],
  follow: ['composable', 'setup()', 'mixin'],
},
{
  id: 'frontend-008',
  topic: 'frontend',
  level: 'mid',
  q: 'computed và watch trong Vue 3 khác nhau như thế nào? Khi nào nên dùng computed, khi nào nên dùng watch?',
  a: `**Tóm tắt:** computed tính toán giá trị mới dựa trên các giá trị khác và lưu kết quả (cache), watch theo dõi sự thay đổi để thực hiện tác vụ phụ (side effect) như gọi API. computed dùng khi cần giá trị đã xử lý, watch dùng khi cần phản ứng với sự thay đổi.

### Cơ chế hoạt động
computed: phụ thuộc vào ref/reactive, chỉ tính lại khi giá trị phụ thuộc thay đổi, lưu kết quả lại nếu không có gì thay đổi. Như một biến tiền tính toán trong Java.
watch: chạy callback khi giá trị thay đổi, phù hợp cho tác vụ phụ (gọi API, lưu localStorage, thêm sự kiện). Không lưu kết quả, chỉ thực hiện hành động.

### Ví dụ code
~~~text
import { ref, computed, watch } from 'vue';

export default {
  setup() {
    var soLuong = ref(0);
    var donGia = ref(10000);

    // computed: tiền tố tiền hàng, chỉ tính lại khi soLuong hoặc donGia thay đổi
    var thanhTien = computed(function () {
      return soLuong.value * donGia.value;
    });

    // watch: gửi thông báo khi thành tiền thay đổi quá 1 triệu
    watch(thanhTien, function (moi, cu) {
      if (moi > 1000000) {
        console.log('Thành tiền quá 1 triệu: ' + moi);
      }
    });

    return { soLuong, donGia, thanhTien };
  }
};
~~~

### Bảng so sánh
| Đặc điểm | computed | watch |
|---|---|---|
| Mục đích | Tính giá trị đã xử lý | Thực hiện tác vụ phụ |
| Lưu kết quả | Có (cache) | Không |
| Chạy khi | Phụ thuộc thay đổi | Giá trị theo dõi thay đổi |
| Trả về | Giá trị | Không trả về (chạy hàm) |
| Ví dụ | Tính tổng tiền | Gửi thông báo, gọi API |

### Lỗi hay gặp
- Dùng watch để tính toán giá trị có thể dùng computed (không cần cache, code phức tạp hơn cần thiết).
- Quên dọn dẹp side effect trong watch (ví dụ hủy request API khi component bị xoá), làm lọt request và mất bộ nhớ.
- Dùng watch với giá trị không thay đổi, callback chạy lần đầu tiên luôn (nếu có immediate: true).

### Ví dụ đời thực
Trang tìm kiếm sản phẩm. Người dùng nhập từ khóa ở ô nhập. Bạn dùng watch theo dõi từ khóa, mỗi lần nhập gọi API tìm kiếm sau 300 mili-giây (debounce). Nếu dùng computed, API sẽ được gọi mỗi lần tiền tố tiền thành tiền được tính lại, không có nghĩa vì computed không làm side effect. Kết quả: danh sách sản phẩm cập nhật đúng lúc người dùng dừng nhập, không làm trễ trang.

### Trả lời mẫu khi phỏng vấn
computed tính toán giá trị mới dựa trên các giá trị khác và lưu kết quả, chỉ tính lại khi dữ liệu nhập thay đổi, thích hợp tính tổng tiền, lọc danh sách. watch theo dõi sự thay đổi để thực hiện tác vụ phụ như gọi API, gửi thông báo, lưu localStorage. Tôi dùng computed khi cần một giá trị đã xử lý, và dùng watch khi cần phản ứng với sự thay đổi để làm một hành động nào đó. Với tìm kiếm, tôi dùng watch với debounce để không gọi API quá nhiều lần.

> Senior tip: Luôn ưu tiên computed nếu chỉ cần giá trị đã xử lý, chỉ dùng watch khi cần side effect. Nếu gọi API trong watch, hãy dùng debounce và hủy request cũ khi component bị xoá để không làm lọt request và mất bộ nhớ.`,
  tags: ['vue3', 'computed', 'watch'],
  follow: ['debounce', 'immediate', 'deep watch'],
},
{
  id: 'frontend-009',
  topic: 'frontend',
  level: 'senior',
  q: 'Props, emit và v-model trong Vue 3 hoạt động như thế nào? Phân biệt truyền dữ liệu một chiều và hai chiều.',
  a: `**Tóm tắt:** Props truyền dữ liệu từ component cha sang component con, emit gửi sự kiện từ con lên cha, v-model là cách ngắn gọn để hai chiều liên kết dữ liệu giữa cha và con. Props là một chiều (cha -> con), emit là chiều ngược (con -> cha), v-model gộp hai chiều lại.

### Cơ chế hoạt động
Props: cha gõ thuộc tính xuống con, con chỉ đọc, không sửa props trực tiếp (Vue báo lỗi nếu sửa).
Emit: con gọi emit('ten-su-kien', giaTri) để thông báo lên cha, cha lắng nghe và cập nhật state của mình.
v-model: kết hợp props + emit. <con v-model="giaTri" /> tương đương <con :model-value="giaTri" @update:modelValue="giaTri = $event" />.

### Ví dụ code
~~~text
// Component con: ModalChinhSua.vue
export default {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function capNhat(moi) {
      emit('update:modelValue', moi);
    }
    return { capNhat };
  }
};

// Template con
// <input :value="modelValue" @input="capNhat($event.target.value)" />

// Component cha
export default {
  setup() {
    var ten = ref('Nguyen Van A');
    return { ten };
  }
};

// Template cha
// <ModalChinhSua v-model="ten" />
~~~

### Bảng so sánh
| Cách | Hướng | Dùng để |
|---|---|---|
| Props | Cha -> con | Truyền dữ liệu xuống con |
| Emit | Con -> cha | Thông báo sự kiện lên cha |
| v-model | Hai chiều | Liên kết dữ liệu hai chiều |

### Lỗi hay gặp
- Sửa props trực tiếp trong component con, Vue báo lỗi và dữ liệu không cập nhật đúng.
- Quên emit làm cha không biết state đã thay đổi, giao diện bị động lạn.
- Dùng v-model nhiều thuộc tính (v-model:ten, v-model:tuoi) nhưng quên khai báo emits cho mỗi thuộc tính.

### Ví dụ đời thực
Một form chỉnh sửa thông tin người dùng ở modal. Cha mở modal và dùng v-model="thongTinNguoiDung". Con hiển thị ô nhập, người dùng sửa tên, con emit 'update:modelValue' với giá trị mới, cha cập nhật thongTinNguoiDung. Lưu thành công, gửi API cập nhật. Nếu quên emit, người dùng sửa tên nhưng form vẫn hiện tên cũ, nghĩ app bị lỗi.

### Trả lời mẫu khi phỏng vấn
Props truyền dữ liệu từ cha xuống con, con chỉ đọc không sửa trực tiếp. Emit gửi sự kiện từ con lên để cha biết state đã thay đổi. v-model gộp hai chiều, tương đương props modelValue và sự kiện update:modelValue. Tôi dùng props để cấu hình con, emit để con báo lỗi thành công, v-model cho form hai chiều. Luôn khai báo emits cho mỗi sự kiện con gửi lên để Vue kiểm tra đúng.

> Senior tip: Nếu cần nhiều thuộc tính hai chiều, dùng v-model:ten, v-model:tuoi (có thể tên khác modelValue bằng option modelModifiers). Không sửa props trong con, luôn emit để cha cập nhật, tránh dữ liệu bị động lạn giữa các component.`,
  tags: ['vue3', 'props', 'emit', 'v-model'],
  follow: ['v-model', 'emits', 'provide/inject'],
},
{
  id: 'frontend-010',
  topic: 'frontend',
  level: 'lead',
  q: 'Pinia quản lý state trong Vue 3 như thế nào? Khác biệt giữa Pinia và Vuex là gì?',
  a: `**Tóm tắt:** Pinia là thư viện quản lý state chính thức của Vue 3, lưu trạng thái chung cho toàn bộ ứng dụng. Store chứa state (dữ liệu), getter (tính toán từ state), action (thay đổi state, có thể bất đồng bộ gọi API). Các component truy cập và cập nhật dữ liệu chung qua store.

### Cơ chế hoạt động
Pinia tạo store lưu state ở một nơi trung gian. Mọi component cùng store cùng thấy thay đổi nhau.
- state: dữ liệu chung (ví danh sách đơn hàng, thông tin người dùng đăng nhập).
- getter: tính toán từ state (giống computed), ví tổng số đơn hàng.
- action: thay đổi state, có thể gọi API bất đồng bộ, ví thêm đơn hàng, cập nhật thông tin.
Component gọi action, state thay đổi, tất cả component dùng store cập nhật lại giao diện.

### Ví dụ code
~~~text
import { defineStore } from 'pinia';

export const useDonHangStore = defineStore('donhang', {
  state: () => ({
    danhSach: [],
    tong: 0
  }),
  getters: {
    soLuongDon: (state) => state.danhSach.length
  },
  actions: {
    async layDanhSach() {
      var kq = await fetch('/api/don-hang');
      this.danhSach = await kq.json();
      this.tong = this.danhSach.length;
    },
    themDon(don) {
      this.danhSach.push(don);
      this.tong = this.danhSach.length;
    }
  }
});

// Dùng trong component
import { useDonHangStore } from '@/stores/donhang';
export default {
  setup() {
    var store = useDonHangStore();
    console.log('Tổng đơn: ' + store.tong);
    return { store };
  }
};
~~~

### Bảng so sánh Pinia và Vuex
| Đặc điểm | Pinia | Vuex |
|---|---|---|
| Store | Nhiều store, tên khác nhau | Một store trung tâm |
| Action | Bất đồng bộ có bản | Bất động bộ có bản (không cần plugin) |
| TypeScript | Hỗ trợ tốt | Hỗ trợ tốt nhưng phức tạp hơn |
| Trạng thái | Chính thức Vue 3 | Đã giữ nguyên, không phát triển thêm |

### Lỗi hay gặp
- Thực hiện side effect (gọi API) trực tiếp trong component thay vì action, component khó kiểm thử và dính chéo.
- Lưu dữ liệu quá lớn vào store (ví danh sách 10000 bản ghi) làm hiệu năng giảm, chỉ lưu dữ liệu thực sự chung.

### Ví dụ đời thực
Một trang mua sách online có giỏ hàng. Người dùng thêm sách ở trang chi tiết, giỏ hàng ở header cập nhật luôn luôn. Pinia lưu giỏ hàng ở store chung, tất cả component thấy giỏ hàng hết số lượng sách. Sau 3 tháng, tổng số lượt thêm vào giỏ tăng lên 20000 đơn, trang hoạt động ổn định, không bị mất dữ liệu giỏ hàng khi chuyển trang.

### Trả lời mẫu khi phỏng vấn
Pinia là thư viện quản lý state chính thức của Vue 3, lưu trạng thái chung cho toàn ứng dụng. Store chứa state dữ liệu, getter tính toán từ state, action thay đổi state và có thể gọi API bất đồng bộ. Các component cùng store thấy thông tin nhau, cập nhật giao diện khi state thay đổi. Pinia khác Vuex ở chỗ cho phép nhiều store, hỗ trợ action bất đồng bộ có bản, và được ưu tiên cho Vue 3. Tôi dùng Pinia cho dữ liệu chung như thông tin người dùng, giỏ hàng, danh sách đơn hàng.

> Senior tip: Chia store theo tính năng (donhang, nguoidung, giohang) thay vì một store to. Chỉ lưu dữ liệu thực sự chung vào store, dữ liệu của một component lưu ở component. Khi gọi API trong action, luôn bắt lỗi và hiển thị thông báo người dùng hiểu được.`,
  tags: ['vue3', 'pinia', 'state-management', 'vuex'],
  follow: ['store', 'getter', 'action', 'vuex vs pinia']
},
{
  id: 'frontend-011',
  topic: 'frontend',
  level: 'senior',
  q: 'Vòng đời component trong Vue 3 (onMounted, onUnmounted, onUpdated...) hoạt động như thế nào? So sánh với lifecycle class component trong React hoặc @PostConstruct/@PreDestroy trong Spring.',
  a: `**Tóm tắt:** Vue 3 cung cấp các hook vòng đời trong Composition API (onMounted, onUnmounted, onUpdated, onBeforeMount, onBeforeUnmounted...) để chạy code tại các thời điểm chính xác của component. Giống @PostConstruct/@PreDestroy trong Spring, nhưng chạy trên luồng UI và gắn liền với việc render.
 
### Các hook chính và thứ tự chạy
1. onBeforeMount: chạy ngay trước component được gắn vào DOM, dữ liệu đã sẵn sàng nhưng DOM chưa có.
2. onMounted: chạy sau khi component đã có trong DOM, đây là lúc thường gọi API, thêm sự kiện DOM, khởi tạo thư viện thứ ba.
3. onBeforeUpdate: chạy khi dữ liệu thay đổi, trước khi DOM được cập nhật.
4. onUpdated: chạy sau khi DOM đã cập nhật xong do dữ liệu thay đổi.
5. onBeforeUnmount: chạy trước khi component bị xoá khỏi DOM, dùng để dọn dẹp (hủy timer, hủy đăng ký sự kiện, hủy WebSocket).
6. onUnmounted: chạy sau khi component đã bị xoá hoàn toàn.
 
### So sánh với Spring và React
| Đặc điểm | Vue 3 (Composition API) | Spring Bean | React Class Component |
|---|---|---|---|
| Khởi tạo | onMounted | @PostConstruct | componentDidMount |
| Hủy | onUnmounted | @PreDestroy | componentWillUnmount |
| Cập nhật | onUpdated | Không có khái niệm tương đương | componentDidUpdate |
| Phạm vi | Component UI | Bean toàn ứng dụng | Component UI |
 
### Ví dụ code
~~~text
import { ref, onMounted, onUnmounted, onUpdated } from 'vue';
 
export default {
  setup() {
    var thoiGian = ref(0);
    var timerId = null;
 
    onMounted(function () {
      console.log('Component đã gắn vào DOM');
      timerId = setInterval(function () {
        thoiGian.value = thoiGian.value + 1;
      }, 1000);
    });
 
    onUnmounted(function () {
      console.log('Component sắp bị xoá, dọn dẹp timer');
      clearInterval(timerId);
    });
 
    onUpdated(function () {
      console.log('DOM đã cập nhật, thời gian: ' + thoiGian.value);
    });
 
    return { thoiGian };
  }
};
~~~
 
### Lỗi hay gặp
- Quên clearInterval/clearTimeout trong onUnmounted gây rò rỉ bộ nhớ và callback chạy trên component đã chết.
- Gọi API trong onBeforeMount thay vì onMounted, component có thể bị xoá trước khi API xong dẫn đến lỗi cập nhật state trên component không còn tồn tại.
- Thực hiện side effect nặng trong onUpdated (ví dụ gọi API) gây vòng lặp vô hạn vì cập nhật state lại kích hoạt onUpdated.
 
### Ví dụ đời thực
Một dashboard theo dõi server real-time dùng WebSocket. onMounted mở kết nối, onUnmounted đóng kết nối. Nếu quên đóng trong onUnmounted, mỗi lần người dùng vào/ra trang dashboard tạo thêm một kết nối WebSocket. Sau 50 lần, server có 50 kết nối rác từ cùng một trình duyệt, tốn tài nguyên và làm chậm push dữ liệu thật.
 
### Trả lời mẫu khi phỏng vấn
Vue 3 cung cấp các hook vòng đời như onMounted, onUnmounted, onUpdated... trong Composition API. onMounted chạy sau khi component có trong DOM, dùng để gọi API, khởi tạo thư viện, thêm sự kiện. onUnmounted chạy trước khi xoá component, bắt buộc dùng để dọn dẹp timer, WebSocket, event listener. onUpdated chạy sau DOM cập nhật. Giống @PostConstruct/@PreDestroy trong Spring nhưng gắn liền với render UI. Tôi luôn dọn dẹp tài nguyên trong onUnmounted để tránh rò rỉ bộ nhớ.
 
> Senior tip: Không dùng onUpdated để gọi API hoặc thay đổi state, rất dễ gây vòng lặp vô hạn. Nếu cần phản ứng với thay đổi dữ liệu, hãy dùng watch hoặc computed thay vì onUpdated.`,
  tags: ['vue3', 'lifecycle', 'onMounted', 'onUnmounted'],
  follow: ['onBeforeMount', 'onErrorCaptured', 'keep-alive']
},
{
  id: 'frontend-012',
  topic: 'frontend',
  level: 'senior',
  q: 'Vue Router navigation guard (beforeEach, beforeResolve, afterEach) dùng để làm gì? Viết guard kiểm tra quyền truy cập trang admin (chỉ cho phép role ADMIN).',
  a: `**Tóm tắt:** Navigation guard trong Vue Router cho phép chặn, cho phép hoặc chuyển hướng điều hướng trước khi trang thực sự hiển thị. beforeEach chạy trước mọi điều hướng, beforeResolve chạy sau khi các component async đã tải xong, afterEach chạy sau khi điều hướng hoàn tất (không thể chặn). Dùng để kiểm tra đăng nhập, phân quyền, tải dữ liệu trước, ghi log.
 
### Ba loại guard chính
- beforeEach(to, from, next): chạy đầu tiên, có thể next() cho phép, next(false) hủy, next('/login') chuyển hướng. Phù hợp kiểm tra token, role.
- beforeResolve(to, from, next): chạy sau beforeEach và sau khi các component lazy-load đã resolve. Dùng khi cần dữ liệu component trước khi quyết định cho phép.
- afterEach(to, from): chạy sau điều hướng xong, không có next(), không thể chặn. Dùng cho analytics, scroll to top, đóng loading.
 
### So sánh với Spring Security Filter Chain
| Vue Router Guard | Spring Security Filter |
|---|---|
| beforeEach | Filter đầu tiên (SecurityContextPersistenceFilter) |
| beforeResolve | Filter sau khi Authentication đã xác thực |
| afterEach | Filter cuối (LoggingFilter) |
Cả hai đều chạy theo chuỗi, có thể chặn request/điều hướng sớm.
 
### Ví dụ code: Guard phân quyền admin
~~~text
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
 
const routes = [
  { path: '/', component: () => import('@/views/Home.vue') },
  { path: '/login', component: () => import('@/views/Login.vue') },
  { path: '/admin', component: () => import('@/views/Admin.vue'), meta: { requiresAuth: true, roles: ['ADMIN'] } },
  { path: '/user', component: () => import('@/views/User.vue'), meta: { requiresAuth: true } }
];
 
const router = createRouter({
  history: createWebHistory(),
  routes
});
 
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();
 
  // Chờ auth khởi tạo xong (nếu load token từ localStorage)
  if (!auth.initialized) {
    await auth.init();
  }
 
  // Trang công khai
  if (!to.meta.requiresAuth) {
    return next();
  }
 
  // Chưa đăng nhập -> về login
  if (!auth.token) {
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }
 
  // Kiểm tra role
  const requiredRoles = to.meta.roles || [];
  if (requiredRoles.length > 0 && !requiredRoles.includes(auth.role)) {
    return next({ path: '/403' }); // Không đủ quyền
  }
 
  // Đủ điều kiện
  next();
});
 
router.afterEach((to, from) => {
  // Ghi log, scroll top, analytics
  window.scrollTo(0, 0);
});
~~~
 
### Lỗi hay gặp
- Gọi next() nhiều lần trong một guard (ví dụ trong if/else quên return) gây lỗi "Navigation guard called next() multiple times".
- Quên await cho async function trong beforeEach, guard chạy xong trước khi dữ liệu sẵn sàng.
- Đặt logic phân quyền phức tạp trong component (mounted) thay vì guard, người dùng thấy trang lóe lên rồi bị chuyển hướng.
- Không xử lý trường hợp token hết hạn trong guard, dẫn đến API 401 lặp lại.
 
### Ví dụ đời thực
Hệ thống quản lý đơn hàng có 3 vai trò: ADMIN (xem tất cả), MANAGER (xem khu vực), STAFF (xem đơn của mình). Dùng beforeEach kiểm tra to.meta.roles. Nếu STAFF truy cập /admin, guard chuyển về /403 trong 50 ms, người dùng không bao giờ thấy giao diện admin. Log ghi nhận 1200 lần truy cập trái phép/tháng từ nhân viên mới, giúp team bảo mật audit.
 
### Trả lời mẫu khi phỏng vấn
Vue Router có ba guard chính: beforeEach chạy trước mọi điều hướng, dùng để kiểm tra đăng nhập và phân quyền; beforeResolve chạy sau khi component async đã tải, dùng khi cần dữ liệu component trước khi quyết định; afterEach chạy sau khi xong, dùng cho analytics. Để phân quyền admin, tôi thêm meta.roles: ['ADMIN'] vào route, trong beforeEach đọc authStore, nếu chưa đăng nhập chuyển về /login, nếu đăng nhập nhưng role không khớp chuyển về /403. Luôn return next() để tránh gọi nhiều lần.
 
> Senior tip: Đăng ký guard ở cấp router (router.beforeEach) thay vì per-route (beforeEnter) để logic tập trung, dễ bảo trì. Nếu app lớn, hãy tách guard thành file riêng (guards/auth.js, guards/permission.js) và import vào router.`,
  tags: ['vue3', 'vue-router', 'navigation-guard', 'auth', 'authorization'],
  follow: ['beforeEnter', 'lazy loading', 'scrollBehavior']
},
{
  id: 'frontend-013',
  topic: 'frontend',
  level: 'mid',
  q: 'provide/inject trong Vue 3 dùng để làm gì? Khác biệt với props truyền nhiều cấp (prop drilling) như thế nào?',
  a: `**Tóm tắt:** provide/inject cho phép component cha cung cấp dữ liệu/hàm cho bất kỳ component con cháu nào mà không cần truyền qua props từng cấp. Giải quyết vấn đề prop drilling (truyền props qua nhiều tầng component trung gian không cần dùng đến). Tương tự Dependency Injection trong Spring (@Autowired), nhưng ở cấp component UI.
 
### Cơ chế hoạt động
1. Component cha (hoặc tổ tiên) gọi provide('key', value) trong setup(). Value có thể là ref, reactive, hàm, object.
2. Component con cháu bất kỳ gọi inject('key') để nhận value. Mặc định inject không phản ứng, nếu cần phản ứng hãy provide một ref hoặc reactive.
3. Nếu không tìm thấy key, inject trả về undefined (hoặc giá trị mặc định inject('key', defaultValue)).
 
### So sánh provide/inject vs Prop Drilling
| Đặc điểm | Prop Drilling | provide/inject |
|---|---|---|
| Cách truyền | Props qua từng component trung gian | Cha provide, cháu inject trực tiếp |
| Component trung gian | Phải khai báo props, truyền tiếp | Không cần biết, không khai báo gì |
| Phản ứng | Tự động (props luôn phản ứng) | Cần provide ref/reactive mới phản ứng |
| TypeScript | Dễ infer type | Cần InjectionKey để type-safe |
| Phù hợp | 1-2 cấp, dữ liệu cục bộ | Nhiều cấp, dữ liệu toàn cục/theme/i18n |
 
### Ví dụ code
~~~text
import { ref, provide, inject, computed } from 'vue';
 
// Key duy nhất để tránh trùng lặp, dùng Symbol cho type-safe
const THEME_KEY = Symbol('theme');
 
// Component gốc App.vue
export default {
  setup() {
    var theme = ref('light'); // ref để con cháu thay đổi được
 
    function doiTheme() {
      theme.value = theme.value === 'light' ? 'dark' : 'light';
    }
 
    provide(THEME_KEY, { theme, doiTheme });
    return { theme, doiTheme };
  }
};
 
// Component con cháu bất kỳ (Button.vue, Card.vue, Modal.vue...)
export default {
  setup() {
    // inject trả về object { theme: ref, doiTheme: function }
    const { theme, doiTheme } = inject(THEME_KEY, { theme: ref('light'), doiTheme: () => {} });
    return { theme, doiTheme };
  }
};
 
// Template Button.vue
// <button @click="doiTheme" :class="theme">Chuyển theme</button>
~~~
 
### Lỗi hay gặp
- Provide giá trị nguyên thủy (string, number) thay vì ref/reactive: con cháu inject được nhưng khi cha thay đổi, con không cập nhật (mất phản ứng).
- Quên cung cấp giá trị mặc định cho inject: component dùng inject nhưng không có ancestor provide -> undefined, gây lỗi runtime.
- Lạm dụng provide/inject cho mọi thứ: chỉ dùng cho dữ liệu thực sự chia sẻ rộng (theme, locale, user info, config). Dữ liệu cục bộ 1-2 cấp nên dùng props.
 
### Ví dụ đời thực
Ứng dụng admin có 50 component. Theme (light/dark) và ngôn ngữ (vi/en) cần dùng ở khắp nơi: header, sidebar, modal, table, form. Nếu dùng props, 50 component đều phải khai báo theme, locale, và 20 component trung gian phải truyền tiếp. Dùng provide/inject: App.vue provide một lần, 50 component inject trực tiếp, không component trung gian nào phải sửa code. Thêm theme mới chỉ sửa App.vue.
 
### Trả lời mẫu khi phỏng vấn
provide/inject cho phép component cha chia sẻ dữ liệu cho con cháu bất kỳ mà không truyền qua props. Cha gọi provide(key, value), cháu gọi inject(key). Giá trị nên là ref hoặc reactive để giữ phản ứng. Khác với prop drilling: prop drilling buộc component trung gian khai báo và truyền props, provide/inject bỏ qua trung gian. Tương tự DI trong Spring: cha là container, provide là đăng ký bean, inject là @Autowired. Tôi dùng cho theme, locale, user info, config toàn cục.
 
> Senior tip: Luôn dùng Symbol làm key (const KEY = Symbol('name')) để tránh trùng lặp và hỗ trợ TypeScript tốt. Đặt giá trị mặc định cho inject để component có thể test độc lập không cần ancestor.`,
  tags: ['vue3', 'provide', 'inject', 'dependency-injection'],
  follow: ['InjectionKey', 'prop drilling', 'global store vs provide']
},
{
  id: 'frontend-014',
  topic: 'frontend',
  level: 'senior',
  q: 'Slots trong Vue 3 (default slot, named slot, scoped slot) hoạt động như thế nào? Viết component Card có header, content, footer tùy chỉnh.',
  a: `**Tóm tắt:** Slot là chỗ trống trong component con để component cha truyền nội dung (HTML, component khác) vào. Default slot dùng khi có một nội dung duy nhất. Named slot (slot name="ten") cho phép nhiều khu vực nội dung riêng biệt. Scoped slot (v-slot:ten="props") cho phép component con truyền dữ liệu ra cho component cha quyết định hiển thị như thế nào. Giống children trong React nhưng mạnh hơn nhờ named slot và scoped slot.
 
### Ba loại slot
1. Default slot: <slot /> hoặc <slot>nội dung mặc định</slot>. Cha truyền nội dung không tên: <Child>nội dung</Child>.
2. Named slot: <slot name="header" />. Cha truyền: <template #header>nội dung header</template>.
3. Scoped slot: <slot name="item" :data="item" :index="index" />. Cha nhận props: <template #item="{ data, index }">...</template>.
 
### So sánh với React children
| Vue Slot | React |
|---|---|
| Default slot | props.children |
| Named slot | props.header, props.footer (cần tự quy ước) |
| Scoped slot | Render props pattern (props.renderItem(item)) |
Vue slot là first-class citizen, declarative trong template, React dùng JSX pattern.
 
### Ví dụ code: Component Card
~~~text
// Card.vue
export default {
  props: ['title'],
  setup(props, { slots }) {
    return () => (
      <div class="card">
        <div class="card-header">
          {slots.header ? slots.header() : props.title}
        </div>
        <div class="card-body">
          {slots.default ? slots.default() : 'Không có nội dung'}
        </div>
        <div class="card-footer">
          {slots.footer ? slots.footer() : ''}
        </div>
      </div>
    );
  }
};
 
// Hoặc viết template (thông dụng hơn)
~~~
 
~~~text
<!-- Card.vue template -->
<template>
  <div class="card">
    <div class="card-header">
      <slot name="header">{{ title }}</slot>
    </div>
    <div class="card-body">
      <slot>Không có nội dung</slot>
    </div>
    <div class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>
 
<script>
export default { props: ['title'] };
</script>
 
<!-- Sử dụng Card.vue -->
<Card title="Đơn hàng #123">
  <template #header>
    <h3>Đơn hàng #123</h3>
    <Badge>Chờ xử lý</Badge>
  </template>
 
  <template #default>
    <OrderItems :items="donHang.items" />
  </template>
 
  <template #footer>
    <Button @click="huyDon">Hủy</Button>
    <Button variant="primary" @click="xemChiTiet">Xem chi tiết</Button>
  </template>
</Card>
~~~
 
### Scoped slot ví dụ: Bảng có thể tùy chỉnh cột
~~~text
<!-- DataTable.vue -->
<template>
  <table>
    <thead>
      <tr><th>STT</th><th>Tên</th><th>Thao tác</th></tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in items" :key="item.id">
        <td>{{ index + 1 }}</td>
        <td>{{ item.ten }}</td>
        <td>
          <slot name="actions" :item="item" :index="index">
            <button>Mặc định</button>
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>
 
<!-- Cha tùy chỉnh cột actions -->
<DataTable :items="danhSach">
  <template #actions="{ item, index }">
    <Button @click="sua(item)">Sửa</Button>
    <Button danger @click="xoa(item)">Xóa</Button>
  </template>
</DataTable>
~~~
 
### Lỗi hay gặp
- Quên kiểm tra slots.name trước khi render, slot trống vẫn tạo element wrapper rỗng làm CSS lệch.
- Dùng scoped slot nhưng quên destructure props trong v-slot: <template #actions="props"> phải dùng props.item thay vì item.
- Truyền quá nhiều dữ liệu qua scoped slot làm component cha phụ thuộc chặt vào cấu trúc dữ liệu con, khó tái cấu trúc.
 
### Ví dụ đời thực
Thư viện component nội bộ có DataTable dùng scoped slot cho cột actions. 15 trang dùng DataTable, mỗi trang tùy chỉnh nút Sửa/Xóa/Xem/In khác nhau. Khi yêu cầu thêm nút "Xuất Excel", team chỉ cập nhật DataTable.vue thêm slot action mặc định, 15 trang không cần sửa code. Nếu không có scoped slot, DataTable phải nhận mảng config cột phức tạp, khó bảo trì.
 
### Trả lời mẫu khi phỏng vấn
Vue có ba loại slot: default slot cho một nội dung, named slot cho nhiều khu vực (header, footer), scoped slot cho phép con truyền dữ liệu ra để cha quyết định render. Card component dùng named slot header, default, footer. DataTable dùng scoped slot truyền item, index ra để cha tự render nút hành động. Khác React children: Vue slot declarative trong template, hỗ trợ named và scoped sẵn. Tôi dùng slot để component linh hoạt, cha quyết định UI, con chỉ lo khung và logic.
 
> Senior tip: Luôn đặt nội dung mặc định trong <slot>nội dung mặc định</slot> cho default/named slot. Với scoped slot, hãy định nghĩa rõ ràng props truyền ra (item, index, v.v.) và ghi chú JSDoc để IDE gợi ý cho người dùng component.`,
  tags: ['vue3', 'slot', 'named-slot', 'scoped-slot'],
  follow: ['slot fallback', 'dynamic slot name', 'renderless component']
},
{
  id: 'frontend-015',
  topic: 'frontend',
  level: 'lead',
  q: 'Async component (defineAsyncComponent), Suspense và Teleport trong Vue 3 giải quyết vấn đề gì? Khi nào nên dùng từng cái?',
  a: `**Tóm tắt:** Ba tính năng nâng cao của Vue 3: defineAsyncComponent tải component khi cần (code splitting), Suspense hiển thị fallback trong khi chờ async component/async setup, Teleport render nội dung vào DOM node khác (modal, tooltip). Ba cái cùng mục đích: cải thiện trải nghiệm tải và vị trí render.
 
### defineAsyncComponent (Code Splitting)
Cho phép chia nhỏ bundle, chỉ tải component khi thực sự cần. Mặc định Vue tải lazy (khi component được render lần đầu).
 
~~~text
import { defineAsyncComponent } from 'vue';
 
// Tải khi cần, có loading/error/delay/timeout
const HeavyChart = defineAsyncComponent({
  loader: () => import('./HeavyChart.vue'),
  loadingComponent: ChartSkeleton,
  errorComponent: ChartError,
  delay: 200, // Chỉ hiện loading sau 200ms (tránh nháy)
  timeout: 10000 // 10s timeout -> hiện error
});
 
// Dùng trong template: <HeavyChart />
~~~
 
### Suspense (Chờ async)
Bọc component có setup() async hoặc async component, hiển thị #fallback trong khi chờ. Cần đặt ở component cha.
 
~~~text
<!-- Parent.vue -->
<template>
  <Suspense>
    <template #default>
      <Dashboard />  <!-- Dashboard.setup() là async, hoặc dùng HeavyChart -->
    </template>
    <template #fallback>
      <PageSkeleton />  <!-- Hiển thị khi chờ -->
    </template>
  </Suspense>
</template>
 
<!-- Dashboard.vue -->
<script>
export default {
  async setup() {
    const data = await fetchDashboardData(); // Chờ dữ liệu xong mới render
    return { data };
  }
};
</script>
~~~
 
### Teleport (Dịch chuyển DOM)
Render nội dung template vào DOM node khác (thường là body) thay vì vị trí component. Dùng cho modal, tooltip, dropdown, toast để tránh vấn đề z-index, overflow: hidden, stacking context.
 
~~~text
<!-- Modal.vue -->
<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="hienThi">
      <div class="modal-box">
        <slot />
        <button @click="$emit('close')">Đóng</button>
      </div>
    </div>
  </Teleport>
</template>
 
<script>
export default { props: ['hienThi'], emits: ['close'] };
</script>
 
<!-- Dùng: <Modal :hienThi="show" @close="show=false">Nội dung</Modal> -->
~~~
 
### Bảng so sánh khi dùng cái nào
| Tính năng | Vấn đề giải quyết | Khi nào dùng |
|---|---|---|
| defineAsyncComponent | Bundle quá lớn, tải chậm trang đầu | Component nặng (biểu đồ, editor, bản đồ), trang ít truy cập |
| Suspense | UI nháy, layout shift khi chờ dữ liệu | Trang cần dữ liệu trước khi hiển thị, tránh spinner lẻ tẻ |
| Teleport | Modal bị cắt bởi overflow, z-index loạn | Modal, tooltip, dropdown, toast cần hiển thị trên tất cả |
 
### Lỗi hay gặp
- Dùng Suspense mà quên component con có async setup hoặc defineAsyncComponent -> Suspense không chờ, fallback không hiện.
- Teleport to="body" nhưng body chưa sẵn sàng (SSR) hoặc multiple root app -> Teleport không tìm thấy target. Cần to="#modal-root" với &lt;div id="modal-root"&gt;&lt;/div&gt; trong index.html.
- Async component không có errorComponent: khi mạng lỗi, ứng dụng trắng trang không thông báo.
- Lồng Suspense trong Suspense không cần thiết, chỉ một cấp cha đủ.
 
### Ví dụ đời thực
Trang admin có Dashboard (tải 5 widget), Báo cáo (biểu đồ nặng 300KB), Cài đặt. Dùng defineAsyncComponent cho Báo cáo: bundle chính giảm từ 450KB xuống 150KB, First Contentful Paint cải thiện từ 2.1s xuống 1.3s. Dashboard dùng Suspense với PageSkeleton: người dùng thấy khung sườn ngay 0.8s, dữ liệu đổ vào 1.5s, không bị layout shift. Modal xác nhận xóa dùng Teleport to="#modal-root": không bị cắt bởi sidebar overflow: hidden, z-index luôn trên cùng.
 
### Trả lời mẫu khi phỏng vấn
defineAsyncComponent chia nhỏ bundle, tải component khi cần (lazy load), cấu hình loading/error/delay/timeout. Suspense bọc component async (setup async hoặc async component), hiển thị fallback cho đến khi xong, tránh spinner rải rác. Teleport render nội dung vào DOM node khác (body hoặc #modal-root), giải quyết modal bị cắt bởi overflow/z-index. Tôi dùng async component cho trang nặng, Suspense cho trang cần dữ liệu trước khi hiện, Teleport cho modal/tooltip. Ba tính năng cùng hướng tới UX mượt mà hơn.
 
> Senior tip: Kết hợp ba cái: defineAsyncComponent tải component, Suspense chờ component đó xong (kèm dữ liệu async setup), Teleport đảm bảo modal hiển thị đúng chỗ. Trong vite.config.js, hãy cấu hình manualChunks để tách vendor và async component thành file riêng, tránh duplicate code.`,
  tags: ['vue3', 'async-component', 'suspense', 'teleport', 'code-splitting'],
  follow: ['defineAsyncComponent options', 'Suspense events', 'Teleport SSR']
}
);
