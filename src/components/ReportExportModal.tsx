import React, { useState } from 'react';
import { EvaluationSummary, isRepublicanCity } from '../logic/decisionEngine';
import { generateDocxReport, CoreProgramExport } from '../logic/docxExport';
import { checkOrleuEligibility } from '../data/orleuPriorityOkeds';
import { 
  X, Copy, Check, Download, FileText, 
  ExternalLink, Sparkles, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { ThemeMode, Language, translations } from '../i18n/translations';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: EvaluationSummary;
  theme?: ThemeMode;
  language?: Language;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({ 
  isOpen, 
  onClose, 
  summary,
  theme = 'neon',
  language = 'ru'
}) => {
  const [copied, setCopied] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  if (!isOpen) return null;

  const t = translations[language].report;
  const isLight = theme === 'light';
  const { query } = summary;

  // Определение расшифровки названия кода ОКЭД
  const cleanCode = query.oked_code.trim();
  const orleuCheck = checkOrleuEligibility(cleanCode);

  let okedName = query.oked_code;
  if (orleuCheck.matchedItem) {
    okedName = `${cleanCode} — ${orleuCheck.matchedItem.name} (${orleuCheck.matchedItem.section})`;
  } else if (cleanCode.startsWith('68.20.3')) {
    okedName = language === 'kk' 
      ? '68.20.3 — Өз немесе жалға алынған коммерциялық сауда жылжымайтын мүлікті жалға беру және қосалқы жалға беру' 
      : '68.20.3 — Аренда и субаренда собственной или арендованной коммерческой торговой недвижимости';
  } else if (cleanCode.startsWith('68.20')) {
    okedName = language === 'kk' ? '68.20 — Жылжымайтын мүлікті жалға беру және басқару' : '68.20 — Аренда и управление недвижимостью';
  } else if (cleanCode.startsWith('46')) {
    okedName = language === 'kk' ? `${cleanCode} — Көтерме сауда` : `${cleanCode} — Оптовая торговля`;
  } else if (cleanCode.startsWith('47')) {
    okedName = language === 'kk' ? `${cleanCode} — Бөлшек сауда` : `${cleanCode} — Розничная торговля`;
  } else if (cleanCode.startsWith('10')) {
    okedName = language === 'kk' ? `${cleanCode} — Тамақ өнімдерін өндіру және қайта өңдеу / АӨК` : `${cleanCode} — Переработка и производство продуктов питания / АПК`;
  } else if (cleanCode.startsWith('25')) {
    okedName = language === 'kk' ? `${cleanCode} — Құрылыс металл конструкцияларын өндіру` : `${cleanCode} — Производство строительных металлоконструкций`;
  }

  const oked2 = cleanCode.slice(0, 2);

  // 1. ПРОВЕРКА ПРОХОЖДЕНИЯ ПРОГРАММ ПО ПРЕДОСТАВЛЕННЫМ ДАННЫМ:
  const isRepCity = isRepublicanCity(query.location_name, query.location_level);

  const isExcluded23 = cleanCode.startsWith('23.63');
  const isExcluded24 = ['24.10', '24.46', '24.51', '24.52'].some(ex => cleanCode.startsWith(ex));
  const iskerPriorityList = ['10', '11.06', '11.07', '13', '14', '15', '16', '17', '20', '21', '22', '23', '24', '25', '26', '27', '31', '32'];
  const isIskerPass = !isRepCity && !isExcluded23 && !isExcluded24 && (
    iskerPriorityList.some(item => cleanCode.startsWith(item) || item === oked2)
  );

  const isTradeOked = cleanCode.startsWith('46') || cleanCode.startsWith('47') || cleanCode.startsWith('68.20');
  // В городах республиканского значения (Астана, Алматы, Шымкент) субсидирование торговли НЕ РАБОТАЕТ!
  const isTradePass = isTradeOked && !isRepCity;

  const isGf1Pass = !cleanCode.startsWith('25.4') && !cleanCode.startsWith('12') && !['11.01', '11.02', '11.03', '11.04', '11.05'].some(ex => cleanCode.startsWith(ex));

  // Проверка «Өрлеу» по официальному Перечню приоритетных видов экономической деятельности Damu
  const isOrleuPass = orleuCheck.matched && !orleuCheck.isExcluded;
  const orleuJustification = orleuCheck.matchedItem
    ? `${orleuCheck.matchedItem.section}: ОКЭД ${cleanCode} входит в перечень «${orleuCheck.matchedItem.name}».`
    : (language === 'kk' ? 'Өңдеу өнеркәсібі немесе көлік инфрақұрылымы бойынша сәйкестік расталды.' : 'Подтверждено соответствие перечню обрабатывающей промышленности или транспорта.');

  // Кандидаты программ
  const candidateCorePrograms: CoreProgramExport[] = [
    {
      id: 'isker_aymak',
      title: language === 'kk' 
        ? '«Іскер аймақ» бағдарламасы (Шағын бизнесті қолдаудың бірыңғай бағдарламасы)' 
        : 'Программа «Іскер аймақ» (Единая программа поддержки малого бизнеса)',
      category: language === 'kk' ? 'Сыйақы мөлшерлемесін субсидиялау' : 'Субсидирование ставки вознаграждения',
      applicable: isIskerPass,
      limit: language === 'kk' ? '200 млн теңгеге дейін' : 'до 200 млн тенге',
      rate: language === 'kk' 
        ? 'Номиналды мөлшерлеменің 40%-ы субсидияланады (әлеуметтік бизнес үшін 50%). Қарыз алушы үшін 12,6%-дан кем емес'
        : 'Субсидируется 40% от номинальной ставки (50% для соц. бизнеса). Конечная ставка заёмщика не менее 12,6%',
      term: language === 'kk' ? '3 жылға дейін' : 'до 3 лет',
      purposes: language === 'kk' ? 'Инвестициялар; айналым қаражатын толықтыру' : 'Инвестиции; пополнение оборотных средств',
      financier: language === 'kk' 
        ? 'ҚР екінші деңгейдегі банктері (Halyk, Forte, ЦентрКредит, Bereke, Jusan ж.б.) «ДАМУ» КДҚ» АҚ-мен серіктестікте'
        : 'Банки второго уровня РК (Halyk, Forte, ЦентрКредит, Bereke, Jusan и др.) в партнёрстве с АО «ФРП «ДАМУ»',
      sourceId: 'SRC-ISKER',
      url: 'https://damu.kz/ru/programmi/subsidy/isker_aymak',
      note: isRepCity
        ? (language === 'kk' 
            ? 'Шектеу: Республикалық маңызы бар қалалар (Астана, Алматы, Шымкент) «Іскер аймақ» бағдарламасына қатыспайды.'
            : 'Исключено регламентом Даму: программа «Іскер аймақ» действует исключительно в регионах, моногородах и малых городах (Астана, Алматы, Шымкент исключены).')
        : (language === 'kk' ? 'ЭҚЖЖ бағдарламаның басым салалық тізіміне сәйкес келеді.' : 'ОКЭД соответствует приоритетному отраслевому списку программы.')
    },
    {
      id: 'inner_trade',
      title: language === 'kk' 
        ? 'Субсидияланатын сауда саласы (Ішкі сауда субъектілерін қолдау)' 
        : 'Субсидируемая сфера торговли (Поддержка субъектов внутренней торговли)',
      category: language === 'kk' ? 'Пайыздық мөлшерлемені субсидиялау' : 'Субсидирование процентной ставки',
      applicable: isTradePass,
      limit: language === 'kk' ? '3 млрд теңгеге дейін' : 'до 3 млрд тенге',
      rate: language === 'kk'
        ? 'Номиналды мөлшерлеменің 40%-ы субсидияланады; субъект үшін 12,6%-дан кем емес'
        : 'Субсидируется 40% от номинальной ставки; ставка субъекта не менее 12,6%',
      term: language === 'kk' ? 'Инвестициялар — 5 жылға дейін; айналым қаражаты — 3 жылға дейін' : 'Инвестиции — до 5 лет; оборотные средства — до 3 лет',
      purposes: language === 'kk'
        ? 'Инвестициялар; қазақстандық тауар өндірушілерден тауарлар, шикізат пен материалдар сатып алуға АҚТ'
        : 'Инвестиции; ПОС товаров, сырья и материалов у казахстанских товаропроизводителей из Реестра',
      financier: language === 'kk' ? 'ҚР ЕДБ + «Даму» Қоры' : 'Банки второго уровня РК + Фонд «Даму»',
      sourceId: 'SRC-INNER-TRADE',
      url: 'https://damu.kz/ru/programmi/subsidy/inner_support',
      note: isRepCity
        ? (language === 'kk' 
            ? 'Шектеу: Республикалық маңызы бар қалаларда (Астана, Алматы, Шымкент) ішкі сауданы субсидиялау Даму регламенті бойынша қолданылмайды.'
            : 'Исключено регламентом Даму: в городах республиканского значения (Астана, Алматы, Шымкент) субсидирование процентной ставки в сфере внутренней торговли не предоставляется.')
        : (language === 'kk' 
            ? 'ЭҚЖЖ расталды: көтерме / бөлшек сауда және сауда коммерциялық жылжымайтын мүлікті субарендалау.' 
            : 'ОКЭД подтверждён: оптовая / розничная торговля и субаренда коммерческой торговой недвижимости.')
    },
    {
      id: 'guarantee_fund_1',
      title: language === 'kk' 
        ? '7 млрд теңгеге дейінгі кепілдік қамтамасыз ету (1-ші Кепілдік қоры)' 
        : 'Гарантия залога до 7 млрд тенге (Гарантийный фонд 1)',
      category: language === 'kk' ? 'Несиелерге мемлекеттік кепілдік беру' : 'Государственное гарантирование кредитов',
      applicable: isGf1Pass,
      limit: language === 'kk' ? 'Несие 7 млрд теңгеге дейін; Damu кепілдік мөлшері 85%-ға дейін (3,5 млрд теңгеге дейін)' : 'Кредит до 7 млрд тенге; размер гарантии Damu до 85% (до 3,5 млрд тенге)',
      rate: language === 'kk' ? 'Кепілдік сомасынан 1,5% комиссия (біржолғы және қалдықтан жыл сайын)' : 'Комиссия 1,5% от суммы гарантии (единовременно и ежегодно от остатка)',
      term: language === 'kk' ? 'Кепілдік мерзімі — несие мерзімі + 5 ай' : 'Срок гарантии — срок кредита + 5 месяцев',
      purposes: language === 'kk' ? 'Инвестициялар; айналым қаражаты; қайта қаржыландыру' : 'Инвестиции; пополнение оборотных средств; рефинансирование',
      financier: language === 'kk' ? 'Екінші деңгейдегі банктер («Даму» Қорының жедел мақұлдауымен)' : 'Банки второго уровня (быстрое одобрение Фонда «Даму»)',
      sourceId: 'SRC-GF1',
      url: 'https://damu.kz/ru/programmi/guarantee/guarantee_funds_support/guarantee_fund',
      note: language === 'kk' ? 'Банк алдындағы бизнестің кепілдік қамтамасыз ету тапшылығының 85%-на дейін жабады.' : 'Покрывает до 85% дефицита залогового обеспечения бизнеса перед банком.'
    },
    {
      id: 'orleu_and_leasing',
      title: language === 'kk' 
        ? '«Өрлеу» және қаржылық лизинг (Жеңілдікті несиелеу және лизингтік мәмілелер)' 
        : '«Өрлеу» и финансовый лизинг (Льготное кредитование и лизинговые сделки)',
      category: language === 'kk' ? 'Жеңілдікті тікелей қорландыру / Жабдық лизингі' : 'Льготное прямое фондирование / Лизинг оборудования',
      applicable: isOrleuPass,
      limit: language === 'kk' ? '«Өрлеу» несиелеуі: 7 млрд теңгеге дейін; «Өрлеу» лизингі: ШОҚ үшін 1 млн-нан 500 млн теңгеге дейін' : 'Кредитование «Өрлеу»: до 7 млрд тенге; Лизинг «Өрлеу»: от 1 млн до 500 млн тенге на СМСП',
      rate: language === 'kk' ? 'Бекітілген жеңілдікті мөлшерлеме: жылдық 12,6%' : 'Фиксированная льготная ставка: 12,6% годовых',
      term: language === 'kk' ? 'Инвестициялық несиелер: 120 айға дейін; Лизинг: 36–60 ай' : 'Кредиты на инвестиции: до 120 месяцев; Лизинг: 36–60 месяцев',
      purposes: language === 'kk' ? 'Отандық немесе шетелдік жабдықтарды, арнайы техниканы сатып алу және қуаттарды жаңғырту' : 'Приобретение отечественного или импортного оборудования, спецтехники и модернизация мощностей',
      financier: language === 'kk' ? 'Лизингтік компаниялар, МҚҰ және Damu Қорының серіктес ЕДБ' : 'Лизинговые компании, МФО с лизинговой лицензией и БВУ-партнёры Фонда Damu',
      sourceId: 'SRC-ORLEU',
      url: 'https://damu.kz/ru/programmi/loans/orleu',
      note: orleuJustification
    }
  ];

  const passedCorePrograms = candidateCorePrograms.filter(p => p.applicable);

  const handleDownloadDocx = async () => {
    try {
      setIsExportingDocx(true);
      const blob = await generateDocxReport(query, okedName, passedCorePrograms);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `NC_Decision_Report_${query.oked_code}_${query.location_name || 'RK'}.docx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate DOCX', err);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const markdownReport = `
# ${t.title}
*${t.subtitle} (${new Date().toLocaleDateString(language === 'kk' ? 'kk-KZ' : 'ru-RU')})*

### ${t.paramsTitle}
- **${t.okedLabel}** \`${query.oked_code}\` (${okedName})
- **${t.territoryLabel}** ${query.location_name || (language === 'kk' ? 'Көрсетілмеген' : 'Не указана')} (${query.location_level === 'city' ? (language === 'kk' ? 'Қала' : 'Город') : (language === 'kk' ? 'Облыс' : 'Область')})
- **${t.financierLabel}** ${t.financierValue}

---

### ${t.programsTitle}
${passedCorePrograms.map((p, i) => `
#### ${i + 1}. ${p.title}
- **${language === 'kk' ? 'Санаты:' : 'Категория:'}** ${p.category}
- **${t.limitLabel}** ${p.limit}
- **${t.rateLabel}** ${p.rate}
- **${t.termPurposeLabel}** ${p.term} | ${p.purposes}
- **${t.whoFinancesLabel}** ${p.financier}
- **${t.justificationLabel}** ${p.note}
- **${t.officialSource}** [${p.sourceId}](${p.url})
`).join('\n')}

---
*${t.legalNoteDesc}*
`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`border rounded-2xl w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${
        isLight 
          ? 'bg-white border-neutral-300 text-neutral-900 shadow-neutral-400/30' 
          : 'bg-[#060814] border-[#172036] text-[#F4F7FF] shadow-[0_0_50px_rgba(0,0,0,0.9)]'
      }`}>
        
        {/* Шапка отчёта */}
        <div className={`px-4 sm:px-6 py-4 border-b flex items-center justify-between gap-3 ${
          isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-[#02040A] border-[#172036]'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <FileText className={`w-5 h-5 shrink-0 ${isLight ? 'text-black' : 'text-[#00E5FF]'}`} />
            <div className="min-w-0">
              <h2 className={`text-sm sm:text-base font-bold tracking-tight truncate ${isLight ? 'text-neutral-900' : 'text-[#F4F7FF]'}`}>
                {t.title}
              </h2>
              <span className={`text-xs font-mono truncate block ${isLight ? 'text-neutral-500' : 'text-slate-400'}`}>
                OKED: {query.oked_code} · {query.location_name || (language === 'kk' ? 'Қазақстан' : language === 'en' ? 'Kazakhstan' : language === 'zh' ? '哈萨克斯坦' : 'Казахстан')}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 touch-manipulation active:scale-95 ${
              isLight 
                ? 'text-neutral-500 hover:text-black hover:bg-neutral-200' 
                : 'text-[#94A3B8] hover:text-[#F4F7FF] hover:bg-[#201850]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Тело отчёта */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
          
          {/* Сводка параметров */}
          <div className={`p-3.5 sm:p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs ${
            isLight 
              ? 'bg-neutral-50 border-neutral-200' 
              : 'bg-[#080A1A]/80 border-[#2A2360]'
          }`}>
            <div className="space-y-0.5">
              <span className={`text-[11px] ${isLight ? 'text-neutral-500' : 'text-[#94A3B8]'}`}>
                {t.okedLabel}
              </span>
              <div className={`font-mono font-bold text-sm ${isLight ? 'text-neutral-900' : 'text-[#00E5FF]'}`}>
                {query.oked_code}
              </div>
              <span className={`text-[11px] block leading-tight ${isLight ? 'text-neutral-600' : 'text-slate-400'}`}>
                {okedName}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className={`text-[11px] ${isLight ? 'text-neutral-500' : 'text-[#94A3B8]'}`}>
                {t.territoryLabel}
              </span>
              <div className={`font-medium ${isLight ? 'text-neutral-900' : 'text-[#F4F7FF]'}`}>
                {query.location_name || (language === 'kk' ? 'Көрсетілмеген' : language === 'en' ? 'Not specified' : language === 'zh' ? '未指定' : 'Не указана')}
              </div>
              <span className={`text-[11px] font-mono block ${isLight ? 'text-blue-600' : 'text-[#2F8BFF]'}`}>
                {query.location_level === 'city' ? (language === 'kk' ? 'Қала (city)' : language === 'en' ? 'City' : language === 'zh' ? '城市' : 'Город (city)') : (language === 'kk' ? 'Облыс (region)' : language === 'en' ? 'Region' : language === 'zh' ? '州' : 'Область (region)')}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className={`text-[11px] ${isLight ? 'text-neutral-500' : 'text-[#94A3B8]'}`}>
                {t.whoFinancesLabel}
              </span>
              <div className={`font-medium flex items-center gap-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>БВУ РК + Фонд «Даму»</span>
              </div>
              <span className={`text-[11px] block ${isLight ? 'text-neutral-500' : 'text-[#94A3B8]'}`}>
                Halyk, Forte, БЦК, Bereke, Jusan
              </span>
            </div>
          </div>

          {/* Предупреждение об исключении торговли в городах республиканского значения */}
          {isRepCity && isTradeOked && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
              isLight 
                ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs' 
                : 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            }`}>
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
              <div className="space-y-1">
                <strong className="block font-bold">
                  {language === 'kk' 
                    ? 'Аумақтық шектеу: Республикалық маңызы бар қала (Астана / Алматы / Шымкент)'
                    : language === 'en'
                      ? `Territorial restriction: City of republican significance (${query.location_name})`
                      : language === 'zh'
                        ? `区域政策限制：直辖市（${query.location_name}）`
                        : `Ограничение локализации: Город республиканского значения (${query.location_name})`}
                </strong>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {language === 'kk'
                    ? '«Даму» Қорының ресми ережесі бойынша ішкі сауда саласындағы (ЭҚЖЖ 46, 47, 68.20) несиелердің сыйақы мөлшерлемесін субсидиялау Астана, Алматы және Шымкент қалаларында ҚОЛДАНЫЛМАЙДЫ. Сауда бойынша жеңілдіктер тек облыстарда, моноқалаларда және ауылдық аумақтарда жұмыс істейді. Республикалық маңызы бар қалалардағы сауда субъектілері үшін 85%-ға дейінгі несие кепілдігі (1-ші Кепілдік қоры) қолжетімді, бірақ пайыздық мөлшерлемені субсидиялау берілмейді.'
                    : language === 'en'
                      ? 'According to official regulations of Damu Fund, interest rate subsidies for internal trade loans (OKED 46, 47, 68.20) ARE NOT PROVIDED in cities of republican significance (Astana, Almaty, Shymkent). Trade subsidy programs operate strictly in regional areas, monotowns, and rural areas. For trade enterprises in republican cities, loan guarantees are available (Damu Guarantee Fund 1 up to 85%), but interest rate subsidies are excluded.'
                      : language === 'zh'
                        ? '根据哈萨克斯坦“达姆”基金官方规程，针对国内商业贸易领域贷款（OKED代码 46, 47, 68.20）的利率贴息政策在直辖市（阿斯塔纳、阿拉木图、奇姆肯特）不予执行。贸易贴息政策仅在各州、单一产业城市及农村地区实施。直辖市内的商贸企业可申请达姆第一担保基金（最高85%的抵押贷款担保），但无法享受贷款利息贴息。'
                        : `По официальному регламенту АО «ФРП «Даму» субсидирование процентной ставки по кредитам в сфере внутренней торговли (ОКЭД 46, 47, 68.20) в городах Астана, Алматы и Шымкент НЕ ПРЕДОСТАВЛЯЕТСЯ. Программа субсидирования торговли действует исключительно в областях, моногородах и сельских населенных пунктах. Для торговых предприятий в городах республиканского значения доступно гарантирование займов (Гарантийный фонд 1 Даму до 85%), но не субсидирование ставки.`}
                </p>
              </div>
            </div>
          )}

          {/* ЦЕЛЕВЫЕ ПРОГРАММЫ ПО ПРЕДОСТАВЛЕННЫМ ДАННЫМ */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <h3 className={`text-xs sm:text-sm font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-neutral-900' : 'text-[#00E5FF]'
              }`}>
                <Sparkles className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isLight ? 'text-amber-500' : 'text-[#8B5CFF]'}`} />
                <span>{t.programsTitle}</span>
              </h3>
              <span className={`text-[11px] sm:text-xs font-mono ${isLight ? 'text-neutral-500' : 'text-[#94A3B8]'}`}>
                {passedCorePrograms.length} {passedCorePrograms.length === 1 ? t.programsCountOne : t.programsCount}
              </span>
            </div>

            {passedCorePrograms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {passedCorePrograms.map((prog, idx) => (
                  <div 
                    key={prog.id}
                    className={`p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between space-y-2.5 sm:space-y-3 transition-all ${
                      isLight 
                        ? 'bg-neutral-50 border-neutral-300 hover:border-black' 
                        : 'bg-[#080A1A] border-[#8B5CFF]/30 hover:border-[#8B5CFF]'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className={`flex items-center justify-between gap-2 border-b pb-2 ${
                        isLight ? 'border-neutral-200' : 'border-[#2A2360]'
                      }`}>
                        <span className={`text-[10px] sm:text-[11px] font-mono uppercase tracking-wider truncate ${
                          isLight ? 'text-amber-700 font-semibold' : 'text-[#CBA13A]'
                        }`}>
                          #{idx + 1} {prog.category}
                        </span>
                        <a
                          href={prog.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className={`text-[11px] font-mono flex items-center gap-1 shrink-0 ${
                            isLight ? 'text-blue-600 hover:text-black' : 'text-[#2F8BFF] hover:text-[#00E5FF]'
                          }`}
                        >
                          <span>{prog.sourceId}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <h4 className={`text-xs sm:text-sm font-bold leading-snug ${isLight ? 'text-neutral-900' : 'text-[#F4F7FF]'}`}>
                        {prog.title}
                      </h4>

                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className={`text-[11px] block ${isLight ? 'text-neutral-500' : 'text-[#94A3B8]'}`}>
                            {t.limitLabel}
                          </span>
                          <strong className={`font-mono text-xs ${isLight ? 'text-neutral-900 font-extrabold' : 'text-[#00E5FF]'}`}>
                            {prog.limit}
                          </strong>
                        </div>

                        <div>
                          <span className={`text-[11px] block ${isLight ? 'text-neutral-500' : 'text-[#94A3B8]'}`}>
                            {t.rateLabel}
                          </span>
                          <span className={`leading-relaxed block ${isLight ? 'text-neutral-700' : 'text-slate-300'}`}>
                            {prog.rate}
                          </span>
                        </div>

                        <div>
                          <span className={`text-[11px] block ${isLight ? 'text-neutral-500' : 'text-[#94A3B8]'}`}>
                            {t.termPurposeLabel}
                          </span>
                          <span className={`leading-relaxed block ${isLight ? 'text-neutral-700' : 'text-slate-300'}`}>
                            {prog.term} · {prog.purposes}
                          </span>
                        </div>

                        <div>
                          <span className={`text-[11px] block ${isLight ? 'text-neutral-500' : 'text-[#94A3B8]'}`}>
                            {t.whoFinancesLabel}
                          </span>
                          <span className={`leading-relaxed block ${isLight ? 'text-neutral-700' : 'text-slate-300'}`}>
                            {prog.financier}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`pt-2 border-t text-[11px] ${
                      isLight ? 'border-neutral-200 text-neutral-500' : 'border-[#2A2360]/60 text-[#94A3B8]'
                    }`}>
                      {prog.note}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-4 rounded-xl border text-xs ${
                isLight ? 'bg-neutral-50 border-neutral-200 text-neutral-600' : 'bg-[#080A1A] border-[#2A2360] text-[#94A3B8]'
              }`}>
                {t.noPrograms}
              </div>
            )}
          </div>
        </div>

        {/* Подвал отчёта */}
        <div className={`px-4 sm:px-6 py-3 sm:py-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-xs ${
          isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-[#080A1A] border-[#2A2360]'
        }`}>
          <span className={`hidden sm:inline ${isLight ? 'text-neutral-500' : 'text-[#94A3B8]'}`}>
            NC Consulting · {t.subtitle}
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopy}
              className={`flex-1 sm:flex-initial justify-center px-3.5 py-2.5 sm:py-2 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer touch-manipulation active:scale-95 ${
                isLight 
                  ? 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-300' 
                  : 'bg-[#201850] hover:bg-[#2A2360] text-[#F4F7FF] border-[#8B5CFF]/30'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Copy className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-black' : 'text-[#00E5FF]'}`} />}
              <span className="text-xs">{copied ? t.copiedBtn : t.copyBtn}</span>
            </button>

            {/* Скачать DOCX файл */}
            <button
              onClick={handleDownloadDocx}
              disabled={isExportingDocx}
              className={`flex-1 sm:flex-initial justify-center px-4 py-2.5 sm:py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-bold disabled:opacity-50 touch-manipulation active:scale-95 ${
                isLight
                  ? 'bg-neutral-900 hover:bg-black text-white shadow-sm'
                  : 'bg-[#00E5FF] hover:bg-[#33ebff] text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
              }`}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="text-xs">{isExportingDocx ? t.generatingDocx : t.downloadDocxBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
