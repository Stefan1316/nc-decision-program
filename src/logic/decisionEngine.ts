import { damuKnowledgeBase } from '../data/damuDatabase';
import { DamuProgram, ProgramMatchResult, ProgramStatus, UserQuery } from '../types/damu';
import { checkOrleuEligibility } from '../data/orleuPriorityOkeds';

export interface EvaluationSummary {
  query: UserQuery;
  total_checked: number;
  exact_matches: ProgramMatchResult[];
  possible_matches: ProgramMatchResult[];
  needs_clarification: ProgramMatchResult[];
  needs_verification: ProgramMatchResult[];
  not_applicable: ProgramMatchResult[];
  is_broad_oked: boolean;
  broad_oked_warning?: string;
  identified_clarifications: string[];
}

export const REPUBLICAN_CITIES = ['алматы', 'астана', 'шымкент'];

export function normalizeOked(code: string): { cleanCode: string; isBroad: boolean; warning?: string } {
  const trimmed = code.trim();
  if (!trimmed) {
    return { cleanCode: '', isBroad: true, warning: 'Код ОКЭД не указан' };
  }

  // Единая нормализация пользовательского ввода:
  // 03,22 -> 03.22; 0322 -> 03.22; 03 22 -> 03.22.
  // Буквенные секции (A, C, G и т.д.) сохраняются как буквенный раздел.
  const compact = trimmed.replace(/\s+/g, '').replace(/,/g, '.').toUpperCase();

  if (/^[A-ZА-Я]$/i.test(compact)) {
    return {
      cleanCode: compact,
      isBroad: true,
      warning: `Указан только буквенный раздел («${compact}»). Для точного подбора программ Фонда Damu укажите детальный код ОКЭД; раздел можно использовать для предварительного анализа.`
    };
  }

  let normalized = compact;
  if (/^\d{4,5}$/.test(compact)) {
    normalized = `${compact.slice(0, 2)}.${compact.slice(2)}`;
  }

  // Оставляем только стандартный формат NN, NN.NN или NN.NNN.
  if (!/^\d{2}(?:\.\d{2,3})?$/.test(normalized)) {
    return {
      cleanCode: normalized,
      isBroad: true,
      warning: `Формат ОКЭД «${trimmed}» не распознан. Используйте, например: 03.22, 03,22, 0322 или буквенный раздел C.`
    };
  }

  if (/^\d{2}$/.test(normalized)) {
    return {
      cleanCode: normalized,
      isBroad: true,
      warning: `Указан 2-значный раздел («${normalized}»). Результат носит предварительный характер; отдельные программы требуют детальный подкласс (например, 10.51 или 46.73).`
    };
  }

  return { cleanCode: normalized, isBroad: false };
}

export function isRepublicanCity(locationName: string, level?: string): boolean {
  if (!locationName) return false;
  const lower = locationName.toLowerCase().trim();
  
  // Исключаем Алматинскую область (это область, не город республиканского значения)
  if (lower.includes('алматинская') || lower.includes('алматы облысы') || lower === 'almaty-region') {
    return false;
  }
  
  // Проверяем прямое указание на города республиканского значения
  if (
    lower.includes('астана') ||
    lower.includes('astana') ||
    lower.includes('шымкент') ||
    lower.includes('shymkent') ||
    lower === 'almaty-city' ||
    lower === 'astana-city' ||
    lower === 'shymkent-city' ||
    (lower.includes('алматы') && (level === 'city' || lower.includes('г.') || lower.includes('город') || lower.includes('қ.') || lower.includes('city') || lower === 'алматы'))
  ) {
    return true;
  }

  return false;
}

export function evaluatePrograms(query: UserQuery): EvaluationSummary {
  const { cleanCode, isBroad, warning } = normalizeOked(query.oked_code);
  const isRepCity = isRepublicanCity(query.location_name, query.location_level);
  
  const exact_matches: ProgramMatchResult[] = [];
  const possible_matches: ProgramMatchResult[] = [];
  const needs_clarification: ProgramMatchResult[] = [];
  const needs_verification: ProgramMatchResult[] = [];
  const not_applicable: ProgramMatchResult[] = [];
  const clarificationSet = new Set<string>();

  for (const prog of damuKnowledgeBase.programs) {
    const matched_reasons: string[] = [];
    const restrictions: string[] = [];
    const missing_inputs: string[] = [];
    let okedMatchLevel: string = 'compatible';

    // 1. Geography evaluation
    if (prog.id === 'damu.subsidy.isker_aymak') {
      if (isRepCity) {
        restrictions.push(`Программа «Іскер аймақ» действует исключительно в регионах, моногородах и малых городах. Города республиканского значения (${query.location_name}) исключены из программы.`);
      } else {
        matched_reasons.push(`Территория проекта (${query.location_name || 'Регион'}) соответствует условиям программы «Іскер аймақ».`);
      }
    }

    // 2. Settlement type evaluation
    if (prog.id === 'damu.loan.micro_regional') {
      if (query.settlement_type === 'village' || query.settlement_type === 'monotown') {
        matched_reasons.push(`Тип населенного пункта (${query.settlement_type === 'village' ? 'Село' : 'Моногород'}) получает максимальный приоритет и льготные условия.`);
      }
    }

    // 3. OKED evaluation
    // Special program: Inner Trade subsidy (Субсидирование внутренней торговли)
    if (prog.id === 'damu.subsidy.inner_trade' || prog.id === 'damu.subsidy.retail_trade') {
      const isTradeOked = cleanCode.startsWith('46') || cleanCode.startsWith('47') || cleanCode.startsWith('68.20');
      if (isRepCity) {
        okedMatchLevel = 'excluded';
        restrictions.push(`По официальному регламенту АО «ФРП «Даму» субсидирование ставки вознаграждения по кредитам в сфере внутренней торговли (ОКЭД 46, 47, 68.20) в городах республиканского значения (Астана, Алматы, Шымкент) НЕ ПРЕДОСТАВЛЯЕТСЯ. Поддержка внутренней торговли действует исключительно в регионах, областных центрах, моно- и малых городах и сельских населенных пунктах.`);
      } else if (isTradeOked) {
        okedMatchLevel = 'exact';
        matched_reasons.push(`ОКЭД ${cleanCode} входит в перечень внутренней торговли (разделы 46, 47) и сопутствующей аренды торговой недвижимости (68.20.3-68.20.5).`);
      } else {
        okedMatchLevel = 'excluded';
        restrictions.push(`Программа доступна исключительно для субъектов торговли (ОКЭД разделов 46, 47, а также 68.20.3-68.20.5).`);
      }
    } 
    
    // Isker Aymak priority list
    else if (prog.id === 'damu.subsidy.isker_aymak') {
      const isExcluded23 = cleanCode.startsWith('23.63');
      const isExcluded24 = ['24.10', '24.46', '24.51', '24.52'].some(ex => cleanCode.startsWith(ex));
      const oked2 = cleanCode.slice(0, 2);
      const iskerPriorityList = ['10', '11.06', '11.07', '13', '14', '15', '16', '17', '20', '21', '22', '23', '24', '25', '26', '27', '31', '32'];
      const isPriority = iskerPriorityList.some(item => cleanCode.startsWith(item) || item === oked2);

      if (isExcluded23) {
        okedMatchLevel = 'excluded';
        restrictions.push('ОКЭД 23.63 (Производство товарного бетона) прямо исключен из программы «Іскер аймақ».');
      } else if (isExcluded24) {
        okedMatchLevel = 'excluded';
        restrictions.push(`ОКЭД ${cleanCode} (первичная металлургия) исключен из программы «Іскер аймақ».`);
      } else if (isPriority) {
        okedMatchLevel = 'exact';
        matched_reasons.push(`ОКЭД ${cleanCode} входит в утвержденный приоритетный перечень отраслей обрабатывающей промышленности программы «Іскер аймақ».`);
      } else {
        okedMatchLevel = 'compatible';
        matched_reasons.push(`ОКЭД ${cleanCode} не входит в прямой приоритетный список программы «Іскер аймақ». Возможно рассмотрение по региональным квотам.`);
      }
    }

    // Agro subsidy
    else if (prog.id === 'damu.subsidy.agro_processing') {
      const isAgro = cleanCode.startsWith('10') || cleanCode.startsWith('01') || cleanCode.startsWith('11.06') || cleanCode.startsWith('11.07');
      if (isAgro) {
        okedMatchLevel = 'exact';
        matched_reasons.push(`ОКЭД ${cleanCode} относится к агропромышленному комплексу и переработке сельхозпродукции.`);
      } else {
        okedMatchLevel = 'compatible';
        matched_reasons.push(`Программа ориентирована на АПК. Требуется подтверждение связи проекта с сельхозпроизводством.`);
        missing_inputs.push('Подтверждение принадлежности проекта к субъектам АПК');
        clarificationSet.add('purpose');
      }
    }

    // Orleu Loan: Проверка по официальному Перечню приоритетных видов экономической деятельности программы «Өрлеу»
    else if (prog.id === 'damu.loan.orleu') {
      const orleuCheck = checkOrleuEligibility(cleanCode);

      if (orleuCheck.isExcluded) {
        okedMatchLevel = 'excluded';
        restrictions.push(orleuCheck.exclusionReason || `ОКЭД ${cleanCode} исключен из программы «Өрлеу».`);
      } else if (orleuCheck.matched) {
        okedMatchLevel = 'exact';
        matched_reasons.push(orleuCheck.reason || `ОКЭД ${cleanCode} входит в утвержденный перечень приоритетных отраслей программы «Өрлеу».`);
      } else {
        const okedNum = parseInt(cleanCode.slice(0, 2), 10);
        const isMfg = !isNaN(okedNum) && okedNum >= 10 && okedNum <= 33;
        if (isMfg) {
          okedMatchLevel = 'compatible';
          matched_reasons.push(`ОКЭД ${cleanCode} относится к обрабатывающей промышленности (раздел ${okedNum}). Требуется подтверждение соответствия детальному перечню программы «Өрлеу».`);
        } else {
          okedMatchLevel = 'excluded';
          restrictions.push(`ОКЭД ${cleanCode} не входит в утвержденный перечень приоритетных направлений «Өрлеу» (обрабатывающая промышленность, транспорт и логистика).`);
        }
      }
    }

    // Orleu Leasing: Секция C (ОКЭД 10-33) + транспорт и спецтехника программы «Өрлеу»
    else if (prog.id === 'damu.leasing.orleu') {
      const orleuCheck = checkOrleuEligibility(cleanCode);

      if (orleuCheck.isExcluded) {
        okedMatchLevel = 'excluded';
        restrictions.push(orleuCheck.exclusionReason || `ОКЭД ${cleanCode} исключен из программы «Өрлеу-Лизинг».`);
      } else if (orleuCheck.matched) {
        okedMatchLevel = 'exact';
        matched_reasons.push(orleuCheck.reason || `ОКЭД ${cleanCode} входит в перечень приоритетных видов деятельности «Өрлеу-Лизинг».`);
      } else {
        const isAlcohol = ['11.01', '11.02', '11.03', '11.04', '11.05'].some(ex => cleanCode.startsWith(ex));
        const isTobacco = cleanCode.startsWith('12');
        const isWeapons = cleanCode.startsWith('25.4');

        if (isAlcohol || isTobacco || isWeapons) {
          okedMatchLevel = 'excluded';
          restrictions.push(`Производство подакцизной продукции или оружия (${cleanCode}) прямо исключено из программы «Өрлеу-Лизинг».`);
        } else {
          const okedNum = parseInt(cleanCode.slice(0, 2), 10);
          if (!isNaN(okedNum) && okedNum >= 10 && okedNum <= 33) {
            okedMatchLevel = 'compatible';
            matched_reasons.push(`ОКЭД ${cleanCode} относится к Секции C «Обрабатывающая промышленность».`);
          } else {
            okedMatchLevel = 'excluded';
            restrictions.push(`Программа «Өрлеу-Лизинг» поддерживает исключительно обрабатывающую промышленность и транспортную инфраструктуру.`);
          }
        }
      }
    }

    // Social enterprise programs
    else if (prog.id.includes('.social')) {
      okedMatchLevel = 'social_only';
      matched_reasons.push('Без отраслевых ограничений при наличии статуса в реестре социального предпринимательства.');
      if (query.social_enterprise_registry === false) {
        restrictions.push('Требуется обязательное нахождение в Реестре субъектов социального предпринимательства.');
      } else if (query.social_enterprise_registry === true) {
        matched_reasons.push('Включение в Реестр субъектов социального предпринимательства подтверждено.');
      } else {
        missing_inputs.push('Наличие записи в реестре субъектов социального предпринимательства');
        clarificationSet.add('social_enterprise_registry');
      }
    }

    // General Damu programs (Guarantee Fund 1, EKP Micro/SME/Large)
    else {
      okedMatchLevel = 'compatible';
      matched_reasons.push('Программа доступна для широкого круга субъектов частного предпринимательства.');
    }

    // 4. Clarification Evaluation (Step 2 checks if filled)
    if (query.tax_arrears === true) {
      if (prog.id === 'damu.loan.orleu' || prog.id === 'damu.leasing.orleu' || prog.id.includes('guarantee_fund')) {
        restrictions.push('Наличие непогашенной налоговой задолженности прямо запрещает участие в данной программе.');
      }
    }

    if (query.overdue_debt_days && query.overdue_debt_days > 60) {
      if (prog.id === 'damu.loan.orleu') {
        restrictions.push(`Просроченная задолженность свыше 60 дней (${query.overdue_debt_days} дн.) исключает финансирование по программе «Өрлеу».`);
      }
    }

    if (query.operating_years !== null && query.operating_years !== undefined) {
      if (prog.id === 'damu.leasing.orleu' && query.operating_years < 1) {
        restrictions.push('Для «Өрлеу-Лизинг» требуется не менее одного полного операционного календарного года деятельности.');
      }
    }

    if (query.amount_kzt && prog.amount_max_kzt) {
      if (query.amount_kzt > prog.amount_max_kzt) {
        restrictions.push(`Запрашиваемая сумма (${(query.amount_kzt / 1e6).toLocaleString('ru-RU')} млн тг) превышает максимальный лимит программы (${prog.amount_max_text}).`);
      }
    }

    if (prog.id === 'damu.guarantee.guarantee_fund_2' && query.amount_kzt) {
      if (query.amount_kzt <= 1000000000) {
        restrictions.push(`Сумма кредита до 1 млрд тенге обслуживается по базовой программе «Гарантийный фонд 1». Фонд 2 предназначен для крупных займов от 1 до 7 млрд тенге.`);
      }
    }

    // 5. Final Status Calculation
    let status: ProgramStatus = 'possible_match';
    let status_label_ru = 'Возможное соответствие';

    if (restrictions.length > 0 && restrictions.some(r => r.includes('исключен') || r.includes('запрещает') || r.includes('превышает') || r.includes('исключает'))) {
      status = 'not_applicable';
      status_label_ru = 'Не применимо';
    } else if (okedMatchLevel === 'exact' && restrictions.length === 0) {
      status = 'exact_match';
      status_label_ru = 'Точное соответствие';
    } else if (okedMatchLevel === 'excluded') {
      status = 'not_applicable';
      status_label_ru = 'Не применимо';
    } else if (missing_inputs.length > 0) {
      status = 'needs_clarification';
      status_label_ru = 'Требуется уточнение';
    } else if (okedMatchLevel === 'verification_needed') {
      status = 'needs_verification';
      status_label_ru = 'Требуется верификация';
    } else {
      status = 'possible_match';
      status_label_ru = 'Возможное соответствие';
    }

    const result: ProgramMatchResult = {
      program: prog,
      status,
      status_label_ru,
      matched_reasons,
      restrictions,
      missing_inputs,
      confidence: prog.data_quality === 'high' ? 'high' : 'medium',
      sources: prog.sources
    };

    if (status === 'exact_match') exact_matches.push(result);
    else if (status === 'possible_match') possible_matches.push(result);
    else if (status === 'needs_clarification') needs_clarification.push(result);
    else if (status === 'needs_verification') needs_verification.push(result);
    else not_applicable.push(result);
  }

  return {
    query,
    total_checked: damuKnowledgeBase.programs.length,
    exact_matches,
    possible_matches,
    needs_clarification,
    needs_verification,
    not_applicable,
    is_broad_oked: isBroad,
    broad_oked_warning: warning,
    identified_clarifications: Array.from(clarificationSet)
  };
}
