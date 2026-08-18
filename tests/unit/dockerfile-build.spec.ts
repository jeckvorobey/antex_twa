import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const dockerfilePath = resolve(process.cwd(), 'Dockerfile')

describe('Dockerfile', () => {
  it('использует встроенный frontend BuildKit без загрузки dockerfile image', () => {
    const dockerfile = readFileSync(dockerfilePath, 'utf8')

    expect(dockerfile).not.toMatch(/^# syntax=docker\/dockerfile:/m)
  })
})
