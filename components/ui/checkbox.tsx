import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

function Checkbox({ className, label, id, ...props }: CheckboxProps) {
  const inputId = id || React.useId();
  return (
    <label htmlFor={inputId} className="inline-flex items-center space-x-2 cursor-pointer">
      <input
        id={inputId}
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400",
          className
        )}
        {...props}
      />
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  );
}

export { Checkbox };
