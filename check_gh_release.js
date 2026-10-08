const https = require('https');

const options = {
    hostname: 'api.github.com',
    path: '/repos/nktnet1/webview-kiosk/releases/latest',
    headers: { 'User-Agent': 'NodeJS' }
};

https.get(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("Assets:", json.assets.map(a => ({ name: a.name, url: a.browser_download_url })));
        } catch(e) {
            console.log("Error:", e.message);
        }
    });
});
