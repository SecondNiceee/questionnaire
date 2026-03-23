"use client"

import { useState } from "react"

const TEST_QUESTIONS = [
  {
    id: "q1",
    name: "Как вы оцениваете качество обслуживания?",
    type: 3,
    content: [
      { id: "q1a1", name: "Отлично" },
      { id: "q1a2", name: "Хорошо" },
      { id: "q1a3", name: "Удовлетворительно" },
      { id: "q1a4", name: "Плохо" },
    ],
  },
  {
    id: "q2",
    name: "Что вам понравилось больше всего? (можно выбрать несколько)",
    type: 2,
    content: [
      { id: "q2a1", name: "Вежливость персонала" },
      { id: "q2a2", name: "Скорость обслуживания" },
      { id: "q2a3", name: "Чистота помещения" },
      { id: "q2a4", name: "Профессионализм врача" },
    ],
  },
  {
    id: "q3",
    name: "Порекомендуете ли вы нас своим знакомым?",
    type: 3,
    content: [
      { id: "q3a1", name: "Да, обязательно" },
      { id: "q3a2", name: "Скорее да" },
      { id: "q3a3", name: "Скорее нет" },
      { id: "q3a4", name: "Нет" },
    ],
  },
  {
    id: "q4",
    name: "Оставьте любые пожелания или комментарии:",
    type: 1,
    content: [],
  },
]

const QUESTION_TYPES = {
  ARBITRARY_ANSWER: 1,
  MULTIPLE_ANSWER: 2,
  ONE_OPTION: 3,
}

export default function TestPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Set<string>>(new Set())
  const [textAnswer, setTextAnswer] = useState("")
  const [completed, setCompleted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left")

  const questions = TEST_QUESTIONS
  const currentQ = questions[currentQuestion]
  const isArbitrary = currentQ.type === QUESTION_TYPES.ARBITRARY_ANSWER
  const isMultiple = currentQ.type === QUESTION_TYPES.MULTIPLE_ANSWER

  const goNext = () => {
    if (currentQuestion < questions.length - 1) {
      setSlideDirection("left")
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentQuestion((prev) => prev + 1)
        setSelectedAnswers(new Set())
        setTextAnswer("")
        setSlideDirection("right")
        setTimeout(() => {
          setIsAnimating(false)
        }, 50)
      }, 200)
    } else {
      setCompleted(true)
    }
  }

  const handleSingleSelect = (id: string) => {
    setSelectedAnswers(new Set([id]))
    setTimeout(goNext, 400)
  }

  const handleMultipleToggle = (id: string) => {
    const next = new Set(selectedAnswers)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelectedAnswers(next)
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
              Это тестовая страница. Ответы никуда не отправляются.
            </p>
            <button
              onClick={() => {
                setCurrentQuestion(0)
                setSelectedAnswers(new Set())
                setTextAnswer("")
                setCompleted(false)
              }}
              className="rounded-2xl bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-md hover:bg-primary/90"
            >
              Пройти заново
            </button>
          </div>
        </div>
      </div>
    )
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
            Уважаемый пациент!
          </h1>
          <p className="text-base leading-relaxed text-white/90 md:text-lg">
            Это тестовая форма с рандомными вопросами. Ответы никуда не отправляются.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8 md:px-6 md:py-12">
        <div
          className={`w-full max-w-2xl transition-all duration-200 ease-out ${
            isAnimating
              ? slideDirection === "left"
                ? "translate-x-[-30px] opacity-0"
                : "translate-x-[30px] opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="inline-flex w-fit shrink-0 items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold tracking-wide text-accent-foreground shadow-sm">
              Шаг {currentQuestion + 1} / {questions.length}
            </div>
            <h2 className="text-xl font-semibold leading-snug text-foreground md:text-2xl">{currentQ.name}</h2>
          </div>

          {isArbitrary ? (
            <div className="space-y-5">
              <textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Введите ваш ответ..."
                className="min-h-[140px] w-full rounded-2xl border-2 border-border bg-card p-5 text-base leading-relaxed shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
              />
              <button
                onClick={goNext}
                disabled={!textAnswer.trim()}
                className="w-full rounded-2xl bg-primary px-6 py-4 text-base font-semibold tracking-wide text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {currentQuestion < questions.length - 1 ? "Далее" : "Завершить"}
              </button>
            </div>
          ) : isMultiple ? (
            <div className="space-y-5">
              <div className="space-y-3">
                {currentQ.content.map((answer) => (
                  <button
                    key={answer.id}
                    onClick={() => handleMultipleToggle(answer.id)}
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
                onClick={goNext}
                disabled={selectedAnswers.size === 0}
                className="w-full rounded-2xl bg-primary px-6 py-4 text-base font-semibold tracking-wide text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {currentQuestion < questions.length - 1 ? "Далее" : "Завершить"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {currentQ.content.map((answer) => (
                <button
                  key={answer.id}
                  onClick={() => handleSingleSelect(answer.id)}
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
