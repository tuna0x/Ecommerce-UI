import React, { useState } from "react";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { mockAttributes } from "../../data/mockAttributes";
import type { Attribute, AttributeValue } from "../../data/mockAttributes";
import { toast } from "sonner";

const AttributesManagement: React.FC = () => {
  const [attributes, setAttributes] = useState<Attribute[]>(mockAttributes);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "select" as Attribute["type"],
    isActive: true,
  });
  const [values, setValues] = useState<AttributeValue[]>([]);
  const [newValue, setNewValue] = useState("");
  const [newDisplayValue, setNewDisplayValue] = useState("");

  const filteredAttributes = attributes.filter(
    (attr) =>
      attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attr.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getTypeLabel = (type: Attribute["type"]) => {
    const labels = {
      select: "Dropdown",
      color: "Màu sắc",
      size: "Kích thước",
      text: "Văn bản",
    };
    return labels[type];
  };

  const handleOpenDialog = (attribute?: Attribute) => {
    if (attribute) {
      setEditingAttribute(attribute);
      setFormData({
        name: attribute.name,
        code: attribute.code,
        type: attribute.type,
        isActive: attribute.isActive,
      });
      setValues([...attribute.values]);
    } else {
      setEditingAttribute(null);
      setFormData({
        name: "",
        code: "",
        type: "select",
        isActive: true,
      });
      setValues([]);
    }
    setNewValue("");
    setNewDisplayValue("");
    setIsDialogOpen(true);
  };

  const handleAddValue = () => {
    if (!newValue.trim()) return;
    const newVal: AttributeValue = {
      id: Date.now().toString(),
      value: newValue.trim(),
      displayValue: newDisplayValue.trim() || undefined,
    };
    setValues([...values, newVal]);
    setNewValue("");
    setNewDisplayValue("");
  };

  const handleRemoveValue = (id: string) => {
    setValues(values.filter((v) => v.id !== id));
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (values.length === 0) {
      toast.error("Vui lòng thêm ít nhất một giá trị");
      return;
    }

    if (editingAttribute) {
      setAttributes(
        attributes.map((attr) =>
          attr.id === editingAttribute.id
            ? { ...attr, ...formData, values }
            : attr,
        ),
      );
      toast.success("Đã cập nhật thuộc tính");
    } else {
      const newAttribute: Attribute = {
        id: Date.now().toString(),
        ...formData,
        values,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setAttributes([...attributes, newAttribute]);
      toast.success("Đã thêm thuộc tính mới");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setAttributes(attributes.filter((attr) => attr.id !== id));
    toast.success("Đã xóa thuộc tính");
  };

  const generateCode = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Thuộc tính</h1>
          <p className="text-muted-foreground">
            Quản lý các thuộc tính sản phẩm
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm thuộc tính
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm thuộc tính..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên thuộc tính</TableHead>
              <TableHead>Mã</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Giá trị</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttributes.map((attribute) => (
              <TableRow key={attribute.id}>
                <TableCell className="font-medium">{attribute.name}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">
                  {attribute.code}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getTypeLabel(attribute.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {attribute.values.slice(0, 3).map((val) => (
                      <Badge
                        key={val.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {attribute.type === "color" ? (
                          <span className="flex items-center gap-1">
                            <span
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: val.value }}
                            />
                            {val.displayValue}
                          </span>
                        ) : (
                          val.value
                        )}
                      </Badge>
                    ))}
                    {attribute.values.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{attribute.values.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={attribute.isActive ? "default" : "secondary"}>
                    {attribute.isActive ? "Hoạt động" : "Ẩn"}
                  </Badge>
                </TableCell>
                <TableCell>{attribute.createdAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(attribute)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(attribute.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAttribute ? "Sửa thuộc tính" : "Thêm thuộc tính mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên thuộc tính *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      code: generateCode(e.target.value),
                    });
                  }}
                  placeholder="VD: Dung tích"
                />
              </div>
              <div className="space-y-2">
                <Label>Mã thuộc tính *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="VD: volume"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại thuộc tính</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Attribute["type"]) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="color">Màu sắc</SelectItem>
                    <SelectItem value="size">Kích thước</SelectItem>
                    <SelectItem value="text">Văn bản</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive">Hoạt động</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Giá trị thuộc tính</Label>
              <div className="flex gap-2">
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={
                    formData.type === "color" ? "#FF6B6B" : "Giá trị"
                  }
                  className="flex-1"
                />
                {formData.type === "color" && (
                  <Input
                    value={newDisplayValue}
                    onChange={(e) => setNewDisplayValue(e.target.value)}
                    placeholder="Tên hiển thị"
                    className="flex-1"
                  />
                )}
                <Button type="button" onClick={handleAddValue} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {values.map((val) => (
                  <Badge
                    key={val.id}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {formData.type === "color" ? (
                      <span className="flex items-center gap-1">
                        <span
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: val.value }}
                        />
                        {val.displayValue || val.value}
                      </span>
                    ) : (
                      val.value
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(val.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {editingAttribute ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttributesManagement;
