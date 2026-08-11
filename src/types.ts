export type Dificultad = 'facil' | 'medio' | 'dificil';
export type JuegoId = 'memoria' | 'atencion' | 'coordinacion' | 'viaje' | 'palabras';

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
}

export interface Sesion {
  fecha: string;
  juego: JuegoId;
  nivel: Dificultad;
  puntaje: number;
  exitoso: boolean;
  duracion: number;
  stats: Record<string, string | number>;
}

export interface ConfigTerapia {
  hemianopsia: boolean;
  cimt: boolean;
  multi: boolean;
  enfoque: boolean;
}

export interface ObstaculoMario {
  x: number;
  y: number;
  w: number;
  h: number;
  tipo: 'asteroide' | 'barrera' | 'mina' | 'tubería' | 'bloque' | 'hongo';
  golpeado: boolean;
}

export interface MonedaMario {
  x: number;
  y: number;
  r: number;
  tomada: boolean;
}

export interface CartaMemoriaSVG {
  id: number;
  nombre: string;
  svg: string;
  descubierta: boolean;
  emparejada: boolean;
}

export interface GloboItem {
  id: number;
  x: number;
  y: number;
  color: string;
  emoji: string;
  tocada: boolean;
}
