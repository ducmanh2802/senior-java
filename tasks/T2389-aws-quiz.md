# T2389 — 20 câu trắc nghiệm AWS cho SAP/DOP

Status: DONE
## Notes
Added qz-aws-035..qz-aws-054 (20 questions) in js/data/quiz-ops.js. validate OK.
Agent: kilo
Owns: `js/data/quiz-ops.js`
After: T2322

Định dạng QUIZ; grep q: để không trùng (topic aws có trong topics.js). 20 câu tình huống: VPC endpoint vs NAT, Route 53 failover, RDS Multi-AZ vs read replica, S3 replication, ECS Fargate scaling, CodeDeploy blue/green, CloudFormation StackSets, SCP. 1/4 multi, explain từng phương án, đáp án rải đều.

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes.

## Nghiệm thu
`node --check js/data/quiz-ops.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Reviewed-by: kilo (T2389R)
