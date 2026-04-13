import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../components/ui/dialog';
import { MapPin, Plus, Pencil, Trash2, Star, Loader2 } from 'lucide-react';
import { AddressService } from '../service/addressService';
import { addressDataService } from '../service/addressDataService';
import type { LocationItem } from '../service/addressDataService';
import { SearchableSelect } from './SearchableSelect';

export interface ShippingAddress {
    id: number | string;
    fullName: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    isDefault: boolean;
}

const emptyForm: Omit<ShippingAddress, 'id'> = {
    fullName: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    street: '',
    isDefault: false,
};

const AddressManager: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | string | null>(null);
    const [form, setForm] = useState(emptyForm);

    // Location Data State
    const [provinces, setProvinces] = useState<LocationItem[]>([]);
    const [districts, setDistricts] = useState<LocationItem[]>([]);
    const [wards, setWards] = useState<LocationItem[]>([]);

    useEffect(() => {
        const loadProvinces = async () => {
            const data = await addressDataService.getProvinces();
            setProvinces(data);
        };
        loadProvinces();
    }, []);

    const handleProvinceChange = async (provinceName: string) => {
        setForm({ ...form, province: provinceName, district: '', ward: '' });
        setDistricts([]);
        setWards([]);
        
        const province = provinces.find(p => p.name === provinceName);
        if (province) {
            const data = await addressDataService.getDistricts(province.code);
            setDistricts(data);
        }
    };

    const handleDistrictChange = async (districtName: string) => {
        setForm({ ...form, district: districtName, ward: '' });
        setWards([]);

        const district = districts.find(d => d.name === districtName);
        if (district) {
            const data = await addressDataService.getWards(district.code);
            setWards(data);
        }
    };

    // Pre-fetch districts/wards when editing
    useEffect(() => {
        const fetchDataForEdit = async () => {
            if (dialogOpen && editingId && form.province) {
                const province = provinces.find(p => p.name === form.province);
                if (province) {
                    const dData = await addressDataService.getDistricts(province.code);
                    setDistricts(dData);
                    
                    if (form.district) {
                        const district = dData.find(d => d.name === form.district);
                        if (district) {
                            const wData = await addressDataService.getWards(district.code);
                            setWards(wData);
                        }
                    }
                }
            }
        };
        fetchDataForEdit();
    }, [dialogOpen, editingId, provinces]);

    const fetchAddresses = async () => {
        try {
            setIsLoading(true);
            const res = await AddressService.getAll(0, 50);
            if (res.data) {
                const addressList = Array.isArray(res.data) ? res.data : (res.data.result || []);
                const mapped = addressList.map(addr => ({
                    id: addr.id,
                    fullName: addr.receiverName,
                    phone: addr.phone,
                    province: addr.province,
                    district: addr.district,
                    ward: addr.ward,
                    street: addr.detail,
                    isDefault: addr.isDefault
                }));
                setAddresses(mapped);
            }
        } catch (error) {
            console.error('Failed to fetch addresses:', error);
            toast({ title: 'Lỗi', description: 'Không thể tải danh sách địa chỉ.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const openEdit = (addr: ShippingAddress) => {
        setEditingId(addr.id);
        const { id, ...rest } = addr;
        console.log("Editing address id:", id); // Using id to avoid unused var
        setForm(rest);
        setDialogOpen(true);
    };

    useEffect(() => {
        if (user) fetchAddresses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleSave = async () => {
        if (!form.fullName.trim() || !form.phone.trim() || !form.province.trim() || !form.district.trim() || !form.street.trim()) {
            toast({ title: 'Lỗi', description: 'Vui lòng điền đầy đủ thông tin bắt buộc.', variant: 'destructive' });
            return;
        }

        try {
            const payload = {
                receiverName: form.fullName,
                phone: form.phone,
                province: form.province,
                district: form.district,
                ward: form.ward,
                detail: form.street,
                isDefault: form.isDefault,
            };

            if (editingId) {
                await AddressService.update({ ...payload, id: Number(editingId) });
                toast({ title: 'Thành công', description: 'Đã cập nhật địa chỉ.' });
            } else {
                await AddressService.create(payload);
                toast({ title: 'Thành công', description: 'Đã thêm địa chỉ mới.' });
            }
            setDialogOpen(false);
            fetchAddresses();
        } catch {
            toast({ title: 'Lỗi', description: 'Không thể lưu địa chỉ.', variant: 'destructive' });
        }
    };

    const handleDelete = async (id: number | string) => {
        try {
            await AddressService.remove(Number(id));
            toast({ title: 'Đã xóa', description: 'Địa chỉ đã được xóa thành công.' });
            fetchAddresses();
        } catch {
            toast({ title: 'Lỗi', description: 'Không thể xóa địa chỉ.', variant: 'destructive' });
        }
    };

    const handleSetDefault = async (id: number | string) => {
        try {
            await AddressService.setDefault(Number(id));
            toast({ title: 'Thành công', description: 'Đã đặt địa chỉ mặc định.' });
            fetchAddresses();
        } catch {
            toast({ title: 'Lỗi', description: 'Không thể đặt địa chỉ mặc định.', variant: 'destructive' });
        }
    };

    const formatAddress = (a: ShippingAddress) =>
        [a.street, a.ward, a.district, a.province].filter(Boolean).join(', ');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Quản lý địa chỉ giao hàng của bạn</p>
                <Button size="sm" onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                    setDialogOpen(true);
                }}>
                    <Plus className="w-4 h-4 mr-1" />
                    Thêm địa chỉ
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : addresses.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <MapPin className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-muted-foreground">Bạn chưa có địa chỉ giao hàng nào</p>
                        <Button variant="outline" className="mt-4" onClick={() => {
                            setEditingId(null);
                            setForm(emptyForm);
                            setDialogOpen(true);
                        }}>
                            <Plus className="w-4 h-4 mr-1" />
                            Thêm địa chỉ đầu tiên
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {addresses.map((addr) => (
                        <Card key={addr.id} className={addr.isDefault ? 'border-primary' : ''}>
                            <CardContent className="py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-foreground">{addr.fullName}</span>
                                        <span className="text-muted-foreground">|</span>
                                        <span className="text-sm text-muted-foreground">{addr.phone}</span>
                                        {addr.isDefault && (
                                            <Badge variant="outline" className="border-primary text-primary text-xs">
                                                Mặc định
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{formatAddress(addr)}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {!addr.isDefault && (
                                        <Button variant="ghost" size="sm" onClick={() => handleSetDefault(addr.id)}>
                                            <Star className="w-4 h-4 mr-1" />
                                            Mặc định
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(addr)}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(addr.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Hàng 1: Tên & SĐT */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Họ và tên *</Label>
                                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Nguyễn Văn A" />
                            </div>
                            <div className="space-y-2">
                                <Label>Số điện thoại *</Label>
                                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0901234567" />
                            </div>
                        </div>

                        {/* Hàng 2: Tỉnh & Huyện */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tỉnh/Thành phố *</Label>
                                <SearchableSelect
                                    options={provinces.map(p => ({ value: p.name, label: p.name }))}
                                    value={form.province}
                                    onValueChange={handleProvinceChange}
                                    placeholder="Chọn Tỉnh/TP"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Quận/Huyện *</Label>
                                <SearchableSelect
                                    options={districts.map(d => ({ value: d.name, label: d.name }))}
                                    value={form.district}
                                    onValueChange={handleDistrictChange}
                                    placeholder="Chọn Quận/Huyện"
                                    disabled={!form.province}
                                />
                            </div>
                        </div>

                        {/* Hàng 3: Xã & Địa chỉ cụ thể */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Phường/Xã</Label>
                                <SearchableSelect
                                    options={wards.map(w => ({ value: w.name, label: w.name }))}
                                    value={form.ward}
                                    onValueChange={(val) => setForm({ ...form, ward: val })}
                                    placeholder="Chọn Phường/Xã"
                                    disabled={!form.district}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Địa chỉ cụ thể *</Label>
                                <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="123 Nguyễn Huệ" />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.isDefault}
                                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                                className="rounded border-border"
                            />
                            <span className="text-sm">Đặt làm địa chỉ mặc định</span>
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleSave}>Lưu địa chỉ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AddressManager;
