import axiosInstance from "./axiosInstance";

export interface SkincareCheckInState {
  id?: number;
  streak: number;
  lastCheckIn: string | null;
  history: string[];
  claimedMilestones: string[];
}

export const skincareCheckInService = {
  getCheckInState: async (): Promise<SkincareCheckInState> => {
    const response = await axiosInstance.get("/skincare-checkin");
    return response.data.data;
  },

  checkIn: async (): Promise<SkincareCheckInState> => {
    const response = await axiosInstance.post("/skincare-checkin");
    return response.data.data;
  },

  claimMilestone: async (milestoneId: string): Promise<SkincareCheckInState> => {
    const response = await axiosInstance.post(`/skincare-checkin/claim/${milestoneId}`);
    return response.data.data;
  }
};
export default skincareCheckInService;
