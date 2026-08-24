/* ============================================================
 * supabase-storage.js
 * Persistencia de informes de fiscalización en Supabase.
 * ============================================================ */

(function () {
    'use strict';

    // ---------- Configuración ----------
    const SUPABASE_URL = 'https://opmexdggmgcosjcxgegz.supabase.co';
    const SUPABASE_ANON_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wbWV4ZGdnbWdjb3NqY3hnZWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2MDMyMTAsImV4cCI6MjEwMzE3OTIxMH0.sdYkV-g6iaMgIkodwB_GFlJWOWNIIGvRodbVKdz82oo';
    const TABLA = 'informes';
    const CLAVE_ID_LOCAL = 'informe_actual_id';

    // ---------- Cliente Supabase ----------
    let sb = null;
    function getClient() {
        if (sb) return sb;
        if (!window.supabase || !window.supabase.createClient) {
            console.error('SDK de Supabase no cargado');
            return null;
        }
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return sb;
    }

    // ---------- Estado ----------
    let informeActualId = null;
    let autosaveTimer = null;
    let guardandoAhora = false;

    // ---------- Utilidades DOM ----------
    function $(sel) { return document.querySelector(sel); }
    function $$(sel) { return document.querySelectorAll(sel); }

    // ---------- Serialización del formulario completo ----------
    function serializarFormulario() {
        const datos = {
            campos: {},
            radios: {},
            observaciones: [],
            plan_accion: '',
            fotos: []
        };

        // Inputs de texto (info-section, etc.)
        $$('#formulario-fiscalizacion input[type="text"]').forEach(function (inp) {
            if (inp.name) datos.campos[inp.name] = inp.value || '';
        });

        // Radios de cumplimiento
        $$('input[type="radio"][name^="item_"]:checked').forEach(function (r) {
            datos.radios[r.name] = r.value;
        });

        // Observaciones (una textarea por fila)
        $$('td.observaciones textarea').forEach(function (ta, idx) {
            datos.observaciones[idx] = ta.value || '';
        });

        // Editor de plan de acción
        const editor = $('#plan-accion-editor');
        if (editor) datos.plan_accion = editor.innerHTML;

        // Fotos + descripciones
        $$('.foto-container').forEach(function (cont) {
            const marco = cont.querySelector('.foto-marco');
            const desc = cont.querySelector('.foto-descripcion');
            const img = marco ? marco.querySelector('img') : null;
            datos.fotos.push({
                imagen_base64: img ? img.src : null,
                descripcion: desc ? desc.value || '' : ''
            });
        });

        return datos;
    }

    // ---------- Restaurar formulario desde un JSON ----------
    function restaurarFormulario(datos) {
        if (!datos) return;

        // Campos de texto
        if (datos.campos) {
            Object.keys(datos.campos).forEach(function (name) {
                const inp = document.querySelector('#formulario-fiscalizacion input[name="' + name + '"]');
                if (inp) inp.value = datos.campos[name];
            });
        }

        // Radios
        if (datos.radios) {
            Object.keys(datos.radios).forEach(function (name) {
                const val = datos.radios[name];
                const r = document.querySelector('input[type="radio"][name="' + name + '"][value="' + val + '"]');
                if (r) {
                    r.checked = true;
                    // Disparar evento change para reactivar highlights de fila
                    r.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        }

        // Observaciones
        if (Array.isArray(datos.observaciones)) {
            $$('td.observaciones textarea').forEach(function (ta, idx) {
                if (typeof datos.observaciones[idx] === 'string') ta.value = datos.observaciones[idx];
            });
        }

        // Plan de acción
        const editor = $('#plan-accion-editor');
        if (editor && typeof datos.plan_accion === 'string') {
            editor.innerHTML = datos.plan_accion;
            const hidden = $('#plan-accion');
            if (hidden) hidden.value = editor.innerHTML;
        }

        // Fotos
        if (Array.isArray(datos.fotos)) {
            const contenedores = $$('.foto-container');
            datos.fotos.forEach(function (foto, idx) {
                const cont = contenedores[idx];
                if (!cont) return;
                const marco = cont.querySelector('.foto-marco');
                const desc = cont.querySelector('.foto-descripcion');
                if (marco && foto.imagen_base64) {
                    marco.innerHTML =
                        '<div class="preview-imagen"><img src="' + foto.imagen_base64 + '" class="foto-preview" alt="Fotografía ' + (idx + 1) + '"></div>';
                }
                if (desc && typeof foto.descripcion === 'string') desc.value = foto.descripcion;
            });
        }

        // Recalcular resumen
        if (typeof window.contarCumplimiento === 'function') {
            window.contarCumplimiento();
        }
    }

    // ---------- Construir fila a insertar / actualizar ----------
    function construirFila() {
        const datos = serializarFormulario();
        const campos = datos.campos;

        const dia = campos.dia || '';
        const mes = campos.mes || '';
        const ano = campos.ano || '';
        const fecha = (dia || mes || ano) ? (dia + '/' + mes + '/' + ano) : '';

        // Contadores + estado desde el DOM ya renderizado
        const cumplen = parseInt(($('#items-cumplen') || {}).textContent || '0', 10) || 0;
        const noCumplen = parseInt(($('#items-no-cumplen') || {}).textContent || '0', 10) || 0;
        const noAplica = parseInt(($('#items-no-aplica') || {}).textContent || '0', 10) || 0;
        const porcentaje = parseInt(($('#porcentaje-cumplimiento') || {}).textContent || '0', 10) || 0;
        const estado = ($('#resultado-evaluacion') || {}).textContent || 'PENDIENTE DE EVALUACIÓN';

        return {
            nombre_entidad: campos.nombre_entidad || '',
            direccion: campos.direccion || '',
            empresa_seguridad: campos.empresa_seguridad || '',
            fecha_fiscalizacion: fecha,
            fiscalizador: campos.fiscalizador || '',
            entrevistado: campos['Nombre y cargo persona entrevistada'] || '',
            estado_seguridad: estado,
            porcentaje: porcentaje,
            items_cumplen: cumplen,
            items_no_cumplen: noCumplen,
            items_no_aplica: noAplica,
            datos: datos
        };
    }

    // ---------- Notificación visual ----------
    function notificar(mensaje, tipo) {
        tipo = tipo || 'info';
        const colores = { ok: '#28a745', err: '#dc3545', info: '#003366', warn: '#ffc107' };
        const div = document.createElement('div');
        div.textContent = mensaje;
        div.style.cssText =
            'position:fixed;bottom:20px;right:20px;background:' + (colores[tipo] || colores.info) +
            ';color:#fff;padding:12px 18px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.25);' +
            'z-index:10000;font-family:Poppins,sans-serif;font-size:14px;max-width:320px;';
        document.body.appendChild(div);
        setTimeout(function () {
            div.style.transition = 'opacity 0.4s';
            div.style.opacity = '0';
            setTimeout(function () { div.remove(); }, 400);
        }, 2800);
    }

    // ---------- Guardar (INSERT o UPDATE) ----------
    async function guardarInforme(silencioso) {
        const client = getClient();
        if (!client) {
            if (!silencioso) notificar('No se pudo conectar a Supabase', 'err');
            return null;
        }
        if (guardandoAhora) return null;
        guardandoAhora = true;

        const fila = construirFila();
        try {
            let resultado;
            if (informeActualId) {
                resultado = await client
                    .from(TABLA)
                    .update(fila)
                    .eq('id', informeActualId)
                    .select()
                    .single();
            } else {
                resultado = await client
                    .from(TABLA)
                    .insert(fila)
                    .select()
                    .single();
            }
            if (resultado.error) throw resultado.error;

            informeActualId = resultado.data.id;
            try { localStorage.setItem(CLAVE_ID_LOCAL, String(informeActualId)); } catch (e) {}

            actualizarIndicadorEstado('Guardado ' + new Date().toLocaleTimeString());
            if (!silencioso) notificar('Informe guardado (ID ' + informeActualId + ')', 'ok');
            return resultado.data;
        } catch (err) {
            console.error('Error guardando informe:', err);
            if (!silencioso) notificar('Error al guardar: ' + (err.message || err), 'err');
            return null;
        } finally {
            guardandoAhora = false;
        }
    }

    // ---------- ¿El formulario tiene contenido mínimo? ----------
    function tieneContenidoMinimo() {
        const nombre = ($('input[name="nombre_entidad"]') || {}).value || '';
        const direccion = ($('input[name="direccion"]') || {}).value || '';
        const empresa = ($('input[name="empresa_seguridad"]') || {}).value || '';
        const algunRadio = document.querySelector('input[type="radio"][name^="item_"]:checked');
        return !!(nombre.trim() || direccion.trim() || empresa.trim() || algunRadio);
    }

    // ---------- Autoguardado con debounce (automático desde el inicio) ----------
    function programarAutoguardado() {
        // Si ya hay un informe en la nube, actualizamos.
        // Si no hay, creamos uno la primera vez que haya contenido mínimo.
        if (!informeActualId && !tieneContenidoMinimo()) return;
        if (autosaveTimer) clearTimeout(autosaveTimer);
        actualizarIndicadorEstado(informeActualId
            ? 'Escribiendo... (se guardará en 2 s)'
            : 'Creando informe en la nube en 2 s...');
        autosaveTimer = setTimeout(function () { guardarInforme(true); }, 2000);
    }

    // ---------- Listar informes ----------
    async function listarInformes(filtro) {
        const client = getClient();
        if (!client) return [];
        let q = client
            .from(TABLA)
            .select('id, created_at, updated_at, nombre_entidad, direccion, fecha_fiscalizacion, estado_seguridad, porcentaje')
            .order('updated_at', { ascending: false })
            .limit(200);

        if (filtro && filtro.trim()) {
            const t = filtro.trim();
            q = q.or('nombre_entidad.ilike.%' + t + '%,direccion.ilike.%' + t + '%,fiscalizador.ilike.%' + t + '%');
        }

        const { data, error } = await q;
        if (error) {
            console.error(error);
            notificar('Error al listar: ' + error.message, 'err');
            return [];
        }
        return data || [];
    }

    // ---------- Cargar un informe por ID ----------
    async function cargarInforme(id) {
        const client = getClient();
        if (!client) return;
        const { data, error } = await client
            .from(TABLA)
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            notificar('Error al cargar: ' + error.message, 'err');
            return;
        }
        informeActualId = data.id;
        try { localStorage.setItem(CLAVE_ID_LOCAL, String(informeActualId)); } catch (e) {}
        restaurarFormulario(data.datos);
        actualizarIndicadorEstado('Cargado informe #' + id);
        notificar('Informe #' + id + ' cargado', 'ok');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ---------- Borrar informe ----------
    async function borrarInforme(id) {
        const client = getClient();
        if (!client) return false;
        const { error } = await client.from(TABLA).delete().eq('id', id);
        if (error) {
            notificar('Error al borrar: ' + error.message, 'err');
            return false;
        }
        if (informeActualId === id) {
            informeActualId = null;
            try { localStorage.removeItem(CLAVE_ID_LOCAL); } catch (e) {}
        }
        return true;
    }

    // ---------- Exportar todo a CSV ----------
    async function exportarCSV() {
        const client = getClient();
        if (!client) return;
        const { data, error } = await client
            .from(TABLA)
            .select('id, created_at, updated_at, nombre_entidad, direccion, empresa_seguridad, fecha_fiscalizacion, fiscalizador, entrevistado, estado_seguridad, porcentaje, items_cumplen, items_no_cumplen, items_no_aplica')
            .order('created_at', { ascending: false });
        if (error) {
            notificar('Error al exportar: ' + error.message, 'err');
            return;
        }
        if (!data || !data.length) {
            notificar('No hay informes para exportar', 'warn');
            return;
        }
        const columnas = Object.keys(data[0]);
        const escapa = function (v) {
            if (v === null || v === undefined) return '';
            const s = String(v).replace(/"/g, '""');
            return /[",\n;]/.test(s) ? '"' + s + '"' : s;
        };
        const filas = [columnas.join(',')];
        data.forEach(function (row) {
            filas.push(columnas.map(function (c) { return escapa(row[c]); }).join(','));
        });
        const csv = '﻿' + filas.join('\n'); // BOM para Excel
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'informes_fiscalizacion_' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        notificar('Exportados ' + data.length + ' informes', 'ok');
    }

    // ---------- Migrar historial local (IndexedDB) a la nube ----------
    const HIST_DB_NAME = 'InformesFiscalizacion';
    const HIST_STORE = 'informes';

    function abrirHistorialDB() {
        return new Promise(function (resolve, reject) {
            if (!('indexedDB' in window)) {
                reject(new Error('IndexedDB no disponible en este navegador'));
                return;
            }
            const req = indexedDB.open(HIST_DB_NAME, 1);
            req.onsuccess = function () { resolve(req.result); };
            req.onerror = function () { reject(req.error); };
            req.onupgradeneeded = function (ev) {
                // Si no existe, crearla vacía para que resolve no falle
                const db = ev.target.result;
                if (!db.objectStoreNames.contains(HIST_STORE)) {
                    db.createObjectStore(HIST_STORE, { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    function listarHistorialLocal() {
        return abrirHistorialDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                if (!db.objectStoreNames.contains(HIST_STORE)) { resolve([]); return; }
                const req = db.transaction(HIST_STORE, 'readonly').objectStore(HIST_STORE).getAll();
                req.onsuccess = function () { resolve(req.result || []); };
                req.onerror = function () { reject(req.error); };
            });
        });
    }

    // Extrae fotos (base64 + descripción) desde el HTML capturado
    function extraerFotosDeHTML(html, descripcionesDelSnapshot) {
        const fotos = [];
        if (!html) return fotos;
        try {
            const cont = document.createElement('div');
            cont.innerHTML = html;
            const contenedores = cont.querySelectorAll('.foto-container');
            contenedores.forEach(function (c, idx) {
                const img = c.querySelector('img');
                const desc = c.querySelector('.foto-descripcion');
                fotos.push({
                    imagen_base64: img ? img.src : null,
                    descripcion: (descripcionesDelSnapshot && descripcionesDelSnapshot[idx])
                        || (desc ? desc.value || '' : '')
                });
            });
        } catch (e) { console.warn('No se pudieron extraer fotos:', e); }
        return fotos;
    }

    // Convierte un registro del historial local al formato Supabase
    function convertirRegistroLocalAFila(registro) {
        const snap = (registro.formulario && registro.formulario.localStorage) || {};
        const fotosHTML = (registro.formulario && registro.formulario.fotosHTML) || '';

        // Reconstruir el objeto "datos" con la misma estructura del módulo
        const datos = {
            campos: {},
            radios: {},
            observaciones: [],
            plan_accion: '',
            fotos: []
        };

        const nombresCampoTexto = [
            'nombre_entidad', 'direccion', 'empresa_seguridad', 'dia', 'mes', 'ano',
            'fiscalizador', 'Nombre y cargo persona entrevistada'
        ];
        nombresCampoTexto.forEach(function (n) {
            if (typeof snap[n] === 'string') datos.campos[n] = snap[n];
        });

        // Radios: item_0, item_1, ...
        Object.keys(snap).forEach(function (k) {
            if (/^item_\d+$/.test(k)) datos.radios[k] = snap[k];
        });

        // Observaciones: observacion_0, observacion_1, ...
        const obsKeys = Object.keys(snap).filter(function (k) { return /^observacion_\d+$/.test(k); });
        obsKeys.sort(function (a, b) {
            return parseInt(a.split('_')[1], 10) - parseInt(b.split('_')[1], 10);
        });
        obsKeys.forEach(function (k) {
            const idx = parseInt(k.split('_')[1], 10);
            datos.observaciones[idx] = snap[k] || '';
        });

        // Plan de acción
        if (typeof snap['plan_accion'] === 'string') datos.plan_accion = snap['plan_accion'];

        // Descripciones de fotos (foto_desc_0, ...)
        const descs = {};
        Object.keys(snap).forEach(function (k) {
            const m = k.match(/^foto_desc_(\d+)$/);
            if (m) descs[parseInt(m[1], 10)] = snap[k] || '';
        });

        datos.fotos = extraerFotosDeHTML(fotosHTML, descs);

        // Contar cumplimiento a partir de radios
        let cumplen = 0, noCumplen = 0, noAplica = 0;
        Object.keys(datos.radios).forEach(function (k) {
            if (datos.radios[k] === 'cumple') cumplen++;
            else if (datos.radios[k] === 'no-cumple') noCumplen++;
            else if (datos.radios[k] === 'no-aplica') noAplica++;
        });
        const evaluados = cumplen + noCumplen;
        const porcentaje = evaluados > 0 ? Math.round((cumplen / evaluados) * 100) : 0;
        let estado = 'PENDIENTE DE EVALUACIÓN';
        if (evaluados > 0) {
            if (porcentaje >= 80) estado = 'ESTABLECIMIENTO SEGURO';
            else if (porcentaje >= 60) estado = 'ESTABLECIMIENTO EN RIESGO';
            else estado = 'ESTABLECIMIENTO INSEGURO';
        }

        const dia = datos.campos.dia || '';
        const mes = datos.campos.mes || '';
        const ano = datos.campos.ano || '';
        const fecha = (dia || mes || ano) ? (dia + '/' + mes + '/' + ano) : '';

        return {
            nombre_entidad: datos.campos.nombre_entidad || (registro.nombre || ''),
            direccion: datos.campos.direccion || '',
            empresa_seguridad: datos.campos.empresa_seguridad || '',
            fecha_fiscalizacion: fecha,
            fiscalizador: datos.campos.fiscalizador || '',
            entrevistado: datos.campos['Nombre y cargo persona entrevistada'] || '',
            estado_seguridad: estado,
            porcentaje: porcentaje,
            items_cumplen: cumplen,
            items_no_cumplen: noCumplen,
            items_no_aplica: noAplica,
            datos: datos
        };
    }

    async function migrarHistorialLocal() {
        const client = getClient();
        if (!client) { notificar('Supabase no está conectado', 'err'); return; }

        let registros;
        try {
            registros = await listarHistorialLocal();
        } catch (err) {
            notificar('No se pudo leer el historial local: ' + (err.message || err), 'err');
            return;
        }

        if (!registros.length) {
            notificar('No hay informes en el historial local para migrar', 'warn');
            return;
        }

        if (!confirm('Se subirán ' + registros.length + ' informe(s) del historial local a la nube. ¿Continuar?')) return;

        let ok = 0, fallos = 0;
        for (let i = 0; i < registros.length; i++) {
            actualizarIndicadorEstado('Migrando ' + (i + 1) + ' de ' + registros.length + '...');
            try {
                const fila = convertirRegistroLocalAFila(registros[i]);
                // Anotar en el JSON el origen para trazabilidad
                fila.datos._migrado = {
                    origen: 'historial-local-indexeddb',
                    id_local: registros[i].id,
                    fecha_original: registros[i].fecha,
                    nombre_original: registros[i].nombre
                };
                const { error } = await client.from(TABLA).insert(fila);
                if (error) throw error;
                ok++;
            } catch (err) {
                console.error('Migración: falló el informe local id', registros[i].id, err);
                fallos++;
            }
        }

        actualizarIndicadorEstado(informeActualId
            ? 'Editando informe #' + informeActualId + ' (autoguardado activo)'
            : 'Autoguardado activo — se guarda al escribir');

        const msg = 'Migración completa: ' + ok + ' subidos' + (fallos ? ', ' + fallos + ' con error (ver consola)' : '');
        notificar(msg, fallos ? 'warn' : 'ok');
        alert(msg + '\n\nLos informes locales NO se borraron. Si todo se ve bien en Historial, puedes eliminarlos manualmente desde el botón "Historial de Informes" (verde) o dejarlos como respaldo.');
    }

    // ---------- Nuevo informe (limpia el estado local) ----------
    function nuevoInforme() {
        if (!confirm('¿Iniciar un nuevo informe? Se limpiará el formulario actual (los datos ya guardados en la nube se mantienen).')) return;
        informeActualId = null;
        try { localStorage.removeItem(CLAVE_ID_LOCAL); } catch (e) {}
        if (typeof window.limpiarFormulario === 'function') {
            // Ya pregunta confirm dentro; llamarla directo mostraría dos confirms.
            // Mejor limpiamos sin re-confirmar:
        }
        // Reset manual (sin reconfirmar)
        document.getElementById('formulario-fiscalizacion').reset();
        $$('td.observaciones textarea').forEach(function (t) { t.value = ''; });
        const editor = $('#plan-accion-editor');
        if (editor) editor.innerHTML = '';
        const resumen = $('#resumen-automatico');
        if (resumen) resumen.innerHTML = '<p>El resumen detallado se generará automáticamente al completar la evaluación.</p>';
        if (typeof window.contarCumplimiento === 'function') window.contarCumplimiento();
        actualizarIndicadorEstado('Nuevo informe');
        notificar('Formulario limpio. Comienza un nuevo informe.', 'info');
    }

    // ---------- Indicador de estado ----------
    function actualizarIndicadorEstado(texto) {
        const el = document.getElementById('supabase-estado');
        if (el) el.textContent = texto;
    }

    // ---------- Modal de listado ----------
    function abrirModalListado() {
        let modal = document.getElementById('modal-informes');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-informes';
            modal.className = 'no-print';
            modal.innerHTML =
                '<div class="mi-backdrop"></div>' +
                '<div class="mi-caja">' +
                '  <div class="mi-header">' +
                '    <h3><i class="fas fa-clock-rotate-left"></i> Historial de fiscalizaciones</h3>' +
                '    <button type="button" class="mi-cerrar" aria-label="Cerrar">&times;</button>' +
                '  </div>' +
                '  <div class="mi-toolbar">' +
                '    <input type="text" id="mi-buscar" placeholder="Buscar por entidad, dirección o fiscalizador...">' +
                '    <button type="button" id="mi-refrescar">Refrescar</button>' +
                '  </div>' +
                '  <div class="mi-lista"><p>Cargando...</p></div>' +
                '</div>';
            document.body.appendChild(modal);

            modal.querySelector('.mi-cerrar').addEventListener('click', cerrarModalListado);
            modal.querySelector('.mi-backdrop').addEventListener('click', cerrarModalListado);
            modal.querySelector('#mi-refrescar').addEventListener('click', function () {
                refrescarLista(document.getElementById('mi-buscar').value);
            });
            let t;
            modal.querySelector('#mi-buscar').addEventListener('input', function (e) {
                clearTimeout(t);
                const v = e.target.value;
                t = setTimeout(function () { refrescarLista(v); }, 300);
            });
        }
        modal.style.display = 'block';
        refrescarLista('');
    }

    function cerrarModalListado() {
        const modal = document.getElementById('modal-informes');
        if (modal) modal.style.display = 'none';
    }

    async function refrescarLista(filtro) {
        const contenedor = document.querySelector('#modal-informes .mi-lista');
        if (!contenedor) return;
        contenedor.innerHTML = '<p>Cargando...</p>';
        const informes = await listarInformes(filtro);
        if (!informes.length) {
            contenedor.innerHTML = '<p>No hay informes guardados.</p>';
            return;
        }
        const tabla = document.createElement('table');
        tabla.className = 'mi-tabla';
        tabla.innerHTML =
            '<thead><tr>' +
            '<th>ID</th><th>Entidad</th><th>Fecha</th><th>Estado</th><th>%</th><th>Actualizado</th><th>Acciones</th>' +
            '</tr></thead><tbody></tbody>';
        const tbody = tabla.querySelector('tbody');
        informes.forEach(function (inf) {
            const tr = document.createElement('tr');
            const fecha = new Date(inf.updated_at).toLocaleString('es-CL');
            tr.innerHTML =
                '<td>' + inf.id + '</td>' +
                '<td>' + (inf.nombre_entidad || '<i>(sin nombre)</i>') + '</td>' +
                '<td>' + (inf.fecha_fiscalizacion || '') + '</td>' +
                '<td>' + (inf.estado_seguridad || '') + '</td>' +
                '<td>' + (inf.porcentaje || 0) + '%</td>' +
                '<td>' + fecha + '</td>' +
                '<td>' +
                '  <button type="button" class="mi-btn mi-btn-cargar">Abrir</button>' +
                '  <button type="button" class="mi-btn mi-btn-borrar">Borrar</button>' +
                '</td>';
            tr.querySelector('.mi-btn-cargar').addEventListener('click', function () {
                cerrarModalListado();
                cargarInforme(inf.id);
            });
            tr.querySelector('.mi-btn-borrar').addEventListener('click', async function () {
                if (!confirm('¿Borrar el informe #' + inf.id + ' de "' + (inf.nombre_entidad || 'sin nombre') + '"? Esta acción no se puede deshacer.')) return;
                const ok = await borrarInforme(inf.id);
                if (ok) {
                    tr.remove();
                    notificar('Informe #' + inf.id + ' borrado', 'ok');
                }
            });
            tbody.appendChild(tr);
        });
        contenedor.innerHTML = '';
        contenedor.appendChild(tabla);
    }

    // ---------- Inicialización ----------
    function inicializar() {
        // Intentar recuperar el ID que estábamos editando
        try {
            const guardado = localStorage.getItem(CLAVE_ID_LOCAL);
            if (guardado) informeActualId = parseInt(guardado, 10) || null;
        } catch (e) {}

        // Autoguardado ante cualquier cambio (solo si ya existe informeActualId)
        document.addEventListener('input', programarAutoguardado, true);
        document.addEventListener('change', programarAutoguardado, true);

        // Exponer funciones al ámbito global para los botones onclick
        window.supabaseGuardar = function () { guardarInforme(false); };
        window.supabaseListar = abrirModalListado;
        window.supabaseNuevo = nuevoInforme;
        window.supabaseExportarCSV = exportarCSV;
        window.supabaseMigrarLocal = migrarHistorialLocal;

        actualizarIndicadorEstado(informeActualId
            ? 'Editando informe #' + informeActualId + ' (autoguardado activo)'
            : 'Autoguardado activo — se guarda al escribir');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }
})();
