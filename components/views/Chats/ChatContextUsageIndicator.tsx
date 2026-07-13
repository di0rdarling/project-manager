"use client";

import { useId, useState, type MouseEvent } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import MuiIconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  formatCompactTokenCount,
  formatSpacedCompactTokenCount,
  getChatContextUsagePercent,
} from "@/lib/chat-context/chat-context-usage";
import type {
  ChatContextUsage,
  ChatContextUsageCategoryKey,
} from "@/lib/types";

type ChatContextUsageIndicatorProps = {
  usage: ChatContextUsage;
  className?: string;
};

const CATEGORY_COLORS: Record<ChatContextUsageCategoryKey, string> = {
  systemPrompt: "#a1a1aa",
  agentMemory: "#8b5cf6",
  sharedMemory: "#d946ef",
  projectContext: "#f59e0b",
  conversation: "#06b6d4",
};

function getRingColor(percent: number): string {
  if (percent >= 100) {
    return "#ef4444";
  }

  if (percent >= 80) {
    return "#f59e0b";
  }

  return "#71717a";
}

export function ChatContextUsageIndicator({
  usage,
  className = "",
}: Readonly<ChatContextUsageIndicatorProps>) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const popoverId = useId();

  const percent = getChatContextUsagePercent(usage);
  const roundedPercent = Math.round(percent);
  const ringColor = getRingColor(percent);
  const isOpen = Boolean(anchorEl);

  function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    setAnchorEl((current) => (current ? null : event.currentTarget));
  }

  function handleClose() {
    setAnchorEl(null);
  }

  return (
    <>
      <Tooltip title="Show context usage" disableHoverListener={isOpen} arrow>
        <MuiIconButton
          type="button"
          size="small"
          onClick={handleToggle}
          aria-describedby={isOpen ? popoverId : undefined}
          className={className}
          sx={{ p: 0.5 }}
        >
          <Box sx={{ position: "relative", display: "inline-flex" }}>
            <CircularProgress
              variant="determinate"
              value={100}
              size={20}
              thickness={5}
              sx={{ color: "action.disabledBackground" }}
            />
            <CircularProgress
              variant="determinate"
              value={percent}
              size={20}
              thickness={5}
              sx={{
                color: ringColor,
                position: "absolute",
                left: 0,
                "& .MuiCircularProgress-circle": {
                  strokeLinecap: "round",
                },
              }}
            />
          </Box>
        </MuiIconButton>
      </Tooltip>

      <Popover
        id={popoverId}
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        slotProps={{
          paper: {
            sx: {
              width: 300,
              borderRadius: 3,
              p: 2.25,
              mb: 1,
            },
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Context usage
          </Typography>
          <MuiIconButton type="button" size="small" onClick={handleClose} sx={{ p: 0.5, mr: -0.5 }}>
            <XMarkIcon className="size-4" />
          </MuiIconButton>
        </Box>

        <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {roundedPercent}% full
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatSpacedCompactTokenCount(usage.usedTokens)} / {formatSpacedCompactTokenCount(usage.limitTokens)} Tokens
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            width: "100%",
            height: 8,
            borderRadius: 999,
            overflow: "hidden",
            bgcolor: "action.disabledBackground",
            mb: 2,
          }}
        >
          {usage.breakdown
            .filter((category) => category.tokens > 0)
            .map((category) => (
              <Box
                key={category.key}
                sx={{
                  width: `${(category.tokens / usage.limitTokens) * 100}%`,
                  bgcolor: CATEGORY_COLORS[category.key],
                }}
              />
            ))}
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
          {usage.breakdown.map((category) => (
            <Box
              key={category.key}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 1.5,
                px: 0.75,
                py: 0.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: CATEGORY_COLORS[category.key],
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2">{category.label}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {formatCompactTokenCount(category.tokens)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  );
}
