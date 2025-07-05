import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test environment variables
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    
    res.status(200).json({ 
      message: 'API is working!',
      hasOpenAIKey,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}