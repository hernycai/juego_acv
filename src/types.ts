export type Dificultad = 'facil' | 'medio' | 'dificil';
export type JuegoId = 'memoria' | 'atencion' | 'coordinacion' | 'viaje' | 'palabras';
export type Lado = 'izq' | 'der';

export interface EstadoGlobal {
  dificultad: Dificultad;
  juegoActivo: JuegoId | null;
  enPausa: boolean;
  terminado: boolean;
}

export interface Stat {
  etiqueta: string;
  valor: string | number;
}

export interface DatosResumen {
  titulo: string;
  stats: Stat[];
  mensaje: string;
  juego: JuegoId;
  nivel: Dificultad;
  exitoso: boolean;
  puntaje: number;
  tiempoIzq?: number;
  tiempoDer?: number;
}

export interface Sesion {
  fecha: string;
  juego: JuegoId;
  nivel: Dificultad;
  puntaje: number;
  exitoso: boolean;
  duracion: number;
  stats: Record<string, string | number>;
  tiempoIzq: number | null;
  tiempoDer: number | null;
}

export interface ConfigTerapia {
  hemianopsia: boolean;
  cimt: boolean;
  saliencia: boolean;
  multi: boolean;
  enfoque: boolean;
  fotos: string[];
}

export interface ConfigViaje {
  velBase: number;
  velMax: number;
  acel: number;
  obsMin: number;
  obsMax: number;
  estMin: number;
  estMax: number;
  duracion: number;
  vidas: number;
}

export interface Obstaculo {
  x: number;
  y: number;
  w: number;
  h: number;
  tipo: 'roca' | 'alien';
  emoji: string;
  contado: boolean;
  golpeado: boolean;
}

export interface EstrellaItem {
  x: number;
  y: number;
  r: number;
  tomada: boolean;
}

export interface FondoEstrella {
  x: number;
  y: number;
  tam: number;
  v: number;
}

export interface ItemMemoria {
  id: number;
  valor: string;
  esFoto: boolean;
  descubierta: boolean;
  emparejada: boolean;
}

export interface Juego {
  id: JuegoId;
  comenzar: (dif: Dificultad) => void;
  detener: () => void;
}
