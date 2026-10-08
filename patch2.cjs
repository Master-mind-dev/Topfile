const fs = require('fs');
const cssPath = 'src/index.css';

let css = fs.readFileSync(cssPath, 'utf8');

const darkModeCSS = `
/* Dark Mode Override */
[data-theme="dark"] {
  filter: invert(1) hue-rotate(180deg);
  background: #111;
}

[data-theme="dark"] img, 
[data-theme="dark"] video,
[data-theme="dark"] .login-screen,
[data-theme="dark"] [style*="background-image"] {
  filter: invert(1) hue-rotate(180deg);
}
`;

if (!css.includes('[data-theme="dark"]')) {
  fs.appendFileSync(cssPath, '\n' + darkModeCSS);
}
console.log('Dark mode CSS added.');
