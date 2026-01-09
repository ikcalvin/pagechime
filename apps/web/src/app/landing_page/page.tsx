import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Cloud,
  Layers,
  PlayCircle,
  Shield,
  Zap,
  Sparkles,
  Headphones,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FDF7ED] text-[#1D2130] font-sans selection:bg-purple-200 selection:text-purple-900 overflow-x-hidden">
      {/* Floating Island Header */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center">
        <header className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/5 rounded-full px-6 h-14 flex items-center gap-8 md:gap-12 max-w-2xl mx-4 animate-fade-in-up">
          <Link
            href="#"
            className="flex items-center gap-2 font-bold text-lg tracking-tight"
          >
            <div className="w-8 h-8 bg-[#1D2130] rounded-full flex items-center justify-center text-white">
              P
            </div>
            Pagechime
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="#" className="hover:text-[#1D2130] transition-colors">
              Features
            </Link>
            <Link href="#" className="hover:text-[#1D2130] transition-colors">
              Pricing
            </Link>
            <Link href="#" className="hover:text-[#1D2130] transition-colors">
              Blog
            </Link>
          </nav>
          <Button
            size="sm"
            className="bg-[#1D2130] hover:bg-black text-white rounded-full px-5 h-9 font-medium shadow-md"
          >
            Get Started
          </Button>
        </header>
      </div>

      <main className="pt-32 pb-16">
        {/* Asymmetrical Hero Section */}
        <section className="container mx-auto px-6 py-12 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium border border-yellow-200">
                <Sparkles className="w-4 h-4" />
                <span>Now available for everyone</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] text-[#1D2130]">
                Turn articles into <br className="hidden md:block" />
                <span className="relative inline-block mx-2">
                  <span className="relative z-10">audio</span>
                  <span className="absolute bottom-2 left-0 right-0 h-4 bg-purple-200 -z-0 rotate-1"></span>
                </span>
                instantly.
              </h1>

              <p className="text-xl text-slate-600 leading-relaxed max-w-md">
                Listen to the web anywhere. Pagechime converts your reading list
                into high-quality, natural-sounding audio in seconds.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button
                  size="lg"
                  className="bg-[#1D2130] hover:bg-black text-white hover:text-white rounded-full px-8 h-14 text-lg shadow-xl shadow-purple-900/10"
                >
                  Start listening free
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="rounded-full px-8 h-14 text-lg hover:bg-white/50 text-slate-700"
                >
                  View demo <PlayCircle className="ml-2 w-5 h-5" />
                </Button>
              </div>

              <div className="pt-8 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-[#FDF7ED] bg-slate-200"
                    />
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-[#FDF7ED] bg-white flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">
                    +2k
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-600">
                  <div className="flex items-center gap-1 text-yellow-500 mb-0.5">
                    ⭐⭐⭐⭐⭐
                  </div>
                  Loved by productivity hackers
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative isolate">
              {/* Background Blobs */}
              <div className="absolute -top-12 -right-12 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
              <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
              <div className="absolute top-12 left-12 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/10 border-4 border-white bg-white animate-fade-in-up [animation-delay:200ms] group">
                {/* Main Dashboard Image */}
                <Image
                  src="/saas_dashboard_mockup.png"
                  width={800}
                  height={600}
                  alt="Pagechime Dashboard"
                  className="w-full h-auto object-cover transform transition-transform duration-700 hover:scale-105"
                />

                {/* Floating UI Card 1 */}
                <div className="absolute -left-6 bottom-12 bg-white/90 backdrop-blur shadow-xl p-4 rounded-xl border border-white/50 animate-float-slow max-w-xs">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        Status
                      </p>
                      <p className="font-bold text-sm">Conversion Complete</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-full rounded-full" />
                  </div>
                </div>

                {/* Floating UI Card 2 */}
                <div className="absolute -right-4 top-12 bg-[#1D2130] text-white shadow-xl p-4 rounded-xl animate-float-reverse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Headphones className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">
                        Now Playing
                      </p>
                      <p className="font-bold text-sm">The Future of AI</p>
                    </div>
                    <div className="ml-2 flex gap-1">
                      <span className="w-1 h-3 bg-green-400 rounded-full animate-pulse"></span>
                      <span className="w-1 h-5 bg-green-400 rounded-full animate-pulse [animation-delay:100ms]"></span>
                      <span className="w-1 h-3 bg-green-400 rounded-full animate-pulse [animation-delay:200ms]"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dark Bento Grid Section */}
        <section className="mt-24 py-24 bg-[#1D2130] text-white rounded-[3rem] mx-2 relative overflow-hidden">
          {/* Section Header */}
          <div className="container mx-auto px-6 mb-16 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="max-w-xl">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                  Designed for the <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    modern reader.
                  </span>
                </h2>
                <p className="text-slate-400 text-lg">
                  Experience a listening experience that adapts to your
                  lifestyle. No more "read it later" lists that never get read.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-slate-700 text-white hover:bg-white hover:text-[#1D2130] rounded-full px-6"
              >
                Explore all features
              </Button>
            </div>
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Large Card spanning 2 cols */}
              <div className="md:col-span-2 bg-[#CEF4F9] text-[#1D2130] rounded-3xl p-8 md:p-12 relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold mb-4">Natural AI Voices</h3>
                  <p className="text-slate-700 max-w-sm text-lg">
                    Choose from a variety of ultra-realistic voices that sound
                    human, not robotic. Optimized for long-form content.
                  </p>
                  <Button className="mt-8 bg-[#1D2130] text-white hover:bg-black rounded-full px-6">
                    Try samples
                  </Button>
                </div>
                <div className="absolute right-0 bottom-0 top-0 w-1/2 translate-x-12 translate-y-12 md:translate-y-0 opacity-80 group-hover:scale-105 transition-transform duration-500">
                  <Image
                    src="/audio_wave_chart.png"
                    width={400}
                    height={400}
                    alt="Audio Waveform"
                    className="object-contain w-full h-full mix-blend-multiply"
                  />
                </div>
              </div>

              {/* Tall Card */}
              <div className="bg-[#FBCFE8] text-[#1D2130] rounded-3xl p-8 md:p-10 flex flex-col justify-between group overflow-hidden">
                <div>
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <Zap className="w-6 h-6 text-pink-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Instant Sync</h3>
                  <p className="text-slate-700">
                    Your library syncs across all devices instantly.
                  </p>
                </div>
                <div className="mt-8 relative h-32 bg-white/50 rounded-xl overflow-hidden border border-white/50 dashed-border">
                  {/* Abstract visual */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-pink-400 rounded-lg animate-spin-slow"></div>
                  </div>
                </div>
              </div>

              {/* Standard Card */}
              <div className="bg-[#E9D5FF] text-[#1D2130] rounded-3xl p-8 md:p-10 group hover:bg-[#D8B4FE] transition-colors">
                <h3 className="text-2xl font-bold mb-2">Offline Mode</h3>
                <p className="text-slate-700 mb-6">
                  Download for flights and commutes.
                </p>
                <div className="flex justify-end">
                  <Cloud className="w-16 h-16 text-purple-600 opacity-50 group-hover:scale-110 transition-transform" />
                </div>
              </div>

              {/* Standard Card */}
              <div className="md:col-span-2 bg-[#FDF7ED] text-[#1D2130] rounded-3xl p-8 md:p-10 flex items-center justify-between gap-8 group">
                <div className="max-w-md">
                  <h3 className="text-2xl font-bold mb-3">Privacy First</h3>
                  <p className="text-slate-600">
                    We don't track your listening habits or sell your data. Your
                    library is yours alone.
                  </p>
                </div>
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform">
                  <Shield className="w-10 h-10 text-orange-500" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits / List Section */}
        <section className="container mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
                <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Layers className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Smart Queue</h4>
                    <p className="text-slate-500 text-sm">
                      Auto-organize your day
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <PlayCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2.5 w-3/4 bg-slate-200 rounded mb-2 group-hover:bg-blue-100 transition-colors" />
                        <div className="h-2 w-1/2 bg-slate-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            </div>

            <div className="order-1 lg:order-2 space-y-8">
              <h2 className="text-4xl font-bold leading-tight">
                Stay productive without <br /> looking at a screen.
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: "Commute efficently",
                    desc: "Turn dead time into learning time.",
                  },
                  {
                    title: "Reduce eye strain",
                    desc: "Give your eyes a break after a long day.",
                  },
                  {
                    title: "Retain more",
                    desc: "Listening can improve comprehension for complex topics.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{item.title}</h4>
                      <p className="text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-12">
          <div className="bg-yellow-300 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-bold text-[#1D2130] mb-6">
                Ready to tune in?
              </h2>
              <p className="text-xl text-[#1D2130]/80 mb-10 font-medium">
                Join thousands of users who are changing how they consume
                content on the web.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-[#1D2130] hover:bg-black text-white rounded-full px-10 h-14 text-lg"
                >
                  Get Started Free
                </Button>
              </div>
            </div>
            {/* Background patterns */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <svg
                className="w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
              </svg>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-xl text-[#1D2130]">
              <div className="w-8 h-8 bg-[#1D2130] rounded-full flex items-center justify-center text-white">
                P
              </div>
              Pagechime
            </div>
            <div className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} Pagechime Inc. All rights
              reserved.
            </div>
            <div className="flex gap-6">
              <Link
                href="#"
                className="text-slate-500 hover:text-[#1D2130] transition-colors"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link
                href="#"
                className="text-slate-500 hover:text-[#1D2130] transition-colors"
              >
                <span className="sr-only">GitHub</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
