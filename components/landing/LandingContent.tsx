'use client'

import { ArrowRight, Zap, Users, Palette, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function LandingContent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const features = [
    {
      icon: Palette,
      title: 'Creative Canvas',
      description: 'Unlimited canvas space to bring your ideas to life with powerful drawing tools',
    },
    {
      icon: Users,
      title: 'Real-time Collaboration',
      description: 'Work together seamlessly with teammates in real-time, see changes instantly',
    },
    {
      icon: Zap,
      title: 'AI-Powered Insights',
      description: 'Get intelligent suggestions and auto-complete features powered by AI',
    },
    {
      icon: Sparkles,
      title: 'Export & Share',
      description: 'Export your creations in multiple formats and share with anyone, anywhere',
    },
  ]

  return (
    <div className="min-h-screen bg-black text-ice-latte overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-black" />
        
        {/* Animated Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-the-mint/20 rounded-full blur-3xl animate-float opacity-30" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-the-mint/10 rounded-full blur-3xl animate-float opacity-20" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-the-mint/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 opacity-20" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 161, 152, .1) 25%, rgba(0, 161, 152, .1) 26%, transparent 27%, transparent 74%, rgba(0, 161, 152, .1) 75%, rgba(0, 161, 152, .1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 161, 152, .1) 25%, rgba(0, 161, 152, .1) 26%, transparent 27%, transparent 74%, rgba(0, 161, 152, .1) 75%, rgba(0, 161, 152, .1) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
              <div className="inline-block mb-6">
                <span className="px-4 py-2 bg-the-mint/10 border border-the-mint/30 rounded-full text-the-mint text-sm font-semibold hover:bg-the-mint/20 transition-colors cursor-default">
                  ✨ The New Way to Ideate
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="text-ice-latte">Collaborate.</span>
                <br />
                <span className="bg-gradient-to-r from-the-mint to-the-mint/60 bg-clip-text text-transparent">Create. Innovate.</span>
              </h1>

              <p className="text-xl text-ice-latte/70 max-w-2xl mx-auto mb-8 leading-relaxed">
                IdeaSpace is your digital canvas for collaborative creativity. Design, brainstorm, and build amazing things together in real-time.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link
                  href="/register"
                  className="group px-8 py-4 bg-gradient-to-r from-the-mint to-the-mint/80 text-black font-bold rounded-lg hover:shadow-2xl hover:shadow-the-mint/50 transition-all duration-300 flex items-center justify-center gap-2 text-lg"
                >
                  Start Creating Free
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#features"
                  className="px-8 py-4 border-2 border-the-mint/30 text-ice-latte font-bold rounded-lg hover:border-the-mint hover:bg-the-mint/5 transition-all duration-300 flex items-center justify-center gap-2 text-lg"
                >
                  Learn More
                </Link>
              </div>

              {/* Demo Preview */}
              <div className="relative mt-20">
                <div className="absolute inset-0 bg-gradient-to-r from-the-mint/20 via-transparent to-the-mint/20 rounded-2xl blur-3xl" />
                <div className="relative border border-the-mint/30 rounded-2xl p-1 overflow-hidden group hover:border-the-mint/60 transition-colors duration-300">
                  <div className="bg-black rounded-xl p-8 sm:p-12 min-h-96 flex items-center justify-center">
                    <div className="text-center">
                      <div className="inline-block">
                        <div className="w-20 h-20 bg-gradient-to-br from-the-mint/50 to-the-mint/20 rounded-2xl flex items-center justify-center mb-4 animate-glow">
                          <Palette size={40} className="text-the-mint" />
                        </div>
                      </div>
                      <p className="text-the-mint/60 text-sm uppercase tracking-widest mb-2">Canvas Preview</p>
                      <p className="text-ice-latte/50">Your creative space awaits</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="text-ice-latte">Powerful Features</span>
                <br />
                <span className="bg-gradient-to-r from-the-mint to-the-mint/60 bg-clip-text text-transparent">for Modern Teams</span>
              </h2>
              <p className="text-xl text-ice-latte/60 max-w-2xl mx-auto">
                Everything you need to bring your ideas to life
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div
                    key={index}
                    className="group p-6 rounded-xl border border-the-mint/20 bg-black/40 backdrop-blur hover:border-the-mint/60 hover:bg-black/60 transition-all duration-300 cursor-pointer"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="mb-4 inline-block p-3 bg-the-mint/10 rounded-lg group-hover:bg-the-mint/20 transition-colors">
                      <Icon size={24} className="text-the-mint" />
                    </div>
                    <h3 className="text-lg font-bold text-ice-latte mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-ice-latte/60">
                      {feature.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-the-mint/20 via-transparent to-the-mint/20 rounded-2xl blur-3xl" />
              <div className="relative bg-black/60 backdrop-blur border border-the-mint/30 rounded-2xl p-12 text-center">
                <h2 className="text-4xl font-bold text-ice-latte mb-4">
                  Ready to Start Creating?
                </h2>
                <p className="text-xl text-ice-latte/60 mb-8">
                  Join thousands of creators using IdeaSpace to collaborate and innovate.
                </p>
                <Link
                  href="/register"
                  className="group inline-block px-8 py-4 bg-gradient-to-r from-the-mint to-the-mint/80 text-black font-bold rounded-lg hover:shadow-2xl hover:shadow-the-mint/50 transition-all duration-300"
                >
                  Get Started Now
                  <ArrowRight size={20} className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-the-mint/10 mt-20 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-the-mint to-the-mint/60 rounded-lg flex items-center justify-center">
                  <span className="text-ice-latte font-bold">I</span>
                </div>
                <span className="font-bold text-ice-latte">IdeaSpace</span>
              </div>
              <p className="text-ice-latte/50 text-sm">
                © 2026 IdeaSpace. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a href="#" className="text-ice-latte/50 hover:text-the-mint transition-colors text-sm">
                  Privacy
                </a>
                <a href="#" className="text-ice-latte/50 hover:text-the-mint transition-colors text-sm">
                  Terms
                </a>
                <a href="#" className="text-ice-latte/50 hover:text-the-mint transition-colors text-sm">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
