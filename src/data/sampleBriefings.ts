import type { InterpreterBriefing } from '../types'

export const SAMPLE_OFFLINE_BRIEFINGS: Record<string, InterpreterBriefing> = {
  'sample-en-1': {
    headline: '주간 교원 협력 수업설계 방식 및 내부평가(IA) 채점 기준화 절차 질의',
    intentTag: '평가단 질의',
    bulletPoints: [
      {
        koSummary: '자체평가 보고서 검토 및 오전 HL·SL 수업 참관에서 학생 주도 탐구 확인',
        targetCue: '오전 HL·SL 수업 참관 중 학생들의 활발한 탐구 활동이 인상적이었음',
      },
      {
        koSummary: '교사들의 주간 협력적 수업 설계(Collaborative Planning) 운영 방식 질문',
        targetCue: '매주 교원 간 협력적 수업 설계를 구체적으로 어떻게 운영하는지 설명 요청',
      },
      {
        koSummary: '교과 교사 간 내부평가(IA) 채점 기준화(Internal Standardization) 확보 방안 질문',
        targetCue: '내부평가(IA) 채점 시 교사 간 일관성·기준화를 어떻게 보장하는지 질의',
      },
    ],
    keyTerms: [
      {
        source: 'Self-Study Questionnaire (SSQ)',
        target: '자체평가 설문·보고서',
        fromGlossary: true,
      },
      {
        source: 'Classroom Observation',
        target: '수업 참관',
        fromGlossary: true,
      },
      {
        source: 'Higher Level / Standard Level (HL / SL)',
        target: '심화과정(HL) / 표준과정(SL)',
        fromGlossary: true,
      },
      {
        source: 'Collaborative Planning',
        target: '교원 간 협력적 수업 설계',
        fromGlossary: true,
      },
      {
        source: 'Internal Standardization',
        target: '내부 채점 기준화 협의',
        nuance: '동일 과목 교사 간 채점 편차 조율',
        fromGlossary: true,
      },
      {
        source: 'Internal Assessment (IA)',
        target: '내부평가',
        fromGlossary: true,
      },
    ],
    keyFigures: [
      { figure: 'This morning', context: '오전 수업 참관 세션' },
      { figure: 'Each week', context: '주간 단위 교사 협의 주기' },
    ],
    generatedAt: Date.now(),
    scopeCount: 1,
  },
  'sample-ko-1': {
    headline: '수요일 전문적 학습공동체 수업설계 운영 및 학기별 2회 IA 교차채점 기준화',
    intentTag: '수업·평가 운영',
    bulletPoints: [
      {
        koSummary: '매주 수요일 오후 2시간 PLC 고정 확보 → 협력적 수업 설계 및 단원 설계안 성찰',
        targetCue: 'Dedicated 2-hour PLC every Wednesday afternoon → collaborative planning & Unit Planner reflection',
      },
      {
        koSummary: 'IA 공정성 확보를 위해 학기당 최소 2회 전 교과 교사 내부 채점 기준화 실시',
        targetCue: 'Internal standardization at least twice per semester across all subject teachers for IA fairness',
      },
      {
        koSummary: '학생 샘플 답안 교차 채점 후 루브릭 해석 편차 조율(Calibration)',
        targetCue: 'Cross-mark sample student work & calibrate discrepancies in rubric interpretation',
      },
    ],
    keyTerms: [
      {
        source: '방문 평가단',
        target: 'Visiting Team',
        fromGlossary: true,
      },
      {
        source: '전문적 학습공동체',
        target: 'Professional Learning Community (PLC)',
        fromGlossary: true,
      },
      {
        source: '협력적 수업 설계',
        target: 'Collaborative Planning',
        fromGlossary: true,
      },
      {
        source: '단원 설계안 성찰',
        target: 'Reflection on Unit Planners',
        fromGlossary: true,
      },
      {
        source: '내부 채점 기준화 협의',
        target: 'Internal Standardization',
        fromGlossary: true,
      },
      {
        source: '교차 채점 · 편차 조율',
        target: 'Cross-marking & Calibrating Rubric Interpretation',
        nuance: 'IB 평가 협의 핵심 표현',
      },
    ],
    keyFigures: [
      { figure: '매주 수요일 2시간', context: 'Every Wednesday afternoon, 2 hours (PLC)' },
      { figure: '학기당 최소 2회', context: 'At least twice per semester (IA standardization)' },
    ],
    generatedAt: Date.now(),
    scopeCount: 1,
  },
  'sample-en-2': {
    headline: '생성형 AI 확산에 따른 학문적 진실성 정책 고도화 및 학부모 안내 방안 질의',
    intentTag: '평가단 질의',
    bulletPoints: [
      {
        koSummary: 'PDP 내 고1 기초과정~소논문(EE) 연계 ATL 조사 역량 강화 노력 확인',
        targetCue: '프로그램 발전 계획(PDP)상 1학년~소논문(EE) 연계 ATL 조사 기능 강화 중점 확인',
      },
      {
        koSummary: '학생 생성형 AI 활용 확산에 따른 최근 2년간 학문적 진실성 정책 변화 질의',
        targetCue: '생성형 AI 확산 속 지난 2년간 학문적 진실성 정책이 어떻게 발전했는지 질문',
      },
      {
        koSummary: '학부모 대상 학문적 윤리·기대 기준 소통 및 안내 방식 확인',
        targetCue: '학부모들에게 해당 기준과 기대치를 어떻게 공유·안내하는지 설명 요청',
      },
    ],
    keyTerms: [
      {
        source: 'Programme Development Plan (PDP)',
        target: '프로그램 발전 계획',
        fromGlossary: true,
      },
      {
        source: 'Approaches to Learning (ATL)',
        target: '학습 접근법 (조사 역량)',
        fromGlossary: true,
      },
      {
        source: 'Extended Essay (EE)',
        target: '소논문',
        fromGlossary: true,
      },
      {
        source: 'Academic Integrity Policy',
        target: '학문적 진실성 정책',
        fromGlossary: true,
      },
      {
        source: 'Generative AI tools',
        target: '생성형 AI 도구',
      },
    ],
    keyFigures: [
      { figure: 'Grade 10', context: '고등학교 1학년 기초 준비 과정(Pre-DP)' },
      { figure: 'Past 2 years', context: '최근 2년간 정책 개정 추이' },
    ],
    generatedAt: Date.now(),
    scopeCount: 1,
  },
  'sample-ko-2': {
    headline: '공립 IB 월드스쿨 포용 정책(이중언어 DP 지원) 및 제주도교육청 협력 인프라',
    intentTag: '정책·지원 설명',
    bulletPoints: [
      {
        koSummary: '공립 월드스쿨로서 입학 성적 무관 전 학생 이중언어 디플로마 도전 지원(포용 정책)',
        targetCue: 'Inclusive public IB World School → open access to Bilingual Diploma regardless of prior scores',
      },
      {
        koSummary: '고1(Grade 10)부터 학술 글쓰기 비계 설정(Scaffolding) 및 영어 어휘 멘토링 운영',
        targetCue: 'Provide writing scaffolding & academic English vocabulary mentoring from Grade 10',
      },
      {
        koSummary: '제주특별자치도교육청 협력으로 교원 연수 예산 및 11월 본시험 인프라 안정 확보',
        targetCue: 'Close partnership with Jeju Provincial Office of Education → stable PD funding & Nov exam infrastructure',
      },
    ],
    keyTerms: [
      {
        source: '공립 IB 월드스쿨',
        target: 'Public IB World School',
        fromGlossary: true,
      },
      {
        source: '이중언어 디플로마',
        target: 'Bilingual Diploma',
        fromGlossary: true,
      },
      {
        source: '포용 교육 정책',
        target: 'Inclusion Policy',
        fromGlossary: true,
      },
      {
        source: '글쓰기 비계 설정',
        target: 'Writing Scaffolding',
        fromGlossary: true,
      },
      {
        source: '제주특별자치도교육청',
        target: 'Jeju Special Self-Governing Provincial Office of Education',
        fromGlossary: true,
      },
      {
        source: '11월 본시험 세션',
        target: 'November Examination Session',
        fromGlossary: true,
      },
    ],
    keyFigures: [
      { figure: '1학년(Grade 10)', context: '기초 학술 글쓰기·어휘 멘토링 시작 시기' },
      { figure: '11월 본시험', context: 'November Examination Session' },
    ],
    generatedAt: Date.now(),
    scopeCount: 1,
  },
}
