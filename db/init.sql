-- Crear Schema
CREATE SCHEMA IF NOT EXISTS polleria;

-- Configurar path para que las tablas se creen dentro del schema
SET search_path TO polleria;

-- Crypto (para generar hash bcrypt desde SQL)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- 'user', 'admin', 'superadmin'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Usuario inicial superadmin (password: 2026)
INSERT INTO users (username, password_hash, role)
VALUES ('superadmin', crypt('2026', gen_salt('bf', 10)), 'superadmin')
ON CONFLICT (username) DO NOTHING;

-- Tabla de Productos
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50), -- 'Pollo', 'Bebidas', 'Combos'
    is_active BOOLEAN DEFAULT TRUE,
    unit VARCHAR(10) DEFAULT 'UNIT',
    stock DECIMAL(10, 3) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Categorías de Productos (Configuración)
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Relación products.category_id -> product_categories.id (mantener products.category texto por compatibilidad)
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS category_id INT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_schema = current_schema()
          AND table_name = 'products'
          AND constraint_name = 'products_category_id_fkey'
    ) THEN
        ALTER TABLE products
            ADD CONSTRAINT products_category_id_fkey
            FOREIGN KEY (category_id) REFERENCES product_categories(id);
    END IF;
END $$;

-- Tabla de Ventas (Cabecera)
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50), -- 'Efectivo', 'Debito', 'Credito', 'MP', 'Mixto'
    client_name VARCHAR(100) DEFAULT 'Consumidor Final',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Detalle de Venta
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INT REFERENCES sales(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id),
    quantity DECIMAL(10, 3) NOT NULL,
    price_at_sale DECIMAL(10, 2) NOT NULL, -- Precio congelado al momento de la venta
    subtotal DECIMAL(10, 2) NOT NULL
);

-- Facturación AFIP
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    sale_id INT REFERENCES sales(id),
    cae VARCHAR(50),
    cae_expiration DATE,
    cbte_tipo INT NOT NULL, -- 1=Factura A, 6=Factura B, 11=Factura C
    pto_vta INT NOT NULL,
    cbte_nro INT NOT NULL, -- Número correlativo devuelto por AFIP
    doc_tipo INT DEFAULT 99, -- 99=Sin Identificar (Consumidor Final), 80=CUIT
    doc_nro BIGINT DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'APPROVED', 'REJECTED', 'ERROR'
    afip_response JSONB, -- Guardamos toda la respuesta para debug
    afip_error TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(pto_vta, cbte_tipo, cbte_nro)
);

-- Caja (Control de turnos)
CREATE TABLE IF NOT EXISTS cash_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    opened_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP,
    initial_amount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2),
    total_sales DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'OPEN' -- 'OPEN', 'CLOSED'
);

-- Movimientos de Caja (por sesión)
CREATE TABLE IF NOT EXISTS cash_movements (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES cash_sessions(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id),
    type VARCHAR(30) NOT NULL, -- 'OPEN', 'CLOSE', 'SALE', 'PAYMENT', 'ADJUST'
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    reference_table VARCHAR(50),
    reference_id INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed Data (Datos iniciales)
INSERT INTO users (username, password_hash, role) VALUES ('admin', 'admin123', 'admin') ON CONFLICT DO NOTHING;
INSERT INTO product_categories (name) VALUES
('Pollo'),
('Rebozados'),
('Congelados'),
('Bebidas'),
('Agregados'),
('Ofertas') ON CONFLICT DO NOTHING;
INSERT INTO products (name, price, category) VALUES 
('Pollo Entero', 4500.00, 'Pollo'),
('1/2 Pollo', 2500.00, 'Pollo'),
('Papas Fritas', 1200.00, 'Guarnicion'),
('Muslo kg', 8500.00, 'Pollo'),
('Pechuga kg', 7500.00, 'Pollo'),
('Milanesa de Pollo kg', 9500.00, 'Pollo'),
('Milanesa de Carn kg', 14000.00, 'Carne') ON CONFLICT DO NOTHING;

-- Backfill category_id para productos seed
UPDATE products p
SET category_id = pc.id
FROM product_categories pc
WHERE p.category_id IS NULL
  AND p.category IS NOT NULL
  AND TRIM(p.category) <> ''
  AND pc.name = TRIM(p.category);
