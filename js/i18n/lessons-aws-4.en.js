/*
 * English translation of js/data/lessons-aws.js — task T811. Format: js/core/i18n.js (content overlay).
 * ids: lesson-aws-005
 */
App.i18n.content({
  'lesson-aws-005': {
    title: 'VPC for Java developers: CIDR, subnet, route table, security group vs NACL, and VPC endpoints',
    goals: [
      'Read a CIDR block and compute its IP range, and understand why a subnet belongs to a single Availability Zone',
      'Trace the path of a request from the internet into an app in a private subnet and down to RDS',
      'Distinguish a security group (stateful, allow-only rules) from a NACL (stateless, allow/deny evaluated by rule number)',
      'Explain why a NACL missing the ephemeral port range on outbound creates the "app receives the request but logs nothing" case',
      'Know when to use a gateway endpoint for S3/DynamoDB instead of NAT and what benefits it brings',
    ],
    body: `### What a VPC is: a plot of land where you draw the roads and fences
A **VPC (Virtual Private Cloud)** is your own private network inside **one region**: you choose the IP range, split it into **subnets**, set up **route tables** (the "roads"), and place "gates" in and out. Without a VPC, every resource has to protect itself; with a VPC, you control *who can talk to whom at the network layer*, before your application runs a single line of code.

**CIDR** is a compact way to write an IP range. {{10.0.0.0/16}} reads as "10.0.0.0, first 16 bits fixed" → from {{10.0.0.0}} to {{10.0.255.255}}, that is 65,536 addresses. Split it into subnets: {{10.0.1.0/24}} = 256 addresses {{10.0.1.0 – 10.0.1.255}}. The more bits after the /, the smaller the range (/24 = 256, /20 = 4,096, /8 = 16.7 million). AWS reserves 5 addresses in every /24 (the network address, the router, two reserved addresses, and broadcast), so in practice you can use 251 IPs.

A **subnet lives in exactly one Availability Zone (AZ)**. That is why, in AWS design, "subnet" is not only about IPs but also about the **unit of fault isolation**: two subnets in two AZs mean losing one AZ does not take down the whole system.

~~~text
                              Internet
                                 |
                              [IGW]        internet gateway: public in/out gate
             public subnet 1a (10.0.1.0/24)      public subnet 1b (10.0.2.0/24)
                    [ALB]                              [NAT gateway]
                        |                                     |
        private subnet 1a (10.0.10.0/24)   private subnet 1b (10.0.11.0/24)
             [ECS task 1]   [ECS task 2]          [RDS replica]
                        |
                  [RDS primary]        RDS subnet group also uses private subnets
~~~

- **Public subnet** = has a route {{0.0.0.0/0}} pointing to the **IGW** and resources inside have a **public IP**. Only place things that "must listen from outside" here: ALB, bastion.
- **Private subnet** = has a route {{0.0.0.0/0}} pointing to a **NAT gateway** (the NAT lives in a public subnet). The app can go *out* (call a partner API, download packages, call public AWS services) but nobody can go *in*. This is where you place the Java app.
- **Route table** picks the next hop by **longest prefix match**: a table has {{10.0.0.0/16 → local}}, {{0.0.0.0/0 → nat-abc}}, {{pl-6f1a → S3 prefix list}}. A packet to {{10.0.4.9}} matches /16 (longer than /0) so it goes {{local}}, not to the internet. To "lock in" a subnet with no outbound access, give it its own route table and remove the default route.

> An app with no public IP can **still** reach the internet through a NAT gateway, which does **SNAT** (replaces the source with its own public IP) and keeps a connection table to return responses to the right task. The trade-off: NAT is billed per GB processed and has a bandwidth limit, so large traffic (S3, video) going through NAT burns money.

### The real path of a request
~~~seq
title: Client calls an app in a private subnet
actors: Client | ALB | App | RDS
Client -> ALB: HTTPS 443 (into public subnet via IGW)
ALB -> App: forward 8080 (app SG allows 8080 from ALB SG)
App -> RDS: SQL 5432 (DB SG allows 5432 from app SG)
RDS --> App: result set
App --> ALB: HTTP 200
ALB --> Client: HTTP 200
note App: app has no public IP, outbound via NAT or endpoint
~~~

Notice how rules reference other security groups: **SGs can allow traffic by source SG**, not necessarily by CIDR. Setting the RDS ingress to "5432 from the app security group" means when the app scales to more instances you change nothing; if you write a CIDR, every subnet range change becomes a rule change.

### Two layers of fences: security group and NACL
~~~text
  Internet -> [subnet NACL] -> [ENI SG] -> app
                 (layer 4, per subnet)    (layer 4, per resource)
~~~

The real order is **NACL first, SG second**: a packet must pass the "subnet fence" and then reach the resource gate. Practical debugging consequence: a request blocked by a NACL **never reaches the app**, so application logs stay silent; a request blocked by an SG also never reaches the app, but ENI Flow Logs show the packet rejected at that layer. Because both layers must allow the traffic, when checking configuration you can reason about either layer first and reach the same "allowed or not" conclusion — they only differ in the **cause** you report.

| | Security group | NACL (network ACL) |
|---|---|---|
| Attached to | ENI / instance / task | **subnet** (every resource in the subnet) |
| Rule types | **ALLOW only** | ALLOW **and** DENY |
| Evaluation | union of all allow rules, no order | by **rule number**, first match wins (100 before 200) |
| Statefulness | **stateful**: allow in, response goes back automatically | **stateless**: you must open both directions |
| Default | no rule = deny everything | no matching rule = deny |
| Use when | control by component, by team | coarse subnet fence, block an IP range under suspected attack, deny a specific IP among many allows |

**The classic NACL trap**: a client request comes in on port 443, but the **response** packet goes from the app back to the client's *ephemeral port* (a temporary port assigned by the OS; IANA recommends 49152–65535, while AWS NACLs typically need 1024–65535 opened to be safe for all clients). If the NACL outbound only opens port 443, the response is blocked. The real-world symptom is hard to guess: the client hangs, the ALB or app shows **no logs** (because the request got in, only the way back was blocked), health checks flap, and everything "fixes itself" when you add a 1024–65535 rule.

Because SGs are stateful, this never happens at the SG layer. A practical rule: let SGs do detailed control, keep NACLs permissive by default inside the VPC, and use them only for a few explicit deny rules (block an attacking IP range, block everything outside a region).

### VPC endpoints: reach AWS services without going over the internet
A **gateway endpoint** (free, only for **S3** and **DynamoDB**): adds a route in the route table that points the service prefix list to an internal VPC gateway. Traffic stays inside the AWS network, never goes through IGW/NAT, and you can attach an **endpoint policy** to limit which buckets can be reached from that subnet.

An **interface endpoint** (uses **PrivateLink**, billed per hour + GB): a private-IP ENI in your subnet, acting as a "door" to a service ({{sts}}, {{secretsmanager}}, {{kms}}, {{ecr.api}}, {{logs}}, {{sns}}, {{sqs}}…). The app calls the internal name directly, no NAT, no public IP needed.

| Need | Path | Why |
|---|---|---|
| App in private subnet reads/writes S3 (image upload, report export) | **Gateway endpoint** | no NAT cost, no internet dependency, can restrict buckets with an endpoint policy |
| App needs Secrets Manager / KMS / STS | Interface endpoint | these services have no gateway endpoint |
| Call a partner API on the public internet | NAT gateway (or egress via firewall/proxy) | a public outbound path is required; Route 53 Resolver only resolves DNS, it does not replace NAT |
| Docker pull from ECR in a private subnet | Interface endpoints {{ecr.api}} + {{ecr.dkr}} and S3 gateway endpoint | ECR image layers live on S3; missing any of the three makes pulls fail |

> Quick DNS check: from inside a private subnet, run {{nslookup s3.ap-southeast-1.amazonaws.com}}. If it returns a {{52.x/54.x}} (public) IP you are going out; if it returns an internal {{10.x}} IP an interface endpoint is active. With a gateway endpoint, DNS still returns a public IP but the **route table** steers traffic to the gateway endpoint.

### Three common network failures when moving a Java app to AWS
1. **RDS in a private subnet but the app gets connect timeout**: app and DB are in different subnets, the DB security group only allows an old CIDR, or the DB subnet group is in a different AZ than the app → cross-AZ still works but adds data transfer cost each way.
2. **Running out of IPs in a subnet during scale**: a /24 gives only 251 usable IPs; ECS tasks, ENIs, RDS endpoints, NAT, and interface endpoints all consume IPs. Scaling 200 tasks on a /24 subnet fails silently, so size the CIDR for the **maximum expected ENI count**.
3. **"Public subnet means open"**: a public subnet + an SG open to {{0.0.0.0/0}} on port 8080 exposes the app to the internet. The app always belongs in a private subnet; only resources that must listen from outside (ALB) go in public, and the ALB sits in front of the app.

### Interview notes
Common questions: "How would you design a VPC for your microservices system?" (aws-003), "The app cannot reach the internet, what do you debug?", "How does an SG differ from a NACL, give an example where a NACL causes a bug?" (aws-038), "Why not put the database in a public subnet?", "Which path does S3 take from a private subnet, and what does it cost?". A strong answer always describes the **packet path** (client → IGW → ALB → NAT/endpoint → DB) and names the **layer** that is blocking (SG, NACL, or route), and confirms with **VPC Flow Logs** (per-packet allow/reject logs to CloudWatch Logs/S3) and **Reachability Analyzer** (walks the path backward and pinpoints the blocking resource).

> Senior tip: When a "network" issue happens for only some requests, do not guess: enable VPC Flow Logs for the app ENI, filter by port, and look for {{REJECT}} in each direction. Flow Logs showing a packet that **arrived** but the response **never came back** is the signature of a stateless NACL, very different from a missing SG rule (where every request of the same pattern fails immediately). And put a gateway endpoint for S3 in place before complaining about NAT cost: they solve the same problem, and one is free.`,
    exercises: [
      {
        title: 'Build your own packet evaluator: CIDR, NACL rule order, stateful SG, and the ephemeral port trap',
        prompt: `Simulate evaluating a TCP connection into a subnet. This is not a full AWS algorithm, but it preserves the three properties behind most real-world failures: **SGs are allow-only and stateful**, **NACLs evaluate rules in rule-number order**, **NACLs are stateless so the return path needs a rule**.

Provided: the {{Rule}} record, the constructor, and the {{matches(rule, ip, port)}} helper. Implement 4 methods:

1. {{cidrContains(cidr, ip)}}: {{cidr}} is in the form {{10.0.1.0/24}}. Convert both sides to integers and compare bits: {{(a >> (32 - bits)) == (b >> (32 - bits))}}. For {{/0}}, every IP is in the range.
2. {{firstMatch(rules, ip, port)}}: evaluate rules in **ascending {{number}} order** (lower number first, like AWS); the first matching rule decides: allow → {{"ALLOW"}}, deny → {{"DENY"}}, no rule matches → {{"NONE"}}.
3. {{checkRequest(clientIp, clientPort, servicePort)}} for the **inbound** direction into the subnet:
  ▸ SG inbound: if **no** allow rule matches {{(clientIp, servicePort)}} → {{"DENY_SG"}}. SGs have no deny concept, so any rule with {{allow = false}} must be ignored completely.
  ▸ then NACL inbound: if {{firstMatch(naclIn, clientIp, servicePort)}} is not {{"ALLOW"}} → {{"DENY_NACL_IN"}}.
  ▸ both pass → {{"ALLOW"}}.
4. {{checkResponse(clientIp, clientPort)}} for the **outbound** direction (subnet back to client): the SG is **stateful**, so the response of an allowed connection always goes back with **no rule checked**; only the NACL outbound remains: {{firstMatch(naclOut, clientIp, clientPort)}} not {{"ALLOW"}} → {{"DENY_NACL_OUT"}}, otherwise {{"ALLOW"}}.

{{servicePort}} is the service port (443, 8080); {{clientPort}} is the client's **ephemeral port** (1024–65535).

(Real AWS evaluates the NACL **before** the SG. Here we evaluate SG then NACL: the "allowed / blocked" conclusion is the same because both layers must pass; only the **cause** label you return differs.)`,
        hints: [
          'Convert an IP to a number the basic way: {{v = v * 256 + octet}} for 4 octets. For example {{10.0.1.77}} = 10*16777216 + 0*65536 + 1*256 + 77.',
          'In Java, the shift distance for {{int}} and {{long}} is masked ({{int}} uses the low 5 bits, {{long}} the low 6 bits), so {{long >> 32}} is a valid 32-bit shift. For {{/0}}, {{shift = 32}} shifts all 32 bits out (the result depends on how you handle that edge); a safe approach: if {{bits == 0}} return {{true}}, otherwise use {{(base >>> shift) == (ip >>> shift)}} with an unsigned {{long}} shift.',
          'SGs have no deny rules: filter {{r.allow()}} before {{anyMatch}}, not {{anyMatch(matches)}} alone.',
          'The order in checkRequest is SG first, then NACL inbound; checkResponse never mentions the SG.',
        ],
        explain: `### The three things you just built are the three things that fail in production
- **{{cidrContains}}** is why "does this subnet still have IPs" and "does this rule catch that traffic" must be computed by bits, not by eye. {{10.0.1.0/24}} does not contain {{10.0.2.x}}, and {{10.0.0.0/16}} does not contain {{10.1.0.1}} — two common mistakes when sizing a new VPC that later runs out of room.
- **{{firstMatch}} by {{number}}** explains why a "DENY 0.0.0.0/0" rule at number 100 **beats** every ALLOW rule at number 200. In AWS, the lower number is evaluated first and the first match decides everything; that is where many teams "open the port but still cannot connect".
- **{{checkResponse}} ignoring the SG and only checking the NACL** is exactly the stateful/stateless difference. The SG remembers "I allowed this connection in", so the response flows freely. The NACL remembers nothing, it evaluates each packet independently → a packet back to the client must match an outbound rule, and the client port is **ephemeral** (1024–65535), not 443.

### Common mistakes
- Using {{List.of(...)}} and assuming list order is evaluation order: AWS evaluates by {{number}}, so you must {{sorted}}.
- Giving an SG deny rule any effect: SGs are allow-only; to deny you must use a NACL, or an endpoint policy / WAF.
- Checking the SG in {{checkResponse}}: SGs are stateful, so the return path of an allowed connection needs no outbound rule; adding an outbound 443 rule "just in case" fixes nothing and makes you misunderstand NACLs.
- Forgetting that {{NONE}} means "deny": a NACL with no matching rule does **not** mean allow.

What is missing in real life: route tables and longest prefix match (a packet can be blocked because there is **no path**, not because of a firewall), VPC peering is not transitive, and Flow Logs only record the direction the ENI actually sees.`,
      },
    ],
    check: [
      {
        q: 'An ECS task in a private subnet calls {{https://api.partner.com}} and times out after ~30 seconds. The subnet route table only has {{10.0.0.0/16 → local}} and {{pl-123 → S3 gateway endpoint}}. What is the most likely cause and the right fix?',
        options: ['The task SG is missing an outbound 443 rule, add it and it works', 'There is no route to the internet: the 0.0.0.0/0 route is missing and no NAT gateway (or other egress path) exists; add a route pointing to NAT', 'The partner API blocks AWS IPs, add a whitelist', 'The NACL inbound blocks port 443, add an inbound rule'],
        answer: 1,
        explain: `A private subnet needs {{0.0.0.0/0 → NAT gateway}} to reach the internet. Here that route does not exist, so the packet has no next hop. SGs allow all outbound by default, so it is not a missing outbound rule; NACL inbound concerns traffic **coming in**, which does not explain a timeout on an outbound request you initiated. Whitelisting the partner IP is something to do only after proving you have an outbound path.`,
      },
      {
        q: 'Security group inbound allows 443 from 0.0.0.0/0, NACL inbound allows 443 from 0.0.0.0/0, NACL outbound allows only 443. A client makes an HTTPS call and it hangs; the ALB access log shows nothing. What is happening?',
        options: ['The ALB is scaling so the request is slow', 'The request got in but the response back to the client ephemeral port (1024–65535) is blocked by the stateless NACL outbound; add a rule for the ephemeral range', 'Because the SG is stateful it must be an application bug', 'You need to enable an S3 gateway endpoint'],
        answer: 1,
        explain: `A NACL evaluates each packet independently. The inbound direction matches the 443 rule, but the return path targets the client temporary port, which does not match 443 → denied. The request already entered so the client waits, and higher layers have nothing to log — the classic signature. An SG being stateful helps only at its own layer; it does not "patch" a NACL.`,
      },
      {
        q: 'An app in a private subnet reads and writes a large amount of data to an S3 bucket. Which approach is both cheaper and reduces internet dependency?',
        options: ['Attach a public IP to each task to go direct', 'Add an S3 gateway endpoint to the VPC and route to it from the private subnet route table', 'Increase the NAT gateway size', 'Move the app to a public subnet'],
        answer: 1,
        explain: `A gateway endpoint for S3 (and DynamoDB) is free, keeps traffic inside the AWS network, does not go through NAT/IGW, and can attach an endpoint policy to restrict buckets. Attaching public IPs and moving to a public subnet increase the attack surface; a NAT gateway is billed per GB so more data means more cost, and there is no "size" to increase.`,
      },
      {
        q: 'A network ACL has rule 300 ALLOW 443 from 0.0.0.0/0 and rule 100 DENY 100.20.30.0/24 for all ports. A client at 100.20.30.5 calls port 443. What is the result?',
        options: ['Allowed, because the ALLOW rule is broader', 'Blocked, because NACLs evaluate by rule number and the first matching rule (100 DENY) wins', 'Blocked only if the security group also has a deny rule', 'Undetermined, NACLs evaluate randomly'],
        answer: 1,
        explain: `NACLs match rules in ascending rule-number order; the first match decides, here the DENY at 100. SGs have no deny rules, so "SG also has deny" is impossible; and evaluation order is deterministic, not random. To let this client through you must change the number or narrow the deny rule range.`,
      },
    ],
  },
});
