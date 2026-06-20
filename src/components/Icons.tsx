import type { SVGProps } from "react";

type IconName = "forge" | "path" | "workshop" | "collection" | "profile" | "export" | "spark" | "close" | "soundOn" | "soundOff";

const paths: Record<IconName, string[]> = {
  forge: [
    "M7 18h10",
    "M9 18l1-6h4l1 6",
    "M7 12h10l-2-5H9l-2 5Z",
    "M5 21h14"
  ],
  path: [
    "M5 18c3 0 3-12 7-12s4 12 7 12",
    "M5 18h4",
    "M15 18h4",
    "M12 6v12"
  ],
  workshop: [
    "M4 19h16",
    "M6 19V8l6-4 6 4v11",
    "M9 19v-6h6v6",
    "M8 10h8"
  ],
  collection: [
    "M5 7l7-4 7 4v10l-7 4-7-4V7Z",
    "M5 7l7 4 7-4",
    "M12 11v10"
  ],
  profile: [
    "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    "M4 21c1.2-4 4.1-6 8-6s6.8 2 8 6"
  ],
  export: [
    "M12 4v10",
    "M8 8l4-4 4 4",
    "M5 14v5h14v-5"
  ],
  spark: [
    "M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9L12 3Z",
    "M6 19l2-2",
    "M18 19l-2-2"
  ],
  close: ["M6 6l12 12", "M18 6L6 18"],
  soundOn: ["M4 10v4h4l5 4V6l-5 4H4Z", "M16 9c1.2 1.2 1.2 4.8 0 6", "M19 7c2.4 2.5 2.4 7.5 0 10"],
  soundOff: ["M4 10v4h4l5 4V6l-5 4H4Z", "M17 9l4 4", "M21 9l-4 4"]
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      {paths[name].map((path) => (
        <path key={path} d={path} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
