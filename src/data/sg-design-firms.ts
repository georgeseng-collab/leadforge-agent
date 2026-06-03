// Singapore Interior Design Competitor Firms
// 65+ firms with Instagram and Facebook usernames

export interface DesignFirm {
  username: string
  displayName: string
  platform: 'instagram' | 'facebook'
}

export const SG_DESIGN_FIRMS: DesignFirm[] = [
  // === Top Interior Design Firms (Instagram) ===
  { username: 'wearezenith', displayName: 'Zenith Arc', platform: 'instagram' },
  { username: 'kellyhoppen', displayName: 'Kelly Hoppen SG', platform: 'instagram' },
  { username: 'renoprestige', displayName: 'Reno Prestige', platform: 'instagram' },
  { username: 'starhomely', displayName: 'Star Homely', platform: 'instagram' },
  { username: 'design4space', displayName: 'Design 4 Space', platform: 'instagram' },
  { username: 'swanbuild', displayName: 'Swan Build', platform: 'instagram' },
  { username: 'nineonewon', displayName: '9on1won Interior', platform: 'instagram' },
  { username: 'free_space_intent', displayName: 'Free Space Intent', platform: 'instagram' },
  { username: 'prodigydesign', displayName: 'Prodigy Design', platform: 'instagram' },
  { username: 'ciseern', displayName: 'Ciseern', platform: 'instagram' },
  { username: 'vidasmith', displayName: 'Vida Smith', platform: 'instagram' },
  { username: 'edenrenovation', displayName: 'Eden Renovation', platform: 'instagram' },
  { username: 'foretex', displayName: 'Foretex', platform: 'instagram' },
  { username: 'monoloft', displayName: 'Monoloft', platform: 'instagram' },
  { username: 'stackedhomes', displayName: 'Stacked Homes', platform: 'instagram' },
  { username: 'homerenoguru', displayName: 'Home Reno Guru', platform: 'instagram' },
  { username: 'qanvast', displayName: 'Qanvast', platform: 'instagram' },
  { username: 'renonation', displayName: 'RenoNation', platform: 'instagram' },
  { username: 'hdbrenovation', displayName: 'HDB Renovation SG', platform: 'instagram' },
  { username: 'idguru', displayName: 'ID Guru SG', platform: 'instagram' },
  { username: 'spacefactor', displayName: 'Space Factor', platform: 'instagram' },
  { username: 'liveinspace', displayName: 'Live In Space', platform: 'instagram' },
  { username: 'owenreka', displayName: 'Owen Reka', platform: 'instagram' },
  { username: 'moodfactory', displayName: 'Mood Factory', platform: 'instagram' },
  { username: 'skycreation', displayName: 'Sky Creation', platform: 'instagram' },
  { username: 'areanaography', displayName: 'Areana Ography', platform: 'instagram' },
  { username: 'three-d-conceptwerke', displayName: '3D Conceptwerke', platform: 'instagram' },
  { username: 'fuseconcepts', displayName: 'Fuse Concepts', platform: 'instagram' },
  { username: 'roofandspace', displayName: 'Roof & Space', platform: 'instagram' },
  { username: 'todaysinterior', displayName: "Today's Interior", platform: 'instagram' },
  { username: 'thecarpenterssg', displayName: 'The Carpenters SG', platform: 'instagram' },
  { username: 'blacksignature', displayName: 'Black Signature', platform: 'instagram' },
  { username: 'renocity', displayName: 'RenoCity', platform: 'instagram' },
  { username: 'luxenovo', displayName: 'Luxe Novo', platform: 'instagram' },
  { username: 'dawninterior', displayName: 'Dawn Interior', platform: 'instagram' },
  { username: 'sigmundsg', displayName: 'Sigmund SG', platform: 'instagram' },
  { username: 'hamptons.id', displayName: 'Hamptons Interior', platform: 'instagram' },
  { username: 'myra.interiordesign', displayName: 'Myra Interior Design', platform: 'instagram' },

  // === Top Interior Design Firms (Facebook) ===
  { username: 'zenitharc', displayName: 'Zenith Arc', platform: 'facebook' },
  { username: 'renoprestige', displayName: 'Reno Prestige', platform: 'facebook' },
  { username: 'starhomelysg', displayName: 'Star Homely SG', platform: 'facebook' },
  { username: 'design4space', displayName: 'Design 4 Space', platform: 'facebook' },
  { username: 'swanbuildsg', displayName: 'Swan Build SG', platform: 'facebook' },
  { username: 'freespaceintent', displayName: 'Free Space Intent', platform: 'facebook' },
  { username: 'prodigydesignsg', displayName: 'Prodigy Design SG', platform: 'facebook' },
  { username: 'ciseernsg', displayName: 'Ciseern SG', platform: 'facebook' },
  { username: 'edenrenovationsg', displayName: 'Eden Renovation SG', platform: 'facebook' },
  { username: 'foretexsg', displayName: 'Foretex SG', platform: 'facebook' },
  { username: 'monoloftsg', displayName: 'Monoloft SG', platform: 'facebook' },
  { username: 'stackedhomessg', displayName: 'Stacked Homes SG', platform: 'facebook' },
  { username: 'homerenoguru', displayName: 'Home Reno Guru', platform: 'facebook' },
  { username: 'qanvastsg', displayName: 'Qanvast SG', platform: 'facebook' },
  { username: 'renonationsg', displayName: 'RenoNation SG', platform: 'facebook' },
  { username: 'hdbrenovationsg', displayName: 'HDB Renovation SG', platform: 'facebook' },
  { username: 'idgurusg', displayName: 'ID Guru SG', platform: 'facebook' },
  { username: 'spacefactorsg', displayName: 'Space Factor SG', platform: 'facebook' },
  { username: 'liveinspacesg', displayName: 'Live In Space SG', platform: 'facebook' },
  { username: 'owenrekasg', displayName: 'Owen Reka SG', platform: 'facebook' },
  { username: 'moodfactorysg', displayName: 'Mood Factory SG', platform: 'facebook' },
  { username: 'skycreationsg', displayName: 'Sky Creation SG', platform: 'facebook' },
  { username: 'areanaographysg', displayName: 'Areana Ography SG', platform: 'facebook' },
  { username: '3dconceptwerke', displayName: '3D Conceptwerke', platform: 'facebook' },
  { username: 'fuseconceptssg', displayName: 'Fuse Concepts SG', platform: 'facebook' },
  { username: 'roofandspacesg', displayName: 'Roof & Space SG', platform: 'facebook' },
  { username: 'todaysinteriorsg', displayName: "Today's Interior SG", platform: 'facebook' },
  { username: 'thecarpenterssg', displayName: 'The Carpenters SG', platform: 'facebook' },
  { username: 'blacksignaturesg', displayName: 'Black Signature SG', platform: 'facebook' },
  { username: 'renocitysg', displayName: 'RenoCity SG', platform: 'facebook' },
  { username: 'luxenovosg', displayName: 'Luxe Novo SG', platform: 'facebook' },
  { username: 'dawninteriorsg', displayName: 'Dawn Interior SG', platform: 'facebook' },
  { username: 'sigmundsg', displayName: 'Sigmund SG', platform: 'facebook' },
  { username: 'hamptonsinteriorsg', displayName: 'Hamptons Interior SG', platform: 'facebook' },
  { username: 'myrainteriordesignsg', displayName: 'Myra Interior Design SG', platform: 'facebook' },
  { username: 'gspace.sg', displayName: 'G Space Interior', platform: 'facebook' },
]

// Get firms by platform
export function getFirmsByPlatform(platform: 'instagram' | 'facebook'): DesignFirm[] {
  return SG_DESIGN_FIRMS.filter(f => f.platform === platform)
}

// Get Instagram firms
export function getInstagramFirms(): DesignFirm[] {
  return getFirmsByPlatform('instagram')
}

// Get Facebook firms
export function getFacebookFirms(): DesignFirm[] {
  return getFirmsByPlatform('facebook')
}
