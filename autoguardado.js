/**
 * autoguardado.js - versión corregida con descarga PDF
 * Sistema de persistencia de datos para formulario de fiscalización de seguridad privada
 */

// Verificar disponibilidad de localStorage
function verificarLocalStorage() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch (e) {
        console.error('localStorage no está disponible. Error:', e);
        return false;
    }
}

// Guardar todos los datos del formulario
function guardarDatosFormulario() {
    if (!verificarLocalStorage()) return;
    
    console.log('Guardando datos del formulario...');
    
    try {
        // Guardar campos de texto
        const inputFields = document.querySelectorAll('input[type="text"]');
        inputFields.forEach(input => {
            if (input.name) {
                localStorage.setItem(input.name, input.value);
                console.log(`Guardado: ${input.name} = ${input.value}`);
            }
        });
        
        // Guardar radios (estado de cumplimiento)
        const radioButtons = document.querySelectorAll('input[type="radio"]:checked');
        radioButtons.forEach(radio => {
            if (radio.name) {
                localStorage.setItem(radio.name, radio.value);
                console.log(`Guardado radio: ${radio.name} = ${radio.value}`);
            }
        });
        
        // Guardar textareas de observaciones
        const observaciones = document.querySelectorAll('td.observaciones textarea');
        observaciones.forEach((textarea, index) => {
            localStorage.setItem('observacion_' + index, textarea.value);
        });
        
        // Guardar descripciones de fotos
        const fotoDescripciones = document.querySelectorAll('.foto-descripcion');
        fotoDescripciones.forEach((desc, index) => {
            localStorage.setItem('foto_desc_' + index, desc.value);
        });
        
        // Guardar el plan de acción (editor de texto enriquecido)
        const planAccion = document.getElementById('plan-accion-editor');
        if (planAccion) {
            localStorage.setItem('plan_accion', planAccion.innerHTML);
        }
        
        // Guardar fecha y hora de la última actualización
        localStorage.setItem('ultima_actualizacion', new Date().toLocaleString());
        console.log('Todos los datos guardados correctamente');
        
        // Mostrar indicador de guardado
        mostrarIndicadorGuardado();
    } catch (e) {
        console.error('Error al guardar datos:', e);
    }
}

// Mostrar indicador de guardado
function mostrarIndicadorGuardado() {
    const indicador = document.getElementById('indicador-guardado');
    if (indicador) {
        indicador.textContent = 'Guardado automático completado';
        indicador.style.display = 'block';
        
        // Ocultar después de 2 segundos
        setTimeout(() => {
            indicador.style.display = 'none';
        }, 2000);
    }
}

// Cargar todos los datos guardados previamente
function cargarDatosFormulario() {
    if (!verificarLocalStorage()) return;
    
    console.log('Cargando datos guardados...');
    
    try {
        // Verificar si hay datos guardados
        if (localStorage.getItem('ultima_actualizacion')) {
            console.log('Datos encontrados de: ' + localStorage.getItem('ultima_actualizacion'));
        } else {
            console.log('No se encontraron datos guardados');
            return;
        }
        
        // Cargar campos de texto
        const inputFields = document.querySelectorAll('input[type="text"]');
        inputFields.forEach(input => {
            if (input.name) {
                const valorGuardado = localStorage.getItem(input.name);
                if (valorGuardado) {
                    input.value = valorGuardado;
                    console.log(`Cargado: ${input.name} = ${valorGuardado}`);
                }
            }
        });
        
        // Cargar radios (estado de cumplimiento)
        const radioNames = new Set();
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            if (radio.name) {
                radioNames.add(radio.name);
            }
        });
        
        radioNames.forEach(name => {
            const valorGuardado = localStorage.getItem(name);
            if (valorGuardado) {
                const radio = document.querySelector(`input[name="${name}"][value="${valorGuardado}"]`);
                if (radio) {
                    radio.checked = true;
                    console.log(`Radio cargado: ${name} = ${valorGuardado}`);
                }
            }
        });
        
        // Cargar textareas de observaciones
        const observaciones = document.querySelectorAll('td.observaciones textarea');
        observaciones.forEach((textarea, index) => {
            const valorGuardado = localStorage.getItem('observacion_' + index);
            if (valorGuardado) {
                textarea.value = valorGuardado;
            }
        });
        
        // Cargar descripciones de fotos
        const fotoDescripciones = document.querySelectorAll('.foto-descripcion');
        fotoDescripciones.forEach((desc, index) => {
            const valorGuardado = localStorage.getItem('foto_desc_' + index);
            if (valorGuardado) {
                desc.value = valorGuardado;
            }
        });
        
        // Cargar el plan de acción (editor de texto enriquecido)
        const planAccion = document.getElementById('plan-accion-editor');
        if (planAccion) {
            const valorGuardado = localStorage.getItem('plan_accion');
            if (valorGuardado) {
                planAccion.innerHTML = valorGuardado;
            }
        }
        
        // Actualizar conteo después de cargar todos los datos
        if (typeof contarCumplimiento === 'function') {
            contarCumplimiento();
        } else {
            console.error('Función contarCumplimiento no encontrada');
        }
        
        console.log('Datos cargados correctamente');
    } catch (e) {
        console.error('Error al cargar datos:', e);
    }
}

// Función para limpiar todos los datos guardados
function limpiarDatosGuardados() {
    if (!verificarLocalStorage()) return;
    
    if (confirm("¿Está seguro que desea eliminar todos los datos guardados? Esta acción no se puede deshacer.")) {
        localStorage.clear();
        
        if (typeof limpiarFormulario === 'function') {
            limpiarFormulario();
        } else {
            location.reload(); // Si no encuentra la función, recargar la página
        }
        
        // Mostrar mensaje de confirmación
        alert("Todos los datos guardados han sido eliminados.");
    }
}

// Función para retrasar la ejecución (útil para autoguardado mientras se escribe)
function debounce(func, delay) {
    let timeoutId;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

// Añadir un nuevo botón para limpiar sólo los datos guardados
function añadirBotonLimpiarDatos() {
    // Seleccionar el último conjunto de botones (que está al final del formulario)
    const botonesDivs = document.querySelectorAll('.botones');
    if (botonesDivs.length === 0) {
        console.error('No se encontraron divs de botones');
        return;
    }
    
    const ultimoBotonesDiv = botonesDivs[botonesDivs.length - 1];
    
    // Crear el nuevo botón
    const botonLimpiar = document.createElement('button');
    botonLimpiar.type = 'button';
    botonLimpiar.textContent = 'Eliminar Datos Guardados';
    botonLimpiar.onclick = limpiarDatosGuardados;
    botonLimpiar.style.backgroundColor = '#d9534f'; // Color rojo para indicar acción destructiva
    botonLimpiar.className = 'no-print'; // Añadir clase no-print
    
    // Añadir el botón al div
    ultimoBotonesDiv.appendChild(botonLimpiar);
    
    // Asegurarse de que todos los botones tengan la clase no-print y estilo actualizado
    document.querySelectorAll('.botones button').forEach(boton => {
        if (!boton.classList.contains('no-print')) {
            boton.classList.add('no-print');
        }
        
        // Hacer los botones más pequeños
        boton.style.padding = '12px 24px';
        boton.style.fontSize = '1.1rem';
        boton.style.margin = '0 5px';
    });
}

// Añadir indicador de último guardado
function añadirIndicadorGuardado() {
    // Comprobar si ya existe el indicador
    if (document.getElementById('indicador-guardado')) {
        return;
    }
    
    // Crear el elemento indicador
    const indicador = document.createElement('div');
    indicador.id = 'indicador-guardado';
    indicador.style.position = 'fixed';
    indicador.style.bottom = '10px';
    indicador.style.right = '10px';
    indicador.style.padding = '8px 15px';
    indicador.style.backgroundColor = 'rgba(0, 51, 102, 0.8)';
    indicador.style.color = 'white';
    indicador.style.borderRadius = '5px';
    indicador.style.fontSize = '0.9rem';
    indicador.style.zIndex = '1000';
    indicador.style.display = 'none';
    indicador.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    
    // Añadir al cuerpo del documento
    document.body.appendChild(indicador);
}

// Añadir sección de información sobre datos guardados
function añadirInfoDatosGuardados() {
    if (!verificarLocalStorage()) return;
    
    const ultimaActualizacion = localStorage.getItem('ultima_actualizacion');
    
    if (ultimaActualizacion) {
        // Comprobar si ya existe el elemento
        if (document.querySelector('.datos-guardados-info')) {
            return;
        }
        
        // Crear elemento de información
        const infoDiv = document.createElement('div');
        infoDiv.className = 'datos-guardados-info';
        infoDiv.style.margin = '20px 0';
        infoDiv.style.padding = '10px 15px';
        infoDiv.style.backgroundColor = '#f8f9fa';
        infoDiv.style.borderRadius = '5px';
        infoDiv.style.border = '1px solid #ddd';
        infoDiv.style.fontSize = '0.9rem';
        
        infoDiv.innerHTML = `
            <p style="margin: 0; color: #003366;">
                <strong>Información de datos guardados:</strong> Última actualización: ${ultimaActualizacion}
            </p>
            <p style="margin: 5px 0 0 0; font-size: 0.8rem; color: #6c757d;">
                Los datos del formulario se guardan automáticamente en este dispositivo.
            </p>
        `;
        
        // Insertar antes del primer h2
        const primerH2 = document.querySelector('h2');
        if (primerH2) {
            primerH2.parentNode.insertBefore(infoDiv, primerH2);
        } else {
            document.body.insertBefore(infoDiv, document.body.firstChild);
        }
    }
}

// Añadir estilos CSS específicos para impresión
function añadirEstilosImpresion() {
    // Comprobar si ya existe el estilo
    if (document.getElementById('estilos-impresion')) {
        return;
    }
    
    // Crear elemento de estilo
    const estiloElement = document.createElement('style');
    estiloElement.id = 'estilos-impresion';
    estiloElement.type = 'text/css';
    
    // Añadir reglas CSS para ocultar elementos en la impresión
    estiloElement.innerHTML = `
        @media print {
            .no-print, .botones, #indicador-guardado {
                display: none !important;
            }
            
            /* Asegurar que los botones no se muestran */
            button {
                display: none !important;
            }
            
            /* Mejorar el espaciado y márgenes */
            body {
                padding: 0;
                margin: 0;
            }
            
            .container {
                padding: 10px;
                box-shadow: none;
            }
            
            /* Asegurar que los botones también se ocultan */
            .botones.no-print {
                display: none !important;
            }
        }
    `;
    
    // Añadir al head del documento
    document.head.appendChild(estiloElement);
}

// Estilos adicionales para los botones y la interfaz
function aplicarEstilosAdicionales() {
    // Comprobar si ya existe el estilo
    if (document.getElementById('estilos-adicionales')) {
        return;
    }
    
    // Crear hoja de estilos
    const estilos = document.createElement('style');
    estilos.id = 'estilos-adicionales';
    estilos.textContent = `
        /* Estilo actualizado para los botones */
        .botones button {
            padding: 12px 24px !important;
            font-size: 1.1rem !important;
            margin: 0 5px !important;
            transition: all 0.2s ease !important;
        }
        
        .botones button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        /* Mejor espaciado para el contenedor de botones */
        .botones {
            gap: 10px;
            padding: 15px 0;
        }
        
        /* Estilo específico para botón de eliminar datos */
        .botones button:last-child {
            padding: 10px 20px !important;
            font-size: 1rem !important;
        }
        
        /* Estilo específico para botón de descarga PDF */
        #btn-descargar-pdf {
            background-color: #28a745 !important;
            font-weight: bold !important;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
        }
        
        #btn-descargar-pdf:hover {
            background-color: #218838 !important;
        }
        
        /* Indicador de guardado más pequeño */
        #indicador-guardado {
            font-size: 0.85rem !important;
            padding: 6px 12px !important;
        }
        
        /* Info de datos guardados más compacta */
        .datos-guardados-info {
            padding: 8px 12px !important;
        }
    `;
    
    // Añadir al documento
    document.head.appendChild(estilos);
}

// Configurar el autoguardado mientras se escribe
function configurarAutoguardado() {
    console.log('Configurando eventos de autoguardado...');
    
    // Guardar al cambiar inputs de texto
    document.querySelectorAll('input[type="text"]').forEach(input => {
        input.addEventListener('change', guardarDatosFormulario);
        input.addEventListener('blur', guardarDatosFormulario);
    });
    
    // Guardar al cambiar radios
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', guardarDatosFormulario);
        radio.addEventListener('click', guardarDatosFormulario);
    });
    
    // Guardar al cambiar textareas
    document.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('change', guardarDatosFormulario);
        textarea.addEventListener('blur', guardarDatosFormulario);
        // También guardar mientras se escribe, pero con un retraso
        textarea.addEventListener('input', debounce(guardarDatosFormulario, 1000));
    });
    
    // Guardar cuando se edita el plan de acción
    const planAccion = document.getElementById('plan-accion-editor');
    if (planAccion) {
        planAccion.addEventListener('input', debounce(guardarDatosFormulario, 1000));
        planAccion.addEventListener('blur', guardarDatosFormulario);
    }
    
    // Guardar periódicamente para asegurar que nada se pierda
    setInterval(guardarDatosFormulario, 30000); // Cada 30 segundos
    
    // Guardar antes de cerrar la página
    window.addEventListener('beforeunload', guardarDatosFormulario);
    
    // Modificar la función limpiarFormulario original para que también borre localStorage
    if (typeof window.limpiarFormulario === 'function') {
        const limpiarFormularioOriginal = window.limpiarFormulario;
        window.limpiarFormulario = function() {
            if (confirm("¿Está seguro que desea limpiar todo el formulario? También se eliminarán los datos guardados.")) {
                localStorage.clear();
                limpiarFormularioOriginal();
            }
        };
    }
}

// Eliminar primer conjunto de botones y mantener solo el último
function ajustarBotones() {
    const botonesDivs = document.querySelectorAll('.botones');
    if (botonesDivs.length > 1) {
        // Mantener solo el último conjunto de botones (que está al final)
        for (let i = 0; i < botonesDivs.length - 1; i++) {
            botonesDivs[i].style.display = 'none';
        }
    }
}

// Función para descargar el formulario como PDF
function descargarPDF() {
    // Mostrar indicador de carga
    const indicadorCarga = document.createElement('div');
    indicadorCarga.id = 'indicador-pdf';
    indicadorCarga.style.position = 'fixed';
    indicadorCarga.style.top = '0';
    indicadorCarga.style.left = '0';
    indicadorCarga.style.width = '100%';
    indicadorCarga.style.height = '100%';
    indicadorCarga.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    indicadorCarga.style.zIndex = '9999';
    indicadorCarga.style.display = 'flex';
    indicadorCarga.style.justifyContent = 'center';
    indicadorCarga.style.alignItems = 'center';
    indicadorCarga.style.color = 'white';
    indicadorCarga.style.fontSize = '1.5rem';
    indicadorCarga.style.fontFamily = "'Poppins', sans-serif";
    indicadorCarga.innerHTML = '<div style="background-color: #003366; padding: 20px 40px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">Generando PDF, por favor espere...</div>';
    document.body.appendChild(indicadorCarga);
    
    // Ocultar temporalmente los botones para la exportación
    const botones = document.querySelectorAll('.botones');
    botones.forEach(div => {
        div.dataset.displayOriginal = div.style.display;
        div.style.display = 'none';
    });
    
    // Guardar el estado actual de cualquier elemento que queramos modificar
    const elementos = document.querySelectorAll('.no-print');
    elementos.forEach(el => {
        el.dataset.displayOriginal = el.style.display;
        el.style.display = 'none';
    });
    
    // Asegurarnos de que el contenido del plan de acción sea visible
    const planAccion = document.getElementById('plan-accion-editor');
    if (planAccion) {
        planAccion.style.height = 'auto';
        planAccion.style.overflow = 'visible';
    }
    
    // Obtener el contenedor principal
    const contenido = document.querySelector('.container');
    if (!contenido) {
        alert('Error: No se pudo encontrar el contenedor del formulario.');
        limpiarYRestaurar();
        return;
    }
    
    // Configuración del PDF
    const opciones = {
        margin: [10, 10, 10, 10], // top, left, bottom, right
        filename: `Fiscalizacion_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, // Mayor escala para mejor calidad
            useCORS: true, 
            logging: false,
            letterRendering: true,
            allowTaint: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: [215.9, 355.6], // Formato legal en milímetros (8.5 x 14 pulgadas)
            orientation: 'portrait',
            compress: true
        }
    };
    
    // Cargar html2pdf.js desde CDN si no está ya cargado
    if (typeof html2pdf === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0
