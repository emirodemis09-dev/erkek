import os
import json
import sqlite3
from datetime import datetime
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel

app = FastAPI(title="Yapı Kredi Mobil Clone Backend API")

# Enable CORS for cross-origin mobile/web access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "bank.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Create Accounts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_name TEXT,
        customer_name TEXT,
        customer_no TEXT,
        branch_name TEXT,
        account_no TEXT,
        iban TEXT,
        balance REAL
    )
    """)
    
    # Create Transactions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER,
        transaction_type TEXT,
        title TEXT,
        sender_receiver_name TEXT,
        iban TEXT,
        amount REAL,
        balance_after REAL,
        category TEXT,
        date_str TEXT,
        time_str TEXT,
        fast_ref_no TEXT,
        commission REAL,
        bsmv REAL,
        description TEXT,
        is_income INTEGER
    )
    """)
    
    # Seed Initial Default Data if empty
    cursor.execute("SELECT COUNT(*) as count FROM accounts")
    if cursor.fetchone()["count"] == 0:
        cursor.execute("""
        INSERT INTO accounts (account_name, customer_name, customer_no, branch_name, account_no, iban, balance)
        VALUES ('ÇUKUROVA - Vadesiz TL', 'Kaan Taşkın', '81047723', 'ÇUKUROVA Şubesi (1680)', '6721439', 'TR43 0006 2000 8915 0006 7214 39', 35591.91)
        """)
        account_id = cursor.lastrowid
        
        # Sample Transactions
        transactions = [
            (account_id, "HESAPTAN FAST", "KESİNTİ VE EKLERİ", "Yapı Kredi", -8.37, 35591.91, "Para Transferi", "26.09.2026", "14:55:35", "1542174497", 7.97, 0.40, "FAST-CEP ŞUBE-1542174497", 0),
            (account_id, "HESAPTAN FAST", "EREN ÜRÜN", "EREN ÜRÜN", -15000.00, 35600.28, "Para Transferi", "26.09.2026", "14:50:12", "1542174490", 15.00, 0.75, "EREN ÜRÜN-FAST-CEP ŞUBE-5504327668", 0),
            (account_id, "HESAPTAN FAST", "ABDULMELİK KİKİZADE", "ABDULMELİK KİKİZADE", -14500.00, 50600.28, "Para Transferi", "25.09.2026", "11:20:00", "1542174400", 14.50, 0.70, "ABDULMELİK KİKİZADE-FAST-CEP ŞUBE-4911453766", 0),
            (account_id, "GELEN FAST", "MUHAMMED UMUT IŞIK", "MUHAMMED UMUT IŞIK", 65000.00, 65100.28, "Gelen Transfer", "25.09.2026", "09:15:30", "1542174350", 0.00, 0.00, "MUHAMMED UMUT IŞIK-FAST-CEP", 1),
        ]
        
        for t in transactions:
            cursor.execute("""
            INSERT INTO transactions (account_id, transaction_type, title, sender_receiver_name, amount, balance_after, category, date_str, time_str, fast_ref_no, commission, bsmv, description, is_income)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, t)
            
        conn.commit()
    conn.close()

init_db()

# Models
class TransactionCreate(BaseModel):
    account_id: int = 1
    transaction_type: str = "HESAPTAN FAST"
    sender_receiver_name: str
    iban: str = "TR43 0006 2000 8915 0006 7214 39"
    amount: float
    description: str = ""
    is_income: bool = False
    date_str: str = ""
    time_str: str = ""
    commission: float = 7.97
    bsmv: float = 0.40

class AccountUpdate(BaseModel):
    customer_name: str
    balance: float
    iban: str

@app.get("/api/account")
def get_account():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM accounts LIMIT 1")
    acc = cursor.fetchone()
    conn.close()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")
    return dict(acc)

@app.post("/api/account/update")
def update_account(acc: AccountUpdate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE accounts SET customer_name = ?, balance = ?, iban = ? WHERE id = 1", (acc.customer_name, acc.balance, acc.iban))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.get("/api/transactions")
def get_transactions():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/admin/add_transaction")
def add_transaction(t: TransactionCreate):
    conn = get_db()
    cursor = conn.cursor()
    
    # Fetch current balance
    cursor.execute("SELECT balance FROM accounts WHERE id = ?", (t.account_id,))
    acc = cursor.fetchone()
    if not acc:
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found")
        
    current_balance = acc["balance"]
    amount_change = t.amount if t.is_income else -abs(t.amount)
    new_balance = current_balance + amount_change
    
    # Update account balance
    cursor.execute("UPDATE accounts SET balance = ? WHERE id = ?", (new_balance, t.account_id))
    
    now = datetime.now()
    d_str = t.date_str if t.date_str else now.strftime("%d.%m.%Y")
    t_str = t.time_str if t.time_str else now.strftime("%H:%M:%S")
    ref_no = f"1542{now.strftime('%d%H%M%S')}"
    title = "KESİNTİ VE EKLERİ" if not t.is_income and "KESİNTİ" in t.sender_receiver_name.upper() else t.sender_receiver_name
    
    cursor.execute("""
    INSERT INTO transactions (account_id, transaction_type, title, sender_receiver_name, iban, amount, balance_after, category, date_str, time_str, fast_ref_no, commission, bsmv, description, is_income)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        t.account_id,
        t.transaction_type,
        title,
        t.sender_receiver_name,
        t.iban,
        amount_change,
        new_balance,
        "Para Transferi" if not t.is_income else "Gelen Transfer",
        d_str,
        t_str,
        ref_no,
        t.commission,
        t.bsmv,
        t.description if t.description else f"{t.sender_receiver_name}-FAST-CEP",
        1 if t.is_income else 0
    ))
    
    conn.commit()
    conn.close()
    return {"status": "success", "new_balance": new_balance}

@app.delete("/api/admin/transaction/{trans_id}")
def delete_transaction(trans_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions WHERE id = ?", (trans_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
