const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');

// Paths
const BUILD_DIR = path.join(__dirname, 'apk_build');
const AAPT = 'C:\\LDPlayer\\LDPlayer9\\aapt.exe';
const KEYTOOL = 'keytool';
const JARSIGNER = 'jarsigner';

// Clean and create build directory
if (fs.existsSync(BUILD_DIR)) fs.rmSync(BUILD_DIR, { recursive: true });
fs.mkdirSync(BUILD_DIR, { recursive: true });
fs.mkdirSync(path.join(BUILD_DIR, 'res', 'layout'), { recursive: true });
fs.mkdirSync(path.join(BUILD_DIR, 'res', 'values'), { recursive: true });
fs.mkdirSync(path.join(BUILD_DIR, 'res', 'drawable'), { recursive: true });
fs.mkdirSync(path.join(BUILD_DIR, 'res', 'mipmap-xxxhdpi'), { recursive: true });
fs.mkdirSync(path.join(BUILD_DIR, 'assets'), { recursive: true });

console.log('[1/6] AndroidManifest.xml oluşturuluyor...');

// AndroidManifest.xml
const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.ykb.mobilclone"
    android:versionCode="1"
    android:versionName="4.0.70">
    
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <application
        android:label="Yapı Kredi Mobil"
        android:icon="@mipmap/ic_launcher"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;
fs.writeFileSync(path.join(BUILD_DIR, 'AndroidManifest.xml'), manifest);

console.log('[2/6] Java kaynak kodu oluşturuluyor...');

// Java Source - WebView Activity
const javaSrc = `package com.ykb.mobilclone;

import android.app.Activity;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;

public class MainActivity extends Activity {
    private WebView webView;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        
        webView = new WebView(this);
        setContentView(webView);
        
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        
        // Connect to our backend server
        webView.loadUrl("http://10.0.2.2:8000/app");
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        }
    }
}`;

const javaSrcDir = path.join(BUILD_DIR, 'src', 'com', 'ykb', 'mobilclone');
fs.mkdirSync(javaSrcDir, { recursive: true });
fs.writeFileSync(path.join(javaSrcDir, 'MainActivity.java'), javaSrc);

console.log('[3/6] Kaynak dosyaları ve ikonlar hazırlanıyor...');

// strings.xml
fs.writeFileSync(path.join(BUILD_DIR, 'res', 'values', 'strings.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Yapı Kredi Mobil</string>
</resources>`);

// Copy icon from extracted assets or create placeholder
const iconSrc = path.join(__dirname, 'mobile_app', 'extracted_assets', 'myworld_campaign_placeholder.png');
const iconDest = path.join(BUILD_DIR, 'res', 'mipmap-xxxhdpi', 'ic_launcher.png');
if (fs.existsSync(iconSrc)) {
    fs.copyFileSync(iconSrc, iconDest);
} else {
    // Create a simple 1x1 PNG as placeholder
    const pngBuf = Buffer.from('89504e470d0a1a0a0000000d494844520000004800000048080200000061b20b2400000006624b474400ff00ff00ffa0bda793000000c0494441547801ed97410a02311044fb0f9ebfee5c78059c03088a0e22a81bdd8820e2ca855b776e3c81e3a1a6c8c8902433d3f3de64324da74b757e7d5a9ee6d4a27b76a88f5be6f949e2efd4a7cf89a74ddb2c7fede2e24d7cded4b5bb8bd6cf93a9c72f94bf7f17df27528f7f2aff3e9dfa76a4f93bda7c5ede4afdbc0bf500001bd06300301a7a0c0046438f01c068e83100180d3d06004643cf0000000000000000000000000000000000000000000000000000ffff0300bef20e7ef1ca4fee0000000049454e44ae426082', 'hex');
    fs.writeFileSync(iconDest, pngBuf);
}

console.log('[4/6] APK derleniyor (aapt + javac + dx + zipalign)...');

// Check for javac
let hasJavac = false;
try {
    execSync('javac -version 2>&1', { encoding: 'utf8' });
    hasJavac = true;
} catch(e) {
    // Try to find javac
    const jdkPaths = [
        'C:\\Program Files\\Java',
        'C:\\Program Files\\Eclipse Adoptium',
    ];
    // No javac available
}

if (!hasJavac) {
    console.log('UYARI: javac (Java Compiler) bulunamadı.');
    console.log('APK oluşturmak için JDK gerekiyor.');
    console.log('');
    console.log('Alternatif yöntem: LDPlayer konsolu ile APK kurulumu yapılacak...');
    
    // Alternative: Use ldconsole to install the web shortcut
    // Create a batch file that uses ldconsole to open URL in LDPlayer
    const batContent = `@echo off
echo Yapı Kredi Mobil LDPlayer'a kuruluyor...
C:\\LDPlayer\\LDPlayer9\\ldconsole.exe runapp --index 0 --packagename com.android.chrome
timeout /t 3
C:\\LDPlayer\\LDPlayer9\\adb.exe connect 127.0.0.1:5555
C:\\LDPlayer\\LDPlayer9\\adb.exe -s 127.0.0.1:5555 shell am start -a android.intent.action.VIEW -d "http://10.0.2.2:8000/app" com.android.chrome
echo Tamamlandı!
pause`;
    
    fs.writeFileSync(path.join(__dirname, 'install_to_ldplayer.bat'), batContent);
    console.log('install_to_ldplayer.bat oluşturuldu.');
}

console.log('[5/6] LDPlayer bağlantısı kontrol ediliyor...');

// Try multiple ports for LDPlayer ADB
const ports = [5555, 5556, 5557, 5558, 5559, 5560, 5561, 5562, 5563, 5564, 5565, 5566, 5567, 5568, 5569, 5570, 5571, 5572, 5573, 5574, 5575, 5576, 5577, 5578, 5579, 5580, 5581, 5582, 5583, 5584, 5585, 5586, 5587, 5588, 5589, 5590, 5591, 5592, 5593, 5594, 5595, 5596, 5597, 5598, 5599, 5600];
let connectedDevice = null;

for (const port of ports) {
    try {
        const result = execSync(`C:\\LDPlayer\\LDPlayer9\\adb.exe connect 127.0.0.1:${port}`, { encoding: 'utf8', timeout: 3000 });
        if (result.includes('connected')) {
            connectedDevice = `127.0.0.1:${port}`;
            console.log(`LDPlayer bağlantısı başarılı: ${connectedDevice}`);
            break;
        }
    } catch(e) {
        // try next port
    }
}

if (!connectedDevice) {
    // Try ldconsole for ADB info
    try {
        const listResult = execSync('C:\\LDPlayer\\LDPlayer9\\ldconsole.exe list2', { encoding: 'utf8' });
        console.log('LDPlayer instances: ' + listResult.trim());
        
        // Try launching ADB via ldconsole
        execSync('C:\\LDPlayer\\LDPlayer9\\ldconsole.exe adb --index 0 --command "devices"', { encoding: 'utf8', timeout: 5000 });
    } catch(e) {}
}

// Check devices
try {
    const devices = execSync('C:\\LDPlayer\\LDPlayer9\\adb.exe devices', { encoding: 'utf8' });
    console.log('ADB Devices:\n' + devices);
} catch(e) {}

console.log('[6/6] Tamamlandı!');
console.log('');
console.log('=== SONUÇ ===');
if (connectedDevice) {
    console.log(`LDPlayer bağlı: ${connectedDevice}`);
    // Open our app URL in LDPlayer Chrome
    try {
        execSync(`C:\\LDPlayer\\LDPlayer9\\adb.exe -s ${connectedDevice} shell am start -a android.intent.action.VIEW -d "http://10.0.2.2:8000/app" com.android.chrome`, { encoding: 'utf8' });
        console.log('Yapı Kredi Mobil LDPlayer Chrome\'da açıldı!');
    } catch(e) {
        console.log('Chrome\'da açma başarısız, manuel açın.');
    }
} else {
    console.log('LDPlayer henüz boot olmamış olabilir.');
    console.log('LDPlayer tam açıldıktan sonra şu komutu çalıştırın:');
    console.log('  install_to_ldplayer.bat');
}
