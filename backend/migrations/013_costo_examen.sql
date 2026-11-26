-- Costo habitual de un examen: se propone al programar uno nuevo y se puede cambiar en Configuración.
ALTER TABLE schools ADD COLUMN IF NOT EXISTS exam_fee_cents bigint NOT NULL DEFAULT 115000 CHECK (exam_fee_cents >= 0);
