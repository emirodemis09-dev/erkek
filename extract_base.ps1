Add-Type -AssemblyName System.IO.Compression.FileSystem

$src = 'C:\Users\PC\Downloads\com.ykb.android_4.0.70-444_4arch_7dpi_a907c82f9b7168b93a0c6a9a0a84dcd9_apkmirror.com.apkm'
$destApk = 'C:\Users\PC\.gemini\antigravity\scratch\yapi_kredi_clone\base.apk'

Write-Host "base.apk cikariliyor..."
$zip = [System.IO.Compression.ZipFile]::OpenRead($src)
$entry = $zip.Entries | Where-Object { $_.Name -eq 'base.apk' }
[System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destApk, $true)
$zip.Dispose()
Write-Host "Tamamlandi: $destApk"
