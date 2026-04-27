const axios = require('axios');
const History = require('../models/History');

const groq = axios.create({
  baseURL: 'https://api.groq.com/openai/v1',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`
  }
});

const cleanJson = (text = '') => text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

const askGroq = async (messages, options = {}) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing in backend .env');
  }

  const { data } = await groq.post('/chat/completions', {
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 2048
  });

  return data.choices?.[0]?.message?.content || '';
};

exports.generateRoadmap = async (req, res) => {
  try {
    const job = String(req.body.job || '').trim();
    if (!job) {
      return res.status(400).json({ success: false, message: 'Job title is required' });
    }

    const validation = await askGroq(
      [{ role: 'user', content: `Is "${job}" a real recognized job title or profession? Reply only YES or NO.` }],
      { temperature: 0.1, max_tokens: 5 }
    );

    if (validation && !validation.trim().toUpperCase().includes('YES')) {
      return res.status(400).json({
        success: false,
        message: `"${job}" does not seem to be a valid profession. Try Software Engineer, Graphic Designer, or Data Analyst.`
      });
    }

    const prompt = `Generate a detailed career roadmap for: "${job}"
Return ONLY valid JSON, no markdown, no code blocks:
{
  "title": "Job Title",
  "tagline": "One line about this career",
  "overview": "2-3 sentence overview",
  "foundational_skills": ["skill1","skill2","skill3","skill4","skill5","skill6"],
  "technical_skills": ["skill1","skill2","skill3","skill4","skill5","skill6"],
  "tools_and_technologies": ["tool1","tool2","tool3","tool4","tool5","tool6"],
  "learning_resources": ["resource1","resource2","resource3","resource4","resource5"],
  "certifications": ["cert1","cert2","cert3","cert4"],
  "timeline": { "short_term": "0-6 months plan", "mid_term": "6-18 months plan", "long_term": "18+ months plan" },
  "career_progression": ["Junior: desc","Mid: desc","Senior: desc","Lead: desc"],
  "salary_insight": "Salary range and factors",
  "soft_skills": ["skill1","skill2","skill3","skill4"],
  "tips": ["tip1","tip2","tip3","tip4"]
}`;

    const text = await askGroq([{ role: 'user', content: prompt }]);
    const roadmap = JSON.parse(cleanJson(text));

    const saved = await History.create({
      user: req.user._id,
      job,
      title: roadmap.title || job,
      tagline: roadmap.tagline || '',
      roadmap
    });

    res.json({ success: true, roadmap, history: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Roadmap generation failed' });
  }
};
