describe('Project Setup', () => {
  it('should have basic configuration working', () => {
    expect(true).toBe(true)
  })

  it('should be able to import auth utilities', async () => {
    const auth = await import('@/lib/auth')
    expect(typeof auth).toBe('object')
    expect(typeof auth.hashPassword).toBe('function')
    expect(typeof auth.comparePassword).toBe('function')
  })

  it('should be able to import database utilities', async () => {
    const database = await import('@/lib/database')
    expect(typeof database).toBe('object')
    expect(typeof database.DatabaseService).toBe('function')
  })
})
