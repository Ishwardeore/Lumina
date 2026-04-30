import axiosInstance from '../lib/axios';

export interface CreateReminderPayload {
    jobId: string;
    company: string;
    role: string;
    roundType: string;
    scheduledAt: string;
    notes?: string;
}

export interface CreateReminderResponse {
    reminder: unknown;
    emailConfigured: boolean;
    message: string;
}

export const reminderService = {
    createReminder: async (payload: CreateReminderPayload): Promise<CreateReminderResponse> => {
        const response = await axiosInstance.post<CreateReminderResponse>('/reminders', payload);
        return response.data;
    }
};
