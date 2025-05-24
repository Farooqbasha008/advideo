import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, Edit, ArrowRight, Download, Play, ChevronRight, Twitter, Facebook, Instagram, Linkedin, Github, Mail } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Bar */}
      <header className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 animate-fade-in">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-[#D7F266]">FilmMaestro</h1>
          <nav className="ml-10 hidden md:flex">
            <ul className="flex space-x-8">
              <li><a href="#" className="hover:text-[#D7F266] transition-colors duration-200 font-medium">Home</a></li>
              <li><a href="#" className="hover:text-[#D7F266] transition-colors duration-200">Features</a></li>
              <li><a href="#" className="hover:text-[#D7F266] transition-colors duration-200">Pricing</a></li>
              <li><a href="#" className="hover:text-[#D7F266] transition-colors duration-200">Blog</a></li>
            </ul>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" className="text-[#F7F8F6]/80 hover:text-[#F7F8F6] transition-colors duration-200">Log in</Button>
          <Button className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] rounded-full transition-all duration-300 font-medium">Sign up</Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">

        {/* Hero Section */}
        <section className="text-center mb-20 pt-10 md:pt-16 animate-fade-in">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#D7F266] to-[#A9E34B] bg-clip-text text-transparent">
            Create Videos with AI
          </h2>
          <p className="text-xl md:text-2xl text-[#F7F8F6]/80 max-w-3xl mx-auto mb-10 leading-relaxed">
            Generate, edit, and share professional content in minutes with the power of AI.
          </p>
          <div className="flex justify-center max-w-md mx-auto">
            <Link to="/script-generation" className="w-full">
              <Button className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] w-full rounded-full transition-all duration-300 h-12 text-lg font-medium">
                <Play size={18} className="mr-2" />
                Get Started
              </Button>
            </Link>
          </div>
        </section>

        {/* Generate Video Section */}
        <section className="mb-20">
          <h3 className="text-2xl font-bold mb-8 flex items-center">
            <span className="w-8 h-8 rounded-full bg-[#D7F266]/20 flex items-center justify-center mr-3 text-[#D7F266]">1</span>
            Generate Video
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
            {/* Generate Complete Video Card */}
            <div className="bg-[#1E1E1E] rounded-lg p-8 flex flex-col items-center text-center hover:shadow-lg transition-all border border-[#F7F8F6]/10">
              <div className="bg-[#D7F266] p-4 rounded-lg mb-4 text-[#151514]">
                <FileText size={32} />
              </div>
              <h4 className="text-xl font-bold mb-2">Generate complete video</h4>
              <p className="text-[#F7F8F6]/80 mb-6">from script or topic</p>
              <Link to="/script-generation" className="w-full">
                <Button className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] w-full rounded-full transition-all duration-300">
                  Start Creating
                </Button>
              </Link>
            </div>

            {/* Explore from Scratch Card */}
            <div className="bg-[#1E1E1E] rounded-lg p-8 flex flex-col items-center text-center hover:shadow-lg transition-all border border-[#F7F8F6]/10">
              <div className="bg-[#D7F266] p-4 rounded-lg mb-4 text-[#151514]">
                <Edit size={32} />
              </div>
              <h4 className="text-xl font-bold mb-2">Explore from scratch</h4>
              <p className="text-[#F7F8F6]/80 mb-6">in the editor</p>
              <Link to="/editor" className="w-full">
                <Button className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] w-full rounded-full transition-all duration-300">
                  <span>Open Editor</span>
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Recent Projects Section */}
        <section className="pb-16">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold flex items-center">
              <span className="w-8 h-8 rounded-full bg-[#D7F266]/20 flex items-center justify-center mr-3 text-[#D7F266]">2</span>
              Recent Projects
            </h3>
            <Button variant="ghost" className="text-[#D7F266] hover:text-[#D7F266]/80 transition-colors duration-200">
              View all <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
            {/* Example Project Card */}
            <div className="bg-[#1E1E1E] rounded-lg overflow-hidden hover:shadow-lg transition-all border border-[#F7F8F6]/10 group">
              <div className="relative aspect-video bg-gray-800">
                <img 
                  src="/placeholder.svg" 
                  alt="Project thumbnail" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-all duration-300 backdrop-blur-sm">
                  <div className="flex space-x-3 scale-90 group-hover:scale-100 transition-transform duration-300">
                    <Button size="sm" variant="secondary" className="rounded-full h-9 w-9 p-0 bg-[#F7F8F6]/10 hover:bg-[#F7F8F6]/20 border-0">
                      <Edit size={16} />
                    </Button>
                    <Button size="sm" variant="secondary" className="rounded-full h-9 w-9 p-0 bg-[#F7F8F6]/10 hover:bg-[#F7F8F6]/20 border-0">
                      <Download size={16} />
                    </Button>
                    <Button size="sm" variant="secondary" className="rounded-full h-9 w-9 p-0 bg-[#F7F8F6]/10 hover:bg-[#F7F8F6]/20 border-0">
                      <Play size={16} />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-medium group-hover:text-[#D7F266] transition-colors duration-300">Welcome to FilmMaestro!</h4>
                <p className="text-sm text-[#F7F8F6]/60 mt-1">Last edited: Today</p>
              </div>
            </div>

            {/* Example Project Card 2 */}
            <div className="bg-[#1E1E1E] rounded-lg overflow-hidden hover:shadow-lg transition-all border border-[#F7F8F6]/10 group">
              <div className="relative aspect-video bg-gray-800">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A]">
                  <FileText size={32} className="text-[#F7F8F6]/30" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-all duration-300 backdrop-blur-sm">
                  <div className="flex space-x-3 scale-90 group-hover:scale-100 transition-transform duration-300">
                    <Button size="sm" variant="secondary" className="rounded-full h-9 w-9 p-0 bg-[#F7F8F6]/10 hover:bg-[#F7F8F6]/20 border-0">
                      <Edit size={16} />
                    </Button>
                    <Button size="sm" variant="secondary" className="rounded-full h-9 w-9 p-0 bg-[#F7F8F6]/10 hover:bg-[#F7F8F6]/20 border-0">
                      <Download size={16} />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-medium group-hover:text-[#D7F266] transition-colors duration-300">Product Demo</h4>
                <p className="text-sm text-[#F7F8F6]/60 mt-1">Last edited: Yesterday</p>
              </div>
            </div>

            {/* Empty Project Card */}
            <div className="bg-[#1E1E1E] rounded-lg overflow-hidden border border-dashed border-[#F7F8F6]/20 flex items-center justify-center aspect-video hover:border-[#D7F266] transition-colors group">
              <div className="text-center p-6 transform group-hover:scale-105 transition-transform duration-300">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-3 border border-[#F7F8F6]/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#D7F266]">
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg>
                </div>
                <p className="text-[#F7F8F6]/60 group-hover:text-[#F7F8F6] transition-colors duration-300">Create new project</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 mt-16 bg-[#151514]/60">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-1">
              <h2 className="text-2xl font-bold text-[#D7F266] mb-4">FilmMaestro</h2>
              <p className="text-sm text-[#F7F8F6]/70 max-w-md leading-relaxed mb-6">Create professional videos with AI. Generate, edit, and share your content in minutes.</p>
              <div className="flex space-x-4">
                <a href="#" className="w-9 h-9 rounded-full bg-[#1E1E1E] flex items-center justify-center text-[#F7F8F6]/70 hover:text-[#D7F266] hover:bg-[#1E1E1E]/80 transition-all duration-300">
                  <Twitter size={18} />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-[#1E1E1E] flex items-center justify-center text-[#F7F8F6]/70 hover:text-[#D7F266] hover:bg-[#1E1E1E]/80 transition-all duration-300">
                  <Facebook size={18} />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-[#1E1E1E] flex items-center justify-center text-[#F7F8F6]/70 hover:text-[#D7F266] hover:bg-[#1E1E1E]/80 transition-all duration-300">
                  <Instagram size={18} />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-[#1E1E1E] flex items-center justify-center text-[#F7F8F6]/70 hover:text-[#D7F266] hover:bg-[#1E1E1E]/80 transition-all duration-300">
                  <Linkedin size={18} />
                </a>
              </div>
            </div>
            
            {/* Product Links */}
            <div className="col-span-1">
              <h3 className="font-semibold text-lg mb-4 text-[#F7F8F6]">Product</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-[#F7F8F6]/70 hover:text-[#D7F266] transition-colors duration-300 flex items-center"><ChevronRight size={14} className="mr-1 text-[#D7F266]/70" />Features</a></li>
                <li><a href="#" className="text-sm text-[#F7F8F6]/70 hover:text-[#D7F266] transition-colors duration-300 flex items-center"><ChevronRight size={14} className="mr-1 text-[#D7F266]/70" />Pricing</a></li>
                <li><a href="#" className="text-sm text-[#F7F8F6]/70 hover:text-[#D7F266] transition-colors duration-300 flex items-center"><ChevronRight size={14} className="mr-1 text-[#D7F266]/70" />Tutorials</a></li>
                <li><a href="#" className="text-sm text-[#F7F8F6]/70 hover:text-[#D7F266] transition-colors duration-300 flex items-center"><ChevronRight size={14} className="mr-1 text-[#D7F266]/70" />Roadmap</a></li>
                <li><a href="#" className="text-sm text-[#F7F8F6]/70 hover:text-[#D7F266] transition-colors duration-300 flex items-center"><ChevronRight size={14} className="mr-1 text-[#D7F266]/70" />Status</a></li>
              </ul>
            </div>
            
            {/* Company Links */}
            <div className="col-span-1">
              <h3 className="font-semibold text-lg mb-4 text-[#F7F8F6]">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-[#F7F8F6]/70 hover:text-[#D7F266] transition-colors duration-300 flex items-center"><ChevronRight size={14} className="mr-1 text-[#D7F266]/70" />About</a></li>
                <li><a href="#" className="text-sm text-[#F7F8F6]/70 hover:text-[#D7F266] transition-colors duration-300 flex items-center"><ChevronRight size={14} className="mr-1 text-[#D7F266]/70" />Blog</a></li>
                <li><a href="#" className="text-sm text-[#F7F8F6]/70 hover:text-[#D7F266] transition-colors duration-300 flex items-center"><ChevronRight size={14} className="mr-1 text-[#D7F266]/70" />Careers</a></li>
                <li><a href="#" className="text-sm text-[#F7F8F6]/70 hover:text-[#D7F266] transition-colors duration-300 flex items-center"><ChevronRight size={14} className="mr-1 text-[#D7F266]/70" />Contact</a></li>
                <li><a href="#" className="text-sm text-[#F7F8F6]/70 hover:text-[#D7F266] transition-colors duration-300 flex items-center"><ChevronRight size={14} className="mr-1 text-[#D7F266]/70" />Press</a></li>
              </ul>
            </div>
            
            {/* Contact & Newsletter */}
            <div className="col-span-1">
              <h3 className="font-semibold text-lg mb-4 text-[#F7F8F6]">Stay Updated</h3>
              <p className="text-sm text-[#F7F8F6]/70 mb-4">Subscribe to our newsletter for the latest updates and features.</p>
              <div className="flex">
                <input type="email" placeholder="Your email" className="bg-[#1E1E1E] text-sm rounded-l-md px-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#D7F266] border border-[#F7F8F6]/10" />
                <button className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] px-4 py-2 rounded-r-md transition-colors duration-300 font-medium text-sm">Subscribe</button>
              </div>
              <div className="mt-6">
                <a href="mailto:contact@filmmaestro.ai" className="text-sm text-[#F7F8F6]/70 hover:text-[#D7F266] transition-colors duration-300 flex items-center">
                  <Mail size={16} className="mr-2" />
                  contact@filmmaestro.ai
                </a>
              </div>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-[#F7F8F6]/50 mb-4 md:mb-0">© {new Date().getFullYear()} FilmMaestro. All rights reserved.</p>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
              <a href="#" className="text-sm text-[#F7F8F6]/60 hover:text-[#D7F266] transition-colors">Terms</a>
              <a href="#" className="text-sm text-[#F7F8F6]/60 hover:text-[#D7F266] transition-colors">Privacy</a>
              <a href="#" className="text-sm text-[#F7F8F6]/60 hover:text-[#D7F266] transition-colors">Cookies</a>
              <a href="#" className="text-sm text-[#F7F8F6]/60 hover:text-[#D7F266] transition-colors">Accessibility</a>
              <a href="#" className="text-sm text-[#F7F8F6]/60 hover:text-[#D7F266] transition-colors">
                <Github size={16} className="inline mr-1" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;