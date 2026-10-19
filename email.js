export function construirHTMLEmail({
  usuario,
  actividad,
  horario,
  participantes,
}) {
  const filas = participantes
    .map(
      (p, i) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #ddd4bc;color:#5c7354;">${i + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #ddd4bc;">${p.nombre}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #ddd4bc;">${p.dni}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #ddd4bc;">${p.edad}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #ddd4bc;">${p.talla ?? "N/A"}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f2e8cf;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10);">

        <tr>
          <td style="background:#386641;padding:36px 40px 30px;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#a7c957;">Sistema de Reservas</p>
            <h1 style="margin:0;font-size:32px;font-weight:300;color:#f2e8cf;letter-spacing:-.01em;">Ecoharmony Park</h1>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px 0;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#6a994e;">Confirmación de inscripción</p>
            <h2 style="margin:0 0 20px;font-size:22px;font-weight:400;color:#386641;">¡Gracias, ${usuario.nombreCompleto}!</h2>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#5c7354;">
              Tu inscripción en <strong>${actividad.nombre}</strong> ha sido registrada exitosamente.
              A continuación encontrás el detalle completo de tu reserva.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2e8cf;border-radius:3px;">
              <tr>
                <td style="padding:18px 20px;">
                  <p style="margin:0 0 4px;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#6a994e;">Actividad</p>
                  <p style="margin:0;font-size:17px;font-weight:500;color:#386641;">${actividad.nombre}</p>
                </td>
                <td style="padding:18px 20px;border-left:1px solid #ddd4bc;">
                  <p style="margin:0 0 4px;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#6a994e;">Horario</p>
                  <p style="margin:0;font-size:17px;font-weight:500;color:#386641;">${horario}</p>
                </td>
                <td style="padding:18px 20px;border-left:1px solid #ddd4bc;">
                  <p style="margin:0 0 4px;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#6a994e;">Participantes</p>
                  <p style="margin:0;font-size:17px;font-weight:500;color:#386641;">${participantes.length}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 36px;">
            <p style="margin:0 0 12px;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#6a994e;">Detalle de participantes</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:3px;overflow:hidden;border:1px solid #ddd4bc;">
              <thead>
                <tr style="background:#386641;">
                  <th style="padding:10px 12px;text-align:left;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#a7c957;font-weight:500;">#</th>
                  <th style="padding:10px 12px;text-align:left;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#a7c957;font-weight:500;">Nombre</th>
                  <th style="padding:10px 12px;text-align:left;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#a7c957;font-weight:500;">DNI</th>
                  <th style="padding:10px 12px;text-align:left;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#a7c957;font-weight:500;">Edad</th>
                  <th style="padding:10px 12px;text-align:left;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#a7c957;font-weight:500;">Talla</th>
                </tr>
              </thead>
              <tbody>${filas}</tbody>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 40px 36px;border-top:1px solid #ddd4bc;text-align:center;">
            <p style="margin:0;font-size:12px;color:#6a994e;line-height:1.6;">
              Este es un correo automático, por favor no respondas a este mensaje.<br/>
              © Ecoharmony Park — Sistema de Reservas
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function enviarEmailInscripcion({
  apiKey,
  usuario,
  actividad,
  horario,
  participantes,
}) {
  const html = construirHTMLEmail({
    usuario,
    actividad,
    horario,
    participantes,
  });

  const response = await fetch("/resend/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Ecoharmony Park <onboarding@resend.dev>",
      to: [usuario.email],
      subject: "Ecoharmony Park Inscripciones a Actividades",
      html,
    }),
  });

  if (!response.ok) {
    throw new Error("Error al enviar el email de confirmación");
  }

  return response.json();
}
