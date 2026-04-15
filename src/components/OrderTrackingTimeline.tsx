import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  CheckCircle2, 
  Truck, 
  Star, 
  Clock,
  PackageCheck
} from 'lucide-react';
import { cn } from '../lib/utils';

interface TimelineStep {
  id: number;
  label: string;
  subLabel?: string;
  icon: React.ElementType;
  statusKey: string;
}

interface OrderTrackingTimelineProps {
  status: string;
  createdAt?: string;
  confirmedAt?: string;
  deliveredAt?: string;
}

const steps: TimelineStep[] = [
  { id: 1, label: 'Đã đặt hàng', subLabel: 'Đơn hàng đã được ghi nhận', icon: ShoppingBag, statusKey: 'PENDING' },
  { id: 2, label: 'Đã xác nhận', subLabel: 'Bông Cosmetic đã nhận đơn', icon: PackageCheck, statusKey: 'CONFIRMED' },
  { id: 3, label: 'Đang giao hàng', subLabel: 'Đang trên đường tới bạn', icon: Truck, statusKey: 'DELIVERING' },
  { id: 4, label: 'Thành công', subLabel: 'Đã giao hàng thành công', icon: Star, statusKey: 'DELIVERED' },
];

const OrderTrackingTimeline: React.FC<OrderTrackingTimelineProps> = ({ 
  status, 
  createdAt, 
  confirmedAt, 
  deliveredAt 
}) => {
  
  // Logic to determine which steps are completed
  const getActiveIndex = () => {
    switch (status) {
      case 'PENDING': return 0;
      case 'CONFIRMED': return 1;
      case 'DELIVERING': return 2;
      case 'DELIVERED': return 3;
      default: return 0;
    }
  };

  const activeIndex = getActiveIndex();

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const getStepDate = (index: number) => {
    if (index === 0) return formatDate(createdAt);
    if (index === 1 && confirmedAt) return formatDate(confirmedAt);
    if (index === 3 && deliveredAt) return formatDate(deliveredAt);
    return null;
  };

  if (status === 'CANCELLED') {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-black text-red-900 uppercase tracking-tight">Đơn hàng đã bị hủy</h3>
          <p className="text-sm text-red-600 font-bold italic">Rất tiếc, đơn hàng này đã không thể hoàn thành.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-2 md:px-0">
      <div className="relative flex justify-between items-start">
        {/* Progress Background Line */}
        <div className="absolute top-6 left-0 w-full h-1 bg-gray-100 rounded-full z-0" />
        
        {/* Animated Active Line */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute top-6 left-0 h-1 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full z-10"
        />

        {steps.map((step, index) => {
          const isCompleted = index <= activeIndex;
          const isCurrent = index === activeIndex;
          const StepIcon = step.icon;
          const date = getStepDate(index);

          return (
            <div key={step.id} className="relative z-20 flex flex-col items-center flex-1 max-w-[25%] opacity-100">
              {/* Icon Circle */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: isCurrent ? 1.2 : 1, opacity: 1 }}
                transition={{ delay: index * 0.2 }}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm",
                  isCompleted 
                    ? "bg-pink-600 text-white shadow-pink-200" 
                    : "bg-white text-gray-300 border-2 border-gray-100"
                )}
              >
                {isCompleted && index < activeIndex ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <StepIcon className={cn("w-6 h-6", isCurrent && "animate-pulse")} />
                )}
              </motion.div>

              {/* Labels */}
              <div className="text-center mt-4 px-1">
                <p className={cn(
                  "text-[10px] md:text-[11px] font-black uppercase tracking-tighter mb-0.5 transition-colors",
                  isCompleted ? "text-gray-900" : "text-gray-400"
                )}>
                  {step.label}
                </p>
                {date && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[9px] text-pink-500 font-bold"
                  >
                    {date}
                  </motion.p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTrackingTimeline;
