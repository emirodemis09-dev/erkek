Add-Type -AssemblyName System.IO.Compression.FileSystem

$apkmFile = "C:\Users\PC\.gemini\antigravity\scratch\apk_analyzer\com.ykb.android_4.0.70-444_4arch_7dpi_a907c82f9b7168b93a0c6a9a0a84dcd9_apkmirror.com.apkm"
$desktopApk = "C:\Users\PC\Desktop\YapiKrediMobil.apk"

Write-Host "Masaüstüne YapiKrediMobil.apk hazırlanıyor..." -ForegroundColor Cyan

$apkmZip = [System.IO.Compression.ZipFile]::OpenRead($apkmFile)
$baseEntry = $apkmZip.Entries | Where-Object { $_.Name -eq "base.apk" }

if ($baseEntry) {
    if (Test-Path $desktopApk) { Remove-Item $desktopApk -Force }
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($baseEntry, $desktopApk)
    Write-Host "BAŞARILI: Masaüstüne YapiKrediMobil.apk dosyası çıkarıldı!" -ForegroundColor Green
}
$apkmZip.Dispose()
