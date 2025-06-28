import { DetectionResult, CollectibleData, FolderType } from '../types';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class AIDetectionService {
  private static instance: AIDetectionService;
  private apiKey: string | null = null;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

  static getInstance(): AIDetectionService {
    if (!AIDetectionService.instance) {
      AIDetectionService.instance = new AIDetectionService();
    }
    return AIDetectionService.instance;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getDetectionPrompt(folderType?: FolderType): string {
    const basePrompt = `Analyze this image and identify any collectible items. Return a JSON response with the following structure:

{
  "items": [
    {
      "name": "Item name",
      "type": "Specific item type",
      "series": "Series or set name",
      "condition": "mint|near-mint|excellent|good|fair|poor|damaged",
      "description": "Brief description",
      "estimatedValue": 0.00,
      "currency": "USD",
      "tags": ["tag1", "tag2"],
      "confidence": 0.95
    }
  ],
  "overallConfidence": 0.90,
  "detectedText": "Any visible text on the items",
  "notes": "Additional observations"
}

Guidelines:
- Be specific with item names (include character names, card numbers, etc.)
- Estimate condition based on visible wear, scratches, or damage
- Provide realistic market value estimates in USD
- Include relevant tags for categorization
- Confidence should be 0.0-1.0 based on image clarity and certainty
- If multiple items are visible, list each separately`;

    const typeSpecificPrompts = {
      'trading-cards': `
Focus on trading cards. Look for:
- Card name and number
- Set/series information
- Rarity symbols
- Condition indicators (corners, edges, surface)
- Holographic or special features
- Visible damage or wear`,

      'action-figures': `
Focus on action figures and collectible figures. Look for:
- Character name and series
- Manufacturer (Funko, Hasbro, etc.)
- Scale or size
- Packaging condition if in box
- Missing accessories or parts
- Paint wear or defects`,

      'plushies': `
Focus on plush toys and stuffed animals. Look for:
- Character or brand name
- Size and material
- Tags or labels
- Condition of fabric and stuffing
- Missing parts or accessories
- Cleanliness and wear`,

      'comics': `
Focus on comic books and graphic novels. Look for:
- Title and issue number
- Publisher and date
- Cover condition
- Spine condition
- Page quality
- Special editions or variants`,

      'games': `
Focus on video games and board games. Look for:
- Game title and platform
- Publisher and release year
- Condition of case/box
- Completeness (manual, inserts)
- Disc/cartridge condition
- Special or limited editions`
    };

    if (folderType && typeSpecificPrompts[folderType]) {
      return basePrompt + '\n\n' + typeSpecificPrompts[folderType];
    }

    return basePrompt;
  }

  private async convertImageToBase64(imageBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });
  }

  private parseGeminiResponse(responseText: string): any {
    try {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, try to extract information manually
      return this.extractInfoFromText(responseText);
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return this.extractInfoFromText(responseText);
    }
  }

  private extractInfoFromText(text: string): any {
    // Fallback parser for when Gemini doesn't return proper JSON
    const lines = text.split('\n').filter(line => line.trim());
    
    const extractedInfo = {
      items: [{
        name: 'Unknown Item',
        type: 'Collectible',
        series: '',
        condition: 'good' as const,
        description: text.substring(0, 200) + '...',
        estimatedValue: 0,
        currency: 'USD',
        tags: ['ai-detected'],
        confidence: 0.5
      }],
      overallConfidence: 0.5,
      detectedText: '',
      notes: 'AI response could not be parsed as JSON. Manual review recommended.'
    };

    // Try to extract name from common patterns
    const namePatterns = [
      /(?:name|title|item):\s*(.+)/i,
      /^(.+?)(?:\s*-|\s*\(|$)/,
      /this\s+(?:is\s+)?(?:a\s+)?(.+?)(?:\s+card|\s+figure|\s+toy|\.)/i
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extractedInfo.items[0].name = match[1].trim();
        break;
      }
    }

    // Try to extract condition
    const conditionMatch = text.match(/condition:\s*(mint|near-mint|excellent|good|fair|poor|damaged)/i);
    if (conditionMatch) {
      extractedInfo.items[0].condition = conditionMatch[1].toLowerCase() as any;
    }

    // Try to extract value
    const valueMatch = text.match(/(?:value|worth|price):\s*\$?(\d+(?:\.\d{2})?)/i);
    if (valueMatch) {
      extractedInfo.items[0].estimatedValue = parseFloat(valueMatch[1]);
    }

    return extractedInfo;
  }

  async detectItems(
    imageBlob: Blob,
    folderType?: FolderType,
    customPrompt?: string
  ): Promise<DetectionResult> {
    const startTime = Date.now();

    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      console.log('Starting AI detection for image:', imageBlob.size, 'bytes');

      // Convert image to base64
      const base64Image = await this.convertImageToBase64(imageBlob);
      
      // Prepare the request
      const prompt = customPrompt || this.getDetectionPrompt(folderType);
      
      const requestBody = {
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: imageBlob.type,
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      console.log('Sending request to Gemini API...');

      // Make the API request
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const geminiResponse: GeminiResponse = await response.json();
      console.log('Received Gemini response:', geminiResponse);

      if (!geminiResponse.candidates || geminiResponse.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      const responseText = geminiResponse.candidates[0].content.parts[0].text;
      console.log('Gemini response text:', responseText);

      // Parse the response
      const parsedResponse = this.parseGeminiResponse(responseText);
      
      // Convert to our DetectionResult format
      const detectionResult: DetectionResult = {
        items: parsedResponse.items?.map((item: any) => ({
          name: item.name || 'Unknown Item',
          type: item.type,
          series: item.series,
          condition: item.condition || 'good',
          description: item.description,
          estimatedValue: item.estimatedValue,
          currency: item.currency || 'USD',
          tags: Array.isArray(item.tags) ? item.tags : ['ai-detected'],
          aiDetected: true,
          aiConfidence: (item.confidence || parsedResponse.overallConfidence || 0.5) * 100,
          aiPromptUsed: prompt,
          ocrText: parsedResponse.detectedText,
          userId: 'default-user',
          syncStatus: 'local-only' as const,
          isArchived: false,
          additionalImages: [],
          primaryImage: undefined,
          thumbnailImage: undefined
        })) || [],
        confidence: (parsedResponse.overallConfidence || 0.5) * 100,
        processingTime: Date.now() - startTime,
        rawResponse: responseText
      };

      console.log('Final detection result:', detectionResult);
      return detectionResult;

    } catch (error) {
      console.error('AI detection error:', error);
      
      return {
        items: [],
        confidence: 0,
        processingTime: Date.now() - startTime,
        rawResponse: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async detectBatch(
    imageBlobs: Blob[],
    folderType?: FolderType,
    customPrompt?: string
  ): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];
    
    for (let i = 0; i < imageBlobs.length; i++) {
      console.log(`Processing image ${i + 1} of ${imageBlobs.length}`);
      
      try {
        const result = await this.detectItems(imageBlobs[i], folderType, customPrompt);
        results.push(result);
        
        // Add a small delay between requests to avoid rate limiting
        if (i < imageBlobs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error processing image ${i + 1}:`, error);
        results.push({
          items: [],
          confidence: 0,
          processingTime: 0,
          rawResponse: '',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }

  // Generate custom prompts for specific use cases
  generatePrompt(itemType: FolderType, customInstructions?: string): string {
    const basePrompt = this.getDetectionPrompt(itemType);
    
    if (customInstructions) {
      return `${basePrompt}\n\nAdditional instructions: ${customInstructions}`;
    }
    
    return basePrompt;
  }

  // Test the API connection
  async testConnection(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        return false;
      }

      // Create a simple test request
      const testRequest = {
        contents: [{
          parts: [{
            text: "Say 'Hello' if you can understand this message."
          }]
        }]
      };

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testRequest)
      });

      return response.ok;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}