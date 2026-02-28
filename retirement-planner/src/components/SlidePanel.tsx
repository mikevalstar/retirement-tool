import { X } from "lucide-react";

interface SlidePanelProps {
  title: string;
  width?: number;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function SlidePanel({ title, width = 380, onClose, children, footer }: SlidePanelProps) {
  return (
    <>
      {/* Backdrop */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss is a standard modal pattern */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss is a standard modal pattern */}
      <div onClick={onClose} className="fixed inset-0 z-[100]" style={{ background: "rgba(0,0,0,0.45)" }} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full flex flex-col z-[101]" style={{ width, background: "var(--surface)", borderLeft: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="py-[18px] px-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="m-0 text-[15px] font-semibold" style={{ color: "var(--text)" }}>
            {title}
          </h2>
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
      </div>
    </>
  );
}
