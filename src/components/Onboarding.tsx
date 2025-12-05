import React, { useState, useEffect } from 'react';
import { X, MapPin, FileText, Users, CheckCircle } from 'lucide-react';

export default function Onboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('straywatch_onboarding_seen');
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('straywatch_onboarding_seen', 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to StrayWatch',
      subtitle: 'Help us make Leh safer by reporting stray incidents',
      icon: '🐾',
      description: 'Your reports help municipal teams, vets, and sanitation crews respond faster to street dog incidents.',
    },
    {
      title: 'Report Incidents',
      subtitle: 'File a report in 30 seconds',
      icon: <FileText className="w-12 h-12 text-blue-500" />,
      description: 'See a stray dog, bite, or garbage hotspot? Open the map and file a report with a photo. Your location is locked automatically.',
      action: 'Go to Map',
      href: '/map',
    },
    {
      title: 'Track Impact',
      subtitle: 'Join the leaderboard',
      icon: <Users className="w-12 h-12 text-blue-500" />,
      description: 'Top 10 contributors appear on the community leaderboard. Consistent reporting helps triage teams prioritize.',
    },
    {
      title: 'You\'re Ready!',
      subtitle: 'Start reporting now',
      icon: <CheckCircle className="w-12 h-12 text-green-500" />,
      description: 'Every report counts. Early alerts help teams reach hotspots during peak hours.',
    },
  ];

  const current = steps[step - 1];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="text-4xl mb-4">{typeof current.icon === 'string' ? current.icon : current.icon}</div>
          <h2 className="text-2xl font-bold text-slate-900">{current.title}</h2>
          <p className="text-sm text-blue-600 font-semibold mt-1">{current.subtitle}</p>
        </div>

        <p className="text-gray-600 text-center mb-8 leading-relaxed">
          {current.description}
        </p>

        {current.href && (
          <a
            href={current.href}
            className="block w-full px-4 py-3 rounded-full bg-blue-500 text-white font-semibold text-center mb-4 hover:bg-blue-600"
          >
            {current.action}
          </a>
        )}

        <div className="flex gap-2 justify-center mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s <= step ? 'bg-blue-500 w-6' : 'bg-gray-200 w-2'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 px-4 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-2 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600"
          >
            {step === 4 ? 'Get Started' : 'Next'}
          </button>
        </div>

        <button
          onClick={handleClose}
          className="w-full mt-3 px-4 py-2 text-gray-600 text-sm hover:text-gray-800"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
