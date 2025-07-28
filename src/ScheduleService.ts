import { firestoreService } from './firestoreService'

export interface ScheduleEntry {
  date: string
  cleanerId: string
  facilityId: string
  startTime?: string
  endTime?: string
  notes?: string
}

export interface Facility {
  id: string
  name: string
}

export interface FacilityResolution {
  facilityId?: string
  facilityName?: string
  requiresSelection: boolean
  availableFacilities: Facility[]
  hasMultipleShifts: boolean
}

class ScheduleService {
  private cachedSchedule: ScheduleEntry[] | null = null
  private cachedFacilities: Facility[] | null = null
  private cacheDate: string | null = null

  async resolveFacilityId(cleanerId: string): Promise<FacilityResolution> {
    const today = new Date().toISOString().slice(0, 10)
    
    try {
      // Get today's schedule for this cleaner
      const schedule = await this.getSchedule(today)
      const cleanerSchedule = schedule.filter(entry => entry.cleanerId === cleanerId)
      
      if (cleanerSchedule.length === 1) {
        // Single shift found
        const facilityId = cleanerSchedule[0].facilityId
        const facilityName = await this.getFacilityName(facilityId)
        
        return {
          facilityId,
          facilityName,
          requiresSelection: false,
          availableFacilities: [],
          hasMultipleShifts: false
        }
      } else if (cleanerSchedule.length > 1) {
        // Multiple shifts found
        const facilityId = cleanerSchedule[0].facilityId
        const facilityName = await this.getFacilityName(facilityId)
        
        return {
          facilityId,
          facilityName,
          requiresSelection: false,
          availableFacilities: [],
          hasMultipleShifts: true
        }
      } else {
        // No schedule found, show facility selection
        const facilities = await this.getFacilities()
        
        return {
          requiresSelection: true,
          availableFacilities: facilities,
          hasMultipleShifts: false
        }
      }
    } catch (error) {
      console.error('Error resolving facility:', error)
      
      // Fallback to facility selection
      const facilities = await this.getFacilities()
      return {
        requiresSelection: true,
        availableFacilities: facilities,
        hasMultipleShifts: false
      }
    }
  }

  private async getSchedule(date: string): Promise<ScheduleEntry[]> {
    // Use cache if available and for the same date
    if (this.cachedSchedule && this.cacheDate === date) {
      return this.cachedSchedule
    }

    try {
      const schedule = await firestoreService.getSchedule(date)
      this.cachedSchedule = schedule
      this.cacheDate = date
      return schedule
    } catch (error) {
      console.error('Error fetching schedule:', error)
      return []
    }
  }

  private async getFacilities(): Promise<Facility[]> {
    // Use cache if available
    if (this.cachedFacilities) {
      return this.cachedFacilities
    }

    try {
      const facilities = await firestoreService.getFacilities()
      this.cachedFacilities = facilities
      return facilities
    } catch (error) {
      console.error('Error fetching facilities:', error)
      return []
    }
  }

  private async getFacilityName(facilityId: string): Promise<string> {
    const facilities = await this.getFacilities()
    const facility = facilities.find(f => f.id === facilityId)
    return facility?.name || facilityId
  }

  // Clear cache when needed
  clearCache() {
    this.cachedSchedule = null
    this.cachedFacilities = null
    this.cacheDate = null
  }
}

export const scheduleService = new ScheduleService() 