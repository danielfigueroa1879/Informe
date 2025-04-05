/**
 * Solución radical para texto extremadamente microscópico en PDF
 * ADVERTENCIA: Esto hará que el texto sea apenas visible
 */

// Función principal para aplicar texto microscópico
function aplicarTextoMicroscopico() {
  console.log("Aplicando configuración de texto microscópico para PDF...");
  
  // 1. Crear estilos radicales para tamaño microscópico
  let estilosMicroscopicos = document.getElementById('estilos-microscopicos-pdf');
  if (!estilosMicroscopicos) {
    estilosMicroscopicos = document.createElement('style');
    estilosMicroscopicos.id = 'estilos-microscopicos-pdf';
    document.head.appendChild(estilosMicroscopicos);
  }
  
  // Configuración extrema - tamaños increíblemente pequeños
  estilosMicroscopicos.textContent = `
    @media print {
      /* Regla general para todos los elementos */
      * {
        font-size: 0.5pt !important;
        line-height: 0.6 !important;
        letter-spacing: -0.1pt !important;
        word-spacing: -0.1pt !important;
        margin: 0 !important;
        padding: 0 !important;
        border-width: 0.1pt !important;
      }
      
      /* Texto normal extremadamente pequeño */
      body, p, td, th, li, span, div, input, textarea, label {
        font-size: 0.5pt !important;
        line-height: 0.6 !important;
        transform: scale(0.8);
        transform-origin: left top;
      }
      
      /* Títulos microscópicos */
      h1 {
        font-size: 1pt !important;
        margin: 0.5pt 0 !important;
        transform: scale(0.8);
      }
      
      h2 {
        font-size: 0.8pt !important;
        margin: 0.4pt 0 !important;
        transform: scale(0.8);
      }
      
      h3 {
        font-size: 0.7pt !important;
        margin: 0.3pt 0 !important;
        transform: scale(0.8);
      }
      
      h4, h5, h6 {
        font-size: 0.6pt !important;
        margin: 0.2pt 0 !important;
        transform: scale(0.8);
      }
      
      /* Tablas con tamaño mínimo */
      table {
        font-size: 0.5pt !important;
        margin: 0.5pt 0 !important;
        border-collapse: collapse !important;
        border-spacing: 0 !important;
        transform: scale(0.8);
      }
      
      th, td {
        padding: 0.1pt !important;
        font-size: 0.5pt !important;
        border-width: 0.1pt !important;
      }
      
      /* Compresión extrema del documento */
      .container {
        transform: scale(0.7) !important;
        transform-origin: top left !important;
        width: 140% !important;
        max-width: 140% !important;
      }
      
      /* Márgenes de página mínimos */
      @page {
        margin: 0.5mm !important;
        size: legal !important;
      }
      
      /* Eliminar espacios entre elementos */
      .info-section, .summary, .resumen-seccion {
        padding: 0.1pt !important;
        margin: 0.1pt 0 !important;
      }
      
      /* Reducir al mínimo los inputs */
      input[type="radio"], input[type="checkbox"] {
        width: 2px !important;
        height: 2px !important;
      }
      
      /* Preservar colores */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* Reducir altura de filas */
      tr {
        height: auto !important;
        line-height: 0.6 !important;
      }
      
      /* Comprimir imágenes y media */
      img, .foto-marco, .preview-imagen {
        max-height: 100px !important;
        transform: scale(0.8);
      }
    }
  `;
  
  // 2. Aplicar transformaciones directamente a los elementos
  function aplicarEstilosDirectos() {
    // Función para aplicar estilos inline a todos los elementos
    function aplicarEstilosInline(selector, estilos) {
      document.querySelectorAll(selector).forEach(el => {
        Object.keys(estilos).forEach(prop => {
          el.style[prop] = estilos[prop];
        });
      });
    }
    
    // Aplicar a diferentes tipos de elementos
    aplicarEstilosInline('body *', {
      fontSize: '0.5pt',
      lineHeight: '0.6',
      margin: '0',
      padding: '0',
      letterSpacing: '-0.1pt',
      wordSpacing: '-0.1pt'
    });
    
    aplicarEstilosInline('h1', {
      fontSize: '1pt',
      transform: 'scale(0.8)',
      transformOrigin: 'left top'
    });
    
    aplicarEstilosInline('h2', {
      fontSize: '0.8pt',
      transform: 'scale(0.8)',
      transformOrigin: 'left top'
    });
    
    aplicarEstilosInline('h3', {
      fontSize: '0.7pt',
      transform: 'scale(0.8)',
      transformOrigin: 'left top'
    });
    
    aplicarEstilosInline('table', {
      borderCollapse: 'collapse',
      borderSpacing: '0',
      fontSize: '0.5pt',
      transform: 'scale(0.8)',
      transformOrigin: 'left top'
    });
    
    aplicarEstilosInline('th, td', {
      padding: '0.1pt',
      fontSize: '0.5pt',
      borderWidth: '0.1pt'
    });
    
    // Aplicar transformación al contenedor principal
    const container = document.querySelector('.container');
    if (container) {
      container.style.transform = 'scale(0.7)';
      container.style.transformOrigin = 'top left';
      container.style.width = '140%';
      container.style.maxWidth = '140%';
    }
  }
  
  // 3. Modificar el comportamiento de impresión
  function modificarImpresion() {
    // Guardar la función original
    const originalPrint = window.print;
    
    // Sobrescribir con nuestra versión que aplica estilos microscópicos
    window.print = function() {
      console.log("Interceptando impresión para aplicar texto microscópico...");
      aplicarEstilosDirectos();
      
      // Dar tiempo para que se apliquen los cambios
      setTimeout(function() {
        originalPrint.call(window);
      }, 100);
    };
  }
  
  // 4. Modificar funciones específicas de generación de PDF
  function modificarGeneracionPDF() {
    // Si existe html2pdf
    if (typeof window.html2pdf !== 'undefined') {
      const originalHtml2pdf = window.html2pdf;
      
      window.html2pdf = function() {
        console.log("Interceptando html2pdf para aplicar texto microscópico...");
        aplicarEstilosDirectos();
        
        // Modificar opciones para reducir más el tamaño
        const args = Array.from(arguments);
        if (args[0] && typeof args[0] === 'object') {
          const options = args[0];
          if (options.jsPDF) {
            options.jsPDF.scale = 0.5;
            options.jsPDF.compress = true;
          }
          if (options.html2canvas) {
            options.html2canvas.scale = 0.5;
          }
        }
        
        return originalHtml2pdf.apply(this, args);
      };
    }
    
    // Si existe alguna de las funciones conocidas para generar PDF
    ['generarPDFCorregido', 'generarPDFMejorado', 'guardarPDF', 'descargarPDF'].forEach(funcName => {
      if (typeof window[funcName] === 'function') {
        const originalFn = window[funcName];
        
        window[funcName] = function() {
          console.log(`Interceptando ${funcName} para aplicar texto microscópico...`);
          aplicarEstilosDirectos();
          
          return originalFn.apply(this, arguments);
        };
      }
    });
  }
  
  // 5. Aplicar cuando se va a imprimir
  window.addEventListener('beforeprint', function() {
    console.log("Evento beforeprint activado - aplicando estilos microscópicos");
    aplicarEstilosDirectos();
  });
  
  // Ejecutar todas las modificaciones
  aplicarEstilosDirectos();
  modificarImpresion();
  modificarGeneracionPDF();
  
  // Aplicar dimensiones mínimas a la página
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    metaViewport.content = 'width=device-width, initial-scale=0.7, maximum-scale=0.7, user-scalable=0';
  }
  
  console.log("Configuración de texto microscópico aplicada con éxito");
}

// Ejecutar ahora
aplicarTextoMicroscopico();

// Ejecutar cada vez que se cargue un recurso, para asegurar que se aplique
window.addEventListener('load', aplicarTextoMicroscopico);

// Intentar aplicarlo después de un tiempo para asegurar compatibilidad
setTimeout(aplicarTextoMicroscopico, 1000);
