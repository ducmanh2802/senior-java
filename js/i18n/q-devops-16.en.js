/*
 * English translation of js/data/q-devops.js — task T974. Format: js/core/i18n.js (content overlay).
 * ids: devops-080 devops-081 devops-082 devops-083 devops-084 devops-085 devops-086
 */
App.i18n.content({
  'devops-080': {
    q: 'How do you run a Java (Spring Boot) application as a system service on Linux using systemd, and how do you inspect logs and diagnose it when it fails to start?',
    a: `**Summary:** To keep a Java app running continuously after reboot and restart it automatically on failure, you write a systemd unit file (for example {{loan-service.service}}) under {{/etc/systemd/system/}}, run the app as a dedicated user (not root), and then use {{systemctl enable --now}}. When it fails, inspect logs with {{journalctl -u loan-service}} and check state with {{systemctl status}}.

### Terms (explained on first use)
- **systemd**: the modern Linux service and boot manager (replacing the older SysV init). The main command is {{systemctl}}.
- **Unit file**: a configuration file (.service) that tells systemd how to run a service, when to restart it, which user to run as, and which resource limits to apply.
- **Dedicated user/group**: create a dedicated user (for example {{loansvc}}) for the app to run as, limiting damage if the app is compromised (it does not run as root).
- **journalctl**: the command to view system/service logs collected by systemd.
- **Load average / free / iostat / ss**: diagnostic commands for a slow server (check CPU, RAM, disk, and network connections).

### Step by step

**Step 1 — Create the user and directories**
~~~bash
sudo useradd -r -s /bin/false loansvc
sudo mkdir -p /opt/loan-service /var/log/loan-service
sudo chown -R loansvc:loansvc /opt/loan-service /var/log/loan-service
~~~
Explanation: {{-r}} creates a system user, {{-s /bin/false}} prevents interactive login. The app runs as {{loansvc}}.

**Step 2 — Write the unit file** ({{/etc/systemd/system/loan-service.service}})
~~~yaml
[Unit]
Description=Loan Service Java App
After=network.target

[Service]
Type=simple
User=loansvc
Group=loansvc
WorkingDirectory=/opt/loan-service
ExecStart=/usr/bin/java -jar -Xms512m -Xmx1g loan-service.jar
Restart=always
RestartSec=5
StandardOutput=append:/var/log/loan-service/app.log
StandardError=append:/var/log/loan-service/error.log

[Install]
WantedBy=multi-user.target
~~~
Line-by-line explanation:
- **Type=simple**: systemd considers the service started as soon as the process begins.
- **Restart=always**: restart automatically if the process dies (regardless of exit code). Use {{on-failure}} if you only want restarts on errors.
- **RestartSec=5**: wait 5 seconds before restarting, avoiding a rapid restart loop.
- **StandardOutput/StandardError=append:**: write logs to files instead of journald, making troubleshooting easier to read.
- **WantedBy=multi-user.target**: enable the service when the system enters multi-user mode (typical for servers).

**Step 3 — Reload and start**
~~~bash
sudo systemctl daemon-reload
sudo systemctl enable loan-service      # start automatically on boot
sudo systemctl start loan-service       # start now
sudo systemctl status loan-service      # check status
~~~
{{daemon-reload}} is required after editing a unit file.

**Step 4 — Inspect logs on failure**
~~~bash
sudo journalctl -u loan-service -n 100          # last 100 lines
sudo journalctl -u loan-service --since "1 hour ago"
sudo journalctl -u loan-service -f              # follow in real time
~~~

### In production
- If the app starts and immediately dies, it is often due to wrong file permissions (jar not readable), missing environment variables (add {{Environment=SPRING_PROFILES_ACTIVE=prod}} under [Service]), or a port already in use ({{ss -tlnp | grep :8080}}).
- Resource limits: add under [Service]: {{MemoryMax=2G}}, {{CPUQuota=50%}}, {{LimitNOFILE=65536}} (max open files, important for many DB connections).
- Do not edit the unit file and forget {{daemon-reload}} — systemd will still use the old configuration.

### Comparison table
| Command | When to use | Notes |
|---|---|---|
| systemctl status | see if the service is running, errors, PID | Shows active/inactive/failed state |
| journalctl -u <name> | view service logs | Use {{-f}} to follow continuously |
| free -h | check available RAM | Helps decide {{-Xmx}} for Java |
| iostat -x 1 | check disk bottlenecks | Requires {{sysstat}} package |
| ss -tlnp | see listening ports and processes | Replaces netstat, needs root to see PID |
| uptime | check load average | Three numbers are 1/5/15 minute averages |

> Senior tip: In production, do not run the app as root. If the app must bind to a port below 1024 (for example 80/443), use {{setcap cap_net_bind_service=+ep}} on the Java binary or put a reverse proxy (Nginx) in front to listen on 80/443 and forward to port 8080 (the app listens on a high port, which is safer).`,
    follow: [
      'When a Java app starts and immediately dies, what do you check first and in what order? (hint: journalctl, systemctl status, file permissions, port already in use)',
      'Why set Restart=always together with RestartSec instead of letting systemd restart continuously with no delay?',
      'How do you limit RAM for a Java service on Linux to avoid the OOM Killer? (hint: -Xmx, MemoryMax, cgroup)'
    ]
  },

  'devops-081': {
    q: 'How do you harden SSH on a production Linux server in practice: using keys instead of passwords, disabling root login, restricting ports and users, using fail2ban, and what is a bastion/jump host?',
    a: `**Summary:** SSH is the main entry point to a server, so it must be hardened: use SSH keys instead of passwords, disable root login, restrict which users can log in, use fail2ban to block brute-force attempts, and go through a bastion/jump host instead of exposing servers directly to the Internet. Each measure blocks a common type of attack.

### Terms (explained on first use)
- **SSH (Secure Shell)**: an encrypted remote protocol for managing Linux servers over the command line.
- **SSH key**: a public/private key pair. The private key stays on your machine; the public key is placed on the server. It is safer than passwords because it cannot be brute-forced and no password is sent over the network.
- **fail2ban**: a service that monitors logs and automatically bans IP addresses that fail authentication too many times.
- **Bastion / jump host**: a hardened intermediary server at the entry point, used to SSH into internal servers that are not directly connected to the Internet.
- **ProxyJump**: an SSH option to route through a bastion automatically, without SSH-ing twice manually.

### Step by step

**Step 1 — Generate an SSH key on the dev machine**
~~~bash
ssh-keygen -t ed25519 -C "dev@company.com" -f ~/.ssh/id_ed25519_company
~~~
This generates an Ed25519 key pair (modern, short, secure). You can skip the passphrase if you do not want to type it each time (or use ssh-agent to remember it).

**Step 2 — Push the public key to the server**
~~~bash
ssh-copy-id -i ~/.ssh/id_ed25519_company.pub loansvc@server-ip
~~~
This adds the public key to {{~/.ssh/authorized_keys}} of user {{loansvc}} on the server.

**Step 3 — Harden sshd_config** ({{/etc/ssh/sshd_config}})
~~~text
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers loansvc deploy
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 3
~~~
Explanation:
- **Port 2222**: move away from the default port 22 to reduce bot-scan noise (security through obscurity is not a primary control but helps).
- **PermitRootLogin no**: forbid direct root login; use a normal user and {{sudo}} if elevated privileges are needed.
- **PasswordAuthentication no**: allow only SSH keys, blocking password brute-force.
- **AllowUsers loansvc deploy**: only listed users are allowed; all others are denied.
- **MaxAuthTries 3**: at most 3 authentication attempts before disconnecting.
- **ClientAliveInterval/CountMax**: keep idle connections from being dropped.

After editing, restart: {{sudo systemctl restart sshd}}. **Keep an existing SSH session open to test before closing the old one**, to avoid locking yourself out.

**Step 4 — Install fail2ban**
~~~bash
sudo apt install fail2ban   # Debian/Ubuntu
~~~
Create {{/etc/fail2ban/jail.local}}:
~~~text
[sshd]
enabled = true
port = 2222
maxretry = 3
bantime = 1h
findtime = 10m
~~~
Restart fail2ban. It will ban an IP that fails more than 3 times within 10 minutes for 1 hour.

**Step 5 — Bastion and ProxyJump**
If the app server is not on the Internet, place it in a private subnet and expose only the bastion. From the dev machine:
~~~bash
ssh -J bastion-user@bastion-ip loansvc@app-private-ip
~~~
Or add to {{~/.ssh/config}}:
~~~text
Host app
  HostName app-private-ip
  User loansvc
  ProxyJump bastion-user@bastion-ip
  IdentityFile ~/.ssh/id_ed25519_company
~~~
Then you only need {{ssh app}}.

### In production
- Never allow PasswordAuthentication on a production server.
- Keep the bastion minimal: install only SSH, no web server, no app deployments, and keep OS and SSH patched.
- Run deployment/patch commands through the bastion: {{ssh -J bastion user@app sudo systemctl restart loan-service}}.
- Remove SSH keys of departing employees from {{authorized_keys}} immediately.

### Comparison table
| Measure | What it blocks | Deployment cost |
|---|---|---|
| SSH keys (no passwords) | Password brute-force, stolen passwords | Medium (key management) |
| PermitRootLogin no | Direct root login, privilege escalation | Low |
| AllowUsers | Logins from unwanted users | Low |
| fail2ban | SSH brute-force, port scanning noise | Low |
| Bastion/ProxyJump | Direct attacks on servers exposed to Internet | Medium (extra server) |

> Senior tip: In production, centralize your team's public keys in a repository and use tooling (for example Ansible, Terraform, or an SSH CA) to distribute and revoke keys automatically. Manually editing {{authorized_keys}} on every server quickly becomes messy and old keys never get removed. Log all SSH sessions ({{/var/log/auth.log}}) and send them to a SIEM for incident investigation.`,
    follow: [
      'Why use SSH keys instead of passwords on production servers?',
      'How do you check which IPs fail2ban has banned? (hint: fail2ban-client status sshd)',
      'When you cannot SSH into a server, what do you check and in what order: is sshd running, port, firewall, or wrong key?'
    ]
  },

  'devops-082': {
    q: 'What core networking concepts does a Java backend developer need to know: the OSI model, NAT, DNS (A/CNAME/TTL and why DNS changes do not take effect immediately), HTTP/HTTPS + TLS handshake, and what happens when an SSL certificate expires?',
    a: `**Summary:** Networking is the foundation every Java service depends on. A developer needs to understand the OSI model to know at which layer a failure occurs, NAT/DNS to understand why a service call reaches the wrong destination or why a DNS change has no effect yet, and TLS/HTTPS to understand why an API call fails with "certificate expired" or why the handshake is slow.

### Terms (explained on first use)
- **OSI (Open Systems Interconnection)**: a 7-layer model that divides networking (Physical, Data Link, Network, Transport, Session, Presentation, Application). HTTP lives at the Application layer, TCP at Transport, IP at Network.
- **NAT (Network Address Translation)**: translates a private IP of an internal machine to a router's public IP when going to the Internet, and back. Machines in the same VPC/internal network use private IPs; outbound traffic uses the NAT gateway's public IP.
- **DNS (Domain Name System)**: resolves a domain name ({{api.company.com}}) to an IP. An **A record** maps a name to an IP, a **CNAME** maps a name to another name, and **TTL** (Time to Live) is how long a record is cached (in seconds). A DNS change does not take effect immediately because clients/ISPs still cache the old record according to its TTL.
- **TLS (Transport Layer Security)**: encrypts HTTP into HTTPS. The TLS handshake is the process where client and server negotiate encryption keys before transmitting data.
- **SSL/TLS certificate**: a digital document that proves ownership of a public key and has an expiration date. When it expires, browsers/API clients report an error and the connection is rejected.

### Step by step

**DNS: checking and understanding TTL**
~~~bash
dig api.company.com +noall +answer
nslookup api.company.com
~~~
The A record result includes a TTL (for example 300 seconds = 5 minutes). If you change the IP and requests still go to the old one, that is because the TTL has not expired or a client/ISP is still caching. Mitigation: lower the TTL before the change (for example to 60 seconds), wait for one old TTL period, then change the IP. Use {{dig +trace}} to see the full resolution path.

**TLS handshake: the steps**
1. The client sends {{ClientHello}} (TLS version, supported ciphers).
2. The server sends {{ServerHello}}, its certificate (public key), and may request a client certificate.
3. The client verifies the certificate (CA roots), generates a pre-master secret, encrypts it with the server's public key, and sends it.
4. Both sides derive a session key from the pre-master secret and encrypt subsequent data with it.
The handshake costs at least two network round trips, so it becomes slow with high latency (for example cross-continent calls over VPN). Use HTTP keep-alive / connection pooling to reuse connections and avoid a handshake per request.

**Expired certificate**
Check expiration dates:
~~~bash
echo | openssl s_client -connect api.company.com:443 2>/dev/null | openssl x509 -noout -dates
~~~
The output shows {{notBefore}} and {{notAfter}}. If {{notAfter}} has passed, clients get a {{certificate expired}} error. Fix: renew the certificate (Let's Encrypt: {{certbot renew}}, or auto-renew via AWS ACM/Cloudflare), then reload the service (Nginx/Java keystore). Monitor with alerts 30/14/7 days before expiry.

**NAT: when to use it**
A machine in a private subnet has no public IP and needs to call an external API — it goes through a NAT gateway. But calling a service in the same VPC through NAT is a bad design (adds cost and latency). Use VPC endpoints (S3, DynamoDB) or private links instead of NAT for internal traffic.

### In production
- "Certificate expired" errors often happen because renewal was forgotten or CI did not deploy the new certificate. Automate renewal and alert early.
- Slow TLS handshake — check latency between client and server, enable keep-alive, and use connection pools (HikariCP for DB, HttpClient for REST).
- DNS change not effective — check TTL, flush caches ({{ipconfig /flushdns}} on Windows, {{systemd-resolve --flush-caches}} on Linux), and inspect CoreDNS logs if running in K8s.
- API calls timing out — use {{traceroute}} / {{mtr}} to see which layer is slow, and check security groups/NACLs (firewalls) and the NAT gateway.

### Comparison table
| Concept | OSI layer | Used for |
|---|---|---|
| IP / NAT | Network | locating machines, translating private/public IPs |
| TCP / TLS | Transport | reliable connections, encryption |
| HTTP / HTTPS | Application | web/API application protocol |
| DNS | Application | resolving names to IPs |

> Senior tip: When debugging "API call failed", do not assume it is a Java code bug. Work layer by layer: {{ping}} (ICMP, may be blocked), {{telnet host port}} / {{nc -vz host port}} (check if the TCP port is open), {{curl -v}} (see TLS handshake and HTTP response), {{dig}} (DNS). The issue is often a security group blocking the port, an expired certificate, or DNS pointing to the wrong place — not your code.`,
    follow: [
      'What is TTL and why does a DNS/IP change not take effect immediately?',
      'How long does a TLS handshake take and how do you reduce handshake cost on high-latency paths?',
      'What error does a Java HTTPS client get when an SSL certificate expires, and how do you fix it?'
    ]
  },

  'devops-083': {
    q: 'When placing a reverse proxy and load balancer (Nginx/HAProxy) in front of a Java application, how do you configure health checks, sticky sessions, timeouts, and what are the X-Forwarded-* headers used for?',
    a: `**Summary:** A reverse proxy (Nginx/HAProxy) sits in front of a Java app, receives client requests, and forwards them. It terminates TLS, distributes load across instances (load balancing), checks health so it does not send traffic to dead instances, can pin a user to the same instance (sticky session) when needed, and sets appropriate timeouts. X-Forwarded-* headers let the Java app see the real client information (IP, protocol, host) instead of the proxy's IP.

### Terms (explained on first use)
- **Reverse proxy**: a server that receives requests from clients and forwards them to backend servers (Java apps), the opposite of a forward proxy.
- **Load balancer (LB)**: distributes requests across multiple backend instances to avoid overloading a single machine.
- **Health check**: the LB periodically calls an endpoint (for example {{/actuator/health}}) on an instance; if it returns an error or does not respond, the LB stops sending traffic to that instance.
- **Sticky session (session affinity)**: the LB routes a specific user to the same instance (using a cookie), needed when the app stores session in local memory (not recommended — use Redis instead).
- **X-Forwarded-For / X-Forwarded-Proto / X-Forwarded-Host**: headers added by the proxy so the backend knows the real client IP, protocol (http/https), and original host.

### Step by step

**Nginx as reverse proxy + health check** ({{/etc/nginx/conf.d/loan.conf}})
~~~text
upstream loan_backend {
    least_conn;
    server 10.0.1.10:8080;
    server 10.0.1.11:8080;
    health_check interval=5s fails=3;
}

server {
    listen 80;
    server_name api.company.com;

    location / {
        proxy_pass http://loan_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /actuator/health {
        proxy_pass http://loan_backend;
        access_log off;
    }
}
~~~
Explanation:
- **upstream / least_conn**: backend group, distributed by least connections.
- **server ... weight**: you can add {{weight=2}} for a stronger machine.
- **health_check**: Nginx Plus has this directive; with open-source Nginx use {{proxy_next_upstream}} and {{max_fails}} instead of built-in active health checks.
- **proxy_set_header X-Forwarded-For**: appends the client IP to the list; the backend takes the first element as the real client IP.
- **proxy_set_header X-Forwarded-Proto $scheme**: tells the app whether the client used http or https (important when Nginx terminates TLS and the app sees http).
- **proxy_connect_timeout/send_timeout/read_timeout**: timeouts for connecting/sending/reading to the backend. Use 30s for typical APIs, longer for report exports.

**Spring Boot reading X-Forwarded-***
Add to {{application.properties}}:
~~~text
server.forward-headers-strategy=framework
~~~
Spring will use X-Forwarded-For/Proto/Host to build the correct {{HttpServletRequest}} (getRemoteAddr, getScheme, getServerPort). Without this, the app sees Nginx's IP ({{127.0.0.1}}) and scheme http even if the client used https — causing wrong redirects, wrong audit logs, and Secure cookies not being sent.

**Sticky session (only when truly needed)**
~~~text
upstream loan_backend {
    sticky cookie route;
    server 10.0.1.10:8080 route=instance1;
    server 10.0.1.11:8080 route=instance2;
}
~~~
Nginx Plus uses the {{route}} cookie. Note: sticky sessions make scaling and draining instances harder (sessions are lost when an instance goes down). Prefer storing sessions in Redis (Spring Session) and using round-robin/least_conn with no sticky sessions.

### In production
- The health check endpoint should be lightweight (no heavy DB queries) and return 200 quickly. Spring Boot Actuator {{/actuator/health}} can be configured to expose only an aggregate status.
- Do not set timeouts too long: 30s-60s read timeout for APIs; if too long, clients disconnect while the LB keeps waiting. Use non-blocking/async for long tasks.
- Open-source Nginx lacks full active health checks; you can use {{max_fails=3}} {{fail_timeout=30s}} on each upstream server to automatically exclude unresponsive instances.
- X-Forwarded-For can be spoofed (a client can send a fake header). The backend should only trust the element added by the nearest trusted proxy, or configure trusted proxies (set_real_ip_from).

### Comparison table
| Feature | Nginx open-source | HAProxy | Nginx Plus |
|---|---|---|---|
| Reverse proxy | Yes | Yes | Yes |
| Load balancing | round-robin, least_conn, ip_hash | More algorithms | More algorithms |
| Health check | Limited (max_fails) | Detailed built-in | Full built-in |
| Sticky session | ip_hash | Cookie/table | Cookie |

> Senior tip: Do not pin sessions to instances (sticky sessions) unless absolutely necessary. Each Java instance should be stateless: sessions in Redis, files in S3/minIO, uploads sent directly to storage. When stateless, any LB algorithm works, scaling instances up/down does not affect users, and rolling deploys do not drop sessions. X-Forwarded-Proto is a classic pain point: if wrong, Spring Security redirects to http instead of https and Secure cookies are not sent.`,
    follow: [
      'What is X-Forwarded-Proto used for, and what breaks in Spring Boot if it is wrong?',
      'What should a health check endpoint verify so it does not overload the database?',
      'Why prefer stateless design (sessions in Redis) over sticky sessions?'
    ]
  },

  'devops-084': {
    q: 'How do you configure firewalls (ufw/iptables/security groups), VPNs, and IP whitelisting so a Java application can securely connect to a database and call partner/bank APIs?',
    a: `**Summary:** A firewall should allow only required ports (app listens on 8080, SSH on 2222, DB on 5432 only from the app server), using security groups (AWS) or ufw/iptables (Linux). A VPN creates an encrypted tunnel to a partner/bank network, and IP whitelisting allows only registered IPs to call our API. Combine all three: run the Java app in a private subnet, allow DB access only via security group rules, and call partners over an IPsec VPN with IP whitelists on both sides.

### Terms (explained on first use)
- **Firewall**: a packet filter that allows or denies connections based on port, IP, and protocol.
- **ufw (Uncomplicated Firewall)**: an easy-to-use wrapper around iptables (Debian/Ubuntu).
- **iptables**: the Linux kernel firewall with rule chains (INPUT/OUTPUT/FORWARD).
- **Security group (SG)**: a virtual cloud firewall (AWS/VPC) attached to an instance ENI; it is stateful (return traffic is automatically allowed).
- **VPN (IPsec/Site-to-Site)**: an encrypted tunnel connecting two private networks over the public Internet.
- **IP whitelist**: a list of IPs allowed to access a resource; all other IPs are denied.

### Step by step

**ufw on a Linux server (app/DB VM)**
~~~bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp        # SSH (changed port)
sudo ufw allow 8080/tcp        # Java app listens
sudo ufw allow from 10.0.1.0/24 to any port 5432   # only app subnet can reach PostgreSQL
sudo ufw enable
~~~
Explanation: by default deny all inbound connections except allowed rules. Open only 2222 (SSH), 8080 (app), and 5432 (DB) — and only from the app subnet. Never expose 5432 to the whole Internet.

**iptables (if ufw is not available)**
~~~bash
sudo iptables -A INPUT -p tcp --dport 2222 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
sudo iptables -A INPUT -p tcp -s 10.0.1.0/24 --dport 5432 -j ACCEPT
sudo iptables -A INPUT -j DROP
~~~
Rules are evaluated top to bottom, so order matters. The final {{DROP}} makes the default deny.

**AWS security groups (EC2/EKS)**
- SG-app: inbound 8080 from SG-loadbalancer, 2222 from the bastion IP, 5432 from SG-app (do not open 0.0.0.0/0).
- SG-db: inbound 5432 only from SG-app.
SGs are stateful: if you allow inbound 8080, response traffic outbound is automatic.

**IPsec VPN to a partner/bank**
Configure on a gateway/router (for example strongSwan, AWS Site-to-Site VPN, Cisco ASA):
~~~text
left=203.0.113.10        # our public IP
leftsubnet=10.0.0.0/16   # our internal network
right=198.51.100.5       # partner public IP
rightsubnet=172.16.0.0/16 # partner network
ike=aes256-sha2-modp2048
esp=aes256-sha2
~~~
Once the tunnel is up, the Java app calls the partner API via a private IP ({{172.16.x.x}}) instead of a public IP, with all traffic encrypted.

**IP whitelisting for our API**
If a partner calls our API, allow only the partner's IP:
~~~bash
# ufw
sudo ufw allow from 203.0.113.50 to any port 8443   # partner IP calling secure API
~~~
Or in Nginx:
~~~text
allow 203.0.113.50;
deny all;
~~~
On AWS, set security group inbound 8443 to only the partner IP (or a prefix list).

### In production
- Never open DB ports (5432, 1433, 1521, 3306) or Redis (6379) to 0.0.0.0/0 on the public Internet. Allow only from the app SG.
- Use security-group-to-security-group references (AWS) instead of hard-coding IPs, because instance IPs can change.
- Partner IP whitelists must have an approval process and periodic review (remove unused IPs).
- If the VPN tunnel goes down, calls to the partner fail. Monitor tunnel status and have a fallback path (a second VPN or a public API with mTLS).
- Verify what the firewall blocks: {{sudo ufw status numbered}}, {{sudo iptables -L -n -v}}, AWS VPC flow logs, security group rules.

### Comparison table
| Tool | Where used | Stateful? | Key commands |
|---|---|---|---|
| ufw | Linux VM (Ubuntu/Debian) | Yes | ufw allow/deny |
| iptables | Linux VM (all distros) | Yes | iptables -A |
| Security group | AWS/VPC cloud | Yes | AWS console/CLI |
| IPsec VPN | Connect two private networks | Yes | strongSwan, AWS VPN |

> Senior tip: "Open a port to test and forget to close it" is a common cause of data leaks. Apply least privilege: close everything, then open only the required (source, destination, port) pairs. In AWS, reference security groups as sources instead of wide CIDRs, and tag each rule with {{Owner}}/{{Ticket}} so you know who requested it and when to review. Every firewall change should go through a change request with a rollback plan.`,
    follow: [
      'Why should you never open a DB port (5432) to 0.0.0.0/0 on the public Internet?',
      'How does a security group differ from iptables/ufw, and when do you use each?',
      'How should you periodically review partner IP whitelists to avoid stale IPs?'
    ]
  },

  'devops-085': {
    q: 'At scale, how do you implement an SSH bastion/jump host with ProxyJump: auditing who SSHed into which server, and hardening the bastion so it does not become the main attack target?',
    a: `**Summary:** A bastion (jump host) is the single entry point for managing servers in private subnets that are not directly exposed to the Internet. Use ProxyJump to SSH through the bastion transparently. At scale, you need centralized key management, auditing of all commands executed, and bastion hardening so it does not become a "master key" target.

### Terms (explained on first use)
- **Bastion / jump host**: an intermediary server at the entry point (public subnet or DMZ), used to SSH into internal servers. The bastion does not run apps; it only allows SSH pass-through.
- **ProxyJump (-J)**: an SSH option that automatically connects through a bastion, so the user runs a single SSH command instead of SSH-ing to the bastion and then to the app.
- **SSH audit**: recording who, when, from which IP, and what commands were run on which server (used for incident investigation and compliance).
- **Hardening**: configuring to reduce the attack surface (disable unnecessary services, restrict users, keep the kernel patched).

### Step by step

**Configure the bastion**
~~~text
# /etc/ssh/sshd_config on the bastion
PermitRootLogin no
PasswordAuthentication no
AllowGroups sshusers
MaxAuthTries 3
ForceCommand internal-sftp   # if only SFTP is needed, or leave empty for a shell
ClientAliveInterval 300
~~~
Create the {{sshusers}} group and add only admins. The bastion should allow SSH in, and only allow SSH out to the app private subnet.

**ProxyJump from the dev machine**
~~~bash
ssh -J bastion-user@bastion-ip loansvc@app-private-ip
~~~
Or in ~/.ssh/config:
~~~text
Host app-private
  HostName 10.0.1.10
  User loansvc
  ProxyJump bastion-user@bastion.company.com
  IdentityFile ~/.ssh/id_ed25519_company
~~~
Then you only need {{ssh app-private}}.

**Port forwarding through the bastion (reach a DB from dev via the app)**
~~~bash
ssh -J bastion-user@bastion-ip -L 5432:db-private:5432 loansvc@app-private-ip
~~~
This opens local port 5432 on the dev machine, tunneling through bastion + app to the internal DB. Useful for running psql/DBeaver from dev without exposing the DB to the Internet.

**Auditing SSH**
- Install {{auditd}} on the bastion and app servers to record SSH, sudo, and command execution events.
- Or use {{sshd}} with {{LogLevel VERBOSE}} to log to {{/var/log/auth.log}}: user, IP, time, success/failure.
- To record full sessions (like a screen recording), use {{ttyrec}} or {{script}} wrapping the shell, or commercial solutions (Teleport, StrongDM).
- Send logs to a SIEM/ELK and retain them for at least 6-12 months (depending on banking regulations).

**Centralized key management**
Do not manually add public keys to {{~/.ssh/authorized_keys}} on every server. Use:
- **SSH CA (certificate authority)**: sign SSH keys with a CA; servers trust the CA and keys expire automatically (no manual removal when someone leaves).
- **Ansible/Terraform**: distribute and revoke public keys automatically via IaC.
- **Teleport/StrongDM**: centralized access management, session audit, no manual SSH key handling.

### In production
- The bastion runs no apps, no web server, and holds no business data. Only SSH, auditd, and OS patches.
- Restrict source IPs that can SSH into the bastion (security group/ufw allows only office/VPN IPs).
- Disable X11Forwarding and AgentForwarding if not needed (reduces key-forwarding risk).
- Remove keys of departing employees immediately: if using an SSH CA, keys expire; if using authorized_keys, delete entries and review all servers.
- Log commands (auditd/ttyrec) and alert on dangerous commands ({{rm -rf}}, {{chmod 777}}, {{sudo su}}) in production.

### Comparison table
| Approach | Advantages | Disadvantages |
|---|---|---|
| Manual authorized_keys | Simple, no extra tooling | Hard to revoke, stale keys remain valid |
| SSH CA | Keys expire, centralized management | Requires CA setup, extra knowledge |
| Teleport/StrongDM | Session audit, MFA, no manual keys | Depends on third-party service, cost |

> Senior tip: The bastion is the "master key" to your entire internal system. If an attacker compromises the bastion, they can SSH into every app server. Harden it more than your app servers: require MFA, allow only whitelisted IPs, record full sessions, and never store secrets or code on the bastion. Treat it like a bank's main entrance — open only to authorized people and log everyone who enters and leaves.`,
    follow: [
      'How does ProxyJump differ from SSH-ing twice manually (bastion then app)?',
      'How do you record all commands run through the bastion for incident investigation?',
      'What does an SSH CA provide compared to manually managed public keys in authorized_keys?'
    ]
  },

  'devops-086': {
    q: 'How do you respond to a Linux production incident (slow server, Java app OOM/crash): using systemd resource limits, reading load average/free/iostat/ss, analyzing with journalctl, and running a recovery runbook?',
    a: `**Summary:** When a production server is slow or a Java app OOMs/crashes, a lead must quickly analyze layers: system (CPU/RAM/IO/network), service (systemd status/logs), and application (Java heap/GC/thread dump). Use {{systemctl}} resource limits to prevent one app from consuming the whole machine, use journalctl to review incident history, and execute a recovery runbook (restart, scale, rollback) in a controlled way.

### Terms (explained on first use)
- **Load average**: the average number of processes running or waiting for CPU/IO over 1, 5, and 15 minutes (seen via {{uptime}}). A number higher than the CPU core count means the machine is overloaded on CPU or waiting on IO.
- **free**: shows used/free/cached RAM ({{free -h}}). Low free RAM is not necessarily a problem (Linux uses RAM for cache); look at available.
- **iostat**: shows disk performance (read/write, throughput, utilization, await). Requires the {{sysstat}} package.
- **ss**: shows sockets/listening ports ({{ss -tlnp}}), replacing netstat.
- **OOM Kill**: the Linux kernel kills a process when RAM is exhausted (seen in {{dmesg}} or journalctl with an "Out of memory: Kill process" message).
- **systemd resource limits**: {{MemoryMax}}, {{CPUQuota}}, {{LimitNOFILE}} in a unit file constrain what a single service can consume.

### Step by step

**Step 1 — Detect a slow server**
~~~bash
uptime                  # load average over 1/5/15 minutes
free -h                 # RAM, swap
iostat -x 1             # IO wait (high await = slow disk)
ss -tlnp | grep :8080   # is the Java app listening, see PID
~~~
If load average is much higher than the CPU core count and iostat await is high — the disk is slow (heavy logging, swap thrashing). If load is high but iostat looks normal — CPU bottleneck (Java GC, infinite loop).

**Step 2 — Inspect the Java service via systemd**
~~~bash
systemctl status loan-service          # state, PID, last command
journalctl -u loan-service --since "1 hour ago"   # app logs, look for OOM/Exception
journalctl -u loan-service -n 200 --no-pager      # last 200 lines, no pager
~~~
Look for {{OutOfMemoryError}}, {{GC overhead limit exceeded}}, or process killed messages (OOM Killer).

**Step 3 — Java diagnostics**
~~~bash
# Get the Java PID
pid=$(pgrep -f loan-service.jar)
# Heap histogram
jmap -histo:live $pid | head -30
# Thread dump (find deadlocks, stuck threads)
jstack $pid > /tmp/threaddump.txt
~~~
If the app has already crashed, you cannot take a jstack. Check journalctl for stack traces near the crash time.

**Step 4 — Resource limits (prevent consuming the whole machine)**
Edit the unit file and add under [Service]:
~~~yaml
MemoryMax=2G
MemorySwapMax=0
CPUQuota=50%
LimitNOFILE=65536
~~~
Then {{sudo systemctl daemon-reload}} && {{sudo systemctl restart loan-service}}. This prevents a large Java heap from exhausting machine RAM, and CPUQuota prevents one instance from using all CPU.

**Step 5 — Recovery runbook**
1. **Restart the service**: {{sudo systemctl restart loan-service}}, verify with {{systemctl status}}.
2. **If it still crashes**: roll back to the previous (known stable) version, then investigate.
3. **If the server is completely overloaded**: stop non-critical services, or scale out additional instances behind the LB (if available).
4. **After recovery**: write an incident report (root cause, impact, remediation, prevention) and update the runbook.

### In production
- Do not blindly restart a service that is processing financial transactions: check for in-flight transactions (thread dump), and consider draining via the LB before restarting.
- OOM is often caused by a heap set too large (Xmx too close to machine RAM), a memory leak, or too many threads. Tune {{-Xms}} {{-Xmx}} to available RAM (leave 20-30% for OS/cache).
- Swap enabled on a Java server is usually harmful (GC inside swap is very slow). Consider disabling swap or using {{MemorySwapMax=0}} in systemd.
- journalctl logs may be lost on reboot unless persistent storage is configured ({{Storage=persistent}} in {{/etc/systemd/journald.conf}}). Enable persistence to review logs after reboot.

### Comparison table
| Symptom | Suspected cause | Tools to check |
|---|---|---|
| High load, high iostat await | Slow disk, swap thrashing | iostat, dmesg, journalctl |
| High load, high CPU, normal RAM | Java GC, infinite loop, stuck threads | top, jstack, jmap |
| App crash, log "Out of memory" | Heap too small, memory leak | journalctl, jmap -histo |
| Cannot connect to app | Port not listening, firewall | ss -tlnp, ufw status |

> Senior tip: A runbook must be written and **rehearsed before an incident**, not drafted at midnight while the server is down. Each runbook should specify: who to call, commands in order, rollback criteria, and when to escalate to DBA/infra. Systemd resource limits are a safety guardrail for when a Java app goes "rogue" (for example a loop creating log files) — set them in advance; configuring during an incident is too late.`,
    follow: [
      'Load average is high but CPU/RAM look normal — what could cause this, and which commands do you use? (hint: iostat, ss, thread dump)',
      'What is the Linux OOM Killer, and what signs in journalctl confirm the app was OOM-killed?',
      'Why set MemoryMax and CPUQuota in a systemd unit file for a Java service?'
    ]
  }
});
