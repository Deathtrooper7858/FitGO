---
name: creador-de-agentes
description: Diseña, crea, configura y gestiona Custom Agents (agentes personalizados) en Google Antigravity basándose en la especificación oficial (archivos agent.md, YAML frontmatter, herramientas, modelos, MCP servers y CLI).
---

# Habilidad: Creador de Agentes (Custom Agents en Google Antigravity)

Esta habilidad proporciona la guía completa, estándares y procedimientos para crear, configurar y optimizar **Custom Agents** en Google Antigravity.

---

## 1. ¿Qué es un Custom Agent?

Los **Custom Agents** son configuraciones modulares y especializadas basadas en archivos Markdown (`.md`) con encabezados **YAML frontmatter**. Permiten dividir el trabajo de ingeniería de software en roles especializados, resolviendo dos problemas fundamentales:
1. **Falta de Especialización**: Brindan instrucciones profundas, flujos de trabajo y restricciones específicas de proyecto o dominio.
2. **Context Window Bloat**: Evitan sobrecargar el prompt principal con instrucciones monolíticas; cada agente opera en un contexto limpio y enfocado con solo las herramientas necesarias.
3. **Verdadera Simetría**: Un Custom Agent puede ejecutarse tanto como **agente principal de la sesión** (vía CLI `agy --agent <nombre>` o selector de GUI) como en calidad de **subagente especializado en segundo plano** (`invoke_subagent`).

---

## 2. Ubicaciones y Descubrimiento

Antigravity descubre automáticamente los agentes buscando en las siguientes rutas:

### A. Nivel de Proyecto / Workspace (específico del repositorio)
* `.agents/agents/<nombre>.md`
* `.agents/agents/<nombre>/agent.md`
*(Recomendado para compartir la configuración del equipo mediante control de versiones).*

### B. Nivel Global (para todos los proyectos del usuario)
* `~/.gemini/config/agents/<nombre>.md`
* `~/.gemini/config/agents/<nombre>/agent.md`
*(Recomendado para utilidades transversales personales).*

---

## 3. Estructura y Esquema de `agent.md`

Todo agente se define en un archivo Markdown compuesto por dos partes: **Frontmatter YAML** y **System Prompt (Cuerpo Markdown)**.

```markdown
---
name: <identificador-unico>
description: <Breve descripcion del rol y proposito del agente>
model: inherit | flash | flash_lite | pro
subagent: true | false
tools:
  - view_file
  - replace_file_content
  - run_command
  - grep_search
skills:
  - <nombre-de-habilidad>
mcpServers:
  - <nombre-servidor-mcp>
---

# Rol e Identidad
Eres un especialista en [Propósito del Agente]...

## Objetivos
- [Objetivo 1]
- [Objetivo 2]

## Flujo de Trabajo
1. [Paso 1]
2. [Paso 2]

## Restricciones y Reglas
- [Restricción 1]
- [Restricción 2]
```

### Campos del YAML Frontmatter

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `name` | `string` | **Sí** | Identificador único del agente (letras minúsculas, guiones o guiones bajos). |
| `description` | `string` | **Sí** | Descripción del rol del agente, utilizada por el planificador para delegar tareas y en el panel GUI. |
| `model` | `string` | No | Modelo a utilizar (`inherit`, `flash_lite`, `flash`, `pro`). Por defecto `inherit`. |
| `subagent` | `boolean` | No | Si es `true`, permite que el agente sea invocado programáticamente por otros agentes vía `invoke_subagent`. |
| `tools` | `list` | No | Lista explícita de herramientas autorizadas (principio de mínimo privilegio). Si se omite, hereda el conjunto por defecto. |
| `skills` | `list` | No | Lista de habilidades (skills) que este agente debe tener preactivadas o cargadas. |
| `mcpServers` | `list` | No | Servidores MCP asociados al agente para proveer herramientas externas. |

---

## 4. Métodos de Ejecución

### 1. Sesión Principal vía CLI
Lanza una sesión interactiva o en lote dirigida completamente por el agente:
```bash
agy --agent <nombre-del-agente>
```

### 2. Sesión Principal vía Antigravity GUI (2.0 / IDE)
* Abre el selector de agentes en el panel `/agents` o la barra superior.
* Selecciona el agente deseado para iniciar una conversación directa.

### 3. Delegación como Subagente Dinámico
Dentro de una sesión activa, el agente principal puede delegar tareas a este agente usando `invoke_subagent` si `subagent: true`:
```json
{
  "Subagents": [
    {
      "TypeName": "<nombre-del-agente>",
      "Role": "Especialista en Pruebas Unitarias",
      "Prompt": "Ejecuta los tests de regresión y genera un reporte de cobertura."
    }
  ]
}
```

---

## 5. Proceso Paso a Paso para Crear un Nuevo Agente

Cuando el usuario te solicite crear un agente, sigue este procedimiento:

1. **Definir el Rol y Alcance**:
   * ¿Cuál es el propósito exacto? (Auditoría de seguridad, refactorización, redacción de tests, traducción, optimización de base de datos, etc.).
   * ¿Debe ser accesible a nivel de workspace (`.agents/agents/`) o global (`~/.gemini/config/agents/`)?
2. **Seleccionar Herramientas y Modelo**:
   * Asignar el modelo adecuado (`flash` para tareas rápidas/búsqueda, `pro` para razonamiento complejo/arquitectura).
   * Restringir las herramientas a las necesarias para la tarea (ej. solo herramientas de lectura para un auditor).
3. **Diseñar el System Prompt**:
   * Definir identidad clara y tono profesional.
   * Establecer directrices operativas estrictas.
   * Proporcionar formatos de salida estandarizados.
4. **Escribir el Archivo**:
   * Crear el archivo `.agents/agents/<nombre-del-agente>.md` con el frontmatter y prompt correspondientes.
5. **Verificar**:
   * Confirmar la sintaxis YAML y la validez de los nombres de herramientas y campos.

---

## 6. Ejemplos de Referencia

### Ejemplo 1: Revisor de Código y Seguridad (`code-reviewer.md`)
```markdown
---
name: code-reviewer
description: Auditor especializado en revisión de código, buenas prácticas, seguridad y detección de bugs.
model: pro
subagent: true
tools:
  - view_file
  - grep_search
  - list_dir
---

Eres un Auditor Senior de Código y Seguridad.
Tu función es examinar diffs y archivos modificados para encontrar:
1. Vulnerabilidades de seguridad (inyección SQL, XSS, secretos expuestos).
2. Fugas de memoria, condiciones de carrera y cuellos de botella.
3. Incumplimiento de estándares de tipado y convenciones del proyecto.

Entrega siempre un reporte con:
- Resumen ejecutivo.
- Hallazgos clasificados por severidad (Crítica, Alta, Media, Baja).
- Recomendaciones con ejemplos de código `diff`.
```

### Ejemplo 2: Generador de Pruebas Unitarias (`test-generator.md`)
```markdown
---
name: test-generator
description: Especialista en diseño e implementación de pruebas unitarias y de integración.
model: inherit
subagent: true
tools:
  - view_file
  - replace_file_content
  - write_to_file
  - run_command
---

Eres un Ingeniero de Pruebas y Control de Calidad (QA).
Tu misión es:
1. Analizar el código fuente objetivo.
2. Diseñar casos de prueba cubriendo flujos exitosos, valores límite y casos de error.
3. Implementar y ejecutar las pruebas usando el framework del proyecto (Jest, PyTest, Flutter test, etc.).
4. Asegurar que todas las pruebas pasen con éxito.
```

---

## 7. Buenas Prácticas
* **Principio de Mínimo Privilegio**: No otorgues herramientas de escritura o ejecución de comandos (`write_to_file`, `run_command`) si el agente solo requiere análisis o consulta.
* **Descripciones Claras**: La propiedad `description` en el YAML es fundamental para que el orquestador sepa cuándo delegar una tarea al agente.
* **Modularidad**: Prefiere crear múltiples agentes hiperespecializados en lugar de un solo agente con instrucciones excesivas.
