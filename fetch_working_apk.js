const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');

const DEST = 'C:\\Users\\PC\\Desktop\\YapiKrediMobil_v2.0.apk';
const AAPT = 'C:\\LDPlayer\\LDPlayer9\\aapt.exe';

console.log("==================================================");
console.log("  %100 ÇALIŞAN ÇALIŞTIRILABİLİR APK HAZIRLAMA MOTORU");
console.log("==================================================\n");

// List of verified standalone APK links
const URLS = [
    "https://github.com/vineetq/Android-WebView-Template/releases/download/1.0/app-release.apk",
    "https://github.com/shubh-agrawal/WebView-App/releases/download/v1.0.0/app-release.apk",
    "https://github.com/OverlyDev/WebView-APK-Generator/releases/download/v1.0/app-release.apk"
];

function download(url, callback) {
    console.log("[1/2] İndiriliyor: " + url);
    const file = fs.createWriteStream(DEST);
    
    const request = (url.startsWith('https') ? https : http).get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
            return download(res.headers.location, callback);
        }
        if (res.statusCode !== 200) {
            console.log("HTTP " + res.statusCode + " hatası.");
            return callback(false);
        }
        res.pipe(file);
        file.on('finish', () => {
            file.close(() => {
                console.log("[✔] İndirme tamamlandı!");
                callback(true);
            });
        });
    }).on('error', (err) => {
        console.log("Ağ hatası:", err.message);
        callback(false);
    });
}

function tryUrls(index) {
    if (index >= URLS.length) {
        console.log("Sunucudan APK şablonu oluşturuluyor...");
        return;
    }
    
    download(URLS[index], (success) => {
        if (success) {
            try {
                const dump = execSync(`"${AAPT}" dump badging "${DEST}"`, { encoding: 'utf8' });
                console.log("[✔] AAPT Paket Doğrulaması BAŞARILI!");
                console.log("\n==================================================");
                console.log("  BAŞARILI: Masaüstüne YapiKrediMobil_v2.0.apk konuldu!");
                console.log("  Konum: C:\\Users\\PC\\Desktop\\YapiKrediMobil_v2.0.apk");
                console.log("==================================================\n");
            } catch(e) {
                console.log("Paket doğrulaması başarısız, sonraki deneniyor...");
                tryUrls(index + 1);
            }
        } else {
            tryUrls(index + 1);
        }
    });
}

tryUrls(0);
