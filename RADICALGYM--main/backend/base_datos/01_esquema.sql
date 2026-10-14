-- =====================================================================
-- RADICAL GYM - Esquema de base de datos (MySQL 8+)
-- Todas las tablas y columnas en español. Sin vistas.
-- Alumnos y empleados inician su numeración en 1000.
-- =====================================================================

DROP DATABASE IF EXISTS radicalgym;
CREATE DATABASE radicalgym CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;
USE radicalgym;

-- ---------------------------------------------------------------------
-- Catálogos
-- ---------------------------------------------------------------------
CREATE TABLE planes (
  idplan            INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(80)   NOT NULL UNIQUE,
  duracion_meses    TINYINT       NOT NULL,
  duracion_dias     SMALLINT      NOT NULL DEFAULT 0 COMMENT 'Solo para planes de días (pase diario, semanal)',
  precio            DECIMAL(10,2) NOT NULL,
  incluye_entrenador TINYINT(1)   NOT NULL DEFAULT 0,
  incluye_nutricion  TINYINT(1)   NOT NULL DEFAULT 0,
  descripcion       VARCHAR(255)  NULL,
  caracteristicas   VARCHAR(600)  NULL COMMENT 'Lista separada por |',
  destacado         TINYINT(1)    NOT NULL DEFAULT 0,
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  CONSTRAINT chk_planes_precio CHECK (precio >= 0),
  CONSTRAINT chk_planes_duracion CHECK (duracion_meses > 0 OR duracion_dias > 0)
) ENGINE=InnoDB;

CREATE TABLE empleados (
  idempleado        INT AUTO_INCREMENT PRIMARY KEY,
  dni               CHAR(8)       NULL UNIQUE,
  nombres           VARCHAR(80)   NOT NULL,
  apellidos         VARCHAR(80)   NOT NULL,
  sexo              ENUM('M','F') NOT NULL DEFAULT 'M',
  telefono          VARCHAR(15)   NULL,
  correo            VARCHAR(120)  NULL UNIQUE,
  cargo             ENUM('administrador','entrenador','recepcion','nutricionista','fisioterapeuta','mantenimiento') NOT NULL,
  titulo_cargo      VARCHAR(120)  NULL,
  especialidad      VARCHAR(120)  NULL,
  biografia         VARCHAR(500)  NULL,
  calificacion      DECIMAL(2,1)  NOT NULL DEFAULT 5.0,
  horario_disponible VARCHAR(200) NULL,
  cuenta_bancaria   VARCHAR(40)   NULL,
  foto              VARCHAR(200)  NULL,
  fecha_ingreso     DATE          NOT NULL,
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  INDEX idx_empleados_cargo (cargo)
) ENGINE=InnoDB AUTO_INCREMENT=1000;

CREATE TABLE programas_entrenamiento (
  idprograma        INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(100)  NOT NULL UNIQUE,
  objetivo          ENUM('hipertrofia','perdida_peso','fuerza','resistencia','tonificacion','rehabilitacion') NOT NULL,
  nivel             ENUM('principiante','intermedio','avanzado') NOT NULL,
  identrenador      INT           NULL,
  descripcion       VARCHAR(255)  NULL,
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  CONSTRAINT fk_programas_entrenador FOREIGN KEY (identrenador) REFERENCES empleados(idempleado)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Alumnos y matrículas
-- ---------------------------------------------------------------------
CREATE TABLE alumnos (
  idalumno          INT AUTO_INCREMENT PRIMARY KEY,
  dni               CHAR(8)       NOT NULL UNIQUE,
  nombres           VARCHAR(80)   NOT NULL,
  apellidos         VARCHAR(80)   NOT NULL,
  sexo              ENUM('M','F','O') NOT NULL,
  fecha_nacimiento  DATE          NULL,
  telefono          VARCHAR(15)   NULL,
  correo            VARCHAR(120)  NULL UNIQUE,
  contacto_emergencia VARCHAR(120) NULL,
  telefono_emergencia VARCHAR(15)  NULL,
  parentesco_emergencia VARCHAR(40) NULL,
  restricciones_medicas VARCHAR(255) NULL,
  objetivo          ENUM('hipertrofia','perdida_peso','fuerza','resistencia','tonificacion','rehabilitacion') NOT NULL DEFAULT 'tonificacion',
  idrutina          INT           NULL COMMENT 'Rutina asignada (FK al final del script)',
  notas             VARCHAR(300)  NULL,
  foto              VARCHAR(200)  NULL,
  fecha_registro    DATE          NOT NULL,
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  INDEX idx_alumnos_sexo (sexo),
  INDEX idx_alumnos_nombre (apellidos, nombres)
) ENGINE=InnoDB AUTO_INCREMENT=1000;

CREATE TABLE matriculas (
  idmatricula       INT AUTO_INCREMENT PRIMARY KEY,
  idalumno          INT           NOT NULL,
  idplan            INT           NOT NULL,
  idprograma        INT           NULL,
  identrenador      INT           NULL,
  fecha_inicio      DATE          NOT NULL,
  fecha_fin         DATE          NOT NULL,
  monto             DECIMAL(10,2) NOT NULL,
  metodo_pago       ENUM('efectivo','tarjeta','transferencia','yape_plin') NOT NULL DEFAULT 'efectivo',
  estado            ENUM('activa','vencida','congelada','anulada') NOT NULL DEFAULT 'activa',
  fecha_registro    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_matriculas_alumno     FOREIGN KEY (idalumno)     REFERENCES alumnos(idalumno),
  CONSTRAINT fk_matriculas_plan       FOREIGN KEY (idplan)       REFERENCES planes(idplan),
  CONSTRAINT fk_matriculas_programa   FOREIGN KEY (idprograma)   REFERENCES programas_entrenamiento(idprograma),
  CONSTRAINT fk_matriculas_entrenador FOREIGN KEY (identrenador) REFERENCES empleados(idempleado),
  INDEX idx_matriculas_estado (estado, fecha_fin)
) ENGINE=InnoDB;

CREATE TABLE asistencias_alumno (
  idasistencia_alumno INT AUTO_INCREMENT PRIMARY KEY,
  idalumno          INT           NOT NULL,
  fecha             DATE          NOT NULL,
  hora_entrada      TIME          NOT NULL,
  tipo              ENUM('entrada','salida') NOT NULL DEFAULT 'entrada',
  metodo            ENUM('qr_app','dni_manual','codigo_barras','pase_rapido') NOT NULL DEFAULT 'dni_manual',
  notas             VARCHAR(200)  NULL,
  CONSTRAINT fk_asis_alumno FOREIGN KEY (idalumno) REFERENCES alumnos(idalumno),
  INDEX idx_asis_alumno_dia (idalumno, fecha)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Personal: contratos, horarios, asistencia y permisos
-- ---------------------------------------------------------------------
CREATE TABLE contratos (
  idcontrato        INT AUTO_INCREMENT PRIMARY KEY,
  idempleado        INT           NOT NULL,
  tipo              ENUM('3_meses','6_meses','1_anio','indefinido') NOT NULL,
  modalidad         ENUM('tiempo_completo','medio_tiempo','por_horas') NOT NULL,
  fecha_inicio      DATE          NOT NULL,
  fecha_fin         DATE          NULL,
  sueldo_mensual    DECIMAL(10,2) NOT NULL DEFAULT 0,
  tarifa_hora       DECIMAL(10,2) NOT NULL DEFAULT 0,
  horas_semanales   TINYINT       NOT NULL,
  documento         VARCHAR(200)  NULL,
  notas             VARCHAR(300)  NULL,
  estado            ENUM('vigente','por_vencer','vencido','renovado') NOT NULL DEFAULT 'vigente',
  CONSTRAINT fk_contratos_empleado FOREIGN KEY (idempleado) REFERENCES empleados(idempleado)
) ENGINE=InnoDB;

CREATE TABLE horarios_empleado (
  idhorario         INT AUTO_INCREMENT PRIMARY KEY,
  idempleado        INT           NOT NULL,
  dia_semana        TINYINT       NOT NULL COMMENT '1=lunes ... 7=domingo',
  hora_inicio       TIME          NOT NULL,
  hora_fin          TIME          NOT NULL,
  CONSTRAINT fk_horarios_empleado FOREIGN KEY (idempleado) REFERENCES empleados(idempleado),
  CONSTRAINT chk_horario_dia  CHECK (dia_semana BETWEEN 1 AND 7),
  CONSTRAINT chk_horario_hora CHECK (hora_fin > hora_inicio)
) ENGINE=InnoDB;

CREATE TABLE asistencias_empleado (
  idasistencia_empleado INT AUTO_INCREMENT PRIMARY KEY,
  idempleado        INT           NOT NULL,
  fecha             DATE          NOT NULL,
  hora_entrada      TIME          NULL,
  hora_salida       TIME          NULL,
  estado            ENUM('puntual','tarde','falta','permiso') NOT NULL DEFAULT 'puntual',
  horas_trabajadas  DECIMAL(5,2)  NOT NULL DEFAULT 0,
  observacion       VARCHAR(200)  NULL,
  metodo            ENUM('qr_app','dni_manual','codigo_barras','pase_rapido') NOT NULL DEFAULT 'dni_manual',
  CONSTRAINT fk_asis_empleado FOREIGN KEY (idempleado) REFERENCES empleados(idempleado),
  UNIQUE KEY uq_asis_empleado_dia (idempleado, fecha)
) ENGINE=InnoDB;

CREATE TABLE permisos (
  idpermiso         INT AUTO_INCREMENT PRIMARY KEY,
  idempleado        INT           NOT NULL,
  tipo              ENUM('personal','salud','vacaciones','capacitacion') NOT NULL,
  fecha_inicio      DATE          NOT NULL,
  fecha_fin         DATE          NOT NULL,
  motivo            VARCHAR(255)  NOT NULL,
  sustento          VARCHAR(160)  NULL,
  estado            ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  fecha_solicitud   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_permisos_empleado FOREIGN KEY (idempleado) REFERENCES empleados(idempleado),
  CONSTRAINT chk_permiso_fechas CHECK (fecha_fin >= fecha_inicio)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Citas de nutrición y fisioterapia
-- ---------------------------------------------------------------------
CREATE TABLE citas (
  idcita            INT AUTO_INCREMENT PRIMARY KEY,
  servicio          ENUM('nutricion','fisioterapia') NOT NULL,
  idalumno          INT           NOT NULL,
  idempleado        INT           NOT NULL,
  fecha             DATE          NOT NULL,
  hora_inicio       TIME          NOT NULL,
  hora_fin          TIME          NOT NULL,
  motivo            VARCHAR(200)  NULL,
  consultorio       VARCHAR(60)   NULL,
  notas             VARCHAR(255)  NULL,
  recordatorio_enviado TINYINT(1) NOT NULL DEFAULT 0,
  estado            ENUM('programada','confirmada','atendiendo','atendida','pospuesta','falta','cancelada') NOT NULL DEFAULT 'programada',
  CONSTRAINT fk_citas_alumno   FOREIGN KEY (idalumno)   REFERENCES alumnos(idalumno),
  CONSTRAINT fk_citas_empleado FOREIGN KEY (idempleado) REFERENCES empleados(idempleado),
  INDEX idx_citas_agenda (idempleado, fecha, hora_inicio)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Nutrición: dietas y medidas
-- ---------------------------------------------------------------------
CREATE TABLE alimentos (
  idalimento        INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(80)   NOT NULL UNIQUE,
  kcal_100g         DECIMAL(6,1)  NOT NULL
) ENGINE=InnoDB;

CREATE TABLE dietas (
  iddieta           INT AUTO_INCREMENT PRIMARY KEY,
  idalumno          INT           NOT NULL,
  idnutricionista   INT           NOT NULL,
  titulo            VARCHAR(120)  NOT NULL,
  objetivo          ENUM('hipertrofia','perdida_peso','fuerza','resistencia','tonificacion','rehabilitacion') NOT NULL,
  calorias_meta     INT           NOT NULL,
  proteinas_g       INT           NOT NULL DEFAULT 0,
  carbohidratos_g   INT           NOT NULL DEFAULT 0,
  grasas_g          INT           NOT NULL DEFAULT 0,
  agua_litros       DECIMAL(3,1)  NOT NULL DEFAULT 2.0,
  comidas_por_dia   TINYINT       NOT NULL DEFAULT 3,
  calorias_totales  INT           NOT NULL DEFAULT 0 COMMENT 'Calculado por trigger',
  recomendaciones   VARCHAR(500)  NULL,
  suplementos       VARCHAR(300)  NULL,
  pautas_hidratacion VARCHAR(300) NULL,
  fecha             DATE          NOT NULL,
  activa            TINYINT(1)    NOT NULL DEFAULT 1,
  CONSTRAINT fk_dietas_alumno        FOREIGN KEY (idalumno)        REFERENCES alumnos(idalumno),
  CONSTRAINT fk_dietas_nutricionista FOREIGN KEY (idnutricionista) REFERENCES empleados(idempleado),
  CONSTRAINT chk_dietas_comidas CHECK (comidas_por_dia BETWEEN 1 AND 8)
) ENGINE=InnoDB;

CREATE TABLE dieta_comidas (
  iddieta_comida    INT AUTO_INCREMENT PRIMARY KEY,
  iddieta           INT           NOT NULL,
  orden             TINYINT       NOT NULL,
  nombre            VARCHAR(60)   NOT NULL,
  hora              TIME          NULL,
  CONSTRAINT fk_comidas_dieta FOREIGN KEY (iddieta) REFERENCES dietas(iddieta) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE dieta_alimentos (
  iddieta_alimento  INT AUTO_INCREMENT PRIMARY KEY,
  iddieta_comida    INT           NOT NULL,
  alimento          VARCHAR(80)   NOT NULL,
  gramos            DECIMAL(6,1)  NOT NULL,
  kilocalorias      DECIMAL(7,1)  NULL COMMENT 'Si llega vacío el trigger lo calcula con el catálogo de alimentos',
  proteinas_g       DECIMAL(6,1)  NOT NULL DEFAULT 0,
  carbohidratos_g   DECIMAL(6,1)  NOT NULL DEFAULT 0,
  grasas_g          DECIMAL(6,1)  NOT NULL DEFAULT 0,
  CONSTRAINT fk_alimentos_comida FOREIGN KEY (iddieta_comida) REFERENCES dieta_comidas(iddieta_comida) ON DELETE CASCADE,
  CONSTRAINT chk_alimentos_gramos CHECK (gramos > 0)
) ENGINE=InnoDB;

CREATE TABLE medidas (
  idmedida          INT AUTO_INCREMENT PRIMARY KEY,
  idalumno          INT           NOT NULL,
  idevaluador       INT           NOT NULL,
  fecha             DATE          NOT NULL,
  hora              TIME          NULL,
  peso_kg           DECIMAL(5,2)  NOT NULL,
  talla_cm          DECIMAL(5,1)  NOT NULL,
  imc               DECIMAL(5,2)  NULL COMMENT 'Calculado por trigger',
  clasificacion_imc VARCHAR(20)   NULL COMMENT 'Calculado por trigger',
  cuello            DECIMAL(5,1)  NULL,
  hombros           DECIMAL(5,1)  NULL,
  pecho             DECIMAL(5,1)  NULL,
  cintura           DECIMAL(5,1)  NOT NULL,
  abdomen           DECIMAL(5,1)  NULL,
  cadera            DECIMAL(5,1)  NOT NULL,
  indice_cintura_cadera DECIMAL(4,2) NULL COMMENT 'Calculado por trigger',
  biceps_relajado_der   DECIMAL(5,1) NULL,
  biceps_relajado_izq   DECIMAL(5,1) NULL,
  biceps_contraido_der  DECIMAL(5,1) NULL,
  biceps_contraido_izq  DECIMAL(5,1) NULL,
  antebrazo_der     DECIMAL(5,1)  NULL,
  antebrazo_izq     DECIMAL(5,1)  NULL,
  muslo_der         DECIMAL(5,1)  NULL,
  muslo_izq         DECIMAL(5,1)  NULL,
  pantorrilla_der   DECIMAL(5,1)  NULL,
  pantorrilla_izq   DECIMAL(5,1)  NULL,
  grasa_porcentaje  DECIMAL(4,1)  NULL,
  masa_muscular_kg  DECIMAL(5,2)  NULL,
  grasa_visceral    TINYINT       NULL,
  agua_porcentaje   DECIMAL(4,1)  NULL,
  metabolismo_basal INT           NULL,
  edad_metabolica   TINYINT       NULL,
  masa_osea_kg      DECIMAL(4,2)  NULL,
  puntuacion_fisica TINYINT       NULL,
  pliegue_triceps   DECIMAL(4,1)  NULL,
  pliegue_subescapular DECIMAL(4,1) NULL,
  pliegue_suprailiaco DECIMAL(4,1) NULL,
  pliegue_abdominal DECIMAL(4,1)  NULL,
  pliegue_muslo     DECIMAL(4,1)  NULL,
  pliegue_pantorrilla DECIMAL(4,1) NULL,
  observaciones     VARCHAR(300)  NULL,
  notas_objetivo    VARCHAR(300)  NULL,
  CONSTRAINT fk_medidas_alumno    FOREIGN KEY (idalumno)    REFERENCES alumnos(idalumno),
  CONSTRAINT fk_medidas_evaluador FOREIGN KEY (idevaluador) REFERENCES empleados(idempleado),
  INDEX idx_medidas_alumno (idalumno, fecha)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Fisioterapia
-- ---------------------------------------------------------------------
CREATE TABLE tecnicas_fisioterapia (
  idtecnica         INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(100)  NOT NULL UNIQUE,
  descripcion       VARCHAR(255)  NULL,
  activo            TINYINT(1)    NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE sesiones_fisioterapia (
  idsesion_fisioterapia INT AUTO_INCREMENT PRIMARY KEY,
  idalumno          INT           NOT NULL,
  idfisioterapeuta  INT           NOT NULL,
  fecha             DATE          NOT NULL,
  hora              TIME          NULL,
  numero_sesion     SMALLINT      NOT NULL DEFAULT 1 COMMENT 'Calculado por trigger',
  motivo_consulta   VARCHAR(255)  NOT NULL,
  evaluacion        VARCHAR(500)  NULL COMMENT 'Evaluación postural y biomecánica',
  rango_movimiento  VARCHAR(300)  NULL,
  pruebas_funcionales VARCHAR(300) NULL,
  restricciones_gym VARCHAR(300)  NULL,
  indicaciones_casa VARCHAR(300)  NULL,
  evolucion         VARCHAR(300)  NULL,
  proxima_cita      DATE          NULL,
  CONSTRAINT fk_fisio_alumno        FOREIGN KEY (idalumno)         REFERENCES alumnos(idalumno),
  CONSTRAINT fk_fisio_fisioterapeuta FOREIGN KEY (idfisioterapeuta) REFERENCES empleados(idempleado)
) ENGINE=InnoDB;

CREATE TABLE sesion_zonas (
  idsesion_zona     INT AUTO_INCREMENT PRIMARY KEY,
  idsesion_fisioterapia INT       NOT NULL,
  zona              ENUM('cervical','hombro','columna_dorsal','lumbar','cadera','rodilla','tobillo_pie','codo_muneca','muscular_general') NOT NULL,
  nivel_dolor       TINYINT       NOT NULL COMMENT 'Escala EVA 0-10',
  CONSTRAINT fk_zonas_sesion FOREIGN KEY (idsesion_fisioterapia) REFERENCES sesiones_fisioterapia(idsesion_fisioterapia) ON DELETE CASCADE,
  CONSTRAINT chk_zonas_dolor CHECK (nivel_dolor BETWEEN 0 AND 10),
  UNIQUE KEY uq_sesion_zona (idsesion_fisioterapia, zona)
) ENGINE=InnoDB;

CREATE TABLE sesion_tecnicas (
  idsesion_tecnica  INT AUTO_INCREMENT PRIMARY KEY,
  idsesion_fisioterapia INT       NOT NULL,
  idtecnica         INT           NOT NULL,
  CONSTRAINT fk_st_sesion  FOREIGN KEY (idsesion_fisioterapia) REFERENCES sesiones_fisioterapia(idsesion_fisioterapia) ON DELETE CASCADE,
  CONSTRAINT fk_st_tecnica FOREIGN KEY (idtecnica) REFERENCES tecnicas_fisioterapia(idtecnica),
  UNIQUE KEY uq_sesion_tecnica (idsesion_fisioterapia, idtecnica)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Ventas y caja
-- ---------------------------------------------------------------------
CREATE TABLE productos (
  idproducto        INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(100)  NOT NULL UNIQUE,
  categoria         ENUM('bebidas','suplementos','snacks','accesorios','ropa') NOT NULL,
  precio_compra     DECIMAL(10,2) NOT NULL,
  precio_venta      DECIMAL(10,2) NOT NULL,
  stock             INT           NOT NULL DEFAULT 0,
  stock_minimo      INT           NOT NULL DEFAULT 5,
  marca             VARCHAR(60)   NULL,
  codigo_barras     VARCHAR(40)   NULL,
  descripcion       VARCHAR(300)  NULL,
  imagen            VARCHAR(300)  NULL COMMENT 'Ruta en uploads/productos o URL externa',
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  CONSTRAINT chk_productos_stock CHECK (stock >= 0)
) ENGINE=InnoDB;

CREATE TABLE ventas (
  idventa           INT AUTO_INCREMENT PRIMARY KEY,
  idalumno          INT           NULL,
  idempleado        INT           NOT NULL COMMENT 'Quien registró la venta',
  fecha             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metodo_pago       ENUM('efectivo','tarjeta','transferencia','yape_plin') NOT NULL,
  total             DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Acumulado por trigger',
  comprobante       VARCHAR(20)   NULL,
  CONSTRAINT fk_ventas_alumno   FOREIGN KEY (idalumno)   REFERENCES alumnos(idalumno),
  CONSTRAINT fk_ventas_empleado FOREIGN KEY (idempleado) REFERENCES empleados(idempleado)
) ENGINE=InnoDB;

CREATE TABLE venta_detalle (
  idventa_detalle   INT AUTO_INCREMENT PRIMARY KEY,
  idventa           INT           NOT NULL,
  idproducto        INT           NOT NULL,
  cantidad          INT           NOT NULL,
  precio_unitario   DECIMAL(10,2) NOT NULL,
  subtotal          DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_detalle_venta    FOREIGN KEY (idventa)    REFERENCES ventas(idventa) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto FOREIGN KEY (idproducto) REFERENCES productos(idproducto),
  CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB;

CREATE TABLE movimientos_caja (
  idmovimiento      INT AUTO_INCREMENT PRIMARY KEY,
  tipo              ENUM('ingreso','egreso') NOT NULL,
  categoria         ENUM('matricula','venta','spinning','entrenamiento_personal','insumos','sueldo','planilla',
                         'mantenimiento','servicios','alquiler','marketing','averia_equipo','gasto_libre','otros') NOT NULL,
  monto             DECIMAL(10,2) NOT NULL,
  descripcion       VARCHAR(255)  NOT NULL,
  metodo_pago       ENUM('efectivo','tarjeta','transferencia','yape_plin') NOT NULL DEFAULT 'efectivo',
  comprobante       VARCHAR(30)   NULL,
  idreferencia      INT           NULL COMMENT 'idmatricula, idventa, idplanilla, etc. según categoría',
  idalumno          INT           NULL,
  nombre_relacionado VARCHAR(120) NULL,
  idempleado        INT           NULL,
  descuento_tardanza DECIMAL(10,2) NULL,
  equipo            VARCHAR(100)  NULL,
  detalle_averia    VARCHAR(255)  NULL,
  adjunto           VARCHAR(200)  NULL,
  adjunto_nombre    VARCHAR(120)  NULL,
  comentario        VARCHAR(255)  NULL,
  fecha             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mov_fecha (fecha)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Notificaciones, usuarios y auditoría
-- ---------------------------------------------------------------------
CREATE TABLE notificaciones (
  idnotificacion    INT AUTO_INCREMENT PRIMARY KEY,
  titulo            VARCHAR(120)  NOT NULL,
  mensaje           VARCHAR(500)  NOT NULL,
  destino           ENUM('todos','alumnos','personal','alumno') NOT NULL DEFAULT 'todos',
  idalumno          INT           NULL,
  tipo              ENUM('vencimiento','aviso','promocion','cumpleanos','clase') NOT NULL DEFAULT 'aviso',
  canal             ENUM('push','correo','whatsapp','sms') NOT NULL DEFAULT 'push',
  estado_envio      ENUM('enviado','entregado','leido','programado') NOT NULL DEFAULT 'entregado',
  destinatario_nombre VARCHAR(120) NULL,
  destinatario_correo VARCHAR(120) NULL,
  destinatario_telefono VARCHAR(20) NULL,
  publico           VARCHAR(40)   NULL,
  fecha             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  leida             TINYINT(1)    NOT NULL DEFAULT 0,
  CONSTRAINT fk_notif_alumno FOREIGN KEY (idalumno) REFERENCES alumnos(idalumno)
) ENGINE=InnoDB;

CREATE TABLE usuarios (
  idusuario         INT AUTO_INCREMENT PRIMARY KEY,
  usuario           VARCHAR(40)   NOT NULL UNIQUE,
  clave             VARCHAR(255)  NOT NULL,
  rol               ENUM('administrador','recepcion','entrenador','nutricionista','fisioterapeuta','alumno') NOT NULL,
  idempleado        INT           NULL UNIQUE,
  idalumno          INT           NULL UNIQUE,
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  ultimo_acceso     DATETIME      NULL,
  CONSTRAINT fk_usuarios_empleado FOREIGN KEY (idempleado) REFERENCES empleados(idempleado),
  CONSTRAINT fk_usuarios_alumno   FOREIGN KEY (idalumno)   REFERENCES alumnos(idalumno)
) ENGINE=InnoDB;

CREATE TABLE auditoria (
  idauditoria       BIGINT AUTO_INCREMENT PRIMARY KEY,
  tabla             VARCHAR(40)   NOT NULL,
  accion            ENUM('insertar','actualizar','eliminar') NOT NULL,
  idregistro        INT           NOT NULL,
  detalle           VARCHAR(255)  NULL,
  fecha             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Ejercicios y rutinas de entrenamiento
-- ---------------------------------------------------------------------
CREATE TABLE ejercicios (
  idejercicio       INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(120)  NOT NULL UNIQUE,
  grupo_muscular    ENUM('pecho','espalda','cuadriceps','isquiotibiales_gluteos','hombros','biceps','triceps','core_abdomen','cardio_funcional') NOT NULL,
  musculos_secundarios VARCHAR(200) NULL COMMENT 'Lista separada por |',
  equipo            ENUM('mancuernas','barra','maquina','polea','peso_corporal','kettlebell','otro') NOT NULL,
  dificultad        ENUM('principiante','intermedio','avanzado') NOT NULL,
  instrucciones     VARCHAR(1000) NULL,
  consejos          VARCHAR(500)  NULL,
  series_repeticiones VARCHAR(40) NULL,
  video_url         VARCHAR(300)  NULL,
  miniatura_url     VARCHAR(300)  NULL,
  activo            TINYINT(1)    NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE rutinas (
  idrutina          INT AUTO_INCREMENT PRIMARY KEY,
  titulo            VARCHAR(150)  NOT NULL,
  descripcion       VARCHAR(500)  NULL,
  nivel             ENUM('principiante','intermedio','avanzado') NOT NULL,
  objetivo          ENUM('hipertrofia','perdida_peso','fuerza','resistencia','tonificacion','rehabilitacion') NOT NULL,
  identrenador      INT           NULL,
  idalumno          INT           NULL COMMENT 'Alumno para quien se diseñó (opcional)',
  fecha             DATE          NOT NULL,
  CONSTRAINT fk_rutinas_entrenador FOREIGN KEY (identrenador) REFERENCES empleados(idempleado),
  CONSTRAINT fk_rutinas_alumno     FOREIGN KEY (idalumno)     REFERENCES alumnos(idalumno)
) ENGINE=InnoDB;

CREATE TABLE rutina_dias (
  idrutina_dia      INT AUTO_INCREMENT PRIMARY KEY,
  idrutina          INT           NOT NULL,
  orden             TINYINT       NOT NULL,
  nombre            VARCHAR(120)  NOT NULL,
  enfoque           VARCHAR(120)  NULL,
  notas             VARCHAR(300)  NULL,
  CONSTRAINT fk_dias_rutina FOREIGN KEY (idrutina) REFERENCES rutinas(idrutina) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE rutina_ejercicios (
  idrutina_ejercicio INT AUTO_INCREMENT PRIMARY KEY,
  idrutina_dia      INT           NOT NULL,
  idejercicio       INT           NOT NULL,
  orden             TINYINT       NOT NULL DEFAULT 1,
  series            TINYINT       NOT NULL,
  repeticiones      VARCHAR(20)   NOT NULL,
  rir               VARCHAR(10)   NULL,
  descanso_seg      SMALLINT      NOT NULL DEFAULT 60,
  notas             VARCHAR(200)  NULL,
  CONSTRAINT fk_re_dia       FOREIGN KEY (idrutina_dia) REFERENCES rutina_dias(idrutina_dia) ON DELETE CASCADE,
  CONSTRAINT fk_re_ejercicio FOREIGN KEY (idejercicio)  REFERENCES ejercicios(idejercicio)
) ENGINE=InnoDB;

ALTER TABLE alumnos ADD CONSTRAINT fk_alumnos_rutina FOREIGN KEY (idrutina) REFERENCES rutinas(idrutina) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- Salón de spinning
-- ---------------------------------------------------------------------
CREATE TABLE bicicletas_spinning (
  idbicicleta       INT AUTO_INCREMENT PRIMARY KEY,
  numero            TINYINT       NOT NULL UNIQUE,
  fila              TINYINT       NOT NULL,
  columna           TINYINT       NOT NULL,
  zona              ENUM('frontal','central','trasera_elevada','lateral') NOT NULL,
  modelo            VARCHAR(80)   NOT NULL,
  correas           TINYINT(1)    NOT NULL DEFAULT 1,
  calas_spd         TINYINT(1)    NOT NULL DEFAULT 0,
  notas             VARCHAR(200)  NULL COMMENT 'Con nota = en mantenimiento'
) ENGINE=InnoDB;

CREATE TABLE sesiones_spinning (
  idsesion_spinning INT AUTO_INCREMENT PRIMARY KEY,
  titulo            VARCHAR(150)  NOT NULL,
  idinstructor      INT           NOT NULL,
  fecha             DATE          NOT NULL,
  hora_inicio       TIME          NOT NULL,
  hora_fin          TIME          NOT NULL,
  intensidad        ENUM('moderada','alta','extrema') NOT NULL,
  genero_musical    VARCHAR(80)   NULL,
  capacidad         TINYINT       NOT NULL DEFAULT 24,
  sala              VARCHAR(80)   NOT NULL,
  precio_externo    DECIMAL(8,2)  NULL,
  CONSTRAINT fk_spin_instructor FOREIGN KEY (idinstructor) REFERENCES empleados(idempleado),
  CONSTRAINT chk_spin_horas CHECK (hora_fin > hora_inicio)
) ENGINE=InnoDB;

CREATE TABLE reservas_spinning (
  idreserva_spinning INT AUTO_INCREMENT PRIMARY KEY,
  idsesion_spinning INT           NOT NULL,
  numero_bicicleta  TINYINT       NOT NULL,
  idalumno          INT           NULL COMMENT 'NULL si es visitante externo',
  nombre            VARCHAR(120)  NOT NULL,
  telefono          VARCHAR(20)   NULL,
  correo            VARCHAR(120)  NULL,
  estado            ENUM('confirmada','asistio','cancelada') NOT NULL DEFAULT 'confirmada',
  fecha_reserva     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  hora_checkin      DATETIME      NULL,
  calzado           ENUM('calas_spd','zapatilla_comun') NOT NULL DEFAULT 'zapatilla_comun',
  notas             VARCHAR(255)  NULL,
  es_externo        TINYINT(1)    NOT NULL DEFAULT 0,
  monto             DECIMAL(8,2)  NOT NULL DEFAULT 0,
  metodo_pago       ENUM('efectivo','tarjeta','transferencia','yape_plin') NULL,
  comprobante       VARCHAR(30)   NULL,
  codigo_usado      VARCHAR(20)   NULL,
  CONSTRAINT fk_res_sesion FOREIGN KEY (idsesion_spinning) REFERENCES sesiones_spinning(idsesion_spinning) ON DELETE CASCADE,
  CONSTRAINT fk_res_alumno FOREIGN KEY (idalumno) REFERENCES alumnos(idalumno),
  INDEX idx_res_sesion (idsesion_spinning, numero_bicicleta)
) ENGINE=InnoDB;

CREATE TABLE codigos_spinning (
  idcodigo_spinning INT AUTO_INCREMENT PRIMARY KEY,
  codigo            VARCHAR(20)   NOT NULL UNIQUE,
  idsesion_spinning INT           NULL,
  nombre            VARCHAR(120)  NOT NULL,
  telefono          VARCHAR(20)   NULL,
  correo            VARCHAR(120)  NULL,
  idalumno          INT           NULL,
  es_externo        TINYINT(1)    NOT NULL DEFAULT 1,
  monto             DECIMAL(8,2)  NOT NULL DEFAULT 0,
  metodo_pago       ENUM('efectivo','tarjeta','transferencia','yape_plin') NOT NULL,
  estado            ENUM('activo','canjeado','vencido') NOT NULL DEFAULT 'activo',
  fecha_emision     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_canje       DATETIME      NULL,
  bicicleta_canje   TINYINT       NULL,
  emitido_por       VARCHAR(120)  NOT NULL,
  notas             VARCHAR(255)  NULL,
  CONSTRAINT fk_cod_sesion FOREIGN KEY (idsesion_spinning) REFERENCES sesiones_spinning(idsesion_spinning) ON DELETE SET NULL,
  CONSTRAINT fk_cod_alumno FOREIGN KEY (idalumno) REFERENCES alumnos(idalumno)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Planilla, clases y reglas de notificación
-- ---------------------------------------------------------------------
CREATE TABLE planilla (
  idplanilla        INT AUTO_INCREMENT PRIMARY KEY,
  idcontrato        INT           NOT NULL,
  periodo           CHAR(7)       NOT NULL COMMENT 'AAAA-MM',
  sueldo_base       DECIMAL(10,2) NOT NULL,
  horas_trabajadas  DECIMAL(6,2)  NOT NULL DEFAULT 0,
  tarifa_hora       DECIMAL(10,2) NOT NULL DEFAULT 0,
  bonificacion      DECIMAL(10,2) NOT NULL DEFAULT 0,
  descuentos        DECIMAL(10,2) NOT NULL DEFAULT 0,
  neto              DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Calculado por trigger',
  estado            ENUM('pendiente','pagado') NOT NULL DEFAULT 'pendiente',
  fecha_pago        DATE          NULL,
  metodo_pago       ENUM('efectivo','tarjeta','transferencia','yape_plin') NULL,
  comprobante       VARCHAR(30)   NULL,
  CONSTRAINT fk_planilla_contrato FOREIGN KEY (idcontrato) REFERENCES contratos(idcontrato) ON DELETE CASCADE,
  UNIQUE KEY uq_planilla_periodo (idcontrato, periodo)
) ENGINE=InnoDB;

CREATE TABLE clases (
  idclase           INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(120)  NOT NULL,
  instructor        VARCHAR(120)  NOT NULL,
  horario           VARCHAR(60)   NOT NULL,
  sala              VARCHAR(60)   NOT NULL,
  inscritos         SMALLINT      NOT NULL DEFAULT 0,
  capacidad         SMALLINT      NOT NULL DEFAULT 20,
  fecha             DATE          NOT NULL
) ENGINE=InnoDB;

CREATE TABLE reglas_notificacion (
  idregla           INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(120)  NOT NULL,
  categoria         ENUM('vencimiento','clase','promocion','aviso','cumpleanos') NOT NULL,
  activa            TINYINT(1)    NOT NULL DEFAULT 1,
  canales           VARCHAR(60)   NOT NULL COMMENT 'Lista separada por | (push, correo, whatsapp, sms)',
  momento           VARCHAR(80)   NOT NULL,
  dias              SMALLINT      NOT NULL DEFAULT 0,
  titulo_plantilla  VARCHAR(150)  NOT NULL,
  cuerpo_plantilla  VARCHAR(600)  NOT NULL,
  etiqueta          VARCHAR(40)   NULL
) ENGINE=InnoDB;
