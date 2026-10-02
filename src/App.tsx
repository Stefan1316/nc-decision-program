import React, { useState, useMemo } from 'react';
import { UserQuery } from './types/damu';
import { evaluatePrograms } from './logic/decisionEngine';
import { Header } from './components/Header';
import { QueryInputPanel } from './components/QueryInputPanel';
import { MioPrioritiesMap } from './components/MioPrioritiesMap';
import { ReportExportModal } from './components/ReportExportModal';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { AcceptanceTestsModal } from './components/AcceptanceTestsModal';
import { ThemeMode, Language, translations } from './i18n/translations';
import { 
  FileText, 
  Map, 
  Sparkles,
  Search,
  Layers
} from 'lucide-react';

const INITIAL_QUERY: UserQuery = {
  oked_code: '',
  location_name: '',
  location_level: 'city',
  location_role: 'unknown',
  settlement_type: 'any',
  entity_type: '',
  business_status: '',
  operating_years: null,
  purpose: '',
  amount_kzt: null,
  instrument_preference: '',
  tax_arrears: null,
  overdue_debt_days: null,
  social_enterprise_registry: null,
  domestic_equivalent_available: null
};

export default function App() {
  const [query, setQuery] = useState<UserQuery>(INITIAL_QUERY);

  // Тема оформления: 'neon' (глубокий черный фон с неон-свечением) или 'light' (бело-чёрная)
  const [theme, setTheme] = useState<ThemeMode>('neon');

  // Язык интерфейса: 'ru' (по умолчанию) или 'kk' (казахский)
  const [language, setLanguage] = useState<Language>('ru');

  // Модальные окна
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(false);
  const [isAcceptanceTestsOpen, setIsAcceptanceTestsOpen] = useState(false);

  // Режим работы: 'map' (интерактивная карта Даму), 'search' (поисковик) или 'split' (совмещенный)
  const [activeView, setActiveView] = useState<'map' | 'search' | 'split'>('split');

  const t = translations[language];
  const isLight = theme === 'light';
  const isKk = language === 'kk';

  const handleQueryChange = (updated: Partial<UserQuery>) => {
    setQuery((prev) => ({ ...prev, ...updated }));
  };

  const handleReset = () => {
    setQuery(INITIAL_QUERY);
  };

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'neon' ? 'light' : 'neon');
  };

  const handleToggleLanguage = () => {
    setLanguage(prev => {
      if (prev === 'ru') return 'kk';
      if (prev === 'kk') return 'en';
      if (prev === 'en') return 'zh';
      return 'ru';
    });
  };

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  // Выбор региона на интерактивной карте МИО
  const handleSelectRegionFromMap = (regionName: string, level: 'city' | 'region') => {
    setQuery(prev => ({
      ...prev,
      location_name: regionName,
      location_level: level
    }));
  };

  // Выполнение приёмочного теста ТЗ
  const handleRunAcceptanceTest = (testId: string) => {
    if (testId === 'T1') {
      setQuery({
        ...INITIAL_QUERY,
        oked_code: '10.51',
        location_name: 'Алматы',
        location_level: 'city'
      });
    } else if (testId === 'T2') {
      setQuery({
        ...INITIAL_QUERY,
        oked_code: '46.73',
        location_name: 'Алматинская область',
        location_level: 'region'
      });
    } else if (testId === 'T3') {
      setQuery({
        ...INITIAL_QUERY,
        oked_code: 'C',
        location_name: 'Караганда',
        location_level: 'city'
      });
    } else if (testId === 'T4') {
      setQuery({
        ...INITIAL_QUERY,
        oked_code: '47.11',
        location_name: 'Алматы',
        location_level: 'city'
      });
    } else if (testId === 'T5') {
      setQuery({
        ...INITIAL_QUERY,
        oked_code: '25.11',
        location_name: 'Шымкент',
        location_level: 'city'
      });
    }
    setActiveView('map');
  };

  // Расчёт программ через decisionEngine
  const summary = useMemo(() => {
    return evaluatePrograms(query);
  }, [query]);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 overflow-x-hidden relative ${
      isLight 
        ? 'bg-[#F8FAFC] text-slate-900 selection:bg-neutral-200' 
        : 'bg-[#02040A] text-[#F4F7FF] selection:bg-cyan-500/20 selection:text-[#00E5FF]'
    }`}>
      {/* Декоративное мягкое неоновое фоновое свечение в темной теме */}
      {!isLight && (
        <>
          <div className="fixed top-0 left-1/4 w-[500px] h-[300px] bg-cyan-500/5 blur-[140px] pointer-events-none -z-10" />
          <div className="fixed top-1/2 right-10 w-[450px] h-[350px] bg-purple-600/5 blur-[160px] pointer-events-none -z-10" />
        </>
      )}

      {/* Шапка NC Consulting с кнопками темы, языка, карты МИО и сброса */}
      <Header 
        onReset={handleReset}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        language={language}
        onSelectLanguage={handleSelectLanguage}
        onToggleLanguage={handleToggleLanguage}
        isMapActive={activeView === 'map' || activeView === 'split'}
      />

      {/* Основной контент */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-3.5 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-7">
        
        {/* Баннер сервиса */}
        <div className={`text-left space-y-2 border-b pb-5 sm:pb-6 ${
          isLight ? 'border-neutral-200' : 'border-[#172036]'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
              isLight 
                ? 'bg-neutral-100 text-neutral-800 border-neutral-300 shadow-xs' 
                : 'bg-cyan-950/40 text-[#00E5FF] border-cyan-500/30 shadow-[0_0_12px_-2px_rgba(0,229,255,0.35)]'
            }`}>
              <Sparkles className={`w-3.5 h-3.5 ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
              <span>{t.banner.tag}</span>
            </div>

            {/* Быстрая кнопка открытия отчета */}
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isLight 
                  ? 'bg-neutral-900 hover:bg-black text-white' 
                  : 'bg-cyan-950/60 hover:bg-cyan-900/80 text-[#00E5FF] border-cyan-500/40 shadow-[0_0_10px_rgba(0,229,255,0.3)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>
                {language === 'kk' ? 'Сараптамалық есепті ашу' : language === 'en' ? 'Open Expert Report' : language === 'zh' ? '生成专家评估报告' : 'Сформировать отчёт'}
              </span>
            </button>
          </div>

          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            isLight ? 'text-neutral-900' : 'text-[#F4F7FF]'
          }`}>
            {t.banner.title}
          </h2>
          <p className={`text-xs sm:text-sm max-w-3xl leading-relaxed ${isLight ? 'text-neutral-600' : 'text-slate-400'}`}>
            {t.banner.desc}
          </p>
        </div>

        {/* Выбор способа работы: Интерактивная карта Даму vs Быстрый поиск по ОКЭД и городу */}
        <div className={`p-1.5 rounded-2xl border transition-all ${
          isLight ? 'bg-neutral-100/90 border-neutral-200' : 'bg-[#060814] border-[#172036]'
        }`}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveView('map')}
                className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeView === 'map'
                    ? isLight
                      ? 'bg-white text-neutral-950 shadow-sm border border-neutral-300'
                      : 'bg-[#00E5FF] text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                    : isLight
                      ? 'text-neutral-600 hover:text-black'
                      : 'text-slate-400 hover:text-white'
                }`}
              >
                <Map className="w-4 h-4 shrink-0" />
                <span>
                  {language === 'kk' ? '🗺️ Интерактивті карта' : language === 'en' ? '🗺️ Interactive Map' : language === 'zh' ? '🗺️ 交互式地图' : '🗺️ Интерактивная карта Даму'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('search')}
                className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeView === 'search'
                    ? isLight
                      ? 'bg-white text-neutral-950 shadow-sm border border-neutral-300'
                      : 'bg-[#00E5FF] text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                    : isLight
                      ? 'text-neutral-600 hover:text-black'
                      : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="w-4 h-4 shrink-0" />
                <span>
                  {language === 'kk' ? '🔍 Іздеу жүйесі' : language === 'en' ? '🔍 Search (OKED + City)' : language === 'zh' ? '🔍 智能检索' : '🔍 Поисковик (ОКЭД + Город)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('split')}
                className={`hidden md:flex px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all items-center justify-center gap-2 cursor-pointer ${
                  activeView === 'split'
                    ? isLight
                      ? 'bg-white text-neutral-950 shadow-sm border border-neutral-300'
                      : 'bg-[#00E5FF] text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                    : isLight
                      ? 'text-neutral-600 hover:text-black'
                      : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>
                  {language === 'kk' ? '⚡ Карта + Іздеу бірге' : language === 'en' ? '⚡ Map + Search' : language === 'zh' ? '⚡ 地图与检索并列' : '⚡ Карта + Поиск вместе'}
                </span>
              </button>
            </div>

            <div className={`px-3 py-1.5 text-[11px] font-mono rounded-xl border hidden sm:flex items-center gap-2 ${
              isLight ? 'bg-white text-neutral-600 border-neutral-200' : 'bg-[#02040A] text-slate-400 border-[#172036]'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                {activeView === 'map' 
                  ? (language === 'kk' ? '«Даму» бағдарламаларына қол жеткізу үшін картадан өңірді таңдаңыз' : language === 'en' ? 'Select a region on the map for all Damu programs' : language === 'zh' ? '在地图上选择地区即可查看全部达姆扶持政策' : 'Выбирайте регион на карте для доступа ко всем программам Даму')
                  : activeView === 'search'
                    ? (language === 'kk' ? 'Жоғарыдағы іздеуге ЭҚЖЖ мен қаланы енгізіңіз' : language === 'en' ? 'Enter OKED and city in the search inputs above' : language === 'zh' ? '请在上方检索框中输入 OKED 代码和城市' : 'Введите ОКЭД и город в поисковик сверху')
                    : (language === 'kk' ? 'Карта мен іздеу параметрлерін синхрондау' : language === 'en' ? 'Map and search parameters synchronized' : language === 'zh' ? '地图与检索参数智能联动' : 'Синхронизация карты и параметров поиска')}
              </span>
            </div>
          </div>
        </div>

        {/* 1. Поисковик параметров проекта (ОКЭД, Территория, Сумма, Цель, Инструмент) */}
        {(activeView === 'search' || activeView === 'split') && (
          <QueryInputPanel
            query={query}
            onChange={handleQueryChange}
            isBroadOked={summary.is_broad_oked}
            broadWarning={summary.broad_oked_warning}
            theme={theme}
            language={language}
          />
        )}

        {/* 2. Интерактивная карта регионов и программ Фонда «Даму» */}
        {(activeView === 'map' || activeView === 'split') && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <MioPrioritiesMap
              currentLocationName={query.location_name}
              currentOkedCode={query.oked_code}
              onSelectRegion={handleSelectRegionFromMap}
              onSelectOked={(code) => handleQueryChange({ oked_code: code })}
              onSelectDistrict={(districtName, settlementType) => handleQueryChange({ 
                location_name: districtName, 
                settlement_type: settlementType || query.settlement_type 
              })}
              theme={theme}
              language={language}
              onOpenReport={() => setIsReportOpen(true)}
              onClose={() => setActiveView('search')}
            />
          </div>
        )}

        {/* Аналитическое резюме и запуск экспертного отчёта (Реестр программ Даму снизу скрыт) */}
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
          isLight 
            ? 'bg-white border-neutral-200 shadow-sm' 
            : 'bg-[#060814]/90 border-[#172036] shadow-lg'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-cyan-950/60 text-[#00E5FF] border-cyan-500/40 shadow-[0_0_12px_rgba(0,229,255,0.3)]'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-sm font-bold ${isLight ? 'text-neutral-900' : 'text-[#F4F7FF]'}`}>
                {language === 'kk' ? 'Кешенді сараптамалық қорытынды' : language === 'en' ? 'Comprehensive Expert Assessment' : language === 'zh' ? '综合专家评估意见' : 'Комплексное экспертное заключение'}
              </div>
              <div className={`text-xs font-mono mt-0.5 ${isLight ? 'text-neutral-500' : 'text-slate-400'}`}>
                {language === 'kk' 
                  ? `Анықталған мемлекеттік қолдау шаралары: ${summary.exact_matches.length + summary.possible_matches.length} бағыт`
                  : language === 'en'
                    ? `For region ${query.location_name || 'RK'} and OKED ${query.oked_code || 'all'}, ${summary.exact_matches.length + summary.possible_matches.length} subsidized measures matched`
                    : language === 'zh'
                      ? `针对 ${query.location_name || '哈萨克斯坦全境'} 及行业代码 ${query.oked_code || '全部'}，已匹配 ${summary.exact_matches.length + summary.possible_matches.length} 项国家扶持措施`
                      : `Для региона ${query.location_name || 'РК'} и ОКЭД ${query.oked_code || 'все'} подобрано ${summary.exact_matches.length + summary.possible_matches.length} субсидируемых мер`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReportOpen(true)}
              className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98] ${
                isLight
                  ? 'bg-neutral-900 hover:bg-black text-white shadow-sm'
                  : 'bg-[#00E5FF] hover:bg-[#33ebff] text-slate-950 shadow-[0_0_20px_rgba(0,229,255,0.45)]'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>{t.form.generateReport}</span>
            </button>
          </div>
        </div>

        {/* Информационный футер с дисклеймером NC Consulting */}
        <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
          isLight 
            ? 'bg-white border-neutral-200 text-neutral-600' 
            : 'bg-[#060814] border-[#172036] text-slate-400'
        }`}>
          <strong className={isLight ? 'text-neutral-900' : 'text-slate-200'}>NC Consulting: </strong>
          {t.footer.disclaimer}
        </div>
      </main>

      {/* Модальное окно формирования экспертного заключения */}
      <ReportExportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        summary={summary}
        theme={theme}
        language={language}
      />

      {/* Модальное окно Базы Знаний Даму */}
      <KnowledgeBaseModal
        isOpen={isKnowledgeBaseOpen}
        onClose={() => setIsKnowledgeBaseOpen(false)}
        theme={theme}
      />

      {/* Модальное окно Приёмочных Тестов ТЗ */}
      <AcceptanceTestsModal
        isOpen={isAcceptanceTestsOpen}
        onClose={() => setIsAcceptanceTestsOpen(false)}
        onRunTest={handleRunAcceptanceTest}
        theme={theme}
      />
    </div>
  );
}
