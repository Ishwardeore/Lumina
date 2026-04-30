const { z } = require('zod');
const { SchemaType } = require('@google/generative-ai');
const genAI = require('../config/aiClient');
const { promptBuilder } = require('../utils/promptBuilder');
const { RESUME_RULES, AI_MODELS, RESUME_LEVELS } = require('../utils/constants');
const logger = require('../config/logger');

const { buildSystemInstruction, FALLBACK_RESUME } = require('../utils/aiTemplates');

const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        personalInfo: {
            type: SchemaType.OBJECT,
            properties: {
                fullName: { type: SchemaType.STRING },
                email: { type: SchemaType.STRING },
                phone: { type: SchemaType.STRING },
                linkedin: { type: SchemaType.STRING },
                links: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ['fullName', 'email', 'phone', 'linkedin', 'links']
        },
        summary: { type: SchemaType.STRING },
        skills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        experience: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    title: { type: SchemaType.STRING },
                    company: { type: SchemaType.STRING },
                    duration: { type: SchemaType.STRING },
                    description: { type: SchemaType.STRING }
                },
                required: ['title', 'company', 'duration', 'description']
            }
        },
        projects: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    name: { type: SchemaType.STRING },
                    tech: { type: SchemaType.STRING },
                    description: { type: SchemaType.STRING }
                },
                required: ['name', 'tech', 'description']
            }
        },
        education: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    school: { type: SchemaType.STRING },
                    degree: { type: SchemaType.STRING },
                    year: { type: SchemaType.STRING }
                },
                required: ['school', 'degree', 'year']
            }
        },
        certifications: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    name: { type: SchemaType.STRING },
                    issuer: { type: SchemaType.STRING },
                    year: { type: SchemaType.STRING }
                },
                required: ['name', 'issuer', 'year']
            }
        }
    },
    required: ['personalInfo', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications']
};

const ResumeSchema = z.object({
    personalInfo: z.object({
        fullName: z.string(),
        email: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        linkedin: z.string().optional().nullable().or(z.literal("")),
        links: z.array(z.string()).optional().nullable()
    }),
    summary: z.string(),
    skills: z.array(z.string()),
    experience: z.array(z.object({
        title: z.string(),
        company: z.string(),
        duration: z.string(),
        description: z.string()
    })).optional().nullable(),
    projects: z.array(z.object({
        name: z.string(),
        tech: z.string(),
        description: z.string()
    })).optional().nullable(),
    education: z.array(z.object({
        school: z.string(),
        degree: z.string(),
        year: z.string()
    })).optional().nullable(),
    certifications: z.array(z.object({
        name: z.string(),
        issuer: z.string(),
        year: z.string()
    })).optional().nullable()
});

const getModelCandidates = () => {
    const candidates = [
        AI_MODELS.GEMINI_PRO,
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-1.5-flash'
    ];

    return [...new Set(candidates.filter(Boolean))];
};

const parseResumeResponse = (responseContent) => {
    try {
        return JSON.parse(responseContent);
    } catch (e) {
        let text = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstCurly = text.indexOf('{');
        const lastCurly = text.lastIndexOf('}');
        if (firstCurly !== -1 && lastCurly !== -1) {
            text = text.substring(firstCurly, lastCurly + 1);
        }
        return JSON.parse(text);
    }
};

const generateResume = async (jd, level, template) => {
    const rules = RESUME_RULES;
    const currentRule = rules[level] || rules[RESUME_LEVELS.ENTRY_LEVEL];

    const systemInstruction = buildSystemInstruction(level, currentRule);

    // Append template instruction (still dynamic enough to keep here or move if needed, keeping here for now as it's small)
    const templateInstruction = `
    3. Template Style: ${template === 'compact' ? 'Concise/Single Page' : 'Detailed'}.
       ${template === 'compact'
            ? '- STRICTLY limit "summary" to 2 sentences.\n       - Limit "experience" descriptions to 2-3 high-impact bullet points maximum.'
            : '- Provide detailed "experience" descriptions (4-5 bullets) with metrics.'
        }
    `;

    try {
        const prompt = promptBuilder(jd, level);
        const fullPrompt = `${systemInstruction}\n${templateInstruction}\n\n${prompt}`;
        let lastError;

        for (const modelName of getModelCandidates()) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema,
                        temperature: 0.3,
                        maxOutputTokens: 4096,
                    }
                });

                const result = await model.generateContent(fullPrompt);
                const response = await result.response;
                const parsed = parseResumeResponse(response.text());
                const validatedData = ResumeSchema.parse(parsed);

                // Normalize nulls to empty arrays/strings for frontend safety
                if (!validatedData.personalInfo.links) validatedData.personalInfo.links = [];
                if (!validatedData.experience) validatedData.experience = [];
                if (!validatedData.projects) validatedData.projects = [];
                if (!validatedData.education) validatedData.education = [];
                if (!validatedData.certifications) validatedData.certifications = [];

                logger.info(`Resume generated with ${modelName}`);
                return validatedData;
            } catch (modelError) {
                lastError = modelError;
                logger.warn(`Gemini model ${modelName} failed, trying fallback if available`, {
                    error: modelError.message,
                    status: modelError.status
                });
            }
        }

        throw lastError;

    } catch (error) {
        logger.error('Resume Generation Failed:', error);
        return FALLBACK_RESUME;
    }
};

module.exports = { generateResume };
