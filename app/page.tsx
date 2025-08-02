"use client";

import React, { useState, useEffect } from 'react';
import { ChevronRight, Dumbbell, Users, Clock, Trophy, Star, Menu, X, Phone, Mail, MapPin, Heart, Target, Zap } from 'lucide-react';

export default function ZoneFitnessLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: Dumbbell, title: "Strength Training", desc: "Build muscle and increase power with our premium equipment" },
    { icon: Heart, title: "Cardio Fitness", desc: "Improve cardiovascular health and endurance" },
    { icon: Target, title: "Personal Training", desc: "One-on-one guidance from certified trainers" },
    { icon: Zap, title: "Group Classes", desc: "Energizing group workouts and fitness programs" }
  ];

  const testimonials = [
    { name: "Arjun Rane", rating: 5, text: "ZoneFitness transformed my life. Lost 25Kgs and gained incredible confidence!" },
    { name: "Supriya Khadka", rating: 5, text: "Best gym experience ever. The trainers are phenomenal and equipment is top-notch." },
    { name: "Om Patil", rating: 5, text: "Love the vibes. Perfect for my busy schedule." }
  ];

  const handleSignIn = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        scrollY > 100 ? 'bg-black/95 backdrop-blur-md py-2' : 'bg-transparent py-4'
      }`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="text-2xl font-bold">
            <span className="text-red-500">The Zone</span>
            <span className="text-white">Fitness</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" className="hover:text-red-500 transition-colors">Home</a>
            <a href="#about" className="hover:text-red-500 transition-colors">About</a>
            <a href="#programs" className="hover:text-red-500 transition-colors">Plans</a>
            <a href="#contact" className="hover:text-red-500 transition-colors">Contact</a>
            <button 
              onClick={handleSignIn}
              className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-full font-semibold transition-colors"
            >
              Sign In
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-md">
            <div className="container mx-auto px-6 py-4 flex flex-col space-y-4">
              <a href="#home" className="hover:text-red-500 transition-colors">Home</a>
              <a href="#about" className="hover:text-red-500 transition-colors">About</a>
              <a href="#programs" className="hover:text-red-500 transition-colors">Programs</a>
              <a href="#contact" className="hover:text-red-500 transition-colors">Contact</a>
              <button 
                onClick={handleSignIn}
                className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-full font-semibold transition-colors w-fit"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-black/80 z-10"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-gradient-to-r from-red-500/10 to-transparent animate-pulse"></div>
        </div>
        
        <div className="container mx-auto px-6 text-center z-20 relative">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">Transform Your</span><br />
              <span className="text-red-500 animate-pulse">Body & Mind</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Join ZoneFitness and unlock your potential with premium equipment, expert trainers, and a community that pushes you to greatness.
            </p>
            <p><span className="text-red-500">By Bharat & Anuja</span></p>
            <div className="mt-8">
              <button 
                onClick={handleSignIn}
                className="bg-red-500 hover:bg-red-600 px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105"
              >
                Start Your Journey
              </button>
            </div>
          </div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 border border-red-500/30 rotate-45 animate-spin-slow"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-red-500/20 rotate-12 animate-pulse"></div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose <span className="text-red-500">ZoneFitness</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience fitness like never before with our world-class facilities and expert guidance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-black rounded-xl p-6 text-center hover:bg-red-900/20 transition-all transform hover:scale-105 hover:-translate-y-2 border border-gray-800 hover:border-red-500/50"
              >
                <div className="bg-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Our <span className="text-red-500">Plans</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Designed by experts, tailored for results. Choose the program that fits your goals.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-10">
            {[
              {
                title: "1 month",
                price: "2000/-month",
                features: ["Cardio", "Nutrition Plan","Progress Tracking","Functional training"]
              },
              {
                title: "3 months",
                price: "4000/-month",
                features: ["Cardio", "Functional training", "Progress Tracking", "Nutrition Plan"],
                popular: true
              },
              {
                title: "6 months",
                price: "6000/-month",
                features: ["Cardio", "Functional training", "Progress Tracking", "Nutrition Plan"]
              },
              {
                title: "1 year",
                price: "10000/-month",
                features: ["Cardio", "Nutrition Plan","Progress Tracking","Functional training"]
              },
            ].map((plan, index) => (
              <div 
                key={index}
                className={`rounded-xl p-8 text-center relative overflow-hidden ${
                  plan.popular 
                    ? 'bg-gradient-to-b from-red-600 to-red-800 transform scale-105' 
                    : 'bg-gray-900 hover:bg-gray-800'
                } transition-all hover:-translate-y-2 border ${
                  plan.popular ? 'border-red-400' : 'border-gray-700 hover:border-red-500/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-red-500 text-white py-2 text-sm font-bold">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-4 mt-4">{plan.title}</h3>
                <div className="text-4xl font-bold text-red-500 mb-6">{plan.price}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center justify-center">
                      <span className="text-green-400 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 px-6 rounded-full font-semibold transition-all ${
                  plan.popular 
                    ? 'bg-white text-red-600 hover:bg-gray-100' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}>
                  Choose Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Success <span className="text-red-500">Stories</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Real results from real people. See what our members have achieved.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-black rounded-xl p-6 hover:bg-red-900/10 transition-all transform hover:scale-105 border border-gray-800 hover:border-red-500/50"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={20} className="text-red-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">"{testimonial.text}"</p>
                <div className="font-semibold text-white">- {testimonial.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-red-500">The Zone Fitness</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Changing Lifestyles.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-8 text-red-500">Developed By:</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <Phone className="text-red-500 mr-4" size={24} />
                  <div>
                    <div className="font-semibold">Developer</div>
                    <div className="text-gray-400">+91 7768092107</div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <Mail className="text-red-500 mr-4" size={24} />
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-gray-400">arjunrane5007@gmail.com</div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <MapPin className="text-red-500 mr-4" size={24} />
                  <div>
                    <div className="font-semibold">Name:</div>
                    <div className="text-gray-400">Arjun Rane, Supriya Khadka</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">
                <span className="text-red-500">Zone</span>
                <span className="text-white">Fitness</span>
              </div>
              <p className="text-gray-400">
                Transform your body and mind with our premium fitness programs and expert guidance.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-red-500">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#home" className="hover:text-red-500 transition-colors">Home</a></li>
                <li><a href="#about" className="hover:text-red-500 transition-colors">About</a></li>
                <li><a href="#programs" className="hover:text-red-500 transition-colors">Programs</a></li>
                <li><a href="#contact" className="hover:text-red-500 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-red-500">Programs</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Strength Training</li>
                <li>Cardio Fitness</li>
                <li>Group Classes</li>
                <li>Personal Training</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-red-500">Hours</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Monday - Friday: 24/7</li>
                <li>Weekend: 24/7</li>
                <li>Staff Available:</li>
                <li>6:00 AM - 10:00 PM</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ZoneFitness. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}