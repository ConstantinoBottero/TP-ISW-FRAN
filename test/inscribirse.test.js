import { expect, describe, it } from "vitest";
import {
  inscribirse,
  cargarDB,
  getActividades,
  getActividad,
  getHorario,
  validarHorarioParque,
  validarDiaParqueAbierto,
  validarHorarioDisponible,
  esCantidadValida,
  validarCantidadDisponible,
  validarNombre,
  validarDNI,
  validarEdad,
} from "../index.js";

describe("Inscribirse a Actividad", () => {
  it("Deberia ser una funcion", () => {
    expect(typeof inscribirse).toBe("function");
  });

  it("Deberia validar que el horario seleccionado para inscribirse sea dentro del horario permitido del parque", () => {
    const horarioValido = "10:00";
    const horarioInvalido1 = "07:00";
    const horarioInvalido2 = "19:00";
    expect(validarHorarioParque(horarioValido)).toBe(true);
    expect(validarHorarioParque(horarioInvalido1)).toBe(false);
    expect(validarHorarioParque(horarioInvalido2)).toBe(false);
  });

  it("deberia aceptar turnos de 09:00 a 17:00 y rechazar 08:00 y 18:00", () => {
    expect(validarHorarioParque("09:00")).toBe(true);
    expect(validarHorarioParque("17:00")).toBe(true);
    expect(validarHorarioParque("08:00")).toBe(false);
    expect(validarHorarioParque("18:00")).toBe(false);
  });

  it("deberia validar que el parque no abre los lunes", () => {
    const lunes = new Date(2026, 5, 1);
    const martes = new Date(2026, 5, 2);
    expect(validarDiaParqueAbierto(lunes)).toBe(false);
    expect(validarDiaParqueAbierto(martes)).toBe(true);
  });

  it("deberia validar cierre en Navidad y Año Nuevo", () => {
    const navidad = new Date(2026, 11, 25);
    const añoNuevo = new Date(2026, 0, 1);
    const diaPosteriorNavidad = new Date(2026, 11, 26);
    expect(validarDiaParqueAbierto(navidad)).toBe(false);
    expect(validarDiaParqueAbierto(añoNuevo)).toBe(false);
    expect(validarDiaParqueAbierto(diaPosteriorNavidad)).toBe(true);
  });

  it("deberia validar si el horario seleccionado esta disponible para la actividad seleccionada", () => {
    const actividad = "tirolesa";
    const horarioDisponible = "09:00";
    const horarioNoDisponible = "12:00";
    expect(validarHorarioDisponible(actividad, horarioDisponible)).toBe(true);
    expect(validarHorarioDisponible(actividad, horarioNoDisponible)).toBe(
      false,
    );
  });

  it("deberia validar si la cantidad ingresada es mayor a 0", () => {
    const cantidadValida = 5;
    const cantidadInvalida = 0;
    expect(esCantidadValida(cantidadValida)).toBe(true);
    expect(esCantidadValida(cantidadInvalida)).toBe(false);
  });

  it("deberia validar si la cantidad ingresada es un numero entero", () => {
    const cantidadValida = 5;
    const cantidadInvalida = 2.5;
    expect(esCantidadValida(cantidadValida)).toBe(true);
    expect(esCantidadValida(cantidadInvalida)).toBe(false);
  });

  it("deberia validar que el nombre de un participante solo contenga letras", () => {
    expect(validarNombre("Juan")).toBe(true);
    expect(validarNombre("Maria Jose")).toBe(true);
    expect(validarNombre("Juan123")).toBe(false);
    expect(validarNombre("")).toBe(false);
    expect(validarNombre("   ")).toBe(false);
  });

  it("deberia validar que el DNI de un participante sea un numero entero entre 1000000 y 99999999", () => {
    expect(validarDNI("7500000")).toBe(true);
    expect(validarDNI("99999999")).toBe(true);
    expect(validarDNI("999999")).toBe(false);
    expect(validarDNI("100000000")).toBe(false);
    expect(validarDNI("abc")).toBe(false);
    expect(validarDNI("7500000.5")).toBe(false);
  });

  it("deberia validar que la edad de un participante sea un numero entero entre 1 y 99", () => {
    expect(validarEdad(1)).toBe(true);
    expect(validarEdad(99)).toBe(true);
    expect(validarEdad(0)).toBe(false);
    expect(validarEdad(100)).toBe(false);
    expect(validarEdad(2.5)).toBe(false);
  });

  it("deberia validar si la cantidad ingresada es menor o igual al cupo disponible para la actividad en el horario seleccionado", () => {
    const actividadId = "tirolesa";
    const horario = "09:00";
    const cantidadValida = 8;
    const cantidadInvalida = 9;
    expect(
      validarCantidadDisponible(actividadId, horario, cantidadValida),
    ).toBe(true);
    expect(
      validarCantidadDisponible(actividadId, horario, cantidadInvalida),
    ).toBe(false);
  });
});
