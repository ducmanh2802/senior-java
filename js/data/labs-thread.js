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
);
