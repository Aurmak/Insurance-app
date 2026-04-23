import { jsPDF } from 'jspdf';

interface Observation {
  id: string;
  title: string;
  description: string;
  roomName: string;
  category: string;
  photo?: string;
  isObservation?: boolean;
  urgent?: boolean;
}

interface PakistanVehicleData {
  registrationNo: string;
  make: string;
  vehicleModel: string;
  registrationDate: string;
  taxPayment: string;
  engineNo: string;
  bodyType: string;
  ownerName: string;
  modelYear: string;
  seatingCapacity: string;
  cplc: string;
  safeCustody: string;
  horsePower: string;
  classOfVehicle: string;
  verified: boolean;
}

interface VehicleData {
  id?: string;
  name?: string;
  reg?: string;
  make?: string;
  model?: string;
  year?: string;
  color?: string;
  pakistanVerification?: PakistanVehicleData | null;
}

export async function generateInspectionPDF(
  vehicleName: string,
  inspectionType: string,
  inspectionDate: Date,
  observations: Observation[],
  vehicleData?: VehicleData
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add wrapped text
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number, isBold = false) => {
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return lines.length * fontSize * 0.35; // Return height used
  };

  // Get inspection type label
  const getInspectionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'pre-delivery': 'Pre-delivery inspection',
      'post-repair': 'Post-repair inspection',
      'damage-assessment': 'Damage assessment',
    };
    return labels[type] || type;
  };

  // Header
  doc.setFillColor(139, 0, 55); // PQGTL burgundy
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PQGTL Insurace', margin, 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Vehicle Inspection Report', margin, 20);

  yPosition = 35;

  // Vehicle Details Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Vehicle Details', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.setFont('helvetica', 'bold');
  doc.text('Vehicle:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(vehicleName, margin + 25, yPosition);
  yPosition += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Type:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(getInspectionTypeLabel(inspectionType), margin + 25, yPosition);
  yPosition += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(inspectionDate.toLocaleDateString(), margin + 25, yPosition);
  yPosition += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Time:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(inspectionDate.toLocaleTimeString(), margin + 25, yPosition);
  yPosition += 12;

  // Pakistani Vehicle Verification Section (if available)
  if (vehicleData?.pakistanVerification) {
    checkPageBreak(100); // Ensure enough space for verification table
    
    const pvData = vehicleData.pakistanVerification;
    
    doc.setFillColor(76, 175, 80); // Green background
    doc.rect(margin, yPosition, contentWidth, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Pakistan Excise & Taxation Verification', margin + 2, yPosition + 5.5);
    yPosition += 8;
    
    // Draw verification table
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.3);
    
    const tableData = [
      ['Registration No', pvData.registrationNo],
      ['Make', pvData.make],
      ['Vehicle Model', pvData.vehicleModel],
      ['Model Year', pvData.modelYear],
      ['Body Type', pvData.bodyType],
      ['Engine No', pvData.engineNo],
      ['Owner Name', pvData.ownerName],
      ['Registration Date', pvData.registrationDate],
      ['Tax Payment', pvData.taxPayment],
      ['Seating Capacity', pvData.seatingCapacity],
      ['Horse Power', pvData.horsePower],
      ['Class of Vehicle', pvData.classOfVehicle],
      ['CPLC Status', pvData.cplc],
      ['Safe Custody', pvData.safeCustody],
    ];
    
    const rowHeight = 7;
    const labelWidth = contentWidth * 0.4;
    const valueWidth = contentWidth * 0.6;
    
    tableData.forEach((row, index) => {
      const isHighlighted = row[0] === 'CPLC Status' || row[0] === 'Safe Custody';
      
      // Alternating background
      if (index % 2 === 0) {
        doc.setFillColor(249, 249, 249);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      
      // Highlight CPLC and Safe Custody rows in green
      if (isHighlighted) {
        doc.setFillColor(212, 237, 218);
      }
      
      doc.rect(margin, yPosition, contentWidth, rowHeight, 'F');
      doc.rect(margin, yPosition, contentWidth, rowHeight, 'S');
      doc.rect(margin, yPosition, labelWidth, rowHeight, 'S');
      
      // Label
      doc.setFont('helvetica', 'bold');
      if (isHighlighted) {
        doc.setTextColor(21, 87, 36);
      } else {
        doc.setTextColor(95, 99, 104);
      }
      doc.text(row[0], margin + 2, yPosition + 4.5);
      
      // Value
      doc.setFont('helvetica', 'normal');
      if (isHighlighted) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(21, 87, 36);
      } else {
        doc.setTextColor(0, 0, 0);
      }
      doc.text(row[1], margin + labelWidth + 2, yPosition + 4.5);
      
      yPosition += rowHeight;
    });
    
    yPosition += 10;
  }

  // Summary Section
  checkPageBreak(40);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, yPosition);
  yPosition += 8;

  const requiresAttentionCount = observations.filter(o => !o.isObservation).length;
  const noActionRequiredCount = observations.filter(o => o.isObservation).length;

  // Summary boxes
  const boxWidth = (contentWidth - 10) / 3;
  const boxHeight = 20;

  // Total Observations Box
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, boxWidth, boxHeight, 'F');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(observations.length.toString(), margin + boxWidth / 2, yPosition + 10, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Total observations', margin + boxWidth / 2, yPosition + 16, { align: 'center' });

  // Requires Attention Box
  doc.setFillColor(255, 243, 224);
  doc.rect(margin + boxWidth + 5, yPosition, boxWidth, boxHeight, 'F');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(237, 108, 2); // Orange color for requires attention
  doc.text(requiresAttentionCount.toString(), margin + boxWidth + 5 + boxWidth / 2, yPosition + 10, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Requires attention', margin + boxWidth + 5 + boxWidth / 2, yPosition + 16, { align: 'center' });

  // No Action Required Box
  doc.setFillColor(237, 247, 237);
  doc.rect(margin + (boxWidth + 5) * 2, yPosition, boxWidth, boxHeight, 'F');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(46, 125, 50); // Green color for no action required
  doc.text(noActionRequiredCount.toString(), margin + (boxWidth + 5) * 2 + boxWidth / 2, yPosition + 10, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('No action required', margin + (boxWidth + 5) * 2 + boxWidth / 2, yPosition + 16, { align: 'center' });

  yPosition += boxHeight + 15;

  // All Observations Section
  checkPageBreak(40);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('All Observations', margin, yPosition);
  yPosition += 10;

  // Iterate through observations
  for (let i = 0; i < observations.length; i++) {
    const observation = observations[i];
    const estimatedHeight = 70; // Estimated height for observation card
    
    checkPageBreak(estimatedHeight);

    const cardStartY = yPosition;

    // Draw card border with left accent
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    
    // Left accent bar
    if (observation.isObservation) {
      doc.setFillColor(76, 175, 80); // Green for no action required
    } else {
      doc.setFillColor(255, 152, 0); // Orange for requires attention
    }
    doc.rect(margin, cardStartY, 3, 60, 'F');

    // Card background
    if (observation.isObservation) {
      doc.setFillColor(241, 248, 244); // Light green background
    } else {
      doc.setFillColor(255, 255, 255); // White background
    }
    doc.rect(margin + 3, cardStartY, contentWidth - 3, 60, 'FD');

    let cardY = cardStartY + 5;

    // Add photo if available
    if (observation.photo) {
      try {
        // Add image - centered and scaled
        const imgWidth = 40;
        const imgHeight = 30;
        const imgX = margin + 5;
        doc.addImage(observation.photo, 'JPEG', imgX, cardY, imgWidth, imgHeight);
        cardY = cardStartY + 5; // Reset Y for text next to image
      } catch (error) {
        console.error('Error adding image to PDF:', error);
      }
    }

    // Title and status badge (right of image or at start if no image)
    const textStartX = observation.photo ? margin + 50 : margin + 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(observation.title, textStartX, cardY + 5);

    // Status badge
    const statusText = observation.isObservation ? 'No Action Required' : 'Requires Attention';
    const statusWidth = doc.getTextWidth(statusText) + 6;
    const statusX = textStartX + doc.getTextWidth(observation.title) + 5;
    
    if (observation.isObservation) {
      doc.setFillColor(76, 175, 80);
    } else {
      doc.setFillColor(255, 152, 0);
    }
    doc.roundedRect(statusX, cardY + 1, statusWidth, 5, 1, 1, 'F');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(statusText, statusX + 3, cardY + 4);

    cardY += 10;

    // Area
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Area:', textStartX, cardY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(95, 99, 104);
    doc.text(observation.roomName, textStartX + 12, cardY);
    cardY += 6;

    // Category badge
    const categoryWidth = doc.getTextWidth(observation.category) + 6;
    doc.setFillColor(60, 64, 67);
    doc.roundedRect(textStartX, cardY - 3, categoryWidth, 5, 1, 1, 'F');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(observation.category, textStartX + 3, cardY);
    cardY += 8;

    // Description
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    const descWidth = contentWidth - (textStartX - margin) - 10;
    const lines = doc.splitTextToSize(observation.description, descWidth);
    doc.text(lines, textStartX, cardY);

    yPosition = cardStartY + 65; // Move to next observation
  }

  // Footer on last page
  const footerY = pageHeight - 10;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated by PQGTL Insurace on ${new Date().toLocaleDateString()}`, margin, footerY);
  doc.text(`Page ${doc.internal.pages.length - 1}`, pageWidth - margin, footerY, { align: 'right' });

  // Save the PDF
  const fileName = `Inspection_${vehicleName.replace(/\s+/g, '_')}_${inspectionDate.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
