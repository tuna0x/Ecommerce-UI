import React from 'react';
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

const SessionTimeline: React.FC<SessionTimelineProps> = ({ logs }) => {
  const [expandedSessions, setExpandedSessions] = React.useState<Set<string>>(new Set());

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
  const sessions = React.useMemo(() => {
    const grouped: Record<string, Log[]> = {};
    logs.forEach(log => {
      if (!grouped[log.sessionId]) grouped[log.sessionId] = [];
      grouped[log.sessionId].push(log);
    });
    
    // Sort sessions by the most recent log
    return Object.entries(grouped).sort((a, b) => {
      const lastA = new Date(a[1][0].createdAt).getTime();
      const lastB = new Date(b[1][0].createdAt).getTime();
      return lastB - lastA;
    });
  }, [logs]);

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

  const formatMetadata = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.productName) return `Sản phẩm: ${data.productName}`;
      if (data.query) return `Tìm kiếm: "${data.query}"`;
      if (data.categoryName) return `Danh mục: ${data.categoryName}`;
      if (data.intent) return `Ý định: ${data.intent}`;
      return jsonStr.length > 50 ? jsonStr.slice(0, 50) + "..." : jsonStr;
    } catch {
      return jsonStr;
    }
  };

  return (
    <div className="space-y-4">
      {sessions.map(([sessionId, sessionLogs]) => {
        const isExpanded = expandedSessions.has(sessionId);
        const firstLog = sessionLogs[0];
        
        return (
          <div key={sessionId} className="border rounded-xl bg-card overflow-hidden transition-all">
            <div 
              className={cn(
                "p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-muted/30 gap-4",
                isExpanded && "border-b bg-muted/10"
              )}
              onClick={() => toggleSession(sessionId)}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center p-2 rounded-lg bg-primary/10">
                  {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">{firstLog.userEmail}</span>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 flex gap-1 items-center">
                      {getDeviceIcon(firstLog.deviceType)}
                      {firstLog.deviceType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-mono">
                    <span className="bg-secondary px-1 rounded">{sessionId.slice(0, 8)}...</span>
                    <span>{firstLog.ipAddress}</span>
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(firstLog.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                 <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold">{sessionLogs.length} sự kiện</p>
                    <p className="text-[10px] text-muted-foreground italic">Trong phiên này</p>
                 </div>
                 <div className="flex -space-x-2">
                    {Array.from(new Set(sessionLogs.map(l => l.actionType))).slice(0, 4).map((type, i) => (
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
                    {sessionLogs.map((log) => (
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
                             {formatMetadata(log.metadata)}
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
};

export default SessionTimeline;
