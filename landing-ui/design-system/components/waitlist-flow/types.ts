import type { ReactNode } from 'react'

/** Answers keyed by screen id; each question screen reads/writes its own key.
 * Most questions store a string; multi-choice questions store a string[]. */
export type WaitlistAnswers = Record<string, string | string[]>

export interface WaitlistProgress {
  answers: WaitlistAnswers
  step: number
  stepId: string
}

export interface WaitlistOpenOverride {
  answers?: WaitlistAnswers
  open?: boolean
  step?: number
}

export type WaitlistBeforeOpenResult = boolean | WaitlistOpenOverride

export interface WaitlistAdvance {
  answers: WaitlistAnswers
  fromStep: number
  fromStepId: string
  toStep: number
  toStepId: string
}

export interface WaitlistAdvanceResume {
  answers?: WaitlistAnswers
  step: number
}

export interface WaitlistAdvanceStop {
  advance: false
  close?: boolean
  showError?: boolean
}

export type WaitlistBeforeAdvanceResult =
  | boolean
  | WaitlistAdvanceResume
  | WaitlistAdvanceStop

interface WaitlistQuestionBase {
  /** Answer key, also the React key that remounts the body between screens. */
  id: string
  /** Question heading; a function when it embeds an earlier answer. */
  title: string | ((answers: WaitlistAnswers) => string)
}

/** Single-line question: 500px TextField + the 64x48 arrow submit. */
export interface WaitlistTextScreen extends WaitlistQuestionBase {
  kind: 'text'
  placeholder: string
  type?: string
  /** Static text shown inside the field before the typed value. */
  prefix?: string
  /** Blocks advancing (and drives the field's red/green border) when set. */
  validate?: (value: string) => string | null
  /** Live hint shown under the field. Returns `null` to hide it. */
  preview?: (value: string) => string | null
}

/** Pick-one question: Select pill + the 64x48 arrow submit. */
export interface WaitlistSelectScreen extends WaitlistQuestionBase {
  kind: 'select'
  options: readonly string[]
  /** Leading trigger icon keyed by selected value (the design shows Slack's). */
  valueIcons?: Record<string, ReactNode>
}

/** Pick-many question: MultiSelect pill + the 64x48 arrow submit. */
export interface WaitlistMultiSelectScreen extends WaitlistQuestionBase {
  kind: 'multiselect'
  options: readonly string[]
  /** Per-option leading icon in the popup, keyed by option value. */
  valueIcons?: Record<string, ReactNode>
}

/** Long-form question: the full-height TextArea. */
export interface WaitlistTextAreaScreen extends WaitlistQuestionBase {
  kind: 'textarea'
  placeholder: string
}

/** The "Woohoo!" confirmation and the closing "You're all set." screens. */
export interface WaitlistStaticScreen {
  kind: 'confirmation' | 'done'
  id: string
}

export type WaitlistScreen =
  | WaitlistTextScreen
  | WaitlistSelectScreen
  | WaitlistMultiSelectScreen
  | WaitlistTextAreaScreen
  | WaitlistStaticScreen
