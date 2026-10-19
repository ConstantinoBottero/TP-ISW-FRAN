import { describe, it, expect, vi, afterEach } from "vitest";
import { construirHTMLEmail, enviarEmailInscripcion } from "../email.js";

const datosBase = {
  usuario: {
    nombreCompleto: "Francisco Reinaudo",
    email: "franciscoreinaudo@gmail.com",
  },
  actividad: { nombre: "Tirolesa" },
  horario: "09:00",
  participantes: [
    { nombre: "Juan Perez", dni: "7500000", edad: "25", talla: "M" },
  ],
};

describe("construirHTMLEmail", () => {
  it("debe contener el nombre completo del usuario", () => {
    const html = construirHTMLEmail(datosBase);
    expect(html).toContain("Francisco Reinaudo");
  });

  it("debe contener el nombre de la actividad", () => {
    const html = construirHTMLEmail(datosBase);
    expect(html).toContain("Tirolesa");
  });

  it("debe contener el horario de la inscripcion", () => {
    const html = construirHTMLEmail(datosBase);
    expect(html).toContain("09:00");
  });

  it("debe contener los datos de cada participante", () => {
    const html = construirHTMLEmail(datosBase);
    expect(html).toContain("Juan Perez");
    expect(html).toContain("7500000");
    expect(html).toContain("25");
    expect(html).toContain("M");
  });

  it("debe mostrar N/A en talla cuando el participante no tiene talla asignada", () => {
    const datos = {
      ...datosBase,
      participantes: [
        { nombre: "Ana", dni: "8000000", edad: "30", talla: null },
      ],
    };
    const html = construirHTMLEmail(datos);
    expect(html).toContain("N/A");
  });
});

describe("enviarEmailInscripcion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("debe llamar a la API de Resend con metodo POST", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "test-id" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await enviarEmailInscripcion({ apiKey: "test-key", ...datosBase });

    expect(fetchMock).toHaveBeenCalledWith(
      "/resend/emails",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("debe enviar el header Authorization con la API key", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "test-id" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await enviarEmailInscripcion({ apiKey: "test-key", ...datosBase });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers["Authorization"]).toBe("Bearer test-key");
  });

  it("debe enviar al email del usuario con el asunto correcto", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "test-id" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await enviarEmailInscripcion({ apiKey: "test-key", ...datosBase });

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.to).toContain("franciscoreinaudo@gmail.com");
    expect(body.subject).toBe("Ecoharmony Park Inscripciones a Actividades");
  });

  it("debe lanzar un error si la respuesta de la API no es exitosa", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 422 });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      enviarEmailInscripcion({ apiKey: "clave-invalida", ...datosBase }),
    ).rejects.toThrow("Error al enviar el email de confirmación");
  });
});
