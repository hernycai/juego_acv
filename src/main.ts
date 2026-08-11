import './style.css';
import type {
  Dificultad, JuegoId, EstadoGlobal, DatosResumen,
  Sesion, ConfigTerapia, ObstaculoMario, MonedaMario, CartaMemoriaSVG
} from './types';

// ============================================================
// BANCO DE FRASES DE BRISA
// ============================================================
const FRASES_BRISA = [
  "¡Hola Oscar! Cada ejercicio que hacés fortalece tus conexiones neuronales.",
  "¡Vas excelente Oscar! La constancia es el secreto del éxito.",
  "¡Me encanta acompañarte en tu entrenamiento de hoy, Oscar!",
  "¡Tómate todo el tiempo que necesites, Oscar! Lo importante es practicar sin apuro.",
  "¡Qué alegría verte ejercitar hoy, Oscar! Cada día lo hacés mejor."
];

// ============================================================
// SÍNTESIS DE VOZ Y AUDIO
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

class GeneradorSonido {
  private ctx: AudioContext | null = null;
  public activo: boolean = true;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  click() {
    if (!this.activo) return;
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  acierto() {
    if (!this.activo) return;
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08);
    osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  error() {
    if (!this.activo) return;
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.setValueAtTime(140, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }
}

const Sonido = new GeneradorSonido();

// ============================================================
// ILUSTRACIONES SVG DE ALTA CALIDAD PARA EL JUEGO DE MEMORIA
// ============================================================
const ILUSTRACIONES_SVG: Record<string, string> = {
  sol: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="24" fill="#FFB703"/><g stroke="#FB8500" stroke-width="6" stroke-linecap="round"><line x1="50" y1="10" x2="50" y2="18"/><line x1="50" y1="82" x2="50" y2="90"/><line x1="10" y1="50" x2="18" y2="50"/><line x1="82" y1="50" x2="90" y2="50"/><line x1="22" y1="22" x2="28" y2="28"/><line x1="72" y1="72" x2="78" y2="78"/><line x1="22" y1="78" x2="28" y2="72"/><line x1="72" y1="28" x2="78" y2="22"/></g></svg>`,
  casa: `<svg viewBox="0 0 100 100"><polygon points="50,15 15,45 85,45" fill="#E76F51"/><rect x="25" y="45" width="50" height="40" fill="#F4A261" rx="4"/><rect x="42" y="60" width="16" height="25" fill="#264653" rx="2"/><rect x="30" y="52" width="10" height="12" fill="#E9C46A"/><rect x="60" y="52" width="10" height="12" fill="#E9C46A"/></svg>`,
  coche: `<svg viewBox="0 0 100 100"><rect x="15" y="45" width="70" height="25" fill="#2A9D8F" rx="8"/><path d="M 30,45 L 40,25 L 65,25 L 75,45 Z" fill="#2A9D8F"/><circle cx="32" cy="70" r="10" fill="#264653"/><circle cx="32" cy="70" r="4" fill="#E9C46A"/><circle cx="68" cy="70" r="10" fill="#264653"/><circle cx="68" cy="70" r="4" fill="#E9C46A"/></svg>`,
  flor: `<svg viewBox="0 0 100 100"><circle cx="50" cy="30" r="12" fill="#F15BB5"/><circle cx="70" cy="50" r="12" fill="#F15BB5"/><circle cx="50" cy="70" r="12" fill="#F15BB5"/><circle cx="30" cy="50" r="12" fill="#F15BB5"/><circle cx="50" cy="50" r="14" fill="#FEE440"/></svg>`,
  perro: `<svg viewBox="0 0 100 100"><path d="M 25 35 C 25 15, 75 15, 75 35 C 75 60, 25 60, 25 35 Z" fill="#D4A373"/><ellipse cx="20" cy="40" rx="8" ry="18" fill="#A5A58D"/><ellipse cx="80" cy="40" rx="8" ry="18" fill="#A5A58D"/><circle cx="40" cy="35" r="4" fill="#264653"/><circle cx="60" cy="35" r="4" fill="#264653"/><ellipse cx="50" cy="45" rx="7" ry="5" fill="#264653"/></svg>`,
  cohete: `<svg viewBox="0 0 100 100"><path d="M 50 15 C 65 35, 65 65, 65 75 L 35 75 C 35 65, 35 35, 50 15 Z" fill="#E63946"/><polygon points="35,65 15,80 35,75" fill="#457B9D"/><polygon points="65,65 85,80 65,75" fill="#457B9D"/><circle cx="50" cy="42" r="8" fill="#A8DADC"/><polygon points="42,75 50,90 58,75" fill="#F4A261"/></svg>`,
  manzana: `<svg viewBox="0 0 100 100"><path d="M 50 30 C 30 15, 15 40, 25 70 C 35 90, 65 90, 75 70 C 85 40, 70 15, 50 30 Z" fill="#E63946"/><path d="M 50 30 Q 55 15 62 12" stroke="#606C38" stroke-width="4" fill="none"/><path d="M 52 22 C 60 15, 70 20, 68 26 Z" fill="#2A9D8F"/></svg>`,
  estrella: `<svg viewBox="0 0 100 100"><polygon points="50,10 63,38 93,38 68,58 78,88 50,70 22,88 32,58 7,38 37,38" fill="#FFD166"/></svg>`
};

// ============================================================
// ESTADO GLOBAL Y CONFIGURACIÓN TERAPÉUTICA
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

// ============================================================
// INTERACCIÓN CON BRISA
// ============================================================
function abrirModalBrisa() {
  const idx = Math.floor(Math.random() * FRASES_BRISA.length);
  const frase = FRASES_BRISA[idx];
  $('#brisa-mensaje').textContent = `"${frase}"`;
  $('#modal-brisa').classList.add('activo');
  if (Config.multi) hablarMensaje(frase);
}

// ============================================================
// MANEJO DE PANTALLAS
// ============================================================
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

// ============================================================
// REGISTRO Y EXPORTACIÓN DE SESIONES
// ============================================================
function registrarSesion(
  juego: JuegoId,
  nivel: Dificultad,
  puntaje: number,
  exitoso: boolean,
  duracion: number,
  stats: Record<string, string | number>
) {
  const sesion: Sesion = {
    fecha: new Date().toISOString(),
    juego,
    nivel,
    puntaje,
    exitoso,
    duracion,
    stats
  };

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
  try {
    historial = JSON.parse(localStorage.getItem('oscar_historial_sesiones') || '[]');
  } catch { /* ignore */ }

  if (historial.length === 0) {
    contGeneral.innerHTML = '<p class="subtitulo">Aún no hay sesiones registradas. ¡Comenzá a jugar para ver tu evolución!</p>';
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
        <small>Sesiones</small>
      </div>
      <div style="background:var(--exito-suave); padding: 16px; border-radius:16px; text-align:center;">
        <span style="font-size: 2rem;">🏆</span>
        <h4>${mejorPuntaje}</h4>
        <small>Mejor Puntaje</small>
      </div>
    </div>
  `;

  contHistorial.innerHTML = `
    <h3>Historial Reciente</h3>
    <div style="display:flex; flex-direction:column; gap: 10px; margin-top:12px;">
      ${historial.slice(0, 10).map(s => `
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
    hablarMensaje('¡Excelente trabajo Oscar! Completaste el ejercicio.');
  }

  $('#modal-resumen').classList.add('activo');
}

// ============================================================
// MINIJUEGO 1: MEMORIA DE ILUSTRACIONES
// ============================================================
class JuegoMemoria {
  private cartas: CartaMemoriaSVG[] = [];
  private seleccionadas: number[] = [];
  private bloqueado: boolean = false;
  private intentos: number = 0;
  private parejasEncontradas: number = 0;
  private totalParejas: number = 0;
  private inicioTiempo: number = 0;
  private timerInterval: number = 0;

  comenzar(dif: Dificultad) {
    Estado.terminado = false;
    this.intentos = 0;
    this.parejasEncontradas = 0;
    this.seleccionadas = [];
    this.bloqueado = false;
    this.inicioTiempo = Date.now();

    const llaves = Object.keys(ILUSTRACIONES_SVG);
    this.totalParejas = dif === 'facil' ? 4 : dif === 'medio' ? 6 : 8;
    const seleccionados = llaves.slice(0, this.totalParejas);

    const items: CartaMemoriaSVG[] = [];
    let id = 0;
    seleccionados.forEach(llave => {
      const svgCode = ILUSTRACIONES_SVG[llave];
      items.push({ id: id++, nombre: llave, svg: svgCode, descubierta: false, emparejada: false });
      items.push({ id: id++, nombre: llave, svg: svgCode, descubierta: false, emparejada: false });
    });

    this.cartas = items.sort(() => Math.random() - 0.5);
    this.render();

    window.clearInterval(this.timerInterval);
    this.timerInterval = window.setInterval(() => this.actualizarTiempo(), 1000);
  }

  private render() {
    $('#mem-intentos').textContent = this.intentos.toString();
    const grid = $('#grid-memoria');
    grid.innerHTML = '';

    this.cartas.forEach((carta, idx) => {
      const cardEl = document.createElement('div');
      cardEl.className = `carta-memoria ${carta.descubierta || carta.emparejada ? 'volteada' : ''} ${carta.emparejada ? 'emparejada' : ''}`;

      if (carta.descubierta || carta.emparejada) {
        cardEl.innerHTML = carta.svg;
      } else {
        cardEl.innerHTML = `<span class="carta-reverso">❓</span>`;
      }

      cardEl.addEventListener('click', () => this.voltear(idx));
      grid.appendChild(cardEl);
    });
  }

  private voltear(idx: number) {
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
          window.clearInterval(this.timerInterval);
          const duracion = Math.floor((Date.now() - this.inicioTiempo) / 1000);
          const pts = Math.max(10, 100 - this.intentos * 5);
          registrarSesion('memoria', Estado.dificultad, pts, true, duracion, { Intentos: this.intentos });

          mostrarResumen({
            titulo: '🧠 ¡Memoria Excelente!',
            mensaje: 'Encontraste todas las parejas de ilustraciones correctamente.',
            stats: [
              { etiqueta: 'Intentos', valor: this.intentos },
              { etiqueta: 'Tiempo', valor: `${duracion} segundos` },
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
        window.setTimeout(() => {
          this.cartas[i1].descubierta = false;
          this.cartas[i2].descubierta = false;
          this.seleccionadas = [];
          this.bloqueado = false;
          this.render();
        }, 1000);
      }
    }
  }

  private actualizarTiempo() {
    const dur = Math.floor((Date.now() - this.inicioTiempo) / 1000);
    const min = Math.floor(dur / 60).toString().padStart(2, '0');
    const seg = (dur % 60).toString().padStart(2, '0');
    $('#mem-tiempo').textContent = `${min}:${seg}`;
  }

  detener() {
    window.clearInterval(this.timerInterval);
  }
}

const Memoria = new JuegoMemoria();

// ============================================================
// MINIJUEGO 2: ATENCIÓN VISUAL
// ============================================================
class JuegoAtencion {
  private ronda: number = 1;
  private maxRondas: number = 5;
  private puntos: number = 0;
  private targetIdx: number = 0;
  private inicioTiempo: number = 0;

  comenzar(dif: Dificultad) {
    this.ronda = 1;
    this.puntos = 0;
    this.inicioTiempo = Date.now();
    this.siguienteRonda(dif);
  }

  siguienteRonda(_dif: Dificultad) {
    $('#ate-ronda').textContent = `${this.ronda}/${this.maxRondas}`;
    $('#ate-puntos').textContent = this.puntos.toString();

    const grid = $('#grid-atencion');
    grid.innerHTML = '';

    const cantidad = 9;
    const svgNormal = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="#2A9D8F"/></svg>`;
    const svgDiferente = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="#E76F51"/></svg>`;

    let target = Math.floor(Math.random() * cantidad);
    if (Config.hemianopsia && Math.random() < 0.7) {
      target = 0; // Columna izquierda
    }
    this.targetIdx = target;

    for (let i = 0; i < cantidad; i++) {
      const item = document.createElement('div');
      item.className = 'item-atencion';
      item.innerHTML = i === target ? svgDiferente : svgNormal;
      item.addEventListener('click', () => this.verificar(i));
      grid.appendChild(item);
    }
  }

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
          mensaje: 'Identificaste correctamente todas las figuras diferentes.',
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
  }

  detener() { /* noop */ }
}

const Atencion = new JuegoAtencion();

// ============================================================
// MINIJUEGO 3: EXPLOTAR GLOBOS / COORDINACIÓN
// ============================================================
class JuegoCoordinacion {
  private aciertos: number = 0;
  private escapados: number = 0;
  private maxGlobos: number = 10;
  private totalAparecidos: number = 0;
  private timerSpawn: number = 0;
  private inicioTiempo: number = 0;

  comenzar(dif: Dificultad) {
    this.aciertos = 0;
    this.escapados = 0;
    this.totalAparecidos = 0;
    this.inicioTiempo = Date.now();
    $('#coo-aciertos').textContent = '0';
    $('#coo-escapados').textContent = '0';

    const area = $('#area-coordinacion');
    area.innerHTML = '';

    const vel = dif === 'facil' ? 2600 : dif === 'medio' ? 1900 : 1300;
    window.clearInterval(this.timerSpawn);
    this.timerSpawn = window.setInterval(() => this.aparecerGlobo(area, vel), vel);
    this.aparecerGlobo(area, vel);
  }

  private aparecerGlobo(area: HTMLElement, vel: number) {
    if (this.totalAparecidos >= this.maxGlobos) {
      window.clearInterval(this.timerSpawn);
      window.setTimeout(() => this.finalizar(), 1000);
      return;
    }

    area.innerHTML = '';
    this.totalAparecidos++;

    const globo = document.createElement('div');
    globo.className = 'globo-target';

    const colores = ['#e76f51', '#2a9d8f', '#3a86ff', '#9b5de5', '#f15bb5'];
    const color = colores[Math.floor(Math.random() * colores.length)];

    globo.innerHTML = `
      <div class="globo-cuerpo" style="background-color: ${color}">🎈</div>
      <div class="globo-nudo" style="background-color: ${color}"></div>
      <div class="globo-hilo"></div>
    `;

    // Límites estrictos para no salir del cuadro
    let posX = Math.random() * 70 + 15; // 15% a 85%
    if (Config.hemianopsia && Math.random() < 0.7) {
      posX = Math.random() * 35 + 10; // Lado izquierdo
    }

    const posY = Math.random() * 55 + 20; // 20% a 75%
    globo.style.left = `${posX}%`;
    globo.style.top = `${posY}%`;

    let tocado = false;
    globo.addEventListener('click', () => {
      if (tocado) return;
      tocado = true;
      Sonido.acierto();
      this.aciertos++;
      $('#coo-aciertos').textContent = this.aciertos.toString();
      globo.remove();
    });

    area.appendChild(globo);

    window.setTimeout(() => {
      if (!tocado && globo.parentElement) {
        this.escapados++;
        $('#coo-escapados').textContent = this.escapados.toString();
        globo.remove();
      }
    }, vel - 100);
  }

  private finalizar() {
    const duracion = Math.floor((Date.now() - this.inicioTiempo) / 1000);
    const pts = this.aciertos * 10;
    registrarSesion('coordinacion', Estado.dificultad, pts, true, duracion, { Explotados: this.aciertos, Escapados: this.escapados });

    mostrarResumen({
      titulo: '🎈 ¡Muy Bien Oscar!',
      mensaje: 'Explotaste los globos con excelente coordinación.',
      stats: [
        { etiqueta: 'Globos Explotados', valor: `${this.aciertos}/${this.maxGlobos}` },
        { etiqueta: 'Puntaje Final', valor: `${pts} pts` }
      ],
      juego: 'coordinacion',
      nivel: Estado.dificultad,
      exitoso: true,
      puntaje: pts
    });
  }

  detener() {
    window.clearInterval(this.timerSpawn);
  }
}

const Coordinacion = new JuegoCoordinacion();

// ============================================================
// MINIJUEGO 4: MARIO BROS 2D PLATAFORMA (AVENTURA ESPACIAL)
// ============================================================
class JuegoViajeMario {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number = 0;
  private jugadorY: number = 260;
  private velocidadY: number = 0;
  private enSuelo: boolean = true;
  private gravedad: number = 0.55;
  private fuerzaSalto: number = -11;
  private sueloY: number = 270;
  private puntos: number = 0;
  private vidas: number = 3;
  private obstaculos: ObstaculoMario[] = [];
  private monedas: MonedaMario[] = [];
  private running: boolean = false;
  private scrollOffset: number = 0;

  comenzar(dif: Dificultad) {
    this.canvas = $('#canvas-viaje') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.jugadorY = this.sueloY;
    this.velocidadY = 0;
    this.enSuelo = true;
    this.puntos = 0;
    this.vidas = dif === 'facil' ? 5 : dif === 'medio' ? 3 : 2;
    this.obstaculos = [];
    this.monedas = [];
    this.scrollOffset = 0;

    $('#via-puntos').textContent = '0';
    $('#via-vidas').textContent = '❤️'.repeat(this.vidas);
    $('#viaje-overlay').style.display = 'none';

    this.running = true;
    this.loop();
  }

  saltar() {
    if (!this.running || !this.enSuelo) return;
    Sonido.click();
    this.velocidadY = this.fuerzaSalto;
    this.enSuelo = false;
  }

  private loop() {
    if (!this.running || !this.ctx || !this.canvas) return;

    this.scrollOffset += 3;

    // Física
    this.velocidadY += this.gravedad;
    this.jugadorY += this.velocidadY;

    if (this.jugadorY >= this.sueloY) {
      this.jugadorY = this.sueloY;
      this.velocidadY = 0;
      this.enSuelo = true;
    }

    // Spawn Obstáculos sobre la plataforma
    if (Math.random() < 0.018) {
      const tipos: ('tubería' | 'bloque' | 'hongo')[] = ['tubería', 'bloque', 'hongo'];
      const t = tipos[Math.floor(Math.random() * tipos.length)];
      this.obstaculos.push({
        x: this.canvas.width + 40,
        y: this.sueloY - (t === 'tubería' ? 45 : t === 'bloque' ? 35 : 25),
        w: 35,
        h: t === 'tubería' ? 45 : t === 'bloque' ? 35 : 25,
        tipo: t,
        golpeado: false
      });
    }

    // Spawn Monedas flotando
    if (Math.random() < 0.025) {
      this.monedas.push({
        x: this.canvas.width + 40,
        y: this.sueloY - (Math.random() * 80 + 50),
        r: 16,
        tomada: false
      });
    }

    // --- DIBUJO ---
    // Cielo Mario
    this.ctx.fillStyle = '#5c94fc';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Nubes
    this.ctx.fillStyle = '#ffffff';
    const cloudX = (100 - (this.scrollOffset * 0.5)) % (this.canvas.width + 200);
    this.ctx.beginPath();
    this.ctx.arc(cloudX, 70, 25, 0, Math.PI * 2);
    this.ctx.arc(cloudX + 30, 60, 30, 0, Math.PI * 2);
    this.ctx.arc(cloudX + 60, 70, 25, 0, Math.PI * 2);
    this.ctx.fill();

    // Plataforma / Suelo
    this.ctx.fillStyle = '#e76f51'; // Tierra
    this.ctx.fillRect(0, this.sueloY + 40, this.canvas.width, this.canvas.height - (this.sueloY + 40));
    this.ctx.fillStyle = '#2a9d8f'; // Pasto verde
    this.ctx.fillRect(0, this.sueloY + 30, this.canvas.width, 10);

    // Jugador Oscar (Personaje 2D)
    this.ctx.font = '40px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText('🏃', 120, this.jugadorY + 35);

    // Obstáculos
    for (let i = this.obstaculos.length - 1; i >= 0; i--) {
      const obs = this.obstaculos[i];
      obs.x -= 3.5;

      if (obs.tipo === 'tubería') {
        this.ctx.fillStyle = '#38b000';
        this.ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        this.ctx.strokeStyle = '#1b4332';
        this.ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      } else if (obs.tipo === 'bloque') {
        this.ctx.fillStyle = '#f4a261';
        this.ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px sans-serif';
        this.ctx.fillText('?', obs.x + obs.w / 2, obs.y + obs.h);
      } else {
        this.ctx.font = '30px sans-serif';
        this.ctx.fillText('🍄', obs.x + obs.w / 2, obs.y + obs.h);
      }

      // Colisión
      const dist = Math.hypot(120 - (obs.x + obs.w / 2), (this.jugadorY + 10) - (obs.y + obs.h / 2));
      if (dist < 30 && !obs.golpeado) {
        obs.golpeado = true;
        Sonido.error();
        this.vidas--;
        $('#via-vidas').textContent = '❤️'.repeat(Math.max(0, this.vidas));

        if (this.vidas <= 0) {
          this.finalizar();
          return;
        }
      }

      if (obs.x < -50) this.obstaculos.splice(i, 1);
    }

    // Monedas
    for (let i = this.monedas.length - 1; i >= 0; i--) {
      const mon = this.monedas[i];
      mon.x -= 3.5;

      this.ctx.font = '28px sans-serif';
      this.ctx.fillText('🪙', mon.x, mon.y);

      const dist = Math.hypot(120 - mon.x, (this.jugadorY + 10) - mon.y);
      if (dist < 32 && !mon.tomada) {
        mon.tomada = true;
        Sonido.acierto();
        this.puntos += 10;
        $('#via-puntos').textContent = this.puntos.toString();
        this.monedas.splice(i, 1);
      } else if (mon.x < -40) {
        this.monedas.splice(i, 1);
      }
    }

    this.animId = requestAnimationFrame(() => this.loop());
  }

  private finalizar() {
    this.running = false;
    cancelAnimationFrame(this.animId);

    registrarSesion('viaje', Estado.dificultad, this.puntos, true, 30, { Monedas: this.puntos });

    mostrarResumen({
      titulo: '🍄 ¡Gran Aventura Oscar!',
      mensaje: 'Recorriste la plataforma esquivando obstáculos.',
      stats: [{ etiqueta: 'Monedas Recolectadas', valor: `${this.puntos} 🪙` }],
      juego: 'viaje',
      nivel: Estado.dificultad,
      exitoso: true,
      puntaje: this.puntos
    });
  }

  detener() {
    this.running = false;
    cancelAnimationFrame(this.animId);
  }
}

const ViajeMario = new JuegoViajeMario();

// ============================================================
// MINIJUEGO 5: DESAFÍO DE PALABRAS (4, 5 Y 6 LETRAS ESTRUCTURADAS)
// ============================================================
class JuegoPalabras {
  private palabraActual: string = '';
  private letrasMezcladas: string[] = [];
  private pestaLetras: string[] = [];
  private puntos: number = 0;
  private ronda: number = 1;

  // Bancos de palabras categorizados estrictamente por longitud
  private bancoFacil = [
    { p: 'CASA', pista: 'Nuestro hogar 🏠' },
    { p: 'LUNA', pista: 'Nos ilumina por la noche 🌙' },
    { p: 'FLOR', pista: 'Crece en el jardín 🌸' },
    { p: 'GATO', pista: 'Felino compañero 🐱' },
    { p: 'AGUA', pista: 'Esencial para beber 💧' }
  ];

  private bancoMedio = [
    { p: 'ARBOL', pista: 'Nos da sombra y oxígeno 🌳' },
    { p: 'BARCO', pista: 'Navega por el mar ⛵' },
    { p: 'LIBRO', pista: 'Lleno de historias 📖' },
    { p: 'PLAYA', pista: 'Lugar de mar y arena 🏖️' },
    { p: 'FRUTA', pista: 'Alimento natural y sano 🍎' }
  ];

  private bancoDesafio = [
    { p: 'AMIGOS', pista: 'Compañeros de la vida 👥' },
    { p: 'JARDIN', pista: 'Lleno de plantas y flores 🌷' },
    { p: 'MUSICA', pista: 'Melodía que alegra el corazón 🎵' },
    { p: 'CAMINO', pista: 'Sendero para recorrer 🛤️' },
    { p: 'SOLIDE', pista: 'Firmeza y gran fortaleza 💪' }
  ];

  comenzar(dif: Dificultad) {
    this.ronda = 1;
    this.puntos = 0;
    this.cargarRonda(dif);
  }

  private cargarRonda(dif: Dificultad) {
    const banco = dif === 'facil' ? this.bancoFacil : dif === 'medio' ? this.bancoMedio : this.bancoDesafio;
    const len = dif === 'facil' ? 4 : dif === 'medio' ? 5 : 6;

    $('#pal-nivel-nombre').textContent = `${dif === 'facil' ? 'Fácil' : dif === 'medio' ? 'Medio' : 'Desafío'} (${len} letras)`;
    $('#pal-progreso').textContent = `${this.ronda}/5`;

    const item = banco[(this.ronda - 1) % banco.length];
    this.palabraActual = item.p;
    $('#palabra-pista').textContent = item.pista;

    this.pestaLetras = [];
    this.letrasMezcladas = item.p.split('').sort(() => Math.random() - 0.5);

    this.render();
  }

  private render() {
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
  }

  borrarLetra() {
    if (this.pestaLetras.length > 0) {
      Sonido.click();
      const devuelta = this.pestaLetras.pop()!;
      this.letrasMezcladas.push(devuelta);
      this.render();
    }
  }

  private verificar() {
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
            mensaje: `Completaste todas las palabras de ${this.palabraActual.length} letras con éxito.`,
            stats: [{ etiqueta: 'Puntaje', valor: `${this.puntos} pts` }],
            juego: 'palabras',
            nivel: Estado.dificultad,
            exitoso: true,
            puntaje: this.puntos
          });
        } else {
          window.setTimeout(() => this.cargarRonda(Estado.dificultad), 800);
        }
      } else {
        Sonido.error();
        window.setTimeout(() => {
          this.cargarRonda(Estado.dificultad);
        }, 1000);
      }
    }
  }

  detener() { /* noop */ }
}

const Palabras = new JuegoPalabras();

// ============================================================
// INICIALIZACIÓN DE EVENTOS GLOBAL Y BINDINGS
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Intro Presentación
  $('#btn-comenzar-intro').addEventListener('click', () => {
    Sonido.click();
    $('#pantalla-presentacion').classList.remove('activa');
    if (Config.multi) hablarMensaje('¡Bienvenido Oscar! Elegí el ejercicio que quieras realizar hoy.');
  });

  // Mascotas Brisa
  $('#btn-mascota-brisa').addEventListener('click', () => abrirModalBrisa());
  $('#btn-brisa-menu').addEventListener('click', () => abrirModalBrisa());
  $('#btn-brisa-cerrar').addEventListener('click', () => $('#modal-brisa').classList.remove('activo'));
  $('#btn-brisa-hablar-otra').addEventListener('click', () => abrirModalBrisa());

  // Navegación Menú
  $('#btn-juego-memoria').addEventListener('click', () => { Sonido.click(); mostrarPantalla('memoria'); Memoria.comenzar(Estado.dificultad); });
  $('#btn-juego-atencion').addEventListener('click', () => { Sonido.click(); mostrarPantalla('atencion'); Atencion.comenzar(Estado.dificultad); });
  $('#btn-juego-coordinacion').addEventListener('click', () => { Sonido.click(); mostrarPantalla('coordinacion'); Coordinacion.comenzar(Estado.dificultad); });
  $('#btn-juego-viaje').addEventListener('click', () => { Sonido.click(); mostrarPantalla('viaje'); });
  $('#btn-juego-palabras').addEventListener('click', () => { Sonido.click(); mostrarPantalla('palabras'); Palabras.comenzar(Estado.dificultad); });

  $('#btn-viaje-iniciar').addEventListener('click', () => { ViajeMario.comenzar(Estado.dificultad); });
  $('#btn-palabra-borrar').addEventListener('click', () => Palabras.borrarLetra());

  $('#btn-ir-progreso').addEventListener('click', () => { Sonido.click(); renderizarProgreso(); mostrarPantalla('progreso'); });
  $('#btn-ir-config').addEventListener('click', () => {
    Sonido.click();
    ($('#chk-hemianopsia') as HTMLInputElement).checked = Config.hemianopsia;
    ($('#chk-multi') as HTMLInputElement).checked = Config.multi;
    mostrarPantalla('config');
  });

  // Configuración
  $('#btn-volver-desde-config').addEventListener('click', () => {
    Sonido.click();
    Config.hemianopsia = ($('#chk-hemianopsia') as HTMLInputElement).checked;
    Config.multi = ($('#chk-multi') as HTMLInputElement).checked;
    mostrarPantalla('menu');
  });

  // Controles Barra Juego
  $('#btn-barra-menu').addEventListener('click', () => {
    Sonido.click();
    Memoria.detener(); Atencion.detener(); Coordinacion.detener(); ViajeMario.detener(); Palabras.detener();
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
    Memoria.detener(); Atencion.detener(); Coordinacion.detener(); ViajeMario.detener(); Palabras.detener();
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
    else if (Estado.juegoActivo === 'viaje') ViajeMario.comenzar(Estado.dificultad);
    else if (Estado.juegoActivo === 'palabras') Palabras.comenzar(Estado.dificultad);
  });

  // Selectores de Dificultad
  renderSelectorDificultad('selector-dif-memoria', Estado.dificultad, d => { Estado.dificultad = d; Memoria.comenzar(d); });
  renderSelectorDificultad('selector-dif-atencion', Estado.dificultad, d => { Estado.dificultad = d; Atencion.comenzar(d); });
  renderSelectorDificultad('selector-dif-coordinacion', Estado.dificultad, d => { Estado.dificultad = d; Coordinacion.comenzar(d); });
  renderSelectorDificultad('selector-dif-viaje', Estado.dificultad, d => { Estado.dificultad = d; ViajeMario.comenzar(d); });
  renderSelectorDificultad('selector-dif-palabras', Estado.dificultad, d => { Estado.dificultad = d; Palabras.comenzar(d); });

  // Evento Teclado / Tap para Salto en Mario
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && Estado.juegoActivo === 'viaje') {
      e.preventDefault();
      ViajeMario.saltar();
    }
  });

  $('#canvas-viaje').addEventListener('touchstart', (e) => {
    e.preventDefault();
    ViajeMario.saltar();
  });
  $('#canvas-viaje').addEventListener('click', () => ViajeMario.saltar());

  // Progreso
  $('#btn-volver-desde-progreso').addEventListener('click', () => { Sonido.click(); mostrarPantalla('menu'); });
});
