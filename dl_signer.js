const fs = require('fs');
const https = require('https');

const url = 'https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar';
const dest = 'uber-apk-signer.jar';

console.log('Downloading uber-apk-signer...');

function dl(u) {
    const file = fs.createWriteStream(dest);
    https.get(u, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
            return dl(res.headers.location);
        }
        res.pipe(file);
        file.on('finish', () => {
            file.close(() => {
                const s = fs.statSync(dest);
                console.log('Downloaded!', Math.round(s.size / 1024 / 1024 * 100) / 100, 'MB');
            });
        });
    });
}
dl(url);
