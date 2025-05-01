/**
 * pdf-optimizado.js - Versión con logo y título actualizados desde pdf-optimizado (1).js
 * Solución optimizada para la generación de PDF sin páginas en blanco intermedias,
 * con observaciones completas y tamaño de letra reducido
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
        }, 500); // Retraso para que los cambios de estilo se apliquen (era 300)
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

        // Aplicar directamente estilos de tamaño pequeño a todos los elementos (Adaptado de pdf-optimizado (1).js)
        const elementosTexto = container.querySelectorAll('*');
        elementosTexto.forEach(el => {
            if (el.tagName) {
                // Guardar estilos originales si no existen
                if (!estadoOriginal.estilos.has(el)) {
                     estadoOriginal.estilos.set(el, {
                        fontSize: el.style.fontSize,
                        lineHeight: el.style.lineHeight,
                        padding: el.style.padding,
                        margin: el.style.margin
                    });
                }

                // Aplicar tamaños extremadamente pequeños según tipo de elemento (de pdf-optimizado (1).js)
                const tagName = el.tagName.toLowerCase();
                 if (tagName === 'h1') {
                    el.style.fontSize = '10pt';
                    el.style.marginLeft = '70px'; // <-- Actualizado desde (1).js
                    el.style.marginBottom = '8px'; // <-- Añadido desde (1).js
                    el.style.marginTop = '8px';    // <-- Añadido desde (1).js
                } else if (tagName === 'h2') {
                    el.style.fontSize = '7pt';  // <-- Actualizado desde (1).js
                    el.style.marginTop = '6px'; // <-- Añadido desde (1).js
                    el.style.paddingTop = '3px';// <-- Añadido desde (1).js
                } else if (tagName === 'h3') {
                    el.style.fontSize = '6pt';  // <-- Actualizado desde (1).js
                    el.style.marginTop = '4px'; // <-- Añadido desde (1).js
                    el.style.marginBottom = '1px';// <-- Añadido desde (1).js
                } else if (tagName === 'th') {
                    el.style.fontSize = '5.5pt';// <-- Actualizado desde (1).js
                    el.style.padding = '1px 3px';// <-- Actualizado desde (1).js
                } else if (tagName === 'td') {
                    el.style.fontSize = '5pt';  // <-- Actualizado desde (1).js
                    el.style.padding = '1px 3px';// <-- Actualizado desde (1).js
                } else if (tagName === 'input' || tagName === 'textarea') {
                    el.style.fontSize = '5pt';  // <-- Actualizado desde (1).js
                    el.style.padding = '0px';   // <-- Actualizado desde (1).js
                    if (el.parentNode && el.parentNode.classList.contains('fecha-inputs')) {
                        el.style.width = '15px';// <-- Actualizado desde (1).js
                    }
                    if(tagName === 'textarea'){ // Estilos específicos para textarea de (1).js
                         el.style.minHeight = '20px';
                         el.style.lineHeight = '0.9';
                    }
                } else if (tagName === 'p' || tagName === 'span' || tagName === 'div') {
                    // Aplicar a otros elementos de texto genéricos
                    el.style.fontSize = '5pt'; // <-- Actualizado desde (1).js
                    el.style.lineHeight = '0.9';// <-- Actualizado desde (1).js
                    el.style.margin = '0';     // <-- Asegurado desde (1).js
                    el.style.padding = '0';    // <-- Asegurado desde (1).js (era 1px top/bottom en original)
                }
            }
        });

        // Asegurar que el logo esté correctamente posicionado (Actualizado desde pdf-optimizado (1).js)
        const logoContainer = container.querySelector('.logo-container');
        if (logoContainer) {
            // Guardar estado original si no existe
             if (!estadoOriginal.estilos.has(logoContainer)) {
                estadoOriginal.estilos.set(logoContainer, {
                    position: logoContainer.style.position,
                    top: logoContainer.style.top,
                    left: logoContainer.style.left,
                    zIndex: logoContainer.style.zIndex
                });
             }

            // Forzar posición correcta del logo
            logoContainer.style.position = 'absolute';
            logoContainer.style.top = '-8px';  // <-- Valor de (1).js
            logoContainer.style.left = '5px'; // <-- Valor de (1).js (era 10px)
            logoContainer.style.zIndex = '1000';

            // Asegurarse que la imagen del logo sea visible
            const logoImage = logoContainer.querySelector('.logo-os10');
            if (logoImage) {
                 // Guardar estado original si no existe
                 if (!estadoOriginal.estilos.has(logoImage)) {
                    estadoOriginal.estilos.set(logoImage, {
                        width: logoImage.style.width,
                        display: logoImage.style.display,
                        height: logoImage.style.height // Guardar altura también
                    });
                 }
                 // Usar el valor de width del JS en (1).js, que era 85px
                logoImage.style.width = '85px'; // <-- Valor de (1).js (era 60px en CSS, 100px en original JS)
                logoImage.style.height = 'auto'; // Asegurar altura automática
                logoImage.style.display = 'block';
            }
        }

        // Asegurar que el título esté correctamente posicionado (Actualizado desde pdf-optimizado (1).js)
        const titulo = container.querySelector('h1');
        if (titulo) {
             // Guardar estado original si no existe
             if (!estadoOriginal.estilos.has(titulo)) {
                estadoOriginal.estilos.set(titulo, {
                    position: titulo.style.position,
                    marginLeft: titulo.style.marginLeft,
                    marginTop: titulo.style.marginTop,
                    fontSize: titulo.style.fontSize,
                    marginBottom: titulo.style.marginBottom // Guardar margen inferior
                });
             }

            titulo.style.position = 'relative'; // Mantenido de original
            titulo.style.marginLeft = '70px';  // <-- Valor de (1).js (era 90px)
            titulo.style.marginTop = '8px';    // <-- Valor de (1).js (era 15px)
            titulo.style.marginBottom = '8px'; // <-- Valor de (1).js
            titulo.style.fontSize = '10pt';    // <-- Valor de (1).js (era 18pt)
        }


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

        // 2. Ocultar elementos con clase no-print, botones y la información de datos guardados
        const elementosOcultar = container.querySelectorAll('.botones, .no-print, .rich-text-toolbar, .datos-guardados-info, .mobile-nav, .mobile-action-button');
        elementosOcultar.forEach(el => {
             if(!el.classList.contains('logo-container') && !el.classList.contains('logo-os10') && el.tagName !== 'H1') { // No ocultar logo/titulo
                estadoOriginal.ocultos.push({
                    element: el,
                    display: el.style.display
                });
                el.style.display = 'none';
             }
        });

        // 3. Forzar saltos de página antes de las secciones específicas
        const seccionResumen = container.querySelector('#seccion-resumen');
        const seccionFotos = container.querySelector('#seccion-fotos');

        // Asegurarse de que la sección de resumen tenga un salto de página forzado
        if (seccionResumen) {
            if (!seccionResumen.classList.contains('forced-page-break')) {
                seccionResumen.classList.add('forced-page-break');
            }
            seccionResumen.style.pageBreakBefore = 'always';
            seccionResumen.style.breakBefore = 'page';
        }

        // Asegurarse de que la sección de fotos tenga un salto de página forzado
        if (seccionFotos) {
            if (!seccionFotos.classList.contains('forced-page-break')) {
                seccionFotos.classList.add('forced-page-break');
            }
            seccionFotos.style.pageBreakBefore = 'always';
            seccionFotos.style.breakBefore = 'page';
        }

        // (Eliminado salto antes de recomendaciones para seguir estructura original de pdf-optimizado.js)

        // 4. Mejorar el manejo de las textareas (observaciones)
        const textareas = container.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            // Guardar estado original
            if (!estadoOriginal.estilos.has(textarea)) {
                estadoOriginal.estilos.set(textarea, {
                    height: textarea.style.height,
                    overflow: textarea.style.overflow,
                    value: textarea.value,
                    display: textarea.style.display // Guardar display
                });
            }

            // Crear un div con el contenido de la textarea para asegurar que todo se muestre
            const contenidoTexto = document.createElement('div');
            contenidoTexto.textContent = textarea.value;
            contenidoTexto.className = 'textarea-contenido-pdf';
            Object.assign(contenidoTexto.style, {
                minHeight: '20px', // Valor de (1).js (era 50px)
                width: '100%',
                fontFamily: textarea.style.fontFamily || 'inherit',
                fontSize: '5pt', // Valor de (1).js (era 9pt/10pt)
                lineHeight: '0.9', // Valor de (1).js (era 1.2/1.3)
                padding: '1px', // Valor de (1).js (era 5px)
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: '0' // Añadido de (1).js
            });

            // Insertar el div antes de la textarea y ocultar la textarea original
            textarea.parentNode.insertBefore(contenidoTexto, textarea);
            textarea.style.display = 'none';

            // Registrar este elemento para eliminarlo después
            estadoOriginal.elementosCreados.push(contenidoTexto);
        });

        // 5. Aplicar estilos óptimos para la impresión (Combinando estilos de ambos)
        const elementosEstilizar = [
            { selector: '.forced-page-break', estilos: {
                display: 'block', height: '1px', pageBreakBefore: 'always', margin: '0', padding: '0'
            }},
            { selector: 'h2', estilos: { // Usando valores de (1).js
                pageBreakBefore: 'always', marginTop: '6px', paddingTop: '3px', fontSize: '7pt'
            }},
            { selector: 'h3', estilos: { // Usando valores de (1).js
                 fontSize: '6pt', marginTop: '4px', marginBottom: '1px'
            }},
            { selector: 'table', estilos: {
                pageBreakInside: 'auto', fontSize: '5pt', margin: '0', padding: '0' // Añadido de (1).js
            }},
             { selector: 'th', estilos: { // Usando valores de (1).js
                 fontSize: '5.5pt', padding: '1px 3px'
             }},
            { selector: 'td', estilos: { // Usando valores de (1).js
                 fontSize: '5pt', padding: '1px 3px'
            }},
            { selector: 'tr', estilos: {
                pageBreakInside: 'avoid', margin: '0', padding: '0' // Añadido de (1).js
            }},
            { selector: '#plan-accion-editor', estilos: { // Manteniendo estilo original pero con fuente reducida
                height: 'auto', maxHeight: 'none', overflow: 'visible', fontSize: '5pt', lineHeight: '0.9' // Fuente/lineHeight de (1).js
            }},
             { selector: '.info-section input[type="text"]', estilos: { // De (1).js
                 fontSize: '5pt', padding: '0', height: 'auto'
             }},
             { selector: '.fecha-inputs input[type="text"]', estilos: { // De (1).js
                 fontSize: '5pt', padding: '0', width: '15px', textAlign: 'center'
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

        // 6. Añadir una hoja de estilos temporal con reglas específicas para PDF (Combinando y usando valores de (1).js)
        const estilosTemporales = document.createElement('style');
        estilosTemporales.id = 'estilos-temporales-pdf';
        estilosTemporales.textContent = `
            @page {
                size: legal portrait;
                margin: 8mm 5mm; /* Márgenes de (1).js (eran 15mm 10mm) */
            }
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            /* Estilos generales y contenedor de (1).js */
            body, .container, div, p, span, td, th, h1, h2, h3, h4, h5, h6, input, textarea {
                font-size: 5pt !important;
                line-height: 0.9 !important;
                margin: 0 !important;
                padding: 0 !important; /* Era padding: 1px !important; en (1).js */
            }
             .container {
                width: 90% !important; /* Era 94% / 100% */
                max-width: 90% !important; /* Era 94% / 100% */
                padding: 1mm !important; /* Era 2mm / 5mm */
                margin: 0 auto !important;
            }

            /* Título (H1) de (1).js */
            h1 {
                font-size: 10pt !important;
                margin-left: 70px !important;
                margin-bottom: 8px !important;
                margin-top: 8px !important;
                position: relative !important; /* Añadido para consistencia */
            }

            /* Logo posicionamiento específico de (1).js */
            .logo-container {
                position: absolute !important;
                top: -8px !important;
                left: 5px !important; /* Era 10px */
                z-index: 1000 !important;
                width: auto !important; /* Asegurar auto */
                height: auto !important;/* Asegurar auto */
            }
            .logo-os10 {
                width: 85px !important; /* Ancho del JS de (1).js (era 60px CSS / 100px original)*/
                height: auto !important;
                display: block !important;
            }

            /* Eliminar elementos vacíos que pueden causar páginas en blanco */
            div:empty, p:empty, span:empty {
                display: none !important;
                height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
            }

             /* Títulos H2, H3 de (1).js */
            h2 {
                font-size: 7pt !important;
                page-break-before: always !important;
                break-before: page !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
                margin-top: 6px !important;
                padding-top: 3px !important;
            }
            h3 {
                font-size: 6pt !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
                margin-top: 4px !important;
                margin-bottom: 1px !important;
            }
            /* Tablas y celdas de (1).js */
            table {
                page-break-inside: auto !important;
                break-inside: auto !important;
                font-size: 5pt !important;
                margin: 0 !important; /* Añadido */
                padding: 0 !important;/* Añadido */
            }
            th {
                font-size: 5.5pt !important;
                padding: 1px 3px !important;
                background-color: #003366 !important; /* Fondo mantenido */
                color: white !important; /* Color mantenido */
            }
            td {
                font-size: 5pt !important;
                padding: 1px 3px !important;
            }
            tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                margin: 0 !important; /* Añadido */
                padding: 0 !important;/* Añadido */
            }
            tr:nth-child(even) { /* Mantener estilo original */
                background-color: #f9f9f9 !important;
            }
            /* Salto forzado */
            .forced-page-break {
                page-break-before: always !important;
                break-before: page !important;
                height: 1px !important;
                visibility: hidden !important;
                margin: 0 !important; /* Añadido */
                padding: 0 !important;/* Añadido */
            }

            /* Mejorar visualización de observaciones de (1).js */
            .textarea-contenido-pdf {
                min-height: 20px !important;
                padding: 1px !important;
                font-family: inherit !important;
                font-size: 5pt !important;
                line-height: 0.9 !important;
                white-space: pre-wrap !important;
                word-break: break-word !important;
                margin: 0 !important; /* Era margin-bottom: 1px */
            }

            /* Inputs de texto de (1).js */
            .info-section input[type="text"] {
                font-size: 5pt !important;
                padding: 0 !important; /* Era 1px */
                height: auto !important;
            }
            .fecha-inputs input[type="text"] {
                font-size: 5pt !important;
                padding: 0px !important;
                width: 15px !important;
                text-align: center !important;
            }

             /* Estilos de resultado mantenidos */
             .result.seguro { background-color: #dff0d8 !important; color: #3c763d !important; border: 1px solid #d6e9c6 !important; font-size: 6pt !important; padding: 1px !important; }
             .result.riesgo { background-color: #fcf8e3 !important; color: #8a6d3b !important; border: 1px solid #faebcc !important; font-size: 6pt !important; padding: 1px !important; }
             .result.inseguro { background-color: #f2dede !important; color: #a94442 !important; border: 1px solid #ebccd1 !important; font-size: 6pt !important; padding: 1px !important; }

            /* Asegurar que las imágenes sean visibles */
            img:not(.logo-os10) { /* No aplicar a logo */
                display: inline-block !important;
                max-width: 100% !important;
            }

             /* Ocultar navegación móvil y otros elementos no deseados */
            .mobile-nav, .mobile-action-button, .mobile-control-panel, .botones, .no-print, .rich-text-toolbar {
                display: none !important;
                height: 0 !important;
                width: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                visibility: hidden !important;
            }
        `;
        document.head.appendChild(estilosTemporales);
        estadoOriginal.elementosCreados.push(estilosTemporales);

        // 7. Eliminar elementos vacíos que puedan causar páginas en blanco (lógica original)
        const elementosVacios = Array.from(container.querySelectorAll('div, p, span'))
            .filter(el => !el.textContent.trim() && !el.querySelector('img') && el.clientHeight < 20 && !el.id && !el.classList.contains('logo-container')); // No eliminar contenedor del logo

        elementosVacios.forEach(el => {
            if (el.children.length === 0 || (el.children.length === 1 && el.children[0].textContent.trim() === '')) {
                estadoOriginal.ocultos.push({
                    element: el,
                    display: el.style.display,
                    parent: el.parentNode,
                    nextSibling: el.nextSibling
                });

                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            }
        });

        // 8. Restringir el flujo del documento para evitar problemas de renderizado
        document.body.style.overflow = 'visible';
        document.body.style.height = 'auto';

        return estadoOriginal;
    }

    // Función para generar el PDF con la configuración óptima
    function generarPDFDesdeContenido(contenido, estadoOriginal) {
        console.log("Generando PDF con configuración óptima...");

        // Configuración optimizada para tamaño legal/oficio (combinando)
        const opciones = {
            filename: `Fiscalizacion_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,

            html2canvas: {
                scale: 0.85, // Escala de (1).js (era 1.5)
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: 0,
                windowWidth: document.documentElement.offsetWidth,
                windowHeight: document.documentElement.offsetHeight,
                logging: false,
                backgroundColor: '#FFFFFF',
                imageTimeout: 30000,
                removeContainer: true,
                foreignObjectRendering: false,
                onclone: function(clonedDoc) {
                    // Aplicar estilos directamente a todos los elementos en el clon (de pdf-optimizado (1).js)
                    const elementosClonados = clonedDoc.querySelectorAll('*');
                    elementosClonados.forEach(el => {
                        const tagName = el.tagName.toLowerCase();
                         // Aplicar tamaños extremadamente pequeños según el tipo de elemento
                        if (tagName === 'h1') {
                            el.style.fontSize = '10pt'; // <-- (1).js
                            el.style.marginLeft = '70px';// <-- (1).js
                            el.style.marginBottom = '8px';// <-- (1).js
                            el.style.marginTop = '8px'; // <-- (1).js
                            el.style.position = 'relative'; // Añadido
                        } else if (tagName === 'h2') {
                            el.style.fontSize = '7pt';// <-- (1).js
                            el.style.marginTop = '6px';// <-- (1).js
                            el.style.paddingTop = '3px';// <-- (1).js
                            el.style.pageBreakBefore = 'always'; // Asegurar salto
                            el.style.breakBefore = 'page';     // Asegurar salto
                        } else if (tagName === 'h3') {
                            el.style.fontSize = '6pt';// <-- (1).js
                            el.style.marginTop = '4px';// <-- (1).js
                            el.style.marginBottom = '1px';// <-- (1).js
                        } else if (tagName === 'th') {
                            el.style.fontSize = '5.5pt';// <-- (1).js
                            el.style.padding = '1px 3px';// <-- (1).js
                            el.style.backgroundColor = '#003366'; // Mantener color
                            el.style.color = 'white'; // Mantener color
                        } else if (tagName === 'td') {
                            el.style.fontSize = '5pt';// <-- (1).js
                            el.style.padding = '1px 3px';// <-- (1).js
                        } else if (tagName === 'input' || tagName === 'textarea') {
                            el.style.fontSize = '5pt';// <-- (1).js
                            el.style.padding = '0px';// <-- (1).js
                            if (el.parentNode && el.parentNode.classList.contains('fecha-inputs')) {
                                el.style.width = '15px';// <-- (1).js
                                el.style.textAlign = 'center'; //Añadido
                            }
                             if(tagName === 'textarea'){ // Estilos específicos para textarea de (1).js
                                el.style.minHeight = '20px';
                                el.style.lineHeight = '0.9';
                             }
                        } else if (tagName === 'p' || tagName === 'span' || tagName === 'div') {
                            // Aplicar a otros elementos de texto genéricos
                            if(!el.classList.contains('logo-container')){ // Evitar sobreescribir logo container
                                el.style.fontSize = '5pt';// <-- (1).js
                                el.style.lineHeight = '0.9';// <-- (1).js
                                el.style.margin = '0';// <-- (1).js
                                el.style.padding = '0';// <-- (1).js
                            }
                        }
                    });

                    // Asegurar logo en posición correcta (de pdf-optimizado (1).js)
                    const logoContainer = clonedDoc.querySelector('.logo-container');
                    if (logoContainer) {
                        logoContainer.style.position = 'absolute';
                        logoContainer.style.top = '-8px';
                        logoContainer.style.left = '5px'; // Era 10px
                        logoContainer.style.zIndex = '1000';

                        const logoImage = logoContainer.querySelector('.logo-os10');
                        if (logoImage) {
                            logoImage.style.width = '85px'; // Ancho del JS de (1).js
                            logoImage.style.height = 'auto';
                            logoImage.style.display = 'block';
                        }
                    }

                    // (Título ya ajustado en el bucle anterior)

                    // Forzar la visibilidad de los fondos y gráficos + Estilos CSS finales (Combinando de ambos)
                    const style = clonedDoc.createElement('style');
                    style.innerHTML = `
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        body, html { margin: 0 !important; padding: 0 !important; }
                        body, .container, div, p, span, td, th, h1, h2, h3, h4, h5, h6, input, textarea {
                            font-size: 5pt !important; line-height: 0.9 !important; margin: 0 !important; padding: 0 !important;
                        }
                        .container { width: 90% !important; max-width: 90% !important; padding: 1mm !important; margin: 0 auto !important; }
                        h1 { font-size: 10pt !important; margin-left: 70px !important; margin-bottom: 8px !important; margin-top: 8px !important; position: relative !important; }
                        .logo-container { position: absolute !important; top: -8px !important; left: 5px !important; z-index: 1000 !important; width: auto !important; height: auto !important; }
                        .logo-os10 { width: 85px !important; height: auto !important; display: block !important; }
                        div:empty, p:empty, span:empty { display: none !important; height: 0 !important; margin: 0 !important; padding: 0 !important; }
                        h2 { font-size: 7pt !important; page-break-before: always !important; break-before: page !important; page-break-after: avoid !important; break-after: avoid !important; margin-top: 6px !important; padding-top: 3px !important; }
                        h3 { font-size: 6pt !important; page-break-after: avoid !important; break-after: avoid !important; margin-top: 4px !important; margin-bottom: 1px !important; }
                        table { page-break-inside: auto !important; break-inside: auto !important; font-size: 5pt !important; margin: 0 !important; padding: 0 !important; }
                        th { font-size: 5.5pt !important; padding: 1px 3px !important; background-color: #003366 !important; color: white !important; }
                        td { font-size: 5pt !important; padding: 1px 3px !important; }
                        tr { page-break-inside: avoid !important; break-inside: avoid !important; margin: 0 !important; padding: 0 !important; }
                        tr:nth-child(even) { background-color: #f9f9f9 !important; }
                        .forced-page-break { page-break-before: always !important; break-before: page !important; height: 1px !important; visibility: hidden !important; margin: 0 !important; padding: 0 !important; }
                        .textarea-contenido-pdf { min-height: 20px !important; padding: 1px !important; font-family: inherit !important; font-size: 5pt !important; line-height: 0.9 !important; white-space: pre-wrap !important; word-break: break-word !important; margin: 0 !important; }
                        .info-section input[type="text"] { font-size: 5pt !important; padding: 0px !important; height: auto !important; }
                        .fecha-inputs input[type="text"] { font-size: 5pt !important; padding: 0px !important; width: 15px !important; text-align: center !important; }
                        .result { font-size: 6pt !important; padding: 1px !important; border: 1px solid transparent !important; }
                        .result.seguro { background-color: #dff0d8 !important; color: #3c763d !important; border-color: #d6e9c6 !important;}
                        .result.riesgo { background-color: #fcf8e3 !important; color: #8a6d3b !important; border-color: #faebcc !important;}
                        .result.inseguro { background-color: #f2dede !important; color: #a94442 !important; border-color: #ebccd1 !important;}
                        img:not(.logo-os10) { display: inline-block !important; max-width: 100% !important; }
                        .mobile-nav, .mobile-action-button, .botones, .no-print, .rich-text-toolbar, .datos-guardados-info, .mobile-control-panel { display: none !important; height: 0 !important; width: 0 !important; visibility: hidden !important; margin: 0 !important; padding: 0 !important;}
                    `;
                    clonedDoc.head.appendChild(style);

                    // Asegurar que las imágenes se muestran correctamente
                    Array.from(clonedDoc.querySelectorAll('img')).forEach(img => {
                        img.style.display = 'block'; // Asegurar block o inline-block según necesidad
                        img.style.maxWidth = '100%';
                    });
                    // Eliminar elementos vacíos en el clon que podrían causar páginas en blanco
                    const divs = Array.from(clonedDoc.querySelectorAll('div, p, span'));
                    divs.forEach(div => {
                        if (!div.textContent.trim() && !div.querySelector('img') && div.clientHeight < 10 && !div.classList.contains('textarea-contenido-pdf') && !div.classList.contains('logo-container') && !div.id?.includes('seccion')) { // Ampliado de (1).js
                            if (div.parentNode) {
                                div.parentNode.removeChild(div);
                            }
                        }
                    });

                     // Establecer explícitamente propiedades de salto de página (de 1.js)
                     const todosLosElementos = clonedDoc.querySelectorAll('*');
                     todosLosElementos.forEach(el => {
                         if (!el.tagName.toLowerCase().includes('h2') &&
                             !el.classList.contains('forced-page-break')) {
                             el.style.pageBreakBefore = 'auto';
                             el.style.pageBreakAfter = 'auto';
                             el.style.pageBreakInside = 'auto';
                             el.style.breakBefore = 'auto';
                             el.style.breakAfter = 'auto';
                             el.style.breakInside = 'auto';
                         }
                     });
                }
            },

            jsPDF: {
                unit: 'mm',
                format: 'legal',
                orientation: 'portrait',
                compress: true,
                precision: 16,
                putOnlyUsedFonts: true
            },

            // Configuración de saltos de página (de 1.js)
            pagebreak: {
                mode: ['avoid-all'],
                before: ['h2'], // Solo saltos explícitos en h2
                avoid: ['table', 'img', '.textarea-contenido-pdf', 'tr']
            },

            enableLinks: false,
            image: { type: 'jpeg', quality: 0.98 },
            margin: [5, 4, 5, 4], // Márgenes de (1).js (eran [15, 10, 15, 10])

            // (Eliminada la segunda opción html2canvas que estaba en el original)
        };

        // Generar el PDF con el manejo optimizado
        html2pdf()
            .from(contenido)
            .set(opciones)
            .toPdf()
            .get('pdf')
            .then(function(pdfObject) {
                 // Verificar si hay páginas en blanco y eliminarlas (de 1.js)
                 const totalPaginas = pdfObject.internal.getNumberOfPages();
                 console.log("PDF generado inicialmente con " + totalPaginas + " páginas");

                 for (let i = totalPaginas; i > 1; i--) {
                     pdfObject.setPage(i);
                     const pagina = pdfObject.getPageInfo(i);
                     // Criterio más estricto para página vacía
                     if (pagina && pagina.pageContext &&
                         (!pagina.pageContext.stream || pagina.pageContext.stream.length < 150) && // Umbral bajo
                         (!pagina.pageContext.annotations || pagina.pageContext.annotations.length === 0)) {
                         console.log("Eliminando página detectada como vacía: " + i);
                         pdfObject.deletePage(i);
                     }
                 }

                // Añadir metadatos y numeración
                agregarMetadatosYNumeracion(pdfObject);

                // Guardar el PDF
                pdfObject.save(opciones.filename);

                console.log("PDF generado exitosamente");
                actualizarIndicadorExito();

                // Restaurar el documento original después de un momento
                setTimeout(() => {
                    restaurarDocumentoOriginal(estadoOriginal);
                }, 1200);
            })
            .catch(function(error) {
                console.error("Error al generar el PDF:", error);
                ocultarIndicadorCarga();
                alert("Ocurrió un error al generar el PDF. Por favor, intente nuevamente.");
                restaurarDocumentoOriginal(estadoOriginal);
            });
    }

    // Función para agregar metadatos y numeración al PDF
    function agregarMetadatosYNumeracion(pdf) {
        try {
            // Añadir metadatos
            pdf.setProperties({
                title: 'Cuadro de Fiscalización de Seguridad Privada',
                subject: 'Informe de Fiscalización',
                author: document.querySelector('input[name="fiscalizador"]')?.value || 'Sistema de Fiscalización',
                keywords: 'seguridad, fiscalización, informe',
                creator: 'Sistema PDF Optimizado'
            });

            // Añadir numeración de páginas
            const totalPaginas = pdf.internal.getNumberOfPages(); // Recalcular por si se eliminaron páginas

            for (let i = 1; i <= totalPaginas; i++) {
                pdf.setPage(i);

                // Configuración de texto para el pie de página
                pdf.setFontSize(8);
                pdf.setTextColor(100, 100, 100);

                // Obtener dimensiones de la página
                const pageSize = pdf.internal.pageSize;
                const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

                // Texto de numeración
                const texto = `Página ${i} de ${totalPaginas}`;

                // Posicionar en la esquina inferior derecha
                const textWidth = pdf.getStringUnitWidth(texto) * 8 / pdf.internal.scaleFactor;
                const x = pageWidth - textWidth - 10; // Ajustado para margen derecho de 4mm (era 15)
                const y = pageHeight - 8; // Ajustado para margen inferior de 5mm (era 10)

                // Añadir el texto
                pdf.text(texto, x, y);
            }
        } catch (error) {
            console.warn("Error al añadir metadatos o numeración:", error);
        }
    }

    // Función para restaurar el documento a su estado original
    function restaurarDocumentoOriginal(estadoOriginal) {
        console.log("Restaurando documento a su estado original...");

        try {
            // 1. Remover elementos creados durante la preparación
            if (estadoOriginal.elementosCreados) {
                estadoOriginal.elementosCreados.forEach(el => {
                    if (el && el.parentNode) {
                        try { // Añadido try-catch
                           el.parentNode.removeChild(el);
                        } catch(e){ console.warn("Error removiendo elemento creado:", el, e); }
                    }
                });
            }

            // 2. Restaurar elementos ocultos
            if (estadoOriginal.ocultos) {
                estadoOriginal.ocultos.forEach(item => {
                     try { // Añadido try-catch
                        // Si el elemento fue removido completamente
                        if (item.parent && item.nextSibling) {
                            item.parent.insertBefore(item.element, item.nextSibling);
                        } else if (item.parent) {
                            item.parent.appendChild(item.element);
                        }

                        // Restaurar visibilidad
                        if (item.display !== undefined && item.element && item.element.style) { // Chequeo extra
                            item.element.style.display = item.display;
                        }
                     } catch(e){ console.warn("Error restaurando elemento oculto:", item.element, e); }
                });
            }

            // 3. Restaurar estilos originales
            if (estadoOriginal.estilos) {
                estadoOriginal.estilos.forEach((estilos, elemento) => {
                     try { // Añadido try-catch
                        if (elemento && elemento.style) { // Chequeo extra
                            Object.keys(estilos).forEach(prop => {
                                // Manejar caso especial para textareas
                                if (prop === 'value' && elemento.tagName === 'TEXTAREA') {
                                    elemento.value = estilos.value;
                                } else {
                                    elemento.style[prop] = estilos[prop] || '';
                                }
                            });
                        }
                     } catch(e){ console.warn("Error restaurando estilo:", elemento, e); }
                });
            }

            // 4. Restaurar estilos del body
            if (estadoOriginal.documentBody) {
                document.body.style.overflow = estadoOriginal.documentBody.overflow || '';
                document.body.style.height = estadoOriginal.documentBody.height || '';
            }

            // 5. Eliminar hoja de estilos temporal si aún existe
            const estilosTemporales = document.getElementById('estilos-temporales-pdf');
            if (estilosTemporales && estilosTemporales.parentNode) {
                 try { estilosTemporales.parentNode.removeChild(estilosTemporales); } catch(e){}
            }
            // Añadido: Eliminar también otros estilos temporales si existen
             const estiloTamanioMinimo = document.getElementById('estilo-tamanio-minimo');
             if (estiloTamanioMinimo && estiloTamanioMinimo.parentNode) {
                 try { estiloTamanioMinimo.parentNode.removeChild(estiloTamanioMinimo); } catch(e){}
             }
             const estiloNoPageBreak = document.getElementById('estilo-eliminar-page-breaks');
              if (estiloNoPageBreak && estiloNoPageBreak.parentNode) {
                 try { estiloNoPageBreak.parentNode.removeChild(estiloNoPageBreak); } catch(e){}
             }


            // 6. Ocultar indicador de carga si aún está visible
            ocultarIndicadorCarga();

        } catch (e) { // Catch general
             console.error("Error mayor durante la restauración:", e);
        } finally { // Asegurar que el indicador se oculte
             ocultarIndicadorCarga();
             console.log("Restauración del documento intentada.");
        }
    }


    // --- Funciones del Indicador de Carga (sin cambios) ---
    function mostrarIndicadorCarga() {
        const indicadorExistente = document.getElementById('indicador-pdf-carga');
        if (indicadorExistente) {
            document.body.removeChild(indicadorExistente);
        }
        const indicador = document.createElement('div');
        indicador.id = 'indicador-pdf-carga';
        Object.assign(indicador.style, { position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: '9999', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: "'Poppins', sans-serif", transition: 'opacity 0.3s ease' });
        const mensajeContainer = document.createElement('div');
        Object.assign(mensajeContainer.style, { backgroundColor: '#003366', padding: '25px 40px', borderRadius: '12px', boxShadow: '0 5px 25px rgba(0,0,0,0.5)', textAlign: 'center', maxWidth: '80%', color: 'white' });
        const titulo = document.createElement('h3');
        titulo.textContent = 'Generando PDF';
        Object.assign(titulo.style, { margin: '0 0 15px 0', fontSize: '1.5rem', fontWeight: '600', color: 'white' });
        const subtitulo = document.createElement('p');
        subtitulo.textContent = 'Por favor espere mientras se procesa el documento...';
        Object.assign(subtitulo.style, { margin: '0 0 20px 0', fontSize: '1rem', color: 'rgba(255,255,255,0.9)' });
        const barraContenedor = document.createElement('div');
        Object.assign(barraContenedor.style, { width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden', margin: '10px 0' });
        const barraProgreso = document.createElement('div');
        barraProgreso.id = 'barra-progreso-pdf';
        Object.assign(barraProgreso.style, { width: '0%', height: '100%', backgroundColor: '#4CAF50', borderRadius: '4px', transition: 'width 0.5s ease' });
        const textoEstado = document.createElement('p');
        textoEstado.id = 'texto-estado-pdf';
        textoEstado.textContent = 'Preparando documento...';
        Object.assign(textoEstado.style, { margin: '15px 0 0 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' });
        barraContenedor.appendChild(barraProgreso);
        mensajeContainer.appendChild(titulo);
        mensajeContainer.appendChild(subtitulo);
        mensajeContainer.appendChild(barraContenedor);
        mensajeContainer.appendChild(textoEstado);
        indicador.appendChild(mensajeContainer);
        document.body.appendChild(indicador);
        setTimeout(() => { barraProgreso.style.width = '30%'; textoEstado.textContent = 'Procesando contenido...'; }, 300);
        setTimeout(() => { barraProgreso.style.width = '60%'; textoEstado.textContent = 'Generando PDF...'; }, 1500);
        setTimeout(() => { barraProgreso.style.width = '80%'; textoEstado.textContent = 'Aplicando formato final...'; }, 3000);
    }
    function actualizarIndicadorExito() {
        const barraProgreso = document.getElementById('barra-progreso-pdf');
        const textoEstado = document.getElementById('texto-estado-pdf');
        if (barraProgreso && textoEstado) {
            barraProgreso.style.width = '100%';
            barraProgreso.style.backgroundColor = '#4CAF50';
            textoEstado.textContent = '¡PDF generado exitosamente!';
            const mensajeContainer = textoEstado.parentNode;
            if (mensajeContainer) {
                const titulo = mensajeContainer.querySelector('h3');
                if (titulo) { titulo.textContent = '¡Proceso Completado!'; }
            }
        }
        setTimeout(ocultarIndicadorCarga, 1500);
    }
    function ocultarIndicadorCarga() {
        const indicador = document.getElementById('indicador-pdf-carga');
        if (indicador) {
            indicador.style.opacity = '0';
            setTimeout(() => { if (indicador.parentNode) { indicador.parentNode.removeChild(indicador); } }, 300);
        }
    }
    // --- Fin Funciones del Indicador ---
}

// --- Función de instalación del botón (sin cambios) ---
function instalarBotonPDFCorregido() {
    console.log("Instalando botón de PDF corregido...");
    const botonesExistentes = Array.from(document.querySelectorAll('button')).filter(btn =>
        btn.textContent.includes('PDF') || btn.id?.includes('pdf') || btn.onclick?.toString().includes('PDF')
    );
    botonesExistentes.forEach(btn => {
        console.log(`Modificando botón de PDF existente: ${btn.textContent || btn.id}`);
        btn.onclick = generarPDFCorregido;
        if (btn.textContent.includes('PDF')) { btn.textContent = 'Descargar PDF Completo'; }
        Object.assign(btn.style, { backgroundColor: '#28a745', color: 'white', fontWeight: 'bold', padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.3s ease' });
        btn.onmouseover = function() { this.style.backgroundColor = '#218838'; this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 6px 8px rgba(0,0,0,0.15)'; };
        btn.onmouseout = function() { this.style.backgroundColor = '#28a745'; this.style.transform = 'translateY(0)'; this.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; };
    });
    if (botonesExistentes.length === 0) {
        const botonesDivs = document.querySelectorAll('.botones');
        botonesDivs.forEach(div => {
            const nuevoBoton = document.createElement('button');
            nuevoBoton.type = 'button';
            nuevoBoton.textContent = 'Descargar PDF Completo';
            nuevoBoton.onclick = generarPDFCorregido;
            nuevoBoton.className = 'no-print';
            Object.assign(nuevoBoton.style, { backgroundColor: '#28a745', color: 'white', fontWeight: 'bold', padding: '10px 20px', margin: '0 5px', borderRadius: '5px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.3s ease' });
            nuevoBoton.onmouseover = function() { this.style.backgroundColor = '#218838'; this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 6px 8px rgba(0,0,0,0.15)'; };
            nuevoBoton.onmouseout = function() { this.style.backgroundColor = '#28a745'; this.style.transform = 'translateY(0)'; this.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; };
            div.insertBefore(nuevoBoton, div.firstChild);
        });
    }
    if (typeof window.guardarPDF === 'function') { console.log("Sobrescribiendo función guardarPDF existente"); window.guardarPDF = generarPDFCorregido; }
    if (typeof window.descargarPDF === 'function') { console.log("Sobrescribiendo función descargarPDF existente"); window.descargarPDF = generarPDFCorregido; }
    if (typeof window.generarPDFMejorado === 'function') { console.log("Sobrescribiendo función generarPDFMejorado existente"); window.generarPDFMejorado = generarPDFCorregido; }
    console.log("Instalación de botón PDF corregido completada");
}
// --- Fin Función de instalación ---

// --- Ejecución de la instalación (sin cambios) ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { setTimeout(instalarBotonPDFCorregido, 1000); });
} else {
    setTimeout(instalarBotonPDFCorregido, 1000);
}
window.addEventListener('load', () => { setTimeout(instalarBotonPDFCorregido, 1500); });
window.generarPDFCorregido = generarPDFCorregido;
window.instalarBotonPDFCorregido = instalarBotonPDFCorregido;
instalarBotonPDFCorregido();
// --- Fin Ejecución ---

