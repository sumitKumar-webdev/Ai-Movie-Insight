import { formatLabel } from "@/lib/resuable-component";

function isAvailableValue(value?: string | null) {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return (
    Boolean(normalized) &&
    normalized !== "n/a" &&
    normalized !== "unavailable" &&
    normalized !== "unknown"
  );
}

function normalizeMetaValues(values?: string | string[] | null) {
  if (Array.isArray(values)) {
    return values.map((value) => value.trim()).filter(isAvailableValue);
  }

  if (typeof values !== "string") {
    return [];
  }

  return values
    .split(",")
    .map((value) => value.trim())
    .filter(isAvailableValue);
}

type MetaValueListProps = {
  values?: string | string[] | null;
  label: string;
};

export default function MetaValueList({ values, label }: MetaValueListProps) {
  const normalizedValues = normalizeMetaValues(values);

  if (!normalizedValues.length) {
    return null;
  }

  const [firstValue, ...remainingValues] = normalizedValues;

  return (
    <div className="group relative mt-1 flex flex-wrap items-center gap-2">
      <p className="font-medium">{formatLabel(firstValue) ?? "N/A"}</p>
      {Boolean(remainingValues.length) && (
        <div>
          <span className="inline-flex text-[11px] font-medium text-white/80 sm:text-[12px]">
            +{remainingValues.length}
          </span>
        </div>
      )}
      {Boolean(remainingValues.length) && (
        <div className="pointer-events-none absolute bottom-[calc(100%+0.45rem)] left-0 z-50 min-w-40 rounded-xl border border-white/10 bg-[#080808]/96 px-3 py-2.5 text-[10px] text-white/75 opacity-0 shadow-[0_18px_45px_rgba(0,0,0,0.45)] transition-opacity duration-200 group-hover:opacity-100 sm:text-xs">
          <p className="mb-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-white/50 sm:text-[9px]">
            Remaining {label}
          </p>
          <ul className="space-y-1 leading-5">
            {remainingValues.map((value) => (
              <li key={value} className="font-medium text-white/80">
                {formatLabel(value)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
