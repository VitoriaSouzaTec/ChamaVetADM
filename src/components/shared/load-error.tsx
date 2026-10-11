import { AlertTriangle } from 'lucide-react'

export function LoadError({ title, message }: { title: string; message: string }) {
  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold font-heading text-[#1E293B]">{title}</h1>
      <div className="p-5 rounded-2xl border border-[#FECACA] bg-[#FEE2E2] text-sm text-[#DC2626] flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-bold">Não foi possível carregar os dados.</p>
          <p className="mt-1">{message}</p>
        </div>
      </div>
    </div>
  )
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Erro inesperado.'
}

/** Executa a carga no servidor e devolve o erro como texto (o JSX fica fora do try/catch). */
export async function load<T>(fn: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    return { ok: true, data: await fn() }
  } catch (err) {
    return { ok: false, error: errorMessage(err) }
  }
}
