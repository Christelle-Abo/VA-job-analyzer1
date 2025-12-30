'use client';

import React, { useState } from 'react';

export default function VAJobAnalyzer() {
  const [jobInput, setJobInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const analyzeJob = async () => {
    if (!jobInput.trim()) {
      setError('Please paste a job description');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          messages: [{
            role: 'user',
            content: `You are an expert VA career coach. Create a 14-day learning plan that teaches concepts directly.

JOB: ${jobInput}
SKILLS: ${skillsInput || 'Beginner'}

CRITICAL: Keep lessons concise (2-3 sentences max per lesson). Keep steps brief (one clear action per step).

Return valid JSON (escape all quotes, no line breaks in strings):
{
  "jobTitle": "title here",
  "salaryRange": "range",
  "skillGap": {
    "hasAlready": ["skill"],
    "needToLearn": ["skill1", "skill2"],
    "highImpact": ["skill"]
  },
  "learningPlan": {
    "week1": [{
      "day": 1,
      "focus": "Skill name",
      "lesson": "Brief 2-3 sentence explanation of concept and best practices.",
      "videoSearch": "youtube query",
      "practice": "Specific exercise",
      "deliverable": "What to submit",
      "estimatedTime": "2-3 hours"
    }],
    "week2": [{
      "day": 8,
      "focus": "Portfolio Part 1",
      "lesson": "Brief explanation",
      "steps": ["Open Google Docs", "Create title", "Add Challenge section", "Write Solution", "List Results"],
      "deliverable": "First portfolio piece",
      "estimatedTime": "3 hours"
    }]
  },
  "portfolioPieces": [{"title": "Item", "description": "What it shows"}],
  "aiAdvantage": "Brief explanation",
  "aiUseCases": ["Use 1", "Use 2"],
  "applicationTips": ["Tip 1", "Tip 2"]
}`
          }]
        })
      });

      const data = await response.json();
      if (data.content && data.content[0]) {
        let text = data.content[0].text;
        
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const jsonStart = text.indexOf('{');
        if (jsonStart > 0) {
          text = text.substring(jsonStart);
        }
        
        const jsonEnd = text.lastIndexOf('}');
        if (jsonEnd > 0 && jsonEnd < text.length - 1) {
          text = text.substring(0, jsonEnd + 1);
        }
        
        try {
          const parsed = JSON.parse(text);
          setAnalysis(parsed);
        } catch (parseError) {
          console.error('Parse error:', parseError);
          text = text.replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\t/g, ' ');
          const parsed = JSON.parse(text);
          setAnalysis(parsed);
        }
      } else {
        throw new Error('No response from AI');
      }
    } catch (err) {
      console.error('Full error:', err);
      setError('Could not analyze job. The response was too complex. Try a simpler job description or try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadChecklist = () => {
    if (!analysis) return;
    let text = 'VA 14-DAY CHECKLIST\n\n';
    text += 'Job: ' + analysis.jobTitle + '\n';
    text += 'Salary: ' + analysis.salaryRange + '\n\n';
    text += 'GOOGLE DRIVE SETUP:\n';
    text += '- Create folder: VA Training - [Your Name]\n';
    text += '- Inside create: Day 1, Day 2, ... Day 14 folders\n';
    text += '- Share with your coach\n\n';
    text += 'WEEK 1: FOUNDATION SKILLS\n\n';
    
    analysis.learningPlan.week1.forEach(d => {
      text += 'DAY ' + d.day + ': ' + d.focus + '\n';
      text += 'Time: ' + (d.estimatedTime || '2-3 hours') + '\n\n';
      if (d.lesson) {
        text += 'LESSON (Read This First):\n';
        text += d.lesson + '\n\n';
      }
      text += 'VIDEO (Supplementary): Search YouTube for: ' + d.videoSearch + '\n\n';
      text += 'PRACTICE: ' + d.practice + '\n\n';
      text += 'SUBMIT: ' + d.deliverable + '\n';
      text += 'Upload to: Day ' + d.day + ' folder\n';
      text += '-------------------------------------------\n\n';
    });
    
    text += 'WEEK 2: PORTFOLIO & APPLICATIONS\n\n';
    analysis.learningPlan.week2.forEach(d => {
      text += 'DAY ' + d.day + ': ' + d.focus + '\n';
      text += 'Time: ' + (d.estimatedTime || '3-4 hours') + '\n\n';
      if (d.lesson) {
        text += 'INSTRUCTIONS:\n' + d.lesson + '\n\n';
      }
      if (d.steps && d.steps.length > 0) {
        text += 'STEP-BY-STEP:\n';
        d.steps.forEach((step, idx) => {
          text += (idx + 1) + '. ' + step + '\n';
        });
        text += '\n';
      }
      if (d.task) {
        text += d.task + '\n\n';
      }
      if (d.deliverable) {
        text += 'DELIVERABLE: ' + d.deliverable + '\n';
      }
      text += '-------------------------------------------\n\n';
    });

    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'VA-14-Day-Checklist.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      alert('Download blocked. Copying to clipboard instead...');
      navigator.clipboard.writeText(text).then(() => {
        alert('Checklist copied to clipboard! Paste it into a text file.');
      }).catch(() => {
        alert('Please copy the text manually from the box that appears.');
      });
    }
  };

  const downloadPortfolio = () => {
    const text = 'VA PORTFOLIO TEMPLATE\n\n[YOUR NAME]\nVirtual Assistant | AI-Enhanced Productivity Expert\n\nPROFESSIONAL SUMMARY\nI am a Virtual Assistant specializing in [top 3 skills].\nUsing AI tools like ChatGPT and Claude, I deliver work 3x faster.\n\nSKILLS\n- Email Management\n- Calendar Management\n- Meeting Coordination\n- AI-Powered Productivity\n\nPORTFOLIO PIECE 1: [TITLE]\n\nCHALLENGE:\n[Describe the problem]\n\nSOLUTION:\n[What you did]\n\nRESULTS:\n- Reduced time by X%\n- Improved efficiency\n- Client satisfaction\n\nPORTFOLIO PIECE 2: [TITLE]\n[Repeat format]\n\nCONTACT\nEmail: [your email]\nAvailability: [your hours]';
    
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'VA-Portfolio-Template.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      alert('Download blocked. Please copy the template from the text box below.');
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.width = '100%';
      textarea.style.height = '400px';
      textarea.style.padding = '15px';
      textarea.style.fontSize = '14px';
      textarea.style.fontFamily = 'monospace';
      document.body.appendChild(textarea);
      textarea.select();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0f2fe 0%, #fff 50%, #fae8ff 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, #2563eb, #9333ea)', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '35px', marginBottom: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            💼
          </div>
          <h1 style={{ fontSize: '2.5em', color: '#1f2937', marginBottom: '10px' }}>VA Job Analyzer</h1>
          <p style={{ fontSize: '1.2em', color: '#6b7280', marginBottom: '15px' }}>Your personalized 14-day path to becoming a hired Virtual Assistant</p>
          <div style={{ display: 'inline-block', padding: '8px 16px', background: '#d1fae5', border: '2px solid #10b981', borderRadius: '10px', color: '#065f46', fontWeight: 600 }}>
            ✨ Includes real resources + Google Drive workflow
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
          <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            Paste Virtual Assistant Job Description or URL
          </label>
          <textarea
            value={jobInput}
            onChange={(e) => setJobInput(e.target.value)}
            rows={8}
            placeholder="Paste the full VA job description here..."
            style={{ width: '100%', padding: '15px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '0.95em', fontFamily: 'inherit', resize: 'vertical' }}
          />

          <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginTop: '20px', marginBottom: '8px' }}>
            Your Current Skills (Optional)
          </label>
          <textarea
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            rows={4}
            placeholder="E.g., Good with Gmail, basic
