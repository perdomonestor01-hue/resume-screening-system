const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF report for a candidate's job match analysis
 */
async function generateCandidateReport(candidate, comparisons) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      // Collect PDF data
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(24).fillColor('#A4C4DE').text('Custom Workforce Solutions', { align: 'center' });
      doc.fontSize(12).fillColor('#666').text('Candidate Analysis Report', { align: 'center' });
      doc.moveDown();
      doc.strokeColor('#A4C4DE').lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Candidate Information
      doc.fontSize(18).fillColor('#000').text('Candidate Information');
      doc.moveDown(0.5);

      doc.fontSize(12).fillColor('#333');
      doc.text(`Name: ${candidate.name || 'N/A'}`);
      if (candidate.email) doc.text(`Email: ${candidate.email}`);
      if (candidate.phone) doc.text(`Phone: ${candidate.phone}`);
      doc.text(`Application Date: ${new Date(candidate.created_at).toLocaleDateString()}`);
      doc.text(`Source: ${candidate.source === 'email' ? 'Email Submission' : 'Web Upload'}`);
      doc.moveDown();

      // Job Comparisons
      doc.fontSize(18).fillColor('#000').text('Job Match Analysis');
      doc.moveDown(0.5);

      comparisons.forEach((comp, index) => {
        if (index > 0) doc.addPage();

        // Job Title and Score
        doc.fontSize(16).fillColor('#A4C4DE').text(`${index + 1}. ${comp.job_title}`);
        doc.moveDown(0.3);

        // Match Score with color coding
        const scoreColor = comp.match_score >= 75 ? '#10b981' : comp.match_score >= 60 ? '#f59e0b' : '#ef4444';
        doc.fontSize(14).fillColor(scoreColor).text(`Match Score: ${comp.match_score}%`);

        // Distance info if available
        if (comp.distance_miles) {
          doc.fontSize(10).fillColor('#666').text(`Distance: ${comp.distance_miles} miles (${comp.commute_description})`);
        }
        doc.moveDown();

        // Strengths
        if (comp.strengths) {
          doc.fontSize(12).fillColor('#10b981').text('✓ Strengths:');
          doc.fontSize(10).fillColor('#333').text(comp.strengths, { align: 'left' });
          doc.moveDown(0.5);
        }

        // Gaps
        if (comp.gaps) {
          doc.fontSize(12).fillColor('#ef4444').text('✗ Areas for Development:');
          doc.fontSize(10).fillColor('#333').text(comp.gaps, { align: 'left' });
          doc.moveDown(0.5);
        }

        // Recommendations
        if (comp.recommendations) {
          doc.fontSize(12).fillColor('#3b82f6').text('💡 Recommendations:');
          doc.fontSize(10).fillColor('#333').text(comp.recommendations, { align: 'left' });
          doc.moveDown(0.5);
        }

        // Detailed Analysis
        if (comp.detailed_analysis) {
          doc.fontSize(12).fillColor('#000').text('Detailed Analysis:');
          doc.fontSize(10).fillColor('#333').text(comp.detailed_analysis, { align: 'left' });
          doc.moveDown();
        }

        // Employment Gap Warning
        if (comp.employment_gap_detected) {
          doc.fontSize(11).fillColor('#f59e0b').text('⚠️ Employment Gap Detected');
          if (comp.employment_gap_details) {
            doc.fontSize(9).fillColor('#666').text(comp.employment_gap_details);
          }
          doc.moveDown();
        }
      });

      // Footer on last page
      doc.fontSize(8).fillColor('#999');
      doc.text(
        `Report generated on ${new Date().toLocaleString()}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateCandidateReport
};
