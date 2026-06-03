import React, { useEffect, useState } from 'react';
import { Bell, Package, Tag, Heart, Info, Check, Trash2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';
import type { Notification } from '../types/notification.type';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import PaginationControl from '../components/PaginationControl';



const typeIcon: Record<Notification['type'], React.ReactNode> = {
    order: <Package className="w-5 h-5 text-accent" />,
    promo: <Tag className="w-5 h-5 text-primary" />,
    wishlist: <Heart className="w-5 h-5 text-primary" />,
    system: <Info className="w-5 h-5 text-muted-foreground" />,
};

const typeLabel: Record<Notification['type'], string> = {
    order: 'Đơn hàng',
    promo: 'Khuyến mãi',
    wishlist: 'Yêu thích',
    system: 'Hệ thống',
};

const typeBadgeColor: Record<Notification['type'], string> = {
    order: 'bg-accent/10 text-accent border-accent/20',
    promo: 'bg-primary/10 text-primary border-primary/20',
    wishlist: 'bg-pink-100 text-pink-600 border-pink-200',
    system: 'bg-muted text-muted-foreground border-border',
};

const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Vừa xong';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
};

const Notifications: React.FC = () => {
    const {
        notifications,
        notificationMeta,
        isLoadingNotifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        deleteNotification,
        fetchNotifications,
    } = useNotifications();
    const [activeTab, setActiveTab] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        fetchNotifications(currentPage, pageSize);
    }, [currentPage, fetchNotifications]);

    const filteredNotifications = activeTab === 'all'
        ? notifications
        : activeTab === 'unread'
            ? notifications.filter(n => !n.read)
            : notifications.filter(n => n.type === activeTab);

    const tabCounts: Record<string, number> = {
        all: notificationMeta.total,
        unread: unreadCount,
        order: notifications.filter(n => n.type === 'order').length,
        promo: notifications.filter(n => n.type === 'promo').length,
        wishlist: notifications.filter(n => n.type === 'wishlist').length,
        system: notifications.filter(n => n.type === 'system').length,
    };

    return (
        <div className="min-h-screen bg-background">

            <div className="container mx-auto px-4 py-6 pb-24 md:pb-8">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <Bell className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold">Thông báo</h1>
                            <p className="text-sm text-muted-foreground">
                                {unreadCount > 0 
                                    ? `${unreadCount} thông báo chưa đọc` 
                                    : notifications.length > 0 
                                        ? `Đã xem hết ${notifications.length} thông báo` 
                                        : 'Không có thông báo mới'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Button variant="outline" size="sm" onClick={markAllAsRead} className="text-xs gap-1.5">
                                <Check className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Đánh dấu tất cả đã đọc</span>
                                <span className="sm:hidden">Đã đọc</span>
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button variant="outline" size="sm" onClick={clearAll} className="text-xs gap-1.5 text-destructive hover:text-destructive">
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Xóa tất cả</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <Tabs
                    value={activeTab}
                    onValueChange={(value) => {
                        setActiveTab(value);
                        setCurrentPage(1);
                    }}
                    className="w-full"
                >
                    <TabsList className="w-full justify-start overflow-x-auto bg-secondary/50 h-auto p-1 rounded-xl mb-4 flex-nowrap">
                        { [ 
                            { value: 'all', label: 'Tất cả' },
                            { value: 'unread', label: 'Chưa đọc' },
                            { value: 'order', label: 'Đơn hàng' },
                            { value: 'promo', label: 'Khuyến mãi' },
                            { value: 'wishlist', label: 'Yêu thích' },
                            { value: 'system', label: 'Hệ thống' },
                        ].map(tab => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="text-xs sm:text-sm px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg whitespace-nowrap transition-all duration-300"
                            >
                                {tab.label}
                                {tabCounts[tab.value] > 0 && (
                                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                                        activeTab === tab.value 
                                        ? 'bg-primary-foreground text-primary shadow-sm' 
                                        : 'bg-primary/10 text-primary'
                                    }`}>
                                        {tabCounts[tab.value]}
                                    </span>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* Notification List */}
                    <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                            {isLoadingNotifications ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 4 }).map((_, index) => (
                                        <div key={index} className="rounded-2xl border border-border bg-card p-4">
                                            <div className="flex items-start gap-3 sm:gap-4">
                                                <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-xl bg-secondary" />
                                                <div className="min-w-0 flex-1 space-y-2">
                                                    <div className="h-4 w-2/3 animate-pulse rounded bg-secondary" />
                                                    <div className="h-3 w-full animate-pulse rounded bg-secondary" />
                                                    <div className="h-3 w-4/5 animate-pulse rounded bg-secondary" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                                >
                                    <div className="p-4 bg-secondary rounded-full mb-4">
                                        <Bell className="w-10 h-10 opacity-30" />
                                    </div>
                                    <p className="text-sm font-medium">Không có thông báo nào</p>
                                    <p className="text-xs mt-1">Các thông báo mới sẽ xuất hiện ở đây</p>
                                </motion.div>
                            ) : (
                                filteredNotifications.map((notif, index) => (
                                    <motion.div
                                        key={notif.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
                                        className={`group relative rounded-2xl border transition-all duration-300 ${!notif.read
                                            ? 'bg-primary/[0.04] border-primary/20 shadow-sm'
                                            : 'bg-card border-border hover:border-primary/20 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3 sm:gap-4 p-4">
                                            {/* Icon */}
                                            <div className={`flex-shrink-0 p-2.5 rounded-xl ${!notif.read ? 'bg-primary/10' : 'bg-secondary'
                                                }`}>
                                                {typeIcon[notif.type]}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${typeBadgeColor[notif.type]}`}>
                                                                {typeLabel[notif.type]}
                                                            </span>
                                                            <span className="text-[11px] text-muted-foreground">{formatTimeAgo(notif.createdAt)}</span>
                                                        </div>
                                                        <p className={`text-sm leading-snug ${!notif.read ? 'font-semibold' : 'font-medium'}`}>
                                                            {notif.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                                                    </div>

                                                    {/* Unread dot */}
                                                    {!notif.read && (
                                                        <span className="flex-shrink-0 w-2.5 h-2.5 bg-primary rounded-full mt-1 animate-pulse" />
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 mt-2.5">
                                                    {notif.link && (
                                                        <Link
                                                            to={notif.link}
                                                            onClick={() => markAsRead(notif.id)}
                                                            className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5"
                                                        >
                                                            Xem chi tiết
                                                            <ChevronRight className="w-3 h-3" />
                                                        </Link>
                                                    )}
                                                    {!notif.read && (
                                                        <button
                                                            onClick={() => markAsRead(notif.id)}
                                                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                            Đã đọc
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteNotification(notif.id)}
                                                        className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    {!isLoadingNotifications && notificationMeta.pages > 1 && (
                        <div className="mt-6">
                            <PaginationControl
                                currentPage={currentPage}
                                totalPages={notificationMeta.pages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </Tabs>
            </div>
        </div>
    );
};

export default Notifications;
