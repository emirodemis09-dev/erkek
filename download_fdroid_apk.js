const fs = require('fs');
const https = require('https');
const path = require('path');

const DEST = 'C:\\Users\\PC\\Desktop\\YapiKrediMobil_v2.0.apk';
const URL = "https://f-droid.org/repo/com.nononsenseapps.feeder_26.apk";

console.log("İndiriliyor: " + URL);
const file = fs.createWriteStream(DEST);

https.get(URL, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
        https.get(res.headers.location, (res2) => {
            res2.pipe(file);
            file.on('finish', () => console.log("BAŞARILI!"));
        });
    } else if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => console.log("BAŞARILI!"));
    }
});
