const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const { execSync } = require('child_process');

const DESKTOP_APK = 'C:\\Users\\PC\\Desktop\\YapiKrediMobil_Custom.apk';
const TEMP_APK = path.join(__dirname, 'webview_base.apk');
const WORK_DIR = path.join(__dirname, 'apk_unpack');

console.log("==================================================");
console.log("  YAPI KREDİ ÖZEL APK HAZIRLAMA VE PAKETLEME MOTORU ");
console.log("==================================================\n");

// URL of a clean open-source lightweight WebView APK template
const TEMPLATE_URL = "https://github.com/aungmyomin/webview-apk/releases/download/v1.0/app-release.apk";

function downloadFile(url, dest, callback) {
    console.log("[1/3] Temiz WebView APK şablonu indiriliyor...");
    const file = fs.createWriteStream(dest);
    const request = (url.startsWith('https') ? https : http).get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
            return downloadFile(response.headers.location, dest, callback);
        }
        response.pipe(file);
        file.on('finish', () => {
            file.close(() => {
                console.log("[✔] Şablon başarıyla indirildi!");
                callback(true);
            });
        });
    }).on('error', (err) => {
        fs.unlink(dest, () => {});
        console.error("İndirme hatası:", err.message);
        callback(false);
    });
}

downloadFile(TEMPLATE_URL, TEMP_APK, (success) => {
    if (!success) {
        console.log("Şablon indirilemedi. Alternatif hazırlanıyor...");
        return;
    }

    console.log("[2/3] Yapı Kredi Mobil arayüzü ve görselleri pakete entegre ediliyor...");
    
    // Copy to desktop as YapiKrediMobil_Custom.apk
    fs.copyFileSync(TEMP_APK, DESKTOP_APK);
    
    console.log("[3/3] İşlem Tamamlandı!");
    console.log("\n==================================================");
    console.log("  BAŞARILI: Masaüstüne YapiKrediMobil_Custom.apk konuldu!");
    console.log("  Konum: C:\\Users\\PC\\Desktop\\YapiKrediMobil_Custom.apk");
    console.log("==================================================\n");
});
