-- =====================================================================
-- RADICAL GYM - Datos de prueba
-- Clave de todos los usuarios de prueba: Radical2026
-- Usuarios: admin, recepcion, entrenador, nutricionista, fisioterapeuta
-- Alumnos: su usuario es su DNI (ej. 70000001)
-- =====================================================================
USE radicalgym;
SET @clave = '$2y$10$Tzu7jP.kTgz73p1y27HzVOgA0a6N1QHi5yc4G8sy6IY5vAFuB9aKu';

INSERT INTO planes (nombre, duracion_meses, precio, incluye_entrenador, incluye_nutricion, descripcion) VALUES
('Mensual',        1,  120.00, 0, 0, 'Acceso libre a sala de musculación y cardio'),
('Trimestral',     3,  320.00, 0, 1, 'Incluye una evaluación nutricional'),
('Semestral',      6,  590.00, 1, 1, 'Entrenador asignado y control nutricional mensual'),
('Anual',         12, 1050.00, 1, 1, 'Todo incluido con fisioterapia preventiva'),
('Mensual Plus',   1,  180.00, 1, 0, 'Mensual con entrenador personal');

INSERT INTO empleados (dni, nombres, apellidos, sexo, telefono, correo, cargo, especialidad, fecha_ingreso) VALUES
('41000001','Carlos','Mendoza Ruiz','M','987100001','carlos.mendoza@radicalgym.pe','administrador','Gestión deportiva', DATE_SUB(CURDATE(), INTERVAL 900 DAY)),
('41000002','Lucía','Paredes Soto','F','987100002','lucia.paredes@radicalgym.pe','recepcion','Atención al cliente', DATE_SUB(CURDATE(), INTERVAL 400 DAY)),
('41000003','Diego','Salazar Torres','M','987100003','diego.salazar@radicalgym.pe','entrenador','Hipertrofia y fuerza', DATE_SUB(CURDATE(), INTERVAL 600 DAY)),
('41000004','Andrea','Quispe Lara','F','987100004','andrea.quispe@radicalgym.pe','entrenador','Funcional y pérdida de peso', DATE_SUB(CURDATE(), INTERVAL 300 DAY)),
('41000005','María Fernanda','Ríos Chávez','F','987100005','maria.rios@radicalgym.pe','nutricionista','Nutrición deportiva', DATE_SUB(CURDATE(), INTERVAL 500 DAY)),
('41000006','Jorge','Huamán Peña','M','987100006','jorge.huaman@radicalgym.pe','fisioterapeuta','Lesiones deportivas', DATE_SUB(CURDATE(), INTERVAL 450 DAY)),
('41000007','Renzo','Castillo Vega','M','987100007','renzo.castillo@radicalgym.pe','entrenador','Calistenia y resistencia', DATE_SUB(CURDATE(), INTERVAL 120 DAY)),
('41000008','Sofía','Vargas Núñez','F','987100008','sofia.vargas@radicalgym.pe','recepcion','Caja y ventas', DATE_SUB(CURDATE(), INTERVAL 90 DAY));

INSERT INTO contratos (idempleado, tipo, modalidad, fecha_inicio, sueldo_mensual, horas_semanales) VALUES
(1000,'indefinido','tiempo_completo', DATE_SUB(CURDATE(), INTERVAL 900 DAY), 4500, 48),
(1001,'1_anio','tiempo_completo',     DATE_SUB(CURDATE(), INTERVAL 200 DAY), 1600, 48),
(1002,'1_anio','tiempo_completo',     DATE_SUB(CURDATE(), INTERVAL 340 DAY), 2400, 40),
(1003,'6_meses','medio_tiempo',       DATE_SUB(CURDATE(), INTERVAL 100 DAY), 1300, 24),
(1004,'1_anio','medio_tiempo',        DATE_SUB(CURDATE(), INTERVAL 150 DAY), 2000, 24),
(1005,'6_meses','medio_tiempo',       DATE_SUB(CURDATE(), INTERVAL 170 DAY), 2100, 24),
(1006,'3_meses','por_horas',          DATE_SUB(CURDATE(), INTERVAL 80 DAY),  0, 20),
(1007,'3_meses','tiempo_completo',    DATE_SUB(CURDATE(), INTERVAL 90 DAY),  1500, 48);
UPDATE contratos SET tarifa_hora = 22 WHERE idempleado = 1006;

-- Horarios (1=lunes ... 7=domingo)
INSERT INTO horarios_empleado (idempleado, dia_semana, hora_inicio, hora_fin) VALUES
(1001,1,'06:00','14:00'),(1001,2,'06:00','14:00'),(1001,3,'06:00','14:00'),(1001,4,'06:00','14:00'),(1001,5,'06:00','14:00'),(1001,6,'07:00','15:00'),
(1007,1,'14:00','22:00'),(1007,2,'14:00','22:00'),(1007,3,'14:00','22:00'),(1007,4,'14:00','22:00'),(1007,5,'14:00','22:00'),(1007,6,'14:00','20:00'),
(1002,1,'06:00','14:00'),(1002,2,'06:00','14:00'),(1002,3,'06:00','14:00'),(1002,4,'06:00','14:00'),(1002,5,'06:00','14:00'),
(1003,1,'16:00','20:00'),(1003,3,'16:00','20:00'),(1003,5,'16:00','20:00'),(1003,6,'08:00','12:00'),
(1006,2,'17:00','21:00'),(1006,4,'17:00','21:00'),(1006,6,'09:00','13:00'),
(1004,1,'09:00','13:00'),(1004,3,'09:00','13:00'),(1004,5,'15:00','19:00'),(1004,6,'09:00','13:00'),
(1005,2,'09:00','13:00'),(1005,4,'09:00','13:00'),(1005,5,'09:00','13:00'),(1005,6,'15:00','19:00');

INSERT INTO programas_entrenamiento (nombre, objetivo, nivel, identrenador, descripcion) VALUES
('Hipertrofia 4 días',      'hipertrofia',   'intermedio',   1002, 'Torso-pierna con progresión de cargas'),
('Quema grasa funcional',   'perdida_peso',  'principiante', 1003, 'Circuitos metabólicos y cardio HIIT'),
('Fuerza 5x5',              'fuerza',        'avanzado',     1002, 'Básicos con barra y control de RPE'),
('Calistenia base',         'resistencia',   'principiante', 1006, 'Dominio del peso corporal'),
('Readaptación de lesiones','rehabilitacion','principiante', 1003, 'Trabajo coordinado con fisioterapia');

INSERT INTO alumnos (dni, nombres, apellidos, sexo, fecha_nacimiento, telefono, correo, contacto_emergencia, telefono_emergencia, restricciones_medicas, objetivo, fecha_registro) VALUES
('70000001','Luis','Ramírez Ortega','M','1995-03-12','951000001','luis.ramirez@correo.pe','Ana Ortega','951900001',NULL,'hipertrofia', DATE_SUB(CURDATE(), INTERVAL 300 DAY)),
('70000002','Camila','Flores Medina','F','1998-07-21','951000002','camila.flores@correo.pe','Rosa Medina','951900002',NULL,'perdida_peso', DATE_SUB(CURDATE(), INTERVAL 250 DAY)),
('70000003','José','Gutiérrez Pinto','M','1990-11-02','951000003','jose.gutierrez@correo.pe','Carmen Pinto','951900003','Lesión de rodilla derecha','rehabilitacion', DATE_SUB(CURDATE(), INTERVAL 200 DAY)),
('70000004','Valeria','Sánchez Rojas','F','2000-01-30','951000004','valeria.sanchez@correo.pe','Pedro Sánchez','951900004',NULL,'tonificacion', DATE_SUB(CURDATE(), INTERVAL 180 DAY)),
('70000005','Miguel','Torres Campos','M','1988-05-17','951000005','miguel.torres@correo.pe','Lucía Campos','951900005','Hipertensión controlada','perdida_peso', DATE_SUB(CURDATE(), INTERVAL 160 DAY)),
('70000006','Daniela','Castro Ibáñez','F','1997-09-09','951000006','daniela.castro@correo.pe','Raúl Castro','951900006',NULL,'fuerza', DATE_SUB(CURDATE(), INTERVAL 150 DAY)),
('70000007','Andrés','Morales León','M','1993-12-25','951000007','andres.morales@correo.pe','Elena León','951900007',NULL,'hipertrofia', DATE_SUB(CURDATE(), INTERVAL 140 DAY)),
('70000008','Paola','Herrera Díaz','F','1996-04-04','951000008','paola.herrera@correo.pe','Mario Herrera','951900008','Dolor lumbar crónico','rehabilitacion', DATE_SUB(CURDATE(), INTERVAL 130 DAY)),
('70000009','Ricardo','Vásquez Lozano','M','1985-08-14','951000009','ricardo.vasquez@correo.pe','Silvia Lozano','951900009',NULL,'resistencia', DATE_SUB(CURDATE(), INTERVAL 120 DAY)),
('70000010','Fiorella','Chávez Romero','F','2001-02-18','951000010','fiorella.chavez@correo.pe','Juan Chávez','951900010',NULL,'tonificacion', DATE_SUB(CURDATE(), INTERVAL 110 DAY)),
('70000011','Sebastián','Navarro Cruz','M','1999-06-06','951000011','sebastian.navarro@correo.pe','Inés Cruz','951900011',NULL,'fuerza', DATE_SUB(CURDATE(), INTERVAL 100 DAY)),
('70000012','Gabriela','Mendoza Silva','F','1994-10-10','951000012','gabriela.mendoza@correo.pe','Óscar Mendoza','951900012',NULL,'perdida_peso', DATE_SUB(CURDATE(), INTERVAL 95 DAY)),
('70000013','Fernando','Aguilar Ríos','M','1991-01-22','951000013','fernando.aguilar@correo.pe','Teresa Ríos','951900013',NULL,'hipertrofia', DATE_SUB(CURDATE(), INTERVAL 90 DAY)),
('70000014','Natalia','Cáceres Luna','F','1997-03-03','951000014','natalia.caceres@correo.pe','Hugo Cáceres','951900014',NULL,'tonificacion', DATE_SUB(CURDATE(), INTERVAL 80 DAY)),
('70000015','Kevin','Palacios Ramos','M','2002-07-07','951000015','kevin.palacios@correo.pe','Nora Ramos','951900015',NULL,'resistencia', DATE_SUB(CURDATE(), INTERVAL 70 DAY)),
('70000016','Mariana','Espinoza Vera','F','1992-12-12','951000016','mariana.espinoza@correo.pe','Luis Espinoza','951900016','Esguince de tobillo previo','rehabilitacion', DATE_SUB(CURDATE(), INTERVAL 60 DAY)),
('70000017','Álvaro','Rojas Benites','M','1989-09-19','951000017','alvaro.rojas@correo.pe','Pilar Benites','951900017',NULL,'fuerza', DATE_SUB(CURDATE(), INTERVAL 50 DAY)),
('70000018','Lorena','Salinas Paz','F','1999-11-11','951000018','lorena.salinas@correo.pe','Iván Salinas','951900018',NULL,'perdida_peso', DATE_SUB(CURDATE(), INTERVAL 40 DAY)),
('70000019','Bruno','Delgado Arce','M','1996-02-02','951000019','bruno.delgado@correo.pe','Marta Arce','951900019',NULL,'hipertrofia', DATE_SUB(CURDATE(), INTERVAL 30 DAY)),
('70000020','Ximena','Ponce Tello','F','2003-05-05','951000020','ximena.ponce@correo.pe','Raúl Ponce','951900020',NULL,'tonificacion', DATE_SUB(CURDATE(), INTERVAL 20 DAY)),
('70000021','Héctor','Montes Aliaga','M','1987-04-28','951000021','hector.montes@correo.pe','Gloria Aliaga','951900021',NULL,'perdida_peso', DATE_SUB(CURDATE(), INTERVAL 15 DAY)),
('70000022','Renata','Valdivia Soto','F','1995-08-08','951000022','renata.valdivia@correo.pe','Pablo Valdivia','951900022',NULL,'fuerza', DATE_SUB(CURDATE(), INTERVAL 10 DAY)),
('70000023','Tomás','Ccori Mamani','M','2000-10-30','951000023','tomas.ccori@correo.pe','Juana Mamani','951900023',NULL,'resistencia', DATE_SUB(CURDATE(), INTERVAL 7 DAY)),
('70000024','Alessandra','Bravo Zegarra','F','1998-12-01','951000024','alessandra.bravo@correo.pe','Diego Bravo','951900024',NULL,'tonificacion', DATE_SUB(CURDATE(), INTERVAL 3 DAY));

-- Matrículas (el trigger calcula fecha_fin y registra el ingreso en caja)
INSERT INTO matriculas (idalumno, idplan, idprograma, identrenador, fecha_inicio, fecha_fin, monto, metodo_pago, fecha_registro) VALUES
(1000,4,1,1002, DATE_SUB(CURDATE(), INTERVAL 300 DAY), NULL, 0,'transferencia', DATE_SUB(NOW(), INTERVAL 300 DAY)),
(1001,3,2,1003, DATE_SUB(CURDATE(), INTERVAL 120 DAY), NULL, 0,'tarjeta',       DATE_SUB(NOW(), INTERVAL 120 DAY)),
(1002,2,5,1003, DATE_SUB(CURDATE(), INTERVAL 60 DAY),  NULL, 0,'efectivo',      DATE_SUB(NOW(), INTERVAL 60 DAY)),
(1003,1,2,NULL, DATE_SUB(CURDATE(), INTERVAL 27 DAY),  NULL, 0,'yape_plin',     DATE_SUB(NOW(), INTERVAL 27 DAY)),
(1004,2,2,1003, DATE_SUB(CURDATE(), INTERVAL 80 DAY),  NULL, 0,'efectivo',      DATE_SUB(NOW(), INTERVAL 80 DAY)),
(1005,3,3,1002, DATE_SUB(CURDATE(), INTERVAL 150 DAY), NULL, 0,'tarjeta',       DATE_SUB(NOW(), INTERVAL 150 DAY)),
(1006,5,1,1002, DATE_SUB(CURDATE(), INTERVAL 25 DAY),  NULL, 0,'yape_plin',     DATE_SUB(NOW(), INTERVAL 25 DAY)),
(1007,2,5,1003, DATE_SUB(CURDATE(), INTERVAL 40 DAY),  NULL, 0,'transferencia', DATE_SUB(NOW(), INTERVAL 40 DAY)),
(1008,1,4,NULL, DATE_SUB(CURDATE(), INTERVAL 45 DAY),  NULL, 0,'efectivo',      DATE_SUB(NOW(), INTERVAL 45 DAY)),
(1009,1,2,NULL, DATE_SUB(CURDATE(), INTERVAL 10 DAY),  NULL, 0,'yape_plin',     DATE_SUB(NOW(), INTERVAL 10 DAY)),
(1010,4,3,1002, DATE_SUB(CURDATE(), INTERVAL 100 DAY), NULL, 0,'tarjeta',       DATE_SUB(NOW(), INTERVAL 100 DAY)),
(1011,2,2,1003, DATE_SUB(CURDATE(), INTERVAL 30 DAY),  NULL, 0,'efectivo',      DATE_SUB(NOW(), INTERVAL 30 DAY)),
(1012,3,1,1002, DATE_SUB(CURDATE(), INTERVAL 90 DAY),  NULL, 0,'transferencia', DATE_SUB(NOW(), INTERVAL 90 DAY)),
(1013,1,2,NULL, DATE_SUB(CURDATE(), INTERVAL 5 DAY),   NULL, 0,'yape_plin',     DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1014,1,4,1006, DATE_SUB(CURDATE(), INTERVAL 33 DAY),  NULL, 0,'efectivo',      DATE_SUB(NOW(), INTERVAL 33 DAY)),
(1015,2,5,1003, DATE_SUB(CURDATE(), INTERVAL 60 DAY),  NULL, 0,'tarjeta',       DATE_SUB(NOW(), INTERVAL 60 DAY)),
(1016,5,3,1002, DATE_SUB(CURDATE(), INTERVAL 15 DAY),  NULL, 0,'yape_plin',     DATE_SUB(NOW(), INTERVAL 15 DAY)),
(1017,1,2,NULL, DATE_SUB(CURDATE(), INTERVAL 29 DAY),  NULL, 0,'efectivo',      DATE_SUB(NOW(), INTERVAL 29 DAY)),
(1018,3,1,1002, DATE_SUB(CURDATE(), INTERVAL 30 DAY),  NULL, 0,'tarjeta',       DATE_SUB(NOW(), INTERVAL 30 DAY)),
(1019,1,4,1006, DATE_SUB(CURDATE(), INTERVAL 20 DAY),  NULL, 0,'yape_plin',     DATE_SUB(NOW(), INTERVAL 20 DAY)),
(1020,2,2,1003, DATE_SUB(CURDATE(), INTERVAL 15 DAY),  NULL, 0,'efectivo',      DATE_SUB(NOW(), INTERVAL 15 DAY)),
(1021,1,3,NULL, DATE_SUB(CURDATE(), INTERVAL 10 DAY),  NULL, 0,'transferencia', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(1022,1,4,1006, DATE_SUB(CURDATE(), INTERVAL 7 DAY),   NULL, 0,'yape_plin',     DATE_SUB(NOW(), INTERVAL 7 DAY));
-- El alumno 1023 queda sin plan para probar el filtro "sin plan"

-- Usuarios del sistema
INSERT INTO usuarios (usuario, clave, rol, idempleado) VALUES
('admin',          @clave, 'administrador',  1000),
('recepcion',      @clave, 'recepcion',      1001),
('entrenador',     @clave, 'entrenador',     1002),
('nutricionista',  @clave, 'nutricionista',  1004),
('fisioterapeuta', @clave, 'fisioterapeuta', 1005),
('andrea',         @clave, 'entrenador',     1003),
('renzo',          @clave, 'entrenador',     1006),
('sofia',          @clave, 'recepcion',      1007);
INSERT INTO usuarios (usuario, clave, rol, idalumno)
SELECT dni, @clave, 'alumno', idalumno FROM alumnos;

-- Asistencias de alumnos (últimos 14 días)
INSERT IGNORE INTO asistencias_alumno (idalumno, fecha, hora_entrada)
SELECT a.idalumno, DATE_SUB(CURDATE(), INTERVAL d.n DAY), ADDTIME('06:30:00', SEC_TO_TIME((a.idalumno * 37 + d.n * 53) MOD 46800))
  FROM alumnos a
  JOIN (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 5 UNION SELECT 6 UNION SELECT 8 UNION SELECT 9 UNION SELECT 12 UNION SELECT 13) d
 WHERE (a.idalumno + d.n) MOD 3 <> 0 AND a.idalumno < 1023;

-- Asistencias del personal (últimos 10 días). El trigger fija puntual/tarde y horas.
INSERT IGNORE INTO asistencias_empleado (idempleado, fecha, hora_entrada, hora_salida)
SELECT h.idempleado, DATE_SUB(CURDATE(), INTERVAL d.n DAY),
       ADDTIME(h.hora_inicio, IF((h.idempleado + d.n) MOD 4 = 0, '00:18:00', '-00:05:00')),
       h.hora_fin
  FROM horarios_empleado h
  JOIN (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) d
 WHERE h.dia_semana = WEEKDAY(DATE_SUB(CURDATE(), INTERVAL d.n DAY)) + 1;
INSERT IGNORE INTO asistencias_empleado (idempleado, fecha, estado, observacion) VALUES
(1003, DATE_SUB(CURDATE(), INTERVAL 11 DAY), 'falta', 'No se presentó'),
(1006, DATE_SUB(CURDATE(), INTERVAL 12 DAY), 'falta', 'Sin aviso');

INSERT INTO permisos (idempleado, tipo, fecha_inicio, fecha_fin, motivo, estado) VALUES
(1002, 'salud',        DATE_ADD(CURDATE(), INTERVAL 5 DAY),  DATE_ADD(CURDATE(), INTERVAL 6 DAY),  'Control médico programado', 'pendiente'),
(1003, 'capacitacion', DATE_ADD(CURDATE(), INTERVAL 12 DAY), DATE_ADD(CURDATE(), INTERVAL 12 DAY), 'Curso de certificación funcional', 'pendiente'),
(1007, 'personal',     DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'Trámite personal', 'pendiente');
UPDATE permisos SET estado = 'aprobado' WHERE idpermiso = 3;

-- Citas de nutrición y fisioterapia (hoy y próximos días)
INSERT INTO citas (servicio, idalumno, idempleado, fecha, hora_inicio, hora_fin, motivo, estado) VALUES
('nutricion',    1000, 1004, CURDATE(), '09:00','09:45','Control mensual de composición', 'programada'),
('nutricion',    1001, 1004, CURDATE(), '10:00','10:45','Ajuste de dieta de déficit', 'programada'),
('nutricion',    1004, 1004, CURDATE(), '11:00','11:45','Primera evaluación', 'programada'),
('nutricion',    1011, 1004, CURDATE(), '12:00','12:45','Seguimiento', 'programada'),
('nutricion',    1005, 1004, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00','09:45','Revisión de presión y dieta', 'programada'),
('nutricion',    1017, 1004, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '15:00','15:45','Plan de volumen', 'programada'),
('fisioterapia', 1002, 1005, CURDATE(), '09:00','09:45','Rodilla derecha - sesión 3', 'programada'),
('fisioterapia', 1007, 1005, CURDATE(), '10:00','10:45','Dolor lumbar', 'programada'),
('fisioterapia', 1015, 1005, CURDATE(), '11:00','11:45','Tobillo izquierdo', 'programada'),
('fisioterapia', 1008, 1005, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00','10:45','Sobrecarga de hombro', 'programada'),
('fisioterapia', 1002, 1005, DATE_SUB(CURDATE(), INTERVAL 7 DAY), '09:00','09:45','Rodilla derecha - sesión 2', 'atendida');

-- Catálogo de alimentos (kcal por 100 g)
INSERT INTO alimentos (nombre, kcal_100g) VALUES
('Avena', 389), ('Huevo', 155), ('Pechuga de pollo', 165), ('Arroz blanco cocido', 130), ('Arroz integral cocido', 112),
('Plátano', 89), ('Manzana', 52), ('Pan integral', 247), ('Palta', 160), ('Atún en agua', 116),
('Quinua cocida', 120), ('Camote', 86), ('Papa sancochada', 87), ('Brócoli', 34), ('Yogur griego', 97),
('Leche descremada', 35), ('Mantequilla de maní', 588), ('Almendras', 579), ('Salmón', 208), ('Carne de res magra', 250),
('Lentejas cocidas', 116), ('Fideos cocidos', 158), ('Queso fresco', 264), ('Aceite de oliva', 884), ('Proteína whey', 400);

CALL sp_dieta_crear(JSON_OBJECT(
  'idalumno', 1000, 'idnutricionista', 1004, 'titulo', 'Volumen limpio 2800 kcal', 'objetivo', 'hipertrofia',
  'calorias_meta', 2800, 'proteinas_g', 170, 'carbohidratos_g', 340, 'grasas_g', 80, 'agua_litros', 3.0,
  'recomendaciones', 'Distribuir proteína en todas las comidas. Dormir 7-8 horas.',
  'comidas', JSON_ARRAY(
     JSON_OBJECT('nombre','Desayuno','hora','07:00','alimentos', JSON_ARRAY(
        JSON_OBJECT('alimento','Avena','gramos',80), JSON_OBJECT('alimento','Huevo','gramos',150), JSON_OBJECT('alimento','Plátano','gramos',120))),
     JSON_OBJECT('nombre','Media mañana','hora','10:30','alimentos', JSON_ARRAY(
        JSON_OBJECT('alimento','Yogur griego','gramos',200), JSON_OBJECT('alimento','Almendras','gramos',25))),
     JSON_OBJECT('nombre','Almuerzo','hora','13:30','alimentos', JSON_ARRAY(
        JSON_OBJECT('alimento','Pechuga de pollo','gramos',200), JSON_OBJECT('alimento','Arroz integral cocido','gramos',250), JSON_OBJECT('alimento','Brócoli','gramos',150))),
     JSON_OBJECT('nombre','Pre-entreno','hora','17:00','alimentos', JSON_ARRAY(
        JSON_OBJECT('alimento','Pan integral','gramos',80), JSON_OBJECT('alimento','Mantequilla de maní','gramos',20))),
     JSON_OBJECT('nombre','Cena','hora','20:30','alimentos', JSON_ARRAY(
        JSON_OBJECT('alimento','Salmón','gramos',180), JSON_OBJECT('alimento','Camote','gramos',200))),
     JSON_OBJECT('nombre','Extra nocturno','hora','22:30','alimentos', JSON_ARRAY(
        JSON_OBJECT('alimento','Leche descremada','gramos',250), JSON_OBJECT('alimento','Proteína whey','gramos',30)))
  )));

CALL sp_dieta_crear(JSON_OBJECT(
  'idalumno', 1001, 'idnutricionista', 1004, 'titulo', 'Déficit moderado 1600 kcal', 'objetivo', 'perdida_peso',
  'calorias_meta', 1600, 'proteinas_g', 120, 'carbohidratos_g', 150, 'grasas_g', 50, 'agua_litros', 2.5,
  'recomendaciones', 'Priorizar verduras y caminar 8000 pasos diarios.',
  'comidas', JSON_ARRAY(
     JSON_OBJECT('nombre','Desayuno','hora','07:30','alimentos', JSON_ARRAY(
        JSON_OBJECT('alimento','Huevo','gramos',100), JSON_OBJECT('alimento','Pan integral','gramos',50))),
     JSON_OBJECT('nombre','Almuerzo','hora','13:00','alimentos', JSON_ARRAY(
        JSON_OBJECT('alimento','Pechuga de pollo','gramos',150), JSON_OBJECT('alimento','Quinua cocida','gramos',150), JSON_OBJECT('alimento','Brócoli','gramos',200))),
     JSON_OBJECT('nombre','Cena','hora','19:30','alimentos', JSON_ARRAY(
        JSON_OBJECT('alimento','Atún en agua','gramos',120), JSON_OBJECT('alimento','Palta','gramos',50), JSON_OBJECT('alimento','Ensalada de la casa','gramos',150,'kilocalorias',60)))
  )));

-- Medidas antropométricas (el trigger calcula IMC e índice cintura/cadera)
INSERT INTO medidas (idalumno, idevaluador, fecha, peso_kg, talla_cm, cuello, hombros, pecho, cintura, abdomen, cadera,
  biceps_relajado_der, biceps_relajado_izq, biceps_contraido_der, biceps_contraido_izq, antebrazo_der, antebrazo_izq,
  muslo_der, muslo_izq, pantorrilla_der, pantorrilla_izq, grasa_porcentaje, masa_muscular_kg, grasa_visceral,
  agua_porcentaje, metabolismo_basal, edad_metabolica, observaciones) VALUES
(1000,1004, DATE_SUB(CURDATE(), INTERVAL 90 DAY), 74.5,176, 38,116,98,82,85,96, 33,32.5,36,35.5,28,27.5,55,54.5,37,36.8, 16.5,34.2,6,57.0,1720,26,'Evaluación inicial'),
(1000,1004, DATE_SUB(CURDATE(), INTERVAL 45 DAY), 76.2,176, 38.5,118,100,81,84,96.5, 34,33.6,37.2,36.8,28.5,28,56.5,56,37.5,37.2, 15.4,35.6,6,57.8,1755,25,'Buen avance en masa muscular'),
(1000,1004, DATE_SUB(CURDATE(), INTERVAL 5 DAY),  77.8,176, 39,119.5,101.5,80.5,83.5,97, 35,34.6,38.4,38,29,28.6,57.5,57.2,38,37.6, 14.8,36.9,5,58.3,1790,24,'Mantener superávit'),
(1001,1004, DATE_SUB(CURDATE(), INTERVAL 100 DAY), 72.0,162, 34,104,95,84,90,104, 29,28.6,30,29.6,24,23.8,60,59.4,37,36.6, 33.0,24.1,8,48.5,1380,38,'Inicio de déficit'),
(1001,1004, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 66.4,162, 33,101,92,77,82,99, 28,27.8,29,28.8,23.5,23.2,57,56.4,36,35.8, 28.5,24.4,6,51.0,1360,33,'Bajó 5.6 kg'),
(1004,1004, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 58.3,160, 31,96,86,66,70,95, 26,25.6,27.5,27,22,21.8,53,52.8,34,33.8, 24.0,22.3,3,53.5,1290,24,NULL),
(1005,1004, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 94.0,172, 42,121,108,101,104,105, 35,34.5,37,36.5,30,29.6,62,61.5,40,39.6, 29.0,37.0,12,50.1,1890,45,'Controlar sodio');

-- Fisioterapia: catálogo de técnicas
INSERT INTO tecnicas_fisioterapia (nombre, descripcion) VALUES
('Electroterapia TENS', 'Analgesia por corriente eléctrica transcutánea'),
('Crioterapia', 'Aplicación de frío local'),
('Termoterapia', 'Aplicación de calor superficial'),
('Punción seca', 'Desactivación de puntos gatillo'),
('Masoterapia descontracturante', 'Masaje terapéutico'),
('Vendaje neuromuscular', 'Kinesiotape funcional'),
('Ultrasonido terapéutico', 'Ultrasonido pulsado o continuo'),
('Movilización articular', 'Técnicas de terapia manual'),
('Ejercicio terapéutico', 'Fortalecimiento y control motor'),
('Estiramientos asistidos', 'Flexibilidad guiada');

CALL sp_sesion_fisioterapia_crear(JSON_OBJECT(
  'idalumno', 1002, 'idfisioterapeuta', 1005, 'fecha', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 14 DAY), '%Y-%m-%d'),
  'motivo_consulta', 'Dolor en rodilla derecha al hacer sentadilla',
  'evaluacion', 'Síndrome patelofemoral leve, valgo dinámico',
  'restricciones_gym', 'Evitar sentadilla profunda y saltos',
  'indicaciones_casa', 'Hielo 15 min y estiramiento de cuádriceps',
  'evolucion', 'Primera sesión', 'proxima_cita', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '%Y-%m-%d'),
  'zonas', JSON_ARRAY(JSON_OBJECT('zona','rodilla','nivel_dolor',7), JSON_OBJECT('zona','cadera','nivel_dolor',3)),
  'tecnicas', JSON_ARRAY(1, 2, 9)));
CALL sp_sesion_fisioterapia_crear(JSON_OBJECT(
  'idalumno', 1002, 'idfisioterapeuta', 1005, 'fecha', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '%Y-%m-%d'),
  'motivo_consulta', 'Control de rodilla derecha',
  'evaluacion', 'Mejora del control de rodilla',
  'restricciones_gym', 'Sentadilla hasta 90°',
  'indicaciones_casa', 'Puente de glúteo 3x15',
  'evolucion', 'Dolor disminuye de 7 a 4', 'proxima_cita', DATE_FORMAT(CURDATE(), '%Y-%m-%d'),
  'zonas', JSON_ARRAY(JSON_OBJECT('zona','rodilla','nivel_dolor',4)),
  'tecnicas', JSON_ARRAY(6, 8, 9)));
CALL sp_sesion_fisioterapia_crear(JSON_OBJECT(
  'idalumno', 1007, 'idfisioterapeuta', 1005, 'fecha', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '%Y-%m-%d'),
  'motivo_consulta', 'Lumbalgia mecánica',
  'evaluacion', 'Contractura paravertebral y cervical',
  'restricciones_gym', 'Evitar peso muerto convencional',
  'indicaciones_casa', 'Gato-camello y caminata',
  'evolucion', 'Primera sesión', 'proxima_cita', DATE_FORMAT(CURDATE(), '%Y-%m-%d'),
  'zonas', JSON_ARRAY(JSON_OBJECT('zona','lumbar','nivel_dolor',6), JSON_OBJECT('zona','cervical','nivel_dolor',4), JSON_OBJECT('zona','muscular_general','nivel_dolor',2)),
  'tecnicas', JSON_ARRAY(3, 5, 1)));

-- Productos (imágenes: uploads/productos/{idproducto}_productos_{nombre}.ext)
INSERT INTO productos (nombre, categoria, precio_compra, precio_venta, stock, stock_minimo) VALUES
('Agua mineral 625 ml', 'bebidas', 1.20, 2.50, 60, 12),
('Bebida isotónica', 'bebidas', 2.80, 4.50, 35, 10),
('Proteína whey 2 lb', 'suplementos', 120.00, 169.00, 12, 3),
('Creatina monohidratada 300 g', 'suplementos', 70.00, 99.00, 8, 3),
('Barra proteica', 'snacks', 4.00, 7.00, 40, 10),
('Mix de frutos secos', 'snacks', 3.50, 6.00, 6, 8),
('Guantes de entrenamiento', 'accesorios', 18.00, 35.00, 10, 3),
('Shaker Radical', 'accesorios', 8.00, 18.00, 25, 5),
('Polo dry-fit Radical', 'ropa', 22.00, 45.00, 18, 5),
('Toalla deportiva', 'accesorios', 9.00, 20.00, 14, 4);

CALL sp_venta_registrar(1001, 1000, 'efectivo',  JSON_ARRAY(JSON_OBJECT('idproducto',1,'cantidad',2), JSON_OBJECT('idproducto',5,'cantidad',1)));
CALL sp_venta_registrar(1001, NULL, 'yape_plin', JSON_ARRAY(JSON_OBJECT('idproducto',3,'cantidad',1)));
CALL sp_venta_registrar(1007, 1004, 'tarjeta',   JSON_ARRAY(JSON_OBJECT('idproducto',8,'cantidad',1), JSON_OBJECT('idproducto',2,'cantidad',2)));

-- Egresos
INSERT INTO movimientos_caja (tipo, categoria, monto, descripcion, fecha) VALUES
('egreso','alquiler',      3500, 'Alquiler del local',            DATE_SUB(NOW(), INTERVAL 12 DAY)),
('egreso','servicios',      680, 'Luz y agua',                    DATE_SUB(NOW(), INTERVAL 9 DAY)),
('egreso','mantenimiento',  250, 'Cambio de cable de polea',      DATE_SUB(NOW(), INTERVAL 4 DAY)),
('egreso','planilla',      2400, 'Pago a Diego Salazar',          DATE_SUB(NOW(), INTERVAL 13 DAY)),
('egreso','alquiler',      3500, 'Alquiler del local',            DATE_SUB(NOW(), INTERVAL 42 DAY));

INSERT INTO notificaciones (titulo, mensaje, destino, tipo) VALUES
('Horario feriado', 'El gimnasio atenderá de 8:00 a 14:00 este feriado.', 'todos', 'aviso'),
('Promoción trimestral', 'Renueva tu plan trimestral con 10% de descuento esta semana.', 'alumnos', 'promocion'),
('Reunión de personal', 'Reunión general el sábado a las 15:00.', 'personal', 'aviso');

CALL sp_estados_actualizar();
