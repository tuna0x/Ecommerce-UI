import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Gift, Flame, Sparkles, Check, Copy, Trophy, Lock, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { skincareCheckInService } from '../service/skincareCheckInService';
import { Link } from 'react-router-dom';

interface SkincareCheckInProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CheckInState {
    streak: number;
    lastCheckIn: string | null; // YYYY-MM-DD
    history: string[]; // List of YYYY-MM-DD
    claimedMilestones: string[]; // List of milestone IDs
}

interface Milestone {
    id: string;
    days: number;
    title: string;
    description: string;
    code: string;
    rewardType: 'points' | 'discount' | 'freeship';
}

const MILESTONES: Milestone[] = [
    { id: 'streak_3', days: 3, title: '🌸 Tích lũy 10 điểm Bông', description: 'Tặng ngay 10 điểm tích lũy vào tài khoản', code: 'BONGBUDS', rewardType: 'points' },
    { id: 'streak_7', days: 7, title: '🎟️ Voucher Giảm 10%', description: 'Giảm ngay 10% cho tất cả đơn hàng mỹ phẩm', code: 'BONGXINH10', rewardType: 'discount' },
    { id: 'streak_15', days: 15, title: '🚚 Voucher Miễn phí vận chuyển', description: 'Freeship toàn quốc cho đơn hàng từ 0đ', code: 'BONGFREESHIP', rewardType: 'freeship' },
    { id: 'streak_30', days: 30, title: '👑 Siêu Voucher Giảm 50K', description: 'Giảm trực tiếp 50,000đ cho đơn hàng tiếp theo', code: 'BONGVIP50K', rewardType: 'discount' },
];

interface BeautyTip {
    tip: string;
    productCategory: string;
    link: string;
}

const BEAUTY_TIPS: BeautyTip[] = [
    {
        tip: "Dù không trang điểm và chỉ bôi kem chống nắng, bạn vẫn bắt buộc phải tẩy trang vào cuối ngày để bẻ gãy các liên kết gốc dầu của bã nhờn sâu trong lỗ chân lông. 🧼",
        productCategory: "Sản phẩm Tẩy trang & Sữa rửa mặt",
        link: "/category/sua-rua-mat"
    },
    {
        tip: "Serum Hyaluronic Acid (HA) hoạt động như một miếng bọt biển hút nước. Hãy thoa HA ngay khi da còn hơi ẩm sau khi rửa mặt để tránh hiện tượng hút ẩm ngược làm khô da. 💧",
        productCategory: "Serum cấp ẩm chuyên sâu",
        link: "/category/serum"
    },
    {
        tip: "Để đạt hiệu quả bảo vệ SPF tối đa của kem chống nắng, hãy bôi đủ lượng tương đương 2 đốt ngón tay cho toàn mặt. Việc bôi quá mỏng sẽ làm giảm màng bảo vệ tới 70%! ☀️",
        productCategory: "Kem chống nắng bảo vệ da",
        link: "/category/kem-chong-nang"
    },
    {
        tip: "Serum Vitamin C rất dễ bị oxy hóa khi tiếp xúc với ánh sáng và không khí. Hãy cất serum trong hộp kín, ngăn mát tủ lạnh và sử dụng đều đặn ban ngày dưới lớp kem chống nắng để nhân đôi hiệu quả bảo vệ da. 🍋",
        productCategory: "Serum Vitamin C dưỡng sáng da",
        link: "/category/serum"
    },
    {
        tip: "Tế bào chết tích tụ làm da xỉn màu và cản trở dưỡng chất hấp thụ. Hãy tẩy tế bào chết hóa học (AHA/BHA) đều đặn 1-2 lần/tuần vào buổi tối để sở hữu làn da căng bóng mịn màng. ✨",
        productCategory: "Tẩy tế bào chết chính hãng",
        link: "/category/tay-da-chet"
    },
    {
        tip: "Niacinamide (Vitamin B3) là hoạt chất đa năng tuyệt vời giúp kiểm soát bã nhờn, làm dịu da đỏ, se khít lỗ chân lông và làm mờ thâm mụn vô cùng hiệu quả. 🧪",
        productCategory: "Mỹ phẩm chứa Niacinamide",
        link: "/category/serum"
    },
    {
        tip: "Vùng da quanh mắt mỏng gấp 10 lần da mặt và không có tuyến bã nhờn, dễ xuất hiện nếp nhăn nhất. Hãy bắt đầu sử dụng kem mắt từ tuổi 20 để giữ gìn nét thanh xuân của đôi mắt. 👁️",
        productCategory: "Kem mắt chống lão hóa",
        link: "/category/kem-duong-mat"
    },
    {
        tip: "Khi sử dụng các hoạt chất treatment mạnh như Retinol, AHA/BHA, da sẽ trở nên mỏng manh và nhạy cảm hơn. Hãy luôn bổ sung kem dưỡng phục hồi chứa Ceramide hoặc B5 để củng cố hàng rào bảo vệ da. 🛡️",
        productCategory: "Kem dưỡng phục hồi B5/Ceramide",
        link: "/category/kem-duong"
    },
    {
        tip: "Uống đủ 2 lít nước mỗi ngày giúp thải độc da từ bên trong, giữ cho các tế bào da ngậm nước đầy đủ, mang lại vẻ bóng khỏe tự nhiên tựa sương mai. 💦",
        productCategory: "Xịt khoáng cấp nước tức thì",
        link: "/category/toner"
    },
    {
        tip: "Mụn sưng viêm tuyệt đối không nên tự ý nặn bằng tay vì sẽ gây tổn thương sâu, tạo vết thâm sẹo và lây lan vi khuẩn. Hãy dùng miếng dán mụn hoặc chấm mụn chứa tràm trà/salicylic acid để xẹp mụn nhanh chóng. 🌿",
        productCategory: "Sản phẩm giảm mụn hiệu quả",
        link: "/category/serum"
    },
    {
        tip: "Hãy thay vỏ gối định kỳ 1 tuần/lần. Vỏ gối tích tụ tế bào chết, mồ hôi và bụi bẩn là môi trường lý tưởng cho vi khuẩn phát triển, gián tiếp gây ra mụn ẩn dai dẳng trên má. 🛌",
        productCategory: "Sản phẩm làm sạch sâu ngừa mụn",
        link: "/category/sua-rua-mat"
    },
    {
        tip: "Kem chống nắng cần được bôi lại sau mỗi 2-3 tiếng nếu bạn hoạt động ngoài trời, đổ mồ hôi nhiều hoặc bơi lội để duy trì màng lọc bảo vệ tối ưu nhất. 🏊‍♀️",
        productCategory: "Xịt chống nắng & Kem chống nắng",
        link: "/category/kem-chong-nang"
    },
    {
        tip: "Ngủ đủ giấc (từ 7-8 tiếng) và ngủ trước 11h đêm giúp kích hoạt cơ chế tự phục hồi tự nhiên của làn da, thúc đẩy sản sinh collagen và hạn chế quầng thâm mắt mệt mỏi. 😴",
        productCategory: "Mặt nạ ngủ dưỡng ẩm sâu",
        link: "/category/mat-na"
    },
    {
        tip: "Tránh rửa mặt bằng nước quá nóng vì nhiệt độ cao sẽ làm mất đi lớp dầu tự nhiên bảo vệ da, khiến da bị khô ráp, bong tróc và kích thích tuyến bã nhờn hoạt động mạnh hơn. 🚿",
        productCategory: "Sữa rửa mặt dịu nhẹ lành tính",
        link: "/category/sua-rua-mat"
    },
    {
        tip: "Một làn da đủ ẩm sẽ ít tiết dầu hơn. Nếu bạn có làn da dầu, đừng bỏ qua bước dưỡng ẩm, hãy chọn các loại kem dưỡng dạng gel/lotion mỏng nhẹ, thấm nhanh để cấp nước mà không gây bí tắc. 🧴",
        productCategory: "Kem dưỡng dạng gel mỏng nhẹ",
        link: "/category/kem-duong"
    },
    {
        tip: "Đắp mặt nạ giấy 2-3 lần/tuần là cách tuyệt vời để 'truyền nước' tức thì cho làn da sau những ngày làm việc căng thẳng, giúp da căng mọng và rạng rỡ ngay lập tức. 🎭",
        productCategory: "Mặt nạ giấy dưỡng da chuyên sâu",
        link: "/category/mat-na"
    },
    {
        tip: "Khi thoa các sản phẩm dưỡng da, hãy vuốt nhẹ nhàng theo hướng từ dưới lên trên và từ trong ra ngoài để tránh tác động lực kéo xệ cơ mặt, giúp da luôn săn chắc đàn hồi. 💆‍♀️",
        productCategory: "Kem dưỡng nâng cơ trẻ hóa",
        link: "/category/kem-duong"
    },
    {
        tip: "Retinol là 'vua' trong việc chống lão hóa và tái tạo da. Hãy bắt đầu sử dụng Retinol với nồng độ thấp (0.1% - 0.5%) và tần suất 1 lần/tuần để da làm quen, tránh hiện tượng kích ứng đỏ rát. 👑",
        productCategory: "Tinh chất Retinol tái tạo da",
        link: "/category/serum"
    },
    {
        tip: "Môi là vùng da cực kỳ mỏng và không có tuyến dầu tự nhiên, rất dễ bong tróc nứt nẻ. Hãy thoa son dưỡng chứa sáp ong hoặc bơ hạt mỡ trước khi đi ngủ để sở hữu đôi môi hồng hào mềm mịn. 💋",
        productCategory: "Son dưỡng môi ẩm mịn",
        link: "/category/kem-duong"
    },
    {
        tip: "Lỗ chân lông to là do di truyền và bã nhờn tích tụ kéo giãn. Việc sử dụng mặt nạ đất sét 1-2 lần/tuần sẽ hút sạch dầu thừa, bụi bẩn ẩn sâu, giúp lỗ chân lông se khít tự nhiên. 🧱",
        productCategory: "Mặt nạ đất sét hút dầu se khít",
        link: "/category/mat-na"
    },
    {
        tip: "Hãy luôn thoa kem chống nắng và kem dưỡng cho cả vùng cổ. Da cổ mỏng và rất dễ tố cáo dấu hiệu tuổi tác của bạn nếu không được chăm sóc đồng đều với khuôn mặt. 🧣",
        productCategory: "Kem dưỡng ẩm toàn diện",
        link: "/category/kem-duong"
    },
    {
        tip: "Nếu da bạn đột ngột bị kích ứng, đỏ rát hoặc nổi mẩn đỏ, hãy ngưng ngay các hoạt chất treatment mạnh và chỉ tập trung vào chu trình tối giản: Tẩy trang dịu nhẹ -> Sữa rửa mặt pH 5.5 -> Kem dưỡng phục hồi B5. 🩺",
        productCategory: "Kem phục hồi da kích ứng B5",
        link: "/category/kem-duong"
    },
    {
        tip: "Sau khi rửa mặt, da sẽ bị mất cân bằng pH tạm thời. Hãy sử dụng nước hoa hồng (Toner) ngay sau đó để cân bằng lại độ pH lý tưởng cho da, tạo tiền đề cho các dưỡng chất tiếp theo thấm sâu hơn. 🧪",
        productCategory: "Nước hoa hồng cân bằng da",
        link: "/category/toner"
    },
    {
        tip: "Chế độ ăn nhiều đường, đồ ngọt và sữa bò là một trong những nguyên nhân hàng đầu kích thích tuyến bã nhờn tiết dầu nhiều hơn và gây viêm mụn dai dẳng. Hãy bổ sung nhiều rau xanh và trái cây mọng nước nhé! 🥦",
        productCategory: "Sản phẩm chăm sóc da dầu mụn",
        link: "/category/serum"
    },
    {
        tip: "Để các hoạt chất thẩm thấu tốt nhất, hãy áp dụng nguyên tắc bôi sản phẩm theo thứ tự: từ lỏng nhất đến đặc nhất (Toner -> Serum lỏng -> Serum đặc -> Gel dưỡng -> Kem dưỡng -> Dầu dưỡng). 📐",
        productCategory: "Trọn bộ chu trình dưỡng da",
        link: "/category/all"
    },
    {
        tip: "Massage da mặt nhẹ nhàng với dầu tẩy trang trong khoảng 2-3 phút giúp hòa tan hoàn toàn mụn đầu đen, sợi bã nhờn ở vùng mũi. Nhớ nhũ hóa thật kỹ bằng nước ấm để tránh gây mụn ngược nhé! 💆‍♂️",
        productCategory: "Dầu tẩy trang nhũ hóa sâu",
        link: "/category/sua-rua-mat"
    },
    {
        tip: "Căng thẳng (Stress) sản sinh ra cortisol - hormone kích thích dầu thừa hoạt động mạnh và gây mụn. Hãy dành ra 15 phút mỗi tối để nghe nhạc thư giãn và đắp mặt nạ chăm sóc bản thân nhé! 🧘‍♀️",
        productCategory: "Mặt nạ thư giãn phục hồi da",
        link: "/category/mat-na"
    },
    {
        tip: "Da xỉn màu thiếu sức sống? Hãy tìm kiếm các sản phẩm chứa chiết xuất từ nhân sâm, trà xanh hoặc lựu đỏ để bổ sung chất chống oxy hóa mạnh mẽ, giúp da hồng hào và tràn đầy sinh khí. 🔋",
        productCategory: "Mỹ phẩm chống lão hóa cao cấp",
        link: "/category/serum"
    },
    {
        tip: "Màng bảo vệ da tự nhiên (skin barrier) khỏe mạnh có tính axit nhẹ (pH khoảng 5.5). Hãy chọn các sản phẩm sữa rửa mặt có độ pH tương đương để bảo vệ màng ẩm tự nhiên, tránh da bị khô căng kít sau khi rửa. ⚖️",
        productCategory: "Sữa rửa mặt pH chuẩn 5.5",
        link: "/category/sua-rua-mat"
    },
    {
        tip: "Kem chống nắng dạng gel hoặc sữa lỏng cực kỳ thích hợp cho mùa hè vì độ mỏng nhẹ, ráo nhanh, không nâng tông quá đà và không gây bết dính dưới thời tiết oi nóng. 🏄",
        productCategory: "Sữa chống nắng mỏng nhẹ ráo mịn",
        link: "/category/kem-chong-nang"
    },
    {
        tip: "Hãy luôn mỉm cười và tự tin với làn da của mình! Một tinh thần lạc quan, yêu đời chính là 'liều thuốc' tuyệt vời nhất giúp nuôi dưỡng làn da rạng rỡ từ sâu bên trong cơ thể. 🥰",
        productCategory: "Xem tất cả sản phẩm chăm sóc da",
        link: "/category/all"
    }
];

interface ConfettiItem {
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    rotate: number;
}

export const SkincareCheckIn: React.FC<SkincareCheckInProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [checkInState, setCheckInState] = useState<CheckInState>({
        streak: 0,
        lastCheckIn: null,
        history: [],
        claimedMilestones: []
    });
    const [confettis, setConfettis] = useState<ConfettiItem[]>([]);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const currentDayTip = useMemo(() => {
        const today = new Date();
        const dayOfMonth = today.getDate(); // 1 to 31
        const index = (dayOfMonth - 1) % BEAUTY_TIPS.length;
        return BEAUTY_TIPS[index];
    }, []);

    const storageKey = useMemo(() => {
        return user?.email ? `BONGCOSMETIC-checkin-${user.email}` : 'BONGCOSMETIC-checkin-guest';
    }, [user?.email]);

    // Fetch initial state from database (if authenticated) or local storage
    useEffect(() => {
        const fetchState = async () => {
            if (user?.email) {
                try {
                    // Try to fetch from backend API
                    const apiState = await skincareCheckInService.getCheckInState();
                    setCheckInState(apiState);
                    // Mirror to local storage as a backup
                    localStorage.setItem(storageKey, JSON.stringify(apiState));
                    return;
                } catch (err) {
                    console.warn("Could not sync with backend check-in API, falling back to local storage:", err);
                }
            }

            // Fallback / Guest: read from localStorage
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    const parsed: CheckInState = JSON.parse(saved);
                    
                    // Validate if streak is broken
                    const todayStr = new Date().toLocaleDateString('en-CA');
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toLocaleDateString('en-CA');

                    let currentStreak = parsed.streak;
                    if (parsed.lastCheckIn && parsed.lastCheckIn !== todayStr && parsed.lastCheckIn !== yesterdayStr) {
                        // Missed check-in, streak resets
                        currentStreak = 0;
                    }

                    setCheckInState({
                        ...parsed,
                        streak: currentStreak
                    });
                } catch (err) {
                    console.error("Failed to parse check-in data", err);
                }
            } else {
                setCheckInState({
                    streak: 0,
                    lastCheckIn: null,
                    history: [],
                    claimedMilestones: []
                });
            }
        };

        if (isOpen) {
            void fetchState();
        }
    }, [storageKey, isOpen, user]);

    const todayStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
    const hasCheckedInToday = checkInState?.lastCheckIn === todayStr;

    // Generate week status (Mon to Sun)
    const weekDays = useMemo(() => {
        const days = [];
        const current = new Date();
        const dayOfWeek = current.getDay(); // 0 is Sun, 1 is Mon, etc.
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        
        const monday = new Date(current);
        monday.setDate(current.getDate() + mondayOffset);

        const history = checkInState?.history || [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dateStr = date.toLocaleDateString('en-CA');
            const formattedLabel = date.toLocaleDateString('vi-VN', { weekday: 'short' });
            
            days.push({
                dateStr,
                label: formattedLabel,
                isToday: dateStr === todayStr,
                checkedIn: history.includes(dateStr),
                dayNum: date.getDate()
            });
        }
        return days;
    }, [checkInState?.history, todayStr]);

    // Handle check in button
    const handleCheckIn = async () => {
        if (hasCheckedInToday) return;

        // Optimistic UI updates
        const history = checkInState?.history || [];
        const streak = checkInState?.streak || 0;
        const newHistory = [...history, todayStr];
        const newStreak = streak + 1;
        const newState: CheckInState = {
            streak: newStreak,
            lastCheckIn: todayStr,
            history: newHistory,
            claimedMilestones: checkInState?.claimedMilestones || []
        };

        // Save to state & local storage
        setCheckInState(newState);
        localStorage.setItem(storageKey, JSON.stringify(newState));

        // Trigger confetti celebration
        triggerConfetti();

        // Sync with backend if authenticated
        if (user?.email) {
            try {
                const apiState = await skincareCheckInService.checkIn();
                setCheckInState(apiState);
                localStorage.setItem(storageKey, JSON.stringify(apiState));
            } catch (err) {
                console.error("Failed to sync check-in to backend:", err);
            }
        }
    };

    // Confetti effect generator
    const triggerConfetti = () => {
        const colors = ['#ec4899', '#f43f5e', '#a855f7', '#6366f1', '#10b981', '#f59e0b'];
        const newConfettis: ConfettiItem[] = [];
        for (let i = 0; i < 60; i++) {
            newConfettis.push({
                id: Math.random(),
                x: 100 + Math.random() * 200, // Spawn around center-ish of drawer
                y: 200 + Math.random() * 100,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 5 + Math.random() * 8,
                rotate: Math.random() * 360
            });
        }
        setConfettis(newConfettis);
        setTimeout(() => setConfettis([]), 3500); // Clean up after animation
    };

    // Copy Voucher Code
    const handleCopyCode = (code: string) => {
        void navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Handle claim reward
    const handleClaimMilestone = async (milestoneId: string) => {
        const claimedMilestones = checkInState?.claimedMilestones || [];
        if (claimedMilestones.includes(milestoneId)) return;
        
        // Optimistic UI updates
        const newState = {
            streak: checkInState?.streak || 0,
            lastCheckIn: checkInState?.lastCheckIn || null,
            history: checkInState?.history || [],
            claimedMilestones: [...claimedMilestones, milestoneId]
        };
        setCheckInState(newState);
        localStorage.setItem(storageKey, JSON.stringify(newState));
        
        // Trigger sparkles confetti
        triggerConfetti();

        // Sync with backend if authenticated
        if (user?.email) {
            try {
                const apiState = await skincareCheckInService.claimMilestone(milestoneId);
                setCheckInState(apiState);
                localStorage.setItem(storageKey, JSON.stringify(apiState));
            } catch (err) {
                console.error("Failed to sync milestone claim to backend:", err);
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Dark Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
                    />

                    {/* Skincare Check-in Right Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-[440px] bg-background/95 dark:bg-slate-950/95 border-l border-border/40 backdrop-blur-2xl z-50 shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-border/40 flex items-center justify-between bg-gradient-to-r from-pink-50/50 to-rose-50/20 dark:from-pink-950/20 dark:to-rose-950/10">
                            <div className="flex items-center gap-2.5">
                                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md shadow-pink-200 dark:shadow-none">
                                    <Calendar className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-foreground tracking-tight">Nhật ký Skincare 🌸</h2>
                                    <p className="text-[11px] text-muted-foreground font-medium">Chăm da mỗi ngày - Rinh ngàn quà xịn</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-8 w-8 rounded-full hover:bg-secondary"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
                            {/* Confetti Particle Sandbox */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {confettis.map((c) => (
                                    <motion.div
                                        key={c.id}
                                        initial={{ opacity: 1, x: c.x, y: c.y, scale: 0.2, rotate: c.rotate }}
                                        animate={{
                                            opacity: [1, 1, 0],
                                            x: c.x + (Math.random() - 0.5) * 300,
                                            y: c.y + 400 + Math.random() * 200,
                                            scale: [0.2, 1.2, 0.5],
                                            rotate: c.rotate + 720
                                        }}
                                        transition={{ duration: 2.5 + Math.random(), ease: 'easeOut' }}
                                        style={{
                                            position: 'absolute',
                                            width: c.size,
                                            height: c.size,
                                            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                                            backgroundColor: c.color,
                                            zIndex: 999
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Streak Counter Hero */}
                            <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 text-white shadow-xl shadow-pink-100 dark:shadow-none">
                                <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                                    <Flame className="w-40 h-40" />
                                </div>
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full w-fit">
                                            <Flame className="h-4 w-4 text-amber-200 fill-amber-200 animate-pulse" />
                                            <span className="text-[10px] uppercase font-extrabold tracking-wider">Streak chuỗi ngày</span>
                                        </div>
                                        <div className="flex items-baseline gap-1 pt-1">
                                            <span className="text-4xl font-extrabold tracking-tight">{checkInState?.streak || 0}</span>
                                            <span className="text-sm font-semibold opacity-90">Ngày liên tiếp</span>
                                        </div>
                                        <p className="text-[11px] opacity-85 leading-relaxed font-medium pt-1">
                                            {hasCheckedInToday
                                                ? "Tuyệt vời! Bạn đã hoàn thành chu trình skincare hôm nay rồi 🌸"
                                                : "Hôm nay bạn chưa điểm danh chăm da đâu nhé! Hãy bấm nút ở dưới 👇"}
                                        </p>
                                    </div>
                                    <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/25">
                                        <Trophy className="h-8 w-8 text-amber-200" />
                                    </div>
                                </div>
                            </div>

                            {/* Daily Weekly Flower Calendar Track */}
                            <div className="space-y-3">
                                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider px-1">Nhật ký tuần này</p>
                                <div className="grid grid-cols-7 gap-2 bg-secondary/30 p-3 rounded-2xl border border-border/20">
                                    {weekDays.map((day) => (
                                        <div
                                            key={day.dateStr}
                                            className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-300 ${
                                                day.isToday
                                                    ? "bg-white dark:bg-slate-900 shadow-md border border-pink-100 dark:border-pink-950 scale-105"
                                                    : ""
                                            }`}
                                        >
                                            <span className={`text-[10px] font-bold ${
                                                day.isToday ? "text-primary font-black" : "text-muted-foreground"
                                            }`}>
                                                {day.label}
                                            </span>
                                            
                                            {/* Flower/Plant Bud State representation */}
                                            <div className="relative flex items-center justify-center h-10 w-10">
                                                <AnimatePresence mode="wait">
                                                    {day.checkedIn ? (
                                                        <motion.div
                                                            key="flower-bloomed"
                                                            initial={{ scale: 0, rotate: -45 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            exit={{ scale: 0 }}
                                                            className="text-xl"
                                                            title="Đã điểm danh dưỡng da 🌸"
                                                        >
                                                            🌸
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div
                                                            key="plant-bud"
                                                            initial={{ scale: 0.8 }}
                                                            animate={day.isToday ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : { scale: 1 }}
                                                            transition={day.isToday ? { repeat: Infinity, duration: 1.8 } : {}}
                                                            className={`text-base flex items-center justify-center h-8 w-8 rounded-full ${
                                                                day.isToday
                                                                    ? "bg-pink-50 dark:bg-pink-950/40 text-pink-500 border border-pink-200 dark:border-pink-900"
                                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                                            }`}
                                                        >
                                                            🌱
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            <span className={`text-[10px] font-extrabold ${
                                                day.checkedIn ? "text-pink-500" : day.isToday ? "text-primary" : "text-muted-foreground"
                                            }`}>
                                                {day.dayNum}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Curated Daily Beauty Tip Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="p-4 rounded-2xl border border-pink-100 dark:border-pink-950/60 bg-gradient-to-br from-pink-500/10 to-rose-500/5 dark:from-pink-950/20 dark:to-slate-950/10 backdrop-blur-sm relative overflow-hidden"
                            >
                                <div className="absolute right-[-10px] top-[-10px] opacity-10 dark:opacity-5 animate-pulse">
                                    <Sparkles className="w-20 h-20 text-pink-500" />
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-500 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                        <Sparkles className="h-4 w-4 animate-pulse text-pink-500" />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <h4 className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">Mẹo Chăm Da Hôm Nay ✨</h4>
                                        <p className="text-xs text-foreground/85 leading-relaxed font-medium">
                                            {currentDayTip.tip}
                                        </p>
                                        <div className="pt-2 flex items-center justify-between gap-2 border-t border-pink-100/40 dark:border-pink-950/40 mt-1">
                                            <span className="text-[10px] text-muted-foreground font-semibold truncate">
                                                Gợi ý: {currentDayTip.productCategory}
                                            </span>
                                            <Link
                                                to={currentDayTip.link}
                                                onClick={onClose}
                                                className="text-[10px] text-pink-500 dark:text-pink-400 font-bold hover:underline flex items-center gap-0.5 shrink-0 group"
                                            >
                                                Xem ngay 🛍️
                                                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Dynamic Check In Action Button */}
                            <div className="pt-2">
                                <Button
                                    onClick={handleCheckIn}
                                    disabled={hasCheckedInToday}
                                    className={`w-full h-14 rounded-2xl text-sm font-bold shadow-lg transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-2 ${
                                        hasCheckedInToday
                                            ? "bg-slate-100 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-500 shadow-none border border-border cursor-not-allowed"
                                            : "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 hover:scale-[1.01] active:scale-[0.99] text-white shadow-pink-200/50 dark:shadow-none"
                                    }`}
                                >
                                    {hasCheckedInToday ? (
                                        <>
                                            <Check className="h-5 w-5 text-emerald-500 animate-bounce" />
                                            Đã hoàn thành Skincare hôm nay 🌸
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-5 w-5 text-amber-200 animate-pulse" />
                                            Điểm danh Skincare hôm nay ✨
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Rewards & Milestone Grid */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider px-1">Voucher mốc tích lũy</p>
                                    <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">Đạt mốc nhận quà</span>
                                </div>

                                <div className="space-y-3">
                                    {MILESTONES.map((m) => {
                                        const streak = checkInState?.streak || 0;
                                        const claimedMilestones = checkInState?.claimedMilestones || [];
                                        const isLocked = streak < m.days;
                                        const isClaimed = claimedMilestones.includes(m.id);
                                        const isClaimable = !isLocked && !isClaimed;

                                        return (
                                            <div
                                                key={m.id}
                                                className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                                                    isClaimed
                                                        ? "bg-slate-50/50 border-slate-200/50 dark:bg-slate-900/40 dark:border-slate-800/50 opacity-80"
                                                        : isClaimable
                                                            ? "bg-gradient-to-tr from-pink-50/40 to-white dark:from-pink-950/10 dark:to-slate-950 border-pink-200 dark:border-pink-900 shadow-md shadow-pink-50/50 dark:shadow-none animate-pulse-subtle"
                                                            : "bg-white dark:bg-slate-950 border-border/40"
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                                        isClaimed
                                                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                                            : isClaimable
                                                                ? "bg-pink-100 dark:bg-pink-950/40 text-pink-500"
                                                                : "bg-slate-50 dark:bg-slate-900 text-slate-400"
                                                    }`}>
                                                        {isClaimed ? (
                                                            <Check className="h-5 w-5 text-emerald-500" />
                                                        ) : isLocked ? (
                                                            <Lock className="h-5 w-5" />
                                                        ) : (
                                                            <Gift className="h-5 w-5 animate-bounce" />
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className={`text-xs font-bold leading-tight ${isClaimed ? "text-slate-500" : "text-foreground"}`}>
                                                            {m.title}
                                                        </h4>
                                                        <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                                                            {m.description}
                                                        </p>
                                                        {/* Target Progress Indicator */}
                                                        {isLocked && (
                                                            <p className="text-[9px] text-pink-500 font-extrabold">
                                                                Cần duy trì chuỗi {m.days} ngày (Còn {m.days - checkInState.streak} ngày)
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Button for Milestone */}
                                                <div>
                                                    {isLocked ? (
                                                        <span className="text-[10px] text-muted-foreground font-bold bg-secondary px-2.5 py-1.5 rounded-lg border border-border/30 flex items-center gap-1">
                                                            🔒 Khóa
                                                        </span>
                                                    ) : isClaimed ? (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleCopyCode(m.code)}
                                                                className="text-[10px] bg-secondary hover:bg-secondary/80 text-foreground font-extrabold px-3 py-1.5 rounded-lg border border-border/40 flex items-center gap-1 transition-all active:scale-95"
                                                            >
                                                                {copiedCode === m.code ? (
                                                                    <>
                                                                        <Check className="h-3 w-3 text-emerald-500" />
                                                                        Copied
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Copy className="h-3 w-3 text-slate-400" />
                                                                        {m.code}
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            onClick={() => handleClaimMilestone(m.id)}
                                                            className="h-8 text-[11px] font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg px-3 flex items-center gap-1 shadow-md shadow-orange-100 dark:shadow-none"
                                                        >
                                                            <Sparkles className="h-3.5 w-3.5" />
                                                            Nhận ngay
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-6 border-t border-border/40 bg-gradient-to-b from-transparent to-pink-50/20 dark:to-pink-950/5 flex flex-col gap-2">
                            <p className="text-[10px] text-muted-foreground text-center font-medium leading-relaxed">
                                Hãy xây dựng thói quen chăm da bền bỉ cùng Bông Cosmetic mỗi tối 🌸 Lịch điểm danh sẽ tự động reset chuỗi về 0 nếu bạn quên chăm da 1 ngày đấy nhé!
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
export default SkincareCheckIn;
