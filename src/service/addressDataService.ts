import axios from 'axios';

const BASE_URL = 'https://provinces.open-api.vn/api';

export interface LocationItem {
  code: number;
  name: string;
}

export const addressDataService = {
  getProvinces: async (): Promise<LocationItem[]> => {
    try {
      const res = await axios.get(`${BASE_URL}/p/`);
      return res.data;
    } catch (error) {
      console.error("Failed to fetch provinces", error);
      return [];
    }
  },
  getDistricts: async (provinceCode: number): Promise<LocationItem[]> => {
    try {
      const res = await axios.get(`${BASE_URL}/p/${provinceCode}?depth=2`);
      return res.data.districts;
    } catch (error) {
      console.error("Failed to fetch districts", error);
      return [];
    }
  },
  getWards: async (districtCode: number): Promise<LocationItem[]> => {
    try {
      const res = await axios.get(`${BASE_URL}/d/${districtCode}?depth=2`);
      return res.data.wards;
    } catch (error) {
      console.error("Failed to fetch wards", error);
      return [];
    }
  }
};
