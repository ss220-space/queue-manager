export enum AdminFlag {
  R_BUILDMODE = 1 << 0,
  R_ADMIN = 1 << 1,
  R_BAN = 1 << 2,
  R_EVENT = 1 << 3,
  R_SERVER = 1 << 4,
  R_DEBUG = 1 << 5,
  R_POSSESS = 1 << 6,
  R_PERMISSIONS = 1 << 7,
  R_STEALTH = 1 << 8,
  R_REJUVINATE = 1 << 9,
  R_VAREDIT = 1 << 10,
  R_SOUNDS = 1 << 11,
  R_SPAWN = 1 << 12,
  R_MOD = 1 << 13,
  R_MENTOR = 1 << 14,
  R_PROCCALL = 1 << 15,
  R_VIEWRUNTIMES = 1 << 16,
}

export function hasFlag(profile: { adminFlags: number }, flag: AdminFlag): boolean {
  return (profile.adminFlags & flag) != 0
}