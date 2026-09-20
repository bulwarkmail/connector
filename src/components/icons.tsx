import { ICON } from "@/lib/icon";

/**
 * The handful of icons this site uses, drawn inline.
 *
 * The design system says lucide-react at 1.5px stroke with square caps and
 * mitred joins (src/lib/icon.ts). The rule is the geometry, not the package,
 * and this site keeps its runtime dependencies to Next, React and ReactDOM so
 * that nothing a visitor's browser runs comes from a third party. Five icons
 * are not worth breaking that, so they are drawn to the same spec by hand -
 * same viewBox, same stroke, sizes 16, 20 and 24, never in a filled shape.
 */

type IconProps = { size?: number; className?: string };

function Svg({ size = 20, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      {...ICON}
    >
      {children}
    </svg>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12h16" />
      <path d="m13 5 7 7-7 7" />
    </Svg>
  );
}

export function Check(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12 5 5 9-10" />
    </Svg>
  );
}

export function Plus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Svg>
  );
}

/** Used on the error line under a field, so an error is never colour alone. */
export function Alert(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </Svg>
  );
}

export function Server(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 4h18v6H3z" />
      <path d="M3 14h18v6H3z" />
      <path d="M7 7h.01" />
      <path d="M7 17h.01" />
    </Svg>
  );
}

export function Link(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </Svg>
  );
}

export function Shield(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
    </Svg>
  );
}
