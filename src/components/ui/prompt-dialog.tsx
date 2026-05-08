"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  label?: string;
}

export function PromptDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  defaultValue = "",
  onConfirm,
  label,
}: PromptDialogProps) {
  const [value, setValue] = React.useState(defaultValue);

  React.useEffect(() => {
    if (open) {
      setValue(defaultValue);
    }
  }, [open, defaultValue]);

  const handleConfirm = () => {
    onConfirm(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-muted-foreground font-medium">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4 space-y-2">
          {label && <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">{label}</label>}
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleConfirm();
              }
            }}
            autoFocus
            className="rounded-xl border-border/50 h-12 focus-visible:ring-primary/20"
          />
        </div>
        <DialogFooter className="flex flex-row gap-3 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none rounded-xl font-bold uppercase tracking-widest text-[10px]"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="flex-1 sm:flex-none rounded-xl font-black uppercase tracking-widest text-[10px] px-8 shadow-lg shadow-primary/20"
          >
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
