/**
 * The payment "reference" field (kush pranoi) gets typed inconsistently —
 * the same person spelled/nicknamed differently, or just different casing —
 * which fragments the Referencat Pagesave report into misleading duplicate
 * rows for what's really one person. This folds known variants (and pure
 * case differences) into a single canonical display name.
 *
 * XFlow only for now — AresTV gets its own separate alias list later.
 */
const ALIAS_GROUPS = [
  { canonical: 'Enndy',  variants: ['shpendi', 'shpend', 'enndy', 'xpmx'] },
  { canonical: 'Vala',   variants: ['vala', 'valmire'] },
  { canonical: 'Vila',   variants: ['vila', 'elvira', 'elvire'] },
  { canonical: 'Belti',  variants: ['belti', 'albert'] },
  { canonical: 'Piti',   variants: ['petrit', 'piti'] },
  { canonical: 'Shefka', variants: ['mami', 'shefka', 'shefkije'] },
  { canonical: 'Xhebra', variants: ['xhemajl', 'xhema', 'xhebra'] },
  { canonical: 'Lea',    variants: ['lea', 'lejla', 'lela'] },
  { canonical: 'Erz',    variants: ['erze', 'erz'] },
  { canonical: 'Nare',   variants: ['nare', 'krenare'] },
  { canonical: 'Nehi',   variants: ['nehi', 'nehat', 'nehati'] },
  { canonical: 'Viska',  variants: ['visare'] },
  { canonical: 'Xhan',   variants: ['xhani', 'xhejlane'] },
  { canonical: 'Giga',   variants: ['faruk', 'faruku'] },
  { canonical: 'Samki',  variants: ['samki', 'samiri', 'wise s'] },
  { canonical: 'Premta', variants: ['premtim', 'premtimi'] },
  { canonical: 'Titi',   variants: ['astrit', 'astirit', 'titi'] },
]

const ALIAS_LOOKUP = new Map()
ALIAS_GROUPS.forEach(({ canonical, variants }) => {
  variants.forEach(v => ALIAS_LOOKUP.set(v, canonical))
})

/**
 * @param {string} raw - the payment's reference field, exactly as typed
 * @returns {string} canonical display name — case/spelling-insensitive
 */
export function normalizeReferenceName(raw) {
  const trimmed = (raw || '').trim()
  if (!trimmed) return trimmed

  const key = trimmed.toLowerCase()
  if (ALIAS_LOOKUP.has(key)) return ALIAS_LOOKUP.get(key)

  // No known alias — still fold pure case differences ("enndy" vs "ENNDY")
  // into one row, using Title Case as the consistent display form.
  return trimmed.replace(/\S+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())
}
