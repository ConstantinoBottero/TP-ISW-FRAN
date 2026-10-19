import { expect, describe, it } from "vitest";
import {
  inscribirse,
  cargarDB,
  getActividades,
  getActividad,
  getHorario,
  getUsuario,
} from "../index.js";

describe("Obtener datos", () => {
  it("Deberia retornar un json con array de actividades e inscripciones", () => {
    const resultado = cargarDB();
    expect(typeof resultado).toBe("object");
    expect(Array.isArray(resultado.actividades)).toBe(true);
    expect(Array.isArray(resultado.inscripciones)).toBe(true);
  });

  it("Deberia retornar un array de actividades", () => {
    const resultado = getActividades();
    expect(Array.isArray(resultado)).toBe(true);
  });

  it("Deberia retornar un array de actividades con objetos que tengan id, nombre, requiereTalla, terminosYCondiciones, horarios", () => {
    const resultado = getActividades();
    expect(Array.isArray(resultado)).toBe(true);
    if (resultado.length > 0) {
      expect(typeof resultado[0]).toBe("object");
      expect(resultado[0].id).toBeDefined();
      expect(resultado[0].nombre).toBeDefined();
      expect(resultado[0].requiereTalla).toBeDefined();
      expect(resultado[0].terminosYCondiciones).toBeDefined();
      expect(Array.isArray(resultado[0].horarios)).toBe(true);
    }
  });

  it("Deberia retornar un objeto actividad con el id tirolesa si el id proporcionado es tirolesa", () => {
    const actividad = getActividad("tirolesa");
    expect(typeof actividad).toBe("object");
    expect(actividad.id).toBe("tirolesa");
  });

  it("Deberia retornar null si el id proporcionado no existe", () => {
    const actividad = getActividad("idInexistente");
    expect(actividad).toBeNull();
  });

  it("Deberia retornar un objeto horario con el id tirolesa-1 si el id proporcionado es tirolesa-1", () => {
    const horario = getHorario("tirolesa", "tirolesa-1");
    expect(typeof horario).toBe("object");
    expect(horario.id).toBe("tirolesa-1");
  });
});

describe("Usuarios", () => {
  it("Deberia retornar el usuario fran con sus datos al buscarlo por username", () => {
    const usuario = getUsuario("fran");
    expect(usuario).not.toBeNull();
    expect(typeof usuario).toBe("object");
    expect(usuario.username).toBe("fran");
    expect(usuario.email).toBe("franreinaudo@gmail.com");
    expect(usuario.nombreCompleto).toBe("Francisco Reinaudo");
  });

  it("Deberia retornar null si el username no existe", () => {
    const usuario = getUsuario("inexistente");
    expect(usuario).toBeNull();
  });
});
