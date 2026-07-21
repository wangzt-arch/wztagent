import { ReadableStream } from 'stream/web'

function createTestStream(chunks) {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk))
      }
      controller.close()
    }
  })
}

async function parseSSE(stream) {
  const reader = stream.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let fullContent = ''
  let errors = []

  function processLine(line) {
    if (!line) return
    if (line.startsWith(':')) return // SSE comment, skip

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

    if (!dataStr || dataStr === '[DONE]') return

    try {
      const data = JSON.parse(dataStr)
      const content = data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content
      if (content) {
        fullContent += content
      }
    } catch (e) {
      errors.push({ msg: e.message, raw: dataStr.slice(0, 100) })
    }
  }

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

  return { fullContent, errors }
}

async function runTests() {
  console.log('=== Test 1: Standard SSE ===')
  const r1 = await parseSSE(createTestStream([
    'data: {"id":"1","choices":[{"delta":{"content":"Hi"}}]}\n\n',
    'data: [DONE]\n\n'
  ]))
  console.log('Result:', JSON.stringify(r1.fullContent), 'Errors:', r1.errors.length)

  console.log('\n=== Test 2: Double data: prefix ===')
  const r2 = await parseSSE(createTestStream([
    'data: data: {"id":"1","choices":[{"delta":{"content":"Hi"}}]}\n\n',
    'data: [DONE]\n\n'
  ]))
  console.log('Result:', JSON.stringify(r2.fullContent), 'Errors:', r2.errors.length)

  console.log('\n=== Test 3: Triple data: prefix ===')
  const r3 = await parseSSE(createTestStream([
    'data: data: data: {"id":"1","choices":[{"delta":{"content":"Hi"}}]}\n\n',
    'data: [DONE]\n\n'
  ]))
  console.log('Result:', JSON.stringify(r3.fullContent), 'Errors:', r3.errors.length)

  console.log('\n=== Test 4: Triple data: prefix (no spaces) ===')
  const r4 = await parseSSE(createTestStream([
    'data:data:data:{"id":"1","choices":[{"delta":{"content":"Hi"}}]}\n\n',
    'data:[DONE]\n\n'
  ]))
  console.log('Result:', JSON.stringify(r4.fullContent), 'Errors:', r4.errors.length)

  console.log('\n=== Test 5: Line split across chunks ===')
  const r5 = await parseSSE(createTestStream([
    'data: {"id":"1","choices":[{"delta":{"content":"H',
    'i"}}]}\n\n',
    'data: [DONE]\n\n'
  ]))
  console.log('Result:', JSON.stringify(r5.fullContent), 'Errors:', r5.errors.length)

  console.log('\n=== Test 6: CRLF endings ===')
  const r6 = await parseSSE(createTestStream([
    'data: {"id":"1","choices":[{"delta":{"content":"Hi"}}]}\r\n\r\n',
    'data: [DONE]\r\n\r\n'
  ]))
  console.log('Result:', JSON.stringify(r6.fullContent), 'Errors:', r6.errors.length)

  console.log('\n=== Test 7: Mixed valid and invalid lines ===')
  const r7 = await parseSSE(createTestStream([
    'data: {"id":"1","choices":[{"delta":{"content":"A"}}]}\n',
    ': ping\n',
    'event: message\n',
    'data: {"id":"1","choices":[{"delta":{"content":"B"}}]}\n\n',
    'data: [DONE]\n\n'
  ]))
  console.log('Result:', JSON.stringify(r7.fullContent), 'Errors:', r7.errors.length)

  console.log('\n=== Test 8: Pure JSON line containing "data:" inside content ===')
  const r8 = await parseSSE(createTestStream([
    '{"id":"1","choices":[{"delta":{"content":"The data: format is OK"}}]}\n\n'
  ]))
  console.log('Result:', JSON.stringify(r8.fullContent), 'Errors:', r8.errors.length)

  console.log('\n=== Test 9: SSE comment line (ping) ===')
  const r9 = await parseSSE(createTestStream([
    ': this is a ping\n',
    'data: {"id":"1","choices":[{"delta":{"content":"Hi"}}]}\n\n',
    'data: [DONE]\n\n'
  ]))
  console.log('Result:', JSON.stringify(r9.fullContent), 'Errors:', r9.errors.length)

  console.log('\n=== All tests passed ===')
}

runTests().catch(console.error)
