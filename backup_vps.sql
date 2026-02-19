--
-- PostgreSQL database dump
--

\restrict ywHSXJ1EcqlhLWIBdgxET85cSSfafPS5YoicdOsr0ItH2AedP7B5IHfKcc01m3J

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
-- Name: polleria; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA polleria;


ALTER SCHEMA polleria OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: polleria; Owner: postgres
--

CREATE TABLE polleria.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(50) NOT NULL,
    entity_id integer,
    details jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE polleria.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: polleria; Owner: postgres
--

CREATE SEQUENCE polleria.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE polleria.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: polleria; Owner: postgres
--

ALTER SEQUENCE polleria.audit_logs_id_seq OWNED BY polleria.audit_logs.id;


--
-- Name: cash_movements; Type: TABLE; Schema: polleria; Owner: postgres
--

CREATE TABLE polleria.cash_movements (
    id integer NOT NULL,
    session_id integer,
    user_id integer,
    type character varying(30) NOT NULL,
    amount numeric(10,2) DEFAULT 0 NOT NULL,
    description text,
    reference_table character varying(50),
    reference_id integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE polleria.cash_movements OWNER TO postgres;

--
-- Name: cash_movements_id_seq; Type: SEQUENCE; Schema: polleria; Owner: postgres
--

CREATE SEQUENCE polleria.cash_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE polleria.cash_movements_id_seq OWNER TO postgres;

--
-- Name: cash_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: polleria; Owner: postgres
--

ALTER SEQUENCE polleria.cash_movements_id_seq OWNED BY polleria.cash_movements.id;


--
-- Name: cash_sessions; Type: TABLE; Schema: polleria; Owner: postgres
--

CREATE TABLE polleria.cash_sessions (
    id integer NOT NULL,
    opened_at timestamp without time zone DEFAULT now(),
    closed_at timestamp without time zone,
    initial_amount numeric(10,2) DEFAULT 0,
    final_amount numeric(10,2),
    total_sales numeric(10,2) DEFAULT 0,
    status character varying(20) DEFAULT 'OPEN'::character varying,
    user_id integer
);


ALTER TABLE polleria.cash_sessions OWNER TO postgres;

--
-- Name: cash_sessions_id_seq; Type: SEQUENCE; Schema: polleria; Owner: postgres
--

CREATE SEQUENCE polleria.cash_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE polleria.cash_sessions_id_seq OWNER TO postgres;

--
-- Name: cash_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: polleria; Owner: postgres
--

ALTER SEQUENCE polleria.cash_sessions_id_seq OWNED BY polleria.cash_sessions.id;


--
-- Name: client_movements; Type: TABLE; Schema: polleria; Owner: postgres
--

CREATE TABLE polleria.client_movements (
    id integer NOT NULL,
    client_id integer NOT NULL,
    type character varying(50) NOT NULL,
    amount numeric(12,2) NOT NULL,
    balance_after numeric(12,2) NOT NULL,
    description text,
    reference_id integer,
    user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE polleria.client_movements OWNER TO postgres;

--
-- Name: client_movements_id_seq; Type: SEQUENCE; Schema: polleria; Owner: postgres
--

CREATE SEQUENCE polleria.client_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE polleria.client_movements_id_seq OWNER TO postgres;

--
-- Name: client_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: polleria; Owner: postgres
--

ALTER SEQUENCE polleria.client_movements_id_seq OWNED BY polleria.client_movements.id;


--
-- Name: client_payments; Type: TABLE; Schema: polleria; Owner: postgres
--

CREATE TABLE polleria.client_payments (
    id integer NOT NULL,
    client_id integer NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method character varying(50) NOT NULL,
    notes text,
    user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE polleria.client_payments OWNER TO postgres;

--
-- Name: client_payments_id_seq; Type: SEQUENCE; Schema: polleria; Owner: postgres
--

CREATE SEQUENCE polleria.client_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE polleria.client_payments_id_seq OWNER TO postgres;

--
-- Name: client_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: polleria; Owner: postgres
--

ALTER SEQUENCE polleria.client_payments_id_seq OWNED BY polleria.client_payments.id;


--
-- Name: clients; Type: TABLE; Schema: polleria; Owner: postgres
--

CREATE TABLE polleria.clients (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    tax_id character varying(50),
    tax_type character varying(10),
    address text,
    phone character varying(50),
    email character varying(100),
    current_account_balance numeric(12,2) DEFAULT 0.00,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE polleria.clients OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: polleria; Owner: postgres
--

CREATE SEQUENCE polleria.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE polleria.clients_id_seq OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: polleria; Owner: postgres
--

ALTER SEQUENCE polleria.clients_id_seq OWNED BY polleria.clients.id;


--
-- Name: invoices; Type: TABLE; Schema: polleria; Owner: postgres
--

CREATE TABLE polleria.invoices (
    id integer NOT NULL,
    sale_id integer,
    cae character varying(50),
    cae_expiration date,
    cbte_tipo integer NOT NULL,
    pto_vta integer NOT NULL,
    cbte_nro integer NOT NULL,
    doc_tipo integer DEFAULT 99,
    doc_nro bigint DEFAULT 0,
    total numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    afip_response jsonb,
    afip_error text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE polleria.invoices OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: polleria; Owner: postgres
--

CREATE SEQUENCE polleria.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE polleria.invoices_id_seq OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: polleria; Owner: postgres
--

ALTER SEQUENCE polleria.invoices_id_seq OWNED BY polleria.invoices.id;


--
-- Name: product_categories; Type: TABLE; Schema: polleria; Owner: postgres
--

CREATE TABLE polleria.product_categories (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE polleria.product_categories OWNER TO postgres;

--
-- Name: product_categories_id_seq; Type: SEQUENCE; Schema: polleria; Owner: postgres
--

CREATE SEQUENCE polleria.product_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE polleria.product_categories_id_seq OWNER TO postgres;

--
-- Name: product_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: polleria; Owner: postgres
--

ALTER SEQUENCE polleria.product_categories_id_seq OWNED BY polleria.product_categories.id;


--
-- Name: products; Type: TABLE; Schema: polleria; Owner: postgres
--

CREATE TABLE polleria.products (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    price numeric(10,2) NOT NULL,
    category character varying(50),
    is_active boolean DEFAULT true,
    stock numeric(10,3) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    unit character varying(10) DEFAULT 'UNIT'::character varying,
    category_id integer
);


ALTER TABLE polleria.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: polleria; Owner: postgres
--

CREATE SEQUENCE polleria.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE polleria.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: polleria; Owner: postgres
--

ALTER SEQUENCE polleria.products_id_seq OWNED BY polleria.products.id;


--
-- Name: sale_items; Type: TABLE; Schema: polleria; Owner: postgres
--

CREATE TABLE polleria.sale_items (
    id integer NOT NULL,
    sale_id integer,
    product_id integer,
    quantity numeric(10,3) NOT NULL,
    price_at_sale numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL
);


ALTER TABLE polleria.sale_items OWNER TO postgres;

--
-- Name: sale_items_id_seq; Type: SEQUENCE; Schema: polleria; Owner: postgres
--

CREATE SEQUENCE polleria.sale_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE polleria.sale_items_id_seq OWNER TO postgres;

--
-- Name: sale_items_id_seq; Type: SEQUENCE OWNED BY; Schema: polleria; Owner: postgres
--

ALTER SEQUENCE polleria.sale_items_id_seq OWNED BY polleria.sale_items.id;


--
-- Name: sales; Type: TABLE; Schema: polleria; Owner: postgres
--

CREATE TABLE polleria.sales (
    id integer NOT NULL,
    total numeric(10,2) NOT NULL,
    payment_method character varying(50),
    client_name character varying(100) DEFAULT 'Consumidor Final'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    user_id integer,
    client_id integer,
    subtotal numeric(10,2) NOT NULL,
    discount numeric(10,2) DEFAULT 0,
    discount_percent numeric(5,2) DEFAULT 0
);


ALTER TABLE polleria.sales OWNER TO postgres;

--
-- Name: sales_id_seq; Type: SEQUENCE; Schema: polleria; Owner: postgres
--

CREATE SEQUENCE polleria.sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE polleria.sales_id_seq OWNER TO postgres;

--
-- Name: sales_id_seq; Type: SEQUENCE OWNED BY; Schema: polleria; Owner: postgres
--

ALTER SEQUENCE polleria.sales_id_seq OWNED BY polleria.sales.id;


--
-- Name: users; Type: TABLE; Schema: polleria; Owner: postgres
--

CREATE TABLE polleria.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE polleria.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: polleria; Owner: postgres
--

CREATE SEQUENCE polleria.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE polleria.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: polleria; Owner: postgres
--

ALTER SEQUENCE polleria.users_id_seq OWNED BY polleria.users.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.audit_logs ALTER COLUMN id SET DEFAULT nextval('polleria.audit_logs_id_seq'::regclass);


--
-- Name: cash_movements id; Type: DEFAULT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.cash_movements ALTER COLUMN id SET DEFAULT nextval('polleria.cash_movements_id_seq'::regclass);


--
-- Name: cash_sessions id; Type: DEFAULT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.cash_sessions ALTER COLUMN id SET DEFAULT nextval('polleria.cash_sessions_id_seq'::regclass);


--
-- Name: client_movements id; Type: DEFAULT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.client_movements ALTER COLUMN id SET DEFAULT nextval('polleria.client_movements_id_seq'::regclass);


--
-- Name: client_payments id; Type: DEFAULT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.client_payments ALTER COLUMN id SET DEFAULT nextval('polleria.client_payments_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.clients ALTER COLUMN id SET DEFAULT nextval('polleria.clients_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.invoices ALTER COLUMN id SET DEFAULT nextval('polleria.invoices_id_seq'::regclass);


--
-- Name: product_categories id; Type: DEFAULT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.product_categories ALTER COLUMN id SET DEFAULT nextval('polleria.product_categories_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.products ALTER COLUMN id SET DEFAULT nextval('polleria.products_id_seq'::regclass);


--
-- Name: sale_items id; Type: DEFAULT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.sale_items ALTER COLUMN id SET DEFAULT nextval('polleria.sale_items_id_seq'::regclass);


--
-- Name: sales id; Type: DEFAULT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.sales ALTER COLUMN id SET DEFAULT nextval('polleria.sales_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.users ALTER COLUMN id SET DEFAULT nextval('polleria.users_id_seq'::regclass);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: cash_movements cash_movements_pkey; Type: CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.cash_movements
    ADD CONSTRAINT cash_movements_pkey PRIMARY KEY (id);


--
-- Name: cash_sessions cash_sessions_pkey; Type: CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.cash_sessions
    ADD CONSTRAINT cash_sessions_pkey PRIMARY KEY (id);


--
-- Name: client_movements client_movements_pkey; Type: CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.client_movements
    ADD CONSTRAINT client_movements_pkey PRIMARY KEY (id);


--
-- Name: client_payments client_payments_pkey; Type: CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.client_payments
    ADD CONSTRAINT client_payments_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pto_vta_cbte_tipo_cbte_nro_key; Type: CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.invoices
    ADD CONSTRAINT invoices_pto_vta_cbte_tipo_cbte_nro_key UNIQUE (pto_vta, cbte_tipo, cbte_nro);


--
-- Name: product_categories product_categories_name_key; Type: CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.product_categories
    ADD CONSTRAINT product_categories_name_key UNIQUE (name);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES polleria.users(id);


--
-- Name: cash_movements cash_movements_session_id_fkey; Type: FK CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.cash_movements
    ADD CONSTRAINT cash_movements_session_id_fkey FOREIGN KEY (session_id) REFERENCES polleria.cash_sessions(id) ON DELETE CASCADE;


--
-- Name: cash_movements cash_movements_user_id_fkey; Type: FK CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.cash_movements
    ADD CONSTRAINT cash_movements_user_id_fkey FOREIGN KEY (user_id) REFERENCES polleria.users(id);


--
-- Name: cash_sessions cash_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.cash_sessions
    ADD CONSTRAINT cash_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES polleria.users(id);


--
-- Name: client_movements client_movements_client_id_fkey; Type: FK CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.client_movements
    ADD CONSTRAINT client_movements_client_id_fkey FOREIGN KEY (client_id) REFERENCES polleria.clients(id);


--
-- Name: client_movements client_movements_user_id_fkey; Type: FK CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.client_movements
    ADD CONSTRAINT client_movements_user_id_fkey FOREIGN KEY (user_id) REFERENCES polleria.users(id);


--
-- Name: client_payments client_payments_client_id_fkey; Type: FK CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.client_payments
    ADD CONSTRAINT client_payments_client_id_fkey FOREIGN KEY (client_id) REFERENCES polleria.clients(id);


--
-- Name: client_payments client_payments_user_id_fkey; Type: FK CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.client_payments
    ADD CONSTRAINT client_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES polleria.users(id);


--
-- Name: invoices invoices_sale_id_fkey; Type: FK CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.invoices
    ADD CONSTRAINT invoices_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES polleria.sales(id);


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES polleria.product_categories(id);


--
-- Name: sale_items sale_items_product_id_fkey; Type: FK CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.sale_items
    ADD CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES polleria.products(id);


--
-- Name: sale_items sale_items_sale_id_fkey; Type: FK CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.sale_items
    ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES polleria.sales(id) ON DELETE CASCADE;


--
-- Name: sales sales_client_id_fkey; Type: FK CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.sales
    ADD CONSTRAINT sales_client_id_fkey FOREIGN KEY (client_id) REFERENCES polleria.clients(id);


--
-- Name: sales sales_user_id_fkey; Type: FK CONSTRAINT; Schema: polleria; Owner: postgres
--

ALTER TABLE ONLY polleria.sales
    ADD CONSTRAINT sales_user_id_fkey FOREIGN KEY (user_id) REFERENCES polleria.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict ywHSXJ1EcqlhLWIBdgxET85cSSfafPS5YoicdOsr0ItH2AedP7B5IHfKcc01m3J

  
-- DATA DUMP START --  
  
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

