const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const SERVER_SCRIPT = path.join(__dirname, 'server.js');
const LOG_FILE = path.join(__dirname, 'logs', 'server_7x24.log');
const DB_FILE = path.join(__dirname, 'database.json');
const DB_BACKUP_DIR = path.join(__dirname, 'logs', 'db_backups');

if (!fs.existsSync(path.join(__dirname, 'logs'))) {
    fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
}
if (!fs.existsSync(DB_BACKUP_DIR)) {
    fs.mkdirSync(DB_BACKUP_DIR, { recursive: true });
}

function log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    try {
        fs.appendFileSync(LOG_FILE, line, 'utf8');
    } catch (e) {}
    console.log(line.trim());
}

log('=== YAPI KREDI MOBIL 7/24 SUPERVISOR BAŞLATILDI ===');

let serverProcess = null;
let isShuttingDown = false;
let restartCount = 0;

function backupDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, 'utf8');
            const data = JSON.parse(raw);
            if (data && data.account) {
                const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                const backupPath = path.join(DB_BACKUP_DIR, `database_${ts}.json`);
                fs.writeFileSync(backupPath, raw, 'utf8');
                
                // En son 20 yedeği tut, eskileri temizle
                const files = fs.readdirSync(DB_BACKUP_DIR)
                    .filter(f => f.startsWith('database_') && f.endsWith('.json'))
                    .sort();
                while (files.length > 20) {
                    const toDelete = files.shift();
                    try { fs.unlinkSync(path.join(DB_BACKUP_DIR, toDelete)); } catch (e) {}
                }
            }
        }
    } catch (e) {
        log(`Yedekleme hatası: ${e.message}`);
    }
}

function startServer() {
    if (isShuttingDown) return;

    log(`Node.js sunucusu başlatılıyor (Çalışma Sayısı: #${++restartCount})...`);

    serverProcess = spawn(process.execPath, [SERVER_SCRIPT], {
        cwd: __dirname,
        env: { ...process.env, NODE_ENV: 'production', PORT: '8000' },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    serverProcess.stdout.on('data', (data) => {
        const text = data.toString();
        try { fs.appendFileSync(LOG_FILE, text, 'utf8'); } catch (e) {}
    });

    serverProcess.stderr.on('data', (data) => {
        const text = data.toString();
        try { fs.appendFileSync(LOG_FILE, `[STDERR] ${text}`, 'utf8'); } catch (e) {}
    });

    serverProcess.on('exit', (code, signal) => {
        log(`Sunucu kapandı! Kod: ${code}, Sinyal: ${signal}`);
        serverProcess = null;

        if (!isShuttingDown) {
            log('1 saniye içinde otomatik yeniden başlatılıyor...');
            setTimeout(startServer, 1000);
        }
    });

    serverProcess.on('error', (err) => {
        log(`Sunucu işlem hatası: ${err.message}`);
    });
}

// 15 saniyede bir sağlık kontrolü (Freeze / Hang koruması)
setInterval(() => {
    if (isShuttingDown || !serverProcess) return;

    const req = http.get('http://127.0.0.1:8000/api/health', { timeout: 8000 }, (res) => {
        if (res.statusCode === 200) {
            // Sağlıklı
        } else {
            log(`Sağlık kontrolü uyarısı: HTTP ${res.statusCode}`);
        }
    });

    req.on('timeout', () => {
        req.destroy();
        log('Sağlık kontrolü zaman aşımına uğradı! Sunucu yanıt vermiyor, yeniden başlatılıyor...');
        if (serverProcess) {
            try { serverProcess.kill('SIGKILL'); } catch (e) {}
        }
    });

    req.on('error', (err) => {
        // Sunucu henüz açılma aşamasında olabilir
    });
}, 15000);

// Her 10 dakikada bir otomatik veritabanı yedeği al
setInterval(backupDatabase, 10 * 60 * 1000);
// Başlangıçta hemen bir yedek al
backupDatabase();

// Temiz kapatma
process.on('SIGINT', () => {
    isShuttingDown = true;
    log('Supervisor kapatılıyor (SIGINT)...');
    if (serverProcess) serverProcess.kill();
    process.exit(0);
});

process.on('SIGTERM', () => {
    isShuttingDown = true;
    log('Supervisor kapatılıyor (SIGTERM)...');
    if (serverProcess) serverProcess.kill();
    process.exit(0);
});

startServer();
