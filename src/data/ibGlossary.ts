import type { Direction, GlossaryCategory, GlossaryItem, KeyTermPair } from '../types'

export const GLOSSARY_CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  evaluation: '평가 방문 · 기준',
  curriculum: 'DP 교육과정 · 수업',
  assessment: '평가 · 학사 정책',
  pyoseon: '표선고 · 제주 공교육',
  custom: '사용자 추가 용어',
}

export const DEFAULT_IB_GLOSSARY: GlossaryItem[] = [
  // 평가 방문 · 기준 (Evaluation Visit & PSP)
  {
    id: 'eval-1',
    en: 'Programme Evaluation Visit',
    ko: '프로그램 평가 방문',
    category: 'evaluation',
    note: 'IB 월드스쿨 승인 후 5년 주기 공식 방문 평가',
  },
  {
    id: 'eval-2',
    en: 'Programme Standards and Practices',
    ko: '프로그램 기준과 실천',
    abbr: 'PSP',
    category: 'evaluation',
    note: 'IB 학교 운영의 핵심 준거 프레임워크',
  },
  {
    id: 'eval-3',
    en: 'Self-Study Questionnaire',
    ko: '자체평가 설문·보고서',
    abbr: 'SSQ',
    category: 'evaluation',
    note: '학교 구성원이 사전 작성·제출하는 성찰 보고서',
  },
  {
    id: 'eval-4',
    en: 'Programme Development Plan',
    ko: '프로그램 발전 계획',
    abbr: 'PDP',
    category: 'evaluation',
    note: '학교가 설정한 중점 개선 과제와 실행 계획',
  },
  {
    id: 'eval-5',
    en: 'Visiting Team',
    ko: '방문 평가단',
    category: 'evaluation',
    note: 'Evaluation Leader 및 Programme Leader로 구성',
  },
  {
    id: 'eval-6',
    en: 'Evaluation Leader',
    ko: '평가단장',
    category: 'evaluation',
  },
  {
    id: 'eval-7',
    en: 'Pedagogical Leadership Team',
    ko: '교육 리더십팀',
    abbr: 'PLT',
    category: 'evaluation',
    note: '교장, 교감, DP 코디네이터 등 교육과정 운영 핵심 리더십',
  },
  {
    id: 'eval-8',
    en: 'Matters to be Addressed',
    ko: '시정·보완 필요 사항',
    category: 'evaluation',
    note: 'IB 기준 충족을 위해 기한 내 보완해야 하는 공식 사항',
  },
  {
    id: 'eval-9',
    en: 'Commendations and Recommendations',
    ko: '우수 사례 및 권고 사항',
    category: 'evaluation',
  },
  {
    id: 'eval-10',
    en: 'Classroom Observation',
    ko: '수업 참관',
    category: 'evaluation',
  },
  {
    id: 'eval-11',
    en: 'Evidence-based Reflection',
    ko: '근거 기반 성찰',
    category: 'evaluation',
  },

  // DP 교육과정 · 수업 (Curriculum & Pedagogy)
  {
    id: 'curr-1',
    en: 'Diploma Programme',
    ko: '디플로마 프로그램',
    abbr: 'DP',
    category: 'curriculum',
    note: '고등학교 2~3학년 과정(만 16~19세) IB 교육과정',
  },
  {
    id: 'curr-2',
    en: 'DP Coordinator',
    ko: 'DP 코디네이터',
    abbr: 'DPC',
    category: 'curriculum',
    note: 'IB 부장교사 / 디플로마 프로그램 총괄 코디네이터',
  },
  {
    id: 'curr-3',
    en: 'Theory of Knowledge',
    ko: '지식이론',
    abbr: 'TOK',
    category: 'curriculum',
    note: 'DP 3대 핵심(Core) 과정 중 하나, 지식의 본질 탐구',
  },
  {
    id: 'curr-4',
    en: 'Extended Essay',
    ko: '소논문',
    abbr: 'EE',
    category: 'curriculum',
    note: '학생 주도 심화 학술 에세이 (최대 4,000단어 / 한국어 원고 기준 분량)',
  },
  {
    id: 'curr-5',
    en: 'Creativity, Activity, Service',
    ko: '창의·활동·봉사',
    abbr: 'CAS',
    category: 'curriculum',
    note: '교과 외 체험 기반 전인적 성장 핵심 과정',
  },
  {
    id: 'curr-6',
    en: 'Approaches to Learning',
    ko: '학습 접근법',
    abbr: 'ATL',
    category: 'curriculum',
    note: '사고·소통·사회성·자기관리·조사 기능(5대 역량)',
  },
  {
    id: 'curr-7',
    en: 'Approaches to Teaching',
    ko: '교수 접근법',
    abbr: 'ATT',
    category: 'curriculum',
    note: '탐구 기반·개념 중심·맥락화·협력·차별화·평가 연계 교수법',
  },
  {
    id: 'curr-8',
    en: 'IB Learner Profile',
    ko: 'IB 학습자상',
    category: 'curriculum',
    note: '탐구하는 사람, 지식이 풍부한 사람, 원칙을 지키는 사람 등 10가지 인간상',
  },
  {
    id: 'curr-9',
    en: 'Bilingual Diploma',
    ko: '이중언어 디플로마',
    category: 'curriculum',
    note: '표선고 한국어·영어 병행 이수 학생들이 취득하는 학위 형태',
  },
  {
    id: 'curr-10',
    en: 'Higher Level / Standard Level',
    ko: '심화과정(HL) / 표준과정(SL)',
    abbr: 'HL / SL',
    category: 'curriculum',
  },
  {
    id: 'curr-11',
    en: 'Inquiry-based Learning',
    ko: '탐구 기반 학습',
    category: 'curriculum',
  },
  {
    id: 'curr-12',
    en: 'Conceptual Understanding',
    ko: '개념적 이해',
    category: 'curriculum',
  },
  {
    id: 'curr-13',
    en: 'International-mindedness',
    ko: '국제적 소양',
    category: 'curriculum',
  },
  {
    id: 'curr-14',
    en: 'Collaborative Planning',
    ko: '교원 간 협력적 수업 설계',
    category: 'curriculum',
  },
  {
    id: 'curr-15',
    en: 'Horizontal and Vertical Articulation',
    ko: '수평적·수직적 교육과정 연계',
    category: 'curriculum',
  },
  {
    id: 'curr-16',
    en: 'Unit Planner',
    ko: '단원 설계안',
    category: 'curriculum',
  },
  {
    id: 'curr-17',
    en: 'Differentiation / Scaffolding',
    ko: '수준별 맞춤형 지원 / 비계 설정',
    category: 'curriculum',
  },

  // 평가 · 학사 정책 (Assessment & School Policies)
  {
    id: 'assm-1',
    en: 'Internal Assessment',
    ko: '내부평가',
    abbr: 'IA',
    category: 'assessment',
    note: '교사가 채점하고 IB 본부가 표집 검증(Moderation)하는 수행 과제',
  },
  {
    id: 'assm-2',
    en: 'External Assessment',
    ko: '외부평가',
    abbr: 'EA',
    category: 'assessment',
    note: '11월(표선고 응시 세션) 또는 5월에 치르는 IB 본부 주관 논술형 본시험',
  },
  {
    id: 'assm-3',
    en: 'Internal Standardization',
    ko: '내부 채점 기준화 협의',
    category: 'assessment',
    note: '동일 과목 교사들이 채점 편차를 줄이기 위해 함께 채점 기준을 맞추는 과정',
  },
  {
    id: 'assm-4',
    en: 'Moderation',
    ko: '표집 채점 검증·조정',
    category: 'assessment',
  },
  {
    id: 'assm-5',
    en: 'Criterion-referenced Assessment',
    ko: '준거 참조 평가 (절대평가)',
    category: 'assessment',
  },
  {
    id: 'assm-6',
    en: 'Formative and Summative Assessment',
    ko: '형성평가 및 총괄평가',
    category: 'assessment',
  },
  {
    id: 'assm-7',
    en: 'Process-oriented Assessment',
    ko: '과정중심평가',
    category: 'assessment',
  },
  {
    id: 'assm-8',
    en: 'Rubric / Markscheme',
    ko: '루브릭 / 채점 기준표',
    category: 'assessment',
  },
  {
    id: 'assm-9',
    en: 'Predicted Grade',
    ko: '예상 성적',
    abbr: 'PG',
    category: 'assessment',
  },
  {
    id: 'assm-10',
    en: 'Academic Integrity Policy',
    ko: '학문적 진실성 정책',
    category: 'assessment',
    note: '표절 예방, 출처 표기, 생성형 AI 활용 윤리 기준 포함',
  },
  {
    id: 'assm-11',
    en: 'Inclusion Policy / Access Arrangements',
    ko: '포용 교육 정책 / 평가 편의 제공',
    category: 'assessment',
  },
  {
    id: 'assm-12',
    en: 'Language Policy',
    ko: '언어 정책',
    category: 'assessment',
  },
  {
    id: 'assm-13',
    en: 'Assessment Policy',
    ko: '평가 정책',
    category: 'assessment',
  },
  {
    id: 'assm-14',
    en: 'Admissions Policy',
    ko: '입학 정책',
    category: 'assessment',
  },

  // 표선고 · 제주 공교육 맥락 (Pyoseon High School & Korean Public School Context)
  {
    id: 'pyo-1',
    en: 'Pyoseon High School',
    ko: '표선고등학교',
    category: 'pyoseon',
    note: '제주 최초 공립 IB 월드스쿨 (학교 단위 전면 DP 운영)',
  },
  {
    id: 'pyo-2',
    en: 'Jeju Special Self-Governing Provincial Office of Education',
    ko: '제주특별자치도교육청',
    abbr: 'JPOE',
    category: 'pyoseon',
  },
  {
    id: 'pyo-3',
    en: 'Public IB World School',
    ko: '공립 IB 월드스쿨',
    category: 'pyoseon',
  },
  {
    id: 'pyo-4',
    en: 'School-wide DP Implementation',
    ko: '학교 단위 전면 DP 운영',
    category: 'pyoseon',
    note: '특정 학급이 아닌 전교생 단위로 IB 교육과정을 운영하는 체제',
  },
  {
    id: 'pyo-5',
    en: 'Pre-DP Foundation Year (Grade 10)',
    ko: '1학년 IB 기초·탐구 준비 과정 (Pre-DP)',
    category: 'pyoseon',
    note: '고등학교 1학년 공통교육과정 중 DP 역량을 함양하는 과정',
  },
  {
    id: 'pyo-6',
    en: 'National Curriculum Alignment',
    ko: '국가교육과정(2022 개정 교육과정) 연계 편성',
    category: 'pyoseon',
  },
  {
    id: 'pyo-7',
    en: 'Professional Learning Community',
    ko: '전문적 학습공동체',
    abbr: 'PLC',
    category: 'pyoseon',
  },
  {
    id: 'pyo-8',
    en: 'School Student Record',
    ko: '학교생활기록부 (생기부)',
    category: 'pyoseon',
  },
  {
    id: 'pyo-9',
    en: 'College Scholastic Ability Test',
    ko: '대학수학능력시험 (수능)',
    abbr: 'CSAT',
    category: 'pyoseon',
  },
  {
    id: 'pyo-10',
    en: 'November Examination Session',
    ko: '11월 본시험 세션',
    category: 'pyoseon',
    note: '한국 학사일정에 맞춰 표선고 DP 학생들이 응시하는 세션',
  },
  {
    id: 'pyo-11',
    en: 'Donghaeng Hall',
    ko: '동행관',
    category: 'pyoseon',
    note: '표선고등학교 다목적 협의·행사 공간',
  },
]

export interface SampleScenario {
  id: string
  label: string
  direction: Direction
  text: string
  fallbackTranslation: string
}

export const SAMPLE_EVALUATION_SCENARIOS: SampleScenario[] = [
  {
    id: 'sample-en-1',
    label: '🇺🇸 평가단 질문 시연 (교원 협력 설계 & IA 기준화)',
    direction: 'EN_TO_KO',
    text: 'Thank you for sharing your Self-Study Questionnaire. During our classroom observations this morning, we noticed strong student inquiry across both HL and SL classes. Could you walk us through how teachers conduct collaborative planning each week, and how you ensure internal standardization for Internal Assessments across subject teachers?',
    fallbackTranslation:
      '자체평가 보고서를 공유해 주셔서 감사합니다. 오늘 오전 수업 참관 동안 심화과정(HL)과 표준과정(SL) 수업 모두에서 학생들의 활발한 탐구 활동을 확인할 수 있었습니다. 교사들이 매주 어떻게 협력적 수업 설계를 진행하시는지, 그리고 교과 교사 간 내부평가(IA)의 내부 채점 기준화를 어떻게 확보하시는지 구체적으로 설명해 주시겠습니까?',
  },
  {
    id: 'sample-ko-1',
    label: '🇰🇷 표선고 답변 시연 (전문적 학습공동체 & 채점 협의)',
    direction: 'KO_TO_EN',
    text: '방문 평가단의 질문에 감사드립니다. 저희 표선고등학교는 매주 수요일 오후 두 시간씩 전문적 학습공동체 시간을 고정 확보하여 교과 간 협력적 수업 설계와 단원 설계안 성찰을 진행하고 있습니다. 특히 내부평가의 공정성을 높이기 위해 학기당 최소 두 차례 전 교과 교사가 참여하는 내부 채점 기준화 협의를 실시하며, 샘플 답안을 교차 채점한 뒤 루브릭 해석의 편차를 조율하고 있습니다.',
    fallbackTranslation:
      'Thank you to the Visiting Team for the question. At Pyoseon High School, we secure a dedicated two-hour Professional Learning Community block every Wednesday afternoon for interdisciplinary collaborative planning and reflection on Unit Planners. In particular, to ensure fairness in Internal Assessments, we hold internal standardization meetings at least twice per semester with all subject teachers, cross-marking sample student work to calibrate any discrepancies in rubric interpretation.',
  },
  {
    id: 'sample-en-2',
    label: '🇺🇸 평가단 질문 시연 (프로그램 발전 계획 & 학문적 진실성)',
    direction: 'EN_TO_KO',
    text: 'Looking at your Programme Development Plan, we see a clear focus on strengthening ATL research skills from the Grade 10 foundation year through the Extended Essay. With the rapid adoption of generative AI tools by students, how has your Academic Integrity Policy evolved over the past two years, and how are parents informed about these expectations?',
    fallbackTranslation:
      '학교의 프로그램 발전 계획(PDP)을 살펴보면, 1학년 기초 준비 과정부터 소논문(EE)에 이르기까지 학습 접근법(ATL) 조사 역량을 강화하는 데 중점을 두고 계신 점이 인상적입니다. 최근 학생들의 생성형 AI 도구 활용이 빠르게 확산되고 있는데, 지난 2년간 학문적 진실성 정책이 어떻게 발전해 왔으며 학부모님들께는 이러한 기준을 어떻게 안내하고 계신가요?',
  },
  {
    id: 'sample-ko-2',
    label: '🇰🇷 표선고 답변 시연 (공립 월드스쿨 포용 정책 & 제주교육청 지원)',
    direction: 'KO_TO_EN',
    text: '저희는 공립 IB 월드스쿨로서 입학 성적과 관계없이 모든 학생이 이중언어 디플로마 과정에 도전할 수 있도록 포용 교육 정책을 운영하고 있습니다. 1학년 시기부터 글쓰기 비계 설정과 영어 학술 어휘 멘토링을 지원하고 있으며, 제주특별자치도교육청과의 긴밀한 협력을 통해 교원 연수 예산과 11월 본시험 운영 인프라를 안정적으로 지원받고 있습니다.',
    fallbackTranslation:
      'As a public IB World School, we operate our Inclusion Policy so that all students, regardless of prior admission scores, can challenge themselves in the Bilingual Diploma programme. Starting in Grade 10, we provide writing scaffolding and academic English vocabulary mentoring, and through close partnership with the Jeju Special Self-Governing Provincial Office of Education, we receive stable support for teacher professional development funding and November Examination Session infrastructure.',
  },
]

/**
 * Instant zero-latency glossary matcher so key terms appear on screen
 * immediately while speech is still streaming in.
 */
export function findInstantGlossaryMatches(
  text: string,
  direction: Direction,
  glossary: GlossaryItem[]
): KeyTermPair[] {
  const normalized = text.trim().toLowerCase()
  if (!normalized) return []

  const matches: KeyTermPair[] = []
  const seenTargets = new Set<string>()

  for (const item of glossary) {
    if (direction === 'EN_TO_KO') {
      const enLower = item.en.toLowerCase()
      const abbrLower = item.abbr?.toLowerCase()
      // Check full English phrase, main headwords, or abbreviation word boundary
      const matchedEn = normalized.includes(enLower)
      const matchedAbbr =
        abbrLower &&
        !abbrLower.includes('/') &&
        new RegExp(`\\b${escapeRegExp(abbrLower)}\\b`, 'i').test(text)

      if (matchedEn || matchedAbbr) {
        const key = `${item.en}->${item.ko}`
        if (!seenTargets.has(key)) {
          seenTargets.add(key)
          matches.push({
            source: item.abbr ? `${item.en} (${item.abbr})` : item.en,
            target: item.ko,
            nuance: item.note,
            fromGlossary: true,
          })
        }
      }
    } else {
      // KO_TO_EN: strip parenthetical notes for cleaner matching in natural Korean speech
      const koBase = item.ko.replace(/\s*\([^)]*\)/g, '').trim()
      const koParts = koBase
        .split(/[·/]/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2)
      const abbrLower = item.abbr?.toLowerCase()

      const matchedKo =
        text.includes(koBase) || koParts.some((part) => part.length >= 2 && text.includes(part))
      const matchedAbbr =
        abbrLower &&
        !abbrLower.includes('/') &&
        new RegExp(`\\b${escapeRegExp(abbrLower)}\\b`, 'i').test(text)

      if (matchedKo || matchedAbbr) {
        const targetLabel = item.abbr ? `${item.en} (${item.abbr})` : item.en
        const key = `${item.ko}->${targetLabel}`
        if (!seenTargets.has(key)) {
          seenTargets.add(key)
          matches.push({
            source: item.ko,
            target: targetLabel,
            nuance: item.note,
            fromGlossary: true,
          })
        }
      }
    }
  }

  return matches.slice(0, 8)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
