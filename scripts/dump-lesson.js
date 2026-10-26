const fs = require('fs');
const path = require('path');
const App = require(path.join(__dirname, '..', 'scripts', 'browser-shim.js'));
global.window.LESSONS = global.window.LESSONS || [];
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
for (const m of html.matchAll(/src="js\/data\/(lessons-[a-z]+\.js)"/g)) require(path.join(__dirname, '..', 'js', 'data', m[1]));
const L = global.window.LESSONS.find(x => x.id === 'lesson-devops-005');
console.log('lessons=', global.window.LESSONS.length, 'found=', !!L);
if (L) {
  const ex = L.exercises[0];
  const out = App.code.assemble(ex.reference, ex.tests);
  const dir = path.join(__dirname, '..', 'logs');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'main-lesson-devops-005-1.java'), out);
  console.log('written logs/main-lesson-devops-005-1.java', out.length, 'chars');
}
