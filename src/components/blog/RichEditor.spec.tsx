import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { RichEditor } from './RichEditor'

vi.mock('@/modules/upload/actions/uploadImage', () => ({
  uploadImage: vi.fn(async () => ({ ok: true, url: '' })),
}))

vi.mock('@/modules/blog/actions/uploadBlogMedia', () => ({
  uploadBlogMedia: vi.fn(async () => ({ ok: true, url: '' })),
}))

vi.mock('@/modules/blog/actions/listProjectMedia', () => ({
  listProjectMedia: vi.fn(async () => ({ ok: true, data: [] })),
}))

describe('RichEditor', () => {
  it('renders the toolbar and editor body (never returns null after mount)', async () => {
    render(<RichEditor value="<p>conteudo</p>" onChange={() => {}} />)

    await waitFor(() => {
      expect(screen.getByTitle('Negrito (Ctrl+B)')).toBeTruthy()
    })

    expect(screen.getByLabelText('Estilo do texto')).toBeTruthy()
    expect(screen.getByTitle('Cor da fonte')).toBeTruthy()
    expect(screen.getByTitle('Cor de fundo')).toBeTruthy()
    expect(document.querySelector('.ProseMirror')).toBeTruthy()
  })

  it('mounts every Fase 2 block extension and exposes their toolbar actions', async () => {
    render(<RichEditor value="<p>conteudo</p>" onChange={() => {}} />)

    await waitFor(() => {
      expect(screen.getByTitle('Checklist')).toBeTruthy()
    })

    fireEvent.click(screen.getByTitle('Inserir bloco'))

    expect(screen.getByText('Bloco de código')).toBeTruthy()
    expect(screen.getByText('Aviso (callout)')).toBeTruthy()
    expect(screen.getByText('Tabela')).toBeTruthy()
    expect(screen.getByText('Vídeo do YouTube')).toBeTruthy()
    expect(screen.getByText('Divisor')).toBeTruthy()
  })

  it('shows a link control in the toolbar', async () => {
    render(<RichEditor value="<p>conteudo</p>" onChange={() => {}} />)

    await waitFor(() => {
      expect(screen.getAllByTitle('Inserir link').length).toBeGreaterThan(0)
    })
  })
})
