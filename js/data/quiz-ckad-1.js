/* CKAD quiz part 1 (task T2834): 40 tinh huong ly thuyet CKAD, topic devops. */
(window.QUIZ = window.QUIZ || []).push(
{
  id: 'qz-ckad-001',
  topic: 'devops',
  q: '[Design & Build] Ban can tao nhanh mot Pod ten web chay image nginx:1.25 va kiem tra manifest truoc khi apply. Lenh nao dung?',
  options: ['kubectl run web --image=nginx:1.25 --dry-run=client -o yaml', 'kubectl create pod web --image=nginx:1.25 --dry-run', 'kubectl apply -f web.yaml --validate=false', 'kubectl run web nginx:1.25 -o yaml'],
  answer: 0,
  explain: `**Dap an dung: A.** kubectl run voi --dry-run=client -o yaml sinh manifest Pod ma khong tao resource, dung de xem/sua truoc khi apply.

### Vi sao cac phuong an con lai sai
- **B:** khong co lenh "kubectl create pod" voi cu phap do.
- **C:** apply can file co san.
- **D:** thieu --image= va --dry-run.`
},
);
(window.QUIZ = window.QUIZ || []).push(
{
  id: 'qz-ckad-002',
  topic: 'devops',
  q: '[Design & Build] Pod co 2 container chia se volume emptyDir. Volume khai bao o dau?',
  options: ['spec.volumes va volumeMounts', 'Chi container dau', 'metadata.annotations', 'spec.initContainers only'],
  answer: 0,
  explain: `**Dap an dung: A.** emptyDir khai bao o cap Pod (spec.volumes) va mount vao tung container qua volumeMounts.`
},
{
  id: 'qz-ckad-003',
  topic: 'devops',
  q: '[Design & Build] Init container K8s 1.29+ co the dung restartPolicy Always de chay sidecar. Dung hay sai?',
  options: ['Dung', 'Sai, init container khong ho tro', 'Chi Deployment', 'Chi Job'],
  answer: 0,
  explain: `**Dap an dung: A.** Tu K8s 1.29, init container ho tro restartPolicy: Always, chay nhu native sidecar.`
},
{
  id: 'qz-ckad-004',
  topic: 'devops',
  multi: true,
  q: '[Design & Build] Job 5 pods, toi da 2 chay song song. Cau hinh? (Chọn 2)',
  options: ['completions: 5', 'parallelism: 2', 'backoffLimit: 5', 'restartPolicy: Always'],
  answer: [0, 1],
  explain: `**Dap an dung: A, B.** completions tong so pod; parallelism so pod song song.`
},
{
  id: 'qz-ckad-005',
  topic: 'devops',
  q: '[Design & Build] CronJob khong cho chong job. Field?',
  options: ['concurrencyPolicy: Forbid', 'suspend: true', 'startingDeadlineSeconds: 0', 'successfulJobsHistoryLimit: 0'],
  answer: 0,
  explain: `**Dap an dung: A.** Forbid ngan job moi khi job truoc con chay.`
},
{
  id: 'qz-ckad-006',
  topic: 'devops',
  q: '[Design & Build] Load image local vao kind. Lenh?',
  options: ['kind load docker-image myapp:1.0 --name ckad', 'kubectl load image', 'docker push kind', 'kind import image'],
  answer: 0,
  explain: `**Dap an dung: A.** kind load docker-image day image vao node.`
},
{
  id: 'qz-ckad-007',
  topic: 'devops',
  q: '[Deployment] Rolling update maxSurge 1 maxUnavailable 0. Y nghia?',
  options: ['Zero downtime', 'Xoa het roi tao moi', 'Canary', 'Scale only'],
  answer: 0,
  explain: `**Dap an dung: A.** Khong pod nao bi xoa truoc khi pod moi Ready.`
},
{
  id: 'qz-ckad-008',
  topic: 'devops',
  q: '[Deployment] Rollback Deployment. Lenh?',
  options: ['kubectl rollout undo deployment/web', 'kubectl rollout restart', 'kubectl apply -f old.yaml', 'kubectl scale 0'],
  answer: 0,
  explain: `**Dap an dung: A.** rollout undo quay ve revision truoc.`
},
{
  id: 'qz-ckad-009',
  topic: 'devops',
  q: '[Deployment] Canary voi 2 Deployment cung label selector, replica 9:1. Dung?',
  options: ['Dung', 'Sai', 'Chi Ingress', 'Chi HPA'],
  answer: 0,
  explain: `**Dap an dung: A.** Service chon pod theo label, traffic chia theo endpoint count.`
},
{
  id: 'qz-ckad-010',
  topic: 'devops',
  q: '[Deployment] Helm install voi values override. Lenh?',
  options: ['helm install myrel chart/ -f values.yaml --set image.tag=1.2', 'helm apply', 'helm install --values-only', 'helm upgrade --dry-run'],
  answer: 0,
  explain: `**Dap an dung: A.** -f va --set override values.`
},
{
  id: 'qz-ckad-011',
  topic: 'devops',
  q: '[Deployment] Kustomize apply overlay. Lenh?',
  options: ['kubectl apply -k ./overlays/prod', 'kubectl apply -f kustomization.yaml', 'kustomize build | kubectl apply -f -', 'Ca A va C'],
  answer: 3,
  explain: `**Dap an dung: D.** Ca hai cach deu dung.`
},
{
  id: 'qz-ckad-012',
  topic: 'devops',
  q: '[Observability] Readiness probe fail. Ket qua?',
  options: ['Remove khoi Service endpoints', 'Pod bi xoa', 'Container restart', 'Scale down'],
  answer: 0,
  explain: `**Dap an dung: A.** Pod khong Ready, bi remove khoi endpoints.`
},
{
  id: 'qz-ckad-013',
  topic: 'devops',
  q: '[Observability] Xem log container truoc trong pod nhieu container. Lenh?',
  options: ['kubectl logs pod -c ctr --previous', 'kubectl logs --all-containers', 'kubectl describe pod', 'kubectl top pod'],
  answer: 0,
  explain: `**Dap an dung: A.** -c chon container, --previous xem instance truoc.`
},
{
  id: 'qz-ckad-014',
  topic: 'devops',
  q: '[Observability] kubectl debug muc dich chinh?',
  options: ['Debug pod khong co shell ma khong restart', 'Thay the container chinh', 'Scale pod', 'Update image'],
  answer: 0,
  explain: `**Dap an dung: A.** Ephemeral container gan vao pod dang chay.`
},
{
  id: 'qz-ckad-015',
  topic: 'devops',
  q: '[Observability] Startup probe dung de?',
  options: ['Cho app khoi dong cham', 'Thay readiness', 'Kiem tra memory leak', 'Scale pod'],
  answer: 0,
  explain: `**Dap an dung: A.** Trong khi startup chua pass, liveness/readiness bi disable.`
},
{
  id: 'qz-ckad-016',
  topic: 'devops',
  q: '[Config & Security] Tao Secret tu file env. Lenh?',
  options: ['kubectl create secret generic db --from-env-file=.env', 'kubectl create secret generic db --from-literal-file=.env', 'kubectl apply secret db --from-file=.env', 'kubectl create secret db .env'],
  answer: 0,
  explain: `**Dap an dung: A.** --from-env-file doc file KEY=VALUE.`
},
{
  id: 'qz-ckad-017',
  topic: 'devops',
  q: '[Config & Security] Mount Secret key password thanh file pass.txt. Field?',
  options: ['items key/path', 'subPath', 'envFrom', 'readOnly'],
  answer: 0,
  explain: `**Dap an dung: A.** items: [{key: password, path: pass.txt}].`
},
{
  id: 'qz-ckad-018',
  topic: 'devops',
  q: '[Config & Security] runAsNonRoot true va runAsUser 1000. Y nghia?',
  options: ['Chay UID 1000, khong root', 'Chay root', 'Privileged', 'Full capabilities'],
  answer: 0,
  explain: `**Dap an dung: A.** Hardening co ban.`
},
{
  id: 'qz-ckad-019',
  topic: 'devops',
  q: '[Config & Security] ResourceQuota ap dung cap nao?',
  options: ['Namespace', 'Pod', 'Node', 'Container'],
  answer: 0,
  explain: `**Dap an dung: A.** Gioi han tong tai nguyen trong namespace.`
},
{
  id: 'qz-ckad-020',
  topic: 'devops',
  q: '[Config & Security] Tat auto-mount SA token. Cach?',
  options: ['automountServiceAccountToken: false', 'serviceAccountName: none', 'rbac disable', 'runAsNonRoot'],
  answer: 0,
  explain: `**Dap an dung: A.** Ngan mount token SA vao pod.`
}
);
(window.QUIZ = window.QUIZ || []).push(
{
  id: 'qz-ckad-021',
  topic: 'devops',
  multi: true,
  q: '[Config & Security] Kiem tra quyen RBAC cua SA. Lenh? (Chọn 2)',
  options: ['kubectl auth can-i list pods --as=system:serviceaccount:ns:sa', 'kubectl auth can-i create deployments --as=system:serviceaccount:ns:sa', 'kubectl get rolebinding -A', 'kubectl describe sa'],
  answer: [0, 1],
  explain: `**Dap an dung: A, B.** auth can-i voi --as kiem tra quyen.`
},
{
  id: 'qz-ckad-022',
  topic: 'devops',
  q: '[App Networking] Endpoints rong thuong vi?',
  options: ['Selector khong match label hoac pod chua Ready', 'Service port sai', 'Namespace khac', 'DNS cache'],
  answer: 0,
  explain: `**Dap an dung: A.** Endpoints sinh tu pod match selector va Ready.`
},
{
  id: 'qz-ckad-023',
  topic: 'devops',
  q: '[App Networking] targetPort trong Service la gi?',
  options: ['Port container lang nghe', 'Port client goi Service', 'Port node expose', 'Port ingress backend'],
  answer: 0,
  explain: `**Dap an dung: A.** port la Service; targetPort la container.`
},
{
  id: 'qz-ckad-024',
  topic: 'devops',
  q: '[App Networking] Ingress rewrite path /api ve /. Annotation?',
  options: ['nginx.ingress.kubernetes.io/rewrite-target: /', 'proxy-pass', 'ingress.class: rewrite', 'use-regex'],
  answer: 0,
  explain: `**Dap an dung: A.** rewrite-target annotation cua ingress-nginx.`
},
{
  id: 'qz-ckad-025',
  topic: 'devops',
  q: '[App Networking] NetworkPolicy default deny ingress, cho phep pod frontend cung namespace. Field?',
  options: ['podSelector trong ingress.from', 'namespaceSelector only', 'egress section', 'policyTypes: Egress'],
  answer: 0,
  explain: `**Dap an dung: A.** ingress.from voi podSelector chon pod frontend.`
},
{
  id: 'qz-ckad-026',
  topic: 'devops',
  q: '[App Networking] DNS service cung namespace. Format?',
  options: ['svc-name', 'svc-name.namespace.svc.cluster.local', 'Ca A va B', 'svc-name.cluster.local'],
  answer: 2,
  explain: `**Dap an dung: C.** Ca ten ngan va FQDN deu resolve.`
},
{
  id: 'qz-ckad-027',
  topic: 'devops',
  q: '[Design & Build] Liveness probe exec tra exit code khac 0. Dieu gi xay ra?',
  options: ['Container restart', 'Pod bi xoa', 'Traffic ngat', 'Khong gi'],
  answer: 0,
  explain: `**Dap an dung: A.** Liveness fail -> kubelet restart container.`
},
{
  id: 'qz-ckad-028',
  topic: 'devops',
  q: '[Deployment] Pause rollout. Lenh?',
  options: ['kubectl rollout pause deployment/web', 'kubectl rollout hold', 'kubectl scale 0', 'kubectl rollout status'],
  answer: 0,
  explain: `**Dap an dung: A.** rollout pause tam dung; resume bang rollout resume.`
},
{
  id: 'qz-ckad-029',
  topic: 'devops',
  q: '[Observability] kubectl top pod can gi?',
  options: ['metrics-server', 'kube-state-metrics', 'prometheus', 'node-exporter'],
  answer: 0,
  explain: `**Dap an dung: A.** kubectl top dung metrics API cua metrics-server.`
},
{
  id: 'qz-ckad-030',
  topic: 'devops',
  q: '[Config & Security] ConfigMap immutable true. Chú y?',
  options: ['Khong the sua; tao moi va update pod', 'Auto reload', 'Giam etcd', 'Read-only mount'],
  answer: 0,
  explain: `**Dap an dung: A.** immutable khong the update.`
},
{
  id: 'qz-ckad-031',
  topic: 'devops',
  q: '[App Networking] Ingress pathType Prefix, request /api/users match /api?',
  options: ['Co', 'Khong', 'Chi /api/', 'Chi root'],
  answer: 0,
  explain: `**Dap an dung: A.** Prefix match theo prefix.`
},
{
  id: 'qz-ckad-032',
  topic: 'devops',
  multi: true,
  q: '[Design & Build] Native sidecar K8s 1.29+. Dac diem? (Chọn 2)',
  options: ['Khoi dong truoc main', 'Chay song song voi main', 'Chi chay mot lan', 'Khong mount volume'],
  answer: [0, 1],
  explain: `**Dap an dung: A, B.** Native sidecar khoi dong truoc main va chay song song.`
},
{
  id: 'qz-ckad-033',
  topic: 'devops',
  q: '[Deployment] Helm rollback ve revision 2. Lenh?',
  options: ['helm rollback myrel 2', 'helm undo', 'helm upgrade --version 2', 'helm revert'],
  answer: 0,
  explain: `**Dap an dung: A.** helm rollback <release> <revision>.`
},
{
  id: 'qz-ckad-034',
  topic: 'devops',
  q: '[Observability] Manifest dung extensions/v1beta1 Ingress tren K8s 1.30+. Can gi?',
  options: ['Migrate sang networking.k8s.io/v1', 'Giu nguyen', 'Dung v1beta1 networking', 'Xoa Ingress'],
  answer: 0,
  explain: `**Dap an dung: A.** extensions/v1beta1 da bi remove.`
},
{
  id: 'qz-ckad-035',
  topic: 'devops',
  q: '[Config & Security] LimitRange default request/limit. Neu pod khong specify resources?',
  options: ['Ap dung default', 'Pod bi reject', 'Dung node capacity', 'Khong limit'],
  answer: 0,
  explain: `**Dap an dung: A.** LimitRange cung cap default.`
},
{
  id: 'qz-ckad-036',
  topic: 'devops',
  q: '[App Networking] NetworkPolicy egress can DNS va HTTPS. Phai khai bao gi?',
  options: ['egress UDP 53 va TCP 443', 'Chi policyTypes Ingress', 'podSelector rong', 'namespaceSelector'],
  answer: 0,
  explain: `**Dap an dung: A.** Default deny egress phai allow ro.`
},
{
  id: 'qz-ckad-037',
  topic: 'devops',
  q: '[Design & Build] Job backoffLimit 4. Y nghia?',
  options: ['Toi da 4 lan retry', '4 pod song song', 'Hoan thanh 4 pod', 'Timeout 4 phut'],
  answer: 0,
  explain: `**Dap an dung: A.** backoffLimit la so lan retry.`
},
{
  id: 'qz-ckad-038',
  topic: 'devops',
  q: '[Deployment] Kustomize patch image. Khai bao?',
  options: ['images: [{name, newTag}]', 'patches: [{image}]', 'resources: [image]', 'configMapGenerator'],
  answer: 0,
  explain: `**Dap an dung: A.** Kustomize images transformer.`
},
{
  id: 'qz-ckad-039',
  topic: 'devops',
  multi: true,
  q: '[Observability] Pod CrashLoopBackOff debug. Buoc? (Chọn 2)',
  options: ['kubectl logs --previous', 'kubectl describe pod', 'kubectl delete pod', 'kubectl scale 0'],
  answer: [0, 1],
  explain: `**Dap an dung: A, B.** Xem log va events.`
},
{
  id: 'qz-ckad-040',
  topic: 'devops',
  q: '[App Networking] Service NodePort expose 30080. Client truy cap qua?',
  options: ['<NodeIP>:30080', 'ClusterIP:30080', 'PodIP:30080', 'Service name:30080'],
  answer: 0,
  explain: `**Dap an dung: A.** NodePort mo port tren moi node.`
}
);
