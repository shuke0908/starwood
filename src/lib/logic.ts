/**
 * STARWOOD ERP CORE LOGIC (Simplified Algorithms)
 * AI-Free, Data-Driven, Speed Optimized
 */

// 1. Attendance & Billing Logic
export function getWeekdayCountInMonth(year: number, month: number, weekdays: string[]): number {
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayMap: Record<string, number> = { "일": 0, "월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6 };
    const targetDays = weekdays.map(d => dayMap[d]);
    
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        if (targetDays.includes(date.getDay())) {
            count++;
        }
    }
    return count;
}

export function calculateMonthlyFee(baseFee: number, billingType: 'flat' | 'session', year: number, month: number, weekdays: string[]): number {
    if (billingType === 'flat') return baseFee;
    
    const sessions = getWeekdayCountInMonth(year, month, weekdays);
    return (baseFee / 4) * sessions; // Assuming baseFee is for 4 sessions as a benchmark or per-session rate
}

// 2. Refund Logic (The "Half Rule")
// - If less than 1/2 of the course elapsed: refund 1/2 of total
// - If 1/2 or more elapsed: no refund
export function calculateRefund(totalFee: number, totalSessions: number, attendedSessions: number): number {
    const elapsedRatio = attendedSessions / totalSessions;
    if (elapsedRatio < 0.5) {
        return Math.floor(totalFee / 2);
    }
    return 0;
}

// 3. Teacher Settlement
export type SettlementType = 'fixed' | 'ratio' | 'hourly';

export function calculateSettlement(type: SettlementType, value: number, data: { revenue?: number, hours?: number }): number {
    switch (type) {
        case 'fixed': return value;
        case 'ratio': return (data.revenue || 0) * (value / 100);
        case 'hourly': return (data.hours || 0) * value;
        default: return 0;
    }
}

// 4. To-Do & Alert Logic
export function isConsultationOverdue(lastDate: string | null, thresholdDays: number = 30): boolean {
    if (!lastDate) return true;
    const last = new Date(lastDate);
    const today = new Date();
    const diff = (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= thresholdDays;
}

export function isUnpaidOverdue(dueDate: string, todayDate: string = new Date().toISOString().split('T')[0]): boolean {
    return new Date(dueDate) < new Date(todayDate);
}

// 5. Change Tracking Utility
export function getDiff(oldObj: any, newObj: any, labels: Record<string, string>): string[] {
    const changes: string[] = [];
    for (const key in labels) {
        const oldVal = oldObj[key];
        const newVal = newObj[key];
        
        // Deep compare for simple objects/arrays
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            const displayOld = (oldVal === undefined || oldVal === null || oldVal === '') ? '없음' : oldVal;
            const displayNew = (newVal === undefined || newVal === null || newVal === '') ? '없음' : newVal;
            
            // Format for display (truncate long strings)
            const formatVal = (v: any) => {
                if (typeof v === 'boolean') return v ? '참' : '거짓';
                if (Array.isArray(v)) return v.join(', ');
                if (typeof v === 'string' && v.length > 20) return v.slice(0, 20) + '...';
                return v;
            };
            
            changes.push(`${labels[key]}: ${formatVal(displayOld)} → ${formatVal(displayNew)}`);
        }
    }
    return changes;
}
