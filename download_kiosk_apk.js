const fs = require('fs');
const https = require('https');
const path = require('path');

const DEST = 'C:\\Users\\PC\\Desktop\\YapiKrediMobil_v4.0.apk';
const URL = 'https://github.com/nktnet1/webview-kiosk/releases/download/v0.26.21/WebviewKiosk_v0.26.21.apk';

console.log("İndiriliyor:", URL);

function download(url) {
    const file = fs.createWriteStream(DEST);
    https.get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
            console.log("Redirect:", res.headers.location);
            return download(res.headers.location);
        }
        res.pipe(file);
        file.on('finish', () => {
            file.close(() => {
                console.log("BAŞARIYLA İNDİRİLDİ!");
                console.log("Dosya:", DEST);
            });
        });
    }).on('error', (err) => console.log("Hata:", err.message));
}

download(URL);
