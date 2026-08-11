import './style.css';
import type {
  Dificultad, JuegoId, EstadoGlobal, DatosResumen,
  Sesion, ConfigTerapia, Obstaculo, EstrellaItem, ItemMemoria
} from './types';

// ============================================================
// SÍNTESIS DE VOZ Y FEEDBACK PARA OSCAR
// ============================================================
export function hablarMensaje(mensaje: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const texto = `${mensaje}, ¡muy bien Oscar!`;
    const utterance = new SpeechSynthesisUtterance(texto);
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
// AUDIO SINTETIZADO (WEB AUDIO API)
// ============================================================
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
  saliencia: false,
  multi: true,
  enfoque: false,
  fotos: []
};

try {
  const guardado = localStorage.getItem('oscar_config_terapia');
  if (guardado) Object.assign(Config, JSON.parse(guardado));
} catch { /* ignore */ }

function guardarConfig() {
  localStorage.setItem('oscar_config_terapia', JSON.stringify(Config));
}

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Elemento no encontrado: ${sel}`);
  return el;
};

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
// REGISTRO DE SESIONES (PROGRESO)
// ============================================================
function registrarSesion(
  juego: JuegoId,
  nivel: Dificultad,
  puntaje: number,
  exitoso: boolean,
  duracion: number,
  stats: Record<string, string | number>,
  tiempoIzq: number | null = null,
  tiempoDer: number | null = null
) {
  const sesion: Sesion = {
    fecha: new Date().toISOString(),
    juego,
    nivel,
    puntaje,
    exitoso,
    duracion,
    stats,
    tiempoIzq,
    tiempoDer
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
            <div style="font-size:0.85rem; color:var(--texto-suave);">${new Date(s.fecha).toLocaleDateString()} ${new Date(s.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          </div>
          <span style="font-size: 1.1rem; font-weight:700; color:var(--primario);">${s.puntaje} pts</span>
        </div>
      `).join('')}
    </div>
  `;
}

function exportarProgreso() {
  let historial: Sesion[] = [];
  try {
    historial = JSON.parse(localStorage.getItem('oscar_historial_sesiones') || '[]');
  } catch { /* ignore */ }

  const lineas = [
    '==================================================',
    'REPORTE DE REHABILITACIÓN COGNITIVA - PACIENTE OSCAR',
    `Fecha del reporte: ${new Date().toLocaleString()}`,
    '==================================================\n',
    `Total de sesiones: ${historial.length}`,
    '\nDETALLE DE SESIONES:'
  ];

  historial.forEach((s, idx) => {
    lineas.push(
      `[${idx + 1}] ${new Date(s.fecha).toLocaleString()} | Juego: ${s.juego.toUpperCase()} | Nivel: ${s.nivel} | Puntaje: ${s.puntaje} pts | Duración: ${s.duracion}s`
    );
  });

  const blob = new Blob([lineas.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte_rehabilitacion_oscar_${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// COMPONENTE: SELECTOR DE DIFICULTAD
// ============================================================
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

// ============================================================
// MODAL DE RESUMEN Y FINALIZACIÓN
// ============================================================
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
    hablarMensaje('¡Excelente trabajo en este ejercicio!');
    vibrarAcierto();
  }

  $('#modal-resumen').classList.add('activo');
}

// ============================================================
// MINIJUEGO 1: MEMORIA DE PAREJAS
// ============================================================
class JuegoMemoria {
  private cartas: ItemMemoria[] = [];
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

    const ems = ['🍎', '🍌', '🍇', '🍓', '🍊', '🍋', '🐶', '🐱', '🚗', '⭐', '🌸', '🍕'];
    this.totalParejas = dif === 'facil' ? 4 : dif === 'medio' ? 6 : 8;
    const seleccionados = ems.slice(0, this.totalParejas);

    const items: ItemMemoria[] = [];
    let id = 0;
    seleccionados.forEach(val => {
      items.push({ id: id++, valor: val, esFoto: false, descubierta: false, emparejada: false });
      items.push({ id: id++, valor: val, esFoto: false, descubierta: false, emparejada: false });
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
      const btn = document.createElement('div');
      btn.className = `carta-memoria ${carta.descubierta || carta.emparejada ? 'volteada' : ''} ${carta.emparejada ? 'emparejada' : ''}`;
      btn.textContent = carta.descubierta || carta.emparejada ? carta.valor : '❓';
      btn.addEventListener('click', () => this.voltear(idx));
      grid.appendChild(btn);
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

      if (this.cartas[i1].valor === this.cartas[i2].valor) {
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
            mensaje: 'Completaste todas las parejas de cartas correctamente.',
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

  siguienteRonda(dif: Dificultad) {
    $('#ate-ronda').textContent = `${this.ronda}/${this.maxRondas}`;
    $('#ate-puntos').textContent = this.puntos.toString();

    const grid = $('#grid-atencion');
    grid.innerHTML = '';

    const cantidad = dif === 'facil' ? 4 : dif === 'medio' ? 6 : 9;
    const baseEmoji = '🟢';
    const distractorEmoji = '🔴';

    let target = Math.floor(Math.random() * cantidad);
    if (Config.hemianopsia && Math.random() < 0.7) {
      target = 0;
    }
    this.targetIdx = target;

    for (let i = 0; i < cantidad; i++) {
      const item = document.createElement('div');
      item.className = 'item-atencion';
      item.textContent = i === target ? distractorEmoji : baseEmoji;
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
          mensaje: 'Lograste identificar todos los elementos diferentes.',
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
// MINIJUEGO 3: COORDINACIÓN Y REFLEJOS (ESTRELLAS)
// ============================================================
class JuegoCoordinacion {
  private aciertos: number = 0;
  private escapados: number = 0;
  private maxEstrellas: number = 10;
  private totalAparecidas: number = 0;
  private timerSpawn: number = 0;
  private inicioTiempo: number = 0;

  comenzar(dif: Dificultad) {
    this.aciertos = 0;
    this.escapados = 0;
    this.totalAparecidas = 0;
    this.inicioTiempo = Date.now();
    $('#coo-aciertos').textContent = '0';
    $('#coo-escapados').textContent = '0';

    const area = $('#area-coordinacion');
    area.innerHTML = '';

    const vel = dif === 'facil' ? 2500 : dif === 'medio' ? 1800 : 1200;
    window.clearInterval(this.timerSpawn);
    this.timerSpawn = window.setInterval(() => this.aparecerEstrella(area, vel), vel);
    this.aparecerEstrella(area, vel);
  }

  private aparecerEstrella(area: HTMLElement, vel: number) {
    if (this.totalAparecidas >= this.maxEstrellas) {
      window.clearInterval(this.timerSpawn);
      window.setTimeout(() => this.finalizar(), 1000);
      return;
    }

    area.innerHTML = '';
    this.totalAparecidas++;

    const star = document.createElement('div');
    star.className = 'estrella-target';
    star.textContent = '⭐';

    let posX = Math.random() * 80 + 10;
    if (Config.hemianopsia && Math.random() < 0.7) {
      posX = Math.random() * 40 + 5;
    }

    const posY = Math.random() * 70 + 15;
    star.style.left = `${posX}%`;
    star.style.top = `${posY}%`;

    let tocada = false;
    star.addEventListener('click', () => {
      if (tocada) return;
      tocada = true;
      Sonido.acierto();
      this.aciertos++;
      $('#coo-aciertos').textContent = this.aciertos.toString();
      star.remove();
    });

    area.appendChild(star);

    window.setTimeout(() => {
      if (!tocada && star.parentElement) {
        this.escapados++;
        $('#coo-escapados').textContent = this.escapados.toString();
        star.remove();
      }
    }, vel - 100);
  }

  private finalizar() {
    const duracion = Math.floor((Date.now() - this.inicioTiempo) / 1000);
    const pts = this.aciertos * 10;
    registrarSesion('coordinacion', Estado.dificultad, pts, true, duracion, { Aciertos: this.aciertos, Escapados: this.escapados });

    mostrarResumen({
      titulo: '✋ ¡Muy Bien Oscar!',
      mensaje: 'Reaccionaste con gran destreza.',
      stats: [
        { etiqueta: 'Estrellas Atrapadas', valor: `${this.aciertos}/${this.maxEstrellas}` },
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
// MINIJUEGO 4: VIAJE ESPACIAL (CANVAS 2D)
// ============================================================
class JuegoViaje {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number = 0;
  private jugadorY: number = 200;
  private velocidadY: number = 0;
  private gravedad: number = 0.45;
  private fuerzaSalto: number = -8.5;
  private puntos: number = 0;
  private vidas: number = 3;
  private obstaculos: Obstaculo[] = [];
  private estrellas: EstrellaItem[] = [];
  private running: boolean = false;

  comenzar(dif: Dificultad) {
    this.canvas = $('#canvas-viaje') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.jugadorY = 200;
    this.velocidadY = 0;
    this.puntos = 0;
    this.vidas = dif === 'facil' ? 5 : dif === 'medio' ? 3 : 2;
    this.obstaculos = [];
    this.estrellas = [];

    $('#via-puntos').textContent = '0';
    $('#via-vidas').textContent = '❤️'.repeat(this.vidas);
    $('#viaje-overlay').style.display = 'none';

    this.running = true;
    this.loop();
  }

  saltar() {
    if (!this.running) return;
    Sonido.click();
    this.velocidadY = this.fuerzaSalto;
  }

  private loop() {
    if (!this.running || !this.ctx || !this.canvas) return;

    this.velocidadY += this.gravedad;
    this.jugadorY += this.velocidadY;

    if (this.jugadorY > this.canvas.height - 40) {
      this.jugadorY = this.canvas.height - 40;
      this.velocidadY = 0;
    }
    if (this.jugadorY < 20) {
      this.jugadorY = 20;
      this.velocidadY = 0;
    }

    if (Math.random() < 0.02) {
      this.obstaculos.push({
        x: this.canvas.width + 30,
        y: Math.random() * (this.canvas.height - 100) + 20,
        w: 40,
        h: 40,
        tipo: 'roca',
        emoji: '🪨',
        contado: false,
        golpeado: false
      });
    }

    if (Math.random() < 0.03) {
      this.estrellas.push({
        x: this.canvas.width + 30,
        y: Math.random() * (this.canvas.height - 100) + 20,
        r: 18,
        tomada: false
      });
    }

    this.ctx.fillStyle = '#111827';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.font = '36px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🚀', 100, this.jugadorY);

    for (let i = this.obstaculos.length - 1; i >= 0; i--) {
      const obs = this.obstaculos[i];
      obs.x -= 4;
      this.ctx.fillText(obs.emoji, obs.x, obs.y);

      const dist = Math.hypot(100 - obs.x, this.jugadorY - obs.y);
      if (dist < 32 && !obs.golpeado) {
        obs.golpeado = true;
        Sonido.error();
        this.vidas--;
        $('#via-vidas').textContent = '❤️'.repeat(Math.max(0, this.vidas));

        if (this.vidas <= 0) {
          this.finalizar();
          return;
        }
      }

      if (obs.x < -40) this.obstaculos.splice(i, 1);
    }

    for (let i = this.estrellas.length - 1; i >= 0; i--) {
      const est = this.estrellas[i];
      est.x -= 4;
      this.ctx.fillText('⭐', est.x, est.y);

      const dist = Math.hypot(100 - est.x, this.jugadorY - est.y);
      if (dist < 35 && !est.tomada) {
        est.tomada = true;
        Sonido.acierto();
        this.puntos += 10;
        $('#via-puntos').textContent = this.puntos.toString();
        this.estrellas.splice(i, 1);
      } else if (est.x < -40) {
        this.estrellas.splice(i, 1);
      }
    }

    this.animId = requestAnimationFrame(() => this.loop());
  }

  private finalizar() {
    this.running = false;
    cancelAnimationFrame(this.animId);

    registrarSesion('viaje', Estado.dificultad, this.puntos, true, 30, { VidasRestantes: this.vidas });

    mostrarResumen({
      titulo: '🚀 ¡Excelente Vuelo!',
      mensaje: 'Navegaste por el espacio y sumaste puntos acumulados.',
      stats: [{ etiqueta: 'Puntaje Espacial', valor: `${this.puntos} pts` }],
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

const Viaje = new JuegoViaje();

// ============================================================
// MINIJUEGO 5: DESAFÍO DE PALABRAS
// ============================================================
class JuegoPalabras {
  private palabraActual: string = '';
  private letrasMezcladas: string[] = [];
  private pestaLetras: string[] = [];
  private puntos: number = 0;
  private ronda: number = 1;

  private banco = [
    { p: 'SOL', pista: 'Estrella que ilumina el día ☀️' },
    { p: 'LUNA', pista: 'Nos ilumina por la noche 🌙' },
    { p: 'FLOR', pista: 'Crece en el jardín 🌸' },
    { p: 'CASA', pista: 'Nuestro hogar 🏠' },
    { p: 'AGUA', pista: 'Esencial para beber 💧' }
  ];

  comenzar(dif: Dificultad) {
    this.ronda = 1;
    this.puntos = 0;
    this.cargarRonda(dif);
  }

  private cargarRonda(_dif: Dificultad) {
    const item = this.banco[(this.ronda - 1) % this.banco.length];
    this.palabraActual = item.p;
    $('#palabra-pista').textContent = item.pista;
    $('#pal-progreso').textContent = `${this.ronda}/5`;

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
            mensaje: 'Completaste todas las palabras con éxito.',
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
  $('#btn-sonido-barra').addEventListener('click', (e) => {
    Sonido.activo = !Sonido.activo;
    (e.currentTarget as HTMLElement).textContent = Sonido.activo ? '🔊' : '🔇';
  });

  $('#btn-barra-reiniciar').addEventListener('click', () => {
    Sonido.click();
    if (Estado.juegoActivo === 'memoria') Memoria.comenzar(Estado.dificultad);
    else if (Estado.juegoActivo === 'atencion') Atencion.comenzar(Estado.dificultad);
    else if (Estado.juegoActivo === 'coordinacion') Coordinacion.comenzar(Estado.dificultad);
    else if (Estado.juegoActivo === 'viaje') Viaje.comenzar(Estado.dificultad);
    else if (Estado.juegoActivo === 'palabras') Palabras.comenzar(Estado.dificultad);
  });

  $('#btn-salir').addEventListener('click', () => {
    Sonido.click();
    Memoria.detener(); Atencion.detener(); Coordinacion.detener(); Viaje.detener(); Palabras.detener();
    mostrarPantalla('menu');
  });

  // Navegación Menú
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

  // Configuración
  $('#btn-volver-desde-config').addEventListener('click', () => {
    Sonido.click();
    Config.hemianopsia = ($('#chk-hemianopsia') as HTMLInputElement).checked;
    Config.cimt = ($('#chk-cimt') as HTMLInputElement).checked;
    Config.multi = ($('#chk-multi') as HTMLInputElement).checked;
    Config.enfoque = ($('#chk-enfoque') as HTMLInputElement).checked;
    guardarConfig();
    mostrarPantalla('menu');
  });

  // Controles Barra Juego
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

  // Selectores de Dificultad
  renderSelectorDificultad('selector-dif-memoria', Estado.dificultad, d => { Estado.dificultad = d; Memoria.comenzar(d); });
  renderSelectorDificultad('selector-dif-atencion', Estado.dificultad, d => { Estado.dificultad = d; Atencion.comenzar(d); });
  renderSelectorDificultad('selector-dif-coordinacion', Estado.dificultad, d => { Estado.dificultad = d; Coordinacion.comenzar(d); });
  renderSelectorDificultad('selector-dif-viaje', Estado.dificultad, d => { Estado.dificultad = d; Viaje.comenzar(d); });
  renderSelectorDificultad('selector-dif-palabras', Estado.dificultad, d => { Estado.dificultad = d; Palabras.comenzar(d); });

  // Evento Teclado / Tap para Salto en Viaje
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

  // Exportar e Historial
  $('#btn-volver-desde-progreso').addEventListener('click', () => { Sonido.click(); mostrarPantalla('menu'); });
  $('#btn-exportar').addEventListener('click', () => { Sonido.click(); exportarProgreso(); });
});

