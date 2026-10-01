import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cnpj: string }> }
) {
  const { cnpj } = await params
  const cleanCnpj = cnpj.replace(/\D/g, '')

  if (cleanCnpj.length !== 14) {
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
      next: { revalidate: 86400 }, // Cache de 24h conforme especificação
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Falha ao consultar CNPJ na BrasilAPI' },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json({
      razaoSocial: data.razao_social,
      nomeFantasia: data.nome_fantasia || data.razao_social,
      situacaoCadastral: data.descricao_situacao_cadastral,
      cnae: `${data.cnae_fiscal} - ${data.cnae_fiscal_descricao}`,
      endereco: `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio}/${data.uf}`,
    })
  } catch {
    return NextResponse.json(
      { error: 'Erro de conexão com o serviço de CNPJ' },
      { status: 500 }
    )
  }
}
