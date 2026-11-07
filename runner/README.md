# Máy chạy code Java riêng (miễn phí trên Oracle Cloud)

Nút **▶ Chạy test** gọi `/api/run`. Thứ tự dùng:
1. **Máy riêng** trong thư mục này (`server.js`), khi Vercel có `RUNNER_URL` và `RUNNER_TOKEN`. Mất khoảng 2–3 giây.
2. **Wandbox** (wandbox.org) khi chưa có máy riêng hoặc máy riêng lỗi. Miễn phí nhưng chậm (10–50 giây) và hay quá tải.

Mỗi bài chạy trong một container Docker dùng một lần, với JDK 21:
- không có mạng, filesystem chỉ đọc, user không phải root;
- 512 MB RAM, 1 CPU, tối đa 128 process, 10 giây.

## Bước 1: tạo máy ảo miễn phí (khoảng 15 phút)

1. Đăng ký tại https://www.oracle.com/cloud/free/. Cần thẻ để xác minh, nhưng gói Always Free không bị trừ tiền. Chọn home region gần (Singapore hoặc Tokyo), vì sau này không đổi được.
2. Vào Compute → Instances → **Create instance**:
   - Image: **Canonical Ubuntu 24.04**.
   - Shape: **Ampere VM.Standard.A1.Flex**, 2 OCPU / 12 GB là đủ. Shape này "Always Free-eligible". Nếu báo hết máy ARM ("Out of capacity"), thử lại sau vài giờ hoặc chọn **VM.Standard.E2.1.Micro** (x86, 1 GB RAM; khi đó sửa `RUNNER_PARALLEL=1`).
   - Add SSH keys: tải private key về máy.
3. Mở cổng web: vào Instance → Subnet → Security List → **Add Ingress Rules**, Source `0.0.0.0/0`, TCP, Destination port `80,443`.

## Bước 2: cài máy chạy code (khoảng 5 phút)

Trên máy bạn (Git Bash), copy thư mục `runner/` lên rồi chạy script cài đặt:

~~~bash
scp -i <private-key> -r runner ubuntu@<IP>:~/
ssh -i <private-key> ubuntu@<IP>
# trên VM: tạo token ngẫu nhiên rồi cài
TOKEN=$(openssl rand -hex 24); echo "$TOKEN"     # lưu lại token này
sudo bash ~/runner/setup.sh "$TOKEN"
~~~

Cuối script sẽ in ra `RUNNER_URL` (dạng `https://1-2-3-4.sslip.io`) và một lần chạy thử `PASS xin chào`.

## Bước 3: nối với app

Vào Vercel → Project → Settings → Environment Variables, thêm:
- `RUNNER_URL` = URL script đã in ra;
- `RUNNER_TOKEN` = token ở bước 2.

Sau đó Redeploy.

## Vận hành

| Việc | Lệnh trên VM |
|---|---|
| Xem log | `journalctl -u java-runner -f` |
| Kiểm tra | `curl https://<host>/health` |
| Cập nhật `server.js` | copy file mới rồi `sudo install -m 644 server.js /opt/runner/ && sudo systemctl restart java-runner` |
| Đổi token | sửa `/etc/systemd/system/java-runner.service`, `sudo systemctl daemon-reload && sudo systemctl restart java-runner`, rồi sửa trên Vercel |

> Oracle có thể thu hồi máy Always Free nếu máy "nhàn rỗi" quá lâu (CPU dưới khoảng 20% trong 7 ngày) ở tài khoản chưa nâng cấp. Nếu máy bị tắt, app tự quay về Wandbox. Chỉ cần vào console bấm Start lại.
