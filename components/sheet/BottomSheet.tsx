"use client";

import { useEffect, useId, type ReactNode } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { useDict } from "@/lib/store";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  z?: number;
}

/** Draggable bottom sheet: drag the handle/header down (or fling) to dismiss; Esc and backdrop close it too. */
export function BottomSheet({ open, onClose, title, footer, children, z = 50 }: Props) {
  const d = useDict();
  const controls = useDragControls();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0" style={{ zIndex: z }}>
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[90dvh] max-w-[480px] flex-col rounded-t-2xl border-t border-line-strong bg-bg"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 550) onClose();
            }}
          >
            <div className="shrink-0 cursor-grab touch-none px-5 pt-2.5" onPointerDown={(e) => controls.start(e)}>
              <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-line-strong" aria-hidden />
              <div className="flex min-h-11 items-center justify-between gap-3">
                <div id={titleId} className="min-w-0 flex-1">
                  {title}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={d.sheet.close}
                  className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted active:bg-surface-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
            {footer && (
              <div className="shrink-0 border-t border-line px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
