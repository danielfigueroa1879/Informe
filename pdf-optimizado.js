**
 * pdf-optimizado.js - Versión con letras más grandes
 * Solución optimizada para la generación de PDF con texto más legible
 */
function generarPDFCorregido() {
    mostrarIndicadorCarga();
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
    function prepararYGenerarPDF() {
        console.log("Iniciando generación de PDF optimizada...");
        const container = document.querySelector('.container');
        if (!container) {
            ocultarIndicadorCarga();
            alert('Error: No se pudo encontrar el contenedor principal del documento.');
            return;
        }
        const estadoOriginal = prepararContenidoParaPDF(container);
        setTimeout(() => {
            generarPDFDesdeContenido(container, estadoOriginal);
        }, 500);
    }
    function prepararContenidoParaPDF(container) {
        const estadoOriginal = {
            estilos: new Map(),
            ocultos: [],
            documentBody: {
                overflow: document.body.style.overflow,
                height: document.body.style.height
            },
            elementosCreados: []
        };
        const elementosTexto = container.querySelectorAll('*');
        elementosTexto.forEach(el => {
            if (el.tagName) {
                if (!estadoOriginal.estilos.has(el)) {
                     estadoOriginal.estilos.set(el, {
                        fontSize: el.style.fontSize,
                        lineHeight: el.style.lineHeight,
                        padding: el.style.padding,
                        margin: el.style.margin
                    });
                }
                const tagName = el.tagName.toLowerCase();
                 if (tagName === 'h1') {
                    el.style.fontSize = '20pt';
                    el.style.marginLeft = '70px';
                    el.style.marginBottom = '16px';
                    el.style.marginTop = '16px';
                } else if (tagName === 'h2') {
                    el.style.fontSize = '14pt';
                    el.style.marginTop = '12px';
                    el.style.paddingTop = '6px';
                } else if (tagName === 'h3') {
                    el.style.fontSize = '12pt';
                    el.style.marginTop = '8px';
                    el.style.marginBottom = '2px';
                } else if (tagName === 'th') {
                    el.style.fontSize = '11pt';
                    el.style.padding = '2px 6px';
                } else if (tagName === 'td') {
                    el.style.fontSize = '10pt';
                    el.style.padding = '2px 6px';
                } else if (tagName === 'input' || tagName === 'textarea') {
                    el.style.fontSize = '10pt';
                    el.style.padding = '0px';   
                    if (el.parentNode && el.parentNode.classList.contains('fecha-inputs')) {
                        el.style.width = '30px';
                    }
                    if(tagName === 'textarea'){ 
                         el.style.minHeight = '40px';
                         el.style.lineHeight = '1.8';
                    }
                } else if (tagName === 'p' || tagName === 'span' || tagName === 'div') {
                    el.style.fontSize = '10pt';
                    el.style.lineHeight = '1.8';
                    el.style.margin = '0';     
                    el.style.padding = '0';    
                }
            }
        });
        const logoContainer = container.querySelector('.logo-container');
        if (logoContainer) {
             if (!estadoOriginal.estilos.has(logoContainer)) {
                estadoOriginal.estilos.set(logoContainer, {
                    position: logoContainer.style.position,
                    top: logoContainer.style.top,
                    left: logoContainer.style.left,
                    zIndex: logoContainer.style.zIndex
                });
             }
            logoContainer.style.position = 'absolute';
            logoContainer.style.top = '-16px';
            logoContainer.style.left = '10px';
            logoContainer.style.zIndex = '1000';
            const logoImage = logoContainer.querySelector('.logo-os10');
            if (logoImage) {
                 if (!estadoOriginal.estilos.has(logoImage)) {
                    estadoOriginal.estilos.set(logoImage, {
                        width: logoImage.style.width,
                        display: logoImage.style.display,
                        height: logoImage.style.height
                    });
                 }
                logoImage.style.width = '170px';
                logoImage.style.height = 'auto';
                logoImage.style.display = 'block';
            }
        }
        const titulo = container.querySelector('h1');
        if (titulo) {
             if (!estadoOriginal.estilos.has(titulo)) {
                estadoOriginal.estilos.set(titulo, {
                    position: titulo.style.position,
                    marginLeft: titulo.style.marginLeft,
                    marginTop: titulo.style.marginTop,
                    fontSize: titulo.style.fontSize,
                    marginBottom: titulo.style.marginBottom
                });
             }
            titulo.style.position = 'relative';
            titulo.style.marginLeft = '70px';
            titulo.style.marginTop = '16px';
            titulo.style.marginBottom = '16px';
            titulo.style.fontSize = '20pt';
        }
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
        const elementosOcultar = container.querySelectorAll('.botones, .no-print, .rich-text-toolbar, .datos-guardados-info, .mobile-nav, .mobile-action-button');
        elementosOcultar.forEach(el => {
             if(!el.classList.contains('logo-container') && !el.classList.contains('logo-os10') && el.tagName !== 'H1') {
                estadoOriginal.ocultos.push({
                    element: el,
                    display: el.style.display
                });
                el.style.display = 'none';
             }
        });
        const seccionResumen = container.querySelector('#seccion-resumen');
        const seccionFotos = container.querySelector('#seccion-fotos');
        if (seccionResumen) {
            if (!seccionResumen.classList.contains('forced-page-break')) {
                seccionResumen.classList.add('forced-page-break');
            }
            seccionResumen.style.pageBreakBefore = 'always';
            seccionResumen.style.breakBefore = 'page';
        }
        if (seccionFotos) {
            if (!seccionFotos.classList.contains('forced-page-break')) {
                seccionFotos.classList.add('forced-page-break');
            }
            seccionFotos.style.pageBreakBefore = 'always';
            seccionFotos.style.breakBefore = 'page';
        }
        const textareas = container.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            if (!estadoOriginal.estilos.has(textarea)) {
                estadoOriginal.estilos.set(textarea, {
                    height: textarea.style.height,
                    overflow: textarea.style.overflow,
                    value: textarea.value,
                    display: textarea.style.display
                });
            }
            const contenidoTexto = document.createElement('div');
            contenidoTexto.textContent = textarea.value;
            contenidoTexto.className = 'textarea-contenido-pdf';
            Object.assign(contenidoTexto.style, {
                minHeight: '40px',
                width: '100%',
                fontFamily: textarea.style.fontFamily || 'inherit',
                fontSize: '10pt',
                lineHeight: '1.8',
                padding: '2px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: '0'
            });
            textarea.parentNode.insertBefore(contenidoTexto, textarea);
            textarea.style.display = 'none';
            estadoOriginal.elementosCreados.push(contenidoTexto);
        });
        const elementosEstilizar = [
            { selector: '.forced-page-break', estilos: {
                display: 'block', height: '2px', pageBreakBefore: 'always', margin: '0', padding: '0'
            }},
            { selector: 'h2', estilos: {
                pageBreakBefore: 'always', marginTop: '12px', paddingTop: '6px', fontSize: '14pt'
            }},
            { selector: 'h3', estilos: {
                 fontSize: '12pt', marginTop: '8px', marginBottom: '2px'
            }},
            { selector: 'table', estilos: {
                pageBreakInside: 'auto', fontSize: '10pt', margin: '0', padding: '0'
            }},
             { selector: 'th', estilos: {
                 fontSize: '11pt', padding: '2px 6px'
             }},
            { selector: 'td', estilos: {
                 fontSize: '10pt', padding: '2px 6px'
            }},
            { selector: 'tr', estilos: {
                pageBreakInside: 'avoid', margin: '0', padding: '0'
            }},
            { selector: '#plan-accion-editor', estilos: {
                height: 'auto', maxHeight: 'none', overflow: 'visible', fontSize: '10pt', lineHeight: '1.8'
            }},
             { selector: '.info-section input[type="text"]', estilos: {
                 fontSize: '10pt', padding: '0', height: 'auto'
             }},
             { selector: '.fecha-inputs input[type="text"]', estilos: {
                 fontSize: '10pt', padding: '0', width: '30px', textAlign: 'center'
             }}
        ];
        elementosEstilizar.forEach(config => {
            const elementos = container.querySelectorAll(config.selector);
            elementos.forEach(el => {
                if (!estadoOriginal.estilos.has(el)) {
                    const estilosOriginales = {};
                    Object.keys(config.estilos).forEach(prop => {
                        estilosOriginales[prop] = el.style[prop];
                    });
                    estadoOriginal.estilos.set(el, estilosOriginales);
                }
                Object.keys(config.estilos).forEach(prop => {
                    el.style[prop] = config.estilos[prop];
                });
            });
        });
        const estilosTemporales = document.createElement('style');
        estilosTemporales.id = 'estilos-temporales-pdf';
        estilosTemporales.textContent = `
            @page {
                size: legal portrait;
                margin: 8mm 5mm; 
            }
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            body, .container, div, p, span, td, th, h1, h2, h3, h4, h5, h6, input, textarea {
                font-size: 10pt !important;
                line-height: 1.8 !important;
                margin: 0 !important;
                padding: 0 !important;
            }
             .container {
                width: 90% !important; 
                max-width: 90% !important; 
                padding: 2mm !important;
                margin: 0 auto !important;
            }
            h1 {
                font-size: 20pt !important;
                margin-left: 70px !important;
                margin-bottom: 16px !important;
                margin-top: 16px !important;
                position: relative !important; 
            }
            .logo-container {
                position: absolute !important;
                top: -16px !important;
                left: 10px !important;
                z-index: 1000 !important;
                width: auto !important; 
                height: auto !important;
            }
            .logo-os10 {
                width: 170px !important;
                height: auto !important;
                display: block !important;
            }
            div:empty, p:empty, span:empty {
                display: none !important;
                height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
            }
             h2 {
                font-size: 14pt !important;
                page-break-before: always !important;
                break-before: page !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
                margin-top: 12px !important;
                padding-top: 6px !important;
            }
            h3 {
                font-size: 12pt !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
                margin-top: 8px !important;
                margin-bottom: 2px !important;
            }
            table {
                page-break-inside: auto !important;
                break-inside: auto !important;
                font-size: 10pt !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            th {
                font-size: 11pt !important;
                padding: 2px 6px !important;
                background-color: #003366 !important; 
                color: white !important; 
            }
            td {
                font-size: 10pt !important;
                padding: 2px 6px !important;
            }
            tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            tr:nth-child(even) { 
                background-color: #f9f9f9 !important;
            }
            .forced-page-break {
                page-break-before: always !important;
                break-before: page !important;
                height: 2px !important;
                visibility: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .textarea-contenido-pdf {
                min-height: 40px !important;
                padding: 2px !important;
                font-family: inherit !important;
                font-size: 10pt !important;
                line-height: 1.8 !important;
                white-space: pre-wrap !important;
                word-break: break-word !important;
                margin: 0 !important;
            }
            .info-section input[type="text"] {
                font-size: 10pt !important;
                padding: 0 !important;
                height: auto !important;
            }
            .fecha-inputs input[type="text"] {
                font-size: 10pt !important;
                padding: 0px !important;
                width: 30px !important;
                text-align: center !important;
            }
             .result.seguro { background-color: #dff0d8 !important; color: #3c763d !important; border: 1px solid #d6e9c6 !important; font-size: 12pt !important; padding: 2px !important;}
             .result.riesgo { background-color: #fcf8e3 !important; color: #8a6d3b !important; border: 1px solid #faebcc !important; font-size: 12pt !important; padding: 2px !important;}
             .result.inseguro { background-color: #f2dede !important; color: #a94442 !important; border: 1px solid #ebccd1 !important; font-size: 12pt !important; padding: 2px !important;}
            img:not(.logo-os10) { 
                display: inline-block !important;
                max-width: 100% !important;
            }
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
        const elementosVacios = Array.from(container.querySelectorAll('div, p, span'))
            .filter(el => !el.textContent.trim() && !el.querySelector('img') && el.clientHeight < 20 && !el.id && !el.classList.contains('logo-container'));
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
        document.body.style.overflow = 'visible';
        document.body.style.height = 'auto';
        return estadoOriginal;
    }
    function generarPDFDesdeContenido(contenido, estadoOriginal) {
        console.log("Generando PDF con configuración óptima...");
        const opciones = {
            filename: `Fiscalizacion_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
            html2canvas: {
                scale: 0.85, 
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
                    const elementosClonados = clonedDoc.querySelectorAll('*');
                    elementosClonados.forEach(el => {
                        const tagName = el.tagName.toLowerCase();
                         if (tagName === 'h1') {
                            el.style.fontSize = '20pt';
                            el.style.marginLeft = '70px';
                            el.style.marginBottom = '16px';
                            el.style.marginTop = '16px';
                            el.style.position = 'relative';
                        } else if (tagName === 'h2') {
                            el.style.fontSize = '14pt';
                            el.style.marginTop = '12px';
                            el.style.paddingTop = '6px';
                            el.style.pageBreakBefore = 'always';
                            el.style.breakBefore = 'page';
                        } else if (tagName === 'h3') {
                            el.style.fontSize = '12pt';
                            el.style.marginTop = '8px';
                            el.style.marginBottom = '2px';
                        } else if (tagName === 'th') {
                            el.style.fontSize = '11pt';
                            el.style.padding = '2px 6px';
                            el.style.backgroundColor = '#003366';
                            el.style.color = 'white';
                        } else if (tagName === 'td') {
                            el.style.fontSize = '10pt';
                            el.style.padding = '2px 6px';
                        } else if (tagName === 'input' || tagName === 'textarea') {
                            el.style.fontSize = '10pt';
                            el.style.padding = '0px';
                            if (el.parentNode && el.parentNode.classList.contains('fecha-inputs')) {
                                el.style.width = '30px';
                                el.style.textAlign = 'center';
                            }
                             if(tagName === 'textarea'){
                                el.style.minHeight = '40px';
                                el.style.lineHeight = '1.8';
                             }
                        } else if (tagName === 'p' || tagName === 'span' || tagName === 'div') {
                            if(!el.classList.contains('logo-container')){
                                el.style.fontSize = '10pt';
                                el.style.lineHeight = '1.8';
                                el.style.margin = '0';
                                el.style.padding = '0';
                            }
                        }
                    });
                    const logoContainer = clonedDoc.querySelector('.logo-container');
                    if (logoContainer) {
                        logoContainer.style.position = 'absolute';
                        logoContainer.style.top = '-16px';
                        logoContainer.style.left = '10px';
                        logoContainer.style.zIndex = '1000';
                        const logoImage = logoContainer.querySelector('.logo-os10');
                        if (logoImage) {
                            logoImage.style.width = '170px';
                            logoImage.style.height = 'auto';
                            logoImage.style.display = 'block';
                        }
                    }
                    const style = clonedDoc.createElement('style');
                    style.innerHTML = `
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        body, html { margin: 0 !important; padding: 0 !important; }
                        body, .container, div, p, span, td, th, h1, h2, h3, h4, h5, h6, input, textarea {
                            font-size: 10pt !important; line-height: 1.8 !important; margin: 0 !important; padding: 0 !important;
                        }
                        .container { width: 90% !important; max-width: 90% !important; padding: 2mm !important; margin: 0 auto !important; }
                        h1 { font-size: 20pt !important; margin-left: 70px !important; margin-bottom: 16px !important; margin-top: 16px !important; position: relative !important; }
                        .logo-container { position: absolute !important; top: -16px !important; left: 10px !important; z-index: 1000 !important; width: auto !important; height: auto !important; }
                        .logo-os10 { width: 170px !important; height: auto !important; display: block !important; }
                        div:empty, p:empty, span:empty { display: none !important; height: 0 !important; margin: 0 !important; padding: 0 !important; }
                        h2 { font-size: 14pt !important; page-break-before: always !important; break-before: page !important; page-break-after: avoid !important; break-after: avoid !important; margin-top: 12px !important; padding-top: 6px !important; }
                        h3 { font-size: 12pt !important; page-break-after: avoid !important; break-after: avoid !important; margin-top: 8px !important; margin-bottom: 2px !important; }
                        table { page-break-inside: auto !important; break-inside: auto !important; font-size: 10pt !important; margin: 0 !important; padding: 0 !important; }
                        th { font-size: 11pt !important; padding: 2px 6px !important; background-color: #003366 !important; color: white !important; }
                        td { font-size: 10pt !important; padding: 2px 6px !important; }
                        tr { page-break-inside: avoid !important; break-inside: avoid !important; margin: 0 !important; padding: 0 !important; }
                        tr:nth-child(even) { background-color: #f9f9f9 !important; }
                        .forced-page-break { page-break-before: always !important; break-before: page !important; height: 2px !important; visibility: hidden !important; margin: 0 !important; padding: 0 !important; }
                        .textarea-contenido-pdf { min-height: 40px !important; padding: 2px !important; font-family: inherit !important; font-size: 10pt !important; line-height: 1.8 !important; white-space: pre-wrap !important; word-break: break-word !important; margin: 0 !important; }
                        .info-section input[type="text"] { font-size: 10pt !important; padding: 0px !important; height: auto !important; }
                        .fecha-inputs input[type="text"] { font-size: 10pt !important; padding: 0px !important; width: 30px !important; text-align: center !important; }
                        .result { font-size: 12pt !important; padding: 2px !important; border: 1px solid transparent !important; }
                        .result.seguro { background-color: #dff0d8 !important; color: #3c763d !important; border-color: #d6e9c6 !important;}
                        .result.riesgo { background-color: #fcf8e3 !important; color: #8a6d3b !important; border-color: #faebcc !important;}
                        .result.inseguro { background-color: #f2dede !important; color: #a94442 !important; border-color: #ebccd1 !important;}
                        img:not(.logo-os10) { display: inline-block !important; max-width: 100% !important; }
                        .mobile-nav, .mobile-action-button, .botones, .no-print, .rich-text-toolbar, .datos-guardados-info, .mobile-control-panel { display: none !important; height: 0 !important; width: 0 !important; visibility: hidden !important; margin: 0 !important; padding: 0 !important;}
                    `;
                    clonedDoc.head.appendChild(style);
                    Array.from(clonedDoc.querySelectorAll('img')).forEach(img => {
                        img.style.display = 'block';
                        img.style.maxWidth = '100%';
                    });
                    const divs = Array.from(clonedDoc.querySelectorAll('div, p, span'));
                    divs.forEach(div => {
                        if (!div.textContent.trim() && !div.querySelector('img') && div.clientHeight < 10 && !div.classList.contains('textarea-contenido-pdf') && !div.classList.contains('logo-container') && !div.id?.includes('seccion')) {
                            if (div.parentNode) {
                                div.parentNode.removeChild(div);
                            }
                        }
                    });
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
            pagebreak: {
                mode: ['avoid-all'],
                before: ['h2'], 
                avoid: ['table', 'img', '.textarea-contenido-pdf', 'tr']
            },
            enableLinks: false,
            image: { type: 'jpeg', quality: 0.98 },
            margin: [5, 4, 5, 4],
        };
        html2pdf()
            .from(contenido)
            .set(opciones)
            .toPdf()
            .get('pdf')
            .then(function(pdfObject) {
                 const totalPaginas = pdfObject.internal.getNumberOfPages();
                 console.log("PDF generado inicialmente con " + totalPaginas + " páginas");
                 for (let i = totalPaginas; i > 1; i--) {
                     pdfObject.setPage(i);
                     const pagina = pdfObject.getPageInfo(i);
                     if (pagina && pagina.pageContext &&
                         (!pagina.pageContext.stream || pagina.pageContext.stream.length < 150) &&
                         (!pagina.pageContext.annotations || pagina.pageContext.annotations.length === 0)) {
                         console.log("Eliminando página detectada como vacía: " + i);
                         pdfObject.deletePage(i);
                     }
                 }
                agregarMetadatosYNumeracion(pdfObject);
                pdfObject.save(opciones.filename);
                console.log("PDF generado exitosamente");
                actualizarIndicadorExito();
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
    function agregarMetadatosYNumeracion(pdf) {
        try {
            pdf.setProperties({
                title: 'Cuadro de Fiscalización de Seguridad Privada',
                subject: 'Informe de Fiscalización',
                author: document.querySelector('input[name="fiscalizador"]')?.value || 'Sistema de Fiscalización',
                keywords: 'seguridad, fiscalización, informe',
                creator: 'Sistema PDF Optimizado'
            });
            const totalPaginas = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPaginas; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8);
                pdf.setTextColor(100, 100, 100);
                const pageSize = pdf.internal.pageSize;
                const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                const texto = `Página ${i} de ${totalPaginas}`;
                const textWidth = pdf.getStringUnitWidth(texto) * 8 / pdf.internal.scaleFactor;
                const x = pageWidth - textWidth - 10;
                const y = pageHeight - 8;
                pdf.text(texto, x, y);
            }
        } catch (error) {
            console.warn("Error al añadir metadatos o numeración:", error);
        }
    }
    function restaurarDocumentoOriginal(estadoOriginal) {
        console.log("Restaurando documento a su estado original...");
        try {
            if (estadoOriginal.elementosCreados) {
                estadoOriginal.elementosCreados.forEach(el => {
                    if (el && el.parentNode) {
                        try { el.parentNode.removeChild(el); } catch(e){ console.warn("Error removiendo elemento creado:", el, e); }
                    }
                });
            }
            if (estadoOriginal.ocultos) {
                estadoOriginal.ocultos.forEach(item => {
                     try {
                        if (item.parent && item.nextSibling) {
                            item.parent.insertBefore(item.element, item.nextSibling);
                        } else if (item.parent) {
                            item.parent.appendChild(item.element);
                        }
                        if (item.display !== undefined && item.element && item.element.style) {
                            item.element.style.display = item.display;
                        }
                     } catch(e){ console.warn("Error restaurando elemento oculto:", item.element, e); }
                });
            }
            if (estadoOriginal.estilos) {
                estadoOriginal.estilos.forEach((estilos, elemento) => {
                     try {
                        if (elemento && elemento.style) {
                            Object.keys(estilos).forEach(prop => {
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
            if (estadoOriginal.documentBody) {
                document.body.style.overflow = estadoOriginal.documentBody.overflow || '';
                document.body.style.height = estadoOriginal.documentBody.height || '';
            }
            const estilosTemporales = document.getElementById('estilos-temporales-pdf');
            if (estilosTemporales && estilosTemporales.parentNode) {
                 try { estilosTemporales.parentNode.removeChild(estilosTemporales); } catch(e){}
            }
             const estiloTamanioMinimo = document.getElementById('estilo-tamanio-minimo');
             if (estiloTamanioMinimo && estiloTamanioMinimo.parentNode) {
                 try { estiloTamanioMinimo.parentNode.removeChild(estiloTamanioMinimo); } catch(e){}
             }
              const estiloNoPageBreak = document.getElementById('estilo-eliminar-page-breaks');
              if (estiloNoPageBreak && estiloNoPageBreak.parentNode) {
                 try { estiloNoPageBreak.parentNode.removeChild(estiloNoPageBreak); } catch(e){}
             }
            ocultarIndicadorCarga();
        } catch (e) {
             console.error("Error mayor durante la restauración:", e);
        } finally {
             ocultarIndicadorCarga();
             console.log("Restauración del documento intentada.");
        }
    }
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
