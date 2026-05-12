import { EditorNode } from '@/hooks/use-builder'

interface CoreRendererProps {
  node: EditorNode
  renderChild?: (node: EditorNode) => React.ReactNode
}

export function CoreRenderer({ node, renderChild }: CoreRendererProps) {
  const renderChildren = () => {
    if (renderChild) {
      return node.children.map((child) => (
        <span key={child.id}>{renderChild(child)}</span>
      ))
    }
    return node.children.map((child) => (
      <CoreRenderer key={child.id} node={child} />
    ))
  }

  const style = (node.props.style as Record<string, string>) || {}
  const props = node.props as Record<string, unknown>

  switch (node.type) {
    case 'Section':
      return (
        <section
          style={{
            paddingTop: style.paddingTop,
            paddingRight: style.paddingRight,
            paddingBottom: style.paddingBottom,
            paddingLeft: style.paddingLeft,
            marginTop: style.marginTop,
            marginRight: style.marginRight,
            marginBottom: style.marginBottom,
            marginLeft: style.marginLeft,
            backgroundColor: props.backgroundColor as string,
            borderRadius: props.borderRadius as string,
            color: props.color as string,
          }}
        >
          {renderChildren()}
        </section>
      )

    case 'Container':
      return (
        <div
          style={{
            paddingTop: style.paddingTop,
            paddingRight: style.paddingRight,
            paddingBottom: style.paddingBottom,
            paddingLeft: style.paddingLeft,
            marginTop: style.marginTop,
            marginRight: style.marginRight,
            marginBottom: style.marginBottom,
            marginLeft: style.marginLeft,
            backgroundColor: props.backgroundColor as string,
            borderRadius: props.borderRadius as string,
            color: props.color as string,
          }}
        >
          {renderChildren()}
        </div>
      )

    case 'Heading':
      return (
        <h2
          style={{
            fontSize: props.fontSize as string,
            fontWeight: props.fontWeight as string,
            textAlign: props.textAlign as 'left' | 'center' | 'right' | 'justify',
            color: props.color as string,
            paddingTop: style.paddingTop,
            paddingRight: style.paddingRight,
            paddingBottom: style.paddingBottom,
            paddingLeft: style.paddingLeft,
            marginTop: style.marginTop,
            marginRight: style.marginRight,
            marginBottom: style.marginBottom,
            marginLeft: style.marginLeft,
          }}
        >
          {(props.content as string) || 'Heading'}
        </h2>
      )

    case 'Text':
      return (
        <p
          style={{
            fontSize: props.fontSize as string,
            fontWeight: props.fontWeight as string,
            textAlign: props.textAlign as 'left' | 'center' | 'right' | 'justify',
            color: props.color as string,
            paddingTop: style.paddingTop,
            paddingRight: style.paddingRight,
            paddingBottom: style.paddingBottom,
            paddingLeft: style.paddingLeft,
            marginTop: style.marginTop,
            marginRight: style.marginRight,
            marginBottom: style.marginBottom,
            marginLeft: style.marginLeft,
          }}
        >
          {(props.content as string) || 'Text content'}
        </p>
      )

    case 'Image':
      return (
        <img
          src={(props.src as string) || ''}
          alt={(props.alt as string) || ''}
          width={(props.width as string) || '100%'}
          height={(props.height as string) || 'auto'}
          style={{
            maxWidth: '100%',
            height: 'auto',
            paddingTop: style.paddingTop,
            paddingRight: style.paddingRight,
            paddingBottom: style.paddingBottom,
            paddingLeft: style.paddingLeft,
            marginTop: style.marginTop,
            marginRight: style.marginRight,
            marginBottom: style.marginBottom,
            marginLeft: style.marginLeft,
          }}
        />
      )

    case 'Button':
      return (
        <button
          style={{
            backgroundColor: props.bgColor as string,
            color: props.color as string,
            borderRadius: props.borderRadius as string,
            paddingTop: style.paddingTop ?? '0.5rem',
            paddingRight: style.paddingRight ?? '1rem',
            paddingBottom: style.paddingBottom ?? '0.5rem',
            paddingLeft: style.paddingLeft ?? '1rem',
            marginTop: style.marginTop,
            marginRight: style.marginRight,
            marginBottom: style.marginBottom,
            marginLeft: style.marginLeft,
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
          }}
        >
          {(props.text as string) || 'Button'}
        </button>
      )

    case 'Hero':
      return (
        <div
          style={{
            minHeight: '24rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: props.bgColor as string,
            paddingTop: style.paddingTop,
            paddingRight: style.paddingRight,
            paddingBottom: style.paddingBottom,
            paddingLeft: style.paddingLeft,
            marginTop: style.marginTop,
            marginRight: style.marginRight,
            marginBottom: style.marginBottom,
            marginLeft: style.marginLeft,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                fontSize: '2.25rem',
                fontWeight: 700,
                marginBottom: '1rem',
                color: props.textColor as string,
              }}
            >
              {(props.title as string) || 'Hero Title'}
            </h1>
            <p
              style={{
                fontSize: '1.125rem',
                color: props.textColor as string,
              }}
            >
              {(props.subtitle as string) || 'Hero Subtitle'}
            </p>
          </div>
          {renderChildren()}
        </div>
      )

    case 'Divider':
      return (
        <hr
          className="w-full border-t"
          style={{
            borderColor: props.borderColor as string,
            marginTop: style.marginTop || '1rem',
            marginBottom: style.marginBottom || '1rem',
          }}
        />
      )

    case 'Video':
      const videoSrc = props.src as string
      const isYouTube = videoSrc?.includes('youtube.com') || videoSrc?.includes('youtu.be')
      const isVimeo = videoSrc?.includes('vimeo.com')

      if (!videoSrc) {
        return (
          <div
            className="w-full aspect-video rounded-md flex items-center justify-center bg-brand-muted/20"
            style={{
              marginTop: style.marginTop,
              marginBottom: style.marginBottom,
            }}
          >
            <span className="text-brand-muted text-sm">Vídeo (URL não configurada)</span>
          </div>
        )
      }

      if (isYouTube || isVimeo) {
        const embedUrl = isYouTube
          ? videoSrc.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
          : videoSrc.replace('vimeo.com/', 'player.vimeo.com/video/')

        return (
          <div
            className="w-full aspect-video rounded-md overflow-hidden"
            style={{
              marginTop: style.marginTop,
              marginBottom: style.marginBottom,
            }}
          >
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )
      }

      return (
        <video
          src={videoSrc}
          className="w-full aspect-video rounded-md"
          controls
          style={{
            marginTop: style.marginTop,
            marginBottom: style.marginBottom,
          }}
        />
      )

    default:
      return (
        <div
          style={{
            padding: '1rem',
            border: '2px dashed #ccc',
            paddingTop: style.paddingTop,
            paddingRight: style.paddingRight,
            paddingBottom: style.paddingBottom,
            paddingLeft: style.paddingLeft,
            marginTop: style.marginTop,
            marginRight: style.marginRight,
            marginBottom: style.marginBottom,
            marginLeft: style.marginLeft,
          }}
        >
          <p style={{ fontSize: '0.875rem', color: '#666' }}>
            Tipo desconhecido: {node.type}
          </p>
          {renderChildren()}
        </div>
      )
  }
}
