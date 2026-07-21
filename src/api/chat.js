import { request } from './client.js'

export async function chat(body, onChunk, onRetry) {
  const res = await request('/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: body.model || 'agnes-2.0-flash',
      messages: body.messages,
      stream: body.stream !== false,
      temperature: body.temperature,
      max_tokens: body.max_tokens
    })
  }, { onRetry })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `HTTP ${res.status}`)
  }

  if (body.stream === false) {
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || ''
    if (onChunk) onChunk(content, content)
    return content
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let fullContent = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      if (buffer.trim()) processLine(buffer.trim())
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const rawLine of lines) {
      processLine(rawLine.trim())
    }
  }

  return fullContent

  function processLine(line) {
    if (!line) return
    if (line.startsWith(':')) return

    let dataStr = null

    if (line.startsWith('data:')) {
      let after = line.slice(5)
      if (after.startsWith(' ')) after = after.slice(1)
      if (after.startsWith('data:')) {
        processLine(after)
        return
      }
      dataStr = after
    } else if (line.startsWith('{') || line.startsWith('[')) {
      dataStr = line
    }

    if (!dataStr) return
    if (dataStr === '[DONE]') return

    try {
      const data = JSON.parse(dataStr)
      if (!data.choices || data.choices.length === 0) return

      const choice = data.choices[0]
      if (choice.delta) {
        if (choice.delta.content) {
          fullContent += choice.delta.content
          if (onChunk) onChunk(choice.delta.content, fullContent)
        }
      } else if (choice.message && choice.message.content) {
        fullContent += choice.message.content
        if (onChunk) onChunk(choice.message.content, fullContent)
      }
    } catch (e) {
      console.warn('SSE parse error:', e.message, '| line:', line.slice(0, 200))
    }
  }
}