const https = require('https');

/**
 * Distance Calculator Service
 * Calculates geographic distance between candidate address and job site
 * Uses OpenCage Geocoding API (free tier: 2500 requests/day)
 * Fallback to Nominatim (OpenStreetMap) if OpenCage is not available
 */
class DistanceCalculator {
  constructor() {
    this.openCageApiKey = process.env.OPENCAGE_API_KEY || null;
    this.useNominatim = !this.openCageApiKey;

    // Geocoding cache to avoid redundant API calls
    this.geocodingCache = new Map();

    if (this.useNominatim) {
      console.log('⚠️  OpenCage API key not found, using Nominatim (OpenStreetMap) - rate limited to 1 request/second');
    } else {
      console.log('✅ Using OpenCage Geocoding API');
    }
  }

  /**
   * Normalize address for geocoding by removing suite/unit numbers
   * Suite numbers don't affect building coordinates
   * @param {string} address - Address to normalize
   * @returns {string} - Normalized address
   */
  normalizeAddress(address) {
    if (!address) return address;

    let normalized = address;

    // Remove suite/apartment/unit numbers (they don't affect coordinates)
    // Patterns: #135, Ste 117, Suite 200, Apt 5, Unit 12, etc.
    const suitePatterns = [
      /#\s*\d+/gi,                          // #135, # 135
      /\b(suite|ste|apt|apartment|unit|rm|room|floor|fl)\s*\.?\s*[a-z0-9-]+/gi,  // Ste 117, Suite 200, Apt 5
      /\b(building|bldg)\s*[a-z0-9]+/gi     // Building B, Bldg 3
    ];

    suitePatterns.forEach(pattern => {
      normalized = normalized.replace(pattern, '');
    });

    // Clean up extra commas and spaces
    normalized = normalized
      .replace(/,\s*,/g, ',')               // Remove double commas
      .replace(/\s+,/g, ',')                // Remove space before comma
      .replace(/,\s+/g, ', ')               // Normalize comma spacing
      .replace(/\s{2,}/g, ' ')              // Replace multiple spaces with single space
      .trim();

    // Remove trailing comma if present
    normalized = normalized.replace(/,\s*$/, '');

    if (normalized !== address) {
      console.log(`📝 Normalized address: "${address}" → "${normalized}"`);
    }

    return normalized;
  }

  /**
   * Calculate distance between candidate and job site addresses
   * @param {string} candidateAddress - Candidate's home address
   * @param {string} jobSiteAddress - Job site address
   * @returns {Promise<Object>} - Distance information
   */
  async calculateDistance(candidateAddress, jobSiteAddress) {
    try {
      if (!candidateAddress || !jobSiteAddress) {
        return {
          success: false,
          error: 'Both candidate and job site addresses are required',
          distance_km: null,
          distance_miles: null,
          commute_reasonable: null
        };
      }

      // Geocode both addresses
      const [candidateCoords, jobSiteCoords] = await Promise.all([
        this.geocodeAddress(candidateAddress),
        this.geocodeAddress(jobSiteAddress)
      ]);

      if (!candidateCoords.success || !jobSiteCoords.success) {
        return {
          success: false,
          error: 'Failed to geocode addresses',
          geocoding_errors: {
            candidate: candidateCoords.error || null,
            jobSite: jobSiteCoords.error || null
          },
          distance_km: null,
          distance_miles: null,
          commute_reasonable: null
        };
      }

      // Calculate distance using Haversine formula
      const distanceKm = this.calculateHaversineDistance(
        candidateCoords.lat,
        candidateCoords.lng,
        jobSiteCoords.lat,
        jobSiteCoords.lng
      );

      const distanceMiles = distanceKm * 0.621371;

      // Determine if commute is reasonable (based on distance, not driving time)
      // Typical assumptions: <20 miles = reasonable, 20-35 miles = moderate, >35 miles = long
      let commuteReasonable = null;
      let commuteDescription = '';

      if (distanceMiles < 20) {
        commuteReasonable = true;
        commuteDescription = 'Short commute (reasonable)';
      } else if (distanceMiles < 35) {
        commuteReasonable = true;
        commuteDescription = 'Moderate commute (verify with candidate)';
      } else {
        commuteReasonable = false;
        commuteDescription = 'Long commute (may be concern)';
      }

      return {
        success: true,
        candidate_address: candidateAddress,
        candidate_coords: {
          lat: candidateCoords.lat,
          lng: candidateCoords.lng
        },
        job_site_address: jobSiteAddress,
        job_site_coords: {
          lat: jobSiteCoords.lat,
          lng: jobSiteCoords.lng
        },
        distance_km: Math.round(distanceKm * 10) / 10,
        distance_miles: Math.round(distanceMiles * 10) / 10,
        commute_reasonable: commuteReasonable,
        commute_description: commuteDescription,
        calculation_method: 'Haversine (straight-line distance)'
      };
    } catch (error) {
      console.error('Error calculating distance:', error);
      return {
        success: false,
        error: error.message,
        distance_km: null,
        distance_miles: null,
        commute_reasonable: null
      };
    }
  }

  /**
   * Geocode an address to get latitude/longitude (with caching)
   * @param {string} address - Address to geocode
   * @returns {Promise<Object>} - Coordinates or error
   */
  async geocodeAddress(address) {
    // Normalize address (remove suite numbers, extra spaces)
    const normalizedAddress = this.normalizeAddress(address);

    // Check cache first
    const cacheKey = normalizedAddress.toLowerCase();
    if (this.geocodingCache.has(cacheKey)) {
      const cached = this.geocodingCache.get(cacheKey);
      console.log(`💾 Using cached geocoding for: ${normalizedAddress}`);
      return { ...cached, cached: true };
    }

    // Geocode with retry logic
    let result;
    if (this.useNominatim) {
      result = await this.geocodeWithNominatim(normalizedAddress);
    } else {
      result = await this.geocodeWithOpenCage(normalizedAddress);
    }

    // If failed, try with simplified address (city, state ZIP only)
    if (!result.success && normalizedAddress.includes(',')) {
      console.log(`⚠️  First geocoding attempt failed, trying with simplified address...`);
      const parts = normalizedAddress.split(',');
      if (parts.length >= 2) {
        // Try with just city, state ZIP
        const simplifiedAddress = parts.slice(-2).join(',').trim();
        console.log(`🔄 Retrying with: ${simplifiedAddress}`);

        if (this.useNominatim) {
          result = await this.geocodeWithNominatim(simplifiedAddress);
        } else {
          result = await this.geocodeWithOpenCage(simplifiedAddress);
        }
      }
    }

    // Cache successful result
    if (result.success) {
      this.geocodingCache.set(cacheKey, result);
      console.log(`💾 Cached geocoding result for: ${normalizedAddress}`);
    }

    return result;
  }

  /**
   * Geocode using OpenCage API
   * @param {string} address - Address to geocode
   * @returns {Promise<Object>} - Coordinates or error
   */
  async geocodeWithOpenCage(address) {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodedAddress}&key=${this.openCageApiKey}&limit=1&no_annotations=1`;

      const response = await this.httpRequest(url);
      const data = JSON.parse(response);

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          success: true,
          lat: result.geometry.lat,
          lng: result.geometry.lng,
          formatted_address: result.formatted,
          confidence: result.confidence,
          provider: 'OpenCage'
        };
      } else {
        return {
          success: false,
          error: 'Address not found',
          provider: 'OpenCage'
        };
      }
    } catch (error) {
      console.error('OpenCage geocoding error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'OpenCage'
      };
    }
  }

  /**
   * Geocode using Nominatim (OpenStreetMap) - Free but rate limited
   * @param {string} address - Address to geocode
   * @returns {Promise<Object>} - Coordinates or error
   */
  async geocodeWithNominatim(address) {
    try {
      // Respect Nominatim's rate limit: 1 request per second
      await this.delay(1000);

      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;

      const response = await this.httpRequest(url, {
        'User-Agent': 'Resume-Screening-System/1.0' // Required by Nominatim
      });
      const data = JSON.parse(response);

      if (data && data.length > 0) {
        const result = data[0];
        return {
          success: true,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          formatted_address: result.display_name,
          provider: 'Nominatim (OpenStreetMap)'
        };
      } else {
        return {
          success: false,
          error: 'Address not found',
          provider: 'Nominatim (OpenStreetMap)'
        };
      }
    } catch (error) {
      console.error('Nominatim geocoding error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'Nominatim (OpenStreetMap)'
      };
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} - Distance in kilometers
   */
  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees
   * @returns {number} - Radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Make HTTPS request
   * @param {string} url - URL to request
   * @param {Object} headers - Optional headers
   * @returns {Promise<string>} - Response body
   */
  httpRequest(url, headers = {}) {
    return new Promise((resolve, reject) => {
      https.get(url, { headers }, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract address from resume text using pattern matching
   * This is a helper function that can be used by resumeParser
   * @param {string} text - Resume text
   * @returns {string|null} - Extracted address or null
   */
  extractAddressFromText(text) {
    // Split text into lines
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Common address patterns
    const addressPatterns = [
      // US addresses with city, state, ZIP
      /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|court|ct|circle|cir|boulevard|blvd)[,\s]+[\w\s]+,\s*[A-Z]{2}\s+\d{5}(-\d{4})?/i,
      // City, State ZIP pattern
      /[\w\s]+,\s*[A-Z]{2}\s+\d{5}(-\d{4})?/,
      // Address line followed by city, state ZIP on next line (check first 10 lines)
    ];

    // Check first 15 lines for address patterns (typically in header)
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const line = lines[i];

      // Check against patterns
      for (const pattern of addressPatterns) {
        const match = line.match(pattern);
        if (match) {
          return match[0].trim();
        }
      }

      // Check for multi-line address (street on one line, city/state/ZIP on next)
      if (i < lines.length - 1) {
        const combinedLines = line + ', ' + lines[i + 1];
        for (const pattern of addressPatterns) {
          const match = combinedLines.match(pattern);
          if (match) {
            return match[0].trim();
          }
        }
      }
    }

    // If no structured address found, look for city, state pattern (less precise)
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const cityStateMatch = lines[i].match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s+(\d{5})/);
      if (cityStateMatch) {
        return cityStateMatch[0].trim();
      }
    }

    return null;
  }

  /**
   * Validate if a string looks like a valid address
   * @param {string} address - Address to validate
   * @returns {boolean}
   */
  isValidAddress(address) {
    if (!address || address.length < 5) return false;

    // Check for US state abbreviations
    const hasStateAbbr = /\b[A-Z]{2}\b/.test(address);
    // Check for ZIP code
    const hasZip = /\d{5}(-\d{4})?/.test(address);
    // Check for common street indicators
    const hasStreet = /(street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|court|ct|circle|cir|boulevard|blvd)/i.test(address);

    // A valid address should have at least 2 of these 3 components
    return (hasStateAbbr && hasZip) || (hasStateAbbr && hasStreet) || (hasZip && hasStreet);
  }
}

module.exports = new DistanceCalculator();
