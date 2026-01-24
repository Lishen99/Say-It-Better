import { Heart } from 'lucide-react'

function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-soft-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-calm-400 to-calm-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-soft-800">Say It Better</h1>
              <p className="text-xs text-soft-500">Express yourself clearly</p>
            </div>
          </div>
          
          <a 
            href="#about"
            className="text-sm text-soft-600 hover:text-calm-600 transition-colors"
          >
            How it works
          </a>
        </div>
      </div>
    </header>
  )
}

export default Header
