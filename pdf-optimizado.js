/**
 * Solución optimizada para la generación de PDF sin páginas en blanco intermedias,
 * con observaciones completas y letra reducida
 */

// Función principal que configura y genera el PDF
function generarPDFCorregido() {
    // Mostrar indicador de progreso
    mostrarIndicadorCarga();
    
    // Verificar si html2pdf ya está cargado
    if (typeof html2pdf === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = prepararYGenerarPDF;
        script.onerror = function() {
            ocultarIndicadorCarga();
            alert('Error: No se pudo cargar la biblioteca necesaria para generar el PDF. Verifique su conexión a Internet.');
        };
        document.head.appendChild(script);
    } else {
        prepararYGenerarPDF();
    }
    
    // Función principal de preparación y generación
    function prepararYGenerarPDF() {
        console.log("Iniciando generación de PDF optimizada...");
        
        // 1. Obtener una copia limpia del contenido que vamos a convertir
        const container = document.querySelector('.container');
        if (!container) {
            ocultarIndicadorCarga();
            alert('Error: No se pudo encontrar el contenedor principal del documento.');
            return;
        }
        
        // 2. Preparar el contenido limpiando elementos innecesarios
        const estadoOriginal = prepararContenidoParaPDF(container);
        
        // 3. Generar el PDF con la configuración optimizada
        setTimeout(() => {
            generarPDFDesdeContenido(container, estadoOriginal);
        }, 300); // Pequeño retraso para que los cambios de estilo se apliquen
    }
    
    // Función para preparar el contenido limpiando elementos no deseados
    function prepararContenidoParaPDF(container) {
        // Guardar el estado original para restaurar después
        const estadoOriginal = {
            estilos: new Map(),
            ocultos: [],
            documentBody: {
                overflow: document.body.style.overflow,
                height: document.body.style.height
            },
            elementosCreados: [] // Para rastrear elementos creados durante la preparación
        };
        
        // 1. Eliminar espacios en blanco y elementos vacíos que pueden causar páginas en blanco
        const espaciosVacios = container.querySelectorAll('[style*="page-break"]');
        espaciosVacios.forEach(el => {
            if (!el.textContent.trim() && !el.querySelector('img') && el.clientHeight < 5) {
                estadoOriginal.ocultos.push({
                    element: el,
                    display: el.style.display,
                    parent: el.parentNode
                });
                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            }
        });
        
        // 2. Ocultar elementos con clase no-print y botones
        const elementosOcultar = container.querySelectorAll('.botones, .no-print');
        elementosOcultar.forEach(el => {
            estadoOriginal.ocultos.push({
                element: el,
                display: el.style.display
            });
            el.style.display = 'none';
        });
        
        // 3. Mejorar el manejo de las textareas (observaciones)
        const textareas = container.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            // Guardar estado original
            estadoOriginal.estilos.set(textarea, {
                height: textarea.style.height,
                overflow: textarea.style.overflow,
                value: textarea.value
            });
            
            // Crear un div con el contenido de la textarea para asegurar que todo se muestre
            const contenidoTexto = document.createElement('div');
            contenidoTexto.textContent = textarea.value;
            contenidoTexto.className = 'textarea-contenido-pdf';
            Object.assign(contenidoTexto.style, {
                minHeight: '40px', // Reducido de 50px
                width: '100%',
                fontFamily: textarea.style.fontFamily || 'inherit',
                fontSize: '9pt', // Reducido
                lineHeight: '1.3', // Reducido de 1.4
                paddingLeft: '5px',
                whiteSpace: 'pre-wrap', // Preservar espacios y saltos de línea
                wordBreak: 'break-word'
            });
            
            // Insertar el div antes de la textarea y ocultar la textarea original
            textarea.parentNode.insertBefore(contenidoTexto, textarea);
            textarea.style.display = 'none';
            
            // Registrar este elemento para eliminarlo después
            estadoOriginal.elementosCreados.push(contenidoTexto);
        });
        
        // 4. Aplicar estilos óptimos para la impresión
        const elementosEstilizar = [
            { selector: '.forced-page-break', estilos: {
                display: 'block',
                height: '1px',
                pageBreakBefore: 'always',
                margin: '0',
                padding: '0'
            }},
            { selector: 'h2', estilos: {
                pageBreakBefore: 'always',
                marginTop: '15px', // Reducido de 20px
                paddingTop: '8px', // Reducido de 10px
                fontSize: '1.5rem' // Tamaño reducido
            }},
            { selector: 'h3', estilos: {
                fontSize: '1.2rem' // Tamaño reducido
            }},
            { selector: 'table', estilos: {
                pageBreakInside: 'auto',
                fontSize: '9pt' // Tamaño reducido
            }},
            { selector: 'tr', estilos: {
                pageBreakInside: 'avoid'
            }},
            { selector: '#plan-accion-editor', estilos: {
                height: 'auto',
                maxHeight: 'none',
                overflow: 'visible',
                fontSize: '9pt' // Tamaño reducido
            }}
        ];
        
        // Aplicar los estilos y guardar los originales
        elementosEstilizar.forEach(config => {
            const elementos = container.querySelectorAll(config.selector);
            elementos.forEach(el => {
                // Guardar estilos originales si aún no se han guardado
                if (!estadoOriginal.estilos.has(el)) {
                    const estilosOriginales = {};
                    Object.keys(config.estilos).forEach(prop => {
                        estilosOriginales[prop] = el.style[prop];
                    });
                    estadoOriginal.estilos.set(el, estilosOriginales);
                }
                
                // Aplicar nuevos estilos
                Object.keys(config.estilos).forEach(prop => {
                    el.style[prop] = config.estilos[prop];
                });
            });
        });
        
        // 5. Añadir una hoja de estilos temporal con reglas específicas para PDF
        const estilosTemporales = document.createElement('style');
        estilosTemporales.id = 'estilos-temporales-pdf';
        estilosTemporales.textContent = `
            @page {
                size: legal portrait;
                margin: 15mm 10mm;
            }
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                font-size: 10pt !important; /* Base font size reduced */
            }
            .container {
                font-size: 10pt !important; /* Reduced from 12pt */
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            h2 {
                page-break-before: always !important;
                break-before: page !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
                font-size: 1.5rem !important; /* Reduced */
                margin-top: 15px !important; /* Reduced */
                margin-bottom: 10px !important; /* Reduced */
            }
            h3 {
                page-break-after: avoid !important;
                break-after: avoid !important;
                font-size: 1.2rem !important; /* Reduced */
                margin-top: 12px !important; /* Reduced */
                margin-bottom: 8px !important; /* Reduced */
            }
            table {
                page-break-inside: auto !important;
                break-inside: auto !important;
                font-size: 9pt !important; /* Reduced */
            }
            th, td {
                padding: 6px !important; /* Reduced from 8px or whatever the original was */
                font-size: 9pt !important; /* Reduced */
            }
            tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            .forced-page-break {
                page-break-before: always !important;
                break-before: page !important;
                height: 1px !important;
                visibility: hidden !important;
            }
            
            /* Eliminar saltos de página no deseados */
            div:empty {
                display: none !important;
            }
            
            /* Mejorar visualización de observaciones */
            .textarea-contenido-pdf {
                min-height: 40px; /* Reduced from 50px */
                padding: 4px !important; /* Reduced from 5px */
                font-family: inherit !important;
                font-size: 9pt !important; /* Reduced */
                line-height: 1.3 !important; /* Reduced from 1.4 */
                white-space: pre-wrap !important;
                word-break: break-word !important;
                margin-bottom: 4px !important; /* Reduced from 5px */
            }
            
            /* Estilos para asegurar que los fondos se muestren correctamente */
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            
            /* Estilos específicos para que los gráficos y colores se muestren correctamente */
            .header-row, th {
                background-color: #003366 !important;
                color: white !important;
                font-size: 9pt !important; /* Reduced */
            }
            
            tr:nth-child(even) {
                background-color: #f9f9f9 !important;
            }
            
            .info-section, .summary {
                background-color: #f9f9f9 !important;
                font-size: 9.5pt !important; /* Reduced */
            }
            
            .result.seguro {
                background-color: #dff0d8 !important;
                color: #3c763d !important;
                border: 1px solid #d6e9c6 !important;
            }
            
            .result.riesgo {
                background-color: #fcf8e3 !important;
                color: #8a6d3b !important;
                border: 1px solid #faebcc !important;
            }
            
            .result.inseguro {
                background-color: #f2dede !important;
                color: #a94442 !important;
                border: 1px solid #ebccd1 !important;
            }
            
            /* Asegurar que las imágenes sean visibles */
            img {
                display: inline-block !important;
                max-width: 100% !important;
            }
            
            /* Reducir tamaños específicos */
            p, li, div {
                font-size: 10pt !important; /* Reduced */
                margin-top: 3px !important; /* Reduced */
                margin-bottom: 3px !important; /* Reduced */
            }
            
            /* Optimizar el uso del espacio en la sección de resumen */
            #resumen-automatico {
                font-size: 9.5pt !important; /* Reduced */
            }
            
            #resumen-automatico p, #resumen-automatico li {
                margin: 2px 0 !important; /* Reduced */
            }
            
            /* Aj
