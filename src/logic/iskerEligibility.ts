import { ISKER_AYMAK_MATRIX } from '../data/iskerAymakMatrix';
import { normalizeOkedCode, okedHierarchyMatches } from './okedMatcher';

export interface IskerEligibilityResult {
  matched: boolean;
  districtFound: boolean;
  matchedCode?: string;
  matchedName?: string;
  matchingDistricts?: string[];
  reason: string;
}

function normalizeTerritoryName(value: string): string {
  return (value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/^(г\.|город)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function checkIskerDistrictEligibility(
  regionId: string,
  districtName: string | undefined,
  okedCode: string
): IskerEligibilityResult {
  const records = ISKER_AYMAK_MATRIX[regionId] || [];
  const cleanOked = normalizeOkedCode(okedCode);

  if (!regionId || records.length === 0) {
    return {
      matched: false,
      districtFound: false,
      reason: 'Для выбранного региона не найдена районная матрица «Іскер аймақ».'
    };
  }

  if (!cleanOked) {
    return {
      matched: false,
      districtFound: Boolean(districtName),
      reason: 'Для проверки матрицы «Іскер аймақ» требуется код ОКЭД.'
    };
  }

  if (!districtName) {
    const matchingDistricts = records
      .filter(r => r.okeds.some(o => okedHierarchyMatches(cleanOked, o.code)))
      .map(r => r.districtName);

    return {
      matched: matchingDistricts.length > 0,
      districtFound: false,
      matchingDistricts,
      reason: matchingDistricts.length > 0
        ? `ОКЭД ${cleanOked} встречается в матрице «Іскер аймақ» выбранного региона. Для точного заключения требуется выбрать конкретный город/район.`
        : `ОКЭД ${cleanOked} не найден в районной матрице «Іскер аймақ» выбранного региона.`
    };
  }

  const target = normalizeTerritoryName(districtName);
  const district = records.find(r => {
    const candidate = normalizeTerritoryName(r.districtName);
    return candidate === target || candidate.includes(target) || target.includes(candidate);
  });

  if (!district) {
    return {
      matched: false,
      districtFound: false,
      reason: `Территория «${districtName}» не найдена в матрице «Іскер аймақ» региона.`
    };
  }

  const matchedOked = district.okeds.find(o => okedHierarchyMatches(cleanOked, o.code));
  if (!matchedOked) {
    return {
      matched: false,
      districtFound: true,
      reason: `ОКЭД ${cleanOked} не входит в приоритетный перечень «Іскер аймақ» для территории «${district.districtName}».`
    };
  }

  return {
    matched: true,
    districtFound: true,
    matchedCode: matchedOked.code,
    matchedName: matchedOked.name,
    reason: `ОКЭД ${cleanOked} соответствует группе ${matchedOked.code} «${matchedOked.name}» в матрице «Іскер аймақ» для территории «${district.districtName}».`
  };
}
