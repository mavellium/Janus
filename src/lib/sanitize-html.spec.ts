import { describe, it, expect } from 'vitest'
import { sanitizeArticleHtml } from './sanitize-html'

describe('sanitizeArticleHtml', () => {
  it('removes script tags and inline event handlers', () => {
    const out = sanitizeArticleHtml(
      '<p onclick="steal()">hi</p><script>alert(1)</script>',
    )
    expect(out).not.toContain('script')
    expect(out).not.toContain('onclick')
    expect(out).toContain('hi')
  })

  it('strips javascript: urls', () => {
    const out = sanitizeArticleHtml('<a href="javascript:alert(1)">x</a>')
    expect(out).not.toContain('javascript:')
  })

  it('keeps allowed formatting, alignment and color styles', () => {
    const out = sanitizeArticleHtml(
      '<p style="text-align:center"><span style="color:#ff0000">x</span></p>',
    )
    expect(out).toContain('center')
    expect(out).toContain('#ff0000')
  })

  it('adds nofollow + target to external links only', () => {
    const external = sanitizeArticleHtml('<a href="https://example.com">x</a>')
    expect(external).toContain('rel="noopener noreferrer nofollow"')
    expect(external).toContain('target="_blank"')

    const internal = sanitizeArticleHtml('<a href="/sobre">x</a>')
    expect(internal).not.toContain('nofollow')
  })

  it('keeps resizable image width but drops unknown tags', () => {
    const out = sanitizeArticleHtml(
      '<img src="https://cdn/x.avif" alt="a" style="width:320px"><marquee>no</marquee>',
    )
    expect(out).toContain('width:320px')
    expect(out).not.toContain('marquee')
  })

  it('preserves Fase 2 blocks: callout, code highlight, table and youtube', () => {
    const callout = sanitizeArticleHtml(
      '<div data-callout data-variant="warning"><p>x</p></div>',
    )
    expect(callout).toContain('data-callout')
    expect(callout).toContain('data-variant="warning"')

    const code = sanitizeArticleHtml(
      '<pre><code class="language-js"><span class="hljs-keyword">const</span></code></pre>',
    )
    expect(code).toContain('language-js')
    expect(code).toContain('hljs-keyword')

    const table = sanitizeArticleHtml(
      '<table><tbody><tr><th>a</th><td>b</td></tr></tbody></table>',
    )
    expect(table).toContain('<table')
    expect(table).toContain('<th')

    const yt = sanitizeArticleHtml(
      '<div data-youtube-video><iframe src="https://www.youtube.com/embed/abc"></iframe></div>',
    )
    expect(yt).toContain('data-youtube-video')
    expect(yt).toContain('youtube.com/embed/abc')

    const evil = sanitizeArticleHtml(
      '<iframe src="https://evil.com/x"></iframe>',
    )
    expect(evil).not.toContain('evil.com')
  })

  it('preserves image figure alignment and caption', () => {
    const out = sanitizeArticleHtml(
      '<figure data-align="right" class="janus-figure"><img src="https://cdn/x.avif" alt="a" style="width:200px"><figcaption>Minha legenda</figcaption></figure>',
    )
    expect(out).toContain('data-align="right"')
    expect(out).toContain('<figcaption>Minha legenda</figcaption>')
    expect(out).toContain('width:200px')
  })
})
