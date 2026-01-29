import type { AppSettings } from './types';
import { browser } from '$app/environment';
import { 
    MOCK_TEACHERS_DATA,
    MOCK_CLASSES_DATA,
    MOCK_PRODUCTS_DATA,
    MOCK_GENERAL_STAFF,
    MOCK_SHUTTLE_DRIVERS,
    MOCK_SHUTTLE_VEHICLES,
    MOCK_SHUTTLE_ROUTES,
    MOCK_STUDENTS_DATA,
    MOCK_CONSULTATIONS,
    MOCK_ROOMS_DATA,
    MOCK_SALARY_POLICIES,
} from './mock-data';

const DEFAULT_SETTINGS: AppSettings = {
    academy: {
        name: "스타우드 아카데미",
        businessId: "123-45-67890",
        director: "홍길동",
        address: "서울특별시 강남구 테헤란로 123",
        businessHours: { start: "13:00", end: "22:00" },
        minClassGap: 10,
        holidays: [],
        refundMode: 'session',
        refundRules: [
            { threshold: 0.5, refundPercent: 50 },
            { threshold: 1, refundPercent: 0 }
        ],
        gradeSystem: [
            "초1", "초2", "초3", "초4", "초5", "초6",
            "중1", "중2", "중3",
            "고1", "고2", "고3",
            "기타"
        ]
    },
    salaryPolicies: MOCK_SALARY_POLICIES,
    teachers: MOCK_TEACHERS_DATA,
    products: MOCK_PRODUCTS_DATA as any,
    discounts: [
        { id: 'd1', name: '형제 할인', type: 'percent', value: 10, description: '가족 동반 수강 시' },
        { id: 'multiclass_2', name: '2과목 할인', type: 'percent', value: 10, description: '2과목 동시 수강' },
        { id: 'multiclass_3', name: '3과목 할인', type: 'percent', value: 15, description: '3과목 이상 수강' }
    ],
    timetable: [],
    students: MOCK_STUDENTS_DATA as any,
    consultations: MOCK_CONSULTATIONS,
    attendance: [],
    payments: [],
    classes: MOCK_CLASSES_DATA as any,
    exams: [
        { id: 'ex1', name: '2025 1학기 중간고사', date: '2025-04-15', type: '정기', maxScore: 100 },
        { id: 'ex2', name: '2025 1학기 기말고사', date: '2025-06-20', type: '정기', maxScore: 100 },
        { id: 'ex3', name: '2026 1월 월말평가', date: '2026-01-25', type: '월간', maxScore: 100 }
    ],
    scores: [
        { id: 'sc1', studentId: 's1', examId: 'ex3', components: { listening: 30, reading: 32, grammar: 28 }, total: 90, prevTotal: 88 },
        { id: 'sc2', studentId: 's2', examId: 'ex3', components: { listening: 25, reading: 22, grammar: 20 }, total: 67, prevTotal: 75 }
    ],
    homework: [
        { id: 'hw1', classId: 'cls1', title: '[영어] Vocab 3000 Chapter 1-3', dueDate: '2026-01-30', description: '단어 암기 및 확인 테스트 준비' }
    ],
    submissions: [
        { id: 'sub1', homeworkId: 'hw1', studentId: 's1', status: 'done', date: '2026-01-28' },
        { id: 'sub2', homeworkId: 'hw1', studentId: 's2', status: 'none', date: '' }
    ],
    messages: [
        { id: 'm1', type: 'sms', title: '수강료 납부 안내', content: '안녕하세요 스타우드 학원입니다...', targetCount: 12, date: '2026-01-28 14:20', status: 'success' }
    ],
    expenses: [],
    refunds: [],
    roomSettings: MOCK_ROOMS_DATA,
    documents: [],
    generalStaff: MOCK_GENERAL_STAFF,
    favorites: ['dashboard', 'students', 'finance-desk'],
    shuttleDrivers: MOCK_SHUTTLE_DRIVERS,
    shuttleVehicles: MOCK_SHUTTLE_VEHICLES,
    shuttleRoutes: MOCK_SHUTTLE_ROUTES,
    history: [],
    currentUserRole: 'director',
    isAuthenticated: false,
    uiState: {
        isZenMode: false
    },
    version: '2026.01.29.07' // 초기 로그인 역할 선택 페이지 도입
};

class SettingsStore {
    data = $state<AppSettings>(DEFAULT_SETTINGS);

    constructor() {
        if (browser) {
            const saved = localStorage.getItem('starwood_settings');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);

                    // 버전 체크: 버전이 다르거나 없을 경우 목데이터 강제 적용 (개발 단계)
                    if (!parsed.version || parsed.version !== DEFAULT_SETTINGS.version) {
                        console.log("Data version mismatch. Resetting to default mock data...");
                        this.data = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
                        localStorage.setItem('starwood_settings', JSON.stringify(this.data));
                        return;
                    }

                    // Deep merge for academy
                    this.data.academy = { ...DEFAULT_SETTINGS.academy, ...(parsed.academy || {}) };
                    // Surface merge for other collections
                    const collections: (keyof AppSettings)[] = [
                        'salaryPolicies', 'teachers', 'products', 'discounts', 'timetable', 
                        'students', 'consultations', 'attendance', 'payments', 
                        'classes', 'exams', 'scores', 'homework', 'submissions', 
                        'messages', 'expenses', 'refunds', 'roomSettings', 'documents', 
                        'shuttleDrivers', 'shuttleVehicles', 'shuttleRoutes', 'generalStaff',
                        'favorites', 'history', 'currentUserRole', 'isAuthenticated', 'uiState', 'version'
                    ];
                    collections.forEach(key => {
                        if (parsed[key] !== undefined) {
                            // @ts-ignore
                            this.data[key] = parsed[key];
                        }
                    });
                } catch (e) {
                    console.error("Failed to load settings", e);
                }
            }

            // Sync back to localstorage whenever data changes
            $effect.root(() => {
                $effect(() => {
                    localStorage.setItem('starwood_settings', JSON.stringify(this.data));
                });
            });
        }
    }

    reset() {
        this.data = DEFAULT_SETTINGS;
    }
}

export const settings = new SettingsStore();
