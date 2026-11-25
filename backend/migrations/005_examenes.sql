-- Exámenes parciales y finales de cinta negra.
-- track/level permiten saber cuál es el siguiente grado sin depender del nombre.
ALTER TABLE grades ADD COLUMN IF NOT EXISTS track text NOT NULL DEFAULT 'color';
ALTER TABLE grades ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 0;
ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_track_check;
ALTER TABLE grades ADD CONSTRAINT grades_track_check CHECK (track IN ('color','poom','dan'));

UPDATE grades SET track = 'poom', level = substring(name from 'Poom ([0-9]+)')::int
  WHERE name ~ '^Negra Poom [0-9]+$';
UPDATE grades SET track = 'dan', level = substring(name from '^Negra ([0-9]+)')::int
  WHERE name ~ '^Negra [0-9]+(er|º) Dan$';
UPDATE grades SET level = sort_order WHERE track = 'color' AND level = 0;

CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('partial','black')),
  exam_date date NOT NULL,
  fee_cents bigint NOT NULL DEFAULT 0 CHECK (fee_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exam_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id),
  grade_from_id uuid NOT NULL REFERENCES grades(id),
  grade_to_id uuid REFERENCES grades(id),
  result text NOT NULL DEFAULT 'pending' CHECK (result IN ('pending','passed','failed')),
  counts_for_dan boolean NOT NULL DEFAULT false,
  override_reason text,
  charge_id uuid REFERENCES charges(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS exam_entries_student_idx ON exam_entries(student_id);
CREATE INDEX IF NOT EXISTS exams_school_date_idx ON exams(school_id, exam_date);
