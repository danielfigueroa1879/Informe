/**
 * Solución optimizada para la generación de PDF sin páginas en blanco intermedias
 * y con observaciones completas
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
                minHeight: '50px',
                width: '100%',
                fontFamily: textarea.style.fontFamily || 'inherit',
                fontSize: textarea.style.fontSize || 'inherit',
                lineHeight: '1.4',
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
                marginTop: '20px',
                paddingTop: '10px'
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
                overflow: 'visible'
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
            }
            .container {
                font-size: 12pt !important;
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
            }
            h3 {
                page-break-after: avoid !important;
                break-after: avoid !important;
            }
            table {
                page-break-inside: auto !important;
                break-inside: auto !important;
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
                min-height: 50px;
                padding: 5px !important;
                font-family: inherit !important;
                font-size: inherit !important;
                line-height: 1.4 !important;
                white-space: pre-wrap !important;
                word-break: break-word !important;
                margin-bottom: 5px !important;
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
    
    // Función para generar el PDF con la configuración óptima
    function generarPDFDesdeContenido(contenido, estadoOriginal) {
        console.log("Generando PDF con configuración óptima...");
        
        // Configuración optimizada para tamaño legal/oficio
        const opciones = {
            filename: `Fiscalizacion_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
            
            // Modo de optimización: 1 = velocidad, 2 = precisión
            html2canvas: {
                scale: 1.5, // Escala original
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
                    // Forzar la visibilidad de los fondos y gráficos
                    const style = clonedDoc.createElement('style');
                    style.innerHTML = `
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        
                        /* Evitar páginas en blanco */
                        div:empty, p:empty, span:empty {
                            display: none !important;
                        }
                        
                        /* Estilos específicos para asegurar fondos correctos */
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
                        
                        /* Asegurar que las textareas se muestran correctamente */
                        .textarea-contenido-pdf {
                            min-height: 50px;
                            padding: 5px !important;
                            font-family: inherit !important;
                            font-size: inherit !important;
                            line-height: 1.4 !important;
                            white-space: pre-wrap !important;
                            word-break: break-word !important;
                        }
                    `;
                    clonedDoc.head.appendChild(style);
                    
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
                }
            },
            
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
                avoid: ['table', 'img', '.textarea-contenido-pdf']
            },
            
            // Usar el nuevo modo para división de contenido
            enableLinks: false,
            image: { type: 'jpeg', quality: 0.98 }, // Mayor calidad para gráficos
            margin: [15, 10, 15, 10], // top, right, bottom, left
            
            // Importante: Esta opción optimiza el proceso y evita páginas en blanco
            html2canvas: { 
                scale: 1.5, // Escala original
                scrollY: 0, 
                scrollX: 0,
                backgroundColor: '#FFFFFF',
                removeContainer: true,
                allowTaint: true,
                useCORS: true,
                letterRendering: true,
                imageSmoothingEnabled: true,
                imageTimeout: 30000
            }
        };
        
        // Generar el PDF con el manejo optimizado
        html2pdf()
            .from(contenido)
            .set(opciones)
            .toPdf()
            .get('pdf')
            .then(function(pdfObject) {
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
                pdf.setFontSize(9);
                pdf.setTextColor(100, 100, 100);
                
                // Obtener dimensiones de la página
                const pageSize = pdf.internal.pageSize;
                const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                
                // Texto de numeración
                const texto = `Página ${i} de ${totalPaginas}`;
                
                // Posicionar en la esquina inferior derecha
                const textWidth = pdf.getStringUnitWidth(texto) * 9 / pdf.internal.scaleFactor;
                const x = pageWidth - textWidth - 15;
                const y = pageHeight - 10;
                
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

// ---------- INICIO DE CÓDIGO AGREGADO ----------

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
/**
 * Función mejorada con texto ultramicroscópico para PDF
 * Esta implementación usa múltiples técnicas combinadas para asegurar texto extremadamente pequeño
 */
function ajustarTamañoTextoPDF() {
  // Crear o actualizar la hoja de estilos específica para PDF
  let estilosPDF = document.getElementById('estilos-pdf-optimizados');
  
  // Si no existe, crearla
  if (!estilosPDF) {
    estilosPDF = document.createElement('style');
    estilosPDF.id = 'estilos-pdf-optimizados';
    document.head.appendChild(estilosPDF);
  }
  
  // Definir estilos específicos para impresión y PDF con tamaños ultramicroscópicos
  estilosPDF.textContent = `
    @media print {
      /* Aplicar a todos los elementos un tamaño de base extremadamente pequeño */
      * {
        font-size: 0.8pt !important;
        line-height: 0.7 !important;
        letter-spacing: -0.1pt !important;
        word-spacing: -0.1pt !important;
      }
      
      /* Texto normal ultramicroscópico - Más pequeño que antes */
      body, p, td, th, li, span, div, input, textarea {
        font-size: 0.8pt !important;
        line-height: 0.7 !important;
        transform: scale(0.9);
        transform-origin: left top;
      }
      
      /* Títulos principales ultramicroscópicos */
      h1 {
        font-size: 1.5pt !important;
        margin: 0.8pt 0 !important;
        transform: scale(0.9);
        transform-origin: left top;
      }
      
      h2 {
        font-size: 1.2pt !important;
        margin: 0.6pt 0 !important;
        transform: scale(0.9);
        transform-origin: left top;
      }
      
      h3 {
        font-size: 1pt !important;
        margin: 0.5pt 0 !important;
        transform: scale(0.9);
        transform-origin: left top;
      }
      
      /* Otros títulos */
      h4, h5, h6 {
        font-size: 0.9pt !important;
        margin: 0.5pt 0 !important;
        transform: scale(0.9);
        transform-origin: left top;
      }
      
      /* Texto en negrita */
      strong, b {
        font-size: 0.8pt !important;
        font-weight: bold !important;
      }
      
      /* Celdas de tabla ultramicroscópicas */
      table {
        font-size: 0.8pt !important;
        margin: 1pt 0 !important;
        border-collapse: collapse !important;
        border-spacing: 0 !important;
        transform: scale(0.9);
        transform-origin: left top;
      }
      
      th, td {
        padding: 0.2pt !important;
        font-size: 0.8pt !important;
        border-width: 0.1pt !important;
      }
      
      /* Título principal */
      .container h1 {
        font-size: 1.5pt !important;
        margin: 0.8pt 0 !important;
      }
      
      /* Comprimir todo el documento para que quepa más */
      .container {
        transform: scale(0.8) !important;
        transform-origin: top left !important;
        width: 125% !important;
        max-width: 125% !important;
      }
      
      /* Márgenes de página ultramínimos */
      @page {
        margin: 1mm !important;
        size: legal !important;
      }
      
      /* Aplicar escala reducida a todos los elementos para asegurar tamaño mínimo */
      .info-section, .summary, table, .resumen-seccion, .resultados-compacto,
      .rich-text-container, .foto-container, .firmas-seccion, .footer {
        transform: scale(0.9);
        transform-origin: left top;
      }
      
      /* Márgenes internos mínimos */
      .info-section, .summary, .resumen-seccion {
        padding: 0.2pt !important;
        margin: 0.2pt 0 !important;
      }

      /* Tablas ultramicroscópicas */
      table, th, td {
        border-width: 0.1pt !important;
      }
      
      .check-column {
        width: 15px !important;
      }
      
      /* Compresión extrema para texto y elementos */
      .textarea-contenido-pdf, #plan-accion-editor, .rich-text-editor {
        font-size: 0.8pt !important;
        line-height: 0.7 !important;
        min-height: 5pt !important;
      }
      
      /* Comprimir elementos de formulario */
      input[type="radio"], input[type="checkbox"] {
        width: 3px !important;
        height: 3px !important;
      }
      
      /* Preservar colores */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }
  `;
  
  // Insertar script para manipular el DOM antes de imprimir
  const scriptExtra = document.createElement('script');
  scriptExtra.textContent = `
    // Función para asegurar que el texto sea extremadamente pequeño en el PDF
    function asegurarTextoUltraPequeño() {
      console.log('Aplicando reducción de tamaño extrema antes de imprimir...');
      
      // Aplicar CSS inline para forzar tamaño ultramicroscópico
      document.querySelectorAll('body *').forEach(el => {
        if (el.tagName.toLowerCase() === 'h1') {
          el.style.cssText += 'font-size: 1.5pt !important; line-height: 0.7 !important; transform: scale(0.9); transform-origin: left top;';
        } 
        else if (el.tagName.toLowerCase() === 'h2') {
          el.style.cssText += 'font-size: 1.2pt !important; line-height: 0.7 !important; transform: scale(0.9); transform-origin: left top;';
        }
        else if (el.tagName.toLowerCase() === 'h3') {
          el.style.cssText += 'font-size: 1pt !important; line-height: 0.7 !important; transform: scale(0.9); transform-origin: left top;';
        }
        else {
          el.style.cssText += 'font-size: 0.8pt !important; line-height: 0.7 !important; letter-spacing: -0.1pt; word-spacing: -0.1pt;';
        }
        
        // Eliminar espacios
        el.style.margin = '0';
        el.style.padding = '0';
      });
      
      // Reducir el tamaño general del documento
      const container = document.querySelector('.container');
      if (container) {
        container.style.transform = 'scale(0.8)';
        container.style.transformOrigin = 'top left';
        container.style.width = '125%';
        container.style.maxWidth = '125%';
      }
      
      // Reducir tamaño de tablas
      document.querySelectorAll('table').forEach(table => {
        table.style.borderCollapse = 'collapse';
        table.style.borderSpacing = '0';
        table.style.transform = 'scale(0.9)';
        table.style.transformOrigin = 'left top';
        
        // Reducir celdas
        table.querySelectorAll('th, td').forEach(cell => {
          cell.style.padding = '0.2pt';
          cell.style.fontSize = '0.8pt';
          cell.style.lineHeight = '0.7';
          cell.style.borderWidth = '0.1pt';
        });
      });
    }
    
    // Registrar para ejecución antes de imprimir
    window.addEventListener('beforeprint', asegurarTextoUltraPequeño);
    
    // También ejecutar ahora para afectar cuando se genere el PDF con librerías externas
    if (typeof html2pdf !== 'undefined') {
      const originalFromMethod = html2pdf.Worker.prototype.from;
      html2pdf.Worker.prototype.from = function(src) {
        // Aplicar reducción antes de generar el PDF
        asegurarTextoUltraPequeño();
        return originalFromMethod.call(this, src);
      };
    }
  `;
  document.head.appendChild(scriptExtra);
  
  // Modificar cualquier función de generación de PDF existente
  if (typeof window.generarPDFCorregido === 'function') {
    const originalFn = window.generarPDFCorregido;
    window.generarPDFCorregido = function() {
      // Aplicar ajustes adicionales para texto microscópico
      const scriptTemp = document.createElement('script');
      scriptTemp.textContent = `asegurarTextoUltraPequeño();`;
      document.head.appendChild(scriptTemp);
      setTimeout(() => {
        if (scriptTemp.parentNode) scriptTemp.parentNode.removeChild(scriptTemp);
      }, 100);
      
      // Ejecutar función original
      return originalFn.apply(this, arguments);
    };
  }
  
  console.log('Estilos ultramicroscópicos para PDF aplicados - Texto en tamaño extremadamente reducido.');
}

// Ejecutar la función ahora para aplicar los estilos
ajustarTamañoTextoPDF();

// Si se está utilizando html2pdf, modificar su comportamiento
if (typeof window.html2pdf !== 'undefined') {
  // Guardar referencia a la función original
  const originalHtml2pdf = window.html2pdf;
  
  // Sobreescribir con versión que aplica reducción de tamaño
  window.html2pdf = function() {
    // Aplicar nuestros estilos primero
    ajustarTamañoTextoPDF();
    
    // Asegurar texto pequeño
    if (typeof window.asegurarTextoUltraPequeño === 'function') {
      window.asegurarTextoUltraPequeño();
    }
    
    // Usar opciones extremas
    const args = arguments;
    const options = args[0]?.options || {};
    if (options.jsPDF) {
      options.jsPDF.scale = 0.5; // Reducir escala
      options.jsPDF.compress = true;
    }
    
    // Llamar a la función original
    return originalHtml2pdf.apply(this, args);
  };
}

// Modificar cualquier función de impresión de PDF también
const originalPrint = window.print;
window.print = function() {
  // Aplicar reducción extrema antes de imprimir
  ajustarTamañoTextoPDF();
  if (typeof window.asegurarTextoUltraPequeño === 'function') {
    window.asegurarTextoUltraPequeño();
  }
  
  // Imprimir
  return originalPrint.apply(this, arguments);
};
