import React from 'react';
import { NcConsultingLogo } from './Logo';
import { RefreshCw, Sun, Moon, Globe, Map, Database, CheckSquare, Sparkles } from 'lucide-react';
import { ThemeMode, Language, translations } from '../i18n/translations';

interface HeaderProps {
  onReset: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  language: Language;
  onSelectLanguage?: (lang: Language) => void;
  onToggleLanguage?: () => void;
  onOpenMap?: () => void;
  onOpenKnowledgeBase?: () => void;
  onOpenAcceptanceTests?: () => void;
  isMapActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  theme,
  onToggleTheme,
  language,
  onSelectLanguage,
  onToggleLanguage,
  onOpenMap,
  onOpenKnowledgeBase,
  onOpenAcceptanceTests,
  isMapActive = false
}) => {
  const t = translations[language].header;
  const isLight = theme === 'light';

  return (
    <header 
      className={`sticky top-0 z-30 w-full border-b backdrop-blur-xl transition-colors duration-300 ${
        isLight 
          ? 'bg-white/95 border-neutral-200 shadow-sm' 
          : 'bg-[#02040A]/95 border-[#172036]'
      }`}
    >
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Бренд NC Consulting */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <NcConsultingLogo className="h-8 sm:h-9 shrink-0" theme={theme} />
          <div className={`h-6 w-px hidden md:block ${isLight ? 'bg-neutral-200' : 'bg-[#172036]'}`} />
          <div className="hidden md:flex flex-col min-w-0">
            <h1 className={`text-sm font-bold tracking-tight flex items-center gap-2 truncate ${
              isLight ? 'text-neutral-900' : 'text-[#F4F7FF]'
            }`}>
              <span className="truncate">{t.systemTitle}</span>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md border shrink-0 transition-all ${
                isLight 
                  ? 'bg-neutral-100 text-neutral-800 border-neutral-300 font-semibold' 
                  : 'text-[#00E5FF] bg-cyan-950/60 border-cyan-500/40 shadow-[0_0_10px_-2px_rgba(0,229,255,0.4)]'
              }`}>
                {t.badge}
              </span>
            </h1>
            <span className={`text-xs truncate ${isLight ? 'text-neutral-500' : 'text-slate-400'}`}>
              {t.systemSubtitle}
            </span>
          </div>
        </div>

        {/* Блок кнопок управления */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Селектор языка: РУС / ҚАЗ / ENG / 中文 */}
          <div className={`p-0.5 rounded-xl border flex items-center transition-all ${
            isLight ? 'bg-neutral-100 border-neutral-300' : 'bg-[#060814] border-[#172036]'
          }`}>
            <div className="pl-1.5 pr-0.5 flex items-center text-slate-400">
              <Globe className="w-3.5 h-3.5" />
            </div>
            {([
              { code: 'ru', label: t.langRu },
              { code: 'kk', label: t.langKk },
              { code: 'en', label: t.langEn },
              { code: 'zh', label: t.langZh }
            ] as const).map(({ code, label }) => {
              const isActive = language === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => onSelectLanguage ? onSelectLanguage(code) : onToggleLanguage && onToggleLanguage()}
                  className={`px-2 py-1 text-[11px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? isLight
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-[#00E5FF] text-slate-950 font-extrabold shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                      : isLight
                        ? 'text-neutral-600 hover:text-neutral-900'
                        : 'text-slate-400 hover:text-white'
                  }`}
                  title={label}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Кнопка 2: Переключение темы интерфейса (Бело-чёрная / Тёмная Неон) */}
          <button
            onClick={onToggleTheme}
            type="button"
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95 ${
              isLight
                ? 'bg-neutral-900 hover:bg-black text-white border-neutral-900 shadow-sm'
                : 'bg-[#060814] hover:bg-[#101426] text-amber-300 border-amber-500/30 hover:border-amber-500/60 hover:shadow-[0_0_12px_rgba(245,158,11,0.25)]'
            }`}
            title={t.themeTooltip}
          >
            {isLight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="hidden sm:inline text-xs">{t.themeNeon}</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline text-xs">{t.themeLight}</span>
              </>
            )}
          </button>

          {/* Кнопка 3: Сброс параметров */}
          <button
            onClick={onReset}
            type="button"
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95 ${
              isLight
                ? 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-300'
                : 'bg-[#060814] hover:bg-[#101426] text-slate-400 hover:text-white border-[#172036]'
            }`}
            title="Сбросить все введённые параметры"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline text-xs">{t.reset}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
