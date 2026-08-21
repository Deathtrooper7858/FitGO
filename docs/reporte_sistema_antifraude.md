

## 2. Análisis por Métodos (Pros, Contras y Mejoras)

### Método 1: Ganancias Realistas (+5% máximo por semana)
- **Pros:** Es una métrica muy sólida. Fisiológicamente, nadie aumenta sus levantamientos de forma exponencial de la noche a la mañana. 
- **Contras:** Los principiantes pueden experimentar las "ganancias de novato" (newbie gains) donde su técnica mejora rápidamente y levantan mucho más, lo que podría generar falsas alarmas. Además, si un usuario vuelve de una lesión, podría empezar con poco peso y saltar rápidamente a su peso normal.
- **Mejoras Sugeridas:**
  - **Periodo de gracia ampliado:** En lugar de solo 30 días, considera un esquema adaptativo. Si el usuario indica "Soy principiante" en su perfil, el umbral de warning podría ser 10-15% durante los primeros 2 meses.
  - **Filtro por historial:** Si un usuario ya había levantado 100kg hace 6 meses, y hoy levanta 60kg, permitirle volver a los 100kg más rápidamente sin alertar.

### Método 2: Duración vs Cantidad de Ejercicios
- **Pros:** Extremadamente eficaz contra bots de spam y usuarios que ingresan datos aleatorios solo para ganar puntos o subir en rankings.
- **Contras:** Los circuitos de Crossfit, EMOMs (Every Minute On the Minute), o superseries pueden hacer que un usuario registre muchos ejercicios en muy poco tiempo.
- **Mejoras Sugeridas:**
  - **Clasificación de rutinas:** Si el usuario selecciona etiquetas como `Crossfit`, `HIIT`, o `Superserie`, el algoritmo debe reducir drásticamente el tiempo mínimo esperado.
  - **Agrupamiento:** Permitir que los ejercicios en una misma superserie contabilicen menos tiempo de transición.

### Método 3: Calorías Teóricas vs Registradas
- **Pros:** Se basa en ciencia (fórmula MET), lo que hace que sea muy difícil de burlar sin registrar duraciones absurdas.
- **Contras:** El gasto calórico en pesas es notoriamente difícil de calcular y muy variable entre individuos (depende de la masa muscular, frecuencia cardíaca, etc.).
- **Mejoras Sugeridas:**
  - **Integración con Wearables:** Si el entrenamiento viene validado por Apple Health o Google Fit (con datos de ritmo cardíaco real), se debe otorgar un "Sello de Confianza" y bypassear esta verificación (o darle mucha más tolerancia).
  - **Límites Absolutos:** En lugar de solo usar porcentajes, establece un "techo duro". Por ejemplo, nadie quema más de 1200-1500 calorías en una hora, sin importar lo que registre.

### Método 4: Tiempo Mínimo Entre Entrenamientos
- **Pros:** Muy fácil y rápido de implementar a nivel de base de datos o backend. Computacionalmente muy barato.
- **Contras:** Errores humanos. A veces un usuario olvida registrar su entrenamiento de la mañana, y en la noche registra el de la mañana y luego inmediatamente el de la noche.
- **Mejoras Sugeridas:**
  - **Hora real vs Hora de registro:** Asegúrate de diferenciar cuándo el usuario *hizo* el ejercicio vs cuándo lo *guardó* en la app. Si permite modificar la hora de inicio del entrenamiento, usa esa hora en lugar del `created_at` del registro en la base de datos.

### Sistema de Reporte por Usuarios
- **Pros:** Descentraliza la moderación y empodera a la comunidad. El sistema de penalizar reportes falsos es brillante y necesario.
- **Contras:** Posibilidad de brigading (un grupo de usuarios poniéndose de acuerdo para reportar a alguien).
- **Mejoras Sugeridas:**
  - **Peso de reporte por reputación:** Un usuario que lleva 1 año en la app y entrena regularmente tiene un "peso de reporte" mayor que una cuenta creada hace 2 días.
  - **Shadowbanning temporal:** Si alguien recibe muchos reportes rápidos, ocultar temporalmente sus entrenamientos del feed público hasta revisión, pero no decirle al usuario (para no darle pistas a los bots).

---

## 3. Consideraciones Arquitectónicas

Para implementar esto en FitGO sin afectar el rendimiento de la app móvil (React Native / Expo):
1. **Procesamiento Asíncrono:** La evaluación de los entrenamientos no debe bloquear al usuario cuando le da "Guardar". Guarda el entrenamiento y lanza un evento o "Job" en el backend que evalúe el fraude en segundo plano.
2. **Tabla de Flags (`user_flags`):** Crea una tabla que registre: `user_id`, `workout_id`, `rule_triggered` (ej. 'MET_CALORIES'), `severity` (WARNING, FLAG), y `status` (PENDING, RESOLVED).
3. **Panel de Admin (Dashboard):** Se necesitará construir una interfaz web simple para que tú o los administradores puedan revisar la cola de reportes y aplicar baneos.
