'use client'

import { useState, useRef, useEffect } from 'react'
import { useCompletion } from 'ai/react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Volume2, VolumeX, Loader2 } from 'lucide-react'

export default function JournalMeditation() {
  const [journalEntry, setJournalEntry] = useState('')
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(120) // 2 minutes in seconds
  const [isMuted, setIsMuted] = useState(false)
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false)
  const [status, setStatus] = useState('Idle')
  const backgroundAudioRef = useRef<HTMLAudioElement>(null)
  const voiceAudioRef = useRef<HTMLAudioElement>(null)

  const { complete, completion, isLoading } = useCompletion({
    api: '/api/generate-meditation',
  })

  const handleSubmit = async () => {
    if (journalEntry.trim()) {
      setStatus('Generating meditation text')
      await complete(journalEntry)
      setStatus('Meditation text generated')
    }
  }

  const generateVoice = async (text: string) => {
    setIsGeneratingVoice(true)
    setStatus('Generating voice audio')
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate voice')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      if (voiceAudioRef.current) {
        voiceAudioRef.current.src = audioUrl
      }
      setStatus('Voice audio ready')
    } catch (error) {
      console.error('Error generating voice:', error)
      setStatus(`Error: ${error.message || 'Failed to generate voice audio'}`)
    } finally {
      setIsGeneratingVoice(false)
    }
  }

  const startTimer = () => {
    setIsTimerRunning(true)
    setStatus('Meditation in progress')
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.play()
    }
    if (voiceAudioRef.current) {
      voiceAudioRef.current.play()
    }
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer)
          setIsTimerRunning(false)
          if (backgroundAudioRef.current) {
            backgroundAudioRef.current.pause()
            backgroundAudioRef.current.currentTime = 0
          }
          if (voiceAudioRef.current) {
            voiceAudioRef.current.pause()
            voiceAudioRef.current.currentTime = 0
          }
          setStatus('Meditation completed')
          return 0
        }
        return prevTime - 1
      })
    }, 1000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.muted = !isMuted
    }
    if (voiceAudioRef.current) {
      voiceAudioRef.current.muted = !isMuted
    }
    setStatus(isMuted ? 'Audio unmuted' : 'Audio muted')
  }

  useEffect(() => {
    if (completion && !isLoading) {
      generateVoice(completion)
    }
  }, [completion, isLoading])

  useEffect(() => {
    return () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause()
        backgroundAudioRef.current.currentTime = 0
      }
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause()
        voiceAudioRef.current.currentTime = 0
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-2xl mx-auto bg-secondary">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Status:</span>
            <span className="text-primary">{status}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Journal & Meditate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Write your journal entry here..."
            value={journalEntry}
            onChange={(e) => setJournalEntry(e.target.value)}
            rows={5}
            className="w-full"
          />
          <Button onClick={handleSubmit} disabled={isLoading || journalEntry.trim() === ''}>
            {isLoading ? 'Generating...' : 'Generate Meditation'}
          </Button>
          {completion && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <h3 className="font-semibold mb-2">Your Guided Meditation:</h3>
              <p className="whitespace-pre-wrap">{completion}</p>
              {isGeneratingVoice ? (
                <div className="flex items-center justify-center mt-4">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Generating voice...</span>
                </div>
              ) : !isTimerRunning && (
                <div className="flex items-center justify-between mt-4">
                  <Button onClick={startTimer} disabled={isGeneratingVoice}>
                    Start 2-Minute Session
                  </Button>
                  <Button onClick={toggleMute} variant="outline" size="icon" aria-label={isMuted ? "Unmute" : "Mute"}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              )}
              {isTimerRunning && (
                <div className="mt-4 text-center">
                  <p className="text-2xl font-bold">{formatTime(timeLeft)}</p>
                  <p>Take a deep breath and focus on the meditation.</p>
                  <Button onClick={toggleMute} variant="outline" size="icon" className="mt-2" aria-label={isMuted ? "Unmute" : "Mute"}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          )}
          <audio
            ref={backgroundAudioRef}
            src="/background.mp3"
            loop
            muted={isMuted}
          />
          <audio
            ref={voiceAudioRef}
            muted={isMuted}
          />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Journal your thoughts and receive a personalized meditation.
        </CardFooter>
      </Card>
    </div>
  )
}