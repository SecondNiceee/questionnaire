export interface Question {
  id: string
  name: string
  type: number
  code: string
  required: boolean
  content: Answer[]
}

export interface Answer {
  id: string
  name: string
  type: number
  code: string
  required: boolean
  content: []
}

export interface Survey {
  id: string
  name: string
  type: number
  code: string
  required: boolean
  content: Question[]
}

export interface SubmitAnswer {
  anketRequest: string
  questionId: string
  answerId: string
  comment: string
}
