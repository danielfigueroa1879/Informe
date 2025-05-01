// Crear estilos específicos para evitar páginas en blanco
        const estiloNoPageBreak = document.createElement('style');
        estiloNoPageBreak.id = 'estilo-eliminar-page-breaks';
        estiloNoPageBreak.textContent = `
            .container * {
                page-break-before: auto !important;
                page-break-after: auto !important;
                page-break-inside: auto !important;
                break-before: auto !important;
                break-after: auto !important;
                break-inside: auto !important;
            }
            
            /* Solo permitir saltos explícitos */
            h2 {
                page-break-before: always !important;
                break-before: page !important;
            }
            
            /* Evitar específicamente elementos que crean páginas en blanco */
            div:empty, p:empty, span:empty, br {
                display: none !important;
                height: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
            }
        `;
        document.head.appendChild(estiloNoPageBreak);
        estadoOriginal.elementosCreados.push(estiloNoPageBreak);        // Asegurar que el logo esté correctamente posicionado
        const logoContainer = container.querySelector('.logo-container');
        if (logoContainer) {
            // Guardar estado original
            estadoOriginal.estilos.set(logoContainer, {
                position: logoContainer.style.position,
                top: logoContainer.style.top,
                left: logoContainer.style.left,
                zIndex: logoContainer.style.zIndex
            });
            
            // Forzar posición correcta del logo
            logoContainer.style.position = 'absolute';
            logoContainer.style.top = '-8px';  // Movido más arriba
            logoContainer.style.left = '10px';  // Más a la izquierda
            logoContainer.style.zIndex = '1000';
            
            // Asegurarse que la imagen del logo sea visible
            const logoImage = logoContainer.querySelector('.logo-os10');
            if (logoImage) {
                estadoOriginal.estilos.set(logoImage, {
                    width: logoImage.style.width,
                    display: logoImage.style.display
                });
                
                logoImage.style.width = '85px';
                logoImage.style.display = 'block';
            }
        }/**
 * pdf-optimizado.js - Versión con logo correctamente posicionado
 * Solución optimizada para la generación de PDF sin páginas en blanco intermedias,
 * con logo correctamente posicionado y ajuste de contenido completo
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
        }, 500); // Retraso para que los cambios de estilo se apliquen
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
        
        // Eliminar agresivamente cualquier elemento que pueda causar páginas en blanco
        const eliminarElementosVacios = () => {
            // Eliminar elementos vacíos específicos que puedan causar páginas en blanco
            const elementosAEliminar = [
                'div:empty', 'p:empty', 'span:empty', 'br', 
                'div[style*="page-break"]', 'p[style*="page-break"]', 
                'div[style*="margin-top"]', 'div[style*="margin-bottom"]'
            ].join(',');
            
            const elementosVacios = Array.from(container.querySelectorAll(elementosAEliminar));
            elementosVacios.forEach(el => {
                if ((!el.textContent || !el.textContent.trim()) && !el.querySelector('img') && 
                    !el.classList.contains('forced-page-break') && 
                    !el.id?.includes('seccion') && el.clientHeight < 10) {
                    
                    if (el.parentNode) {
                        estadoOriginal.ocultos.push({
                            element: el,
                            display: el.style.display,
                            parent: el.parentNode,
                            nextSibling: el.nextSibling
                        });
                        el.parentNode.removeChild(el);
                    }
                }
            });
        };
        
        // Ejecutar limpieza de elementos vacíos
        eliminarElementosVacios();
        
        // Asegurar que el logo esté correctamente posicionado
        const logoContainer = container.querySelector('.logo-container');
        if (logoContainer) {
            // Guardar estado original
            estadoOriginal.estilos.set(logoContainer, {
                position: logoContainer.style.position,
                top: logoContainer.style.top,
                left: logoContainer.style.left,
                zIndex: logoContainer.style.zIndex
            });
            
            // Forzar posición correcta del logo - más arriba
            logoContainer.style.position = 'absolute';
            logoContainer.style.top = '-8px';  // Movido más arriba
            logoContainer.style.left = '10px';  // Ligeramente más a la izquierda
            logoContainer.style.zIndex = '1000';
            
            // Asegurarse que la imagen del logo sea visible
            const logoImage = logoContainer.querySelector('.logo-os10');
            if (logoImage) {
                estadoOriginal.estilos.set(logoImage, {
                    width: logoImage.style.width,
                    display: logoImage.style.display
                });
                
                                            logoImage.style.width = '60px'; // Extremadamente reducido
                logoImage.style.display = 'block';
            }
        }
        
        // Asegurar que el título esté correctamente posicionado
        const titulo = container.querySelector('h1');
        if (titulo) {
            estadoOriginal.estilos.set(titulo, {
                position: titulo.style.position,
                marginLeft: titulo.style.marginLeft,
                marginTop: titulo.style.marginTop,
                fontSize: titulo.style.fontSize
            });
            
            titulo.style.position = 'relative';
            titulo.style.marginLeft = '90px';  // Reducido para mover a la izquierda
            titulo.style.marginTop = '15px';
            titulo.style.fontSize = '18pt';
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
            estadoOriginal.ocultos.push({
                element: el,
                display: el.style.display
            });
            el.style.display = 'none';
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
        
        // 4. Mejorar el manejo de las textareas (observaciones)
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
                minHeight: '50px',
                width: '100%',
                fontFamily: textarea.style.fontFamily || 'inherit',
                fontSize: '9pt', // Más reducido
                lineHeight: '1.2', // Más compacto
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
        
        // 5. Aplicar estilos óptimos para la impresión
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
                marginTop: '15px', // Reducido
                paddingTop: '8px', // Reducido
                fontSize: '14pt' // Tamaño reducido
            }},
            { selector: 'h3', estilos: {
                fontSize: '12pt', // Tamaño reducido
                marginTop: '12px', // Reducido
                marginBottom: '5px' // Reducido
            }},
            { selector: 'table', estilos: {
                pageBreakInside: 'auto'
            }},
            { selector: 'tr', estilos: {
                pageBreakInside: 'avoid'
            }},
            { selector: '#plan-accion-editor', estilos: {
                height: 'auto',
                maxHeight: 'none',
                overflow: 'visible',
                fontSize: '10pt' // Tamaño reducido
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
        
        // 6. Añadir una hoja de estilos temporal con reglas específicas para PDF
        const estilosTemporales = document.createElement('style');
        estilosTemporales.id = 'estilos-temporales-pdf';
        estilosTemporales.textContent = `
            @page {
                size: legal portrait;
                margin: 8mm 5mm; /* Márgenes mínimos absolutos */
            }
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .container {
                font-size: 10pt !important;
                width: 100% !important;
                max-width: 100% !important;
                padding: 5mm !important;
                margin: 0 !important;
            }
            h1 {
                font-size: 18pt !important;
                margin-bottom: 20px !important;
                margin-left: 90px !important;  /* Reducido para mover a la izquierda */
                margin-top: 15px !important;
                position: relative !important;
            }
            
            /* Logo posicionamiento específico */
            .logo-container {
                position: absolute !important;
                top: -8px !important;  /* Más arriba */
                left: 10px !important;  /* Más a la izquierda */
                z-index: 1000 !important;
                width: auto !important;
                height: auto !important;
            }
            .logo-os10 {
                width: 100px !important;
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
            
            h2 {
                font-size: 7pt !important; /* Extremadamente reducido */
                page-break-before: always !important;
                break-before: page !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
                margin-top: 6px !important; /* Reducido más */
                padding-top: 3px !important; /* Reducido más */
            }
            h3 {
                font-size: 6pt !important; /* Extremadamente reducido */
                page-break-after: avoid !important;
                break-after: avoid !important;
                margin-top: 4px !important; /* Reducido más */
                margin-bottom: 1px !important; /* Reducido más */
            }
            table {
                page-break-inside: auto !important;
                break-inside: auto !important;
                font-size: 5pt !important; /* Extremadamente reducido */
            }
            th {
                font-size: 5.5pt !important; /* Extremadamente reducido */
            }
            td {
                font-size: 5pt !important; /* Extremadamente reducido */
                padding: 1px 3px !important; /* Minimizado */
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
            
            /* Mejorar visualización de observaciones */
            .textarea-contenido-pdf {
                min-height: 20px !important; /* Extremadamente reducido */
                padding: 1px !important; /* Minimizado */
                font-family: inherit !important;
                font-size: 5pt !important; /* Extremadamente reducido */
                line-height: 0.9 !important; /* Extremadamente reducido */
                white-space: pre-wrap !important;
                word-break: break-word !important;
                margin-bottom: 1px !important; /* Minimizado */
            }
            
            /* Reducir específicamente el tamaño del texto en los campos de entrada */
            .info-section input[type="text"] {
                font-size: 5pt !important; /* Extremadamente reducido */
                padding: 1px !important;
                height: auto !important;
            }
            
            /* Ajustar específicamente los inputs de fecha */
            .fecha-inputs input[type="text"] {
                font-size: 5pt !important; /* Extremadamente reducido */
                padding: 0px !important; /* Minimizado */
                width: 15px !important; /* Extremadamente reducido */
                text-align: center !important;
            }
            
            /* Estilos específicos para que los gráficos y colores se muestren correctamente */
            .header-row, th {
                background-color: #003366 !important;
                color: white !important;
            }
            
            tr:nth-child(even) {
                background-color: #f9f9f9 !important;
            }
            
            .info-section, .summary {
                background-color: #f9f9f9 !important;
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
            
            /* Ocultar navegación móvil y otros elementos no deseados */
            .mobile-nav, .mobile-action-button, .mobile-control-panel, .botones, .no-print {
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
        
        // 7. Eliminar elementos vacíos que puedan causar páginas en blanco
        const elementosVacios = Array.from(container.querySelectorAll('div, p, span'))
            .filter(el => !el.textContent.trim() && !el.querySelector('img') && el.clientHeight < 20 && !el.id);
            
        elementosVacios.forEach(el => {
            // Solo eliminar si no tienen hijos o solo tienen espacios en blanco
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
        
        // Configuración optimizada para tamaño legal/oficio
        const opciones = {
            filename: `Fiscalizacion_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
            
            // Modo de optimización: 1 = velocidad, 2 = precisión
            html2canvas: {
                scale: 0.85, // Reducido aún más para asegurar que todo el contenido quepa
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: 0,
                windowWidth: document.documentElement.offsetWidth,
                windowHeight: document.documentElement.offsetHeight,
                logging: false,
                backgroundColor: '#FFFFFF',
                imageTimeout: 30000, // Tiempo extendido para procesar gráficos
                removeContainer: true,
                foreignObjectRendering: false, // Deshabilitar para mayor compatibilidad
                onclone: function(clonedDoc) {
                    // Eliminar AGRESIVAMENTE cualquier página en blanco
                    const elementosAEliminar = [
                        'div:empty', 'p:empty', 'span:empty', 'br', 
                        'div[style*="page-break"]', 'p[style*="page-break"]',
                        'div[style*="margin-top"]', 'div[style*="margin-bottom"]'
                    ].join(',');
                    
                    const paginasEnBlanco = clonedDoc.querySelectorAll(elementosAEliminar);
                    paginasEnBlanco.forEach(el => {
                        // Solo eliminar si realmente es un elemento vacío
                        if ((!el.textContent || !el.textContent.trim()) && 
                            !el.querySelector('img') && 
                            !el.classList.contains('forced-page-break') && 
                            !el.id?.includes('seccion') && 
                            el.clientHeight < 10) {
                            
                            if (el.parentNode) {
                                el.parentNode.removeChild(el);
                            }
                        }
                    });
                    
                    // Establecer explícitamente propiedades de salto de página
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
                    
                    // Solo permitir saltos explícitos
                    const titulos = clonedDoc.querySelectorAll('h2');
                    titulos.forEach(titulo => {
                        titulo.style.pageBreakBefore = 'always';
                        titulo.style.breakBefore = 'page';
                    });
                    
                    // Asegurar logo en posición correcta
                    const logoContainer = clonedDoc.querySelector('.logo-container');
                    if (logoContainer) {
                        logoContainer.style.position = 'absolute';
                        logoContainer.style.top = '-8px';  // Movido más arriba
                        logoContainer.style.left = '10px';  // Más a la izquierda
                        logoContainer.style.zIndex = '1000';
                        
                        const logoImage = logoContainer.querySelector('.logo-os10');
                        if (logoImage) {
                            logoImage.style.width = '85px'; // Tamaño reducido
                            logoImage.style.height = 'auto';
                            logoImage.style.display = 'block';
                        }
                    }
                    
                    // Ajustar título
                    const titulo = clonedDoc.querySelector('h1');
                    if (titulo) {
                        titulo.style.position = 'relative';
                        titulo.style.marginLeft = '70px'; // Reducido más
                        titulo.style.marginTop = '15px';
                        titulo.style.fontSize = '10pt'; // Extremadamente reducido
                    }
                    
                    // Forzar la visibilidad de los fondos y gráficos
                    const style = clonedDoc.createElement('style');
                    style.innerHTML = `
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        
                        body, html {
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        /* Eliminar elementos vacíos que pueden causar páginas en blanco */
                        div:empty, p:empty, span:empty {
                            display: none !important;
                            height: 0 !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        /* Reducir tamaños de fuente */
                        body {
                            font-size: 10pt !important;
                        }
                        
                        h1 {
                            font-size: 18pt !important;
                            margin-left: 90px !important;  /* Reducido para mover a la izquierda */
                        }
                        
                        h2 {
                            font-size: 14pt !important;
                        }
                        
                        h3 {
                            font-size: 12pt !important;
                        }
                        
                        p, span, div, td {
                            font-size: 10pt !important;
                            line-height: 1.3 !important;
                        }
                        
                        th {
                            font-size: 9.5pt !important;
                        }
                        
                        /* Controlar posición del logo */
                        .logo-container {
                            position: absolute !important;
                            top: -8px !important;  /* Más arriba */
                            left: 10px !important;  /* Más a la izquierda */
                            z-index: 1000 !important;
                        }
                        
                        .logo-os10 {
                            width: 100px !important;
                            height: auto !important;
                        }
                        
                        /* Ocultar elementos no deseados */
                        .mobile-nav, .mobile-action-button, .botones, .no-print {
                            display: none !important;
                            height: 0 !important;
                            width: 0 !important;
                            visibility: hidden !important;
                        }
                    `;
                    clonedDoc.head.appendChild(style);
                    
                    // Añadir estilos específicos para entradas de texto e inputs
                    const inputsStyle = clonedDoc.createElement('style');
                    inputsStyle.innerHTML = `
                        /* Reducir específicamente el tamaño del texto en los campos de entrada */
                        .info-section input[type="text"] {
                            font-size: 5pt !important; /* Extremadamente reducido */
                            padding: 0px !important; /* Minimizado */
                            height: auto !important;
                        }
                        
                        /* Ajustar específicamente los inputs de fecha */
                        .fecha-inputs input[type="text"] {
                            font-size: 5pt !important; /* Extremadamente reducido */
                            padding: 0px !important; /* Minimizado */
                            width: 15px !important; /* Extremadamente reducido */
                            text-align: center !important;
                        }
                        
                        /* Ajustar contenedor para que todo quepa */
                        .container {
                            width: 90% !important; /* Más estrecho */
                            max-width: 90% !important;
                            padding: 1mm !important; /* Minimizado */
                            margin: 0 auto !important;
                        }
                        
                        /* Minimizar espacio para máxima compactación */
                        table, tr, td, th, div, p, span {
                            margin: 0 !important;
                            padding-top: 1px !important;
                            padding-bottom: 1px !important;
                        }
                        
                        /* Ajustar contenedor para que todo quepa */
                        .container {
                            width: 94% !important;
                            max-width: 94% !important;
                            padding: 2mm !important;
                            margin: 0 auto !important;
                        }
                    `;
                    clonedDoc.head.appendChild(inputsStyle);
                    
                    // Asegurar que las imágenes se muestran correctamente
                    Array.from(clonedDoc.querySelectorAll('img')).forEach(img => {
                        img.style.display = 'block';
                        img.style.maxWidth = '100%';
                    });
                    // Eliminar elementos vacíos en el clon que podrían causar páginas en blanco
                    const divs = Array.from(clonedDoc.querySelectorAll('div, p, span'));
                    divs.forEach(div => {
                        if (!div.textContent.trim() && !div.querySelector('img') && div.clientHeight < 20 && !div.classList.contains('textarea-contenido-pdf')) {
                            if (div.parentNode) {
                                div.parentNode.removeChild(div);
                            }
                        }
                    });
            
            jsPDF: {
                unit: 'mm',
                format: 'legal', // Formato oficio/legal
                orientation: 'portrait',
                compress: true,
                precision: 16,
                putOnlyUsedFonts: true
            },
            
            // Configuración de saltos de página - Modificada para evitar páginas en blanco
            pagebreak: {
                mode: ['avoid-all'], // Simplificar el algoritmo
                before: ['h2'], // Solo saltos explícitos en h2
                avoid: ['table', 'img', '.textarea-contenido-pdf', 'tr']
            },
            
            // Usar el nuevo modo para división de contenido
            enableLinks: false,
            image: { type: 'jpeg', quality: 0.98 }, // Mayor calidad para gráficos
            margin: [5, 4, 5, 4], // top, right, bottom, left (mínimos absolutos)
        };
        
        // Generar el PDF con el manejo optimizado
        html2pdf()
            .from(contenido)
            .set(opciones)
            .toPdf()
            .get('pdf')
            .then(function(pdfObject) {
                // Verificar si hay páginas en blanco y eliminarlas
                const totalPaginas = pdfObject.internal.getNumberOfPages();
                console.log("PDF generado con " + totalPaginas + " páginas");
                
                // Intentar detectar y eliminar páginas en blanco
                for (let i = totalPaginas; i > 1; i--) {
                    pdfObject.setPage(i);
                    
                    // Si la página parece vacía, eliminarla
                    // Nota: Este método es aproximado y puede no funcionar en todos los casos
                    const pagina = pdfObject.getPageInfo(i);
                    if (pagina && pagina.pageContext && 
                        (!pagina.pageContext.stream || pagina.pageContext.stream.length < 100)) {
                        console.log("Eliminando página en blanco: " + i);
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
            const totalPaginas = pdf.internal.getNumberOfPages();
            
            for (let i = 1; i <= totalPaginas; i++) {
                pdf.setPage(i);
                
                // Configuración de texto para el pie de página
                pdf.setFontSize(8); // Tamaño reducido
                pdf.setTextColor(100, 100, 100);
                
                // Obtener dimensiones de la página
                const pageSize = pdf.internal.pageSize;
                const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                
                // Texto de numeración
                const texto = `Página ${i} de ${totalPaginas}`;
                
                // Posicionar en la esquina inferior derecha
                const textWidth = pdf.getStringUnitWidth(texto) * 8 / pdf.internal.scaleFactor;
                const x = pageWidth - textWidth - 15;
                const y = pageHeight - 10;
                
                // Añadir el texto
                pdf.text(texto, x, y);
            }
        } catch (error) {
            console.warn("Error al añadir metadatos o numeración:", error);
        }
    }
    
    function restaurarDocumentoOriginal(estadoOriginal) {
        console.log("Restaurando documento a su estado original...");
        
        try {
            // 1. Remover elementos creados durante la preparación
            if (estadoOriginal.elementosCreados) {
                estadoOriginal.elementosCreados.forEach(el => {
                    if (el && el.parentNode) {
                        el.parentNode.removeChild(el);
                    }
                });
            }
            
            // 2. Restaurar elementos ocultos
            if (estadoOriginal.ocultos) {
                estadoOriginal.ocultos.forEach(item => {
                    // Si el elemento fue removido completamente
                    if (item.parent && item.nextSibling) {
                        try {
                            item.parent.insertBefore(item.element, item.nextSibling);
                        } catch (e) {
                            console.warn("Error al restaurar elemento:", e);
                            try {
                                item.parent.appendChild(item.element);
                            } catch (e2) {
                                console.warn("No se pudo reintegrar elemento:", e2);
                            }
                        }
                    } else if (item.parent) {
                        try {
                            item.parent.appendChild(item.element);
                        } catch (e) {
                            console.warn("Error al restaurar elemento:", e);
                        }
                    }
                    
                    // Restaurar visibilidad
                    if (item.display !== undefined) {
                        try {
                            item.element.style.display = item.display;
                        } catch (e) {
                            console.warn("Error al restaurar estilo:", e);
                        }
                    }
                });
            }
            
            // 3. Restaurar estilos originales
            if (estadoOriginal.estilos) {
                estadoOriginal.estilos.forEach((estilos, elemento) => {
                    try {
                        Object.keys(estilos).forEach(prop => {
                            // Manejar caso especial para textareas
                            if (prop === 'value' && elemento.tagName === 'TEXTAREA') {
                                elemento.value = estilos.value;
                            } else {
                                elemento.style[prop] = estilos[prop] || '';
                            }
                        });
                    } catch (e) {
                        console.warn("Error al restaurar estilos:", e);
                    }
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
                estilosTemporales.parentNode.removeChild(estilosTemporales);
            }
            
            // 6. Aplicar estilos de limpieza para eliminar cualquier mancha o residuo
            const estilosLimpieza = document.createElement('style');
            estilosLimpieza.id = 'estilos-limpieza-temporal';
            estilosLimpieza.textContent = `
                /* Limpiar cualquier residuo visual */
                body, .container, table, tr, td, div {
                    background-repeat: no-repeat !important;
                    background-image: none !important;
                }
                
                /* Asegurar que no queden estilos extraños */
                .container * {
                    box-shadow: none !important;
                    text-shadow: none !important;
                }
                
                /* Reset de colores y fondos */
                body {
                    background-color: #f5f5f5 !important;
                }
                
                .container {
                    background-color: #fff !important;
                }
            `;
            document.head.appendChild(estilosLimpieza);
            
            // Eliminar estilos de limpieza después de un momento
            setTimeout(() => {
                if (estilosLimpieza.parentNode) {
                    estilosLimpieza.parentNode.removeChild(estilosLimpieza);
                }
            }, 500);
        } catch (e) {
            console.error("Error en restauración del documento:", e);
        }
        
        // 7. Ocultar indicador de carga si aún está visible
        ocultarIndicadorCarga();
        
        console.log("Documento restaurado correctamente");
    }
    
    // Función para mostrar el indicador de carga con un diseño mejorado
    function mostrarIndicadorCarga() {
        // Eliminar indicador existente si lo hay
        const indicadorExistente = document.getElementById('indicador-pdf-carga');
        if (indicadorExistente) {
            document.body.removeChild(indicadorExistente);
        }
        
        // Crear nuevo indicador
        const indicador = document.createElement('div');
        indicador.id = 'indicador-pdf-carga';
        
        // Estilos para el contenedor principal
        Object.assign(indicador.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: '9999',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: "'Poppins', sans-serif",
            transition: 'opacity 0.3s ease'
        });
        
        // Crear un contenedor para el mensaje
        const mensajeContainer = document.createElement('div');
        Object.assign(mensajeContainer.style, {
            backgroundColor: '#003366',
            padding: '25px 40px',
            borderRadius: '12px',
            boxShadow: '0 5px 25px rgba(0,0,0,0.5)',
            textAlign: 'center',
            maxWidth: '80%',
            color: 'white'
        });
        
        // Añadir título
        const titulo = document.createElement('h3');
        titulo.textContent = 'Generando PDF';
        Object.assign(titulo.style, {
            margin: '0 0 15px 0',
            fontSize: '1.5rem',
            fontWeight: '600',
            color: 'white'
        });
        
        // Añadir subtítulo con mensaje explicativo
        const subtitulo = document.createElement('p');
        subtitulo.textContent = 'Por favor espere mientras se procesa el documento...';
        Object.assign(subtitulo.style, {
            margin: '0 0 20px 0',
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.9)'
        });
        
        // Crear una barra de progreso animada
        const barraContenedor = document.createElement('div');
        Object.assign(barraContenedor.style, {
            width: '100%',
            height: '8px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
            overflow: 'hidden',
            margin: '10px 0'
        });
        
        const barraProgreso = document.createElement('div');
        barraProgreso.id = 'barra-progreso-pdf';
        Object.assign(barraProgreso.style, {
            width: '0%',
            height: '100%',
            backgroundColor: '#4CAF50',
            borderRadius: '4px',
            transition: 'width 0.5s ease'
        });
        
        // Añadir texto de estado que cambiará durante el proceso
        const textoEstado = document.createElement('p');
        textoEstado.id = 'texto-estado-pdf';
        textoEstado.textContent = 'Preparando documento...';
        Object.assign(textoEstado.style, {
            margin: '15px 0 0 0',
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.8)',
            fontStyle: 'italic'
        });
        
        // Ensamblar todos los elementos
        barraContenedor.appendChild(barraProgreso);
        mensajeContainer.appendChild(titulo);
        mensajeContainer.appendChild(subtitulo);
        mensajeContainer.appendChild(barraContenedor);
        mensajeContainer.appendChild(textoEstado);
        indicador.appendChild(mensajeContainer);
        
        // Añadir al body
        document.body.appendChild(indicador);
        
        // Animar la barra de progreso
        setTimeout(() => {
            barraProgreso.style.width = '30%';
            textoEstado.textContent = 'Procesando contenido...';
        }, 300);
        
        setTimeout(() => {
            barraProgreso.style.width = '60%';
            textoEstado.textContent = 'Generando PDF...';
        }, 1500);
        
        setTimeout(() => {
            barraProgreso.style.width = '80%';
            textoEstado.textContent = 'Aplicando formato final...';
        }, 3000);
    }
    
    // Función para actualizar el indicador con mensaje de éxito
    function actualizarIndicadorExito() {
        const barraProgreso = document.getElementById('barra-progreso-pdf');
        const textoEstado = document.getElementById('texto-estado-pdf');
        
        if (barraProgreso && textoEstado) {
            barraProgreso.style.width = '100%';
            barraProgreso.style.backgroundColor = '#4CAF50';
            textoEstado.textContent = '¡PDF generado exitosamente!';
            
            // Cambiar estilo para indicar éxito
            const mensajeContainer = textoEstado.parentNode;
            if (mensajeContainer) {
                const titulo = mensajeContainer.querySelector('h3');
                if (titulo) {
                    titulo.textContent = '¡Proceso Completado!';
                }
            }
        }
        
        // Ocultar después de un tiempo
        setTimeout(ocultarIndicadorCarga, 1500);
    }
    
    // Función para ocultar el indicador de carga
    function ocultarIndicadorCarga() {
        const indicador = document.getElementById('indicador-pdf-carga');
        if (indicador) {
            // Transición suave de salida
            indicador.style.opacity = '0';
            
            // Remover después de la transición
            setTimeout(() => {
                if (indicador.parentNode) {
                    indicador.parentNode.removeChild(indicador);
                }
            }, 300);
        }
    }
}

// Función para reemplazar los botones existentes con la nueva funcionalidad
function instalarBotonPDFCorregido() {
    console.log("Instalando botón de PDF corregido...");
    
    // Buscar todos los botones relacionados con PDF
    const botonesExistentes = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.includes('PDF') || 
        btn.id?.includes('pdf') ||
        btn.onclick?.toString().includes('PDF')
    );
    
    // Modificar cada botón encontrado
    botonesExistentes.forEach(btn => {
        console.log(`Modificando botón de PDF existente: ${btn.textContent || btn.id}`);
        
        // Cambiar el evento onclick
        btn.onclick = generarPDFCorregido;
        
        // Actualizar texto y estilos para distinguirlo
        if (btn.textContent.includes('PDF')) {
            btn.textContent = 'Descargar PDF Completo';
        }
        
        // Estilos destacados
        Object.assign(btn.style, {
            backgroundColor: '#28a745',
            color: 'white',
            fontWeight: 'bold',
            padding: '10px 20px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
        });
        
        // Añadir evento hover
        btn.onmouseover = function() {
            this.style.backgroundColor = '#218838';
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 8px rgba(0,0,0,0.15)';
        };
        
        btn.onmouseout = function() {
            this.style.backgroundColor = '#28a745';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        };
    });
    
    // Si no se encontró ningún botón, crear uno nuevo
    if (botonesExistentes.length === 0) {
        const botonesDivs = document.querySelectorAll('.botones');
        botonesDivs.forEach(div => {
            const nuevoBoton = document.createElement('button');
            nuevoBoton.type = 'button';
            nuevoBoton.textContent = 'Descargar PDF Completo';
            nuevoBoton.onclick = generarPDFCorregido;
            nuevoBoton.className = 'no-print';
            
            // Aplicar estilos
            Object.assign(nuevoBoton.style, {
                backgroundColor: '#28a745',
                color: 'white',
                fontWeight: 'bold',
                padding: '10px 20px',
                margin: '0 5px',
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease'
            });
            
            // Añadir eventos hover
            nuevoBoton.onmouseover = function() {
                this.style.backgroundColor = '#218838';
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 6px 8px rgba(0,0,0,0.15)';
            };
            
            nuevoBoton.onmouseout = function() {
                this.style.backgroundColor = '#28a745';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            };
            
            // Insertar al inicio
            div.insertBefore(nuevoBoton, div.firstChild);
        });
    }
    
    // Sobrescribir funciones existentes para asegurar que siempre se use la nueva implementación
    if (typeof window.guardarPDF === 'function') {
        console.log("Sobrescribiendo función guardarPDF existente");
        window.guardarPDF = generarPDFCorregido;
    }
    
    if (typeof window.descargarPDF === 'function') {
        console.log("Sobrescribiendo función descargarPDF existente");
        window.descargarPDF = generarPDFCorregido;
    }
    
    if (typeof window.generarPDFMejorado === 'function') {
        console.log("Sobrescribiendo función generarPDFMejorado existente");
        window.generarPDFMejorado = generarPDFCorregido;
    }
    
    console.log("Instalación de botón PDF corregido completada");
}

// Iniciar cuando el DOM esté completamente cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Esperar un segundo para asegurar que todos los scripts se han cargado
        setTimeout(instalarBotonPDFCorregido, 1000);
    });
} else {
    // Si el DOM ya está cargado, ejecutar directamente con un pequeño retraso
    setTimeout(instalarBotonPDFCorregido, 1000);
}

// También asegurar que se ejecute cuando la ventana esté completamente cargada
window.addEventListener('load', () => {
    setTimeout(instalarBotonPDFCorregido, 1500);
});

// Exponer funciones globalmente
window.generarPDFCorregido = generarPDFCorregido;
window.instalarBotonPDFCorregido = instalarBotonPDFCorregido;

// Ejecutar inmediatamente para instalar el botón sin esperar eventos
instalarBotonPDFCorregido();
