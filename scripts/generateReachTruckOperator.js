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
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      margin: 40px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      font-size: 28px;
      margin: 0 0 5px 0;
      text-align: center;
      color: #1a1a1a;
    }
    .contact {
      text-align: center;
      font-size: 11px;
      margin-bottom: 20px;
      color: #555;
    }
    h2 {
      font-size: 14px;
      margin: 20px 0 10px 0;
      padding-bottom: 3px;
      border-bottom: 2px solid #333;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .summary {
      font-size: 11px;
      margin-bottom: 15px;
      text-align: justify;
    }
    .skills {
      font-size: 11px;
      margin-bottom: 15px;
    }
    .skills ul {
      margin: 5px 0;
      padding-left: 20px;
    }
    .skills li {
      margin-bottom: 3px;
    }
    .job {
      margin-bottom: 15px;
    }
    .job-title {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .job-company {
      font-size: 11px;
      font-style: italic;
      color: #555;
      margin-bottom: 5px;
    }
    .job-responsibilities {
      font-size: 11px;
      margin: 5px 0;
      padding-left: 20px;
    }
    .job-responsibilities li {
      margin-bottom: 3px;
    }
    .certifications ul {
      font-size: 11px;
      margin: 5px 0;
      padding-left: 20px;
    }
    .certifications li {
      margin-bottom: 3px;
    }
    .education {
      font-size: 11px;
    }
  </style>
</head>
<body>
  <h1>${data.name}</h1>
  <div class="contact">${data.address}<br>${data.phone} | ${data.email}</div>

  ${data.summary ? `
  <h2>Professional Summary</h2>
  <div class="summary">${data.summary}</div>
  ` : ''}

  ${data.skills && data.skills.length > 0 ? `
  <h2>Skills & Qualifications</h2>
  <div class="skills">
    <ul>
      ${data.skills.map(skill => `<li>${skill}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${data.experience && data.experience.length > 0 ? `
  <h2>Work Experience</h2>
  ${data.experience.map(job => `
    <div class="job">
      <div class="job-title">${job.title}</div>
      <div class="job-company">${job.company} | ${job.location} | ${job.dates}</div>
      <ul class="job-responsibilities">
        ${job.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
      </ul>
    </div>
  `).join('')}
  ` : ''}

  ${data.certifications && data.certifications.length > 0 ? `
  <h2>Certifications</h2>
  <div class="certifications">
    <ul>
      ${data.certifications.map(cert => `<li>${cert}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${data.education ? `
  <h2>Education</h2>
  <div class="education">${data.education.replace(/\n/g, '<br>')}</div>
  ` : ''}
</body>
</html>
  `;
}

// Reach Truck Operator Resume - Arlington, TX
const reachTruckOperatorResume = {
  name: 'Carlos Rodriguez',
  address: '4104 S Bowen Rd, Arlington, TX 76016',
  phone: '(817) 555-3421',
  email: 'carlos.rodriguez78@email.com',
  summary: 'Skilled Reach Truck Operator with 5+ years of warehouse experience operating narrow aisle equipment in high-volume distribution centers. Certified in multiple material handling equipment types with excellent safety record. Proven ability to meet productivity standards while maintaining accuracy and following all safety protocols. Strong team player with reliable attendance and flexibility for various shifts.',
  skills: [
    'Reach Truck Operation (Stand-up & Sit-down models)',
    'Narrow Aisle & Very Narrow Aisle (VNA) Operations',
    'Order Picker & Cherry Picker Operation',
    'Electric Pallet Jack & Walkie Stacker',
    'RF Scanner & WMS Systems (SAP, Manhattan)',
    'Inventory Cycle Counting',
    'Loading & Unloading Operations',
    'Pallet Building & Load Securing',
    'OSHA Safety Compliance & Hazard Recognition',
    'Quality Control & Accuracy Verification'
  ],
  experience: [
    {
      title: 'Reach Truck Operator / Material Handler',
      company: 'DFW Logistics Distribution Center',
      location: 'Grand Prairie, TX',
      dates: 'January 2020 - Present',
      responsibilities: [
        'Operate reach truck and order picker in narrow aisle racking system (up to 30 feet high)',
        'Pick, pack, and stage orders for shipment using RF scanner and WMS system',
        'Maintain 99.5% accuracy rate on order picking with average 150+ picks per hour',
        'Load and unload delivery trucks safely and efficiently',
        'Perform daily equipment inspections and report maintenance needs',
        'Conduct cycle counts and inventory adjustments to maintain accuracy',
        'Train 3 new operators on reach truck operations and safety procedures',
        'Perfect safety record with zero accidents or incidents in 4+ years',
        'Available for 1st, 2nd, and 3rd shifts as needed'
      ]
    },
    {
      title: 'Forklift Operator',
      company: 'Metro Warehouse Solutions',
      location: 'Fort Worth, TX',
      dates: 'June 2018 - December 2019',
      responsibilities: [
        'Operated sit-down forklift, reach truck, and pallet jack in busy warehouse',
        'Moved materials to and from storage areas, production lines, and loading docks',
        'Maintained organized warehouse layout following 5S principles',
        'Assisted with receiving, put-away, and shipping operations',
        'Completed daily paperwork and inventory documentation accurately',
        'Consistently met or exceeded productivity goals by 10-15%'
      ]
    }
  ],
  certifications: [
    'Reach Truck Operator Certification (Current - Expires 2025)',
    'Order Picker / Cherry Picker Certification (Current)',
    'Forklift Operator Certification - Sit-down & Stand-up (Current)',
    'OSHA 10-Hour General Industry Safety (Completed 2020)',
    'Hazmat Awareness Training (Current)'
  ],
  education: 'High School Diploma\nArlington Heights High School, Fort Worth, TX (2017)'
};

async function generatePDF() {
  console.log('🚀 Generating Reach Truck Operator resume...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const filename = 'reach-truck-operator-arlington-tx.pdf';
    console.log(`📄 Generating ${filename}...`);

    const page = await browser.newPage();
    const html = createResumeHTML(reachTruckOperatorResume);

    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: path.join(outputDir, filename),
      format: 'Letter',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      printBackground: true
    });

    await page.close();
    console.log(`   ✅ Created: ${filename}`);

    console.log('\n✅ Resume generated successfully!');
    console.log(`📁 Location: ${outputDir}/${filename}`);
    console.log('\n📍 Candidate Details:');
    console.log(`   Name: ${reachTruckOperatorResume.name}`);
    console.log(`   Address: ${reachTruckOperatorResume.address}`);
    console.log(`   Position: Reach Truck Operator`);
    console.log(`   Experience: 5+ years in warehouse/distribution`);
    console.log('\n🧪 Upload this resume to test:');
    console.log('   1. Address extraction from resume');
    console.log('   2. Driving distance calculation (when implemented)');
    console.log('   3. Match against Forklift/Warehouse positions');
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
  } finally {
    await browser.close();
  }
}

generatePDF();
