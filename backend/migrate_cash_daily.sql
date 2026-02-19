BEGIN;

SET search_path TO polleria, public;

-- Asegura columnas por usuario en cash_sessions
ALTER TABLE cash_sessions
    ADD COLUMN IF NOT EXISTS user_id INT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_schema = current_schema()
          AND table_name = 'cash_sessions'
          AND constraint_name = 'cash_sessions_user_id_fkey'
    ) THEN
        ALTER TABLE cash_sessions
            ADD CONSTRAINT cash_sessions_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id);
    END IF;
END $$;

-- Tabla de movimientos
CREATE TABLE IF NOT EXISTS cash_movements (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES cash_sessions(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id),
    type VARCHAR(30) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    reference_table VARCHAR(50),
    reference_id INT,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMIT;
