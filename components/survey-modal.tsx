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
  const [answers, setAnswers] = useState<SubmitAnswer[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<Set<string>>(new Set())
  const [textAnswer, setTextAnswer] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

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
        } else {
          throw new Error("Неверный формат данных")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки опроса")
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [requestId])

  if (!isOpen) return null

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="max-w-md rounded-lg border-2 border-red-500 bg-white p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-red-600">Ошибка</h2>
          <p className="text-lg text-gray-700">{error}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg text-gray-700">Загрузка опросника...</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-lg text-gray-700">Нет доступных вопросов</p>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col">
        <div className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 px-8 py-8 text-center">
          <h1 className="text-4xl font-bold" style={{ color: "#F9D52C" }}>
            Спасибо за ваши ответы!
          </h1>
        </div>

        <div className="flex flex-1 items-center justify-center bg-white px-8">
          <div className="max-w-2xl text-center">
            <p className="mb-6 text-lg text-gray-700">
              Ваши ответы успешно отправлены. Мы благодарны за уделённое время и ценим ваше мнение.
            </p>
            <p className="text-base text-gray-600">Эта информация поможет нам улучшить качество обслуживания.</p>
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

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswers(new Set())
      } else {
        submitAnswers(updatedAnswers)
      }
    }, 500)
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

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setTextAnswer("")
    } else {
      submitAnswers(updatedAnswers)
    }
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

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswers(new Set())
    } else {
      submitAnswers(updatedAnswers)
    }
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
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-white">
      <div className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 px-8 py-8 text-white">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="mb-2 text-4xl font-bold" style={{ color: "#F9D52C" }}>
            Уважаемый пациент!
          </h1>
          <p className="leading-relaxed text-white/95" style={{ fontSize: "18px" }}>
            Пожалуйста, ответьте на {questions.length} вопросов и поделитесь своим отзывом о первом визите. Будем
            благодарны за ваши искренние и обдуманные ответы.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white px-4 py-8">
        <div className="w-full max-w-2xl rounded-2xl bg-white">
          <div className="mb-6 flex items-center gap-3">
            <div
              className="flex shrink-0 items-center justify-center rounded-[21px] px-6 py-3 text-base font-bold text-black"
              style={{ backgroundColor: "#F9D52C" }}
            >
              Шаг {currentQuestion + 1}
            </div>
            <h2 className="text-xl font-semibold text-foreground">{currentQ.name}</h2>
          </div>

          {isArbitraryQuestion ? (
            <div className="space-y-4">
              <textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Введите ваш ответ..."
                className="min-h-[120px] w-full rounded-xl border-2 border-border p-4 text-base focus:border-primary focus:outline-none"
              />
              <button
                onClick={handleTextSubmit}
                disabled={!textAnswer.trim()}
                className="w-full rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {currentQuestion < questions.length - 1 ? "Далее" : "Завершить"}
              </button>
            </div>
          ) : isMultipleQuestion ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {currentQ.content.map((answer) => (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswerSelect(answer.id)}
                    className={`flex w-full items-center gap-4 rounded-xl border-2 p-3 transition-all hover:border-primary hover:bg-primary/5 ${
                      selectedAnswers.has(answer.id) ? "border-primary bg-primary/10" : "border-border bg-white"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-all ${
                        selectedAnswers.has(answer.id) ? "border-primary bg-primary" : "border-border bg-white"
                      }`}
                    >
                      {selectedAnswers.has(answer.id) && <span className="text-sm font-bold text-white">✓</span>}
                    </div>

                    <span className="text-left text-base">{answer.name}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={handleMultipleAnswerSubmit}
                disabled={selectedAnswers.size === 0}
                className="w-full rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
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
                  className={`flex w-full items-center gap-4 rounded-xl border-2 p-3 transition-all hover:border-primary hover:bg-primary/5 ${
                    selectedAnswers.has(answer.id) ? "border-primary bg-primary/10" : "border-border bg-white"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      selectedAnswers.has(answer.id) ? "border-primary" : "border-border"
                    }`}
                  >
                    {selectedAnswers.has(answer.id) && <div className="h-4 w-4 rounded-full bg-primary" />}
                  </div>

                  <span className="text-left text-base">{answer.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-2">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-all ${
                  index < currentQuestion ? "bg-primary" : index === currentQuestion ? "bg-primary/50" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
