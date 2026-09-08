import { z } from 'zod';
export const opportunitySchema = z.object({
    title: z.string().trim().min(3).max(120), description: z.string().trim().min(20).max(4000),
    country: z.string().trim().min(2).max(80), city: z.string().trim().max(80).default(''),
    positions: z.array(z.enum(['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'])).max(11).default([]),
    min_age: z.number().int().min(16).max(50).default(16), max_age: z.number().int().min(16).max(50).default(50),
    deadline: z.string().datetime(), starts_at: z.string().datetime().optional(),
}).refine(v => v.max_age >= v.min_age, { message: 'Maximum age must be at least minimum age' });
export const applicationStatus = z.enum(['submitted', 'shortlisted', 'invited', 'unsuccessful', 'withdrawn']);
export function canTransitionApplication(current: string, next: string, isApplicant: boolean) {
    if (current === next)
        return true;
    if (isApplicant)
        return next === 'withdrawn' && !['withdrawn', 'unsuccessful'].includes(current);
    const transitions: Record<string, string[]> = { submitted: ['shortlisted', 'invited', 'unsuccessful'], shortlisted: ['invited', 'unsuccessful'], invited: ['unsuccessful'], unsuccessful: [], withdrawn: [] };
    return (transitions[current] || []).includes(next);
}
export function ageOn(dateOfBirth: string, today = new Date()) {
    const born = new Date(dateOfBirth);
    if (!Number.isFinite(born.getTime()))
        return null;
    return today.getUTCFullYear() - born.getUTCFullYear() - (today.getUTCMonth() < born.getUTCMonth() || (today.getUTCMonth() === born.getUTCMonth() && today.getUTCDate() < born.getUTCDate()) ? 1 : 0);
}
