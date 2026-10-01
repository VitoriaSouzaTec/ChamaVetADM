import { NextResponse } from 'next/server'
import { MOCK_USERS, MOCK_REQUESTS } from '@/server/mock-data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.toLowerCase() || ''

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const userResults = MOCK_USERS.filter(
    (u) =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.identifier.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q)
  ).map((u) => ({
    id: u.id,
    title: u.fullName,
    subtitle: `${u.role} · ${u.identifier} · ${u.city}`,
    type: 'user' as const,
    badge: u.verificationStatus === 'VERIFIED' ? 'Verificado' : undefined,
  }))

  const requestResults = MOCK_REQUESTS.filter(
    (r) =>
      r.clinicName.toLowerCase().includes(q) ||
      r.specialtyName.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q)
  ).map((r) => ({
    id: r.id,
    title: `${r.specialtyName} (${r.type})`,
    subtitle: `${r.clinicName} · ${r.workDate}`,
    type: 'request' as const,
    badge: r.urgent ? 'Urgente' : undefined,
  }))

  return NextResponse.json({
    results: [...userResults, ...requestResults].slice(0, 8),
  })
}
