-- 1. Create Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50), -- DNI or CUIT
    tax_type VARCHAR(10), -- 'DNI', 'CUIT', 'CUIL'
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    current_account_balance DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add client_id to sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id);

-- 3. Create Current Account Movements (Ledger)
CREATE TABLE IF NOT EXISTS client_movements (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'SALE', 'PAYMENT', 'ADJUSTMENT'
    amount DECIMAL(12, 2) NOT NULL, -- Positive for Debt Increase (Sale), Negative for Payment
    balance_after DECIMAL(12, 2) NOT NULL,
    description TEXT,
    reference_id INTEGER, -- Can be sale_id
    user_id INTEGER REFERENCES users(id), -- If you have users table
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Payments Table (Optional, but good for tracking specific payment events distinct from just ledger)
-- For now, we can just use the movements table, but a specific payments table allows recording payment method (Cash/Transfer) for the payment of the debt.
CREATE TABLE IF NOT EXISTS client_payments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'Efectivo', 'Transferencia', etc.
    notes TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
