"use client";

import { PersonCredit } from "@/app/models/service.modal";
import { startRouteProgress } from "@/app/components/ui/route-progress";
import { formatLabel, getInitials } from "@/lib/resuable-component";
import Image from "next/image";
import { useRouter } from "next/navigation";

export const CreditCard = ({ person }: { person: PersonCredit }) => {
  const router = useRouter();
  const formattedCharacters = person.characters.map(formatLabel).join(", ");
  const formattedRoles = person.roles.map(formatLabel).join(", ");
  const subtitle =
    formattedCharacters || formattedRoles || "Contributor";

  const handleNavigate = () => {
    if (!person.id) return;

    startRouteProgress();
    router.push(`/name/${person.id}`);
  };

  return (
    <button
      type="button"
      onClick={handleNavigate}
      className="group w-37.5 shrink-0 rounded-2xl border border-transparent p-3 text-center transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
    >
      {person.imageUrl ? (
        <Image
          src={person.imageUrl}
          alt={person.name}
          width={88}
          height={88}
          className="mx-auto h-18 w-18 rounded-full object-cover transition-transform duration-300 group-hover:scale-[1.05] md:h-22 md:w-22"
        />
      ) : (
        <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-white/10 text-xl text-white/70 transition-colors duration-300 group-hover:bg-white/16 group-hover:text-white md:h-22 md:w-22">
          {getInitials(person.name)}
        </div>
      )}
      <div className="mt-3 min-w-0">
        <p className="line-clamp-2 text-sm font-semibold leading-5 text-white transition-colors duration-300 group-hover:text-cyan-100 md:text-base">
          {person.name}
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-white/60 transition-colors duration-300 group-hover:text-white/75 md:text-sm">
          {subtitle}
        </p>
      </div>
    </button>
  );
};
