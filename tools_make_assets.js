const fs = require('fs');
const path = require('path');

const ykb = fs.readFileSync(path.join(__dirname, 'mobile_app', 'assets', 'ykb_logo.png')).toString('base64');
const stamp = fs.readFileSync(path.join(__dirname, 'mobile_app', 'assets', 'edekont_stamp.png')).toString('base64');
const qr = fs.readFileSync(path.join(__dirname, 'mobile_app', 'assets', 'dekont_qr.png')).toString('base64');

const content = `window.DEKONT_ASSETS = {
    ykbLogo: "data:image/png;base64,${ykb}",
    stamp: "data:image/png;base64,${stamp}",
    qr: "data:image/png;base64,${qr}"
};
`;

fs.writeFileSync(path.join(__dirname, 'mobile_app', 'dekont_assets.js'), content, 'utf8');
console.log('dekont_assets.js created successfully! Size:', content.length);
