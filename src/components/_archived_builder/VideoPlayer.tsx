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
        <label className="block text-xs font-medium mb-1.5 text-brand-text">
          URL do Vídeo
        </label>
        <input
          type="text"
          value={(node.props.src as string) || ''}
          onChange={(e) => onUpdate({ src: e.target.value })}
          placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
          className="w-full px-3 py-2 border border-brand-btn-light rounded-lg text-sm bg-brand-bg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-brand-text">
            Autoplay
          </span>
          <button
            onClick={handlePlayPause}
            className={`p-2 rounded-lg transition-colors ${
              node.props.autoplay
                ? 'bg-brand-primary text-white'
                : 'bg-brand-btn-light/40 text-brand-text hover:bg-brand-btn-light'
            }`}
          >
            {node.props.autoplay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-brand-text">
            Mudo
          </span>
          <button
            onClick={handleMuteToggle}
            className={`p-2 rounded-lg transition-colors ${
              isMuted
                ? 'bg-brand-primary text-white'
                : 'bg-brand-btn-light/40 text-brand-text hover:bg-brand-btn-light'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-brand-text">
            Loop
          </span>
          <button
            onClick={handleLoopToggle}
            className={`p-2 rounded-lg transition-colors ${
              node.props.loop
                ? 'bg-brand-primary text-white'
                : 'bg-brand-btn-light/40 text-brand-text hover:bg-brand-btn-light'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium mb-1.5 text-brand-text">
          Largura
        </label>
        <input
          type="text"
          value={(node.props.width as string) || '100%'}
          onChange={(e) => onUpdate({ width: e.target.value })}
          placeholder="100%, 800px, etc."
          className="w-full px-3 py-2 border border-brand-btn-light rounded-lg text-sm bg-brand-bg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium mb-1.5 text-brand-text">
          Altura
        </label>
        <input
          type="text"
          value={(node.props.height as string) || 'auto'}
          onChange={(e) => onUpdate({ height: e.target.value })}
          placeholder="auto, 450px, etc."
          className="w-full px-3 py-2 border border-brand-btn-light rounded-lg text-sm bg-brand-bg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
        />
      </div>
    </div>
  )
}
