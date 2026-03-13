const fs = require('fs');

const files = [
    'frontend/app/dashboard/loading.js',
    'frontend/app/devices/loading.js',
    'frontend/app/investigations/loading.js',
    'frontend/app/network/loading.js',
    'frontend/app/reports/loading.js',
    'frontend/app/threats/loading.js'
];

for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(
            '<div className="min-h-screen w-full bg-[#0a0a0a] text-white relative overflow-hidden">',
            '<div\\n            className="min-h-screen w-full bg-[#0a0a0a] text-white relative overflow-hidden"\\n            role="status"\\n            aria-live="polite"\\n        >\\n            <span className="sr-only">Loading...</span>'
        );
        fs.writeFileSync(file, content);
    }
}
console.log("Accessibility roles added");
