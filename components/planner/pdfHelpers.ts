import type { PlanItem, WorkoutRoutine } from '../../store/plannerStore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function generateNutritionHTML(mealPlans: Record<string, PlanItem[]>, today: string, weekStart: string, weekEnd: Date): string {
  const dayLabels: Record<string,string>={Mon:'Lunes',Tue:'Martes',Wed:'Miércoles',Thu:'Jueves',Fri:'Viernes',Sat:'Sábado',Sun:'Domingo'};
  const mealColors: Record<string,string>={breakfast:'#F59E0B',lunch:'#10B981',dinner:'#7C5CFC',snack:'#3B82F6'};
  const mealEmoji: Record<string,string>={breakfast:'🌅',lunch:'☀️',dinner:'🌙',snack:'🍎'};
  const totalCal=DAYS.reduce((a,d)=>a+(mealPlans[d]||[]).reduce((s,m)=>s+(m.calories||0),0),0);
  const totalProt=DAYS.reduce((a,d)=>a+(mealPlans[d]||[]).reduce((s,m)=>s+(m.protein||0),0),0);
  const activeDays=DAYS.filter(d=>(mealPlans[d]||[]).length>0).length;
  const weStr=`${weekEnd.getFullYear()}-${String(weekEnd.getMonth()+1).padStart(2,'0')}-${String(weekEnd.getDate()).padStart(2,'0')}`;

  let html=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>FitGO Plan Nutricional</title><style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter','Helvetica Neue',sans-serif;background:#F0F4FF;color:#1E1B4B;-webkit-print-color-adjust:exact}
    .page{max-width:800px;margin:0 auto;padding:32px 24px}
    .header{background:linear-gradient(135deg,#7C5CFC 0%,#4F46E5 100%);border-radius:20px;padding:32px;margin-bottom:24px;color:white;display:flex;align-items:center;justify-content:space-between}
    .header-title{font-size:28px;font-weight:800;letter-spacing:-0.5px}
    .header-sub{font-size:14px;opacity:.85;margin-top:4px}
    .logo-badge{background:rgba(255,255,255,.2);border-radius:50%;width:64px;height:64px;display:flex;align-items:center;justify-content:center;font-size:28px}
    .summary-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
    .summary-card{background:white;border-radius:14px;padding:16px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.06)}
    .summary-card .val{font-size:22px;font-weight:800;color:#7C5CFC}
    .summary-card .lbl{font-size:11px;color:#6B7280;margin-top:2px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
    .day-card{background:white;border-radius:16px;margin-bottom:20px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.06);page-break-inside:avoid}
    .day-header{padding:14px 20px;display:flex;align-items:center;justify-content:space-between;background:#F9F7FF;border-bottom:1px solid #EDE9FE}
    .day-name{font-size:18px;font-weight:700;color:#4F46E5}
    .day-totals{font-size:12px;color:#6B7280;font-weight:600;background:#EDE9FE;padding:4px 10px;border-radius:20px}
    .meal-row{display:grid;grid-template-columns:100px 1fr auto;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid #F3F4F6}
    .meal-row:last-child{border-bottom:none}
    .meal-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;color:white}
    .meal-name{font-size:14px;font-weight:500;color:#374151;line-height:1.4}
    .meal-macros{text-align:right}
    .meal-kcal{font-size:16px;font-weight:800;color:#7C5CFC}
    .meal-macro-row{font-size:10px;color:#9CA3AF;margin-top:2px}
    .rest-day{text-align:center;padding:24px;color:#9CA3AF;font-size:15px}
    .footer{text-align:center;margin-top:32px;font-size:11px;color:#9CA3AF}
  </style></head><body><div class="page">`;

  html+=`<div class="header"><div><div class="header-title">🥗 Plan Nutricional Semanal</div><div class="header-sub">FitGO · ${weekStart} al ${weStr}</div></div><div class="logo-badge">💪</div></div>`;
  html+=`<div class="summary-row"><div class="summary-card"><div class="val">${activeDays}</div><div class="lbl">Días planificados</div></div><div class="summary-card"><div class="val">${Math.round(activeDays>0?totalCal/activeDays:0)}</div><div class="lbl">kcal / día</div></div><div class="summary-card"><div class="val">${Math.round(activeDays>0?totalProt/activeDays:0)}g</div><div class="lbl">Proteína / día</div></div></div>`;

  DAYS.forEach(day=>{const meals=mealPlans[day]||[];const dl=dayLabels[day]||day;const dc=meals.reduce((s:number,m)=>s+(m.calories||0),0);const dp=meals.reduce((s:number,m)=>s+(m.protein||0),0);const dcarb=meals.reduce((s:number,m)=>s+(m.carbs||0),0);const df=meals.reduce((s:number,m)=>s+(m.fat||0),0);
    html+=`<div class="day-card"><div class="day-header"><span class="day-name">${dl}</span>`;if(meals.length>0)html+=`<span class="day-totals">${dc} kcal · P:${dp}g C:${dcarb}g F:${df}g</span>`;html+=`</div>`;
    if(meals.length===0)html+=`<div class="rest-day">Sin comidas planificadas para este día</div>`;else meals.forEach((m:PlanItem)=>{const c=mealColors[m.meal]||'#7C5CFC';const e=mealEmoji[m.meal]||'🍽️';html+=`<div class="meal-row"><div><div class="meal-badge" style="background:${c}">${e} ${m.meal}</div></div><div class="meal-name">${m.name}</div><div class="meal-macros"><div class="meal-kcal">${m.calories}</div><div class="meal-macro-row">P ${m.protein}g · C ${m.carbs}g · F ${m.fat}g</div></div></div>`;});
    html+=`</div>`;});

  html+=`<div class="footer">Generado por FitGO · ${today} · Solo para referencia personal</div></div></body></html>`;
  return html;
}

export function generateWorkoutHTML(workoutPlans: Record<string, WorkoutRoutine>, energyMode: string, today: string, weekStart: string, weekEnd: Date): string {
  const dayLabels: Record<string,string>={Mon:'Lunes',Tue:'Martes',Wed:'Miércoles',Thu:'Jueves',Fri:'Viernes',Sat:'Sábado',Sun:'Domingo'};
  const energyLabels: Record<string,string>={low:'🔋 Agotado',normal:'⚡ Normal',beast:'🦍 Bestia'};
  const weStr=`${weekEnd.getFullYear()}-${String(weekEnd.getMonth()+1).padStart(2,'0')}-${String(weekEnd.getDate()).padStart(2,'0')}`;
  const totalWorkoutDays=DAYS.filter(d=>(workoutPlans[d]?.exercises?.length??0)>0).length;
  const totalExercises=DAYS.reduce((a,d)=>a+(workoutPlans[d]?.exercises?.length??0),0);

  let html=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>FitGO Rutina Semanal</title><style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter','Helvetica Neue',sans-serif;background:#F0F4FF;color:#1E1B4B;-webkit-print-color-adjust:exact}
    .page{max-width:800px;margin:0 auto;padding:32px 24px}
    .header{background:linear-gradient(135deg,#7C5CFC 0%,#06B6D4 100%);border-radius:20px;padding:32px;margin-bottom:24px;color:white;display:flex;align-items:center;justify-content:space-between}
    .header-title{font-size:28px;font-weight:800;letter-spacing:-0.5px}
    .header-sub{font-size:14px;opacity:.85;margin-top:4px}
    .logo-badge{background:rgba(255,255,255,.2);border-radius:50%;width:64px;height:64px;display:flex;align-items:center;justify-content:center;font-size:28px}
    .summary-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
    .summary-card{background:white;border-radius:14px;padding:16px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.06)}
    .summary-card .val{font-size:22px;font-weight:800;color:#7C5CFC}
    .summary-card .lbl{font-size:11px;color:#6B7280;margin-top:2px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
    .disclaimer{background:#FEF3C7;border:1px solid #FCD34D;border-radius:12px;padding:12px 16px;margin-bottom:24px;font-size:12px;color:#92400E;display:flex;gap:8px;align-items:flex-start}
    .day-card{background:white;border-radius:16px;margin-bottom:20px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.06);page-break-inside:avoid}
    .day-header{padding:14px 20px;display:flex;align-items:center;justify-content:space-between;background:#F9F7FF;border-bottom:1px solid #EDE9FE}
    .day-name{font-size:18px;font-weight:700;color:#4F46E5}
    .routine-name{font-size:12px;color:#6D28D9;font-weight:600;background:#EDE9FE;padding:4px 10px;border-radius:20px}
    .rest-badge{font-size:12px;color:#6B7280;background:#F3F4F6;padding:4px 10px;border-radius:20px;font-weight:600}
    .ex-row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid #F3F4F6}
    .ex-row:last-child{border-bottom:none}
    .ex-num{font-size:11px;font-weight:800;color:#9CA3AF;margin-bottom:3px}
    .ex-name{font-size:15px;font-weight:600;color:#1E1B4B}
    .badge{padding:4px 10px;border-radius:8px;font-size:12px;font-weight:700}
    .badge-sets{background:#EDE9FE;color:#6D28D9}
    .badge-reps{background:#DCFCE7;color:#166534}
    .badge-rest{background:#FEF3C7;color:#92400E}
    .rest-day{text-align:center;padding:28px;color:#9CA3AF;font-size:15px}
    .footer{text-align:center;margin-top:32px;font-size:11px;color:#9CA3AF}
  </style></head><body><div class="page">`;

  html+=`<div class="header"><div><div class="header-title">🏋️ Rutina Semanal de Entrenamiento</div><div class="header-sub">FitGO · ${weekStart} al ${weStr}</div></div><div class="logo-badge">🔥</div></div>`;
  html+=`<div class="summary-row"><div class="summary-card"><div class="val">${totalWorkoutDays}</div><div class="lbl">Días de entreno</div></div><div class="summary-card"><div class="val">${totalExercises}</div><div class="lbl">Ejercicios totales</div></div><div class="summary-card"><div class="val">${energyLabels[energyMode]||'⚡ Normal'}</div><div class="lbl">Energía</div></div></div>`;
  html+=`<div class="disclaimer"><span>⚠️</span><span>Este plan es generado por inteligencia artificial y NO reemplaza el consejo de un entrenador certificado o médico.</span></div>`;

  DAYS.forEach(day=>{const w=workoutPlans[day];const dl=dayLabels[day]||day;const isRest=!w||(w.exercises?.length??0)===0;
    html+=`<div class="day-card"><div class="day-header"><span class="day-name">${dl}</span>`;if(isRest)html+=`<span class="rest-badge">😴 Descanso</span>`;else html+=`<span class="routine-name">${w!.name}</span>`;html+=`</div>`;
    if(isRest)html+=`<div class="rest-day">Día de descanso — recupera energías 💤</div>`;else w!.exercises.forEach((ex:any,i:number)=>{html+=`<div class="ex-row"><div><div class="ex-num">#${i+1}</div><div class="ex-name">${ex.name}</div></div><span class="badge badge-sets">${ex.sets} series</span><span class="badge badge-reps">${ex.reps} reps</span><span class="badge badge-rest">⏱ ${ex.rest}</span></div>`;});
    html+=`</div>`;});

  html+=`<div class="footer">Generado por FitGO · ${today} · Solo para referencia personal</div></div></body></html>`;
  return html;
}
