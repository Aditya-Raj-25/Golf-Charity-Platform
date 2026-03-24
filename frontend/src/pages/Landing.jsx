import { Link } from 'react-router-dom';
import { Trophy, CheckCircle, Heart, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Navbar */}
      <nav className="bg-white shadow-sm py-4 px-6 md:px-12 flex justify-between items-center fixed w-full z-50">
        <div className="flex items-center gap-2 text-2xl font-black text-golf-900 tracking-tight">
          <Trophy className="text-gold-400 fill-gold-400" />
          GOLF<span className="text-golf-500 font-light">CHARITY</span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-5 py-2 text-golf-900 font-semibold hover:text-golf-600 transition-colors">Log In</Link>
          <Link to="/login" className="px-5 py-2 bg-golf-600 text-white rounded-full font-semibold shadow-md hover:bg-golf-500 hover:shadow-lg transition-all">Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 md:pt-48 md:pb-32 flex-1 flex items-center justify-center overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-golf-100 rounded-full blur-3xl opacity-60 z-0"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-green-50 rounded-full blur-3xl opacity-60 z-0"></div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-100 text-green-700 font-medium text-sm mb-8 animate-fade-in-up">
            <Trophy className="w-4 h-4 text-gold-400" />
            <span>Play Golf. Win Prizes. Support Charities.</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
            Turn your <span className="text-transparent bg-clip-text bg-gradient-to-r from-golf-500 to-green-400">Golf Scores</span> into impact.
          </h1>
          
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Subscribe, submit your scores, and participate in our weekly draws to win cash prizes while heavily contributing to courses and charities you love.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="px-8 py-4 bg-golf-600 text-white rounded-full font-bold text-lg shadow-xl shadow-golf-600/30 hover:bg-golf-500 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              Start Winning Now <ArrowRight className="w-5 h-5"/>
            </Link>
          </div>
        </div>
      </div>

      {/* Features MVP display */}
      <div className="bg-white py-24 border-t border-gray-100 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-green-50 rounded-2xl flex items-center justify-center mb-6 text-golf-500">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Submit Scores</h3>
              <p className="text-gray-500">Log your last 5 matches. Your numbers are entered into our weekly verified algorithm draw.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gold-50/50 rounded-2xl flex items-center justify-center mb-6 text-gold-400">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Win Big</h3>
              <p className="text-gray-500">Match 3, 4, or 5 of your scores to win escalating cash prizes instantly to your account.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-500">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Support Causes</h3>
              <p className="text-gray-500">Select exactly which charity receives your platform contribution fee. Make an impact while you play.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
