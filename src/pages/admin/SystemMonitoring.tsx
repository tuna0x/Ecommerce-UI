import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Check,
  Clock,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Layers,
  Pause,
  Play,
  RefreshCw,
  Server,
  Shield,
  Terminal,
  XCircle,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axios from "axios";
import { cn } from "../../lib/utils";

type HealthStatus = "UP" | "DOWN" | "UNKNOWN";
type LogLevel = "INFO" | "WARN" | "ERROR";

interface MetricPoint {
  time: string;
  ram: number | null;
  cpu: number | null;
  latency: number | null;
}

interface ComponentHealth {
  name: string;
  status: HealthStatus;
  details?: string;
  icon: React.ElementType;
  tone: "emerald" | "rose" | "indigo" | "amber" | "cyan";
}

interface ConsoleLog {
  id: string;
  time: string;
  level: LogLevel;
  message: string;
}

const POLL_INTERVAL_MS = 5000;
const MAX_HISTORY_POINTS = 24;

const toneClassMap: Record<ComponentHealth["tone"], string> = {
  emerald: "bg-emerald-500/10 text-emerald-600",
  rose: "bg-rose-500/10 text-rose-600",
  indigo: "bg-indigo-500/10 text-indigo-600",
  amber: "bg-amber-500/10 text-amber-600",
  cyan: "bg-cyan-500/10 text-cyan-600",
};

const formatTime = (date = new Date()) =>
  date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const formatUptime = (seconds?: number | null) => {
  if (seconds == null || !Number.isFinite(seconds)) return "Chưa có dữ liệu";
  const total = Math.max(0, Math.floor(seconds));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(secs)}s`;
};

const getMeasurementValue = (payload: any, statistic = "VALUE") => {
  const metricPayload = unwrapActuatorPayload(payload);
  const measurements = metricPayload?.measurements;
  if (!Array.isArray(measurements)) return null;
  const exact = measurements.find((item) => item?.statistic === statistic);
  const fallback = measurements[0];
  const value = exact?.value ?? fallback?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const unwrapActuatorPayload = (payload: any) => {
  if (payload?.data && (payload.statusCode != null || payload.message != null || payload.error !== undefined)) {
    return payload.data;
  }
  return payload;
};

const getComponentStatus = (components: any, ...names: string[]): HealthStatus => {
  for (const name of names) {
    const status = components?.[name]?.status;
    if (status === "UP" || status === "DOWN" || status === "UNKNOWN") return status;
  }
  return "UNKNOWN";
};

const statusLabel: Record<HealthStatus, string> = {
  UP: "UP",
  DOWN: "DOWN",
  UNKNOWN: "UNKNOWN",
};

export const SystemMonitoring: React.FC = () => {
  const [isPolling, setIsPolling] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("UNKNOWN");
  const [uptimeSeconds, setUptimeSeconds] = useState<number | null>(null);
  const [memoryMetrics, setMemoryMetrics] = useState({ used: null as number | null, max: null as number | null, percentage: null as number | null });
  const [cpuUsage, setCpuUsage] = useState<number | null>(null);
  const [activeThreads, setActiveThreads] = useState<number | null>(null);
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [history, setHistory] = useState<MetricPoint[]>([]);
  const [components, setComponents] = useState<ComponentHealth[]>([
    { name: "Database (MySQL)", status: "UNKNOWN", icon: Database, tone: "emerald" },
    { name: "Cache Engine (Redis)", status: "UNKNOWN", icon: Zap, tone: "rose" },
    { name: "Message Broker (RabbitMQ)", status: "UNKNOWN", icon: Layers, tone: "indigo" },
    { name: "Mail Gateway (Brevo)", status: "UNKNOWN", icon: Server, tone: "amber" },
    { name: "Storage Service (Cloudinary)", status: "UNKNOWN", icon: HardDrive, tone: "cyan" },
  ]);

  const serverRoot = useMemo(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";
    return apiBase.replace(/\/api\/v1\/?$/, "");
  }, []);

  const addLog = useCallback((level: LogLevel, message: string) => {
    const now = new Date();
    setLogs((prev) => [
      {
        id: `${now.getTime()}-${Math.random()}`,
        time: formatTime(now),
        level,
        message,
      },
      ...prev,
    ].slice(0, 50));
  }, []);

  const fetchMetric = useCallback(async (name: string, query = "") => {
    const suffix = query ? `?${query}` : "";
    const response = await axios.get(`${serverRoot}/actuator/metrics/${name}${suffix}`, { timeout: 2500 });
    return getMeasurementValue(response.data);
  }, [serverRoot]);

  const fetchData = useCallback(async () => {
    const startedAt = performance.now();
    const timeLabel = formatTime();
    setLoading(true);

    let latency: number | null = null;
    let nextHealth: HealthStatus = "UNKNOWN";
    let nextComponents: any = null;

    try {
      const healthResponse = await axios.get(`${serverRoot}/actuator/health`, { timeout: 3000 });
      latency = Math.round(performance.now() - startedAt);
      const healthPayload = unwrapActuatorPayload(healthResponse.data);
      nextHealth = healthPayload?.status === "UP" ? "UP" : healthPayload?.status === "DOWN" ? "DOWN" : "UNKNOWN";
      nextComponents = healthPayload?.components;
      setHealthStatus(nextHealth);
    } catch (error) {
      setHealthStatus("UNKNOWN");
      addLog("ERROR", "Không gọi được /actuator/health. Kiểm tra backend, CORS hoặc cấu hình actuator.");
    }

    const metricResults = await Promise.allSettled([
      fetchMetric("jvm.memory.used", "tag=area:heap"),
      fetchMetric("jvm.memory.max", "tag=area:heap"),
      fetchMetric("process.cpu.usage"),
      fetchMetric("jvm.threads.live"),
      fetchMetric("process.uptime"),
      fetchMetric("hikaricp.connections.active"),
    ]);

    const [usedResult, maxResult, cpuResult, threadsResult, uptimeResult, connectionsResult] = metricResults;
    const readResult = (result: PromiseSettledResult<number | null>) => result.status === "fulfilled" ? result.value : null;

    const usedMb = readResult(usedResult) != null ? Math.round(readResult(usedResult)! / 1024 / 1024) : null;
    const maxMb = readResult(maxResult) != null && readResult(maxResult)! > 0 ? Math.round(readResult(maxResult)! / 1024 / 1024) : null;
    const memoryPercentage = usedMb != null && maxMb != null && maxMb > 0 ? Math.round((usedMb / maxMb) * 100) : null;
    const cpuPercent = readResult(cpuResult) != null ? Math.round(readResult(cpuResult)! * 1000) / 10 : null;
    const threads = readResult(threadsResult) != null ? Math.round(readResult(threadsResult)!) : null;
    const uptime = readResult(uptimeResult);
    const connections = readResult(connectionsResult) != null ? Math.round(readResult(connectionsResult)!) : null;

    setMemoryMetrics({ used: usedMb, max: maxMb, percentage: memoryPercentage });
    setCpuUsage(cpuPercent);
    setActiveThreads(threads);
    setUptimeSeconds(uptime);
    setComponents([
      {
        name: "Database (MySQL)",
        status: getComponentStatus(nextComponents, "db"),
        icon: Database,
        tone: "emerald",
        details: connections != null ? `Hikari active connections: ${connections}` : "Theo dõi qua actuator health",
      },
      {
        name: "Cache Engine (Redis)",
        status: getComponentStatus(nextComponents, "redis"),
        icon: Zap,
        tone: "rose",
        details: "Theo dõi qua Redis health indicator",
      },
      {
        name: "Message Broker (RabbitMQ)",
        status: getComponentStatus(nextComponents, "rabbit", "rabbitMQ"),
        icon: Layers,
        tone: "indigo",
        details: "Theo dõi qua Rabbit health indicator",
      },
      {
        name: "Mail Gateway (Brevo)",
        status: "UNKNOWN",
        icon: Server,
        tone: "amber",
        details: "Backend chưa có health indicator riêng",
      },
      {
        name: "Storage Service (Cloudinary)",
        status: "UNKNOWN",
        icon: HardDrive,
        tone: "cyan",
        details: "Backend chưa có health indicator riêng",
      },
    ]);

    setHistory((prev) => [...prev, { time: timeLabel, ram: usedMb, cpu: cpuPercent, latency }].slice(-MAX_HISTORY_POINTS));
    setLastUpdated(new Date());

    if (nextHealth === "UP") {
      addLog("INFO", `Actuator health OK${latency != null ? `, latency ${latency}ms` : ""}.`);
    } else if (nextHealth === "DOWN") {
      addLog("ERROR", "Actuator báo hệ thống DOWN. Xem chi tiết trong component health.");
    }

    if (metricResults.some((result) => result.status === "rejected")) {
      addLog("WARN", "Một số actuator metrics không khả dụng. Dashboard đã giữ giá trị UNKNOWN thay vì mô phỏng.");
    }

    setLoading(false);
  }, [addLog, fetchMetric, serverRoot]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isPolling) return;
    const interval = window.setInterval(() => void fetchData(), POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [fetchData, isPolling]);

  useEffect(() => {
    if (uptimeSeconds == null) return;
    const interval = window.setInterval(() => {
      setUptimeSeconds((prev) => (prev == null ? prev : prev + 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [uptimeSeconds]);

  const uptime = formatUptime(uptimeSeconds);
  const hasMemory = memoryMetrics.used != null && memoryMetrics.max != null;
  const hasHistory = history.length > 0;

  return (
    <div className="container mx-auto min-h-screen space-y-6 bg-slate-50/20 p-4 md:p-6 dark:bg-slate-950/20">
      <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight md:text-2xl">Giám sát hệ thống</h1>
              <p className="text-xs font-medium text-muted-foreground">
                Dữ liệu lấy trực tiếp từ Spring Boot Actuator, không dùng số liệu mô phỏng.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsPolling((prev) => !prev)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-colors",
                isPolling
                  ? "border-emerald-200 bg-emerald-500/10 text-emerald-700"
                  : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800",
              )}
            >
              {isPolling ? <Play className="h-3.5 w-3.5 fill-emerald-600" /> : <Pause className="h-3.5 w-3.5" />}
              {isPolling ? "Live polling" : "Đã tạm dừng"}
            </button>
            <button
              onClick={() => void fetchData()}
              className="flex h-9 items-center gap-2 rounded-xl border border-border/40 px-3 text-xs font-bold hover:bg-secondary"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Làm mới
            </button>
            <div className="rounded-xl border border-border/40 bg-secondary px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Cập nhật: {lastUpdated ? lastUpdated.toLocaleTimeString("vi-VN") : "Chưa có"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Trạng thái server"
          icon={Server}
          value={healthStatus === "UP" ? "Kết nối tốt" : healthStatus === "DOWN" ? "Mất kết nối" : "Chưa xác định"}
          description={healthStatus === "UNKNOWN" ? "Không lấy được /actuator/health" : "Theo trạng thái actuator health"}
          status={healthStatus}
        />
        <MetricCard title="Uptime" icon={Clock} value={uptime} description="process.uptime từ JVM" />
        <MetricCard
          title="JVM heap memory"
          icon={Cpu}
          value={hasMemory ? `${memoryMetrics.used} MB / ${memoryMetrics.max} MB` : "Chưa có dữ liệu"}
          description={memoryMetrics.percentage != null ? `Đã dùng ${memoryMetrics.percentage}%` : "Metric jvm.memory.* không khả dụng"}
          progress={memoryMetrics.percentage}
          tone="rose"
        />
        <MetricCard
          title="CPU & threads"
          icon={Gauge}
          value={`${cpuUsage != null ? `${cpuUsage}%` : "N/A"} / ${activeThreads ?? "N/A"} luồng`}
          description="process.cpu.usage và jvm.threads.live"
          progress={cpuUsage}
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-border/40 bg-card p-5 shadow-sm lg:col-span-2">
          <ChartHeader
            icon={Cpu}
            title="RAM heap & CPU"
            description="Chỉ vẽ các điểm lấy được từ actuator metrics"
          />
          <div className="h-72 w-full text-xs">
            {hasHistory ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="time" fontSize={9} stroke="#94a3b8" />
                  <YAxis fontSize={9} stroke="#94a3b8" />
                  <Tooltip />
                  <Area type="monotone" dataKey="ram" name="RAM heap (MB)" stroke="#ec4899" fill="#ec489933" strokeWidth={2} connectNulls />
                  <Area type="monotone" dataKey="cpu" name="CPU (%)" stroke="#f59e0b" fill="#f59e0b22" strokeWidth={2} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
          <ChartHeader
            icon={Activity}
            title="Latency actuator"
            description="Thời gian phản hồi của /actuator/health"
          />
          <div className="h-72 w-full text-xs">
            {hasHistory ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="time" fontSize={9} stroke="#94a3b8" />
                  <YAxis fontSize={9} stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="latency" name="Latency (ms)" stroke="#10b981" strokeWidth={3} dot={{ r: 2 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
          <ChartHeader
            icon={Shield}
            title="Sức khỏe dịch vụ"
            description="UP/DOWN lấy từ actuator health components"
          />
          <div className="space-y-3">
            {components.map((component) => (
              <div key={component.name} className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-slate-50/50 p-3 dark:bg-slate-900/40">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", toneClassMap[component.tone])}>
                    <component.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-xs font-bold">{component.name}</h4>
                    <p className="truncate text-[10px] font-medium text-muted-foreground">{component.details}</p>
                  </div>
                </div>
                <StatusBadge status={component.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border/40 bg-card p-5 shadow-sm lg:col-span-2">
          <ChartHeader
            icon={Terminal}
            title="Monitoring events"
            description="Nhật ký từ các lần gọi actuator của trang này"
          />
          <div className="flex h-[270px] flex-col-reverse gap-2 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-[10px] text-slate-300">
            {logs.length === 0 ? (
              <div className="text-slate-500">Chưa có sự kiện monitoring.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 border-b border-slate-900 pb-1.5 leading-relaxed">
                  <span className="shrink-0 text-slate-500">[{log.time}]</span>
                  <span
                    className={cn(
                      "shrink-0 font-bold",
                      log.level === "ERROR" && "text-rose-500",
                      log.level === "WARN" && "text-amber-500",
                      log.level === "INFO" && "text-emerald-500",
                    )}
                  >
                    {log.level}
                  </span>
                  <span className="break-all text-slate-400">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  description: string;
  icon: React.ElementType;
  status?: HealthStatus;
  progress?: number | null;
  tone?: "rose" | "amber";
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, icon: Icon, status, progress, tone = "rose" }) => {
  const isUp = status === "UP";
  const isDown = status === "DOWN";

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
          <div className="break-words text-xl font-extrabold tracking-tight">{value}</div>
          <p className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
            {status && <Shield className={cn("h-3 w-3", isUp && "text-emerald-500", isDown && "text-rose-500")} />}
            {description}
          </p>
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            status ? (isUp ? "bg-emerald-500/10 text-emerald-600" : isDown ? "bg-rose-500/10 text-rose-600" : "bg-amber-500/10 text-amber-600") : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {progress != null && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full transition-all", tone === "amber" ? "bg-amber-500" : "bg-rose-500")}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
};

const ChartHeader: React.FC<{ icon: React.ElementType; title: string; description: string }> = ({ icon: Icon, title, description }) => (
  <div className="border-b border-border/40 pb-4">
    <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight">
      <Icon className="h-4 w-4 text-primary" />
      {title}
    </h3>
    <p className="text-[11px] text-muted-foreground">{description}</p>
  </div>
);

const EmptyChart: React.FC = () => (
  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/50 text-xs font-medium text-muted-foreground">
    Chưa có dữ liệu metric
  </div>
);

const StatusBadge: React.FC<{ status: HealthStatus }> = ({ status }) => {
  if (status === "UP") {
    return (
      <span className="flex items-center gap-1 rounded-lg border border-emerald-200/50 bg-emerald-100/60 px-2 py-1 text-[10px] font-black text-emerald-700">
        <Check className="h-3 w-3" />
        {statusLabel[status]}
      </span>
    );
  }

  if (status === "DOWN") {
    return (
      <span className="flex items-center gap-1 rounded-lg border border-rose-200/50 bg-rose-100/60 px-2 py-1 text-[10px] font-black text-rose-700">
        <XCircle className="h-3 w-3" />
        {statusLabel[status]}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 rounded-lg border border-amber-200/50 bg-amber-100/60 px-2 py-1 text-[10px] font-black text-amber-700">
      <AlertCircle className="h-3 w-3" />
      {statusLabel[status]}
    </span>
  );
};

export default SystemMonitoring;
