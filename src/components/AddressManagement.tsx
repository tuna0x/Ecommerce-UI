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
import { MapPin, Plus, Pencil, Trash2, Star } from 'lucide-react';

export interface ShippingAddress {
    id: string;
    fullName: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    isDefault: boolean;
}

const STORAGE_KEY = 'beautylux_addresses';

const getAddresses = (userId: string): ShippingAddress[] => {
    const data = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
};

const saveAddresses = (userId: string, addresses: ShippingAddress[]) => {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(addresses));
};

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
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        if (user) setAddresses(getAddresses(user.id));
    }, [user]);

    const persist = (updated: ShippingAddress[]) => {
        if (!user) return;
        setAddresses(updated);
        saveAddresses(user.id, updated);
    };

    const openAdd = () => {
        setEditingId(null);
        setForm({ ...emptyForm, isDefault: addresses.length === 0 });
        setDialogOpen(true);
    };

    const openEdit = (addr: ShippingAddress) => {
        setEditingId(addr.id);
        const { id, ...rest } = addr;
        setForm(rest);
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (!form.fullName.trim() || !form.phone.trim() || !form.province.trim() || !form.district.trim() || !form.street.trim()) {
            toast({ title: 'Lỗi', description: 'Vui lòng điền đầy đủ thông tin bắt buộc.', variant: 'destructive' });
            return;
        }

        let updated: ShippingAddress[];

        if (editingId) {
            updated = addresses.map((a) =>
                a.id === editingId ? { ...form, id: editingId } : form.isDefault ? { ...a, isDefault: false } : a
            );
        } else {
            const newAddr: ShippingAddress = { ...form, id: Date.now().toString() };
            if (newAddr.isDefault) {
                updated = [...addresses.map((a) => ({ ...a, isDefault: false })), newAddr];
            } else {
                updated = [...addresses, newAddr];
            }
        }

        persist(updated);
        setDialogOpen(false);
        toast({ title: editingId ? 'Đã cập nhật' : 'Đã thêm', description: 'Địa chỉ giao hàng đã được lưu.' });
    };

    const handleDelete = (id: string) => {
        const updated = addresses.filter((a) => a.id !== id);
        if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
            updated[0].isDefault = true;
        }
        persist(updated);
        toast({ title: 'Đã xóa', description: 'Địa chỉ đã được xóa.' });
    };

    const handleSetDefault = (id: string) => {
        const updated = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
        persist(updated);
        toast({ title: 'Đã cập nhật', description: 'Địa chỉ mặc định đã được thay đổi.' });
    };

    const formatAddress = (a: ShippingAddress) =>
        [a.street, a.ward, a.district, a.province].filter(Boolean).join(', ');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Quản lý địa chỉ giao hàng của bạn</p>
                <Button size="sm" onClick={openAdd}>
                    <Plus className="w-4 h-4 mr-1" />
                    Thêm địa chỉ
                </Button>
            </div>

            {addresses.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <MapPin className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-muted-foreground">Bạn chưa có địa chỉ giao hàng nào</p>
                        <Button variant="outline" className="mt-4" onClick={openAdd}>
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
