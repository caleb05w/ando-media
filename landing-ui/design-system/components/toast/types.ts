/** A single toast occurrence. */
export interface ToastState {
  /**
   * AnimatePresence key. Stable while a pill is visible so rapid resubmits
   * update in place; a fresh toast (after the pill clears) mints a new id to
   * replay the entrance. Managed for you by `useToast`.
   */
  id: number
  message: string
}
