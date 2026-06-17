import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/components/Layout/Layout'
import GameCatalog from '@/pages/GameCatalog'
import GamePreview from '@/pages/GamePreview'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <GameCatalog /> },
    ],
  },
  {
    path: '/preview/:gameId',
    element: <GamePreview />,
  },
])
