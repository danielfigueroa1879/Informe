/**
 * Función actualizada para reducir significativamente todos los títulos, 
 * enumeraciones y encabezados en el PDF exportado
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
  
  // Definir estilos específicos para impresión y PDF
  // NOTA: Hemos reducido significativamente todos los tamaños de fuente
  // incluidos los títulos y elementos enumerados
  estilosPDF.textContent = `
    @media print {
      /* Reducir tamaño de texto general - AHORA MÁS PEQUEÑO */
      body, p, td, th, li, span, div {
        font-size: 7pt !important;
        line-height: 1.2 !important;
      }
      
      /* Reducir SIGNIFICATIVAMENTE tamaño de encabezados */
      h1 {
        font-size: 10pt !important;
        margin-bottom: 8pt !important;
        margin-top: 8pt !important;
      }
      
      h2 {
        font-size: 9pt !important;
        margin-top: 12pt !important;
        margin-bottom: 6pt !important;
      }
      
      h3 {
        font-size: 8pt !important;
        margin-top: 10pt !important;
        margin-bottom: 5pt !important;
      }
      
      /* Reducir TODOS los títulos, incluyendo los numerados */
      h1, h2, h3, h4, h5, h6, 
      .header-row th, th, 
      .result, 
      .titulo-seccion,
      .titulo-principal,
      strong, b {
        font-size: 8pt !important;
      }
      
      /* Encabezados específicos más pequeños */
      .header-row th {
        padding: 3pt !important;
        font-size: 7pt !important;
        font-weight: bold !important;
      }
      
      /* Reducir tamaño de los elementos en tablas */
      table {
        font-size: 7pt !important;
        margin-bottom: 10pt !important;
      }
      
      th, td {
        padding: 2pt !important;
        font-size: 6pt !important;
      }
      
      /* Reducir tamaño y espacio en listas y enumeraciones */
      ul, ol {
        margin: 3pt 0 !important;
        padding-left: 12pt !important;
      }
      
      li {
        font-size: 6pt !important;
        margin: 1pt 0 !important;
        line-height: 1.1 !important;
      }
      
      /* Reducir tamaño de texto en las áreas de observaciones */
      textarea, .textarea-contenido-pdf {
        font-size: 6pt !important;
        line-height: 1.1 !important;
        padding: 2pt !important;
        min-height: 30pt !important;
      }
      
      /* Reducir espacio entre elementos */
      .info-section, .summary {
        padding: 6pt !important;
        margin-bottom: 8pt !important;
      }
      
      /* Reducir tamaño de elementos en el resumen */
      #resumen-automatico, .resumen-seccion {
        font-size: 6pt !important;
      }
      
      #resumen-automatico strong {
        font-size: 6pt !important;
      }
      
      #resumen-automatico ul, 
      #resumen-automatico ul li, 
      #resumen-automatico ul ul li {
        font-size: 6pt !important;
        margin: 1pt 0 !important;
        line-height: 1.1 !important;
      }
      
      .no-cumple-tag {
        font-size: 5pt !important;
      }
      
      /* Reducir el espacio del editor de texto enriquecido */
      #plan-accion-editor, .rich-text-editor {
        font-size: 7pt !important;
        line-height: 1.1 !important;
      }
      
      /* Reducir las info-section y elementos clave */
      .info-section p {
        font-size: 7pt !important;
        margin: 3pt 0 !important;
      }
      
      .info-section p strong {
        font-size: 7pt !important;
      }
      
      /* Reducir tamaño de la sección de resultados */
      .resultados-compacto h3 {
        font-size: 8pt !important;
        margin: 6pt 0 3pt 0 !important;
      }
      
      .resultados-compacto p, .resultados-info p {
        font-size: 6pt !important;
        margin: 2pt 0 !important;
      }
      
      .result {
        font-size: 9pt !important;
        padding: 6pt !important;
        margin: 6pt 0 !important;
      }
      
      /* Reducir espacio entre filas de tabla */
      tr {
        line-height: 1.1 !important;
      }
      
      /* Reducir márgenes de página */
      @page {
        margin: 10mm 8mm !important;
      }
      
      /* Asegurar que los colores y fondos se impriman correctamente */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }
  `;
  
  console.log('Estilos para reducir SIGNIFICATIVAMENTE TODOS los títulos y texto en PDF aplicados.');
}
