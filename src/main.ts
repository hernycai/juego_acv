import './style.css';
import type {
  Dificultad, JuegoId, EstadoGlobal, DatosResumen,
  Sesion, ConfigTerapia, ItemMemoria, ItemAtencion, GloboItem
} from './types';

// ============================================================
// VECTORES SVG ESTILO IA PARA CARTAS Y ELEMENTOS
// ============================================================
const SVG_ASSETS = {
  trofeo: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#0284c7" opacity="0.2"/><path d="M30 25 h40 v25 c0 15 -10 25 -20 25 c-10 0 -20 -10 -20 -25 Z" fill="#f59e0b"/><path d="M45 75 h10 v12 h-10 Z" fill="#d97706"/><rect x="35" y="87" width="30" height="8" rx="4" fill="#b45309"/><path d="M22 30 c-8 0 -12 10 -5 18 c5 6 13 4 13 4" stroke="#f59e0b" stroke-width="4" fill="none"/><path d="M78 30 c8 0 12 10 5 18 c-5 6 -13 4 -13 4" stroke="#f59e0b" stroke-width="4" fill="none"/><circle cx="50" cy="42" r="8" fill="#fef08a"/></svg>`,
  planeta: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="32" fill="#6366f1"/><ellipse cx="50" cy="50" rx="46" ry="12" fill="none" stroke="#38bdf8" stroke-width="6" transform="rotate(-20 50 50)"/><circle cx="40" cy="40" r="8" fill="#818cf8" opacity="0.5"/><circle cx="60" cy="55" r="5" fill="#4338ca" opacity="0.6"/></svg>`,
  cohete: `<svg viewBox="0 0 100 100"><path d="M50 15 c15 20 18 45 15 60 h-30 c-3 -15 0 -40 15 -60 Z" fill="#f43f5e"/><path d="M35 75 l-10 15 h10 Z" fill="#e11d48"/><path d="M65 75 l10 15 h-10 Z" fill="#e11d48"/><circle cx="50" cy="40" r="7" fill="#38bdf8"/><path d="M42 75 q8 18 16 0" fill="#f59e0b"/></svg>`,
  cristal: `<svg viewBox="0 0 100 100"><polygon points="50,15 75,38 62,85 38,85 25,38" fill="#10b981"/><polygon points="50,15 75,38 50,85" fill="#34d399" opacity="0.6"/><polygon points="50,15 38,38 50,85" fill="#059669" opacity="0.4"/></svg>`,
  estrella: `<svg viewBox="0 0 100 100"><polygon points="50,10 63,38 93,38 68,57 78,86 50,68 22,86 32,57 7,38 37,38" fill="#f59e0b" stroke="#fef08a" stroke-width="2"/></svg>`,
  escudo: `<svg viewBox="0 0 100 100"><path d="M50 15 L80 25 V50 C80 70 50 88 50 88 C50 88 20 70 20 50 V25 Z" fill="#3b82f6"/><path d="M50 20 L72 29 V50 C72 66 50 82 50 82 Z" fill="#60a5fa" opacity="0.6"/><path d="M42 48 L48 56 L60 38" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  hoja: `<svg viewBox="0 0 100 100"><path d="M25 75 C25 25 75 25 75 25 C75 75 25 75 25 75 Z" fill="#22c55e"/><path d="M25 75 Q50 50 75 25" stroke="#15803d" stroke-width="4" fill="none"/></svg>`,
  robot: `<svg viewBox="0 0 100 100"><rect x="30" y="30" width="40" height="35" rx="8" fill="#94a3b8"/><circle cx="42" cy="45" r="5" fill="#38bdf8"/><circle cx="58" cy="45" r="5" fill="#38bdf8"/><rect x="40" y="56" width="20" height="4" fill="#475569"/><line x1="50" y1="30" x2="50" y2="18" stroke="#cbd5e1" stroke-width="4"/><circle cx="50" cy="15" r="5" fill="#f43f5e"/></svg>`
};

// ============================================================
// SÍNTESIS DE VOZ Y FEEDBACK PARA OSCAR
// ============================================================
export function hablarMensaje(mensaje: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(mensaje);
    utterance.lang = 'es-AR';
    utterance.rate = 0.88;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

function vibrarAcierto() {
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100]);
  }
}

// ============================================================
// AUDIO SINTETIZADO Y MÚSICA DE FONDO (WEB AUDIO API)
// ============================================================
class GeneradorSonido {
  private ctx: AudioContext | null = null;
  public sonidoActivo: boolean = true;
  public musicaActiva: boolean = true;
  private timerMusica: number = 0;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  click() {
    if (!this.sonidoActivo) return;
    this.initCtx(); if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(480, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.05);
  }

  popGlobo() {
    if (!this.sonidoActivo) return;
    this.initCtx(); if (!this.ctx) return;
    // Ruido blanco + caida rápida
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    
    noise.connect(gain); gain.connect(this.ctx.destination);
    noise.start();
  }

  salto() {
    if (!this.sonidoActivo) return;
    this.initCtx(); if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.15);
  }

  acierto() {
    if (!this.sonidoActivo) return;
    this.initCtx(); if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08);
    osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.3);
  }

  error() {
    if (!this.sonidoActivo) return;
    this.initCtx(); if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.setValueAtTime(140, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.25);
  }

  // Música Suave Terapéutica en Bucle (Web Audio Pads)
  iniciarMusica() {
    if (this.timerMusica) return;
    this.timerMusica = window.setInterval(() => {
      if (!this.musicaActiva) return;
      this.initCtx(); if (!this.ctx) return;
      
      const acordes = [
        [261.63, 329.63, 392.00, 493.88], // C maj 7
        [220.00, 261.63, 329.63, 392.00], // A min 7
        [174.61, 220.00, 261.63, 329.63], // F maj 7
        [196.00, 246.94, 293.66, 392.00]  // G maj
      ];
      const notas = acordes[Math.floor(Date.now() / 4000) % acordes.length];
      
      notas.forEach(f => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + 1.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.8);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 3.9);
      });
    }, 4000);
  }
}

const Sonido = new GeneradorSonido();

// ============================================================
// CONSEJOS DE LA MASCOTA "BRISA"
// ============================================================
const CONSEJOS_BRISA = [
  "¡Hola Oscar! 👋 Recordá siempre revisar despacio el lado izquierdo de la pantalla para ejercitar la vista.",
  "¡Excelente trabajo Oscar! Tomarse un pequeño descanso de 2 minutos ayuda a fijar lo aprendido.",
  "Si intentás usar tu mano izquierda durante los ejercicios, estarás estimulando nuevas conexiones en el cerebro. 🐾",
  "Mover suavemente las manos y respirar profundo ayuda a concentrarse mejor. ¡Vamos Oscar!",
  "¡Paso a paso! La constancia en la rehabilitación es la clave para seguir mejorando día a día."
];

// ============================================================
// ESTADO GLOBAL Y CONFIGURACIÓN
// ============================================================
const Estado: EstadoGlobal = {
  dificultad: 'medio',
  juegoActivo: null,
  enPausa: false,
  terminado: false
};

const Config: ConfigTerapia = {
  hemianopsia: true,
  cimt: true,
  multi: true,
  enfoque: false
};

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Elemento no encontrado: ${sel}`);
  return el;
};

function mostrarPantalla(id: string) {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
  const target = $(`#pantalla-${id}`);
  target.classList.add('activa');

  const barra = $('#barra-juego');
  if (id === 'menu' || id === 'progreso' || id === 'config') {
    barra.classList.add('oculto');
    Estado.juegoActivo = null;
  } else {
    barra.classList.remove('oculto');
    Estado.juegoActivo = id as JuegoId;
  }
}

function registrarSesion(juego: JuegoId, nivel: Dificultad, puntaje: number, exitoso: boolean, duracion: number, stats: Record<string, string | number>) {
  const sesion: Sesion = { fecha: new Date().toISOString(), juego, nivel, puntaje, exitoso, duracion, stats };
  try {
    const historial: Sesion[] = JSON.parse(localStorage.getItem('oscar_historial_sesiones') || '[]');
    historial.unshift(sesion);
    localStorage.setItem('oscar_historial_sesiones', JSON.stringify(historial.slice(0, 50)));
  } catch { /* ignore */ }
}

function renderizarProgreso() {
  const contGeneral = $('#progreso-resumen-general');
  const contHistorial = $('#progreso-historial');

  let historial: Sesion[] = [];
  try { historial = JSON.parse(localStorage.getItem('oscar_historial_sesiones') || '[]'); } catch { /* ignore */ }

  if (historial.length === 0) {
    contGeneral.innerHTML = '<p class="subtitulo">Aún no hay sesiones registradas. ¡Comenzá a ejercitarte hoy!</p>';
    contHistorial.innerHTML = '';
    return;
  }

  const total = historial.length;
  const mejorPuntaje = Math.max(...historial.map(s => s.puntaje));

  contGeneral.innerHTML = `
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-bottom: 24px;">
      <div style="background:var(--primario-suave); padding: 16px; border-radius:16px; text-align:center;">
        <span style="font-size: 2rem;">🎮</span>
        <h4>${total}</h4>
        <small>Sesiones Completadas</small>
      </div>
      <div style="background:var(--exito-suave); padding: 16px; border-radius:16px; text-align:center;">
        <span style="font-size: 2rem;">🏆</span>
        <h4>${mejorPuntaje}</h4>
        <small>Mejor Puntaje</small>
      </div>
    </div>
  `;

  contHistorial.innerHTML = `
    <h3 style="margin-bottom:12px;">Historial Reciente</h3>
    <div style="display:flex; flex-direction:column; gap: 10px;">
      ${historial.slice(0, 8).map(s => `
        <div style="background:var(--tarjeta); padding: 12px 16px; border-radius: 12px; border:1px solid var(--borde); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>${s.juego.toUpperCase()} (${s.nivel})</strong>
            <div style="font-size:0.85rem; color:var(--texto-suave);">${new Date(s.fecha).toLocaleDateString()}</div>
          </div>
          <span style="font-size: 1.1rem; font-weight:700; color:var(--primario);">${s.puntaje} pts</span>
        </div>
      `).join('')}
    </div>
  `;
}

function exportarProgreso() {
  let historial: Sesion[] = [];
  try { historial = JSON.parse(localStorage.getItem('oscar_historial_sesiones') || '[]'); } catch { /* ignore */ }

  const lineas = [
    '==================================================',
    'REPORTE DE REHABILITACIÓN COGNITIVA - PACIENTE OSCAR',
    `Fecha: ${new Date().toLocaleString()}`,
    '==================================================
',
    `Total de sesiones: ${historial.length}
`
  ];

  historial.forEach((s, idx) => {
    lineas.push(`[${idx + 1}] ${new Date(s.fecha).toLocaleString()} | Juego: ${s.juego.toUpperCase()} | Nivel: ${s.nivel} | Puntaje: ${s.puntaje} pts`);
  });

  const blob = new Blob([lineas.join('
')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte_terapeutico_oscar_${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function renderSelectorDificultad(containerId: string, difActual: Dificultad, onSelect: (d: Dificultad) => void) {
  const cont = $(`#${containerId}`);
  cont.innerHTML = `
    <button class="${difActual === 'facil' ? 'activo' : ''}" data-dif="facil">Fácil</button>
    <button class="${difActual === 'medio' ? 'activo' : ''}" data-dif="medio">Medio</button>
    <button class="${difActual === 'dificil' ? 'activo' : ''}" data-dif="dificil">Desafío</button>
  `;

  cont.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      Sonido.click();
      const d = btn.getAttribute('data-dif') as Dificultad;
      cont.querySelectorAll('button').forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
      onSelect(d);
    });
  });
}

function mostrarResumen(datos: DatosResumen) {
  Estado.terminado = true;
  $('#resumen-titulo').textContent = datos.titulo;
  $('#resumen-mensaje').textContent = datos.mensaje;

  const contStats = $('#resumen-stats');
  contStats.innerHTML = datos.stats.map(s => `
    <div style="background:var(--primario-suave); padding:10px 16px; border-radius:12px; margin:6px 0;">
      <strong>${s.etiqueta}:</strong> ${s.valor}
    </div>
  `).join('');

  if (Config.multi && datos.exitoso) {
    hablarMensaje('¡Muy bien Oscar! Excelente trabajo completando este ejercicio.');
    vibrarAcierto();
  }

  $('#modal-resumen').classList.add('activo');
}

// ============================================================
// MINIJUEGO 1: MEMORIA IA
// ============================================================
const Memoria = {
  cartas: [] as ItemMemoria[],
  seleccionadas: [] as number[],
  bloqueado: false,
  intentos: 0,
  parejasEncontradas: 0,
  totalParejas: 0,
  inicioTiempo: 0,
  timerInterval: 0 as unknown as number,

  comenzar(dif: Dificultad) {
    Estado.terminado = false;
    this.intentos = 0;
    this.parejasEncontradas = 0;
    this.seleccionadas = [];
    this.bloqueado = false;
    this.inicioTiempo = Date.now();

    const bancoAssets = [
      { id: 'trofeo', svg: SVG_ASSETS.trofeo, nombre: 'Trofeo' },
      { id: 'planeta', svg: SVG_ASSETS.planeta, nombre: 'Planeta' },
      { id: 'cohete', svg: SVG_ASSETS.cohete, nombre: 'Cohete' },
      { id: 'cristal', svg: SVG_ASSETS.cristal, nombre: 'Cristal' },
      { id: 'estrella', svg: SVG_ASSETS.estrella, nombre: 'Estrella' },
      { id: 'escudo', svg: SVG_ASSETS.escudo, nombre: 'Escudo' },
      { id: 'hoja', svg: SVG_ASSETS.hoja, nombre: 'Hoja' },
      { id: 'robot', svg: SVG_ASSETS.robot, nombre: 'Robot' }
    ];

    this.totalParejas = dif === 'facil' ? 4 : dif === 'medio' ? 6 : 8;
    const seleccionados = bancoAssets.slice(0, this.totalParejas);

    const items: ItemMemoria[] = [];
    let id = 0;
    seleccionados.forEach(item => {
      items.push({ id: id++, valor: item.svg, nombre: item.nombre, descubierta: false, emparejada: false });
      items.push({ id: id++, valor: item.svg, nombre: item.nombre, descubierta: false, emparejada: false });
    });

    this.cartas = items.sort(() => Math.random() - 0.5);
    this.render();

    clearInterval(this.timerInterval);
    this.timerInterval = window.setInterval(() => this.actualizarTiempo(), 1000);
  },

  render() {
    $('#mem-intentos').textContent = this.intentos.toString();
    const grid = $('#grid-memoria');
    grid.innerHTML = '';

    this.cartas.forEach((carta, idx) => {
      const btn = document.createElement('div');
      btn.className = `carta-memoria ${carta.descubierta || carta.emparejada ? 'volteada' : ''}`;
      if (carta.descubierta || carta.emparejada) {
        btn.innerHTML = carta.valor;
      } else {
        btn.innerHTML = `<span style="font-size:2rem; color:var(--texto-suave)">❓</span>`;
      }
      btn.addEventListener('click', () => this.voltear(idx));
      grid.appendChild(btn);
    });
  },

  voltear(idx: number) {
    if (this.bloqueado || this.cartas[idx].descubierta || this.cartas[idx].emparejada) return;

    Sonido.click();
    this.cartas[idx].descubierta = true;
    this.seleccionadas.push(idx);
    this.render();

    if (this.seleccionadas.length === 2) {
      this.intentos++;
      this.bloqueado = true;
      const [i1, i2] = this.seleccionadas;

      if (this.cartas[i1].nombre === this.cartas[i2].nombre) {
        Sonido.acierto();
        this.cartas[i1].emparejada = true;
        this.cartas[i2].emparejada = true;
        this.parejasEncontradas++;
        this.seleccionadas = [];
        this.bloqueado = false;
        this.render();

        if (this.parejasEncontradas === this.totalParejas) {
          clearInterval(this.timerInterval);
          const duracion = Math.floor((Date.now() - this.inicioTiempo) / 1000);
          const pts = Math.max(10, 100 - this.intentos * 5);
          registrarSesion('memoria', Estado.dificultad, pts, true, duracion, { Intentos: this.intentos });

          mostrarResumen({
            titulo: '🧠 ¡Memoria Excelente!',
            mensaje: 'Completaste todas las parejas con éxito.',
            stats: [
              { etiqueta: 'Intentos', valor: this.intentos },
              { etiqueta: 'Tiempo', valor: `${duracion}s` },
              { etiqueta: 'Puntaje', valor: `${pts} pts` }
            ],
            juego: 'memoria',
            nivel: Estado.dificultad,
            exitoso: true,
            puntaje: pts
          });
        }
      } else {
        Sonido.error();
        setTimeout(() => {
          this.cartas[i1].descubierta = false;
          this.cartas[i2].descubierta = false;
          this.seleccionadas = [];
          this.bloqueado = false;
          this.render();
        }, 1000);
      }
    }
  },

  actualizarTiempo() {
    const dur = Math.floor((Date.now() - this.inicioTiempo) / 1000);
    const min = Math.floor(dur / 60).toString().padStart(2, '0');
    const seg = (dur % 60).toString().padStart(2, '0');
    $('#mem-tiempo').textContent = `${min}:${seg}`;
  },

  detener() { clearInterval(this.timerInterval); }
};

// ============================================================
// MINIJUEGO 2: ATENCIÓN VISUAL (GRILLAS 3x3, 4x4, 5x5)
// ============================================================
const Atencion = {
  ronda: 1,
  maxRondas: 5,
  puntos: 0,
  targetIdx: 0,
  inicioTiempo: 0,

  comenzar(dif: Dificultad) {
    this.ronda = 1;
    this.puntos = 0;
    this.inicioTiempo = Date.now();
    this.siguienteRonda(dif);
  },

  siguienteRonda(dif: Dificultad) {
    $('#ate-ronda').textContent = `${this.ronda}/${this.maxRondas}`;
    $('#ate-puntos').textContent = this.puntos.toString();

    const grid = $('#grid-atencion');
    grid.innerHTML = '';

    // 3x3 = 9, 4x4 = 16, 5x5 = 25
    const filas = dif === 'facil' ? 3 : dif === 'medio' ? 4 : 5;
    const total = filas * filas;

    grid.className = `grid-atencion grid-${filas}x${filas} guia-hemianopsia-izq`;

    const svgNormal = SVG_ASSETS.cristal;
    const svgDiferente = SVG_ASSETS.estrella;

    let target = Math.floor(Math.random() * total);
    if (Config.hemianopsia && Math.random() < 0.7) {
      target = Math.floor(Math.random() * filas) * filas; // Columna izquierda
    }
    this.targetIdx = target;

    for (let i = 0; i < total; i++) {
      const item = document.createElement('div');
      item.className = 'item-atencion';
      item.innerHTML = i === target ? svgDiferente : svgNormal;
      item.addEventListener('click', () => this.verificar(i));
      grid.appendChild(item);
    }
  },

  verificar(idx: number) {
    if (idx === this.targetIdx) {
      Sonido.acierto();
      this.puntos += 20;
      this.ronda++;

      if (this.ronda > this.maxRondas) {
        const duracion = Math.floor((Date.now() - this.inicioTiempo) / 1000);
        registrarSesion('atencion', Estado.dificultad, this.puntos, true, duracion, { Rondas: this.maxRondas });

        mostrarResumen({
          titulo: '👀 ¡Gran Atención Visual!',
          mensaje: 'Identificaste correctamente los elementos diferentes.',
          stats: [
            { etiqueta: 'Rondas', valor: `${this.maxRondas}/${this.maxRondas}` },
            { etiqueta: 'Puntaje', valor: `${this.puntos} pts` }
          ],
          juego: 'atencion',
          nivel: Estado.dificultad,
          exitoso: true,
          puntaje: this.puntos
        });
      } else {
        this.siguienteRonda(Estado.dificultad);
      }
    } else {
      Sonido.error();
    }
  },

  detener() { /* noop */ }
};

// ============================================================
// MINIJUEGO 3: GLOBOS FLOTANTES
// ============================================================
const Coordinacion = {
  aciertos: 0,
  escapados: 0,
  maxGlobos: 10,
  totalAparecidos: 0,
  timerSpawn: 0 as unknown as number,
  inicioTiempo: 0,

  comenzar(dif: Dificultad) {
    this.aciertos = 0;
    this.escapados = 0;
    this.totalAparecidos = 0;
    this.inicioTiempo = Date.now();
    $('#coo-aciertos').textContent = '0';
    $('#coo-escapados').textContent = '0';

    const area = $('#area-coordinacion');
    area.innerHTML = '';

    const vel = dif === 'facil' ? 3000 : dif === 'medio' ? 2200 : 1500;
    clearInterval(this.timerSpawn);
    this.timerSpawn = window.setInterval(() => this.aparecerGlobo(area, vel), vel);
    this.aparecerGlobo(area, vel);
  },

  aparecerGlobo(area: HTMLElement, vel: number) {
    if (this.totalAparecidos >= this.maxGlobos) {
      clearInterval(this.timerSpawn);
      setTimeout(() => this.finalizar(), 1200);
      return;
    }

    this.totalAparecidos++;

    const globo = document.createElement('div');
    globo.className = 'globo-target';

    const colores = ['#f43f5e', '#38bdf8', '#22c55e', '#f59e0b', '#a855f7'];
    const color = colores[Math.floor(Math.random() * colores.length)];

    globo.innerHTML = `
      <svg viewBox="0 0 100 120">
        <ellipse cx="50" cy="50" rx="38" ry="46" fill="${color}"/>
        <polygon points="50,96 44,106 56,106" fill="${color}"/>
        <path d="M50 106 Q45 115 50 120" stroke="#cbd5e1" stroke-width="2" fill="none"/>
        <ellipse cx="38" cy="35" rx="8" ry="14" fill="#fff" opacity="0.3"/>
      </svg>
    `;

    let posX = Math.random() * 80 + 10;
    if (Config.hemianopsia && Math.random() < 0.7) {
      posX = Math.random() * 40 + 5; // Izquierda
    }
    const posY = Math.random() * 65 + 15;

    globo.style.left = `${posX}%`;
    globo.style.top = `${posY}%`;

    let explotado = false;
    globo.addEventListener('click', () => {
      if (explotado) return;
      explotado = true;
      Sonido.popGlobo();
      this.aciertos++;
      $('#coo-aciertos').textContent = this.aciertos.toString();
      globo.classList.add('globo-pop');
      setTimeout(() => globo.remove(), 300);
    });

    area.appendChild(globo);

    setTimeout(() => {
      if (!explotado && globo.parentElement) {
        this.escapados++;
        $('#coo-escapados').textContent = this.escapados.toString();
        globo.remove();
      }
    }, vel - 100);
  },

  finalizar() {
    const duracion = Math.floor((Date.now() - this.inicioTiempo) / 1000);
    const pts = this.aciertos * 10;
    registrarSesion('coordinacion', Estado.dificultad, pts, true, duracion, { Explotados: this.aciertos, Escapados: this.escapados });

    mostrarResumen({
      titulo: '🎈 ¡Excelente Coordinación!',
      mensaje: 'Reaccionaste a los globos con rapidez y precisión.',
      stats: [
        { etiqueta: 'Globos Explotados', valor: `${this.aciertos}/${this.maxGlobos}` },
        { etiqueta: 'Puntaje Final', valor: `${pts} pts` }
      ],
      juego: 'coordinacion',
      nivel: Estado.dificultad,
      exitoso: true,
      puntaje: pts
    });
  },

  detener() { clearInterval(this.timerSpawn); }
};

// ============================================================
// MINIJUEGO 4: VIAJE ESPACIAL SCI-FI (MARIO / STAR TREK STYLE)
// ============================================================
const Viaje = {
  canvas: null as HTMLCanvasElement | null,
  ctx: null as CanvasRenderingContext2D | null,
  animId: 0,
  jugadorY: 340,
  velocidadY: 0,
  gravedad: 0.55,
  fuerzaSalto: -11,
  enSuelo: true,
  puntos: 0,
  vidas: 3,
  obstaculos: [] as { x: number; y: number; w: number; h: number; tipo: string; golpeado: boolean }[],
  cristales: [] as { x: number; y: number; tomado: boolean }[],
  running: false,

  comenzar(dif: Dificultad) {
    this.canvas = $('#canvas-viaje') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.jugadorY = 340;
    this.velocidadY = 0;
    this.enSuelo = true;
    this.puntos = 0;
    this.vidas = dif === 'facil' ? 5 : dif === 'medio' ? 3 : 2;
    this.obstaculos = [];
    this.cristales = [];

    $('#via-puntos').textContent = '0';
    $('#via-vidas').textContent = '💙'.repeat(this.vidas);
    $('#viaje-overlay').style.display = 'none';

    this.running = true;
    this.loop();
  },

  saltar() {
    if (!this.running || !this.enSuelo) return;
    Sonido.salto();
    this.velocidadY = this.fuerzaSalto;
    this.enSuelo = false;
  },

  loop() {
    if (!this.running || !this.ctx || !this.canvas) return;

    // Física
    this.velocidadY += this.gravedad;
    this.jugadorY += this.velocidadY;

    // Altura del suelo (plataforma metálica Sci-Fi)
    const nivelSuelo = this.canvas.height - 90;
    if (this.jugadorY >= nivelSuelo) {
      this.jugadorY = nivelSuelo;
      this.velocidadY = 0;
      this.enSuelo = true;
    }

    // Spawn Obstáculos (Barreras de Plasma)
    if (Math.random() < 0.018) {
      this.obstaculos.push({
        x: this.canvas.width + 30,
        y: nivelSuelo + 10,
        w: 30,
        h: 40,
        tipo: 'barrera',
        golpeado: false
      });
    }

    // Spawn Cristales
    if (Math.random() < 0.025) {
      this.cristales.push({
        x: this.canvas.width + 30,
        y: nivelSuelo - Math.random() * 80 - 40,
        tomado: false
      });
    }

    // Dibujar Fondo Star Trek Sci-Fi
    this.ctx.fillStyle = '#090d16';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Rejilla Sci-Fi / Estrellas en movimiento
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    this.ctx.lineWidth = 1;
    const offset = (Date.now() / 10) % 40;
    for (let x = -offset; x < this.canvas.width; x += 40) {
      this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.canvas.height); this.ctx.stroke();
    }

    // Plataforma Metálica Estilo Nave
    this.ctx.fillStyle = '#1e293b';
    this.ctx.fillRect(0, nivelSuelo + 40, this.canvas.width, 50);
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.fillRect(0, nivelSuelo + 38, this.canvas.width, 3);

    // Dibujar Astronauta 🧑‍🚀
    this.ctx.font = '40px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText('🧑‍🚀', 120, this.jugadorY + 40);

    // Obstáculos
    for (let i = this.obstaculos.length - 1; i >= 0; i--) {
      const obs = this.obstaculos[i];
      obs.x -= 4.5;

      // Dibujar barrera plasma
      this.ctx.fillStyle = '#f43f5e';
      this.ctx.fillRect(obs.x - 15, obs.y - 30, obs.w, obs.h);

      const dist = Math.hypot(120 - obs.x, (this.jugadorY + 20) - obs.y);
      if (dist < 32 && !obs.golpeado) {
        obs.golpeado = true;
        Sonido.error();
        this.vidas--;
        $('#via-vidas').textContent = '💙'.repeat(Math.max(0, this.vidas));

        if (this.vidas <= 0) {
          this.finalizar();
          return;
        }
      }

      if (obs.x < -40) this.obstaculos.splice(i, 1);
    }

    // Cristales
    for (let i = this.cristales.length - 1; i >= 0; i--) {
      const cr = this.cristales[i];
      cr.x -= 4.5;

      this.ctx.font = '28px sans-serif';
      this.ctx.fillText('💎', cr.x, cr.y);

      const dist = Math.hypot(120 - cr.x, (this.jugadorY + 20) - cr.y);
      if (dist < 35 && !cr.tomado) {
        cr.tomado = true;
        Sonido.acierto();
        this.puntos += 15;
        $('#via-puntos').textContent = this.puntos.toString();
        this.cristales.splice(i, 1);
      } else if (cr.x < -40) {
        this.cristales.splice(i, 1);
      }
    }

    this.animId = requestAnimationFrame(() => this.loop());
  },

  finalizar() {
    this.running = false;
    cancelAnimationFrame(this.animId);

    registrarSesion('viaje', Estado.dificultad, this.puntos, true, 30, { Cristales: this.puntos });

    mostrarResumen({
      titulo: '🖖 ¡Misión Cumplida Oscar!',
      mensaje: 'Recorriste la nave espacial y recolectaste energía.',
      stats: [{ etiqueta: 'Cristales', valor: `${this.puntos} pts` }],
      juego: 'viaje',
      nivel: Estado.dificultad,
      exitoso: true,
      puntaje: this.puntos
    });
  },

  detener() {
    this.running = false;
    cancelAnimationFrame(this.animId);
  }
};

// ============================================================
// MINIJUEGO 5: DESAFÍO DE PALABRAS (4, 5 y 6 LETRAS)
// ============================================================
const Palabras = {
  palabraActual: '',
  letrasMezcladas: [] as string[],
  pestaLetras: [] as string[],
  puntos: 0,
  ronda: 1,

  banco4: [
    { p: 'CASA', pista: 'Nuestro hogar cálido 🏠' },
    { p: 'LUNA', pista: 'Nos ilumina de noche 🌙' },
    { p: 'MESA', pista: 'Mueble para almorzar 🍽️' },
    { p: 'GATO', pista: 'Mascota felina 🐱' },
    { p: 'AUTO', pista: 'Vehículo con ruedas 🚗' },
    { p: 'FLOR', pista: 'Crece en el jardín 🌸' }
  ],

  banco5: [
    { p: 'ARBOL', pista: 'Da sombra y hojas verdes 🌳' },
    { p: 'LIBRO', pista: 'Tiene páginas para leer 📖' },
    { p: 'BARCO', pista: 'Navega en el agua ⛵' },
    { p: 'MUNDO', pista: 'Nuestro planeta Tierra 🌍' },
    { p: 'PERRO', pista: 'El mejor amigo del hombre 🐶' },
    { p: 'CIELO', pista: 'Azul durante el día ☁️' }
  ],

  banco6: [
    { p: 'CAMINO', pista: 'Sendero para caminar 🛣️' },
    { p: 'JARDIN', pista: 'Lugar con flores y césped 🏡' },
    { p: 'MUSICA', pista: 'Melodías y canciones 🎵' },
    { p: 'PUERTA', pista: 'Se abre para entrar 🚪' },
    { p: 'PLANTA', pista: 'Verde en la maceta 🪴' },
    { p: 'REGALO', pista: 'Sorpresa de cumpleaños 🎁' }
  ],

  comenzar(dif: Dificultad) {
    this.ronda = 1;
    this.puntos = 0;
    this.cargarRonda(dif);
  },

  cargarRonda(dif: Dificultad) {
    let banco = this.banco4;
    if (dif === 'medio') banco = this.banco5;
    else if (dif === 'dificil') banco = this.banco6;

    const item = banco[(this.ronda - 1) % banco.length];
    this.palabraActual = item.p;
    $('#palabra-pista').textContent = item.pista;
    $('#pal-progreso').textContent = `${this.ronda}/5`;

    this.pestaLetras = [];
    this.letrasMezcladas = item.p.split('').sort(() => Math.random() - 0.5);

    this.render();
  },

  render() {
    const casillas = $('#palabra-casillas');
    casillas.innerHTML = '';

    for (let i = 0; i < this.palabraActual.length; i++) {
      const c = document.createElement('div');
      c.className = 'casilla-letra';
      c.textContent = this.pestaLetras[i] || '';
      casillas.appendChild(c);
    }

    const teclado = $('#palabra-teclado');
    teclado.innerHTML = '';

    this.letrasMezcladas.forEach((letra, idx) => {
      const btn = document.createElement('button');
      btn.className = 'tecla-btn';
      btn.textContent = letra;
      btn.addEventListener('click', () => {
        Sonido.click();
        this.pestaLetras.push(letra);
        this.letrasMezcladas.splice(idx, 1);
        this.render();
        this.verificar();
      });
      teclado.appendChild(btn);
    });
  },

  verificar() {
    if (this.pestaLetras.length === this.palabraActual.length) {
      const formada = this.pestaLetras.join('');
      if (formada === this.palabraActual) {
        Sonido.acierto();
        this.puntos += 20;
        this.ronda++;

        if (this.ronda > 5) {
          registrarSesion('palabras', Estado.dificultad, this.puntos, true, 40, { PalabrasCompletadas: 5 });

          mostrarResumen({
            titulo: '🔤 ¡Palabras Formadas!',
            mensaje: 'Completaste con éxito todas las palabras.',
            stats: [{ etiqueta: 'Puntaje Final', valor: `${this.puntos} pts` }],
            juego: 'palabras',
            nivel: Estado.dificultad,
            exitoso: true,
            puntaje: this.puntos
          });
        } else {
          setTimeout(() => this.cargarRonda(Estado.dificultad), 800);
        }
      } else {
        Sonido.error();
        setTimeout(() => this.cargarRonda(Estado.dificultad), 1000);
      }
    }
  },

  detener() { /* noop */ }
};

// ============================================================
// BINDINGS E INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  Sonido.iniciarMusica();

  // Mascota Brisa
  $('#mascota-brisa').addEventListener('click', () => {
    Sonido.click();
    const consejo = CONSEJOS_BRISA[Math.floor(Math.random() * CONSEJOS_BRISA.length)];
    $('#brisa-consejo-texto').textContent = consejo;
    $('#modal-brisa').classList.add('activo');
    hablarMensaje(consejo);
  });

  $('#btn-brisa-cerrar').addEventListener('click', () => {
    Sonido.click();
    $('#modal-brisa').classList.remove('activo');
  });

  // Botones de Encabezado con Inscripciones Explicitas
  $('#btn-sonido-barra').addEventListener('click', (e) => {
    Sonido.sonidoActivo = !Sonido.sonidoActivo;
    (e.currentTarget as HTMLElement).textContent = Sonido.sonidoActivo ? '🔊 Sonido: ON' : '🔇 Sonido: OFF';
  });

  $('#btn-musica-barra').addEventListener('click', (e) => {
    Sonido.musicaActiva = !Sonido.musicaActiva;
    (e.currentTarget as HTMLElement).textContent = Sonido.musicaActiva ? '🎵 Música: ON' : '🔇 Música: OFF';
  });

  $('#btn-barra-reiniciar').addEventListener('click', () => {
    Sonido.click();
    if (Estado.juegoActivo === 'memoria') Memoria.comenzar(Estado.dificultad);
    else if (Estado.juegoActivo === 'atencion') Atencion.comenzar(Estado.dificultad);
    else if (Estado.juegoActivo === 'coordinacion') Coordinacion.comenzar(Estado.dificultad);
    else if (Estado.juegoActivo === 'viaje') Viaje.comenzar(Estado.dificultad);
    else if (Estado.juegoActivo === 'palabras') Palabras.comenzar(Estado.dificultad);
  });

  $('#btn-barra-menu').addEventListener('click', () => {
    Sonido.click();
    Memoria.detener(); Atencion.detener(); Coordinacion.detener(); Viaje.detener(); Palabras.detener();
    mostrarPantalla('menu');
  });

  $('#btn-pausa').addEventListener('click', () => {
    Sonido.click();
    $('#modal-pausa').classList.add('activo');
  });

  $('#btn-pausa-continuar').addEventListener('click', () => {
    Sonido.click();
    $('#modal-pausa').classList.remove('activo');
  });

  $('#btn-pausa-salir').addEventListener('click', () => {
    Sonido.click();
    $('#modal-pausa').classList.remove('activo');
    Memoria.detener(); Atencion.detener(); Coordinacion.detener(); Viaje.detener(); Palabras.detener();
    mostrarPantalla('menu');
  });

  $('#btn-salir').addEventListener('click', () => {
    Sonido.click();
    Memoria.detener(); Atencion.detener(); Coordinacion.detener(); Viaje.detener(); Palabras.detener();
    mostrarPantalla('menu');
  });

  $('#btn-resumen-menu').addEventListener('click', () => {
    Sonido.click();
    $('#modal-resumen').classList.remove('activo');
    mostrarPantalla('menu');
  });

  $('#btn-resumen-repetir').addEventListener('click', () => {
    Sonido.click();
    $('#modal-resumen').classList.remove('activo');
    if (Estado.juegoActivo === 'memoria') Memoria.comenzar(Estado.dificultad);
    else if (Estado.juegoActivo === 'atencion') Atencion.comenzar(Estado.dificultad);
    else if (Estado.juegoActivo === 'coordinacion') Coordinacion.comenzar(Estado.dificultad);
    else if (Estado.juegoActivo === 'viaje') Viaje.comenzar(Estado.dificultad);
    else if (Estado.juegoActivo === 'palabras') Palabras.comenzar(Estado.dificultad);
  });

  // Navegación de Juegos
  $('#btn-juego-memoria').addEventListener('click', () => { Sonido.click(); mostrarPantalla('memoria'); Memoria.comenzar(Estado.dificultad); });
  $('#btn-juego-atencion').addEventListener('click', () => { Sonido.click(); mostrarPantalla('atencion'); Atencion.comenzar(Estado.dificultad); });
  $('#btn-juego-coordinacion').addEventListener('click', () => { Sonido.click(); mostrarPantalla('coordinacion'); Coordinacion.comenzar(Estado.dificultad); });
  $('#btn-juego-viaje').addEventListener('click', () => { Sonido.click(); mostrarPantalla('viaje'); });
  $('#btn-juego-palabras').addEventListener('click', () => { Sonido.click(); mostrarPantalla('palabras'); Palabras.comenzar(Estado.dificultad); });

  $('#btn-viaje-iniciar').addEventListener('click', () => { Viaje.comenzar(Estado.dificultad); });

  $('#btn-ir-progreso').addEventListener('click', () => { Sonido.click(); renderizarProgreso(); mostrarPantalla('progreso'); });
  $('#btn-ir-config').addEventListener('click', () => {
    Sonido.click();
    ($('#chk-hemianopsia') as HTMLInputElement).checked = Config.hemianopsia;
    ($('#chk-cimt') as HTMLInputElement).checked = Config.cimt;
    ($('#chk-multi') as HTMLInputElement).checked = Config.multi;
    ($('#chk-enfoque') as HTMLInputElement).checked = Config.enfoque;
    mostrarPantalla('config');
  });

  $('#btn-volver-desde-config').addEventListener('click', () => {
    Sonido.click();
    Config.hemianopsia = ($('#chk-hemianopsia') as HTMLInputElement).checked;
    Config.cimt = ($('#chk-cimt') as HTMLInputElement).checked;
    Config.multi = ($('#chk-multi') as HTMLInputElement).checked;
    Config.enfoque = ($('#chk-enfoque') as HTMLInputElement).checked;
    mostrarPantalla('menu');
  });

  // Selectores de Dificultad
  renderSelectorDificultad('selector-dif-memoria', Estado.dificultad, d => { Estado.dificultad = d; Memoria.comenzar(d); });
  renderSelectorDificultad('selector-dif-atencion', Estado.dificultad, d => { Estado.dificultad = d; Atencion.comenzar(d); });
  renderSelectorDificultad('selector-dif-coordinacion', Estado.dificultad, d => { Estado.dificultad = d; Coordinacion.comenzar(d); });
  renderSelectorDificultad('selector-dif-viaje', Estado.dificultad, d => { Estado.dificultad = d; Viaje.comenzar(d); });
  renderSelectorDificultad('selector-dif-palabras', Estado.dificultad, d => { Estado.dificultad = d; Palabras.comenzar(d); });

  // Controles Viaje Espacial
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && Estado.juegoActivo === 'viaje') {
      e.preventDefault();
      Viaje.saltar();
    }
  });

  $('#canvas-viaje').addEventListener('touchstart', (e) => {
    e.preventDefault();
    Viaje.saltar();
  });
  $('#canvas-viaje').addEventListener('click', () => Viaje.saltar());

  $('#btn-volver-desde-progreso').addEventListener('click', () => { Sonido.click(); mostrarPantalla('menu'); });
  $('#btn-exportar').addEventListener('click', () => { Sonido.click(); exportarProgreso(); });
});
