// Slim stand-in for the landing repo's profile-panel roster — the
// announcement only needs a handle for the mono line; any name
// works, prop-driven faces included.
export function profileFor(person: string): { name: string; handle: string } {
  return { name: person, handle: person }
}
