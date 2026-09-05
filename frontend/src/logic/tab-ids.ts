/** The ids tying a file tab to the panel it controls.

 * They live outside both components because a tab strip in the chrome and a panel
 * in the gist view have to agree on them, and a component importing another
 * component for a string helper is the wrong direction.
 */

export function tabId(id: string): string {
  return `tab-${id}`;
}

export function panelId(id: string): string {
  return `panel-${id}`;
}
