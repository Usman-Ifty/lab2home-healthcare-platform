import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { getToken } from "@/utils/storage";
import { EditProfileModal } from "./EditProfileModal";

// ─── Types ───────────────────────────────────────────────────

interface InterpretedResult {
  testName: string;
  patientValue: number;
  unit: string;
  normalMin: number | null;
  normalMax: number | null;
  status: "Good" | "Needs Attention" | "Critical" | "Unknown";
  note: string;
}

interface InterpretationData {
  _id: string;
  overallClassification: "Good" | "Needs Attention" | "Critical";
  verdictMessage: string;
  results: InterpretedResult[];
  extractionMethod: string;
  llmUsed: string;
  version: number;
  createdAt: string;
}

interface AiInterpretationProps {
  bookingId: string;
}

// ─── Status Config ───────────────────────────────────────────

const STATUS_CONFIG = {
  Good: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-800 dark:text-emerald-200",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
    icon: CheckCircle2,
    bannerGradient: "from-emerald-500 to-teal-600",
  },
  "Needs Attention": {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-800 dark:text-amber-200",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    icon: AlertTriangle,
    bannerGradient: "from-amber-500 to-orange-600",
  },
  Critical: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-800 dark:text-red-200",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    icon: XCircle,
    bannerGradient: "from-red-500 to-rose-600",
  },
  Unknown: {
    bg: "bg-gray-50 dark:bg-gray-950/30",
    border: "border-gray-200 dark:border-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-400",
    icon: Info,
    bannerGradient: "from-gray-500 to-slate-600",
  },
} as const;

// ─── Component ───────────────────────────────────────────────

export function AiInterpretation({ bookingId }: AiInterpretationProps) {
  const [interpretation, setInterpretation] = useState<InterpretationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showProfileModal, setShowProfileModal] = useState(false);

  // ─── Fetch existing interpretation on mount ──────────────
  const fetchInterpretation = useCallback(async () => {
    try {
      setFetching(true);
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/reports/${bookingId}/interpret`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setInterpretation(data.data);
        setAlreadyExists(true);
      }
      // 404 is expected when no interpretation exists yet
    } catch {
      // Silently handle — user can still generate
    } finally {
      setFetching(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchInterpretation();
  }, [fetchInterpretation]);

  // ─── Generate / re-generate interpretation ───────────────
  const handleInterpret = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/reports/${bookingId}/interpret`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setInterpretation(data.data);
        setAlreadyExists(true);
        setExpandedRows(new Set());
      } else {
        // Check if it's a "complete your profile" error
        if (res.status === 400 && data.message?.toLowerCase().includes('profile')) {
          setShowProfileModal(true);
        }
        setError(data.message || "Failed to interpret report.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Toggle note row expansion ───────────────────────────
  const toggleRow = (index: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // ─── Loading skeleton ────────────────────────────────────
  if (fetching) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Checking for interpretation...</span>
      </div>
    );
  }

  // ─── No interpretation yet — show CTA button ─────────────
  if (!interpretation) {
    return (
      <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
        <div className="p-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Brain className="h-7 w-7 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">AI Report Interpretation</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Get an instant, AI-powered analysis of your lab results with clear explanations.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm"
            >
              {error}
            </motion.div>
          )}

          {showProfileModal && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProfileModal(true)}
              className="gap-2"
            >
              Complete Profile
            </Button>
          )}

          <Button
            onClick={handleInterpret}
            disabled={loading}
            className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Report...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Interpret with AI
              </>
            )}
          </Button>

          {loading && (
            <p className="text-xs text-muted-foreground animate-pulse">
              This may take 15-30 seconds. Please wait...
            </p>
          )}
        </div>
      </Card>
    );
  }

  // ─── Interpretation exists — show results ─────────────────
  const overallConfig = STATUS_CONFIG[interpretation.overallClassification] || STATUS_CONFIG.Unknown;
  const OverallIcon = overallConfig.icon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* ── Overall Banner ──────────────────────────────────── */}
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${overallConfig.bannerGradient} p-6 text-white shadow-lg`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm flex-shrink-0">
              <OverallIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">
                {interpretation.overallClassification}
              </h3>
              <p className="mt-1 text-sm text-white/90 leading-relaxed">
                {interpretation.verdictMessage}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs text-white/70">
                <span>Version {interpretation.version}</span>
                <span>•</span>
                <span>OCR: {interpretation.extractionMethod}</span>
                <span>•</span>
                <span>LLM: {interpretation.llmUsed}</span>
                <span>•</span>
                <span>{new Date(interpretation.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Results Table ───────────────────────────────────── */}
        <Card className="overflow-hidden border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Test Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Your Value</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden sm:table-cell">Normal Range</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">What it Means</th>
                  <th className="px-4 py-3 w-10 md:hidden" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {interpretation.results.map((result, index) => {
                    const config = STATUS_CONFIG[result.status] || STATUS_CONFIG.Unknown;
                    const StatusIcon = config.icon;
                    const isExpanded = expandedRows.has(index);
                    const normalRange =
                      result.normalMin !== null && result.normalMax !== null
                        ? `${result.normalMin} – ${result.normalMax}`
                        : "N/A";

                    return (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className={`border-b border-border/50 last:border-0 ${config.bg} cursor-pointer md:cursor-default`}
                        onClick={() => toggleRow(index)}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {result.testName}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          <span className="font-semibold">{result.patientValue}</span>
                          {result.unit && (
                            <span className="ml-1 text-muted-foreground text-xs">{result.unit}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {normalRange}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="secondary"
                            className={`${config.badge} gap-1 text-xs font-medium`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {result.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs leading-relaxed hidden md:table-cell max-w-xs">
                          {result.note}
                        </td>
                        <td className="px-4 py-3 md:hidden">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile expanded note rows */}
          {interpretation.results.map((result, index) => {
            if (!expandedRows.has(index)) return null;
            const config = STATUS_CONFIG[result.status] || STATUS_CONFIG.Unknown;
            return (
              <motion.div
                key={`note-${index}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`md:hidden px-4 py-3 ${config.bg} border-b border-border/50 text-xs text-muted-foreground`}
              >
                <p className="sm:hidden mb-1">
                  <strong>Range:</strong>{" "}
                  {result.normalMin !== null && result.normalMax !== null
                    ? `${result.normalMin} – ${result.normalMax}`
                    : "N/A"}
                </p>
                <p>{result.note}</p>
              </motion.div>
            );
          })}
        </Card>

        {/* ── Re-interpret + Disclaimer ───────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {alreadyExists && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInterpret}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Re-interpreting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Re-interpret Report
                </>
              )}
            </Button>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          ⚠️ AI-generated guidance only. Not a substitute for professional medical advice.
          Always consult your doctor for medical decisions.
        </p>
      </motion.div>

      {/* Profile completion modal */}
      <EditProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        requireAgeSex
        onProfileUpdated={() => {
          setShowProfileModal(false);
          setError(null);
        }}
      />
    </>
  );
}
