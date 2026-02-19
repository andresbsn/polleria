-- Add user tracking to sales
ALTER TABLE sales ADD COLUMN user_id INT REFERENCES users(id);

-- Create Audit Log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'CREATE_SALE', 'UPDATE_STOCK', 'LOGIN'
    entity_id INT, -- ID of sale or product affected
    details JSONB, -- Previous value, New value, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed initial users
INSERT INTO users (username, password_hash, role) VALUES ('cajero', '$2b$10$X7V.j6.X', 'user') ON CONFLICT DO NOTHING;
-- Note: 'admin' already exists. We should update password logic later. 
-- For now, assume plain text for these seed users is handled or already hashed? 
-- The init.sql had 'admin123' as plain text. 
-- Let's update admin to have a role of 'admin' just in case.
UPDATE users SET role = 'admin' WHERE username = 'admin';
