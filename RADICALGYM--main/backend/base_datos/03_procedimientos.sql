-- =====================================================================
-- RADICAL GYM - Procedimientos almacenados
-- =====================================================================
USE radicalgym;

DELIMITER $$

-- ---------------------------------------------------------------------
-- Alumnos: listado con filtros y paginación
-- Devuelve 2 resultados: filas de la página y total de registros.
-- p_mes con formato 'AAAA-MM' (mes de inicio de la matrícula vigente)
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_alumnos_listar $$
CREATE PROCEDURE sp_alumnos_listar(
  IN p_buscar VARCHAR(80), IN p_sexo CHAR(1), IN p_idplan INT, IN p_mes CHAR(7),
  IN p_idprograma INT, IN p_estado VARCHAR(12), IN p_pagina INT, IN p_por_pagina INT)
BEGIN
  DECLARE v_desde INT DEFAULT (GREATEST(IFNULL(p_pagina,1),1) - 1) * IFNULL(p_por_pagina,10);
  DECLARE v_cantidad INT DEFAULT IFNULL(p_por_pagina,10);

  DROP TEMPORARY TABLE IF EXISTS tmp_alumnos;
  CREATE TEMPORARY TABLE tmp_alumnos AS
  SELECT a.idalumno, a.dni, a.nombres, a.apellidos, a.sexo, a.telefono, a.correo, a.foto, a.objetivo,
         m.idmatricula, m.idplan, p.nombre AS plan, m.fecha_inicio, m.fecha_fin,
         m.idprograma, pr.nombre AS programa,
         CASE WHEN m.idmatricula IS NULL THEN 'sin_plan'
              WHEN m.fecha_fin < CURDATE() THEN 'vencida'
              WHEN m.estado = 'congelada' THEN 'congelada'
              WHEN m.fecha_fin <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'por_vencer'
              ELSE 'activa' END AS estado
    FROM alumnos a
    LEFT JOIN matriculas m ON m.idmatricula = (
         SELECT m2.idmatricula FROM matriculas m2
          WHERE m2.idalumno = a.idalumno AND m2.estado <> 'anulada'
          ORDER BY m2.fecha_fin DESC LIMIT 1)
    LEFT JOIN planes p ON p.idplan = m.idplan
    LEFT JOIN programas_entrenamiento pr ON pr.idprograma = m.idprograma
   WHERE a.activo = 1
     AND (p_buscar IS NULL OR p_buscar = '' OR CONCAT(a.nombres,' ',a.apellidos,' ',a.dni,' ',a.idalumno) LIKE CONCAT('%', p_buscar, '%'))
     AND (p_sexo IS NULL OR p_sexo = '' OR a.sexo = p_sexo)
     AND (p_idplan IS NULL OR p_idplan = 0 OR m.idplan = p_idplan)
     AND (p_idprograma IS NULL OR p_idprograma = 0 OR m.idprograma = p_idprograma)
     AND (p_mes IS NULL OR p_mes = '' OR DATE_FORMAT(m.fecha_inicio, '%Y-%m') = p_mes);

  IF p_estado IS NOT NULL AND p_estado <> '' THEN
    DELETE FROM tmp_alumnos WHERE estado COLLATE utf8mb4_spanish_ci <> CONVERT(p_estado USING utf8mb4) COLLATE utf8mb4_spanish_ci;
  END IF;

  SELECT * FROM tmp_alumnos ORDER BY apellidos, nombres LIMIT v_desde, v_cantidad;
  SELECT COUNT(*) AS total FROM tmp_alumnos;
  DROP TEMPORARY TABLE IF EXISTS tmp_alumnos;
END $$

DROP PROCEDURE IF EXISTS sp_alumno_registrar $$
CREATE PROCEDURE sp_alumno_registrar(
  IN p_dni CHAR(8), IN p_nombres VARCHAR(80), IN p_apellidos VARCHAR(80), IN p_sexo CHAR(1),
  IN p_fecha_nacimiento DATE, IN p_telefono VARCHAR(15), IN p_correo VARCHAR(120),
  IN p_contacto VARCHAR(120), IN p_telefono_emergencia VARCHAR(15),
  IN p_restricciones VARCHAR(255), IN p_objetivo VARCHAR(20))
BEGIN
  IF EXISTS (SELECT 1 FROM alumnos WHERE dni = p_dni) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ya existe un alumno con ese DNI';
  END IF;
  INSERT INTO alumnos (dni, nombres, apellidos, sexo, fecha_nacimiento, telefono, correo,
                       contacto_emergencia, telefono_emergencia, restricciones_medicas, objetivo, fecha_registro)
  VALUES (p_dni, p_nombres, p_apellidos, p_sexo, p_fecha_nacimiento, p_telefono, NULLIF(p_correo,''),
          p_contacto, p_telefono_emergencia, p_restricciones, IFNULL(NULLIF(p_objetivo,''),'tonificacion'), CURDATE());
  SELECT LAST_INSERT_ID() AS idalumno;
END $$

-- ---------------------------------------------------------------------
-- Matrícula: cierra la anterior y registra la nueva (el trigger calcula
-- la fecha de fin y genera el ingreso en caja)
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_matricula_registrar $$
CREATE PROCEDURE sp_matricula_registrar(
  IN p_idalumno INT, IN p_idplan INT, IN p_idprograma INT, IN p_identrenador INT,
  IN p_fecha_inicio DATE, IN p_monto DECIMAL(10,2), IN p_metodo VARCHAR(15))
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  START TRANSACTION;
    UPDATE matriculas SET estado = 'vencida'
     WHERE idalumno = p_idalumno AND estado IN ('activa','congelada');
    INSERT INTO matriculas (idalumno, idplan, idprograma, identrenador, fecha_inicio, fecha_fin, monto, metodo_pago)
    VALUES (p_idalumno, p_idplan, NULLIF(p_idprograma,0), NULLIF(p_identrenador,0),
            IFNULL(p_fecha_inicio, CURDATE()), NULL, IFNULL(p_monto,0), IFNULL(NULLIF(p_metodo,''),'efectivo'));
  COMMIT;
  SELECT m.idmatricula, m.fecha_inicio, m.fecha_fin, m.monto, p.nombre AS plan
    FROM matriculas m JOIN planes p ON p.idplan = m.idplan
   WHERE m.idmatricula = LAST_INSERT_ID();
END $$

-- ---------------------------------------------------------------------
-- Actualiza estados vencidos y genera avisos de vencimiento (3 días)
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_estados_actualizar $$
CREATE PROCEDURE sp_estados_actualizar()
BEGIN
  UPDATE matriculas SET estado = 'vencida' WHERE estado = 'activa' AND fecha_fin < CURDATE();

  UPDATE contratos SET estado = CASE
      WHEN fecha_fin < CURDATE() THEN 'vencido'
      WHEN fecha_fin <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'por_vencer'
      ELSE 'vigente' END
   WHERE fecha_fin IS NOT NULL AND estado <> 'renovado';

  INSERT INTO notificaciones (titulo, mensaje, destino, idalumno, tipo)
  SELECT 'Tu plan está por vencer',
         CONCAT('Hola ', a.nombres, ', tu plan ', p.nombre, ' vence el ', DATE_FORMAT(m.fecha_fin, '%d/%m/%Y'), '.'),
         'alumno', a.idalumno, 'vencimiento'
    FROM matriculas m
    JOIN alumnos a ON a.idalumno = m.idalumno
    JOIN planes p ON p.idplan = m.idplan
   WHERE m.estado = 'activa'
     AND m.fecha_fin BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
     AND NOT EXISTS (SELECT 1 FROM notificaciones n
                      WHERE n.idalumno = a.idalumno AND n.tipo = 'vencimiento' AND DATE(n.fecha) = CURDATE());
END $$

-- ---------------------------------------------------------------------
-- Asistencia de alumnos por DNI o código (idalumno)
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_asistencia_alumno_registrar $$
CREATE PROCEDURE sp_asistencia_alumno_registrar(IN p_valor VARCHAR(12))
BEGIN
  DECLARE v_idalumno INT;
  DECLARE v_fin DATE;
  SELECT idalumno INTO v_idalumno FROM alumnos
   WHERE (dni = p_valor OR idalumno = p_valor) AND activo = 1 LIMIT 1;
  IF v_idalumno IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Alumno no encontrado';
  END IF;
  SELECT MAX(fecha_fin) INTO v_fin FROM matriculas WHERE idalumno = v_idalumno AND estado = 'activa';
  IF v_fin IS NULL OR v_fin < CURDATE() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El alumno no tiene un plan vigente';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM asistencias_alumno WHERE idalumno = v_idalumno AND fecha = CURDATE() AND tipo = 'entrada') THEN
    INSERT INTO asistencias_alumno (idalumno, fecha, hora_entrada) VALUES (v_idalumno, CURDATE(), CURTIME());
  END IF;
  SELECT a.idalumno, CONCAT(a.nombres, ' ', a.apellidos) AS alumno, v_fin AS fecha_fin,
         DATEDIFF(v_fin, CURDATE()) AS dias_restantes, MIN(s.hora_entrada) AS hora_entrada
    FROM alumnos a JOIN asistencias_alumno s ON s.idalumno = a.idalumno AND s.fecha = CURDATE() AND s.tipo = 'entrada'
   WHERE a.idalumno = v_idalumno
   GROUP BY a.idalumno;
END $$

-- ---------------------------------------------------------------------
-- Asistencia del personal: primera marca = entrada, segunda = salida
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_asistencia_empleado_marcar $$
CREATE PROCEDURE sp_asistencia_empleado_marcar(IN p_idempleado INT)
BEGIN
  DECLARE v_id INT;
  DECLARE v_salida TIME;
  DECLARE v_estado VARCHAR(10);
  IF NOT EXISTS (SELECT 1 FROM empleados WHERE idempleado = p_idempleado AND activo = 1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Empleado no encontrado';
  END IF;
  SELECT idasistencia_empleado, hora_salida, estado INTO v_id, v_salida, v_estado
    FROM asistencias_empleado WHERE idempleado = p_idempleado AND fecha = CURDATE();
  IF v_id IS NULL THEN
    INSERT INTO asistencias_empleado (idempleado, fecha, hora_entrada) VALUES (p_idempleado, CURDATE(), CURTIME());
    SET v_id = LAST_INSERT_ID();
  ELSEIF v_estado IN ('falta','permiso') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El día ya está registrado como falta o permiso';
  ELSEIF v_salida IS NULL THEN
    UPDATE asistencias_empleado SET hora_salida = CURTIME() WHERE idasistencia_empleado = v_id;
  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La entrada y salida de hoy ya fueron registradas';
  END IF;
  SELECT s.*, CONCAT(e.nombres, ' ', e.apellidos) AS empleado, e.cargo
    FROM asistencias_empleado s JOIN empleados e ON e.idempleado = s.idempleado
   WHERE s.idasistencia_empleado = v_id;
END $$

-- ---------------------------------------------------------------------
-- Resumen mensual del trabajador: horas, faltas, tardanzas, permisos
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_empleado_resumen_mes $$
CREATE PROCEDURE sp_empleado_resumen_mes(IN p_idempleado INT, IN p_anio INT, IN p_mes INT)
BEGIN
  SELECT e.idempleado, CONCAT(e.nombres, ' ', e.apellidos) AS empleado, e.cargo,
         c.idcontrato, c.tipo AS tipo_contrato, c.fecha_fin AS fin_contrato, c.estado AS estado_contrato,
         c.horas_semanales, c.sueldo_mensual, c.tarifa_hora,
         ROUND(IFNULL(c.horas_semanales,0) * 4.33, 1) AS horas_asignadas_mes,
         IFNULL(SUM(s.horas_trabajadas),0) AS horas_trabajadas,
         IFNULL(SUM(s.estado = 'puntual'),0) AS dias_puntual,
         IFNULL(SUM(s.estado = 'tarde'),0)   AS tardanzas,
         IFNULL(SUM(s.estado = 'falta'),0)   AS faltas,
         IFNULL(SUM(s.estado = 'permiso'),0) AS dias_permiso
    FROM empleados e
    LEFT JOIN contratos c ON c.idcontrato = (SELECT MAX(idcontrato) FROM contratos WHERE idempleado = e.idempleado)
    LEFT JOIN asistencias_empleado s ON s.idempleado = e.idempleado
          AND YEAR(s.fecha) = p_anio AND MONTH(s.fecha) = p_mes
   WHERE e.idempleado = p_idempleado
   GROUP BY e.idempleado, c.idcontrato;
END $$

-- ---------------------------------------------------------------------
-- Agenda de nutrición/fisioterapia (lista de personas por horario)
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_agenda_listar $$
CREATE PROCEDURE sp_agenda_listar(IN p_servicio VARCHAR(12), IN p_idempleado INT, IN p_fecha DATE)
BEGIN
  SELECT c.idcita, c.servicio, c.fecha, c.hora_inicio, c.hora_fin, c.motivo, c.estado,
         c.idalumno, CONCAT(a.nombres, ' ', a.apellidos) AS alumno, a.dni, a.telefono,
         c.idempleado, CONCAT(e.nombres, ' ', e.apellidos) AS profesional
    FROM citas c
    JOIN alumnos a   ON a.idalumno = c.idalumno
    JOIN empleados e ON e.idempleado = c.idempleado
   WHERE (p_servicio IS NULL OR p_servicio = '' OR c.servicio = p_servicio)
     AND (p_idempleado IS NULL OR p_idempleado = 0 OR c.idempleado = p_idempleado)
     AND c.fecha = IFNULL(p_fecha, CURDATE())
   ORDER BY c.hora_inicio, alumno;
END $$

-- ---------------------------------------------------------------------
-- Dieta completa en una transacción. p_datos (JSON):
-- {idalumno, idnutricionista, titulo, objetivo, calorias_meta, proteinas_g,
--  carbohidratos_g, grasas_g, agua_litros, recomendaciones,
--  comidas:[{nombre, hora, alimentos:[{alimento, gramos, kilocalorias}]}]}
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_dieta_crear $$
CREATE PROCEDURE sp_dieta_crear(IN p_datos JSON)
BEGIN
  DECLARE v_iddieta INT;
  DECLARE v_i INT DEFAULT 0;
  DECLARE v_total INT;
  DECLARE v_comida JSON;
  DECLARE v_idcomida INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  SET v_total = JSON_LENGTH(p_datos, '$.comidas');
  IF v_total IS NULL OR v_total = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La dieta debe tener al menos una comida';
  END IF;

  START TRANSACTION;
    UPDATE dietas SET activa = 0 WHERE idalumno = JSON_VALUE(p_datos, '$.idalumno') AND activa = 1;

    INSERT INTO dietas (idalumno, idnutricionista, titulo, objetivo, calorias_meta, proteinas_g, carbohidratos_g,
                        grasas_g, agua_litros, comidas_por_dia, recomendaciones, suplementos, pautas_hidratacion, fecha, activa)
    VALUES (JSON_VALUE(p_datos, '$.idalumno'), JSON_VALUE(p_datos, '$.idnutricionista'),
            JSON_UNQUOTE(JSON_EXTRACT(p_datos, '$.titulo')),
            IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p_datos, '$.objetivo')), 'tonificacion'),
            IFNULL(JSON_VALUE(p_datos, '$.calorias_meta'), 2000),
            IFNULL(JSON_VALUE(p_datos, '$.proteinas_g'), 0),
            IFNULL(JSON_VALUE(p_datos, '$.carbohidratos_g'), 0),
            IFNULL(JSON_VALUE(p_datos, '$.grasas_g'), 0),
            IFNULL(JSON_VALUE(p_datos, '$.agua_litros'), 2),
            v_total,
            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_datos, '$.recomendaciones')), 'null'),
            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_datos, '$.suplementos')), 'null'),
            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_datos, '$.pautas_hidratacion')), 'null'),
            CURDATE(), 1);
    SET v_iddieta = LAST_INSERT_ID();

    WHILE v_i < v_total DO
      SET v_comida = JSON_EXTRACT(p_datos, CONCAT('$.comidas[', v_i, ']'));
      INSERT INTO dieta_comidas (iddieta, orden, nombre, hora)
      VALUES (v_iddieta, v_i + 1, JSON_UNQUOTE(JSON_EXTRACT(v_comida, '$.nombre')),
              NULLIF(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_comida, '$.hora')), ''), 'null'));
      SET v_idcomida = LAST_INSERT_ID();

      INSERT INTO dieta_alimentos (iddieta_comida, alimento, gramos, kilocalorias, proteinas_g, carbohidratos_g, grasas_g)
      SELECT v_idcomida, j.alimento, j.gramos, NULLIF(j.kilocalorias, 0), j.proteinas, j.carbohidratos, j.grasas
        FROM JSON_TABLE(v_comida, '$.alimentos[*]' COLUMNS (
               alimento     VARCHAR(80)  PATH '$.alimento',
               gramos       DECIMAL(6,1) PATH '$.gramos',
               kilocalorias DECIMAL(7,1) PATH '$.kilocalorias' DEFAULT '0' ON EMPTY,
               proteinas    DECIMAL(6,1) PATH '$.proteinas_g' DEFAULT '0' ON EMPTY,
               carbohidratos DECIMAL(6,1) PATH '$.carbohidratos_g' DEFAULT '0' ON EMPTY,
               grasas       DECIMAL(6,1) PATH '$.grasas_g' DEFAULT '0' ON EMPTY)) j
       WHERE j.alimento IS NOT NULL AND j.alimento <> '' AND j.gramos > 0;
      SET v_i = v_i + 1;
    END WHILE;
  COMMIT;
  SELECT iddieta, calorias_totales, comidas_por_dia FROM dietas WHERE iddieta = v_iddieta;
END $$

-- ---------------------------------------------------------------------
-- Venta con detalle. p_items JSON: [{idproducto, cantidad}]
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_venta_registrar $$
CREATE PROCEDURE sp_venta_registrar(IN p_idempleado INT, IN p_idalumno INT, IN p_metodo VARCHAR(15), IN p_items JSON)
BEGIN
  DECLARE v_idventa INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  IF JSON_LENGTH(p_items) IS NULL OR JSON_LENGTH(p_items) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La venta no tiene productos';
  END IF;
  START TRANSACTION;
    INSERT INTO ventas (idalumno, idempleado, metodo_pago) VALUES (NULLIF(p_idalumno,0), p_idempleado, p_metodo);
    SET v_idventa = LAST_INSERT_ID();
    UPDATE ventas SET comprobante = CONCAT('B001-', LPAD(v_idventa, 6, '0')) WHERE idventa = v_idventa;
    INSERT INTO venta_detalle (idventa, idproducto, cantidad, precio_unitario, subtotal)
    SELECT v_idventa, j.idproducto, j.cantidad, 0, 0
      FROM JSON_TABLE(p_items, '$[*]' COLUMNS (idproducto INT PATH '$.idproducto', cantidad INT PATH '$.cantidad')) j;
  COMMIT;
  SELECT idventa, comprobante, total, fecha FROM ventas WHERE idventa = v_idventa;
END $$

-- ---------------------------------------------------------------------
-- Sesión de fisioterapia con varias zonas (dolor por zona) y técnicas.
-- p_datos JSON: {idalumno, idfisioterapeuta, fecha, motivo_consulta, evaluacion,
--   restricciones_gym, indicaciones_casa, evolucion, proxima_cita,
--   zonas:[{zona, nivel_dolor}], tecnicas:[idtecnica,...]}
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_sesion_fisioterapia_crear $$
CREATE PROCEDURE sp_sesion_fisioterapia_crear(IN p_datos JSON)
BEGIN
  DECLARE v_id INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  IF JSON_LENGTH(p_datos, '$.zonas') IS NULL OR JSON_LENGTH(p_datos, '$.zonas') = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Selecciona al menos una zona corporal';
  END IF;
  START TRANSACTION;
    INSERT INTO sesiones_fisioterapia (idalumno, idfisioterapeuta, fecha, hora, motivo_consulta, evaluacion, rango_movimiento,
                                       pruebas_funcionales, restricciones_gym, indicaciones_casa, evolucion, proxima_cita)
    VALUES (JSON_VALUE(p_datos, '$.idalumno'), JSON_VALUE(p_datos, '$.idfisioterapeuta'),
            IFNULL(JSON_VALUE(p_datos, '$.fecha' RETURNING DATE), CURDATE()),
            IFNULL(JSON_VALUE(p_datos, '$.hora' RETURNING TIME), CURTIME()),
            JSON_UNQUOTE(JSON_EXTRACT(p_datos, '$.motivo_consulta')),
            JSON_VALUE(p_datos, '$.evaluacion'), JSON_VALUE(p_datos, '$.rango_movimiento'),
            JSON_VALUE(p_datos, '$.pruebas_funcionales'), JSON_VALUE(p_datos, '$.restricciones_gym'),
            JSON_VALUE(p_datos, '$.indicaciones_casa'), JSON_VALUE(p_datos, '$.evolucion'),
            JSON_VALUE(p_datos, '$.proxima_cita' RETURNING DATE));
    SET v_id = LAST_INSERT_ID();

    INSERT INTO sesion_zonas (idsesion_fisioterapia, zona, nivel_dolor)
    SELECT v_id, j.zona, j.nivel_dolor
      FROM JSON_TABLE(p_datos, '$.zonas[*]' COLUMNS (zona VARCHAR(20) PATH '$.zona', nivel_dolor TINYINT PATH '$.nivel_dolor')) j;

    INSERT INTO sesion_tecnicas (idsesion_fisioterapia, idtecnica)
    SELECT v_id, j.idtecnica
      FROM JSON_TABLE(p_datos, '$.tecnicas[*]' COLUMNS (idtecnica INT PATH '$')) j;
  COMMIT;
  SELECT idsesion_fisioterapia, numero_sesion FROM sesiones_fisioterapia WHERE idsesion_fisioterapia = v_id;
END $$

-- ---------------------------------------------------------------------
-- Indicadores del panel principal
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_panel_resumen $$
CREATE PROCEDURE sp_panel_resumen()
BEGIN
  SELECT
    (SELECT COUNT(DISTINCT idalumno) FROM matriculas WHERE estado = 'activa' AND fecha_fin >= CURDATE()) AS alumnos_activos,
    (SELECT COUNT(*) FROM matriculas WHERE estado = 'activa' AND fecha_fin BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AS por_vencer,
    (SELECT COUNT(*) FROM asistencias_alumno WHERE fecha = CURDATE()) AS asistencias_hoy,
    (SELECT COUNT(*) FROM asistencias_empleado WHERE fecha = CURDATE() AND estado IN ('puntual','tarde')) AS personal_presente,
    (SELECT IFNULL(SUM(monto),0) FROM movimientos_caja WHERE tipo = 'ingreso' AND DATE(fecha) = CURDATE()) AS ingresos_hoy,
    (SELECT IFNULL(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE -monto END),0) FROM movimientos_caja
      WHERE YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())) AS balance_mes,
    (SELECT COUNT(*) FROM citas WHERE fecha = CURDATE() AND estado = 'programada') AS citas_hoy,
    (SELECT COUNT(*) FROM productos WHERE activo = 1 AND stock <= stock_minimo) AS productos_stock_bajo;

  SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes,
         SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END) AS ingresos,
         SUM(CASE WHEN tipo='egreso'  THEN monto ELSE 0 END) AS egresos
    FROM movimientos_caja
   WHERE fecha >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 5 MONTH)
   GROUP BY mes ORDER BY mes;
END $$

-- ---------------------------------------------------------------------
-- Portal del alumno: plan vigente, dieta activa, última medida, citas
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_alumno_portal $$
CREATE PROCEDURE sp_alumno_portal(IN p_idalumno INT)
BEGIN
  SELECT a.idalumno, a.nombres, a.apellidos, a.dni, a.objetivo, a.foto,
         p.nombre AS plan, p.incluye_entrenador, p.incluye_nutricion,
         m.fecha_inicio, m.fecha_fin, DATEDIFF(m.fecha_fin, CURDATE()) AS dias_restantes, m.estado,
         pr.nombre AS programa, CONCAT(e.nombres, ' ', e.apellidos) AS entrenador
    FROM alumnos a
    LEFT JOIN matriculas m ON m.idmatricula = (SELECT MAX(idmatricula) FROM matriculas WHERE idalumno = a.idalumno AND estado <> 'anulada')
    LEFT JOIN planes p ON p.idplan = m.idplan
    LEFT JOIN programas_entrenamiento pr ON pr.idprograma = m.idprograma
    LEFT JOIN empleados e ON e.idempleado = m.identrenador
   WHERE a.idalumno = p_idalumno;

  SELECT COUNT(*) AS asistencias_mes FROM asistencias_alumno
   WHERE idalumno = p_idalumno AND YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE());

  SELECT c.idcita, c.servicio, c.fecha, c.hora_inicio, c.estado, CONCAT(e.nombres, ' ', e.apellidos) AS profesional
    FROM citas c JOIN empleados e ON e.idempleado = c.idempleado
   WHERE c.idalumno = p_idalumno AND c.fecha >= CURDATE() AND c.estado = 'programada'
   ORDER BY c.fecha, c.hora_inicio LIMIT 5;
END $$

-- ---------------------------------------------------------------------
-- Resumen de caja por rango de fechas
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_caja_resumen $$
CREATE PROCEDURE sp_caja_resumen(IN p_desde DATE, IN p_hasta DATE)
BEGIN
  SELECT categoria, tipo, COUNT(*) AS operaciones, SUM(monto) AS total
    FROM movimientos_caja
   WHERE DATE(fecha) BETWEEN p_desde AND p_hasta
   GROUP BY categoria, tipo ORDER BY tipo, total DESC;
END $$

DELIMITER ;
