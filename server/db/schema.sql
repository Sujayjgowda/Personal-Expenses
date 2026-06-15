-- Personal Expenses Tracker — Database Schema
-- All tables use soft delete (is_archived) — data is NEVER physically deleted

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(50) UNIQUE NOT NULL,
  icon       VARCHAR(10),
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS income (
  id            SERIAL PRIMARY KEY,
  user_id       INT REFERENCES users(id),
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
  user_id       INT REFERENCES users(id),
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
  user_id       INT REFERENCES users(id),
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
  user_id       INT REFERENCES users(id),
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

CREATE TABLE IF NOT EXISTS category_budgets (
  id           SERIAL PRIMARY KEY,
  user_id      INT REFERENCES users(id),
  category_id  INT REFERENCES expense_categories(id) ON DELETE CASCADE,
  amount       DECIMAL(12,2) NOT NULL DEFAULT 0,
  month        DATE NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, category_id, month)
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

-- Safely add sort_order column to existing expense_categories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expense_categories' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE expense_categories ADD COLUMN sort_order INT DEFAULT 0;
    UPDATE expense_categories SET sort_order = id;
  END IF;
END $$;

-- Safely add user_id column to existing tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income' AND column_name = 'user_id') THEN
    ALTER TABLE income ADD COLUMN user_id INT REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'user_id') THEN
    ALTER TABLE expenses ADD COLUMN user_id INT REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings' AND column_name = 'user_id') THEN
    ALTER TABLE savings ADD COLUMN user_id INT REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'user_id') THEN
    ALTER TABLE bills ADD COLUMN user_id INT REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'category_budgets' AND column_name = 'user_id') THEN
    ALTER TABLE category_budgets ADD COLUMN user_id INT REFERENCES users(id);
  END IF;
END $$;

-- Safely handle category_budgets unique constraint update
DO $$
BEGIN
  -- 1. Drop old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'category_budgets_category_id_month_key'
  ) THEN
    ALTER TABLE category_budgets DROP CONSTRAINT category_budgets_category_id_month_key;
  END IF;

  -- 2. Add new unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'category_budgets_user_id_category_id_month_key'
  ) THEN
    ALTER TABLE category_budgets ADD CONSTRAINT category_budgets_user_id_category_id_month_key UNIQUE(user_id, category_id, month);
  END IF;
END $$;
