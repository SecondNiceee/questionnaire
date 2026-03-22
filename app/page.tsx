"use client"

import { SurveyModal } from "@/components/survey-modal"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function SurveyContent() {
  const searchParams = useSearchParams()
  const requestId = searchParams.get("requestId")

  return (
    <main className="min-h-screen bg-background">
      <SurveyModal requestId={requestId} />
    </main>
  )
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-lg text-gray-700">Загрузка...</p>
          </div>
        </div>
      }
    >
      <SurveyContent />
    </Suspense>
  )
}
