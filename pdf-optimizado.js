/**
 * Solución definitiva para la generación de PDF sin páginas en blanco
 * y con saltos de página correctos
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
            }
        };
        
        // 1. Ocultar elementos con clase no-print y botones
        const elementosOcultar = container.querySelectorAll('.botones, .no-print');
        elementosOcultar.forEach(el => {
            estadoOriginal.ocultos.push({
                element: el,
                display: el.style.display
            });
            el.style.display = 'none';
        });
        
        // 2. Aplicar estilos óptimos para la impresión
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
                // Guardar estilos originales
                const estilosOriginales = {};
                Object.keys(config.estilos).forEach(prop => {
                    estilosOriginales[prop] = el.style[prop];
                });
                estadoOriginal.estilos.set(el, estilosOriginales);
                
                // Aplicar nuevos estilos
                Object.keys(config.estilos).forEach(prop => {
                    el.style[prop] = config.estilos[prop];
                });
            });
        });
        
        // 3. Añadir una hoja de estilos temporal con reglas específicas para PDF
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
            /* Añadir más reglas específicas según sea necesario */
        `;
        document.head.appendChild(estilosTemporales);
        
        // 4. Restringir el flujo del documento para evitar problemas de renderizado
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
                scale: 1.05, // Reducido a ~70% del valor original (1.5 * 0.7 = 1.05)
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: 0,
                windowWidth: document.documentElement.offsetWidth,
                windowHeight: document.documentElement.offsetHeight,
                logging: false,
                backgroundColor: '#FFFFFF',
                imageTimeout: 15000,
                removeContainer: true,
                foreignObjectRendering: false // Deshabilitar para mayor compatibilidad
            },
            
            jsPDF: {
                unit: 'mm',
                format: 'legal', // Formato oficio/legal
                orientation: 'portrait',
                compress: true,
                precision: 16,
                putOnlyUsedFonts: true
            },
            
            // Configuración de saltos de página
            pagebreak: {
                mode: ['css', 'legacy'],
                before: ['h2', '.forced-page-break'],
                avoid: ['table', 'img', '.avoid-break']
            },
            
            // Usar el nuevo modo para división de contenido
            enableLinks: false,
            image: { type: 'jpeg', quality: 0.95 },
            margin: [15, 10, 15, 10], // top, right, bottom, left
            
            // Importante: Esta opción optimiza el proceso y evita páginas en blanco
            html2canvas: { scale: 1.05, scrollY: 0, scrollX: 0 } // Reducido a ~70% del valor original
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
        
        // 1. Restaurar elementos ocultos
        if (estadoOriginal.ocultos) {
            estadoOriginal.ocultos.forEach(item => {
                item.element.style.display = item.display || '';
            });
        }
        
        // 2. Restaurar estilos originales
        if (estadoOriginal.estilos) {
            estadoOriginal.estilos.forEach((estilos, elemento) => {
                Object.keys(estilos).forEach(prop => {
                    elemento.style[prop] = estilos[prop];
                });
            });
        }
        
        // 3. Restaurar estilos del body
        if (estadoOriginal.documentBody) {
            document.body.style.overflow = estadoOriginal.documentBody.overflow || '';
            document.body.style.height = estadoOriginal.documentBody.height || '';
        }
        
        // 4. Eliminar hoja de estilos temporal
        const estilosTemporales = document.getElementById('estilos-temporales-pdf');
        if (estilosTemporales) {
            estilosTemporales.parentNode.removeChild(estilosTemporales);
        }
        
        // 5. Ocultar indicador de carga si aún está visible
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
            btn.textContent = 'Descargar PDF Corregido';
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
            nuevoBoton.textContent = 'Descargar PDF Corregido';
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
