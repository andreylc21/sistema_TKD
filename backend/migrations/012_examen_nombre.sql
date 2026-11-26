-- Nombre opcional del examen; vacío significa que se muestra el tipo (Examen parcial / de cinta negra).
ALTER TABLE exams ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
