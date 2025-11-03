const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../database.db'));

// Standardized values
const standardValues = {
  sector: 'Light Industrial',
  job_type: 'Full-time',
  salary_hourly: 18.50,
  job_site_address: '845 FM 407, Denton, TX 76226',
  account_manager: 'Abeni Cavil',
  experience_level: 'Entry level up to 2 years',
  education_requirements: 'No formal education required',
  required_skills: 'Certified Lumper',
  preferred_skills: 'None'
};

console.log('🔄 Standardizing all job postings...\n');
console.log('Standard values:');
console.log('  Sector:', standardValues.sector);
console.log('  Job Type:', standardValues.job_type);
console.log('  Salary:', `$${standardValues.salary_hourly}/hour`);
console.log('  Location:', standardValues.job_site_address);
console.log('  Account Manager:', standardValues.account_manager);
console.log('  Experience:', standardValues.experience_level);
console.log('  Education:', standardValues.education_requirements);
console.log('  Required Skills:', standardValues.required_skills);
console.log('  Preferred Skills:', standardValues.preferred_skills);
console.log('\n');

// First, get all jobs
db.all('SELECT id, title FROM jobs', [], (err, jobs) => {
  if (err) {
    console.error('❌ Error fetching jobs:', err);
    db.close();
    return;
  }

  console.log(`Found ${jobs.length} job(s) to standardize\n`);

  if (jobs.length === 0) {
    console.log('✅ No jobs to update');
    db.close();
    return;
  }

  // Update each job
  const updateQuery = `
    UPDATE jobs
    SET
      sector = ?,
      job_type = ?,
      salary_hourly = ?,
      job_site_address = ?,
      account_manager = ?,
      experience_level = ?,
      education_requirements = ?,
      required_skills = ?,
      preferred_skills = ?,
      version = version + 1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  let completed = 0;
  let failed = 0;

  jobs.forEach((job, index) => {
    db.run(
      updateQuery,
      [
        standardValues.sector,
        standardValues.job_type,
        standardValues.salary_hourly,
        standardValues.job_site_address,
        standardValues.account_manager,
        standardValues.experience_level,
        standardValues.education_requirements,
        standardValues.required_skills,
        standardValues.preferred_skills,
        job.id
      ],
      function(err) {
        if (err) {
          console.error(`❌ Failed to update job ${job.id} (${job.title}):`, err);
          failed++;
        } else {
          console.log(`✅ Updated job ${job.id}: ${job.title}`);
          completed++;
        }

        // If this is the last job, close the database and print summary
        if (completed + failed === jobs.length) {
          console.log('\n' + '='.repeat(50));
          console.log('Summary:');
          console.log(`  ✅ Successfully updated: ${completed}`);
          if (failed > 0) {
            console.log(`  ❌ Failed: ${failed}`);
          }
          console.log('='.repeat(50));
          db.close();
        }
      }
    );
  });
});
