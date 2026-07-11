import api from "./api";

/**
 * Fetch daily quiz attempts statistics for a given date (formatted as YYYY-MM-DD).
 */
export const getDailyQuizAttemptsStats = async (date, page = 0, size = 10) => {
  const dateParam = date ? `&date=${date}` : "";
  const response = await api.get(`/api/admin/tracking/daily-quiz-attempts?page=${page}&size=${size}${dateParam}`);
  return response.data;
};

/**
 * Fetch daily challenge participations for a given date (formatted as YYYY-MM-DD).
 */
export const getDailyChallengeParticipations = async (date, page = 0, size = 10) => {
  const dateParam = date ? `&date=${date}` : "";
  const response = await api.get(`/api/admin/tracking/daily-challenge-participations?page=${page}&size=${size}${dateParam}`);
  return response.data;
};

/**
 * Fetch the leaderboard ranking users by their number of daily challenge attempts.
 */
export const getTopUsersByChallengeAttempts = async (page = 0, size = 10) => {
  const response = await api.get(`/api/admin/tracking/leaderboard/daily-challenges?page=${page}&size=${size}`);
  return response.data;
};

/**
 * Fetch a specific user's daily challenge attempt history.
 */
export const getUserDailyChallengeHistory = async (userId, page = 0, size = 10) => {
  const response = await api.get(`/api/admin/tracking/daily-challenges/user/${userId}?page=${page}&size=${size}`);
  return response.data;
};
