#!/usr/bin/env node
/**
 * Sync generated types to platform packages
 *
 * Copies generated Types.kt to the android package
 * Copies generated Types.swift to the apple (iOS) package (if exists)
 */

import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const generatedDir = join(__dirname, '..', 'src', 'generated')

// Platform destinations
const destinations = {
  kotlin: {
    src: join(generatedDir, 'Types.kt'),
    dest: join(
      __dirname,
      '..',
      '..',
      'android',
      'locanara',
      'src',
      'main',
      'kotlin',
      'com',
      'locanara',
      'Types.kt'
    ),
  },
  swift: {
    src: join(generatedDir, 'Types.swift'),
    dest: join(__dirname, '..', '..', 'apple', 'Sources', 'Types.swift'),
  },
  swiftCommunity: {
    src: join(generatedDir, 'Types.swift'),
    dest: join(__dirname, '..', '..', 'apple', 'SourcesCommunity', 'Types.swift'),
  },
}

function sync() {
  console.log('Syncing generated types to platform packages...\n')

  for (const [lang, paths] of Object.entries(destinations)) {
    if (!existsSync(paths.src)) {
      console.log(`[${lang}] Source file not found: ${paths.src}`)
      continue
    }

    // Ensure destination directory exists
    const destDir = dirname(paths.dest)
    if (!existsSync(destDir)) {
      console.log(`[${lang}] Creating directory: ${destDir}`)
      mkdirSync(destDir, { recursive: true })
    }

    try {
      copyFileSync(paths.src, paths.dest)
      console.log(`[${lang}] Synced: ${paths.dest}`)
    } catch (error) {
      console.error(`[${lang}] Failed to sync: ${error.message}`)
    }
  }

  console.log('\nSync complete!')
}

sync()
