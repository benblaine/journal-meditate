import { Configuration, OpenAIApi } from 'openai-edge'
import { OpenAIStream, StreamingTextResponse } from 'ai'

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

export const runtime = 'edge'

export async function POST(req: Request) {
  const { prompt } = await req.json()

  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'You are a mindfulness expert. Generate a 6-sentence long guided meditation/reflection/visualization based on the user\'s journal entry. Take note that you cannot pause, so avoid asking the person to do anything that takes time while you are speaking, but once you are done speaking invite them to focus for the remainder of the 2 minutes session.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 200,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    n: 1,
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}