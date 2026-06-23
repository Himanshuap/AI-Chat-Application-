import { useState } from 'react'
import './App.css'

const PERSONAS = {
  default: {
    label: '🤖 AI Assistant',
    prompt: 'You are a helpful AI assistant. Be concise and clear.'
  },
  tutor: {
    label: '👨‍💻 Coding Tutor',
    prompt: 'You are a coding tutor for beginners. Use simple language and short examples. Never use jargon without explaining it.'
  },
  interview: {
    label: '🎯 Interview Coach',
    prompt: 'You are an SDE-1 interview coach. Give structured answers. Focus on technical clarity.'
  },
  eli5: {
    label: '🧒 Explain Like I am 5',
    prompt: 'Explain everything like the person is 5 years old. Use very simple words and fun analogies.'
  }
}


function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [persona, setPersona] = useState('default')

  const handlePersonaChange = (e) => {
  setPersona(e.target.value)
  setMessages([])
}

const sendMessage = async () => {
  if (!input.trim()) return

  const userMessage = { role: 'user', content: input }
  const updatedMessages = [...messages, userMessage]

  setMessages(updatedMessages)
  setInput('')
  setLoading(true)

  // add an empty AI message — we'll fill it word by word
  const aiMessage = { role: 'assistant', content: '' }
  setMessages([...updatedMessages, aiMessage])

  const response = await fetch('http://localhost:5000/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: updatedMessages,
      systemPrompt: PERSONAS[persona].prompt
    })
  })

  // read the response as a stream
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullReply = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    // decode the chunk into text
    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const word = line.replace('data: ', '')

        if (word === '[DONE]') {
          setLoading(false)
          break
        }

        fullReply += word

        // update the last message in the array with the growing reply
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: fullReply
          }
          return updated
        })
      }
    }
  }
}

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage()
  }

  return (
    <div className="chat-container">

      <div className="chat-header">
  <span>🤖 AI Chat App</span>
  <select value={persona} onChange={handlePersonaChange}>
    {Object.entries(PERSONAS).map(([key, val]) => (
      <option key={key} value={key}>
        {val.label}
      </option>
    ))}
  </select>
</div>

      <div className="messages-area">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="typing">AI is thinking...</div>
        )}
      </div>

      <div className="input-area">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>

    </div>
  )
}

export default App