import React from 'react';
import { Bell, Package, Tag, Heart, Info, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, Notification } from '../context/NotificationContext';
import { Link } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const typeIcon: Record<Notification['type'], React.ReactNode> = {
    order: <Package className="w-4 h-4 text-accent" />,
    promo: <Tag className="w-4 h-4 text-primary" />,
    wishlist: <Heart className="w-4 h-4 text-primary" />,
    system: <Info className="w-4 h-4 text-muted-foreground" />,
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

const NotificationDropdown: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative p-2 hover:bg-secondary rounded-lg transition-colors">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 max-h-[70vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="font-semibold text-sm">Thông báo</h3>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" />
                                Đánh dấu đã đọc
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAll}
                                className="text-[11px] text-muted-foreground hover:text-destructive font-medium flex items-center gap-1"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Bell className="w-10 h-10 mb-3 opacity-30" />
                            <p className="text-sm">Không có thông báo</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {notifications.map((notif) => (
                                <motion.div
                                    key={notif.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    {notif.link ? (
                                        <Link
                                            to={notif.link}
                                            onClick={() => markAsRead(notif.id)}
                                            className={`flex gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border/50 ${!notif.read ? 'bg-primary/5' : ''
                                                }`}
                                        >
                                            <NotifContent notif={notif} />
                                        </Link>
                                    ) : (
                                        <div
                                            onClick={() => markAsRead(notif.id)}
                                            className={`flex gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border/50 cursor-pointer ${!notif.read ? 'bg-primary/5' : ''
                                                }`}
                                        >
                                            <NotifContent notif={notif} />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const NotifContent: React.FC<{ notif: Notification }> = ({ notif }) => (
    <>
        <div className="flex-shrink-0 mt-0.5 p-2 bg-secondary rounded-full h-fit">
            {typeIcon[notif.type]}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
                <p className={`text-sm leading-snug ${!notif.read ? 'font-semibold' : 'font-medium'}`}>
                    {notif.title}
                </p>
                {!notif.read && (
                    <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-1.5" />
                )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.message}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{formatTimeAgo(notif.createdAt)}</p>
        </div>
    </>
);

export default NotificationDropdown;
