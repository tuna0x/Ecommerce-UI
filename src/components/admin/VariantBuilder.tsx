import React, { useCallback, useMemo, useState } from "react";
import { LayoutGrid, Plus, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { formatNumberWithDots, parseNumberFromDots } from "../../lib/numberUtils";
import { cn } from "../../lib/utils";
import type { IVariantCreate } from "../../types/product.type";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { SearchableSelect } from "../SearchableSelect";

export type VariantAttributeValue = {
  id: number;
  value: string;
};

export type VariantAttributeGroup = {
  attributeId: number;
  attributeName: string;
  values: VariantAttributeValue[];
};

type AvailableImage = {
  id?: number;
  index?: number;
  url: string;
};

interface VariantBuilderProps {
  groupedAttributes: VariantAttributeGroup[];
  selectedAttributes: Record<string, string[]>;
  variants: IVariantCreate[];
  onVariantsChange: (variants: IVariantCreate[]) => void;
  productName: string;
  defaultCostPrice: number;
  editingProductId: number | null;
  availableImages: AvailableImage[];
}

const getVariantKey = (attributeValues: number[]) =>
  [...attributeValues].sort((a, b) => a - b).join("|");

const generateCombinations = (
  groups: { values: VariantAttributeValue[] }[],
  index = 0,
): number[][] => {
  if (index === groups.length) return [[]];

  const combinations: number[][] = [];
  const nextCombinations = generateCombinations(groups, index + 1);

  groups[index].values.forEach((valueItem) => {
    nextCombinations.forEach((combination) => {
      combinations.push([valueItem.id, ...combination]);
    });
  });

  return combinations;
};

const VariantBuilder: React.FC<VariantBuilderProps> = ({
  groupedAttributes,
  selectedAttributes,
  variants,
  onVariantsChange,
  productName,
  defaultCostPrice,
  editingProductId,
  availableImages,
}) => {
  const [bulkValues, setBulkValues] = useState({
    price: "",
    costPrice: "",
    stock: "",
    weight: "",
  });

  const selectedAttributeGroups = useMemo(() => {
    return groupedAttributes
      .map((attr) => ({
        attributeId: attr.attributeId,
        attributeName: attr.attributeName,
        values: attr.values.filter((value) =>
          (selectedAttributes[attr.attributeId] || []).includes(value.id.toString()),
        ),
      }))
      .filter((group) => group.values.length > 0);
  }, [groupedAttributes, selectedAttributes]);

  const combinationCount = useMemo(() => {
    if (selectedAttributeGroups.length === 0) return 0;
    return selectedAttributeGroups.reduce((total, group) => total * group.values.length, 1);
  }, [selectedAttributeGroups]);

  const combinationSummary = useMemo(() => {
    if (selectedAttributeGroups.length === 0) return "Chưa chọn thuộc tính";

    const parts = selectedAttributeGroups.map(
      (group) => `${group.values.length} ${group.attributeName}`,
    );
    return `${parts.join(" x ")} = ${combinationCount} biến thể`;
  }, [combinationCount, selectedAttributeGroups]);

  const getAttributeValueLabel = useCallback((attributeValueId: number) => {
    for (const attr of groupedAttributes) {
      const value = attr.values.find((item) => item.id === attributeValueId);
      if (value) return value.value;
    }
    return `#${attributeValueId}`;
  }, [groupedAttributes]);

  const generateVariantSku = useCallback((attributeValues: number[], index: number) => {
    const productCode = (productName || "PRODUCT")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "PRODUCT";

    const attributeCode = attributeValues
      .map((id) =>
        getAttributeValueLabel(id)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, "")
          .slice(0, 6) || id.toString(),
      )
      .join("-");

    return `${productCode}-${attributeCode || "VAR"}-${index + 1}`;
  }, [getAttributeValueLabel, productName]);

  const updateVariantAt = useCallback((
    index: number,
    updater: (variant: IVariantCreate) => IVariantCreate,
  ) => {
    onVariantsChange(variants.map((variant, variantIndex) =>
      variantIndex === index ? updater(variant) : variant,
    ));
  }, [onVariantsChange, variants]);

  const handleGenerateVariants = useCallback(() => {
    if (selectedAttributeGroups.length === 0) {
      toast.error("Vui lòng chọn ít nhất một nhóm thuộc tính phía trên");
      return;
    }

    const combinations = generateCombinations(selectedAttributeGroups);
    const nextKeys = new Set(combinations.map(getVariantKey));
    const variantsByKey = new Map(
      variants.map((variant) => [getVariantKey(variant.attributeValues), variant]),
    );
    const removedCount = variants.filter(
      (variant) => !nextKeys.has(getVariantKey(variant.attributeValues)),
    ).length;

    if (removedCount > 0) {
      const confirmed = window.confirm(
        `Có ${removedCount} biến thể không còn nằm trong tổ hợp mới. Xóa các dòng này?`,
      );
      if (!confirmed) return;
    }

    const nextVariants = combinations.map((combination, index) => {
      const existingVariant = variantsByKey.get(getVariantKey(combination));
      if (existingVariant) {
        return {
          ...existingVariant,
          attributeValues: combination,
        };
      }

      return {
        sku: generateVariantSku(combination, index),
        price: null,
        costPrice: defaultCostPrice || 0,
        stock: 0,
        weight: 200,
        attributeValues: combination,
      };
    });

    onVariantsChange(nextVariants);
    toast.success(`Đã tạo/cập nhật ${nextVariants.length} biến thể`);
  }, [
    defaultCostPrice,
    generateVariantSku,
    onVariantsChange,
    selectedAttributeGroups,
    variants,
  ]);

  const handleAddVariant = useCallback(() => {
    onVariantsChange([
      ...variants,
      {
        sku: `${(productName || "PRODUCT").toUpperCase().replace(/\s+/g, "-")}-${Date.now()}`,
        price: null,
        costPrice: defaultCostPrice || 0,
        stock: 0,
        weight: 0,
        attributeValues: [],
      },
    ]);
  }, [defaultCostPrice, onVariantsChange, productName, variants]);

  const handleRegenerateSkus = useCallback(() => {
    onVariantsChange(variants.map((variant, index) => ({
      ...variant,
      sku: generateVariantSku(variant.attributeValues, index),
    })));
  }, [generateVariantSku, onVariantsChange, variants]);

  const applyBulkValue = useCallback((field: keyof typeof bulkValues) => {
    const rawValue = bulkValues[field];
    if (rawValue.trim() === "") {
      toast.error("Nhập giá trị trước khi áp dụng");
      return;
    }

    const parsedValue = field === "price" || field === "costPrice"
      ? parseNumberFromDots(rawValue)
      : Number(rawValue);

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      toast.error("Giá trị không hợp lệ");
      return;
    }

    onVariantsChange(variants.map((variant) => ({
      ...variant,
      [field]: field === "price" ? parsedValue : Math.max(0, parsedValue),
    })));
  }, [bulkValues, onVariantsChange, variants]);

  return (
    <div className="grid gap-4 mt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Label className="text-base font-semibold">
          Biến thể sản phẩm
        </Label>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="h-8 px-3">
            {combinationSummary}
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-primary border-primary/50 hover:bg-primary/5"
            onClick={handleGenerateVariants}
            disabled={combinationCount === 0}
          >
            <Wand2 className="h-4 w-4" />
            Tạo tổ hợp
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={handleRegenerateSkus}
            disabled={variants.length === 0}
          >
            <LayoutGrid className="h-4 w-4" />
            SKU
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={handleAddVariant}
          >
            <Plus className="h-4 w-4" />
            Thêm
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {variants.length > 0 && (
          <div className="grid gap-2 rounded-lg border border-border bg-background p-3 sm:grid-cols-2">
            <div className="flex gap-2">
              <Input
                value={bulkValues.price}
                onChange={(e) => setBulkValues((prev) => ({ ...prev, price: e.target.value }))}
                className="h-8 text-xs"
                placeholder="Giá bán"
              />
              <Button type="button" variant="outline" size="sm" className="h-8 shrink-0" onClick={() => applyBulkValue("price")}>
                Áp
              </Button>
            </div>
            {!editingProductId && (
              <div className="flex gap-2">
                <Input
                  value={bulkValues.costPrice}
                  onChange={(e) => setBulkValues((prev) => ({ ...prev, costPrice: e.target.value }))}
                  className="h-8 text-xs"
                  placeholder="Giá vốn"
                />
                <Button type="button" variant="outline" size="sm" className="h-8 shrink-0" onClick={() => applyBulkValue("costPrice")}>
                  Áp
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                value={bulkValues.stock}
                onChange={(e) => setBulkValues((prev) => ({ ...prev, stock: e.target.value }))}
                className="h-8 text-xs"
                placeholder="Kho"
              />
              <Button type="button" variant="outline" size="sm" className="h-8 shrink-0" onClick={() => applyBulkValue("stock")}>
                Áp
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                value={bulkValues.weight}
                onChange={(e) => setBulkValues((prev) => ({ ...prev, weight: e.target.value }))}
                className="h-8 text-xs"
                placeholder="Cân nặng"
              />
              <Button type="button" variant="outline" size="sm" className="h-8 shrink-0" onClick={() => applyBulkValue("weight")}>
                Áp
              </Button>
            </div>
          </div>
        )}

        {variants.map((variant, variantIndex) => (
          <Card key={`${getVariantKey(variant.attributeValues)}-${variantIndex}`} className="relative overflow-hidden border-border bg-muted/20">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-destructive/10"
              onClick={() => onVariantsChange(variants.filter((_, index) => index !== variantIndex))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <CardContent className="p-4 grid gap-4">
              <div className={`grid ${!editingProductId ? "grid-cols-3" : "grid-cols-2"} gap-4`}>
                <div className="space-y-2">
                  <Label className="text-xs">SKU</Label>
                  <Input
                    value={variant.sku}
                    onChange={(e) => updateVariantAt(variantIndex, (current) => ({ ...current, sku: e.target.value }))}
                    className="h-8 text-xs"
                    placeholder="SKU biến thể"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Giá bán Override</Label>
                  <Input
                    type="text"
                    value={formatNumberWithDots(variant.price)}
                    onChange={(e) => {
                      const rawValue = e.target.value ? parseNumberFromDots(e.target.value) : null;
                      updateVariantAt(variantIndex, (current) => ({ ...current, price: rawValue }));
                    }}
                    className="h-8 text-xs font-bold"
                    placeholder="Dùng giá chính"
                  />
                </div>
                {!editingProductId && (
                  <div className="space-y-2">
                    <Label className="text-xs">Giá vốn (VNĐ)</Label>
                    <Input
                      type="text"
                      value={formatNumberWithDots(variant.costPrice)}
                      onChange={(e) => {
                        const rawValue = e.target.value ? parseNumberFromDots(e.target.value) : 0;
                        updateVariantAt(variantIndex, (current) => ({ ...current, costPrice: rawValue }));
                      }}
                      className="h-8 text-xs font-bold text-orange-600"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Kho hàng</Label>
                  <Input
                    type="number"
                    min="0"
                    value={variant.stock}
                    onChange={(e) =>
                      updateVariantAt(variantIndex, (current) => ({
                        ...current,
                        stock: Math.max(0, Number(e.target.value)),
                      }))
                    }
                    className="h-8 text-xs"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Cân nặng (g)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={variant.weight}
                    onChange={(e) =>
                      updateVariantAt(variantIndex, (current) => ({
                        ...current,
                        weight: Math.max(0, Number(e.target.value)),
                      }))
                    }
                    className="h-8 text-xs"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Ảnh biến thể</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/20">
                  {availableImages.map((img, imageIndex) => {
                    const isSelected = img.id
                      ? variant.productImageId === img.id
                      : variant.productImageIndex === img.index;

                    return (
                      <button
                        key={`${img.url}-${imageIndex}`}
                        type="button"
                        onClick={() =>
                          updateVariantAt(variantIndex, (current) => ({
                            ...current,
                            productImageId: img.id,
                            productImageIndex: img.id ? undefined : img.index,
                          }))
                        }
                        className={cn(
                          "relative w-12 h-12 rounded border-2 cursor-pointer overflow-hidden transition-all hover:scale-105",
                          isSelected ? "border-primary shadow-sm ring-1 ring-primary" : "border-transparent opacity-60 hover:opacity-100",
                        )}
                      >
                        <img
                          src={img.url}
                          alt="Variant"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                  {availableImages.length === 0 && (
                    <div className="text-[10px] text-muted-foreground italic py-1">
                      Hãy tải ảnh lên trước để chọn cho biến thể
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Thuộc tính</Label>
                <div className="flex flex-wrap gap-2">
                  {groupedAttributes.map((attr) => {
                    const selectedValueId = variant.attributeValues.find((id) =>
                      attr.values.some((value) => value.id === id),
                    );

                    return (
                      <div key={attr.attributeId} className="w-full">
                        <SearchableSelect
                          options={attr.values.map((value) => ({
                            value: value.id.toString(),
                            label: value.value,
                          }))}
                          value={selectedValueId?.toString() || "none"}
                          onValueChange={(val) => {
                            const attributeValueIds = variant.attributeValues.filter((id) =>
                              !attr.values.some((value) => value.id === id),
                            );
                            if (val !== "none") {
                              attributeValueIds.push(Number(val));
                            }
                            updateVariantAt(variantIndex, (current) => ({
                              ...current,
                              attributeValues: attributeValueIds,
                            }));
                          }}
                          placeholder={attr.attributeName}
                          className="h-8 text-xs w-full"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {variants.length === 0 && (
          <div className="text-center py-8 rounded-lg border-2 border-dashed border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Chưa có biến thể nào. Nhấn "Tạo tổ hợp" hoặc "Thêm" để bắt đầu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VariantBuilder;
