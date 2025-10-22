const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Ensure test-resumes directory exists
const outputDir = path.join(__dirname, '..', 'test-resumes');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// HTML template function
function createResumeHTML(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { margin: 0.5in; }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      margin: 0;
      padding: 20px;
      line-height: 1.5;
      color: #333;
      font-size: 11pt;
    }
    h1 {
      font-size: 24pt;
      margin: 0 0 5px 0;
      text-align: center;
      color: #1a1a1a;
      font-weight: bold;
    }
    .contact {
      text-align: center;
      font-size: 10pt;
      margin-bottom: 20px;
      color: #555;
    }
    h2 {
      font-size: 12pt;
      margin: 18px 0 8px 0;
      padding-bottom: 3px;
      border-bottom: 2px solid #333;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: bold;
    }
    .summary {
      font-size: 10.5pt;
      margin-bottom: 15px;
      text-align: justify;
    }
    .job {
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .job-title {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .job-company {
      font-size: 10pt;
      font-style: italic;
      color: #555;
      margin-bottom: 5px;
    }
    .job-responsibilities {
      font-size: 10pt;
      margin: 5px 0;
      padding-left: 20px;
    }
    .job-responsibilities li {
      margin-bottom: 3px;
    }
    .education-item {
      margin-bottom: 8px;
      font-size: 10pt;
    }
    .education-degree {
      font-weight: bold;
    }
    .skills-text {
      font-size: 10pt;
      line-height: 1.6;
    }
    .certifications ul {
      font-size: 10pt;
      margin: 5px 0;
      padding-left: 20px;
    }
    .certifications li {
      margin-bottom: 3px;
    }
    .footer {
      text-align: center;
      font-size: 9pt;
      font-style: italic;
      color: #777;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <h1>${data.name}</h1>
  <div class="contact">
    ${data.phone} | ${data.email}<br>
    ${data.location}
  </div>

  ${data.summary ? `
  <h2>Professional Objective</h2>
  <div class="summary">${data.summary}</div>
  ` : ''}

  ${data.experience && data.experience.length > 0 ? `
  <h2>Professional Experience</h2>
  ${data.experience.map(job => `
    <div class="job">
      <div class="job-title">${job.title}</div>
      <div class="job-company">${job.company} - ${job.location} | ${job.dates}</div>
      <ul class="job-responsibilities">
        ${job.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
      </ul>
    </div>
  `).join('')}
  ` : ''}

  ${data.education && data.education.length > 0 ? `
  <h2>Education</h2>
  ${data.education.map(edu => `
    <div class="education-item">
      <div class="education-degree">${edu.degree}</div>
      <div>${edu.school} - ${edu.year}</div>
    </div>
  `).join('')}
  ` : ''}

  ${data.skills && data.skills.length > 0 ? `
  <h2>Skills & Competencies</h2>
  <div class="skills-text">${data.skills.join(' • ')}</div>
  ` : ''}

  ${data.certifications && data.certifications.length > 0 ? `
  <h2>Certifications & Training</h2>
  <div class="certifications">
    <ul>
      ${data.certifications.map(cert => `<li>${cert}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="footer">References available upon request</div>
</body>
</html>
  `;
}

// Resume data
const resumes = [
  {
    filename: '01_michael_johnson_cnc_operator.pdf',
    name: 'Michael Johnson',
    phone: '(214) 555-0142',
    email: 'michael.johnson@email.com',
    location: '4823 Maple Avenue, Dallas, TX 75201',
    summary: 'Experienced CNC Machine Operator with 3+ years of precision manufacturing experience seeking to contribute technical expertise and quality craftsmanship to a growing production team.',
    experience: [
      {
        title: 'CNC Machine Operator',
        company: 'Precision Parts Manufacturing',
        location: 'Dallas, TX',
        dates: 'March 2021 - Present',
        responsibilities: [
          'Operate CNC lathes and milling machines to produce precision parts within tolerances of ±0.001"',
          'Read and interpret complex blueprints, technical drawings, and G-code programs',
          'Perform first article inspections using calipers, micrometers, and CMM equipment',
          'Maintain detailed production logs and quality control documentation',
          'Train 5+ new operators on machine setup and safety procedures',
          'Achieved 99.8% quality rating with zero safety incidents in 2+ years'
        ]
      },
      {
        title: 'Machine Operator',
        company: 'Texas Industrial Components',
        location: 'Garland, TX',
        dates: 'June 2019 - February 2021',
        responsibilities: [
          'Operated manual lathes and milling machines for prototype production',
          'Performed routine maintenance and minor repairs on production equipment',
          'Collaborated with engineering team to improve manufacturing processes'
        ]
      }
    ],
    education: [
      { degree: 'Certificate in CNC Machining Technology', school: 'Dallas County Community College', year: '2019' },
      { degree: 'High School Diploma', school: 'Thomas Jefferson High School', year: '2017' }
    ],
    skills: [
      'CNC Lathe & Mill Operation', 'Blueprint Reading', 'Precision Measurement', 'G-code Programming',
      'Quality Control', 'Fanuc & Haas Controls', 'OSHA Safety', 'Preventive Maintenance'
    ],
    certifications: [
      'NIMS CNC Milling Level 1 Certification',
      'OSHA 10-Hour General Industry Safety',
      'Forklift Operator Certification'
    ]
  },
  {
    filename: '02_carlos_rodriguez_reach_truck.pdf',
    name: 'Carlos Rodriguez',
    phone: '(972) 555-0198',
    email: 'carlos.rodriguez78@email.com',
    location: '1456 Warehouse Drive, Mesquite, TX 75150',
    summary: 'Safety-focused Reach Truck Operator with 4 years of warehouse experience and proven track record of accuracy in high-volume distribution environments.',
    experience: [
      {
        title: 'Reach Truck Operator',
        company: 'DFW Logistics Distribution Center',
        location: 'Mesquite, TX',
        dates: 'January 2020 - Present',
        responsibilities: [
          'Operate reach trucks and order pickers in narrow aisle warehouse (30+ ft high racks)',
          'Load and unload trailers, averaging 200+ pallets per shift with 99.9% accuracy',
          'Perform cycle counts and inventory verification using RF scanners',
          'Maintain equipment through daily pre-shift inspections and minor repairs',
          'Consistently exceed productivity targets by 15-20% while maintaining safety standards',
          'Zero accidents or product damage incidents in 4+ years of operation',
          'Train new operators on equipment safety and warehouse procedures'
        ]
      },
      {
        title: 'Forklift Operator',
        company: 'Metro Warehouse Solutions',
        location: 'Dallas, TX',
        dates: 'May 2018 - December 2019',
        responsibilities: [
          'Operated sit-down forklifts for loading/unloading and staging operations',
          'Maintained accurate inventory records using WMS software',
          'Assisted with physical inventory counts and discrepancy resolution'
        ]
      }
    ],
    education: [
      { degree: 'High School Diploma', school: 'North Mesquite High School', year: '2017' }
    ],
    skills: [
      'Reach Truck Operation', 'Order Picker Operation', 'Stand-up Forklift', 'RF Scanner & WMS',
      'Inventory Management', 'OSHA Safety', 'Narrow Aisle Navigation', 'Bilingual (English/Spanish)'
    ],
    certifications: [
      'Reach Truck Operator Certification (Renewed 2024)',
      'Order Picker Certification',
      'Sit-Down Forklift Certification',
      'OSHA 10-Hour Warehouse Safety',
      'Hazmat Awareness Training'
    ]
  },
  {
    filename: '03_david_martinez_mig_welder.pdf',
    name: 'David Martinez',
    phone: '(817) 555-0234',
    email: 'david.martinez.welder@email.com',
    location: '2891 Industrial Parkway, Fort Worth, TX 76111',
    summary: 'AWS-certified MIG Welder with 5+ years of structural steel fabrication experience seeking to apply advanced welding skills and quality craftsmanship in a challenging production environment.',
    experience: [
      {
        title: 'MIG Welder',
        company: 'Lone Star Steel Fabrication',
        location: 'Fort Worth, TX',
        dates: 'August 2019 - Present',
        responsibilities: [
          'Perform MIG welding on structural steel components for commercial construction projects',
          'Read and interpret complex welding blueprints, symbols, and specifications',
          'Weld various materials including carbon steel, stainless steel, and aluminum',
          'Conduct visual inspections and maintain weld quality to AWS D1.1 standards',
          'Operate plasma cutters, grinders, and other metal fabrication equipment',
          'Passed all weld tests including vertical, overhead, and horizontal positions',
          'Maintain 98%+ first-pass inspection rate on critical structural welds'
        ]
      },
      {
        title: 'Welder Helper / Junior Welder',
        company: 'Texas Metal Works',
        location: 'Arlington, TX',
        dates: 'March 2017 - July 2019',
        responsibilities: [
          'Assisted senior welders with material preparation and fixture setup',
          'Performed tack welding and basic MIG welding on non-critical components',
          'Learned advanced welding techniques through mentorship program',
          'Maintained clean and organized work area following 5S principles'
        ]
      }
    ],
    education: [
      { degree: 'Welding Technology Certificate', school: 'Tarrant County College - Advanced Welding Program', year: '2019' },
      { degree: 'High School Diploma', school: 'Eastern Hills High School', year: '2016' }
    ],
    skills: [
      'MIG Welding (GMAW)', 'TIG Welding (GTAW)', 'Stick Welding (SMAW)', 'Blueprint Reading',
      'Welding Symbols', 'Plasma Cutting', 'Metal Fabrication', 'AWS D1.1', 'Quality Inspection'
    ],
    certifications: [
      'AWS Certified Welder - GMAW (MIG)',
      'OSHA 10-Hour Construction Safety',
      'Forklift Operator Certification',
      'First Aid & CPR Certified'
    ]
  },
  {
    filename: '04_jennifer_williams_forklift.pdf',
    name: 'Jennifer Williams',
    phone: '(469) 555-0187',
    email: 'jennifer.williams42@email.com',
    location: '7234 Commerce Street, Plano, TX 75024',
    summary: 'Dependable and safety-conscious Forklift Operator with 3+ years of warehouse and distribution experience, seeking to contribute strong work ethic and attention to detail to a fast-paced logistics team.',
    experience: [
      {
        title: 'Forklift Operator',
        company: 'Amazon Fulfillment Center',
        location: 'Plano, TX',
        dates: 'June 2021 - Present',
        responsibilities: [
          'Operate sit-down and stand-up forklifts for receiving, putaway, and shipping operations',
          'Load and unload 40+ trailers daily while maintaining strict safety protocols',
          'Use RF scanners and warehouse management systems for inventory tracking',
          'Perform quality inspections on incoming shipments and outbound orders',
          'Maintain 100% attendance record with zero safety violations',
          'Consistently exceed productivity goals by 10-15% per quarter',
          'Assist with training new team members on equipment operation and safety'
        ]
      },
      {
        title: 'Warehouse Associate',
        company: 'DHL Supply Chain',
        location: 'Richardson, TX',
        dates: 'January 2020 - May 2021',
        responsibilities: [
          'Operated pallet jacks and hand trucks for order picking and replenishment',
          'Performed cycle counts and inventory audits',
          'Earned forklift certification and cross-trained on multiple equipment types',
          'Recognized as "Employee of the Quarter" for outstanding performance (Q3 2020)'
        ]
      }
    ],
    education: [
      { degree: 'High School Diploma', school: 'Plano Senior High School', year: '2019' }
    ],
    skills: [
      'Sit-Down Forklift', 'Stand-Up Forklift', 'Pallet Jack', 'RF Scanner', 'WMS Systems',
      'Inventory Control', 'Shipping & Receiving', 'Quality Control', 'Safety Compliance'
    ],
    certifications: [
      'Forklift Operator Certification (Sit-Down & Stand-Up)',
      'OSHA 10-Hour Warehouse Safety',
      'Hazmat General Awareness',
      'CPR & First Aid Certified'
    ]
  },
  {
    filename: '05_sarah_martinez_production_assembler.pdf',
    name: 'Sarah Martinez',
    phone: '(214) 555-0176',
    email: 'sarah.martinez@email.com',
    location: '5612 Oak Street, Irving, TX 75038',
    summary: 'Motivated and detail-oriented individual seeking an entry-level Production Assembler position to begin a career in manufacturing and contribute to quality production goals.',
    experience: [
      {
        title: 'Production Associate (Temp)',
        company: 'Texas Electronics Assembly',
        location: 'Irving, TX',
        dates: 'September 2023 - January 2024',
        responsibilities: [
          'Assembled electronic components following detailed work instructions and diagrams',
          'Performed visual quality inspections on finished products',
          'Maintained clean and organized work station per 5S standards',
          'Worked on fast-paced production line meeting hourly quota requirements',
          'Demonstrated strong attention to detail with 99% quality rating',
          'Perfect attendance record during entire assignment'
        ]
      },
      {
        title: 'Retail Sales Associate',
        company: 'Target',
        location: 'Irving, TX',
        dates: 'June 2022 - August 2023',
        responsibilities: [
          'Provided excellent customer service in fast-paced retail environment',
          'Restocked merchandise and maintained store organization',
          'Operated cash register and handled transactions accurately',
          'Worked flexible shifts including evenings and weekends'
        ]
      }
    ],
    education: [
      { degree: 'High School Diploma', school: 'Nimitz High School', year: '2022' }
    ],
    skills: [
      'Assembly Line Production', 'Quality Inspection', 'Following Work Instructions', 'Hand Tools',
      'Detail-Oriented', 'Fast Learner', 'Team Player', 'Reliable', 'Bilingual (English/Spanish)'
    ],
    certifications: [
      'Manufacturing Safety Fundamentals (Online Course - 2024)',
      'Food Handler Certification'
    ]
  }
];

// Generate PDFs using Puppeteer
async function generateAllResumes() {
  console.log('🎯 Generating 5 Texas-based test resumes using Puppeteer...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const resume of resumes) {
      const page = await browser.newPage();
      const html = createResumeHTML(resume);

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const outputPath = path.join(outputDir, resume.filename);
      await page.pdf({
        path: outputPath,
        format: 'Letter',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      });

      console.log(`✅ Created: ${resume.filename}`);
      await page.close();
    }

    console.log('\n✅ All 5 resumes generated successfully!');
    console.log(`📁 Location: ${outputDir}`);
    console.log('\n📋 Generated resumes:');
    console.log('   1. Michael Johnson - CNC Machine Operator (Dallas, TX)');
    console.log('   2. Carlos Rodriguez - Reach Truck Operator (Mesquite, TX)');
    console.log('   3. David Martinez - MIG Welder (Fort Worth, TX)');
    console.log('   4. Jennifer Williams - Forklift Operator (Plano, TX)');
    console.log('   5. Sarah Martinez - Production Assembler (Irving, TX)');
    console.log('\n🧪 Test these resumes:');
    console.log('   1. Go to http://localhost:3000');
    console.log('   2. Upload each PDF to see AI Recruiter in action!');
    console.log('\n📊 Expected match scores:');
    console.log('   • CNC Operator → 85-95% match');
    console.log('   • Reach Truck → 80-90% match');
    console.log('   • MIG Welder → 85-95% match');
    console.log('   • Forklift → 80-90% match');
    console.log('   • Production Assembler → 70-80% match');

  } catch (error) {
    console.error('❌ Error generating PDFs:', error);
  } finally {
    await browser.close();
  }
}

generateAllResumes();
