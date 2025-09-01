import { NextRequest } from 'next/server'
import { existsSync } from 'fs'
import { join } from 'path'

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const imagePath = params.path.join('/')
    const publicImagesDir = join(process.cwd(), 'public', 'images')
    
    console.log('Image API called:', imagePath)
    console.log('Full path:', join(publicImagesDir, imagePath))
    
    // First try the direct path
    const directPath = join(publicImagesDir, imagePath)
    if (existsSync(directPath)) {
      console.log('Direct path found, redirecting')
      return Response.redirect(new URL(`/images/${imagePath}`, request.url))
    }
    
    console.log('Direct path not found, searching...')
    
    // If not found directly, search in subdirectories (optimized)
    const filename = imagePath.split('/').pop()
    if (!filename) {
      return Response.redirect(new URL('/placeholder.svg', request.url))
    }
    
    const fs = require('fs')
    
    // Cache for performance - only search once per filename
    const searchInDir = (dir: string, depth: number = 0): string | null => {
      // Limit recursion depth to prevent timeouts
      if (depth > 3) return null
      
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true })
        
        // First check files in current directory
        for (const item of items) {
          if (!item.isDirectory() && item.name === filename) {
            return join(dir, item.name).replace(publicImagesDir, '').replace(/\\/g, '/')
          }
        }
        
        // Then check subdirectories
        for (const item of items) {
          if (item.isDirectory()) {
            const found = searchInDir(join(dir, item.name), depth + 1)
            if (found) return found
          }
        }
      } catch (error) {
        console.error('Error searching directory:', dir, error)
      }
      return null
    }
    
    const foundPath = searchInDir(publicImagesDir)
    if (foundPath) {
      return Response.redirect(new URL(`/images${foundPath}`, request.url))
    }
    
    // If still not found, return placeholder
    console.log(`Image not found: ${filename}`)
    return Response.redirect(new URL('/placeholder.svg', request.url))
    
  } catch (error) {
    console.error('Image API error:', error)
    return Response.redirect(new URL('/placeholder.svg', request.url))
  }
}