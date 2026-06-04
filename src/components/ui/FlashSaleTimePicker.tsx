import React, { useMemo, useState } from "react";
import { Clock, Calendar as CalendarIcon, Zap, Check } from "lucide-react";
import { Button } from "./button";
import { Label } from "./label";
import { cn } from "../../lib/utils";
import { format, parse, isValid } from "date-fns";
import { FLASH_SALE_SLOTS } from "../../lib/date";

interface FlashSaleTimePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (start: Date, end: Date) => void;
}

export const FlashSaleTimePicker: React.FC<FlashSaleTimePickerProps> = ({
  startDate,
  endDate,
  onChange,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(format(startDate, "yyyy-MM-dd"));

  const activeSlot = useMemo(() => {
    const startStr = format(startDate, "HH:mm:ss");
    const endStr = format(endDate, "HH:mm:ss");
    const slotIndex = FLASH_SALE_SLOTS.findIndex(
      (slot) => slot.start === startStr && slot.end === endStr
    );
    return slotIndex !== -1 ? slotIndex : null;
  }, [startDate, endDate]);

  const handleDateChange = (dateStr: string) => {
    setSelectedDate(dateStr);
    const newStart = parse(`${dateStr} ${format(startDate, "HH:mm:ss")}`, "yyyy-MM-dd HH:mm:ss", new Date());
    const newEnd = parse(`${dateStr} ${format(endDate, "HH:mm:ss")}`, "yyyy-MM-dd HH:mm:ss", new Date());
    if (isValid(newStart) && isValid(newEnd)) {
      onChange(newStart, newEnd);
    }
  };

  const handleSlotSelect = (index: number) => {
    const slot = FLASH_SALE_SLOTS[index];
    const newStart = parse(`${selectedDate} ${slot.start}`, "yyyy-MM-dd HH:mm:ss", new Date());
    const newEnd = parse(`${selectedDate} ${slot.end}`, "yyyy-MM-dd HH:mm:ss", new Date());

    if (isValid(newStart) && isValid(newEnd)) {
      onChange(newStart, newEnd);
    }
  };

  return (
    <div className="space-y-3 p-3 sm:p-4 border rounded-xl bg-card shadow-sm">
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between border-b pb-2 gap-2">
        <Label className="text-[13px] font-bold flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          Ngày chạy chiến dịch
        </Label>
        <input
          type="date"
          className="bg-transparent border-none focus:ring-0 text-sm font-semibold p-0 h-8 w-full xs:w-auto text-left xs:text-right"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] uppercase text-muted-foreground font-black flex items-center gap-2 tracking-wider">
          <Zap className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
          CHỌN NHANH KHUNG GIỜ FLASH SALE
        </Label>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
          {FLASH_SALE_SLOTS.map((slot, index) => {
            const isActive = activeSlot === index;
            return (
              <Button
                key={index}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "h-auto py-2 px-3 flex flex-row items-center justify-between gap-2 transition-all border shadow-sm whitespace-normal text-left",
                  isActive 
                    ? "bg-pink-600 border-pink-600 text-white ring-1 ring-pink-600 ring-offset-1" 
                    : "hover:border-pink-600 hover:bg-pink-50/50"
                )}
                onClick={() => handleSlotSelect(index)}
              >
                <div className="flex flex-col items-start gap-0.5 min-w-0">
                  <span className="text-[11px] font-black leading-tight uppercase break-words">{slot.name}</span>
                  <span className="text-[10px] opacity-90 leading-tight font-medium">
                    {slot.start.slice(0, 5)} - {slot.end.slice(0, 5)}
                  </span>
                </div>
                {isActive && <Check className="h-3 w-3 shrink-0" />}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[12px] font-bold text-muted-foreground uppercase tracking-tight">
          <Clock className="h-4 w-4" />
          Tùy chỉnh giờ:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full md:w-auto min-w-0">
          <div className="flex items-center gap-3 bg-muted/50 px-3 py-2 rounded-lg border border-border min-w-0">
            <span className="text-[11px] font-bold text-muted-foreground shrink-0 w-8">TỪ</span>
            <input
              type="time"
              step="1"
              value={format(startDate, "HH:mm:ss")}
              onChange={(e) => {
                const newStart = parse(`${selectedDate} ${e.target.value}`, "yyyy-MM-dd HH:mm:ss", new Date());
                if (isValid(newStart)) onChange(newStart, endDate);
              }}
              className="bg-transparent border-none text-[13px] font-bold font-mono p-0 w-full h-5 focus:ring-0 min-w-0"
            />
          </div>
          <div className="flex items-center gap-3 bg-muted/50 px-3 py-2 rounded-lg border border-border min-w-0">
            <span className="text-[11px] font-bold text-muted-foreground shrink-0 w-8">ĐẾN</span>
            <input
              type="time"
              step="1"
              value={format(endDate, "HH:mm:ss")}
              onChange={(e) => {
                const newEnd = parse(`${selectedDate} ${e.target.value}`, "yyyy-MM-dd HH:mm:ss", new Date());
                if (isValid(newEnd)) onChange(startDate, newEnd);
              }}
              className="bg-transparent border-none text-[13px] font-bold font-mono p-0 w-full h-5 focus:ring-0 min-w-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};


