import { CreditCard } from "@/app/components/cards/creadit-card";
import CreditCardSkeleton from "@/app/components/skeleton-loader/credit-card-skeleton";
import { PersonCredit } from "@/app/modal/service.modal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

type CastCrewSectionProps = {
  title: string;
  loading: boolean;
  people: PersonCredit[];
};

const CastCrewSection = ({ title, loading, people }: CastCrewSectionProps) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const buttonClassName =
    "rounded-full border border-white/20 bg-black/50 p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:hover:bg-black/50 disabled:hover:text-white/80";

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;

    const updateScrollState = () => {
      const hasOverflow = node.scrollWidth - node.clientWidth > 1;
      const maxScrollLeft = node.scrollWidth - node.clientWidth;

      setCanScroll(hasOverflow);
      setCanScrollLeft(node.scrollLeft > 1);
      setCanScrollRight(hasOverflow && node.scrollLeft < maxScrollLeft - 1);
    };

    updateScrollState();
    node.addEventListener("scroll", updateScrollState, { passive: true });

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(node);

    return () => {
      node.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [people]);

  const scrollByCards = (direction: "left" | "right") => {
    const node = scrollerRef.current;
    if (!node) return;

    const amount = Math.max(240, Math.floor(node.clientWidth * 0.9));
    node.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/70">{title || "Cast & Crew"}</h3>
      {loading ? (
        <div className="flex gap-3 overflow-hidden">{[1, 2, 3, 4].map((item) => <CreditCardSkeleton key={`crew-skeleton-${item}`} />)}</div>
      ) : people.length > 0 ? (
        <div className="relative max-w-full">
          {canScroll && (
            <div className="absolute -top-11 right-0 hidden gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scrollByCards("left")}
                disabled={!canScrollLeft}
                className={buttonClassName}
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByCards("right")}
                disabled={!canScrollRight}
                className={buttonClassName}
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <div
            ref={scrollerRef}
            className="flex max-w-full gap-3 overflow-x-auto overscroll-x-contain px-1 pb-2 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {people.map((person) => (
              <div key={person.id} className="snap-start">
                <CreditCard person={person} />
              </div>
            ))}
          </div>
          {canScroll && (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-black to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-black to-transparent" />
            </>
          )}
        </div>
      ) : (
        <p className="text-center text-base text-white/60">No data available.</p>
      )}
    </section>
  );
};

export default CastCrewSection;
