--
-- PostgreSQL database dump
--

\restrict HhytC0KcM76k6qWwh8bGoywufr9ORi3qUFUfiunRLhi84svBdiCZMjJq4cP3wb0

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: polleria; Owner: postgres
--

INSERT INTO polleria.product_categories VALUES (1, 'Pollo', true, '2026-02-11 18:45:18.08179');
INSERT INTO polleria.product_categories VALUES (2, 'Rebozados', true, '2026-02-11 18:45:18.08179');
INSERT INTO polleria.product_categories VALUES (3, 'Congelados', true, '2026-02-11 18:45:18.08179');
INSERT INTO polleria.product_categories VALUES (4, 'Bebidas', true, '2026-02-11 18:45:18.08179');
INSERT INTO polleria.product_categories VALUES (5, 'Agregados', true, '2026-02-11 18:45:18.08179');
INSERT INTO polleria.product_categories VALUES (6, 'Ofertas', true, '2026-02-11 18:45:18.08179');


--
-- Data for Name: products; Type: TABLE DATA; Schema: polleria; Owner: postgres
--

INSERT INTO polleria.products VALUES (29, 'Costilla', 0.00, NULL, true, 0.000, '2026-02-11 08:39:24.883968', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (30, 'Solomillo', 0.00, NULL, true, 0.000, '2026-02-11 08:39:24.883968', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (23, 'Matambre', 12000.00, NULL, true, 0.000, '2026-02-11 08:36:12.733739', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (24, 'Chorizo', 7000.00, NULL, true, 0.000, '2026-02-11 08:36:12.733739', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (25, 'Salchichas', 8000.00, NULL, true, 0.000, '2026-02-11 08:36:12.733739', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (26, 'Pata con cuero', 6000.00, NULL, true, 0.000, '2026-02-11 08:36:12.733739', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (27, 'Pata sin cuero', 6500.00, NULL, true, 0.000, '2026-02-11 08:36:12.733739', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (28, 'Hamburguesas c/u', 700.00, NULL, true, 0.000, '2026-02-11 08:36:12.733739', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (8, 'Pollo Entero', 4000.00, NULL, true, 7.000, '2026-02-11 08:29:03.023144', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (16, 'Pollo Arrollado Crudo', 15000.00, NULL, true, 25.000, '2026-02-11 08:29:03.023144', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (18, 'Pulpa', 8000.00, NULL, true, 52.000, '2026-02-11 08:36:12.733739', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (19, 'Bondiola', 9500.00, NULL, true, 52.000, '2026-02-11 08:36:12.733739', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (21, 'Puchero', 3500.00, NULL, true, 50.000, '2026-02-11 08:36:12.733739', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (12, 'Supremas', 8000.00, NULL, true, 20.000, '2026-02-11 08:29:03.023144', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (22, 'Costeleta', 7000.00, NULL, true, 55.000, '2026-02-11 08:36:12.733739', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (10, 'Pechuga c/h', 4500.00, NULL, true, 19.000, '2026-02-11 08:29:03.023144', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (17, 'Hamburguesas', 7000.00, NULL, true, 22.000, '2026-02-11 08:29:03.023144', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (15, 'Pollo Arrollado Cocido', 20000.00, NULL, true, 24.000, '2026-02-11 08:29:03.023144', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (13, 'Alas', 2500.00, NULL, true, 50.000, '2026-02-11 08:29:03.023144', 'KG', NULL);
INSERT INTO polleria.products VALUES (14, 'Milanesas de Pollo', 8000.00, NULL, true, 20.000, '2026-02-11 08:29:03.023144', 'KG', NULL);
INSERT INTO polleria.products VALUES (20, 'Picada', 5500.00, NULL, true, 50.000, '2026-02-11 08:36:12.733739', 'KG', NULL);
INSERT INTO polleria.products VALUES (9, 'Pata y muslo', 3500.00, NULL, true, 44.000, '2026-02-11 08:29:03.023144', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (32, 'Varios', 0.00, 'Ofertas', true, 0.000, '2026-02-11 14:10:24.864399', 'UNIT', 6);
INSERT INTO polleria.products VALUES (31, 'Carne', 5500.00, NULL, NULL, 50.000, '2026-02-11 08:39:24.883968', 'UNIT', NULL);
INSERT INTO polleria.products VALUES (11, 'Trozitos', 4000.00, NULL, true, 28.000, '2026-02-11 08:29:03.023144', 'UNIT', NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: polleria; Owner: postgres
--

INSERT INTO polleria.users VALUES (1, 'admin', '$2b$10$DQwSzDwmFg2MJ.BL/93tFeOEJ0XyVCqPLCD/19SSXTjr0577m7aWm', 'admin', '2026-01-29 09:09:54.068977');
INSERT INTO polleria.users VALUES (2, 'cajero', '$2b$10$b8wfieYUsE4bHFpvcqZEV.3d6UkHe6PAIHed4Qp.dk6.zU6.JQVu2', 'user', '2026-01-30 10:13:58.349788');
INSERT INTO polleria.users VALUES (4, 'superadmin', '$2a$10$Jk9c34yjY0Im6yQSJwREr.F1GtGCx8Uffx21Pm/EJmUjpx2jPG5zO', 'superadmin', '2026-02-11 18:38:06.045243');


--
-- Name: product_categories_id_seq; Type: SEQUENCE SET; Schema: polleria; Owner: postgres
--

SELECT pg_catalog.setval('polleria.product_categories_id_seq', 7, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: polleria; Owner: postgres
--

SELECT pg_catalog.setval('polleria.products_id_seq', 32, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: polleria; Owner: postgres
--

SELECT pg_catalog.setval('polleria.users_id_seq', 4, true);


--
-- PostgreSQL database dump complete
--

\unrestrict HhytC0KcM76k6qWwh8bGoywufr9ORi3qUFUfiunRLhi84svBdiCZMjJq4cP3wb0

