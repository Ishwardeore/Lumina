const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const InterviewReminder = sequelize.define('InterviewReminder', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    jobId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    company: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false
    },
    roundType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    scheduledAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    recipientEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'sent', 'failed', 'cancelled']]
        }
    },
    sentAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastError: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['status', 'scheduledAt'] }
    ]
});

module.exports = InterviewReminder;
