import React from 'react'
import { Route, Routes } from 'react-router-dom'
const ChatComp = React.lazy(() => import('./pages').then(({ ChatComp }) => ({ default: ChatComp })))
const SignIn = React.lazy(() => import('./pages').then(({ SignIn }) => ({ default: SignIn })))
const SignUp = React.lazy(() => import('./pages').then(({ SignUp }) => ({ default: SignUp })))

import { Helmet } from 'react-helmet';

const App: React.FC = () => {
  return (
    <>
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
        />
        <link
          rel="stylesheet"
          href="main.css"
        />
      </Helmet>

      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/chat" element={<ChatComp />} />
      </Routes>
    </>
  );
};

export { App }
