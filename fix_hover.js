const fs = require('fs');

const path = "frontend/app/network/page.js";
let text = fs.readFileSync(path, 'utf8');

text = text.replace(
    'style={{ left: \`${device.x}%\`, top: \`${device.y}%\`, transform: "translate(-50%, -50%)" }}',
    'style={{ left: \`${device.x}%\`, top: \`${device.y}%\` }}\n                                        initial={{ x: "-50%", y: "-50%", scale: 1 }}\n                                        animate={{ x: "-50%", y: "-50%", scale: 1 }}\n                                        whileHover={{ x: "-50%", y: "-50%", scale: 1.15 }}'
);

// fix sub devices being too big maybe? "w-14 h-14" is okay. 
// "const nodeSize = isSubDevice ? 'w-14 h-14' : 'w-20 h-20';"

fs.writeFileSync(path, text);
console.log("Fixed hover");
