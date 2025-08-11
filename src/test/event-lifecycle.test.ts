import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EventRepository } from '@/lib/repositories'
import { DatabaseService } from '@/lib/database'

describe('Event Lifecycle Management', () => {
  let eventRepo: EventRepository
  let testSchemaName: string
  let testEventId: string

  beforeEach(async () => {
    // Create test schema
    testSchemaName = `test_org_${Date.now()}`
    eventRepo = new EventRepository()
    
    // Create test schema
    await DatabaseService.createOrganizationSchema(testSchemaName)
    
    // Create test event
    const eventResult = await eventRepo.create(testSchemaName, {
      name: 'Test Event',
      creatorId: 'test-creator-id'
    })
    
    expect(eventResult.success).toBe(true)
    testEventId = eventResult.data!.id
  })

  afterEach(async () => {
    // Clean up test schema
    try {
      await DatabaseService.dropOrganizationSchema(testSchemaName)
    } catch (error) {
      console.warn('Failed to clean up test schema:', error)
    }
  })

  describe('Event Archiving', () => {
    it('should successfully archive an active event', async () => {
      // Verify event is initially active
      const initialEvent = await eventRepo.findById(testSchemaName, testEventId)
      expect(initialEvent.success).toBe(true)
      expect(initialEvent.data!.isActive).toBe(true)
      expect(initialEvent.data!.endedAt).toBeUndefined()

      // Archive the event
      const archiveResult = await eventRepo.endEvent(testSchemaName, testEventId)
      expect(archiveResult.success).toBe(true)
      expect(archiveResult.data!.isActive).toBe(false)
      expect(archiveResult.data!.endedAt).toBeDefined()
      expect(archiveResult.data!.endedAt).toBeInstanceOf(Date)
    })

    it('should successfully reactivate an archived event', async () => {
      // First archive the event
      await eventRepo.endEvent(testSchemaName, testEventId)

      // Verify event is archived
      const archivedEvent = await eventRepo.findById(testSchemaName, testEventId)
      expect(archivedEvent.success).toBe(true)
      expect(archivedEvent.data!.isActive).toBe(false)

      // Reactivate the event
      const reactivateResult = await eventRepo.reactivateEvent(testSchemaName, testEventId)
      expect(reactivateResult.success).toBe(true)
      expect(reactivateResult.data!.isActive).toBe(true)
      expect(reactivateResult.data!.endedAt).toBeNull()
    })

    it('should record timestamp when archiving event', async () => {
      const beforeArchive = new Date()
      
      // Archive the event
      const archiveResult = await eventRepo.endEvent(testSchemaName, testEventId)
      
      const afterArchive = new Date()
      
      expect(archiveResult.success).toBe(true)
      expect(archiveResult.data!.endedAt).toBeDefined()
      
      const endedAt = new Date(archiveResult.data!.endedAt!)
      expect(endedAt.getTime()).toBeGreaterThanOrEqual(beforeArchive.getTime())
      expect(endedAt.getTime()).toBeLessThanOrEqual(afterArchive.getTime())
    })
  })

  describe('Event Listing by Status', () => {
    let activeEventId: string
    let archivedEventId: string

    beforeEach(async () => {
      // Create an additional active event
      const activeEventResult = await eventRepo.create(testSchemaName, {
        name: 'Active Test Event',
        creatorId: 'test-creator-id'
      })
      expect(activeEventResult.success).toBe(true)
      activeEventId = activeEventResult.data!.id

      // Create and archive another event
      const archivedEventResult = await eventRepo.create(testSchemaName, {
        name: 'Archived Test Event',
        creatorId: 'test-creator-id'
      })
      expect(archivedEventResult.success).toBe(true)
      archivedEventId = archivedEventResult.data!.id
      
      await eventRepo.endEvent(testSchemaName, archivedEventId)
    })

    it('should list only active events', async () => {
      const activeEvents = await eventRepo.listActive(testSchemaName)
      
      expect(activeEvents.success).toBe(true)
      expect(activeEvents.data).toHaveLength(2) // testEventId and activeEventId
      
      const eventIds = activeEvents.data!.map(event => event.id)
      expect(eventIds).toContain(testEventId)
      expect(eventIds).toContain(activeEventId)
      expect(eventIds).not.toContain(archivedEventId)
      
      // Verify all returned events are active
      activeEvents.data!.forEach(event => {
        expect(event.isActive).toBe(true)
        expect(event.endedAt).toBeUndefined()
      })
    })

    it('should list only archived events', async () => {
      const archivedEvents = await eventRepo.listArchived(testSchemaName)
      
      expect(archivedEvents.success).toBe(true)
      expect(archivedEvents.data).toHaveLength(1)
      
      const event = archivedEvents.data![0]
      expect(event.id).toBe(archivedEventId)
      expect(event.isActive).toBe(false)
      expect(event.endedAt).toBeDefined()
    })

    it('should list all events regardless of status', async () => {
      const allEvents = await eventRepo.list(testSchemaName)
      
      expect(allEvents.success).toBe(true)
      expect(allEvents.data!.data).toHaveLength(3) // All three events
      
      const eventIds = allEvents.data!.data.map(event => event.id)
      expect(eventIds).toContain(testEventId)
      expect(eventIds).toContain(activeEventId)
      expect(eventIds).toContain(archivedEventId)
    })
  })

  describe('Event Access Control', () => {
    it('should prevent operations on non-existent events', async () => {
      const nonExistentId = 'non-existent-event-id'
      
      const archiveResult = await eventRepo.endEvent(testSchemaName, nonExistentId)
      expect(archiveResult.success).toBe(false)
      expect(archiveResult.error).toContain('not found')
    })

    it('should handle archiving already archived events gracefully', async () => {
      // Archive the event first
      await eventRepo.endEvent(testSchemaName, testEventId)
      
      // Try to archive again
      const secondArchiveResult = await eventRepo.endEvent(testSchemaName, testEventId)
      expect(secondArchiveResult.success).toBe(true)
      expect(secondArchiveResult.data!.isActive).toBe(false)
    })

    it('should handle reactivating already active events gracefully', async () => {
      // Event is already active by default
      const reactivateResult = await eventRepo.reactivateEvent(testSchemaName, testEventId)
      expect(reactivateResult.success).toBe(true)
      expect(reactivateResult.data!.isActive).toBe(true)
      expect(reactivateResult.data!.endedAt).toBeNull()
    })
  })

  describe('Event Statistics with Lifecycle', () => {
    it('should maintain statistics after archiving', async () => {
      // Get initial stats
      const initialStats = await eventRepo.getEventStats(testSchemaName, testEventId)
      expect(initialStats.success).toBe(true)
      
      // Archive the event
      await eventRepo.endEvent(testSchemaName, testEventId)
      
      // Stats should still be accessible
      const archivedStats = await eventRepo.getEventStats(testSchemaName, testEventId)
      expect(archivedStats.success).toBe(true)
      expect(archivedStats.data).toEqual(initialStats.data)
    })

    it('should handle stats for events with no attendance data', async () => {
      const stats = await eventRepo.getEventStats(testSchemaName, testEventId)
      
      expect(stats.success).toBe(true)
      expect(stats.data!.totalAttendees).toBe(0)
      expect(stats.data!.verifiedAttendees).toBe(0)
      expect(stats.data!.verificationRate).toBe(0)
    })
  })

  describe('Event Deletion', () => {
    it('should successfully delete an event and its tables', async () => {
      // Verify event exists
      const eventBefore = await eventRepo.findById(testSchemaName, testEventId)
      expect(eventBefore.success).toBe(true)
      expect(eventBefore.data).toBeDefined()

      // Delete the event
      const deleteResult = await eventRepo.delete(testSchemaName, testEventId)
      expect(deleteResult.success).toBe(true)
      expect(deleteResult.data).toBe(true)

      // Verify event no longer exists
      const eventAfter = await eventRepo.findById(testSchemaName, testEventId)
      expect(eventAfter.success).toBe(true)
      expect(eventAfter.data).toBeNull()
    })

    it('should handle deletion of non-existent events', async () => {
      const nonExistentId = 'non-existent-event-id'
      
      const deleteResult = await eventRepo.delete(testSchemaName, nonExistentId)
      expect(deleteResult.success).toBe(false)
      expect(deleteResult.error).toContain('not found')
    })

    it('should delete both active and archived events', async () => {
      // Test deleting active event
      const activeDeleteResult = await eventRepo.delete(testSchemaName, testEventId)
      expect(activeDeleteResult.success).toBe(true)

      // Create and archive another event
      const archivedEventResult = await eventRepo.create(testSchemaName, {
        name: 'Event to Archive and Delete',
        creatorId: 'test-creator-id'
      })
      expect(archivedEventResult.success).toBe(true)
      
      const archivedEventId = archivedEventResult.data!.id
      await eventRepo.endEvent(testSchemaName, archivedEventId)

      // Test deleting archived event
      const archivedDeleteResult = await eventRepo.delete(testSchemaName, archivedEventId)
      expect(archivedDeleteResult.success).toBe(true)
    })
  })

  describe('Event Lifecycle Validation', () => {
    it('should maintain data integrity during lifecycle transitions', async () => {
      // Get initial event data
      const initialEvent = await eventRepo.findById(testSchemaName, testEventId)
      expect(initialEvent.success).toBe(true)
      
      const originalName = initialEvent.data!.name
      const originalCreatedAt = initialEvent.data!.createdAt
      const originalCreatorId = initialEvent.data!.creatorId

      // Archive event
      await eventRepo.endEvent(testSchemaName, testEventId)
      
      // Verify core data is preserved
      const archivedEvent = await eventRepo.findById(testSchemaName, testEventId)
      expect(archivedEvent.success).toBe(true)
      expect(archivedEvent.data!.name).toBe(originalName)
      expect(archivedEvent.data!.createdAt).toEqual(originalCreatedAt)
      expect(archivedEvent.data!.creatorId).toBe(originalCreatorId)

      // Reactivate event
      await eventRepo.reactivateEvent(testSchemaName, testEventId)
      
      // Verify core data is still preserved
      const reactivatedEvent = await eventRepo.findById(testSchemaName, testEventId)
      expect(reactivatedEvent.success).toBe(true)
      expect(reactivatedEvent.data!.name).toBe(originalName)
      expect(reactivatedEvent.data!.createdAt).toEqual(originalCreatedAt)
      expect(reactivatedEvent.data!.creatorId).toBe(originalCreatorId)
    })

    it('should handle rapid lifecycle transitions', async () => {
      // Rapidly archive and reactivate multiple times
      for (let i = 0; i < 3; i++) {
        const archiveResult = await eventRepo.endEvent(testSchemaName, testEventId)
        expect(archiveResult.success).toBe(true)
        expect(archiveResult.data!.isActive).toBe(false)

        const reactivateResult = await eventRepo.reactivateEvent(testSchemaName, testEventId)
        expect(reactivateResult.success).toBe(true)
        expect(reactivateResult.data!.isActive).toBe(true)
      }

      // Final state should be active
      const finalEvent = await eventRepo.findById(testSchemaName, testEventId)
      expect(finalEvent.success).toBe(true)
      expect(finalEvent.data!.isActive).toBe(true)
    })
  })
})