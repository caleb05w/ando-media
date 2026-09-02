import type { Field } from '@base-ui/react/field'
import type {
  ComponentPropsWithoutRef,
  FocusEventHandler,
  ReactNode,
  Ref,
  RefObject,
} from 'react'

/**
 * When the field runs its validation. Mirrors Base UI's `validationMode`.
 * `onChange` lights the green/red border as the user types; `onBlur` waits
 * until focus leaves. @default 'onChange'
 */
export const TextFieldValidationMode = {
  Change: 'onChange',
  Blur: 'onBlur',
  Submit: 'onSubmit',
} as const

export type TextFieldValidationMode =
  (typeof TextFieldValidationMode)[keyof typeof TextFieldValidationMode]

/** Custom validator: return an error message (string/array) or `null` when valid. */
export type TextFieldValidate = Field.Root.Props['validate']

/** Imperative actions exposed via `actionsRef`; call `validate()` to validate now. */
export type TextFieldActions = Field.Root.Actions

type NativeInputProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  | 'aria-label'
  | 'aria-labelledby'
  | 'children'
  | 'className'
  | 'defaultValue'
  | 'disabled'
  | 'name'
  | 'onBlur'
  | 'onChange'
  | 'placeholder'
  | 'prefix'
  | 'ref'
  | 'required'
  | 'type'
  | 'value'
>

export interface TextFieldProps extends NativeInputProps {
  /** Class names merged onto the input control. */
  className?: string
  /** React 19: `ref` is a plain prop (no `forwardRef`). Forwarded to the `<input>`. */
  ref?: Ref<HTMLInputElement>
  /** Placeholder shown when empty (text-tertiary). */
  placeholder?: string
  /** Static inline text shown before the editable value. */
  prefix?: ReactNode
  /** Form field name (used on submit). */
  name?: string
  /** Input type. @default 'text' */
  type?: string
  /** Controlled value. Pair with `onValueChange`. */
  value?: string
  /** Initial value for uncontrolled use. */
  defaultValue?: string
  /** Called with the new string value on every change. */
  onValueChange?: (value: string) => void
  /** Called when the control loses focus. */
  onBlur?: FocusEventHandler<HTMLInputElement>
  /** Disables interaction and dims the control. */
  disabled?: boolean
  /** Marks the field required (drives native validity). */
  required?: boolean
  /**
   * Custom validator. When it passes (and the value is dirty) the border turns
   * green; when it fails the border turns red and `errorMessage` shows. Omit it
   * to keep the default border even with a value (e.g. a name field).
   */
  validate?: TextFieldValidate
  /** When validation runs. @default 'onChange' */
  validationMode?: TextFieldValidationMode
  /** Debounce (ms) for `onChange` validation. */
  validationDebounceTime?: number
  /**
   * Ref to imperative field actions. Call `actionsRef.current.validate()` to run
   * validation on demand (e.g. when submitting an external form).
   */
  actionsRef?: RefObject<TextFieldActions | null>
  /**
   * Message rendered (centered, red) below the field when invalid. Ignored when
   * the field is valid. If omitted, Base UI's validator message is shown instead.
   */
  errorMessage?: ReactNode
  /**
   * Whether the invalid visuals (danger border + error message) may render.
   * Validation still runs either way - the success border and `aria-invalid`
   * stay live - so a consumer can defer the scolding until a submit attempt
   * and clear it again while the user types.
   * @default true
   */
  showError?: boolean
  /**
   * Whether valid filled fields may render the success border. Keep this off
   * for inputs that should validate quietly until a separate submit action.
   * @default true
   */
  showSuccess?: boolean
  /**
   * Whether the error message element renders below the control. Turn off
   * when the message is surfaced elsewhere (e.g. a toast) while keeping the
   * danger border from `showError`.
   * @default true
   */
  showErrorMessage?: boolean
  /**
   * Accessible label. Rendered visually-hidden so the control is named without
   * adding chrome (the design's question heading lives at the app level).
   * Provide this or `aria-label`.
   */
  label?: ReactNode
  /** Accessible name when there's no visible/`label` text. */
  'aria-label'?: string
  /** References an external label element. */
  'aria-labelledby'?: string
}
