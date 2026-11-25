-- Perfil por edad de los grupos (opcional) y aviso de "ya no entra" que la maestra puede aceptar.
ALTER TABLE class_groups ADD COLUMN IF NOT EXISTS min_age integer;
ALTER TABLE class_groups ADD COLUMN IF NOT EXISTS max_age integer;
ALTER TABLE class_groups DROP CONSTRAINT IF EXISTS class_groups_age_check;
ALTER TABLE class_groups ADD CONSTRAINT class_groups_age_check CHECK (
  (min_age IS NULL OR min_age >= 0) AND (max_age IS NULL OR max_age >= 0)
  AND (min_age IS NULL OR max_age IS NULL OR min_age <= max_age)
);
ALTER TABLE group_assignments ADD COLUMN IF NOT EXISTS age_kept boolean NOT NULL DEFAULT false;
