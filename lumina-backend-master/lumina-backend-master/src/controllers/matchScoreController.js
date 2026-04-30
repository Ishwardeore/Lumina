const { analyzeResumeMatch } = require('../services/matchScoreService');
const { HTTP_STATUS } = require('../utils/constants');

exports.analyze = async (req, res, next) => {
    try {
        const { resumeText, jobDescription } = req.body;

        if (!resumeText || resumeText.trim().length < 80) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Resume text is too short. Paste more resume content for an accurate score.'
            });
        }

        if (!jobDescription || jobDescription.trim().length < 80) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Job description is too short. Paste the full job description for an accurate score.'
            });
        }

        const result = analyzeResumeMatch({ resumeText, jobDescription });
        res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        next(error);
    }
};
