import axiosInstance from "./axiosInstance";

export const getShippingFeeApi = async (addressId: number, weight: number) => {
    const res = await axiosInstance.get(`/fee/${addressId}`, {
        params: { weight }
    });
    return res.data;
};

export const getShippingFeePreviewApi = async (province: string, district: string, ward: string, weight: number) => {
    const res = await axiosInstance.get(`/fee/preview`, {
        params: { province, district, ward, weight }
    });
    return res.data;
};
