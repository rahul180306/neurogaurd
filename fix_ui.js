const fs = require('fs');

const path = "frontend/app/network/page.js";
let text = fs.readFileSync(path, 'utf8');

text = text.replace(
    /const isSubDevice = .*?;/,
    "const isSubDevice = (device.type || '').toLowerCase().includes('servo') || (device.type || '').toLowerCase().includes('humidity');"
);

text = text.replace(
    /const nodeSize = isSubDevice \? .*? : .*?;/,
    "const nodeSize = isSubDevice ? 'w-14 h-14 p-2' : 'w-20 h-20 p-3';"
);

fs.writeFileSync(path, text);
console.log("Fixed UI scale");
