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

function buildTransaction(input, override = {}) {
    const now = new Date();
    const amountValue = Number(input.amount || 0);
    const signedAmount = input.is_income ? Math.abs(amountValue) : -Math.abs(amountValue);
    const dateStr = input.date_str || `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    const timeStr = input.time_str || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const refNo = input.fast_ref_no || `1542${now.getTime().toString().slice(-6)}`;

    return {
        id: override.id || Date.now() + Math.floor(Math.random() * 10000),
        account_id: 1,
        transaction_type: input.transaction_type || 'HESAPTAN FAST',
        title: input.title || input.sender_receiver_name || 'İşlem',
        sender_receiver_name: input.sender_receiver_name || input.title || 'İşlem',
        iban: input.iban || db.account.iban,
        amount: signedAmount,
        balance_after: Number((db.account.balance + signedAmount).toFixed(2)),
        category: input.is_income ? 'Gelen Transfer' : 'Para Transferi',
        date_str: dateStr,
        time_str: timeStr,
        fast_ref_no: refNo,
        commission: Number(input.commission ?? 7.97),
        bsmv: Number(input.bsmv ?? 0.40),
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

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

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
            const newTx = buildTransaction(input);
            db.account.balance = Number((db.account.balance + newTx.amount).toFixed(2));
            db.transactions.unshift(newTx);
            saveDB();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'success', new_balance: db.account.balance, transaction: newTx }));
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'İşlem eklenemedi.' }));
        }
        return;
    }

    if (pathname.startsWith('/api/admin/transaction/') && req.method === 'DELETE') {
        const id = Number(pathname.split('/').pop());
        db.transactions = db.transactions.filter(t => t.id !== id);
        saveDB();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'deleted', id }));
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
        const filePath = path.join(__dirname, 'mobile_app', path.basename(pathname));
        if (fs.existsSync(filePath)) {
            res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
            fs.createReadStream(filePath).pipe(res);
            return;
        }
    }

    if (pathname === '/' || pathname === '/app') {
        const filePath = path.join(__dirname, 'mobile_app', 'index.html');
        const content = fs.readFileSync(filePath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
        return;
    }

    if (pathname === '/admin') {
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

