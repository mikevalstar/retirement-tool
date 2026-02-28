import { X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "#/components/ui/sheet";

interface SlidePanelProps {
  title: string;
  width?: number;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function SlidePanel({ title, width = 380, onClose, children, footer }: SlidePanelProps) {
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        showCloseButton={false}
        className="gap-0 p-0 sm:max-w-none"
        style={{ width, background: "var(--surface)", borderLeft: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="py-[18px] px-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <SheetTitle className="m-0 text-[15px]" style={{ color: "var(--text)" }}>
            {title}
          </SheetTitle>
          <button type="button" onClick={onClose} className="flex items-center justify-center p-1 rounded border-none bg-transparent cursor-pointer shrink-0">
            <X size={15} style={{ color: "var(--text-dim)" }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Footer */}
        <div className="py-3.5 px-5 flex gap-2 justify-end" style={{ borderTop: "1px solid var(--border)" }}>
          {footer}
        </div>
      </SheetContent>
    </Sheet>
  );
}
