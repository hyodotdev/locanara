/**
 * Locanara Web SDK Example
 * Tab-based navigation matching Mac/iOS structure
 */

import {
  FeatureAvailability,
  FeatureType,
  Locanara,
  RewriteLength,
  RewriteTone,
  SummarizeLength,
  SummarizeType,
} from '../src'

// ============================================================================
// Navigation State
// ============================================================================

type ViewState = 'tabs' | 'detail'
let currentView: ViewState = 'tabs'
let currentTab = 'features'
let currentDetailPage: string | null = null

// Feature availability state
const featureAvailability: Record<string, FeatureAvailability> = {}

// ============================================================================
// Feature Definitions (matching Mac order)
// ============================================================================

interface FeatureDefinition {
  id: string
  name: string
  description: string
  icon: string
}

const features: FeatureDefinition[] = [
  {
    id: 'summarize',
    name: 'Summarize',
    description: 'Condense long text into concise summaries',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  },
  {
    id: 'classify',
    name: 'Classify',
    description: 'Categorize content into predefined labels',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  },
  {
    id: 'extract',
    name: 'Extract',
    description: 'Extract entities and key information from text',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  },
  {
    id: 'chat',
    name: 'Chat',
    description: 'Have conversational interactions with AI',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  },
  {
    id: 'translate',
    name: 'Translate',
    description: 'Translate text between languages',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  },
  {
    id: 'rewrite',
    name: 'Rewrite',
    description: 'Rewrite text in different styles or tones',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  },
  {
    id: 'proofread',
    name: 'Proofread',
    description: 'Check and correct grammar and spelling',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  },
  {
    id: 'describeimage',
    name: 'Describe Image',
    description: 'Generate descriptions for images',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  },
]

// ============================================================================
// Initialize Locanara
// ============================================================================

const locanara = Locanara.getInstance({
  onDownloadProgress: (progress) => {
    console.log(
      `Download progress: ${progress.total > 0 ? ((progress.loaded / progress.total) * 100).toFixed(1) : '0'}%`,
    )
  },
})

// ============================================================================
// Helper Functions
// ============================================================================

function $(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (!element) {
    throw new Error(`Element with ID '${id}' not found.`)
  }
  return element
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function markdownToHtml(text: string): string {
  const lines = text.split('\n')
  let html = ''
  let inList = false

  for (const line of lines) {
    const bulletMatch = line.match(/^\s*[\*\-]\s+(.+)/)
    if (bulletMatch) {
      if (!inList) {
        html += '<ul>'
        inList = true
      }
      let content = escapeHtml(bulletMatch[1])
      content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      content = content.replace(/\*(.+?)\*/g, '<em>$1</em>')
      html += `<li>${content}</li>`
    } else {
      if (inList) {
        html += '</ul>'
        inList = false
      }
      if (line.trim()) {
        let content = escapeHtml(line)
        content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        content = content.replace(/\*(.+?)\*/g, '<em>$1</em>')
        html += `<p>${content}</p>`
      }
    }
  }
  if (inList) html += '</ul>'
  return html
}

function setResult(id: string, text: string, isError = false): void {
  const el = $(id)
  el.classList.remove('empty', 'error', 'formatted')
  if (isError) {
    el.classList.add('error')
    el.textContent = text
  } else {
    el.classList.add('formatted')
    el.innerHTML = markdownToHtml(text)
  }
}

function setLoading(btnId: string, loading: boolean): void {
  const btn = $(btnId) as HTMLButtonElement
  btn.disabled = loading

  if (loading) {
    if (!btn.dataset.text) {
      btn.dataset.text = btn.textContent || ''
    }
    btn.textContent = 'Processing...'
  } else {
    btn.textContent = btn.dataset.text || btn.textContent
  }
}

function getDropdownValue(dataId: string): string {
  const dropdown = document.querySelector(`.dropdown[data-id="${dataId}"]`) as HTMLElement
  return dropdown?.dataset.value || ''
}

function getSegmentedValue(dataId: string): string {
  const control = document.querySelector(`.segmented-control[data-id="${dataId}"]`) as HTMLElement
  return control?.dataset.value || ''
}

function initSegmentedControls(): void {
  document.querySelectorAll('.segmented-control').forEach((control) => {
    const segments = control.querySelectorAll('.segment')
    segments.forEach((segment) => {
      segment.addEventListener('click', (e) => {
        e.stopPropagation()
        const value = (segment as HTMLElement).dataset.value || ''
        ;(control as HTMLElement).dataset.value = value
        segments.forEach((s) => s.classList.remove('active'))
        segment.classList.add('active')
      })
    })
  })
}

// ============================================================================
// Navigation Functions
// ============================================================================

function switchTab(tabId: string): void {
  currentTab = tabId

  // Update tab buttons
  document.querySelectorAll('.tab-item').forEach((tab) => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId)
  })

  // Update tab content
  document.querySelectorAll('.tab-content').forEach((content) => {
    content.classList.toggle('active', content.id === `tab-${tabId}`)
  })

  // Hide all detail pages
  document.querySelectorAll('.detail-page').forEach((page) => {
    page.classList.remove('active')
  })

  // Show tab bar, hide header
  $('tab-bar').classList.remove('hidden')
  $('header').classList.remove('visible')
  $('content').style.padding = '1rem'
  $('content').style.paddingBottom = '80px'

  currentView = 'tabs'
  currentDetailPage = null
}

function navigateToDetail(featureId: string): void {
  const feature = features.find((f) => f.id === featureId)
  if (!feature) return

  // Check if feature is available
  const availability = featureAvailability[featureId]
  if (availability === FeatureAvailability.UNAVAILABLE) return

  currentView = 'detail'
  currentDetailPage = featureId

  // Hide all tab content
  document.querySelectorAll('.tab-content').forEach((content) => {
    content.classList.remove('active')
  })

  // Show detail page
  const detailPage = $(`page-${featureId}`)
  if (detailPage) {
    detailPage.classList.add('active')
  }

  // Update header
  $('header-title').textContent = feature.name
  $('header').classList.add('visible')

  // Hide tab bar
  $('tab-bar').classList.add('hidden')

  // Adjust content padding
  $('content').style.padding = '0'
  $('content').style.paddingBottom = '0'
}

function navigateBack(): void {
  switchTab(currentTab)
}

// ============================================================================
// Feature List Rendering
// ============================================================================

function renderFeaturesList(): void {
  const container = $('features-list')

  container.innerHTML = features
    .map((feature) => {
      const availability = featureAvailability[feature.id] || FeatureAvailability.UNAVAILABLE
      const isAvailable = availability !== FeatureAvailability.UNAVAILABLE
      const disabledClass = isAvailable ? '' : 'disabled'

      return `
      <div class="list-item ${disabledClass}" data-feature="${feature.id}">
        <div class="list-icon">${feature.icon}</div>
        <div class="list-text">
          <div class="list-title">${feature.name}</div>
          <div class="list-subtitle">${feature.description}</div>
        </div>
        ${
          isAvailable
            ? `
          <div class="list-chevron">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        `
            : `
          <div class="list-lock">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </div>
        `
        }
      </div>
    `
    })
    .join('')

  // Add click handlers
  container.querySelectorAll('.list-item').forEach((item) => {
    item.addEventListener('click', () => {
      const featureId = item.getAttribute('data-feature')
      if (featureId && !item.classList.contains('disabled')) {
        navigateToDetail(featureId)
      }
    })
  })
}

// ============================================================================
// AI Status Banner
// ============================================================================

function updateAIBanner(status: 'checking' | 'available' | 'downloadable' | 'unavailable'): void {
  const icon = $('ai-banner-icon')
  const title = $('ai-banner-title')
  const subtitle = $('ai-banner-subtitle')
  const action = $('ai-banner-action')

  icon.classList.remove('success', 'warning', 'error')
  action.classList.remove('visible')

  switch (status) {
    case 'checking':
      icon.innerHTML =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="#666"/></svg>'
      title.textContent = 'Checking AI Status...'
      subtitle.textContent = 'Please wait'
      break
    case 'available':
      icon.classList.add('success')
      icon.innerHTML =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
      title.textContent = 'Chrome Built-in AI Active'
      subtitle.textContent = 'On-device AI is ready to use'
      break
    case 'downloadable':
      icon.classList.add('warning')
      icon.innerHTML =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'
      title.textContent = 'Model Download Required'
      subtitle.textContent = 'Tap Setup to configure'
      action.classList.add('visible')
      break
    case 'unavailable':
      icon.classList.add('error')
      icon.innerHTML =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>'
      title.textContent = 'Chrome Built-in AI Not Available'
      subtitle.textContent = 'Tap Setup to configure'
      action.classList.add('visible')
      break
  }
}

function goToSettingsSetup(): void {
  switchTab('settings')
  // Open the setup guide automatically
  setTimeout(() => {
    const content = $('setup-content')
    const arrow = $('setup-arrow')
    if (!content.classList.contains('open')) {
      content.classList.add('open')
      arrow.classList.add('open')
    }
  }, 100)
}

// ============================================================================
// Device Info
// ============================================================================

function updateDeviceInfo(): void {
  // Browser info
  const userAgent = navigator.userAgent
  let browser = 'Unknown'
  if (userAgent.includes('Chrome')) {
    const chromeMatch = userAgent.match(/Chrome\/(\d+)/)
    if (chromeMatch?.[1]) {
      browser = `Chrome ${chromeMatch[1]}`
    }
  } else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'

  $('device-browser').textContent = browser
  $('device-platform').textContent = navigator.platform

  // SDK info
  $('device-sdk-version').textContent = '1.0.0'
  $('settings-version').textContent = '1.0.0'
}

declare const LanguageModel: unknown
declare const Summarizer: unknown
declare const Translator: unknown
declare const Rewriter: unknown

function updateAPIStatus(): void {
  const lmStatus = $('device-lm-api')
  const summarizerStatus = $('device-summarizer')
  const translatorStatus = $('device-translator')
  const rewriterStatus = $('device-rewriter')

  const setAPIStatus = (el: HTMLElement, available: boolean) => {
    el.textContent = available ? 'Available' : 'Not Found'
    el.classList.toggle('success', available)
    el.classList.toggle('error', !available)
  }

  setAPIStatus(lmStatus, typeof LanguageModel !== 'undefined')
  setAPIStatus(summarizerStatus, typeof Summarizer !== 'undefined')
  setAPIStatus(translatorStatus, typeof Translator !== 'undefined')
  setAPIStatus(rewriterStatus, typeof Rewriter !== 'undefined')
}

// ============================================================================
// Capabilities Check
// ============================================================================

async function initCapabilities(): Promise<void> {
  updateAIBanner('checking')

  try {
    const capability = await locanara.getDeviceCapability()

    // Store availability for each feature
    let hasAnyAvailable = false
    let hasDownloadable = false

    for (const f of capability.availableFeatures) {
      const featureId = f.feature.toLowerCase().replace('_', '')
      featureAvailability[featureId] = f.availability

      if (f.availability === FeatureAvailability.AVAILABLE) {
        hasAnyAvailable = true
      } else if (f.availability === FeatureAvailability.DOWNLOADABLE) {
        hasDownloadable = true
      }
    }

    // Map DESCRIBE_IMAGE to describeimage
    const describeImageFeature = capability.availableFeatures.find(
      (f) => f.feature === FeatureType.DESCRIBE_IMAGE,
    )
    if (describeImageFeature) {
      featureAvailability.describeimage = describeImageFeature.availability
    }

    // Update banner
    if (hasAnyAvailable) {
      updateAIBanner('available')
      $('device-ai-status').textContent = 'Available'
      $('device-ai-status').classList.add('success')
      $('device-sdk-state').textContent = 'Initialized'
    } else if (hasDownloadable) {
      updateAIBanner('downloadable')
      $('device-ai-status').textContent = 'Download Required'
      $('device-ai-status').classList.add('warning')
      $('device-sdk-state').textContent = 'Ready'
    } else {
      updateAIBanner('unavailable')
      $('device-ai-status').textContent = 'Not Available'
      $('device-ai-status').classList.add('error')
      $('device-sdk-state').textContent = 'Limited'
    }

    // Update feature list
    renderFeaturesList()
  } catch (error) {
    console.error('Failed to get capabilities:', error)
    updateAIBanner('unavailable')
    $('device-ai-status').textContent = 'Error'
    $('device-ai-status').classList.add('error')
    $('device-sdk-state').textContent = 'Error'
    renderFeaturesList()
  }
}

// ============================================================================
// Custom Dropdowns
// ============================================================================

function initDropdowns(): void {
  const dropdowns = document.querySelectorAll('.dropdown')

  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector('.dropdown-toggle')
    const items = dropdown.querySelectorAll('.dropdown-item')

    toggle?.addEventListener('click', (e) => {
      e.stopPropagation()
      dropdowns.forEach((d) => {
        if (d !== dropdown) d.classList.remove('open')
      })
      dropdown.classList.toggle('open')
    })

    items.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation()
        const value = (item as HTMLElement).dataset.value || ''
        const text = item.textContent || ''
        ;(dropdown as HTMLElement).dataset.value = value
        const span = toggle?.querySelector('span')
        if (span) span.textContent = text
        items.forEach((i) => i.classList.remove('selected'))
        item.classList.add('selected')
        dropdown.classList.remove('open')
      })
    })
  })

  document.addEventListener('click', () => {
    dropdowns.forEach((d) => d.classList.remove('open'))
  })
}

// ============================================================================
// Feature Handlers
// ============================================================================

// Summarize — maps iOS-style controls (Input Type + Output Type) to Chrome Summarizer API
const bulletCount: Record<string, number> = {
  ONE_BULLET: 1,
  TWO_BULLETS: 2,
  THREE_BULLETS: 3,
}

function trimToBullets(text: string, count: number): string {
  const lines = text.split('\n')
  const bullets: string[] = []
  for (const line of lines) {
    if (/^\s*[\*\-]\s+/.test(line)) {
      bullets.push(line)
      if (bullets.length >= count) break
    }
  }
  return bullets.length > 0 ? bullets.join('\n') : text
}

$('summarize-btn').addEventListener('click', async () => {
  const input = ($('summarize-input') as HTMLTextAreaElement).value
  const outputType = getSegmentedValue('summarize-output-type')
  const requestedBullets = bulletCount[outputType] ?? 1

  if (!input.trim()) {
    setResult('summarize-result', 'Please enter some text to summarize.', true)
    return
  }

  setLoading('summarize-btn', true)
  $('summarize-stats').style.display = 'none'
  $('summarize-result-title').style.display = 'none'

  try {
    const result = await locanara.summarize(input, {
      type: SummarizeType.KEY_POINTS,
      length: SummarizeLength.LONG,
    })
    const trimmed = trimToBullets(result.summary, requestedBullets)
    setResult('summarize-result', trimmed)
    $('summarize-result-title').style.display = 'block'
    $('summarize-stat-original').textContent = `${result.originalLength} chars`
    $('summarize-stat-summary').textContent = `${trimmed.length} chars`
    $('summarize-stats').style.display = 'flex'
  } catch (error) {
    setResult('summarize-result', `Error: ${(error as Error).message}`, true)
  } finally {
    setLoading('summarize-btn', false)
  }
})

// Classify
$('classify-btn').addEventListener('click', async () => {
  const input = ($('classify-input') as HTMLTextAreaElement).value
  const categoriesInput = ($('classify-categories') as HTMLInputElement).value
  const categories = categoriesInput
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)

  if (!input.trim()) {
    setResult('classify-result', 'Please enter some text to classify.', true)
    return
  }

  if (categories.length < 2) {
    setResult('classify-result', 'Please enter at least 2 categories.', true)
    return
  }

  setLoading('classify-btn', true)

  try {
    const result = await locanara.classify(input, { categories })
    setResult(
      'classify-result',
      `Category: ${result.category}\nConfidence: ${(result.confidence * 100).toFixed(1)}%`,
    )
  } catch (error) {
    setResult('classify-result', `Error: ${(error as Error).message}`, true)
  } finally {
    setLoading('classify-btn', false)
  }
})

// Extract
$('extract-btn').addEventListener('click', async () => {
  const input = ($('extract-input') as HTMLTextAreaElement).value

  if (!input.trim()) {
    setResult('extract-result', 'Please enter some text to extract from.', true)
    return
  }

  setLoading('extract-btn', true)

  try {
    const result = await locanara.extract(input)
    setResult('extract-result', JSON.stringify(result.entities, null, 2))
  } catch (error) {
    setResult('extract-result', `Error: ${(error as Error).message}`, true)
  } finally {
    setLoading('extract-btn', false)
  }
})

// Chat
$('chat-btn').addEventListener('click', async () => {
  const input = ($('chat-input') as HTMLTextAreaElement).value

  if (!input.trim()) {
    setResult('chat-result', 'Please enter a message.', true)
    return
  }

  setLoading('chat-btn', true)
  const resultEl = $('chat-result')
  resultEl.classList.remove('empty', 'error')
  resultEl.textContent = 'Initializing AI model...'

  try {
    let response = ''
    for await (const chunk of locanara.chatStreaming(input)) {
      response += chunk
      resultEl.textContent = response
    }
    if (!response) {
      resultEl.textContent = '(No response)'
    }
  } catch (error) {
    setResult('chat-result', `Error: ${(error as Error).message}`, true)
  } finally {
    setLoading('chat-btn', false)
  }
})

$('chat-reset-btn').addEventListener('click', async () => {
  await locanara.resetChat()
  const resultEl = $('chat-result')
  resultEl.textContent = 'Chat session reset.'
  resultEl.classList.add('empty')
})

// Translate
$('translate-btn').addEventListener('click', async () => {
  const input = ($('translate-input') as HTMLTextAreaElement).value
  const sourceLanguage = getDropdownValue('translate-source')
  const targetLanguage = getDropdownValue('translate-target')

  if (!input.trim()) {
    setResult('translate-result', 'Please enter some text to translate.', true)
    return
  }

  if (sourceLanguage === targetLanguage) {
    setResult('translate-result', 'Source and target languages must be different.', true)
    return
  }

  setLoading('translate-btn', true)

  try {
    const result = await locanara.translate(input, { sourceLanguage, targetLanguage })
    setResult('translate-result', result.translatedText)
  } catch (error) {
    setResult('translate-result', `Error: ${(error as Error).message}`, true)
  } finally {
    setLoading('translate-btn', false)
  }
})

// Rewrite
$('rewrite-btn').addEventListener('click', async () => {
  const input = ($('rewrite-input') as HTMLTextAreaElement).value
  const tone = getSegmentedValue('rewrite-tone') as keyof typeof RewriteTone
  const length = getSegmentedValue('rewrite-length') as keyof typeof RewriteLength

  if (!input.trim()) {
    setResult('rewrite-result', 'Please enter some text to rewrite.', true)
    return
  }

  setLoading('rewrite-btn', true)

  try {
    const result = await locanara.rewrite(input, {
      tone: RewriteTone[tone],
      length: RewriteLength[length],
    })
    setResult('rewrite-result', result.rewrittenText)
  } catch (error) {
    setResult('rewrite-result', `Error: ${(error as Error).message}`, true)
  } finally {
    setLoading('rewrite-btn', false)
  }
})

// Proofread
$('proofread-btn').addEventListener('click', async () => {
  const input = ($('proofread-input') as HTMLTextAreaElement).value

  if (!input.trim()) {
    setResult('proofread-result', 'Please enter some text to proofread.', true)
    return
  }

  setLoading('proofread-btn', true)

  try {
    const result = await locanara.proofread(input)
    setResult('proofread-result', result.correctedText)
  } catch (error) {
    setResult('proofread-result', `Error: ${(error as Error).message}`, true)
  } finally {
    setLoading('proofread-btn', false)
  }
})

// Describe Image
let selectedImageBlob: Blob | null = null

$('image-input').addEventListener('change', (e) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    selectedImageBlob = file
    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = $('image-preview') as HTMLElement
      const img = $('preview-img') as HTMLImageElement
      img.src = e.target?.result as string
      preview.style.display = 'block'
    }
    reader.readAsDataURL(file)
  }
})

$('describeimage-btn').addEventListener('click', async () => {
  if (!selectedImageBlob) {
    setResult('describeimage-result', 'Please select an image first.', true)
    return
  }

  setLoading('describeimage-btn', true)

  try {
    const result = await locanara.describeImage(selectedImageBlob)
    setResult('describeimage-result', result.description)
  } catch (error) {
    setResult('describeimage-result', `Error: ${(error as Error).message}`, true)
  } finally {
    setLoading('describeimage-btn', false)
  }
})

// ============================================================================
// Settings Functions
// ============================================================================

function toggleSetupGuide(): void {
  const content = $('setup-content')
  const arrow = $('setup-arrow')
  const isOpen = content.classList.contains('open')

  content.classList.toggle('open', !isOpen)
  arrow.classList.toggle('open', !isOpen)
}

function copyToClipboard(text: string, element: HTMLElement): void {
  navigator.clipboard.writeText(text).then(() => {
    const originalBg = element.style.background
    element.style.background = '#34C759'
    element.style.color = '#fff'
    const originalText = element.textContent
    element.textContent = 'Copied!'
    setTimeout(() => {
      element.style.background = originalBg
      element.style.color = '#007AFF'
      element.textContent = originalText || ''
    }, 1000)
  })
}

interface WindowWithAI extends Window {
  ai?: {
    languageModel?: unknown
  }
}

declare const LanguageModelForDownload:
  | {
      availability: () => Promise<string>
      create: (options: unknown) => Promise<{ destroy: () => void }>
    }
  | undefined

function getLanguageModelAPI(): {
  api: typeof LanguageModelForDownload | undefined
  source: string
} {
  const win = window as WindowWithAI

  if (typeof LanguageModel !== 'undefined') {
    return { api: LanguageModel as typeof LanguageModelForDownload, source: 'window.LanguageModel' }
  }
  if (win.ai?.languageModel) {
    return {
      api: win.ai.languageModel as typeof LanguageModelForDownload,
      source: 'window.ai.languageModel',
    }
  }

  return { api: undefined, source: '' }
}

async function checkModelStatus(): Promise<void> {
  const btn = document.getElementById('download-model-btn') as HTMLButtonElement | null
  const status = document.getElementById('download-model-status')

  if (!btn || !status) return

  const { api: lmAPI, source: apiSource } = getLanguageModelAPI()

  if (!lmAPI) {
    status.innerHTML =
      '<span style="color: #FF3B30;">LanguageModel API not found. Enable the flags and restart Chrome.</span>'
    return
  }

  status.innerHTML = '<span style="color: #666;">Checking model status...</span>'

  try {
    const availability = await lmAPI.availability()

    if (availability === 'unavailable' || availability === 'no') {
      status.innerHTML =
        '<span style="color: #FF3B30;">Model unavailable. Check hardware requirements.</span>'
      btn.textContent = 'Unavailable'
      btn.disabled = true
      btn.style.opacity = '0.5'
      return
    }

    if (availability === 'available' || availability === 'readily') {
      status.innerHTML = `<span style="color: #34C759;">Model is ready! (${apiSource})</span>`
      btn.textContent = 'Already Available'
      btn.disabled = true
      btn.style.background = '#34C759'
      return
    }

    // Model needs to be downloaded
    status.innerHTML =
      '<span style="color: #FF9500;">Model not downloaded yet. Click button to download.</span>'
    btn.textContent = 'Download Gemini Nano Model'
    btn.disabled = false
    btn.style.background = '#007AFF'
    btn.style.color = '#fff'
  } catch (error) {
    status.innerHTML = `<span style="color: #666;">${apiSource} found. Click to check/download.</span>`
  }
}

async function triggerModelDownload(): Promise<void> {
  const btn = document.getElementById('download-model-btn') as HTMLButtonElement | null
  const status = document.getElementById('download-model-status')

  if (!btn || !status) return

  const { api: lmAPI, source: apiSource } = getLanguageModelAPI()

  if (!lmAPI) {
    status.innerHTML =
      '<span style="color: #FF3B30;">LanguageModel API not found. Enable the flags and restart Chrome.</span>'
    return
  }

  btn.disabled = true
  btn.style.opacity = '0.5'
  btn.textContent = 'Checking...'

  try {
    const availability = await lmAPI.availability()

    if (availability === 'unavailable' || availability === 'no') {
      status.innerHTML =
        '<span style="color: #FF3B30;">Model unavailable. Check hardware requirements.</span>'
      btn.textContent = 'Unavailable'
      return
    }

    if (availability === 'available' || availability === 'readily') {
      status.innerHTML = `<span style="color: #34C759;">Model is ready! (${apiSource})</span>`
      btn.textContent = 'Already Available'
      btn.style.background = '#34C759'
      btn.style.opacity = '1'
      return
    }

    btn.textContent = 'Downloading...'
    status.innerHTML = '<span style="color: #FF9500;">Downloading model (~1-2GB)...</span>'

    const session = await lmAPI.create({
      monitor: (m: EventTarget) => {
        m.addEventListener('downloadprogress', ((
          e: CustomEvent<{ loaded: number; total: number }>,
        ) => {
          const percent = ((e.detail.loaded / e.detail.total) * 100).toFixed(1)
          status.innerHTML = `<span style="color: #007AFF;">Downloading: ${percent}%</span>`
        }) as EventListener)
      },
    })

    session.destroy()
    status.innerHTML = '<span style="color: #34C759;">Download complete! Refresh the page.</span>'
    btn.textContent = 'Download Complete'
    btn.style.background = '#34C759'
    btn.style.opacity = '1'
  } catch (error) {
    status.innerHTML = `<span style="color: #FF3B30;">Error: ${(error as Error).message}</span>`
    btn.textContent = 'Retry Download'
    btn.style.background = '#007AFF'
    btn.style.opacity = '1'
    btn.disabled = false
  }
}
// Expose functions to window
;(window as unknown as Record<string, unknown>).copyToClipboard = copyToClipboard
;(window as unknown as Record<string, unknown>).toggleSetupGuide = toggleSetupGuide
;(window as unknown as Record<string, unknown>).triggerModelDownload = triggerModelDownload
;(window as unknown as Record<string, unknown>).goToSettingsSetup = goToSettingsSetup

// ============================================================================
// Initialization
// ============================================================================

function init(): void {
  // Tab navigation
  document.querySelectorAll('.tab-item').forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab')
      if (tabId) switchTab(tabId)
    })
  })

  // Back button
  $('back-btn').addEventListener('click', navigateBack)

  // Initialize controls
  initDropdowns()
  initSegmentedControls()

  // Load device info
  updateDeviceInfo()
  updateAPIStatus()

  // Check capabilities
  initCapabilities()

  // Check model status automatically
  checkModelStatus()

  // Initial tab
  switchTab('features')
}

init()
