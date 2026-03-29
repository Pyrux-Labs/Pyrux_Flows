"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface StatusConfig {
  label: string;
  className: string;
}

interface StatusBadgeDropdownProps {
  currentStatus: string;
  statusConfig: Record<string, StatusConfig>;
  onStatusChange: (newStatus: string) => void;
}

export function StatusBadgeDropdown({
  currentStatus,
  statusConfig,
  onStatusChange,
}: StatusBadgeDropdownProps) {
  const currentCfg = statusConfig[currentStatus];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Badge
          variant="outline"
          className={`cursor-pointer text-xs ${currentCfg?.className ?? ""}`}
        >
          {currentCfg?.label ?? currentStatus}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {Object.entries(statusConfig).map(([value, cfg]) => (
          <DropdownMenuItem
            key={value}
            onClick={() => {
              if (value !== currentStatus) {
                onStatusChange(value);
              }
            }}
            disabled={value === currentStatus}
            className="flex items-center gap-2"
          >
            {value === currentStatus && <Check className="h-3.5 w-3.5 shrink-0" />}
            <Badge variant="outline" className={`text-xs ${cfg.className}`}>
              {cfg.label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
