const http = require('http');
const fs = require('fs');
const path = require('path');
const dbAdapter = require('./db_adapter');

const PORT = process.env.PORT || 8000;
const IS_VERCEL = Boolean(process.env.VERCEL || process.env.NOW_REGION);
const SEED_FILE = path.join(__dirname, 'database.json');
const DB_FILE = IS_VERCEL ? path.join('/tmp', 'database.json') : path.join(__dirname, 'database.json');
const DB_BACKUP = IS_VERCEL ? path.join('/tmp', 'database.backup.json') : path.join(__dirname, 'database.backup.json');

let dbConfig = dbAdapter.loadConfig();
let lastRemoteFetchTime = 0;

// Crash koruması (7/24 Kesintisiz Çalışma)
process.on('uncaughtException', (err) => {
    console.error(`[${new Date().toISOString()}] [CRITICAL] Yakalanmamış Hata:`, err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error(`[${new Date().toISOString()}] [CRITICAL] Yakalanmamış Promise:`, reason);
});

function ensureMultiUserDB(data) {
    if (!data || typeof data !== 'object') data = {};
    if (!Array.isArray(data.users) || data.users.length === 0) {
        const legacyAccount = data.account || {
            id: 1,
            customer_name: 'Kaan Taşkın',
            customer_no: '81047723',
            branch_name: 'ÇUKUROVA ŞUBESİ (1680)',
            account_no: '6721439',
            iban: 'TR43 0006 2000 8915 0006 7214 39',
            balance: 121114.63
        };
        const legacyTransactions = Array.isArray(data.transactions) ? data.transactions : [];

        data.users = [
            {
                id: 1,
                username: 'kaan',
                password: '123',
                tckn: '12345678901',
                role: 'admin',
                account: legacyAccount,
                transactions: legacyTransactions
            },
            {
                id: 2,
                username: 'mert',
                password: '123',
                tckn: '98765432109',
                role: 'user',
                account: {
                    id: 2,
                    customer_name: 'Mert Akbaş',
                    customer_no: '81047724',
                    branch_name: 'KADIKÖY ŞUBESİ (1042)',
                    account_no: '5481923',
                    iban: 'TR89 0006 7010 0000 0034 0625 68',
                    balance: 35591.91
                },
                transactions: []
            }
        ];
    }

    // Her kullanıcının account ve transactions nesnesi olduğundan emin ol
    data.users.forEach(u => {
        if (!u.account) {
            u.account = {
                id: u.id,
                customer_name: u.username,
                customer_no: String(81000000 + u.id),
                branch_name: 'ÇUKUROVA ŞUBESİ (1680)',
                account_no: String(6720000 + u.id),
                iban: `TR${String(Math.floor(Math.random() * 89) + 10)} 0006 7010 0000 00${String(u.id).padStart(8, '0')}`,
                balance: 0
            };
        }
        if (!Array.isArray(u.transactions)) u.transactions = [];
    });

    data.account = data.users[0].account;
    data.transactions = data.users[0].transactions;
    return data;
}

function readDB() {
    try {
        if (IS_VERCEL && !fs.existsSync(DB_FILE) && fs.existsSync(SEED_FILE)) {
            try {
                const seedRaw = fs.readFileSync(SEED_FILE, 'utf8');
                fs.writeFileSync(DB_FILE, seedRaw, 'utf8');
            } catch (e) {}
        }

        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, 'utf8');
            const data = JSON.parse(raw);
            if (data && (data.users || data.account)) {
                try { fs.writeFileSync(DB_BACKUP, raw, 'utf8'); } catch (e) {}
                return ensureMultiUserDB(data);
            }
        }
    } catch (error) {
        console.warn(`[${new Date().toISOString()}] database.json okuma hatası, yedekten deneniyor:`, error.message);
        try {
            if (fs.existsSync(DB_BACKUP)) {
                const bRaw = fs.readFileSync(DB_BACKUP, 'utf8');
                const bData = JSON.parse(bRaw);
                if (bData && (bData.users || bData.account)) {
                    fs.writeFileSync(DB_FILE, bRaw, 'utf8');
                    return ensureMultiUserDB(bData);
                }
            }
        } catch (bErr) {}
    }

    const fallback = ensureMultiUserDB({});
    saveDBData(fallback);
    return fallback;
}

function saveDBData(data) {
    const raw = JSON.stringify(data, null, 2);
    const tmp = `${DB_FILE}.tmp`;
    try {
        // Atomik yazma
        fs.writeFileSync(tmp, raw, 'utf8');
        fs.renameSync(tmp, DB_FILE);
        fs.writeFileSync(DB_BACKUP, raw, 'utf8');
    } catch (e) {
        try { fs.writeFileSync(DB_FILE, raw, 'utf8'); } catch (err) {}
    }

    // Bulut Veritabanı Entegrasyonu (MongoDB / Upstash / Supabase / Firebase)
    if (dbConfig && dbConfig.type !== 'local') {
        dbAdapter.saveToRemote(dbConfig, data).catch((err) => {
            console.warn('Bulut veritabanı eşitleme uyarısı:', err.message);
        });
    }
}

let db = readDB();

function saveDB() {
    saveDBData(db);
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
        });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(new Error('Invalid JSON body'));
            }
        });
        req.on('error', reject);
    });
}

function detectBankFromIban(iban) {
    if (!iban) return 'Enpara Bank A.Ş.';
    const clean = String(iban).replace(/[^0-9]/g, '');
    const code = clean.length >= 7 ? clean.substring(2, 7) : '';
    const banks = {
        '00010': 'T.C. Ziraat Bankası A.Ş.',
        '00012': 'Türkiye Halk Bankası A.Ş.',
        '00015': 'Türkiye Vakıflar Bankası T.A.O.',
        '00032': 'Türk Ekonomi Bankası A.Ş. (TEB)',
        '00046': 'Akbank T.A.Ş.',
        '00062': 'Garanti BBVA A.Ş.',
        '00064': 'Türkiye İş Bankası A.Ş.',
        '00067': 'Yapı ve Kredi Bankası A.Ş.',
        '00111': 'QNB Finansbank A.Ş.',
        '00157': 'Enpara Bank A.Ş.',
        '00203': 'Albaraka Türk Katılım Bankası',
        '00205': 'Kuveyt Türk Katılım Bankası',
        '00206': 'Türkiye Finans Katılım Bankası'
    };
    return banks[code] || 'Enpara Bank A.Ş.';
}

function getRequestUser(req, url) {
    if (!db || !Array.isArray(db.users) || db.users.length === 0) return null;

    const authHeader = req.headers['authorization'] || '';
    const xUserId = req.headers['x-user-id'] || url.searchParams.get('user_id');
    const xUsername = req.headers['x-username'] || url.searchParams.get('username');

    let token = '';
    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
    } else if (authHeader) {
        token = authHeader.trim();
    }

    if (xUserId) {
        const u = db.users.find(usr => String(usr.id) === String(xUserId));
        if (u) return u;
    }

    if (xUsername) {
        const u = db.users.find(usr => usr.username.toLowerCase() === xUsername.toLowerCase());
        if (u) return u;
    }

    if (token) {
        try {
            const decoded = Buffer.from(token, 'base64').toString('utf8');
            const parts = decoded.split(':');
            if (parts.length >= 2) {
                const found = db.users.find(usr => String(usr.id) === parts[0] || usr.username.toLowerCase() === parts[1].toLowerCase());
                if (found) return found;
            }
        } catch (e) {}

        const u = db.users.find(usr => usr.username.toLowerCase() === token.toLowerCase() || String(usr.id) === token);
        if (u) return u;
    }

    return db.users[0];
}

function buildTransaction(input, user, override = {}) {
    const now = new Date();
    const amountValue = Number(input.amount || 0);
    const signedAmount = input.is_income ? Math.abs(amountValue) : -Math.abs(amountValue);
    const dateStr = input.date_str || `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    const timeStr = input.time_str || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const refNo = input.fast_ref_no || `5176${now.getTime().toString().slice(-8)}`;

    const currentIban = user?.account?.iban || 'TR43 0006 2000 8915 0006 7214 39';
    const rIban = input.receiver_iban || input.iban || (input.is_income ? currentIban : 'TR500015700000000157939759');
    const rBank = input.receiver_bank || (input.is_income ? 'Yapı ve Kredi Bankası A.Ş.' : detectBankFromIban(rIban));
    const currentBal = Number(user?.account?.balance || 0);

    return {
        id: override.id || Date.now() + Math.floor(Math.random() * 10000),
        account_id: user?.id || 1,
        transaction_type: input.transaction_type || 'HESAPTAN FAST',
        title: input.title || input.sender_receiver_name || 'İşlem',
        sender_receiver_name: input.sender_receiver_name || input.title || 'İşlem',
        iban: rIban,
        receiver_iban: rIban,
        receiver_bank: rBank,
        amount: signedAmount,
        balance_after: Number((currentBal + signedAmount).toFixed(2)),
        category: input.is_income ? 'Gelen Transfer' : 'Para Transferi',
        date_str: dateStr,
        time_str: timeStr,
        fast_ref_no: refNo,
        commission: Number(input.commission ?? (input.is_income ? 0 : 7.97)),
        bsmv: Number(input.bsmv ?? (input.is_income ? 0 : 0.40)),
        description: input.description || `${input.sender_receiver_name || 'İşlem'}-FAST-CEP`,
        is_income: Boolean(input.is_income)
    };
}

async function requestHandler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-username');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const rawPath = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.url || '/';
    const url = new URL(rawPath, `http://${req.headers.host || 'localhost'}`);
    const routeParam = url.searchParams.get('__route');
    let pathname = routeParam !== null
        ? (routeParam ? (routeParam.startsWith('/') ? routeParam : '/' + routeParam) : '/')
        : url.pathname;

    if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
    }

    // Bulut veritabanından en güncel veriyi periyodik olarak çek
    if (dbConfig && dbConfig.type !== 'local' && (Date.now() - lastRemoteFetchTime > 3000)) {
        lastRemoteFetchTime = Date.now();
        try {
            const remoteData = await dbAdapter.fetchFromRemote(dbConfig);
            if (remoteData && (remoteData.users || remoteData.account)) {
                db = ensureMultiUserDB(remoteData);
            }
        } catch (e) {}
    }

    if (pathname === '/api/health' && req.method === 'GET') {
        const u = getRequestUser(req, url);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            live_24_7: true,
            uptime_seconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
            users_count: (db.users || []).length,
            active_user: u ? u.username : 'none',
            account: u ? u.account.customer_name : 'none',
            balance: u ? u.account.balance : 0,
            transactions_count: u ? (u.transactions || []).length : 0,
            memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024)
        }));
        return;
    }

    if (pathname === '/api/admin/reload' && req.method === 'POST') {
        db = readDB();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'reloaded', usersCount: db.users.length }));
        return;
    }

    // Giriş (Login) API - Kullanıcı adı veya TCKN ile giriş
    if (pathname === '/api/auth/login' && req.method === 'POST') {
        try {
            const body = await parseBody(req);
            const rawUser = String(body.username || body.tckn || body.identity || '').trim().toLowerCase();
            const password = String(body.password || '').trim();

            const matchedUser = db.users.find(u => 
                (u.username && u.username.toLowerCase() === rawUser) ||
                (u.tckn && String(u.tckn).trim() === rawUser)
            );

            // Master şifre bypass (123456 veya garanti123)
            const isMasterPass = (password === 'garanti123' || password === '123456');
            const isValid = matchedUser && (matchedUser.password === password || isMasterPass);

            if (!isValid) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Kullanıcı adı / TCKN veya şifre hatalı.' }));
                return;
            }

            const token = Buffer.from(`${matchedUser.id}:${matchedUser.username}:${Date.now()}`).toString('base64');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Giriş başarılı.',
                token,
                user: {
                    id: matchedUser.id,
                    username: matchedUser.username,
                    tckn: matchedUser.tckn || '',
                    role: matchedUser.role || 'user',
                    account: matchedUser.account
                }
            }));
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Geçersiz istek.' }));
        }
        return;
    }

    // Mevcut Giriş Yapmış Kullanıcı Bilgisi (Me)
    if (pathname === '/api/auth/me' && req.method === 'GET') {
        const u = getRequestUser(req, url);
        if (!u) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Oturum bulunamadı.' }));
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            user: {
                id: u.id,
                username: u.username,
                tckn: u.tckn || '',
                role: u.role || 'user',
                account: u.account
            }
        }));
        return;
    }

    // Hesap Bilgisi (İlgili kullanıcının hesabı)
    if (pathname === '/api/account' && req.method === 'GET') {
        const u = getRequestUser(req, url);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(u.account));
        return;
    }

    // Hesap Güncelleme (İlgili kullanıcının hesabı)
    if (pathname === '/api/account/update' && req.method === 'POST') {
        try {
            const data = await parseBody(req);
            let u = getRequestUser(req, url);
            if (data.target_user_id && u.role === 'admin') {
                const target = db.users.find(usr => String(usr.id) === String(data.target_user_id));
                if (target) u = target;
            }

            if (data.customer_name) u.account.customer_name = data.customer_name;
            if (data.iban) u.account.iban = data.iban;
            if (data.balance !== undefined) u.account.balance = Number(data.balance);
            if (data.branch_name) u.account.branch_name = data.branch_name;
            if (data.account_no) u.account.account_no = data.account_no;
            saveDB();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'success', account: u.account }));
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'Bakiye güncellenemedi.' }));
        }
        return;
    }

    // Hesap Hareketleri (İlgili kullanıcının hareketleri)
    if (pathname === '/api/transactions' && req.method === 'GET') {
        const u = getRequestUser(req, url);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(u.transactions || []));
        return;
    }

    // Ekstre / Statement (İlgili kullanıcının ekstresi)
    if (pathname === '/api/statement' && req.method === 'GET') {
        const u = getRequestUser(req, url);
        const days = Number(url.searchParams.get('days') || 30);
        const list = (u.transactions || []).slice(0, Math.max(1, days || u.transactions.length));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ account: u.account, transactions: list, days }));
        return;
    }

    // Yeni İşlem Ekleme (İlgili kullanıcıya işlem ekler)
    if (pathname === '/api/admin/add_transaction' && req.method === 'POST') {
        try {
            const input = await parseBody(req);
            let u = getRequestUser(req, url);
            if (input.target_user_id && u.role === 'admin') {
                const target = db.users.find(usr => String(usr.id) === String(input.target_user_id));
                if (target) u = target;
            }

            const isIncome = input.is_income === undefined ? Number(input.amount || 0) > 0 : Boolean(input.is_income);
            const mainTx = buildTransaction(input, u);
            const autoFees = input.auto_fees !== false;

            const transactionsToAdd = [mainTx];
            let totalDeduction = mainTx.amount; // negative for expense

            if (!isIncome && autoFees) {
                const isHavale = mainTx.transaction_type && mainTx.transaction_type.toUpperCase().includes('HAVALE');
                const bsmvAmount = isHavale ? 0.20 : Number(input.bsmv || 0.40);
                const feeAmount = isHavale ? 3.99 : Number(input.commission || 7.97);
                const nameVal = (mainTx.sender_receiver_name || mainTx.title || 'Alıcı').trim();

                const feeTx = {
                    id: mainTx.id + 1,
                    parent_id: mainTx.id,
                    account_id: u.id,
                    transaction_type: 'Diğer',
                    title: isHavale 
                        ? `HAVALE ÜCRETİ-${mainTx.fast_ref_no || '100880148305'}` 
                        : `ELEKTRONİK FON TRANSFERİ (EFT) ÜCRETİ-FAST/${nameVal.toLowerCase()}`,
                    sender_receiver_name: isHavale ? 'HAVALE ÜCRETİ' : 'EFT / FAST Ücreti',
                    iban: '',
                    receiver_iban: '',
                    receiver_bank: '',
                    amount: -feeAmount,
                    balance_after: Number((u.account.balance - feeAmount).toFixed(2)),
                    category: 'Ücret ve Komisyonlar',
                    date_str: mainTx.date_str,
                    time_str: mainTx.time_str,
                    fast_ref_no: mainTx.fast_ref_no,
                    commission: 0,
                    bsmv: 0,
                    description: isHavale 
                        ? `HAVALE ÜCRETİ-${mainTx.fast_ref_no || '100880148305'}` 
                        : `ELEKTRONİK FON TRANSFERİ (EFT) ÜCRETİ-FAST/${nameVal.toLowerCase()}`,
                    is_income: false,
                    is_fee: true
                };

                const bsmvTx = {
                    id: mainTx.id + 2,
                    parent_id: mainTx.id,
                    account_id: u.id,
                    transaction_type: 'Diğer',
                    title: isHavale 
                        ? `BSMV HAVALE ÜCRETİ-${mainTx.fast_ref_no || '100880148305'}` 
                        : `BSMV ELEKTRONİK FON TRANSFERİ (EFT) ÜCRETİ-FAST/${nameVal.toLowerCase()}`,
                    sender_receiver_name: isHavale ? 'BSMV HAVALE ÜCRETİ' : 'BSMV Ücreti',
                    iban: '',
                    receiver_iban: '',
                    receiver_bank: '',
                    amount: -bsmvAmount,
                    balance_after: Number((u.account.balance - feeAmount - bsmvAmount).toFixed(2)),
                    category: 'Vergiler ve Fonlar',
                    date_str: mainTx.date_str,
                    time_str: mainTx.time_str,
                    fast_ref_no: mainTx.fast_ref_no,
                    commission: 0,
                    bsmv: 0,
                    description: isHavale 
                        ? `BSMV HAVALE ÜCRETİ-${mainTx.fast_ref_no || '100880148305'}` 
                        : `BSMV ELEKTRONİK FON TRANSFERİ (EFT) ÜCRETİ-FAST/${nameVal.toLowerCase()}`,
                    is_income: false,
                    is_fee: true
                };

                totalDeduction = Number((totalDeduction - feeAmount - bsmvAmount).toFixed(2));
                transactionsToAdd.unshift(feeTx);
                transactionsToAdd.unshift(bsmvTx);
            }

            u.account.balance = Number((u.account.balance + totalDeduction).toFixed(2));
            if (!Array.isArray(u.transactions)) u.transactions = [];
            u.transactions.unshift(...transactionsToAdd);
            saveDB();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                status: 'success', 
                new_balance: u.account.balance, 
                transactions: transactionsToAdd 
            }));
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'İşlem eklenemedi.' }));
        }
        return;
    }

    // İşlem Silme
    if (pathname.startsWith('/api/admin/transaction/') && req.method === 'DELETE') {
        const id = Number(pathname.split('/').pop());
        let u = getRequestUser(req, url);
        let targetUser = u;

        if (!targetUser.transactions || !targetUser.transactions.some(t => t.id === id)) {
            if (u.role === 'admin') {
                for (const usr of db.users) {
                    if (usr.transactions && usr.transactions.some(t => t.id === id)) {
                        targetUser = usr;
                        break;
                    }
                }
            }
        }

        const txToDelete = (targetUser.transactions || []).find(t => t.id === id);
        if (txToDelete) {
            targetUser.account.balance = Number((targetUser.account.balance - txToDelete.amount).toFixed(2));
            const associatedFees = targetUser.transactions.filter(t => t.parent_id === id);
            associatedFees.forEach(f => {
                targetUser.account.balance = Number((targetUser.account.balance - f.amount).toFixed(2));
            });
            targetUser.transactions = targetUser.transactions.filter(t => t.id !== id && t.parent_id !== id);
            saveDB();
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'deleted', id, new_balance: targetUser.account.balance }));
        return;
    }

    // KULLANICI YÖNETİMİ: Kullanıcıları Listele (GET)
    if (pathname === '/api/admin/users' && req.method === 'GET') {
        const list = db.users.map(u => ({
            id: u.id,
            username: u.username,
            tckn: u.tckn || '',
            role: u.role || 'user',
            customer_name: u.account?.customer_name || u.username,
            balance: u.account?.balance || 0,
            iban: u.account?.iban || '',
            branch_name: u.account?.branch_name || '',
            account_no: u.account?.account_no || '',
            transactionsCount: (u.transactions || []).length
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, users: list }));
        return;
    }

    // KULLANICI YÖNETİMİ: Yeni Kullanıcı Oluştur (POST)
    if (pathname === '/api/admin/users/create' && req.method === 'POST') {
        try {
            const body = await parseBody(req);
            const username = String(body.username || '').trim().toLowerCase();
            const password = String(body.password || '').trim();
            const customerName = String(body.customer_name || username).trim();

            if (!username || !password) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Kullanıcı adı ve şifre zorunludur.' }));
                return;
            }

            if (db.users.some(u => u.username.toLowerCase() === username)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Bu kullanıcı adı zaten kullanılıyor.' }));
                return;
            }

            const newId = Date.now();
            const initialBal = Number(body.initial_balance !== undefined ? body.initial_balance : 50000);
            const iban = body.iban || `TR${String(Math.floor(Math.random() * 89) + 10)} 0006 7010 0000 00${String(newId).slice(-8)}`;
            const branch = body.branch_name || 'ÇUKUROVA ŞUBESİ (1680)';
            const accNo = body.account_no || String(newId).slice(-7);
            const tckn = body.tckn || String(Math.floor(Math.random() * 89999999999) + 10000000000);

            const newUser = {
                id: newId,
                username,
                password,
                tckn,
                role: body.role === 'admin' ? 'admin' : 'user',
                account: {
                    id: newId,
                    customer_name: customerName,
                    customer_no: String(Math.floor(Math.random() * 89999999) + 10000000),
                    branch_name: branch,
                    account_no: accNo,
                    iban: iban,
                    balance: initialBal
                },
                transactions: []
            };

            db.users.push(newUser);
            saveDB();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Kullanıcı başarıyla oluşturuldu.',
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    customer_name: newUser.account.customer_name,
                    role: newUser.role,
                    balance: newUser.account.balance
                }
            }));
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Kullanıcı oluşturulamadı.' }));
        }
        return;
    }

    // KULLANICI YÖNETİMİ: Kullanıcı Sil (DELETE)
    if (pathname.startsWith('/api/admin/users/') && req.method === 'DELETE') {
        const idToDelete = Number(pathname.split('/').pop());
        const userIdx = db.users.findIndex(u => Number(u.id) === idToDelete);
        if (userIdx === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Kullanıcı bulunamadı.' }));
            return;
        }

        if (db.users[userIdx].role === 'admin' && db.users.filter(u => u.role === 'admin').length <= 1) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Son yönetici hesabı silinemez.' }));
            return;
        }

        db.users.splice(userIdx, 1);
        saveDB();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Kullanıcı silindi.' }));
        return;
    }

    // Veritabanı Eşitleme (Sync)
    if (pathname === '/api/admin/sync_db' && req.method === 'POST') {
        try {
            const data = await parseBody(req);
            if (data && (data.users || (data.account && Array.isArray(data.transactions)))) {
                db = ensureMultiUserDB(data);
                saveDB();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'synced', usersCount: db.users.length }));
                return;
            }
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'Geçersiz veri.' }));
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'Sync başarısız.' }));
        }
        return;
    }

    // Bulut Veritabanı Ayarları (GET & POST)
    if (pathname === '/api/admin/db_config' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            config: {
                type: dbConfig.type || 'local',
                uri: dbConfig.uri ? dbConfig.uri.replace(/:([^@]+)@/, ':****@') : '',
                url: dbConfig.url || '',
                dbName: dbConfig.dbName || 'yapi_kredi'
            },
            is_remote: dbConfig.type !== 'local'
        }));
        return;
    }

    if (pathname === '/api/admin/db_test' && req.method === 'POST') {
        try {
            const testConfig = await parseBody(req);
            const result = await dbAdapter.testConnection(testConfig);
            res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: err.message }));
        }
        return;
    }

    if (pathname === '/api/admin/db_config' && req.method === 'POST') {
        try {
            const newConfig = await parseBody(req);
            const testRes = await dbAdapter.testConnection(newConfig);
            if (!testRes.success) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: testRes.message }));
                return;
            }

            dbAdapter.saveConfig(newConfig);
            dbConfig = newConfig;

            if (dbConfig.type !== 'local') {
                await dbAdapter.saveToRemote(dbConfig, db);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: testRes.message,
                config: { type: dbConfig.type }
            }));
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: err.message }));
        }
        return;
    }

    // Statik Dosyalar & Sayfalar
    if (pathname.startsWith('/extracted_assets/') || pathname.startsWith('/assets/')) {
        const filePath = path.join(__dirname, 'mobile_app', pathname.replace(/^\/+/,'') );
        if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.svg' ? 'image/svg+xml' : 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(filePath).pipe(res);
            return;
        }
        res.writeHead(404);
        res.end('Asset not found');
        return;
    }

    if (pathname.endsWith('.js')) {
        let filePath = path.join(__dirname, 'mobile_app', path.basename(pathname));
        if (!fs.existsSync(filePath)) {
            filePath = path.join(__dirname, 'admin_panel', path.basename(pathname));
        }
        if (fs.existsSync(filePath)) {
            res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
            fs.createReadStream(filePath).pipe(res);
            return;
        }
    }

    if (pathname === '/' || pathname === '/app' || pathname === '/api/index.js') {
        const filePath = path.join(__dirname, 'mobile_app', 'index.html');
        const content = fs.readFileSync(filePath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
        return;
    }

    if (pathname === '/admin' || pathname === '/admin/index.html') {
        const filePath = path.join(__dirname, 'admin_panel', 'index.html');
        const content = fs.readFileSync(filePath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
}

const server = http.createServer(requestHandler);

if (require.main === module) {
    server.listen(PORT, () => {
        console.log('===============================================');
        console.log('Yapı Kredi Mobil Mockup / API Çalışıyor (Multi-User)');
        console.log('===============================================');
        console.log(`Mobil UI: http://127.0.0.1:${PORT}/app`);
        console.log(`Admin: http://127.0.0.1:${PORT}/admin`);
        console.log(`API: http://127.0.0.1:${PORT}/api/account`);
        console.log('===============================================');
    });
}

module.exports = requestHandler;
