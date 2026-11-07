#!/usr/bin/env node
// Liệt kê các dòng tiếng Việt viết KHÔNG DẤU trong file dữ liệu (markup, sơ đồ ~~~seq, comment trong code).
//   node scripts/find-nodiac.js js/data/sdlc.js [file...]
// In: <file>:<dòng> [<id gần nhất>] <nội dung>. Heuristic: dòng không có ký tự có dấu và chứa ≥ 2 từ tiếng Việt phổ biến viết không dấu.
// Dùng cho task thêm dấu; kết quả có thể có vài dòng báo nhầm (tên biến tiếng Anh) — tự đánh giá trước khi sửa.
const fs = require('fs');
const WORDS = /\b(khong|duoc|nguoi|cua|trong|voi|neu|thi|nhung|cach|dung|kiem|gui|nhan|xu ly|tra ve|du lieu|giao dich|tai khoan|loi|chay|thanh toan|hoac|bang|mot|nhieu|truoc|sau khi|phai)\b/gi;
const DIAC = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const files = process.argv.slice(2);
if (!files.length) { console.error('usage: node scripts/find-nodiac.js <file>...'); process.exit(2); }
let total = 0;
for (const f of files) {
  let cur = '';
  fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((line, i) => {
    const m = line.match(/id: ['"]([\w-]+)['"]/);
    if (m) cur = m[1];
    if (DIAC.test(line)) return;
    if ((line.match(WORDS) || []).length >= 2) { total++; console.log(`${f}:${i + 1} [${cur}] ${line.trim().slice(0, 160)}`); }
  });
}
console.log(`\n${total} dòng nghi viết không dấu.`);
