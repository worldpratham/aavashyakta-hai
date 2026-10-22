import { WAGE_TYPES, type WageType } from './api';

export const formatWage = (
  wage: string | number | null | undefined,
  type: WageType | null | undefined
) => {
  if (wage === null || wage === undefined || wage === '') return 'Wage negotiable';
  const label = type ? WAGE_TYPES.find((w) => w.value === type)?.label.replace('Per ', '/') : '';
  const suffix = type === 'fixed' ? '' : label ? `/${label}` : '';
  return `₹${wage}${suffix}`;
};

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
};

export const parseSkills = (skills: string | null): string[] => {
  if (!skills) return [];
  return skills.split(',').map((s) => s.trim()).filter(Boolean);
};

export const joinSkills = (skills: string[]): string => skills.join(', ');
