import { AdminFlag } from '../roles/adminFlag.enum'

export function ckeySanitize(key: string): string {
  return key.toLowerCase().replace(/[-_.\s]+/g, '').trim();
};


export function isStaff(adminFlags: number): boolean {
  return ((adminFlags & (AdminFlag.R_MENTOR | AdminFlag.R_MOD | AdminFlag.R_ADMIN | AdminFlag.R_SERVER)) !== 0)
}

export const dateNormilized = () => {
  return new Date(Date.now() + 3*60*60*1000);
}