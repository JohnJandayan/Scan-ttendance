export { BaseRepository } from './base'
export { OrganizationRepository } from './organization'
export { MemberRepository } from './member'
export { EventRepository } from './event'
export { AttendanceRepository } from './attendance'

import { OrganizationRepository } from './organization'
import { MemberRepository } from './member'
import { EventRepository } from './event'
import { AttendanceRepository } from './attendance'

// Repository factory for easy instantiation
export class RepositoryFactory {
  private static organizationRepo: OrganizationRepository
  private static memberRepo: MemberRepository
  private static eventRepo: EventRepository
  private static attendanceRepos = new Map<string, AttendanceRepository>()

  static getOrganizationRepository(): OrganizationRepository {
    if (!this.organizationRepo) {
      this.organizationRepo = new OrganizationRepository()
    }
    return this.organizationRepo
  }

  static getMemberRepository(): MemberRepository {
    if (!this.memberRepo) {
      this.memberRepo = new MemberRepository()
    }
    return this.memberRepo
  }

  static getEventRepository(): EventRepository {
    if (!this.eventRepo) {
      this.eventRepo = new EventRepository()
    }
    return this.eventRepo
  }

  static getAttendanceRepository(orgId: string, eventName: string): AttendanceRepository {
    const key = `${orgId}_${eventName}`
    if (!this.attendanceRepos.has(key)) {
      this.attendanceRepos.set(key, new AttendanceRepository(orgId, eventName))
    }
    return this.attendanceRepos.get(key)!
  }

  // Clear all cached repositories (useful for testing)
  static clearCache(): void {
    this.organizationRepo = undefined as any
    this.memberRepo = undefined as any
    this.eventRepo = undefined as any
    this.attendanceRepos.clear()
  }
}