export interface VideoAnalysisRequest {
  title: string
  description?: string
  duration: number
}

export interface VideoAnalysisResult {
  suggestedLevel: string
  confidence: number
  reasoning: string
}

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export async function analyzeVideoLevel(
  video: VideoAnalysisRequest
): Promise<VideoAnalysisResult> {
  try {
    const prompt = `Analyze the following English learning video and determine the most appropriate CEFR level (A1, A2, B1, B2, C1, or C2).

Video Title: ${video.title}
Video Description: ${video.description || 'No description provided'}
Duration: ${video.duration} seconds

Based on the title and description, consider:
1. Vocabulary complexity
2. Grammar level
3. Speaking pace and clarity
4. Content difficulty
5. Target audience level

Respond in JSON format:
{
  "suggestedLevel": "A1-C2",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this level was suggested"
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.content[0].text

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const result = JSON.parse(jsonMatch[0])

      // Validate the level
      if (!CEFR_LEVELS.includes(result.suggestedLevel)) {
        result.suggestedLevel = 'B1' // Default to B1 if invalid
      }

      return {
        suggestedLevel: result.suggestedLevel,
        confidence: Math.min(1, Math.max(0, result.confidence || 0.7)),
        reasoning: result.reasoning || 'Analysis completed',
      }
    } catch (parseError) {
      // If JSON parsing fails, try to extract level from text
      const levelMatch = content.match(/A1|A2|B1|B2|C1|C2/i)
      const suggestedLevel = levelMatch
        ? levelMatch[0].toUpperCase()
        : 'B1'

      return {
        suggestedLevel,
        confidence: 0.6,
        reasoning: 'AI analysis completed. Level suggested based on title and description.',
      }
    }
  } catch (error) {
    console.error('AI analysis failed:', error)

    return {
      suggestedLevel: 'B1',
      confidence: 0.5,
      reasoning: 'Analysis unavailable. Please manually select the level.',
    }
  }
}
