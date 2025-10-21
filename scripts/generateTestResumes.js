const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate test PDF resumes for the screening system
 */

// Ensure test-resumes directory exists
const outputDir = path.join(__dirname, '..', 'test-resumes');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper function to create a PDF resume
function createResume(filename, data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const outputPath = path.join(outputDir, filename);
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text(data.name, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica')
      .text(`${data.phone} | ${data.email} | ${data.location}`, { align: 'center' });
    doc.moveDown(1);

    // Professional Summary
    if (data.summary) {
      doc.fontSize(14).font('Helvetica-Bold').text('PROFESSIONAL SUMMARY');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').text(data.summary, { align: 'justify' });
      doc.moveDown(1);
    }

    // Skills
    if (data.skills && data.skills.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('SKILLS');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');
      data.skills.forEach(skill => {
        doc.text(`• ${skill}`, { indent: 20 });
      });
      doc.moveDown(1);
    }

    // Work Experience
    if (data.experience && data.experience.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('WORK EXPERIENCE');
      doc.moveDown(0.5);

      data.experience.forEach((job, index) => {
        doc.fontSize(12).font('Helvetica-Bold').text(job.title);
        doc.fontSize(10).font('Helvetica-Oblique')
          .text(`${job.company} | ${job.location} | ${job.dates}`);
        doc.moveDown(0.3);
        doc.font('Helvetica');
        job.responsibilities.forEach(resp => {
          doc.text(`• ${resp}`, { indent: 20 });
        });
        if (index < data.experience.length - 1) doc.moveDown(0.7);
      });
      doc.moveDown(1);
    }

    // Certifications
    if (data.certifications && data.certifications.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('CERTIFICATIONS');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');
      data.certifications.forEach(cert => {
        doc.text(`• ${cert}`, { indent: 20 });
      });
      doc.moveDown(1);
    }

    // Education
    if (data.education) {
      doc.fontSize(14).font('Helvetica-Bold').text('EDUCATION');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').text(data.education);
    }

    doc.end();
    stream.on('finish', () => {
      console.log(`✅ Created: ${filename}`);
      resolve();
    });
    stream.on('error', reject);
  });
}

// Resume 1: HIGH MATCH - Experienced CNC Operator (80-90% match)
const resume1 = {
  name: 'Sarah Chen',
  phone: '(555) 234-5678',
  email: 'sarah.chen@email.com',
  location: 'Milwaukee, WI',
  summary: 'Skilled CNC Machine Operator with 4+ years of experience operating Haas and Fanuc-controlled machining centers. Proven track record of maintaining tight tolerances, reading complex blueprints, and contributing to continuous improvement initiatives. Strong safety record with OSHA 10 certification and zero lost-time incidents.',
  skills: [
    'CNC Lathe & Mill Operation (Haas, Fanuc, Mazak)',
    'Blueprint Reading & GD&T Interpretation',
    'Precision Measuring Tools (Micrometers, Calipers, Height Gauges)',
    'Basic G-code Programming & Editing',
    'First Article & In-Process Inspection',
    'Lean Manufacturing & 5S Implementation',
    'Forklift Operation (Certified)',
    'Quality Control & SPC Charting'
  ],
  experience: [
    {
      title: 'CNC Machine Operator',
      company: 'Precision Manufacturing Inc.',
      location: 'Milwaukee, WI',
      dates: 'March 2020 - Present',
      responsibilities: [
        'Operate 3 & 4-axis CNC milling machines producing aerospace components to ±0.001" tolerances',
        'Read and interpret complex blueprints, engineering drawings, and work instructions',
        'Perform first article inspections and document results using CMM and manual measuring tools',
        'Load CNC programs, set tool offsets, and make minor G-code edits to optimize cycle times',
        'Maintain 99.8% on-time delivery and <0.5% scrap rate over 3 years',
        'Train 4 new operators on machine setup, quality procedures, and safety protocols',
        'Participated in kaizen events that reduced setup time by 25%'
      ]
    },
    {
      title: 'CNC Operator / Setup Assistant',
      company: 'Metro Machine Works',
      location: 'Milwaukee, WI',
      dates: 'June 2018 - March 2020',
      responsibilities: [
        'Operated CNC lathes producing high-volume automotive parts',
        'Assisted senior setup technicians with tool changes and offset adjustments',
        'Performed routine preventive maintenance including coolant changes and chip removal',
        'Conducted in-process inspections every 50 parts to ensure quality standards',
        'Achieved "Operator of the Quarter" twice for quality and productivity'
      ]
    }
  ],
  certifications: [
    'OSHA 10-Hour General Industry Safety',
    'Forklift Operator Certification (Current)',
    'Blueprint Reading Certificate - Milwaukee Area Technical College',
    'Lean Manufacturing Green Belt'
  ],
  education: 'High School Diploma, Bay View High School, Milwaukee, WI (2018)\nCNC Machine Technology Certificate, Milwaukee Area Technical College (2019)'
};

// Resume 2: MEDIUM MATCH - Production Worker with Some Skills (60-75% match)
const resume2 = {
  name: 'Marcus Johnson',
  phone: '(555) 876-5432',
  email: 'm.johnson84@email.com',
  location: 'Green Bay, WI',
  summary: 'Reliable production worker with 3 years of manufacturing experience in fast-paced environments. Background in assembly, quality inspection, and material handling. Strong work ethic with excellent attendance record. Seeking to transition into CNC operation or skilled machining roles.',
  skills: [
    'Assembly Line Operations',
    'Basic Quality Inspection & Gauging',
    'Hand Tools & Power Tools',
    'Inventory Control & Material Handling',
    'Forklift & Pallet Jack Operation',
    'Basic Computer Skills (Excel, Work Orders)',
    'Team Collaboration',
    'Safety Procedures & PPE Compliance'
  ],
  experience: [
    {
      title: 'Production Assembler',
      company: 'Green Bay Assembly Solutions',
      location: 'Green Bay, WI',
      dates: 'January 2021 - Present',
      responsibilities: [
        'Assemble small mechanical components following work instructions and diagrams',
        'Perform visual quality checks and basic dimensional measurements with calipers',
        'Operate hand tools including drills, impact wrenches, and torque drivers',
        'Maintain production rate of 95-100% of standard while ensuring zero defects',
        'Cross-trained on 5 different assembly stations',
        'Perfect attendance for 18 consecutive months',
        'Assist with training new hires on safety and assembly procedures'
      ]
    },
    {
      title: 'Warehouse Associate / Material Handler',
      company: 'Northeast Distribution Center',
      location: 'Green Bay, WI',
      dates: 'August 2019 - December 2020',
      responsibilities: [
        'Operated sit-down and stand-up forklifts to move materials throughout facility',
        'Picked and staged materials for production lines using RF scanners',
        'Conducted cycle counts and maintained inventory accuracy',
        'Loaded and unloaded delivery trucks safely and efficiently',
        'Followed OSHA safety guidelines and warehouse 5S standards'
      ]
    }
  ],
  certifications: [
    'Forklift Operator Certification (Current)',
    'OSHA 10-Hour General Industry Safety (Completed 2020)',
    'First Aid & CPR Certified'
  ],
  education: 'High School Diploma, Preble High School, Green Bay, WI (2019)'
};

// Resume 3: LOWER MATCH - Entry Level with Minimal Experience (40-55% match)
const resume3 = {
  name: 'Tyler Anderson',
  phone: '(555) 123-9876',
  email: 'tyler.anderson22@email.com',
  location: 'Kenosha, WI',
  summary: 'Motivated recent high school graduate seeking entry-level position in manufacturing. Strong mechanical aptitude demonstrated through automotive shop classes and personal vehicle maintenance projects. Quick learner with excellent attendance and willingness to work any shift.',
  skills: [
    'Basic Hand Tools',
    'Mechanical Aptitude',
    'Computer Skills (Microsoft Office, Email)',
    'Reliable Transportation',
    'Team Player & Good Communicator',
    'Willing to Learn New Skills',
    'Physical Stamina - Can Lift 50+ lbs'
  ],
  experience: [
    {
      title: 'Retail Associate (Part-Time)',
      company: 'AutoZone',
      location: 'Kenosha, WI',
      dates: 'June 2023 - Present',
      responsibilities: [
        'Assist customers with automotive parts and product selection',
        'Stock shelves and maintain organized inventory',
        'Operate cash register and process transactions',
        'Load heavy parts and batteries for customers (up to 75 lbs)',
        'Maintain clean and safe work environment',
        'Recognized for excellent customer service and attendance'
      ]
    },
    {
      title: 'Landscaping Laborer (Summer)',
      company: "Martinez Landscaping",
      location: 'Kenosha, WI',
      dates: 'Summers 2021 & 2022',
      responsibilities: [
        'Performed lawn maintenance including mowing, trimming, and edging',
        'Operated commercial lawn equipment and power tools safely',
        'Loaded and unloaded landscaping materials from trucks',
        'Worked outdoors in various weather conditions',
        'Followed supervisor instructions and completed tasks efficiently'
      ]
    }
  ],
  certifications: [
    'High School Automotive Shop Completion Certificate'
  ],
  education: 'High School Diploma, Bradford High School, Kenosha, WI (2023)\nCoursework: Automotive Technology, Metal Shop, Industrial Arts'
};

// Generate all PDFs
async function generateAll() {
  console.log('🔨 Generating test PDF resumes...\n');

  try {
    await createResume('high-match-cnc-operator.pdf', resume1);
    await createResume('medium-match-production-worker.pdf', resume2);
    await createResume('entry-level-candidate.pdf', resume3);

    console.log('\n✅ All test resumes generated successfully!');
    console.log(`📁 Location: ${outputDir}`);
    console.log('\nTest these PDFs by:');
    console.log('1. Go to http://localhost:3000');
    console.log('2. Upload each PDF to see AI comparison results');
    console.log('\nExpected match scores:');
    console.log('  • high-match-cnc-operator.pdf → 80-90% match to CNC Operator job');
    console.log('  • medium-match-production-worker.pdf → 60-75% match');
    console.log('  • entry-level-candidate.pdf → 40-55% match');
  } catch (error) {
    console.error('❌ Error generating PDFs:', error);
  }
}

generateAll();
