// Ambient declarations for bundler asset imports; the figma barrel normalizes
// them to URL strings (Vite returns a string, Next/Turbopack StaticImageData).
declare module '*.webp' {
  const src: string
  export default src
}
declare module '*.jpg' {
  const src: string
  export default src
}
declare module '*.png' {
  const src: string
  export default src
}
declare module '*.svg' {
  const src: string
  export default src
}
