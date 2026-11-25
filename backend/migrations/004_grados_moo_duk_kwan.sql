-- Escalera de grados de la escuela (Moo Duk Kwan): cintas de color, poom y dan.
-- Quita los grados de demostración que ningún alumno usa y agrega la escalera real.
DELETE FROM grades g
WHERE g.name IN ('Cinta blanca','Cinta amarilla','Cinta verde','Cinta azul','Cinta roja')
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.grade_id = g.id);

INSERT INTO grades (school_id, name, sort_order)
SELECT sc.id, l.name, l.ord
FROM schools sc
CROSS JOIN (VALUES
  ('Blanca',1),('Blanca avanzada',2),
  ('Amarilla',3),('Amarilla avanzada',4),
  ('Verde',5),('Verde avanzada',6),
  ('Azul',7),('Azul avanzada',8),
  ('Marrón',9),('Marrón avanzada',10),
  ('Roja',11),('Roja avanzada',12),
  ('Negra Poom 1',13),('Negra Poom 2',14),('Negra Poom 3',15),('Negra Poom 4',16),
  ('Negra 1er Dan',17),('Negra 2º Dan',18),('Negra 3er Dan',19),('Negra 4º Dan',20),
  ('Negra 5º Dan',21),('Negra 6º Dan',22),('Negra 7º Dan',23),('Negra 8º Dan',24),('Negra 9º Dan',25)
) AS l(name, ord)
ON CONFLICT (school_id, name) DO UPDATE SET sort_order = EXCLUDED.sort_order;
