/** The quickgist mark. */

/**
 * The logo: two offset squares, the front one accented.
 *
 * The metaphor is the product, a copy of something you hand to someone else. It is
 * built from two squares and three strokes so it survives being 17 pixels wide,
 * where a more literal document or arrow turns to mud. Drawn rather than imported so
 * it takes its colour from the accent token and costs no asset request.
 *
 * Corners are square, like everything else in this interface.
 */
export function BrandMark() {
  return (
    <svg
      viewBox="0 0 18 18"
      aria-hidden
      className="size-[18px] flex-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.5 12.5H1.5V1.5h8.2"
        stroke="var(--border-strong)"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
      <rect
        x="5.75"
        y="5.75"
        width="10.5"
        height="10.5"
        stroke="var(--blue-action)"
        strokeWidth="1.5"
      />
      <path
        d="M8.4 9.4h5.2M8.4 12.6h3"
        stroke="var(--blue-action)"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}
