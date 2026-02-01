import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code, Gamepad2, Smartphone, ExternalLink, MessageCircle } from "lucide-react";

const KubelabsLanding = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-purple-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white">K</span>
            </div>
            KUBELABS
          </div>
          <Button variant="outline" className="gap-2 hidden sm:flex cursor-pointer" onClick={() => window.open('https://wa.me/5541991769967', '_blank')}>
            <MessageCircle className="w-4 h-4" />
            Fale Conosco
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950 -z-10" />
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <Badge variant="secondary" className="px-4 py-1.5 text-sm rounded-full bg-slate-800 text-blue-400 border-slate-700">
            Software House & Game Studio
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Construindo o futuro digital.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Desenvolvemos soluções de automação, plataformas web e experiências imersivas em jogos online.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
             <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 cursor-pointer" onClick={() => window.open('https://wa.me/5541991769967', '_blank')}>
              Iniciar Projeto <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="secondary" className="cursor-pointer" onClick={() => document.getElementById('portfolio').scrollIntoView({ behavior: 'smooth' })}>
              Ver Portfolio
            </Button>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-24 px-6 bg-slate-900/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Portfolio em Destaque</h2>
            <p className="text-slate-400">Nossos projetos mais recentes e inovadores.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
             <Card className="bg-slate-950 border-slate-800 overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
                <div className="h-48 bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
                   <Gamepad2 className="w-16 h-16 text-white/20 group-hover:scale-110 transition-transform duration-500" />
                   <div className="absolute inset-0 bg-black/20" />
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    Digimon Omega <Badge className="bg-purple-600 hover:bg-purple-700">Live</Badge>
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    MMORPG Browser-based
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-slate-300">
                  Um jogo online imersivo com batalhas em tempo real, sistema de evolução e economia dinâmica. Desenvolvido com React e Node.js.
                </CardContent>
                <CardFooter>
                  <Button className="w-full gap-2 cursor-pointer" variant="outline" onClick={() => window.open('http://digimon.kubelabs.online', '_blank')}>
                    Jogar Agora <ExternalLink className="w-4 h-4" />
                  </Button>
                </CardFooter>
             </Card>

             <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white">Mais que jogos</h3>
                <p className="text-slate-400 leading-relaxed">
                  A Kubelabs não é apenas um estúdio de jogos. Somos especialistas em transformar ideias complexas em software robusto e escalável.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                      <Code className="w-8 h-8 text-blue-400 mb-2" />
                      <h4 className="font-semibold text-white">Web Apps</h4>
                      <p className="text-sm text-slate-500">Sistemas SaaS e Dashboards.</p>
                   </div>
                   <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                      <Smartphone className="w-8 h-8 text-purple-400 mb-2" />
                      <h4 className="font-semibold text-white">Automação</h4>
                      <p className="text-sm text-slate-500">Bots e integrações de API.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 px-6">
         <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold mb-12 text-center">Nossos Serviços</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                 { title: "Desenvolvimento Fullstack", icon: <Code />, desc: "React, Node.js, e arquiteturas modernas." },
                 { title: "Game Design", icon: <Gamepad2 />, desc: "Mecânicas viciantes e economias virtuais equilibradas." },
                 { title: "Consultoria Tech", icon: <MessageCircle />, desc: "Análise de viabilidade e arquitetura de software." }
               ].map((service, i) => (
                 <Card key={i} className="bg-slate-950 border-slate-800 hover:bg-slate-900 transition-colors">
                    <CardHeader>
                       <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center mb-4 text-blue-400 border border-slate-800">
                          {service.icon}
                       </div>
                       <CardTitle>{service.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-400">
                       {service.desc}
                    </CardContent>
                 </Card>
               ))}
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800 bg-slate-950 text-center">
         <div className="container mx-auto px-6">
            <p className="text-slate-500 mb-4">&copy; {new Date().getFullYear()} Kubelabs. Todos os direitos reservados.</p>
            <div className="flex justify-center gap-6 text-slate-400">
               <a href="#" className="hover:text-white transition-colors">Instagram</a>
               <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
               <a href="https://kubelabs.online" className="hover:text-white transition-colors">kubelabs.online</a>
            </div>
         </div>
      </footer>
      
      {/* Floating WhatsApp */}
      <a 
        href="https://wa.me/5541991769967" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-green-500/20 transition-all duration-300 hover:scale-110 flex items-center justify-center"
      >
        <MessageCircle className="w-6 h-6 fill-current" />
      </a>
    </div>
  );
};

export default KubelabsLanding;
