import JournalMeditation from '@/components/journal-meditation'

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Journal Meditation App</h1>
      <JournalMeditation />
    </main>
  )
}