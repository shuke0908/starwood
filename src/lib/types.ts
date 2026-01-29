export type UserRole = 'director' | 'manager' | 'teacher' | 'desk' | 'driver';
export type SettlementType = 'fixed' | 'hourly' | 'perStudent' | 'ratio' | 'equity' | 'custom';
export type BillingType = 'flat' | 'session';
export type RefundMode = 'session' | 'date' | 'proportion';

export interface DiscountPolicy {
    id: string;
    name: string;
    type: 'percent' | 'amount';
    value: number;
    description: string;
}

export interface SalaryCondition {
    id: string;
    type: 'student_count' | 'revenue' | 'net_profit';
    threshold: number; // 기준 수치 (N명 이상, N원 이상 등)
    rewardType: 'bonus_amount' | 'bonus_percent'; // 추가 수당 종류
    rewardValue: number; // 추가 수당 값
}

export interface SalaryPolicy {
    id: string;
    name: string;
    type: SettlementType;
    baseValue: number; // 기본급, 시급, 또는 기본 지분율
    conditions: SalaryCondition[];
    description: string;
}

export interface TeacherSetting {
    id: string;
    name: string;
    majors: string[]; // 전공 (복수 입력 가능)
    phone: string; // 연락처 (추가)
    email?: string; // 이메일 (추가)
    salaryPolicyId?: string; // 연결된 급여 정책 ID
    settlementType: SettlementType;
    settlementValue: number;
    salary: number; // 최종/기준 월 급여
    memo?: string; // 메모 추가
    status: '재직' | '휴가' | '퇴직'; // 현재 상태
    isOnHoliday: boolean; // 휴가 여부 (상태와 연동)
    assignedClassIds: string[]; // 담당 클래스 ID 목록 (복수 선택 가능)
    subjects?: string[]; // 담당 가능 과목
    joinDate: string; // 입사일 추가
    maxConsecutiveHours?: number; // 최대 연속 강의 시간
    availability: {
        day: string;
        startTime: string;
        endTime: string;
    }[];
}

export interface RoomSetting {
    id: string;
    building?: string; // 건물명 (그룹화용)
    name: string;
    capacity: number;
    equipment: string[];
    unavailableTimes: { day: string; startTime: string; endTime: string }[];
    memo?: string; // 강의실 메모 (8-2-C)
}

export interface ProductSetting {
    id: string;
    name: string;
    baseFee: number;
    billingType: BillingType;
    classIds: string[];
}

export interface AcademyPolicy {
    name: string;
    businessId?: string;
    director?: string;
    address?: string;
    businessHours: { start: string; end: string };
    minClassGap?: number; 
    holidays: string[];
    refundMode: RefundMode;
    refundRules: {
        threshold: number;
        refundPercent: number;
    }[];
    gradeSystem: string[]; // 사용자가 설정한 학년 리스트 (예: 초1~고3, 공시1년차 등)
}

export interface TimetableEvent {
    id: string;
    classId: string;
    className: string;
    teacherId: string;
    day: string;
    startTime: string;
    endTime: string;
    roomId: string;
    isFixed?: boolean;
    conflictReason?: string;
    color?: string; // UI 호환용
}

export interface ParentContact {
    type: string;
    name: string;
    phone: string;
    isPrimary: boolean;
}

export interface Student {
    id: string;
    name: string;
    gender?: '남' | '여';
    school: string;
    grade: string;
    birthday?: string; // YYYY-MM-DD
    status: '재원' | '미납' | '휴원' | '신규' | '퇴원' | '대기';
    studentPhone: string;
    parentContacts: ParentContact[];
    regDate: string;
    unpaid: number;
    unpaidDays?: number;
    lastPaymentDate?: string;
    lastConsultationDate?: string;
    consultationCount: number;
    recentAttendance?: string;
    memo?: string;
    address?: string; // 주소
    admissionDate?: string; // 입학일
    dischargeDate?: string; // 퇴원일
    specialNotes?: string; // 특이사항
    productIds: string[];
    classes: string[]; // 수강 중인 반 명칭 
    discounts?: string[];
    vehicleUse?: boolean;
    siblings?: string[]; // 형제 학생 ID 목록
    files?: { name: string; url: string; date: string }[];
}

export interface DocumentRecord {
    id: string;
    title: string;
    url: string;
    category: 'common' | 'teacher';
    date: string;
    type: 'pdf' | 'doc' | 'hwp' | 'etc';
}

export interface Consultation {
    id: string;
    studentId?: string; // 연결된 학생 ID
    name: string;
    phone: string;
    stage: 'new' | 'consulting' | 'payment' | 'completed';
    date: string;
    note: string;
    type: string;
    followUp?: string; // 후속조치 (다음 상담일/숙제/보강)
    tags?: string[]; // 태건 (미납/성적/출결/태도)
}

export interface Attendance {
    id: string;
    studentId: string;
    classId: string;
    date: string;
    status: '출석' | '지각' | '결석' | '조퇴' | '보강';
}

export interface Exam {
    id: string;
    name: string;
    date: string;
    type: string;
    maxScore: number;
}

export interface Score {
    id: string;
    studentId: string;
    examId: string;
    components: {
        listening: number;
        reading: number;
        grammar: number;
    };
    total: number;
    prevTotal?: number;
    note?: string;
}

export interface Homework {
    id: string;
    classId: string;
    title: string;
    dueDate: string;
    description: string;
}

export interface HomeworkSubmission {
    id: string;
    homeworkId: string;
    studentId: string;
    status: 'done' | 'none';
    date: string;
}

export interface MessageRecord {
    id: string;
    type: 'sms' | 'kakao' | 'lms';
    title: string;
    content: string;
    targetCount: number;
    date: string;
    status: 'success' | 'reserved' | 'failed';
    reservationTime?: string;
}

export interface PaymentRecord {
    id: string;
    studentId: string;
    amount: number;
    type: '카드' | '현금' | '이체';
    method?: '카드' | '현금' | '이체'; 
    productIds?: string[]; // 선택적으로 변경
    date: string;
    description: string;
    status?: 'completed' | 'canceled' | 'refunded' | 'pending' | 'unpaid';
}

export interface RefundRecord {
    id: string;
    paymentId: string;
    studentId: string;
    amount: number;
    date: string;
    reason: string;
    method: '카드' | '현금' | '이체';
}

export interface ExpenseRecord {
    id: string;
    category: 'rent' | 'salary' | 'utilities' | 'marketing' | 'etc';
    amount: number;
    date: string;
    description: string;
    payMethod: '카드' | '이체' | '현금';
}

export interface AcademyClass {
    id: string;
    name: string;
    teacherId: string;
    studentIds: string[];
    billingType: BillingType;
    maxStudents: number;
    sessionCount?: number; 
    duration?: number;
    time?: string;
    day?: string[];
    fixedTime?: { day: string; startTime: string }[];
    requiredEquipment?: string[];
    priority?: number;
    color?: string; // 반 테마 색상 (스마트 컬러링용)
    subject?: string; // 수학, 영어, 국어 등
    fee: number; // 수강료
}

export interface ShuttleDriver {
    id: string;
    name: string;
    phone: string;
    status: string;
    salary: number; // 급여
    isOnHoliday: boolean; // 휴가 여부
    joinDate: string;
    vehiclePlate?: string; // 차량번호
    memo?: string; // 메모 추가
    email?: string; // 이메일 추가
    availability: {
        day: string;
        startTime: string;
        endTime: string;
    }[];
}

export interface GeneralStaff {
    id: string;
    name: string;
    phone: string;
    role: string; // 행정, 교무, 상담 등
    status: string; // 상태 추가
    salary: number; // 급여
    isOnHoliday: boolean; // 휴가 여부
    joinDate: string;
    memo?: string; // 메모 추가
    email?: string; // 이메일 추가
    availability: {
        day: string;
        startTime: string;
        endTime: string;
    }[];
}

export interface ShuttleVehicle {
    id: string;
    plate: string;
    model: string;
    status: string;
    lastCheck: string;
    mileage: number;
    driverId: string;
}

export interface ShuttleRoute {
    id: string;
    name: string;
    stops: number;
    studentCount: number;
    startTime: string;
    endTime: string;
}

export interface AppSettings {
    academy: AcademyPolicy;
    salaryPolicies: SalaryPolicy[];
    teachers: TeacherSetting[];
    products: ProductSetting[];
    discounts: DiscountPolicy[];
    timetable: TimetableEvent[];
    students: Student[];
    consultations: Consultation[];
    attendance: Attendance[];
    payments: PaymentRecord[];
    classes: AcademyClass[];
    exams: Exam[];
    scores: Score[];
    homework: Homework[];
    submissions: HomeworkSubmission[];
    messages: MessageRecord[];
    expenses: ExpenseRecord[];
    refunds: RefundRecord[];
    roomSettings: RoomSetting[];
    documents: DocumentRecord[];
    shuttleDrivers: ShuttleDriver[];
    shuttleVehicles: ShuttleVehicle[];
    shuttleRoutes: ShuttleRoute[];
    generalStaff: GeneralStaff[];
    favorites: string[];
    history: { id: string; name: string; href: string; type: 'student' | 'class' | 'menu'; date: string }[];
    currentUserRole: UserRole;
    isAuthenticated: boolean;
    uiState: {
        isZenMode: boolean;
    };
    version: string; // 데이터 스키마 버전
}
