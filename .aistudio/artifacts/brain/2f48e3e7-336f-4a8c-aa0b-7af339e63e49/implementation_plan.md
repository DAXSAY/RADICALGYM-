# Plan de Implementación: Plantillas de Evaluación, Seguimiento Evolutivo, Reporte PDF, Ventas con Imágenes y Nutrición Optimizada

Este plan aborda de manera integral las nuevas funcionalidades requeridas en el Centro de Fisioterapia y la optimización transversal de los módulos de Ventas, Nutrición y Medidas Antropométricas.

## Decisiones Críticas y Respuestas del Usuario

> [!IMPORTANT]
> **Decisiones Confirmadas en la Fase de Aclaración:**
> - **Plantillas de Fisioterapia Iniciales:** Se incluirán plantillas preconfiguradas para *Lumbalgia y Cadena Posterior*, *Tendinitis de Muñeca / Túnel Carpiano*, *Esguince de Tobillo & Readaptación*, *Cervicalgia & Sobrecarga de Hombro*, y *Rehabilitación de Rodilla / Ligamentos*, además de un creador de plantillas personalizadas en blanco que permite guardar cualquier combinación de zonas, pruebas ortopédicas y cartilla de ejercicios.
> - **Estructura de Comidas en Nutrición:** Se implementará un editor fila a fila donde el profesional tipea textualmente el alimento/comida y, justo al costado, dispone de un casillero específico para digitar los gramos o peso de la porción, con cálculo instantáneo de calorías y macros.
> - **Imágenes en Módulo de Ventas / POS:** Se habilitará un cargador dual que permite ingresar URL de imagen, previsualización en miniatura y un selector visual de presets de productos fitness (suplementos, hidratación, accesorios).
> - **Sin Redundancia en Medidas:** Se consolida el acceso a las evaluaciones antropométricas bajo el submódulo de *Nutrición & Medidas*, eliminando duplicidades de rutas y unificando los perímetros y bioimpedancia en una sola fuente de verdad.

---

## 1. Visión General del Producto y Valor

- **Para el Fisioterapeuta:** Agilidad extrema al registrar pacientes gracias a las plantillas clínicas de un solo clic. Visualización gráfica del progreso del alumno (reducción del dolor EVA vs. aumento del arco de movilidad ROM en grados). Generación instantánea de una ficha/reporte PDF formal para entregar al paciente o enviar por WhatsApp.
- **Para la Tienda / Recepción:** Catálogo visual enriquecido con imágenes de alta calidad para cada producto en el POS, reduciendo errores de despacho.
- **Para el Nutricionista / Entrenador:** Pautas dietéticas directas y flexibles donde se describe la comida y se fija el gramaje exacto de forma cómoda y sin rodeos.

---

## 2. Experiencia de Usuario y Diseño Visual

### A. Módulo de Fisioterapia: Plantillas & Seguimiento Evolutivo
1. **Selector de Plantillas de Evaluación:**
   - Ubicado en la cabecera del modal de nueva evaluación.
   - Menú desplegable con previsualización rápida de lo que incluye cada protocolo (zonas, pruebas, ejercicios dosificados).
   - Botón *"Guardar configuración actual como nueva plantilla"* y botón *"Cargar plantilla"*.
2. **Dashboard de Seguimiento Evolutivo (Gráfico Comparativo):**
   - Panel interactivo con gráfico de líneas temporal utilizando Recharts:
     - Eje izquierdo: Escala Analógica Visual de Dolor (EVA 0–10 en rojo/rosa).
     - Eje derecho: Rango Articular ROM funcional estimado (0°–180° en azul/cian).
   - Tabla cronológica de hitos con porcentaje de alivio acumulado y estado clínico del alumno.
3. **Reporte Clínico en PDF:**
   - Botón de descarga/impresión directa en PDF optimizado para papel A4 y vista digital.
   - Encabezado formal con membrete del centro, datos del alumno, diagnóstico, mapa anatómico de zonas afectadas marcadas, silueta postural, pruebas ortopédicas y cartilla ilustrada de ejercicios.

### B. Módulo de Ventas (Store / POS) con Imágenes
1. **Tarjetas de Producto con Miniatura Visual:**
   - Imagen nítida del producto con fallback elegante a icono temático según la categoría.
   - Modal de nuevo producto con campo de imagen (URL, selección rápida entre imágenes de fitness y previsualización antes de guardar).
2. **Terminal POS Fluido:**
   - Carrito con miniaturas de los productos agregados y cálculo automático de total e inventario.

### C. Módulo de Nutrición: Alimento + Casillero de Gramaje
1. **Editor Fila por Fila de Comidas:**
   - Cada comida (Desayuno, Almuerzo, Merienda, Cena) muestra una tabla editable:
     - `[ Campo de texto libre para el alimento ]` + `[ Casillero numérico de gramos / porción ]` + `[ Selector / cálculo de kcal ]` + `[ Botón eliminar fila ]`.
   - Botón rápido `+ Agregar Alimento` para añadir tantas filas como sea necesario.

### D. Medidas Antropométricas sin Redundancia
1. Limpieza de accesos duplicados entre tabs.
2. Presentación clara de perímetros corporales y bioimpedancia sin métricas repetidas.

---

## 3. Arquitectura Técnica y Modelo de Datos

```
┌────────────────────────────────────────────────────────────────────────┐
│                          GymContext Store                              │
│  - physioRecords & physioTemplates (NUEVO)                             │
│  - products (con soporte de imagen enriquecida)                        │
│  - nutritionPlans (con alimentos con gramaje directo)                  │
│  - bodyAssessments (evaluaciones unificadas)                           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ Physiotherapy    │      │ StorePOS         │      │ NutritionModule  │
│ - TemplateSelector│      │ - ProductCard    │      │ - MealRowEditor  │
│ - EvolutionChart │      │   (con imagen)   │      │   (texto + peso) │
│ - PhysioReportPDF│      │ - ImageUploader  │      │ - MacroSummary   │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

### Entidades Nuevas y Modificadas:

1. **`EvaluationTemplate` en `src/types/gym.ts`:**
   ```typescript
   export interface EvaluationTemplate {
     id: string;
     name: string;
     description: string;
     category: string;
     affectedZones: BodyPainZone[];
     consultationReason: string;
     painLevelEVA: number;
     postureFindings: string[];
     romStatus: 'completo' | 'limitado_leve' | 'limitado_moderado' | 'severamente_limitado';
     functionalTests: JointFunctionalTestItem[];
     exerciseDosage: ExerciseDosage;
     gymRestrictions: string;
     homeIndications: string;
     patientFriendlySummary: string;
     additionalObservations: string[];
   }
   ```

2. **`Product` en `src/types/gym.ts`:**
   - Asegurar que `image?: string;` esté completamente integrado en los formularios de creación/edición de `StorePOS.tsx` y en el renderizado de tarjetas POS e inventario.

3. **`MealItem` en `src/types/gym.ts`:**
   - Asegurar campos para `foodText` (descripción directa), `weightGrams` (peso en gramos o unidad de porción) y valores nutricionales asociados.

---

## 4. Fases de Ejecución Paso a Paso

1. **Fase 1: Tipos y Contexto de Datos:**
   - Extender `src/types/gym.ts` con `EvaluationTemplate` y tipos auxiliares.
   - En `GymContext.tsx`, añadir estado `physioTemplates`, métodos `addPhysioTemplate`, `deletePhysioTemplate` y presets clínicos iniciales (Lumbalgia, Tendinitis de muñeca, Esguince de tobillo, Cervicalgia, Rehabilitación de rodilla).
2. **Fase 2: Plantillas de Evaluación en Fisioterapia:**
   - Integrar barra de selección y guardado de plantillas en `PhysiotherapyModule.tsx`.
   - Al seleccionar una plantilla, auto-completar instantáneamente todos los campos de las 5 pestañas del formulario.
3. **Fase 3: Gráfico de Seguimiento Evolutivo (ROM vs EVA):**
   - Construir componente interactivo con `Recharts` que grafica la progresión de dolor (EVA) y el arco de movimiento funcional (ROM en grados) a través de las fechas de atención del paciente seleccionado.
4. **Fase 4: Optimización del Reporte PDF:**
   - Refinar el modal `PhysioReportModal.tsx` asegurando que todos los elementos (silueta anatómica, zonas seleccionadas, pruebas de articulación, cartilla de ejercicios ilustrada y observaciones) queden perfectamente formateados para impresión y descarga en PDF sin saltos de página indeseados.
5. **Fase 5: Módulo de Ventas con Imágenes (StorePOS):**
   - Actualizar el modal de nuevo/editar producto para permitir seleccionar o ingresar la imagen del producto.
   - Renderizar las imágenes en el catálogo del POS y en la vista de inventario con fallbacks limpios.
6. **Fase 6: Pauta Nutricional con Texto + Casillero de Peso:**
   - Actualizar el editor de comidas en `NutritionModule.tsx` para permitir tipear el alimento libremente y colocar su peso en gramos en un casillero adjunto.
7. **Fase 7: Verificación y Cero Redundancias:**
   - Verificar la no-duplicidad en medidas corporales, ejecutar `lint_applet` y `compile_applet` para garantizar cero errores.
