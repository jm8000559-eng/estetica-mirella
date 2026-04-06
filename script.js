// ==================== USUARIO LOGUEADO ====================
const user = JSON.parse(localStorage.getItem('user'));
if (!user) window.location.href = 'login.html';

// ==================== DATOS GLOBALES ====================
let citas = JSON.parse(localStorage.getItem('citas')) || [];
let ingresos = JSON.parse(localStorage.getItem('ingresos')) || [];

const especialistas = [
    { id: 1, nombre: "Manicura y Pedicura", telefono: "0414-7861415", rol: "especialista1" },
    { id: 2, nombre: "Cabello", telefono: "", rol: "especialista2" },
    { id: 3, nombre: "Cejas, Depilación y Pestañas", telefono: "0424-8525592", rol: "especialista3" }
];

function guardarDatos() {
    localStorage.setItem('citas', JSON.stringify(citas));
    localStorage.setItem('ingresos', JSON.stringify(ingresos));
}

// ==================== FILTRAR SEGÚN ROL ====================
function filtrarPorRol() {
    if (user.rol === 'admin') return { citas, ingresos };
    const especialista = especialistas.find(e => e.rol === user.rol);
    if (!especialista) return { citas: [], ingresos: [] };
    return {
        citas: citas.filter(c => c.especialistaId === especialista.id),
        ingresos: ingresos.filter(i => i.especialistaId === especialista.id)
    };
}

// ==================== GENERAR MENÚ LATERAL ====================
function generarMenu() {
    const sidebar = document.getElementById('sidebar');
    const rolesPermitidos = ['admin', 'especialista1', 'especialista2', 'especialista3'];
    if (!rolesPermitidos.includes(user.rol)) {
        sidebar.style.display = 'none';
        document.querySelector('.content').style.marginLeft = '0';
        return;
    }
    sidebar.innerHTML = `
        <div class="logo"><h2>✨ Mirella</h2></div>
        <ul>
            <li><a href="#" data-view="citas">📅 Citas</a></li>
            <li><a href="#" data-view="ingresos">💰 Ingresos</a></li>
            ${user.rol === 'admin' ? '<li><a href="#" data-view="especialistas">👥 Especialistas</a></li>' : ''}
        </ul>
    `;
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            cambiarVista(link.getAttribute('data-view'));
            document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// ==================== MODAL DETALLE CITA ====================
function mostrarDetalleCita(index) {
    const { citas: misCitas } = filtrarPorRol();
    const c = misCitas[index];
    const estadoColor = { 'Atendida': '🟢', 'Pendiente': '🟡', 'Cancelada': '🔴' };
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
            <p><strong>Estado:</strong> ${estadoColor[c.estado]} ${c.estado}</p>
            <label><strong>Cambiar estado:</strong></label>
            <select id="nuevoEstado">
                <option value="Pendiente" ${c.estado === 'Pendiente' ? 'selected' : ''}>🟡 Pendiente</option>
                <option value="Atendida" ${c.estado === 'Atendida' ? 'selected' : ''}>🟢 Atendida</option>
                <option value="Cancelada" ${c.estado === 'Cancelada' ? 'selected' : ''}>🔴 Cancelada</option>
            </select>
            <div style="margin-top:20px; display:flex; gap:10px; justify-content:flex-end;">
                <button id="guardarEstado">Guardar cambios</button>
                <button id="cerrarModal">Cerrar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    document.getElementById('guardarEstado').onclick = () => {
        const nuevo = document.getElementById('nuevoEstado').value;
        const idxReal = citas.findIndex(cita => cita.cliente === c.cliente && cita.fecha === c.fecha && cita.hora === c.hora);
        if (idxReal !== -1) {
            citas[idxReal].estado = nuevo;
            if (nuevo === 'Atendida' && user.rol !== 'admin') {
                const monto = prompt("Ingrese el monto cobrado:", "0");
                if (monto && !isNaN(parseFloat(monto))) {
                    ingresos.push({ especialistaId: c.especialistaId, monto: parseFloat(monto), fecha: new Date().toISOString().split('T')[0], servicio: c.servicio, cliente: c.cliente });
                }
            }
            guardarDatos();
        }
        mostrarCitas();
        modal.remove();
    };
    document.getElementById('cerrarModal').onclick = () => modal.remove();
}

// ==================== RENDERIZAR CITAS ====================
function mostrarCitas() {
    const { citas: misCitas } = filtrarPorRol();
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
    const calendarEl = document.getElementById('calendario');
    new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        events: misCitas.map(c => ({ title: `${c.cliente} - ${c.servicio}`, start: `${c.fecha}T${c.hora}` }))
    }).render();
    const tbody = document.getElementById('listaCitas');
    tbody.innerHTML = '';
    misCitas.forEach((c, idx) => {
        const esp = especialistas.find(e => e.id === c.especialistaId);
        let estadoIcon = { 'Atendida': '🟢', 'Pendiente': '🟡', 'Cancelada': '🔴' }[c.estado] || '⚪';
        tbody.innerHTML += `
            <tr>
                <td>${c.cliente}</td>
                <td>${c.servicio}</td>
                <td>${esp.nombre}</td>
                <td>${c.fecha}</td>
                <td>${c.hora}</td>
                <td>${estadoIcon} ${c.estado}</td>
                <td><button onclick="mostrarDetalleCita(${idx})">📋 Ver</button>
                    <button onclick="eliminarCita(${idx})">🗑️</button>
                </td>
            </tr>
        `;
    });
    document.getElementById('btnNuevaCita').onclick = mostrarModalCita;
}

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
    const { citas: misCitas } = filtrarPorRol();
    const c = misCitas[idx];
    const realIdx = citas.findIndex(cita => cita.cliente === c.cliente && cita.fecha === c.fecha && cita.hora === c.hora);
    if (realIdx !== -1 && confirm("¿Eliminar cita?")) {
        citas.splice(realIdx, 1);
        guardarDatos();
        mostrarCitas();
    }
}

// ==================== INGRESOS (CON EDICIÓN) ====================
function mostrarIngresos() {
    const { ingresos: misIngresos } = filtrarPorRol();
    const main = document.getElementById('mainView');
    main.innerHTML = `
        <h2>💰 Registro de Ingresos</h2>
        <table id="tablaIngresos">
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Servicio</th><th>Monto ($)</th><th>Especialista</th>${user.rol === 'admin' ? '<th>Acciones</th>' : ''}</thead>
            <tbody id="listaIngresos"></tbody>
        </table>
    `;
    const tbody = document.getElementById('listaIngresos');
    tbody.innerHTML = '';
    misIngresos.forEach((ing, idx) => {
        const esp = especialistas.find(e => e.id === ing.especialistaId);
        tbody.innerHTML += `
            <tr>
                <td>${ing.fecha}</td><td>${ing.cliente}</td><td>${ing.servicio}</td>
                <td><span id="monto-${idx}">${ing.monto.toFixed(2)}</span></td>
                <td>${esp.nombre}</td>
                ${user.rol === 'admin' ? `<td><button onclick="editarIngreso(${idx})">✏️ Editar</button></td>` : ''}
            </tr>
        `;
    });
}

function editarIngreso(idx) {
    const { ingresos: misIngresos } = filtrarPorRol();
    const ingreso = misIngresos[idx];
    const nuevoMonto = prompt("Editar monto:", ingreso.monto);
    if (nuevoMonto && !isNaN(parseFloat(nuevoMonto))) {
        const realIdx = ingresos.findIndex(i => i.cliente === ingreso.cliente && i.fecha === ingreso.fecha && i.servicio === ingreso.servicio);
        if (realIdx !== -1) {
            ingresos[realIdx].monto = parseFloat(nuevoMonto);
            guardarDatos();
            mostrarIngresos();
        }
    }
}

// ==================== ESPECIALISTAS (SOLO ADMIN) ====================
function mostrarEspecialistas() {
    if (user.rol !== 'admin') {
        alert("Solo el administrador puede ver esta sección.");
        return;
    }
    const main = document.getElementById('mainView');
    main.innerHTML = `<h2>👥 Especialistas</h2>`;
    especialistas.forEach(esp => {
        main.innerHTML += `<div class="card-especialista"><h3>${esp.nombre}</h3><p>📞 ${esp.telefono || 'No registrado'}</p><button onclick="alert('Editar especialista no implementado')">✏️ Editar</button></div>`;
    });
}

// ==================== NAVEGACIÓN ====================
function cambiarVista(vista) {
    if (vista === 'citas') mostrarCitas();
    else if (vista === 'ingresos') mostrarIngresos();
    else if (vista === 'especialistas') mostrarEspecialistas();
}

// ==================== INICIALIZACIÓN ====================
generarMenu();
cambiarVista('citas');
