import { api } from '../../nucleo/api/clienteHttp';
import type { BodyAssessment, NutritionPlan } from '../../nucleo/tipos/gym';
import { Fila, hora12, hora24, idNum, num, objetivoDesdeApi, objetivoHaciaApi, opc, txt } from '../../nucleo/utilidades/mapeo';

const r1 = (n: number) => Math.round(n * 10) / 10;

export function adaptarDieta(d: Fila): NutritionPlan {
  const meals = (d.comidas ?? []).map((c: Fila) => {
    const items = (c.alimentos ?? []).map((a: Fila) => ({
      id: String(a.iddieta_alimento),
      name: txt(a.alimento),
      grams: num(a.gramos),
      portion: `${num(a.gramos)} g`,
      calories: num(a.kilocalorias),
      proteins: num(a.proteinas_g),
      carbs: num(a.carbohidratos_g),
      fats: num(a.grasas_g),
    }));
    return {
      id: String(c.iddieta_comida),
      name: txt(c.nombre),
      time: hora12(c.hora),
      items,
      totalCalories: Math.round(items.reduce((s: number, i: { calories: number }) => s + i.calories, 0)),
      totalProteins: r1(items.reduce((s: number, i: { proteins: number }) => s + i.proteins, 0)),
      totalCarbs: r1(items.reduce((s: number, i: { carbs: number }) => s + i.carbs, 0)),
      totalFats: r1(items.reduce((s: number, i: { fats: number }) => s + i.fats, 0)),
    };
  });
  return {
    id: String(d.iddieta),
    title: txt(d.titulo),
    targetStudentId: String(d.idalumno),
    targetStudentName: txt(d.alumno),
    objective: objetivoDesdeApi(d.objetivo),
    dailyCaloriesTarget: num(d.calorias_meta),
    proteinsTargetGrams: num(d.proteinas_g),
    carbsTargetGrams: num(d.carbohidratos_g),
    fatsTargetGrams: num(d.grasas_g),
    waterLitersTarget: num(d.agua_litros),
    meals,
    supplements: txt(d.suplementos).split(',').map(s => s.trim()).filter(Boolean),
    hydrationGuidelines: opc(d.pautas_hidratacion),
    recommendations: txt(d.recomendaciones),
    createdDate: txt(d.fecha),
    trainerName: opc(d.nutricionista),
    active: !!Number(d.activa),
  };
}

export const dietaHaciaApi = (p: Partial<NutritionPlan>) => ({
  idalumno: idNum(p.targetStudentId),
  titulo: p.title,
  objetivo: p.objective ? objetivoHaciaApi(p.objective) : undefined,
  calorias_meta: p.dailyCaloriesTarget,
  proteinas_g: p.proteinsTargetGrams,
  carbohidratos_g: p.carbsTargetGrams,
  grasas_g: p.fatsTargetGrams,
  agua_litros: p.waterLitersTarget,
  recomendaciones: p.recommendations,
  suplementos: p.supplements ? p.supplements.join(', ') : undefined,
  pautas_hidratacion: p.hydrationGuidelines,
  activa: p.active === undefined ? undefined : p.active ? 1 : 0,
  comidas: p.meals?.map(m => ({
    nombre: m.name,
    hora: hora24(m.time),
    alimentos: m.items.filter(i => i.name.trim()).map(i => ({
      alimento: i.name.trim(),
      gramos: i.grams || parseFloat(i.portion) || 100,
      kilocalorias: i.calories,
      proteinas_g: i.proteins,
      carbohidratos_g: i.carbs,
      grasas_g: i.fats,
    })),
  })),
});

export function adaptarMedida(m: Fila): BodyAssessment {
  const peso = num(m.peso_kg);
  const grasa = num(m.grasa_porcentaje);
  const musculo = num(m.masa_muscular_kg);
  const agua = num(m.agua_porcentaje);
  const icc = num(m.indice_cintura_cadera);
  return {
    id: String(m.idmedida),
    memberId: String(m.idalumno),
    memberName: txt(m.alumno),
    date: txt(m.fecha),
    time: m.hora ? hora12(m.hora) : undefined,
    evaluatorTrainerName: txt(m.evaluador),
    weightKg: peso,
    heightCm: num(m.talla_cm),
    bmi: num(m.imc),
    bmiClassification: m.clasificacion_imc,
    waistHipRatio: icc,
    waistHipRisk: icc >= 0.95 ? 'Alto' : icc >= 0.85 ? 'Moderado' : 'Bajo',
    waistHeightRatio: num(m.talla_cm) ? Math.round((num(m.cintura) / num(m.talla_cm)) * 100) / 100 : 0,
    perimeters: {
      neck: num(m.cuello), shoulders: num(m.hombros), chest: num(m.pecho), waist: num(m.cintura), abdomen: num(m.abdomen), hip: num(m.cadera),
      bicepsRelaxedRight: num(m.biceps_relajado_der), bicepsRelaxedLeft: num(m.biceps_relajado_izq),
      bicepsFlexedRight: num(m.biceps_contraido_der), bicepsFlexedLeft: num(m.biceps_contraido_izq),
      forearmRight: num(m.antebrazo_der), forearmLeft: num(m.antebrazo_izq),
      thighRight: num(m.muslo_der), thighLeft: num(m.muslo_izq),
      calfRight: num(m.pantorrilla_der), calfLeft: num(m.pantorrilla_izq),
    },
    skinfolds: {
      triceps: opc(m.pliegue_triceps) ? num(m.pliegue_triceps) : undefined,
      subscapular: opc(m.pliegue_subescapular) ? num(m.pliegue_subescapular) : undefined,
      suprailiac: opc(m.pliegue_suprailiaco) ? num(m.pliegue_suprailiaco) : undefined,
      abdominal: opc(m.pliegue_abdominal) ? num(m.pliegue_abdominal) : undefined,
      thigh: opc(m.pliegue_muslo) ? num(m.pliegue_muslo) : undefined,
      calf: opc(m.pliegue_pantorrilla) ? num(m.pliegue_pantorrilla) : undefined,
    },
    bioimpedance: {
      bodyFatPercentage: grasa,
      bodyFatKg: r1((peso * grasa) / 100),
      muscleMassPercentage: peso ? r1((musculo / peso) * 100) : 0,
      muscleMassKg: musculo,
      leanMassKg: r1(peso - (peso * grasa) / 100),
      visceralFatLevel: num(m.grasa_visceral),
      totalBodyWaterPercentage: agua,
      totalBodyWaterLiters: r1((peso * agua) / 100),
      boneMassKg: num(m.masa_osea_kg),
      basalMetabolicRateKcal: num(m.metabolismo_basal),
      metabolicAge: num(m.edad_metabolica),
      physicalRatingScore: opc(m.puntuacion_fisica) ? num(m.puntuacion_fisica) : undefined,
    },
    notes: opc(m.observaciones),
    targetGoalNotes: opc(m.notas_objetivo),
  };
}

export const medidaHaciaApi = (a: Omit<BodyAssessment, 'id'>, idevaluador?: number) => {
  const p = a.perimeters;
  const s = a.skinfolds ?? {};
  const b = a.bioimpedance;
  return {
    idalumno: idNum(a.memberId), idevaluador, fecha: a.date, hora: a.time ? hora24(a.time) : undefined,
    peso_kg: a.weightKg, talla_cm: a.heightCm,
    cuello: p.neck || '', hombros: p.shoulders || '', pecho: p.chest || '', cintura: p.waist, abdomen: p.abdomen || '', cadera: p.hip,
    biceps_relajado_der: p.bicepsRelaxedRight || '', biceps_relajado_izq: p.bicepsRelaxedLeft || '',
    biceps_contraido_der: p.bicepsFlexedRight || '', biceps_contraido_izq: p.bicepsFlexedLeft || '',
    antebrazo_der: p.forearmRight || '', antebrazo_izq: p.forearmLeft || '',
    muslo_der: p.thighRight || '', muslo_izq: p.thighLeft || '',
    pantorrilla_der: p.calfRight || '', pantorrilla_izq: p.calfLeft || '',
    pliegue_triceps: s.triceps ?? '', pliegue_subescapular: s.subscapular ?? '', pliegue_suprailiaco: s.suprailiac ?? '',
    pliegue_abdominal: s.abdominal ?? '', pliegue_muslo: s.thigh ?? '', pliegue_pantorrilla: s.calf ?? '',
    grasa_porcentaje: b.bodyFatPercentage || '', masa_muscular_kg: b.muscleMassKg || '', grasa_visceral: b.visceralFatLevel || '',
    agua_porcentaje: b.totalBodyWaterPercentage || '', metabolismo_basal: b.basalMetabolicRateKcal || '',
    edad_metabolica: b.metabolicAge || '', masa_osea_kg: b.boneMassKg || '', puntuacion_fisica: b.physicalRatingScore ?? '',
    observaciones: a.notes ?? '', notas_objetivo: a.targetGoalNotes ?? '',
  };
};

export const servicioNutricion = {
  crearDieta: (p: Omit<NutritionPlan, 'id' | 'createdDate'>, idnutricionista?: number) =>
    api.post('/dietas', { ...dietaHaciaApi(p), idnutricionista }),
  actualizarDieta: (id: string, p: Partial<NutritionPlan>) => api.put(`/dietas/${id}`, dietaHaciaApi(p)),
  eliminarDieta: (id: string) => api.delete(`/dietas/${id}`),
  crearMedida: (a: Omit<BodyAssessment, 'id'>, idevaluador?: number) => api.post('/medidas', medidaHaciaApi(a, idevaluador)),
  eliminarMedida: (id: string) => api.delete(`/medidas/${id}`),
};
