const fs = require('fs');
const content = fs.readFileSync('App.tsx', 'utf8');

let stack = [];
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  for (let j = 0; j < line.length; j++) {
    let char = line[j];
    if (char === '{' || char === '(' || char === '<') stack.push({char, line: i + 1});
    else if (char === '}' || char === ')' || char === '>') {
      if (stack.length === 0) {
        console.log(`Unmatched ${char} at line ${i + 1}`);
        continue;
      }
      let top = stack.pop();
      if ((char === '}' && top.char !== '{') ||
          (char === ')' && top.char !== '(') ||
          (char === '>' && top.char !== '<')) {
        console.log(`Mismatched ${char} at line ${i + 1}. Expected match for ${top.char} from line ${top.line}`);
        stack.push(top); // push back to not completely break
      }
    }
  }
}
if (stack.length > 0) {
  console.log('Unclosed:');
  stack.forEach(item => console.log(`${item.char} at line ${item.line}`));
}
