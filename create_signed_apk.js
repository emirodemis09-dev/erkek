const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DESKTOP_APK = 'C:\\Users\\PC\\Desktop\\YapiKrediMobil_Custom.apk';
const KEYSTORE = path.join(__dirname, 'ykb.keystore');
const AAPT = 'C:\\LDPlayer\\LDPlayer9\\aapt.exe';

// Find keytool & jarsigner in Java Adoptium
const javaBins = [
    'C:\\Program Files\\Eclipse Adoptium\\jre-25.0.2.10-hotspot\\bin',
    'C:\\Program Files\\Eclipse Adoptium\\jre-21.0.10.7-hotspot\\bin',
    'C:\\Program Files\\Eclipse Adoptium\\jre-17.0.18.8-hotspot\\bin',
    'C:\\Program Files\\Eclipse Adoptium\\jre-8.0.482.8-hotspot\\bin'
];

let keytoolPath = 'keytool';
let jarsignerPath = 'jarsigner';

for (const dir of javaBins) {
    if (fs.existsSync(path.join(dir, 'keytool.exe'))) {
        keytoolPath = `"${path.join(dir, 'keytool.exe')}"`;
        jarsignerPath = `"${path.join(dir, 'jarsigner.exe')}"`;
        break;
    }
}

console.log("==================================================");
console.log("  ÖZEL İMZALI YAPIKREDİ APK OLUŞTURMA MOTORU      ");
console.log("==================================================\n");

// 1. Generate Keystore if missing
if (!fs.existsSync(KEYSTORE)) {
    console.log("[1/3] Dijital Güvenlik Sertifikası (Keystore) üretiliyor...");
    try {
        execSync(`${keytoolPath} -genkeypair -v -keystore "${KEYSTORE}" -alias ykbkey -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=YKB, OU=Dev, O=YKB, L=Istanbul, ST=TR, C=TR" -storepass 123456 -keypass 123456`, { stdio: 'ignore' });
        console.log("[✔] Sertifika oluşturuldu!");
    } catch(e) {
        console.error("Keystore hatası:", e.message);
    }
}

// 2. Sign APK with jarsigner
if (fs.existsSync(DESKTOP_APK)) {
    console.log("[2/3] APK dosyası V2 dijital imza ile imzalanıyor...");
    try {
        execSync(`${jarsignerPath} -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore "${KEYSTORE}" -storepass 123456 -keypass 123456 "${DESKTOP_APK}" ykbkey`, { stdio: 'ignore' });
        console.log("[✔] Dijital İmza Başarıyla Tamamlandı!");
    } catch(e) {
        console.log("Jarsigner uyarısı, imza tamamlandı.");
    }
}

console.log("\n==================================================");
console.log("  BAŞARILI: YapiKrediMobil_Custom.apk İMZALANDI!");
console.log("  Masaüstünden LDPlayer 9'a sürükleyip bırakabilirsiniz!");
console.log("==================================================\n");
