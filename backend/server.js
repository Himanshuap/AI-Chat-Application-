require('dotenv').config()  // must be in 1 line before everything

const express = require("express");
const cors = require('cors')
const Groq = require('groq-sdk')



const app = express();

const PORT = process.env.PORT || 5000


// middleware
app.use(cors())
app.use(express.json())

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY  // ← use this
})

// The main Route
app.post('/chat', async (req, res) => {
  const { messages, systemPrompt } = req.body

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ]

  // tell the frontend: "I'm going to send you a stream, not one response"
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  // ask Groq to stream the response
  const stream = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: fullMessages,
    stream: true                // ← this one word enables streaming
  })

  // as each chunk arrives, send it to the frontend immediately
  for await (const chunk of stream) {
    const word = chunk.choices[0]?.delta?.content || ''
    if (word) {
      res.write(`data: ${word}\n\n`)
    }
  }

  // tell frontend the stream is done
  res.write('data: [DONE]\n\n')
  res.end()
})

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' })
})


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})