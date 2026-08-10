import './style.css';
import type {
  Dificultad, JuegoId, EstadoGlobal, Stat, DatosResumen,
  Sesion, ConfigTerapia, ConfigViaje, Obstaculo, EstrellaItem,
  FondoEstrella, ItemMemoria, Juego
} from './types';

// ============================================================
// main.ts — VERSIÓN COMPLETA INTEGRADA
// Incluye: 5 juegos, menú inicial, configuración, mascota Luna
// (ladrido + ejercicio bloqueante + festejo) y palabras personales.
// ============================================================

function $<T extends HTMLElement = HTMLElement>(sel: string): T {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Elemento no encontrado: ${sel}`);
  return el;
}
function $$(sel: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(sel));
}

// ============ Config Terapéutica ============
const Terapia: ConfigTerapia = { hemianopsia: false, cimt: false, saliencia: false, multi: true, enfoque: false, fotos: [] };
function guardarTerapia(): void { try { localStorage.setItem('rc-terapia', JSON.stringify(Terapia)); } catch (e) {} }
function cargarTerapia(): void {
  try {
    const d = JSON.parse(localStorage.getItem('rc-terapia') || '{}') as Partial<ConfigTerapia>;
    if (d.hemianopsia !== undefined) Terapia.hemianopsia = d.hemianopsia;
    if (d.cimt !== undefined) Terapia.cimt = d.cimt;
    if (d.saliencia !== undefined) Terapia.saliencia = d.saliencia;
    if (d.multi !== undefined) Terapia.multi = d.multi;
    if (d.enfoque !== undefined) Terapia.enfoque = d.enfoque;
    if (Array.isArray(d.fotos)) Terapia.fotos = d.fotos;
  } catch (e) {}
}
function aplicarUITerapia(): void {
  ($<HTMLInputElement>('#sw-hemianopsia')).checked = Terapia.hemianopsia;
  ($<HTMLInputElement>('#sw-cimt')).checked = Terapia.cimt;
  ($<HTMLInputElement>('#sw-saliencia')).checked = Terapia.saliencia;
  ($<HTMLInputElement>('#sw-multi')).checked = Terapia.multi;
  ($<HTMLInputElement>('#sw-enfoque')).checked = Terapia.enfoque;
  $$('.opcion-terap').forEach(op => { const input = op.querySelector('input'); op.classList.toggle('activa', input ? input.checked : false); });
  document.body.classList.toggle('modo-enfoque', Terapia.enfoque);
  $('#upload-container').classList.toggle('oculto', !Terapia.saliencia);
  renderGaleria();
}
function renderGaleria(): void {
  const gal = $('#galeria-fotos'); gal.innerHTML = '';
  Terapia.fotos.forEach((src, i) => {
    const div = document.createElement('div'); div.className = 'foto-item';
    div.innerHTML = `<img src="${src}" alt="Foto ${i + 1}"><button class="btn-borrar" data-i="${i}">×</button>`;
    gal.appendChild(div);
  });
  $$('.btn-borrar').forEach(b => {
    b.addEventListener('click', e => { e.stopPropagation(); Terapia.fotos.splice(Number((b as HTMLElement).dataset.i), 1); guardarTerapia(); aplicarUITerapia(); });
  });
}

// ============ Sonido + Voz + Vibración ============
const Sonido = {
  ctx: null as AudioContext | null,
  habilitado: true,
  voz: null as SpeechSynthesis | null,
  _ultimaVoz: 0,
  inicializar(): void {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch (e) {}
    if (!this.voz && 'speechSynthesis' in window) this.voz = window.speechSynthesis;
  },
  tono(freq: number, dur: number, tipo: OscillatorType = 'sine', vol: number = 0.12): void {
    if (!this.habilitado || !this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
      o.type = tipo; o.frequency.value = freq;
      g.gain.setValueAtTime(0, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(); o.stop(this.ctx.currentTime + dur);
    } catch (e) {}
  },
  hablar(texto: string): void {
    if (Terapia.multi && this.voz) {
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = 'es-AR'; u.rate = 0.95; u.pitch = 1.1;
      this.voz.cancel(); this.voz.speak(u);
    }
  },
  acierto(): void {
    this.inicializar();
    this.tono(523, .12); setTimeout(() => this.tono(659, .18), 90); setTimeout(() => this.tono(784, .25), 180);
    if (Terapia.multi) this.hablar(aleatoria(['¡Muy bien Oscár!', '¡Excelente!', '¡Bravo!', '¡Sigue así!']));
    if (Terapia.multi && navigator.vibrate) navigator.vibrate([40, 30, 40]);
  },
  estrella(): void {
    this.inicializar();
    this.tono(880, .1, 'sine', 0.1); setTimeout(() => this.tono(1174, .15, 'sine', 0.1), 80);
    if (Terapia.multi && navigator.vibrate) navigator.vibrate(30);
    const ahora = Date.now();
    if (ahora - this._ultimaVoz > 1500) {
      this._ultimaVoz = ahora;
      this.hablar(aleatoria(['¡Bien!', '¡Vamos!', '¡Seguí así!', '¡Dale!', '¡Muy bien!']));
    }
  },
  salto(): void { this.inicializar(); this.tono(440, .08, 'sine', 0.07); },
  golpe(): void { this.inicializar(); this.tono(180, .3, 'sine', 0.12); if (Terapia.multi && navigator.vibrate) navigator.vibrate([60, 40, 60]); },
  fallo(): void { this.inicializar(); this.tono(220, .25); },
  click(): void { this.inicializar(); this.tono(800, .05, 'sine', 0.06); },
  ladrido(): void {
    this.inicializar();
    if (!this.habilitado || !this.ctx) return;
    const ladrar = (t0: number) => {
      if (!this.ctx) return;
      const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
      const start = this.ctx.currentTime + t0;
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(350, start);
      o.frequency.exponentialRampToValueAtTime(120, start + 0.12);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.2, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(start); o.stop(start + 0.16);
    };
    ladrar(0); ladrar(0.22);
  },
  festejo(): void {
    this.inicializar();
    [523, 659, 784, 880, 1047].forEach((n, i) => setTimeout(() => this.tono(n, .18, 'triangle', 0.12), i * 100));
  },
  nivel(): void {
    this.inicializar();
    [523, 659, 784, 1047].forEach((n, i) => setTimeout(() => this.tono(n, .2, 'triangle'), i * 120));
    if (Terapia.multi) this.hablar('¡Felicitaciones Oscár, terminaste el nivel!');
    if (Terapia.multi && navigator.vibrate) navigator.vibrate([60, 40, 60, 40, 100]);
  }
};

// ============ Confetti ============
interface Particula { x: number; y: number; vx: number; vy: number; rot: number; vrot: number; tam: number; color: string; }
const Confetti = {
  canvas: null as HTMLCanvasElement | null, ctx: null as CanvasRenderingContext2D | null,
  part: [] as Particula[], activo: false,
  colores: ['#F5A05A', '#4FB3A5', '#63BE7F', '#F6A96A', '#7FB8E6', '#9B7FD4'],
  inicializar(): void { this.canvas = $<HTMLCanvasElement>('#canvas-confetti'); this.ctx = this.canvas.getContext('2d'); this.ajustar(); window.addEventListener('resize', () => this.ajustar()); },
  ajustar(): void { if (!this.canvas) return; this.canvas.width = innerWidth; this.canvas.height = innerHeight; },
  explotar(): void {
    if (!this.canvas) this.inicializar();
    this.part = [];
    for (let i = 0; i < 120; i++) {
      this.part.push({ x: this.canvas!.width / 2, y: this.canvas!.height / 3, vx: (Math.random() - .5) * 14, vy: Math.random() * -16 - 4, rot: Math.random() * Math.PI * 2, vrot: (Math.random() - .5) * .3, tam: Math.random() * 10 + 6, color: this.colores[Math.floor(Math.random() * this.colores.length)] });
    }
    if (!this.activo) { this.activo = true; this.animar(); }
    setTimeout(() => { this.activo = false; }, 3500);
  },
  animar(): void {
    if (!this.ctx || !this.canvas) return;
    if (!this.activo && this.part.length === 0) { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); return; }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.part = this.part.filter(p => p.y < this.canvas!.height + 40);
    this.part.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.4; p.vx *= 0.99; p.rot += p.vrot;
      this.ctx!.save(); this.ctx!.translate(p.x, p.y); this.ctx!.rotate(p.rot);
      this.ctx!.fillStyle = p.color; this.ctx!.fillRect(-p.tam / 2, -p.tam / 4, p.tam, p.tam / 2); this.ctx!.restore();
    });
    requestAnimationFrame(() => this.animar());
  }
};

// ============ Sesiones ============
const Sesiones = {
  clave: 'rc-sesiones-v2', inicio: null as number | null,
  iniciar(): void { this.inicio = Date.now(); },
  registrar(datos: Omit<Sesion, 'fecha' | 'duracion'>): void {
    if (!this.inicio) return;
    const sesion: Sesion = { fecha: new Date().toISOString(), duracion: Math.round((Date.now() - this.inicio) / 1000), ...datos };
    try {
      const s = JSON.parse(localStorage.getItem(this.clave) || '[]') as Sesion[];
      s.push(sesion); if (s.length > 200) s.splice(0, s.length - 200);
      localStorage.setItem(this.clave, JSON.stringify(s));
    } catch (e) {}
    this.inicio = null;
  },
  obtener(): Sesion[] { try { return JSON.parse(localStorage.getItem(this.clave) || '[]') as Sesion[]; } catch (e) { return []; } },
  exportar(): string {
    const s = this.obtener();
    const tIzq = s.filter(x => x.tiempoIzq).map(x => x.tiempoIzq as number);
    const tDer = s.filter(x => x.tiempoDer).map(x => x.tiempoDer as number);
    const pIzq = tIzq.length ? Math.round(tIzq.reduce((a, b) => a + b, 0) / tIzq.length) : 0;
    const pDer = tDer.length ? Math.round(tDer.reduce((a, b) => a + b, 0) / tDer.length) : 0;
    let t = 'REPORTE NEUROREHABILITACIÓN\nPaciente: Oscar Enrique\nGenerado: ' + new Date().toLocaleString('es-AR') + '\n\n';
    t += 'RESUMEN EJECUTIVO\n' + '='.repeat(40) + '\nTotal sesiones: ' + s.length + '\nCompletadas: ' + s.filter(x => x.exitoso).length + '\n\n';
    t += 'ANÁLISIS CAMPO VISUAL (Coordinación)\n' + '='.repeat(40) + '\n';
    t += 'Tiempo reacción IZQUIERDO (afectado): ' + pIzq + ' ms (n=' + tIzq.length + ')\n';
    t += 'Tiempo reacción DERECHO: ' + pDer + ' ms (n=' + tDer.length + ')\n';
    t += 'Diferencia: ' + (pIzq - pDer > 0 ? '+' : '') + (pIzq - pDer) + ' ms\n\n';
    t += 'ADAPTACIONES ACTIVAS\n' + '='.repeat(40) + '\n';
    t += 'Modo Hemianopsia: ' + (Terapia.hemianopsia ? 'Sí' : 'No') + '\n';
    t += 'CIMT (mano izq): ' + (Terapia.cimt ? 'Sí' : 'No') + '\n';
    t += 'Saliencia (fotos): ' + (Terapia.saliencia ? 'Sí' : 'No') + '\n';
    t += 'Multisensorial: ' + (Terapia.multi ? 'Sí' : 'No') + '\n\n';
    t += 'HISTORIAL\n' + '='.repeat(40) + '\n';
    s.slice().reverse().forEach((x, i) => {
      const f = new Date(x.fecha).toLocaleString('es-AR');
      t += '\n[' + (s.length - i) + '] ' + f + ' - ' + x.juego + ' (' + x.nivel + ')\n';
      t += '  Puntaje: ' + x.puntaje + ' · Duración: ' + x.duracion + 's · ' + (x.exitoso ? '✅' : '⚠️') + '\n';
      if (x.tiempoIzq || x.tiempoDer) t += '  T.Izq: ' + (x.tiempoIzq || '—') + ' ms · T.Der: ' + (x.tiempoDer || '—') + ' ms\n';
    });
    return t;
  }
};

// ============ Utilidades ============
const FRASES = {
  animo: ['¡Muy bien!', '¡Excelente!', '¡Qué gran trabajo!', '¡Seguí así!', '¡Muy bueno!'],
  retry: ['¡Casi!', 'Probá de nuevo', 'Tranquilidad', '¡Vos podés!'],
  final: ['¡Felicitaciones!', 'Cada ejercicio ayuda a tu cerebro', '¡Muy buen esfuerzo!']
};
// Ejercicios físicos referidos a sus dificultades (paresia izquierda + hemianopsia)
const EJERCICIOS = [
  '🤚 Abrí y cerrá los dedos de tu mano izquierda 10 veces, despacio.',
  '✋ Apretá una pelotita blanda con la mano izquierda 10 veces.',
  '🙆 Subí el hombro izquierdo hacia la oreja 5 veces y bajalo despacio.',
  '🦵 Sentado, estirá y levantá la pierna izquierda 10 veces.',
  '👀 Girá la cabeza despacio hacia la izquierda y mirá algo durante 10 segundos.',
  '🧭 Sentado, girá el tronco hacia la izquierda y tocá el respaldo de la silla.',
  '🚶 Caminá 10 pasos por tu casa prestando atención al lado izquierdo.',
  '🖐️ Con la mano derecha, tocá y estirá suavemente los dedos de tu mano izquierda.',
  '👁️ Seguí con los ojos un objeto que se mueva de derecha a izquierda, sin mover la cabeza.',
  '💪 Apoyá el brazo izquierdo sobre la mesa y intentá levantar los dedos uno por uno.'
];
// Palabras personales con significado emocional (saliencia)
const PALABRAS_ESPECIALES: Record<string, string> = {
  HERNAN: '¡El nombre de tu hijo! ❤️',
  ANDREA: '¡El nombre de tu hija! ❤️',
  ESTEBAN: '¡El nombre de tu hijo! ❤️',
  BRISA: '¡Una de tus mascotas! 🐾',
  ABROJO: '¡Una de tus mascotas! 🐾',
  ITUZAINGO: '¡Tu barrio! 🏘️',
  INDEPENDIENTE: '¡Tu equipo del corazón! 🔴'
};
const aleatoria = (l: string[]): string => l[Math.floor(Math.random() * l.length)];
const rand = (min: number, max: number): number => min + Math.random() * (max - min);
function mezclar<T>(a: T[]): T[] { const arr = a.slice(); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
const mmss = (s: number): string => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

let _toastT: number | undefined;
function toast(t: string, tipo: string = ''): void {
  const el = $('#toast'); el.textContent = t; el.setAttribute('data-tipo', tipo);
  el.classList.add('visible'); clearTimeout(_toastT);
  _toastT = window.setTimeout(() => el.classList.remove('visible'), 2400);
}

// ============ Estado y Navegación ============
const Estado: EstadoGlobal = { dificultad: 'facil', juegoActivo: null, enPausa: false, terminado: false };
const NIVELES: Dificultad[] = ['facil', 'medio', 'dificil'];
const TITULOS: Record<JuegoId, string> = { memoria: '🧠 Memoria', atencion: '👀 Atención', coordinacion: '✋ Coordinación', viaje: '🚀 Viaje a las Estrellas', palabras: '✍️ Palabras' };
const sigNivel = (n: Dificultad): Dificultad | null => { const i = NIVELES.indexOf(n); return i < NIVELES.length - 1 ? NIVELES[i + 1] : null; };

const PANTALLAS: string[] = ['menu', 'config', 'memoria', 'atencion', 'coordinacion', 'viaje', 'palabras', 'progreso'];
function mostrarPantalla(n: string): void {
  PANTALLAS.forEach(p => $('#pantalla-' + p).classList.toggle('activa', p === n));
  const esJuego: boolean = ['memoria', 'atencion', 'coordinacion', 'viaje', 'palabras'].includes(n);
  $('#barra-juego').classList.toggle('oculto', !esJuego);
  if (esJuego) $('#barra-titulo').textContent = TITULOS[n as JuegoId];
  else detenerJuego();
  document.body.classList.toggle('modo-enfoque', esJuego && Terapia.enfoque);
  if (n === 'progreso') mostrarProgreso();
  window.scrollTo({ top: 0 });
}
function detenerJuego(): void {
  if (!Estado.juegoActivo) return;
  Juegos[Estado.juegoActivo].detener();
  Estado.juegoActivo = null; Estado.enPausa = false; Estado.terminado = false;
}
function abrirJuego(n: JuegoId): void {
  Sonido.click();
  Estado.juegoActivo = n; Estado.enPausa = false; Estado.terminado = false;
  sincronizarSelector(n, Estado.dificultad);
  mostrarPantalla(n);
  Sesiones.iniciar();
  Juegos[n].comenzar(Estado.dificultad);
}
function crearSelector(id: string, ini: Dificultad, fn: (d: Dificultad) => void): void {
  const c = $('#' + id);
  Array.from(c.querySelectorAll<HTMLElement>('.seg-opcion')).forEach(b => {
    b.classList.toggle('sel', b.dataset.dif === ini);
    b.addEventListener('click', () => {
      Sonido.click();
      Array.from(c.querySelectorAll<HTMLElement>('.seg-opcion')).forEach(x => x.classList.toggle('sel', x === b));
      fn(b.dataset.dif as Dificultad);
    });
  });
}
function sincronizarSelector(j: JuegoId, d: Dificultad): void {
  $$('#selector-dif-' + j + ' .seg-opcion').forEach(b => b.classList.toggle('sel', b.dataset.dif === d));
}
const abrirModal = (id: string): void => $('#' + id).classList.add('visible');
const cerrarModal = (id: string): void => $('#' + id).classList.remove('visible');

function mostrarResumen(datos: DatosResumen): void {
  Estado.terminado = true;
  $('#resumen-titulo').textContent = datos.titulo;
  const c = $('#resumen-stats'); c.innerHTML = '';
  datos.stats.forEach(e => {
    const f = document.createElement('div'); f.className = 'res-stat';
    const et = document.createElement('span'); et.textContent = e.etiqueta;
    const v = document.createElement('strong'); v.textContent = String(e.valor);
    f.append(et, v); c.appendChild(f);
  });
  $('#resumen-mensaje').textContent = datos.mensaje;
  const sig = sigNivel(datos.nivel);
  ($('#btn-resumen-siguiente') as HTMLButtonElement).style.display = sig ? '' : 'none';
  const contCIMT = $('#contenedor-cimt'); contCIMT.innerHTML = '';
  let bonusCIMT = 0;
  if (Terapia.cimt && datos.exitoso) {
    const div = document.createElement('div'); div.className = 'pregunta-cimt cimt-izq';
    div.innerHTML = '<p style="width:100%;font-weight:600;margin-bottom:8px;">¿Usaste la mano izquierda? ✋</p><button class="btn btn-izq-confirm">✋ Sí, mano izq (+20)</button><button class="btn btn-der-confirm">👉 No, usé la otra</button>';
    contCIMT.appendChild(div);
    const bi = div.querySelector('.btn-izq-confirm') as HTMLButtonElement;
    const bd = div.querySelector('.btn-der-confirm') as HTMLButtonElement;
    bi.addEventListener('click', () => { bonusCIMT = 20; bi.textContent = '✅ ¡Excelente!'; bi.disabled = true; bd.disabled = true; Sonido.acierto(); });
    bd.addEventListener('click', () => { bd.textContent = 'Ok'; bi.disabled = true; bd.disabled = true; });
  }
  ($('#btn-resumen-repetir') as HTMLButtonElement).onclick = () => { cerrarModal('modal-resumen'); Estado.terminado = false; Sesiones.iniciar(); Juegos[datos.juego].comenzar(datos.nivel); };
  ($('#btn-resumen-siguiente') as HTMLButtonElement).onclick = () => {
    if (!sig) return;
    cerrarModal('modal-resumen'); Estado.terminado = false;
    Estado.dificultad = sig; sincronizarSelector(datos.juego, sig);
    Sesiones.iniciar(); Juegos[datos.juego].comenzar(sig);
  };
  ($('#btn-resumen-menu') as HTMLButtonElement).onclick = () => { cerrarModal('modal-resumen'); mostrarPantalla('menu'); };
  const statsObj: Record<string, string | number> = {};
  datos.stats.forEach(s => { statsObj[s.etiqueta] = s.valor; });
  Sesiones.registrar({ juego: datos.juego, nivel: datos.nivel, puntaje: datos.puntaje + bonusCIMT, exitoso: datos.exitoso, stats: statsObj, tiempoIzq: datos.tiempoIzq ?? null, tiempoDer: datos.tiempoDer ?? null });
  abrirModal('modal-resumen');
  if (datos.exitoso) { Sonido.nivel(); Confetti.explotar(); } else { Sonido.click(); }
}
function alternarPausa(): void {
  if (!Estado.juegoActivo || Estado.terminado) return;
  Sonido.click();
  const j = Juegos[Estado.juegoActivo];
  if (!Estado.enPausa) { Estado.enPausa = true; j.pausar(); abrirModal('modal-pausa'); }
  else { cerrarModal('modal-pausa'); Estado.enPausa = false; j.reanudar(); }
}
function alternarTema(): void {
  const r = document.documentElement;
  const n = r.getAttribute('data-theme') === 'oscuro' ? 'claro' : 'oscuro';
  r.setAttribute('data-theme', n);
  try { localStorage.setItem('rc-tema', n); } catch (e) {}
  $$('.btn-tema').forEach(b => b.textContent = n === 'oscuro' ? '☀️ Modo claro' : '🌙 Modo oscuro');
  Sonido.click();
}
function alternarSonido(): void {
  Sonido.habilitado = !Sonido.habilitado;
  ['#btn-sonido-menu', '#btn-sonido-barra'].forEach(sel => {
    const b = document.querySelector(sel); if (!b) return;
    b.classList.toggle('activo', Sonido.habilitado);
    b.textContent = Sonido.habilitado ? '🔊' : '🔇';
  });
  if (Sonido.habilitado) { Sonido.inicializar(); Sonido.click(); }
}
function guiaVisual(container: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    if (!Terapia.hemianopsia) { resolve(); return; }
    const guia = document.createElement('div'); guia.className = 'guia-visual'; container.appendChild(guia);
    const msg = document.createElement('div'); msg.className = 'guia-mensaje'; msg.textContent = '👀 Mirá a la izquierda'; container.appendChild(msg);
    if (Terapia.multi && Sonido.voz) { const u = new SpeechSynthesisUtterance('Mirá a la izquierda'); u.lang = 'es-AR'; u.rate = 0.8; Sonido.voz.cancel(); Sonido.voz.speak(u); }
    setTimeout(() => { guia.remove(); msg.remove(); resolve(); }, 2000);
  });
}

// ============ MEMORIA ============
const memState = {
  emojis: ['🍎', '🍌', '🍇', '', '', '🥝', '🍉', ''],
  config: { facil: { pares: 4 }, medio: { pares: 6 }, dificil: { pares: 8 } } as Record<Dificultad, { pares: number }>,
  nivel: 'facil' as Dificultad, primera: null as HTMLButtonElement | null,
  bloqueada: false, intentos: 0, aciertos: 0, segundos: 0, timer: null as number | null, sesion: 0
};
const Memoria: Juego = {
  async comenzar(n) {
    const s = memState; s.nivel = n || s.nivel; s.sesion++; Estado.terminado = false;
    if (s.timer) clearInterval(s.timer); s.timer = null;
    s.primera = null; s.bloqueada = false; s.intentos = 0; s.aciertos = 0; s.segundos = 0;
    $('#memoria-intentos').textContent = '0'; $('#memoria-tiempo').textContent = '00:00';
    memFeedback('Encontrá las parejas 🌸');
    await guiaVisual($('#tablero-memoria').parentElement as HTMLElement);
    memConstruir();
  },
  pausar() { const s = memState; if (s.timer) clearInterval(s.timer); s.timer = null; },
  reanudar() { const s = memState; if (s.aciertos > 0 && !Estado.terminado && !s.timer) s.timer = setInterval(() => memTick(), 1000); },
  detener() { const s = memState; s.sesion++; if (s.timer) clearInterval(s.timer); s.timer = null; }
};
function memConstruir(): void {
  const s = memState; const pares = s.config[s.nivel].pares;
  const usarFotos = Terapia.saliencia && Terapia.fotos.length >= pares;
  let pool: ItemMemoria[];
  if (usarFotos) pool = mezclar(Terapia.fotos).slice(0, pares).map((f, i) => ({ tipo: 'foto', src: f, id: i }));
  else pool = mezclar(s.emojis).slice(0, pares).map((e, i) => ({ tipo: 'emoji', src: e, id: i }));
  const mazo = mezclar(pool.concat(pool));
  const tab = $('#tablero-memoria'); tab.innerHTML = '';
  mazo.forEach(v => {
    const b = document.createElement('button'); b.className = 'carta'; b.dataset.id = String(v.id);
    const frente = v.tipo === 'foto' ? `<img src="${v.src}" alt="Foto">` : v.src;
    b.innerHTML = `<div class="carta-interna"><div class="cara cara-atras">?</div><div class="cara cara-frente">${frente}</div></div>`;
    b.addEventListener('click', () => memVoltear(b)); tab.appendChild(b);
  });
}
function memTick(): void { memState.segundos++; $('#memoria-tiempo').textContent = mmss(memState.segundos); }
function memVoltear(b: HTMLButtonElement): void {
  const s = memState;
  if (Estado.enPausa || s.bloqueada) return;
  if (b.classList.contains('volteada') || b.classList.contains('acertada')) return;
  Sonido.click();
  if (!s.timer) s.timer = setInterval(() => memTick(), 1000);
  b.classList.add('volteada');
  if (!s.primera) { s.primera = b; return; }
  s.intentos++; $('#memoria-intentos').textContent = String(s.intentos);
  const a = s.primera; s.primera = null;
  if (a.dataset.id === b.dataset.id) {
    a.classList.add('acertada'); b.classList.add('acertada'); s.aciertos++;
    Sonido.acierto(); memFeedback(aleatoria(FRASES.animo), 'exito');
    if (s.aciertos === s.config[s.nivel].pares) { const ses = s.sesion; setTimeout(() => { if (s.sesion === ses) memFinalizar(); }, 700); }
  } else {
    s.bloqueada = true; Sonido.fallo(); memFeedback(aleatoria(FRASES.retry));
    const ses = s.sesion;
    setTimeout(() => { if (s.sesion !== ses) return; a.classList.remove('volteada'); b.classList.remove('volteada'); s.bloqueada = false; }, 900);
  }
}
function memFeedback(t: string, c?: string): void { const f = $('#memoria-feedback'); f.textContent = t; f.className = 'feedback' + (c === 'exito' ? ' fb-exito' : ''); }
function memFinalizar(): void {
  const s = memState; if (s.timer) { clearInterval(s.timer); s.timer = null; }
  const pares = s.config[s.nivel].pares;
  const puntos = Math.max(0, s.aciertos * 100 - (s.intentos - pares) * 8);
  const est = s.intentos <= pares * 1.5 ? '⭐⭐⭐' : s.intentos <= pares * 2.3 ? '⭐⭐' : '⭐';
  mostrarResumen({ titulo: '¡Nivel completado! ' + est, stats: [{ etiqueta: 'Parejas', valor: s.aciertos + '/' + pares }, { etiqueta: 'Intentos', valor: s.intentos }, { etiqueta: 'Tiempo', valor: mmss(s.segundos) }], mensaje: aleatoria(FRASES.final), juego: 'memoria', nivel: s.nivel, exitoso: est !== '⭐', puntaje: puntos });
}

// ============ ATENCIÓN ============
const atState = {
  config: {
    facil: { cols: 3, tiempo: 0, rondas: 6, pares: [['🐶', ''], ['', '🌙'], ['🍎', ''], ['', ''], ['🚗', '🌸'], ['', '🍔']] },
    medio: { cols: 4, tiempo: 12, rondas: 7, pares: [['🐱', '🐯'], ['', '🍋'], ['🌼', '🌻'], ['', '🐢'], ['🍩', ''], ['', '🏀']] },
    dificil: { cols: 5, tiempo: 8, rondas: 8, pares: [['🐤', '🐥'], ['', ''], ['😮', ''], ['🐇', '🐭'], ['🍑', '🍒'], ['', '🦢']] }
  } as Record<Dificultad, { cols: number; tiempo: number; rondas: number; pares: string[][] }>,
  nivel: 'facil' as Dificultad, ronda: 0, aciertos: 0, errores: 0, tiempoTotal: 0, restante: 0,
  timerT: null as number | null, timerR: null as number | null, resuelta: false, sesion: 0
};
const Atencion: Juego = {
  async comenzar(n) {
    const s = atState; s.nivel = n || s.nivel; s.sesion++; Estado.terminado = false;
    if (s.timerT) clearInterval(s.timerT); if (s.timerR) clearInterval(s.timerR);
    s.timerT = null; s.timerR = null;
    s.ronda = 0; s.aciertos = 0; s.errores = 0; s.tiempoTotal = 0;
    $('#atencion-tiempo').textContent = '00:00'; $('#atencion-ronda').textContent = '—';
    atFeedback('Encontrá el diferente 👀');
    await guiaVisual($('#tablero-atencion').parentElement as HTMLElement);
    s.timerT = setInterval(() => { s.tiempoTotal++; $('#atencion-tiempo').textContent = mmss(s.tiempoTotal); }, 1000);
    atNuevaRonda();
  },
  pausar() { const s = atState; if (s.timerT) clearInterval(s.timerT); if (s.timerR) clearInterval(s.timerR); s.timerT = null; s.timerR = null; },
  reanudar() { const s = atState; if (!s.timerT) s.timerT = setInterval(() => { s.tiempoTotal++; $('#atencion-tiempo').textContent = mmss(s.tiempoTotal); }, 1000); },
  detener() { const s = atState; s.sesion++; if (s.timerT) clearInterval(s.timerT); if (s.timerR) clearInterval(s.timerR); s.timerT = null; s.timerR = null; }
};
function atNuevaRonda(): void {
  const s = atState; const cfg = s.config[s.nivel];
  s.ronda++;
  if (s.ronda > cfg.rondas) { atFinalizar(); return; }
  $('#atencion-ronda').textContent = s.ronda + '/' + cfg.rondas; s.resuelta = false;
  const par = cfg.pares[Math.floor(Math.random() * cfg.pares.length)];
  const base = par[0], dist = par[1];
  const total = cfg.cols * cfg.cols; let pos: number;
  if (Terapia.hemianopsia && Math.random() < 0.7) pos = Math.floor(Math.random() * Math.floor(total / 2));
  else pos = Math.floor(Math.random() * total);
  const tab = $('#tablero-atencion') as HTMLElement;
  tab.style.gridTemplateColumns = 'repeat(' + cfg.cols + ',1fr)'; tab.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const es = i === pos; const b = document.createElement('button');
    b.className = 'celda'; b.textContent = es ? dist : base; b.dataset.dist = es ? '1' : '0';
    b.addEventListener('click', () => atElegir(b)); tab.appendChild(b);
  }
  if (s.timerR) { clearInterval(s.timerR); s.timerR = null; }
  const bar = $('#atencion-barra-fill') as HTMLElement;
  if (cfg.tiempo > 0) {
    $('#atencion-barra').setAttribute('style', 'visibility:visible');
    s.restante = cfg.tiempo * 1000; bar.style.width = '100%';
    s.timerR = setInterval(() => {
      s.restante -= 100; bar.style.width = Math.max(0, s.restante / (cfg.tiempo * 10)) + '%';
      if (s.restante <= 0) { if (s.timerR) clearInterval(s.timerR); s.timerR = null; atSeAcabo(); }
    }, 100);
  } else { $('#atencion-barra').setAttribute('style', 'visibility:hidden'); }
}
function atElegir(c: HTMLElement): void {
  const s = atState;
  if (Estado.enPausa || s.resuelta) return;
  if (c.dataset.dist === '1') {
    s.resuelta = true; if (s.timerR) { clearInterval(s.timerR); s.timerR = null; }
    s.aciertos++; Sonido.acierto(); c.classList.add('correcta');
    atFeedback(aleatoria(FRASES.animo), 'exito');
    const ses = s.sesion; setTimeout(() => { if (s.sesion === ses) atNuevaRonda(); }, 900);
  } else {
    s.errores++; Sonido.fallo(); c.classList.add('incorrecta');
    atFeedback(aleatoria(FRASES.retry));
    setTimeout(() => c.classList.remove('incorrecta'), 600);
  }
}
function atSeAcabo(): void {
  const s = atState;
  if (s.resuelta) return; s.resuelta = true; Sonido.fallo();
  $$('#tablero-atencion .celda').forEach(c => { if (c.dataset.dist === '1') c.classList.add('correcta'); });
  atFeedback('Se acabó el tiempo 🙂');
  const ses = s.sesion; setTimeout(() => { if (s.sesion === ses) atNuevaRonda(); }, 1600);
}
function atFeedback(t: string, c?: string): void { const f = $('#atencion-feedback'); f.textContent = t; f.className = 'feedback' + (c === 'exito' ? ' fb-exito' : ''); }
function atFinalizar(): void {
  const s = atState;
  if (s.timerT) clearInterval(s.timerT); if (s.timerR) clearInterval(s.timerR);
  s.timerT = null; s.timerR = null;
  const cfg = s.config[s.nivel];
  const prec = Math.round(s.aciertos / cfg.rondas * 100);
  const pts = Math.max(0, s.aciertos * 100 - s.errores * 10);
  mostrarResumen({ titulo: prec >= 60 ? '¡Nivel completado!' : 'Fin del nivel 🙂', stats: [{ etiqueta: 'Aciertos', valor: s.aciertos + '/' + cfg.rondas }, { etiqueta: 'Precisión', valor: prec + '%' }, { etiqueta: 'Tiempo', valor: mmss(s.tiempoTotal) }], mensaje: aleatoria(FRASES.final), juego: 'atencion', nivel: s.nivel, exitoso: prec >= 60, puntaje: pts });
}

// ============ COORDINACIÓN ============
const coState = {
  config: {
    facil: { total: 12, vida: 2600, tam: 100, maxSim: 1, intervalo: 1500 },
    medio: { total: 16, vida: 2000, tam: 86, maxSim: 1, intervalo: 1200 },
    dificil: { total: 20, vida: 1600, tam: 74, maxSim: 2, intervalo: 950 }
  } as Record<Dificultad, { total: number; vida: number; tam: number; maxSim: number; intervalo: number }>,
  nivel: 'facil' as Dificultad, aciertos: 0, escapados: 0, lanzados: 0, activos: 0,
  tiemposIzq: [] as number[], tiemposDer: [] as number[], spawner: null as number | null,
  finalizado: false, sesion: 0
};
const Coordinacion: Juego = {
  async comenzar(n) {
    const s = coState; s.nivel = n || s.nivel; s.sesion++; Estado.terminado = false;
    s.aciertos = 0; s.escapados = 0; s.lanzados = 0; s.activos = 0;
    s.tiemposIzq = []; s.tiemposDer = []; s.finalizado = false;
    $('#zona-coord').innerHTML = '';
    if (s.spawner) clearInterval(s.spawner); s.spawner = null;
    coActualizar(); coFeedback('Tocá las estrellas ✋');
    await guiaVisual($('#zona-coord'));
    const cfg = s.config[s.nivel];
    s.spawner = setInterval(() => coLanzar(), cfg.intervalo); coLanzar();
  },
  pausar() { const s = coState; if (s.spawner) clearInterval(s.spawner); s.spawner = null; $$('#zona-coord .objetivo').forEach(o => { clearTimeout((o as any)._to); o.remove(); }); s.activos = 0; },
  reanudar() { const s = coState; if (s.finalizado) return; const cfg = s.config[s.nivel]; if (s.lanzados >= cfg.total) { coVerificar(); return; } s.spawner = setInterval(() => coLanzar(), cfg.intervalo); coLanzar(); },
  detener() { const s = coState; s.sesion++; if (s.spawner) clearInterval(s.spawner); s.spawner = null; const z = $('#zona-coord'); if (z) z.innerHTML = ''; }
};
function coLanzar(): void {
  const s = coState;
  if (Estado.enPausa) return;
  const cfg = s.config[s.nivel];
  if (s.lanzados >= cfg.total) { if (s.spawner) clearInterval(s.spawner); s.spawner = null; coVerificar(); return; }
  if (s.activos >= cfg.maxSim) return;
  coCrear();
}
function coCrear(): void {
  const s = coState; const cfg = s.config[s.nivel];
  const zona = $('#zona-coord');
  const w = zona.clientWidth, h = zona.clientHeight, tam = cfg.tam;
  let x: number, y: number, intentos = 0;
  do {
    const izq = Terapia.hemianopsia && Math.random() < 0.7;
    x = izq ? 10 + Math.random() * Math.max(10, (w / 2) - tam - 10) : 10 + Math.random() * Math.max(10, w - tam - 20);
    y = 10 + Math.random() * Math.max(10, h - tam - 20); intentos++;
  } while (intentos < 25 && coSolapa(x, y, tam));
  const el = document.createElement('button'); el.className = 'objetivo';
  el.style.width = tam + 'px'; el.style.height = tam + 'px'; el.style.left = x + 'px'; el.style.top = y + 'px';
  el.textContent = '🌟'; el.dataset.lado = (x + tam / 2) < w / 2 ? 'izq' : 'der'; el.dataset.nacido = String(performance.now());
  zona.appendChild(el); s.activos++; s.lanzados++; coActualizar();
  el.addEventListener('click', ev => { ev.stopPropagation(); coTocar(el); });
  (el as any)._to = setTimeout(() => coEscapo(el), cfg.vida);
}
function coSolapa(x: number, y: number, t: number): boolean {
  return $$('#zona-coord .objetivo').some(o => { const ox = parseFloat(o.style.left), oy = parseFloat(o.style.top); return Math.hypot(ox - x, oy - y) < t * 1.1; });
}
function coTocar(el: HTMLElement): void {
  const s = coState;
  if (Estado.enPausa) return; clearTimeout((el as any)._to);
  const t = Math.round(performance.now() - Number(el.dataset.nacido));
  if (el.dataset.lado === 'izq') s.tiemposIzq.push(t); else s.tiemposDer.push(t);
  s.aciertos++; s.activos--; el.classList.add('tocado'); Sonido.acierto();
  setTimeout(() => el.remove(), 320);
  coMarca('marca-acierto', parseFloat(el.style.left) + el.offsetWidth / 2, parseFloat(el.style.top) + el.offsetHeight / 2);
  coActualizar(); coFeedback(aleatoria(FRASES.animo), 'exito'); coVerificar();
}
function coEscapo(el: HTMLElement): void {
  const s = coState;
  if (Estado.enPausa) return; clearTimeout((el as any)._to);
  s.escapados++; s.activos--; Sonido.fallo(); el.remove();
  coActualizar(); coFeedback('¡Se escapó!'); coVerificar();
}
function coMarca(c: string, x: number, y: number): void {
  const z = $('#zona-coord'); const m = document.createElement('div'); m.className = c;
  m.style.left = x + 'px'; m.style.top = y + 'px'; z.appendChild(m); setTimeout(() => m.remove(), 600);
}
function coVerificar(): void {
  const s = coState; const cfg = s.config[s.nivel];
  if (!s.finalizado && s.lanzados >= cfg.total && s.activos <= 0 && !s.spawner) { const ses = s.sesion; setTimeout(() => { if (s.sesion === ses) coFinalizar(); }, 500); }
}
function coActualizar(): void {
  const s = coState; const cfg = s.config[s.nivel];
  $('#coord-progreso').textContent = s.lanzados + '/' + cfg.total;
  $('#coord-aciertos').textContent = String(s.aciertos);
  $('#coord-escapados').textContent = String(s.escapados);
}
function coFeedback(t: string, c?: string): void { const f = $('#coord-feedback'); f.textContent = t; f.className = 'feedback' + (c === 'exito' ? ' fb-exito' : ''); }
function coFinalizar(): void {
  const s = coState;
  if (s.finalizado) return; s.finalizado = true;
  if (s.spawner) clearInterval(s.spawner); s.spawner = null;
  const cfg = s.config[s.nivel];
  const promI = s.tiemposIzq.length ? Math.round(s.tiemposIzq.reduce((a, b) => a + b, 0) / s.tiemposIzq.length) : 0;
  const promD = s.tiemposDer.length ? Math.round(s.tiemposDer.reduce((a, b) => a + b, 0) / s.tiemposDer.length) : 0;
  const pts = Math.max(0, s.aciertos * 100 - s.escapados * 10);
  const exitoso = s.aciertos >= cfg.total * 0.6;
  const stats: Stat[] = [{ etiqueta: 'Aciertos', valor: s.aciertos + '/' + cfg.total }, { etiqueta: 'T. reacción izq ⬅️', valor: promI ? promI + ' ms' : '—' }, { etiqueta: 'T. reacción der ➡️', valor: promD ? promD + ' ms' : '—' }];
  if (Terapia.hemianopsia && promI && promD) stats.push({ etiqueta: 'Diferencia izq-der', valor: (promI - promD > 0 ? '+' : '') + (promI - promD) + ' ms' });
  mostrarResumen({ titulo: exitoso ? '¡Nivel completado!' : 'Fin 🙂', stats, mensaje: aleatoria(FRASES.final), juego: 'coordinacion', nivel: s.nivel, exitoso, puntaje: pts, tiempoIzq: promI, tiempoDer: promD });
}

// ============ VIAJE A LAS ESTRELLAS ============
interface ObstaculoViaje extends Obstaculo { conEstrella?: boolean; }
const viajeState = {
  canvas: null as HTMLCanvasElement | null, ctx: null as CanvasRenderingContext2D | null,
  W: 860, H: 420, sueloY: 0,
  config: {
    facil: { velBase: 3.0, velMax: 6.0, acel: 0.00012, obsMin: 1500, obsMax: 2400, estMin: 900, estMax: 1600, duracion: 60000, vidas: 3 },
    medio: { velBase: 4.0, velMax: 8.0, acel: 0.00018, obsMin: 1200, obsMax: 2000, estMin: 800, estMax: 1400, duracion: 75000, vidas: 3 },
    dificil: { velBase: 5.0, velMax: 10.5, acel: 0.00024, obsMin: 950, obsMax: 1700, estMin: 700, estMax: 1200, duracion: 90000, vidas: 3 }
  } as Record<Dificultad, ConfigViaje>,
  nivel: 'facil' as Dificultad, corriendo: false, rafId: 0, ultimoTs: 0,
  px: 90, py: 0, vy: 0, saltando: false, invulnerable: 0,
  velocidad: 0, tiempo: 0, vidas: 3, estrellasRec: 0, obstaculosSaltados: 0, puntos: 0,
  obstaculos: [] as ObstaculoViaje[], estrellas: [] as EstrellaItem[], fondos: [] as FondoEstrella[],
  timerObs: 0, proxObs: 1500, timerEst: 0, proxEst: 1000,
  avisoActivo: false, sesion: 0
};
const Viaje: Juego = {
  comenzar(n) {
    const s = viajeState; s.nivel = n || s.nivel; s.sesion++; Estado.terminado = false;
    viajeReiniciar();
    $('#viaje-overlay').classList.remove('oculto');
    $('#viaje-hint').classList.add('oculto');
    viajeDibujarFondo();
  },
  pausar() {},
  reanudar() { viajeState.ultimoTs = performance.now(); },
  detener() { const s = viajeState; s.sesion++; s.corriendo = false; cancelAnimationFrame(s.rafId); viajeReiniciar(); $('#viaje-overlay').classList.remove('oculto'); }
};
function viajeInit(): void {
  const s = viajeState;
  s.canvas = $<HTMLCanvasElement>('#canvas-viaje');
  s.ctx = s.canvas.getContext('2d');
  s.W = s.canvas.width; s.H = s.canvas.height; s.sueloY = s.H - 70;
  s.py = s.sueloY;
  s.fondos = [];
  for (let i = 0; i < 40; i++) s.fondos.push({ x: Math.random() * s.W, y: Math.random() * (s.H - 120), r: Math.random() * 1.6 + 0.4, v: Math.random() * 0.4 + 0.1 });
  const cont = $('#viaje-contenedor');
  cont.addEventListener('pointerdown', () => { if (s.corriendo && !Estado.enPausa) viajeSaltar(); });
  $('#btn-viaje-empezar').addEventListener('click', e => { e.stopPropagation(); viajeArrancar(); });
  viajeDibujarFondo();
}
function viajeReiniciar(): void {
  const s = viajeState; const cfg = s.config[s.nivel];
  s.obstaculos = []; s.estrellas = [];
  s.velocidad = cfg.velBase; s.tiempo = 0; s.vidas = cfg.vidas;
  s.estrellasRec = 0; s.obstaculosSaltados = 0; s.puntos = 0;
  s.timerObs = 0; s.proxObs = rand(cfg.obsMin, cfg.obsMax);
  s.timerEst = 0; s.proxEst = rand(cfg.estMin, cfg.estMax);
  s.px = 90; s.py = s.sueloY; s.vy = 0; s.saltando = false; s.invulnerable = 0;
  s.corriendo = false; viajeActualizarHUD();
}
function viajeArrancar(): void {
  const s = viajeState;
  if (s.corriendo) return;
  Sonido.click();
  $('#viaje-overlay').classList.add('oculto');
  const hint = $('#viaje-hint'); hint.classList.remove('oculto');
  setTimeout(() => hint.classList.add('oculto'), 2500);
  s.corriendo = true; s.ultimoTs = performance.now();
  s.rafId = requestAnimationFrame(t => viajeLoop(t));
}
function viajeSaltar(): void {
  const s = viajeState;
  if (s.saltando) return;
  s.saltando = true; s.vy = -13.5; Sonido.salto();
}
function viajeLoop(ts: number): void {
  const s = viajeState;
  if (!s.corriendo) return;
  const dt = Math.min(40, ts - s.ultimoTs); s.ultimoTs = ts;
  if (!Estado.enPausa) viajeUpdate(dt);
  viajeDibujar();
  s.rafId = requestAnimationFrame(t => viajeLoop(t));
}
function viajeUpdate(dt: number): void {
  const s = viajeState; const cfg = s.config[s.nivel]; const f = dt / 16.667;
  s.tiempo += dt;
  s.velocidad = Math.min(cfg.velMax, cfg.velBase + s.tiempo * cfg.acel);
  if (s.saltando) {
    s.vy += 0.62 * f; s.py += s.vy * f;
    if (s.py >= s.sueloY) { s.py = s.sueloY; s.saltando = false; s.vy = 0; }
  }
  if (s.invulnerable > 0) s.invulnerable -= dt;
  s.timerObs += dt;
  if (s.timerObs >= s.proxObs) { viajeCrearObstaculo(); s.timerObs = 0; s.proxObs = rand(cfg.obsMin, cfg.obsMax) * (cfg.velBase / s.velocidad); }
  s.timerEst += dt;
  if (s.timerEst >= s.proxEst) { viajeCrearEstrella(); s.timerEst = 0; s.proxEst = rand(cfg.estMin, cfg.estMax); }
  for (const o of s.obstaculos) o.x -= s.velocidad * f;
  s.obstaculos = s.obstaculos.filter(o => {
    if (!o.contado && o.x + o.w < s.px - 10) { o.contado = true; s.obstaculosSaltados++; s.puntos += 10; viajeActualizarHUD(); }
    return o.x > -80;
  });
  for (const st of s.estrellas) st.x -= s.velocidad * f;
  s.estrellas = s.estrellas.filter(st => st.x > -40 && !st.tomada);
  viajeColisionar();
  if (s.tiempo >= cfg.duracion || s.vidas <= 0) viajeFinalizar();
}
function viajeCrearObstaculo(): void {
  const s = viajeState;
  const esAlien = Math.random() < 0.5;
  const w = esAlien ? 44 : 50, h = esAlien ? 48 : 40;
  if (Terapia.hemianopsia) viajeMostrarAviso();
  s.obstaculos.push({ x: s.W + 40, y: s.sueloY - h + 10, w, h, tipo: esAlien ? 'alien' : 'roca', emoji: esAlien ? '👾' : '🪨', contado: false, golpeado: false });
}
function viajeMostrarAviso(): void {
  const s = viajeState;
  if (s.avisoActivo) return; s.avisoActivo = true;
  const hint = $('#viaje-hint'); hint.textContent = '⚠️ ¡Obstáculo a la vista!'; hint.classList.remove('oculto');
  setTimeout(() => { hint.classList.add('oculto'); hint.textContent = '👆 Tocá para saltar'; s.avisoActivo = false; }, 900);
}
function viajeCrearEstrella(): void {
  const s = viajeState;
  const minY = s.sueloY - 100, maxY = s.sueloY - 55;
  const y = Terapia.hemianopsia ? rand(minY + 15, maxY) : rand(minY, maxY);
  const obs = s.obstaculos.find(o => !o.conEstrella && o.x > s.W - 220 && o.x < s.W + 160);
  if (obs) {
    obs.conEstrella = true;
    s.estrellas.push({ x: obs.x + obs.w / 2, y: s.sueloY - 95, r: 22, tomada: false });
  } else {
    s.estrellas.push({ x: s.W + 40, y, r: 22, tomada: false });
    s.timerObs = 0;
    s.proxObs = Math.max(s.proxObs, 1000);
  }
}
function viajeColisionar(): void {
  const s = viajeState;
  const px = s.px, py = s.py, pw = 42, ph = 54; const margen = 10;
  for (const o of s.obstaculos) {
    if (o.golpeado) continue;
    if (px + pw - margen > o.x + margen && px + margen < o.x + o.w - margen && py + ph > o.y + margen) {
      if (s.invulnerable > 0) continue;
      o.golpeado = true; s.vidas--; s.invulnerable = 1500;
      Sonido.golpe(); viajeActualizarHUD();
      if (s.vidas <= 0) return;
    }
  }
  for (const st of s.estrellas) {
    if (st.tomada) continue;
    const cx = px + pw / 2, cy = py + ph / 2;
    const dist = Math.hypot(cx - st.x, cy - st.y);
    if (dist < st.r + 28) {
      st.tomada = true; s.estrellasRec++; s.puntos += 50;
      Sonido.estrella();
      viajeActualizarHUD();
    }
  }
}
function viajeActualizarHUD(): void {
  const s = viajeState;
  $('#viaje-vidas').textContent = '❤️'.repeat(Math.max(0, s.vidas)) || '💔';
  $('#viaje-estrellas').textContent = String(s.estrellasRec);
  $('#viaje-puntos').textContent = String(s.puntos);
  const mult = (s.velocidad / s.config[s.nivel].velBase).toFixed(1);
  $('#viaje-velocidad').textContent = 'x' + mult;
}
function viajeDibujarFondo(): void {
  const s = viajeState; if (!s.ctx) return;
  const grad = s.ctx.createLinearGradient(0, 0, 0, s.H);
  grad.addColorStop(0, '#1B1F3A'); grad.addColorStop(1, '#2E3A5C');
  s.ctx.fillStyle = grad; s.ctx.fillRect(0, 0, s.W, s.H);
}
function viajeDibujar(): void {
  const s = viajeState; if (!s.ctx) return;
  viajeDibujarFondo();
  s.ctx.fillStyle = 'rgba(255,255,255,.7)';
  for (const f of s.fondos) {
    f.x -= f.v * (s.velocidad / 3);
    if (f.x < 0) f.x = s.W;
    s.ctx.beginPath(); s.ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); s.ctx.fill();
  }
  s.ctx.fillStyle = '#3E4A6B'; s.ctx.fillRect(0, s.sueloY + 54, s.W, s.H - s.sueloY - 54);
  s.ctx.fillStyle = '#4FB3A5'; s.ctx.fillRect(0, s.sueloY + 50, s.W, 6);
  s.ctx.font = '38px serif'; s.ctx.textAlign = 'center'; s.ctx.textBaseline = 'middle';
  for (const st of s.estrellas) if (!st.tomada) s.ctx.fillText('⭐', st.x, st.y);
  s.ctx.font = '44px serif';
  for (const o of s.obstaculos) s.ctx.fillText(o.emoji, o.x + o.w / 2, o.y + o.h / 2);
  if (s.invulnerable <= 0 || Math.floor(s.invulnerable / 150) % 2 === 0) {
    s.ctx.font = '52px serif';
    s.ctx.fillText('🧑‍', s.px + 21, s.py + 27);
  }
}
function viajeFinalizar(): void {
  const s = viajeState;
  if (Estado.terminado) return;
  s.corriendo = false; cancelAnimationFrame(s.rafId);
  Estado.terminado = true;
  const cfg = s.config[s.nivel];
  const segundos = Math.floor(s.tiempo / 1000);
  s.puntos += segundos;
  const exitoso = s.vidas > 0;
  mostrarResumen({
    titulo: exitoso ? '🚀 ¡Viaje completado!' : 'Aterrizaje forzoso 🙂',
    stats: [
      { etiqueta: 'Estrellas ⭐', valor: s.estrellasRec },
      { etiqueta: 'Obstáculos superados', valor: s.obstaculosSaltados },
      { etiqueta: 'Vidas restantes ❤️', valor: Math.max(0, s.vidas) },
      { etiqueta: 'Tiempo de viaje', valor: mmss(segundos) },
      { etiqueta: 'Velocidad máxima', valor: 'x' + (cfg.velMax / cfg.velBase).toFixed(1) }
    ],
    mensaje: exitoso ? aleatoria(FRASES.final) : '¡Buen intento! Las estrellas te esperan.',
    juego: 'viaje', nivel: s.nivel, exitoso, puntaje: s.puntos
  });
}

// ============ PALABRAS (con palabras personales de Oscar) ============
const palState = {
  config: {
    facil: { total: 5, palabras: ['SOL', 'PAN', 'MAR', 'LUZ', 'PAZ', 'GATO', 'MESA', 'VIDA', 'AMOR', 'CASA', 'MANO', 'OSO', 'BRISA', 'ANDREA', 'ABROJO'] },
    medio: { total: 6, palabras: ['PERRO', 'PLAYA', 'CAMPO', 'VERDE', 'LIBRO', 'NOCHE', 'SILLA', 'COCINA', 'JARDIN', 'FUENTE', 'BRAZO', 'CUELLO', 'HERNAN', 'ESTEBAN'] },
    dificil: { total: 7, palabras: ['VENTANA', 'CAMINAR', 'DESCANSO', 'CONTENTO', 'GIMNASIA', 'MEMORIA', 'ATENCION', 'EJERCICIO', 'FAMILIA', 'CABEZA', 'HOMBRO', 'RODILLA', 'ITUZAINGO', 'INDEPENDIENTE'] }
  } as Record<Dificultad, { total: number; palabras: string[] }>,
  nivel: 'facil' as Dificultad, lista: [] as string[], indice: 0, texto: '',
  errores: 0, erroresPalabra: 0, aciertos: 0, segundos: 0,
  timer: null as number | null, bloqueada: false, sesion: 0
};
const Palabras: Juego = {
  async comenzar(n) {
    const s = palState; s.nivel = n || s.nivel; s.sesion++; Estado.terminado = false;
    if (s.timer) clearInterval(s.timer); s.timer = null;
    s.lista = mezclar(s.config[s.nivel].palabras).slice(0, s.config[s.nivel].total);
    s.indice = 0; s.texto = ''; s.errores = 0; s.aciertos = 0; s.segundos = 0;
    $('#palabras-errores').textContent = '0'; $('#palabras-tiempo').textContent = '00:00';
    palFeedback('Escribí la palabra que ves ✍️');
    palActualizarProgreso();
    await guiaVisual($('#palabra-modelo').parentElement as HTMLElement);
    s.timer = setInterval(() => { s.segundos++; $('#palabras-tiempo').textContent = mmss(s.segundos); }, 1000);
    palRender();
  },
  pausar() { const s = palState; if (s.timer) clearInterval(s.timer); s.timer = null; },
  reanudar() { const s = palState; if (!Estado.terminado && !s.timer && s.lista.length) s.timer = setInterval(() => { s.segundos++; $('#palabras-tiempo').textContent = mmss(s.segundos); }, 1000); },
  detener() { const s = palState; s.sesion++; if (s.timer) clearInterval(s.timer); s.timer = null; }
};
function palRender(): void {
  const s = palState;
  const palabra = s.lista[s.indice];
  s.texto = ''; s.erroresPalabra = 0; s.bloqueada = false;
  $('#palabra-modelo').textContent = palabra;
  const cont = $('#palabra-cajas'); cont.innerHTML = '';
  for (let i = 0; i < palabra.length; i++) { const c = document.createElement('div'); c.className = 'caja-letra'; cont.appendChild(c); }
}
function palActualizarCajas(): void {
  const s = palState;
  $$('#palabra-cajas .caja-letra').forEach((c, i) => {
    c.textContent = s.texto[i] || '';
    c.classList.toggle('llena', !!s.texto[i]);
    c.classList.remove('error');
  });
}
function palTecla(letra: string): void {
  const s = palState;
  if (Estado.enPausa || s.bloqueada || Estado.terminado) return;
  const palabra = s.lista[s.indice];
  if (!palabra || s.texto.length >= palabra.length) return;
  Sonido.click();
  s.texto += letra;
  palActualizarCajas();
  if (s.texto.length === palabra.length) {
    if (s.texto === palabra) {
      s.bloqueada = true;
      if (s.erroresPalabra === 0) s.aciertos++;
      Sonido.acierto();
      const especial = PALABRAS_ESPECIALES[palabra];
      palFeedback(especial ? especial + ' ' + aleatoria(FRASES.animo) : aleatoria(FRASES.animo), 'exito');
      const ses = s.sesion;
      setTimeout(() => {
        if (s.sesion !== ses) return;
        s.indice++;
        if (s.indice >= s.lista.length) palFinalizar();
        else { palRender(); palActualizarProgreso(); }
      }, 900);
    } else {
      s.bloqueada = true;
      s.errores++; s.erroresPalabra++;
      $('#palabras-errores').textContent = String(s.errores);
      Sonido.fallo();
      palFeedback(aleatoria(FRASES.retry));
      $$('#palabra-cajas .caja-letra').forEach(c => c.classList.add('error'));
      const ses = s.sesion;
      setTimeout(() => { if (s.sesion !== ses) return; s.texto = ''; palActualizarCajas(); s.bloqueada = false; }, 900);
    }
  }
}
function palBorrar(): void {
  const s = palState;
  if (Estado.enPausa || s.bloqueada) return;
  s.texto = s.texto.slice(0, -1);
  palActualizarCajas();
}
function palActualizarProgreso(): void {
  const s = palState;
  $('#palabras-progreso').textContent = Math.min(s.indice + 1, s.lista.length) + '/' + s.lista.length;
}
function palFeedback(t: string, c?: string): void { const f = $('#palabras-feedback'); f.textContent = t; f.className = 'feedback' + (c === 'exito' ? ' fb-exito' : ''); }
function palFinalizar(): void {
  const s = palState;
  if (s.timer) { clearInterval(s.timer); s.timer = null; }
  const total = s.lista.length;
  const pts = Math.max(0, s.aciertos * 100 - s.errores * 10);
  const exitoso = s.aciertos >= Math.ceil(total * 0.6);
  mostrarResumen({ titulo: exitoso ? '¡Nivel completado! ✍️' : 'Fin del nivel 🙂', stats: [{ etiqueta: 'Palabras correctas', valor: s.aciertos + '/' + total }, { etiqueta: 'Errores', valor: s.errores }, { etiqueta: 'Tiempo', valor: mmss(s.segundos) }], mensaje: aleatoria(FRASES.final), juego: 'palabras', nivel: s.nivel, exitoso, puntaje: pts });
}
function construirTeclado(): void {
  const cont = $('#teclado'); cont.innerHTML = '';
  const filas = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  filas.forEach((fila, fi) => {
    const row = document.createElement('div'); row.className = 'teclado-fila';
    for (const ch of fila) {
      const b = document.createElement('button'); b.className = 'tecla'; b.textContent = ch;
      b.addEventListener('click', () => palTecla(ch));
      row.appendChild(b);
    }
    if (fi === 2) {
      const del = document.createElement('button'); del.className = 'tecla ancha'; del.textContent = '⌫';
      del.addEventListener('click', palBorrar);
      row.appendChild(del);
    }
    cont.appendChild(row);
  });
}

const Juegos: Record<JuegoId, Juego> = { memoria: Memoria, atencion: Atencion, coordinacion: Coordinacion, viaje: Viaje, palabras: Palabras };

// ============ PROGRESO ============
function mostrarProgreso(): void {
  const s = Sesiones.obtener();
  const total = s.length;
  const completadas = s.filter(x => x.exitoso).length;
  const ptsTotal = s.reduce((a, x) => a + (x.puntaje || 0), 0);
  const mejor = s.reduce((m, x) => Math.max(m, x.puntaje || 0), 0);
  $('#resumen-general').innerHTML =
    '<div class="res-stat"><span>Total sesiones</span><strong>' + total + '</strong></div>' +
    '<div class="res-stat"><span>Completadas</span><strong>' + completadas + '</strong></div>' +
    '<div class="res-stat"><span>Puntaje total</span><strong>' + ptsTotal + '</strong></div>' +
    '<div class="res-stat"><span>Mejor puntaje</span><strong>' + mejor + '</strong></div>';
  const coord = s.filter(x => x.juego === 'coordinacion' && x.tiempoIzq);
  let promI = 0, promD = 0;
  if (coord.length) {
    promI = Math.round(coord.reduce((a, x) => a + (x.tiempoIzq || 0), 0) / coord.length);
    const conDer = coord.filter(x => x.tiempoDer);
    if (conDer.length) promD = Math.round(conDer.reduce((a, x) => a + (x.tiempoDer || 0), 0) / conDer.length);
  }
  const max = Math.max(promI, promD, 500);
  $('#grafico-lados').innerHTML =
    '<div class="lado-barra"><div class="lado-barra-valor">' + (promI || '—') + ' ms</div><div class="lado-barra-fill" style="height:' + (promI ? (promI / max * 100) : 5) + '%;background:var(--acento)"></div><div class="lado-barra-label">⬅️ Izquierdo</div></div>' +
    '<div class="lado-barra"><div class="lado-barra-valor">' + (promD ? promD + ' ms' : '—') + '</div><div class="lado-barra-fill" style="height:' + (promD ? (promD / max * 100) : 5) + '%"></div><div class="lado-barra-label">➡️ Derecho</div></div>';
  const lista = $('#sesiones-lista');
  if (s.length === 0) { lista.innerHTML = '<p style="padding:20px;text-align:center;color:var(--texto-suave);">Sin sesiones aún 🎮</p>'; return; }
  lista.innerHTML = s.slice().reverse().map(x => {
    const f = new Date(x.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const lados = (x.tiempoIzq || x.tiempoDer) ? '<br><small>⬅️ ' + (x.tiempoIzq || '—') + ' ms · ➡️ ' + (x.tiempoDer || '—') + ' ms</small>' : '';
    return '<div class="sesion-item"><div style="font-size:.85rem;color:var(--texto-suave);">' + f + '</div><div style="font-weight:700;margin:4px 0;">' + x.juego + ' (' + x.nivel + ') ' + (x.exitoso ? '✅' : '⚠️') + '</div><div style="font-size:.9rem;">⭐ ' + x.puntaje + ' pts · ⏱️ ' + x.duracion + 's' + lados + '</div></div>';
  }).join('');
}
function exportarProgreso(): void {
  const t = Sesiones.exportar();
  const blob = new Blob([t], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'oscar-progreso-' + new Date().toISOString().split('T')[0] + '.txt';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  toast('📄 Archivo descargado', 'exito');
}

// ============ MASCOTA LUNA ============
let _mascTimer: number | undefined;
function initMascota(): void {
  $('#mascota-bot').addEventListener('click', ev => {
    ev.stopPropagation();
    Sonido.ladrido();
    $('#ejercicio-texto').textContent = aleatoria(EJERCICIOS);
    abrirModal('modal-ejercicio');
  });
  $('#btn-ejercicio-hecho').addEventListener('click', () => {
    cerrarModal('modal-ejercicio');
    festejarMascota();
  });
}
function festejarMascota(): void {
  Sonido.festejo();
  Confetti.explotar();
  const bot = $('#mascota-bot');
  bot.classList.add('festejando');
  setTimeout(() => bot.classList.remove('festejando'), 1000);
  const b = $('#mascota-burbuja');
  b.textContent = '🎉 ¡Guau guau! ¡Muy bien hecho!';
  b.classList.add('visible');
  clearTimeout(_mascTimer);
  _mascTimer = window.setTimeout(() => b.classList.remove('visible'), 5000);
  if (Terapia.multi) Sonido.hablar('¡Muy bien Oscár, ejercicio completado!');
}

// ============ INIT ============
function init(): void {
  cargarTerapia();
  (['hemianopsia', 'cimt', 'saliencia', 'multi', 'enfoque'] as const).forEach(k => {
    const sw = $<HTMLInputElement>('#sw-' + k);
    sw.addEventListener('change', () => { Terapia[k] = sw.checked; guardarTerapia(); aplicarUITerapia(); Sonido.click(); });
  });
  aplicarUITerapia();
  $('#btn-subir-fotos').addEventListener('click', () => ($<HTMLInputElement>('#input-fotos')).click());
  ($<HTMLInputElement>('#input-fotos')).addEventListener('change', e => {
    const target = e.target as HTMLInputElement;
    Array.from(target.files || []).forEach(f => {
      const r = new FileReader();
      r.onload = ev => { Terapia.fotos.push(ev.target!.result as string); guardarTerapia(); aplicarUITerapia(); };
      r.readAsDataURL(f);
    });
    target.value = '';
  });
  let tema = 'claro'; try { tema = localStorage.getItem('rc-tema') || 'claro'; } catch (e) {}
  document.documentElement.setAttribute('data-theme', tema);
  $$('.btn-tema').forEach(b => b.textContent = tema === 'oscuro' ? '☀️ Modo claro' : '🌙 Modo oscuro');
  $$('.btn-tema').forEach(b => b.addEventListener('click', alternarTema));
  ['#btn-sonido-menu', '#btn-sonido-barra'].forEach(sel => { const b = document.querySelector(sel); if (b) b.addEventListener('click', alternarSonido); });
  document.addEventListener('click', () => Sonido.inicializar(), { once: true });
  document.addEventListener('touchstart', () => Sonido.inicializar(), { once: true });

  crearSelector('selector-inicio', Estado.dificultad, d => Estado.dificultad = d);

  // Menú principal
  $('#btn-juego-memoria').addEventListener('click', () => abrirJuego('memoria'));
  $('#btn-juego-atencion').addEventListener('click', () => abrirJuego('atencion'));
  $('#btn-juego-coordinacion').addEventListener('click', () => abrirJuego('coordinacion'));
  $('#btn-juego-viaje').addEventListener('click', () => abrirJuego('viaje'));
  $('#btn-juego-palabras').addEventListener('click', () => abrirJuego('palabras'));
  $('#btn-juego-config').addEventListener('click', () => { Sonido.click(); mostrarPantalla('config'); });
  $('#btn-volver-config').addEventListener('click', () => { Sonido.click(); mostrarPantalla('menu'); });
  $('#btn-ver-progreso-menu').addEventListener('click', () => { Sonido.click(); mostrarPantalla('progreso'); });

  // Barra de juego
  $('#btn-pausa').addEventListener('click', alternarPausa);
  $('#btn-salir').addEventListener('click', () => { Sonido.click(); detenerJuego(); mostrarPantalla('menu'); });
  $('#btn-pausa-continuar').addEventListener('click', alternarPausa);
  $('#btn-pausa-salir').addEventListener('click', () => { cerrarModal('modal-pausa'); Estado.enPausa = false; detenerJuego(); mostrarPantalla('menu'); });

  // Selectores de dificultad por juego
  crearSelector('selector-dif-memoria', Estado.dificultad, d => { Estado.dificultad = d; Memoria.comenzar(d); });
  crearSelector('selector-dif-atencion', Estado.dificultad, d => { Estado.dificultad = d; Atencion.comenzar(d); });
  crearSelector('selector-dif-coordinacion', Estado.dificultad, d => { Estado.dificultad = d; Coordinacion.comenzar(d); });
  crearSelector('selector-dif-viaje', Estado.dificultad, d => { Estado.dificultad = d; Viaje.comenzar(d); });
  crearSelector('selector-dif-palabras', Estado.dificultad, d => { Estado.dificultad = d; Palabras.comenzar(d); });

  // Reiniciar
  $('#btn-reiniciar-memoria').addEventListener('click', () => { Sonido.click(); Memoria.comenzar(memState.nivel); });
  $('#btn-reiniciar-atencion').addEventListener('click', () => { Sonido.click(); Atencion.comenzar(atState.nivel); });
  $('#btn-reiniciar-coordinacion').addEventListener('click', () => { Sonido.click(); Coordinacion.comenzar(coState.nivel); });
  $('#btn-reiniciar-viaje').addEventListener('click', () => { Sonido.click(); Viaje.comenzar(viajeState.nivel); });
  $('#btn-reiniciar-palabras').addEventListener('click', () => { Sonido.click(); Palabras.comenzar(palState.nivel); });
  $$('.btn-volver-menu').forEach(b => b.addEventListener('click', () => { Sonido.click(); mostrarPantalla('menu'); }));

  // Progreso
  $('#btn-volver-desde-progreso').addEventListener('click', () => { Sonido.click(); mostrarPantalla('menu'); });
  $('#btn-exportar').addEventListener('click', () => { Sonido.click(); exportarProgreso(); });

  // Teclado físico (palabras) + espacio (viaje)
  document.addEventListener('keydown', e => {
    if (Estado.juegoActivo === 'palabras' && !Estado.enPausa && !Estado.terminado) {
      if (/^[a-zA-Z]$/.test(e.key)) palTecla(e.key.toUpperCase());
      else if (e.key === 'Backspace') { e.preventDefault(); palBorrar(); }
    }
    if (Estado.juegoActivo === 'viaje' && (e.code === 'Space' || e.code === 'ArrowUp')) {
      e.preventDefault();
      if (viajeState.corriendo && !Estado.enPausa) viajeSaltar();
    }
  });

  construirTeclado();
  Confetti.inicializar();
  viajeInit();
  initMascota();
}
document.addEventListener('DOMContentLoaded', init);
