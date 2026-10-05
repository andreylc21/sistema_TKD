ALTER TABLE charges ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE charges ADD COLUMN IF NOT EXISTS cancellation_reason text;

ALTER TABLE charges DROP CONSTRAINT IF EXISTS charges_status_check;
ALTER TABLE charges ADD CONSTRAINT charges_status_check CHECK (status IN ('active','cancelled'));

CREATE INDEX IF NOT EXISTS charges_school_status_idx ON charges(school_id, status);
