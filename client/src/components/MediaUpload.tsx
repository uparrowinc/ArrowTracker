import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Upload, File, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MediaUploadProps {
  onUploadComplete: (url: string, filename: string) => void;
  acceptedTypes: string;
  maxSize: number;
  label: string;
  currentUrl?: string;
}

export function MediaUpload({ onUploadComplete, acceptedTypes, maxSize, label, currentUrl }: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (file.size > maxSize) {
      toast({ 
        title: "File too large", 
        description: `Maximum file size is ${Math.round(maxSize / (1024 * 1024))}MB`,
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('media', file);

    try {
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        const fileUrl = `/api/media/${result.type}/stream?file=${result.filename}`;
        onUploadComplete(fileUrl, result.filename);
        toast({ title: `${label} uploaded successfully!` });
      } else {
        const error = await response.json();
        toast({ 
          title: "Upload failed", 
          description: error.message || "Please try again",
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Upload error", 
        description: "Network error occurred",
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-gray-300">{label}</Label>
      
      {/* Current file display */}
      {currentUrl && (
        <div className="flex items-center gap-2 p-2 bg-gray-800 rounded border border-gray-700">
          <File className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-gray-300 flex-1 truncate">
            {currentUrl.split('file=')[1] || currentUrl}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onUploadComplete('', '')}
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Upload area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          dragOver 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-gray-600 bg-gray-800/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
            
            <div>
              <p className="text-sm text-gray-300 mb-1">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-gray-500">
                Max size: {Math.round(maxSize / (1024 * 1024))}MB
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = acceptedTypes;
                input.onchange = (e) => handleFileSelect(e as any);
                input.click();
              }}
            >
              {isUploading ? 'Uploading...' : 'Choose File'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual URL input */}
      <div>
        <Label className="text-xs text-gray-400">Or enter URL manually:</Label>
        <Input
          value={currentUrl || ""}
          onChange={(e) => onUploadComplete(e.target.value, '')}
          placeholder="https://example.com/audio.mp3 or /api/media/audio/stream?file=filename.mp3"
          className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 mt-1"
        />
      </div>
    </div>
  );
}