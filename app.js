import {
  getActividades,
  getActividad,
  getUsuario,
  validarHorarioParque,
  validarDiaParqueAbierto,
  mensajeParqueCerrado,
  mensajeHorarioSinCupos,
  formatearFecha,
  validarHorarioDisponible,
  getCuposDisponibles,
  mensajeCupoSuperado,
  validarCantidadDisponible,
  esCantidadValida,
  validarNombre,
  validarDNI,
  validarEdad,
} from "./index.js";
import { enviarEmailInscripcion } from "./email.js";

export function initPage() {
  const actividades = getActividades();
  const actividadesIds = actividades.map((a) => a.id);
  const usuarioLogueado = getUsuario("fran");

  const opcionesHTML = actividades
    .map((a) => `<option value="${a.id}">${a.nombre}</option>`)
    .join("");

  const fechaHoyTexto = formatearFecha(new Date());

  const usuarioHTML = usuarioLogueado
    ? `<div class="usuario-logueado" data-testid="usuario-logueado">
        <span class="usuario-avatar">${usuarioLogueado.nombreCompleto.charAt(0)}</span>
        <span class="usuario-info">
          <span class="usuario-nombre">${usuarioLogueado.nombreCompleto}</span>
          <span class="usuario-email">${usuarioLogueado.email}</span>
          <span class="usuario-fecha" data-testid="usuario-fecha">${fechaHoyTexto}</span>
        </span>
      </div>`
    : "";

  document.body.innerHTML = `
    <header class="page-header">
      <span class="park-tag">Sistema de Reservas</span>
      <h1>Parque Natural</h1>
      <p class="subtitle">Actividades al aire libre</p>
      ${usuarioHTML}
    </header>
    <main class="main-content">
      <button data-testid="btn-inscribirse">Inscribirme a actividad</button>
      <div data-testid="formulario-inscripcion" hidden>
        <h2 class="form-title">Nueva Inscripción</h2>
        <div class="field-group">
          <label class="field-label">Actividad</label>
          <select name="actividad">
            <option value="">Seleccione una actividad</option>
            ${opcionesHTML}
          </select>
        </div>
        <div class="field-group" data-field="horario">
          <label class="field-label">Horario</label>
          <select name="horario">
            <option value="">Seleccione un horario</option>
            ${[...Array(24)].map((_, i) => {
              const hora = i.toString().padStart(2, "0") + ":00";
              return `<option value="${hora}">${hora}</option>`;
            })}
          </select>
        </div>
        <div class="field-group" data-field="cantidad">
          <label class="field-label">Cantidad</label>
          <input type="number" name="cantidad" placeholder="Cantidad de personas" disabled />
        </div>
      </div>
    </main>
  `;

  const btn = document.querySelector('[data-testid="btn-inscribirse"]');
  const form = document.querySelector('[data-testid="formulario-inscripcion"]');

  function quitarFormulariosParticipantes() {
    form
      .querySelectorAll('[data-testid="formulario-participante"]')
      .forEach((f) => f.remove());
    const btnConfirmar = form.querySelector(
      '[data-testid="btn-confirmar-inscripcion"]',
    );
    if (btnConfirmar) btnConfirmar.remove();
  }

  function quitarBotonParticipantes() {
    const b = form.querySelector(
      '[data-testid="btn-agregar-info-participantes"]',
    );
    if (b) b.remove();
  }

  function obtenerTerminos() {
    return form.querySelector('[data-testid="terminos-y-condiciones"]');
  }

  function colocarTerminosEnOrden() {
    const terminos = obtenerTerminos();
    if (!terminos) return;
    const btnConfirmar = form.querySelector(
      '[data-testid="btn-confirmar-inscripcion"]',
    );
    if (btnConfirmar) {
      form.insertBefore(terminos, btnConfirmar);
      return;
    }
    const btnAgregar = form.querySelector(
      '[data-testid="btn-agregar-info-participantes"]',
    );
    if (btnAgregar) {
      btnAgregar.insertAdjacentElement("afterend", terminos);
    }
  }

  function insertarAntesDeTerminos(nodo) {
    const terminos = obtenerTerminos();
    if (terminos) {
      form.insertBefore(nodo, terminos);
    } else {
      form.appendChild(nodo);
    }
  }

  const selectActividad = document.querySelector('select[name="actividad"]');
  const selectHorario = document.querySelector('select[name="horario"]');
  const inputCantidad = document.querySelector('input[name="cantidad"]');
  const campoCantidad = form.querySelector('[data-field="cantidad"]');

  function quitarMensajeErrorCantidad() {
    const mensajeError = campoCantidad.querySelector(".mensaje-error");
    if (mensajeError) mensajeError.remove();
  }

  function mostrarMensajeErrorCantidad(actividadId, horario) {
    const cupos = getCuposDisponibles(actividadId, horario);
    let mensajeError = campoCantidad.querySelector(".mensaje-error");
    if (!mensajeError) {
      mensajeError = document.createElement("p");
      mensajeError.classList.add("mensaje-error");
      campoCantidad.appendChild(mensajeError);
    }
    mensajeError.textContent = mensajeCupoSuperado(cupos ?? 0);
  }

  function puedeIngresarCantidad() {
    const actividadId = selectActividad.value;
    const horario = selectHorario.value;
    if (!actividadId || !horario) return false;
    if (!validarHorarioParque(horario)) return false;
    if (!validarHorarioDisponible(actividadId, horario)) return false;
    if (getCuposDisponibles(actividadId, horario) === 0) return false;
    return true;
  }

  function actualizarEstadoCantidad() {
    const habilitado = puedeIngresarCantidad();
    inputCantidad.disabled = !habilitado;
    if (!habilitado) {
      inputCantidad.value = "";
      quitarBotonParticipantes();
      quitarMensajeErrorCantidad();
    }
  }

  function resetearFormularioInscripcion() {
    selectActividad.value = "";
    selectHorario.value = "";
    inputCantidad.value = "";
    quitarFormulariosParticipantes();
    quitarBotonParticipantes();
    quitarMensajeErrorCantidad();
    const terminos = obtenerTerminos();
    if (terminos) terminos.remove();
    actualizarEstadoCantidad();
  }

  function alertarParqueCerradoHoy() {
    const hoy = new Date();
    // Probar cierre (25/12/2026, festivo): const hoy = new Date(2026, 11, 25);
    // Probar cierre (lunes): const hoy = new Date(2026, 5, 1);
    if (!validarDiaParqueAbierto(hoy)) {
      alert(mensajeParqueCerrado(hoy));
      return true;
    }
    return false;
  }

  btn.addEventListener("click", () => {
    if (alertarParqueCerradoHoy()) return;
    form.hidden = false;
  });

  selectActividad.addEventListener("change", () => {
    quitarFormulariosParticipantes();
    quitarBotonParticipantes();
    quitarMensajeErrorCantidad();
    selectHorario.value = "";
    const terminosExistentes = form.querySelector(
      '[data-testid="terminos-y-condiciones"]',
    );
    if (terminosExistentes) terminosExistentes.remove();
    const actividadSeleccionada = getActividad(selectActividad.value);
    if (actividadSeleccionada) {
      const terminosDiv = document.createElement("div");
      terminosDiv.setAttribute("data-testid", "terminos-y-condiciones");
      terminosDiv.innerHTML = `
        <p class="terms-title">Términos y Condiciones</p>
        <p>${actividadSeleccionada.terminosYCondiciones}</p>
        <label class="terms-accept">
          <input type="checkbox" name="aceptar-terminos" value="acepto" />
          <span>Acepto los términos y condiciones</span>
        </label>
      `;
      form.appendChild(terminosDiv);
      colocarTerminosEnOrden();
    }
    if (
      selectHorario.value &&
      actividadSeleccionada &&
      !validarHorarioDisponible(selectActividad.value, selectHorario.value)
    ) {
      alert(mensajeHorarioSinCupos(selectHorario.value));
    }
    actualizarEstadoCantidad();
  });

  selectHorario.addEventListener("change", () => {
    const actividadSelectId = selectActividad.value;
    quitarMensajeErrorCantidad();
    quitarFormulariosParticipantes();

    if (selectHorario.value && !validarHorarioParque(selectHorario.value)) {
      alert(
        "El horario seleccionado no es válido. Los turnos del parque son de 09:00 a 17:00.",
      );
    } else if (
      actividadesIds.includes(actividadSelectId) &&
      selectHorario.value &&
      !validarHorarioDisponible(actividadSelectId, selectHorario.value)
    ) {
      alert(mensajeHorarioSinCupos(selectHorario.value));
    } else if (
      actividadesIds.includes(actividadSelectId) &&
      selectHorario.value &&
      getCuposDisponibles(actividadSelectId, selectHorario.value) === 0
    ) {
      alert(mensajeHorarioSinCupos(selectHorario.value));
    }
    actualizarEstadoCantidad();
  });

  inputCantidad.addEventListener("input", () => {
    const actividadSelectId = selectActividad.value;
    const horarioSelect = document.querySelector('select[name="horario"]');
    const horarioSelectValue = horarioSelect.value;
    const cantidad = Number(inputCantidad.value);
    quitarFormulariosParticipantes();
    if (inputCantidad.value === "" && !inputCantidad.validity.badInput) {
      quitarMensajeErrorCantidad();
      quitarBotonParticipantes();
      return;
    }
    if (!esCantidadValida(cantidad)) {
      alert(
        "La cantidad ingresada no es válida. Por favor ingrese un número entero mayor a 0.",
      );
      quitarMensajeErrorCantidad();
      quitarBotonParticipantes();
    } else if (
      !validarCantidadDisponible(
        actividadSelectId,
        horarioSelectValue,
        cantidad,
      )
    ) {
      mostrarMensajeErrorCantidad(actividadSelectId, horarioSelectValue);
      quitarBotonParticipantes();
    } else {
      quitarMensajeErrorCantidad();
      mostrarBotonParticipantes();
    }

    function mostrarBotonParticipantes() {
      let b = form.querySelector(
        '[data-testid="btn-agregar-info-participantes"]',
      );
      if (!b) {
        b = document.createElement("button");
        b.setAttribute("data-testid", "btn-agregar-info-participantes");
        b.textContent = "Agregar información de participantes";
        b.addEventListener("click", () => {
          quitarFormulariosParticipantes();
          const n = Number(inputCantidad.value);
          const actividad = getActividad(selectActividad.value);
          const tallasHTML = ["XS", "S", "M", "L", "XL", "XXL"]
            .map((t) => `<option value="${t}">${t}</option>`)
            .join("");
          const tallaDisabled =
            actividad && !actividad.requiereTalla ? "disabled" : "";
          for (let i = 0; i < n; i++) {
            const participanteForm = document.createElement("div");
            participanteForm.setAttribute(
              "data-testid",
              "formulario-participante",
            );
            participanteForm.innerHTML = `
              <strong>Participante ${i + 1}</strong>
              <div class="field-group">
                <label class="field-label">Nombre</label>
                <input type="text" name="nombre" placeholder="Solo letras" />
              </div>
              <div class="field-group">
                <label class="field-label">DNI</label>
                <input type="text" name="dni" placeholder="1.000.000 – 99.999.999" />
              </div>
              <div class="field-group">
                <label class="field-label">Edad</label>
                <input type="number" name="edad" placeholder="Entre 1 y 99" />
              </div>
              <div class="field-group">
                <label class="field-label">Talla de vestimenta</label>
                <select name="talla" ${tallaDisabled}>
                  <option value="">Seleccione talla</option>
                  ${tallasHTML}
                </select>
              </div>
            `;
            insertarAntesDeTerminos(participanteForm);
          }

          const terminosDiv = obtenerTerminos();
          const btnConfirmar = document.createElement("button");
          btnConfirmar.setAttribute("data-testid", "btn-confirmar-inscripcion");
          btnConfirmar.textContent = "Confirmar inscripción";
          btnConfirmar.addEventListener("click", () => {
            const radioTerminos = form.querySelector(
              'input[type="checkbox"][name="aceptar-terminos"][value="acepto"]',
            );
            if (!radioTerminos || !radioTerminos.checked) {
              alert("Debe aceptar los términos y condiciones para continuar.");
              return;
            }
            const actividadId = selectActividad.value;
            const horarioActual = document.querySelector(
              'select[name="horario"]',
            ).value;
            if (!validarHorarioDisponible(actividadId, horarioActual)) {
              alert(mensajeHorarioSinCupos(horarioActual));
              return;
            }
            const pForms = form.querySelectorAll(
              '[data-testid="formulario-participante"]',
            );
            const actividadActual = getActividad(actividadId);
            for (let i = 0; i < pForms.length; i++) {
              const pForm = pForms[i];
              const nombre = pForm.querySelector('input[name="nombre"]').value;
              const dni = pForm.querySelector('input[name="dni"]').value;
              const edad = pForm.querySelector('input[name="edad"]').value;
              const tallaSelect = pForm.querySelector('select[name="talla"]');
              if (!validarNombre(nombre)) {
                alert(
                  `El nombre del participante ${i + 1} no es válido. Solo se permiten letras.`,
                );
                return;
              }
              if (!validarDNI(dni)) {
                alert(
                  `El DNI del participante ${i + 1} no es válido. Debe ser un número entero entre 1.000.000 y 99.999.999.`,
                );
                return;
              }
              if (!validarEdad(edad)) {
                alert(
                  `La edad del participante ${i + 1} no es válida. Debe ser un número entero entre 1 y 99.`,
                );
                return;
              }
              if (
                actividadActual &&
                actividadActual.requiereTalla &&
                tallaSelect.value === ""
              ) {
                alert(
                  `La talla del participante ${i + 1} es requerida para esta actividad.`,
                );
                return;
              }
            }

            const participantesData = Array.from(pForms).map((pForm) => {
              const tallaSelect = pForm.querySelector('select[name="talla"]');
              return {
                nombre: pForm.querySelector('input[name="nombre"]').value,
                dni: pForm.querySelector('input[name="dni"]').value,
                edad: pForm.querySelector('input[name="edad"]').value,
                talla:
                  tallaSelect && !tallaSelect.disabled
                    ? tallaSelect.value || null
                    : null,
              };
            });

            enviarEmailInscripcion({
              apiKey: import.meta.env.VITE_RESEND_API_KEY,
              usuario: usuarioLogueado,
              actividad: actividadActual,
              horario: horarioActual,
              participantes: participantesData,
            })
              .then(() => {
                alert(
                  `¡Inscripción confirmada! Se envió un email de confirmación a ${usuarioLogueado.email}.`,
                );
                resetearFormularioInscripcion();
              })
              .catch(() => {
                alert(
                  "¡Inscripción registrada! No se pudo enviar el email de confirmación.",
                );
                resetearFormularioInscripcion();
              });
          });
          form.appendChild(btnConfirmar);
          colocarTerminosEnOrden();
        });
        const terminos = obtenerTerminos();
        if (terminos) {
          form.insertBefore(b, terminos);
        } else {
          form.appendChild(b);
        }
      }
    }
  });
}
