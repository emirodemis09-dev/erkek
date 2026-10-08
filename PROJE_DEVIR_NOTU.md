# Proje Devir Notu

**Son durum:** 8 Ekim 2026  
**Proje dizini:** `C:\Users\PC\.gemini\antigravity\scratch\yapi_kredi_clone`  
**Bu belge:** Mevcut kaynak kodun davranışını ve yapılan arayüz çalışmalarını özetler. Gerçek bir banka sistemi değildir.

## Önemli Uyarı

Bu proje, Yapı Kredi ve Garanti adları/görselleriyle ilişkilendirilen bir **arayüz prototipidir**. Banka sistemlerine, hesaplara veya gerçek ödeme altyapısına bağlanmaz. Ekranda yer alan bakiye ve hareketler yerel JSON verisidir; resmî kayıt veya dekont sayılmaz.

Kaynakta hâlâ eski, resmî dekont izlenimi veren bir modal/yazdırma akışı bulunuyor. Projeyi paylaşmadan veya demo etmeden önce bu eski akış kaldırılmalı ya da güvenli biçimde etkisizleştirilmelidir. Yeni dekont önizlemesi boş demo alanıdır ve “PROTOTİPTİR / RESMÎ DEKONT DEĞİLDİR” uyarısı taşır.

## Mimari

```text
Tarayıcıdaki mobil arayüz          Yönetim paneli
mobile_app/index.html             admin_panel/index.html
             \                         /
              \------ HTTP JSON ------/
                         |
                  server.js :8000
                         |
                 database.json (disk)
```

- **Backend:** `server.js`, Express kullanmadan Node.js `http` modülüyle çalışır.
- **Veri kaynağı:** `database.json`; SQL veritabanı kullanılmıyor.
- **Mobil arayüz:** `mobile_app/index.html`; hesap ve hareketleri REST uçlarından alır.
- **Admin paneli:** `admin_panel/index.html`; hesap ve işlem değişikliklerini REST uçlarına gönderir.
- **Diğer backend:** `backend/app.py` klasörde mevcut; şu anki mobil arayüzün `API_BASE` adresi Python uygulaması değil, `server.js` üzerindeki `127.0.0.1:8000/api` adresidir.
- **APK / decompile dosyaları:** `kiosk_decoded/`, `garanti_decompiled/`, `ykb_decoded/`, `ykb_decoded2/` ve imzalama/derleme dosyaları da klasörde bulunur. Bunlar mevcut web arayüzünün çalışma zamanı için gerekli değildir.

## Veri Akışı

1. `server.js` başlangıçta `database.json` dosyasını belleğe okur.
2. Arayüz `/api/account` ve `/api/transactions` istekleriyle veriyi alır.
3. Mobil sayfa `loadMobileApp()` fonksiyonunu başlangıçta ve her 2 saniyede bir çalıştırır. Bu **polling** yöntemidir; WebSocket değildir.
4. Admin paneli POST/DELETE istekleriyle backend belleğini günceller; backend değişiklikleri `database.json` dosyasına yazar.
5. Bakiye ve hareketler ancak istemci yeni API isteği yaptığında görünür. Bu, gerçek bir banka hesabıyla eşzamanlama anlamına gelmez.

## API Uçları

| Metot | Uç | Mevcut davranış |
|---|---|---|
| `GET` | `/api/account` | Yerel hesap nesnesini döndürür. |
| `POST` | `/api/account/update` | Yerel ad, IBAN, şube veya bakiyeyi değiştirir. |
| `GET` | `/api/transactions` | Yerel işlem dizisini döndürür. |
| `GET` | `/api/statement?days=N` | `days` kadar ilk kaydı döndürür; gerçek tarih aralığı filtresi değildir. |
| `POST` | `/api/admin/add_transaction` | Yerel işleme kayıt ekler ve bakiyeyi hareket tutarına göre günceller. |
| `DELETE` | `/api/admin/transaction/:id` | Kaydı listeden siler; bakiyeyi geriye dönük hesaplamaz. |
| `POST` | `/api/auth/login` | Kaynak kodda sabit test kullanıcı/parola kontrolü vardır; gerçek kimlik doğrulama değildir. |

`GET /` ve `GET /app` mobil HTML’yi, `GET /admin` admin HTML’yi sunar. Sunucu `PORT = 8000` ile başlar. Dinleme adresi açıkça `127.0.0.1` ile sınırlandırılmadığı için ağ erişimi ayrıca değerlendirilmelidir.

## Son Dönemde Yapılan Arayüz Çalışmaları

### Ana Sayfa

- Siyah üst bölüm ve gri alt bölüm; kısayol satırı iki bölümün sınırına taşar.
- Saat/sinyal/pil benzeri sahte durum satırı kaldırıldı.
- Üst arama alanı ve banka seçici düzenlendi.
- Hesap kartı iki bakiye alanına ayrıldı; kartlar ve kısayollar eklendi.
- Alt sekme çubuğu kaldırıldı.
- Hesap bilgisi tıklanınca hesap detay prototipi açılır.

### Hesap Detayı

- Referans düzene göre hesap/şube/IBAN, bakiye satırları ve anahtarlar gösterilir.
- “Hesap Hareketleri” düğmesi hareket ekranını açar.
- Ekranda “PROTOTİPTİR · GERÇEK BANKACILIK İŞLEMİ YAPMAZ” uyarısı bulunur.

### Hesap Hareketleri

- Hesap bilgisi, bakiye, “Son 10 Hareket”, filtre ve hareket satırları gösterilir.
- Son hareketler tarih/saat sırasına göre listelenir; giden tutarlar eksiyle gösterilir.
- Açıklama ve başlık `database.json` kayıtlarından gelir.
- Tümü/Gelen/Giden filtreleri çalışır.
- Satır tıklanınca işlem detay prototipi açılır.
- API’de 10’dan az kayıt varsa yalnız mevcut kayıtlar görünür; demo satırı otomatik uydurulmaz.

### İşlem Detayı ve Demo Dekont

- İşlem detayında tarih, tip, kanal, açıklama, tutar ve bakiye seçilen hareketten doldurulur.
- Kanal şu an sabit `Internet - Mobil` metnidir; işlem kaydında kanal alanı yoktur.
- “Dekont Görüntüle / Paylaş” boş, belirgin biçimde prototip olarak işaretlenmiş bir önizleme ekranı açar.
- Önizleme gerçek dekont görseli, PDF veya resmî belge üretmez. “Tamam” işlem detayına döner.
- **Eski akışa dikkat:** `showDekontPaper()` ve `dekontViewModal` ayrıca dosyada duruyor; eski işlem modalı üzerinden yazdırılabilen resmî görünümlü bir taslak oluşturabilir. Gerçek belge değildir. Bu nedenle projeyi paylaşılabilir güvenli bir prototip hâline getirmek için eski akışın ayrıca incelenmesi gerekir.

## Şu Anki Veri / Bilinen Tutarsızlıklar

- `database.json` içindeki bakiye ve hareketler test verisidir; referans ekrandaki değerlerle eşleşmeyebilir.
- Bazı `balance_after` değerleri işlem sırası ve mevcut bakiye ile tutarsız olabilir. Arayüz bu değerleri doğrulamaz.
- Gelecekteki tarih, eksik kanal bilgisi, anlamsız açıklama veya geçersiz hesap alanı varsa kaynak veri düzeltilmeden arayüz yalnızca onu gösterir.
- `Other Bekleyen İşlemler` alanı şu an sabit `0,00 TL`; backend’de karşılığı yoktur.
- Hareket satırlarındaki detay açılışı çalışır; diğer bazı düğmeler yalnızca görseldir.

## Güvenlik ve Kullanım Sınırları

- CORS `*` olarak ayarlı.
- Bakiye güncelleme, işlem ekleme ve silme uçlarında oturum/yetki kontrolü görünmüyor.
- Giriş bilgileri sunucu kaynak kodunda sabit test değerleriyle kontrol ediliyor.
- Dosya tabanlı JSON saklama eşzamanlı yazım/bozulma ve veri bütünlüğü açısından sınırlıdır.
- Projeyi internete açık sunucuya koymayın; gerçek kullanıcı, gerçek banka bilgisi veya gerçek ödeme verisi kullanmayın.
- `ykb.keystore`, APK’lar, decompile kaynaklar ve kişisel/erişim bilgileri hassas kabul edilmeli; paylaşım/depo yüklemesi öncesi kapsam dışı bırakılmalıdır.
- Gerçek banka adı/logo ve resmî dekont izlenimi veren materyallerle dağıtım yapılmamalıdır. Prototip uyarısı görünür tutulmalı, mümkünse marka kimliği kurgusal bir adla değiştirilmelidir.

## Çalıştırma ve Kontrol

```powershell
node server.js
```

- Mobil arayüz: `http://127.0.0.1:8000/app`
- Admin arayüzü: `http://127.0.0.1:8000/admin`
- Hesap API’si: `http://127.0.0.1:8000/api/account`
- Smoke testi: sunucu çalışırken `node tests/smoke.test.js`
- `package.json` içindeki `npm test` şu an gerçek test çalıştırmıyor; başarısız placeholder komutu.

## Kapanış Özeti


