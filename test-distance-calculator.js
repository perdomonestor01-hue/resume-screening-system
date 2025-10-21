/**
 * Test script for distance calculator
 * Tests geocoding and distance calculation
 */

require('dotenv').config();
const distanceCalculator = require('./services/distanceCalculator');

async function testDistanceCalculator() {
  console.log('\n🧪 Testing Distance Calculator\n');
  console.log('='.repeat(60));

  // Test addresses
  const testCases = [
    {
      name: 'Test 1: Madison to Madison (short commute)',
      candidateAddress: '2450 Oak Street, Madison, WI 53704',
      jobSiteAddress: '1500 Industrial Parkway, Madison, WI 53713'
    },
    {
      name: 'Test 2: Madison to Milwaukee (long commute)',
      candidateAddress: 'Madison, WI 53704',
      jobSiteAddress: 'Milwaukee, WI 53202'
    },
    {
      name: 'Test 3: Invalid address',
      candidateAddress: 'Invalid Address 123',
      jobSiteAddress: 'Madison, WI 53704'
    }
  ];

  for (const test of testCases) {
    console.log(`\n${test.name}`);
    console.log('-'.repeat(60));
    console.log(`Candidate: ${test.candidateAddress}`);
    console.log(`Job Site:  ${test.jobSiteAddress}`);
    console.log('');

    const result = await distanceCalculator.calculateDistance(
      test.candidateAddress,
      test.jobSiteAddress
    );

    if (result.success) {
      console.log('✅ SUCCESS');
      console.log(`   Distance: ${result.distance_miles} miles (${result.distance_km} km)`);
      console.log(`   Commute: ${result.commute_description}`);
      console.log(`   Reasonable: ${result.commute_reasonable ? 'Yes' : 'No'}`);
      console.log(`   Method: ${result.calculation_method}`);
    } else {
      console.log('❌ FAILED');
      console.log(`   Error: ${result.error}`);
    }

    // Wait 2 seconds between tests to respect Nominatim rate limit
    if (test !== testCases[testCases.length - 1]) {
      console.log('\n⏳ Waiting 2 seconds (Nominatim rate limit)...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Testing complete!\n');
}

// Run tests
testDistanceCalculator().catch(console.error);
