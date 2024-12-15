import React from 'react'
import { Route, Routes } from 'react-router-dom'
const ChatComp = React.lazy(() => import('./pages').then(({ ChatComp }) => ({ default: ChatComp })))
const SignIn = React.lazy(() => import('./pages').then(({ SignIn }) => ({ default: SignIn })))

const App: React.FC = () => {

	return (
		<Routes>
			<Route
				path="/"
				element={
					<SignIn />
				} />
			<Route
				path="/chat"
				element={
					<ChatComp />
				} />
		</Routes>
	)
}

export { App }
