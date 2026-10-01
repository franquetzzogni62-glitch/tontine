import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Wallet,
  Coins,
  CheckCircle2,
  Clock,
  ChevronRight,
  Users2,
  TrendingUp,
  Star,
  Quote,
  Sparkles,
} from 'lucide-react';
import { formatFCFA } from '../utils/formatters';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Value Prop */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <Sparkles size={14} />
                <span>La référence fintech des tontines rotatives en Afrique</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] text-balance">
                Digitalisez vos tontines en{' '}
                <span className="text-emerald-600 dark:text-emerald-400 underline decoration-emerald-500/30">
                  toute confiance
                </span>
                .
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                Automatisez les cotisations quotidiennes, organisez les tours de ramassage en toute transparence et percevez vos commissions de modérateur sans aucun retard ni carnet papier.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link to="/register">
                  <Button
                    variant="emerald"
                    size="lg"
                    className="w-full sm:w-auto shadow-md shadow-emerald-600/20"
                    rightIcon={<ArrowRight size={18} />}
                  >
                    Créer mon premier groupe
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    Espace Connexion
                  </Button>
                </Link>
              </div>

              {/* Trust markers */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-3 gap-4 text-left">
                <div>
                  <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    100%
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Transparence des tours
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    +450 M
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    FCFA sécurisés
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    0 litige
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Historique infalsifiable
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <img
                  src="/src/assets/images/hero_african_fintech_1790600675011.jpg"
                  alt="Application TontiFlow sur smartphone"
                  className="w-full h-80 sm:h-96 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-6 flex flex-col justify-end text-left text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                      Tontine Mélanie · Tour 6/10
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-xs text-slate-300">Bénéficiaire du jour :</p>
                      <h3 className="text-lg font-bold">Aïssatou Sow</h3>
                    </div>
                    <span className="font-mono text-xl font-bold text-emerald-400">
                      10 500 FCFA
                    </span>
                  </div>
                  <div className="mt-3 w-full bg-white/20 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Coins size={20} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Commission modérateur
                  </p>
                  <p className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    +500 FCFA / jour
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section (3 steps) */}
      <section id="comment-ca-marche" className="py-16 sm:py-24 bg-white dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              FONCTIONNEMENT SIMPLE
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
              Comment fonctionne TontiFlow ?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3">
              En seulement 3 étapes, digitalisez vos cotisations rotatives entre collègues, commerçants ou membres de famille.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg mb-5 shadow-xs">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Créer votre groupe
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Définissez le montant de cotisation journalière (ex: 1 100 FCFA), la commission du modérateur (ex: 50 FCFA) et le nombre de participants.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-emerald-500 text-white flex items-center justify-center font-bold text-lg mb-5 shadow-xs">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Inviter & ordonner les tours
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Partagez le lien d'adhésion par WhatsApp ou SMS. L'ordre des bénéficiaires est fixé à l'avance et consultable par tous en temps réel.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-lg mb-5 shadow-xs">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Cotiser & encaisser le pot
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Chaque jour, les membres versent leur part par MTN MoMo, Orange Money ou Wave. Le modérateur remet la cagnotte au bénéficiaire prévu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section (4 Cards) */}
      <section id="fonctionnalites" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              FONCTIONNALITÉS CLÉS
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
              Tout ce dont vous avez besoin pour gérer vos tontines
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <Card hoverEffect className="flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <Smartphone size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  Mobile Money Intégré
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Support direct d'Orange Money, MTN MoMo et Wave avec vérification instantanée des reçus de transaction.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Paiements simplifiés · 0 tracas
              </div>
            </Card>

            <Card hoverEffect className="flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                  <Clock size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  Suivi des tours en direct
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Chaque membre sait exactement quand vient son jour de cagnotte. Compte à rebours et notifications automatiques.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Ordre garanti · Calendrier 30j
              </div>
            </Card>

            <Card hoverEffect className="flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  Commissions automatisées
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Calcul automatique de vos gains de modérateur (ex: 50 FCFA × 10 = 500 FCFA/jour) et export comptable CSV.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                Revenus nets calculés en direct
              </div>
            </Card>

            <Card hoverEffect className="flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  Score de confiance membre
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Identifiez immédiatement les membres ponctuels et envoyez des relances WhatsApp automatiques en cas de retard.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                99% de taux de recouvrement
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Image Highlight */}
      <section className="py-12 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="text-left space-y-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                CONSTRUIT POUR LE TERRAIN
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
                Moderniser une tradition africaine sans en dénaturer l'esprit.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Les tontines sont au cœur de l'économie informelle et de la solidarité communautaire. TontiFlow élimine le carnet papier taché et les disputes sur les tours, tout en préservant le lien social et la confiance mutuelle.
              </p>
              <div className="pt-2">
                <Link to="/register">
                  <Button variant="emerald" size="md">
                    Commencer gratuitement dès aujourd'hui
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
              <img
                src="/src/assets/images/tontine_community_trust_1790600700651.jpg"
                alt="Communauté de membres de tontines en concertation"
                className="w-full h-72 sm:h-80 object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section (3 testimonials) */}
      <section id="temoignages" className="py-16 sm:py-24 bg-white dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              TÉMOIGNAGES
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
              Ils gèrent leurs groupes avec TontiFlow
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  « Avant TontiFlow, je passais mes soirées à pointer sur un cahier et à faire les comptes sous la lampe. Aujourd'hui, je gère 4 groupes de 10 personnes et mes commissions tombent sans dispute. »
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                  CM
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Mme Claire Mballa
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Modératrice de 4 tontines · Douala Akwa
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  « En tant que participant, savoir exactement quand mon tour arrive et pouvoir cotiser par Orange Money en un clic le matin depuis mon échoppe a changé ma vie. »
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-sm">
                  AB
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Amadou Bello
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Commerçant bétail & céréales · Garoua
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  « Notre cercle de femmes commerçantes a atteint 100% de taux de recouvrement. Les relances WhatsApp pré-remplies évitent toute tension entre amies. »
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-sm">
                  FC
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Fanta Camara
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Atelier de confection · Yaoundé Mokolo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 sm:py-20 bg-emerald-600 dark:bg-emerald-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center space-y-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles size={14} /> Modernisez vos tontines dès aujourd'hui
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto text-balance">
            Fini les carnets papier, les retards et les disputes de trésorerie.
          </h2>
          <p className="text-sm sm:text-base text-emerald-100 max-w-xl mx-auto leading-relaxed">
            Rejoignez des centaines de modérateurs et cotisants qui automatisent leurs cotisations et cagnottes en toute transparence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/register">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-white text-emerald-800 hover:bg-emerald-50 border-white font-bold shadow-lg"
                rightIcon={<ArrowRight size={18} />}
              >
                Créer un groupe gratuitement
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto text-white hover:bg-white/10 border border-white/30"
              >
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 py-12 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                  TF
                </div>
                <span className="text-lg font-bold text-white tracking-tight">
                  Tonti<span className="text-emerald-400">Flow</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                La plateforme SaaS de référence pour la digitalisation et la sécurisation des tontines rotatives en Afrique.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Produit
              </h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#comment-ca-marche" className="hover:text-white transition-colors">Comment ça marche</a></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Créer une tontine</Link></li>
                <li><Link to="/member" className="hover:text-white transition-colors">Portail Membre</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Communauté
              </h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#temoignages" className="hover:text-white transition-colors">Témoignages modérateurs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Guide des tontines sécurisées</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Calculateur de commissions</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Légal
              </h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#" className="hover:text-white transition-colors">Conditions générales d'utilisation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Protection des données privées</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sécurité des transactions</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} TontiFlow Technologies SAS. Tous droits réservés.</p>
            <p>Conçu avec fierté pour l'Afrique · FCFA (XAF)</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
