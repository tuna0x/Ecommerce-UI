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
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Tỉnh/Thành phố *</Label>
                                <Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} placeholder="TP. Hồ Chí Minh" />
                            </div>
                            <div className="space-y-2">
                                <Label>Quận/Huyện *</Label>
                                <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="Quận 1" />
                            </div>
                            <div className="space-y-2">
                                <Label>Phường/Xã</Label>
                                <Input value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} placeholder="Phường Bến Nghé" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Địa chỉ cụ thể *</Label>
                            <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="123 Nguyễn Huệ" />
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
