import React from 'react';
import { Icon } from './Icon';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  const navItems = [
    { screen: Screen.Home, icon: 'home', label: 'Home' },
    { screen: Screen.History, icon: 'calendar_month', label: 'History' },
    { screen: Screen.Insights, icon: 'analytics', label: 'Insights' },
    { screen: Screen.Settings, icon: 'settings', label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent h-24 pointer-events-none" />
      <div className="relative pointer-events-auto bg-surface/30 backdrop-blur-xl border-t border-black/5 dark:border-white/5 pb-safe">
        <div className="flex justify-around items-center h-20 px-2">
          {navItems.map((item) => {
            const isActive = currentScreen === item.screen;
            return (
              <button
                key={item.screen}
                onClick={() => onNavigate(item.screen)}
                className={`group flex flex-col items-center gap-1 transition-all duration-300 w-16 relative`}
              >
                {/* Active Indicator Glow */}
                <div className={`absolute -top-3 w-8 h-1 bg-primary rounded-full shadow-[0_0_10px_var(--color-primary)] transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                
                <div className={`relative p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-primary/10' : 'group-hover:bg-black/5 dark:group-hover:bg-white/5'}`}>
                  <Icon 
                    name={item.icon} 
                    filled={isActive} 
                    className={`text-[24px] transition-transform duration-300 ${isActive ? 'text-primary scale-110' : 'text-text-muted group-hover:text-text-main'}`} 
                  />
                </div>
                <span className={`text-[10px] font-bold tracking-wide transition-colors duration-300 ${isActive ? 'text-primary' : 'text-text-muted'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};