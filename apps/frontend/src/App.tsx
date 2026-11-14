import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/route/appRoutes';

import Fallback from './components/fallback/Fallback';

import './App.css';
import { CourseCatalogProvider } from './hooks/CourseCatalogProvider.tsx';

function App() {


  return (

    <CourseCatalogProvider>
    <Suspense fallback={<Fallback />}>
      <RouterProvider router={router} />
    </Suspense>
    </CourseCatalogProvider>

  );
}

export default App;
