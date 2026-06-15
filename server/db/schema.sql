-- Personal Expenses Tracker — Database Schema
-- All tables use soft delete (is_archived) — data is NEVER physically deleted

CREATE TABLE IF NOT EXISTS expense_categories (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(50) UNIQUE NOT NULL,
  icon  VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS income (
  id            SERIAL PRIMARY KEY,
  source        VARCHAR(100) NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  month         DATE NOT NULL,
  notes         TEXT,
  is_archived   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id            SERIAL PRIMARY KEY,
  category_id   INT REFERENCES expense_categories(id),
  description   VARCHAR(200),
  budgeted      DECIMAL(12,2) DEFAULT 0,
  actual        DECIMAL(12,2) DEFAULT 0,
  month         DATE NOT NULL,
  notes         TEXT,
  is_archived   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS savings (
  id            SERIAL PRIMARY KEY,
  type          VARCHAR(50) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  month         DATE NOT NULL,
  notes         TEXT,
  is_archived   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bills (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  category      VARCHAR(50),
  amount        DECIMAL(12,2) NOT NULL,
  due_date      DATE,
  is_paid       BOOLEAN DEFAULT FALSE,
  paid_date     DATE,
  month         DATE NOT NULL,
  notes         TEXT,
  is_archived   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Seed expense categories
INSERT INTO expense_categories (name, icon) VALUES
  ('Groceries', '🛒'),
  ('Dining Out', '🍽️'),
  ('Fuel', '⛽'),
  ('Utilities', '💡'),
  ('Gifts', '🎁'),
  ('Medical', '🏥'),
  ('Miscellaneous', '📦'),
  ('House Loan', '🏠'),
  ('Savings (PPF)', '🏦'),
  ('House Expenses', '🏡'),
  ('Maid Allowances', '🧹'),
  ('Other Expenses', '💸'),
  ('Recurring Deposits (RD)', '📈')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS category_budgets (
  id           SERIAL PRIMARY KEY,
  category_id  INT REFERENCES expense_categories(id) ON DELETE CASCADE,
  amount       DECIMAL(12,2) NOT NULL DEFAULT 0,
  month        DATE NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(category_id, month)
);

-- Safely alter foreign key constraint on expenses to set null on delete
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'expenses_category_id_fkey'
  ) THEN
    ALTER TABLE expenses DROP CONSTRAINT expenses_category_id_fkey;
  END IF;
END $$;

ALTER TABLE expenses ADD CONSTRAINT expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL;

