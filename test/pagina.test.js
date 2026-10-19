// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initPage } from "../app.js";
import {
  cargarDB,
  getActividades,
  getActividad,
  mensajeParqueCerrado,
  mensajeHorarioSinCupos,
  getCuposDisponibles,
  mensajeCupoSuperado,
} from "../index.js";
import * as email from "../email.js";

describe("Página principal", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    initPage();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("debe mostrar el botón de inscribirse a actividad", () => {
    const btn = document.querySelector('[data-testid="btn-inscribirse"]');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe("Inscribirme a actividad");
  });

  it("el formulario debe estar oculto inicialmente", () => {
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    expect(form).not.toBeNull();
    expect(form.hidden).toBe(true);
  });

  it("al hacer click en el botón debe mostrar el formulario", () => {
    const btn = document.querySelector('[data-testid="btn-inscribirse"]');
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );

    btn.click();

    expect(form.hidden).toBe(false);
  });

  it("el formulario debe contener un selector de actividades", () => {
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const select = form.querySelector('select[name="actividad"]');
    expect(select).not.toBeNull();
  });

  it("el selector de actividades debe contener todas las actividades disponbles para seleccionar", () => {
    const actividades = getActividades();
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const select = form.querySelector('select[name="actividad"]');
    const options = select.querySelectorAll("option[value]:not([value=''])");
    expect(options.length).toBe(actividades.length);
  });

  it("deberia existir un selector de horario que muestre horas cada 60minutos desde las 00:00 hasta las 23:00", () => {
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const select = form.querySelector('select[name="horario"]');
    expect(select).not.toBeNull();
    const options = select.querySelectorAll("option[value]:not([value=''])");
    expect(options.length).toBe(24);
    for (let i = 0; i < 24; i++) {
      const hora = i.toString().padStart(2, "0") + ":00";
      expect(Array.from(options).some((o) => o.value === hora)).toBeTruthy();
    }
  });

  it("deberia mostrar alerta si hoy el parque esta cerrado", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 1));
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    document.body.innerHTML = "";
    initPage();
    const btn = document.querySelector('[data-testid="btn-inscribirse"]');
    btn.click();
    expect(alertMock).toHaveBeenCalledWith(
      mensajeParqueCerrado(new Date(2026, 5, 1)),
    );
    alertMock.mockRestore();
  });

  it("deberia mostrar una alerta si el usuario elige un horario fuera del horario permitido del parque", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const selectHorario = form.querySelector('select[name="horario"]');
    selectHorario.value = "07:00";
    selectHorario.dispatchEvent(new Event("change"));
    expect(alertMock).toHaveBeenCalledWith(
      "El horario seleccionado no es válido. Los turnos del parque son de 09:00 a 17:00.",
    );
    alertMock.mockRestore();
  });

  it("deberia permitir ingresar una cantidad de personas para la actividad si la misma esta disponible en el horario seleccionado", () => {
    const horarioValido = "09:00";
    const actividad = "tirolesa";
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const selectActividad = form.querySelector('select[name="actividad"]');
    const selectHorario = form.querySelector('select[name="horario"]');
    selectActividad.value = actividad;
    selectHorario.value = horarioValido;
    selectHorario.dispatchEvent(new Event("change"));
    const inputCantidad = form.querySelector('input[name="cantidad"]');
    expect(inputCantidad.disabled).toBe(false);
  });

  it("deberia mostrar una alerta y no permitir ingresar una cantidad de personas para la actividad si la misma no esta disponible en el horario seleccionado", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const horarioInvalido = "12:00";
    const actividad = "tirolesa";
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const selectActividad = form.querySelector('select[name="actividad"]');
    const selectHorario = form.querySelector('select[name="horario"]');
    selectActividad.value = actividad;
    selectHorario.value = horarioInvalido;
    selectHorario.dispatchEvent(new Event("change"));
    expect(alertMock).toHaveBeenCalledWith(
      mensajeHorarioSinCupos(horarioInvalido),
    );
    const inputCantidad = form.querySelector('input[name="cantidad"]');
    expect(inputCantidad.disabled).toBe(true);
    alertMock.mockRestore();
  });

  it("al seleccionar un horario con cupo 0, deberia mostrar alerta", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const selectActividad = form.querySelector('select[name="actividad"]');
    const selectHorario = form.querySelector('select[name="horario"]');
    selectActividad.value = "tirolesa";
    selectHorario.value = "14:00"; // cuposDisponibles: 0
    selectHorario.dispatchEvent(new Event("change"));
    expect(alertMock).toHaveBeenCalledWith(mensajeHorarioSinCupos("14:00"));
    alertMock.mockRestore();
  });

  it("al seleccionar un horario con cupo 0, no deberia permitir ingresar cantidad", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const selectActividad = form.querySelector('select[name="actividad"]');
    const selectHorario = form.querySelector('select[name="horario"]');
    selectActividad.value = "tirolesa";
    selectHorario.value = "14:00"; // cuposDisponibles: 0
    selectHorario.dispatchEvent(new Event("change"));
    const inputCantidad = form.querySelector('input[name="cantidad"]');
    expect(inputCantidad.disabled).toBe(true);
    alertMock.mockRestore();
  });

  it("deberia mostrar una alerta si se ingresa una cantidad negativa, cero, no entera o no es un numero", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const selectActividad = form.querySelector('select[name="actividad"]');
    const selectHorario = form.querySelector('select[name="horario"]');
    const inputCantidad = form.querySelector('input[name="cantidad"]');
    selectActividad.value = "tirolesa";
    selectHorario.value = "09:00";
    selectHorario.dispatchEvent(new Event("change"));
    inputCantidad.value = -1;
    inputCantidad.dispatchEvent(new Event("input"));
    expect(alertMock).toHaveBeenCalledWith(
      "La cantidad ingresada no es válida. Por favor ingrese un número entero mayor a 0.",
    );
    inputCantidad.value = 0;
    inputCantidad.dispatchEvent(new Event("input"));
    expect(alertMock).toHaveBeenCalledWith(
      "La cantidad ingresada no es válida. Por favor ingrese un número entero mayor a 0.",
    );
    inputCantidad.value = 2.5;
    inputCantidad.dispatchEvent(new Event("input"));
    expect(alertMock).toHaveBeenCalledWith(
      "La cantidad ingresada no es válida. Por favor ingrese un número entero mayor a 0.",
    );
    inputCantidad.value = "abc";
    inputCantidad.dispatchEvent(new Event("input"));
    expect(alertMock).toHaveBeenCalledWith(
      "La cantidad ingresada no es válida. Por favor ingrese un número entero mayor a 0.",
    );
    inputCantidad.value = "e";
    inputCantidad.dispatchEvent(new Event("input"));
    expect(alertMock).toHaveBeenCalledWith(
      "La cantidad ingresada no es válida. Por favor ingrese un número entero mayor a 0.",
    );
    alertMock.mockRestore();
  });

  it("deberia mostrar un mensaje en rojo si la cantidad ingresada es mayor al cupo disponible para la actividad en el horario seleccionado", () => {
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const selectActividad = form.querySelector('select[name="actividad"]');
    const selectHorario = form.querySelector('select[name="horario"]');
    const inputCantidad = form.querySelector('input[name="cantidad"]');
    selectActividad.value = "tirolesa";
    selectHorario.value = "09:00";
    selectHorario.dispatchEvent(new Event("change"));
    inputCantidad.value = 9;
    inputCantidad.dispatchEvent(new Event("input"));
    const campoCantidad = form.querySelector('[data-field="cantidad"]');
    const mensajeError = campoCantidad.querySelector(".mensaje-error");
    const cupos = getCuposDisponibles("tirolesa", "09:00");
    expect(mensajeError).not.toBeNull();
    expect(mensajeError.textContent).toBe(mensajeCupoSuperado(cupos));
  });

  it("deberia mostrar un boton de agregar informacion de participantes cuando se ingresa una cantidad de personas menor o igual al cupo disponible para la actividad en el horario seleccionado", () => {
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const selectActividad = form.querySelector('select[name="actividad"]');
    const selectHorario = form.querySelector('select[name="horario"]');
    const inputCantidad = form.querySelector('input[name="cantidad"]');
    selectActividad.value = "tirolesa";
    selectHorario.value = "09:00";
    selectHorario.dispatchEvent(new Event("change"));
    inputCantidad.value = 5;
    inputCantidad.dispatchEvent(new Event("input"));
    const mensajeError = form.querySelector(".mensaje-error");
    expect(mensajeError).toBeNull();
    const btnAgregarInfo = form.querySelector(
      '[data-testid="btn-agregar-info-participantes"]',
    );
    expect(btnAgregarInfo).not.toBeNull();
  });

  it("si se oprime el boton de agregar informacion de participantes, deberia mostrar para cada participante un formulario con los campos nombre, DNI, edad y talla de vestimenta", () => {
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const selectActividad = form.querySelector('select[name="actividad"]');
    const selectHorario = form.querySelector('select[name="horario"]');
    const inputCantidad = form.querySelector('input[name="cantidad"]');
    selectActividad.value = "tirolesa";
    selectHorario.value = "09:00";
    selectHorario.dispatchEvent(new Event("change"));
    inputCantidad.value = 2;
    inputCantidad.dispatchEvent(new Event("input"));
    const btnAgregarInfo = form.querySelector(
      '[data-testid="btn-agregar-info-participantes"]',
    );
    btnAgregarInfo.click();
    const formulariosParticipantes = form.querySelectorAll(
      '[data-testid="formulario-participante"]',
    );
    expect(formulariosParticipantes.length).toBe(2);
    formulariosParticipantes.forEach((formulario) => {
      const inputNombre = formulario.querySelector('input[name="nombre"]');
      const inputDNI = formulario.querySelector('input[name="dni"]');
      const inputEdad = formulario.querySelector('input[name="edad"]');
      const selectTalla = formulario.querySelector('select[name="talla"]');
      expect(inputNombre).not.toBeNull();
      expect(inputDNI).not.toBeNull();
      expect(inputEdad).not.toBeNull();
      expect(selectTalla).not.toBeNull();
    });
  });

  it("si se cambia la actividad, horario o cantidad, se deben borrar los formularios de participantes", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const selectActividad = form.querySelector('select[name="actividad"]');
    const selectHorario = form.querySelector('select[name="horario"]');
    const inputCantidad = form.querySelector('input[name="cantidad"]');

    const setupForms = () => {
      selectActividad.value = "tirolesa";
      selectHorario.value = "09:00";
      selectHorario.dispatchEvent(new Event("change"));
      inputCantidad.value = 2;
      inputCantidad.dispatchEvent(new Event("input"));
      form
        .querySelector('[data-testid="btn-agregar-info-participantes"]')
        .click();
    };

    setupForms();
    expect(
      form.querySelectorAll('[data-testid="formulario-participante"]').length,
    ).toBe(2);
    selectActividad.value = "safari";
    selectActividad.dispatchEvent(new Event("change"));
    expect(
      form.querySelectorAll('[data-testid="formulario-participante"]').length,
    ).toBe(0);

    setupForms();
    expect(
      form.querySelectorAll('[data-testid="formulario-participante"]').length,
    ).toBe(2);
    selectHorario.value = "11:00";
    selectHorario.dispatchEvent(new Event("change"));
    expect(
      form.querySelectorAll('[data-testid="formulario-participante"]').length,
    ).toBe(0);

    setupForms();
    expect(
      form.querySelectorAll('[data-testid="formulario-participante"]').length,
    ).toBe(2);
    inputCantidad.value = 1;
    inputCantidad.dispatchEvent(new Event("input"));
    expect(
      form.querySelectorAll('[data-testid="formulario-participante"]').length,
    ).toBe(0);

    alertMock.mockRestore();
  });

  it("al cambiar la actividad, deberia limpiar el horario previamente seleccionado", () => {
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const selectActividad = form.querySelector('select[name="actividad"]');
    const selectHorario = form.querySelector('select[name="horario"]');

    selectActividad.value = "tirolesa";
    selectActividad.dispatchEvent(new Event("change"));
    selectHorario.value = "09:00";

    selectActividad.value = "safari";
    selectActividad.dispatchEvent(new Event("change"));

    expect(selectHorario.value).toBe("");
  });

  it("cuando una actividad no requiere talla, el selector de talla debe aparecer pero bloqueado", () => {
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const selectActividad = form.querySelector('select[name="actividad"]');
    const selectHorario = form.querySelector('select[name="horario"]');
    const inputCantidad = form.querySelector('input[name="cantidad"]');
    selectActividad.value = "jardineria";
    selectHorario.value = "10:00";
    selectHorario.dispatchEvent(new Event("change"));
    inputCantidad.value = 1;
    inputCantidad.dispatchEvent(new Event("input"));
    const btnAgregarInfo = form.querySelector(
      '[data-testid="btn-agregar-info-participantes"]',
    );
    btnAgregarInfo.click();
    const formulario = form.querySelector(
      '[data-testid="formulario-participante"]',
    );
    const selectTalla = formulario.querySelector('select[name="talla"]');
    expect(selectTalla).not.toBeNull();
    expect(selectTalla.disabled).toBe(true);
  });

  const setupConfirmar = (
    form,
    actividad = "tirolesa",
    horario = "09:00",
    cantidad = 1,
  ) => {
    const selectActividadEl = form.querySelector('select[name="actividad"]');
    selectActividadEl.value = actividad;
    selectActividadEl.dispatchEvent(new Event("change"));
    const selectHorario = form.querySelector('select[name="horario"]');
    selectHorario.value = horario;
    selectHorario.dispatchEvent(new Event("change"));
    const inputCantidad = form.querySelector('input[name="cantidad"]');
    inputCantidad.value = cantidad;
    inputCantidad.dispatchEvent(new Event("input"));
    form
      .querySelector('[data-testid="btn-agregar-info-participantes"]')
      .click();
  };

  it("deberia mostrar los terminos y condiciones de la actividad seleccionada al elegirla", () => {
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const selectActividadEl = form.querySelector('select[name="actividad"]');
    selectActividadEl.value = "tirolesa";
    selectActividadEl.dispatchEvent(new Event("change"));
    const terminosDiv = form.querySelector(
      '[data-testid="terminos-y-condiciones"]',
    );
    expect(terminosDiv).not.toBeNull();
    expect(terminosDiv.textContent).toContain(
      getActividad("tirolesa").terminosYCondiciones,
    );
  });

  it("deberia actualizar los terminos y condiciones al cambiar la actividad seleccionada", () => {
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const selectActividadEl = form.querySelector('select[name="actividad"]');
    selectActividadEl.value = "tirolesa";
    selectActividadEl.dispatchEvent(new Event("change"));
    selectActividadEl.value = "safari";
    selectActividadEl.dispatchEvent(new Event("change"));
    const terminosDiv = form.querySelector(
      '[data-testid="terminos-y-condiciones"]',
    );
    expect(terminosDiv.textContent).toContain(
      getActividad("safari").terminosYCondiciones,
    );
  });

  it("deberia mostrar un checkbox para aceptar los terminos y condiciones", () => {
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const selectActividadEl = form.querySelector('select[name="actividad"]');
    selectActividadEl.value = "tirolesa";
    selectActividadEl.dispatchEvent(new Event("change"));
    const checkbox = form.querySelector(
      'input[type="checkbox"][name="aceptar-terminos"][value="acepto"]',
    );
    expect(checkbox).not.toBeNull();
    expect(checkbox.checked).toBe(false);
  });

  it("deberia poder deseleccionar los terminos luego de haberlos aceptado", () => {
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    const selectActividadEl = form.querySelector('select[name="actividad"]');
    selectActividadEl.value = "tirolesa";
    selectActividadEl.dispatchEvent(new Event("change"));
    const checkbox = form.querySelector('input[name="aceptar-terminos"]');
    checkbox.click();
    expect(checkbox.checked).toBe(true);
    checkbox.click();
    expect(checkbox.checked).toBe(false);
  });

  it("al confirmar, deberia mostrar alerta si no se aceptaron los terminos y condiciones", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    setupConfirmar(form, "tirolesa", "09:00", 1);
    const pForm = form.querySelector('[data-testid="formulario-participante"]');
    pForm.querySelector('input[name="nombre"]').value = "Juan";
    pForm.querySelector('input[name="dni"]').value = "7500000";
    pForm.querySelector('input[name="edad"]').value = "25";
    pForm.querySelector('select[name="talla"]').value = "M";
    // radio NO chequeado
    form.querySelector('[data-testid="btn-confirmar-inscripcion"]').click();
    expect(alertMock).toHaveBeenCalledWith(
      "Debe aceptar los términos y condiciones para continuar.",
    );
    alertMock.mockRestore();
  });

  it("deberia existir un boton de confirmar inscripcion luego de agregar la informacion de los participantes", () => {
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    setupConfirmar(form);
    expect(
      form.querySelector('[data-testid="btn-confirmar-inscripcion"]'),
    ).not.toBeNull();
  });

  it("al confirmar, deberia mostrar alerta si el nombre de un participante contiene caracteres invalidos", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    setupConfirmar(form);
    form.querySelector(
      'input[type="checkbox"][name="aceptar-terminos"][value="acepto"]',
    ).checked = true;
    const pForm = form.querySelector('[data-testid="formulario-participante"]');
    pForm.querySelector('input[name="nombre"]').value = "Juan123";
    pForm.querySelector('input[name="dni"]').value = "7500000";
    pForm.querySelector('input[name="edad"]').value = "25";
    pForm.querySelector('select[name="talla"]').value = "M";
    form.querySelector('[data-testid="btn-confirmar-inscripcion"]').click();
    expect(alertMock).toHaveBeenCalledWith(
      "El nombre del participante 1 no es válido. Solo se permiten letras.",
    );
  });

  it("al confirmar, deberia mostrar alerta si el DNI de un participante no es valido", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    setupConfirmar(form);
    form.querySelector(
      'input[type="checkbox"][name="aceptar-terminos"][value="acepto"]',
    ).checked = true;
    const pForm = form.querySelector('[data-testid="formulario-participante"]');
    pForm.querySelector('input[name="nombre"]').value = "Juan";
    pForm.querySelector('input[name="dni"]').value = "999999";
    pForm.querySelector('input[name="edad"]').value = "25";
    pForm.querySelector('select[name="talla"]').value = "M";
    form.querySelector('[data-testid="btn-confirmar-inscripcion"]').click();
    expect(alertMock).toHaveBeenCalledWith(
      "El DNI del participante 1 no es válido. Debe ser un número entero entre 1.000.000 y 99.999.999.",
    );
  });

  it("al confirmar, deberia mostrar alerta si la edad de un participante no es valida", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    setupConfirmar(form);
    form.querySelector(
      'input[type="checkbox"][name="aceptar-terminos"][value="acepto"]',
    ).checked = true;
    const pForm = form.querySelector('[data-testid="formulario-participante"]');
    pForm.querySelector('input[name="nombre"]').value = "Juan";
    pForm.querySelector('input[name="dni"]').value = "7500000";
    pForm.querySelector('input[name="edad"]').value = "0";
    pForm.querySelector('select[name="talla"]').value = "M";
    form.querySelector('[data-testid="btn-confirmar-inscripcion"]').click();
    expect(alertMock).toHaveBeenCalledWith(
      "La edad del participante 1 no es válida. Debe ser un número entero entre 1 y 99.",
    );
  });

  it("al confirmar, deberia mostrar alerta si la talla es requerida y no fue seleccionada", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    setupConfirmar(form, "tirolesa", "09:00", 1);
    form.querySelector(
      'input[type="checkbox"][name="aceptar-terminos"][value="acepto"]',
    ).checked = true;
    const pForm = form.querySelector('[data-testid="formulario-participante"]');
    pForm.querySelector('input[name="nombre"]').value = "Juan";
    pForm.querySelector('input[name="dni"]').value = "7500000";
    pForm.querySelector('input[name="edad"]').value = "25";
    // talla queda en "" (placeholder)
    form.querySelector('[data-testid="btn-confirmar-inscripcion"]').click();
    expect(alertMock).toHaveBeenCalledWith(
      "La talla del participante 1 es requerida para esta actividad.",
    );
  });

  it("al confirmar exitosamente, deberia resetear el formulario", async () => {
    vi.spyOn(email, "enviarEmailInscripcion").mockResolvedValue(undefined);
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    setupConfirmar(form, "tirolesa", "09:00", 1);
    const pForm = form.querySelector('[data-testid="formulario-participante"]');
    pForm.querySelector('input[name="nombre"]').value = "Juan";
    pForm.querySelector('input[name="dni"]').value = "7500000";
    pForm.querySelector('input[name="edad"]').value = "25";
    pForm.querySelector('select[name="talla"]').value = "M";
    form.querySelector(
      'input[type="checkbox"][name="aceptar-terminos"][value="acepto"]',
    ).checked = true;
    form.querySelector('[data-testid="btn-confirmar-inscripcion"]').click();
    await vi.waitFor(() => {
      expect(form.querySelector('select[name="actividad"]').value).toBe("");
      expect(form.querySelector('select[name="horario"]').value).toBe("");
      expect(form.querySelector('input[name="cantidad"]').value).toBe("");
      expect(form.querySelector('input[name="cantidad"]').disabled).toBe(true);
      expect(
        form.querySelector('[data-testid="formulario-participante"]'),
      ).toBeNull();
      expect(
        form.querySelector('[data-testid="terminos-y-condiciones"]'),
      ).toBeNull();
      expect(
        form.querySelector('[data-testid="btn-confirmar-inscripcion"]'),
      ).toBeNull();
    });
  });

  it("al confirmar, no deberia mostrar alerta si todos los campos de los participantes son validos", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    setupConfirmar(form, "tirolesa", "09:00", 1);
    const pForm = form.querySelector('[data-testid="formulario-participante"]');
    pForm.querySelector('input[name="nombre"]').value = "Juan";
    pForm.querySelector('input[name="dni"]').value = "7500000";
    pForm.querySelector('input[name="edad"]').value = "25";
    pForm.querySelector('select[name="talla"]').value = "M";
    form.querySelector(
      'input[type="checkbox"][name="aceptar-terminos"][value="acepto"]',
    ).checked = true;
    form.querySelector('[data-testid="btn-confirmar-inscripcion"]').click();
    expect(alertMock).not.toHaveBeenCalled();
    alertMock.mockRestore();
  });

  it("al confirmar, no deberia requerir talla si la actividad no la requiere", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    setupConfirmar(form, "jardineria", "10:00", 1);
    const pForm = form.querySelector('[data-testid="formulario-participante"]');
    pForm.querySelector('input[name="nombre"]').value = "Juan";
    pForm.querySelector('input[name="dni"]').value = "7500000";
    pForm.querySelector('input[name="edad"]').value = "25";
    form.querySelector(
      'input[type="checkbox"][name="aceptar-terminos"][value="acepto"]',
    ).checked = true;
    form.querySelector('[data-testid="btn-confirmar-inscripcion"]').click();
    expect(alertMock).not.toHaveBeenCalled();
    alertMock.mockRestore();
  });

  it("al confirmar, deberia mostrar alerta si el horario seleccionado no esta disponible para la actividad", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const form = document.querySelector(
      '[data-testid="formulario-inscripcion"]',
    );
    setupConfirmar(form, "tirolesa", "09:00", 1);
    // Cambiar horario sin disparar el evento change (los formularios quedan visibles)
    form.querySelector('select[name="horario"]').value = "12:00";
    form.querySelector(
      'input[type="checkbox"][name="aceptar-terminos"][value="acepto"]',
    ).checked = true;
    const pForm = form.querySelector('[data-testid="formulario-participante"]');
    pForm.querySelector('input[name="nombre"]').value = "Juan";
    pForm.querySelector('input[name="dni"]').value = "7500000";
    pForm.querySelector('input[name="edad"]').value = "25";
    pForm.querySelector('select[name="talla"]').value = "M";
    form.querySelector('[data-testid="btn-confirmar-inscripcion"]').click();
    expect(alertMock).toHaveBeenCalledWith(mensajeHorarioSinCupos("12:00"));
  });
});
