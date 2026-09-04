/** Byte sizes as a person reads them. */

/**
 * Formats a size for display.
 *
 * Powers of 1024 with the unit a developer expects, and no decimal below a
 * megabyte: "412 KB" says everything "411.7 KB" does.
 */
export function formatBytes(byteSize: number): string {
  if (byteSize < 1024) {
    return `${byteSize} B`;
  }
  if (byteSize < 1024 * 1024) {
    return `${Math.round(byteSize / 1024)} KB`;
  }
  return `${(byteSize / (1024 * 1024)).toFixed(1)} MB`;
}
