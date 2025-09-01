import { NextRequest } from 'next/server'

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params
    const imagePath = path.join('/')
    
    console.log('Image API called:', imagePath)
    
    // Images are directly in public folder, not in images subfolder
    const imageUrl = `/${imagePath}`
    console.log('Redirecting to:', imageUrl)
    
    // Simply redirect to the static image URL - let Next.js handle serving
    return Response.redirect(new URL(imageUrl, request.url))
    
  } catch (error) {
    console.error('Image API error:', error)
    return Response.redirect(new URL('/placeholder.svg', request.url))
  }
}