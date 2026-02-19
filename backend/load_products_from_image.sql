SET search_path TO polleria, public;

WITH data(name, price) AS (
  VALUES
    ('Pollo Entero', 4000.00),
    ('Pata y muslo', 3500.00),
    ('Pechuga c/h', 4500.00),
    ('Trozitos', 4000.00),
    ('Supremas', 8000.00),
    ('Alas', 2500.00),
    ('Milanesas de Pollo', 8000.00),
    ('Pollo Arrollado Cocido', 20000.00),
    ('Pollo Arrollado Crudo', 15000.00),
    ('Hamburguesas', 7000.00)
),
updated AS (
  UPDATE products p
  SET price = d.price
  FROM data d
  WHERE lower(p.name) = lower(d.name)
  RETURNING p.id
)
INSERT INTO products (name, price, category)
SELECT d.name, d.price, NULL
FROM data d
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE lower(p.name) = lower(d.name)
);
