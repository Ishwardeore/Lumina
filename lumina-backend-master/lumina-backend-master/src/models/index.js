const sequelize = require('../config/database');
const User = require('./User');
const Resume = require('./Resume');
const InterviewReminder = require('./InterviewReminder');

// Define Associations
User.hasMany(Resume, { foreignKey: 'userId', onDelete: 'CASCADE' });
Resume.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(InterviewReminder, { foreignKey: 'userId', onDelete: 'CASCADE' });
InterviewReminder.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    User,
    Resume,
    InterviewReminder,
    sequelize
};
