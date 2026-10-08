const https = require('https');
const fs = require('fs');

// apktool.jar indir
const dest = 'C:\\Users\\PC\\.gemini\\antigravity\\scratch\\yapi_kredi_clone\\apktool.jar';
const url = 'https://github.com/iBotPeaches/Apktool/releases/download/v2.9.3/apktool_2.9.3.jar';

console.log('apktool.jar indiriliyor...');

function download(url) {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
            return download(res.headers.location);
        }
        res.pipe(file);
        file.on('finish', () => {
            file.close(() => {
                const stat = fs.statSync(dest);
                console.log('BAŞARILI! İndirilen boyut:', Math.round(stat.size / 1024 / 1024, 2), 'MB');
            });
        });
    }).on('error', e => console.log('HATA:', e.message));
}

download(url);
