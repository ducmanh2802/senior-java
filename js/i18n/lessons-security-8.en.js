/*
 * English translation of js/data/lessons-security.js — task T1027. Format: js/core/i18n.js (content overlay).
 * ids: lesson-security-009
 */
App.i18n.content({
  'lesson-security-009': {
    title: 'SSRF: why letting the server fetch a user-supplied URL is dangerous, and how to validate URLs correctly at the application layer',
    goals: [
      'Explain SSRF using a very ordinary feature (fetching an avatar by URL) and list what an attacker can reach when the server sends requests on their behalf',
      'Read CIDR notation and know why you must block 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.169.254',
      'List the common bypasses: IP literals and decimal/hexadecimal numeric forms, DNS rebinding (TOCTOU), redirects, and hostnames that encode an IP',
      'Write a URL validation routine in the right order: parse, scheme allowlist, hostname format, domain allowlist, resolve then check every IP',
    ],
    body: `**Summary:** **SSRF** (Server-Side Request Forgery) is a vulnerability that lets a user supply **a URL that the server itself will fetch**. The server sits in a privileged position: inside the VPC, close to internal Redis/Adminer/Elasticsearch, and it often has an **IAM role attached to the instance** so it can call AWS without carrying any keys. So something that looks harmless — "paste an avatar image link" — turns into: scanning internal ports, reading {{http://169.254.169.254/...}} to obtain credentials, or taking down an internal service. How to block it: **allowlist the scheme**, **reject IP literals and every numeric form**, **allowlist hostnames**, **resolve and then check every IP** to see whether it belongs to an internal/link-local range, and **do not let the HTTP client follow redirects on its own**.

### Which features open the door to SSRF

These places almost always exist in an app and are all equally dangerous:

- "Fetch a profile picture from a URL" / image proxy / thumbnailer: the app {{GET}}s a URL supplied by the user, reads the response, and returns it.
- Webhooks and "test connection" for integrations (Stripe-like, Zapier-like): the user enters a destination URL and the server hits a **Test** button to try calling it.
- Importing data from a URL: import CSV/XML from a link, {{@Import(url)}}.
- A PDF/HTML renderer from a template that contains {{<img src="http://169.254.169.254/..."}}> — headless Chrome follows the link and sends the result back to the attacker through the rendered error output.
- Health checks / crawlers / link previews (showing the title and image when a URL is shared).

The common point: **the server is the one making the connection**, so the targets it can reach are not the internet but your internal network.

### Why it is more dangerous than an ordinary data-leak bug

In the cloud, every EC2/GCE instance has a **metadata service** — a web server that listens only on the link-local address {{169.254.169.254}}, whose job is to tell that instance who it is and to issue **temporary credentials**. On AWS:

~~~text
GET http://169.254.169.254/latest/meta-data/iam/security-credentials/<role-name>
->  { "AccessKeyId": "ASIA...", "SecretAccessKey": "...", "Token": "...", "Expiration": "..." }
~~~

Many applications attach a broad role (full S3, full DynamoDB) to the instance. If SSRF can read that JSON, the attacker now has **valid keys**, often still usable for a few hours, and they can be used from the attacker's own machine. That is why an "image fetch" endpoint is ranked among the most severe issues rather than treated as a minor bug.

Attackers also use SSRF as an **internal port scanner**: call {{http://127.0.0.1:6379/}} (Redis), {{:9200}} (Elasticsearch), {{:8500}} (Consul), {{:2375}} (Docker daemon), and tell "port open / port closed" apart by the latency or by the {{Connection refused}} error message the app returns. With Redis, a single plain-text request is enough to write a file and escalate privileges — which is why internal text-based protocols must never be exposed to a user-chosen URL.

### CIDR in 60 seconds, and which ranges must be blocked

{{10.0.0.0/8}} reads as "every address whose first 8 bits are fixed", meaning every IP that starts with {{10.}} — the largest private range of the internal network. The number after {{/}} is the count of fixed bits. The table below lists the ranges that are **not the internet** and must be blocked when validating an IP ({{a.b.c.d}} are four numbers 0–255):

| Range | Meaning | Why it must be blocked |
|---|---|---|
| {{0.0.0.0/8}} | "this host on this network", {{0.0.0.0}} itself | Some stacks route it to localhost; it is not a public address |
| {{10.0.0.0/8}} | private | Internal network, databases, services |
| {{100.64.0.0/10}} | CGNAT (carrier-grade NAT) | the range most often forgotten; used by both overlay networks and ISPs |
| {{127.0.0.0/8}} | loopback | the very machine running the app — admin ports |
| {{169.254.0.0/16}} | link-local | **cloud metadata** ({{169.254.169.254}}) |
| {{172.16.0.0/12}} | private | DB subnets |
| {{192.0.0.0/24}}, {{192.0.2.0/24}} | IETF reserved / TEST-NET | not routable, certainly not a real destination |
| {{192.168.0.0/16}} | private | a common internal network |
| {{198.18.0.0/15}} | benchmarking | not a real destination |
| {{224.0.0.0/4}} and above | multicast + reserved | not unicast |

> Note: there is **no** {{192.168.0.0/16}} range that is "safe to call", and there is no range that is "just for reference". Blocking means blocking the whole range, not blocking a handful of familiar addresses.

### Bypasses that a naive filter misses

This is the part interviewers love to dig into the most. Suppose the code only checks whether the URL string contains "{{localhost}}" or "{{127.0.0.1}}":

~~~text
http://127.1/                     shorthand, still loopback
http://2130706433/                the same 127.0.0.1 written as a decimal number
http://0x7f000001/                hexadecimal form
http://017700000001/              octal form
http://0000:0000:0000:0000:0000:ffff:127.0.0.1/  IPv6-mapped IPv4
http://[::1]/                     IPv6 loopback literal
http://169.254.169.254.nip.io/    a public DNS service: a hostname that embeds an IP and resolves to that exact IP
http://sub.example.com/           a normal hostname, but its zone points to 10.0.0.5
~~~

The lesson: **do not try to parse every variant of an address** — it is easier to get wrong than to block. Two rules collapse the whole list above:

1. **Do not accept IP literals or numeric-looking hosts.** A hostname must consist of lowercase labels {{a-z0-9-}} separated by dots, and **it must not have every label made up entirely of digits**. Everything like {{10.0.5.9}}, {{2130706433}}, {{017700000001}}, {{[::1]}} is rejected immediately — even if it is a valid public IP. That is why the exercise below returns {{BAD_URL}} for {{http://10.0.5.9/}} rather than {{PRIVATE_IP}}. A single label such as {{localhost}} is still allowed through, because it only has meaning after resolution — and it is the resolution step that will return {{127.0.0.1}}.
2. **For hostnames, you must resolve and then check the addresses you get back**, because a hostname is something the user (or their DNS) controls.

{{0x7f000001}} is a nice example: because it contains letters, it passes the format step, but the resolver will return {{127.0.0.1}} and it gets blocked at the IP-check step — defense in layers, with each layer catching a different part.

### Redirects and DNS rebinding: checking twice can give two different results

**Redirect**: you check the user-supplied URL, see that it is public, send the request, the destination server returns {{302}} with {{Location: http://169.254.169.254/...}}, and the HTTP client **follows it on its own** — this time nobody checks. {{java.net.http.HttpClient}} defaults to {{Redirect.NEVER}}, while {{HttpURLConnection}} ({{URL.openConnection}}) follows redirects within the same protocol by default. The fix: set {{followRedirects(NEVER)}}, read {{Location}} yourself, and run the **entire** validation routine for every hop, with a maximum hop count.

**DNS rebinding** is more dangerous because it breaks the very assumption "checked once means done":

~~~seq
title: DNS rebinding - two resolves, two results
actors: Attacker | App | DNS | Metadata
Attacker -> App: fetch image at http://evil.com/a.png
App -> DNS: resolve evil.com
DNS --> App: 1.2.3.4 (public, valid)
note App..DNS: TOCTOU: checked, not connected yet
App -> DNS: resolve evil.com again at connect time
DNS --> App: 169.254.169.254 (TTL = 0)
App -> Metadata: GET /latest/meta-data/iam/security-credentials
Metadata --> App: AccessKeyId, SecretAccessKey, Token
App --> Attacker: 200 OK (and the image is now in logs/response)
~~~

The {{evil.com}} zone has TTL 0, so the second resolve returns a different address: you checked a public IP, then connected to an internal IP. This is a **TOCTOU** (time-of-check to time-of-use) bug. It cannot be closed by "just resolve once" if the client resolves again when it connects. Three ways to close it, ranked by reliability:

1. **Do not let the app reach the internet directly.** Routing/NetworkPolicy/an egress proxy in the DMZ only allows a specific set of destinations. This is the only layer that does not depend on code.
2. **Pin the IP**: resolve to get the address, check it, then tell the client to connect to **that exact checked address** and send the {{Host}} header yourself. This is possible with Apache HttpClient ({{HttpClientBuilder.setDnsResolver}}) or OkHttp ({{Dns}}); {{java.net.http.HttpClient}} has no hook for it, so either switch clients or accept layer 1.
3. **A strict domain allowlist** ({{*.example.com}} where you control the zone) — in that case the attacker has no DNS of their own to flip.

> Senior tip: on AWS, enable **IMDSv2** ({{MetadataOptions.HttpTokens = required}}) so the token must be requested with a {{PUT}} that carries a session and is blocked by the **hop limit** — a request coming from a proxy/container often cannot reach the metadata service anymore, even when there is SSRF. Also set {{MetadataOptions.HttpPutResponseHopLimit = 1}} and keep the hop limit low at the instance level. This is "reducing the blast radius", not "fixing SSRF": {{user-data}} is still readable and the entire internal network is still scannable.

### A URL validation routine, in order

Write it in exactly this order and return a **distinct error code for each step**, because that is also the order you will explain in an interview:

1. Parse with {{java.net.URI}}, catching exceptions. Reject if not absolute, missing a host, or carrying {{userinfo}} ({{http://safe.com@evil.com/}} — the part before {{@}} is userinfo, the real host is {{evil.com}}).
2. **Scheme allowlist**: usually only {{http}}, {{https}}. {{file}} reads the filesystem, {{gopher}}/{{dict}} talk to Redis/memcached, {{jar}}/{{netdoc}} are legacy Java handlers.
3. **Hostname format**: lowercase, valid labels, no all-digit label, no IPv6 literal, no spaces/underscores/odd characters.
4. **Domain allowlist** (if you have one): compare against the normalized host; allow only {{host == d}} or {{host.endsWith("." + d)}}. Check this **before** resolving, because it is the cheapest filter.
5. **Resolve and check every address**: no records → fail; any address that falls into the ranges in the table above → fail. Do not check only the first IP.
6. When making the call: connection timeout and read timeout, a maximum redirect count and re-validate every redirect, a response size limit, and a **generic error message** for the user ({{Connection refused to 10.0.0.5:5432}} in the response is a free port scanner).

| Validation approach | What it blocks | Bypassed by |
|---|---|---|
| {{contains("localhost")}}, string blacklist | little | every IP form, {{127.1}}, {{nip.io}}, {{.local}} |
| A regex that "looks like a URL" | a bit | IP literals, redirects, rebinding |
| Parse + scheme + hostname + resolve + check IPs | most cases | DNS rebinding (TOCTOU), redirects if the client follows on its own |
| The above + a domain allowlist where you control the zone | more | an internal domain whose DNS is pointed wrongly, redirects outside the allowlist |
| The above + egress control at the network/proxy layer | **actually blocks it** | nothing (that is the point) |

> Senior tip: in a multi-tenant system, letting each tenant use their own URL must go through a **centralized egress proxy** (or a small service whose only job is to fetch): they declare a {{webhook_url}}, you only log "{{host}} was called", and you do not let other apps reach the outside. That fixes SSRF once for every feature, gives you data to audit who called what, and also blocks the "test connection" feature from being used as a port scanner.

### Interview notes
Opening question: "Does your app have any place where users enter a URL? Why is that dangerous?" — answer with the actual feature list above, not in vague terms. Follow-up: "I already block {{localhost}} and {{127.0.0.1}}, what is still missing?" — be able to name numeric IPs, {{nip.io}}, redirects, rebinding, metadata. Design question: "How do you allow customer webhooks and still stay safe?" — answer in layers: allowlist + resolve-and-check + never follow redirects automatically + egress control + IMDSv2, and state plainly which parts code cannot close on its own. Finishing the {{UrlGuard}} exercise below gives you source code you can point to for all three questions.`,
    exercises: [
      {
        title: 'Write UrlGuard: scheme allowlist, reject IP literals, domain allowlist, and check IPs after resolution',
        prompt: `Complete {{UrlGuard}} (JDK 17 only, **no network calls** — DNS is injected through {{Resolver}} so the tests stay deterministic). The two types below already exist in the file and you do not need to change them:

~~~java
enum Verdict { OK, BAD_URL, BAD_SCHEME, DOMAIN_NOT_ALLOWED, PRIVATE_IP, DNS_FAIL }
interface Resolver { List<String> lookup(String host); }   // empty/null = could not resolve
~~~

**{{UrlGuard(Resolver resolver, Set<String> allowedSchemes, Set<String> allowedDomains)}}** stores {{allowedSchemes}} and {{allowedDomains}} in lowercase (comparison is case-insensitive); a null or empty {{allowedDomains}} means **no domain restriction**.

**{{Verdict check(String url)}}** applies the steps in **exactly** this order:

1. {{url}} is null, blank, or its {{trim()}} cannot be parsed by {{new URI(...)}} → {{BAD_URL}}.
2. The URL is not absolute (missing scheme), or {{getHost()}} is null/blank → {{BAD_URL}}.
3. The scheme (lowercased) is not in {{allowedSchemes}} → {{BAD_SCHEME}}.
4. {{getUserInfo()}} is not null → {{BAD_URL}} (blocks {{http://safe.com@evil.com/}}).
5. Check the **hostname format**: convert to lowercase with {{Locale.ROOT}}, strip **one** trailing dot if present. Then:
   - empty, or starts with {{[}} (IPv6 literal) → {{BAD_URL}};
   - split by dot; each label must be 1–63 characters, contain only {{a-z}}, {{0-9}}, {{-}}, and must not start or end with {{-}}; an empty label → {{BAD_URL}};
   - if **every** label consists only of digits ({{10.0.5.9}}, {{2130706433}}, {{017700000001}}) → {{BAD_URL}}. This is the "reject IP literals and numeric-looking hosts" rule.
6. If {{allowedDomains}} is not empty: the host must **exactly equal** one domain in the list or **end with** a dot plus that domain ({{cdn.example.com}} matches {{example.com}}; {{example.com.evil.net}} does not). No match → {{DOMAIN_NOT_ALLOWED}}.
7. Call {{resolver.lookup(host)}} with the normalized host. Null or empty → {{DNS_FAIL}}. For **each** returned address: it must be four numeric labels, each label 1–3 digits with value 0–255; wrong shape → {{BAD_URL}}. If the address is **not** a public unicast address → {{PRIVATE_IP}}.
8. All addresses are public → {{OK}}.

**{{PRIVATE_IP}}** means any of these ranges: {{0.0.0.0/8}}, {{10.0.0.0/8}}, {{100.64.0.0/10}}, {{127.0.0.0/8}}, {{169.254.0.0/16}}, {{172.16.0.0/12}}, {{192.0.0.0/24}}, {{192.0.2.0/24}}, {{192.168.0.0/16}}, {{198.18.0.0/15}}, and any address whose first octet is {{>= 224}}. **Any single** violating address is enough for {{PRIVATE_IP}}.

Tip: split the work into three small helpers — normalize and validate the hostname, check {{allowedDomains}}, check one IPv4 address — so each step can be tested on its own.`,
        hints: [
          'Do not use {{InetAddress.getByName}}: it performs real DNS and has a cache, which makes the tests non-deterministic. Call {{resolver.lookup(host)}} and parse the four octets by hand.',
          'Normalize the hostname exactly once (lowercase with {{Locale.ROOT}}, strip one trailing dot) and use that form for both the allowlist and DNS — otherwise {{EXAMPLE.COM.}} and {{example.com}} become different results.',
          'To reject IP literals, check "every label consists only of digits" after splitting on dots; do not try to recognize {{2130706433}} by turning it into a number and comparing ranges.',
          'For labels: use {{split}} with limit {{-1}} so empty labels are preserved; otherwise {{a..b.com}} looks valid.',
          'For {{0x7f000001}}: it contains letters so it passes the format step, then gets blocked at the IP-check step — that is the point of defense in layers.',
        ],
        explain: `Four things you should be able to say in an interview after writing {{UrlGuard}}:

- **The order of the steps is part of the design.** Cheap filters (format, domain allowlist) come before the expensive one (resolve), which is why {{http://internal-db.corp}} with the {{example.com}} allowlist returns {{DOMAIN_NOT_ALLOWED}} rather than {{PRIVATE_IP}}. Wrong authorization/ordering is a classic source of "tests are green, production is red" bugs.
- **Rejecting IP literals is the right decision, not a lazy one.** Parsing every variant of an address ({{127.1}}, octal, IPv6-mapped) is very easy to get wrong; "do not accept numeric-looking hosts" cuts the whole list with one line, and in practice nobody puts an IP literal in a webhook.
- **The resolver must be a dependency.** This is what makes the exercise testable: the same hostname can return different addresses over time, so calling {{InetAddress}} directly makes tests both slow and non-deterministic. In a real app, the same reasoning leads to an architectural decision: allow **pinning** the checked address (OkHttp {{Dns}}, Apache {{setDnsResolver}}).
- **{{check}} returns an error code, not an exception for the user.** The {{BAD_URL}}-style message is for logging/metrics; the response to the client should be a generic error ("Invalid URL"), because each distinct message reveals a fact about the system inside.

The bugs this exercise still does **not** close — and you should say so plainly in an interview: DNS rebinding (checked at {{t0}}, connected at {{t1}}), and redirects. The first needs IP pinning or egress control at the network layer; the second needs {{followRedirects = NEVER}} and then running the whole {{check}} routine again for every {{Location}}.`,
      },
    ],
    check: [
      {
        q: 'The {{POST /avatar}} endpoint takes a {{url}} field, the server fetches the image at that URL and stores it in S3. Why is this a severe vulnerability even if it only reads a picture?',
        options: [
          'Because downloading images uses bandwidth',
          'Because the server sits inside the internal network and has an IAM role on the instance: it can be tricked into calling internal targets such as {{http://169.254.169.254/latest/meta-data/}} to obtain temporary credentials',
          'Because the image might contain a virus',
          'Because {{HttpClient}} does not support HTTPS',
        ],
        explain: 'The essence is **the server sending requests from a privileged position on behalf of the user**. The internal network, admin ports, and the metadata endpoint are all only reachable from the inside, so the attacker uses the app as a stepping stone. Bandwidth cost is a minor side effect; viruses are a different problem; HTTPS is always fine. On AWS you also enable IMDSv2 and a hop limit to reduce the blast radius, but you still have to fix the SSRF itself.',
      },
      {
        q: 'The current code blocks the URL if it contains the string {{localhost}} or {{127.0.0.1}}. Which of the payloads below **gets through**?',
        options: [
          'Only {{http://localhost:8080}} gets through',
          '{{http://2130706433/}} (the decimal form of 127.0.0.1), {{http://127.1/}}, {{http://[::1]/}} and {{http://abc.127.0.0.1.nip.io/}}',
          'None of them get through because the driver will normalize to {{127.0.0.1}} before connecting',
          'Only {{http://[::1]/}} gets through, because IPv6 has nothing to do with loopback',
        ],
        explain: 'A string blacklist only blocks the exact two forms that were written down. {{2130706433}}, {{0x7f000001}}, octal, {{127.1}}, and IPv6 {{[::1]}} are alternative ways to write the same place, and {{nip.io}} is a public DNS service that lets you embed an IP inside a hostname. Because the driver parses **after** the app has already decided to let it through, the string filter is not normalized for you. The right approach is to validate the format (reject numeric-looking hosts), then resolve and check the addresses.',
      },
      {
        q: 'You resolve {{evil.com}}, see {{1.2.3.4}} is public, and allow the connection — but the server still reads the metadata service. What is this bug and what is the most reliable fix?',
        options: [
          'There is no bug, the logs must be wrong',
          'SQL injection in the avatar query',
          'DNS rebinding (TOCTOU): the zone has a very short TTL so the resolve at connect time returns 169.254.169.254; the most reliable fix is egress control at the network layer/egress proxy, plus pinning the exact checked address',
          'The bug is in {{HttpClient}} and you just need to upgrade to the latest version',
        ],
        explain: 'Checking and using happen at **two different moments**; between them the attacker changes the DNS record, so the check result no longer applies. Upgrading the client does not change that. It can be fixed by connecting to **the exact checked address** (OkHttp {{Dns}}, Apache {{setDnsResolver}}) or by not letting the app reach the internet freely — the network layer does not depend on code, so it is more reliable.',
      },
    ],
  },
});
