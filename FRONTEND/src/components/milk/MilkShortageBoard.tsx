import { motion } from "framer-motion";
import { AlertTriangle, Clock, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MilkShortageAlert } from "@/lib/api";

interface MilkShortageBoardProps {
  alerts: MilkShortageAlert[];
  isLoading: boolean;
  role: string;
  onPostShortage?: () => void;
  onFindMatches?: (alert: MilkShortageAlert) => void;
  onRespond?: (alert: MilkShortageAlert) => void;
}

export default function MilkShortageBoard({
  alerts,
  isLoading,
  role,
  onPostShortage,
  onFindMatches,
  onRespond,
}: MilkShortageBoardProps) {
  const criticalCount = alerts.filter(a => a.urgency === "CRITICAL").length;

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "border-blood/40 bg-blood/10";
      case "URGENT":
        return "border-amber-500/30 bg-amber-50";
      default:
        return "border-blood/20 bg-blood/5";
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "bg-blood text-white";
      case "URGENT":
        return "bg-amber-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Critical Shortages
          {criticalCount > 0 && (
            <Badge className="ml-2 bg-blood/20 text-blood border-0">{criticalCount}</Badge>
          )}
        </h3>
        {role === "hospital" && onPostShortage && (
          <button
            onClick={onPostShortage}
            className="text-[10px] font-bold text-blood hover:underline uppercase tracking-tighter"
          >
            + Post Need
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="p-8 text-center bg-muted/20 rounded-2xl animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blood/50" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="p-6 text-center bg-secondary/5 border-2 border-dashed border-secondary/20 rounded-2xl">
          <Sparkles className="w-5 h-5 text-secondary mx-auto mb-2" />
          <p className="font-body text-xs text-muted-foreground">Stock levels stable across India.</p>
        </div>
      ) : (
        alerts.slice(0, 5).map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`rounded-2xl border-2 p-5 shadow-sm ${getUrgencyColor(alert.urgency || "NORMAL")}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`w-4 h-4 ${alert.urgency === "CRITICAL" ? "text-blood animate-pulse" : "text-amber-600"}`} />
              <h3 className="font-display text-xs font-bold text-blood uppercase tracking-wide flex-1">{alert.hospital}</h3>
              <Badge className={`text-[8px] ${getUrgencyBadge(alert.urgency || "NORMAL")}`}>
                {alert.urgency || "NORMAL"}
              </Badge>
            </div>
            <p className="font-body text-xs text-muted-foreground mb-1">{alert.city}</p>
            <p className="font-body text-sm font-semibold mb-2">{alert.quantity_needed}</p>
            {alert.infant_name && (
              <p className="font-body text-[10px] text-muted-foreground mb-2">For: {alert.infant_name}</p>
            )}
            {alert.time_left && (
              <p className="font-body text-[10px] text-muted-foreground mb-3 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {alert.time_left} remaining
              </p>
            )}

            <div className="flex gap-2">
              {role === "donor" && onRespond && (
                <Button
                  onClick={() => onRespond(alert)}
                  className="flex-1 bg-blood text-white font-body font-bold rounded-xl h-9 hover:bg-blood/90 text-xs"
                >
                  I Can Help
                </Button>
              )}
              {role === "hospital" && onFindMatches && (
                <Button
                  onClick={() => onFindMatches(alert)}
                  variant="outline"
                  className="flex-1 font-body rounded-xl h-9 text-xs"
                >
                  Find Donors
                </Button>
              )}
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
