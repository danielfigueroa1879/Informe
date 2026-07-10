/**
 * historial.js
 * Historial local de informes generados.
 *
 * Guarda cada PDF generado + una copia editable del formulario (localStorage + set
 * fotográfico) dentro de IndexedDB. Agrega un botón "Historial de Informes" al
 * bloque de botones existente y expone:
 *
 *   window.archivarPDFEnHistorial(pdfLibDoc, filename)  ← llamada desde pdf-optimizado.js
 *   window.abrirPanelHistorial()                        ← abre el modal con la lista
 *
 * No modifica ninguna otra funcionalidad: si algo falla (IndexedDB bloqueado, etc.)
 * la generación de PDF sigue funcionando igual.
 */
(function () {
    'use strict';

    const DB_NAME = 'InformesFiscalizacion';
    const DB_VERSION = 1;
    const STORE = 'informes';

    // -------------------- IndexedDB --------------------

    function abrirDB() {
        return new Promise(function (resolve, reject) {
            if (!('indexedDB' in window)) {
                reject(new Error('IndexedDB no está disponible en este navegador.'));
                return;
            }
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = function (ev) {
                const db = ev.target.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('fecha', 'fecha', { unique: false });
                }
            };
            req.onsuccess = function () { resolve(req.result); };
            req.onerror = function () { reject(req.error); };
        });
    }

    function tx(db, modo) {
        return db.transaction(STORE, modo).objectStore(STORE);
    }

    function guardarRegistro(registro) {
        return abrirDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                const req = tx(db, 'readwrite').add(registro);
                req.onsuccess = function () { resolve(req.result); };
                req.onerror = function () { reject(req.error); };
            });
        });
    }

    function listarRegistros() {
        return abrirDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                const req = tx(db, 'readonly').getAll();
                req.onsuccess = function () {
                    const items = (req.result || []).slice();
                    items.sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
                    resolve(items);
                };
                req.onerror = function () { reject(req.error); };
            });
        });
    }

    function obtenerRegistro(id) {
        return abrirDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                const req = tx(db, 'readonly').get(id);
                req.onsuccess = function () { resolve(req.result); };
                req.onerror = function () { reject(req.error); };
            });
        });
    }

    function eliminarRegistro(id) {
        return abrirDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                const req = tx(db, 'readwrite').delete(id);
                req.onsuccess = function () { resolve(); };
                req.onerror = function () { reject(req.error); };
            });
        });
    }

    // -------------------- Snapshot del formulario --------------------

    function snapshotLocalStorage() {
        const out = {};
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k) out[k] = localStorage.getItem(k);
            }
        } catch (e) { /* ignore */ }
        return out;
    }

    function snapshotFotos() {
        const contenedor = document.getElementById('seccion-fotos') ||
                           document.getElementById('set-fotografico');
        return contenedor ? contenedor.innerHTML : '';
    }

    function nombreInforme() {
        function val(sel) {
            const el = document.querySelector(sel);
            return el && el.value ? el.value.trim() : '';
        }
        const entidad = val('input[name="nombre_entidad"]');
        const dia = val('input[name="dia"]');
        const mes = val('input[name="mes"]');
        const ano = val('input[name="ano"]');
        const fecha = (dia && mes && ano) ? (dia + '-' + mes + '-' + ano) : new Date().toLocaleDateString();
        return (entidad || 'Sin nombre') + ' — ' + fecha;
    }

    // -------------------- Archivar --------------------

    /**
     * Guarda una copia del PDF recién generado + snapshot del formulario.
     * Se llama desde pdf-optimizado.js justo antes de pdf.save().
     * No lanza excepciones: si falla, se registra en consola y sigue.
     */
    function archivarPDFEnHistorial(pdfLibDoc, filename) {
        try {
            let blob;
            try { blob = pdfLibDoc.output('blob'); }
            catch (e) { console.warn('[historial] no se pudo obtener blob del PDF:', e); return; }

            const registro = {
                fecha: new Date().toISOString(),
                nombre: nombreInforme(),
                filename: filename || ('Fiscalizacion_' + new Date().toISOString().slice(0, 10) + '.pdf'),
                pdfBlob: blob,
                tamanio: blob.size,
                formulario: {
                    localStorage: snapshotLocalStorage(),
                    fotosHTML: snapshotFotos()
                }
            };

            guardarRegistro(registro)
                .then(function (id) {
                    console.log('[historial] Informe archivado con id', id);
                    mostrarToast('Informe archivado en el historial (id ' + id + ')');
                })
                .catch(function (err) {
                    console.error('[historial] Error al archivar:', err);
                });
        } catch (e) {
            console.error('[historial] Excepción al archivar:', e);
        }
    }

    // -------------------- Restaurar (Cargar para editar) --------------------

    function restaurarFormulario(registro) {
        // 1. localStorage → cargar snapshot
        try {
            localStorage.clear();
            const snap = (registro.formulario && registro.formulario.localStorage) || {};
            Object.keys(snap).forEach(function (k) { localStorage.setItem(k, snap[k]); });
        } catch (e) {
            console.warn('[historial] No se pudo restaurar localStorage:', e);
        }

        // 2. Fotos → restituir HTML de la sección
        try {
            const fotosHTML = (registro.formulario && registro.formulario.fotosHTML) || '';
            const contenedor = document.getElementById('seccion-fotos') ||
                               document.getElementById('set-fotografico');
            if (contenedor && fotosHTML) contenedor.innerHTML = fotosHTML;
        } catch (e) {
            console.warn('[historial] No se pudo restaurar el set fotográfico:', e);
        }

        // 3. Recargar para que autoguardado.cargarDatosFormulario() se ejecute limpio
        setTimeout(function () { location.reload(); }, 150);
    }

    // -------------------- Descargar --------------------

    function descargarBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'informe.pdf';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    // -------------------- UI: Panel del historial --------------------

    function estilos() {
        if (document.getElementById('historial-estilos')) return;
        const s = document.createElement('style');
        s.id = 'historial-estilos';
        s.textContent = [
            '.historial-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10000;display:flex;align-items:center;justify-content:center;font-family:"Poppins",sans-serif;}',
            '.historial-modal{background:#fff;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.3);width:min(900px,92vw);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;}',
            '.historial-header{background:#003366;color:#fff;padding:14px 22px;display:flex;align-items:center;justify-content:space-between;}',
            '.historial-header h3{margin:0;font-size:1.15rem;font-weight:600;}',
            '.historial-cerrar{background:transparent;border:none;color:#fff;font-size:1.6rem;cursor:pointer;line-height:1;padding:0 4px;}',
            '.historial-body{padding:16px 22px;overflow:auto;}',
            '.historial-lista{width:100%;border-collapse:collapse;font-size:.9rem;}',
            '.historial-lista th,.historial-lista td{padding:9px 8px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:middle;}',
            '.historial-lista th{background:#f3f4f6;color:#003366;font-weight:600;font-size:.85rem;}',
            '.historial-lista tr:hover{background:#f9fafb;}',
            '.historial-vacio{text-align:center;color:#6b7280;padding:30px 10px;}',
            '.historial-acciones{display:flex;gap:6px;flex-wrap:wrap;}',
            '.historial-btn{border:none;border-radius:5px;padding:6px 10px;font-size:.8rem;cursor:pointer;font-family:inherit;font-weight:500;}',
            '.historial-btn-desc{background:#28a745;color:#fff;}',
            '.historial-btn-edit{background:#0d6efd;color:#fff;}',
            '.historial-btn-del{background:#dc3545;color:#fff;}',
            '.historial-btn:hover{filter:brightness(1.08);}',
            '.historial-toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:#003366;color:#fff;padding:10px 18px;border-radius:6px;font-family:"Poppins",sans-serif;font-size:.9rem;box-shadow:0 4px 14px rgba(0,0,0,.25);z-index:10001;opacity:0;transition:opacity .25s ease;}',
            '.historial-toast.visible{opacity:1;}',
            '@media (max-width:600px){.historial-lista th:nth-child(3),.historial-lista td:nth-child(3){display:none;}}'
        ].join('\n');
        document.head.appendChild(s);
    }

    function mostrarToast(mensaje) {
        estilos();
        const t = document.createElement('div');
        t.className = 'historial-toast';
        t.textContent = mensaje;
        document.body.appendChild(t);
        requestAnimationFrame(function () { t.classList.add('visible'); });
        setTimeout(function () {
            t.classList.remove('visible');
            setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
        }, 2500);
    }

    function formatearTamanio(bytes) {
        if (!bytes && bytes !== 0) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    }

    function formatearFecha(iso) {
        try {
            const d = new Date(iso);
            return d.toLocaleString();
        } catch (e) { return iso || ''; }
    }

    function abrirPanelHistorial() {
        estilos();

        // Evitar duplicar
        if (document.getElementById('historial-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'historial-overlay';
        overlay.className = 'historial-overlay';
        overlay.innerHTML =
            '<div class="historial-modal" role="dialog" aria-modal="true" aria-label="Historial de informes">' +
                '<div class="historial-header">' +
                    '<h3>📁 Historial de Informes</h3>' +
                    '<button type="button" class="historial-cerrar" aria-label="Cerrar">×</button>' +
                '</div>' +
                '<div class="historial-body" id="historial-body">' +
                    '<p class="historial-vacio">Cargando…</p>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        function cerrar() {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }
        overlay.querySelector('.historial-cerrar').addEventListener('click', cerrar);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) cerrar();
        });

        const body = overlay.querySelector('#historial-body');

        listarRegistros().then(function (items) {
            if (!items.length) {
                body.innerHTML = '<p class="historial-vacio">Aún no hay informes archivados.<br>Genera un PDF y aparecerá aquí automáticamente.</p>';
                return;
            }

            const filas = items.map(function (r) {
                return '' +
                    '<tr data-id="' + r.id + '">' +
                        '<td>' + formatearFecha(r.fecha) + '</td>' +
                        '<td>' + escapeHTML(r.nombre || r.filename || 'Informe') + '</td>' +
                        '<td>' + formatearTamanio(r.tamanio) + '</td>' +
                        '<td>' +
                            '<div class="historial-acciones">' +
                                '<button type="button" class="historial-btn historial-btn-desc" data-accion="descargar">⬇ Descargar</button>' +
                                '<button type="button" class="historial-btn historial-btn-edit" data-accion="editar">✎ Cargar para editar</button>' +
                                '<button type="button" class="historial-btn historial-btn-del" data-accion="eliminar">🗑</button>' +
                            '</div>' +
                        '</td>' +
                    '</tr>';
            }).join('');

            body.innerHTML =
                '<table class="historial-lista">' +
                    '<thead><tr><th>Fecha</th><th>Nombre</th><th>Tamaño</th><th>Acciones</th></tr></thead>' +
                    '<tbody>' + filas + '</tbody>' +
                '</table>';

            body.querySelectorAll('button[data-accion]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    const tr = btn.closest('tr');
                    const id = Number(tr.getAttribute('data-id'));
                    const accion = btn.getAttribute('data-accion');
                    if (accion === 'descargar') accionDescargar(id);
                    else if (accion === 'editar') accionEditar(id, cerrar);
                    else if (accion === 'eliminar') accionEliminar(id, tr);
                });
            });
        }).catch(function (err) {
            console.error('[historial] Error al listar:', err);
            body.innerHTML = '<p class="historial-vacio">No se pudo cargar el historial: ' + escapeHTML(err.message || String(err)) + '</p>';
        });
    }

    function accionDescargar(id) {
        obtenerRegistro(id).then(function (r) {
            if (!r) return;
            descargarBlob(r.pdfBlob, r.filename);
        }).catch(function (err) { console.error(err); });
    }

    function accionEditar(id, cerrarModal) {
        if (!confirm('¿Cargar este informe en el formulario? Se reemplazarán los datos actuales.')) return;
        obtenerRegistro(id).then(function (r) {
            if (!r) return;
            cerrarModal();
            restaurarFormulario(r);
        }).catch(function (err) { console.error(err); });
    }

    function accionEliminar(id, tr) {
        if (!confirm('¿Eliminar este informe del historial? No se puede deshacer.')) return;
        eliminarRegistro(id).then(function () {
            if (tr && tr.parentNode) tr.parentNode.removeChild(tr);
            mostrarToast('Informe eliminado');
        }).catch(function (err) { console.error(err); });
    }

    function escapeHTML(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // -------------------- Botón "Historial" --------------------

    function instalarBoton() {
        const botoneras = document.querySelectorAll('.botones');
        if (!botoneras.length) return;
        // Preferir la última (la del final del formulario)
        const contenedor = botoneras[botoneras.length - 1];
        if (contenedor.querySelector('.btn-historial')) return; // ya instalado

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-historial no-print';
        btn.textContent = '📁 Historial de Informes';
        // Nota: se usa addEventListener (no btn.onclick=) para que otros scripts que
        // reasignan onclick de botones cuyo source contenga "PDF" no lo pisen.
        btn.addEventListener('click', abrirPanelHistorial);
        Object.assign(btn.style, {
            backgroundColor: '#6f42c1',
            color: '#fff',
            fontWeight: 'bold',
            padding: '10px 20px',
            margin: '0 5px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease'
        });
        btn.onmouseover = function () { this.style.transform = 'translateY(-2px)'; };
        btn.onmouseout  = function () { this.style.transform = 'translateY(0)'; };

        contenedor.appendChild(btn);
    }

    // -------------------- Exponer + init --------------------

    window.archivarPDFEnHistorial = archivarPDFEnHistorial;
    window.abrirPanelHistorial    = abrirPanelHistorial;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', instalarBoton);
    } else {
        instalarBoton();
    }
    // Reintento por si otros scripts modifican la botonera después
    window.addEventListener('load', function () { setTimeout(instalarBoton, 800); });
})();
