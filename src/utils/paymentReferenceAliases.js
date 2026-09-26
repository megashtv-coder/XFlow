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
  { canonical: 'Enndy',  variants: ['shpendi', 'shpend', 'enndy', 'xpmx', 'shpend berisha'] },
  { canonical: 'Vala',   variants: ['vala', 'valmire', 'valmire gashi berisha'] },
  { canonical: 'Vila',   variants: ['vila', 'elvira', 'elvire', 'elvira berisha'] },
  { canonical: 'Belti',  variants: ['belti', 'albert', 'albert ademi'] },
  { canonical: 'Piti',   variants: ['petrit', 'piti', 'petrit ademi'] },
  { canonical: 'Shefka', variants: ['mami', 'shefka', 'shefkije', 'shefkije berisha'] },
  { canonical: 'Xhebra', variants: ['xhemajl', 'xhema', 'xhebra', 'xhemajl berisha'] },
  { canonical: 'Lea',    variants: ['lea', 'lejla', 'lela', 'lejla berisha'] },
  { canonical: 'Erz',    variants: ['erze', 'erz', 'erze sahiti'] },
  { canonical: 'Nare',   variants: ['nare', 'krenare', 'krenare berisha hashani'] },
  { canonical: 'Nehi',   variants: ['nehi', 'nehat', 'nehati', 'nehat hashani'] },
  { canonical: 'Viska',  variants: ['visare', 'visare haxhijaj'] },
  { canonical: 'Xhan',   variants: ['xhani', 'xhejlane', 'xhejlane berisha preniqi'] },
  { canonical: 'Giga',   variants: ['faruk', 'faruku', 'faruk preniqi'] },
  { canonical: 'Samki',  variants: ['samki', 'samiri', 'wise s', 'samir qerkezi'] },
  { canonical: 'Premta', variants: ['premtim', 'premtimi', 'premtim kastrati'] },
  { canonical: 'Titi',   variants: ['astrit', 'astirit', 'titi', 'astriti', 'astrit ymeri'] },
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
