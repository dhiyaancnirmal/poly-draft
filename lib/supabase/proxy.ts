import { NextRequest, NextResponse } from 'next/server'
import { createClient } from './client'

export async function updateSession(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // This will refresh the session if needed
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error updating session:', error)
    }

    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    return response
  } catch (error) {
    console.error('Failed to update session:', error)
    
    // Return response without session update if there's an error
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}