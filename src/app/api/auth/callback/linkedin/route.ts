import { NextRequest, NextResponse } from 'next/server'
import { exchangeLinkedinCodeForToken } from '@/lib/linkedin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    console.error('OAuth do LinkedIn negado/erro:', errorDescription)
    return NextResponse.redirect(
      new URL(`/social-media?tab=linkedin&error=${encodeURIComponent(errorDescription || 'Autorização do LinkedIn negada.')}`, req.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/social-media?tab=linkedin&error=Código%20de%20autorização%20ausente', req.url)
    )
  }

  try {
    const { accessToken, expiresIn } = await exchangeLinkedinCodeForToken(code)

    console.log('✅ Access Token do LinkedIn obtido com sucesso! Válido por:', expiresIn, 'segundos.')
    console.log('ACCESS TOKEN:', accessToken)

    // Redireciona para o painel com o token ou mensagem de sucesso
    return NextResponse.redirect(
      new URL('/social-media?tab=linkedin&connected=true', req.url)
    )
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro no OAuth do LinkedIn'
    console.error('Erro na troca do código do LinkedIn:', errorMsg)
    return NextResponse.redirect(
      new URL(`/social-media?tab=linkedin&error=${encodeURIComponent(errorMsg)}`, req.url)
    )
  }
}
