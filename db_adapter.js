const fs = require('fs');
const path = require('path');

const IS_VERCEL = Boolean(process.env.VERCEL || process.env.NOW_REGION);
const CONFIG_FILE = IS_VERCEL ? path.join('/tmp', 'db_config.json') : path.join(__dirname, 'db_config.json');
const SEED_CONFIG_FILE = path.join(__dirname, 'db_config.json');

// MongoDB client instance cache
let mongoClientInstance = null;
let mongoClientUri = null;

function loadConfig() {
    try {
        if (IS_VERCEL && !fs.existsSync(CONFIG_FILE) && fs.existsSync(SEED_CONFIG_FILE)) {
            try { fs.writeFileSync(CONFIG_FILE, fs.readFileSync(SEED_CONFIG_FILE, 'utf8'), 'utf8'); } catch (e) {}
        }
        if (fs.existsSync(CONFIG_FILE)) {
            const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(raw);
        }
    } catch (e) {}

    // Ortam değişkenlerinden otomatik algılama
    if (process.env.MONGODB_URI) {
        return { type: 'mongodb', uri: process.env.MONGODB_URI, dbName: process.env.MONGODB_DB || 'yapi_kredi' };
    }
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        return { type: 'upstash', url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN };
    }
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        return { type: 'upstash', url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN };
    }
    if (process.env.SUPABASE_URL && (process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY)) {
        return { type: 'supabase', url: process.env.SUPABASE_URL, key: process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY };
    }
    if (process.env.FIREBASE_DATABASE_URL) {
        return { type: 'firebase', url: process.env.FIREBASE_DATABASE_URL };
    }

    return { type: 'local' };
}

function saveConfig(config) {
    try {
        const raw = JSON.stringify(config, null, 2);
        fs.writeFileSync(CONFIG_FILE, raw, 'utf8');
        try { fs.writeFileSync(SEED_CONFIG_FILE, raw, 'utf8'); } catch (e) {}
        // Reset client cache if URI changed
        if (mongoClientInstance && mongoClientUri !== config.uri) {
            mongoClientInstance.close().catch(() => {});
            mongoClientInstance = null;
            mongoClientUri = null;
        }
        return true;
    } catch (e) {
        console.error('Config save error:', e);
        return false;
    }
}

async function getMongoClient(uri) {
    if (mongoClientInstance && mongoClientUri === uri) {
        return mongoClientInstance;
    }
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
    });
    await client.connect();
    mongoClientInstance = client;
    mongoClientUri = uri;
    return client;
}

async function testConnection(config) {
    if (!config || !config.type || config.type === 'local') {
        return { success: true, message: 'Yerel dosya ve tarayıcı kalıcı hafıza koruması aktif.' };
    }

    const startTime = Date.now();
    try {
        if (config.type === 'mongodb') {
            if (!config.uri) throw new Error('MongoDB bağlantı adresi (URI) boş bırakılamaz.');
            const { MongoClient } = require('mongodb');
            const client = new MongoClient(config.uri, {
                serverSelectionTimeoutMS: 6000,
                connectTimeoutMS: 6000
            });
            await client.connect();
            const db = client.db(config.dbName || 'yapi_kredi');
            await db.command({ ping: 1 });
            await client.close();
            const latency = Date.now() - startTime;
            return { success: true, message: `MongoDB Atlas başarıyla bağlandı! (${latency}ms)`, latency };
        }

        if (config.type === 'upstash' || config.type === 'vercel_kv') {
            if (!config.url || !config.token) throw new Error('Upstash REST URL ve Token bilgileri gereklidir.');
            const pingUrl = `${config.url.replace(/\/$/, '')}/ping`;
            const res = await fetch(pingUrl, {
                headers: { Authorization: `Bearer ${config.token}` },
                signal: AbortSignal.timeout(5000)
            });
            if (!res.ok) throw new Error(`Upstash HTTP Hatası: ${res.status} ${res.statusText}`);
            const latency = Date.now() - startTime;
            return { success: true, message: `Upstash Redis başarıyla bağlandı! (${latency}ms)`, latency };
        }

        if (config.type === 'supabase') {
            const key = config.key || config.apiKey;
            if (!config.url || !key) throw new Error('Supabase URL ve API Key gereklidir.');
            const baseUrl = config.url.replace(/\/$/, '');

            // vault tablosunun varlığını ve kimlik doğrulamasını kontrol et
            const tableCheck = await fetch(`${baseUrl}/rest/v1/vault?select=id&limit=1`, {
                headers: {
                    apikey: key,
                    Authorization: `Bearer ${key}`
                },
                signal: AbortSignal.timeout(5000)
            });

            const latency = Date.now() - startTime;
            if (tableCheck.status === 401 || tableCheck.status === 403) {
                throw new Error('Yetkilendirme hatası: Supabase API anahtarı geçersiz.');
            }

            if (!tableCheck.ok) {
                const errJson = await tableCheck.json().catch(() => ({}));
                if (errJson && errJson.code === 'PGRST205') {
                    return {
                        success: false,
                        tableMissing: true,
                        message: `Supabase API anahtarı doğrulandı! (${latency}ms) Ancak "vault" tablosu henüz yok. Lütfen Supabase SQL Editor'den tabloyu oluşturun.`,
                        latency
                    };
                }
                throw new Error(`Supabase Hatası (${tableCheck.status}): ${errJson.message || tableCheck.statusText}`);
            }

            return { success: true, message: `Supabase ve vault tablosu başarıyla bağlandı! (${latency}ms)`, latency };
        }

        if (config.type === 'firebase') {
            if (!config.url) throw new Error('Firebase Database URL gereklidir.');
            const testUrl = `${config.url.replace(/\/$/, '')}/.json?shallow=true`;
            const res = await fetch(testUrl, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) throw new Error(`Firebase HTTP Hatası: ${res.status}`);
            const latency = Date.now() - startTime;
            return { success: true, message: `Firebase Realtime DB bağlandı! (${latency}ms)`, latency };
        }

        return { success: false, message: 'Bilinmeyen veritabanı tipi.' };
    } catch (err) {
        return { success: false, message: `Bağlantı hatası: ${err.message}` };
    }
}

async function fetchFromRemote(config) {
    if (!config || !config.type || config.type === 'local') return null;

    try {
        if (config.type === 'mongodb') {
            const client = await getMongoClient(config.uri);
            const col = client.db(config.dbName || 'yapi_kredi').collection('vault');
            const doc = await col.findOne({ _id: 'master' });
            if (doc && doc.account && Array.isArray(doc.transactions)) {
                return { account: doc.account, transactions: doc.transactions };
            }
            return null;
        }

        if (config.type === 'upstash' || config.type === 'vercel_kv') {
            const getUrl = `${config.url.replace(/\/$/, '')}/get/ykb_database`;
            const res = await fetch(getUrl, {
                headers: { Authorization: `Bearer ${config.token}` },
                signal: AbortSignal.timeout(4000)
            });
            if (res.ok) {
                const json = await res.json();
                if (json && json.result) {
                    const parsed = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
                    if (parsed && parsed.account) return parsed;
                }
            }
            return null;
        }

        if (config.type === 'supabase') {
            const key = config.key || config.apiKey;
            const baseUrl = config.url.replace(/\/$/, '');
            const getUrl = `${baseUrl}/rest/v1/vault?id=eq.master&select=data`;
            const res = await fetch(getUrl, {
                headers: {
                    apikey: key,
                    Authorization: `Bearer ${key}`
                },
                signal: AbortSignal.timeout(4000)
            });
            if (res.ok) {
                const rows = await res.json();
                if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
                    const data = rows[0].data;
                    if (data && data.account) return data;
                }
            }
            return null;
        }

        if (config.type === 'firebase') {
            const getUrl = `${config.url.replace(/\/$/, '')}/ykb_database.json`;
            const res = await fetch(getUrl, { signal: AbortSignal.timeout(4000) });
            if (res.ok) {
                const data = await res.json();
                if (data && data.account) return data;
            }
            return null;
        }
    } catch (e) {
        console.warn('Uzaktan veri çekme hatası:', e.message);
    }
    return null;
}

async function saveToRemote(config, data) {
    if (!config || !config.type || config.type === 'local' || !data || !data.account) return false;

    try {
        if (config.type === 'mongodb') {
            const client = await getMongoClient(config.uri);
            const col = client.db(config.dbName || 'yapi_kredi').collection('vault');
            await col.updateOne(
                { _id: 'master' },
                {
                    $set: {
                        account: data.account,
                        transactions: data.transactions || [],
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );
            return true;
        }

        if (config.type === 'upstash' || config.type === 'vercel_kv') {
            const setUrl = `${config.url.replace(/\/$/, '')}/set/ykb_database`;
            const payload = JSON.stringify(data);
            await fetch(setUrl, {
                method: 'POST',
                headers: { Authorization: `Bearer ${config.token}` },
                body: payload,
                signal: AbortSignal.timeout(4000)
            });
            return true;
        }

        if (config.type === 'supabase') {
            const key = config.key || config.apiKey;
            const baseUrl = config.url.replace(/\/$/, '');
            const postUrl = `${baseUrl}/rest/v1/vault`;
            const body = JSON.stringify([{
                id: 'master',
                data: {
                    account: data.account,
                    transactions: data.transactions || []
                }
            }]);
            const res = await fetch(postUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: key,
                    Authorization: `Bearer ${key}`,
                    Prefer: 'resolution=merge-duplicates'
                },
                body,
                signal: AbortSignal.timeout(4000)
            });
            return res.ok;
        }

        if (config.type === 'firebase') {
            const putUrl = `${config.url.replace(/\/$/, '')}/ykb_database.json`;
            await fetch(putUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(4000)
            });
            return true;
        }
    } catch (e) {
        console.warn('Uzaktan veritabanına kaydetme hatası:', e.message);
    }
    return false;
}

module.exports = {
    loadConfig,
    saveConfig,
    testConnection,
    fetchFromRemote,
    saveToRemote
};
