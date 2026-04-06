// ==================== DATOS INICIALES ====================
let citas = JSON.parse(localStorage.getItem('citas')) || [];
let ingresos = JSON.parse(localStorage.getItem('ingresos')) || [];

const especialistas = [
    { id: 1, nombre: "Manicura y Pedicura", telefono: "0414-7861415", email: "rossanita1378@gmail.com" },
    { id: 2, nombre: "Cabello", telefono: "", email: "" },
    { id: 3, nombre: "Cejas, Depilación y Pestañas", telefono: "0424-8525592", email: "MirellaMaestre3@gmail.com" }
];

// ==================== FUNCIONES AUXILIARES ====================
function guardarDatos() {
    localStorage.setItem('citas', JSON.stringify(citas));
    localStorage.setItem('ingresos', JSON.stringify(ingresos));
}

// Enviar recordatorio por WhatsApp (simulado, abre el chat)
function enviarRecordatorio(cita) {
    let numero = "";
    if (cita.especialistaId === 1) numero = "04147861415";
    else if (cita.especialistaId === 3) numero = "04248525592";
    if (numero) {
        const mensaje = `Hola ${cita.cliente}, recordatorio de tu cita de ${cita.servicio} el ${cita.fecha} a las ${cita.hora}. ¡Te esperamos!`;
        const url = `https://wa.me/58${numero}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    } else {
        alert("Recordatorio: " + cita.cliente + " - " + cita.fecha + " " + cita.hora);
    }
}

// ==================== RENDERIZADO DE VISTAS ====================
function mostrarCitas() {
    const main = document.getElementById('mainView');
    main.innerHTML = `
        <div class="card-especialista" style="margin-bottom:20px;">
            <h3>📅 Nueva Cita</h3>
            <button id="btnNuevaCita" class="btn-gold">+ Agendar Cita</button>
        </div>
        <div id="calendario"></div>
        <div style="margin-top:30px;">
            <h3>📋 Próximas Citas</h3>
            <table id="tablaCitas">
                <thead><tr><th>Cliente</th><th>Servicio</th><th>Especialista</th><th>Fecha</th><th>Hora</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody id="listaCitas"></tbody>
            </table>
        </div>
    `;
    renderizarCalendario();
    renderizarTablaCitas();
    document.getElementById('btnNuevaCita').onclick = mostrarModalCita;
}

function renderizarCalendario() {
    const calendarEl = document.getElementById('calendario');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        events: citas.map(c => ({
            title: `${c.cliente} - ${c.servicio}`,
            start: `${c.fecha}T${c.hora}`,
            extendedProps: { cita: c }
        })),
        eventClick: (info) => {
            const cita = info.event.extendedProps.cita;
            alert(`Cliente: ${cita.cliente}\nServicio: ${cita.servicio}\nHora: ${cita.hora}\nEstado: ${cita.estado}`);
        }
    });
    calendar.render();
}

function renderizarTablaCitas() {
    const tbody = document.getElementById('listaCitas');
    tbody.innerHTML = '';
    citas.forEach((c, index) => {
        const especialista = especialistas.find(e => e.id === c.especialistaId);
        tbody.innerHTML += `
            <tr>
                <td>${c.cliente}</td>
                <td>${c.servicio}</td>
                <td>${especialista.nombre}</td>
                <td>${c.fecha}</td>
                <td>${c.hora}</td>
                <td>${c.estado}</td>
                <td>
                    ${c.estado !== 'Atendida' ? `<button onclick="marcarAtendida(${index})">✅ Atender</button>` : ''}
                    <button onclick="eliminarCita(${index})">🗑️</button>
                    <button onclick="enviarRecordatorioCita(${index})">📲 Recordatorio</button>
                </td>
            </tr>
        `;
    });
}

function mostrarModalCita() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Nueva Cita</h3>
            <input type="text" id="cliente" placeholder="Nombre del cliente">
            <input type="text" id="servicio" placeholder="Servicio">
            <select id="especialistaId">
                ${especialistas.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('')}
            </select>
            <input type="date" id="fecha">
            <input type="time" id="hora">
            <button id="guardarCita">Guardar</button>
            <button id="cerrarModal">Cancelar</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    document.getElementById('guardarCita').onclick = () => {
        const nuevaCita = {
            cliente: document.getElementById('cliente').value,
            servicio: document.getElementById('servicio').value,
            especialistaId: parseInt(document.getElementById('especialistaId').value),
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value,
            estado: 'Pendiente'
        };
        if (!nuevaCita.cliente || !nuevaCita.servicio || !nuevaCita.fecha || !nuevaCita.hora) {
            alert("Complete todos los campos");
            return;
        }
        citas.push(nuevaCita);
        guardarDatos();
        mostrarCitas();
        modal.remove();
    };
    document.getElementById('cerrarModal').onclick = () => modal.remove();
}

function marcarAtendida(index) {
    const cita = citas[index];
    cita.estado = 'Atendida';
    const monto = prompt(`Ingrese el monto cobrado por el servicio "${cita.servicio}"`, "0");
    if (monto && !isNaN(parseFloat(monto))) {
        ingresos.push({
            especialistaId: cita.especialistaId,
            monto: parseFloat(monto),
            fecha: new Date().toISOString().split('T')[0],
            servicio: cita.servicio,
            cliente: cita.cliente
        });
        guardarDatos();
    }
    guardarDatos();
    mostrarCitas();
}

function eliminarCita(index) {
    if (confirm("¿Eliminar esta cita?")) {
        citas.splice(index, 1);
        guardarDatos();
        mostrarCitas();
    }
}

function enviarRecordatorioCita(index) {
    enviarRecordatorio(citas[index]);
}

// ==================== INGRESOS ====================
function mostrarIngresos() {
    const main = document.getElementById('mainView');
    main.innerHTML = `<h2>💰 Reporte de Ingresos</h2>`;
    especialistas.forEach(esp => {
        const misIngresos = ingresos.filter(i => i.especialistaId === esp.id);
        const totalSemanal = misIngresos.filter(i => {
            const fecha = new Date(i.fecha);
            const hoy = new Date();
            const diff = (hoy - fecha) / (1000 * 60 * 60 * 24);
            return diff <= 7;
        }).reduce((acc, i) => acc + i.monto, 0);
        const totalMensual = misIngresos.filter(i => {
            const fecha = new Date(i.fecha);
            const hoy = new Date();
            return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
        }).reduce((acc, i) => acc + i.monto, 0);
        main.innerHTML += `
            <div class="card-especialista">
                <h3>${esp.nombre}</h3>
                <p>💰 Ingresos esta semana: <strong>${totalSemanal.toFixed(2)} $</strong></p>
                <p>📆 Ingresos este mes: <strong>${totalMensual.toFixed(2)} $</strong></p>
                <button onclick="verDetalleIngresos(${esp.id})">Ver historial</button>
            </div>
        `;
    });
}

function verDetalleIngresos(especialistaId) {
    const registros = ingresos.filter(i => i.especialistaId === especialistaId);
    let html = `<h3>Historial de ingresos</h3><table><tr><th>Fecha</th><th>Cliente</th><th>Servicio</th><th>Monto</th></tr>`;
    registros.forEach(r => {
        html += `<tr><td>${r.fecha}</td><td>${r.cliente}</td><td>${r.servicio}</td><td>${r.monto}</td></tr>`;
    });
    html += `</table><button onclick="mostrarIngresos()">Volver</button>`;
    document.getElementById('mainView').innerHTML = html;
}

function mostrarEspecialistas() {
    const main = document.getElementById('mainView');
    main.innerHTML = `<h2>👥 Especialistas</h2><div class="especialistas">`;
    especialistas.forEach(esp => {
        main.innerHTML += `
            <div class="card-especialista">
                <h3>${esp.nombre}</h3>
                <p>📞 ${esp.telefono || 'No registrado'}</p>
                <p>📧 ${esp.email || 'No registrado'}</p>
            </div>
        `;
    });
    main.innerHTML += `</div>`;
}

// ==================== NAVEGACIÓN ====================
function cambiarVista(vista) {
    if (vista === 'citas') mostrarCitas();
    else if (vista === 'ingresos') mostrarIngresos();
    else if (vista === 'especialistas') mostrarEspecialistas();
}

document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const vista = link.getAttribute('data-view');
        cambiarVista(vista);
        document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');
    });
});

// Cargar vista por defecto
cambiarVista('citas');
