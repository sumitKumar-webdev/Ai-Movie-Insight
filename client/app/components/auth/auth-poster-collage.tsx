"use client";

import Image from "next/image";

const posterColumns = [
  [
    "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    "https://image.tmdb.org/t/p/w500/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg",
  ],
  [
    "https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg",
    "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
  ],
  [
    "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    "https://image.tmdb.org/t/p/w500/7oWY8VDWW7thTzWh3OKYRkWUlD5.jpg",
  ],
  [
    "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    "https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg",
    "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
  ],
  [
    "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
    "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
  ],
];

const columnOffsets = [
  "pt-24",
  "pt-2",
  "pt-16",
  "pt-0",
  "pt-20",
];

function PosterColumn({
  posters,
  offsetClass,
}: {
  posters: string[];
  offsetClass: string;
}) {
  return (
    <div
      className={`auth-collage-enter w-full relative overflow-hidden rounded-[30px] ${offsetClass}`}
    >
      <div className="flex flex-col gap-4 px-2 pb-4">
        {posters.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className="overflow-hidden rounded-[24px] shadow-[0_16px_30px_rgba(0,0,0,0.4)]"
          >
            <Image
              src={src}
              alt="Movie poster"
              width={500}
              height={750}
              sizes="(max-width: 1279px) 20vw, 220px"
              className="aspect-2/3 h-auto w-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-black via-black/75 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black via-black/75 to-transparent" />
    </div>
  );
}

export function AuthPosterCollage() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[72vh] overflow-hidden lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_12%,rgba(0,0,0,0.42)_32%,rgba(0,0,0,0.9)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.82),rgba(0,0,0,0.2)_18%,rgba(0,0,0,0.05)_50%,rgba(0,0,0,0.2)_82%,rgba(0,0,0,0.82))]" />
      <div className="absolute left-1/2 top-[52%] h-120 w-[min(30rem,38vw)] -translate-x-1/2 -translate-y-1/2 rounded-[42px] bg-black/76 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]" />

      <div className="mx-auto grid h-full max-w-7xl grid-cols-[1fr_1fr_minmax(22rem,30rem)_1fr_1fr] gap-4 px-6 pt-10 xl:gap-5 xl:px-10">
        <PosterColumn posters={posterColumns[0]} offsetClass={columnOffsets[0] ?? ""} />
        <PosterColumn posters={posterColumns[1]} offsetClass={columnOffsets[1] ?? ""} />
        <div aria-hidden="true" />
        <PosterColumn posters={posterColumns[3]} offsetClass={columnOffsets[3] ?? ""} />
        <PosterColumn posters={posterColumns[4]} offsetClass={columnOffsets[4] ?? ""} />
      </div>
    </div>
  );
}
