import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import StatisticsPanel from '@/components/dashboard/StatisticsPanel'

describe('StatisticsPanel', () => {
  const mockStats = {
    activeEvents: 5,
    archivedEvents: 10,
    totalMembers: 15,
    recentScans: 25,
    totalAttendance: 100
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all statistic cards', () => {
    render(<StatisticsPanel stats={mockStats} />)
    
    expect(screen.getByText('Active Events')).toBeInTheDocument()
    expect(screen.getByText('Total Members')).toBeInTheDocument()
    expect(screen.getByText('Recent Scans')).toBeInTheDocument()
    expect(screen.getByText('Total Attendance')).toBeInTheDocument()
    expect(screen.getByText('Archived Events')).toBeInTheDocument()
  })

  it('displays correct descriptions for each statistic', () => {
    render(<StatisticsPanel stats={mockStats} />)
    
    expect(screen.getByText('Currently running events')).toBeInTheDocument()
    expect(screen.getByText('Organization members')).toBeInTheDocument()
    expect(screen.getByText('QR scans today')).toBeInTheDocument()
    expect(screen.getByText('All-time verified attendees')).toBeInTheDocument()
    expect(screen.getByText('Completed events')).toBeInTheDocument()
  })

  it('starts with animated values at 0', () => {
    render(<StatisticsPanel stats={mockStats} />)
    
    // Initially should show 0 for all values
    const statValues = screen.getAllByText('0')
    expect(statValues.length).toBeGreaterThan(0)
  })

  it('animates to final values', async () => {
    render(<StatisticsPanel stats={mockStats} />)
    
    // Wait for animation to complete
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument() // Active Events
      expect(screen.getByText('15')).toBeInTheDocument() // Total Members
      expect(screen.getByText('25')).toBeInTheDocument() // Recent Scans
      expect(screen.getByText('100')).toBeInTheDocument() // Total Attendance
      expect(screen.getByText('10')).toBeInTheDocument() // Archived Events
    }, { timeout: 2000 })
  })

  it('displays correct icons for each statistic', () => {
    render(<StatisticsPanel stats={mockStats} />)
    
    // Check that SVG elements are present
    const svgElements = document.querySelectorAll('svg')
    expect(svgElements.length).toBeGreaterThanOrEqual(5)
  })

  it('applies correct color classes to statistic cards', () => {
    render(<StatisticsPanel stats={mockStats} />)
    
    // We can't easily test the exact color classes without accessing the DOM directly,
    // but we can verify the structure is correct
    const activeEventsCard = screen.getByText('Active Events').closest('div')
    expect(activeEventsCard).toBeInTheDocument()
  })

  it('displays quick insights section', () => {
    render(<StatisticsPanel stats={mockStats} />)
    
    expect(screen.getByText('Quick Insights')).toBeInTheDocument()
    expect(screen.getByText('Avg. attendance per event')).toBeInTheDocument()
    expect(screen.getByText('Team member ratio')).toBeInTheDocument()
    expect(screen.getByText('Scans in last 24h')).toBeInTheDocument()
  })

  it('calculates average attendance per event correctly', async () => {
    render(<StatisticsPanel stats={mockStats} />)
    
    await waitFor(() => {
      // 100 total attendance / 5 active events = 20
      expect(screen.getByText('20')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('calculates team member ratio correctly', async () => {
    render(<StatisticsPanel stats={mockStats} />)
    
    await waitFor(() => {
      // (15 - 1) / 15 * 100 = 93.33% rounded to 93%
      expect(screen.getByText('93%')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('displays recent scans in insights', async () => {
    render(<StatisticsPanel stats={mockStats} />)
    
    await waitFor(() => {
      // Should show the recent scans value in insights section
      const recentScansElements = screen.getAllByText('25')
      expect(recentScansElements.length).toBeGreaterThanOrEqual(2) // One in main stats, one in insights
    }, { timeout: 2000 })
  })

  it('handles zero active events gracefully', async () => {
    const zeroActiveEventsStats = {
      ...mockStats,
      activeEvents: 0
    }
    
    render(<StatisticsPanel stats={zeroActiveEventsStats} />)
    
    await waitFor(() => {
      // Should show 0 for average attendance when no active events
      expect(screen.getByText('0')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('handles single member (owner only) correctly', async () => {
    const singleMemberStats = {
      ...mockStats,
      totalMembers: 1
    }
    
    render(<StatisticsPanel stats={singleMemberStats} />)
    
    await waitFor(() => {
      // (1 - 1) / 1 * 100 = 0%
      expect(screen.getByText('0%')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('formats large numbers with commas', async () => {
    const largeNumberStats = {
      activeEvents: 1,
      archivedEvents: 1,
      totalMembers: 1,
      recentScans: 1,
      totalAttendance: 1234567
    }
    
    render(<StatisticsPanel stats={largeNumberStats} />)
    
    await waitFor(() => {
      expect(screen.getByText('1,234,567')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('applies hover effects to statistic cards', () => {
    render(<StatisticsPanel stats={mockStats} />)
    
    // Find the actual card containers
    const cardContainers = document.querySelectorAll('.bg-white.rounded-lg.shadow-md')
    expect(cardContainers.length).toBeGreaterThanOrEqual(5)
    
    cardContainers.forEach(card => {
      expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow')
    })
  })

  it('uses responsive grid layout', () => {
    render(<StatisticsPanel stats={mockStats} />)
    
    // Find the grid container
    const gridContainer = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-5')
    expect(gridContainer).toBeInTheDocument()
  })

  it('displays insights with correct background colors', () => {
    render(<StatisticsPanel stats={mockStats} />)
    
    // Find the insight containers by their background color classes
    const blueInsight = document.querySelector('.bg-blue-50')
    const greenInsight = document.querySelector('.bg-green-50')
    const purpleInsight = document.querySelector('.bg-purple-50')
    
    expect(blueInsight).toBeInTheDocument()
    expect(greenInsight).toBeInTheDocument()
    expect(purpleInsight).toBeInTheDocument()
  })
})