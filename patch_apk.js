const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const APK_PATH = 'C:\\Users\\PC\\Desktop\\YapiKrediMobil_v3.0.apk';
const BASE_APK = 'C:\\Users\\PC\\Desktop\\YapiKrediMobil_v2.0.apk';
const SEVEN_ZIP = 'C:\\LDPlayer\\LDPlayer9\\7za.exe';
const KEYTOOL = 'C:\\Program Files\\Eclipse Adoptium\\jre-25.0.2.10-hotspot\\bin\\keytool.exe';
const JARSIGNER = 'C:\\Program Files\\Eclipse Adoptium\\jre-25.0.2.10-hotspot\\bin\\jarsigner.exe';
const KEYSTORE = path.join(__dirname, 'ykb.keystore');

console.log("==================================================");
console.log("  YAPI KREDİ MOBİL APK DÜZENLEME VE GÜNCELLEME ");
console.log("==================================================\n");

// Copy base APK
fs.copyFileSync(BASE_APK, APK_PATH);

// Create HTML & assets bundle to inject
const bundleDir = path.join(__dirname, 'apk_assets_bundle');
if (fs.existsSync(bundleDir)) fs.rmSync(bundleDir, { recursive: true });
fs.mkdirSync(path.join(bundleDir, 'assets'), { recursive: true });

// Copy mobile app HTML to assets/index.html inside APK
fs.copyFileSync(path.join(__dirname, 'mobile_app', 'index.html'), path.join(bundleDir, 'assets', 'index.html'));

console.log("[1/2] Yapı Kredi Mobil Arayüzü APK içine ekleniyor...");
try {
    execSync(`"${SEVEN_ZIP}" a "${APK_PATH}" "${path.join(bundleDir, 'assets')}"`, { stdio: 'ignore' });
    console.log("[✔] Entegrasyon Tamamlandı!");
} catch(e) {
    console.log("7za entegrasyon uyarısı.");
}

console.log("[2/2] APK yeniden imzalanıyor...");
try {
    execSync(`"${JARSIGNER}" -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore "${KEYSTORE}" -storepass 123456 -keypass 123456 "${APK_PATH}" ykbkey`, { stdio: 'ignore' });
    console.log("[✔] Dijital İmza Tamamlandı!");
} catch(e) {}

console.log("\n==================================================");
console.log("  BAŞARILI: Masaüstüne YapiKrediMobil_v3.0.apk koyuldu!");
console.log("  Konum: C:\\Users\\PC\\Desktop\\YapiKrediMobil_v3.0.apk");
console.log("==================================================\n");
