#!/usr/bin/env bash
# Install the Java runner on a fresh Ubuntu 24.04 VM (Oracle Cloud Always Free, ARM or x86). See runner/README.md.
#   sudo bash setup.sh <RUNNER_TOKEN>
# Installs Docker + Node + Caddy, pulls the JDK 21 image, runs runner/server.js as a systemd service behind HTTPS
# (free certificate for <ip>.sslip.io), and opens ports 80/443 in the VM firewall.
set -euo pipefail
TOKEN=${1:?usage: sudo bash setup.sh <RUNNER_TOKEN>  (≥ 16 random characters)}
[ ${#TOKEN} -ge 16 ] || { echo "token must be at least 16 characters"; exit 1; }
cd "$(dirname "$0")"

export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q docker.io nodejs caddy curl iptables-persistent
systemctl enable --now docker

echo "== pulling eclipse-temurin:21-jdk (≈ 200 MB)"
docker pull -q eclipse-temurin:21-jdk

# Dedicated user; membership in the docker group is what lets it start containers.
id runner >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin runner
usermod -aG docker runner
install -d -o runner /opt/runner
install -m 644 server.js /opt/runner/server.js

cat > /etc/systemd/system/java-runner.service <<EOF
[Unit]
Description=Java code runner for Senior Java Prep
After=docker.service
Requires=docker.service

[Service]
User=runner
Environment=RUNNER_TOKEN=$TOKEN
Environment=RUNNER_PARALLEL=2
ExecStart=/usr/bin/node /opt/runner/server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
chmod 600 /etc/systemd/system/java-runner.service      # the token lives in this file
systemctl daemon-reload
systemctl enable --now java-runner

# Oracle's Ubuntu images block everything except SSH with iptables, even when the cloud security list allows it.
for p in 80 443; do
  iptables -C INPUT -p tcp --dport $p -j ACCEPT 2>/dev/null || iptables -I INPUT 1 -p tcp --dport $p -j ACCEPT
done
netfilter-persistent save

IP=$(curl -fsS https://ifconfig.me || curl -fsS https://api.ipify.org)
HOST="${IP//./-}.sslip.io"                               # sslip.io resolves 1-2-3-4.sslip.io to 1.2.3.4
cat > /etc/caddy/Caddyfile <<EOF
$HOST {
  reverse_proxy 127.0.0.1:8080
}
EOF
systemctl restart caddy

echo "== warming up (first container start is slower)"
sleep 5
curl -fsS -m 60 -X POST http://127.0.0.1:8080/run -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"source":"public class Main { public static void main(String[] a) { System.out.println(\"PASS xin chào\"); } }"}' || true
echo
echo "== done. In Vercel → Settings → Environment Variables add:"
echo "   RUNNER_URL   = https://$HOST"
echo "   RUNNER_TOKEN = (the token you passed to this script)"
echo "Check from your PC:  curl https://$HOST/health"
