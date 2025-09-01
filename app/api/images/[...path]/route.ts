import { NextRequest } from 'next/server'

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params
    const imagePath = path.join('/')
    
    console.log('Image API called:', imagePath)
    
    // On Vercel, just redirect to static images path - Next.js will serve them
    // If the image doesn't exist, Next.js will return 404
    const imageUrl = `/images/${imagePath}`
    console.log('Redirecting to:', imageUrl)
    
    // Simply redirect to the static image URL - let Next.js handle serving
    return Response.redirect(new URL(imageUrl, request.url))
    
  } catch (error) {
    console.error('Image API error:', error)
    return Response.redirect(new URL('/placeholder.svg', request.url))
  }
}