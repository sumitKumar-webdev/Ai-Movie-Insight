import { PersonCredit } from "@/app/modal/service.modal";
import { formatLabel, getInitials } from "@/lib/resuable-component";
import Image from "next/image";

export const CreditCard = ({ person }: { person: PersonCredit }) => {
  return (
    <div className="w-37.5 shrink-0 rounded-2xl p-3 text-center">
      {person.imageUrl ? (
        <Image
          src={person.imageUrl}
          alt={person.name}
          width={88}
          height={88}
          className="mx-auto h-18 w-18 md:h-22 md:w-22 rounded-full object-cover"
        />
      ) : (
        <div className="mx-auto flex h-18 w-18 md:h-22 md:w-22 items-center justify-center rounded-full bg-white/10 text-xl text-white/70">
          {getInitials(person.name)}
        </div>
      )}
      <div className="mt-3 min-w-0">
        <p className="line-clamp-2 text-sm md:text-base font-semibold leading-5 text-white">
          {person.name}
        </p>
        <p className="mt-1 line-clamp-2 text-xs md:text-sm text-white/60">
          {person.professions.map(formatLabel).join(", ") || "Contributor"}
        </p>
      </div>
    </div>
  );
};
