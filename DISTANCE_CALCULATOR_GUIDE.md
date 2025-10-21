# Geographic Distance Calculator - Implementation Guide

## Overview
The resume screening system now includes an **automatic geographic distance calculator** that calculates the distance between a candidate's home address and each job site location when a resume is uploaded.

## How It Works

### 1. **Address Extraction**
When a resume is uploaded, the system automatically:
- Extracts the candidate's home address from the resume (typically found in the header)
- Supports various US address formats:
  - Full addresses: `123 Main Street, Madison, WI 53703`
  - Multi-line addresses (street on one line, city/state/ZIP on next)
  - City, State, ZIP only: `Madison, WI 53703`

### 2. **Distance Calculation**
For each active job:
- Geocodes both the candidate's address and job site address to lat/long coordinates
- Calculates straight-line distance using the Haversine formula
- Returns distance in both kilometers and miles

### 3. **Commute Assessment**
The system automatically categorizes commute distance:
- **< 20 miles**: Short commute (reasonable) ✅
- **20-35 miles**: Moderate commute (verify with candidate) ⚠️
- **> 35 miles**: Long commute (may be concern) ❌

### 4. **Data Storage**
Distance information is stored in the `comparisons` table with each candidate-job comparison:
- `distance_km` - Distance in kilometers
- `distance_miles` - Distance in miles
- `commute_reasonable` - Boolean indicating if commute is reasonable
- `commute_description` - Text description of commute assessment
- `distance_calculated` - Flag indicating if calculation was successful

## Configuration

### Geocoding Provider Options

#### Option 1: Nominatim (OpenStreetMap) - **Default, No Setup Required**
- **Cost**: FREE
- **Rate Limit**: 1 request/second
- **Accuracy**: Good
- **Setup**: None required - works out of the box
- **Best for**: Low-volume usage, testing, development

#### Option 2: OpenCage Geocoding API - **Recommended for Production**
- **Cost**: FREE tier (2,500 requests/day)
- **Rate Limit**: No rate limit
- **Accuracy**: Excellent
- **Setup**: Requires API key
- **Best for**: Production environments, high-volume usage

### Setting up OpenCage API (Optional but Recommended)

1. **Sign up for free API key**:
   - Visit: https://opencagedata.com/api
   - Sign up for free account (no credit card required)
   - Get your API key from the dashboard

2. **Add API key to `.env` file**:
   ```bash
   OPENCAGE_API_KEY=your_api_key_here
   ```

3. **Restart the server**:
   ```bash
   npm start
   ```

The system will automatically detect the API key and use OpenCage instead of Nominatim.

## Database Schema Updates

New columns added to **`candidates`** table:
```sql
address TEXT  -- Candidate's home address extracted from resume
```

New columns added to **`comparisons`** table:
```sql
distance_km REAL                -- Distance in kilometers
distance_miles REAL             -- Distance in miles
commute_reasonable INTEGER      -- 1 = reasonable, 0 = long, NULL = unknown
commute_description TEXT        -- Description (e.g., "Short commute (reasonable)")
distance_calculated INTEGER     -- 1 = success, 0 = failed
```

## Testing the Distance Calculator

### 1. **Run Database Migration**
First time setup:
```bash
cd /Users/fabienp/resume-screening-system
node scripts/addDistanceFields.js
```

### 2. **Upload Test Resume**
A test resume with address is included:
```bash
test-resume-sample.txt
```

This resume has candidate address: `2450 Oak Street, Madison, WI 53704`

### 3. **Check Sample Job Addresses**
Sample jobs have been updated with Wisconsin addresses:
- CNC Machine Operator: `1500 Industrial Parkway, Madison, WI 53713`
- General Production Assembler: `2200 Manufacturing Drive, Milwaukee, WI 53202`
- Machine Operator - 2nd Shift: `850 Factory Road, Green Bay, WI 54304`
- Forklift Operator: `3400 Warehouse Avenue, Kenosha, WI 53140`
- MIG Welder: `1800 Fabrication Street, Racine, WI 53403`
- Industrial Maintenance Mechanic: `950 Plant Circle, Appleton, WI 54911`

### 4. **Start the Server**
```bash
npm start
```

### 5. **Upload Resume**
- Open http://localhost:3000
- Upload the `test-resume-sample.txt` file
- Check the server console logs for distance calculation results

### Expected Console Output
```
📍 Extracted address: 2450 Oak Street, Madison, WI 53704
📏 Calculating distance from 2450 Oak Street, Madison, WI 53704 to 1500 Industrial Parkway, Madison, WI 53713
✅ Distance calculated: 3.2 miles (Short commute (reasonable))
```

## API Response Format

When a resume is uploaded, the response includes distance information:

```json
{
  "success": true,
  "candidate_id": 1,
  "candidate": {
    "name": "John Smith",
    "email": "john.smith@email.com",
    "phone": "(608) 555-1234",
    "address": "2450 Oak Street, Madison, WI 53704"
  },
  "comparisons": [
    {
      "job_id": 1,
      "job_title": "CNC Machine Operator",
      "match_score": 92,
      "distance_info": {
        "success": true,
        "distance_km": 5.1,
        "distance_miles": 3.2,
        "commute_reasonable": true,
        "commute_description": "Short commute (reasonable)",
        "calculation_method": "Haversine (straight-line distance)"
      }
    }
  ]
}
```

## Troubleshooting

### No Address Extracted from Resume
**Symptom**: Console shows `⚠️  No address found in resume`

**Solutions**:
1. Ensure the address is in the first 20 lines of the resume (typically in header)
2. Use US address format with city, state, and ZIP code
3. Supported formats:
   - `123 Main St, Madison, WI 53703`
   - `Madison, WI 53703`
   - Multi-line: `123 Main St` on one line, `Madison, WI 53703` on next

### Geocoding Failed
**Symptom**: `⚠️  Distance calculation failed: Address not found`

**Solutions**:
1. Check that addresses are valid US addresses
2. If using Nominatim, wait 1 second between requests (automatic)
3. If using OpenCage, check API key is valid
4. Verify addresses are not misspelled

### Rate Limiting (Nominatim)
**Symptom**: Multiple uploads fail in quick succession

**Solution**:
- Upgrade to OpenCage API (free 2500 requests/day)
- Wait 1 second between uploads when using Nominatim

## Features in Action

### Resume Upload Flow
1. User uploads resume via web interface or email
2. System extracts candidate address from resume text
3. For each active job:
   - AI comparison generates match score
   - Distance calculator computes geographic distance
   - Both stored in database together
4. Results displayed showing match score AND distance
5. Email notifications include distance information (if configured)

### Benefits
- **Better candidate screening**: Filter candidates by reasonable commute distance
- **Improved retention**: Candidates with shorter commutes tend to stay longer
- **Transparency**: Candidates know the commute distance upfront
- **Data-driven decisions**: Compare multiple candidates by both skills AND location

## Future Enhancements

Potential improvements for the distance calculator:

1. **Driving Distance & Time**
   - Integrate Google Maps Distance Matrix API
   - Calculate actual driving time (not just straight-line distance)
   - Account for traffic patterns

2. **Public Transit Options**
   - Check if job site is accessible via public transportation
   - Calculate transit time and cost

3. **Configurable Thresholds**
   - Allow customization of "reasonable" commute distance per job
   - Different thresholds for different job types

4. **Visual Map Display**
   - Show candidate and job locations on interactive map
   - Display commute route

5. **Batch Distance Calculation**
   - Calculate distances for existing candidates retroactively
   - Update distances when job addresses change

## Technical Details

### Distance Calculation Method
Uses the **Haversine formula** to calculate great-circle distance between two points:

```javascript
const R = 6371; // Earth's radius in kilometers
const dLat = toRadians(lat2 - lat1);
const dLon = toRadians(lon2 - lon1);

const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
          Math.sin(dLon/2) * Math.sin(dLon/2);

const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
const distance = R * c;
```

This provides straight-line distance, which is typically 70-80% of actual driving distance.

### Files Modified
- `services/distanceCalculator.js` - New service for distance calculation
- `services/resumeParser.js` - Enhanced address extraction
- `server.js` - Integration into upload flow
- `scripts/addDistanceFields.js` - Database migration script
- `.env` - Added OPENCAGE_API_KEY configuration

## Support

For issues or questions:
1. Check console logs for error messages
2. Verify addresses are in correct format
3. Ensure database migration was run successfully
4. Test with the provided sample resume

---

**Last Updated**: October 2024
**Version**: 1.0
