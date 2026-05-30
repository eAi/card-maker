import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// A4 landscape dimensions in mm
const A4_WIDTH_MM = 297
const A4_HEIGHT_MM = 210

export async function generatePdf(element: HTMLElement, filename: string = 'card.pdf'): Promise<void> {
  // Render the element to canvas at high resolution
  const canvas = await html2canvas(element, {
    scale: 3, // Higher resolution for print quality
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
  })

  // Create PDF in landscape A4
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  // Calculate dimensions to fit the canvas into A4
  const imgWidth = A4_WIDTH_MM
  const imgHeight = A4_HEIGHT_MM

  // Add the canvas as an image
  const imgData = canvas.toDataURL('image/png')
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

  // Save the PDF
  pdf.save(filename)
}
