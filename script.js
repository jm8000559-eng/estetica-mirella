// ==================== DATOS INICIALES ====================
let citas = JSON.parse(localStorage.getItem('citas')) || [];
let ingresos = JSON.parse(localStorage.getItem('ingresos')) || [];

const especialistas = [
    { id: 1, nombre: "Manicura y Pedicura", telefono: "0414-7861415" },
    { id: 2, nombre: "Cabello", telefono: "" },
    { id: 3, nombre: "Cejas, Depilación y Pestañas", telefono: "0424-8525592" }
];

function guardarDatos() {
    localStorage.setItem('citas', JSON.stringify(citas));
    localStorage.setItem('ingresos', JSON.stringify(ingresos));
}

// ==================== MODAL DE DETALLE DE CITA ====================
function mostrarDetalleCita(index) {
    const c = citas[index];
    const estadoColor = {
        'Atendida': '🟢',
        'Pendiente': '🟡',
        'Cancelada': '🔴'
    };
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>📋 Detalle de Cita</h3>
            <p><strong>Cliente:</strong> ${c.cliente}</p>
            <p><strong>Servicio:</strong> ${c.servicio}</p>
            <p><strong>Especialista:</strong> ${especialistas.find(e => e.id === c.especialistaId).nombre}</p>
            <p><strong>Fecha:</strong> ${c.fecha}</p>
            <p><strong>Hora:</strong> ${c.hora}</p>
            <p><strong>Estado actual:</strong> ${estadoColor[c.estado] || '⚪'} ${c.estado}</p>
            <label><strong>Cambiar estado:</strong></label>
            <select id="nuevoEstado">
                <option value="Pendiente" ${c.estado === 'Pendiente' ? 'selected' : ''}>🟡 Pendiente</option>
                <option value="Atendida" ${c.estado === 'Atendida' ? 'selected' : ''}>🟢 Atendida</option>
                <option value="Cancelada" ${c.estado === 'Cancelada' ? 'selected' : ''}>🔴 Cancelada</option>
            </select>
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                <button id="guardarEstado">Guardar cambios</button>
                <button id="cerrarModal">Cerrar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';

    document.getElementById('guardarEstado').onclick = () => {
        const nuevo = document.getElementById('nuevoEstado').value;
        citas[index].estado = nuevo;
        if (nuevo === 'Atendida') {
            const monto = prompt("Ingrese el monto cobrado:", "0");
            if (monto && !isNaN(parseFloat(monto))) {
                ingresos.push({
                    especialistaId: c.especialistaId,
                    monto: parseFloat(monto),
                    fecha: new Date().toISOString().split('T')[0],
                    servicio: c.servicio,
                    cliente: c.cliente
                });
            }
        }
        guardarDatos();
        mostrarCitas(); // refresca vista
        modal.remove();
    };
    document.getElementById('cerrarModal').onclick = () => modal.remove();
}

// ==================== RENDERIZADO PRINCIPAL ====================
function mostrarCitas() {
    const main = document.getElementById('mainView');
    main.innerHTML = `
        <div class="card-especialista" style="margin-bottom:20px;">
            <h3>📅 Nueva Cita</h3>
            <button id="btnNuevaCita" class="btn-gold">+ Agendar Cita</button>
        </div>
        <div id="calendario"></div>
        <div style="margin-top:30px;">
            <h3>📋 Listado de Citas</h3>
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

function renderizarTablaCitas() {
    const tbody = document.getElementById('listaCitas');
    tbody.innerHTML = '';
    citas.forEach((c, idx) => {
        const esp = especialistas.find(e => e.id === c.especialistaId);
        let estadoIcon = '';
        if (c.estado === 'Atendida') estadoIcon = '🟢';
        else if (c.estado === 'Pendiente') estadoIcon = '🟡';
        else if (c.estado === 'Cancelada') estadoIcon = '🔴';
        tbody.innerHTML += `
            <tr>
                <td>${c.cliente}</td>
                <td>${c.servicio}</td>
                <td>${esp.nombre}</td>
                <td>${c.fecha}</td>
                <td>${c.hora}</td>
                <td>${estadoIcon} ${c.estado}</td>
                <td>
                    <button onclick="mostrarDetalleCita(${idx})">📋 Ver</button>
                    <button onclick="eliminarCita(${idx})">🗑️</button>
                </td>
            </tr>
        `;
    });
}

// ==================== AGREGAR CITA ====================
function mostrarModalCita() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>➕ Nueva Cita</h3>
            <input id="cliente" placeholder="Nombre del cliente">
            <input id="servicio" placeholder="Servicio">
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
        const nueva = {
            cliente: document.getElementById('cliente').value,
            servicio: document.getElementById('servicio').value,
            especialistaId: parseInt(document.getElementById('especialistaId').value),
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value,
            estado: 'Pendiente'
        };
        if (!nueva.cliente || !nueva.servicio || !nueva.fecha || !nueva.hora) return alert("Complete todos los campos");
        citas.push(nueva);
        guardarDatos();
        mostrarCitas();
        modal.remove();
    };
    document.getElementById('cerrarModal').onclick = () => modal.remove();
}

function eliminarCita(idx) {
    if (confirm("¿Eliminar cita?")) {
        citas.splice(idx, 1);
        guardarDatos();
        mostrarCitas();
    }
}

// ==================== CALENDARIO ====================
function renderizarCalendario() {
    const calendarEl = document.getElementById('calendario');
    new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        events: citas.map(c => ({
            title: `${c.cliente} - ${c.servicio}`,
            start: `${c.fecha}T${c.hora}`
        }))
    }).render();
}

// ==================== INGRESOS ====================
function mostrarIngresos() {
    const main = document.getElementById('mainView');
    main.innerHTML = `<h2>💰 Reporte de Ingresos</h2>`;
    especialistas.forEach(esp => {
        const filtrados = ingresos.filter(i => i.especialistaId === esp.id);
        const semanal = filtrados.filter(i => {
            const diff = (new Date() - new Date(i.fecha)) / (1000*60*60*24);
            return diff <= 7;
        }).reduce((a,b) => a + b.monto, 0);
        const mensual = filtrados.filter(i => {
            const fecha = new Date(i.fecha);
            const hoy = new Date();
            return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
        }).reduce((a,b) => a + b.monto, 0);
        main.innerHTML += `
            <div class="card-especialista">
                <h3>${esp.nombre}</h3>
                <p>💰 Semana: <strong>${semanal.toFixed(2)} $</strong></p>
                <p>📆 Mes: <strong>${mensual.toFixed(2)} $</strong></p>
                <button onclick="alert('Historial:\n' + ${JSON.stringify(filtrados).replace(/"/g, '&quot;')})">Ver histórico</button>
            </div>
        `;
    });
}

function mostrarEspecialistas() {
    const main = document.getElementById('mainView');
    main.innerHTML = `<h2>👥 Especialistas</h2>`;
    especialistas.forEach(esp => {
        main.innerHTML += `<div class="card-especialista"><h3>${esp.nombre}</h3><p>📞 ${esp.telefono || 'No registrado'}</p></div>`;
    });
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
        cambiarVista(link.getAttribute('data-view'));
        document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');
    });
});

cambiarVista('citas');
