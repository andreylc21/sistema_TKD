CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Tijuana',
  monthly_fee_cents bigint NOT NULL CHECK (monthly_fee_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id),
  owner_name text NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, email)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (lower(email));

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (school_id, name)
);

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  first_names text NOT NULL CHECK (length(trim(first_names)) > 0),
  last_names text NOT NULL CHECK (length(trim(last_names)) > 0),
  birth_date date NOT NULL,
  grade_id uuid NOT NULL REFERENCES grades(id),
  photo_url text,
  email text,
  email_owner text CHECK (email_owner IN ('alumno','responsable') OR email_owner IS NULL),
  primary_contact_name text NOT NULL,
  primary_contact_relation text NOT NULL,
  primary_contact_phone text NOT NULL,
  emergency_contact_name text NOT NULL,
  emergency_contact_relation text NOT NULL,
  emergency_contact_phone text NOT NULL,
  emergency_reuses_primary boolean NOT NULL DEFAULT false,
  allergies text,
  conditions text,
  restrictions text,
  health_consent_simulated boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  enrollment_date date NOT NULL,
  billing_day smallint NOT NULL CHECK (billing_day BETWEEN 1 AND 31),
  inactive_at date,
  billing_restart_date date,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS students_school_status_idx ON students (school_id, status);

CREATE TABLE IF NOT EXISTS student_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id uuid,
  note_date date NOT NULL,
  topic text NOT NULL,
  observation text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS class_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  days text[] NOT NULL CHECK (cardinality(days) > 0),
  start_time time NOT NULL,
  end_time time NOT NULL,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, name),
  CHECK (start_time < end_time)
);

CREATE TABLE IF NOT EXISTS group_assignments (
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assigned_from date NOT NULL,
  assigned_to date,
  PRIMARY KEY (group_id, student_id, assigned_from),
  CHECK (assigned_to IS NULL OR assigned_to >= assigned_from)
);

CREATE TABLE IF NOT EXISTS class_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES class_groups(id),
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','cancelled','rescheduled')),
  rescheduled_from_id uuid REFERENCES class_sessions(id),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, group_id, session_date),
  CHECK (start_time < end_time)
);

ALTER TABLE student_notes DROP CONSTRAINT IF EXISTS student_notes_session_fk;
ALTER TABLE student_notes ADD CONSTRAINT student_notes_session_fk FOREIGN KEY (session_id) REFERENCES class_sessions(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id),
  temporary boolean NOT NULL DEFAULT false,
  attendance_status text NOT NULL DEFAULT 'unregistered' CHECK (attendance_status IN ('present','absent','justified','unregistered')),
  observation text,
  version integer NOT NULL DEFAULT 1,
  UNIQUE (session_id, student_id)
);

CREATE TABLE IF NOT EXISTS student_activity_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  active_from date NOT NULL,
  active_to date,
  UNIQUE (student_id, active_from),
  CHECK (active_to IS NULL OR active_to >= active_from)
);

CREATE TABLE IF NOT EXISTS discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('fixed','percentage')),
  value bigint NOT NULL CHECK (value > 0),
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  period text,
  recurring boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_recurring_discount ON discounts(student_id) WHERE recurring AND active;

CREATE TABLE IF NOT EXISTS charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id),
  kind text NOT NULL CHECK (kind IN ('monthly','order','exam')),
  reference_id uuid,
  reference_item_id uuid,
  period text,
  description text NOT NULL,
  original_cents bigint NOT NULL CHECK (original_cents >= 0),
  discount_cents bigint NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  total_cents bigint NOT NULL CHECK (total_cents >= 0),
  due_date date NOT NULL,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (total_cents = GREATEST(0, original_cents - discount_cents)),
  UNIQUE (school_id, idempotency_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS monthly_charge_unique ON charges(school_id, student_id, period) WHERE kind = 'monthly';

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id),
  charge_id uuid NOT NULL REFERENCES charges(id),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  received_on date NOT NULL,
  method text CHECK (method IN ('cash','transfer','card','other') OR method IS NULL),
  observation text,
  status text NOT NULL DEFAULT 'valid' CHECK (status IN ('valid','void')),
  version integer NOT NULL DEFAULT 1,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES payments(id),
  action text NOT NULL CHECK (action IN ('created','corrected','voided')),
  previous_data jsonb,
  new_data jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id),
  code text NOT NULL,
  payment_due_date date NOT NULL,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  size text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_cents bigint NOT NULL CHECK (unit_price_cents >= 0),
  requested_to_supplier boolean NOT NULL DEFAULT false,
  received_quantity integer NOT NULL DEFAULT 0,
  delivered_quantity integer NOT NULL DEFAULT 0,
  cancelled boolean NOT NULL DEFAULT false,
  cancel_reason text,
  version integer NOT NULL DEFAULT 1,
  CHECK (received_quantity BETWEEN 0 AND quantity),
  CHECK (delivered_quantity BETWEEN 0 AND received_quantity)
);

CREATE TABLE IF NOT EXISTS order_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES order_items(id),
  description text NOT NULL,
  solution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS request_keys (
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  operation text NOT NULL,
  resource_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (school_id, idempotency_key)
);
