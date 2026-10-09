const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const IS_VERCEL = Boolean(process.env.VERCEL || process.env.NOW_REGION);
const SEED_FILE = path.join(__dirname, 'database.json');
const DB_FILE = IS_VERCEL ? path.join('/tmp', 'database.json') : path.join(__dirname, 'database.json');
const DB_BACKUP = IS_VERCEL ? path.join('/tmp', 'database.backup.json') : path.join(__dirname, 'database.backup.json');

// Crash koruması (7/24 Kesintisiz Çalışma)
process.on('uncaughtException', (err) => {
    console.error(`[${new Date().toISOString()}] [CRITICAL] Yakalanmamış Hata:`, err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error(`[${new Date().toISOString()}] [CRITICAL] Yakalanmamış Promise:`, reason);
});

function readDB() {
    try {
        // Vercel serverless ortamında /tmp'yi ana database.json ile ilklendir
        if (IS_VERCEL && !fs.existsSync(DB_FILE) && fs.existsSync(SEED_FILE)) {
            try {
                const seedRaw = fs.readFileSync(SEED_FILE, 'utf8');
                fs.writeFileSync(DB_FILE, seedRaw, 'utf8');
            } catch (e) {}
        }

        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, 'utf8');
            const data = JSON.parse(raw);
            if (data && data.account) {
                try { fs.writeFileSync(DB_BACKUP, raw, 'utf8'); } catch (e) {}
                return data;
            }
        }
    } catch (error) {
        console.warn(`[${new Date().toISOString()}] database.json okuma hatası, yedekten deneniyor:`, error.message);
        try {
            if (fs.existsSync(DB_BACKUP)) {
                const bRaw = fs.readFileSync(DB_BACKUP, 'utf8');
                const bData = JSON.parse(bRaw);
                if (bData && bData.account) {
                    console.log(`[${new Date().toISOString()}] Veritabanı yedekten başarıyla kurtarıldı!`);
                    fs.writeFileSync(DB_FILE, bRaw, 'utf8');
                    return bData;
                }
            }
        } catch (bErr) {
            console.error('Yedek okunamadı:', bErr.message);
        }
    }

    const fallback = {
        account: {
            id: 1,
            customer_name: 'Kaan Taşkın',
            customer_no: '81047723',
            branch_name: 'ÇUKUROVA ŞUBESİ (1680)',
            account_no: '6721439',
            iban: 'TR43 0006 2000 8915 0006 7214 39',
            balance: 35591.91
        },
        transactions: []
    };
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
        // Fallback doğrudan yazma
        try { fs.writeFileSync(DB_FILE, raw, 'utf8'); } catch (err) {}
    }

    // Vercel KV / Upstash Entegrasyonu (Ortam değişkenleri varsa buluta otomatik senkronize et)
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        try {
            fetch(`${process.env.KV_REST_API_URL}/set/ykb_database`, {
                headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
                method: 'POST',
                body: JSON.stringify(data)
            }).catch(() => {});
        } catch (e) {}
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

function buildTransaction(input, override = {}) {
    const now = new Date();
    const amountValue = Number(input.amount || 0);
    const signedAmount = input.is_income ? Math.abs(amountValue) : -Math.abs(amountValue);
    const dateStr = input.date_str || `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    const timeStr = input.time_str || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const refNo = input.fast_ref_no || `5176${now.getTime().toString().slice(-8)}`;

    const rIban = input.receiver_iban || input.iban || (input.is_income ? db.account.iban : 'TR500015700000000157939759');
    const rBank = input.receiver_bank || (input.is_income ? 'Yapı ve Kredi Bankası A.Ş.' : detectBankFromIban(rIban));

    return {
        id: override.id || Date.now() + Math.floor(Math.random() * 10000),
        account_id: 1,
        transaction_type: input.transaction_type || 'HESAPTAN FAST',
        title: input.title || input.sender_receiver_name || 'İşlem',
        sender_receiver_name: input.sender_receiver_name || input.title || 'İşlem',
        iban: rIban,
        receiver_iban: rIban,
        receiver_bank: rBank,
        amount: signedAmount,
        balance_after: Number((db.account.balance + signedAmount).toFixed(2)),
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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

    // Normalize trailing slash (except root)
    if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
    }

    if (pathname === '/api/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            live_24_7: true,
            uptime_seconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
            account: db.account.customer_name,
            balance: db.account.balance,
            transactions_count: db.transactions.length,
            memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024)
        }));
        return;
    }

    if (pathname === '/api/admin/reload' && req.method === 'POST') {
        db = readDB();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'reloaded', account: db.account }));
        return;
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
        try {
            const body = await parseBody(req);
            const username = String(body.username || '').trim().toLowerCase();
            const password = String(body.password || '');
            const validUser = (username === 'kaan' || username === 'admin' || username === 'yapi') && (password === '123456' || password === 'garanti123');
            if (!validUser) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Kullanıcı adı veya şifre hatalı.' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Giriş başarılı.',
                customer_name: db.account.customer_name,
                account_no: db.account.account_no,
                iban: db.account.iban
            }));
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Geçersiz istek.' }));
        }
        return;
    }

    if (pathname === '/api/account' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.account));
        return;
    }

    if (pathname === '/api/account/update' && req.method === 'POST') {
        try {
            const data = await parseBody(req);
            if (data.customer_name) db.account.customer_name = data.customer_name;
            if (data.iban) db.account.iban = data.iban;
            if (data.balance !== undefined) db.account.balance = Number(data.balance);
            if (data.branch_name) db.account.branch_name = data.branch_name;
            saveDB();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'success', account: db.account }));
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'Bakiye güncellenemedi.' }));
        }
        return;
    }

    if (pathname === '/api/transactions' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.transactions));
        return;
    }

    if (pathname === '/api/statement' && req.method === 'GET') {
        const days = Number(url.searchParams.get('days') || 30);
        const list = db.transactions.slice(0, Math.max(1, days || db.transactions.length));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ account: db.account, transactions: list, days }));
        return;
    }

    if (pathname === '/api/admin/add_transaction' && req.method === 'POST') {
        try {
            const input = await parseBody(req);
            const isIncome = input.is_income === undefined ? Number(input.amount || 0) > 0 : Boolean(input.is_income);
            const mainTx = buildTransaction(input);
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
                    account_id: 1,
                    transaction_type: 'Diğer',
                    title: isHavale 
                        ? `HAVALE ÜCRETİ-${mainTx.fast_ref_no || '100880148305'}` 
                        : `ELEKTRONİK FON TRANSFERİ (EFT) ÜCRETİ-FAST/${nameVal.toLowerCase()}`,
                    sender_receiver_name: isHavale ? 'HAVALE ÜCRETİ' : 'EFT / FAST Ücreti',
                    iban: '',
                    receiver_iban: '',
                    receiver_bank: '',
                    amount: -feeAmount,
                    balance_after: Number((db.account.balance - feeAmount).toFixed(2)),
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
                    account_id: 1,
                    transaction_type: 'Diğer',
                    title: isHavale 
                        ? `BSMV HAVALE ÜCRETİ-${mainTx.fast_ref_no || '100880148305'}` 
                        : `BSMV ELEKTRONİK FON TRANSFERİ (EFT) ÜCRETİ-FAST/${nameVal.toLowerCase()}`,
                    sender_receiver_name: isHavale ? 'BSMV HAVALE ÜCRETİ' : 'BSMV Ücreti',
                    iban: '',
                    receiver_iban: '',
                    receiver_bank: '',
                    amount: -bsmvAmount,
                    balance_after: Number((db.account.balance - feeAmount - bsmvAmount).toFixed(2)),
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
                // En yeni en üstte görünecek sıra: BSMV, sonra FAST Ücreti, sonra Ana Transfer
                transactionsToAdd.unshift(feeTx);
                transactionsToAdd.unshift(bsmvTx);
            }

            db.account.balance = Number((db.account.balance + totalDeduction).toFixed(2));
            db.transactions.unshift(...transactionsToAdd);
            saveDB();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                status: 'success', 
                new_balance: db.account.balance, 
                transactions: transactionsToAdd 
            }));
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'İşlem eklenemedi.' }));
        }
        return;
    }

    if (pathname === '/api/admin/sync_db' && req.method === 'POST') {
        try {
            const data = await parseBody(req);
            if (data && data.account && Array.isArray(data.transactions)) {
                db.account = data.account;
                db.transactions = data.transactions;
                saveDB();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'synced', account: db.account, count: db.transactions.length }));
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

    if (pathname.startsWith('/api/admin/transaction/') && req.method === 'DELETE') {
        const id = Number(pathname.split('/').pop());
        const txToDelete = db.transactions.find(t => t.id === id);
        if (txToDelete) {
            db.account.balance = Number((db.account.balance - txToDelete.amount).toFixed(2));
            const associatedFees = db.transactions.filter(t => t.parent_id === id);
            associatedFees.forEach(f => {
                db.account.balance = Number((db.account.balance - f.amount).toFixed(2));
            });
            db.transactions = db.transactions.filter(t => t.id !== id && t.parent_id !== id);
            saveDB();
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'deleted', id, new_balance: db.account.balance }));
        return;
    }

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

if (require.main === module || !process.env.VERCEL) {
    server.listen(PORT, () => {
        console.log('===============================================');
        console.log('Yapı Kredi Mobil Mockup / API Çalışıyor');
        console.log('===============================================');
        console.log(`Mobil UI: http://127.0.0.1:${PORT}/app`);
        console.log(`Admin: http://127.0.0.1:${PORT}/admin`);
        console.log(`API: http://127.0.0.1:${PORT}/api/account`);
        console.log('===============================================');
    });
}

module.exports = requestHandler;

