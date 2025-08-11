'use client'

import { useState } from 'react'

interface AttendanceExportProps {
  eventId: string
  eventName?: string
}

export default function AttendanceExport({ eventId, eventName = 'Event' }: AttendanceExportProps) {
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')

  const exportAttendance = async () => {
    try {
      setExporting(true)
      
      // Fetch all attendance records
      const response = await fetch(`/api/events/${eventId}/verifications?limit=1000&page=1`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch attendance data')
      }

      const records = data.data?.data || []
      
      if (records.length === 0) {
        alert('No attendance records to export')
        return
      }

      if (exportFormat === 'csv') {
        exportAsCSV(records)
      } else {
        exportAsJSON(records)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export attendance records')
    } finally {
      setExporting(false)
    }
  }

  const exportAsCSV = (records: any[]) => {
    const headers = ['Name', 'Participant ID', 'Status', 'Check-in Time']
    const csvContent = [
      headers.join(','),
      ...records.map(record => [
        `"${record.name}"`,
        `"${record.participantId}"`,
        record.status,
        `"${new Date(record.verifiedAt).toLocaleString()}"`
      ].join(','))
    ].join('\n')

    downloadFile(csvContent, `${sanitizeFilename(eventName)}_attendance.csv`, 'text/csv')
  }

  const exportAsJSON = (records: any[]) => {
    const jsonContent = JSON.stringify({
      event: eventName,
      exportDate: new Date().toISOString(),
      totalRecords: records.length,
      records: records.map(record => ({
        name: record.name,
        participantId: record.participantId,
        status: record.status,
        checkInTime: record.verifiedAt
      }))
    }, null, 2)

    downloadFile(jsonContent, `${sanitizeFilename(eventName)}_attendance.json`, 'application/json')
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Export Attendance</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Export Format</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as 'csv')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">CSV (Excel compatible)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={(e) => setExportFormat(e.target.value as 'json')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">JSON</span>
              </label>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Export includes:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Participant names and IDs</li>
              <li>• Check-in status (verified, duplicate, invalid)</li>
              <li>• Check-in timestamps</li>
              <li>• Export metadata (date, total records)</li>
            </ul>
          </div>

          <button
            onClick={exportAttendance}
            disabled={exporting}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}