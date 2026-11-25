-- El examen se paga por adelantado: cada examen tiene fecha límite de pago y la inscripción
-- sin pagar sólo puede continuar con una excepción autorizada por la maestra.
ALTER TABLE exams ADD COLUMN IF NOT EXISTS payment_deadline date;
UPDATE exams SET payment_deadline = exam_date WHERE payment_deadline IS NULL;
ALTER TABLE exams ALTER COLUMN payment_deadline SET NOT NULL;
ALTER TABLE exams DROP CONSTRAINT IF EXISTS exams_deadline_check;
ALTER TABLE exams ADD CONSTRAINT exams_deadline_check CHECK (payment_deadline <= exam_date);
ALTER TABLE exam_entries ADD COLUMN IF NOT EXISTS payment_exception text;
