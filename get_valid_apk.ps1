$dest = "C:\Users\PC\Desktop\YapiKrediMobil_Custom.apk"
$url = "https://github.com/derekeder/site-in-an-apk/releases/download/v1.0/site-in-an-apk.apk"

Write-Host "Geçerli İmzalı WebView APK indiriliyor..." -ForegroundColor Cyan

# Use Invoke-WebRequest with redirect follow
try {
    Invoke-WebRequest -Uri "https://github.com/derekeder/site-in-an-apk/archive/refs/tags/v1.0.zip" -OutFile "C:\Users\PC\Desktop\test.zip"
    Write-Host "İndirme başarılı!"
} catch {
    Write-Host "Hata: $_"
}
