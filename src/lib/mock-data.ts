import type { TeacherSetting, ShuttleDriver, GeneralStaff, AcademyClass, Student, ProductSetting, AppSettings, SettlementType, SalaryPolicy } from './types';

export const MOCK_SCHOOLS = [
    "스타고", "우드중", "갤럭시초", "유니버스고", "행성중",
    "지구초", "태양고", "달빛중", "별꽃초", "나래고", "미래중", "창의고",
    "강남고", "서초중", "송파초", "잠실고", "대치중", "도곡초", "압구정고"
];

const LAST_NAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "신", "유", "한", "오", "서", "권", "황", "안", "송", "전"];
const FIRST_NAMES = ["민준", "서윤", "도윤", "서연", "하준", "하윤", "주원", "지우", "지호", "지유", "준서", "수아", "예준", "하은", "민서", "지안", "시우", "성현", "다은", "현우", "상민", "영희", "철수", "미소", "윤아", "정원", "혜원", "진호", "나영", "우진"];

const generatePhone = () => `010-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

const subjects = ["수학", "영어", "국어", "과학", "사회", "코딩", "논술"];

// 1. Teachers (50 members)
export const MOCK_TEACHERS_DATA: TeacherSetting[] = Array.from({ length: 50 }, (_, i) => {
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const teacherId = `t${i + 1}`;
    
    // 강사별 특성 다양화
    const teacherSubjects = [subjects[i % subjects.length]];
    if (i % 5 === 0) teacherSubjects.push(subjects[(i + 2) % subjects.length]);

    return {
        id: teacherId,
        name: lastName + firstName,
        majors: [subjects[i % subjects.length] + "교육", i % 2 === 0 ? "심리학" : "컴퓨터공학"],
        phone: generatePhone(),
        joinDate: `202${i % 4 + 1}-0${(i % 9) + 1}-10`,
        settlementType: (['fixed', 'ratio', 'hourly', 'equity'] as SettlementType[])[i % 4],
        settlementValue: i % 4 === 1 ? 40 : (i % 4 === 2 ? 60000 : 3000000 + (i * 10000)),
        salary: 3500000 + (i * 20000),
        status: i === 3 || i === 13 ? '휴가' : (i === 11 || i === 17 ? '퇴직' : '재직'),
        isOnHoliday: i === 3 || i === 13,
        assignedClassIds: [],
        subjects: teacherSubjects,
        memo: i % 10 === 0 ? "우수 강사" : "",
        availability: [
            { day: '월', startTime: '14:00', endTime: '22:00' },
            { day: '수', startTime: '14:00', endTime: '22:00' },
            { day: '금', startTime: '14:00', endTime: '22:00' }
        ]
    };
});

// 2. Classes (80-100 classes with Load Balancing)
const levels = ["기초", "발전", "심화", "내신대비", "수능완성", "영재반"];
const targetGrades = ["초등", "중등", "고등"];

export const MOCK_CLASSES_DATA: AcademyClass[] = [];

let classIdCounter = 1;
targetGrades.forEach(target => {
    subjects.forEach(sub => {
        levels.forEach(lvl => {
            if (Math.random() > 0.4) {
                const id = `cls${classIdCounter++}`;
                
                const candidates = MOCK_TEACHERS_DATA.filter(t => 
                    t.status === '재직' && 
                    (t.subjects || []).includes(sub)
                );

                let assignedTeacher: TeacherSetting;
                if (candidates.length > 0) {
                    candidates.sort((a, b) => a.assignedClassIds.length - b.assignedClassIds.length);
                    assignedTeacher = candidates[0];
                } else {
                    const fallbackCandidates = MOCK_TEACHERS_DATA.filter(t => t.status === '재직');
                    fallbackCandidates.sort((a, b) => a.assignedClassIds.length - b.assignedClassIds.length);
                    assignedTeacher = fallbackCandidates[0] || MOCK_TEACHERS_DATA[0];
                }

                assignedTeacher.assignedClassIds.push(id);

                MOCK_CLASSES_DATA.push({
                    id,
                    name: `${target} ${sub} ${lvl} ${String.fromCharCode(64 + (classIdCounter % 5) + 1)}`,
                    teacherId: assignedTeacher.id,
                    studentIds: [],
                    billingType: classIdCounter % 7 === 0 ? 'session' : 'flat',
                    maxStudents: target === "초등" ? 12 : (target === "중등" ? 15 : 20),
                    fee: target === "초등" ? 320000 : (target === "중등" ? 380000 : 450000),
                    time: `${14 + (classIdCounter % 6)}:00-17:00`,
                    day: ["월", "수", "금"],
                    subject: sub
                });
            }
        });
    });
});

// 3. Students (600 members)
export const MOCK_STUDENTS_DATA: Student[] = Array.from({ length: 600 }, (_, i) => {
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const sId = `s${i + 1}`;
    
    let gradeStr = "";
    if (i < 200) gradeStr = `초${(i % 6) + 1}`;
    else if (i < 400) gradeStr = `중${(i % 3) + 1}`;
    else gradeStr = `고${(i % 3) + 1}`;

    const studentClassIds: string[] = [];
    const studentClasses: string[] = [];

    const category = i < 200 ? "초등" : (i < 400 ? "중등" : "고등");
    const eligibleClasses = MOCK_CLASSES_DATA.filter(c => c.name.startsWith(category));
    
    if (i < 520) {
        const primary = eligibleClasses[i % eligibleClasses.length];
        if (primary && primary.studentIds.length < primary.maxStudents) {
            primary.studentIds.push(sId);
            studentClassIds.push(primary.id);
            studentClasses.push(primary.name);
        }

        if (i % 5 === 0) {
            const secondary = eligibleClasses[(i + 10) % eligibleClasses.length];
            if (secondary && secondary.id !== studentClassIds[0] && secondary.studentIds.length < secondary.maxStudents) {
                secondary.studentIds.push(sId);
                studentClassIds.push(secondary.id);
                studentClasses.push(secondary.name);
            }
        }
    }

    const unpaid = (i > 50 && i < 80) ? Math.floor(Math.random() * 30 + 10) * 10000 : 0;
    const isWaiting = i >= 520 && i < 580;
    const isFormer = i >= 580;

    return {
        id: sId,
        name: lastName + firstName,
        gender: i % 2 === 0 ? "남" : "여",
        school: MOCK_SCHOOLS[i % MOCK_SCHOOLS.length],
        grade: gradeStr,
        status: isWaiting ? "대기" : (isFormer ? "퇴원" : (unpaid > 0 ? "미납" : "재원")),
        studentPhone: generatePhone(),
        parentContacts: [{ type: "부/모", name: lastName + "OO", phone: generatePhone(), isPrimary: true }],
        regDate: `2024-0${(i % 9) + 1}-10`,
        unpaid,
        unpaidDays: unpaid > 0 ? (i % 30) + 1 : 0,
        consultationCount: i % 15 === 0 ? 1 : 0,
        productIds: studentClassIds.map(id => `p${id.slice(3)}`),
        classes: studentClasses,
        memo: i % 50 === 0 ? "성적이 우수함" : "",
        address: i % 3 === 0 ? "서울특별시 강남구 테헤란로 123" : "",
        admissionDate: `2024-0${(i % 9) + 1}-10`,
        specialNotes: i % 100 === 0 ? "집중력이 좋으나 기초가 부족함" : ""
    };
});

// 모든 강사의 배정 클래스 목록 최종 동기화 (정합성 보장)
MOCK_TEACHERS_DATA.forEach(t => {
    t.assignedClassIds = MOCK_CLASSES_DATA.filter(c => c.teacherId === t.id).map(c => c.id);
});

export const MOCK_PRODUCTS_DATA: ProductSetting[] = MOCK_CLASSES_DATA.map(c => ({
    id: `p${c.id.slice(3)}`,
    name: c.name + " 정규 수강권",
    baseFee: c.fee,
    billingType: c.billingType,
    classIds: [c.id]
}));

export const MOCK_DASHBOARD_STATS = {
    lastMonth: { totalRevenue: 125000000, totalExpense: 72500000, netProfit: 52500000 },
    thisMonth: { expectedRevenue: 138000000, currentIncome: 89000000, currentExpense: 64000000 }
};

export const MOCK_SHUTTLE_DRIVERS: ShuttleDriver[] = Array.from({ length: 12 }, (_, i) => ({
    id: `dr_${i + 1}`,
    name: LAST_NAMES[(i + 5) % LAST_NAMES.length] + FIRST_NAMES[(i + 5) % FIRST_NAMES.length],
    phone: generatePhone(),
    status: i % 3 === 0 ? '대기' : '운행중',
    salary: 3200000 + (i * 10000),
    isOnHoliday: i === 11,
    joinDate: `2023-${(i % 12) + 1 < 10 ? '0' : ''}${(i % 12) + 1}-01`,
    availability: i % 2 === 0 
        ? [{ day: '월', startTime: '07:00', endTime: '18:00' }, { day: '수', startTime: '07:00', endTime: '18:00' }, { day: '금', startTime: '07:00', endTime: '18:00' }]
        : [{ day: '화', startTime: '07:00', endTime: '18:00' }, { day: '목', startTime: '07:00', endTime: '18:00' }]
}));

export const MOCK_SHUTTLE_VEHICLES = Array.from({ length: 10 }, (_, i) => ({
    id: `vh_${i + 1}`,
    plate: `${30 + i}하 ${1000 + i * 123}`,
    model: i % 3 === 0 ? '쏠라티 (15인승)' : '스타리아 (12인승)',
    status: '정상',
    lastCheck: '2026-01-20',
    mileage: 12000 + i * 500,
    driverId: `dr_${i + 1}`
}));

export const MOCK_SHUTTLE_ROUTES = Array.from({ length: 10 }, (_, i) => ({
    id: `rt_${i + 1}`,
    name: `${['대치동', '삼성동', '압구정', '개포동', '잠실', '반포', '역삼', '한남', '옥수', '금호'][i]} 리무진`,
    stops: 8,
    studentCount: 5 + (i % 7),
    startTime: '16:00',
    endTime: '18:30'
}));

export const MOCK_CONSULTATIONS = Array.from({ length: 15 }, (_, i) => ({
    id: `c_rec_${i + 1}`,
    name: LAST_NAMES[i % LAST_NAMES.length] + FIRST_NAMES[(i + 20) % FIRST_NAMES.length],
    phone: generatePhone(),
    stage: ['new', 'consulting', 'payment', 'completed'][i % 4],
    date: `2026-01-${20 + (i % 10)}`,
    note: i % 3 === 0 ? "레벨테스트 예약 필요" : "특목고 입시 상담",
    type: i % 2 === 0 ? "전화" : "방문"
})) as any;

export const MOCK_SALARY_POLICIES: SalaryPolicy[] = [
    {
        id: 'sp1',
        name: '일반 전임 월급제',
        type: 'fixed',
        baseValue: 3000000,
        conditions: [],
        description: '기본적인 고정 월급제 정책입니다.'
    },
    {
        id: 'sp2',
        name: '파트타임 시급제',
        type: 'hourly',
        baseValue: 15000,
        conditions: [],
        description: '강의 시간에 비례하여 지급하는 정책입니다.'
    },
    {
        id: 'sp3',
        name: '인원수 기반 인센티브',
        type: 'perStudent',
        baseValue: 2500000,
        conditions: [
            { id: 'sc1', type: 'student_count', threshold: 30, rewardType: 'bonus_amount', rewardValue: 300000 },
            { id: 'sc2', type: 'student_count', threshold: 50, rewardType: 'bonus_amount', rewardValue: 700000 }
        ],
        description: '기본급에 수강생 수에 따른 추가 인센티브가 결합된 정책입니다.'
    },
    {
        id: 'sp4',
        name: '수익 배분(지분제)',
        type: 'equity',
        baseValue: 40, // 40% 지분
        conditions: [
            { id: 'sc3', type: 'net_profit', threshold: 10000000, rewardType: 'bonus_percent', rewardValue: 5 }
        ],
        description: '강의 수익의 일정 비율을 정산받는 정책입니다.'
    }
];

export const MOCK_EXAMS = [
    { id: 'e1', name: "2026 1월 전반기 성취도 평가", date: "2026-01-15", type: "정기", maxScore: 100 },
    { id: 'e2', name: "2026 1월 말 레벨테스트", date: "2026-01-25", type: "월간", maxScore: 100 }
];

export const MOCK_SCORES = MOCK_STUDENTS_DATA.slice(0, 100).map((s, i) => ({
    id: `sc_r_${i}`, studentId: s.id, examId: (i % 2 === 0 ? 'e1' : 'e2'), total: 70 + (i % 30),
    components: { focus: 30, verbal: 35, logical: 35 }
}));

export const MOCK_DEPOSITS = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    date: `2026-01-29 1${i}:00`,
    sender: i % 3 === 0 ? "홍길동원비" : (LAST_NAMES[i] + "OO학부모"),
    amount: 380000,
    status: i % 4 === 0 ? "pending" : "matched",
    matchedStudent: i % 4 === 0 ? "" : MOCK_STUDENTS_DATA[i].name
}));

export const DISCOUNT_POLICIES = [
    { id: 'dp1', name: '가족 할인', type: 'percent', value: 10, description: '형제/남매 동시 수강' },
    { id: 'dp2', name: '장기 우수 할인', type: 'amount', value: 30000, description: '2년 이상 성실 수강생' }
] as any;

export const MOCK_GENERAL_STAFF: GeneralStaff[] = [
    { id: 'gs1', name: "이나은", phone: generatePhone(), role: "실장", status: '재직', salary: 3800000, isOnHoliday: false, joinDate: "2022-01-10", availability: [{ day: '월', startTime: '09:00', endTime: '18:00' }, { day: '화', startTime: '09:00', endTime: '18:00' }, { day: '수', startTime: '09:00', endTime: '18:00' }, { day: '목', startTime: '09:00', endTime: '18:00' }, { day: '금', startTime: '09:00', endTime: '18:00' }] },
    { id: 'gs2', name: "조현수", phone: generatePhone(), role: "상담/데스크", status: '재직', salary: 2800000, isOnHoliday: false, joinDate: "2023-05-20", availability: [{ day: '월', startTime: '13:00', endTime: '21:00' }, { day: '화', startTime: '13:00', endTime: '21:00' }, { day: '목', startTime: '13:00', endTime: '21:00' }] },
    { id: 'gs3', name: "장민지", phone: generatePhone(), role: "회계/서무", status: '재직', salary: 3000000, isOnHoliday: false, joinDate: "2023-03-15", availability: [{ day: '수', startTime: '09:00', endTime: '18:00' }, { day: '금', startTime: '09:00', endTime: '18:00' }] },
    { id: 'gs4', name: "박소이", phone: generatePhone(), role: "입시상담", status: '재직', salary: 4200000, isOnHoliday: false, joinDate: "2024-06-01", availability: [{ day: '토', startTime: '10:00', endTime: '18:00' }, { day: '일', startTime: '10:00', endTime: '15:00' }] }
];

// 4. Room Settings (24 rooms across 2 buildings)
export const MOCK_ROOMS_DATA = Array.from({ length: 24 }, (_, i) => {
    const isMainBuilding = i < 14;
    const building = isMainBuilding ? "1관 (본관)" : "2관 (별관)";
    const roomNumber = isMainBuilding ? 101 + i : 201 + (i - 14);
    
    return {
        id: `r${i + 1}`,
        building,
        name: `${roomNumber}호`,
        capacity: 10 + (i % 3) * 5 + (isMainBuilding ? 5 : 0), // 10~25명
        equipment: i % 2 === 0 ? ['전자칠판', '빔프로젝터'] : ['화이트보드', '빔프로젝터'],
        unavailableTimes: [],
        memo: i % 5 === 0 ? "최근 리모델링 완료" : ""
    };
});
// 5. Dashboard Enhancements (Live Feed & Trends)
export const MOCK_FEED = [
    { id: 1, time: "14:05", type: 'attendance', user: "김도윤", action: "등원 완료", detail: "대치본관", roleFilter: ['director', 'staff', 'teacher'] },
    { id: 2, time: "14:02", type: 'payment', user: "하준 어머니", action: "결제 완료", detail: "320,000원 (카드)", roleFilter: ['director', 'staff'] },
    { id: 3, time: "13:50", type: 'homework', user: "조현수 강사", action: "과제 등록", detail: "고1 영어반 (Unit 3)", roleFilter: ['director', 'teacher'] },
    { id: 4, time: "13:30", type: 'notice', user: "관리자", action: "전체 공지", detail: "금일 에어컨 점검 안내", roleFilter: ['director', 'staff', 'teacher'] },
    { id: 5, time: "11:20", type: 'consultation', user: "박민준", action: "상담 예약", detail: "방문 상담 (16:00)", roleFilter: ['director', 'staff'] },
    { id: 6, time: "09:40", type: 'payment', user: "지우 어머니", action: "이체 확인", detail: "380,000원 (신한은행)", roleFilter: ['director', 'staff'] },
];

export const MOCK_TRENDS = {
    revenue: [
        { month: '8월', total: 9800, expense: 7200 },
        { month: '9월', total: 10500, expense: 7100 },
        { month: '10월', total: 11200, expense: 7500 },
        { month: '11월', total: 12100, expense: 7800 },
        { month: '12월', total: 12800, expense: 8000 },
        { month: '1월', total: 13800, expense: 8200 },
    ],
    growth: [
        { month: '8월', count: 480 },
        { month: '9월', count: 502 },
        { month: '10월', count: 525 },
        { month: '11월', count: 558 },
        { month: '12월', count: 582 },
        { month: '1월', count: 600 },
    ],
    attendance: [
        { day: '월', rate: 94 },
        { day: '화', rate: 92 },
        { day: '수', rate: 95 },
        { day: '목', rate: 89 },
        { day: '금', rate: 91 },
        { day: '토', rate: 85 },
    ],
    homework: [
        { week: '1주', rate: 78 },
        { week: '2주', rate: 82 },
        { week: '3주', rate: 85 },
        { week: '4주', rate: 80 },
    ]
};
