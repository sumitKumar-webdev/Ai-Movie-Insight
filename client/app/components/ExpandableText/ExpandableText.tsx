import React, { useState } from "react";

function normalizeReviewText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n\s*\n+/g, "\n\n")
    .replace(/[ \t]+$/gm, "");
}

const ExpandableText = ({
  text,
  limit = 350,
}: {
  text: string;
  limit: number;
}) => {
  const [showFullText, setShowFullText] = useState(false);
  const normalizedText = normalizeReviewText(text ?? "");

  const canExpandText = normalizedText.length > limit;
  const collapsedText = canExpandText
    ? `${normalizedText.slice(0, limit).trimEnd()}...`
    : normalizedText;

  const toggleText = () => setShowFullText((value) => !value);

  return (
    <div
      onClick={toggleText}
      className="text-sm md:text-base leading-8 text-white/80 cursor-pointer whitespace-pre-line"
    >
      <span>{showFullText ? normalizedText : collapsedText}</span>
      {canExpandText && (
        <button
          type="button"
          className="ml-2 inline text-sm font-medium text-white/80 transition hover:text-white"
          onClick={(event) => {
            event.stopPropagation();
            toggleText();
          }}
        >
          {showFullText ? "View less" : "View more"}
        </button>
      )}
    </div>
  );
};

export default ExpandableText;
