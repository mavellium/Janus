'use client'

import { useState, useCallback } from 'react'
import { EditorNode } from '@/hooks/use-builder'
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react'

interface VideoPlayerProps {
  node: EditorNode
  onUpdate: (props: Record<string, unknown>) => void
}

export function VideoPlayer({ node, onUpdate }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(node.props.muted || false)

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying)
    onUpdate({ autoplay: !isPlaying })
  }, [isPlaying, onUpdate])

  const handleMuteToggle = useCallback(() => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    onUpdate({ muted: newMuted })
  }, [isMuted, onUpdate])

  const handleLoopToggle = useCallback(() => {
    onUpdate({ loop: !node.props.loop })
  }, [node.props.loop, onUpdate])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#161718' }}>
          URL do Vídeo
        </label>
        <input
          type="text"
          value={(node.props.src as string) || ''}
          onChange={(e) => onUpdate({ src: e.target.value })}
          placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
          className="w-full px-3 py-2 border border-brand-muted/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: '#161718' }}>
            Autoplay
          </span>
          <button
            onClick={handlePlayPause}
            className={`p-2 rounded-lg transition-colors ${
              node.props.autoplay
                ? 'bg-blue-500 text-white'
                : 'bg-brand-muted/10 hover:bg-brand-muted/20'
            }`}
          >
            {node.props.autoplay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: '#161718' }}>
            Mudo
          </span>
          <button
            onClick={handleMuteToggle}
            className={`p-2 rounded-lg transition-colors ${
              isMuted
                ? 'bg-blue-500 text-white'
                : 'bg-brand-muted/10 hover:bg-brand-muted/20'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: '#161718' }}>
            Loop
          </span>
          <button
            onClick={handleLoopToggle}
            className={`p-2 rounded-lg transition-colors ${
              node.props.loop
                ? 'bg-blue-500 text-white'
                : 'bg-brand-muted/10 hover:bg-brand-muted/20'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#161718' }}>
          Largura
        </label>
        <input
          type="text"
          value={(node.props.width as string) || '100%'}
          onChange={(e) => onUpdate({ width: e.target.value })}
          placeholder="100%, 800px, etc."
          className="w-full px-3 py-2 border border-brand-muted/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#161718' }}>
          Altura
        </label>
        <input
          type="text"
          value={(node.props.height as string) || 'auto'}
          onChange={(e) => onUpdate({ height: e.target.value })}
          placeholder="auto, 450px, etc."
          className="w-full px-3 py-2 border border-brand-muted/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>
    </div>
  )
}
