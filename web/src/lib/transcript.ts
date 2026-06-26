// Helpers to turn an uploaded transcript file into clean text for the AI.
// Supports plain text (.txt/.md) and subtitle formats (.vtt/.srt), which are
// stripped of cue numbers and timestamps. Binary formats (.pdf/.docx) are not
// supported yet — detected and rejected with a friendly message.

export const ACCEPTED_TRANSCRIPT_EXTS = ['.txt', '.md', '.vtt', '.srt', '.text']
export const MAX_TRANSCRIPT_BYTES = 2 * 1024 * 1024 // 2 MB

const TIMESTAMP_LINE = /^\s*(\d{1,2}:)?\d{1,2}:\d{2}([.,]\d{1,3})?\s*-->/
const SEQ_LINE = /^\s*\d+\s*$/

/** True if the buffer looks like binary (many NUL/control bytes). */
function looksBinary(text: string): boolean {
  let suspicious = 0
  const sample = text.slice(0, 2000)
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i)
    if (code === 0) return true
    if (code < 9 || (code > 13 && code < 32)) suspicious++
  }
  return suspicious > sample.length * 0.1
}

/** Strip VTT/SRT cue numbers, timestamps and headers, keeping spoken lines. */
function cleanSubtitles(raw: string): string {
  return raw
    .split(/\r?\n/)
    .filter((line) => {
      const l = line.trim()
      if (!l) return false
      if (l === 'WEBVTT') return false
      if (l.startsWith('NOTE')) return false
      if (TIMESTAMP_LINE.test(l)) return false
      if (SEQ_LINE.test(l)) return false
      return true
    })
    .join('\n')
    .trim()
}

export interface ParsedTranscript {
  ok: boolean
  text: string
  error?: string
}

/** Parse a transcript file's raw text given its filename. */
export function parseTranscriptText(filename: string, raw: string): ParsedTranscript {
  if (looksBinary(raw)) {
    return {
      ok: false,
      text: '',
      error:
        'Arquivo parece binário (PDF/DOCX/áudio não são suportados no MVP). Envie .txt, .md, .vtt ou .srt — ou cole o texto.',
    }
  }
  const lower = filename.toLowerCase()
  const isSub = lower.endsWith('.vtt') || lower.endsWith('.srt')
  const text = (isSub ? cleanSubtitles(raw) : raw).trim()
  if (text.length < 1) {
    return { ok: false, text: '', error: 'Arquivo de transcrição vazio.' }
  }
  return { ok: true, text }
}
