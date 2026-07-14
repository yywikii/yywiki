
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { LayoutDashboard, Database, Music as MusicIcon } from 'lucide-react'

import icon from './assets/icon.png'
import Contents from './Contents'
import Music from './Music'
import './App.css'

import Dashboard from './Dashboard'

function App() {
  return (
    <BrowserRouter>
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-6 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-4 min-w-0">
          <img src={icon} className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover shadow-sm bg-white p-0 border border-slate-100 shrink-0" alt="profile" />
          <div className="min-w-0">
            <h1 className="!mt-0 !mb-1 text-xl md:text-3xl font-bold tracking-tight text-slate-800 truncate">Archive Dashboard</h1>
            <p className="text-slate-500 text-xs md:text-base truncate">ㄴr으l 인생 ㅎŁ켠을 ㅊrズlㅎŁ everything 모음집</p>
          </div>
        </div>
        <nav className="flex gap-2 flex-wrap shrink-0">
          <Link to="/" className="flex items-center gap-1 bg-white hover:bg-[#BDE7FF]/30 border border-[#ddedf8] text-slate-700 px-3 py-1.5 rounded text-sm transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link to="/contents" className="flex items-center gap-1 bg-[#BDE7FF] hover:bg-[#a8d8f0] border border-[#a8d8f0] text-[#3a6d8c] px-3 py-1.5 rounded text-sm font-medium transition-colors">
            <Database className="w-4 h-4" />
            Contents
          </Link>
          <Link to="/music" className="flex items-center gap-1 bg-[#E3E8FF] hover:bg-[#d0d7f5] border border-[#d0d7f5] text-[#556396] px-3 py-1.5 rounded text-sm font-medium transition-colors">
            <MusicIcon className="w-4 h-4" />
            Music
          </Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/contents" element={<Contents />} />
        <Route path="/music" element={<Music />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

