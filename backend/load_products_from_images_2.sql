SET search_path TO polleria, public;

WITH data(name, price) AS (
  VALUES
    ('Pulpa', 8000.00),
    ('Costilla', 0.00),
    ('Bondiola', 9500.00),
    ('Solomillo', 0.00),
    ('Carne', 0.00),
    ('Picada', 5500.00),
    ('Puchero', 3500.00),
    ('Costeleta', 7000.00),
    ('Matambre', 12000.00),
    ('Chorizo', 7000.00),
    ('Salchichas', 8000.00),
    ('Pata con cuero', 6000.00),
    ('Pata sin cuero', 6500.00),
    ('Hamburguesas c/u', 700.00)
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
