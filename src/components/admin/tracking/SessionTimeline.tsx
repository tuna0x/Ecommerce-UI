import React, { memo, useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  User, 
  Monitor, 
  Smartphone, 
  Tablet,
  Clock,
  Eye,
  ShoppingCart,
  ShoppingBag,
  Search,
  MessageSquare,
  Activity,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Badge } from '../../ui/badge';

interface Log {
  id: number;
  userEmail: string;
  actionType: string;
  metadata: string;
  ipAddress: string;
  createdAt: string;
  sessionId: string;
  deviceType: string;
  referrer: string;
  pageUrl: string;
}

interface SessionTimelineProps {
  logs: Log[];
}

// --- Static Helpers Moved Outside to avoid recreation ---

const getLogIcon = (type: string) => {
  switch (type) {
    case 'VIEW_PRODUCT': return <Eye className="h-4 w-4 text-blue-500" />;
    case 'ADD_CART': return <ShoppingCart className="h-4 w-4 text-green-500" />;
    case 'PURCHASE': return <ShoppingBag className="h-4 w-4 text-amber-500" />;
    case 'SEARCH': return <Search className="h-4 w-4 text-purple-500" />;
    case 'CHAT_WITH_BOT': return <MessageSquare className="h-4 w-4 text-rose-500" />;
    default: return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
};

const getDeviceIcon = (device: string) => {
  switch (device) {
    case 'MOBILE': return <Smartphone className="h-3 w-3" />;
    case 'TABLET': return <Tablet className="h-3 w-3" />;
    default: return <Monitor className="h-3 w-3" />;
  }
};

const formatMetadata = (jsonStr: string, actionType: string) => {
  try {
    const data = JSON.parse(jsonStr);
    
    if (actionType === 'TIME_ON_PAGE' && data.durationMs) {
      const seconds = Math.floor(data.durationMs / 1000);
      const durationText = seconds >= 60 
        ? `${Math.floor(seconds / 60)} phút ${seconds % 60} giây` 
        : `${(data.durationMs / 1000).toFixed(1)} giây`;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-blue-600">Ở lại trang: {durationText}</span>
          <span className="text-muted-foreground italic text-[10px]">Đường dẫn: {data.path}</span>
        </div>
      );
    }

    if (actionType === 'PURCHASE' && data.orderId) {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-green-600">Mua đơn hàng #{data.orderId}</span>
          <span className="text-muted-foreground text-[10px]">PTTT: {data.method} | Mã GD: {data.transactionId || 'N/A'}</span>
        </div>
      );
    }

    if (actionType === 'BEGIN_CHECKOUT' && data.cartTotal) {
      return (
         <span className="font-bold text-orange-600">
           Thanh toán: {new Intl.NumberFormat('vi-VN').format(data.cartTotal)}₫ ({data.itemCount} SP)
         </span>
      );
    }

    if (data.productName) return <span>Sản phẩm: <b>{data.productName}</b></span>;
    if (data.query) return <span>Tìm kiếm: <b>"{data.query}"</b></span>;
    if (data.categoryName) return <span>Danh mục: <b>{data.categoryName}</b></span>;
    if (data.intent) return <span>Ý định: <b>{data.intent}</b></span>;
    
    return <span className="font-mono text-[10px] break-all opacity-70">{jsonStr}</span>;
  } catch {
    return <span>{jsonStr}</span>;
  }
};

const formatDuration = (ms: number) => {
  if (ms < 1000) return 'Vài giây';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} giây`;
  return `${Math.floor(seconds / 60)} phút ${seconds % 60} giây`;
};

const getReferrerText = (ref: string) => {
   if (!ref) return 'Trực tiếp';
   try {
     return new URL(ref).hostname;
   } catch {
     return ref;
   }
};

const SessionTimeline: React.FC<SessionTimelineProps> = memo(({ logs }) => {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const toggleSession = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  // Group logs by sessionId
  const sessions = useMemo(() => {
    const grouped: Record<string, Log[]> = {};
    logs.forEach(log => {
      if (!grouped[log.sessionId]) grouped[log.sessionId] = [];
      grouped[log.sessionId].push(log);
    });
    
    // Sort sessions by the most recent log
    const entries = Object.entries(grouped);
    
    return entries.map(([id, sessionLogs]) => {
      const sortedLogs = [...sessionLogs].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      const first = sortedLogs[0];
      const last = sortedLogs[sortedLogs.length - 1];
      const durationMs = new Date(last.createdAt).getTime() - new Date(first.createdAt).getTime();
      const hasPurchase = sessionLogs.some(l => l.actionType === 'PURCHASE');
      
      return {
        id,
        logs: sortedLogs,
        startTime: first.createdAt,
        durationMs,
        hasPurchase,
        userEmail: first.userEmail,
        deviceType: first.deviceType,
        ipAddress: first.ipAddress,
        referrer: first.referrer
      };
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [logs]);

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const isExpanded = expandedSessions.has(session.id);
        
        return (
          <div key={session.id} className="border rounded-xl bg-card overflow-hidden transition-all">
            <div 
              className={cn(
                "p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-muted/30 gap-4",
                isExpanded && "border-b bg-muted/10"
              )}
              onClick={() => toggleSession(session.id)}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center p-2 rounded-lg bg-primary/10">
                  {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <User className={cn("h-4 w-4", !session.userEmail ? "text-orange-500" : "text-muted-foreground")} />
                    <span className={cn("font-semibold text-sm", !session.userEmail && "text-orange-600 italic")}>
                        {session.userEmail || `Khách vãng lai (Guest_${session.id.slice(0, 6)})`}
                    </span>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 flex gap-1 items-center">
                      {getDeviceIcon(session.deviceType)}
                      {session.deviceType}
                    </Badge>
                    {session.hasPurchase && (
                      <Badge className="bg-green-500 text-white border-none text-[10px] h-5 px-1.5 animate-pulse">
                        ĐàMUA HÀNG
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-mono">
                    <span className="bg-secondary px-1 rounded">{session.id.slice(0, 8)}...</span>
                    <span>{session.ipAddress}</span>
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(session.startTime).toLocaleString()}
                    </span>
                    <span className="bg-blue-50 text-blue-600 px-1.5 rounded-full border border-blue-100 flex items-center gap-1">
                        <ArrowRight className="h-2.5 w-2.5" />
                        {getReferrerText(session.referrer)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="text-right hidden sm:block border-r pr-4">
                    <div className="text-xs font-bold text-foreground flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatDuration(session.durationMs)}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">{session.logs.length} sự kiện</p>
                 </div>
                 <div className="flex -space-x-2">
                    {Array.from(new Set(session.logs.map(l => l.actionType))).slice(0, 4).map((type, i) => (
                      <div key={i} className="bg-background border rounded-full p-1 shadow-sm" title={type}>
                        {getLogIcon(type)}
                      </div>
                    ))}
                 </div>
              </div>
            </div>

            {isExpanded && (
              <div className="p-6 relative">
                 <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />
                 <div className="space-y-6">
                    {session.logs.map((log) => (
                      <div key={log.id} className="flex gap-6 relative group">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-primary z-10 transition-transform group-hover:scale-110">
                           {getLogIcon(log.actionType)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                             <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-xs font-bold p-1 rounded px-2 uppercase",
                                    log.actionType === 'PURCHASE' ? "bg-amber-100 text-amber-700" :
                                    log.actionType === 'ADD_CART' ? "bg-green-100 text-green-700" :
                                    "bg-secondary/50"
                                )}>
                                    {log.actionType.replace('_', ' ')}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted/30 px-2 py-0.5 rounded-full">
                                    <Clock className="h-3 w-3" />
                                    {new Date(log.createdAt).toLocaleTimeString()}
                                </span>
                             </div>
                             <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 hover:text-primary transition-colors">
                                <ArrowRight className="h-3 w-3" />
                                {log.pageUrl}
                             </div>
                          </div>
                          <div className="mt-2 p-3 rounded-lg bg-muted/20 border border-muted/50 text-[11px] leading-relaxed">
                             {formatMetadata(log.metadata, log.actionType)}
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

SessionTimeline.displayName = "SessionTimeline";

export default SessionTimeline;
