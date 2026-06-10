// Run with: node --env-file=.env.local scripts/migrate-flag-colors.mjs
import { createClient } from '@supabase/supabase-js'

// ── Flag colour map (mirrors lib/flagColors.ts) ──────────────────────────────
const FLAG_COLORS = {
  'brazil': '#009C3B',          'brasil': '#009C3B',
  'argentina': '#74ACDF',
  'united states': '#B22234',   'estados unidos': '#B22234',
  'united states of america': '#B22234',
  'canada': '#FF0000',          'canadá': '#FF0000',
  'mexico': '#006847',          'méxico': '#006847',
  'colombia': '#FCD116',        'colômbia': '#FCD116',
  'peru': '#D91023',
  'chile': '#D52B1E',
  'venezuela': '#CF142B',
  'ecuador': '#FFD100',
  'bolivia': '#D52B1E',
  'paraguay': '#D52B1E',
  'uruguay': '#5EB6E4',
  'cuba': '#002A8F',
  'dominican republic': '#002D62', 'república dominicana': '#002D62',
  'haiti': '#00209F',
  'jamaica': '#000000',
  'trinidad and tobago': '#CE1126', 'trinidad e tobago': '#CE1126',
  'panama': '#DB121B',           'panamá': '#DB121B',
  'costa rica': '#002B7F',
  'guatemala': '#4997D0',
  'honduras': '#0073CF',
  'el salvador': '#0F47AF',
  'nicaragua': '#3A7728',
  'belize': '#003F87',
  'guyana': '#009E60',
  'suriname': '#377E3F',
  'barbados': '#00267F',
  'bahamas': '#00778B',
  'france': '#002395',           'frança': '#002395',
  'germany': '#FFCE00',          'alemanha': '#FFCE00',
  'spain': '#AA151B',            'espanha': '#AA151B',
  'italy': '#009246',            'itália': '#009246',
  'portugal': '#006600',
  'united kingdom': '#012169',   'reino unido': '#012169',
  'england': '#CF142B',
  'scotland': '#005EB8',         'escócia': '#005EB8',
  'wales': '#00AB39',            'país de gales': '#00AB39',
  'ireland': '#169B62',          'irlanda': '#169B62',
  'netherlands': '#AE1C28',      'países baixos': '#AE1C28',
  'holland': '#AE1C28',          'holanda': '#AE1C28',
  'belgium': '#FAE042',          'bélgica': '#FAE042',
  'switzerland': '#FF0000',      'suíça': '#FF0000',
  'austria': '#ED2939',          'áustria': '#ED2939',
  'sweden': '#006AA7',           'suécia': '#006AA7',
  'norway': '#EF2B2D',           'noruega': '#EF2B2D',
  'denmark': '#C60C30',          'dinamarca': '#C60C30',
  'finland': '#003580',          'finlândia': '#003580',
  'iceland': '#003897',          'islândia': '#003897',
  'poland': '#DC143C',           'polônia': '#DC143C',
  'czech republic': '#D7141A',   'república tcheca': '#D7141A', 'czechia': '#D7141A',
  'slovakia': '#0B4EA2',         'eslováquia': '#0B4EA2',
  'hungary': '#CE2939',          'hungria': '#CE2939',
  'romania': '#002B7F',          'romênia': '#002B7F',
  'bulgaria': '#00966E',
  'greece': '#0D5EAF',           'grécia': '#0D5EAF',
  'croatia': '#FF0000',          'croácia': '#FF0000',
  'serbia': '#C6363C',           'sérvia': '#C6363C',
  'slovenia': '#003DA5',         'eslovênia': '#003DA5',
  'bosnia and herzegovina': '#002395', 'bósnia e herzegovina': '#002395',
  'montenegro': '#D4AF37',
  'north macedonia': '#CE2028',  'macedônia do norte': '#CE2028',
  'albania': '#E41E20',          'albânia': '#E41E20',
  'kosovo': '#244AA5',
  'moldova': '#003DA5',
  'ukraine': '#005BBB',          'ucrânia': '#005BBB',
  'belarus': '#CF101A',          'bielorrússia': '#CF101A',
  'russia': '#D52B1E',           'rússia': '#D52B1E',
  'lithuania': '#FDB913',        'lituânia': '#FDB913',
  'latvia': '#9E3039',           'letônia': '#9E3039',
  'estonia': '#0072CE',          'estônia': '#0072CE',
  'luxembourg': '#EF3340',
  'malta': '#CF142B',
  'cyprus': '#4E7D2F',           'chipre': '#4E7D2F',
  'turkey': '#E30A17',           'turquia': '#E30A17',
  'israel': '#0038B8',
  'saudi arabia': '#006C35',     'arábia saudita': '#006C35',
  'iran': '#239F40',             'irã': '#239F40',
  'iraq': '#CE1126',
  'syria': '#CE1126',            'síria': '#CE1126',
  'jordan': '#007A3D',           'jordânia': '#007A3D',
  'lebanon': '#F10600',          'líbano': '#F10600',
  'united arab emirates': '#00732F', 'emirados árabes unidos': '#00732F',
  'qatar': '#8D1B3D',
  'kuwait': '#007A3D',
  'bahrain': '#CE1126',          'bahrein': '#CE1126',
  'oman': '#DB161B',             'omã': '#DB161B',
  'yemen': '#CE1126',            'iêmen': '#CE1126',
  'azerbaijan': '#0092BC',       'azerbaijão': '#0092BC',
  'armenia': '#D90012',          'armênia': '#D90012',
  'georgia': '#FF0000',          'geórgia': '#FF0000',
  'kazakhstan': '#00AFCA',       'cazaquistão': '#00AFCA',
  'uzbekistan': '#1EB53A',       'uzbequistão': '#1EB53A',
  'afghanistan': '#000000',      'afeganistão': '#000000',
  'japan': '#BC002D',            'japão': '#BC002D',
  'china': '#DE2910',
  'south korea': '#CD2E3A',      'coreia do sul': '#CD2E3A',
  'north korea': '#024FA2',      'coreia do norte': '#024FA2',
  'india': '#FF9933',            'índia': '#FF9933',
  'pakistan': '#01411C',         'paquistão': '#01411C',
  'bangladesh': '#006A4E',
  'sri lanka': '#8D153A',
  'nepal': '#003893',
  'myanmar': '#FECB00',
  'thailand': '#A51931',         'tailândia': '#A51931',
  'vietnam': '#DA251D',
  'cambodia': '#032EA1',         'camboja': '#032EA1',
  'laos': '#CE1126',
  'indonesia': '#CE1126',
  'malaysia': '#CC0001',         'malásia': '#CC0001',
  'singapore': '#EF3340',        'singapura': '#EF3340',
  'philippines': '#0038A8',      'filipinas': '#0038A8',
  'taiwan': '#FE0000',
  'mongolia': '#C4272F',         'mongólia': '#C4272F',
  'maldives': '#D21034',         'maldivas': '#D21034',
  'egypt': '#CE1126',            'egito': '#CE1126',
  'south africa': '#007A4D',     'áfrica do sul': '#007A4D',
  'nigeria': '#008751',
  'kenya': '#006600',
  'ethiopia': '#078930',         'etiópia': '#078930',
  'ghana': '#006B3F',
  'morocco': '#C1272D',          'marrocos': '#C1272D',
  'tunisia': '#E70013',          'tunísia': '#E70013',
  'algeria': '#006233',          'argélia': '#006233',
  'libya': '#239E46',            'líbia': '#239E46',
  'senegal': '#00853F',
  'ivory coast': '#F77F00',      'costa do marfim': '#F77F00',
  "côte d'ivoire": '#F77F00',
  'cameroon': '#007A5E',         'camarões': '#007A5E',
  'tanzania': '#1EB53A',         'tanzânia': '#1EB53A',
  'uganda': '#000000',
  'mozambique': '#009A44',       'moçambique': '#009A44',
  'angola': '#CC0000',
  'zambia': '#198A00',           'zâmbia': '#198A00',
  'zimbabwe': '#006400',
  'rwanda': '#20603D',
  'burundi': '#CE1126',
  'somalia': '#4189DD',          'somália': '#4189DD',
  'south sudan': '#078930',      'sudão do sul': '#078930',
  'sudan': '#D21034',
  'chad': '#002664',             'chade': '#002664',
  'niger': '#E05206',
  'mali': '#009A00',
  'burkina faso': '#EF2B2D',
  'guinea': '#CE1126',           'guiné': '#CE1126',
  'guinea-bissau': '#CE1126',    'guiné-bissau': '#CE1126',
  'sierra leone': '#1EB53A',
  'liberia': '#BF0A30',          'libéria': '#BF0A30',
  'togo': '#006A4E',
  'benin': '#008751',
  'gabon': '#009E60',            'gabão': '#009E60',
  'cape verde': '#003893',       'cabo verde': '#003893',
  'madagascar': '#FC3D32',
  'mauritius': '#EA2839',        'maurício': '#EA2839',
  'seychelles': '#003F87',
  'djibouti': '#6AB2E7',
  'eritrea': '#4189DD',          'eritreia': '#4189DD',
  'democratic republic of the congo': '#007FFF', 'república democrática do congo': '#007FFF',
  'republic of the congo': '#009543', 'república do congo': '#009543',
  'australia': '#00008B',        'austrália': '#00008B',
  'new zealand': '#00247D',      'nova zelândia': '#00247D',
  'papua new guinea': '#000000', 'papua nova guiné': '#000000',
  'fiji': '#68BFE5',
}

const DEFAULT_COLOR = '#C9485B'

function getFlagColor(country) {
  return FLAG_COLORS[country?.toLowerCase().trim()] ?? DEFAULT_COLOR
}

// ── Main ─────────────────────────────────────────────────────────────────────
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

const { data: pins, error: fetchError } = await supabase
  .from('pins')
  .select('id, country, color')

if (fetchError) {
  console.error('Failed to fetch pins:', fetchError.message)
  process.exit(1)
}

console.log(`Found ${pins.length} pin(s). Applying flag colours...\n`)

let updated = 0
let skipped = 0
const unmapped = new Set()

for (const pin of pins) {
  const newColor = getFlagColor(pin.country)

  if (newColor === pin.color) {
    skipped++
    continue
  }

  if (newColor === DEFAULT_COLOR && !FLAG_COLORS[pin.country?.toLowerCase().trim()]) {
    unmapped.add(pin.country)
  }

  const { error } = await supabase
    .from('pins')
    .update({ color: newColor })
    .eq('id', pin.id)

  if (error) {
    console.error(`  ✗ ${pin.id} (${pin.country}): ${error.message}`)
  } else {
    console.log(`  ✓ ${pin.country.padEnd(28)} ${pin.color} → ${newColor}`)
    updated++
  }
}

console.log(`\nDone. ${updated} updated, ${skipped} already correct.`)

if (unmapped.size > 0) {
  console.log(`\nCountries not in map (used default colour):`)
  for (const c of unmapped) console.log(`  - "${c}"`)
}
