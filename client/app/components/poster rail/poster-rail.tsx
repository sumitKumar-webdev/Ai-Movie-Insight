import Image from "next/image";

export const PosterRail = ({
  reverse = false,
  posters,
}: {
  reverse?: boolean;
  posters: string[];
}) => {
  const stack = [...posters, ...posters];

  return (
    <div className="relative h-screen w-42 overflow-hidden rounded-3xl md:w-64">
      <div className={reverse ? "poster-scroll-up" : "poster-scroll-down"}>
        {stack.map((src, index) => (
          <div key={`${src}-${index}`} className="p-2">
            <Image
              src={src}
              alt="Movie poster"
              width={500}
              height={750}
              sizes="(max-width: 768px) 168px, 256px"
              className="h-auto w-full rounded-2xl object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-linear-to-b from-black/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-black/80 to-transparent" />
    </div>
  );
};
