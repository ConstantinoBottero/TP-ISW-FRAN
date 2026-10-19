import db from "./db.json";

export function cargarDB() {
  return db;
}

export function getActividades() {
  return db.actividades;
}

export function getActividad(id) {
  return db.actividades.find((a) => a.id === id) ?? null;
}

export function getHorario(actividadId, horarioId) {
  const actividad = getActividad(actividadId);
  if (!actividad) return null;
  return actividad.horarios.find((h) => h.id === horarioId) ?? null;
}

export function getUsuario(username) {
  return db.usuarios.find((u) => u.username === username) ?? null;
}

export function inscribirse() {}

const HORA_PRIMER_TURNO = 9;
const HORA_ULTIMO_TURNO = 17;

export const validarHorarioParque = (horario) => {
  const h = Number.parseInt(horario.split(":")[0], 10);
  if (Number.isNaN(h)) return false;
  return h >= HORA_PRIMER_TURNO && h <= HORA_ULTIMO_TURNO;
};

export const esFestivo = (fecha) => {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  return (mes === 12 && dia === 25) || (mes === 1 && dia === 1);
};

export const validarDiaParqueAbierto = (fecha) => {
  if (fecha.getDay() === 1) return false;
  if (esFestivo(fecha)) return false;
  return true;
};

export function formatearFecha(fecha) {
  return fecha.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function mensajeParqueCerrado(fecha) {
  return `Hoy ${formatearFecha(fecha)}, el parque está cerrado.`;
}

export function mensajeHorarioSinCupos(horario) {
  return `La actividad seleccionada no tiene cupos en el horario ${horario} hs`;
}

export const validarParqueAbierto = (fecha, horario) => {
  return validarDiaParqueAbierto(fecha) && validarHorarioParque(horario);
};

export const validarHorarioDisponible = (actividadId, horario) => {
  const actividad = getActividad(actividadId);
  if (!actividad) return false;
  return actividad.horarios.some((h) => h.hora === horario);
};

export const esCantidadValida = (cantidad) => {
  if (typeof cantidad !== "number" || !Number.isInteger(cantidad)) return false;
  return cantidad > 0;
};

export const getCuposDisponibles = (actividadId, horario) => {
  const actividad = getActividad(actividadId);
  if (!actividad) return null;
  const horarioObj = actividad.horarios.find((h) => h.hora === horario);
  if (!horarioObj) return null;
  return horarioObj.cuposDisponibles;
};

export const validarCantidadDisponible = (actividadId, horario, cantidad) => {
  const cupos = getCuposDisponibles(actividadId, horario);
  if (cupos === null) return false;
  return cantidad <= cupos;
};

export function mensajeCupoSuperado(cuposDisponibles) {
  return `La cantidad ingresada supera el cupo disponible (${cuposDisponibles}) para esta actividad en el horario seleccionado.`;
}

export const validarNombre = (nombre) => {
  if (typeof nombre !== "string") return false;
  return /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombre) && nombre.trim().length > 0;
};

export const validarDNI = (dni) => {
  if (!/^\d+$/.test(String(dni).trim())) return false;
  const n = Number(dni);
  return n >= 1000000 && n <= 99999999;
};

export const validarEdad = (edad) => {
  const n = Number(edad);
  return Number.isInteger(n) && n >= 1 && n <= 99;
};
