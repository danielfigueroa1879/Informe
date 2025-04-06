/**
 * Solución optimizada para la generación de PDF sin páginas en blanco intermedias
 * y con observaciones completas, ahora con texto más compacto
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
                minHeight: '30px', // Reducido
                width: '100%',
                fontFamily: textarea.style.fontFamily || 'inherit',
                fontSize: '9pt', // Tamaño de fuente reducido
                lineHeight: '1.2', // Interlineado más compacto
                paddingLeft: '5px',
                whiteSpace: 'pre-wrap',
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
                marginTop: '10px', // Reducido
                paddingTop: '5px' // Reducido
            }},
            { selector: 'table', estilos: {
                pageBreakInside: 'auto',
                fontSize: '9pt' // Tamaño de fuente reducido
            }},
            { selector: 'tr', estilos: {
                pageBreakInside: 'avoid'
            }},
            { selector: '#plan-accion-editor', estilos: {
                height: 'auto',
                maxHeight: 'none',
                overflow: 'visible',
                fontSize: '9pt' // Tamaño de fuente reducido
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
        
        // Resto del código de prepararContenidoParaPDF sigue igual...
        // (se mantiene la lógica de añadir estilos temporales, eliminar elementos vacíos, etc.)
        
        return estadoOriginal;
    }
}
// Función para generar el PDF con texto reducido
function generarPDFDesdeContenido(contenido, estadoOriginal) {
    console.log("Generando PDF con configuración óptima y texto más pequeño...");
    
    // Configuración optimizada para tamaño legal/oficio con texto reducido
    const opciones = {
        filename: `Fiscalizacion_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
        
        html2canvas: {
            scale: 1.5,
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
                // Reducir tamaño de texto en el clon
                const style = clonedDoc.createElement('style');
                style.innerHTML = `
                    * {
                        font-size: 9pt !important; /* Texto más pequeño */
                        line-height: 1.2 !important; /* Líneas más compactas */
                    }
                    
                    body, .container {
                        font-size: 9pt !important;
                    }
                    
                    h1 { 
                        font-size: 13pt !important; 
                        margin-bottom: 10px !important;
                    }
                    
                    h2 { 
                        font-size: 11pt !important; 
                        margin-top: 15px !important;
                        margin-bottom: 8px !important;
                    }
                    
                    h3 { 
                        font-size: 10pt !important; 
                        margin-top: 10px !important;
                        margin-bottom: 6px !important;
                    }
                    
                    table {
                        font-size: 8pt !important;
                        margin-bottom: 15px !important;
                    }
                    
                    th, td {
                        padding: 6px !important;
                    }
                    
                    .result {
                        font-size: 9pt !important;
                        padding: 10px !important;
                    }
                    
                    textarea, input {
                        font-size: 8pt !important;
                    }
                    
                    .observaciones {
                        font-size: 8pt !important;
                    }
                    
                    @page {
                        size: legal portrait;
                        margin: 10mm; /* Márgenes más pequeños */
                    }
                    
                    /* Estilos adicionales para compactar */
                    .info-section {
                        padding: 10px !important;
                        margin-bottom: 15px !important;
                    }
                    
                    .summary {
                        padding: 15px !important;
                    }
                    
                    .firmas-seccion {
                        margin-top: 15px !important;
                    }
                    
                    .linea-firma {
                        margin: 10px 0 !important;
                    }
                `;
                clonedDoc.head.appendChild(style);
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
            avoid: ['table', 'img', '.textarea-contenido-pdf']
        },
        
        enableLinks: false,
        image: { type: 'jpeg', quality: 0.98 },
        margin: [10, 10, 10, 10], // Márgenes más pequeños
    };
    
    // Generar el PDF con el manejo optimizado
    html2pdf()
        .from(contenido)
        .set(opciones)
        .toPdf()
        .get('pdf')
        .then(function(pdfObject) {
            // Añadir metadatos y numeración de página
            try {
                // Añadir metadatos
                pdfObject.setProperties({
                    title: 'Cuadro de Fiscalización de Seguridad Privada',
                    subject: 'Informe de Fiscalización',
                    author: document.querySelector('input[name="fiscalizador"]')?.value || 'Sistema de Fiscalización',
                    keywords: 'seguridad, fiscalización, informe',
                    creator: 'Sistema PDF Optimizado'
                });
                
                // Añadir numeración de páginas
                const totalPaginas = pdfObject.internal.getNumberOfPages();
                
                for (let i = 1; i <= totalPaginas; i++) {
                    pdfObject.setPage(i);
                    
                    // Configuración de texto para el pie de página
                    pdfObject.setFontSize(8); // Tamaño de fuente reducido
                    pdfObject.setTextColor(100, 100, 100);
                    
                    // Obtener dimensiones de la página
                    const pageSize = pdfObject.internal.pageSize;
                    const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
                    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                    
                    // Texto de numeración
                    const texto = `Página ${i} de ${totalPaginas}`;
                    
                    // Posicionar en la esquina inferior derecha
                    const textWidth = pdfObject.getStringUnitWidth(texto) * 8 / pdfObject.internal.scaleFactor;
                    const x = pageWidth - textWidth - 15;
                    const y = pageHeight - 10;
                    
                    // Añadir el texto
                    pdfObject.text(texto, x, y);
                }
            } catch (error) {
                console.warn("Error al añadir metadatos o numeración:", error);
            }
            
            // Guardar el PDF
            pdfObject.save(opciones.filename);
            
            console.log("PDF generado exitosamente con texto reducido");
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
