export interface FriendChannel {
  label: string
  unread?: boolean
}

export interface FriendAgent {
  activity: number
  name: string
  role: string
}

export interface FriendOfAndoProfile {
  agents: FriendAgent[]
  channels: FriendChannel[]
  displayName: string
  handle: string
  referralCode: string
}

const FRIENDS_OF_ANDO = {
  sara: {
    agents: [
      { activity: 100, name: 'Tadao', role: 'Team coordination' },
      { activity: 78, name: 'Codex', role: 'Product and engineering' },
      { activity: 61, name: 'Claude', role: 'Research and writing' },
      { activity: 38, name: 'Devin', role: 'Project follow-through' },
    ],
    channels: [
      { label: 'announcements' },
      { label: 'product', unread: true },
      { label: 'customer-feedback' },
      { label: 'design', unread: true },
      { label: 'random' },
    ],
    displayName: 'Sara',
    handle: 'sara',
    referralCode: 'sara',
  },
} satisfies Record<string, FriendOfAndoProfile>

export const friendOfAndoHandles = Object.keys(FRIENDS_OF_ANDO)

export function getFriendOfAndoProfile(
  rawHandle: string,
): FriendOfAndoProfile | null {
  let decodedHandle = rawHandle

  try {
    decodedHandle = decodeURIComponent(rawHandle)
  } catch {
    return null
  }

  if (!decodedHandle.startsWith('@')) {
    return null
  }

  const handle = decodedHandle.slice(1).toLowerCase()
  return FRIENDS_OF_ANDO[handle as keyof typeof FRIENDS_OF_ANDO] ?? null
}
