\c biztime_test

DROP TABLE IF EXISTS companies_industries;
DROP TABLE IF EXISTS industries;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

CREATE TABLE industries (
  industry text PRIMARY KEY,
  description text NOT NULL
);

CREATE TABLE companies_industries (
    company_id text REFERENCES companies (code) ON DELETE CASCADE,
    industry_id text REFERENCES industries (industry) ON DELETE CASCADE
);