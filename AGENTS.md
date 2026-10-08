# Yapı Kredi Mobil Clone Projesi — Antigravity Workspace Kuralları

Bu proje, arkadaşlarımızın Garanti Bankası Flutter uygulamasına karşılık geliştirdiğimiz Yapı Kredi Mobil clone projesidir.
Yeni bir Antigravity oturumu açıldığında bu dosya otomatik olarak okunacaktır.

## ÖNCEKİ OTURUMDAN DEVAM BİLGİSİ

Bu projeye devam ederken mutlaka `CONTEXT.md` dosyasını oku. İçinde:
- Tüm sohbet geçmişi özeti
- Projenin tam mimarisi ve dosya yapısı
- Garanti APK reverse-engineering bulguları
- Teknik detaylar ve kararlar
- Yapılması gereken bir sonraki adımlar

## PROJE HAKKINDA KISA ÖZET

Kullanıcı adı: Kaan
Proje: Yapı Kredi Mobil bankacılık UI clone (LDPlayer'da çalışan Android APK + Node.js backend)
Durum: Çalışır durumda, UI iyileştirmesi devam ediyor

### Mimari
```
[Node.js Sunucu (port 8000)] ← HTTP → [WebView APK (LDPlayer'da)] 
        ↑
[Admin Panel (127.0.0.1:8000/admin)]
```

### Kritik Dosyalar
- `server.js` — Ana backend (port 8000)
- `database.json` — Hesap/işlem verileri (JSON)
- `mobile_app/index.html` — Mobil UI (Inter font, dark theme)
- `admin_panel/index.html` — Yönetim paneli
- `patch_and_build.js` — APK derleme/imzalama motoru
- `kiosk_decoded/` — Decompile edilmiş WebView Kiosk APK (Smali patching yapıldı)
- `garanti_decompiled/` — Arkadaşların Garanti uygulamasının decompile hali
- `garanti_fake.apk` — Telefondan çekilen orijinal Garanti APK (~80MB)

### Garanti APK Analizi Bulguları
- Flutter ile yazılmış
- Backend URL: `https://2121kralbenim.pythonanywhere.com/api`
- Lokal test URL: `http://localhost:8000/api`
- Admin şifresi/kodu: `garanti123`
- API endpoint: `/statement/?days=`
- Ekranlar: ApiLoginScreen, AccountTransactionsScreen, DownloadOptionsScreen

### Araçlar
- `apktool.jar` + `uber-apk-signer.jar` → APK derleme/imzalama
- Java JRE: `C:\Program Files\Eclipse Adoptium\jre-25.0.2.10-hotspot`
- LDPlayer ADB: `C:\LDPlayer\LDPlayer9\adb.exe`
- APK'lar masaüstüne versiyon numarasıyla kaydedilir

### Kullanıcı Tercihleri
- APK'ları her zaman `C:\Users\PC\Desktop\YapiKrediMobil_vX.X.apk` formatında masaüstüne kaydet
- Onay isteme, direkt yap
- Türkçe konuş
