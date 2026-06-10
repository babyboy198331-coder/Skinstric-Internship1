import { Routes, Route } from 'react-router-dom'
import Landing      from './pages/Landing'
import Testing      from './pages/Testing'
import Upload       from './pages/Upload'
import Select       from './pages/Select'
import Demographics from './pages/Demographics'

export default function App() {
  return (
    <main style={{ display: 'contents' }}>
      <Routes>
        <Route path="/"            element={<Landing />} />
        <Route path="/testing"     element={<Testing />} />
        <Route path="/upload"      element={<Upload />} />
        <Route path="/select"      element={<Select />} />
        <Route path="/demographics" element={<Demographics />} />
      </Routes>
    </main>
  )
}
