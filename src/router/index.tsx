import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/components/Layout/Layout'
import Home from '@/pages/Home'
import GameCatalog from '@/pages/GameCatalog'
import CampaignBuilder from '@/pages/CampaignBuilder'
import GamePreview from '@/pages/GamePreview'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'catalog', element: <GameCatalog /> },
      { path: 'builder', element: <CampaignBuilder /> },
    ],
  },
  {
    path: '/preview/:gameId',
    element: <GamePreview />,
  },
])
