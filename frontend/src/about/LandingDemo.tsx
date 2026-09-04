/** The source-and-result pair on the landing page. */

const SOURCE = `# Deploy notes

Two things to check **before** the release:

| Step | Owner |
| --- | --- |
| Migrate | backend |
| Smoke test | anyone |

\`\`\`go
func main() {
	fmt.Println("ready")
}
\`\`\``;

/**
 * What a paste turns into.
 *
 * The left pane is the text somebody types, the right pane is the page their reader
 * gets. It is written as ordinary markup rather than a screenshot, so it stays true
 * when the styles change and costs no image to download.
 *
 * The right pane borrows `.gist-prose`, which is the same stylesheet a real gist is
 * rendered with, so this cannot drift from the product it is advertising.
 */
export function LandingDemo() {
  return (
    <section className="border-b border-[var(--border)]">
      <header className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 px-5 pt-12 pb-6 sm:px-10">
        <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-[var(--heading)]">
          What your reader gets
        </h2>
        <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--faint)] uppercase">
          Source · Result
        </p>
      </header>

      <div className="grid border-t border-[var(--border)] lg:grid-cols-2">
        <div className="border-b border-[var(--border)] bg-[var(--panel)] lg:border-b-0 lg:border-r">
          <p className="border-b border-[var(--border)] px-5 py-2 font-mono text-[10px] tracking-[0.12em] text-[var(--faint)] uppercase sm:px-8">
            deploy-notes.md
          </p>
          <pre className="overflow-x-auto px-5 py-6 font-mono text-[11.5px] leading-[1.75] text-[var(--dim)] sm:px-8">
            {SOURCE}
          </pre>
        </div>

        <div>
          <p className="border-b border-[var(--border)] px-5 py-2 font-mono text-[10px] tracking-[0.12em] text-[var(--faint)] uppercase sm:px-8">
            The link
          </p>
          <div className="gist-prose px-5 py-6 sm:px-8">
            <h1>Deploy notes</h1>
            <p>
              Two things to check <strong>before</strong> the release:
            </p>
            <table>
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Migrate</td>
                  <td>backend</td>
                </tr>
                <tr>
                  <td>Smoke test</td>
                  <td>anyone</td>
                </tr>
              </tbody>
            </table>
            <div className="code-block" data-language="go">
              <pre className="chroma">
                <code>
                  <span className="k">func</span> <span className="nf">main</span>() {'{'}
                  {'\n\t'}
                  fmt.<span className="nf">Println</span>(<span className="s">"ready"</span>){'\n'}
                  {'}'}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
