export interface WaitlistAnswerSummary {
  agents: string[]
  agentUsage: string
  company: string
  companySize: string
  communicationTool: string
  linkedinUrl: string
  name: string
  referralSource: string
  role: string
  teammatesCount: string
  useCase: string
}

export interface WaitlistTeamMember {
  id: string
  initials: string
  name: string
}

export type WaitlistOnboardingState =
  | 'completed'
  | 'eligible'
  | 'locked'
  | 'scheduled'

export interface WaitlistOnboardingData {
  bookedAt: string | null
  state: WaitlistOnboardingState
}

export interface WaitlistInviteDetail {
  email: string
  kind: 'external' | 'team'
  status: 'accepted' | 'pending'
}

export interface WaitlistStatusData {
  answers: WaitlistAnswerSummary
  contactEmail: string
  externalInvitesAccepted: number
  externalInviteUrl: string
  invites: WaitlistInviteDetail[]
  invitesAccepted: number
  invitesPending: number
  joinedAt: string
  onboarding: WaitlistOnboardingData
  priorityPoints: number
  teamDomain: string | null
  teamInvitesAccepted: number
  teamMembers: WaitlistTeamMember[]
  teamSize: number
  teamVisible: boolean
  workEmail: string | null
}

export interface WaitlistOnboardingResponse {
  onboarding: WaitlistOnboardingData
}

export const WAITLIST_PREVIEW_CODE_STORAGE_KEY =
  'ando_waitlist_preview_code' as const

export interface WaitlistCodeResponse {
  previewCode?: string
}

export type WaitlistAccessResponse =
  | { email: string; state: 'signup' }
  | { previewCode?: string; state: 'joined' }

export type WaitlistVerificationResponse =
  | { email: string; state: 'signup' }
  | { state: 'joined' }

export interface WaitlistInviteResponse {
  inviteUrl: string
  kind: 'external' | 'team'
  previewDelivery?: boolean
}
