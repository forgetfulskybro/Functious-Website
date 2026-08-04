import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Option {
  value: string;
  label: string;
}

interface SingleProps {
  multiple?: false;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  label: string;
  placeholder?: string;
}

interface MultiProps {
  multiple: true;
  value: string[];
  onChange: (v: string[]) => void;
  options: Option[];
  label: string;
  placeholder?: string;
}

type SelectDropdownProps = SingleProps | MultiProps;

export default function SelectDropdown(props: SelectDropdownProps) {
  const { options, label, placeholder, multiple = false } = props;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      const menu = document.getElementById("select-dropdown-portal");
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target as Node) &&
        (!menu || !menu.contains(e.target as Node))
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, []);

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const update = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const singleValue = !multiple ? (props as SingleProps).value : "";
  const multiValue: string[] = multiple ? (props as MultiProps).value : [];

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    o.value.toLowerCase().includes(search.toLowerCase())
  );

  function isSelected(v: string) {
    return multiple
      ? multiValue.some(x => x.toLowerCase() === v.toLowerCase())
      : singleValue.toLowerCase() === v.toLowerCase();
  }

  function handleSelect(v: string) {
    if (!multiple) {
      (props as SingleProps).onChange(v);
      setOpen(false);
      setSearch("");
    } else {
      const p = props as MultiProps;
      const next = p.value.includes(v)
        ? p.value.filter((x) => x !== v)
        : [...p.value, v];
      p.onChange(next);
    }
  }

  function handleClearAll() {
    if (multiple) (props as MultiProps).onChange([]);
  }

  function triggerLabel(): React.ReactNode {
    if (!multiple) {
      const sel = options.find((o) => o.value === singleValue);
      if (!sel) return <span className="text-white text-sm">{placeholder ?? "Select…"}</span>;
      return <span className="text-white text-sm truncate">{sel.label}</span>;
    }
    if (multiValue.length === 0)
      return <span className="text-white/30 text-sm">{placeholder ?? "Select…"}</span>;
    return (
      <span className="text-white text-sm truncate">
        {multiValue.slice(0, 3)
          .map((v) => (options.find((o) => o.value === v)?.label ?? v).toLowerCase())
          .join(", ")}
        {multiValue.length > 3 && (
          <span className="text-white/50 ml-1">+{multiValue.length - 3}</span>
        )}
      </span>
    );
  }

  const menu = open
    ? createPortal(
        <div
          id="select-dropdown-portal"
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: coords.width,
            zIndex: 9999,
          }}
          className="rounded-xl bg-[#221616] shadow-2xl overflow-hidden"
        >
          {(multiple || options.length > 6) && (
            <div className="px-3 pt-3 pb-2">
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>
          )}

          {multiple && (
            <div className={`flex items-center justify-between px-4 pb-1.5 ${multiValue.length === 0 ? 'invisible' : ''}`}>
              <span className="text-[10px] text-white/30">{multiValue.length} selected</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[10px] text-white/40 hover:text-white/70 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto pb-2 py-1">
            {filtered.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-4">No options found.</p>
            ) : (
              filtered.map((opt) => {
                const selected = isSelected(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={[
                      "w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors",
                      selected
                        ? "bg-orange/10 text-orange-warm"
                        : "text-white/70 hover:bg-white/5 hover:text-white",
                    ].join(" ")}
                  >
                    {multiple && (
                      <span
                        className={[
                          "flex-shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors",
                          selected ? "border-orange/50 bg-orange/20" : "border-white/20",
                        ].join(" ")}
                        aria-hidden="true"
                      >
                        {selected && (
                          <svg className="w-2.5 h-2.5 text-orange-warm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                    )}
                    <span className={multiple ? "font-mono lowercase" : ""}>{opt.label}</span>
                  </button>
                );
              })
            )}
          </div>

          {multiple && (
            <div className="px-3 pb-3 pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={() => { setOpen(false); setSearch(""); }}
                className="w-full py-2 rounded-lg bg-orange/10 hover:bg-orange/20 text-orange-warm text-xs font-medium transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={wrapperRef} className="relative w-full">
      {label && (
        <label className="block text-white/50 text-xs font-medium mb-1.5">{label}</label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 bg-white/5 rounded-lg px-3 py-2.5 text-left hover:bg-white/8 transition-colors"
      >
        <span className="flex-1 min-w-0">{triggerLabel()}</span>
        <svg
          className={[
            "w-3.5 h-3.5 text-white/30 transition-transform shrink-0",
            open ? "rotate-180" : "",
          ].join(" ")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {menu}
    </div>
  );
}
