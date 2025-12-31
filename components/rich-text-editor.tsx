'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import 'react-quill/dist/quill.snow.css';
import { uploadProofImages, validateImageFile } from '@/lib/upload-api';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(async () => {
  const r = await import('react-quill');
  return r.default;
}, { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const quillRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);

  const insertOrReplaceHero = (url: string) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    // Remove existing hero image from HTML if any
    let currentContent = quill.root.innerHTML;
    currentContent = currentContent.replace(/<img[^>]*data-hero-image[^>]*>/gi, '');

    // Insert image at the beginning of content with data attribute (will be hidden in editor via CSS)
    const imageHtml = `<img src="${url}" alt="Hero image" data-hero-image="true" />`;
    const newContent = imageHtml + currentContent;
    
    // Update editor content
    quill.clipboard.dangerouslyPasteHTML(newContent);
    onChange(newContent);
    
    setHeroImageUrl(url);
  };

  const removeHeroImage = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      // Remove hero image from HTML
      let currentContent = quill.root.innerHTML;
      currentContent = currentContent.replace(/<img[^>]*data-hero-image[^>]*>/gi, '');
      quill.clipboard.dangerouslyPasteHTML(currentContent);
      onChange(currentContent);
    }
    setHeroImageUrl(null);
  };

  const showImageUploadInfo = useCallback(() => {
    toast.info('Image upload feature will be available soon', {
      duration: 3000,
    });
  }, []);

  const handleFile = async (file: File) => {
    // Image upload is currently disabled
    showImageUploadInfo();
    return;

    // Disabled code below
    // const validation = validateImageFile(file);
    // if (!validation.valid) {
    //   toast.error(validation.error || 'Invalid image file');
    //   return;
    // }
    // try {
    //   const urls = await uploadProofImages([file]);
    //   if (!urls || urls.length === 0) {
    //     toast.error('No image URL returned');
    //     return;
    //   }
    //   insertOrReplaceHero(urls[0]);
    //   toast.success('Image uploaded');
    // } catch (error: any) {
    //   toast.error(error?.message || 'Failed to upload image');
    // }
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          [{ color: [] }, { background: [] }],
          ['clean'],
        ],
        handlers: {
          image: () => {
            // Image upload is currently disabled
            showImageUploadInfo();
          },
        },
      },
      clipboard: {
        matchers: [],
      },
    }),
    [showImageUploadInfo]
  );

  const formats = useMemo(
    () => [
      'header',
      'bold',
      'italic',
      'underline',
      'strike',
      'list',
      'bullet',
      'align',
      'blockquote',
      'code-block',
      'link',
      'image',
      'color',
      'background',
    ],
    []
  );

  useEffect(() => {
    const quill = quillRef.current?.getEditor?.();
    if (!quill) return;

    const handleDrop = async (e: DragEvent) => {
      const file = e.dataTransfer?.files?.[0];
      if (!file || !file.type.startsWith('image/')) return;
      e.preventDefault();
      // Image upload is currently disabled
      showImageUploadInfo();
    };

    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData?.items) return;
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith('image/'));
      if (!imageItem) return;
      e.preventDefault();
      // Image upload is currently disabled
      showImageUploadInfo();
    };

    quill.root.addEventListener('drop', handleDrop);
    quill.root.addEventListener('paste', handlePaste);
    return () => {
      quill.root.removeEventListener('drop', handleDrop);
      quill.root.removeEventListener('paste', handlePaste);
    };
  }, [showImageUploadInfo]);

  // Sync hero preview with existing content (e.g., when loading for edit)
  useEffect(() => {
    if (!value) {
      setHeroImageUrl(null);
      return;
    }
    // Look for hero image (with data-hero-image attribute) or any first image
    const heroMatch = value.match(/<img[^>]*data-hero-image[^>]*src=["']([^"']+)["'][^>]*>/i);
    const regularMatch = value.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    const foundUrl = heroMatch?.[1] || regularMatch?.[1] || null;
    if (foundUrl !== heroImageUrl) {
      setHeroImageUrl(foundUrl);
    }
  }, [value, heroImageUrl]);

  // Inject styles to hide hero images in Quill editor (they're shown in the preview section instead)
  useEffect(() => {
    const styleId = 'quill-image-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .ql-editor img[data-hero-image="true"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          await handleFile(file);
          e.target.value = '';
        }}
      />

      {heroImageUrl ? (
        // Show image preview when image is uploaded
        <div className="mb-3 rounded border border-gray-300 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Hero image (optional, max 1)</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-sm text-red-600 hover:text-red-700 hover:underline"
                onClick={removeHeroImage}
              >
                Remove
              </button>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                onClick={showImageUploadInfo}
              >
                Replace
              </button>
            </div>
          </div>
          <div className="w-full rounded border border-gray-200 bg-gray-50 overflow-hidden">
            <img
              src={heroImageUrl}
              alt="Hero"
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>
          <div className="mt-2 text-xs text-gray-500 truncate">
            {heroImageUrl}
          </div>
        </div>
      ) : (
        // Show attachment bar when no image
        <div className="mb-3 flex items-center justify-between rounded border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          <span className="font-medium">Hero image (optional, max 1)</span>
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            onClick={showImageUploadInfo}
          >
            Attach Image
          </button>
        </div>
      )}

      <ReactQuill
        // @ts-ignore react-quill typings don't expose ref prop correctly
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'Write your content here...'}
        className="bg-white"
        style={{
          minHeight: '300px',
        }}
      />
    </div>
  );
}

