import type { CampaignConfig } from '../types'

export function generateConfig(config: CampaignConfig): string {
  const exportable = {
    game: config.gameId,
    title: config.title,
    description: config.description,
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    accentColor: config.accentColor,
    backgroundImage: config.backgroundImage,
    logo: config.logo,
    prizes: config.prizes.map(({ id: _id, ...rest }) => rest),
    gameSettings: config.gameSettings,
  }
  return JSON.stringify(exportable, null, 2)
}

export function generateEmbedSnippet(config: CampaignConfig, baseUrl = 'https://game-studio.app'): string {
  const configEncoded = btoa(generateConfig(config))
  return `<!-- Game Studio — ${config.title} -->
<script src="${baseUrl}/embed.js" defer></script>
<div
  id="game-studio-embed"
  data-game="${config.gameId}"
  data-config="${configEncoded}"
  style="width:100%;max-width:600px;margin:0 auto;"
></div>`
}
