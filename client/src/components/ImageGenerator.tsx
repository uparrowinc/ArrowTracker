import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string, imageType: string) => void;
  blogTitle?: string;
  blogCategory?: string;
  blogAuthor?: string;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  onImageGenerated
}) => {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageType, setImageType] = useState<string>('');
  const { toast } = useToast();

  // AI image state
  const [aiForm, setAiForm] = useState({
    prompt: '',
    size: '1024x1024' as '1024x1024' | '1792x1024' | '1024x1792',
    quality: 'standard' as 'standard' | 'hd',
    style: 'natural' as 'natural' | 'vivid'
  });

  const generateImage = async (endpoint: string, payload: any, type: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/images/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let imageUrl: string;
      
      if (contentType?.includes('application/json')) {
        // New format: JSON with URL
        const data = await response.json();
        imageUrl = data.url;
      } else {
        // Legacy format: binary image data
        const blob = await response.blob();
        imageUrl = URL.createObjectURL(blob);
      }
      
      setGeneratedImage(imageUrl);
      setImageType(type);
      
      if (onImageGenerated) {
        onImageGenerated(imageUrl, type);
      }

      toast({
        title: "Image Generated Successfully",
        description: `Your ${type} image is ready to use.`
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `generated-${imageType}-${Date.now()}.png`;
      link.click();
    }
  };

  const copyImageUrl = async () => {
    if (generatedImage) {
      try {
        await navigator.clipboard.writeText(generatedImage);
        toast({
          title: "URL Copied",
          description: "Image URL copied to clipboard."
        });
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy URL to clipboard.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Card className="w-full bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          🎨 AI Image Generator
          <Badge variant="secondary">DALL-E Powered</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-white">Describe Your Image</Label>
          <Textarea
            value={aiForm.prompt}
            onChange={(e) => setAiForm({...aiForm, prompt: e.target.value})}
            placeholder="e.g., A majestic white horse running on a sandy beach next to crystal clear water in summer..."
            className="bg-gray-800 text-white border-gray-600 min-h-[100px]"
            rows={4}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-white">Size</Label>
            <Select value={aiForm.size} onValueChange={(value: any) => setAiForm({...aiForm, size: value})}>
              <SelectTrigger className="bg-gray-800 text-white border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                <SelectItem value="1792x1024">Landscape (1792x1024)</SelectItem>
                <SelectItem value="1024x1792">Portrait (1024x1792)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-white">Quality</Label>
            <Select value={aiForm.quality} onValueChange={(value: any) => setAiForm({...aiForm, quality: value})}>
              <SelectTrigger className="bg-gray-800 text-white border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="hd">HD (Higher Cost)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label className="text-white">Style</Label>
          <Select value={aiForm.style} onValueChange={(value: any) => setAiForm({...aiForm, style: value})}>
            <SelectTrigger className="bg-gray-800 text-white border-gray-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="natural">Natural (More realistic)</SelectItem>
              <SelectItem value="vivid">Vivid (More dramatic)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          onClick={() => generateImage('ai-image', aiForm, 'ai-generated')}
          disabled={loading || !aiForm.prompt.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Generate AI Image
        </Button>

        {generatedImage && (
          <Card className="mt-6 bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Generated Image Preview
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyImageUrl}
                    className="text-white border-gray-600 hover:bg-gray-700"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy URL
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadImage}
                    className="text-white border-gray-600 hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="max-w-full max-h-96 rounded-lg border border-gray-600"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};