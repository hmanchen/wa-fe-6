import { Montserrat, Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["500", "600"],
});

/** Brand mark: white arc + gold hollow triangle (Arclis identity). */
function ArclisLogoMark() {
  return (
    <svg
      viewBox="0 0 140 88"
      className="mx-auto block h-[4.5rem] w-auto sm:h-[5.25rem]"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Quarter arc — upper left */}
      <path
        d="M 28 32 A 38 38 0 0 1 62 20"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Hollow triangle — gold stroke */}
      <path
        d="M 74 40 L 104 78 L 44 78 Z"
        fill="none"
        stroke="#C09433"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[#0A1F19] px-4 pb-12 pt-10 sm:px-6">
      <div className="mb-8 flex w-full max-w-md flex-col items-center sm:mb-10">
        <ArclisLogoMark />
        <h1
          className={`${playfair.className} mt-2 text-center text-[1.75rem] font-bold tracking-tight text-white sm:text-[2.125rem]`}
        >
          <span className="text-white">arc</span>
          <span className="text-[#C09433]">lis</span>
        </h1>
        <p
          className={`${montserrat.className} mt-2 max-w-md text-center text-[10px] font-medium uppercase leading-snug tracking-[0.28em] text-[#C09433] sm:text-[11px]`}
        >
          Financial Intelligence Platform
        </p>
        <div
          className="mt-5 flex w-full max-w-[240px] items-center justify-center"
          aria-hidden
        >
          <div className="h-px min-w-0 flex-1 bg-[#C09433]" />
          <div className="mx-2 size-2 shrink-0 rotate-45 bg-[#C09433]" />
          <div className="h-px min-w-0 flex-1 bg-[#C09433]" />
        </div>
      </div>
      <div className="w-full max-w-full sm:max-w-md">{children}</div>
    </div>
  );
}
