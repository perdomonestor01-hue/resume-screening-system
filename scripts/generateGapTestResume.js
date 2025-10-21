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
  <div class="contact">${data.phone} | ${data.email} | ${data.location}</div>

  ${data.summary ? `
  <h2>Professional Summary</h2>
  <div class="summary">${data.summary}</div>
  ` : ''}

  ${data.skills && data.skills.length > 0 ? `
  <h2>Skills</h2>
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

// Resume with EMPLOYMENT GAP for testing
const resumeWithGap = {
  name: 'Jennifer Martinez',
  phone: '(555) 445-7890',
  email: 'j.martinez1985@email.com',
  location: 'Racine, WI',
  summary: 'Experienced MIG Welder with 6+ years of structural and precision welding experience. Certified in multiple welding processes with strong attention to detail and safety compliance. Proven ability to read blueprints and work independently or as part of a team.',
  skills: [
    'MIG Welding (Steel, Stainless Steel, Aluminum)',
    'TIG Welding (Basic)',
    'Blueprint Reading & Interpretation',
    'Welding Inspection & Quality Control',
    'Grinding, Cutting, & Fabrication',
    'OSHA Safety Standards',
    'Overhead Crane Operation',
    'Material Handling & Forklift Operation'
  ],
  experience: [
    {
      title: 'MIG Welder',
      company: 'Advanced Fabrication LLC',
      location: 'Racine, WI',
      dates: 'August 2021 - Present',
      responsibilities: [
        'Perform MIG welding on structural steel components for industrial equipment',
        'Read and interpret blueprints, weld symbols, and technical drawings',
        'Conduct visual inspections and basic quality checks on completed welds',
        'Set up welding equipment and select appropriate filler materials',
        'Maintain clean and organized work area following 5S standards',
        'Train new welders on safety procedures and proper welding techniques',
        'Achieved 99% weld pass rate on quality inspections'
      ]
    },
    // EMPLOYMENT GAP HERE: Jan 2019 - July 2021 (30 months / 2.5 years)
    // This is a significant gap that should be flagged
    {
      title: 'Welder / Fabricator',
      company: 'Milwaukee Metal Works',
      location: 'Milwaukee, WI',
      dates: 'March 2015 - December 2018',
      responsibilities: [
        'Performed MIG and stick welding on various metals including steel and aluminum',
        'Fabricated custom metal parts per customer specifications',
        'Operated plasma cutter, grinder, and metal shear',
        'Assisted with shipping and receiving of raw materials',
        'Maintained welding equipment and performed routine maintenance',
        'Worked overtime and weekends to meet production deadlines'
      ]
    }
  ],
  certifications: [
    'AWS Certified Welder - MIG (Current)',
    'OSHA 10-Hour General Industry Safety',
    'Forklift Operator Certification',
    'Overhead Crane Operator Certified'
  ],
  education: 'High School Diploma, Horlick High School, Racine, WI (2013)\nWelding Technology Certificate, Gateway Technical College (2014)'
};

async function generatePDF() {
  console.log('🚀 Generating test resume with employment gap...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const filename = 'test-employment-gap-welder.pdf';
    console.log(`📄 Generating ${filename}...`);

    const page = await browser.newPage();
    const html = createResumeHTML(resumeWithGap);

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

    console.log('\n✅ Test resume with employment gap generated!');
    console.log(`📁 Location: ${outputDir}/${filename}`);
    console.log('\n⚠️  This resume contains a significant employment gap:');
    console.log('   December 2018 → August 2021 (30 months gap)');
    console.log('\n🧪 Upload this resume to test the gap detection feature.');
    console.log('   The AI should:');
    console.log('   1. Detect the 30-month employment gap');
    console.log('   2. Flag it in the "Gaps" or "Recommendations" section');
    console.log('   3. Suggest asking about it during screening');
    console.log('   4. Still give a reasonable match score (candidate has strong welding skills)');
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
  } finally {
    await browser.close();
  }
}

generatePDF();
