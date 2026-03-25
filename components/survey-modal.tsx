"use client"

import { useState, useEffect } from "react"
import { API_TOKEN, API_BASE_URL } from "@/lib/constants"
import type { Survey, Question, SubmitAnswer } from "@/lib/types"

const ratings = [
  { value: 5, emoji: "/emojis/rating-5.png", stars: 5, label: "Отлично" },
  { value: 4, emoji: "/emojis/rating-4.png", stars: 4, label: "Хорошо" },
  { value: 3, emoji: "/emojis/rating-3.png", stars: 3, label: "Нормально" },
  { value: 2, emoji: "/emojis/rating-2.png", stars: 2, label: "Плохо" },
  { value: 1, emoji: "/emojis/rating-1.png", stars: 1, label: "Очень плохо" },
]

const QUESTION_TYPES = {
  ARBITRARY_ANSWER: 1,
  MULTIPLE_ANSWER: 2,
  ONE_OPTION: 3,
}

interface SurveyModalProps {
  requestId: string | null
}

export function SurveyModal({ requestId }: SurveyModalProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [surveyName, setSurveyName] = useState<string>("")
  const [surveyDescription, setSurveyDescription] = useState<string>("")
  const [answers, setAnswers] = useState<SubmitAnswer[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<Set<string>>(new Set())
  const [textAnswer, setTextAnswer] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (!requestId) {
      setError("Не передан requestId параметр")
      setLoading(false)
      return
    }

    const fetchQuestions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/GetQuest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: API_TOKEN,
            id: requestId,
          }),
        })

        if (!response.ok) {
          throw new Error("Ошибка загрузки опроса")
        }

        const data: Survey[] = await response.json()
        if (data && data[0] && data[0].content) {
          setQuestions(data[0].content)
          setSurveyName(data[0].name ?? "")
          setSurveyDescription(data[0].description ?? "")
        } else {
          throw new Error("Неверный формат данных")
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Ошибка загрузки опроса"
        const isFetchError = err instanceof TypeError && err.message === "Failed to fetch"
        setError(
          isFetchError
            ? "Failed to fetch\nОпросник либо уже был заполнен ранее, либо не существует."
            : message
        )
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [requestId])

  if (!isOpen) return null

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-2xl border-2 border-destructive/30 bg-card p-8 text-center shadow-lg">
          <h2 className="mb-4 font-serif text-2xl font-bold text-destructive">Ошибка</h2>
          <p className="whitespace-pre-line text-base leading-relaxed text-foreground/80">{error}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium text-foreground/70">Загрузка опросника...</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">Нет доступных вопросов</p>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div
          className="w-full px-8 py-12 text-left"
          style={{ background: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #38bdf8 100%)" }}
        >
          <h1
            className="text-4xl font-bold md:text-5xl"
            style={{ color: "#ffe033", fontFamily: "'Segoe UI', system-ui, sans-serif", fontWeight: 700 }}
          >
            Спасибо за ваши ответы!
          </h1>
        </div>

        <div className="flex flex-1 items-center justify-center px-8">
          <div className="max-w-2xl text-center">
            <p className="mb-6 text-lg leading-relaxed text-foreground/80">
              Ваши ответы успешно отправлены. Мы благодарны за уделённое время и ценим ваше мнение.
            </p>
            <p className="text-base text-muted-foreground">Эта информация поможет нам улучшить качество обслуживания.</p>
          </div>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const isArbitraryQuestion = currentQ.type === QUESTION_TYPES.ARBITRARY_ANSWER
  const isMultipleQuestion = currentQ.type === QUESTION_TYPES.MULTIPLE_ANSWER
  const isSingleQuestion = currentQ.type === QUESTION_TYPES.ONE_OPTION

  const handleAnswerSelect = async (answerId: string) => {
    if (isMultipleQuestion) {
      const newSelectedAnswers = new Set(selectedAnswers)
      if (newSelectedAnswers.has(answerId)) {
        newSelectedAnswers.delete(answerId)
      } else {
        newSelectedAnswers.add(answerId)
      }
      setSelectedAnswers(newSelectedAnswers)
      return
    }

    setSelectedAnswers(new Set([answerId]))

    const newAnswer: SubmitAnswer = {
      anketRequest: requestId!,
      questionId: currentQ.id,
      answerId: answerId,
      comment: "",
    }

    const updatedAnswers = [...answers, newAnswer]
    setAnswers(updatedAnswers)

    setIsTransitioning(true)
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswers(new Set())
        setIsTransitioning(false)
      } else {
        submitAnswers(updatedAnswers)
      }
    }, 300)
  }

  const handleTextSubmit = async () => {
    if (!textAnswer.trim()) return

    const newAnswer: SubmitAnswer = {
      anketRequest: requestId!,
      questionId: questions[currentQuestion].id,
      answerId: "",
      comment: textAnswer,
    }

    const updatedAnswers = [...answers, newAnswer]
    setAnswers(updatedAnswers)

    setIsTransitioning(true)
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setTextAnswer("")
        setIsTransitioning(false)
      } else {
        submitAnswers(updatedAnswers)
      }
    }, 300)
  }

  const handleMultipleAnswerSubmit = async () => {
    if (selectedAnswers.size === 0) return

    const newAnswers = Array.from(selectedAnswers).map((answerId) => ({
      anketRequest: requestId!,
      questionId: questions[currentQuestion].id,
      answerId: answerId,
      comment: "",
    }))

    const updatedAnswers = [...answers, ...newAnswers]
    setAnswers(updatedAnswers)

    setIsTransitioning(true)
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswers(new Set())
        setIsTransitioning(false)
      } else {
        submitAnswers(updatedAnswers)
      }
    }, 300)
  }

  const submitAnswers = async (answersToSubmit: SubmitAnswer[]) => {
    try {
      const response = await fetch(`${API_BASE_URL}/SetQuestAnswer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: API_TOKEN,
          answers: answersToSubmit,
        }),
      })

      if (!response.ok) {
        throw new Error("Ошибка отправки ответов")
      }

      setCompleted(true)
    } catch (err) {
      alert("Ошибка при отправке ответов. Пожалуйста, попробуйте снова.")
      console.error(err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background">
      <div
        className="w-full px-6 py-10 md:px-8 md:py-12"
        style={{ background: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #38bdf8 100%)" }}
      >
        <div className="mx-auto flex max-w-2xl flex-col items-start justify-center text-left">
          <h1
            className="mb-3 text-3xl font-bold md:text-4xl lg:text-5xl"
            style={{ color: "#ffe033", fontFamily: "'Segoe UI', system-ui, sans-serif", fontWeight: 700 }}
          >
            {surveyName || "Уважаемый пациент!"}
          </h1>
          <p className="text-base leading-relaxed text-white/90 md:text-lg">
            {surveyDescription || "Пожалуйста, ответьте на вопросы и поделитесь своим отзывом о визите. Будем благодарны за ваши искренние и обдуманные ответы."}
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8 md:px-6 md:py-12">
        <div className="w-full max-w-2xl">
          <div className={`mb-8 flex flex-col gap-4 sm:flex-row sm:items-center transition-all duration-300 ${isTransitioning ? "animate-slide-out-left" : "animate-slide-in-right"}`}>
            <div className="inline-flex w-fit shrink-0 items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold tracking-wide text-accent-foreground shadow-sm">
              Шаг {currentQuestion + 1} / {questions.length}
            </div>
            <h2 className="font-serif text-xl font-semibold leading-snug text-foreground md:text-2xl">{currentQ.name}</h2>
          </div>

          <div className={`transition-all duration-300 ${isTransitioning ? "animate-slide-out-left" : "animate-slide-in-right"}`}>
            {isArbitraryQuestion ? (
              <div className="space-y-5">
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Введите ваш ответ..."
                  className="min-h-[140px] w-full rounded-2xl border-2 border-border bg-card p-5 text-base leading-relaxed shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!textAnswer.trim()}
                  className="w-full rounded-2xl bg-primary px-6 py-4 text-base font-semibold tracking-wide text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                >
                  {currentQuestion < questions.length - 1 ? "Далее" : "Завершить"}
                </button>
              </div>
            ) : isMultipleQuestion ? (
              <div className="space-y-5">
                <div className="space-y-3">
                  {currentQ.content.map((answer) => (
                    <button
                      key={answer.id}
                      onClick={() => handleAnswerSelect(answer.id)}
                      className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 shadow-sm transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md ${
                        selectedAnswers.has(answer.id) ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                          selectedAnswers.has(answer.id) ? "border-primary bg-primary" : "border-muted-foreground/30 bg-card"
                        }`}
                      >
                        {selectedAnswers.has(answer.id) && <span className="text-sm font-bold text-primary-foreground">✓</span>}
                      </div>

                      <span className="text-left text-base leading-relaxed">{answer.name}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleMultipleAnswerSubmit}
                  disabled={selectedAnswers.size === 0}
                  className="w-full rounded-2xl bg-primary px-6 py-4 text-base font-semibold tracking-wide text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                >
                  {currentQuestion < questions.length - 1 ? "Далее" : "Завершить"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {currentQ.content.map((answer) => (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswerSelect(answer.id)}
                    className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 shadow-sm transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md ${
                      selectedAnswers.has(answer.id) ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card"
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        selectedAnswers.has(answer.id) ? "border-primary" : "border-muted-foreground/30"
                      }`}
                    >
                      {selectedAnswers.has(answer.id) && <div className="h-3.5 w-3.5 rounded-full bg-primary" />}
                    </div>

                    <span className="text-left text-base leading-relaxed">{answer.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-10 flex gap-1.5">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  index < currentQuestion ? "bg-primary" : index === currentQuestion ? "bg-primary/60" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
