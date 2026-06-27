const COLOR_MAP: Record<string, string> = {
  'honey blonde':  '#C8924A',
  'natural black': '#1A1A1A',
  'burgundy':      '#6B1A2E',
  'dark brown':    '#3B1F10',
  'auburn':        '#8B3A1A',
  'jet black':     '#0D0D0D',
  'chocolate':     '#5C3317',
  'copper':        '#B87333',
  'copper red':    '#B87333',
  'ombre grey':    '#7A7A8C',
  'strawberry':    '#E8635A',
  'navy':          '#1A2B5E',
}

export function colorHex(c: string): string {
  return COLOR_MAP[c.toLowerCase().trim()] ?? '#6E1B3A'
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

export function cedi(n: number): string {
  return `GH₵${n.toLocaleString()}`
}
