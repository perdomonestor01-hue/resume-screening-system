const Anthropic = require('@anthropic-ai/sdk');

/**
 * Interview Question Generator Service
 * Generates 5-7 custom interview questions based on candidate's resume and job match
 */
class InterviewQuestionGenerator {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  /**
   * Generate interview questions for a candidate
   * @param {string} resumeText - The candidate's resume text
   * @param {Object} job - Job description object
   * @param {Object} comparison - AI comparison results (match score, strengths, gaps)
   * @param {string} candidateName - Candidate's name for personalization
   * @returns {Promise<Object>} - Generated questions with metadata
   */
  async generateQuestions(resumeText, job, comparison, candidateName = 'the candidate') {
    try {
      const prompt = this.buildQuestionPrompt(resumeText, job, comparison, candidateName);

      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        temperature: 0.7, // Slightly higher for creative question generation
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const response = message.content[0].text;
      console.log(`📝 Generated interview questions for ${candidateName}`);

      return this.parseQuestionResponse(response);
    } catch (error) {
      console.error('Error generating interview questions:', error);
      return {
        questions: this.getFallbackQuestions(job.title),
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build the prompt for question generation
   */
  buildQuestionPrompt(resumeText, job, comparison, candidateName) {
    return `You are an expert HR interviewer preparing interview questions for a manufacturing/production candidate.

**CANDIDATE PROFILE:**
Name: ${candidateName}
Match Score: ${comparison.match_score}%
Resume Summary:
${resumeText.substring(0, 1500)} ${resumeText.length > 1500 ? '...' : ''}

**JOB POSITION:**
Title: ${job.title}
Description: ${job.description}
Required Skills: ${job.required_skills || 'Not specified'}
Experience Level: ${job.experience_level || 'Not specified'}

**AI ANALYSIS:**
Strengths: ${comparison.strengths}
Gaps: ${comparison.gaps}
Recommendations: ${comparison.recommendations}

**YOUR TASK:**
Generate exactly 5-7 interview questions tailored to this candidate for this specific position.

**QUESTION REQUIREMENTS:**
1. Mix of question types:
   - 2-3 **Technical questions** (verify specific skills they claim)
   - 1-2 **Behavioral questions** (past experience and problem-solving)
   - 1-2 **Situational questions** (how they'd handle scenarios)

2. Questions must be:
   - Specific to their resume and the job requirements
   - Address skill gaps identified in the analysis
   - Verify claimed skills/certifications
   - Appropriate for manufacturing/production context
   - Open-ended (not yes/no)

3. Include follow-up probes for deeper assessment

**OUTPUT FORMAT:**
Respond with ONLY valid JSON in this exact structure:

{
  "questions": [
    {
      "type": "technical",
      "category": "Skills Verification",
      "question": "Can you walk me through your experience with CNC programming using Fanuc controllers?",
      "purpose": "Verify claimed Fanuc controller expertise mentioned in resume",
      "followUp": "Ask for specific G-code examples or program they're most proud of"
    },
    {
      "type": "behavioral",
      "category": "Problem Solving",
      "question": "Tell me about a time when you identified and resolved a quality issue on the production line.",
      "purpose": "Assess quality control experience and attention to detail",
      "followUp": "How did you prevent similar issues from occurring again?"
    },
    {
      "type": "situational",
      "category": "Safety & Compliance",
      "question": "If you noticed a coworker not following safety protocols, how would you handle that situation?",
      "purpose": "Evaluate safety awareness and communication skills",
      "followUp": "What if they were a senior employee or supervisor?"
    }
  ]
}

**IMPORTANT FOCUS AREAS:**
- If gaps were identified: Create questions to explore those gaps
- If certifications mentioned: Ask to verify them
- If employment gaps detected: Include tactful question about career timeline
- Manufacturing safety: Always include at least one safety-related question
- Teamwork: Include question about working in production team environment
- Shift flexibility: Ask about availability if relevant

Respond with ONLY the JSON object, no other text.`;
  }

  /**
   * Parse AI response with robust error handling
   */
  parseQuestionResponse(response) {
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

      // Parse JSON
      const parsed = JSON.parse(jsonStr);

      // Validate structure
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid questions array');
      }

      // Ensure we have 5-7 questions
      if (parsed.questions.length < 5) {
        console.warn(`Only ${parsed.questions.length} questions generated, padding with defaults`);
        parsed.questions = this.padQuestions(parsed.questions, 5);
      } else if (parsed.questions.length > 7) {
        console.warn(`Too many questions (${parsed.questions.length}), trimming to 7`);
        parsed.questions = parsed.questions.slice(0, 7);
      }

      return {
        questions: parsed.questions,
        success: true,
        generated_at: new Date().toISOString(),
        total_count: parsed.questions.length
      };
    } catch (error) {
      console.error('Error parsing question response:', error);
      console.error('Response was:', response.substring(0, 500));

      // Return fallback questions
      return {
        questions: this.getFallbackQuestions('this position'),
        success: false,
        error: 'Failed to parse AI response, using default questions'
      };
    }
  }

  /**
   * Pad questions if fewer than minimum
   */
  padQuestions(questions, minCount) {
    const defaultQuestions = this.getFallbackQuestions('this position');
    const needed = minCount - questions.length;

    return [...questions, ...defaultQuestions.slice(0, needed)];
  }

  /**
   * Fallback questions if AI generation fails
   */
  getFallbackQuestions(jobTitle) {
    return [
      {
        type: 'technical',
        category: 'Skills',
        question: `Can you describe your most relevant experience for ${jobTitle}?`,
        purpose: 'Assess technical background and relevance',
        followUp: 'What specific equipment or tools did you use?'
      },
      {
        type: 'behavioral',
        category: 'Safety',
        question: 'Tell me about a time when you had to follow strict safety protocols. How did you ensure compliance?',
        purpose: 'Evaluate safety awareness and compliance mindset',
        followUp: 'What would you do if you saw someone violating safety rules?'
      },
      {
        type: 'technical',
        category: 'Problem Solving',
        question: 'Describe a technical problem you encountered in your previous role and how you resolved it.',
        purpose: 'Assess troubleshooting and problem-solving skills',
        followUp: 'How did you prevent that issue from happening again?'
      },
      {
        type: 'behavioral',
        category: 'Teamwork',
        question: 'How do you handle working as part of a production team? Can you give an example?',
        purpose: 'Evaluate teamwork and communication skills',
        followUp: 'How do you handle conflicts with team members?'
      },
      {
        type: 'situational',
        category: 'Quality Control',
        question: 'If you noticed a defect in a product you just finished, but your supervisor was rushing to meet a deadline, what would you do?',
        purpose: 'Assess quality commitment vs. production pressure',
        followUp: 'How would you communicate this to your supervisor?'
      },
      {
        type: 'behavioral',
        category: 'Reliability',
        question: 'What does reliability and punctuality mean to you in a manufacturing environment?',
        purpose: 'Gauge work ethic and commitment',
        followUp: 'Tell me about your attendance record in your last position'
      },
      {
        type: 'situational',
        category: 'Adaptability',
        question: 'How would you handle being asked to work overtime or switch shifts on short notice?',
        purpose: 'Assess flexibility and availability',
        followUp: 'Are there any shift restrictions we should know about?'
      }
    ];
  }

  /**
   * Format questions for display
   */
  formatQuestionsForDisplay(questionData) {
    if (!questionData.success || !questionData.questions) {
      return null;
    }

    const byType = {
      technical: [],
      behavioral: [],
      situational: []
    };

    questionData.questions.forEach((q, index) => {
      const formattedQ = {
        number: index + 1,
        ...q
      };
      byType[q.type]?.push(formattedQ) || byType.technical.push(formattedQ);
    });

    return byType;
  }
}

module.exports = new InterviewQuestionGenerator();
