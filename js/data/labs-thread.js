/* Debug labs — category thread. Format: AGENTS.md section 10 (LABS). */
(window.LABS = window.LABS || []).push(
{
  id: 'lab-thread-001',
  category: 'thread',
  title: 'Chuyển tiền giữa hai ví bị treo, jstack báo deadlock',
  level: 'senior',
  scenario: `**Bối cảnh:** Ví điện tử **PayVN** chạy 4 pod Java 21 trên Kubernetes. Mỗi pod xử lý job chuyển tiền nội bộ giữa hai ví bằng một thread pool 8 luồng; số dư ví được cache trong bộ nhớ (object {{Wallet}}) và khoá bằng {{synchronized}} để tránh âm tiền.

**Triệu chứng:** Lúc **14:07 ngày 21/10/2026**, cảnh báo: 6 lệnh chuyển tiền treo quá 30 giây, HTTP 504 ở API đối soát, CPU pod chỉ ~12%. Không có lỗi exception nào trong log, HikariPool vẫn còn connection rảnh, GC bình thường. Restart pod thì hết nhưng khoảng 2 giờ sau tái diễn, mỗi lần một cặp ví khác nhau.

**Dữ liệu thu thập:** Chạy {{jcmd 1 Thread.print -l}} trên pod đang treo (PID 1 trong container), lấy nguyên văn một phần dump. Đội vận hành cũng lấy danh sách 6 giao dịch đang treo: 3 lệnh W1002 → W2077 và 3 lệnh W2077 → W1002, phát sinh gần như cùng thời điểm từ hai batch đối soát khác nhau.`,
  artifacts: [
    {
      name: 'jstack-pod-wallet-7f9c.txt',
      lang: 'text',
      content: `2026-10-21 14:07:52
Full thread dump OpenJDK 64-Bit Server VM (21.0.4+7-LTS-151 mixed mode, sharing):

"Reference Handler" #9 [47] daemon prio=10 os_prio=0 cpu=3.11ms elapsed=51842.07s tid=0x00007f2c8c0e1800 nid=47 waiting on condition  [0x00007f2c3cafe000]
   java.lang.Thread.State: RUNNABLE
        at java.lang.ref.Reference.waitForReferencePendingList(java.base@21.0.4/Native Method)
        at java.lang.ref.Reference.processPendingReferences(java.base@21.0.4/Reference.java:246)
        at java.lang.ref.Reference$ReferenceHandler.run(java.base@21.0.4/Reference.java:208)

"GC Thread#0" os_prio=0 cpu=18221.44ms elapsed=51842.03s tid=0x00007f2c8c1ad800 nid=49 runnable
"G1 Conc#0" os_prio=0 cpu=902.10ms elapsed=51841.99s tid=0x00007f2c8c1b1000 nid=50 runnable

"http-nio-8080-exec-9" #38 [24081] prio=5 os_prio=0 cpu=41.02ms elapsed=611.88s tid=0x00007f2c8c1a1000 nid=24081 waiting on condition  [0x00007f2c3d7f6000]
   java.lang.Thread.State: WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x000000076ac00120> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
        at java.util.concurrent.locks.LockSupport.park(java.base@21.0.4/LockSupport.java:371)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionNode.block(java.base@21.0.4/AbstractQueuedSynchronizer.java:519)
        at java.util.concurrent.ForkJoinPool.unmanagedBlock(java.base@21.0.4/ForkJoinPool.java:3780)
        at java.util.concurrent.ForkJoinPool.managedBlock(java.base@21.0.4/ForkJoinPool.java:3725)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.await(java.base@21.0.4/AbstractQueuedSynchronizer.java:1707)
        at java.util.concurrent.LinkedBlockingQueue.take(java.base@21.0.4/LinkedBlockingQueue.java:435)
        at org.apache.tomcat.util.threads.TaskQueue.take(TaskQueue.java:117)
        at org.apache.tomcat.util.threads.TaskQueue.take(TaskQueue.java:33)
        at org.apache.tomcat.util.threads.ThreadPoolExecutor.getTask(ThreadPoolExecutor.java:1114)
        at org.apache.tomcat.util.threads.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1176)
        at org.apache.tomcat.util.threads.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:659)
        at org.apache.tomcat.util.threads.TaskThread$WrappingRunnable.run(TaskThread.java:63)
        at java.lang.Thread.runWith(java.base@21.0.4/Thread.java:1596)

"HikariPool-1 housekeeper" #27 [72] daemon prio=5 os_prio=0 cpu=88.71ms elapsed=51840.20s tid=0x00007f2c8c19b000 nid=72 waiting on condition  [0x00007f2c3d4f5000]
   java.lang.Thread.State: TIMED_WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x000000076ab2e010> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
        at java.util.concurrent.locks.LockSupport.parkNanos(java.base@21.0.4/LockSupport.java:269)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.awaitNanos(java.base@21.0.4/AbstractQueuedSynchronizer.java:1758)
        at java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(java.base@21.0.4/ScheduledThreadPoolExecutor.java:1182)
        at java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(java.base@21.0.4/ScheduledThreadPoolExecutor.java:899)
        at java.util.concurrent.ThreadPoolExecutor.getTask(java.base@21.0.4/ThreadPoolExecutor.java:1070)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1130)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@21.0.4/ThreadPoolExecutor.java:642)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

"wallet-transfer-3" #41 [24353] prio=5 os_prio=0 cpu=812.44ms elapsed=612.31s tid=0x00007f2c8c1a9800 nid=24353 waiting for monitor entry  [0x00007f2c3d9f7000]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at vn.pay.wallet.WalletService.transfer(WalletService.java:88)
        - waiting to lock <0x000000076ab2d8f8> (a vn.pay.wallet.Wallet)
        - locked <0x000000076ab2d0a0> (a vn.pay.wallet.Wallet)
        at vn.pay.wallet.TransferJob.run(TransferJob.java:41)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1144)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@21.0.4/ThreadPoolExecutor.java:642)
        at java.lang.Thread.runWith(java.base@21.0.4/Thread.java:1596)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

   Locked ownable synchronizers:
        - <0x000000076ac00418> (a java.util.concurrent.ThreadPoolExecutor$Worker)

"wallet-transfer-7" #45 [24361] prio=5 os_prio=0 cpu=798.02ms elapsed=612.28s tid=0x00007f2c8c1b2800 nid=24361 waiting for monitor entry  [0x00007f2c3dbf8000]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at vn.pay.wallet.WalletService.transfer(WalletService.java:88)
        - waiting to lock <0x000000076ab2d0a0> (a vn.pay.wallet.Wallet)
        - locked <0x000000076ab2d8f8> (a vn.pay.wallet.Wallet)
        at vn.pay.wallet.TransferJob.run(TransferJob.java:41)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1144)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@21.0.4/ThreadPoolExecutor.java:642)
        at java.lang.Thread.runWith(java.base@21.0.4/Thread.java:1596)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

   Locked ownable synchronizers:
        - <0x000000076ac004f0> (a java.util.concurrent.ThreadPoolExecutor$Worker)

"wallet-transfer-5" #43 [24357] prio=5 os_prio=0 cpu=20.40ms elapsed=612.30s tid=0x00007f2c8c1ae000 nid=24357 waiting on condition  [0x00007f2c3daf8000]
   java.lang.Thread.State: WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x000000076ac00290> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
        at java.util.concurrent.locks.LockSupport.park(java.base@21.0.4/LockSupport.java:371)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.await(java.base@21.0.4/AbstractQueuedSynchronizer.java:1707)
        at java.util.concurrent.LinkedBlockingQueue.take(java.base@21.0.4/LinkedBlockingQueue.java:435)
        at java.util.concurrent.ThreadPoolExecutor.getTask(java.base@21.0.4/ThreadPoolExecutor.java:1070)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1130)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@21.0.4/ThreadPoolExecutor.java:642)
        at java.lang.Thread.runWith(java.base@21.0.4/Thread.java:1596)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

   Locked ownable synchronizers:
        - None

"Common-Cleaner" #19 [54] daemon prio=8 os_prio=0 cpu=12.22ms elapsed=51841.55s tid=0x00007f2c8c1a4000 nid=54 in Object.wait()  [0x00007f2c3d1f4000]
   java.lang.Thread.State: TIMED_WAITING (on object monitor)
        at java.lang.Object.wait0(java.base@21.0.4/Native Method)
        at java.lang.Object.wait(java.base@21.0.4/Object.java:366)
        at java.lang.ref.ReferenceQueue.remove0(java.base@21.0.4/ReferenceQueue.java:128)
        at java.lang.ref.ReferenceQueue.remove(java.base@21.0.4/ReferenceQueue.java:172)
        - locked <0x000000076a8e1b40> (a java.lang.ref.ReferenceQueue$Lock)
        at jdk.internal.ref.CleanerImpl.run(java.base@21.0.4/CleanerImpl.java:140)
        at java.lang.Thread.runWith(java.base@21.0.4/Thread.java:1596)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)
        at jdk.internal.misc.InnocuousThread.run(java.base@21.0.4/InnocuousThread.java:186)

   Locked ownable synchronizers:
        - None

JNI global refs: 38, weak refs: 0

Found one Java-level deadlock:
=============================
"wallet-transfer-3":
  waiting to lock monitor 0x00007f2c64004b00 (object 0x000000076ab2d8f8, a vn.pay.wallet.Wallet),
  which is held by "wallet-transfer-7"

"wallet-transfer-7":
  waiting to lock monitor 0x00007f2c64004a80 (object 0x000000076ab2d0a0, a vn.pay.wallet.Wallet),
  which is held by "wallet-transfer-3"

Java stack information for the threads listed above:
===================================================
"wallet-transfer-3":
        at vn.pay.wallet.WalletService.transfer(WalletService.java:88)
        - waiting to lock <0x000000076ab2d8f8> (a vn.pay.wallet.Wallet)
        - locked <0x000000076ab2d0a0> (a vn.pay.wallet.Wallet)
        at vn.pay.wallet.TransferJob.run(TransferJob.java:41)
"wallet-transfer-7":
        at vn.pay.wallet.WalletService.transfer(WalletService.java:88)
        - waiting to lock <0x000000076ab2d0a0> (a vn.pay.wallet.Wallet)
        - locked <0x000000076ab2d8f8> (a vn.pay.wallet.Wallet)
        at vn.pay.wallet.TransferJob.run(TransferJob.java:41)

Found 1 deadlock.`
    }
  ],
  questions: [
    'Nguyên nhân gốc của việc treo là gì? Dẫn chứng cụ thể từ artifact (tên thread, địa chỉ lock, số dòng).',
    'Tại sao CPU thấp, pool connection còn rảnh mà API vẫn timeout? Điều đó nói gì về việc chỉ nhìn metric tài nguyên?',
    'Bạn sửa thế nào trong 30 phút tới để không mất giao dịch, và sửa gì trong sprint tới để không tái diễn?'
  ],
  hints: [
    'Đọc kỹ hai thread có trạng thái BLOCKED (on object monitor): mỗi thread đang giữ lock nào và chờ lock nào? Hai địa chỉ <0x...> có đối xứng nhau không?',
    'jstack in ra nguyên một mục "Found one Java-level deadlock" — nhưng hãy tự chứng minh bằng 4 dòng - waiting to lock / - locked, đừng chỉ trích kết luận của công cụ.',
    'Nếu hai batch chạy ngược chiều (A→B và B→A) cùng lúc thì thứ tự khoá phụ thuộc vào tham số đầu vào. Làm sao để thứ tự khoá chỉ phụ thuộc vào dữ liệu, không phụ thuộc vào chiều giao dịch?'
  ],
  answer: `**Tóm tắt:** Đây là deadlock AB-BA kinh điển. Thread {{wallet-transfer-3}} giữ monitor của ví W1002 (0x000000076ab2d0a0) và chờ monitor của ví W2077 (0x000000076ab2d8f8); thread {{wallet-transfer-7}} giữ đúng lock W2077 và chờ đúng lock W1002. Hai thread chờ nhau vô hạn nên mọi giao dịch dùng cặp ví đó treo, trong khi CPU và connection pool vẫn "bình thường" — vì deadlock là chờ, không phải quay vòng.

### Nguyên nhân gốc

{{WalletService.transfer}} khoá hai object {{Wallet}} theo đúng thứ tự tham số truyền vào:

~~~java
// WalletService.java — phiên bản lỗi
public void transfer(Wallet from, Wallet to, long amount) {
    synchronized (from) {              // dòng 86: khoá ví nguồn
        synchronized (to) {            // dòng 88: khoá ví đích
            if (from.balance < amount) throw new InsufficientFunds();
            from.balance -= amount;
            to.balance   += amount;
        }
    }
}
~~~

Với lệnh W1002 → W2077, thứ tự khoá là (W1002, W2077). Với lệnh W2077 → W1002, thứ tự là (W2077, W1002). Khi hai lệnh chạy đồng thời và mỗi bên đã vào được lớp {{synchronized}} ngoài, mỗi thread giữ một lock và chờ lock còn lại. JVM không có cơ chế phá deadlock tự động: monitor không có timeout, nên hai thread nằm đó mãi cho tới khi process chết.

Điểm khiến lỗi "âm thầm" là batch đối soát chạy hai chiều: batch hoàn tiền (W2077 → W1002) và batch thu hộ (W1002 → W2077) trùng cửa sổ thời gian. Chỉ cần hai job cùng chạm một cặp ví là đủ. Đây là lý do restart thì hết nhưng 2 giờ sau lại tái diễn ở cặp ví khác.

### Dẫn chứng

- {{"wallet-transfer-3" ... waiting for monitor entry ... BLOCKED (on object monitor)}} — BLOCKED nghĩa là đang xếp hàng vào monitor, không phải đang chờ IO.
- Dòng {{waiting to lock <0x000000076ab2d8f8>}} + {{locked <0x000000076ab2d0a0>}} của thread 3.
- Dòng {{waiting to lock <0x000000076ab2d0a0>}} + {{locked <0x000000076ab2d8f8>}} của thread 7 — đảo đúng hai địa chỉ.
- Mục {{Found one Java-level deadlock}} liệt kê chính xác hai thread và hai monitor {{0x00007f2c64004b00}} / {{0x00007f2c64004a80}}.
- Các thread khác ({{http-nio-8080-exec-9}}, {{HikariPool-1 housekeeper}}, {{GC Thread#0}}) đều WAITING/TIMED_WAITING hoặc rảnh — đó là "nhiễu", không liên quan.

Vì sao CPU thấp, pool rảnh mà vẫn timeout: thread bị BLOCKED không tiêu CPU (chúng bị park trong hàng đợi monitor của JVM), và mỗi job chỉ mở transaction sau khi đã có đủ hai lock nên không giữ connection. Metric tài nguyên vì thế đẹp, chỉ có latency và số thread BLOCKED là xấu. Nếu chỉ alert theo CPU/RAM/connection thì sự cố này vô hình.

### Cách sửa

**Ngắn hạn (trong 30 phút):**
1. Không kill thread (Java không hỗ trợ an toàn). Lấy dump lưu bằng chứng, rồi rolling restart pod bị treo để giải phóng monitor. Trước khi restart phải chặn batch đối soát hai chiều để tránh tái diễn ngay.
2. Kiểm tra tính nhất quán số dư: vì hai lệnh có thể đã trừ ở một ví mà chưa cộng ở ví kia nếu code ghi từng bước, phải chạy job đối soát và hoàn tiền cho các giao dịch ở trạng thái PENDING. Tốt nhất là ghi cả hai bút toán trong **một transaction DB** hoặc dùng outbox để có thể phát lại.
3. Nếu có cờ feature, tạm tắt chuyển tiền nội bộ giữa hai ví trong cùng một batch, chuyển sang xử lý tuần tự theo cặp ví.

**Dài hạn (sprint tới):** chuẩn hoá thứ tự khoá theo một khoá duy nhất có thứ tự toàn cục, ví dụ theo {{walletId}} tăng dần:

~~~java
public void transfer(long fromId, long toId, long amount) {
    Wallet first  = repo.get(Math.min(fromId, toId));   // luôn khoá id nhỏ trước
    Wallet second = repo.get(Math.max(fromId, toId));
    synchronized (first) {
        synchronized (second) {
            Wallet from = first.id == fromId ? first : second;
            Wallet to   = first.id == toId   ? first : second;
            doTransfer(from, to, amount);
        }
    }
}
~~~

Cách này biến đồ thị chờ thành DAG nên không thể có chu trình. Các lựa chọn khác, cân nhắc theo kiến trúc:

| Cách | Ưu | Nhược |
|---|---|---|
| Khoá theo thứ tự id | Đơn giản, không cần thư viện | Vẫn là khoá trong JVM, không bảo vệ khi có nhiều pod |
| Một khoá duy nhất cho toàn bộ ví | Không deadlock | Throughput sụt mạnh, nút thắt |
| Khoá ở DB: {{SELECT ... FOR UPDATE}} theo thứ tự id | Đúng khi nhiều instance | Tăng tải DB, cần index và transaction ngắn |
| Optimistic locking (cột version) + retry | Không giữ lock lâu, scale tốt | Cần retry idempotent, có thể đói khi tranh chấp cao |
| Distributed lock (Redisson) theo cặp id đã sắp | Đúng đa pod | Thêm Redis vào đường tới hạn, cần xử lý lock hết hạn |

Với hệ thống ví, hướng bền vững nhất là **khoá ở tầng DB theo thứ tự id** và giữ transaction thật ngắn, còn cache trong bộ nhớ chỉ để đọc. Khoá JVM chỉ đúng khi mỗi ví chỉ do đúng một pod xử lý (sharding theo ví), nếu không thì nó chỉ là "may mắn" khi scale ngang.

### Phòng ngừa

- Bật phát hiện deadlock định kỳ bằng {{ThreadMXBean.findDeadlockedThreads()}} và log/alert; hoặc chạy {{jcmd <pid> Thread.print -l}} theo lịch và grep {{Found .* deadlock}}.
- Alert theo số thread BLOCKED (BLOCKED > 0 kéo dài > 60s) chứ không chỉ CPU. Với Micrometer/Prometheus là metric {{jvm_threads_states_threads}} với tag {{state=blocked}}.
- Test tải có chủ đích hai chiều trên cùng cặp ví (k6/JMH) trong CI hiệu năng; deadlock thường chỉ lộ ra khi đúng thứ tự thời gian.
- Review code: bất kỳ chỗ nào có hai {{synchronized}} lồng nhau hoặc hai lock khác loại phải có comment nêu rõ thứ tự khoá.

> Senior tip: Trong hệ thống ví/thanh toán, đừng bao giờ để thứ tự khoá phụ thuộc vào tham số nghiệp vụ (ai chuyển cho ai). Một mẹo thực dụng: viết hàm {{lockPair(long a, long b)}} trả về mảng đã sắp xếp và cấm mọi chỗ khác tự khoá hai object. Ngoài ra, deadlock JVM thường đi kèm deadlock DB (hai transaction khoá hai row ngược thứ tự) — nếu thấy row lock wait trong {{pg_stat_activity}} cùng lúc với jstack deadlock thì đó là cùng một lỗi thiết kế, không phải hai sự cố.`,
  rubric: [
    'Chỉ ra đúng deadlock AB-BA giữa wallet-transfer-3 và wallet-transfer-7, nêu đúng hai địa chỉ lock <0x000000076ab2d0a0> và <0x000000076ab2d8f8> cùng chiều giữ/chờ.',
    'Giải thích vì sao CPU thấp và connection pool rảnh nhưng API vẫn timeout (thread BLOCKED không tiêu CPU, không giữ connection).',
    'Đề xuất sửa bằng thứ tự khoá nhất quán (sắp xếp theo id) hoặc khoá ở DB, kèm cách xử lý dữ liệu PENDING/đối soát sau restart.',
    'Nêu biện pháp phòng ngừa: phát hiện deadlock bằng ThreadMXBean/jcmd, alert theo số thread BLOCKED, test tải hai chiều.'
  ],
  tags: ['deadlock', 'jstack', 'synchronized', 'lock-ordering', 'wallet']
},
{
  id: 'lab-thread-002',
  category: 'thread',
  title: 'Flash sale 00:00 — HikariPool cạn, 41 thread chờ getConnection',
  level: 'senior',
  scenario: `**Bối cảnh:** **PayVN Checkout** là service Spring Boot 3.4 (Java 21, Hibernate 6) xử lý thanh toán. Cấu hình: Tomcat {{max-threads=200}}, Hikari {{maximum-pool-size=20}}, {{connection-timeout=30000}}ms, PostgreSQL 15. Đêm **22/10/2026** có flash sale 00:00; lượng đơn tăng 12 lần trong 90 giây.

**Triệu chứng:** Từ **00:03**, tỉ lệ lỗi HTTP 500 tăng vọt, log đầy dòng {{Connection is not available, request timed out after 30000ms}}. CPU pod ~35%, RAM bình thường, PostgreSQL chỉ ~20% CPU và không có lock wait đáng kể. Số liệu actuator lúc 00:03:10: {{hikaricp.connections.active=20}}, {{idle=0}}, {{pending=41}}. Đối tác ngân hàng vừa triển khai bản mới và API xác nhận chuyển khoản của họ chậm bất thường (p99 từ 300ms lên 28–30 giây).

**Dữ liệu thu thập:** Thread dump lúc 00:03:17 và trích log JSON của pod (đã bật {{leak-detection-threshold=20000}} tạm thời để điều tra).`,
  artifacts: [
    {
      name: 'jstack-hikari.txt',
      lang: 'text',
      content: `2026-10-22 00:03:17
Full thread dump OpenJDK 64-Bit Server VM (21.0.4+7-LTS-151 mixed mode, sharing):

"http-nio-8080-exec-57" #118 [35345] prio=5 os_prio=0 cpu=1021.55ms elapsed=18422.09s tid=0x00007fa1b01c2000 nid=35345 waiting on condition  [0x00007fa18f7f6000]
   java.lang.Thread.State: TIMED_WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x000000076b1e2210> (a java.util.concurrent.SynchronousQueue$Transferer)
        at java.util.concurrent.locks.LockSupport.parkNanos(java.base@21.0.4/LockSupport.java:269)
        at java.util.concurrent.LinkedTransferQueue$DualNode.await(java.base@21.0.4/LinkedTransferQueue.java:458)
        at java.util.concurrent.LinkedTransferQueue.xfer(java.base@21.0.4/LinkedTransferQueue.java:613)
        at java.util.concurrent.SynchronousQueue.xfer(java.base@21.0.4/SynchronousQueue.java:235)
        at java.util.concurrent.SynchronousQueue.poll(java.base@21.0.4/SynchronousQueue.java:347)
        at com.zaxxer.hikari.util.ConcurrentBag.borrow(ConcurrentBag.java:159)
        at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:162)
        at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:144)
        at com.zaxxer.hikari.HikariDataSource.getConnection(HikariDataSource.java:112)
        at org.hibernate.engine.jdbc.connections.internal.DatasourceConnectionProviderImpl.getConnection(DatasourceConnectionProviderImpl.java:122)
        at org.hibernate.internal.NonContextualJdbcConnectionAccess.obtainConnection(NonContextualJdbcConnectionAccess.java:46)
        at org.hibernate.resource.jdbc.internal.LogicalConnectionManagedImpl.acquireConnectionIfNeeded(LogicalConnectionManagedImpl.java:126)
        at org.hibernate.resource.jdbc.internal.LogicalConnectionManagedImpl.getPhysicalConnection(LogicalConnectionManagedImpl.java:156)
        at org.hibernate.resource.jdbc.internal.LogicalConnectionManagedImpl.begin(LogicalConnectionManagedImpl.java:286)
        at org.hibernate.engine.transaction.internal.TransactionImpl.begin(TransactionImpl.java:83)
        at org.springframework.orm.jpa.vendor.HibernateJpaDialect.beginTransaction(HibernateJpaDialect.java:176)
        at org.springframework.orm.jpa.JpaTransactionManager.doBegin(JpaTransactionManager.java:420)
        at org.springframework.transaction.support.AbstractPlatformTransactionManager.startTransaction(AbstractPlatformTransactionManager.java:532)
        at org.springframework.transaction.support.AbstractPlatformTransactionManager.getTransaction(AbstractPlatformTransactionManager.java:405)
        at org.springframework.transaction.interceptor.TransactionAspectSupport.createTransactionIfNecessary(TransactionAspectSupport.java:610)
        at org.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:378)
        at org.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)
        at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)
        at org.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:720)
        at vn.pay.payment.PaymentService$$SpringCGLIB$$0.hold(<generated>)
        at vn.pay.payment.PaymentController.hold(PaymentController.java:52)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)

"http-nio-8080-exec-63" #124 [35371] prio=5 os_prio=0 cpu=887.10ms elapsed=18410.52s tid=0x00007fa1b01d4000 nid=35371 waiting on condition  [0x00007fa18f9f7000]
   java.lang.Thread.State: TIMED_WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x000000076b1e2210> (a java.util.concurrent.SynchronousQueue$Transferer)
        at java.util.concurrent.locks.LockSupport.parkNanos(java.base@21.0.4/LockSupport.java:269)
        at java.util.concurrent.LinkedTransferQueue$DualNode.await(java.base@21.0.4/LinkedTransferQueue.java:458)
        at java.util.concurrent.LinkedTransferQueue.xfer(java.base@21.0.4/LinkedTransferQueue.java:613)
        at java.util.concurrent.SynchronousQueue.xfer(java.base@21.0.4/SynchronousQueue.java:235)
        at java.util.concurrent.SynchronousQueue.poll(java.base@21.0.4/SynchronousQueue.java:347)
        at com.zaxxer.hikari.util.ConcurrentBag.borrow(ConcurrentBag.java:159)
        at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:162)
        at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:144)
        at com.zaxxer.hikari.HikariDataSource.getConnection(HikariDataSource.java:112)
        at org.hibernate.engine.jdbc.connections.internal.DatasourceConnectionProviderImpl.getConnection(DatasourceConnectionProviderImpl.java:122)
        at org.hibernate.internal.NonContextualJdbcConnectionAccess.obtainConnection(NonContextualJdbcConnectionAccess.java:46)
        at org.hibernate.resource.jdbc.internal.LogicalConnectionManagedImpl.acquireConnectionIfNeeded(LogicalConnectionManagedImpl.java:126)
        at org.hibernate.resource.jdbc.internal.LogicalConnectionManagedImpl.getPhysicalConnection(LogicalConnectionManagedImpl.java:156)
        at org.hibernate.resource.jdbc.internal.LogicalConnectionManagedImpl.begin(LogicalConnectionManagedImpl.java:286)
        at org.hibernate.engine.transaction.internal.TransactionImpl.begin(TransactionImpl.java:83)
        at org.springframework.orm.jpa.vendor.HibernateJpaDialect.beginTransaction(HibernateJpaDialect.java:176)
        at org.springframework.orm.jpa.JpaTransactionManager.doBegin(JpaTransactionManager.java:420)
        at org.springframework.transaction.support.AbstractPlatformTransactionManager.startTransaction(AbstractPlatformTransactionManager.java:532)
        at org.springframework.transaction.support.AbstractPlatformTransactionManager.getTransaction(AbstractPlatformTransactionManager.java:405)
        at org.springframework.transaction.interceptor.TransactionAspectSupport.createTransactionIfNecessary(TransactionAspectSupport.java:610)
        at org.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:378)
        at org.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)
        at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)
        at org.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:720)
        at vn.pay.payment.PaymentService$$SpringCGLIB$$0.hold(<generated>)
        at vn.pay.payment.PaymentController.hold(PaymentController.java:52)

"http-nio-8080-exec-71" #132 [35409] prio=5 os_prio=0 cpu=764.03ms elapsed=18398.71s tid=0x00007fa1b01e6000 nid=35409 waiting on condition  [0x00007fa18fbf8000]
   java.lang.Thread.State: TIMED_WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x000000076b1e2210> (a java.util.concurrent.SynchronousQueue$Transferer)
        at java.util.concurrent.locks.LockSupport.parkNanos(java.base@21.0.4/LockSupport.java:269)
        at java.util.concurrent.LinkedTransferQueue$DualNode.await(java.base@21.0.4/LinkedTransferQueue.java:458)
        at java.util.concurrent.LinkedTransferQueue.xfer(java.base@21.0.4/LinkedTransferQueue.java:613)
        at java.util.concurrent.SynchronousQueue.xfer(java.base@21.0.4/SynchronousQueue.java:235)
        at java.util.concurrent.SynchronousQueue.poll(java.base@21.0.4/SynchronousQueue.java:347)
        at com.zaxxer.hikari.util.ConcurrentBag.borrow(ConcurrentBag.java:159)
        at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:162)
        at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:144)
        at com.zaxxer.hikari.HikariDataSource.getConnection(HikariDataSource.java:112)
        at org.hibernate.engine.jdbc.connections.internal.DatasourceConnectionProviderImpl.getConnection(DatasourceConnectionProviderImpl.java:122)
        at org.hibernate.internal.NonContextualJdbcConnectionAccess.obtainConnection(NonContextualJdbcConnectionAccess.java:46)
        at org.hibernate.resource.jdbc.internal.LogicalConnectionManagedImpl.acquireConnectionIfNeeded(LogicalConnectionManagedImpl.java:126)
        at org.hibernate.resource.jdbc.internal.LogicalConnectionManagedImpl.getPhysicalConnection(LogicalConnectionManagedImpl.java:156)
        at org.hibernate.resource.jdbc.internal.LogicalConnectionManagedImpl.begin(LogicalConnectionManagedImpl.java:286)
        at org.hibernate.engine.transaction.internal.TransactionImpl.begin(TransactionImpl.java:83)
        at org.springframework.orm.jpa.vendor.HibernateJpaDialect.beginTransaction(HibernateJpaDialect.java:176)
        at org.springframework.orm.jpa.JpaTransactionManager.doBegin(JpaTransactionManager.java:420)
        at org.springframework.transaction.support.AbstractPlatformTransactionManager.startTransaction(AbstractPlatformTransactionManager.java:532)
        at org.springframework.transaction.support.AbstractPlatformTransactionManager.getTransaction(AbstractPlatformTransactionManager.java:405)
        at org.springframework.transaction.interceptor.TransactionAspectSupport.createTransactionIfNecessary(TransactionAspectSupport.java:610)
        at org.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:378)
        at org.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)
        at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)
        at org.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:720)
        at vn.pay.payment.PaymentService$$SpringCGLIB$$0.hold(<generated>)
        at vn.pay.payment.PaymentController.hold(PaymentController.java:52)

"http-nio-8080-exec-42" #103 [35281] prio=5 os_prio=0 cpu=2310.41ms elapsed=18435.60s tid=0x00007fa1b01b8000 nid=35281 runnable  [0x00007fa18f4f4000]
   java.lang.Thread.State: RUNNABLE
        at sun.nio.ch.Net.poll(java.base@21.0.4/Native Method)
        at sun.nio.ch.NioSocketImpl.park(java.base@21.0.4/NioSocketImpl.java:191)
        at sun.nio.ch.NioSocketImpl.timedRead(java.base@21.0.4/NioSocketImpl.java:280)
        at sun.nio.ch.NioSocketImpl.implRead(java.base@21.0.4/NioSocketImpl.java:304)
        at sun.nio.ch.NioSocketImpl.read(java.base@21.0.4/NioSocketImpl.java:346)
        at sun.nio.ch.NioSocketImpl$1.read(java.base@21.0.4/NioSocketImpl.java:796)
        at java.net.Socket$SocketInputStream.read(java.base@21.0.4/Socket.java:1099)
        at sun.security.ssl.SSLSocketInputRecord.read(java.base@21.0.4/SSLSocketInputRecord.java:489)
        at sun.security.ssl.SSLSocketInputRecord.readHeader(java.base@21.0.4/SSLSocketInputRecord.java:483)
        at sun.security.ssl.SSLSocketInputRecord.bytesInCompletePacket(java.base@21.0.4/SSLSocketInputRecord.java:70)
        at sun.security.ssl.SSLSocketImpl.readApplicationRecord(java.base@21.0.4/SSLSocketImpl.java:1461)
        at sun.security.ssl.SSLSocketImpl$AppInputStream.read(java.base@21.0.4/SSLSocketImpl.java:1066)
        at org.apache.hc.core5.http.impl.io.SessionInputBufferImpl.fillBuffer(SessionInputBufferImpl.java:149)
        at org.apache.hc.core5.http.impl.io.SessionInputBufferImpl.readLine(SessionInputBufferImpl.java:280)
        at org.apache.hc.core5.http.impl.io.AbstractMessageParser.parse(AbstractMessageParser.java:247)
        at org.apache.hc.core5.http.impl.io.DefaultBHttpClientConnection.receiveResponseHeader(DefaultBHttpClientConnection.java:333)
        at org.apache.hc.core5.http.impl.io.HttpRequestExecutor.execute(HttpRequestExecutor.java:197)
        at org.apache.hc.client5.http.impl.classic.InternalHttpClient.doExecute(InternalHttpClient.java:174)
        at org.apache.hc.client5.http.impl.classic.CloseableHttpClient.execute(CloseableHttpClient.java:87)
        at org.springframework.http.client.HttpComponentsClientHttpRequest.executeInternal(HttpComponentsClientHttpRequest.java:95)
        at org.springframework.web.client.RestTemplate.doExecute(RestTemplate.java:889)
        at vn.pay.payment.BankClient.notifyTransfer(BankClient.java:88)
        at vn.pay.payment.PaymentService.confirmAndNotify(PaymentService.java:131)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)
        at java.lang.reflect.Method.invoke(java.base@21.0.4/Method.java:580)
        at org.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:355)
        at org.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:392)
        at org.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)
        at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)
        at org.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:720)
        at vn.pay.payment.PaymentService$$SpringCGLIB$$0.confirmAndNotify(<generated>)
        at vn.pay.payment.PaymentController.confirm(PaymentController.java:61)

"http-nio-8080-exec-44" #105 [35297] prio=5 os_prio=0 cpu=2218.77ms elapsed=18433.02s tid=0x00007fa1b01be000 nid=35297 runnable  [0x00007fa18f5f5000]
   java.lang.Thread.State: RUNNABLE
        at sun.nio.ch.Net.poll(java.base@21.0.4/Native Method)
        at sun.nio.ch.NioSocketImpl.park(java.base@21.0.4/NioSocketImpl.java:191)
        at sun.nio.ch.NioSocketImpl.timedRead(java.base@21.0.4/NioSocketImpl.java:280)
        at sun.nio.ch.NioSocketImpl.implRead(java.base@21.0.4/NioSocketImpl.java:304)
        at sun.nio.ch.NioSocketImpl.read(java.base@21.0.4/NioSocketImpl.java:346)
        at sun.nio.ch.NioSocketImpl$1.read(java.base@21.0.4/NioSocketImpl.java:796)
        at java.net.Socket$SocketInputStream.read(java.base@21.0.4/Socket.java:1099)
        at sun.security.ssl.SSLSocketInputRecord.read(java.base@21.0.4/SSLSocketInputRecord.java:489)
        at sun.security.ssl.SSLSocketInputRecord.readHeader(java.base@21.0.4/SSLSocketInputRecord.java:483)
        at sun.security.ssl.SSLSocketInputRecord.bytesInCompletePacket(java.base@21.0.4/SSLSocketInputRecord.java:70)
        at sun.security.ssl.SSLSocketImpl.readApplicationRecord(java.base@21.0.4/SSLSocketImpl.java:1461)
        at sun.security.ssl.SSLSocketImpl$AppInputStream.read(java.base@21.0.4/SSLSocketImpl.java:1066)
        at org.apache.hc.core5.http.impl.io.SessionInputBufferImpl.fillBuffer(SessionInputBufferImpl.java:149)
        at org.apache.hc.core5.http.impl.io.SessionInputBufferImpl.readLine(SessionInputBufferImpl.java:280)
        at org.apache.hc.core5.http.impl.io.AbstractMessageParser.parse(AbstractMessageParser.java:247)
        at org.apache.hc.core5.http.impl.io.DefaultBHttpClientConnection.receiveResponseHeader(DefaultBHttpClientConnection.java:333)
        at org.apache.hc.core5.http.impl.io.HttpRequestExecutor.execute(HttpRequestExecutor.java:197)
        at org.apache.hc.client5.http.impl.classic.InternalHttpClient.doExecute(InternalHttpClient.java:174)
        at org.apache.hc.client5.http.impl.classic.CloseableHttpClient.execute(CloseableHttpClient.java:87)
        at org.springframework.http.client.HttpComponentsClientHttpRequest.executeInternal(HttpComponentsClientHttpRequest.java:95)
        at org.springframework.web.client.RestTemplate.doExecute(RestTemplate.java:889)
        at vn.pay.payment.BankClient.notifyTransfer(BankClient.java:88)
        at vn.pay.payment.PaymentService.confirmAndNotify(PaymentService.java:131)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)
        at java.lang.reflect.Method.invoke(java.base@21.0.4/Method.java:580)
        at org.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:355)
        at org.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:392)
        at org.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)
        at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)
        at org.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:720)
        at vn.pay.payment.PaymentService$$SpringCGLIB$$0.confirmAndNotify(<generated>)
        at vn.pay.payment.PaymentController.confirm(PaymentController.java:61)

"http-nio-8080-exec-46" #107 [35313] prio=5 os_prio=0 cpu=2105.62ms elapsed=18430.11s tid=0x00007fa1b01c4000 nid=35313 runnable  [0x00007fa18f6f6000]
   java.lang.Thread.State: RUNNABLE
        at sun.nio.ch.Net.poll(java.base@21.0.4/Native Method)
        at sun.nio.ch.NioSocketImpl.park(java.base@21.0.4/NioSocketImpl.java:191)
        at sun.nio.ch.NioSocketImpl.timedRead(java.base@21.0.4/NioSocketImpl.java:280)
        at sun.nio.ch.NioSocketImpl.implRead(java.base@21.0.4/NioSocketImpl.java:304)
        at sun.nio.ch.NioSocketImpl.read(java.base@21.0.4/NioSocketImpl.java:346)
        at sun.nio.ch.NioSocketImpl$1.read(java.base@21.0.4/NioSocketImpl.java:796)
        at java.net.Socket$SocketInputStream.read(java.base@21.0.4/Socket.java:1099)
        at sun.security.ssl.SSLSocketInputRecord.read(java.base@21.0.4/SSLSocketInputRecord.java:489)
        at sun.security.ssl.SSLSocketInputRecord.readHeader(java.base@21.0.4/SSLSocketInputRecord.java:483)
        at sun.security.ssl.SSLSocketInputRecord.bytesInCompletePacket(java.base@21.0.4/SSLSocketInputRecord.java:70)
        at sun.security.ssl.SSLSocketImpl.readApplicationRecord(java.base@21.0.4/SSLSocketImpl.java:1461)
        at sun.security.ssl.SSLSocketImpl$AppInputStream.read(java.base@21.0.4/SSLSocketImpl.java:1066)
        at org.apache.hc.core5.http.impl.io.SessionInputBufferImpl.fillBuffer(SessionInputBufferImpl.java:149)
        at org.apache.hc.core5.http.impl.io.SessionInputBufferImpl.readLine(SessionInputBufferImpl.java:280)
        at org.apache.hc.core5.http.impl.io.AbstractMessageParser.parse(AbstractMessageParser.java:247)
        at org.apache.hc.core5.http.impl.io.DefaultBHttpClientConnection.receiveResponseHeader(DefaultBHttpClientConnection.java:333)
        at org.apache.hc.core5.http.impl.io.HttpRequestExecutor.execute(HttpRequestExecutor.java:197)
        at org.apache.hc.client5.http.impl.classic.InternalHttpClient.doExecute(InternalHttpClient.java:174)
        at org.apache.hc.client5.http.impl.classic.CloseableHttpClient.execute(CloseableHttpClient.java:87)
        at org.springframework.http.client.HttpComponentsClientHttpRequest.executeInternal(HttpComponentsClientHttpRequest.java:95)
        at org.springframework.web.client.RestTemplate.doExecute(RestTemplate.java:889)
        at vn.pay.payment.BankClient.notifyTransfer(BankClient.java:88)
        at vn.pay.payment.PaymentService.confirmAndNotify(PaymentService.java:131)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)
        at java.lang.reflect.Method.invoke(java.base@21.0.4/Method.java:580)
        at org.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:355)
        at org.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:392)
        at org.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)
        at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)
        at org.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:720)
        at vn.pay.payment.PaymentService$$SpringCGLIB$$0.confirmAndNotify(<generated>)
        at vn.pay.payment.PaymentController.confirm(PaymentController.java:61)

"HikariPool-1 housekeeper" #52 [34545] daemon prio=5 os_prio=0 cpu=311.08ms elapsed=18440.20s tid=0x00007fa1b013d000 nid=34545 waiting on condition  [0x00007fa18f0ef000]
   java.lang.Thread.State: TIMED_WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x000000076b1e2480> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
        at java.util.concurrent.locks.LockSupport.parkNanos(java.base@21.0.4/LockSupport.java:269)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.awaitNanos(java.base@21.0.4/AbstractQueuedSynchronizer.java:1758)
        at java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(java.base@21.0.4/ScheduledThreadPoolExecutor.java:1182)
        at java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(java.base@21.0.4/ScheduledThreadPoolExecutor.java:899)
        at java.util.concurrent.ThreadPoolExecutor.getTask(java.base@21.0.4/ThreadPoolExecutor.java:1070)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1130)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@21.0.4/ThreadPoolExecutor.java:642)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

"pool-3-thread-1" #61 [34577] prio=5 os_prio=0 cpu=1402.88ms elapsed=18439.90s tid=0x00007fa1b0162000 nid=34577 waiting on condition  [0x00007fa18f1f0000]
   java.lang.Thread.State: TIMED_WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x000000076b1e2a58> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
        at java.util.concurrent.locks.LockSupport.parkNanos(java.base@21.0.4/LockSupport.java:269)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.awaitNanos(java.base@21.0.4/AbstractQueuedSynchronizer.java:1758)
        at java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(java.base@21.0.4/ScheduledThreadPoolExecutor.java:1182)
        at java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(java.base@21.0.4/ScheduledThreadPoolExecutor.java:899)
        at java.util.concurrent.ThreadPoolExecutor.getTask(java.base@21.0.4/ThreadPoolExecutor.java:1070)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1130)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@21.0.4/ThreadPoolExecutor.java:642)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)`
    },
    {
      name: 'payment-pod.log',
      lang: 'text',
      content: `{"@timestamp":"2026-10-22T00:02:58.112+07:00","level":"INFO","logger":"vn.pay.payment.PaymentController","thread":"http-nio-8080-exec-42","message":"confirm order=OD-99213 wallet=W58120 amount=1290000"}
{"@timestamp":"2026-10-22T00:03:04.512+07:00","level":"WARN","logger":"com.zaxxer.hikari.pool.HikariPool","thread":"HikariPool-1 housekeeper","message":"HikariPool-1 - Thread starvation or clock leap detected (housekeeper delta=48s913ms)."}
{"@timestamp":"2026-10-22T00:03:10.003+07:00","level":"WARN","logger":"vn.pay.payment.ops.PoolStatsReporter","thread":"scheduling-1","message":"HikariPool-1 stats total=20 active=20 idle=0 waiting=41"}
{"@timestamp":"2026-10-22T00:03:10.521+07:00","level":"ERROR","logger":"vn.pay.payment.PaymentController","thread":"http-nio-8080-exec-88","message":"hold failed: Unable to acquire JDBC Connection","exception":"java.sql.SQLTransientConnectionException: HikariPool-1 - Connection is not available, request timed out after 30000ms"}
{"@timestamp":"2026-10-22T00:03:12.404+07:00","level":"INFO","logger":"vn.pay.payment.BankClient","thread":"http-nio-8080-exec-42","message":"POST https://api.bankpartner.vn/v2/transfers/notify order=OD-99213 idem=9f2c... start"}
{"@timestamp":"2026-10-22T00:03:20.004+07:00","level":"WARN","logger":"vn.pay.payment.ops.PoolStatsReporter","thread":"scheduling-1","message":"HikariPool-1 stats total=20 active=20 idle=0 waiting=43"}
{"@timestamp":"2026-10-22T00:03:32.118+07:00","level":"WARN","logger":"com.zaxxer.hikari.pool.ProxyLeakTask","thread":"HikariPool-1 housekeeper","message":"Connection leak detection triggered for com.zaxxer.hikari.pool.HikariProxyConnection@1c2b7d3a on thread http-nio-8080-exec-42, stack trace follows","stack":"java.lang.Exception: Apparent connection leak detected\\n\\tat com.zaxxer.hikari.HikariDataSource.getConnection(HikariDataSource.java:112)\\n\\tat org.hibernate.engine.jdbc.connections.internal.DatasourceConnectionProviderImpl.getConnection(DatasourceConnectionProviderImpl.java:122)\\n\\t...\\n\\tat org.springframework.orm.jpa.JpaTransactionManager.doBegin(JpaTransactionManager.java:420)\\n\\t...\\n\\tat org.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\\n\\t...\\n\\tat vn.pay.payment.PaymentService$$SpringCGLIB$$0.confirmAndNotify(<generated>)\\n\\tat vn.pay.payment.PaymentController.confirm(PaymentController.java:61)"}
{"@timestamp":"2026-10-22T00:03:34.011+07:00","level":"INFO","logger":"vn.pay.payment.BankClient","thread":"http-nio-8080-exec-42","message":"POST https://api.bankpartner.vn/v2/transfers/notify order=OD-99213 status=200 elapsed=21607ms"}
{"@timestamp":"2026-10-22T00:03:40.003+07:00","level":"WARN","logger":"vn.pay.payment.ops.PoolStatsReporter","thread":"scheduling-1","message":"HikariPool-1 stats total=20 active=20 idle=0 waiting=47"}
{"@timestamp":"2026-10-22T00:03:42.887+07:00","level":"ERROR","logger":"vn.pay.payment.BankClient","thread":"http-nio-8080-exec-46","message":"notify timeout after 30000ms order=OD-99230 POST https://api.bankpartner.vn/v2/transfers/notify"}
{"@timestamp":"2026-10-22T00:03:50.004+07:00","level":"WARN","logger":"vn.pay.payment.ops.PoolStatsReporter","thread":"scheduling-1","message":"HikariPool-1 stats total=20 active=20 idle=0 waiting=52"}
{"@timestamp":"2026-10-22T00:04:02.663+07:00","level":"INFO","logger":"vn.pay.payment.ReconcileScheduler","thread":"pool-3-thread-1","message":"reconcile tick skipped, backlog=1284"}`
    }
  ],
  questions: [
    'Vì sao 41–52 thread phải chờ {{getConnection}} dù PostgreSQL chỉ dùng ~20% CPU? Chỉ ra thread nào đang giữ connection và bằng chứng.',
    'Tăng {{maximum-pool-size}} từ 20 lên 100 có giải quyết được sự cố này không? Hãy tính toán bằng Little\'s law với p99 hiện tại.',
    'Thiết kế lại luồng xác nhận thanh toán để không bao giờ giữ DB connection qua một lời gọi HTTP ra ngoài. Nêu cả cách xử lý khi đối tác timeout.'
  ],
  hints: [
    'Thread nào trong dump đang RUNNABLE ở {{sun.nio.ch.Net.poll}} / {{NioSocketImpl.timedRead}} (chờ đọc socket)? Nó có đang nằm trong một transaction không — nhìn stack phía dưới {{confirmAndNotify}} và đối chiếu leak detection.',
    'Hikari {{active=20, idle=0, waiting=41}} nghĩa là cả 20 connection đều đang bị mượn, không phải pool "hỏng". Ai mượn và giữ bao lâu?',
    'Đối tác p99 = 28–30s, connection-timeout = 30s. Nếu giữ connection suốt 30s thì cần bao nhiêu connection cho 500 TPS? Con số đó có khả thi không?'
  ],
  answer: `**Tóm tắt:** Không phải PostgreSQL chậm và cũng không phải pool "quá nhỏ". Ba thread như {{http-nio-8080-exec-42/44/46}} đang giữ connection **trong lúc chờ HTTP sang đối tác ngân hàng** (28–30 giây/lần) vì lời gọi nằm bên trong transaction. Với 20 connection và thời gian giữ bị khuếch đại lên ~30 giây, hàng đợi tăng tuyến tính; 41–52 thread kẹt ở {{HikariPool.getConnection}}. Sửa gốc là **rút ngắn thời gian giữ connection**, không phải tăng pool.

### Nguyên nhân gốc

Trong {{PaymentService.confirmAndNotify}} (proxy {{@Transactional}} mở transaction và mượn connection **trước khi** vào method; dòng 131 gọi đối tác):

~~~java
@Transactional                                  // mở transaction + mượn connection ngay
public void confirmAndNotify(long orderId) {
    Payment p = repo.find(orderId);             // dùng connection
    p.markConfirmed();
    repo.save(p);                               // UPDATE, chưa commit
    bankClient.notifyTransfer(p);               // dòng 131: HTTP 28-30s — CONNECTION VẪN BỊ GIỮ
}                                               // commit + trả connection
~~~

Spring mượn connection ở {{JpaTransactionManager.doBegin}} và chỉ trả khi transaction commit/rollback. Vì vậy suốt 30 giây chờ socket, connection vẫn bị đánh dấu {{active}}. Đối tác triển khai bản mới làm p99 từ 300ms lên ~29s, nên thời gian giữ connection tăng gần 100 lần — đúng lúc flash sale tăng tải 12 lần.

Đây là lỗi kinh điển **"transaction quá rộng"** (wide transaction) + **thiếu timeout/bulkhead** cho dependency ngoài. Nó không hiện ra ở CPU vì thread đang chờ IO; không hiện ở DB vì DB thực sự rảnh; chỉ hiện ở {{pending}} của pool và latency API.

### Dẫn chứng

- {{HikariPool-1 stats total=20 active=20 idle=0 waiting=41}} lúc 00:03:10, tăng lên {{waiting=47}} rồi {{52}} — hàng đợi phình ra theo thời gian, dấu hiệu giữ connection lâu chứ không phải thiếu cấu hình.
- Dump có ít nhất 3 thread {{TIMED_WAITING (parking)}} tại {{SynchronousQueue.poll}} ← {{ConcurrentBag.borrow}} ← {{HikariPool.getConnection}} ← {{JpaTransactionManager.doBegin}} ← proxy {{PaymentService.hold}}. Chúng chờ connection được trả về pool (tối đa {{connection-timeout}} 30s rồi ném {{SQLTransientConnectionException}}), không chờ DB.
- Ba thread {{RUNNABLE}} tại {{sun.nio.ch.Net.poll}} ← {{NioSocketImpl.timedRead}} (đang chờ đọc socket có timeout — thread state vẫn là RUNNABLE dù không tốn CPU) với stack {{BankClient.notifyTransfer(BankClient.java:88)}} ← {{PaymentService.confirmAndNotify(PaymentService.java:131)}} ← {{PaymentController.confirm}}. Bên dưới còn {{TransactionInterceptor.invoke}} ← {{PaymentService$$SpringCGLIB$$0.confirmAndNotify}}: tức lời gọi HTTP nằm **trong** transaction. Đây là các thread **đang giữ** connection và đang chờ mạng.
- Log leak detection chỉ đích danh: {{Connection leak detection triggered ... on thread http-nio-8080-exec-42}} với stack lúc mượn connection đi qua {{JpaTransactionManager.doBegin}} ← {{PaymentService$$SpringCGLIB$$0.confirmAndNotify}} ← {{PaymentController.confirm}}; sau đó chính thread này log {{elapsed=21607ms}} cho lời gọi HTTP — connection bị giữ ít nhất 21.6s.
- {{HikariPool-1 - Thread starvation or clock leap detected (housekeeper delta=48s913ms)}} cho thấy housekeeper cũng bị trễ, nhưng nguyên nhân chính vẫn là 20/20 connection bị mượn.

### Cách sửa

**Ngắn hạn (giờ đầu):**
1. Hạ timeout gọi đối tác xuống 2–3 giây (connect 500ms, read 2000ms) để giải phóng connection nhanh; bật circuit breaker để ngừng gọi khi đối tác đang hỏng.
2. Tạm tắt bước notify đồng bộ (feature flag), chỉ ghi trạng thái {{PENDING_NOTIFY}} rồi để job nền gọi lại. Ưu tiên không mất đơn.
3. **Không** chỉ tăng pool: 20 → 100 chỉ đẩy tải sang PostgreSQL, 100 connection × 30s vẫn cạn nếu TPS đủ cao, và PostgreSQL chịu connection storm còn tệ hơn.
4. Bật {{leak-detection-threshold}} ở mức 20s để có bằng chứng và alert; restart để xả các thread đang kẹt sau khi đã chặn nguồn gây kẹt.

**Dài hạn:** đưa lời gọi mạng ra khỏi transaction. Ghi DB trước, gọi đối tác sau (hoặc outbox + worker):

~~~java
@Transactional
public void confirm(long orderId) {
    Payment p = repo.find(orderId);
    p.markConfirmed();
    outbox.save(OutboxEvent.of("BANK_NOTIFY", p));  // cùng transaction, chỉ ghi DB
}                                                   // commit + TRẢ connection ngay

// Worker riêng, không giữ connection khi gọi HTTP
@Scheduled(fixedDelay = 500)
public void flushOutbox() {
    for (OutboxEvent e : outbox.lockBatch(50)) {
        bankClient.notifyTransfer(e);               // timeout 2s + retry idempotent
        outbox.markSent(e);
    }
}
~~~

Các điểm bắt buộc kèm theo: **idempotency key** gửi sang đối tác (đã có {{idem=9f2c...}} trong log — giữ và dùng khi retry), **retry có backoff + dead-letter**, **bulkhead** giới hạn số lời gọi đồng thời (Resilience4j {{Bulkhead}}), và **timeout ở mọi tầng** (Apache HttpClient {{RequestConfig}} chứ không chỉ timeout của Spring).

Tại sao không chỉ tăng pool — tính bằng Little's law:

| Tham số | Trước sự cố | Trong sự cố |
|---|---|---|
| TPS request confirm (giữ connection) | ~40 | ~500 |
| Thời gian giữ connection | ~0.35s (DB ~50ms + HTTP ~300ms) | ~29.3s (chờ HTTP) |
| Connection cần = TPS × hold | ~14 | ~14 650 |

Con số 14 650 cho thấy tăng pool là bất khả thi (100 connection chỉ phục vụ được 100 / 29,3 ≈ 3,4 confirm/giây). Ngược lại, đưa HTTP ra khỏi transaction thì hold time chỉ còn ~30ms: 500 × 0,03 = 15 connection, pool 20 vẫn đủ.

### Phòng ngừa

- Alert theo {{hikaricp.connections.pending}} > 5 trong 30s và {{connections.active / maximumPoolSize}} > 0.9 kéo dài, thay vì chờ HTTP 500.
- Đặt **SLO riêng cho dependency** (p99 đối tác) và alert khi p99 > 1s; sự cố này khởi nguồn từ phía bank, hệ thống mình chỉ là nạn nhân.
- Review checklist: không {{@Transactional}} bao quanh HTTP/Kafka/S3/SMTP; bật {{spring.jpa.open-in-view=false}} để tránh giữ EntityManager suốt request.
- Test tải có dependency giả lập chậm (Toxiproxy) để thấy pool cạn trước khi lên production.

> Senior tip: Khi thấy {{active == maximumPoolSize}} và {{waiting}} tăng đều, câu hỏi đầu tiên không phải "pool bao nhiêu?" mà là "ai giữ lâu?". Có thể tìm nhanh bằng {{jcmd <pid> Thread.print}} rồi đếm thread ở {{ConcurrentBag.borrow}} và soi các thread RUNNABLE đang ở {{NioSocketImpl.timedRead}} / {{Net.poll}} có {{TransactionInterceptor}} phía dưới. Một sai lầm phổ biến khác là bật leak detection rồi hoảng vì log "leak" — Hikari chỉ báo connection bị giữ quá ngưỡng, không phân biệt rò rỉ thật và transaction quá dài; hãy đọc stack trước khi kết luận.`,
  rubric: [
    'Chỉ ra connection bị giữ trong lúc gọi HTTP đối tác bên trong @Transactional (stack confirmAndNotify → BankClient.notifyTransfer dòng 131) và trích log leak detection + pool stats active=20, idle=0, waiting tăng.',
    'Giải thích vì sao tăng maximum-pool-size không giải quyết (Little\'s law: cần hàng nghìn connection khi hold ~30s), và vì sao CPU/DB đều rảnh.',
    'Đề xuất rút ngắn transaction: commit trước rồi gọi đối tác bất đồng bộ/outbox, timeout ngắn + circuit breaker + bulkhead, idempotency khi retry.',
    'Nêu monitoring/alert đúng (pending connections, tỉ lệ active/pool, p99 dependency) và biện pháp phòng ngừa khi review code.'
  ],
  tags: ['hikari', 'connection-pool', 'transaction', 'timeout', 'flash-sale']
},
{
  id: 'lab-thread-003',
  category: 'thread',
  title: 'Throughput sụt 15 lần, CPU chỉ 41% vì một khối synchronized',
  level: 'senior',
  scenario: `**Bối cảnh:** **PayVN Pricing** (Spring Boot 3.4, Java 21, 2 vCPU limit trên Kubernetes) trả giá động cho sản phẩm e-commerce. Bảng giá JSON được tải từ S3 mỗi 5 phút và cache dưới dạng {{byte[]}} trong bộ nhớ. Service có 16 worker Tomcat.

**Triệu chứng:** Sau khi thêm trường khuyến mãi vào bảng giá (file JSON tăng từ 380 KB lên 2,4 MB), throughput giảm từ **~1 400 req/s xuống ~96 req/s**, p99 từ 18ms lên **320ms** trong khi CPU pod chỉ **~41%** (0,82 core trên limit 2 core) và không có lỗi, không timeout DB, không deadlock. Autoscaler đặt ngưỡng 70% nên không scale; thêm pod chỉ tăng tổng công suất chứ không giảm chi phí mỗi request.

**Dữ liệu thu thập:** Hai thread dump cách nhau 10 giây (cùng một pod), và {{pidstat -t -p 1 1 3}} trên container lúc sự cố.`,
  artifacts: [
    {
      name: 'thread-dump-two-samples.txt',
      lang: 'text',
      content: `=== SAMPLE 1: 2026-10-22 09:41:02 (jcmd 1 Thread.print) ===
Full thread dump OpenJDK 64-Bit Server VM (21.0.4+7-LTS-151 mixed mode, sharing):

"http-nio-8080-exec-7" #68 [29415] prio=5 os_prio=0 cpu=40211.37ms elapsed=8981.40s tid=0x00007f3d10388000 nid=29415 runnable  [0x00007f3cb6dee000]
   java.lang.Thread.State: RUNNABLE
        at com.fasterxml.jackson.core.json.UTF8StreamJsonParser.parseEscapedName(UTF8StreamJsonParser.java:2097)
        at com.fasterxml.jackson.core.json.UTF8StreamJsonParser.slowParseName(UTF8StreamJsonParser.java:1962)
        at com.fasterxml.jackson.core.json.UTF8StreamJsonParser._parseName(UTF8StreamJsonParser.java:1746)
        at com.fasterxml.jackson.core.json.UTF8StreamJsonParser.nextFieldName(UTF8StreamJsonParser.java:1032)
        at com.fasterxml.jackson.databind.deser.BeanDeserializer.vanillaDeserialize(BeanDeserializer.java:310)
        at com.fasterxml.jackson.databind.deser.BeanDeserializer.deserialize(BeanDeserializer.java:177)
        at com.fasterxml.jackson.databind.deser.DefaultDeserializationContext.readRootValue(DefaultDeserializationContext.java:323)
        at com.fasterxml.jackson.databind.ObjectMapper._readMapAndClose(ObjectMapper.java:4918)
        at com.fasterxml.jackson.databind.ObjectMapper.readValue(ObjectMapper.java:3910)
        at vn.pay.pricing.PricingService.parsePriceTable(PricingService.java:137)
        at vn.pay.pricing.PricingService.price(PricingService.java:121)
        - locked <0x000000076b4c1a90> (a vn.pay.pricing.PricingService)
        at vn.pay.pricing.PricingController.quote(PricingController.java:44)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)

"http-nio-8080-exec-12" #73 [29425] prio=5 os_prio=0 cpu=39874.10ms elapsed=8980.10s tid=0x00007f3d10392000 nid=29425 waiting for monitor entry  [0x00007f3cb71f6000]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at vn.pay.pricing.PricingService.price(PricingService.java:121)
        - waiting to lock <0x000000076b4c1a90> (a vn.pay.pricing.PricingService)
        at vn.pay.pricing.PricingController.quote(PricingController.java:44)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)

"http-nio-8080-exec-13" #74 [29427] prio=5 os_prio=0 cpu=40102.55ms elapsed=8978.61s tid=0x00007f3d10394000 nid=29427 waiting for monitor entry  [0x00007f3cb72f7000]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at vn.pay.pricing.PricingService.price(PricingService.java:121)
        - waiting to lock <0x000000076b4c1a90> (a vn.pay.pricing.PricingService)
        at vn.pay.pricing.PricingController.quote(PricingController.java:44)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)

"http-nio-8080-exec-14" #75 [29429] prio=5 os_prio=0 cpu=39950.08ms elapsed=8977.20s tid=0x00007f3d10396000 nid=29429 waiting for monitor entry  [0x00007f3cb73f8000]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at vn.pay.pricing.PricingService.price(PricingService.java:121)
        - waiting to lock <0x000000076b4c1a90> (a vn.pay.pricing.PricingService)
        at vn.pay.pricing.PricingController.quote(PricingController.java:44)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)

"http-nio-8080-exec-15" #76 [29431] prio=5 os_prio=0 cpu=40033.71ms elapsed=8975.88s tid=0x00007f3d10398000 nid=29431 waiting for monitor entry  [0x00007f3cb74f9000]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at vn.pay.pricing.PricingService.price(PricingService.java:121)
        - waiting to lock <0x000000076b4c1a90> (a vn.pay.pricing.PricingService)
        at vn.pay.pricing.PricingController.quote(PricingController.java:44)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)

"kafka-consumer-billing-0" #58 [29329] prio=5 os_prio=0 cpu=201.77ms elapsed=8990.03s tid=0x00007f3d102f0000 nid=29329 runnable  [0x00007f3cb6eee000]
   java.lang.Thread.State: RUNNABLE
        at sun.nio.ch.EPoll.wait(java.base@21.0.4/Native Method)
        at sun.nio.ch.EPollSelectorImpl.doSelect(java.base@21.0.4/EPollSelectorImpl.java:121)
        at sun.nio.ch.SelectorImpl.lockAndDoSelect(java.base@21.0.4/SelectorImpl.java:130)
        at sun.nio.ch.SelectorImpl.select(java.base@21.0.4/SelectorImpl.java:142)
        at org.apache.kafka.common.network.Selector.select(Selector.java:874)
        at org.apache.kafka.common.network.Selector.poll(Selector.java:465)
        at org.apache.kafka.clients.NetworkClient.poll(NetworkClient.java:585)
        at org.apache.kafka.clients.consumer.internals.ConsumerNetworkClient.poll(ConsumerNetworkClient.java:280)

"G1 Service" os_prio=0 cpu=512.09ms elapsed=9012.40s tid=0x00007f3d101a9000 nid=28897 runnable

=== SAMPLE 2: 2026-10-22 09:41:12 (jcmd 1 Thread.print) ===
Full thread dump OpenJDK 64-Bit Server VM (21.0.4+7-LTS-151 mixed mode, sharing):

"http-nio-8080-exec-14" #75 [29429] prio=5 os_prio=0 cpu=40471.90ms elapsed=8987.20s tid=0x00007f3d10396000 nid=29429 runnable  [0x00007f3cb73f8000]
   java.lang.Thread.State: RUNNABLE
        at java.util.HashMap.resize(java.base@21.0.4/HashMap.java:722)
        at java.util.HashMap.putVal(java.base@21.0.4/HashMap.java:635)
        at java.util.HashMap.put(java.base@21.0.4/HashMap.java:618)
        at vn.pay.pricing.PricingService.indexBySku(PricingService.java:143)
        at vn.pay.pricing.PricingService.price(PricingService.java:122)
        - locked <0x000000076b4c1a90> (a vn.pay.pricing.PricingService)
        at vn.pay.pricing.PricingController.quote(PricingController.java:44)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)

"http-nio-8080-exec-7" #68 [29415] prio=5 os_prio=0 cpu=40733.02ms elapsed=8991.40s tid=0x00007f3d10388000 nid=29415 waiting for monitor entry  [0x00007f3cb6dee000]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at vn.pay.pricing.PricingService.price(PricingService.java:121)
        - waiting to lock <0x000000076b4c1a90> (a vn.pay.pricing.PricingService)
        at vn.pay.pricing.PricingController.quote(PricingController.java:44)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)

"http-nio-8080-exec-12" #73 [29425] prio=5 os_prio=0 cpu=40395.66ms elapsed=8990.10s tid=0x00007f3d10392000 nid=29425 waiting for monitor entry  [0x00007f3cb71f6000]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at vn.pay.pricing.PricingService.price(PricingService.java:121)
        - waiting to lock <0x000000076b4c1a90> (a vn.pay.pricing.PricingService)
        at vn.pay.pricing.PricingController.quote(PricingController.java:44)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)

"http-nio-8080-exec-13" #74 [29427] prio=5 os_prio=0 cpu=40588.13ms elapsed=8988.61s tid=0x00007f3d10394000 nid=29427 waiting for monitor entry  [0x00007f3cb72f7000]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at vn.pay.pricing.PricingService.price(PricingService.java:121)
        - waiting to lock <0x000000076b4c1a90> (a vn.pay.pricing.PricingService)
        at vn.pay.pricing.PricingController.quote(PricingController.java:44)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)

"http-nio-8080-exec-15" #76 [29431] prio=5 os_prio=0 cpu=40540.29ms elapsed=8985.88s tid=0x00007f3d10398000 nid=29431 waiting for monitor entry  [0x00007f3cb74f9000]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at vn.pay.pricing.PricingService.price(PricingService.java:121)
        - waiting to lock <0x000000076b4c1a90> (a vn.pay.pricing.PricingService)
        at vn.pay.pricing.PricingController.quote(PricingController.java:44)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)`
    },
    {
      name: 'pidstat-and-metrics.txt',
      lang: 'text',
      content: `$ pidstat -t -p 1 1 3
Linux 6.8.0-45-generic (pricing-6d9f7c8b5d-x2k4m)  10/22/2026  _x86_64_  (4 CPU)

Average:      UID      TGID       TID    %usr %system  %guest   %wait    %CPU   CPU  Command
Average:     1000         1         -   82.41    0.52    0.00    1.10   82.93     -  java
Average:     1000         -     29401    5.30    0.03    0.00    0.07    5.33     -  |__http-nio-8080-e
Average:     1000         -     29415    5.18    0.03    0.00    0.08    5.21     -  |__http-nio-8080-e
Average:     1000         -     29425    5.19    0.02    0.00    0.06    5.21     -  |__http-nio-8080-e
Average:     1000         -     29427    4.89    0.03    0.00    0.07    4.92     -  |__http-nio-8080-e
Average:     1000         -     29429    5.25    0.02    0.00    0.07    5.27     -  |__http-nio-8080-e
Average:     1000         -     29431    5.04    0.03    0.00    0.06    5.07     -  |__http-nio-8080-e
  ... (10 thread http-nio-8080-e còn lại: mỗi thread 4.8 – 5.3 %CPU, tổng 50.9) ...
Average:     1000         -     29329    0.31    0.10    0.00    0.00    0.41     -  |__kafka-consumer-
Average:     1000         -     28897    0.02    0.01    0.00    0.00    0.03     -  |__G1 Service
Average:     1000         -     28901    0.48    0.02    0.00    0.00    0.50     -  |__C2 CompilerThre

$ curl -s localhost:8080/actuator/metrics/jvm.threads.states
{"name":"jvm.threads.states","measurements":[{"statistic":"VALUE","value":36.0}],
 "availableTags":[{"tag":"state","values":["blocked","runnable","timed-waiting","waiting"]}]}

$ curl -s 'localhost:8080/actuator/metrics/jvm.threads.states?tag=state:blocked'
{"name":"jvm.threads.states","measurements":[{"statistic":"VALUE","value":11.0}],
 "availableTags":[{"tag":"state","values":["blocked"]}]}

# http.server.requests (uri=/quote), lấy 2 lần cách nhau 60 giây
09:40:12  COUNT=1203344  TOTAL_TIME=95021.7s
09:41:12  COUNT=1209125  TOTAL_TIME=95744.1s  MAX=0.341s
  -> delta COUNT = 5781 / 60s ~ 96 req/s (baseline 1400 req/s)
  -> delta TOTAL_TIME / delta COUNT = 722.4s / 5781 ~ 125ms trung bình; p99 320ms (Prometheus histogram)

$ jcmd 1 Thread.print | grep -c 'java.lang.Thread.State: BLOCKED'
11

$ jcmd 1 GC.heap_info
 garbage-first heap   total 1048576K, used 402188K [0x0000000760000000, 0x00000007a0000000)
  region size 1024K, 6 young (6144K), 0 survivors (0K)
 Metaspace       used 118244K, committed 121600K, reserved 1114112K
  class space    used 14321K, committed 15872K, reserved 1048576K`
    }
  ],
  questions: [
    'Phân biệt hiện tượng này với deadlock. Vì sao 11 thread BLOCKED mà CPU chỉ ~41% (0,82 core trên 2 core) và autoscaler không phản ứng?',
    'Chỉ ra khối code gây ra contention và giải thích vì sao nó tệ hơn nhiều sau khi file JSON tăng từ 380 KB lên 2,4 MB.',
    'Đưa ra thiết kế thay thế để đọc bảng giá gần như không khoá, và nêu cách đo lường/alert để phát hiện sớm kiểu suy giảm này.'
  ],
  hints: [
    'So sánh hai sample: lock <0x000000076b4c1a90> có đổi chủ không? Sample 1 holder là exec-7, sample 2 holder là exec-14 (exec-7 giờ lại xếp hàng). Lock vẫn được trao tay và holder luôn RUNNABLE, CPU time tăng — hệ thống có tiến triển, chỉ là tuần tự: đó là contention, không phải deadlock.',
    'Nhìn pidstat: toàn process chỉ 82,93% (~0,83 core) trên 4 CPU của host, chia đều cho 16 worker (~5% mỗi thread). 16 thread cùng bận mà cộng lại chưa tới 1 core — chúng thay phiên nhau chạy từng thread một: dấu hiệu tuần tự hoá.',
    'Trong sample 1, thread giữ lock đang parse JSON 2,4 MB (dòng 121 gọi parsePriceTable); trong sample 2, holder khác đang resize HashMap để index theo SKU (dòng 122 gọi indexBySku). Cả hai đều nằm trong cùng một phương thức synchronized price() bắt đầu từ dòng 121.'
  ],
  answer: `**Tóm tắt:** Đây là **lock contention** trên monitor {{0x000000076b4c1a90}} của {{PricingService}}, không phải deadlock. Mỗi request đi qua {{synchronized}} và **parse lại toàn bộ bảng giá 2,4 MB rồi dựng lại index** — critical section ~10,4ms nên trần lý thuyết chỉ còn ~96 req/s, đúng bằng throughput đo được. 11 thread HTTP {{BLOCKED}} xếp hàng; CPU chỉ ~0,83 core (41% limit 2 core) vì tại mỗi thời điểm chỉ một thread được chạy trong critical section, nên autoscaler không kích hoạt.

### Nguyên nhân gốc

Bug nằm ở chỗ cache **bytes thô** từ S3 nhưng lại parse lại mỗi lần gọi, bên trong một phương thức {{synchronized}}:

~~~java
// PricingService.java — phiên bản lỗi
private volatile byte[] tableBytes;      // S3 tải về mỗi 5 phút, cache dạng RAW

public synchronized Price price(String sku, int qty) {
    PriceTable table = parsePriceTable(tableBytes);  // dòng 121 (thân hàm ở dòng 137): parse 2,4MB MỖI request
    Map<String, Price> index = indexBySku(table);    // dòng 122 (thân hàm ở dòng 143): build lại HashMap
    return index.get(sku).multiply(qty);
}
~~~

Vấn đề không nằm ở việc dùng {{synchronized}} mà ở **kích thước critical section nhân với tần suất**: khoá bị giữ trong suốt quá trình parse + dựng index của **mọi** request, không chỉ lúc reload.

- File 380 KB: parse + index ~0,7ms → trần {{1 / 0,0007}} ≈ 1 400 req/s. Baseline 1 400 req/s thực ra đã **sát trần**, chỉ là chưa ai nhận ra.
- File 2,4 MB (gấp ~6,3 lần): Jackson parse ~9ms + dựng lại HashMap ~1,4ms → critical section ~10,4ms → trần {{1 / 0,0104}} ≈ **96 req/s**. Nhu cầu thực tế vẫn hơn 1 000 req/s, phần dư xếp hàng nên p99 lên 320ms.
- 16 worker Tomcat không giúp gì: mọi request phải đi qua **một** monitor, nên độ song song hiệu dụng là 1. Tăng worker chỉ làm hàng đợi dài thêm.

Monitor của Java không công bằng (không FIFO): thread mới tới có thể "chen ngang" giành lock trước thread đã chờ lâu, nên latency phân tán rộng (trung bình ~125ms nhưng p99 320ms) dù throughput bị chặn cứng ở ~96 req/s.

### Dẫn chứng

- Sample 1 (09:41:02): {{http-nio-8080-exec-7}} RUNNABLE trong Jackson {{parseEscapedName}} ← {{parsePriceTable(PricingService.java:137)}} ← {{price(PricingService.java:121)}}, có dòng {{- locked <0x000000076b4c1a90>}}.
- Sample 2 (09:41:12), 10 giây sau: vẫn lock đó nhưng holder đã là {{http-nio-8080-exec-14}} (sample 1 còn đang BLOCKED), đang ở {{HashMap.resize}} ← {{indexBySku(PricingService.java:143)}} ← {{price(PricingService.java:122)}}; còn {{exec-7}} quay lại xếp hàng BLOCKED. Lock **được trao tay** và holder luôn RUNNABLE — hệ thống có tiến triển. Nếu là deadlock, holder sẽ đứng yên ở cùng frame, CPU time không tăng, và JVM in mục {{Found one Java-level deadlock}}.
- Các worker {{http-nio-8080-exec-*}} BLOCKED đều tại {{PricingService.java:121}} (dòng đầu của phương thức {{synchronized}}) với {{waiting to lock <0x000000076b4c1a90>}}. {{BLOCKED}} nghĩa là chờ vào monitor, không tiêu CPU. CPU time mỗi worker tăng ~0,5 giây trong 10 giây (ví dụ exec-12: 39 874ms → 40 396ms) — mỗi thread chỉ được chạy ~5% thời gian.
- {{pidstat}}: process 82,93% (~0,83 core) trên host 4 CPU, chia gần đều cho 16 worker (~5%/thread). 16 thread bận mà tổng chưa tới 1 core = tuần tự hoá. Với limit 2 vCPU, 0,83 core ≈ **41%** — dưới ngưỡng autoscaler 70%.
- {{jvm.threads.states blocked = 11}} và {{http.server.requests}}: COUNT tăng 5 781 trong 60 giây ≈ **96 req/s**, khớp với trần 1/10,4ms. Latency trung bình = ΔTOTAL_TIME/ΔCOUNT = 722,4s / 5 781 ≈ 125ms ≈ (1 holder + 11 BLOCKED) × 10,4ms — đúng Little's law cho một hàng đợi phục vụ tuần tự.
- Cuối dump không có mục {{Found one Java-level deadlock}} (HotSpot chỉ in mục này khi phát hiện chu trình) — không có chu trình chờ, đúng với contention một chiều.

### Cách sửa

**Ngắn hạn:** parse một lần lúc nạp, chỉ tra cứu trong request path.

~~~java
private volatile Map<String, Price> snapshot = Map.of();   // đã parse sẵn, bất biến

// Nạp/refresh chạy nền, không nằm trên đường request
@Scheduled(fixedDelay = 300_000)
void refresh() {
    byte[] bytes = s3.get(KEY);
    snapshot = indexBySku(parsePriceTable(bytes));          // dựng xong mới đổi tham chiếu
}

public Price price(String sku, int qty) {                   // KHÔNG synchronized
    return snapshot.get(sku).multiply(qty);                 // tra cứu thuần, ~vài microsecond
}
~~~

Điểm cốt lõi: **copy-on-write + volatile reference**. Người đọc không bao giờ chờ người ghi; người ghi dựng dữ liệu mới hoàn chỉnh rồi đổi tham chiếu trong một phép gán nguyên tử. Snapshot cũ vẫn dùng được trong lúc refresh, không cần khoá.

**Dài hạn:**
- Nếu buộc phải lazy-load, dùng {{AtomicBoolean}} để chỉ một thread refresh, các request khác dùng snapshot cũ thay vì xếp hàng.
- Tách {{synchronized}} thành {{ReentrantReadWriteLock}} nếu thật sự cần cập nhật từng phần, hoặc dùng {{ConcurrentHashMap}} + {{computeIfAbsent}} cho cache theo SKU.
- Bộ đếm/metric dùng {{LongAdder}} thay vì {{synchronized}} trên một object đếm chung (một lỗi rất hay gặp khác).
- Thêm jitter cho lịch refresh để nhiều pod không cùng tải S3 một lúc; hoặc phát version qua S3 event.
- Nếu cần nhiều pod, cân nhắc cache phân tán (Redis) hoặc chỉ tải một lần lúc khởi động + version file trên S3.
- Lưu ý Java 21: virtual thread **không** cứu được trường hợp này. Khi bị pin trong {{synchronized}}, virtual thread giữ nguyên carrier; và dù không pin thì mutex vẫn tuần tự hoá — đổi platform thread sang virtual thread chỉ làm tăng số thread xếp hàng.

| Cách | Giảm contention | Khi nào dùng |
|---|---|---|
| Thu nhỏ critical section | Có, mạnh nhất | Luôn luôn, bước đầu tiên |
| Copy-on-write + volatile | Gần như bằng 0 khi đọc | Dữ liệu đọc nhiều, ghi theo lô |
| ReadWriteLock | Đọc song song | Ghi từng phần, cần nhất quán |
| ConcurrentHashMap / LongAdder | Rất tốt | Bộ đếm, cache theo key |
| Khoá theo stripe (hash % N) | Tốt | Dữ liệu phân vùng được theo key |

### Phòng ngừa

- Theo dõi **số thread BLOCKED** ({{jvm_threads_states_threads}} hoặc {{jvm.threads.states}}) và **thời gian chờ monitor** thay vì chỉ CPU. Alert khi blocked > 10% số worker trong 1 phút.
- Đo trực tiếp bằng JFR: bật {{-XX:StartFlightRecording=settings=profile}} và xem event {{jdk.JavaMonitorEnter}} với {{duration > 10ms}}; hoặc async-profiler chế độ {{lock}} để thấy cây stack giữ lock.
- Throughput SLO + latency SLO phải alert độc lập với CPU; sự cố này là ví dụ điển hình của "CPU thấp nhưng hệ thống chết".
- Review code: bất kỳ {{synchronized}} nào bao quanh IO, parse, gọi mạng, hoặc vòng lặp lớn đều phải coi là lỗi thiết kế.

> Senior tip: Trong phỏng vấn, đừng trả lời "thêm thread" hay "dùng ConcurrentHashMap là xong". Hãy nói theo công thức: throughput tối đa của một đoạn tuần tự = 1 / thời gian giữ lock, nên câu hỏi đúng là "critical section dài bao lâu và có được đọc ngoài lock không?". Mẹo thực chiến: lấy thread dump 2–3 lần cách nhau 5–10 giây — nếu lần nào cũng có cùng một lock bị giữ và một hàng BLOCKED chờ nó, nhưng holder RUNNABLE, đổi chủ hoặc đổi frame và CPU time tăng, thì đó là contention (có tiến triển, chỉ tuần tự); deadlock thì holder đứng yên mãi ở cùng frame, CPU không tăng và JVM tự in {{Found one Java-level deadlock}}.`,
  rubric: [
    'Phân biệt contention với deadlock: lock 0x000000076b4c1a90 bị giữ ở cả hai sample nhưng đổi chủ (exec-7 rồi exec-14), holder RUNNABLE và CPU tăng, 11 thread BLOCKED, không có chu trình chờ.',
    'Chỉ ra critical section quá lớn trong synchronized tại PricingService.price dòng 121 bao gồm parse JSON 2,4 MB và dựng lại index HashMap, khiến throughput = 1/thời gian giữ lock.',
    'Giải thích CPU thấp/autoscaler không scale và nêu đúng số liệu: process ~0,83 core (41% limit 2 core) chia đều cho 16 worker ~5% mỗi thread, 96 req/s so với baseline 1 400.',
    'Đề xuất copy-on-write/volatile snapshot hoặc thu nhỏ critical section, kèm monitoring theo blocked threads và JFR JavaMonitorEnter.'
  ],
  tags: ['contention', 'synchronized', 'jstack', 'throughput', 'monitor']
},
{
  id: 'lab-thread-004',
  category: 'thread',
  title: 'Bật virtual thread xong API đối soát còn chậm hơn',
  level: 'lead',
  scenario: `**Bối cảnh:** **PayVN Recon** (Spring Boot 3.4, Java 21) đối soát giao dịch với 6 ngân hàng đối tác. Pod giới hạn 2 vCPU. Tuần trước team bật {{spring.threads.virtual.enabled=true}} để tăng khả năng chịu tải (trước đó 200 platform thread). Endpoint {{POST /recon/settle}} gọi một SDK cũ của đối tác qua HTTP đồng bộ; SDK giữ một client cho mỗi ngân hàng và phương thức {{send}} của client là {{synchronized}} để "an toàn".

**Triệu chứng:** Sau khi bật, throughput **giảm** từ ~900 req/s xuống ~42 req/s, p99 từ 120ms lên **5,2s**, CPU pod chỉ ~35% (2 core). Thread dump kiểu cũ ({{jcmd 1 Thread.print}}) chỉ thấy 31 thread platform, không thấy hàng trăm request đang chờ. Không có deadlock, GC bình thường, không lỗi kết nối.

**Dữ liệu thu thập:** Bật {{-Djdk.tracePinnedThreads=full}} trên pod canary (in ra stdout; tuỳ chọn này chỉ có trên JDK 21–23, đã bị bỏ từ JDK 24), bật JFR profile trên pod còn lại, và chạy {{jcmd 1 Thread.dump_to_file -format=text /tmp/td.txt}} (file 268 KB, đếm được 226 virtual thread).`,
  artifacts: [
    {
      name: 'trace-pinned.log',
      lang: 'text',
      content: `2026-10-22T09:52:41.812+07:00  INFO 1 --- [tomcat-handler-117] vn.pay.recon.ReconcileService  : settle batch=RC-20261022-0911 bank=VCB size=48
Thread[#29,ForkJoinPool-1-worker-1,5,CarrierThreads]
    java.base/java.lang.VirtualThread$VThreadContinuation.onPinned(VirtualThread.java:183)
    java.base/jdk.internal.vm.Continuation.onPinned0(Continuation.java:393)
    java.base/java.lang.VirtualThread.parkNanos(VirtualThread.java:621)
    java.base/java.lang.System$2.parkVirtualThread(System.java:2652)
    java.base/jdk.internal.misc.VirtualThreads.park(VirtualThreads.java:67)
    java.base/java.util.concurrent.locks.LockSupport.parkNanos(LockSupport.java:408)
    java.base/sun.nio.ch.Poller.pollIndirect(Poller.java:139)
    java.base/sun.nio.ch.Poller.poll(Poller.java:102)
    java.base/sun.nio.ch.NioSocketImpl.park(NioSocketImpl.java:177)
    java.base/sun.nio.ch.NioSocketImpl.timedRead(NioSocketImpl.java:280)
    java.base/sun.nio.ch.NioSocketImpl.implRead(NioSocketImpl.java:304)
    java.base/sun.nio.ch.NioSocketImpl.read(NioSocketImpl.java:346)
    java.base/sun.nio.ch.NioSocketImpl$1.read(NioSocketImpl.java:796)
    java.base/java.net.Socket$SocketInputStream.read(Socket.java:1099)
    java.base/sun.nio.cs.StreamDecoder.readBytes(StreamDecoder.java:350)
    java.base/sun.nio.cs.StreamDecoder.implRead(StreamDecoder.java:393)
    java.base/sun.nio.cs.StreamDecoder.lockedRead(StreamDecoder.java:217)
    java.base/sun.nio.cs.StreamDecoder.read(StreamDecoder.java:171)
    java.base/java.io.InputStreamReader.read(InputStreamReader.java:188)
    java.base/java.io.BufferedReader.fill(BufferedReader.java:160)
    java.base/java.io.BufferedReader.implReadLine(BufferedReader.java:370)
    java.base/java.io.BufferedReader.readLine(BufferedReader.java:347)
    java.base/java.io.BufferedReader.readLine(BufferedReader.java:436)
    vn.pay.recon.legacy.LegacySettlementClient.readResponse(LegacySettlementClient.java:101)
    vn.pay.recon.legacy.LegacySettlementClient.send(LegacySettlementClient.java:64) <== monitors:1
    vn.pay.recon.ReconcileService.settle(ReconcileService.java:88)
    vn.pay.recon.ReconcileController.settle(ReconcileController.java:41)
    java.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:103)
    java.base/java.lang.reflect.Method.invoke(Method.java:580)
    org.springframework.web.method.support.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:255)
    org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1089)
    org.apache.tomcat.util.net.SocketProcessorBase.run(SocketProcessorBase.java:52)
    java.base/java.lang.VirtualThread.run(VirtualThread.java:309)
2026-10-22T09:52:41.905+07:00  INFO 1 --- [tomcat-handler-118] vn.pay.recon.ReconcileService  : settle batch=RC-20261022-0912 bank=TCB size=51
2026-10-22T09:52:41.998+07:00  INFO 1 --- [tomcat-handler-119] vn.pay.recon.ReconcileService  : settle batch=RC-20261022-0913 bank=ACB size=44
2026-10-22T09:52:42.115+07:00  INFO 1 --- [tomcat-handler-120] vn.pay.recon.ReconcileService  : settle batch=RC-20261022-0914 bank=VCB size=39
2026-10-22T09:52:42.204+07:00  INFO 1 --- [tomcat-handler-121] vn.pay.recon.ReconcileService  : settle batch=RC-20261022-0915 bank=MB size=46
2026-10-22T09:52:42.310+07:00  WARN 1 --- [tomcat-handler-122] vn.pay.recon.ReconcileService  : settle slow bank=VCB elapsed=4982ms
2026-10-22T09:52:42.388+07:00  INFO 1 --- [tomcat-handler-123] vn.pay.recon.ReconcileService  : settle batch=RC-20261022-0916 bank=TCB size=42

# Ghi chú của on-call: các request settle sau đi qua đúng stack trên nhưng không được in lại —
# trên JDK 21, jdk.tracePinnedThreads chỉ in MỖI stack bị pin MỘT lần. Muốn đếm số lần pin phải dùng JFR.`
    },
    {
      name: 'jfr-virtual-thread-pinned.txt',
      lang: 'text',
      content: `$ jfr summary /tmp/recon-2026-10-22.jfr

 Version: 2.1
 Chunks: 1
 Start: 2026-10-22 02:51:42 (UTC)
 Duration: 60 s

 Event Type                              Count  Size (bytes)
=============================================================
 jdk.SocketRead                            702         34398
 jdk.VirtualThreadPinned                   330         16170
 jdk.ThreadPark                            120          5880
 jdk.JavaMonitorEnter                       91          4459
 jdk.ExecutionSample                      2410         31330

$ jfr print --events jdk.VirtualThreadPinned --stack-depth 30 /tmp/recon-2026-10-22.jfr | head -36
jdk.VirtualThreadPinned {
  startTime = 09:52:41.812 (2026-10-22)
  duration = 287.4 ms
  eventThread = "tomcat-handler-117" (javaThreadId = 142, virtual)
  stackTrace = [
    java.lang.VirtualThread.parkOnCarrierThread(boolean, long) line: 677
    java.lang.VirtualThread.parkNanos(long) line: 636
    java.lang.System$2.parkVirtualThread(long) line: 2652
    jdk.internal.misc.VirtualThreads.park(long) line: 67
    java.util.concurrent.locks.LockSupport.parkNanos(long) line: 408
    sun.nio.ch.Poller.pollIndirect(int, long, BooleanSupplier) line: 139
    sun.nio.ch.Poller.poll(int, int, long, BooleanSupplier) line: 102
    sun.nio.ch.NioSocketImpl.park(FileDescriptor, int, long) line: 177
    sun.nio.ch.NioSocketImpl.timedRead(FileDescriptor, byte[], int, int, long) line: 280
    sun.nio.ch.NioSocketImpl.implRead(byte[], int, int) line: 304
    sun.nio.ch.NioSocketImpl.read(byte[], int, int) line: 346
    sun.nio.ch.NioSocketImpl$1.read(byte[], int, int) line: 796
    java.net.Socket$SocketInputStream.read(byte[], int, int) line: 1099
    sun.nio.cs.StreamDecoder.readBytes() line: 350
    sun.nio.cs.StreamDecoder.implRead(char[], int, int) line: 393
    sun.nio.cs.StreamDecoder.lockedRead(char[], int, int) line: 217
    sun.nio.cs.StreamDecoder.read(char[], int, int) line: 171
    java.io.InputStreamReader.read(char[], int, int) line: 188
    java.io.BufferedReader.fill() line: 160
    java.io.BufferedReader.implReadLine(boolean, boolean[]) line: 370
    java.io.BufferedReader.readLine(boolean, boolean[]) line: 347
    java.io.BufferedReader.readLine() line: 436
    vn.pay.recon.legacy.LegacySettlementClient.readResponse(BufferedReader) line: 101
    vn.pay.recon.legacy.LegacySettlementClient.send(String) line: 64
    vn.pay.recon.ReconcileService.settle(SettleRequest) line: 88
    vn.pay.recon.ReconcileController.settle(SettleRequest) line: 41
    ...
  ]
}

$ jfr print --events jdk.VirtualThreadPinned /tmp/recon-2026-10-22.jfr | grep -c 'duration ='
330
$ jfr print --events jdk.VirtualThreadPinned /tmp/recon-2026-10-22.jfr | grep 'duration =' | sort -t= -k2 -n | awk 'NR==165 {print "median:", $3, $4}'
median: 291.2 ms

$ jcmd 1 Thread.dump_to_file -format=text /tmp/td.txt
1:
Created /tmp/td.txt
$ head -3 /tmp/td.txt
1
2026-10-22T02:52:44.120395Z
21.0.4+7-LTS
$ grep -c '" virtual$' /tmp/td.txt
226
$ grep -E '^#[0-9]+ "ForkJoinPool-1-worker' /tmp/td.txt
#29 "ForkJoinPool-1-worker-1"
#30 "ForkJoinPool-1-worker-2"
$ sed -n '/^#143 /,/^$/p' /tmp/td.txt | head -8
#143 "tomcat-handler-118" virtual
      java.base/java.lang.VirtualThread.parkOnCarrierThread(VirtualThread.java:677)
      java.base/java.lang.VirtualThread.parkNanos(VirtualThread.java:636)
      java.base/java.lang.System$2.parkVirtualThread(System.java:2652)
      java.base/jdk.internal.misc.VirtualThreads.park(VirtualThreads.java:67)
      java.base/java.util.concurrent.locks.LockSupport.parkNanos(LockSupport.java:408)
      java.base/sun.nio.ch.Poller.pollIndirect(Poller.java:139)
      java.base/sun.nio.ch.Poller.poll(Poller.java:102)`
    },
    {
      name: 'carriers-thread-print.txt',
      lang: 'text',
      content: `$ jcmd 1 Thread.print | sed -n '1,60p'
1:
2026-10-22 09:52:44
Full thread dump OpenJDK 64-Bit Server VM (21.0.4+7-LTS-151 mixed mode, sharing):

"ForkJoinPool-1-worker-1" #29 [27921] daemon prio=5 os_prio=0 cpu=42118.20ms elapsed=3601.55s tid=0x00007f4a102a1800 nid=27921 waiting on condition  [0x00007f4a0e5f5000]
   Carrying virtual thread #142
        at jdk.internal.vm.Continuation.run(java.base@21.0.4/Continuation.java:248)
        at java.lang.VirtualThread.runContinuation(java.base@21.0.4/VirtualThread.java:223)
        at java.lang.VirtualThread$$Lambda/0x00007f49c8264fc8.run(java.base@21.0.4/Unknown Source)
        at java.util.concurrent.ForkJoinTask$RunnableExecuteAction.exec(java.base@21.0.4/ForkJoinTask.java:1423)
        at java.util.concurrent.ForkJoinTask.doExec(java.base@21.0.4/ForkJoinTask.java:387)
        at java.util.concurrent.ForkJoinPool$WorkQueue.topLevelExec(java.base@21.0.4/ForkJoinPool.java:1312)
        at java.util.concurrent.ForkJoinPool.scan(java.base@21.0.4/ForkJoinPool.java:1843)
        at java.util.concurrent.ForkJoinPool.runWorker(java.base@21.0.4/ForkJoinPool.java:1808)
        at java.util.concurrent.ForkJoinWorkerThread.run(java.base@21.0.4/ForkJoinWorkerThread.java:188)

"ForkJoinPool-1-worker-2" #30 [27923] daemon prio=5 os_prio=0 cpu=41880.11ms elapsed=3601.55s tid=0x00007f4a102a3000 nid=27923 waiting on condition  [0x00007f4a0e6f6000]
   Carrying virtual thread #143
        at jdk.internal.vm.Continuation.run(java.base@21.0.4/Continuation.java:248)
        at java.lang.VirtualThread.runContinuation(java.base@21.0.4/VirtualThread.java:223)
        at java.lang.VirtualThread$$Lambda/0x00007f49c8264fc8.run(java.base@21.0.4/Unknown Source)
        at java.util.concurrent.ForkJoinTask$RunnableExecuteAction.exec(java.base@21.0.4/ForkJoinTask.java:1423)
        at java.util.concurrent.ForkJoinTask.doExec(java.base@21.0.4/ForkJoinTask.java:387)
        at java.util.concurrent.ForkJoinPool$WorkQueue.topLevelExec(java.base@21.0.4/ForkJoinPool.java:1312)
        at java.util.concurrent.ForkJoinPool.scan(java.base@21.0.4/ForkJoinPool.java:1843)
        at java.util.concurrent.ForkJoinPool.runWorker(java.base@21.0.4/ForkJoinPool.java:1808)
        at java.util.concurrent.ForkJoinWorkerThread.run(java.base@21.0.4/ForkJoinWorkerThread.java:188)

"HikariPool-1 housekeeper" #52 [27937] daemon prio=5 os_prio=0 cpu=18.44ms elapsed=3600.02s tid=0x00007f4a102aa800 nid=27937 waiting on condition  [0x00007f4a0e2f2000]
   java.lang.Thread.State: TIMED_WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x000000076b9c1f20> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
        at java.util.concurrent.locks.LockSupport.parkNanos(java.base@21.0.4/LockSupport.java:269)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.awaitNanos(java.base@21.0.4/AbstractQueuedSynchronizer.java:1758)
        at java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(java.base@21.0.4/ScheduledThreadPoolExecutor.java:1182)
        at java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(java.base@21.0.4/ScheduledThreadPoolExecutor.java:899)
        at java.util.concurrent.ThreadPoolExecutor.getTask(java.base@21.0.4/ThreadPoolExecutor.java:1070)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1130)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@21.0.4/ThreadPoolExecutor.java:642)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

"Reference Handler" #9 [27649] daemon prio=10 os_prio=0 cpu=4.12ms elapsed=3601.60s tid=0x00007f4a101c2000 nid=27649 waiting on condition  [0x00007f4a0e0ef000]
   java.lang.Thread.State: RUNNABLE
        at java.lang.ref.Reference.waitForReferencePendingList(java.base@21.0.4/Native Method)
        at java.lang.ref.Reference.processPendingReferences(java.base@21.0.4/Reference.java:246)
        at java.lang.ref.Reference$ReferenceHandler.run(java.base@21.0.4/Reference.java:208)

"G1 Service" os_prio=0 cpu=311.20ms elapsed=3601.58s tid=0x00007f4a101a9000 nid=27617 runnable`
    }
  ],
  questions: [
    'Vì sao bật virtual thread lại làm throughput GIẢM? Giải thích bằng số carrier thread trong artifact và cơ chế pinning.',
    'Chỉ ra chính xác dòng code gây pin và giải thích vì sao synchronized quanh IO lại khác ReentrantLock quanh IO với virtual thread.',
    'Nêu kế hoạch sửa (ngắn hạn, dài hạn), cách xác minh sau khi sửa, và những điểm cần cảnh báo khi cả team chuyển sang virtual thread trên Java 21.'
  ],
  hints: [
    'Đếm số thread {{ForkJoinPool-1-worker-*}} trong dump: đó là carrier của virtual thread scheduler, mặc định bằng số CPU khả dụng. Pod 2 vCPU nên chỉ có 2 carrier.',
    'Dấu {{<== monitors:1}} nghĩa là virtual thread bị ghim vào carrier vì đang giữ monitor Java (synchronized) lúc chặn IO. Carrier bị chiếm thì các virtual thread khác không thể chạy.',
    'JFR cho thấy 330 event {{jdk.VirtualThreadPinned}} trong 60 giây, trung vị 291ms, frame ứng dụng đầu tiên là {{LegacySettlementClient.readResponse}} — tức mỗi request settle ghim carrier gần 0,3 giây. 330 × 0,291s ≈ 96 carrier-giây trên tổng 2 × 60 = 120 carrier-giây: carrier bị ghim ~80% thời gian, mọi endpoint khác chỉ còn ~20%.'
  ],
  answer: `**Tóm tắt:** SDK cũ bọc lời gọi HTTP đồng bộ trong {{synchronized}}. Trên Java 21, virtual thread **chặn IO khi đang giữ monitor** sẽ bị **pin** vào carrier và không thể unmount. Pod có 2 vCPU nên chỉ có 2 carrier ({{ForkJoinPool-1-worker-1/2}}); mỗi request settle ghim một carrier ~291ms, nên nhánh gọi SDK bị ép về tối đa 2 request song song thật sự **và chiếm luôn carrier của mọi endpoint khác**. Virtual thread chỉ giúp khi có hàng nghìn thread **không** chiếm carrier lúc chờ — ở đây chúng biến thành hàng đợi trên 2 carrier.

### Cơ chế pinning — vì sao chậm hơn cả platform thread

Virtual thread chạy trên một **carrier** (platform thread của {{ForkJoinPool}} scheduler). Khi virtual thread gọi một thao tác chặn "biết là virtual-thread-friendly" (socket, {{LockSupport.park}}, các lock/queue của {{java.util.concurrent}}, {{Thread.sleep}}), JVM **unmount** nó khỏi carrier, carrier đi chạy virtual thread khác. Nhưng khi virtual thread đang giữ **monitor** (từ khoá {{synchronized}}) mà chặn, JVM không thể nhả monitor khỏi stack của carrier, nên nó **giữ nguyên carrier** — gọi là pinned. Trong thời gian pinned, carrier bị chiếm dù không tiêu CPU (đang chờ socket). Trên JDK 21, virtual thread **chờ vào** một monitor đang bị giữ ({{synchronized}} bị BLOCKED) cũng ghim carrier. (File IO trên JDK 21 cũng ghim, nhưng scheduler tạm bù thêm carrier; socket IO bị pin thì **không** được bù.)

Hệ quả với pod 2 vCPU:

~~~text
Số carrier mặc định = Runtime.availableProcessors() = 2
Mỗi request giữ carrier khi đọc response ≈ 291 ms
Trần lý thuyết ≈ 2 / 0,291 ≈ 6,9 request/giây cho nhánh bị pin
~~~

Với 200 platform thread trước đây, request settle chờ IO chỉ chiếm **thread của chính nó**; các endpoint khác vẫn còn gần 200 thread để chạy. Với virtual thread, 2 carrier là **tài nguyên chung của mọi request**: JFR ghi 330 lần pin × ~0,291s ≈ 96 carrier-giây trong 120 carrier-giây khả dụng (2 carrier × 60s), tức ~80% thời gian carrier bị ghim vào việc chờ socket. Mọi endpoint khác (kể cả endpoint không gọi SDK) chỉ còn ~20% thời gian carrier, nên throughput toàn service sụt xuống ~42 req/s và p99 lên 5,2s. CPU thấp vì các carrier đang chờ mạng, không tính toán.

Điểm quan trọng: {{Thread.print}} truyền thống **không liệt kê virtual thread**, nên nếu chỉ nhìn jstack sẽ tưởng hệ thống rảnh. Phải dùng {{jcmd <pid> Thread.dump_to_file}} (thấy 226 virtual thread) hoặc JFR.

### Dẫn chứng

- Trace pinning: carrier {{ForkJoinPool-1-worker-1}} bị ghim khi virtual thread {{tomcat-handler-117}} park trong {{NioSocketImpl.timedRead}}; dấu {{<== monitors:1}} nằm ở frame {{LegacySettlementClient.send(LegacySettlementClient.java:64)}} (phương thức {{synchronized}}), ngay dưới {{readResponse(LegacySettlementClient.java:101)}}, gọi từ {{ReconcileService.settle(ReconcileService.java:88)}}. JDK 21 chỉ in mỗi stack một lần, nên các request settle sau không hiện lại — đừng kết luận "chỉ pin một lần".
- JFR: 330 event {{jdk.VirtualThreadPinned}} trong 60 giây (event này mặc định có ngưỡng 20ms), **median 291,2ms**; frame ứng dụng đầu tiên đúng là {{readResponse(LegacySettlementClient.java:101)}}, top frame là {{VirtualThread.parkOnCarrierThread}} — tức virtual thread muốn park nhưng không unmount được.
- Dump carrier ({{Thread.print}}): chỉ có {{ForkJoinPool-1-worker-1}} và {{ForkJoinPool-1-worker-2}}, mỗi carrier có dòng {{Carrying virtual thread #142}} / {{#143}} — đúng hai virtual thread đang bị ghim. {{Thread.print}} chỉ in frame của carrier ({{Continuation.run}} ← {{ForkJoinPool.runWorker}}), không in stack của virtual thread; phải đối chiếu với trace/JFR/{{Thread.dump_to_file}} (#143 cũng đang {{parkOnCarrierThread}}). Không có carrier thứ 3 để nhận việc.
- {{Thread.dump_to_file}} đếm 226 virtual thread nhưng chỉ 2 carrier: tỉ lệ 113 virtual thread/carrier, hàng đợi khổng lồ.
- {{jdk.JavaMonitorEnter}} chỉ 91 event (các request cùng ngân hàng chờ monitor của cùng một client) — contention monitor không phải vấn đề chính; vấn đề là **mỗi request settle tự ghim carrier của mình** trong lúc chờ mạng, khác hoàn toàn lab 3.

### Cách sửa

**Ngắn hạn:** rollback {{spring.threads.virtual.enabled=false}} trên production (quay lại 200 platform thread, throughput 900 req/s), hoặc tăng carrier tạm thời bằng {{-Djdk.virtualThreadScheduler.parallelism=8}} — chỉ là giảm đau, không sửa gốc, và vẫn lãng phí vì carrier bị chặn.

**Sửa gốc:** thay {{synchronized}} bằng {{ReentrantLock}} (hoặc bỏ khoá nếu không cần), và tốt hơn nữa là không giữ bất kỳ khoá nào quanh IO:

~~~java
// Trước: synchronized giữ monitor trong lúc đọc socket -> pin carrier
public synchronized String send(String payload) {
    return http.post(endpoint, payload);          // 291ms chờ mạng
}

// Sau: ReentrantLock không ghim; hoặc lý tưởng nhất là không khoá quanh IO
private final ReentrantLock lock = new ReentrantLock();
public String send(String payload) {
    Request req;
    lock.lock();                                   // chỉ bảo vệ trạng thái cần thiết
    try {
        req = buildRequest(payload);               // nhanh, không IO
    } finally {
        lock.unlock();                             // thả lock TRƯỚC khi gọi mạng
    }
    return http.post(req);                         // IO nằm ngoài vùng khoá
}
~~~

Lưu ý: chỉ đổi {{synchronized}} → {{ReentrantLock}} là đủ để virtual thread unmount khi chờ IO, nhưng nếu vẫn giữ lock trong suốt 291ms thì các request khác **chờ lock** (không pin, nhưng vẫn tuần tự). Vì vậy phải **rời IO ra khỏi vùng khoá**; khoá chỉ nên bảo vệ cấu trúc dữ liệu trong bộ nhớ.

**Dài hạn:**
- Thay SDK cũ bằng client HTTP hỗ trợ async ({{java.net.http.HttpClient}} với {{sendAsync}}, hoặc WebClient) — không cần thread nào chờ mạng.
- Nếu chưa thể bỏ SDK, giới hạn song song bằng {{Semaphore}} và dùng platform thread pool riêng cho client đó (bulkhead), đừng để nó kéo sập toàn bộ scheduler.
- Nâng lên **JDK 24+** (JEP 491) nếu muốn {{synchronized}} không còn ghim virtual thread (từ JDK 24 {{jdk.tracePinnedThreads}} cũng bị bỏ, dùng JFR {{jdk.VirtualThreadPinned}}); nhưng vẫn phải sửa thiết kế khoá vì lý do tuần tự hoá. Native call/JNI vẫn ghim kể cả trên JDK 24.
- Kiểm tra toàn bộ dependency: JDBC driver, thư viện crypto, file IO native có thể pin; JFR {{jdk.VirtualThreadPinned}} là cách phát hiện.

### Cách xác minh sau khi sửa

1. Chạy JFR 60 giây dưới tải thật, yêu cầu {{jdk.VirtualThreadPinned}} gần 0 (hoặc < 20ms nếu có threshold).
2. Dump carrier: lấy vài sample {{Thread.print}} — carrier lúc rảnh phải ở {{WAITING (parking)}} trong {{ForkJoinPool.awaitWork}}, không còn cảnh cùng một {{Carrying virtual thread #N}} kéo dài qua nhiều sample.
3. So sánh throughput và p99 với baseline platform thread; kỳ vọng ít nhất bằng, thường cao hơn nhiều khi có nhiều request IO.
4. Nếu cần soi rò rỉ virtual thread, bật thêm {{jdk.VirtualThreadStart/End}} (mặc định tắt trong cả default.jfc lẫn profile.jfc) và kiểm tra hai số này cân bằng; hoặc đếm virtual thread qua {{Thread.dump_to_file}} theo thời gian.

### Phòng ngừa

- Coi {{synchronized}} quanh IO là **code smell** trong codebase dùng virtual thread; thêm rule review hoặc ArchUnit-style check.
- Bật cảnh báo JFR {{jdk.VirtualThreadPinned}} trên canary trước khi bật toàn bộ; đặt ngưỡng 20ms và alert nếu tỉ lệ event > 1% request.
- Ghi rõ trong runbook: khi bật virtual thread, {{Thread.print}} không đủ — dùng {{Thread.dump_to_file}} và JFR.
- Đừng bật {{spring.threads.virtual.enabled}} như một "nút tăng tốc"; nó chỉ có lợi khi code không chặn carrier và khi tải chủ yếu là IO.

> Senior tip: Câu hỏi hay gặp là "virtual thread có thay được reactive không?". Câu trả lời thực dụng: chỉ khi toàn bộ đường đi không pin và không có giới hạn tài nguyên thật (connection pool, rate limit của đối tác). Ở đây kể cả khi hết pin, 226 virtual thread cùng gọi một đối tác sẽ tạo connection storm — vẫn cần semaphore/bulkhead. Một mẹo đọc số: nếu {{số virtual thread / số carrier}} lớn mà CPU thấp và latency cao, gần như chắc chắn là pinning hoặc chờ tài nguyên, không phải thiếu CPU.`,
  rubric: [
    'Giải thích đúng cơ chế pinning: virtual thread giữ monitor (synchronized) khi chặn IO thì không unmount, carrier bị chiếm; nêu 2 carrier do pod 2 vCPU.',
    'Trích đúng bằng chứng: <== monitors:1 tại LegacySettlementClient.send, 330 event jdk.VirtualThreadPinned median 291ms với frame ứng dụng readResponse/send, chỉ 2 carrier ForkJoinPool-1-worker-1/2 đang "Carrying virtual thread".',
    'Chỉ ra vì sao chậm hơn platform thread (2 carrier là tài nguyên chung, bị ghim ~80% thời gian nên mọi endpoint khác cũng bị nghẽn, trong khi trước đây request chờ IO chỉ chiếm thread riêng của nó) và vì sao Thread.print không thấy stack của virtual thread.',
    'Đề xuất thay synchronized bằng ReentrantLock và/hoặc đưa IO ra khỏi vùng khoá, kèm cách xác minh bằng JFR và cảnh báo khi dùng virtual thread trên Java 21.'
  ],
  tags: ['virtual-thread', 'pinning', 'jdk21', 'jfr', 'synchronized']
},
{
  id: 'lab-thread-005',
  category: 'thread',
  title: 'CPU 200% nhưng API chỉ chậm dần — tìm thread nóng bằng top -H và nid',
  level: 'senior',
  scenario: `**Bối cảnh:** **PayVN Transfer** (Java 21, Spring Boot 3.4) vừa phát hành tính năng cho phép merchant tự cấu hình **mẫu mã tham chiếu** ({{reference pattern}}) cho lệnh chuyển tiền. Pattern được lưu trong DB dưới dạng chuỗi regex và biên dịch bằng {{Pattern.compile}} mỗi lần validate. Pod giới hạn 2 vCPU.

**Triệu chứng:** Từ **11:20 ngày 22/10/2026**, CPU pod leo dần lên **~199%** (đúng 2 core) và giữ nguyên; latency API tăng từ 80ms lên hơn 8 giây, request xếp hàng. {{/actuator/health}} vẫn trả {{UP}}, liveness probe không restart. Không có exception, không deadlock, heap ổn định (dùng 38% và không tăng). Một merchant mới (MC-8841) cấu hình pattern rất "sáng tạo" và bắt đầu gửi lô đối soát lớn.

**Dữ liệu thu thập:** {{top}} và {{top -H -b -n 1 -p 1}} trên container; on-call theo thói quen cũ đổi TID nóng sang hex để grep trong thread dump (không ra kết quả) rồi grep lại bằng số thập phân; kèm profile CPU 10 giây bằng async-profiler. Lô đối soát được xử lý bởi pool {{transfer-verify}} ({{BatchVerifyJob}}).`,
  artifacts: [
    {
      name: 'top-hot-threads.txt',
      lang: 'text',
      content: `$ top -b -n 1 -p 1
top - 11:26:04 up 12 days,  3:41,  0 users,  load average: 2.01, 1.88, 1.42
Tasks:   1 total,   0 running,   1 sleeping,   0 stopped,   0 zombie
%Cpu(s): 49.9 us,  0.2 sy,  0.0 ni, 49.7 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   4096.0 total,    512.3 free,   1980.2 used,   1603.5 buff/cache
MiB Swap:      0.0 total,      0.0 free,      0.0 used.   1801.4 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    1 app       20   0 6123456 812344  22112 S 198.6  19.8  41:37.20 java

$ top -H -b -n 1 -p 1
top - 11:26:04 up 12 days,  3:41,  0 users,  load average: 2.01, 1.88, 1.42
Threads:  37 total,   2 running,  35 sleeping,   0 stopped,   0 zombie
%Cpu(s): 49.9 us,  0.2 sy,  0.0 ni, 49.7 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   4096.0 total,    512.3 free,   1980.2 used,   1603.5 buff/cache
MiB Swap:      0.0 total,      0.0 free,      0.0 used.   1801.4 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
14872 app       20   0 6123456 812344  22112 R  99.7  19.8   5:52.88 transfer-verify
14888 app       20   0 6123456 812344  22112 R  98.9  19.8   5:29.14 transfer-verify
14902 app       20   0 6123456 812344  22112 S   0.3  19.8   0:00.81 transfer-verify
   37 app       20   0 6123456 812344  22112 S   0.2  19.8   2:10.44 C2 CompilerThre
    1 app       20   0 6123456 812344  22112 S   0.0  19.8   0:00.02 java

$ printf '0x%x\n' 14872 14888
0x3a18
0x3a28

$ jcmd 1 Thread.print | grep -c 'nid=0x3a18\|nid=0x3a28'
0

$ jcmd 1 Thread.print | grep -n 'nid=14872 \|nid=14888 '
214:"transfer-verify-3" #88 [14872] prio=5 os_prio=0 cpu=354880.31ms elapsed=18422.09s tid=0x00007f8c2c1a9800 nid=14872 runnable  [0x00007f8c1a7f9000]
318:"transfer-verify-7" #92 [14888] prio=5 os_prio=0 cpu=331120.44ms elapsed=18410.52s tid=0x00007f8c2c1b2800 nid=14888 runnable  [0x00007f8c1a9fa000]

$ jcmd 1 GC.heap_info
1:
 garbage-first heap   total 1048576K, used 402188K [0x0000000760000000, 0x00000007a0000000)
  region size 1024K, 6 young (6144K), 0 survivors (0K)
 Metaspace       used 118244K, committed 121600K, reserved 1114112K
  class space    used 14321K, committed 15872K, reserved 1048576K`
    },
    {
      name: 'jstack-hot-threads.txt',
      lang: 'text',
      content: `2026-10-22 11:26:09
Full thread dump OpenJDK 64-Bit Server VM (21.0.4+7-LTS-151 mixed mode, sharing):

"transfer-verify-3" #88 [14872] prio=5 os_prio=0 cpu=357860.12ms elapsed=18425.10s tid=0x00007f8c2c1a9800 nid=14872 runnable  [0x00007f8c1a7f9000]
   java.lang.Thread.State: RUNNABLE
        at java.util.regex.Pattern$GroupTail.match(java.base@21.0.4/Pattern.java:4863)
        at java.util.regex.Pattern$CharPropertyGreedy.match(java.base@21.0.4/Pattern.java:4426)
        at java.util.regex.Pattern$GroupHead.match(java.base@21.0.4/Pattern.java:4804)
        at java.util.regex.Pattern$Loop.match(java.base@21.0.4/Pattern.java:4941)
        at java.util.regex.Pattern$GroupTail.match(java.base@21.0.4/Pattern.java:4863)
        at java.util.regex.Pattern$CharPropertyGreedy.match(java.base@21.0.4/Pattern.java:4426)
        at java.util.regex.Pattern$GroupHead.match(java.base@21.0.4/Pattern.java:4804)
        at java.util.regex.Pattern$Loop.match(java.base@21.0.4/Pattern.java:4941)
        at java.util.regex.Pattern$GroupTail.match(java.base@21.0.4/Pattern.java:4863)
        at java.util.regex.Pattern$CharPropertyGreedy.match(java.base@21.0.4/Pattern.java:4426)
        at java.util.regex.Pattern$GroupHead.match(java.base@21.0.4/Pattern.java:4804)
        at java.util.regex.Pattern$Loop.match(java.base@21.0.4/Pattern.java:4941)
        at java.util.regex.Pattern$GroupTail.match(java.base@21.0.4/Pattern.java:4863)
        at java.util.regex.Pattern$CharPropertyGreedy.match(java.base@21.0.4/Pattern.java:4426)
        at java.util.regex.Pattern$GroupHead.match(java.base@21.0.4/Pattern.java:4804)
        at java.util.regex.Pattern$Loop.match(java.base@21.0.4/Pattern.java:4941)
        at java.util.regex.Pattern$GroupTail.match(java.base@21.0.4/Pattern.java:4863)
        at java.util.regex.Pattern$CharPropertyGreedy.match(java.base@21.0.4/Pattern.java:4426)
        at java.util.regex.Pattern$GroupHead.match(java.base@21.0.4/Pattern.java:4804)
        at java.util.regex.Pattern$Loop.match(java.base@21.0.4/Pattern.java:4941)
        at java.util.regex.Pattern$GroupTail.match(java.base@21.0.4/Pattern.java:4863)
        at java.util.regex.Pattern$CharPropertyGreedy.match(java.base@21.0.4/Pattern.java:4426)
        at java.util.regex.Pattern$GroupHead.match(java.base@21.0.4/Pattern.java:4804)
        at java.util.regex.Pattern$Loop.match(java.base@21.0.4/Pattern.java:4941)
        at java.util.regex.Pattern$Prolog.match(java.base@21.0.4/Pattern.java:4888)
        at java.util.regex.Pattern$GroupHead.match(java.base@21.0.4/Pattern.java:4804)
        at java.util.regex.Pattern$Branch.match(java.base@21.0.4/Pattern.java:4749)
        at java.util.regex.Pattern$Begin.match(java.base@21.0.4/Pattern.java:3683)
        at java.util.regex.Matcher.match(java.base@21.0.4/Matcher.java:1797)
        at java.util.regex.Matcher.matches(java.base@21.0.4/Matcher.java:752)
        at vn.pay.transfer.TransferValidator.isValidReference(TransferValidator.java:57)
        at vn.pay.transfer.TransferValidator.validate(TransferValidator.java:38)
        at vn.pay.transfer.BatchVerifyJob.verifyItem(BatchVerifyJob.java:73)
        at vn.pay.transfer.BatchVerifyJob.lambda$submit$0(BatchVerifyJob.java:51)
        at java.util.concurrent.FutureTask.run(java.base@21.0.4/FutureTask.java:317)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1144)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@21.0.4/ThreadPoolExecutor.java:642)
        at java.lang.Thread.runWith(java.base@21.0.4/Thread.java:1596)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

"transfer-verify-7" #92 [14888] prio=5 os_prio=0 cpu=334090.57ms elapsed=18413.53s tid=0x00007f8c2c1b2800 nid=14888 runnable  [0x00007f8c1a9fa000]
   java.lang.Thread.State: RUNNABLE
        at java.util.regex.Pattern$CharPropertyGreedy.match(java.base@21.0.4/Pattern.java:4426)
        at java.util.regex.Pattern$GroupHead.match(java.base@21.0.4/Pattern.java:4804)
        at java.util.regex.Pattern$Loop.match(java.base@21.0.4/Pattern.java:4941)
        at java.util.regex.Pattern$GroupTail.match(java.base@21.0.4/Pattern.java:4863)
        at java.util.regex.Pattern$CharPropertyGreedy.match(java.base@21.0.4/Pattern.java:4426)
        at java.util.regex.Pattern$GroupHead.match(java.base@21.0.4/Pattern.java:4804)
        at java.util.regex.Pattern$Loop.match(java.base@21.0.4/Pattern.java:4941)
        at java.util.regex.Pattern$GroupTail.match(java.base@21.0.4/Pattern.java:4863)
        at java.util.regex.Pattern$CharPropertyGreedy.match(java.base@21.0.4/Pattern.java:4426)
        at java.util.regex.Pattern$GroupHead.match(java.base@21.0.4/Pattern.java:4804)
        at java.util.regex.Pattern$Loop.match(java.base@21.0.4/Pattern.java:4941)
        at java.util.regex.Pattern$GroupTail.match(java.base@21.0.4/Pattern.java:4863)
        at java.util.regex.Pattern$CharPropertyGreedy.match(java.base@21.0.4/Pattern.java:4426)
        at java.util.regex.Pattern$GroupHead.match(java.base@21.0.4/Pattern.java:4804)
        at java.util.regex.Pattern$Loop.match(java.base@21.0.4/Pattern.java:4941)
        at java.util.regex.Pattern$Prolog.match(java.base@21.0.4/Pattern.java:4888)
        at java.util.regex.Pattern$GroupHead.match(java.base@21.0.4/Pattern.java:4804)
        at java.util.regex.Pattern$Branch.match(java.base@21.0.4/Pattern.java:4749)
        at java.util.regex.Pattern$Begin.match(java.base@21.0.4/Pattern.java:3683)
        at java.util.regex.Matcher.match(java.base@21.0.4/Matcher.java:1797)
        at java.util.regex.Matcher.matches(java.base@21.0.4/Matcher.java:752)
        at vn.pay.transfer.TransferValidator.isValidReference(TransferValidator.java:57)
        at vn.pay.transfer.TransferValidator.validate(TransferValidator.java:38)
        at vn.pay.transfer.BatchVerifyJob.verifyItem(BatchVerifyJob.java:73)
        at vn.pay.transfer.BatchVerifyJob.lambda$submit$0(BatchVerifyJob.java:51)
        at java.util.concurrent.FutureTask.run(java.base@21.0.4/FutureTask.java:317)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1144)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@21.0.4/ThreadPoolExecutor.java:642)
        at java.lang.Thread.runWith(java.base@21.0.4/Thread.java:1596)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

"transfer-verify-9" #94 [14902] prio=5 os_prio=0 cpu=812.11ms elapsed=18405.19s tid=0x00007f8c2c1c1000 nid=14902 waiting on condition  [0x00007f8c1acfb000]
   java.lang.Thread.State: WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x000000076b6c0f20> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
        at java.util.concurrent.locks.LockSupport.park(java.base@21.0.4/LockSupport.java:371)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.await(java.base@21.0.4/AbstractQueuedSynchronizer.java:1707)
        at java.util.concurrent.LinkedBlockingQueue.take(java.base@21.0.4/LinkedBlockingQueue.java:435)
        at java.util.concurrent.ThreadPoolExecutor.getTask(java.base@21.0.4/ThreadPoolExecutor.java:1070)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1130)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@21.0.4/ThreadPoolExecutor.java:642)
        at java.lang.Thread.runWith(java.base@21.0.4/Thread.java:1596)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

"http-nio-8080-exec-11" #71 [14305] prio=5 os_prio=0 cpu=2210.55ms elapsed=18423.74s tid=0x00007f8c2c15c000 nid=14305 runnable  [0x00007f8c1a4f6000]
   java.lang.Thread.State: RUNNABLE
        at java.util.HashMap.getNode(java.base@21.0.4/HashMap.java:570)
        at java.util.HashMap.get(java.base@21.0.4/HashMap.java:558)
        at org.springframework.core.convert.support.GenericConversionService.getConverter(GenericConversionService.java:203)
        at org.springframework.web.method.support.InvocableHandlerMethod.getMethodArgumentValues(InvocableHandlerMethod.java:224)
        at org.springframework.web.method.support.InvocableHandlerMethod.invokeForRequest(InvocableHandlerMethod.java:178)
        at org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1089)

"HikariPool-1 housekeeper" #52 [13729] daemon prio=5 os_prio=0 cpu=44.10ms elapsed=18433.56s tid=0x00007f8c2c1d0000 nid=13729 waiting on condition  [0x00007f8c1a1f2000]
   java.lang.Thread.State: TIMED_WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x000000076b6c0a48> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
        at java.util.concurrent.locks.LockSupport.parkNanos(java.base@21.0.4/LockSupport.java:269)
        at java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(java.base@21.0.4/ScheduledThreadPoolExecutor.java:1182)

"G1 Service" os_prio=0 cpu=512.09ms elapsed=18438.41s tid=0x00007f8c2c1a9000 nid=13441 runnable`
    },
    {
      name: 'async-profiler-cpu.txt',
      lang: 'text',
      content: `$ asprof -d 10 -i 5ms -e cpu -o summary,traces=1,flat=4 1
Profiling for 10 seconds
Done
--- Execution profile ---
Total samples       : 4002

Frame buffer usage  : 0.0213%

--- 19560000000 ns (97.75%), 3912 samples
  [ 0] java.util.regex.Pattern$Loop.match
  [ 1] java.util.regex.Pattern$GroupTail.match
  [ 2] java.util.regex.Pattern$CharPropertyGreedy.match
  [ 3] java.util.regex.Pattern$GroupHead.match
  [ 4] java.util.regex.Pattern$Loop.match
  [ 5] java.util.regex.Pattern$GroupTail.match
  [ 6] java.util.regex.Pattern$CharPropertyGreedy.match
  [ 7] java.util.regex.Pattern$GroupHead.match
  [ 8] java.util.regex.Pattern$Prolog.match
  [ 9] java.util.regex.Pattern$GroupHead.match
  [10] java.util.regex.Pattern$Branch.match
  [11] java.util.regex.Pattern$Begin.match
  [12] java.util.regex.Matcher.match
  [13] java.util.regex.Matcher.matches
  [14] vn.pay.transfer.TransferValidator.isValidReference
  [15] vn.pay.transfer.TransferValidator.validate
  [16] vn.pay.transfer.BatchVerifyJob.verifyItem
  [17] vn.pay.transfer.BatchVerifyJob.lambda$submit$0
  [18] java.util.concurrent.FutureTask.run
  [19] java.util.concurrent.ThreadPoolExecutor.runWorker
  [20] java.util.concurrent.ThreadPoolExecutor$Worker.run
  [21] java.lang.Thread.runWith
  [22] java.lang.Thread.run

          ns  percent  samples  top
  ----------  -------  -------  ---
 19620000000   98.05%     3924  java.util.regex.Pattern$Loop.match
   245000000    1.22%       49  java.util.regex.Pattern$GroupTail.match
   130000000    0.65%       26  java.util.regex.Pattern$CharPropertyGreedy.match
    15000000    0.07%        3  jdk.internal.misc.Unsafe.park`
    }
  ],
  questions: [
    'Bằng cách nào bạn xác định đúng thread đang đốt CPU? Trình bày quy trình top -H và khớp TID với nid trong thread dump bằng các con số cụ thể. Vì sao lệnh grep theo hex trong artifact trả về 0 dòng?',
    'Vì sao CPU 200% mà /actuator/health vẫn UP và liveness probe không restart? Điều này nói gì về việc chỉ dựa vào health check?',
    'Nguyên nhân gốc của vòng lặp CPU và cách sửa cả ngắn hạn lẫn dài hạn, kể cả khi pattern do người dùng cấu hình (untrusted input).'
  ],
  hints: [
    'TID trong top là thập phân. Đến JDK 17, nid trong jstack là hex (14872 = 0x3a18, 14888 = 0x3a28) nên phải đổi; từ JDK 18 (JDK-8268425) nid được in thập phân và header có thêm [TID] sau #N. Pod chạy Java 21 — so sánh dòng grep hex (0 kết quả) với dòng grep thập phân.',
    'Nhìn stack: không có IO, không có lock, không có DB — chỉ có chuỗi frame Pattern$Loop / GroupHead / CharPropertyGreedy / GroupTail lặp đi lặp lại phía trên Matcher.matches. Đây là dấu hiệu backtracking của regex, không phải vòng lặp while trong code.',
    'Pattern của merchant MC-8841 là ^(([0-9]+)+)?[A-Z]$ và input là chuỗi 42 chữ số không có chữ cái cuối. Thử đếm số cách chia 42 chữ số vào các nhóm lồng nhau.'
  ],
  answer: `**Tóm tắt:** Hai thread {{transfer-verify-3}} (TID/nid **14872**) và {{transfer-verify-7}} (TID/nid **14888**) đang chạy **regex backtracking bùng nổ** từ pattern {{^(([0-9]+)+)?[A-Z]$}} của merchant MC-8841. Mỗi thread chiếm trọn một core (99,7% và 98,9%), pod 2 vCPU nên tổng ~199%. Đây là **ReDoS** (Regular Expression Denial of Service) chứ không phải deadlock, memory leak hay DB chậm. Regex của Java không có timeout và không thể interrupt, nên cách duy nhất để dừng là restart process.

### Quy trình tìm thread nóng (đúng thứ tự)

1. {{top -b -n 1 -p 1}} cho thấy process 198,6%; {{top -H -b -n 1 -p 1}} — {{-H}} hiển thị từng **thread** (TID) thay vì process, cột COMMAND là tên thread Java bị cắt 15 ký tự. Kết quả: TID {{14872}} = 99,7% CPU, TID {{14888}} = 98,9% (đều là {{transfer-verify}}). Host 4 core có %Cpu(s) ~50% user, tức đúng 2 core bị đốt — nghĩa là cháy CPU trong Java, không phải chờ IO.
2. Khớp TID với {{nid}} trong dump. **Bẫy phiên bản:** đến JDK 17, {{nid}} in dạng hex nên phải {{printf '0x%x\\n' 14872 14888}} → {{0x3a18}} / {{0x3a28}}; từ JDK 18 (JDK-8268425) {{nid}} in **thập phân** và header có thêm {{[14872]}} ngay sau {{#88}}. Pod chạy Java 21 nên grep hex trả về 0 dòng — đúng như artifact.
3. Grep dump bằng số thập phân: {{jcmd 1 Thread.print | grep 'nid=14872 '}} → đúng thread {{transfer-verify-3}}, state {{RUNNABLE}}, cpu=354 880ms ≈ 5:54 phút CPU, khớp TIME+ {{5:52.88}} của top vài giây trước; {{nid=14888}} là {{transfer-verify-7}}.
4. Lấy 3–5 sample cách nhau vài giây: nếu cùng TID vẫn {{RUNNABLE}} ở cùng nhóm frame thì đó là vòng lặp nóng thật, không phải tình cờ.
5. Xác nhận bằng profiler: ~98% sample có top frame {{java.util.regex.Pattern$Loop.match}}, call trace đi qua {{Matcher.matches}} ← {{TransferValidator.isValidReference}} ← {{BatchVerifyJob.verifyItem}} — không còn nghi ngờ.

Mẹo đọc: stack của thread nóng lặp chu kỳ {{Loop.match}} → {{GroupHead.match}} → {{CharPropertyGreedy.match}} → {{GroupTail.match}}; độ sâu bị chặn theo độ dài input (vài frame mỗi ký tự) và dao động giữa các sample, không tăng mãi như đệ quy vô hạn (sẽ kết thúc bằng {{StackOverflowError}}). Nếu là chờ lock sẽ thấy {{BLOCKED}} + {{waiting to lock}} — dump này không có thread nào như vậy. {{http-nio-8080-exec-11}} chỉ là nạn nhân: RUNNABLE nhưng tranh CPU với hai thread nóng nên request chậm.

### Nguyên nhân gốc — catastrophic backtracking

Pattern merchant cấu hình:

~~~text
^(([0-9]+)+)?[A-Z]$
~~~

Với input {{202610220000001234567890123456789012345678}} (42 chữ số, không có chữ cái ở cuối):

- Nhóm ngoài {{(...)+}} lặp, bên trong {{[0-9]+}} cũng lặp → cùng một dãy 42 chữ số có thể chia thành các nhóm theo **hàng tỉ cách** (mỗi vị trí là một ranh giới nhóm hoặc không).
- Engine regex của Java là backtracking NFA: khi gặp {{[A-Z]}} thất bại ở cuối chuỗi, nó thử mọi cách chia nhóm trước đó rồi mới kết luận không khớp. Số bước là hàm mũ theo độ dài input, xấp xỉ {{2^(n-1)}}.
- Chi tiết đáng nói khi phỏng vấn: từ JDK 9, {{java.util.regex}} có memo hoá cho vòng lặp tham lam **ở cấp ngoài cùng** — chính {{^([0-9]+)+[A-Z]$}} trần trụi trên Java 17/21 trả về gần như tức thì. Nhưng chỉ cần bọc nó trong một nhóm tuỳ chọn {{(...)?}} như pattern của merchant, vòng lặp không còn ở cấp ngoài cùng, memo không áp dụng và độ phức tạp quay lại hàm mũ (đo trên JDK 17: 24 chữ số ~0,4–1 giây, 28 chữ số ~8 giây, mỗi chữ số thêm gần gấp đôi). Vì vậy không thể dựa vào "JDK đã tối ưu".
- 42 ký tự → khoảng {{2^41 ≈ 2,2 × 10^12}} bước, tức hàng giờ đến hàng ngày cho một request. Vì vậy hai thread "kẹt" ở 100% CPU, thực tế không bao giờ trả kết quả.

Pattern được biên dịch và match trong {{TransferValidator.isValidReference}} dòng 57, gọi từ pool {{transfer-verify}} xử lý lô đối soát ({{BatchVerifyJob.verifyItem}} dòng 73); các lệnh chuyển tiền lẻ qua API cũng dùng cùng validator. Không có giới hạn độ dài input trước khi matches, và pattern đến từ DB do merchant nhập — tức **untrusted regex**, một lỗ hổng ReDoS điển hình. Việc compile lại mỗi lần còn làm tăng chi phí nhưng không phải nguyên nhân chính.

### Vì sao health check vẫn UP

{{/actuator/health}} chỉ kiểm tra các {{HealthIndicator}} (DB, disk, ping) chứ không kiểm tra CPU saturation hay độ dài hàng đợi request. Thread pool vẫn nhận task mới (2 thread nóng không giữ lock toàn cục), nên probe vẫn 200 OK. Kết quả: Kubernetes không restart, autoscaler theo CPU có thể scale nhưng mỗi pod mới cũng bị đầu độc khi nhận đúng request đó. Bài học: cần thêm **CPU throttling**, **latency SLO**, **queue depth** vào tiêu chí alert/scale, không chỉ health.

### Cách sửa

**Ngắn hạn (15 phút):**
1. Xác nhận merchant MC-8841 và tắt/tạm khoá pattern của họ trong DB (hoặc feature flag), sau đó **restart pod** để giải phóng 2 thread đang quay. Không thể dừng thread bằng tay: {{Thread.interrupt()}} không ảnh hưởng {{Matcher.matches}} (không kiểm tra interrupt), còn {{Thread.stop()}} từ JDK 20 ném {{UnsupportedOperationException}}.
2. Chặn/rate-limit request từ merchant đó ở gateway để tránh pod mới bị đốt lại.
3. Kiểm tra các lệnh chuyển tiền của họ có bị treo/không phản hồi để xử lý nghiệp vụ (đối soát, trả kết quả timeout).

**Dài hạn:**
- Sửa pattern: bỏ nhóm lồng vô nghĩa, viết lại thành dạng tuyến tính {{^[0-9]*[A-Z]$}} (cùng ngữ nghĩa: không hoặc nhiều chữ số rồi một chữ cái). Với regex thông thường, xét dùng **RE2/J** (thư viện {{com.google.re2j}}) — engine tuyến tính, không backtracking, an toàn với input không tin cậy. Đánh đổi: RE2/J không hỗ trợ backreference và lookaround.
- Nếu buộc dùng {{java.util.regex}}, phải **giới hạn độ dài input** trước khi match và **allowlist pattern**: chỉ cho merchant chọn từ bộ pattern đã duyệt, không cho nhập regex tự do.
- Cache {{Pattern.compile}} theo pattern id (compile một lần), đồng thời validate pattern lúc lưu bằng bộ test chống backtracking (thử input xấu, đo thời gian).
- Chạy validate trong **process/thread pool riêng có giới hạn** để một pattern xấu không đốt hết core của API chính; hoặc chuyển sang bộ lọc viết bằng code (kiểm tra ký tự, độ dài) thay vì regex.
- Thêm timeout thật cho regex: bọc input bằng một {{CharSequence}} tự viết, trong {{charAt()}} kiểm tra deadline (hoặc cờ interrupt) và ném exception khi quá 50ms — engine gọi {{charAt()}} liên tục khi backtrack nên sẽ bị cắt đúng hạn. Chỉ đặt {{Future.get(timeout)}} ở worker riêng là chưa đủ: caller thôi chờ nhưng thread vẫn quay đốt CPU.

| Biện pháp | Chặn ReDoS | Chi phí |
|---|---|---|
| Viết lại regex tuyến tính | Có, nếu làm đúng | Thấp |
| Giới hạn độ dài input | Giảm mạnh, không tuyệt đối | Rất thấp |
| Allowlist pattern | Có | Trung bình (vận hành) |
| RE2/J | Có (linear time) | Đổi thư viện, mất lookaround |
| Worker riêng + timeout logic | Có, cô lập | Cao hơn |

### Phòng ngừa

- Alert theo **CPU throttling** ({{container_cpu_cfs_throttled_seconds_total}}) và **p99 latency**, không chỉ CPU trung bình; CPU 199% trên 2 vCPU là dấu hiệu bão hoà tuyệt đối.
- Bật JFR hoặc async-profiler định kỳ; mẫu CPU 10 giây đủ chỉ ra top frame regex.
- Thêm test ReDoS vào CI cho mọi pattern người dùng cấu hình: chạy với input dài 40–50 ký tự và assert < 50ms.
- Ghi runbook: quy trình {{top -H}} → khớp TID với {{nid}} trong {{jcmd Thread.print}} là kỹ năng bắt buộc cho on-call, kèm ghi chú phiên bản: JDK ≤ 17 đổi TID sang hex ({{printf '0x%x'}}), JDK 18+ grep thẳng số thập phân.

> Senior tip: Đừng vội đổ cho "HashMap dùng đồng thời" khi thấy CPU 100% — đó là câu chuyện của JDK 7, còn JDK 8+ hiếm khi quay vòng như vậy, và stack sẽ khác hoàn toàn ({{HashMap.resize}} / {{putVal}}). Hãy để stack quyết định. Một chi tiết thực chiến: {{top -H}} và {{ps -L -o tid,comm}} in TID dạng thập phân; {{jstack}}/{{jcmd}} của JDK 8–17 in nid dạng hex (phải {{printf '0x%x'}}), còn từ JDK 18 in thập phân kèm {{[TID]}} sau {{#N}}. Nhiều runbook cũ vẫn dạy đổi hex — trên Java 21 grep hex sẽ ra 0 dòng và on-call dễ kết luận nhầm "thread đã chết". Và nhớ rằng regex từ người dùng là **input không tin cậy**, đúng như SQL injection — hãy đối xử với nó bằng allowlist chứ không bằng niềm tin.`,
  rubric: [
    'Trình bày đúng quy trình top -H lấy TID 14872/14888 và khớp với nid=14872/14888 (thập phân trên Java 21; hex 0x3a18/0x3a28 chỉ dùng cho JDK ≤ 17) trong jstack, ra thread transfer-verify-3/7.',
    'Chỉ ra nguyên nhân là catastrophic backtracking của regex ^(([0-9]+)+)?[A-Z]$ với input 42 chữ số, giải thích độ phức tạp hàm mũ (nhóm lặp lồng nhau) và vì sao thread RUNNABLE đốt 100% CPU.',
    'Giải thích health check vẫn UP vì không đo CPU saturation/latency, và đề xuất alert theo throttling/p99/queue depth.',
    'Đề xuất sửa: allowlist/giới hạn độ dài, viết lại regex tuyến tính hoặc RE2/J, tắt pattern và restart pod, kèm phòng ngừa test ReDoS.'
  ],
  tags: ['high-cpu', 'regex', 'redos', 'jstack', 'top-h']
},
{
  id: 'lab-thread-006',
  category: 'thread',
  title: 'Campaign 20:00: API báo giá treo vĩnh viễn, 16 thread quote-pool cùng chờ join()',
  level: 'senior',
  scenario: `**Bối cảnh:** **PayVN Checkout** (Spring Boot 3.4, Java 21, pod 4 vCPU) có endpoint {{POST /checkout/quote}} tính giá cuối cho giỏ hàng. Để "chạy song song cho nhanh", {{QuoteService}} chạy phần tính giá trên một executor riêng {{quoteExecutor = Executors.newFixedThreadPool(16)}} (thread đặt tên {{quote-pool-N}}). Bên trong task tính giá, code lại gửi thêm 2 task con (phí ship, voucher) lên **cùng executor đó** rồi {{join()}}. Controller chờ kết quả bằng {{future.get(3, SECONDS)}}.

**Triệu chứng:** Ngày thường (~60 req/s) chưa từng lỗi. Lúc **20:00:04 ngày 24/10/2026** campaign mở, tải lên ~900 req/s. Từ **20:00:06** mọi request {{/checkout/quote}} đều trả **504 sau đúng 3 giây**, kể cả khi tải đã giảm về 50 req/s lúc 20:20. CPU pod chỉ **2–3%**, DB và hai service phí ship/voucher hoàn toàn bình thường (chúng gần như **không nhận được request nào** từ checkout sau 20:00:06). Không có exception nào ngoài {{TimeoutException}}. Restart pod là hết, cho tới đợt tải đột biến tiếp theo.

**Dữ liệu thu thập:** {{jcmd 1 Thread.print -l}} lúc 20:07:15, metric executor từ Micrometer, log ứng dụng và đoạn code {{QuoteService}}.`,
  artifacts: [
    {
      name: 'thread-print-checkout-20-07.txt',
      lang: 'text',
      content: `1:
2026-10-24 20:07:15
Full thread dump OpenJDK 64-Bit Server VM (21.0.4+7-LTS-151 mixed mode, sharing):

"quote-pool-1" #58 [3117] prio=5 os_prio=0 cpu=1204.33ms elapsed=29011.40s tid=0x00007f1e4c3a2000 nid=3117 waiting on condition  [0x00007f1dfa1f0000]
   java.lang.Thread.State: WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x00000007a1c2e3f8> (a java.util.concurrent.CompletableFuture$Signaller)
        at java.util.concurrent.locks.LockSupport.park(java.base@21.0.4/LockSupport.java:371)
        at java.util.concurrent.CompletableFuture$Signaller.block(java.base@21.0.4/CompletableFuture.java:1898)
        at java.util.concurrent.ForkJoinPool.unmanagedBlock(java.base@21.0.4/ForkJoinPool.java:3780)
        at java.util.concurrent.ForkJoinPool.managedBlock(java.base@21.0.4/ForkJoinPool.java:3725)
        at java.util.concurrent.CompletableFuture.waitingGet(java.base@21.0.4/CompletableFuture.java:1932)
        at java.util.concurrent.CompletableFuture.join(java.base@21.0.4/CompletableFuture.java:2117)
        at vn.pay.checkout.quote.QuoteService.buildQuote(QuoteService.java:74)
        at vn.pay.checkout.quote.QuoteService.lambda$quoteAsync$0(QuoteService.java:52)
        at vn.pay.checkout.quote.QuoteService$$Lambda/0x00007f1dd8331a20.get(Unknown Source)
        at java.util.concurrent.CompletableFuture$AsyncSupply.run(java.base@21.0.4/CompletableFuture.java:1768)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1144)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@21.0.4/ThreadPoolExecutor.java:642)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

   Locked ownable synchronizers:
        - <0x00000007a0f11a20> (a java.util.concurrent.ThreadPoolExecutor$Worker)

"quote-pool-2" #59 [3118] prio=5 os_prio=0 cpu=1198.07ms elapsed=29011.39s tid=0x00007f1e4c3a4000 nid=3118 waiting on condition  [0x00007f1dfa0ef000]
   java.lang.Thread.State: WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x00000007a1c31b70> (a java.util.concurrent.CompletableFuture$Signaller)
        at java.util.concurrent.locks.LockSupport.park(java.base@21.0.4/LockSupport.java:371)
        at java.util.concurrent.CompletableFuture$Signaller.block(java.base@21.0.4/CompletableFuture.java:1898)
        at java.util.concurrent.ForkJoinPool.unmanagedBlock(java.base@21.0.4/ForkJoinPool.java:3780)
        at java.util.concurrent.ForkJoinPool.managedBlock(java.base@21.0.4/ForkJoinPool.java:3725)
        at java.util.concurrent.CompletableFuture.waitingGet(java.base@21.0.4/CompletableFuture.java:1932)
        at java.util.concurrent.CompletableFuture.join(java.base@21.0.4/CompletableFuture.java:2117)
        at vn.pay.checkout.quote.QuoteService.buildQuote(QuoteService.java:74)
        at vn.pay.checkout.quote.QuoteService.lambda$quoteAsync$0(QuoteService.java:52)
        at vn.pay.checkout.quote.QuoteService$$Lambda/0x00007f1dd8331a20.get(Unknown Source)
        at java.util.concurrent.CompletableFuture$AsyncSupply.run(java.base@21.0.4/CompletableFuture.java:1768)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1144)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@21.0.4/ThreadPoolExecutor.java:642)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

   Locked ownable synchronizers:
        - <0x00000007a0f11c58> (a java.util.concurrent.ThreadPoolExecutor$Worker)

"quote-pool-16" #73 [3132] prio=5 os_prio=0 cpu=1187.92ms elapsed=29011.21s tid=0x00007f1e4c3c1000 nid=3132 waiting on condition  [0x00007f1df92e1000]
   java.lang.Thread.State: WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x00000007a1c6d208> (a java.util.concurrent.CompletableFuture$Signaller)
        at java.util.concurrent.locks.LockSupport.park(java.base@21.0.4/LockSupport.java:371)
        at java.util.concurrent.CompletableFuture$Signaller.block(java.base@21.0.4/CompletableFuture.java:1898)
        at java.util.concurrent.ForkJoinPool.unmanagedBlock(java.base@21.0.4/ForkJoinPool.java:3780)
        at java.util.concurrent.ForkJoinPool.managedBlock(java.base@21.0.4/ForkJoinPool.java:3725)
        at java.util.concurrent.CompletableFuture.waitingGet(java.base@21.0.4/CompletableFuture.java:1932)
        at java.util.concurrent.CompletableFuture.join(java.base@21.0.4/CompletableFuture.java:2117)
        at vn.pay.checkout.quote.QuoteService.buildQuote(QuoteService.java:74)
        at vn.pay.checkout.quote.QuoteService.lambda$quoteAsync$0(QuoteService.java:52)
        at vn.pay.checkout.quote.QuoteService$$Lambda/0x00007f1dd8331a20.get(Unknown Source)
        at java.util.concurrent.CompletableFuture$AsyncSupply.run(java.base@21.0.4/CompletableFuture.java:1768)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1144)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@21.0.4/ThreadPoolExecutor.java:642)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

   Locked ownable synchronizers:
        - <0x00000007a0f13e90> (a java.util.concurrent.ThreadPoolExecutor$Worker)

"http-nio-8080-exec-118" #241 [3417] daemon prio=5 os_prio=0 cpu=88.41ms elapsed=421.07s tid=0x00007f1e4c8d9000 nid=3417 waiting on condition  [0x00007f1dd2bfa000]
   java.lang.Thread.State: TIMED_WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x00000007a7e40c10> (a java.util.concurrent.CompletableFuture$Signaller)
        at java.util.concurrent.locks.LockSupport.parkNanos(java.base@21.0.4/LockSupport.java:269)
        at java.util.concurrent.CompletableFuture$Signaller.block(java.base@21.0.4/CompletableFuture.java:1896)
        at java.util.concurrent.ForkJoinPool.unmanagedBlock(java.base@21.0.4/ForkJoinPool.java:3780)
        at java.util.concurrent.ForkJoinPool.managedBlock(java.base@21.0.4/ForkJoinPool.java:3725)
        at java.util.concurrent.CompletableFuture.timedGet(java.base@21.0.4/CompletableFuture.java:1997)
        at java.util.concurrent.CompletableFuture.get(java.base@21.0.4/CompletableFuture.java:2095)
        at vn.pay.checkout.quote.QuoteController.quote(QuoteController.java:38)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)
        at org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1089)
        at org.apache.tomcat.util.threads.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:1190)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

   Locked ownable synchronizers:
        - <0x00000007a69d0e48> (a org.apache.tomcat.util.threads.ThreadPoolExecutor$Worker)

# Ghi chú on-call:
#   grep -c '"quote-pool-' td.txt                         -> 16   (đúng bằng corePoolSize = maxPoolSize = 16)
#   grep -A11 '"quote-pool-' td.txt | grep -c 'buildQuote(QuoteService.java:74)'  -> 16
#   16 Signaller khác nhau, không thread nào RUNNABLE trong pool.
#   Cuối dump KHÔNG có dòng "Found one Java-level deadlock".`
    },
    {
      name: 'metrics-and-log.txt',
      lang: 'text',
      content: `# Micrometer ExecutorServiceMetrics (Prometheus), pod checkout-6b8f-2xk4q
# time       pool_size  active  queued  completed_total
20:00:00         16        3       0      1208311
20:00:05         16       16      41      1208339
20:00:06         16       16     312      1208344
20:01:00         16       16    9 870      1208344
20:05:00         16       16   41 236      1208344
20:07:00         16       16   50 994      1208344

executor_pool_size_threads{name="quoteExecutor"} 16.0
executor_active_threads{name="quoteExecutor"} 16.0
executor_queued_tasks{name="quoteExecutor"} 50994.0
executor_completed_tasks_total{name="quoteExecutor"} 1208344.0

# downstream (cùng khung giờ)
http_client_requests_seconds_count{uri="/shipping/fee"}   tăng 0 kể từ 20:00:06
http_client_requests_seconds_count{uri="/voucher/best"}   tăng 0 kể từ 20:00:06

# log ứng dụng
2026-10-24T20:00:06.412+07:00  WARN 1 --- [nio-8080-exec-7] v.p.checkout.quote.QuoteController : quote timeout after 3000ms cart=C-88120931
2026-10-24T20:00:06.415+07:00  WARN 1 --- [nio-8080-exec-9] v.p.checkout.quote.QuoteController : quote timeout after 3000ms cart=C-88120944
2026-10-24T20:07:14.902+07:00  WARN 1 --- [io-8080-exec-118] v.p.checkout.quote.QuoteController : quote timeout after 3000ms cart=C-88431187
# kubectl top pod: CPU 104m / 4000m, memory 1.9Gi (tăng dần, ngày thường 1.2Gi)`
    },
    {
      name: 'QuoteService.java',
      lang: 'java',
      content: `@Configuration
class ExecutorConfig {
    @Bean
    ExecutorService quoteExecutor() {
        // FixedThreadPool: 16 thread, hàng đợi LinkedBlockingQueue KHÔNG giới hạn
        return Executors.newFixedThreadPool(16, Thread.ofPlatform().name("quote-pool-", 1).factory());
    }
}

@Service
public class QuoteService {                                          // dòng 45
    private final ExecutorService quoteExecutor;
    // ... constructor injection, shippingClient, voucherClient, pricing

    public CompletableFuture<Quote> quoteAsync(Order order) {         // dòng 50
        return CompletableFuture.supplyAsync(
                () -> buildQuote(order), quoteExecutor);               // dòng 52: task CHA
    }

    Quote buildQuote(Order order) {                                    // dòng 66
        CompletableFuture<Fee> fee = CompletableFuture.supplyAsync(
                () -> shippingClient.fee(order), quoteExecutor);       // task CON 1
        CompletableFuture<Voucher> voucher = CompletableFuture.supplyAsync(
                () -> voucherClient.best(order), quoteExecutor);       // task CON 2
        Price base = pricing.base(order);                              // ~5 ms
        // chờ task con, KHÔNG có timeout
        return Quote.of(base, fee.join(), voucher.join());             // dòng 74
    }
}

// QuoteController dòng 38:
//   return quoteService.quoteAsync(order).get(3, TimeUnit.SECONDS);`
    }
  ],
  questions: [
    'Vì sao pool 16 thread treo vĩnh viễn trong khi CPU gần 0 và downstream rảnh? Dẫn chứng bằng dump và metric.',
    'Vì sao jstack không báo deadlock dù hệ thống "kẹt cứng"? Hiện tượng này gọi là gì?',
    'Bạn sửa thế nào (ngắn hạn, dài hạn) và làm sao để test tái hiện được lỗi trước khi lên production?'
  ],
  hints: [
    'Đếm số thread quote-pool và xem cả 16 đang làm gì: tất cả cùng dừng ở {{buildQuote(QuoteService.java:74)}}, tức là đang {{join()}} chờ task con.',
    'Task con được gửi vào đâu? Nếu cả 16 thread đều đang bận chờ, ai sẽ lấy task con ra khỏi hàng đợi để chạy?',
    'Metric: {{active=16}}, {{queued}} tăng liên tục, {{completed_total}} đứng yên ở 1208344 từ 20:00:06, và downstream nhận 0 request. Đây là thread-starvation deadlock (pool-induced deadlock), không phải deadlock khoá.'
  ],
  answer: `**Tóm tắt:** Đây là **thread-starvation deadlock** (còn gọi là pool-induced deadlock): task cha chạy trên {{quoteExecutor}} lại gửi task con vào **chính executor đó** rồi {{join()}} chờ. Lúc 20:00:05 tải đột biến làm cả 16 thread cùng chạy task cha; task con của chúng nằm trong hàng đợi phía sau, **không còn thread nào rảnh để chạy**, nên 16 thread chờ nhau mãi mãi. Sửa: không bao giờ chặn chờ task con trên cùng pool bị giới hạn — dùng executor riêng cho task con (hoặc gọi đồng bộ), hoặc ghép bằng {{thenCombine}} không chặn, luôn có timeout.

### Hiểu từ gốc: thread pool cố định hoạt động thế nào

Hình dung quầy giao dịch có **16 nhân viên** (16 thread) và **một hàng chờ dài vô tận** (LinkedBlockingQueue không giới hạn). Khách (task) xếp hàng, nhân viên rảnh thì gọi khách tiếp theo. Một nhân viên chỉ phục vụ được 1 khách tại một thời điểm.

Bây giờ mỗi khách lại yêu cầu: "tôi cần thêm 2 giấy tờ phụ, hãy lấy số thứ tự cho giấy tờ đó rồi **tôi đứng chờ ở quầy** cho tới khi có". Giấy tờ phụ cũng phải xếp **cùng hàng chờ** và cũng phải do **một trong 16 nhân viên** làm. Ngày vắng: 3 nhân viên bận, 13 người rảnh lập tức xử lý giấy tờ phụ, mọi thứ trôi. Ngày campaign: 16 khách lên quầy cùng lúc, cả 16 nhân viên đứng chờ giấy tờ phụ, mà giấy tờ phụ nằm trong hàng chờ **phía sau** hàng trăm khách khác. Không ai rảnh để làm giấy tờ phụ, nên không ai xong. Đó là "đói thread" dẫn đến kẹt vĩnh viễn.

~~~text
quoteExecutor (16 thread)                 LinkedBlockingQueue (không giới hạn)
+---------------------------+            +---------------------------------------+
| quote-pool-1 : CHA#1 join |--chờ--+    | CHA#17 | CHA#18 | ... | CON1#1 | CON2#1|
| quote-pool-2 : CHA#2 join |--chờ--|--> | ... CON1#2 | CON2#2 ... CON1#16 ...    |
| ...                       |       |    +---------------------------------------+
| quote-pool-16: CHA#16 join|--chờ--+       ^ task con nằm đây, không ai lấy ra
+---------------------------+
Điều kiện kẹt: số task CHA đang chạy = kích thước pool (16) VÀ mỗi CHA chờ CON cùng pool.
~~~

Vì sao ngày thường không lỗi? Ở 60 req/s, mỗi quote ~60 ms nên trung bình chỉ ~4 task cha chạy đồng thời; luôn còn thread rảnh cho task con. Lỗi chỉ xuất hiện khi **số task cha đồng thời chạm 16** — đúng lúc burst 900 req/s. Và một khi đã kẹt thì **không bao giờ tự thoát**, vì {{join()}} không có timeout; tải giảm về 50 req/s cũng vô ích.

### Vì sao jstack không báo deadlock

JVM chỉ phát hiện deadlock dạng **vòng khoá**: thread A giữ monitor/lock X chờ Y, thread B giữ Y chờ X (monitor của {{synchronized}} hoặc ownable synchronizer như {{ReentrantLock}}). Ở đây không thread nào **giữ** thứ mà thread khác đang chờ: mỗi quote-pool chờ một {{CompletableFuture$Signaller}} riêng (16 id khác nhau), tức chờ một **sự kiện tương lai** ("future hoàn thành"). JVM không biết future đó phụ thuộc vào việc một thread trong pool được rảnh. Vì vậy dump không có dòng "Found one Java-level deadlock" — nhưng về bản chất vẫn là deadlock tài nguyên (tài nguyên = thread của pool). Dòng {{ThreadPoolExecutor$Worker}} trong "Locked ownable synchronizers" chỉ là khoá nội bộ worker tự giữ khi đang chạy task, không liên quan.

Chú ý thêm stack có {{ForkJoinPool.managedBlock}} → {{unmanagedBlock}}: {{CompletableFuture}} có cơ chế "báo trước tôi sắp chặn" để **ForkJoinPool** tạo thêm thread bù. Nhưng thread đang chạy là thread của {{ThreadPoolExecutor}} thường, nên rơi vào nhánh {{unmanagedBlock}}: **không có thread bù nào**.

### Dẫn chứng từ artifact

- **Cả 16** thread {{quote-pool-1..16}} ở {{WAITING (parking)}} trên {{CompletableFuture$Signaller}} với stack {{join}} ← {{buildQuote(QuoteService.java:74)}} ← {{lambda$quoteAsync$0(QuoteService.java:52)}}: tức là thread đang chạy **task cha** và chờ **task con**. Không thread nào trong pool đang chạy task con.
- Code dòng 66–74: task con gửi vào {{quoteExecutor}} — cùng pool với task cha; {{join()}} không timeout.
- Metric: {{active_threads=16}} = pool size; {{queued_tasks}} từ 41 (20:00:05) lên **50 994** (20:07); {{completed_tasks_total}} **đứng yên ở 1 208 344** từ 20:00:06 → pool không hoàn thành thêm task nào trong 7 phút.
- Downstream {{/shipping/fee}} và {{/voucher/best}} nhận **0 request** sau 20:00:06: task con chưa bao giờ được chạy, loại trừ giả thuyết "downstream chậm".
- CPU 104m/4000m: mọi thread đều đang park, không ai làm việc. Thread HTTP ({{http-nio-8080-exec-118}}) chờ {{get(3s)}} rồi trả 504 → khớp log "quote timeout after 3000ms".
- Memory tăng 1.2Gi → 1.9Gi: hàng đợi không giới hạn tích 50 994 task (mỗi task giữ {{Order}} + giỏ hàng) — nếu để lâu sẽ thành OOM.

### Cách sửa

**Ngắn hạn (giảm đau ngay):** restart pod để giải phóng 16 thread; tạm thời đổi task con sang **gọi đồng bộ** ngay trong task cha (mất song song nhưng không thể kẹt), hoặc tách executor như dưới đây — đây là thay đổi nhỏ, có thể hotfix.

**Sửa gốc — không chặn chờ task con trên cùng pool:**

~~~java
// Phương án 1: executor RIÊNG cho task con (bulkhead), có giới hạn + timeout
CompletableFuture<Quote> quoteAsync(Order o) {
    CompletableFuture<Fee> fee = CompletableFuture
        .supplyAsync(() -> shippingClient.fee(o), ioExecutor)     // pool khác quoteExecutor
        .orTimeout(800, TimeUnit.MILLISECONDS);                   // không bao giờ chờ vô hạn
    CompletableFuture<Voucher> voucher = CompletableFuture
        .supplyAsync(() -> voucherClient.best(o), ioExecutor)
        .completeOnTimeout(Voucher.NONE, 500, TimeUnit.MILLISECONDS); // fallback mềm
    // Phương án 2: GHÉP không chặn - không thread nào ngồi chờ join()
    return fee.thenCombine(voucher, (f, v) -> Quote.of(pricing.base(o), f, v));
}
~~~

Với {{thenCombine}}, task cha **không tồn tại nữa**: callback chỉ chạy khi cả hai future xong, trên thread vừa hoàn thành future cuối. Không có thread nào ngồi chờ, nên không thể đói thread.

**Phương án 3 (Java 21):** dùng {{Executors.newVirtualThreadPerTaskExecutor()}} cho luồng quote: mỗi task một virtual thread, {{join()}} chỉ park virtual thread và trả carrier lại, nên không có "16 chỗ" để cạn. Nhưng phải tự giới hạn tải xuống downstream (Semaphore, connection pool), vì virtual thread không tự giới hạn.

**Dài hạn:**
- Hàng đợi **có giới hạn** ({{ThreadPoolExecutor}} với {{ArrayBlockingQueue(500)}} + RejectedExecutionHandler trả 503 nhanh) thay vì {{newFixedThreadPool}} không giới hạn — fail fast tốt hơn tích 50k task trong RAM.
- Mọi {{join()/get()}} phải có timeout; mọi pool phải có metric {{active/queued/completed}} và alert "completed không tăng trong khi queued tăng".

### Cách test tái hiện

Đặt pool size = 2 trong test, gửi 2 task cha đồng thời bằng {{CountDownLatch}} để chắc chắn cả hai cùng chạy trước khi gửi task con; với code cũ test sẽ treo — bọc bằng {{assertTimeoutPreemptively(Duration.ofSeconds(2), ...)}} để test **fail** thay vì treo CI. Quy tắc chung: lỗi starvation lộ ra khi **số task đồng thời ≥ pool size**, nên test với pool nhỏ.

### Bảng so sánh lựa chọn

| Cách | Có thể kẹt? | Song song | Ghi chú |
|---|---|---|---|
| Task con cùng pool + join | Có, khi tải ≥ pool size | Có | Lỗi gốc |
| Gọi đồng bộ trong task cha | Không | Không | Đơn giản, chậm hơn ~40 ms |
| Executor riêng cho task con | Không (nếu task con không chờ ngược) | Có | Cần timeout, bulkhead |
| thenCombine không chặn | Không | Có | Tốt nhất, code async |
| Virtual thread per task | Không | Có | Java 21, cần tự giới hạn downstream |

### Lỗi hay gặp

- Dùng {{ForkJoinPool.commonPool()}} (mặc định của {{supplyAsync}} khi không truyền executor) cho task gọi IO rồi join lồng nhau: commonPool chỉ có {{số CPU - 1}} thread, kẹt còn nhanh hơn.
- Tăng pool từ 16 lên 64 và nghĩ là xong: chỉ đẩy ngưỡng kẹt lên cao hơn, burst lớn hơn vẫn kẹt.
- Đọc jstack thấy không có "deadlock" rồi kết luận "không phải deadlock" — phải nhìn **tất cả thread trong pool đang chờ gì**.
- Dùng {{CallerRunsPolicy}} cho pool có task chờ task con: thread HTTP sẽ chạy task cha và cũng có thể chờ vô hạn.

### Trả lời miệng 1 phút

"Cả 16 thread quote-pool đều đang join ở QuoteService dòng 74, chờ task con được gửi vào chính pool đó. Khi burst làm 16 task cha cùng chạy, task con nằm trong hàng đợi phía sau mà không còn thread rảnh, nên kẹt vĩnh viễn: completed đứng yên, queued tăng tới 50 nghìn, downstream không nhận request nào, CPU gần 0. JVM không báo deadlock vì không có vòng khoá, đây là thread-starvation deadlock. Tôi sửa bằng cách tách executor cho task con hoặc ghép bằng thenCombine không chặn, thêm timeout cho mọi join, hàng đợi có giới hạn và alert khi completed không tăng."

> Senior tip: Khi review code có {{CompletableFuture}}, tôi luôn hỏi hai câu: "task này chạy trên pool nào?" và "có chỗ nào join/get bên trong một task khác cùng pool không?". Một alert rất rẻ mà bắt được loại lỗi này: {{rate(executor_completed_tasks_total[1m]) == 0 and executor_queued_tasks > 0}} trong 1 phút. Ở các hệ thống tôi từng làm, alert này phát hiện starvation trước cả khi khách hàng báo lỗi.`,
  rubric: [
    'Gọi đúng tên và cơ chế: thread-starvation deadlock — task cha trên quoteExecutor join task con cũng gửi vào quoteExecutor; khi 16 task cha cùng chạy thì không còn thread chạy task con.',
    'Dẫn chứng: cả 16 quote-pool WAITING ở join tại QuoteService.java:74 (lambda quoteAsync dòng 52), active=16, queued tăng tới 50994, completed_total đứng yên 1208344, downstream nhận 0 request, CPU gần 0.',
    'Giải thích vì sao jstack không báo deadlock (không có vòng khoá; chờ CompletableFuture$Signaller riêng; unmanagedBlock không tạo thread bù) và vì sao chỉ xảy ra khi tải đột biến, không tự hồi phục.',
    'Đề xuất sửa: executor riêng hoặc thenCombine không chặn hoặc virtual thread; timeout cho join/get; hàng đợi có giới hạn + reject nhanh; metric/alert và test tái hiện với pool nhỏ.'
  ],
  tags: ['thread-starvation', 'completablefuture', 'executor', 'thread-pool', 'jstack']
},
{
  id: 'lab-thread-007',
  category: 'thread',
  title: 'SMS provider lỗi kéo sập luôn notify-service: 187 thread kẹt trong Logback AsyncAppender',
  level: 'mid',
  scenario: `**Bối cảnh:** **PayVN Notify** (Spring Boot 3.4, Java 21, Logback 1.5, Tomcat 200 thread) gửi OTP và thông báo giao dịch qua SMS/email. Log ghi qua {{AsyncAppender}} bọc một {{RollingFileAppender}} ghi vào {{/var/log/app}} — thư mục này mount từ **Amazon EFS (NFS)** để đội vận hành "khỏi phải vào pod lấy log".

**Triệu chứng:** Lúc **11:32 ngày 25/10/2026**, nhà cung cấp SMS bắt đầu trả HTTP 503. Code gửi SMS retry 3 lần và mỗi lần thất bại ghi {{log.warn(..., e)}} kèm **toàn bộ stack trace**; hết retry thì {{log.error}}. Từ 11:33, **cả service** (kể cả email và health check) chậm: p99 từ 80ms lên **28s**, ingress trả 504, readiness probe fail. CPU pod chỉ **9%**, heap bình thường, DB bình thường. Khi nhà cung cấp SMS hồi phục lúc 11:51, service tự khỏi sau ~1 phút.

**Dữ liệu thu thập:** {{jcmd 1 Thread.print}} lúc 11:41:20 (đã đếm sẵn), cấu hình {{logback-spring.xml}}, thông tin mount và số liệu log rate.`,
  artifacts: [
    {
      name: 'thread-print-notify-11-41.txt',
      lang: 'text',
      content: `1:
2026-10-25 11:41:20
Full thread dump OpenJDK 64-Bit Server VM (21.0.4+7-LTS-151 mixed mode, sharing):

"AsyncAppender-Worker-ASYNC_FILE" #31 [88] daemon prio=5 os_prio=0 cpu=912044.10ms elapsed=95112.66s tid=0x00007fb0a8b2c000 nid=88 runnable  [0x00007fb05c7fd000]
   java.lang.Thread.State: RUNNABLE
        at java.io.FileOutputStream.writeBytes(java.base@21.0.4/Native Method)
        at java.io.FileOutputStream.write(java.base@21.0.4/FileOutputStream.java:367)
        at ch.qos.logback.core.recovery.ResilientOutputStreamBase.write(ResilientOutputStreamBase.java:66)
        at ch.qos.logback.core.OutputStreamAppender.writeBytes(OutputStreamAppender.java:205)
        at ch.qos.logback.core.OutputStreamAppender.writeOut(OutputStreamAppender.java:192)
        at ch.qos.logback.core.FileAppender.writeOut(FileAppender.java:283)
        at ch.qos.logback.core.OutputStreamAppender.subAppend(OutputStreamAppender.java:242)
        at ch.qos.logback.core.rolling.RollingFileAppender.subAppend(RollingFileAppender.java:243)
        at ch.qos.logback.core.OutputStreamAppender.append(OutputStreamAppender.java:113)
        at ch.qos.logback.core.UnsynchronizedAppenderBase.doAppend(UnsynchronizedAppenderBase.java:84)
        at ch.qos.logback.core.spi.AppenderAttachableImpl.appendLoopOnAppenders(AppenderAttachableImpl.java:51)
        at ch.qos.logback.core.AsyncAppenderBase$Worker.run(AsyncAppenderBase.java:298)

"http-nio-8080-exec-41" #179 [5021] daemon prio=5 os_prio=0 cpu=2211.30ms elapsed=95101.92s tid=0x00007fb0a91e4000 nid=5021 waiting on condition  [0x00007fb03affd000]
   java.lang.Thread.State: WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x00000007c08a3b10> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
        at java.util.concurrent.locks.LockSupport.park(java.base@21.0.4/LockSupport.java:371)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionNode.block(java.base@21.0.4/AbstractQueuedSynchronizer.java:519)
        at java.util.concurrent.ForkJoinPool.unmanagedBlock(java.base@21.0.4/ForkJoinPool.java:3780)
        at java.util.concurrent.ForkJoinPool.managedBlock(java.base@21.0.4/ForkJoinPool.java:3725)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.await(java.base@21.0.4/AbstractQueuedSynchronizer.java:1712)
        at java.util.concurrent.ArrayBlockingQueue.put(java.base@21.0.4/ArrayBlockingQueue.java:370)
        at ch.qos.logback.core.AsyncAppenderBase.putUninterruptibly(AsyncAppenderBase.java:189)
        at ch.qos.logback.core.AsyncAppenderBase.put(AsyncAppenderBase.java:180)
        at ch.qos.logback.core.AsyncAppenderBase.append(AsyncAppenderBase.java:162)
        at ch.qos.logback.core.UnsynchronizedAppenderBase.doAppend(UnsynchronizedAppenderBase.java:84)
        at ch.qos.logback.core.spi.AppenderAttachableImpl.appendLoopOnAppenders(AppenderAttachableImpl.java:51)
        at ch.qos.logback.classic.Logger.appendLoopOnAppenders(Logger.java:272)
        at ch.qos.logback.classic.Logger.callAppenders(Logger.java:259)
        at ch.qos.logback.classic.Logger.buildLoggingEventAndAppend(Logger.java:426)
        at ch.qos.logback.classic.Logger.filterAndLog_1(Logger.java:400)
        at ch.qos.logback.classic.Logger.warn(Logger.java:688)
        at vn.pay.notify.sms.SmsSender.send(SmsSender.java:77)
        at vn.pay.notify.NotifyController.otp(NotifyController.java:52)

"http-nio-8080-exec-97" #235 [5133] daemon prio=5 os_prio=0 cpu=1987.04ms elapsed=95101.80s tid=0x00007fb0a9372000 nid=5133 waiting on condition  [0x00007fb0372fc000]
   java.lang.Thread.State: WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x00000007c08a3b10> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
        at java.util.concurrent.locks.LockSupport.park(java.base@21.0.4/LockSupport.java:371)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionNode.block(java.base@21.0.4/AbstractQueuedSynchronizer.java:519)
        at java.util.concurrent.ForkJoinPool.unmanagedBlock(java.base@21.0.4/ForkJoinPool.java:3780)
        at java.util.concurrent.ForkJoinPool.managedBlock(java.base@21.0.4/ForkJoinPool.java:3725)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.await(java.base@21.0.4/AbstractQueuedSynchronizer.java:1712)
        at java.util.concurrent.ArrayBlockingQueue.put(java.base@21.0.4/ArrayBlockingQueue.java:370)
        at ch.qos.logback.core.AsyncAppenderBase.putUninterruptibly(AsyncAppenderBase.java:189)
        at ch.qos.logback.core.AsyncAppenderBase.put(AsyncAppenderBase.java:180)
        at ch.qos.logback.core.AsyncAppenderBase.append(AsyncAppenderBase.java:162)
        at ch.qos.logback.core.UnsynchronizedAppenderBase.doAppend(UnsynchronizedAppenderBase.java:84)
        at ch.qos.logback.core.spi.AppenderAttachableImpl.appendLoopOnAppenders(AppenderAttachableImpl.java:51)
        at ch.qos.logback.classic.Logger.appendLoopOnAppenders(Logger.java:272)
        at ch.qos.logback.classic.Logger.callAppenders(Logger.java:259)
        at ch.qos.logback.classic.Logger.buildLoggingEventAndAppend(Logger.java:426)
        at ch.qos.logback.classic.Logger.filterAndLog_2(Logger.java:414)
        at ch.qos.logback.classic.Logger.error(Logger.java:540)
        at vn.pay.notify.email.EmailSender.send(EmailSender.java:61)
        at vn.pay.notify.NotifyController.txnMail(NotifyController.java:71)

# Ghi chú on-call (đếm trên toàn bộ dump):
#   grep -c '"http-nio-8080-exec-' td.txt                          -> 200
#   grep -c 'AsyncAppenderBase.put(' td.txt                         -> 187
#   grep -c 'parking to wait for  <0x00000007c08a3b10>' td.txt       -> 187
#   13 thread exec còn lại: idle trong TaskQueue.take (chờ request mới)
#   Lấy thêm 2 dump lúc 11:41:30 và 11:41:40: worker luôn ở FileOutputStream.writeBytes`
    },
    {
      name: 'logback-mount-rates.txt',
      lang: 'text',
      content: `<!-- logback-spring.xml (trích) -->
<appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
  <file>/var/log/app/notify.log</file>
  <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
    <fileNamePattern>/var/log/app/notify.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
    <maxFileSize>200MB</maxFileSize>
  </rollingPolicy>
  <encoder><pattern>%d %-5level [%thread] %logger{36} : %msg%n</pattern></encoder>
  <!-- immediateFlush không khai báo => mặc định true -->
</appender>
<appender name="ASYNC_FILE" class="ch.qos.logback.classic.AsyncAppender">
  <queueSize>256</queueSize>
  <!-- discardingThreshold không khai báo => mặc định queueSize/5 = 51 -->
  <!-- neverBlock không khai báo => mặc định false -->
  <appender-ref ref="FILE"/>
</appender>
<root level="INFO"><appender-ref ref="ASYNC_FILE"/></root>

$ mount | grep /var/log/app
fs-0a1b2c3d.efs.ap-southeast-1.amazonaws.com:/ on /var/log/app type nfs4 (rw,relatime,vers=4.1,rsize=1048576,wsize=1048576,hard,proto=tcp,timeo=600,retrans=2)

# Số liệu log (Prometheus logback_events_total, đếm lúc gọi logger, trước khi vào appender)
# khung giờ        info/s   warn/s   error/s   bytes ghi file/s
11:20-11:30          310        2        0       ~0.2 MB/s
11:33-11:50          290     3 900    1 300      ~1.1 MB/s (giới hạn bởi worker)
# Kích thước trung bình 1 event WARN/ERROR có stack trace: ~9 KB (62 dòng)
# Đo thời gian ghi của worker (async-profiler wall, 30s): trung bình 2.9 ms / event, ~340 event/s

# p99 theo endpoint 11:40
/notify/otp      28.1 s     /notify/txn-mail   27.4 s     /actuator/health/readiness   timeout (1s)`
    }
  ],
  questions: [
    'Vì sao lỗi của nhà cung cấp SMS làm chậm cả endpoint email và health check? Chỉ ra điểm nghẽn trong dump.',
    'Giải thích cơ chế AsyncAppender với cấu hình mặc định: khi nào event bị bỏ, khi nào thread gọi log bị chặn? Vì sao INFO vẫn trôi mà WARN/ERROR lại chặn?',
    'Đề xuất cách sửa ngắn hạn và dài hạn, kèm đánh đổi (mất log vs chặn request).'
  ],
  hints: [
    '187 thread HTTP cùng park trên một ConditionObject {{<0x00000007c08a3b10>}} ở {{ArrayBlockingQueue.put}} gọi từ {{AsyncAppenderBase.put}}: chúng đang chờ hàng đợi log có chỗ trống.',
    'Chỉ có 1 thread {{AsyncAppender-Worker-ASYNC_FILE}} lấy event ra và ghi xuống file trên NFS. So sánh tốc độ ghi (~340 event/s) với tốc độ sinh WARN+ERROR (~5 200 event/s).',
    'Logback: khi chỗ trống còn dưới {{discardingThreshold}} (mặc định 20% hàng đợi) thì event TRACE/DEBUG/INFO bị bỏ, còn WARN/ERROR luôn được giữ; nếu {{neverBlock=false}} thì {{put}} chặn khi đầy.'
  ],
  answer: `**Tóm tắt:** "Async" logging vẫn **chặn** được thread nghiệp vụ. Khi SMS provider lỗi, mỗi giây sinh ~5 200 event WARN/ERROR có stack trace, nhưng **một** worker của {{AsyncAppender}} chỉ ghi được ~340 event/s xuống EFS (NFS, flush mỗi event). Hàng đợi 256 phần tử đầy trong chưa tới 0,1 giây; với cấu hình mặc định ({{neverBlock=false}}), mọi thread gọi {{log.warn/error}} bị park trong {{ArrayBlockingQueue.put}} — 187/200 thread Tomcat kẹt, nên cả email và health check cũng chết theo. Sửa: {{neverBlock=true}}, ghi log ra stdout/đĩa local, giảm lượng log lỗi (không in stack trace mỗi lần retry, circuit breaker).

### Hiểu từ gốc: AsyncAppender hoạt động thế nào

Ghi file là IO chậm (vài ms, NFS còn chậm hơn), nên Logback cho phép bọc appender thật bằng {{AsyncAppender}}: thread nghiệp vụ chỉ **bỏ event vào một hàng đợi** ({{ArrayBlockingQueue}}, mặc định 256 chỗ) rồi đi tiếp; một **thread worker duy nhất** lấy event ra và ghi file. Giống quầy nhận thư: khách bỏ thư vào hộp rồi về, một nhân viên mang thư đi gửi.

Câu hỏi quan trọng: **hộp thư đầy thì sao?** Logback có 2 núm:

| Thuộc tính | Mặc định | Ý nghĩa |
|---|---|---|
| {{queueSize}} | 256 | Sức chứa hàng đợi |
| {{discardingThreshold}} | queueSize/5 (= 51) | Khi chỗ trống còn **ít hơn** ngưỡng này, event mức TRACE/DEBUG/INFO bị **bỏ**; WARN/ERROR **không bao giờ** bị bỏ |
| {{neverBlock}} | false | false: {{put()}} chờ tới khi có chỗ (chặn thread gọi log). true: dùng {{offer()}}, đầy thì bỏ event |

Vậy với cấu hình mặc định, khi hàng đợi gần đầy: INFO bị lặng lẽ bỏ (thread không bị chặn), còn **WARN/ERROR phải chờ chỗ trống**. Đó là lý do trong dump cả 187 thread đều đang ở {{Logger.warn}} hoặc {{Logger.error}} — đúng loại event không được phép bỏ.

### Vì sao worker quá chậm

~~~text
Sinh event:  WARN 3 900/s + ERROR 1 300/s = 5 200 event/s (mỗi event ~9 KB stack trace)
Tiêu thụ:    1 worker × (1 / 2.9 ms) ≈ 340 event/s
Chênh lệch:  ~4 860 event/s dư thừa -> hàng đợi 256 đầy trong ~0,05 s
Sau đó:      tốc độ log của CẢ JVM = tốc độ worker = 340 event/s
             -> mỗi thread phải đợi tới lượt mới được log rồi mới trả response
~~~

Worker chậm vì 2 lý do chồng nhau: {{immediateFlush=true}} (mặc định) nên mỗi event là một lần {{write()}} xuống file; và file nằm trên **NFS qua mạng** (EFS), mỗi write phải đi round-trip tới server lưu trữ. Ổ đĩa local hoặc stdout nhanh hơn nhiều bậc.

Vì sao **email và health check** cũng chết? Vì chúng dùng chung 200 thread Tomcat. Khi 187 thread kẹt ở log, chỉ còn 13 thread cho mọi request; email cũng log ERROR (ví dụ {{EmailSender.send}} dòng 61 log lỗi template) nên cũng bị kẹt. Readiness probe timeout → Kubernetes rút pod khỏi Service → tải dồn sang pod khác → các pod khác cũng kẹt theo. Một sự cố của **đối tác bên ngoài** đã lan thành sự cố toàn service qua **tài nguyên dùng chung là hàng đợi log**.

### Dẫn chứng từ artifact

- 187 thread exec park trên **cùng** {{<0x00000007c08a3b10>}} ({{ConditionObject}} "notFull" của hàng đợi) tại {{ArrayBlockingQueue.put}} ← {{AsyncAppenderBase.putUninterruptibly}} ← {{Logger.warn}}/{{Logger.error}}.
- Duy nhất thread {{AsyncAppender-Worker-ASYNC_FILE}} RUNNABLE ở {{FileOutputStream.writeBytes}} (native), cả 3 dump liên tiếp đều ở đó; cpu tích luỹ rất lớn (912s) vì nó làm việc liên tục.
- Cấu hình: {{queueSize=256}}, không khai báo {{neverBlock}} → false, không khai báo {{immediateFlush}} → true; mount {{nfs4}} từ EFS.
- Số liệu: warn+error tăng từ 2/s lên 5 200/s đúng lúc SMS lỗi, trong khi worker chỉ ~340 event/s. INFO giảm nhẹ (310 → 290/s) chỉ vì request ít đi; nhiều INFO thực tế đã bị bỏ trong appender mà không ai biết.
- CPU 9%: thread đang park, không phải đang tính toán.

### Cách sửa

**Ngắn hạn:**
- Bật {{<neverBlock>true</neverBlock>}}: khi đầy thì bỏ event thay vì chặn — chấp nhận mất log còn hơn mất service.
- Giảm log: retry thất bại chỉ log {{warn}} một dòng (không kèm stack trace), log stack trace một lần khi hết retry; thêm **circuit breaker** (Resilience4j) cho SMS provider để ngừng gọi và ngừng log khi đối tác đang chết.

~~~java
// Trước: 3 lần retry x stack trace 62 dòng
log.warn("SMS send failed attempt={} to={}", attempt, maskedPhone, e);
// Sau: một dòng gọn, stack trace chỉ log ở DEBUG
log.warn("SMS send failed attempt={} status={} msg={}", attempt, status, e.getMessage());
~~~

**Dài hạn:**
- Ghi log ra **stdout** (hoặc đĩa local của node) và để agent (Fluent Bit, CloudWatch agent) gửi đi; không ghi log trực tiếp lên NFS.
- {{immediateFlush=false}} cho appender file nếu chấp nhận mất vài event cuối khi JVM crash.
- Cân nhắc appender không chặn hẳn (ví dụ Log4j2 async logger với chính sách discard) và **metric số event bị bỏ** để biết khi nào mất log.
- Đưa "hàng đợi log" vào danh sách tài nguyên dùng chung cần bulkhead, giống connection pool.

| Lựa chọn | Thread nghiệp vụ bị chặn? | Mất log? |
|---|---|---|
| Mặc định (neverBlock=false) | Có, khi đầy | INFO mất khi gần đầy |
| neverBlock=true | Không | Mất cả WARN/ERROR khi đầy |
| queueSize lớn (ví dụ 8192) | Chỉ trì hoãn | Ít hơn, nhưng tốn RAM, burst dài vẫn đầy |
| Giảm lượng log + circuit breaker | Hiếm | Ít nhất — sửa tận gốc |

### Lỗi hay gặp

- Tin rằng "AsyncAppender = không bao giờ chặn". Mặc định của Logback là **chặn** cho WARN/ERROR.
- Chỉ tăng {{queueSize}}: burst kéo dài vài phút thì hàng đợi lớn mấy cũng đầy, chỉ làm chậm thời điểm sự cố và tăng RAM.
- Log stack trace ở mỗi lần retry hoặc trong vòng lặp; một lỗi đối tác tạo ra hàng chục MB log/giây.
- Đọc dump thấy WAITING rồi nghĩ "thread rảnh"; phải xem chúng chờ **cái gì** (cùng một ConditionObject = cùng một hàng đợi).

### Trả lời miệng 1 phút

"Dump cho thấy 187 trên 200 thread Tomcat park ở ArrayBlockingQueue.put trong AsyncAppender của Logback, cùng một condition, tất cả đang gọi log.warn hoặc log.error. Chỉ có một worker ghi log xuống EFS với khoảng 340 event mỗi giây, trong khi SMS lỗi sinh 5 nghìn event WARN/ERROR có stack trace mỗi giây. Mặc định Logback bỏ INFO khi hàng đợi gần đầy nhưng không bao giờ bỏ WARN/ERROR, và neverBlock là false nên thread bị chặn. Vì dùng chung thread pool, email và health check cũng chết. Tôi bật neverBlock, giảm log stack trace, thêm circuit breaker cho SMS và chuyển log sang stdout thay vì NFS."

> Senior tip: Trong postmortem, tôi luôn hỏi "đường log có phải là một dependency đồng bộ không?". Log, metric, tracing exporter đều là IO; nếu chúng có thể chặn thread nghiệp vụ thì chúng là điểm lỗi chung. Một con số đáng nhớ: một stack trace Spring điển hình 60–100 dòng, ~8–10 KB; 1 000 lỗi/s là ~10 MB/s chỉ riêng log — đủ làm nghẽn nhiều hệ thống log. Hãy rate-limit log lỗi lặp lại và đo cả "log events dropped".`,
  rubric: [
    'Xác định đúng điểm nghẽn: 187 thread HTTP park ở ArrayBlockingQueue.put trong AsyncAppenderBase (cùng ConditionObject 0x00000007c08a3b10), một worker duy nhất đang ghi file NFS.',
    'Giải thích đúng cơ chế mặc định của Logback AsyncAppender: queueSize 256, discardingThreshold 20% chỉ bỏ TRACE/DEBUG/INFO, WARN/ERROR không bị bỏ, neverBlock=false nên put chặn khi đầy.',
    'Định lượng: sinh ~5200 event WARN/ERROR/s vs worker ~340 event/s (immediateFlush + NFS), giải thích vì sao email và health check cùng chết (dùng chung 200 thread Tomcat).',
    'Đề xuất sửa có đánh đổi: neverBlock=true (chấp nhận mất log), giảm log stack trace/rate-limit, circuit breaker cho SMS, log ra stdout/đĩa local thay vì NFS, metric event bị bỏ.'
  ],
  tags: ['logback', 'async-appender', 'logging', 'blocking-queue', 'jstack', 'nfs']
},
{
  id: 'lab-thread-008',
  category: 'thread',
  title: 'Tỷ giá đứng hình 12 giây mỗi giờ: ReadWriteLock và một writer đứng chờ',
  level: 'lead',
  scenario: `**Bối cảnh:** **PayVN FX** (Spring Boot 3.4, Java 21) cung cấp tỷ giá cho mọi giao dịch ngoại tệ, ~2 500 req/s qua {{GET /fx/rate}}. Bảng tỷ giá 180 cặp tiền nằm trong {{RateTable}}, bảo vệ bằng {{ReentrantReadWriteLock}} (mặc định non-fair) với lý do "đọc nhiều ghi ít, read lock cho đọc song song". Job {{fx-refresh}} cập nhật bảng mỗi 30 giây. Tháng này đội BI thêm endpoint {{GET /fx/export}} xuất snapshot CSV kèm lịch sử, công cụ BI gọi vào **phút 15 mỗi giờ**.

**Triệu chứng:** Từ ngày 25/10/2026, đúng khoảng **hh:15:30 → hh:15:42** mỗi giờ, p99 của {{/fx/rate}} vọt từ 4ms lên **11,8 giây**, thanh toán ngoại tệ timeout hàng loạt. CPU thấp, không GC dài, không lỗi DB. Team tranh cãi: "read lock là chia sẻ, export chỉ đọc thì sao chặn được ai?"

**Dữ liệu thu thập:** Log ứng dụng quanh 10:15, {{jcmd 1 Thread.print -l}} lúc 10:15:36 và code {{RateTable}}.`,
  artifacts: [
    {
      name: 'app-log-10-15.txt',
      lang: 'text',
      content: `2026-10-25T10:14:30.002+07:00  INFO 1 --- [   fx-refresh-1] vn.pay.fx.RateRefresher     : refresh start source=reuters
2026-10-25T10:14:30.041+07:00  INFO 1 --- [   fx-refresh-1] vn.pay.fx.RateRefresher     : refresh applied pairs=180 waitedForLock=0ms
2026-10-25T10:15:00.003+07:00  INFO 1 --- [   fx-refresh-1] vn.pay.fx.RateRefresher     : refresh start source=reuters
2026-10-25T10:15:00.044+07:00  INFO 1 --- [   fx-refresh-1] vn.pay.fx.RateRefresher     : refresh applied pairs=180 waitedForLock=0ms
2026-10-25T10:15:02.118+07:00  INFO 1 --- [nio-8080-exec-3] vn.pay.fx.ExportController  : export snapshot start pairs=180 client=bi-reporter
2026-10-25T10:15:30.001+07:00  INFO 1 --- [   fx-refresh-1] vn.pay.fx.RateRefresher     : refresh start source=reuters
2026-10-25T10:15:30.044+07:00  INFO 1 --- [   fx-refresh-1] vn.pay.fx.RateRefresher     : fetched 180 rates in 43ms, acquiring write lock
2026-10-25T10:15:33.051+07:00  WARN 1 --- [io-8080-exec-212] vn.pay.fx.RateController    : slow rate lookup pair=USD/VND elapsed=3007ms
2026-10-25T10:15:38.660+07:00  WARN 1 --- [io-8080-exec-187] vn.pay.fx.RateController    : slow rate lookup pair=EUR/VND elapsed=8612ms
2026-10-25T10:15:41.733+07:00  INFO 1 --- [nio-8080-exec-3] vn.pay.fx.ExportController  : export snapshot done pairs=180 elapsed=39615ms
2026-10-25T10:15:41.734+07:00  INFO 1 --- [   fx-refresh-1] vn.pay.fx.RateRefresher     : refresh applied pairs=180 waitedForLock=11690ms
2026-10-25T10:15:41.736+07:00  WARN 1 --- [io-8080-exec-150] vn.pay.fx.RateController    : slow rate lookup pair=JPY/VND elapsed=11688ms
2026-10-25T10:16:00.002+07:00  INFO 1 --- [   fx-refresh-1] vn.pay.fx.RateRefresher     : refresh start source=reuters
2026-10-25T10:16:00.040+07:00  INFO 1 --- [   fx-refresh-1] vn.pay.fx.RateRefresher     : refresh applied pairs=180 waitedForLock=0ms
# p99 /fx/rate theo phút: 10:14 = 4 ms, 10:15 = 11 812 ms, 10:16 = 5 ms
# Export 10:15:02 -> 10:15:41 KHÔNG làm chậm /fx/rate trong 28 giây đầu (10:15:02 -> 10:15:30).`
    },
    {
      name: 'thread-print-fx-10-15-36.txt',
      lang: 'text',
      content: `1:
2026-10-25 10:15:36
Full thread dump OpenJDK 64-Bit Server VM (21.0.4+7-LTS-151 mixed mode, sharing):

"http-nio-8080-exec-3" #64 [2210] daemon prio=5 os_prio=0 cpu=6120.88ms elapsed=87012.45s tid=0x00007f80b42c1000 nid=2210 runnable  [0x00007f8071ffc000]
   java.lang.Thread.State: RUNNABLE
        at sun.nio.ch.Net.poll(java.base@21.0.4/Native Method)
        at sun.nio.ch.NioSocketImpl.park(java.base@21.0.4/NioSocketImpl.java:191)
        at sun.nio.ch.NioSocketImpl.timedRead(java.base@21.0.4/NioSocketImpl.java:280)
        at sun.nio.ch.NioSocketImpl.implRead(java.base@21.0.4/NioSocketImpl.java:304)
        at sun.nio.ch.NioSocketImpl.read(java.base@21.0.4/NioSocketImpl.java:346)
        at sun.nio.ch.NioSocketImpl$1.read(java.base@21.0.4/NioSocketImpl.java:796)
        at java.net.Socket$SocketInputStream.read(java.base@21.0.4/Socket.java:1099)
        at java.io.BufferedInputStream.fill(java.base@21.0.4/BufferedInputStream.java:291)
        at java.io.BufferedInputStream.read1(java.base@21.0.4/BufferedInputStream.java:347)
        at java.io.BufferedInputStream.implRead(java.base@21.0.4/BufferedInputStream.java:420)
        at java.io.BufferedInputStream.read(java.base@21.0.4/BufferedInputStream.java:399)
        at sun.net.www.http.HttpClient.parseHTTPHeader(java.base@21.0.4/HttpClient.java:827)
        at sun.net.www.http.HttpClient.parseHTTP(java.base@21.0.4/HttpClient.java:759)
        at sun.net.www.protocol.http.HttpURLConnection.getInputStream0(java.base@21.0.4/HttpURLConnection.java:1690)
        at sun.net.www.protocol.http.HttpURLConnection.getInputStream(java.base@21.0.4/HttpURLConnection.java:1599)
        at java.net.HttpURLConnection.getResponseCode(java.base@21.0.4/HttpURLConnection.java:531)
        at org.springframework.http.client.SimpleClientHttpResponse.getStatusCode(SimpleClientHttpResponse.java:58)
        at org.springframework.web.client.DefaultRestClient$DefaultResponseSpec.body(DefaultRestClient.java:731)
        at vn.pay.fx.history.HistoryClient.fetch(HistoryClient.java:52)
        at vn.pay.fx.RateTable.exportSnapshot(RateTable.java:64)
        at vn.pay.fx.ExportController.export(ExportController.java:29)

   Locked ownable synchronizers:
        - <0x00000007a91f0d40> (a org.apache.tomcat.util.threads.ThreadPoolExecutor$Worker)

"fx-refresh-1" #41 [2187] prio=5 os_prio=0 cpu=1840.31ms elapsed=87015.02s tid=0x00007f80b4211000 nid=2187 waiting on condition  [0x00007f80740fe000]
   java.lang.Thread.State: WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x00000007b3a01c88> (a java.util.concurrent.locks.ReentrantReadWriteLock$NonfairSync)
        at java.util.concurrent.locks.LockSupport.park(java.base@21.0.4/LockSupport.java:221)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer.acquire(java.base@21.0.4/AbstractQueuedSynchronizer.java:754)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer.acquire(java.base@21.0.4/AbstractQueuedSynchronizer.java:990)
        at java.util.concurrent.locks.ReentrantReadWriteLock$WriteLock.lock(java.base@21.0.4/ReentrantReadWriteLock.java:959)
        at vn.pay.fx.RateTable.refresh(RateTable.java:51)
        at vn.pay.fx.RateRefresher.run(RateRefresher.java:38)
        at java.util.concurrent.Executors$RunnableAdapter.call(java.base@21.0.4/Executors.java:572)
        at java.util.concurrent.FutureTask.runAndReset(java.base@21.0.4/FutureTask.java:358)
        at java.util.concurrent.ScheduledThreadPoolExecutor$ScheduledFutureTask.run(java.base@21.0.4/ScheduledThreadPoolExecutor.java:305)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1144)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@21.0.4/ThreadPoolExecutor.java:642)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

   Locked ownable synchronizers:
        - <0x00000007a90b2e18> (a java.util.concurrent.ThreadPoolExecutor$Worker)

"http-nio-8080-exec-187" #248 [2394] daemon prio=5 os_prio=0 cpu=4410.07ms elapsed=87001.10s tid=0x00007f80b4c02000 nid=2394 waiting on condition  [0x00007f8052efd000]
   java.lang.Thread.State: WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x00000007b3a01c88> (a java.util.concurrent.locks.ReentrantReadWriteLock$NonfairSync)
        at java.util.concurrent.locks.LockSupport.park(java.base@21.0.4/LockSupport.java:221)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer.acquire(java.base@21.0.4/AbstractQueuedSynchronizer.java:754)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer.acquireShared(java.base@21.0.4/AbstractQueuedSynchronizer.java:1086)
        at java.util.concurrent.locks.ReentrantReadWriteLock$ReadLock.lock(java.base@21.0.4/ReentrantReadWriteLock.java:739)
        at vn.pay.fx.RateTable.get(RateTable.java:41)
        at vn.pay.fx.RateController.rate(RateController.java:27)

   Locked ownable synchronizers:
        - <0x00000007a9a3c650> (a org.apache.tomcat.util.threads.ThreadPoolExecutor$Worker)

"http-nio-8080-exec-212" #273 [2419] daemon prio=5 os_prio=0 cpu=4388.52ms elapsed=87000.96s tid=0x00007f80b4c4a000 nid=2419 waiting on condition  [0x00007f8051af8000]
   java.lang.Thread.State: WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x00000007b3a01c88> (a java.util.concurrent.locks.ReentrantReadWriteLock$NonfairSync)
        at java.util.concurrent.locks.LockSupport.park(java.base@21.0.4/LockSupport.java:221)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer.acquire(java.base@21.0.4/AbstractQueuedSynchronizer.java:754)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer.acquireShared(java.base@21.0.4/AbstractQueuedSynchronizer.java:1086)
        at java.util.concurrent.locks.ReentrantReadWriteLock$ReadLock.lock(java.base@21.0.4/ReentrantReadWriteLock.java:739)
        at vn.pay.fx.RateTable.get(RateTable.java:41)
        at vn.pay.fx.RateController.rate(RateController.java:27)

   Locked ownable synchronizers:
        - <0x00000007a9a51288> (a org.apache.tomcat.util.threads.ThreadPoolExecutor$Worker)

# Ghi chú on-call:
#   grep -c 'parking to wait for  <0x00000007b3a01c88>' td.txt                 -> 172
#   trong đó WriteLock.lock: 1 (fx-refresh-1), ReadLock.lock: 171 (http-nio-8080-exec-*)
#   KHÔNG thread nào liệt kê <0x00000007b3a01c88> trong "Locked ownable synchronizers".
#   Thread duy nhất đang chạy trong RateTable: http-nio-8080-exec-3 (exportSnapshot dòng 64).`
    },
    {
      name: 'RateTable.java',
      lang: 'java',
      content: `public class RateTable {                                              // dòng 30
    private final ReentrantReadWriteLock rw = new ReentrantReadWriteLock(); // non-fair
    private final Map<String, Rate> rates = new HashMap<>();
    private final HistoryClient historyClient;

    public Rate get(String pair) {                                        // dòng 38, ~2500 lần/s
        // ...
        rw.readLock().lock();                                             // dòng 41
        try { return rates.get(pair); }
        finally { rw.readLock().unlock(); }
    }

    public void refresh(Map<String, Rate> fresh) {                        // mỗi 30 giây
        rw.writeLock().lock();                                            // dòng 51
        try { rates.clear(); rates.putAll(fresh); }
        finally { rw.writeLock().unlock(); }
    }

    public void exportSnapshot(Writer out) throws IOException {           // BI gọi phút 15 mỗi giờ
        rw.readLock().lock();                         // "chỉ đọc thôi, read lock là chia sẻ"
        try {
            for (Map.Entry<String, Rate> e : rates.entrySet()) {
                History h = historyClient.fetch(e.getKey());              // dòng 64: HTTP ~220 ms/cặp
                out.write(csvLine(e.getKey(), e.getValue(), h));
            }
        } finally { rw.readLock().unlock(); }
    }
}`
    }
  ],
  questions: [
    'Export chỉ cầm read lock, vậy vì sao các request đọc tỷ giá (cũng chỉ cần read lock) lại bị chặn? Giải thích cơ chế của ReentrantReadWriteLock non-fair và dựng lại timeline từ log.',
    'Vì sao trong dump không thread nào "giữ" lock 0x00000007b3a01c88? Làm sao bạn suy ra ai đang giữ nó?',
    'Đề xuất thiết kế lại RateTable (ít nhất 2 phương án) và so sánh trade-off. Với vai trò lead, bạn sẽ đặt quy tắc gì cho team?'
  ],
  hints: [
    'Chú ý thời điểm: export bắt đầu 10:15:02 nhưng /fx/rate chỉ chậm từ 10:15:30 — đúng lúc fx-refresh-1 xin write lock. Chuyện gì thay đổi khi có một writer đứng chờ?',
    'Trong ReentrantReadWriteLock non-fair, reader mới sẽ tự chặn nếu thread đứng đầu hàng chờ là một writer (cơ chế chống writer bị đói). Writer lại đang chờ reader cũ — export — nhả lock.',
    'jstack chỉ liệt kê ownable synchronizer được giữ ở chế độ độc quyền (exclusive owner). Read lock là chia sẻ nên không hiện; phải suy ra từ stack: thread nào đang ở bên trong exportSnapshot sau lệnh readLock().lock()?'
  ],
  answer: `**Tóm tắt:** Export giữ **read lock suốt ~40 giây** vì gọi HTTP lấy lịch sử cho 180 cặp tiền **bên trong** vùng khoá. Lúc 10:15:30, {{fx-refresh-1}} xin **write lock** và phải đứng chờ export. Trong {{ReentrantReadWriteLock}}, khi đầu hàng chờ là một writer, **reader mới cũng phải xếp hàng sau writer** (để writer không bị đói). Kết quả: 171 request đọc tỷ giá bị chặn ~11,7 giây cho tới khi export xong. Sửa: không bao giờ làm IO trong vùng khoá; tốt hơn nữa là bỏ khoá cho reader bằng **immutable snapshot + volatile** (copy-on-write).

### Hiểu từ gốc: ReadWriteLock và luật "không cho writer bị đói"

Read-write lock có 2 loại vé: **vé đọc** (nhiều người cầm cùng lúc được) và **vé ghi** (chỉ một người, và lúc đó không ai được đọc). Nghe thì "đọc không bao giờ chặn đọc". Nhưng hãy tưởng tượng một phòng họp: người đọc ra vào liên tục, 2 500 lượt/giây. Nếu reader mới luôn được vào miễn là đang có reader khác bên trong, phòng **không bao giờ trống**, writer chờ mãi — gọi là **writer starvation**.

Để tránh vậy, {{ReentrantReadWriteLock}} (cả chế độ non-fair mặc định) có luật: reader mới gọi {{readLock().lock()}} sẽ **tự chặn nếu người đứng đầu hàng chờ là writer** (trong mã nguồn JDK: {{readerShouldBlock()}} → {{apparentlyFirstQueuedIsExclusive()}}). Nghĩa là một writer **đang chờ** sẽ "đóng cửa" với mọi reader mới, cho tới khi writer vào và ra xong. Writer thì lại chờ **tất cả reader cũ** nhả vé đọc.

~~~text
10:15:02  exec-3 (export) lấy READ lock ------------------------------+ giữ ~39,6 s
                                                                     |
10:15:02..10:15:30  reader /fx/rate vào/ra bình thường (đọc // đọc)  |  p99 4 ms
                                                                     |
10:15:30.044  fx-refresh-1 xin WRITE lock -> phải chờ export         |
              hàng chờ AQS: [WRITER fx-refresh-1]                    |
10:15:30+     reader mới thấy đầu hàng là WRITER -> tự xếp hàng sau  |
              hàng chờ: [WRITER][R exec-212][R exec-187]... 171 R    |
10:15:41.733  export nhả READ lock  <--------------------------------+
10:15:41.734  WRITER vào, cập nhật 180 cặp (vài µs), nhả
10:15:41.736  171 reader được đánh thức, trả kết quả (elapsed tới 11 688 ms)
~~~

Vậy **export một mình không chặn ai**; **writer đứng chờ** mới là "cửa chặn". Ghép 2 thứ lại: một reader chậm + một writer bình thường = mọi reader đều chậm. Vì export kéo dài 40 giây > chu kỳ refresh 30 giây, **mỗi lần export chắc chắn trùng một lần refresh**, nên sự cố lặp lại đúng hh:15:30 mỗi giờ.

### Vì sao dump không cho thấy ai giữ lock

Mục "Locked ownable synchronizers" của {{jstack -l}} / {{Thread.print -l}} chỉ liệt kê các {{AbstractOwnableSynchronizer}} mà thread là **chủ sở hữu độc quyền** ({{exclusiveOwnerThread}}) — ví dụ {{ReentrantLock}} hoặc write lock. **Read lock là chia sẻ**, AQS chỉ đếm số lượt đọc chứ không ghi tên từng người, nên **không bao giờ xuất hiện** ở đó. Đây là bẫy rất phổ biến: thấy 172 thread chờ một lock mà "không ai giữ".

Cách suy luận: tìm thread nào đang chạy **bên trong** đoạn code đã lấy read lock. Chỉ có {{http-nio-8080-exec-3}} đang ở {{RateTable.exportSnapshot(RateTable.java:64)}} — dòng 64 nằm sau {{rw.readLock().lock()}} và trước {{unlock()}}, tức nó đang giữ read lock trong lúc chờ socket ({{HttpURLConnection.getInputStream}} → {{NioSocketImpl.timedRead}}). Thread này RUNNABLE nhưng thực chất đang chờ mạng (native poll).

### Dẫn chứng từ artifact

- Log: export start 10:15:02.118, done 10:15:41.733 (39 615 ms ≈ 180 × 220 ms). Refresh 10:15:30.044 "acquiring write lock", applied 10:15:41.734 với {{waitedForLock=11690ms}}. Request chậm nhất 11 688 ms kết thúc 10:15:41.736 — 2 ms sau writer.
- 28 giây đầu của export (10:15:02 → 10:15:30) p99 bình thường: chứng minh read lock của export **không** chặn reader khi chưa có writer.
- Dump: 172 thread park trên cùng {{<0x00000007b3a01c88>}} ({{ReentrantReadWriteLock$NonfairSync}}): 1 ở {{WriteLock.lock}} ({{RateTable.refresh}} dòng 51), 171 ở {{ReadLock.lock}} ({{RateTable.get}} dòng 41).
- Không thread nào liệt kê {{0x00000007b3a01c88}} trong ownable synchronizers → chủ đang giữ là reader (chia sẻ), khớp với exec-3 ở exportSnapshot dòng 64.

### Cách sửa

**Ngắn hạn:** đưa IO ra khỏi vùng khoá — copy bảng dưới read lock (180 phần tử, vài µs), nhả lock, rồi mới gọi HTTP:

~~~java
public void exportSnapshot(Writer out) throws IOException {
    Map<String, Rate> copy;
    rw.readLock().lock();
    try { copy = Map.copyOf(rates); }          // giữ lock vài micro giây
    finally { rw.readLock().unlock(); }
    for (var e : copy.entrySet()) {            // IO chậm nằm NGOÀI khoá
        out.write(csvLine(e.getKey(), e.getValue(), historyClient.fetch(e.getKey())));
    }
}
~~~

**Sửa gốc — reader không cần khoá (immutable snapshot):** dữ liệu ghi 30 giây/lần, đọc 2 500 lần/giây → mô hình copy-on-write là tự nhiên nhất:

~~~java
public class RateTable {
    private volatile Map<String, Rate> rates = Map.of();  // bảng bất biến
    public Rate get(String pair) { return rates.get(pair); } // không khoá, không chờ
    public void refresh(Map<String, Rate> fresh) {
        rates = Map.copyOf(fresh);   // tạo bảng mới, đổi tham chiếu trong 1 bước
    }                                // volatile đảm bảo reader thấy bảng hoàn chỉnh
    public Map<String, Rate> snapshot() { return rates; }   // export dùng snapshot
}
~~~

Reader đọc tham chiếu {{volatile}} rồi tra map bất biến: không có hàng chờ, không có writer starvation, không có reader starvation. Export lấy {{snapshot()}} và chậm bao lâu cũng không ảnh hưởng ai. Chú ý code cũ {{rates.clear(); rates.putAll(...)}} còn có rủi ro khác: nếu sau này ai đó bỏ khoá, reader có thể thấy bảng **rỗng** giữa clear và putAll.

### So sánh phương án

| Phương án | Reader chờ? | Phức tạp | Khi nào dùng |
|---|---|---|---|
| RRWL + IO trong khoá (hiện tại) | Có, khi có writer chờ | Thấp | Không bao giờ |
| RRWL, copy rồi IO ngoài khoá | Rất ngắn (µs) | Thấp | Dữ liệu lớn, cập nhật từng phần |
| Fair RRWL ({{new ReentrantReadWriteLock(true)}}) | Vẫn có — công bằng FIFO cũng xếp reader sau writer | Thấp | Không giải quyết vấn đề này |
| {{StampedLock}} optimistic read | Hầu như không | Cao, dễ sai, không reentrant | Hot path cực nóng, dữ liệu nhỏ |
| Immutable snapshot + volatile | Không bao giờ | Thấp | Đọc nhiều, ghi định kỳ toàn bộ (case này) |

Thêm một lưu ý: {{writeLock().tryLock(timeout)}} **không** cứu được vì writer vẫn vào hàng chờ trong lúc chờ timeout và vẫn chặn reader mới; chỉ {{tryLock()}} không tham số mới "chen ngang" mà không xếp hàng.

### Quy tắc cho team (góc nhìn lead)

1. **Không IO, không gọi service khác, không log nặng trong vùng khoá** — áp dụng cho {{synchronized}}, {{ReentrantLock}}, read lock, cả lock phân tán.
2. Dữ liệu "đọc nhiều, ghi định kỳ" → mặc định dùng immutable snapshot; chỉ dùng RRWL khi có lý do đo được.
3. Mọi endpoint mới (như export của BI) phải được review về tài nguyên dùng chung mà nó chạm vào, không chỉ về logic.
4. Đo **thời gian giữ khoá** (timer quanh vùng khoá hoặc JFR {{jdk.ThreadPark}}) và alert khi vượt ngưỡng.

### Lỗi hay gặp

- Tin rằng "read lock không bao giờ chặn read lock". Đúng khi không có writer chờ; sai khi có.
- Đổi sang fair mode để "công bằng hơn" — fair mode còn chặt hơn, reader cũng xếp hàng FIFO sau writer.
- Đọc dump thấy không ai giữ lock rồi nghi "bug JVM" hoặc "lost wakeup"; thực ra là read lock không hiện owner.
- Chỉ nhìn thread đang BLOCKED/WAITING mà bỏ qua thread RUNNABLE ở socket read — chính nó là thủ phạm.

### Trả lời miệng 1 phút

"Export của BI giữ read lock 40 giây vì gọi HTTP cho 180 cặp tiền bên trong vùng khoá. Bản thân việc đó không chặn reader, bằng chứng là 28 giây đầu p99 bình thường. Nhưng lúc 10:15:30 job refresh xin write lock và phải chờ export; trong ReentrantReadWriteLock, khi đầu hàng chờ là writer thì reader mới cũng phải xếp sau để writer không bị đói, nên 171 request đọc tỷ giá kẹt 11,7 giây. Dump không cho thấy ai giữ lock vì read lock là chia sẻ, phải suy ra từ thread đang ở exportSnapshot dòng 64. Tôi sửa bằng cách đưa IO ra ngoài khoá ngay, và dài hạn đổi sang immutable map với tham chiếu volatile để reader không cần khoá."

> Senior tip: Khi thấy {{ReentrantReadWriteLock}} trong code review, tôi hỏi "tỉ lệ đọc/ghi và thời gian giữ khoá dài nhất là bao nhiêu?". Phần lớn trường hợp đọc nhiều, ghi theo lô thì copy-on-write với {{volatile}} vừa đơn giản vừa nhanh hơn — {{get}} chỉ còn một lần đọc volatile và một lần tra map, không có CAS trên bộ đếm reader (với 2 500 req/s trên nhiều core, CAS trên một biến chung cũng gây cache-line contention). RRWL chỉ đáng dùng khi dữ liệu quá lớn để copy và cập nhật từng phần.`,
  rubric: [
    'Giải thích đúng cơ chế: export giữ read lock lâu do IO trong vùng khoá; writer fx-refresh xin write lock và chờ; reader mới tự chặn vì đầu hàng chờ là writer (chống writer starvation, áp dụng cả non-fair) nên 171 request bị chặn.',
    'Dựng đúng timeline từ log: export 10:15:02–10:15:41.733 (39615ms), 28 giây đầu không chậm, writer chờ từ 10:15:30.044 với waitedForLock=11690ms, request chậm nhất 11688ms kết thúc ngay sau writer; lặp mỗi giờ vì export 40s > chu kỳ 30s.',
    'Giải thích vì sao không thread nào hiện là chủ lock 0x00000007b3a01c88 (read lock chia sẻ không có exclusive owner) và suy ra chủ là exec-3 ở exportSnapshot dòng 64.',
    'Đề xuất sửa: copy rồi IO ngoài khoá (ngắn hạn), immutable snapshot + volatile (dài hạn), so sánh với fair mode/StampedLock/tryLock, kèm quy tắc team (không IO trong khoá, đo thời gian giữ khoá).'
  ],
  tags: ['readwritelock', 'lock-contention', 'writer-starvation', 'jstack', 'copy-on-write', 'aqs']
},
{
  id: 'lab-thread-009',
  category: 'thread',
  title: 'Chuyển sang virtual thread nhưng API tra cứu vẫn nghẽn: pinning vì synchronized bọc JDBC',
  level: 'senior',
  scenario: `**Bối cảnh:** **FinOne Lookup** (Spring Boot 3.3, Java 21, PostgreSQL 15, HikariCP) là dịch vụ tra cứu hồ sơ khách hàng. Trước đây Tomcat dùng 200 platform thread (thread hệ điều hành — mỗi thread là một "công nhân" thật của OS, tốn ~1MB bộ nhớ stack và chi phí chuyển ngữ cảnh khi OS đổi qua đổi lại). Khi tải tăng, request phải xếp hàng chờ thread rảnh.

**Thay đổi:** Team bật {{spring.threads.virtual.enabled=true}} để dùng **virtual thread** (thread ảo của JVM, rất nhẹ — vài KB, JVM tự lên lịch hàng triệu cái trên một số ít thread OS gọi là **carrier thread**). Kỳ vọng: khi một virtual thread chờ I/O (gọi DB, gọi HTTP) nó sẽ "nhường" carrier cho virtual thread khác chạy, nên throughput tăng mạnh.

**Triệu chứng:** Sau deploy, throughput **không tăng**, thậm chí giảm nhẹ: trước 820 req/s, sau **790 req/s**; p99 từ 95ms lên **640ms**. CPU pod 2 vCPU chỉ ~40%. Không lỗi DB, không deadlock. Điều kỳ lạ: thread dump kiểu cũ gần như không thấy request nào đang chạy.

**Dữ liệu thu thập:**
- Chạy {{jcmd 1 Thread.dump_to_file -format=text /tmp/vt-dump.txt}} (định dạng text của JDK 21 liệt kê cả virtual thread, khác {{Thread.print}} thường chỉ thấy platform thread).
- Bật {{-Djdk.tracePinnedThreads=full}} trên pod canary (tùy chọn JDK 21–23, in stack khi virtual thread bị **pin** — bị "ghim" vào carrier, không nhường được).
- Số liệu Prometheus trước/sau deploy (cùng tải 800 req/s).`,
  artifacts: [
    {
      name: 'metrics-before-after.txt',
      lang: 'text',
      content: `# Cùng tải đầu vào: 800 req/s, pod 2 vCPU, HikariCP maximumPoolSize=30
# BEFORE (platform threads, Tomcat max 200)
2026-10-28 09:00-09:10 window: rps=798, p50=42ms, p95=78ms, p99=95ms, cpu=62%, tomcat_busy=140/200
HikariPool-1: active=22, idle=8, pending=0

# AFTER (virtual threads enabled)
2026-10-28 10:00-10:10 window: rps=790, p50=180ms, p95=510ms, p99=640ms, cpu=40%, hikari_pending_avg=0
HikariPool-1: active=28, idle=2, pending=0

# Ghi chú on-call: DB query trung bình 35ms (không đổi). Không có request nào chờ connection pool.
# Carrier threads (ForkJoinPool common) đang chạy: 2 (xem vt-dump.txt worker-1/worker-2; mặc định pool là availableProcessors - 1, pinning khiến pool bù đắp thêm carrier).`
    },
    {
      name: 'trace-pinned.log',
      lang: 'text',
      content: `2026-10-28T10:03:12.441+07:00  INFO 1 --- [lookup-vt] v.f.lookup.CustomerLookupService : lookup customerId=C-884102
Thread[#812,VirtualThread[#812]/runnable@ForkJoinPool-1-worker-1,5,CarrierThreads]
    java.base/java.lang.VirtualThread$VThreadContinuation.onPinned(VirtualThread.java:183)
    java.base/jdk.internal.vm.Continuation.onPinned0(Continuation.java:393)
    java.base/java.lang.VirtualThread.park(VirtualThread.java:621)
    java.base/java.lang.System$2.parkVirtualThread(System.java:2652)
    java.base/jdk.internal.misc.VirtualThreads.park(VirtualThreads.java:67)
    java.base/java.util.concurrent.locks.LockSupport.park(LockSupport.java:369)
    java.base/sun.nio.ch.Poller.poll(Poller.java:102)
    java.base/sun.nio.ch.SocketChannelImpl.implRead(SocketChannelImpl.java:428)
    java.base/sun.nio.ch.SocketChannelImpl.read(SocketChannelImpl.java:489)
    java.base/org.postgresql.core.VisibleBufferedInputStream.readMore(VisibleBufferedInputStream.java:161)
    java.base/org.postgresql.core.VisibleBufferedInputStream.ensureBytes(VisibleBufferedInputStream.java:128)
    java.base/org.postgresql.core.VisibleBufferedInputStream.ensureBytes(VisibleBufferedInputStream.java:113)
    java.base/org.postgresql.core.VisibleBufferedInputStream.read(VisibleBufferedInputStream.java:73)
    java.base/org.postgresql.core.PGStream.receiveChar(PGStream.java:467)
    java.base/org.postgresql.core.v3.QueryExecutorImpl.processResults(QueryExecutorImpl.java:2155)
    java.base/org.postgresql.core.v3.QueryExecutorImpl.execute(QueryExecutorImpl.java:372)
    java.base/org.postgresql.jdbc.PgStatement.executeInternal(PgStatement.java:498)
    java.base/org.postgresql.jdbc.PgPreparedStatement.executeWithFlags(PgPreparedStatement.java:164)
    java.base/org.postgresql.jdbc.PgPreparedStatement.executeQuery(PgPreparedStatement.java:114)
    com.zaxxer.hikari.pool.ProxyPreparedStatement.executeQuery(ProxyPreparedStatement.java:52)
    com.zaxxer.hikari.pool.HikariProxyPreparedStatement.executeQuery(HikariProxyPreparedStatement.java)
    vn.finone.lookup.CustomerRepository.findById(CustomerRepository.java:37) <== monitors:1
    vn.finone.lookup.CustomerLookupService.lookup(CustomerLookupService.java:29) <== monitors:1
    java.base/java.lang.VirtualThread.run(VirtualThread.java:309)

# jdk.tracePinnedThreads in stack khi virtual thread bị pin (mỗi sự kiện pin;
# các request sau cùng stack thường không in lại).`
    },
    {
      name: 'vt-dump.txt',
      lang: 'text',
      content: `# jcmd 1 Thread.dump_to_file -format=text /tmp/vt-dump.txt
# 2026-10-28 10:03:18 +07:00  OpenJDK 64-Bit Server VM 21.0.4+7-LTS
# Lược trích: 2 carrier (worker) + một phần virtual thread đang pin

"ForkJoinPool-1-worker-1" #29 [0x3f] daemon prio=5 os_prio=0 cpu=183412.00ms elapsed=612.44s tid=0x00007f2c64002800 nid=0x3f runnable  [0x00007f2c5c6fd000]
   java.lang.Thread.State: RUNNABLE
   Carrying virtual thread #812
        at java.base@21.0.4/sun.nio.ch.SocketChannelImpl.implRead(SocketChannelImpl.java:428)
        at java.base@21.0.4/sun.nio.ch.SocketChannelImpl.read(SocketChannelImpl.java:489)
        at org.postgresql.core.VisibleBufferedInputStream.readMore(VisibleBufferedInputStream.java:161)
        at org.postgresql.core.PGStream.receiveChar(PGStream.java:467)
        at org.postgresql.core.v3.QueryExecutorImpl.processResults(QueryExecutorImpl.java:2155)
        at org.postgresql.core.v3.QueryExecutorImpl.execute(QueryExecutorImpl.java:372)
        at org.postgresql.jdbc.PgPreparedStatement.executeQuery(PgPreparedStatement.java:114)
        at com.zaxxer.hikari.pool.HikariProxyPreparedStatement.executeQuery(HikariProxyPreparedStatement.java)
        at vn.finone.lookup.CustomerRepository.findById(CustomerRepository.java:37)
        - locked <0x000000070f2a1c40> (a vn.finone.lookup.CustomerRepository)
        at vn.finone.lookup.CustomerLookupService.lookup(CustomerLookupService.java:29)
        - locked <0x000000070f2a4e10> (a vn.finone.lookup.CustomerLookupService)

"ForkJoinPool-1-worker-2" #30 [0x40] daemon prio=5 os_prio=0 cpu=179880.55ms elapsed=612.44s tid=0x00007f2c64004c00 nid=0x40 runnable  [0x00007f2c5c5fc000]
   java.lang.Thread.State: RUNNABLE
   Carrying virtual thread #819
        at java.base@21.0.4/sun.nio.ch.SocketChannelImpl.implRead(SocketChannelImpl.java:428)
        at java.base@21.0.4/sun.nio.ch.SocketChannelImpl.read(SocketChannelImpl.java:489)
        at org.postgresql.core.VisibleBufferedInputStream.readMore(VisibleBufferedInputStream.java:161)
        at org.postgresql.core.PGStream.receiveChar(PGStream.java:467)
        at org.postgresql.core.v3.QueryExecutorImpl.processResults(QueryExecutorImpl.java:2155)
        at org.postgresql.jdbc.PgPreparedStatement.executeQuery(PgPreparedStatement.java:114)
        at com.zaxxer.hikari.pool.HikariProxyPreparedStatement.executeQuery(HikariProxyPreparedStatement.java)
        at vn.finone.lookup.CustomerRepository.findById(CustomerRepository.java:37)
        - locked <0x000000070f2a1c90> (a vn.finone.lookup.CustomerRepository)
        at vn.finone.lookup.CustomerLookupService.lookup(CustomerLookupService.java:29)
        - locked <0x000000070f2a4e88> (a vn.finone.lookup.CustomerLookupService)

# --- Virtual threads (không có carrier, đang chờ được mount) ---
#417 "" virtual WAITING 2026-10-28T10:03:17.992
      java.base/java.lang.VirtualThread.park(VirtualThread.java:592)
      java.base/java.util.concurrent.locks.LockSupport.park(LockSupport.java:369)
      vn.finone.lookup.CustomerRepository.findById(CustomerRepository.java:37)
#418 "" virtual WAITING 2026-10-28T10:03:17.993
      java.base/java.lang.VirtualThread.park(VirtualThread.java:592)
      java.base/java.util.concurrent.locks.LockSupport.park(LockSupport.java:369)
      vn.finone.lookup.CustomerLookupService.lookup(CustomerLookupService.java:29)
#419 "" virtual WAITING 2026-10-28T10:03:17.994
      java.base/java.lang.VirtualThread.park(VirtualThread.java:592)
      java.base/java.util.concurrent.locks.LockSupport.park(LockSupport.java:369)
      vn.finone.lookup.CustomerRepository.findById(CustomerRepository.java:37)
# ... (lược bớt) ...
# Tổng trong file: 214 virtual thread WAITING (chờ carrier/monitor), 2 virtual thread đang chạy (mỗi cái pin 1 carrier).`
    }
  ],
  questions: [
    'Vì sao bật virtual thread mà throughput không tăng, p99 còn tăng? Giải thích cơ chế "pinning" và dẫn chứng từ artifact.',
    'Hai carrier thread đang làm gì và vì sao 214 virtual thread kia phải chờ? Phân biệt "chờ I/O bình thường" với "bị pin".',
    'Bạn sẽ sửa thế nào (ngắn hạn và dài hạn)? Nêu cách phát hiện pinning trong CI/production.'
  ],
  hints: [
    'Nhìn {{trace-pinned.log}}: dòng {{<== monitors:1}} nghĩa là gì? Khi virtual thread đang giữ monitor ({{synchronized}}) mà gặp thao tác blocking (đọc socket JDBC), nó có "nhường" carrier được không? Carrier thread là gì so với virtual thread?',
    'Nhìn {{vt-dump.txt}}: {{worker-1}} đang {{Carrying virtual thread #812}} và đọc socket DB nhưng vẫn hiện {{RUNNABLE}} và giữ {{locked <0x000000070f2a1c40>}}. Trong khi đó #417/#418/#419 là {{virtual WAITING}}. Có bao nhiêu carrier cho 216 request đang xử lý?',
    'So sánh 3 cách: bỏ {{synchronized}} đổi sang {{ReentrantLock}} (JDK 21+ không pin khi park trên {{ReentrantLock}}), thu hẹp vùng {{synchronized}} để không bao quanh JDBC, hoặc dùng semaphore giới hạn song song. Nhớ rằng pinning còn xảy ra trong native/foreign call — nhưng ở đây nguyên nhân là monitor.'
  ],
  answer: `**Tóm tắt:** Bật virtual thread không giúp vì code dùng {{synchronized}} bao quanh lời gọi JDBC (đọc dữ liệu từ PostgreSQL qua mạng). Khi virtual thread giữ monitor của {{synchronized}} rồi chờ I/O, nó bị **pin** (ghim) vào carrier thread — không nhường carrier cho thread khác. Chỉ có 2 carrier (2 vCPU) nên tối đa 2 request chạy thật sự cùng lúc, 214 request còn lại phải xếp hàng chờ monitor/carrier. Kết quả giống hệt 2 platform thread, nhưng tệ hơn vì overhead lên lịch virtual thread; vì vậy throughput ~790 req/s, p99 640ms, CPU chỉ 40%.

### Thuật ngữ nền (đọc trước)

- **Thread (luồng):** một "luồng thực thi" — chuỗi lệnh chạy nối tiếp. OS cho nhiều thread chạy xen kẽ.
- **Platform thread:** thread truyền thống, ánh xạ 1-1 với thread của hệ điều hành. Nặng (~1MB stack), tạo/chuyển ngữ cảnh tốn kém. Ví dụ đời thường: mỗi công nhân là một người thật, thuê thêm người rất tốn.
- **Virtual thread (Java 21):** thread ảo do JVM quản lý, rất nhẹ (vài KB). Hàng nghìn/một triệu virtual thread chạy trên một số ít **carrier thread** (thread OS thật, thường bằng số CPU). Khi virtual thread gặp thao tác chờ (I/O, sleep) nó *unmount* khỏi carrier để carrier chạy virtual thread khác — giống vài nhân viên thật luân phiên xử lý rất nhiều phiếu chờ.
- **Carrier thread:** thread OS đang "cõng" (carry) một virtual thread. Trong dump hiện là {{ForkJoinPool-1-worker-1}} và {{worker-2}} (2 carrier = 2 vCPU).
- **Monitor / synchronized:** {{synchronized}} lấy một "ổ khóa" (monitor) gắn với object. Chỉ một thread giữ monitor tại một thời điểm; thread khác phải chờ.
- **Pinning (ghim):** trạng thái virtual thread **không thể unmount** khỏi carrier trong khi đang thực hiện thao tác blocking. Carrier bị chiếm giữ, không chạy được virtual thread khác. Nguyên nhân phổ biến: (1) đang giữ monitor của {{synchronized}} rồi park/block, (2) đang ở trong native/foreign function (JNI, Panama).
- **JDBC:** API Java để chạy SQL qua kết nối mạng tới database (ở đây là PostgreSQL).

### Cơ chế pinning — vì sao virtual thread không nhường carrier

Khi mọi thứ thuận lợi, virtual thread gọi I/O (ví dụ đọc socket) → JVM gỡ nó khỏi carrier → carrier chạy thread khác → I/O xong thì mount lại. Nhưng nếu virtual thread **đang giữ monitor {{synchronized}}** ({{monitors:1}} trong trace) tại thời điểm đó, JVM **không dám** unmount: nếu nhường carrier, monitor vẫn bị giữ bởi virtual thread đang treo, và cơ chế {{synchronized}} (gắn với thread OS) sẽ rối loạn. Vì vậy JVM giữ nguyên virtual thread trên carrier — đó là **pinning**.

~~~text
Bình thường (không synchronized):           Khi pin (đang synchronized + I/O):
  VT-A chờ DB  -> unmount                   VT-A chờ DB  -> BỊ GHIM trên carrier-1
  carrier-1 chạy VT-B, VT-C...               carrier-1 đứng chờ socket (không làm gì khác)
  DB trả về    -> mount VT-A lại             VT-B, VT-C... xếp hàng chờ carrier/monitor
~~~

### Dẫn chứng từ artifact

**1) trace-pinned.log:** Stack cho thấy {{onPinned}} → {{park}} → {{SocketChannelImpl.implRead}} (đọc socket PostgreSQL). Hai dòng {{<== monitors:1}} tại {{CustomerRepository.findById}} (dòng 37) và {{CustomerLookupService.lookup}} (dòng 29) chứng minh virtual thread đang giữ 2 monitor {{synchronized}} đúng lúc chờ JDBC. Đây là bằng chứng trực tiếp của pinning.

**2) vt-dump.txt (jcmd Thread.dump_to_file -format=text):** Hai carrier {{worker-1}} (nid 0x3f) và {{worker-2}} (nid 0x40) đều ở {{java.lang.Thread.State: RUNNABLE}} nhưng thực ra đang **chờ socket DB** ({{implRead}}). Mỗi carrier ghi rõ {{Carrying virtual thread #812/#819}} và giữ {{locked <0x000000070f2a1c40>}} / {{<0x000000070f2a1c90>}}. Pod có 2 vCPU → đúng 2 carrier → đúng 2 request chạy đồng thời, phần còn lại bất lực.

**3) 214 virtual thread WAITING:** {{#417, #418, #419}} (và tổng 214) đều {{virtual WAITING}} tại {{VirtualThread.park}} từ {{CustomerRepository.findById}} / {{CustomerLookupService.lookup}}. Chúng không chờ DB — chúng chờ được mount lên carrier hoặc chờ monitor. Request đến liên tục nhưng không có carrier rảnh để chạy.

**4) Số liệu:** Trước (200 platform thread) có thể có ~140 thread bận, mỗi thread tự chờ I/O của nó trên thread OS riêng → 798 req/s. Sau (virtual thread) chỉ 2 carrier thật sự chạy, DB vẫn 35ms/query → tối đa ~57 req/s trên lý thuyết mỗi carrier nếu tuần tự, thực tế xen kẽ chút đỉnh nhưng vẫn ~790 req/s tổng là trần thấp, p99 vọt vì xếp hàng. CPU 40% vì 2 core bận chờ I/O nhưng nhìn tổng (bao gồm thời gian idle scheduling) thấp; quan trọng là **không có carrier rảnh**.

### Vì sao {{Thread.print}} thường không thấy gì?

{{jcmd 1 Thread.print}} (định dạng truyền thống) chủ yếu liệt kê **platform thread**. Virtual thread chỉ hiện đầy đủ với {{Thread.dump_to_file -format=text}} (JDK 21+) hoặc {{-format=json}}. Đây là bẫy chẩn đoán: "dump trống" không có nghĩa là không có request đang kẹt.

### So sánh: chờ I/O bình thường vs bị pin

| Tình huống | Virtual thread | Carrier | Hậu quả |
|---|---|---|---|
| Chờ I/O, **không** giữ {{synchronized}} | unmount, park | chạy VT khác | Đúng mục đích virtual thread |
| Chờ I/O, **đang giữ** {{synchronized}} (case này) | bị pin, park | đứng chờ I/O, không chạy VT khác | Carrier cạn kiệt, throughput sập |
| Chờ trên {{ReentrantLock.lock()}} (JDK 21+) | unmount, park | chạy VT khác | Không pin ({{ReentrantLock}} dùng {{LockSupport.park}} tương thích VT) |

### Cách sửa

**Ngắn hạn (an toàn, làm ngay):**
1. **Bỏ {{synchronized}} trên đường đi I/O**, thay bằng {{ReentrantLock}} hoặc thiết kế stateless để không cần khóa instance:
~~~java
public class CustomerRepository {
    // TRƯỚC: synchronized bọc cả JDBC -> pin
    public synchronized Customer findById(String id) { return jdbc.query(...); }
}
// SAU (chọn 1): bỏ synchronized nếu repository không giữ state chia sẻ cần bảo vệ
public class CustomerRepository {
    public Customer findById(String id) { return jdbc.query(...); } // JDBC + pool tự thread-safe
}
// SAU (chọn 2): nếu thực sự cần khóa, dùng ReentrantLock (không pin khi await/park)
public class CustomerRepository {
    private final ReentrantLock lock = new ReentrantLock();
    public Customer findById(String id) {
        lock.lock();
        try { return jdbc.query(...); } finally { lock.unlock(); }
    } // Lưu ý: vẫn giữ lock suốt I/O (chặn thread khác) nhưng KHÔNG pin carrier — khác biệt quan trọng
}
~~~
Lưu ý: {{ReentrantLock}} tránh pin nhưng vẫn giữ khóa trong lúc chờ DB, nên các virtual thread khác vào cùng repository vẫn phải chờ nhau — tốt hơn pinning (carrier được giải phóng) nhưng chưa tối ưu. Tốt nhất là **không khóa bao quanh I/O**.

2. **Thu hẹp vùng khóa:** nếu chỉ cần bảo vệ một đoạn cập nhật state nhỏ, khóa đúng đoạn đó, để JDBC nằm ngoài.
3. **Tạm thời quay lại platform thread** cho endpoint này (hoặc tắt virtual thread toàn cục) nếu chưa kịp sửa, để khôi phục SLA.

**Dài hạn:**
- Dùng JDBC driver / thư viện đã kiểm chứng với virtual thread; cấu hình pool hợp lý (virtual thread nhiều nhưng connection DB vẫn là tài nguyên hữu hạn).
- Quy ước code review: "đường đi có I/O không được nằm trong {{synchronized}}". Viết ArchUnit/kiểm tra tĩnh nếu có thể.
- Với thao tác cần giới hạn đồng thời (thay vì khóa), dùng {{Semaphore}} ({{acquire}} cũng tương thích virtual thread khi dùng đúng API).

### Phát hiện pinning trong CI/production

- **JDK 21–23:** chạy test tải với {{-Djdk.tracePinnedThreads=full}} (hoặc {{short}}). Bất kỳ dòng {{onPinned}} nào cũng là cảnh báo cần xử lý.
- **JDK 24+:** sự kiện JFR {{jdk.VirtualThreadPinned}} vẫn hữu ích; kết hợp {{jdk.VirtualThreadSubmitFailed}} và theo dõi độ dài hàng đợi carrier.
- **Production:** bật JFR profile liên tục, dashboard đếm {{jdk.VirtualThreadPinned}} theo endpoint/stack; alert khi > 0 ở đường nóng.
- **Unit/integration test:** chạy với {{-Djdk.tracePinnedThreads=full}} và fail test nếu stderr chứa {{onPinned}} (hoặc dùng JFR stream API).

### Bẫy hay gặp

- Nghĩ "bật virtual thread là xong" mà không rà {{synchronized}} trong code mình và thư viện (SDK cũ, driver cũ).
- Nhầm {{ReentrantLock}}: nó tránh pin nhưng nếu giữ lock suốt I/O vẫn gây tranh chấp logic — không phải đũa thần.
- Chỉ nhìn {{Thread.print}} thấy ít thread → kết luận "không có gì"; phải dùng {{Thread.dump_to_file -format=text}}.
- Tăng số connection pool để "chữa" p99: pool không phải nút thắt ở đây ({{pending=0}}), nút thắt là carrier bị pin.

> Senior tip: Virtual thread giải bài toán "ngàn tác vụ chờ I/O" (I/O-bound), không giải "khóa tranh chấp" hay "CPU-bound". Trước khi bật toàn cục, hãy chạy canary với {{-Djdk.tracePinnedThreads=full}} và JFR, soi cả dependency: một thư viện logging/metrics/SDK dùng {{synchronized}} quanh network call cũng đủ ghim carrier. Quy tắc vàng: {{synchronized}} chỉ bao quanh đoạn CPU thuần túy, rất ngắn; mọi thứ chạm I/O phải nằm ngoài monitor.`,
  rubric: [
    'Giải thích đúng cơ chế pinning: virtual thread giữ monitor {{synchronized}} (monitors:1) khi gặp blocking I/O JDBC thì không unmount khỏi carrier; carrier bị chiếm, 214 virtual thread xếp hàng. Dẫn chứng trace-pinned (onPinned, SocketChannelImpl.implRead, monitors:1 tại Repository:37/Service:29) và vt-dump (worker-1/2 Carrying #812/#819, locked 0x000000070f2a1c40/0x000000070f2a4e10).',
    'Giải thích vì sao throughput không tăng: chỉ 2 carrier đang chạy (pod 2 vCPU) phục vụ tuần tự ~2 request cùng lúc trong lúc chờ DB 35ms; Hikari pending=0 nên nút thắt không phải pool. Phân biệt chờ I/O không pin vs bị pin.',
    'Đề xuất sửa: bỏ/thu hẹp {{synchronized}} khỏi đường đi JDBC (ưu tiên), hoặc dùng {{ReentrantLock}} (tránh pin nhưng vẫn giữ lock logic), kèm lưu ý trade-off; cách phát hiện (tracePinnedThreads JDK21-23, JFR VirtualThreadPinned, dump dạng text).'
  ],
  tags: ['virtual-thread', 'pinning', 'synchronized', 'jdbc', 'jcmd', 'carrier-thread', 'java21']
},
{
  id: 'lab-thread-010',
  category: 'thread',
  title: 'parallelStream và supplyAsync không truyền executor: commonPool bị I/O chặn, cả hệ thống ì ạch',
  level: 'senior',
  scenario: `**Bối cảnh:** **ShopCore Pricing** (Spring Boot 3.3, Java 17, pod 8 vCPU) tính giá khuyến mãi cho giỏ hàng. Mỗi request gọi:
- {{CompletableFuture.supplyAsync(() -> taxClient.quote(...))}} để lấy thuế từ dịch vụ thuế (HTTP, ~300ms).
- {{cart.getItems().parallelStream().map(p -> inventoryClient.stock(p))}} để lấy tồn kho từng sản phẩm (HTTP, ~200ms/call).

Đội dev dùng {{supplyAsync}} và {{parallelStream}} vì "chạy song song cho nhanh" và không truyền {{Executor}} (dùng mặc định).

**Triệu chứng:** Lúc bình thường (ít request) latency ổn. Khi traffic tăng gấp đôi lúc **14:05 ngày 03/11/2026**, p99 của {{/pricing/quote}} tăng từ 420ms lên **18s**, nhưng CPU pod chỉ **11%** (gần như rảnh). Dịch vụ thuế và tồn kho upstream vẫn khỏe (p99 upstream < 250ms). Heap bình thường, không GC căng. Hết đợt traffic p99 tự hồi phục.

**Dữ liệu thu thập:** {{jstack <pid>}} lúc 14:08:30, số liệu latency/CPU, và log thread pool (không có pool tùy chỉnh nào được cấu hình).`,
  artifacts: [
    {
      name: 'metrics-14h.txt',
      lang: 'text',
      content: `# Pricing pod (8 vCPU), 2026-11-03
# 13:50-14:00 (baseline, ~120 req/s)
  /pricing/quote p50=180ms p95=350ms p99=420ms
  CPU avg=22%  loadavg=1.1  GC pause p99=12ms

# 14:05-14:10 (traffic spike, ~260 req/s)
  /pricing/quote p50=4200ms p95=14500ms p99=18000ms
  CPU avg=11%  loadavg=0.4  GC pause p99=14ms
  HikariPool active=3/20 pending=0   (DB gần như không dùng trong luồng pricing)

# Upstream (cùng thời điểm 14:05-14:10)
  tax-service      p99=210ms  2xx=99.9%
  inventory-service p99=240ms  2xx=99.8%

# JVM
  java.version=17.0.11  availableProcessors=8
  ForkJoinPool.commonPool() parallelism (mặc định) = availableProcessors - 1 = 7`
    },
    {
      name: 'jstack-pricing.txt',
      lang: 'text',
      content: `2026-11-03 14:08:30
Full thread dump OpenJDK 64-Bit Server VM (17.0.11+9 mixed mode, sharing):

"ForkJoinPool.commonPool-worker-1" #22 daemon prio=5 os_prio=0 cpu=8450.12ms elapsed=18320.44s tid=0x00007f1a901f4800 nid=0x5e runnable  [0x00007f1a74cfd000]
   java.lang.Thread.State: RUNNABLE
        at sun.nio.ch.Net.poll(java.base@17.0.11/Native Method)
        at sun.nio.ch.NioSocketImpl.park(java.base@17.0.11/NioSocketImpl.java:186)
        at sun.nio.ch.NioSocketImpl.timedRead(java.base@17.0.11/NioSocketImpl.java:290)
        at sun.nio.ch.NioSocketImpl.implRead(java.base@17.0.11/NioSocketImpl.java:314)
        at sun.nio.ch.NioSocketImpl.read(java.base@17.0.11/NioSocketImpl.java:355)
        at sun.nio.ch.NioSocketImpl$1.read(java.base@17.0.11/NioSocketImpl.java:808)
        at java.net.Socket$SocketInputStream.read(java.base@17.0.11/Socket.java:966)
        at java.io.BufferedInputStream.fill(java.base@17.0.11/BufferedInputStream.java:244)
        at java.io.BufferedInputStream.read1(java.base@17.0.11/BufferedInputStream.java:284)
        at java.io.BufferedInputStream.read(java.base@17.0.11/BufferedInputStream.java:343)
        at sun.net.www.http.HttpClient.parseHTTPHeader(java.base@17.0.11/HttpClient.java:826)
        at sun.net.www.http.HttpClient.parseHTTP(java.base@17.0.11/HttpClient.java:759)
        at sun.net.www.protocol.http.HttpURLConnection.getInputStream0(java.base@17.0.11/HttpURLConnection.java:1705)
        at sun.net.www.protocol.http.HttpURLConnection.getInputStream(java.base@17.0.11/HttpURLConnection.java:1614)
        at vn.shopcore.pricing.InventoryClient.stock(InventoryClient.java:54)
        at vn.shopcore.pricing.PricingService.lambda$quote$2(PricingService.java:71)
        at java.util.stream.ReferencePipeline$3$1.accept(java.base@17.0.11/ReferencePipeline.java:197)
        at java.util.ArrayList$ArrayListSpliterator.forEachRemaining(java.base@17.0.11/ArrayList.java:1625)
        at java.util.stream.AbstractPipeline.copyInto(java.base@17.0.11/AbstractPipeline.java:509)
        at java.util.stream.AbstractPipeline.wrapAndCopyInto(java.base@17.0.11/AbstractPipeline.java:499)
        at java.util.stream.ReduceOps$ReduceTask.doLeaf(java.base@17.0.11/ReduceOps.java:960)
        at java.util.stream.ReduceOps$ReduceTask.doLeaf(java.base@17.0.11/ReduceOps.java:934)
        at java.util.stream.AbstractTask.compute(java.base@17.0.11/AbstractTask.java:327)
        at java.util.concurrent.CountedCompleter.exec(java.base@17.0.11/CountedCompleter.java:754)
        at java.util.concurrent.ForkJoinTask.doExec(java.base@17.0.11/ForkJoinTask.java:373)
        at java.util.concurrent.ForkJoinPool$WorkQueue.topLevelExec(java.base@17.0.11/ForkJoinPool.java:1182)
        at java.util.concurrent.ForkJoinPool.scan(java.base@17.0.11/ForkJoinPool.java:1655)
        at java.util.concurrent.ForkJoinPool.runWorker(java.base@17.0.11/ForkJoinPool.java:1622)
        at java.util.concurrent.ForkJoinWorkerThread.run(java.base@17.0.11/ForkJoinWorkerThread.java:165)

"ForkJoinPool.commonPool-worker-2" #23 daemon prio=5 os_prio=0 cpu=8311.40ms elapsed=18320.44s tid=0x00007f1a901f6800 nid=0x5f runnable  [0x00007f1a74bfc000]
   java.lang.Thread.State: RUNNABLE
        at sun.nio.ch.Net.poll(java.base@17.0.11/Native Method)
        at sun.nio.ch.NioSocketImpl.park(java.base@17.0.11/NioSocketImpl.java:186)
        at sun.nio.ch.NioSocketImpl.implRead(java.base@17.0.11/NioSocketImpl.java:314)
        at sun.nio.ch.NioSocketImpl.read(java.base@17.0.11/NioSocketImpl.java:355)
        at java.net.Socket$SocketInputStream.read(java.base@17.0.11/Socket.java:966)
        at sun.net.www.http.HttpClient.parseHTTP(java.base@17.0.11/HttpClient.java:759)
        at sun.net.www.protocol.http.HttpURLConnection.getInputStream(java.base@17.0.11/HttpURLConnection.java:1614)
        at vn.shopcore.pricing.TaxClient.quote(TaxClient.java:48)
        at vn.shopcore.pricing.PricingService.lambda$quote$0(PricingService.java:58)
        at java.util.concurrent.CompletableFuture$AsyncSupply.run(java.base@17.0.11/CompletableFuture.java:1768)
        at java.util.concurrent.CompletableFuture$AsyncSupply.exec(java.base@17.0.11/CompletableFuture.java:1760)
        at java.util.concurrent.ForkJoinTask.doExec(java.base@17.0.11/ForkJoinTask.java:373)
        at java.util.concurrent.ForkJoinPool$WorkQueue.topLevelExec(java.base@17.0.11/ForkJoinPool.java:1182)
        at java.util.concurrent.ForkJoinPool.scan(java.base@17.0.11/ForkJoinPool.java:1655)
        at java.util.concurrent.ForkJoinPool.runWorker(java.base@17.0.11/ForkJoinPool.java:1622)
        at java.util.concurrent.ForkJoinWorkerThread.run(java.base@17.0.11/ForkJoinWorkerThread.java:165)

"ForkJoinPool.commonPool-worker-3" #24 daemon prio=5 os_prio=0 cpu=8299.01ms elapsed=18320.44s tid=0x00007f1a901f8800 nid=0x60 runnable  [0x00007f1a74afb000]
   java.lang.Thread.State: RUNNABLE
        at sun.nio.ch.Net.poll(java.base@17.0.11/Native Method)
        at sun.nio.ch.NioSocketImpl.implRead(java.base@17.0.11/NioSocketImpl.java:314)
        at java.net.Socket$SocketInputStream.read(java.base@17.0.11/Socket.java:966)
        at sun.net.www.protocol.http.HttpURLConnection.getInputStream(java.base@17.0.11/HttpURLConnection.java:1614)
        at vn.shopcore.pricing.InventoryClient.stock(InventoryClient.java:54)
        at vn.shopcore.pricing.PricingService.lambda$quote$2(PricingService.java:71)
        at java.util.stream.AbstractTask.compute(java.base@17.0.11/AbstractTask.java:327)
        at java.util.concurrent.ForkJoinPool.runWorker(java.base@17.0.11/ForkJoinPool.java:1622)
        at java.util.concurrent.ForkJoinWorkerThread.run(java.base@17.0.11/ForkJoinWorkerThread.java:165)

# ... worker-4, worker-5, worker-6, worker-7 có stack tương tự (đều Net.poll/read socket
# tới inventory-service:8080 hoặc tax-service:8080) ...
# Tổng: 7 thread ForkJoinPool.commonPool-worker-* , TẤT CẢ đều RUNNABLE nhưng đang chờ socket read.
# Không có worker nào rảnh. Tomcat request threads (http-nio-8080-exec-*) đang WAITING chờ future/stream hoàn thành.`
    },
    {
      name: 'PricingService.java',
      lang: 'text',
      content: `@Service
public class PricingService {
    private final TaxClient taxClient;           // gọi HTTP tới tax-service
    private final InventoryClient inventoryClient; // gọi HTTP tới inventory-service

    public Quote quote(Cart cart) {
        // (A) Không truyền executor -> chạy trên ForkJoinPool.commonPool()
        CompletableFuture<Tax> taxFuture =
            CompletableFuture.supplyAsync(() -> taxClient.quote(cart));

        // (B) parallelStream() cũng dùng ForkJoinPool.commonPool()
        List<Stock> stocks = cart.getItems().parallelStream()
            .map(item -> inventoryClient.stock(item.getSku()))  // HTTP blocking ~200ms
            .toList();

        Tax tax = taxFuture.join();   // Tomcat thread chờ ở đây
        return Quote.of(cart, stocks, tax);
    }
}`
    }
  ],
  questions: [
    'Vì sao CPU chỉ 11% mà latency p99 lại lên 18 giây? Giải thích ForkJoinPool.commonPool là gì, ai dùng chung nó, và cơ chế starvation (đói tài nguyên) ở đây.',
    'Tại sao upstream khỏe (p99 < 250ms) nhưng Pricing vẫn chậm? Dựa vào số liệu 7 worker và ~260 req/s để ước lượng nút thắt.',
    'Bạn sẽ sửa thế nào để cô lập I/O blocking khỏi commonPool? Nêu các cách và trade-off (thread pool riêng, virtual thread, bất đồng bộ thật sự).'
  ],
  hints: [
    'Đọc {{PricingService.java}}: {{supplyAsync(...)}} không có tham số thứ 2 chạy ở đâu? {{parallelStream()}} chạy ở đâu? Hai chỗ đó có dùng **chung** một pool không? Trong jstack có bao nhiêu worker và tất cả đang làm gì?',
    '{{ForkJoinPool.commonPool()}} mặc định có {{availableProcessors - 1}} thread = 7 (xem metrics). Mỗi worker đang {{RUNNABLE}} nhưng thực ra chờ {{Net.poll}} (đọc socket) — thread OS bị chiếm để đợi I/O, không tính toán. 7 "công nhân" đều đứng chờ mạng thì tác vụ mới (của request khác, hoặc thậm chí tác vụ khác trong JVM) xếp hàng ra sao?',
    'So sánh: (1) truyền {{Executor}} riêng cho {{supplyAsync(supplier, ioExecutor)}} và thay {{parallelStream}} bằng submit lên pool I/O; (2) dùng virtual thread executor (Java 21) cho tác vụ I/O; (3) dùng HTTP client bất đồng bộ thật sự (WebClient/non-blocking). Chú ý: pool I/O phải giới hạn để không làm quá tải upstream.'
  ],
  answer: `**Tóm tắt:** {{parallelStream()}} và {{CompletableFuture.supplyAsync(...)}} (không truyền {{Executor}}) đều dùng chung **{{ForkJoinPool.commonPool()}}** — một thread pool toàn JVM. Pool này mặc định chỉ có {{số_CPU - 1 = 7}} worker. Code lại dùng pool đó để gọi HTTP blocking (chờ mạng 200–300ms), nên cả 7 worker đều bị kẹt ở {{Net.poll}} (đọc socket). Khi traffic tăng, mọi tác vụ mới (kể cả của request khác) phải xếp hàng chờ 7 worker rảnh → p99 18s dù CPU chỉ 11% (thread đang "chờ", không tính toán). Upstream vẫn nhanh; nút thắt nằm ở chính service Pricing vì tự cạn kiệt worker.

### Thuật ngữ nền

- **Thread pool (bể luồng):** một nhóm thread tạo sẵn, tái dùng để chạy nhiều tác vụ. Tránh chi phí tạo thread mới liên tục. Ví dụ đời thường: 7 nhân viên phục vụ dùng chung cho cả quán — nếu cả 7 đều đứng chờ bếp (I/O), khách mới không ai tiếp.
- **{{ForkJoinPool.commonPool()}}:** thread pool dùng chung, chia sẻ **toàn bộ JVM**. Mặc định kích thước = {{Runtime.getRuntime().availableProcessors() - 1}} (ở đây 8 - 1 = 7). Bất kỳ ai trong process cũng có thể vô tình dùng nó.
- **{{parallelStream()}}:** chạy các phần tử của stream song song bằng {{commonPool}}.
- **{{CompletableFuture.supplyAsync(supplier)}}** (1 tham số): chạy {{supplier}} bất đồng bộ trên {{commonPool}}. Bản 2 tham số {{supplyAsync(supplier, executor)}} mới cho phép chọn pool.
- **Blocking I/O:** thao tác chờ dữ liệu từ bên ngoài (mạng, đĩa). Thread gọi nó sẽ đứng yên chờ — thread OS bị chiếm nhưng CPU nhàn rỗi.
- **Starvation (đói tài nguyên):** tác vụ không bao giờ/ rất lâu mới được chạy vì tài nguyên cần thiết (ở đây là worker thread) bị tác vụ khác giữ mãi.

### Ai dùng chung commonPool? (cái bẫy lớn)

~~~text
ForkJoinPool.commonPool()  (7 worker, dùng chung TOÀN JVM)
  +-- PricingService.lambda$quote$0  (supplyAsync -> TaxClient HTTP)      [từ request A]
  +-- PricingService.lambda$quote$2  (parallelStream -> Inventory HTTP)   [từ request A, B, C...]
  +-- (có thể) bất kỳ thư viện nào khác gọi parallelStream/supplyAsync
Tất cả tranh nhau đúng 7 worker.
~~~

Mỗi request pricing tạo 1 future lấy thuế + N tác vụ lấy tồn kho (song song). Ở 260 req/s, với vài item mỗi giỏ, số tác vụ blocking I/O sinh ra **lớn hơn rất nhiều** so với 7 worker — hàng đợi phình ra, latency tăng theo hàng đợi.

### Dẫn chứng từ artifact

**1) {{PricingService.java}}:** dòng {{CompletableFuture.supplyAsync(() -> taxClient.quote(cart))}} không truyền executor → {{commonPool}}. Dòng {{cart.getItems().parallelStream()}} → {{commonPool}}. Cả hai đều gọi HTTP client blocking ({{HttpURLConnection.getInputStream}}).

**2) {{jstack-pricing.txt}}:** Cả 7 {{ForkJoinPool.commonPool-worker-1}} đến {{worker-7}} đều {{java.lang.Thread.State: RUNNABLE}} nhưng stack dừng ở {{sun.nio.ch.Net.poll}} / {{NioSocketImpl.implRead}} / {{Socket$SocketInputStream.read}} — tức là **chờ mạng**. {{worker-2}} đang chạy {{CompletableFuture$AsyncSupply}} gọi {{TaxClient.quote}}; các worker khác chạy {{AbstractTask.compute}} (tác vụ của {{parallelStream}}) gọi {{InventoryClient.stock}}. **Không worker nào rảnh.** Tomcat thread ({{http-nio-8080-exec-*}}) thì {{WAITING}} chờ {{future.join()}} / stream hoàn thành.

**3) {{metrics-14h.txt}}:** {{availableProcessors=8}} → commonPool parallelism = 7. CPU 11%, loadavg 0.4, upstream p99 < 250ms, DB pool pending=0: mọi thứ bên ngoài khỏe. Nút thắt chỉ có thể là 7 worker dùng chung bị giữ bởi blocking I/O.

**4) Ước lượng nhanh:** 7 worker, mỗi lần chờ mạng ~200–250ms → tối đa ~28–35 tác vụ I/O hoàn thành/giây trên toàn pool (nếu mỗi tác vụ là một call). Nhưng 260 req/s * (1 call thuế + ~3 call tồn kho) = ~1000+ call/s cần worker. Thiếu worker hàng chục lần → hàng đợi tăng tuyến tính → p99 18s.

### Vì sao {{RUNNABLE}} mà vẫn là "kẹt"?

Trong Java, thread đang chờ I/O qua native poll/read thường vẫn báo {{RUNNABLE}} (nó đang thực thi native code chờ OS), không phải {{WAITING/TIMED_WAITING}} như chờ lock. Đừng nhầm "RUNNABLE = đang tính toán". Phải đọc stack: nếu thấy {{Net.poll}}, {{Socket.read}}, {{EPoll.wait}} thì đó là **I/O wait**.

### Sơ đồ luồng

~~~seq
title: 7 worker commonPool bị I/O giữ, request xếp hàng
actors: Client | Tomcat | CommonPool(7) | Tax/Inventory
Client -> Tomcat: GET /pricing/quote (260 req/s)
Tomcat -> CommonPool(7): supplyAsync(tax) + parallelStream(stock)
CommonPool(7) -> Tax/Inventory: HTTP blocking (200-300ms)
note CommonPool(7): 7/7 worker RUNNABLE @ Net.poll (chờ socket)
Tomcat -> Tomcat: join() WAITING chờ future
CommonPool(7) --> Tomcat: trả kết quả (rất trễ, do xếp hàng)
Tomcat --> Client: response p99 18s
~~~

### Cách sửa

**Nguyên tắc:** Tác vụ **blocking I/O** phải chạy trên executor dành riêng cho I/O (kích thước theo băng thông/upstream, có giới hạn), **không bao giờ** chiếm commonPool (commonPool dành cho tác vụ CPU-bound ngắn).

**Cách 1 — Executor I/O riêng (Java 8+, khuyến nghị khi chưa lên 21):**
~~~java
@Configuration
class ExecutorsConfig {
    @Bean
    ExecutorService ioExecutor() {
        // Giới hạn để không bắn quá tải upstream; đặt theo capacity upstream
        return new ThreadPoolExecutor(32, 64, 60, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(500),
            new ThreadPoolExecutor.CallerRunsPolicy()); // quá tải thì tự Tomcat thread làm (back-pressure)
    }
}

@Service
public class PricingService {
    private final ExecutorService ioExecutor;
    public Quote quote(Cart cart) {
        CompletableFuture<Tax> taxFuture =
            CompletableFuture.supplyAsync(() -> taxClient.quote(cart), ioExecutor); // truyền executor
        // Thay parallelStream bằng submit từng item lên ioExecutor rồi gather
        List<CompletableFuture<Stock>> fs = cart.getItems().stream()
            .map(it -> CompletableFuture.supplyAsync(() -> inventoryClient.stock(it.getSku()), ioExecutor))
            .toList();
        List<Stock> stocks = fs.stream().map(CompletableFuture::join).toList();
        Tax tax = taxFuture.join();
        return Quote.of(cart, stocks, tax);
    }
}
~~~

**Cách 2 — Virtual thread cho I/O (Java 21+, hợp với Spring Boot 3.2+):**
~~~java
ExecutorService vt = Executors.newVirtualThreadPerTaskExecutor();
CompletableFuture.supplyAsync(() -> taxClient.quote(cart), vt);
~~~
Virtual thread chờ I/O sẽ nhường carrier (miễn không bị pin — xem lab pinning), nên có thể scale số tác vụ I/O lớn. Vẫn phải **giới hạn đồng thời** tới upstream (dùng {{Semaphore}}) để tránh bắn sập dịch vụ thuế/tồn kho.

**Cách 3 — HTTP client bất đồng bộ thật sự (WebClient/reactive):** không chiếm thread khi chờ mạng. Mạnh nhưng thay đổi mô hình lập trình lớn; chỉ chọn khi team đã quen reactive.

| Cách | Ưu | Nhược | Khi nào |
|---|---|---|---|
| Thread pool I/O riêng | Đơn giản, kiểm soát concurrency rõ | Tốn thread OS, phải tune size/queue | Java 8–17, blocking client sẵn có |
| Virtual thread executor | Code blocking nhưng scale I/O tốt | Cần Java 21; vẫn phải rate-limit; coi chừng pinning | Java 21+, đường đi I/O-bound |
| Non-blocking (WebClient) | Ít thread, back-pressure tốt | Phức tạp, debug khó, lan ra cả stack | Hệ reactive, throughput cực cao |

### Bẫy hay gặp

- Dùng {{supplyAsync}} "cho nhanh" mà quên tham số {{executor}} — ngầm dùng commonPool.
- Dùng {{parallelStream}} trên tác vụ I/O — {{parallelStream}} sinh ra cho CPU-bound chia nhỏ collection, không phải cho chờ mạng.
- Tạo thread pool I/O **không giới hạn** ({{newCachedThreadPool}} / vô hạn virtual thread bắn upstream) → gây outage dây chuyền cho dịch vụ thuế/tồn kho.
- Thấy {{RUNNABLE}} trong jstack liền cho rằng thread đang bận tính toán; phải đọc tiếp stack xem có {{Net.poll/read}} không.
- Nghĩ "tăng CPU" sẽ cứu: CPU 11% chứng tỏ thêm core vô ích, nút thắt là số worker và I/O wait.

> Senior tip: Quy tắc đội: {{commonPool}} chỉ cho tác vụ CPU-bound, hoàn thành nhanh, **không blocking I/O**. Mọi {{supplyAsync}} trong codebase phải có tham số {{executor}}; mọi {{parallelStream}} phải được review (mặc định đổi về {{stream()}} trừ khi đo được lợi ích CPU). Đặt metric cho kích thước hàng đợi và thời gian chờ của từng executor I/O — đó là chỉ báo sớm trước khi p99 nổ. Và nhớ commonPool là dùng chung: một module khác lạm dụng nó cũng làm Pricing chết theo.`,
  rubric: [
    'Xác định đúng commonPool bị dùng chung bởi {{supplyAsync}} (không executor) và {{parallelStream}} (PricingService.java), parallelism=7 worker; cả 7 worker RUNNABLE nhưng chờ {{Net.poll/Socket.read}} (blocking I/O tới tax/inventory) nên bị starvation khi 260 req/s sinh ~1000 call/s.',
    'Giải thích vì sao CPU 11% nhưng p99 18s (I/O wait, không phải CPU-bound), upstream vẫn khỏe nên nút thắt nằm ở Pricing; phân biệt RUNNABLE đang poll I/O với đang tính toán.',
    'Đề xuất cô lập I/O: truyền executor riêng cho supplyAsync và thay parallelStream bằng submit lên pool I/O có giới hạn/back-pressure, hoặc virtual thread executor (Java 21) + Semaphore rate-limit upstream; nêu trade-off và quy tắc không dùng commonPool cho blocking I/O.'
  ],
  tags: ['forkjoinpool', 'commonpool', 'parallelstream', 'completablefuture', 'starvation', 'blocking-io', 'jstack']
},
{
  id: 'lab-thread-011',
  category: 'thread',
  title: 'Log đồng bộ chặn toàn bộ request khi ổ đĩa chậm và đầy',
  level: 'senior',
  scenario: `**Bối cảnh:** **PayVN Ledger** (Spring Boot 3.4, Java 21, Logback 1.5, Tomcat 200 thread, pod 2 vCPU trên Kubernetes) ghi sổ cái giao dịch. Log ứng dụng ghi qua cấu hình mặc định của Spring Boot vào file {{/var/log/app/ledger.log}} bằng {{RollingFileAppender}} (appender = "bộ ghi" của framework logging, nhận sự kiện log và ghi ra đích như file/console). Thư mục {{/var/log/app}} mount từ một **PersistentVolume** (ổ đĩa gắn vào pod) dùng backend block storage.
  \n**Triệu chứng:** Lúc **09:14 ngày 06/11/2026**, đội vận hành nhận alert "disk utilization 100%" trên volume log. Từ 09:14:30, **mọi API** của Ledger (kể cả {{GET /actuator/health}}) bắt đầu treo: p99 từ 60ms vọt lên hơn 20 giây, Ingress trả 504 hàng loạt. CPU pod chỉ **6%**, heap ổn định, HikariCP {{active=2/20 idle=18 pending=0}} (DB gần như rảnh). Sau khi dọn bớt file log cũ lúc 09:27, p99 tự giảm về bình thường trong 1 phút mà **không cần restart**.
  \n**Dữ liệu thu thập:** {{jcmd 1 Thread.print -l}} lúc 09:19:10, {{df -h}} và {{iostat -x 1 3}} trên node lúc đĩa đầy, cấu hình {{logback-spring.xml}}, và log của chính pod (trích từ stdout sidecar vì file appender đang nghẽn).`,
  artifacts: [
    {
      name: 'jstack-ledger-09-19.txt',
      lang: 'text',
      content: `2026-11-06 09:19:10
Full thread dump OpenJDK 64-Bit Server VM (21.0.4+7-LTS-151 mixed mode, sharing):

"AsyncAppender-Worker-ASYNC_FILE" #0 [0] daemon prio=5 os_prio=0 cpu=0.00ms elapsed=0.00s tid=0x0000000000000000 nid=0
   (không tồn tại - cấu hình không dùng AsyncAppender)

"http-nio-8080-exec-41" #179 [5021] daemon prio=5 os_prio=0 cpu=1840.22ms elapsed=42110.55s tid=0x00007f3a7021a000 nid=5021 waiting for monitor entry  [0x00007f39e61fc000]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at ch.qos.logback.core.OutputStreamAppender.subAppend(OutputStreamAppender.java:238)
        - waiting to lock <0x0000000712c04a10> (a ch.qos.logback.core.rolling.RollingFileAppender)
        at ch.qos.logback.core.rolling.RollingFileAppender.subAppend(RollingFileAppender.java:235)
        at ch.qos.logback.core.OutputStreamAppender.append(OutputStreamAppender.java:102)
        at ch.qos.logback.core.UnsynchronizedAppenderBase.doAppend(UnsynchronizedAppenderBase.java:85)
        at ch.qos.logback.core.spi.AppenderAttachableImpl.appendLoopOnAppenders(AppenderAttachableImpl.java:51)
        at ch.qos.logback.classic.Logger.appendLoopOnAppenders(Logger.java:272)
        at ch.qos.logback.classic.Logger.callAppenders(Logger.java:259)
        at ch.qos.logback.classic.Logger.buildLoggingEventAndAppend(Logger.java:426)
        at ch.qos.logback.classic.Logger.filterAndLog_0_Or3Plus(Logger.java:386)
        at ch.qos.logback.classic.Logger.info(Logger.java:587)
        at vn.pay.ledger.LedgerController.postEntry(LedgerController.java:44)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)
        at org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1089)

   Locked ownable synchronizers:
        - <0x0000000713aa1e40> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)

"http-nio-8080-exec-97" #235 [5133] daemon prio=5 os_prio=0 cpu=1776.90ms elapsed=42110.41s tid=0x00007f3a703a4000 nid=5133 waiting for monitor entry  [0x00007f39e2afb000]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at ch.qos.logback.core.OutputStreamAppender.subAppend(OutputStreamAppender.java:238)
        - waiting to lock <0x0000000712c04a10> (a ch.qos.logback.core.rolling.RollingFileAppender)
        at ch.qos.logback.core.rolling.RollingFileAppender.subAppend(RollingFileAppender.java:235)
        at ch.qos.logback.core.OutputStreamAppender.append(OutputStreamAppender.java:102)
        at ch.qos.logback.core.UnsynchronizedAppenderBase.doAppend(UnsynchronizedAppenderBase.java:85)
        at ch.qos.logback.core.spi.AppenderAttachableImpl.appendLoopOnAppenders(AppenderAttachableImpl.java:51)
        at ch.qos.logback.classic.Logger.appendLoopOnAppenders(Logger.java:272)
        at ch.qos.logback.classic.Logger.callAppenders(Logger.java:259)
        at ch.qos.logback.classic.Logger.buildLoggingEventAndAppend(Logger.java:426)
        at ch.qos.logback.classic.Logger.filterAndLog_0_Or3Plus(Logger.java:386)
        at ch.qos.logback.classic.Logger.info(Logger.java:587)
        at vn.pay.ledger.LedgerController.getEntry(LedgerController.java:61)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)
        at org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1089)

   Locked ownable synchronizers:
        - <0x0000000713aa6b18> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)

"http-nio-8080-exec-12" #150 [4988] daemon prio=5 os_prio=0 cpu=2214.08ms elapsed=42111.02s tid=0x00007f3a70128000 nid=4988 runnable  [0x00007f39e79fe000]
   java.lang.Thread.State: RUNNABLE
        at java.io.FileOutputStream.writeBytes(java.base@21.0.4/Native Method)
        at java.io.FileOutputStream.write(java.base@21.0.4/FileOutputStream.java:367)
        at java.io.BufferedOutputStream.implFlushBuffer(java.base@21.0.4/BufferedOutputStream.java:178)
        at java.io.BufferedOutputStream.flushBuffer(java.base@21.0.4/BufferedOutputStream.java:163)
        at java.io.BufferedOutputStream.implWrite(java.base@21.0.4/BufferedOutputStream.java:217)
        at java.io.BufferedOutputStream.write(java.base@21.0.4/BufferedOutputStream.java:200)
        at ch.qos.logback.core.encoder.LayoutWrappingEncoder.doEncode(LayoutWrappingEncoder.java:136)
        at ch.qos.logback.core.OutputStreamAppender.writeOut(OutputStreamAppender.java:194)
        at ch.qos.logback.core.OutputStreamAppender.subAppend(OutputStreamAppender.java:238)
        - locked <0x0000000712c04a10> (a ch.qos.logback.core.rolling.RollingFileAppender)
        at ch.qos.logback.core.rolling.RollingFileAppender.subAppend(RollingFileAppender.java:235)
        at ch.qos.logback.core.OutputStreamAppender.append(OutputStreamAppender.java:102)
        at ch.qos.logback.core.UnsynchronizedAppenderBase.doAppend(UnsynchronizedAppenderBase.java:85)
        at ch.qos.logback.core.spi.AppenderAttachableImpl.appendLoopOnAppenders(AppenderAttachableImpl.java:51)
        at ch.qos.logback.classic.Logger.appendLoopOnAppenders(Logger.java:272)
        at ch.qos.logback.classic.Logger.callAppenders(Logger.java:259)
        at ch.qos.logback.classic.Logger.buildLoggingEventAndAppend(Logger.java:426)
        at ch.qos.logback.classic.Logger.filterAndLog_0_Or3Plus(Logger.java:386)
        at ch.qos.logback.classic.Logger.info(Logger.java:587)
        at vn.pay.ledger.LedgerService.append(LedgerService.java:88)
        at vn.pay.ledger.LedgerController.postEntry(LedgerController.java:52)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)
        at org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1089)

   Locked ownable synchronizers:
        - <0x0000000713a9c220> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)

# Ghi chú on-call (đếm trên toàn bộ dump, 200 thread Tomcat):
#   grep -c '"http-nio-8080-exec-' jstack-ledger-09-19.txt           -> 200
#   grep -c 'waiting to lock <0x0000000712c04a10>' jstack-ledger-09-19.txt -> 193
#   grep -c 'locked <0x0000000712c04a10>' jstack-ledger-09-19.txt     -> 1   (exec-12)
#   6 thread exec còn lại: idle chờ request mới trong TaskQueue.take
#   exec-12 giữ lock này qua 3 dump liên tiếp (09:19:10, 09:19:20, 09:19:30), luôn ở FileOutputStream.writeBytes`
    },
    {
      name: 'disk-io-and-config.txt',
      lang: 'text',
      content: `$ df -h /var/log/app
Filesystem      Size  Used Avail Use% Mounted on
/dev/vdb         10G   10G     0 100% /var/log/app

$ du -sh /var/log/app/*
2.1G    /var/log/app/ledger.2026-11-04.0.log
2.0G    /var/log/app/ledger.2026-11-05.0.log
2.0G    /var/log/app/ledger.2026-11-05.1.log
3.9G    /var/log/app/ledger.log

$ iostat -x 1 3
Linux 6.5.0 (ledger-7d9f-x2k4m)  11/06/2026  _x86_64_
Device  r/s  w/s  rkB/s   wkB/s  await  svctm  %util
vdb     0.0  2.0   0.0    12.0  980.5  500.0 100.00
vdb     0.0  1.0   0.0     4.0 1120.0 1000.0 100.00
vdb     0.0  2.0   0.0     8.0  940.0  500.0 100.00

# Ghi chú: await ~1 giây, wkB/s rất thấp, %util 100% — volume hết chỗ, ghi gần như thất bại/chờ.

# logback-spring.xml (cấu hình đang dùng)
<configuration>
  <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>/var/log/app/ledger.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
      <fileNamePattern>/var/log/app/ledger.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
      <maxFileSize>200MB</maxFileSize>
      <maxHistory>14</maxHistory>
    </rollingPolicy>
    <encoder>
      <pattern>%d{ISO8601} %-5level [%thread] %logger{36} - %msg%n</pattern>
    </encoder>
    <!-- immediateFlush mặc định true -->
  </appender>
  <root level="INFO">
    <appender-ref ref="FILE"/>
  </root>
  <!-- Lưu ý: KHÔNG có AsyncAppender bao bọc FILE -->
</configuration>`
    }
  ],
  questions: [
    'Vì sao ổ đĩa đầy/chậm lại làm TREO gần như toàn bộ API, dù CPU và DB đều rảnh? Dẫn chứng bằng thread dump (tên thread, lock id, số lượng).',
    'Giải thích cơ chế ghi log đồng bộ trong Logback: tại sao chỉ 1 thread giữ lock và 193 thread bị BLOCKED? Phân biệt "chờ I/O" (RUNNABLE/native) với "bị chặn bởi monitor" (BLOCKED).',
    'Đề xuất cách sửa ngắn hạn và dài hạn: dùng AsyncAppender thế nào (queueSize, discardingThreshold, neverBlock), xử lý đĩa đầy, và đánh đổi giữa "không làm chậm app" và "không mất log".'
  ],
  hints: [
    'Tìm monitor {{<0x0000000712c04a10>}} trong dump: thread nào có dòng {{- locked ...}} (đang giữ) và đang làm gì (stack có {{FileOutputStream.writeBytes}})? Những thread còn lại {{- waiting to lock ...}} đang ở trạng thái gì?',
    'Appender file của Logback dùng {{synchronized}} quanh thao tác ghi ({{subAppend}}) để bảo vệ stream. Khi ghi đĩa đồng bộ ({{immediateFlush=true}} mặc định), thread gọi {{log.info(...)}} phải tự ghi xuống đĩa xong mới thoát khỏi lock. Đĩa 100% + {{await ~1s}} => lock bị giữ rất lâu.',
    'Nhìn cấu hình: không có {{AsyncAppender}}. So sánh với lab ghi log khác: {{AsyncAppender}} tách "đưa log vào hàng đợi" (nhanh) khỏi "ghi đĩa" (chậm) bằng 1 worker riêng, nhưng phải cấu hình {{neverBlock=true}} và {{discardingThreshold}} để worker nghẽn không kéo sập app.'
  ],
  answer: `**Tóm tắt:** Log được cấu hình **ghi đồng bộ** ({{RollingFileAppender}} trực tiếp, không có {{AsyncAppender}}). Logback bảo vệ luồng ghi file bằng một monitor: tại mỗi thời điểm chỉ 1 thread được ghi. Thread {{http-nio-8080-exec-12}} đang giữ monitor {{<0x0000000712c04a10>}} của {{RollingFileAppender}} và bị kẹt trong {{FileOutputStream.writeBytes}} vì ổ đĩa {{/var/log/app}} đầy 100% ({{await ~1s}}, {{%util 100%}}). Trong lúc nó giữ lock, **193** thread Tomcat khác (gần như toàn bộ 200 thread phục vụ request) bị {{BLOCKED}} khi cố gọi {{log.info(...)}}. CPU/DB rảnh nhưng không còn thread rảnh để xử lý request, nên mọi API (kể cả health) treo. Dọn đĩa xong, lần ghi đang kẹt hoàn thành, lock được nhả, app tự hồi phục.

### Thuật ngữ nền (giải thích từ gốc)

- **Log / logging:** ứng dụng ghi lại sự kiện (ai gọi API nào, lỗi gì) để sau này điều tra. Ví dụ đời thường: sổ trực ca.
- **Appender (Logback):** thành phần nhận một dòng log và ghi ra nơi đích. {{RollingFileAppender}} ghi ra file và tự "xoay" file (tạo file mới) khi quá lớn/quá ngày.
- **Ghi đồng bộ (synchronous):** thread gọi {{log.info(...)}} phải **tự mình** ghi xong dòng đó xuống đĩa rồi mới chạy tiếp. Giống bạn phải tự đi nộp đơn, đứng chờ cán bộ đóng dấu xong mới về.
- **Monitor / {{synchronized}}:** "ổ khóa" của Java gắn với một object. Chỉ một thread giữ khóa tại một thời điểm; thread khác muốn vào vùng {{synchronized}} sẽ chuyển sang trạng thái {{BLOCKED}} (bị chặn), nằm chờ ngoài cửa, **không tốn CPU** nhưng cũng **không làm việc gì**.
- **{{AsyncAppender}}:** bộ đệm trung gian. Thread nghiệp vụ chỉ bỏ sự kiện log vào một **hàng đợi** trong bộ nhớ (rất nhanh) rồi đi tiếp; một thread worker riêng lấy từ hàng đợi ra và ghi đĩa. Ghi đĩa chậm chỉ làm worker nghẽn, không trực tiếp chặn thread nghiệp vụ — *nếu cấu hình đúng*.
- **I/O chờ (blocking I/O):** gọi hệ điều hành ghi/đọc mà dữ liệu chưa sẵn sàng (đĩa đầy/chậm) thì thread bị treo ở lời gọi native cho tới khi xong.

### Cơ chế: vì sao 1 thread nghẽn kéo sập 193 thread

Luồng ghi của {{RollingFileAppender}} (đơn giản hóa):
~~~java
// Logback OutputStreamAppender (minh họa cơ chế)
protected void subAppend(E event) {
    synchronized (this) {                 // (1) chỉ 1 thread vào được: lấy monitor của appender
        byte[] bytes = encoder.encode(event);
        writeBytes(bytes);                // (2) ghi ra OutputStream -> FileOutputStream
        if (immediateFlush) stream.flush();// (3) ép xuống đĩa NGAY (mặc định true)
    }                                     // (4) nhả monitor
}
~~~

Khi đĩa đầy/chậm:
1. {{exec-12}} vào vùng {{synchronized}}, lấy {{- locked <0x0000000712c04a10>}} (monitor của chính {{RollingFileAppender}}), gọi {{FileOutputStream.writeBytes}} (native). Kernel không ghi được (volume 100%, {{await ~1s}}) nên lời gọi native **kẹt**. Thread ở trạng thái {{RUNNABLE}} (đang chạy native) nhưng thực chất đứng chờ I/O — quan trọng: nó **vẫn đang giữ lock**.
2. Các thread khác ({{exec-41}}, {{exec-97}}, ...) gọi {{log.info}} → chạy tới {{subAppend}} → gặp {{synchronized (this)}} trên **cùng object {{0x0000000712c04a10}}** → không vào được → chuyển {{BLOCKED (on object monitor)}}, {{- waiting to lock <0x0000000712c04a10>}}.
3. Tomcat có 200 thread phục vụ request; 193 thread {{BLOCKED}} + 1 thread kẹt giữ lock + 6 thread idle = **gần như không còn thread nào xử lý request mới**. Request đến phải xếp hàng trong accept queue rồi timeout 504. {{/actuator/health}} cũng cần thread Tomcat và chính nó cũng ghi log → cũng bị ảnh hưởng.

Đây là kiểu sự cố "tài nguyên dùng chung trở thành điểm nghẽn đơn": mọi request đều đi qua logging, logging lại bị serialize bởi một lock + một đĩa.

### Dẫn chứng (khớp số liệu)

- Monitor duy nhất: {{<0x0000000712c04a10> (a ch.qos.logback.core.rolling.RollingFileAppender)}}. {{exec-12}} giữ ({{- locked}}) tại {{OutputStreamAppender.subAppend:238}}, đang {{RUNNABLE}} ở {{FileOutputStream.writeBytes}} (native) — đúng lúc ghi đĩa. {{exec-41}} ({{info}} tại {{LedgerController.postEntry:44}}) và {{exec-97}} ({{info}} tại {{LedgerController.getEntry:61}}) cùng {{BLOCKED}} {{- waiting to lock <0x0000000712c04a10>}} tại {{subAppend:238}}.
- Thống kê dump: 193 thread chờ lock, 1 giữ lock, 6 idle → khớp 200 thread Tomcat. Giữ lock qua 3 dump liên tiếp (09:19:10/20/30) → không phải thoáng qua.
- Đĩa: {{/dev/vdb}} 10G dùng 100%, {{Avail 0}}. {{iostat}} {{await ~940-1120ms}}, {{%util 100%}}, {{wkB/s}} chỉ 4-12KB → ghi gần như tắc nghẽn vì hết chỗ.
- Sức khỏe giả: CPU 6%, HikariCP {{active=2/20 pending=0}} → DB/CPU không phải nguyên nhân. Hồi phục sau khi dọn đĩa **không restart** → xác nhận không phải deadlock vĩnh viễn, mà là lock bị giữ quá lâu bởi I/O.
- Cấu hình: không có {{AsyncAppender}}, {{immediateFlush}} mặc định true → đường đi hoàn toàn đồng bộ.

### Cách sửa

**Ngắn hạn (khôi phục ngay):**
1. Dọn file log cũ/cấp thêm dung lượng cho {{/var/log/app}} (đã làm lúc 09:27, app tự hồi phục).
2. Kiểm tra {{maxHistory/totalSizeCap}} của {{RollingFileAppender}} để tự xóa log cũ; đặt alert disk usage (ví dụ > 80%).
3. Nếu phải giữ file appender tạm thời, cân nhắc {{immediateFlush=false}} để giảm số lần flush (đánh đổi: crash JVM có thể mất vài dòng cuối trong buffer).

**Dài hạn (thiết kế đúng):** tách "sinh log" khỏi "ghi đĩa" bằng {{AsyncAppender}}, và cấu hình để worker nghẽn **không chặn app**:

~~~xml
<appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
  <file>/var/log/app/ledger.log</file>
  <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
    <fileNamePattern>/var/log/app/ledger.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
    <maxFileSize>200MB</maxFileSize>
    <maxHistory>14</maxHistory>
    <totalSizeCap>3GB</totalSizeCap> <!-- chặn phình đĩa -->
  </rollingPolicy>
  <encoder><pattern>%d{ISO8601} %-5level [%thread] %logger - %msg%n</pattern></encoder>
</appender>

<appender name="ASYNC" class="ch.qos.logback.classic.AsyncAppender">
  <queueSize>8192</queueSize>          <!-- hàng đợi trong RAM, tăng để chịu burst -->
  <discardingThreshold>0</discardingThreshold> <!-- 0 = không tự bỏ INFO/WARN khi gần đầy -->
  <neverBlock>true</neverBlock>        <!-- QUAN TRỌNG: hàng đợi đầy thì BỎ log, KHÔNG chặn thread -->
  <appender-ref ref="FILE"/>
</appender>

<root level="INFO"><appender-ref ref="ASYNC"/></root>
~~~

> Lưu ý: trong cấu hình thật chỉ đặt **một** lần {{<neverBlock>true</neverBlock>}} (sau khi xóa dòng trùng nếu có). {{neverBlock=true}} nghĩa là khi hàng đợi đầy, {{AsyncAppender}} dùng {{offer()}} (không chờ) thay vì {{put()}} → thread nghiệp vụ đi tiếp, **chấp nhận mất log** trong giai đoạn nghẽn. Đây là đánh đổi có chủ đích.

**Đánh đổi (nói rõ khi thiết kế):**
| Lựa chọn | Khi đĩa chậm/đầy | Đánh đổi |
|---|---|---|
| Đồng bộ (hiện tại) | App treo, không mất log | Sập dịch vụ vì logging — tệ nhất |
| Async + {{neverBlock=false}} | Thread nghiệp vụ vẫn chặn khi queue đầy | Bảo toàn log nhưng vẫn có thể treo app |
| Async + {{neverBlock=true}}, {{discardingThreshold=0}} | Bỏ log mới nhất khi đầy, app sống | Mất dấu vết đúng lúc sự cố — cần metric giám sát |
| Async + {{neverBlock=true}} + {{discardingThreshold>0}} | Bỏ bớt TRACE/DEBUG/INFO khi gần đầy, giữ ERROR | Cân bằng, nhưng có thể mất INFO chẩn đoán |

Thực tế hay dùng: {{neverBlock=true}} (ưu tiên app sống), {{discardingThreshold=0}} (đừng âm thầm bỏ mức thấp nếu bạn cần), bật giám sát số event bị drop (Logback không tự expose; có thể wrap hoặc dùng Log4j2 có cơ chế tương tự {{DefaultAsyncQueueFullPolicy}}), và **ghi log ra stdout** để nền tảng (Fluent Bit / sidecar) ship đi — tách hẳn I/O đĩa cục bộ khỏi app.

### Bẫy hay gặp

- Tưởng "mình dùng Logback là an toàn" nhưng quên bọc {{AsyncAppender}}: mặc định Spring Boot ghi console; cấu hình file tùy chỉnh rất dễ bỏ qua async.
- Chỉ tăng {{queueSize}}: hết RAM trước khi hết vấn đề, và burst kéo dài vẫn đầy.
- Đặt {{neverBlock=true}} rồi không giám sát drop → mất đúng dòng log của sự cố.
- Nhìn dump thấy {{BLOCKED}} liền nghĩ "deadlock": deadlock cần **chu trình chờ** (A giữ lock X chờ Y, B giữ Y chờ X). Ở đây 193 thread đều chờ **cùng 1 lock** do 1 thread giữ — đó là **contention do I/O chậm**, không phải deadlock (sẽ hết khi I/O xong/đĩa trống).
- Chạy {{jstack}} mà chỉ thấy Tomcat thread, quên đếm "ai giữ lock": luôn tìm dòng {{- locked <...>}} tương ứng với {{- waiting to lock <...>}}.

> Senior tip: Coi logging là một **dependency** có thể hỏng, giống DB hay HTTP upstream. Nguyên tắc vận hành: (1) đường đi ghi log của request thread phải O(1) trong bộ nhớ (đưa vào queue) và không bao giờ chặn vô hạn, (2) luôn đặt {{totalSizeCap}} + alert disk, (3) {{neverBlock=true}} cho appender async và giám sát tỷ lệ drop, (4) ưu tiên log ra stdout + shipper. Trong phỏng vấn, nếu nêu được cả "AsyncAppender + neverBlock" lẫn đánh đổi mất log và cách giám sát drop, bạn đang trả lời ở mức senior.`,
  rubric: [
    'Xác định đúng thủ phạm: {{http-nio-8080-exec-12}} RUNNABLE tại {{FileOutputStream.writeBytes}} nhưng đang GIỮ monitor {{<0x0000000712c04a10>}} (RollingFileAppender) trong lúc đĩa {{/dev/vdb}} đầy 100% ({{df}} Avail 0, {{iostat}} await ~1s %util 100%). 193 thread Tomcat {{BLOCKED (on object monitor)}} {{waiting to lock <0x0000000712c04a10>}} tại {{OutputStreamAppender.subAppend:238}} khi gọi {{log.info}} từ controller/service.',
    'Giải thích đúng cơ chế: appender ghi đồng bộ dùng {{synchronized}} quanh {{subAppend}} + {{immediateFlush=true}} mặc định, nên thread log phải tự ghi đĩa; lock bị giữ xuyên suốt I/O chậm. Phân biệt thread giữ lock (RUNNABLE/native, vẫn giữ monitor) với thread chờ (BLOCKED). Nêu rõ đây là contention do I/O, không phải deadlock (không có chu trình chờ).',
    'Đề xuất AsyncAppender đúng cấu hình: {{queueSize}}, {{discardingThreshold}}, {{neverBlock=true}} (để worker/đĩa nghẽn không chặn app), kèm đánh đổi mất log; xử lý đĩa ({{totalSizeCap}}, {{maxHistory}}, alert, cân nhắc stdout+shipper). Có bước ngắn hạn (dọn đĩa/app tự hồi phục).'
  ],
  tags: ['logging', 'logback', 'synchronized', 'disk-full', 'asyncappender', 'contention', 'jstack']
},
{
  id: 'lab-thread-012',
  category: 'thread',
  title: 'Thread pool chết đứng vì task cha chờ task con trên cùng một pool cố định 8 thread',
  level: 'senior',
  scenario: `**Bối cảnh:** **PayVN Reconcile** (Java 21, Spring Boot 3.4) tổng hợp báo cáo đối soát cuối ngày. Mỗi báo cáo chia thành nhiều "mảnh" (partition) tính độc lập. Code dùng một {{ExecutorService}} cố định **8 thread** ({{Executors.newFixedThreadPool(8)}}) với hàng đợi {{LinkedBlockingQueue}} **không giới hạn** (đặc trưng của {{newFixedThreadPool}}). Với mỗi mảnh, một **task cha** được {{submit}} vào pool; bên trong task cha lại {{submit}} vài **task con** (tính từng phần) vào **cùng pool đó** rồi gọi {{future.get()}} để chờ kết quả.

**Thuật ngữ nền (đọc nhanh):** {{ExecutorService}} là "bể thread" — bạn nộp task ({{Runnable}}/{{Callable}}), bể dùng thread rảnh để chạy. {{submit()}} trả về một {{Future}} — tấm vé hẹn; {{future.get()}} **chặn** (block) thread hiện tại cho tới khi task tương ứng chạy xong và trả kết quả. Pool "cố định 8 thread" nghĩa là chỉ có đúng 8 công nhân, cùng lúc tối đa 8 task đang chạy; task dư xếp hàng trong hàng đợi.

**Triệu chứng:** Lúc **02:10 ngày 06/11/2026** (job đối soát chạy), throughput báo cáo rơi về 0 sau ~5 giây: **không báo cáo nào hoàn thành thêm**, job treo vô hạn. CPU pod **~1%** (gần như không làm gì), heap ổn định, DB {{active=3/30 pending=0}}, không exception, không OOM. Hàng đợi của pool phình to (metric đếm task chờ tăng liên tục) nhưng không task nào hoàn thành. Restart pod thì chạy lại được một đoạn rồi kẹt lại khi dữ liệu đủ lớn.

**Dữ liệu thu thập:** {{jcmd 1 Thread.print}} lúc 02:13:40, metric của pool (đo qua wrapper), và đoạn code {{ReconcileService}}.`,
  artifacts: [
    {
      name: 'jstack-reconcile-02-13.txt',
      lang: 'text',
      content: `2026-11-06 02:13:40
Full thread dump OpenJDK 64-Bit Server VM (21.0.4+7-LTS-151 mixed mode, sharing):

"reconcile-pool-1" #41 [4112] prio=5 os_prio=0 cpu=312.44ms elapsed=205.10s tid=0x00007f58ac11a000 nid=4112 waiting on condition  [0x00007f5865bfd000]
   java.lang.Thread.State: WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x0000000714a10028> (a java.util.concurrent.FutureTask)
        at java.util.concurrent.locks.LockSupport.park(java.base@21.0.4/LockSupport.java:221)
        at java.util.concurrent.FutureTask.awaitDone(java.base@21.0.4/FutureTask.java:500)
        at java.util.concurrent.FutureTask.get(java.base@21.0.4/FutureTask.java:190)
        at vn.pay.reconcile.ReconcileService.aggregatePartition(ReconcileService.java:72)
        at vn.pay.reconcile.ReconcileService.lambda$run$0(ReconcileService.java:48)
        at vn.pay.reconcile.ReconcileService$$Lambda/0x00007f5888142a00.call(Unknown Source)
        at java.util.concurrent.FutureTask.run(java.base@21.0.4/FutureTask.java:317)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1144)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@21.0.4/ThreadPoolExecutor.java:642)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

   Locked ownable synchronizers:
        - <0x00000007149f0018> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)

"reconcile-pool-2" #42 [4113] prio=5 os_prio=0 cpu=298.10ms elapsed=205.10s tid=0x00007f58ac11c000 nid=4113 waiting on condition  [0x00007f5865afc000]
   java.lang.Thread.State: WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x0000000714a10090> (a java.util.concurrent.FutureTask)
        at java.util.concurrent.locks.LockSupport.park(java.base@21.0.4/LockSupport.java:221)
        at java.util.concurrent.FutureTask.awaitDone(java.base@21.0.4/FutureTask.java:500)
        at java.util.concurrent.FutureTask.get(java.base@21.0.4/FutureTask.java:190)
        at vn.pay.reconcile.ReconcileService.aggregatePartition(ReconcileService.java:72)
        at vn.pay.reconcile.ReconcileService.lambda$run$0(ReconcileService.java:48)
        at vn.pay.reconcile.ReconcileService$$Lambda/0x00007f5888142a00.call(Unknown Source)
        at java.util.concurrent.FutureTask.run(java.base@21.0.4/FutureTask.java:317)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1144)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@21.0.4/ThreadPoolExecutor.java:642)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

   Locked ownable synchronizers:
        - <0x00000007149f00c0> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)

"reconcile-pool-3" #43 [4114] prio=5 os_prio=0 cpu=305.77ms elapsed=205.10s tid=0x00007f58ac11e000 nid=4114 waiting on condition  [0x00007f58659fb000]
   java.lang.Thread.State: WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@21.0.4/Native Method)
        - parking to wait for  <0x0000000714a100f8> (a java.util.concurrent.FutureTask)
        at java.util.concurrent.FutureTask.awaitDone(java.base@21.0.4/FutureTask.java:500)
        at java.util.concurrent.FutureTask.get(java.base@21.0.4/FutureTask.java:190)
        at vn.pay.reconcile.ReconcileService.aggregatePartition(ReconcileService.java:72)
        at vn.pay.reconcile.ReconcileService.lambda$run$0(ReconcileService.java:48)
        at java.util.concurrent.FutureTask.run(java.base@21.0.4/FutureTask.java:317)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1144)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@21.0.4/ThreadPoolExecutor.java:642)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

   Locked ownable synchronizers:
        - <0x00000007149f0168> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)

"reconcile-pool-4" #44 [4115] prio=5 os_prio=0 cpu=301.02ms elapsed=205.10s tid=0x00007f58ac120000 nid=4115 waiting on condition  [0x00007f58658fa000]
   java.lang.Thread.State: WAITING (parking)
        - parking to wait for  <0x0000000714a10160> (a java.util.concurrent.FutureTask)
        at java.util.concurrent.FutureTask.get(java.base@21.0.4/FutureTask.java:190)
        at vn.pay.reconcile.ReconcileService.aggregatePartition(ReconcileService.java:72)
        at vn.pay.reconcile.ReconcileService.lambda$run$0(ReconcileService.java:48)
        at java.util.concurrent.FutureTask.run(java.base@21.0.4/FutureTask.java:317)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1144)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

   Locked ownable synchronizers:
        - <0x00000007149f0210> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)

"reconcile-pool-5" #45 [4116] prio=5 os_prio=0 cpu=296.55ms elapsed=205.10s tid=0x00007f58ac122000 nid=4116 waiting on condition  [0x00007f58657f9000]
   java.lang.Thread.State: WAITING (parking)
        - parking to wait for  <0x0000000714a101c8> (a java.util.concurrent.FutureTask)
        at java.util.concurrent.FutureTask.get(java.base@21.0.4/FutureTask.java:190)
        at vn.pay.reconcile.ReconcileService.aggregatePartition(ReconcileService.java:72)
        at vn.pay.reconcile.ReconcileService.lambda$run$0(ReconcileService.java:48)
        at java.util.concurrent.FutureTask.run(java.base@21.0.4/FutureTask.java:317)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1144)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

   Locked ownable synchronizers:
        - <0x00000007149f02b8> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)

"reconcile-pool-6" #46 [4117] prio=5 os_prio=0 cpu=309.41ms elapsed=205.10s tid=0x00007f58ac124000 nid=4117 waiting on condition  [0x00007f58656f8000]
   java.lang.Thread.State: WAITING (parking)
        - parking to wait for  <0x0000000714a10230> (a java.util.concurrent.FutureTask)
        at java.util.concurrent.FutureTask.get(java.base@21.0.4/FutureTask.java:190)
        at vn.pay.reconcile.ReconcileService.aggregatePartition(ReconcileService.java:72)
        at vn.pay.reconcile.ReconcileService.lambda$run$0(ReconcileService.java:48)
        at java.util.concurrent.FutureTask.run(java.base@21.0.4/FutureTask.java:317)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1144)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

   Locked ownable synchronizers:
        - <0x00000007149f0360> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)

"reconcile-pool-7" #47 [4118] prio=5 os_prio=0 cpu=294.88ms elapsed=205.10s tid=0x00007f58ac126000 nid=4118 waiting on condition  [0x00007f58655f7000]
   java.lang.Thread.State: WAITING (parking)
        - parking to wait for  <0x0000000714a10298> (a java.util.concurrent.FutureTask)
        at java.util.concurrent.FutureTask.get(java.base@21.0.4/FutureTask.java:190)
        at vn.pay.reconcile.ReconcileService.aggregatePartition(ReconcileService.java:72)
        at vn.pay.reconcile.ReconcileService.lambda$run$0(ReconcileService.java:48)
        at java.util.concurrent.FutureTask.run(java.base@21.0.4/FutureTask.java:317)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1144)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

   Locked ownable synchronizers:
        - <0x00000007149f0408> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)

"reconcile-pool-8" #48 [4119] prio=5 os_prio=0 cpu=300.20ms elapsed=205.10s tid=0x00007f58ac128000 nid=4119 waiting on condition  [0x00007f58654f6000]
   java.lang.Thread.State: WAITING (parking)
        - parking to wait for  <0x0000000714a10300> (a java.util.concurrent.FutureTask)
        at java.util.concurrent.FutureTask.get(java.base@21.0.4/FutureTask.java:190)
        at vn.pay.reconcile.ReconcileService.aggregatePartition(ReconcileService.java:72)
        at vn.pay.reconcile.ReconcileService.lambda$run$0(ReconcileService.java:48)
        at java.util.concurrent.FutureTask.run(java.base@21.0.4/FutureTask.java:317)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@21.0.4/ThreadPoolExecutor.java:1144)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)

   Locked ownable synchronizers:
        - <0x00000007149f04b0> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)

"main" #1 [4097] prio=5 os_prio=0 cpu=1880.11ms elapsed=212.40s tid=0x00007f58ac028000 nid=4097 waiting on condition  [0x00007f58b33fe000]
   java.lang.Thread.State: WAITING (parking)
        - parking to wait for  <0x0000000714a0f010> (a java.util.concurrent.FutureTask)
        at java.util.concurrent.FutureTask.get(java.base@21.0.4/FutureTask.java:190)
        at vn.pay.reconcile.ReconcileJob.runNightly(ReconcileJob.java:33)

# Ghi chú: KHÔNG có dòng "Found one Java-level deadlock".
# reconcile-pool-1..8 là TẤT CẢ 8 thread của pool (pool core=max=8). Không thread nào đang
# chạy task con (computeChunk); mọi thread đều kẹt ở get() chờ task con.`
    },
    {
      name: 'pool-metrics-and-code.txt',
      lang: 'text',
      content: `# Metric wrapper quanh pool (đo tại 02:13:40)
reconcile.pool.size            = 8
reconcile.pool.activeCount     = 8        (cả 8 đang "bận")
reconcile.pool.queue.size      = 137      (task chờ trong LinkedBlockingQueue)
reconcile.pool.completedTask   = 0        (không task nào hoàn thành kể từ khi kẹt)
reconcile.pool.largestPoolSize = 8
# completedTask đứng yên; queue.size chỉ tăng (task cha/con mới được submit thêm trước khi kẹt lan)

# ReconcileService.java (trích, số dòng khớp dump)
public class ReconcileService {
    private final ExecutorService pool = Executors.newFixedThreadPool(8); // LinkedBlockingQueue unbounded

    public Report run(List<Partition> partitions) {
        List<Future<PartitionReport>> parents = new ArrayList<>();
        for (Partition p : partitions) {
            // (dòng 48) submit TASK CHA vào pool
            parents.add(pool.submit(() -> aggregatePartition(p)));
        }
        return merge(parents); // chờ từng future cha
    }

    PartitionReport aggregatePartition(Partition p) throws Exception {     // dòng 66
        List<Future<ChunkSum>> children = new ArrayList<>();
        for (Chunk c : p.chunks()) {
            // submit TASK CON vào CÙNG pool
            children.add(pool.submit(() -> computeChunk(c)));
        }
        long total = 0;
        for (Future<ChunkSum> f : children) {
            total += f.get().value();                                      // dòng 72: CHẶN chờ task con
        }
        return new PartitionReport(p.id(), total);
    }

    ChunkSum computeChunk(Chunk c) {
        // tính toán + vài truy vấn đọc DB (nhanh)
        return repo.sum(c);
    }
}`
    }
  ],
  questions: [
    'Giải thích vì sao cả 8 thread đều {{WAITING}} ở {{FutureTask.get}} và không thread nào chạy {{computeChunk}}. Tại sao hàng đợi có 137 task mà vẫn không tiến triển? Đây có phải deadlock theo nghĩa JVM báo "Found one Java-level deadlock" không?',
    'Mô tả điều kiện cần để lỗi này xảy ra (liên hệ kích thước pool, số task cha, việc task cha submit task con rồi {{get()}} trên cùng pool). Vì sao đôi khi chạy được một đoạn rồi mới kẹt?',
    'Đề xuất cách sửa an toàn: tách pool, dùng {{invokeAll}}, hoặc bỏ lồng nhau; nêu cách dùng {{get(timeout)}}/giới hạn hàng đợi để giảm blast radius. So sánh với {{ForkJoinPool}} + {{ManagedBlocker}} (gợi ý).'
  ],
  hints: [
    'Đếm thread {{reconcile-pool-*}}: đúng 8, trùng {{pool.size=8}} và đều dừng tại {{aggregatePartition(ReconcileService.java:72)}} → {{FutureTask.get}}. "Active" = 8, "completed" đứng yên. Vậy 8 "công nhân" đang làm gì? Họ có đang chạy {{computeChunk}} không, hay đang **ngồi chờ** kết quả của {{computeChunk}}?',
    'Task con ({{computeChunk}}) được {{submit}} vào **cùng pool** (cùng hàng đợi). Hàng đợi có 137 phần tử nhưng **không còn thread rảnh** để lấy task ra chạy, vì cả 8 thread đang bị {{get()}} chặn. Task con nằm trong hàng đợi → không ai chạy → {{get()}} không bao giờ trả về. Đây là **thread starvation deadlock** (kẹt do đói thread), khác deadlock monitor vòng tròn nên JVM **không** in "Found one Java-level deadlock".',
    'Điều kiện: số task cha đồng thời chiếm hết thread pool (= pool size) và mỗi cha chặn chờ con cũng cần thread của chính pool đó. Lúc đầu ít partition thì một số cha xong trước khi pool bão hòa; khi đủ nhiều partition đồng thời, 8 slot đều bị cha giữ → kẹt vĩnh viễn.'
  ],
  answer: `**Tóm tắt:** Đây là **thread starvation deadlock** (kẹt do đói thread / pool-induced deadlock): task **cha** ({{aggregatePartition}}, submit tại dòng 48) chiếm trọn 8 thread của pool và mỗi thread gọi {{FutureTask.get()}} (dòng 72) để chờ task **con** ({{computeChunk}}) — nhưng task con cũng được {{submit}} vào **chính pool 8 thread đó**. Khi cả 8 thread đều đang là task cha và đều đang {{get()}} chặn, **không còn thread nào rảnh** để lấy task con ra khỏi hàng đợi ({{queue.size=137}}). Task con không bao giờ chạy → {{get()}} không bao giờ trả về → 8 thread chờ mãi, {{completedTask}} đứng yên, CPU ~1%. JVM không báo "Found one Java-level deadlock" vì không có **chu trình giữ monitor/lock** kiểu cổ điển; đây là bế tắc tài nguyên (thread) do phụ thuộc ngược.

### Hình dung cơ chế (ví dụ đời thường)

Tưởng tượng một bếp có đúng **8 đầu bếp** (8 thread) và một hàng phiếu order (hàng đợi). Mỗi "món tổ hợp" (task cha) do 1 đầu bếp phụ trách: đầu bếp đó viết thêm 3 phiếu "món phụ" (task con) bỏ vào **cùng hàng phiếu**, rồi **đứng yên chờ** 3 món phụ xong mới ráp món tổ hợp ({{get()}}). Nếu lúc nào đó cả 8 đầu bếp đều đang làm món tổ hợp và đều đứng chờ món phụ, thì **không ai rảnh** để nấu món phụ — dù hàng phiếu món phụ đang đầy. Mọi người chờ nhau mãi. Không có ai cướp dao của ai (không có monitor deadlock), chỉ là hết người.

~~~seq
title: Pool 8 thread - cha chờ con trên cùng pool (kẹt)
actors: Cha1..Cha8(thread) | Queue | ConTasks
Cha1..Cha8(thread) -> Queue: submit computeChunk (task con)
Cha1..Cha8(thread) -> Cha1..Cha8(thread): FutureTask.get() BLOCK/WAITING chờ con xong
note Queue: 137 task con nằm chờ, KHÔNG có thread rảnh lấy ra
Queue -> Cha1..Cha8(thread): (không xảy ra) vì 0 thread rảnh
~~~

### Phân tích dump (đối chiếu số liệu)

- **8 thread, cả 8 cùng trạng thái:** {{reconcile-pool-1}}..{{reconcile-pool-8}} (đúng pool core=max=8, {{pool.size=8}}, {{activeCount=8}}) đều {{java.lang.Thread.State: WAITING (parking)}} tại {{FutureTask.get}} (dòng 190) ← {{aggregatePartition(ReconcileService.java:72)}} ← lambda {{run$0}} (dòng 48) ← {{FutureTask.run}} ← {{ThreadPoolExecutor.runWorker}}. Nghĩa là mỗi thread **đang thực thi một task cha** và đang {{get()}} chờ task con.
- **Đang chờ cái gì:** mỗi thread {{- parking to wait for <0x...> (a java.util.concurrent.FutureTask)}} — các địa chỉ FutureTask khác nhau ({{0x...0028, 0090, 00f8, 0160, 01c8, 0230, 0298, 0300}}) là các vé của từng task con. Không thread nào đang chạy {{computeChunk}}.
- **Hàng đợi đầy task mà không chạy:** {{queue.size=137}}, {{completedTask=0}} (đứng yên). Task con đã được submit (nằm trong {{LinkedBlockingQueue}}) nhưng {{ThreadPoolExecutor}} chỉ lấy task từ hàng đợi khi có worker vào vòng {{runWorker/getTask}} — mà cả 8 worker đang kẹt bên trong {{FutureTask.get}}, chưa quay lại vòng lấy task. Vì vậy hàng đợi có thể lớn vô hạn, tiến độ vẫn 0.
- **Không phải deadlock monitor:** dump ghi rõ "KHÔNG có dòng Found one Java-level deadlock". JVM chỉ phát hiện deadlock khi có chu trình chờ **monitor/ownable synchronizer** ({{synchronized}}, {{ReentrantLock}}). {{FutureTask.get()}} dùng {{LockSupport.park}} chờ kết quả task — không tạo chu trình monitor mà JVM nhận diện. Các {{Locked ownable synchronizers}} ({{ReentrantLock$NonfairSync}}) là lock nội bộ worker của {{ThreadPoolExecutor}}, không phải chu trình.
- **Sức khỏe giả:** CPU ~1% (thread {{parked}} không tốn CPU), DB rảnh, heap ổn, không exception — dễ bị chẩn đoán nhầm là "job chậm" hay "DB treo" nếu không nhìn jstack.

### Điều kiện xảy ra (vì sao chạy được đoạn rồi mới kẹt)

- **Điều kiện đủ:** (1) task cha chạy **trên** pool P và (2) bên trong cha {{submit}} task con vào **cùng** pool P rồi (3) {{get()/join()}} chờ con **không timeout**, trong khi (4) số task cha đồng thời đang chiếm giữ thread >= kích thước pool. Khi (4) đúng, mọi thread của P đều là cha đang chờ → không ai chạy con → kẹt vĩnh viễn.
- **Vì sao hồi phục rồi kẹt lại:** lúc đầu số partition nhỏ, một vài task cha chiếm < 8 thread hoặc xen kẽ hoàn thành (con có cơ hội chạy xen giữa lúc cha chưa {{get}} ngay lập tức), nên tiến triển. Khi batch lớn hơn (nhiều partition nộp gần nhau), 8 task cha kịp chiếm đủ 8 thread trước khi con hoàn thành → rơi vào trạng thái bão hòa không thoát. {{newFixedThreadPool}} dùng {{LinkedBlockingQueue}} **không giới hạn**, nên hàng đợi phình mãi (nguy cơ OOM) thay vì từ chối task.
- **Restart chỉ "chữa cháy":** trạng thái kẹt nằm trong cấu trúc phụ thuộc task tại thời điểm đó; dữ liệu lặp lại sẽ tái hiện.

### Cách sửa

**Nguyên tắc:** một task đang chạy trên pool P **không được** chặn chờ một task khác mà chính nó nộp vào **cùng** pool P có giới hạn. (Ngắt vòng phụ thuộc tài nguyên.)

**1) Tách pool (đơn giản, rõ ràng nhất):**
~~~java
// pool cha (điều phối) và pool con (tính toán) TÁCH BIỆT, đều có giới hạn
private final ExecutorService parentPool = Executors.newFixedThreadPool(4);
private final ExecutorService childPool  = Executors.newFixedThreadPool(8);

PartitionReport aggregatePartition(Partition p) throws Exception {
    List<Future<ChunkSum>> children = new ArrayList<>();
    for (Chunk c : p.chunks()) {
        children.add(childPool.submit(() -> computeChunk(c))); // con vào childPool
    }
    long total = 0;
    for (Future<ChunkSum> f : children) {
        total += f.get(30, TimeUnit.SECONDS).value(); // có timeout (xem dưới)
    }
    return new PartitionReport(p.id(), total);
}
~~~
Cha giữ thread của {{parentPool}} và chờ; con chạy trên {{childPool}} độc lập → con luôn có thread để chạy. Cần đặt tên thread, giới hạn hàng đợi, và chính sách từ chối ({{RejectedExecutionHandler}}) cho cả hai.

**2) Bỏ lồng nhau — để task cha tự tính con tuần tự, chỉ song song hóa ở một mức:**
~~~java
// Chỉ song song theo partition (1 mức). Bên trong partition tính tuần tự.
PartitionReport aggregatePartition(Partition p) {
    long total = 0;
    for (Chunk c : p.chunks()) total += computeChunk(c).value(); // không submit, không get
    return new PartitionReport(p.id(), total);
}
~~~
Mất song song mức chunk nhưng loại hẳn nguy cơ kẹt; thường đủ nhanh nếu chunk đã là đơn vị chia hợp lý. Đo trước khi phức tạp hóa.

**3) Dùng {{invokeAll}} / hoàn thành rồi mới tổng hợp (fork-join một pha):** submit toàn bộ task con cùng lúc, thu {{Future}} rồi {{get}} — nhưng **thực hiện từ một thread KHÔNG thuộc pool chạy con** (ví dụ thread gọi {{run}}), hoặc dùng {{invokeAll}} để chạy và chờ theo ngữ nghĩa của {{ExecutorService}}. Tránh pattern "thread của pool A submit vào A rồi tự chờ".

**4) {{ForkJoinPool}} + {{ManagedBlocker}} (nâng cao):** {{ForkJoinPool}} có cơ chế bù thread khi task báo sẽ block ({{ForkJoinPool.managedBlock}}), nên {{ForkJoinTask.join()}}/một số API có thể tránh đói trong cùng {{ForkJoinPool}}. Nhưng code phải dùng đúng {{ForkJoinTask}}/{{ManagedBlocker}}; {{Future.get()}} trên {{ExecutorService}} thường **không** được bù. Chỉ dùng khi team hiểu rõ.

**Giảm blast radius (nên làm thêm dù chọn cách nào):**
- **{{get(timeout, unit)}} thay vì {{get()}}:** kẹt/lỗi sẽ ném {{TimeoutException}} thay vì treo vĩnh viễn; bắt exception, hủy task ({{future.cancel(true)}}) và log + metric. Lưu ý {{cancel(true)}} chỉ interrupt — {{computeChunk}} phải tôn trọng interrupt.
- **Giới hạn hàng đợi:** thay {{newFixedThreadPool}} (unbounded) bằng {{new ThreadPoolExecutor(n,n,0,SECONDS,new ArrayBlockingQueue<>(M), handler)}} với {{RejectedExecutionHandler}} (fail fast / {{CallerRunsPolicy}} có kiểm soát). Hàng đợi vô hạn che giấu nghẽn và gây OOM.
- **Giám sát:** cảnh báo khi {{activeCount == poolSize}} kéo dài và {{completedTaskCount}} không tăng, hoặc {{queueSize}} vượt ngưỡng; export tên pool rõ ràng.

### So sánh nhanh

| Cách | Tránh kẹt? | Độ phức tạp | Ghi chú |
|---|---|---|---|
| Tách pool cha/con | Có | Thấp-vừa | Rõ, phải tune 2 pool |
| Bỏ lồng (1 mức song song) | Có | Thấp | Đơn giản, có thể chậm hơn |
| ForkJoinPool + ManagedBlocker | Có (đúng cách) | Cao | Dễ dùng sai, cần hiểu sâu |
| Giữ nguyên + chỉ thêm timeout | Không hết (vẫn đói), chỉ hết treo vô hạn | Thấp | Cứu blast radius, không phải fix gốc |

### Bẫy hay gặp

- Nghĩ "8 thread là nhiều" — kẹt phụ thuộc **cấu trúc phụ thuộc** (cha chờ con cùng pool), không phụ thuộc con số tuyệt đối; pool 100 thread cũng kẹt nếu 100 cha đều chờ con trên pool đó.
- Tăng {{nThreads}}: chỉ hoãn lúc kẹt (cần nhiều partition hơn để bão hòa), không sửa nguyên nhân.
- Dùng {{supplyAsync}}/{{CompletableFuture}} mặc định: cũng rơi vào {{ForkJoinPool.commonPool()}} dùng chung — cùng họ vấn đề.
- Nhầm với deadlock monitor: đi tìm "lock held" sẽ không thấy chu trình; phải nhìn {{FutureTask.get}} + "ai chạy task được {{get}} chờ".
- Bỏ quên {{get()}} không timeout trên đường chạy production: một lần kẹt = treo mãi.

> Senior tip: Mọi chỗ {{submit}} task A rồi trong A lại {{submit}}+{{get/join}} task B, hãy tự hỏi: "B có chạy trên **cùng** bể bị giới hạn với A không?". Nếu có, đó là bùng mìn. Quy tắc review: (1) không chặn chờ task con trên cùng {{ExecutorService}} bị giới hạn; (2) song song hóa **một mức** trừ khi có lý do đo đạc; (3) mọi {{Future.get}} trên luồng production phải có timeout; (4) pool phải có hàng đợi giới hạn + metric (active, queue, completed) + alert "completed đứng yên mà active==max". Vẽ sơ đồ phụ thuộc cha→con theo pool trước khi code thường rẻ hơn nhiều so với debug jstack lúc 2 giờ sáng.`,
  rubric: [
    'Chỉ ra cả 8 thread {{reconcile-pool-1..8}} đều {{WAITING}} tại {{FutureTask.get}} ({{aggregatePartition ReconcileService.java:72}} ← {{lambda run$0:48}}) chờ các {{FutureTask}} con; {{activeCount=8 == pool.size}}, {{completedTask=0}}, {{queue.size=137}} có task con nhưng không thread rảnh chạy {{computeChunk}}. Kết luận đúng: thread starvation / pool-induced deadlock, KHÔNG phải deadlock monitor vòng tròn nên JVM không in "Found one Java-level deadlock".',
    'Giải thích điều kiện: task cha chạy trên pool P submit task con vào cùng P rồi {{get()}} chặn; khi số cha đồng thời >= kích thước pool thì mọi thread P bị chiếm giữ chờ con → con không ai chạy. Nêu vì sao chạy được đoạn rồi kẹt (chưa bão hòa → bão hòa) và hàng đợi {{LinkedBlockingQueue}} unbounded phình/không cứu được.',
    'Đề xuất sửa gốc: tách pool cha/con hoặc bỏ lồng (song song 1 mức) hoặc cơ chế fork-join phù hợp ({{invokeAll}} từ thread ngoài, gợi ý {{ForkJoinPool+ManagedBlocker}}); kèm giảm blast radius: {{get(timeout)}}, giới hạn hàng đợi + {{RejectedExecutionHandler}}, metric/alert (completed đứng yên, active==max).'
  ],
  tags: ['thread-pool', 'futuretask', 'starvation-deadlock', 'executorservice', 'fixedthreadpool', 'jstack']
},
{
  id: 'lab-thread-013',
  category: 'thread',
  title: 'Virtual threads pinned by synchronized around JDBC calls (batch 5000 customers)',
  level: 'senior',
  scenario: `**Bối cảnh:** Batch xử lý 5000 khách hàng trên Spring Boot 3.4, Java 21, pod 8 vCPU. Mỗi khách cần một truy vấn SELECT tổng hợp (~50ms) qua JdbcTemplate. Code bọc lời gọi repository trong khối {{synchronized(customer)}} — mỗi khách một monitor riêng (theo thói quen bảo vệ state customer). Dùng {{Executors.newVirtualThreadPerTaskExecutor()}} để tận dụng virtual thread. Baseline platform thread ({{ExecutorService}} cố định 200 thread): wall-clock 1,3s, Hikari active max 198/200, CPU ~80%. Sau khi đổi sang virtual thread: wall-clock 31s (chậm gấp ~24 lần), Hikari active chỉ 8, CPU ~5%, không OOM, heap ổn định. {{jstack}} chỉ thấy 8 carrier thread {{ForkJoinPool-1-worker-*}}, mỗi cái {{Carrying virtual thread #N}} và đứng trong JDBC; {{jcmd Thread.dump_to_file}} cho thấy hàng nghìn virtual thread chưa mount được (đang chờ carrier). Bật {{jdk.tracePinnedThreads=full}} in ra nhiều dòng {{reason:MONITOR}} kèm {{<== monitors:1}} tại BatchService.java:44.`,
  artifacts: [
    {
      name: 'jstack-vt-batch-01.txt',
      lang: 'text',
      content: `2026-11-12 03:45:12
Full thread dump OpenJDK 64-Bit Server VM (21.0.5+11-LTS-151 mixed mode, sharing):

"ForkJoinPool-1-worker-1" #21 daemon prio=5 os_prio=0 cpu=8123.45ms elapsed=480.21s tid=0x00007f8a1c01a000 nid=0x1a2b runnable  [0x00007f8a0c1fd000]
   Carrying virtual thread #12
        at jdk.internal.misc.Unsafe.park(java.base@21.0.5/Native Method)
        at java.base/java.lang.VirtualThread.parkOnCarrierThread(java.base@21.0.5/VirtualThread.java:677)
        at java.base/sun.nio.ch.NioSocketImpl.park(java.base@21.0.5/NioSocketImpl.java:181)
        at java.base/sun.nio.ch.NioSocketImpl.implRead(java.base@21.0.5/NioSocketImpl.java:330)
        at java.base/java.net.SocketInputStream.socketRead0(java.base@21.0.5/Native Method)
        at com.example.batch.CustomerRepository.findById(CustomerRepository.java:18)
        at com.example.batch.BatchService.lambda$process$0(BatchService.java:44)
        at java.base/java.lang.VirtualThread.run(java.base@21.0.5/VirtualThread.java:309)

"ForkJoinPool-1-worker-2" #22 daemon prio=5 os_prio=0 cpu=7987.12ms elapsed=480.21s tid=0x00007f8a1c01c000 nid=0x1a2c runnable  [0x00007f8a0c0fc000]
   Carrying virtual thread #13
        ... (same stack, BatchService.java:44 -> CustomerRepository.findById -> JDBC socket read) ...

... (8 carrier threads, mỗi cái carrying một virtual thread; 4992 virtual thread còn lại unmounted, không xuất hiện trong jstack) ...
`
    },
    {
      name: 'trace-pinned-threads.log',
      lang: 'text',
      content: `Thread[#42,ForkJoinPool-1-worker-3,5,CarrierThreads] reason:MONITOR
    java.base/java.lang.VirtualThread$VThreadContinuation.onPinned(VirtualThread.java:183)
    java.base/jdk.internal.vm.Continuation.onPinned0(Continuation.java:393)
    java.base/java.lang.VirtualThread.parkOnCarrierThread(VirtualThread.java:677)
    java.base/sun.nio.ch.NioSocketImpl.park(NioSocketImpl.java:181)
    java.base/sun.nio.ch.NioSocketImpl.implRead(NioSocketImpl.java:330)
    java.base/java.net.SocketInputStream.socketRead0(SocketInputStream.java:83)
    com.example.batch.CustomerRepository.findById(CustomerRepository.java:18)
    com.example.batch.BatchService.lambda$process$0(BatchService.java:44) <== monitors:1
    java.base/java.lang.VirtualThread.run(VirtualThread.java:309)

Thread[#43,ForkJoinPool-1-worker-5,5,CarrierThreads] reason:MONITOR
    ... (same pattern; jdk.tracePinnedThreads lọc stack trùng theo vị trí) ...`
    }
  ],
  questions: [
    'Tại sao virtual threads bị chậm hơn platform threads khi bọc JDBC trong {{synchronized(customer)}}? Giải thích cơ chế pin carrier thread và vì sao nó triệt tiêu lợi ích của virtual thread.',
    'Dòng {{<== monitors:1}} trong log {{jdk.tracePinnedThreads=full}} và dòng {{Carrying virtual thread #N}} trong jstack chỉ ra điều gì? Làm sao xác định vị trí code gây pin chính xác từ artifact?',
    'So sánh hai cách sửa: (1) thay {{synchronized}} bằng {{ReentrantLock}} trên từng customer, (2) dùng {{Semaphore}} giới hạn concurrency bằng kích thước Hikari pool. Khi nào nên dùng cách nào? JEP 491 (JDK 24) thay đổi hành vi {{synchronized}} như thế nào?'
  ],
  hints: [
    'Virtual thread chạy trên carrier thread (ForkJoinPool worker). Khi vào {{synchronized(customer)}} rồi block trong JDBC, JVM pin carrier — carrier không unmount được virtual thread để chạy virtual thread khác. Mặc định chỉ có ~số CPU core carrier (8 vCPU → 8 carrier), nên concurrency giảm từ 200 xuống 8; 5000 task × 50ms / 8 ≈ 31s.',
    'Log {{jdk.tracePinnedThreads=full}} in {{reason:MONITOR}} và gắn {{<== monitors:1}} vào frame giữ monitor (BatchService.java:44). jstack không liệt kê virtual thread unmounted; nó chỉ hiện carrier qua dòng {{Carrying virtual thread #N}}. Dùng {{jcmd Thread.dump_to_file}} để thấy toàn bộ virtual thread. JDK 21-23 hỗ trợ flag này; JDK 24 gỡ bỏ (JEP 491).'
  ],
  answer: `**Tóm tắt:** {{synchronized(customer)}} pin carrier thread của virtual thread trong JDK 21-23 khi virtual thread block trong JDBC. Mặc định chỉ có ~8 carrier (8 vCPU), nên concurrency giảm từ 200 platform thread xuống 8 → throughput sụt từ 1,3s xuống 31s. Fix: dùng {{ReentrantLock}} trên từng customer (không pin) hoặc {{Semaphore}} giới hạn concurrency = Hikari pool size. JEP 491 (JDK 24) làm {{synchronized}} không còn pin (kể cả khi chờ monitor và {{Object.wait}}), nhưng vẫn serialize theo từng monitor; với lock per-customer thì không tranh chấp chéo.

### Nguyên nhân gốc

Virtual thread được thiết kế để unmount khỏi carrier thread khi blocking (I/O, sleep, park). Tuy nhiên, trong JDK 21-23, khi virtual thread **nắm monitor** của một khối {{synchronized}}, JVM pin nó vào carrier: carrier không thể unmount cho tới khi thoát khối. Nếu bên trong khối có blocking I/O (ở đây là JDBC socket read), carrier bị chiếm dụng suốt thời gian đó. Mặc định scheduler chỉ có số carrier xấp xỉ số CPU khả dụng (8 vCPU → 8 carrier), nên số task chạy đồng thời trong DB giảm từ 200 xuống 8. 5000 task × 50ms / 8 ≈ 31s; platform 200 thread: 5000 × 50ms / 200 ≈ 1,3s.

JDK 21-23 còn pin cả khi virtual thread **chờ vào** monitor (blocking to acquire) và khi {{Object.wait()}}. Chỉ {{synchronized}} (native monitor) gây pin; {{ReentrantLock}}, {{Semaphore}}, {{CountDownLatch}}... là Java thuần → không pin. Native frame/JNI cũng pin.

### Dẫn chứng (trích artifact)

**jstack (jstack-vt-batch-01.txt):**
- jstack chỉ liệt kê platform thread; virtual thread unmounted không xuất hiện. Ở đây thấy 8 carrier {{ForkJoinPool-1-worker-*}}, mỗi cái có dòng {{Carrying virtual thread #N}} và stack dừng tại {{BatchService.java:44}} → {{CustomerRepository.findById}} → JDBC socket read.
- Các carrier đều {{runnable}} và {{cpu}} tăng đều; đây là dấu hiệu carrier bị chiếm dụng, không phải virtual thread chạy song song.

**trace-pinned-threads.log ({{jdk.tracePinnedThreads=full}}):**
- Dòng đầu: {{Thread[#42,ForkJoinPool-1-worker-3,5,CarrierThreads] reason:MONITOR}}.
- Frame {{com.example.batch.BatchService.lambda$process$0(BatchService.java:44) <== monitors:1}} chỉ đúng vị trí {{monitorenter}} — khối {{synchronized(customer)}} bọc {{repo.findById}}.
- Dùng {{jcmd <pid> Thread.dump_to_file -format=text}} để thấy hàng nghìn virtual thread chưa mount được (đang chờ carrier).

### Cách sửa

**Cách 1: {{ReentrantLock}} trên từng customer (không pin)**
~~~java
private final ConcurrentHashMap<Long, Lock> locks = new ConcurrentHashMap<>();

public Customer process(Long id) {
    Lock lock = locks.computeIfAbsent(id, k -> new ReentrantLock());
    lock.lock();
    try {
        return repo.findById(id); // blocking I/O, virtual thread unmount bình thường
    } finally {
        lock.unlock();
    }
}
~~~
{{ReentrantLock}} dùng AQS Java → virtual thread unmount khi park; carrier tự do chạy virtual thread khác. Lưu ý: lock phải **per-customer**, không phải một lock toàn cục — lock toàn cục vẫn serialize mọi task (dù không pin).

**Cách 2: {{Semaphore}} giới hạn concurrency = Hikari pool size**
~~~java
private final Semaphore dbPermits = new Semaphore(20); // = Hikari maximumPoolSize

public Customer process(Long id) {
    dbPermits.acquire();
    try {
        return repo.findById(id);
    } finally {
        dbPermits.release();
    }
}
~~~
{{Semaphore}} cũng không pin. Lợi ích: giới hạn đúng số connection, tránh bão hòa pool và timeout lấy connection.

**Cách 3 (JDK 24+): JEP 491**
Từ JDK 24, JVM theo dõi monitor theo virtual thread, nên {{synchronized}} không còn pin khi block trong khối, khi chờ monitor, hay {{Object.wait()}}. {{synchronized}} vẫn serialize **theo từng monitor**, nhưng với lock per-customer thì các task khác customer không bị chặn. {{jdk.tracePinnedThreads}} bị gỡ bỏ (đặt cũng không có tác dụng); JFR event {{jdk.VirtualThreadPinned}} vẫn còn cho native/JNI. Nếu giữ {{synchronized}} bọc I/O, vẫn nên giới hạn concurrency DB bằng {{Semaphore}}.

### Phòng ngừa

- **Code review rule:** Báo đỏ mọi {{synchronized}} bọc I/O (DB, HTTP, file) trong code dùng virtual thread; thay bằng {{ReentrantLock}}/{{Semaphore}} hoặc thu hẹp critical section.
- **Test pinning:** JDK 21-23 dùng {{jdk.tracePinnedThreads=short}}; JDK 24+ dùng JFR event {{jdk.VirtualThreadPinned}}. Alert nếu có pin trong workload production-like.
- **Giám sát:** Carrier utilization; nếu carrier 100% busy mà virtual thread queue lớn → nghi pin. Dùng {{jcmd Thread.dump_to_file}} (jstack không thấy virtual thread unmounted).
- **HikariCP sizing:** connections = ((core_count * 2) + effective_spindle_count) tính theo **DB server**, không phải app; virtual thread không thay thế connection pool.
- **Nâng cấp JDK:** JDK 24 bỏ pin cho {{synchronized}}, nhưng vẫn cần giới hạn concurrency xuống tài nguyên hữu hạn.

> Senior tip: Virtual thread không phải "bùa phép" — nó chỉ unmount khi blocking. Trong JDK 21-23, {{synchronized}} bọc I/O là bẫy pin kinh điển: carrier (vài CPU core) bị chiếm dụng, throughput tụt về mức "số carrier". Nguyên tắc: không giữ monitor qua I/O; dùng {{ReentrantLock}}/{{Semaphore}}; giới hạn concurrency xuống DB bằng {{Semaphore}}. Và nhớ jstack không thấy virtual thread unmounted — dùng {{jcmd Thread.dump_to_file}}.`,
  rubric: [
    'Chỉ ra {{synchronized(customer)}} pin carrier thread (JDK 21-23) khi virtual thread block trong JDBC; carrier không unmount được, nên concurrency giảm từ 200 xuống ~8 (số CPU core), throughput sụt từ 1,3s xuống 31s.',
    'Trích dẫn artifact: jstack có 8 carrier {{ForkJoinPool-1-worker-*}} với {{Carrying virtual thread #N}} và stack tại {{BatchService.java:44}}; trace log có {{reason:MONITOR}} và {{<== monitors:1}} tại dòng 44. Giải thích jstack không thấy virtual thread unmounted, phải dùng {{jcmd Thread.dump_to_file}}.',
    'Đề xuất sửa đúng: {{ReentrantLock}} per-customer hoặc {{Semaphore}} = Hikari pool size, giải thích VÌ SAO không pin (Java thuần). Nêu JEP 491 (JDK 24) bỏ pin cho {{synchronized}} (kể cả chờ monitor, Object.wait) nhưng vẫn serialize theo monitor; {{jdk.tracePinnedThreads}} bị gỡ bỏ.'
  ],
  tags: ['virtual-thread', 'pinning', 'jdbc', 'synchronized', 'jdk-21', 'jep-491', 'reentrantlock', 'semaphore', 'hikaricp']
},
{
  id: 'lab-thread-014',
  category: 'thread',
  title: 'CPU 100% do cờ không volatile trong busy-wait loop (Java 17)',
  level: 'senior',
   scenario: `**Bối cảnh:** Dịch vụ thanh toán Java 17 (Spring Boot 3.2) chạy trên Kubernetes pod 2 vCPU. Một luồng nền (background worker) poll trạng thái từ biến {{boolean shutdown = false}} để dừng vòng lặp xử lý. Lúc 14:22, CPU pod tăng lên ~100% (1/2 core), latency API tăng từ 15ms lên 2s, không GC spike, heap ổn định. {{top -H}} chỉ ra một thread Java (TID 4112) chiếm ~100% CPU. {{jstack}} khớp nid=0x1010 (hex của 4112) dừng tại vòng lặp:
~~~java
while (!shutdown) {
    // busy wait
}
~~~
Biến {{shutdown}} KHÔNG có {{volatile}}. JIT tối ưu hoisting read ra khỏi vòng lặp → thread quay vòng vô hạn đọc giá trị cached (false) trong register, không thấy HTTP handler set {{shutdown = true}}. Fix: thêm {{volatile}} hoặc dùng {{AtomicBoolean}}.
Ngoài ra, code dùng {{HashMap}} chung giữa các thread (không đồng bộ) để cache metadata — rủi ro mất update, entry biến mất, size sai khi resize đồng thời (JDK 7 có thể tạo vòng lặp vô hạn, JDK 8+ không còn vòng lặp nhưng vẫn hỏng dữ liệu).`,
  artifacts: [
    {
      name: 'top-H-output.txt',
      lang: 'text',
      content: `PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
4112 root      20   0  452312  12456   3212 R  99.7   1.5   5:21.45 java
4113 root      20   0  452312  12456   3212 S   0.3   1.5   0:00.12 java
4114 root      20   0  452312  12456   3212 S   0.1   1.5   0:00.08 java
4115 root      20   0  452312  12456   3212 S   0.0   1.5   0:00.05 java
`
    },
    {
      name: 'jstack-cpu-100.txt',
      lang: 'text',
      content: `2026-11-13 14:25:10
Full thread dump OpenJDK 64-Bit Server VM (17.0.12+7-LTS-151 mixed mode, sharing):

"payment-worker-1" #21 prio=5 os_prio=0 cpu=321450.00ms elapsed=321.45s tid=0x00007f5a1c001000 nid=0x1010 runnable  [0x00007f5a0c1fd000]
   java.lang.Thread.State: RUNNABLE
        at com.example.payment.PaymentWorker.run(PaymentWorker.java:12)
        at java.lang.Thread.run(java.base@17.0.12/Thread.java:833)

   Locked ownable synchronizers:
        - None

"http-nio-8080-exec-1" #25 prio=5 os_prio=0 cpu=12.34ms elapsed=310.12s tid=0x00007f5a1c002000 nid=0x1014 waiting on condition  [0x00007f5a0c0fc000]
   java.lang.Thread.State: WAITING (parking)
        at jdk.internal.misc.Unsafe.park(java.base@17.0.12/Native Method)
        - parking to wait for  <0x000000076a1b0010> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
        at java.util.concurrent.locks.LockSupport.park(java.base@17.0.12/LockSupport.java:221)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.await(java.base@17.0.12/AbstractQueuedSynchronizer.java:2153)
        at java.util.concurrent.LinkedBlockingQueue.take(java.base@17.0.12/LinkedBlockingQueue.java:443)
        at java.util.concurrent.ThreadPoolExecutor.getTask(java.base@17.0.12/ThreadPoolExecutor.java:1087)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(java.base@17.0.12/ThreadPoolExecutor.java:1144)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(java.base@17.0.12/ThreadPoolExecutor.java:642)
        at java.lang.Thread.run(java.base@17.0.12/Thread.java:833)

   Locked ownable synchronizers:
        - None

... (other threads normal) ...
`
    },
    {
      name: 'PaymentWorker.java',
      lang: 'java',
      content: `package com.example.payment;

import java.util.HashMap;
import java.util.Map;

public class PaymentWorker implements Runnable {
    private boolean shutdown = false; // NOT volatile
    private final Map<String, String> metadataCache = new HashMap<>(); // shared, unsynchronized

    @Override
    public void run() {
        while (!shutdown) {
            // busy-wait: no sleep, no park, no yield
        }
        metadataCache.clear();
    }

    public void requestShutdown() {
        shutdown = true;
    }

    public void putMetadata(String key, String value) {
        metadataCache.put(key, value);
    }

    public String getMetadata(String key) {
        return metadataCache.get(key);
    }
}
`
    }
  ],
  questions: [
    'Tại sao thread payment-worker-1 tiêu thụ 100% CPU? Giải thích cơ chế JIT hoisting read của biến không volatile ra khỏi vòng lặp.',
    'Làm sao để đổi TID từ {{top -H}} (thập phân 4112) sang nid trong {{jstack}} (hex 0x1010)? Khi nào nid in thập phân thay vì hex (JDK version)?',
    'Biến {{metadataCache}} ({{HashMap}} dùng chung không đồng bộ) gây rủi ro gì trên Java 17? So sánh với JDK 7 (vòng lặp vô hạn khi resize) và nêu cách sửa an toàn.'
  ],
  hints: [
    'Biến {{shutdown}} không {{volatile}}. JIT (C2) biên dịch vòng lặp {{while (!shutdown)}}, thấy {{shutdown}} không thay đổi trong phương thức → hoist read ra khỏi loop (cache vào register). Thread chạy {{while (cachedFalse)}} vô hạn, không bao giờ thấy {{shutdown = true}} từ thread khác. CPU 100% vì vòng lặp rỗng chạy liên tục.',
    '{{top -H}} ra TID thập phân (4112). Chuyển hex: 4112 = 0x1010. JDK 17 in nid hex (0x1010). JDK 18+ in nid thập phân. Khớp nid trong jstack: {{nid=0x1010}} chính là thread payment-worker-1.'
  ],
  answer: `**Tóm tắt:** Biến {{shutdown}} thiếu {{volatile}} khiến JIT hoist read ra khỏi vòng lặp {{while (!shutdown)}} → thread quay vòng vô hạn (busy-wait) tiêu thụ 100% CPU. {{top -H}} TID 4112 → hex 0x1010 khớp {{nid=0x1010}} trong jstack (JDK 17 in hex). Fix: thêm {{volatile}} hoặc dùng {{AtomicBoolean}}. Bên cạnh đó, {{HashMap}} dùng chung không đồng bộ rủi ro mất update, entry biến mất, size sai khi resize đồng thời (JDK 7 có thể vòng lặp vô hạn; JDK 8+ không còn vòng lặp nhưng vẫn hỏng dữ liệu) → dùng {{ConcurrentHashMap}} hoặc immutable snapshot.

### Nguyên nhân gốc

**1. Busy-wait do thiếu {{volatile}} (root cause CPU 100%):**
Trong Java Memory Model, viết/đọc biến non-volatile không có *happens-before* giữa các thread. JIT compiler (C2) khi biên dịch nóng (tiered compilation) thấy vòng lặp {{while (!shutdown)}} mà biến {{shutdown}} không bị ghi trong phương thức {{run()}} → tối ưu: đọc {{shutdown}} **một lần** vào register, sau đó vòng lặp kiểm tra giá trị cached đó. Thread khác (HTTP handler) gọi {{requestShutdown()}} ghi {{shutdown = true}} vào main memory, nhưng worker thread vẫn đọc register cũ (false) → vòng lặp không bao giờ thoát → CPU 100% (runnable, không park, không yield).

Đây là hành vi **đúng chuẩn JMM** — không phải bug JVM. {{volatile}} tạo *happens-before*: write volatile {{happens-before}} read volatile sau đó. {{AtomicBoolean}} dùng {{VarHandle}}/{{Unsafe}} có semantics tương tự.

**2. {{HashMap}} dùng chung không đồng bộ (rủi ro phụ):**
{{metadataCache}} là {{HashMap}} truy cập từ nhiều thread ({{putMetadata}}, {{getMetadata}}, {{clear}} trong {{run()}}). JDK 7 resize có thể tạo vòng lặp {{Entry.next}} khi hai thread cùng resize → {{get}} lặp vô hạn. JDK 8+ resize giữ thứ tự, không còn vòng lặp đó, nhưng race vẫn gây:
- Mất update: ghi đè bucket, size sai.
- Entry biến mất / dữ liệu không nhất quán (key tìm không thấy dù đã put).
Không gây CPU 100% nhưng gây logic error production.

### Dẫn chứng (trích artifact)

**top-H-output.txt:**
- Dòng 2: {{4112 ... R 99.7% ... java}}. TID 4112 là thread nóng nhất; các thread khác ~0%.

**jstack-cpu-100.txt:**
- Thread {{"payment-worker-1" #21 ... nid=0x1010 runnable}} tại {{PaymentWorker.run(PaymentWorker.java:12)}} — dòng 12 là:
~~~java
while (!shutdown) {
    // busy wait
}
~~~
- {{cpu=321450.00ms}} ≈ {{elapsed=321.45s}} → thread dùng gần 100% CPU liên tục.
- Chuyển đổi: 4112 (dec) = 0x1010 (hex). **Khớp chính xác**.
- Lưu ý: JDK 17 in nid **hex** (0x1010). JDK 18+ in **thập phân** (4112). Xác nhận JVM 17.0.12.

**PaymentWorker.java (source):**
- Dòng 7: {{private boolean shutdown = false;}} — **không volatile**.
- Dòng 12:
~~~java
while (!shutdown) {
    // busy-wait
}
~~~
— busy-wait không {{Thread.sleep}}, không {{LockSupport.park}}.
- Dòng 19: {{shutdown = true;}} — write từ thread khác (không synchronized/volatile).
- Dòng 8: {{private final Map<String, String> metadataCache = new HashMap<>();}} — dùng chung, không đồng bộ.

### Cách sửa

**Fix 1 (root cause): Thêm {{volatile}} cho cờ dừng**
~~~java
private volatile boolean shutdown = false;
~~~
Hoặc dùng {{AtomicBoolean}} (khuyên dùng cho code mới, API rõ ràng):
~~~java
private final AtomicBoolean shutdown = new AtomicBoolean(false);
// trong run: while (!shutdown.get()) { ... }
// requestShutdown: shutdown.set(true);
~~~
{{volatile}}/{{AtomicBoolean}} đảm bảo write {{happens-before}} read → worker thấy giá trị mới và thoát loop. CPU giảm từ 100% xuống ~0% khi idle.

**Fix 2 (phòng ngừa HashMap): Thay {{HashMap}} bằng {{ConcurrentHashMap}}**
~~~java
private final Map<String, String> metadataCache = new ConcurrentHashMap<>();
~~~
{{ConcurrentHashMap}} thread-safe cho read/write đồng thời, không resize race, performance tốt (segment-free từ JDK 8). Không cần {{synchronized}}.

**Fix 3 (tốt hơn): Immutable snapshot / copy-on-write** nếu read nhiều, write ít:
~~~java
private final AtomicReference<Map<String, String>> metadataCache = new AtomicReference<>(Map.of());
// put: metadataCache.updateAndGet(m -> { var n = new HashMap<>(m); n.put(k,v); return n; });
// get: metadataCache.get().get(key);
~~~
Loại bỏ hoàn toàn contention. Phù hợp metadata thay đổi hiếm.

**Không khuyên: {{Collections.synchronizedMap}}** — lock toàn bộ map, throughput kém, dễ deadlock nếu lồng gọi.

### Phòng ngừa

- **Code review rule:** Báo đỏ mọi vòng lặp kiểm tra cờ ({{while (!flag)}}/{{for(;!flag;)}}) mà cờ **không volatile/Atomic**. Yêu cầu {{volatile}} hoặc {{AtomicBoolean}}/{{AtomicInteger}}.
- **Không dùng busy-wait thuần túy** — thay bằng {{LockSupport.parkNanos}}, {{Condition.await}}, {{CountDownLatch}}, {{CompletableFuture}}, hoặc {{Thread.sleep}} có timeout. Busy-wait chỉ chấp nhận được trong micro-benchmark / spin-lock cực ngắn (nano giây) với {{Thread.onSpinWait()}}.
- **Thread-safe collections:** Mặc định dùng {{ConcurrentHashMap}}, {{CopyOnWriteArrayList}}, {{ConcurrentLinkedQueue}}. Chỉ dùng {{HashMap}}/{{ArrayList}} khi **chắc chắn** single-thread hoặc guarded by lock.
- **Giám sát:** Alert khi có thread {{RUNNABLE}} CPU > 90% kéo dài > 30s (không GC, không I/O). Dùng {{jcmd <pid> Thread.print}} hoặc {{jstack}} map TID→nid.
- **JDK version awareness:** JDK 17 nid hex, JDK 18+ nid decimal. Luôn verify version trước khi convert TID→nid.

> Senior tip: "CPU 100% mà không GC, không I/O, không exception" gần như chắc chắn là **busy-wait non-volatile** hoặc **spin-lock sai**. Quy trình 30 giây: {{top -H}} lấy TID nóng → đổi hex → {{jstack}} tìm nid → đọc source tại dòng stack. Nếu thấy {{while (!flag)}} không volatile → fix ngay {{volatile}}/{{AtomicBoolean}}. Đừng đoán lung tung — đây là pattern nhận diện ngay. Và nhớ: {{HashMap}} race không gây CPU 100% (JDK 8+), nhưng vẫn hỏng dữ liệu — dùng {{ConcurrentHashMap}} là "mặc định an toàn".`,
  rubric: [
    'Chỉ ra biến {{shutdown}} thiếu {{volatile}} khiến JIT hoist read ra khỏi vòng lặp → busy-wait 100% CPU. Giải thích đúng JMM: write non-volatile không happens-before read, JIT cache vào register.',
    'Trích dẫn artifact: top-H TID 4112 → hex 0x1010 khớp jstack nid=0x1010 tại PaymentWorker.java:12 (while loop). Giải thích chuyển đổi hex/dec và lưu ý JDK 17 in hex, JDK 18+ in dec.',
    'Nêu rủi ro {{HashMap}} dùng chung (mất update, entry biến mất, size sai), phân biệt JDK 7 (vòng lặp vô hạn khi resize) vs JDK 8+ (không vòng lặp nhưng vẫn hỏng). Đề xuất {{ConcurrentHashMap}} hoặc immutable snapshot. Có đề cập không dùng busy-wait thuần, nên dùng park/await/latch.'
  ],
  tags: ['volatile', 'jit-hoisting', 'busy-wait', 'cpu-100', 'jmm', 'hashmap', 'concurrenthashmap', 'jstack', 'top', 'nid', 'java-17']
},
{
  id: 'lab-thread-015',
  category: 'thread',
  title: 'Deadlock hai service method khóa account ngược chiều: A→B và B→A cùng lúc',
  level: 'senior',
  scenario: `**Bối cảnh:** **PayVN Ledger** (Spring Boot 3.4, Java 21, PostgreSQL 15, HikariCP) cung cấp API chuyển tiền nội bộ {{POST /api/transfer}}. Service dùng **database row lock** ({{SELECT ... FOR UPDATE}}) để bảo vệ số dư ví thay vì khóa trong bộ nhớ. Mỗi request mở transaction, khóa từng hàng {{wallet}} lần lượt theo thứ tự tham số truyền vào (khóa ví nguồn rồi đến ví đích), cập nhật số dư, rồi commit.
 
**Triệu chứng:** Lúc **14:30 ngày 28/10/2026**, hai batch đối soát chạy song song: batch thu hộ (chuyển W1001 → W2001) và batch hoàn tiền (chuyển W2001 → W1001). Từ **14:30:05** cả hai batch treo: các request {{/api/transfer}} trả **HTTP 504 sau 30 giây** (Tomcat {{connection-timeout}}). CPU pod ~8%, DB CPU ~5%, không deadlock ở tầng ứng dụng (jstack ứng dụng không có thread BLOCKED), nhưng PostgreSQL báo **deadlock detected** trong log: {{ERROR: deadlock detected - Process 12345 waits for ShareLock on transaction 67890; blocked by process 67890}}. Restart pod không giải quyết vì batch tự chạy lại.
 
**Dữ liệu thu thập:** {{jcmd 1 Thread.print -l}} trên pod ứng dụng lúc 14:30:12, log PostgreSQL ({{postgresql-2026-10-28.log}}), và đoạn code {{TransferService}}.`,
  artifacts: [
    {
      name: 'jstack-transfer-deadlock.txt',
      lang: 'text',
      content: `2026-10-28 14:30:12
Full thread dump OpenJDK 64-Bit Server VM (21.0.4+7-LTS-151 mixed mode, sharing):
 
"http-nio-8080-exec-12" #41 [22451] prio=5 os_prio=0 cpu=120.44ms elapsed=412.10s tid=0x00007f8b1c01a000 nid=22451 runnable  [0x00007f8b0c1fd000]
   java.lang.Thread.State: RUNNABLE
        at java.net.SocketInputStream.socketRead0(java.base@21.0.4/Native Method)
        at java.net.SocketInputStream.socketRead(SocketInputStream.java:115)
        at java.net.SocketInputStream.read(SocketInputStream.java:168)
        at java.net.SocketInputStream.read(SocketInputStream.java:137)
        at org.postgresql.core.VisibleBufferedInputStream.readMore(VisibleBufferedInputStream.java:161)
        at org.postgresql.core.VisibleBufferedInputStream.ensureBytes(VisibleBufferedInputStream.java:128)
        at org.postgresql.core.VisibleBufferedInputStream.read(VisibleBufferedInputStream.java:73)
        at org.postgresql.core.PGStream.receiveChar(PGStream.java:467)
        at org.postgresql.core.v3.QueryExecutorImpl.processResults(QueryExecutorImpl.java:2155)
        at org.postgresql.core.v3.QueryExecutorImpl.execute(QueryExecutorImpl.java:372)
        at org.postgresql.jdbc.PgPreparedStatement.executeUpdate(PgPreparedStatement.java:198)
        at com.zaxxer.hikari.pool.ProxyPreparedStatement.executeUpdate(ProxyPreparedStatement.java:61)
        at com.zaxxer.hikari.pool.HikariProxyPreparedStatement.executeUpdate(HikariProxyPreparedStatement.java)
        at vn.pay.ledger.TransferService.doTransfer(TransferService.java:68)
        - locked <0x00000007a1b2c3d0> (a vn.pay.ledger.TransferService)
        at vn.pay.ledger.TransferService.transfer(TransferService.java:44)
        at vn.pay.ledger.TransferController.transfer(TransferController.java:28)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)
        at org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1089)
        at org.apache.tomcat.util.threads.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:1190)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)
 
   Locked ownable synchronizers:
        - <0x00000007a1b2c3d0> (a vn.pay.ledger.TransferService)
 
"http-nio-8080-exec-15" #44 [22454] prio=5 os_prio=0 cpu=118.90ms elapsed=412.08s tid=0x00007f8b1c01c000 nid=22454 runnable  [0x00007f8b0c0fc000]
   java.lang.Thread.State: RUNNABLE
        at java.net.SocketInputStream.socketRead0(java.base@21.0.4/Native Method)
        at java.net.SocketInputStream.socketRead(SocketInputStream.java:115)
        at java.net.SocketInputStream.read(SocketInputStream.java:168)
        at java.net.SocketInputStream.read(SocketInputStream.java:137)
        at org.postgresql.core.VisibleBufferedInputStream.readMore(VisibleBufferedInputStream.java:161)
        at org.postgresql.core.VisibleBufferedInputStream.ensureBytes(VisibleBufferedInputStream.java:128)
        at org.postgresql.core.VisibleBufferedInputStream.read(VisibleBufferedInputStream.java:73)
        at org.postgresql.core.PGStream.receiveChar(PGStream.java:467)
        at org.postgresql.core.v3.QueryExecutorImpl.processResults(QueryExecutorImpl.java:2155)
        at org.postgresql.core.v3.QueryExecutorImpl.execute(QueryExecutorImpl.java:372)
        at org.postgresql.jdbc.PgPreparedStatement.executeUpdate(PgPreparedStatement.java:198)
        at com.zaxxer.hikari.pool.ProxyPreparedStatement.executeUpdate(ProxyPreparedStatement.java:61)
        at com.zaxxer.hikari.pool.HikariProxyPreparedStatement.executeUpdate(HikariProxyPreparedStatement.java)
        at vn.pay.ledger.TransferService.doTransfer(TransferService.java:68)
        - locked <0x00000007a1b2c3d0> (a vn.pay.ledger.TransferService)
        at vn.pay.ledger.TransferService.transfer(TransferService.java:44)
        at vn.pay.ledger.TransferController.transfer(TransferController.java:28)
        at jdk.internal.reflect.DirectMethodHandleAccessor.invoke(java.base@21.0.4/DirectMethodHandleAccessor.java:103)
        at org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1089)
        at org.apache.tomcat.util.threads.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:1190)
        at java.lang.Thread.run(java.base@21.0.4/Thread.java:1583)
 
   Locked ownable synchronizers:
        - <0x00000007a1b2c3d0> (a vn.pay.ledger.TransferService)
 
# Ghi chú on-call:
#   - Cả 2 thread http-nio-8080-exec-12 và -15 đều RUNNABLE, đang chờ đọc socket PostgreSQL (socketRead0)
#   - jstack ứng dụng KHÔNG có thread BLOCKED (on object monitor) - deadlock xảy ra ở tầng DB, không phải JVM monitor
#   - Hai thread cùng giữ monitor <0x00000007a1b2c3d0> của TransferService (synchronized instance method) nhưng đợi DB trả về (đang chờ lock ví thứ hai trong transaction)`
    },
    {
      name: 'postgresql-deadlock.log',
      lang: 'text',
      content: `2026-10-28 14:30:07.123 +07 [12345] ERROR:  deadlock detected
2026-10-28 14:30:07.123 +07 [12345] DETAIL:  Process 12345 waits for ShareLock on transaction 67890; blocked by process 67890.
	Process 12345: UPDATE wallet SET balance = balance - 50000 WHERE id = 'W2001' AND version = 3
	Process 67890: UPDATE wallet SET balance = balance - 30000 WHERE id = 'W1001' AND version = 5
2026-10-28 14:30:07.123 +07 [12345] HINT:  See server log for query details.
2026-10-28 14:30:07.123 +07 [12345] CONTEXT:  SQL statement "UPDATE wallet SET balance = balance - 50000 WHERE id = 'W2001' AND version = 3"
2026-10-28 14:30:07.123 +07 [67890] ERROR:  deadlock detected
2026-10-28 14:30:07.123 +07 [67890] DETAIL:  Process 67890 waits for ShareLock on transaction 12345; blocked by process 12345.
	Process 67890: UPDATE wallet SET balance = balance - 30000 WHERE id = 'W1001' AND version = 5
	Process 12345: UPDATE wallet SET balance = balance - 50000 WHERE id = 'W2001' AND version = 3
2026-10-28 14:30:07.123 +07 [67890] HINT:  See server log for query details.
2026-10-28 14:30:07.123 +07 [67890] CONTEXT:  SQL statement "UPDATE wallet SET balance = balance - 30000 WHERE id = 'W1001' AND version = 5"
2026-10-28 14:30:07.123 +07 [12345] LOG:  process 12345 still waiting for ShareLock on transaction 67890 after 1000.123 ms
2026-10-28 14:30:07.123 +07 [12345] LOG:  process 67890 still waiting for ShareLock on transaction 12345 after 1000.123 ms
2026-10-28 14:30:08.123 +07 [12345] LOG:  deadlock detected - process 12345 waits for ShareLock on transaction 67890
2026-10-28 14:30:08.123 +07 [12345] LOG:  aborting transaction of process 12345 to break deadlock
2026-10-28 14:30:08.123 +07 [67890] LOG:  deadlock detected - process 67890 waits for ShareLock on transaction 12345
2026-10-28 14:30:08.123 +07 [67890] LOG:  aborting transaction of process 67890 to break deadlock`
    },
    {
      name: 'TransferService.java',
      lang: 'java',
      content: `@Service
@Transactional
public class TransferService {
 
    private final JdbcTemplate jdbc;
 
    // Instance method synchronized - chỉ có hiệu lực trong JVM này, không bảo vệ đa pod
    public synchronized void transfer(String fromWallet, String toWallet, long amount) {
        doTransfer(fromWallet, toWallet, amount);
    }
 
    private void doTransfer(String from, String to, long amount) {
        // Khóa từng ví theo thứ tự tham số: ví nguồn trước, rồi ví đích
        lockWallet(from);
        lockWallet(to);
 
        // Cập nhật số dư (giản lược)
        jdbc.update("UPDATE wallet SET balance = balance - ?, version = version + 1 WHERE id = ? AND version = ?",
            amount, from, getVersion(from));
        jdbc.update("UPDATE wallet SET balance = balance + ?, version = version + 1 WHERE id = ? AND version = ?",
            amount, to, getVersion(to));
    }
 
    private void lockWallet(String walletId) {
        jdbc.queryForMap("SELECT id, balance, version FROM wallet WHERE id = ? FOR UPDATE", walletId);
    }
 
    private int getVersion(String walletId) {
        return jdbc.queryForObject("SELECT version FROM wallet WHERE id = ?", Integer.class, walletId);
    }
}
`
    }
  ],
  questions: [
    'Tại sao jstack ứng dụng không có thread BLOCKED mà PostgreSQL lại báo deadlock? Giải thích khác biệt giữa deadlock monitor JVM và deadlock row-level DB.',
    'Chỉ ra nguyên nhân gốc từ log PostgreSQL: hai process (12345, 67890) đang UPDATE hai wallet (W1001, W2001) theo thứ tự ngược nhau. Mối tương quan giữa thứ tự tham số API và thứ tự khóa từng hàng bằng SELECT FOR UPDATE trong service.',
    'Đề xuất cách sửa: (1) chuẩn hoá thứ tự khóa theo walletId tăng dần, (2) dùng NOWAIT/SKIP LOCKED với retry có kiểm soát, (3) dùng advisory lock theo thứ tự. So sánh ưu/nhược.'
  ],
  hints: [
    'JVM monitor (synchronized) chỉ bảo vệ trong một process. Khi scale nhiều pod, mỗi pod có instance TransferService riêng → synchronized KHÔNG ngăn deadlock chéo pod. Deadlock xảy ra ở PostgreSQL row lock.',
    'Log PostgreSQL cho thấy: Process 12345 (batch thu hộ W1001→W2001) đã giữ lock W1001 rồi chờ W2001; Process 67890 (batch hoàn tiền W2001→W1001) đã giữ lock W2001 rồi chờ W1001. Trong TransferService, lockWallet(from) rồi lockWallet(to) nên thứ tự khóa DB phụ thuộc trực tiếp thứ tự tham số API.',
    'jstack chỉ thấy 2 thread RUNNABLE chờ socket DB (socketRead0) trong lockWallet (executeQuery), không BLOCKED vì chúng không tranh chấp monitor JVM - monitor TransferService được lấy trước khi vào doTransfer và không bị tranh chấp giữa 2 thread này.'
  ],
answer: `**Tóm tắt:** Đây là **deadlock row-level ở PostgreSQL**, không phải deadlock monitor JVM. Hai batch chạy ngược chiều (W1001→W2001 và W2001→W1001) khiến service khóa từng hàng {{wallet}} bằng {{SELECT ... FOR UPDATE}} theo thứ tự tham số ({{from}} rồi {{to}}) — tức hai transaction khóa ngược nhau. Process 12345 giữ lock W1001 rồi chờ W2001; Process 67890 giữ W2001 rồi chờ W1001. PostgreSQL phát hiện deadlock sau ~1s và abort một transaction. Jstack ứng dụng chỉ thấy 2 thread http-nio-8080-exec RUNNABLE chờ socket DB (đang {{lockWallet}}) — không thread nào BLOCKED vì {{synchronized}} trên {{TransferService}} không bị tranh chấp. Sửa gốc: **chuẩn hoá thứ tự lock theo walletId tăng dần** trước khi gọi {{SELECT ... FOR UPDATE}}.

### Nguyên nhân gốc

Code {{TransferService.doTransfer}} khóa từng ví theo thứ tự tham số:

~~~java
lockWallet(from);
lockWallet(to);

private void lockWallet(String walletId) {
    jdbc.queryForMap("SELECT id, balance, version FROM wallet WHERE id = ? FOR UPDATE", walletId);
}
~~~

Vì mỗi lần chỉ khóa một hàng, **thứ tự khóa DB do ứng dụng quyết định** (thứ tự gọi {{lockWallet}}), và ở đây phụ thuộc trực tiếp vào {{from/to}} của API. Với hai batch ngược chiều:

- Batch thu hộ: {{transfer("W1001", "W2001", 50000)}} → lock W1001 trước, rồi lock W2001
- Batch hoàn tiền: {{transfer("W2001", "W1001", 30000)}} → lock W2001 trước, rồi lock W1001

Khi cả hai chạy đồng thời:

~~~text
Process 12345 (thu hộ)                 Process 67890 (hoàn tiền)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOCK W1001 (thành công)                LOCK W2001 (thành công)
                                        |
LOCK W2001 (CHỜ - bị 67890 giữ)         |
                                        | LOCK W1001 (CHỜ - bị 12345 giữ)
                                        ▼
                              DEADLOCK: mỗi process giữ 1 lock, chờ lock của process kia
~~~

PostgreSQL có cơ chế deadlock detection chạy định kỳ (mặc định {{deadlock_timeout = 1s}}). Khi phát hiện, nó **abort một transaction nạn nhân** (thường là transaction tốn ít công hơn) để giải phóng lock cho bên kia tiến. Log ghi rõ: {{Process 12345 waits for ShareLock on transaction 67890; blocked by process 67890}} và ngược lại.

Lưu ý quan trọng về PostgreSQL: câu {{SELECT ... FOR UPDATE}} trên nhiều hàng (ví dụ {{WHERE id IN (?, ?)}}) **không đảm bảo** khóa theo thứ tự phần tử trong danh sách tham số — thứ tự khóa phụ thuộc kế hoạch thực thi (index scan, thứ tự trả về). Vì vậy, để kiểm soát thứ tự lock an toàn, nên khóa **từng hàng bằng các câu riêng theo thứ tự toàn cục đã sắp xếp** (hoặc đảm bảo planner trả về đúng thứ tự, nhưng cách khóa từng hàng theo thứ tự ứng dụng rõ ràng hơn).

{{@Transactional}} + {{@Service}} tạo ra instance singleton {{TransferService}}. {{public synchronized void transfer}} lấy **monitor instance** này, nhưng chỉ bảo vệ trong **một JVM** (mỗi pod có instance riêng) và deadlock thực sự xảy ra ở **row lock PostgreSQL**.

### Dẫn chứng từ artifact

**1. jstack-transfer-deadlock.txt:**
- 2 thread {{http-nio-8080-exec-12}} và {{http-nio-8080-exec-15}} đều {{RUNNABLE}}
- Stack dừng tại {{SocketInputStream.socketRead0}} trong {{executeQuery}} của {{TransferService.lockWallet}} → đang chờ PostgreSQL phản hồi khi cố khóa ví thứ hai
- Cùng giữ {{- locked <0x00000007a1b2c3d0> (a vn.pay.ledger.TransferService)}} → monitor instance được lấy, nhưng **không có thread nào BLOCKED chờ monitor này**
- Kết luận: deadlock không ở JVM monitor

**2. postgresql-deadlock.log:**
- {{Process 12345: UPDATE wallet ... WHERE id = 'W2001'}} chờ {{ShareLock on transaction 67890}}
- {{Process 67890: UPDATE wallet ... WHERE id = 'W1001'}} chờ {{ShareLock on transaction 12345}}
- Hai {{UPDATE}} ngược chiều trên cùng 2 wallet {{W1001}} và {{W2001}}; PostgreSQL abort transaction để phá vòng chờ

**3. TransferService.java:**
- {{lockWallet(from)}} rồi {{lockWallet(to)}} (mỗi lần {{SELECT ... FOR UPDATE}} một hàng) → thứ tự lock DB phụ thuộc thứ tự tham số API
- {{public synchronized}} chỉ serialize trong JVM, vô hiệu đa pod

### Cách sửa

**Ngắn hạn:** tạm dừng batch đối soát hai chiều, restart pod, đối soát lại thủ công các giao dịch bị ảnh hưởng (aborted/PENDING).

**Sửa gốc (chọn 1):**

**1. Chuẩn hoá thứ tự lock theo walletId tăng dần (khuyên dùng):**

~~~java
private void doTransfer(String from, String to, long amount) {
    String first = from.compareTo(to) < 0 ? from : to;
    String second = from.compareTo(to) < 0 ? to : from;

    lockWallet(first);   // LUÔN lock id nhỏ trước
    lockWallet(second);

    // Cập nhật theo from/to gốc
    jdbc.update("UPDATE wallet SET balance = balance - ?, version = version + 1 WHERE id = ? AND version = ?",
        amount, from, getVersion(from));
    jdbc.update("UPDATE wallet SET balance = balance + ?, version = version + 1 WHERE id = ? AND version = ?",
        amount, to, getVersion(to));
}
~~~

Điều này biến đồ thị chờ thành **DAG** (không chu trình) vì mọi transaction đều lock theo cùng một thứ tự toàn cục.

**2. SELECT FOR UPDATE NOWAIT / SKIP LOCKED (PostgreSQL 9.5+):**

~~~sql
SELECT ... FOR UPDATE NOWAIT           -- thất bại ngay nếu lock không lấy được (ERROR 55P03)
SELECT ... FOR UPDATE SKIP LOCKED      -- bỏ qua hàng đã bị lock (dùng cho queue, không phù hợp transfer)
~~~

{{NOWAIT}} biến deadlock thành lỗi ngay lập tức → client retry với backoff → giảm thời gian chờ. Nhưng cần xử lý retry idempotent.

**3. Advisory lock (pg_advisory_xact_lock):**

~~~java
String first = from.compareTo(to) < 0 ? from : to;
String second = from.compareTo(to) < 0 ? to : from;
jdbc.queryForObject("SELECT pg_advisory_xact_lock(hashtext(?))", Object.class, first);
jdbc.queryForObject("SELECT pg_advisory_xact_lock(hashtext(?))", Object.class, second);
// advisory lock tự động giải phóng khi transaction kết thúc
~~~

Advisory lock không gắn liền với hàng dữ liệu, dùng cho điều phối logic ứng dụng. Cũng phải chuẩn hoá thứ tự lock và chú ý va chạm {{hashtext}}.

| Cách | Ưu | Nhược | Khi nào dùng |
|---|---|---|---|
| Sắp xếp walletId rồi khóa từng hàng | Đơn giản, đúng chuẩn, kiểm soát thứ tự rõ | Phải nhớ áp dụng mọi nơi | Mặc định cho mọi hệ thống tài chính |
| FOR UPDATE NOWAIT + retry | Fail fast, không chờ deadlock detection | Cần retry logic, idempotency | Tải cao, va chạm thường |
| Advisory lock | Nhẹ, không lock hàng dữ liệu | Tự quản lý key, rủi ro va chạm hash | Điều phối logic phức tạp |

### Phòng ngừa

- **Code review rule:** Mọi luồng khóa/nâng cấp lock trên nhiều hàng phải có comment nêu rõ thứ tự lock toàn cục. Không dựa vào thứ tự tham số nghiệp vụ hay thứ tự trong {{IN (...)}}.
- **Test tải:** k6/JMH mô phỏng 2 batch ngược chiều trên cùng cặp wallet, chạy liên tục - deadlock thường chỉ lộ ở tải thật.
- **Alert:** Bật {{log_lock_waits = on}}, theo dõi {{deadlock detected}} trong log PostgreSQL.
- **Tài liệu:** Ghi runbook "deadlock DB != deadlock JVM" - jstack không thấy BLOCKED, phải đọc log PostgreSQL.

> Senior tip: Trong phỏng vấn, nếu hỏi "deadlock DB và deadlock JVM khác nhau thế nào?", hãy trả lời: JVM deadlock là chu trình chờ **monitor/lock object** (synchronized, ReentrantLock) - jstack in {{Found one Java-level deadlock}}. DB deadlock là chu trình chờ **row lock** (SELECT FOR UPDATE, UPDATE) - jstack chỉ thấy thread RUNNABLE chờ socket, log DB mới có {{deadlock detected}}. Hai loại có thể cùng lúc xảy ra (cùng một lỗi thiết kế: thứ tự lock phụ thuộc tham số), không phải hai sự cố riêng.`,
  rubric: [
    'Phân biệt đúng deadlock DB row-lock với deadlock JVM monitor: jstack không có BLOCKED, PostgreSQL log có "deadlock detected" với 2 process chờ ShareLock lẫn nhau trên W1001/W2001.',
    'Chỉ ra nguyên nhân: service khóa từng ví theo thứ tự tham số (lockWallet(from) rồi lockWallet(to)) → batch ngược chiều lock ngược nhau. Trích dẫn log PostgreSQL: Process 12345 lock W1001 chờ W2001, Process 67890 lock W2001 chờ W1001.',
    'Đề xuất sửa: chuẩn hoá thứ tự lock theo walletId tăng dần rồi khóa từng hàng (chính xác nhất), hoặc NOWAIT/retry, advisory lock. So sánh ưu/nhược. Nhấn mạnh synchronized JVM không bảo vệ đa pod.'
  ],
  tags: ['deadlock', 'postgresql', 'select-for-update', 'row-lock', 'database', 'jstack', 'transaction']
},
{
  id: 'lab-thread-016',
  category: 'thread',
  title: 'ThreadLocal rò rỉ bộ nhớ trong pool Tomcat: 2.5GB heap sau 3 ngày',
  level: 'senior',
  scenario: `**Bối cảnh:** **PayVN Gateway** (Spring Boot 3.4, Java 21, Tomcat 200 thread, pod 4 vCPU, heap 4GB) dùng {{ThreadLocal}} để lưu ngữ cảnh request (traceId, userId, tenantId) cho logging và metrics. Mỗi request set {{ThreadLocal}} ở filter đầu, xóa ở filter cuối. Sau deploy bản mới thêm feature "async processing", heap tăng dần từ 1.2GB lên **2.5GB trong 3 ngày**, GC G1 Old Gen collection tần suất tăng, pause time lên 800ms. Không OOM nhưng latency p99 từ 50ms lên 300ms. Heap dump cho thấy hàng nghìn instance {{RequestContext}} bị giữ bởi {{ThreadLocalMap}} của các thread trong pool async xử lý nền.

**Triệu chứng:** Heap usage sawtooth: Young GC giảm heap tạm thời nhưng Old Gen không giảm. {{jcmd 1 GC.class_histogram}} cho thấy {{RequestContext}} nằm top theo retained size. Thread pool async cố định 10 thread, nhưng {{ThreadLocalMap}} của các thread này chứa **rất nhiều entry** (mỗi entry gắn với một {{ThreadLocal}} key khác nhau).

**Dữ liệu thu thập:** {{jcmd 1 GC.heap_dump /tmp/heap.hprof}}, phân tích bằng MAT/Eclipse Memory Analyzer, code {{RequestContextFilter}} và {{AsyncProcessingService}}.`,
  artifacts: [
    {
      name: 'heap-histogram.txt',
      lang: 'text',
      content: `$ jcmd 1 GC.class_histogram | head -20
 num     #instances         #bytes  class name
----------------------------------------------
   1:        2145320      412314880  [C
   2:         312450      200458240  java.lang.String
   3:          45210      180840000  vn.pay.gateway.RequestContext
   4:          45210      144672000  java.util.concurrent.ConcurrentHashMap$Node
   5:          45210       72336000  java.util.HashMap$Node
   6:          45210       72336000  java.lang.ThreadLocal$ThreadLocalMap$Entry
   7:           5000       48000000  vn.pay.gateway.TenantContext
   8:           5000       40000000  vn.pay.gateway.UserContext
   ...
 
$ jcmd 1 GC.class_histogram | grep RequestContext
   3:          45210      180840000  vn.pay.gateway.RequestContext
 
# MAT retained set: 45,210 RequestContext instance retained ~1.1 GB
# ThreadLocalMap.Entry (stale) count: 45,210, tập trung trên 10 thread async-pool-*`
    },
    {
      name: 'mat-dominator-tree.txt',
      lang: 'text',
      content: `Dominator Tree (retained size descending):
 
| Class Name                                                            | Shallow Heap | Retained Heap | Count |
|-----------------------------------------------------------------------|--------------|---------------|-------|
| java.lang.Thread @ 0x00007f8b2c000800 (async-pool-1)                  | 2.5 KB       | 110.5 MB      | 1     |
|   '- java.lang.ThreadLocal$ThreadLocalMap @ 0x00007f8b2d100000        | 4.0 KB       | 110.5 MB      | 1     |
|       '- java.lang.ThreadLocal$ThreadLocalMap$Entry @ 0x00007f8b2d100100 | 32 B       | 110.5 MB      | ~4520 |
|           '- vn.pay.gateway.RequestContext @ 0x00007f8b3c4d5000       | 4 KB         | 24.5 KB       | 4520  |
|               '- java.util.HashMap (attributes)                       | 1 KB         | 12.0 KB       | 4520  |
|               '- java.util.concurrent.ConcurrentHashMap (metrics)      | 2 KB         | 8.5 KB        | 4520  |
 
# 10 thread async-pool-* có pattern tương tự. Tổng retained bởi ThreadLocalMap ~1.1 GB.
# Mỗi thread có hàng nghìn Entry; mỗi Entry gắn với một ThreadLocal key KHÁC NHAU (tạo mới mỗi task) và value là RequestContext lớn.`
    },
    {
      name: 'RequestContextFilter.java',
      lang: 'java',
      content: `public class RequestContextFilter implements Filter {
    private static final ThreadLocal<RequestContext> CTX = new ThreadLocal<>();
    private static final ThreadLocal<TenantContext> TENANT = new ThreadLocal<>();
    private static final ThreadLocal<UserContext> USER = new ThreadLocal<>();
 
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) {
        RequestContext ctx = new RequestContext();
        ctx.setTraceId(MDC.get("traceId"));
        ctx.setStartTime(System.nanoTime());
        CTX.set(ctx);
 
        TenantContext tc = extractTenant(req);
        TENANT.set(tc);
 
        UserContext uc = extractUser(req);
        USER.set(uc);
 
        try {
            chain.doFilter(req, res);
        } finally {
            CTX.remove();
            TENANT.remove();
            USER.remove();
        }
    }
 
    public static RequestContext getContext() { return CTX.get(); }
    public static TenantContext getTenant() { return TENANT.get(); }
    public static UserContext getUser() { return USER.get(); }
}
`
    },
    {
      name: 'AsyncProcessingService.java',
      lang: 'java',
      content: `@Service
public class AsyncProcessingService {
    private final ExecutorService asyncPool = Executors.newFixedThreadPool(10);
 
    public CompletableFuture<Result> processAsync(Request req) {
        // Lấy context từ ThreadLocal của thread HTTP
        RequestContext ctx = RequestContextFilter.getContext();
        TenantContext tenant = RequestContextFilter.getTenant();
        UserContext user = RequestContextFilter.getUser();
 
        return CompletableFuture.supplyAsync(() -> {
            // BUG: tạo ThreadLocal MỚI trong mỗi task rồi set lên thread pool, KHÔNG remove()
            ThreadLocal<RequestContext> taskCtx = new ThreadLocal<>();
            ThreadLocal<TenantContext> taskTenant = new ThreadLocal<>();
            ThreadLocal<UserContext> taskUser = new ThreadLocal<>();
 
            taskCtx.set(ctx);
            taskTenant.set(tenant);
            taskUser.set(user);
 
            try {
                return doHeavyWork(req, ctx, tenant, user);
            } finally {
                // QUÊN remove() - thread pool tái dụng, ThreadLocalMap giữ entry stale (key đã GC, value còn bị giữ)
                // taskCtx.remove(); taskTenant.remove(); taskUser.remove();
            }
        }, asyncPool);
    }
 
    private Result doHeavyWork(Request req, RequestContext ctx, TenantContext t, UserContext u) {
        // xử lý nặng ~2-5 giây
        return new Result();
    }
}
`
    }
  ],
  questions: [
    'Tại sao ThreadLocal trong thread pool (asyncPool) gây rò rỉ mà ThreadLocal trong thread Tomcat (có remove trong finally) lại không? Giải thích vòng đời thread pool vs thread servlet.',
    'MAT cho thấy mỗi thread async-pool có hàng nghìn ThreadLocalMap.Entry — tại sao nhiều entry như vậy dù mỗi request chỉ cần 3 giá trị context? Mối liên quan với việc tạo ThreadLocal mới mỗi task và cơ chế dọn entry của ThreadLocalMap.',
    'Đề xuất 3 cách sửa: (1) remove() trong finally của task async, (2) không dùng ThreadLocal cho async — truyền context qua tham số, (3) dùng Context Propagation (Micrometer Context Propagation / Spring). So sánh.'
  ],
  hints: [
    'Thread Tomcat: request đến -> filter set 3 ThreadLocal static final -> controller -> filter finally remove 3 ThreadLocal. Thread Tomcat trả về pool, entry được dọn. Nhưng task async chạy trên thread pool khác (asyncPool), tạo ThreadLocal mới rồi set mà quên remove -> thread pool tái dụng, entry tích lũy.',
    'MAT: mỗi task tạo {{new ThreadLocal<>()}} rồi set value (RequestContext chứa HashMap, ConcurrentHashMap). ThreadLocalMap dùng weak reference cho key: khi ThreadLocal cục bộ hết scope, key bị GC nhưng value (RequestContext lớn) vẫn bị entry giữ mạnh cho đến khi bị expunge — trên thread pool sống lâu và không gọi remove, expunge không đáng tin cậy nên entry stale tích lũy.',
    'Nếu dùng ThreadLocal static final (key cố định) và remove() đúng chỗ thì mỗi thread chỉ có 1 entry/key. Nếu bắt buộc tạo ThreadLocal theo task, phải remove() trong finally; tốt nhất là truyền context qua tham số hoặc dùng Context Propagation.'
  ],
answer: `**Tóm tắt:** ThreadLocal {{RequestContext}} bị rò rỉ ở **thread pool async** ({{asyncPool}} 10 thread). Task async tạo {{ThreadLocal}} mới trong mỗi lần chạy rồi {{set}} context lên thread pool, nhưng **quên {{remove()}} trong {{finally}}**. Thread pool tái dụng thread nên {{ThreadLocalMap}} của nó tích lũy rất nhiều entry: key {{ThreadLocal}} (cục bộ) bị GC (weak reference) còn value {{RequestContext}} (chứa {{HashMap}} attributes, {{ConcurrentHashMap}} metrics ~4KB) vẫn bị giữ mạnh tới khi entry được expunge. 45,210 instance {{RequestContext}} retained ~1.1 GB. Sửa: truyền context qua tham số, hoặc dùng Context Propagation, hoặc ít nhất {{remove()}} (và tái sử dụng key) trong finally.

### Nguyên nhân gốc

**1. Vòng đời thread khác nhau:**

| Đặc điểm | Thread Tomcat (servlet) | Thread Pool (asyncPool) |
|---|---|---|
| Tạo khi | Request đến | Khởi động ứng dụng (fixed 10) |
| Sử dụng | Xử lý 1 request rồi trả về pool | Chạy nhiều task liên tục, tái dụng |
| ThreadLocal cleanup | {{finally remove()}} trong filter | **QUÊN {{remove()}}** |
| Hậu quả | Entry được dọn sau mỗi request | Entry stale tích lũy, object lớn không GC kịp |

**2. Cơ chế rò rỉ chi tiết (ThreadLocalMap):**

- {{AsyncProcessingService.processAsync}} lấy context từ thread HTTP (Tomcat thread) rồi submit task lên {{asyncPool}} (ExecutorService 10 thread cố định) bằng {{supplyAsync(..., asyncPool)}}.
- Trong lambda, mỗi task tạo **ThreadLocal mới** ({{new ThreadLocal<>()}}) rồi {{set}} {{RequestContext}}/{{TenantContext}}/{{UserContext}} lên thread pool.
- Task xong, **không có {{finally remove()}}**. Biến {{ThreadLocal}} cục bộ hết scope → key trong {{ThreadLocalMap}} (weak reference) bị GC, nhưng {{Entry}} (và value {{RequestContext}} lớn) vẫn còn trong map cho tới khi bị **expunge** (dọn slot stale). {{ThreadLocalMap}} chỉ expunge trong một số thao tác {{get/set/remove}}; nếu không {{remove()}} đúng key và thread pool ít chạm map theo cách phù hợp, entry stale có thể tồn tại rất lâu → rò rỉ.
- Thread pool tái dụng thread cho task sau và lại tạo key mới → số entry stale tăng liên tục. 10 thread × nhiều task/ngày = 45,210 instance retained ~1.1 GB.

Ngược lại, {{RequestContextFilter}} dùng **ThreadLocal static final** và luôn {{remove()}} trong {{finally}}, nên thread Tomcat không tích lũy entry qua các request.

### Dẫn chứng từ artifact

**1. heap-histogram.txt:**
- {{vn.pay.gateway.RequestContext}}: 45,210 instance, 180 MB shallow, retained ~1.1 GB (MAT)
- {{ThreadLocal$ThreadLocalMap$Entry}}: 45,210 entry (stale), tập trung trên 10 thread {{async-pool-*}}
- {{TenantContext}}/{{UserContext}}: 5,000 instance mỗi loại

**2. mat-dominator-tree.txt:**
- Thread {{async-pool-1}} retained ~110.5 MB chủ yếu do {{ThreadLocalMap}} → ~4520 {{Entry}} stale → ~4520 {{RequestContext}} (mỗi cái kéo theo HashMap + ConcurrentHashMap)
- Pattern lặp lại cho 10 thread async-pool

**3. RequestContextFilter.java:**
- 3 {{ThreadLocal}} static final: {{CTX}}, {{TENANT}}, {{USER}}
- {{doFilter}}: set 3 ThreadLocal, {{finally}} remove 3 ThreadLocal → **thread Tomcat được dọn sạch**

**4. AsyncProcessingService.java:**
- Trong task chạy trên {{asyncPool}}: tạo {{ThreadLocal}} mới mỗi task, {{set}} context, **KHÔNG CÓ {{finally remove()}}** → thread pool tích lũy entry stale

### Cách sửa

**Cách 1: Truyền context qua tham số (khuyên dùng, đơn giản nhất):**

~~~java
public CompletableFuture<Result> processAsync(Request req) {
    RequestContext ctx = RequestContextFilter.getContext();
    TenantContext tenant = RequestContextFilter.getTenant();
    UserContext user = RequestContextFilter.getUser();

    return CompletableFuture.supplyAsync(() -> {
        // KHÔNG dùng ThreadLocal trên thread pool - truyền thẳng vào method
        return doHeavyWork(req, ctx, tenant, user);
    }, asyncPool);
}

private Result doHeavyWork(Request req, RequestContext ctx, TenantContext t, UserContext u) {
    // dùng ctx, t, u trực tiếp
}
~~~

Ưu: loại bỏ ThreadLocal cho async, không rò rỉ, code rõ ràng.

**Cách 2: Context Propagation (Micrometer Context Propagation / Spring):**

~~~java
// Spring Boot 3.x có hỗ trợ Context Propagation (micrometer-context-propagation)
// Tự capture ThreadLocal (MDC, OpenTelemetry, custom) từ thread submit và restore ở thread chạy,
// có cleanup tự động sau task.

ContextSnapshot snapshot = ContextSnapshot.captureAll();
return CompletableFuture.supplyAsync(snapshot.wrap(() -> {
    return doHeavyWork(req, RequestContextFilter.getContext(),
        RequestContextFilter.getTenant(), RequestContextFilter.getUser());
}), asyncPool);
~~~

Phù hợp hệ đã có nhiều thư viện dựa trên ThreadLocal (MDC/OTel). Cần dependency {{io.micrometer:context-propagation}}.

**Cách 3: Ít nhất phải {{remove()}} trong finally (nếu bắt buộc dùng ThreadLocal):**

~~~java
return CompletableFuture.supplyAsync(() -> {
    ThreadLocal<RequestContext> taskCtx = new ThreadLocal<>();
    try {
        taskCtx.set(ctx);
        return doHeavyWork(req, ctx, tenant, user);
    } finally {
        taskCtx.remove();
    }
}, asyncPool);
~~~

Tốt hơn là dùng ThreadLocal static final tái sử dụng key. Cách này vẫn rủi ro quên finally; chỉ dùng khi không thể refactor signature.

| Cách | Rò rỉ? | Độ phức tạp | Phù hợp |
|---|---|---|---|
| Truyền tham số | Không | Thấp | Mới viết, context ít, method do team kiểm soát |
| Context Propagation | Không (tự dọn) | Trung bình | Hệ có sẵn MDC/OTel, nhiều library dùng ThreadLocal |
| remove() trong finally | Vẫn rủi ro quên | Thấp | Legacy code, không đổi được signature |

### Phòng ngừa

- **Code review rule:** Không tạo {{ThreadLocal}} cục bộ trong task chạy trên thread pool; nếu dùng ThreadLocal, phải {{remove()}} trong {{finally}} cùng block. Tái sử dụng key (static final) khi có thể.
- **Static analysis:** bật rule phát hiện ThreadLocal không remove (SpotBugs/Error Prone tùy cấu hình dự án).
- **Test rò rỉ:** chạy test tải async, so sánh heap/instance count {{RequestContext}} trước-sau.
- **Giám sát:** alert khi Old Gen/heap tăng bất thường kéo dài; heap dump khi nghi ngờ leak.
- **Thiết kế:** mặc định **không dùng ThreadLocal cho dữ liệu request** khi có async. Truyền tham số hoặc dùng Context Propagation; cân nhắc {{ScopedValue}} (Java 21 preview, ổn định dần ở các bản mới) cho ngữ cảnh bất biến theo phạm vi khi phù hợp.

> Senior tip: ThreadLocal là "biến toàn cục cục bộ theo thread" - nguy hiểm khi thread được tái dụng (pool). ThreadLocalMap dùng weak key: key GC không tự động thu hồi value lớn nếu entry chưa expunge, nên {{remove()}} là bắt buộc. Quy tắc vàng: **ThreadLocal chỉ dùng cho dữ liệu sống chết cùng request trên thread servlet**; với async/handoff sang thread khác, ưu tiên truyền tham số hoặc Context Propagation. 45k RequestContext × ~4KB = 180 MB shallow, nhưng retained ~1.1 GB vì mỗi instance kéo theo HashMap + ConcurrentHashMap.`,
  rubric: [
    'Chỉ ra rò rỉ ở asyncPool thread: task tạo ThreadLocal mới mỗi lần, set context nhưng quên remove() trong finally → ThreadLocalMap tích lũy entry stale (key GC, value RequestContext lớn còn giữ), retained ~1.1 GB (45k instance).',
    'Giải thích khác biệt vòng đời thread Tomcat (filter remove trong finally) vs thread pool tái dụng; nêu cơ chế weak key/expunge của ThreadLocalMap hoặc tương đương.',
    'Đề xuất 3 cách sửa: (1) truyền context qua tham số + executor rõ ràng (tốt nhất), (2) Context Propagation (Micrometer/Spring), (3) remove() trong finally (và tái sử dụng key). So sánh trade-off.',
    'Nêu phòng ngừa: code review (không tạo ThreadLocal cục bộ trong task pool / luôn remove), static analysis, test tải, giám sát heap/heap dump, định hướng Context Propagation hoặc ScopedValue khi phù hợp.'
  ],
  tags: ['threadlocal', 'memory-leak', 'thread-pool', 'async', 'inheritablethreadlocal', 'heap-dump', 'mat', 'context-propagation', 'scopedvalue']
}
);
