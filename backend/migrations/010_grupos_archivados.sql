-- Archivar grupos en lugar de borrarlos: conservan clases, asistencias y notas, pero ya no aparecen
-- en las listas ni se pueden usar para asignar alumnos o programar clases.
ALTER TABLE class_groups ADD COLUMN IF NOT EXISTS archived_at timestamptz;
