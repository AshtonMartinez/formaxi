import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function makeIcon(children: React.ReactNode, viewBox = "0 0 18 18") {
  return function Icon({ size = 18, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        {...props}
      >
        {children}
      </svg>
    );
  };
}

export const StandingsIcon = makeIcon(
  <>
    <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
  </>
);

export const DiscoverIcon = makeIcon(
  <>
    <circle cx="9" cy="9" r="7.2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M1.8 9h14.4M9 1.8c2 2 2 12.4 0 14.4M9 1.8c-2 2-2 12.4 0 14.4" stroke="currentColor" strokeWidth="1.6" />
  </>
);

export const ScheduleIcon = makeIcon(
  <>
    <rect x="1.6" y="3" width="14.8" height="13.4" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M1.6 7h14.8M6 1.6v3M12 1.6v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </>
);

export const TeamIcon = makeIcon(
  <>
    <circle cx="6.4" cy="6" r="3.2" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12.4" cy="7.4" r="2.6" stroke="currentColor" strokeWidth="1.6" />
    <path d="M1.4 16c.6-3 2.6-4.6 5-4.6s4.4 1.6 5 4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </>
);

export const ProfileIcon = makeIcon(
  <>
    <circle cx="9" cy="5.6" r="3.4" stroke="currentColor" strokeWidth="1.6" />
    <path d="M2.6 16.2c.8-3.4 3.2-5.2 6.4-5.2s5.6 1.8 6.4 5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </>
);

export const SearchIcon = makeIcon(
  <>
    <circle cx="6.4" cy="6.4" r="4.8" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.2 10.2L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </>,
  "0 0 15 15"
);

export const BellIcon = makeIcon(
  <>
    <path d="M3.5 7a5 5 0 0110 0c0 4 1.5 5 1.5 5H2s1.5-1 1.5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M6.8 14.5a1.8 1.8 0 003.4 0" stroke="currentColor" strokeWidth="1.5" />
  </>,
  "0 0 17 17"
);

export const PlusIcon = makeIcon(
  <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />,
  "0 0 16 16"
);
