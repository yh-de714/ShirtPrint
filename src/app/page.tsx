"use client";

import { useState, useRef, useEffect } from 'react'

import TShirtMockup from '@/components/TShirtMockup'
import type { TShirtMockupRef } from '@/components/TShirtMockup'

import Right from "@/components/Right";
import Header from "@/components/Header";
import { ToastContainer } from 'react-toastify';
import { toast } from 'react-toastify';
const getScaledPrintableArea = (containerWidth: number) => {
  const baseWidth = 500;
  const scale = containerWidth / baseWidth;

  return {
    front: {
      top: 120 * scale,
      left: 150 * scale,
      width: 200 * scale,
      height: 220 * scale,
    }
  };
};

function TopPage() {
  // Separate state for front and back designs
  const [frontImages, setFrontImages] = useState<Array<{
    id: string;
    url: string;
    size: number;
    rotation: number;
    x: number;
    y: number;
    blob: Blob;
  }>>([]);
  const [backImages, setBackImages] = useState<Array<{
    id: string;
    url: string;
    size: number;
    rotation: number;
    x: number;
    y: number;
    blob: Blob;
  }>>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const [frontTexts, setFrontTexts] = useState<Array<{
    id: string;
    text: string;
    fontSize: number;
    color: string;
    font?: string;
    x?: number;
    y?: number;
    rotation?: number;
  }>>([]);
  const [backTexts, setBackTexts] = useState<Array<{
    id: string;
    text: string;
    fontSize: number;
    color: string;
    font?: string;
    x?: number;
    y?: number;
    rotation?: number;
  }>>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  // Track which view is currently being edited
  const [activeView, setActiveView] = useState<'front' | 'back'>('front');
  const canvasRef = useRef<TShirtMockupRef>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  // Add a ref for the text input
  const textInputRef = useRef<HTMLInputElement>(null);

  // Add a handler for text double-click
  const handleTextDoubleClick = (id: string, view: 'front' | 'back') => {
    setSelectedTextId(id);
    setSelectedImageId(null);
    setActiveView(view);

    // Set active tab to 'text' in the Right component
    if (rightComponentRef.current) {
      rightComponentRef.current.setActiveTab('text');
    }

    // Focus the text input with a longer delay for mobile
    setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.focus();

        // On mobile, we may need to scroll to the input
        textInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Some mobile browsers require this additional step
        setTimeout(() => {
          if (textInputRef.current) {
            textInputRef.current.focus();
          }
        }, 300);
      }
    }, 100);
  };

  // Add a ref for the Right component
  const rightComponentRef = useRef<{ setActiveTab: (tab: string) => void }>(null);

  // Handle clicks outside of canvas and right panel to deselect elements
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Skip if clicking on the canvas or right panel
      if (
        (canvasContainerRef.current && canvasContainerRef.current.contains(event.target as Node)) ||
        (rightPanelRef.current && rightPanelRef.current.contains(event.target as Node))
      ) {
        return;
      }

      // Deselect all elements
      setSelectedImageId(null);
      setSelectedTextId(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const createImage = () => {
    return document.createElement('img');
  };

  const handleImageUpload = (file: File, view: 'front' | 'back') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const containerWidth = canvasRef.current?.getContainerWidth() || 500;
        const printableArea = getScaledPrintableArea(containerWidth).front;

        // Calculate the ratio to fit within printable area
        const widthRatio = printableArea.width / img.width;
        const heightRatio = printableArea.height / img.height;
        const fitRatio = Math.min(widthRatio, heightRatio);
        const initialSize = fitRatio < 1 ? fitRatio * 100 : 100;

        const newImage = {
          id: `img-${Date.now()}`,
          url: e.target?.result as string,
          size: initialSize,
          rotation: 0,
          x: printableArea.left + printableArea.width / 2,
          y: printableArea.top + printableArea.height / 2,
          blob: file // Store the original file instead of creating a new blob
        };

        if (view === 'front') {
          setFrontImages(prev => [...prev, newImage]);
        } else {
          setBackImages(prev => [...prev, newImage]);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (id: string, view: 'front' | 'back') => {
    setSelectedImageId(id);
    setSelectedTextId(null);
    setActiveView(view);
  };

  const handleImageUpdate = (id: string, updates: Partial<{ size: number; rotation: number; x: number; y: number }>, view: 'front' | 'back') => {
    if (view === 'front') {
      setFrontImages(prev =>
        prev.map(img => img.id === id ? { ...img, ...updates } : img)
      );
    } else {
      setBackImages(prev =>
        prev.map(img => img.id === id ? { ...img, ...updates } : img)
      );
    }
  };

  const handleImageDelete = (id: string) => {
    setFrontImages(prev => prev.filter(img => img.id !== id));
    setBackImages(prev => prev.filter(img => img.id !== id));
    if (selectedImageId === id) {
      setSelectedImageId(null);
    }
  };

  const handleTextAdd = (text: string, fontSize: number, color: string, font: string = 'Arial') => {
    const containerWidth = canvasRef.current?.getContainerWidth() || 500;
    const printableArea = getScaledPrintableArea(containerWidth).front;

    const newText = {
      id: Date.now().toString() + Math.random(),
      text,
      fontSize,
      color,
      font,
      x: printableArea.left + printableArea.width / 2,
      y: printableArea.top + printableArea.height / 2,
      rotation: 0
    };

    // Add text to the active view
    if (activeView === 'front') {
      setFrontTexts(prev => [...prev, newText]);
    } else {
      setBackTexts(prev => [...prev, newText]);
    }

    setSelectedTextId(newText.id);
    setSelectedImageId(null);
  };

  const handleTextSelect = (id: string, view: 'front' | 'back') => {
    setSelectedTextId(id);
    setSelectedImageId(null);
    setActiveView(view);
  };

  const handleTextUpdate = (
    id: string,
    updates: Partial<{
      x: number;
      y: number;
      fontSize: number;
      rotation: number;
      text: string;
      color: string;
    }>,
    view: 'front' | 'back'
  ) => {
    if (view === 'front') {
      setFrontTexts(prev =>
        prev.map(text => text.id === id ? { ...text, ...updates } : text)
      );
    } else {
      setBackTexts(prev =>
        prev.map(text => text.id === id ? { ...text, ...updates } : text)
      );
    }
  };

  // const handleTextPositionUpdate = (id: string, updates: Partial<{ x: number; y: number; fontSize: number; rotation: number }>) => {
  //   setFrontTexts(prev => prev.map(item =>
  //     item.id === id ? { ...item, ...updates } : item
  //   ));
  //   setBackTexts(prev => prev.map(item =>
  //     item.id === id ? { ...item, ...updates } : item
  //   ));
  // };

  const handleTextDelete = (id: string) => {
    setFrontTexts(prev => prev.filter(item => item.id !== id));
    setBackTexts(prev => prev.filter(item => item.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  };

  // Update the selected text getter to use the active view
  const selectedText = activeView === 'front'
    ? frontTexts.find(text => text.id === selectedTextId)
    : backTexts.find(text => text.id === selectedTextId) || null;

  const handleAlignmentChange = (alignment: { horizontal?: 'left' | 'center' | 'right', vertical?: 'top' | 'middle' | 'bottom' }) => {
    if (!selectedImageId) return;

    const selectedImage = activeView === 'front'
      ? frontImages.find(img => img.id === selectedImageId)
      : backImages.find(img => img.id === selectedImageId);

    if (!selectedImage) return;

    const containerWidth = canvasRef.current?.getContainerWidth() || 500;
    const printableArea = getScaledPrintableArea(containerWidth).front;
    const img = createImage();
    img.src = selectedImage.url;

    let newX = selectedImage.x;
    let newY = selectedImage.y;

    // Horizontal alignment with adjusted printable area
    if (alignment.horizontal === 'left') {
      newX = printableArea.left + (img.width * selectedImage.size / 100) / 2;
    } else if (alignment.horizontal === 'center') {
      newX = printableArea.left + printableArea.width / 2;
    } else if (alignment.horizontal === 'right') {
      newX = printableArea.left + printableArea.width - (img.width * selectedImage.size / 100) / 2;
    }

    // Vertical alignment remains the same
    if (alignment.vertical === 'top') {
      newY = printableArea.top + (img.height * selectedImage.size / 100) / 2;
    } else if (alignment.vertical === 'middle') {
      newY = printableArea.top + printableArea.height / 2;
    } else if (alignment.vertical === 'bottom') {
      newY = printableArea.top + printableArea.height - (img.height * selectedImage.size / 100) / 2;
    }

    handleImageUpdate(selectedImage.id, { x: newX, y: newY }, activeView);
  };

  const handlePositionPreset = (preset: 'center' | 'pocket' | 'full-front') => {
    if (!selectedImageId) return;

    const containerWidth = canvasRef.current?.getContainerWidth() || 500;
    const printableArea = getScaledPrintableArea(containerWidth).front;

    // Get the selected image from the active view
    const selectedImage = activeView === 'front'
      ? frontImages.find(img => img.id === selectedImageId)
      : backImages.find(img => img.id === selectedImageId);

    if (!selectedImage) return;

    if (preset === 'center') {
      handleImageUpdate(selectedImageId, {
        x: printableArea.left + printableArea.width / 2,
        y: printableArea.top + printableArea.height / 2
      }, activeView); // Use activeView instead of hardcoded 'front'
    } else if (preset === 'pocket') {
      const img = createImage();
      img.src = selectedImage.url;

      // Calculate the ratio for pocket size (1/3 of original)
      const widthRatio = printableArea.width / img.width;
      const heightRatio = printableArea.height / img.height;
      const coverRatio = Math.min(widthRatio, heightRatio);
      const newSize = coverRatio * 100 / 3; // Make it 1/3 of the full size

      handleImageUpdate(selectedImage.id, {
        x: printableArea.left + printableArea.width * 0.75,
        y: printableArea.top + printableArea.height * 0.25,
        size: newSize
      }, activeView); // Use activeView instead of hardcoded 'front'
    } else if (preset === 'full-front') {
      const img = createImage();
      img.src = selectedImage.url;

      // Calculate the ratio to cover the printable area
      const widthRatio = printableArea.width / img.width;
      const heightRatio = printableArea.height / img.height;
      const coverRatio = Math.min(widthRatio, heightRatio);
      const newSize = coverRatio * 100;

      handleImageUpdate(selectedImage.id, {
        x: printableArea.left + printableArea.width / 2,
        y: printableArea.top + printableArea.height / 2,
        size: newSize
      }, activeView); // Use activeView instead of hardcoded 'front'
    }
  };

  const handleDeselect = () => {
    setSelectedImageId(null);
    setSelectedTextId(null);
  };

  // First, update the Right component props interface to match the new view-aware handlers
  const handleImageUploadFromRight = (file: File) => {
    // Always upload to the active view
    handleImageUpload(file, activeView);
  };

  const handleImageUpdateFromRight = (id: string, updates: Partial<{ size: number; rotation: number; x: number; y: number }>) => {
    // Always update in the active view
    handleImageUpdate(id, updates, activeView);
  };

  // Create a wrapper for text updates from the Right component
  const handleTextUpdateFromRight = (updates: Partial<{ text: string; fontSize: number; color: string; font: string }>) => {
    if (selectedTextId) {
      // Always update in the active view
      handleTextUpdate(selectedTextId, updates, activeView);
    }
  };

  const handleViewChange = (view: 'front' | 'back') => {
    setActiveView(view);
  };

  const handleBgRemove = async () => {
    const selectedImage = activeView === 'front'
      ? frontImages.find(img => img.id === selectedImageId)
      : backImages.find(img => img.id === selectedImageId);

    if (!selectedImage) return;

    try {
      // Create a FormData object
      const formData = new FormData();
      formData.append("size", "auto");

      // Use the original file
      formData.append("image_file", selectedImage.blob);

      // Add loading state
      const loadingId = toast.loading("Removing background...");

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': import.meta.env.VITE_BACKGROUND_REMOVE_API_KEY
        },
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();

        // Create a new File from the blob
        const newFile = new File([blob], "removed-bg.png", { type: "image/png" });

        // Create a data URL from the blob to display in the canvas
        const reader = new FileReader();
        reader.onload = (e) => {
          // Update the existing image instead of creating a new one
          const updatedImage = {
            ...selectedImage,
            url: e.target?.result as string,
            blob: newFile
          };

          // Update the image in the appropriate array
          if (activeView === 'front') {
            setFrontImages(prev =>
              prev.map(img => img.id === selectedImage.id ? updatedImage : img)
            );
          } else {
            setBackImages(prev =>
              prev.map(img => img.id === selectedImage.id ? updatedImage : img)
            );
          }

          // Show success message
          toast.update(loadingId, {
            render: "Background removed successfully!",
            type: "success",
            isLoading: false,
            autoClose: 3000
          });
        };

        reader.readAsDataURL(blob);
      } else {
        const errorData = await response.json();
        console.error("Background removal failed:", errorData);
        toast.update(loadingId, {
          render: `Failed to remove background: ${errorData.errors?.[0]?.title || 'Unknown error'}`,
          type: "error",
          isLoading: false,
          autoClose: 5000
        });
      }
    } catch (error) {
      console.error("Error in background removal:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Add this function to handle text alignment with proper width calculation
  const handleTextAlignmentChange = (alignment: { horizontal?: 'left' | 'center' | 'right', vertical?: 'top' | 'middle' | 'bottom' }) => {
    if (!selectedTextId) return;

    const selectedText = activeView === 'front'
      ? frontTexts.find(text => text.id === selectedTextId)
      : backTexts.find(text => text.id === selectedTextId);

    if (!selectedText) return;

    const containerWidth = canvasRef.current?.getContainerWidth() || 500;
    const printableArea = getScaledPrintableArea(containerWidth).front;

    let newX = selectedText.x || printableArea.left + printableArea.width / 2;
    let newY = selectedText.y || printableArea.top + printableArea.height / 2;

    // Create a temporary canvas to measure text width
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Set the font to match the text's font
      const fontFamily = selectedText.font || 'Arial';
      const fontSize = selectedText.fontSize;
      ctx.font = `${fontSize}px ${fontFamily}`;

      // Measure the text width
      const textWidth = ctx.measureText(selectedText.text).width;

      // Horizontal alignment with proper text width
      if (alignment.horizontal === 'left') {
        newX = printableArea.left + (textWidth / 2);
      } else if (alignment.horizontal === 'center') {
        newX = printableArea.left + printableArea.width / 2;
      } else if (alignment.horizontal === 'right') {
        newX = printableArea.left + printableArea.width - (textWidth / 2);
      }
    }

    // Vertical alignment
    if (alignment.vertical === 'top') {
      newY = printableArea.top + (selectedText.fontSize / 2);
    } else if (alignment.vertical === 'middle') {
      newY = printableArea.top + printableArea.height / 2;
    } else if (alignment.vertical === 'bottom') {
      newY = printableArea.top + printableArea.height - (selectedText.fontSize / 2);
    }

    handleTextUpdate(selectedText.id, { x: newX, y: newY }, activeView);
  };

  // Update the handleExportDesign function to take a specific view
  const handleExportDesign = async (viewToExport: 'front' | 'back') => {
    if (!canvasRef.current) return;
    setSelectedTextId(null);
    setSelectedImageId(null);
    setExporting(true);
    try {
      // Show loading state
      const loadingId = toast.loading(`Preparing your ${viewToExport} design...`);

      // Save current view to restore it later
      const currentViewBackup = activeView;

      // Switch to the view we want to export if it's different
      if (viewToExport !== activeView) {
        setActiveView(viewToExport);
        // Need to wait for the view to update
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Force a re-render of the canvas for the current view
      if (canvasRef.current) {
        canvasRef.current.refreshView(viewToExport);
        // Wait for the canvas to update
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Get the canvas element from the stage
      const canvas = canvasRef.current.getStageCanvas();

      if (!canvas) {
        toast.update(loadingId, {
          render: `Could not generate ${viewToExport} design image`,
          type: "error",
          isLoading: false,
          autoClose: 3000
        });
        return;
      }

      try {
        // Convert the canvas to a blob and upload
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/png');
        });

        if (!blob) {
          toast.update(loadingId, {
            render: `Failed to create ${viewToExport} image`,
            type: "error",
            isLoading: false,
            autoClose: 3000
          });
          return;
        }

        // Create a File object from the blob
        const file = new File([blob], `tshirt-${viewToExport}.png`, { type: "image/png" });

        // Create FormData for Uploadcare
        const formData = new FormData();
        formData.append('UPLOADCARE_PUB_KEY', import.meta.env.VITE_UPSCALE_PUBLIC_KEY);
        formData.append('file', file);

        // Upload to Uploadcare
        const response = await fetch('https://upload.uploadcare.com/base/', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.file) {
          const imageUrl = `https://ucarecdn.com/${data.file}/`;
          const post = await fetch('http://emmano.pl/products/biala-koszulka-13957/context', {
            method: 'POST',
            body: JSON.stringify({ "name": "Logo duże", "color": "", "attributes": { "Dodaj plik": data.file }, "background": "", "all_designs": {} }),
            headers: {
              'Content-Type': 'application/json'
            }
          });
          const postData = await post.json();
          console.log(postData);
          toast.update(loadingId, {
            render: `${viewToExport.charAt(0).toUpperCase() + viewToExport.slice(1)} design uploaded successfully!`,
            type: "success",
            isLoading: false,
            autoClose: 3000
          });

          // Open the image in a new tab
          window.open(imageUrl, '_blank');
        } else {
          throw new Error(`${viewToExport} upload failed`);
        }
      } catch (error) {
        toast.update(loadingId, {
          render: `${viewToExport} upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: "error",
          isLoading: false,
          autoClose: 5000
        });
      } finally {

        setExporting(false);
        // Restore the original view
        if (viewToExport !== currentViewBackup) {
          setActiveView(currentViewBackup);
        }
      }
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <ToastContainer />
      <Header />
      <div className="lg:w-11/12 md:w-full mx-auto py-6 px-0 md:px-6 flex flex-col md:flex-row gap-8 w-screen justify-center">
        <div ref={canvasContainerRef} className="md:w-3/5 w-full">

          <TShirtMockup
            ref={canvasRef}
            printableArea={getScaledPrintableArea(500).front}
            showPrintableArea={true}
            frontImages={frontImages}
            backImages={backImages}
            selectedImageId={selectedImageId}
            onImageSelect={handleImageSelect}
            onImageUpdate={handleImageUpdate}
            frontTexts={frontTexts}
            backTexts={backTexts}
            onTextSelect={handleTextSelect}
            selectedTextId={selectedTextId}
            onTextUpdate={handleTextUpdate}
            onDeselect={handleDeselect}
            onTextDoubleClick={handleTextDoubleClick}
            onImageUpload={handleImageUpload}
            onViewChange={handleViewChange}
            exporting={exporting}
            setSelectedImageId={setSelectedImageId}
            setSelectedTextId={setSelectedTextId}
          />
          <div className="flex justify-center gap-2">
            <button
              onClick={handleBgRemove}
              disabled={!selectedImageId}
              className={`bg-indigo-500 text-white p-2 mt-2 rounded-md ${!selectedImageId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Remove Background
            </button>

            <button
              onClick={() => handleExportDesign('front')}
              className="bg-green-500 text-white p-2 mt-2 rounded-md hover:bg-green-600"
            >
              Export Front
            </button>

            <button
              onClick={() => handleExportDesign('back')}
              className="bg-blue-500 text-white p-2 mt-2 rounded-md hover:bg-blue-600"
            >
              Export Back
            </button>
          </div>
        </div>
        <div ref={rightPanelRef} className="md:w-2/5 w-full">
          <Right
            ref={rightComponentRef}
            textInputRef={textInputRef}
            onImageUpload={handleImageUploadFromRight}
            onTextAdd={handleTextAdd}
            onTextUpdate={handleTextUpdateFromRight}
            onTextDelete={handleTextDelete}
            selectedTextId={selectedTextId}
            selectedText={selectedText}
            onAlignmentChange={handleAlignmentChange}
            onTextAlignmentChange={handleTextAlignmentChange}
            onPositionPreset={handlePositionPreset}
            selectedImageId={selectedImageId}
            selectedImage={activeView === 'front'
              ? frontImages.find(img => img.id === selectedImageId)
              : backImages.find(img => img.id === selectedImageId) || null}
            onImageUpdate={handleImageUpdateFromRight}
            onImageDelete={(id) => handleImageDelete(id)}
            setSelectedTextId={setSelectedTextId}
          />
        </div>
      </div>
    </div>
  )
}

export default TopPage
