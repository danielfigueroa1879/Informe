/**
 * Script optimizado para la generación de PDF en formato oficio
 * con mejor manejo de saltos de página y sin páginas en blanco
 */

// Función principal para generar el PDF mejorado
function generarPDFOptimizado() {
    // Mostrar indicador de carga con estilo mejorado
    const indicadorCarga = document.createElement('div');
    indicadorCarga.id = 'indicador-pdf-optimizado';
    indicadorCarga.style.position = 'fixed';
    indicadorCarga.style.top = '0';
    indicadorCarga.style.left = '0';
    indicadorCarga.style.width = '100%';
    indicadorCarga.style.height = '100%';
    indicadorCarga.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    indicadorCarga.style.zIndex = '9999';
    indicadorCarga.style.display = 'flex';
    indicadorCarga.style.justifyContent = 'center';
    indicadorCarga.style.alignItems = 'center';
    indicadorCarga.style.fontFamily = "'Poppins', sans-serif";
    
    // Contenedor de mensaje con animación de carga
    const mensajeContainer = document.createElement('div');
    mensajeContainer.style.backgroundColor = '#003366';
    mensajeContainer.style.padding = '25px 40px';
    mensajeContainer.style.borderRadius = '10px';
    mensajeContainer.style.boxShadow = '0 5px 25px rgba(0,0,0,0.5)';
    mensajeContainer.style.textAlign = 'center';
    mensajeContainer.style.color = 'white';
    
    // Mensaje principal
    const mensajeTitulo = document.createElement('div');
    mensajeTitulo.style.fontSize = '1.4rem';
    mensajeTitulo.style.fontWeight = 'bold';
    mensajeTitulo.style.marginBottom = '15px';
    mensajeTitulo.textContent = 'Generando PDF';
    
    // Mensaje secundario
    const mensajeSubtitulo = document.createElement('div');
    mensajeSubtitulo.style.fontSize = '1rem';
    mensajeSubtitulo.textContent = 'Por favor espere, esto puede tomar unos momentos...';
    
    // Agregar animación de carga
    const loadingBar = document.createElement('div');
    loadingBar.style.width = '100%';
    loadingBar.style.height = '6px';
    loadingBar.style.backgroundColor = 'rgba(255,255,255,0.2)';
    loadingBar.style.marginTop = '20px';
    loadingBar.style.borderRadius = '3px';
    loadingBar.style.overflow = 'hidden';
    
    const loadingProgress = document.createElement('div');
    loadingProgress.style.width = '30%';
    loadingProgress.style.height = '100%';
    loadingProgress.style.backgroundColor = '#4CAF50';
    loadingProgress.style.borderRadius = '3px';
    loadingProgress.style.animation = 'moveProgress 1.5s infinite ease-in-out';
    
    // Añadir animación al documento
    const styleAnimation = document.createElement('style');
    styleAnimation.textContent = `
        @keyframes moveProgress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
        }
    `;
    document.head.appendChild(styleAnimation);
    
    // Ensamblar todo
    loadingBar.appendChild(loadingProgress);
    mensajeContainer.appendChild(mensajeTitulo);
    mensajeContainer.appendChild(mensajeSubtitulo);
    mensajeContainer.appendChild(loadingBar);
    indicadorCarga.appendChild(mensajeContainer);
    document.body.appendChild(indicadorCarga);
    
    // Cargar html2pdf si no está disponible
    if (typeof html2pdf === 'undefined') {
        console.log("Cargando librería html2pdf...");
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = function() {
            console.log("Librería html2pdf cargada correctamente");
            iniciarGeneracionPDF();
        };
        script.onerror = function() {
            console.error("Error al cargar html2pdf");
            alert('Error al cargar la librería de generación de PDF. Compruebe su conexión a internet.');
            limpiarYRestaurar();
        };
        document.head.appendChild(script);
    } else {
        console.log("Librería html2pdf ya está cargada");
        iniciarGeneracionPDF();
    }
    
    // Función principal para generar el PDF
    function iniciarGeneracionPDF() {
        // Guardar estados originales para restaurar después
        const estadosOriginales = prepararDocumentoParaPDF();
        
        // Dejar un tiempo para que se apliquen los cambios en el DOM
        setTimeout(() => {
            generarPDF(estadosOriginales);
        }, 500);
    }
    
    // Prepara el documento para la generación, ocultando elementos innecesarios
    function prepararDocumentoParaPDF() {
        console.log("Preparando documento para PDF...");
        const estadosOriginales = {
            botones: [],
            noPrint: [],
            secciones: [],
            estilosPrevios: []
        };
        
        // 1. Ocultar botones
        document.querySelectorAll('.botones').forEach(div => {
            estadosOriginales.botones.push({
                element: div,
                display: div.style.display
            });
            div.style.display = 'none';
        });
        
        // 2. Ocultar elementos con clase no-print
        document.querySelectorAll('.no-print').forEach(el => {
            estadosOriginales.noPrint.push({
                element: el,
                display: el.style.display
            });
            el.style.display = 'none';
        });
        
        // 3. Asegurar que las secciones con forced-page-break están visibles
        document.querySelectorAll('.forced-page-break').forEach(section => {
            estadosOriginales.secciones.push({
                element: section,
                display: section.style.display
            });
            // Asegurar visibilidad pero mantener comportamiento de salto de página
            section.style.display = 'block';
        });
        
        // 4. Asegurar que el contenido del plan de acción sea visible y tenga altura adecuada
        const planAccion = document.getElementById('plan-accion-editor');
        if (planAccion) {
            estadosOriginales.estilosPrevios.push({
                element: planAccion,
                height: planAccion.style.height,
                overflow: planAccion.style.overflow
            });
            planAccion.style.height = 'auto';
            planAccion.style.overflow = 'visible';
        }
        
        // 5. Asegurar que el tamaño de fuente sea adecuado para el PDF
        const container = document.querySelector('.container');
        if (container) {
            estadosOriginales.estilosPrevios.push({
                element: container,
                fontSize: container.style.fontSize
            });
            // Mantener el tamaño de fuente actual que funciona bien para impresión
        }
        
        return estadosOriginales;
    }
    
    // Genera el PDF con configuración optimizada
    function generarPDF(estadosOriginales) {
        // Obtener el contenedor principal
        const contenido = document.querySelector('.container');
        if (!contenido) {
            console.error("No se encontró el contenedor principal");
            alert('Error: No se pudo encontrar el contenedor del formulario.');
            limpiarYRestaurar(estadosOriginales);
            return;
        }
        
        console.log("Configurando opciones para PDF tamaño oficio...");
        
        // Configuración optimizada para formato oficio (legal)
        const opciones = {
            // Tamaño oficio: 215.9 x 355.6 mm (8.5 x 14 pulgadas)
            margin: [10, 10, 10, 10], // top, left, bottom, right en mm
            filename: `Fiscalizacion_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
            image: { 
                type: 'jpeg', 
                quality: 0.98
            },
            html2canvas: { 
                scale: 2, // Mayor escala para mejor calidad
                useCORS: true,
                logging: false,
                letterRendering: true,
                allowTaint: true,
                backgroundColor: '#FFFFFF',
                // Mejorar manejo para evitar páginas en blanco
                windowWidth: 1200, // Ancho fijo para consistencia
                removeContainer: true, // Evita problemas con contenedores temporales
                onclone: function(clonedDoc) {
                    // Ajustar elementos en el clon para mejor renderizado
                    Array.from(clonedDoc.querySelectorAll('.forced-page-break')).forEach(el => {
                        // Asegurar que los saltos de página sean respetados
                        el.style.pageBreakBefore = 'always';
                        el.style.display = 'block';
                        el.style.height = '1px'; // Hacerlo visible pero mínimo
                        el.style.margin = '0';
                        el.style.padding = '0';
                    });
                    
                    // Ajustar h2 que deberían causar salto de página
                    Array.from(clonedDoc.querySelectorAll('h2.page-title')).forEach(el => {
                        el.style.pageBreakBefore = 'always';
                    });
                }
            },
            jsPDF: { 
                unit: 'mm', 
                format: [215.9, 355.6], // Formato legal en milímetros (8.5 x 14 pulgadas)
                orientation: 'portrait',
                compress: true,
                hotfixes: ["px_scaling"], // Corregir problemas de escalado
                putTotalPages: true // Permite numeración de páginas
            },
            pagebreak: { 
                mode: ['avoid-all', 'css', 'legacy'], 
                before: '.forced-page-break, h2.page-title',
                avoid: 'tr, .avoid-break'
            }
        };
        
        console.log("Iniciando generación del PDF...");
        
        // Crear el PDF con manejo de errores mejorado
        html2pdf()
            .set(opciones)
            .from(contenido)
            .toPdf()
            .get('pdf')
            .then((pdf) => {
                // Verificar que el PDF tiene contenido adecuado
                console.log("PDF generado con tamaño en bytes:", pdf.output('arraybuffer').byteLength);
                
                if (pdf.output('arraybuffer').byteLength < 5000) {
                    console.warn("Advertencia: El PDF generado tiene un tamaño inusualmente pequeño");
                }
                
                // Guardar el PDF
                pdf.save(opciones.filename);
                console.log("PDF guardado exitosamente");
                
                // Esperar un momento antes de restaurar
                setTimeout(() => {
                    limpiarYRestaurar(estadosOriginales);
                }, 1000);
            })
            .catch(err => {
                console.error("Error generando PDF:", err);
                alert("Ocurrió un error al generar el PDF. Por favor intente nuevamente.");
                limpiarYRestaurar(estadosOriginales);
            });
    }
    
    // Restaura el documento a su estado original
    function limpiarYRestaurar(estadosOriginales = {}) {
        console.log("Restaurando el documento a su estado original...");
        
        // Eliminar el indicador de carga
        const indicador = document.getElementById('indicador-pdf-optimizado');
        if (indicador) {
            document.body.removeChild(indicador);
        }
        
        // Si no hay estados para restaurar, salimos
        if (!estadosOriginales || Object.keys(estadosOriginales).length === 0) {
            return;
        }
        
        // Restaurar botones
        if (estadosOriginales.botones) {
            estadosOriginales.botones.forEach(item => {
                item.element.style.display = item.display || '';
            });
        }
        
        // Restaurar elementos no-print
        if (estadosOriginales.noPrint) {
            estadosOriginales.noPrint.forEach(item => {
                item.element.style.display = item.display || '';
            });
        }
        
        // Restaurar secciones
        if (estadosOriginales.secciones) {
            estadosOriginales.secciones.forEach(item => {
                item.element.style.display = item.display || '';
            });
        }
        
        // Restaurar otros estilos
        if (estadosOriginales.estilosPrevios) {
            estadosOriginales.estilosPrevios.forEach(item => {
                if (item.height !== undefined) item.element.style.height = item.height;
                if (item.overflow !== undefined) item.element.style.overflow = item.overflow;
                if (item.fontSize !== undefined) item.element.style.fontSize = item.fontSize;
            });
        }
        
        console.log("Restauración completada");
    }
}

// Remplaza el botón existente con uno que usa la nueva función
function instalarBotonPDFOptimizado() {
    console.log("Instalando botón de PDF optimizado...");
    
    // Buscar todos los botones existentes que dicen "Guardar como PDF" o "Descargar PDF"
    const botonesExistentes = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.includes('PDF') || 
        btn.onclick?.toString().includes('PDF') ||
        btn.id?.includes('pdf')
    );
    
    // Modificar la funcionalidad de esos botones
    botonesExistentes.forEach(btn => {
        console.log(`Modificando botón: ${btn.textContent || btn.id}`);
        btn.onclick = generarPDFOptimizado;
        
        // Añadir un estilo más destacado
        btn.style.backgroundColor = '#28a745';
        btn.style.color = 'white';
        btn.style.fontWeight = 'bold';
        btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    });
    
    // Si no se encontraron botones, agregar uno nuevo en cada div de botones
    if (botonesExistentes.length === 0) {
        const botonesDivs = document.querySelectorAll('.botones');
        botonesDivs.forEach(div => {
            const nuevoBoton = document.createElement('button');
            nuevoBoton.type = 'button';
            nuevoBoton.textContent = 'Descargar PDF Optimizado';
            nuevoBoton.onclick = generarPDFOptimizado;
            nuevoBoton.className = 'no-print';
            nuevoBoton.id = 'btn-pdf-optimizado';
            
            // Estilo especial
            nuevoBoton.style.backgroundColor = '#28a745';
            nuevoBoton.style.color = 'white';
            nuevoBoton.style.padding = '12px 24px';
            nuevoBoton.style.fontSize = '1.1rem';
            nuevoBoton.style.fontWeight = 'bold';
            nuevoBoton.style.margin = '0 5px';
            nuevoBoton.style.border = 'none';
            nuevoBoton.style.borderRadius = '5px';
            nuevoBoton.style.cursor = 'pointer';
            nuevoBoton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            
            // Insertar al principio para que sea más visible
            div.insertBefore(nuevoBoton, div.firstChild);
        });
    }
    
    // Sobrescribir funciones existentes
    if (typeof window.guardarPDF === 'function') {
        console.log("Sobrescribiendo función guardarPDF existente");
        window.guardarPDF = generarPDFOptimizado;
    }
    
    if (typeof window.descargarPDF === 'function') {
        console.log("Sobrescribiendo función descargarPDF existente");
        window.descargarPDF = generarPDFOptimizado;
    }
    
    if (typeof window.generarPDFMejorado === 'function') {
        console.log("Sobrescribiendo función generarPDFMejorado existente");
        window.generarPDFMejorado = generarPDFOptimizado;
    }
    
    console.log("Botón de PDF optimizado instalado correctamente");
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(instalarBotonPDFOptimizado, 1000); // Esperar 1 segundo para asegurarse de que todo esté cargado
    });
} else {
    // Si el DOM ya está cargado, ejecutar directamente
    setTimeout(instalarBotonPDFOptimizado, 1000);
}

// También ejecutar cuando la ventana haya cargado completamente
window.addEventListener('load', function() {
    // Ejecutar después de un pequeño retraso para asegurarse de que otros scripts han terminado
    setTimeout(instalarBotonPDFOptimizado, 1500);
});

// Exportar las funciones para que sean accesibles
window.generarPDFOptimizado = generarPDFOptimizado;
window.instalarBotonPDFOptimizado = instalarBotonPDFOptimizado;
