import type { Field } from '@base-ui/react/field'
import type { ReactNode, Ref, TextareaHTMLAttributes } from 'react'

/**
 * TextArea props. Wraps Base UI `Field.Root` + a `Field.Control` rendered as a
 * native `<textarea>`. Native textarea attributes (`placeholder`, `rows`,
 * `maxLength`, `disabled`, `required`, `value`/`defaultValue`, etc.) pass
 * through to the control.
 */
export type TextAreaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'children'
> & {
  /** React 19: `ref` is a plain prop (no `forwardRef`). Targets the `<textarea>`. */
  ref?: Ref<HTMLTextAreaElement>
  /**
   * Accessible label. No visible label exists in the design (the question
   * heading is app-level), so this is rendered as a visually-hidden
   * `Field.Label`. Provide this or `aria-label`/`aria-labelledby`.
   */
  label?: ReactNode
  /**
   * Custom validation. Receives the field value; return an error string (or
   * array) when invalid, `null` when valid. Drives the `data-valid` /
   * `data-invalid` border states. @see Base UI Field.Root `validate`.
   */
  validate?: Field.Root.Props['validate']
  /** When validation runs. @default 'onChange' */
  validationMode?: Field.Root.Props['validationMode']
  /** Called with the new string value on every change. */
  onValueChange?: (value: string) => void
  /**
   * Message rendered (centered, red) below the field when invalid. Ignored when
   * the field is valid. If omitted, Base UI's validator message is shown instead.
   */
  errorMessage?: ReactNode
  /**
   * Optional control rendered inside the box, pinned bottom-right with a 24px
   * inset (the design uses a 40px dark `Button` with `IconArrowUp`). When set,
   * extra bottom padding is reserved so text never sits under it.
   */
  action?: ReactNode
  /** Class for the outer `Field.Root` wrapper. */
  className?: string
  /**
   * Class for the control box (the bordered `ScrollArea.Root`); use it to
   * resize the box (default `h-[190px]`, e.g. `h-[456px]` in the waitlist
   * dialog).
   */
  controlClassName?: string
}
