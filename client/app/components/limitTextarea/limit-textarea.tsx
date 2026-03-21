import React from "react";

type LimitTextareaProps = {
  limit?: number;
  message?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
  className?: string;
  defaultValue?: string;
};

const LimitTextarea = ({
  limit = 500,
  message = "You have reached the character limit.",
  error,
  placeholder = "Write your review here...",
  value,
  onChange,
  rows = 1,
  className = "",
  defaultValue = "",
}: LimitTextareaProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const currentValue = value ?? internalValue;
  const count = currentValue.length;
  const isAtLimit = count >= limit;
  const visibleError = error ?? (isAtLimit ? message : "");

  React.useEffect(() => {
    if (value === undefined) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue, value]);

  React.useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [currentValue]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value.slice(0, limit);

    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue);
  };

  return (
    <div className="w-full border-b border-[#474747] pb-0">
      <div className="relative">
        <textarea
          ref={textareaRef}
          placeholder={placeholder}
          rows={rows}
          value={currentValue}
          onChange={handleChange}
          maxLength={limit}
          className={`min-h-15 w-full resize-none overflow-hidden border-none bg-transparent p-0 pr-16 text-xs text-white outline-none sm:text-sm md:text-base ${className}`}
        />
        <div className="absolute right-0 bottom-0 text-[10px] text-[#6B7280] sm:text-xs">
          {count}/{limit}
        </div>
      </div>
      {visibleError ? (
        <p className="mt-1 text-xs text-red-500">{visibleError}</p>
      ) : null}
    </div>
  );
};

export default LimitTextarea;
