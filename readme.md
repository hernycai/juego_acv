# 🧠 Rehabilitación Cognitiva — Oscar

Aplicación web de **neurorehabilitación cognitiva** diseñada a medida para un paciente
que sufrió un **ACV isquémico del hemisferio derecho** (topografía parieto-occipital).
Orientada a ejercitar **memoria, atención, coordinación motora y rastreo visual**,
siguiendo principios de neuroplasticidad y con adaptaciones específicas para sus déficits.

> ⚠️ **Aviso importante:** esta aplicación es una herramienta de **apoyo** a la
> rehabilitación. No reemplaza la indicación del equipo médico ni de kinesiología.
> Todo el progreso se guarda **localmente en el dispositivo** (localStorage) y
> **no se envía a ningún servidor**.

---

## 🎯 Contexto clínico (para el equipo de salud)

Las adaptaciones de la app responden al cuadro del paciente:

| Hallazgo | Adaptación en la app |
|---|---|
| **Hemianopsia homónima izquierda** (pérdida del campo visual izquierdo) | Modo Hemianopsia: 70% de los estímulos aparecen a la izquierda + guía visual de barrido + avisos previos |
| **Paresia severa de miembro superior izquierdo** | Modo CIMT (uso inducido de mano izquierda) con bonificación de puntos y botones que fuerzan el cruce de la línea media |
| **Lesión occipital derecha** (déficit visual) | Feedback multisensorial: voz + vibración, sin depender solo de lo visual |
| **Episodio de confusión/excitación psicomotriz** durante la internación | Modo Enfoque: reduce elementos distractores en pantalla |
| **Maculopatía en seguimiento** | Botones grandes, alto contraste, sin animaciones bruscas |

---

## 🎮 Los 4 juegos

1. **🧠 Memoria** — Encontrar parejas de cartas. Puede usar **fotos familiares** en lugar de emojis (saliencia emocional).
2. **👀 Atención** — Tocar el objeto diferente en una grilla.
3. **✋ Coordinación** — Tocar estrellas que aparecen en pantalla. Registra **tiempo de reacción izquierdo vs. derecho** para el kinesiólogo.
4. **🚀 Viaje a las Estrellas** — Juego de saltar obstáculos con un solo toque (runner), con dificultad progresiva.

Cada juego tiene **3 niveles de dificultad** y otorga puntaje, estrellas y feedback positivo.

---

## ⚙️ Opciones terapéuticas (toggles)

| Opción | Qué hace |
|---|---|
| 👁️‍🗨️ **Modo Hemianopsia** | Sesga estímulos al lado izquierdo + guía visual + avisos de obstáculos |
| ✋ **CIMT · Mano izquierda** | Pregunta al finalizar si usó la mano izquierda y suma bonus (+20) |
| 📸 **Saliencia (fotos)** | Reemplaza emojis por fotos familiares cargadas en el juego de memoria |
| 🔊 **Multisensorial** | Voz sintetizada ("¡Muy bien Oscar") + vibración en aciertos |
| 🎯 **Modo Enfoque** | Oculta la mascota y agranda el feedback para reducir distracciones |

Las preferencias se guardan en el dispositivo.

---

## 📊 Reporte para el kinesiólogo

La app registra cada sesión (juego, nivel, puntaje, duración, aciertos) y, en Coordinación,
el **tiempo de reacción por lado**. Desde la pantalla **Progreso** se puede:

- Ver el gráfico comparativo de reacción izquierda vs. derecha.
- Consultar el historial de sesiones.
- **Exportar un informe `.txt`** listo para compartir con el profesional.

---

## 🛠️ Stack técnico

- [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- HTML5 + CSS3 (sin frameworks)
- Web Audio API (sonidos), Speech Synthesis (voz), Vibration API (vibración)
- Canvas 2D (confetti y juego Viaje a las Estrellas)
- localStorage (persistencia de progreso y preferencias)

---

## 📁 Estructura del proyecto
