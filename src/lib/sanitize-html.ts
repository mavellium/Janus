import sanitizeHtml from 'sanitize-html'

const COLOR_VALUES = [
  /^#(0x)?[0-9a-fA-F]{3,8}$/,
  /^rgb\(\s*(\d{1,3}\s*,\s*){2}\d{1,3}\s*\)$/,
  /^rgba\(\s*(\d{1,3}\s*,\s*){3}(0|1|0?\.\d+)\s*\)$/,
  /^[a-z]+$/,
]

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'span',
    'div',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'mark',
    'sub',
    'sup',
    'blockquote',
    'pre',
    'code',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'hr',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'colgroup',
    'col',
    'figure',
    'figcaption',
    'iframe',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'style'],
    iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder'],
    span: ['style', 'class'],
    div: ['style', 'data-callout', 'data-variant', 'data-youtube-video'],
    figure: ['data-align', 'class'],
    col: ['style'],
    p: ['style'],
    h1: ['style'],
    h2: ['style'],
    h3: ['style'],
    h4: ['style'],
    h5: ['style'],
    h6: ['style'],
    td: ['colspan', 'rowspan', 'style'],
    th: ['colspan', 'rowspan', 'style'],
    li: ['data-checked', 'data-type'],
    ul: ['data-type'],
    code: ['class'],
    pre: ['class'],
  },
  allowedClasses: {
    span: ['hljs', 'hljs-*'],
    code: ['language-*', 'hljs', 'hljs-*'],
    pre: ['language-*'],
    ul: ['contains-task-list'],
    li: ['task-list-item'],
  },
  allowedStyles: {
    '*': {
      'text-align': [/^(left|right|center|justify)$/],
      color: COLOR_VALUES,
      'background-color': COLOR_VALUES,
      width: [/^\d+(\.\d+)?(px|%)$/],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'player.vimeo.com'],
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href ?? ''
      const isExternal = /^https?:\/\//i.test(href)
      return {
        tagName: 'a',
        attribs: isExternal
          ? { ...attribs, target: '_blank', rel: 'noopener noreferrer nofollow' }
          : attribs,
      }
    },
  },
}

export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty, OPTIONS)
}
