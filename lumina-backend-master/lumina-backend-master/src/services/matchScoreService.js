const STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have',
    'in', 'is', 'it', 'of', 'on', 'or', 'our', 'that', 'the', 'their', 'this', 'to',
    'we', 'with', 'you', 'your', 'will', 'work', 'working', 'team', 'teams', 'role',
    'candidate', 'job', 'position', 'responsibilities', 'requirements', 'experience',
    'need', 'needs', 'required', 'preferred', 'including', 'description', 'key',
    'about', 'overview', 'summary', 'looking', 'strong', 'good', 'excellent',
    'ability', 'knowledge', 'understanding', 'etc'
]);

const TRACKED_KEYWORDS = [
    'react native', 'android development', 'ios development', 'mobile development',
    'react', 'android', 'ios', 'kotlin', 'swift', 'node', 'express', 'javascript', 'typescript', 'python', 'java', 'sql',
    'sqlite', 'postgresql', 'mongodb', 'mongoose', 'sequelize', 'api', 'rest', 'graphql',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'github', 'ci', 'cd',
    'testing', 'jest', 'html', 'css', 'tailwind', 'redux', 'next', 'vite', 'jwt',
    'oauth', 'authentication', 'authorization', 'database', 'frontend', 'backend',
    'fullstack', 'machine learning', 'ai', 'analytics', 'dashboard', 'responsive',
    'performance', 'security', 'cloud', 'deployment', 'agile', 'scrum', 'figma',
    'ui', 'ux', 'websockets', 'websocket', 'redis', 'firebase', 'supabase', 'linux', 'nginx',
    'microservices', 'serverless', 'devops', 'vercel', 'render', 'netlify',
    'data analysis', 'data visualization', 'power bi', 'tableau', 'excel',
    'communication', 'leadership', 'collaboration', 'problem solving'
];

const KEYWORD_ALIASES = {
    'android development': ['android', 'android app', 'android apps', 'kotlin'],
    'ios development': ['ios', 'ios app', 'ios apps', 'swift'],
    'mobile development': ['mobile app', 'mobile apps', 'android', 'ios', 'react native'],
    'websockets': ['websocket', 'web sockets', 'web socket'],
    'websocket': ['websockets', 'web sockets', 'web socket']
};

const normalize = (text = '') => text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, ' ');
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const termRegex = term => {
    const boundary = /[a-z0-9+#]/;
    const normalizedTerm = normalize(term).trim();
    const start = boundary.test(normalizedTerm[0]) ? '(?<![a-z0-9+#])' : '';
    const end = boundary.test(normalizedTerm[normalizedTerm.length - 1]) ? '(?![a-z0-9+#])' : '';
    return new RegExp(`${start}${escapeRegex(normalizedTerm)}${end}`, 'g');
};

const hasTerm = (text, term) => termRegex(term).test(normalize(text));

const findTermRanges = (text, term) => {
    const ranges = [];
    const normalizedText = normalize(text);
    const regex = termRegex(term);
    let match;

    while ((match = regex.exec(normalizedText)) !== null) {
        ranges.push({ start: match.index, end: match.index + match[0].length });
    }

    return ranges;
};

const tokenize = (text = '') => normalize(text)
    .split(/\s+/)
    .map(word => word.trim().replace(/^[^a-z0-9+#]+|[^a-z0-9+#]+$/g, ''))
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));

const unique = items => [...new Set(items)];

const isInsideRange = (range, container) => range.start >= container.start && range.end <= container.end;

const removeCoveredShortTerms = (keywords, sourceText) => {
    const terms = unique(keywords);
    return terms.filter(term => {
        const termParts = term.split(/\s+/);
        if (termParts.length > 1) return true;

        const coveringTerms = terms.filter(other => {
            return other !== term && other.includes(' ') && other.split(/\s+/).includes(term);
        });

        if (coveringTerms.length === 0) return true;

        const termRanges = findTermRanges(sourceText, term);
        const coveringRanges = coveringTerms.flatMap(other => findTermRanges(sourceText, other));

        return termRanges.some(range => !coveringRanges.some(container => isInsideRange(range, container)));
    });
};

const extractPhrases = (text = '') => {
    const words = tokenize(text);
    const phrases = [];

    for (let i = 0; i < words.length - 1; i += 1) {
        const phrase = `${words[i]} ${words[i + 1]}`;
        if (phrase.length >= 7 && !STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i + 1])) {
            phrases.push(phrase);
        }
    }

    return unique(phrases);
};

const extractKeywords = (jobDescription = '') => {
    const detectedImportantTerms = TRACKED_KEYWORDS.filter(term => hasTerm(jobDescription, term));
    const phrases = extractPhrases(jobDescription)
        .filter(phrase => TRACKED_KEYWORDS.includes(phrase))
        .slice(0, 8);

    return removeCoveredShortTerms([...detectedImportantTerms, ...phrases], jobDescription).slice(0, 35);
};

const includesTerm = (text, term) => {
    if (hasTerm(text, term)) return true;
    return (KEYWORD_ALIASES[term] || []).some(alias => hasTerm(text, alias));
};

const buildSuggestions = ({ score, missingKeywords, resumeText, jobDescription }) => {
    const suggestions = [];
    const lowerResume = normalize(resumeText);
    const lowerJd = normalize(jobDescription);

    if (missingKeywords.length > 0) {
        suggestions.push(`Add truthful evidence for these job keywords: ${missingKeywords.slice(0, 5).join(', ')}.`);
    }

    if (!/\d/.test(resumeText)) {
        suggestions.push('Add measurable impact where possible, such as users served, speed improved, bugs reduced, or project scale.');
    }

    if (lowerJd.includes('project') && !lowerResume.includes('project')) {
        suggestions.push('Include 1-2 relevant projects that prove the skills mentioned in the job description.');
    }

    if ((lowerJd.includes('api') || lowerJd.includes('backend')) && !lowerResume.includes('api')) {
        suggestions.push('Mention API/backend work if you have done it, including routes, authentication, databases, or deployment.');
    }

    if (score < 60) {
        suggestions.push('Tailor the summary and top skills section before applying; the current resume may look too generic for this role.');
    } else if (score < 80) {
        suggestions.push('Your resume is close. Improve the missing keywords and make the most relevant project appear near the top.');
    } else {
        suggestions.push('Strong match. Do a final check for honest wording, grammar, and role-specific ordering.');
    }

    return unique(suggestions).slice(0, 6);
};

const analyzeResumeMatch = ({ resumeText, jobDescription }) => {
    const keywords = extractKeywords(jobDescription);
    const matchedKeywords = keywords.filter(keyword => includesTerm(resumeText, keyword));
    const missingKeywords = keywords.filter(keyword => !includesTerm(resumeText, keyword)).slice(0, 18);

    const keywordCoverage = keywords.length ? matchedKeywords.length / keywords.length : 0;
    const resumeLengthScore = Math.min(tokenize(resumeText).length / 180, 1);
    const hasMetricsScore = /\d/.test(resumeText) ? 1 : 0;
    const score = Math.round((keywordCoverage * 75) + (resumeLengthScore * 15) + (hasMetricsScore * 10));

    const verdict = score >= 80
        ? 'Strong match'
        : score >= 60
            ? 'Good match'
            : score >= 40
                ? 'Needs tailoring'
                : 'Low match';

    return {
        score,
        verdict,
        matchedKeywords: matchedKeywords.slice(0, 18),
        missingKeywords,
        suggestions: buildSuggestions({ score, missingKeywords, resumeText, jobDescription }),
        breakdown: {
            keywordCoverage: Math.round(keywordCoverage * 100),
            resumeDepth: Math.round(resumeLengthScore * 100),
            measurableImpact: hasMetricsScore ? 100 : 0
        }
    };
};

module.exports = { analyzeResumeMatch };
