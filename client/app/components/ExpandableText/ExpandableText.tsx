import React, { useState } from "react";

const ExpandableText = ({ text, limit = 350 }: { text: string, limit: number }) => {
  const [showFullText, setShowFullText] = useState(false);

  const canExpandText = (text ?? "").trim().length > limit;
  const collapsedText = canExpandText
    ? `${text.slice(0, limit).trimEnd()}...`
    : text;
  return (
    <p className="text-sm md:text-base leading-8 text-white/80">
      <span>{showFullText ? text : collapsedText}</span>
      {canExpandText ? (
        <button
          type="button"
          className="ml-2 inline text-sm font-medium text-white/80 transition hover:text-white"
          onClick={() => setShowFullText((value) => !value)}
        >
          {showFullText ? "View less" : "View more"}
        </button>
      ) : null}
    </p>
  );
};

export default ExpandableText;
