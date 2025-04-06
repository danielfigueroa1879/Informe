/**
 * Solución optimizada para la generación de PDF sin páginas en blanco intermedias
 * y con observaciones completas, optimizada para texto compacto
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
        
        // 5. Añadir una hoja de estilos temporal con reglas específicas para PDF
        const estilosTemporales = document.createElement('style');
        estilosTemporales.id = 'estilos-temporales-pdf';
        estilosTemporales.textContent = `
            @page {
                size: legal portrait;
                margin: 10mm; /* Márgenes reducidos */
            }
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                font-size: 9pt !important;
                line-height: 1.2 !important;
            }
            .container {
                font-size: 9pt !important;
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            h1 { 
                font-size: 13pt !important; 
                margin-bottom: 10px !important;
            }
            h2 { 
                font-size: 11pt !important; 
                margin-top: 15px !important;
                margin-bottom: 8px !important;
                page-break-before: always !important;
                break-before: page !important;
            }
            h3 {
                font-size: 10pt !important;
                margin-top: 10px !important;
                margin-bottom: 6px !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
            }
            table {
                font-size: 8pt !important;
                page-break-inside: auto !important;
                break-inside: auto !important;
                margin-bottom: 15px !important;
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
            .textarea-contenido-pdf {
                font-size: 9pt !important;
                line-height: 1.2 !important;
            }
            .result {
                font-size: 9pt !important;
                padding: 10px !important;
            }
        `;
        document.head.appendChild(estilosTemporales);
        estadoOriginal.elementosCreados.push(estilosTemporales);
        
        // 6. Eliminar elementos vacíos que puedan causar páginas en blanco
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
        
        // 7. Restringir el flujo del documento para evitar problemas de renderizado
        document.body.style.overflow = 'visible';
        document.body.style.height = 'auto';
        
        return estadoOriginal;
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
    
    // Función para restaurar el documento a su estado original
    function restaurarDocumentoOriginal(estadoOriginal) {
        console.log("Restaurando documento a su estado original...");
        
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
                    item.parent.insertBefore(item.element, item.nextSibling);
                } else if (item.parent) {
                    item.parent.appendChild(item.element);
                }
                
                // Restaurar visibilidad
                if (item.display !== undefined) {
                    item.element.style.display = item.display;
                }
            });
        }
        
        // 3. Restaurar estilos originales
        if (estadoOriginal.estilos) {
            estadoOriginal.estilos.forEach((estilos, elemento) => {
                Object.keys(estilos).forEach(prop => {
                    // Manejar caso especial para textareas
                    if (prop === 'value' && elemento.tagName === 'TEXTAREA') {
                        elemento.value = estilos.value;
                    } else {
                        elemento.style[prop] = estilos[prop] || '';
                    }
                });
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
        
        // 6. Ocultar indicador de carga si aún está visible
        ocultarIndicadorCarga();
        
        console.log("Documento restaurado correctamente");
    }

    // Funciones auxiliares para el manejo de la interfaz de usuario
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

    // Retornar funciones necesarias para instalación externa
    return {
        generarPDFCorregido,
        mostrarIndicadorCarga,
        ocultarIndicadorCarga,
        actualizarIndicadorExito
    };
}

// Función para instalar el botón de PDF en los botones existentes
function instalarBotonPDFCorregido() {
    console.log("Instalando botón de PDF corregido...");
    
    // Buscar todos los botones relacionados con PDF
    const botonesExistentes = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.toLowerCase().includes('pdf') || 
        btn.id?.includes('pdf') ||
        btn.onclick?.toString().includes('PDF')
    );
    
    // Modificar cada botón encontrado
    botonesExistentes.forEach(btn => {
        console.log(`Modificando botón de PDF existente: ${btn.textContent || btn.id}`);
        
        // Cambiar el evento onclick
        btn.onclick = generarPDFCorregido;
        
        // Actualizar texto y estilos para distinguirlo
        if (btn.textContent.toLowerCase().includes('pdf')) {
            btn.textContent = 'Descargar PDF Optimizado';
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
            nuevoBoton.textContent = 'Descargar PDF Optimizado';
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
                this.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        };
        
        // Insertar al inicio
        div.insertBefore(nuevoBoton, div.firstChild);
    });
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

// ---------- INICIO DE CÓDIGO ADICIONAL ----------

// Función para eliminar botones duplicados de PDF
function eliminarBotonesDuplicados() {
  // Obtener todos los botones que contengan "PDF" en su texto
  const botonesPDF = Array.from(document.querySelectorAll('button'))
    .filter(btn => btn.textContent.toLowerCase().includes('pdf'));
  
  // Si hay más de un botón de PDF, conservar solo el verde
  if (botonesPDF.length > 1) {
    console.log(`Se encontraron ${botonesPDF.length} botones de PDF. Eliminando duplicados...`);
    
    // Identificar el botón verde para mantenerlo
    const botonVerde = botonesPDF.find(btn => 
      btn.id === 'btn-descargar-pdf' || 
      btn.style.backgroundColor.includes('28a745') ||
      btn.classList.contains('btn-success') ||
      window.getComputedStyle(btn).backgroundColor.includes('40, 167')
    );
    
    // Si encontramos el botón verde, eliminar todos los demás botones de PDF
    if (botonVerde) {
      console.log('Botón verde encontrado. Manteniendo este botón y eliminando los demás.');
      
      botonesPDF.forEach(btn => {
        if (btn !== botonVerde) {
          // Ocultar el botón en lugar de eliminarlo para no romper funcionalidades existentes
          btn.style.display = 'none';
          console.log(`Botón oculto: ${btn.textContent}`);
        } else {
          // Asegurarse de que el botón verde sea más prominente
          btn.style.backgroundColor = '#28a745';
          btn.style.fontWeight = 'bold';
        }
      });
    }
  }
}

// Ejecutar eliminación de botones duplicados
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(eliminarBotonesDuplicados, 1500);
});

// Función para ajustar visualización de botones PDF
function ajustarBotonesPDF() {
  const botonesPDF = document.querySelectorAll('button');
  
  botonesPDF.forEach(boton => {
    if (boton.textContent.toLowerCase().includes('pdf')) {
      // Aplicar estilos consistentes
      Object.assign(boton.style, {
        backgroundColor: '#28a745',
        color: 'white',
        fontWeight: 'bold',
        padding: '10px 20px',
        borderRadius: '5px',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      });
      
      // Añadir eventos hover
      boton.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#218838';
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 8px rgba(0,0,0,0.15)';
      });
      
      boton.addEventListener('mouseout', function() {
        this.style.backgroundColor = '#28a745';
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      });
    }
  });
}

// Ejecutar ajuste de botones
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(ajustarBotonesPDF, 1000);
});

// Mantener referencias globales de las funciones principales
window.eliminarBotonesDuplicados = eliminarBotonesDuplicados;
window.ajustarBotonesPDF = ajustarBotonesPDF;
        
