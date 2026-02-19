BEGIN;

SET search_path TO polleria, public;

-- Asegura tabla de categorías (por si la DB existente no la tiene)
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Agrega columna numérica en products
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

-- Crea categorías faltantes basadas en products.category (texto)
INSERT INTO product_categories (name)
SELECT DISTINCT TRIM(category)
FROM products
WHERE category IS NOT NULL
  AND TRIM(category) <> ''
ON CONFLICT (name) DO NOTHING;

-- Backfill: setea products.category_id a partir del nombre de categoría
UPDATE products p
SET category_id = pc.id
FROM product_categories pc
WHERE p.category_id IS NULL
  AND p.category IS NOT NULL
  AND TRIM(p.category) <> ''
  AND pc.name = TRIM(p.category);

COMMIT;
