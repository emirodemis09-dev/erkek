Add-Type -AssemblyName System.IO.Compression.FileSystem

$apkmFile = "C:\Users\PC\.gemini\antigravity\scratch\apk_analyzer\com.ykb.android_4.0.70-444_4arch_7dpi_a907c82f9b7168b93a0c6a9a0a84dcd9_apkmirror.com.apkm"
$targetDir = "C:\Users\PC\.gemini\antigravity\scratch\yapi_kredi_clone\mobile_app\extracted_assets"

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force
}

Write-Host "Orijinal Yapı Kredi APK paketinden görsel ve asset'ler çıkarılıyor..." -ForegroundColor Cyan

$apkmZip = [System.IO.Compression.ZipFile]::OpenRead($apkmFile)
$baseEntry = $apkmZip.Entries | Where-Object { $_.Name -eq "base.apk" }

if ($baseEntry) {
    $tempBase = Join-Path $targetDir "base_temp.apk"
    if (Test-Path $tempBase) { Remove-Item $tempBase -Force }
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($baseEntry, $tempBase)
    $apkmZip.Dispose()

    $baseZip = [System.IO.Compression.ZipFile]::OpenRead($tempBase)
    
    # Extract PNG images, icons, logos from res/drawable and res/mipmap
    $imageEntries = $baseZip.Entries | Where-Object { 
        ($_.FullName -like "res/*png" -or $_.FullName -like "assets/*png" -or $_.FullName -like "assets/*webp") -and
        ($_.Name -like "*logo*" -or $_.Name -like "*ykb*" -or $_.Name -like "*world*" -or $_.Name -like "*icon*" -or $_.Name -like "*bank*")
    }

    Write-Host "Bulunan Görsel Dosya Sayısı: $($imageEntries.Count)" -ForegroundColor Green

    $count = 0
    foreach ($entry in $imageEntries | Select-Object -First 50) {
        $destPath = Join-Path $targetDir $entry.Name
        if (-not (Test-Path $destPath)) {
            try {
                [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destPath, $true)
                $count++
            } catch {}
        }
    }

    Write-Host "Başarıyla çıkarılan Yapı Kredi ikon & görselleri: $count adet" -ForegroundColor Green
    $baseZip.Dispose()
    Remove-Item $tempBase -Force
}
