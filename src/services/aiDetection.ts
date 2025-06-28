import { DetectionResult, CollectibleData, FolderType } from '../types';
import { StorageService } from './storage';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectedItemWithBounds extends Partial<CollectibleData> {
  boundingBox?: BoundingBox;
  croppedImage?: string;
}

export class AIDetectionService {
  private static instance: AIDetectionService;
  private apiKey: string | null = null;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
  
  // Default API key from environment variable
  private defaultApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  private maxFreeDetections = parseInt(import.meta.env.VITE_FREE_DETECTION_LIMIT) || 5;

  static getInstance(): AIDetectionService {
    if (!AIDetectionService.instance) {
      AIDetectionService.instance = new AIDetectionService();
    }
    return AIDetectionService.instance;
  }

  constructor() {
    // Initialize with default API key from environment
    this.apiKey = this.defaultApiKey;
    
    if (!this.defaultApiKey) {
      console.warn('VITE_GEMINI_API_KEY not found in environment variables');
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getRemainingFreeDetections(): Promise<number> {
    const storageService = StorageService.getInstance();
    const usedDetections = await storageService.getSetting('used_free_detections') || 0;
    return Math.max(0, this.maxFreeDetections - usedDetections);
  }

  async incrementUsedDetections(): Promise<void> {
    const storageService = StorageService.getInstance();
    const usedDetections = await storageService.getSetting('used_free_detections') || 0;
    await storageService.setSetting('used_free_detections', usedDetections + 1);
  }

  async canUseDetection(): Promise<{ canUse: boolean; remaining: number; isUsingCustomKey: boolean }> {
    const storageService = StorageService.getInstance();
    const customApiKey = await storageService.getSetting('gemini_api_key');
    
    // If user has their own API key, they can use unlimited detections
    if (customApiKey && customApiKey !== this.defaultApiKey) {
      return { canUse: true, remaining: -1, isUsingCustomKey: true };
    }

    // Check free usage limit
    const remaining = await this.getRemainingFreeDetections();
    return { canUse: remaining > 0, remaining, isUsingCustomKey: false };
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

  private async cropImageFromBounds(
    originalImageBlob: Blob,
    boundingBox: BoundingBox,
    padding: number = 0.05
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = () => {
        try {
          const imgWidth = img.naturalWidth;
          const imgHeight = img.naturalHeight;

          // Convert normalized coordinates to pixel coordinates
          const x = Math.max(0, boundingBox.x * imgWidth - (padding * imgWidth));
          const y = Math.max(0, boundingBox.y * imgHeight - (padding * imgHeight));
          const width = Math.min(
            imgWidth - x,
            (boundingBox.width * imgWidth) + (2 * padding * imgWidth)
          );
          const height = Math.min(
            imgHeight - y,
            (boundingBox.height * imgHeight) + (2 * padding * imgHeight)
          );

          // Ensure minimum crop size
          const minSize = 100;
          const finalWidth = Math.max(minSize, width);
          const finalHeight = Math.max(minSize, height);

          // Set canvas size to the crop dimensions
          canvas.width = finalWidth;
          canvas.height = finalHeight;

          // Draw the cropped portion
          ctx.drawImage(
            img,
            x, y, width, height,  // Source rectangle
            0, 0, finalWidth, finalHeight  // Destination rectangle
          );

          // Convert to data URL
          const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          resolve(croppedDataUrl);
        } catch (error) {
          console.error('Error cropping image:', error);
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for cropping'));
      };

      // Load the original image
      const imageUrl = URL.createObjectURL(originalImageBlob);
      img.src = imageUrl;
    });
  }

  private parseGeminiResponse(responseText: string): any {
    try {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and clean the response
        if (parsed.items && Array.isArray(parsed.items)) {
          parsed.items = parsed.items.map((item: any) => {
            // Clean up the item data
            const cleanItem = {
              name: item.name || 'Unknown Item',
              type: item.type || undefined,
              series: item.series || undefined,
              condition: item.condition || 'good',
              description: item.description || undefined,
              estimatedValue: typeof item.estimatedValue === 'number' ? item.estimatedValue : undefined,
              currency: item.currency || 'USD',
              tags: Array.isArray(item.tags) ? item.tags : ['ai-detected'],
              confidence: typeof item.confidence === 'number' ? item.confidence : 0.5
            };

            // Handle bounding box if present and valid
            if (item.boundingBox && typeof item.boundingBox === 'object') {
              const bbox = item.boundingBox;
              if (typeof bbox.x === 'number' && typeof bbox.y === 'number' && 
                  typeof bbox.width === 'number' && typeof bbox.height === 'number') {
                // Ensure bounding box values are valid numbers between 0 and 1
                cleanItem.boundingBox = {
                  x: Math.max(0, Math.min(1, Number(bbox.x) || 0)),
                  y: Math.max(0, Math.min(1, Number(bbox.y) || 0)),
                  width: Math.max(0.01, Math.min(1, Number(bbox.width) || 0.1)),
                  height: Math.max(0.01, Math.min(1, Number(bbox.height) || 0.1))
                };
                
                // Ensure bounding box doesn't exceed image bounds
                if (cleanItem.boundingBox.x + cleanItem.boundingBox.width > 1) {
                  cleanItem.boundingBox.width = 1 - cleanItem.boundingBox.x;
                }
                if (cleanItem.boundingBox.y + cleanItem.boundingBox.height > 1) {
                  cleanItem.boundingBox.height = 1 - cleanItem.boundingBox.y;
                }
              }
            }
            
            return cleanItem;
          });
        } else {
          // If no items array, create a default item
          parsed.items = [{
            name: 'Detected Item',
            type: 'Collectible',
            condition: 'good',
            currency: 'USD',
            tags: ['ai-detected'],
            confidence: 0.5
          }];
        }
        
        return parsed;
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
      // Check if detection is allowed
      const { canUse, remaining, isUsingCustomKey } = await this.canUseDetection();
      
      if (!canUse) {
        throw new Error(`You have used all ${this.maxFreeDetections} free AI detections. Please add your own Gemini API key to continue using AI detection.`);
      }

      if (!this.apiKey) {
        throw new Error('Gemini API key not configured. Please check your environment variables or add a custom API key.');
      }

      console.log('Starting AI detection for image:', imageBlob.size, 'bytes');
      console.log('Using custom API key:', isUsingCustomKey, 'Remaining free detections:', remaining);

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

      // Increment usage counter only if using default API key
      if (!isUsingCustomKey) {
        await this.incrementUsedDetections();
        console.log('Incremented free detection usage. Remaining:', remaining - 1);
      }

      // Parse the response
      const parsedResponse = this.parseGeminiResponse(responseText);
      console.log('Parsed response:', parsedResponse);

      // Process items and create cropped images if bounding boxes are available
      const processedItems: DetectedItemWithBounds[] = [];
      
      if (parsedResponse.items && Array.isArray(parsedResponse.items)) {
        for (let i = 0; i < parsedResponse.items.length; i++) {
          const item = parsedResponse.items[i];
          let croppedImage: string | undefined;

          // Attempt to crop the image if bounding box is available
          if (item.boundingBox) {
            try {
              console.log(`Cropping item ${i + 1} with bounding box:`, item.boundingBox);
              croppedImage = await this.cropImageFromBounds(imageBlob, item.boundingBox);
              console.log(`Successfully cropped item ${i + 1}`);
            } catch (error) {
              console.error(`Failed to crop item ${i + 1}:`, error);
              // Continue without cropped image
            }
          } else {
            console.log(`No bounding box for item ${i + 1}, skipping crop`);
          }

          processedItems.push({
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
            primaryImage: croppedImage, // Use cropped image as primary if available
            thumbnailImage: croppedImage,
            boundingBox: item.boundingBox,
            croppedImage
          });
        }
      }
      
      // Convert to our DetectionResult format
      const detectionResult: DetectionResult = {
        items: processedItems,
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