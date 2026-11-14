import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/route/appRoutes';

import Fallback from './components/fallback/Fallback';

import './App.css';

function App() {


  return (

    <Suspense fallback={<Fallback />}>
      <RouterProvider router={router} />
    </Suspense>

  );
}

export default App;
