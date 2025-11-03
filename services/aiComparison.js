const Anthropic = require('@anthropic-ai/sdk');

/**
 * AI Comparison Service
 * Uses Claude AI to compare resumes against job descriptions
 */
class AIComparison {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  /**
   * Compare resume against job description using Claude AI
   * @param {string} resumeText - The candidate's resume text
   * @param {Object} job - Job description object
   * @returns {Promise<Object>} - Comparison results with score and analysis
   */
  async compareResumeToJob(resumeText, job) {
    try {
      const prompt = this.buildComparisonPrompt(resumeText, job);

      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        temperature: 0.2,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const response = message.content[0].text;
      console.log('Raw AI Response:', response.substring(0, 500)); // Debug log

      return this.parseAIResponse(response);
    } catch (error) {
      console.error('Error in AI comparison:', error);
      return {
        match_score: 0,
        strengths: 'Error processing resume',
        gaps: 'Unable to analyze',
        recommendations: 'Please try again',
        detailed_analysis: error.message,
        success: false
      };
    }
  }

  /**
   * Build the prompt for Claude AI
   */
  buildComparisonPrompt(resumeText, job) {
    return `You are an expert HR recruiter analyzing a candidate's resume for a manufacturing/production/labor position.

**JOB POSTING:**
Title: ${job.title}
Description: ${job.description}
Required Skills: ${job.required_skills || 'Not specified'}
Preferred Skills: ${job.preferred_skills || 'Not specified'}
Experience Level: ${job.experience_level || 'Not specified'}
Education Requirements: ${job.education_requirements || 'Not specified'}
Job Site Location: ${job.job_site_address || 'Not specified'}
Sector: ${job.sector || 'Not specified'}
Job Type: ${job.job_type || 'Not specified'}
Hourly Rate: $${job.salary_hourly || 'Not specified'}/hour

**CANDIDATE RESUME:**
${resumeText}

IMPORTANT: You must respond with ONLY valid JSON. Use \\n for line breaks within strings.

**CRITICAL: You MUST analyze employment dates and identify any gaps in employment history!**

Before analyzing skills, FIRST examine ALL employment dates in the resume:
1. List each job with its dates (e.g., "March 2020 - Present", "June 2018 - March 2020")
2. Calculate the gap between consecutive jobs
3. If there's a gap of 3+ months between jobs, you MUST mention it in your response

**COMMUTE ANALYSIS REQUIREMENT:**
Extract the candidate's home address from the resume (if provided) and estimate the commute to the job site:
1. Look for address information in the resume header or contact section
2. Estimate approximate driving distance and time from candidate's address to the job site address
3. Provide commute assessment based on these criteria:
   - Under 30 minutes: "reasonable" (commute_reasonable: true)
   - 30-45 minutes: "moderate - discuss with candidate" (commute_reasonable: true)
   - Over 45 minutes: "long - verify candidate is willing to commute" (commute_reasonable: false)
4. If no address found in resume, set commute_info to "Address not found in resume" and commute_reasonable to null

Analyze this resume and provide your assessment in this EXACT JSON format:

{
  "match_score": 85,
  "employment_gap_detected": true,
  "employment_gap_details": "Gap from Jan 2020 to Aug 2020 (7 months)",
  "commute_info": "Approximately 15 miles / 20-25 minutes drive",
  "commute_reasonable": true,
  "strengths": "- 3+ years CNC operation experience\\n- Proficient with Haas and Fanuc controllers\\n- Blueprint reading certified\\n- Strong quality control record",
  "gaps": "- No G-code programming mentioned\\n- Limited preventive maintenance experience\\n- EMPLOYMENT GAP: 7 months between jobs (Jan 2020 - Aug 2020) - requires explanation",
  "recommendations": "- Strong candidate, recommend phone screen\\n- Ask about programming skills\\n- IMPORTANT: Ask about 7-month employment gap in 2020 (could be COVID-related, family care, education, or health)\\n- Verify blueprint reading in interview",
  "summary": "Experienced CNC operator with solid technical skills and safety record. Note: 7-month employment gap in 2020 should be discussed during screening to understand circumstances."
}

**If NO employment gaps are detected**, use this format:
{
  "match_score": 85,
  "employment_gap_detected": false,
  "employment_gap_details": "Continuous employment history",
  "commute_info": "Approximately 15 miles / 20-25 minutes drive",
  "commute_reasonable": true,
  "strengths": "- 3+ years CNC operation experience\\n- Proficient with Haas and Fanuc controllers\\n- Continuous employment shows reliability",
  "gaps": "- No G-code programming mentioned\\n- Limited preventive maintenance experience",
  "recommendations": "- Strong candidate, recommend phone screen\\n- Ask about programming skills",
  "summary": "Experienced CNC operator with solid technical skills, safety record, and continuous employment."
}

**Focus Areas for Manufacturing/Production Roles:**
- Hands-on machine operation experience (CNC, injection molding, assembly lines, etc.)
- Safety compliance and OSHA awareness
- Blueprint/schematic reading ability
- Quality control and inspection experience
- Physical capabilities (lifting, standing, manual dexterity)
- Reliability and attendance history (if mentioned)
- Shift flexibility and availability
- Forklift or other equipment certifications
- Lean manufacturing or continuous improvement exposure
- Teamwork in production environment
- **Job consistency and employment gaps** - CRITICAL for manufacturing roles:
  * Analyze employment dates to identify gaps longer than 3-6 months
  * Gaps may be due to personal matters (family, health, education, etc.) - don't penalize, but FLAG for discussion
  * In "gaps" or "recommendations", note any employment gaps and suggest asking about them during screening
  * Example: "Employment gap from June 2019 - March 2020 (9 months) - recommend asking about this gap during phone screen"
  * Continuous employment history is a positive indicator of reliability and stability

**Scoring Criteria:**
- 90-100: Exceptional match - Has all required skills plus multiple preferred skills, highly recommended
- 75-89: Strong match - Has most required skills and some preferred skills, recommended for interview
- 60-74: Good match - Has core required skills, consider for interview
- 40-59: Moderate match - Missing some key qualifications, may need training
- 0-39: Poor match - Lacks essential requirements, not recommended

**Important Notes:**
- Employment gaps alone should NOT drastically reduce the match score if the candidate has the required skills
- Always FLAG employment gaps (3+ months) in the "gaps" or "recommendations" section for the recruiter to discuss
- Be practical and focus on hands-on experience, work ethic indicators, safety awareness, and relevant certifications
- Education requirements are typically flexible for these roles if experience compensates
- Continuous employment is a positive indicator but gaps can have valid explanations (COVID, family care, education, health)

RESPOND WITH ONLY THE JSON OBJECT. Do not include any other text before or after the JSON.`;
  }

  /**
   * Parse Claude's JSON response with robust error handling
   */
  parseAIResponse(response) {
    try {
      // Clean the response
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      // Remove any text before the first { or after the last }
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }

      // Try to parse
      const parsed = JSON.parse(jsonStr);

      // Validate required fields
      if (!parsed.match_score && parsed.match_score !== 0) {
        throw new Error('Missing match_score');
      }

      return {
        match_score: parseInt(parsed.match_score) || 0,
        employment_gap_detected: parsed.employment_gap_detected || false,
        employment_gap_details: parsed.employment_gap_details || 'No gaps detected',
        commute_info: parsed.commute_info || 'Commute information not available',
        commute_reasonable: parsed.commute_reasonable !== undefined ? parsed.commute_reasonable : null,
        strengths: this.formatBulletPoints(parsed.strengths || 'No strengths identified'),
        gaps: this.formatBulletPoints(parsed.gaps || 'No gaps identified'),
        recommendations: this.formatBulletPoints(parsed.recommendations || 'No recommendations provided'),
        detailed_analysis: parsed.summary || parsed.detailed_analysis || '',
        success: true
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Response was:', response.substring(0, 500));

      // Enhanced fallback parser
      return this.enhancedFallbackParse(response);
    }
  }

  /**
   * Format bullet points to ensure proper display
   */
  formatBulletPoints(text) {
    if (!text) return '';

    // Split by newlines and clean up
    const lines = text.split(/\\n|\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Add bullet points if not present
    return lines.map(line => {
      // Remove existing bullets
      line = line.replace(/^[-•*]\s*/, '');
      // Add consistent bullet
      return `- ${line}`;
    }).join('\n');
  }

  /**
   * Enhanced fallback parser for when JSON parsing fails
   */
  enhancedFallbackParse(response) {
    console.log('Using enhanced fallback parser');

    const result = {
      match_score: 50,
      strengths: '',
      gaps: '',
      recommendations: '',
      detailed_analysis: '',
      success: true
    };

    // Try to extract match score
    const scorePatterns = [
      /match[_\s-]*score["\s:]*(\d+)/i,
      /score["\s:]*(\d+)/i,
      /(\d+)%?\s*match/i,
      /"(\d+)"/
    ];

    for (const pattern of scorePatterns) {
      const match = response.match(pattern);
      if (match && match[1]) {
        const score = parseInt(match[1]);
        if (score >= 0 && score <= 100) {
          result.match_score = score;
          break;
        }
      }
    }

    // Try to extract sections
    const extractSection = (sectionName) => {
      const patterns = [
        new RegExp(`${sectionName}["\s:]+([^}]+?)(?=\\n\\s*[",}]|"\\w+":)`, 'is'),
        new RegExp(`${sectionName}.*?:\\s*"([^"]+)"`, 'is'),
        new RegExp(`${sectionName}.*?:\\s*([^,}]+)`, 'is')
      ];

      for (const pattern of patterns) {
        const match = response.match(pattern);
        if (match && match[1]) {
          return match[1].trim()
            .replace(/\\n/g, '\n')
            .replace(/^["']|["']$/g, '');
        }
      }
      return '';
    };

    result.strengths = this.formatBulletPoints(extractSection('strengths') ||
      '- Experience relevant to the position\n- Meets basic qualifications');

    result.gaps = this.formatBulletPoints(extractSection('gaps') ||
      '- See detailed analysis\n- Review during interview');

    result.recommendations = this.formatBulletPoints(extractSection('recommendations') ||
      '- Review candidate qualifications\n- Consider for interview based on match score\n- Assess cultural fit');

    result.detailed_analysis = extractSection('summary') || extractSection('detailed_analysis') ||
      `Match score: ${result.match_score}%. Review the candidate's experience and qualifications for this role.`;

    // If we still have mostly empty content, provide more detail based on score
    if (result.strengths.length < 20 || result.gaps.length < 20) {
      if (result.match_score >= 75) {
        result.strengths = this.formatBulletPoints(
          'Strong candidate with relevant experience\nMeets most job requirements\nGood background for the role'
        );
        result.gaps = this.formatBulletPoints(
          'Minor skill gaps can be addressed with training\nVerify specific requirements in interview'
        );
        result.recommendations = this.formatBulletPoints(
          'Recommend for interview\nStrong match for the position\nPriority candidate'
        );
      } else if (result.match_score >= 60) {
        result.strengths = this.formatBulletPoints(
          'Has core qualifications\nRelevant work experience\nMeets basic requirements'
        );
        result.gaps = this.formatBulletPoints(
          'Some preferred skills missing\nMay need additional training\nVerify capabilities in interview'
        );
        result.recommendations = this.formatBulletPoints(
          'Consider for interview\nAssess training needs\nGood potential candidate'
        );
      } else {
        result.strengths = this.formatBulletPoints(
          'Some transferable skills\nWilling to learn'
        );
        result.gaps = this.formatBulletPoints(
          'Lacks several key qualifications\nLimited relevant experience\nMay require significant training'
        );
        result.recommendations = this.formatBulletPoints(
          'Not recommended unless willing to train\nConsider for entry-level positions\nLook for better-qualified candidates'
        );
      }
    }

    return result;
  }

  /**
   * Batch compare multiple candidates against a job
   */
  async batchCompare(candidates, job) {
    const results = [];

    for (const candidate of candidates) {
      const result = await this.compareResumeToJob(candidate.resume_text, job);
      results.push({
        candidate_id: candidate.id,
        ...result
      });

      // Small delay to avoid rate limiting
      await this.delay(500);
    }

    return results;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get interpretation of match score
   */
  getScoreInterpretation(score) {
    if (score >= 90) return { level: 'Exceptional', color: '#10b981', recommendation: 'Highly recommended - Priority interview' };
    if (score >= 75) return { level: 'Strong', color: '#3b82f6', recommendation: 'Recommended - Schedule interview' };
    if (score >= 60) return { level: 'Good', color: '#6366f1', recommendation: 'Consider for interview' };
    if (score >= 40) return { level: 'Moderate', color: '#f59e0b', recommendation: 'Review carefully - May lack key qualifications' };
    return { level: 'Poor', color: '#ef4444', recommendation: 'Not recommended' };
  }
}

module.exports = new AIComparison();
