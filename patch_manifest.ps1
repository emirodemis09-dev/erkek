$manifestPath = 'C:\Users\PC\.gemini\antigravity\scratch\yapi_kredi_clone\ykb_decoded\AndroidManifest.xml'

Write-Host "AndroidManifest.xml duzenleniyor..."

$content = Get-Content $manifestPath -Raw -Encoding UTF8

# 1. Split APK zorunluluğunu kaldır (en kritik hata)
$content = $content -replace 'android:requiredSplitTypes="[^"]*"', ''
$content = $content -replace 'android:splitTypes="[^"]*"', ''

# 2. HTTP trafiğine izin ver (cleartext)
$content = $content -replace 'android:usesCleartextTraffic="false"', 'android:usesCleartextTraffic="true"'

# 3. Native lib extraction aç (emülatörde gerekli)
$content = $content -replace 'android:extractNativeLibs="false"', 'android:extractNativeLibs="true"'

# 4. Network security config varsa kaldır
$content = $content -replace 'android:networkSecurityConfig="[^"]*"', ''

# 5. Ekran kaydını engellemeyi kaldır
$content = $content -replace '<uses-permission android:name="android.permission.DETECT_SCREEN_RECORDING"/>', ''

Set-Content $manifestPath -Value $content -Encoding UTF8
Write-Host "TAMAMLANDI! Manifest duzenlendi."
