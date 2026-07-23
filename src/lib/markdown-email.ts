/**
 * Converte texto em formato Markdown para HTML inline-styled
 * otimizado para clientes de e-mail (Gmail, Outlook, Apple Mail, Brevo)
 */
export function parseMarkdownToEmailHtml(markdown: string): string {
  if (!markdown) return '<p></p>'

  // Se já for um documento HTML completo (ex: colou HTML bruto da Brevo/email)
  if (markdown.trim().toLowerCase().startsWith('<!doctype') || markdown.trim().toLowerCase().startsWith('<html')) {
    return markdown
  }

  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const htmlBlocks: string[] = []

  let inList: 'ul' | 'ol' | null = null
  let listItems: string[] = []
  let inCodeBlock = false
  let codeBuffer: string[] = []
  let paragraphBuffer: string[] = []

  function flushParagraph() {
    if (paragraphBuffer.length > 0) {
      const text = paragraphBuffer.join(' ').trim()
      if (text) {
        htmlBlocks.push(
          `<p style="margin-top: 0; margin-bottom: 16px; line-height: 1.6; color: #334155; font-size: 15px;">${formatInlineMarkdown(text)}</p>`
        )
      }
      paragraphBuffer = []
    }
  }

  function flushList() {
    if (inList && listItems.length > 0) {
      const itemsHtml = listItems
        .map(
          (item) =>
            `<li style="margin-bottom: 8px; line-height: 1.6; color: #334155; font-size: 15px;">${formatInlineMarkdown(item)}</li>`
        )
        .join('')
      const listTag = inList === 'ul' ? 'ul' : 'ol'
      htmlBlocks.push(
        `<${listTag} style="margin-top: 0; margin-bottom: 16px; padding-left: 24px; color: #334155;">${itemsHtml}</${listTag}>`
      )
      listItems = []
      inList = null
    }
  }

  function flushCodeBlock() {
    if (codeBuffer.length > 0) {
      const codeText = escapeHtml(codeBuffer.join('\n'))
      htmlBlocks.push(
        `<pre style="background-color: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; font-family: 'Courier New', Courier, monospace; font-size: 13px; line-height: 1.5; overflow-x: auto; margin: 16px 0;"><code>${codeText}</code></pre>`
      )
      codeBuffer = []
      inCodeBlock = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // 1. Bloco de Código (```)
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock()
      } else {
        flushParagraph()
        flushList()
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBuffer.push(line)
      continue
    }

    // 2. Linha em Branco (separador de parágrafo)
    if (trimmed === '') {
      flushParagraph()
      flushList()
      continue
    }

    // 3. Cabeçalhos (#, ##, ###)
    if (trimmed.startsWith('#')) {
      flushParagraph()
      flushList()

      if (trimmed.startsWith('# ')) {
        const title = trimmed.slice(2).trim()
        htmlBlocks.push(
          `<h1 style="color: #1e293b; font-size: 24px; font-weight: 700; margin-top: 24px; margin-bottom: 12px; line-height: 1.3;">${formatInlineMarkdown(title)}</h1>`
        )
      } else if (trimmed.startsWith('## ')) {
        const title = trimmed.slice(3).trim()
        htmlBlocks.push(
          `<h2 style="color: #334155; font-size: 20px; font-weight: 700; margin-top: 20px; margin-bottom: 10px; line-height: 1.3;">${formatInlineMarkdown(title)}</h2>`
        )
      } else if (trimmed.startsWith('### ')) {
        const title = trimmed.slice(4).trim()
        htmlBlocks.push(
          `<h3 style="color: #475569; font-size: 16px; font-weight: 600; margin-top: 16px; margin-bottom: 8px; line-height: 1.3;">${formatInlineMarkdown(title)}</h3>`
        )
      } else {
        // Mais de 3 cerquilhas
        const title = trimmed.replace(/^#+\s*/, '')
        htmlBlocks.push(
          `<h4 style="color: #475569; font-size: 14px; font-weight: 600; margin-top: 12px; margin-bottom: 6px;">${formatInlineMarkdown(title)}</h4>`
        )
      }
      continue
    }

    // 4. Divisor Horizontal (--- ou ***)
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushParagraph()
      flushList()
      htmlBlocks.push(
        `<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />`
      )
      continue
    }

    // 5. Citação (Blockquote > )
    if (trimmed.startsWith('> ')) {
      flushParagraph()
      flushList()
      const quoteText = trimmed.slice(2).trim()
      htmlBlocks.push(
        `<blockquote style="border-left: 4px solid #6366f1; background-color: #f8fafc; padding: 12px 16px; margin: 16px 0; color: #475569; font-style: italic; border-radius: 4px; font-size: 14px; line-height: 1.6;">${formatInlineMarkdown(quoteText)}</blockquote>`
      )
      continue
    }

    // 6. Lista Não Ordenada (- ou * )
    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph()
      if (inList !== 'ul') {
        flushList()
        inList = 'ul'
      }
      listItems.push(trimmed.replace(/^[-*]\s+/, ''))
      continue
    }

    // 7. Lista Ordenada (1. 2. )
    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph()
      if (inList !== 'ol') {
        flushList()
        inList = 'ol'
      }
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''))
      continue
    }

    // 8. Linha de Texto Normal (Parágrafo)
    if (inList) {
      flushList()
    }
    paragraphBuffer.push(trimmed)
  }

  flushParagraph()
  flushList()
  flushCodeBlock()

  const bodyContentHtml = htmlBlocks.join('\n')

  // Retorna o HTML embutido em um container de e-mail responsivo e elegante
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #4f46e5; padding: 24px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Bold Mendel</h2>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px; font-size: 15px; color: #334155; line-height: 1.6;">
              ${bodyContentHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0; margin-bottom: 4px; font-weight: 600;">© ${new Date().getFullYear()} Freela Dock. Todos os direitos reservados.</p>
              <p style="margin: 0; color: #94a3b8;">Você recebeu este e-mail porque está inscrito em nossa lista de novidades.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Formata marcações inline do Markdown: **negrito**, *itálico*, `código`, [link](url) e ![imagem](url)
 */
function formatInlineMarkdown(text: string): string {
  let formatted = escapeHtml(text)

  // 1. Imagens: ![alt](url)
  formatted = formatted.replace(
    /!\[(.*?)\]\((.*?)\)/g,
    '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; display: block;" />'
  )

  // 2. Links: [texto](url)
  formatted = formatted.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" style="color: #4f46e5; text-decoration: underline; font-weight: 600;" target="_blank" rel="noopener noreferrer">$1</a>'
  )

  // 3. Negrito: **texto** ou __texto__
  formatted = formatted.replace(
    /(\*\*|__)(.*?)\1/g,
    '<strong style="font-weight: 700; color: #0f172a;">$2</strong>'
  )

  // 4. Itálico: *texto* ou _texto_
  formatted = formatted.replace(
    /(\*|_)(.*?)\1/g,
    '<em style="font-style: italic;">$2</em>'
  )

  // 5. Código inline: `código`
  formatted = formatted.replace(
    /`([^`]+)`/g,
    '<code style="background-color: #f1f5f9; color: #6366f1; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px;">$1</code>'
  )

  return formatted
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
