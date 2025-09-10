import React from 'react'
import { motion } from 'framer-motion'
import LandingPage from './components/LandingPage'

function App() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
    >
      <LandingPage />
    </motion.div>
  )
}

export default App
